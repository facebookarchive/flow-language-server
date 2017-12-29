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

const FILE_PROTOCOL = 'file://';

// On Windows, vscode-uri converts drive paths to lowercase,
// which Flow doesn't like very much.
// We'll implement our own basic converters `filePathToURI` and
// `fileURIToPath`.

export function filePathToURI(filePath: string): string {
  if (process.platform !== 'win32') {
    return URI.file(filePath).toString();
  }

  return encodeURI(FILE_PROTOCOL + '/' + filePath.replace(/\\/g, '/'));
}

export function fileURIToPath(fileUri: string): string {
  if (process.platform !== 'win32') {
    return URI.parse(fileUri).fsPath;
  }

  invariant(fileUri.startsWith(FILE_PROTOCOL), 'Must pass a valid file URI');

  let localPath = fileUri.slice(FILE_PROTOCOL.length);
  // Remove the leading slash and convert to backslashes.
  if (localPath.startsWith('/')) {
    localPath = localPath.substr(1);
  }
  return localPath.replace(/\//g, '\\');
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
