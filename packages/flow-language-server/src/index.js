/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @format
 */

import type {FlowOptions} from './types';
import type {InitializeParams} from 'vscode-languageserver/lib/protocol';
import type {VersionInfo} from 'flow-versions';

import nuclideUri from 'nuclide-commons/nuclideUri';
import UniversalDisposable from 'nuclide-commons/UniversalDisposable';
import path from 'path';
import {IConnection} from 'vscode-languageserver';
import type {ICompletionItem} from 'vscode-languageserver-types';

import Completion from './Completion';
import Definition from './Definition';
import Diagnostics from './Diagnostics';
import DocumentHighlight from './DocumentHighlight';
import Hover from './Hover';
import SymbolSupport from './Symbol';
import TextDocuments from './TextDocuments';
import {FileCache} from './pkg/nuclide-open-files-rpc/lib/FileCache';
import {FlowExecInfoContainer} from './pkg/nuclide-flow-rpc/lib/FlowExecInfoContainer';
import {FlowSingleProjectLanguageService} from './pkg/nuclide-flow-rpc/lib/FlowSingleProjectLanguageService';
import {getLogger} from 'log4js';
import {flowBinForRoot, githubSemverDownloader, utils} from 'flow-versions';

const SUPPORTS_PERSISTENT_CONNECTION = process.platform !== 'win32';

export function createServer(
  connection: IConnection,
  initialFlowOptions: FlowOptions,
) {
  const logger = getLogger('index');
  const disposable = new UniversalDisposable();
  const documents = new TextDocuments();
  const fileCache = new FileCache();

  disposable.add(documents);

  connection.onShutdown(() => {
    logger.debug('LSP server connection shutting down');
    disposable.dispose();
  });

  connection.onInitialize(
    async ({capabilities, rootPath}: InitializeParams) => {
      // Flow trips on trailing slashes in root on Windows, `path.resolve` gets
      // rid of it.
      const root = path.resolve(rootPath || process.cwd());

      logger.debug('LSP connection initialized. Connecting to flow...');

      const flowVersionInfo = await getFlowVersionInfo(
        root,
        connection,
        initialFlowOptions,
      );
      if (!flowVersionInfo) {
        return {capabilities: {}};
      }
      const flowContainer = new FlowExecInfoContainer(flowVersionInfo);
      const flow = new FlowSingleProjectLanguageService(
        root,
        flowContainer,
        fileCache,
      );

      disposable.add(
        flow,
        flow
          .getServerStatusUpdates()
          .distinctUntilChanged()
          .subscribe(statusType => {
            connection.console.info(`Flow status: ${statusType}`);
          }),
      );

      const diagnostics = new Diagnostics({flow});

      if (SUPPORTS_PERSISTENT_CONNECTION) {
        disposable.add(
          diagnostics
            .observe()
            .subscribe(diagnosticItems =>
              diagnosticItems.forEach(connection.sendDiagnostics),
            ),
        );
      } else {
        // Flow doesn't support its persistent connection well on Windows,
        // so fall back to monitoring open and save events to offer diagnostics
        const diagnoseAndSend = async function({document}) {
          const diagnosticItems = await diagnostics.diagnoseOne(document);
          diagnosticItems.forEach(connection.sendDiagnostics);
        };

        documents.onDidSave(diagnoseAndSend);
        documents.onDidOpen(diagnoseAndSend);
      }

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

      connection.onCompletionResolve((item: ICompletionItem) => {
        // for now, we return the item as is as we can't/don't need to provide
        // any additional information on resolve, but need to respond to
        // implement completion
        logger.debug(`completionItem/resolve requested for item ${item.label}`);
        return item;
      });

      const definition = new Definition({documents, flow});
      connection.onDefinition(docParams => {
        logger.debug(
          `definition requested for document ${docParams.textDocument.uri}`,
        );
        return definition.provideDefinition(docParams);
      });

      const documentHighlight = new DocumentHighlight({documents, flow});
      connection.onDocumentHighlight(docParams => {
        return documentHighlight.provideDocumentHighlight(docParams);
      });

      const hover = new Hover({documents, flow});
      connection.onHover(docParams => {
        return hover.provideHover(docParams);
      });

      const symbols = new SymbolSupport({documents, flow});
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
            triggerCharacters: ['.'],
          },
          documentHighlightProvider: true,
          hoverProvider: true,
        },
      };
    },
  );

  return {
    listen() {
      documents.listen(connection);
      connection.listen();
    },
  };
}

async function getFlowVersionInfo(
  rootPath: string,
  connection: IConnection,
  flowOptions: FlowOptions,
): Promise<?VersionInfo> {
  const versionLogger = getLogger('flow-versions');

  if (flowOptions.flowPath != null) {
    connection.window.showInformationMessage(
      'path to flow ' + flowOptions.flowPath,
    );
    if (!nuclideUri.isAbsolute(flowOptions.flowPath)) {
      connection.window.showErrorMessage(
        'Supplied path to flow was not absolute. Specify a complete path to ' +
          'the flow binary or leave the option empty for Flow to be managed ' +
          'for you.',
      );
      return null;
    }

    const flowVersionInfo = await utils.versionInfoForPath(
      rootPath,
      flowOptions.flowPath,
    );

    if (!flowVersionInfo) {
      connection.window.showErrorMessage('Invalid path to flow binary.');
    }
    versionLogger.info(
      `Using the provided path to flow binary at ${flowOptions.flowPath}`,
    );

    return flowVersionInfo;
  }

  const downloadManagerLogger = {
    error: connection.window.showErrorMessage.bind(connection.window),
    info: versionLogger.info.bind(versionLogger),
    warn: versionLogger.warn.bind(versionLogger),
  };

  const versionInfo = await flowBinForRoot(rootPath, {
    autoDownloadFlow: flowOptions.autoDownloadFlow,
    reporter: downloadManagerLogger,
    semverDownloader: githubSemverDownloader,
    tryFlowBin: flowOptions.tryFlowBin,
  });

  if (!versionInfo) {
    versionLogger.error(
      'There was a problem obtaining the appropriate version of flow for ' +
        'your project. Please check the extension logs.',
    );
  }

  return versionInfo;
}
