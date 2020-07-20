const axios = require('axios');

const concatParams = params => Object.entries(params).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');

const download = (term, options = {}) => {
  const {
    subject = '',
    course = '',
    title = '',
  } = options;
  const dummyParams = [
    'sel_subj',
    'sel_day',
    'sel_schd',
    'sel_insm',
    'sel_camp',
    'sel_levl',
    'sel_sess',
    'sel_instr',
    'sel_ptrm',
    'sel_attr',
  ].reduce((acc, dummyKey) => ({ ...acc, [dummyKey]: 'dummy' }), {});
  const params = {
    term_in: term,
    sel_subj: subject,
    sel_crse: course,
    sel_title: title,
    sel_schd: '%',
    sel_from_cred: '',
    sel_to_cred: '',
    sel_camp: '%',
    sel_ptrm: '%',
    sel_instr: '%',
    sel_attr: '%',
    begin_hh: '0',
    begin_mi: '0',
    begin_ap: 'a',
    end_hh: '0',
    end_mi: '0',
    end_ap: 'a',
  };
  return axios.post(
    'https://oscar.gatech.edu/pls/bprod/bwckschd.p_get_crse_unsec',
    [dummyParams, params].map(concatParams).join('&'),
  ).then(res => res.data);
};

module.exports = download;
