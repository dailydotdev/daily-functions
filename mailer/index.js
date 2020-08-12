const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const reason2Template = {
  approve: 'd-70b3a7c0788e48aeadeb84c2ac2b773a',
  exists: 'd-4204a2382a71452ea00488ad2be8900c',
  'non-english': 'd-d922f65dc4b743f3964a5ba397410ea2',
  'not-active': 'd-f1121c6d83db4de8931dbae0ba1f56d2',
  personal: 'd-aef9d39eb7814192aac705fc61609dc1',
  rss: 'd-db9bd8465aa54ee7b5454204a39b10a8',
  promotion: 'd-c31a38be9a3849d2b8667b6c5f447290',
  'not-blog': 'd-aa42d9bb7fe346d192b2da64d40398c7',
  'not-relevant': 'd-bf84f046d2714622ba55e5849300a06e',
};

const send = (templateId, email, name, url) => sgMail.send({
  to: email,
  from: {
    email: 'ido@dailynow.co',
    name: 'Ido From Daily',
  },
  reply_to: {
    email: 'ido@dailynow.co',
    name: 'Ido From Daily',
  },
  template_id: templateId,
  dynamic_template_data: {
    name,
    url,
  },
  tracking_settings: {
    open_tracking: { enable: true },
  },
});

exports.mailer = (event) => {
  const data = JSON.parse(Buffer.from(event.data, 'base64').toString());
  const req = data.pubRequest;
  if (req && req.userEmail) {
    let templateId;
    if (data.type === 'approve') {
      templateId = reason2Template['approve'];
    } else if (data.type === 'decline') {
      templateId = reason2Template[req.reason];
    }
    if (templateId) {
      return send(templateId, req.userEmail, req.userName, req.url);
    }
  }
  return Promise.resolve();
};
