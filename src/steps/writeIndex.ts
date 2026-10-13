import path from "path";
import fs from "fs/promises";

import { writeFile } from "../utils";
import { dataPath } from "./write";
import { log } from "../log";
import { Term } from "../types";

export async function writeIndex(termsFinalized: string[]): Promise<void> {
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

  const termsInfo: Term[] = [];

  allTerms.forEach((element) => {
    const curr: Term = {
      term: element,
      finalized: false,
    };
    if (termsFinalized.includes(element)) {
      curr.finalized = true;
    }
    termsInfo.push(curr);
  });

  // Write the list of terms out to `index.json`
  const jsonData = {
    terms: termsInfo,
  };

  const termPath = path.resolve(dataPath, `index.json`);
  return writeFile(termPath, jsonData);
}
