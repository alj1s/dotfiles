var fsu = require('../utils/fsUtil');
var simpleValidator = require('./simpleValidator');
var stripBom = require('strip-bom');
var types = simpleValidator.types;
var compilerOptionsValidation = {
    allowNonTsExtensions: { type: simpleValidator.types.boolean },
    charset: { type: simpleValidator.types.string },
    codepage: { type: types.number },
    declaration: { type: types.boolean },
    diagnostics: { type: types.boolean },
    emitBOM: { type: types.boolean },
    experimentalAsyncFunctions: { type: types.boolean },
    experimentalDecorators: { type: types.boolean },
    emitDecoratorMetadata: { type: types.boolean },
    help: { type: types.boolean },
    inlineSourceMap: { type: types.boolean },
    inlineSources: { type: types.boolean },
    isolatedModules: { type: types.boolean },
    jsx: { type: types.string, validValues: ['preserve', 'react'] },
    locals: { type: types.string },
    mapRoot: { type: types.string },
    module: { type: types.string, validValues: ['commonjs', 'amd', 'system', 'umd'] },
    noEmit: { type: types.boolean },
    noEmitHelpers: { type: types.boolean },
    noEmitOnError: { type: types.boolean },
    noErrorTruncation: { type: types.boolean },
    noImplicitAny: { type: types.boolean },
    noLib: { type: types.boolean },
    noLibCheck: { type: types.boolean },
    noResolve: { type: types.boolean },
    out: { type: types.string },
    outDir: { type: types.string },
    preserveConstEnums: { type: types.boolean },
    removeComments: { type: types.boolean },
    rootDir: { type: types.string },
    sourceMap: { type: types.boolean },
    sourceRoot: { type: types.string },
    suppressImplicitAnyIndexErrors: { type: types.boolean },
    target: { type: types.string, validValues: ['es3', 'es5', 'es6'] },
    version: { type: types.boolean },
    watch: { type: types.boolean }
};
var validator = new simpleValidator.SimpleValidator(compilerOptionsValidation);
exports.errors = {
    GET_PROJECT_INVALID_PATH: 'Invalid Path',
    GET_PROJECT_NO_PROJECT_FOUND: 'No Project Found',
    GET_PROJECT_FAILED_TO_OPEN_PROJECT_FILE: 'Failed to fs.readFileSync the project file',
    GET_PROJECT_JSON_PARSE_FAILED: 'Failed to JSON.parse the project file',
    GET_PROJECT_GLOB_EXPAND_FAILED: 'Failed to expand filesGlob in the project file',
    GET_PROJECT_PROJECT_FILE_INVALID_OPTIONS: 'Project file contains invalid options',
    CREATE_FILE_MUST_EXIST: 'The Typescript file must exist on disk in order to create a project',
    CREATE_PROJECT_ALREADY_EXISTS: 'Project file already exists'
};
function errorWithDetails(error, details) {
    error.details = details;
    return error;
}
var fs = require('fs');
var path = require('path');
var expand = require('glob-expand');
var os = require('os');
var formatting = require('./formatting');
var projectFileName = 'tsconfig.json';
var defaultFilesGlob = ['./**/*.ts', './**/*.tsx', '!./node_modules/**/*'];
var invisibleFilesGlob = ['./**/*.ts'];
var typeScriptVersion = '1.5.0-beta';
exports.defaults = {
    target: 1,
    module: 1,
    isolatedModules: false,
    jsx: 2,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
    declaration: false,
    noImplicitAny: false,
    removeComments: true,
    noLib: false,
    preserveConstEnums: true,
    suppressImplicitAnyIndexErrors: true
};
var typescriptEnumMap = {
    target: {
        'es3': 0,
        'es5': 1,
        'es6': 2,
        'latest': 2
    },
    module: {
        'none': 0,
        'commonjs': 1,
        'amd': 2,
        'system': 4,
        'umd': 3
    },
    jsx: {
        'preserve': 1,
        'react': 2
    }
};
var jsonEnumMap = {};
Object.keys(typescriptEnumMap).forEach(function (name) {
    jsonEnumMap[name] = reverseKeysAndValues(typescriptEnumMap[name]);
});
function mixin(target, source) {
    for (var key in source) {
        target[key] = source[key];
    }
    return target;
}
function rawToTsCompilerOptions(jsonOptions, projectDir) {
    var compilerOptions = mixin({}, exports.defaults);
    for (var key in jsonOptions) {
        if (typescriptEnumMap[key]) {
            compilerOptions[key] = typescriptEnumMap[key][jsonOptions[key].toLowerCase()];
        } else {
            compilerOptions[key] = jsonOptions[key];
        }
    }
    if (compilerOptions.outDir !== undefined) {
        compilerOptions.outDir = path.resolve(projectDir, compilerOptions.outDir);
    }
    if (compilerOptions.rootDir !== undefined) {
        compilerOptions.rootDir = path.resolve(projectDir, compilerOptions.rootDir);
    }
    if (compilerOptions.out !== undefined) {
        compilerOptions.out = path.resolve(projectDir, compilerOptions.out);
    }
    return compilerOptions;
}
function tsToRawCompilerOptions(compilerOptions) {
    var jsonOptions = mixin({}, compilerOptions);
    Object.keys(compilerOptions).forEach(function (key) {
        if (jsonEnumMap[key] && compilerOptions[key]) {
            var value = compilerOptions[key];
            jsonOptions[key] = jsonEnumMap[key][value];
        }
    });
    return jsonOptions;
}
function getDefaultInMemoryProject(srcFile) {
    var dir = fs.lstatSync(srcFile).isDirectory() ? srcFile : path.dirname(srcFile);
    var files = [srcFile];
    var typings = getDefinitionsForNodeModules(dir, files);
    files = increaseProjectForReferenceAndImports(files);
    files = uniq(files.map(fsu.consistentPath));
    var project = {
        compilerOptions: exports.defaults,
        files: files,
        typings: typings.ours.concat(typings.implicit),
        formatCodeOptions: formatting.defaultFormatCodeOptions(),
        compileOnSave: true
    };
    return {
        projectFileDirectory: dir,
        projectFilePath: dir + '/' + projectFileName,
        project: project,
        inMemory: true
    };
}
exports.getDefaultInMemoryProject = getDefaultInMemoryProject;
function getProjectSync(pathOrSrcFile) {
    if (!fs.existsSync(pathOrSrcFile)) {
        throw new Error(exports.errors.GET_PROJECT_INVALID_PATH);
    }
    var dir = fs.lstatSync(pathOrSrcFile).isDirectory() ? pathOrSrcFile : path.dirname(pathOrSrcFile);
    var projectFile = '';
    try {
        projectFile = travelUpTheDirectoryTreeTillYouFind(dir, projectFileName);
    } catch (e) {
        var err = e;
        if (err.message == 'not found') {
            throw errorWithDetails(new Error(exports.errors.GET_PROJECT_NO_PROJECT_FOUND), { projectFilePath: fsu.consistentPath(pathOrSrcFile), errorMessage: err.message });
        }
    }
    projectFile = path.normalize(projectFile);
    var projectFileDirectory = path.dirname(projectFile) + path.sep;
    var projectSpec;
    try {
        var projectFileTextContent = fs.readFileSync(projectFile, 'utf8');
    } catch (ex) {
        throw new Error(exports.errors.GET_PROJECT_FAILED_TO_OPEN_PROJECT_FILE);
    }
    try {
        projectSpec = JSON.parse(stripBom(projectFileTextContent));
    } catch (ex) {
        throw errorWithDetails(new Error(exports.errors.GET_PROJECT_JSON_PARSE_FAILED), { projectFilePath: fsu.consistentPath(projectFile), error: ex.message });
    }
    if (!projectSpec.compilerOptions) projectSpec.compilerOptions = {};
    var cwdPath = path.relative(process.cwd(), path.dirname(projectFile));
    if (!projectSpec.files && !projectSpec.filesGlob) {
        var toExpand = invisibleFilesGlob;
    }
    if (projectSpec.filesGlob) {
        var toExpand = projectSpec.filesGlob;
    }
    if (toExpand) {
        try {
            projectSpec.files = expand({ filter: 'isFile', cwd: cwdPath }, toExpand);
        } catch (ex) {
            throw errorWithDetails(new Error(exports.errors.GET_PROJECT_GLOB_EXPAND_FAILED), { glob: projectSpec.filesGlob, projectFilePath: fsu.consistentPath(projectFile), errorMessage: ex.message });
        }
    }
    if (projectSpec.filesGlob) {
        var prettyJSONProjectSpec = prettyJSON(projectSpec);
        if (prettyJSONProjectSpec !== projectFileTextContent) {
            fs.writeFileSync(projectFile, prettyJSON(projectSpec));
        }
    }
    projectSpec.files = projectSpec.files.map(function (file) {
        return path.resolve(projectFileDirectory, file);
    });
    var pkg = null;
    try {
        var packagePath = travelUpTheDirectoryTreeTillYouFind(projectFileDirectory, 'package.json');
        if (packagePath) {
            var packageJSONPath = getPotentiallyRelativeFile(projectFileDirectory, packagePath);
            var parsedPackage = JSON.parse(fs.readFileSync(packageJSONPath).toString());
            pkg = {
                main: parsedPackage.main,
                name: parsedPackage.name,
                directory: path.dirname(packageJSONPath),
                definition: parsedPackage.typescript && parsedPackage.typescript.definition
            };
        }
    } catch (ex) {}
    var project = {
        compilerOptions: {},
        files: projectSpec.files,
        filesGlob: projectSpec.filesGlob,
        formatCodeOptions: formatting.makeFormatCodeOptions(projectSpec.formatCodeOptions),
        compileOnSave: projectSpec.compileOnSave == undefined ? true : projectSpec.compileOnSave,
        'package': pkg,
        typings: []
    };
    var validationResult = validator.validate(projectSpec.compilerOptions);
    if (validationResult.errorMessage) {
        throw errorWithDetails(new Error(exports.errors.GET_PROJECT_PROJECT_FILE_INVALID_OPTIONS), { projectFilePath: fsu.consistentPath(projectFile), errorMessage: validationResult.errorMessage });
    }
    project.compilerOptions = rawToTsCompilerOptions(projectSpec.compilerOptions, projectFileDirectory);
    project.files = increaseProjectForReferenceAndImports(project.files);
    var typings = getDefinitionsForNodeModules(dir, project.files);
    project.files = project.files.concat(typings.implicit);
    project.typings = typings.ours.concat(typings.implicit);
    project.files = uniq(project.files.map(fsu.consistentPath));
    projectFileDirectory = removeTrailingSlash(fsu.consistentPath(projectFileDirectory));
    return {
        projectFileDirectory: projectFileDirectory,
        projectFilePath: projectFileDirectory + '/' + projectFileName,
        project: project,
        inMemory: false
    };
}
exports.getProjectSync = getProjectSync;
function createProjectRootSync(srcFile, defaultOptions) {
    if (!fs.existsSync(srcFile)) {
        throw new Error(exports.errors.CREATE_FILE_MUST_EXIST);
    }
    var dir = fs.lstatSync(srcFile).isDirectory() ? srcFile : path.dirname(srcFile);
    var projectFilePath = path.normalize(dir + '/' + projectFileName);
    if (fs.existsSync(projectFilePath)) throw new Error(exports.errors.CREATE_PROJECT_ALREADY_EXISTS);
    var projectSpec = {};
    projectSpec.version = typeScriptVersion;
    projectSpec.compilerOptions = tsToRawCompilerOptions(defaultOptions || exports.defaults);
    projectSpec.filesGlob = defaultFilesGlob;
    fs.writeFileSync(projectFilePath, prettyJSON(projectSpec));
    return getProjectSync(srcFile);
}
exports.createProjectRootSync = createProjectRootSync;
function increaseProjectForReferenceAndImports(files) {
    var filesMap = simpleValidator.createMap(files);
    var willNeedMoreAnalysis = function willNeedMoreAnalysis(file) {
        if (!filesMap[file]) {
            filesMap[file] = true;
            files.push(file);
            return true;
        } else {
            return false;
        }
    };
    var getReferencedOrImportedFiles = function getReferencedOrImportedFiles(files) {
        var referenced = [];
        files.forEach(function (file) {
            try {
                var content = fs.readFileSync(file).toString();
            } catch (ex) {
                return;
            }
            var preProcessedFileInfo = ts.preProcessFile(content, true),
                dir = path.dirname(file);
            referenced.push(preProcessedFileInfo.referencedFiles.map(function (fileReference) {
                var file = path.resolve(dir, fsu.consistentPath(fileReference.fileName));
                if (fs.existsSync(file)) {
                    return file;
                }
                if (fs.existsSync(file + '.ts')) {
                    return file + '.ts';
                }
                if (fs.existsSync(file + '.d.ts')) {
                    return file + '.d.ts';
                }
                return null;
            }).filter(function (file) {
                return !!file;
            }).concat(preProcessedFileInfo.importedFiles.filter(function (fileReference) {
                return pathIsRelative(fileReference.fileName);
            }).map(function (fileReference) {
                var file = path.resolve(dir, fileReference.fileName + '.ts');
                if (!fs.existsSync(file)) {
                    file = path.resolve(dir, fileReference.fileName + '.d.ts');
                }
                return file;
            })));
        });
        return selectMany(referenced);
    };
    var more = getReferencedOrImportedFiles(files).filter(willNeedMoreAnalysis);
    while (more.length) {
        more = getReferencedOrImportedFiles(files).filter(willNeedMoreAnalysis);
    }
    return files;
}
function getDefinitionsForNodeModules(projectDir, files) {
    function versionStringToNumber(version) {
        var _a = version.split('.'),
            maj = _a[0],
            min = _a[1],
            patch = _a[2];
        return parseInt(maj) * 1000000 + parseInt(min);
    }
    var typings = {};
    var ourTypings = files.filter(function (f) {
        return path.basename(path.dirname(f)) == 'typings' && endsWith(f, '.d.ts') || path.basename(path.dirname(path.dirname(f))) == 'typings' && endsWith(f, '.d.ts');
    });
    ourTypings.forEach(function (f) {
        return typings[path.basename(f)] = { filePath: f, version: Infinity };
    });
    var existing = createMap(files.map(fsu.consistentPath));
    function addAllReferencedFilesWithMaxVersion(file) {
        var dir = path.dirname(file);
        try {
            var content = fs.readFileSync(file).toString();
        } catch (ex) {
            return;
        }
        var preProcessedFileInfo = ts.preProcessFile(content, true);
        var files = preProcessedFileInfo.referencedFiles.map(function (fileReference) {
            var file = path.resolve(dir, fileReference.fileName);
            if (fs.existsSync(file)) {
                return file;
            }
            if (fs.existsSync(file + '.d.ts')) {
                return file + '.d.ts';
            }
        }).filter(function (f) {
            return !!f;
        });
        files = files.filter(function (f) {
            return !typings[path.basename(f)] || typings[path.basename(f)].version > Infinity;
        });
        files.forEach(function (f) {
            return typings[path.basename(f)] = { filePath: f, version: Infinity };
        });
        files.forEach(function (f) {
            return addAllReferencedFilesWithMaxVersion(f);
        });
    }
    try {
        var node_modules = travelUpTheDirectoryTreeTillYouFind(projectDir, 'node_modules', true);
        var moduleDirs = getDirs(node_modules);
        for (var _i = 0; _i < moduleDirs.length; _i++) {
            var moduleDir = moduleDirs[_i];
            try {
                var package_json = JSON.parse(fs.readFileSync(moduleDir + '/package.json').toString());
            } catch (ex) {
                continue;
            }
            if (package_json.typescript && package_json.typescript.definition) {
                var file = path.resolve(moduleDir, './', package_json.typescript.definition);
                typings[path.basename(file)] = {
                    filePath: file,
                    version: Infinity
                };
                addAllReferencedFilesWithMaxVersion(file);
            }
        }
    } catch (ex) {
        if (ex.message == 'not found') {} else {
            console.error('Failed to read package.json from node_modules due to error:', ex, ex.stack);
        }
    }
    var all = Object.keys(typings).map(function (typing) {
        return typings[typing].filePath;
    }).map(function (x) {
        return fsu.consistentPath(x);
    });
    var implicit = all.filter(function (x) {
        return !existing[x];
    });
    var ours = all.filter(function (x) {
        return existing[x];
    });
    return { implicit: implicit, ours: ours };
}
function prettyJSON(object) {
    var cache = [];
    var value = JSON.stringify(object, function (key, value) {
        if (typeof value === 'object' && value !== null) {
            if (cache.indexOf(value) !== -1) {
                return;
            }
            cache.push(value);
        }
        return value;
    }, 4);
    value = value.split('\n').join(os.EOL) + os.EOL;
    cache = null;
    return value;
}
exports.prettyJSON = prettyJSON;
function pathIsRelative(str) {
    if (!str.length) return false;
    return str[0] == '.' || str.substring(0, 2) == './' || str.substring(0, 3) == '../';
}
exports.pathIsRelative = pathIsRelative;
function selectMany(arr) {
    var result = [];
    for (var i = 0; i < arr.length; i++) {
        for (var j = 0; j < arr[i].length; j++) {
            result.push(arr[i][j]);
        }
    }
    return result;
}
function endsWith(str, suffix) {
    return str && str.indexOf(suffix, str.length - suffix.length) !== -1;
}
exports.endsWith = endsWith;
function uniq(arr) {
    var map = simpleValidator.createMap(arr);
    return Object.keys(map);
}
function makeRelativePath(relativeFolder, filePath) {
    var relativePath = path.relative(relativeFolder, filePath).split('\\').join('/');
    if (relativePath[0] !== '.') {
        relativePath = './' + relativePath;
    }
    return relativePath;
}
exports.makeRelativePath = makeRelativePath;
function removeExt(filePath) {
    return filePath.substr(0, filePath.lastIndexOf('.'));
}
exports.removeExt = removeExt;
function removeTrailingSlash(filePath) {
    if (!filePath) return filePath;
    if (endsWith(filePath, '/')) return filePath.substr(0, filePath.length - 1);
    return filePath;
}
exports.removeTrailingSlash = removeTrailingSlash;
function travelUpTheDirectoryTreeTillYouFind(dir, fileOrDirectory, abortIfInside) {
    if (abortIfInside === void 0) {
        abortIfInside = false;
    }
    while (fs.existsSync(dir)) {
        var potentialFile = dir + '/' + fileOrDirectory;
        if (before == potentialFile) {
            if (abortIfInside) {
                throw new Error('not found');
            }
        }
        if (fs.existsSync(potentialFile)) {
            return potentialFile;
        } else {
            var before = dir;
            dir = path.dirname(dir);
            if (dir == before) throw new Error('not found');
        }
    }
}
exports.travelUpTheDirectoryTreeTillYouFind = travelUpTheDirectoryTreeTillYouFind;
function getPotentiallyRelativeFile(basePath, filePath) {
    if (pathIsRelative(filePath)) {
        return fsu.consistentPath(path.resolve(basePath, filePath));
    }
    return fsu.consistentPath(filePath);
}
exports.getPotentiallyRelativeFile = getPotentiallyRelativeFile;
function getDirs(rootDir) {
    var files = fs.readdirSync(rootDir);
    var dirs = [];
    for (var _i = 0; _i < files.length; _i++) {
        var file = files[_i];
        if (file[0] != '.') {
            var filePath = rootDir + '/' + file;
            var stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                dirs.push(filePath);
            }
        }
    }
    return dirs;
}
function createMap(arr) {
    return arr.reduce(function (result, key) {
        result[key] = true;
        return result;
    }, {});
}
exports.createMap = createMap;
function reverseKeysAndValues(obj) {
    var toret = {};
    Object.keys(obj).forEach(function (key) {
        toret[obj[key]] = key;
    });
    return toret;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9hdG9tLXR5cGVzY3JpcHQvZGlzdC9tYWluL3RzY29uZmlnL3RzY29uZmlnLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQ3JDLElBQUksZUFBZSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0FBQ25ELElBQUksUUFBUSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUNwQyxJQUFJLEtBQUssR0FBRyxlQUFlLENBQUMsS0FBSyxDQUFDO0FBQ2xDLElBQUkseUJBQXlCLEdBQUc7QUFDNUIsd0JBQW9CLEVBQUUsRUFBRSxJQUFJLEVBQUUsZUFBZSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUU7QUFDN0QsV0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLGVBQWUsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFO0FBQy9DLFlBQVEsRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsTUFBTSxFQUFFO0FBQ2hDLGVBQVcsRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFO0FBQ3BDLGVBQVcsRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFO0FBQ3BDLFdBQU8sRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFO0FBQ2hDLDhCQUEwQixFQUFFLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxPQUFPLEVBQUU7QUFDbkQsMEJBQXNCLEVBQUUsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLE9BQU8sRUFBRTtBQUMvQyx5QkFBcUIsRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFO0FBQzlDLFFBQUksRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFO0FBQzdCLG1CQUFlLEVBQUUsRUFBRSxJQUFJ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cEIsb0JBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDdkI7U0FDSjtLQUNKO0FBQ0QsV0FBTyxJQUFJLENBQUM7Q0FDZjtBQUNELFNBQVMsU0FBUyxDQUFDLEdBQUcsRUFBRTtBQUNwQixXQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsVUFBVSxNQUFNLEVBQUUsR0FBRyxFQUFFO0FBQ3JDLGNBQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUM7QUFDbkIsZUFBTyxNQUFNLENBQUM7S0FDakIsRUFBRSxFQUFFLENBQUMsQ0FBQztDQUNWO0FBQ0QsT0FBTyxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7QUFDOUIsU0FBUyxvQkFBb0IsQ0FBQyxHQUFHLEVBQUU7QUFDL0IsUUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ2YsVUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBVSxHQUFHLEVBQUU7QUFDcEMsYUFBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztLQUN6QixDQUFDLENBQUM7QUFDSCxXQUFPLEtBQUssQ0FBQztDQUNoQiIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvYXRvbS10eXBlc2NyaXB0L2Rpc3QvbWFpbi90c2NvbmZpZy90c2NvbmZpZy5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBmc3UgPSByZXF1aXJlKFwiLi4vdXRpbHMvZnNVdGlsXCIpO1xudmFyIHNpbXBsZVZhbGlkYXRvciA9IHJlcXVpcmUoJy4vc2ltcGxlVmFsaWRhdG9yJyk7XG52YXIgc3RyaXBCb20gPSByZXF1aXJlKCdzdHJpcC1ib20nKTtcbnZhciB0eXBlcyA9IHNpbXBsZVZhbGlkYXRvci50eXBlcztcbnZhciBjb21waWxlck9wdGlvbnNWYWxpZGF0aW9uID0ge1xuICAgIGFsbG93Tm9uVHNFeHRlbnNpb25zOiB7IHR5cGU6IHNpbXBsZVZhbGlkYXRvci50eXBlcy5ib29sZWFuIH0sXG4gICAgY2hhcnNldDogeyB0eXBlOiBzaW1wbGVWYWxpZGF0b3IudHlwZXMuc3RyaW5nIH0sXG4gICAgY29kZXBhZ2U6IHsgdHlwZTogdHlwZXMubnVtYmVyIH0sXG4gICAgZGVjbGFyYXRpb246IHsgdHlwZTogdHlwZXMuYm9vbGVhbiB9LFxuICAgIGRpYWdub3N0aWNzOiB7IHR5cGU6IHR5cGVzLmJvb2xlYW4gfSxcbiAgICBlbWl0Qk9NOiB7IHR5cGU6IHR5cGVzLmJvb2xlYW4gfSxcbiAgICBleHBlcmltZW50YWxBc3luY0Z1bmN0aW9uczogeyB0eXBlOiB0eXBlcy5ib29sZWFuIH0sXG4gICAgZXhwZXJpbWVudGFsRGVjb3JhdG9yczogeyB0eXBlOiB0eXBlcy5ib29sZWFuIH0sXG4gICAgZW1pdERlY29yYXRvck1ldGFkYXRhOiB7IHR5cGU6IHR5cGVzLmJvb2xlYW4gfSxcbiAgICBoZWxwOiB7IHR5cGU6IHR5cGVzLmJvb2xlYW4gfSxcbiAgICBpbmxpbmVTb3VyY2VNYXA6IHsgdHlwZTogdHlwZXMuYm9vbGVhbiB9LFxuICAgIGlubGluZVNvdXJjZXM6IHsgdHlwZTogdHlwZXMuYm9vbGVhbiB9LFxuICAgIGlzb2xhdGVkTW9kdWxlczogeyB0eXBlOiB0eXBlcy5ib29sZWFuIH0sXG4gICAganN4OiB7IHR5cGU6IHR5cGVzLnN0cmluZywgdmFsaWRWYWx1ZXM6IFsncHJlc2VydmUnLCAncmVhY3QnXSB9LFxuICAgIGxvY2FsczogeyB0eXBlOiB0eXBlcy5zdHJpbmcgfSxcbiAgICBtYXBSb290OiB7IHR5cGU6IHR5cGVzLnN0cmluZyB9LFxuICAgIG1vZHVsZTogeyB0eXBlOiB0eXBlcy5zdHJpbmcsIHZhbGlkVmFsdWVzOiBbJ2NvbW1vbmpzJywgJ2FtZCcsICdzeXN0ZW0nLCAndW1kJ10gfSxcbiAgICBub0VtaXQ6IHsgdHlwZTogdHlwZXMuYm9vbGVhbiB9LFxuICAgIG5vRW1pdEhlbHBlcnM6IHsgdHlwZTogdHlwZXMuYm9vbGVhbiB9LFxuICAgIG5vRW1pdE9uRXJyb3I6IHsgdHlwZTogdHlwZXMuYm9vbGVhbiB9LFxuICAgIG5vRXJyb3JUcnVuY2F0aW9uOiB7IHR5cGU6IHR5cGVzLmJvb2xlYW4gfSxcbiAgICBub0ltcGxpY2l0QW55OiB7IHR5cGU6IHR5cGVzLmJvb2xlYW4gfSxcbiAgICBub0xpYjogeyB0eXBlOiB0eXBlcy5ib29sZWFuIH0sXG4gICAgbm9MaWJDaGVjazogeyB0eXBlOiB0eXBlcy5ib29sZWFuIH0sXG4gICAgbm9SZXNvbHZlOiB7IHR5cGU6IHR5cGVzLmJvb2xlYW4gfSxcbiAgICBvdXQ6IHsgdHlwZTogdHlwZXMuc3RyaW5nIH0sXG4gICAgb3V0RGlyOiB7IHR5cGU6IHR5cGVzLnN0cmluZyB9LFxuICAgIHByZXNlcnZlQ29uc3RFbnVtczogeyB0eXBlOiB0eXBlcy5ib29sZWFuIH0sXG4gICAgcmVtb3ZlQ29tbWVudHM6IHsgdHlwZTogdHlwZXMuYm9vbGVhbiB9LFxuICAgIHJvb3REaXI6IHsgdHlwZTogdHlwZXMuc3RyaW5nIH0sXG4gICAgc291cmNlTWFwOiB7IHR5cGU6IHR5cGVzLmJvb2xlYW4gfSxcbiAgICBzb3VyY2VSb290OiB7IHR5cGU6IHR5cGVzLnN0cmluZyB9LFxuICAgIHN1cHByZXNzSW1wbGljaXRBbnlJbmRleEVycm9yczogeyB0eXBlOiB0eXBlcy5ib29sZWFuIH0sXG4gICAgdGFyZ2V0OiB7IHR5cGU6IHR5cGVzLnN0cmluZywgdmFsaWRWYWx1ZXM6IFsnZXMzJywgJ2VzNScsICdlczYnXSB9LFxuICAgIHZlcnNpb246IHsgdHlwZTogdHlwZXMuYm9vbGVhbiB9LFxuICAgIHdhdGNoOiB7IHR5cGU6IHR5cGVzLmJvb2xlYW4gfSxcbn07XG52YXIgdmFsaWRhdG9yID0gbmV3IHNpbXBsZVZhbGlkYXRvci5TaW1wbGVWYWxpZGF0b3IoY29tcGlsZXJPcHRpb25zVmFsaWRhdGlvbik7XG5leHBvcnRzLmVycm9ycyA9IHtcbiAgICBHRVRfUFJPSkVDVF9JTlZBTElEX1BBVEg6ICdJbnZhbGlkIFBhdGgnLFxuICAgIEdFVF9QUk9KRUNUX05PX1BST0pFQ1RfRk9VTkQ6ICdObyBQcm9qZWN0IEZvdW5kJyxcbiAgICBHRVRfUFJPSkVDVF9GQUlMRURfVE9fT1BFTl9QUk9KRUNUX0ZJTEU6ICdGYWlsZWQgdG8gZnMucmVhZEZpbGVTeW5jIHRoZSBwcm9qZWN0IGZpbGUnLFxuICAgIEdFVF9QUk9KRUNUX0pTT05fUEFSU0VfRkFJTEVEOiAnRmFpbGVkIHRvIEpTT04ucGFyc2UgdGhlIHByb2plY3QgZmlsZScsXG4gICAgR0VUX1BST0pFQ1RfR0xPQl9FWFBBTkRfRkFJTEVEOiAnRmFpbGVkIHRvIGV4cGFuZCBmaWxlc0dsb2IgaW4gdGhlIHByb2plY3QgZmlsZScsXG4gICAgR0VUX1BST0pFQ1RfUFJPSkVDVF9GSUxFX0lOVkFMSURfT1BUSU9OUzogJ1Byb2plY3QgZmlsZSBjb250YWlucyBpbnZhbGlkIG9wdGlvbnMnLFxuICAgIENSRUFURV9GSUxFX01VU1RfRVhJU1Q6ICdUaGUgVHlwZXNjcmlwdCBmaWxlIG11c3QgZXhpc3Qgb24gZGlzayBpbiBvcmRlciB0byBjcmVhdGUgYSBwcm9qZWN0JyxcbiAgICBDUkVBVEVfUFJPSkVDVF9BTFJFQURZX0VYSVNUUzogJ1Byb2plY3QgZmlsZSBhbHJlYWR5IGV4aXN0cycsXG59O1xuZnVuY3Rpb24gZXJyb3JXaXRoRGV0YWlscyhlcnJvciwgZGV0YWlscykge1xuICAgIGVycm9yLmRldGFpbHMgPSBkZXRhaWxzO1xuICAgIHJldHVybiBlcnJvcjtcbn1cbnZhciBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG52YXIgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbnZhciBleHBhbmQgPSByZXF1aXJlKCdnbG9iLWV4cGFuZCcpO1xudmFyIG9zID0gcmVxdWlyZSgnb3MnKTtcbnZhciBmb3JtYXR0aW5nID0gcmVxdWlyZSgnLi9mb3JtYXR0aW5nJyk7XG52YXIgcHJvamVjdEZpbGVOYW1lID0gJ3RzY29uZmlnLmpzb24nO1xudmFyIGRlZmF1bHRGaWxlc0dsb2IgPSBbXG4gICAgXCIuLyoqLyoudHNcIixcbiAgICBcIi4vKiovKi50c3hcIixcbiAgICBcIiEuL25vZGVfbW9kdWxlcy8qKi8qXCIsXG5dO1xudmFyIGludmlzaWJsZUZpbGVzR2xvYiA9IFtcIi4vKiovKi50c1wiXTtcbnZhciB0eXBlU2NyaXB0VmVyc2lvbiA9ICcxLjUuMC1iZXRhJztcbmV4cG9ydHMuZGVmYXVsdHMgPSB7XG4gICAgdGFyZ2V0OiAxLFxuICAgIG1vZHVsZTogMSxcbiAgICBpc29sYXRlZE1vZHVsZXM6IGZhbHNlLFxuICAgIGpzeDogMixcbiAgICBleHBlcmltZW50YWxEZWNvcmF0b3JzOiB0cnVlLFxuICAgIGVtaXREZWNvcmF0b3JNZXRhZGF0YTogdHJ1ZSxcbiAgICBkZWNsYXJhdGlvbjogZmFsc2UsXG4gICAgbm9JbXBsaWNpdEFueTogZmFsc2UsXG4gICAgcmVtb3ZlQ29tbWVudHM6IHRydWUsXG4gICAgbm9MaWI6IGZhbHNlLFxuICAgIHByZXNlcnZlQ29uc3RFbnVtczogdHJ1ZSxcbiAgICBzdXBwcmVzc0ltcGxpY2l0QW55SW5kZXhFcnJvcnM6IHRydWVcbn07XG52YXIgdHlwZXNjcmlwdEVudW1NYXAgPSB7XG4gICAgdGFyZ2V0OiB7XG4gICAgICAgICdlczMnOiAwLFxuICAgICAgICAnZXM1JzogMSxcbiAgICAgICAgJ2VzNic6IDIsXG4gICAgICAgICdsYXRlc3QnOiAyXG4gICAgfSxcbiAgICBtb2R1bGU6IHtcbiAgICAgICAgJ25vbmUnOiAwLFxuICAgICAgICAnY29tbW9uanMnOiAxLFxuICAgICAgICAnYW1kJzogMixcbiAgICAgICAgJ3N5c3RlbSc6IDQsXG4gICAgICAgICd1bWQnOiAzLFxuICAgIH0sXG4gICAganN4OiB7XG4gICAgICAgICdwcmVzZXJ2ZSc6IDEsXG4gICAgICAgICdyZWFjdCc6IDJcbiAgICB9XG59O1xudmFyIGpzb25FbnVtTWFwID0ge307XG5PYmplY3Qua2V5cyh0eXBlc2NyaXB0RW51bU1hcCkuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgIGpzb25FbnVtTWFwW25hbWVdID0gcmV2ZXJzZUtleXNBbmRWYWx1ZXModHlwZXNjcmlwdEVudW1NYXBbbmFtZV0pO1xufSk7XG5mdW5jdGlvbiBtaXhpbih0YXJnZXQsIHNvdXJjZSkge1xuICAgIGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHtcbiAgICAgICAgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTtcbiAgICB9XG4gICAgcmV0dXJuIHRhcmdldDtcbn1cbmZ1bmN0aW9uIHJhd1RvVHNDb21waWxlck9wdGlvbnMoanNvbk9wdGlvbnMsIHByb2plY3REaXIpIHtcbiAgICB2YXIgY29tcGlsZXJPcHRpb25zID0gbWl4aW4oe30sIGV4cG9ydHMuZGVmYXVsdHMpO1xuICAgIGZvciAodmFyIGtleSBpbiBqc29uT3B0aW9ucykge1xuICAgICAgICBpZiAodHlwZXNjcmlwdEVudW1NYXBba2V5XSkge1xuICAgICAgICAgICAgY29tcGlsZXJPcHRpb25zW2tleV0gPSB0eXBlc2NyaXB0RW51bU1hcFtrZXldW2pzb25PcHRpb25zW2tleV0udG9Mb3dlckNhc2UoKV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb21waWxlck9wdGlvbnNba2V5XSA9IGpzb25PcHRpb25zW2tleV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGNvbXBpbGVyT3B0aW9ucy5vdXREaXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb21waWxlck9wdGlvbnMub3V0RGlyID0gcGF0aC5yZXNvbHZlKHByb2plY3REaXIsIGNvbXBpbGVyT3B0aW9ucy5vdXREaXIpO1xuICAgIH1cbiAgICBpZiAoY29tcGlsZXJPcHRpb25zLnJvb3REaXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb21waWxlck9wdGlvbnMucm9vdERpciA9IHBhdGgucmVzb2x2ZShwcm9qZWN0RGlyLCBjb21waWxlck9wdGlvbnMucm9vdERpcik7XG4gICAgfVxuICAgIGlmIChjb21waWxlck9wdGlvbnMub3V0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29tcGlsZXJPcHRpb25zLm91dCA9IHBhdGgucmVzb2x2ZShwcm9qZWN0RGlyLCBjb21waWxlck9wdGlvbnMub3V0KTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXBpbGVyT3B0aW9ucztcbn1cbmZ1bmN0aW9uIHRzVG9SYXdDb21waWxlck9wdGlvbnMoY29tcGlsZXJPcHRpb25zKSB7XG4gICAgdmFyIGpzb25PcHRpb25zID0gbWl4aW4oe30sIGNvbXBpbGVyT3B0aW9ucyk7XG4gICAgT2JqZWN0LmtleXMoY29tcGlsZXJPcHRpb25zKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgaWYgKGpzb25FbnVtTWFwW2tleV0gJiYgY29tcGlsZXJPcHRpb25zW2tleV0pIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGNvbXBpbGVyT3B0aW9uc1trZXldO1xuICAgICAgICAgICAganNvbk9wdGlvbnNba2V5XSA9IGpzb25FbnVtTWFwW2tleV1bdmFsdWVdO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGpzb25PcHRpb25zO1xufVxuZnVuY3Rpb24gZ2V0RGVmYXVsdEluTWVtb3J5UHJvamVjdChzcmNGaWxlKSB7XG4gICAgdmFyIGRpciA9IGZzLmxzdGF0U3luYyhzcmNGaWxlKS5pc0RpcmVjdG9yeSgpID8gc3JjRmlsZSA6IHBhdGguZGlybmFtZShzcmNGaWxlKTtcbiAgICB2YXIgZmlsZXMgPSBbc3JjRmlsZV07XG4gICAgdmFyIHR5cGluZ3MgPSBnZXREZWZpbml0aW9uc0Zvck5vZGVNb2R1bGVzKGRpciwgZmlsZXMpO1xuICAgIGZpbGVzID0gaW5jcmVhc2VQcm9qZWN0Rm9yUmVmZXJlbmNlQW5kSW1wb3J0cyhmaWxlcyk7XG4gICAgZmlsZXMgPSB1bmlxKGZpbGVzLm1hcChmc3UuY29uc2lzdGVudFBhdGgpKTtcbiAgICB2YXIgcHJvamVjdCA9IHtcbiAgICAgICAgY29tcGlsZXJPcHRpb25zOiBleHBvcnRzLmRlZmF1bHRzLFxuICAgICAgICBmaWxlczogZmlsZXMsXG4gICAgICAgIHR5cGluZ3M6IHR5cGluZ3Mub3Vycy5jb25jYXQodHlwaW5ncy5pbXBsaWNpdCksXG4gICAgICAgIGZvcm1hdENvZGVPcHRpb25zOiBmb3JtYXR0aW5nLmRlZmF1bHRGb3JtYXRDb2RlT3B0aW9ucygpLFxuICAgICAgICBjb21waWxlT25TYXZlOiB0cnVlXG4gICAgfTtcbiAgICByZXR1cm4ge1xuICAgICAgICBwcm9qZWN0RmlsZURpcmVjdG9yeTogZGlyLFxuICAgICAgICBwcm9qZWN0RmlsZVBhdGg6IGRpciArICcvJyArIHByb2plY3RGaWxlTmFtZSxcbiAgICAgICAgcHJvamVjdDogcHJvamVjdCxcbiAgICAgICAgaW5NZW1vcnk6IHRydWVcbiAgICB9O1xufVxuZXhwb3J0cy5nZXREZWZhdWx0SW5NZW1vcnlQcm9qZWN0ID0gZ2V0RGVmYXVsdEluTWVtb3J5UHJvamVjdDtcbmZ1bmN0aW9uIGdldFByb2plY3RTeW5jKHBhdGhPclNyY0ZpbGUpIHtcbiAgICBpZiAoIWZzLmV4aXN0c1N5bmMocGF0aE9yU3JjRmlsZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGV4cG9ydHMuZXJyb3JzLkdFVF9QUk9KRUNUX0lOVkFMSURfUEFUSCk7XG4gICAgfVxuICAgIHZhciBkaXIgPSBmcy5sc3RhdFN5bmMocGF0aE9yU3JjRmlsZSkuaXNEaXJlY3RvcnkoKSA/IHBhdGhPclNyY0ZpbGUgOiBwYXRoLmRpcm5hbWUocGF0aE9yU3JjRmlsZSk7XG4gICAgdmFyIHByb2plY3RGaWxlID0gJyc7XG4gICAgdHJ5IHtcbiAgICAgICAgcHJvamVjdEZpbGUgPSB0cmF2ZWxVcFRoZURpcmVjdG9yeVRyZWVUaWxsWW91RmluZChkaXIsIHByb2plY3RGaWxlTmFtZSk7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICAgIHZhciBlcnIgPSBlO1xuICAgICAgICBpZiAoZXJyLm1lc3NhZ2UgPT0gXCJub3QgZm91bmRcIikge1xuICAgICAgICAgICAgdGhyb3cgZXJyb3JXaXRoRGV0YWlscyhuZXcgRXJyb3IoZXhwb3J0cy5lcnJvcnMuR0VUX1BST0pFQ1RfTk9fUFJPSkVDVF9GT1VORCksIHsgcHJvamVjdEZpbGVQYXRoOiBmc3UuY29uc2lzdGVudFBhdGgocGF0aE9yU3JjRmlsZSksIGVycm9yTWVzc2FnZTogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcHJvamVjdEZpbGUgPSBwYXRoLm5vcm1hbGl6ZShwcm9qZWN0RmlsZSk7XG4gICAgdmFyIHByb2plY3RGaWxlRGlyZWN0b3J5ID0gcGF0aC5kaXJuYW1lKHByb2plY3RGaWxlKSArIHBhdGguc2VwO1xuICAgIHZhciBwcm9qZWN0U3BlYztcbiAgICB0cnkge1xuICAgICAgICB2YXIgcHJvamVjdEZpbGVUZXh0Q29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhwcm9qZWN0RmlsZSwgJ3V0ZjgnKTtcbiAgICB9XG4gICAgY2F0Y2ggKGV4KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihleHBvcnRzLmVycm9ycy5HRVRfUFJPSkVDVF9GQUlMRURfVE9fT1BFTl9QUk9KRUNUX0ZJTEUpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBwcm9qZWN0U3BlYyA9IEpTT04ucGFyc2Uoc3RyaXBCb20ocHJvamVjdEZpbGVUZXh0Q29udGVudCkpO1xuICAgIH1cbiAgICBjYXRjaCAoZXgpIHtcbiAgICAgICAgdGhyb3cgZXJyb3JXaXRoRGV0YWlscyhuZXcgRXJyb3IoZXhwb3J0cy5lcnJvcnMuR0VUX1BST0pFQ1RfSlNPTl9QQVJTRV9GQUlMRUQpLCB7IHByb2plY3RGaWxlUGF0aDogZnN1LmNvbnNpc3RlbnRQYXRoKHByb2plY3RGaWxlKSwgZXJyb3I6IGV4Lm1lc3NhZ2UgfSk7XG4gICAgfVxuICAgIGlmICghcHJvamVjdFNwZWMuY29tcGlsZXJPcHRpb25zKVxuICAgICAgICBwcm9qZWN0U3BlYy5jb21waWxlck9wdGlvbnMgPSB7fTtcbiAgICB2YXIgY3dkUGF0aCA9IHBhdGgucmVsYXRpdmUocHJvY2Vzcy5jd2QoKSwgcGF0aC5kaXJuYW1lKHByb2plY3RGaWxlKSk7XG4gICAgaWYgKCFwcm9qZWN0U3BlYy5maWxlcyAmJiAhcHJvamVjdFNwZWMuZmlsZXNHbG9iKSB7XG4gICAgICAgIHZhciB0b0V4cGFuZCA9IGludmlzaWJsZUZpbGVzR2xvYjtcbiAgICB9XG4gICAgaWYgKHByb2plY3RTcGVjLmZpbGVzR2xvYikge1xuICAgICAgICB2YXIgdG9FeHBhbmQgPSBwcm9qZWN0U3BlYy5maWxlc0dsb2I7XG4gICAgfVxuICAgIGlmICh0b0V4cGFuZCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcHJvamVjdFNwZWMuZmlsZXMgPSBleHBhbmQoeyBmaWx0ZXI6ICdpc0ZpbGUnLCBjd2Q6IGN3ZFBhdGggfSwgdG9FeHBhbmQpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChleCkge1xuICAgICAgICAgICAgdGhyb3cgZXJyb3JXaXRoRGV0YWlscyhuZXcgRXJyb3IoZXhwb3J0cy5lcnJvcnMuR0VUX1BST0pFQ1RfR0xPQl9FWFBBTkRfRkFJTEVEKSwgeyBnbG9iOiBwcm9qZWN0U3BlYy5maWxlc0dsb2IsIHByb2plY3RGaWxlUGF0aDogZnN1LmNvbnNpc3RlbnRQYXRoKHByb2plY3RGaWxlKSwgZXJyb3JNZXNzYWdlOiBleC5tZXNzYWdlIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChwcm9qZWN0U3BlYy5maWxlc0dsb2IpIHtcbiAgICAgICAgdmFyIHByZXR0eUpTT05Qcm9qZWN0U3BlYyA9IHByZXR0eUpTT04ocHJvamVjdFNwZWMpO1xuICAgICAgICBpZiAocHJldHR5SlNPTlByb2plY3RTcGVjICE9PSBwcm9qZWN0RmlsZVRleHRDb250ZW50KSB7XG4gICAgICAgICAgICBmcy53cml0ZUZpbGVTeW5jKHByb2plY3RGaWxlLCBwcmV0dHlKU09OKHByb2plY3RTcGVjKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcHJvamVjdFNwZWMuZmlsZXMgPSBwcm9qZWN0U3BlYy5maWxlcy5tYXAoZnVuY3Rpb24gKGZpbGUpIHsgcmV0dXJuIHBhdGgucmVzb2x2ZShwcm9qZWN0RmlsZURpcmVjdG9yeSwgZmlsZSk7IH0pO1xuICAgIHZhciBwa2cgPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICAgIHZhciBwYWNrYWdlUGF0aCA9IHRyYXZlbFVwVGhlRGlyZWN0b3J5VHJlZVRpbGxZb3VGaW5kKHByb2plY3RGaWxlRGlyZWN0b3J5LCAncGFja2FnZS5qc29uJyk7XG4gICAgICAgIGlmIChwYWNrYWdlUGF0aCkge1xuICAgICAgICAgICAgdmFyIHBhY2thZ2VKU09OUGF0aCA9IGdldFBvdGVudGlhbGx5UmVsYXRpdmVGaWxlKHByb2plY3RGaWxlRGlyZWN0b3J5LCBwYWNrYWdlUGF0aCk7XG4gICAgICAgICAgICB2YXIgcGFyc2VkUGFja2FnZSA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHBhY2thZ2VKU09OUGF0aCkudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICBwa2cgPSB7XG4gICAgICAgICAgICAgICAgbWFpbjogcGFyc2VkUGFja2FnZS5tYWluLFxuICAgICAgICAgICAgICAgIG5hbWU6IHBhcnNlZFBhY2thZ2UubmFtZSxcbiAgICAgICAgICAgICAgICBkaXJlY3Rvcnk6IHBhdGguZGlybmFtZShwYWNrYWdlSlNPTlBhdGgpLFxuICAgICAgICAgICAgICAgIGRlZmluaXRpb246IHBhcnNlZFBhY2thZ2UudHlwZXNjcmlwdCAmJiBwYXJzZWRQYWNrYWdlLnR5cGVzY3JpcHQuZGVmaW5pdGlvblxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjYXRjaCAoZXgpIHtcbiAgICB9XG4gICAgdmFyIHByb2plY3QgPSB7XG4gICAgICAgIGNvbXBpbGVyT3B0aW9uczoge30sXG4gICAgICAgIGZpbGVzOiBwcm9qZWN0U3BlYy5maWxlcyxcbiAgICAgICAgZmlsZXNHbG9iOiBwcm9qZWN0U3BlYy5maWxlc0dsb2IsXG4gICAgICAgIGZvcm1hdENvZGVPcHRpb25zOiBmb3JtYXR0aW5nLm1ha2VGb3JtYXRDb2RlT3B0aW9ucyhwcm9qZWN0U3BlYy5mb3JtYXRDb2RlT3B0aW9ucyksXG4gICAgICAgIGNvbXBpbGVPblNhdmU6IHByb2plY3RTcGVjLmNvbXBpbGVPblNhdmUgPT0gdW5kZWZpbmVkID8gdHJ1ZSA6IHByb2plY3RTcGVjLmNvbXBpbGVPblNhdmUsXG4gICAgICAgIHBhY2thZ2U6IHBrZyxcbiAgICAgICAgdHlwaW5nczogW11cbiAgICB9O1xuICAgIHZhciB2YWxpZGF0aW9uUmVzdWx0ID0gdmFsaWRhdG9yLnZhbGlkYXRlKHByb2plY3RTcGVjLmNvbXBpbGVyT3B0aW9ucyk7XG4gICAgaWYgKHZhbGlkYXRpb25SZXN1bHQuZXJyb3JNZXNzYWdlKSB7XG4gICAgICAgIHRocm93IGVycm9yV2l0aERldGFpbHMobmV3IEVycm9yKGV4cG9ydHMuZXJyb3JzLkdFVF9QUk9KRUNUX1BST0pFQ1RfRklMRV9JTlZBTElEX09QVElPTlMpLCB7IHByb2plY3RGaWxlUGF0aDogZnN1LmNvbnNpc3RlbnRQYXRoKHByb2plY3RGaWxlKSwgZXJyb3JNZXNzYWdlOiB2YWxpZGF0aW9uUmVzdWx0LmVycm9yTWVzc2FnZSB9KTtcbiAgICB9XG4gICAgcHJvamVjdC5jb21waWxlck9wdGlvbnMgPSByYXdUb1RzQ29tcGlsZXJPcHRpb25zKHByb2plY3RTcGVjLmNvbXBpbGVyT3B0aW9ucywgcHJvamVjdEZpbGVEaXJlY3RvcnkpO1xuICAgIHByb2plY3QuZmlsZXMgPSBpbmNyZWFzZVByb2plY3RGb3JSZWZlcmVuY2VBbmRJbXBvcnRzKHByb2plY3QuZmlsZXMpO1xuICAgIHZhciB0eXBpbmdzID0gZ2V0RGVmaW5pdGlvbnNGb3JOb2RlTW9kdWxlcyhkaXIsIHByb2plY3QuZmlsZXMpO1xuICAgIHByb2plY3QuZmlsZXMgPSBwcm9qZWN0LmZpbGVzLmNvbmNhdCh0eXBpbmdzLmltcGxpY2l0KTtcbiAgICBwcm9qZWN0LnR5cGluZ3MgPSB0eXBpbmdzLm91cnMuY29uY2F0KHR5cGluZ3MuaW1wbGljaXQpO1xuICAgIHByb2plY3QuZmlsZXMgPSB1bmlxKHByb2plY3QuZmlsZXMubWFwKGZzdS5jb25zaXN0ZW50UGF0aCkpO1xuICAgIHByb2plY3RGaWxlRGlyZWN0b3J5ID0gcmVtb3ZlVHJhaWxpbmdTbGFzaChmc3UuY29uc2lzdGVudFBhdGgocHJvamVjdEZpbGVEaXJlY3RvcnkpKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBwcm9qZWN0RmlsZURpcmVjdG9yeTogcHJvamVjdEZpbGVEaXJlY3RvcnksXG4gICAgICAgIHByb2plY3RGaWxlUGF0aDogcHJvamVjdEZpbGVEaXJlY3RvcnkgKyAnLycgKyBwcm9qZWN0RmlsZU5hbWUsXG4gICAgICAgIHByb2plY3Q6IHByb2plY3QsXG4gICAgICAgIGluTWVtb3J5OiBmYWxzZVxuICAgIH07XG59XG5leHBvcnRzLmdldFByb2plY3RTeW5jID0gZ2V0UHJvamVjdFN5bmM7XG5mdW5jdGlvbiBjcmVhdGVQcm9qZWN0Um9vdFN5bmMoc3JjRmlsZSwgZGVmYXVsdE9wdGlvbnMpIHtcbiAgICBpZiAoIWZzLmV4aXN0c1N5bmMoc3JjRmlsZSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGV4cG9ydHMuZXJyb3JzLkNSRUFURV9GSUxFX01VU1RfRVhJU1QpO1xuICAgIH1cbiAgICB2YXIgZGlyID0gZnMubHN0YXRTeW5jKHNyY0ZpbGUpLmlzRGlyZWN0b3J5KCkgPyBzcmNGaWxlIDogcGF0aC5kaXJuYW1lKHNyY0ZpbGUpO1xuICAgIHZhciBwcm9qZWN0RmlsZVBhdGggPSBwYXRoLm5vcm1hbGl6ZShkaXIgKyAnLycgKyBwcm9qZWN0RmlsZU5hbWUpO1xuICAgIGlmIChmcy5leGlzdHNTeW5jKHByb2plY3RGaWxlUGF0aCkpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihleHBvcnRzLmVycm9ycy5DUkVBVEVfUFJPSkVDVF9BTFJFQURZX0VYSVNUUyk7XG4gICAgdmFyIHByb2plY3RTcGVjID0ge307XG4gICAgcHJvamVjdFNwZWMudmVyc2lvbiA9IHR5cGVTY3JpcHRWZXJzaW9uO1xuICAgIHByb2plY3RTcGVjLmNvbXBpbGVyT3B0aW9ucyA9IHRzVG9SYXdDb21waWxlck9wdGlvbnMoZGVmYXVsdE9wdGlvbnMgfHwgZXhwb3J0cy5kZWZhdWx0cyk7XG4gICAgcHJvamVjdFNwZWMuZmlsZXNHbG9iID0gZGVmYXVsdEZpbGVzR2xvYjtcbiAgICBmcy53cml0ZUZpbGVTeW5jKHByb2plY3RGaWxlUGF0aCwgcHJldHR5SlNPTihwcm9qZWN0U3BlYykpO1xuICAgIHJldHVybiBnZXRQcm9qZWN0U3luYyhzcmNGaWxlKTtcbn1cbmV4cG9ydHMuY3JlYXRlUHJvamVjdFJvb3RTeW5jID0gY3JlYXRlUHJvamVjdFJvb3RTeW5jO1xuZnVuY3Rpb24gaW5jcmVhc2VQcm9qZWN0Rm9yUmVmZXJlbmNlQW5kSW1wb3J0cyhmaWxlcykge1xuICAgIHZhciBmaWxlc01hcCA9IHNpbXBsZVZhbGlkYXRvci5jcmVhdGVNYXAoZmlsZXMpO1xuICAgIHZhciB3aWxsTmVlZE1vcmVBbmFseXNpcyA9IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgIGlmICghZmlsZXNNYXBbZmlsZV0pIHtcbiAgICAgICAgICAgIGZpbGVzTWFwW2ZpbGVdID0gdHJ1ZTtcbiAgICAgICAgICAgIGZpbGVzLnB1c2goZmlsZSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdmFyIGdldFJlZmVyZW5jZWRPckltcG9ydGVkRmlsZXMgPSBmdW5jdGlvbiAoZmlsZXMpIHtcbiAgICAgICAgdmFyIHJlZmVyZW5jZWQgPSBbXTtcbiAgICAgICAgZmlsZXMuZm9yRWFjaChmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhmaWxlKS50b1N0cmluZygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHByZVByb2Nlc3NlZEZpbGVJbmZvID0gdHMucHJlUHJvY2Vzc0ZpbGUoY29udGVudCwgdHJ1ZSksIGRpciA9IHBhdGguZGlybmFtZShmaWxlKTtcbiAgICAgICAgICAgIHJlZmVyZW5jZWQucHVzaChwcmVQcm9jZXNzZWRGaWxlSW5mby5yZWZlcmVuY2VkRmlsZXMubWFwKGZ1bmN0aW9uIChmaWxlUmVmZXJlbmNlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZpbGUgPSBwYXRoLnJlc29sdmUoZGlyLCBmc3UuY29uc2lzdGVudFBhdGgoZmlsZVJlZmVyZW5jZS5maWxlTmFtZSkpO1xuICAgICAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGZpbGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWxlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhmaWxlICsgJy50cycpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWxlICsgJy50cyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGZpbGUgKyAnLmQudHMnKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmlsZSArICcuZC50cyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSkuZmlsdGVyKGZ1bmN0aW9uIChmaWxlKSB7IHJldHVybiAhIWZpbGU7IH0pXG4gICAgICAgICAgICAgICAgLmNvbmNhdChwcmVQcm9jZXNzZWRGaWxlSW5mby5pbXBvcnRlZEZpbGVzXG4gICAgICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAoZmlsZVJlZmVyZW5jZSkgeyByZXR1cm4gcGF0aElzUmVsYXRpdmUoZmlsZVJlZmVyZW5jZS5maWxlTmFtZSk7IH0pXG4gICAgICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAoZmlsZVJlZmVyZW5jZSkge1xuICAgICAgICAgICAgICAgIHZhciBmaWxlID0gcGF0aC5yZXNvbHZlKGRpciwgZmlsZVJlZmVyZW5jZS5maWxlTmFtZSArICcudHMnKTtcbiAgICAgICAgICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMoZmlsZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsZSA9IHBhdGgucmVzb2x2ZShkaXIsIGZpbGVSZWZlcmVuY2UuZmlsZU5hbWUgKyAnLmQudHMnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbGU7XG4gICAgICAgICAgICB9KSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHNlbGVjdE1hbnkocmVmZXJlbmNlZCk7XG4gICAgfTtcbiAgICB2YXIgbW9yZSA9IGdldFJlZmVyZW5jZWRPckltcG9ydGVkRmlsZXMoZmlsZXMpXG4gICAgICAgIC5maWx0ZXIod2lsbE5lZWRNb3JlQW5hbHlzaXMpO1xuICAgIHdoaWxlIChtb3JlLmxlbmd0aCkge1xuICAgICAgICBtb3JlID0gZ2V0UmVmZXJlbmNlZE9ySW1wb3J0ZWRGaWxlcyhmaWxlcylcbiAgICAgICAgICAgIC5maWx0ZXIod2lsbE5lZWRNb3JlQW5hbHlzaXMpO1xuICAgIH1cbiAgICByZXR1cm4gZmlsZXM7XG59XG5mdW5jdGlvbiBnZXREZWZpbml0aW9uc0Zvck5vZGVNb2R1bGVzKHByb2plY3REaXIsIGZpbGVzKSB7XG4gICAgZnVuY3Rpb24gdmVyc2lvblN0cmluZ1RvTnVtYmVyKHZlcnNpb24pIHtcbiAgICAgICAgdmFyIF9hID0gdmVyc2lvbi5zcGxpdCgnLicpLCBtYWogPSBfYVswXSwgbWluID0gX2FbMV0sIHBhdGNoID0gX2FbMl07XG4gICAgICAgIHJldHVybiBwYXJzZUludChtYWopICogMTAwMDAwMCArIHBhcnNlSW50KG1pbik7XG4gICAgfVxuICAgIHZhciB0eXBpbmdzID0ge307XG4gICAgdmFyIG91clR5cGluZ3MgPSBmaWxlc1xuICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChmKSB7IHJldHVybiBwYXRoLmJhc2VuYW1lKHBhdGguZGlybmFtZShmKSkgPT0gJ3R5cGluZ3MnICYmIGVuZHNXaXRoKGYsICcuZC50cycpXG4gICAgICAgIHx8IHBhdGguYmFzZW5hbWUocGF0aC5kaXJuYW1lKHBhdGguZGlybmFtZShmKSkpID09ICd0eXBpbmdzJyAmJiBlbmRzV2l0aChmLCAnLmQudHMnKTsgfSk7XG4gICAgb3VyVHlwaW5ncy5mb3JFYWNoKGZ1bmN0aW9uIChmKSB7IHJldHVybiB0eXBpbmdzW3BhdGguYmFzZW5hbWUoZildID0geyBmaWxlUGF0aDogZiwgdmVyc2lvbjogSW5maW5pdHkgfTsgfSk7XG4gICAgdmFyIGV4aXN0aW5nID0gY3JlYXRlTWFwKGZpbGVzLm1hcChmc3UuY29uc2lzdGVudFBhdGgpKTtcbiAgICBmdW5jdGlvbiBhZGRBbGxSZWZlcmVuY2VkRmlsZXNXaXRoTWF4VmVyc2lvbihmaWxlKSB7XG4gICAgICAgIHZhciBkaXIgPSBwYXRoLmRpcm5hbWUoZmlsZSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhmaWxlKS50b1N0cmluZygpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChleCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwcmVQcm9jZXNzZWRGaWxlSW5mbyA9IHRzLnByZVByb2Nlc3NGaWxlKGNvbnRlbnQsIHRydWUpO1xuICAgICAgICB2YXIgZmlsZXMgPSBwcmVQcm9jZXNzZWRGaWxlSW5mby5yZWZlcmVuY2VkRmlsZXMubWFwKGZ1bmN0aW9uIChmaWxlUmVmZXJlbmNlKSB7XG4gICAgICAgICAgICB2YXIgZmlsZSA9IHBhdGgucmVzb2x2ZShkaXIsIGZpbGVSZWZlcmVuY2UuZmlsZU5hbWUpO1xuICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoZmlsZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGZpbGUgKyAnLmQudHMnKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWxlICsgJy5kLnRzJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkuZmlsdGVyKGZ1bmN0aW9uIChmKSB7IHJldHVybiAhIWY7IH0pO1xuICAgICAgICBmaWxlcyA9IGZpbGVzXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChmKSB7IHJldHVybiAhdHlwaW5nc1twYXRoLmJhc2VuYW1lKGYpXSB8fCB0eXBpbmdzW3BhdGguYmFzZW5hbWUoZildLnZlcnNpb24gPiBJbmZpbml0eTsgfSk7XG4gICAgICAgIGZpbGVzLmZvckVhY2goZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHR5cGluZ3NbcGF0aC5iYXNlbmFtZShmKV0gPSB7IGZpbGVQYXRoOiBmLCB2ZXJzaW9uOiBJbmZpbml0eSB9OyB9KTtcbiAgICAgICAgZmlsZXMuZm9yRWFjaChmdW5jdGlvbiAoZikgeyByZXR1cm4gYWRkQWxsUmVmZXJlbmNlZEZpbGVzV2l0aE1heFZlcnNpb24oZik7IH0pO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICB2YXIgbm9kZV9tb2R1bGVzID0gdHJhdmVsVXBUaGVEaXJlY3RvcnlUcmVlVGlsbFlvdUZpbmQocHJvamVjdERpciwgJ25vZGVfbW9kdWxlcycsIHRydWUpO1xuICAgICAgICB2YXIgbW9kdWxlRGlycyA9IGdldERpcnMobm9kZV9tb2R1bGVzKTtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IG1vZHVsZURpcnMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICB2YXIgbW9kdWxlRGlyID0gbW9kdWxlRGlyc1tfaV07XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHZhciBwYWNrYWdlX2pzb24gPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhtb2R1bGVEaXIgKyBcIi9wYWNrYWdlLmpzb25cIikudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXgpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwYWNrYWdlX2pzb24udHlwZXNjcmlwdCAmJiBwYWNrYWdlX2pzb24udHlwZXNjcmlwdC5kZWZpbml0aW9uKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZpbGUgPSBwYXRoLnJlc29sdmUobW9kdWxlRGlyLCAnLi8nLCBwYWNrYWdlX2pzb24udHlwZXNjcmlwdC5kZWZpbml0aW9uKTtcbiAgICAgICAgICAgICAgICB0eXBpbmdzW3BhdGguYmFzZW5hbWUoZmlsZSldID0ge1xuICAgICAgICAgICAgICAgICAgICBmaWxlUGF0aDogZmlsZSxcbiAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogSW5maW5pdHlcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGFkZEFsbFJlZmVyZW5jZWRGaWxlc1dpdGhNYXhWZXJzaW9uKGZpbGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGNhdGNoIChleCkge1xuICAgICAgICBpZiAoZXgubWVzc2FnZSA9PSBcIm5vdCBmb3VuZFwiKSB7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gcmVhZCBwYWNrYWdlLmpzb24gZnJvbSBub2RlX21vZHVsZXMgZHVlIHRvIGVycm9yOicsIGV4LCBleC5zdGFjayk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIGFsbCA9IE9iamVjdC5rZXlzKHR5cGluZ3MpXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKHR5cGluZykgeyByZXR1cm4gdHlwaW5nc1t0eXBpbmddLmZpbGVQYXRoOyB9KVxuICAgICAgICAubWFwKGZ1bmN0aW9uICh4KSB7IHJldHVybiBmc3UuY29uc2lzdGVudFBhdGgoeCk7IH0pO1xuICAgIHZhciBpbXBsaWNpdCA9IGFsbFxuICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uICh4KSB7IHJldHVybiAhZXhpc3RpbmdbeF07IH0pO1xuICAgIHZhciBvdXJzID0gYWxsXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIGV4aXN0aW5nW3hdOyB9KTtcbiAgICByZXR1cm4geyBpbXBsaWNpdDogaW1wbGljaXQsIG91cnM6IG91cnMgfTtcbn1cbmZ1bmN0aW9uIHByZXR0eUpTT04ob2JqZWN0KSB7XG4gICAgdmFyIGNhY2hlID0gW107XG4gICAgdmFyIHZhbHVlID0gSlNPTi5zdHJpbmdpZnkob2JqZWN0LCBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKGNhY2hlLmluZGV4T2YodmFsdWUpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhY2hlLnB1c2godmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9LCA0KTtcbiAgICB2YWx1ZSA9IHZhbHVlLnNwbGl0KCdcXG4nKS5qb2luKG9zLkVPTCkgKyBvcy5FT0w7XG4gICAgY2FjaGUgPSBudWxsO1xuICAgIHJldHVybiB2YWx1ZTtcbn1cbmV4cG9ydHMucHJldHR5SlNPTiA9IHByZXR0eUpTT047XG5mdW5jdGlvbiBwYXRoSXNSZWxhdGl2ZShzdHIpIHtcbiAgICBpZiAoIXN0ci5sZW5ndGgpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gc3RyWzBdID09ICcuJyB8fCBzdHIuc3Vic3RyaW5nKDAsIDIpID09IFwiLi9cIiB8fCBzdHIuc3Vic3RyaW5nKDAsIDMpID09IFwiLi4vXCI7XG59XG5leHBvcnRzLnBhdGhJc1JlbGF0aXZlID0gcGF0aElzUmVsYXRpdmU7XG5mdW5jdGlvbiBzZWxlY3RNYW55KGFycikge1xuICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGFycltpXS5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goYXJyW2ldW2pdKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuZnVuY3Rpb24gZW5kc1dpdGgoc3RyLCBzdWZmaXgpIHtcbiAgICByZXR1cm4gc3RyICYmIHN0ci5pbmRleE9mKHN1ZmZpeCwgc3RyLmxlbmd0aCAtIHN1ZmZpeC5sZW5ndGgpICE9PSAtMTtcbn1cbmV4cG9ydHMuZW5kc1dpdGggPSBlbmRzV2l0aDtcbmZ1bmN0aW9uIHVuaXEoYXJyKSB7XG4gICAgdmFyIG1hcCA9IHNpbXBsZVZhbGlkYXRvci5jcmVhdGVNYXAoYXJyKTtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMobWFwKTtcbn1cbmZ1bmN0aW9uIG1ha2VSZWxhdGl2ZVBhdGgocmVsYXRpdmVGb2xkZXIsIGZpbGVQYXRoKSB7XG4gICAgdmFyIHJlbGF0aXZlUGF0aCA9IHBhdGgucmVsYXRpdmUocmVsYXRpdmVGb2xkZXIsIGZpbGVQYXRoKS5zcGxpdCgnXFxcXCcpLmpvaW4oJy8nKTtcbiAgICBpZiAocmVsYXRpdmVQYXRoWzBdICE9PSAnLicpIHtcbiAgICAgICAgcmVsYXRpdmVQYXRoID0gJy4vJyArIHJlbGF0aXZlUGF0aDtcbiAgICB9XG4gICAgcmV0dXJuIHJlbGF0aXZlUGF0aDtcbn1cbmV4cG9ydHMubWFrZVJlbGF0aXZlUGF0aCA9IG1ha2VSZWxhdGl2ZVBhdGg7XG5mdW5jdGlvbiByZW1vdmVFeHQoZmlsZVBhdGgpIHtcbiAgICByZXR1cm4gZmlsZVBhdGguc3Vic3RyKDAsIGZpbGVQYXRoLmxhc3RJbmRleE9mKCcuJykpO1xufVxuZXhwb3J0cy5yZW1vdmVFeHQgPSByZW1vdmVFeHQ7XG5mdW5jdGlvbiByZW1vdmVUcmFpbGluZ1NsYXNoKGZpbGVQYXRoKSB7XG4gICAgaWYgKCFmaWxlUGF0aClcbiAgICAgICAgcmV0dXJuIGZpbGVQYXRoO1xuICAgIGlmIChlbmRzV2l0aChmaWxlUGF0aCwgJy8nKSlcbiAgICAgICAgcmV0dXJuIGZpbGVQYXRoLnN1YnN0cigwLCBmaWxlUGF0aC5sZW5ndGggLSAxKTtcbiAgICByZXR1cm4gZmlsZVBhdGg7XG59XG5leHBvcnRzLnJlbW92ZVRyYWlsaW5nU2xhc2ggPSByZW1vdmVUcmFpbGluZ1NsYXNoO1xuZnVuY3Rpb24gdHJhdmVsVXBUaGVEaXJlY3RvcnlUcmVlVGlsbFlvdUZpbmQoZGlyLCBmaWxlT3JEaXJlY3RvcnksIGFib3J0SWZJbnNpZGUpIHtcbiAgICBpZiAoYWJvcnRJZkluc2lkZSA9PT0gdm9pZCAwKSB7IGFib3J0SWZJbnNpZGUgPSBmYWxzZTsgfVxuICAgIHdoaWxlIChmcy5leGlzdHNTeW5jKGRpcikpIHtcbiAgICAgICAgdmFyIHBvdGVudGlhbEZpbGUgPSBkaXIgKyAnLycgKyBmaWxlT3JEaXJlY3Rvcnk7XG4gICAgICAgIGlmIChiZWZvcmUgPT0gcG90ZW50aWFsRmlsZSkge1xuICAgICAgICAgICAgaWYgKGFib3J0SWZJbnNpZGUpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJub3QgZm91bmRcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMocG90ZW50aWFsRmlsZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBwb3RlbnRpYWxGaWxlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIGJlZm9yZSA9IGRpcjtcbiAgICAgICAgICAgIGRpciA9IHBhdGguZGlybmFtZShkaXIpO1xuICAgICAgICAgICAgaWYgKGRpciA9PSBiZWZvcmUpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwibm90IGZvdW5kXCIpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy50cmF2ZWxVcFRoZURpcmVjdG9yeVRyZWVUaWxsWW91RmluZCA9IHRyYXZlbFVwVGhlRGlyZWN0b3J5VHJlZVRpbGxZb3VGaW5kO1xuZnVuY3Rpb24gZ2V0UG90ZW50aWFsbHlSZWxhdGl2ZUZpbGUoYmFzZVBhdGgsIGZpbGVQYXRoKSB7XG4gICAgaWYgKHBhdGhJc1JlbGF0aXZlKGZpbGVQYXRoKSkge1xuICAgICAgICByZXR1cm4gZnN1LmNvbnNpc3RlbnRQYXRoKHBhdGgucmVzb2x2ZShiYXNlUGF0aCwgZmlsZVBhdGgpKTtcbiAgICB9XG4gICAgcmV0dXJuIGZzdS5jb25zaXN0ZW50UGF0aChmaWxlUGF0aCk7XG59XG5leHBvcnRzLmdldFBvdGVudGlhbGx5UmVsYXRpdmVGaWxlID0gZ2V0UG90ZW50aWFsbHlSZWxhdGl2ZUZpbGU7XG5mdW5jdGlvbiBnZXREaXJzKHJvb3REaXIpIHtcbiAgICB2YXIgZmlsZXMgPSBmcy5yZWFkZGlyU3luYyhyb290RGlyKTtcbiAgICB2YXIgZGlycyA9IFtdO1xuICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBmaWxlcy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgdmFyIGZpbGUgPSBmaWxlc1tfaV07XG4gICAgICAgIGlmIChmaWxlWzBdICE9ICcuJykge1xuICAgICAgICAgICAgdmFyIGZpbGVQYXRoID0gcm9vdERpciArIFwiL1wiICsgZmlsZTtcbiAgICAgICAgICAgIHZhciBzdGF0ID0gZnMuc3RhdFN5bmMoZmlsZVBhdGgpO1xuICAgICAgICAgICAgaWYgKHN0YXQuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgIGRpcnMucHVzaChmaWxlUGF0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRpcnM7XG59XG5mdW5jdGlvbiBjcmVhdGVNYXAoYXJyKSB7XG4gICAgcmV0dXJuIGFyci5yZWR1Y2UoZnVuY3Rpb24gKHJlc3VsdCwga2V5KSB7XG4gICAgICAgIHJlc3VsdFtrZXldID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LCB7fSk7XG59XG5leHBvcnRzLmNyZWF0ZU1hcCA9IGNyZWF0ZU1hcDtcbmZ1bmN0aW9uIHJldmVyc2VLZXlzQW5kVmFsdWVzKG9iaikge1xuICAgIHZhciB0b3JldCA9IHt9O1xuICAgIE9iamVjdC5rZXlzKG9iaikuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIHRvcmV0W29ialtrZXldXSA9IGtleTtcbiAgICB9KTtcbiAgICByZXR1cm4gdG9yZXQ7XG59XG4iXX0=