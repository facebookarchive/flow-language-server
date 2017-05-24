/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * @flow
 */

import log4js from 'log4js';
import os from 'os';
import path from 'path';
import {IConnection} from 'vscode-languageserver';

import nuclideUri from '../pkg/commons-node/nuclideUri';

const LOG_FILE_PATH = nuclideUri.join(os.tmpdir(), 'flow-language-server.log');

// Configure log4js to not log to console, since
// writing arbitrary data to stdout will break JSON RPC if we're running over
// stdout.
//
// Additionally, add an appender to log over the rpc connection so logging appears
// in the client environment, independent of stdio, node rpc, socket, etc.
export default function initializeLogging(connection: IConnection) {
  log4js.configure({
    appenders: [
      {
        type: 'logLevelFilter',
        level: process.argv.includes('--debug') ? 'DEBUG' : 'WARN',
        appender: {
          type: path.join(__dirname, 'fileAppender'),
          filename: LOG_FILE_PATH,
        },
      },
      {
        type: 'logLevelFilter',
        level: process.argv.includes('--debug') ? 'DEBUG' : 'INFO',
        appender: {
          connection,
          type: path.join(__dirname, 'connectionConsoleAppender'),
        },
      },
    ],
  });

  const logger = log4js.getLogger();
  process.on('uncaughtException', e => logger.error('uncaughtException', e));
  process.on('unhandledRejection', e => logger.error('unhandledRejection', e));

  // don't let anything write to the true stdio as it could break JSON RPC
  global.console.log = connection.console.log.bind(connection.console);
  global.console.error = connection.console.error.bind(connection.console);
}
