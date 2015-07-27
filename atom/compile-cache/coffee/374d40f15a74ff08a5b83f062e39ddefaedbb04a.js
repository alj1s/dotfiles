(function() {
  var Pigments, PigmentsAPI, SERIALIZE_MARKERS_VERSION, SERIALIZE_VERSION, _ref;

  Pigments = require('../lib/pigments');

  PigmentsAPI = require('../lib/pigments-api');

  _ref = require('../lib/versions'), SERIALIZE_VERSION = _ref.SERIALIZE_VERSION, SERIALIZE_MARKERS_VERSION = _ref.SERIALIZE_MARKERS_VERSION;

  describe("Pigments", function() {
    var pigments, project, workspaceElement, _ref1;
    _ref1 = [], workspaceElement = _ref1[0], pigments = _ref1[1], project = _ref1[2];
    beforeEach(function() {
      workspaceElement = atom.views.getView(atom.workspace);
      jasmine.attachToDOM(workspaceElement);
      atom.config.set('pigments.sourceNames', ['**/*.sass', '**/*.styl']);
      atom.config.set('pigments.ignoredNames', []);
      atom.config.set('pigments.ignoredScopes', []);
      atom.config.set('pigments.autocompleteScopes', []);
      return waitsForPromise(function() {
        return atom.packages.activatePackage('pigments').then(function(pkg) {
          pigments = pkg.mainModule;
          return project = pigments.getProject();
        });
      });
    });
    it('instanciates a ColorProject instance', function() {
      return expect(pigments.getProject()).toBeDefined();
    });
    it('serializes the project', function() {
      var date;
      date = new Date;
      spyOn(pigments.getProject(), 'getTimestamp').andCallFake(function() {
        return date;
      });
      return expect(pigments.serialize()).toEqual({
        project: {
          deserializer: 'ColorProject',
          timestamp: date,
          version: SERIALIZE_VERSION,
          markersVersion: SERIALIZE_MARKERS_VERSION,
          globalSourceNames: ['**/*.sass', '**/*.styl'],
          globalIgnoredNames: [],
          buffers: {}
        }
      });
    });
    describe('service provider API', function() {
      var buffer, editor, editorElement, service, _ref2;
      _ref2 = [], service = _ref2[0], editor = _ref2[1], editorElement = _ref2[2], buffer = _ref2[3];
      beforeEach(function() {
        waitsForPromise(function() {
          return atom.workspace.open('four-variables.styl').then(function(e) {
            editor = e;
            editorElement = atom.views.getView(e);
            return buffer = project.colorBufferForEditor(editor);
          });
        });
        runs(function() {
          return service = pigments.provideAPI();
        });
        return waitsForPromise(function() {
          return project.initialize();
        });
      });
      it('returns an object conforming to the API', function() {
        expect(service instanceof PigmentsAPI).toBeTruthy();
        expect(service.getProject()).toBe(project);
        expect(service.getPalette()).toEqual(project.getPalette());
        expect(service.getPalette()).not.toBe(project.getPalette());
        expect(service.getVariables()).toEqual(project.getVariables());
        return expect(service.getColorVariables()).toEqual(project.getColorVariables());
      });
      return describe('::observeColorBuffers', function() {
        var spy;
        spy = [][0];
        beforeEach(function() {
          spy = jasmine.createSpy('did-create-color-buffer');
          return service.observeColorBuffers(spy);
        });
        it('calls the callback for every existing color buffers', function() {
          expect(spy).toHaveBeenCalled();
          return expect(spy.calls.length).toEqual(1);
        });
        return it('calls the callback on every new buffer creation', function() {
          waitsForPromise(function() {
            return atom.workspace.open('buttons.styl');
          });
          return runs(function() {
            return expect(spy.calls.length).toEqual(2);
          });
        });
      });
    });
    return describe('when deactivated', function() {
      var colorBuffer, editor, editorElement, _ref2;
      _ref2 = [], editor = _ref2[0], editorElement = _ref2[1], colorBuffer = _ref2[2];
      beforeEach(function() {
        waitsForPromise(function() {
          return atom.workspace.open('four-variables.styl').then(function(e) {
            editor = e;
            editorElement = atom.views.getView(e);
            return colorBuffer = project.colorBufferForEditor(editor);
          });
        });
        waitsFor(function() {
          return editorElement.shadowRoot.querySelector('pigments-markers');
        });
        return runs(function() {
          spyOn(project, 'destroy').andCallThrough();
          spyOn(colorBuffer, 'destroy').andCallThrough();
          return pigments.deactivate();
        });
      });
      it('destroys the pigments project', function() {
        return expect(project.destroy).toHaveBeenCalled();
      });
      it('destroys all the color buffers that were created', function() {
        expect(project.colorBufferForEditor(editor)).toBeUndefined();
        expect(project.colorBuffersByEditorId).toBeNull();
        return expect(colorBuffer.destroy).toHaveBeenCalled();
      });
      return it('destroys the color buffer element that were added to the DOM', function() {
        return expect(editorElement.shadowRoot.querySelector('pigments-markers')).not.toExist();
      });
    });
  });

}).call(this);
