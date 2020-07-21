import axios from 'axios';
import { extract } from '../utils';

export function list() {
  return axios.post<string>(
    'https://oscar.gatech.edu/pls/bprod/bwckctlg.p_disp_dyn_ctlg',
  ).then(res => {
    const { data } = res;
    const terms = extract(data, /<OPTION VALUE="(\d+)">/g, execArray => execArray[1]);
    return terms.filter(term => {
      const month = Number(term.slice(4));
      return 1 <= month && month <= 12;
    });
  });
}
