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
    const verbose = core.getBooleanInput('verbose', { required: false });
    if (verbose) core.info(`setup-swig ${require('../package.json').version} ${require('./git.json').git}`);
    if (os.platform() !== 'linux') {
      throw new Error('Only Linux runners are supported at the moment');
    }

    const version = core.getInput('version', { required: false });
    const branch = core.getInput('branch', { required: false });
    const shouldCache = core.getBooleanInput('cache', { required: false });

    if (!repos[branch]) throw new Error('Invalid branch');
    if (verbose) core.info(`Retrieving SWIG-${branch}-${version}`);

    const tags = (await octokit.request('GET /repos/{owner}/{repo}/tags', {
      owner: repos[branch].owner,
      repo: repos[branch].repo,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })).data;
    if (verbose) tags.forEach((t) => core.info(`Found tag ${t.name}`));

    let tag: {
      name: string;
      tarball_url: string;
    };
    if (version === 'latest') {
      tag = tags[0];
    } else if (tags.find((t) => t.name === version)) {
      tag = tags.find((t) => t.name === version);
    } else {
      tag = {
        name: version,
        tarball_url: `https://github.com/${repos[branch].owner}/${repos[branch].repo}/archive/${version}.tar.gz`
      };
    }

    const swigRoot = path.join(process.env.RUNNER_TOOL_CACHE!, 'swig');

    let cached = false;
    const cacheKey = `swig-${branch}-${tag.name}-${os.platform()}-${os.arch()}-${os.release()}`;
    if (verbose) core.info(`Using cacheKey ${cacheKey}, swigRoot ${swigRoot}`);
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
        try {
          await cache.saveCache([swigRoot], cacheKey);
          core.info(`Saved to cache ${cacheKey}`);
        } catch (e) {
          core.notice(`Failed saving SWIG to cache with key ${cacheKey}, ` +
            `Github API responded "${e.message}, ` +
            'next install will rebuild from source, ' +
            'if this happens intermittently, it may be a temporary Github problem or ' + 
            'a conflict between concurrent install jobs.');
        }
      }
    }

    core.exportVariable('SWIG_LIB', path.resolve(swigRoot, 'Lib'));
    core.exportVariable('PATH', swigRoot + ':' + process.env.PATH);
    if (verbose) core.info(`exporting SWIG_LIB=${path.resolve(swigRoot, 'Lib')} PATH=${swigRoot + ':' + process.env.PATH}`);
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
