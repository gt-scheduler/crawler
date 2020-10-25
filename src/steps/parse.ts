import { cache, extract, match, regexExec } from '../utils';
import { Prerequisites } from './prereqs/parse';

/**
 * Primary JSON object returned by the API.
 * See https://github.com/GTBitsOfGood/gt-scheduler/issues/1#issuecomment-694326220
 * for more info on the shape
 */
export interface TermData {
  /**
   * Contains information about each class;
   * this makes up the vast bulk of the resultant JSON.
   * The course IDs are the keys (`"ACCT 2101"`, `"CS 2340"`, etc.)
   */
  courses: Record<string, Course>;
  /**
   * Contains data shared by multiple class descriptions
   */
  caches: Caches;
  /**
   * Contains the time this JSON file was retrieved
   */
  updatedAt: Date;
  /**
   * Version number for the term data
   */
  version: string;
}

/**
 * Contains data shared by multiple class descriptions
 */
export interface Caches {
  /**
   * List of all the different time ranges that classes can be offered at
   * (e.g. `"8:00 am - 8:50 am"`;
   * there is one `"TBA"` string for classes whose time is "To Be Announced")
   */
  periods: string[];
  /**
   * List of all possible start/ending dates that classes can be offered between
   * (e.g. `"Aug 17, 2020 - Dec 10, 2020"`)
   */
  dateRanges: string[];
  /**
   * List of the different types of classes for each time block
   * (e.g. `"Lecture*"`, `"Recitation*"`, or `"Internship/Practicum*"`)
   */
  scheduleTypes: string[];
  /**
   * List of the different GT campus locations that a class could take place at
   * (e.g. `"Georgia Tech-Atlanta *"` or `"Online"`)
   */
  campuses: string[];
  /**
   * List of other miscellaneous attributes that can be associated with a class
   * (e.g. `"Hybrid Course"`, `"Honors Program"`, or `"Capstone"`)
   */
  attributes: string[];
  /**
   * List of the different kinds of grading schemes a course can have
   */
  gradeBases: string[];
}

/**
 * Contains information about a single class
 * (**Note** that this is an **array** (tuple), not an object)
 */
export type Course = [
  /**
   * the full, human-readable name of the course (e.g. "Accounting I")
   */
  fullName: string,
  /**
   * a JSON object with information about each section of the course;
   * the section IDs are the keys (`"A"`, `"B"`, `"S2"`, etc.)
   */
  sections: Record<string, Section>,
  /**
   * a tree of prerequisite classes and the necessary grades in them
   * (using boolean expressions in prefix order)
   * 
   * @example
   * 
   * ```json
     [
       "and",
       [
          "or",
          {"id":"CS 3510", "grade":"C"},
          {"id":"CS 3511", "grade":"C"}
       ]
     ]
   * ```
   */
  prerequisites: Prerequisites,
];

/**
 * Contains  information about the course's section
 * (**Note** that this is an **array** (tuple), not an object)
 */
export type Section = [
  /**
   * the CRN number of this section of the course
   */
  crn: string,
  /**
   * array of information about the section's meeting times/places/professors/etc.;
   * in most cases, this array will only contain 1 item
   */
  meetings: Meeting[],
  /**
   * integer number of credit hours this course is worth
   */
  creditHours: number,
  /**
   * integer index into `caches.scheduleTypes`
   */
  scheduleTypeIndex: number,
  /**
   * integer index into `caches.campuses`,
   * specifying which campus the class is being taught at
   */
  campusIndex: number,
  /**
   * array of integer indices into `caches.attributes`,
   * specifying any additional attributes the course has
   */
  attributeIndices: number[],
  /**
   * integer index into caches.gradeBases,
   * specifying the grading scheme of the class
   */
  gradeBaseIndex: number,
];

class Location {
  lat: number
  long: number
  constructor(lat: number, long: number) {
    this.lat = lat
    this.long = long
  }
  
  getLatLong() {
    return {lat: this.lat, long: this.long}
  }
}

/* 
* A map consisting of course locations and corresponding coordinates 
*/
const courseLocations = new Map([
['Skiles', new Location(33.773568, -84.395957)],
['CULC', new Location(33.774909,  -84.396404)],
['Boggs', new Location(33.776085, -84.400181)],
]);

/**
 * Contains meeting information about a class section
 * (**Note** that this is an **array** (tuple), not an object)
 */
export type Meeting = [
  /**
   * an integer index into `caches.periods`,
   * specifying the class's start/end times
   */
  periodIndex: number,
  /**
   * a string specifying what days the class takes place on
   * (e.g. `"MW"` or `"TR"`)
   */
  days: string,
  /**
   * a string giving the room/location where the course will be held
   * (e.g. `"College of Business 224"`)
   */
  room: string,
  /**
   * an Object containing latitude and longitude for given course
   */
  location: Location | undefined,
  /**
   * an array of strings listing all the instructors for this section,
   * along with a 1-character code to mark the principal instructor
   * (e.g. `["Katarzyna Rubar (P)"]`)
   */
  instructors: string[],
  /**
   * an integer index into `caches.dateRanges`,
   * specifying the start/end date of the class this semester
   */
  dateRangeIndex: number,
];

export function parse(html: string, version: string): TermData {
  const courses: Record<string, Course> = {};
  const caches: Caches = {
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

    const [, courseTitle, crn, courseId, sectionId] = regexExec(/^<a href=".+">(.+) - (\d{5}) - (\w+ \w+) - (.+)<\/a>/, titlePart);

    const fields: Record<string, string | undefined> = extract(descriptionPart, /^<SPAN class="fieldlabeltext">(.+): <\/SPAN>(.+)$/mg, results => {
      const [, key, value] = results;
      return { key, value };
    }).reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {});
    const attributesKey = 'Attributes';
    const attributes = fields[attributesKey]?.split(',').map(attribute => attribute.trim()) ?? [];
    const gradeBasis = fields['Grade Basis'] ?? null;

    const credits = Number(match(descriptionPart, /(\d+\.\d{3}) Credits$/m));
    const scheduleType = match(descriptionPart, /^(.+) Schedule Type$/m);
    const campus = match(descriptionPart, /^(.+) Campus$/m);

    const scheduleTypeIndex = cache(caches.scheduleTypes, scheduleType);
    const campusIndex = cache(caches.campuses, campus);
    const attributeIndices = attributes.map(attribute => cache(caches.attributes, attribute));
    const gradeBasisIndex = cache(caches.gradeBases, gradeBasis);

    const meetings = meetingParts.map<Meeting>(meetingPart => {
      let [type, period, days, where, dateRange, scheduleType, instructorsString] = meetingPart.split('\n').slice(0, 7)
        .map(row => row.replace(/<\/?[^>]+(>|$)/g, ''));
      // convert string location to latitude, longitude coordinates
      const simplifiedLocation = Array.from(courseLocations.keys()).find(elem => where.includes(elem));
      let location = undefined;
      if (simplifiedLocation) {
        location = courseLocations.get(simplifiedLocation); 
      } 
      console.log(where)
      console.log(location)
      const instructors = instructorsString.replace(/ +/g, ' ').split(', ');
      const periodIndex = cache(caches.periods, period);
      const dateRangeIndex = cache(caches.dateRanges, dateRange);

      return [
        periodIndex,
        days,
        where,
        location,
        instructors,
        dateRangeIndex,
      ];
    });

    if (!(courseId in courses)) {
      const title = courseTitle;
      const sections: Record<string, Section> = {};
      courses[courseId] = [
        title,
        sections,
        [],
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

  return { courses, caches, updatedAt, version };
}
