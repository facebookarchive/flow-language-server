/* @flow */

import type {TextDocuments} from 'vscode-languageserver';
import type {
  DiagnosticSeverityType,
  Position,
  Range,
} from 'vscode-languageserver-types';
import type {
  TextDocumentPositionParams,
} from 'vscode-languageserver/lib/protocol';

import invariant from 'invariant';
import URI from 'vscode-uri';
import {DiagnosticSeverity} from 'vscode-languageserver-types';

const FlowSeverity = {
  Error: 'error',
  Warning: 'warning',
};
type FlowSeverityValue = 'error' | 'warning';

// 1-based index for both line and column
type FlowPoint = {
  line: number,
  column: number,
};

type FlowLocation = {
  start: FlowPosition,
  end: FlowPosition,
};

const flowSeverityToLSPSeverityMap: {
  [FlowSeverityValue]: DiagnosticSeverityType,
} = {
  [FlowSeverity.Error]: DiagnosticSeverity.Error,
  [FlowSeverity.Warning]: DiagnosticSeverity.Warning,
};

export function toURI(filePath: string): URI {
  return URI.file(filePath);
}

export function hasFlowPragma(content: string) {
  const hasPragma =
    content.startsWith('/* @flow */') ||
    content.startsWith('// @flow\n') ||
    /^\s*\/\*+\s*@flow\s*\*+\//m.test(content) ||
    /^\s*\/\/\s*@flow\s*$/m.test(content);
  return hasPragma;
}

export function flowSeverityToLSPSeverity(
  flowSeverity: string,
): DiagnosticSeverityType {
  invariant(
    flowSeverity === FlowSeverity.Error ||
      flowSeverity === FlowSeverity.Warning,
    'must be valid Flow severity',
  );

  return flowSeverityToLSPSeverityMap[flowSeverity];
}

export function lspPositionToFlowPoint(lspPosition: Position): FlowPoint {
  return {
    line: lspPosition.line + 1,
    column: lspPosition.character + 1,
  };
}

export function flowLocationToLSPRange(flowLocation: FlowLocation): Range {
  // LSP Positions are 0-based indexes for both line and character while
  // Flow points are 1-based indexes
  return {
    start: {
      line: flowLocation.start.line - 1,
      character: flowLocation.start.column - 1,
    },
    end: {
      line: flowLocation.end.line - 1,
      // Flow locations are inclusive and LSP ranges are exclusive
      character: flowLocation.end.column,
    },
  };
}
