const Promise = require('bluebird');

const list = require('./list');
const download = require('./download');
const parse = require('./parse');
const upload = require('./upload');

console.info('Listing ...');
list().then(terms_in => {
  return Promise.mapSeries(terms_in.slice(0, 2), term_in => {
    console.info(`Downloading ${term_in} ...`);
    return download(term_in)
      .then(html => {
        console.info('Parsing ...');
        return parse(html);
      })
      .then(courses => {
        console.info('Uploading ...');
        return upload(term_in, courses);
      });
  });
}).catch(console.error);
