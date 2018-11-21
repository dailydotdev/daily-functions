const crypto = require('crypto');
const PubSub = require(`@google-cloud/pubsub`);
const pubsub = new PubSub();
const topic = pubsub.topic('crawled-post');
// const topic = pubsub.topic('ad-image-processed');

const link = 'http://go.thoughtleaders.io/549120181104';
const description = 'Can you ace a coding interview? Make sure you can. Practice on Pramp - free interview prep with peers';
const source = 'Pramp';
const image = 'https://media.thoughtleaders.io/media/placements/2018/11/01/pramp_-_pic.png';
const start = new Date('11/04/18Z');

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
