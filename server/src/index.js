// @flow

import {IConnection} from 'vscode-languageserver';

import Completion from './Completion';
import Definition from './Definition';
import Diagnostics from './Diagnostics';
import Hover from './Hover';
import SymbolSupport from './Symbol';
import TextDocuments from './TextDocuments';
import {
  FlowExecInfoContainer,
} from './pkg/nuclide-flow-rpc/lib/FlowExecInfoContainer';
import {
  FlowSingleProjectLanguageService,
} from './pkg/nuclide-flow-rpc/lib/FlowSingleProjectLanguageService';
import {getLogger} from 'log4js';

export function createServer(connection: IConnection) {
  const documents = new TextDocuments();

  connection.onInitialize(({capabilities, rootPath}) => {
    const logger = getLogger('index');

    logger.debug('LSP connection initialized. Connecting to flow...');
    const flow = new FlowSingleProjectLanguageService(
      rootPath || process.cwd(),
      new FlowExecInfoContainer(),
    );

    const diagnostics = new Diagnostics({connection, flow});
    diagnostics.observe();

    connection.onShutdown(() => {
      documents.dispose();
      flow.dispose();
    });

    const completion = new Completion({
      clientCapabilities: capabilities,
      documents,
      flow,
    });
    connection.onCompletion(docParams => {
      logger.debug(
        `completion requested for document ${docParams.textDocument.uri}`,
      );
      return completion.provideCompletionItems(docParams);
    });

    connection.onCompletionResolve(() => {
      // for now, noop as we can't/don't need to provide any additional
      // information on resolve, but need to respond to implement completion
    });

    const definition = new Definition({connection, documents, flow});
    connection.onDefinition(docParams => {
      logger.debug(
        `definition requested for document ${docParams.textDocument.uri}`,
      );
      return definition.provideDefinition(docParams);
    });

    const hover = new Hover({connection, documents, flow});
    connection.onHover(docParams => {
      return hover.provideHover(docParams);
    });

    const symbols = new SymbolSupport({connection, documents, flow});
    connection.onDocumentSymbol(symbolParams => {
      logger.debug(
        `symbols requested for document ${symbolParams.textDocument.uri}`,
      );
      return symbols.provideDocumentSymbol(symbolParams);
    });

    logger.info('Flow language server started');

    return {
      capabilities: {
        textDocumentSync: documents.syncKind,
        definitionProvider: true,
        documentSymbolProvider: true,
        completionProvider: {
          resolveProvider: true,
        },
        hoverProvider: true,
      },
    };
  });

  return {
    listen() {
      documents.listen(connection);
      connection.listen();
    },
  };
}
