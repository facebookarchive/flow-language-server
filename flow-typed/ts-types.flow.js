declare interface Disposable {
  isDisposed: boolean,
  dispose: () => void,
}

declare interface Thenable {
  then: Function,
}
