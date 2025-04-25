const vscode = require('vscode');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Extension "run-c-code" is now active!');

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

    // Show terminal
    const terminal = vscode.window.createTerminal(`Run C - ${fileName}`);
    terminal.show();

    // Compile and run in terminal
    terminal.sendText(`cd "${dirName}"`);
    terminal.sendText(`gcc "${fileName}" -o "${fileNameWithoutExt}.exe"`);
    
    // Run using relative path
    terminal.sendText(`./${fileNameWithoutExt}.exe`);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}; 