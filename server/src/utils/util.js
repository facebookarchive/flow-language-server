/* @flow */

import type {DiagnosticSeverityType} from 'vscode-languageserver-types';

import invariant from 'invariant';
import URI from 'vscode-uri';

// LSP Severity types
const DiagnosticSeverity = {
  ERROR: 1,
  WARNING: 2,
  INFORMATION: 3,
  HINT: 4,
};

const FlowSeverity = {
  ERROR: 'error',
  WARNING: 'warning',
};
type FlowSeverityValue = 'error' | 'warning';

const flowSeverityToLSPSeverityMap: {
  [FlowSeverityValue]: DiagnosticSeverityType,
} = {
  [FlowSeverity.ERROR]: DiagnosticSeverity.ERROR,
  [FlowSeverity.WARNING]: DiagnosticSeverity.WARNING,
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
    flowSeverity === FlowSeverity.ERROR ||
      flowSeverity === FlowSeverity.WARNING,
    'must be valid Flow severity',
  );

  return flowSeverityToLSPSeverityMap[flowSeverity];
}
