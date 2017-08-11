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

import path from 'path';
import {getFlowDataDir} from './utils';

export const BIN_NAME = process.platform === 'win32' ? 'flow.exe' : 'flow';
export const BINS_DIR = path.join(getFlowDataDir(), 'bin');
