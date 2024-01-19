import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';
import * as cache from '@actions/cache';
import * as io from '@actions/io';
import { Octokit } from '@octokit/core';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

const repos = {
  main: { owner: 'swig', repo: 'swig' },
  jse: { owner: 'mmomtchev', repo: 'swig' }
};

const octokit = new Octokit;

async function run() {
  try {
    if (os.platform() !== 'linux') {
      throw new Error('Only Linux runners are supported at the moment');
    }

    const version = await core.getInput('version');
    const branch = await core.getInput('branch');

    if (!repos[branch]) throw new Error('Invalid branch');

    const tags = await octokit.request('GET /repos/{owner}/{repo}/tags', {
      owner: repos[branch].owner,
      repo: repos[branch].repo,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }).then((tags) => tags.data.sort((a, b) => a.name.localeCompare(b.name)).reverse());

    const tag = version === 'last' ? tags[0] : tags.find((t) => t.name === version);
    if (!tag) throw new Error('Invalid version');

    const target = path.join(process.env.GITHUB_WORKSPACE!, 'swig');
    console.log(`Installing SWIG${branch !== 'main' ? `-${branch}` : ''} ${tag.name} in ${target}`);

    const swigArchive = await tc.downloadTool(tag.tarball_url);
    const swigRoot = await tc.extractTar(swigArchive, target);

    await exec.exec(`cd swig/swig-${version} && sh autogen.sh && ./configure && make`);

    core.exportVariable('SWIG_LIB', path.resolve(swigRoot, 'Lib'));
    core.exportVariable('PATH', process.env.PATH + ':' + swigRoot)
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
