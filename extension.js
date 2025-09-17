const vscode = require('vscode');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Store terminals in a map to reuse them
let terminals = {};
let customDiagnosticCollection; // Global diagnostic collection for real-time syntax checking

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Extension "run-c-code" is now active!');

    // Initialize diagnostic collection for real-time syntax checking
    customDiagnosticCollection = vscode.languages.createDiagnosticCollection('c-custom-syntax');
    context.subscriptions.push(customDiagnosticCollection);

    // Real-time syntax checking - check when files are saved or opened
    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(document => {
            updateDiagnostics(document);
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(document => {
            updateDiagnostics(document);
        })
    );

    // Check currently opened file when extension activates
    if (vscode.window.activeTextEditor) {
        updateDiagnostics(vscode.window.activeTextEditor.document);
    }

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

    let disposable = vscode.commands.registerCommand('run-c-code.runCFile', async function (fileUri) {
        await runCCode(fileUri);
    });

    // Removed selected code feature as requested
    // let runSelectedDisposable = vscode.commands.registerCommand('run-c-code.runSelectedCode', function () {
    //     runSelectedCCode();
    // });

    context.subscriptions.push(disposable);
    // context.subscriptions.push(runSelectedDisposable);
}

/**
 * Update diagnostics for real-time syntax checking
 * @param {vscode.TextDocument} document
 */
