(function() {
  var $, ProjectManager, fs, workspaceElement;

  $ = require('atom-space-pen-views').$;

  ProjectManager = require('../lib/project-manager');

  workspaceElement = null;

  fs = require('fs');

  describe("ProjectManager", function() {
    ({
      activationPromise: null
    });
    describe("Toggle Project Manager", function() {
      beforeEach(function() {
        workspaceElement = atom.views.getView(atom.workspace);
        jasmine.attachToDOM(workspaceElement);
        ProjectManager.projectManagerView = null;
        this.settingsFile = "" + __dirname + "/projects.test.cson";
        spyOn(ProjectManager, 'file').andCallFake((function(_this) {
          return function() {
            return _this.settingsFile;
          };
        })(this));
        return waitsForPromise(function() {
          return atom.packages.activatePackage('project-manager');
        });
      });
      return it("Shows the Project Viewer", function() {
        var list;
        atom.commands.dispatch(workspaceElement, 'project-manager:toggle');
        list = $(workspaceElement).find('.project-manager .list-group li');
        expect(list.length).toBe(1);
        return expect(list.first().find('.primary-line').text()).toBe('Test01');
      });
    });
    describe("Initiating Project Manager", function() {
      beforeEach(function() {
        workspaceElement = atom.views.getView(atom.workspace);
        jasmine.attachToDOM(workspaceElement);
        this.settingsFile = "" + __dirname + "/projects.test.cson";
        spyOn(ProjectManager, 'file').andCallFake((function(_this) {
          return function() {
            return _this.settingsFile;
          };
        })(this));
        return waitsForPromise(function() {
          return atom.packages.activatePackage('project-manager');
        });
      });
      it("Makes sure projects.cson exists", function() {
        var options;
        options = {
          encoding: 'utf-8'
        };
        return fs.readFile(ProjectManager.file(), options, function(err, data) {
          return expect(err).toBe(null);
        });
      });
      return it("getCurrentPath existential operator issue is fixed", function() {
        var projects, result;
        projects = {
          test: {
            paths: atom.project.getPaths()
          }
        };
        result = ProjectManager.getCurrentProject(projects);
        expect(result).not.toBe(false);
        projects = {
          test: {}
        };
        result = ProjectManager.getCurrentProject(projects);
        return expect(result).toBe(false);
      });
    });
    return describe("Loading Settings", function() {
      beforeEach(function() {
        var CSON;
        this.settingsFile = "" + __dirname + "/projects.test.cson";
        CSON = require('season');
        CSON.readFile(this.settingsFile, (function(_this) {
          return function(error, data) {
            _this.projects = data;
            return _this.projects.Test01.paths = [__dirname];
          };
        })(this));
        ProjectManager.projectManagerView = null;
        workspaceElement = atom.views.getView(atom.workspace);
        jasmine.attachToDOM(workspaceElement);
        spyOn(ProjectManager, 'file').andCallFake((function(_this) {
          return function() {
            return _this.settingsFile;
          };
        })(this));
        spyOn(ProjectManager, 'getCurrentProject').andCallFake((function(_this) {
          return function() {
            return _this.projects.Test01;
          };
        })(this));
        return waitsForPromise(function() {
          return atom.packages.activatePackage('project-manager');
        });
      });
      it("Overwrites existing settings", function() {
        var done;
        atom.config.setRawValue('tree-view.showOnRightSide', false);
        atom.config.emit('update');
        expect(atom.config.get('tree-view.showOnRightSide')).toBe(false);
        done = false;
        runs(function() {
          return ProjectManager.loadCurrentProject(function() {
            return done = true;
          });
        });
        waitsFor(function() {
          return done;
        });
        return runs(function() {
          return expect(atom.config.get('tree-view.showOnRightSide')).toBe(true);
        });
      });
      it("Extends existing array settings", function() {
        var done;
        atom.config.setRawValue('fuzzy-finder.ignoredNames', ['a', 'b', 'c']);
        atom.config.emit('update');
        expect(atom.config.get('fuzzy-finder.ignoredNames').length).toBe(3);
        done = false;
        runs(function() {
          return ProjectManager.loadCurrentProject(function() {
            return done = true;
          });
        });
        waitsFor(function() {
          return done;
        });
        return runs(function() {
          return expect(atom.config.get('fuzzy-finder.ignoredNames').length).toBe(6);
        });
      });
      return it("Doesn't overwrite the user's config file after loading settings", function() {
        var done;
        done = false;
        runs(function() {
          return ProjectManager.loadCurrentProject(function() {
            return done = true;
          });
        });
        waitsFor(function() {
          return done;
        });
        return runs(function() {
          return expect(atom.config.save).not.toHaveBeenCalled();
        });
      });
    });
  });

}).call(this);
