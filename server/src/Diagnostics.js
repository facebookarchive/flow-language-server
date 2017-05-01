// @flow
import type {
  IConnection,
  PublishDiagnosticsParams,
} from 'vscode-languageserver';
import type {
  FileDiagnosticMessage,
  FileDiagnosticUpdate,
} from './pkg/nuclide-diagnostics-common/lib/rpc-types';

import URI from 'vscode-uri';

import {
  FlowSingleProjectLanguageService,
} from './pkg/nuclide-flow-rpc/lib/FlowSingleProjectLanguageService';
import {atomRangeToLSPRange, flowSeverityToLSPSeverity} from './utils/util';
import {getLogger} from './pkg/nuclide-logging';

const logger = getLogger();

export default class Diagnostics {
  connection: IConnection;
  flow: FlowSingleProjectLanguageService;

  constructor(connection: IConnection, flow: FlowSingleProjectLanguageService) {
    this.connection = connection;
    this.flow = flow;
  }

  observe() {
    logger.info('Beginning to observe diagnostics');

    this.flow
      .observeDiagnostics()
      .map(fileDiagnosticUpdateToLSPDiagnostic)
      .forEach(d => this.connection.sendDiagnostics(d));
  }
}

function fileDiagnosticUpdateToLSPDiagnostic(
  diagnostic: FileDiagnosticUpdate,
): PublishDiagnosticsParams {
  return {
    uri: URI.file(diagnostic.filePath).toString(),
    diagnostics: diagnostic.messages
      .filter(
        // range and message text are required for LSP
        d => d.range != null && d.text != null,
      )
      .map(message => ({
        severity: flowSeverityToLSPSeverity(message.type),
        range: atomRangeToLSPRange(message.range),
        message: toMessage(message),
        source: message.providerName,
      })),
  };
}

function toMessage(diagnostic: FileDiagnosticMessage): string {
  let message = diagnostic.text;
  if (diagnostic.trace && diagnostic.trace.length) {
    for (const trace of diagnostic.trace) {
      if (trace.text != null) {
        // put new 'sentences' on their own line
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
