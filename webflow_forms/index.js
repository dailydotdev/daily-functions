const client = require('@sendgrid/client');
client.setApiKey(process.env.SENDGRID_API_KEY);

exports.webflow_forms = (req, res) => {
  if (req.method.toLowerCase() !== 'post' || req.url !== '/') {
    return res.status(404).send();
  }

  const contentType = req.get('content-type');
  if (!contentType || contentType.indexOf('application/json') < -1) {
    console.warn(`unknown content-type "${contentType}"`);
    return res.status(400).send();
  }

  const body = req.body;
  if (body.site !== process.env.WEBFLOW_SITE) {
    return res.status(400).send();
  }

  let listId;
  switch (body.name) {
    case 'Newsletter':
      listId = '13d39d0b-927c-4cad-8cbc-f2eaa8af4147';
      break;
    case 'Premium':
      listId = 'b5bfeeec-4faf-4e38-a2d8-884ce0ad2e57';
      break;
    default:
      return res.status(400).send();
  }

  return client.request({
    method: 'PUT',
    url: '/v3/marketing/contacts',
    body: {
      list_ids: [listId],
      contacts: [{
        email: body.data.Email,
      }],
    },
  })
    .then(([contactsRes, contactsBody]) => {
      if (contactsRes.statusCode === 202) {
        console.log(`added ${body.data.Email} to ${body.name}`);
        return res.status(200).send('OK');
      }
      console.error(contactsBody);
      return res.status(500).send();
    })
    .catch(() => res.status(500).send());
};
