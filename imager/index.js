const crypto = require('crypto');
const request = require('request-promise-native');
const sharp = require('sharp');
const PubSub = require(`@google-cloud/pubsub`);
const Storage = require('@google-cloud/storage');

const pubsub = new PubSub();
const storage = new Storage();

const createOrGetTopic = () => {
    const topicName = 'post-image-processed';
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

const resizeImage = (image, info) => {
    const resize = image.resize(Math.min(1024, info.width));
    if (info.channels === 4) {
        return { format: 'png', image: resize.png() };
    }

    return { format: 'jpeg', image: resize.jpeg() };
};

const uploadImage = (id, buffer, format) => {
    const bucketName = process.env.BUCKET;
    const bucket = storage.bucket(bucketName);
    const fileName = `images/${checksum(buffer)}.${format}`;
    const file = bucket.file(fileName);

    console.log(`[${id}] uploading image ${fileName}`);

    return new Promise((resolve, reject) => {
        file.createWriteStream({
            gzip: true,
            metadata: {
                cacheControl: 'public, max-age=31536000',
                contentType: `image/${format}`,
            },
            predefinedAcl: 'publicRead',
        })
            .on('error', reject)
            .on('finish', () => resolve(`https://storage.googleapis.com/${bucketName}/${fileName}`))
            .end(buffer);
    });
};

const manipulateImage = (id, url) => {
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
                const placeholderSize = Math.max(10, 3 * ratio);
                const { format, image: resized } = resizeImage(image, info);

                const resizedBufferPromise = resized.toBuffer()
                    .then(buffer => uploadImage(id, buffer, format));

                const placeholderBufferPromise = resized.resize(placeholderSize).toBuffer()
                    .then(buffer => `data:image/${format};base64,${buffer.toString('base64')}`);

                return Promise.all([resizedBufferPromise, placeholderBufferPromise])
                    .then(res => ({
                        image: res[0],
                        placeholder: res[1],
                        ratio,
                    }));
            });
    });
};

exports.imager = (event) => {
    const pubsubMessage = event.data;
    const data = JSON.parse(Buffer.from(pubsubMessage.data, 'base64').toString());

    return manipulateImage(data.id, data.image)
        .then(res => Object.assign({}, data, res))
        .catch((err) => {
            console.warn(`[${data.id}] failed to process image`, err);
            return data;
        })
        .then((item) =>
            createOrGetTopic()
                .then((topic) => {
                    console.log(`[${data.id}] post image processed`, item);
                    return topic.publisher().publish(Buffer.from(JSON.stringify(item)));
                })
        );
};