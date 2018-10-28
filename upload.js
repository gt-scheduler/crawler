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
const path = 'courses.json';

const upload = courses =>
  octokit.repos.getContent({ owner, repo, path: '', ref: branch })
    .then(response => octokit.repos.updateFile({
      owner,
      repo,
      path,
      message: `Update ${path}`,
      content: Buffer.from(JSON.stringify(courses)).toString('base64'),
      sha: response.data.find(file => file.path === path).sha,
      branch,
    }));

module.exports = upload;
