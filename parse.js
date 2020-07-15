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

const parse = html => {
  const courses = {};
  const dateRanges = [];
  const scheduleTypes = [];
  const campuses = [];
  const instructionalMethods = [];
  const updatedAt = new Date();

  const startIndex = html.indexOf('<caption class="captiontext">Sections Found</caption>');
  const endIndex = html.lastIndexOf('<table  CLASS="datadisplaytable" summary="This is for formatting of the bottom links." WIDTH="50%">');
  const body = html.slice(startIndex, endIndex);
  const sections = body.split('<tr>\n<th CLASS="ddtitle" scope="colgroup" >').slice(1);

  sections.forEach(section => {
    const [titlePart, descriptionPart, , ...meetingParts] = section.split('<tr>\n');

    const [, courseTitle, crn, courseId, sectionId] = /^<a href=".+">(.+) - (\d{5}) - (\w+ \w+) - (.+)<\/a>/.exec(titlePart);

    const credits = Number.parseInt(match(descriptionPart, /(\d+\.\d{3}) Credits$/m));
    const scheduleType = match(descriptionPart, /^(.+) Schedule Type$/m);
    const campus = match(descriptionPart, /^(.+) Campus$/m);
    const instructionalMethod = match(descriptionPart, /^(.+) Instructional Method$/m);

    const scheduleTypeIndex = cache(scheduleTypes, scheduleType);
    const campusIndex = cache(campuses, campus);
    const instructionalMethodIndex = cache(instructionalMethods, instructionalMethod);

    const meetings = meetingParts.map(meetingPart => {
      let [type, period, days, where, dateRange, scheduleType, instructors] = meetingPart.split('\n').slice(0, 7)
        .map(row => row.replace(/<\/?[^>]+(>|$)/g, ''));
      instructors = instructors.replace(/ +/g, ' ').split(', ');
      const dateRangeIndex = cache(dateRanges, dateRange);

      return [
        period,
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
      instructionalMethodIndex,
    ];
  });

  return { courses, dateRanges, scheduleTypes, campuses, instructionalMethods, updatedAt };
};

module.exports = parse;
