const axios = require('axios');

const list = () => axios.post(
  'https://oscar.gatech.edu/pls/bprod/bwckctlg.p_disp_dyn_ctlg',
).then(res => {
  const { data } = res;
  const terms = [];
  data.replace(/<OPTION VALUE="(\d+)">/g, (match, term) => terms.push(term));
  return terms.filter(term => {
    const month = Number(term.slice(4));
    return 1 <= month && month <= 12;
  });
});

module.exports = list;
