/* @flow */

import type {
  DiagnosticSeverityType,
  Position,
  Range,
} from 'vscode-languageserver-types';

import {DiagnosticSeverity} from 'vscode-languageserver-types';
import invariant from 'invariant';
import URI from 'vscode-uri';

const FlowSeverity = {
  Error: 'Error',
  Warning: 'Warning',
};
type FlowSeverityValue = 'Error' | 'Warning';

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

export function lspPositionToAtomPoint(
  lspPosition: Position,
): atom$PointObject {
  return {
    row: lspPosition.line,
    column: lspPosition.character,
  };
}

export function atomPointToLSPPosition(atomPoint: atom$PointObject): Position {
  return {
    line: atomPoint.row,
    character: atomPoint.column,
  };
}

export function atomRangeToLSPRange(atomRange: atom$RangeObject): Range {
  return {
    start: atomPointToLSPPosition(atomRange.start),
    end: atomPointToLSPPosition(atomRange.end),
  };
}

export function lspRangeToAtomRange(lspRange: Range): atom$RangeObject {
  return {
    start: lspPositionToAtomPoint(lspRange.start),
    end: lspPositionToAtomPoint(lspRange.end),
  };
}
