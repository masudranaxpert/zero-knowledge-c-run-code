# Zero Knowledge C/C++ Run Code

[![Version](https://img.shields.io/badge/version-0.1.6-blue.svg)](https://github.com/masudranaxpert/zero-knowledge-c-run-code)
[![VS Code](https://img.shields.io/badge/VS_Code-%5E1.85.0-blue)](https://code.visualstudio.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/masudranaxpert/zero-knowledge-c-run-code/blob/main/LICENSE)

A powerful, fast, and user-friendly VS Code extension that allows you to run C and C++ code files directly from the context menu with a single click. No complex configuration needed - just install and start coding!

## ✨ Features

### 🚀 Quick Execution
- **Right-click and Run**: Run C/C++ files directly from Explorer/Editor
- **Shortcut**: `Ctrl+Shift+B` (`Cmd+Shift+B` on macOS)
- **Auto-save**: Saves the file before compile (configurable)

### 🔧 Advanced Configuration
- **Compilers**: GCC, G++, Clang, Clang++ (auto-detect)
- **Paths & Flags**: Custom compiler path, `-Wall`, optimization (O1/O2/O3/Os)
- **Args**: Extra compiler and runtime arguments
- **Terminal**: Per-file or single global, with auto-cleanup

### 🛠️ Developer Experience
- **Cross-platform**: Windows, macOS, Linux
- **Real-time Checks**: Live `scanf` “missing &” diagnostics with precise underline
- **Inline Suggestion**: Copilot-style `scanf(...)` suggestion after `int/float/double/char` declarations
- **Snippets**: Handy C/C++ templates

### 📱 Terminal Options
- **Per-File** or **Global** terminals
- **Auto-cleanup** option

## 📋 Requirements

### System Requirements
- **VS Code**: Version 1.60.0 or higher
- **Compiler**: GCC/G++ or Clang/Clang++ installed and available in PATH
- **Platforms**: Windows, macOS, Linux

### Compiler Installation

#### Windows
```bash
# Using Chocolatey
choco install mingw

# Or download from: https://www.mingw-w64.org/
```

#### macOS
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Or install Homebrew and GCC
brew install gcc
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install build-essential gcc g++
```

#### Linux (Fedora/RHEL)
```bash
sudo dnf install gcc gcc-c++
# or
sudo yum install gcc gcc-c++
```

## 🚀 How to Use

### Method 1: Right-click Menu
1. Right-click on any `.c` or `.cpp` file in the **Explorer** or **Editor**
2. Select **"Run C/C++ Code"** from the context menu
3. Your code will compile and execute in a dedicated terminal

### Method 2: Keyboard Shortcut
1. Open a C/C++ file
2. Press `Ctrl+Shift+B` (Windows/Linux) or `Cmd+Shift+B` (macOS)

### Method 3: Code Snippets
Use built-in snippets for quick code structure:
- **C**: Type `cmain` + Tab for main function template
- **C++**: Type `cppmain` + Tab for main function template
- Additional snippets: `cfor`, `cwhile`, `cif`, `cifelse`, `cswitch`, `cfunc`, `cppclass`, `cppvector`, etc.

## ⚙️ Configuration

Open Settings (`Ctrl+,`) and search for “C/C++ Run Code”.

### Terminal & Build (Grouped, end of Settings)
```json
{
  "run-c-code.closePreviousTerminals": false,   // order 100
  "run-c-code.useNewTerminalPerFile": true,     // order 101
  "run-c-code.useBuildFolder": true,            // order 102
  "run-c-code.saveFileBeforeRun": true          // order 103
}
```

### Compiler Configuration
```json
{
  "run-c-code.compilerType": "auto",            // auto, gcc, g++, clang, clang++
  "run-c-code.compilerPath": "",                // Custom compiler path
  "run-c-code.enableWarnings": true,            // Enable -Wall warnings
  "run-c-code.optimizationLevel": "none",       // none, O1, O2, O3, Os
  "run-c-code.additionalCompilerArgs": "",      // Extra compiler flags
  "run-c-code.runArgs": ""                      // Runtime arguments
}
```

### Developer Features
```json
{
  "run-c-code.enableSyntaxCheck": false,        // Enable scanf & checking
  "run-c-code.saveFileBeforeRun": true          // Auto-save before run
}
```

### Gemini AI Features (Experimental)

#### 1. Text Improvement
```json
{
  "run-c-code.experimental.enableGeminiRefactor": false, // Toggle AI features
  "run-c-code.geminiApiKey": "",                        // Your API key
  "run-c-code.geminiModel": "gemini-2.5-flash-lite",    // Default model
  "run-c-code.geminiOutputLanguage": "english",         // Output language (english/bangla)
  "run-c-code.geminiLineLength": 76,                    // Max characters per line
  "run-c-code.geminiExtraRules": ""                     // Additional custom rules
}
```
- **Shortcut**: **Ctrl+Alt+E** (macOS: **Cmd+Alt+E**) on selected text
- **Supports**: C, C++, Python, and `.txt` files
- **Language Support**: Choose between English or Bangla (বাংলা) output
- **Line Length**: Set maximum characters per line (default: 76)

#### 2. Smart Variable Renamer 🆕
- **Shortcut**: **Ctrl+Alt+R** (macOS: **Cmd+Alt+R**)
- **Two Modes**:
  - **Quick Fix (💡)** - Default, Recommended
    - Shows blue underlines on poorly named variables
    - Click lightbulb or press `Ctrl+.` to see suggestions
    - In-context, professional approach
    - One-click rename with `WorkspaceEdit`
  - **Quick Pick** - Classic menu style
    - Shows all suggestions in a selection menu
    - Multi-select with Space, Enter to apply

- **What it does**: 
  - Analyzes your code for poorly named variables (x, y, a, b, temp, etc.)
  - Suggests meaningful, descriptive names using AI
  - Shows which lines each variable appears on
  - Lets you choose which renames to apply
- **Works with**: Entire file or selected code
- **Supports**: C, C++, Python

**Example (Quick Fix Mode)**:
```c
// Before - you'll see blue underline under 'x' and 'calc'
int x = 10;
float y = calc(x);

// Click 💡 lightbulb → "Rename 'x' to 'student_count'"
// After one click
int student_count = 10;
float average_score = calculate_average(student_count);
```

**Settings**:
```json
{
  "run-c-code.variableRenamerMode": "quickFix"  // or "quickPick"
}
```

- Models available (RPD): `gemini-2.0-flash` (200), `gemini-2.0-flash-lite` (200), `gemini-2.5-flash-lite` (1k, default), `gemma-3-2b` (14k), `gemini-2.5-flash` (250).

### Arguments & Optimization (Together)
Control runtime args, extra compiler flags, and optimization in one place.

```json
{
  "run-c-code.runArgs": "",
  "run-c-code.additionalCompilerArgs": "",
  "run-c-code.optimizationLevel": "none"
}
```

<details>
<summary><strong>See more</strong></summary>

<br/>

<strong>English</strong>

- <strong>Run-c-code: Run Args</strong>: Command line arguments passed to your executable at runtime.
  - Example: `"run-c-code.runArgs": "-n 10 --verbose input.txt"`
  - Windows run: `& ".\\build\\your.exe" -n 10 --verbose input.txt`
  - macOS/Linux run: `./build/your -n 10 --verbose input.txt`

- <strong>Run-c-code: Additional Compiler Args</strong>: Extra compiler flags appended to the compile command.
  - Examples:
    - C standard: `"-std=c11"`
    - Debug + macro: `"-g -DDEBUG"`
    - Include path: `"-Iinclude"`
  - Resulting command (illustrative): `gcc file.c -Wall -O2 -std=c11 -g -DDEBUG -Iinclude -o build/file.exe`

- <strong>Run-c-code: Optimization Level</strong>: Chooses the compiler optimization level.
  - Values: `none`, `O1`, `O2`, `O3`, `Os`
  - Example: `"run-c-code.optimizationLevel": "O2"` → adds `-O2` during compilation.

<hr/>

<strong>বাংলা</strong>

- <strong>Run-c-code: Run Args</strong>: আপনার প্রোগ্রাম রান করার সময় যে আর্গুমেন্টগুলো পাস হবে।
  - উদাহরণ: `"run-c-code.runArgs": "-n 10 --verbose input.txt"`
  - Windows: `& ".\\build\\your.exe" -n 10 --verbose input.txt`
  - macOS/Linux: `./build/your -n 10 --verbose input.txt`

- <strong>Run-c-code: Additional Compiler Args</strong>: কম্পাইল কমান্ডে অতিরিক্ত ফ্ল্যাগ যোগ করে।
  - উদাহরণ:
    - C স্ট্যান্ডার্ড: `"-std=c11"`
    - ডিবাগ + ম্যাক্রো: `"-g -DDEBUG"`
    - ইনক্লুড পাথ: `"-Iinclude"`
  - কমান্ড (উদাহরণ): `gcc file.c -Wall -O2 -std=c11 -g -DDEBUG -Iinclude -o build/file.exe`

- <strong>Run-c-code: Optimization Level</strong>: কম্পাইলারের অপ্টিমাইজেশন লেভেল ঠিক করে।
  - অপশন: `none`, `O1`, `O2`, `O3`, `Os`
  - উদাহরণ: `"run-c-code.optimizationLevel": "O2"` দিলে কম্পাইলের সময় `-O2` যুক্ত হবে।

</details>

### Build Folder Behavior
By default, executables are created in a `build/` subfolder beside the source and run from the parent directory.

```json
{
  "run-c-code.useBuildFolder": true            // Compile to build/ and run as ./build/<exe>
}
```
When disabled (`false`), the executable is created and run in the same folder as the source (legacy behavior).

## 📥 Installation

### From VSIX (Recommended)
1. Download `zero-knowledge-c-run-code-0.1.6.vsix`
2. Open VS Code
3. Press `Ctrl+Shift+P` (Command Palette)
4. Type "Install from VSIX" and select
5. Choose the downloaded `.vsix` file

### From Source
```bash
git clone https://github.com/masudranaxpert/zero-knowledge-c-run-code.git
cd zero-knowledge-c-run-code
npm install
npm run package
# Install the generated .vsix file
```

### From VS Code Marketplace
*Coming soon - submit to marketplace*

## 🐛 Troubleshooting

### Compiler Not Found
**Error**: `'gcc' is not recognized as an internal or external command`

**Solution**: Install GCC and ensure it's in your PATH
```bash
# Check if GCC is installed
gcc --version

# Add to PATH (Windows)
set PATH=%PATH%;"C:\MinGW\bin"

# Add to PATH (Linux/macOS)
export PATH=$PATH:/usr/local/bin
```

### Permission Issues (Linux/macOS)
```bash
chmod +x your_program
```

### Terminal Doesn't Open
- Check VS Code terminal settings
- Try restarting VS Code
- Verify extension is enabled

## 📝 Release Notes

### 0.1.6
- 🆕 **Smart Variable Renamer**: AI-powered tool to suggest better variable/function names
  - **Quick Fix Mode (💡)**: Shows blue underlines with lightbulb suggestions (default)
  - **Quick Pick Mode**: Classic menu-based selection
  - One-click rename with `WorkspaceEdit`
- 🆕 **Text File Support**: Gemini refactor now works with `.txt` files
- 🆕 **Language Selection**: Choose between English and Bangla (বাংলা) output
- 🆕 **Line Length Control**: Set maximum characters per line (default: 76)
- 🛠️ **Enhanced Formatting**: Better multi-line comment and text formatting
- 🌐 **Bilingual Support**: Full support for English and Bangla (বাংলা)
- ⌨️ **New Shortcut**: `Ctrl+Alt+R` for Smart Variable Renamer
- 🎯 **Professional UX**: In-context diagnostics and code actions

### 0.1.5
- 🆕 **Gemini AI Integration**: Experimental text refactoring feature
- 🛠️ **Multiple Models**: Support for various Gemini models
- 🔧 **Custom Rules**: Add your own refactoring rules

### 0.1.3
- 🆕 **Build Folder Output**: Compiles into `build/` subfolder and runs via `build/<exe>`
- 🛠️ **Setting**: Toggle behavior with `run-c-code.useBuildFolder` (default: true)

### 0.1.2
- 🆕 **C++ Support**: Full C++ file support with `g++`
- 🆕 **Multi-Compiler**: Support for GCC, G++, Clang, Clang++
- 🆕 **Terminal Management**: Per-file terminals with cleanup options
- 🆕 **Code Snippets**: Built-in C/C++ code templates
- 🆕 **Syntax Checking**: Real-time `scanf` error detection
- 🆕 **Cross-platform**: Improved Windows, macOS, Linux compatibility
- 🆕 **Advanced Settings**: Compiler flags, optimization, custom arguments

### 0.1.1
- 🆕 **C++ Basic Support**: Initial C++ file detection
- 🆕 **Compiler Configuration**: Basic compiler type selection
- 🆕 **Terminal Options**: Global vs per-file terminal modes
- 🆕 **Auto-save**: Save files before compilation

### 0.0.1
- 🚀 Initial release
- ✅ C file support with GCC
- ✅ Right-click context menu
- ✅ Keyboard shortcut (Ctrl+Shift+B)
- ✅ Terminal integration
- ✅ Auto-save feature

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ for the C/C++ developer community
- Thanks to all contributors and testers

## 📞 Support & Feedback

- **Issues**: [GitHub Issues](https://github.com/masudranaxpert/zero-knowledge-c-run-code/issues)
- **Discussions**: [GitHub Discussions](https://github.com/masudranaxpert/zero-knowledge-c-run-code/discussions)
- **Email**: For direct support, check repository contacts

---

<div align="center">

**Happy Coding with Zero Knowledge C/C++ Run Code! 🎉**

[![Made with ❤️](https://img.shields.io/badge/Made%20with-%E2%9D%A4-red.svg)](https://github.com/masudranaxpert)

</div> 