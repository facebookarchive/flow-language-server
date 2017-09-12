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
import type {FileDiagnosticMessage, FileDiagnosticMessages} from 'atom-ide-ui';
import type TextDocument from './TextDocument';
import type {Observable} from 'rxjs';
import invariant from 'invariant';

import URI from 'vscode-uri';

import {FlowSingleProjectLanguageService} from './pkg/nuclide-flow-rpc/lib/FlowSingleProjectLanguageService';
import {atomRangeToLSPRange, flowSeverityToLSPSeverity} from './utils/util';
import {getLogger} from 'log4js';

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
    const documentPath = URI.parse(document.uri).fsPath;
    invariant(documentPath != null);

    const diagnostics = await this.flow.getDiagnostics(
      documentPath,
      document.buffer,
    );

    if (diagnostics == null || diagnostics.filePathToMessages == null) {
      return [];
    }

    /* prettier-ignore */
    return Array.from(diagnostics.filePathToMessages.entries())
      .map(([filePath, messages]) => {
        return fileDiagnosticUpdateToLSPDiagnostic({filePath, messages});
      });
  }

  observe(): Observable<Array<PublishDiagnosticsParams>> {
    logger.info('Beginning to observe diagnostics');

    return this.flow
      .observeDiagnostics()
      .map(diagnostics => diagnostics.map(fileDiagnosticUpdateToLSPDiagnostic));
  }
}

function fileDiagnosticUpdateToLSPDiagnostic(
  diagnostic: FileDiagnosticMessages,
): PublishDiagnosticsParams {
  return {
    uri: URI.file(diagnostic.filePath).toString(),
    diagnostics: diagnostic.messages
      .filter(
        // range and message text are required for LSP
        d => d.range != null && d.text != null,
      )
      .map(message => ({
        // $FlowFixMe Diagnostics without range filtered out above
        range: atomRangeToLSPRange(message.range),
        severity: flowSeverityToLSPSeverity(message.type),
        message: toMessage(message),
        source: message.providerName,
      })),
  };
}

function toMessage(diagnostic: FileDiagnosticMessage): string {
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
