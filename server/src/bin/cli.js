#!/usr/bin/env node
// @flow
/* eslint-disable no-console */

import yargs from 'yargs';

import connectionFromOptions from '../utils/connectionFromOptions';
import initializeLogging from '../logging/initializeLogging';
import {createServer} from '../index';

const cli = yargs
  .usage(
    'Flow Language Service Command-Line Interface.\n' +
    'Usage: $0 [args]',
  )
  .help('h')
  .alias('h', 'help')
  .option('node-ipc', {
    describe: 'Use node-ipc to communicate with the server. Useful for calling from a node.js client',
    type: 'string',
  })
  .option('stdio', {
    describe: 'Use stdio to communicate with the server',
    type: 'string',
  })
  .option('pipe', {
    describe: 'Use a pipe (with a name like --pipe=/tmp/named-pipe) to communicate with the server',
    type: 'string',
  })
  .option('socket', {
    describe: 'Use a socket (with a port number like --socket=5051) to communicate with the server',
    type: 'number',
  });

const argv = cli.argv;
const options = {};
const methods = ['node-ipc', 'stdio', 'pipe', 'socket'];

cliInvariant(
  methods.filter(m => argv[m] != null).length === 1,
  'flow-language-server requires exactly one valid option.',
);
const method = methods.find(m => argv[m] != null);

options.method = method;
if (method === 'socket') {
  cliInvariant(options.port, '--socket option requires port.');
  options.port = argv.socket;
} else if (method === 'pipe') {
  cliInvariant(options.pipe, '--pipe option requires a pipe name.');
  options.pipeName = argv.pipe;
}

const connection = connectionFromOptions(options);
initializeLogging(connection);
createServer(connection).listen();

// Exit the process when stream closes from remote end.
process.stdin.on('close', () => {
  process.exit(0);
});

function cliInvariant(condition, ...msgs) {
  if (!condition) {
    console.error(...msgs);
    console.error();
    cli.showHelp();
    process.exit(1);
  }
}
