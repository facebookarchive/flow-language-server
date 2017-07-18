/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @format
 */

import type {Reporter, VersionInfo} from './types';

import {ConfigCache} from 'nuclide-commons/ConfigCache';
import nuclideUri from 'nuclide-commons/nuclideUri';
import ini from 'ini';
import readPkgUp from 'read-pkg-up';
import fs from 'nuclide-commons/fsPromise';
import path from 'path';
import semver from 'semver';
import idx from 'idx';
import os from 'os';
import which from 'nuclide-commons/which';
import {downloadSemverFromGitHub} from './githubSemverDownloader';
import {getFlowDataDir, versionInfoForPath} from './utils';
import {getLogger} from 'log4js';

const BIN_NAME = process.platform === 'win32' ? 'flow.cmd' : 'flow';
const BINS_DIR = path.join(getFlowDataDir(), 'bin');

const flowConfigCache = new ConfigCache('.flowconfig');

const FLOW_BIN_PATH = process.platform === 'win32' ? 'node_modules/.bin/flow.cmd' : 'node_modules/.bin/flow';

type FlowBinForPathOptions = {
  tryFlowBin?: boolean,
  autoDownloadFlow?: boolean,
  semverDownloader?: (semversion: ?string, binsDir: string, reporter: Reporter) => Promise<VersionInfo>,
  reporter?: Reporter,
};

export async function flowBinForPath(
  rootPath: string,
  {
    tryFlowBin = false,
    autoDownloadFlow = true,
    semverDownloader = downloadSemverFromGitHub,
    reporter = getLogger('flow-versions'),
  }: FlowBinForPathOptions,
): Promise<?VersionInfo> {
  // get the version (or range) of flow we'll need for this path
  const semversion = await _flowSemverForRootPath(rootPath, reporter);
  if (semversion == null) {
    return;
  }
  reporter.info(`Looking for a version of flow matching ${semversion}...`);

  if (tryFlowBin) {
    const versionInfo = await versionInfoForPath(rootPath, nuclideUri.join(rootPath, FLOW_BIN_PATH));

    reporter.info('version info', versionInfo);
    if (versionInfo) {
      if (semver.satisfies(versionInfo.flowVersion, semversion)) {
        reporter.info('Using the flow bin in node_modules');
        return versionInfo;
      } else {
        reporter.error(
          'The version of flow-bin (declared in package.json) is incompatible ' +
            "with the range stated in the project's .flowconfig, and will not run.",
        );
        return;
      }
    } else {
      reporter.info('Unable to locate flow-bin in node_modules');
    }
  }

  // see if the system flow satisfies before downloading one
  const systemFlowPath = await which('flow');
  if (systemFlowPath) {
    const versionInfo = await versionInfoForPath(rootPath, systemFlowPath);
    if (versionInfo) {
      if (semver.satisfies(versionInfo.flowVersion, semversion)) {
        reporter.info(`Using the system flow at ${systemFlowPath}.`);
        return versionInfo;
      } else {
        reporter.info('System flow found, but does not satisfy the current project.');
      }
    } else {
      reporter.info('System flow not found.');
    }
  }

  if (autoDownloadFlow) {
    reporter.info('Checking the disk cache for a local copy of flow...');
    const fromDisk = await getFromDiskCache(semversion);
    if (fromDisk) {
      reporter.info(`Found flow version ${fromDisk.flowVersion} on disk.`);
      await fs.chmod(fromDisk.pathToFlow, '0755');
      return fromDisk;
    }

    reporter.info('No suitable flow found on disk');
    const dest = await semverDownloader(semversion, BINS_DIR, reporter);
    if (dest) {
      await fs.chmod(dest.pathToFlow, '0755');
      return dest;
    }
  }

  reporter.error('Unable to find a suitable version of flow.');
}

// exported to test
export async function _flowSemverForRootPath(rootPath: string, reporter: Reporter): Promise<?string> {
  const configDir = await flowConfigCache.getConfigDir(rootPath);
  reporter.info('Determining the version of flow for your project...');
  if (!configDir) {
    reporter.error('No valid .flowconfig was found. Use `flow init` in the root of your project to create one.');
    return;
  }
  const configPath = path.join(configDir, '.flowconfig');
  const {pkg, path: pkgPath} = await readPkgUp({cwd: rootPath});

  let packageFlowVersion;
  const depRange = idx(pkg, _ => _.dependencies['flow-bin']);
  const devDepRange = idx(pkg, _ => _.devDependencies['flow-bin']);
  if (depRange && semver.validRange(depRange)) {
    packageFlowVersion = depRange;
  } else if (devDepRange && semver.validRange(devDepRange)) {
    packageFlowVersion = devDepRange;
  }
  if (packageFlowVersion) {
    reporter.info(`Found flow version requirement ${packageFlowVersion} in your package.json`);
  }

  let configFlowVersion;
  if (configDir) {
    try {
      const configFileStr = await fs.readFile(configPath, 'utf-8');
      const flowConfig = ini.parse(configFileStr);
      if (typeof flowConfig.version === 'object') {
        const rawConfigVersion = Object.keys(flowConfig.version)[0];
        configFlowVersion = semver.validRange(rawConfigVersion) ? rawConfigVersion : null;
      }
    } catch (e) {
      reporter.error('Root dir contains missing or invalid flowconfig');
      return;
    }
  }

  if (configFlowVersion) {
    reporter.info(`Found flow version requirement ${configFlowVersion} in your .flowconfig`);
  }

  if (!configFlowVersion && !packageFlowVersion) {
    reporter.warn(
      'No valid version of flow specified in .flowconfig or flow-bin ' +
        'dependency of package.json. It is strongly recommended you specify a ' +
        'version in your .flowconfig.',
    );
  }

  return configFlowVersion || packageFlowVersion || '*';
}

async function getFromDiskCache(semversion: string): Promise<?VersionInfo> {
  let diskVersions;
  try {
    diskVersions = (await fs.readdir(BINS_DIR)).filter(semver.valid);
  } catch (e) {
    return null;
  }

  const foundVersion = diskVersions
    .sort((a, b) => -1 * semver.compare(a, b))
    .find(v => semver.satisfies(v, semversion));

  if (!foundVersion) {
    return;
  }

  const foundPath = path.join(BINS_DIR, foundVersion, BIN_NAME);
  if (await fs.stat(foundPath)) {
    return {
      pathToFlow: foundPath,
      flowVersion: foundVersion,
    };
  }
}
