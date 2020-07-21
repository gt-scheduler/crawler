import path from 'path';
import fs from 'fs';
import { TermData } from './parse';
import { writeFile } from '../utils';

const dataPath = path.resolve(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath);
}

export function write(term: string, termData: TermData) {
  const termPath = path.resolve(dataPath, `${term}.json`);
  return writeFile(termPath, termData);
}
