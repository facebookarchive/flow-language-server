/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * @flow
 * @format
 */
// #!/usr/bin/env node

import invariant from 'assert';
import {createConnection} from 'vscode-languageserver';

import initializeLogging from '../logging/initializeLogging';
import {createServer} from '../index';

let connection;
try {
  connection = createConnection();
} catch (e) {
  // eslint-disable-next-line no-console
  console.error(e.message);
  process.exit(1);
}
invariant(connection, 'for flow; program should have excited otherwise');

createServer(connection).listen();
initializeLogging(connection);
