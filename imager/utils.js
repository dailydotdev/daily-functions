const crypto = require('crypto');
const PubSub = require(`@google-cloud/pubsub`);
const pubsub = new PubSub();
const topic = pubsub.topic('crawled-post');
// const topic = pubsub.topic('ad-image-processed');

const link = 'https://github.com/dailynowco/daily';
const description = 'We are 100% open source and looking for all sorts of contribution 🤓 ';
const source = 'Daily';
const image = 'https://storage.googleapis.com/devkit-assets/ads/oss_wide.jpg';
const start = new Date('8/10/19Z');
// const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
const end = new Date('8/10/20Z');

const data = {
  id: crypto.createHash('md5').update(link).digest('hex'),
  link,
  description,
  source,
  image,
  start,
  end,
  type: 'ad',
};
topic.publisher().publish(Buffer.from(JSON.stringify(data)));
