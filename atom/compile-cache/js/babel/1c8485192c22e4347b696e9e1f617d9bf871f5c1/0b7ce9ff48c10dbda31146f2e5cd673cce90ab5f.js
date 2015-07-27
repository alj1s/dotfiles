var __extends = this && this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() {
        this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var view = require('./view');
var $ = view.$;
var lineMessageView = require('./lineMessageView');
var atomUtils = require('../atomUtils');
var parent = require('../../../worker/parent');
var utils = require('../../lang/utils');
var fileStatusCache_1 = require('../fileStatusCache');
var panelHeaders = {
    error: 'Errors In Open Files',
    build: 'Last Build Output',
    references: 'References'
};
var gotoHistory = require('../gotoHistory');
var MainPanelView = (function (_super) {
    __extends(MainPanelView, _super);
    function MainPanelView() {
        _super.apply(this, arguments);
        this.pendingRequests = [];
        this.expanded = false;
        this.clearedError = true;
    }
    MainPanelView.content = function () {
        var _this = this;
        var btn = function btn(view, text, className) {
            if (className === void 0) {
                className = '';
            }
            return _this.button({
                'class': 'btn ' + className,
                'click': view + 'PanelSelectedClick',
                'outlet': view + 'PanelBtn',
                'style': 'top:-2px!important'
            }, text);
        };
        this.div({
            'class': 'atomts atomts-main-panel-view native-key-bindings layout horizontal',
            tabindex: '-1'
        }, function () {
            _this.div({
                'class': 'panel-resize-handle',
                style: 'position: absolute; top: 0; left: 0; right: 0; height: 10px; cursor: row-resize; z-index: 3; -webkit-user-select:none'
            });
            _this.div({
                'class': 'panel-heading layout horizontal',
                style: '-webkit-user-select:none',
                dblclick: 'toggle'
            }, function () {
                _this.span({
                    style: 'cursor: pointer; color: rgb(0, 148, 255); -webkit-user-select:none',
                    click: 'toggle'
                }, function () {
                    _this.span({ 'class': 'icon-microscope' });
                    _this.span({ style: 'font-weight:bold' }, ' TypeScript ');
                });
                _this.div({
                    'class': 'btn-group',
                    style: 'margin-left: 5px'
                }, function () {
                    btn('error', panelHeaders.error, 'selected');
                    btn('build', panelHeaders.build);
                    btn('references', panelHeaders.references);
                });
                _this.div({
                    style: 'display:inline-block'
                }, function () {
                    _this.span({
                        style: 'margin-left:10px; transition: color 1s',
                        outlet: 'fileStatus'
                    });
                });
                _this.div({
                    'class': 'heading-summary flex',
                    style: 'display:inline-block; margin-left:5px; margin-top:3px; overflow: hidden; white-space:nowrap; text-overflow: ellipsis',
                    outlet: 'summary'
                });
                _this.progress({
                    'class': 'inline-block build-progress',
                    style: 'display: none; color:red',
                    outlet: 'buildProgress'
                });
                _this.span({ 'class': 'section-pending', outlet: 'sectionPending' }, function () {
                    _this.span({
                        outlet: 'txtPendingCount',
                        style: 'cursor: pointer; margin-right: 7px;'
                    });
                    _this.span({
                        'class': 'loading loading-spinner-tiny inline-block',
                        style: 'cursor: pointer; margin-right: 7px;',
                        click: 'showPending'
                    });
                });
                _this.div({
                    'class': 'heading-buttons',
                    style: 'width:50px; display:inline-block'
                }, function () {
                    _this.span({
                        'class': 'heading-fold icon-unfold',
                        style: 'cursor: pointer; margin-right:10px',
                        outlet: 'btnFold',
                        click: 'toggle'
                    });
                    _this.span({
                        'class': 'heading-fold icon-sync',
                        style: 'cursor: pointer',
                        outlet: 'btnSoftReset',
                        click: 'softReset'
                    });
                });
            });
            _this.div({
                'class': 'panel-body atomts-panel-body padded',
                outlet: 'errorBody',
                style: 'overflow-y: auto; display:none'
            });
            _this.div({
                'class': 'panel-body atomts-panel-body padded',
                outlet: 'buildBody',
                style: 'overflow-y: auto; display:none'
            });
            _this.div({
                'class': 'panel-body atomts-panel-body padded',
                outlet: 'referencesBody',
                style: 'overflow-y: auto; display:none'
            });
        });
    };
    MainPanelView.prototype.init = function () {
        this.buildPanelBtn.html(panelHeaders.build + ' ( <span class="text-success">No Build</span> )');
        this.buildBody.html('<span class="text-success"> No Build. Press ( F12 ) to start a build for an active TypeScript file\'s project. </span>');
        this.referencesPanelBtn.html(panelHeaders.references + ' ( <span class="text-success">No Search</span> )');
        this.referencesBody.html('<span class="text-success"> You haven\'t searched for TypeScript references yet. </span>');
    };
    MainPanelView.prototype.softReset = function () {
        var editor = atom.workspace.getActiveTextEditor();
        var prom = parent.softReset({ filePath: editor.getPath(), text: editor.getText() }).then(function () {});
        if (atomUtils.onDiskAndTs(editor)) {
            prom.then(function () {
                atomUtils.triggerLinter();
                return parent.errorsForFile({ filePath: editor.getPath() });
            }).then(function (resp) {
                return errorView.setErrors(editor.getPath(), resp.errors);
            });
        }
    };
    MainPanelView.prototype.updateFileStatus = function (filePath) {
        var status = fileStatusCache_1.getFileStatus(filePath);
        this.fileStatus.removeClass('icon-x icon-check text-error text-success');
        if (status.emitDiffers || status.modified) {
            this.fileStatus.text('Js emit is outdated');
            this.fileStatus.addClass('icon-x text-error');
        } else {
            this.fileStatus.text('Js emit up to date');
            this.fileStatus.addClass('icon-check text-success');
        }
    };
    MainPanelView.prototype.showPending = function () {
        atom.notifications.addInfo('Pending Requests: <br/> - ' + this.pendingRequests.join('<br/> - '));
    };
    MainPanelView.prototype.updatePendingRequests = function (pending) {
        this.pendingRequests = pending;
        this.txtPendingCount.html('<span class="text-highlight">' + this.pendingRequests.length + '</span>');
        this.sectionPending.stop();
        if (pending.length) {
            this.sectionPending.fadeIn(500);
        } else {
            this.sectionPending.fadeOut(200);
        }
    };
    MainPanelView.prototype.errorPanelSelectedClick = function () {
        this.toggleIfThisIsntSelected(this.errorPanelBtn);
        this.errorPanelSelected();
    };
    MainPanelView.prototype.errorPanelSelected = function () {
        this.selectPanel(this.errorPanelBtn, this.errorBody, gotoHistory.errorsInOpenFiles);
    };
    MainPanelView.prototype.buildPanelSelectedClick = function () {
        this.toggleIfThisIsntSelected(this.buildPanelBtn);
        this.buildPanelSelected();
    };
    MainPanelView.prototype.buildPanelSelected = function () {
        this.selectPanel(this.buildPanelBtn, this.buildBody, gotoHistory.buildOutput);
    };
    MainPanelView.prototype.referencesPanelSelectedClick = function () {
        this.toggleIfThisIsntSelected(this.referencesPanelBtn);
        this.referencesPanelSelected();
    };
    MainPanelView.prototype.referencesPanelSelected = function (forceExpand) {
        if (forceExpand === void 0) {
            forceExpand = false;
        }
        this.selectPanel(this.referencesPanelBtn, this.referencesBody, gotoHistory.referencesOutput);
    };
    MainPanelView.prototype.toggleIfThisIsntSelected = function (btn) {
        if (btn.hasClass('selected')) {
            this.expanded = !this.expanded;
        }
    };
    MainPanelView.prototype.selectPanel = function (btn, body, activeList) {
        var _this = this;
        var buttons = [this.errorPanelBtn, this.buildPanelBtn, this.referencesPanelBtn];
        var bodies = [this.errorBody, this.buildBody, this.referencesBody];
        buttons.forEach(function (b) {
            if (b !== btn) b.removeClass('selected');else b.addClass('selected');
        });
        bodies.forEach(function (b) {
            if (!_this.expanded) {
                b.hide('fast');
            } else {
                if (b !== body) b.hide('fast');else {
                    body.show('fast');
                }
            }
        });
        gotoHistory.activeList = activeList;
        gotoHistory.activeList.lastPosition = null;
    };
    MainPanelView.prototype.setActivePanel = function () {
        if (this.errorPanelBtn.hasClass('selected')) {
            this.errorPanelSelected();
        }
        if (this.buildPanelBtn.hasClass('selected')) {
            this.buildPanelSelected();
        }
        if (this.referencesPanelBtn.hasClass('selected')) {
            this.referencesPanelSelected();
        }
    };
    MainPanelView.prototype.toggle = function () {
        this.expanded = !this.expanded;
        this.setActivePanel();
    };
    MainPanelView.prototype.setReferences = function (references) {
        this.referencesPanelSelected(true);
        this.referencesBody.empty();
        if (references.length == 0) {
            var title = panelHeaders.references + ' ( <span class="text-success">No References</span> )';
            this.referencesPanelBtn.html(title);
            this.referencesBody.html('<span class="text-success">No references found ♥</span>');
            atom.notifications.addInfo('AtomTS: No References Found.');
            return;
        }
        var title = panelHeaders.references + ' ( <span class="text-highlight" style="font-weight: bold">Found: ' + references.length + '</span> )';
        this.referencesPanelBtn.html(title);
        gotoHistory.referencesOutput.members = [];
        for (var _i = 0; _i < references.length; _i++) {
            var ref = references[_i];
            var view = new lineMessageView.LineMessageView({
                goToLine: function goToLine(filePath, line, col) {
                    return gotoHistory.gotoLine(filePath, line, col, gotoHistory.referencesOutput);
                },
                message: '',
                line: ref.position.line + 1,
                col: ref.position.col,
                file: ref.filePath,
                preview: ref.preview
            });
            this.referencesBody.append(view.$);
            gotoHistory.referencesOutput.members.push({ filePath: ref.filePath, line: ref.position.line + 1, col: ref.position.col });
        }
    };
    MainPanelView.prototype.clearError = function () {
        this.clearedError = true;
        this.errorBody.empty();
    };
    MainPanelView.prototype.addError = function (view) {
        if (this.clearedError && view.getSummary) {
            this.setErrorSummary(view.getSummary());
        }
        this.clearedError = false;
        this.errorBody.append(view.$);
    };
    MainPanelView.prototype.setErrorSummary = function (summary) {
        var message = summary.summary,
            className = summary.className,
            raw = summary.rawSummary || false,
            handler = summary.handler || undefined;
        this.summary.html(message);
        if (className) {
            this.summary.addClass(className);
        }
        if (handler) {
            handler(this.summary);
        }
    };
    MainPanelView.prototype.setErrorPanelErrorCount = function (fileErrorCount, totalErrorCount) {
        var title = panelHeaders.error + ' ( <span class="text-success">No Errors</span> )';
        if (totalErrorCount > 0) {
            title = panelHeaders.error + ' (\n                <span class="text-highlight" style="font-weight: bold"> ' + fileErrorCount + ' </span>\n                <span class="text-error" style="font-weight: bold;"> file' + (fileErrorCount === 1 ? '' : 's') + ' </span>\n                <span class="text-highlight" style="font-weight: bold"> ' + totalErrorCount + ' </span>\n                <span class="text-error" style="font-weight: bold;"> error' + (totalErrorCount === 1 ? '' : 's') + ' </span>\n            )';
        } else {
            this.summary.html('');
            this.errorBody.html('<span class="text-success">No errors in open files ♥</span>');
        }
        this.errorPanelBtn.html(title);
    };
    MainPanelView.prototype.setBuildPanelCount = function (errorCount, inProgressBuild) {
        if (inProgressBuild === void 0) {
            inProgressBuild = false;
        }
        var titleMain = inProgressBuild ? 'Build Progress' : panelHeaders.build;
        var title = titleMain + ' ( <span class="text-success">No Errors</span> )';
        if (errorCount > 0) {
            title = titleMain + ' (\n                <span class="text-highlight" style="font-weight: bold"> ' + errorCount + ' </span>\n                <span class="text-error" style="font-weight: bold;"> error' + (errorCount === 1 ? '' : 's') + ' </span>\n            )';
        } else {
            if (!inProgressBuild) this.buildBody.html('<span class="text-success">No errors in last build ♥</span>');
        }
        this.buildPanelBtn.html(title);
    };
    MainPanelView.prototype.clearBuild = function () {
        this.buildBody.empty();
    };
    MainPanelView.prototype.addBuild = function (view) {
        this.buildBody.append(view.$);
    };
    MainPanelView.prototype.setBuildProgress = function (progress) {
        var _this = this;
        if (progress.builtCount == 1) {
            this.buildProgress.show();
            this.buildProgress.removeClass('warn');
            this.buildBody.html('<span class="text-success">Things are looking good ♥</span>');
            gotoHistory.buildOutput.members = [];
        }
        if (progress.builtCount == progress.totalCount) {
            this.buildProgress.hide();
            return;
        }
        this.buildProgress.prop('value', progress.builtCount);
        this.buildProgress.prop('max', progress.totalCount);
        this.setBuildPanelCount(progress.errorCount, true);
        if (progress.firstError) {
            this.buildProgress.addClass('warn');
            this.clearBuild();
        }
        if (progress.errorsInFile.length) {
            progress.errorsInFile.forEach(function (error) {
                _this.addBuild(new lineMessageView.LineMessageView({
                    goToLine: function goToLine(filePath, line, col) {
                        return gotoHistory.gotoLine(filePath, line, col, gotoHistory.buildOutput);
                    },
                    message: error.message,
                    line: error.startPos.line + 1,
                    col: error.startPos.col,
                    file: error.filePath,
                    preview: error.preview
                }));
                gotoHistory.buildOutput.members.push({ filePath: error.filePath, line: error.startPos.line + 1, col: error.startPos.col });
            });
        }
    };
    return MainPanelView;
})(view.View);
exports.MainPanelView = MainPanelView;
var panel;
function attach() {
    if (exports.panelView) return;
    exports.panelView = new MainPanelView({});
    panel = atom.workspace.addBottomPanel({ item: exports.panelView, priority: 1000, visible: true });
    exports.panelView.setErrorPanelErrorCount(0, 0);
}
exports.attach = attach;
function show() {
    if (!exports.panelView) return;
    exports.panelView.$.show();
}
exports.show = show;
function hide() {
    if (!exports.panelView) return;
    exports.panelView.$.hide();
}
exports.hide = hide;
var errorView;
(function (errorView) {
    var filePathErrors = new utils.Dict();
    errorView.setErrors = function (filePath, errorsForFile) {
        if (!errorsForFile.length) filePathErrors.clearValue(filePath);else {
            if (errorsForFile.length > 50) errorsForFile = errorsForFile.slice(0, 50);
            filePathErrors.setValue(filePath, errorsForFile);
        }
        ;
        exports.panelView.clearError();
        var fileErrorCount = filePathErrors.keys().length;
        gotoHistory.errorsInOpenFiles.members = [];
        if (!fileErrorCount) {
            exports.panelView.setErrorPanelErrorCount(0, 0);
        } else {
            var totalErrorCount = 0;
            for (var path in filePathErrors.table) {
                filePathErrors.getValue(path).forEach(function (error) {
                    totalErrorCount++;
                    exports.panelView.addError(new lineMessageView.LineMessageView({
                        goToLine: function goToLine(filePath, line, col) {
                            return gotoHistory.gotoLine(filePath, line, col, gotoHistory.errorsInOpenFiles);
                        },
                        message: error.message,
                        line: error.startPos.line + 1,
                        col: error.startPos.col,
                        file: error.filePath,
                        preview: error.preview
                    }));
                    gotoHistory.errorsInOpenFiles.members.push({ filePath: error.filePath, line: error.startPos.line + 1, col: error.startPos.col });
                });
            }
            exports.panelView.setErrorPanelErrorCount(fileErrorCount, totalErrorCount);
        }
    };
    function showEmittedMessage(output) {
        if (output.emitError) {
            atom.notifications.addError('TS Emit Failed');
        } else if (!output.success) {
            atomUtils.quickNotifyWarning('Compile failed but emit succeeded<br/>' + output.outputFiles.join('<br/>'));
        }
    }
    errorView.showEmittedMessage = showEmittedMessage;
})(errorView = exports.errorView || (exports.errorView = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9hdG9tLXR5cGVzY3JpcHQvZGlzdC9tYWluL2F0b20vdmlld3MvbWFpblBhbmVsVmlldy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFJLFNBQVMsR0FBRyxBQUFDLElBQUksSUFBSSxJQUFJLENBQUMsU0FBUyxJQUFLLFVBQVUsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUN4RCxTQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0RCxhQUFTLEVBQUUsR0FBRztBQUFFLFlBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDO0tBQUU7QUFDdkMsS0FBQyxDQUFDLFNBQVMsR0FBRyxDQUFDLEtBQUssSUFBSSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUEsQUFBQyxDQUFDO0NBQ3hGLENBQUM7QUFDRixJQUFJLElBQUksR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDN0IsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNmLElBQUksZUFBZSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0FBQ25ELElBQUksU0FBUyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUN4QyxJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsd0JBQXdCLENBQUMsQ0FBQztBQUMvQyxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztBQUN4QyxJQUFJLGlCQUFpQixHQUFHLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0FBQ3RELElB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LENBQUM7YUFDTjtBQUNELG1CQUFPLENBQUMsU0FBUyxDQUFDLHVCQUF1QixDQUFDLGNBQWMsRUFBRSxlQUFlLENBQUMsQ0FBQztTQUM5RTtLQUNKLENBQUM7QUFDRixhQUFTLGtCQUFrQixDQUFDLE1BQU0sRUFBRTtBQUNoQyxZQUFJLE1BQU0sQ0FBQyxTQUFTLEVBQUU7QUFDbEIsZ0JBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLENBQUM7U0FDakQsTUFDSSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRTtBQUN0QixxQkFBUyxDQUFDLGtCQUFrQixDQUFDLHdDQUF3QyxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7U0FDN0c7S0FDSjtBQUNELGFBQVMsQ0FBQyxrQkFBa0IsR0FBRyxrQkFBa0IsQ0FBQztDQUNyRCxDQUFBLENBQUUsU0FBUyxHQUFHLE9BQU8sQ0FBQyxTQUFTLEtBQUssT0FBTyxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUEsQUFBQyxDQUFDLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL2F0b20tdHlwZXNjcmlwdC9kaXN0L21haW4vYXRvbS92aWV3cy9tYWluUGFuZWxWaWV3LmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCBmdW5jdGlvbiAoZCwgYikge1xuICAgIGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdO1xuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbn07XG52YXIgdmlldyA9IHJlcXVpcmUoJy4vdmlldycpO1xudmFyICQgPSB2aWV3LiQ7XG52YXIgbGluZU1lc3NhZ2VWaWV3ID0gcmVxdWlyZSgnLi9saW5lTWVzc2FnZVZpZXcnKTtcbnZhciBhdG9tVXRpbHMgPSByZXF1aXJlKFwiLi4vYXRvbVV0aWxzXCIpO1xudmFyIHBhcmVudCA9IHJlcXVpcmUoXCIuLi8uLi8uLi93b3JrZXIvcGFyZW50XCIpO1xudmFyIHV0aWxzID0gcmVxdWlyZShcIi4uLy4uL2xhbmcvdXRpbHNcIik7XG52YXIgZmlsZVN0YXR1c0NhY2hlXzEgPSByZXF1aXJlKFwiLi4vZmlsZVN0YXR1c0NhY2hlXCIpO1xudmFyIHBhbmVsSGVhZGVycyA9IHtcbiAgICBlcnJvcjogJ0Vycm9ycyBJbiBPcGVuIEZpbGVzJyxcbiAgICBidWlsZDogJ0xhc3QgQnVpbGQgT3V0cHV0JyxcbiAgICByZWZlcmVuY2VzOiAnUmVmZXJlbmNlcydcbn07XG52YXIgZ290b0hpc3RvcnkgPSByZXF1aXJlKCcuLi9nb3RvSGlzdG9yeScpO1xudmFyIE1haW5QYW5lbFZpZXcgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhNYWluUGFuZWxWaWV3LCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIE1haW5QYW5lbFZpZXcoKSB7XG4gICAgICAgIF9zdXBlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB0aGlzLnBlbmRpbmdSZXF1ZXN0cyA9IFtdO1xuICAgICAgICB0aGlzLmV4cGFuZGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuY2xlYXJlZEVycm9yID0gdHJ1ZTtcbiAgICB9XG4gICAgTWFpblBhbmVsVmlldy5jb250ZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgYnRuID0gZnVuY3Rpb24gKHZpZXcsIHRleHQsIGNsYXNzTmFtZSkge1xuICAgICAgICAgICAgaWYgKGNsYXNzTmFtZSA9PT0gdm9pZCAwKSB7IGNsYXNzTmFtZSA9ICcnOyB9XG4gICAgICAgICAgICByZXR1cm4gX3RoaXMuYnV0dG9uKHtcbiAgICAgICAgICAgICAgICAnY2xhc3MnOiBcImJ0biBcIiArIGNsYXNzTmFtZSxcbiAgICAgICAgICAgICAgICAnY2xpY2snOiB2aWV3ICsgXCJQYW5lbFNlbGVjdGVkQ2xpY2tcIixcbiAgICAgICAgICAgICAgICAnb3V0bGV0JzogdmlldyArIFwiUGFuZWxCdG5cIixcbiAgICAgICAgICAgICAgICAnc3R5bGUnOiAndG9wOi0ycHghaW1wb3J0YW50J1xuICAgICAgICAgICAgfSwgdGV4dCk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZGl2KHtcbiAgICAgICAgICAgIGNsYXNzOiAnYXRvbXRzIGF0b210cy1tYWluLXBhbmVsLXZpZXcgbmF0aXZlLWtleS1iaW5kaW5ncyBsYXlvdXQgaG9yaXpvbnRhbCcsXG4gICAgICAgICAgICB0YWJpbmRleDogJy0xJ1xuICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBfdGhpcy5kaXYoe1xuICAgICAgICAgICAgICAgIGNsYXNzOiAncGFuZWwtcmVzaXplLWhhbmRsZScsXG4gICAgICAgICAgICAgICAgc3R5bGU6ICdwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogMDsgbGVmdDogMDsgcmlnaHQ6IDA7IGhlaWdodDogMTBweDsgY3Vyc29yOiByb3ctcmVzaXplOyB6LWluZGV4OiAzOyAtd2Via2l0LXVzZXItc2VsZWN0Om5vbmUnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIF90aGlzLmRpdih7XG4gICAgICAgICAgICAgICAgY2xhc3M6ICdwYW5lbC1oZWFkaW5nIGxheW91dCBob3Jpem9udGFsJyxcbiAgICAgICAgICAgICAgICBzdHlsZTogJy13ZWJraXQtdXNlci1zZWxlY3Q6bm9uZScsXG4gICAgICAgICAgICAgICAgZGJsY2xpY2s6ICd0b2dnbGUnXG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuc3Bhbih7XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOiAnY3Vyc29yOiBwb2ludGVyOyBjb2xvcjogcmdiKDAsIDE0OCwgMjU1KTsgLXdlYmtpdC11c2VyLXNlbGVjdDpub25lJyxcbiAgICAgICAgICAgICAgICAgICAgY2xpY2s6ICd0b2dnbGUnXG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5zcGFuKHsgY2xhc3M6IFwiaWNvbi1taWNyb3Njb3BlXCIgfSk7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnNwYW4oeyBzdHlsZTogJ2ZvbnQtd2VpZ2h0OmJvbGQnIH0sIFwiIFR5cGVTY3JpcHQgXCIpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIF90aGlzLmRpdih7XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzOiAnYnRuLWdyb3VwJyxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU6ICdtYXJnaW4tbGVmdDogNXB4J1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgYnRuKFwiZXJyb3JcIiwgcGFuZWxIZWFkZXJzLmVycm9yLCAnc2VsZWN0ZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgYnRuKFwiYnVpbGRcIiwgcGFuZWxIZWFkZXJzLmJ1aWxkKTtcbiAgICAgICAgICAgICAgICAgICAgYnRuKFwicmVmZXJlbmNlc1wiLCBwYW5lbEhlYWRlcnMucmVmZXJlbmNlcyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgX3RoaXMuZGl2KHtcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU6ICdkaXNwbGF5OmlubGluZS1ibG9jaydcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnNwYW4oe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6ICdtYXJnaW4tbGVmdDoxMHB4OyB0cmFuc2l0aW9uOiBjb2xvciAxcycsXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRsZXQ6ICdmaWxlU3RhdHVzJ1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBfdGhpcy5kaXYoe1xuICAgICAgICAgICAgICAgICAgICBjbGFzczogJ2hlYWRpbmctc3VtbWFyeSBmbGV4JyxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU6ICdkaXNwbGF5OmlubGluZS1ibG9jazsgbWFyZ2luLWxlZnQ6NXB4OyBtYXJnaW4tdG9wOjNweDsgb3ZlcmZsb3c6IGhpZGRlbjsgd2hpdGUtc3BhY2U6bm93cmFwOyB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcycsXG4gICAgICAgICAgICAgICAgICAgIG91dGxldDogJ3N1bW1hcnknXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgX3RoaXMucHJvZ3Jlc3Moe1xuICAgICAgICAgICAgICAgICAgICBjbGFzczogJ2lubGluZS1ibG9jayBidWlsZC1wcm9ncmVzcycsXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOiAnZGlzcGxheTogbm9uZTsgY29sb3I6cmVkJyxcbiAgICAgICAgICAgICAgICAgICAgb3V0bGV0OiAnYnVpbGRQcm9ncmVzcydcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBfdGhpcy5zcGFuKHsgY2xhc3M6ICdzZWN0aW9uLXBlbmRpbmcnLCBvdXRsZXQ6ICdzZWN0aW9uUGVuZGluZycgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5zcGFuKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dGxldDogJ3R4dFBlbmRpbmdDb3VudCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHlsZTogJ2N1cnNvcjogcG9pbnRlcjsgbWFyZ2luLXJpZ2h0OiA3cHg7JyxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnNwYW4oe1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M6ICdsb2FkaW5nIGxvYWRpbmctc3Bpbm5lci10aW55IGlubGluZS1ibG9jaycsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHlsZTogJ2N1cnNvcjogcG9pbnRlcjsgbWFyZ2luLXJpZ2h0OiA3cHg7JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsaWNrOiAnc2hvd1BlbmRpbmcnXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIF90aGlzLmRpdih7XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzOiAnaGVhZGluZy1idXR0b25zJyxcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU6ICd3aWR0aDo1MHB4OyBkaXNwbGF5OmlubGluZS1ibG9jaydcbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnNwYW4oe1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M6ICdoZWFkaW5nLWZvbGQgaWNvbi11bmZvbGQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU6ICdjdXJzb3I6IHBvaW50ZXI7IG1hcmdpbi1yaWdodDoxMHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dGxldDogJ2J0bkZvbGQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2xpY2s6ICd0b2dnbGUnXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5zcGFuKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzOiAnaGVhZGluZy1mb2xkIGljb24tc3luYycsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHlsZTogJ2N1cnNvcjogcG9pbnRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRsZXQ6ICdidG5Tb2Z0UmVzZXQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2xpY2s6ICdzb2Z0UmVzZXQnXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBfdGhpcy5kaXYoe1xuICAgICAgICAgICAgICAgIGNsYXNzOiAncGFuZWwtYm9keSBhdG9tdHMtcGFuZWwtYm9keSBwYWRkZWQnLFxuICAgICAgICAgICAgICAgIG91dGxldDogJ2Vycm9yQm9keScsXG4gICAgICAgICAgICAgICAgc3R5bGU6ICdvdmVyZmxvdy15OiBhdXRvOyBkaXNwbGF5Om5vbmUnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIF90aGlzLmRpdih7XG4gICAgICAgICAgICAgICAgY2xhc3M6ICdwYW5lbC1ib2R5IGF0b210cy1wYW5lbC1ib2R5IHBhZGRlZCcsXG4gICAgICAgICAgICAgICAgb3V0bGV0OiAnYnVpbGRCb2R5JyxcbiAgICAgICAgICAgICAgICBzdHlsZTogJ292ZXJmbG93LXk6IGF1dG87IGRpc3BsYXk6bm9uZSdcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgX3RoaXMuZGl2KHtcbiAgICAgICAgICAgICAgICBjbGFzczogJ3BhbmVsLWJvZHkgYXRvbXRzLXBhbmVsLWJvZHkgcGFkZGVkJyxcbiAgICAgICAgICAgICAgICBvdXRsZXQ6ICdyZWZlcmVuY2VzQm9keScsXG4gICAgICAgICAgICAgICAgc3R5bGU6ICdvdmVyZmxvdy15OiBhdXRvOyBkaXNwbGF5Om5vbmUnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBNYWluUGFuZWxWaWV3LnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmJ1aWxkUGFuZWxCdG4uaHRtbChwYW5lbEhlYWRlcnMuYnVpbGQgKyBcIiAoIDxzcGFuIGNsYXNzPVxcXCJ0ZXh0LXN1Y2Nlc3NcXFwiPk5vIEJ1aWxkPC9zcGFuPiApXCIpO1xuICAgICAgICB0aGlzLmJ1aWxkQm9keS5odG1sKCc8c3BhbiBjbGFzcz1cInRleHQtc3VjY2Vzc1wiPiBObyBCdWlsZC4gUHJlc3MgKCBGMTIgKSB0byBzdGFydCBhIGJ1aWxkIGZvciBhbiBhY3RpdmUgVHlwZVNjcmlwdCBmaWxlXFwncyBwcm9qZWN0LiA8L3NwYW4+Jyk7XG4gICAgICAgIHRoaXMucmVmZXJlbmNlc1BhbmVsQnRuLmh0bWwocGFuZWxIZWFkZXJzLnJlZmVyZW5jZXMgKyBcIiAoIDxzcGFuIGNsYXNzPVxcXCJ0ZXh0LXN1Y2Nlc3NcXFwiPk5vIFNlYXJjaDwvc3Bhbj4gKVwiKTtcbiAgICAgICAgdGhpcy5yZWZlcmVuY2VzQm9keS5odG1sKCc8c3BhbiBjbGFzcz1cInRleHQtc3VjY2Vzc1wiPiBZb3UgaGF2ZW5cXCd0IHNlYXJjaGVkIGZvciBUeXBlU2NyaXB0IHJlZmVyZW5jZXMgeWV0LiA8L3NwYW4+Jyk7XG4gICAgfTtcbiAgICBNYWluUGFuZWxWaWV3LnByb3RvdHlwZS5zb2Z0UmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XG4gICAgICAgIHZhciBwcm9tID0gcGFyZW50LnNvZnRSZXNldCh7IGZpbGVQYXRoOiBlZGl0b3IuZ2V0UGF0aCgpLCB0ZXh0OiBlZGl0b3IuZ2V0VGV4dCgpIH0pXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoYXRvbVV0aWxzLm9uRGlza0FuZFRzKGVkaXRvcikpIHtcbiAgICAgICAgICAgIHByb20udGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgYXRvbVV0aWxzLnRyaWdnZXJMaW50ZXIoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50LmVycm9yc0ZvckZpbGUoeyBmaWxlUGF0aDogZWRpdG9yLmdldFBhdGgoKSB9KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHsgcmV0dXJuIGVycm9yVmlldy5zZXRFcnJvcnMoZWRpdG9yLmdldFBhdGgoKSwgcmVzcC5lcnJvcnMpOyB9KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgTWFpblBhbmVsVmlldy5wcm90b3R5cGUudXBkYXRlRmlsZVN0YXR1cyA9IGZ1bmN0aW9uIChmaWxlUGF0aCkge1xuICAgICAgICB2YXIgc3RhdHVzID0gZmlsZVN0YXR1c0NhY2hlXzEuZ2V0RmlsZVN0YXR1cyhmaWxlUGF0aCk7XG4gICAgICAgIHRoaXMuZmlsZVN0YXR1cy5yZW1vdmVDbGFzcygnaWNvbi14IGljb24tY2hlY2sgdGV4dC1lcnJvciB0ZXh0LXN1Y2Nlc3MnKTtcbiAgICAgICAgaWYgKHN0YXR1cy5lbWl0RGlmZmVycyB8fCBzdGF0dXMubW9kaWZpZWQpIHtcbiAgICAgICAgICAgIHRoaXMuZmlsZVN0YXR1cy50ZXh0KCdKcyBlbWl0IGlzIG91dGRhdGVkJyk7XG4gICAgICAgICAgICB0aGlzLmZpbGVTdGF0dXMuYWRkQ2xhc3MoJ2ljb24teCB0ZXh0LWVycm9yJyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmZpbGVTdGF0dXMudGV4dCgnSnMgZW1pdCB1cCB0byBkYXRlJyk7XG4gICAgICAgICAgICB0aGlzLmZpbGVTdGF0dXMuYWRkQ2xhc3MoJ2ljb24tY2hlY2sgdGV4dC1zdWNjZXNzJyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIE1haW5QYW5lbFZpZXcucHJvdG90eXBlLnNob3dQZW5kaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbygnUGVuZGluZyBSZXF1ZXN0czogPGJyLz4gLSAnICsgdGhpcy5wZW5kaW5nUmVxdWVzdHMuam9pbignPGJyLz4gLSAnKSk7XG4gICAgfTtcbiAgICBNYWluUGFuZWxWaWV3LnByb3RvdHlwZS51cGRhdGVQZW5kaW5nUmVxdWVzdHMgPSBmdW5jdGlvbiAocGVuZGluZykge1xuICAgICAgICB0aGlzLnBlbmRpbmdSZXF1ZXN0cyA9IHBlbmRpbmc7XG4gICAgICAgIHRoaXMudHh0UGVuZGluZ0NvdW50Lmh0bWwoXCI8c3BhbiBjbGFzcz1cXFwidGV4dC1oaWdobGlnaHRcXFwiPlwiICsgdGhpcy5wZW5kaW5nUmVxdWVzdHMubGVuZ3RoICsgXCI8L3NwYW4+XCIpO1xuICAgICAgICB0aGlzLnNlY3Rpb25QZW5kaW5nLnN0b3AoKTtcbiAgICAgICAgaWYgKHBlbmRpbmcubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLnNlY3Rpb25QZW5kaW5nLmZhZGVJbig1MDApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zZWN0aW9uUGVuZGluZy5mYWRlT3V0KDIwMCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIE1haW5QYW5lbFZpZXcucHJvdG90eXBlLmVycm9yUGFuZWxTZWxlY3RlZENsaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnRvZ2dsZUlmVGhpc0lzbnRTZWxlY3RlZCh0aGlzLmVycm9yUGFuZWxCdG4pO1xuICAgICAgICB0aGlzLmVycm9yUGFuZWxTZWxlY3RlZCgpO1xuICAgIH07XG4gICAgTWFpblBhbmVsVmlldy5wcm90b3R5cGUuZXJyb3JQYW5lbFNlbGVjdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnNlbGVjdFBhbmVsKHRoaXMuZXJyb3JQYW5lbEJ0biwgdGhpcy5lcnJvckJvZHksIGdvdG9IaXN0b3J5LmVycm9yc0luT3BlbkZpbGVzKTtcbiAgICB9O1xuICAgIE1haW5QYW5lbFZpZXcucHJvdG90eXBlLmJ1aWxkUGFuZWxTZWxlY3RlZENsaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnRvZ2dsZUlmVGhpc0lzbnRTZWxlY3RlZCh0aGlzLmJ1aWxkUGFuZWxCdG4pO1xuICAgICAgICB0aGlzLmJ1aWxkUGFuZWxTZWxlY3RlZCgpO1xuICAgIH07XG4gICAgTWFpblBhbmVsVmlldy5wcm90b3R5cGUuYnVpbGRQYW5lbFNlbGVjdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnNlbGVjdFBhbmVsKHRoaXMuYnVpbGRQYW5lbEJ0biwgdGhpcy5idWlsZEJvZHksIGdvdG9IaXN0b3J5LmJ1aWxkT3V0cHV0KTtcbiAgICB9O1xuICAgIE1haW5QYW5lbFZpZXcucHJvdG90eXBlLnJlZmVyZW5jZXNQYW5lbFNlbGVjdGVkQ2xpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMudG9nZ2xlSWZUaGlzSXNudFNlbGVjdGVkKHRoaXMucmVmZXJlbmNlc1BhbmVsQnRuKTtcbiAgICAgICAgdGhpcy5yZWZlcmVuY2VzUGFuZWxTZWxlY3RlZCgpO1xuICAgIH07XG4gICAgTWFpblBhbmVsVmlldy5wcm90b3R5cGUucmVmZXJlbmNlc1BhbmVsU2VsZWN0ZWQgPSBmdW5jdGlvbiAoZm9yY2VFeHBhbmQpIHtcbiAgICAgICAgaWYgKGZvcmNlRXhwYW5kID09PSB2b2lkIDApIHsgZm9yY2VFeHBhbmQgPSBmYWxzZTsgfVxuICAgICAgICB0aGlzLnNlbGVjdFBhbmVsKHRoaXMucmVmZXJlbmNlc1BhbmVsQnRuLCB0aGlzLnJlZmVyZW5jZXNCb2R5LCBnb3RvSGlzdG9yeS5yZWZlcmVuY2VzT3V0cHV0KTtcbiAgICB9O1xuICAgIE1haW5QYW5lbFZpZXcucHJvdG90eXBlLnRvZ2dsZUlmVGhpc0lzbnRTZWxlY3RlZCA9IGZ1bmN0aW9uIChidG4pIHtcbiAgICAgICAgaWYgKGJ0bi5oYXNDbGFzcygnc2VsZWN0ZWQnKSkge1xuICAgICAgICAgICAgdGhpcy5leHBhbmRlZCA9ICF0aGlzLmV4cGFuZGVkO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBNYWluUGFuZWxWaWV3LnByb3RvdHlwZS5zZWxlY3RQYW5lbCA9IGZ1bmN0aW9uIChidG4sIGJvZHksIGFjdGl2ZUxpc3QpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGJ1dHRvbnMgPSBbdGhpcy5lcnJvclBhbmVsQnRuLCB0aGlzLmJ1aWxkUGFuZWxCdG4sIHRoaXMucmVmZXJlbmNlc1BhbmVsQnRuXTtcbiAgICAgICAgdmFyIGJvZGllcyA9IFt0aGlzLmVycm9yQm9keSwgdGhpcy5idWlsZEJvZHksIHRoaXMucmVmZXJlbmNlc0JvZHldO1xuICAgICAgICBidXR0b25zLmZvckVhY2goZnVuY3Rpb24gKGIpIHtcbiAgICAgICAgICAgIGlmIChiICE9PSBidG4pXG4gICAgICAgICAgICAgICAgYi5yZW1vdmVDbGFzcygnc2VsZWN0ZWQnKTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBiLmFkZENsYXNzKCdzZWxlY3RlZCcpO1xuICAgICAgICB9KTtcbiAgICAgICAgYm9kaWVzLmZvckVhY2goZnVuY3Rpb24gKGIpIHtcbiAgICAgICAgICAgIGlmICghX3RoaXMuZXhwYW5kZWQpIHtcbiAgICAgICAgICAgICAgICBiLmhpZGUoJ2Zhc3QnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChiICE9PSBib2R5KVxuICAgICAgICAgICAgICAgICAgICBiLmhpZGUoJ2Zhc3QnKTtcbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYm9keS5zaG93KCdmYXN0Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgZ290b0hpc3RvcnkuYWN0aXZlTGlzdCA9IGFjdGl2ZUxpc3Q7XG4gICAgICAgIGdvdG9IaXN0b3J5LmFjdGl2ZUxpc3QubGFzdFBvc2l0aW9uID0gbnVsbDtcbiAgICB9O1xuICAgIE1haW5QYW5lbFZpZXcucHJvdG90eXBlLnNldEFjdGl2ZVBhbmVsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5lcnJvclBhbmVsQnRuLmhhc0NsYXNzKCdzZWxlY3RlZCcpKSB7XG4gICAgICAgICAgICB0aGlzLmVycm9yUGFuZWxTZWxlY3RlZCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmJ1aWxkUGFuZWxCdG4uaGFzQ2xhc3MoJ3NlbGVjdGVkJykpIHtcbiAgICAgICAgICAgIHRoaXMuYnVpbGRQYW5lbFNlbGVjdGVkKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucmVmZXJlbmNlc1BhbmVsQnRuLmhhc0NsYXNzKCdzZWxlY3RlZCcpKSB7XG4gICAgICAgICAgICB0aGlzLnJlZmVyZW5jZXNQYW5lbFNlbGVjdGVkKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIE1haW5QYW5lbFZpZXcucHJvdG90eXBlLnRvZ2dsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5leHBhbmRlZCA9ICF0aGlzLmV4cGFuZGVkO1xuICAgICAgICB0aGlzLnNldEFjdGl2ZVBhbmVsKCk7XG4gICAgfTtcbiAgICBNYWluUGFuZWxWaWV3LnByb3RvdHlwZS5zZXRSZWZlcmVuY2VzID0gZnVuY3Rpb24gKHJlZmVyZW5jZXMpIHtcbiAgICAgICAgdGhpcy5yZWZlcmVuY2VzUGFuZWxTZWxlY3RlZCh0cnVlKTtcbiAgICAgICAgdGhpcy5yZWZlcmVuY2VzQm9keS5lbXB0eSgpO1xuICAgICAgICBpZiAocmVmZXJlbmNlcy5sZW5ndGggPT0gMCkge1xuICAgICAgICAgICAgdmFyIHRpdGxlID0gcGFuZWxIZWFkZXJzLnJlZmVyZW5jZXMgKyBcIiAoIDxzcGFuIGNsYXNzPVxcXCJ0ZXh0LXN1Y2Nlc3NcXFwiPk5vIFJlZmVyZW5jZXM8L3NwYW4+IClcIjtcbiAgICAgICAgICAgIHRoaXMucmVmZXJlbmNlc1BhbmVsQnRuLmh0bWwodGl0bGUpO1xuICAgICAgICAgICAgdGhpcy5yZWZlcmVuY2VzQm9keS5odG1sKCc8c3BhbiBjbGFzcz1cInRleHQtc3VjY2Vzc1wiPk5vIHJlZmVyZW5jZXMgZm91bmQgXFx1MjY2NTwvc3Bhbj4nKTtcbiAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKCdBdG9tVFM6IE5vIFJlZmVyZW5jZXMgRm91bmQuJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHRpdGxlID0gcGFuZWxIZWFkZXJzLnJlZmVyZW5jZXMgKyBcIiAoIDxzcGFuIGNsYXNzPVxcXCJ0ZXh0LWhpZ2hsaWdodFxcXCIgc3R5bGU9XFxcImZvbnQtd2VpZ2h0OiBib2xkXFxcIj5Gb3VuZDogXCIgKyByZWZlcmVuY2VzLmxlbmd0aCArIFwiPC9zcGFuPiApXCI7XG4gICAgICAgIHRoaXMucmVmZXJlbmNlc1BhbmVsQnRuLmh0bWwodGl0bGUpO1xuICAgICAgICBnb3RvSGlzdG9yeS5yZWZlcmVuY2VzT3V0cHV0Lm1lbWJlcnMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IHJlZmVyZW5jZXMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICB2YXIgcmVmID0gcmVmZXJlbmNlc1tfaV07XG4gICAgICAgICAgICB2YXIgdmlldyA9IG5ldyBsaW5lTWVzc2FnZVZpZXcuTGluZU1lc3NhZ2VWaWV3KHtcbiAgICAgICAgICAgICAgICBnb1RvTGluZTogZnVuY3Rpb24gKGZpbGVQYXRoLCBsaW5lLCBjb2wpIHsgcmV0dXJuIGdvdG9IaXN0b3J5LmdvdG9MaW5lKGZpbGVQYXRoLCBsaW5lLCBjb2wsIGdvdG9IaXN0b3J5LnJlZmVyZW5jZXNPdXRwdXQpOyB9LFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICcnLFxuICAgICAgICAgICAgICAgIGxpbmU6IHJlZi5wb3NpdGlvbi5saW5lICsgMSxcbiAgICAgICAgICAgICAgICBjb2w6IHJlZi5wb3NpdGlvbi5jb2wsXG4gICAgICAgICAgICAgICAgZmlsZTogcmVmLmZpbGVQYXRoLFxuICAgICAgICAgICAgICAgIHByZXZpZXc6IHJlZi5wcmV2aWV3XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMucmVmZXJlbmNlc0JvZHkuYXBwZW5kKHZpZXcuJCk7XG4gICAgICAgICAgICBnb3RvSGlzdG9yeS5yZWZlcmVuY2VzT3V0cHV0Lm1lbWJlcnMucHVzaCh7IGZpbGVQYXRoOiByZWYuZmlsZVBhdGgsIGxpbmU6IHJlZi5wb3NpdGlvbi5saW5lICsgMSwgY29sOiByZWYucG9zaXRpb24uY29sIH0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBNYWluUGFuZWxWaWV3LnByb3RvdHlwZS5jbGVhckVycm9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmNsZWFyZWRFcnJvciA9IHRydWU7XG4gICAgICAgIHRoaXMuZXJyb3JCb2R5LmVtcHR5KCk7XG4gICAgfTtcbiAgICBNYWluUGFuZWxWaWV3LnByb3RvdHlwZS5hZGRFcnJvciA9IGZ1bmN0aW9uICh2aWV3KSB7XG4gICAgICAgIGlmICh0aGlzLmNsZWFyZWRFcnJvciAmJiB2aWV3LmdldFN1bW1hcnkpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0RXJyb3JTdW1tYXJ5KHZpZXcuZ2V0U3VtbWFyeSgpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNsZWFyZWRFcnJvciA9IGZhbHNlO1xuICAgICAgICB0aGlzLmVycm9yQm9keS5hcHBlbmQodmlldy4kKTtcbiAgICB9O1xuICAgIE1haW5QYW5lbFZpZXcucHJvdG90eXBlLnNldEVycm9yU3VtbWFyeSA9IGZ1bmN0aW9uIChzdW1tYXJ5KSB7XG4gICAgICAgIHZhciBtZXNzYWdlID0gc3VtbWFyeS5zdW1tYXJ5LCBjbGFzc05hbWUgPSBzdW1tYXJ5LmNsYXNzTmFtZSwgcmF3ID0gc3VtbWFyeS5yYXdTdW1tYXJ5IHx8IGZhbHNlLCBoYW5kbGVyID0gc3VtbWFyeS5oYW5kbGVyIHx8IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5zdW1tYXJ5Lmh0bWwobWVzc2FnZSk7XG4gICAgICAgIGlmIChjbGFzc05hbWUpIHtcbiAgICAgICAgICAgIHRoaXMuc3VtbWFyeS5hZGRDbGFzcyhjbGFzc05hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChoYW5kbGVyKSB7XG4gICAgICAgICAgICBoYW5kbGVyKHRoaXMuc3VtbWFyeSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIE1haW5QYW5lbFZpZXcucHJvdG90eXBlLnNldEVycm9yUGFuZWxFcnJvckNvdW50ID0gZnVuY3Rpb24gKGZpbGVFcnJvckNvdW50LCB0b3RhbEVycm9yQ291bnQpIHtcbiAgICAgICAgdmFyIHRpdGxlID0gcGFuZWxIZWFkZXJzLmVycm9yICsgXCIgKCA8c3BhbiBjbGFzcz1cXFwidGV4dC1zdWNjZXNzXFxcIj5ObyBFcnJvcnM8L3NwYW4+IClcIjtcbiAgICAgICAgaWYgKHRvdGFsRXJyb3JDb3VudCA+IDApIHtcbiAgICAgICAgICAgIHRpdGxlID0gcGFuZWxIZWFkZXJzLmVycm9yICsgXCIgKFxcbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwidGV4dC1oaWdobGlnaHRcXFwiIHN0eWxlPVxcXCJmb250LXdlaWdodDogYm9sZFxcXCI+IFwiICsgZmlsZUVycm9yQ291bnQgKyBcIiA8L3NwYW4+XFxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJ0ZXh0LWVycm9yXFxcIiBzdHlsZT1cXFwiZm9udC13ZWlnaHQ6IGJvbGQ7XFxcIj4gZmlsZVwiICsgKGZpbGVFcnJvckNvdW50ID09PSAxID8gXCJcIiA6IFwic1wiKSArIFwiIDwvc3Bhbj5cXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcInRleHQtaGlnaGxpZ2h0XFxcIiBzdHlsZT1cXFwiZm9udC13ZWlnaHQ6IGJvbGRcXFwiPiBcIiArIHRvdGFsRXJyb3JDb3VudCArIFwiIDwvc3Bhbj5cXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XFxcInRleHQtZXJyb3JcXFwiIHN0eWxlPVxcXCJmb250LXdlaWdodDogYm9sZDtcXFwiPiBlcnJvclwiICsgKHRvdGFsRXJyb3JDb3VudCA9PT0gMSA/IFwiXCIgOiBcInNcIikgKyBcIiA8L3NwYW4+XFxuICAgICAgICAgICAgKVwiO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zdW1tYXJ5Lmh0bWwoJycpO1xuICAgICAgICAgICAgdGhpcy5lcnJvckJvZHkuaHRtbCgnPHNwYW4gY2xhc3M9XCJ0ZXh0LXN1Y2Nlc3NcIj5ObyBlcnJvcnMgaW4gb3BlbiBmaWxlcyBcXHUyNjY1PC9zcGFuPicpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZXJyb3JQYW5lbEJ0bi5odG1sKHRpdGxlKTtcbiAgICB9O1xuICAgIE1haW5QYW5lbFZpZXcucHJvdG90eXBlLnNldEJ1aWxkUGFuZWxDb3VudCA9IGZ1bmN0aW9uIChlcnJvckNvdW50LCBpblByb2dyZXNzQnVpbGQpIHtcbiAgICAgICAgaWYgKGluUHJvZ3Jlc3NCdWlsZCA9PT0gdm9pZCAwKSB7IGluUHJvZ3Jlc3NCdWlsZCA9IGZhbHNlOyB9XG4gICAgICAgIHZhciB0aXRsZU1haW4gPSBpblByb2dyZXNzQnVpbGQgPyBcIkJ1aWxkIFByb2dyZXNzXCIgOiBwYW5lbEhlYWRlcnMuYnVpbGQ7XG4gICAgICAgIHZhciB0aXRsZSA9IHRpdGxlTWFpbiArIFwiICggPHNwYW4gY2xhc3M9XFxcInRleHQtc3VjY2Vzc1xcXCI+Tm8gRXJyb3JzPC9zcGFuPiApXCI7XG4gICAgICAgIGlmIChlcnJvckNvdW50ID4gMCkge1xuICAgICAgICAgICAgdGl0bGUgPSB0aXRsZU1haW4gKyBcIiAoXFxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVxcXCJ0ZXh0LWhpZ2hsaWdodFxcXCIgc3R5bGU9XFxcImZvbnQtd2VpZ2h0OiBib2xkXFxcIj4gXCIgKyBlcnJvckNvdW50ICsgXCIgPC9zcGFuPlxcbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cXFwidGV4dC1lcnJvclxcXCIgc3R5bGU9XFxcImZvbnQtd2VpZ2h0OiBib2xkO1xcXCI+IGVycm9yXCIgKyAoZXJyb3JDb3VudCA9PT0gMSA/IFwiXCIgOiBcInNcIikgKyBcIiA8L3NwYW4+XFxuICAgICAgICAgICAgKVwiO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFpblByb2dyZXNzQnVpbGQpXG4gICAgICAgICAgICAgICAgdGhpcy5idWlsZEJvZHkuaHRtbCgnPHNwYW4gY2xhc3M9XCJ0ZXh0LXN1Y2Nlc3NcIj5ObyBlcnJvcnMgaW4gbGFzdCBidWlsZCBcXHUyNjY1PC9zcGFuPicpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYnVpbGRQYW5lbEJ0bi5odG1sKHRpdGxlKTtcbiAgICB9O1xuICAgIE1haW5QYW5lbFZpZXcucHJvdG90eXBlLmNsZWFyQnVpbGQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuYnVpbGRCb2R5LmVtcHR5KCk7XG4gICAgfTtcbiAgICBNYWluUGFuZWxWaWV3LnByb3RvdHlwZS5hZGRCdWlsZCA9IGZ1bmN0aW9uICh2aWV3KSB7XG4gICAgICAgIHRoaXMuYnVpbGRCb2R5LmFwcGVuZCh2aWV3LiQpO1xuICAgIH07XG4gICAgTWFpblBhbmVsVmlldy5wcm90b3R5cGUuc2V0QnVpbGRQcm9ncmVzcyA9IGZ1bmN0aW9uIChwcm9ncmVzcykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBpZiAocHJvZ3Jlc3MuYnVpbHRDb3VudCA9PSAxKSB7XG4gICAgICAgICAgICB0aGlzLmJ1aWxkUHJvZ3Jlc3Muc2hvdygpO1xuICAgICAgICAgICAgdGhpcy5idWlsZFByb2dyZXNzLnJlbW92ZUNsYXNzKCd3YXJuJyk7XG4gICAgICAgICAgICB0aGlzLmJ1aWxkQm9keS5odG1sKCc8c3BhbiBjbGFzcz1cInRleHQtc3VjY2Vzc1wiPlRoaW5ncyBhcmUgbG9va2luZyBnb29kIFxcdTI2NjU8L3NwYW4+Jyk7XG4gICAgICAgICAgICBnb3RvSGlzdG9yeS5idWlsZE91dHB1dC5tZW1iZXJzID0gW107XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByb2dyZXNzLmJ1aWx0Q291bnQgPT0gcHJvZ3Jlc3MudG90YWxDb3VudCkge1xuICAgICAgICAgICAgdGhpcy5idWlsZFByb2dyZXNzLmhpZGUoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmJ1aWxkUHJvZ3Jlc3MucHJvcCgndmFsdWUnLCBwcm9ncmVzcy5idWlsdENvdW50KTtcbiAgICAgICAgdGhpcy5idWlsZFByb2dyZXNzLnByb3AoJ21heCcsIHByb2dyZXNzLnRvdGFsQ291bnQpO1xuICAgICAgICB0aGlzLnNldEJ1aWxkUGFuZWxDb3VudChwcm9ncmVzcy5lcnJvckNvdW50LCB0cnVlKTtcbiAgICAgICAgaWYgKHByb2dyZXNzLmZpcnN0RXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMuYnVpbGRQcm9ncmVzcy5hZGRDbGFzcygnd2FybicpO1xuICAgICAgICAgICAgdGhpcy5jbGVhckJ1aWxkKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByb2dyZXNzLmVycm9yc0luRmlsZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHByb2dyZXNzLmVycm9yc0luRmlsZS5mb3JFYWNoKGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgICAgIF90aGlzLmFkZEJ1aWxkKG5ldyBsaW5lTWVzc2FnZVZpZXcuTGluZU1lc3NhZ2VWaWV3KHtcbiAgICAgICAgICAgICAgICAgICAgZ29Ub0xpbmU6IGZ1bmN0aW9uIChmaWxlUGF0aCwgbGluZSwgY29sKSB7IHJldHVybiBnb3RvSGlzdG9yeS5nb3RvTGluZShmaWxlUGF0aCwgbGluZSwgY29sLCBnb3RvSGlzdG9yeS5idWlsZE91dHB1dCk7IH0sXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAgIGxpbmU6IGVycm9yLnN0YXJ0UG9zLmxpbmUgKyAxLFxuICAgICAgICAgICAgICAgICAgICBjb2w6IGVycm9yLnN0YXJ0UG9zLmNvbCxcbiAgICAgICAgICAgICAgICAgICAgZmlsZTogZXJyb3IuZmlsZVBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHByZXZpZXc6IGVycm9yLnByZXZpZXdcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgZ290b0hpc3RvcnkuYnVpbGRPdXRwdXQubWVtYmVycy5wdXNoKHsgZmlsZVBhdGg6IGVycm9yLmZpbGVQYXRoLCBsaW5lOiBlcnJvci5zdGFydFBvcy5saW5lICsgMSwgY29sOiBlcnJvci5zdGFydFBvcy5jb2wgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIE1haW5QYW5lbFZpZXc7XG59KSh2aWV3LlZpZXcpO1xuZXhwb3J0cy5NYWluUGFuZWxWaWV3ID0gTWFpblBhbmVsVmlldztcbnZhciBwYW5lbDtcbmZ1bmN0aW9uIGF0dGFjaCgpIHtcbiAgICBpZiAoZXhwb3J0cy5wYW5lbFZpZXcpXG4gICAgICAgIHJldHVybjtcbiAgICBleHBvcnRzLnBhbmVsVmlldyA9IG5ldyBNYWluUGFuZWxWaWV3KHt9KTtcbiAgICBwYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZEJvdHRvbVBhbmVsKHsgaXRlbTogZXhwb3J0cy5wYW5lbFZpZXcsIHByaW9yaXR5OiAxMDAwLCB2aXNpYmxlOiB0cnVlIH0pO1xuICAgIGV4cG9ydHMucGFuZWxWaWV3LnNldEVycm9yUGFuZWxFcnJvckNvdW50KDAsIDApO1xufVxuZXhwb3J0cy5hdHRhY2ggPSBhdHRhY2g7XG5mdW5jdGlvbiBzaG93KCkge1xuICAgIGlmICghZXhwb3J0cy5wYW5lbFZpZXcpXG4gICAgICAgIHJldHVybjtcbiAgICBleHBvcnRzLnBhbmVsVmlldy4kLnNob3coKTtcbn1cbmV4cG9ydHMuc2hvdyA9IHNob3c7XG5mdW5jdGlvbiBoaWRlKCkge1xuICAgIGlmICghZXhwb3J0cy5wYW5lbFZpZXcpXG4gICAgICAgIHJldHVybjtcbiAgICBleHBvcnRzLnBhbmVsVmlldy4kLmhpZGUoKTtcbn1cbmV4cG9ydHMuaGlkZSA9IGhpZGU7XG52YXIgZXJyb3JWaWV3O1xuKGZ1bmN0aW9uIChlcnJvclZpZXcpIHtcbiAgICB2YXIgZmlsZVBhdGhFcnJvcnMgPSBuZXcgdXRpbHMuRGljdCgpO1xuICAgIGVycm9yVmlldy5zZXRFcnJvcnMgPSBmdW5jdGlvbiAoZmlsZVBhdGgsIGVycm9yc0ZvckZpbGUpIHtcbiAgICAgICAgaWYgKCFlcnJvcnNGb3JGaWxlLmxlbmd0aClcbiAgICAgICAgICAgIGZpbGVQYXRoRXJyb3JzLmNsZWFyVmFsdWUoZmlsZVBhdGgpO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmIChlcnJvcnNGb3JGaWxlLmxlbmd0aCA+IDUwKVxuICAgICAgICAgICAgICAgIGVycm9yc0ZvckZpbGUgPSBlcnJvcnNGb3JGaWxlLnNsaWNlKDAsIDUwKTtcbiAgICAgICAgICAgIGZpbGVQYXRoRXJyb3JzLnNldFZhbHVlKGZpbGVQYXRoLCBlcnJvcnNGb3JGaWxlKTtcbiAgICAgICAgfVxuICAgICAgICA7XG4gICAgICAgIGV4cG9ydHMucGFuZWxWaWV3LmNsZWFyRXJyb3IoKTtcbiAgICAgICAgdmFyIGZpbGVFcnJvckNvdW50ID0gZmlsZVBhdGhFcnJvcnMua2V5cygpLmxlbmd0aDtcbiAgICAgICAgZ290b0hpc3RvcnkuZXJyb3JzSW5PcGVuRmlsZXMubWVtYmVycyA9IFtdO1xuICAgICAgICBpZiAoIWZpbGVFcnJvckNvdW50KSB7XG4gICAgICAgICAgICBleHBvcnRzLnBhbmVsVmlldy5zZXRFcnJvclBhbmVsRXJyb3JDb3VudCgwLCAwKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciB0b3RhbEVycm9yQ291bnQgPSAwO1xuICAgICAgICAgICAgZm9yICh2YXIgcGF0aCBpbiBmaWxlUGF0aEVycm9ycy50YWJsZSkge1xuICAgICAgICAgICAgICAgIGZpbGVQYXRoRXJyb3JzLmdldFZhbHVlKHBhdGgpLmZvckVhY2goZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvdGFsRXJyb3JDb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICBleHBvcnRzLnBhbmVsVmlldy5hZGRFcnJvcihuZXcgbGluZU1lc3NhZ2VWaWV3LkxpbmVNZXNzYWdlVmlldyh7XG4gICAgICAgICAgICAgICAgICAgICAgICBnb1RvTGluZTogZnVuY3Rpb24gKGZpbGVQYXRoLCBsaW5lLCBjb2wpIHsgcmV0dXJuIGdvdG9IaXN0b3J5LmdvdG9MaW5lKGZpbGVQYXRoLCBsaW5lLCBjb2wsIGdvdG9IaXN0b3J5LmVycm9yc0luT3BlbkZpbGVzKTsgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiBlcnJvci5zdGFydFBvcy5saW5lICsgMSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbDogZXJyb3Iuc3RhcnRQb3MuY29sLFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZTogZXJyb3IuZmlsZVBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2aWV3OiBlcnJvci5wcmV2aWV3XG4gICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICAgICAgZ290b0hpc3RvcnkuZXJyb3JzSW5PcGVuRmlsZXMubWVtYmVycy5wdXNoKHsgZmlsZVBhdGg6IGVycm9yLmZpbGVQYXRoLCBsaW5lOiBlcnJvci5zdGFydFBvcy5saW5lICsgMSwgY29sOiBlcnJvci5zdGFydFBvcy5jb2wgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBleHBvcnRzLnBhbmVsVmlldy5zZXRFcnJvclBhbmVsRXJyb3JDb3VudChmaWxlRXJyb3JDb3VudCwgdG90YWxFcnJvckNvdW50KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgZnVuY3Rpb24gc2hvd0VtaXR0ZWRNZXNzYWdlKG91dHB1dCkge1xuICAgICAgICBpZiAob3V0cHV0LmVtaXRFcnJvcikge1xuICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKCdUUyBFbWl0IEZhaWxlZCcpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCFvdXRwdXQuc3VjY2Vzcykge1xuICAgICAgICAgICAgYXRvbVV0aWxzLnF1aWNrTm90aWZ5V2FybmluZygnQ29tcGlsZSBmYWlsZWQgYnV0IGVtaXQgc3VjY2VlZGVkPGJyLz4nICsgb3V0cHV0Lm91dHB1dEZpbGVzLmpvaW4oJzxici8+JykpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVycm9yVmlldy5zaG93RW1pdHRlZE1lc3NhZ2UgPSBzaG93RW1pdHRlZE1lc3NhZ2U7XG59KShlcnJvclZpZXcgPSBleHBvcnRzLmVycm9yVmlldyB8fCAoZXhwb3J0cy5lcnJvclZpZXcgPSB7fSkpO1xuIl19