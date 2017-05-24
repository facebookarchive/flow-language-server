#!/usr/bin/env node
// @flow
/* eslint-disable no-console */

import invariant from 'assert';
import {createConnection} from 'vscode-languageserver';

import initializeLogging from '../logging/initializeLogging';
import {createServer} from '../index';

async function init() {
  let connection;
  try {
    connection = createConnection();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
  invariant(connection, 'for flow; program should have excited otherwise');

  createServer(connection).listen();
  initializeLogging(connection);
}

init();
