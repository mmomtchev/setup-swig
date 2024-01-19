import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';
import { Octokit } from '@octokit/core';
import * as os from 'os';
import * as path from 'path';

const repos = {
  main: { owner: 'swig', repo: 'swig' },
  jse: { owner: 'mmomtchev', repo: 'swig' }
};

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function run() {
  try {
    if (os.platform() !== 'linux') {
      throw new Error('Only Linux runners are supported at the moment');
    }

    const version = process.env.SETUP_SWIG_VERSION || await core.getInput('version');
    const branch = process.env.SETUP_SWIG_BRANCH || await core.getInput('branch');

    if (!repos[branch]) throw new Error('Invalid branch');

    const tags = await octokit.request('GET /repos/{owner}/{repo}/tags', {
      owner: repos[branch].owner,
      repo: repos[branch].repo,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
      .then((tags) => Promise.all(tags.data.map(async (t) => {
        const date = new Date((await octokit.request('GET /repos/{owner}/{repo}/commits/{tag}', {
          tag: t.name,
          owner: repos[branch].owner,
          repo: repos[branch].repo,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        })).data.commit.author.date);
        return ({
          name: t.name,
          tarball_url: t.tarball_url,
          date
        });
      }))
        .then((tags) => tags.sort((a, b) => a.date.getTime() - b.date.getTime()).reverse()));

    const tag = version === 'latest' ? tags[0] : tags.find((t) => t.name === version);
    if (!tag) throw new Error('Invalid version');

    const target = path.join(process.env.GITHUB_WORKSPACE!, 'swig');
    core.info(`Installing SWIG${branch !== 'main' ? `-${branch}` : ''} ${tag.name} in ${target}`);

    const swigArchive = await tc.downloadTool(tag.tarball_url);
    const swigRoot = await tc.extractTar(swigArchive, target);

    await exec.exec('sh', ['autogen.sh'], { cwd: swigRoot });
    await exec.exec('sh', ['configure'], { cwd: swigRoot });
    await exec.exec('make', [], { cwd: swigRoot });

    core.exportVariable('SWIG_LIB', path.resolve(swigRoot, 'Lib'));
    core.exportVariable('PATH', process.env.PATH + ':' + swigRoot);
  } catch (error) {
    if (error &&
      typeof error === 'object' &&
      'message' in error &&
      (
        typeof error.message === 'string' ||
        error.message instanceof Error
      )) {
      core.setFailed(error.message);
    }
  }
}

run();
