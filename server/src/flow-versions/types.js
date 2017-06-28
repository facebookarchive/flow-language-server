export type VersionInfo = {
  pathToFlow: string,
  flowVersion: string,
};

export type Reporter = {
  +info: (...msgs: Array<any>) => void,
  +warn: (...msgs: Array<any>) => void,
  +error: (...msgs: Array<any>) => void,
};
