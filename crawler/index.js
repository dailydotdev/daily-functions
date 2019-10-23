const got = require('got');
const metascraper = require('metascraper').load([
  require('metascraper-date')(),
  require('metascraper-url')(),
  require('./rules')(),
]);
const PubSub = require(`@google-cloud/pubsub`);
const pubsub = new PubSub();
const duplicateTags = require('./duplicate_tags');
const ignoredTags = require('./ignored_tags');
const pubTags = require('./pub_tags');

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
    .then(({ body: html, url }) => metascraper({ html, url }))
    .then(res => Object.assign({}, res, {
      readTime: res.readTime ? res.readTime.duration : null,
      paid: res.paid === 'true',
    }));

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

const getIfTrue = (cond, key, value) => cond ? { [key]: value } : {};

const processTags = (data) => {
  if (data.tags && data.tags.length) {
    return Object.assign({}, data, {
      tags: Array.from(new Set(data.tags.map(t => {
        const newT = t.toLowerCase().trim().replace(/ /g, '-');
        if (duplicateTags[newT]) {
          return duplicateTags[newT];
        }
        return newT;
      }).filter(t => t.length > 0 && ignoredTags.indexOf(t) < 0 && t.indexOf('&') < 0))),
    });
  }
  if (pubTags[data.publicationId]) {
    return Object.assign({}, data, { tags: pubTags[data.publicationId] });
  }

  return data;
};

exports.crawler = (event) => {
  const pubsubMessage = event;
  const data = JSON.parse(Buffer.from(pubsubMessage.data, 'base64').toString());

  console.log(`[${data.id}] scraping ${data.url} to enrich`, data);

  return extractMetaTags(data.url)
    .then(convertTagsToSchema)
    .then(tags => Object.assign({}, data, tags, getIfTrue(data.title && data.title.length < 255, 'title', data.title), getIfTrue(data.tags && data.tags.length > 0, 'tags', data.tags)))
    .catch((err) => {
      if (err.statusCode === 404) {
        console.info(`[${data.id}] post doesn't exist anymore ${data.url}`);
        return null;
      }

      console.warn(`[${data.id}] failed to scrape ${data.url}`, err);
      return data;
    })
    .then(processTags)
    .then((item) => {
      if (!item) {
        return Promise.resolve();
      }

      if (item.paid) {
        console.log(`[${data.id}] paid content is ignored`, item);
        return Promise.resolve();
      }

      return createOrGetTopic()
        .then((topic) => {
          console.log(`[${data.id}] crawled post`, item);
          return topic.publisher().publish(Buffer.from(JSON.stringify(item)));
        });
    });
};

// extractMetaTags('https://serverless.email/issues/122')
//   .then(convertTagsToSchema)
//   .then(data => processTags({...data, publicationId: 'servlsst'}))
//   .then(console.log)
//   .catch(console.error);
