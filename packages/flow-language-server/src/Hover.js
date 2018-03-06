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

import {FlowSingleProjectLanguageService} from './pkg/nuclide-flow-rpc/lib/FlowSingleProjectLanguageService';

import TextDocuments from './TextDocuments';
import {
  atomRangeToLSPRange,
  lspPositionToAtomPoint,
  fileURIToPath,
} from './utils/util';

type HoverSupportParams = {
  documents: TextDocuments,
  flow: FlowSingleProjectLanguageService,
};

const NULL_HOVER = {
  contents: [],
};

export default class HoverSupport {
  documents: TextDocuments;
  flow: FlowSingleProjectLanguageService;

  constructor({documents, flow}: HoverSupportParams) {
    this.documents = documents;
    this.flow = flow;
  }

  async provideHover(params: TextDocumentPositionParams): Promise<?Hover> {
    const {position, textDocument} = params;

    const fileName = fileURIToPath(textDocument.uri);
    const doc = this.documents.get(textDocument.uri);

    const typeHint = await this.flow.typeHint(
      fileName,
      doc.buffer,
      lspPositionToAtomPoint(position),
    );

    if (typeHint) {
      return {
        contents: typeHint.hint.map(
          hint =>
            hint.type === 'snippet'
              ? {
                  language: 'javascript',
                  value: hint.value,
                }
              : hint.value,
        ),
        range: atomRangeToLSPRange(typeHint.range),
      };
    }

    return NULL_HOVER;
  }
}
