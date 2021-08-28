import fs from "fs";
import { error } from "./log";
import { Location } from "./types";

export function extract<T>(
  text: string,
  regexp: RegExp,
  callback: (execArray: RegExpExecArray) => T
): T[] {
  const array: T[] = [];
  for (
    let results = regexp.exec(text);
    results != null;
    results = regexp.exec(text)
  ) {
    array.push(callback(results));
  }
  return array;
}

export function match(text: string, regexp: RegExp): string | null {
  const results = regexp.exec(text);
  return results && results[1];
}

export function cache(
  array: (Location | string | null)[],
  value: Location | string | null
): number {
  let index = array.indexOf(value);
  if (index === -1) {
    array.push(value);
    index = array.length - 1;
  }
  return index;
}

export function writeFile(path: string, json: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const content = JSON.stringify(json);
    fs.writeFile(path, content, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
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

export function getIntConfig(key: string): number | null {
  const value = process.env[key];
  if (value == null) return null;
  try {
    return parseInt(value, 10);
  } catch (err) {
    error(`invalid integer config value provided`, err, { key, value });
    process.exit(1);
    // Unreachable
    return null;
  }
}
