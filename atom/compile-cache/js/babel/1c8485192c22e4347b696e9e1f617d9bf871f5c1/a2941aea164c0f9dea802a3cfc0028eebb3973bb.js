'use babel';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _require = require('atom');

var CompositeDisposable = _require.CompositeDisposable;

var _require2 = require('events');

var EventEmitter = _require2.EventEmitter;

var LazyTreeNode = require('./LazyTreeNode');
var TreeNodeComponent = require('./TreeNodeComponent');

var _require3 = require('./tree-node-traversals');

var forEachCachedNode = _require3.forEachCachedNode;

var React = require('react-for-atom');

var PropTypes = React.PropTypes;

/**
 * Toggles the existence of a value in a set. If the value exists, deletes it.
 * If the value does not exist, adds it.
 *
 * @param set The set whose value to toggle.
 * @param value The value to toggle in the set.
 * @param [forceHas] If defined, forces the existence of the value in the set
 *     regardless of its current existence. If truthy, adds `value`, if falsy
 *     deletes `value`.
 * @returns `true` if the value was added to the set, otherwise `false`. If
 *     `forceHas` is defined, the return value will be equal to `forceHas`.
 */
function toggleSetHas(set, value, forceHas) {
  var added;

  if (forceHas || forceHas === undefined && !set.has(value)) {
    set.add(value);
    added = true;
  } else {
    set['delete'](value);
    added = false;
  }

  return added;
}

var FIRST_SELECTED_DESCENDANT_REF = 'firstSelectedDescendant';

/**
 * Generic tree component that operates on LazyTreeNodes.
 */
