# Flow Language Server
This is an implementation of the [Language Server Protocol](https://github.com/Microsoft/language-server-protocol/) for the Flow static type checker for JavaScript.

An implementation of the Language Server Protocol for the Flow static type checker for JavaScript.


It wraps the existing flow server binary the user has installed either locally in their project as the `flow-bin` module from npm, or globally as the `flow` binary.

## Installation
Install one of the client plugins (for now this is limited to `flow-vscode`) into your editor of choice and it should start the server and provide language features when activated.

## Development
Clone the repository and run `yarn` in both the root of the repo as well as in the directory for the client (`flow-vscode` for now)

### flow-vscode
Open the directory `flow-vscode` inside VSCode. Press `F5` or use the debug button in the left bar to launch the extension in debug mode. This will launch a extension test target version of VS Code to test the extension. 

Open a JS file and the language server should be launched. In the debug pane, you can view the extension output in the Output tab, including stdout from the language server or the extension itself.