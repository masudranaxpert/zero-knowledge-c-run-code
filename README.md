# Zero Knowledge C/C++ Run Code

[![Version](https://img.shields.io/badge/version-0.1.2-blue.svg)](https://github.com/masudranaxpert/zero-knowledge-c-run-code)
[![VS Code](https://img.shields.io/badge/VS_Code-%5E1.60.0-blue)](https://code.visualstudio.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/masudranaxpert/zero-knowledge-c-run-code/blob/main/LICENSE)

A powerful, fast, and user-friendly VS Code extension that allows you to run C and C++ code files directly from the context menu with a single click. No complex configuration needed - just install and start coding!

## ✨ Features

### 🚀 Quick Execution
- **Right-click and Run**: Run C/C++ files directly from the context menu in Explorer or Editor
- **Keyboard Shortcut**: Press `Ctrl+Shift+B` (`Cmd+Shift+B` on Mac) to instantly compile and run
- **Auto-save**: Automatically saves your file before compilation if there are unsaved changes

### 🔧 Advanced Configuration
- **Multi-Compiler Support**: GCC, G++, Clang, Clang++ with auto-detection
- **Custom Compiler Path**: Use any compiler installation
- **Compiler Flags**: Warnings (-Wall), Optimization levels (O1, O2, O3, Os)
- **Custom Arguments**: Additional compiler and runtime arguments
- **Terminal Management**: Per-file terminals or global terminal with cleanup options

### 🛠️ Developer Experience
- **Cross-platform**: Works on Windows, macOS, and Linux
- **Syntax Checking**: Real-time detection of `scanf` missing `&` operator errors
- **Code Snippets**: Pre-built templates for C and C++ code structures
- **Error Highlighting**: Compiler errors and warnings in VS Code Problems panel

### 📱 Terminal Options
- **Per-File Terminals**: Dedicated terminal for each file (recommended)
- **Global Terminal**: Single terminal for all files
- **Auto-cleanup**: Close previous terminals when opening new ones

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
1. Open a C/C++ file in the editor
2. Press `Ctrl+Shift+B` (Windows/Linux) or `Cmd+Shift+B` (macOS)
3. Code compiles and runs instantly

### Method 3: Code Snippets
Use built-in snippets for quick code structure:
- **C**: Type `cmain` + Tab for main function template
- **C++**: Type `cppmain` + Tab for main function template
- Additional snippets: `cfor`, `cwhile`, `cif`, `cifelse`, `cswitch`, `cfunc`, `cppclass`, `cppvector`, etc.

## ⚙️ Configuration

Access settings via `Ctrl+,` (File → Preferences → Settings) and search for "C/C++ Run Code":

### Terminal Management
```json
{
  "run-c-code.useNewTerminalPerFile": true,     // Separate terminal per file
  "run-c-code.closePreviousTerminals": false    // Close previous terminals
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

## 📥 Installation

### From VSIX (Recommended)
1. Download `zero-knowledge-c-run-code-0.1.2.vsix`
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