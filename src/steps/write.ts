import path from "path";
import fs from "fs";
import { TermData } from "../types";
import { writeFile } from "../utils";

export function write(
  dataFolder: string,
  term: string,
  termData: TermData
): Promise<void> {
  if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder);
  }

  const termPath = path.resolve(dataFolder, `${term}.json`);
  return writeFile(termPath, termData);
}
