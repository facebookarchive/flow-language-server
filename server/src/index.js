// @flow

import {
  IPCMessageReader,
  IPCMessageWriter,
  createConnection,
} from 'vscode-languageserver';

process.on('uncaughtException', e => console.error('uncaughtException', e));
process.on('unhandledRejection', e => console.error('unhandledRejection', e));

const connection = createConnection(
  new IPCMessageReader(process),
  new IPCMessageWriter(process),
);

connection.onInitialize(params => {
  return {
    capabilities: {},
  };
});

connection.listen();
