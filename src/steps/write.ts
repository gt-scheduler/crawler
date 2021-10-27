import path from "path";
import fs from "fs";
import { TermData } from "../types";
import { writeFile } from "../utils";

export const dataPath = path.resolve(__dirname, "..", "..", "data");
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath);
}

export function write(term: string, termData: TermData): Promise<void> {
  const termPath = path.resolve(dataPath, `${term}.json`);
  return writeFile(termPath, termData);
}
