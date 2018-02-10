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

import type {VersionInfo} from './types';

import path from 'path';
import os from 'os';
import {runCommand} from 'nuclide-commons/process';

const platform = process.platform;

export async function versionInfoForPath(
  rootPath: string,
  pathToFlow: string,
): Promise<?VersionInfo> {
  let output;
  try {
    output = JSON.parse(
      await runCommand(pathToFlow, ['version', '--json'], {
        cwd: rootPath,
      }).toPromise(),
    );
  } catch (e) {
    return null;
  }

  return {
    pathToFlow: output.binary,
    flowVersion: output.semver,
  };
}

export function getFlowDataDir() {
  return path.join(
    getLocalDataDirRoot(),
    platform === 'darwin' || platform === 'win32' ? 'Flow' : 'flow',
  );
}

function getLocalDataDirRoot(): string {
  const fallback = path.join(os.homedir(), '.local', 'share');

  switch (platform) {
    case 'darwin':
      return path.join(os.homedir(), 'Library');
    case 'win32':
      return process.env.APPDATA || fallback;
    default:
      return process.env.XDG_DATA_HOME || fallback;
  }
}
