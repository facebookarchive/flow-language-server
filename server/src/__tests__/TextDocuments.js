import ConnectionMock from '../ConnectionMock';
import TextDocuments from '../TextDocuments';

const uri = 'file:///some/test/uri.js';
const languageId = 'javascript';

let docs, connection;

beforeEach(() => {
  docs = new TextDocuments();
  connection = new ConnectionMock();
  docs.listen(connection);
});

test('sets doc when the connection sends doc opened', () => {
  expect(docs.all().length).toBe(0);

  connection._emitter.emit('didOpen', {
    textDocument: {
      uri,
      languageId,
      version: 1,
      text: 'foobar',
    },
  });

  expect(docs.all().length).toBe(1);
  expect(docs.all()[0].getText()).toBe('foobar');
});

test('updates an entire doc when no range provided', () => {
  connection._emitter.emit('didOpen', {
    textDocument: {
      uri,
      languageId,
      version: 1,
      text: 'foobar',
    },
  });

  expect(docs.all().length).toBe(1);
  expect(docs.all()[0].getText()).toBe('foobar');

  connection._emitter.emit('didChange', {
    contentChanges: [{text: 'example foobaz'}],
    textDocument: {
      uri,
      languageId,
      version: 2,
    },
  });

  expect(docs.all().length).toBe(1);
  expect(docs.all()[0].getText()).toBe('example foobaz');
});

test('updates a text range of a doc when range provided', () => {
  connection._emitter.emit('didOpen', {
    textDocument: {
      uri,
      languageId,
      version: 1,
      text: 'foobar',
    },
  });

  expect(docs.all().length).toBe(1);
  expect(docs.all()[0].getText()).toBe('foobar');

  connection._emitter.emit('didChange', {
    contentChanges: [
      {
        range: {
          start: {
            line: 0,
            character: 3,
          },
          end: {
            line: 0,
            character: 17,
          },
        },
        text: 'example foobaz',
      },
    ],
    textDocument: {
      uri,
      languageId,
      version: 2,
    },
  });

  expect(docs.all().length).toBe(1);
  expect(docs.all()[0].getText()).toBe('fooexample foobaz');
});

test('deletes doc when the connection sends doc closed', () => {
  connection._emitter.emit('didOpen', {
    textDocument: {
      uri,
      languageId,
      version: 1,
      text: 'foobar',
    },
  });
  expect(docs.all().length).toBe(1);

  connection._emitter.emit('didClose', {
    textDocument: {
      uri,
    },
  });
  expect(docs.all().length).toBe(0);
});
