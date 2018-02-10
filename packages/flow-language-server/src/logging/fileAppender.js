/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @format
 */

const fileAppender = require('log4js/lib/appenders/file');

// The log4js file appender shutdown function doesn't wait for writes to complete.
// To circumvent this, replace the shutdown handler with a simple delay.
// TODO(hansonw): remove this when log4js 2.x is released.
fileAppender.shutdown = cb => setTimeout(cb, 100);

module.exports = fileAppender;
