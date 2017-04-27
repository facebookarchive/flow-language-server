#!/usr/bin/env node
// @flow
/* eslint-disable no-console */

import {createConnection} from 'vscode-languageserver';
import * as log4js from 'log4js';
import invariant from 'invariant';

import {getLogger} from '../pkg/nuclide-logging';
import {createServer} from '../index';

log4js.configure({
  appenders: [
    {type: 'console'},
    {type: 'file', filename: '/tmp/flow-server.log'},
  ],
});

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
createServer(connection).listen();
