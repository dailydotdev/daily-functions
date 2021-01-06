const crypto = require('crypto');
const { PubSub } = require(`@google-cloud/pubsub`);
const pubsub = new PubSub();
const topic = pubsub.topic('post-fetched', {
  batching: {
    maxMessages: 10,
    maxMilliseconds: 1000,
  },
});

const convertTime = (epoch) => (epoch ? new Date(epoch * 1000) : null);

exports.webhook = (req, res) => {
  const pubId = req.url.substring(1);

  // if (req.method.toLowerCase() === 'get') {
  //   const parsedUrl = url.parse(req.url, true);
  //   if (parsedUrl.query['hub.challenge']) {
  //     console.log(`received challenge ${parsedUrl.query['hub.challenge']} for ${parsedUrl.query['hub.topic']}`);
  //     return res.status(200).send(parsedUrl.query['hub.challenge']);
  //   }
  // }

  if (req.method.toLowerCase() !== 'post' || !pubId.length) {
    return res.status(404).send();
  }

  const contentType = req.get('content-type');
  if (!contentType || contentType.indexOf('application/json') < -1) {
    console.warn(`unknown content-type "${contentType}"`);
    return res.status(400).send('unknown content-type');
  }

  console.log(`received notification from ${pubId}`);

  const body = req.body;
  console.log(body);

  const hmac = crypto.createHmac('sha1', process.env.WEBHOOK_SECRET);
  const sig = `sha1=${hmac.update(JSON.stringify(body)).digest('hex')}`;
  if (req.get('x-hub-signature') !== sig) {
    console.warn('failed to verify hub signature');
    return res.status(401).send();
  }

  const items = body.items || [];
  if (items) {
    return Promise.resolve()
      .then(() => {
        return Promise.all(items.map((item) => ({
          id: crypto.createHash('md5').update(item.id).digest('hex'),
          title: item.title,
          tags: item.categories ? item.categories.map(c => c.toLowerCase()) : [],
          publishedAt: convertTime(item.published),
          updatedAt: convertTime(item.updated),
          publicationId: pubId,
          url: item.permalinkUrl,
        })).map((item) => {
          console.log(`[${item.id}] post fetched`, item);
          return topic.publish(Buffer.from(JSON.stringify(item)));
        }));
      })
      .then(() => res.status(200).send('OK'));
  }

  res.status(200).send('OK');
};
