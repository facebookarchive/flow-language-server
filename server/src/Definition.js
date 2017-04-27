import type {IConnection, TextDocuments} from 'vscode-languageserver';
import type {Definition, Range} from 'vscode-languageserver-types';
import type {
  TextDocumentPositionParams,
} from 'vscode-languageserver/lib/protocol';
import {
  FlowSingleProjectLanguageService,
} from './pkg/nuclide-flow-rpc/lib/FlowSingleProjectLanguageService';

import SimpleTextBuffer from 'simple-text-buffer';
import URI from 'vscode-uri';
import {getLogger} from './pkg/nuclide-logging';
import {atomPointToLSPPosition, lspPositionToAtomPoint} from './utils/util';

const logger = getLogger();

export default class DefinitionSupport {
  connection: IConnection;
  documents: TextDocuments;
  flow: FlowSingleProjectLanguageService;

  constructor(
    connection: IConnection,
    documents: TextDocuments,
    flow: FlowSingleProjectLanguageService,
  ) {
    this.connection = connection;
    this.documents = documents;
    this.flow = flow;
  }

  async provideDefinition({
    textDocument,
    position,
  }: TextDocumentPositionParams): Promise<?Definition> {
    const fileName = URI.parse(textDocument.uri).fsPath;
    const currentContents = this.documents.get(textDocument.uri).getText();

    const definitionResults = await this.flow.getDefinition(
      fileName,
      new SimpleTextBuffer(currentContents),
      lspPositionToAtomPoint(position),
    );

    if (definitionResults) {
      return definitionResults.definitions.map(def => {
        const lspPosition = atomPointToLSPPosition(def.position);

        const range: Range = {
          start: lspPosition,
          end: lspPosition,
        };

        return {
          uri: URI.file(def.path).toString(),
          range,
        };
      });
    }

    logger.debug('did not find definition');
    return null; // no definition
  }
}
