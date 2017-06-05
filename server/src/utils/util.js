/* @flow */

import type {
  DiagnosticSeverityType,
  Position,
  Range,
} from 'vscode-languageserver-types';

import {Point} from 'simple-text-buffer';

import {DiagnosticSeverity} from 'vscode-languageserver-types';
import invariant from 'assert';
import nullthrows from 'nullthrows';
import URI from 'vscode-uri';

const FlowSeverity = {
  Error: 'Error',
  Warning: 'Warning',
};
type FlowSeverityValue = 'Error' | 'Warning';

const flowSeverityToLSPSeverityMap: {
  [string]: DiagnosticSeverityType,
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
    flowSeverity === FlowSeverity.Warning ||
      flowSeverity === FlowSeverity.Error,
    'must be a valid flow severity',
  );

  return nullthrows(flowSeverityToLSPSeverityMap[flowSeverity]);
}

export function lspPositionToAtomPoint(lspPosition: Position): atom$Point {
  return new Point(lspPosition.line, lspPosition.character);
}

export function atomPointToLSPPosition(atomPoint: atom$PointObject): Position {
  return {
    line: atomPoint.row,
    character: atomPoint.column,
  };
}

export function atomRangeToLSPRange(atomRange: atom$Range): Range {
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

export function compareLspPosition(a: Position, b: Position): number {
  return a.line - b.line || a.character - b.character;
}

export function compareLspRange(a: Range, b: Range): number {
  return compareLspPosition(a.start, b.start) || compareLspPosition(a.end, b.end);
}
