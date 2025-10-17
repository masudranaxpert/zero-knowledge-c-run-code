const vscode = require('vscode');
const { refactorTextWithGemini } = require('./gemini.js');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Store terminals in a map to reuse them
let terminals = {};
let customDiagnosticCollection; // Global diagnostic collection for real-time syntax checking
let diagnosticDebounceTimer; // Debounce timer for real-time diagnostics

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Extension "run-c-code" is now active!');

    // Initialize diagnostic collection for real-time syntax checking
    customDiagnosticCollection = vscode.languages.createDiagnosticCollection('c-custom-syntax');
    context.subscriptions.push(customDiagnosticCollection);

    // Real-time syntax checking - debounce on text change, and check on open
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            if (!event || !event.document) return;
            if (diagnosticDebounceTimer) clearTimeout(diagnosticDebounceTimer);
            diagnosticDebounceTimer = setTimeout(() => {
                updateDiagnostics(event.document);
            }, 500);
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

    // Inline completion (Copilot-style) for scanf after simple variable declarations
    const selector = [{ language: 'c' }, { language: 'cpp' }];
    if (vscode.languages.registerInlineCompletionItemProvider) {
        const inlineProvider = vscode.languages.registerInlineCompletionItemProvider(
            selector,
            {
                provideInlineCompletionItems(document, position) {
                    // Do not suggest if current line already has text
                    const currentLine = document.lineAt(position.line).text.trim();
                    if (currentLine.length > 0) {
                        return;
                    }

                    // Look at previous non-empty line to detect a declaration
                    let prevLineIndex = position.line - 1;
                    while (prevLineIndex >= 0 && document.lineAt(prevLineIndex).text.trim() === '') {
                        prevLineIndex--;
                    }
                    if (prevLineIndex < 0) return;
                    const prevLine = document.lineAt(prevLineIndex).text;
                    const decl = parseVariableDeclaration(prevLine);
                    if (!decl || decl.variableNames.length === 0) return;

                    const specifierMap = {
                        int: '%d',
                        float: '%f',
                        double: '%lf',
                        char: ' %c'
                    };
                    const spec = specifierMap[decl.variableType];
                    if (!spec) return;

                    const formatSpecifiers = decl.variableNames.map(() => spec).join('');
                    const ampersandVars = decl.variableNames.map(n => `&${n}`).join(', ');
                    const suggestion = `scanf("${formatSpecifiers}", ${ampersandVars});`;
                    return [new vscode.InlineCompletionItem(suggestion)];
                }
            }
        );
        context.subscriptions.push(inlineProvider);
    }

    // Gemini refactor command registration
    let geminiDisposable = vscode.commands.registerCommand('run-c-code.refactorWithGemini', async function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        if (selection.isEmpty) {
            vscode.window.showInformationMessage('Please select the text you want to improve.');
            return;
        }

        const config = vscode.workspace.getConfiguration('run-c-code');
        const isEnabled = config.get('experimental.enableGeminiRefactor');
        const apiKey = config.get('geminiApiKey');
        const modelName = config.get('geminiModel', 'gemini-2.5-flash-lite');
        const extraRules = config.get('geminiExtraRules', '');

        if (!isEnabled) {
            vscode.window.showWarningMessage('Gemini text refactoring is disabled. Enable it in the settings.');
            return;
        }
        if (!apiKey) {
            vscode.window.showErrorMessage('Gemini API Key is not set. Please add your API key in the settings.');
            return;
        }

        const startLine = Math.max(selection.start.line - 5, 0);
        const endLine = Math.min(selection.end.line + 5, editor.document.lineCount - 1);
        const surroundingRange = new vscode.Range(startLine, 0, endLine, editor.document.lineAt(endLine).text.length);
        const surroundingCode = editor.document.getText(surroundingRange);

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: '✨ Refining text with Gemini...',
            cancellable: false
        }, async () => {
            try {
                const improvedText = await refactorTextWithGemini(apiKey, selectedText, surroundingCode, modelName, extraRules);
                await editor.edit(editBuilder => {
                    editBuilder.replace(selection, improvedText);
                });
            } catch (err) {
                vscode.window.showErrorMessage(err.message || 'Gemini refactor failed');
            }
        });
    });

    context.subscriptions.push(geminiDisposable);
}

/**
 * Update diagnostics for real-time syntax checking
 * @param {vscode.TextDocument} document
 */
