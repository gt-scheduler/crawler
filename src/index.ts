import {
  download,
  list,
  parse,
  downloadPrereqs,
  parsePrereqs,
  attachPrereqs,
  write,
} from './steps';

// Current scraped JSON version
const CURRENT_VERSION = "2";

async function crawling() {
  console.info('Listing ...');
  const terms = await list();

  for (const term of terms.slice(0, 2)) {
    console.info(`Downloading ${term} ...`);
    const html = await download(term);

    console.info(`Parsing v${CURRENT_VERSION} JSON ...`);
    const termData = await parse(html, CURRENT_VERSION);

    console.info("Retrieving prerequisites...");
    const allCourseIds = Object.keys(termData.courses);
    const prerequisitePromises = downloadPrereqs(term, allCourseIds);

    console.log("Parsing prerequisite information...");
    const prereqs = await parsePrereqs(prerequisitePromises)

    console.info("Attaching prerequisite information...");
    attachPrereqs(termData, prereqs);

    console.info('Writing ...');
    await write(term, termData);
  }
}

crawling().catch(console.error);
