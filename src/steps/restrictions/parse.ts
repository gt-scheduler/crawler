import { load } from "cheerio";
import { warn } from "../../log";
import { Caches, FetchedRestrictions, Restriction } from "../../types";
import { cache } from "../../utils";

/**
 * Parses HTML restriction data into structured format
 * @param html - Raw HTML from getRestrictions endpoint
 * @param crn - Course Reference Number (for logging)
 * @param downloadSuccess - Whether the download was successful
 * @param caches - The global caches object to store and index string values
 * @returns Restriction data with status
 */
export function parseSectionRestrictions(
  html: string,
  crn: string,
  downloadSuccess: boolean,
  caches: Caches
): FetchedRestrictions {
  // If download failed, return fetch-error status
  if (!downloadSuccess) {
    return {
      restrictions: [],
      status: "fetch-error",
    };
  }

  if (!html || html.trim().length === 0) {
    // Empty HTML means no restrictions (successful fetch, no data)
    return {
      restrictions: [],
      status: "success",
    };
  }

  try {
    const $ = load(html);
    const allowed: Restriction[] = [];
    const disallowed: Restriction[] = [];
    // The HTML structure contains text nodes with restriction rules
    const text = $.text();
    // Split by common patterns
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    let currentCategory = "";
    let currentAllowed = true;
    let valueBuffer = ""; // Holds fragmented lines until they are complete

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      const headerMatch = line.match(
        /(?:Cannot|Must) be enrolled in (?:one of )?the following (.*?):?$/i
      );

      if (headerMatch || line.endsWith(":")) {
        // --- HEADER LOGIC ---
        if (lowerLine.startsWith("cannot")) {
          currentAllowed = false;
        } else if (lowerLine.startsWith("must")) {
          currentAllowed = true;
        }

        const rawCategory = headerMatch
          ? headerMatch[1].trim()
          : line.slice(0, -1).trim();

        // Validate restriction category is all alphabet string
        if (!rawCategory || !/^[a-zA-Z\s]+$/.test(rawCategory)) {
          currentCategory = "";
        } else {
          currentCategory = rawCategory;
        }

        valueBuffer = ""; // Clear the buffer anytime we hit a new header
      } else if (currentCategory) {
        // --- VALUE LOGIC ---
        // (We only enter this block if it's NOT a header AND we have a known category)

        // We expect all values to end with ")", EXCEPT for "Special Approvals"
        const isSpecialApprovals = currentCategory
          .toLowerCase()
          .includes("special approval");
        const isCompleteValue = isSpecialApprovals || line.endsWith(")");

        if (!isCompleteValue) {
          // It's a fragment; add to buffer and move to next line
          valueBuffer = valueBuffer ? `${valueBuffer} ${line}` : line;
        } else {
          const fullLine = valueBuffer ? `${valueBuffer} ${line}` : line;
          valueBuffer = "";

          const valueMatch = fullLine.match(/^(.+?)(?:\s*\(([^)]+)\))?\s*$/);

          if (valueMatch) {
            const name = valueMatch[1].trim();
            const code = valueMatch[2] ? valueMatch[2].trim() : null;
            let valueName = code ? `${name} (${code})` : name;

            const categoryIdx = cache(caches.restrictions, currentCategory);

            let targetCache: string[];
            if (currentCategory.toLowerCase().includes("campus")) {
              targetCache = caches.campuses;

              const normalize = (s: string): string =>
                s
                  .replace(/&amp;/g, "&")
                  .replace(/[^a-z0-9]/gi, "")
                  .toLowerCase();

              const normalizedName = normalize(name);

              // Find if this campus already exists in the cache (ignoring the (Code))
              const existingCampus = targetCache.find(
                (c) => normalize(c) === normalizedName
              );

              if (existingCampus) {
                valueName = existingCampus; // Use the exact string already in the cache
              } else {
                valueName = name; // Fallback: use the name without the code
              }
            } else {
              if (caches.restrictionValues[currentCategory] === undefined) {
                // eslint-disable-next-line no-param-reassign
                caches.restrictionValues[currentCategory] = [];
              }
              targetCache = caches.restrictionValues[currentCategory];
            }

            const valueIdx = cache(targetCache, valueName);
            const restrictionTuple: Restriction = [categoryIdx, valueIdx];

            if (currentAllowed) {
              allowed.push(restrictionTuple);
            } else {
              disallowed.push(restrictionTuple);
            }
          }
        }
      }
    }

    const finalRestrictions: [Restriction[], Restriction[]] | [] =
      allowed.length > 0 || disallowed.length > 0 ? [allowed, disallowed] : [];

    return {
      restrictions: finalRestrictions,
      status: "success",
    };
  } catch (err) {
    warn(`failed to parse restrictions`, { crn, error: String(err) });
    return {
      restrictions: [],
      status: "parse-error",
    };
  }
}
