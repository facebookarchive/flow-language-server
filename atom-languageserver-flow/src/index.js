// @flow

import {AutoLanguageClient} from 'atom-languageclient';
import {spawn} from 'child_process';
import * as path from 'path';

const SERVER_HOME = path.join(__dirname, '..', '..', 'server', 'lib', 'bin');

class FlowLanguageServer extends AutoLanguageClient {
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
}

module.exports = new FlowLanguageServer();

