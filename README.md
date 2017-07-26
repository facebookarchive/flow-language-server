# Flow Language Server

[![npm](https://img.shields.io/npm/v/flow-language-server.svg)](https://www.npmjs.com/package/flow-language-server) [![CircleCI](https://circleci.com/gh/flowtype/flow-language-server/tree/master.svg?style=shield&circle-token=58418cffe1efc61717f814506b22d443904db15d)](https://circleci.com/gh/flowtype/flow-language-server/tree/master)

This is an implementation of the [Language Server Protocol](https://github.com/Microsoft/language-server-protocol/) for the [Flow static type checker](https://flow.org/) for JavaScript. `flow-language-server` makes creating a Flow integration for your favorite text editor or IDE much simpler.

## Requirements
flow-language-server requires Node v6 or any later maintained version of Node.js.
It also requires [any supported operating system platform for Flow](https://github.com/facebook/flow/#requirements).

## Installation
You most likely don't need to install `flow-language-server` directly if you want Flow support for your favorite editor; instead, [check out the integrations below](#editor-integrations).

## How it works
`flow-language-server` wraps the existing flow server binary the user has installed either locally in their project as the `flow-bin` module from npm, or globally as the `flow` binary. `flow-language-server` translates messages as they come in from Flow, sending them over JSON RPC via stdio, node-ipc, a socket, or a named pipe. It also, for the time being, automatically downloads and manages any missing flow binaries, though this probably is best suited to each individual editor integration.

## Building an editor integration
If your editor integration is built with node.js, you can install `flow-language-server` as a dependency:
* `yarn add flow-language-server` or
* `npm install -S flow-language-server`

Otherwise, `flow-language-server` can be installed globally from npm into the user's path:
* `yarn global add flow-language-server` or
* `npm install -g flow-language-server`

## Editor Integrations

### [Flow for Atom IDE (ide-flow)](https://github.com/flowtype/ide-flow/)
Developed in conjunction with flow-language-server, Flow for Atom IDE showcases all that the language server has to offer. Install it as `ide-flow` through Atom's package manager along with `atom-ide-ui`.

### Neovim
`flow-language-server` can be used with neovim:
1. Install [LanguageClient-neovim](https://github.com/autozimu/LanguageClient-neovim)
2. Run `npm install -g flow-language-server` or `yarn global add flow-language-server`
3. Add the following to neovim's configuration:

```
let g:LanguageClient_serverCommands = {
\ 'javascript': ['flow-language-server', '--stdio'],
\ }

" (Optionally) automatically start language servers.
let g:LanguageClient_autoStart = 1
```

### Wrote your own editor integration using `flow-language-server`? Send us a pull request to add it here!

## Contributing

### [Code of Conduct](https://code.facebook.com/codeofconduct)
Facebook has adopted a Code of Conduct that we expect project participants to adhere to. Please read the full text so that you can understand what actions will and will not be tolerated.

### Contributor License Agreement ("CLA")
In order to accept your pull request, we need you to submit a CLA. You only need
to do this once to work on any of Facebook's open source projects.

Complete your CLA here: <https://code.facebook.com/cla>

## License
flow-language-server is BSD licensed. We also provide an additional patent grant.
