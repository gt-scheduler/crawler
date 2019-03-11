const axios = require('axios');

const list = () => axios.post(
  'https://oscar.gatech.edu/pls/bprod/bwckctlg.p_disp_dyn_ctlg',
).then(res => {
  const { data } = res;
  const term_ins = [];
  data.replace(/<OPTION VALUE="(\d+)">/g, (match, term_in) => term_ins.push(term_in));
  return term_ins.filter(term_in => {
    const month = Number(term_in.slice(4));
    return 1 <= month && month <= 12;
  });
});

module.exports = list;
