'use babel';

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
var FileTreeController = require('../lib/FileTreeController');
var fs = require('fs-plus');
var Immutable = require('immutable');
var path = require('path');
var rmdir = require('rimraf');
var temp = require('temp').track();
var timers = require('timers');
var React = require('react-for-atom');
var TestUtils = React.addons.TestUtils;

var rootBasenames = ['dir1', 'dir2'];

function fetchChildrenForNodes(nodes) {
  return Promise.all(nodes.map(function (node) {
    return node.fetchChildren();
  }));
}

/**
 * Wait for render.
 */
function waitForRender() {
  return new Promise(function (resolve, reject) {
    timers.setImmediate(resolve);
  });
}

/**
 * Verifies that the Nuclide file tree works and that it cleans up its own state.
 *
 * Atom's tests fail if we forget to remove a listener on a Directory, so we don't
 * need to explicitly check for that.
 */
describe('FileTreeController', function () {
  var fileTreeController;
  var treeComponent;
  var fixturesPath;
  var rootNodes;

  beforeEach(function () {
    waitsForPromise(_asyncToGenerator(function* () {
      // Set the children of 'fixtures' as the root paths.
      fixturesPath = atom.project.getPaths()[0];
      var rootPaths = rootBasenames.map(function (basename) {
        return path.join(fixturesPath, basename);
      });
      atom.project.setPaths(rootPaths);

      fileTreeController = new FileTreeController();
      yield waitForRender();
      treeComponent = fileTreeController.getTreeComponent();
      rootNodes = treeComponent.getRootNodes();
      yield fetchChildrenForNodes(rootNodes);
    }));
  });

  afterEach(function () {
    temp.cleanup();
    fileTreeController.destroy();
  });

  describe('deleteSelection', function () {
    it('checks if deleteSelection is called when core:backspace is triggered', function () {
      // Find div element
      var el = React.findDOMNode(TestUtils.findRenderedDOMComponentWithClass(fileTreeController._panelController.getChildComponent(), 'nuclide-file-tree'));
      // mock deleteSelection
      spyOn(fileTreeController, 'deleteSelection');
      atom.commands.dispatch(el, 'core:backspace');
      expect(fileTreeController.deleteSelection.calls.length).toBe(1);
    });

    it('checks if deleteSelection is called when core:delete is triggered', function () {
      // Find div element
      var el = React.findDOMNode(TestUtils.findRenderedDOMComponentWithClass(fileTreeController._panelController.getChildComponent(), 'nuclide-file-tree'));
      // mock deleteSelection
      spyOn(fileTreeController, 'deleteSelection');
      atom.commands.dispatch(el, 'core:delete');
      expect(fileTreeController.deleteSelection.calls.length).toBe(1);
    });
  });

  describe('getNodeAndSetState', function () {
    it('reuses an existing node if possible', function () {
      var rootDirectory = atom.project.getDirectories()[0];
      var originalNode = fileTreeController.getNodeAndSetState(rootDirectory);
      var originalNodeState = fileTreeController.getStateForNodeKey(originalNode.getKey());

      var node = fileTreeController.getNodeAndSetState(rootDirectory);
      var nodeState = fileTreeController.getStateForNodeKey(node.getKey());
      expect(node).toBe(originalNode);
      expect(nodeState).toBe(originalNodeState);
    });
  });

  describe('revealActiveFile', function () {
    it('succeeds for a deeply-nested file', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var filePath = path.join(fixturesPath, 'dir1/dir1/dir1/file1');
        yield atom.workspace.open(filePath);

        yield fileTreeController.revealActiveFile();

        var selectedFilePaths = treeComponent.getSelectedNodes().map(function (node) {
          return node.getItem().getPath();
        });
        expect(selectedFilePaths).toEqual([filePath]);
      }));
    });

    it('only expands ancestors for a non-existent file', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var filePath = path.join(fixturesPath, 'dir1/dir1/dir1/unknown');
        yield atom.workspace.open(filePath);

        yield fileTreeController.revealActiveFile();

        var expandedFilePathsSet = new Set(treeComponent.getExpandedNodes().map(function (node) {
          return node.getItem().getPath();
        }));
        expect(expandedFilePathsSet.has(path.join(fixturesPath, 'dir1'))).toBe(true);
        expect(expandedFilePathsSet.has(path.join(fixturesPath, 'dir1/dir1'))).toBe(true);
        expect(expandedFilePathsSet.has(path.join(fixturesPath, 'dir1/dir1/dir1'))).toBe(true);
        var selectedFilePaths = treeComponent.getSelectedNodes().map(function (node) {
          return node.getItem().getPath();
        });
        expect(selectedFilePaths).toEqual([path.join(fixturesPath, 'dir1/dir1/dir1')]);
      }));
    });

    it('does not expand non-existent ancestors', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var filePath = path.join(fixturesPath, 'dir1/dir1/unknown/unknown');
        yield atom.workspace.open(filePath);

        yield fileTreeController.revealActiveFile();

        var expandedFilePathsSet = new Set(treeComponent.getExpandedNodes().map(function (node) {
          return node.getItem().getPath();
        }));
        expect(expandedFilePathsSet.has(path.join(fixturesPath, 'dir1'))).toBe(true);
        expect(expandedFilePathsSet.has(path.join(fixturesPath, 'dir1/dir1'))).toBe(true);
        expect(expandedFilePathsSet.has(path.join(fixturesPath, 'dir1/dir1/unknown'))).toBe(false);
        var selectedFilePaths = treeComponent.getSelectedNodes().map(function (node) {
          return node.getItem().getPath();
        });
        expect(selectedFilePaths).toEqual([path.join(fixturesPath, 'dir1/dir1')]);
      }));
    });
  });

  xdescribe('tests that modify the filesystem', function () {
    var tempPath;
    function getPathsInRoot(paths) {
      return Immutable.List(paths.map(function (currentPath) {
        return path.join(tempPath, currentPath);
      }));
    }

    beforeEach(function () {
      waitsForPromise(_asyncToGenerator(function* () {
        // Copy the contents of 'fixtures' into a temp directory and set the root paths.
        tempPath = fs.absolute(temp.mkdirSync());
        fs.copySync(fixturesPath, tempPath);
        var rootPaths = rootBasenames.map(function (basename) {
          return path.join(tempPath, basename);
        });
        atom.project.setPaths(rootPaths);

        // TODO(jjiaa): Remove the following three lines when we namespace by root directories.
        //
        // The file tree doesn't pick up the new root paths in the temp directory
        // since they have the same basenames as the existing root paths in 'fixtures'.
        fileTreeController.destroy();
        fileTreeController = new FileTreeController();
        yield waitForRender();
        treeComponent = fileTreeController.getTreeComponent();

        rootNodes = treeComponent.getRootNodes();
        yield fetchChildrenForNodes(rootNodes);
      }));
    });

    it('retains cached children when a node\'s siblings change', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var rootNode = rootNodes[0];
        var directoryNode = rootNode.getCachedChildren().get(0);
        var originalChildren = yield directoryNode.fetchChildren();
        var originalNodeKeys = originalChildren.map(function (childNode) {
          return childNode.getKey();
        });
        expect(originalNodeKeys).toEqual(getPathsInRoot(['/dir1/dir1/dir1/', '/dir1/dir1/file1']));

        // Add a new sibling.
        fs.writeFileSync(path.join(rootNode.getItem().getPath(), 'new-file'), '');
        yield rootNode.fetchChildren();

        expect(directoryNode.getCachedChildren()).toEqual(originalChildren);
      }));
    });

    it('updates when files are added', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var rootNode = rootNodes[0];
        var newFilePath = path.join(rootNode.getItem().getPath(), 'new-file');
        fs.writeFileSync(newFilePath, '');

        var children = yield rootNode.fetchChildren();
        var nodeKeys = children.map(function (childNode) {
          return childNode.getKey();
        });
        expect(nodeKeys).toEqual(getPathsInRoot(['/dir1/dir1/', '/dir1/file1', '/dir1/new-file']));
        var addedNode = children.get(2);
        expect(addedNode.getItem().getPath()).toEqual(newFilePath);
        var addedNodeState = fileTreeController.getStateForNodeKey(addedNode.getKey());
        expect(addedNodeState.node).toBe(addedNode);
        // We should only have listeners for changes in directories, not files.
        expect(addedNodeState.subscription).toBeNull();
      }));
    });

    it('updates when directories are added', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var rootNode = rootNodes[0];
        var newDirectoryPath = path.join(rootNode.getItem().getPath(), 'new-directory');
        fs.mkdirSync(newDirectoryPath);

        var children = yield rootNode.fetchChildren();
        var nodeKeys = children.map(function (childNode) {
          return childNode.getKey();
        });
        expect(nodeKeys).toEqual(getPathsInRoot(['/dir1/dir1/', '/dir1/new-directory/', '/dir1/file1']));
        var addedNode = children.get(1);
        expect(addedNode.getItem().getPath()).toEqual(newDirectoryPath);
        var addedNodeState = fileTreeController.getStateForNodeKey(addedNode.getKey());
        expect(addedNodeState.node).toBe(addedNode);
        expect(addedNodeState.subscription).not.toBeNull();
      }));
    });

    it('updates when files are removed', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var rootNode = rootNodes[0];
        var fileNode = rootNode.getCachedChildren().get(1);

        var pathToRemove = fileNode.getItem().getPath();
        fs.removeSync(pathToRemove);

        var children = yield rootNode.fetchChildren();
        var nodeKeys = children.map(function (childNode) {
          return childNode.getKey();
        });
        expect(nodeKeys).toEqual(getPathsInRoot(['/dir1/dir1/']));
        expect(fileTreeController.getStateForNodeKey(fileNode.getKey())).toBeUndefined();
      }));
    });

    it('updates when directories are removed', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var rootNode = rootNodes[0];
        var directoryNode = rootNode.getCachedChildren().get(0);
        var directoryNodeChildren = yield directoryNode.fetchChildren();
        var nestedDirectoryNode = directoryNodeChildren.get(0);

        var pathToRemove = directoryNode.getItem().getPath();
        rmdir.sync(pathToRemove);

        var children = yield rootNode.fetchChildren();
        var nodeKeys = children.map(function (childNode) {
          return childNode.getKey();
        });
        expect(nodeKeys).toEqual(getPathsInRoot(['/dir1/file1']));
        expect(fileTreeController.getStateForNodeKey(directoryNode.getKey())).toBeUndefined();
        expect(fileTreeController.getStateForNodeKey(nestedDirectoryNode.getKey())).toBeUndefined();
      }));
    });

    it('updates when files are moved', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var rootNode = rootNodes[0];
        var fileNode = rootNode.getCachedChildren().get(1);

        var _getPathsInRoot = getPathsInRoot(['/dir1/file1', '/dir1/new-file1']);

        var _getPathsInRoot2 = _slicedToArray(_getPathsInRoot, 2);

        var oldKey = _getPathsInRoot2[0];
        var newKey = _getPathsInRoot2[1];

        expect(fileNode.getKey()).toEqual(oldKey);

        var sourcePath = fileNode.getItem().getPath();
        var targetPath = path.join(rootNode.getItem().getPath(), 'new-file1');
        fs.moveSync(sourcePath, targetPath);

        var children = yield rootNode.fetchChildren();
        var nodeKeys = children.map(function (childNode) {
          return childNode.getKey();
        });
        expect(nodeKeys).toEqual(getPathsInRoot(['/dir1/dir1/', '/dir1/new-file1']));
        expect(fileTreeController.getStateForNodeKey(oldKey)).toBeUndefined();
        expect(fileTreeController.getStateForNodeKey(newKey)).not.toBeUndefined();
      }));
    });

    it('removes treeComponent state when entries are removed', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        // Expand the root.
        var rootNode = rootNodes[0];
        var rootNodeChildren = rootNode.getCachedChildren();
        treeComponent.expandNodeKey(rootNode.getKey());
        // Expand the first directory under the first root.
        var directoryNode = rootNodeChildren.get(0);
        treeComponent.expandNodeKey(directoryNode.getKey());
        var directoryNodeChildren = yield directoryNode.fetchChildren();
        // And expand its first subdirectory.
        var nestedDirectoryNode = directoryNodeChildren.get(0);
        treeComponent.expandNodeKey(nestedDirectoryNode.getKey());
        yield nestedDirectoryNode.fetchChildren();

        rmdir.sync(directoryNode.getItem().getPath());
        yield rootNode.fetchChildren();

        var expandedNodes = treeComponent.getExpandedNodes();
        var expandedNodeKeys = expandedNodes.map(function (node) {
          return node.getKey();
        });
        var rootNodeKeys = rootNodes.map(function (node) {
          return node.getKey();
        });
        expect(expandedNodeKeys).toEqual(rootNodeKeys);
        var selectedNodes = treeComponent.getSelectedNodes();
        var selectedNodeKeys = selectedNodes.map(function (node) {
          return node.getKey();
        });
        expect(selectedNodeKeys).toEqual([rootNodeKeys[0]]);
      }));
    });
  });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtdHJlZS9zcGVjL0ZpbGVUcmVlQ29udHJvbGxlci1zcGVjLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7O0FBVVosSUFBSSxrQkFBa0IsR0FBRyxPQUFPLENBQUMsMkJBQTJCLENBQUMsQ0FBQztBQUM5RCxJQUFJLEVBQUUsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDNUIsSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQ3JDLElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMzQixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDOUIsSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ25DLElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUMvQixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUNqQyxTQUFTLEdBQUksS0FBSyxDQUFDLE1BQU0sQ0FBekIsU0FBUzs7QUFFZCxJQUFJLGFBQWEsR0FBRyxDQUNsQixNQUFNLEVBQ04sTUFBTSxDQUNQLENBQUM7O0FBRUYsU0FBUyxxQkFBcUIsQ0FBQyxLQUE4QixFQUFXO0FBQ3RFLFNBQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQUMsSUFBSTtXQUFLLElBQUksQ0FBQyxhQUFhLEVBQUU7R0FBQSxDQUFDLENBQUMsQ0FBQztDQUMvRDs7Ozs7QUFLRCxTQUFTLGFBQWEsR0FBWTtBQUNoQyxTQUFPLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBSztBQUN0QyxVQUFNLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FB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RUFBRSxDQUFDLENBQUM7QUFDOUMsY0FBTSxRQUFRLENBQUMsYUFBYSxFQUFFLENBQUM7O0FBRS9CLFlBQUksYUFBYSxHQUFHLGFBQWEsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0FBQ3JELFlBQUksZ0JBQWdCLEdBQUcsYUFBYSxDQUFDLEdBQUcsQ0FBQyxVQUFDLElBQUk7aUJBQUssSUFBSSxDQUFDLE1BQU0sRUFBRTtTQUFBLENBQUMsQ0FBQztBQUNsRSxZQUFJLFlBQVksR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQUMsSUFBSTtpQkFBSyxJQUFJLENBQUMsTUFBTSxFQUFFO1NBQUEsQ0FBQyxDQUFDO0FBQzFELGNBQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUMvQyxZQUFJLGFBQWEsR0FBRyxhQUFhLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztBQUNyRCxZQUFJLGdCQUFnQixHQUFHLGFBQWEsQ0FBQyxHQUFHLENBQUMsVUFBQyxJQUFJO2lCQUFLLElBQUksQ0FBQyxNQUFNLEVBQUU7U0FBQSxDQUFDLENBQUM7QUFDbEUsY0FBTSxDQUFDLGdCQUFnQixDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztPQUNyRCxFQUFDLENBQUM7S0FDSixDQUFDLENBQUM7R0FDSixDQUFDLENBQUM7Q0FDSixDQUFDLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL251Y2xpZGUtZmlsZS10cmVlL3NwZWMvRmlsZVRyZWVDb250cm9sbGVyLXNwZWMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xudmFyIEZpbGVUcmVlQ29udHJvbGxlciA9IHJlcXVpcmUoJy4uL2xpYi9GaWxlVHJlZUNvbnRyb2xsZXInKTtcbnZhciBmcyA9IHJlcXVpcmUoJ2ZzLXBsdXMnKTtcbnZhciBJbW11dGFibGUgPSByZXF1aXJlKCdpbW11dGFibGUnKTtcbnZhciBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xudmFyIHJtZGlyID0gcmVxdWlyZSgncmltcmFmJyk7XG52YXIgdGVtcCA9IHJlcXVpcmUoJ3RlbXAnKS50cmFjaygpO1xudmFyIHRpbWVycyA9IHJlcXVpcmUoJ3RpbWVycycpO1xudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QtZm9yLWF0b20nKTtcbnZhciB7VGVzdFV0aWxzfSA9IFJlYWN0LmFkZG9ucztcblxudmFyIHJvb3RCYXNlbmFtZXMgPSBbXG4gICdkaXIxJyxcbiAgJ2RpcjInLFxuXTtcblxuZnVuY3Rpb24gZmV0Y2hDaGlsZHJlbkZvck5vZGVzKG5vZGVzOiBBcnJheTxMYXp5RmlsZVRyZWVOb2RlPik6IFByb21pc2Uge1xuICByZXR1cm4gUHJvbWlzZS5hbGwobm9kZXMubWFwKChub2RlKSA9PiBub2RlLmZldGNoQ2hpbGRyZW4oKSkpO1xufVxuXG4vKipcbiAqIFdhaXQgZm9yIHJlbmRlci5cbiAqL1xuZnVuY3Rpb24gd2FpdEZvclJlbmRlcigpOiBQcm9taXNlIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICB0aW1lcnMuc2V0SW1tZWRpYXRlKHJlc29sdmUpO1xuICB9KTtcbn1cblxuLyoqXG4gKiBWZXJpZmllcyB0aGF0IHRoZSBOdWNsaWRlIGZpbGUgdHJlZSB3b3JrcyBhbmQgdGhhdCBpdCBjbGVhbnMgdXAgaXRzIG93biBzdGF0ZS5cbiAqXG4gKiBBdG9tJ3MgdGVzdHMgZmFpbCBpZiB3ZSBmb3JnZXQgdG8gcmVtb3ZlIGEgbGlzdGVuZXIgb24gYSBEaXJlY3RvcnksIHNvIHdlIGRvbid0XG4gKiBuZWVkIHRvIGV4cGxpY2l0bHkgY2hlY2sgZm9yIHRoYXQuXG4gKi9cbmRlc2NyaWJlKCdGaWxlVHJlZUNvbnRyb2xsZXInLCAoKSA9PiB7XG4gIHZhciBmaWxlVHJlZUNvbnRyb2xsZXI7XG4gIHZhciB0cmVlQ29tcG9uZW50O1xuICB2YXIgZml4dHVyZXNQYXRoO1xuICB2YXIgcm9vdE5vZGVzO1xuXG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIHdhaXRzRm9yUHJvbWlzZShhc3luYyAoKSA9PiB7XG4gICAgICAvLyBTZXQgdGhlIGNoaWxkcmVuIG9mICdmaXh0dXJlcycgYXMgdGhlIHJvb3QgcGF0aHMuXG4gICAgICBmaXh0dXJlc1BhdGggPSBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKVswXTtcbiAgICAgIHZhciByb290UGF0aHMgPSByb290QmFzZW5hbWVzLm1hcCgoYmFzZW5hbWUpID0+IHBhdGguam9pbihmaXh0dXJlc1BhdGgsIGJhc2VuYW1lKSk7XG4gICAgICBhdG9tLnByb2plY3Quc2V0UGF0aHMocm9vdFBhdGhzKTtcblxuICAgICAgZmlsZVRyZWVDb250cm9sbGVyID0gbmV3IEZpbGVUcmVlQ29udHJvbGxlcigpO1xuICAgICAgYXdhaXQgd2FpdEZvclJlbmRlcigpO1xuICAgICAgdHJlZUNvbXBvbmVudCA9IGZpbGVUcmVlQ29udHJvbGxlci5nZXRUcmVlQ29tcG9uZW50KCk7XG4gICAgICByb290Tm9kZXMgPSB0cmVlQ29tcG9uZW50LmdldFJvb3ROb2RlcygpO1xuICAgICAgYXdhaXQgZmV0Y2hDaGlsZHJlbkZvck5vZGVzKHJvb3ROb2Rlcyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGFmdGVyRWFjaCgoKSA9PiB7XG4gICAgdGVtcC5jbGVhbnVwKCk7XG4gICAgZmlsZVRyZWVDb250cm9sbGVyLmRlc3Ryb3koKTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2RlbGV0ZVNlbGVjdGlvbicsICgpID0+IHtcbiAgICBpdCgnY2hlY2tzIGlmIGRlbGV0ZVNlbGVjdGlvbiBpcyBjYWxsZWQgd2hlbiBjb3JlOmJhY2tzcGFjZSBpcyB0cmlnZ2VyZWQnLCAoKSA9PiB7XG4gICAgICAvLyBGaW5kIGRpdiBlbGVtZW50XG4gICAgICB2YXIgZWwgPSBSZWFjdC5maW5kRE9NTm9kZShUZXN0VXRpbHMuZmluZFJlbmRlcmVkRE9NQ29tcG9uZW50V2l0aENsYXNzKFxuICAgICAgICBmaWxlVHJlZUNvbnRyb2xsZXIuX3BhbmVsQ29udHJvbGxlci5nZXRDaGlsZENvbXBvbmVudCgpLFxuICAgICAgICAnbnVjbGlkZS1maWxlLXRyZWUnXG4gICAgICApKTtcbiAgICAgIC8vIG1vY2sgZGVsZXRlU2VsZWN0aW9uXG4gICAgICBzcHlPbihmaWxlVHJlZUNvbnRyb2xsZXIsICdkZWxldGVTZWxlY3Rpb24nKTtcbiAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goZWwsICdjb3JlOmJhY2tzcGFjZScpO1xuICAgICAgZXhwZWN0KGZpbGVUcmVlQ29udHJvbGxlci5kZWxldGVTZWxlY3Rpb24uY2FsbHMubGVuZ3RoKS50b0JlKDEpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2NoZWNrcyBpZiBkZWxldGVTZWxlY3Rpb24gaXMgY2FsbGVkIHdoZW4gY29yZTpkZWxldGUgaXMgdHJpZ2dlcmVkJywgKCkgPT4ge1xuICAgICAgLy8gRmluZCBkaXYgZWxlbWVudFxuICAgICAgdmFyIGVsID0gUmVhY3QuZmluZERPTU5vZGUoVGVzdFV0aWxzLmZpbmRSZW5kZXJlZERPTUNvbXBvbmVudFdpdGhDbGFzcyhcbiAgICAgICAgZmlsZVRyZWVDb250cm9sbGVyLl9wYW5lbENvbnRyb2xsZXIuZ2V0Q2hpbGRDb21wb25lbnQoKSxcbiAgICAgICAgJ251Y2xpZGUtZmlsZS10cmVlJ1xuICAgICAgKSk7XG4gICAgICAvLyBtb2NrIGRlbGV0ZVNlbGVjdGlvblxuICAgICAgc3B5T24oZmlsZVRyZWVDb250cm9sbGVyLCAnZGVsZXRlU2VsZWN0aW9uJyk7XG4gICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGVsLCAnY29yZTpkZWxldGUnKTtcbiAgICAgIGV4cGVjdChmaWxlVHJlZUNvbnRyb2xsZXIuZGVsZXRlU2VsZWN0aW9uLmNhbGxzLmxlbmd0aCkudG9CZSgxKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2dldE5vZGVBbmRTZXRTdGF0ZScsICgpID0+IHtcbiAgICBpdCgncmV1c2VzIGFuIGV4aXN0aW5nIG5vZGUgaWYgcG9zc2libGUnLCAoKSA9PiB7XG4gICAgICB2YXIgcm9vdERpcmVjdG9yeSA9IGF0b20ucHJvamVjdC5nZXREaXJlY3RvcmllcygpWzBdO1xuICAgICAgdmFyIG9yaWdpbmFsTm9kZSA9IGZpbGVUcmVlQ29udHJvbGxlci5nZXROb2RlQW5kU2V0U3RhdGUocm9vdERpcmVjdG9yeSk7XG4gICAgICB2YXIgb3JpZ2luYWxOb2RlU3RhdGUgPSBmaWxlVHJlZUNvbnRyb2xsZXIuZ2V0U3RhdGVGb3JOb2RlS2V5KG9yaWdpbmFsTm9kZS5nZXRLZXkoKSk7XG5cbiAgICAgIHZhciBub2RlID0gZmlsZVRyZWVDb250cm9sbGVyLmdldE5vZGVBbmRTZXRTdGF0ZShyb290RGlyZWN0b3J5KTtcbiAgICAgIHZhciBub2RlU3RhdGUgPSBmaWxlVHJlZUNvbnRyb2xsZXIuZ2V0U3RhdGVGb3JOb2RlS2V5KG5vZGUuZ2V0S2V5KCkpO1xuICAgICAgZXhwZWN0KG5vZGUpLnRvQmUob3JpZ2luYWxOb2RlKTtcbiAgICAgIGV4cGVjdChub2RlU3RhdGUpLnRvQmUob3JpZ2luYWxOb2RlU3RhdGUpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgncmV2ZWFsQWN0aXZlRmlsZScsICgpID0+IHtcbiAgICBpdCgnc3VjY2VlZHMgZm9yIGEgZGVlcGx5LW5lc3RlZCBmaWxlJywgKCkgPT4ge1xuICAgICAgd2FpdHNGb3JQcm9taXNlKGFzeW5jICgpID0+IHtcbiAgICAgICAgdmFyIGZpbGVQYXRoID0gcGF0aC5qb2luKGZpeHR1cmVzUGF0aCwgJ2RpcjEvZGlyMS9kaXIxL2ZpbGUxJyk7XG4gICAgICAgIGF3YWl0IGF0b20ud29ya3NwYWNlLm9wZW4oZmlsZVBhdGgpO1xuXG4gICAgICAgIGF3YWl0IGZpbGVUcmVlQ29udHJvbGxlci5yZXZlYWxBY3RpdmVGaWxlKCk7XG5cbiAgICAgICAgdmFyIHNlbGVjdGVkRmlsZVBhdGhzID0gdHJlZUNvbXBvbmVudC5nZXRTZWxlY3RlZE5vZGVzKClcbiAgICAgICAgICAgIC5tYXAobm9kZSA9PiBub2RlLmdldEl0ZW0oKS5nZXRQYXRoKCkpO1xuICAgICAgICBleHBlY3Qoc2VsZWN0ZWRGaWxlUGF0aHMpLnRvRXF1YWwoW2ZpbGVQYXRoXSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdvbmx5IGV4cGFuZHMgYW5jZXN0b3JzIGZvciBhIG5vbi1leGlzdGVudCBmaWxlJywgKCkgPT4ge1xuICAgICAgd2FpdHNGb3JQcm9taXNlKGFzeW5jICgpID0+IHtcbiAgICAgICAgdmFyIGZpbGVQYXRoID0gcGF0aC5qb2luKGZpeHR1cmVzUGF0aCwgJ2RpcjEvZGlyMS9kaXIxL3Vua25vd24nKTtcbiAgICAgICAgYXdhaXQgYXRvbS53b3Jrc3BhY2Uub3BlbihmaWxlUGF0aCk7XG5cbiAgICAgICAgYXdhaXQgZmlsZVRyZWVDb250cm9sbGVyLnJldmVhbEFjdGl2ZUZpbGUoKTtcblxuICAgICAgICB2YXIgZXhwYW5kZWRGaWxlUGF0aHNTZXQgPSBuZXcgU2V0KHRyZWVDb21wb25lbnQuZ2V0RXhwYW5kZWROb2RlcygpXG4gICAgICAgICAgICAubWFwKG5vZGUgPT4gbm9kZS5nZXRJdGVtKCkuZ2V0UGF0aCgpKSk7XG4gICAgICAgIGV4cGVjdChleHBhbmRlZEZpbGVQYXRoc1NldC5oYXMocGF0aC5qb2luKGZpeHR1cmVzUGF0aCwgJ2RpcjEnKSkpLnRvQmUodHJ1ZSk7XG4gICAgICAgIGV4cGVjdChleHBhbmRlZEZpbGVQYXRoc1NldC5oYXMocGF0aC5qb2luKGZpeHR1cmVzUGF0aCwgJ2RpcjEvZGlyMScpKSkudG9CZSh0cnVlKTtcbiAgICAgICAgZXhwZWN0KGV4cGFuZGVkRmlsZVBhdGhzU2V0LmhhcyhwYXRoLmpvaW4oZml4dHVyZXNQYXRoLCAnZGlyMS9kaXIxL2RpcjEnKSkpLnRvQmUodHJ1ZSk7XG4gICAgICAgIHZhciBzZWxlY3RlZEZpbGVQYXRocyA9IHRyZWVDb21wb25lbnQuZ2V0U2VsZWN0ZWROb2RlcygpXG4gICAgICAgICAgICAubWFwKG5vZGUgPT4gbm9kZS5nZXRJdGVtKCkuZ2V0UGF0aCgpKTtcbiAgICAgICAgZXhwZWN0KHNlbGVjdGVkRmlsZVBhdGhzKS50b0VxdWFsKFtwYXRoLmpvaW4oZml4dHVyZXNQYXRoLCAnZGlyMS9kaXIxL2RpcjEnKV0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnZG9lcyBub3QgZXhwYW5kIG5vbi1leGlzdGVudCBhbmNlc3RvcnMnLCAoKSA9PiB7XG4gICAgICB3YWl0c0ZvclByb21pc2UoYXN5bmMgKCkgPT4ge1xuICAgICAgICB2YXIgZmlsZVBhdGggPSBwYXRoLmpvaW4oZml4dHVyZXNQYXRoLCAnZGlyMS9kaXIxL3Vua25vd24vdW5rbm93bicpO1xuICAgICAgICBhd2FpdCBhdG9tLndvcmtzcGFjZS5vcGVuKGZpbGVQYXRoKTtcblxuICAgICAgICBhd2FpdCBmaWxlVHJlZUNvbnRyb2xsZXIucmV2ZWFsQWN0aXZlRmlsZSgpO1xuXG4gICAgICAgIHZhciBleHBhbmRlZEZpbGVQYXRoc1NldCA9IG5ldyBTZXQodHJlZUNvbXBvbmVudC5nZXRFeHBhbmRlZE5vZGVzKClcbiAgICAgICAgICAgIC5tYXAobm9kZSA9PiBub2RlLmdldEl0ZW0oKS5nZXRQYXRoKCkpKTtcbiAgICAgICAgZXhwZWN0KGV4cGFuZGVkRmlsZVBhdGhzU2V0LmhhcyhwYXRoLmpvaW4oZml4dHVyZXNQYXRoLCAnZGlyMScpKSkudG9CZSh0cnVlKTtcbiAgICAgICAgZXhwZWN0KGV4cGFuZGVkRmlsZVBhdGhzU2V0LmhhcyhwYXRoLmpvaW4oZml4dHVyZXNQYXRoLCAnZGlyMS9kaXIxJykpKS50b0JlKHRydWUpO1xuICAgICAgICBleHBlY3QoZXhwYW5kZWRGaWxlUGF0aHNTZXQuaGFzKHBhdGguam9pbihmaXh0dXJlc1BhdGgsICdkaXIxL2RpcjEvdW5rbm93bicpKSkudG9CZShmYWxzZSk7XG4gICAgICAgIHZhciBzZWxlY3RlZEZpbGVQYXRocyA9IHRyZWVDb21wb25lbnQuZ2V0U2VsZWN0ZWROb2RlcygpXG4gICAgICAgICAgICAubWFwKG5vZGUgPT4gbm9kZS5nZXRJdGVtKCkuZ2V0UGF0aCgpKTtcbiAgICAgICAgZXhwZWN0KHNlbGVjdGVkRmlsZVBhdGhzKS50b0VxdWFsKFtwYXRoLmpvaW4oZml4dHVyZXNQYXRoLCAnZGlyMS9kaXIxJyldKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICB4ZGVzY3JpYmUoJ3Rlc3RzIHRoYXQgbW9kaWZ5IHRoZSBmaWxlc3lzdGVtJywgKCkgPT4ge1xuICAgIHZhciB0ZW1wUGF0aDtcbiAgICBmdW5jdGlvbiBnZXRQYXRoc0luUm9vdChwYXRoczogQXJyYXk8c3RyaW5nPik6IEltbXV0YWJsZS5MaXN0PHN0cmluZz4ge1xuICAgICAgcmV0dXJuIEltbXV0YWJsZS5MaXN0KHBhdGhzLm1hcChjdXJyZW50UGF0aCA9PiBwYXRoLmpvaW4odGVtcFBhdGgsIGN1cnJlbnRQYXRoKSkpO1xuICAgIH1cblxuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgd2FpdHNGb3JQcm9taXNlKGFzeW5jICgpID0+IHtcbiAgICAgICAgLy8gQ29weSB0aGUgY29udGVudHMgb2YgJ2ZpeHR1cmVzJyBpbnRvIGEgdGVtcCBkaXJlY3RvcnkgYW5kIHNldCB0aGUgcm9vdCBwYXRocy5cbiAgICAgICAgdGVtcFBhdGggPSBmcy5hYnNvbHV0ZSh0ZW1wLm1rZGlyU3luYygpKTtcbiAgICAgICAgZnMuY29weVN5bmMoZml4dHVyZXNQYXRoLCB0ZW1wUGF0aCk7XG4gICAgICAgIHZhciByb290UGF0aHMgPSByb290QmFzZW5hbWVzLm1hcCgoYmFzZW5hbWUpID0+IHBhdGguam9pbih0ZW1wUGF0aCwgYmFzZW5hbWUpKTtcbiAgICAgICAgYXRvbS5wcm9qZWN0LnNldFBhdGhzKHJvb3RQYXRocyk7XG5cbiAgICAgICAgLy8gVE9ETyhqamlhYSk6IFJlbW92ZSB0aGUgZm9sbG93aW5nIHRocmVlIGxpbmVzIHdoZW4gd2UgbmFtZXNwYWNlIGJ5IHJvb3QgZGlyZWN0b3JpZXMuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIFRoZSBmaWxlIHRyZWUgZG9lc24ndCBwaWNrIHVwIHRoZSBuZXcgcm9vdCBwYXRocyBpbiB0aGUgdGVtcCBkaXJlY3RvcnlcbiAgICAgICAgLy8gc2luY2UgdGhleSBoYXZlIHRoZSBzYW1lIGJhc2VuYW1lcyBhcyB0aGUgZXhpc3Rpbmcgcm9vdCBwYXRocyBpbiAnZml4dHVyZXMnLlxuICAgICAgICBmaWxlVHJlZUNvbnRyb2xsZXIuZGVzdHJveSgpO1xuICAgICAgICBmaWxlVHJlZUNvbnRyb2xsZXIgPSBuZXcgRmlsZVRyZWVDb250cm9sbGVyKCk7XG4gICAgICAgIGF3YWl0IHdhaXRGb3JSZW5kZXIoKTtcbiAgICAgICAgdHJlZUNvbXBvbmVudCA9IGZpbGVUcmVlQ29udHJvbGxlci5nZXRUcmVlQ29tcG9uZW50KCk7XG5cbiAgICAgICAgcm9vdE5vZGVzID0gdHJlZUNvbXBvbmVudC5nZXRSb290Tm9kZXMoKTtcbiAgICAgICAgYXdhaXQgZmV0Y2hDaGlsZHJlbkZvck5vZGVzKHJvb3ROb2Rlcyk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdyZXRhaW5zIGNhY2hlZCBjaGlsZHJlbiB3aGVuIGEgbm9kZVxcJ3Mgc2libGluZ3MgY2hhbmdlJywgKCkgPT4ge1xuICAgICAgd2FpdHNGb3JQcm9taXNlKGFzeW5jICgpID0+IHtcbiAgICAgICAgdmFyIHJvb3ROb2RlID0gcm9vdE5vZGVzWzBdO1xuICAgICAgICB2YXIgZGlyZWN0b3J5Tm9kZSA9IHJvb3ROb2RlLmdldENhY2hlZENoaWxkcmVuKCkuZ2V0KDApO1xuICAgICAgICB2YXIgb3JpZ2luYWxDaGlsZHJlbiA9IGF3YWl0IGRpcmVjdG9yeU5vZGUuZmV0Y2hDaGlsZHJlbigpO1xuICAgICAgICB2YXIgb3JpZ2luYWxOb2RlS2V5cyA9IG9yaWdpbmFsQ2hpbGRyZW4ubWFwKChjaGlsZE5vZGUpID0+IGNoaWxkTm9kZS5nZXRLZXkoKSk7XG4gICAgICAgIGV4cGVjdChvcmlnaW5hbE5vZGVLZXlzKS50b0VxdWFsKGdldFBhdGhzSW5Sb290KFsnL2RpcjEvZGlyMS9kaXIxLycsICcvZGlyMS9kaXIxL2ZpbGUxJ10pKTtcblxuICAgICAgICAvLyBBZGQgYSBuZXcgc2libGluZy5cbiAgICAgICAgZnMud3JpdGVGaWxlU3luYyhwYXRoLmpvaW4ocm9vdE5vZGUuZ2V0SXRlbSgpLmdldFBhdGgoKSwgJ25ldy1maWxlJyksICcnKTtcbiAgICAgICAgYXdhaXQgcm9vdE5vZGUuZmV0Y2hDaGlsZHJlbigpO1xuXG4gICAgICAgIGV4cGVjdChkaXJlY3RvcnlOb2RlLmdldENhY2hlZENoaWxkcmVuKCkpLnRvRXF1YWwob3JpZ2luYWxDaGlsZHJlbik7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCd1cGRhdGVzIHdoZW4gZmlsZXMgYXJlIGFkZGVkJywgKCkgPT4ge1xuICAgICAgd2FpdHNGb3JQcm9taXNlKGFzeW5jICgpID0+IHtcbiAgICAgICAgdmFyIHJvb3ROb2RlID0gcm9vdE5vZGVzWzBdO1xuICAgICAgICB2YXIgbmV3RmlsZVBhdGggPSBwYXRoLmpvaW4ocm9vdE5vZGUuZ2V0SXRlbSgpLmdldFBhdGgoKSwgJ25ldy1maWxlJyk7XG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMobmV3RmlsZVBhdGgsICcnKTtcblxuICAgICAgICB2YXIgY2hpbGRyZW4gPSBhd2FpdCByb290Tm9kZS5mZXRjaENoaWxkcmVuKCk7XG4gICAgICAgIHZhciBub2RlS2V5cyA9IGNoaWxkcmVuLm1hcCgoY2hpbGROb2RlKSA9PiBjaGlsZE5vZGUuZ2V0S2V5KCkpO1xuICAgICAgICBleHBlY3Qobm9kZUtleXMpLnRvRXF1YWwoZ2V0UGF0aHNJblJvb3QoWycvZGlyMS9kaXIxLycsICcvZGlyMS9maWxlMScsICcvZGlyMS9uZXctZmlsZSddKSk7XG4gICAgICAgIHZhciBhZGRlZE5vZGUgPSBjaGlsZHJlbi5nZXQoMik7XG4gICAgICAgIGV4cGVjdChhZGRlZE5vZGUuZ2V0SXRlbSgpLmdldFBhdGgoKSkudG9FcXVhbChuZXdGaWxlUGF0aCk7XG4gICAgICAgIHZhciBhZGRlZE5vZGVTdGF0ZSA9IGZpbGVUcmVlQ29udHJvbGxlci5nZXRTdGF0ZUZvck5vZGVLZXkoYWRkZWROb2RlLmdldEtleSgpKTtcbiAgICAgICAgZXhwZWN0KGFkZGVkTm9kZVN0YXRlLm5vZGUpLnRvQmUoYWRkZWROb2RlKTtcbiAgICAgICAgLy8gV2Ugc2hvdWxkIG9ubHkgaGF2ZSBsaXN0ZW5lcnMgZm9yIGNoYW5nZXMgaW4gZGlyZWN0b3JpZXMsIG5vdCBmaWxlcy5cbiAgICAgICAgZXhwZWN0KGFkZGVkTm9kZVN0YXRlLnN1YnNjcmlwdGlvbikudG9CZU51bGwoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3VwZGF0ZXMgd2hlbiBkaXJlY3RvcmllcyBhcmUgYWRkZWQnLCAoKSA9PiB7XG4gICAgICB3YWl0c0ZvclByb21pc2UoYXN5bmMgKCkgPT4ge1xuICAgICAgICB2YXIgcm9vdE5vZGUgPSByb290Tm9kZXNbMF07XG4gICAgICAgIHZhciBuZXdEaXJlY3RvcnlQYXRoID0gcGF0aC5qb2luKHJvb3ROb2RlLmdldEl0ZW0oKS5nZXRQYXRoKCksICduZXctZGlyZWN0b3J5Jyk7XG4gICAgICAgIGZzLm1rZGlyU3luYyhuZXdEaXJlY3RvcnlQYXRoKTtcblxuICAgICAgICB2YXIgY2hpbGRyZW4gPSBhd2FpdCByb290Tm9kZS5mZXRjaENoaWxkcmVuKCk7XG4gICAgICAgIHZhciBub2RlS2V5cyA9IGNoaWxkcmVuLm1hcCgoY2hpbGROb2RlKSA9PiBjaGlsZE5vZGUuZ2V0S2V5KCkpO1xuICAgICAgICBleHBlY3Qobm9kZUtleXMpLnRvRXF1YWwoZ2V0UGF0aHNJblJvb3QoWycvZGlyMS9kaXIxLycsICcvZGlyMS9uZXctZGlyZWN0b3J5LycsICcvZGlyMS9maWxlMSddKSk7XG4gICAgICAgIHZhciBhZGRlZE5vZGUgPSBjaGlsZHJlbi5nZXQoMSk7XG4gICAgICAgIGV4cGVjdChhZGRlZE5vZGUuZ2V0SXRlbSgpLmdldFBhdGgoKSkudG9FcXVhbChuZXdEaXJlY3RvcnlQYXRoKTtcbiAgICAgICAgdmFyIGFkZGVkTm9kZVN0YXRlID0gZmlsZVRyZWVDb250cm9sbGVyLmdldFN0YXRlRm9yTm9kZUtleShhZGRlZE5vZGUuZ2V0S2V5KCkpO1xuICAgICAgICBleHBlY3QoYWRkZWROb2RlU3RhdGUubm9kZSkudG9CZShhZGRlZE5vZGUpO1xuICAgICAgICBleHBlY3QoYWRkZWROb2RlU3RhdGUuc3Vic2NyaXB0aW9uKS5ub3QudG9CZU51bGwoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3VwZGF0ZXMgd2hlbiBmaWxlcyBhcmUgcmVtb3ZlZCcsICgpID0+IHtcbiAgICAgIHdhaXRzRm9yUHJvbWlzZShhc3luYyAoKSA9PiB7XG4gICAgICAgIHZhciByb290Tm9kZSA9IHJvb3ROb2Rlc1swXTtcbiAgICAgICAgdmFyIGZpbGVOb2RlID0gcm9vdE5vZGUuZ2V0Q2FjaGVkQ2hpbGRyZW4oKS5nZXQoMSk7XG5cbiAgICAgICAgdmFyIHBhdGhUb1JlbW92ZSA9IGZpbGVOb2RlLmdldEl0ZW0oKS5nZXRQYXRoKCk7XG4gICAgICAgIGZzLnJlbW92ZVN5bmMocGF0aFRvUmVtb3ZlKTtcblxuICAgICAgICB2YXIgY2hpbGRyZW4gPSBhd2FpdCByb290Tm9kZS5mZXRjaENoaWxkcmVuKCk7XG4gICAgICAgIHZhciBub2RlS2V5cyA9IGNoaWxkcmVuLm1hcCgoY2hpbGROb2RlKSA9PiBjaGlsZE5vZGUuZ2V0S2V5KCkpO1xuICAgICAgICBleHBlY3Qobm9kZUtleXMpLnRvRXF1YWwoZ2V0UGF0aHNJblJvb3QoWycvZGlyMS9kaXIxLyddKSk7XG4gICAgICAgIGV4cGVjdChmaWxlVHJlZUNvbnRyb2xsZXIuZ2V0U3RhdGVGb3JOb2RlS2V5KGZpbGVOb2RlLmdldEtleSgpKSkudG9CZVVuZGVmaW5lZCgpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgndXBkYXRlcyB3aGVuIGRpcmVjdG9yaWVzIGFyZSByZW1vdmVkJywgKCkgPT4ge1xuICAgICAgd2FpdHNGb3JQcm9taXNlKGFzeW5jICgpID0+IHtcbiAgICAgICAgdmFyIHJvb3ROb2RlID0gcm9vdE5vZGVzWzBdO1xuICAgICAgICB2YXIgZGlyZWN0b3J5Tm9kZSA9IHJvb3ROb2RlLmdldENhY2hlZENoaWxkcmVuKCkuZ2V0KDApO1xuICAgICAgICB2YXIgZGlyZWN0b3J5Tm9kZUNoaWxkcmVuID0gYXdhaXQgZGlyZWN0b3J5Tm9kZS5mZXRjaENoaWxkcmVuKCk7XG4gICAgICAgIHZhciBuZXN0ZWREaXJlY3RvcnlOb2RlID0gZGlyZWN0b3J5Tm9kZUNoaWxkcmVuLmdldCgwKTtcblxuICAgICAgICB2YXIgcGF0aFRvUmVtb3ZlID0gZGlyZWN0b3J5Tm9kZS5nZXRJdGVtKCkuZ2V0UGF0aCgpO1xuICAgICAgICBybWRpci5zeW5jKHBhdGhUb1JlbW92ZSk7XG5cbiAgICAgICAgdmFyIGNoaWxkcmVuID0gYXdhaXQgcm9vdE5vZGUuZmV0Y2hDaGlsZHJlbigpO1xuICAgICAgICB2YXIgbm9kZUtleXMgPSBjaGlsZHJlbi5tYXAoKGNoaWxkTm9kZSkgPT4gY2hpbGROb2RlLmdldEtleSgpKTtcbiAgICAgICAgZXhwZWN0KG5vZGVLZXlzKS50b0VxdWFsKGdldFBhdGhzSW5Sb290KFsnL2RpcjEvZmlsZTEnXSkpO1xuICAgICAgICBleHBlY3QoZmlsZVRyZWVDb250cm9sbGVyLmdldFN0YXRlRm9yTm9kZUtleShkaXJlY3RvcnlOb2RlLmdldEtleSgpKSkudG9CZVVuZGVmaW5lZCgpO1xuICAgICAgICBleHBlY3QoZmlsZVRyZWVDb250cm9sbGVyLmdldFN0YXRlRm9yTm9kZUtleShuZXN0ZWREaXJlY3RvcnlOb2RlLmdldEtleSgpKSkudG9CZVVuZGVmaW5lZCgpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgndXBkYXRlcyB3aGVuIGZpbGVzIGFyZSBtb3ZlZCcsICgpID0+IHtcbiAgICAgIHdhaXRzRm9yUHJvbWlzZShhc3luYyAoKSA9PiB7XG4gICAgICAgIHZhciByb290Tm9kZSA9IHJvb3ROb2Rlc1swXTtcbiAgICAgICAgdmFyIGZpbGVOb2RlID0gcm9vdE5vZGUuZ2V0Q2FjaGVkQ2hpbGRyZW4oKS5nZXQoMSk7XG5cbiAgICAgICAgdmFyIFtvbGRLZXksIG5ld0tleV0gPSBnZXRQYXRoc0luUm9vdChbJy9kaXIxL2ZpbGUxJywgJy9kaXIxL25ldy1maWxlMSddKTtcbiAgICAgICAgZXhwZWN0KGZpbGVOb2RlLmdldEtleSgpKS50b0VxdWFsKG9sZEtleSk7XG5cbiAgICAgICAgdmFyIHNvdXJjZVBhdGggPSBmaWxlTm9kZS5nZXRJdGVtKCkuZ2V0UGF0aCgpO1xuICAgICAgICB2YXIgdGFyZ2V0UGF0aCA9IHBhdGguam9pbihyb290Tm9kZS5nZXRJdGVtKCkuZ2V0UGF0aCgpLCAnbmV3LWZpbGUxJyk7XG4gICAgICAgIGZzLm1vdmVTeW5jKHNvdXJjZVBhdGgsIHRhcmdldFBhdGgpO1xuXG4gICAgICAgIHZhciBjaGlsZHJlbiA9IGF3YWl0IHJvb3ROb2RlLmZldGNoQ2hpbGRyZW4oKTtcbiAgICAgICAgdmFyIG5vZGVLZXlzID0gY2hpbGRyZW4ubWFwKChjaGlsZE5vZGUpID0+IGNoaWxkTm9kZS5nZXRLZXkoKSk7XG4gICAgICAgIGV4cGVjdChub2RlS2V5cykudG9FcXVhbChnZXRQYXRoc0luUm9vdChbJy9kaXIxL2RpcjEvJywgJy9kaXIxL25ldy1maWxlMSddKSk7XG4gICAgICAgIGV4cGVjdChmaWxlVHJlZUNvbnRyb2xsZXIuZ2V0U3RhdGVGb3JOb2RlS2V5KG9sZEtleSkpLnRvQmVVbmRlZmluZWQoKTtcbiAgICAgICAgZXhwZWN0KGZpbGVUcmVlQ29udHJvbGxlci5nZXRTdGF0ZUZvck5vZGVLZXkobmV3S2V5KSkubm90LnRvQmVVbmRlZmluZWQoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3JlbW92ZXMgdHJlZUNvbXBvbmVudCBzdGF0ZSB3aGVuIGVudHJpZXMgYXJlIHJlbW92ZWQnLCAoKSA9PiB7XG4gICAgICB3YWl0c0ZvclByb21pc2UoYXN5bmMgKCkgPT4ge1xuICAgICAgICAvLyBFeHBhbmQgdGhlIHJvb3QuXG4gICAgICAgIHZhciByb290Tm9kZSA9IHJvb3ROb2Rlc1swXTtcbiAgICAgICAgdmFyIHJvb3ROb2RlQ2hpbGRyZW4gPSByb290Tm9kZS5nZXRDYWNoZWRDaGlsZHJlbigpO1xuICAgICAgICB0cmVlQ29tcG9uZW50LmV4cGFuZE5vZGVLZXkocm9vdE5vZGUuZ2V0S2V5KCkpO1xuICAgICAgICAvLyBFeHBhbmQgdGhlIGZpcnN0IGRpcmVjdG9yeSB1bmRlciB0aGUgZmlyc3Qgcm9vdC5cbiAgICAgICAgdmFyIGRpcmVjdG9yeU5vZGUgPSByb290Tm9kZUNoaWxkcmVuLmdldCgwKTtcbiAgICAgICAgdHJlZUNvbXBvbmVudC5leHBhbmROb2RlS2V5KGRpcmVjdG9yeU5vZGUuZ2V0S2V5KCkpO1xuICAgICAgICB2YXIgZGlyZWN0b3J5Tm9kZUNoaWxkcmVuID0gYXdhaXQgZGlyZWN0b3J5Tm9kZS5mZXRjaENoaWxkcmVuKCk7XG4gICAgICAgIC8vIEFuZCBleHBhbmQgaXRzIGZpcnN0IHN1YmRpcmVjdG9yeS5cbiAgICAgICAgdmFyIG5lc3RlZERpcmVjdG9yeU5vZGUgPSBkaXJlY3RvcnlOb2RlQ2hpbGRyZW4uZ2V0KDApO1xuICAgICAgICB0cmVlQ29tcG9uZW50LmV4cGFuZE5vZGVLZXkobmVzdGVkRGlyZWN0b3J5Tm9kZS5nZXRLZXkoKSk7XG4gICAgICAgIGF3YWl0IG5lc3RlZERpcmVjdG9yeU5vZGUuZmV0Y2hDaGlsZHJlbigpO1xuXG4gICAgICAgIHJtZGlyLnN5bmMoZGlyZWN0b3J5Tm9kZS5nZXRJdGVtKCkuZ2V0UGF0aCgpKTtcbiAgICAgICAgYXdhaXQgcm9vdE5vZGUuZmV0Y2hDaGlsZHJlbigpO1xuXG4gICAgICAgIHZhciBleHBhbmRlZE5vZGVzID0gdHJlZUNvbXBvbmVudC5nZXRFeHBhbmRlZE5vZGVzKCk7XG4gICAgICAgIHZhciBleHBhbmRlZE5vZGVLZXlzID0gZXhwYW5kZWROb2Rlcy5tYXAoKG5vZGUpID0+IG5vZGUuZ2V0S2V5KCkpO1xuICAgICAgICB2YXIgcm9vdE5vZGVLZXlzID0gcm9vdE5vZGVzLm1hcCgobm9kZSkgPT4gbm9kZS5nZXRLZXkoKSk7XG4gICAgICAgIGV4cGVjdChleHBhbmRlZE5vZGVLZXlzKS50b0VxdWFsKHJvb3ROb2RlS2V5cyk7XG4gICAgICAgIHZhciBzZWxlY3RlZE5vZGVzID0gdHJlZUNvbXBvbmVudC5nZXRTZWxlY3RlZE5vZGVzKCk7XG4gICAgICAgIHZhciBzZWxlY3RlZE5vZGVLZXlzID0gc2VsZWN0ZWROb2Rlcy5tYXAoKG5vZGUpID0+IG5vZGUuZ2V0S2V5KCkpO1xuICAgICAgICBleHBlY3Qoc2VsZWN0ZWROb2RlS2V5cykudG9FcXVhbChbcm9vdE5vZGVLZXlzWzBdXSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59KTtcbiJdfQ==