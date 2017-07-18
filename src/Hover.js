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
import {FlowSingleProjectLanguageService} from './pkg/nuclide-flow-rpc/lib/FlowSingleProjectLanguageService';

import URI from 'vscode-uri';

import TextDocuments from './TextDocuments';
import {atomRangeToLSPRange, lspPositionToAtomPoint} from './utils/util';

type HoverSupportParams = {
  connection: IConnection,
  documents: TextDocuments,
  flow: FlowSingleProjectLanguageService,
};

export default class HoverSupport {
  connection: IConnection;
  documents: TextDocuments;
  flow: FlowSingleProjectLanguageService;

  constructor({connection, documents, flow}: HoverSupportParams) {
    this.connection = connection;
    this.documents = documents;
    this.flow = flow;
  }

  async provideHover(params: TextDocumentPositionParams): Promise<?Hover> {
    const {position, textDocument} = params;

    const fileName = URI.parse(textDocument.uri).fsPath;
    const doc = this.documents.get(textDocument.uri);

    const typeHint = await this.flow.typeHint(fileName, doc.buffer, lspPositionToAtomPoint(position));

    if (typeHint) {
      return {
        contents: {language: 'javascript', value: typeHint.hint},
        range: atomRangeToLSPRange(typeHint.range),
      };
    }

    return null;
  }
}
