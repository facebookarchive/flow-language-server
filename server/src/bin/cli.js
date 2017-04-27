#!/usr/bin/env node
// @flow
/* eslint-disable no-console */

import {createConnection} from 'vscode-languageserver';
import invariant from 'invariant';

import {getLogger} from '../pkg/nuclide-logging';
import {createServer} from '../index';

const logger = getLogger();

process.on('uncaughtException', e => logger.error('uncaughtException', e));
process.on('unhandledRejection', e => logger.error('unhandledRejection', e));

let connection;
try {
  connection = createConnection();
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

invariant(connection, 'for flow; program should have excited otherwise');

global.console.log = connection.console.log.bind(connection.console);
global.console.error = connection.console.error.bind(connection.console);

createServer(connection).listen();
