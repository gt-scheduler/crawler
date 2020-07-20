const match = (text, regexp) => {
  const results = regexp.exec(text);
  return results && results[1];
};

const cache = (array, value) => {
  let index = array.indexOf(value);
  if (!~index) {
    array.push(value);
    index = array.length - 1;
  }
  return index;
};

const map = (text, regexp, callback) => {
  const array = [];
  let results;
  while (results = regexp.exec(text)) {
    array.push(callback(results));
  }
  return array;
};

const parse = html => {
  const courses = {};
  const caches = {
    periods: [],
    dateRanges: [],
    scheduleTypes: [],
    campuses: [],
    attributes: [],
    gradeBases: [],
  };
  const updatedAt = new Date();

  const startIndex = html.indexOf('<caption class="captiontext">Sections Found</caption>');
  const endIndex = html.lastIndexOf('<table  CLASS="datadisplaytable" summary="This is for formatting of the bottom links." WIDTH="50%">');
  const body = html.slice(startIndex, endIndex);
  const sections = body.split('<tr>\n<th CLASS="ddtitle" scope="colgroup" >').slice(1);

  sections.forEach(section => {
    const [titlePart, descriptionPart, , ...meetingParts] = section.split('<tr>\n');

    const [, courseTitle, crn, courseId, sectionId] = /^<a href=".+">(.+) - (\d{5}) - (\w+ \w+) - (.+)<\/a>/.exec(titlePart);

    const fields = map(descriptionPart, /^<SPAN class="fieldlabeltext">(.+): <\/SPAN>(.+)$/mg, results => {
      const [, key, value] = results;
      return { key, value };
    }).reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {});
    const attributesKey = 'Attributes';
    const attributes = attributesKey in fields ?
      fields[attributesKey].split(',').map(attribute => attribute.trim()) :
      [];
    const gradeBasis = fields['Grade Basis'];

    const credits = Number.parseInt(match(descriptionPart, /(\d+\.\d{3}) Credits$/m));
    const scheduleType = match(descriptionPart, /^(.+) Schedule Type$/m);
    const campus = match(descriptionPart, /^(.+) Campus$/m);

    const scheduleTypeIndex = cache(caches.scheduleTypes, scheduleType);
    const campusIndex = cache(caches.campuses, campus);
    const attributeIndices = attributes.map(attribute => cache(caches.attributes, attribute));
    const gradeBasisIndex = cache(caches.gradeBases, gradeBasis);

    const meetings = meetingParts.map(meetingPart => {
      let [type, period, days, where, dateRange, scheduleType, instructors] = meetingPart.split('\n').slice(0, 7)
        .map(row => row.replace(/<\/?[^>]+(>|$)/g, ''));
      instructors = instructors.replace(/ +/g, ' ').split(', ');
      const periodIndex = cache(caches.periods, period);
      const dateRangeIndex = cache(caches.dateRanges, dateRange);

      return [
        periodIndex,
        days,
        where,
        instructors,
        dateRangeIndex,
      ];
    });

    if (!(courseId in courses)) {
      const title = courseTitle;
      const sections = {};
      courses[courseId] = [
        title,
        sections,
      ];
    }
    courses[courseId][1][sectionId] = [
      crn,
      meetings,
      credits,
      scheduleTypeIndex,
      campusIndex,
      attributeIndices,
      gradeBasisIndex,
    ];
  });

  return { courses, caches, updatedAt };
};

module.exports = parse;
