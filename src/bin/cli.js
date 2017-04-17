#!/usr/bin/env node
/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @noflow
 */
'use strict';

/* eslint comma-dangle: [1, always-multiline], prefer-object-spread/prefer-object-spread: 0 */

import type {FlowOptions} from '../types';
import yargs from 'yargs';

import connectionFromOptions from '../utils/connectionFromOptions';
import initializeLogging from '../logging/initializeLogging';
import {createServer} from '../index';

const cli = yargs
  .usage('Flow Language Service Command-Line Interface.\nUsage: $0 [args]')
  .help('h')
  .alias('h', 'help')
  .option('node-ipc', {
    describe:
      'Use node-ipc to communicate with the server. Useful for calling from a node.js client',
    type: 'string',
  })
  .option('stdio', {
    describe: 'Use stdio to communicate with the server',
    type: 'string',
  })
  .option('pipe', {
    describe:
      'Use a pipe (with a name like --pipe=/tmp/named-pipe) to communicate with the server',
    type: 'string',
  })
  .option('socket', {
    describe:
      'Use a socket (with a port number like --socket=5051) to communicate with the server',
    type: 'number',
  })
  .option('flow-path', {
    describe:
      'An absolute path to a specific flow binary to use for the server',
    type: 'string',
  })
  .option('try-flow-bin', {
    describe:
      "Attempt to use flow-bin inside the $PROJECT_ROOT's node_modules directory",
    type: 'boolean',
    default: false,
  })
  .option('no-auto-download', {
    describe: "Don't automatically download and manage flow binaries",
    type: 'boolean',
    default: false,
  });

const argv = cli.argv;
const options = {};
const methods = ['node-ipc', 'stdio', 'pipe', 'socket'];

cliInvariant(
  methods.filter(m => argv[m] != null).length === 1,
  'flow-language-server requires exactly one valid connection option (node-ipc, stdio, pipe, or socket).',
);
const method = methods.find(m => argv[m] != null);

options.method = method;
if (options.method === 'socket') {
  cliInvariant(options.port, '--socket option requires port.');
  options.port = argv.socket;
} else if (options.method === 'pipe') {
  cliInvariant(options.pipe, '--pipe option requires a pipe name.');
  options.pipeName = argv.pipe;
}

const connection = connectionFromOptions(options);
initializeLogging(connection);

const flowOptions: FlowOptions = {
  flowPath: argv['flow-path'],
  tryFlowBin: argv['try-flow-bin'],
  autoDownloadFlow: !argv['no-auto-download'],
};
createServer(connection, flowOptions).listen();

// Exit the process when stream closes from remote end.
process.stdin.on('close', () => {
  process.exit(0);
});

function cliInvariant(condition, ...msgs) {
  if (!condition) {
    /* eslint-disable no-console */
    console.error('ERROR:', ...msgs);
    console.error();
    /* eslint-enable */
    cli.showHelp();
    process.exit(1);
  }
}
