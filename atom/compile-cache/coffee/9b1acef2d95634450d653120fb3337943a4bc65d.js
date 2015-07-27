(function() {
  var CompositeDisposable, ProjectsAddView, ProjectsListView, Settings, fs,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  CompositeDisposable = require('atom').CompositeDisposable;

  fs = require('fs');

  Settings = null;

  ProjectsListView = null;

  ProjectsAddView = null;

  module.exports = {
    config: {
      showPath: {
        type: 'boolean',
        "default": true
      },
      closeCurrent: {
        type: 'boolean',
        "default": false,
        description: "Currently disabled since it's broken. Waiting for a better way to implement it."
      },
      environmentSpecificProjects: {
        type: 'boolean',
        "default": false
      },
      sortBy: {
        type: 'string',
        description: 'Default sorting is the order in which the projects are',
        "default": 'default',
        "enum": ['default', 'title', 'group']
      }
    },
    projectManagerAddView: null,
    filepath: null,
    subscriptions: null,
    activate: function(state) {
      this.subscriptions = new CompositeDisposable;
      this.handleEvents();
      fs.exists(this.file(), (function(_this) {
        return function(exists) {
          if (!exists) {
            return fs.writeFile(_this.file(), '{}', function(error) {
              var options, _ref;
              if (error) {
                return (_ref = atom.notifications) != null ? _ref.addError("Project Manager", options = {
                  details: "Could not create " + (this.file())
                }) : void 0;
              }
            });
          } else {
            _this.subscribeToProjectsFile();
            return _this.loadCurrentProject();
          }
        };
      })(this));
      return atom.config.observe('project-manager.environmentSpecificProjects', (function(_this) {
        return function(newValue, obj) {
          var previous;
          if (obj == null) {
            obj = {};
          }
          previous = obj.previous != null ? obj.previous : newValue;
          if (newValue !== previous) {
            _this.updateFile();
            return _this.subscribeToProjectsFile();
          }
        };
      })(this));
    },
    handleEvents: function(state) {
      return this.subscriptions.add(atom.commands.add('atom-workspace', {
        'project-manager:toggle': (function(_this) {
          return function() {
            var projectsListView;
            if (ProjectsListView == null) {
              ProjectsListView = require('./project-manager-view');
            }
            projectsListView = new ProjectsListView();
            return projectsListView.toggle(_this);
          };
        })(this),
        'project-manager:save-project': (function(_this) {
          return function() {
            var projectsAddView;
            if (ProjectsAddView == null) {
              ProjectsAddView = require('./project-manager-add-view');
            }
            projectsAddView = new ProjectsAddView();
            return projectsAddView.toggle(_this);
          };
        })(this),
        'project-manager:edit-projects': (function(_this) {
          return function() {
            return atom.workspace.open(_this.file());
          };
        })(this),
        'project-manager:reload-project-settings': (function(_this) {
          return function() {
            return _this.loadCurrentProject();
          };
        })(this)
      }));
    },
    file: function(update) {
      var filedir, filename, hostname, os;
      if (update == null) {
        update = false;
      }
      if (update) {
        this.filepath = null;
      }
      if (this.filepath == null) {
        filename = 'projects.cson';
        filedir = atom.getConfigDirPath();
        if (atom.config.get('project-manager.environmentSpecificProjects')) {
          os = require('os');
          hostname = os.hostname().split('.').shift().toLowerCase();
          filename = "projects." + hostname + ".cson";
        }
        this.filepath = "" + filedir + "/" + filename;
      }
      return this.filepath;
    },
    updateFile: function() {
      return fs.exists(this.file(true), (function(_this) {
        return function(exists) {
          if (!exists) {
            return fs.writeFile(_this.file(), '{}', function(error) {
              var options, _ref;
              if (error) {
                return (_ref = atom.notifications) != null ? _ref.addError("Project Manager", options = {
                  details: "Could not create " + (this.file())
                }) : void 0;
              }
            });
          }
        };
      })(this));
    },
    subscribeToProjectsFile: function() {
      if (this.fileWatcher != null) {
        this.fileWatcher.close();
      }
      return this.fileWatcher = fs.watch(this.file(), (function(_this) {
        return function(event, filename) {
          return _this.loadCurrentProject();
        };
      })(this));
    },
    loadCurrentProject: function(done) {
      var CSON, _;
      CSON = require('season');
      _ = require('underscore-plus');
      return CSON.readFile(this.file(), (function(_this) {
        return function(error, data) {
          var project;
          if (!error) {
            project = _this.getCurrentProject(data);
            if (project) {
              if ((project.template != null) && (data[project.template] != null)) {
                project = _.deepExtend(project, data[project.template]);
              }
              if (Settings == null) {
                Settings = require('./settings');
              }
              if (project.settings != null) {
                Settings.enable(project.settings);
              }
            }
          }
          return typeof done === "function" ? done() : void 0;
        };
      })(this));
    },
    getCurrentProject: function(projects) {
      var path, project, title, _i, _len, _ref;
      for (title in projects) {
        project = projects[title];
        if (project.paths == null) {
          continue;
        }
        _ref = project.paths;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          path = _ref[_i];
          if (__indexOf.call(atom.project.getPaths(), path) >= 0) {
            return project;
          }
        }
      }
      return false;
    },
    addProject: function(project) {
      var CSON, errorMessage, projects, successMessage;
      CSON = require('season');
      projects = CSON.readFileSync(this.file()) || {};
      projects[project.title] = project;
      successMessage = "" + project.title + " has been added";
      errorMessage = "" + project.title + " could not be saved to " + (this.file());
      return CSON.writeFile(this.file(), projects, function(err) {
        var _ref, _ref1;
        if (!err) {
          return (_ref = atom.notifications) != null ? _ref.addSuccess(successMessage) : void 0;
        } else {
          return (_ref1 = atom.notifications) != null ? _ref1.addError(errorMessage) : void 0;
        }
      });
    },
    openProject: function(project) {
      var options;
      return atom.open(options = {
        pathsToOpen: project.paths,
        devMode: project.devMode
      });
    },
    deactivate: function() {
      return this.subscriptions.dispose();
    }
  };

}).call(this);
