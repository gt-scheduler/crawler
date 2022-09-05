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
  version: number;
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
  /**
   * List of the different building locations a class can be at
   */
  locations: Location[];
  /**
   * List of the all the dates on which finals are happening
   * Example date: Aug 02, 2022
   */
  finalDates: Date[];
  /**
   * List of the time blocks for finals
   * Example time: 11:20 am - 2:10 pm
   */
  finalTimes: string[];
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
  /**
   * Description pulled from Oscar
   */
  description: string | null
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
  gradeBaseIndex: number
];

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
   * an integer index into `caches.locations`,
   * containing the latitude and longitude for a given course
   */
  locationIndex: number,
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
  /**
   * integer index into caches.finalDates,
   * specifying the date at which the final is
   * -1 when no match could be found and
   * as a default value
   */
  finalDateIndex: number,
  /**
   * integer index into caches.finalTimes,
   * specifying the time at which the final is
   * -1 when no match could be found
   * and as a default value
   */
  finalTimeIdx: number
];

export type MinimumGrade = "A" | "B" | "C" | "D" | "T";
export type PrerequisiteCourse = { id: string; grade?: MinimumGrade };
export type PrerequisiteClause = PrerequisiteCourse | PrerequisiteSet;
export type PrerequisiteOperator = "and" | "or";
export type PrerequisiteSet = [
  operator: PrerequisiteOperator,
  ...clauses: PrerequisiteClause[]
];

/**
 * Location information about the building where a class takes place
 */
export class Location {
  lat: number;

  long: number;

  constructor(lat: number, long: number) {
    this.lat = lat;
    this.long = long;
  }
}

/**
 * Recursive data structure that is the sequence of all prerequisites in prefix notation,
 * parsed from the information on Oscar
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
export type Prerequisites = PrerequisiteSet | [];
