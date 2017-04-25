// @flow
import type {IConnection} from 'vscode-languageserver';
import type {Diagnostic} from 'vscode-languageserver-types';
import type {
  FileDiagnosticMessage,
} from './pkg/nuclide-diagnostics-common/lib/rpc-types';

import * as path from 'path';
import URI from 'vscode-uri';

import TextDocument from './TextDocument';
import {
  FlowSingleProjectLanguageService,
} from './pkg/nuclide-flow-rpc/lib/FlowSingleProjectLanguageService';
import {
  atomRangeToLSPRange,
  flowSeverityToLSPSeverity,
  hasFlowPragma,
  toURI,
} from './utils/util';
import {getLogger} from './pkg/nuclide-logging';

const logger = getLogger();

type InternalDiagnostic = {
  uri: string,
  diagnostics: Array<Diagnostic>,
};

const noDiagnostics = [];
const supportedLanguages = new Set(['javascript', 'javascriptreact']);

export default class Diagnostics {
  connection: IConnection;
  flow: FlowSingleProjectLanguageService;

  constructor(connection: IConnection, flow: FlowSingleProjectLanguageService) {
    this.connection = connection;
    this.flow = flow;
  }

  validate = async (textDocument: TextDocument) => {
    const {languageId} = textDocument;
    if (!supportedLanguages.has(languageId)) {
      return;
    }

    const uri = URI.parse(textDocument.uri);

    let diags;
    if (uri.scheme === 'untitled') {
      diags = await this._getBufferDiagnostics(uri, textDocument);
    } else if (uri.scheme === 'file') {
      diags = await this._getFileDiagnostics(uri.fsPath, textDocument);
    } else {
      logger.warn(`received unknown uri for diagnostics validation: ${uri}`);
      diags = noDiagnostics;
    }

    this._reportDiagnostics(diags);
  };

  _reportDiagnostics(internalDiagnostics: Array<InternalDiagnostic>) {
    for (const {uri, diagnostics} of internalDiagnostics) {
      this.connection.sendDiagnostics({
        uri: uri.toString(),
        diagnostics,
      });
    }
  }

  // adapted from counterpart in flow-for-vscode
  // transforms flow's diagnostics into LSP diagnostics
  async _getFileDiagnostics(
    filePath: string,
    doc: TextDocument,
    pathToURI: string => URI = toURI,
  ): Promise<Array<InternalDiagnostic>> {
    // flowFindDiagnostics takes the provided filePath and then walks up directories
    // until a .flowconfig is found. The diagnostics are then valid for the entire
    // flow workspace.
    const update = await this.flow.getDiagnostics(
      filePath,
      doc.isDirty ? doc.buffer : null,
    );
    const filePathToMessages = update && update.filePathToMessages;
    if (!filePathToMessages) {
      return noDiagnostics;
    }

    const internalDiagnostics: Array<InternalDiagnostic> = [];
    for (const [uri, diagnostics] of filePathToMessages.entries()) {
      internalDiagnostics.push({
        uri: pathToURI(uri),
        diagnostics: diagnostics
          .filter(
            // range and message text are required for LSP
            d => d.range != null && d.text != null,
          )
          .map(d => ({
            severity: flowSeverityToLSPSeverity(d.type),
            range: atomRangeToLSPRange(d.range),
            message: toMessage(d),
            source: d.providerName,
          })),
      });
    }

    return internalDiagnostics;
  }

  /*
   * Support for anonymous buffers. Uses the 'sandbox' flowconfig
   * to provide basic Flow hints outside the root.
   *
   * When the file is  saved properly into the Flow root, it will be
   * processed as a file instead.
   */
  async _getBufferDiagnostics(
    uri: URI,
    doc: TextDocument,
  ): Promise<Array<InternalDiagnostic>> {
    if (hasFlowPragma(doc.getText())) {
      const dummyPath = path.join(__dirname, 'sandbox', 'dummy.js');
      const diags = await this._getFileDiagnostics(
        dummyPath,
        doc,
        fromPath => (fromPath === dummyPath ? uri : URI.file(uri)),
      );
      return diags;
    }

    return noDiagnostics;
  }
}

function toMessage(diagnostic: FileDiagnosticMessage): string {
  let message = diagnostic.text;
  if (diagnostic.trace && diagnostic.trace.length) {
    for (const trace of diagnostic.trace) {
      if (trace.text != null) {
        // put new 'sentences' on their own line
        if (trace.text[0] === trace.text[0].toUpperCase()) {
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
