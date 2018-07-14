const cheerio = require('cheerio');
const request = require('request-promise-native');
const PubSub = require(`@google-cloud/pubsub`);
const pubsub = new PubSub();

const rules = [
  require('metascraper-date')(),
  require('metascraper-title')(),
  require('metascraper-url')(),
  require('./rules')(),
];

const createOrGetTopic = () => {
  const topicName = 'crawled-post';
  return pubsub.createTopic(topicName)
    .then((results) => {
      const topic = results[0];
      console.log(`topic ${topic.name} created`);
      return topic;
    })
    .catch((err) => {
      if (err.code === 6) {
        return pubsub.topic(topicName);
      } else {
        console.error('failed to create topic', err);
      }
    });
};

const extractMetaTags = (url) =>
  request(url)
    .then((html) => {
      const htmlDom = cheerio.load(html);
      return rules.reduce((acc, rule) => {
        const newRes = Object.keys(rule).reduce((acc2, key) => {
          for (let i = 0; i < rule[key].length; i++) {
            const res = rule[key][i]({ htmlDom, url });
            if (res) {
              return Object.assign({}, acc2, { [key]: res });
            }
          }

          return acc2;
        }, {});
        return Object.assign({}, acc, newRes);
      }, {});
    });

const convertTagsToSchema = (tags) => {
  const obj = Object.assign({}, tags);
  if (obj.date) {
    obj.publishedAt = new Date(obj.date);
    delete obj.date;
  }
  if (obj.modified) {
    obj.updatedAt = new Date(obj.modified);
    delete obj.modified;
  }
  return obj;
};

exports.crawler = (event) => {
  const pubsubMessage = event.data;
  const data = JSON.parse(Buffer.from(pubsubMessage.data, 'base64').toString());

  console.log(`[${data.id}] scraping ${data.url} to enrich`, data);

  return extractMetaTags(data.url)
    .then(convertTagsToSchema)
    .then(tags => Object.assign({}, data, tags, data.title ? { title: data.title } : {}))
    .catch((err) => {
      console.error(`[${data.id}] failed to scrape ${data.url}`, err);
      return data;
    })
    .then((item) =>
      createOrGetTopic()
        .then((topic) => {
          console.log(`[${data.id}] crawled post`, item);
          return topic.publisher().publish(Buffer.from(JSON.stringify(item)));
        })
    );
};
