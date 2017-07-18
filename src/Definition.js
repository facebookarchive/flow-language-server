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

import type {IConnection} from 'vscode-languageserver';
import type {Definition, IRange} from 'vscode-languageserver-types';
import type {TextDocumentPositionParams} from 'vscode-languageserver/lib/protocol';
import type TextDocuments from './TextDocuments';
import {FlowSingleProjectLanguageService} from './pkg/nuclide-flow-rpc/lib/FlowSingleProjectLanguageService';

import URI from 'vscode-uri';
import {getLogger} from 'log4js';
import {atomPointToLSPPosition, lspPositionToAtomPoint} from './utils/util';

const logger = getLogger('Definition');

type DefinitionSupportParams = {
  connection: IConnection,
  documents: TextDocuments,
  flow: FlowSingleProjectLanguageService,
};

export default class DefinitionSupport {
  connection: IConnection;
  documents: TextDocuments;
  flow: FlowSingleProjectLanguageService;

  constructor({connection, documents, flow}: DefinitionSupportParams) {
    this.connection = connection;
    this.documents = documents;
    this.flow = flow;
  }

  async provideDefinition({textDocument, position}: TextDocumentPositionParams): Promise<?Definition> {
    const fileName = URI.parse(textDocument.uri).fsPath;
    const doc = this.documents.get(textDocument.uri);

    const definitionResults = await this.flow.getDefinition(fileName, doc.buffer, lspPositionToAtomPoint(position));

    if (definitionResults) {
      return definitionResults.definitions.map(def => {
        const lspPosition = atomPointToLSPPosition(def.position);

        const range: IRange = {
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
