const path = require('path');
const fs = require('fs');

const dataPath = path.resolve(__dirname, '..', 'data');
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath);
}

const writeFile = (path, json) => new Promise((resolve, reject) => {
  const content = JSON.stringify(json);
  fs.writeFile(path, content, err => {
    if (err) {
      return reject(err);
    }
    resolve();
  });
});

const write = (term, termData) => {
  const termPath = path.resolve(dataPath, `${term}.json`);
  return writeFile(termPath, termData);
};

module.exports = write;
