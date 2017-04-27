// @flow

import type {IConnection} from 'vscode-languageserver';
import type {
  CompletionList,
  CompletionItemKindType,
} from 'vscode-languageserver-types';
import type {
  TextDocumentPositionParams,
} from 'vscode-languageserver/lib/protocol';
import {
  FlowSingleProjectLanguageService,
} from './pkg/nuclide-flow-rpc/lib/FlowSingleProjectLanguageService';

import URI from 'vscode-uri';
import {CompletionItemKind} from 'vscode-languageserver-types';

import TextDocuments from './TextDocuments';
import {lspPositionToAtomPoint} from './utils/util';
import {getLogger} from './pkg/nuclide-logging';

const logger = getLogger();

export default class Completion {
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

  async provideCompletionItems({
    textDocument,
    position,
  }: TextDocumentPositionParams): Promise<CompletionList> {
    const fileName = URI.parse(textDocument.uri).fsPath;
    const doc = this.documents.get(textDocument.uri);
    const prefix = '.'; // TODO do better.

    const autocompleteResult = await this.flow.getAutocompleteSuggestions(
      fileName,
      doc.buffer,
      lspPositionToAtomPoint(position),
      true, // activatedManually
      prefix,
    );

    if (autocompleteResult) {
      const {isIncomplete, items} = autocompleteResult;

      return {
        isIncomplete,
        items: items.map(atomCompletion => {
          const completion: CompletionItem = {
            label: atomCompletion.displayText,
          };

          if (atomCompletion.description) {
            completion.detail = atomCompletion.description;
          }

          completion.kind = this.typeToKind(
            atomCompletion.type,
            atomCompletion.description,
          );

          if (atomCompletion.snippet) {
            completion.insertText = atomCompletion.snippet;
          }

          return completion;
        }),
      };
    }

    logger.debug('found no autocomplete results');
    return {
      isIncomplete: true,
      items: [],
    };
  }

  typeToKind(type: ?string, description: ?string): CompletionItemKindType {
    if (type === 'function') {
      return CompletionItemKind.Function;
    }

    if (description && description.indexOf('[class: ') >= 0) {
      return CompletionItemKind.Class;
    }

    return CompletionItemKind.Variable;
  }
}
