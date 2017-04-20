import type {IConnection, TextDocuments} from 'vscode-languageserver';
import type {Definition, Range} from 'vscode-languageserver-types';

import URI from 'vscode-uri';
import {flowFindDefinition} from './pkg/flow-base/lib/FlowService';

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
  }: TextDocumentPositionParams): Promise<null | Definition> {
    const fileName = URI.parse(textDocument.uri).fsPath;
    const currentContents = this.documents.get(textDocument.uri).getText();

    const line = position.line + 1; // fix offsets
    const col = position.character + 1; // fix offsets

    const definition = await flowFindDefinition(
      fileName,
      currentContents,
      line,
      col,
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

    return null; // no definition
  }
}
