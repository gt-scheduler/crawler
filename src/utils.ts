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

export function concatParams(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
}

/**
 * Ensures a regular expression executes with a match,
 * or throws an exception
 * @param regex - Source regular expression
 * @param str - Target string
 */
export function regexExec(regex: RegExp, str: string): RegExpExecArray {
  const result = regex.exec(str);
  if (result == null)
    throw new Error(
      "Regular expression '${}' failed to execute on string '${}'"
    );
  return result;
}
