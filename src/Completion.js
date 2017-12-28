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

import type {
  ClientCapabilities,
  TextDocumentPositionParams,
} from 'vscode-languageserver/lib/protocol';
import type {
  ICompletionList,
  CompletionItemKindType,
} from 'vscode-languageserver-types';
import {FlowSingleProjectLanguageService} from './pkg/nuclide-flow-rpc/lib/FlowSingleProjectLanguageService';

import {Range} from 'simple-text-buffer';
import {
  CompletionItemKind,
  InsertTextFormat,
} from 'vscode-languageserver-types';
import {wordAtPositionFromBuffer} from 'nuclide-commons/range';

import TextDocuments from './TextDocuments';
import {JAVASCRIPT_WORD_REGEX} from './pkg/nuclide-flow-common';
import {lspPositionToAtomPoint, fileURIToPath} from './utils/util';
import {getLogger} from 'log4js';

const logger = getLogger('Completion');

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
  }: TextDocumentPositionParams): Promise<ICompletionList> {
    const fileName = fileURIToPath(textDocument.uri);
    const doc = this.documents.get(textDocument.uri);
    const point = lspPositionToAtomPoint(position);
    // $FlowFixMe: Add to defs
    const prevPoint = point.traverse([0, -1]);
    const match = wordAtPositionFromBuffer(
      doc.buffer,
      prevPoint,
      JAVASCRIPT_WORD_REGEX,
    );
    let prefix = (match && match.wordMatch && match.wordMatch[0]) || '';
    // Ensure that we also trigger on object properties (".").
    if (
      point.column !== 0 &&
      doc.buffer.getTextInRange(new Range(prevPoint, point)) === '.'
    ) {
      prefix = '.';
    }

    const autocompleteResult = await this.flow.getAutocompleteSuggestions(
      fileName,
      doc.buffer,
      point,
      false, // activatedManually
      prefix,
    );

    if (autocompleteResult) {
      const {isIncomplete, items} = autocompleteResult;

      return {
        isIncomplete,
        items: items.map(atomCompletion => {
          const completion: CompletionItem = {
            label: atomCompletion.displayText,
            kind: this.typeToKind(
              atomCompletion.type,
              atomCompletion.description,
            ),
          };

          if (atomCompletion.description) {
            completion.documentation = atomCompletion.description;
          }

          if (completion.kind === CompletionItemKind.Function) {
            const {
              leftLabel: returnDetail,
              rightLabel: parametersDetail,
            } = atomCompletion;

            completion._returnDetail = returnDetail;
            completion._parametersDetail = parametersDetail;

            if (returnDetail != null && parametersDetail != null) {
              completion.detail = `${parametersDetail} => ${returnDetail}`;
            }
          } else {
            completion.detail = atomCompletion.rightLabel;
          }

          if (
            this.clientCapabilities &&
            this.clientCapabilities.textDocument &&
            this.clientCapabilities.textDocument.completion &&
            this.clientCapabilities.textDocument.completion.completionItem &&
            this.clientCapabilities.textDocument.completion.completionItem
              .snippetSupport &&
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
