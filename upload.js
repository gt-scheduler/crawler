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

const upload = (term_in, courses) =>
  octokit.repos.getContent({ owner, repo, path: '', ref: branch })
    .then(response => {
      const path = `${term_in}.json`;
      const content = Buffer.from(JSON.stringify(courses)).toString('base64');
      const file = response.data.find(file => file.path === path);
      return file ?
        octokit.repos.updateFile({
          owner,
          repo,
          path,
          message: `Update ${path}`,
          content,
          sha: file.sha,
          branch,
        }) :
        octokit.repos.createFile({
          owner,
          repo,
          path,
          message: `Create ${path}`,
          content,
          branch,
        });
    });

module.exports = upload;
