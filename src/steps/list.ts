import axios from "axios";
import { getIntConfig } from "../utils";

const NUM_TERMS = getIntConfig("NUM_TERMS") ?? 2;

export type TermData = {
  code: string;
  description: string;
};

export async function list(): Promise<string[]> {
  const queryNum = 3 * NUM_TERMS + 10;

  const response = await axios.post<TermData[]>(
    `https://registration.banner.gatech.edu/StudentRegistrationSsb/ssb/courseSearch/getTerms?searchTerm=&offset=1&max=${queryNum}`
  );
  const { data } = response;

  const terms = data.map((term) => term.code);
  return terms.filter((term) => {
    const month = Number(term.slice(4));
    return month >= 1 && month <= 12;
  });
}
