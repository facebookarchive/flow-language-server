import type {IConnection, TextDocuments} from 'vscode-languageserver';
import type {Definition, Range} from 'vscode-languageserver-types';
import type {
  TextDocumentPositionParams,
} from 'vscode-languageserver/lib/protocol';

import URI from 'vscode-uri';
import {flowFindDefinition} from './pkg/flow-base/lib/FlowService';
import {getLogger} from './pkg/nuclide-logging/lib/main';
import {lspPositionToFlowPoint} from './utils/util';

const logger = getLogger();

export default class DefinitionSupport {
  connection: IConnection;
  documents: TextDocuments;

  constructor(connection: IConnection, documents: TextDocuments) {
    this.connection = connection;
    this.documents = documents;
  }

  async provideDefinition({
    textDocument,
    position,
  }: TextDocumentPositionParams): Promise<?Definition> {
    const fileName = URI.parse(textDocument.uri).fsPath;
    const currentContents = this.documents.get(textDocument.uri).getText();

    const flowPoint = lspPositionToFlowPoint(position);

    const definition = await flowFindDefinition(
      fileName,
      currentContents,
      flowPoint.line,
      flowPoint.column,
    );

    if (definition) {
      const point = {
        line: definition.point.line,
        character: definition.point.column,
      };

      const range: Range = {
        start: point,
        end: point,
      };

      return {
        uri: URI.file(definition.file).toString(),
        range,
      };
    }

    logger.debug('did not find definition');
    return null; // no definition
  }
}
