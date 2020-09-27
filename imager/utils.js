const crypto = require('crypto');
const PubSub = require(`@google-cloud/pubsub`);
const pubsub = new PubSub();
const topic = pubsub.topic('crawled-post');
// const topic = pubsub.topic('ad-image-processed');

const num = '3';
const link = `https://store.daily.dev/`;
const description = 'Busy developer? Make sure others know it. Shop now on the swag store 🦸‍';
const company = 'daily.dev';
const source = `Swag`;
const image = 'https://storage.googleapis.com/devkit-assets/ads/Placeholder%20-%20Swag%20Store.jpg';
const start = new Date('08/12/20Z');
// const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
const end = new Date('08/12/25Z');

const data = {
  id: `${source}${num}`,
  link,
  description,
  company,
  source: `Daily ${source}`,
  image,
  start,
  end,
  geo: null,
  fallback: true,
  type: 'ad',
};
topic.publisher().publish(Buffer.from(JSON.stringify(data)));
