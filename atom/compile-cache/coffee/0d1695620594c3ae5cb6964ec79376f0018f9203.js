(function() {
  var ProjectManagerAddView, TextEditorView, View, path, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ref = require('atom-space-pen-views'), TextEditorView = _ref.TextEditorView, View = _ref.View;

  path = require('path');

  module.exports = ProjectManagerAddView = (function(_super) {
    __extends(ProjectManagerAddView, _super);

    function ProjectManagerAddView() {
      this.show = __bind(this.show, this);
      this.hide = __bind(this.hide, this);
      this.confirm = __bind(this.confirm, this);
      this.cancelled = __bind(this.cancelled, this);
      return ProjectManagerAddView.__super__.constructor.apply(this, arguments);
    }

    ProjectManagerAddView.prototype.projectManager = null;

    ProjectManagerAddView.content = function() {
      return this.div({
        "class": 'project-manager'
      }, (function(_this) {
        return function() {
          _this.label('Enter the name of the project', {
            "class": 'icon icon-plus'
          });
          return _this.subview('editor', new TextEditorView({
            mini: true
          }));
        };
      })(this));
    };

    ProjectManagerAddView.prototype.initialize = function() {
      atom.commands.add(this.element, {
        'core:confirm': (function(_this) {
          return function() {
            return _this.confirm(_this.editor.getText());
          };
        })(this),
        'core:cancel': (function(_this) {
          return function() {
            return _this.hide();
          };
        })(this)
      });
      return this.editor.on('blur', this.hide);
    };

    ProjectManagerAddView.prototype.cancelled = function() {
      return this.hide();
    };

    ProjectManagerAddView.prototype.confirm = function(title) {
      var project;
      project = {
        title: title,
        paths: atom.project.getPaths()
      };
      if (project.title) {
        this.projectManager.addProject(project);
      }
      if (project.title) {
        return this.hide();
      }
    };

    ProjectManagerAddView.prototype.hide = function() {
      atom.commands.dispatch(atom.views.getView(atom.workspace), 'focus');
      return this.panel.hide();
    };

    ProjectManagerAddView.prototype.show = function() {
      var basename, firstPath;
      if (this.panel == null) {
        this.panel = atom.workspace.addModalPanel({
          item: this
        });
      }
      this.panel.show();
      firstPath = atom.project.getPaths()[0];
      basename = path.basename(firstPath);
      this.editor.getModel().setText(basename);
      this.editor.focus();
      return this.editor.select();
    };

    ProjectManagerAddView.prototype.toggle = function(projectManager) {
      var _ref1;
      this.projectManager = projectManager;
      if ((_ref1 = this.panel) != null ? _ref1.isVisible() : void 0) {
        return this.hide();
      } else {
        return this.show();
      }
    };

    return ProjectManagerAddView;

  })(View);

}).call(this);
