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

import type {IConnection, PublishDiagnosticsParams} from 'vscode-languageserver';
import type {FileDiagnosticMessage, FileDiagnosticMessages} from 'atom-ide-ui';

import URI from 'vscode-uri';
import UniversalDisposable from 'nuclide-commons/UniversalDisposable';

import {FlowSingleProjectLanguageService} from './pkg/nuclide-flow-rpc/lib/FlowSingleProjectLanguageService';
import {atomRangeToLSPRange, flowSeverityToLSPSeverity} from './utils/util';
import {getLogger} from 'log4js';

const logger = getLogger('Diagnostics');

type DiagnosticsParams = {
  connection: IConnection,
  flow: FlowSingleProjectLanguageService,
};

export default class Diagnostics {
  connection: IConnection;
  flow: FlowSingleProjectLanguageService;
  _disposable: UniversalDisposable = new UniversalDisposable();

  constructor({connection, flow}: DiagnosticsParams) {
    this.connection = connection;
    this.flow = flow;
  }

  dispose() {
    this._disposable.dispose();
  }

  observe() {
    logger.info('Beginning to observe diagnostics');

    this._disposable.add(
      this.flow
        .observeDiagnostics()
        .map(diagnostics => diagnostics.map(fileDiagnosticUpdateToLSPDiagnostic))
        .subscribe(diagnostics => diagnostics.forEach(this.connection.sendDiagnostics)),
    );
  }
}

function fileDiagnosticUpdateToLSPDiagnostic(diagnostic: FileDiagnosticMessages): PublishDiagnosticsParams {
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
