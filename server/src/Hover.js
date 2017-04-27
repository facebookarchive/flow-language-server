import type {IConnection, TextDocuments} from 'vscode-languageserver';
import {
  FlowSingleProjectLanguageService,
} from './pkg/nuclide-flow-rpc/lib/FlowSingleProjectLanguageService';

import SimpleTextBuffer from 'simple-text-buffer';
import URI from 'vscode-uri';

import {atomRangeToLSPRange, lspPositionToAtomPoint} from './utils/util';

function markedJS(text: string): string {
  return '```js\n' + text + '\n```';
}

export default class HoverSupport {
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

  async provideHover(params: TextDocumentPositionParams): Promise<?Hover> {
    const {position, textDocument} = params;

    const fileName = URI.parse(textDocument.uri).fsPath;
    const currentContents = this.documents.get(textDocument.uri).getText();

    const typeHint = await this.flow.typeHint(
      fileName,
      new SimpleTextBuffer(currentContents),
      lspPositionToAtomPoint(position),
      false,
    );

    if (typeHint) {
      return {
        contents: markedJS(typeHint.hint),
        range: atomRangeToLSPRange(typeHint.range),
      };
    }

    return null;
  }
}