function updateDiagnostics(document) {
    // Only check C/C++ files
    if (!document || (!document.fileName.endsWith('.c') && !document.fileName.endsWith('.cpp'))) {
        customDiagnosticCollection.delete(document.uri); // Clear diagnostics for non-C/C++ files
        return;
    }

    try {
        const content = document.getText();
        const lines = content.split('\n');
        const diagnostics = [];

        // Only check for scanf without & (address operator)
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNum = i + 1;

            // Skip comments and empty lines
            if (!line || line.startsWith('//')) continue;

            // Handle block comments
            if (line.includes('/*')) {
                // Skip until comment ends
                continue;
            }

            if (line.includes('scanf(')) {
                // Find all scanf calls in the line
                const scanfCalls = line.match(/scanf\s*\(\s*"[^"]*"\s*,\s*[^)]+\)/g);
                if (scanfCalls) {
                    for (const scanfCall of scanfCalls) {
                        const scanfMatch = scanfCall.match(/scanf\s*\(\s*"([^"]*)"\s*,\s*([^)]+)\)/);
                        if (scanfMatch) {
                            const formatSpec = scanfMatch[1];
                            const variables = scanfMatch[2].split(',').map(v => v.trim());

                            // Check each variable based on format specifier
                            let varIndex = 0;
                            const formatMatches = formatSpec.match(/%[dcsf]/g);
                            if (formatMatches) {
                                for (let j = 0; j < formatMatches.length && varIndex < variables.length; j++) {
                                    const format = formatMatches[j];
                                    const variable = variables[varIndex++].trim();

                                    // Skip string arrays (char arrays don't need &)
                                    if (format === '%s' && variable.includes('[')) {
                                        continue;
                                    }

                                    // For %d, %c, %f, %i - need & for variables
                                    if ((format === '%d' || format === '%c' || format === '%f' || format === '%i') &&
                                        !variable.startsWith('&')) {
                                        const range = new vscode.Range(
                                            lineNum - 1, // VS Code uses 0-based indexing
                                            0, // Start of line
                                            lineNum - 1,
                                            1000 // End of line (large number)
                                        );
                                        diagnostics.push(new vscode.Diagnostic(
                                            range,
                                            `Missing '&' before variable '${variable}' in scanf - should be &${variable}`,
                                            vscode.DiagnosticSeverity.Error
                                        ));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Update the Problems panel
        customDiagnosticCollection.set(document.uri, diagnostics);

    } catch (error) {
        console.warn('Failed to run scanf syntax check:', error);
        customDiagnosticCollection.delete(document.uri); // Clear diagnostics on error
    }
}

function runSelectedCCode() {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        vscode.window.showErrorMessage('No active editor');
        return;
    }

    const selection = activeEditor.selection;
    if (selection.isEmpty) {
        vscode.window.showErrorMessage('No code selected. Select some code first.');
        return;
    }

    const selectedText = activeEditor.document.getText(selection);
    if (!selectedText.trim()) {
        vscode.window.showErrorMessage('Selected text is empty');
        return;
    }

    // Check if selected code contains main function
    if (!selectedText.includes('main')) {
        vscode.window.showErrorMessage('Selected code must contain a main function');
        return;
    }

    // Create temporary file for selected code
    const tempFileName = `temp_selected_code_${Date.now()}.c`;
    const tempFilePath = path.join(require('os').tmpdir(), tempFileName);

    try {
        require('fs').writeFileSync(tempFilePath, selectedText);
        runCCode(null, tempFilePath, true);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create temporary file: ${error.message}`);
    }
}

async function runCCode(fileUri, customFilePath = null, isTempFile = false) {
        // Get the current file path
        let filePath;
    if (customFilePath) {
        filePath = customFilePath;
    } else if (fileUri) {
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

    // Ensure it's a C or C++ file
    if (!filePath.endsWith('.c') && !filePath.endsWith('.cpp')) {
        vscode.window.showErrorMessage('Selected file is not a C or C++ file');
            return;
        }

    // Get configuration settings
    const config = vscode.workspace.getConfiguration('run-c-code');
    const saveFileBeforeRun = config.get('saveFileBeforeRun', true);

    // Save file before running if enabled
    if (saveFileBeforeRun && !isTempFile) {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && activeEditor.document.uri.fsPath === filePath) {
            const isDirty = activeEditor.document.isDirty;
            if (isDirty) {
                await activeEditor.document.save();
            }
        }
    }

    // Continue with compilation after file operations
    console.log('About to call performCompilation with:', filePath, isTempFile);
    await performCompilation(filePath, isTempFile);
}

async function performCompilation(filePath, isTempFile) {
    console.log('performCompilation called with:', filePath, isTempFile);
    // Get remaining configuration settings
    const config = vscode.workspace.getConfiguration('run-c-code');
    const useNewTerminalPerFile = config.get('useNewTerminalPerFile', false);
    const closePreviousTerminals = config.get('closePreviousTerminals', false);
    const compilerType = config.get('compilerType', 'auto');
    const customCompilerPath = config.get('compilerPath', '');
    const enableWarnings = config.get('enableWarnings', true);
    const optimizationLevel = config.get('optimizationLevel', 'none');
    const additionalCompilerArgs = config.get('additionalCompilerArgs', '');
    const runArgs = config.get('runArgs', '');

    let terminal;
    let terminalName;

    if (useNewTerminalPerFile) {
        // Use separate terminal per file (reuse for same file)
        terminalName = `Run C/C++ - ${path.basename(filePath)}`;
        terminal = terminals[terminalName];

        // If no terminal exists or it was closed
        if (!terminal || terminal.exitStatus !== undefined) {
            // Create a new terminal
            terminal = vscode.window.createTerminal(terminalName);
            terminals[terminalName] = terminal;
        }
                } else {
        // Use single global terminal for all files
        const globalTerminalKey = 'global';
        terminalName = 'Run C/C++';

        if (closePreviousTerminals) {
            // Close all existing terminals
            for (let key in terminals) {
                const existingTerminal = terminals[key];
                if (existingTerminal) {
                    existingTerminal.dispose();
                }
            }
            terminals = {}; // Clear the map
        }

        terminal = terminals[globalTerminalKey];
    
    // If no terminal exists or it was closed
    if (!terminal || terminal.exitStatus !== undefined) {
        // Create a new terminal
        terminal = vscode.window.createTerminal(terminalName);
            terminals[globalTerminalKey] = terminal;
        }
    }
    
    // Show the terminal and focus it
    terminal.show(true);
    
    // Compile and run in terminal
    const dirName = path.dirname(filePath);
    terminal.sendText(`cd "${dirName}"`);

    // Determine compiler based on settings and file extension
    let compiler;
    if (customCompilerPath) {
        compiler = customCompilerPath;
    } else if (compilerType === 'auto') {
        compiler = filePath.endsWith('.cpp') ? 'g++' : 'gcc';
    } else {
        compiler = compilerType;
    }

    // Build compiler arguments
    let compilerFlags = [];

    // Add warnings if enabled
    if (enableWarnings) {
        compilerFlags.push('-Wall');
    }

    // Add optimization level
    if (optimizationLevel !== 'none') {
        compilerFlags.push(`-${optimizationLevel}`);
    }

    // Add additional custom args
    if (additionalCompilerArgs.trim()) {
        compilerFlags.push(additionalCompilerArgs.trim());
    }

    // Build final compiler command
    const flagsString = compilerFlags.length > 0 ? ` ${compilerFlags.join(' ')}` : '';
    const fileName = path.basename(filePath);
    const exeBaseName = fileName.replace(/\.(c|cpp)$/, '');
    const exeName = process.platform === 'win32' ? `${exeBaseName}.exe` : exeBaseName;
    const compilerCmd = `${compiler}${flagsString} "${fileName}" -o "${exeName}"`;

    terminal.sendText(compilerCmd);

    // Run the executable with platform-specific command and custom args
    const exeArgs = runArgs ? ` ${runArgs}` : '';

    if (process.platform === 'win32') {
        // Windows - use call operator with quotes for filenames with spaces
        terminal.sendText(`& ".\\${exeName}"${exeArgs}`);
    } else {
        // macOS/Linux
        terminal.sendText(`./${exeName}${exeArgs}`);
    }

    // Clean up temporary file if needed
    if (isTempFile) {
        try {
            require('fs').unlinkSync(filePath);
        } catch (error) {
            console.warn('Failed to clean up temporary file:', error);
        }
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