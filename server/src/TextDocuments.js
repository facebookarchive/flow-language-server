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

import TextDocument from './TextDocument';
import {Emitter} from 'event-kit';
import {TextDocumentSyncKind} from 'vscode-languageserver';
import {getLogger} from './pkg/nuclide-logging';

const logger = getLogger();

type onChangeHandler = (e: TextDocumentChangeEvent) => void;

function textDocumentFromLSPTextDocument(textDocument: TextDocumentItem) {
  return new TextDocument(
    textDocument.uri,
    textDocument.languageId,
    textDocument.version,
    textDocument.text,
  );
}

export default class TextDocuments {
  _docs: Map<string, TextDocument>;
  _emitter: Emitter;

  constructor() {
    this._docs = new Map();
    this._emitter = new Emitter();
  }

  get syncKind(): TextDocumentSyncKindType {
    return TextDocumentSyncKind.Incremental;
  }

  get(uri: string) {
    const doc = this._docs.get(uri);

    if (doc == null) {
      logger.error(
        'asked up update doc with uri',
        uri,
        'but buffer was not considered open',
      );

      throw new Error('document with uri', uri, 'does not exist');
    }
    return doc;
  }

  listen(connection: IConnection): void {
    global.connection = connection;
    connection.onDidOpenTextDocument((e: DidOpenTextDocumentParams) => {
      const {textDocument} = e;
      const doc = textDocumentFromLSPTextDocument(textDocument);

      this._docs.set(textDocument.uri, doc);
      doc.onDidStopChanging(this._handleStopChanging);
    });

    connection.onDidChangeTextDocument((e: DidChangeTextDocumentParams) => {
      const {contentChanges, textDocument} = e;
      const doc = this.get(textDocument.uri);
      doc.updateMany(contentChanges, textDocument.version);
    });

    connection.onDidCloseTextDocument((e: DidCloseTextDocumentParams) => {
      const {textDocument} = e;

      const doc = this._docs.get(textDocument.uri);
      doc && doc.dispose();
      this._docs.delete(textDocument.uri);
    });
  }

  all(): Array<TextDocument> {
    return Array.from(this._docs.values());
  }

  _handleStopChanging = (document: TextDocument) => {
    this._emitter.emit('didChangeContent', {document});
  };

  onDidChangeContent(handler: onChangeHandler): void {
    this._emitter.on('didChangeContent', handler);
  }
}