var TreeRootComponent = React.createClass({
  displayName: 'TreeRootComponent',

  _allKeys: null,
  _emitter: null,
  _keyToNode: null,
  _rejectDidUpdateListenerPromise: null,
  _subscriptions: null,

  propTypes: {
    initialRoots: PropTypes.arrayOf(PropTypes.instanceOf(LazyTreeNode)).isRequired,
    eventHandlerSelector: PropTypes.string.isRequired,
    // A node can be confirmed if it is a selected non-container node and the user is clicks on it
    // or presses <enter>.
    onConfirmSelection: PropTypes.func.isRequired,
    // A node can be "kept" (opened permanently) by double clicking it. This only has an effect
    // when the `usePreviewTabs` setting is enabled in the "tabs" package.
    onKeepSelection: PropTypes.func.isRequired,
    labelClassNameForNode: PropTypes.func.isRequired,
    rowClassNameForNode: PropTypes.func,
    // Render will return this component if there are no root nodes.
    elementToRenderWhenEmpty: PropTypes.element,
    initialExpandedNodeKeys: PropTypes.arrayOf(PropTypes.string),
    initialSelectedNodeKeys: PropTypes.arrayOf(PropTypes.string)
  },

  getDefaultProps: function getDefaultProps() {
    return {
      onConfirmSelection: function onConfirmSelection(node) {},
      elementToRenderWhenEmpty: null
    };
  },

  getInitialState: function getInitialState() {
    var rootKeys = this.props.initialRoots.map(function (root) {
      return root.getKey();
    });

    var selectedKeys;
    if (this.props.initialSelectedNodeKeys) {
      selectedKeys = new Set(this.props.initialSelectedNodeKeys);
    } else {
      selectedKeys = new Set(rootKeys.length === 0 ? [] : [rootKeys[0]]);
    }

    return {
      roots: this.props.initialRoots,
      // This is maintained as a set of strings for two reasons:
      // (1) It is straightforward to serialize.
      // (2) If the LazyFileTreeNode for a path is re-created, this will still work.
      expandedKeys: new Set(this.props.initialExpandedNodeKeys || rootKeys),
      selectedKeys: selectedKeys
    };
  },

  componentDidUpdate: function componentDidUpdate(prevProps, prevState) {
    // If the Set of selected items is new, like when navigating the tree with
    // the arrow keys, scroll the first item into view. This addresses the
    // following scenario:
    // (1) Select a node in the tree
    // (2) Scroll the selected node out of the viewport
    // (3) Press the up or down arrow key to change the selected node
    // (4) The new node should scroll into view
    if (!prevState || this.state.selectedKeys !== prevState.selectedKeys) {
      var firstSelectedDescendant = this.refs[FIRST_SELECTED_DESCENDANT_REF];
      if (firstSelectedDescendant !== undefined) {
        firstSelectedDescendant.getDOMNode().scrollIntoViewIfNeeded(false);
      }
    }

    if (this._emitter) {
      this._emitter.emit('did-update');
    }
  },

  _deselectDescendants: function _deselectDescendants(root) {
    var selectedKeys = this.state.selectedKeys;

    forEachCachedNode(root, function (node) {
      // `forEachCachedNode` iterates over the root, but it should remain
      // selected. Skip it.
      if (node === root) {
        return;
      }

      selectedKeys['delete'](node.getKey());
    });

    this.setState({ selectedKeys: selectedKeys });
  },

  _isNodeExpanded: function _isNodeExpanded(node) {
    return this.state.expandedKeys.has(node.getKey());
  },

  _isNodeSelected: function _isNodeSelected(node) {
    return this.state.selectedKeys.has(node.getKey());
  },

  _toggleNodeExpanded: function _toggleNodeExpanded(node, forceExpanded) {
    var expandedKeys = this.state.expandedKeys;
    var keyAdded = toggleSetHas(expandedKeys, node.getKey(), forceExpanded);

    // If the node was collapsed, deselect its descendants so only nodes visible
    // in the tree remain selected.
    if (!keyAdded) {
      this._deselectDescendants(node);
    }

    this.setState({ expandedKeys: expandedKeys });
  },

  _toggleNodeSelected: function _toggleNodeSelected(node, forceSelected) {
    var selectedKeys = this.state.selectedKeys;
    toggleSetHas(selectedKeys, node.getKey(), forceSelected);
    this.setState({ selectedKeys: selectedKeys });
  },

  _onClickNode: function _onClickNode(event, node) {
    if (event.metaKey) {
      this._toggleNodeSelected(node);
      return;
    }

    this.setState({
      selectedKeys: new Set([node.getKey()])
    });

    if (!this._isNodeSelected(node) && (node.isContainer() || !atom.config.get('tabs.usePreviewTabs'))) {
      // User clicked on a new directory or the user isn't using the "Preview Tabs" feature of the
      // `tabs` package, so don't toggle the node's state any further yet.
      return;
    }

    this._confirmNode(node);
  },

  _onClickNodeArrow: function _onClickNodeArrow(event, node) {
    this._toggleNodeExpanded(node);
  },

  _onDoubleClickNode: function _onDoubleClickNode(event, node) {
    // Double clicking a non-directory will keep the created tab open.
    if (!node.isContainer()) {
      this.props.onKeepSelection();
    }
  },

  _onMouseDown: function _onMouseDown(event, node) {
    // Select the node on right-click.
    if (event.button === 2 || event.button === 0 && event.ctrlKey === true) {
      if (!this._isNodeSelected(node)) {
        this.setState({ selectedKeys: new Set([node.getKey()]) });
      }
    }
  },

  addContextMenuItemGroup: function addContextMenuItemGroup(menuItemDefinitions) {
    var _this = this;

    var items = menuItemDefinitions.slice();
    items = items.map(function (definition) {
      definition.shouldDisplay = function () {
        if (_this.state.roots.length === 0 && !definition.shouldDisplayIfTreeIsEmpty) {
          return false;
        }
        if (definition.shouldDisplayForSelectedNodes) {
          return definition.shouldDisplayForSelectedNodes(_this.getSelectedNodes());
        }
        return true;
      };
      return definition;
    });

    // Atom is smart about only displaying a separator when there are items to
    // separate, so there will never be a dangling separator at the end.
    items.push({ type: 'separator' });

    // TODO: Use a computed property when supported by Flow.
    var contextMenuObj = {};
    contextMenuObj[this.props.eventHandlerSelector] = items;
    atom.contextMenu.add(contextMenuObj);
  },

  render: function render() {
    var _this2 = this;

    if (this.state.roots.length === 0) {
      return this.props.elementToRenderWhenEmpty;
    }

    var children = [];
    var expandedKeys = this.state.expandedKeys;
    var foundFirstSelectedDescendant = false;

    var promises = [];
    var allKeys = [];
    var keyToNode = {};

    this.state.roots.forEach(function (root) {
      var stack = [{ node: root, depth: 0 }];

      while (stack.length !== 0) {
        // Pop off the top of the stack and add it to the list of nodes to display.
        var item = stack.pop();
        var node = item.node;

        // Keep a reference the first selected descendant with
        // `this.refs[FIRST_SELECTED_DESCENDANT_REF]`.
        var isNodeSelected = _this2._isNodeSelected(node);
        var ref = null;
        if (!foundFirstSelectedDescendant && isNodeSelected) {
          foundFirstSelectedDescendant = true;
          ref = FIRST_SELECTED_DESCENDANT_REF;
        }

        var child = React.createElement(TreeNodeComponent, _extends({}, item, {
          isExpanded: _this2._isNodeExpanded,
          isSelected: isNodeSelected,
          labelClassNameForNode: _this2.props.labelClassNameForNode,
          rowClassNameForNode: _this2.props.rowClassNameForNode,
          onClickArrow: _this2._onClickNodeArrow,
          onClick: _this2._onClickNode,
          onDoubleClick: _this2._onDoubleClickNode,
          onMouseDown: _this2._onMouseDown,
          key: node.getKey(),
          ref: ref
        }));
        children.push(child);
        allKeys.push(node.getKey());
        keyToNode[node.getKey()] = node;

        // Check whether the node has any children that should be displayed.
        if (!node.isContainer() || !expandedKeys.has(node.getKey())) {
          continue;
        }

        var cachedChildren = node.getCachedChildren();
        if (!cachedChildren || !node.isCacheValid()) {
          promises.push(node.fetchChildren());
        }

        // Prevent flickering by always rendering cached children -- if they're invalid,
        // then the fetch will happen soon.
        if (cachedChildren) {
          var depth = item.depth + 1;
          // Push the node's children on the stack in reverse order so that when
          // they are popped off the stack, they are iterated in the original
          // order.
          cachedChildren.reverse().forEach(function (childNode) {
            stack.push({ node: childNode, depth: depth });
          });
        }
      }
    });

    if (promises.length) {
      Promise.all(promises).then(function () {
        // The component could have been unmounted by the time the promises are resolved.
        if (_this2.isMounted()) {
          _this2.forceUpdate();
        }
      });
    }

    this._allKeys = allKeys;
    this._keyToNode = keyToNode;
    return React.createElement(
      'div',
      { className: 'nuclide-tree-root' },
      children
    );
  },

  componentWillMount: function componentWillMount() {
    var _this3 = this;

    var allKeys = [];
    var keyToNode = {};

    this.state.roots.forEach(function (root) {
      var rootKey = root.getKey();
      allKeys.push(rootKey);
      keyToNode[rootKey] = root;
    });

    var subscriptions = new CompositeDisposable();
    subscriptions.add(atom.commands.add(this.props.eventHandlerSelector, {
      // Expand and collapse.
      'core:move-right': function coreMoveRight() {
        return _this3._expandSelection();
      },
      'core:move-left': function coreMoveLeft() {
        return _this3._collapseSelection();
      },

      // Move selection up and down.
      'core:move-up': function coreMoveUp() {
        return _this3._moveSelectionUp();
      },
      'core:move-down': function coreMoveDown() {
        return _this3._moveSelectionDown();
      },

      'core:confirm': function coreConfirm() {
        return _this3._confirmSelection();
      }
    }));

    this._allKeys = allKeys;
    this._emitter = new EventEmitter();
    this._keyToNode = keyToNode;
    this._subscriptions = subscriptions;
  },

  componentWillUnmount: function componentWillUnmount() {
    if (this._subscriptions) {
      this._subscriptions.dispose();
    }
    if (this._emitter) {
      this._emitter.removeAllListeners();
    }
  },

  serialize: function serialize() {
    var from = require('nuclide-commons').array.from;

    return {
      expandedNodeKeys: from(this.state.expandedKeys),
      selectedNodeKeys: from(this.state.selectedKeys)
    };
  },

  invalidateCachedNodes: function invalidateCachedNodes() {
    this.state.roots.forEach(function (root) {
      forEachCachedNode(root, function (node) {
        node.invalidateCache();
      });
    });
  },

  /**
   * Returns a Promise that's resolved when the roots are rendered.
   */
  setRoots: function setRoots(roots) {
    var _this4 = this;

    this.state.roots.forEach(function (root) {
      _this4.removeStateForSubtree(root);
    });

    var expandedKeys = this.state.expandedKeys;
    roots.forEach(function (root) {
      return expandedKeys.add(root.getKey());
    });

    // We have to create the listener before setting the state so it can pick
    // up the changes from `setState`.
    var promise = this._createDidUpdateListener( /* shouldResolve */function () {
      var rootsReady = _this4.state.roots === roots;
      var childrenReady = _this4.state.roots.every(function (root) {
        return root.isCacheValid();
      });
      return rootsReady && childrenReady;
    });

    this.setState({
      roots: roots,
      expandedKeys: expandedKeys
    });

    return promise;
  },

  _createDidUpdateListener: function _createDidUpdateListener(shouldResolve) {
    var _this5 = this;

    return new Promise(function (resolve, reject) {
      var listener = function listener() {
        if (shouldResolve()) {
          resolve(undefined);

          // Set this to null so this promise can't be rejected anymore.
          _this5._rejectDidUpdateListenerPromise = null;
          if (_this5._emitter) {
            _this5._emitter.removeListener('did-update', listener);
          }
        }
      };

      if (_this5._emitter) {
        _this5._emitter.addListener('did-update', listener);
      }

      // We need to reject the previous promise, so it doesn't get leaked.
      if (_this5._rejectDidUpdateListenerPromise) {
        _this5._rejectDidUpdateListenerPromise();
        _this5._rejectDidUpdateListenerPromise = null;
      }
      _this5._rejectDidUpdateListenerPromise = function () {
        reject(undefined);
        if (_this5._emitter) {
          _this5._emitter.removeListener('did-update', listener);
        }
      };
    });
  },

  removeStateForSubtree: function removeStateForSubtree(root) {
    var expandedKeys = this.state.expandedKeys;
    var selectedKeys = this.state.selectedKeys;

    forEachCachedNode(root, function (node) {
      var cachedKey = node.getKey();
      expandedKeys['delete'](cachedKey);
      selectedKeys['delete'](cachedKey);
    });

    this.setState({
      expandedKeys: expandedKeys,
      selectedKeys: selectedKeys
    });
  },

  getRootNodes: function getRootNodes() {
    return this.state.roots;
  },

  getExpandedNodes: function getExpandedNodes() {
    var _this6 = this;

    var expandedNodes = [];
    this.state.expandedKeys.forEach(function (key) {
      var node = _this6.getNodeForKey(key);
      if (node != null) {
        expandedNodes.push(node);
      }
    });
    return expandedNodes;
  },

  getSelectedNodes: function getSelectedNodes() {
    var _this7 = this;

    var selectedNodes = [];
    this.state.selectedKeys.forEach(function (key) {
      var node = _this7.getNodeForKey(key);
      if (node != null) {
        selectedNodes.push(node);
      }
    });
    return selectedNodes;
  },

  // Return the key for the first node that is selected, or null if there are none.
  _getFirstSelectedKey: function _getFirstSelectedKey() {
    var _this8 = this;

    if (this.state.selectedKeys.size === 0) {
      return null;
    }

    var selectedKey;
    if (this._allKeys != null) {
      this._allKeys.every(function (key) {
        if (_this8.state.selectedKeys.has(key)) {
          selectedKey = key;
          return false;
        }
        return true;
      });
    }

    return selectedKey;
  },

  _expandSelection: function _expandSelection() {
    var key = this._getFirstSelectedKey();
    if (key) {
      this.expandNodeKey(key);
    }
  },

  /**
   * Selects a node by key if it's in the file tree; otherwise, do nothing.
   */
  selectNodeKey: function selectNodeKey(nodeKey) {
    var _this9 = this;

    if (!this.getNodeForKey(nodeKey)) {
      return Promise.reject();
    }

    // We have to create the listener before setting the state so it can pick
    // up the changes from `setState`.
    var promise = this._createDidUpdateListener( /* shouldResolve */function () {
      return _this9.state.selectedKeys.has(nodeKey);
    });
    this.setState({ selectedKeys: new Set([nodeKey]) });
    return promise;
  },

  getNodeForKey: function getNodeForKey(nodeKey) {
    if (this._keyToNode != null) {
      return this._keyToNode[nodeKey];
    }
  },

  /**
   * If this function is called multiple times in parallel, the later calls will
   * cause the previous promises to reject even if they end up expanding the
   * node key successfully.
   *
   * If we don't reject, then we might leak promises if a node key is expanded
   * and collapsed in succession (the collapse could succeed first, causing
   * the expand to never resolve).
   */
  expandNodeKey: function expandNodeKey(nodeKey) {
    var _this10 = this;

    var node = this.getNodeForKey(nodeKey);

    if (node && node.isContainer()) {
      var promise = this._createDidUpdateListener( /* shouldResolve */function () {
        var isExpanded = _this10.state.expandedKeys.has(nodeKey);
        var node = _this10.getNodeForKey(nodeKey);
        var isDoneFetching = node && node.isContainer() && node.isCacheValid();
        return isExpanded && isDoneFetching;
      });
      this._toggleNodeExpanded(node, true /* forceExpanded */);
      return promise;
    }

    return Promise.resolve();
  },

  collapseNodeKey: function collapseNodeKey(nodeKey) {
    var _this11 = this;

    var node = this.getNodeForKey(nodeKey);

    if (node && node.isContainer()) {
      var promise = this._createDidUpdateListener( /* shouldResolve */function () {
        return !_this11.state.expandedKeys.has(nodeKey);
      });
      this._toggleNodeExpanded(node, false /* forceExpanded */);
      return promise;
    }

    return Promise.resolve();
  },

  isNodeKeyExpanded: function isNodeKeyExpanded(nodeKey) {
    return this.state.expandedKeys.has(nodeKey);
  },

  _collapseSelection: function _collapseSelection() {
    var key = this._getFirstSelectedKey();
    if (!key) {
      return;
    }

    var expandedKeys = this.state.expandedKeys;
    var node = this.getNodeForKey(key);
    if (node != null && (!expandedKeys.has(key) || !node.isContainer())) {
      // If the selection is already collapsed or it's not a container, select its parent.
      var parent = node.getParent();
      if (parent) {
        this.selectNodeKey(parent.getKey());
      }
    }

    this.collapseNodeKey(key);
  },

  _moveSelectionUp: function _moveSelectionUp() {
    var allKeys = this._allKeys;
    if (!allKeys) {
      return;
    }

    var keyIndexToSelect = allKeys.length - 1;
    var key = this._getFirstSelectedKey();
    if (key) {
      keyIndexToSelect = allKeys.indexOf(key);
      if (keyIndexToSelect > 0) {
        --keyIndexToSelect;
      }
    }

    this.setState({ selectedKeys: new Set([allKeys[keyIndexToSelect]]) });
  },

  _moveSelectionDown: function _moveSelectionDown() {
    var allKeys = this._allKeys;
    if (!allKeys) {
      return;
    }

    var keyIndexToSelect = 0;
    var key = this._getFirstSelectedKey();
    if (key) {
      keyIndexToSelect = allKeys.indexOf(key);
      if (keyIndexToSelect !== -1 && keyIndexToSelect < allKeys.length - 1) {
        ++keyIndexToSelect;
      }
    }

    this.setState({ selectedKeys: new Set([allKeys[keyIndexToSelect]]) });
  },

  _confirmSelection: function _confirmSelection() {
    var key = this._getFirstSelectedKey();
    if (key) {
      var node = this.getNodeForKey(key);
      if (node) {
        this._confirmNode(node);
      }
    }
  },

  _confirmNode: function _confirmNode(node) {
    if (node.isContainer()) {
      this._toggleNodeExpanded(node);
    } else {
      this.props.onConfirmSelection(node);
    }
  }
});

