const download = require('./download');
const parse = require('./parse');
const upload = require('./upload');

console.info('Downloading...');
download('201902')
  .then(html => {
    console.info('Parsing...');
    return parse(html);
  })
  .then(courses => {
    console.info('Uploading...');
    return upload(courses);
  })
  .then(() => console.info('Done.'))
  .catch(console.error);
