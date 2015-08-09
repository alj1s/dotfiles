var mkdirp = require('mkdirp');
var path = require('path');
var fs = require('fs');
var fsUtil_1 = require("../../utils/fsUtil");
var babel;
exports.Not_In_Context = "/* NotInContext */";
function diagnosticToTSError(diagnostic) {
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
exports.diagnosticToTSError = diagnosticToTSError;
function emitFile(proj, filePath) {
    var services = proj.languageService;
    var output = services.getEmitOutput(filePath);
    var emitDone = !output.emitSkipped;
    var errors = [];
    var allDiagnostics = services.getCompilerOptionsDiagnostics()
        .concat(services.getSyntacticDiagnostics(filePath))
        .concat(services.getSemanticDiagnostics(filePath));
    allDiagnostics.forEach(function (diagnostic) {
        if (!diagnostic.file)
            return;
        var startPosition = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        errors.push(diagnosticToTSError(diagnostic));
    });
    {
        var sourceMapContents = {};
        output.outputFiles.forEach(function (o) {
            mkdirp.sync(path.dirname(o.name));
            var additionalEmits = runExternalTranspiler(o, proj, sourceMapContents);
            if (!sourceMapContents[o.name]) {
                fs.writeFileSync(o.name, o.text, "utf8");
            }
            additionalEmits.forEach(function (a) {
                mkdirp.sync(path.dirname(a.name));
                fs.writeFileSync(a.name, a.text, "utf8");
            });
        });
    }
    var outputFiles = output.outputFiles.map(function (o) { return o.name; });
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
exports.emitFile = emitFile;
function getRawOutput(proj, filePath) {
    var services = proj.languageService;
    var output;
    if (proj.includesSourceFile(filePath)) {
        output = services.getEmitOutput(filePath);
    }
    else {
        output = {
            outputFiles: [{ name: filePath, text: exports.Not_In_Context, writeByteOrderMark: false }],
            emitSkipped: true
        };
    }
    return output;
}
exports.getRawOutput = getRawOutput;
function runExternalTranspiler(outputFile, project, sourceMapContents) {
    if (!isJSFile(outputFile.name) && !isJSSourceMapFile(outputFile.name)) {
        return [];
    }
    var settings = project.projectFile.project;
    var externalTranspiler = settings.externalTranspiler;
    if (!externalTranspiler) {
        return [];
    }
    if (isJSSourceMapFile(outputFile.name)) {
        var sourceMapPayload = JSON.parse(outputFile.text);
        var jsFileName = fsUtil_1.consistentPath(path.resolve(path.dirname(outputFile.name), sourceMapPayload.file));
        sourceMapContents[outputFile.name] = { jsFileName: jsFileName, sourceMapPayload: sourceMapPayload };
        return [];
    }
    if (externalTranspiler.toLocaleLowerCase() === "babel") {
        babel = require("babel");
        var babelOptions = {};
        var sourceMapFileName = getJSMapNameForJSFile(outputFile.name);
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
        var babelResult = babel.transform(outputFile.text, babelOptions);
        outputFile.text = babelResult.code;
        if (babelResult.map && settings.compilerOptions.sourceMap) {
            var additionalEmit = {
                name: sourceMapFileName,
                text: JSON.stringify(babelResult.map),
                writeByteOrderMark: settings.compilerOptions.emitBOM
            };
            if (additionalEmit.name === "") {
                console.warn("The TypeScript language service did not yet provide a .js.map name for file " + outputFile.name);
                return [];
            }
            return [additionalEmit];
        }
        return [];
    }
    function getJSMapNameForJSFile(jsFileName) {
        for (var jsMapName in sourceMapContents) {
            if (sourceMapContents.hasOwnProperty(jsMapName)) {
                if (sourceMapContents[jsMapName].jsFileName === jsFileName) {
                    return jsMapName;
                }
            }
        }
        return "";
    }
}
function isJSFile(fileName) {
    return (path.extname(fileName).toLocaleLowerCase() === ".js");
}
function isJSSourceMapFile(fileName) {
    var lastExt = path.extname(fileName);
    if (lastExt === ".map") {
        return isJSFile(fileName.substr(0, fileName.length - 4));
    }
    return false;
}
