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

function _defineProperty(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); }

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtdHJlZS9saWIvRmlsZVRyZWVDb250cm9sbGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7O0lBd0JHLGFBQWEscUJBQTVCLFdBQTZCLElBQXNCLEVBQUUsVUFBOEIsRUFBNkM7QUFDOUgsTUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRTtBQUN2QixXQUFPLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7R0FDNUI7O0FBRUQsTUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQy9CLE1BQUksZ0JBQWdCLEdBQUcsTUFBTSxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUs7QUFDNUQsYUFBUyxDQUFDLFVBQVUsQ0FBQyxVQUFDLEtBQUssRUFBRSxPQUFPLEVBQUs7O0FBRXZDLFVBQUksS0FBSyxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFO0FBQ3BDLGNBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztPQUNmLE1BQU07QUFDTCxlQUFPLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQyxDQUFDO09BQ3hCO0tBQ0YsQ0FBQyxDQUFDO0dBQ0osQ0FBQyxDQUFDOztBQUVILE1BQUksU0FBUyxHQUFHLEVBQUUsQ0FBQztBQUNuQixNQUFJLGNBQWMsR0FBRyxFQUFFLENBQUM7QUFDeEIsa0JBQWdCLENBQUMsT0FBTyxDQUFDLFVBQUMsS0FBSyxFQUFLO0FBQ2xDLFFBQUksU0FBUyxHQUFHLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLGNBQWUsSUFBSSxDQUFDLENBQUM7QUFDeEUsUUFBSSxLQUFLLENBQUMsV0FBVyxFQUFFLEVBQUU7QUFDdkIsb0JBQWMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7S0FDaEMsTUFBTSxJQUFJLEtBQUssQ0FBQyxN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Q0FBQztLQUM3Qjs7O1dBRVEsbUJBQUMsWUFBb0IsRUFBUTtBQUNwQyxVQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtBQUNqQixZQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDO09BQ3ZEO0FBQ0QsVUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7S0FDbEM7OztTQTFxQkcsa0JBQWtCOzs7QUE2cUJ4QixNQUFNLENBQUMsT0FBTyxHQUFHLGtCQUFrQixDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtdHJlZS9saWIvRmlsZVRyZWVDb250cm9sbGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxudmFyIHtmaWxlVHlwZUNsYXNzfSA9IHJlcXVpcmUoJ251Y2xpZGUtYXRvbS1oZWxwZXJzJyk7XG52YXIge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGV9ID0gcmVxdWlyZSgnYXRvbScpO1xudmFyIEltbXV0YWJsZSA9IHJlcXVpcmUoJ2ltbXV0YWJsZScpO1xudmFyIExhenlGaWxlVHJlZU5vZGUgPSByZXF1aXJlKCcuL0xhenlGaWxlVHJlZU5vZGUnKTtcbnZhciB7UGFuZWxDb250cm9sbGVyfSA9IHJlcXVpcmUoJ251Y2xpZGUtcGFuZWwnKTtcbnZhciBmcyA9IHJlcXVpcmUoJ2ZzLXBsdXMnKTtcbnZhciBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xudmFyIHNoZWxsID0gcmVxdWlyZSgnc2hlbGwnKTtcbnZhciB7dHJlZU5vZGVUcmF2ZXJzYWxzLCBUcmVlUm9vdENvbXBvbmVudH0gPSByZXF1aXJlKCdudWNsaWRlLXVpLXRyZWUnKTtcbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0LWZvci1hdG9tJyk7XG5cbnZhciB7YWRkb25zfSA9IFJlYWN0O1xuXG5hc3luYyBmdW5jdGlvbiBmZXRjaENoaWxkcmVuKG5vZGU6IExhenlGaWxlVHJlZU5vZGUsIGNvbnRyb2xsZXI6IEZpbGVUcmVlQ29udHJvbGxlcik6IFByb21pc2U8SW1tdXRhYmxlLkxpc3Q8TGF6eUZpbGVUcmVlTm9kZT4+IHtcbiAgaWYgKCFub2RlLmlzQ29udGFpbmVyKCkpIHtcbiAgICByZXR1cm4gSW1tdXRhYmxlLkxpc3Qub2YoKTtcbiAgfVxuXG4gIHZhciBkaXJlY3RvcnkgPSBub2RlLmdldEl0ZW0oKTtcbiAgdmFyIGRpcmVjdG9yeUVudHJpZXMgPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgZGlyZWN0b3J5LmdldEVudHJpZXMoKGVycm9yLCBlbnRyaWVzKSA9PiB7XG4gICAgICAvLyBSZXNvbHZlIHRvIGFuIGVtcHR5IGFycmF5IGlmIHRoZSBkaXJlY3RvcnkgZGVzb24ndCBleGlzdC5cbiAgICAgIGlmIChlcnJvciAmJiBlcnJvci5jb2RlICE9PSAnRU5PRU5UJykge1xuICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzb2x2ZShlbnRyaWVzIHx8IFtdKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG5cbiAgdmFyIGZpbGVOb2RlcyA9IFtdO1xuICB2YXIgZGlyZWN0b3J5Tm9kZXMgPSBbXTtcbiAgZGlyZWN0b3J5RW50cmllcy5mb3JFYWNoKChlbnRyeSkgPT4ge1xuICAgIHZhciBjaGlsZE5vZGUgPSBjb250cm9sbGVyLmdldE5vZGVBbmRTZXRTdGF0ZShlbnRyeSwgLyogcGFyZW50ICovIG5vZGUpO1xuICAgIGlmIChlbnRyeS5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICBkaXJlY3RvcnlOb2Rlcy5wdXNoKGNoaWxkTm9kZSk7XG4gICAgfSBlbHNlIGlmIChlbnRyeS5pc0ZpbGUoKSkge1xuICAgICAgZmlsZU5vZGVzLnB1c2goY2hpbGROb2RlKTtcbiAgICB9XG4gIH0pO1xuXG4gIHZhciBuZXdDaGlsZHJlbiA9IGRpcmVjdG9yeU5vZGVzLmNvbmNhdChmaWxlTm9kZXMpO1xuXG4gIHZhciBjYWNoZWRDaGlsZHJlbiA9IG5vZGUuZ2V0Q2FjaGVkQ2hpbGRyZW4oKTtcbiAgaWYgKGNhY2hlZENoaWxkcmVuKSB7XG4gICAgY29udHJvbGxlci5kZXN0cm95U3RhdGVGb3JPbGROb2RlcyhjYWNoZWRDaGlsZHJlbiwgbmV3Q2hpbGRyZW4pO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBJbW11dGFibGUuTGlzdChuZXdDaGlsZHJlbik7XG59XG5cbmZ1bmN0aW9uIGxhYmVsQ2xhc3NOYW1lRm9yTm9kZShub2RlOiBMYXp5RmlsZVRyZWVOb2RlKSB7XG4gIHZhciBjbGFzc09iaiA9IHtcbiAgICAnaWNvbic6IHRydWUsXG4gICAgJ25hbWUnOiB0cnVlLFxuICB9O1xuXG4gIHZhciBpY29uQ2xhc3NOYW1lO1xuICBpZiAobm9kZS5pc0NvbnRhaW5lcigpKSB7XG4gICAgaWNvbkNsYXNzTmFtZSA9IG5vZGUuaXNTeW1saW5rKClcbiAgICAgID8gJ2ljb24tZmlsZS1zeW1saW5rLWRpcmVjdG9yeSdcbiAgICAgIDogJ2ljb24tZmlsZS1kaXJlY3RvcnknO1xuICB9IGVsc2UgaWYgKG5vZGUuaXNTeW1saW5rKCkpIHtcbiAgICBpY29uQ2xhc3NOYW1lID0gJ2ljb24tZmlsZS1zeW1saW5rLWZpbGUnO1xuICB9IGVsc2Uge1xuICAgIGljb25DbGFzc05hbWUgPSBmaWxlVHlwZUNsYXNzKG5vZGUuZ2V0TGFiZWwoKSk7XG4gIH1cbiAgY2xhc3NPYmpbaWNvbkNsYXNzTmFtZV0gPSB0cnVlO1xuXG4gIHJldHVybiBhZGRvbnMuY2xhc3NTZXQoY2xhc3NPYmopO1xufVxuXG5mdW5jdGlvbiByb3dDbGFzc05hbWVGb3JOb2RlKG5vZGU6IExhenlGaWxlVHJlZU5vZGUpIHtcbiAgdmFyIHZjc0NsYXNzTmFtZSA9IHZjc0NsYXNzTmFtZUZvckVudHJ5KG5vZGUuZ2V0SXRlbSgpKTtcbiAgcmV0dXJuIGFkZG9ucy5jbGFzc1NldCh7XG4gICAgW3Zjc0NsYXNzTmFtZV06IHZjc0NsYXNzTmFtZSxcbiAgfSk7XG59XG5cbi8vIFRPRE8gKHQ3MzM3Njk1KSBNYWtlIHRoaXMgZnVuY3Rpb24gbW9yZSBlZmZpY2llbnQuXG5mdW5jdGlvbiB2Y3NDbGFzc05hbWVGb3JFbnRyeShlbnRyeTogRmlsZSB8IERpcmVjdG9yeSk6IHN0cmluZyB7XG4gIHZhciBwYXRoID0gZW50cnkuZ2V0UGF0aCgpO1xuXG4gIHZhciBjbGFzc05hbWUgPSAnJztcbiAgdmFyIHtyZXBvc2l0b3J5Q29udGFpbnNQYXRofSA9IHJlcXVpcmUoJ251Y2xpZGUtaGctZ2l0LWJyaWRnZScpO1xuICBhdG9tLnByb2plY3QuZ2V0UmVwb3NpdG9yaWVzKCkuZXZlcnkoZnVuY3Rpb24ocmVwb3NpdG9yeTogP1JlcG9zaXRvcnkpIHtcbiAgICBpZiAoIXJlcG9zaXRvcnkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmICghcmVwb3NpdG9yeUNvbnRhaW5zUGF0aChyZXBvc2l0b3J5LCBwYXRoKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHJlcG9zaXRvcnkuaXNQYXRoSWdub3JlZChwYXRoKSkge1xuICAgICAgY2xhc3NOYW1lID0gJ3N0YXR1cy1pZ25vcmVkJztcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgc3RhdHVzID0gbnVsbDtcbiAgICBpZiAoZW50cnkuaXNGaWxlKCkpIHtcbiAgICAgIHN0YXR1cyA9IHJlcG9zaXRvcnkuZ2V0Q2FjaGVkUGF0aFN0YXR1cyhwYXRoKTtcbiAgICB9IGVsc2UgaWYgKGVudHJ5LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgIHN0YXR1cyA9IHJlcG9zaXRvcnkuZ2V0RGlyZWN0b3J5U3RhdHVzKHBhdGgpO1xuICAgIH1cblxuICAgIGlmIChzdGF0dXMpIHtcbiAgICAgIGlmIChyZXBvc2l0b3J5LmlzU3RhdHVzTmV3KHN0YXR1cykpIHtcbiAgICAgICAgY2xhc3NOYW1lID0gJ3N0YXR1cy1hZGRlZCc7XG4gICAgICB9IGVsc2UgaWYgKHJlcG9zaXRvcnkuaXNTdGF0dXNNb2RpZmllZChzdGF0dXMpKSB7XG4gICAgICAgIGNsYXNzTmFtZSA9ICdzdGF0dXMtbW9kaWZpZWQnO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9LCB0aGlzKTtcbiAgcmV0dXJuIGNsYXNzTmFtZTtcbn1cblxuZnVuY3Rpb24gaXNMb2NhbEZpbGUoZW50cnk6IEZpbGUgfCBEaXJlY3RvcnkpOiBib29sZWFuIHtcbiAgcmV0dXJuIGVudHJ5LmdldExvY2FsUGF0aCA9PT0gdW5kZWZpbmVkO1xufVxuXG50eXBlIEZpbGVUcmVlQ29udHJvbGxlclN0YXRlID0ge1xuICBwYW5lbDogUGFuZWxDb250cm9sbGVyU3RhdGU7XG4gIHRyZWU6ID9UcmVlQ29tcG9uZW50U3RhdGU7XG59O1xuXG50eXBlIE5vZGVTdGF0ZSA9IHtub2RlOiBMYXp5RmlsZVRyZWVOb2RlOyBzdWJzY3JpcHRpb246ID9EaXNwb3NhYmxlfTtcblxudmFyIEZpbGVUcmVlID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICByZW5kZXIoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwibnVjbGlkZS1maWxlLXRyZWVcIiB0YWJJbmRleD1cIi0xXCI+XG4gICAgICAgIDxUcmVlUm9vdENvbXBvbmVudCByZWY9XCJyb290XCIgey4uLnRoaXMucHJvcHN9Lz5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG5cbiAgZ2V0VHJlZVJvb3QoKTogP1JlYWN0Q29tcG9uZW50IHtcbiAgICByZXR1cm4gdGhpcy5yZWZzLnJvb3Q7XG4gIH0sXG59KTtcblxuY2xhc3MgRmlsZVRyZWVDb250cm9sbGVyIHtcbiAgX2hvc3RFbGVtZW50OiA/RWxlbWVudDtcbiAgX2tleVRvU3RhdGU6ID9NYXA8c3RyaW5nLCBOb2RlU3RhdGU+O1xuXG4gIGNvbnN0cnVjdG9yKHN0YXRlOiA/RmlsZVRyZWVDb250cm9sbGVyU3RhdGUpIHtcbiAgICB0aGlzLl9mZXRjaENoaWxkcmVuV2l0aENvbnRyb2xsZXIgPSAobm9kZSkgPT4gZmV0Y2hDaGlsZHJlbihub2RlLCB0aGlzKTtcblxuICAgIHRoaXMuX2tleVRvU3RhdGUgPSBuZXcgTWFwKCk7XG5cbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICB0aGlzLl9yZXBvc2l0b3J5U3Vic2NyaXB0aW9ucyA9IG51bGw7XG5cbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmFkZChuZXcgRGlzcG9zYWJsZSgoKSA9PiB7XG4gICAgICBmb3IgKHZhciBub2RlU3RhdGUgb2YgdGhpcy5fa2V5VG9TdGF0ZS52YWx1ZXMoKSkge1xuICAgICAgICBpZiAobm9kZVN0YXRlLnN1YnNjcmlwdGlvbikge1xuICAgICAgICAgIG5vZGVTdGF0ZS5zdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLl9rZXlUb1N0YXRlID0gbnVsbDtcbiAgICB9KSk7XG5cbiAgICB2YXIgZGlyZWN0b3JpZXMgPSBhdG9tLnByb2plY3QuZ2V0RGlyZWN0b3JpZXMoKTtcbiAgICB0aGlzLl9yb290cyA9IGRpcmVjdG9yaWVzLm1hcChcbiAgICAgICAgKGRpcmVjdG9yeSkgPT4gdGhpcy5nZXROb2RlQW5kU2V0U3RhdGUoZGlyZWN0b3J5LCAvKiBwYXJlbnQgKi8gbnVsbCkpO1xuXG4gICAgdmFyIGV2ZW50SGFuZGxlclNlbGVjdG9yID0gJy5udWNsaWRlLWZpbGUtdHJlZSc7XG5cbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcbiAgICAgICAgZXZlbnRIYW5kbGVyU2VsZWN0b3IsXG4gICAgICAgIHtcbiAgICAgICAgICAnY29yZTpiYWNrc3BhY2UnOiAoKSA9PiB0aGlzLmRlbGV0ZVNlbGVjdGlvbigpLFxuICAgICAgICAgICdjb3JlOmRlbGV0ZSc6ICgpID0+IHRoaXMuZGVsZXRlU2VsZWN0aW9uKCksXG4gICAgICAgIH0pKTtcblxuICAgIHZhciBwcm9wcyA9IHtcbiAgICAgIGluaXRpYWxSb290czogdGhpcy5fcm9vdHMsXG4gICAgICBldmVudEhhbmRsZXJTZWxlY3RvcixcbiAgICAgIG9uQ29uZmlybVNlbGVjdGlvbjogdGhpcy5vbkNvbmZpcm1TZWxlY3Rpb24uYmluZCh0aGlzKSxcbiAgICAgIG9uS2VlcFNlbGVjdGlvbjogdGhpcy5vbktlZXBTZWxlY3Rpb24uYmluZCh0aGlzKSxcbiAgICAgIGxhYmVsQ2xhc3NOYW1lRm9yTm9kZSxcbiAgICAgIHJvd0NsYXNzTmFtZUZvck5vZGUsXG4gICAgICBlbGVtZW50VG9SZW5kZXJXaGVuRW1wdHk6IDxkaXY+Tm8gcHJvamVjdCByb290PC9kaXY+LFxuICAgIH07XG4gICAgaWYgKHN0YXRlICYmIHN0YXRlLnRyZWUpIHtcbiAgICAgIHByb3BzLmluaXRpYWxFeHBhbmRlZE5vZGVLZXlzID0gc3RhdGUudHJlZS5leHBhbmRlZE5vZGVLZXlzO1xuICAgICAgcHJvcHMuaW5pdGlhbFNlbGVjdGVkTm9kZUtleXMgPSBzdGF0ZS50cmVlLnNlbGVjdGVkTm9kZUtleXM7XG4gICAgfVxuICAgIHRoaXMuX3BhbmVsQ29udHJvbGxlciA9IG5ldyBQYW5lbENvbnRyb2xsZXIoXG4gICAgICAgIDxGaWxlVHJlZSB7Li4ucHJvcHN9IC8+LFxuICAgICAgICB7ZG9jazogJ2xlZnQnfSxcbiAgICAgICAgc3RhdGUgJiYgc3RhdGUucGFuZWwpO1xuXG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXG4gICAgICAgIGV2ZW50SGFuZGxlclNlbGVjdG9yLFxuICAgICAgICB7XG4gICAgICAgICAgJ251Y2xpZGUtZmlsZS10cmVlOmFkZC1maWxlJzogKCkgPT4gdGhpcy5vcGVuQWRkRmlsZURpYWxvZygpLFxuICAgICAgICAgICdudWNsaWRlLWZpbGUtdHJlZTphZGQtZm9sZGVyJzogKCkgPT4gdGhpcy5vcGVuQWRkRm9sZGVyRGlhbG9nKCksXG4gICAgICAgICAgJ251Y2xpZGUtZmlsZS10cmVlOmRlbGV0ZS1zZWxlY3Rpb24nOiAoKSA9PiB0aGlzLmRlbGV0ZVNlbGVjdGlvbigpLFxuICAgICAgICAgICdudWNsaWRlLWZpbGUtdHJlZTpyZW5hbWUtc2VsZWN0aW9uJzogKCkgPT4gdGhpcy5vcGVuUmVuYW1lRGlhbG9nKCksXG4gICAgICAgICAgJ251Y2xpZGUtZmlsZS10cmVlOnJlbW92ZS1wcm9qZWN0LWZvbGRlci1zZWxlY3Rpb24nOiAoKSA9PiB0aGlzLnJlbW92ZVJvb3RGb2xkZXJTZWxlY3Rpb24oKSxcbiAgICAgICAgICAnbnVjbGlkZS1maWxlLXRyZWU6Y29weS1mdWxsLXBhdGgnOiAoKSA9PiB0aGlzLmNvcHlGdWxsUGF0aCgpLFxuICAgICAgICAgICdudWNsaWRlLWZpbGUtdHJlZTpzaG93LWluLWZpbGUtbWFuYWdlcic6ICgpID0+IHRoaXMuc2hvd0luRmlsZU1hbmFnZXIoKSxcbiAgICAgICAgICAnbnVjbGlkZS1maWxlLXRyZWU6cmVsb2FkJzogKCkgPT4gdGhpcy5yZWxvYWQoKSxcbiAgICAgICAgfSkpO1xuXG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5wcm9qZWN0Lm9uRGlkQ2hhbmdlUGF0aHMoKHBhdGhzKSA9PiB7XG4gICAgICB2YXIgdHJlZUNvbXBvbmVudCA9IHRoaXMuZ2V0VHJlZUNvbXBvbmVudCgpO1xuICAgICAgaWYgKHRyZWVDb21wb25lbnQpIHtcbiAgICAgICAgdmFyIG5ld1Jvb3RzID0gYXRvbS5wcm9qZWN0LmdldERpcmVjdG9yaWVzKCkubWFwKFxuICAgICAgICAgICAgKGRpcmVjdG9yeSkgPT4gdGhpcy5nZXROb2RlQW5kU2V0U3RhdGUoZGlyZWN0b3J5LCAvKiBwYXJlbnQgKi8gbnVsbCkpO1xuICAgICAgICB0aGlzLmRlc3Ryb3lTdGF0ZUZvck9sZE5vZGVzKHRoaXMuX3Jvb3RzLCBuZXdSb290cyk7XG4gICAgICAgIHRoaXMuX3Jvb3RzID0gbmV3Um9vdHM7XG4gICAgICAgIHRyZWVDb21wb25lbnQuc2V0Um9vdHMobmV3Um9vdHMpO1xuXG4gICAgICAgIGlmICh0aGlzLl9yZXBvc2l0b3J5U3Vic2NyaXB0aW9ucykge1xuICAgICAgICAgIHRoaXMuX3JlcG9zaXRvcnlTdWJzY3JpcHRpb25zLmRpc3Bvc2UoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9yZXBvc2l0b3J5U3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHZhciByb290UGF0aHMgPSBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKTtcbiAgICAgICAgYXRvbS5wcm9qZWN0LmdldFJlcG9zaXRvcmllcygpLmZvckVhY2goZnVuY3Rpb24ocmVwb3NpdG9yeTogP1JlcG9zaXRvcnkpIHtcbiAgICAgICAgICBpZiAocmVwb3NpdG9yeSkge1xuICAgICAgICAgICAgdGhpcy5fcmVwb3NpdG9yeVN1YnNjcmlwdGlvbnMuYWRkKHJlcG9zaXRvcnkub25EaWRDaGFuZ2VTdGF0dXNlcygoKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMuZm9yY2VVcGRhdGUoKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGlmIChyZXBvc2l0b3J5LmdldFN0YXR1c2VzKSB7XG4gICAgICAgICAgICAgIC8vIFRoaXMgbWV0aG9kIGlzIGF2YWlsYWJsZSBvbiBIZ1JlcG9zaXRvcnlDbGllbnQuXG4gICAgICAgICAgICAgIC8vIFRoaXMgd2lsbCB0cmlnZ2VyIGEgcmVwb3NpdG9yeSA6Om9uRGlkQ2hhbmdlU3RhdHVzZXMgZXZlbnQgaWYgdGhlcmVcbiAgICAgICAgICAgICAgLy8gYXJlIG1vZGlmaWVkIGZpbGVzLCBhbmQgdGh1cyB1cGRhdGUgdGhlIHRyZWUgdG8gcmVmbGVjdCB0aGVcbiAgICAgICAgICAgICAgLy8gY3VycmVudCB2ZXJzaW9uIGNvbnRyb2wgXCJzdGF0ZVwiIG9mIHRoZSBmaWxlcy5cbiAgICAgICAgICAgICAgcmVwb3NpdG9yeS5nZXRTdGF0dXNlcyhbcmVwb3NpdG9yeS5nZXRQcm9qZWN0RGlyZWN0b3J5KCldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgfVxuICAgIH0pKTtcblxuICAgIHRoaXMuYWRkQ29udGV4dE1lbnVJdGVtR3JvdXAoW1xuICAgICAge1xuICAgICAgICBsYWJlbDogJ05ldycsXG4gICAgICAgIHN1Ym1lbnU6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBsYWJlbDogJ0ZpbGUnLFxuICAgICAgICAgICAgY29tbWFuZDogJ251Y2xpZGUtZmlsZS10cmVlOmFkZC1maWxlJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiAnRm9sZGVyJyxcbiAgICAgICAgICAgIGNvbW1hbmQ6ICdudWNsaWRlLWZpbGUtdHJlZTphZGQtZm9sZGVyJyxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICAvLyBTaG93ICdOZXcnIG1lbnUgb25seSB3aGVuIGEgc2luZ2xlIGRpcmVjdG9yeSBpcyBzZWxlY3RlZCBzbyB0aGVcbiAgICAgICAgLy8gdGFyZ2V0IGlzIG9idmlvdXMgYW5kIGNhbiBoYW5kbGUgYSBcIm5ld1wiIG9iamVjdC5cbiAgICAgICAgc2hvdWxkRGlzcGxheUZvclNlbGVjdGVkTm9kZXMobm9kZXMpIHtcbiAgICAgICAgICByZXR1cm4gbm9kZXMubGVuZ3RoID09PSAxICYmXG4gICAgICAgICAgICBub2Rlcy5ldmVyeShub2RlID0+IG5vZGUuaXNDb250YWluZXIoKSk7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIF0pO1xuICAgIHRoaXMuYWRkQ29udGV4dE1lbnVJdGVtR3JvdXAoW1xuICAgICAge1xuICAgICAgICBsYWJlbDogJ0FkZCBQcm9qZWN0IEZvbGRlcicsXG4gICAgICAgIGNvbW1hbmQ6ICdhcHBsaWNhdGlvbjphZGQtcHJvamVjdC1mb2xkZXInLFxuICAgICAgICBzaG91bGREaXNwbGF5SWZUcmVlSXNFbXB0eTogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGxhYmVsOiAnQWRkIFJlbW90ZSBQcm9qZWN0IEZvbGRlcicsXG4gICAgICAgIGNvbW1hbmQ6ICdudWNsaWRlLXJlbW90ZS1wcm9qZWN0czpjb25uZWN0JyxcbiAgICAgICAgc2hvdWxkRGlzcGxheUlmVHJlZUlzRW1wdHk6IHRydWUsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBsYWJlbDogJ1JlbW92ZSBQcm9qZWN0IEZvbGRlcicsXG4gICAgICAgIGNvbW1hbmQ6ICdudWNsaWRlLWZpbGUtdHJlZTpyZW1vdmUtcHJvamVjdC1mb2xkZXItc2VsZWN0aW9uJyxcbiAgICAgICAgc2hvdWxkRGlzcGxheUZvclNlbGVjdGVkTm9kZXMobm9kZXMpIHtcbiAgICAgICAgICByZXR1cm4gbm9kZXMubGVuZ3RoID4gMCAmJiBub2Rlcy5ldmVyeShub2RlID0+IG5vZGUuaXNSb290KCkpO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICBdKTtcbiAgICB0aGlzLmFkZENvbnRleHRNZW51SXRlbUdyb3VwKFtcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6ICdSZW5hbWUnLFxuICAgICAgICBjb21tYW5kOiAnbnVjbGlkZS1maWxlLXRyZWU6cmVuYW1lLXNlbGVjdGlvbicsXG4gICAgICAgIHNob3VsZERpc3BsYXlGb3JTZWxlY3RlZE5vZGVzKG5vZGVzKSB7XG4gICAgICAgICAgcmV0dXJuIG5vZGVzLmxlbmd0aCA9PT0gMSAmJiAhbm9kZXMuc29tZShub2RlID0+IG5vZGUuaXNSb290KCkpO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6ICdEZWxldGUnLFxuICAgICAgICBjb21tYW5kOiAnbnVjbGlkZS1maWxlLXRyZWU6ZGVsZXRlLXNlbGVjdGlvbicsXG4gICAgICAgIHNob3VsZERpc3BsYXlGb3JTZWxlY3RlZE5vZGVzKG5vZGVzKSB7XG4gICAgICAgICAgcmV0dXJuIG5vZGVzLmxlbmd0aCA+IDAgJiYgIW5vZGVzLnNvbWUobm9kZSA9PiBub2RlLmlzUm9vdCgpKTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXSk7XG4gICAgdGhpcy5hZGRDb250ZXh0TWVudUl0ZW1Hcm91cChbXG4gICAgICB7XG4gICAgICAgIGxhYmVsOiAnQ29weSBGdWxsIFBhdGgnLFxuICAgICAgICBjb21tYW5kOiAnbnVjbGlkZS1maWxlLXRyZWU6Y29weS1mdWxsLXBhdGgnLFxuICAgICAgICBzaG91bGREaXNwbGF5Rm9yU2VsZWN0ZWROb2Rlcyhub2Rlcykge1xuICAgICAgICAgIHJldHVybiBub2Rlcy5sZW5ndGggPT09IDE7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBsYWJlbDogJ1Nob3cgaW4gRmluZGVyJyxcbiAgICAgICAgY29tbWFuZDogJ251Y2xpZGUtZmlsZS10cmVlOnNob3ctaW4tZmlsZS1tYW5hZ2VyJyxcbiAgICAgICAgc2hvdWxkRGlzcGxheUZvclNlbGVjdGVkTm9kZXMobm9kZXMpIHtcbiAgICAgICAgICAvLyBGb3Igbm93LCB0aGlzIG9ubHkgd29ya3MgZm9yIGxvY2FsIGZpbGVzIG9uIE9TIFguXG4gICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIG5vZGVzLmxlbmd0aCA9PT0gMSAmJlxuICAgICAgICAgICAgaXNMb2NhbEZpbGUobm9kZXNbMF0uZ2V0SXRlbSgpKSAmJlxuICAgICAgICAgICAgcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbidcbiAgICAgICAgICApO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICBdKTtcbiAgICB0aGlzLmFkZENvbnRleHRNZW51SXRlbUdyb3VwKFtcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6ICdSZWxvYWQnLFxuICAgICAgICBjb21tYW5kOiAnbnVjbGlkZS1maWxlLXRyZWU6cmVsb2FkJyxcbiAgICAgIH0sXG4gICAgXSk7XG4gIH1cblxuICBkZXN0cm95KCkge1xuICAgIHRoaXMuX3BhbmVsQ29udHJvbGxlci5kZXN0cm95KCk7XG4gICAgdGhpcy5fcGFuZWxDb250cm9sbGVyID0gbnVsbDtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKTtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zID0gbnVsbDtcbiAgICBpZiAodGhpcy5fcmVwb3NpdG9yeVN1YnNjcmlwdGlvbnMpIHtcbiAgICAgIHRoaXMuX3JlcG9zaXRvcnlTdWJzY3JpcHRpb25zLmRpc3Bvc2UoKTtcbiAgICAgIHRoaXMuX3JlcG9zaXRvcnlTdWJzY3JpcHRpb25zID0gbnVsbDtcbiAgICB9XG4gICAgdGhpcy5fbG9nZ2VyID0gbnVsbDtcbiAgICBpZiAodGhpcy5faG9zdEVsZW1lbnQpIHtcbiAgICAgIHRoaXMuX2hvc3RFbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5faG9zdEVsZW1lbnQpO1xuICAgIH1cbiAgICB0aGlzLl9jbG9zZURpYWxvZygpO1xuICB9XG5cbiAgdG9nZ2xlKCk6IHZvaWQge1xuICAgIHRoaXMuX3BhbmVsQ29udHJvbGxlci50b2dnbGUoKTtcbiAgfVxuXG4gIHNldFZpc2libGUoc2hvdWxkQmVWaXNpYmxlOiBib29sZWFuKTogdm9pZCB7XG4gICAgdGhpcy5fcGFuZWxDb250cm9sbGVyLnNldFZpc2libGUoc2hvdWxkQmVWaXNpYmxlKTtcbiAgfVxuXG4gIHNlcmlhbGl6ZSgpOiBGaWxlVHJlZUNvbnRyb2xsZXJTdGF0ZSB7XG4gICAgdmFyIHRyZWVDb21wb25lbnQgPSB0aGlzLmdldFRyZWVDb21wb25lbnQoKTtcbiAgICB2YXIgdHJlZSA9IHRyZWVDb21wb25lbnQgPyB0cmVlQ29tcG9uZW50LnNlcmlhbGl6ZSgpIDogbnVsbDtcbiAgICByZXR1cm4ge1xuICAgICAgcGFuZWw6IHRoaXMuX3BhbmVsQ29udHJvbGxlci5zZXJpYWxpemUoKSxcbiAgICAgIHRyZWUsXG4gICAgfTtcbiAgfVxuXG4gIGZvcmNlVXBkYXRlKCk6IHZvaWQge1xuICAgIHZhciB0cmVlQ29tcG9uZW50ID0gdGhpcy5nZXRUcmVlQ29tcG9uZW50KCk7XG4gICAgaWYgKHRyZWVDb21wb25lbnQpIHtcbiAgICAgIHRyZWVDb21wb25lbnQuZm9yY2VVcGRhdGUoKTtcbiAgICB9XG4gIH1cblxuICBhZGRDb250ZXh0TWVudUl0ZW1Hcm91cChcbiAgICBtZW51SXRlbURlZmluaXRpb25zOiBBcnJheTxUcmVlTWVudUl0ZW1EZWZpbml0aW9uPlxuICApOiB2b2lkIHtcbiAgICB2YXIgdHJlZUNvbXBvbmVudCA9IHRoaXMuZ2V0VHJlZUNvbXBvbmVudCgpO1xuICAgIGlmICh0cmVlQ29tcG9uZW50KSB7XG4gICAgICB0cmVlQ29tcG9uZW50LmFkZENvbnRleHRNZW51SXRlbUdyb3VwKG1lbnVJdGVtRGVmaW5pdGlvbnMpO1xuICAgIH1cbiAgfVxuXG4gIGdldFRyZWVDb21wb25lbnQoKTogP1RyZWVSb290Q29tcG9uZW50IHtcbiAgICB2YXIgY29tcG9uZW50ID0gdGhpcy5fcGFuZWxDb250cm9sbGVyLmdldENoaWxkQ29tcG9uZW50KCk7XG4gICAgaWYgKGNvbXBvbmVudCAmJiBjb21wb25lbnQuaGFzT3duUHJvcGVydHkoJ2dldFRyZWVSb290JykpIHtcbiAgICAgIHJldHVybiBjb21wb25lbnQuZ2V0VHJlZVJvb3QoKTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY2FjaGVkIG5vZGUgZm9yIGBlbnRyeWAgb3IgY3JlYXRlcyBhIG5ldyBvbmUuIEl0IHNldHMgdGhlIGFwcHJvcHJpYXRlIGJvb2trZWVwaW5nXG4gICAqIHN0YXRlIGlmIGl0IGNyZWF0ZXMgYSBuZXcgbm9kZS5cbiAgICovXG4gIGdldE5vZGVBbmRTZXRTdGF0ZShcbiAgICBlbnRyeTogYXRvbSRGaWxlIHwgYXRvbSREaXJlY3RvcnksXG4gICAgcGFyZW50OiA/TGF6eUZpbGVUcmVlTm9kZVxuICApOiBMYXp5RmlsZVRyZWVOb2RlIHtcbiAgICAvLyBXZSBuZWVkIHRvIGNyZWF0ZSBhIG5vZGUgdG8gZ2V0IHRoZSBwYXRoLCBldmVuIGlmIHdlIGRvbid0IGVuZCB1cCByZXR1cm5pbmcgaXQuXG4gICAgdmFyIG5vZGUgPSBuZXcgTGF6eUZpbGVUcmVlTm9kZShlbnRyeSwgcGFyZW50LCB0aGlzLl9mZXRjaENoaWxkcmVuV2l0aENvbnRyb2xsZXIpO1xuICAgIHZhciBub2RlS2V5ID0gbm9kZS5nZXRLZXkoKTtcblxuICAgIC8vIFJldXNlIGV4aXN0aW5nIG5vZGUgaWYgcG9zc2libGUuIFRoaXMgcHJlc2VydmVzIHRoZSBjYWNoZWQgY2hpbGRyZW4gYW5kIHByZXZlbnRzXG4gICAgLy8gdXMgZnJvbSBjcmVhdGluZyBtdWx0aXBsZSBmaWxlIHdhdGNoZXJzIG9uIHRoZSBzYW1lIGZpbGUuXG4gICAgdmFyIHN0YXRlID0gdGhpcy5nZXRTdGF0ZUZvck5vZGVLZXkobm9kZUtleSk7XG4gICAgaWYgKHN0YXRlKSB7XG4gICAgICByZXR1cm4gc3RhdGUubm9kZTtcbiAgICB9XG5cbiAgICB2YXIgc3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICBpZiAoZW50cnkuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gdGhpcyBjYWxsIGZhaWxzIGJlY2F1c2UgaXQgY291bGQgdHJ5IHRvIHdhdGNoIGEgbm9uLWV4aXN0aW5nIGRpcmVjdG9yeSxcbiAgICAgICAgLy8gb3Igd2l0aCBhIHVzZSB0aGF0IGhhcyBubyBwZXJtaXNzaW9uIHRvIGl0LlxuICAgICAgICBzdWJzY3JpcHRpb24gPSBlbnRyeS5vbkRpZENoYW5nZSgoKSA9PiB7XG4gICAgICAgICAgbm9kZS5pbnZhbGlkYXRlQ2FjaGUoKTtcbiAgICAgICAgICB0aGlzLmZvcmNlVXBkYXRlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHRoaXMuX2xvZ0Vycm9yKCdudWNsaWRlLWZpbGUtdHJlZTogQ2Fubm90IHN1YnNjcmliZSB0byBhIGRpcmVjdG9yeS4nLCBlbnRyeS5nZXRQYXRoKCksIGVycik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fc2V0U3RhdGVGb3JOb2RlS2V5KG5vZGVLZXksIHtub2RlLCBzdWJzY3JpcHRpb259KTtcblxuICAgIHJldHVybiBub2RlO1xuICB9XG5cbiAgX3NldFN0YXRlRm9yTm9kZUtleShub2RlS2V5OiBzdHJpbmcsIHN0YXRlOiBOb2RlU3RhdGUpOiB2b2lkIHtcbiAgICB0aGlzLl9kZXN0cm95U3RhdGVGb3JOb2RlS2V5KG5vZGVLZXkpO1xuICAgIHRoaXMuX2tleVRvU3RhdGUuc2V0KG5vZGVLZXksIHN0YXRlKTtcbiAgfVxuXG4gIGdldFN0YXRlRm9yTm9kZUtleShub2RlS2V5OiBzdHJpbmcpOiA/Tm9kZVN0YXRlIHtcbiAgICByZXR1cm4gdGhpcy5fa2V5VG9TdGF0ZS5nZXQobm9kZUtleSk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgc3RhdGVzIGZvciBub2RlcyB0aGF0IGFyZSBpbiBgb2xkTm9kZXNgIGFuZCBub3QgaW4gYG5ld05vZGVzYC5cbiAgICogVGhpcyBpcyB1c2VmdWwgd2hlbiBmZXRjaGluZyBuZXcgY2hpbGRyZW4gLS0gc29tZSBjYWNoZWQgbm9kZXMgY2FuIHN0aWxsXG4gICAqIGJlIHJldXNlZCBhbmQgdGhlIHJlc3QgbXVzdCBiZSBkZXN0cm95ZWQuXG4gICAqL1xuICBkZXN0cm95U3RhdGVGb3JPbGROb2RlcyhvbGROb2RlczogQXJyYXk8TGF6eUZpbGVUcmVlTm9kZT4sIG5ld05vZGVzOiBBcnJheTxMYXp5RmlsZVRyZWVOb2RlPik6IHZvaWQge1xuICAgIHZhciBuZXdOb2Rlc1NldCA9IG5ldyBTZXQobmV3Tm9kZXMpO1xuICAgIG9sZE5vZGVzLmZvckVhY2goKG9sZE5vZGUpID0+IHtcbiAgICAgIGlmICghbmV3Tm9kZXNTZXQuaGFzKG9sZE5vZGUpKSB7XG4gICAgICAgIHRoaXMuX2Rlc3Ryb3lTdGF0ZUZvck5vZGVLZXkob2xkTm9kZS5nZXRLZXkoKSk7XG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIF9kZXN0cm95U3RhdGVGb3JOb2RlS2V5KG5vZGVLZXk6IHN0cmluZyk6IHZvaWQge1xuICAgIHZhciBzdGF0ZSA9IHRoaXMuZ2V0U3RhdGVGb3JOb2RlS2V5KG5vZGVLZXkpO1xuICAgIGlmIChzdGF0ZSkge1xuICAgICAgdmFyIHtub2RlfSA9IHN0YXRlO1xuICAgICAgdHJlZU5vZGVUcmF2ZXJzYWxzLmZvckVhY2hDYWNoZWROb2RlKG5vZGUsIChjYWNoZWROb2RlKSA9PiB7XG4gICAgICAgIHZhciBjYWNoZWROb2RlS2V5ID0gY2FjaGVkTm9kZS5nZXRLZXkoKTtcbiAgICAgICAgdmFyIGNhY2hlZFN0YXRlID0gdGhpcy5nZXRTdGF0ZUZvck5vZGVLZXkoY2FjaGVkTm9kZUtleSk7XG4gICAgICAgIGlmIChjYWNoZWRTdGF0ZSkge1xuICAgICAgICAgIGlmIChjYWNoZWRTdGF0ZS5zdWJzY3JpcHRpb24pIHtcbiAgICAgICAgICAgIGNhY2hlZFN0YXRlLnN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuX2tleVRvU3RhdGUuZGVsZXRlKGNhY2hlZE5vZGVLZXkpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgdmFyIHRyZWVDb21wb25lbnQgPSB0aGlzLmdldFRyZWVDb21wb25lbnQoKTtcbiAgICAgIGlmICh0cmVlQ29tcG9uZW50KSB7XG4gICAgICAgIHRyZWVDb21wb25lbnQucmVtb3ZlU3RhdGVGb3JTdWJ0cmVlKG5vZGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIG9uQ29uZmlybVNlbGVjdGlvbihub2RlOiBMYXp5RmlsZVRyZWVOb2RlKTogdm9pZCB7XG4gICAgdmFyIGVudHJ5ID0gbm9kZS5nZXRJdGVtKCk7XG4gICAgYXRvbS53b3Jrc3BhY2Uub3BlbihlbnRyeS5nZXRQYXRoKCksIHtcbiAgICAgIGFjdGl2YXRlUGFuZTogIWF0b20uY29uZmlnLmdldCgndGFicy51c2VQcmV2aWV3VGFicycpLFxuICAgICAgc2VhcmNoQWxsUGFuZXM6IHRydWUsXG4gICAgfSk7XG4gIH1cblxuICBvbktlZXBTZWxlY3Rpb24oKTogdm9pZCB7XG4gICAgaWYgKCFhdG9tLmNvbmZpZy5nZXQoJ3RhYnMudXNlUHJldmlld1RhYnMnKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBhY3RpdmVQYW5lSXRlbSA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmVJdGVtKCk7XG4gICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYWN0aXZlUGFuZUl0ZW0pLCAndGFiczprZWVwLXByZXZpZXctdGFiJyk7XG5cbiAgICAvLyBcIkFjdGl2YXRlXCIgdGhlIGFscmVhZHktYWN0aXZlIHBhbmUgdG8gZ2l2ZSBpdCBmb2N1cy5cbiAgICBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lKCkuYWN0aXZhdGUoKTtcbiAgfVxuXG4gIHJlbW92ZVJvb3RGb2xkZXJTZWxlY3Rpb24oKTogdm9pZCB7XG4gICAgdmFyIHNlbGVjdGVkSXRlbXMgPSB0aGlzLl9nZXRTZWxlY3RlZEl0ZW1zKCk7XG4gICAgdmFyIHNlbGVjdGVkRmlsZVBhdGhzID0gc2VsZWN0ZWRJdGVtcy5tYXAoKGl0ZW0pID0+IGl0ZW0uZ2V0UGF0aCgpKTtcbiAgICB2YXIgcm9vdFBhdGhzU2V0ID0gbmV3IFNldChhdG9tLnByb2plY3QuZ2V0UGF0aHMoKSk7XG4gICAgc2VsZWN0ZWRGaWxlUGF0aHMuZm9yRWFjaCgoc2VsZWN0ZWRGaWxlUGF0aCkgPT4ge1xuICAgICAgaWYgKHJvb3RQYXRoc1NldC5oYXMoc2VsZWN0ZWRGaWxlUGF0aCkpIHtcbiAgICAgICAgYXRvbS5wcm9qZWN0LnJlbW92ZVBhdGgoc2VsZWN0ZWRGaWxlUGF0aCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBjb3B5RnVsbFBhdGgoKTogdm9pZCB7XG4gICAgdmFyIHNlbGVjdGVkSXRlbXMgPSB0aGlzLl9nZXRTZWxlY3RlZEl0ZW1zKCk7XG4gICAgaWYgKHNlbGVjdGVkSXRlbXMubGVuZ3RoICE9PSAxKSB7XG4gICAgICB0aGlzLl9sb2dFcnJvcignbnVjbGlkZS1maWxlLXRyZWU6IEV4YWN0bHkgMSBpdGVtIHNob3VsZCBiZSBzZWxlY3RlZCcpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBzZWxlY3RlZEl0ZW0gPSBzZWxlY3RlZEl0ZW1zWzBdO1xuICAgIC8vIEZvciByZW1vdGUgZmlsZXMgd2Ugd2FudCB0byBjb3B5IHRoZSBsb2NhbCBwYXRoIGluc3RlYWQgb2YgZnVsbCBwYXRoLlxuICAgIC8vIGkuZSwgXCIvaG9tZS9kaXIvZmlsZVwiIHZzIFwibnVjbGlkZTovaG9zdDpwb3J0L2hvbWUvZGlyL2ZpbGVcIlxuICAgIGF0b20uY2xpcGJvYXJkLndyaXRlKFxuICAgICAgaXNMb2NhbEZpbGUoc2VsZWN0ZWRJdGVtKVxuICAgICAgICA/IHNlbGVjdGVkSXRlbS5nZXRQYXRoKClcbiAgICAgICAgOiBzZWxlY3RlZEl0ZW0uZ2V0TG9jYWxQYXRoKClcbiAgICApO1xuICB9XG5cbiAgc2hvd0luRmlsZU1hbmFnZXIoKTogdm9pZCB7XG4gICAgdmFyIHNlbGVjdGVkSXRlbXMgPSB0aGlzLl9nZXRTZWxlY3RlZEl0ZW1zKCk7XG4gICAgaWYgKHNlbGVjdGVkSXRlbXMubGVuZ3RoICE9PSAxKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBmaWxlUGF0aCA9IHNlbGVjdGVkSXRlbXNbMF0uZ2V0UGF0aCgpO1xuXG4gICAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nKSB7XG4gICAgICB2YXIge2FzeW5jRXhlY3V0ZX0gPSByZXF1aXJlKCdudWNsaWRlLWNvbW1vbnMnKTtcbiAgICAgIGFzeW5jRXhlY3V0ZSgnb3BlbicsIFsnLVInLCBmaWxlUGF0aF0sIC8qIG9wdGlvbnMgKi8ge30pO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIHJldmVhbEFjdGl2ZUZpbGUoKTogdm9pZCB7XG4gICAgdmFyIGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcbiAgICBpZiAoIWVkaXRvcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciB0cmVlQ29tcG9uZW50ID0gdGhpcy5nZXRUcmVlQ29tcG9uZW50KCk7XG4gICAgaWYgKHRyZWVDb21wb25lbnQpIHtcbiAgICAgIHZhciB7ZmlsZX0gPSBlZGl0b3IuZ2V0QnVmZmVyKCk7XG4gICAgICBpZiAoZmlsZSkge1xuICAgICAgICB2YXIge2ZpbmR9ID0gcmVxdWlyZSgnbnVjbGlkZS1jb21tb25zJykuYXJyYXk7XG4gICAgICAgIHZhciBmaWxlUGF0aCA9IGZpbGUuZ2V0UGF0aCgpO1xuICAgICAgICB2YXIgcm9vdERpcmVjdG9yeSA9IGZpbmQoYXRvbS5wcm9qZWN0LmdldERpcmVjdG9yaWVzKCksIGRpcmVjdG9yeSA9PiBkaXJlY3RvcnkuY29udGFpbnMoZmlsZVBhdGgpKTtcbiAgICAgICAgaWYgKHJvb3REaXJlY3RvcnkpIHtcbiAgICAgICAgICAvLyBBY2N1bXVsYXRlIGFsbCB0aGUgYW5jZXN0b3Iga2V5cyBmcm9tIHRoZSBmaWxlIHVwIHRvIHRoZSByb290LlxuICAgICAgICAgIHZhciBkaXJlY3RvcnkgPSBmaWxlLmdldFBhcmVudCgpO1xuICAgICAgICAgIHZhciBhbmNlc3RvcktleXMgPSBbXTtcbiAgICAgICAgICB3aGlsZSAocm9vdERpcmVjdG9yeS5nZXRQYXRoKCkgIT09IGRpcmVjdG9yeS5nZXRQYXRoKCkpIHtcbiAgICAgICAgICAgIGFuY2VzdG9yS2V5cy5wdXNoKG5ldyBMYXp5RmlsZVRyZWVOb2RlKGRpcmVjdG9yeSkuZ2V0S2V5KCkpO1xuICAgICAgICAgICAgZGlyZWN0b3J5ID0gZGlyZWN0b3J5LmdldFBhcmVudCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhbmNlc3RvcktleXMucHVzaChuZXcgTGF6eUZpbGVUcmVlTm9kZShyb290RGlyZWN0b3J5KS5nZXRLZXkoKSk7XG5cbiAgICAgICAgICAvLyBFeHBhbmQgZWFjaCBub2RlIGZyb20gdGhlIHJvb3QgZG93biB0byB0aGUgZmlsZS5cbiAgICAgICAgICBmb3IgKHZhciBub2RlS2V5IG9mIGFuY2VzdG9yS2V5cy5yZXZlcnNlKCkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIC8vIFNlbGVjdCB0aGUgbm9kZSB0byBlbnN1cmUgaXQncyB2aXNpYmxlLlxuICAgICAgICAgICAgICBhd2FpdCB0cmVlQ29tcG9uZW50LnNlbGVjdE5vZGVLZXkobm9kZUtleSk7XG4gICAgICAgICAgICAgIGF3YWl0IHRyZWVDb21wb25lbnQuZXhwYW5kTm9kZUtleShub2RlS2V5KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgIC8vIElmIHRoZSBub2RlIGlzbid0IGluIHRoZSB0cmVlLCBpdHMgZGVzY2VuZGFudHMgYXJlbid0IGVpdGhlci5cbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0cmVlQ29tcG9uZW50LnNlbGVjdE5vZGVLZXkobmV3IExhenlGaWxlVHJlZU5vZGUoZmlsZSkuZ2V0S2V5KCkpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAvLyBJdCdzIG9rIGlmIHRoZSBub2RlIGlzbid0IGluIHRoZSB0cmVlLCBzbyB3ZSBjYW4gaWdub3JlIHRoZSBlcnJvci5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5zZXRWaXNpYmxlKHRydWUpO1xuICB9XG5cbiAgZGVsZXRlU2VsZWN0aW9uKCkge1xuICAgIHZhciB0cmVlQ29tcG9uZW50ID0gdGhpcy5nZXRUcmVlQ29tcG9uZW50KCk7XG4gICAgaWYgKCF0cmVlQ29tcG9uZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHNlbGVjdGVkTm9kZXMgPSB0cmVlQ29tcG9uZW50LmdldFNlbGVjdGVkTm9kZXMoKTtcbiAgICBpZiAoc2VsZWN0ZWROb2Rlcy5sZW5ndGggPT09IDAgfHwgc2VsZWN0ZWROb2Rlcy5zb21lKG5vZGUgPT4gbm9kZS5pc1Jvb3QoKSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHNlbGVjdGVkSXRlbXMgPSBzZWxlY3RlZE5vZGVzLm1hcChub2RlID0+IG5vZGUuZ2V0SXRlbSgpKTtcblxuICAgIHZhciBzZWxlY3RlZFBhdGhzID0gc2VsZWN0ZWRJdGVtcy5tYXAoZW50cnkgPT4gZW50cnkuZ2V0UGF0aCgpKTtcbiAgICB2YXIgbWVzc2FnZSA9ICdBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlIHRoZSBzZWxlY3RlZCAnICtcbiAgICAgICAgKHNlbGVjdGVkSXRlbXMubGVuZ3RoID4gMSA/ICdpdGVtcycgOiAnaXRlbScpO1xuICAgIGF0b20uY29uZmlybSh7XG4gICAgICBtZXNzYWdlLFxuICAgICAgZGV0YWlsZWRNZXNzYWdlOiAnWW91IGFyZSBkZWxldGluZzpcXG4nICsgc2VsZWN0ZWRQYXRocy5qb2luKCdcXG4nKSxcbiAgICAgIGJ1dHRvbnM6IHtcbiAgICAgICAgJ0RlbGV0ZSc6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICB2YXIgZGVsZXRlUHJvbWlzZXMgPSBbXTtcbiAgICAgICAgICBzZWxlY3RlZEl0ZW1zLmZvckVhY2goKGVudHJ5LCBpKSA9PiB7XG4gICAgICAgICAgICB2YXIgZW50cnlQYXRoID0gc2VsZWN0ZWRQYXRoc1tpXTtcbiAgICAgICAgICAgIGlmIChlbnRyeVBhdGguc3RhcnRzV2l0aCgnbnVjbGlkZTovJykpIHtcbiAgICAgICAgICAgICAgZGVsZXRlUHJvbWlzZXMucHVzaChlbnRyeS5kZWxldGUoKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyBUT0RPKGpqaWFhKTogVGhpcyBzcGVjaWFsLWNhc2UgY2FuIGJlIGVsaW1pbmF0ZWQgb25jZSBgZGVsZXRlKClgXG4gICAgICAgICAgICAgIC8vIGlzIGFkZGVkIHRvIGBEaXJlY3RvcnlgIGFuZCBgRmlsZWAuXG4gICAgICAgICAgICAgIHNoZWxsLm1vdmVJdGVtVG9UcmFzaChlbnRyeVBhdGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoZGVsZXRlUHJvbWlzZXMpO1xuICAgICAgICAgIHZhciBwYXJlbnREaXJlY3RvcmllcyA9IG5ldyBTZXQoc2VsZWN0ZWRJdGVtcy5tYXAoKGVudHJ5KSA9PiBlbnRyeS5nZXRQYXJlbnQoKSkpO1xuICAgICAgICAgIHBhcmVudERpcmVjdG9yaWVzLmZvckVhY2goKGRpcmVjdG9yeSkgPT4gdGhpcy5fcmVsb2FkRGlyZWN0b3J5KGRpcmVjdG9yeSkpO1xuICAgICAgICB9LFxuICAgICAgICAnQ2FuY2VsJzogbnVsbCxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICByZWxvYWQoKSB7XG4gICAgdmFyIHRyZWVDb21wb25lbnQgPSB0aGlzLmdldFRyZWVDb21wb25lbnQoKTtcbiAgICBpZiAoIXRyZWVDb21wb25lbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdHJlZUNvbXBvbmVudC5pbnZhbGlkYXRlQ2FjaGVkTm9kZXMoKTtcbiAgICB0cmVlQ29tcG9uZW50LmZvcmNlVXBkYXRlKCk7XG4gIH1cblxuICBfZ2V0U2VsZWN0ZWRJdGVtcygpOiBBcnJheTxMYXp5RmlsZVRyZWVOb2RlPiB7XG4gICAgdmFyIHRyZWVDb21wb25lbnQgPSB0aGlzLmdldFRyZWVDb21wb25lbnQoKTtcbiAgICBpZiAoIXRyZWVDb21wb25lbnQpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICB2YXIgc2VsZWN0ZWROb2RlcyA9IHRyZWVDb21wb25lbnQuZ2V0U2VsZWN0ZWROb2RlcygpO1xuICAgIHJldHVybiBzZWxlY3RlZE5vZGVzLm1hcCgobm9kZSkgPT4gbm9kZS5nZXRJdGVtKCkpO1xuICB9XG5cbiAgb3BlbkFkZEZpbGVEaWFsb2coKTogdm9pZCB7XG4gICAgdGhpcy5fb3BlbkFkZERpYWxvZygnZmlsZScsIGFzeW5jIChyb290RGlyZWN0b3J5OiBEaXJlY3RvcnksIGZpbGVQYXRoOiBzdHJpbmcpID0+IHtcbiAgICAgIC8vIE5vdGU6IHRoaXMgd2lsbCB0aHJvdyBpZiB0aGUgcmVzdWx0aW5nIHBhdGggbWF0Y2hlcyB0aGF0IG9mIGFuIGV4aXN0aW5nXG4gICAgICAvLyBsb2NhbCBkaXJlY3RvcnkuXG4gICAgICB2YXIgbmV3RmlsZSA9IHJvb3REaXJlY3RvcnkuZ2V0RmlsZShmaWxlUGF0aCk7XG4gICAgICBhd2FpdCBuZXdGaWxlLmNyZWF0ZSgpO1xuICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbihuZXdGaWxlLmdldFBhdGgoKSk7XG4gICAgICB0aGlzLl9yZWxvYWREaXJlY3RvcnkobmV3RmlsZS5nZXRQYXJlbnQoKSk7XG4gICAgfSk7XG4gIH1cblxuICBvcGVuQWRkRm9sZGVyRGlhbG9nKCk6IHZvaWQge1xuICAgIHRoaXMuX29wZW5BZGREaWFsb2coJ2ZvbGRlcicsIGFzeW5jIChyb290RGlyZWN0b3J5OiBEaXJlY3RvcnksIGRpcmVjdG9yeVBhdGg6IHN0cmluZykgPT4ge1xuICAgICAgdmFyIG5ld0RpcmVjdG9yeSA9IHJvb3REaXJlY3RvcnkuZ2V0U3ViZGlyZWN0b3J5KGRpcmVjdG9yeVBhdGgpO1xuICAgICAgYXdhaXQgbmV3RGlyZWN0b3J5LmNyZWF0ZSgpO1xuICAgICAgdGhpcy5fcmVsb2FkRGlyZWN0b3J5KG5ld0RpcmVjdG9yeS5nZXRQYXJlbnQoKSk7XG4gICAgfSk7XG4gIH1cblxuICBfcmVsb2FkRGlyZWN0b3J5KGRpcmVjdG9yeTogRGlyZWN0b3J5KTogdm9pZCB7XG4gICAgdmFyIGRpcmVjdG9yeU5vZGUgPSB0aGlzLmdldFRyZWVDb21wb25lbnQoKS5nZXROb2RlRm9yS2V5KG5ldyBMYXp5RmlsZVRyZWVOb2RlKGRpcmVjdG9yeSkuZ2V0S2V5KCkpO1xuICAgIGRpcmVjdG9yeU5vZGUuaW52YWxpZGF0ZUNhY2hlKCk7XG4gICAgdGhpcy5mb3JjZVVwZGF0ZSgpO1xuICB9XG5cbiAgX29wZW5BZGREaWFsb2coXG4gICAgICBlbnRyeVR5cGU6IHN0cmluZyxcbiAgICAgIG9uQ29uZmlybTogKHJvb3REaXJlY3Rvcnk6IERpcmVjdG9yeSwgZmlsZVBhdGg6IHN0cmluZykgPT4gdm9pZCkge1xuICAgIHZhciBzZWxlY3Rpb24gPSB0aGlzLl9nZXRTZWxlY3RlZEVudHJ5QW5kRGlyZWN0b3J5QW5kUm9vdCgpO1xuICAgIGlmICghc2VsZWN0aW9uKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBtZXNzYWdlID0gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPGRpdj5FbnRlciB0aGUgcGF0aCBmb3IgdGhlIG5ldyB7ZW50cnlUeXBlfSBpbiB0aGUgcm9vdDo8L2Rpdj5cbiAgICAgICAgPGRpdj57cGF0aC5ub3JtYWxpemUoc2VsZWN0aW9uLnJvb3QuZ2V0UGF0aCgpICsgJy8nKX08L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG5cbiAgICB2YXIgRmlsZURpYWxvZ0NvbXBvbmVudCA9IHJlcXVpcmUoJy4vRmlsZURpYWxvZ0NvbXBvbmVudCcpO1xuICAgIHZhciBwcm9wcyA9IHtcbiAgICAgIHJvb3REaXJlY3Rvcnk6IHNlbGVjdGlvbi5yb290LFxuICAgICAgaW5pdGlhbEVudHJ5OiBzZWxlY3Rpb24uZGlyZWN0b3J5LFxuICAgICAgaW5pdGlhbERpcmVjdG9yeVBhdGg6IHNlbGVjdGlvbi5lbnRyeS5nZXRQYXRoKCksXG4gICAgICBtZXNzYWdlLFxuICAgICAgb25Db25maXJtLFxuICAgICAgb25DbG9zZTogdGhpcy5fY2xvc2VEaWFsb2cuYmluZCh0aGlzKSxcbiAgICB9O1xuICAgIHRoaXMuX29wZW5EaWFsb2coPEZpbGVEaWFsb2dDb21wb25lbnQgey4uLnByb3BzfSAvPik7XG4gIH1cblxuICBvcGVuUmVuYW1lRGlhbG9nKCk6IHZvaWQge1xuICAgIHZhciBzZWxlY3Rpb24gPSB0aGlzLl9nZXRTZWxlY3RlZEVudHJ5QW5kRGlyZWN0b3J5QW5kUm9vdCgpO1xuICAgIGlmICghc2VsZWN0aW9uKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGVudHJ5VHlwZSA9IHNlbGVjdGlvbi5lbnRyeS5pc0ZpbGUoKSA/ICdmaWxlJyA6ICdmb2xkZXInO1xuICAgIHZhciBtZXNzYWdlID0gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPGRpdj5FbnRlciB0aGUgbmV3IHBhdGggZm9yIHRoZSB7ZW50cnlUeXBlfSBpbiB0aGUgcm9vdDo8L2Rpdj5cbiAgICAgICAgPGRpdj57cGF0aC5ub3JtYWxpemUoc2VsZWN0aW9uLnJvb3QuZ2V0UGF0aCgpICsgJy8nKX08L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG5cbiAgICB2YXIge2VudHJ5LCByb290fSA9IHNlbGVjdGlvbjtcblxuICAgIHZhciBGaWxlRGlhbG9nQ29tcG9uZW50ID0gcmVxdWlyZSgnLi9GaWxlRGlhbG9nQ29tcG9uZW50Jyk7XG4gICAgdmFyIHByb3BzID0ge1xuICAgICAgcm9vdERpcmVjdG9yeTogcm9vdCxcbiAgICAgIGluaXRpYWxFbnRyeTogZW50cnksXG4gICAgICBtZXNzYWdlLFxuICAgICAgb25Db25maXJtOiBhc3luYyAocm9vdERpcmVjdG9yeSwgcmVsYXRpdmVGaWxlUGF0aCkgPT4ge1xuICAgICAgICBpZiAoaXNMb2NhbEZpbGUoZW50cnkpKSB7XG4gICAgICAgICAgLy8gVE9ETyhqamlhYSk6IFRoaXMgc3BlY2lhbC1jYXNlIGNhbiBiZSBlbGltaW5hdGVkIG9uY2UgYGRlbGV0ZSgpYFxuICAgICAgICAgIC8vIGlzIGFkZGVkIHRvIGBEaXJlY3RvcnlgIGFuZCBgRmlsZWAuXG4gICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgZnMubW92ZShcbiAgICAgICAgICAgICAgICBlbnRyeS5nZXRQYXRoKCksXG4gICAgICAgICAgICAgICAgLy8gVXNlIGByZXNvbHZlYCB0byBzdHJpcCB0cmFpbGluZyBzbGFzaGVzIGJlY2F1c2UgcmVuYW1pbmcgYVxuICAgICAgICAgICAgICAgIC8vIGZpbGUgdG8gYSBuYW1lIHdpdGggYSB0cmFpbGluZyBzbGFzaCBpcyBhbiBlcnJvci5cbiAgICAgICAgICAgICAgICBwYXRoLnJlc29sdmUoXG4gICAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocm9vdERpcmVjdG9yeS5nZXRQYXRoKCksIHJlbGF0aXZlRmlsZVBhdGgpXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICBlcnJvciA9PiBlcnJvciA/IHJlamVjdChlcnJvcikgOiByZXNvbHZlKCkpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGF3YWl0IGVudHJ5LnJlbmFtZShwYXRoLmpvaW4ocm9vdERpcmVjdG9yeS5nZXRMb2NhbFBhdGgoKSwgcmVsYXRpdmVGaWxlUGF0aCkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3JlbG9hZERpcmVjdG9yeShlbnRyeS5nZXRQYXJlbnQoKSk7XG4gICAgICB9LFxuICAgICAgb25DbG9zZTogKCkgPT4gdGhpcy5fY2xvc2VEaWFsb2coKSxcbiAgICAgIHNob3VsZFNlbGVjdEJhc2VuYW1lOiB0cnVlLFxuICAgIH07XG4gICAgdGhpcy5fb3BlbkRpYWxvZyg8RmlsZURpYWxvZ0NvbXBvbmVudCB7Li4ucHJvcHN9IC8+KTtcbiAgfVxuXG4gIF9vcGVuRGlhbG9nKGNvbXBvbmVudDogUmVhY3RFbGVtZW50KTogdm9pZCB7XG4gICAgdGhpcy5fY2xvc2VEaWFsb2coKTtcblxuICAgIHRoaXMuX2hvc3RFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdmFyIHdvcmtzcGFjZUVsID0gYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKTtcbiAgICB3b3Jrc3BhY2VFbC5hcHBlbmRDaGlsZCh0aGlzLl9ob3N0RWxlbWVudCk7XG4gICAgdGhpcy5fZGlhbG9nQ29tcG9uZW50ID0gUmVhY3QucmVuZGVyKGNvbXBvbmVudCwgdGhpcy5faG9zdEVsZW1lbnQpO1xuICB9XG5cbiAgX2Nsb3NlRGlhbG9nKCkge1xuICAgIGlmICh0aGlzLl9kaWFsb2dDb21wb25lbnQgJiYgdGhpcy5fZGlhbG9nQ29tcG9uZW50LmlzTW91bnRlZCgpKSB7XG4gICAgICBSZWFjdC51bm1vdW50Q29tcG9uZW50QXROb2RlKHRoaXMuX2hvc3RFbGVtZW50KTtcbiAgICAgIHRoaXMuX2RpYWxvZ0NvbXBvbmVudCA9IG51bGw7XG4gICAgICBhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLnJlbW92ZUNoaWxkKHRoaXMuX2hvc3RFbGVtZW50KTtcbiAgICAgIHRoaXMuX2hvc3RFbGVtZW50ID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBvYmplY3Qgd2l0aCB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gICAqIC0gZW50cnk6IFRoZSBzZWxlY3RlZCBmaWxlIG9yIGRpcmVjdG9yeS5cbiAgICogLSBkaXJlY3Rvcnk6IFRoZSBzZWxlY3RlZCBkaXJlY3Rvcnkgb3IgaXRzIHBhcmVudCBpZiB0aGUgc2VsZWN0aW9uIGlzIGEgZmlsZS5cbiAgICogLSByb290OiBUaGUgcm9vdCBkaXJlY3RvcnkgY29udGFpbmluZyB0aGUgc2VsZWN0ZWQgZW50cnkuXG4gICAqXG4gICAqIFRoZSBlbnRyeSBkZWZhdWx0cyB0byB0aGUgZmlyc3Qgcm9vdCBkaXJlY3RvcnkgaWYgbm90aGluZyBpcyBzZWxlY3RlZC5cbiAgICogUmV0dXJucyBudWxsIGlmIHNvbWUgb2YgdGhlIHJldHVybmVkIHByb3BlcnRpZXMgY2FuJ3QgYmUgcG9wdWxhdGVkLlxuICAgKlxuICAgKiBUaGlzIGlzIHVzZWZ1bCBmb3IgcG9wdWxhdGluZyB0aGUgZmlsZSBkaWFsb2dzLlxuICAgKi9cbiAgX2dldFNlbGVjdGVkRW50cnlBbmREaXJlY3RvcnlBbmRSb290KFxuICApOiA/e1xuICAgIGVudHJ5OiBhdG9tJEZpbGUgfCBhdG9tJERpcmVjdG9yeTtcbiAgICBkaXJlY3Rvcnk6IGF0b20kRGlyZWN0b3J5O1xuICAgIHJvb3Q6ID9hdG9tJERpcmVjdG9yeVxuICB9IHtcbiAgICB2YXIgdHJlZUNvbXBvbmVudCA9IHRoaXMuZ2V0VHJlZUNvbXBvbmVudCgpO1xuICAgIGlmICghdHJlZUNvbXBvbmVudCkge1xuICAgICAgdGhpcy5fbG9nRXJyb3IoJ251Y2xpZGUtZmlsZS10cmVlOiBDYW5ub3QgZ2V0IHRoZSBkaXJlY3RvcnkgZm9yIHRoZSBzZWxlY3Rpb24gYmVjYXVzZSBubyBmaWxlIHRyZWUgZXhpc3RzLicpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgdmFyIGVudHJ5ID0gbnVsbDtcbiAgICB2YXIgc2VsZWN0ZWROb2RlcyA9IHRyZWVDb21wb25lbnQuZ2V0U2VsZWN0ZWROb2RlcygpO1xuICAgIGlmIChzZWxlY3RlZE5vZGVzLmxlbmd0aCA+IDApIHtcbiAgICAgIGVudHJ5ID0gc2VsZWN0ZWROb2Rlc1swXS5nZXRJdGVtKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciByb290RGlyZWN0b3JpZXMgPSBhdG9tLnByb2plY3QuZ2V0RGlyZWN0b3JpZXMoKTtcbiAgICAgIGlmIChyb290RGlyZWN0b3JpZXMubGVuZ3RoID4gMCkge1xuICAgICAgICBlbnRyeSA9IHJvb3REaXJlY3Rvcmllc1swXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFdlIHNob3VsZG4ndCBiZSBhYmxlIHRvIHJlYWNoIHRoaXMgZXJyb3IgYmVjYXVzZSBpdCBzaG91bGQgb25seSBiZVxuICAgICAgICAvLyBhY2Nlc3NpYmxlIGZyb20gYSBjb250ZXh0IG1lbnUuIElmIHRoZXJlJ3MgYSBjb250ZXh0IG1lbnUsIHRoZXJlIG11c3RcbiAgICAgICAgLy8gYmUgYXQgbGVhc3Qgb25lIHJvb3QgZm9sZGVyIHdpdGggYSBkZXNjZW5kYW50IHRoYXQncyByaWdodC1jbGlja2VkLlxuICAgICAgICB0aGlzLl9sb2dFcnJvcignbnVjbGlkZS1maWxlLXRyZWU6IENvdWxkIG5vdCBmaW5kIGEgZGlyZWN0b3J5IHRvIGFkZCB0by4nKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGVudHJ5LFxuICAgICAgZGlyZWN0b3J5OiAoZW50cnkgJiYgZW50cnkuaXNGaWxlKCkpID8gZW50cnkuZ2V0UGFyZW50KCkgOiBlbnRyeSxcbiAgICAgIHJvb3Q6IHRoaXMuX2dldFJvb3REaXJlY3RvcnkoZW50cnkpLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgd29ya3NwYWNlIHJvb3QgZGlyZWN0b3J5IGZvciB0aGUgZW50cnksIG9yIHRoZSBlbnRyeSdzIHBhcmVudC5cbiAgICovXG4gIF9nZXRSb290RGlyZWN0b3J5KGVudHJ5OiBhdG9tJEZpbGUgfCBhdG9tJERpcmVjdG9yeSk6ID9hdG9tJERpcmVjdG9yeSB7XG4gICAgaWYgKCFlbnRyeSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHZhciByb290RGlyZWN0b3J5T2ZFbnRyeSA9IG51bGw7XG4gICAgdmFyIGVudHJ5UGF0aCA9IGVudHJ5LmdldFBhdGgoKTtcbiAgICBhdG9tLnByb2plY3QuZ2V0RGlyZWN0b3JpZXMoKS5zb21lKChkaXJlY3RvcnkpID0+IHtcbiAgICAgIC8vIHNvbWVEaXJlY3RvcnkuY29udGFpbnMoc29tZURpcmVjdG9yeS5nZXRQYXRoKCkpIHJldHVybnMgZmFsc2UsIHNvXG4gICAgICAvLyB3ZSBhbHNvIGhhdmUgdG8gY2hlY2sgZm9yIHRoZSBlcXVpdmFsZW5jZSBvZiB0aGUgcGF0aC5cbiAgICAgIGlmIChkaXJlY3RvcnkuY29udGFpbnMoZW50cnlQYXRoKSB8fCBkaXJlY3RvcnkuZ2V0UGF0aCgpID09PSBlbnRyeVBhdGgpIHtcbiAgICAgICAgcm9vdERpcmVjdG9yeU9mRW50cnkgPSBkaXJlY3Rvcnk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xuXG4gICAgaWYgKCFyb290RGlyZWN0b3J5T2ZFbnRyeSkge1xuICAgICAgcm9vdERpcmVjdG9yeU9mRW50cnkgPSBlbnRyeS5nZXRQYXJlbnQoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcm9vdERpcmVjdG9yeU9mRW50cnk7XG4gIH1cblxuICBfbG9nRXJyb3IoZXJyb3JNZXNzYWdlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX2xvZ2dlcikge1xuICAgICAgdGhpcy5fbG9nZ2VyID0gcmVxdWlyZSgnbnVjbGlkZS1sb2dnaW5nJykuZ2V0TG9nZ2VyKCk7XG4gICAgfVxuICAgIHRoaXMuX2xvZ2dlci5lcnJvcihlcnJvck1lc3NhZ2UpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRmlsZVRyZWVDb250cm9sbGVyO1xuIl19