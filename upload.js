const Octokit = require('@octokit/rest');

const { GITHUB_TOKEN } = process.env;

const octokit = new Octokit();
octokit.authenticate({
  type: 'oauth',
  token: GITHUB_TOKEN,
});

const branch = 'gh-pages';
const fileInfo = {
  owner: 'parkjs814',
  repo: 'gt-schedule-crawler',
  path: 'courses.json',
};

const upload = courses =>
  octokit.repos.getContent({ ...fileInfo, ref: branch })
    .then(response => octokit.repos.updateFile({
      ...fileInfo,
      branch,
      sha: response.data.sha,
      message: 'Update courses.json',
      content: Buffer.from(JSON.stringify(courses)).toString('base64'),
    }));

module.exports = upload;
