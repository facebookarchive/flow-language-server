/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * @flow
 */

import {IConnection} from 'vscode-languageserver';
import {layouts} from 'log4js';

function appender(config: {connection: IConnection}) {
  const {connection} = config;

  return (loggingEvent: any): void => {
    connection.console.log(layouts.basicLayout(loggingEvent));
  };
}

module.exports.configure = module.exports.appender = appender;
