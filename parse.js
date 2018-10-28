const cheerio = require('cheerio');

const parse = html => {
  const $ = cheerio.load(html);
  const headerCols = $('.pagebodydiv > .datadisplaytable > tbody > tr > .ddtitle');

  const courses = {};
  headerCols.each(sectionIndex => {
    const headerCol = headerCols.eq(sectionIndex);
    const bodyCol = headerCols.parent().next().children('.dddefault');

    const headerText = headerCol.text();
    const headerTokens = headerText.split(' - ');
    const sectionId = headerTokens.pop();
    const courseId = headerTokens.pop();
    const crn = headerTokens.pop();
    const courseTitle = headerTokens.join(' - ');

    const bodyText = bodyCol.text();
    const scheduleType = /^(.+)\* Schedule Type$/m.exec(bodyText)[1];
    const credits = Number.parseInt(/^\s*(\d\.\d{3}) Credits$/m.exec(bodyText)[1]);

    const meetingRows = bodyCol.find('.datadisplaytable > tbody > tr').slice(1);
    const meetings = meetingRows.map(meetingIndex => {
      const meetingRow = meetingRows.eq(meetingIndex);
      const meetingText = meetingRow.text();
      const meetingTokens = meetingText.split('\n');
      let [, type, period, days, where, dateRange, scheduleType, instructors] = meetingTokens;
      instructors = instructors.replace(/ +/g, ' ').split(', ');
      return {
        period,
        days,
        where,
        instructors,
      };
    }).get();

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
