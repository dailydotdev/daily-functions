#!/usr/bin/env node

const fs = require('fs');
const request = require('request');

const secret = process.env.WEBHOOK_SECRET;
const webhook = process.env.WEBHOOK_URL;
const user = process.env.USER;
const pass = process.env.PASS;


const sendOnePayload = (payloads) => {
  if (!payloads.length) {
    console.log('done!');
    process.exit();
  }

  request({
    url: 'https://push.superfeedr.com/',
    method: 'POST',
    form: payloads[0],
    auth: {
      user,
      pass,
      sendImmediately: true,
    },
  }, (err) => {
    if (err) {
      console.error(`failed to add ${payloads[0]['hub.topic']}`);
      process.exit(1);
    } else {
      sendOnePayload(payloads.slice(1));
    }
  });
};

const payloads = fs.readFileSync('sources.csv')
  .toString()
  .split('\n')
  .map((line) => {
    const cols = line.split(',');
    return {
      'hub.mode': 'subscribe',
      'hub.topic': cols[1],
      'hub.callback': `${webhook}/${cols[0]}`,
      'hub.secret': secret,
      format: 'json',
    };
  });

sendOnePayload(payloads);
