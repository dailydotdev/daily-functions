const sgMail = require('@sendgrid/mail');
const format = require('date-fns/format');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const type2Template = {
  approve: 'd-d79367f86f1e4ca5afdf4c1d39ff7214',
  decline: 'd-48de63612ff944cb8156fec17f47f066',
  new: 'd-9254665878014627b4fd71593f09d975',
};

const send = (templateId, email, userName, rssLink, sourceName, createdAt) => sgMail.send({
  to: email,
  from: {
    email: 'informer@daily.dev',
    name: 'daily.dev',
  },
  replyTo: {
    email: 'hi@daily.dev',
    name: 'daily.dev',
  },
  trackingSettings: {
    openTracking: { enable: true },
  },
  asm: {
    groupId: 15003,
  },
  category: 'Source Request',
  template_id: templateId,
  dynamic_template_data: {
    source_name: sourceName,
    rss_link: rssLink,
    first_name: userName,
    timestamp: format(createdAt, 'EEEE, d LLLL y, HH:mm'),
  },
});

exports.mailer = (event) => {
  const data = JSON.parse(Buffer.from(event.data, 'base64').toString());
  const req = data.pubRequest;
  if (req && req.userEmail) {
    let templateId = type2Template[data.type];
    if (data.type === 'declined' && data.reason === 'exists') {
      templateId = type2Template['approve'];
    }
    if (templateId) {
      return send(templateId, req.userEmail, req.userName, req.url, req.pubName, new Date(req.createdAt))
        .catch((err) => {
          if (err.response && err.response.body && err.response.body.errors) {
            console.error(err.response.body.errors);
          }
          throw err;
        });
    }
  }
  return Promise.resolve();
};