function updateDiagnostics(document) {
    // Only check C/C++ files
    if (!document || (!document.fileName.endsWith('.c') && !document.fileName.endsWith('.cpp'))) {
        if (document?.uri) customDiagnosticCollection.delete(document.uri);
        return;
    }

    try {
        const diagnostics = [];
        const text = document.getText();
        const scanfRegex = /scanf\s*\(\s*"([^"]*)"\s*,\s*([^)]+)\)/g;

        for (const match of text.matchAll(scanfRegex)) {
            const matchIndex = match.index ?? 0;
            const fullMatchText = match[0];
            const formatSpec = match[1];
            const variablesPart = match[2];
            const originalVars = variablesPart.split(',');

            const formatMatches = formatSpec.match(/%[dcsfi]/g);
            if (!formatMatches) continue;

            let searchOffsetInVarsPart = 0;
            for (let i = 0; i < formatMatches.length; i++) {
                if (i >= originalVars.length) break;

                const fmt = formatMatches[i];
                const originalVarStr = originalVars[i];
                const trimmedVarStr = originalVarStr.trim();

                if (!trimmedVarStr) continue;
                if (fmt === '%s') continue;

                if (['%d', '%c', '%f', '%i'].includes(fmt) && !trimmedVarStr.startsWith('&')) {
                    // Position where match starts (line/column)
                    const matchPosition = document.positionAt(matchIndex);
                    const matchStartColumn = matchPosition.character;

                    // Index of format string within the matched text
                    const formatStringIndex = fullMatchText.indexOf(formatSpec);

                    // Start searching variables only after the format string
                    const searchStartForVars = formatStringIndex + formatSpec.length;
                    const variablesPartIndexInMatch = fullMatchText.indexOf(variablesPart, searchStartForVars);
                    if (variablesPartIndexInMatch === -1) continue;

                    // Locate current variable within variablesPart after prior ones
                    const varStartIndexInPart = variablesPart.indexOf(originalVarStr, searchOffsetInVarsPart);

                    // Offset of trimmed variable inside its original piece
                    const trimmedVarOffset = originalVarStr.indexOf(trimmedVarStr);

                    // Final absolute columns on the same line as match start
                    const finalStartColumn = matchStartColumn + variablesPartIndexInMatch + varStartIndexInPart + trimmedVarOffset;
                    const finalEndColumn = finalStartColumn + trimmedVarStr.length;

                    const range = new vscode.Range(matchPosition.line, finalStartColumn, matchPosition.line, finalEndColumn);
                    diagnostics.push(new vscode.Diagnostic(
                        range,
                        `Missing '&' before variable '${trimmedVarStr}' in scanf - should be &${trimmedVarStr}`,
                        vscode.DiagnosticSeverity.Error
                    ));
                }

                // Move offset past this variable and comma
                searchOffsetInVarsPart += originalVarStr.length + 1;
            }
        }

        customDiagnosticCollection.set(document.uri, diagnostics);
    } catch (error) {
        console.warn('Failed to run scanf syntax check:', error);
        if (document?.uri) customDiagnosticCollection.delete(document.uri);
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
    const useBuildFolder = config.get('useBuildFolder', true);

    let terminal;
    let terminalName;

    if (useNewTerminalPerFile) {
        // Use separate terminal per file (reuse for same file)
        terminalName = `Run C/C++ - ${path.basename(filePath)}`;
        terminal = terminals[terminalName];

        // If closePreviousTerminals is enabled, close all other terminals first
        if (closePreviousTerminals) {
            // Close all existing terminals except the current one we're about to use
            for (let key in terminals) {
                if (key !== terminalName) {
                    const existingTerminal = terminals[key];
                    if (existingTerminal) {
                        existingTerminal.dispose();
                        delete terminals[key];
                    }
                }
            }
        }

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

    // Ensure build directory if setting is enabled
    const outDir = 'build';
    const outExeRel = useBuildFolder ? path.join(outDir, exeName) : exeName;
    if (useBuildFolder) {
        try {
            fs.mkdirSync(path.join(dirName, outDir), { recursive: true });
        } catch (e) {
            console.warn('Failed to ensure build directory:', e);
        }
    }

    const compilerCmd = `${compiler}${flagsString} "${fileName}" -o "${outExeRel}"`;

    terminal.sendText(compilerCmd);

    // Run the executable with platform-specific command and custom args
    const exeArgs = runArgs ? ` ${runArgs}` : '';

    if (process.platform === 'win32') {
        // Windows - use call operator with quotes for filenames with spaces
        terminal.sendText(`& ".\\${outExeRel}"${exeArgs}`);
    } else {
        // macOS/Linux - use quotes for filenames with spaces
        terminal.sendText(`"./${outExeRel}"${exeArgs}`);
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

// Parse a simple int declaration line like: int n; or int a, b, c;
// Returns { variableNames: string[] } or null
function parseIntDeclaration(line) {
    try {
        if (!line) return null;
        const trimmed = line.trim();
        // Match patterns like: int n; | int a,b,c; | int a, b, c; with optional spaces
        const match = trimmed.match(/^int\s+([A-Za-z_][A-Za-z0-9_]*(\s*,\s*[A-Za-z_][A-Za-z0-9_]*)*)\s*;\s*$/);
        if (!match) return null;
        const varsPart = match[1];
        const names = varsPart.split(',').map(v => v.trim()).filter(Boolean);
        return { variableNames: names };
    } catch {
        return null;
    }
}

// Parse variable declarations with basic C types on a single line.
// Supports: int a; | int a,b,c; | float x; | double x,y; | char ch;
// Returns { variableType: 'int'|'float'|'double'|'char', variableNames: string[] } or null
function parseVariableDeclaration(line) {
    try {
        if (!line) return null;
        const trimmed = line.trim();
        const match = trimmed.match(/^(int|float|double|char)\s+([A-Za-z_][A-Za-z0-9_]*(\s*,\s*[A-Za-z_][A-Za-z0-9_]*)*)\s*;\s*$/);
        if (!match) return null;
        const typeName = match[1];
        const varsPart = match[2];
        const names = varsPart.split(',').map(v => v.trim()).filter(Boolean);
        if (names.length === 0) return null;
        return { variableType: typeName, variableNames: names };
    } catch {
        return null;
    }
}