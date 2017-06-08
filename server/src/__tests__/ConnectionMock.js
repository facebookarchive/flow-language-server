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
// used only in test

import {Emitter} from 'event-kit';

export default class ConnectionMock {
  constructor() {
    this._emitter = new Emitter();
  }

  onDidChangeTextDocument(handler) {
    this._emitter.on('didChange', handler);
  }

  onDidCloseTextDocument(handler) {
    this._emitter.on('didClose', handler);
  }

  onDidOpenTextDocument(handler) {
    this._emitter.on('didOpen', handler);
  }

  onDidSaveTextDocument(handler) {
    this._emitter.on('didChange', handler);
  }
}
