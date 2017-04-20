#!/usr/bin/env node
/* eslint-disable no-console */
// @flow

import {createConnection} from 'vscode-languageserver';
import {getLogger} from '../pkg/nuclide-logging/lib/main';
import {createServer} from '../index';
import invariant from 'invariant';

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
invariant(connection, 'for flow. process should have exited');

createServer(connection).listen();
