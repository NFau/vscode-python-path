const vscode = require("vscode");
const fs = require("fs");
const clipboardy = require("clipboardy");

function getPythonPath(path) {
  const splittedPath = path.split("/");
  if (
    splittedPath.length === 0 ||
    !splittedPath[splittedPath.length - 1].endsWith(".py")
  ) {
    return "";
  }

  const fileName = splittedPath.pop();

  // removing extension
  let pythonPath =
    fileName !== "__init__.py"
      ? [fileName.substring(0, fileName.lastIndexOf("."))]
      : [];

  while (
    splittedPath.length > 0 &&
    fs.existsSync([...splittedPath, ["__init__.py"]].join("/"))
  ) {
    pythonPath.unshift(splittedPath.pop());
  }

  return pythonPath.join(".");
}

function copyPythonPath(uri) {
  try {
    const path = uri
      ? uri.fsPath
      : vscode.window.activeTextEditor.document.fileName;
    const pythonPath = getPythonPath(path);
    const selections = vscode.window.activeTextEditor.selections
      .map(s => vscode.window.activeTextEditor.document.getText(s))
      .filter(s => !!s);
    if (pythonPath && selections.length > 0) {
      const importStatement = generateImportStatement(pythonPath, selections);
      clipboardy.writeSync(importStatement);
    }
    if (pythonPath && selections.length == 0) {
      clipboardy.writeSync(pythonPath);
    }
  } catch (e) {
    console.log(e);
  }
}

function generateImportStatement(pythonPath, selections) {
  let importPath;
  if (selections.length == 0) {
    importPath = `import ${pythonPath}`;
  } else if (selections.length == 1) {
    const selection = selections[0];
    importPath = `from ${pythonPath} import ${selection}`;
  } else {
    const selection = selections.map(s => `\t${s},`).join("\n");
    importPath = `from ${pythonPath} import (\n${selection}\n)`;
  }
  if (importPath) {
    clipboardy.writeSync(importPath);
  }
}

function activate(context) {
  let disposable = vscode.commands.registerCommand(
    "extension.copyPythonPath",
    copyPythonPath
  );
  context.subscriptions.push(disposable);
}

exports.activate = activate;

function deactivate() {}
exports.deactivate = deactivate;
