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

export type VersionInfo = {
  pathToFlow: string,
  flowVersion: string,
};

/* eslint-disable flowtype/no-weak-types  */
export type Reporter = {
  +info: (...msgs: Array<any>) => void,
  +warn: (...msgs: Array<any>) => void,
  +error: (...msgs: Array<any>) => void,
};
/* eslint-enable */
