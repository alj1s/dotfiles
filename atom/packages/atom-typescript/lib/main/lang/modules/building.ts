import project = require('../core/project');
import mkdirp = require('mkdirp');
import path = require('path');
import fs = require('fs');
import {pathIsRelative, makeRelativePath} from "../../tsconfig/tsconfig";
import {consistentPath} from "../../utils/fsUtil";
import {createMap} from "../utils";

/** Lazy loaded babel tanspiler */
let babel: any;

/** If we get a compile request for a ts file that is not in project. We return a js file with the following content */
export const Not_In_Context = "/* NotInContext */";

export function diagnosticToTSError(diagnostic: ts.Diagnostic): TSError {
    var filePath = diagnostic.file.fileName;
    var startPosition = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    var endPosition = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start + diagnostic.length);

    return {
        filePath: filePath,
        startPos: { line: startPosition.line, col: startPosition.character },
        endPos: { line: endPosition.line, col: endPosition.character },
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        preview: diagnostic.file.text.substr(diagnostic.start, diagnostic.length),
    };
}
export function emitFile(proj: project.Project, filePath: string): EmitOutput {
    var services = proj.languageService;
    var output = services.getEmitOutput(filePath);
    var emitDone = !output.emitSkipped;
    var errors: TSError[] = [];

    // Emit is no guarantee that there are no errors
    var allDiagnostics = services.getCompilerOptionsDiagnostics()
        .concat(services.getSyntacticDiagnostics(filePath))
        .concat(services.getSemanticDiagnostics(filePath));

    allDiagnostics.forEach(diagnostic => {
        // happens only for 'lib.d.ts' for some reason
        if (!diagnostic.file) return;

        var startPosition = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        errors.push(diagnosticToTSError(diagnostic));
    });

    {
      let sourceMapContents: {[index:string]: any} = {};
      output.outputFiles.forEach(o => {
          mkdirp.sync(path.dirname(o.name));
          let additionalEmits = runExternalTranspiler(o, proj, sourceMapContents);

          if (!sourceMapContents[o.name]) {
              // .js.map files will be written as an "additional emit" later.
              fs.writeFileSync(o.name, o.text, "utf8");
          }

          additionalEmits.forEach(a => {
              mkdirp.sync(path.dirname(a.name));
              fs.writeFileSync(a.name, a.text, "utf8");
            })
      });
    }

    var outputFiles = output.outputFiles.map((o) => o.name);
    if (path.extname(filePath) == '.d.ts') {
        outputFiles.push(filePath);
    }

    return {
        sourceFileName: filePath,
        outputFiles: outputFiles,
        success: emitDone && !errors.length,
        errors: errors,
        emitError: !emitDone
    };
}
export function getRawOutput(proj: project.Project, filePath: string): ts.EmitOutput {
    let services = proj.languageService;
    let output : ts.EmitOutput;
    if (proj.includesSourceFile(filePath)) {
      output = services.getEmitOutput(filePath);
    } else {
      output = {
        outputFiles: [{name: filePath, text: Not_In_Context, writeByteOrderMark: false}],
        emitSkipped: true
      }
    }
    return output;
}

function runExternalTranspiler(outputFile: ts.OutputFile, project: project.Project, sourceMapContents: {[index:string]: any}) : ts.OutputFile[] {
  if (!isJSFile(outputFile.name) && !isJSSourceMapFile(outputFile.name)) {
    return [];
  }

  let settings = project.projectFile.project;
  let externalTranspiler = settings.externalTranspiler;
  if (!externalTranspiler) {
    return [];
  }

  if (isJSSourceMapFile(outputFile.name)) {
    let sourceMapPayload = JSON.parse(outputFile.text);
    let jsFileName = consistentPath(path.resolve(path.dirname(outputFile.name), sourceMapPayload.file));
    sourceMapContents[outputFile.name] = {jsFileName: jsFileName, sourceMapPayload};
    return [];
  }

  if (externalTranspiler.toLocaleLowerCase() === "babel") {
    babel = require("babel");

    let babelOptions : any = {};

    let sourceMapFileName = getJSMapNameForJSFile(outputFile.name);

    if (sourceMapContents[sourceMapFileName]) {
      babelOptions.inputSourceMap = sourceMapContents[sourceMapFileName].sourceMapPayload;
    }
    if (settings.compilerOptions.sourceMap) {
      babelOptions.sourceMaps = true;
    }
    if (settings.compilerOptions.inlineSourceMap) {
      babelOptions.sourceMaps = "inline";
    }
    if (!settings.compilerOptions.removeComments) {
      babelOptions.comments = true;
    }

    let babelResult = babel.transform(outputFile.text, babelOptions);
    outputFile.text = babelResult.code;

    if (babelResult.map && settings.compilerOptions.sourceMap) {
      let additionalEmit : ts.OutputFile = {
        name: sourceMapFileName,
        text : JSON.stringify(babelResult.map),
        writeByteOrderMark: settings.compilerOptions.emitBOM
      };

      if (additionalEmit.name === "") {
        // can't emit a blank file name - this should only be reached if the TypeScript
        // language service returns the .js file before the .js.map file.
        console.warn(`The TypeScript language service did not yet provide a .js.map name for file ${outputFile.name}`);
        return [];
      }

      return [additionalEmit];
    }

    return [];
  }

  function getJSMapNameForJSFile(jsFileName: string) {
    for (let jsMapName in sourceMapContents) {
      if (sourceMapContents.hasOwnProperty(jsMapName)) {
        if (sourceMapContents[jsMapName].jsFileName === jsFileName) {
          return jsMapName;
        }
      }
    }
    return "";
  }
}

function isJSFile(fileName: string) {
  return (path.extname(fileName).toLocaleLowerCase() === ".js");
}

function isJSSourceMapFile(fileName: string) {
  let lastExt = path.extname(fileName);
  if (lastExt === ".map") {
    return isJSFile(fileName.substr(0,fileName.length - 4));
  }
  return false;
}
