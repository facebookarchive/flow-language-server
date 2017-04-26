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
}
