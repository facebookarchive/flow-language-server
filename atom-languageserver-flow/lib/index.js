'use strict';

var _atomLanguageclient = require('atom-languageclient');

var _child_process = require('child_process');

var _path = require('path');

var path = _interopRequireWildcard(_path);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

const SERVER_HOME = path.join(__dirname, '..', '..', 'server', 'lib', 'bin');

class FlowLanguageServer extends _atomLanguageclient.AutoLanguageClient {
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
    return Promise.resolve((0, _child_process.spawn)('./cli.js', ['--stdio'], { cwd: SERVER_HOME }));
  }
}

module.exports = new FlowLanguageServer();
//# sourceMappingURL=index.js.map