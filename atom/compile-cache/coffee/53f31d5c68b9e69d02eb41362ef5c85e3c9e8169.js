(function() {
  var ColorBuffer, ColorProject, SERIALIZE_MARKERS_VERSION, SERIALIZE_VERSION, TOTAL_COLORS_VARIABLES_IN_PROJECT, TOTAL_VARIABLES_IN_PROJECT, click, fs, jsonFixture, path, temp, _ref;

  fs = require('fs-plus');

  path = require('path');

  temp = require('temp');

  _ref = require('../lib/versions'), SERIALIZE_VERSION = _ref.SERIALIZE_VERSION, SERIALIZE_MARKERS_VERSION = _ref.SERIALIZE_MARKERS_VERSION;

  ColorProject = require('../lib/color-project');

  ColorBuffer = require('../lib/color-buffer');

  jsonFixture = require('./spec-helper').jsonFixture(__dirname, 'fixtures');

  require('../lib/register-elements');

  click = require('./helpers/events').click;

  TOTAL_VARIABLES_IN_PROJECT = 12;

  TOTAL_COLORS_VARIABLES_IN_PROJECT = 10;

  describe('ColorProject', function() {
    var eventSpy, paths, project, promise, rootPath, _ref1;
    _ref1 = [], project = _ref1[0], promise = _ref1[1], rootPath = _ref1[2], paths = _ref1[3], eventSpy = _ref1[4];
    beforeEach(function() {
      var fixturesPath;
      atom.config.set('pigments.sourceNames', ['*.styl', '*.less']);
      atom.config.set('pigments.ignoredNames', []);
      fixturesPath = atom.project.getPaths()[0];
      rootPath = "" + fixturesPath + "/project";
      atom.project.setPaths([rootPath]);
      return project = new ColorProject({
        ignoredNames: ['vendor/*']
      });
    });
    describe('.deserialize', function() {
      return it('restores the project in its previous state', function() {
        var data, json;
        data = {
          root: rootPath,
          timestamp: new Date().toJSON(),
          version: SERIALIZE_VERSION,
          markersVersion: SERIALIZE_MARKERS_VERSION
        };
        json = jsonFixture('base-project.json', data);
        project = ColorProject.deserialize(json);
        expect(project).toBeDefined();
        expect(project.getPaths()).toEqual(["" + rootPath + "/styles/buttons.styl", "" + rootPath + "/styles/variables.styl"]);
        expect(project.getVariables().length).toEqual(TOTAL_VARIABLES_IN_PROJECT);
        return expect(project.getColorVariables().length).toEqual(TOTAL_COLORS_VARIABLES_IN_PROJECT);
      });
    });
    describe('::initialize', function() {
      beforeEach(function() {
        eventSpy = jasmine.createSpy('did-initialize');
        project.onDidInitialize(eventSpy);
        return waitsForPromise(function() {
          return project.initialize();
        });
      });
      it('loads the paths to scan in the project', function() {
        return expect(project.getPaths()).toEqual(["" + rootPath + "/styles/buttons.styl", "" + rootPath + "/styles/variables.styl"]);
      });
      it('scans the loaded paths to retrieve the variables', function() {
        expect(project.getVariables()).toBeDefined();
        return expect(project.getVariables().length).toEqual(TOTAL_VARIABLES_IN_PROJECT);
      });
      return it('dispatches a did-initialize event', function() {
        return expect(eventSpy).toHaveBeenCalled();
      });
    });
    describe('::findAllColors', function() {
      return it('returns all the colors in the legibles files of the project', function() {
        var search;
        search = project.findAllColors();
        return expect(search).toBeDefined();
      });
    });
    describe('when the variables have not been loaded yet', function() {
      describe('::serialize', function() {
        return it('returns an object without paths nor variables', function() {
          var date, expected;
          date = new Date;
          spyOn(project, 'getTimestamp').andCallFake(function() {
            return date;
          });
          expected = {
            deserializer: 'ColorProject',
            timestamp: date,
            version: SERIALIZE_VERSION,
            markersVersion: SERIALIZE_MARKERS_VERSION,
            globalSourceNames: ['*.styl', '*.less'],
            globalIgnoredNames: [],
            ignoredNames: ['vendor/*'],
            buffers: {}
          };
          return expect(project.serialize()).toEqual(expected);
        });
      });
      describe('::getVariablesForPath', function() {
        return it('returns undefined', function() {
          return expect(project.getVariablesForPath("" + rootPath + "/styles/variables.styl")).toEqual([]);
        });
      });
      describe('::getVariableByName', function() {
        return it('returns undefined', function() {
          return expect(project.getVariableByName("foo")).toBeUndefined();
        });
      });
      describe('::getVariableById', function() {
        return it('returns undefined', function() {
          return expect(project.getVariableById(0)).toBeUndefined();
        });
      });
      describe('::getContext', function() {
        return it('returns an empty context', function() {
          expect(project.getContext()).toBeDefined();
          return expect(project.getContext().getVariablesCount()).toEqual(0);
        });
      });
      describe('::getPalette', function() {
        return it('returns an empty palette', function() {
          expect(project.getPalette()).toBeDefined();
          return expect(project.getPalette().getColorsCount()).toEqual(0);
        });
      });
      describe('::reloadVariablesForPath', function() {
        beforeEach(function() {
          spyOn(project, 'initialize').andCallThrough();
          return waitsForPromise(function() {
            return project.reloadVariablesForPath("" + rootPath + "/styles/variables.styl");
          });
        });
        return it('returns a promise hooked on the initialize promise', function() {
          return expect(project.initialize).toHaveBeenCalled();
        });
      });
      return describe('::setIgnoredNames', function() {
        beforeEach(function() {
          project.setIgnoredNames([]);
          return waitsForPromise(function() {
            return project.initialize();
          });
        });
        return it('initializes the project with the new paths', function() {
          return expect(project.getVariables().length).toEqual(32);
        });
      });
    });
    describe('when the project has no variables source files', function() {
      beforeEach(function() {
        var fixturesPath;
        atom.config.set('pigments.sourceNames', ['*.sass']);
        fixturesPath = atom.project.getPaths()[0];
        rootPath = "" + fixturesPath + "-no-sources";
        atom.project.setPaths([rootPath]);
        project = new ColorProject({});
        return waitsForPromise(function() {
          return project.initialize();
        });
      });
      it('initializes the paths with an empty array', function() {
        return expect(project.getPaths()).toEqual([]);
      });
      return it('initializes the variables with an empty array', function() {
        return expect(project.getVariables()).toEqual([]);
      });
    });
    describe('when the project has looping variable definition', function() {
      beforeEach(function() {
        var fixturesPath;
        atom.config.set('pigments.sourceNames', ['*.sass']);
        fixturesPath = atom.project.getPaths()[0];
        rootPath = "" + fixturesPath + "-with-recursion";
        atom.project.setPaths([rootPath]);
        project = new ColorProject({});
        return waitsForPromise(function() {
          return project.initialize();
        });
      });
      return it('ignores the looping definition', function() {
        expect(project.getVariables().length).toEqual(4);
        return expect(project.getColorVariables().length).toEqual(4);
      });
    });
    describe('when the variables have been loaded', function() {
      beforeEach(function() {
        return waitsForPromise(function() {
          return project.initialize();
        });
      });
      describe('::serialize', function() {
        return it('returns an object with project properties', function() {
          var date;
          date = new Date;
          spyOn(project, 'getTimestamp').andCallFake(function() {
            return date;
          });
          return expect(project.serialize()).toEqual({
            deserializer: 'ColorProject',
            ignoredNames: ['vendor/*'],
            timestamp: date,
            version: SERIALIZE_VERSION,
            markersVersion: SERIALIZE_MARKERS_VERSION,
            paths: ["" + rootPath + "/styles/buttons.styl", "" + rootPath + "/styles/variables.styl"],
            globalSourceNames: ['*.styl', '*.less'],
            globalIgnoredNames: [],
            buffers: {},
            variables: project.variables.serialize()
          });
        });
      });
      describe('::getVariablesForPath', function() {
        it('returns the variables defined in the file', function() {
          return expect(project.getVariablesForPath("" + rootPath + "/styles/variables.styl").length).toEqual(TOTAL_VARIABLES_IN_PROJECT);
        });
        return describe('for a file that was ignored in the scanning process', function() {
          return it('returns undefined', function() {
            return expect(project.getVariablesForPath("" + rootPath + "/vendor/css/variables.less")).toEqual([]);
          });
        });
      });
      describe('::deleteVariablesForPath', function() {
        return it('removes all the variables coming from the specified file', function() {
          project.deleteVariablesForPath("" + rootPath + "/styles/variables.styl");
          return expect(project.getVariablesForPath("" + rootPath + "/styles/variables.styl")).toEqual([]);
        });
      });
      describe('::getContext', function() {
        return it('returns a context with the project variables', function() {
          expect(project.getContext()).toBeDefined();
          return expect(project.getContext().getVariablesCount()).toEqual(TOTAL_VARIABLES_IN_PROJECT);
        });
      });
      describe('::getPalette', function() {
        return it('returns a palette with the colors from the project', function() {
          expect(project.getPalette()).toBeDefined();
          return expect(project.getPalette().getColorsCount()).toEqual(10);
        });
      });
      describe('::showVariableInFile', function() {
        return it('opens the file where is located the variable', function() {
          var spy;
          spy = jasmine.createSpy('did-add-text-editor');
          atom.workspace.onDidAddTextEditor(spy);
          project.showVariableInFile(project.getVariables()[0]);
          waitsFor(function() {
            return spy.callCount > 0;
          });
          return runs(function() {
            var editor;
            editor = atom.workspace.getActiveTextEditor();
            return expect(editor.getSelectedBufferRange()).toEqual([[1, 2], [1, 14]]);
          });
        });
      });
      describe('::reloadVariablesForPath', function() {
        return describe('for a file that is part of the loaded paths', function() {
          describe('where the reload finds new variables', function() {
            beforeEach(function() {
              project.deleteVariablesForPath("" + rootPath + "/styles/variables.styl");
              eventSpy = jasmine.createSpy('did-update-variables');
              project.onDidUpdateVariables(eventSpy);
              return waitsForPromise(function() {
                return project.reloadVariablesForPath("" + rootPath + "/styles/variables.styl");
              });
            });
            it('scans again the file to find variables', function() {
              return expect(project.getVariables().length).toEqual(TOTAL_VARIABLES_IN_PROJECT);
            });
            return it('dispatches a did-update-variables event', function() {
              return expect(eventSpy).toHaveBeenCalled();
            });
          });
          return describe('where the reload finds nothing new', function() {
            beforeEach(function() {
              eventSpy = jasmine.createSpy('did-update-variables');
              project.onDidUpdateVariables(eventSpy);
              return waitsForPromise(function() {
                return project.reloadVariablesForPath("" + rootPath + "/styles/variables.styl");
              });
            });
            it('leaves the file variables intact', function() {
              return expect(project.getVariables().length).toEqual(TOTAL_VARIABLES_IN_PROJECT);
            });
            return it('does not dispatch a did-update-variables event', function() {
              return expect(eventSpy).not.toHaveBeenCalled();
            });
          });
        });
      });
      describe('::reloadVariablesForPaths', function() {
        describe('for a file that is part of the loaded paths', function() {
          describe('where the reload finds new variables', function() {
            beforeEach(function() {
              project.deleteVariablesForPaths(["" + rootPath + "/styles/variables.styl", "" + rootPath + "/styles/buttons.styl"]);
              eventSpy = jasmine.createSpy('did-update-variables');
              project.onDidUpdateVariables(eventSpy);
              return waitsForPromise(function() {
                return project.reloadVariablesForPaths(["" + rootPath + "/styles/variables.styl", "" + rootPath + "/styles/buttons.styl"]);
              });
            });
            it('scans again the file to find variables', function() {
              return expect(project.getVariables().length).toEqual(TOTAL_VARIABLES_IN_PROJECT);
            });
            return it('dispatches a did-update-variables event', function() {
              return expect(eventSpy).toHaveBeenCalled();
            });
          });
          return describe('where the reload finds nothing new', function() {
            beforeEach(function() {
              eventSpy = jasmine.createSpy('did-update-variables');
              project.onDidUpdateVariables(eventSpy);
              return waitsForPromise(function() {
                return project.reloadVariablesForPaths(["" + rootPath + "/styles/variables.styl", "" + rootPath + "/styles/buttons.styl"]);
              });
            });
            it('leaves the file variables intact', function() {
              return expect(project.getVariables().length).toEqual(TOTAL_VARIABLES_IN_PROJECT);
            });
            return it('does not dispatch a did-update-variables event', function() {
              return expect(eventSpy).not.toHaveBeenCalled();
            });
          });
        });
        return describe('for a file that is not part of the loaded paths', function() {
          beforeEach(function() {
            spyOn(project, 'loadVariablesForPath').andCallThrough();
            return waitsForPromise(function() {
              return project.reloadVariablesForPath("" + rootPath + "/vendor/css/variables.less");
            });
          });
          return it('does nothing', function() {
            return expect(project.loadVariablesForPath).not.toHaveBeenCalled();
          });
        });
      });
      describe('when a buffer with variables is open', function() {
        var colorBuffer, editor, _ref2;
        _ref2 = [], editor = _ref2[0], colorBuffer = _ref2[1];
        beforeEach(function() {
          eventSpy = jasmine.createSpy('did-update-variables');
          project.onDidUpdateVariables(eventSpy);
          waitsForPromise(function() {
            return atom.workspace.open('styles/variables.styl').then(function(o) {
              return editor = o;
            });
          });
          runs(function() {
            colorBuffer = project.colorBufferForEditor(editor);
            return spyOn(colorBuffer, 'scanBufferForVariables').andCallThrough();
          });
          waitsForPromise(function() {
            return project.initialize();
          });
          return waitsForPromise(function() {
            return colorBuffer.variablesAvailable();
          });
        });
        it('updates the project variable with the buffer ranges', function() {
          var variable, _i, _len, _ref3, _results;
          _ref3 = project.getVariables();
          _results = [];
          for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
            variable = _ref3[_i];
            _results.push(expect(variable.bufferRange).toBeDefined());
          }
          return _results;
        });
        describe('when a color is modified that does not affect other variables ranges', function() {
          var variablesTextRanges;
          variablesTextRanges = [][0];
          beforeEach(function() {
            variablesTextRanges = {};
            project.getVariablesForPath(editor.getPath()).forEach(function(variable) {
              return variablesTextRanges[variable.name] = variable.range;
            });
            editor.setSelectedBufferRange([[1, 7], [1, 14]]);
            editor.insertText('#336');
            editor.getBuffer().emitter.emit('did-stop-changing');
            return waitsFor(function() {
              return eventSpy.callCount > 0;
            });
          });
          it('reloads the variables with the buffer instead of the file', function() {
            expect(colorBuffer.scanBufferForVariables).toHaveBeenCalled();
            return expect(project.getVariables().length).toEqual(TOTAL_VARIABLES_IN_PROJECT);
          });
          it('uses the buffer ranges to detect which variables were really changed', function() {
            expect(eventSpy.argsForCall[0][0].destroyed).toBeUndefined();
            expect(eventSpy.argsForCall[0][0].created).toBeUndefined();
            return expect(eventSpy.argsForCall[0][0].updated.length).toEqual(1);
          });
          it('updates the text range of the other variables', function() {
            return project.getVariablesForPath("" + rootPath + "/styles/variables.styl").forEach(function(variable) {
              if (variable.name !== 'colors.red') {
                expect(variable.range[0]).toEqual(variablesTextRanges[variable.name][0] - 3);
                return expect(variable.range[1]).toEqual(variablesTextRanges[variable.name][1] - 3);
              }
            });
          });
          return it('dispatches a did-update-variables event', function() {
            return expect(eventSpy).toHaveBeenCalled();
          });
        });
        describe('when a text is inserted that affects other variables ranges', function() {
          var variablesBufferRanges, variablesTextRanges, _ref3;
          _ref3 = [], variablesTextRanges = _ref3[0], variablesBufferRanges = _ref3[1];
          beforeEach(function() {
            runs(function() {
              variablesTextRanges = {};
              variablesBufferRanges = {};
              project.getVariablesForPath(editor.getPath()).forEach(function(variable) {
                variablesTextRanges[variable.name] = variable.range;
                return variablesBufferRanges[variable.name] = variable.bufferRange;
              });
              spyOn(project.variables, 'addMany').andCallThrough();
              editor.setSelectedBufferRange([[0, 0], [0, 0]]);
              editor.insertText('\n\n');
              return editor.getBuffer().emitter.emit('did-stop-changing');
            });
            return waitsFor(function() {
              return project.variables.addMany.callCount > 0;
            });
          });
          it('does not trigger a change event', function() {
            return expect(eventSpy.callCount).toEqual(0);
          });
          return it('updates the range of the updated variables', function() {
            return project.getVariablesForPath("" + rootPath + "/styles/variables.styl").forEach(function(variable) {
              if (variable.name !== 'colors.red') {
                expect(variable.range[0]).toEqual(variablesTextRanges[variable.name][0] + 2);
                expect(variable.range[1]).toEqual(variablesTextRanges[variable.name][1] + 2);
                return expect(variable.bufferRange.isEqual(variablesBufferRanges[variable.name])).toBeFalsy();
              }
            });
          });
        });
        describe('when a color is removed', function() {
          var variablesTextRanges;
          variablesTextRanges = [][0];
          beforeEach(function() {
            runs(function() {
              variablesTextRanges = {};
              project.getVariablesForPath(editor.getPath()).forEach(function(variable) {
                return variablesTextRanges[variable.name] = variable.range;
              });
              editor.setSelectedBufferRange([[1, 0], [2, 0]]);
              editor.insertText('');
              return editor.getBuffer().emitter.emit('did-stop-changing');
            });
            return waitsFor(function() {
              return eventSpy.callCount > 0;
            });
          });
          it('reloads the variables with the buffer instead of the file', function() {
            expect(colorBuffer.scanBufferForVariables).toHaveBeenCalled();
            return expect(project.getVariables().length).toEqual(TOTAL_VARIABLES_IN_PROJECT - 1);
          });
          it('uses the buffer ranges to detect which variables were really changed', function() {
            expect(eventSpy.argsForCall[0][0].destroyed.length).toEqual(1);
            expect(eventSpy.argsForCall[0][0].created).toBeUndefined();
            return expect(eventSpy.argsForCall[0][0].updated).toBeUndefined();
          });
          it('can no longer be found in the project variables', function() {
            expect(project.getVariables().some(function(v) {
              return v.name === 'colors.red';
            })).toBeFalsy();
            return expect(project.getColorVariables().some(function(v) {
              return v.name === 'colors.red';
            })).toBeFalsy();
          });
          return it('dispatches a did-update-variables event', function() {
            return expect(eventSpy).toHaveBeenCalled();
          });
        });
        return describe('when all the colors are removed', function() {
          var variablesTextRanges;
          variablesTextRanges = [][0];
          beforeEach(function() {
            runs(function() {
              variablesTextRanges = {};
              project.getVariablesForPath(editor.getPath()).forEach(function(variable) {
                return variablesTextRanges[variable.name] = variable.range;
              });
              editor.setSelectedBufferRange([[0, 0], [Infinity, Infinity]]);
              editor.insertText('');
              return editor.getBuffer().emitter.emit('did-stop-changing');
            });
            return waitsFor(function() {
              return eventSpy.callCount > 0;
            });
          });
          it('removes every variables from the file', function() {
            expect(colorBuffer.scanBufferForVariables).toHaveBeenCalled();
            expect(project.getVariables().length).toEqual(0);
            expect(eventSpy.argsForCall[0][0].destroyed.length).toEqual(TOTAL_VARIABLES_IN_PROJECT);
            expect(eventSpy.argsForCall[0][0].created).toBeUndefined();
            return expect(eventSpy.argsForCall[0][0].updated).toBeUndefined();
          });
          it('can no longer be found in the project variables', function() {
            expect(project.getVariables().some(function(v) {
              return v.name === 'colors.red';
            })).toBeFalsy();
            return expect(project.getColorVariables().some(function(v) {
              return v.name === 'colors.red';
            })).toBeFalsy();
          });
          return it('dispatches a did-update-variables event', function() {
            return expect(eventSpy).toHaveBeenCalled();
          });
        });
      });
      describe('::setIgnoredNames', function() {
        describe('with an empty array', function() {
          beforeEach(function() {
            var spy;
            expect(project.getVariables().length).toEqual(12);
            spy = jasmine.createSpy('did-update-variables');
            project.onDidUpdateVariables(spy);
            project.setIgnoredNames([]);
            return waitsFor(function() {
              return spy.callCount > 0;
            });
          });
          return it('reloads the variables from the new paths', function() {
            return expect(project.getVariables().length).toEqual(32);
          });
        });
        return describe('with a more restrictive array', function() {
          beforeEach(function() {
            var spy;
            expect(project.getVariables().length).toEqual(12);
            spy = jasmine.createSpy('did-update-variables');
            project.onDidUpdateVariables(spy);
            project.setIgnoredNames(['vendor/*', '**/*.styl']);
            return waitsFor(function() {
              return spy.callCount > 0;
            });
          });
          return it('clears all the variables as there is no legible paths', function() {
            expect(project.getPaths().length).toEqual(0);
            return expect(project.getVariables().length).toEqual(0);
          });
        });
      });
      describe('when the project has multiple root directory', function() {
        beforeEach(function() {
          var fixturesPath;
          atom.config.set('pigments.sourceNames', ['**/*.sass', '**/*.styl']);
          fixturesPath = atom.project.getPaths()[0];
          atom.project.setPaths(["" + fixturesPath, "" + fixturesPath + "-with-recursion"]);
          project = new ColorProject({});
          return waitsForPromise(function() {
            return project.initialize();
          });
        });
        return it('finds the variables from the two directories', function() {
          return expect(project.getVariables().length).toEqual(16);
        });
      });
      describe('when the project has VCS ignored files', function() {
        var projectPath;
        projectPath = [][0];
        beforeEach(function() {
          var dotGit, dotGitFixture, fixture;
          atom.config.set('pigments.sourceNames', ['*.sass']);
          fixture = path.join(__dirname, 'fixtures', 'project-with-gitignore');
          projectPath = temp.mkdirSync('pigments-project');
          dotGitFixture = path.join(fixture, 'git.git');
          dotGit = path.join(projectPath, '.git');
          fs.copySync(dotGitFixture, dotGit);
          fs.writeFileSync(path.join(projectPath, '.gitignore'), fs.readFileSync(path.join(fixture, 'git.gitignore')));
          fs.writeFileSync(path.join(projectPath, 'base.sass'), fs.readFileSync(path.join(fixture, 'base.sass')));
          fs.writeFileSync(path.join(projectPath, 'ignored.sass'), fs.readFileSync(path.join(fixture, 'ignored.sass')));
          return atom.project.setPaths([path.join('/private', projectPath)]);
        });
        describe('when the ignoreVcsIgnoredPaths setting is enabled', function() {
          beforeEach(function() {
            atom.config.set('pigments.ignoreVcsIgnoredPaths', true);
            project = new ColorProject({});
            return waitsForPromise(function() {
              return project.initialize();
            });
          });
          it('finds the variables from the two directories', function() {
            return expect(project.getVariables().length).toEqual(3);
          });
          return describe('and then disabled', function() {
            beforeEach(function() {
              var spy;
              spy = jasmine.createSpy('did-update-variables');
              project.onDidUpdateVariables(spy);
              atom.config.set('pigments.ignoreVcsIgnoredPaths', false);
              return waitsFor(function() {
                return spy.callCount > 0;
              });
            });
            it('reloads the paths', function() {
              return expect(project.getPaths().length).toEqual(2);
            });
            return it('reloads the variables', function() {
              return expect(project.getVariables().length).toEqual(6);
            });
          });
        });
        return describe('when the ignoreVcsIgnoredPaths setting is disabled', function() {
          beforeEach(function() {
            atom.config.set('pigments.ignoreVcsIgnoredPaths', false);
            project = new ColorProject({});
            return waitsForPromise(function() {
              return project.initialize();
            });
          });
          it('finds the variables from the two directories', function() {
            return expect(project.getVariables().length).toEqual(6);
          });
          return describe('and then enabled', function() {
            beforeEach(function() {
              var spy;
              spy = jasmine.createSpy('did-update-variables');
              project.onDidUpdateVariables(spy);
              atom.config.set('pigments.ignoreVcsIgnoredPaths', true);
              return waitsFor(function() {
                return spy.callCount > 0;
              });
            });
            it('reloads the paths', function() {
              return expect(project.getPaths().length).toEqual(1);
            });
            return it('reloads the variables', function() {
              return expect(project.getVariables().length).toEqual(3);
            });
          });
        });
      });
      describe('when the sourceNames setting is changed', function() {
        var updateSpy;
        updateSpy = [][0];
        beforeEach(function() {
          var originalPaths;
          originalPaths = project.getPaths();
          atom.config.set('pigments.sourceNames', []);
          return waitsFor(function() {
            return project.getPaths().join(',') !== originalPaths.join(',');
          });
        });
        it('updates the variables using the new pattern', function() {
          return expect(project.getVariables().length).toEqual(0);
        });
        return describe('so that new paths are found', function() {
          beforeEach(function() {
            var originalPaths;
            updateSpy = jasmine.createSpy('did-update-variables');
            originalPaths = project.getPaths();
            project.onDidUpdateVariables(updateSpy);
            atom.config.set('pigments.sourceNames', ['**/*.styl']);
            waitsFor(function() {
              return project.getPaths().join(',') !== originalPaths.join(',');
            });
            return waitsFor(function() {
              return updateSpy.callCount > 0;
            });
          });
          return it('loads the variables from these new paths', function() {
            return expect(project.getVariables().length).toEqual(TOTAL_VARIABLES_IN_PROJECT);
          });
        });
      });
      return describe('when the ignoredNames setting is changed', function() {
        var updateSpy;
        updateSpy = [][0];
        beforeEach(function() {
          var originalPaths;
          originalPaths = project.getPaths();
          atom.config.set('pigments.ignoredNames', ['**/*.styl']);
          return waitsFor(function() {
            return project.getPaths().join(',') !== originalPaths.join(',');
          });
        });
        it('updates the found using the new pattern', function() {
          return expect(project.getVariables().length).toEqual(0);
        });
        return describe('so that new paths are found', function() {
          beforeEach(function() {
            var originalPaths;
            updateSpy = jasmine.createSpy('did-update-variables');
            originalPaths = project.getPaths();
            project.onDidUpdateVariables(updateSpy);
            atom.config.set('pigments.ignoredNames', []);
            waitsFor(function() {
              return project.getPaths().join(',') !== originalPaths.join(',');
            });
            return waitsFor(function() {
              return updateSpy.callCount > 0;
            });
          });
          return it('loads the variables from these new paths', function() {
            return expect(project.getVariables().length).toEqual(TOTAL_VARIABLES_IN_PROJECT);
          });
        });
      });
    });
    return describe('when restored', function() {
      var createProject;
      createProject = function(params) {
        var stateFixture;
        if (params == null) {
          params = {};
        }
        stateFixture = params.stateFixture;
        delete params.stateFixture;
        if (params.root == null) {
          params.root = rootPath;
        }
        if (params.timestamp == null) {
          params.timestamp = new Date().toJSON();
        }
        if (params.variableMarkers == null) {
          params.variableMarkers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        }
        if (params.colorMarkers == null) {
          params.colorMarkers = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
        }
        if (params.version == null) {
          params.version = SERIALIZE_VERSION;
        }
        if (params.markersVersion == null) {
          params.markersVersion = SERIALIZE_MARKERS_VERSION;
        }
        return ColorProject.deserialize(jsonFixture(stateFixture, params));
      };
      describe('with a timestamp more recent than the files last modification date', function() {
        beforeEach(function() {
          project = createProject({
            stateFixture: "empty-project.json"
          });
          return waitsForPromise(function() {
            return project.initialize();
          });
        });
        return it('does not rescans the files', function() {
          return expect(project.getVariables().length).toEqual(1);
        });
      });
      describe('with a version different that the current one', function() {
        beforeEach(function() {
          project = createProject({
            stateFixture: "empty-project.json",
            version: "0.0.0"
          });
          return waitsForPromise(function() {
            return project.initialize();
          });
        });
        return it('drops the whole serialized state and rescans all the project', function() {
          return expect(project.getVariables().length).toEqual(32);
        });
      });
      describe('with a serialized path that no longer exist', function() {
        beforeEach(function() {
          project = createProject({
            stateFixture: "rename-file-project.json"
          });
          return waitsForPromise(function() {
            return project.initialize();
          });
        });
        it('drops drops the non-existing and reload the paths', function() {
          return expect(project.getPaths()).toEqual(["" + rootPath + "/styles/buttons.styl", "" + rootPath + "/styles/variables.styl"]);
        });
        it('drops the variables from the removed paths', function() {
          return expect(project.getVariablesForPath("" + rootPath + "/styles/foo.styl").length).toEqual(0);
        });
        return it('loads the variables from the new file', function() {
          return expect(project.getVariablesForPath("" + rootPath + "/styles/variables.styl").length).toEqual(12);
        });
      });
      describe('with a sourceNames setting value different than when serialized', function() {
        beforeEach(function() {
          atom.config.set('pigments.sourceNames', []);
          project = createProject({
            stateFixture: "empty-project.json"
          });
          return waitsForPromise(function() {
            return project.initialize();
          });
        });
        return it('drops the whole serialized state and rescans all the project', function() {
          return expect(project.getVariables().length).toEqual(0);
        });
      });
      describe('with a markers version different that the current one', function() {
        beforeEach(function() {
          project = createProject({
            stateFixture: "empty-project.json",
            markersVersion: "0.0.0"
          });
          return waitsForPromise(function() {
            return project.initialize();
          });
        });
        it('keeps the project related data', function() {
          expect(project.ignoredNames).toEqual(['vendor/*']);
          return expect(project.getPaths()).toEqual(["" + rootPath + "/styles/buttons.styl", "" + rootPath + "/styles/variables.styl"]);
        });
        return it('drops the variables and buffers data', function() {
          return expect(project.getVariables().length).toEqual(TOTAL_VARIABLES_IN_PROJECT);
        });
      });
      describe('with a timestamp older than the files last modification date', function() {
        beforeEach(function() {
          project = createProject({
            timestamp: new Date(0).toJSON(),
            stateFixture: "empty-project.json"
          });
          return waitsForPromise(function() {
            return project.initialize();
          });
        });
        return it('scans again all the files that have a more recent modification date', function() {
          return expect(project.getVariables().length).toEqual(TOTAL_VARIABLES_IN_PROJECT);
        });
      });
      describe('with some files not saved in the project state', function() {
        beforeEach(function() {
          project = createProject({
            stateFixture: "partial-project.json"
          });
          return waitsForPromise(function() {
            return project.initialize();
          });
        });
        return it('detects the new files and scans them', function() {
          return expect(project.getVariables().length).toEqual(12);
        });
      });
      describe('with an open editor and the corresponding buffer state', function() {
        var colorBuffer, editor, _ref2;
        _ref2 = [], editor = _ref2[0], colorBuffer = _ref2[1];
        beforeEach(function() {
          waitsForPromise(function() {
            return atom.workspace.open('variables.styl').then(function(o) {
              return editor = o;
            });
          });
          runs(function() {
            project = createProject({
              stateFixture: "open-buffer-project.json",
              id: editor.id
            });
            return spyOn(ColorBuffer.prototype, 'variablesAvailable').andCallThrough();
          });
          return runs(function() {
            return colorBuffer = project.colorBuffersByEditorId[editor.id];
          });
        });
        it('restores the color buffer in its previous state', function() {
          expect(colorBuffer).toBeDefined();
          return expect(colorBuffer.getColorMarkers().length).toEqual(TOTAL_COLORS_VARIABLES_IN_PROJECT);
        });
        return it('does not wait for the project variables', function() {
          return expect(colorBuffer.variablesAvailable).not.toHaveBeenCalled();
        });
      });
      return describe('with an open editor, the corresponding buffer state and a old timestamp', function() {
        var colorBuffer, editor, _ref2;
        _ref2 = [], editor = _ref2[0], colorBuffer = _ref2[1];
        beforeEach(function() {
          waitsForPromise(function() {
            return atom.workspace.open('variables.styl').then(function(o) {
              return editor = o;
            });
          });
          runs(function() {
            spyOn(ColorBuffer.prototype, 'updateVariableRanges').andCallThrough();
            return project = createProject({
              timestamp: new Date(0).toJSON(),
              stateFixture: "open-buffer-project.json",
              id: editor.id
            });
          });
          runs(function() {
            return colorBuffer = project.colorBuffersByEditorId[editor.id];
          });
          return waitsFor(function() {
            return colorBuffer.updateVariableRanges.callCount > 0;
          });
        });
        return it('invalidates the color buffer markers as soon as the dirty paths have been determined', function() {
          return expect(colorBuffer.updateVariableRanges).toHaveBeenCalled();
        });
      });
    });
  });

  xdescribe('ColorProject', function() {
    var project, rootPath, _ref1;
    _ref1 = [], project = _ref1[0], rootPath = _ref1[1];
    return describe('when the project has a pigments defaults file', function() {
      beforeEach(function() {
        var fixturesPath;
        atom.config.set('pigments.sourceNames', ['*.sass']);
        fixturesPath = atom.project.getPaths()[0];
        rootPath = "" + fixturesPath + "/project-with-defaults";
        atom.project.setPaths([rootPath]);
        project = new ColorProject({});
        return waitsForPromise(function() {
          return project.initialize();
        });
      });
      return it('uses the defaults in the .pigments file in priority', function() {
        expect(project.getColorVariables().length).toEqual(4);
        return expect(project.getVariableByName('$button-color').getColor()).toBeColor(255, 255, 255, 1);
      });
    });
  });

}).call(this);
