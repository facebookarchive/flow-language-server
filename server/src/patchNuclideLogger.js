// @flow

import * as path from 'path';
import {IConnection} from 'vscode-languageserver';

import {getLogger, getDefaultConfig, updateConfig} from './pkg/nuclide-logging';

// Patch Nuclide's configuration for log4js to not log to console, since
// writing arbitrary data to stdout will break JSON RPC if we're running over
// stdout.
//
// Additionally add an appender to log over the rpc connection so logging appears
// in the client environment, independent of stdio, node rpc, socket, etc.
export default async function patchNuclideLogger(connection: IConnection) {
  const defaultConfig = await getDefaultConfig();
  updateConfig({
    ...defaultConfig,
    appenders: defaultConfig.appenders
      .filter(a => {
        return !(a.appender &&
          /pkg\/nuclide-logging\/lib\/consoleAppender/.test(a.appender.type));
      })
      .concat([
        {
          type: 'logLevelFilter',
          level: process.argv.includes('--debug') ? 'DEBUG' : 'INFO',
          appender: {
            connection,
            type: path.join(__dirname, 'connectionConsoleAppender'),
          },
        },
      ]),
  });

  const logger = getLogger();
  process.on('uncaughtException', e => logger.error('uncaughtException', e));
  process.on('unhandledRejection', e => logger.error('unhandledRejection', e));

  // don't let anything write to the true stdio as it could break JSON RPC
  global.console.log = connection.console.log.bind(connection.console);
  global.console.error = connection.console.error.bind(connection.console);
}
