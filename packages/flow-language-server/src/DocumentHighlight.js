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
  atomPointToLSPPosition,
  lspPositionToAtomPoint,
  fileURIToPath,
} from './utils/util';

type DocumentHighlightSupportParams = {
  documents: TextDocuments,
  flow: FlowSingleProjectLanguageService,
};

export default class DocumentHighlightSupport {
  documents: TextDocuments;
  flow: FlowSingleProjectLanguageService;

  constructor({documents, flow}: DocumentHighlightSupportParams) {
    this.documents = documents;
    this.flow = flow;
  }

  async provideDocumentHighlight(
    params: TextDocumentPositionParams,
  ): Promise<?(DocumentHighlight[])> {
    const {position, textDocument} = params;

    const fileName = fileURIToPath(textDocument.uri);
    const doc = this.documents.get(textDocument.uri);

    const highlights = await this.flow.highlight(
      fileName,
      doc.buffer,
      lspPositionToAtomPoint(position),
    );
    if (highlights) {
      return highlights.map(highlight => {
        return {
          range: {
            start: atomPointToLSPPosition(highlight.start),
            end: atomPointToLSPPosition(highlight.end),
          },
        };
      });
    }
    return null;
  }
}
