const crypto = require('crypto');
const request = require('request-promise-native');
const sharp = require('sharp');
const PubSub = require(`@google-cloud/pubsub`);
const cloudinary = require('cloudinary');

const pubsub = new PubSub();

const createOrGetTopic = (type) => {
  const topicName = `${type}-image-processed`;
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

const checksum = (str, algorithm = 'md5', encoding = 'hex') => {
  return crypto
    .createHash(algorithm)
    .update(str, 'utf8')
    .digest(encoding);
};

const uploadImage = (id, buffer, isGif, type) => {
  const fileName = checksum(buffer);
  const uploadPreset = isGif ? `${type}_animated` : `${type}_image`;

  console.log(`[${id}] uploading image ${fileName}`);

  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader.upload_stream({ public_id: fileName, upload_preset: uploadPreset }, (err, res) => {
      if (err) {
        return reject(err);
      }

      resolve(cloudinary.v2.url(res.public_id, { secure: true, fetch_format: 'auto', quality: 'auto' }));
    })
      .end(buffer);
  });
};

const manipulateImage = (id, url, type) => {
  if (!url) {
    console.log(`[${id}] no image, skipping image processing`);
    return Promise.resolve({});
  }

  console.log(`[${id}] downloading ${url}`);
  return request({
    method: 'GET',
    url,
    encoding: null,
  }).then((buffer) => {
    const image = sharp(buffer);
    return image.metadata()
      .then((info) => {
        console.log(`[${id}] processing image`);

        const ratio = info.width / info.height;
        const placeholderSize = Math.max(10, Math.floor(3 * ratio));

        const isGif = info.format === 'gif';
        const uploadPromise = uploadImage(id, buffer, isGif, type);

        const placeholderPromise = image.jpeg().resize(placeholderSize).toBuffer()
          .then(buffer => `data:image/jpeg;base64,${buffer.toString('base64')}`);

        return Promise.all([uploadPromise, placeholderPromise])
          .then(res => ({
            image: res[0],
            placeholder: res[1],
            ratio,
          }));
      });
  });
};

exports.imager = (event) => {
  const pubsubMessage = event;
  const data = JSON.parse(Buffer.from(pubsubMessage.data, 'base64').toString());
  const type = data.type || 'post';

  return manipulateImage(data.id, data.image, type)
    .then(res => Object.assign({}, data, res))
    .catch((err) => {
      console.warn(`[${data.id}] failed to process image`, err);
      return data;
    })
    .then((item) =>
      createOrGetTopic(type)
        .then((topic) => {
          console.log(`[${data.id}] ${type} image processed`, item);
          return topic.publisher().publish(Buffer.from(JSON.stringify(item)));
        })
    );
};

// manipulateImage('', true ? 'https://cdn-images-1.medium.com/max/1600/1*GOx1lfu0QsRJEwd9HzmrYg.gif' : 'https://www.nodejsera.com/library/assets/img/30-days.png')
//   .then(console.log)
//   .catch(console.error);
