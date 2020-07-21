import fs from 'fs';

export function extract<T>(
  text: string,
  regexp: RegExp,
  callback: (execArray: RegExpExecArray) => T) {
  const array: T[] = [];
  let results;
  while (results = regexp.exec(text)) {
    array.push(callback(results));
  }
  return array;
}

export function match(text: string, regexp: RegExp) {
  const results = regexp.exec(text);
  return results && results[1];
}

export function cache(array: (string | null)[], value: string | null) {
  let index = array.indexOf(value);
  if (!~index) {
    array.push(value);
    index = array.length - 1;
  }
  return index;
}

export function writeFile(path: string, json: any) {
  return new Promise((resolve, reject) => {
    const content = JSON.stringify(json);
    fs.writeFile(path, content, err => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}
