/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {IConnection} from 'vscode-languageserver';
import type {DocumentSymbolParams} from 'vscode-languageserver-types';
import type {OutlineTree} from './pkg/nuclide-outline-view/lib/rpc-types';

import URI from 'vscode-uri';
import {SymbolKind} from 'vscode-languageserver-types';

import {
  FlowSingleProjectLanguageService,
} from './pkg/nuclide-flow-rpc/lib/FlowSingleProjectLanguageService';
import TextDocuments from './TextDocuments';
import {atomPointToLSPPosition} from './utils/util';
import {getLogger} from 'log4js';

const logger = getLogger('Symbol');

type SymbolSupportParams = {
  connection: IConnection,
  documents: TextDocuments,
  flow: FlowSingleProjectLanguageService,
};

export default class SymbolSupport {
  connection: IConnection;
  documents: TextDocuments;
  flow: FlowSingleProjectLanguageService;

  constructor({connection, documents, flow}: SymbolSupportParams) {
    this.connection = connection;
    this.documents = documents;
    this.flow = flow;
  }

  async provideDocumentSymbol(
    params: DocumentSymbolParams,
  ): Promise<Array<SymbolInformation>> {
    logger.debug('document symbols requested');
    const {textDocument} = params;

    const fileName = URI.parse(textDocument.uri).fsPath;
    const doc = this.documents.get(textDocument.uri);

    const outline = await this.flow.getOutline(fileName, doc.buffer);

    if (!outline) {
      logger.debug('returning empty list of symbols');
      return [];
    }

    return treesToItems(outline.outlineTrees, null, doc.uri);
  }
}

function treesToItems(
  trees: Array<OutlineTree>,
  containerName: ?string,
  uri: string,
): Array<SymbolInformation> {
  const items = [];
  for (const tree of trees) {
    if (!tree.representativeName && !tree.children.length) {
      continue;
    }

    const name = tree.representativeName;
    items.push(
      {
        name,
        kind: SymbolKind[tree.type] || SymbolKind.Variable,
        containerName,
        location: {
          uri,
          range: {
            start: atomPointToLSPPosition(tree.startPosition),
            end: atomPointToLSPPosition(tree.endPosition),
          },
        },
      },
      ...treesToItems(tree.children, name, uri),
    );
  }

  return items;
}
