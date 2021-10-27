import path from "path";
import fs from "fs/promises";

import { writeFile } from "../utils";
import { dataPath } from "./write";
import { log } from "../log";

export async function writeIndex(): Promise<void> {
  // Find all term JSON files in the data directory
  const files = await fs.readdir(dataPath);
  const dataFileRegex = /20[0-9]{4}.json/;
  const allDataFiles = files.filter((f) => f.match(dataFileRegex) !== null);
  const allTerms = allDataFiles.map((f) => f.substring(0, f.indexOf(".")));

  log("identified term data files in output directory", {
    allDataFiles,
    allTerms,
    files,
    dataPath,
  });

  // Write the list of terms out to `index.json`
  const jsonData = {
    terms: allTerms,
  };
  const termPath = path.resolve(dataPath, `index.json`);
  return writeFile(termPath, jsonData);
}
