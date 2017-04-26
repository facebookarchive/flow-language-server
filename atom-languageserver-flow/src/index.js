// @flow

import {AutoLanguageClient} from 'atom-languageclient';
import {spawn} from 'child_process';
import * as path from 'path';

const SERVER_HOME = path.join(__dirname, '..', '..', 'server', 'lib', 'bin');

class FlowLanguageServer extends AutoLanguageClient {
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
    return Promise.resolve(spawn('./cli.js', ['--stdio'], {cwd: SERVER_HOME}));
  }
}

module.exports = new FlowLanguageServer();

