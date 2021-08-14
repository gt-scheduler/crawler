import { TermData, Course, Caches, Meeting, Section, Location } from "../types";
import { cache, extract, match, regexExec } from "../utils";

/*
 * A map consisting of course locations and corresponding coordinates
 */
const courseLocations = new Map([
  ["Skiles", new Location(33.773568, -84.395957)],
  ["Clough Commons", new Location(33.774909, -84.396404)],
  ["Boggs", new Location(33.776085, -84.400181)],
  ["Architecture (West)", new Location(33.776076, -84.396114)],
  ["Architecture (East)", new Location(33.776177, -84.395459)],
  ["College of Business", new Location(33.776533, -84.387765)],
  ["Guggenheim", new Location(33.771771, -84.395796)],
  ["Van Leer", new Location(33.776065, -84.397116)],
  ["Bunger-Henry", new Location(33.775803, -84.398189)],
  ["Coll of Computing", new Location(33.777576, -84.397352)],
  ["Weber SST III", new Location(33.772949, -84.396066)],
  ["Engr Science & Mech", new Location(33.772114, -84.395289)],
  ["Mason", new Location(33.776764, -84.39844)],
  ["Love (MRDC II)", new Location(33.77672, -84.401764)],
  ["MRDC", new Location(33.777187, -84.400484)],
  ["Sustainable Education", new Location(33.77622, -84.397959)],
  ["Howey (Physics)", new Location(33.777622, -84.398785)],
  ["Instr Center", new Location(33.775587, -84.401213)],
  ["O'Keefe", new Location(33.779177, -84.392196)],
  ["Curran Street Deck", new Location(33.779495, -84.405633)],
  ["D. M. Smith", new Location(33.773801, -84.395122)],
  ["Swann", new Location(33.771658, -84.395302)],
  ["Kendeda", new Location(33.778759, -84.399597)],
  ["ES&T", new Location(33.779004, -84.395849)],
  ["Klaus", new Location(33.777107, -84.395817)],
  ["Cherry Emerson", new Location(33.778011, -84.397065)],
  ["U A Whitaker Biomedical Engr", new Location(33.778513, -84.396825)],
  ["Molecular Sciences & Engr", new Location(33.779836, -84.396666)],
  ["760 Spring Street", new Location(33.77561, -84.38906)],
  ["Paper Tricentennial", new Location(33.780983, -84.404516)],
  ["Daniel Lab", new Location(33.773714, -84.394047)],
  ["Pettit MiRC", new Location(33.776532, -84.397307)],
  ["Centergy", new Location(33.777062, -84.388997)],
  ["Stephen C Hall", new Location(33.774134, -84.39396)],
  ["Brittain T Room", new Location(33.77247, -84.391271)],
  ["Hefner Dormitory(HEF)", new Location(33.779159, -84.403952)],
  ["Old Civil Engr", new Location(33.7742, -84.394637)],
  ["Ivan Allen College", new Location(33.773989, -84.404269)], // TODO: Verify this?
  ["West Village Dining Commons", new Location(33.779564, -84.404718)],
  ["Couch", new Location(33.778233, -84.404507)],
  ["J. S. Coon", new Location(33.77258, -84.395624)],
  ["575 Fourteenth Street", new Location(33.786914, -84.406213)],
  ["Groseclose", new Location(33.775778, -84.401885)],
  ["Theater for the Arts", new Location(33.775041, -84.399287)],
]);

export function parse(html: string, version: number): TermData {
  const courses: Record<string, Course> = {};
  const caches: Caches = {
    periods: [],
    dateRanges: [],
    scheduleTypes: [],
    campuses: [],
    attributes: [],
    gradeBases: [],
    locations: [],
  };
  const updatedAt = new Date();

  const debugMissingLocations = new Map();

  const startIndex = html.indexOf(
    '<caption class="captiontext">Sections Found</caption>'
  );
  const endIndex = html.lastIndexOf(
    '<table  CLASS="datadisplaytable" summary="This is for formatting of the bottom links." WIDTH="50%">'
  );
  const body = html.slice(startIndex, endIndex);
  const sections = body
    .split('<tr>\n<th CLASS="ddtitle" scope="colgroup" >')
    .slice(1);

  sections.forEach((section) => {
    const [titlePart, descriptionPart, , ...meetingParts] =
      section.split("<tr>\n");

    const [, courseTitle, crn, courseId, sectionId] = regexExec(
      /^<a href=".+">(.+) - (\d{5}) - (\w+ \w+) - (.+)<\/a>/,
      titlePart
    );

    const fields: Record<string, string | undefined> = extract(
      descriptionPart,
      /^<SPAN class="fieldlabeltext">(.+): <\/SPAN>(.+)$/gm,
      (results) => {
        const [, key, value] = results;
        return { key, value };
      }
    ).reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {});
    const attributesKey = "Attributes";
    const attributes =
      fields[attributesKey]?.split(",").map((attribute) => attribute.trim()) ??
      [];
    const gradeBasis = fields["Grade Basis"] ?? null;

    const credits = Number(match(descriptionPart, /(\d+\.\d{3}) Credits$/m));
    const scheduleType = match(descriptionPart, /^(.+) Schedule Type$/m);
    const campus = match(descriptionPart, /^(.+) Campus$/m);

    const scheduleTypeIndex = cache(caches.scheduleTypes, scheduleType);
    const campusIndex = cache(caches.campuses, campus);
    const attributeIndices = attributes.map((attribute) =>
      cache(caches.attributes, attribute)
    );
    const gradeBasisIndex = cache(caches.gradeBases, gradeBasis);

    const meetings = meetingParts.map<Meeting>((meetingPart) => {
      const [
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _type,
        period,
        days,
        where,
        dateRange,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _scheduleType,
        instructorsString,
      ] = meetingPart
        .split("\n")
        .slice(0, 7)
        .map((row) => row.replace(/<\/?[^>]+(>|$)/g, ""));

      // convert string location to latitude, longitude coordinates
      const locationName = Array.from(courseLocations.keys()).find((locName) =>
        where.includes(locName)
      );
      let location;
      if (locationName) {
        location = courseLocations.get(locationName);
      } else {
        debugMissingLocations.set(where, false);
      }

      const instructors = instructorsString.replace(/ +/g, " ").split(", ");
      const periodIndex = cache(caches.periods, period);
      const dateRangeIndex = cache(caches.dateRanges, dateRange);
      const locationIndex = cache(caches.locations, location || null);

      return [
        periodIndex,
        days,
        where,
        locationIndex,
        instructors,
        dateRangeIndex,
      ];
    });

    if (!(courseId in courses)) {
      const title = courseTitle;
      const sectionsMap: Record<string, Section> = {};
      courses[courseId] = [
        title,
        sectionsMap,
        // Start off with an empty prerequisites array
        [],
        // Start off with no description
        null,
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

  if (debugMissingLocations.size > 0) {
    console.log("Unknown class locations:");
    console.log(debugMissingLocations.keys());
  }

  return { courses, caches, updatedAt, version };
}
