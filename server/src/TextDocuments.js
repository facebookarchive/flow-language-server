// @flow

import type {
  IConnection,
  TextDocumentSyncKindType,
} from 'vscode-languageserver';

import type {
  DidChangeTextDocumentParams,
  DidCloseTextDocumentParams,
  DidOpenTextDocumentParams,
} from 'vscode-languageserver/lib/protocol';

import type {TextDocumentItem} from 'vscode-languageserver-types';

import invariant from 'invariant';
import TextDocument from './TextDocument';
import {Emitter} from 'event-kit';
import {TextDocumentSyncKind} from 'vscode-languageserver';
import {getLogger} from './pkg/nuclide-logging';

const logger = getLogger();

type onChangeHandler = (e: TextDocumentChangeEvent) => void;
type onDidOpenHandler = (e: TextDocumentChangeEvent) => void;

type ManagedDocument = {
  document: TextDocument,
  onDidStopChangingDisposable: IDisposable,
};

function textDocumentFromLSPTextDocument(textDocument: TextDocumentItem) {
  return new TextDocument(
    textDocument.uri,
    textDocument.languageId,
    textDocument.version,
    textDocument.text,
  );
}

export default class TextDocuments {
  _managedDocuments: Map<string, ManagedDocument>;
  _emitter: Emitter;

  constructor() {
    this._managedDocuments = new Map();
    this._emitter = new Emitter();
  }

  get syncKind(): TextDocumentSyncKindType {
    return TextDocumentSyncKind.Incremental;
  }

  get(uri: string) {
    const managedDocument = this._managedDocuments.get(uri);

    if (managedDocument == null || managedDocument.document == null) {
      logger.error(
        'asked up update doc with uri',
        uri,
        'but buffer was not considered open',
      );

      throw new Error('document with uri ' + uri + ' does not exist');
    }
    return managedDocument.document;
  }

  listen(connection: IConnection): void {
    connection.onDidOpenTextDocument((e: DidOpenTextDocumentParams) => {
      const {textDocument} = e;
      const document = textDocumentFromLSPTextDocument(textDocument);

      this._managedDocuments.set(textDocument.uri, {
        document,
        onDidStopChangingDisposable: document.onDidStopChanging(
          this._handleDidStopChanging,
        ),
      });
      this._emitter.emit('didOpenTextDocument', {textDocument: document});
    });

    connection.onDidChangeTextDocument((e: DidChangeTextDocumentParams) => {
      const {contentChanges, textDocument} = e;
      const document = this.get(textDocument.uri);
      document.updateMany(contentChanges, textDocument.version);
    });

    connection.onDidCloseTextDocument((e: DidCloseTextDocumentParams) => {
      const {textDocument} = e;

      const managedDocument = this._managedDocuments.get(textDocument.uri);
      invariant(managedDocument != null, 'requires managed document');
      managedDocument.onDidStopChangingDisposable.dispose();
      this._managedDocuments.delete(textDocument.uri);
    });
  }

  all(): Array<TextDocument> {
    return Array.from(this._managedDocuments.values()).map(
      ({document}) => document,
    );
  }

  _handleDidStopChanging = (document: TextDocument) => {
    this._emitter.emit('didChangeContent', {document});
  };

  onDidChangeContent(handler: onChangeHandler): void {
    this._emitter.on('didChangeContent', handler);
  }

  onDidOpenTextDocument(handler: onDidOpenHandler): void {
    this._emitter.on('didOpenTextDocument', handler);
  }
}
