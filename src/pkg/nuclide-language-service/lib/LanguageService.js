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

import type {NuclideUri} from 'nuclide-commons/nuclideUri';
import type {FileVersion} from '../../nuclide-open-files-rpc/lib/rpc-types';
import type {TextEdit} from 'nuclide-commons-atom/text-edit';
import type {TypeHint} from '../../nuclide-type-hint/lib/rpc-types';
import type {CoverageResult} from '../../nuclide-type-coverage/lib/rpc-types';
import type {
  DefinitionQueryResult,
  DiagnosticProviderUpdate,
  FileDiagnosticMessages,
  FindReferencesReturn,
  Outline,
} from 'atom-ide-ui';
import type {ConnectableObservable} from 'rxjs';
import type {NuclideEvaluationExpression} from '../../nuclide-debugger-interfaces/rpc-types';

// Subtype of atom$AutocompleteSuggestion.
export type Completion = {
  text?: string,
  snippet?: string,
  displayText?: string,
  replacementPrefix?: string,
  type?: ?string,
  leftLabel?: ?string,
  leftLabelHTML?: ?string,
  rightLabel?: ?string,
  rightLabelHTML?: ?string,
  className?: ?string,
  iconHTML?: ?string,
  description?: ?string,
  descriptionMoreURL?: ?string,
  extraData?: mixed,
};

// This assertion ensures that Completion is a subtype of atom$AutocompleteSuggestion. If you are
// getting errors here, you have probably just updated one without updating the other.
((({}: any): Completion): atom$AutocompleteSuggestion);

export type AutocompleteResult = {
  isIncomplete: boolean,
  items: Array<Completion>,
};

export type SymbolResult = {
  path: NuclideUri,
  line: number,
  column: number,
  name: string,
  containerName: ?string,
  icon: ?string, // from https://github.com/atom/atom/blob/master/static/octicons.less
  hoverText: ?string, // sometimes used to explain the icon in words
};

export interface LanguageService {
  getDiagnostics(fileVersion: FileVersion): Promise<?DiagnosticProviderUpdate>,

  observeDiagnostics(): ConnectableObservable<Array<FileDiagnosticMessages>>,

  getAutocompleteSuggestions(
    fileVersion: FileVersion,
    position: atom$Point,
    activatedManually: boolean,
    prefix: string,
  ): Promise<?AutocompleteResult>,

  getDefinition(
    fileVersion: FileVersion,
    position: atom$Point,
  ): Promise<?DefinitionQueryResult>,

  findReferences(
    fileVersion: FileVersion,
    position: atom$Point,
  ): Promise<?FindReferencesReturn>,

  getCoverage(filePath: NuclideUri): Promise<?CoverageResult>,

  getOutline(fileVersion: FileVersion): Promise<?Outline>,

  typeHint(fileVersion: FileVersion, position: atom$Point): Promise<?TypeHint>,

  highlight(
    fileVersion: FileVersion,
    position: atom$Point,
  ): Promise<?Array<atom$Range>>,

  formatSource(
    fileVersion: FileVersion,
    range: atom$Range,
  ): Promise<?Array<TextEdit>>,

  formatEntireFile(
    fileVersion: FileVersion,
    range: atom$Range,
  ): Promise<?{
    newCursor?: number,
    formatted: string,
  }>,

  formatAtPosition(
    fileVersion: FileVersion,
    position: atom$Point,
    triggerCharacter: string,
  ): Promise<?Array<TextEdit>>,

  getEvaluationExpression(
    fileVersion: FileVersion,
    position: atom$Point,
  ): Promise<?NuclideEvaluationExpression>,

  supportsSymbolSearch(directories: Array<NuclideUri>): Promise<boolean>,

  symbolSearch(
    query: string,
    directories: Array<NuclideUri>,
  ): Promise<?Array<SymbolResult>>,

  getProjectRoot(fileUri: NuclideUri): Promise<?NuclideUri>,

  isFileInProject(fileUri: NuclideUri): Promise<boolean>,

  dispose(): void,
}