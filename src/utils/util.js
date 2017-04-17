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

import type {
  DiagnosticSeverityType,
  IPosition,
  IRange,
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

export function lspPositionToAtomPoint(lspPosition: IPosition): atom$Point {
  return new Point(lspPosition.line, lspPosition.character);
}

export function atomPointToLSPPosition(atomPoint: atom$PointObject): IPosition {
  return {
    line: atomPoint.row,
    character: atomPoint.column,
  };
}

export function atomRangeToLSPRange(atomRange: atom$Range): IRange {
  return {
    start: atomPointToLSPPosition(atomRange.start),
    end: atomPointToLSPPosition(atomRange.end),
  };
}

export function lspRangeToAtomRange(lspRange: IRange): atom$RangeObject {
  return {
    start: lspPositionToAtomPoint(lspRange.start),
    end: lspPositionToAtomPoint(lspRange.end),
  };
}

export function compareLspPosition(a: Position, b: Position): number {
  return a.line - b.line || a.character - b.character;
}

export function compareLspRange(a: IRange, b: IRange): number {
  return (
    compareLspPosition(a.start, b.start) || compareLspPosition(a.end, b.end)
  );
}
