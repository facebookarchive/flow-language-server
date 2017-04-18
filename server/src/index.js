// @flow

import 'regenerator-runtime/runtime';

import {
  IPCMessageReader,
  IPCMessageWriter,
  createConnection,
  TextDocuments,
} from 'vscode-languageserver';

import Diagnostics from './Diagnostics';
import {getLogger} from './pkg/nuclide-logging/lib/main';

const logger = getLogger();

process.on('uncaughtException', e => logger.error('uncaughtException', e));
process.on('unhandledRejection', e => logger.error('unhandledRejection', e));

const connection = createConnection(
  new IPCMessageReader(process),
  new IPCMessageWriter(process),
);

const documents = new TextDocuments();
documents.listen(connection);

connection.onInitialize(params => {
  // TODO: Explicitly pass this through to FlowHelpers.js
  global.workspacePath = params.rootPath;

  const diagnostics = new Diagnostics(connection, documents);
  connection.onDidChangeConfiguration(({settings}) => {
    logger.info('config changed');
    documents.all().forEach(doc => diagnostics.validate(doc));
  });

  documents.onDidChangeContent(({document}) => {
    logger.info('content changed');
    diagnostics.validate(document);
  });

  logger.info('Flow language server started');

  return {
    capabilities: {
      textDocumentSync: documents.syncKind,
    },
  };
});

connection.listen();
