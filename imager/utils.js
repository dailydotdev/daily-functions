const crypto = require('crypto');
const PubSub = require(`@google-cloud/pubsub`);
const pubsub = new PubSub();
// const topic = pubsub.topic('crawled-post');
const topic = pubsub.topic('ad-image-processed');

const link = 'https://www.producthunt.com/posts/daily-2-0';
const description = 'Daily 2.0 is now live on Product Hunt 🚀, help us to grow!🤯';
const source = 'Daily';
const image = 'https://storage.googleapis.com/devkit-assets/ads/daily2.gif';
const start = new Date('4/30/19Z');
// const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
const end = new Date('4/31/19Z');

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
