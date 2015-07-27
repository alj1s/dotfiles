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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtdHJlZS9ub2RlX21vZHVsZXMvbnVjbGlkZS11aS10cmVlL2xpYi9UcmVlUm9vdENvbXBvbmVudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7O2VBV2dCLE9BQU8sQ0FBQyxNQUFNLENBQUM7O0lBQXRDLG1CQUFtQixZQUFuQixtQkFBbUI7O2dCQUNILE9BQU8sQ0FBQyxRQUFRLENBQUM7O0lBQWpDLFlBQVksYUFBWixZQUFZOztBQUNqQixJQUFJLFlBQVksR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUM3QyxJQUFJLGlCQUFpQixHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDOztnQkFDN0IsT0FBTyxDQUFDLHdCQUF3QixDQUFDOztJQUF0RCxpQkFBaUIsYUFBakIsaUJBQWlCOztBQUN0QixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQzs7SUFFakMsU0FBUyxHQUFJLEtBQUssQ0FBbEIsU0FBUzs7Ozs7Ozs7Ozs7Ozs7QUErQmQsU0FBUyxZQUFZLENBQ2pCLEdBQWdCLEVBQ2hCLEtBQWEsRUFDYixRQUFtQixFQUNaO0FBQ1QsTUFBSSxLQUFLLENBQUM7O0FBRVYsTUFBSSxRQUFRLElBQUssUUFBUSxLQUFLLFNBQVMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUc7QUFDM0QsT0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNmLFNBQUssR0FBRyxJQUFJLENBQUM7R0FDZCxNQUFNO0FBQ0wsT0FBRyxVQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDbEIsU0FBSyxHQUFHLEtBQUssQ0FBQztHQUNmOztBQUVELFNBQU8sS0FBSyxDQUFDO0NBQ2Q7O0FBRUQsSUFBSSw2QkFBcUMsR0FBRyx5QkFBeUIsQ0FBQzs7Ozs7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QUM7S0FDckM7R0FDRjtDQUNGLENBQUMsQ0FBQzs7QUFFSCxNQUFNLENBQUMsT0FBTyxHQUFHLGlCQUFpQixDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtdHJlZS9ub2RlX21vZHVsZXMvbnVjbGlkZS11aS10cmVlL2xpYi9UcmVlUm9vdENvbXBvbmVudC5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbnZhciB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlKCdhdG9tJyk7XG52YXIge0V2ZW50RW1pdHRlcn0gPSByZXF1aXJlKCdldmVudHMnKTtcbnZhciBMYXp5VHJlZU5vZGUgPSByZXF1aXJlKCcuL0xhenlUcmVlTm9kZScpO1xudmFyIFRyZWVOb2RlQ29tcG9uZW50ID0gcmVxdWlyZSgnLi9UcmVlTm9kZUNvbXBvbmVudCcpO1xudmFyIHtmb3JFYWNoQ2FjaGVkTm9kZX0gPSByZXF1aXJlKCcuL3RyZWUtbm9kZS10cmF2ZXJzYWxzJyk7XG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC1mb3ItYXRvbScpO1xuXG52YXIge1Byb3BUeXBlc30gPSBSZWFjdDtcblxudHlwZSBUcmVlTWVudUl0ZW1EZWZpbml0aW9uID0ge1xuICBsYWJlbDogc3RyaW5nO1xuICBjb21tYW5kOiBzdHJpbmc7XG4gIHN1Ym1lbnU6ID9BcnJheTxUcmVlTWVudUl0ZW1EZWZpbml0aW9uPjtcbiAgc2hvdWxkRGlzcGxheTogPygpID0+IGJvb2xlYW47XG4gIHNob3VsZERpc3BsYXlGb3JTZWxlY3RlZE5vZGVzOiA/KG5vZGVzOiBBcnJheTxMYXp5VHJlZU5vZGU+KSA9PiBib29sZWFuO1xuXG4gIC8vIEJ5IGRlZmF1bHQsIG5vIGNvbnRleHQgbWVudSBpdGVtIHdpbGwgYmUgZGlzcGxheWVkIGlmIHRoZSB0cmVlIGlzIGVtcHR5LlxuICAvLyBTZXQgdGhpcyB0byB0cnVlIHRvIG92ZXJyaWRlIHRoYXQgYmVoYXZpb3IuXG4gIHNob3VsZERpc3BsYXlJZlRyZWVJc0VtcHR5OiA/Ym9vbGVhbjtcbn07XG5cbnR5cGUgVHJlZUNvbXBvbmVudFN0YXRlID0ge1xuICBleHBhbmRlZE5vZGVLZXlzOiBBcnJheTxzdHJpbmc+O1xuICBzZWxlY3RlZE5vZGVLZXlzOiBBcnJheTxzdHJpbmc+O1xufTtcblxuLyoqXG4gKiBUb2dnbGVzIHRoZSBleGlzdGVuY2Ugb2YgYSB2YWx1ZSBpbiBhIHNldC4gSWYgdGhlIHZhbHVlIGV4aXN0cywgZGVsZXRlcyBpdC5cbiAqIElmIHRoZSB2YWx1ZSBkb2VzIG5vdCBleGlzdCwgYWRkcyBpdC5cbiAqXG4gKiBAcGFyYW0gc2V0IFRoZSBzZXQgd2hvc2UgdmFsdWUgdG8gdG9nZ2xlLlxuICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byB0b2dnbGUgaW4gdGhlIHNldC5cbiAqIEBwYXJhbSBbZm9yY2VIYXNdIElmIGRlZmluZWQsIGZvcmNlcyB0aGUgZXhpc3RlbmNlIG9mIHRoZSB2YWx1ZSBpbiB0aGUgc2V0XG4gKiAgICAgcmVnYXJkbGVzcyBvZiBpdHMgY3VycmVudCBleGlzdGVuY2UuIElmIHRydXRoeSwgYWRkcyBgdmFsdWVgLCBpZiBmYWxzeVxuICogICAgIGRlbGV0ZXMgYHZhbHVlYC5cbiAqIEByZXR1cm5zIGB0cnVlYCBpZiB0aGUgdmFsdWUgd2FzIGFkZGVkIHRvIHRoZSBzZXQsIG90aGVyd2lzZSBgZmFsc2VgLiBJZlxuICogICAgIGBmb3JjZUhhc2AgaXMgZGVmaW5lZCwgdGhlIHJldHVybiB2YWx1ZSB3aWxsIGJlIGVxdWFsIHRvIGBmb3JjZUhhc2AuXG4gKi9cbmZ1bmN0aW9uIHRvZ2dsZVNldEhhcyhcbiAgICBzZXQ6IFNldDxzdHJpbmc+LFxuICAgIHZhbHVlOiBzdHJpbmcsXG4gICAgZm9yY2VIYXM/OiA/Ym9vbGVhblxuKTogYm9vbGVhbiB7XG4gIHZhciBhZGRlZDtcblxuICBpZiAoZm9yY2VIYXMgfHwgKGZvcmNlSGFzID09PSB1bmRlZmluZWQgJiYgIXNldC5oYXModmFsdWUpKSkge1xuICAgIHNldC5hZGQodmFsdWUpO1xuICAgIGFkZGVkID0gdHJ1ZTtcbiAgfSBlbHNlIHtcbiAgICBzZXQuZGVsZXRlKHZhbHVlKTtcbiAgICBhZGRlZCA9IGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIGFkZGVkO1xufVxuXG52YXIgRklSU1RfU0VMRUNURURfREVTQ0VOREFOVF9SRUY6IHN0cmluZyA9ICdmaXJzdFNlbGVjdGVkRGVzY2VuZGFudCc7XG5cbi8qKlxuICogR2VuZXJpYyB0cmVlIGNvbXBvbmVudCB0aGF0IG9wZXJhdGVzIG9uIExhenlUcmVlTm9kZXMuXG4gKi9cbnZhciBUcmVlUm9vdENvbXBvbmVudCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgX2FsbEtleXM6IChudWxsOiA/QXJyYXk8c3RyaW5nPiksXG4gIF9lbWl0dGVyOiAobnVsbDogP0V2ZW50RW1pdHRlciksXG4gIF9rZXlUb05vZGU6IChudWxsOiA/e1trZXk6IHN0cmluZ106IExhenlUcmVlTm9kZX0pLFxuICBfcmVqZWN0RGlkVXBkYXRlTGlzdGVuZXJQcm9taXNlOiAobnVsbDogPygpID0+IHZvaWQpLFxuICBfc3Vic2NyaXB0aW9uczogKG51bGw6ID9Db21wb3NpdGVEaXNwb3NhYmxlKSxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBpbml0aWFsUm9vdHM6IFByb3BUeXBlcy5hcnJheU9mKFByb3BUeXBlcy5pbnN0YW5jZU9mKExhenlUcmVlTm9kZSkpLmlzUmVxdWlyZWQsXG4gICAgZXZlbnRIYW5kbGVyU2VsZWN0b3I6IFByb3BUeXBlcy5zdHJpbmcuaXNSZXF1aXJlZCxcbiAgICAvLyBBIG5vZGUgY2FuIGJlIGNvbmZpcm1lZCBpZiBpdCBpcyBhIHNlbGVjdGVkIG5vbi1jb250YWluZXIgbm9kZSBhbmQgdGhlIHVzZXIgaXMgY2xpY2tzIG9uIGl0XG4gICAgLy8gb3IgcHJlc3NlcyA8ZW50ZXI+LlxuICAgIG9uQ29uZmlybVNlbGVjdGlvbjogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAvLyBBIG5vZGUgY2FuIGJlIFwia2VwdFwiIChvcGVuZWQgcGVybWFuZW50bHkpIGJ5IGRvdWJsZSBjbGlja2luZyBpdC4gVGhpcyBvbmx5IGhhcyBhbiBlZmZlY3RcbiAgICAvLyB3aGVuIHRoZSBgdXNlUHJldmlld1RhYnNgIHNldHRpbmcgaXMgZW5hYmxlZCBpbiB0aGUgXCJ0YWJzXCIgcGFja2FnZS5cbiAgICBvbktlZXBTZWxlY3Rpb246IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgbGFiZWxDbGFzc05hbWVGb3JOb2RlOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgIHJvd0NsYXNzTmFtZUZvck5vZGU6IFByb3BUeXBlcy5mdW5jLFxuICAgIC8vIFJlbmRlciB3aWxsIHJldHVybiB0aGlzIGNvbXBvbmVudCBpZiB0aGVyZSBhcmUgbm8gcm9vdCBub2Rlcy5cbiAgICBlbGVtZW50VG9SZW5kZXJXaGVuRW1wdHk6IFByb3BUeXBlcy5lbGVtZW50LFxuICAgIGluaXRpYWxFeHBhbmRlZE5vZGVLZXlzOiBQcm9wVHlwZXMuYXJyYXlPZihQcm9wVHlwZXMuc3RyaW5nKSxcbiAgICBpbml0aWFsU2VsZWN0ZWROb2RlS2V5czogUHJvcFR5cGVzLmFycmF5T2YoUHJvcFR5cGVzLnN0cmluZyksXG4gIH0sXG5cbiAgZ2V0RGVmYXVsdFByb3BzKCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9uQ29uZmlybVNlbGVjdGlvbihub2RlOiBMYXp5VHJlZU5vZGUpIHt9LFxuICAgICAgZWxlbWVudFRvUmVuZGVyV2hlbkVtcHR5OiBudWxsLFxuICAgIH07XG4gIH0sXG5cbiAgZ2V0SW5pdGlhbFN0YXRlKCk6IGFueSB7XG4gICAgdmFyIHJvb3RLZXlzID0gdGhpcy5wcm9wcy5pbml0aWFsUm9vdHMubWFwKChyb290KSA9PiByb290LmdldEtleSgpKTtcblxuICAgIHZhciBzZWxlY3RlZEtleXM7XG4gICAgaWYgKHRoaXMucHJvcHMuaW5pdGlhbFNlbGVjdGVkTm9kZUtleXMpIHtcbiAgICAgIHNlbGVjdGVkS2V5cyA9IG5ldyBTZXQodGhpcy5wcm9wcy5pbml0aWFsU2VsZWN0ZWROb2RlS2V5cyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlbGVjdGVkS2V5cyA9IG5ldyBTZXQocm9vdEtleXMubGVuZ3RoID09PSAwID8gW10gOiBbcm9vdEtleXNbMF1dKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgcm9vdHM6IHRoaXMucHJvcHMuaW5pdGlhbFJvb3RzLFxuICAgICAgLy8gVGhpcyBpcyBtYWludGFpbmVkIGFzIGEgc2V0IG9mIHN0cmluZ3MgZm9yIHR3byByZWFzb25zOlxuICAgICAgLy8gKDEpIEl0IGlzIHN0cmFpZ2h0Zm9yd2FyZCB0byBzZXJpYWxpemUuXG4gICAgICAvLyAoMikgSWYgdGhlIExhenlGaWxlVHJlZU5vZGUgZm9yIGEgcGF0aCBpcyByZS1jcmVhdGVkLCB0aGlzIHdpbGwgc3RpbGwgd29yay5cbiAgICAgIGV4cGFuZGVkS2V5czogbmV3IFNldCh0aGlzLnByb3BzLmluaXRpYWxFeHBhbmRlZE5vZGVLZXlzIHx8IHJvb3RLZXlzKSxcbiAgICAgIHNlbGVjdGVkS2V5cyxcbiAgICB9O1xuICB9LFxuXG4gIGNvbXBvbmVudERpZFVwZGF0ZShwcmV2UHJvcHM6IE9iamVjdCwgcHJldlN0YXRlOiA/T2JqZWN0KTogdm9pZCB7XG4gICAgLy8gSWYgdGhlIFNldCBvZiBzZWxlY3RlZCBpdGVtcyBpcyBuZXcsIGxpa2Ugd2hlbiBuYXZpZ2F0aW5nIHRoZSB0cmVlIHdpdGhcbiAgICAvLyB0aGUgYXJyb3cga2V5cywgc2Nyb2xsIHRoZSBmaXJzdCBpdGVtIGludG8gdmlldy4gVGhpcyBhZGRyZXNzZXMgdGhlXG4gICAgLy8gZm9sbG93aW5nIHNjZW5hcmlvOlxuICAgIC8vICgxKSBTZWxlY3QgYSBub2RlIGluIHRoZSB0cmVlXG4gICAgLy8gKDIpIFNjcm9sbCB0aGUgc2VsZWN0ZWQgbm9kZSBvdXQgb2YgdGhlIHZpZXdwb3J0XG4gICAgLy8gKDMpIFByZXNzIHRoZSB1cCBvciBkb3duIGFycm93IGtleSB0byBjaGFuZ2UgdGhlIHNlbGVjdGVkIG5vZGVcbiAgICAvLyAoNCkgVGhlIG5ldyBub2RlIHNob3VsZCBzY3JvbGwgaW50byB2aWV3XG4gICAgaWYgKCFwcmV2U3RhdGUgfHwgdGhpcy5zdGF0ZS5zZWxlY3RlZEtleXMgIT09IHByZXZTdGF0ZS5zZWxlY3RlZEtleXMpIHtcbiAgICAgIHZhciBmaXJzdFNlbGVjdGVkRGVzY2VuZGFudCA9IHRoaXMucmVmc1tGSVJTVF9TRUxFQ1RFRF9ERVNDRU5EQU5UX1JFRl07XG4gICAgICBpZiAoZmlyc3RTZWxlY3RlZERlc2NlbmRhbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBmaXJzdFNlbGVjdGVkRGVzY2VuZGFudC5nZXRET01Ob2RlKCkuc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZChmYWxzZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2VtaXR0ZXIpIHtcbiAgICAgIHRoaXMuX2VtaXR0ZXIuZW1pdCgnZGlkLXVwZGF0ZScpO1xuICAgIH1cbiAgfSxcblxuICBfZGVzZWxlY3REZXNjZW5kYW50cyhyb290OiBMYXp5VHJlZU5vZGUpOiB2b2lkIHtcbiAgICB2YXIgc2VsZWN0ZWRLZXlzID0gdGhpcy5zdGF0ZS5zZWxlY3RlZEtleXM7XG5cbiAgICBmb3JFYWNoQ2FjaGVkTm9kZShyb290LCBub2RlID0+IHtcbiAgICAgIC8vIGBmb3JFYWNoQ2FjaGVkTm9kZWAgaXRlcmF0ZXMgb3ZlciB0aGUgcm9vdCwgYnV0IGl0IHNob3VsZCByZW1haW5cbiAgICAgIC8vIHNlbGVjdGVkLiBTa2lwIGl0LlxuICAgICAgaWYgKG5vZGUgPT09IHJvb3QpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBzZWxlY3RlZEtleXMuZGVsZXRlKG5vZGUuZ2V0S2V5KCkpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5zZXRTdGF0ZSh7c2VsZWN0ZWRLZXlzfSk7XG4gIH0sXG5cbiAgX2lzTm9kZUV4cGFuZGVkKG5vZGU6IExhenlUcmVlTm9kZSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLnN0YXRlLmV4cGFuZGVkS2V5cy5oYXMobm9kZS5nZXRLZXkoKSk7XG4gIH0sXG5cbiAgX2lzTm9kZVNlbGVjdGVkKG5vZGU6IExhenlUcmVlTm9kZSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLnN0YXRlLnNlbGVjdGVkS2V5cy5oYXMobm9kZS5nZXRLZXkoKSk7XG4gIH0sXG5cbiAgX3RvZ2dsZU5vZGVFeHBhbmRlZChub2RlOiBMYXp5VHJlZU5vZGUsIGZvcmNlRXhwYW5kZWQ/OiA/Ym9vbGVhbik6IHZvaWQge1xuICAgIHZhciBleHBhbmRlZEtleXMgPSB0aGlzLnN0YXRlLmV4cGFuZGVkS2V5cztcbiAgICB2YXIga2V5QWRkZWQgPSB0b2dnbGVTZXRIYXMoZXhwYW5kZWRLZXlzLCBub2RlLmdldEtleSgpLCBmb3JjZUV4cGFuZGVkKTtcblxuICAgIC8vIElmIHRoZSBub2RlIHdhcyBjb2xsYXBzZWQsIGRlc2VsZWN0IGl0cyBkZXNjZW5kYW50cyBzbyBvbmx5IG5vZGVzIHZpc2libGVcbiAgICAvLyBpbiB0aGUgdHJlZSByZW1haW4gc2VsZWN0ZWQuXG4gICAgaWYgKCFrZXlBZGRlZCkge1xuICAgICAgdGhpcy5fZGVzZWxlY3REZXNjZW5kYW50cyhub2RlKTtcbiAgICB9XG5cbiAgICB0aGlzLnNldFN0YXRlKHtleHBhbmRlZEtleXN9KTtcbiAgfSxcblxuICBfdG9nZ2xlTm9kZVNlbGVjdGVkKG5vZGU6IExhenlUcmVlTm9kZSwgZm9yY2VTZWxlY3RlZD86ID9ib29sZWFuKTogdm9pZCB7XG4gICAgdmFyIHNlbGVjdGVkS2V5cyA9IHRoaXMuc3RhdGUuc2VsZWN0ZWRLZXlzO1xuICAgIHRvZ2dsZVNldEhhcyhzZWxlY3RlZEtleXMsIG5vZGUuZ2V0S2V5KCksIGZvcmNlU2VsZWN0ZWQpO1xuICAgIHRoaXMuc2V0U3RhdGUoe3NlbGVjdGVkS2V5c30pO1xuICB9LFxuXG4gIF9vbkNsaWNrTm9kZShldmVudDogU3ludGhldGljTW91c2VFdmVudCwgbm9kZTogTGF6eVRyZWVOb2RlKTogdm9pZCB7XG4gICAgaWYgKGV2ZW50Lm1ldGFLZXkpIHtcbiAgICAgIHRoaXMuX3RvZ2dsZU5vZGVTZWxlY3RlZChub2RlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIHNlbGVjdGVkS2V5czogbmV3IFNldChbbm9kZS5nZXRLZXkoKV0pLFxuICAgIH0pO1xuXG4gICAgaWYgKCF0aGlzLl9pc05vZGVTZWxlY3RlZChub2RlKSAmJlxuICAgICAgICAobm9kZS5pc0NvbnRhaW5lcigpIHx8ICFhdG9tLmNvbmZpZy5nZXQoJ3RhYnMudXNlUHJldmlld1RhYnMnKSkpIHtcbiAgICAgIC8vIFVzZXIgY2xpY2tlZCBvbiBhIG5ldyBkaXJlY3Rvcnkgb3IgdGhlIHVzZXIgaXNuJ3QgdXNpbmcgdGhlIFwiUHJldmlldyBUYWJzXCIgZmVhdHVyZSBvZiB0aGVcbiAgICAgIC8vIGB0YWJzYCBwYWNrYWdlLCBzbyBkb24ndCB0b2dnbGUgdGhlIG5vZGUncyBzdGF0ZSBhbnkgZnVydGhlciB5ZXQuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fY29uZmlybU5vZGUobm9kZSk7XG4gIH0sXG5cbiAgX29uQ2xpY2tOb2RlQXJyb3coZXZlbnQ6IFN5bnRoZXRpY0V2ZW50LCBub2RlOiBMYXp5VHJlZU5vZGUpOiB2b2lkIHtcbiAgICB0aGlzLl90b2dnbGVOb2RlRXhwYW5kZWQobm9kZSk7XG4gIH0sXG5cbiAgX29uRG91YmxlQ2xpY2tOb2RlKGV2ZW50OiBTeW50aGV0aWNNb3VzZUV2ZW50LCBub2RlOiBMYXp5VHJlZU5vZGUpOiB2b2lkIHtcbiAgICAvLyBEb3VibGUgY2xpY2tpbmcgYSBub24tZGlyZWN0b3J5IHdpbGwga2VlcCB0aGUgY3JlYXRlZCB0YWIgb3Blbi5cbiAgICBpZiAoIW5vZGUuaXNDb250YWluZXIoKSkge1xuICAgICAgdGhpcy5wcm9wcy5vbktlZXBTZWxlY3Rpb24oKTtcbiAgICB9XG4gIH0sXG5cbiAgX29uTW91c2VEb3duKGV2ZW50OiBTeW50aGV0aWNNb3VzZUV2ZW50LCBub2RlOiBMYXp5VHJlZU5vZGUpOiB2b2lkIHtcbiAgICAvLyBTZWxlY3QgdGhlIG5vZGUgb24gcmlnaHQtY2xpY2suXG4gICAgaWYgKGV2ZW50LmJ1dHRvbiA9PT0gMiB8fCAoZXZlbnQuYnV0dG9uID09PSAwICYmIGV2ZW50LmN0cmxLZXkgPT09IHRydWUpKSB7XG4gICAgICBpZiAoIXRoaXMuX2lzTm9kZVNlbGVjdGVkKG5vZGUpKSB7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe3NlbGVjdGVkS2V5czogbmV3IFNldChbbm9kZS5nZXRLZXkoKV0pfSk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIGFkZENvbnRleHRNZW51SXRlbUdyb3VwKG1lbnVJdGVtRGVmaW5pdGlvbnM6IEFycmF5PFRyZWVNZW51SXRlbURlZmluaXRpb24+KTogdm9pZCB7XG4gICAgdmFyIGl0ZW1zID0gbWVudUl0ZW1EZWZpbml0aW9ucy5zbGljZSgpO1xuICAgIGl0ZW1zID0gaXRlbXMubWFwKChkZWZpbml0aW9uKSA9PiB7XG4gICAgICBkZWZpbml0aW9uLnNob3VsZERpc3BsYXkgPSAoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLnN0YXRlLnJvb3RzLmxlbmd0aCA9PT0gMCAmJiAhZGVmaW5pdGlvbi5zaG91bGREaXNwbGF5SWZUcmVlSXNFbXB0eSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGVmaW5pdGlvbi5zaG91bGREaXNwbGF5Rm9yU2VsZWN0ZWROb2Rlcykge1xuICAgICAgICAgIHJldHVybiBkZWZpbml0aW9uLnNob3VsZERpc3BsYXlGb3JTZWxlY3RlZE5vZGVzKHRoaXMuZ2V0U2VsZWN0ZWROb2RlcygpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH07XG4gICAgICByZXR1cm4gZGVmaW5pdGlvbjtcbiAgICB9KTtcblxuICAgIC8vIEF0b20gaXMgc21hcnQgYWJvdXQgb25seSBkaXNwbGF5aW5nIGEgc2VwYXJhdG9yIHdoZW4gdGhlcmUgYXJlIGl0ZW1zIHRvXG4gICAgLy8gc2VwYXJhdGUsIHNvIHRoZXJlIHdpbGwgbmV2ZXIgYmUgYSBkYW5nbGluZyBzZXBhcmF0b3IgYXQgdGhlIGVuZC5cbiAgICBpdGVtcy5wdXNoKHt0eXBlOiAnc2VwYXJhdG9yJ30pO1xuXG4gICAgLy8gVE9ETzogVXNlIGEgY29tcHV0ZWQgcHJvcGVydHkgd2hlbiBzdXBwb3J0ZWQgYnkgRmxvdy5cbiAgICB2YXIgY29udGV4dE1lbnVPYmogPSB7fTtcbiAgICBjb250ZXh0TWVudU9ialt0aGlzLnByb3BzLmV2ZW50SGFuZGxlclNlbGVjdG9yXSA9IGl0ZW1zO1xuICAgIGF0b20uY29udGV4dE1lbnUuYWRkKGNvbnRleHRNZW51T2JqKTtcbiAgfSxcblxuICByZW5kZXIoKTogP1JlYWN0RWxlbWVudCB7XG4gICAgaWYgKHRoaXMuc3RhdGUucm9vdHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5wcm9wcy5lbGVtZW50VG9SZW5kZXJXaGVuRW1wdHk7XG4gICAgfVxuXG4gICAgdmFyIGNoaWxkcmVuID0gW107XG4gICAgdmFyIGV4cGFuZGVkS2V5cyA9IHRoaXMuc3RhdGUuZXhwYW5kZWRLZXlzO1xuICAgIHZhciBmb3VuZEZpcnN0U2VsZWN0ZWREZXNjZW5kYW50OiBib29sZWFuID0gZmFsc2U7XG5cbiAgICB2YXIgcHJvbWlzZXM6IEFycmF5PFByb21pc2U+ID0gW107XG4gICAgdmFyIGFsbEtleXM6IEFycmF5PHN0cmluZz4gPSBbXTtcbiAgICB2YXIga2V5VG9Ob2RlOiB7IFtrZXk6c3RyaW5nXTogTGF6eVRyZWVOb2RlfSA9IHt9O1xuXG4gICAgdGhpcy5zdGF0ZS5yb290cy5mb3JFYWNoKChyb290KSA9PiB7XG4gICAgICB2YXIgc3RhY2sgPSBbe25vZGU6IHJvb3QsIGRlcHRoOiAwfV07XG5cbiAgICAgIHdoaWxlIChzdGFjay5sZW5ndGggIT09IDApIHtcbiAgICAgICAgLy8gUG9wIG9mZiB0aGUgdG9wIG9mIHRoZSBzdGFjayBhbmQgYWRkIGl0IHRvIHRoZSBsaXN0IG9mIG5vZGVzIHRvIGRpc3BsYXkuXG4gICAgICAgIHZhciBpdGVtID0gc3RhY2sucG9wKCk7XG4gICAgICAgIHZhciBub2RlID0gaXRlbS5ub2RlO1xuXG4gICAgICAgIC8vIEtlZXAgYSByZWZlcmVuY2UgdGhlIGZpcnN0IHNlbGVjdGVkIGRlc2NlbmRhbnQgd2l0aFxuICAgICAgICAvLyBgdGhpcy5yZWZzW0ZJUlNUX1NFTEVDVEVEX0RFU0NFTkRBTlRfUkVGXWAuXG4gICAgICAgIHZhciBpc05vZGVTZWxlY3RlZDogYm9vbGVhbiA9IHRoaXMuX2lzTm9kZVNlbGVjdGVkKG5vZGUpO1xuICAgICAgICB2YXIgcmVmOiA/c3RyaW5nID0gbnVsbDtcbiAgICAgICAgaWYgKCFmb3VuZEZpcnN0U2VsZWN0ZWREZXNjZW5kYW50ICYmIGlzTm9kZVNlbGVjdGVkKSB7XG4gICAgICAgICAgZm91bmRGaXJzdFNlbGVjdGVkRGVzY2VuZGFudCA9IHRydWU7XG4gICAgICAgICAgcmVmID0gRklSU1RfU0VMRUNURURfREVTQ0VOREFOVF9SRUY7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2hpbGQgPSAoXG4gICAgICAgICAgPFRyZWVOb2RlQ29tcG9uZW50IHsuLi5pdGVtfVxuICAgICAgICAgICAgICBpc0V4cGFuZGVkPXt0aGlzLl9pc05vZGVFeHBhbmRlZH1cbiAgICAgICAgICAgICAgaXNTZWxlY3RlZD17aXNOb2RlU2VsZWN0ZWR9XG4gICAgICAgICAgICAgIGxhYmVsQ2xhc3NOYW1lRm9yTm9kZT17dGhpcy5wcm9wcy5sYWJlbENsYXNzTmFtZUZvck5vZGV9XG4gICAgICAgICAgICAgIHJvd0NsYXNzTmFtZUZvck5vZGU9e3RoaXMucHJvcHMucm93Q2xhc3NOYW1lRm9yTm9kZX1cbiAgICAgICAgICAgICAgb25DbGlja0Fycm93PXt0aGlzLl9vbkNsaWNrTm9kZUFycm93fVxuICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLl9vbkNsaWNrTm9kZX1cbiAgICAgICAgICAgICAgb25Eb3VibGVDbGljaz17dGhpcy5fb25Eb3VibGVDbGlja05vZGV9XG4gICAgICAgICAgICAgIG9uTW91c2VEb3duPXt0aGlzLl9vbk1vdXNlRG93bn1cbiAgICAgICAgICAgICAga2V5PXtub2RlLmdldEtleSgpfVxuICAgICAgICAgICAgICByZWY9e3JlZn1cbiAgICAgICAgICAvPlxuICAgICAgICApO1xuICAgICAgICBjaGlsZHJlbi5wdXNoKGNoaWxkKTtcbiAgICAgICAgYWxsS2V5cy5wdXNoKG5vZGUuZ2V0S2V5KCkpO1xuICAgICAgICBrZXlUb05vZGVbbm9kZS5nZXRLZXkoKV0gPSBub2RlO1xuXG4gICAgICAgIC8vIENoZWNrIHdoZXRoZXIgdGhlIG5vZGUgaGFzIGFueSBjaGlsZHJlbiB0aGF0IHNob3VsZCBiZSBkaXNwbGF5ZWQuXG4gICAgICAgIGlmICghbm9kZS5pc0NvbnRhaW5lcigpIHx8ICFleHBhbmRlZEtleXMuaGFzKG5vZGUuZ2V0S2V5KCkpKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2FjaGVkQ2hpbGRyZW4gPSBub2RlLmdldENhY2hlZENoaWxkcmVuKCk7XG4gICAgICAgIGlmICghY2FjaGVkQ2hpbGRyZW4gfHwgIW5vZGUuaXNDYWNoZVZhbGlkKCkpIHtcbiAgICAgICAgICBwcm9taXNlcy5wdXNoKG5vZGUuZmV0Y2hDaGlsZHJlbigpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFByZXZlbnQgZmxpY2tlcmluZyBieSBhbHdheXMgcmVuZGVyaW5nIGNhY2hlZCBjaGlsZHJlbiAtLSBpZiB0aGV5J3JlIGludmFsaWQsXG4gICAgICAgIC8vIHRoZW4gdGhlIGZldGNoIHdpbGwgaGFwcGVuIHNvb24uXG4gICAgICAgIGlmIChjYWNoZWRDaGlsZHJlbikge1xuICAgICAgICAgIHZhciBkZXB0aCA9IGl0ZW0uZGVwdGggKyAxO1xuICAgICAgICAgIC8vIFB1c2ggdGhlIG5vZGUncyBjaGlsZHJlbiBvbiB0aGUgc3RhY2sgaW4gcmV2ZXJzZSBvcmRlciBzbyB0aGF0IHdoZW5cbiAgICAgICAgICAvLyB0aGV5IGFyZSBwb3BwZWQgb2ZmIHRoZSBzdGFjaywgdGhleSBhcmUgaXRlcmF0ZWQgaW4gdGhlIG9yaWdpbmFsXG4gICAgICAgICAgLy8gb3JkZXIuXG4gICAgICAgICAgY2FjaGVkQ2hpbGRyZW4ucmV2ZXJzZSgpLmZvckVhY2goKGNoaWxkTm9kZSkgPT4ge1xuICAgICAgICAgICAgc3RhY2sucHVzaCh7bm9kZTogY2hpbGROb2RlLCBkZXB0aH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAocHJvbWlzZXMubGVuZ3RoKSB7XG4gICAgICBQcm9taXNlLmFsbChwcm9taXNlcykudGhlbigoKSA9PiB7XG4gICAgICAgIC8vIFRoZSBjb21wb25lbnQgY291bGQgaGF2ZSBiZWVuIHVubW91bnRlZCBieSB0aGUgdGltZSB0aGUgcHJvbWlzZXMgYXJlIHJlc29sdmVkLlxuICAgICAgICBpZiAodGhpcy5pc01vdW50ZWQoKSkge1xuICAgICAgICAgIHRoaXMuZm9yY2VVcGRhdGUoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdGhpcy5fYWxsS2V5cyA9IGFsbEtleXM7XG4gICAgdGhpcy5fa2V5VG9Ob2RlID0ga2V5VG9Ob2RlO1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nbnVjbGlkZS10cmVlLXJvb3QnPlxuICAgICAgICB7Y2hpbGRyZW59XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxNb3VudCgpOiB2b2lkIHtcbiAgICB2YXIgYWxsS2V5cyA9IFtdO1xuICAgIHZhciBrZXlUb05vZGUgPSB7fTtcblxuICAgIHRoaXMuc3RhdGUucm9vdHMuZm9yRWFjaChyb290ID0+IHtcbiAgICAgIHZhciByb290S2V5ID0gcm9vdC5nZXRLZXkoKTtcbiAgICAgIGFsbEtleXMucHVzaChyb290S2V5KTtcbiAgICAgIGtleVRvTm9kZVtyb290S2V5XSA9IHJvb3Q7XG4gICAgfSk7XG5cbiAgICB2YXIgc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXG4gICAgICAgIHRoaXMucHJvcHMuZXZlbnRIYW5kbGVyU2VsZWN0b3IsXG4gICAgICAgIHtcbiAgICAgICAgICAvLyBFeHBhbmQgYW5kIGNvbGxhcHNlLlxuICAgICAgICAgICdjb3JlOm1vdmUtcmlnaHQnOiAoKSA9PiB0aGlzLl9leHBhbmRTZWxlY3Rpb24oKSxcbiAgICAgICAgICAnY29yZTptb3ZlLWxlZnQnOiAoKSA9PiB0aGlzLl9jb2xsYXBzZVNlbGVjdGlvbigpLFxuXG4gICAgICAgICAgLy8gTW92ZSBzZWxlY3Rpb24gdXAgYW5kIGRvd24uXG4gICAgICAgICAgJ2NvcmU6bW92ZS11cCc6ICgpID0+IHRoaXMuX21vdmVTZWxlY3Rpb25VcCgpLFxuICAgICAgICAgICdjb3JlOm1vdmUtZG93bic6ICgpID0+IHRoaXMuX21vdmVTZWxlY3Rpb25Eb3duKCksXG5cbiAgICAgICAgICAnY29yZTpjb25maXJtJzogKCkgPT4gdGhpcy5fY29uZmlybVNlbGVjdGlvbigpLFxuICAgICAgICB9KSk7XG5cbiAgICB0aGlzLl9hbGxLZXlzID0gYWxsS2V5cztcbiAgICB0aGlzLl9lbWl0dGVyID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICAgIHRoaXMuX2tleVRvTm9kZSA9IGtleVRvTm9kZTtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zID0gc3Vic2NyaXB0aW9ucztcbiAgfSxcblxuICBjb21wb25lbnRXaWxsVW5tb3VudCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fc3Vic2NyaXB0aW9ucykge1xuICAgICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5kaXNwb3NlKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLl9lbWl0dGVyKSB7XG4gICAgICB0aGlzLl9lbWl0dGVyLnJlbW92ZUFsbExpc3RlbmVycygpO1xuICAgIH1cbiAgfSxcblxuICBzZXJpYWxpemUoKTogVHJlZUNvbXBvbmVudFN0YXRlIHtcbiAgICB2YXIge2Zyb219ID0gcmVxdWlyZSgnbnVjbGlkZS1jb21tb25zJykuYXJyYXk7XG4gICAgcmV0dXJuIHtcbiAgICAgIGV4cGFuZGVkTm9kZUtleXM6IGZyb20odGhpcy5zdGF0ZS5leHBhbmRlZEtleXMpLFxuICAgICAgc2VsZWN0ZWROb2RlS2V5czogZnJvbSh0aGlzLnN0YXRlLnNlbGVjdGVkS2V5cyksXG4gICAgfTtcbiAgfSxcblxuICBpbnZhbGlkYXRlQ2FjaGVkTm9kZXMoKTogdm9pZCB7XG4gICAgdGhpcy5zdGF0ZS5yb290cy5mb3JFYWNoKHJvb3QgPT4ge1xuICAgICAgZm9yRWFjaENhY2hlZE5vZGUocm9vdCwgbm9kZSA9PiB7XG4gICAgICAgIG5vZGUuaW52YWxpZGF0ZUNhY2hlKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogUmV0dXJucyBhIFByb21pc2UgdGhhdCdzIHJlc29sdmVkIHdoZW4gdGhlIHJvb3RzIGFyZSByZW5kZXJlZC5cbiAgICovXG4gIHNldFJvb3RzKHJvb3RzOiBBcnJheTxMYXp5VHJlZU5vZGU+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5zdGF0ZS5yb290cy5mb3JFYWNoKChyb290KSA9PiB7XG4gICAgICB0aGlzLnJlbW92ZVN0YXRlRm9yU3VidHJlZShyb290KTtcbiAgICB9KTtcblxuICAgIHZhciBleHBhbmRlZEtleXMgPSB0aGlzLnN0YXRlLmV4cGFuZGVkS2V5cztcbiAgICByb290cy5mb3JFYWNoKChyb290KSA9PiBleHBhbmRlZEtleXMuYWRkKHJvb3QuZ2V0S2V5KCkpKTtcblxuICAgIC8vIFdlIGhhdmUgdG8gY3JlYXRlIHRoZSBsaXN0ZW5lciBiZWZvcmUgc2V0dGluZyB0aGUgc3RhdGUgc28gaXQgY2FuIHBpY2tcbiAgICAvLyB1cCB0aGUgY2hhbmdlcyBmcm9tIGBzZXRTdGF0ZWAuXG4gICAgdmFyIHByb21pc2UgPSB0aGlzLl9jcmVhdGVEaWRVcGRhdGVMaXN0ZW5lcigvKiBzaG91bGRSZXNvbHZlICovICgpID0+IHtcbiAgICAgIHZhciByb290c1JlYWR5ID0gKHRoaXMuc3RhdGUucm9vdHMgPT09IHJvb3RzKTtcbiAgICAgIHZhciBjaGlsZHJlblJlYWR5ID0gdGhpcy5zdGF0ZS5yb290cy5ldmVyeShyb290ID0+IHJvb3QuaXNDYWNoZVZhbGlkKCkpO1xuICAgICAgcmV0dXJuIHJvb3RzUmVhZHkgJiYgY2hpbGRyZW5SZWFkeTtcbiAgICB9KTtcblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgcm9vdHMsXG4gICAgICBleHBhbmRlZEtleXMsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfSxcblxuICBfY3JlYXRlRGlkVXBkYXRlTGlzdGVuZXIoc2hvdWxkUmVzb2x2ZTogKCkgPT4gYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICB2YXIgbGlzdGVuZXIgPSAoKSA9PiB7XG4gICAgICAgIGlmIChzaG91bGRSZXNvbHZlKCkpIHtcbiAgICAgICAgICByZXNvbHZlKHVuZGVmaW5lZCk7XG5cbiAgICAgICAgICAvLyBTZXQgdGhpcyB0byBudWxsIHNvIHRoaXMgcHJvbWlzZSBjYW4ndCBiZSByZWplY3RlZCBhbnltb3JlLlxuICAgICAgICAgIHRoaXMuX3JlamVjdERpZFVwZGF0ZUxpc3RlbmVyUHJvbWlzZSA9IG51bGw7XG4gICAgICAgICAgaWYgKHRoaXMuX2VtaXR0ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX2VtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoJ2RpZC11cGRhdGUnLCBsaXN0ZW5lcik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBpZiAodGhpcy5fZW1pdHRlcikge1xuICAgICAgICB0aGlzLl9lbWl0dGVyLmFkZExpc3RlbmVyKCdkaWQtdXBkYXRlJywgbGlzdGVuZXIpO1xuICAgICAgfVxuXG4gICAgICAvLyBXZSBuZWVkIHRvIHJlamVjdCB0aGUgcHJldmlvdXMgcHJvbWlzZSwgc28gaXQgZG9lc24ndCBnZXQgbGVha2VkLlxuICAgICAgaWYgKHRoaXMuX3JlamVjdERpZFVwZGF0ZUxpc3RlbmVyUHJvbWlzZSkge1xuICAgICAgICB0aGlzLl9yZWplY3REaWRVcGRhdGVMaXN0ZW5lclByb21pc2UoKTtcbiAgICAgICAgdGhpcy5fcmVqZWN0RGlkVXBkYXRlTGlzdGVuZXJQcm9taXNlID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3JlamVjdERpZFVwZGF0ZUxpc3RlbmVyUHJvbWlzZSA9ICgpID0+IHtcbiAgICAgICAgcmVqZWN0KHVuZGVmaW5lZCk7XG4gICAgICAgIGlmICh0aGlzLl9lbWl0dGVyKSB7XG4gICAgICAgICAgdGhpcy5fZW1pdHRlci5yZW1vdmVMaXN0ZW5lcignZGlkLXVwZGF0ZScsIGxpc3RlbmVyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9LFxuXG4gIHJlbW92ZVN0YXRlRm9yU3VidHJlZShyb290OiBMYXp5VHJlZU5vZGUpOiB2b2lkIHtcbiAgICB2YXIgZXhwYW5kZWRLZXlzID0gdGhpcy5zdGF0ZS5leHBhbmRlZEtleXM7XG4gICAgdmFyIHNlbGVjdGVkS2V5cyA9IHRoaXMuc3RhdGUuc2VsZWN0ZWRLZXlzO1xuXG4gICAgZm9yRWFjaENhY2hlZE5vZGUocm9vdCwgKG5vZGUpID0+IHtcbiAgICAgIHZhciBjYWNoZWRLZXkgPSBub2RlLmdldEtleSgpO1xuICAgICAgZXhwYW5kZWRLZXlzLmRlbGV0ZShjYWNoZWRLZXkpO1xuICAgICAgc2VsZWN0ZWRLZXlzLmRlbGV0ZShjYWNoZWRLZXkpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBleHBhbmRlZEtleXMsXG4gICAgICBzZWxlY3RlZEtleXMsXG4gICAgfSk7XG4gIH0sXG5cbiAgZ2V0Um9vdE5vZGVzKCk6IEFycmF5PExhenlUcmVlTm9kZT4ge1xuICAgIHJldHVybiB0aGlzLnN0YXRlLnJvb3RzO1xuICB9LFxuXG4gIGdldEV4cGFuZGVkTm9kZXMoKTogQXJyYXk8TGF6eVRyZWVOb2RlPiB7XG4gICAgdmFyIGV4cGFuZGVkTm9kZXMgPSBbXTtcbiAgICB0aGlzLnN0YXRlLmV4cGFuZGVkS2V5cy5mb3JFYWNoKGtleSA9PiB7XG4gICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZUZvcktleShrZXkpO1xuICAgICAgaWYgKG5vZGUgIT0gbnVsbCkge1xuICAgICAgICBleHBhbmRlZE5vZGVzLnB1c2gobm9kZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGV4cGFuZGVkTm9kZXM7XG4gIH0sXG5cbiAgZ2V0U2VsZWN0ZWROb2RlcygpOiBBcnJheTxMYXp5VHJlZU5vZGU+IHtcbiAgICB2YXIgc2VsZWN0ZWROb2RlcyA9IFtdO1xuICAgIHRoaXMuc3RhdGUuc2VsZWN0ZWRLZXlzLmZvckVhY2goa2V5ID0+IHtcbiAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlRm9yS2V5KGtleSk7XG4gICAgICBpZiAobm9kZSAhPSBudWxsKSB7XG4gICAgICAgIHNlbGVjdGVkTm9kZXMucHVzaChub2RlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gc2VsZWN0ZWROb2RlcztcbiAgfSxcblxuICAvLyBSZXR1cm4gdGhlIGtleSBmb3IgdGhlIGZpcnN0IG5vZGUgdGhhdCBpcyBzZWxlY3RlZCwgb3IgbnVsbCBpZiB0aGVyZSBhcmUgbm9uZS5cbiAgX2dldEZpcnN0U2VsZWN0ZWRLZXkoKTogP3N0cmluZyB7XG4gICAgaWYgKHRoaXMuc3RhdGUuc2VsZWN0ZWRLZXlzLnNpemUgPT09IDApIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHZhciBzZWxlY3RlZEtleTtcbiAgICBpZiAodGhpcy5fYWxsS2V5cyAhPSBudWxsKSB7XG4gICAgICB0aGlzLl9hbGxLZXlzLmV2ZXJ5KChrZXkpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuc2VsZWN0ZWRLZXlzLmhhcyhrZXkpKSB7XG4gICAgICAgICAgc2VsZWN0ZWRLZXkgPSBrZXk7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNlbGVjdGVkS2V5O1xuICB9LFxuXG4gIF9leHBhbmRTZWxlY3Rpb24oKTogdm9pZCB7XG4gICAgdmFyIGtleSA9IHRoaXMuX2dldEZpcnN0U2VsZWN0ZWRLZXkoKTtcbiAgICBpZiAoa2V5KSB7XG4gICAgICB0aGlzLmV4cGFuZE5vZGVLZXkoa2V5KTtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIFNlbGVjdHMgYSBub2RlIGJ5IGtleSBpZiBpdCdzIGluIHRoZSBmaWxlIHRyZWU7IG90aGVyd2lzZSwgZG8gbm90aGluZy5cbiAgICovXG4gIHNlbGVjdE5vZGVLZXkobm9kZUtleTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLmdldE5vZGVGb3JLZXkobm9kZUtleSkpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xuICAgIH1cblxuICAgIC8vIFdlIGhhdmUgdG8gY3JlYXRlIHRoZSBsaXN0ZW5lciBiZWZvcmUgc2V0dGluZyB0aGUgc3RhdGUgc28gaXQgY2FuIHBpY2tcbiAgICAvLyB1cCB0aGUgY2hhbmdlcyBmcm9tIGBzZXRTdGF0ZWAuXG4gICAgdmFyIHByb21pc2UgPSB0aGlzLl9jcmVhdGVEaWRVcGRhdGVMaXN0ZW5lcigvKiBzaG91bGRSZXNvbHZlICovICgpID0+IHRoaXMuc3RhdGUuc2VsZWN0ZWRLZXlzLmhhcyhub2RlS2V5KSk7XG4gICAgdGhpcy5zZXRTdGF0ZSh7c2VsZWN0ZWRLZXlzOiBuZXcgU2V0KFtub2RlS2V5XSl9KTtcbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfSxcblxuICBnZXROb2RlRm9yS2V5KG5vZGVLZXk6IHN0cmluZyk6ID9MYXp5VHJlZU5vZGUge1xuICAgIGlmICh0aGlzLl9rZXlUb05vZGUgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2tleVRvTm9kZVtub2RlS2V5XTtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIElmIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIG11bHRpcGxlIHRpbWVzIGluIHBhcmFsbGVsLCB0aGUgbGF0ZXIgY2FsbHMgd2lsbFxuICAgKiBjYXVzZSB0aGUgcHJldmlvdXMgcHJvbWlzZXMgdG8gcmVqZWN0IGV2ZW4gaWYgdGhleSBlbmQgdXAgZXhwYW5kaW5nIHRoZVxuICAgKiBub2RlIGtleSBzdWNjZXNzZnVsbHkuXG4gICAqXG4gICAqIElmIHdlIGRvbid0IHJlamVjdCwgdGhlbiB3ZSBtaWdodCBsZWFrIHByb21pc2VzIGlmIGEgbm9kZSBrZXkgaXMgZXhwYW5kZWRcbiAgICogYW5kIGNvbGxhcHNlZCBpbiBzdWNjZXNzaW9uICh0aGUgY29sbGFwc2UgY291bGQgc3VjY2VlZCBmaXJzdCwgY2F1c2luZ1xuICAgKiB0aGUgZXhwYW5kIHRvIG5ldmVyIHJlc29sdmUpLlxuICAgKi9cbiAgZXhwYW5kTm9kZUtleShub2RlS2V5OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZUZvcktleShub2RlS2V5KTtcblxuICAgIGlmIChub2RlICYmIG5vZGUuaXNDb250YWluZXIoKSkge1xuICAgICAgdmFyIHByb21pc2UgPSB0aGlzLl9jcmVhdGVEaWRVcGRhdGVMaXN0ZW5lcigvKiBzaG91bGRSZXNvbHZlICovICgpID0+IHtcbiAgICAgICAgdmFyIGlzRXhwYW5kZWQgPSB0aGlzLnN0YXRlLmV4cGFuZGVkS2V5cy5oYXMobm9kZUtleSk7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlRm9yS2V5KG5vZGVLZXkpO1xuICAgICAgICB2YXIgaXNEb25lRmV0Y2hpbmcgPSAobm9kZSAmJiBub2RlLmlzQ29udGFpbmVyKCkgJiYgbm9kZS5pc0NhY2hlVmFsaWQoKSk7XG4gICAgICAgIHJldHVybiBpc0V4cGFuZGVkICYmIGlzRG9uZUZldGNoaW5nO1xuICAgICAgfSk7XG4gICAgICB0aGlzLl90b2dnbGVOb2RlRXhwYW5kZWQobm9kZSwgdHJ1ZSAvKiBmb3JjZUV4cGFuZGVkICovKTtcbiAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH1cblxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfSxcblxuICBjb2xsYXBzZU5vZGVLZXkobm9kZUtleTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdmFyIG5vZGUgPSB0aGlzLmdldE5vZGVGb3JLZXkobm9kZUtleSk7XG5cbiAgICBpZiAobm9kZSAmJiBub2RlLmlzQ29udGFpbmVyKCkpIHtcbiAgICAgIHZhciBwcm9taXNlID0gdGhpcy5fY3JlYXRlRGlkVXBkYXRlTGlzdGVuZXIoLyogc2hvdWxkUmVzb2x2ZSAqLyAoKSA9PiAhdGhpcy5zdGF0ZS5leHBhbmRlZEtleXMuaGFzKG5vZGVLZXkpKTtcbiAgICAgIHRoaXMuX3RvZ2dsZU5vZGVFeHBhbmRlZChub2RlLCBmYWxzZSAvKiBmb3JjZUV4cGFuZGVkICovKTtcbiAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH1cblxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfSxcblxuICBpc05vZGVLZXlFeHBhbmRlZChub2RlS2V5OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5zdGF0ZS5leHBhbmRlZEtleXMuaGFzKG5vZGVLZXkpO1xuICB9LFxuXG4gIF9jb2xsYXBzZVNlbGVjdGlvbigpOiB2b2lkIHtcbiAgICB2YXIga2V5ID0gdGhpcy5fZ2V0Rmlyc3RTZWxlY3RlZEtleSgpO1xuICAgIGlmICgha2V5KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGV4cGFuZGVkS2V5cyA9IHRoaXMuc3RhdGUuZXhwYW5kZWRLZXlzO1xuICAgIHZhciBub2RlID0gdGhpcy5nZXROb2RlRm9yS2V5KGtleSk7XG4gICAgaWYgKChub2RlICE9IG51bGwpICYmICghZXhwYW5kZWRLZXlzLmhhcyhrZXkpIHx8ICFub2RlLmlzQ29udGFpbmVyKCkpKSB7XG4gICAgICAvLyBJZiB0aGUgc2VsZWN0aW9uIGlzIGFscmVhZHkgY29sbGFwc2VkIG9yIGl0J3Mgbm90IGEgY29udGFpbmVyLCBzZWxlY3QgaXRzIHBhcmVudC5cbiAgICAgIHZhciBwYXJlbnQgPSBub2RlLmdldFBhcmVudCgpO1xuICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICB0aGlzLnNlbGVjdE5vZGVLZXkocGFyZW50LmdldEtleSgpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmNvbGxhcHNlTm9kZUtleShrZXkpO1xuICB9LFxuXG4gIF9tb3ZlU2VsZWN0aW9uVXAoKTogdm9pZCB7XG4gICAgdmFyIGFsbEtleXMgPSB0aGlzLl9hbGxLZXlzO1xuICAgIGlmICghYWxsS2V5cykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBrZXlJbmRleFRvU2VsZWN0ID0gYWxsS2V5cy5sZW5ndGggLSAxO1xuICAgIHZhciBrZXkgPSB0aGlzLl9nZXRGaXJzdFNlbGVjdGVkS2V5KCk7XG4gICAgaWYgKGtleSkge1xuICAgICAga2V5SW5kZXhUb1NlbGVjdCA9IGFsbEtleXMuaW5kZXhPZihrZXkpO1xuICAgICAgaWYgKGtleUluZGV4VG9TZWxlY3QgPiAwKSB7XG4gICAgICAgIC0ta2V5SW5kZXhUb1NlbGVjdDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnNldFN0YXRlKHtzZWxlY3RlZEtleXM6IG5ldyBTZXQoW2FsbEtleXNba2V5SW5kZXhUb1NlbGVjdF1dKX0pO1xuICB9LFxuXG4gIF9tb3ZlU2VsZWN0aW9uRG93bigpOiB2b2lkIHtcbiAgICB2YXIgYWxsS2V5cyA9IHRoaXMuX2FsbEtleXM7XG4gICAgaWYgKCFhbGxLZXlzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGtleUluZGV4VG9TZWxlY3QgPSAwO1xuICAgIHZhciBrZXkgPSB0aGlzLl9nZXRGaXJzdFNlbGVjdGVkS2V5KCk7XG4gICAgaWYgKGtleSkge1xuICAgICAga2V5SW5kZXhUb1NlbGVjdCA9IGFsbEtleXMuaW5kZXhPZihrZXkpO1xuICAgICAgaWYgKGtleUluZGV4VG9TZWxlY3QgIT09IC0xICYmIGtleUluZGV4VG9TZWxlY3QgPCBhbGxLZXlzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgKytrZXlJbmRleFRvU2VsZWN0O1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuc2V0U3RhdGUoe3NlbGVjdGVkS2V5czogbmV3IFNldChbYWxsS2V5c1trZXlJbmRleFRvU2VsZWN0XV0pfSk7XG4gIH0sXG5cbiAgX2NvbmZpcm1TZWxlY3Rpb24oKTogdm9pZCB7XG4gICAgdmFyIGtleSA9IHRoaXMuX2dldEZpcnN0U2VsZWN0ZWRLZXkoKTtcbiAgICBpZiAoa2V5KSB7XG4gICAgICB2YXIgbm9kZSA9IHRoaXMuZ2V0Tm9kZUZvcktleShrZXkpO1xuICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgdGhpcy5fY29uZmlybU5vZGUobm9kZSk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIF9jb25maXJtTm9kZShub2RlOiBMYXp5VHJlZU5vZGUpOiB2b2lkIHtcbiAgICBpZiAobm9kZS5pc0NvbnRhaW5lcigpKSB7XG4gICAgICB0aGlzLl90b2dnbGVOb2RlRXhwYW5kZWQobm9kZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucHJvcHMub25Db25maXJtU2VsZWN0aW9uKG5vZGUpO1xuICAgIH1cbiAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gVHJlZVJvb3RDb21wb25lbnQ7XG4iXX0=