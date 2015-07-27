(function() {
  var $, $$, CSON, ProjectManagerView, SelectListView, View, _, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ref = require('atom-space-pen-views'), $ = _ref.$, $$ = _ref.$$, SelectListView = _ref.SelectListView, View = _ref.View;

  CSON = require('season');

  _ = require('underscore-plus');

  module.exports = ProjectManagerView = (function(_super) {
    __extends(ProjectManagerView, _super);

    function ProjectManagerView() {
      this.getEmptyMessage = __bind(this.getEmptyMessage, this);
      return ProjectManagerView.__super__.constructor.apply(this, arguments);
    }

    ProjectManagerView.prototype.projectManager = null;

    ProjectManagerView.prototype.possibleFilterKeys = ['title', 'group', 'template'];

    ProjectManagerView.prototype.activate = function() {
      return new ProjectManagerView;
    };

    ProjectManagerView.prototype.initialize = function(serializeState) {
      ProjectManagerView.__super__.initialize.apply(this, arguments);
      return this.addClass('project-manager');
    };

    ProjectManagerView.prototype.serialize = function() {};

    ProjectManagerView.prototype.getFilterKey = function() {
      var filter, input, inputArr, _ref1;
      filter = 'title';
      input = this.filterEditorView.getText();
      inputArr = input.split(':');
      if (inputArr.length > 1 && (_ref1 = inputArr[0], __indexOf.call(this.possibleFilterKeys, _ref1) >= 0)) {
        filter = inputArr[0];
      }
      return filter;
    };

    ProjectManagerView.prototype.getFilterQuery = function() {
      var input, inputArr;
      input = this.filterEditorView.getText();
      inputArr = input.split(':');
      if (inputArr.length > 1) {
        input = inputArr[1];
      }
      return input;
    };

    ProjectManagerView.prototype.cancelled = function() {
      return this.hide();
    };

    ProjectManagerView.prototype.confirmed = function(project) {
      this.projectManager.openProject(project);
      return this.cancel();
    };

    ProjectManagerView.prototype.getEmptyMessage = function(itemCount, filteredItemCount) {
      if (!itemCount) {
        return 'No projects saved yet';
      } else {
        return ProjectManagerView.__super__.getEmptyMessage.apply(this, arguments);
      }
    };

    ProjectManagerView.prototype.toggle = function(projectManager) {
      var _ref1;
      this.projectManager = projectManager;
      if ((_ref1 = this.panel) != null ? _ref1.isVisible() : void 0) {
        return this.hide();
      } else {
        return this.show();
      }
    };

    ProjectManagerView.prototype.hide = function() {
      var _ref1;
      return (_ref1 = this.panel) != null ? _ref1.hide() : void 0;
    };

    ProjectManagerView.prototype.show = function() {
      return CSON.readFile(this.projectManager.file(), (function(_this) {
        return function(error, currentProjects) {
          var message, options, project, projects, sortBy, title;
          if (!error) {
            projects = [];
            for (title in currentProjects) {
              project = currentProjects[title];
              if ((project.template != null) && (currentProjects[project.template] != null)) {
                project = _.deepExtend(project, currentProjects[project.template]);
              }
              if (project.paths != null) {
                projects.push(project);
              }
            }
            sortBy = atom.config.get('project-manager.sortBy');
            if (sortBy !== 'default') {
              projects = _this.sortBy(projects, sortBy);
            }
            if (_this.panel == null) {
              _this.panel = atom.workspace.addModalPanel({
                item: _this
              });
            }
            _this.panel.show();
            _this.setItems(projects);
            return _this.focusFilterEditor();
          } else {
            message = "There was an error trying to list your projects";
            options = {
              detail: error.message
            };
            return atom.notifications.addError(message, options);
          }
        };
      })(this));
    };

    ProjectManagerView.prototype.viewForItem = function(_arg) {
      var devMode, group, icon, paths, title;
      title = _arg.title, paths = _arg.paths, icon = _arg.icon, group = _arg.group, devMode = _arg.devMode;
      icon = icon || 'icon-chevron-right';
      return $$(function() {
        return this.li({
          "class": 'two-lines',
          'data-project-title': title
        }, (function(_this) {
          return function() {
            var path, _i, _len, _results;
            _this.div({
              "class": 'primary-line'
            }, function() {
              if (devMode) {
                _this.span({
                  "class": 'project-manager-devmode'
                });
              }
              return _this.div({
                "class": "icon " + icon
              }, function() {
                _this.span(title);
                if (group != null) {
                  return _this.span({
                    "class": 'project-manager-list-group'
                  }, group);
                }
              });
            });
            if (atom.config.get('project-manager.showPath')) {
              _results = [];
              for (_i = 0, _len = paths.length; _i < _len; _i++) {
                path = paths[_i];
                _results.push(_this.div({
                  "class": 'secondary-line'
                }, function() {
                  return _this.div({
                    "class": 'no-icon'
                  }, path);
                }));
              }
              return _results;
            }
          };
        })(this));
      });
    };

    ProjectManagerView.prototype.sortBy = function(arr, key) {
      return arr.sort(function(a, b) {
        a = (a[key] || '\uffff').toUpperCase();
        b = (b[key] || '\uffff').toUpperCase();
        if (a > b) {
          return 1;
        } else {
          return -1;
        }
      });
    };

    return ProjectManagerView;

  })(SelectListView);

}).call(this);