module.exports = TreeRootComponent;

// By default, no context menu item will be displayed if the tree is empty.
// Set this to true to override that behavior.
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtdHJlZS9ub2RlX21vZHVsZXMvbnVjbGlkZS11aS10cmVlL2xpYi9UcmVlUm9vdENvbXBvbmVudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7O2VBV2dCLE9BQU8sQ0FBQyxNQUFNLENBQUM7O0lBQXRDLG1CQUFtQixZQUFuQixtQkFBbUI7O2dCQUNILE9BQU8sQ0FBQyxRQUFRLENBQUM7O0lBQWpDLFlBQVksYUFBWixZQUFZOztBQUNqQixJQUFJLFlBQVksR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUM3QyxJQUFJLGlCQUFpQixHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDOztnQkFDN0IsT0FBTyxDQUFDLHdCQUF3QixDQUFDOztJQUF0RCxpQkFBaUIsYUFBakIsaUJBQWlCOztBQUN0QixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQzs7SUFFakMsU0FBUyxHQUFJLEtBQUssQ0FBbEIsU0FBUzs7Ozs7Ozs7Ozs7Ozs7QUErQmQsU0FBUyxZQUFZLENBQ2pCLEdBQWdCLEVBQ2hCLEtBQWEsRUFDYixRQUFtQixFQUNaO0FBQ1QsTUFBSSxLQUFLLENBQUM7O0FBRVYsTUFBSSxRQUFRLElBQUssUUFBUSxLQUFLLFNBQVMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEFBQUMsRUFBRTtBQUMzRCxPQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2YsU0FBSyxHQUFHLElBQUksQ0FBQztHQUNkLE1BQU07QUFDTCxPQUFHLFVBQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNsQixTQUFLLEdBQUcsS0FBSyxDQUFDO0dBQ2Y7O0FBRUQsU0FBTyxLQUFLLENBQUM7Q0FDZDs7QUFFRCxJQUFJLDZCQUFxQyxHQUFHLHlCQUF5QixDQUFD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QUMsV0FBVyxFQUFFLEVBQUU7QUFDdEIsVUFBSSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ2hDLE1BQU07QUFDTCxVQUFJLENBQUMsS0FBSyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ3JDO0dBQ0Y7Q0FDRixDQUFDLENBQUM7O0FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRyxpQkFBaUIsQ0FBQyIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvbnVjbGlkZS1maWxlLXRyZWUvbm9kZV9tb2R1bGVzL251Y2xpZGUtdWktdHJlZS9saWIvVHJlZVJvb3RDb21wb25lbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIge0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSgnYXRvbScpO1xudmFyIHtFdmVudEVtaXR0ZXJ9ID0gcmVxdWlyZSgnZXZlbnRzJyk7XG52YXIgTGF6eVRyZWVOb2RlID0gcmVxdWlyZSgnLi9MYXp5VHJlZU5vZGUnKTtcbnZhciBUcmVlTm9kZUNvbXBvbmVudCA9IHJlcXVpcmUoJy4vVHJlZU5vZGVDb21wb25lbnQnKTtcbnZhciB7Zm9yRWFjaENhY2hlZE5vZGV9ID0gcmVxdWlyZSgnLi90cmVlLW5vZGUtdHJhdmVyc2FscycpO1xudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QtZm9yLWF0b20nKTtcblxudmFyIHtQcm9wVHlwZXN9ID0gUmVhY3Q7XG5cbnR5cGUgVHJlZU1lbnVJdGVtRGVmaW5pdGlvbiA9IHtcbiAgbGFiZWw6IHN0cmluZztcbiAgY29tbWFuZDogc3RyaW5nO1xuICBzdWJtZW51OiA/QXJyYXk8VHJlZU1lbnVJdGVtRGVmaW5pdGlvbj47XG4gIHNob3VsZERpc3BsYXk6ID8oKSA9PiBib29sZWFuO1xuICBzaG91bGREaXNwbGF5Rm9yU2VsZWN0ZWROb2RlczogPyhub2RlczogQXJyYXk8TGF6eVRyZWVOb2RlPikgPT4gYm9vbGVhbjtcblxuICAvLyBCeSBkZWZhdWx0LCBubyBjb250ZXh0IG1lbnUgaXRlbSB3aWxsIGJlIGRpc3BsYXllZCBpZiB0aGUgdHJlZSBpcyBlbXB0eS5cbiAgLy8gU2V0IHRoaXMgdG8gdHJ1ZSB0byBvdmVycmlkZSB0aGF0IGJlaGF2aW9yLlxuICBzaG91bGREaXNwbGF5SWZUcmVlSXNFbXB0eTogP2Jvb2xlYW47XG59O1xuXG50eXBlIFRyZWVDb21wb25lbnRTdGF0ZSA9IHtcbiAgZXhwYW5kZWROb2RlS2V5czogQXJyYXk8c3RyaW5nPjtcbiAgc2VsZWN0ZWROb2RlS2V5czogQXJyYXk8c3RyaW5nPjtcbn07XG5cbi8qKlxuICogVG9nZ2xlcyB0aGUgZXhpc3RlbmNlIG9mIGEgdmFsdWUgaW4gYSBzZXQuIElmIHRoZSB2YWx1ZSBleGlzdHMsIGRlbGV0ZXMgaXQuXG4gKiBJZiB0aGUgdmFsdWUgZG9lcyBub3QgZXhpc3QsIGFkZHMgaXQuXG4gKlxuICogQHBhcmFtIHNldCBUaGUgc2V0IHdob3NlIHZhbHVlIHRvIHRvZ2dsZS5cbiAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gdG9nZ2xlIGluIHRoZSBzZXQuXG4gKiBAcGFyYW0gW2ZvcmNlSGFzXSBJZiBkZWZpbmVkLCBmb3JjZXMgdGhlIGV4aXN0ZW5jZSBvZiB0aGUgdmFsdWUgaW4gdGhlIHNldFxuICogICAgIHJlZ2FyZGxlc3Mgb2YgaXRzIGN1cnJlbnQgZXhpc3RlbmNlLiBJZiB0cnV0aHksIGFkZHMgYHZhbHVlYCwgaWYgZmFsc3lcbiAqICAgICBkZWxldGVzIGB2YWx1ZWAuXG4gKiBAcmV0dXJucyBgdHJ1ZWAgaWYgdGhlIHZhbHVlIHdhcyBhZGRlZCB0byB0aGUgc2V0LCBvdGhlcndpc2UgYGZhbHNlYC4gSWZcbiAqICAgICBgZm9yY2VIYXNgIGlzIGRlZmluZWQsIHRoZSByZXR1cm4gdmFsdWUgd2lsbCBiZSBlcXVhbCB0byBgZm9yY2VIYXNgLlxuICovXG5mdW5jdGlvbiB0b2dnbGVTZXRIYXMoXG4gICAgc2V0OiBTZXQ8c3RyaW5nPixcbiAgICB2YWx1ZTogc3RyaW5nLFxuICAgIGZvcmNlSGFzPzogP2Jvb2xlYW5cbik6IGJvb2xlYW4ge1xuICB2YXIgYWRkZWQ7XG5cbiAgaWYgKGZvcmNlSGFzIHx8IChmb3JjZUhhcyA9PT0gdW5kZWZpbmVkICYmICFzZXQuaGFzKHZhbHVlKSkpIHtcbiAgICBzZXQuYWRkKHZhbHVlKTtcbiAgICBhZGRlZCA9IHRydWU7XG4gIH0gZWxzZSB7XG4gICAgc2V0LmRlbGV0ZSh2YWx1ZSk7XG4gICAgYWRkZWQgPSBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiBhZGRlZDtcbn1cblxudmFyIEZJUlNUX1NFTEVDVEVEX0RFU0NFTkRBTlRfUkVGOiBzdHJpbmcgPSAnZmlyc3RTZWxlY3RlZERlc2NlbmRhbnQnO1xuXG4vKipcbiAqIEdlbmVyaWMgdHJlZSBjb21wb25lbnQgdGhhdCBvcGVyYXRlcyBvbiBMYXp5VHJlZU5vZGVzLlxuICovXG52YXIgVHJlZVJvb3RDb21wb25lbnQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIF9hbGxLZXlzOiAobnVsbDogP0FycmF5PHN0cmluZz4pLFxuICBfZW1pdHRlcjogKG51bGw6ID9FdmVudEVtaXR0ZXIpLFxuICBfa2V5VG9Ob2RlOiAobnVsbDogP3tba2V5OiBzdHJpbmddOiBMYXp5VHJlZU5vZGV9KSxcbiAgX3JlamVjdERpZFVwZGF0ZUxpc3RlbmVyUHJvbWlzZTogKG51bGw6ID8oKSA9PiB2b2lkKSxcbiAgX3N1YnNjcmlwdGlvbnM6IChudWxsOiA/Q29tcG9zaXRlRGlzcG9zYWJsZSksXG5cbiAgcHJvcFR5cGVzOiB7XG4gICAgaW5pdGlhbFJvb3RzOiBQcm9wVHlwZXMuYXJyYXlPZihQcm9wVHlwZXMuaW5zdGFuY2VPZihMYXp5VHJlZU5vZGUpKS5pc1JlcXVpcmVkLFxuICAgIGV2ZW50SGFuZGxlclNlbGVjdG9yOiBQcm9wVHlwZXMuc3RyaW5nLmlzUmVxdWlyZWQsXG4gICAgLy8gQSBub2RlIGNhbiBiZSBjb25maXJtZWQgaWYgaXQgaXMgYSBzZWxlY3RlZCBub24tY29udGFpbmVyIG5vZGUgYW5kIHRoZSB1c2VyIGlzIGNsaWNrcyBvbiBpdFxuICAgIC8vIG9yIHByZXNzZXMgPGVudGVyPi5cbiAgICBvbkNvbmZpcm1TZWxlY3Rpb246IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgLy8gQSBub2RlIGNhbiBiZSBcImtlcHRcIiAob3BlbmVkIHBlcm1hbmVudGx5KSBieSBkb3VibGUgY2xpY2tpbmcgaXQuIFRoaXMgb25seSBoYXMgYW4gZWZmZWN0XG4gICAgLy8gd2hlbiB0aGUgYHVzZVByZXZpZXdUYWJzYCBzZXR0aW5nIGlzIGVuYWJsZWQgaW4gdGhlIFwidGFic1wiIHBhY2thZ2UuXG4gICAgb25LZWVwU2VsZWN0aW9uOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgIGxhYmVsQ2xhc3NOYW1lRm9yTm9kZTogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICByb3dDbGFzc05hbWVGb3JOb2RlOiBQcm9wVHlwZXMuZnVuYyxcbiAgICAvLyBSZW5kZXIgd2lsbCByZXR1cm4gdGhpcyBjb21wb25lbnQgaWYgdGhlcmUgYXJlIG5vIHJvb3Qgbm9kZXMuXG4gICAgZWxlbWVudFRvUmVuZGVyV2hlbkVtcHR5OiBQcm9wVHlwZXMuZWxlbWVudCxcbiAgICBpbml0aWFsRXhwYW5kZWROb2RlS2V5czogUHJvcFR5cGVzLmFycmF5T2YoUHJvcFR5cGVzLnN0cmluZyksXG4gICAgaW5pdGlhbFNlbGVjdGVkTm9kZUtleXM6IFByb3BUeXBlcy5hcnJheU9mKFByb3BUeXBlcy5zdHJpbmcpLFxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wcygpOiBhbnkge1xuICAgIHJldHVybiB7XG4gICAgICBvbkNvbmZpcm1TZWxlY3Rpb24obm9kZTogTGF6eVRyZWVOb2RlKSB7fSxcbiAgICAgIGVsZW1lbnRUb1JlbmRlcldoZW5FbXB0eTogbnVsbCxcbiAgICB9O1xuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZSgpOiBhbnkge1xuICAgIHZhciByb290S2V5cyA9IHRoaXMucHJvcHMuaW5pdGlhbFJvb3RzLm1hcCgocm9vdCkgPT4gcm9vdC5nZXRLZXkoKSk7XG5cbiAgICB2YXIgc2VsZWN0ZWRLZXlzO1xuICAgIGlmICh0aGlzLnByb3BzLmluaXRpYWxTZWxlY3RlZE5vZGVLZXlzKSB7XG4gICAgICBzZWxlY3RlZEtleXMgPSBuZXcgU2V0KHRoaXMucHJvcHMuaW5pdGlhbFNlbGVjdGVkTm9kZUtleXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZWxlY3RlZEtleXMgPSBuZXcgU2V0KHJvb3RLZXlzLmxlbmd0aCA9PT0gMCA/IFtdIDogW3Jvb3RLZXlzWzBdXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHJvb3RzOiB0aGlzLnByb3BzLmluaXRpYWxSb290cyxcbiAgICAgIC8vIFRoaXMgaXMgbWFpbnRhaW5lZCBhcyBhIHNldCBvZiBzdHJpbmdzIGZvciB0d28gcmVhc29uczpcbiAgICAgIC8vICgxKSBJdCBpcyBzdHJhaWdodGZvcndhcmQgdG8gc2VyaWFsaXplLlxuICAgICAgLy8gKDIpIElmIHRoZSBMYXp5RmlsZVRyZWVOb2RlIGZvciBhIHBhdGggaXMgcmUtY3JlYXRlZCwgdGhpcyB3aWxsIHN0aWxsIHdvcmsuXG4gICAgICBleHBhbmRlZEtleXM6IG5ldyBTZXQodGhpcy5wcm9wcy5pbml0aWFsRXhwYW5kZWROb2RlS2V5cyB8fCByb290S2V5cyksXG4gICAgICBzZWxlY3RlZEtleXMsXG4gICAgfTtcbiAgfSxcblxuICBjb21wb25lbnREaWRVcGRhdGUocHJldlByb3BzOiBPYmplY3QsIHByZXZTdGF0ZTogP09iamVjdCk6IHZvaWQge1xuICAgIC8vIElmIHRoZSBTZXQgb2Ygc2VsZWN0ZWQgaXRlbXMgaXMgbmV3LCBsaWtlIHdoZW4gbmF2aWdhdGluZyB0aGUgdHJlZSB3aXRoXG4gICAgLy8gdGhlIGFycm93IGtleXMsIHNjcm9sbCB0aGUgZmlyc3QgaXRlbSBpbnRvIHZpZXcuIFRoaXMgYWRkcmVzc2VzIHRoZVxuICAgIC8vIGZvbGxvd2luZyBzY2VuYXJpbzpcbiAgICAvLyAoMSkgU2VsZWN0IGEgbm9kZSBpbiB0aGUgdHJlZVxuICAgIC8vICgyKSBTY3JvbGwgdGhlIHNlbGVjdGVkIG5vZGUgb3V0IG9mIHRoZSB2aWV3cG9ydFxuICAgIC8vICgzKSBQcmVzcyB0aGUgdXAgb3IgZG93biBhcnJvdyBrZXkgdG8gY2hhbmdlIHRoZSBzZWxlY3RlZCBub2RlXG4gICAgLy8gKDQpIFRoZSBuZXcgbm9kZSBzaG91bGQgc2Nyb2xsIGludG8gdmlld1xuICAgIGlmICghcHJldlN0YXRlIHx8IHRoaXMuc3RhdGUuc2VsZWN0ZWRLZXlzICE9PSBwcmV2U3RhdGUuc2VsZWN0ZWRLZXlzKSB7XG4gICAgICB2YXIgZmlyc3RTZWxlY3RlZERlc2NlbmRhbnQgPSB0aGlzLnJlZnNbRklSU1RfU0VMRUNURURfREVTQ0VOREFOVF9SRUZdO1xuICAgICAgaWYgKGZpcnN0U2VsZWN0ZWREZXNjZW5kYW50ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZmlyc3RTZWxlY3RlZERlc2NlbmRhbnQuZ2V0RE9NTm9kZSgpLnNjcm9sbEludG9WaWV3SWZOZWVkZWQoZmFsc2UpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLl9lbWl0dGVyKSB7XG4gICAgICB0aGlzLl9lbWl0dGVyLmVtaXQoJ2RpZC11cGRhdGUnKTtcbiAgICB9XG4gIH0sXG5cbiAgX2Rlc2VsZWN0RGVzY2VuZGFudHMocm9vdDogTGF6eVRyZWVOb2RlKTogdm9pZCB7XG4gICAgdmFyIHNlbGVjdGVkS2V5cyA9IHRoaXMuc3RhdGUuc2VsZWN0ZWRLZXlzO1xuXG4gICAgZm9yRWFjaENhY2hlZE5vZGUocm9vdCwgbm9kZSA9PiB7XG4gICAgICAvLyBgZm9yRWFjaENhY2hlZE5vZGVgIGl0ZXJhdGVzIG92ZXIgdGhlIHJvb3QsIGJ1dCBpdCBzaG91bGQgcmVtYWluXG4gICAgICAvLyBzZWxlY3RlZC4gU2tpcCBpdC5cbiAgICAgIGlmIChub2RlID09PSByb290KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgc2VsZWN0ZWRLZXlzLmRlbGV0ZShub2RlLmdldEtleSgpKTtcbiAgICB9KTtcblxuICAgIHRoaXMuc2V0U3RhdGUoe3NlbGVjdGVkS2V5c30pO1xuICB9LFxuXG4gIF9pc05vZGVFeHBhbmRlZChub2RlOiBMYXp5VHJlZU5vZGUpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5zdGF0ZS5leHBhbmRlZEtleXMuaGFzKG5vZGUuZ2V0S2V5KCkpO1xuICB9LFxuXG4gIF9pc05vZGVTZWxlY3RlZChub2RlOiBMYXp5VHJlZU5vZGUpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5zdGF0ZS5zZWxlY3RlZEtleXMuaGFzKG5vZGUuZ2V0S2V5KCkpO1xuICB9LFxuXG4gIF90b2dnbGVOb2RlRXhwYW5kZWQobm9kZTogTGF6eVRyZWVOb2RlLCBmb3JjZUV4cGFuZGVkPzogP2Jvb2xlYW4pOiB2b2lkIHtcbiAgICB2YXIgZXhwYW5kZWRLZXlzID0gdGhpcy5zdGF0ZS5leHBhbmRlZEtleXM7XG4gICAgdmFyIGtleUFkZGVkID0gdG9nZ2xlU2V0SGFzKGV4cGFuZGVkS2V5cywgbm9kZS5nZXRLZXkoKSwgZm9yY2VFeHBhbmRlZCk7XG5cbiAgICAvLyBJZiB0aGUgbm9kZSB3YXMgY29sbGFwc2VkLCBkZXNlbGVjdCBpdHMgZGVzY2VuZGFudHMgc28gb25seSBub2RlcyB2aXNpYmxlXG4gICAgLy8gaW4gdGhlIHRyZWUgcmVtYWluIHNlbGVjdGVkLlxuICAgIGlmICgha2V5QWRkZWQpIHtcbiAgICAgIHRoaXMuX2Rlc2VsZWN0RGVzY2VuZGFudHMobm9kZSk7XG4gICAgfVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7ZXhwYW5kZWRLZXlzfSk7XG4gIH0sXG5cbiAgX3RvZ2dsZU5vZGVTZWxlY3RlZChub2RlOiBMYXp5VHJlZU5vZGUsIGZvcmNlU2VsZWN0ZWQ/OiA/Ym9vbGVhbik6IHZvaWQge1xuICAgIHZhciBzZWxlY3RlZEtleXMgPSB0aGlzLnN0YXRlLnNlbGVjdGVkS2V5cztcbiAgICB0b2dnbGVTZXRIYXMoc2VsZWN0ZWRLZXlzLCBub2RlLmdldEtleSgpLCBmb3JjZVNlbGVjdGVkKTtcbiAgICB0aGlzLnNldFN0YXRlKHtzZWxlY3RlZEtleXN9KTtcbiAgfSxcblxuICBfb25DbGlja05vZGUoZXZlbnQ6IFN5bnRoZXRpY01vdXNlRXZlbnQsIG5vZGU6IExhenlUcmVlTm9kZSk6IHZvaWQge1xuICAgIGlmIChldmVudC5tZXRhS2V5KSB7XG4gICAgICB0aGlzLl90b2dnbGVOb2RlU2VsZWN0ZWQobm9kZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBzZWxlY3RlZEtleXM6IG5ldyBTZXQoW25vZGUuZ2V0S2V5KCldKSxcbiAgICB9KTtcblxuICAgIGlmICghdGhpcy5faXNOb2RlU2VsZWN0ZWQobm9kZSkgJiZcbiAgICAgICAgKG5vZGUuaXNDb250YWluZXIoKSB8fCAhYXRvbS5jb25maWcuZ2V0KCd0YWJzLnVzZVByZXZpZXdUYWJzJykpKSB7XG4gICAgICAvLyBVc2VyIGNsaWNrZWQgb24gYSBuZXcgZGlyZWN0b3J5IG9yIHRoZSB1c2VyIGlzbid0IHVzaW5nIHRoZSBcIlByZXZpZXcgVGFic1wiIGZlYXR1cmUgb2YgdGhlXG4gICAgICAvLyBgdGFic2AgcGFja2FnZSwgc28gZG9uJ3QgdG9nZ2xlIHRoZSBub2RlJ3Mgc3RhdGUgYW55IGZ1cnRoZXIgeWV0LlxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX2NvbmZpcm1Ob2RlKG5vZGUpO1xuICB9LFxuXG4gIF9vbkNsaWNrTm9kZUFycm93KGV2ZW50OiBTeW50aGV0aWNFdmVudCwgbm9kZTogTGF6eVRyZWVOb2RlKTogdm9pZCB7XG4gICAgdGhpcy5fdG9nZ2xlTm9kZUV4cGFuZGVkKG5vZGUpO1xuICB9LFxuXG4gIF9vbkRvdWJsZUNsaWNrTm9kZShldmVudDogU3ludGhldGljTW91c2VFdmVudCwgbm9kZTogTGF6eVRyZWVOb2RlKTogdm9pZCB7XG4gICAgLy8gRG91YmxlIGNsaWNraW5nIGEgbm9uLWRpcmVjdG9yeSB3aWxsIGtlZXAgdGhlIGNyZWF0ZWQgdGFiIG9wZW4uXG4gICAgaWYgKCFub2RlLmlzQ29udGFpbmVyKCkpIHtcbiAgICAgIHRoaXMucHJvcHMub25LZWVwU2VsZWN0aW9uKCk7XG4gICAgfVxuICB9LFxuXG4gIF9vbk1vdXNlRG93bihldmVudDogU3ludGhldGljTW91c2VFdmVudCwgbm9kZTogTGF6eVRyZWVOb2RlKTogdm9pZCB7XG4gICAgLy8gU2VsZWN0IHRoZSBub2RlIG9uIHJpZ2h0LWNsaWNrLlxuICAgIGlmIChldmVudC5idXR0b24gPT09IDIgfHwgKGV2ZW50LmJ1dHRvbiA9PT0gMCAmJiBldmVudC5jdHJsS2V5ID09PSB0cnVlKSkge1xuICAgICAgaWYgKCF0aGlzLl9pc05vZGVTZWxlY3RlZChub2RlKSkge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtzZWxlY3RlZEtleXM6IG5ldyBTZXQoW25vZGUuZ2V0S2V5KCldKX0pO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBhZGRDb250ZXh0TWVudUl0ZW1Hcm91cChtZW51SXRlbURlZmluaXRpb25zOiBBcnJheTxUcmVlTWVudUl0ZW1EZWZpbml0aW9uPik6IHZvaWQge1xuICAgIHZhciBpdGVtcyA9IG1lbnVJdGVtRGVmaW5pdGlvbnMuc2xpY2UoKTtcbiAgICBpdGVtcyA9IGl0ZW1zLm1hcCgoZGVmaW5pdGlvbikgPT4ge1xuICAgICAgZGVmaW5pdGlvbi5zaG91bGREaXNwbGF5ID0gKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5yb290cy5sZW5ndGggPT09IDAgJiYgIWRlZmluaXRpb24uc2hvdWxkRGlzcGxheUlmVHJlZUlzRW1wdHkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRlZmluaXRpb24uc2hvdWxkRGlzcGxheUZvclNlbGVjdGVkTm9kZXMpIHtcbiAgICAgICAgICByZXR1cm4gZGVmaW5pdGlvbi5zaG91bGREaXNwbGF5Rm9yU2VsZWN0ZWROb2Rlcyh0aGlzLmdldFNlbGVjdGVkTm9kZXMoKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9O1xuICAgICAgcmV0dXJuIGRlZmluaXRpb247XG4gICAgfSk7XG5cbiAgICAvLyBBdG9tIGlzIHNtYXJ0IGFib3V0IG9ubHkgZGlzcGxheWluZyBhIHNlcGFyYXRvciB3aGVuIHRoZXJlIGFyZSBpdGVtcyB0b1xuICAgIC8vIHNlcGFyYXRlLCBzbyB0aGVyZSB3aWxsIG5ldmVyIGJlIGEgZGFuZ2xpbmcgc2VwYXJhdG9yIGF0IHRoZSBlbmQuXG4gICAgaXRlbXMucHVzaCh7dHlwZTogJ3NlcGFyYXRvcid9KTtcblxuICAgIC8vIFRPRE86IFVzZSBhIGNvbXB1dGVkIHByb3BlcnR5IHdoZW4gc3VwcG9ydGVkIGJ5IEZsb3cuXG4gICAgdmFyIGNvbnRleHRNZW51T2JqID0ge307XG4gICAgY29udGV4dE1lbnVPYmpbdGhpcy5wcm9wcy5ldmVudEhhbmRsZXJTZWxlY3Rvcl0gPSBpdGVtcztcbiAgICBhdG9tLmNvbnRleHRNZW51LmFkZChjb250ZXh0TWVudU9iaik7XG4gIH0sXG5cbiAgcmVuZGVyKCk6ID9SZWFjdEVsZW1lbnQge1xuICAgIGlmICh0aGlzLnN0YXRlLnJvb3RzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRoaXMucHJvcHMuZWxlbWVudFRvUmVuZGVyV2hlbkVtcHR5O1xuICAgIH1cblxuICAgIHZhciBjaGlsZHJlbiA9IFtdO1xuICAgIHZhciBleHBhbmRlZEtleXMgPSB0aGlzLnN0YXRlLmV4cGFuZGVkS2V5cztcbiAgICB2YXIgZm91bmRGaXJzdFNlbGVjdGVkRGVzY2VuZGFudDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gICAgdmFyIHByb21pc2VzOiBBcnJheTxQcm9taXNlPiA9IFtdO1xuICAgIHZhciBhbGxLZXlzOiBBcnJheTxzdHJpbmc+ID0gW107XG4gICAgdmFyIGtleVRvTm9kZTogeyBba2V5OnN0cmluZ106IExhenlUcmVlTm9kZX0gPSB7fTtcblxuICAgIHRoaXMuc3RhdGUucm9vdHMuZm9yRWFjaCgocm9vdCkgPT4ge1xuICAgICAgdmFyIHN0YWNrID0gW3tub2RlOiByb290LCBkZXB0aDogMH1dO1xuXG4gICAgICB3aGlsZSAoc3RhY2subGVuZ3RoICE9PSAwKSB7XG4gICAgICAgIC8vIFBvcCBvZmYgdGhlIHRvcCBvZiB0aGUgc3RhY2sgYW5kIGFkZCBpdCB0byB0aGUgbGlzdCBvZiBub2RlcyB0byBkaXNwbGF5LlxuICAgICAgICB2YXIgaXRlbSA9IHN0YWNrLnBvcCgpO1xuICAgICAgICB2YXIgbm9kZSA9IGl0ZW0ubm9kZTtcblxuICAgICAgICAvLyBLZWVwIGEgcmVmZXJlbmNlIHRoZSBmaXJzdCBzZWxlY3RlZCBkZXNjZW5kYW50IHdpdGhcbiAgICAgICAgLy8gYHRoaXMucmVmc1tGSVJTVF9TRUxFQ1RFRF9ERVNDRU5EQU5UX1JFRl1gLlxuICAgICAgICB2YXIgaXNOb2RlU2VsZWN0ZWQ6IGJvb2xlYW4gPSB0aGlzLl9pc05vZGVTZWxlY3RlZChub2RlKTtcbiAgICAgICAgdmFyIHJlZjogP3N0cmluZyA9IG51bGw7XG4gICAgICAgIGlmICghZm91bmRGaXJzdFNlbGVjdGVkRGVzY2VuZGFudCAmJiBpc05vZGVTZWxlY3RlZCkge1xuICAgICAgICAgIGZvdW5kRmlyc3RTZWxlY3RlZERlc2NlbmRhbnQgPSB0cnVlO1xuICAgICAgICAgIHJlZiA9IEZJUlNUX1NFTEVDVEVEX0RFU0NFTkRBTlRfUkVGO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNoaWxkID0gKFxuICAgICAgICAgIDxUcmVlTm9kZUNvbXBvbmVudCB7Li4uaXRlbX1cbiAgICAgICAgICAgICAgaXNFeHBhbmRlZD17dGhpcy5faXNOb2RlRXhwYW5kZWR9XG4gICAgICAgICAgICAgIGlzU2VsZWN0ZWQ9e2lzTm9kZVNlbGVjdGVkfVxuICAgICAgICAgICAgICBsYWJlbENsYXNzTmFtZUZvck5vZGU9e3RoaXMucHJvcHMubGFiZWxDbGFzc05hbWVGb3JOb2RlfVxuICAgICAgICAgICAgICByb3dDbGFzc05hbWVGb3JOb2RlPXt0aGlzLnByb3BzLnJvd0NsYXNzTmFtZUZvck5vZGV9XG4gICAgICAgICAgICAgIG9uQ2xpY2tBcnJvdz17dGhpcy5fb25DbGlja05vZGVBcnJvd31cbiAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5fb25DbGlja05vZGV9XG4gICAgICAgICAgICAgIG9uRG91YmxlQ2xpY2s9e3RoaXMuX29uRG91YmxlQ2xpY2tOb2RlfVxuICAgICAgICAgICAgICBvbk1vdXNlRG93bj17dGhpcy5fb25Nb3VzZURvd259XG4gICAgICAgICAgICAgIGtleT17bm9kZS5nZXRLZXkoKX1cbiAgICAgICAgICAgICAgcmVmPXtyZWZ9XG4gICAgICAgICAgLz5cbiAgICAgICAgKTtcbiAgICAgICAgY2hpbGRyZW4ucHVzaChjaGlsZCk7XG4gICAgICAgIGFsbEtleXMucHVzaChub2RlLmdldEtleSgpKTtcbiAgICAgICAga2V5VG9Ob2RlW25vZGUuZ2V0S2V5KCldID0gbm9kZTtcblxuICAgICAgICAvLyBDaGVjayB3aGV0aGVyIHRoZSBub2RlIGhhcyBhbnkgY2hpbGRyZW4gdGhhdCBzaG91bGQgYmUgZGlzcGxheWVkLlxuICAgICAgICBpZiAoIW5vZGUuaXNDb250YWluZXIoKSB8fCAhZXhwYW5kZWRLZXlzLmhhcyhub2RlLmdldEtleSgpKSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGNhY2hlZENoaWxkcmVuID0gbm9kZS5nZXRDYWNoZWRDaGlsZHJlbigpO1xuICAgICAgICBpZiAoIWNhY2hlZENoaWxkcmVuIHx8ICFub2RlLmlzQ2FjaGVWYWxpZCgpKSB7XG4gICAgICAgICAgcHJvbWlzZXMucHVzaChub2RlLmZldGNoQ2hpbGRyZW4oKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBQcmV2ZW50IGZsaWNrZXJpbmcgYnkgYWx3YXlzIHJlbmRlcmluZyBjYWNoZWQgY2hpbGRyZW4gLS0gaWYgdGhleSdyZSBpbnZhbGlkLFxuICAgICAgICAvLyB0aGVuIHRoZSBmZXRjaCB3aWxsIGhhcHBlbiBzb29uLlxuICAgICAgICBpZiAoY2FjaGVkQ2hpbGRyZW4pIHtcbiAgICAgICAgICB2YXIgZGVwdGggPSBpdGVtLmRlcHRoICsgMTtcbiAgICAgICAgICAvLyBQdXNoIHRoZSBub2RlJ3MgY2hpbGRyZW4gb24gdGhlIHN0YWNrIGluIHJldmVyc2Ugb3JkZXIgc28gdGhhdCB3aGVuXG4gICAgICAgICAgLy8gdGhleSBhcmUgcG9wcGVkIG9mZiB0aGUgc3RhY2ssIHRoZXkgYXJlIGl0ZXJhdGVkIGluIHRoZSBvcmlnaW5hbFxuICAgICAgICAgIC8vIG9yZGVyLlxuICAgICAgICAgIGNhY2hlZENoaWxkcmVuLnJldmVyc2UoKS5mb3JFYWNoKChjaGlsZE5vZGUpID0+IHtcbiAgICAgICAgICAgIHN0YWNrLnB1c2goe25vZGU6IGNoaWxkTm9kZSwgZGVwdGh9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKHByb21pc2VzLmxlbmd0aCkge1xuICAgICAgUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oKCkgPT4ge1xuICAgICAgICAvLyBUaGUgY29tcG9uZW50IGNvdWxkIGhhdmUgYmVlbiB1bm1vdW50ZWQgYnkgdGhlIHRpbWUgdGhlIHByb21pc2VzIGFyZSByZXNvbHZlZC5cbiAgICAgICAgaWYgKHRoaXMuaXNNb3VudGVkKCkpIHtcbiAgICAgICAgICB0aGlzLmZvcmNlVXBkYXRlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMuX2FsbEtleXMgPSBhbGxLZXlzO1xuICAgIHRoaXMuX2tleVRvTm9kZSA9IGtleVRvTm9kZTtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9J251Y2xpZGUtdHJlZS1yb290Jz5cbiAgICAgICAge2NoaWxkcmVufVxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfSxcblxuICBjb21wb25lbnRXaWxsTW91bnQoKTogdm9pZCB7XG4gICAgdmFyIGFsbEtleXMgPSBbXTtcbiAgICB2YXIga2V5VG9Ob2RlID0ge307XG5cbiAgICB0aGlzLnN0YXRlLnJvb3RzLmZvckVhY2gocm9vdCA9PiB7XG4gICAgICB2YXIgcm9vdEtleSA9IHJvb3QuZ2V0S2V5KCk7XG4gICAgICBhbGxLZXlzLnB1c2gocm9vdEtleSk7XG4gICAgICBrZXlUb05vZGVbcm9vdEtleV0gPSByb290O1xuICAgIH0pO1xuXG4gICAgdmFyIHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgIHN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29tbWFuZHMuYWRkKFxuICAgICAgICB0aGlzLnByb3BzLmV2ZW50SGFuZGxlclNlbGVjdG9yLFxuICAgICAgICB7XG4gICAgICAgICAgLy8gRXhwYW5kIGFuZCBjb2xsYXBzZS5cbiAgICAgICAgICAnY29yZTptb3ZlLXJpZ2h0JzogKCkgPT4gdGhpcy5fZXhwYW5kU2VsZWN0aW9uKCksXG4gICAgICAgICAgJ2NvcmU6bW92ZS1sZWZ0JzogKCkgPT4gdGhpcy5fY29sbGFwc2VTZWxlY3Rpb24oKSxcblxuICAgICAgICAgIC8vIE1vdmUgc2VsZWN0aW9uIHVwIGFuZCBkb3duLlxuICAgICAgICAgICdjb3JlOm1vdmUtdXAnOiAoKSA9PiB0aGlzLl9tb3ZlU2VsZWN0aW9uVXAoKSxcbiAgICAgICAgICAnY29yZTptb3ZlLWRvd24nOiAoKSA9PiB0aGlzLl9tb3ZlU2VsZWN0aW9uRG93bigpLFxuXG4gICAgICAgICAgJ2NvcmU6Y29uZmlybSc6ICgpID0+IHRoaXMuX2NvbmZpcm1TZWxlY3Rpb24oKSxcbiAgICAgICAgfSkpO1xuXG4gICAgdGhpcy5fYWxsS2V5cyA9IGFsbEtleXM7XG4gICAgdGhpcy5fZW1pdHRlciA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgICB0aGlzLl9rZXlUb05vZGUgPSBrZXlUb05vZGU7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucyA9IHN1YnNjcmlwdGlvbnM7XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX3N1YnNjcmlwdGlvbnMpIHtcbiAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuZGlzcG9zZSgpO1xuICAgIH1cbiAgICBpZiAodGhpcy5fZW1pdHRlcikge1xuICAgICAgdGhpcy5fZW1pdHRlci5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICB9XG4gIH0sXG5cbiAgc2VyaWFsaXplKCk6IFRyZWVDb21wb25lbnRTdGF0ZSB7XG4gICAgdmFyIHtmcm9tfSA9IHJlcXVpcmUoJ251Y2xpZGUtY29tbW9ucycpLmFycmF5O1xuICAgIHJldHVybiB7XG4gICAgICBleHBhbmRlZE5vZGVLZXlzOiBmcm9tKHRoaXMuc3RhdGUuZXhwYW5kZWRLZXlzKSxcbiAgICAgIHNlbGVjdGVkTm9kZUtleXM6IGZyb20odGhpcy5zdGF0ZS5zZWxlY3RlZEtleXMpLFxuICAgIH07XG4gIH0sXG5cbiAgaW52YWxpZGF0ZUNhY2hlZE5vZGVzKCk6IHZvaWQge1xuICAgIHRoaXMuc3RhdGUucm9vdHMuZm9yRWFjaChyb290ID0+IHtcbiAgICAgIGZvckVhY2hDYWNoZWROb2RlKHJvb3QsIG5vZGUgPT4ge1xuICAgICAgICBub2RlLmludmFsaWRhdGVDYWNoZSgpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBQcm9taXNlIHRoYXQncyByZXNvbHZlZCB3aGVuIHRoZSByb290cyBhcmUgcmVuZGVyZWQuXG4gICAqL1xuICBzZXRSb290cyhyb290czogQXJyYXk8TGF6eVRyZWVOb2RlPik6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuc3RhdGUucm9vdHMuZm9yRWFjaCgocm9vdCkgPT4ge1xuICAgICAgdGhpcy5yZW1vdmVTdGF0ZUZvclN1YnRyZWUocm9vdCk7XG4gICAgfSk7XG5cbiAgICB2YXIgZXhwYW5kZWRLZXlzID0gdGhpcy5zdGF0ZS5leHBhbmRlZEtleXM7XG4gICAgcm9vdHMuZm9yRWFjaCgocm9vdCkgPT4gZXhwYW5kZWRLZXlzLmFkZChyb290LmdldEtleSgpKSk7XG5cbiAgICAvLyBXZSBoYXZlIHRvIGNyZWF0ZSB0aGUgbGlzdGVuZXIgYmVmb3JlIHNldHRpbmcgdGhlIHN0YXRlIHNvIGl0IGNhbiBwaWNrXG4gICAgLy8gdXAgdGhlIGNoYW5nZXMgZnJvbSBgc2V0U3RhdGVgLlxuICAgIHZhciBwcm9taXNlID0gdGhpcy5fY3JlYXRlRGlkVXBkYXRlTGlzdGVuZXIoLyogc2hvdWxkUmVzb2x2ZSAqLyAoKSA9PiB7XG4gICAgICB2YXIgcm9vdHNSZWFkeSA9ICh0aGlzLnN0YXRlLnJvb3RzID09PSByb290cyk7XG4gICAgICB2YXIgY2hpbGRyZW5SZWFkeSA9IHRoaXMuc3RhdGUucm9vdHMuZXZlcnkocm9vdCA9PiByb290LmlzQ2FjaGVWYWxpZCgpKTtcbiAgICAgIHJldHVybiByb290c1JlYWR5ICYmIGNoaWxkcmVuUmVhZHk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIHJvb3RzLFxuICAgICAgZXhwYW5kZWRLZXlzLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHByb21pc2U7XG4gIH0sXG5cbiAgX2NyZWF0ZURpZFVwZGF0ZUxpc3RlbmVyKHNob3VsZFJlc29sdmU6ICgpID0+IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdmFyIGxpc3RlbmVyID0gKCkgPT4ge1xuICAgICAgICBpZiAoc2hvdWxkUmVzb2x2ZSgpKSB7XG4gICAgICAgICAgcmVzb2x2ZSh1bmRlZmluZWQpO1xuXG4gICAgICAgICAgLy8gU2V0IHRoaXMgdG8gbnVsbCBzbyB0aGlzIHByb21pc2UgY2FuJ3QgYmUgcmVqZWN0ZWQgYW55bW9yZS5cbiAgICAgICAgICB0aGlzLl9yZWplY3REaWRVcGRhdGVMaXN0ZW5lclByb21pc2UgPSBudWxsO1xuICAgICAgICAgIGlmICh0aGlzLl9lbWl0dGVyKSB7XG4gICAgICAgICAgICB0aGlzLl9lbWl0dGVyLnJlbW92ZUxpc3RlbmVyKCdkaWQtdXBkYXRlJywgbGlzdGVuZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgaWYgKHRoaXMuX2VtaXR0ZXIpIHtcbiAgICAgICAgdGhpcy5fZW1pdHRlci5hZGRMaXN0ZW5lcignZGlkLXVwZGF0ZScsIGxpc3RlbmVyKTtcbiAgICAgIH1cblxuICAgICAgLy8gV2UgbmVlZCB0byByZWplY3QgdGhlIHByZXZpb3VzIHByb21pc2UsIHNvIGl0IGRvZXNuJ3QgZ2V0IGxlYWtlZC5cbiAgICAgIGlmICh0aGlzLl9yZWplY3REaWRVcGRhdGVMaXN0ZW5lclByb21pc2UpIHtcbiAgICAgICAgdGhpcy5fcmVqZWN0RGlkVXBkYXRlTGlzdGVuZXJQcm9taXNlKCk7XG4gICAgICAgIHRoaXMuX3JlamVjdERpZFVwZGF0ZUxpc3RlbmVyUHJvbWlzZSA9IG51bGw7XG4gICAgICB9XG4gICAgICB0aGlzLl9yZWplY3REaWRVcGRhdGVMaXN0ZW5lclByb21pc2UgPSAoKSA9PiB7XG4gICAgICAgIHJlamVjdCh1bmRlZmluZWQpO1xuICAgICAgICBpZiAodGhpcy5fZW1pdHRlcikge1xuICAgICAgICAgIHRoaXMuX2VtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoJ2RpZC11cGRhdGUnLCBsaXN0ZW5lcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcblxuICByZW1vdmVTdGF0ZUZvclN1YnRyZWUocm9vdDogTGF6eVRyZWVOb2RlKTogdm9pZCB7XG4gICAgdmFyIGV4cGFuZGVkS2V5cyA9IHRoaXMuc3RhdGUuZXhwYW5kZWRLZXlzO1xuICAgIHZhciBzZWxlY3RlZEtleXMgPSB0aGlzLnN0YXRlLnNlbGVjdGVkS2V5cztcblxuICAgIGZvckVhY2hDYWNoZWROb2RlKHJvb3QsIChub2RlKSA9PiB7XG4gICAgICB2YXIgY2FjaGVkS2V5ID0gbm9kZS5nZXRLZXkoKTtcbiAgICAgIGV4cGFuZGVkS2V5cy5kZWxldGUoY2FjaGVkS2V5KTtcbiAgICAgIHNlbGVjdGVkS2V5cy5kZWxldGUoY2FjaGVkS2V5KTtcbiAgICB9KTtcblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgZXhwYW5kZWRLZXlzLFxuICAgICAgc2VsZWN0ZWRLZXlzLFxuICAgIH0pO1xuICB9LFxuXG4gIGdldFJvb3ROb2RlcygpOiBBcnJheTxMYXp5VHJlZU5vZGU+IHtcbiAgICByZXR1cm4gdGhpcy5zdGF0ZS5yb290cztcbiAgfSxcblxuICBnZXRFeHBhbmRlZE5vZGVzKCk6IEFycmF5PExhenlUcmVlTm9kZT4ge1xuICAgIHZhciBleHBhbmRlZE5vZGVzID0gW107XG4gICAgdGhpcy5zdGF0ZS5leHBhbmRlZEtleXMuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGVGb3JLZXkoa2V5KTtcbiAgICAgIGlmIChub2RlICE9IG51bGwpIHtcbiAgICAgICAgZXhwYW5kZWROb2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBleHBhbmRlZE5vZGVzO1xuICB9LFxuXG4gIGdldFNlbGVjdGVkTm9kZXMoKTogQXJyYXk8TGF6eVRyZWVOb2RlPiB7XG4gICAgdmFyIHNlbGVjdGVkTm9kZXMgPSBbXTtcbiAgICB0aGlzLnN0YXRlLnNlbGVjdGVkS2V5cy5mb3JFYWNoKGtleSA9PiB7XG4gICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZUZvcktleShrZXkpO1xuICAgICAgaWYgKG5vZGUgIT0gbnVsbCkge1xuICAgICAgICBzZWxlY3RlZE5vZGVzLnB1c2gobm9kZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHNlbGVjdGVkTm9kZXM7XG4gIH0sXG5cbiAgLy8gUmV0dXJuIHRoZSBrZXkgZm9yIHRoZSBmaXJzdCBub2RlIHRoYXQgaXMgc2VsZWN0ZWQsIG9yIG51bGwgaWYgdGhlcmUgYXJlIG5vbmUuXG4gIF9nZXRGaXJzdFNlbGVjdGVkS2V5KCk6ID9zdHJpbmcge1xuICAgIGlmICh0aGlzLnN0YXRlLnNlbGVjdGVkS2V5cy5zaXplID09PSAwKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgc2VsZWN0ZWRLZXk7XG4gICAgaWYgKHRoaXMuX2FsbEtleXMgIT0gbnVsbCkge1xuICAgICAgdGhpcy5fYWxsS2V5cy5ldmVyeSgoa2V5KSA9PiB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLnNlbGVjdGVkS2V5cy5oYXMoa2V5KSkge1xuICAgICAgICAgIHNlbGVjdGVkS2V5ID0ga2V5O1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBzZWxlY3RlZEtleTtcbiAgfSxcblxuICBfZXhwYW5kU2VsZWN0aW9uKCk6IHZvaWQge1xuICAgIHZhciBrZXkgPSB0aGlzLl9nZXRGaXJzdFNlbGVjdGVkS2V5KCk7XG4gICAgaWYgKGtleSkge1xuICAgICAgdGhpcy5leHBhbmROb2RlS2V5KGtleSk7XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBTZWxlY3RzIGEgbm9kZSBieSBrZXkgaWYgaXQncyBpbiB0aGUgZmlsZSB0cmVlOyBvdGhlcndpc2UsIGRvIG5vdGhpbmcuXG4gICAqL1xuICBzZWxlY3ROb2RlS2V5KG5vZGVLZXk6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5nZXROb2RlRm9yS2V5KG5vZGVLZXkpKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcbiAgICB9XG5cbiAgICAvLyBXZSBoYXZlIHRvIGNyZWF0ZSB0aGUgbGlzdGVuZXIgYmVmb3JlIHNldHRpbmcgdGhlIHN0YXRlIHNvIGl0IGNhbiBwaWNrXG4gICAgLy8gdXAgdGhlIGNoYW5nZXMgZnJvbSBgc2V0U3RhdGVgLlxuICAgIHZhciBwcm9taXNlID0gdGhpcy5fY3JlYXRlRGlkVXBkYXRlTGlzdGVuZXIoLyogc2hvdWxkUmVzb2x2ZSAqLyAoKSA9PiB0aGlzLnN0YXRlLnNlbGVjdGVkS2V5cy5oYXMobm9kZUtleSkpO1xuICAgIHRoaXMuc2V0U3RhdGUoe3NlbGVjdGVkS2V5czogbmV3IFNldChbbm9kZUtleV0pfSk7XG4gICAgcmV0dXJuIHByb21pc2U7XG4gIH0sXG5cbiAgZ2V0Tm9kZUZvcktleShub2RlS2V5OiBzdHJpbmcpOiA/TGF6eVRyZWVOb2RlIHtcbiAgICBpZiAodGhpcy5fa2V5VG9Ob2RlICE9IG51bGwpIHtcbiAgICAgIHJldHVybiB0aGlzLl9rZXlUb05vZGVbbm9kZUtleV07XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBJZiB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBtdWx0aXBsZSB0aW1lcyBpbiBwYXJhbGxlbCwgdGhlIGxhdGVyIGNhbGxzIHdpbGxcbiAgICogY2F1c2UgdGhlIHByZXZpb3VzIHByb21pc2VzIHRvIHJlamVjdCBldmVuIGlmIHRoZXkgZW5kIHVwIGV4cGFuZGluZyB0aGVcbiAgICogbm9kZSBrZXkgc3VjY2Vzc2Z1bGx5LlxuICAgKlxuICAgKiBJZiB3ZSBkb24ndCByZWplY3QsIHRoZW4gd2UgbWlnaHQgbGVhayBwcm9taXNlcyBpZiBhIG5vZGUga2V5IGlzIGV4cGFuZGVkXG4gICAqIGFuZCBjb2xsYXBzZWQgaW4gc3VjY2Vzc2lvbiAodGhlIGNvbGxhcHNlIGNvdWxkIHN1Y2NlZWQgZmlyc3QsIGNhdXNpbmdcbiAgICogdGhlIGV4cGFuZCB0byBuZXZlciByZXNvbHZlKS5cbiAgICovXG4gIGV4cGFuZE5vZGVLZXkobm9kZUtleTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGVGb3JLZXkobm9kZUtleSk7XG5cbiAgICBpZiAobm9kZSAmJiBub2RlLmlzQ29udGFpbmVyKCkpIHtcbiAgICAgIHZhciBwcm9taXNlID0gdGhpcy5fY3JlYXRlRGlkVXBkYXRlTGlzdGVuZXIoLyogc2hvdWxkUmVzb2x2ZSAqLyAoKSA9PiB7XG4gICAgICAgIHZhciBpc0V4cGFuZGVkID0gdGhpcy5zdGF0ZS5leHBhbmRlZEtleXMuaGFzKG5vZGVLZXkpO1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZUZvcktleShub2RlS2V5KTtcbiAgICAgICAgdmFyIGlzRG9uZUZldGNoaW5nID0gKG5vZGUgJiYgbm9kZS5pc0NvbnRhaW5lcigpICYmIG5vZGUuaXNDYWNoZVZhbGlkKCkpO1xuICAgICAgICByZXR1cm4gaXNFeHBhbmRlZCAmJiBpc0RvbmVGZXRjaGluZztcbiAgICAgIH0pO1xuICAgICAgdGhpcy5fdG9nZ2xlTm9kZUV4cGFuZGVkKG5vZGUsIHRydWUgLyogZm9yY2VFeHBhbmRlZCAqLyk7XG4gICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH0sXG5cbiAgY29sbGFwc2VOb2RlS2V5KG5vZGVLZXk6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlRm9yS2V5KG5vZGVLZXkpO1xuXG4gICAgaWYgKG5vZGUgJiYgbm9kZS5pc0NvbnRhaW5lcigpKSB7XG4gICAgICB2YXIgcHJvbWlzZSA9IHRoaXMuX2NyZWF0ZURpZFVwZGF0ZUxpc3RlbmVyKC8qIHNob3VsZFJlc29sdmUgKi8gKCkgPT4gIXRoaXMuc3RhdGUuZXhwYW5kZWRLZXlzLmhhcyhub2RlS2V5KSk7XG4gICAgICB0aGlzLl90b2dnbGVOb2RlRXhwYW5kZWQobm9kZSwgZmFsc2UgLyogZm9yY2VFeHBhbmRlZCAqLyk7XG4gICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH0sXG5cbiAgaXNOb2RlS2V5RXhwYW5kZWQobm9kZUtleTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdGUuZXhwYW5kZWRLZXlzLmhhcyhub2RlS2V5KTtcbiAgfSxcblxuICBfY29sbGFwc2VTZWxlY3Rpb24oKTogdm9pZCB7XG4gICAgdmFyIGtleSA9IHRoaXMuX2dldEZpcnN0U2VsZWN0ZWRLZXkoKTtcbiAgICBpZiAoIWtleSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBleHBhbmRlZEtleXMgPSB0aGlzLnN0YXRlLmV4cGFuZGVkS2V5cztcbiAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZUZvcktleShrZXkpO1xuICAgIGlmICgobm9kZSAhPSBudWxsKSAmJiAoIWV4cGFuZGVkS2V5cy5oYXMoa2V5KSB8fCAhbm9kZS5pc0NvbnRhaW5lcigpKSkge1xuICAgICAgLy8gSWYgdGhlIHNlbGVjdGlvbiBpcyBhbHJlYWR5IGNvbGxhcHNlZCBvciBpdCdzIG5vdCBhIGNvbnRhaW5lciwgc2VsZWN0IGl0cyBwYXJlbnQuXG4gICAgICB2YXIgcGFyZW50ID0gbm9kZS5nZXRQYXJlbnQoKTtcbiAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgdGhpcy5zZWxlY3ROb2RlS2V5KHBhcmVudC5nZXRLZXkoKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5jb2xsYXBzZU5vZGVLZXkoa2V5KTtcbiAgfSxcblxuICBfbW92ZVNlbGVjdGlvblVwKCk6IHZvaWQge1xuICAgIHZhciBhbGxLZXlzID0gdGhpcy5fYWxsS2V5cztcbiAgICBpZiAoIWFsbEtleXMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIga2V5SW5kZXhUb1NlbGVjdCA9IGFsbEtleXMubGVuZ3RoIC0gMTtcbiAgICB2YXIga2V5ID0gdGhpcy5fZ2V0Rmlyc3RTZWxlY3RlZEtleSgpO1xuICAgIGlmIChrZXkpIHtcbiAgICAgIGtleUluZGV4VG9TZWxlY3QgPSBhbGxLZXlzLmluZGV4T2Yoa2V5KTtcbiAgICAgIGlmIChrZXlJbmRleFRvU2VsZWN0ID4gMCkge1xuICAgICAgICAtLWtleUluZGV4VG9TZWxlY3Q7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7c2VsZWN0ZWRLZXlzOiBuZXcgU2V0KFthbGxLZXlzW2tleUluZGV4VG9TZWxlY3RdXSl9KTtcbiAgfSxcblxuICBfbW92ZVNlbGVjdGlvbkRvd24oKTogdm9pZCB7XG4gICAgdmFyIGFsbEtleXMgPSB0aGlzLl9hbGxLZXlzO1xuICAgIGlmICghYWxsS2V5cykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBrZXlJbmRleFRvU2VsZWN0ID0gMDtcbiAgICB2YXIga2V5ID0gdGhpcy5fZ2V0Rmlyc3RTZWxlY3RlZEtleSgpO1xuICAgIGlmIChrZXkpIHtcbiAgICAgIGtleUluZGV4VG9TZWxlY3QgPSBhbGxLZXlzLmluZGV4T2Yoa2V5KTtcbiAgICAgIGlmIChrZXlJbmRleFRvU2VsZWN0ICE9PSAtMSAmJiBrZXlJbmRleFRvU2VsZWN0IDwgYWxsS2V5cy5sZW5ndGggLSAxKSB7XG4gICAgICAgICsra2V5SW5kZXhUb1NlbGVjdDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnNldFN0YXRlKHtzZWxlY3RlZEtleXM6IG5ldyBTZXQoW2FsbEtleXNba2V5SW5kZXhUb1NlbGVjdF1dKX0pO1xuICB9LFxuXG4gIF9jb25maXJtU2VsZWN0aW9uKCk6IHZvaWQge1xuICAgIHZhciBrZXkgPSB0aGlzLl9nZXRGaXJzdFNlbGVjdGVkS2V5KCk7XG4gICAgaWYgKGtleSkge1xuICAgICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGVGb3JLZXkoa2V5KTtcbiAgICAgIGlmIChub2RlKSB7XG4gICAgICAgIHRoaXMuX2NvbmZpcm1Ob2RlKG5vZGUpO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBfY29uZmlybU5vZGUobm9kZTogTGF6eVRyZWVOb2RlKTogdm9pZCB7XG4gICAgaWYgKG5vZGUuaXNDb250YWluZXIoKSkge1xuICAgICAgdGhpcy5fdG9nZ2xlTm9kZUV4cGFuZGVkKG5vZGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnByb3BzLm9uQ29uZmlybVNlbGVjdGlvbihub2RlKTtcbiAgICB9XG4gIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRyZWVSb290Q29tcG9uZW50O1xuIl19