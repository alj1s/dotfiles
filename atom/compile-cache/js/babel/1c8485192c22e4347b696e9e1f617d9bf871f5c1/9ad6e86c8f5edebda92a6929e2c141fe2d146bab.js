function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var parent = require("../../../worker/parent");
var buildView = require("../buildView");
var atomUtils = require("../atomUtils");
var autoCompleteProvider = require("../autoCompleteProvider");
var path = require("path");
var renameView = require("../views/renameView");
var apd = require("atom-package-dependencies");
var contextView = require("../views/contextView");
var fileSymbolsView = require("../views/fileSymbolsView");
var projectSymbolsView = require("../views/projectSymbolsView");
var gotoHistory = require("../gotoHistory");
var utils = require("../../lang/utils");
var mainPanelView_1 = require("../views/mainPanelView");
var astView_1 = require("../views/astView");
var dependencyView_1 = require("../views/dependencyView");
var simpleSelectionView_1 = require("../views/simpleSelectionView");
var simpleOverlaySelectionView_1 = require("../views/simpleOverlaySelectionView");
var outputFileCommands = require("./outputFileCommands");
var moveFilesHandling_1 = require("./moveFilesHandling");
var escapeHtml = require("escape-html");
var rView = require("../views/rView");
var reactCommands_1 = require("./reactCommands");
var fileStatusCache_1 = require("../fileStatusCache");
var json2dtsCommands_1 = require("./json2dtsCommands");
__export(require("../components/componentRegistry"));
function registerCommands() {
    outputFileCommands.register();
    moveFilesHandling_1.registerRenameHandling();
    reactCommands_1.registerReactCommands();
    json2dtsCommands_1.registerJson2dtsCommands();
    function applyRefactorings(refactorings) {
        var paths = atomUtils.getOpenTypeScritEditorsConsistentPaths();
        var openPathsMap = utils.createMap(paths);
        var refactorPaths = Object.keys(refactorings);
        var openFiles = refactorPaths.filter(function (p) {
            return openPathsMap[p];
        });
        var closedFiles = refactorPaths.filter(function (p) {
            return !openPathsMap[p];
        });
        atomUtils.getEditorsForAllPaths(refactorPaths).then(function (editorMap) {
            refactorPaths.forEach(function (filePath) {
                var editor = editorMap[filePath];
                editor.transact(function () {
                    refactorings[filePath].forEach(function (refactoring) {
                        var range = atomUtils.getRangeForTextSpan(editor, refactoring.span);
                        if (!refactoring.isNewTextSnippet) {
                            editor.setTextInBufferRange(range, refactoring.newText);
                        } else {
                            var cursor = editor.getCursors()[0];
                            cursor.selection.setBufferRange(range);
                            atomUtils.insertSnippet(refactoring.newText, editor, cursor);
                        }
                    });
                });
            });
        });
    }
    atom.commands.add("atom-text-editor", "typescript:format-code", function (e) {
        if (!atomUtils.commandForTypeScript(e)) return;
        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();
        var selection = editor.getSelectedBufferRange();
        if (selection.isEmpty()) {
            parent.formatDocument({ filePath: filePath }).then(function (result) {
                if (!result.edits.length) return;
                editor.transact(function () {
                    atomUtils.formatCode(editor, result.edits);
                });
            });
        } else {
            parent.formatDocumentRange({ filePath: filePath, start: { line: selection.start.row, col: selection.start.column }, end: { line: selection.end.row, col: selection.end.column } }).then(function (result) {
                if (!result.edits.length) return;
                editor.transact(function () {
                    atomUtils.formatCode(editor, result.edits);
                });
            });
        }
    });
    atom.commands.add("atom-workspace", "typescript:build", function (e) {
        if (!atomUtils.commandForTypeScript(e)) return;
        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();
        atom.notifications.addInfo("Building");
        parent.build({ filePath: filePath }).then(function (resp) {
            buildView.setBuildOutput(resp.buildOutput);
            resp.tsFilesWithValidEmit.forEach(function (tsFile) {
                var status = fileStatusCache_1.getFileStatus(tsFile);
                status.emitDiffers = false;
            });
            resp.tsFilesWithInvalidEmit.forEach(function (tsFile) {
                var status = fileStatusCache_1.getFileStatus(tsFile);
                status.emitDiffers = true;
            });
            mainPanelView_1.panelView.updateFileStatus(filePath);
        });
    });
    var handleGoToDeclaration = function handleGoToDeclaration(e) {
        if (!atomUtils.commandForTypeScript(e)) return;
        parent.getDefinitionsAtPosition(atomUtils.getFilePathPosition()).then(function (res) {
            var definitions = res.definitions;
            if (!definitions || !definitions.length) {
                atom.notifications.addInfo("AtomTS: No definition found.");
                return;
            }
            if (definitions.length > 1) {
                simpleSelectionView_1.simpleSelectionView({
                    items: definitions,
                    viewForItem: function viewForItem(item) {
                        return "\n                            <span>" + item.filePath + "</span>\n                            <div class=\"pull-right\">line: " + item.position.line + "</div>\n                        ";
                    },
                    filterKey: "filePath",
                    confirmed: function confirmed(definition) {
                        atom.workspace.open(definition.filePath, {
                            initialLine: definition.position.line,
                            initialColumn: definition.position.col
                        });
                    }
                });
            } else {
                var definition = definitions[0];
                atom.workspace.open(definition.filePath, {
                    initialLine: definition.position.line,
                    initialColumn: definition.position.col
                });
            }
        });
    };
    atom.commands.add("atom-workspace", "typescript:go-to-declaration", handleGoToDeclaration);
    atom.commands.add("atom-text-editor", "symbols-view:go-to-declaration", handleGoToDeclaration);
    atom.commands.add("atom-workspace", "typescript:create-tsconfig.json-project-file", function (e) {
        if (!atomUtils.commandForTypeScript(e)) return;
        var editor = atom.workspace.getActiveTextEditor();
        var filePath = editor.getPath();
        parent.createProject({ filePath: filePath }).then(function (res) {
            if (res.createdFilePath) {
                atom.notifications.addSuccess("tsconfig.json file created: <br/> " + res.createdFilePath);
            }
        });
    });
    var theContextView;
    atom.commands.add("atom-text-editor", "typescript:context-actions", function (e) {
        if (!theContextView) theContextView = new contextView.ContextView();
        theContextView.show();
    });
    atom.commands.add("atom-text-editor", "typescript:autocomplete", function (e) {
        autoCompleteProvider.triggerAutocompletePlus();
    });
    atom.commands.add("atom-text-editor", "typescript:bas-development-testing", function (e) {
        // documentationView.docView.hide();
        // documentationView.docView.autoPosition();
        // documentationView.testDocumentationView();
        // parent.debugLanguageServiceHostVersion({ filePath: atom.workspace.getActiveEditor().getPath() })
        //     .then((res) => {
        //     console.log(res.text.length);
        //     // console.log(JSON.stringify({txt:res.text}))
        // });
        atom.commands.dispatch(atom.views.getView(atom.workspace.getActiveTextEditor()), "typescript:testing-r-view");
    });
    atom.commands.add("atom-text-editor", "typescript:rename-refactor", function (e) {
        var editor = atom.workspace.getActiveTextEditor();
        var matched = atomUtils.editorInTheseScopes([atomUtils.knownScopes.es6import, atomUtils.knownScopes.require]);
        if (matched) {
            var relativePath = editor.getTextInRange(editor.bufferRangeForScopeAtCursor(matched)).replace(/['"]+/g, "");
            if (!utils.pathIsRelative(relativePath)) {
                atom.notifications.addInfo("AtomTS: Can only rename external modules if they are relative files!");
                return;
            }
            var completePath = path.resolve(path.dirname(atomUtils.getCurrentPath()), relativePath) + ".ts";
            renameView.panelView.renameThis({
                autoSelect: false,
                title: "Rename File",
                text: completePath,
                openFiles: [],
                closedFiles: [],
                onCancel: function onCancel() {},
                onValidate: function onValidate(newText) {
                    if (!newText.trim()) {
                        return "If you want to abort : Press esc to exit";
                    }
                    return "";
                },
                onCommit: function onCommit(newText) {
                    newText = newText.trim();
                    parent.getRenameFilesRefactorings({ oldPath: completePath, newPath: newText }).then(function (res) {
                        applyRefactorings(res.refactorings);
                    });
                }
            });
            atom.notifications.addInfo("AtomTS: File rename comming soon!");
        } else {
            parent.getRenameInfo(atomUtils.getFilePathPosition()).then(function (res) {
                if (!res.canRename) {
                    atom.notifications.addInfo("AtomTS: Rename not available at cursor location");
                    return;
                }
                var paths = atomUtils.getOpenTypeScritEditorsConsistentPaths();
                var openPathsMap = utils.createMap(paths);
                var refactorPaths = Object.keys(res.locations);
                var openFiles = refactorPaths.filter(function (p) {
                    return openPathsMap[p];
                });
                var closedFiles = refactorPaths.filter(function (p) {
                    return !openPathsMap[p];
                });
                renameView.panelView.renameThis({
                    autoSelect: true,
                    title: "Rename Variable",
                    text: res.displayName,
                    openFiles: openFiles,
                    closedFiles: closedFiles,
                    onCancel: function onCancel() {},
                    onValidate: function onValidate(newText) {
                        if (newText.replace(/\s/g, "") !== newText.trim()) {
                            return "The new variable must not contain a space";
                        }
                        if (!newText.trim()) {
                            return "If you want to abort : Press esc to exit";
                        }
                        return "";
                    },
                    onCommit: function onCommit(newText) {
                        newText = newText.trim();
                        atomUtils.getEditorsForAllPaths(Object.keys(res.locations)).then(function (editorMap) {
                            Object.keys(res.locations).forEach(function (filePath) {
                                var editor = editorMap[filePath];
                                editor.transact(function () {
                                    res.locations[filePath].forEach(function (textSpan) {
                                        var range = atomUtils.getRangeForTextSpan(editor, textSpan);
                                        editor.setTextInBufferRange(range, newText);
                                    });
                                });
                            });
                        });
                    }
                });
            });
        }
    });
    atom.commands.add("atom-workspace", "typescript:go-to-next", function (e) {
        gotoHistory.gotoNext();
    });
    atom.commands.add("atom-workspace", "typescript:go-to-previous", function (e) {
        gotoHistory.gotoPrevious();
    });
    atom.commands.add("atom-workspace", "typescript:find-references", function (e) {
        if (!atomUtils.commandForTypeScript(e)) return;
        parent.getReferences(atomUtils.getFilePathPosition()).then(function (res) {
            mainPanelView_1.panelView.setReferences(res.references);
            simpleSelectionView_1.simpleSelectionView({
                items: res.references,
                viewForItem: function viewForItem(item) {
                    return "<div>\n                        <span>" + atom.project.relativize(item.filePath) + "</span>\n                        <div class=\"pull-right\">line: " + item.position.line + "</div>\n                        <ts-view>" + item.preview + "</ts-view>\n                    <div>";
                },
                filterKey: utils.getName(function () {
                    return res.references[0].filePath;
                }),
                confirmed: function confirmed(definition) {
                    atom.workspace.open(definition.filePath, {
                        initialLine: definition.position.line,
                        initialColumn: definition.position.col
                    });
                }
            });
        });
    });
    var theFileSymbolsView;
    var showFileSymbols = utils.debounce(function (filePath) {
        if (!theFileSymbolsView) theFileSymbolsView = new fileSymbolsView.FileSymbolsView();
        parent.getNavigationBarItems({ filePath: filePath }).then(function (res) {
            theFileSymbolsView.setNavBarItems(res.items, filePath);
            theFileSymbolsView.show();
        });
    }, 400);
    atom.commands.add(".platform-linux atom-text-editor, .platform-darwin atom-text-editor,.platform-win32 atom-text-editor", "symbols-view:toggle-file-symbols", function (e) {
        var editor = atom.workspace.getActiveTextEditor();
        if (!editor) return false;
        if (path.extname(editor.getPath()) !== ".ts") return false;
        e.abortKeyBinding();
        var filePath = editor.getPath();
        showFileSymbols(filePath);
    });
    var theProjectSymbolsView;
    var showProjectSymbols = utils.debounce(function (filePath) {
        if (!theProjectSymbolsView) theProjectSymbolsView = new projectSymbolsView.ProjectSymbolsView();
        parent.getNavigateToItems({ filePath: filePath }).then(function (res) {
            theProjectSymbolsView.setNavBarItems(res.items);
            theProjectSymbolsView.show();
        });
    }, 400);
    atom.commands.add(".platform-linux atom-text-editor, .platform-darwin atom-text-editor,.platform-win32 atom-text-editor", "symbols-view:toggle-project-symbols", function (e) {
        var editor = atom.workspace.getActiveTextEditor();
        if (!editor) return false;
        if (path.extname(editor.getPath()) !== ".ts") return false;
        e.abortKeyBinding();
        var filePath = editor.getPath();
        showProjectSymbols(filePath);
    });
    atomUtils.registerOpener({
        commandSelector: "atom-text-editor",
        commandName: "typescript:ast",
        uriProtocol: astView_1.astURI,
        getData: function getData() {
            return {
                text: atom.workspace.getActiveTextEditor().getText(),
                filePath: atomUtils.getCurrentPath()
            };
        },
        onOpen: function onOpen(data) {
            return new astView_1.AstView(data.filePath, data.text, false);
        }
    });
    atomUtils.registerOpener({
        commandSelector: "atom-text-editor",
        commandName: "typescript:ast-full",
        uriProtocol: astView_1.astURIFull,
        getData: function getData() {
            return {
                text: atom.workspace.getActiveTextEditor().getText(),
                filePath: atomUtils.getCurrentPath()
            };
        },
        onOpen: function onOpen(data) {
            return new astView_1.AstView(data.filePath, data.text, true);
        }
    });
    atomUtils.registerOpener({
        commandSelector: "atom-workspace",
        commandName: "typescript:dependency-view",
        uriProtocol: dependencyView_1.dependencyURI,
        getData: function getData() {
            return {
                filePath: atomUtils.getCurrentPath()
            };
        },
        onOpen: function onOpen(data) {
            return new dependencyView_1.DependencyView(data.filePath);
        }
    });
    atom.commands.add("atom-text-editor", "typescript:quick-fix", function (e) {
        if (!atomUtils.commandForTypeScript(e)) return;
        var editor = atomUtils.getActiveEditor();
        var query = atomUtils.getFilePathPosition();
        parent.getQuickFixes(query).then(function (result) {
            if (!result.fixes.length) {
                atom.notifications.addInfo("AtomTS: No QuickFixes for current cursor position");
                return;
            }
            simpleOverlaySelectionView_1["default"]({
                items: result.fixes,
                viewForItem: function viewForItem(item) {
                    return "<div>\n                        " + (item.isNewTextSnippet ? "<span class=\"icon-move-right\"></span>" : "") + "\n                        " + escapeHtml(item.display) + "\n                    </div>";
                },
                filterKey: "display",
                confirmed: function confirmed(item) {
                    // NOTE: we can special case UI's here if we want.
                    parent.applyQuickFix({ key: item.key, filePath: query.filePath, position: query.position }).then(function (res) {
                        applyRefactorings(res.refactorings);
                    });
                }
            }, editor);
        });
    });
    atomUtils.registerOpener({
        commandSelector: "atom-workspace",
        commandName: "typescript:testing-r-view",
        uriProtocol: rView.RView.protocol,
        getData: function getData() {
            return atomUtils.getFilePath();
        },
        onOpen: function onOpen(data) {
            return new rView.RView({
                icon: "repo-forked",
                title: "React View",
                filePath: data.filePath
            });
        }
    });
    atom.commands.add("atom-workspace", "typescript:sync", function (e) {
        if (!atomUtils.commandForTypeScript(e)) return;
        mainPanelView_1.panelView.softReset();
    });
}
exports.registerCommands = registerCommands;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9hdG9tLXR5cGVzY3JpcHQvZGlzdC9tYWluL2F0b20vY29tbWFuZHMvY29tbWFuZHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxRQUFRLENBQUMsQ0FBQyxFQUFFO0FBQ2pCLFNBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDdEU7QUFDRCxJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsd0JBQXdCLENBQUMsQ0FBQztBQUMvQyxJQUFJLFNBQVMsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDeEMsSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3hDLElBQUksb0JBQW9CLEdBQUcsT0FBTyxDQUFDLHlCQUF5QixDQUFDLENBQUM7QUFDOUQsSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzNCLElBQUksVUFBVSxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0FBQ2hELElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO0FBQy9DLElBQUksV0FBVyxHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0FBQ2xELElBQUksZUFBZSxHQUFHLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0FBQzFELElBQUksa0JBQWtCLEdBQUcsT0FBTyxDQUFDLDZCQUE2QixDQUFDLENBQUM7QUFDaEUsSUFBSSxXQUFXLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDNUMsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7QUFDeEMsSUFBSSxlQUFlLEdBQUcsT0FB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RUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxHQUFHLEVBQUU7QUFDNUcseUNBQWlCLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO3FCQUN2QyxDQUFDLENBQUM7aUJBQ047YUFDSixFQUFFLE1BQU0sQ0FBQyxDQUFDO1NBQ2QsQ0FBQyxDQUFDO0tBQ04sQ0FBQyxDQUFDO0FBQ0gsYUFBUyxDQUFDLGNBQWMsQ0FBQztBQUNyQix1QkFBZSxFQUFFLGdCQUFnQjtBQUNqQyxtQkFBVyxFQUFFLDJCQUEyQjtBQUN4QyxtQkFBVyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsUUFBUTtBQUNqQyxlQUFPLEVBQUUsbUJBQVk7QUFBRSxtQkFBTyxTQUFTLENBQUMsV0FBVyxFQUFFLENBQUM7U0FBRTtBQUN4RCxjQUFNLEVBQUUsZ0JBQVUsSUFBSSxFQUFFO0FBQUUsbUJBQU8sSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDO0FBQzdDLG9CQUFJLEVBQUUsYUFBYTtBQUNuQixxQkFBSyxFQUFFLFlBQVk7QUFDbkIsd0JBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTthQUMxQixDQUFDLENBQUM7U0FBRTtLQUNSLENBQUMsQ0FBQztBQUNILFFBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLGdCQUFnQixFQUFFLGlCQUFpQixFQUFFLFVBQVUsQ0FBQyxFQUFFO0FBQ2hFLFlBQUksQ0FBQyxTQUFTLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLEVBQ2xDLE9BQU87QUFDWCx1QkFBZSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztLQUN6QyxDQUFDLENBQUM7Q0FDTjtBQUNELE9BQU8sQ0FBQyxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQyIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvYXRvbS10eXBlc2NyaXB0L2Rpc3QvbWFpbi9hdG9tL2NvbW1hbmRzL2NvbW1hbmRzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiZnVuY3Rpb24gX19leHBvcnQobSkge1xuICAgIGZvciAodmFyIHAgaW4gbSkgaWYgKCFleHBvcnRzLmhhc093blByb3BlcnR5KHApKSBleHBvcnRzW3BdID0gbVtwXTtcbn1cbnZhciBwYXJlbnQgPSByZXF1aXJlKFwiLi4vLi4vLi4vd29ya2VyL3BhcmVudFwiKTtcbnZhciBidWlsZFZpZXcgPSByZXF1aXJlKFwiLi4vYnVpbGRWaWV3XCIpO1xudmFyIGF0b21VdGlscyA9IHJlcXVpcmUoXCIuLi9hdG9tVXRpbHNcIik7XG52YXIgYXV0b0NvbXBsZXRlUHJvdmlkZXIgPSByZXF1aXJlKFwiLi4vYXV0b0NvbXBsZXRlUHJvdmlkZXJcIik7XG52YXIgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbnZhciByZW5hbWVWaWV3ID0gcmVxdWlyZShcIi4uL3ZpZXdzL3JlbmFtZVZpZXdcIik7XG52YXIgYXBkID0gcmVxdWlyZSgnYXRvbS1wYWNrYWdlLWRlcGVuZGVuY2llcycpO1xudmFyIGNvbnRleHRWaWV3ID0gcmVxdWlyZShcIi4uL3ZpZXdzL2NvbnRleHRWaWV3XCIpO1xudmFyIGZpbGVTeW1ib2xzVmlldyA9IHJlcXVpcmUoXCIuLi92aWV3cy9maWxlU3ltYm9sc1ZpZXdcIik7XG52YXIgcHJvamVjdFN5bWJvbHNWaWV3ID0gcmVxdWlyZShcIi4uL3ZpZXdzL3Byb2plY3RTeW1ib2xzVmlld1wiKTtcbnZhciBnb3RvSGlzdG9yeSA9IHJlcXVpcmUoXCIuLi9nb3RvSGlzdG9yeVwiKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoXCIuLi8uLi9sYW5nL3V0aWxzXCIpO1xudmFyIG1haW5QYW5lbFZpZXdfMSA9IHJlcXVpcmUoXCIuLi92aWV3cy9tYWluUGFuZWxWaWV3XCIpO1xudmFyIGFzdFZpZXdfMSA9IHJlcXVpcmUoXCIuLi92aWV3cy9hc3RWaWV3XCIpO1xudmFyIGRlcGVuZGVuY3lWaWV3XzEgPSByZXF1aXJlKFwiLi4vdmlld3MvZGVwZW5kZW5jeVZpZXdcIik7XG52YXIgc2ltcGxlU2VsZWN0aW9uVmlld18xID0gcmVxdWlyZShcIi4uL3ZpZXdzL3NpbXBsZVNlbGVjdGlvblZpZXdcIik7XG52YXIgc2ltcGxlT3ZlcmxheVNlbGVjdGlvblZpZXdfMSA9IHJlcXVpcmUoXCIuLi92aWV3cy9zaW1wbGVPdmVybGF5U2VsZWN0aW9uVmlld1wiKTtcbnZhciBvdXRwdXRGaWxlQ29tbWFuZHMgPSByZXF1aXJlKFwiLi9vdXRwdXRGaWxlQ29tbWFuZHNcIik7XG52YXIgbW92ZUZpbGVzSGFuZGxpbmdfMSA9IHJlcXVpcmUoXCIuL21vdmVGaWxlc0hhbmRsaW5nXCIpO1xudmFyIGVzY2FwZUh0bWwgPSByZXF1aXJlKCdlc2NhcGUtaHRtbCcpO1xudmFyIHJWaWV3ID0gcmVxdWlyZShcIi4uL3ZpZXdzL3JWaWV3XCIpO1xudmFyIHJlYWN0Q29tbWFuZHNfMSA9IHJlcXVpcmUoXCIuL3JlYWN0Q29tbWFuZHNcIik7XG52YXIgZmlsZVN0YXR1c0NhY2hlXzEgPSByZXF1aXJlKFwiLi4vZmlsZVN0YXR1c0NhY2hlXCIpO1xudmFyIGpzb24yZHRzQ29tbWFuZHNfMSA9IHJlcXVpcmUoXCIuL2pzb24yZHRzQ29tbWFuZHNcIik7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi4vY29tcG9uZW50cy9jb21wb25lbnRSZWdpc3RyeVwiKSk7XG5mdW5jdGlvbiByZWdpc3RlckNvbW1hbmRzKCkge1xuICAgIG91dHB1dEZpbGVDb21tYW5kcy5yZWdpc3RlcigpO1xuICAgIG1vdmVGaWxlc0hhbmRsaW5nXzEucmVnaXN0ZXJSZW5hbWVIYW5kbGluZygpO1xuICAgIHJlYWN0Q29tbWFuZHNfMS5yZWdpc3RlclJlYWN0Q29tbWFuZHMoKTtcbiAgICBqc29uMmR0c0NvbW1hbmRzXzEucmVnaXN0ZXJKc29uMmR0c0NvbW1hbmRzKCk7XG4gICAgZnVuY3Rpb24gYXBwbHlSZWZhY3RvcmluZ3MocmVmYWN0b3JpbmdzKSB7XG4gICAgICAgIHZhciBwYXRocyA9IGF0b21VdGlscy5nZXRPcGVuVHlwZVNjcml0RWRpdG9yc0NvbnNpc3RlbnRQYXRocygpO1xuICAgICAgICB2YXIgb3BlblBhdGhzTWFwID0gdXRpbHMuY3JlYXRlTWFwKHBhdGhzKTtcbiAgICAgICAgdmFyIHJlZmFjdG9yUGF0aHMgPSBPYmplY3Qua2V5cyhyZWZhY3RvcmluZ3MpO1xuICAgICAgICB2YXIgb3BlbkZpbGVzID0gcmVmYWN0b3JQYXRocy5maWx0ZXIoZnVuY3Rpb24gKHApIHsgcmV0dXJuIG9wZW5QYXRoc01hcFtwXTsgfSk7XG4gICAgICAgIHZhciBjbG9zZWRGaWxlcyA9IHJlZmFjdG9yUGF0aHMuZmlsdGVyKGZ1bmN0aW9uIChwKSB7IHJldHVybiAhb3BlblBhdGhzTWFwW3BdOyB9KTtcbiAgICAgICAgYXRvbVV0aWxzLmdldEVkaXRvcnNGb3JBbGxQYXRocyhyZWZhY3RvclBhdGhzKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKGVkaXRvck1hcCkge1xuICAgICAgICAgICAgcmVmYWN0b3JQYXRocy5mb3JFYWNoKGZ1bmN0aW9uIChmaWxlUGF0aCkge1xuICAgICAgICAgICAgICAgIHZhciBlZGl0b3IgPSBlZGl0b3JNYXBbZmlsZVBhdGhdO1xuICAgICAgICAgICAgICAgIGVkaXRvci50cmFuc2FjdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlZmFjdG9yaW5nc1tmaWxlUGF0aF0uZm9yRWFjaChmdW5jdGlvbiAocmVmYWN0b3JpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByYW5nZSA9IGF0b21VdGlscy5nZXRSYW5nZUZvclRleHRTcGFuKGVkaXRvciwgcmVmYWN0b3Jpbmcuc3Bhbik7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlZmFjdG9yaW5nLmlzTmV3VGV4dFNuaXBwZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3Iuc2V0VGV4dEluQnVmZmVyUmFuZ2UocmFuZ2UsIHJlZmFjdG9yaW5nLm5ld1RleHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnNvciA9IGVkaXRvci5nZXRDdXJzb3JzKClbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yLnNlbGVjdGlvbi5zZXRCdWZmZXJSYW5nZShyYW5nZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXRvbVV0aWxzLmluc2VydFNuaXBwZXQocmVmYWN0b3JpbmcubmV3VGV4dCwgZWRpdG9yLCBjdXJzb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20tdGV4dC1lZGl0b3InLCAndHlwZXNjcmlwdDpmb3JtYXQtY29kZScsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGlmICghYXRvbVV0aWxzLmNvbW1hbmRGb3JUeXBlU2NyaXB0KGUpKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB2YXIgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICAgICAgICB2YXIgZmlsZVBhdGggPSBlZGl0b3IuZ2V0UGF0aCgpO1xuICAgICAgICB2YXIgc2VsZWN0aW9uID0gZWRpdG9yLmdldFNlbGVjdGVkQnVmZmVyUmFuZ2UoKTtcbiAgICAgICAgaWYgKHNlbGVjdGlvbi5pc0VtcHR5KCkpIHtcbiAgICAgICAgICAgIHBhcmVudC5mb3JtYXREb2N1bWVudCh7IGZpbGVQYXRoOiBmaWxlUGF0aCB9KS50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXJlc3VsdC5lZGl0cy5sZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICBlZGl0b3IudHJhbnNhY3QoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBhdG9tVXRpbHMuZm9ybWF0Q29kZShlZGl0b3IsIHJlc3VsdC5lZGl0cyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBhcmVudC5mb3JtYXREb2N1bWVudFJhbmdlKHsgZmlsZVBhdGg6IGZpbGVQYXRoLCBzdGFydDogeyBsaW5lOiBzZWxlY3Rpb24uc3RhcnQucm93LCBjb2w6IHNlbGVjdGlvbi5zdGFydC5jb2x1bW4gfSwgZW5kOiB7IGxpbmU6IHNlbGVjdGlvbi5lbmQucm93LCBjb2w6IHNlbGVjdGlvbi5lbmQuY29sdW1uIH0gfSkudGhlbihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXN1bHQuZWRpdHMubGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgZWRpdG9yLnRyYW5zYWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgYXRvbVV0aWxzLmZvcm1hdENvZGUoZWRpdG9yLCByZXN1bHQuZWRpdHMpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCAndHlwZXNjcmlwdDpidWlsZCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGlmICghYXRvbVV0aWxzLmNvbW1hbmRGb3JUeXBlU2NyaXB0KGUpKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB2YXIgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICAgICAgICB2YXIgZmlsZVBhdGggPSBlZGl0b3IuZ2V0UGF0aCgpO1xuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbygnQnVpbGRpbmcnKTtcbiAgICAgICAgcGFyZW50LmJ1aWxkKHsgZmlsZVBhdGg6IGZpbGVQYXRoIH0pLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgICAgIGJ1aWxkVmlldy5zZXRCdWlsZE91dHB1dChyZXNwLmJ1aWxkT3V0cHV0KTtcbiAgICAgICAgICAgIHJlc3AudHNGaWxlc1dpdGhWYWxpZEVtaXQuZm9yRWFjaChmdW5jdGlvbiAodHNGaWxlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXR1cyA9IGZpbGVTdGF0dXNDYWNoZV8xLmdldEZpbGVTdGF0dXModHNGaWxlKTtcbiAgICAgICAgICAgICAgICBzdGF0dXMuZW1pdERpZmZlcnMgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmVzcC50c0ZpbGVzV2l0aEludmFsaWRFbWl0LmZvckVhY2goZnVuY3Rpb24gKHRzRmlsZSkge1xuICAgICAgICAgICAgICAgIHZhciBzdGF0dXMgPSBmaWxlU3RhdHVzQ2FjaGVfMS5nZXRGaWxlU3RhdHVzKHRzRmlsZSk7XG4gICAgICAgICAgICAgICAgc3RhdHVzLmVtaXREaWZmZXJzID0gdHJ1ZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgbWFpblBhbmVsVmlld18xLnBhbmVsVmlldy51cGRhdGVGaWxlU3RhdHVzKGZpbGVQYXRoKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgdmFyIGhhbmRsZUdvVG9EZWNsYXJhdGlvbiA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGlmICghYXRvbVV0aWxzLmNvbW1hbmRGb3JUeXBlU2NyaXB0KGUpKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBwYXJlbnQuZ2V0RGVmaW5pdGlvbnNBdFBvc2l0aW9uKGF0b21VdGlscy5nZXRGaWxlUGF0aFBvc2l0aW9uKCkpLnRoZW4oZnVuY3Rpb24gKHJlcykge1xuICAgICAgICAgICAgdmFyIGRlZmluaXRpb25zID0gcmVzLmRlZmluaXRpb25zO1xuICAgICAgICAgICAgaWYgKCFkZWZpbml0aW9ucyB8fCAhZGVmaW5pdGlvbnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8oJ0F0b21UUzogTm8gZGVmaW5pdGlvbiBmb3VuZC4nKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZGVmaW5pdGlvbnMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgIHNpbXBsZVNlbGVjdGlvblZpZXdfMS5zaW1wbGVTZWxlY3Rpb25WaWV3KHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbXM6IGRlZmluaXRpb25zLFxuICAgICAgICAgICAgICAgICAgICB2aWV3Rm9ySXRlbTogZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcIlxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj5cIiArIGl0ZW0uZmlsZVBhdGggKyBcIjwvc3Bhbj5cXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwicHVsbC1yaWdodFxcXCI+bGluZTogXCIgKyBpdGVtLnBvc2l0aW9uLmxpbmUgKyBcIjwvZGl2PlxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJLZXk6ICdmaWxlUGF0aCcsXG4gICAgICAgICAgICAgICAgICAgIGNvbmZpcm1lZDogZnVuY3Rpb24gKGRlZmluaXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4oZGVmaW5pdGlvbi5maWxlUGF0aCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluaXRpYWxMaW5lOiBkZWZpbml0aW9uLnBvc2l0aW9uLmxpbmUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5pdGlhbENvbHVtbjogZGVmaW5pdGlvbi5wb3NpdGlvbi5jb2xcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgZGVmaW5pdGlvbiA9IGRlZmluaXRpb25zWzBdO1xuICAgICAgICAgICAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4oZGVmaW5pdGlvbi5maWxlUGF0aCwge1xuICAgICAgICAgICAgICAgICAgICBpbml0aWFsTGluZTogZGVmaW5pdGlvbi5wb3NpdGlvbi5saW5lLFxuICAgICAgICAgICAgICAgICAgICBpbml0aWFsQ29sdW1uOiBkZWZpbml0aW9uLnBvc2l0aW9uLmNvbFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXdvcmtzcGFjZScsICd0eXBlc2NyaXB0OmdvLXRvLWRlY2xhcmF0aW9uJywgaGFuZGxlR29Ub0RlY2xhcmF0aW9uKTtcbiAgICBhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS10ZXh0LWVkaXRvcicsICdzeW1ib2xzLXZpZXc6Z28tdG8tZGVjbGFyYXRpb24nLCBoYW5kbGVHb1RvRGVjbGFyYXRpb24pO1xuICAgIGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXdvcmtzcGFjZScsICd0eXBlc2NyaXB0OmNyZWF0ZS10c2NvbmZpZy5qc29uLXByb2plY3QtZmlsZScsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGlmICghYXRvbVV0aWxzLmNvbW1hbmRGb3JUeXBlU2NyaXB0KGUpKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB2YXIgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICAgICAgICB2YXIgZmlsZVBhdGggPSBlZGl0b3IuZ2V0UGF0aCgpO1xuICAgICAgICBwYXJlbnQuY3JlYXRlUHJvamVjdCh7IGZpbGVQYXRoOiBmaWxlUGF0aCB9KS50aGVuKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgICAgIGlmIChyZXMuY3JlYXRlZEZpbGVQYXRoKSB7XG4gICAgICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFN1Y2Nlc3MoXCJ0c2NvbmZpZy5qc29uIGZpbGUgY3JlYXRlZDogPGJyLz4gXCIgKyByZXMuY3JlYXRlZEZpbGVQYXRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgdmFyIHRoZUNvbnRleHRWaWV3O1xuICAgIGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXRleHQtZWRpdG9yJywgJ3R5cGVzY3JpcHQ6Y29udGV4dC1hY3Rpb25zJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKCF0aGVDb250ZXh0VmlldylcbiAgICAgICAgICAgIHRoZUNvbnRleHRWaWV3ID0gbmV3IGNvbnRleHRWaWV3LkNvbnRleHRWaWV3KCk7XG4gICAgICAgIHRoZUNvbnRleHRWaWV3LnNob3coKTtcbiAgICB9KTtcbiAgICBhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS10ZXh0LWVkaXRvcicsICd0eXBlc2NyaXB0OmF1dG9jb21wbGV0ZScsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGF1dG9Db21wbGV0ZVByb3ZpZGVyLnRyaWdnZXJBdXRvY29tcGxldGVQbHVzKCk7XG4gICAgfSk7XG4gICAgYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20tdGV4dC1lZGl0b3InLCAndHlwZXNjcmlwdDpiYXMtZGV2ZWxvcG1lbnQtdGVzdGluZycsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIC8vIGRvY3VtZW50YXRpb25WaWV3LmRvY1ZpZXcuaGlkZSgpO1xuICAgICAgICAvLyBkb2N1bWVudGF0aW9uVmlldy5kb2NWaWV3LmF1dG9Qb3NpdGlvbigpO1xuICAgICAgICAvLyBkb2N1bWVudGF0aW9uVmlldy50ZXN0RG9jdW1lbnRhdGlvblZpZXcoKTtcbiAgICAgICAgLy8gcGFyZW50LmRlYnVnTGFuZ3VhZ2VTZXJ2aWNlSG9zdFZlcnNpb24oeyBmaWxlUGF0aDogYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlRWRpdG9yKCkuZ2V0UGF0aCgpIH0pXG4gICAgICAgIC8vICAgICAudGhlbigocmVzKSA9PiB7XG4gICAgICAgIC8vICAgICBjb25zb2xlLmxvZyhyZXMudGV4dC5sZW5ndGgpO1xuICAgICAgICAvLyAgICAgLy8gY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkoe3R4dDpyZXMudGV4dH0pKVxuICAgICAgICAvLyB9KTtcbiAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpKSwgJ3R5cGVzY3JpcHQ6dGVzdGluZy1yLXZpZXcnKTtcbiAgICB9KTtcbiAgICBhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS10ZXh0LWVkaXRvcicsICd0eXBlc2NyaXB0OnJlbmFtZS1yZWZhY3RvcicsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHZhciBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XG4gICAgICAgIHZhciBtYXRjaGVkID0gYXRvbVV0aWxzLmVkaXRvckluVGhlc2VTY29wZXMoW2F0b21VdGlscy5rbm93blNjb3Blcy5lczZpbXBvcnQsIGF0b21VdGlscy5rbm93blNjb3Blcy5yZXF1aXJlXSk7XG4gICAgICAgIGlmIChtYXRjaGVkKSB7XG4gICAgICAgICAgICB2YXIgcmVsYXRpdmVQYXRoID0gZWRpdG9yLmdldFRleHRJblJhbmdlKGVkaXRvci5idWZmZXJSYW5nZUZvclNjb3BlQXRDdXJzb3IobWF0Y2hlZCkpLnJlcGxhY2UoL1snXCJdKy9nLCAnJyk7XG4gICAgICAgICAgICBpZiAoIXV0aWxzLnBhdGhJc1JlbGF0aXZlKHJlbGF0aXZlUGF0aCkpIHtcbiAgICAgICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbygnQXRvbVRTOiBDYW4gb25seSByZW5hbWUgZXh0ZXJuYWwgbW9kdWxlcyBpZiB0aGV5IGFyZSByZWxhdGl2ZSBmaWxlcyEnKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgY29tcGxldGVQYXRoID0gcGF0aC5yZXNvbHZlKHBhdGguZGlybmFtZShhdG9tVXRpbHMuZ2V0Q3VycmVudFBhdGgoKSksIHJlbGF0aXZlUGF0aCkgKyAnLnRzJztcbiAgICAgICAgICAgIHJlbmFtZVZpZXcucGFuZWxWaWV3LnJlbmFtZVRoaXMoe1xuICAgICAgICAgICAgICAgIGF1dG9TZWxlY3Q6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHRpdGxlOiAnUmVuYW1lIEZpbGUnLFxuICAgICAgICAgICAgICAgIHRleHQ6IGNvbXBsZXRlUGF0aCxcbiAgICAgICAgICAgICAgICBvcGVuRmlsZXM6IFtdLFxuICAgICAgICAgICAgICAgIGNsb3NlZEZpbGVzOiBbXSxcbiAgICAgICAgICAgICAgICBvbkNhbmNlbDogZnVuY3Rpb24gKCkgeyB9LFxuICAgICAgICAgICAgICAgIG9uVmFsaWRhdGU6IGZ1bmN0aW9uIChuZXdUZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghbmV3VGV4dC50cmltKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnSWYgeW91IHdhbnQgdG8gYWJvcnQgOiBQcmVzcyBlc2MgdG8gZXhpdCc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb25Db21taXQ6IGZ1bmN0aW9uIChuZXdUZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld1RleHQgPSBuZXdUZXh0LnRyaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50LmdldFJlbmFtZUZpbGVzUmVmYWN0b3JpbmdzKHsgb2xkUGF0aDogY29tcGxldGVQYXRoLCBuZXdQYXRoOiBuZXdUZXh0IH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAocmVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcHBseVJlZmFjdG9yaW5ncyhyZXMucmVmYWN0b3JpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbygnQXRvbVRTOiBGaWxlIHJlbmFtZSBjb21taW5nIHNvb24hJyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwYXJlbnQuZ2V0UmVuYW1lSW5mbyhhdG9tVXRpbHMuZ2V0RmlsZVBhdGhQb3NpdGlvbigpKS50aGVuKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXJlcy5jYW5SZW5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8oJ0F0b21UUzogUmVuYW1lIG5vdCBhdmFpbGFibGUgYXQgY3Vyc29yIGxvY2F0aW9uJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHBhdGhzID0gYXRvbVV0aWxzLmdldE9wZW5UeXBlU2NyaXRFZGl0b3JzQ29uc2lzdGVudFBhdGhzKCk7XG4gICAgICAgICAgICAgICAgdmFyIG9wZW5QYXRoc01hcCA9IHV0aWxzLmNyZWF0ZU1hcChwYXRocyk7XG4gICAgICAgICAgICAgICAgdmFyIHJlZmFjdG9yUGF0aHMgPSBPYmplY3Qua2V5cyhyZXMubG9jYXRpb25zKTtcbiAgICAgICAgICAgICAgICB2YXIgb3BlbkZpbGVzID0gcmVmYWN0b3JQYXRocy5maWx0ZXIoZnVuY3Rpb24gKHApIHsgcmV0dXJuIG9wZW5QYXRoc01hcFtwXTsgfSk7XG4gICAgICAgICAgICAgICAgdmFyIGNsb3NlZEZpbGVzID0gcmVmYWN0b3JQYXRocy5maWx0ZXIoZnVuY3Rpb24gKHApIHsgcmV0dXJuICFvcGVuUGF0aHNNYXBbcF07IH0pO1xuICAgICAgICAgICAgICAgIHJlbmFtZVZpZXcucGFuZWxWaWV3LnJlbmFtZVRoaXMoe1xuICAgICAgICAgICAgICAgICAgICBhdXRvU2VsZWN0OiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ1JlbmFtZSBWYXJpYWJsZScsXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IHJlcy5kaXNwbGF5TmFtZSxcbiAgICAgICAgICAgICAgICAgICAgb3BlbkZpbGVzOiBvcGVuRmlsZXMsXG4gICAgICAgICAgICAgICAgICAgIGNsb3NlZEZpbGVzOiBjbG9zZWRGaWxlcyxcbiAgICAgICAgICAgICAgICAgICAgb25DYW5jZWw6IGZ1bmN0aW9uICgpIHsgfSxcbiAgICAgICAgICAgICAgICAgICAgb25WYWxpZGF0ZTogZnVuY3Rpb24gKG5ld1RleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuZXdUZXh0LnJlcGxhY2UoL1xccy9nLCAnJykgIT09IG5ld1RleHQudHJpbSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdUaGUgbmV3IHZhcmlhYmxlIG11c3Qgbm90IGNvbnRhaW4gYSBzcGFjZSc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW5ld1RleHQudHJpbSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdJZiB5b3Ugd2FudCB0byBhYm9ydCA6IFByZXNzIGVzYyB0byBleGl0JztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgb25Db21taXQ6IGZ1bmN0aW9uIChuZXdUZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdUZXh0ID0gbmV3VGV4dC50cmltKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBhdG9tVXRpbHMuZ2V0RWRpdG9yc0ZvckFsbFBhdGhzKE9iamVjdC5rZXlzKHJlcy5sb2NhdGlvbnMpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChlZGl0b3JNYXApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhyZXMubG9jYXRpb25zKS5mb3JFYWNoKGZ1bmN0aW9uIChmaWxlUGF0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZWRpdG9yID0gZWRpdG9yTWFwW2ZpbGVQYXRoXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLnRyYW5zYWN0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5sb2NhdGlvbnNbZmlsZVBhdGhdLmZvckVhY2goZnVuY3Rpb24gKHRleHRTcGFuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJhbmdlID0gYXRvbVV0aWxzLmdldFJhbmdlRm9yVGV4dFNwYW4oZWRpdG9yLCB0ZXh0U3Bhbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLnNldFRleHRJbkJ1ZmZlclJhbmdlKHJhbmdlLCBuZXdUZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXdvcmtzcGFjZScsICd0eXBlc2NyaXB0OmdvLXRvLW5leHQnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICBnb3RvSGlzdG9yeS5nb3RvTmV4dCgpO1xuICAgIH0pO1xuICAgIGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXdvcmtzcGFjZScsICd0eXBlc2NyaXB0OmdvLXRvLXByZXZpb3VzJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgZ290b0hpc3RvcnkuZ290b1ByZXZpb3VzKCk7XG4gICAgfSk7XG4gICAgYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgJ3R5cGVzY3JpcHQ6ZmluZC1yZWZlcmVuY2VzJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKCFhdG9tVXRpbHMuY29tbWFuZEZvclR5cGVTY3JpcHQoZSkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHBhcmVudC5nZXRSZWZlcmVuY2VzKGF0b21VdGlscy5nZXRGaWxlUGF0aFBvc2l0aW9uKCkpLnRoZW4oZnVuY3Rpb24gKHJlcykge1xuICAgICAgICAgICAgbWFpblBhbmVsVmlld18xLnBhbmVsVmlldy5zZXRSZWZlcmVuY2VzKHJlcy5yZWZlcmVuY2VzKTtcbiAgICAgICAgICAgIHNpbXBsZVNlbGVjdGlvblZpZXdfMS5zaW1wbGVTZWxlY3Rpb25WaWV3KHtcbiAgICAgICAgICAgICAgICBpdGVtczogcmVzLnJlZmVyZW5jZXMsXG4gICAgICAgICAgICAgICAgdmlld0Zvckl0ZW06IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcIjxkaXY+XFxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+XCIgKyBhdG9tLnByb2plY3QucmVsYXRpdml6ZShpdGVtLmZpbGVQYXRoKSArIFwiPC9zcGFuPlxcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcInB1bGwtcmlnaHRcXFwiPmxpbmU6IFwiICsgaXRlbS5wb3NpdGlvbi5saW5lICsgXCI8L2Rpdj5cXG4gICAgICAgICAgICAgICAgICAgICAgICA8dHMtdmlldz5cIiArIGl0ZW0ucHJldmlldyArIFwiPC90cy12aWV3PlxcbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cIjtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGZpbHRlcktleTogdXRpbHMuZ2V0TmFtZShmdW5jdGlvbiAoKSB7IHJldHVybiByZXMucmVmZXJlbmNlc1swXS5maWxlUGF0aDsgfSksXG4gICAgICAgICAgICAgICAgY29uZmlybWVkOiBmdW5jdGlvbiAoZGVmaW5pdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKGRlZmluaXRpb24uZmlsZVBhdGgsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluaXRpYWxMaW5lOiBkZWZpbml0aW9uLnBvc2l0aW9uLmxpbmUsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbml0aWFsQ29sdW1uOiBkZWZpbml0aW9uLnBvc2l0aW9uLmNvbFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgdmFyIHRoZUZpbGVTeW1ib2xzVmlldztcbiAgICB2YXIgc2hvd0ZpbGVTeW1ib2xzID0gdXRpbHMuZGVib3VuY2UoZnVuY3Rpb24gKGZpbGVQYXRoKSB7XG4gICAgICAgIGlmICghdGhlRmlsZVN5bWJvbHNWaWV3KVxuICAgICAgICAgICAgdGhlRmlsZVN5bWJvbHNWaWV3ID0gbmV3IGZpbGVTeW1ib2xzVmlldy5GaWxlU3ltYm9sc1ZpZXcoKTtcbiAgICAgICAgcGFyZW50LmdldE5hdmlnYXRpb25CYXJJdGVtcyh7IGZpbGVQYXRoOiBmaWxlUGF0aCB9KS50aGVuKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgICAgIHRoZUZpbGVTeW1ib2xzVmlldy5zZXROYXZCYXJJdGVtcyhyZXMuaXRlbXMsIGZpbGVQYXRoKTtcbiAgICAgICAgICAgIHRoZUZpbGVTeW1ib2xzVmlldy5zaG93KCk7XG4gICAgICAgIH0pO1xuICAgIH0sIDQwMCk7XG4gICAgYXRvbS5jb21tYW5kcy5hZGQoJy5wbGF0Zm9ybS1saW51eCBhdG9tLXRleHQtZWRpdG9yLCAucGxhdGZvcm0tZGFyd2luIGF0b20tdGV4dC1lZGl0b3IsLnBsYXRmb3JtLXdpbjMyIGF0b20tdGV4dC1lZGl0b3InLCAnc3ltYm9scy12aWV3OnRvZ2dsZS1maWxlLXN5bWJvbHMnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICAgICAgICBpZiAoIWVkaXRvcilcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKHBhdGguZXh0bmFtZShlZGl0b3IuZ2V0UGF0aCgpKSAhPT0gJy50cycpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIGUuYWJvcnRLZXlCaW5kaW5nKCk7XG4gICAgICAgIHZhciBmaWxlUGF0aCA9IGVkaXRvci5nZXRQYXRoKCk7XG4gICAgICAgIHNob3dGaWxlU3ltYm9scyhmaWxlUGF0aCk7XG4gICAgfSk7XG4gICAgdmFyIHRoZVByb2plY3RTeW1ib2xzVmlldztcbiAgICB2YXIgc2hvd1Byb2plY3RTeW1ib2xzID0gdXRpbHMuZGVib3VuY2UoZnVuY3Rpb24gKGZpbGVQYXRoKSB7XG4gICAgICAgIGlmICghdGhlUHJvamVjdFN5bWJvbHNWaWV3KVxuICAgICAgICAgICAgdGhlUHJvamVjdFN5bWJvbHNWaWV3ID0gbmV3IHByb2plY3RTeW1ib2xzVmlldy5Qcm9qZWN0U3ltYm9sc1ZpZXcoKTtcbiAgICAgICAgcGFyZW50LmdldE5hdmlnYXRlVG9JdGVtcyh7IGZpbGVQYXRoOiBmaWxlUGF0aCB9KS50aGVuKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgICAgIHRoZVByb2plY3RTeW1ib2xzVmlldy5zZXROYXZCYXJJdGVtcyhyZXMuaXRlbXMpO1xuICAgICAgICAgICAgdGhlUHJvamVjdFN5bWJvbHNWaWV3LnNob3coKTtcbiAgICAgICAgfSk7XG4gICAgfSwgNDAwKTtcbiAgICBhdG9tLmNvbW1hbmRzLmFkZCgnLnBsYXRmb3JtLWxpbnV4IGF0b20tdGV4dC1lZGl0b3IsIC5wbGF0Zm9ybS1kYXJ3aW4gYXRvbS10ZXh0LWVkaXRvciwucGxhdGZvcm0td2luMzIgYXRvbS10ZXh0LWVkaXRvcicsICdzeW1ib2xzLXZpZXc6dG9nZ2xlLXByb2plY3Qtc3ltYm9scycsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHZhciBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XG4gICAgICAgIGlmICghZWRpdG9yKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiAocGF0aC5leHRuYW1lKGVkaXRvci5nZXRQYXRoKCkpICE9PSAnLnRzJylcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgZS5hYm9ydEtleUJpbmRpbmcoKTtcbiAgICAgICAgdmFyIGZpbGVQYXRoID0gZWRpdG9yLmdldFBhdGgoKTtcbiAgICAgICAgc2hvd1Byb2plY3RTeW1ib2xzKGZpbGVQYXRoKTtcbiAgICB9KTtcbiAgICBhdG9tVXRpbHMucmVnaXN0ZXJPcGVuZXIoe1xuICAgICAgICBjb21tYW5kU2VsZWN0b3I6ICdhdG9tLXRleHQtZWRpdG9yJyxcbiAgICAgICAgY29tbWFuZE5hbWU6ICd0eXBlc2NyaXB0OmFzdCcsXG4gICAgICAgIHVyaVByb3RvY29sOiBhc3RWaWV3XzEuYXN0VVJJLFxuICAgICAgICBnZXREYXRhOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHRleHQ6IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKS5nZXRUZXh0KCksXG4gICAgICAgICAgICAgICAgZmlsZVBhdGg6IGF0b21VdGlscy5nZXRDdXJyZW50UGF0aCgpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICBvbk9wZW46IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IGFzdFZpZXdfMS5Bc3RWaWV3KGRhdGEuZmlsZVBhdGgsIGRhdGEudGV4dCwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgYXRvbVV0aWxzLnJlZ2lzdGVyT3BlbmVyKHtcbiAgICAgICAgY29tbWFuZFNlbGVjdG9yOiAnYXRvbS10ZXh0LWVkaXRvcicsXG4gICAgICAgIGNvbW1hbmROYW1lOiAndHlwZXNjcmlwdDphc3QtZnVsbCcsXG4gICAgICAgIHVyaVByb3RvY29sOiBhc3RWaWV3XzEuYXN0VVJJRnVsbCxcbiAgICAgICAgZ2V0RGF0YTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0ZXh0OiBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCkuZ2V0VGV4dCgpLFxuICAgICAgICAgICAgICAgIGZpbGVQYXRoOiBhdG9tVXRpbHMuZ2V0Q3VycmVudFBhdGgoKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgb25PcGVuOiBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBhc3RWaWV3XzEuQXN0VmlldyhkYXRhLmZpbGVQYXRoLCBkYXRhLnRleHQsIHRydWUpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgYXRvbVV0aWxzLnJlZ2lzdGVyT3BlbmVyKHtcbiAgICAgICAgY29tbWFuZFNlbGVjdG9yOiAnYXRvbS13b3Jrc3BhY2UnLFxuICAgICAgICBjb21tYW5kTmFtZTogJ3R5cGVzY3JpcHQ6ZGVwZW5kZW5jeS12aWV3JyxcbiAgICAgICAgdXJpUHJvdG9jb2w6IGRlcGVuZGVuY3lWaWV3XzEuZGVwZW5kZW5jeVVSSSxcbiAgICAgICAgZ2V0RGF0YTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBmaWxlUGF0aDogYXRvbVV0aWxzLmdldEN1cnJlbnRQYXRoKClcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIG9uT3BlbjogZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgZGVwZW5kZW5jeVZpZXdfMS5EZXBlbmRlbmN5VmlldyhkYXRhLmZpbGVQYXRoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXRleHQtZWRpdG9yJywgJ3R5cGVzY3JpcHQ6cXVpY2stZml4JywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKCFhdG9tVXRpbHMuY29tbWFuZEZvclR5cGVTY3JpcHQoZSkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHZhciBlZGl0b3IgPSBhdG9tVXRpbHMuZ2V0QWN0aXZlRWRpdG9yKCk7XG4gICAgICAgIHZhciBxdWVyeSA9IGF0b21VdGlscy5nZXRGaWxlUGF0aFBvc2l0aW9uKCk7XG4gICAgICAgIHBhcmVudC5nZXRRdWlja0ZpeGVzKHF1ZXJ5KS50aGVuKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgIGlmICghcmVzdWx0LmZpeGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKCdBdG9tVFM6IE5vIFF1aWNrRml4ZXMgZm9yIGN1cnJlbnQgY3Vyc29yIHBvc2l0aW9uJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2ltcGxlT3ZlcmxheVNlbGVjdGlvblZpZXdfMS5kZWZhdWx0KHtcbiAgICAgICAgICAgICAgICBpdGVtczogcmVzdWx0LmZpeGVzLFxuICAgICAgICAgICAgICAgIHZpZXdGb3JJdGVtOiBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCI8ZGl2PlxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiICsgKGl0ZW0uaXNOZXdUZXh0U25pcHBldCA/ICc8c3BhbiBjbGFzcz1cImljb24tbW92ZS1yaWdodFwiPjwvc3Bhbj4nIDogJycpICsgXCJcXG4gICAgICAgICAgICAgICAgICAgICAgICBcIiArIGVzY2FwZUh0bWwoaXRlbS5kaXNwbGF5KSArIFwiXFxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cIjtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGZpbHRlcktleTogJ2Rpc3BsYXknLFxuICAgICAgICAgICAgICAgIGNvbmZpcm1lZDogZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gTk9URTogd2UgY2FuIHNwZWNpYWwgY2FzZSBVSSdzIGhlcmUgaWYgd2Ugd2FudC5cbiAgICAgICAgICAgICAgICAgICAgcGFyZW50LmFwcGx5UXVpY2tGaXgoeyBrZXk6IGl0ZW0ua2V5LCBmaWxlUGF0aDogcXVlcnkuZmlsZVBhdGgsIHBvc2l0aW9uOiBxdWVyeS5wb3NpdGlvbiB9KS50aGVuKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwcGx5UmVmYWN0b3JpbmdzKHJlcy5yZWZhY3RvcmluZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBlZGl0b3IpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICBhdG9tVXRpbHMucmVnaXN0ZXJPcGVuZXIoe1xuICAgICAgICBjb21tYW5kU2VsZWN0b3I6ICdhdG9tLXdvcmtzcGFjZScsXG4gICAgICAgIGNvbW1hbmROYW1lOiAndHlwZXNjcmlwdDp0ZXN0aW5nLXItdmlldycsXG4gICAgICAgIHVyaVByb3RvY29sOiByVmlldy5SVmlldy5wcm90b2NvbCxcbiAgICAgICAgZ2V0RGF0YTogZnVuY3Rpb24gKCkgeyByZXR1cm4gYXRvbVV0aWxzLmdldEZpbGVQYXRoKCk7IH0sXG4gICAgICAgIG9uT3BlbjogZnVuY3Rpb24gKGRhdGEpIHsgcmV0dXJuIG5ldyByVmlldy5SVmlldyh7XG4gICAgICAgICAgICBpY29uOiAncmVwby1mb3JrZWQnLFxuICAgICAgICAgICAgdGl0bGU6ICdSZWFjdCBWaWV3JyxcbiAgICAgICAgICAgIGZpbGVQYXRoOiBkYXRhLmZpbGVQYXRoLFxuICAgICAgICB9KTsgfSxcbiAgICB9KTtcbiAgICBhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS13b3Jrc3BhY2UnLCAndHlwZXNjcmlwdDpzeW5jJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgaWYgKCFhdG9tVXRpbHMuY29tbWFuZEZvclR5cGVTY3JpcHQoZSkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIG1haW5QYW5lbFZpZXdfMS5wYW5lbFZpZXcuc29mdFJlc2V0KCk7XG4gICAgfSk7XG59XG5leHBvcnRzLnJlZ2lzdGVyQ29tbWFuZHMgPSByZWdpc3RlckNvbW1hbmRzO1xuIl19