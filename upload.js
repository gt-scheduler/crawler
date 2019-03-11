const Octokit = require('@octokit/rest');

const { GITHUB_TOKEN } = process.env;

const octokit = new Octokit();
octokit.authenticate({
  type: 'oauth',
  token: GITHUB_TOKEN,
});

const owner = 'parkjs814';
const repo = 'gt-schedule-crawler';
const branch = 'gh-pages';

const uploadFile = (path, json, files) => {
  const file = files.find(file => file.path === path);
  const content = Buffer.from(JSON.stringify(json)).toString('base64');
  return file ?
    octokit.repos.updateFile({
      owner,
      repo,
      path,
      message: `Update ${path}`,
      content,
      sha: file.sha,
      branch,
    }).then(() => false) :
    octokit.repos.createFile({
      owner,
      repo,
      path,
      message: `Create ${path}`,
      content,
      branch,
    }).then(() => true);
};

const upload = (term_in, courses) =>
  octokit.repos.getContent({ owner, repo, path: '', ref: branch })
    .then(response => {
      const files = response.data;
      const path = `${term_in}.json`;
      return uploadFile(path, courses, files).then(created => {
        if (created) {
          const term_ins = files.map(file => file.path.split('.')[0]).filter(filename => /\d{6}/.test(filename));
          term_ins.push(term_in);
          term_ins.sort();
          console.log(`Updating 'term_ins.json' ...`);
          return uploadFile('term_ins.json', term_ins, files);
        }
      });
    });

module.exports = upload;
