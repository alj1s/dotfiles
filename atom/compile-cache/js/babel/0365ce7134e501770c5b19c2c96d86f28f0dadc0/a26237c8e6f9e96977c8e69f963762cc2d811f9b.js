'use babel';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var fetchChildren = _asyncToGenerator(function* (node, controller) {
  if (!node.isContainer()) {
    return Immutable.List.of();
  }

  var directory = node.getItem();
  var directoryEntries = yield new Promise(function (resolve, reject) {
    directory.getEntries(function (error, entries) {
      // Resolve to an empty array if the directory deson't exist.
      if (error && error.code !== 'ENOENT') {
        reject(error);
      } else {
        resolve(entries || []);
      }
    });
  });

  var fileNodes = [];
  var directoryNodes = [];
  directoryEntries.forEach(function (entry) {
    var childNode = controller.getNodeAndSetState(entry, /* parent */node);
    if (entry.isDirectory()) {
      directoryNodes.push(childNode);
    } else if (entry.isFile()) {
      fileNodes.push(childNode);
    }
  });

  var newChildren = directoryNodes.concat(fileNodes);

  var cachedChildren = node.getCachedChildren();
  if (cachedChildren) {
    controller.destroyStateForOldNodes(cachedChildren, newChildren);
  }

  return new Immutable.List(newChildren);
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _require = require('nuclide-atom-helpers');

var fileTypeClass = _require.fileTypeClass;

var _require2 = require('atom');

var CompositeDisposable = _require2.CompositeDisposable;
var Disposable = _require2.Disposable;

var Immutable = require('immutable');
var LazyFileTreeNode = require('./LazyFileTreeNode');

var _require3 = require('nuclide-panel');

var PanelController = _require3.PanelController;

var fs = require('fs-plus');
var path = require('path');
var shell = require('shell');

var _require4 = require('nuclide-ui-tree');

var treeNodeTraversals = _require4.treeNodeTraversals;
var TreeRootComponent = _require4.TreeRootComponent;

var React = require('react-for-atom');

var addons = React.addons;

function labelClassNameForNode(node) {
  var classObj = {
    'icon': true,
    'name': true
  };

  var iconClassName;
  if (node.isContainer()) {
    iconClassName = node.isSymlink() ? 'icon-file-symlink-directory' : 'icon-file-directory';
  } else if (node.isSymlink()) {
    iconClassName = 'icon-file-symlink-file';
  } else {
    iconClassName = fileTypeClass(node.getLabel());
  }
  classObj[iconClassName] = true;

  return addons.classSet(classObj);
}

function rowClassNameForNode(node) {
  var vcsClassName = vcsClassNameForEntry(node.getItem());
  return addons.classSet(_defineProperty({}, vcsClassName, vcsClassName));
}

// TODO (t7337695) Make this function more efficient.
function vcsClassNameForEntry(entry) {
  var path = entry.getPath();

  var className = '';

  var _require5 = require('nuclide-hg-git-bridge');

  var repositoryContainsPath = _require5.repositoryContainsPath;

  atom.project.getRepositories().every(function (repository) {
    if (!repository) {
      return true;
    }

    if (!repositoryContainsPath(repository, path)) {
      return true;
    }

    if (repository.isPathIgnored(path)) {
      className = 'status-ignored';
      return false;
    }

    var status = null;
    if (entry.isFile()) {
      status = repository.getCachedPathStatus(path);
    } else if (entry.isDirectory()) {
      status = repository.getDirectoryStatus(path);
    }

    if (status) {
      if (repository.isStatusNew(status)) {
        className = 'status-added';
      } else if (repository.isStatusModified(status)) {
        className = 'status-modified';
      }
      return false;
    }

    return true;
  }, this);
  return className;
}

function isLocalFile(entry) {
  return entry.getLocalPath === undefined;
}

var FileTree = React.createClass({
  displayName: 'FileTree',

  render: function render() {
    return React.createElement(
      'div',
      { className: 'nuclide-file-tree', tabIndex: '-1' },
      React.createElement(TreeRootComponent, _extends({ ref: 'root' }, this.props))
    );
  },

  getTreeRoot: function getTreeRoot() {
    return this.refs.root;
  }
});

var FileTreeController = (function () {
  function FileTreeController(state) {
    var _this = this;

    _classCallCheck(this, FileTreeController);

    this._fetchChildrenWithController = function (node) {
      return fetchChildren(node, _this);
    };

    this._keyToState = new Map();

    this._subscriptions = new CompositeDisposable();
    this._repositorySubscriptions = null;

    this._subscriptions.add(new Disposable(function () {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = _this._keyToState.values()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var nodeState = _step.value;

          if (nodeState.subscription) {
            nodeState.subscription.dispose();
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator['return']) {
            _iterator['return']();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      _this._keyToState = null;
    }));

    var directories = atom.project.getDirectories();
    this._roots = directories.map(function (directory) {
      return _this.getNodeAndSetState(directory, /* parent */null);
    });

    var eventHandlerSelector = '.nuclide-file-tree';

    this._subscriptions.add(atom.commands.add(eventHandlerSelector, {
      'core:backspace': function coreBackspace() {
        return _this.deleteSelection();
      },
      'core:delete': function coreDelete() {
        return _this.deleteSelection();
      }
    }));

    var props = {
      initialRoots: this._roots,
      eventHandlerSelector: eventHandlerSelector,
      onConfirmSelection: this.onConfirmSelection.bind(this),
      onKeepSelection: this.onKeepSelection.bind(this),
      labelClassNameForNode: labelClassNameForNode,
      rowClassNameForNode: rowClassNameForNode,
      elementToRenderWhenEmpty: React.createElement(
        'div',
        null,
        'No project root'
      )
    };
    if (state && state.tree) {
      props.initialExpandedNodeKeys = state.tree.expandedNodeKeys;
      props.initialSelectedNodeKeys = state.tree.selectedNodeKeys;
    }
    this._panelController = new PanelController(React.createElement(FileTree, props), { dock: 'left' }, state && state.panel);

    this._subscriptions.add(atom.commands.add(eventHandlerSelector, {
      'nuclide-file-tree:add-file': function nuclideFileTreeAddFile() {
        return _this.openAddFileDialog();
      },
      'nuclide-file-tree:add-folder': function nuclideFileTreeAddFolder() {
        return _this.openAddFolderDialog();
      },
      'nuclide-file-tree:delete-selection': function nuclideFileTreeDeleteSelection() {
        return _this.deleteSelection();
      },
      'nuclide-file-tree:rename-selection': function nuclideFileTreeRenameSelection() {
        return _this.openRenameDialog();
      },
      'nuclide-file-tree:remove-project-folder-selection': function nuclideFileTreeRemoveProjectFolderSelection() {
        return _this.removeRootFolderSelection();
      },
      'nuclide-file-tree:copy-full-path': function nuclideFileTreeCopyFullPath() {
        return _this.copyFullPath();
      },
      'nuclide-file-tree:show-in-file-manager': function nuclideFileTreeShowInFileManager() {
        return _this.showInFileManager();
      },
      'nuclide-file-tree:reload': function nuclideFileTreeReload() {
        return _this.reload();
      }
    }));

    this._subscriptions.add(atom.project.onDidChangePaths(function (paths) {
      var treeComponent = _this.getTreeComponent();
      if (treeComponent) {
        var newRoots = atom.project.getDirectories().map(function (directory) {
          return _this.getNodeAndSetState(directory, /* parent */null);
        });
        _this.destroyStateForOldNodes(_this._roots, newRoots);
        _this._roots = newRoots;
        treeComponent.setRoots(newRoots);

        if (_this._repositorySubscriptions) {
          _this._repositorySubscriptions.dispose();
        }
        _this._repositorySubscriptions = new CompositeDisposable();
        var rootPaths = atom.project.getPaths();
        atom.project.getRepositories().forEach(function (repository) {
          var _this2 = this;

          if (repository) {
            this._repositorySubscriptions.add(repository.onDidChangeStatuses(function () {
              _this2.forceUpdate();
            }));
            if (repository.getStatuses) {
              // This method is available on HgRepositoryClient.
              // This will trigger a repository ::onDidChangeStatuses event if there
              // are modified files, and thus update the tree to reflect the
              // current version control "state" of the files.
              repository.getStatuses([repository.getProjectDirectory()]);
            }
          }
        }, _this);
      }
    }));

    this.addContextMenuItemGroup([{
      label: 'New',
      submenu: [{
        label: 'File',
        command: 'nuclide-file-tree:add-file'
      }, {
        label: 'Folder',
        command: 'nuclide-file-tree:add-folder'
      }],
      // Show 'New' menu only when a single directory is selected so the
      // target is obvious and can handle a "new" object.
      shouldDisplayForSelectedNodes: function shouldDisplayForSelectedNodes(nodes) {
        return nodes.length === 1 && nodes.every(function (node) {
          return node.isContainer();
        });
      }
    }]);
    this.addContextMenuItemGroup([{
      label: 'Add Project Folder',
      command: 'application:add-project-folder',
      shouldDisplayIfTreeIsEmpty: true
    }, {
      label: 'Add Remote Project Folder',
      command: 'nuclide-remote-projects:connect',
      shouldDisplayIfTreeIsEmpty: true
    }, {
      label: 'Remove Project Folder',
      command: 'nuclide-file-tree:remove-project-folder-selection',
      shouldDisplayForSelectedNodes: function shouldDisplayForSelectedNodes(nodes) {
        return nodes.length > 0 && nodes.every(function (node) {
          return node.isRoot();
        });
      }
    }]);
    this.addContextMenuItemGroup([{
      label: 'Rename',
      command: 'nuclide-file-tree:rename-selection',
      shouldDisplayForSelectedNodes: function shouldDisplayForSelectedNodes(nodes) {
        return nodes.length === 1 && !nodes.some(function (node) {
          return node.isRoot();
        });
      }
    }, {
      label: 'Delete',
      command: 'nuclide-file-tree:delete-selection',
      shouldDisplayForSelectedNodes: function shouldDisplayForSelectedNodes(nodes) {
        return nodes.length > 0 && !nodes.some(function (node) {
          return node.isRoot();
        });
      }
    }]);
    this.addContextMenuItemGroup([{
      label: 'Copy Full Path',
      command: 'nuclide-file-tree:copy-full-path',
      shouldDisplayForSelectedNodes: function shouldDisplayForSelectedNodes(nodes) {
        return nodes.length === 1;
      }
    }, {
      label: 'Show in Finder',
      command: 'nuclide-file-tree:show-in-file-manager',
      shouldDisplayForSelectedNodes: function shouldDisplayForSelectedNodes(nodes) {
        // For now, this only works for local files on OS X.
        return nodes.length === 1 && isLocalFile(nodes[0].getItem()) && process.platform === 'darwin';
      }
    }]);
    this.addContextMenuItemGroup([{
      label: 'Reload',
      command: 'nuclide-file-tree:reload'
    }]);
  }

  _createClass(FileTreeController, [{
    key: 'destroy',
    value: function destroy() {
      this._panelController.destroy();
      this._panelController = null;
      this._subscriptions.dispose();
      this._subscriptions = null;
      if (this._repositorySubscriptions) {
        this._repositorySubscriptions.dispose();
        this._repositorySubscriptions = null;
      }
      this._logger = null;
      if (this._hostElement) {
        this._hostElement.parentNode.removeChild(this._hostElement);
      }
      this._closeDialog();
    }
  }, {
    key: 'toggle',
    value: function toggle() {
      this._panelController.toggle();
    }
  }, {
    key: 'setVisible',
    value: function setVisible(shouldBeVisible) {
      this._panelController.setVisible(shouldBeVisible);
    }
  }, {
    key: 'serialize',
    value: function serialize() {
      var treeComponent = this.getTreeComponent();
      var tree = treeComponent ? treeComponent.serialize() : null;
      return {
        panel: this._panelController.serialize(),
        tree: tree
      };
    }
  }, {
    key: 'forceUpdate',
    value: function forceUpdate() {
      var treeComponent = this.getTreeComponent();
      if (treeComponent) {
        treeComponent.forceUpdate();
      }
    }
  }, {
    key: 'addContextMenuItemGroup',
    value: function addContextMenuItemGroup(menuItemDefinitions) {
      var treeComponent = this.getTreeComponent();
      if (treeComponent) {
        treeComponent.addContextMenuItemGroup(menuItemDefinitions);
      }
    }
  }, {
    key: 'getTreeComponent',
    value: function getTreeComponent() {
      var component = this._panelController.getChildComponent();
      if (component && component.hasOwnProperty('getTreeRoot')) {
        return component.getTreeRoot();
      }
      return null;
    }
  }, {
    key: 'getNodeAndSetState',

    /**
     * Returns the cached node for `entry` or creates a new one. It sets the appropriate bookkeeping
     * state if it creates a new node.
     */
    value: function getNodeAndSetState(entry, parent) {
      var _this3 = this;

      // We need to create a node to get the path, even if we don't end up returning it.
      var node = new LazyFileTreeNode(entry, parent, this._fetchChildrenWithController);
      var nodeKey = node.getKey();

      // Reuse existing node if possible. This preserves the cached children and prevents
      // us from creating multiple file watchers on the same file.
      var state = this.getStateForNodeKey(nodeKey);
      if (state) {
        return state.node;
      }

      var subscription = null;
      if (entry.isDirectory()) {
        try {
          // this call fails because it could try to watch a non-existing directory,
          // or with a use that has no permission to it.
          subscription = entry.onDidChange(function () {
            node.invalidateCache();
            _this3.forceUpdate();
          });
        } catch (err) {
          this._logError('nuclide-file-tree: Cannot subscribe to a directory.', entry.getPath(), err);
        }
      }

      this._setStateForNodeKey(nodeKey, { node: node, subscription: subscription });

      return node;
    }
  }, {
    key: '_setStateForNodeKey',
    value: function _setStateForNodeKey(nodeKey, state) {
      this._destroyStateForNodeKey(nodeKey);
      this._keyToState.set(nodeKey, state);
    }
  }, {
    key: 'getStateForNodeKey',
    value: function getStateForNodeKey(nodeKey) {
      return this._keyToState.get(nodeKey);
    }
  }, {
    key: 'destroyStateForOldNodes',

    /**
     * Destroys states for nodes that are in `oldNodes` and not in `newNodes`.
     * This is useful when fetching new children -- some cached nodes can still
     * be reused and the rest must be destroyed.
     */
    value: function destroyStateForOldNodes(oldNodes, newNodes) {
      var _this4 = this;

      var newNodesSet = new Set(newNodes);
      oldNodes.forEach(function (oldNode) {
        if (!newNodesSet.has(oldNode)) {
          _this4._destroyStateForNodeKey(oldNode.getKey());
        }
      });
    }
  }, {
    key: '_destroyStateForNodeKey',
    value: function _destroyStateForNodeKey(nodeKey) {
      var _this5 = this;

      var state = this.getStateForNodeKey(nodeKey);
      if (state) {
        var node = state.node;

        treeNodeTraversals.forEachCachedNode(node, function (cachedNode) {
          var cachedNodeKey = cachedNode.getKey();
          var cachedState = _this5.getStateForNodeKey(cachedNodeKey);
          if (cachedState) {
            if (cachedState.subscription) {
              cachedState.subscription.dispose();
            }
            _this5._keyToState['delete'](cachedNodeKey);
          }
        });

        var treeComponent = this.getTreeComponent();
        if (treeComponent) {
          treeComponent.removeStateForSubtree(node);
        }
      }
    }
  }, {
    key: 'onConfirmSelection',
    value: function onConfirmSelection(node) {
      var entry = node.getItem();
      atom.workspace.open(entry.getPath(), {
        activatePane: !atom.config.get('tabs.usePreviewTabs'),
        searchAllPanes: true
      });
    }
  }, {
    key: 'onKeepSelection',
    value: function onKeepSelection() {
      if (!atom.config.get('tabs.usePreviewTabs')) {
        return;
      }

      var activePaneItem = atom.workspace.getActivePaneItem();
      atom.commands.dispatch(atom.views.getView(activePaneItem), 'tabs:keep-preview-tab');

      // "Activate" the already-active pane to give it focus.
      atom.workspace.getActivePane().activate();
    }
  }, {
    key: 'removeRootFolderSelection',
    value: function removeRootFolderSelection() {
      var selectedItems = this._getSelectedItems();
      var selectedFilePaths = selectedItems.map(function (item) {
        return item.getPath();
      });
      var rootPathsSet = new Set(atom.project.getPaths());
      selectedFilePaths.forEach(function (selectedFilePath) {
        if (rootPathsSet.has(selectedFilePath)) {
          atom.project.removePath(selectedFilePath);
        }
      });
    }
  }, {
    key: 'copyFullPath',
    value: function copyFullPath() {
      var selectedItems = this._getSelectedItems();
      if (selectedItems.length !== 1) {
        this._logError('nuclide-file-tree: Exactly 1 item should be selected');
        return;
      }

      var selectedItem = selectedItems[0];
      // For remote files we want to copy the local path instead of full path.
      // i.e, "/home/dir/file" vs "nuclide:/host:port/home/dir/file"
      atom.clipboard.write(isLocalFile(selectedItem) ? selectedItem.getPath() : selectedItem.getLocalPath());
    }
  }, {
    key: 'showInFileManager',
    value: function showInFileManager() {
      var selectedItems = this._getSelectedItems();
      if (selectedItems.length !== 1) {
        return;
      }
      var filePath = selectedItems[0].getPath();

      if (process.platform === 'darwin') {
        var _require6 = require('nuclide-commons');

        var asyncExecute = _require6.asyncExecute;

        asyncExecute('open', ['-R', filePath], /* options */{});
      }
    }
  }, {
    key: 'revealActiveFile',
    value: _asyncToGenerator(function* () {
      var editor = atom.workspace.getActiveTextEditor();
      if (!editor) {
        return;
      }

      var treeComponent = this.getTreeComponent();
      if (treeComponent) {
        var _editor$getBuffer = editor.getBuffer();

        var file = _editor$getBuffer.file;

        if (file) {
          var find = require('nuclide-commons').array.find;

          var filePath = file.getPath();
          var rootDirectory = find(atom.project.getDirectories(), function (directory) {
            return directory.contains(filePath);
          });
          if (rootDirectory) {
            // Accumulate all the ancestor keys from the file up to the root.
            var directory = file.getParent();
            var ancestorKeys = [];
            while (rootDirectory.getPath() !== directory.getPath()) {
              ancestorKeys.push(new LazyFileTreeNode(directory).getKey());
              directory = directory.getParent();
            }
            ancestorKeys.push(new LazyFileTreeNode(rootDirectory).getKey());

            // Expand each node from the root down to the file.
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
              for (var _iterator2 = ancestorKeys.reverse()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var nodeKey = _step2.value;

                try {
                  // Select the node to ensure it's visible.
                  yield treeComponent.selectNodeKey(nodeKey);
                  yield treeComponent.expandNodeKey(nodeKey);
                } catch (error) {
                  // If the node isn't in the tree, its descendants aren't either.
                  return;
                }
              }
            } catch (err) {
              _didIteratorError2 = true;
              _iteratorError2 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion2 && _iterator2['return']) {
                  _iterator2['return']();
                }
              } finally {
                if (_didIteratorError2) {
                  throw _iteratorError2;
                }
              }
            }

            try {
              yield treeComponent.selectNodeKey(new LazyFileTreeNode(file).getKey());
            } catch (error) {
              // It's ok if the node isn't in the tree, so we can ignore the error.
              return;
            }
          }
        }
      }
      this.setVisible(true);
    })
  }, {
    key: 'deleteSelection',
    value: function deleteSelection() {
      var _this6 = this;

      var treeComponent = this.getTreeComponent();
      if (!treeComponent) {
        return;
      }

      var selectedNodes = treeComponent.getSelectedNodes();
      if (selectedNodes.length === 0 || selectedNodes.some(function (node) {
        return node.isRoot();
      })) {
        return;
      }
      var selectedItems = selectedNodes.map(function (node) {
        return node.getItem();
      });

      var selectedPaths = selectedItems.map(function (entry) {
        return entry.getPath();
      });
      var message = 'Are you sure you want to delete the selected ' + (selectedItems.length > 1 ? 'items' : 'item');
      atom.confirm({
        message: message,
        detailedMessage: 'You are deleting:\n' + selectedPaths.join('\n'),
        buttons: {
          'Delete': _asyncToGenerator(function* () {
            var deletePromises = [];
            selectedItems.forEach(function (entry, i) {
              var entryPath = selectedPaths[i];
              if (entryPath.startsWith('nuclide:/')) {
                deletePromises.push(entry['delete']());
              } else {
                // TODO(jjiaa): This special-case can be eliminated once `delete()`
                // is added to `Directory` and `File`.
                shell.moveItemToTrash(entryPath);
              }
            });

            yield Promise.all(deletePromises);
            var parentDirectories = new Set(selectedItems.map(function (entry) {
              return entry.getParent();
            }));
            parentDirectories.forEach(function (directory) {
              return _this6._reloadDirectory(directory);
            });
          }),
          'Cancel': null
        }
      });
    }
  }, {
    key: 'reload',
    value: function reload() {
      var treeComponent = this.getTreeComponent();
      if (!treeComponent) {
        return;
      }
      treeComponent.invalidateCachedNodes();
      treeComponent.forceUpdate();
    }
  }, {
    key: '_getSelectedItems',
    value: function _getSelectedItems() {
      var treeComponent = this.getTreeComponent();
      if (!treeComponent) {
        return [];
      }

      var selectedNodes = treeComponent.getSelectedNodes();
      return selectedNodes.map(function (node) {
        return node.getItem();
      });
    }
  }, {
    key: 'openAddFileDialog',
    value: function openAddFileDialog() {
      var _this7 = this;

      this._openAddDialog('file', _asyncToGenerator(function* (rootDirectory, filePath) {
        // Note: this will throw if the resulting path matches that of an existing
        // local directory.
        var newFile = rootDirectory.getFile(filePath);
        yield newFile.create();
        atom.workspace.open(newFile.getPath());
        _this7._reloadDirectory(newFile.getParent());
      }));
    }
  }, {
    key: 'openAddFolderDialog',
    value: function openAddFolderDialog() {
      var _this8 = this;

      this._openAddDialog('folder', _asyncToGenerator(function* (rootDirectory, directoryPath) {
        var newDirectory = rootDirectory.getSubdirectory(directoryPath);
        yield newDirectory.create();
        _this8._reloadDirectory(newDirectory.getParent());
      }));
    }
  }, {
    key: '_reloadDirectory',
    value: function _reloadDirectory(directory) {
      var directoryNode = this.getTreeComponent().getNodeForKey(new LazyFileTreeNode(directory).getKey());
      directoryNode.invalidateCache();
      this.forceUpdate();
    }
  }, {
    key: '_openAddDialog',
    value: function _openAddDialog(entryType, onConfirm) {
      var selection = this._getSelectedEntryAndDirectoryAndRoot();
      if (!selection) {
        return;
      }
      var message = React.createElement(
        'div',
        null,
        React.createElement(
          'div',
          null,
          'Enter the path for the new ',
          entryType,
          ' in the root:'
        ),
        React.createElement(
          'div',
          null,
          path.normalize(selection.root.getPath() + '/')
        )
      );

      var FileDialogComponent = require('./FileDialogComponent');
      var props = {
        rootDirectory: selection.root,
        initialEntry: selection.directory,
        initialDirectoryPath: selection.entry.getPath(),
        message: message,
        onConfirm: onConfirm,
        onClose: this._closeDialog.bind(this)
      };
      this._openDialog(React.createElement(FileDialogComponent, props));
    }
  }, {
    key: 'openRenameDialog',
    value: function openRenameDialog() {
      var _this9 = this;

      var selection = this._getSelectedEntryAndDirectoryAndRoot();
      if (!selection) {
        return;
      }

      var entryType = selection.entry.isFile() ? 'file' : 'folder';
      var message = React.createElement(
        'div',
        null,
        React.createElement(
          'div',
          null,
          'Enter the new path for the ',
          entryType,
          ' in the root:'
        ),
        React.createElement(
          'div',
          null,
          path.normalize(selection.root.getPath() + '/')
        )
      );

      var entry = selection.entry;
      var root = selection.root;

      var FileDialogComponent = require('./FileDialogComponent');
      var props = {
        rootDirectory: root,
        initialEntry: entry,
        message: message,
        onConfirm: _asyncToGenerator(function* (rootDirectory, relativeFilePath) {
          if (isLocalFile(entry)) {
            // TODO(jjiaa): This special-case can be eliminated once `delete()`
            // is added to `Directory` and `File`.
            yield new Promise(function (resolve, reject) {
              fs.move(entry.getPath(),
              // Use `resolve` to strip trailing slashes because renaming a
              // file to a name with a trailing slash is an error.
              path.resolve(path.join(rootDirectory.getPath(), relativeFilePath)), function (error) {
                return error ? reject(error) : resolve();
              });
            });
          } else {
            yield entry.rename(path.join(rootDirectory.getLocalPath(), relativeFilePath));
          }
          _this9._reloadDirectory(entry.getParent());
        }),
        onClose: function onClose() {
          return _this9._closeDialog();
        },
        shouldSelectBasename: true
      };
      this._openDialog(React.createElement(FileDialogComponent, props));
    }
  }, {
    key: '_openDialog',
    value: function _openDialog(component) {
      this._closeDialog();

      this._hostElement = document.createElement('div');
      var workspaceEl = atom.views.getView(atom.workspace);
      workspaceEl.appendChild(this._hostElement);
      this._dialogComponent = React.render(component, this._hostElement);
    }
  }, {
    key: '_closeDialog',
    value: function _closeDialog() {
      if (this._dialogComponent && this._dialogComponent.isMounted()) {
        React.unmountComponentAtNode(this._hostElement);
        this._dialogComponent = null;
        atom.views.getView(atom.workspace).removeChild(this._hostElement);
        this._hostElement = null;
      }
    }
  }, {
    key: '_getSelectedEntryAndDirectoryAndRoot',

    /**
     * Returns an object with the following properties:
     * - entry: The selected file or directory.
     * - directory: The selected directory or its parent if the selection is a file.
     * - root: The root directory containing the selected entry.
     *
     * The entry defaults to the first root directory if nothing is selected.
     * Returns null if some of the returned properties can't be populated.
     *
     * This is useful for populating the file dialogs.
     */
    value: function _getSelectedEntryAndDirectoryAndRoot() {
      var treeComponent = this.getTreeComponent();
      if (!treeComponent) {
        this._logError('nuclide-file-tree: Cannot get the directory for the selection because no file tree exists.');
        return null;
      }

      var entry = null;
      var selectedNodes = treeComponent.getSelectedNodes();
      if (selectedNodes.length > 0) {
        entry = selectedNodes[0].getItem();
      } else {
        var rootDirectories = atom.project.getDirectories();
        if (rootDirectories.length > 0) {
          entry = rootDirectories[0];
        } else {
          // We shouldn't be able to reach this error because it should only be
          // accessible from a context menu. If there's a context menu, there must
          // be at least one root folder with a descendant that's right-clicked.
          this._logError('nuclide-file-tree: Could not find a directory to add to.');
          return null;
        }
      }

      return {
        entry: entry,
        directory: entry && entry.isFile() ? entry.getParent() : entry,
        root: this._getRootDirectory(entry)
      };
    }
  }, {
    key: '_getRootDirectory',

    /**
     * Returns the workspace root directory for the entry, or the entry's parent.
     */
    value: function _getRootDirectory(entry) {
      if (!entry) {
        return null;
      }
      var rootDirectoryOfEntry = null;
      var entryPath = entry.getPath();
      atom.project.getDirectories().some(function (directory) {
        // someDirectory.contains(someDirectory.getPath()) returns false, so
        // we also have to check for the equivalence of the path.
        if (directory.contains(entryPath) || directory.getPath() === entryPath) {
          rootDirectoryOfEntry = directory;
          return true;
        }
        return false;
      });

      if (!rootDirectoryOfEntry) {
        rootDirectoryOfEntry = entry.getParent();
      }

      return rootDirectoryOfEntry;
    }
  }, {
    key: '_logError',
    value: function _logError(errorMessage) {
      if (!this._logger) {
        this._logger = require('nuclide-logging').getLogger();
      }
      this._logger.error(errorMessage);
    }
  }]);

  return FileTreeController;
})();

