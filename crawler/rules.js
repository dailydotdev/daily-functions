const { getUrl, isUrl } = require('@metascraper/helpers');

const validatorTime = value => {
  if (!value) return false;
  return value.trim();
};

const wrapTime = rule => ({ htmlDom }) => {
  const value = rule(htmlDom);
  return validatorTime(value);
};

const validatorUrl = (value, url) => isUrl(value) && getUrl(url, value);

const wrapUrl = rule => ({ htmlDom, url }) => {
  const value = rule(htmlDom);
  return validatorUrl(value, url);
};

const validatorTwitterHandle = value => {
  if (!value || value[0] !== '@') return false;
  return value;
};

const wrapTwitterHandle = rule => ({ htmlDom }) => {
  const value = rule(htmlDom);
  return validatorTwitterHandle(value);
};

module.exports = () => {
  return ({
    modified: [
      wrapTime($ => $('meta[property="article:modified_time"]').attr('content')),
    ],
    image: [
      wrapUrl($ => $('meta[property="og:image:secure_url"]').attr('content')),
      wrapUrl($ => $('meta[property="og:image:url"]').attr('content')),
      wrapUrl($ => $('meta[property="og:image"]').attr('content')),
      wrapUrl($ => $('meta[name="twitter:image:src"]').attr('content')),
      wrapUrl($ => $('meta[name="twitter:image"]').attr('content')),
      wrapUrl($ => $('meta[itemprop="image"]').attr('content')),
    ],
    siteTwitter: [
      wrapTwitterHandle($ => $('meta[name="twitter:site"]').attr('content')),
    ],
    creatorTwitter: [
      wrapTwitterHandle($ => $('meta[name="twitter:creator"]').attr('content')),
    ],
  });
};
