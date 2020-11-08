const crypto = require('crypto');
const PubSub = require(`@google-cloud/pubsub`);
const pubsub = new PubSub();
const topic = pubsub.topic('crawled-post');
// const topic = pubsub.topic('ad-image-processed');

const num = '4';
const link = `https://ter.li/ahw31z`;
const description = 'Application performance monitoring built for devs, by devs. Get back to coding faster.';
const company = 'Scout APM';
const source = `Scout`;
const image = 'https://storage.googleapis.com/devkit-assets/ads/dailydev_1024x512.png';
const start = new Date('11/08/20Z');
// const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
const end = new Date('11/22/20Z');

const data = {
  id: `${source}${num}`,
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
