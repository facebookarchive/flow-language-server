// @flow
import type {TextDocumentContentChangeEvent} from 'vscode-languageserver-types';
import type {NuclideUri} from './pkg/commons-node/nuclideUri';

import invariant from 'assert';
import SimpleTextBuffer from 'simple-text-buffer';
import UniversalDisposable from './pkg/commons-node/UniversalDisposable';
import {Emitter} from 'event-kit';
import {
  atomPointToLSPPosition,
  compareLspPosition,
  compareLspRange,
  lspPositionToAtomPoint,
  lspRangeToAtomRange,
} from './utils/util';
import {getLogger} from 'log4js';

const logger = getLogger('TextDocument');

export default class TextDocument {
  buffer: SimpleTextBuffer;
  isDirty: boolean = false;
  languageId: string;
  uri: NuclideUri;
  version: number;

  _disposables: UniversalDisposable = new UniversalDisposable();
  _emitter: Emitter = new Emitter();

  constructor(uri: string, languageId: string, version: number, text: string) {
    this.uri = uri;
    this.languageId = languageId;
    this.version = version;
    this.buffer = new SimpleTextBuffer(text);

    this._disposables.add(this._emitter);
    this._disposables.add(
      this.buffer.onDidStopChanging(this._handleDidStopChanging),
    );
  }

  assertNotDisposed() {
    invariant(
      !this.disposed,
      `TextDocument with uri ${this.uri} was already disposed`,
    );
  }

  dispose() {
    this.assertNotDisposed();
    this._disposables.dispose();
  }

  get disposed(): boolean {
    return this._disposables.disposed;
  }

  get lineCount(): number {
    this.assertNotDisposed();
    return this.buffer.getLineCount();
  }

  getText(): string {
    this.assertNotDisposed();
    return this.buffer.getText();
  }

  offsetAt(position: Position): number {
    this.assertNotDisposed();
    return this.buffer.characterIndexForPosition(
      lspPositionToAtomPoint(position),
    );
  }

  onDidStopChanging(handler: (document: TextDocument) => void): IDisposable {
    this.assertNotDisposed();
    return this._emitter.on('didStopChanging', handler);
  }

  onDidSave(handler: (document: TextDocument) => void): IDisposable {
    this.assertNotDisposed();
    return this._emitter.on('didSave', handler);
  }

  positionAt(offset: number): Position {
    this.assertNotDisposed();
    return atomPointToLSPPosition(
      this.buffer.positionForCharacterIndex(offset),
    );
  }

  save(version: number, text: ?string) {
    this.assertNotDisposed();
    if (text != null) {
      this.buffer.setText(text);
    }

    this.version = version;
    this.isDirty = false;
    this._emitter.emit('didSave', this);
    logger.debug(`TextDocument: saved ${this.uri} and marked not dirty`);
  }

  updateMany(changes: Array<TextDocumentContentChangeEvent>, version: number) {
    this.assertNotDisposed();

    this.isDirty = true;
    this.version = version;

    // Ensure that ranged changes are sorted in reverse order.
    // Otherwise, the changes can't be applied cleanly.
    changes.sort((a, b) => {
      invariant(
        a.range != null && b.range != null,
        'There should only be one full-text update.',
      );
      return compareLspRange(b.range, a.range);
    });

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

    logger.debug(`TextDocument: ${this.uri} updated and marked dirty`);
  }

  _handleDidStopChanging = () => {
    this.assertNotDisposed();
    this._emitter.emit('didStopChanging', this);
  };
}
