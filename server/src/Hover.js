import type {IConnection, TextDocuments} from 'vscode-languageserver';

import {js_beautify as beautify} from 'js-beautify';
import URI from 'vscode-uri';
import {flowGetType} from './pkg/flow-base/lib/FlowService';

import {flowLocationToLSPRange} from './utils/util';

function markedJS(text: string): string {
  return '```js\n' + text + '\n```';
}

export default class HoverSupport {
  connection: IConnection;
  documents: TextDocuments;

  constructor(connection: IConnection, documents: TextDocuments) {
    this.connection = connection;
    this.documents = documents;
  }

  async provideHover(params: TextDocumentPositionParams): Promise<?Hover> {
    const {position, textDocument} = params;

    const fileName = URI.parse(textDocument.uri).fsPath;
    const currentContents = this.documents.get(textDocument.uri).getText();

    const completion = await flowGetType(
      fileName,
      currentContents,
      position.line,
      position.character,
      false,
    );

    if (completion) {
      return {
        contents: markedJS(beautify(completion.type)),
        range: flowLocationToLSPRange(completion.loc),
      };
    }

    return null;
  }
}
