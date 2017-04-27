/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * @flow
 */

import type {TrackEvent} from '../lib/track';

import {AnalyticsBatcher} from '../lib/AnalyticsBatcher';
import {isRunningInTest, isRunningInClient} from '../../commons-node/system-info';
import ScribeProcess from '../../commons-node/ScribeProcess';
import {postObject, AuthModes} from '../../commons-node/fb-interngraph';
import {getLogger} from '../../nuclide-logging';

const logger = getLogger();

let isScribeCatOnPath: ?Promise<boolean> = null;
let scribeProcess: ?ScribeProcess = null;
const SCRIBE_CATEGORY = 'nuclide_analytics';

// See: flib/intern/logging/logger/configs/NuclideAnalyticsLoggerConfig.php
const LOGGER_CONFIG = 'NuclideAnalyticsLoggerConfig';

function toHiveString(event: TrackEvent): string {
  // Hive format: columns separated by \x01. We only have key + values.
  return `${event.key}\x01${JSON.stringify(event.values)}`;
}

function logToScribe(events: Array<TrackEvent>): Promise<mixed> {
  return postObject('logger/log', {
    config: LOGGER_CONFIG,
    loglines: events.map(
      event => JSON.stringify({
        // Needs to match the logger config columns.
        key: event.key,
        values: JSON.stringify(event.values),
      }),
    ).join('\n'),
  }, AuthModes.TOKEN);
}

/**
 * Client-side queries are expensive, so batch them.
 */
let batcher: ?AnalyticsBatcher = null;
function getBatcher(): AnalyticsBatcher {
  if (batcher != null) {
    return batcher;
  }
  batcher = new AnalyticsBatcher(events => {
    logToScribe(events)
      .catch(error => {
        // The user is probably just offline, so just output some debug logs.
        logger.debug(
          `Failed to record analytics data: ${JSON.stringify(events)}`,
          error,
        );
      });
  });
  return batcher;
}

function trackFromClient(
  key: string,
  values: {[key: string]: mixed} = {},
  immediate?: boolean,
): ?Promise<mixed> {
  if (immediate) {
    return logToScribe([{key, values}]);
  } else {
    getBatcher().track(key, values);
  }
}

function trackFromServer(
  key: string,
  values: {[key: string]: mixed} = {},
  immediate?: boolean, // Note: immediate has no effect - this doesn't need batching
): Promise<void> {
  if (isScribeCatOnPath == null) {
    isScribeCatOnPath = ScribeProcess.isScribeCatOnPath();
  }
  return isScribeCatOnPath
    .then(result => {
      if (!result) {
        return;
      }
      if (!scribeProcess) {
        scribeProcess = new ScribeProcess(SCRIBE_CATEGORY);
      }
      return scribeProcess.write(toHiveString({key, values}));
    });
}

// Change to true to log analytics events to the console, for debugging
const LOG_ANALYTICS = false;
// Make sure LOG_ANALYTICS doesn't get changed to true and committed
(LOG_ANALYTICS: false);
// Only log events with this name, if non-null
const FILTER_EVENT_NAME: ?string = null;

export default function track(
  key: string,
  values: {[key: string]: mixed} = {},
  immediate?: boolean,
): ?Promise<mixed> {
  if (isRunningInTest() && (global.atom == null || !atom.atomScriptMode)) {
    return;
  }
  if (LOG_ANALYTICS) {
    log(key, values);
  }
  const fn = isRunningInClient() ? trackFromClient : trackFromServer;
  return fn(key, values, immediate);
}

function log(key: string, values: {[key: string]: mixed}): void {
  if (key === 'performance') {
    filterAndLog((values.eventName: any), (values.duration: any));
  } else {
    filterAndLog(key);
  }
}

function filterAndLog(actualKey: string, duration?: string): void {
  if (FILTER_EVENT_NAME == null || actualKey === FILTER_EVENT_NAME) {
    if (duration != null) {
      // eslint-disable-next-line no-console
      console.log(`${actualKey}: ${duration} ms`);
    } else {
      // eslint-disable-next-line no-console
      console.log(actualKey);
    }
  }
}
