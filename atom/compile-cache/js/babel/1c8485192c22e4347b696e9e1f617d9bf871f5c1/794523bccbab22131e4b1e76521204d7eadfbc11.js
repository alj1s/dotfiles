var fsu = require('../utils/fsUtil');
var fs = require('fs');
var path = require('path');
var os = require('os');
var mkdirp = require('mkdirp');
var fuzzaldrin = require('fuzzaldrin');
var transformer_1 = require('./transformers/transformer');
var transformer = require('./transformers/transformer');
var tsconfig = require('../tsconfig/tsconfig');
var fsUtil = require('../utils/fsUtil');
var utils = require('./utils');
var resolve = Promise.resolve.bind(Promise);
var projectCache_1 = require('./projectCache');
function textSpan(span) {
    return {
        start: span.start,
        length: span.length
    };
}
function echo(data) {
    return projectCache_1.queryParent.echoNumWithModification({ num: data.num }).then(function (resp) {
        data.num = resp.num;
        return data;
    });
}
exports.echo = echo;
function quickInfo(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var info = project.languageService.getQuickInfoAtPosition(query.filePath, query.position);
    if (!info) return Promise.resolve({ valid: false });else return resolve({
        valid: true,
        name: ts.displayPartsToString(info.displayParts || []),
        comment: ts.displayPartsToString(info.documentation || [])
    });
}
exports.quickInfo = quickInfo;
var building = require('./modules/building');
function build(query) {
    projectCache_1.consistentPath(query);
    var proj = projectCache_1.getOrCreateProject(query.filePath);
    var totalCount = proj.projectFile.project.files.length;
    var builtCount = 0;
    var errorCount = 0;
    var outputs = proj.projectFile.project.files.map(function (filePath) {
        var output = building.emitFile(proj, filePath);
        builtCount++;
        errorCount = errorCount + output.errors.length;
        projectCache_1.queryParent.buildUpdate({
            totalCount: totalCount,
            builtCount: builtCount,
            errorCount: errorCount,
            firstError: errorCount && !(errorCount - output.errors.length),
            filePath: filePath,
            errorsInFile: output.errors
        });
        return output;
    });
    if (proj.projectFile.project.compilerOptions.declaration && proj.projectFile.project['package'] && proj.projectFile.project['package'].name && proj.projectFile.project['package'].definition) {
        var packageDir = proj.projectFile.project['package'].directory;
        var defLocation = fsUtil.resolve(packageDir, proj.projectFile.project['package'].definition);
        var moduleName = proj.projectFile.project['package'].name;
        var dtsFiles = utils.selectMany(outputs.map(function (o) {
            return o.outputFiles;
        })).filter(function (f) {
            return fsUtil.isExt(f, '.d.ts');
        });
        var finalCode = [];
        var addModuleToOutput = function addModuleToOutput(modulePath, fileToImport) {
            finalCode.push(os.EOL + ('\ndeclare module "' + modulePath + '"{\n    import tmp = require(\'' + fileToImport + '\');\n    export = tmp;\n}\n            ').trim());
        };
        dtsFiles.forEach(function (file) {
            var relativePath = fsUtil.makeRelativePath(packageDir, file);
            var relativePathNoExt = relativePath.substring(0, relativePath.length - 5);
            var modulePath = moduleName + relativePathNoExt.substr(1);
            var fileToImport = relativePathNoExt.substr(2);
            addModuleToOutput(modulePath, fileToImport);
        });
        if (proj.projectFile.project['package'].main) {
            var modulePath = moduleName;
            var fullPath = fsUtil.resolve(packageDir, proj.projectFile.project['package'].main);
            var relativePath = fsUtil.makeRelativePath(packageDir, fullPath);
            var fileToImport = relativePath.substr(2).replace(/\.js+$/, '');
            addModuleToOutput(modulePath, fileToImport);
        }
        var joinedDtsCode = finalCode.join(os.EOL);
        mkdirp.sync(path.dirname(defLocation));
        fs.writeFileSync(defLocation, joinedDtsCode);
    }
    var tsFilesWithInvalidEmit = outputs.filter(function (o) {
        return o.emitError;
    }).map(function (o) {
        return o.sourceFileName;
    });
    var tsFilesWithValidEmit = outputs.filter(function (o) {
        return !o.emitError;
    }).map(function (o) {
        return o.sourceFileName;
    });
    return resolve({
        tsFilesWithInvalidEmit: tsFilesWithInvalidEmit,
        tsFilesWithValidEmit: tsFilesWithValidEmit,
        buildOutput: {
            outputs: outputs,
            counts: {
                inputFiles: proj.projectFile.project.files.length,
                outputFiles: utils.selectMany(outputs.map(function (out) {
                    return out.outputFiles;
                })).length,
                errors: errorCount,
                emitErrors: outputs.filter(function (out) {
                    return out.emitError;
                }).length
            }
        }
    });
}
exports.build = build;
function getCompletionsAtPosition(query) {
    projectCache_1.consistentPath(query);
    var filePath = query.filePath,
        position = query.position,
        prefix = query.prefix;
    var project = projectCache_1.getOrCreateProject(filePath);
    filePath = transformer.getPseudoFilePath(filePath);
    var completions = project.languageService.getCompletionsAtPosition(filePath, position);
    var completionList = completions ? completions.entries.filter(function (x) {
        return !!x;
    }) : [];
    var endsInPunctuation = utils.prefixEndsInPunctuation(prefix);
    if (prefix.length && !endsInPunctuation) {
        completionList = fuzzaldrin.filter(completionList, prefix, { key: 'name' });
    }
    var maxSuggestions = 50;
    var maxDocComments = 10;
    if (completionList.length > maxSuggestions) completionList = completionList.slice(0, maxSuggestions);
    function docComment(c) {
        var completionDetails = project.languageService.getCompletionEntryDetails(filePath, position, c.name);
        var display;
        if (c.kind == 'method' || c.kind == 'function' || c.kind == 'property') {
            var parts = completionDetails.displayParts || [];
            if (parts.length > 3) {
                parts = parts.splice(3);
            }
            display = ts.displayPartsToString(parts);
        } else {
            display = '';
        }
        var comment = (display ? display + '\n' : '') + ts.displayPartsToString(completionDetails.documentation || []);
        return { display: display, comment: comment };
    }
    var completionsToReturn = completionList.map(function (c, index) {
        if (index < maxDocComments) {
            var details = docComment(c);
        } else {
            details = {
                display: '',
                comment: ''
            };
        }
        return {
            name: c.name,
            kind: c.kind,
            comment: details.comment,
            display: details.display
        };
    });
    if (query.prefix == '(') {
        var signatures = project.languageService.getSignatureHelpItems(query.filePath, query.position);
        if (signatures && signatures.items) {
            signatures.items.forEach(function (item) {
                var snippet = item.parameters.map(function (p, i) {
                    var display = '${' + (i + 1) + ':' + ts.displayPartsToString(p.displayParts) + '}';
                    if (i === signatures.argumentIndex) {
                        return display;
                    }
                    return display;
                }).join(ts.displayPartsToString(item.separatorDisplayParts));
                var label = ts.displayPartsToString(item.prefixDisplayParts) + snippet + ts.displayPartsToString(item.suffixDisplayParts);
                completionsToReturn.unshift({ snippet: snippet });
            });
        }
    }
    return resolve({
        completions: completionsToReturn,
        endsInPunctuation: endsInPunctuation
    });
}
exports.getCompletionsAtPosition = getCompletionsAtPosition;
function getSignatureHelps(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var signatureHelpItems = project.languageService.getSignatureHelpItems(query.filePath, query.position);
    if (!signatureHelpItems || !signatureHelpItems.items || !signatureHelpItems.items.length) return resolve({ signatureHelps: [] });
    return signatureHelpItems.items;
}
exports.getSignatureHelps = getSignatureHelps;
function emitFile(query) {
    projectCache_1.consistentPath(query);
    var filePath = transformer.getPseudoFilePath(query.filePath);
    return resolve(building.emitFile(projectCache_1.getOrCreateProject(filePath), filePath));
}
exports.emitFile = emitFile;
var formatting = require('./modules/formatting');
function formatDocument(query) {
    projectCache_1.consistentPath(query);
    var proj = projectCache_1.getOrCreateProject(query.filePath);
    return resolve({ edits: formatting.formatDocument(proj, query.filePath) });
}
exports.formatDocument = formatDocument;
function formatDocumentRange(query) {
    projectCache_1.consistentPath(query);
    var proj = projectCache_1.getOrCreateProject(query.filePath);
    return resolve({ edits: formatting.formatDocumentRange(proj, query.filePath, query.start, query.end) });
}
exports.formatDocumentRange = formatDocumentRange;
function getDefinitionsAtPosition(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var definitions = project.languageService.getDefinitionAtPosition(query.filePath, query.position);
    var projectFileDirectory = project.projectFile.projectFileDirectory;
    if (!definitions || !definitions.length) return resolve({ projectFileDirectory: projectFileDirectory, definitions: [] });
    return resolve({
        projectFileDirectory: projectFileDirectory,
        definitions: definitions.map(function (d) {
            var pos = project.languageServiceHost.getPositionFromIndex(d.fileName, d.textSpan.start);
            return {
                filePath: d.fileName,
                position: pos
            };
        })
    });
}
exports.getDefinitionsAtPosition = getDefinitionsAtPosition;
function updateText(query) {
    projectCache_1.consistentPath(query);
    var lsh = projectCache_1.getOrCreateProject(query.filePath).languageServiceHost;
    var filePath = transformer.getPseudoFilePath(query.filePath);
    lsh.updateScript(filePath, query.text);
    return resolve({});
}
exports.updateText = updateText;
function editText(query) {
    projectCache_1.consistentPath(query);
    var lsh = projectCache_1.getOrCreateProject(query.filePath).languageServiceHost;
    var filePath = transformer.getPseudoFilePath(query.filePath);
    lsh.editScript(filePath, query.start, query.end, query.newText);
    return resolve({});
}
exports.editText = editText;
function getDiagnositcsByFilePath(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var diagnostics = project.languageService.getSyntacticDiagnostics(query.filePath);
    if (diagnostics.length === 0) {
        diagnostics = project.languageService.getSemanticDiagnostics(query.filePath);
    }
    return diagnostics;
}
function errorsForFile(query) {
    projectCache_1.consistentPath(query);
    if (transformer_1.isTransformerFile(query.filePath)) {
        var filePath = transformer.getPseudoFilePath(query.filePath);
        var errors = getDiagnositcsByFilePath({ filePath: filePath }).map(building.diagnosticToTSError);
        errors.forEach(function (error) {
            error.filePath = query.filePath;
        });
        return resolve({ errors: errors });
    } else {
        return resolve({ errors: getDiagnositcsByFilePath(query).map(building.diagnosticToTSError) });
    }
}
exports.errorsForFile = errorsForFile;
function getRenameInfo(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var findInStrings = false,
        findInComments = false;
    var info = project.languageService.getRenameInfo(query.filePath, query.position);
    if (info && info.canRename) {
        var locations = {};
        project.languageService.findRenameLocations(query.filePath, query.position, findInStrings, findInComments).forEach(function (loc) {
            if (!locations[loc.fileName]) locations[loc.fileName] = [];
            locations[loc.fileName].unshift(textSpan(loc.textSpan));
        });
        return resolve({
            canRename: true,
            localizedErrorMessage: info.localizedErrorMessage,
            displayName: info.displayName,
            fullDisplayName: info.fullDisplayName,
            kind: info.kind,
            kindModifiers: info.kindModifiers,
            triggerSpan: textSpan(info.triggerSpan),
            locations: locations
        });
    } else {
        return resolve({
            canRename: false
        });
    }
}
exports.getRenameInfo = getRenameInfo;
function getIndentationAtPosition(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var indent = project.languageService.getIndentationAtPosition(query.filePath, query.position, project.projectFile.project.formatCodeOptions);
    return resolve({ indent: indent });
}
exports.getIndentationAtPosition = getIndentationAtPosition;
function debugLanguageServiceHostVersion(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    return resolve({ text: project.languageServiceHost.getScriptContent(query.filePath) });
}
exports.debugLanguageServiceHostVersion = debugLanguageServiceHostVersion;
function getProjectFileDetails(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    return resolve(project.projectFile);
}
exports.getProjectFileDetails = getProjectFileDetails;
function sortNavbarItemsBySpan(items) {
    items.sort(function (a, b) {
        return a.spans[0].start - b.spans[0].start;
    });
    for (var _i = 0; _i < items.length; _i++) {
        var item = items[_i];
        if (item.childItems) {
            sortNavbarItemsBySpan(item.childItems);
        }
    }
}
function flattenNavBarItems(items) {
    var toreturn = [];
    function keepAdding(item, depth) {
        item.indent = depth;
        var children = item.childItems;
        delete item.childItems;
        toreturn.push(item);
        if (children) {
            children.forEach(function (child) {
                return keepAdding(child, depth + 1);
            });
        }
    }
    items.forEach(function (item) {
        return keepAdding(item, 0);
    });
    return toreturn;
}
function getNavigationBarItems(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var languageService = project.languageService;
    var navBarItems = languageService.getNavigationBarItems(query.filePath);
    if (navBarItems.length && navBarItems[0].text == '<global>') {
        navBarItems.shift();
    }
    sortNavbarItemsBySpan(navBarItems);
    navBarItems = flattenNavBarItems(navBarItems);
    var items = navBarItems.map(function (item) {
        item.position = project.languageServiceHost.getPositionFromIndex(query.filePath, item.spans[0].start);
        delete item.spans;
        return item;
    });
    return resolve({ items: items });
}
exports.getNavigationBarItems = getNavigationBarItems;
function getNavigateToItems(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var languageService = project.languageService;
    var getNodeKind = ts.getNodeKind;
    function getDeclarationName(declaration) {
        var result = getTextOfIdentifierOrLiteral(declaration.name);
        if (result !== undefined) {
            return result;
        }
        if (declaration.name.kind === 133) {
            var expr = declaration.name.expression;
            if (expr.kind === 163) {
                return expr.name.text;
            }
            return getTextOfIdentifierOrLiteral(expr);
        }
        return undefined;
    }
    function getTextOfIdentifierOrLiteral(node) {
        if (node.kind === 66 || node.kind === 8 || node.kind === 7) {
            return node.text;
        }
        return undefined;
    }
    var items = [];
    for (var _i = 0, _a = project.getProjectSourceFiles(); _i < _a.length; _i++) {
        var file = _a[_i];
        var declarations = file.getNamedDeclarations();
        for (var index in declarations) {
            for (var _b = 0, _c = declarations[index]; _b < _c.length; _b++) {
                var declaration = _c[_b];
                var item = {
                    name: getDeclarationName(declaration),
                    kind: getNodeKind(declaration),
                    filePath: file.fileName,
                    fileName: path.basename(file.fileName),
                    position: project.languageServiceHost.getPositionFromIndex(file.fileName, declaration.getStart())
                };
                items.push(item);
            }
        }
    }
    return resolve({ items: items });
}
exports.getNavigateToItems = getNavigateToItems;
function getReferences(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var languageService = project.languageService;
    var references = [];
    var refs = languageService.getReferencesAtPosition(query.filePath, query.position) || [];
    references = refs.map(function (r) {
        var res = project.languageServiceHost.getPositionFromTextSpanWithLinePreview(r.fileName, r.textSpan);
        return { filePath: r.fileName, position: res.position, preview: res.preview };
    });
    return resolve({
        references: references
    });
}
exports.getReferences = getReferences;
var getPathCompletions_1 = require('./modules/getPathCompletions');
function filePathWithoutExtension(query) {
    var base = path.basename(query, '.ts');
    return path.dirname(query) + '/' + base;
}
function getRelativePathsInProject(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    return resolve(getPathCompletions_1.getPathCompletions({
        project: project,
        filePath: query.filePath,
        prefix: query.prefix,
        includeExternalModules: query.includeExternalModules
    }));
}
exports.getRelativePathsInProject = getRelativePathsInProject;
var astToText_1 = require('./modules/astToText');
function getAST(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var service = project.languageService;
    var files = service.getProgram().getSourceFiles().filter(function (x) {
        return x.fileName == query.filePath;
    });
    if (!files.length) resolve({});
    var sourceFile = files[0];
    var root = astToText_1.astToText(sourceFile);
    return resolve({ root: root });
}
exports.getAST = getAST;
function getASTFull(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var service = project.languageService;
    var files = service.getProgram().getSourceFiles().filter(function (x) {
        return x.fileName == query.filePath;
    });
    if (!files.length) resolve({});
    var sourceFile = files[0];
    var root = astToText_1.astToTextFull(sourceFile);
    return resolve({ root: root });
}
exports.getASTFull = getASTFull;
var programDependencies_1 = require('./modules/programDependencies');
function getDependencies(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var projectFile = project.projectFile;
    var links = programDependencies_1['default'](projectFile, project.languageService.getProgram());
    return resolve({ links: links });
}
exports.getDependencies = getDependencies;
var qf = require('./fixmyts/quickFix');
var quickFixRegistry_1 = require('./fixmyts/quickFixRegistry');
function getInfoForQuickFixAnalysis(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var program = project.languageService.getProgram();
    var sourceFile = program.getSourceFile(query.filePath);
    var sourceFileText = sourceFile.getFullText();
    var fileErrors = getDiagnositcsByFilePath(query);
    var positionErrors = fileErrors.filter(function (e) {
        return e.start - 1 < query.position && e.start + e.length + 1 > query.position;
    });
    var positionErrorMessages = positionErrors.map(function (e) {
        return ts.flattenDiagnosticMessageText(e.messageText, os.EOL);
    });
    var positionNode = ts.getTokenAtPosition(sourceFile, query.position);
    var service = project.languageService;
    var typeChecker = program.getTypeChecker();
    return {
        project: project,
        program: program,
        sourceFile: sourceFile,
        sourceFileText: sourceFileText,
        fileErrors: fileErrors,
        positionErrors: positionErrors,
        positionErrorMessages: positionErrorMessages,
        position: query.position,
        positionNode: positionNode,
        service: service,
        typeChecker: typeChecker,
        filePath: sourceFile.fileName
    };
}
function getQuickFixes(query) {
    projectCache_1.consistentPath(query);
    var info = getInfoForQuickFixAnalysis(query);
    var fixes = quickFixRegistry_1.allQuickFixes.map(function (x) {
        var canProvide = x.canProvideFix(info);
        if (!canProvide) return;else return { key: x.key, display: canProvide.display, isNewTextSnippet: canProvide.isNewTextSnippet };
    }).filter(function (x) {
        return !!x;
    });
    return resolve({ fixes: fixes });
}
exports.getQuickFixes = getQuickFixes;
function applyQuickFix(query) {
    projectCache_1.consistentPath(query);
    var fix = quickFixRegistry_1.allQuickFixes.filter(function (x) {
        return x.key == query.key;
    })[0];
    var info = getInfoForQuickFixAnalysis(query);
    var res = fix.provideFix(info);
    var refactorings = qf.getRefactoringsByFilePath(res);
    return resolve({ refactorings: refactorings });
}
exports.applyQuickFix = applyQuickFix;
var building_1 = require('./modules/building');
function getOutput(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    return resolve({ output: building_1.getRawOutput(project, query.filePath) });
}
exports.getOutput = getOutput;
function getOutputJs(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var output = building_1.getRawOutput(project, query.filePath);
    var jsFile = output.outputFiles.filter(function (x) {
        return path.extname(x.name) == '.js';
    })[0];
    if (!jsFile || output.emitSkipped) {
        return resolve({});
    } else {
        return resolve({ jsFilePath: jsFile.name });
    }
}
exports.getOutputJs = getOutputJs;
function getOutputJsStatus(query) {
    projectCache_1.consistentPath(query);
    var project = projectCache_1.getOrCreateProject(query.filePath);
    var output = building_1.getRawOutput(project, query.filePath);
    if (output.emitSkipped) {
        return resolve({ emitDiffers: true });
    }
    var jsFile = output.outputFiles.filter(function (x) {
        return path.extname(x.name) == '.js';
    })[0];
    if (!jsFile) {
        return resolve({ emitDiffers: false });
    } else {
        var emitDiffers = !fs.existsSync(jsFile.name) || fs.readFileSync(jsFile.name).toString() !== jsFile.text;
        return resolve({ emitDiffers: emitDiffers });
    }
}
exports.getOutputJsStatus = getOutputJsStatus;
function softReset(query) {
    projectCache_1.resetCache(query);
    return resolve({});
}
exports.softReset = softReset;
var moveFiles = require('./modules/moveFiles');
function getRenameFilesRefactorings(query) {
    query.oldPath = fsu.consistentPath(query.oldPath);
    query.newPath = fsu.consistentPath(query.newPath);
    var project = projectCache_1.getOrCreateProject(query.oldPath);
    var res = moveFiles.getRenameFilesRefactorings(project.languageService.getProgram(), query.oldPath, query.newPath);
    var refactorings = qf.getRefactoringsByFilePath(res);
    return resolve({ refactorings: refactorings });
}
exports.getRenameFilesRefactorings = getRenameFilesRefactorings;
function createProject(query) {
    projectCache_1.consistentPath(query);
    var projectFile = tsconfig.createProjectRootSync(query.filePath);
    projectCache_1.queryParent.setConfigurationError({ projectFilePath: query.filePath, error: null });
    return resolve({ createdFilePath: projectFile.projectFilePath });
}
exports.createProject = createProject;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9hdG9tLXR5cGVzY3JpcHQvZGlzdC9tYWluL2xhbmcvcHJvamVjdFNlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDckMsSUFBSSxFQUFFLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3ZCLElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMzQixJQUFJLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDdkIsSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQy9CLElBQUksVUFBVSxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUN2QyxJQUFJLGFBQWEsR0FBRyxPQUFPLENBQUMsNEJBQTRCLENBQUMsQ0FBQztBQUMxRCxJQUFJLFdBQVcsR0FBRyxPQUFPLENBQUMsNEJBQTRCLENBQUMsQ0FBQztBQUN4RCxJQUFJLFFBQVEsR0FBRyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQztBQUMvQyxJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUN4QyxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDL0IsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDNUMsSUFBSSxjQUFjLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDL0MsU0FBUyxRQUFRLENBQUMsSUFBSSxFQUFFO0FBQ3BCLFdBQU87QUFDSCxhQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7QUFDakIsY0FBTSxFQUFFLElBQUksQ0FBQyxNQUFNO0tBQ3RCLENBQUM7Q0FDTDtBQUNELFNBQVMsSUFBSSxDQUFD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ckQsV0FBTyxPQUFPLENBQUMsRUFBRSxZQUFZLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQztDQUNsRDtBQUNELE9BQU8sQ0FBQywwQkFBMEIsR0FBRywwQkFBMEIsQ0FBQztBQUNoRSxTQUFTLGFBQWEsQ0FBQyxLQUFLLEVBQUU7QUFDMUIsa0JBQWMsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDckMsUUFBSSxXQUFXLEdBQUcsUUFBUSxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNqRSxrQkFBYyxDQUFDLFdBQVcsQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLGVBQWUsRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0FBQ25HLFdBQU8sT0FBTyxDQUFDLEVBQUUsZUFBZSxFQUFFLFdBQVcsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDO0NBQ3BFO0FBQ0QsT0FBTyxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL2F0b20tdHlwZXNjcmlwdC9kaXN0L21haW4vbGFuZy9wcm9qZWN0U2VydmljZS5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBmc3UgPSByZXF1aXJlKFwiLi4vdXRpbHMvZnNVdGlsXCIpO1xudmFyIGZzID0gcmVxdWlyZSgnZnMnKTtcbnZhciBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xudmFyIG9zID0gcmVxdWlyZSgnb3MnKTtcbnZhciBta2RpcnAgPSByZXF1aXJlKCdta2RpcnAnKTtcbnZhciBmdXp6YWxkcmluID0gcmVxdWlyZSgnZnV6emFsZHJpbicpO1xudmFyIHRyYW5zZm9ybWVyXzEgPSByZXF1aXJlKFwiLi90cmFuc2Zvcm1lcnMvdHJhbnNmb3JtZXJcIik7XG52YXIgdHJhbnNmb3JtZXIgPSByZXF1aXJlKFwiLi90cmFuc2Zvcm1lcnMvdHJhbnNmb3JtZXJcIik7XG52YXIgdHNjb25maWcgPSByZXF1aXJlKCcuLi90c2NvbmZpZy90c2NvbmZpZycpO1xudmFyIGZzVXRpbCA9IHJlcXVpcmUoXCIuLi91dGlscy9mc1V0aWxcIik7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG52YXIgcmVzb2x2ZSA9IFByb21pc2UucmVzb2x2ZS5iaW5kKFByb21pc2UpO1xudmFyIHByb2plY3RDYWNoZV8xID0gcmVxdWlyZShcIi4vcHJvamVjdENhY2hlXCIpO1xuZnVuY3Rpb24gdGV4dFNwYW4oc3Bhbikge1xuICAgIHJldHVybiB7XG4gICAgICAgIHN0YXJ0OiBzcGFuLnN0YXJ0LFxuICAgICAgICBsZW5ndGg6IHNwYW4ubGVuZ3RoXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGVjaG8oZGF0YSkge1xuICAgIHJldHVybiBwcm9qZWN0Q2FjaGVfMS5xdWVyeVBhcmVudC5lY2hvTnVtV2l0aE1vZGlmaWNhdGlvbih7IG51bTogZGF0YS5udW0gfSkudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICBkYXRhLm51bSA9IHJlc3AubnVtO1xuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9KTtcbn1cbmV4cG9ydHMuZWNobyA9IGVjaG87XG5mdW5jdGlvbiBxdWlja0luZm8ocXVlcnkpIHtcbiAgICBwcm9qZWN0Q2FjaGVfMS5jb25zaXN0ZW50UGF0aChxdWVyeSk7XG4gICAgdmFyIHByb2plY3QgPSBwcm9qZWN0Q2FjaGVfMS5nZXRPckNyZWF0ZVByb2plY3QocXVlcnkuZmlsZVBhdGgpO1xuICAgIHZhciBpbmZvID0gcHJvamVjdC5sYW5ndWFnZVNlcnZpY2UuZ2V0UXVpY2tJbmZvQXRQb3NpdGlvbihxdWVyeS5maWxlUGF0aCwgcXVlcnkucG9zaXRpb24pO1xuICAgIGlmICghaW5mbylcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IHZhbGlkOiBmYWxzZSB9KTtcbiAgICBlbHNlXG4gICAgICAgIHJldHVybiByZXNvbHZlKHtcbiAgICAgICAgICAgIHZhbGlkOiB0cnVlLFxuICAgICAgICAgICAgbmFtZTogdHMuZGlzcGxheVBhcnRzVG9TdHJpbmcoaW5mby5kaXNwbGF5UGFydHMgfHwgW10pLFxuICAgICAgICAgICAgY29tbWVudDogdHMuZGlzcGxheVBhcnRzVG9TdHJpbmcoaW5mby5kb2N1bWVudGF0aW9uIHx8IFtdKSxcbiAgICAgICAgfSk7XG59XG5leHBvcnRzLnF1aWNrSW5mbyA9IHF1aWNrSW5mbztcbnZhciBidWlsZGluZyA9IHJlcXVpcmUoJy4vbW9kdWxlcy9idWlsZGluZycpO1xuZnVuY3Rpb24gYnVpbGQocXVlcnkpIHtcbiAgICBwcm9qZWN0Q2FjaGVfMS5jb25zaXN0ZW50UGF0aChxdWVyeSk7XG4gICAgdmFyIHByb2ogPSBwcm9qZWN0Q2FjaGVfMS5nZXRPckNyZWF0ZVByb2plY3QocXVlcnkuZmlsZVBhdGgpO1xuICAgIHZhciB0b3RhbENvdW50ID0gcHJvai5wcm9qZWN0RmlsZS5wcm9qZWN0LmZpbGVzLmxlbmd0aDtcbiAgICB2YXIgYnVpbHRDb3VudCA9IDA7XG4gICAgdmFyIGVycm9yQ291bnQgPSAwO1xuICAgIHZhciBvdXRwdXRzID0gcHJvai5wcm9qZWN0RmlsZS5wcm9qZWN0LmZpbGVzLm1hcChmdW5jdGlvbiAoZmlsZVBhdGgpIHtcbiAgICAgICAgdmFyIG91dHB1dCA9IGJ1aWxkaW5nLmVtaXRGaWxlKHByb2osIGZpbGVQYXRoKTtcbiAgICAgICAgYnVpbHRDb3VudCsrO1xuICAgICAgICBlcnJvckNvdW50ID0gZXJyb3JDb3VudCArIG91dHB1dC5lcnJvcnMubGVuZ3RoO1xuICAgICAgICBwcm9qZWN0Q2FjaGVfMS5xdWVyeVBhcmVudC5idWlsZFVwZGF0ZSh7XG4gICAgICAgICAgICB0b3RhbENvdW50OiB0b3RhbENvdW50LFxuICAgICAgICAgICAgYnVpbHRDb3VudDogYnVpbHRDb3VudCxcbiAgICAgICAgICAgIGVycm9yQ291bnQ6IGVycm9yQ291bnQsXG4gICAgICAgICAgICBmaXJzdEVycm9yOiBlcnJvckNvdW50ICYmICEoZXJyb3JDb3VudCAtIG91dHB1dC5lcnJvcnMubGVuZ3RoKSxcbiAgICAgICAgICAgIGZpbGVQYXRoOiBmaWxlUGF0aCxcbiAgICAgICAgICAgIGVycm9yc0luRmlsZTogb3V0cHV0LmVycm9yc1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9KTtcbiAgICBpZiAocHJvai5wcm9qZWN0RmlsZS5wcm9qZWN0LmNvbXBpbGVyT3B0aW9ucy5kZWNsYXJhdGlvblxuICAgICAgICAmJiBwcm9qLnByb2plY3RGaWxlLnByb2plY3QucGFja2FnZVxuICAgICAgICAmJiBwcm9qLnByb2plY3RGaWxlLnByb2plY3QucGFja2FnZS5uYW1lXG4gICAgICAgICYmIHByb2oucHJvamVjdEZpbGUucHJvamVjdC5wYWNrYWdlLmRlZmluaXRpb24pIHtcbiAgICAgICAgdmFyIHBhY2thZ2VEaXIgPSBwcm9qLnByb2plY3RGaWxlLnByb2plY3QucGFja2FnZS5kaXJlY3Rvcnk7XG4gICAgICAgIHZhciBkZWZMb2NhdGlvbiA9IGZzVXRpbC5yZXNvbHZlKHBhY2thZ2VEaXIsIHByb2oucHJvamVjdEZpbGUucHJvamVjdC5wYWNrYWdlLmRlZmluaXRpb24pO1xuICAgICAgICB2YXIgbW9kdWxlTmFtZSA9IHByb2oucHJvamVjdEZpbGUucHJvamVjdC5wYWNrYWdlLm5hbWU7XG4gICAgICAgIHZhciBkdHNGaWxlcyA9IHV0aWxzLnNlbGVjdE1hbnkob3V0cHV0cy5tYXAoZnVuY3Rpb24gKG8pIHsgcmV0dXJuIG8ub3V0cHV0RmlsZXM7IH0pKS5maWx0ZXIoZnVuY3Rpb24gKGYpIHsgcmV0dXJuIGZzVXRpbC5pc0V4dChmLCAnLmQudHMnKTsgfSk7XG4gICAgICAgIHZhciBmaW5hbENvZGUgPSBbXTtcbiAgICAgICAgdmFyIGFkZE1vZHVsZVRvT3V0cHV0ID0gZnVuY3Rpb24gKG1vZHVsZVBhdGgsIGZpbGVUb0ltcG9ydCkge1xuICAgICAgICAgICAgZmluYWxDb2RlLnB1c2gob3MuRU9MICsgKFwiXFxuZGVjbGFyZSBtb2R1bGUgXFxcIlwiICsgbW9kdWxlUGF0aCArIFwiXFxcIntcXG4gICAgaW1wb3J0IHRtcCA9IHJlcXVpcmUoJ1wiICsgZmlsZVRvSW1wb3J0ICsgXCInKTtcXG4gICAgZXhwb3J0ID0gdG1wO1xcbn1cXG4gICAgICAgICAgICBcIikudHJpbSgpKTtcbiAgICAgICAgfTtcbiAgICAgICAgZHRzRmlsZXMuZm9yRWFjaChmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICAgICAgdmFyIHJlbGF0aXZlUGF0aCA9IGZzVXRpbC5tYWtlUmVsYXRpdmVQYXRoKHBhY2thZ2VEaXIsIGZpbGUpO1xuICAgICAgICAgICAgdmFyIHJlbGF0aXZlUGF0aE5vRXh0ID0gcmVsYXRpdmVQYXRoLnN1YnN0cmluZygwLCByZWxhdGl2ZVBhdGgubGVuZ3RoIC0gNSk7XG4gICAgICAgICAgICB2YXIgbW9kdWxlUGF0aCA9IG1vZHVsZU5hbWUgKyByZWxhdGl2ZVBhdGhOb0V4dC5zdWJzdHIoMSk7XG4gICAgICAgICAgICB2YXIgZmlsZVRvSW1wb3J0ID0gcmVsYXRpdmVQYXRoTm9FeHQuc3Vic3RyKDIpO1xuICAgICAgICAgICAgYWRkTW9kdWxlVG9PdXRwdXQobW9kdWxlUGF0aCwgZmlsZVRvSW1wb3J0KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChwcm9qLnByb2plY3RGaWxlLnByb2plY3QucGFja2FnZS5tYWluKSB7XG4gICAgICAgICAgICB2YXIgbW9kdWxlUGF0aCA9IG1vZHVsZU5hbWU7XG4gICAgICAgICAgICB2YXIgZnVsbFBhdGggPSBmc1V0aWwucmVzb2x2ZShwYWNrYWdlRGlyLCBwcm9qLnByb2plY3RGaWxlLnByb2plY3QucGFja2FnZS5tYWluKTtcbiAgICAgICAgICAgIHZhciByZWxhdGl2ZVBhdGggPSBmc1V0aWwubWFrZVJlbGF0aXZlUGF0aChwYWNrYWdlRGlyLCBmdWxsUGF0aCk7XG4gICAgICAgICAgICB2YXIgZmlsZVRvSW1wb3J0ID0gcmVsYXRpdmVQYXRoLnN1YnN0cigyKS5yZXBsYWNlKC9cXC5qcyskLywgJycpO1xuICAgICAgICAgICAgYWRkTW9kdWxlVG9PdXRwdXQobW9kdWxlUGF0aCwgZmlsZVRvSW1wb3J0KTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgam9pbmVkRHRzQ29kZSA9IGZpbmFsQ29kZS5qb2luKG9zLkVPTCk7XG4gICAgICAgIG1rZGlycC5zeW5jKHBhdGguZGlybmFtZShkZWZMb2NhdGlvbikpO1xuICAgICAgICBmcy53cml0ZUZpbGVTeW5jKGRlZkxvY2F0aW9uLCBqb2luZWREdHNDb2RlKTtcbiAgICB9XG4gICAgdmFyIHRzRmlsZXNXaXRoSW52YWxpZEVtaXQgPSBvdXRwdXRzXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKG8pIHsgcmV0dXJuIG8uZW1pdEVycm9yOyB9KVxuICAgICAgICAubWFwKGZ1bmN0aW9uIChvKSB7IHJldHVybiBvLnNvdXJjZUZpbGVOYW1lOyB9KTtcbiAgICB2YXIgdHNGaWxlc1dpdGhWYWxpZEVtaXQgPSBvdXRwdXRzXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKG8pIHsgcmV0dXJuICFvLmVtaXRFcnJvcjsgfSlcbiAgICAgICAgLm1hcChmdW5jdGlvbiAobykgeyByZXR1cm4gby5zb3VyY2VGaWxlTmFtZTsgfSk7XG4gICAgcmV0dXJuIHJlc29sdmUoe1xuICAgICAgICB0c0ZpbGVzV2l0aEludmFsaWRFbWl0OiB0c0ZpbGVzV2l0aEludmFsaWRFbWl0LFxuICAgICAgICB0c0ZpbGVzV2l0aFZhbGlkRW1pdDogdHNGaWxlc1dpdGhWYWxpZEVtaXQsXG4gICAgICAgIGJ1aWxkT3V0cHV0OiB7XG4gICAgICAgICAgICBvdXRwdXRzOiBvdXRwdXRzLFxuICAgICAgICAgICAgY291bnRzOiB7XG4gICAgICAgICAgICAgICAgaW5wdXRGaWxlczogcHJvai5wcm9qZWN0RmlsZS5wcm9qZWN0LmZpbGVzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBvdXRwdXRGaWxlczogdXRpbHMuc2VsZWN0TWFueShvdXRwdXRzLm1hcChmdW5jdGlvbiAob3V0KSB7IHJldHVybiBvdXQub3V0cHV0RmlsZXM7IH0pKS5sZW5ndGgsXG4gICAgICAgICAgICAgICAgZXJyb3JzOiBlcnJvckNvdW50LFxuICAgICAgICAgICAgICAgIGVtaXRFcnJvcnM6IG91dHB1dHMuZmlsdGVyKGZ1bmN0aW9uIChvdXQpIHsgcmV0dXJuIG91dC5lbWl0RXJyb3I7IH0pLmxlbmd0aFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59XG5leHBvcnRzLmJ1aWxkID0gYnVpbGQ7XG5mdW5jdGlvbiBnZXRDb21wbGV0aW9uc0F0UG9zaXRpb24ocXVlcnkpIHtcbiAgICBwcm9qZWN0Q2FjaGVfMS5jb25zaXN0ZW50UGF0aChxdWVyeSk7XG4gICAgdmFyIGZpbGVQYXRoID0gcXVlcnkuZmlsZVBhdGgsIHBvc2l0aW9uID0gcXVlcnkucG9zaXRpb24sIHByZWZpeCA9IHF1ZXJ5LnByZWZpeDtcbiAgICB2YXIgcHJvamVjdCA9IHByb2plY3RDYWNoZV8xLmdldE9yQ3JlYXRlUHJvamVjdChmaWxlUGF0aCk7XG4gICAgZmlsZVBhdGggPSB0cmFuc2Zvcm1lci5nZXRQc2V1ZG9GaWxlUGF0aChmaWxlUGF0aCk7XG4gICAgdmFyIGNvbXBsZXRpb25zID0gcHJvamVjdC5sYW5ndWFnZVNlcnZpY2UuZ2V0Q29tcGxldGlvbnNBdFBvc2l0aW9uKGZpbGVQYXRoLCBwb3NpdGlvbik7XG4gICAgdmFyIGNvbXBsZXRpb25MaXN0ID0gY29tcGxldGlvbnMgPyBjb21wbGV0aW9ucy5lbnRyaWVzLmZpbHRlcihmdW5jdGlvbiAoeCkgeyByZXR1cm4gISF4OyB9KSA6IFtdO1xuICAgIHZhciBlbmRzSW5QdW5jdHVhdGlvbiA9IHV0aWxzLnByZWZpeEVuZHNJblB1bmN0dWF0aW9uKHByZWZpeCk7XG4gICAgaWYgKHByZWZpeC5sZW5ndGggJiYgIWVuZHNJblB1bmN0dWF0aW9uKSB7XG4gICAgICAgIGNvbXBsZXRpb25MaXN0ID0gZnV6emFsZHJpbi5maWx0ZXIoY29tcGxldGlvbkxpc3QsIHByZWZpeCwgeyBrZXk6ICduYW1lJyB9KTtcbiAgICB9XG4gICAgdmFyIG1heFN1Z2dlc3Rpb25zID0gNTA7XG4gICAgdmFyIG1heERvY0NvbW1lbnRzID0gMTA7XG4gICAgaWYgKGNvbXBsZXRpb25MaXN0Lmxlbmd0aCA+IG1heFN1Z2dlc3Rpb25zKVxuICAgICAgICBjb21wbGV0aW9uTGlzdCA9IGNvbXBsZXRpb25MaXN0LnNsaWNlKDAsIG1heFN1Z2dlc3Rpb25zKTtcbiAgICBmdW5jdGlvbiBkb2NDb21tZW50KGMpIHtcbiAgICAgICAgdmFyIGNvbXBsZXRpb25EZXRhaWxzID0gcHJvamVjdC5sYW5ndWFnZVNlcnZpY2UuZ2V0Q29tcGxldGlvbkVudHJ5RGV0YWlscyhmaWxlUGF0aCwgcG9zaXRpb24sIGMubmFtZSk7XG4gICAgICAgIHZhciBkaXNwbGF5O1xuICAgICAgICBpZiAoYy5raW5kID09IFwibWV0aG9kXCIgfHwgYy5raW5kID09IFwiZnVuY3Rpb25cIiB8fCBjLmtpbmQgPT0gXCJwcm9wZXJ0eVwiKSB7XG4gICAgICAgICAgICB2YXIgcGFydHMgPSBjb21wbGV0aW9uRGV0YWlscy5kaXNwbGF5UGFydHMgfHwgW107XG4gICAgICAgICAgICBpZiAocGFydHMubGVuZ3RoID4gMykge1xuICAgICAgICAgICAgICAgIHBhcnRzID0gcGFydHMuc3BsaWNlKDMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGlzcGxheSA9IHRzLmRpc3BsYXlQYXJ0c1RvU3RyaW5nKHBhcnRzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGRpc3BsYXkgPSAnJztcbiAgICAgICAgfVxuICAgICAgICB2YXIgY29tbWVudCA9IChkaXNwbGF5ID8gZGlzcGxheSArICdcXG4nIDogJycpICsgdHMuZGlzcGxheVBhcnRzVG9TdHJpbmcoY29tcGxldGlvbkRldGFpbHMuZG9jdW1lbnRhdGlvbiB8fCBbXSk7XG4gICAgICAgIHJldHVybiB7IGRpc3BsYXk6IGRpc3BsYXksIGNvbW1lbnQ6IGNvbW1lbnQgfTtcbiAgICB9XG4gICAgdmFyIGNvbXBsZXRpb25zVG9SZXR1cm4gPSBjb21wbGV0aW9uTGlzdC5tYXAoZnVuY3Rpb24gKGMsIGluZGV4KSB7XG4gICAgICAgIGlmIChpbmRleCA8IG1heERvY0NvbW1lbnRzKSB7XG4gICAgICAgICAgICB2YXIgZGV0YWlscyA9IGRvY0NvbW1lbnQoYyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBkZXRhaWxzID0ge1xuICAgICAgICAgICAgICAgIGRpc3BsYXk6ICcnLFxuICAgICAgICAgICAgICAgIGNvbW1lbnQ6ICcnXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBuYW1lOiBjLm5hbWUsXG4gICAgICAgICAgICBraW5kOiBjLmtpbmQsXG4gICAgICAgICAgICBjb21tZW50OiBkZXRhaWxzLmNvbW1lbnQsXG4gICAgICAgICAgICBkaXNwbGF5OiBkZXRhaWxzLmRpc3BsYXlcbiAgICAgICAgfTtcbiAgICB9KTtcbiAgICBpZiAocXVlcnkucHJlZml4ID09ICcoJykge1xuICAgICAgICB2YXIgc2lnbmF0dXJlcyA9IHByb2plY3QubGFuZ3VhZ2VTZXJ2aWNlLmdldFNpZ25hdHVyZUhlbHBJdGVtcyhxdWVyeS5maWxlUGF0aCwgcXVlcnkucG9zaXRpb24pO1xuICAgICAgICBpZiAoc2lnbmF0dXJlcyAmJiBzaWduYXR1cmVzLml0ZW1zKSB7XG4gICAgICAgICAgICBzaWduYXR1cmVzLml0ZW1zLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICB2YXIgc25pcHBldCA9IGl0ZW0ucGFyYW1ldGVycy5tYXAoZnVuY3Rpb24gKHAsIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRpc3BsYXkgPSAnJHsnICsgKGkgKyAxKSArICc6JyArIHRzLmRpc3BsYXlQYXJ0c1RvU3RyaW5nKHAuZGlzcGxheVBhcnRzKSArICd9JztcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgPT09IHNpZ25hdHVyZXMuYXJndW1lbnRJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRpc3BsYXk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRpc3BsYXk7XG4gICAgICAgICAgICAgICAgfSkuam9pbih0cy5kaXNwbGF5UGFydHNUb1N0cmluZyhpdGVtLnNlcGFyYXRvckRpc3BsYXlQYXJ0cykpO1xuICAgICAgICAgICAgICAgIHZhciBsYWJlbCA9IHRzLmRpc3BsYXlQYXJ0c1RvU3RyaW5nKGl0ZW0ucHJlZml4RGlzcGxheVBhcnRzKVxuICAgICAgICAgICAgICAgICAgICArIHNuaXBwZXRcbiAgICAgICAgICAgICAgICAgICAgKyB0cy5kaXNwbGF5UGFydHNUb1N0cmluZyhpdGVtLnN1ZmZpeERpc3BsYXlQYXJ0cyk7XG4gICAgICAgICAgICAgICAgY29tcGxldGlvbnNUb1JldHVybi51bnNoaWZ0KHsgc25pcHBldDogc25pcHBldCB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXNvbHZlKHtcbiAgICAgICAgY29tcGxldGlvbnM6IGNvbXBsZXRpb25zVG9SZXR1cm4sXG4gICAgICAgIGVuZHNJblB1bmN0dWF0aW9uOiBlbmRzSW5QdW5jdHVhdGlvblxuICAgIH0pO1xufVxuZXhwb3J0cy5nZXRDb21wbGV0aW9uc0F0UG9zaXRpb24gPSBnZXRDb21wbGV0aW9uc0F0UG9zaXRpb247XG5mdW5jdGlvbiBnZXRTaWduYXR1cmVIZWxwcyhxdWVyeSkge1xuICAgIHByb2plY3RDYWNoZV8xLmNvbnNpc3RlbnRQYXRoKHF1ZXJ5KTtcbiAgICB2YXIgcHJvamVjdCA9IHByb2plY3RDYWNoZV8xLmdldE9yQ3JlYXRlUHJvamVjdChxdWVyeS5maWxlUGF0aCk7XG4gICAgdmFyIHNpZ25hdHVyZUhlbHBJdGVtcyA9IHByb2plY3QubGFuZ3VhZ2VTZXJ2aWNlLmdldFNpZ25hdHVyZUhlbHBJdGVtcyhxdWVyeS5maWxlUGF0aCwgcXVlcnkucG9zaXRpb24pO1xuICAgIGlmICghc2lnbmF0dXJlSGVscEl0ZW1zIHx8ICFzaWduYXR1cmVIZWxwSXRlbXMuaXRlbXMgfHwgIXNpZ25hdHVyZUhlbHBJdGVtcy5pdGVtcy5sZW5ndGgpXG4gICAgICAgIHJldHVybiByZXNvbHZlKHsgc2lnbmF0dXJlSGVscHM6IFtdIH0pO1xuICAgIHJldHVybiBzaWduYXR1cmVIZWxwSXRlbXMuaXRlbXM7XG59XG5leHBvcnRzLmdldFNpZ25hdHVyZUhlbHBzID0gZ2V0U2lnbmF0dXJlSGVscHM7XG5mdW5jdGlvbiBlbWl0RmlsZShxdWVyeSkge1xuICAgIHByb2plY3RDYWNoZV8xLmNvbnNpc3RlbnRQYXRoKHF1ZXJ5KTtcbiAgICB2YXIgZmlsZVBhdGggPSB0cmFuc2Zvcm1lci5nZXRQc2V1ZG9GaWxlUGF0aChxdWVyeS5maWxlUGF0aCk7XG4gICAgcmV0dXJuIHJlc29sdmUoYnVpbGRpbmcuZW1pdEZpbGUocHJvamVjdENhY2hlXzEuZ2V0T3JDcmVhdGVQcm9qZWN0KGZpbGVQYXRoKSwgZmlsZVBhdGgpKTtcbn1cbmV4cG9ydHMuZW1pdEZpbGUgPSBlbWl0RmlsZTtcbnZhciBmb3JtYXR0aW5nID0gcmVxdWlyZSgnLi9tb2R1bGVzL2Zvcm1hdHRpbmcnKTtcbmZ1bmN0aW9uIGZvcm1hdERvY3VtZW50KHF1ZXJ5KSB7XG4gICAgcHJvamVjdENhY2hlXzEuY29uc2lzdGVudFBhdGgocXVlcnkpO1xuICAgIHZhciBwcm9qID0gcHJvamVjdENhY2hlXzEuZ2V0T3JDcmVhdGVQcm9qZWN0KHF1ZXJ5LmZpbGVQYXRoKTtcbiAgICByZXR1cm4gcmVzb2x2ZSh7IGVkaXRzOiBmb3JtYXR0aW5nLmZvcm1hdERvY3VtZW50KHByb2osIHF1ZXJ5LmZpbGVQYXRoKSB9KTtcbn1cbmV4cG9ydHMuZm9ybWF0RG9jdW1lbnQgPSBmb3JtYXREb2N1bWVudDtcbmZ1bmN0aW9uIGZvcm1hdERvY3VtZW50UmFuZ2UocXVlcnkpIHtcbiAgICBwcm9qZWN0Q2FjaGVfMS5jb25zaXN0ZW50UGF0aChxdWVyeSk7XG4gICAgdmFyIHByb2ogPSBwcm9qZWN0Q2FjaGVfMS5nZXRPckNyZWF0ZVByb2plY3QocXVlcnkuZmlsZVBhdGgpO1xuICAgIHJldHVybiByZXNvbHZlKHsgZWRpdHM6IGZvcm1hdHRpbmcuZm9ybWF0RG9jdW1lbnRSYW5nZShwcm9qLCBxdWVyeS5maWxlUGF0aCwgcXVlcnkuc3RhcnQsIHF1ZXJ5LmVuZCkgfSk7XG59XG5leHBvcnRzLmZvcm1hdERvY3VtZW50UmFuZ2UgPSBmb3JtYXREb2N1bWVudFJhbmdlO1xuZnVuY3Rpb24gZ2V0RGVmaW5pdGlvbnNBdFBvc2l0aW9uKHF1ZXJ5KSB7XG4gICAgcHJvamVjdENhY2hlXzEuY29uc2lzdGVudFBhdGgocXVlcnkpO1xuICAgIHZhciBwcm9qZWN0ID0gcHJvamVjdENhY2hlXzEuZ2V0T3JDcmVhdGVQcm9qZWN0KHF1ZXJ5LmZpbGVQYXRoKTtcbiAgICB2YXIgZGVmaW5pdGlvbnMgPSBwcm9qZWN0Lmxhbmd1YWdlU2VydmljZS5nZXREZWZpbml0aW9uQXRQb3NpdGlvbihxdWVyeS5maWxlUGF0aCwgcXVlcnkucG9zaXRpb24pO1xuICAgIHZhciBwcm9qZWN0RmlsZURpcmVjdG9yeSA9IHByb2plY3QucHJvamVjdEZpbGUucHJvamVjdEZpbGVEaXJlY3Rvcnk7XG4gICAgaWYgKCFkZWZpbml0aW9ucyB8fCAhZGVmaW5pdGlvbnMubGVuZ3RoKVxuICAgICAgICByZXR1cm4gcmVzb2x2ZSh7IHByb2plY3RGaWxlRGlyZWN0b3J5OiBwcm9qZWN0RmlsZURpcmVjdG9yeSwgZGVmaW5pdGlvbnM6IFtdIH0pO1xuICAgIHJldHVybiByZXNvbHZlKHtcbiAgICAgICAgcHJvamVjdEZpbGVEaXJlY3Rvcnk6IHByb2plY3RGaWxlRGlyZWN0b3J5LFxuICAgICAgICBkZWZpbml0aW9uczogZGVmaW5pdGlvbnMubWFwKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICB2YXIgcG9zID0gcHJvamVjdC5sYW5ndWFnZVNlcnZpY2VIb3N0LmdldFBvc2l0aW9uRnJvbUluZGV4KGQuZmlsZU5hbWUsIGQudGV4dFNwYW4uc3RhcnQpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBmaWxlUGF0aDogZC5maWxlTmFtZSxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogcG9zXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KVxuICAgIH0pO1xufVxuZXhwb3J0cy5nZXREZWZpbml0aW9uc0F0UG9zaXRpb24gPSBnZXREZWZpbml0aW9uc0F0UG9zaXRpb247XG5mdW5jdGlvbiB1cGRhdGVUZXh0KHF1ZXJ5KSB7XG4gICAgcHJvamVjdENhY2hlXzEuY29uc2lzdGVudFBhdGgocXVlcnkpO1xuICAgIHZhciBsc2ggPSBwcm9qZWN0Q2FjaGVfMS5nZXRPckNyZWF0ZVByb2plY3QocXVlcnkuZmlsZVBhdGgpLmxhbmd1YWdlU2VydmljZUhvc3Q7XG4gICAgdmFyIGZpbGVQYXRoID0gdHJhbnNmb3JtZXIuZ2V0UHNldWRvRmlsZVBhdGgocXVlcnkuZmlsZVBhdGgpO1xuICAgIGxzaC51cGRhdGVTY3JpcHQoZmlsZVBhdGgsIHF1ZXJ5LnRleHQpO1xuICAgIHJldHVybiByZXNvbHZlKHt9KTtcbn1cbmV4cG9ydHMudXBkYXRlVGV4dCA9IHVwZGF0ZVRleHQ7XG5mdW5jdGlvbiBlZGl0VGV4dChxdWVyeSkge1xuICAgIHByb2plY3RDYWNoZV8xLmNvbnNpc3RlbnRQYXRoKHF1ZXJ5KTtcbiAgICB2YXIgbHNoID0gcHJvamVjdENhY2hlXzEuZ2V0T3JDcmVhdGVQcm9qZWN0KHF1ZXJ5LmZpbGVQYXRoKS5sYW5ndWFnZVNlcnZpY2VIb3N0O1xuICAgIHZhciBmaWxlUGF0aCA9IHRyYW5zZm9ybWVyLmdldFBzZXVkb0ZpbGVQYXRoKHF1ZXJ5LmZpbGVQYXRoKTtcbiAgICBsc2guZWRpdFNjcmlwdChmaWxlUGF0aCwgcXVlcnkuc3RhcnQsIHF1ZXJ5LmVuZCwgcXVlcnkubmV3VGV4dCk7XG4gICAgcmV0dXJuIHJlc29sdmUoe30pO1xufVxuZXhwb3J0cy5lZGl0VGV4dCA9IGVkaXRUZXh0O1xuZnVuY3Rpb24gZ2V0RGlhZ25vc2l0Y3NCeUZpbGVQYXRoKHF1ZXJ5KSB7XG4gICAgcHJvamVjdENhY2hlXzEuY29uc2lzdGVudFBhdGgocXVlcnkpO1xuICAgIHZhciBwcm9qZWN0ID0gcHJvamVjdENhY2hlXzEuZ2V0T3JDcmVhdGVQcm9qZWN0KHF1ZXJ5LmZpbGVQYXRoKTtcbiAgICB2YXIgZGlhZ25vc3RpY3MgPSBwcm9qZWN0Lmxhbmd1YWdlU2VydmljZS5nZXRTeW50YWN0aWNEaWFnbm9zdGljcyhxdWVyeS5maWxlUGF0aCk7XG4gICAgaWYgKGRpYWdub3N0aWNzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBkaWFnbm9zdGljcyA9IHByb2plY3QubGFuZ3VhZ2VTZXJ2aWNlLmdldFNlbWFudGljRGlhZ25vc3RpY3MocXVlcnkuZmlsZVBhdGgpO1xuICAgIH1cbiAgICByZXR1cm4gZGlhZ25vc3RpY3M7XG59XG5mdW5jdGlvbiBlcnJvcnNGb3JGaWxlKHF1ZXJ5KSB7XG4gICAgcHJvamVjdENhY2hlXzEuY29uc2lzdGVudFBhdGgocXVlcnkpO1xuICAgIGlmICh0cmFuc2Zvcm1lcl8xLmlzVHJhbnNmb3JtZXJGaWxlKHF1ZXJ5LmZpbGVQYXRoKSkge1xuICAgICAgICB2YXIgZmlsZVBhdGggPSB0cmFuc2Zvcm1lci5nZXRQc2V1ZG9GaWxlUGF0aChxdWVyeS5maWxlUGF0aCk7XG4gICAgICAgIHZhciBlcnJvcnMgPSBnZXREaWFnbm9zaXRjc0J5RmlsZVBhdGgoeyBmaWxlUGF0aDogZmlsZVBhdGggfSkubWFwKGJ1aWxkaW5nLmRpYWdub3N0aWNUb1RTRXJyb3IpO1xuICAgICAgICBlcnJvcnMuZm9yRWFjaChmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgIGVycm9yLmZpbGVQYXRoID0gcXVlcnkuZmlsZVBhdGg7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzb2x2ZSh7IGVycm9yczogZXJyb3JzIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHJlc29sdmUoeyBlcnJvcnM6IGdldERpYWdub3NpdGNzQnlGaWxlUGF0aChxdWVyeSkubWFwKGJ1aWxkaW5nLmRpYWdub3N0aWNUb1RTRXJyb3IpIH0pO1xuICAgIH1cbn1cbmV4cG9ydHMuZXJyb3JzRm9yRmlsZSA9IGVycm9yc0ZvckZpbGU7XG5mdW5jdGlvbiBnZXRSZW5hbWVJbmZvKHF1ZXJ5KSB7XG4gICAgcHJvamVjdENhY2hlXzEuY29uc2lzdGVudFBhdGgocXVlcnkpO1xuICAgIHZhciBwcm9qZWN0ID0gcHJvamVjdENhY2hlXzEuZ2V0T3JDcmVhdGVQcm9qZWN0KHF1ZXJ5LmZpbGVQYXRoKTtcbiAgICB2YXIgZmluZEluU3RyaW5ncyA9IGZhbHNlLCBmaW5kSW5Db21tZW50cyA9IGZhbHNlO1xuICAgIHZhciBpbmZvID0gcHJvamVjdC5sYW5ndWFnZVNlcnZpY2UuZ2V0UmVuYW1lSW5mbyhxdWVyeS5maWxlUGF0aCwgcXVlcnkucG9zaXRpb24pO1xuICAgIGlmIChpbmZvICYmIGluZm8uY2FuUmVuYW1lKSB7XG4gICAgICAgIHZhciBsb2NhdGlvbnMgPSB7fTtcbiAgICAgICAgcHJvamVjdC5sYW5ndWFnZVNlcnZpY2UuZmluZFJlbmFtZUxvY2F0aW9ucyhxdWVyeS5maWxlUGF0aCwgcXVlcnkucG9zaXRpb24sIGZpbmRJblN0cmluZ3MsIGZpbmRJbkNvbW1lbnRzKVxuICAgICAgICAgICAgLmZvckVhY2goZnVuY3Rpb24gKGxvYykge1xuICAgICAgICAgICAgaWYgKCFsb2NhdGlvbnNbbG9jLmZpbGVOYW1lXSlcbiAgICAgICAgICAgICAgICBsb2NhdGlvbnNbbG9jLmZpbGVOYW1lXSA9IFtdO1xuICAgICAgICAgICAgbG9jYXRpb25zW2xvYy5maWxlTmFtZV0udW5zaGlmdCh0ZXh0U3Bhbihsb2MudGV4dFNwYW4pKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByZXNvbHZlKHtcbiAgICAgICAgICAgIGNhblJlbmFtZTogdHJ1ZSxcbiAgICAgICAgICAgIGxvY2FsaXplZEVycm9yTWVzc2FnZTogaW5mby5sb2NhbGl6ZWRFcnJvck1lc3NhZ2UsXG4gICAgICAgICAgICBkaXNwbGF5TmFtZTogaW5mby5kaXNwbGF5TmFtZSxcbiAgICAgICAgICAgIGZ1bGxEaXNwbGF5TmFtZTogaW5mby5mdWxsRGlzcGxheU5hbWUsXG4gICAgICAgICAgICBraW5kOiBpbmZvLmtpbmQsXG4gICAgICAgICAgICBraW5kTW9kaWZpZXJzOiBpbmZvLmtpbmRNb2RpZmllcnMsXG4gICAgICAgICAgICB0cmlnZ2VyU3BhbjogdGV4dFNwYW4oaW5mby50cmlnZ2VyU3BhbiksXG4gICAgICAgICAgICBsb2NhdGlvbnM6IGxvY2F0aW9uc1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiByZXNvbHZlKHtcbiAgICAgICAgICAgIGNhblJlbmFtZTogZmFsc2VcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5nZXRSZW5hbWVJbmZvID0gZ2V0UmVuYW1lSW5mbztcbmZ1bmN0aW9uIGdldEluZGVudGF0aW9uQXRQb3NpdGlvbihxdWVyeSkge1xuICAgIHByb2plY3RDYWNoZV8xLmNvbnNpc3RlbnRQYXRoKHF1ZXJ5KTtcbiAgICB2YXIgcHJvamVjdCA9IHByb2plY3RDYWNoZV8xLmdldE9yQ3JlYXRlUHJvamVjdChxdWVyeS5maWxlUGF0aCk7XG4gICAgdmFyIGluZGVudCA9IHByb2plY3QubGFuZ3VhZ2VTZXJ2aWNlLmdldEluZGVudGF0aW9uQXRQb3NpdGlvbihxdWVyeS5maWxlUGF0aCwgcXVlcnkucG9zaXRpb24sIHByb2plY3QucHJvamVjdEZpbGUucHJvamVjdC5mb3JtYXRDb2RlT3B0aW9ucyk7XG4gICAgcmV0dXJuIHJlc29sdmUoeyBpbmRlbnQ6IGluZGVudCB9KTtcbn1cbmV4cG9ydHMuZ2V0SW5kZW50YXRpb25BdFBvc2l0aW9uID0gZ2V0SW5kZW50YXRpb25BdFBvc2l0aW9uO1xuZnVuY3Rpb24gZGVidWdMYW5ndWFnZVNlcnZpY2VIb3N0VmVyc2lvbihxdWVyeSkge1xuICAgIHByb2plY3RDYWNoZV8xLmNvbnNpc3RlbnRQYXRoKHF1ZXJ5KTtcbiAgICB2YXIgcHJvamVjdCA9IHByb2plY3RDYWNoZV8xLmdldE9yQ3JlYXRlUHJvamVjdChxdWVyeS5maWxlUGF0aCk7XG4gICAgcmV0dXJuIHJlc29sdmUoeyB0ZXh0OiBwcm9qZWN0Lmxhbmd1YWdlU2VydmljZUhvc3QuZ2V0U2NyaXB0Q29udGVudChxdWVyeS5maWxlUGF0aCkgfSk7XG59XG5leHBvcnRzLmRlYnVnTGFuZ3VhZ2VTZXJ2aWNlSG9zdFZlcnNpb24gPSBkZWJ1Z0xhbmd1YWdlU2VydmljZUhvc3RWZXJzaW9uO1xuZnVuY3Rpb24gZ2V0UHJvamVjdEZpbGVEZXRhaWxzKHF1ZXJ5KSB7XG4gICAgcHJvamVjdENhY2hlXzEuY29uc2lzdGVudFBhdGgocXVlcnkpO1xuICAgIHZhciBwcm9qZWN0ID0gcHJvamVjdENhY2hlXzEuZ2V0T3JDcmVhdGVQcm9qZWN0KHF1ZXJ5LmZpbGVQYXRoKTtcbiAgICByZXR1cm4gcmVzb2x2ZShwcm9qZWN0LnByb2plY3RGaWxlKTtcbn1cbmV4cG9ydHMuZ2V0UHJvamVjdEZpbGVEZXRhaWxzID0gZ2V0UHJvamVjdEZpbGVEZXRhaWxzO1xuZnVuY3Rpb24gc29ydE5hdmJhckl0ZW1zQnlTcGFuKGl0ZW1zKSB7XG4gICAgaXRlbXMuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYS5zcGFuc1swXS5zdGFydCAtIGIuc3BhbnNbMF0uc3RhcnQ7IH0pO1xuICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBpdGVtcy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgdmFyIGl0ZW0gPSBpdGVtc1tfaV07XG4gICAgICAgIGlmIChpdGVtLmNoaWxkSXRlbXMpIHtcbiAgICAgICAgICAgIHNvcnROYXZiYXJJdGVtc0J5U3BhbihpdGVtLmNoaWxkSXRlbXMpO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gZmxhdHRlbk5hdkJhckl0ZW1zKGl0ZW1zKSB7XG4gICAgdmFyIHRvcmV0dXJuID0gW107XG4gICAgZnVuY3Rpb24ga2VlcEFkZGluZyhpdGVtLCBkZXB0aCkge1xuICAgICAgICBpdGVtLmluZGVudCA9IGRlcHRoO1xuICAgICAgICB2YXIgY2hpbGRyZW4gPSBpdGVtLmNoaWxkSXRlbXM7XG4gICAgICAgIGRlbGV0ZSBpdGVtLmNoaWxkSXRlbXM7XG4gICAgICAgIHRvcmV0dXJuLnB1c2goaXRlbSk7XG4gICAgICAgIGlmIChjaGlsZHJlbikge1xuICAgICAgICAgICAgY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbiAoY2hpbGQpIHsgcmV0dXJuIGtlZXBBZGRpbmcoY2hpbGQsIGRlcHRoICsgMSk7IH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGl0ZW1zLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHsgcmV0dXJuIGtlZXBBZGRpbmcoaXRlbSwgMCk7IH0pO1xuICAgIHJldHVybiB0b3JldHVybjtcbn1cbmZ1bmN0aW9uIGdldE5hdmlnYXRpb25CYXJJdGVtcyhxdWVyeSkge1xuICAgIHByb2plY3RDYWNoZV8xLmNvbnNpc3RlbnRQYXRoKHF1ZXJ5KTtcbiAgICB2YXIgcHJvamVjdCA9IHByb2plY3RDYWNoZV8xLmdldE9yQ3JlYXRlUHJvamVjdChxdWVyeS5maWxlUGF0aCk7XG4gICAgdmFyIGxhbmd1YWdlU2VydmljZSA9IHByb2plY3QubGFuZ3VhZ2VTZXJ2aWNlO1xuICAgIHZhciBuYXZCYXJJdGVtcyA9IGxhbmd1YWdlU2VydmljZS5nZXROYXZpZ2F0aW9uQmFySXRlbXMocXVlcnkuZmlsZVBhdGgpO1xuICAgIGlmIChuYXZCYXJJdGVtcy5sZW5ndGggJiYgbmF2QmFySXRlbXNbMF0udGV4dCA9PSBcIjxnbG9iYWw+XCIpIHtcbiAgICAgICAgbmF2QmFySXRlbXMuc2hpZnQoKTtcbiAgICB9XG4gICAgc29ydE5hdmJhckl0ZW1zQnlTcGFuKG5hdkJhckl0ZW1zKTtcbiAgICBuYXZCYXJJdGVtcyA9IGZsYXR0ZW5OYXZCYXJJdGVtcyhuYXZCYXJJdGVtcyk7XG4gICAgdmFyIGl0ZW1zID0gbmF2QmFySXRlbXMubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgIGl0ZW0ucG9zaXRpb24gPSBwcm9qZWN0Lmxhbmd1YWdlU2VydmljZUhvc3QuZ2V0UG9zaXRpb25Gcm9tSW5kZXgocXVlcnkuZmlsZVBhdGgsIGl0ZW0uc3BhbnNbMF0uc3RhcnQpO1xuICAgICAgICBkZWxldGUgaXRlbS5zcGFucztcbiAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc29sdmUoeyBpdGVtczogaXRlbXMgfSk7XG59XG5leHBvcnRzLmdldE5hdmlnYXRpb25CYXJJdGVtcyA9IGdldE5hdmlnYXRpb25CYXJJdGVtcztcbmZ1bmN0aW9uIGdldE5hdmlnYXRlVG9JdGVtcyhxdWVyeSkge1xuICAgIHByb2plY3RDYWNoZV8xLmNvbnNpc3RlbnRQYXRoKHF1ZXJ5KTtcbiAgICB2YXIgcHJvamVjdCA9IHByb2plY3RDYWNoZV8xLmdldE9yQ3JlYXRlUHJvamVjdChxdWVyeS5maWxlUGF0aCk7XG4gICAgdmFyIGxhbmd1YWdlU2VydmljZSA9IHByb2plY3QubGFuZ3VhZ2VTZXJ2aWNlO1xuICAgIHZhciBnZXROb2RlS2luZCA9IHRzLmdldE5vZGVLaW5kO1xuICAgIGZ1bmN0aW9uIGdldERlY2xhcmF0aW9uTmFtZShkZWNsYXJhdGlvbikge1xuICAgICAgICB2YXIgcmVzdWx0ID0gZ2V0VGV4dE9mSWRlbnRpZmllck9yTGl0ZXJhbChkZWNsYXJhdGlvbi5uYW1lKTtcbiAgICAgICAgaWYgKHJlc3VsdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIGlmIChkZWNsYXJhdGlvbi5uYW1lLmtpbmQgPT09IDEzMykge1xuICAgICAgICAgICAgdmFyIGV4cHIgPSBkZWNsYXJhdGlvbi5uYW1lLmV4cHJlc3Npb247XG4gICAgICAgICAgICBpZiAoZXhwci5raW5kID09PSAxNjMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZXhwci5uYW1lLnRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZ2V0VGV4dE9mSWRlbnRpZmllck9yTGl0ZXJhbChleHByKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRUZXh0T2ZJZGVudGlmaWVyT3JMaXRlcmFsKG5vZGUpIHtcbiAgICAgICAgaWYgKG5vZGUua2luZCA9PT0gNjYgfHxcbiAgICAgICAgICAgIG5vZGUua2luZCA9PT0gOCB8fFxuICAgICAgICAgICAgbm9kZS5raW5kID09PSA3KSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZS50ZXh0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHZhciBpdGVtcyA9IFtdO1xuICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSBwcm9qZWN0LmdldFByb2plY3RTb3VyY2VGaWxlcygpOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICB2YXIgZmlsZSA9IF9hW19pXTtcbiAgICAgICAgdmFyIGRlY2xhcmF0aW9ucyA9IGZpbGUuZ2V0TmFtZWREZWNsYXJhdGlvbnMoKTtcbiAgICAgICAgZm9yICh2YXIgaW5kZXggaW4gZGVjbGFyYXRpb25zKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBfYiA9IDAsIF9jID0gZGVjbGFyYXRpb25zW2luZGV4XTsgX2IgPCBfYy5sZW5ndGg7IF9iKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgZGVjbGFyYXRpb24gPSBfY1tfYl07XG4gICAgICAgICAgICAgICAgdmFyIGl0ZW0gPSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IGdldERlY2xhcmF0aW9uTmFtZShkZWNsYXJhdGlvbiksXG4gICAgICAgICAgICAgICAgICAgIGtpbmQ6IGdldE5vZGVLaW5kKGRlY2xhcmF0aW9uKSxcbiAgICAgICAgICAgICAgICAgICAgZmlsZVBhdGg6IGZpbGUuZmlsZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGZpbGVOYW1lOiBwYXRoLmJhc2VuYW1lKGZpbGUuZmlsZU5hbWUpLFxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogcHJvamVjdC5sYW5ndWFnZVNlcnZpY2VIb3N0LmdldFBvc2l0aW9uRnJvbUluZGV4KGZpbGUuZmlsZU5hbWUsIGRlY2xhcmF0aW9uLmdldFN0YXJ0KCkpXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpdGVtcy5wdXNoKGl0ZW0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXNvbHZlKHsgaXRlbXM6IGl0ZW1zIH0pO1xufVxuZXhwb3J0cy5nZXROYXZpZ2F0ZVRvSXRlbXMgPSBnZXROYXZpZ2F0ZVRvSXRlbXM7XG5mdW5jdGlvbiBnZXRSZWZlcmVuY2VzKHF1ZXJ5KSB7XG4gICAgcHJvamVjdENhY2hlXzEuY29uc2lzdGVudFBhdGgocXVlcnkpO1xuICAgIHZhciBwcm9qZWN0ID0gcHJvamVjdENhY2hlXzEuZ2V0T3JDcmVhdGVQcm9qZWN0KHF1ZXJ5LmZpbGVQYXRoKTtcbiAgICB2YXIgbGFuZ3VhZ2VTZXJ2aWNlID0gcHJvamVjdC5sYW5ndWFnZVNlcnZpY2U7XG4gICAgdmFyIHJlZmVyZW5jZXMgPSBbXTtcbiAgICB2YXIgcmVmcyA9IGxhbmd1YWdlU2VydmljZS5nZXRSZWZlcmVuY2VzQXRQb3NpdGlvbihxdWVyeS5maWxlUGF0aCwgcXVlcnkucG9zaXRpb24pIHx8IFtdO1xuICAgIHJlZmVyZW5jZXMgPSByZWZzLm1hcChmdW5jdGlvbiAocikge1xuICAgICAgICB2YXIgcmVzID0gcHJvamVjdC5sYW5ndWFnZVNlcnZpY2VIb3N0LmdldFBvc2l0aW9uRnJvbVRleHRTcGFuV2l0aExpbmVQcmV2aWV3KHIuZmlsZU5hbWUsIHIudGV4dFNwYW4pO1xuICAgICAgICByZXR1cm4geyBmaWxlUGF0aDogci5maWxlTmFtZSwgcG9zaXRpb246IHJlcy5wb3NpdGlvbiwgcHJldmlldzogcmVzLnByZXZpZXcgfTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzb2x2ZSh7XG4gICAgICAgIHJlZmVyZW5jZXM6IHJlZmVyZW5jZXNcbiAgICB9KTtcbn1cbmV4cG9ydHMuZ2V0UmVmZXJlbmNlcyA9IGdldFJlZmVyZW5jZXM7XG52YXIgZ2V0UGF0aENvbXBsZXRpb25zXzEgPSByZXF1aXJlKFwiLi9tb2R1bGVzL2dldFBhdGhDb21wbGV0aW9uc1wiKTtcbmZ1bmN0aW9uIGZpbGVQYXRoV2l0aG91dEV4dGVuc2lvbihxdWVyeSkge1xuICAgIHZhciBiYXNlID0gcGF0aC5iYXNlbmFtZShxdWVyeSwgJy50cycpO1xuICAgIHJldHVybiBwYXRoLmRpcm5hbWUocXVlcnkpICsgJy8nICsgYmFzZTtcbn1cbmZ1bmN0aW9uIGdldFJlbGF0aXZlUGF0aHNJblByb2plY3QocXVlcnkpIHtcbiAgICBwcm9qZWN0Q2FjaGVfMS5jb25zaXN0ZW50UGF0aChxdWVyeSk7XG4gICAgdmFyIHByb2plY3QgPSBwcm9qZWN0Q2FjaGVfMS5nZXRPckNyZWF0ZVByb2plY3QocXVlcnkuZmlsZVBhdGgpO1xuICAgIHJldHVybiByZXNvbHZlKGdldFBhdGhDb21wbGV0aW9uc18xLmdldFBhdGhDb21wbGV0aW9ucyh7XG4gICAgICAgIHByb2plY3Q6IHByb2plY3QsXG4gICAgICAgIGZpbGVQYXRoOiBxdWVyeS5maWxlUGF0aCxcbiAgICAgICAgcHJlZml4OiBxdWVyeS5wcmVmaXgsXG4gICAgICAgIGluY2x1ZGVFeHRlcm5hbE1vZHVsZXM6IHF1ZXJ5LmluY2x1ZGVFeHRlcm5hbE1vZHVsZXNcbiAgICB9KSk7XG59XG5leHBvcnRzLmdldFJlbGF0aXZlUGF0aHNJblByb2plY3QgPSBnZXRSZWxhdGl2ZVBhdGhzSW5Qcm9qZWN0O1xudmFyIGFzdFRvVGV4dF8xID0gcmVxdWlyZShcIi4vbW9kdWxlcy9hc3RUb1RleHRcIik7XG5mdW5jdGlvbiBnZXRBU1QocXVlcnkpIHtcbiAgICBwcm9qZWN0Q2FjaGVfMS5jb25zaXN0ZW50UGF0aChxdWVyeSk7XG4gICAgdmFyIHByb2plY3QgPSBwcm9qZWN0Q2FjaGVfMS5nZXRPckNyZWF0ZVByb2plY3QocXVlcnkuZmlsZVBhdGgpO1xuICAgIHZhciBzZXJ2aWNlID0gcHJvamVjdC5sYW5ndWFnZVNlcnZpY2U7XG4gICAgdmFyIGZpbGVzID0gc2VydmljZS5nZXRQcm9ncmFtKCkuZ2V0U291cmNlRmlsZXMoKS5maWx0ZXIoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHguZmlsZU5hbWUgPT0gcXVlcnkuZmlsZVBhdGg7IH0pO1xuICAgIGlmICghZmlsZXMubGVuZ3RoKVxuICAgICAgICByZXNvbHZlKHt9KTtcbiAgICB2YXIgc291cmNlRmlsZSA9IGZpbGVzWzBdO1xuICAgIHZhciByb290ID0gYXN0VG9UZXh0XzEuYXN0VG9UZXh0KHNvdXJjZUZpbGUpO1xuICAgIHJldHVybiByZXNvbHZlKHsgcm9vdDogcm9vdCB9KTtcbn1cbmV4cG9ydHMuZ2V0QVNUID0gZ2V0QVNUO1xuZnVuY3Rpb24gZ2V0QVNURnVsbChxdWVyeSkge1xuICAgIHByb2plY3RDYWNoZV8xLmNvbnNpc3RlbnRQYXRoKHF1ZXJ5KTtcbiAgICB2YXIgcHJvamVjdCA9IHByb2plY3RDYWNoZV8xLmdldE9yQ3JlYXRlUHJvamVjdChxdWVyeS5maWxlUGF0aCk7XG4gICAgdmFyIHNlcnZpY2UgPSBwcm9qZWN0Lmxhbmd1YWdlU2VydmljZTtcbiAgICB2YXIgZmlsZXMgPSBzZXJ2aWNlLmdldFByb2dyYW0oKS5nZXRTb3VyY2VGaWxlcygpLmZpbHRlcihmdW5jdGlvbiAoeCkgeyByZXR1cm4geC5maWxlTmFtZSA9PSBxdWVyeS5maWxlUGF0aDsgfSk7XG4gICAgaWYgKCFmaWxlcy5sZW5ndGgpXG4gICAgICAgIHJlc29sdmUoe30pO1xuICAgIHZhciBzb3VyY2VGaWxlID0gZmlsZXNbMF07XG4gICAgdmFyIHJvb3QgPSBhc3RUb1RleHRfMS5hc3RUb1RleHRGdWxsKHNvdXJjZUZpbGUpO1xuICAgIHJldHVybiByZXNvbHZlKHsgcm9vdDogcm9vdCB9KTtcbn1cbmV4cG9ydHMuZ2V0QVNURnVsbCA9IGdldEFTVEZ1bGw7XG52YXIgcHJvZ3JhbURlcGVuZGVuY2llc18xID0gcmVxdWlyZShcIi4vbW9kdWxlcy9wcm9ncmFtRGVwZW5kZW5jaWVzXCIpO1xuZnVuY3Rpb24gZ2V0RGVwZW5kZW5jaWVzKHF1ZXJ5KSB7XG4gICAgcHJvamVjdENhY2hlXzEuY29uc2lzdGVudFBhdGgocXVlcnkpO1xuICAgIHZhciBwcm9qZWN0ID0gcHJvamVjdENhY2hlXzEuZ2V0T3JDcmVhdGVQcm9qZWN0KHF1ZXJ5LmZpbGVQYXRoKTtcbiAgICB2YXIgcHJvamVjdEZpbGUgPSBwcm9qZWN0LnByb2plY3RGaWxlO1xuICAgIHZhciBsaW5rcyA9IHByb2dyYW1EZXBlbmRlbmNpZXNfMS5kZWZhdWx0KHByb2plY3RGaWxlLCBwcm9qZWN0Lmxhbmd1YWdlU2VydmljZS5nZXRQcm9ncmFtKCkpO1xuICAgIHJldHVybiByZXNvbHZlKHsgbGlua3M6IGxpbmtzIH0pO1xufVxuZXhwb3J0cy5nZXREZXBlbmRlbmNpZXMgPSBnZXREZXBlbmRlbmNpZXM7XG52YXIgcWYgPSByZXF1aXJlKFwiLi9maXhteXRzL3F1aWNrRml4XCIpO1xudmFyIHF1aWNrRml4UmVnaXN0cnlfMSA9IHJlcXVpcmUoXCIuL2ZpeG15dHMvcXVpY2tGaXhSZWdpc3RyeVwiKTtcbmZ1bmN0aW9uIGdldEluZm9Gb3JRdWlja0ZpeEFuYWx5c2lzKHF1ZXJ5KSB7XG4gICAgcHJvamVjdENhY2hlXzEuY29uc2lzdGVudFBhdGgocXVlcnkpO1xuICAgIHZhciBwcm9qZWN0ID0gcHJvamVjdENhY2hlXzEuZ2V0T3JDcmVhdGVQcm9qZWN0KHF1ZXJ5LmZpbGVQYXRoKTtcbiAgICB2YXIgcHJvZ3JhbSA9IHByb2plY3QubGFuZ3VhZ2VTZXJ2aWNlLmdldFByb2dyYW0oKTtcbiAgICB2YXIgc291cmNlRmlsZSA9IHByb2dyYW0uZ2V0U291cmNlRmlsZShxdWVyeS5maWxlUGF0aCk7XG4gICAgdmFyIHNvdXJjZUZpbGVUZXh0ID0gc291cmNlRmlsZS5nZXRGdWxsVGV4dCgpO1xuICAgIHZhciBmaWxlRXJyb3JzID0gZ2V0RGlhZ25vc2l0Y3NCeUZpbGVQYXRoKHF1ZXJ5KTtcbiAgICB2YXIgcG9zaXRpb25FcnJvcnMgPSBmaWxlRXJyb3JzLmZpbHRlcihmdW5jdGlvbiAoZSkgeyByZXR1cm4gKChlLnN0YXJ0IC0gMSkgPCBxdWVyeS5wb3NpdGlvbikgJiYgKGUuc3RhcnQgKyBlLmxlbmd0aCArIDEpID4gcXVlcnkucG9zaXRpb247IH0pO1xuICAgIHZhciBwb3NpdGlvbkVycm9yTWVzc2FnZXMgPSBwb3NpdGlvbkVycm9ycy5tYXAoZnVuY3Rpb24gKGUpIHsgcmV0dXJuIHRzLmZsYXR0ZW5EaWFnbm9zdGljTWVzc2FnZVRleHQoZS5tZXNzYWdlVGV4dCwgb3MuRU9MKTsgfSk7XG4gICAgdmFyIHBvc2l0aW9uTm9kZSA9IHRzLmdldFRva2VuQXRQb3NpdGlvbihzb3VyY2VGaWxlLCBxdWVyeS5wb3NpdGlvbik7XG4gICAgdmFyIHNlcnZpY2UgPSBwcm9qZWN0Lmxhbmd1YWdlU2VydmljZTtcbiAgICB2YXIgdHlwZUNoZWNrZXIgPSBwcm9ncmFtLmdldFR5cGVDaGVja2VyKCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcHJvamVjdDogcHJvamVjdCxcbiAgICAgICAgcHJvZ3JhbTogcHJvZ3JhbSxcbiAgICAgICAgc291cmNlRmlsZTogc291cmNlRmlsZSxcbiAgICAgICAgc291cmNlRmlsZVRleHQ6IHNvdXJjZUZpbGVUZXh0LFxuICAgICAgICBmaWxlRXJyb3JzOiBmaWxlRXJyb3JzLFxuICAgICAgICBwb3NpdGlvbkVycm9yczogcG9zaXRpb25FcnJvcnMsXG4gICAgICAgIHBvc2l0aW9uRXJyb3JNZXNzYWdlczogcG9zaXRpb25FcnJvck1lc3NhZ2VzLFxuICAgICAgICBwb3NpdGlvbjogcXVlcnkucG9zaXRpb24sXG4gICAgICAgIHBvc2l0aW9uTm9kZTogcG9zaXRpb25Ob2RlLFxuICAgICAgICBzZXJ2aWNlOiBzZXJ2aWNlLFxuICAgICAgICB0eXBlQ2hlY2tlcjogdHlwZUNoZWNrZXIsXG4gICAgICAgIGZpbGVQYXRoOiBzb3VyY2VGaWxlLmZpbGVOYW1lXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGdldFF1aWNrRml4ZXMocXVlcnkpIHtcbiAgICBwcm9qZWN0Q2FjaGVfMS5jb25zaXN0ZW50UGF0aChxdWVyeSk7XG4gICAgdmFyIGluZm8gPSBnZXRJbmZvRm9yUXVpY2tGaXhBbmFseXNpcyhxdWVyeSk7XG4gICAgdmFyIGZpeGVzID0gcXVpY2tGaXhSZWdpc3RyeV8xLmFsbFF1aWNrRml4ZXNcbiAgICAgICAgLm1hcChmdW5jdGlvbiAoeCkge1xuICAgICAgICB2YXIgY2FuUHJvdmlkZSA9IHguY2FuUHJvdmlkZUZpeChpbmZvKTtcbiAgICAgICAgaWYgKCFjYW5Qcm92aWRlKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4geyBrZXk6IHgua2V5LCBkaXNwbGF5OiBjYW5Qcm92aWRlLmRpc3BsYXksIGlzTmV3VGV4dFNuaXBwZXQ6IGNhblByb3ZpZGUuaXNOZXdUZXh0U25pcHBldCB9O1xuICAgIH0pXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKHgpIHsgcmV0dXJuICEheDsgfSk7XG4gICAgcmV0dXJuIHJlc29sdmUoeyBmaXhlczogZml4ZXMgfSk7XG59XG5leHBvcnRzLmdldFF1aWNrRml4ZXMgPSBnZXRRdWlja0ZpeGVzO1xuZnVuY3Rpb24gYXBwbHlRdWlja0ZpeChxdWVyeSkge1xuICAgIHByb2plY3RDYWNoZV8xLmNvbnNpc3RlbnRQYXRoKHF1ZXJ5KTtcbiAgICB2YXIgZml4ID0gcXVpY2tGaXhSZWdpc3RyeV8xLmFsbFF1aWNrRml4ZXMuZmlsdGVyKGZ1bmN0aW9uICh4KSB7IHJldHVybiB4LmtleSA9PSBxdWVyeS5rZXk7IH0pWzBdO1xuICAgIHZhciBpbmZvID0gZ2V0SW5mb0ZvclF1aWNrRml4QW5hbHlzaXMocXVlcnkpO1xuICAgIHZhciByZXMgPSBmaXgucHJvdmlkZUZpeChpbmZvKTtcbiAgICB2YXIgcmVmYWN0b3JpbmdzID0gcWYuZ2V0UmVmYWN0b3JpbmdzQnlGaWxlUGF0aChyZXMpO1xuICAgIHJldHVybiByZXNvbHZlKHsgcmVmYWN0b3JpbmdzOiByZWZhY3RvcmluZ3MgfSk7XG59XG5leHBvcnRzLmFwcGx5UXVpY2tGaXggPSBhcHBseVF1aWNrRml4O1xudmFyIGJ1aWxkaW5nXzEgPSByZXF1aXJlKFwiLi9tb2R1bGVzL2J1aWxkaW5nXCIpO1xuZnVuY3Rpb24gZ2V0T3V0cHV0KHF1ZXJ5KSB7XG4gICAgcHJvamVjdENhY2hlXzEuY29uc2lzdGVudFBhdGgocXVlcnkpO1xuICAgIHZhciBwcm9qZWN0ID0gcHJvamVjdENhY2hlXzEuZ2V0T3JDcmVhdGVQcm9qZWN0KHF1ZXJ5LmZpbGVQYXRoKTtcbiAgICByZXR1cm4gcmVzb2x2ZSh7IG91dHB1dDogYnVpbGRpbmdfMS5nZXRSYXdPdXRwdXQocHJvamVjdCwgcXVlcnkuZmlsZVBhdGgpIH0pO1xufVxuZXhwb3J0cy5nZXRPdXRwdXQgPSBnZXRPdXRwdXQ7XG5mdW5jdGlvbiBnZXRPdXRwdXRKcyhxdWVyeSkge1xuICAgIHByb2plY3RDYWNoZV8xLmNvbnNpc3RlbnRQYXRoKHF1ZXJ5KTtcbiAgICB2YXIgcHJvamVjdCA9IHByb2plY3RDYWNoZV8xLmdldE9yQ3JlYXRlUHJvamVjdChxdWVyeS5maWxlUGF0aCk7XG4gICAgdmFyIG91dHB1dCA9IGJ1aWxkaW5nXzEuZ2V0UmF3T3V0cHV0KHByb2plY3QsIHF1ZXJ5LmZpbGVQYXRoKTtcbiAgICB2YXIganNGaWxlID0gb3V0cHV0Lm91dHB1dEZpbGVzLmZpbHRlcihmdW5jdGlvbiAoeCkgeyByZXR1cm4gcGF0aC5leHRuYW1lKHgubmFtZSkgPT0gXCIuanNcIjsgfSlbMF07XG4gICAgaWYgKCFqc0ZpbGUgfHwgb3V0cHV0LmVtaXRTa2lwcGVkKSB7XG4gICAgICAgIHJldHVybiByZXNvbHZlKHt9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiByZXNvbHZlKHsganNGaWxlUGF0aDoganNGaWxlLm5hbWUgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5nZXRPdXRwdXRKcyA9IGdldE91dHB1dEpzO1xuZnVuY3Rpb24gZ2V0T3V0cHV0SnNTdGF0dXMocXVlcnkpIHtcbiAgICBwcm9qZWN0Q2FjaGVfMS5jb25zaXN0ZW50UGF0aChxdWVyeSk7XG4gICAgdmFyIHByb2plY3QgPSBwcm9qZWN0Q2FjaGVfMS5nZXRPckNyZWF0ZVByb2plY3QocXVlcnkuZmlsZVBhdGgpO1xuICAgIHZhciBvdXRwdXQgPSBidWlsZGluZ18xLmdldFJhd091dHB1dChwcm9qZWN0LCBxdWVyeS5maWxlUGF0aCk7XG4gICAgaWYgKG91dHB1dC5lbWl0U2tpcHBlZCkge1xuICAgICAgICByZXR1cm4gcmVzb2x2ZSh7IGVtaXREaWZmZXJzOiB0cnVlIH0pO1xuICAgIH1cbiAgICB2YXIganNGaWxlID0gb3V0cHV0Lm91dHB1dEZpbGVzLmZpbHRlcihmdW5jdGlvbiAoeCkgeyByZXR1cm4gcGF0aC5leHRuYW1lKHgubmFtZSkgPT0gXCIuanNcIjsgfSlbMF07XG4gICAgaWYgKCFqc0ZpbGUpIHtcbiAgICAgICAgcmV0dXJuIHJlc29sdmUoeyBlbWl0RGlmZmVyczogZmFsc2UgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB2YXIgZW1pdERpZmZlcnMgPSAhZnMuZXhpc3RzU3luYyhqc0ZpbGUubmFtZSkgfHwgZnMucmVhZEZpbGVTeW5jKGpzRmlsZS5uYW1lKS50b1N0cmluZygpICE9PSBqc0ZpbGUudGV4dDtcbiAgICAgICAgcmV0dXJuIHJlc29sdmUoeyBlbWl0RGlmZmVyczogZW1pdERpZmZlcnMgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5nZXRPdXRwdXRKc1N0YXR1cyA9IGdldE91dHB1dEpzU3RhdHVzO1xuZnVuY3Rpb24gc29mdFJlc2V0KHF1ZXJ5KSB7XG4gICAgcHJvamVjdENhY2hlXzEucmVzZXRDYWNoZShxdWVyeSk7XG4gICAgcmV0dXJuIHJlc29sdmUoe30pO1xufVxuZXhwb3J0cy5zb2Z0UmVzZXQgPSBzb2Z0UmVzZXQ7XG52YXIgbW92ZUZpbGVzID0gcmVxdWlyZShcIi4vbW9kdWxlcy9tb3ZlRmlsZXNcIik7XG5mdW5jdGlvbiBnZXRSZW5hbWVGaWxlc1JlZmFjdG9yaW5ncyhxdWVyeSkge1xuICAgIHF1ZXJ5Lm9sZFBhdGggPSBmc3UuY29uc2lzdGVudFBhdGgocXVlcnkub2xkUGF0aCk7XG4gICAgcXVlcnkubmV3UGF0aCA9IGZzdS5jb25zaXN0ZW50UGF0aChxdWVyeS5uZXdQYXRoKTtcbiAgICB2YXIgcHJvamVjdCA9IHByb2plY3RDYWNoZV8xLmdldE9yQ3JlYXRlUHJvamVjdChxdWVyeS5vbGRQYXRoKTtcbiAgICB2YXIgcmVzID0gbW92ZUZpbGVzLmdldFJlbmFtZUZpbGVzUmVmYWN0b3JpbmdzKHByb2plY3QubGFuZ3VhZ2VTZXJ2aWNlLmdldFByb2dyYW0oKSwgcXVlcnkub2xkUGF0aCwgcXVlcnkubmV3UGF0aCk7XG4gICAgdmFyIHJlZmFjdG9yaW5ncyA9IHFmLmdldFJlZmFjdG9yaW5nc0J5RmlsZVBhdGgocmVzKTtcbiAgICByZXR1cm4gcmVzb2x2ZSh7IHJlZmFjdG9yaW5nczogcmVmYWN0b3JpbmdzIH0pO1xufVxuZXhwb3J0cy5nZXRSZW5hbWVGaWxlc1JlZmFjdG9yaW5ncyA9IGdldFJlbmFtZUZpbGVzUmVmYWN0b3JpbmdzO1xuZnVuY3Rpb24gY3JlYXRlUHJvamVjdChxdWVyeSkge1xuICAgIHByb2plY3RDYWNoZV8xLmNvbnNpc3RlbnRQYXRoKHF1ZXJ5KTtcbiAgICB2YXIgcHJvamVjdEZpbGUgPSB0c2NvbmZpZy5jcmVhdGVQcm9qZWN0Um9vdFN5bmMocXVlcnkuZmlsZVBhdGgpO1xuICAgIHByb2plY3RDYWNoZV8xLnF1ZXJ5UGFyZW50LnNldENvbmZpZ3VyYXRpb25FcnJvcih7IHByb2plY3RGaWxlUGF0aDogcXVlcnkuZmlsZVBhdGgsIGVycm9yOiBudWxsIH0pO1xuICAgIHJldHVybiByZXNvbHZlKHsgY3JlYXRlZEZpbGVQYXRoOiBwcm9qZWN0RmlsZS5wcm9qZWN0RmlsZVBhdGggfSk7XG59XG5leHBvcnRzLmNyZWF0ZVByb2plY3QgPSBjcmVhdGVQcm9qZWN0O1xuIl19