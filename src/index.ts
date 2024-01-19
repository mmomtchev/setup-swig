import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';
import * as cache from '@actions/cache';
import { Octokit } from '@octokit/core';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

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
    const shouldCache = await core.getBooleanInput('cache');

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

    const swigRoot = path.join(process.env.GITHUB_WORKSPACE!, 'swig');

    let cached = false;
    const cacheKey = `swig-${branch}-${tag.name}-${os.platform()}-${os.arch()}-${os.release()}`;
    if (shouldCache) {
      try {
        try {
          fs.accessSync(swigRoot, fs.constants.X_OK);
        } catch {
          await cache.restoreCache([swigRoot], cacheKey);
        }
        fs.accessSync(swigRoot, fs.constants.X_OK);
        core.info(`Found cached instance ${cacheKey}`);
        cached = true;
      } catch {
        core.info('Rebuilding from source');
      }
    }

    if (!cached) {
      core.info(`Downloading from ${tag.tarball_url}`);
      core.info(`Installing SWIG${branch !== 'main' ? `-${branch}` : ''} ${tag.name} in ${swigRoot}`);

      const swigArchive = await tc.downloadTool(tag.tarball_url);
      await tc.extractTar(swigArchive, swigRoot, ['-zx', '--strip-components=1']);

      await exec.exec('sh', ['autogen.sh'], { cwd: swigRoot });
      await exec.exec('sh', ['configure'], { cwd: swigRoot });
      await exec.exec('make', [], { cwd: swigRoot });

      await exec.exec('ln', ['-s', 'swig', `swig-${branch}`], { cwd: swigRoot });

      if (shouldCache) {
        await cache.saveCache([swigRoot], cacheKey);
        core.info(`Saved to cache ${cacheKey}`);
      }
    }

    core.exportVariable('SWIG_LIB', path.resolve(swigRoot, 'Lib'));
    core.exportVariable('PATH', swigRoot + ':' + process.env.PATH);
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
