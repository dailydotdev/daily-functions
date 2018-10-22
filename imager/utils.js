const crypto = require('crypto');
const PubSub = require(`@google-cloud/pubsub`);
const pubsub = new PubSub();
const topic = pubsub.topic('crawled-post');
// const topic = pubsub.topic('ad-image-processed');

const link = 'http://go.thoughtleaders.io/561420181007';
const description = 'HelloSign API: Everything IT Requires and Developers Love';
const source = 'HelloSign';
const image = 'https://media.thoughtleaders.io/media/placements/2018/10/01/1024x640_b.png';
const start = new Date('10/7/18Z');

const data = {
  id: crypto.createHash('md5').update(link).digest('hex'),
  link,
  description,
  source,
  image,
  start,
  end: new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000),
  type: 'ad',
};
topic.publisher().publish(Buffer.from(JSON.stringify(data)));
