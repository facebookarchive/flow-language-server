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

import type {PublishDiagnosticsParams} from 'vscode-languageserver';
import type {DiagnosticMessage, DiagnosticTrace} from 'atom-ide-ui';
import type TextDocument from './TextDocument';
import type {Observable} from 'rxjs';

import {arrayCompact} from 'nuclide-commons/collection';
import {FlowSingleProjectLanguageService} from './pkg/nuclide-flow-rpc/lib/FlowSingleProjectLanguageService';
import {
  atomRangeToLSPRange,
  flowSeverityToLSPSeverity,
  fileURIToPath,
  filePathToURI,
} from './utils/util';
import {getLogger} from 'log4js';
import invariant from 'assert';

const logger = getLogger('Diagnostics');

type DiagnosticsParams = {
  flow: FlowSingleProjectLanguageService,
};

export default class Diagnostics {
  flow: FlowSingleProjectLanguageService;

  constructor({flow}: DiagnosticsParams) {
    this.flow = flow;
  }

  async diagnoseOne(
    document: TextDocument,
  ): Promise<Array<PublishDiagnosticsParams>> {
    const emptyDiagnostic = {
      uri: document.uri,
      diagnostics: [],
    };

    const documentPath = fileURIToPath(document.uri);
    if (!documentPath) {
      return [];
    }

    const diagnostics = await this.flow.getDiagnostics(
      documentPath,
      document.buffer,
    );

    if (diagnostics == null || diagnostics.size === 0) {
      // clear out any old diagnostics by sending an explicit empty list of
      // diagnostics
      return [emptyDiagnostic];
    }

    return Array.from(diagnostics.entries()).map(
      fileDiagnosticUpdateToLSPDiagnostic,
    );
  }

  observe(): Observable<Array<PublishDiagnosticsParams>> {
    logger.info('Beginning to observe diagnostics');

    return this.flow.observeDiagnostics().map(diagnostics =>
      Array.from(diagnostics.entries()).map(
        // $FlowFixMe
        fileDiagnosticUpdateToLSPDiagnostic,
      ),
    );
  }
}

function fileDiagnosticUpdateToLSPDiagnostic([filePath, flowDiagnostics]: [
  string,
  Array<DiagnosticMessage>,
]): PublishDiagnosticsParams {
  return {
    uri: filePathToURI(filePath),
    diagnostics: flowDiagnostics
      .filter(d => d.range != null)
      .map(diagnostic => {
        const relatedLocations = arrayCompact(
          (diagnostic.trace || []).map(atomTrace_lspRelatedLocation),
        );

        invariant(diagnostic.range != null);
        return {
          range: atomRangeToLSPRange(diagnostic.range),
          severity: flowSeverityToLSPSeverity(diagnostic.type),
          source: diagnostic.providerName,
          relatedLocations,
          message:
            relatedLocations.length === 0
              ? toMessage(diagnostic)
              : diagnostic.text || '',
        };
      }),
  };
}

/**
 * From Nuclide's convert.js
 *
 * Converts an Atom Trace to an Lsp RelatedLocation. A RelatedLocation requires a
 * range. Therefore, this will return null when called with an Atom Trace that
 * does not have a range.
 */
function atomTrace_lspRelatedLocation(trace: DiagnosticTrace): ?Object {
  const {range, text, filePath} = trace;
  if (range != null) {
    return {
      message: text || '',
      location: {
        uri: filePath,
        range: atomRangeToLSPRange(range),
      },
    };
  }
  return null;
}

// transform legacy diagnostics (without relatedLocations) into a more verbose
// description
function toMessage(diagnostic: DiagnosticMessage): string {
  let message = diagnostic.text || '';
  if (diagnostic.trace && diagnostic.trace.length) {
    for (const trace of diagnostic.trace) {
      if (trace.text != null) {
        // put new 'sentences' on their own line
        // $FlowFixMe text presence is asserted above
        if (trace.text[0] && trace.text[0] === trace.text[0].toUpperCase()) {
          message += '\n';
        } else {
          message += ' ';
        }
        message += trace.text;
      }
    }
  }

  return message;
}
