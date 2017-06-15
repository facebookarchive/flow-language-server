// @flow

// $FlowFixMe: coming soon
import type {BusySignalService} from 'atom-ide-ui';

import {Disposable} from 'atom';
import {AutoLanguageClient} from 'atom-languageclient';
import {spawn} from 'child_process';
import * as path from 'path';

const SERVER_HOME = path.join(__dirname, '..', '..', 'server', 'lib', 'bin');

// As defined in the LSP.
const LOG_MESSAGE_INFO = 3;

// Keep these in sync with the server side.
const STATUS_PREFIX = 'Flow status: ';
const BUSY_STATUS = Object.freeze({
  busy: 'busy',
  init: 'initializing',
});

class FlowLanguageServer extends AutoLanguageClient {
  // TODO: technically we need one per connection.
  _lastBusyMessage: ?IDisposable;

  getConnectionType() {
    return 'ipc';
  }

  getGrammarScopes() {
    return ['source.js', 'source.js.jsx'];
  }

  getLanguageName() {
    return 'JavaScript';
  }

  getServerName() {
    return 'Flow';
  }

  startServerProcess() {
    return Promise.resolve(
      spawn('./cli.js', ['--node-ipc'],
      {
        cwd: SERVER_HOME,
        stdio: [null, null, null, 'ipc'],
      },
    ));
  }

  preInitialization(connection) {
    connection.onLogMessage(e => {
      if (
        this._busySignalService != null &&
        e.type === LOG_MESSAGE_INFO &&
        e.message.startsWith(STATUS_PREFIX)
      ) {
        if (this._lastBusyMessage) {
          this._lastBusyMessage.dispose();
        }
        const status = e.message.substr(STATUS_PREFIX.length);
        const statusText = BUSY_STATUS[status];
        if (statusText) {
          this._lastBusyMessage = this._busySignalService.reportBusy(
            `Flow server is ${statusText}...`,
          );
        }
      }
    });
    // TODO: needs a public API
    connection._rpc.onClose(() => {
      if (this._lastBusyMessage) {
        this._lastBusyMessage.dispose();
      }
    });
  }

  consumeBusySignal(busySignalService: BusySignalService) {
    this._busySignalService = busySignalService;
    this._disposable.add(busySignalService);
    return new Disposable(() => {
      this._busySignalService = null;
      this._disposable.remove(busySignalService);
    });
  }
}

module.exports = new FlowLanguageServer();
