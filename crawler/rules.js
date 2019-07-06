const { getUrl, isUrl } = require('@metascraper/helpers');
const readTimeEstimate = require('read-time-estimate');

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

const validatorTags = values => values.map(v => v.toLowerCase().trim().replace(/ /g, '-'));

const validatorKeywords = value => {
  if (!value || value.indexOf(',') < 0) return false;
  return validatorTags(value.split(','));
};

const wrapDevToTags = rule => ({ htmlDom }) => {
  const values = rule(htmlDom).map(t => t.replace('#', ''));
  if (!values.length) return false;
  return validatorTags(values);
};

const wrapElementTextTags = rule => ({ htmlDom }) => {
  const values = rule(htmlDom);
  if (!values.length) return false;
  return validatorTags(values);
};

const wrapMediumTags = rule => ({ htmlDom }) => {
  try {
    const script = rule(htmlDom);
    const json = JSON.parse(script);
    if (!json || !json.keywords || !json.keywords.filter) return false;
    return validatorTags(json.keywords.filter(t => t.indexOf('Tag:') > -1).map(t => t.replace('Tag:', '')));
  } catch (ex) {
    return false;
  }
};

const wrapProductHuntTags = rule => ({ htmlDom }) => {
  try {
    const script = rule(htmlDom);
    const json = JSON.parse(script);
    if (!json || !json.length || !json[0].applicationCategory || !json[0].applicationCategory.length) return false;
    return validatorTags(json[0].applicationCategory);
  } catch (ex) {
    return false;
  }
};

const wrapKeywords = rule => ({ htmlDom }) => {
  const value = rule(htmlDom);
  return validatorKeywords(value);
};

const wrapReadTime = rule => ({ htmlDom }) => {
  const element = rule(htmlDom);
  if (element) {
    return readTimeEstimate.default(element);
  }
  return false;
};

const wrapMediumPaywall = rule => ({ htmlDom }) => {
  const elements = rule(htmlDom);
  const star = elements.filter(el => (el.attr('class') && el.attr('class').indexOf('star') > -1));
  // Workaround as you must return string, otherwise value is ignored
  return star.length > 0 ? 'true' : false;
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
    keywords: [
      wrapDevToTags($ => $('.tags > .tag').toArray().map(el => $(el).text())),
      wrapMediumTags($ => $('script[type="application/ld+json"]').html()),
      wrapProductHuntTags($ => $('script[type="application/ld+json"]').html()),
      wrapElementTextTags($ => $('.tags > a').toArray().map(el => $(el).text())),
      wrapDevToTags($ => $('.breadcrumbs > a').toArray().map(el => $(el).text())),
      wrapElementTextTags($ => $('.blog-tag').toArray().map(el => $(el).text())),
      wrapElementTextTags($ => $('.meta-box--tags > a').toArray().map(el => $(el).text())),
      wrapElementTextTags($ => $('.post .category').toArray().map(el => $(el).text())),
      wrapElementTextTags($ => $('.content-heading__secondary-categories a').toArray().map(el => $(el).text())),
      wrapElementTextTags($ => $('.post__tags a').toArray().map(el => $(el).text())),
      wrapKeywords($ => $('meta[name="keywords"]').attr('content')),
    ],
    readTime: [
      wrapReadTime($ => $('.article__data').html()),
      wrapReadTime($ => $('.article-content').html()),
      wrapReadTime($ => $('.uni-paragraph').html()),
      wrapReadTime($ => $('.episode-body-summary').html()),
      wrapReadTime($ => $('article').html()),
      wrapReadTime($ => $('#readme').html()),
      wrapReadTime($ => $('.post__content').html()),
    ],
    paid: [
      wrapMediumPaywall($ => $('svg').toArray().map(el => $(el))),
    ],
  });
};
