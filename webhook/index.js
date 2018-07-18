const crypto = require('crypto');
const PubSub = require(`@google-cloud/pubsub`);
const pubsub = new PubSub();

const convertTime = (epoch) => (epoch ? new Date(epoch * 1000) : null);

const createOrGetTopic = () => {
  const topicName = 'post-fetched';
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

exports.webhook = (req, res) => {
  const pubId = req.url.substring(1);

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
    return createOrGetTopic()
      .then((topic) => {
        const publisher = topic.publisher({
          batching: {
            maxMessages: 10,
            maxMilliseconds: 1000,
          },
        });

        return Promise.all(items.map((item) => ({
          id: crypto.createHash('md5').update(item.id).digest('hex'),
          title: item.title,
          tags: item.categories ? item.categories : [],
          publishedAt: convertTime(item.published),
          updatedAt: convertTime(item.updated),
          publicationId: pubId,
          url: item.permalinkUrl.split('?').shift(),
        })).map((item) => {
          console.log(`[${item.id}] post fetched`, item);
          return publisher.publish(Buffer.from(JSON.stringify(item)));
        }));
      })
      .then(() => res.status(200).send('OK'));
  }

  res.status(200).send('OK');
};
