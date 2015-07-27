(function() {
  var ColorSearch;

  require('./spec-helper');

  ColorSearch = require('../lib/color-search');

  describe('ColorSearch', function() {
    var pigments, project, search, _ref;
    _ref = [], search = _ref[0], pigments = _ref[1], project = _ref[2];
    beforeEach(function() {
      atom.config.set('pigments.sourceNames', ['**/*.styl', '**/*.less']);
      waitsForPromise(function() {
        return atom.packages.activatePackage('pigments').then(function(pkg) {
          pigments = pkg.mainModule;
          return project = pigments.getProject();
        });
      });
      return waitsForPromise(function() {
        return project.initialize();
      });
    });
    return describe('when created with basic options', function() {
      beforeEach(function() {
        return search = new ColorSearch({
          sourceNames: atom.config.get('pigments.sourceNames'),
          ignoredNames: ['project/vendor/**'],
          context: project.getContext()
        });
      });
      it('dispatches a did-complete-search when finalizing its search', function() {
        var spy;
        spy = jasmine.createSpy('did-complete-search');
        search.onDidCompleteSearch(spy);
        search.search();
        waitsFor(function() {
          return spy.callCount > 0;
        });
        return runs(function() {
          return expect(spy.argsForCall[0][0].length).toEqual(22);
        });
      });
      return it('dispatches a did-find-matches event for every files', function() {
        var completeSpy, findSpy;
        completeSpy = jasmine.createSpy('did-complete-search');
        findSpy = jasmine.createSpy('did-find-matches');
        search.onDidCompleteSearch(completeSpy);
        search.onDidFindMatches(findSpy);
        search.search();
        waitsFor(function() {
          return completeSpy.callCount > 0;
        });
        return runs(function() {
          expect(findSpy.callCount).toEqual(5);
          return expect(findSpy.argsForCall[0][0].matches.length).toEqual(3);
        });
      });
    });
  });

}).call(this);
