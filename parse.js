const parse = html => {
  const courses = {};
  let termDateRange = null;

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
      if (!termDateRange && dateRange) termDateRange = dateRange;

      return {
        period,
        days,
        where,
        instructors,
      };
    });

    if (!(courseId in courses)) {
      courses[courseId] = {
        title: courseTitle,
        sections: {},
      };
    }
    courses[courseId].sections[sectionId] = {
      crn,
      meetings,
      credits,
    };
  });

  return { courses, dateRange: termDateRange };
};

module.exports = parse;
