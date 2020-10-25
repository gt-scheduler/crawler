import {
  download,
  list,
  parse,
  downloadDetails,
  parsePrereqs,
  attachPrereqs,
  attachDescriptions,
  parseDescriptions,
  write,
} from './steps';

// Current scraped JSON version
const CURRENT_VERSION = 2;

async function crawling() {
  console.info('Listing ...');
  const terms = await list();

  for (const term of terms.slice(0, 2)) {
    console.info(`Downloading ${term} ...`);
    const html = await download(term);

    console.info(`Parsing v${CURRENT_VERSION} JSON ...`);
    const termData = await parse(html, CURRENT_VERSION);

    const allCourseIds = Object.keys(termData.courses);
    const detailPromises = downloadDetails(term, allCourseIds);

    // Pass in the detail promise array twice
    // Each async function will await them,
    // but since promises are immutable, this is fine
    console.log("Downloading prerequisite information & course descriptions ...");
    const prereqParsePromise = parsePrereqs(detailPromises);
    const descriptionPromise = parseDescriptions(detailPromises);

    // Await the promises in parallel
    const [prereqs, descriptions] = await Promise.all([
      prereqParsePromise,
      descriptionPromise
    ]);

    console.info("Attaching prerequisite information ...");
    attachPrereqs(termData, prereqs);

    console.info("Attaching course descriptions ...");
    attachDescriptions(termData, descriptions);

    console.info('Writing ...');
    await write(term, termData);
  }
}

crawling().catch(console.error);
