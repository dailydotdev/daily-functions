const crypto = require('crypto');
const PubSub = require(`@google-cloud/pubsub`);
const pubsub = new PubSub();
const topic = pubsub.topic('crawled-post');
// const topic = pubsub.topic('ad-image-processed');

const link = 'https://vscode.pro/?utm_source=dailynowco';
const description = '📺 VSCode.pro Course —Ahmad spent 1000+ hrs building a premium course with 200+ power user tips/tricks';
const source = 'VSCode.pro  →';
const image = 'https://raw.githubusercontent.com/ahmadawais/stuff/master/images/vscodepro/play.jpg';
const start = new Date('11/26/18Z');

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
