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

import {FlowExecInfoContainer} from './FlowExecInfoContainer';

export class FlowServiceState {
  _execInfoContainer: ?FlowExecInfoContainer;

  getExecInfoContainer(): FlowExecInfoContainer {
    if (this._execInfoContainer == null) {
      this._execInfoContainer = new FlowExecInfoContainer();
    }
    return this._execInfoContainer;
  }

  dispose() {
    if (this._execInfoContainer != null) {
      this._execInfoContainer.dispose();
      this._execInfoContainer = null;
    }
  }
}
