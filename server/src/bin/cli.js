#!/usr/bin/env node
// @flow
/* eslint-disable no-console */

import invariant from 'invariant';
import patchNuclideLogger from '../patchNuclideLogger';
import {createConnection} from 'vscode-languageserver';

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

  if (process.argv.includes('--node-ipc')) {
    // Unfortunately VSCode with node ipc disconnects immediately if the server
    // is not created right away, so patch the logger afterwards
    createServer(connection).listen();
    patchNuclideLogger(connection);
  } else {
    await patchNuclideLogger(connection);
    createServer(connection).listen();
  }
}

init();
