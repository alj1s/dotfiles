(function() {
  var ColorBuffer, jsonFixture, path,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  path = require('path');

  ColorBuffer = require('../lib/color-buffer');

  jsonFixture = require('./spec-helper').jsonFixture(__dirname, 'fixtures');

  describe('ColorBuffer', function() {
    var colorBuffer, editBuffer, editor, pigments, project, sleep, _ref;
    _ref = [], editor = _ref[0], colorBuffer = _ref[1], pigments = _ref[2], project = _ref[3];
    sleep = function(ms) {
      var start;
      start = new Date;
      return function() {
        return new Date - start >= ms;
      };
    };
    editBuffer = function(text, options) {
      var range;
      if (options == null) {
        options = {};
      }
      if (options.start != null) {
        if (options.end != null) {
          range = [options.start, options.end];
        } else {
          range = [options.start, options.start];
        }
        editor.setSelectedBufferRange(range);
      }
      editor.insertText(text);
      if (!options.noEvent) {
        return advanceClock(500);
      }
    };
    beforeEach(function() {
      atom.config.set('pigments.delayBeforeScan', 0);
      atom.config.set('pigments.sourceNames', ['*.styl', '*.less']);
      atom.config.set('pigments.ignoredNames', ['project/vendor/**']);
      waitsForPromise(function() {
        return atom.workspace.open('four-variables.styl').then(function(o) {
          return editor = o;
        });
      });
      return waitsForPromise(function() {
        return atom.packages.activatePackage('pigments').then(function(pkg) {
          pigments = pkg.mainModule;
          return project = pigments.getProject();
        });
      });
    });
    it('creates a color buffer for each editor in the workspace', function() {
      return expect(project.colorBuffersByEditorId[editor.id]).toBeDefined();
    });
    describe('when an editor without path is opened', function() {
      beforeEach(function() {
        waitsForPromise(function() {
          return atom.workspace.open().then(function(o) {
            editor = o;
            return colorBuffer = project.colorBufferForEditor(editor);
          });
        });
        return waitsForPromise(function() {
          return colorBuffer.variablesAvailable();
        });
      });
      it('does not fails when updating the colorBuffer', function() {
        return expect(function() {
          return colorBuffer.update();
        }).not.toThrow();
      });
      return describe('when the file is saved and aquires a path', function() {
        describe('that is legible', function() {
          beforeEach(function() {
            spyOn(colorBuffer, 'update').andCallThrough();
            spyOn(editor, 'getPath').andReturn('new-path.styl');
            editor.emitter.emit('did-change-path', editor.getPath());
            return waitsFor(function() {
              return colorBuffer.update.callCount > 0;
            });
          });
          return it('adds the path to the project paths', function() {
            return expect(__indexOf.call(project.getPaths(), 'new-path.styl') >= 0).toBeTruthy();
          });
        });
        describe('that is not legible', function() {
          beforeEach(function() {
            spyOn(colorBuffer, 'update').andCallThrough();
            spyOn(editor, 'getPath').andReturn('new-path.sass');
            editor.emitter.emit('did-change-path', editor.getPath());
            return waitsFor(function() {
              return colorBuffer.update.callCount > 0;
            });
          });
          return it('does not add the path to the project paths', function() {
            return expect(__indexOf.call(project.getPaths(), 'new-path.styl') >= 0).toBeFalsy();
          });
        });
        return describe('that is ignored', function() {
          beforeEach(function() {
            spyOn(colorBuffer, 'update').andCallThrough();
            spyOn(editor, 'getPath').andReturn('project/vendor/new-path.styl');
            editor.emitter.emit('did-change-path', editor.getPath());
            return waitsFor(function() {
              return colorBuffer.update.callCount > 0;
            });
          });
          return it('does not add the path to the project paths', function() {
            return expect(__indexOf.call(project.getPaths(), 'new-path.styl') >= 0).toBeFalsy();
          });
        });
      });
    });
    describe('with rapid changes that triggers a rescan', function() {
      beforeEach(function() {
        colorBuffer = project.colorBufferForEditor(editor);
        waitsFor(function() {
          return colorBuffer.initialized && colorBuffer.variableInitialized;
        });
        runs(function() {
          spyOn(colorBuffer, 'terminateRunningTask').andCallThrough();
          spyOn(colorBuffer, 'updateColorMarkers').andCallThrough();
          spyOn(colorBuffer, 'scanBufferForVariables').andCallThrough();
          editor.moveToBottom();
          editor.insertText('#fff\n');
          return editor.getBuffer().emitter.emit('did-stop-changing');
        });
        waitsFor(function() {
          return colorBuffer.scanBufferForVariables.callCount > 0;
        });
        return runs(function() {
          editor.insertText(' ');
          editor.emitter.emit('did-change');
          return editor.getBuffer().emitter.emit('did-stop-changing');
        });
      });
      return it('terminates the currently running task', function() {
        return expect(colorBuffer.terminateRunningTask).toHaveBeenCalled();
      });
    });
    describe('when created without a previous state', function() {
      beforeEach(function() {
        colorBuffer = project.colorBufferForEditor(editor);
        return waitsForPromise(function() {
          return colorBuffer.initialize();
        });
      });
      it('scans the buffer for colors without waiting for the project variables', function() {
        expect(colorBuffer.getColorMarkers().length).toEqual(4);
        return expect(colorBuffer.getValidColorMarkers().length).toEqual(3);
      });
      it('creates the corresponding markers in the text editor', function() {
        return expect(editor.findMarkers({
          type: 'pigments-color'
        }).length).toEqual(4);
      });
      it('knows that it is legible as a variables source file', function() {
        return expect(colorBuffer.isVariablesSource()).toBeTruthy();
      });
      describe('when the editor is destroyed', function() {
        return it('destroys the color buffer at the same time', function() {
          editor.destroy();
          return expect(project.colorBuffersByEditorId[editor.id]).toBeUndefined();
        });
      });
      describe('::getColorMarkerAtBufferPosition', function() {
        describe('when the buffer position is contained in a marker range', function() {
          return it('returns the corresponding color marker', function() {
            var colorMarker;
            colorMarker = colorBuffer.getColorMarkerAtBufferPosition([2, 15]);
            return expect(colorMarker).toEqual(colorBuffer.colorMarkers[1]);
          });
        });
        return describe('when the buffer position is not contained in a marker range', function() {
          return it('returns undefined', function() {
            return expect(colorBuffer.getColorMarkerAtBufferPosition([1, 15])).toBeUndefined();
          });
        });
      });
      describe('when the project variables becomes available', function() {
        var updateSpy;
        updateSpy = [][0];
        beforeEach(function() {
          updateSpy = jasmine.createSpy('did-update-color-markers');
          colorBuffer.onDidUpdateColorMarkers(updateSpy);
          return waitsForPromise(function() {
            return colorBuffer.variablesAvailable();
          });
        });
        it('replaces the invalid markers that are now valid', function() {
          expect(colorBuffer.getValidColorMarkers().length).toEqual(4);
          expect(updateSpy.argsForCall[0][0].created.length).toEqual(1);
          return expect(updateSpy.argsForCall[0][0].destroyed.length).toEqual(1);
        });
        it('destroys the text editor markers', function() {
          return expect(editor.findMarkers({
            type: 'pigments-color'
          }).length).toEqual(4);
        });
        describe('when a variable is edited', function() {
          var colorsUpdateSpy;
          colorsUpdateSpy = [][0];
          beforeEach(function() {
            colorsUpdateSpy = jasmine.createSpy('did-update-color-markers');
            colorBuffer.onDidUpdateColorMarkers(colorsUpdateSpy);
            return editBuffer('#336699', {
              start: [0, 13],
              end: [0, 17]
            });
          });
          return it('updates the modified colors', function() {
            waitsFor(function() {
              return colorsUpdateSpy.callCount > 0;
            });
            return runs(function() {
              expect(colorsUpdateSpy.argsForCall[0][0].destroyed.length).toEqual(2);
              return expect(colorsUpdateSpy.argsForCall[0][0].created.length).toEqual(2);
            });
          });
        });
        describe('when a new variable is added', function() {
          var colorsUpdateSpy;
          colorsUpdateSpy = [][0];
          beforeEach(function() {
            waitsForPromise(function() {
              return colorBuffer.variablesAvailable();
            });
            return runs(function() {
              updateSpy = jasmine.createSpy('did-update-color-markers');
              colorBuffer.onDidUpdateColorMarkers(updateSpy);
              editor.moveToBottom();
              editBuffer('\nfoo = base-color');
              return waitsFor(function() {
                return updateSpy.callCount > 0;
              });
            });
          });
          return it('dispatches the new marker in a did-update-color-markers event', function() {
            expect(updateSpy.argsForCall[0][0].destroyed.length).toEqual(0);
            return expect(updateSpy.argsForCall[0][0].created.length).toEqual(1);
          });
        });
        describe('when a variable is removed', function() {
          var colorsUpdateSpy;
          colorsUpdateSpy = [][0];
          beforeEach(function() {
            colorsUpdateSpy = jasmine.createSpy('did-update-color-markers');
            colorBuffer.onDidUpdateColorMarkers(colorsUpdateSpy);
            editBuffer('', {
              start: [0, 0],
              end: [0, 17]
            });
            return waitsFor(function() {
              return colorsUpdateSpy.callCount > 0;
            });
          });
          return it('invalidates colors that were relying on the deleted variables', function() {
            expect(colorBuffer.getColorMarkers().length).toEqual(3);
            return expect(colorBuffer.getValidColorMarkers().length).toEqual(2);
          });
        });
        return describe('::serialize', function() {
          beforeEach(function() {
            return waitsForPromise(function() {
              return colorBuffer.variablesAvailable();
            });
          });
          return it('returns the whole buffer data', function() {
            var expected;
            expected = jsonFixture("four-variables-buffer.json", {
              id: editor.id,
              root: atom.project.getPaths()[0],
              colorMarkers: colorBuffer.getColorMarkers().map(function(m) {
                return m.marker.id;
              })
            });
            return expect(colorBuffer.serialize()).toEqual(expected);
          });
        });
      });
      describe('with a buffer with only colors', function() {
        beforeEach(function() {
          waitsForPromise(function() {
            return atom.workspace.open('buttons.styl').then(function(o) {
              return editor = o;
            });
          });
          return runs(function() {
            return colorBuffer = project.colorBufferForEditor(editor);
          });
        });
        it('creates the color markers for the variables used in the buffer', function() {
          waitsForPromise(function() {
            return colorBuffer.initialize();
          });
          return runs(function() {
            return expect(colorBuffer.getColorMarkers().length).toEqual(0);
          });
        });
        it('creates the color markers for the variables used in the buffer', function() {
          waitsForPromise(function() {
            return colorBuffer.variablesAvailable();
          });
          return runs(function() {
            return expect(colorBuffer.getColorMarkers().length).toEqual(3);
          });
        });
        describe('when a color marker is edited', function() {
          var colorsUpdateSpy;
          colorsUpdateSpy = [][0];
          beforeEach(function() {
            waitsForPromise(function() {
              return colorBuffer.variablesAvailable();
            });
            return runs(function() {
              colorsUpdateSpy = jasmine.createSpy('did-update-color-markers');
              colorBuffer.onDidUpdateColorMarkers(colorsUpdateSpy);
              editBuffer('#336699', {
                start: [1, 13],
                end: [1, 23]
              });
              return waitsFor(function() {
                return colorsUpdateSpy.callCount > 0;
              });
            });
          });
          it('updates the modified color marker', function() {
            var marker, markers;
            markers = colorBuffer.getColorMarkers();
            marker = markers[markers.length - 1];
            return expect(marker.color).toBeColor('#336699');
          });
          it('updates only the affected marker', function() {
            expect(colorsUpdateSpy.argsForCall[0][0].destroyed.length).toEqual(1);
            return expect(colorsUpdateSpy.argsForCall[0][0].created.length).toEqual(1);
          });
          return it('removes the previous editor markers', function() {
            return expect(editor.findMarkers({
              type: 'pigments-color'
            }).length).toEqual(3);
          });
        });
        describe('when new lines changes the markers range', function() {
          var colorsUpdateSpy;
          colorsUpdateSpy = [][0];
          beforeEach(function() {
            waitsForPromise(function() {
              return colorBuffer.variablesAvailable();
            });
            return runs(function() {
              colorsUpdateSpy = jasmine.createSpy('did-update-color-markers');
              colorBuffer.onDidUpdateColorMarkers(colorsUpdateSpy);
              editBuffer('#fff\n\n', {
                start: [0, 0],
                end: [0, 0]
              });
              return waitsFor(function() {
                return colorsUpdateSpy.callCount > 0;
              });
            });
          });
          return it('does not destroys the previous markers', function() {
            expect(colorsUpdateSpy.argsForCall[0][0].destroyed.length).toEqual(0);
            return expect(colorsUpdateSpy.argsForCall[0][0].created.length).toEqual(1);
          });
        });
        describe('when a new color is added', function() {
          var colorsUpdateSpy;
          colorsUpdateSpy = [][0];
          beforeEach(function() {
            waitsForPromise(function() {
              return colorBuffer.variablesAvailable();
            });
            return runs(function() {
              colorsUpdateSpy = jasmine.createSpy('did-update-color-markers');
              colorBuffer.onDidUpdateColorMarkers(colorsUpdateSpy);
              editor.moveToBottom();
              editBuffer('\n#336699');
              return waitsFor(function() {
                return colorsUpdateSpy.callCount > 0;
              });
            });
          });
          it('adds a marker for the new color', function() {
            var marker, markers;
            markers = colorBuffer.getColorMarkers();
            marker = markers[markers.length - 1];
            expect(markers.length).toEqual(4);
            expect(marker.color).toBeColor('#336699');
            return expect(editor.findMarkers({
              type: 'pigments-color'
            }).length).toEqual(4);
          });
          return it('dispatches the new marker in a did-update-color-markers event', function() {
            expect(colorsUpdateSpy.argsForCall[0][0].destroyed.length).toEqual(0);
            return expect(colorsUpdateSpy.argsForCall[0][0].created.length).toEqual(1);
          });
        });
        return describe('when a color marker is edited', function() {
          var colorsUpdateSpy;
          colorsUpdateSpy = [][0];
          beforeEach(function() {
            waitsForPromise(function() {
              return colorBuffer.variablesAvailable();
            });
            return runs(function() {
              colorsUpdateSpy = jasmine.createSpy('did-update-color-markers');
              colorBuffer.onDidUpdateColorMarkers(colorsUpdateSpy);
              editBuffer('', {
                start: [1, 2],
                end: [1, 23]
              });
              return waitsFor(function() {
                return colorsUpdateSpy.callCount > 0;
              });
            });
          });
          it('updates the modified color marker', function() {
            return expect(colorBuffer.getColorMarkers().length).toEqual(2);
          });
          it('updates only the affected marker', function() {
            expect(colorsUpdateSpy.argsForCall[0][0].destroyed.length).toEqual(1);
            return expect(colorsUpdateSpy.argsForCall[0][0].created.length).toEqual(0);
          });
          return it('removes the previous editor markers', function() {
            return expect(editor.findMarkers({
              type: 'pigments-color'
            }).length).toEqual(2);
          });
        });
      });
      return describe('with a buffer whose scope is not one of source files', function() {
        beforeEach(function() {
          waitsForPromise(function() {
            return atom.workspace.open('project/lib/main.coffee').then(function(o) {
              return editor = o;
            });
          });
          runs(function() {
            return colorBuffer = project.colorBufferForEditor(editor);
          });
          return waitsForPromise(function() {
            return colorBuffer.variablesAvailable();
          });
        });
        return it('does not renders colors from variables', function() {
          return expect(colorBuffer.getColorMarkers().length).toEqual(4);
        });
      });
    });
    describe('with a buffer part of the global ignored files', function() {
      beforeEach(function() {
        project.setIgnoredNames([]);
        atom.config.set('pigments.ignoredNames', ['project/vendor/*']);
        waitsForPromise(function() {
          return atom.workspace.open('project/vendor/css/variables.less').then(function(o) {
            return editor = o;
          });
        });
        runs(function() {
          return colorBuffer = project.colorBufferForEditor(editor);
        });
        return waitsForPromise(function() {
          return colorBuffer.variablesAvailable();
        });
      });
      it('knows that it is part of the ignored files', function() {
        return expect(colorBuffer.isIgnored()).toBeTruthy();
      });
      it('knows that it is a variables source file', function() {
        return expect(colorBuffer.isVariablesSource()).toBeTruthy();
      });
      return it('scans the buffer for variables for in-buffer use only', function() {
        var validMarkers;
        expect(colorBuffer.getColorMarkers().length).toEqual(20);
        validMarkers = colorBuffer.getColorMarkers().filter(function(m) {
          return m.color.isValid();
        });
        return expect(validMarkers.length).toEqual(20);
      });
    });
    describe('with a buffer part of the project ignored files', function() {
      beforeEach(function() {
        waitsForPromise(function() {
          return atom.workspace.open('project/vendor/css/variables.less').then(function(o) {
            return editor = o;
          });
        });
        runs(function() {
          return colorBuffer = project.colorBufferForEditor(editor);
        });
        return waitsForPromise(function() {
          return colorBuffer.variablesAvailable();
        });
      });
      it('knows that it is part of the ignored files', function() {
        return expect(colorBuffer.isIgnored()).toBeTruthy();
      });
      it('knows that it is a variables source file', function() {
        return expect(colorBuffer.isVariablesSource()).toBeTruthy();
      });
      it('scans the buffer for variables for in-buffer use only', function() {
        var validMarkers;
        expect(colorBuffer.getColorMarkers().length).toEqual(20);
        validMarkers = colorBuffer.getColorMarkers().filter(function(m) {
          return m.color.isValid();
        });
        return expect(validMarkers.length).toEqual(20);
      });
      return describe('when the buffer is edited', function() {
        beforeEach(function() {
          var colorsUpdateSpy;
          colorsUpdateSpy = jasmine.createSpy('did-update-color-markers');
          colorBuffer.onDidUpdateColorMarkers(colorsUpdateSpy);
          editor.moveToBottom();
          editBuffer('\n\n@new-color = @base0;\n');
          return waitsFor(function() {
            return colorsUpdateSpy.callCount > 0;
          });
        });
        return it('finds the newly added color', function() {
          var validMarkers;
          expect(colorBuffer.getColorMarkers().length).toEqual(21);
          validMarkers = colorBuffer.getColorMarkers().filter(function(m) {
            return m.color.isValid();
          });
          return expect(validMarkers.length).toEqual(21);
        });
      });
    });
    describe('with a buffer not being a variable source', function() {
      beforeEach(function() {
        waitsForPromise(function() {
          return atom.workspace.open('project/lib/main.coffee').then(function(o) {
            return editor = o;
          });
        });
        runs(function() {
          return colorBuffer = project.colorBufferForEditor(editor);
        });
        return waitsForPromise(function() {
          return colorBuffer.variablesAvailable();
        });
      });
      it('knows that it is not part of the source files', function() {
        return expect(colorBuffer.isVariablesSource()).toBeFalsy();
      });
      it('knows that it is not part of the ignored files', function() {
        return expect(colorBuffer.isIgnored()).toBeFalsy();
      });
      it('scans the buffer for variables for in-buffer use only', function() {
        var validMarkers;
        expect(colorBuffer.getColorMarkers().length).toEqual(4);
        validMarkers = colorBuffer.getColorMarkers().filter(function(m) {
          return m.color.isValid();
        });
        return expect(validMarkers.length).toEqual(4);
      });
      return describe('when the buffer is edited', function() {
        beforeEach(function() {
          var colorsUpdateSpy;
          colorsUpdateSpy = jasmine.createSpy('did-update-color-markers');
          spyOn(project, 'reloadVariablesForPath').andCallThrough();
          colorBuffer.onDidUpdateColorMarkers(colorsUpdateSpy);
          editor.moveToBottom();
          editBuffer('\n\n@new-color = red;\n');
          return waitsFor(function() {
            return colorsUpdateSpy.callCount > 0;
          });
        });
        it('finds the newly added color', function() {
          var validMarkers;
          expect(colorBuffer.getColorMarkers().length).toEqual(5);
          validMarkers = colorBuffer.getColorMarkers().filter(function(m) {
            return m.color.isValid();
          });
          return expect(validMarkers.length).toEqual(5);
        });
        return it('does not ask the project to reload the variables', function() {
          return expect(project.reloadVariablesForPath.mostRecentCall.args[0]).not.toEqual(colorBuffer.editor.getPath());
        });
      });
    });
    return describe('when created with a previous state', function() {
      describe('with variables and colors', function() {
        beforeEach(function() {
          waitsForPromise(function() {
            return project.initialize();
          });
          return runs(function() {
            var state;
            project.colorBufferForEditor(editor).destroy();
            state = jsonFixture('four-variables-buffer.json', {
              id: editor.id,
              root: atom.project.getPaths()[0],
              colorMarkers: [-1, -2, -3, -4]
            });
            state.editor = editor;
            state.project = project;
            return colorBuffer = new ColorBuffer(state);
          });
        });
        it('creates markers from the state object', function() {
          return expect(colorBuffer.getColorMarkers().length).toEqual(4);
        });
        it('restores the markers properties', function() {
          var colorMarker;
          colorMarker = colorBuffer.getColorMarkers()[3];
          expect(colorMarker.color).toBeColor(255, 255, 255, 0.5);
          return expect(colorMarker.color.variables).toEqual(['base-color']);
        });
        it('restores the editor markers', function() {
          return expect(editor.findMarkers({
            type: 'pigments-color'
          }).length).toEqual(4);
        });
        return it('restores the ability to fetch markers', function() {
          var marker, _i, _len, _ref1, _results;
          expect(colorBuffer.findColorMarkers().length).toEqual(4);
          _ref1 = colorBuffer.findColorMarkers();
          _results = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            marker = _ref1[_i];
            _results.push(expect(marker).toBeDefined());
          }
          return _results;
        });
      });
      return describe('with an invalid color', function() {
        beforeEach(function() {
          waitsForPromise(function() {
            return atom.workspace.open('invalid-color.styl').then(function(o) {
              return editor = o;
            });
          });
          waitsForPromise(function() {
            return project.initialize();
          });
          return runs(function() {
            var state;
            state = jsonFixture('invalid-color-buffer.json', {
              id: editor.id,
              root: atom.project.getPaths()[0],
              colorMarkers: [-1]
            });
            state.editor = editor;
            state.project = project;
            return colorBuffer = new ColorBuffer(state);
          });
        });
        return it('creates markers from the state object', function() {
          expect(colorBuffer.getColorMarkers().length).toEqual(1);
          return expect(colorBuffer.getValidColorMarkers().length).toEqual(0);
        });
      });
    });
  });

}).call(this);
