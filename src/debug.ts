import path from "path";
import fs from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import { dataPath } from "./steps/write";
import {
  Caches,
  TermData,
  Location,
  Prerequisites,
  Corequisites,
  Restriction,
} from "./types";

type MeetingDebug = {
  periodIndex: number;
  period: string;
  days: string;
  room: string;
  locationIndex: number;
  location: Location | null;
  instructors: string[];
  dateRangeIndex: number;
  dateRange: string;
  finalDateIndex: number;
  finalDate: string | null;
  finalTimeIdx: number;
  finalTime: string | null;
};

type SectionDebug = {
  crn: string;
  meetings: MeetingDebug[];
  creditHours: number;
  scheduleTypeIndex: number;
  scheduleType: string;
  campusIndex: number;
  campus: string;
  attributeIndices: number[];
  attributes: string[];
  gradeBaseIndex: number;
  gradeBase: string | null;
  sectionTitle: string;
  restrictions:
    | { allowed: DecodedRestriction[]; disallowed: DecodedRestriction[] }
    | [];
};

type DecodedRestriction = {
  category: string;
  value: string;
};

type CourseDebug = {
  fullName: string;
  sections: Record<string, SectionDebug>;
  prerequisites: Prerequisites | [];
  description: string | null;
  corequisites: Corequisites | [];
};

type TermDebug = {
  courses: Record<string, CourseDebug>;
  caches: Caches;
  updatedAt: string | Date;
  version: number;
};

function safeGet<T>(arr: T[], idx: number): T | null {
  if (idx == null || Number.isNaN(idx)) return null;
  if (idx < 0 || idx >= arr.length) return null;
  return arr[idx];
}

async function readJsonFile<T>(file: string): Promise<T> {
  const buf = await fs.readFile(file, "utf8");
  return JSON.parse(buf) as T;
}

async function writePrettyJson(file: string, data: unknown): Promise<void> {
  const content = JSON.stringify(data, null, 2);
  await fs.writeFile(file, `${content}\n`, "utf8");
}

function toDebugTerm(term: TermData): TermDebug {
  const { caches } = term;

  const courses: Record<string, CourseDebug> = {};

  for (const [courseId, courseTuple] of Object.entries(term.courses)) {
    const [fullName, sectionsMap, prerequisites, description, corequisites] =
      courseTuple;

    const sections: Record<string, SectionDebug> = {};
    for (const [sectionId, sectionTuple] of Object.entries(sectionsMap)) {
      const [
        crn,
        meetingsTuples,
        creditHours,
        scheduleTypeIndex,
        campusIndex,
        attributeIndices,
        gradeBaseIndex,
        sectionTitle = fullName,
        restrictionData,
      ] = sectionTuple;

      const scheduleType =
        safeGet(caches.scheduleTypes, scheduleTypeIndex) ?? "";
      const campus = safeGet(caches.campuses, campusIndex) ?? "";
      const attributes = attributeIndices
        .map((i) => safeGet(caches.attributes, i))
        .filter((x): x is string => x != null);
      const gradeBase =
        gradeBaseIndex >= 0 ? safeGet(caches.gradeBases, gradeBaseIndex) : null;

      const meetings: MeetingDebug[] = meetingsTuples.map((m) => {
        const [
          periodIndex,
          days,
          room,
          locationIndex,
          instructors,
          dateRangeIndex,
          finalDateIndex,
          finalTimeIdx,
        ] = m;

        const period = safeGet(caches.periods, periodIndex) ?? "";
        const dateRange = safeGet(caches.dateRanges, dateRangeIndex) ?? "";
        const location = safeGet(caches.locations, locationIndex) ?? null;
        const finalDate =
          finalDateIndex >= 0
            ? (safeGet(caches.finalDates, finalDateIndex) as
                | string
                | Date
                | null)
            : null;
        const finalTime =
          finalTimeIdx >= 0 ? safeGet(caches.finalTimes, finalTimeIdx) : null;

        return {
          periodIndex,
          period,
          days,
          room,
          locationIndex,
          location,
          instructors,
          dateRangeIndex,
          dateRange,
          finalDateIndex,
          finalDate: finalDate != null ? String(finalDate) : null,
          finalTimeIdx,
          finalTime,
        };
      });

      let decodedRestrictions: SectionDebug["restrictions"] = [];
      if (restrictionData && restrictionData.length === 2) {
        const [allowed, disallowed] = restrictionData as [
          Restriction[],
          Restriction[]
        ];

        const decode = (tuples: Restriction[]): DecodedRestriction[] =>
          tuples.map(([catIdx, valIdx]) => {
            const category =
              safeGet(caches.restrictions, catIdx) ?? "Unknown Category";
            let value = "Unknown Value";

            if (category.toLowerCase().includes("campus")) {
              value = safeGet(caches.campuses, valIdx) ?? "Unknown Campus";
            } else {
              const subCache = caches.restrictionValues?.[category];
              if (subCache) {
                value = safeGet(subCache, valIdx) ?? "Unknown Value";
              }
            }
            return { category, value };
          });

        decodedRestrictions = {
          allowed: decode(allowed),
          disallowed: decode(disallowed),
        };
      }

      sections[sectionId] = {
        crn,
        meetings,
        creditHours,
        scheduleTypeIndex,
        scheduleType,
        campusIndex,
        campus,
        attributeIndices,
        attributes,
        gradeBase,
        gradeBaseIndex,
        sectionTitle,
        restrictions: decodedRestrictions,
      };
    }

    courses[courseId] = {
      fullName,
      sections,
      prerequisites,
      description,
      corequisites,
    };
  }

  return {
    courses,
    caches: term.caches,
    updatedAt: term.updatedAt,
    version: term.version,
  };
}

async function ensureDebugDir(debugDir: string): Promise<void> {
  if (!existsSync(debugDir)) mkdirSync(debugDir, { recursive: true });
}

async function listDataFiles(): Promise<string[]> {
  const files = await fs.readdir(dataPath);
  // Include only term JSON files like 202408.json, skip index.json and debug dir
  const dataFileRegex = /^20\d{4}\.json$/;
  return files
    .filter((f) => dataFileRegex.test(f))
    .map((f) => path.join(dataPath, f));
}

async function run(): Promise<void> {
  const arg = process.argv[2]; // optional: specific file path or file name
  const debugDir = path.join(dataPath, "debug");
  await ensureDebugDir(debugDir);

  const targets =
    arg != null
      ? [path.isAbsolute(arg) ? arg : path.join(dataPath, arg)]
      : await listDataFiles();

  for (const file of targets) {
    const base = path.basename(file);
    const out = path.join(debugDir, base);
    const term = await readJsonFile<TermData>(file);
    const debugTerm = toDebugTerm(term);
    await writePrettyJson(out, debugTerm);
    // eslint-disable-next-line no-console
    console.log(`Wrote debug: ${out}`);
  }
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
