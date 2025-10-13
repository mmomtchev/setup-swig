import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';
import * as cache from '@actions/cache';
import { Octokit } from '@octokit/core';
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { Readable } from 'node:stream';
import * as tar from 'tar';

const repos = {
  main: { owner: 'swig', repo: 'swig' },
  jse: { owner: 'mmomtchev', repo: 'swig' }
};

let token: string = undefined;
const inputToken = core.getInput('token', { required: false });
const envToken = process.env.GITHUB_TOKEN;

const verbose = core.getBooleanInput('verbose', { required: false });
const branch = core.getInput('branch', { required: false });
const version = core.getInput('version', { required: false });
const shouldCache = core.getBooleanInput('cache', { required: false });
const alwaysBuild = core.getBooleanInput('build', { required: false });

const swigRoot = path.join(process.env.RUNNER_TOOL_CACHE!, 'swig');

if (verbose)
  core.info(`setup-swig ${require('../package.json').version} ${require('./git.json').git}`);

if (inputToken) {
  core.info('Using authentication token passed as input');
  token = inputToken;
} else if (envToken) {
  core.info('Using authentication token from the environment');
  token = envToken;
} else {
  core.info('Not using authentication, pass token argument if you get API rate errors');
}

const octokit = new Octokit({ auth: token });

async function binary() {
  try {
    if (verbose) core.info(`Checking for a binary release for SWIG-${branch}, version ${version}`);

    const releases = (await octokit.request('GET /repos/{owner}/{repo}/releases', {
      owner: repos[branch].owner,
      repo: repos[branch].repo,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })).data;

    let release: typeof releases[0] = null;

    if (version === 'latest') {
      releases.sort((b, a) => Date.parse(a.created_at) - Date.parse(b.created_at));
      release = releases[0];
    } else if (releases.find((t) => t.tag_name === version || t.tag_name === `v${version}`)) {
      release = releases.find((t) => t.tag_name === version || t.tag_name === `v${version}`);
    } else {
      core.warning(`Cannot find release for tag ${version}`);
      return false;
    }

    if (release.assets.length > 0) {
      if (verbose) core.info(`Release ${release.name}, tag ${release.tag_name} contains binaries`);
      const id = `${os.platform()}-${os.arch()}`;
      const asset = release.assets.find((a) => a.name === `${id}.tar.gz`);
      if (asset) {
        core.info(`Found binary distribution for ${id}`);
      } else {
        core.info(`No binary distribution found for ${id}`);
        return false;
      }
      if (verbose) core.info(`Downloading from ${asset.browser_download_url}`);
      const dist = await octokit.request('GET /repos/{owner}/{repo}/releases/assets/{asset_id}', {
        owner: repos[branch].owner,
        repo: repos[branch].repo,
        asset_id: asset.id,
        headers: {
          'Accept': 'application/octet-stream',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });

      await (new Promise<void>((resolve, reject) => {
        const output = tar.extract({
          cwd: process.env.RUNNER_TOOL_CACHE!,
          onReadEntry: verbose ?
            (e) => {
              core.info(` - ${e.path}`);
            } : undefined
        });
        output.on('close', resolve);
        output.on('error', reject);
        const tarData = Readable.from(Buffer.from(dist.data as unknown as ArrayBuffer));
        tarData.pipe(output);
        if (verbose) core.info('Uncompressing archive');
      }));

      core.info(`Binary distribution of SWIG-${branch} ${release.name} successfully installed in ${swigRoot}`);
      const exePath = path.join(swigRoot, 'bin');
      core.exportVariable('PATH', exePath + path.delimiter + process.env.PATH);
      if (verbose)
        core.info(`PATH=${process.env.PATH}`);
    } else {
      core.info(`Release ${release.name}, tag ${release.tag_name} contains no binaries`);
      return false;
    }

    return true;
  } catch (e) {
    core.error(e.message);
    return false;
  }
}

async function build() {
  if (os.platform() !== 'linux') {
    throw new Error('Rebuilding from source is supported only on Linux runners at the moment');
  }

  if (!repos[branch]) throw new Error('Invalid branch');

  if (verbose) core.info(`Building from source SWIG-${branch}-${version}`);

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
  } else if (tags.find((t) => t.name === version || t.name == `v${version}`)) {
    tag = tags.find((t) => t.name === version || t.name == `v${version}`);
  } else {
    tag = {
      name: version,
      tarball_url: `https://github.com/${repos[branch].owner}/${repos[branch].repo}/archive/${version}.tar.gz`
    };
  }

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
}

async function run() {
  try {
    if (!alwaysBuild) {
      if (await binary()) {
        core.info('Installed binary release');
        return;
      }
    }
    await build();
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
