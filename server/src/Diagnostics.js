// @flow
import type {IConnection, TextDocuments} from 'vscode-languageserver';
import type {Diagnostic} from 'vscode-languageserver-types';

import entries from 'object.entries';
import * as path from 'path';
import URI from 'vscode-uri';

import {flowFindDiagnostics} from './pkg/flow-base/lib/FlowService';
import {flowSeverityToLSPSeverity, hasFlowPragma, toURI} from './utils/util';
import {getLogger} from './pkg/nuclide-logging/lib/main';

const logger = getLogger();

type InternalDiagnostics = {
  [string]: {
    uri: string,
    reports: Array<Diagnostic>,
  },
};

const noDiagnostics = Object.create(null);
const supportedLanguages = new Set(['javascript', 'javascriptreact']);

class Diagnostics {
  connection: IConnection;
  documents: TextDocuments;

  constructor(connection: IConnection, documents: TextDocuments) {
    this.connection = connection;
    this.documents = documents;
  }

  validate = async (textDocument: TextDocument, content: ?string) => {
    const {uri, languageId} = textDocument;
    if (!supportedLanguages.has(languageId)) {
      return;
    }

    let diags;
    if (uri.startsWith('untitled')) {
      diags = await this._getBufferDiagnostics(uri, textDocument.getText());
    } else if (uri.startsWith('file://')) {
      diags = await this._getFileDiagnostics(
        // HACK: slice off the file:// beginning of the uri for the
        // absolute path
        uri.slice(7),
        textDocument.getText(),
      );
    } else {
      logger.warn(`received unknown uri for diagnostics validation: ${uri}`);
      diags = noDiagnostics;
    }

    this._reportDiagnostics(diags);
  };

  _reportDiagnostics(internalDiagnostics: InternalDiagnostics) {
    const toReport: Array<Diagnostic> = entries(internalDiagnostics).map(([
      _,
      {uri, diagnostics},
    ]) => {
      return {
        uri: uri.toString(),
        diagnostics,
      };
    });

    toReport.forEach(d => this.connection.sendDiagnostics(d));
  }

  // adapted from counterpart in flow-for-vscode
  // transforms flow's diagnostics into LSP diagnostics
  async _getFileDiagnostics(
    filePath: string,
    content: ?string,
    pathToURI: string => URI = toURI,
  ): InternalDiagnostics {
    // flowFindDiagnostics takes the provided filePath and then walks up directories
    // until a .flowconfig is found. The diagnostics are then valid for the entire
    // flow workspace.
    const rawDiag = await flowFindDiagnostics(filePath, content);
    if (rawDiag && rawDiag.messages) {
      const {flowRoot, messages} = rawDiag;
      const diags = Object.create(null);

      messages.forEach(message => {
        const {level, messageComponents} = message;
        if (!messageComponents.length) {
          return;
        }

        const [baseMessage, ...other] = messageComponents;
        const {range} = baseMessage;

        if (range == null) {
          return;
        }

        const file = path.resolve(flowRoot, range.file);
        const uri = pathToURI(file);

        const details = [];
        other.forEach(part => {
          const partMsg = part.descr;
          if (partMsg && partMsg !== 'null' && partMsg !== 'undefined') {
            details.push(partMsg);
          }
        });

        let messageString = baseMessage.descr;
        if (details.length) {
          messageString = `${messageString} (${details.join(' ')})`;
        }

        const diag: Diagnostic = {
          severity: flowSeverityToLSPSeverity(level),
          range: {
            start: {
              line: Math.max(0, range.start.line - 1),
              character: range.start.column - 1,
            },
            end: {
              line: Math.max(0, range.end.line - 1),
              character: range.end.column,
            },
          },
          message: messageString,
          source: 'Flow',
        };

        if (!diags[file]) {
          diags[file] = {uri, diagnostics: []};
        }

        diags[file].diagnostics.push(diag);
      });
      return diags;
    } else {
      return noDiagnostics;
    }
  }

  /*
   * Support for anonymous buffers. Uses the 'sandbox' flowconfig
   * to provide basic Flow hints outside the root.
   *
   * When the file is  saved properly into the Flow root, it will be
   * processed as a file instead.
   */
  async _getBufferDiagnostics(
    uri: string,
    content: string,
  ): InternalDiagnostics {
    if (hasFlowPragma(content)) {
      const dummyPath = path.join(__dirname, 'sandbox', 'dummy.js');
      const diags = await this._getFileDiagnostics(
        dummyPath,
        content,
        () => uri,
      );
      return diags;
    }

    return noDiagnostics;
  }
}

export default Diagnostics;
