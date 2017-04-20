// @flow

import type {IConnection, TextDocuments} from 'vscode-languageserver';
import type {
  CompletionList,
  CompletionItemKindType,
} from 'vscode-languageserver-types';

import URI from 'vscode-uri';
import {CompletionItemKind} from 'vscode-languageserver-types';
import type {
  TextDocumentPositionParams,
} from 'vscode-languageserver/lib/protocol';

import {flowGetAutocompleteSuggestions} from './pkg/flow-base/lib/FlowService';

export default class Completion {
  connection: IConnection;
  documents: TextDocuments;

  constructor(connection: IConnection, documents: TextDocuments) {
    this.connection = connection;
    this.documents = documents;
  }

  async provideCompletionItems({
    textDocument,
    position,
  }: TextDocumentPositionParams): Promise<CompletionList> {
    const fileName = URI.parse(textDocument.uri).fsPath;
    const currentContents = this.documents.get(textDocument.uri).getText();
    const prefix = '.'; // TODO do better.

    const completions = await flowGetAutocompleteSuggestions(
      fileName,
      currentContents,
      position.line,
      position.character,
      prefix,
      true,
    );

    if (completions) {
      const out = {
        isIncomplete: false,
        items: completions.map(atomCompletion => {
          const completion: CompletionItem = {
            label: atomCompletion.displayText,
          };

          if (atomCompletion.description) {
            completion.detail = atomCompletion.description;
          }
          completion.detail = 'FLOW - ' + completion.detail;

          completion.kind = this.typeToKind(
            atomCompletion.type,
            atomCompletion.description,
          );

          if (completion.kind === CompletionItemKind.Function) {
            completion.insertText = atomCompletion.snippet;
          }

          return completion;
        }),
      };
      return out;
    }

    return {
      isIncomplete: true,
      items: [],
    };
  }

  typeToKind(type: string, description: string): CompletionItemKindType {
    if (type === 'function') {
      return CompletionItemKind.Function;
    }

    if (description && description.indexOf('[class: ') >= 0) {
      return CompletionItemKind.Class;
    }

    return CompletionItemKind.Variable;
  }
}
