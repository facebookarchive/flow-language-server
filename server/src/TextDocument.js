// @flow
import type {TextDocumentContentChangeEvent} from 'vscode-languageserver-types';
import type {NuclideUri} from './pkg/commons-node/nuclideUri';

import SimpleTextBuffer from 'simple-text-buffer';
import {Emitter} from 'event-kit';
import {
  atomPointToLSPPosition,
  lspPositionToAtomPoint,
  lspRangeToAtomRange,
} from './utils/util';

export default class TextDocument {
  buffer: SimpleTextBuffer;
  isDirty: boolean = false;
  languageId: string;
  uri: NuclideUri;
  version: number;
  _emitter: Emitter = new Emitter();

  constructor(uri: string, languageId: string, version: number, text: string) {
    this.uri = uri;
    this.languageId = languageId;
    this.version = version;
    this.buffer = new SimpleTextBuffer(text);

    this.buffer.onDidStopChanging(this._handleDidStopChanging);
  }

  dispose() {
    this._emitter.dispose();
  }

  get lineCount(): number {
    return this.buffer.getLineCount();
  }

  getText(): string {
    return this.buffer.getText();
  }

  offsetAt(position: Position): number {
    return this.buffer.characterIndexForPosition(
      lspPositionToAtomPoint(position),
    );
  }

  onDidStopChanging(handler: (doc: TextDocument) => void): IDisposable {
    return this._emitter.on('didStopChanging', handler);
  }

  positionAt(offset: number): Position {
    return atomPointToLSPPosition(
      this.buffer.positionForCharacterIndex(offset),
    );
  }

  updateMany(changes: Array<TextDocumentContentChangeEvent>, version: number) {
    this.isDirty = true;
    this.version = version;

    for (const change of changes) {
      if (change.range != null) {
        // Incremental update
        this.buffer.setTextInRange(
          lspRangeToAtomRange(change.range),
          change.text,
        );
      } else {
        // Full text update
        this.buffer.setText(change.text);
      }
    }
  }

  _handleDidStopChanging = () => {
    this._emitter.emit('didStopChanging', this);
  };
}
