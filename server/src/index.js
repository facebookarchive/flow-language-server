// @flow

import {IConnection, TextDocuments} from 'vscode-languageserver';

import Completion from './Completion';
import Definition from './Definition';
import Diagnostics from './Diagnostics';
import Hover from './Hover';
import {getLogger} from './pkg/nuclide-logging/lib/main';

const logger = getLogger();

export function createServer(connection: IConnection) {
  const documents = new TextDocuments();

  connection.onInitialize(params => {
    // TODO: Explicitly pass this through to FlowHelpers.js
    global.workspacePath = params.rootPath;

    const diagnostics = new Diagnostics(connection, documents);
    connection.onDidChangeConfiguration(({settings}) => {
      logger.debug('config changed');
      documents.all().forEach(doc => diagnostics.validate(doc));
    });

    documents.onDidChangeContent(({document}) => {
      logger.debug('content changed');
      diagnostics.validate(document);
    });

    const completion = new Completion(connection, documents);
    connection.onCompletion(docParams =>
      completion.provideCompletionItems(docParams),
    );

    connection.onCompletionResolve(() => {
      // for now, noop as we can't/don't need to provide any additional
      // information on resolve, but need to respond to implement completion
    });

    const definition = new Definition(connection, documents);
    connection.onDefinition(
      async docParams => await definition.provideDefinition(docParams),
    );

    const hover = new Hover(connection, documents);
    connection.onHover(docParams => {
      return hover.provideHover(docParams);
    });

    logger.info('Flow language server started');

    return {
      capabilities: {
        definitionProvider: true,
        textDocumentSync: documents.syncKind,
        completionProvider: {
          resolveProvider: true,
        },
        hoverProvider: true,
      },
    };
  });

  return {
    listen() {
      connection.listen();
      documents.listen(connection);
    },
  };
}
