const parse = html => {
  const courses = {};

  const startIndex = html.indexOf('<caption class="captiontext">Sections Found</caption>');
  const endIndex = html.lastIndexOf('<table  CLASS="datadisplaytable" summary="This is for formatting of the bottom links." WIDTH="50%">');
  const body = html.slice(startIndex, endIndex);
  const sections = body.split('<tr>\n<th CLASS="ddtitle" scope="colgroup" >').slice(1);

  sections.forEach(section => {
    const [titlePart, descriptionPart, , ...meetingParts] = section.split('<tr>\n');

    const [, courseTitle, crn, courseId, sectionId] = /^<a href=".+">(.+) - (\d{5}) - (\w+ \d{4}) - (.+)<\/a>/.exec(titlePart);

    const scheduleType = /^(.+)\* Schedule Type$/m.exec(descriptionPart)[1];
    const credits = Number.parseInt(/^\s*(\d\.\d{3}) Credits$/m.exec(descriptionPart)[1]);

    const meetings = meetingParts.map(meetingPart => {
      let [type, period, days, where, dateRange, scheduleType, instructors] = meetingPart.split('\n').slice(0, 7)
        .map(row => /^<td CLASS="dddefault">(.+)<\/td>$/.exec(row)[1]);
      instructors = instructors.replace(/<\/?[^>]+(>|$)/g, '').replace(/ +/g, ' ').split(', ');

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
      scheduleType,
      credits,
    };
  });

  return courses;
};

module.exports = parse;
