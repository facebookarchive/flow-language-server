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

import type {DocumentSymbolParams} from 'vscode-languageserver-types';
import type {OutlineTree} from 'atom-ide-ui';

import nullthrows from 'nullthrows';
import {SymbolKind, ISymbolInformation} from 'vscode-languageserver-types';

import {FlowSingleProjectLanguageService} from './pkg/nuclide-flow-rpc/lib/FlowSingleProjectLanguageService';
import TextDocuments from './TextDocuments';
import {atomPointToLSPPosition, fileURIToPath} from './utils/util';
import {getLogger} from 'log4js';

const logger = getLogger('Symbol');

type SymbolSupportParams = {
  documents: TextDocuments,
  flow: FlowSingleProjectLanguageService,
};

export default class SymbolSupport {
  documents: TextDocuments;
  flow: FlowSingleProjectLanguageService;

  constructor({documents, flow}: SymbolSupportParams) {
    this.documents = documents;
    this.flow = flow;
  }

  async provideDocumentSymbol(
    params: DocumentSymbolParams,
  ): Promise<Array<ISymbolInformation>> {
    logger.debug('document symbols requested');
    const {textDocument} = params;

    const fileName = fileURIToPath(textDocument.uri);
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
): Array<ISymbolInformation> {
  const items = [];
  for (const tree of trees) {
    if (!tree.representativeName && !tree.children.length) {
      continue;
    }

    const name = tree.representativeName;
    const kind = tree.kind;
    if (name == null || kind == null) {
      continue;
    }

    const item: ISymbolInformation = {
      name,
      kind: OUTLINE_KIND_TO_LSP_KIND[kind],
      location: {
        uri,
        range: {
          start: atomPointToLSPPosition(tree.startPosition),
          end: atomPointToLSPPosition(nullthrows(tree.endPosition)),
        },
      },
    };

    if (containerName != null) {
      item.containerName = containerName;
    }

    items.push(item, ...treesToItems(tree.children, name, uri));
  }

  return items;
}

const OUTLINE_KIND_TO_LSP_KIND = {
  array: SymbolKind.Array,
  boolean: SymbolKind.Boolean,
  class: SymbolKind.Class,
  constant: SymbolKind.Constant,
  constructor: SymbolKind.Constructor,
  enum: SymbolKind.Enum,
  field: SymbolKind.Field,
  file: SymbolKind.File,
  function: SymbolKind.Function,
  interface: SymbolKind.Interface,
  method: SymbolKind.Method,
  module: SymbolKind.Module,
  namespace: SymbolKind.Namespace,
  number: SymbolKind.Number,
  package: SymbolKind.Package,
  property: SymbolKind.Property,
  string: SymbolKind.String,
  variable: SymbolKind.Variable,
};
