import axios from "axios";
import { extract } from "../utils";

export async function list(): Promise<string[]> {
  const response = await axios.post<string>(
    "https://oscar.gatech.edu/pls/bprod/bwckctlg.p_disp_dyn_ctlg"
  );
  const { data } = response;
  const terms = extract(
    data,
    /<OPTION VALUE="(\d+)">/g,
    (execArray) => execArray[1]
  );
  return terms.filter((term) => {
    const month = Number(term.slice(4));
    return month >= 1 && month <= 12;
  });
}
