/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * @flow
 */

import invariant from 'assert';
import {getRuntimeInformation} from '../../commons-node/runtime-info';
import {
  isRunningInClient,
  isRunningInTest,
} from '../../commons-node/system-info';
import scheduleIdleCallback from '../../commons-node/scheduleIdleCallback';
import trackImpl from './track';

let appSessionID = null;
function initializeAppSessionID(): void {
  if (!isRunningInClient() || isRunningInTest()) {
    appSessionID = '';
    return;
  }

  // eslint-disable-next-line
  const {remote, ipcRenderer} = require('electron');
  invariant(remote);
  const application =
    remote.require(require.resolve('../../fb-analytics-client/lib/applicationSession-entry'));

  // Initialize for new window
  const appSession = application.getAppSession();
  appSessionID = (appSession != null && appSession.id != null) ? appSession.id : '';

  // Listen for changes from main process
  invariant(ipcRenderer);
  ipcRenderer.on('app-session-changed', (channel, newValue) => { appSessionID = newValue; });
}

function augmentValues(values) {
  if (appSessionID == null) {
    initializeAppSessionID();
  }

  const runtimeInfomation = getRuntimeInformation();
  return Object.assign(values, {
    appSessionID,
    created: runtimeInfomation.timestamp,
    sessionID: runtimeInfomation.sessionId,
    userID: runtimeInfomation.user,
    isClient: runtimeInfomation.isClient ? '1' : '0',
    version: runtimeInfomation.atomVersion,
    uptime: runtimeInfomation.uptime,
    buildNumber: runtimeInfomation.nuclideVersion,
  });
}

export function track(
  key: string,
  values: {[key: string]: mixed} = {},
  immediate?: boolean,
): ?Promise<mixed> {
  if (immediate) {
    return trackImpl(key, augmentValues(values), true);
  }

  // Defer work to avoid blocking other work.
  scheduleIdleCallback(() => {
    trackImpl(key, augmentValues(values));
  });
}