module.exports = FileTreeController;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtdHJlZS9saWIvRmlsZVRyZWVDb250cm9sbGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7O0lBd0JHLGFBQWEscUJBQTVCLFdBQTZCLElBQXNCLEVBQUUsVUFBOEIsRUFBNkM7QUFDOUgsTUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRTtBQUN2QixXQUFPLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7R0FDNUI7O0FBRUQsTUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQy9CLE1BQUksZ0JBQWdCLEdBQUcsTUFBTSxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUs7QUFDNUQsYUFBUyxDQUFDLFVBQVUsQ0FBQyxVQUFDLEtBQUssRUFBRSxPQUFPLEVBQUs7O0FBRXZDLFVBQUksS0FBSyxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFO0FBQ3BDLGNBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztPQUNmLE1BQU07QUFDTCxlQUFPLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQyxDQUFDO09BQ3hCO0tBQ0YsQ0FBQyxDQUFDO0dBQ0osQ0FBQyxDQUFDOztBQUVILE1BQUksU0FBUyxHQUFHLEVBQUUsQ0FBQztBQUNuQixNQUFJLGNBQWMsR0FBRyxFQUFFLENBQUM7QUFDeEIsa0JBQWdCLENBQUMsT0FBTyxDQUFDLFVBQUMsS0FBSyxFQUFLO0FBQ2xDLFFBQUksU0FBUyxHQUFHLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLGNBQWUsSUFBSSxDQUFDLENBQUM7QUFDeEUsUUFBSSxLQUFLLENBQUMsV0FBVyxFQUFFLEVBQUU7QUFDdkIsb0JBQWMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7S0FDaEMsTUFBTSxJQUFJLEtBQUssQ0FBQyxN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QUFDLFlBQW9CLEVBQVE7QUFDcEMsVUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUU7QUFDakIsWUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztPQUN2RDtBQUNELFVBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO0tBQ2xDOzs7U0ExcUJHLGtCQUFrQjs7O0FBNnFCeEIsTUFBTSxDQUFDLE9BQU8sR0FBRyxrQkFBa0IsQ0FBQyIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvbnVjbGlkZS1maWxlLXRyZWUvbGliL0ZpbGVUcmVlQ29udHJvbGxlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbnZhciB7ZmlsZVR5cGVDbGFzc30gPSByZXF1aXJlKCdudWNsaWRlLWF0b20taGVscGVycycpO1xudmFyIHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlfSA9IHJlcXVpcmUoJ2F0b20nKTtcbnZhciBJbW11dGFibGUgPSByZXF1aXJlKCdpbW11dGFibGUnKTtcbnZhciBMYXp5RmlsZVRyZWVOb2RlID0gcmVxdWlyZSgnLi9MYXp5RmlsZVRyZWVOb2RlJyk7XG52YXIge1BhbmVsQ29udHJvbGxlcn0gPSByZXF1aXJlKCdudWNsaWRlLXBhbmVsJyk7XG52YXIgZnMgPSByZXF1aXJlKCdmcy1wbHVzJyk7XG52YXIgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbnZhciBzaGVsbCA9IHJlcXVpcmUoJ3NoZWxsJyk7XG52YXIge3RyZWVOb2RlVHJhdmVyc2FscywgVHJlZVJvb3RDb21wb25lbnR9ID0gcmVxdWlyZSgnbnVjbGlkZS11aS10cmVlJyk7XG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC1mb3ItYXRvbScpO1xuXG52YXIge2FkZG9uc30gPSBSZWFjdDtcblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hDaGlsZHJlbihub2RlOiBMYXp5RmlsZVRyZWVOb2RlLCBjb250cm9sbGVyOiBGaWxlVHJlZUNvbnRyb2xsZXIpOiBQcm9taXNlPEltbXV0YWJsZS5MaXN0PExhenlGaWxlVHJlZU5vZGU+PiB7XG4gIGlmICghbm9kZS5pc0NvbnRhaW5lcigpKSB7XG4gICAgcmV0dXJuIEltbXV0YWJsZS5MaXN0Lm9mKCk7XG4gIH1cblxuICB2YXIgZGlyZWN0b3J5ID0gbm9kZS5nZXRJdGVtKCk7XG4gIHZhciBkaXJlY3RvcnlFbnRyaWVzID0gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGRpcmVjdG9yeS5nZXRFbnRyaWVzKChlcnJvciwgZW50cmllcykgPT4ge1xuICAgICAgLy8gUmVzb2x2ZSB0byBhbiBlbXB0eSBhcnJheSBpZiB0aGUgZGlyZWN0b3J5IGRlc29uJ3QgZXhpc3QuXG4gICAgICBpZiAoZXJyb3IgJiYgZXJyb3IuY29kZSAhPT0gJ0VOT0VOVCcpIHtcbiAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc29sdmUoZW50cmllcyB8fCBbXSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xuXG4gIHZhciBmaWxlTm9kZXMgPSBbXTtcbiAgdmFyIGRpcmVjdG9yeU5vZGVzID0gW107XG4gIGRpcmVjdG9yeUVudHJpZXMuZm9yRWFjaCgoZW50cnkpID0+IHtcbiAgICB2YXIgY2hpbGROb2RlID0gY29udHJvbGxlci5nZXROb2RlQW5kU2V0U3RhdGUoZW50cnksIC8qIHBhcmVudCAqLyBub2RlKTtcbiAgICBpZiAoZW50cnkuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgZGlyZWN0b3J5Tm9kZXMucHVzaChjaGlsZE5vZGUpO1xuICAgIH0gZWxzZSBpZiAoZW50cnkuaXNGaWxlKCkpIHtcbiAgICAgIGZpbGVOb2Rlcy5wdXNoKGNoaWxkTm9kZSk7XG4gICAgfVxuICB9KTtcblxuICB2YXIgbmV3Q2hpbGRyZW4gPSBkaXJlY3RvcnlOb2Rlcy5jb25jYXQoZmlsZU5vZGVzKTtcblxuICB2YXIgY2FjaGVkQ2hpbGRyZW4gPSBub2RlLmdldENhY2hlZENoaWxkcmVuKCk7XG4gIGlmIChjYWNoZWRDaGlsZHJlbikge1xuICAgIGNvbnRyb2xsZXIuZGVzdHJveVN0YXRlRm9yT2xkTm9kZXMoY2FjaGVkQ2hpbGRyZW4sIG5ld0NoaWxkcmVuKTtcbiAgfVxuXG4gIHJldHVybiBuZXcgSW1tdXRhYmxlLkxpc3QobmV3Q2hpbGRyZW4pO1xufVxuXG5mdW5jdGlvbiBsYWJlbENsYXNzTmFtZUZvck5vZGUobm9kZTogTGF6eUZpbGVUcmVlTm9kZSkge1xuICB2YXIgY2xhc3NPYmogPSB7XG4gICAgJ2ljb24nOiB0cnVlLFxuICAgICduYW1lJzogdHJ1ZSxcbiAgfTtcblxuICB2YXIgaWNvbkNsYXNzTmFtZTtcbiAgaWYgKG5vZGUuaXNDb250YWluZXIoKSkge1xuICAgIGljb25DbGFzc05hbWUgPSBub2RlLmlzU3ltbGluaygpXG4gICAgICA/ICdpY29uLWZpbGUtc3ltbGluay1kaXJlY3RvcnknXG4gICAgICA6ICdpY29uLWZpbGUtZGlyZWN0b3J5JztcbiAgfSBlbHNlIGlmIChub2RlLmlzU3ltbGluaygpKSB7XG4gICAgaWNvbkNsYXNzTmFtZSA9ICdpY29uLWZpbGUtc3ltbGluay1maWxlJztcbiAgfSBlbHNlIHtcbiAgICBpY29uQ2xhc3NOYW1lID0gZmlsZVR5cGVDbGFzcyhub2RlLmdldExhYmVsKCkpO1xuICB9XG4gIGNsYXNzT2JqW2ljb25DbGFzc05hbWVdID0gdHJ1ZTtcblxuICByZXR1cm4gYWRkb25zLmNsYXNzU2V0KGNsYXNzT2JqKTtcbn1cblxuZnVuY3Rpb24gcm93Q2xhc3NOYW1lRm9yTm9kZShub2RlOiBMYXp5RmlsZVRyZWVOb2RlKSB7XG4gIHZhciB2Y3NDbGFzc05hbWUgPSB2Y3NDbGFzc05hbWVGb3JFbnRyeShub2RlLmdldEl0ZW0oKSk7XG4gIHJldHVybiBhZGRvbnMuY2xhc3NTZXQoe1xuICAgIFt2Y3NDbGFzc05hbWVdOiB2Y3NDbGFzc05hbWUsXG4gIH0pO1xufVxuXG4vLyBUT0RPICh0NzMzNzY5NSkgTWFrZSB0aGlzIGZ1bmN0aW9uIG1vcmUgZWZmaWNpZW50LlxuZnVuY3Rpb24gdmNzQ2xhc3NOYW1lRm9yRW50cnkoZW50cnk6IEZpbGUgfCBEaXJlY3RvcnkpOiBzdHJpbmcge1xuICB2YXIgcGF0aCA9IGVudHJ5LmdldFBhdGgoKTtcblxuICB2YXIgY2xhc3NOYW1lID0gJyc7XG4gIHZhciB7cmVwb3NpdG9yeUNvbnRhaW5zUGF0aH0gPSByZXF1aXJlKCdudWNsaWRlLWhnLWdpdC1icmlkZ2UnKTtcbiAgYXRvbS5wcm9qZWN0LmdldFJlcG9zaXRvcmllcygpLmV2ZXJ5KGZ1bmN0aW9uKHJlcG9zaXRvcnk6ID9SZXBvc2l0b3J5KSB7XG4gICAgaWYgKCFyZXBvc2l0b3J5KSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoIXJlcG9zaXRvcnlDb250YWluc1BhdGgocmVwb3NpdG9yeSwgcGF0aCkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmIChyZXBvc2l0b3J5LmlzUGF0aElnbm9yZWQocGF0aCkpIHtcbiAgICAgIGNsYXNzTmFtZSA9ICdzdGF0dXMtaWdub3JlZCc7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdmFyIHN0YXR1cyA9IG51bGw7XG4gICAgaWYgKGVudHJ5LmlzRmlsZSgpKSB7XG4gICAgICBzdGF0dXMgPSByZXBvc2l0b3J5LmdldENhY2hlZFBhdGhTdGF0dXMocGF0aCk7XG4gICAgfSBlbHNlIGlmIChlbnRyeS5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICBzdGF0dXMgPSByZXBvc2l0b3J5LmdldERpcmVjdG9yeVN0YXR1cyhwYXRoKTtcbiAgICB9XG5cbiAgICBpZiAoc3RhdHVzKSB7XG4gICAgICBpZiAocmVwb3NpdG9yeS5pc1N0YXR1c05ldyhzdGF0dXMpKSB7XG4gICAgICAgIGNsYXNzTmFtZSA9ICdzdGF0dXMtYWRkZWQnO1xuICAgICAgfSBlbHNlIGlmIChyZXBvc2l0b3J5LmlzU3RhdHVzTW9kaWZpZWQoc3RhdHVzKSkge1xuICAgICAgICBjbGFzc05hbWUgPSAnc3RhdHVzLW1vZGlmaWVkJztcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSwgdGhpcyk7XG4gIHJldHVybiBjbGFzc05hbWU7XG59XG5cbmZ1bmN0aW9uIGlzTG9jYWxGaWxlKGVudHJ5OiBGaWxlIHwgRGlyZWN0b3J5KTogYm9vbGVhbiB7XG4gIHJldHVybiBlbnRyeS5nZXRMb2NhbFBhdGggPT09IHVuZGVmaW5lZDtcbn1cblxudHlwZSBGaWxlVHJlZUNvbnRyb2xsZXJTdGF0ZSA9IHtcbiAgcGFuZWw6IFBhbmVsQ29udHJvbGxlclN0YXRlO1xuICB0cmVlOiA/VHJlZUNvbXBvbmVudFN0YXRlO1xufTtcblxudHlwZSBOb2RlU3RhdGUgPSB7bm9kZTogTGF6eUZpbGVUcmVlTm9kZTsgc3Vic2NyaXB0aW9uOiA/RGlzcG9zYWJsZX07XG5cbnZhciBGaWxlVHJlZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgcmVuZGVyKCkge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cIm51Y2xpZGUtZmlsZS10cmVlXCIgdGFiSW5kZXg9XCItMVwiPlxuICAgICAgICA8VHJlZVJvb3RDb21wb25lbnQgcmVmPVwicm9vdFwiIHsuLi50aGlzLnByb3BzfS8+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9LFxuXG4gIGdldFRyZWVSb290KCk6ID9SZWFjdENvbXBvbmVudCB7XG4gICAgcmV0dXJuIHRoaXMucmVmcy5yb290O1xuICB9LFxufSk7XG5cbmNsYXNzIEZpbGVUcmVlQ29udHJvbGxlciB7XG4gIF9ob3N0RWxlbWVudDogP0VsZW1lbnQ7XG4gIF9rZXlUb1N0YXRlOiA/TWFwPHN0cmluZywgTm9kZVN0YXRlPjtcblxuICBjb25zdHJ1Y3RvcihzdGF0ZTogP0ZpbGVUcmVlQ29udHJvbGxlclN0YXRlKSB7XG4gICAgdGhpcy5fZmV0Y2hDaGlsZHJlbldpdGhDb250cm9sbGVyID0gKG5vZGUpID0+IGZldGNoQ2hpbGRyZW4obm9kZSwgdGhpcyk7XG5cbiAgICB0aGlzLl9rZXlUb1N0YXRlID0gbmV3IE1hcCgpO1xuXG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgdGhpcy5fcmVwb3NpdG9yeVN1YnNjcmlwdGlvbnMgPSBudWxsO1xuXG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQobmV3IERpc3Bvc2FibGUoKCkgPT4ge1xuICAgICAgZm9yICh2YXIgbm9kZVN0YXRlIG9mIHRoaXMuX2tleVRvU3RhdGUudmFsdWVzKCkpIHtcbiAgICAgICAgaWYgKG5vZGVTdGF0ZS5zdWJzY3JpcHRpb24pIHtcbiAgICAgICAgICBub2RlU3RhdGUuc3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5fa2V5VG9TdGF0ZSA9IG51bGw7XG4gICAgfSkpO1xuXG4gICAgdmFyIGRpcmVjdG9yaWVzID0gYXRvbS5wcm9qZWN0LmdldERpcmVjdG9yaWVzKCk7XG4gICAgdGhpcy5fcm9vdHMgPSBkaXJlY3Rvcmllcy5tYXAoXG4gICAgICAgIChkaXJlY3RvcnkpID0+IHRoaXMuZ2V0Tm9kZUFuZFNldFN0YXRlKGRpcmVjdG9yeSwgLyogcGFyZW50ICovIG51bGwpKTtcblxuICAgIHZhciBldmVudEhhbmRsZXJTZWxlY3RvciA9ICcubnVjbGlkZS1maWxlLXRyZWUnO1xuXG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXG4gICAgICAgIGV2ZW50SGFuZGxlclNlbGVjdG9yLFxuICAgICAgICB7XG4gICAgICAgICAgJ2NvcmU6YmFja3NwYWNlJzogKCkgPT4gdGhpcy5kZWxldGVTZWxlY3Rpb24oKSxcbiAgICAgICAgICAnY29yZTpkZWxldGUnOiAoKSA9PiB0aGlzLmRlbGV0ZVNlbGVjdGlvbigpLFxuICAgICAgICB9KSk7XG5cbiAgICB2YXIgcHJvcHMgPSB7XG4gICAgICBpbml0aWFsUm9vdHM6IHRoaXMuX3Jvb3RzLFxuICAgICAgZXZlbnRIYW5kbGVyU2VsZWN0b3IsXG4gICAgICBvbkNvbmZpcm1TZWxlY3Rpb246IHRoaXMub25Db25maXJtU2VsZWN0aW9uLmJpbmQodGhpcyksXG4gICAgICBvbktlZXBTZWxlY3Rpb246IHRoaXMub25LZWVwU2VsZWN0aW9uLmJpbmQodGhpcyksXG4gICAgICBsYWJlbENsYXNzTmFtZUZvck5vZGUsXG4gICAgICByb3dDbGFzc05hbWVGb3JOb2RlLFxuICAgICAgZWxlbWVudFRvUmVuZGVyV2hlbkVtcHR5OiA8ZGl2Pk5vIHByb2plY3Qgcm9vdDwvZGl2PixcbiAgICB9O1xuICAgIGlmIChzdGF0ZSAmJiBzdGF0ZS50cmVlKSB7XG4gICAgICBwcm9wcy5pbml0aWFsRXhwYW5kZWROb2RlS2V5cyA9IHN0YXRlLnRyZWUuZXhwYW5kZWROb2RlS2V5cztcbiAgICAgIHByb3BzLmluaXRpYWxTZWxlY3RlZE5vZGVLZXlzID0gc3RhdGUudHJlZS5zZWxlY3RlZE5vZGVLZXlzO1xuICAgIH1cbiAgICB0aGlzLl9wYW5lbENvbnRyb2xsZXIgPSBuZXcgUGFuZWxDb250cm9sbGVyKFxuICAgICAgICA8RmlsZVRyZWUgey4uLnByb3BzfSAvPixcbiAgICAgICAge2RvY2s6ICdsZWZ0J30sXG4gICAgICAgIHN0YXRlICYmIHN0YXRlLnBhbmVsKTtcblxuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29tbWFuZHMuYWRkKFxuICAgICAgICBldmVudEhhbmRsZXJTZWxlY3RvcixcbiAgICAgICAge1xuICAgICAgICAgICdudWNsaWRlLWZpbGUtdHJlZTphZGQtZmlsZSc6ICgpID0+IHRoaXMub3BlbkFkZEZpbGVEaWFsb2coKSxcbiAgICAgICAgICAnbnVjbGlkZS1maWxlLXRyZWU6YWRkLWZvbGRlcic6ICgpID0+IHRoaXMub3BlbkFkZEZvbGRlckRpYWxvZygpLFxuICAgICAgICAgICdudWNsaWRlLWZpbGUtdHJlZTpkZWxldGUtc2VsZWN0aW9uJzogKCkgPT4gdGhpcy5kZWxldGVTZWxlY3Rpb24oKSxcbiAgICAgICAgICAnbnVjbGlkZS1maWxlLXRyZWU6cmVuYW1lLXNlbGVjdGlvbic6ICgpID0+IHRoaXMub3BlblJlbmFtZURpYWxvZygpLFxuICAgICAgICAgICdudWNsaWRlLWZpbGUtdHJlZTpyZW1vdmUtcHJvamVjdC1mb2xkZXItc2VsZWN0aW9uJzogKCkgPT4gdGhpcy5yZW1vdmVSb290Rm9sZGVyU2VsZWN0aW9uKCksXG4gICAgICAgICAgJ251Y2xpZGUtZmlsZS10cmVlOmNvcHktZnVsbC1wYXRoJzogKCkgPT4gdGhpcy5jb3B5RnVsbFBhdGgoKSxcbiAgICAgICAgICAnbnVjbGlkZS1maWxlLXRyZWU6c2hvdy1pbi1maWxlLW1hbmFnZXInOiAoKSA9PiB0aGlzLnNob3dJbkZpbGVNYW5hZ2VyKCksXG4gICAgICAgICAgJ251Y2xpZGUtZmlsZS10cmVlOnJlbG9hZCc6ICgpID0+IHRoaXMucmVsb2FkKCksXG4gICAgICAgIH0pKTtcblxuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuYWRkKGF0b20ucHJvamVjdC5vbkRpZENoYW5nZVBhdGhzKChwYXRocykgPT4ge1xuICAgICAgdmFyIHRyZWVDb21wb25lbnQgPSB0aGlzLmdldFRyZWVDb21wb25lbnQoKTtcbiAgICAgIGlmICh0cmVlQ29tcG9uZW50KSB7XG4gICAgICAgIHZhciBuZXdSb290cyA9IGF0b20ucHJvamVjdC5nZXREaXJlY3RvcmllcygpLm1hcChcbiAgICAgICAgICAgIChkaXJlY3RvcnkpID0+IHRoaXMuZ2V0Tm9kZUFuZFNldFN0YXRlKGRpcmVjdG9yeSwgLyogcGFyZW50ICovIG51bGwpKTtcbiAgICAgICAgdGhpcy5kZXN0cm95U3RhdGVGb3JPbGROb2Rlcyh0aGlzLl9yb290cywgbmV3Um9vdHMpO1xuICAgICAgICB0aGlzLl9yb290cyA9IG5ld1Jvb3RzO1xuICAgICAgICB0cmVlQ29tcG9uZW50LnNldFJvb3RzKG5ld1Jvb3RzKTtcblxuICAgICAgICBpZiAodGhpcy5fcmVwb3NpdG9yeVN1YnNjcmlwdGlvbnMpIHtcbiAgICAgICAgICB0aGlzLl9yZXBvc2l0b3J5U3Vic2NyaXB0aW9ucy5kaXNwb3NlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcmVwb3NpdG9yeVN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB2YXIgcm9vdFBhdGhzID0gYXRvbS5wcm9qZWN0LmdldFBhdGhzKCk7XG4gICAgICAgIGF0b20ucHJvamVjdC5nZXRSZXBvc2l0b3JpZXMoKS5mb3JFYWNoKGZ1bmN0aW9uKHJlcG9zaXRvcnk6ID9SZXBvc2l0b3J5KSB7XG4gICAgICAgICAgaWYgKHJlcG9zaXRvcnkpIHtcbiAgICAgICAgICAgIHRoaXMuX3JlcG9zaXRvcnlTdWJzY3JpcHRpb25zLmFkZChyZXBvc2l0b3J5Lm9uRGlkQ2hhbmdlU3RhdHVzZXMoKCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLmZvcmNlVXBkYXRlKCk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBpZiAocmVwb3NpdG9yeS5nZXRTdGF0dXNlcykge1xuICAgICAgICAgICAgICAvLyBUaGlzIG1ldGhvZCBpcyBhdmFpbGFibGUgb24gSGdSZXBvc2l0b3J5Q2xpZW50LlxuICAgICAgICAgICAgICAvLyBUaGlzIHdpbGwgdHJpZ2dlciBhIHJlcG9zaXRvcnkgOjpvbkRpZENoYW5nZVN0YXR1c2VzIGV2ZW50IGlmIHRoZXJlXG4gICAgICAgICAgICAgIC8vIGFyZSBtb2RpZmllZCBmaWxlcywgYW5kIHRodXMgdXBkYXRlIHRoZSB0cmVlIHRvIHJlZmxlY3QgdGhlXG4gICAgICAgICAgICAgIC8vIGN1cnJlbnQgdmVyc2lvbiBjb250cm9sIFwic3RhdGVcIiBvZiB0aGUgZmlsZXMuXG4gICAgICAgICAgICAgIHJlcG9zaXRvcnkuZ2V0U3RhdHVzZXMoW3JlcG9zaXRvcnkuZ2V0UHJvamVjdERpcmVjdG9yeSgpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcbiAgICAgIH1cbiAgICB9KSk7XG5cbiAgICB0aGlzLmFkZENvbnRleHRNZW51SXRlbUdyb3VwKFtcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6ICdOZXcnLFxuICAgICAgICBzdWJtZW51OiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6ICdGaWxlJyxcbiAgICAgICAgICAgIGNvbW1hbmQ6ICdudWNsaWRlLWZpbGUtdHJlZTphZGQtZmlsZScsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBsYWJlbDogJ0ZvbGRlcicsXG4gICAgICAgICAgICBjb21tYW5kOiAnbnVjbGlkZS1maWxlLXRyZWU6YWRkLWZvbGRlcicsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgLy8gU2hvdyAnTmV3JyBtZW51IG9ubHkgd2hlbiBhIHNpbmdsZSBkaXJlY3RvcnkgaXMgc2VsZWN0ZWQgc28gdGhlXG4gICAgICAgIC8vIHRhcmdldCBpcyBvYnZpb3VzIGFuZCBjYW4gaGFuZGxlIGEgXCJuZXdcIiBvYmplY3QuXG4gICAgICAgIHNob3VsZERpc3BsYXlGb3JTZWxlY3RlZE5vZGVzKG5vZGVzKSB7XG4gICAgICAgICAgcmV0dXJuIG5vZGVzLmxlbmd0aCA9PT0gMSAmJlxuICAgICAgICAgICAgbm9kZXMuZXZlcnkobm9kZSA9PiBub2RlLmlzQ29udGFpbmVyKCkpO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICBdKTtcbiAgICB0aGlzLmFkZENvbnRleHRNZW51SXRlbUdyb3VwKFtcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6ICdBZGQgUHJvamVjdCBGb2xkZXInLFxuICAgICAgICBjb21tYW5kOiAnYXBwbGljYXRpb246YWRkLXByb2plY3QtZm9sZGVyJyxcbiAgICAgICAgc2hvdWxkRGlzcGxheUlmVHJlZUlzRW1wdHk6IHRydWUsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBsYWJlbDogJ0FkZCBSZW1vdGUgUHJvamVjdCBGb2xkZXInLFxuICAgICAgICBjb21tYW5kOiAnbnVjbGlkZS1yZW1vdGUtcHJvamVjdHM6Y29ubmVjdCcsXG4gICAgICAgIHNob3VsZERpc3BsYXlJZlRyZWVJc0VtcHR5OiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6ICdSZW1vdmUgUHJvamVjdCBGb2xkZXInLFxuICAgICAgICBjb21tYW5kOiAnbnVjbGlkZS1maWxlLXRyZWU6cmVtb3ZlLXByb2plY3QtZm9sZGVyLXNlbGVjdGlvbicsXG4gICAgICAgIHNob3VsZERpc3BsYXlGb3JTZWxlY3RlZE5vZGVzKG5vZGVzKSB7XG4gICAgICAgICAgcmV0dXJuIG5vZGVzLmxlbmd0aCA+IDAgJiYgbm9kZXMuZXZlcnkobm9kZSA9PiBub2RlLmlzUm9vdCgpKTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXSk7XG4gICAgdGhpcy5hZGRDb250ZXh0TWVudUl0ZW1Hcm91cChbXG4gICAgICB7XG4gICAgICAgIGxhYmVsOiAnUmVuYW1lJyxcbiAgICAgICAgY29tbWFuZDogJ251Y2xpZGUtZmlsZS10cmVlOnJlbmFtZS1zZWxlY3Rpb24nLFxuICAgICAgICBzaG91bGREaXNwbGF5Rm9yU2VsZWN0ZWROb2Rlcyhub2Rlcykge1xuICAgICAgICAgIHJldHVybiBub2Rlcy5sZW5ndGggPT09IDEgJiYgIW5vZGVzLnNvbWUobm9kZSA9PiBub2RlLmlzUm9vdCgpKTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGxhYmVsOiAnRGVsZXRlJyxcbiAgICAgICAgY29tbWFuZDogJ251Y2xpZGUtZmlsZS10cmVlOmRlbGV0ZS1zZWxlY3Rpb24nLFxuICAgICAgICBzaG91bGREaXNwbGF5Rm9yU2VsZWN0ZWROb2Rlcyhub2Rlcykge1xuICAgICAgICAgIHJldHVybiBub2Rlcy5sZW5ndGggPiAwICYmICFub2Rlcy5zb21lKG5vZGUgPT4gbm9kZS5pc1Jvb3QoKSk7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIF0pO1xuICAgIHRoaXMuYWRkQ29udGV4dE1lbnVJdGVtR3JvdXAoW1xuICAgICAge1xuICAgICAgICBsYWJlbDogJ0NvcHkgRnVsbCBQYXRoJyxcbiAgICAgICAgY29tbWFuZDogJ251Y2xpZGUtZmlsZS10cmVlOmNvcHktZnVsbC1wYXRoJyxcbiAgICAgICAgc2hvdWxkRGlzcGxheUZvclNlbGVjdGVkTm9kZXMobm9kZXMpIHtcbiAgICAgICAgICByZXR1cm4gbm9kZXMubGVuZ3RoID09PSAxO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6ICdTaG93IGluIEZpbmRlcicsXG4gICAgICAgIGNvbW1hbmQ6ICdudWNsaWRlLWZpbGUtdHJlZTpzaG93LWluLWZpbGUtbWFuYWdlcicsXG4gICAgICAgIHNob3VsZERpc3BsYXlGb3JTZWxlY3RlZE5vZGVzKG5vZGVzKSB7XG4gICAgICAgICAgLy8gRm9yIG5vdywgdGhpcyBvbmx5IHdvcmtzIGZvciBsb2NhbCBmaWxlcyBvbiBPUyBYLlxuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICBub2Rlcy5sZW5ndGggPT09IDEgJiZcbiAgICAgICAgICAgIGlzTG9jYWxGaWxlKG5vZGVzWzBdLmdldEl0ZW0oKSkgJiZcbiAgICAgICAgICAgIHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nXG4gICAgICAgICAgKTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXSk7XG4gICAgdGhpcy5hZGRDb250ZXh0TWVudUl0ZW1Hcm91cChbXG4gICAgICB7XG4gICAgICAgIGxhYmVsOiAnUmVsb2FkJyxcbiAgICAgICAgY29tbWFuZDogJ251Y2xpZGUtZmlsZS10cmVlOnJlbG9hZCcsXG4gICAgICB9LFxuICAgIF0pO1xuICB9XG5cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLl9wYW5lbENvbnRyb2xsZXIuZGVzdHJveSgpO1xuICAgIHRoaXMuX3BhbmVsQ29udHJvbGxlciA9IG51bGw7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5kaXNwb3NlKCk7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucyA9IG51bGw7XG4gICAgaWYgKHRoaXMuX3JlcG9zaXRvcnlTdWJzY3JpcHRpb25zKSB7XG4gICAgICB0aGlzLl9yZXBvc2l0b3J5U3Vic2NyaXB0aW9ucy5kaXNwb3NlKCk7XG4gICAgICB0aGlzLl9yZXBvc2l0b3J5U3Vic2NyaXB0aW9ucyA9IG51bGw7XG4gICAgfVxuICAgIHRoaXMuX2xvZ2dlciA9IG51bGw7XG4gICAgaWYgKHRoaXMuX2hvc3RFbGVtZW50KSB7XG4gICAgICB0aGlzLl9ob3N0RWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuX2hvc3RFbGVtZW50KTtcbiAgICB9XG4gICAgdGhpcy5fY2xvc2VEaWFsb2coKTtcbiAgfVxuXG4gIHRvZ2dsZSgpOiB2b2lkIHtcbiAgICB0aGlzLl9wYW5lbENvbnRyb2xsZXIudG9nZ2xlKCk7XG4gIH1cblxuICBzZXRWaXNpYmxlKHNob3VsZEJlVmlzaWJsZTogYm9vbGVhbik6IHZvaWQge1xuICAgIHRoaXMuX3BhbmVsQ29udHJvbGxlci5zZXRWaXNpYmxlKHNob3VsZEJlVmlzaWJsZSk7XG4gIH1cblxuICBzZXJpYWxpemUoKTogRmlsZVRyZWVDb250cm9sbGVyU3RhdGUge1xuICAgIHZhciB0cmVlQ29tcG9uZW50ID0gdGhpcy5nZXRUcmVlQ29tcG9uZW50KCk7XG4gICAgdmFyIHRyZWUgPSB0cmVlQ29tcG9uZW50ID8gdHJlZUNvbXBvbmVudC5zZXJpYWxpemUoKSA6IG51bGw7XG4gICAgcmV0dXJuIHtcbiAgICAgIHBhbmVsOiB0aGlzLl9wYW5lbENvbnRyb2xsZXIuc2VyaWFsaXplKCksXG4gICAgICB0cmVlLFxuICAgIH07XG4gIH1cblxuICBmb3JjZVVwZGF0ZSgpOiB2b2lkIHtcbiAgICB2YXIgdHJlZUNvbXBvbmVudCA9IHRoaXMuZ2V0VHJlZUNvbXBvbmVudCgpO1xuICAgIGlmICh0cmVlQ29tcG9uZW50KSB7XG4gICAgICB0cmVlQ29tcG9uZW50LmZvcmNlVXBkYXRlKCk7XG4gICAgfVxuICB9XG5cbiAgYWRkQ29udGV4dE1lbnVJdGVtR3JvdXAoXG4gICAgbWVudUl0ZW1EZWZpbml0aW9uczogQXJyYXk8VHJlZU1lbnVJdGVtRGVmaW5pdGlvbj5cbiAgKTogdm9pZCB7XG4gICAgdmFyIHRyZWVDb21wb25lbnQgPSB0aGlzLmdldFRyZWVDb21wb25lbnQoKTtcbiAgICBpZiAodHJlZUNvbXBvbmVudCkge1xuICAgICAgdHJlZUNvbXBvbmVudC5hZGRDb250ZXh0TWVudUl0ZW1Hcm91cChtZW51SXRlbURlZmluaXRpb25zKTtcbiAgICB9XG4gIH1cblxuICBnZXRUcmVlQ29tcG9uZW50KCk6ID9UcmVlUm9vdENvbXBvbmVudCB7XG4gICAgdmFyIGNvbXBvbmVudCA9IHRoaXMuX3BhbmVsQ29udHJvbGxlci5nZXRDaGlsZENvbXBvbmVudCgpO1xuICAgIGlmIChjb21wb25lbnQgJiYgY29tcG9uZW50Lmhhc093blByb3BlcnR5KCdnZXRUcmVlUm9vdCcpKSB7XG4gICAgICByZXR1cm4gY29tcG9uZW50LmdldFRyZWVSb290KCk7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGNhY2hlZCBub2RlIGZvciBgZW50cnlgIG9yIGNyZWF0ZXMgYSBuZXcgb25lLiBJdCBzZXRzIHRoZSBhcHByb3ByaWF0ZSBib29ra2VlcGluZ1xuICAgKiBzdGF0ZSBpZiBpdCBjcmVhdGVzIGEgbmV3IG5vZGUuXG4gICAqL1xuICBnZXROb2RlQW5kU2V0U3RhdGUoXG4gICAgZW50cnk6IGF0b20kRmlsZSB8IGF0b20kRGlyZWN0b3J5LFxuICAgIHBhcmVudDogP0xhenlGaWxlVHJlZU5vZGVcbiAgKTogTGF6eUZpbGVUcmVlTm9kZSB7XG4gICAgLy8gV2UgbmVlZCB0byBjcmVhdGUgYSBub2RlIHRvIGdldCB0aGUgcGF0aCwgZXZlbiBpZiB3ZSBkb24ndCBlbmQgdXAgcmV0dXJuaW5nIGl0LlxuICAgIHZhciBub2RlID0gbmV3IExhenlGaWxlVHJlZU5vZGUoZW50cnksIHBhcmVudCwgdGhpcy5fZmV0Y2hDaGlsZHJlbldpdGhDb250cm9sbGVyKTtcbiAgICB2YXIgbm9kZUtleSA9IG5vZGUuZ2V0S2V5KCk7XG5cbiAgICAvLyBSZXVzZSBleGlzdGluZyBub2RlIGlmIHBvc3NpYmxlLiBUaGlzIHByZXNlcnZlcyB0aGUgY2FjaGVkIGNoaWxkcmVuIGFuZCBwcmV2ZW50c1xuICAgIC8vIHVzIGZyb20gY3JlYXRpbmcgbXVsdGlwbGUgZmlsZSB3YXRjaGVycyBvbiB0aGUgc2FtZSBmaWxlLlxuICAgIHZhciBzdGF0ZSA9IHRoaXMuZ2V0U3RhdGVGb3JOb2RlS2V5KG5vZGVLZXkpO1xuICAgIGlmIChzdGF0ZSkge1xuICAgICAgcmV0dXJuIHN0YXRlLm5vZGU7XG4gICAgfVxuXG4gICAgdmFyIHN1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgaWYgKGVudHJ5LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIHRoaXMgY2FsbCBmYWlscyBiZWNhdXNlIGl0IGNvdWxkIHRyeSB0byB3YXRjaCBhIG5vbi1leGlzdGluZyBkaXJlY3RvcnksXG4gICAgICAgIC8vIG9yIHdpdGggYSB1c2UgdGhhdCBoYXMgbm8gcGVybWlzc2lvbiB0byBpdC5cbiAgICAgICAgc3Vic2NyaXB0aW9uID0gZW50cnkub25EaWRDaGFuZ2UoKCkgPT4ge1xuICAgICAgICAgIG5vZGUuaW52YWxpZGF0ZUNhY2hlKCk7XG4gICAgICAgICAgdGhpcy5mb3JjZVVwZGF0ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICB0aGlzLl9sb2dFcnJvcignbnVjbGlkZS1maWxlLXRyZWU6IENhbm5vdCBzdWJzY3JpYmUgdG8gYSBkaXJlY3RvcnkuJywgZW50cnkuZ2V0UGF0aCgpLCBlcnIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX3NldFN0YXRlRm9yTm9kZUtleShub2RlS2V5LCB7bm9kZSwgc3Vic2NyaXB0aW9ufSk7XG5cbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuXG4gIF9zZXRTdGF0ZUZvck5vZGVLZXkobm9kZUtleTogc3RyaW5nLCBzdGF0ZTogTm9kZVN0YXRlKTogdm9pZCB7XG4gICAgdGhpcy5fZGVzdHJveVN0YXRlRm9yTm9kZUtleShub2RlS2V5KTtcbiAgICB0aGlzLl9rZXlUb1N0YXRlLnNldChub2RlS2V5LCBzdGF0ZSk7XG4gIH1cblxuICBnZXRTdGF0ZUZvck5vZGVLZXkobm9kZUtleTogc3RyaW5nKTogP05vZGVTdGF0ZSB7XG4gICAgcmV0dXJuIHRoaXMuX2tleVRvU3RhdGUuZ2V0KG5vZGVLZXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHN0YXRlcyBmb3Igbm9kZXMgdGhhdCBhcmUgaW4gYG9sZE5vZGVzYCBhbmQgbm90IGluIGBuZXdOb2Rlc2AuXG4gICAqIFRoaXMgaXMgdXNlZnVsIHdoZW4gZmV0Y2hpbmcgbmV3IGNoaWxkcmVuIC0tIHNvbWUgY2FjaGVkIG5vZGVzIGNhbiBzdGlsbFxuICAgKiBiZSByZXVzZWQgYW5kIHRoZSByZXN0IG11c3QgYmUgZGVzdHJveWVkLlxuICAgKi9cbiAgZGVzdHJveVN0YXRlRm9yT2xkTm9kZXMob2xkTm9kZXM6IEFycmF5PExhenlGaWxlVHJlZU5vZGU+LCBuZXdOb2RlczogQXJyYXk8TGF6eUZpbGVUcmVlTm9kZT4pOiB2b2lkIHtcbiAgICB2YXIgbmV3Tm9kZXNTZXQgPSBuZXcgU2V0KG5ld05vZGVzKTtcbiAgICBvbGROb2Rlcy5mb3JFYWNoKChvbGROb2RlKSA9PiB7XG4gICAgICBpZiAoIW5ld05vZGVzU2V0LmhhcyhvbGROb2RlKSkge1xuICAgICAgICB0aGlzLl9kZXN0cm95U3RhdGVGb3JOb2RlS2V5KG9sZE5vZGUuZ2V0S2V5KCkpO1xuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICBfZGVzdHJveVN0YXRlRm9yTm9kZUtleShub2RlS2V5OiBzdHJpbmcpOiB2b2lkIHtcbiAgICB2YXIgc3RhdGUgPSB0aGlzLmdldFN0YXRlRm9yTm9kZUtleShub2RlS2V5KTtcbiAgICBpZiAoc3RhdGUpIHtcbiAgICAgIHZhciB7bm9kZX0gPSBzdGF0ZTtcbiAgICAgIHRyZWVOb2RlVHJhdmVyc2Fscy5mb3JFYWNoQ2FjaGVkTm9kZShub2RlLCAoY2FjaGVkTm9kZSkgPT4ge1xuICAgICAgICB2YXIgY2FjaGVkTm9kZUtleSA9IGNhY2hlZE5vZGUuZ2V0S2V5KCk7XG4gICAgICAgIHZhciBjYWNoZWRTdGF0ZSA9IHRoaXMuZ2V0U3RhdGVGb3JOb2RlS2V5KGNhY2hlZE5vZGVLZXkpO1xuICAgICAgICBpZiAoY2FjaGVkU3RhdGUpIHtcbiAgICAgICAgICBpZiAoY2FjaGVkU3RhdGUuc3Vic2NyaXB0aW9uKSB7XG4gICAgICAgICAgICBjYWNoZWRTdGF0ZS5zdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLl9rZXlUb1N0YXRlLmRlbGV0ZShjYWNoZWROb2RlS2V5KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHZhciB0cmVlQ29tcG9uZW50ID0gdGhpcy5nZXRUcmVlQ29tcG9uZW50KCk7XG4gICAgICBpZiAodHJlZUNvbXBvbmVudCkge1xuICAgICAgICB0cmVlQ29tcG9uZW50LnJlbW92ZVN0YXRlRm9yU3VidHJlZShub2RlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBvbkNvbmZpcm1TZWxlY3Rpb24obm9kZTogTGF6eUZpbGVUcmVlTm9kZSk6IHZvaWQge1xuICAgIHZhciBlbnRyeSA9IG5vZGUuZ2V0SXRlbSgpO1xuICAgIGF0b20ud29ya3NwYWNlLm9wZW4oZW50cnkuZ2V0UGF0aCgpLCB7XG4gICAgICBhY3RpdmF0ZVBhbmU6ICFhdG9tLmNvbmZpZy5nZXQoJ3RhYnMudXNlUHJldmlld1RhYnMnKSxcbiAgICAgIHNlYXJjaEFsbFBhbmVzOiB0cnVlLFxuICAgIH0pO1xuICB9XG5cbiAgb25LZWVwU2VsZWN0aW9uKCk6IHZvaWQge1xuICAgIGlmICghYXRvbS5jb25maWcuZ2V0KCd0YWJzLnVzZVByZXZpZXdUYWJzJykpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgYWN0aXZlUGFuZUl0ZW0gPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lSXRlbSgpO1xuICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGFjdGl2ZVBhbmVJdGVtKSwgJ3RhYnM6a2VlcC1wcmV2aWV3LXRhYicpO1xuXG4gICAgLy8gXCJBY3RpdmF0ZVwiIHRoZSBhbHJlYWR5LWFjdGl2ZSBwYW5lIHRvIGdpdmUgaXQgZm9jdXMuXG4gICAgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZSgpLmFjdGl2YXRlKCk7XG4gIH1cblxuICByZW1vdmVSb290Rm9sZGVyU2VsZWN0aW9uKCk6IHZvaWQge1xuICAgIHZhciBzZWxlY3RlZEl0ZW1zID0gdGhpcy5fZ2V0U2VsZWN0ZWRJdGVtcygpO1xuICAgIHZhciBzZWxlY3RlZEZpbGVQYXRocyA9IHNlbGVjdGVkSXRlbXMubWFwKChpdGVtKSA9PiBpdGVtLmdldFBhdGgoKSk7XG4gICAgdmFyIHJvb3RQYXRoc1NldCA9IG5ldyBTZXQoYXRvbS5wcm9qZWN0LmdldFBhdGhzKCkpO1xuICAgIHNlbGVjdGVkRmlsZVBhdGhzLmZvckVhY2goKHNlbGVjdGVkRmlsZVBhdGgpID0+IHtcbiAgICAgIGlmIChyb290UGF0aHNTZXQuaGFzKHNlbGVjdGVkRmlsZVBhdGgpKSB7XG4gICAgICAgIGF0b20ucHJvamVjdC5yZW1vdmVQYXRoKHNlbGVjdGVkRmlsZVBhdGgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgY29weUZ1bGxQYXRoKCk6IHZvaWQge1xuICAgIHZhciBzZWxlY3RlZEl0ZW1zID0gdGhpcy5fZ2V0U2VsZWN0ZWRJdGVtcygpO1xuICAgIGlmIChzZWxlY3RlZEl0ZW1zLmxlbmd0aCAhPT0gMSkge1xuICAgICAgdGhpcy5fbG9nRXJyb3IoJ251Y2xpZGUtZmlsZS10cmVlOiBFeGFjdGx5IDEgaXRlbSBzaG91bGQgYmUgc2VsZWN0ZWQnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgc2VsZWN0ZWRJdGVtID0gc2VsZWN0ZWRJdGVtc1swXTtcbiAgICAvLyBGb3IgcmVtb3RlIGZpbGVzIHdlIHdhbnQgdG8gY29weSB0aGUgbG9jYWwgcGF0aCBpbnN0ZWFkIG9mIGZ1bGwgcGF0aC5cbiAgICAvLyBpLmUsIFwiL2hvbWUvZGlyL2ZpbGVcIiB2cyBcIm51Y2xpZGU6L2hvc3Q6cG9ydC9ob21lL2Rpci9maWxlXCJcbiAgICBhdG9tLmNsaXBib2FyZC53cml0ZShcbiAgICAgIGlzTG9jYWxGaWxlKHNlbGVjdGVkSXRlbSlcbiAgICAgICAgPyBzZWxlY3RlZEl0ZW0uZ2V0UGF0aCgpXG4gICAgICAgIDogc2VsZWN0ZWRJdGVtLmdldExvY2FsUGF0aCgpXG4gICAgKTtcbiAgfVxuXG4gIHNob3dJbkZpbGVNYW5hZ2VyKCk6IHZvaWQge1xuICAgIHZhciBzZWxlY3RlZEl0ZW1zID0gdGhpcy5fZ2V0U2VsZWN0ZWRJdGVtcygpO1xuICAgIGlmIChzZWxlY3RlZEl0ZW1zLmxlbmd0aCAhPT0gMSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgZmlsZVBhdGggPSBzZWxlY3RlZEl0ZW1zWzBdLmdldFBhdGgoKTtcblxuICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnZGFyd2luJykge1xuICAgICAgdmFyIHthc3luY0V4ZWN1dGV9ID0gcmVxdWlyZSgnbnVjbGlkZS1jb21tb25zJyk7XG4gICAgICBhc3luY0V4ZWN1dGUoJ29wZW4nLCBbJy1SJywgZmlsZVBhdGhdLCAvKiBvcHRpb25zICovIHt9KTtcbiAgICB9XG4gIH1cblxuICBhc3luYyByZXZlYWxBY3RpdmVGaWxlKCk6IHZvaWQge1xuICAgIHZhciBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XG4gICAgaWYgKCFlZGl0b3IpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgdHJlZUNvbXBvbmVudCA9IHRoaXMuZ2V0VHJlZUNvbXBvbmVudCgpO1xuICAgIGlmICh0cmVlQ29tcG9uZW50KSB7XG4gICAgICB2YXIge2ZpbGV9ID0gZWRpdG9yLmdldEJ1ZmZlcigpO1xuICAgICAgaWYgKGZpbGUpIHtcbiAgICAgICAgdmFyIHtmaW5kfSA9IHJlcXVpcmUoJ251Y2xpZGUtY29tbW9ucycpLmFycmF5O1xuICAgICAgICB2YXIgZmlsZVBhdGggPSBmaWxlLmdldFBhdGgoKTtcbiAgICAgICAgdmFyIHJvb3REaXJlY3RvcnkgPSBmaW5kKGF0b20ucHJvamVjdC5nZXREaXJlY3RvcmllcygpLCBkaXJlY3RvcnkgPT4gZGlyZWN0b3J5LmNvbnRhaW5zKGZpbGVQYXRoKSk7XG4gICAgICAgIGlmIChyb290RGlyZWN0b3J5KSB7XG4gICAgICAgICAgLy8gQWNjdW11bGF0ZSBhbGwgdGhlIGFuY2VzdG9yIGtleXMgZnJvbSB0aGUgZmlsZSB1cCB0byB0aGUgcm9vdC5cbiAgICAgICAgICB2YXIgZGlyZWN0b3J5ID0gZmlsZS5nZXRQYXJlbnQoKTtcbiAgICAgICAgICB2YXIgYW5jZXN0b3JLZXlzID0gW107XG4gICAgICAgICAgd2hpbGUgKHJvb3REaXJlY3RvcnkuZ2V0UGF0aCgpICE9PSBkaXJlY3RvcnkuZ2V0UGF0aCgpKSB7XG4gICAgICAgICAgICBhbmNlc3RvcktleXMucHVzaChuZXcgTGF6eUZpbGVUcmVlTm9kZShkaXJlY3RvcnkpLmdldEtleSgpKTtcbiAgICAgICAgICAgIGRpcmVjdG9yeSA9IGRpcmVjdG9yeS5nZXRQYXJlbnQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYW5jZXN0b3JLZXlzLnB1c2gobmV3IExhenlGaWxlVHJlZU5vZGUocm9vdERpcmVjdG9yeSkuZ2V0S2V5KCkpO1xuXG4gICAgICAgICAgLy8gRXhwYW5kIGVhY2ggbm9kZSBmcm9tIHRoZSByb290IGRvd24gdG8gdGhlIGZpbGUuXG4gICAgICAgICAgZm9yICh2YXIgbm9kZUtleSBvZiBhbmNlc3RvcktleXMucmV2ZXJzZSgpKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAvLyBTZWxlY3QgdGhlIG5vZGUgdG8gZW5zdXJlIGl0J3MgdmlzaWJsZS5cbiAgICAgICAgICAgICAgYXdhaXQgdHJlZUNvbXBvbmVudC5zZWxlY3ROb2RlS2V5KG5vZGVLZXkpO1xuICAgICAgICAgICAgICBhd2FpdCB0cmVlQ29tcG9uZW50LmV4cGFuZE5vZGVLZXkobm9kZUtleSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAvLyBJZiB0aGUgbm9kZSBpc24ndCBpbiB0aGUgdHJlZSwgaXRzIGRlc2NlbmRhbnRzIGFyZW4ndCBlaXRoZXIuXG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdHJlZUNvbXBvbmVudC5zZWxlY3ROb2RlS2V5KG5ldyBMYXp5RmlsZVRyZWVOb2RlKGZpbGUpLmdldEtleSgpKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgLy8gSXQncyBvayBpZiB0aGUgbm9kZSBpc24ndCBpbiB0aGUgdHJlZSwgc28gd2UgY2FuIGlnbm9yZSB0aGUgZXJyb3IuXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuc2V0VmlzaWJsZSh0cnVlKTtcbiAgfVxuXG4gIGRlbGV0ZVNlbGVjdGlvbigpIHtcbiAgICB2YXIgdHJlZUNvbXBvbmVudCA9IHRoaXMuZ2V0VHJlZUNvbXBvbmVudCgpO1xuICAgIGlmICghdHJlZUNvbXBvbmVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBzZWxlY3RlZE5vZGVzID0gdHJlZUNvbXBvbmVudC5nZXRTZWxlY3RlZE5vZGVzKCk7XG4gICAgaWYgKHNlbGVjdGVkTm9kZXMubGVuZ3RoID09PSAwIHx8IHNlbGVjdGVkTm9kZXMuc29tZShub2RlID0+IG5vZGUuaXNSb290KCkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBzZWxlY3RlZEl0ZW1zID0gc2VsZWN0ZWROb2Rlcy5tYXAobm9kZSA9PiBub2RlLmdldEl0ZW0oKSk7XG5cbiAgICB2YXIgc2VsZWN0ZWRQYXRocyA9IHNlbGVjdGVkSXRlbXMubWFwKGVudHJ5ID0+IGVudHJ5LmdldFBhdGgoKSk7XG4gICAgdmFyIG1lc3NhZ2UgPSAnQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIGRlbGV0ZSB0aGUgc2VsZWN0ZWQgJyArXG4gICAgICAgIChzZWxlY3RlZEl0ZW1zLmxlbmd0aCA+IDEgPyAnaXRlbXMnIDogJ2l0ZW0nKTtcbiAgICBhdG9tLmNvbmZpcm0oe1xuICAgICAgbWVzc2FnZSxcbiAgICAgIGRldGFpbGVkTWVzc2FnZTogJ1lvdSBhcmUgZGVsZXRpbmc6XFxuJyArIHNlbGVjdGVkUGF0aHMuam9pbignXFxuJyksXG4gICAgICBidXR0b25zOiB7XG4gICAgICAgICdEZWxldGUnOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgdmFyIGRlbGV0ZVByb21pc2VzID0gW107XG4gICAgICAgICAgc2VsZWN0ZWRJdGVtcy5mb3JFYWNoKChlbnRyeSwgaSkgPT4ge1xuICAgICAgICAgICAgdmFyIGVudHJ5UGF0aCA9IHNlbGVjdGVkUGF0aHNbaV07XG4gICAgICAgICAgICBpZiAoZW50cnlQYXRoLnN0YXJ0c1dpdGgoJ251Y2xpZGU6LycpKSB7XG4gICAgICAgICAgICAgIGRlbGV0ZVByb21pc2VzLnB1c2goZW50cnkuZGVsZXRlKCkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgLy8gVE9ETyhqamlhYSk6IFRoaXMgc3BlY2lhbC1jYXNlIGNhbiBiZSBlbGltaW5hdGVkIG9uY2UgYGRlbGV0ZSgpYFxuICAgICAgICAgICAgICAvLyBpcyBhZGRlZCB0byBgRGlyZWN0b3J5YCBhbmQgYEZpbGVgLlxuICAgICAgICAgICAgICBzaGVsbC5tb3ZlSXRlbVRvVHJhc2goZW50cnlQYXRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGF3YWl0IFByb21pc2UuYWxsKGRlbGV0ZVByb21pc2VzKTtcbiAgICAgICAgICB2YXIgcGFyZW50RGlyZWN0b3JpZXMgPSBuZXcgU2V0KHNlbGVjdGVkSXRlbXMubWFwKChlbnRyeSkgPT4gZW50cnkuZ2V0UGFyZW50KCkpKTtcbiAgICAgICAgICBwYXJlbnREaXJlY3Rvcmllcy5mb3JFYWNoKChkaXJlY3RvcnkpID0+IHRoaXMuX3JlbG9hZERpcmVjdG9yeShkaXJlY3RvcnkpKTtcbiAgICAgICAgfSxcbiAgICAgICAgJ0NhbmNlbCc6IG51bGwsXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgcmVsb2FkKCkge1xuICAgIHZhciB0cmVlQ29tcG9uZW50ID0gdGhpcy5nZXRUcmVlQ29tcG9uZW50KCk7XG4gICAgaWYgKCF0cmVlQ29tcG9uZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRyZWVDb21wb25lbnQuaW52YWxpZGF0ZUNhY2hlZE5vZGVzKCk7XG4gICAgdHJlZUNvbXBvbmVudC5mb3JjZVVwZGF0ZSgpO1xuICB9XG5cbiAgX2dldFNlbGVjdGVkSXRlbXMoKTogQXJyYXk8TGF6eUZpbGVUcmVlTm9kZT4ge1xuICAgIHZhciB0cmVlQ29tcG9uZW50ID0gdGhpcy5nZXRUcmVlQ29tcG9uZW50KCk7XG4gICAgaWYgKCF0cmVlQ29tcG9uZW50KSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgdmFyIHNlbGVjdGVkTm9kZXMgPSB0cmVlQ29tcG9uZW50LmdldFNlbGVjdGVkTm9kZXMoKTtcbiAgICByZXR1cm4gc2VsZWN0ZWROb2Rlcy5tYXAoKG5vZGUpID0+IG5vZGUuZ2V0SXRlbSgpKTtcbiAgfVxuXG4gIG9wZW5BZGRGaWxlRGlhbG9nKCk6IHZvaWQge1xuICAgIHRoaXMuX29wZW5BZGREaWFsb2coJ2ZpbGUnLCBhc3luYyAocm9vdERpcmVjdG9yeTogRGlyZWN0b3J5LCBmaWxlUGF0aDogc3RyaW5nKSA9PiB7XG4gICAgICAvLyBOb3RlOiB0aGlzIHdpbGwgdGhyb3cgaWYgdGhlIHJlc3VsdGluZyBwYXRoIG1hdGNoZXMgdGhhdCBvZiBhbiBleGlzdGluZ1xuICAgICAgLy8gbG9jYWwgZGlyZWN0b3J5LlxuICAgICAgdmFyIG5ld0ZpbGUgPSByb290RGlyZWN0b3J5LmdldEZpbGUoZmlsZVBhdGgpO1xuICAgICAgYXdhaXQgbmV3RmlsZS5jcmVhdGUoKTtcbiAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4obmV3RmlsZS5nZXRQYXRoKCkpO1xuICAgICAgdGhpcy5fcmVsb2FkRGlyZWN0b3J5KG5ld0ZpbGUuZ2V0UGFyZW50KCkpO1xuICAgIH0pO1xuICB9XG5cbiAgb3BlbkFkZEZvbGRlckRpYWxvZygpOiB2b2lkIHtcbiAgICB0aGlzLl9vcGVuQWRkRGlhbG9nKCdmb2xkZXInLCBhc3luYyAocm9vdERpcmVjdG9yeTogRGlyZWN0b3J5LCBkaXJlY3RvcnlQYXRoOiBzdHJpbmcpID0+IHtcbiAgICAgIHZhciBuZXdEaXJlY3RvcnkgPSByb290RGlyZWN0b3J5LmdldFN1YmRpcmVjdG9yeShkaXJlY3RvcnlQYXRoKTtcbiAgICAgIGF3YWl0IG5ld0RpcmVjdG9yeS5jcmVhdGUoKTtcbiAgICAgIHRoaXMuX3JlbG9hZERpcmVjdG9yeShuZXdEaXJlY3RvcnkuZ2V0UGFyZW50KCkpO1xuICAgIH0pO1xuICB9XG5cbiAgX3JlbG9hZERpcmVjdG9yeShkaXJlY3Rvcnk6IERpcmVjdG9yeSk6IHZvaWQge1xuICAgIHZhciBkaXJlY3RvcnlOb2RlID0gdGhpcy5nZXRUcmVlQ29tcG9uZW50KCkuZ2V0Tm9kZUZvcktleShuZXcgTGF6eUZpbGVUcmVlTm9kZShkaXJlY3RvcnkpLmdldEtleSgpKTtcbiAgICBkaXJlY3RvcnlOb2RlLmludmFsaWRhdGVDYWNoZSgpO1xuICAgIHRoaXMuZm9yY2VVcGRhdGUoKTtcbiAgfVxuXG4gIF9vcGVuQWRkRGlhbG9nKFxuICAgICAgZW50cnlUeXBlOiBzdHJpbmcsXG4gICAgICBvbkNvbmZpcm06IChyb290RGlyZWN0b3J5OiBEaXJlY3RvcnksIGZpbGVQYXRoOiBzdHJpbmcpID0+IHZvaWQpIHtcbiAgICB2YXIgc2VsZWN0aW9uID0gdGhpcy5fZ2V0U2VsZWN0ZWRFbnRyeUFuZERpcmVjdG9yeUFuZFJvb3QoKTtcbiAgICBpZiAoIXNlbGVjdGlvbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgbWVzc2FnZSA9IChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXY+RW50ZXIgdGhlIHBhdGggZm9yIHRoZSBuZXcge2VudHJ5VHlwZX0gaW4gdGhlIHJvb3Q6PC9kaXY+XG4gICAgICAgIDxkaXY+e3BhdGgubm9ybWFsaXplKHNlbGVjdGlvbi5yb290LmdldFBhdGgoKSArICcvJyl9PC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuXG4gICAgdmFyIEZpbGVEaWFsb2dDb21wb25lbnQgPSByZXF1aXJlKCcuL0ZpbGVEaWFsb2dDb21wb25lbnQnKTtcbiAgICB2YXIgcHJvcHMgPSB7XG4gICAgICByb290RGlyZWN0b3J5OiBzZWxlY3Rpb24ucm9vdCxcbiAgICAgIGluaXRpYWxFbnRyeTogc2VsZWN0aW9uLmRpcmVjdG9yeSxcbiAgICAgIGluaXRpYWxEaXJlY3RvcnlQYXRoOiBzZWxlY3Rpb24uZW50cnkuZ2V0UGF0aCgpLFxuICAgICAgbWVzc2FnZSxcbiAgICAgIG9uQ29uZmlybSxcbiAgICAgIG9uQ2xvc2U6IHRoaXMuX2Nsb3NlRGlhbG9nLmJpbmQodGhpcyksXG4gICAgfTtcbiAgICB0aGlzLl9vcGVuRGlhbG9nKDxGaWxlRGlhbG9nQ29tcG9uZW50IHsuLi5wcm9wc30gLz4pO1xuICB9XG5cbiAgb3BlblJlbmFtZURpYWxvZygpOiB2b2lkIHtcbiAgICB2YXIgc2VsZWN0aW9uID0gdGhpcy5fZ2V0U2VsZWN0ZWRFbnRyeUFuZERpcmVjdG9yeUFuZFJvb3QoKTtcbiAgICBpZiAoIXNlbGVjdGlvbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBlbnRyeVR5cGUgPSBzZWxlY3Rpb24uZW50cnkuaXNGaWxlKCkgPyAnZmlsZScgOiAnZm9sZGVyJztcbiAgICB2YXIgbWVzc2FnZSA9IChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXY+RW50ZXIgdGhlIG5ldyBwYXRoIGZvciB0aGUge2VudHJ5VHlwZX0gaW4gdGhlIHJvb3Q6PC9kaXY+XG4gICAgICAgIDxkaXY+e3BhdGgubm9ybWFsaXplKHNlbGVjdGlvbi5yb290LmdldFBhdGgoKSArICcvJyl9PC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuXG4gICAgdmFyIHtlbnRyeSwgcm9vdH0gPSBzZWxlY3Rpb247XG5cbiAgICB2YXIgRmlsZURpYWxvZ0NvbXBvbmVudCA9IHJlcXVpcmUoJy4vRmlsZURpYWxvZ0NvbXBvbmVudCcpO1xuICAgIHZhciBwcm9wcyA9IHtcbiAgICAgIHJvb3REaXJlY3Rvcnk6IHJvb3QsXG4gICAgICBpbml0aWFsRW50cnk6IGVudHJ5LFxuICAgICAgbWVzc2FnZSxcbiAgICAgIG9uQ29uZmlybTogYXN5bmMgKHJvb3REaXJlY3RvcnksIHJlbGF0aXZlRmlsZVBhdGgpID0+IHtcbiAgICAgICAgaWYgKGlzTG9jYWxGaWxlKGVudHJ5KSkge1xuICAgICAgICAgIC8vIFRPRE8oamppYWEpOiBUaGlzIHNwZWNpYWwtY2FzZSBjYW4gYmUgZWxpbWluYXRlZCBvbmNlIGBkZWxldGUoKWBcbiAgICAgICAgICAvLyBpcyBhZGRlZCB0byBgRGlyZWN0b3J5YCBhbmQgYEZpbGVgLlxuICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGZzLm1vdmUoXG4gICAgICAgICAgICAgICAgZW50cnkuZ2V0UGF0aCgpLFxuICAgICAgICAgICAgICAgIC8vIFVzZSBgcmVzb2x2ZWAgdG8gc3RyaXAgdHJhaWxpbmcgc2xhc2hlcyBiZWNhdXNlIHJlbmFtaW5nIGFcbiAgICAgICAgICAgICAgICAvLyBmaWxlIHRvIGEgbmFtZSB3aXRoIGEgdHJhaWxpbmcgc2xhc2ggaXMgYW4gZXJyb3IuXG4gICAgICAgICAgICAgICAgcGF0aC5yZXNvbHZlKFxuICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKHJvb3REaXJlY3RvcnkuZ2V0UGF0aCgpLCByZWxhdGl2ZUZpbGVQYXRoKVxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgZXJyb3IgPT4gZXJyb3IgPyByZWplY3QoZXJyb3IpIDogcmVzb2x2ZSgpKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhd2FpdCBlbnRyeS5yZW5hbWUocGF0aC5qb2luKHJvb3REaXJlY3RvcnkuZ2V0TG9jYWxQYXRoKCksIHJlbGF0aXZlRmlsZVBhdGgpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9yZWxvYWREaXJlY3RvcnkoZW50cnkuZ2V0UGFyZW50KCkpO1xuICAgICAgfSxcbiAgICAgIG9uQ2xvc2U6ICgpID0+IHRoaXMuX2Nsb3NlRGlhbG9nKCksXG4gICAgICBzaG91bGRTZWxlY3RCYXNlbmFtZTogdHJ1ZSxcbiAgICB9O1xuICAgIHRoaXMuX29wZW5EaWFsb2coPEZpbGVEaWFsb2dDb21wb25lbnQgey4uLnByb3BzfSAvPik7XG4gIH1cblxuICBfb3BlbkRpYWxvZyhjb21wb25lbnQ6IFJlYWN0RWxlbWVudCk6IHZvaWQge1xuICAgIHRoaXMuX2Nsb3NlRGlhbG9nKCk7XG5cbiAgICB0aGlzLl9ob3N0RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHZhciB3b3Jrc3BhY2VFbCA9IGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSk7XG4gICAgd29ya3NwYWNlRWwuYXBwZW5kQ2hpbGQodGhpcy5faG9zdEVsZW1lbnQpO1xuICAgIHRoaXMuX2RpYWxvZ0NvbXBvbmVudCA9IFJlYWN0LnJlbmRlcihjb21wb25lbnQsIHRoaXMuX2hvc3RFbGVtZW50KTtcbiAgfVxuXG4gIF9jbG9zZURpYWxvZygpIHtcbiAgICBpZiAodGhpcy5fZGlhbG9nQ29tcG9uZW50ICYmIHRoaXMuX2RpYWxvZ0NvbXBvbmVudC5pc01vdW50ZWQoKSkge1xuICAgICAgUmVhY3QudW5tb3VudENvbXBvbmVudEF0Tm9kZSh0aGlzLl9ob3N0RWxlbWVudCk7XG4gICAgICB0aGlzLl9kaWFsb2dDb21wb25lbnQgPSBudWxsO1xuICAgICAgYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKS5yZW1vdmVDaGlsZCh0aGlzLl9ob3N0RWxlbWVudCk7XG4gICAgICB0aGlzLl9ob3N0RWxlbWVudCA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuICAgKiAtIGVudHJ5OiBUaGUgc2VsZWN0ZWQgZmlsZSBvciBkaXJlY3RvcnkuXG4gICAqIC0gZGlyZWN0b3J5OiBUaGUgc2VsZWN0ZWQgZGlyZWN0b3J5IG9yIGl0cyBwYXJlbnQgaWYgdGhlIHNlbGVjdGlvbiBpcyBhIGZpbGUuXG4gICAqIC0gcm9vdDogVGhlIHJvb3QgZGlyZWN0b3J5IGNvbnRhaW5pbmcgdGhlIHNlbGVjdGVkIGVudHJ5LlxuICAgKlxuICAgKiBUaGUgZW50cnkgZGVmYXVsdHMgdG8gdGhlIGZpcnN0IHJvb3QgZGlyZWN0b3J5IGlmIG5vdGhpbmcgaXMgc2VsZWN0ZWQuXG4gICAqIFJldHVybnMgbnVsbCBpZiBzb21lIG9mIHRoZSByZXR1cm5lZCBwcm9wZXJ0aWVzIGNhbid0IGJlIHBvcHVsYXRlZC5cbiAgICpcbiAgICogVGhpcyBpcyB1c2VmdWwgZm9yIHBvcHVsYXRpbmcgdGhlIGZpbGUgZGlhbG9ncy5cbiAgICovXG4gIF9nZXRTZWxlY3RlZEVudHJ5QW5kRGlyZWN0b3J5QW5kUm9vdChcbiAgKTogP3tcbiAgICBlbnRyeTogYXRvbSRGaWxlIHwgYXRvbSREaXJlY3Rvcnk7XG4gICAgZGlyZWN0b3J5OiBhdG9tJERpcmVjdG9yeTtcbiAgICByb290OiA/YXRvbSREaXJlY3RvcnlcbiAgfSB7XG4gICAgdmFyIHRyZWVDb21wb25lbnQgPSB0aGlzLmdldFRyZWVDb21wb25lbnQoKTtcbiAgICBpZiAoIXRyZWVDb21wb25lbnQpIHtcbiAgICAgIHRoaXMuX2xvZ0Vycm9yKCdudWNsaWRlLWZpbGUtdHJlZTogQ2Fubm90IGdldCB0aGUgZGlyZWN0b3J5IGZvciB0aGUgc2VsZWN0aW9uIGJlY2F1c2Ugbm8gZmlsZSB0cmVlIGV4aXN0cy4nKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHZhciBlbnRyeSA9IG51bGw7XG4gICAgdmFyIHNlbGVjdGVkTm9kZXMgPSB0cmVlQ29tcG9uZW50LmdldFNlbGVjdGVkTm9kZXMoKTtcbiAgICBpZiAoc2VsZWN0ZWROb2Rlcy5sZW5ndGggPiAwKSB7XG4gICAgICBlbnRyeSA9IHNlbGVjdGVkTm9kZXNbMF0uZ2V0SXRlbSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgcm9vdERpcmVjdG9yaWVzID0gYXRvbS5wcm9qZWN0LmdldERpcmVjdG9yaWVzKCk7XG4gICAgICBpZiAocm9vdERpcmVjdG9yaWVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZW50cnkgPSByb290RGlyZWN0b3JpZXNbMF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBXZSBzaG91bGRuJ3QgYmUgYWJsZSB0byByZWFjaCB0aGlzIGVycm9yIGJlY2F1c2UgaXQgc2hvdWxkIG9ubHkgYmVcbiAgICAgICAgLy8gYWNjZXNzaWJsZSBmcm9tIGEgY29udGV4dCBtZW51LiBJZiB0aGVyZSdzIGEgY29udGV4dCBtZW51LCB0aGVyZSBtdXN0XG4gICAgICAgIC8vIGJlIGF0IGxlYXN0IG9uZSByb290IGZvbGRlciB3aXRoIGEgZGVzY2VuZGFudCB0aGF0J3MgcmlnaHQtY2xpY2tlZC5cbiAgICAgICAgdGhpcy5fbG9nRXJyb3IoJ251Y2xpZGUtZmlsZS10cmVlOiBDb3VsZCBub3QgZmluZCBhIGRpcmVjdG9yeSB0byBhZGQgdG8uJyk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBlbnRyeSxcbiAgICAgIGRpcmVjdG9yeTogKGVudHJ5ICYmIGVudHJ5LmlzRmlsZSgpKSA/IGVudHJ5LmdldFBhcmVudCgpIDogZW50cnksXG4gICAgICByb290OiB0aGlzLl9nZXRSb290RGlyZWN0b3J5KGVudHJ5KSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHdvcmtzcGFjZSByb290IGRpcmVjdG9yeSBmb3IgdGhlIGVudHJ5LCBvciB0aGUgZW50cnkncyBwYXJlbnQuXG4gICAqL1xuICBfZ2V0Um9vdERpcmVjdG9yeShlbnRyeTogYXRvbSRGaWxlIHwgYXRvbSREaXJlY3RvcnkpOiA/YXRvbSREaXJlY3Rvcnkge1xuICAgIGlmICghZW50cnkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICB2YXIgcm9vdERpcmVjdG9yeU9mRW50cnkgPSBudWxsO1xuICAgIHZhciBlbnRyeVBhdGggPSBlbnRyeS5nZXRQYXRoKCk7XG4gICAgYXRvbS5wcm9qZWN0LmdldERpcmVjdG9yaWVzKCkuc29tZSgoZGlyZWN0b3J5KSA9PiB7XG4gICAgICAvLyBzb21lRGlyZWN0b3J5LmNvbnRhaW5zKHNvbWVEaXJlY3RvcnkuZ2V0UGF0aCgpKSByZXR1cm5zIGZhbHNlLCBzb1xuICAgICAgLy8gd2UgYWxzbyBoYXZlIHRvIGNoZWNrIGZvciB0aGUgZXF1aXZhbGVuY2Ugb2YgdGhlIHBhdGguXG4gICAgICBpZiAoZGlyZWN0b3J5LmNvbnRhaW5zKGVudHJ5UGF0aCkgfHwgZGlyZWN0b3J5LmdldFBhdGgoKSA9PT0gZW50cnlQYXRoKSB7XG4gICAgICAgIHJvb3REaXJlY3RvcnlPZkVudHJ5ID0gZGlyZWN0b3J5O1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KTtcblxuICAgIGlmICghcm9vdERpcmVjdG9yeU9mRW50cnkpIHtcbiAgICAgIHJvb3REaXJlY3RvcnlPZkVudHJ5ID0gZW50cnkuZ2V0UGFyZW50KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJvb3REaXJlY3RvcnlPZkVudHJ5O1xuICB9XG5cbiAgX2xvZ0Vycm9yKGVycm9yTWVzc2FnZTogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLl9sb2dnZXIpIHtcbiAgICAgIHRoaXMuX2xvZ2dlciA9IHJlcXVpcmUoJ251Y2xpZGUtbG9nZ2luZycpLmdldExvZ2dlcigpO1xuICAgIH1cbiAgICB0aGlzLl9sb2dnZXIuZXJyb3IoZXJyb3JNZXNzYWdlKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVUcmVlQ29udHJvbGxlcjtcbiJdfQ==