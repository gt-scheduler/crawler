const Promise = require('bluebird');

const list = require('./list');
const download = require('./download');
const parse = require('./parse');
const write = require('./write');

console.info('Listing ...');
list().then(terms => {
  return Promise.mapSeries(terms, term => {
    console.info(`Downloading ${term} ...`);
    return download(term)
      .then(html => {
        console.info('Parsing ...');
        return parse(html);
      })
      .then(termData => {
        console.info('Writing ...');
        return write(term, termData);
      });
  });
}).catch(console.error);
