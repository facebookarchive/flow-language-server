// @flow

import type {ClientCapabilities} from 'vscode-languageserver/lib/protocol';
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

import idx from 'idx';
import URI from 'vscode-uri';
import {
  CompletionItemKind,
  InsertTextFormat,
} from 'vscode-languageserver-types';

import getWordTextAndRange from './utils/getWordTextAndRange';

import TextDocuments from './TextDocuments';
import {lspPositionToAtomPoint} from './utils/util';
import {getLogger} from './pkg/nuclide-logging';

const logger = getLogger();

type CompletionParams = {
  clientCapabilities: ClientCapabilities,
  documents: TextDocuments,
  flow: FlowSingleProjectLanguageService,
};

export default class Completion {
  clientCapabilities: ClientCapabilities;
  documents: TextDocuments;
  flow: FlowSingleProjectLanguageService;

  constructor({clientCapabilities, documents, flow}: CompletionParams) {
    this.clientCapabilities = clientCapabilities;
    this.documents = documents;
    this.flow = flow;
  }

  async provideCompletionItems({
    textDocument,
    position,
  }: TextDocumentPositionParams): Promise<CompletionList> {
    const fileName = URI.parse(textDocument.uri).fsPath;
    const doc = this.documents.get(textDocument.uri);
    const point = lspPositionToAtomPoint(position);
    const {text} = getWordTextAndRange(doc.buffer, point);

    const autocompleteResult = await this.flow.getAutocompleteSuggestions(
      fileName,
      doc.buffer,
      point,
      true, // activatedManually
      text,
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
            completion.documentation = atomCompletion.description;
          }

          completion.kind = this.typeToKind(
            atomCompletion.type,
            atomCompletion.description,
          );

          if (
            idx(
              this.clientCapabilities,
              _ => _.textDocument.completion.completionItem.snippetSupport,
            ) &&
            atomCompletion.snippet
          ) {
            completion.insertText = atomCompletion.snippet;
            completion.insertTextFormat = InsertTextFormat.Snippet;
          } else {
            logger.debug(
              'Was going to return a snippet completion, but the client does not support them',
            );
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
