import { Prerequisites } from "./parse";
import { TermData } from "../parse";

/**
 * Attaches course prerequisites to the data for the current term in-place
 * (*mutates the termData parameter*).
 * @param termData - Term data for all courses as parsed in previous steps
 * @param prerequisites - Global course Id -> prerequisites map as parsed in previous steps
 */
export function attachPrereqs(termData: TermData, prerequisites: Record<string, Prerequisites>): void {
    // TODO implement
}