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
import {getLogger} from './pkg/nuclide-logging';

const logger = getLogger();

export default class TextDocument {
  uri: NuclideUri;
  languageId: string;
  version: number;
  _buffer: SimpleTextBuffer;
  _emitter: Emitter;

  constructor(uri: string, languageId: string, version: number, text: string) {
    this.uri = uri;
    this.languageId = languageId;
    this.version = version;
    this._emitter = new Emitter();
    this._buffer = new SimpleTextBuffer(text);

    this._buffer.onDidStopChanging(this._handleDidStopChanging);
  }

  dispose() {
    this._emitter.dispose();
  }

  get lineCount(): number {
    return this._buffer.getLineCount();
  }

  getText(): string {
    return this._buffer.getText();
  }

  offsetAt(position: Position): number {
    return this._buffer.characterIndexForPosition(
      lspPositionToAtomPoint(position),
    );
  }

  onDidStopChanging(handler: (doc: TextDocument) => void): IDisposable {
    return this._emitter.on('didStopChanging', handler);
  }

  positionAt(offset: number): Position {
    return atomPointToLSPPosition(
      this._buffer.positionForCharacterIndex(offset),
    );
  }

  updateMany(changes: Array<TextDocumentContentChangeEvent>, version: number) {
    for (const change of changes) {
      if (change.range != null) {
        // Incremental update
        this._buffer.setTextInRange(
          lspRangeToAtomRange(change.range),
          change.text,
        );
      } else {
        // Full text update
        this._buffer.setText(change.text);
      }
    }
    this.version = version;

    return this;
  }

  _handleDidStopChanging = () => {
    this._emitter.emit('didStopChanging', this);
  };
}
