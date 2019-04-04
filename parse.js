const parse = html => {
  const courses = {};
  let dateRanges = [];
  let scheduleTypes = [];

  const startIndex = html.indexOf('<caption class="captiontext">Sections Found</caption>');
  const endIndex = html.lastIndexOf('<table  CLASS="datadisplaytable" summary="This is for formatting of the bottom links." WIDTH="50%">');
  const body = html.slice(startIndex, endIndex);
  const sections = body.split('<tr>\n<th CLASS="ddtitle" scope="colgroup" >').slice(1);

  sections.forEach(section => {
    const [titlePart, descriptionPart, , ...meetingParts] = section.split('<tr>\n');

    const [, courseTitle, crn, courseId, sectionId] = /^<a href=".+">(.+) - (\d{5}) - (\w+ \w+) - (.+)<\/a>/.exec(titlePart);

    const credits = Number.parseInt(/(\d\.\d{3}) Credits$/m.exec(descriptionPart)[1]);

    const meetings = meetingParts.map(meetingPart => {
      let [type, period, days, where, dateRange, scheduleType, instructors] = meetingPart.split('\n').slice(0, 7)
        .map(row => row.replace(/<\/?[^>]+(>|$)/g, ''));
      instructors = instructors.replace(/ +/g, ' ').split(', ');
      let dateRangeIndex = dateRanges.indexOf(dateRange);
      if (!~dateRangeIndex) {
        dateRanges.push(dateRange);
        dateRangeIndex = dateRanges.length - 1;
      }
      let scheduleTypeIndex = scheduleTypes.indexOf(scheduleType);
      if (!~scheduleTypeIndex) {
        scheduleTypes.push(scheduleType);
        scheduleTypeIndex = scheduleTypes.length - 1;
      }

      return [
        period,
        days,
        where,
        instructors,
        dateRangeIndex,
        scheduleTypeIndex,
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
    ];
  });

  return { courses, dateRanges, scheduleTypes };
};

module.exports = parse;
