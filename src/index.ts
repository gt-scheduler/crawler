import { download, list, parse, write } from './steps';

async function crawling() {
  console.info('Listing ...');
  const terms = await list();

  for (const term of terms.slice(0, 2)) {
    console.info(`Downloading ${term} ...`);
    const html = await download(term);

    console.info('Parsing ...');
    const termData = await parse(html);

    console.info('Writing ...');
    await write(term, termData);
  }
}

crawling().catch(console.error);
