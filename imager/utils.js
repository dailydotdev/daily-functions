const crypto = require('crypto');
const { PubSub } = require(`@google-cloud/pubsub`);
const pubsub = new PubSub();
const topic = pubsub.topic('post-keywords-extracted');
// const topic = pubsub.topic('ad-image-processed');

const num = '1';
const link = `https://www.eventbrite.com/e/the-monthly-dev-1-by-dailydev-registration-133820993193`;
const description = 'World-class talks by expert developers. Save your FREE seat today!';
const company = 'daily.dev';
const source = `The Monthly Dev`;
const image = 'https://storage.googleapis.com/devkit-assets/ads/Fallback%20Ads%20%20(1).jpg';
const start = new Date('12/28/20Z');
// const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
const end = new Date('12/28/25Z');

const data = {
  id: `TMD${num}`,
  link,
  description,
  company,
  source,
  image,
  start,
  end,
  geo: null,
  fallback: false,
  type: 'ad',
};
topic.publisher().publish(Buffer.from(JSON.stringify(data)));
