const vscode = require('vscode');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Store terminals in a map to reuse them
let terminals = {};

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Extension "run-c-code" is now active!');

    // Clean up terminals when they're closed
    vscode.window.onDidCloseTerminal(terminal => {
        // Remove closed terminal from our terminals map
        for (let fileName in terminals) {
            if (terminals[fileName] === terminal) {
                delete terminals[fileName];
                break;
            }
        }
    });

    let disposable = vscode.commands.registerCommand('run-c-code.runCFile', function (fileUri) {
        // Get the current file path
        let filePath;
        if (fileUri) {
            // When command is triggered from explorer context menu
            filePath = fileUri.fsPath;
        } else {
            // When command is triggered from editor context menu or keyboard shortcut
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                filePath = activeEditor.document.uri.fsPath;
            } else {
                vscode.window.showErrorMessage('No file is currently open');
                return;
            }
        }

        // Ensure it's a C file
        if (!filePath.endsWith('.c')) {
            vscode.window.showErrorMessage('Selected file is not a C file');
            return;
        }

        // Save the file first if it has unsaved changes
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && activeEditor.document.isDirty) {
            activeEditor.document.save().then(success => {
                if (success) {
                    compileAndRunFile(filePath);
                } else {
                    vscode.window.showErrorMessage('Failed to save the file before compiling');
                }
            });
        } else {
            compileAndRunFile(filePath);
        }
    });

    context.subscriptions.push(disposable);
}

function compileAndRunFile(filePath) {
    // Get file details
    const fileName = path.basename(filePath);
    const dirName = path.dirname(filePath);
    const fileNameWithoutExt = path.parse(fileName).name;
    const terminalName = `Run C - ${fileName}`;

    // Check if we already have a terminal for this file
    let terminal = terminals[fileName];
    
    // If no terminal exists or it was closed
    if (!terminal || terminal.exitStatus !== undefined) {
        // Create a new terminal
        terminal = vscode.window.createTerminal(terminalName);
        terminals[fileName] = terminal;
    }
    
    // Show the terminal
    terminal.show();
    
    // Compile and run in terminal
    terminal.sendText(`cd "${dirName}"`);
    terminal.sendText(`gcc "${fileName}" -o "${fileNameWithoutExt}.exe"`);
    
    // Run the executable with platform-specific command
    if (process.platform === 'win32') {
        // Windows - use & operator with quotes for filenames with spaces
        terminal.sendText(`& ".\\${fileNameWithoutExt}.exe"`);
    } else {
        // macOS/Linux
        terminal.sendText(`./${fileNameWithoutExt}.exe`);
    }
}

function deactivate() {
    // Clean up terminals when extension is deactivated
    for (let fileName in terminals) {
        const terminal = terminals[fileName];
        if (terminal) {
            terminal.dispose();
        }
    }
    terminals = {};
}

module.exports = {
    activate,
    deactivate
}; 