(function() {
  var VariablesCollection;

  VariablesCollection = require('../lib/variables-collection');

  describe('VariablesCollection', function() {
    var changeSpy, collection, createVar, _ref;
    _ref = [], collection = _ref[0], changeSpy = _ref[1];
    createVar = function(name, value, range, path, line) {
      return {
        name: name,
        value: value,
        range: range,
        path: path,
        line: line
      };
    };
    return describe('with an empty collection', function() {
      beforeEach(function() {
        collection = new VariablesCollection;
        changeSpy = jasmine.createSpy('did-change');
        return collection.onDidChange(changeSpy);
      });
      describe('::addMany', function() {
        beforeEach(function() {
          return collection.addMany([createVar('foo', '#fff', [0, 10], '/path/to/foo.styl', 1), createVar('bar', '0.5', [12, 20], '/path/to/foo.styl', 2), createVar('baz', 'foo', [22, 30], '/path/to/foo.styl', 3), createVar('bat', 'bar', [32, 40], '/path/to/foo.styl', 4), createVar('bab', 'bat', [42, 50], '/path/to/foo.styl', 5)]);
        });
        it('stores them in the collection', function() {
          return expect(collection.length).toEqual(5);
        });
        it('detects that two of the variables are color variables', function() {
          return expect(collection.getColorVariables().length).toEqual(2);
        });
        it('dispatches a change event', function() {
          var arg;
          expect(changeSpy).toHaveBeenCalled();
          arg = changeSpy.mostRecentCall.args[0];
          expect(arg.created.length).toEqual(5);
          expect(arg.destroyed).toBeUndefined();
          return expect(arg.updated).toBeUndefined();
        });
        it('stores the names of the variables', function() {
          return expect(collection.variableNames.sort()).toEqual(['foo', 'bar', 'baz', 'bat', 'bab'].sort());
        });
        it('builds a dependencies map', function() {
          return expect(collection.dependencyGraph).toEqual({
            foo: ['baz'],
            bar: ['bat'],
            bat: ['bab']
          });
        });
        describe('appending an already existing variable', function() {
          beforeEach(function() {
            return collection.addMany([createVar('foo', '#fff', [0, 10], '/path/to/foo.styl', 1)]);
          });
          it('leaves the collection untouched', function() {
            expect(collection.length).toEqual(5);
            return expect(collection.getColorVariables().length).toEqual(2);
          });
          return it('does not trigger an update event', function() {
            return expect(changeSpy.callCount).toEqual(1);
          });
        });
        return describe('appending an already existing variable with a different value', function() {
          describe('that has a different range', function() {
            beforeEach(function() {
              return collection.addMany([createVar('foo', '#aabbcc', [0, 14], '/path/to/foo.styl', 1)]);
            });
            it('leaves the collection untouched', function() {
              expect(collection.length).toEqual(5);
              return expect(collection.getColorVariables().length).toEqual(2);
            });
            it('updates the existing variable value', function() {
              var variable;
              variable = collection.find({
                name: 'foo',
                path: '/path/to/foo.styl'
              });
              expect(variable.value).toEqual('#aabbcc');
              expect(variable.isColor).toBeTruthy();
              return expect(variable.color).toBeColor('#aabbcc');
            });
            return it('emits a change event', function() {
              var arg;
              expect(changeSpy.callCount).toEqual(2);
              arg = changeSpy.mostRecentCall.args[0];
              expect(arg.created).toBeUndefined();
              expect(arg.destroyed).toBeUndefined();
              return expect(arg.updated.length).toEqual(2);
            });
          });
          describe('that has a different range and a different line', function() {
            beforeEach(function() {
              return collection.addMany([createVar('foo', '#abc', [52, 64], '/path/to/foo.styl', 6)]);
            });
            it('appends the new variables', function() {
              expect(collection.length).toEqual(6);
              return expect(collection.getColorVariables().length).toEqual(3);
            });
            it('stores the two variables', function() {
              var variables;
              variables = collection.findAll({
                name: 'foo',
                path: '/path/to/foo.styl'
              });
              return expect(variables.length).toEqual(2);
            });
            return it('emits a change event', function() {
              var arg;
              expect(changeSpy.callCount).toEqual(2);
              arg = changeSpy.mostRecentCall.args[0];
              expect(arg.created.length).toEqual(1);
              expect(arg.destroyed).toBeUndefined();
              return expect(arg.updated.length).toEqual(1);
            });
          });
          describe('that is still a color', function() {
            beforeEach(function() {
              return collection.addMany([createVar('foo', '#abc', [0, 10], '/path/to/foo.styl', 1)]);
            });
            it('leaves the collection untouched', function() {
              expect(collection.length).toEqual(5);
              return expect(collection.getColorVariables().length).toEqual(2);
            });
            it('updates the existing variable value', function() {
              var variable;
              variable = collection.find({
                name: 'foo',
                path: '/path/to/foo.styl'
              });
              expect(variable.value).toEqual('#abc');
              expect(variable.isColor).toBeTruthy();
              return expect(variable.color).toBeColor('#abc');
            });
            return it('emits a change event', function() {
              var arg;
              expect(changeSpy.callCount).toEqual(2);
              arg = changeSpy.mostRecentCall.args[0];
              expect(arg.created).toBeUndefined();
              expect(arg.destroyed).toBeUndefined();
              return expect(arg.updated.length).toEqual(2);
            });
          });
          describe('that is no longer a color', function() {
            beforeEach(function() {
              return collection.addMany([createVar('foo', '20px', [0, 10], '/path/to/foo.styl', 1)]);
            });
            it('leaves the collection variables untouched', function() {
              return expect(collection.length).toEqual(5);
            });
            it('affects the colors variables within the collection', function() {
              return expect(collection.getColorVariables().length).toEqual(0);
            });
            it('updates the existing variable value', function() {
              var variable;
              variable = collection.find({
                name: 'foo',
                path: '/path/to/foo.styl'
              });
              expect(variable.value).toEqual('20px');
              return expect(variable.isColor).toBeFalsy();
            });
            it('updates the variables depending on the changed variable', function() {
              var variable;
              variable = collection.find({
                name: 'baz',
                path: '/path/to/foo.styl'
              });
              return expect(variable.isColor).toBeFalsy();
            });
            return it('emits a change event', function() {
              var arg;
              arg = changeSpy.mostRecentCall.args[0];
              expect(changeSpy.callCount).toEqual(2);
              expect(arg.created).toBeUndefined();
              expect(arg.destroyed).toBeUndefined();
              return expect(arg.updated.length).toEqual(2);
            });
          });
          describe('that breaks a dependency', function() {
            beforeEach(function() {
              return collection.addMany([createVar('baz', '#abc', [22, 30], '/path/to/foo.styl', 3)]);
            });
            it('leaves the collection untouched', function() {
              expect(collection.length).toEqual(5);
              return expect(collection.getColorVariables().length).toEqual(2);
            });
            it('updates the existing variable value', function() {
              var variable;
              variable = collection.find({
                name: 'baz',
                path: '/path/to/foo.styl'
              });
              expect(variable.value).toEqual('#abc');
              expect(variable.isColor).toBeTruthy();
              return expect(variable.color).toBeColor('#abc');
            });
            return it('updates the dependencies graph', function() {
              return expect(collection.dependencyGraph).toEqual({
                bar: ['bat'],
                bat: ['bab']
              });
            });
          });
          return describe('that adds a dependency', function() {
            beforeEach(function() {
              return collection.addMany([createVar('baz', 'transparentize(foo, bar)', [22, 30], '/path/to/foo.styl', 3)]);
            });
            it('leaves the collection untouched', function() {
              expect(collection.length).toEqual(5);
              return expect(collection.getColorVariables().length).toEqual(2);
            });
            it('updates the existing variable value', function() {
              var variable;
              variable = collection.find({
                name: 'baz',
                path: '/path/to/foo.styl'
              });
              expect(variable.value).toEqual('transparentize(foo, bar)');
              expect(variable.isColor).toBeTruthy();
              return expect(variable.color).toBeColor(255, 255, 255, 0.5);
            });
            return it('updates the dependencies graph', function() {
              return expect(collection.dependencyGraph).toEqual({
                foo: ['baz'],
                bar: ['bat', 'baz'],
                bat: ['bab']
              });
            });
          });
        });
      });
      describe('::removeMany', function() {
        beforeEach(function() {
          return collection.addMany([createVar('foo', '#fff', [0, 10], '/path/to/foo.styl', 1), createVar('bar', '0.5', [12, 20], '/path/to/foo.styl', 2), createVar('baz', 'foo', [22, 30], '/path/to/foo.styl', 3), createVar('bat', 'bar', [32, 40], '/path/to/foo.styl', 4), createVar('bab', 'bat', [42, 50], '/path/to/foo.styl', 5)]);
        });
        describe('with variables that were not colors', function() {
          beforeEach(function() {
            return collection.removeMany([createVar('bat', 'bar', [32, 40], '/path/to/foo.styl', 4), createVar('bab', 'bat', [42, 50], '/path/to/foo.styl', 5)]);
          });
          it('removes the variables from the collection', function() {
            return expect(collection.length).toEqual(3);
          });
          it('dispatches a change event', function() {
            var arg;
            expect(changeSpy).toHaveBeenCalled();
            arg = changeSpy.mostRecentCall.args[0];
            expect(arg.created).toBeUndefined();
            expect(arg.destroyed.length).toEqual(2);
            return expect(arg.updated).toBeUndefined();
          });
          it('stores the names of the variables', function() {
            return expect(collection.variableNames.sort()).toEqual(['foo', 'bar', 'baz'].sort());
          });
          it('updates the variables per path map', function() {
            return expect(collection.variablesByPath['/path/to/foo.styl'].length).toEqual(3);
          });
          return it('updates the dependencies map', function() {
            return expect(collection.dependencyGraph).toEqual({
              foo: ['baz']
            });
          });
        });
        return describe('with variables that were referenced by a color variable', function() {
          beforeEach(function() {
            return collection.removeMany([createVar('foo', '#fff', [0, 10], '/path/to/foo.styl', 1)]);
          });
          it('removes the variables from the collection', function() {
            expect(collection.length).toEqual(4);
            return expect(collection.getColorVariables().length).toEqual(0);
          });
          it('dispatches a change event', function() {
            var arg;
            expect(changeSpy).toHaveBeenCalled();
            arg = changeSpy.mostRecentCall.args[0];
            expect(arg.created).toBeUndefined();
            expect(arg.destroyed.length).toEqual(1);
            return expect(arg.updated.length).toEqual(1);
          });
          it('stores the names of the variables', function() {
            return expect(collection.variableNames.sort()).toEqual(['bar', 'baz', 'bat', 'bab'].sort());
          });
          it('updates the variables per path map', function() {
            return expect(collection.variablesByPath['/path/to/foo.styl'].length).toEqual(4);
          });
          return it('updates the dependencies map', function() {
            return expect(collection.dependencyGraph).toEqual({
              bar: ['bat'],
              bat: ['bab']
            });
          });
        });
      });
      describe('::updatePathCollection', function() {
        beforeEach(function() {
          return collection.addMany([createVar('foo', '#fff', [0, 10], '/path/to/foo.styl', 1), createVar('bar', '0.5', [12, 20], '/path/to/foo.styl', 2), createVar('baz', 'foo', [22, 30], '/path/to/foo.styl', 3), createVar('bat', 'bar', [32, 40], '/path/to/foo.styl', 4), createVar('bab', 'bat', [42, 50], '/path/to/foo.styl', 5)]);
        });
        describe('when a new variable is added', function() {
          beforeEach(function() {
            return collection.updatePathCollection('/path/to/foo.styl', [createVar('foo', '#fff', [0, 10], '/path/to/foo.styl', 1), createVar('bar', '0.5', [12, 20], '/path/to/foo.styl', 2), createVar('baz', 'foo', [22, 30], '/path/to/foo.styl', 3), createVar('bat', 'bar', [32, 40], '/path/to/foo.styl', 4), createVar('bab', 'bat', [42, 50], '/path/to/foo.styl', 5), createVar('baa', '#f00', [52, 60], '/path/to/foo.styl', 6)]);
          });
          return it('detects the addition and leave the rest of the collection unchanged', function() {
            expect(collection.length).toEqual(6);
            expect(collection.getColorVariables().length).toEqual(3);
            expect(changeSpy.mostRecentCall.args[0].created.length).toEqual(1);
            expect(changeSpy.mostRecentCall.args[0].destroyed).toBeUndefined();
            return expect(changeSpy.mostRecentCall.args[0].updated).toBeUndefined();
          });
        });
        describe('when a variable is removed', function() {
          beforeEach(function() {
            return collection.updatePathCollection('/path/to/foo.styl', [createVar('foo', '#fff', [0, 10], '/path/to/foo.styl', 1), createVar('bar', '0.5', [12, 20], '/path/to/foo.styl', 2), createVar('baz', 'foo', [22, 30], '/path/to/foo.styl', 3), createVar('bat', 'bar', [32, 40], '/path/to/foo.styl', 4)]);
          });
          return it('removes the variable that is not present in the new array', function() {
            expect(collection.length).toEqual(4);
            expect(collection.getColorVariables().length).toEqual(2);
            expect(changeSpy.mostRecentCall.args[0].destroyed.length).toEqual(1);
            expect(changeSpy.mostRecentCall.args[0].created).toBeUndefined();
            return expect(changeSpy.mostRecentCall.args[0].updated).toBeUndefined();
          });
        });
        return describe('when a new variable is changed', function() {
          beforeEach(function() {
            return collection.updatePathCollection('/path/to/foo.styl', [createVar('foo', '#fff', [0, 10], '/path/to/foo.styl', 1), createVar('bar', '0.5', [12, 20], '/path/to/foo.styl', 2), createVar('baz', 'foo', [22, 30], '/path/to/foo.styl', 3), createVar('bat', '#abc', [32, 40], '/path/to/foo.styl', 4), createVar('bab', 'bat', [42, 50], '/path/to/foo.styl', 5)]);
          });
          return it('detects the update', function() {
            expect(collection.length).toEqual(5);
            expect(collection.getColorVariables().length).toEqual(4);
            expect(changeSpy.mostRecentCall.args[0].updated.length).toEqual(2);
            expect(changeSpy.mostRecentCall.args[0].destroyed).toBeUndefined();
            return expect(changeSpy.mostRecentCall.args[0].created).toBeUndefined();
          });
        });
      });
      describe('::serialize', function() {
        describe('with an empty collection', function() {
          return it('returns an empty serialized collection', function() {
            return expect(collection.serialize()).toEqual({
              deserializer: 'VariablesCollection',
              content: []
            });
          });
        });
        describe('with a collection that contains a non-color variable', function() {
          beforeEach(function() {
            return collection.add(createVar('bar', '0.5', [12, 20], '/path/to/foo.styl', 2));
          });
          return it('returns the serialized collection', function() {
            return expect(collection.serialize()).toEqual({
              deserializer: 'VariablesCollection',
              content: [
                {
                  name: 'bar',
                  value: '0.5',
                  range: [12, 20],
                  path: '/path/to/foo.styl',
                  line: 2
                }
              ]
            });
          });
        });
        describe('with a collection that contains a color variable', function() {
          beforeEach(function() {
            return collection.add(createVar('bar', '#abc', [12, 20], '/path/to/foo.styl', 2));
          });
          return it('returns the serialized collection', function() {
            return expect(collection.serialize()).toEqual({
              deserializer: 'VariablesCollection',
              content: [
                {
                  name: 'bar',
                  value: '#abc',
                  range: [12, 20],
                  path: '/path/to/foo.styl',
                  line: 2,
                  isColor: true,
                  color: [170, 187, 204, 1],
                  variables: []
                }
              ]
            });
          });
        });
        return describe('with a collection that contains color variables with references', function() {
          beforeEach(function() {
            collection.add(createVar('foo', '#abc', [0, 10], '/path/to/foo.styl', 1));
            return collection.add(createVar('bar', 'foo', [12, 20], '/path/to/foo.styl', 2));
          });
          return it('returns the serialized collection', function() {
            return expect(collection.serialize()).toEqual({
              deserializer: 'VariablesCollection',
              content: [
                {
                  name: 'foo',
                  value: '#abc',
                  range: [0, 10],
                  path: '/path/to/foo.styl',
                  line: 1,
                  isColor: true,
                  color: [170, 187, 204, 1],
                  variables: []
                }, {
                  name: 'bar',
                  value: 'foo',
                  range: [12, 20],
                  path: '/path/to/foo.styl',
                  line: 2,
                  isColor: true,
                  color: [170, 187, 204, 1],
                  variables: ['foo']
                }
              ]
            });
          });
        });
      });
      return describe('.deserialize', function() {
        beforeEach(function() {
          return collection = atom.deserializers.deserialize({
            deserializer: 'VariablesCollection',
            content: [
              {
                name: 'foo',
                value: '#abc',
                range: [0, 10],
                path: '/path/to/foo.styl',
                line: 1,
                isColor: true,
                color: [170, 187, 204, 1],
                variables: []
              }, {
                name: 'bar',
                value: 'foo',
                range: [12, 20],
                path: '/path/to/foo.styl',
                line: 2,
                isColor: true,
                color: [170, 187, 204, 1],
                variables: ['foo']
              }, {
                name: 'baz',
                value: '0.5',
                range: [22, 30],
                path: '/path/to/foo.styl',
                line: 3
              }
            ]
          });
        });
        it('restores the variables', function() {
          expect(collection.length).toEqual(3);
          return expect(collection.getColorVariables().length).toEqual(2);
        });
        return it('restores all the denormalized data in the collection', function() {
          expect(collection.variableNames).toEqual(['foo', 'bar', 'baz']);
          expect(Object.keys(collection.variablesByPath)).toEqual(['/path/to/foo.styl']);
          expect(collection.variablesByPath['/path/to/foo.styl'].length).toEqual(3);
          return expect(collection.dependencyGraph).toEqual({
            foo: ['bar']
          });
        });
      });
    });
  });

}).call(this);
