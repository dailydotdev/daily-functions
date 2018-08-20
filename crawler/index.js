const got = require('got');
const metascraper = require('metascraper').load([
  require('metascraper-date')(),
  require('metascraper-title')(),
  require('metascraper-url')(),
  require('./rules')(),
]);
const PubSub = require(`@google-cloud/pubsub`);
const pubsub = new PubSub();

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
  got(url)
    .then(({ body: html, url }) => metascraper({ html, url }));

const convertTagsToSchema = (tags) => {
  const obj = Object.assign({}, tags);
  if (obj.date) {
    obj.publishedAt = new Date(obj.date);
  }
  delete obj.date;
  if (obj.modified) {
    obj.updatedAt = new Date(obj.modified);
  }
  delete obj.modified;
  if (obj.keywords) {
    obj.tags = obj.keywords;
  }
  delete obj.keywords;
  return obj;
};

exports.crawler = (event) => {
  const pubsubMessage = event;
  const data = JSON.parse(Buffer.from(pubsubMessage.data, 'base64').toString());

  console.log(`[${data.id}] scraping ${data.url} to enrich`, data);

  return extractMetaTags(data.url)
    .then(convertTagsToSchema)
    .then(tags => Object.assign({}, data, tags, data.title ? { title: data.title } : {}, data.tags ? { tags: data.tags } : {}))
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

// extractMetaTags('https://www.codementor.io/caseymorris/functional-js-with-es6-recursive-patterns-m2pv4j98d')
//   .then(convertTagsToSchema)
//   .then(console.log);
