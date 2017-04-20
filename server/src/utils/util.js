/* @flow */

import type {DiagnosticSeverityType} from 'vscode-languageserver-types';

import invariant from 'invariant';
import URI from 'vscode-uri';
import {DiagnosticSeverity} from 'vscode-languageserver-types';

const FlowSeverity = {
  Error: 'error',
  Warning: 'warning',
};
type FlowSeverityValue = 'error' | 'warning';

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
