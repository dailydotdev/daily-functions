const rp = require('request-promise-native');

const secret = process.env.ONESIGNAL_SECRET;
const appID = process.env.ONESIGNAL_APP;

const sendMessage = template =>
  rp({
    method: 'POST',
    uri: 'https://onesignal.com/api/v1/notifications',
    headers: {
      'authorization': `Basic ${secret}`,
      'content-type': 'application/json',
    },
    json: true,
    body: {
      app_id: appID,
      template_id: template,
      included_segments: ['Subscribed Users'],
    },
  });


const type2Template = {
  'new': 'e5220ca4-886d-41c8-a59f-f8e09dc64673',
};

exports.webpush = (event) => {
  const data = JSON.parse(Buffer.from(event.data, 'base64').toString());
  if (type2Template[data.type]) {
    console.log(`sending template for event "${data.type}"`);
    return sendMessage(type2Template[data.type]);
  }

  return Promise.resolve();
};
