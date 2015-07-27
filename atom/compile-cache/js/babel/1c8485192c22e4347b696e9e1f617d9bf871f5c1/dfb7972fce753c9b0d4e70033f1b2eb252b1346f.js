Object.defineProperty(exports, '__esModule', {
  value: true
});

/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _getServicesForDirectory = _asyncToGenerator(function* (directory) {
  var _require4 = require('nuclide-client');

  var getClient = _require4.getClient;

  var directoryPath = directory.getPath();
  var basename = directory.getBaseName();
  var client = getClient(directoryPath);
  var url = require('url');

  var _url$parse = url.parse(directoryPath);

  var protocol = _url$parse.protocol;
  var host = _url$parse.host;
  var rootDirectory = _url$parse.path;

  var providers = yield client.getSearchProviders(rootDirectory);
  return providers;
});

var _getEligibleServices = _asyncToGenerator(function* () {
  var paths = atom.project.getDirectories();
  var services = paths.map(_getServicesForDirectory);
  return Promise.all(services);
});

function _defineProperty(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

'use babel';

var AtomInput = require('nuclide-ui-atom-input');

var _require = require('atom');

var CompositeDisposable = _require.CompositeDisposable;
var Disposable = _require.Disposable;
var Emitter = _require.Emitter;

var QuickSelectionProvider = require('./QuickSelectionProvider');

var _require2 = require('nuclide-commons');

var array = _require2.array;
var debounce = _require2.debounce;
var object = _require2.object;

var React = require('react-for-atom');
var NuclideTabs = require('nuclide-ui-tabs');

var _require3 = require('./searchResultHelpers');

var filterEmptyResults = _require3.filterEmptyResults;
var flattenResults = _require3.flattenResults;
var PropTypes = React.PropTypes;

var assign = Object.assign || require('object-assign');
var cx = require('react-classset');

// keep `action` in sync with keymap.
var DEFAULT_TABS = [{
  providerName: 'OmniSearchResultProvider',
  title: 'All Results',
  action: 'nuclide-quick-open:toggle-omni-search'
}, {
  providerName: 'FileListProvider',
  title: 'Filenames',
  action: 'nuclide-quick-open:toggle-quick-open'
}, {
  providerName: 'OpenFileListProvider',
  title: 'Open Files',
  action: 'nuclide-quick-open:toggle-openfilename-search'
}];

var DYNAMIC_TABS = {
  biggrep: {
    providerName: 'BigGrepListProvider',
    title: 'BigGrep',
    action: 'nuclide-quick-open:toggle-biggrep-search'
  },
  hack: {
    providerName: 'SymbolListProvider',
    title: 'Symbols',
    action: 'nuclide-quick-open:toggle-symbol-search'
  }
};

var RENDERABLE_TABS = DEFAULT_TABS.slice();

function updateRenderableTabs() {
  var eligibleServiceTabs = _getEligibleServices().then(function (services) {
    RENDERABLE_TABS = DEFAULT_TABS.slice();
    var dynamicTab = Array.prototype.concat.apply([], services).filter(function (service) {
      return DYNAMIC_TABS.hasOwnProperty(service.name);
    }).map(function (service) {
      return DYNAMIC_TABS[service.name];
    });
    // insert dynamic tabs at index 1 (after the OmniSearchProvider).
    RENDERABLE_TABS.splice.apply(RENDERABLE_TABS, [1, 0].concat(dynamicTab));
  });
}

// This timeout is required to keep tests from breaking, since `atom.project` appears to still
// be initializing at the time this module is required, breaking the documented API behavior, which
// specifies that "An instance of [Project] is always available as the `atom.project` global."
// https://atom.io/docs/api/v0.211.0/Project
var disposeOfMe;
setTimeout(function () {
  disposeOfMe = atom.project.onDidChangePaths(updateRenderableTabs);
}, 1000);
updateRenderableTabs();

var DEFAULT_TAB = RENDERABLE_TABS[0];

var QuickSelectionComponent = React.createClass({
  displayName: 'QuickSelectionComponent',

  _emitter: undefined,
  _subscriptions: undefined,

  propTypes: {
    provider: PropTypes.instanceOf(QuickSelectionProvider).isRequired
  },

  statics: {
    /**
     * Determine what the applicable shortcut for a given action is within this component's context.
     * For example, this will return different keybindings on windows vs linux.
      *
     * TODO replace with humanizeKeystroke from autocomplete-plus package,
     * once it becomes a standalone package:
     * https://github.com/atom/underscore-plus/blob/master/src/underscore-plus.coffee#L179
     */
    _findKeybindingForAction: function _findKeybindingForAction(action) {
      var matchingKeyBindings = atom.keymaps.findKeyBindings({
        command: action,
        target: this._modalNode
      });
      var keystroke = matchingKeyBindings.length && matchingKeyBindings[0].keystrokes || '';
      return keystroke.replace(/cmd/gi, '⌘').replace(/alt/gi, '⌥').replace(/[\+-]/g, '').toUpperCase();
    }
  },

  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    var _this = this;

    if (nextProps.provider !== this.props.provider) {
      if (nextProps.provider) {
        this.refs.queryInput.getTextEditor().setPlaceholderText(nextProps.provider.getPromptText());
        var newResults = {};
        this.setState({
          activeTab: nextProps.provider.constructor.name || DEFAULT_TAB.providerName,
          resultsByService: newResults
        }, function () {
          _this.setQuery(_this.refs.queryInput.getText());
          _this._updateQueryHandler();
          _this._emitter.emit('items-changed', newResults);
        });
      }
    }
  },

  componentDidUpdate: function componentDidUpdate(prevProps, prevState) {
    if (prevState.resultsByService !== this.state.resultsByService) {
      this._emitter.emit('items-changed', this.state.resultsByService);
    }

    if (prevState.selectedItemIndex !== this.state.selectedItemIndex || prevState.selectedService !== this.state.selectedService || prevState.selectedDirectory !== this.state.selectedDirectory) {
      this._updateScrollPosition();
    }
  },

  getInitialState: function getInitialState() {
    return {
      // treated as immutable
      resultsByService: {},
      selectedDirectory: '',
      selectedService: '',
      selectedItemIndex: -1,
      activeTab: DEFAULT_TAB.providerName
    };
  },

  componentDidMount: function componentDidMount() {
    var _this2 = this;

    this._emitter = new Emitter();
    this._subscriptions = new CompositeDisposable();
    this._modalNode = this.getDOMNode();
    this._subscriptions.add(atom.commands.add(this._modalNode, 'core:move-up', this.moveSelectionUp), atom.commands.add(this._modalNode, 'core:move-down', this.moveSelectionDown), atom.commands.add(this._modalNode, 'core:move-to-top', this.moveSelectionToTop), atom.commands.add(this._modalNode, 'core:move-to-bottom', this.moveSelectionToBottom), atom.commands.add(this._modalNode, 'core:confirm', this.select), atom.commands.add(this._modalNode, 'core:cancel', this.cancel));

    var inputTextEditor = this.getInputTextEditor();
    inputTextEditor.addEventListener('blur', function (event) {
      if (event.relatedTarget !== null) {
        // cancel can be interrupted by user interaction with the modal
        _this2._scheduledCancel = setTimeout(_this2.cancel, 100);
      }
    });

    this._updateQueryHandler();
    inputTextEditor.model.onDidChange(this._handleTextInputChange);
    this.clear();
  },

  componentWillUnmount: function componentWillUnmount() {
    this._emitter.dispose();
    this._subscriptions.dispose();
  },

  onCancellation: function onCancellation(callback) {
    return this._emitter.on('canceled', callback);
  },

  onSelection: function onSelection(callback) {
    return this._emitter.on('selected', callback);
  },

  onSelectionChanged: function onSelectionChanged(callback) {
    return this._emitter.on('selection-changed', callback);
  },

  onItemsChanged: function onItemsChanged(callback) {
    return this._emitter.on('items-changed', callback);
  },

  onTabChange: function onTabChange(callback) {
    return this._emitter.on('active-provider-changed', callback);
  },

  _updateQueryHandler: function _updateQueryHandler() {
    var _this3 = this;

    this._debouncedQueryHandler = debounce(function () {
      return _this3.setQuery(_this3.getInputTextEditor().model.getText());
    }, this.getProvider().getDebounceDelay());
  },

  _handleTextInputChange: function _handleTextInputChange() {
    this._debouncedQueryHandler();
  },

  select: function select() {
    var selectedItem = this.getSelectedItem();
    if (!selectedItem) {
      this.cancel();
    } else {
      this._emitter.emit('selected', selectedItem);
    }
  },

  cancel: function cancel() {
    this._emitter.emit('canceled');
  },

  clearSelection: function clearSelection() {
    this.setSelectedIndex('', '', -1);
  },

  _getCurrentResultContext: function _getCurrentResultContext() {
    var nonEmptyResults = filterEmptyResults(this.state.resultsByService);
    var serviceNames = Object.keys(nonEmptyResults);
    var currentServiceIndex = serviceNames.indexOf(this.state.selectedService);
    var currentService = nonEmptyResults[this.state.selectedService];

    if (!currentService) {
      return null;
    }

    var directoryNames = Object.keys(currentService);
    var currentDirectoryIndex = directoryNames.indexOf(this.state.selectedDirectory);
    var currentDirectory = currentService[this.state.selectedDirectory];

    if (!currentDirectory || !currentDirectory.items) {
      return null;
    }

    return {
      nonEmptyResults: nonEmptyResults,
      serviceNames: serviceNames,
      currentServiceIndex: currentServiceIndex,
      currentService: currentService,
      directoryNames: directoryNames,
      currentDirectoryIndex: currentDirectoryIndex,
      currentDirectory: currentDirectory
    };
  },

  moveSelectionDown: function moveSelectionDown() {
    var context = this._getCurrentResultContext();
    if (!context) {
      this.moveSelectionToTop();
      return;
    }

    if (this.state.selectedItemIndex < context.currentDirectory.items.length - 1) {
      // only bump the index if remaining in current directory
      this.setSelectedIndex(this.state.selectedService, this.state.selectedDirectory, this.state.selectedItemIndex + 1);
    } else {
      // otherwise go to next directory...
      if (context.currentDirectoryIndex < context.directoryNames.length - 1) {
        this.setSelectedIndex(this.state.selectedService, context.directoryNames[context.currentDirectoryIndex + 1], 0);
      } else {
        // ...or the next service...
        if (context.currentServiceIndex < context.serviceNames.length - 1) {
          var newServiceName = context.serviceNames[context.currentServiceIndex + 1];
          var newDirectoryName = Object.keys(context.nonEmptyResults[newServiceName]).shift();
          this.setSelectedIndex(newServiceName, newDirectoryName, 0);
        } else {
          // ...or wrap around to the very top
          this.moveSelectionToTop();
        }
      }
    }
  },

  moveSelectionUp: function moveSelectionUp() {
    var context = this._getCurrentResultContext();
    if (!context) {
      this.moveSelectionToBottom();
      return;
    }

    if (this.state.selectedItemIndex > 0) {
      // only decrease the index if remaining in current directory
      this.setSelectedIndex(this.state.selectedService, this.state.selectedDirectory, this.state.selectedItemIndex - 1);
    } else {
      // otherwise, go to the previous directory...
      if (context.currentDirectoryIndex > 0) {
        this.setSelectedIndex(this.state.selectedService, context.directoryNames[context.currentDirectoryIndex - 1], context.currentService[context.directoryNames[context.currentDirectoryIndex - 1]].items.length - 1);
      } else {
        // ...or the previous service...
        if (context.currentServiceIndex > 0) {
          var newServiceName = context.serviceNames[context.currentServiceIndex - 1];
          var newDirectoryName = Object.keys(context.nonEmptyResults[newServiceName]).pop();
          this.setSelectedIndex(newServiceName, newDirectoryName, context.nonEmptyResults[newServiceName][newDirectoryName].items.length - 1);
        } else {
          // ...or wrap around to the very bottom
          this.moveSelectionToBottom();
        }
      }
    }
  },

  // Update the scroll position of the list view to ensure the selected item is visible.
  _updateScrollPosition: function _updateScrollPosition() {
    if (!(this.refs && this.refs.selectionList)) {
      return;
    }
    var listNode = this.refs.selectionList.getDOMNode();
    var selectedNode = listNode.getElementsByClassName('selected')[0];
    // false is passed for @centerIfNeeded parameter, which defaults to true.
    // Passing false causes the minimum necessary scroll to occur, so the selection sticks to the top/bottom
    if (selectedNode) {
      selectedNode.scrollIntoViewIfNeeded(false);
    }
  },

  moveSelectionToBottom: function moveSelectionToBottom() {
    var bottom = this._getOuterResults(Array.prototype.pop);
    if (!bottom) {
      return;
    }
    this.setSelectedIndex(bottom.serviceName, bottom.directoryName, bottom.results.length - 1);
  },

  moveSelectionToTop: function moveSelectionToTop() {
    var top = this._getOuterResults(Array.prototype.shift);
    if (!top) {
      return;
    }
    this.setSelectedIndex(top.serviceName, top.directoryName, 0);
  },

  _getOuterResults: function _getOuterResults(arrayOperation) {
    var nonEmptyResults = filterEmptyResults(this.state.resultsByService);
    var serviceName = arrayOperation.call(Object.keys(nonEmptyResults));
    if (!serviceName) {
      return null;
    }
    var service = nonEmptyResults[serviceName];
    var directoryName = arrayOperation.call(Object.keys(service));
    return {
      serviceName: serviceName,
      directoryName: directoryName,
      results: nonEmptyResults[serviceName][directoryName].items
    };
  },

  getSelectedItem: function getSelectedItem() {
    return this.getItemAtIndex(this.state.selectedService, this.state.selectedDirectory, this.state.selectedItemIndex);
  },

  getItemAtIndex: function getItemAtIndex(serviceName, directory, itemIndex) {
    if (itemIndex === -1 || !this.state.resultsByService[serviceName] || !this.state.resultsByService[serviceName][directory] || !this.state.resultsByService[serviceName][directory].items[itemIndex]) {
      return null;
    }
    return this.state.resultsByService[serviceName][directory].items[itemIndex];
  },

  componentForItem: function componentForItem(item, serviceName) {
    return this.getProvider().getComponentForItem(item, serviceName);
  },

  getSelectedIndex: function getSelectedIndex() {
    return {
      selectedDirectory: this.state.selectedDirectory,
      selectedService: this.state.selectedService,
      selectedItemIndex: this.state.selectedItemIndex
    };
  },

  setSelectedIndex: function setSelectedIndex(service, directory, itemIndex) {
    var _this4 = this;

    this.setState({
      selectedService: service,
      selectedDirectory: directory,
      selectedItemIndex: itemIndex
    }, function () {
      return _this4._emitter.emit('selection-changed', _this4.getSelectedIndex());
    });
  },

  _setResult: function _setResult(serviceName, dirName, results) {
    var _this5 = this;

    var updatedResultsByDirectory = assign({}, this.state.resultsByService[serviceName], _defineProperty({}, dirName, results));
    var updatedResultsByService = assign({}, this.state.resultsByService, _defineProperty({}, serviceName, updatedResultsByDirectory));
    this.setState({
      resultsByService: updatedResultsByService
    }, function () {
      _this5._emitter.emit('items-changed', updatedResultsByService);
    });
  },

  _subscribeToResult: function _subscribeToResult(serviceName, directory, resultPromise) {
    var _this6 = this;

    resultPromise.then(function (items) {
      var updatedItems = {
        waiting: false,
        error: null,
        items: items.results
      };
      _this6._setResult(serviceName, directory, updatedItems);
    })['catch'](function (error) {
      var updatedItems = {
        waiting: false,
        error: 'an error occurred', error: error,
        items: []
      };
      _this6._setResult(serviceName, directory, updatedItems);
    });
  },

  setQuery: function setQuery(query) {
    var _this7 = this;

    var provider = this.getProvider();
    if (provider) {
      var newItems = provider.executeQuery(query);
      newItems.then(function (requestsByDirectory) {
        var groupedByService = {};
        for (var dirName in requestsByDirectory) {
          var servicesForDirectory = requestsByDirectory[dirName];
          for (var serviceName in servicesForDirectory) {
            var promise = servicesForDirectory[serviceName];
            _this7._subscribeToResult(serviceName, dirName, promise);
            if (groupedByService[serviceName] === undefined) {
              groupedByService[serviceName] = {};
            }
            groupedByService[serviceName][dirName] = {
              items: [],
              waiting: true,
              error: null
            };
          }
        }
        _this7.setState({ resultsByService: groupedByService });
      });
    }
  },

  getProvider: function getProvider() {
    return this.props.provider;
  },

  getInputTextEditor: function getInputTextEditor() {
    return this.refs.queryInput.getDOMNode();
  },

  clear: function clear() {
    this.getInputTextEditor().model.setText('');
    this.clearSelection();
  },

  focus: function focus() {
    this.getInputTextEditor().focus();
  },

  selectInput: function selectInput() {
    this.refs.queryInput.getTextEditor().selectAll();
  },

  blur: function blur() {
    this.getInputTextEditor().blur();
  },

  _handleTabChange: function _handleTabChange(newTab) {
    var _this8 = this;

    clearTimeout(this._scheduledCancel);
    var providerName = newTab.providerName;
    if (providerName !== this.state.activeTab) {
      this.setState({
        activeTab: providerName
      }, function () {
        _this8._emitter.emit('active-provider-changed', newTab.providerName);
      });
    }
  },

  _renderTabs: function _renderTabs() {
    var tabs = RENDERABLE_TABS.map(function (tab) {
      var keyBinding = null;
      if (tab.action) {
        keyBinding = React.createElement(
          'kbd',
          { className: 'key-binding' },
          QuickSelectionComponent._findKeybindingForAction(tab.action)
        );
      }
      return _extends({}, tab, {
        name: tab.providerName,
        tabContent: React.createElement(
          'span',
          null,
          tab.title,
          keyBinding
        )
      });
    });
    return React.createElement(
      'div',
      { className: 'omnisearch-tabs' },
      React.createElement(NuclideTabs, {
        tabs: tabs,
        activeTabName: this.state.activeTab,
        onActiveTabChange: this._handleTabChange,
        triggeringEvent: 'onMouseEnter'
      })
    );
  },

  _renderEmptyMessage: function _renderEmptyMessage(message) {
    return React.createElement(
      'ul',
      { className: 'background-message centered' },
      React.createElement(
        'li',
        null,
        message
      )
    );
  },

  _hasNoResults: function _hasNoResults() {
    for (var serviceName in this.state.resultsByService) {
      var service = this.state.resultsByService[serviceName];
      for (var dirName in service) {
        var results = service[dirName];
        if (!results.waiting && results.items.length > 0) {
          return false;
        }
      }
    }
    return true;
  },

  render: function render() {
    var _this9 = this;

    var itemsRendered = 0;
    var serviceNames = Object.keys(this.state.resultsByService);
    var services = serviceNames.map(function (serviceName) {
      var directories = _this9.state.resultsByService[serviceName];
      var directoryNames = Object.keys(directories);
      var directoriesForService = directoryNames.map(function (dirName) {
        var resultsForDirectory = directories[dirName];
        var message = null;
        if (resultsForDirectory.waiting) {
          itemsRendered++;
          message = React.createElement(
            'span',
            null,
            React.createElement('span', { className: 'loading loading-spinner-tiny inline-block' }),
            'Loading...'
          );
        } else if (resultsForDirectory.error) {
          message = React.createElement(
            'span',
            null,
            React.createElement('span', { className: 'icon icon-circle-slash' }),
            'Error: ',
            React.createElement(
              'pre',
              null,
              resultsForDirectory.error
            )
          );
        } else if (resultsForDirectory.items.length === 0) {
          message = React.createElement(
            'span',
            null,
            React.createElement('span', { className: 'icon icon-x' }),
            'No results'
          );
        }
        var itemComponents = resultsForDirectory.items.map(function (item, itemIndex) {
          var isSelected = serviceName === _this9.state.selectedService && dirName === _this9.state.selectedDirectory && itemIndex === _this9.state.selectedItemIndex;
          itemsRendered++;
          return React.createElement(
            'li',
            {
              className: cx({
                'quick-open-result-item': true,
                'list-item': true,
                selected: isSelected
              }),
              key: serviceName + dirName + itemIndex,
              onMouseDown: _this9.select,
              onMouseEnter: _this9.setSelectedIndex.bind(_this9, serviceName, dirName, itemIndex) },
            _this9.componentForItem(item, serviceName)
          );
        });
        //hide folders if only 1 level would be shown
        var showDirectories = directoryNames.length > 1;
        var directoryLabel = showDirectories ? React.createElement(
          'div',
          { className: 'list-item' },
          React.createElement(
            'span',
            { className: 'icon icon-file-directory' },
            dirName
          )
        ) : null;
        return React.createElement(
          'li',
          { className: cx({ 'list-nested-item': showDirectories }), key: dirName },
          directoryLabel,
          message,
          React.createElement(
            'ul',
            { className: 'list-tree' },
            itemComponents
          )
        );
      });
      return React.createElement(
        'li',
        { className: 'list-nested-item', key: serviceName },
        React.createElement(
          'div',
          { className: 'list-item' },
          React.createElement(
            'span',
            { className: 'icon icon-gear' },
            serviceName
          )
        ),
        React.createElement(
          'ul',
          { className: 'list-tree', ref: 'selectionList' },
          directoriesForService
        )
      );
    });
    var noResultsMessage = null;
    if (object.isEmpty(this.state.resultsByService)) {
      noResultsMessage = this._renderEmptyMessage('Search away!');
    } else if (itemsRendered === 0) {
      noResultsMessage = this._renderEmptyMessage(React.createElement(
        'span',
        null,
        '¯\\_(ツ)_/¯',
        React.createElement('br', null),
        'No results'
      ));
    }
    var currentProvider = this.getProvider();
    var promptText = currentProvider && currentProvider.getPromptText() || '';
    return React.createElement(
      'div',
      { className: 'select-list omnisearch-modal', ref: 'modal' },
      React.createElement(AtomInput, { ref: 'queryInput', placeholderText: promptText }),
      this._renderTabs(),
      React.createElement(
        'div',
        { className: 'omnisearch-results' },
        noResultsMessage,
        React.createElement(
          'div',
          { className: 'omnisearch-pane' },
          React.createElement(
            'ul',
            { className: 'list-tree' },
            services
          )
        )
      )
    );
  }
});

module.exports = QuickSelectionComponent;

/* EXAMPLE:
providerName: {
  directoryName: {
    items: [Array<FileResult>],
    waiting: true,
    error: null,
  },
},
*/
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXF1aWNrLW9wZW4vbGliL1F1aWNrU2VsZWN0aW9uQ29tcG9uZW50LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7SUF1RWUsd0JBQXdCLHFCQUF2QyxXQUF3QyxTQUFjLEVBQU87a0JBQ3pDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQzs7TUFBdEMsU0FBUyxhQUFULFNBQVM7O0FBQ2QsTUFBSSxhQUFhLEdBQUcsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ3hDLE1BQUksUUFBUSxHQUFHLFNBQVMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN2QyxNQUFJLE1BQU0sR0FBRyxTQUFTLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDdEMsTUFBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDOzttQkFDbUIsR0FBRyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUM7O01BQS9ELFFBQVEsY0FBUixRQUFRO01BQUUsSUFBSSxjQUFKLElBQUk7TUFBUSxhQUFhLGNBQW5CLElBQUk7O0FBQ3pCLE1BQUksU0FBUyxHQUFHLE1BQU0sTUFBTSxDQUFDLGtCQUFrQixDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQy9ELFNBQU8sU0FBUyxDQUFDO0NBQ2xCOztJQUVjLG9CQUFvQixxQkFBbkMsYUFBc0M7QUFDcEMsTUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUMxQyxNQUFJLFFBQVEsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUN0Qix3QkFBd0IsQ0FDekIsQ0FBQztBQUNGLFNBQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztDQUM5Qjs7Ozs7O0FBeEZELFdBQVcsQ0FBQzs7QUFnQlosSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLHVCQUF1QixDQUFDLENBQUM7O2VBQ0EsT0FBTyxDQUFDLE1BQU0sQ0FB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S0FDcEY7QUFDRCxRQUFJLGVBQWUsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDekMsUUFBSSxVQUFVLEdBQUcsQUFBQyxlQUFlLElBQUksZUFBZSxDQUFDLGFBQWEsRUFBRSxJQUFLLEVBQUUsQ0FBQztBQUM1RSxXQUNFOztRQUFLLFNBQVMsRUFBQyw4QkFBOEIsRUFBQyxHQUFHLEVBQUMsT0FBTztNQUN2RCxvQkFBQyxTQUFTLElBQUMsR0FBRyxFQUFDLFlBQVksRUFBQyxlQUFlLEVBQUUsVUFBVSxBQUFDLEdBQUc7TUFDMUQsSUFBSSxDQUFDLFdBQVcsRUFBRTtNQUNuQjs7VUFBSyxTQUFTLEVBQUMsb0JBQW9CO1FBQ2hDLGdCQUFnQjtRQUNqQjs7WUFBSyxTQUFTLEVBQUMsaUJBQWlCO1VBQzlCOztjQUFJLFNBQVMsRUFBQyxXQUFXO1lBQ3RCLFFBQVE7V0FDTjtTQUNEO09BQ0Y7S0FDRixDQUNOO0dBQ0g7Q0FDRixDQUFDLENBQUM7O0FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRyx1QkFBdUIsQ0FBQyIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvbnVjbGlkZS1xdWljay1vcGVuL2xpYi9RdWlja1NlbGVjdGlvbkNvbXBvbmVudC5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbmltcG9ydCB0eXBlIHtcbiAgRmlsZVJlc3VsdCxcbiAgR3JvdXBlZFJlc3VsdCxcbn0gZnJvbSAnLi90eXBlcyc7XG5cbnZhciBBdG9tSW5wdXQgPSByZXF1aXJlKCdudWNsaWRlLXVpLWF0b20taW5wdXQnKTtcbnZhciB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSwgRW1pdHRlcn0gPSByZXF1aXJlKCdhdG9tJyk7XG52YXIgUXVpY2tTZWxlY3Rpb25Qcm92aWRlciA9IHJlcXVpcmUoJy4vUXVpY2tTZWxlY3Rpb25Qcm92aWRlcicpO1xudmFyIHtcbiAgYXJyYXksXG4gIGRlYm91bmNlLFxuICBvYmplY3QsXG59ID0gcmVxdWlyZSgnbnVjbGlkZS1jb21tb25zJyk7XG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC1mb3ItYXRvbScpO1xudmFyIE51Y2xpZGVUYWJzID0gcmVxdWlyZSgnbnVjbGlkZS11aS10YWJzJyk7XG5cbnZhciB7XG4gIGZpbHRlckVtcHR5UmVzdWx0cyxcbiAgZmxhdHRlblJlc3VsdHMsXG59ID0gcmVxdWlyZSgnLi9zZWFyY2hSZXN1bHRIZWxwZXJzJyk7XG5cbnZhciB7UHJvcFR5cGVzfSA9IFJlYWN0O1xuXG52YXIgYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCByZXF1aXJlKCdvYmplY3QtYXNzaWduJyk7XG52YXIgY3ggPSByZXF1aXJlKCdyZWFjdC1jbGFzc3NldCcpO1xuXG4vLyBrZWVwIGBhY3Rpb25gIGluIHN5bmMgd2l0aCBrZXltYXAuXG52YXIgREVGQVVMVF9UQUJTID0gW1xuICB7XG4gICBwcm92aWRlck5hbWU6ICdPbW5pU2VhcmNoUmVzdWx0UHJvdmlkZXInLFxuICAgdGl0bGU6ICdBbGwgUmVzdWx0cycsXG4gICBhY3Rpb246ICdudWNsaWRlLXF1aWNrLW9wZW46dG9nZ2xlLW9tbmktc2VhcmNoJyxcbiAgfSxcbiAge1xuICAgcHJvdmlkZXJOYW1lOiAnRmlsZUxpc3RQcm92aWRlcicsXG4gICB0aXRsZTogJ0ZpbGVuYW1lcycsXG4gICBhY3Rpb246ICdudWNsaWRlLXF1aWNrLW9wZW46dG9nZ2xlLXF1aWNrLW9wZW4nLFxuICB9LFxuICB7XG4gICBwcm92aWRlck5hbWU6ICdPcGVuRmlsZUxpc3RQcm92aWRlcicsXG4gICB0aXRsZTogJ09wZW4gRmlsZXMnLFxuICAgYWN0aW9uOiAnbnVjbGlkZS1xdWljay1vcGVuOnRvZ2dsZS1vcGVuZmlsZW5hbWUtc2VhcmNoJyxcbiAgfSxcbl07XG5cbnZhciBEWU5BTUlDX1RBQlMgPSB7XG4gIGJpZ2dyZXA6IHtcbiAgIHByb3ZpZGVyTmFtZTogJ0JpZ0dyZXBMaXN0UHJvdmlkZXInLFxuICAgdGl0bGU6ICdCaWdHcmVwJyxcbiAgIGFjdGlvbjogJ251Y2xpZGUtcXVpY2stb3Blbjp0b2dnbGUtYmlnZ3JlcC1zZWFyY2gnLFxuICB9LFxuICBoYWNrOiB7XG4gICBwcm92aWRlck5hbWU6ICdTeW1ib2xMaXN0UHJvdmlkZXInLFxuICAgdGl0bGU6ICdTeW1ib2xzJyxcbiAgIGFjdGlvbjogJ251Y2xpZGUtcXVpY2stb3Blbjp0b2dnbGUtc3ltYm9sLXNlYXJjaCcsXG4gIH0sXG59O1xuXG52YXIgUkVOREVSQUJMRV9UQUJTID0gREVGQVVMVF9UQUJTLnNsaWNlKCk7XG5cbmFzeW5jIGZ1bmN0aW9uIF9nZXRTZXJ2aWNlc0ZvckRpcmVjdG9yeShkaXJlY3Rvcnk6IGFueSk6IGFueSB7XG4gIHZhciB7Z2V0Q2xpZW50fSA9IHJlcXVpcmUoJ251Y2xpZGUtY2xpZW50Jyk7XG4gIHZhciBkaXJlY3RvcnlQYXRoID0gZGlyZWN0b3J5LmdldFBhdGgoKTtcbiAgdmFyIGJhc2VuYW1lID0gZGlyZWN0b3J5LmdldEJhc2VOYW1lKCk7XG4gIHZhciBjbGllbnQgPSBnZXRDbGllbnQoZGlyZWN0b3J5UGF0aCk7XG4gIHZhciB1cmwgPSByZXF1aXJlKCd1cmwnKTtcbiAgdmFyIHtwcm90b2NvbCwgaG9zdCwgcGF0aDogcm9vdERpcmVjdG9yeX0gPSB1cmwucGFyc2UoZGlyZWN0b3J5UGF0aCk7XG4gIHZhciBwcm92aWRlcnMgPSBhd2FpdCBjbGllbnQuZ2V0U2VhcmNoUHJvdmlkZXJzKHJvb3REaXJlY3RvcnkpO1xuICByZXR1cm4gcHJvdmlkZXJzO1xufVxuXG5hc3luYyBmdW5jdGlvbiBfZ2V0RWxpZ2libGVTZXJ2aWNlcygpIHtcbiAgdmFyIHBhdGhzID0gYXRvbS5wcm9qZWN0LmdldERpcmVjdG9yaWVzKCk7XG4gIHZhciBzZXJ2aWNlcyA9IHBhdGhzLm1hcChcbiAgICBfZ2V0U2VydmljZXNGb3JEaXJlY3RvcnlcbiAgKTtcbiAgcmV0dXJuIFByb21pc2UuYWxsKHNlcnZpY2VzKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlUmVuZGVyYWJsZVRhYnMoKSB7XG4gIHZhciBlbGlnaWJsZVNlcnZpY2VUYWJzID0gX2dldEVsaWdpYmxlU2VydmljZXMoKS50aGVuKChzZXJ2aWNlcykgPT4ge1xuICAgIFJFTkRFUkFCTEVfVEFCUyA9IERFRkFVTFRfVEFCUy5zbGljZSgpO1xuICAgIHZhciBkeW5hbWljVGFiID0gQXJyYXkucHJvdG90eXBlLmNvbmNhdC5hcHBseShbXSwgc2VydmljZXMpXG4gICAgICAuZmlsdGVyKHNlcnZpY2UgPT4gRFlOQU1JQ19UQUJTLmhhc093blByb3BlcnR5KHNlcnZpY2UubmFtZSkpXG4gICAgICAubWFwKHNlcnZpY2UgPT4gRFlOQU1JQ19UQUJTW3NlcnZpY2UubmFtZV0pO1xuICAgIC8vIGluc2VydCBkeW5hbWljIHRhYnMgYXQgaW5kZXggMSAoYWZ0ZXIgdGhlIE9tbmlTZWFyY2hQcm92aWRlcikuXG4gICAgUkVOREVSQUJMRV9UQUJTLnNwbGljZS5hcHBseShcbiAgICAgIFJFTkRFUkFCTEVfVEFCUyxcbiAgICAgIFsxLCAwXS5jb25jYXQoZHluYW1pY1RhYilcbiAgICApO1xuICB9KTtcbn1cblxuLy8gVGhpcyB0aW1lb3V0IGlzIHJlcXVpcmVkIHRvIGtlZXAgdGVzdHMgZnJvbSBicmVha2luZywgc2luY2UgYGF0b20ucHJvamVjdGAgYXBwZWFycyB0byBzdGlsbFxuLy8gYmUgaW5pdGlhbGl6aW5nIGF0IHRoZSB0aW1lIHRoaXMgbW9kdWxlIGlzIHJlcXVpcmVkLCBicmVha2luZyB0aGUgZG9jdW1lbnRlZCBBUEkgYmVoYXZpb3IsIHdoaWNoXG4vLyBzcGVjaWZpZXMgdGhhdCBcIkFuIGluc3RhbmNlIG9mIFtQcm9qZWN0XSBpcyBhbHdheXMgYXZhaWxhYmxlIGFzIHRoZSBgYXRvbS5wcm9qZWN0YCBnbG9iYWwuXCJcbi8vIGh0dHBzOi8vYXRvbS5pby9kb2NzL2FwaS92MC4yMTEuMC9Qcm9qZWN0XG52YXIgZGlzcG9zZU9mTWU7XG5zZXRUaW1lb3V0KCgpID0+IHtcbiAgZGlzcG9zZU9mTWUgPSBhdG9tLnByb2plY3Qub25EaWRDaGFuZ2VQYXRocyh1cGRhdGVSZW5kZXJhYmxlVGFicyk7XG59LCAxMDAwKTtcbnVwZGF0ZVJlbmRlcmFibGVUYWJzKCk7XG5cbnZhciBERUZBVUxUX1RBQiA9IFJFTkRFUkFCTEVfVEFCU1swXTtcblxudmFyIFF1aWNrU2VsZWN0aW9uQ29tcG9uZW50ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBfZW1pdHRlcjogdW5kZWZpbmVkLFxuICBfc3Vic2NyaXB0aW9uczogdW5kZWZpbmVkLFxuXG4gIHByb3BUeXBlczoge1xuICAgIHByb3ZpZGVyOiBQcm9wVHlwZXMuaW5zdGFuY2VPZihRdWlja1NlbGVjdGlvblByb3ZpZGVyKS5pc1JlcXVpcmVkLFxuICB9LFxuXG4gIHN0YXRpY3M6IHtcbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmUgd2hhdCB0aGUgYXBwbGljYWJsZSBzaG9ydGN1dCBmb3IgYSBnaXZlbiBhY3Rpb24gaXMgd2l0aGluIHRoaXMgY29tcG9uZW50J3MgY29udGV4dC5cbiAgICAgKiBGb3IgZXhhbXBsZSwgdGhpcyB3aWxsIHJldHVybiBkaWZmZXJlbnQga2V5YmluZGluZ3Mgb24gd2luZG93cyB2cyBsaW51eC5cbiAgICAgICpcbiAgICAgKiBUT0RPIHJlcGxhY2Ugd2l0aCBodW1hbml6ZUtleXN0cm9rZSBmcm9tIGF1dG9jb21wbGV0ZS1wbHVzIHBhY2thZ2UsXG4gICAgICogb25jZSBpdCBiZWNvbWVzIGEgc3RhbmRhbG9uZSBwYWNrYWdlOlxuICAgICAqIGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL3VuZGVyc2NvcmUtcGx1cy9ibG9iL21hc3Rlci9zcmMvdW5kZXJzY29yZS1wbHVzLmNvZmZlZSNMMTc5XG4gICAgICovXG4gICAgX2ZpbmRLZXliaW5kaW5nRm9yQWN0aW9uKGFjdGlvbjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgIHZhciBtYXRjaGluZ0tleUJpbmRpbmdzID0gYXRvbS5rZXltYXBzLmZpbmRLZXlCaW5kaW5ncyh7XG4gICAgICAgIGNvbW1hbmQ6IGFjdGlvbixcbiAgICAgICAgdGFyZ2V0OiB0aGlzLl9tb2RhbE5vZGUsXG4gICAgICB9KTtcbiAgICAgIHZhciBrZXlzdHJva2UgPSAobWF0Y2hpbmdLZXlCaW5kaW5ncy5sZW5ndGggJiYgbWF0Y2hpbmdLZXlCaW5kaW5nc1swXS5rZXlzdHJva2VzKSB8fCAnJztcbiAgICAgIHJldHVybiAoXG4gICAgICAgIGtleXN0cm9rZVxuICAgICAgICAgIC5yZXBsYWNlKC9jbWQvZ2ksICfijJgnKVxuICAgICAgICAgIC5yZXBsYWNlKC9hbHQvZ2ksICfijKUnKVxuICAgICAgICAgIC5yZXBsYWNlKC9bXFwrLV0vZywgJycpXG4gICAgICAgICAgLnRvVXBwZXJDYXNlKClcbiAgICAgICk7XG4gICAgfSxcbiAgfSxcblxuICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzKG5leHRQcm9wczogYW55KSB7XG4gICAgaWYgKG5leHRQcm9wcy5wcm92aWRlciAhPT0gdGhpcy5wcm9wcy5wcm92aWRlcikge1xuICAgICAgaWYgKG5leHRQcm9wcy5wcm92aWRlcikge1xuICAgICAgICB0aGlzLnJlZnMucXVlcnlJbnB1dC5nZXRUZXh0RWRpdG9yKCkuc2V0UGxhY2Vob2xkZXJUZXh0KG5leHRQcm9wcy5wcm92aWRlci5nZXRQcm9tcHRUZXh0KCkpO1xuICAgICAgICB2YXIgbmV3UmVzdWx0cyA9IHt9O1xuICAgICAgICB0aGlzLnNldFN0YXRlKFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGFjdGl2ZVRhYjogbmV4dFByb3BzLnByb3ZpZGVyLmNvbnN0cnVjdG9yLm5hbWUgfHwgREVGQVVMVF9UQUIucHJvdmlkZXJOYW1lLFxuICAgICAgICAgICAgcmVzdWx0c0J5U2VydmljZTogbmV3UmVzdWx0cyxcbiAgICAgICAgICAgfSxcbiAgICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgIHRoaXMuc2V0UXVlcnkodGhpcy5yZWZzLnF1ZXJ5SW5wdXQuZ2V0VGV4dCgpKTtcbiAgICAgICAgICAgICB0aGlzLl91cGRhdGVRdWVyeUhhbmRsZXIoKTtcbiAgICAgICAgICAgICB0aGlzLl9lbWl0dGVyLmVtaXQoJ2l0ZW1zLWNoYW5nZWQnLCBuZXdSZXN1bHRzKTtcbiAgICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBjb21wb25lbnREaWRVcGRhdGUocHJldlByb3BzOiBhbnksIHByZXZTdGF0ZTogYW55KSB7XG4gICAgaWYgKHByZXZTdGF0ZS5yZXN1bHRzQnlTZXJ2aWNlICE9PSB0aGlzLnN0YXRlLnJlc3VsdHNCeVNlcnZpY2UpIHtcbiAgICAgIHRoaXMuX2VtaXR0ZXIuZW1pdCgnaXRlbXMtY2hhbmdlZCcsIHRoaXMuc3RhdGUucmVzdWx0c0J5U2VydmljZSk7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgcHJldlN0YXRlLnNlbGVjdGVkSXRlbUluZGV4ICE9PSB0aGlzLnN0YXRlLnNlbGVjdGVkSXRlbUluZGV4IHx8XG4gICAgICBwcmV2U3RhdGUuc2VsZWN0ZWRTZXJ2aWNlICE9PSB0aGlzLnN0YXRlLnNlbGVjdGVkU2VydmljZSB8fFxuICAgICAgcHJldlN0YXRlLnNlbGVjdGVkRGlyZWN0b3J5ICE9PSB0aGlzLnN0YXRlLnNlbGVjdGVkRGlyZWN0b3J5XG4gICAgKSB7XG4gICAgICB0aGlzLl91cGRhdGVTY3JvbGxQb3NpdGlvbigpO1xuICAgIH1cbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGUoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIC8vIHRyZWF0ZWQgYXMgaW1tdXRhYmxlXG4gICAgICByZXN1bHRzQnlTZXJ2aWNlOiB7XG4gICAgICAgIC8qIEVYQU1QTEU6XG4gICAgICAgIHByb3ZpZGVyTmFtZToge1xuICAgICAgICAgIGRpcmVjdG9yeU5hbWU6IHtcbiAgICAgICAgICAgIGl0ZW1zOiBbQXJyYXk8RmlsZVJlc3VsdD5dLFxuICAgICAgICAgICAgd2FpdGluZzogdHJ1ZSxcbiAgICAgICAgICAgIGVycm9yOiBudWxsLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgICovXG4gICAgICB9LFxuICAgICAgc2VsZWN0ZWREaXJlY3Rvcnk6ICcnLFxuICAgICAgc2VsZWN0ZWRTZXJ2aWNlOiAnJyxcbiAgICAgIHNlbGVjdGVkSXRlbUluZGV4OiAtMSxcbiAgICAgIGFjdGl2ZVRhYjogREVGQVVMVF9UQUIucHJvdmlkZXJOYW1lLFxuICAgIH07XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgdGhpcy5fZW1pdHRlciA9IG5ldyBFbWl0dGVyKCk7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgdGhpcy5fbW9kYWxOb2RlID0gdGhpcy5nZXRET01Ob2RlKCk7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICBhdG9tLmNvbW1hbmRzLmFkZCh0aGlzLl9tb2RhbE5vZGUsICdjb3JlOm1vdmUtdXAnLCB0aGlzLm1vdmVTZWxlY3Rpb25VcCksXG4gICAgICBhdG9tLmNvbW1hbmRzLmFkZCh0aGlzLl9tb2RhbE5vZGUsICdjb3JlOm1vdmUtZG93bicsIHRoaXMubW92ZVNlbGVjdGlvbkRvd24pLFxuICAgICAgYXRvbS5jb21tYW5kcy5hZGQodGhpcy5fbW9kYWxOb2RlLCAnY29yZTptb3ZlLXRvLXRvcCcsIHRoaXMubW92ZVNlbGVjdGlvblRvVG9wKSxcbiAgICAgIGF0b20uY29tbWFuZHMuYWRkKHRoaXMuX21vZGFsTm9kZSwgJ2NvcmU6bW92ZS10by1ib3R0b20nLCB0aGlzLm1vdmVTZWxlY3Rpb25Ub0JvdHRvbSksXG4gICAgICBhdG9tLmNvbW1hbmRzLmFkZCh0aGlzLl9tb2RhbE5vZGUsICdjb3JlOmNvbmZpcm0nLCB0aGlzLnNlbGVjdCksXG4gICAgICBhdG9tLmNvbW1hbmRzLmFkZCh0aGlzLl9tb2RhbE5vZGUsICdjb3JlOmNhbmNlbCcsIHRoaXMuY2FuY2VsKVxuICAgICk7XG5cbiAgICB2YXIgaW5wdXRUZXh0RWRpdG9yID0gdGhpcy5nZXRJbnB1dFRleHRFZGl0b3IoKTtcbiAgICBpbnB1dFRleHRFZGl0b3IuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIChldmVudCkgPT4ge1xuICAgICAgaWYgKGV2ZW50LnJlbGF0ZWRUYXJnZXQgIT09IG51bGwpIHtcbiAgICAgICAgLy8gY2FuY2VsIGNhbiBiZSBpbnRlcnJ1cHRlZCBieSB1c2VyIGludGVyYWN0aW9uIHdpdGggdGhlIG1vZGFsXG4gICAgICAgIHRoaXMuX3NjaGVkdWxlZENhbmNlbCA9IHNldFRpbWVvdXQodGhpcy5jYW5jZWwsIDEwMCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLl91cGRhdGVRdWVyeUhhbmRsZXIoKTtcbiAgICBpbnB1dFRleHRFZGl0b3IubW9kZWwub25EaWRDaGFuZ2UodGhpcy5faGFuZGxlVGV4dElucHV0Q2hhbmdlKTtcbiAgICB0aGlzLmNsZWFyKCk7XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQoKSB7XG4gICAgdGhpcy5fZW1pdHRlci5kaXNwb3NlKCk7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5kaXNwb3NlKCk7XG4gIH0sXG5cbiAgb25DYW5jZWxsYXRpb24oY2FsbGJhY2s6ICgpID0+IHZvaWQpOiBEaXNwb3NhYmxlIHtcbiAgICByZXR1cm4gdGhpcy5fZW1pdHRlci5vbignY2FuY2VsZWQnLCBjYWxsYmFjayk7XG4gIH0sXG5cbiAgb25TZWxlY3Rpb24oY2FsbGJhY2s6IChzZWxlY3Rpb246IGFueSkgPT4gdm9pZCk6IERpc3Bvc2FibGUge1xuICAgIHJldHVybiB0aGlzLl9lbWl0dGVyLm9uKCdzZWxlY3RlZCcsIGNhbGxiYWNrKTtcbiAgfSxcblxuICBvblNlbGVjdGlvbkNoYW5nZWQoY2FsbGJhY2s6IChzZWxlY3Rpb25JbmRleDogYW55KSA9PiB2b2lkKTogRGlzcG9zYWJsZSB7XG4gICAgcmV0dXJuIHRoaXMuX2VtaXR0ZXIub24oJ3NlbGVjdGlvbi1jaGFuZ2VkJywgY2FsbGJhY2spO1xuICB9LFxuXG4gIG9uSXRlbXNDaGFuZ2VkKGNhbGxiYWNrOiAobmV3SXRlbXM6IEdyb3VwZWRSZXN1bHQpID0+IHZvaWQpOiBEaXNwb3NhYmxlIHtcbiAgICByZXR1cm4gdGhpcy5fZW1pdHRlci5vbignaXRlbXMtY2hhbmdlZCcsIGNhbGxiYWNrKTtcbiAgfSxcblxuICBvblRhYkNoYW5nZShjYWxsYmFjazogKHByb3ZpZGVyTmFtZTogc3RyaW5nKSA9PiB2b2lkKTogRGlzcG9zYWJsZSB7XG4gICAgcmV0dXJuIHRoaXMuX2VtaXR0ZXIub24oJ2FjdGl2ZS1wcm92aWRlci1jaGFuZ2VkJywgY2FsbGJhY2spO1xuICB9LFxuXG4gIF91cGRhdGVRdWVyeUhhbmRsZXIoKTogdm9pZCB7XG4gICAgdGhpcy5fZGVib3VuY2VkUXVlcnlIYW5kbGVyID0gZGVib3VuY2UoXG4gICAgICAoKSA9PiB0aGlzLnNldFF1ZXJ5KHRoaXMuZ2V0SW5wdXRUZXh0RWRpdG9yKCkubW9kZWwuZ2V0VGV4dCgpKSxcbiAgICAgIHRoaXMuZ2V0UHJvdmlkZXIoKS5nZXREZWJvdW5jZURlbGF5KClcbiAgICApO1xuICB9LFxuXG4gIF9oYW5kbGVUZXh0SW5wdXRDaGFuZ2UoKTogdm9pZCB7XG4gICAgdGhpcy5fZGVib3VuY2VkUXVlcnlIYW5kbGVyKCk7XG4gIH0sXG5cbiAgc2VsZWN0KCkge1xuICAgIHZhciBzZWxlY3RlZEl0ZW0gPSB0aGlzLmdldFNlbGVjdGVkSXRlbSgpO1xuICAgIGlmICghc2VsZWN0ZWRJdGVtKSB7XG4gICAgICB0aGlzLmNhbmNlbCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9lbWl0dGVyLmVtaXQoJ3NlbGVjdGVkJywgc2VsZWN0ZWRJdGVtKTtcbiAgICB9XG4gIH0sXG5cbiAgY2FuY2VsKCkge1xuICAgIHRoaXMuX2VtaXR0ZXIuZW1pdCgnY2FuY2VsZWQnKTtcbiAgfSxcblxuICBjbGVhclNlbGVjdGlvbigpIHtcbiAgICB0aGlzLnNldFNlbGVjdGVkSW5kZXgoJycsICcnLCAtMSk7XG4gIH0sXG5cbiAgX2dldEN1cnJlbnRSZXN1bHRDb250ZXh0KCk6IGFueXtcbiAgICB2YXIgbm9uRW1wdHlSZXN1bHRzID0gZmlsdGVyRW1wdHlSZXN1bHRzKHRoaXMuc3RhdGUucmVzdWx0c0J5U2VydmljZSk7XG4gICAgdmFyIHNlcnZpY2VOYW1lcyA9IE9iamVjdC5rZXlzKG5vbkVtcHR5UmVzdWx0cyk7XG4gICAgdmFyIGN1cnJlbnRTZXJ2aWNlSW5kZXggPSBzZXJ2aWNlTmFtZXMuaW5kZXhPZih0aGlzLnN0YXRlLnNlbGVjdGVkU2VydmljZSk7XG4gICAgdmFyIGN1cnJlbnRTZXJ2aWNlID0gbm9uRW1wdHlSZXN1bHRzW3RoaXMuc3RhdGUuc2VsZWN0ZWRTZXJ2aWNlXTtcblxuICAgIGlmICghY3VycmVudFNlcnZpY2UpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHZhciBkaXJlY3RvcnlOYW1lcyA9IE9iamVjdC5rZXlzKGN1cnJlbnRTZXJ2aWNlKTtcbiAgICB2YXIgY3VycmVudERpcmVjdG9yeUluZGV4ID0gZGlyZWN0b3J5TmFtZXMuaW5kZXhPZih0aGlzLnN0YXRlLnNlbGVjdGVkRGlyZWN0b3J5KTtcbiAgICB2YXIgY3VycmVudERpcmVjdG9yeSA9IGN1cnJlbnRTZXJ2aWNlW3RoaXMuc3RhdGUuc2VsZWN0ZWREaXJlY3RvcnldO1xuXG4gICAgaWYgKCFjdXJyZW50RGlyZWN0b3J5IHx8ICFjdXJyZW50RGlyZWN0b3J5Lml0ZW1zKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgbm9uRW1wdHlSZXN1bHRzLFxuICAgICAgc2VydmljZU5hbWVzLFxuICAgICAgY3VycmVudFNlcnZpY2VJbmRleCxcbiAgICAgIGN1cnJlbnRTZXJ2aWNlLFxuICAgICAgZGlyZWN0b3J5TmFtZXMsXG4gICAgICBjdXJyZW50RGlyZWN0b3J5SW5kZXgsXG4gICAgICBjdXJyZW50RGlyZWN0b3J5LFxuICAgIH07XG4gIH0sXG5cbiAgbW92ZVNlbGVjdGlvbkRvd24oKSB7XG4gICAgdmFyIGNvbnRleHQgPSB0aGlzLl9nZXRDdXJyZW50UmVzdWx0Q29udGV4dCgpO1xuICAgIGlmICghY29udGV4dCkge1xuICAgICAgdGhpcy5tb3ZlU2VsZWN0aW9uVG9Ub3AoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zdGF0ZS5zZWxlY3RlZEl0ZW1JbmRleCA8IGNvbnRleHQuY3VycmVudERpcmVjdG9yeS5pdGVtcy5sZW5ndGggLSAxKSB7XG4gICAgICAvLyBvbmx5IGJ1bXAgdGhlIGluZGV4IGlmIHJlbWFpbmluZyBpbiBjdXJyZW50IGRpcmVjdG9yeVxuICAgICAgdGhpcy5zZXRTZWxlY3RlZEluZGV4KFxuICAgICAgICB0aGlzLnN0YXRlLnNlbGVjdGVkU2VydmljZSxcbiAgICAgICAgdGhpcy5zdGF0ZS5zZWxlY3RlZERpcmVjdG9yeSxcbiAgICAgICAgdGhpcy5zdGF0ZS5zZWxlY3RlZEl0ZW1JbmRleCArIDFcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIG90aGVyd2lzZSBnbyB0byBuZXh0IGRpcmVjdG9yeS4uLlxuICAgICAgaWYgKGNvbnRleHQuY3VycmVudERpcmVjdG9yeUluZGV4IDwgY29udGV4dC5kaXJlY3RvcnlOYW1lcy5sZW5ndGggLSAxKSB7XG4gICAgICAgIHRoaXMuc2V0U2VsZWN0ZWRJbmRleChcbiAgICAgICAgICB0aGlzLnN0YXRlLnNlbGVjdGVkU2VydmljZSxcbiAgICAgICAgICBjb250ZXh0LmRpcmVjdG9yeU5hbWVzW2NvbnRleHQuY3VycmVudERpcmVjdG9yeUluZGV4ICsgMV0sXG4gICAgICAgICAgMFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gLi4ub3IgdGhlIG5leHQgc2VydmljZS4uLlxuICAgICAgICBpZiAoY29udGV4dC5jdXJyZW50U2VydmljZUluZGV4IDwgY29udGV4dC5zZXJ2aWNlTmFtZXMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgIHZhciBuZXdTZXJ2aWNlTmFtZSA9IGNvbnRleHQuc2VydmljZU5hbWVzW2NvbnRleHQuY3VycmVudFNlcnZpY2VJbmRleCArIDFdO1xuICAgICAgICAgIHZhciBuZXdEaXJlY3RvcnlOYW1lID0gT2JqZWN0LmtleXMoY29udGV4dC5ub25FbXB0eVJlc3VsdHNbbmV3U2VydmljZU5hbWVdKS5zaGlmdCgpO1xuICAgICAgICAgIHRoaXMuc2V0U2VsZWN0ZWRJbmRleChuZXdTZXJ2aWNlTmFtZSwgbmV3RGlyZWN0b3J5TmFtZSwgMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gLi4ub3Igd3JhcCBhcm91bmQgdG8gdGhlIHZlcnkgdG9wXG4gICAgICAgICAgdGhpcy5tb3ZlU2VsZWN0aW9uVG9Ub3AoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBtb3ZlU2VsZWN0aW9uVXAoKSB7XG4gICAgdmFyIGNvbnRleHQgPSB0aGlzLl9nZXRDdXJyZW50UmVzdWx0Q29udGV4dCgpO1xuICAgIGlmICghY29udGV4dCkge1xuICAgICAgdGhpcy5tb3ZlU2VsZWN0aW9uVG9Cb3R0b20oKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zdGF0ZS5zZWxlY3RlZEl0ZW1JbmRleCA+IDApIHtcbiAgICAgIC8vIG9ubHkgZGVjcmVhc2UgdGhlIGluZGV4IGlmIHJlbWFpbmluZyBpbiBjdXJyZW50IGRpcmVjdG9yeVxuICAgICAgdGhpcy5zZXRTZWxlY3RlZEluZGV4KFxuICAgICAgICB0aGlzLnN0YXRlLnNlbGVjdGVkU2VydmljZSxcbiAgICAgICAgdGhpcy5zdGF0ZS5zZWxlY3RlZERpcmVjdG9yeSxcbiAgICAgICAgdGhpcy5zdGF0ZS5zZWxlY3RlZEl0ZW1JbmRleCAtIDFcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIG90aGVyd2lzZSwgZ28gdG8gdGhlIHByZXZpb3VzIGRpcmVjdG9yeS4uLlxuICAgICAgaWYgKGNvbnRleHQuY3VycmVudERpcmVjdG9yeUluZGV4ID4gMCkge1xuICAgICAgICB0aGlzLnNldFNlbGVjdGVkSW5kZXgoXG4gICAgICAgICAgdGhpcy5zdGF0ZS5zZWxlY3RlZFNlcnZpY2UsXG4gICAgICAgICAgY29udGV4dC5kaXJlY3RvcnlOYW1lc1tjb250ZXh0LmN1cnJlbnREaXJlY3RvcnlJbmRleCAtIDFdLFxuICAgICAgICAgIGNvbnRleHQuY3VycmVudFNlcnZpY2VbY29udGV4dC5kaXJlY3RvcnlOYW1lc1tjb250ZXh0LmN1cnJlbnREaXJlY3RvcnlJbmRleCAtIDFdXS5pdGVtcy5sZW5ndGggLSAxXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyAuLi5vciB0aGUgcHJldmlvdXMgc2VydmljZS4uLlxuICAgICAgICBpZiAoY29udGV4dC5jdXJyZW50U2VydmljZUluZGV4ID4gMCkge1xuICAgICAgICAgIHZhciBuZXdTZXJ2aWNlTmFtZSA9IGNvbnRleHQuc2VydmljZU5hbWVzW2NvbnRleHQuY3VycmVudFNlcnZpY2VJbmRleCAtIDFdO1xuICAgICAgICAgIHZhciBuZXdEaXJlY3RvcnlOYW1lID0gT2JqZWN0LmtleXMoY29udGV4dC5ub25FbXB0eVJlc3VsdHNbbmV3U2VydmljZU5hbWVdKS5wb3AoKTtcbiAgICAgICAgICB0aGlzLnNldFNlbGVjdGVkSW5kZXgoXG4gICAgICAgICAgICBuZXdTZXJ2aWNlTmFtZSxcbiAgICAgICAgICAgIG5ld0RpcmVjdG9yeU5hbWUsXG4gICAgICAgICAgICBjb250ZXh0Lm5vbkVtcHR5UmVzdWx0c1tuZXdTZXJ2aWNlTmFtZV1bbmV3RGlyZWN0b3J5TmFtZV0uaXRlbXMubGVuZ3RoIC0gMVxuICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gLi4ub3Igd3JhcCBhcm91bmQgdG8gdGhlIHZlcnkgYm90dG9tXG4gICAgICAgICAgdGhpcy5tb3ZlU2VsZWN0aW9uVG9Cb3R0b20oKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICAvLyBVcGRhdGUgdGhlIHNjcm9sbCBwb3NpdGlvbiBvZiB0aGUgbGlzdCB2aWV3IHRvIGVuc3VyZSB0aGUgc2VsZWN0ZWQgaXRlbSBpcyB2aXNpYmxlLlxuICBfdXBkYXRlU2Nyb2xsUG9zaXRpb24oKSB7XG4gICAgaWYgKCEodGhpcy5yZWZzICYmIHRoaXMucmVmcy5zZWxlY3Rpb25MaXN0KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgbGlzdE5vZGUgPSAgdGhpcy5yZWZzLnNlbGVjdGlvbkxpc3QuZ2V0RE9NTm9kZSgpO1xuICAgIHZhciBzZWxlY3RlZE5vZGUgPSBsaXN0Tm9kZS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdzZWxlY3RlZCcpWzBdO1xuICAgIC8vIGZhbHNlIGlzIHBhc3NlZCBmb3IgQGNlbnRlcklmTmVlZGVkIHBhcmFtZXRlciwgd2hpY2ggZGVmYXVsdHMgdG8gdHJ1ZS5cbiAgICAvLyBQYXNzaW5nIGZhbHNlIGNhdXNlcyB0aGUgbWluaW11bSBuZWNlc3Nhcnkgc2Nyb2xsIHRvIG9jY3VyLCBzbyB0aGUgc2VsZWN0aW9uIHN0aWNrcyB0byB0aGUgdG9wL2JvdHRvbVxuICAgIGlmIChzZWxlY3RlZE5vZGUpIHtcbiAgICAgIHNlbGVjdGVkTm9kZS5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKGZhbHNlKTtcbiAgICB9XG4gIH0sXG5cbiAgbW92ZVNlbGVjdGlvblRvQm90dG9tKCk6IHZvaWQge1xuICAgIHZhciBib3R0b20gPSB0aGlzLl9nZXRPdXRlclJlc3VsdHMoQXJyYXkucHJvdG90eXBlLnBvcCk7XG4gICAgaWYgKCFib3R0b20pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5zZXRTZWxlY3RlZEluZGV4KGJvdHRvbS5zZXJ2aWNlTmFtZSwgYm90dG9tLmRpcmVjdG9yeU5hbWUsIGJvdHRvbS5yZXN1bHRzLmxlbmd0aCAtIDEpO1xuICB9LFxuXG4gIG1vdmVTZWxlY3Rpb25Ub1RvcCgpOiB2b2lkIHtcbiAgICB2YXIgdG9wID0gdGhpcy5fZ2V0T3V0ZXJSZXN1bHRzKEFycmF5LnByb3RvdHlwZS5zaGlmdCk7XG4gICAgaWYgKCF0b3ApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5zZXRTZWxlY3RlZEluZGV4KHRvcC5zZXJ2aWNlTmFtZSwgdG9wLmRpcmVjdG9yeU5hbWUsIDApO1xuICB9LFxuXG4gIF9nZXRPdXRlclJlc3VsdHMoYXJyYXlPcGVyYXRpb246IEZ1bmN0aW9uKTogdm9pZCB7XG4gICAgdmFyIG5vbkVtcHR5UmVzdWx0cyA9IGZpbHRlckVtcHR5UmVzdWx0cyh0aGlzLnN0YXRlLnJlc3VsdHNCeVNlcnZpY2UpO1xuICAgIHZhciBzZXJ2aWNlTmFtZSA9IGFycmF5T3BlcmF0aW9uLmNhbGwoT2JqZWN0LmtleXMobm9uRW1wdHlSZXN1bHRzKSk7XG4gICAgaWYgKCFzZXJ2aWNlTmFtZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHZhciBzZXJ2aWNlID0gbm9uRW1wdHlSZXN1bHRzW3NlcnZpY2VOYW1lXTtcbiAgICB2YXIgZGlyZWN0b3J5TmFtZSA9IGFycmF5T3BlcmF0aW9uLmNhbGwoT2JqZWN0LmtleXMoc2VydmljZSkpO1xuICAgIHJldHVybiB7XG4gICAgICBzZXJ2aWNlTmFtZSxcbiAgICAgIGRpcmVjdG9yeU5hbWUsXG4gICAgICByZXN1bHRzOiBub25FbXB0eVJlc3VsdHNbc2VydmljZU5hbWVdW2RpcmVjdG9yeU5hbWVdLml0ZW1zLFxuICAgIH07XG4gIH0sXG5cbiAgZ2V0U2VsZWN0ZWRJdGVtKCkge1xuICAgIHJldHVybiB0aGlzLmdldEl0ZW1BdEluZGV4KFxuICAgICAgdGhpcy5zdGF0ZS5zZWxlY3RlZFNlcnZpY2UsXG4gICAgICB0aGlzLnN0YXRlLnNlbGVjdGVkRGlyZWN0b3J5LFxuICAgICAgdGhpcy5zdGF0ZS5zZWxlY3RlZEl0ZW1JbmRleFxuICAgICk7XG4gIH0sXG5cbiAgZ2V0SXRlbUF0SW5kZXgoc2VydmljZU5hbWUsIGRpcmVjdG9yeSwgaXRlbUluZGV4KSB7XG4gICAgaWYgKFxuICAgICAgaXRlbUluZGV4ID09PSAtMSB8fFxuICAgICAgIXRoaXMuc3RhdGUucmVzdWx0c0J5U2VydmljZVtzZXJ2aWNlTmFtZV0gfHxcbiAgICAgICF0aGlzLnN0YXRlLnJlc3VsdHNCeVNlcnZpY2Vbc2VydmljZU5hbWVdW2RpcmVjdG9yeV0gfHxcbiAgICAgICF0aGlzLnN0YXRlLnJlc3VsdHNCeVNlcnZpY2Vbc2VydmljZU5hbWVdW2RpcmVjdG9yeV0uaXRlbXNbaXRlbUluZGV4XVxuICAgICkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnN0YXRlLnJlc3VsdHNCeVNlcnZpY2Vbc2VydmljZU5hbWVdW2RpcmVjdG9yeV0uaXRlbXNbaXRlbUluZGV4XTtcbiAgfSxcblxuICBjb21wb25lbnRGb3JJdGVtKGl0ZW06IGFueSwgc2VydmljZU5hbWU6IHN0cmluZyk6IFJlYWN0RWxlbWVudCB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UHJvdmlkZXIoKS5nZXRDb21wb25lbnRGb3JJdGVtKGl0ZW0sIHNlcnZpY2VOYW1lKTtcbiAgfSxcblxuICBnZXRTZWxlY3RlZEluZGV4KCk6IGFueSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNlbGVjdGVkRGlyZWN0b3J5OiB0aGlzLnN0YXRlLnNlbGVjdGVkRGlyZWN0b3J5LFxuICAgICAgc2VsZWN0ZWRTZXJ2aWNlOiB0aGlzLnN0YXRlLnNlbGVjdGVkU2VydmljZSxcbiAgICAgIHNlbGVjdGVkSXRlbUluZGV4OiB0aGlzLnN0YXRlLnNlbGVjdGVkSXRlbUluZGV4LFxuICAgIH07XG4gIH0sXG5cbiAgc2V0U2VsZWN0ZWRJbmRleChzZXJ2aWNlOiBzdHJpbmcsIGRpcmVjdG9yeTogc3RyaW5nLCBpdGVtSW5kZXg6IG51bWJlcikge1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgc2VsZWN0ZWRTZXJ2aWNlOiBzZXJ2aWNlLFxuICAgICAgc2VsZWN0ZWREaXJlY3Rvcnk6IGRpcmVjdG9yeSxcbiAgICAgIHNlbGVjdGVkSXRlbUluZGV4OiBpdGVtSW5kZXgsXG4gICAgfSwgKCkgPT4gdGhpcy5fZW1pdHRlci5lbWl0KCdzZWxlY3Rpb24tY2hhbmdlZCcsIHRoaXMuZ2V0U2VsZWN0ZWRJbmRleCgpKSk7XG4gIH0sXG5cbiAgX3NldFJlc3VsdChzZXJ2aWNlTmFtZSwgZGlyTmFtZSwgcmVzdWx0cykge1xuICAgIHZhciB1cGRhdGVkUmVzdWx0c0J5RGlyZWN0b3J5ID0gYXNzaWduKFxuICAgICAge30sXG4gICAgICB0aGlzLnN0YXRlLnJlc3VsdHNCeVNlcnZpY2Vbc2VydmljZU5hbWVdLFxuICAgICAge1xuICAgICAgICBbZGlyTmFtZV06IHJlc3VsdHNcbiAgICAgIH1cbiAgICApO1xuICAgIHZhciB1cGRhdGVkUmVzdWx0c0J5U2VydmljZSA9IGFzc2lnbihcbiAgICAgIHt9LFxuICAgICAgdGhpcy5zdGF0ZS5yZXN1bHRzQnlTZXJ2aWNlLFxuICAgICAge1xuICAgICAgICBbc2VydmljZU5hbWVdOiB1cGRhdGVkUmVzdWx0c0J5RGlyZWN0b3J5LFxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICByZXN1bHRzQnlTZXJ2aWNlOiB1cGRhdGVkUmVzdWx0c0J5U2VydmljZSxcbiAgICB9LCAoKSA9PiB7XG4gICAgICB0aGlzLl9lbWl0dGVyLmVtaXQoJ2l0ZW1zLWNoYW5nZWQnLCB1cGRhdGVkUmVzdWx0c0J5U2VydmljZSk7XG4gICAgfSk7XG4gIH0sXG5cbiAgX3N1YnNjcmliZVRvUmVzdWx0KHNlcnZpY2VOYW1lOiBzdHJpbmcsIGRpcmVjdG9yeTpzdHJpbmcsIHJlc3VsdFByb21pc2U6IFByb21pc2U8YW55Pikge1xuICAgIHJlc3VsdFByb21pc2UudGhlbihpdGVtcyA9PiB7XG4gICAgICB2YXIgdXBkYXRlZEl0ZW1zID0ge1xuICAgICAgICB3YWl0aW5nOiBmYWxzZSxcbiAgICAgICAgZXJyb3I6IG51bGwsXG4gICAgICAgIGl0ZW1zOiBpdGVtcy5yZXN1bHRzLFxuICAgICAgfTtcbiAgICAgIHRoaXMuX3NldFJlc3VsdChzZXJ2aWNlTmFtZSwgZGlyZWN0b3J5LCB1cGRhdGVkSXRlbXMpO1xuICAgIH0pLmNhdGNoKGVycm9yID0+IHtcbiAgICAgIHZhciB1cGRhdGVkSXRlbXMgPSB7XG4gICAgICAgIHdhaXRpbmc6IGZhbHNlLFxuICAgICAgICBlcnJvcjogJ2FuIGVycm9yIG9jY3VycmVkJywgZXJyb3IsXG4gICAgICAgIGl0ZW1zOiBbXSxcbiAgICAgIH07XG4gICAgICB0aGlzLl9zZXRSZXN1bHQoc2VydmljZU5hbWUsIGRpcmVjdG9yeSwgdXBkYXRlZEl0ZW1zKTtcbiAgICB9KTtcbiAgfSxcblxuICBzZXRRdWVyeShxdWVyeTogc3RyaW5nKSB7XG4gICAgdmFyIHByb3ZpZGVyID0gdGhpcy5nZXRQcm92aWRlcigpO1xuICAgIGlmIChwcm92aWRlcikge1xuICAgICAgdmFyIG5ld0l0ZW1zID0gcHJvdmlkZXIuZXhlY3V0ZVF1ZXJ5KHF1ZXJ5KTtcbiAgICAgIG5ld0l0ZW1zLnRoZW4oKHJlcXVlc3RzQnlEaXJlY3RvcnkpID0+IHtcbiAgICAgICAgdmFyIGdyb3VwZWRCeVNlcnZpY2UgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgZGlyTmFtZSBpbiByZXF1ZXN0c0J5RGlyZWN0b3J5KSB7XG4gICAgICAgICAgdmFyIHNlcnZpY2VzRm9yRGlyZWN0b3J5ID0gcmVxdWVzdHNCeURpcmVjdG9yeVtkaXJOYW1lXTtcbiAgICAgICAgICBmb3IgKHZhciBzZXJ2aWNlTmFtZSBpbiBzZXJ2aWNlc0ZvckRpcmVjdG9yeSkge1xuICAgICAgICAgICAgdmFyIHByb21pc2UgPSBzZXJ2aWNlc0ZvckRpcmVjdG9yeVtzZXJ2aWNlTmFtZV07XG4gICAgICAgICAgICB0aGlzLl9zdWJzY3JpYmVUb1Jlc3VsdChzZXJ2aWNlTmFtZSwgZGlyTmFtZSwgcHJvbWlzZSk7XG4gICAgICAgICAgICBpZiAoZ3JvdXBlZEJ5U2VydmljZVtzZXJ2aWNlTmFtZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICBncm91cGVkQnlTZXJ2aWNlW3NlcnZpY2VOYW1lXSA9IHt9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZ3JvdXBlZEJ5U2VydmljZVtzZXJ2aWNlTmFtZV1bZGlyTmFtZV0gPSB7XG4gICAgICAgICAgICAgIGl0ZW1zOiBbXSxcbiAgICAgICAgICAgICAgd2FpdGluZzogdHJ1ZSxcbiAgICAgICAgICAgICAgZXJyb3I6IG51bGwsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNldFN0YXRlKHtyZXN1bHRzQnlTZXJ2aWNlOiBncm91cGVkQnlTZXJ2aWNlfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG5cbiAgZ2V0UHJvdmlkZXIoKTogUXVpY2tTZWxlY3Rpb25Qcm92aWRlciB7XG4gICAgcmV0dXJuIHRoaXMucHJvcHMucHJvdmlkZXI7XG4gIH0sXG5cbiAgZ2V0SW5wdXRUZXh0RWRpdG9yKCk6IEVsZW1lbnQge1xuICAgIHJldHVybiB0aGlzLnJlZnMucXVlcnlJbnB1dC5nZXRET01Ob2RlKCk7XG4gIH0sXG5cbiAgY2xlYXIoKSB7XG4gICAgdGhpcy5nZXRJbnB1dFRleHRFZGl0b3IoKS5tb2RlbC5zZXRUZXh0KCcnKTtcbiAgICB0aGlzLmNsZWFyU2VsZWN0aW9uKCk7XG4gIH0sXG5cbiAgZm9jdXMoKSB7XG4gICAgdGhpcy5nZXRJbnB1dFRleHRFZGl0b3IoKS5mb2N1cygpO1xuICB9LFxuXG4gIHNlbGVjdElucHV0KCkge1xuICAgIHRoaXMucmVmcy5xdWVyeUlucHV0LmdldFRleHRFZGl0b3IoKS5zZWxlY3RBbGwoKTtcbiAgfSxcblxuICBibHVyKCkge1xuICAgIHRoaXMuZ2V0SW5wdXRUZXh0RWRpdG9yKCkuYmx1cigpO1xuICB9LFxuXG4gIF9oYW5kbGVUYWJDaGFuZ2UobmV3VGFiOiBhbnkpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5fc2NoZWR1bGVkQ2FuY2VsKTtcbiAgICB2YXIgcHJvdmlkZXJOYW1lID0gbmV3VGFiLnByb3ZpZGVyTmFtZTtcbiAgICBpZiAocHJvdmlkZXJOYW1lICE9PSB0aGlzLnN0YXRlLmFjdGl2ZVRhYikge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgIGFjdGl2ZVRhYjogcHJvdmlkZXJOYW1lLFxuICAgICAgfSwgKCkgPT4ge1xuICAgICAgICB0aGlzLl9lbWl0dGVyLmVtaXQoJ2FjdGl2ZS1wcm92aWRlci1jaGFuZ2VkJywgbmV3VGFiLnByb3ZpZGVyTmFtZSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG5cbiAgX3JlbmRlclRhYnMoKTogUmVhY3RFbGVtZW50IHtcbiAgICB2YXIgdGFicyA9IFJFTkRFUkFCTEVfVEFCUy5tYXAodGFiID0+IHtcbiAgICAgIHZhciBrZXlCaW5kaW5nID0gbnVsbDtcbiAgICAgIGlmICh0YWIuYWN0aW9uKSB7XG4gICAgICAgIGtleUJpbmRpbmcgPSAoXG4gICAgICAgICAgPGtiZCBjbGFzc05hbWU9XCJrZXktYmluZGluZ1wiPlxuICAgICAgICAgICAge1F1aWNrU2VsZWN0aW9uQ29tcG9uZW50Ll9maW5kS2V5YmluZGluZ0ZvckFjdGlvbih0YWIuYWN0aW9uKX1cbiAgICAgICAgICA8L2tiZD5cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7XG4gICAgICAgIC4uLnRhYixcbiAgICAgICAgbmFtZTogdGFiLnByb3ZpZGVyTmFtZSxcbiAgICAgICAgdGFiQ29udGVudDogPHNwYW4+e3RhYi50aXRsZX17a2V5QmluZGluZ308L3NwYW4+XG4gICAgICB9O1xuICAgIH0pO1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cIm9tbmlzZWFyY2gtdGFic1wiPlxuICAgICAgICA8TnVjbGlkZVRhYnNcbiAgICAgICAgICB0YWJzPXt0YWJzfVxuICAgICAgICAgIGFjdGl2ZVRhYk5hbWU9e3RoaXMuc3RhdGUuYWN0aXZlVGFifVxuICAgICAgICAgIG9uQWN0aXZlVGFiQ2hhbmdlPXt0aGlzLl9oYW5kbGVUYWJDaGFuZ2V9XG4gICAgICAgICAgdHJpZ2dlcmluZ0V2ZW50PVwib25Nb3VzZUVudGVyXCJcbiAgICAgICAgLz5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG5cbiAgX3JlbmRlckVtcHR5TWVzc2FnZShtZXNzYWdlOiBzdHJpbmcpOiBSZWFjdEVsZW1lbnQge1xuICAgIHJldHVybiAoXG4gICAgICA8dWwgY2xhc3NOYW1lPSdiYWNrZ3JvdW5kLW1lc3NhZ2UgY2VudGVyZWQnPlxuICAgICAgICA8bGk+e21lc3NhZ2V9PC9saT5cbiAgICAgIDwvdWw+XG4gICAgKTtcbiAgfSxcblxuICBfaGFzTm9SZXN1bHRzKCk6IGJvb2xlYW4ge1xuICAgIGZvciAodmFyIHNlcnZpY2VOYW1lIGluIHRoaXMuc3RhdGUucmVzdWx0c0J5U2VydmljZSkge1xuICAgICAgdmFyIHNlcnZpY2UgPSB0aGlzLnN0YXRlLnJlc3VsdHNCeVNlcnZpY2Vbc2VydmljZU5hbWVdO1xuICAgICAgZm9yICh2YXIgZGlyTmFtZSBpbiBzZXJ2aWNlKSB7XG4gICAgICAgIHZhciByZXN1bHRzID0gc2VydmljZVtkaXJOYW1lXTtcbiAgICAgICAgaWYgKCFyZXN1bHRzLndhaXRpbmcgJiYgcmVzdWx0cy5pdGVtcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9LFxuXG4gIHJlbmRlcigpOiBSZWFjdEVsZW1lbnQge1xuICAgIHZhciBpdGVtc1JlbmRlcmVkID0gMDtcbiAgICB2YXIgc2VydmljZU5hbWVzID0gT2JqZWN0LmtleXModGhpcy5zdGF0ZS5yZXN1bHRzQnlTZXJ2aWNlKTtcbiAgICB2YXIgc2VydmljZXMgPSBzZXJ2aWNlTmFtZXMubWFwKHNlcnZpY2VOYW1lID0+IHtcbiAgICAgIHZhciBkaXJlY3RvcmllcyA9IHRoaXMuc3RhdGUucmVzdWx0c0J5U2VydmljZVtzZXJ2aWNlTmFtZV07XG4gICAgICB2YXIgZGlyZWN0b3J5TmFtZXMgPSBPYmplY3Qua2V5cyhkaXJlY3Rvcmllcyk7XG4gICAgICB2YXIgZGlyZWN0b3JpZXNGb3JTZXJ2aWNlID0gZGlyZWN0b3J5TmFtZXMubWFwKGRpck5hbWUgPT4ge1xuICAgICAgICB2YXIgcmVzdWx0c0ZvckRpcmVjdG9yeSA9IGRpcmVjdG9yaWVzW2Rpck5hbWVdO1xuICAgICAgICB2YXIgbWVzc2FnZSA9IG51bGw7XG4gICAgICAgIGlmIChyZXN1bHRzRm9yRGlyZWN0b3J5LndhaXRpbmcpIHtcbiAgICAgICAgICBpdGVtc1JlbmRlcmVkKys7XG4gICAgICAgICAgbWVzc2FnZSA9IChcbiAgICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJsb2FkaW5nIGxvYWRpbmctc3Bpbm5lci10aW55IGlubGluZS1ibG9ja1wiIC8+XG4gICAgICAgICAgICAgIExvYWRpbmcuLi5cbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICApO1xuICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdHNGb3JEaXJlY3RvcnkuZXJyb3IpIHtcbiAgICAgICAgICBtZXNzYWdlID0gKFxuICAgICAgICAgICAgPHNwYW4+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImljb24gaWNvbi1jaXJjbGUtc2xhc2hcIiAvPlxuICAgICAgICAgICAgICBFcnJvcjogPHByZT57cmVzdWx0c0ZvckRpcmVjdG9yeS5lcnJvcn08L3ByZT5cbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICApO1xuICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdHNGb3JEaXJlY3RvcnkuaXRlbXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgbWVzc2FnZSA9IChcbiAgICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uIGljb24teFwiIC8+XG4gICAgICAgICAgICAgIE5vIHJlc3VsdHNcbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpdGVtQ29tcG9uZW50cyA9IHJlc3VsdHNGb3JEaXJlY3RvcnkuaXRlbXMubWFwKChpdGVtLCBpdGVtSW5kZXgpID0+IHtcbiAgICAgICAgICAgIHZhciBpc1NlbGVjdGVkID0gKFxuICAgICAgICAgICAgICBzZXJ2aWNlTmFtZSA9PT0gdGhpcy5zdGF0ZS5zZWxlY3RlZFNlcnZpY2UgJiZcbiAgICAgICAgICAgICAgZGlyTmFtZSA9PT0gdGhpcy5zdGF0ZS5zZWxlY3RlZERpcmVjdG9yeSAmJlxuICAgICAgICAgICAgICBpdGVtSW5kZXggPT09IHRoaXMuc3RhdGUuc2VsZWN0ZWRJdGVtSW5kZXhcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBpdGVtc1JlbmRlcmVkKys7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8bGlcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2N4KHtcbiAgICAgICAgICAgICAgICAgICdxdWljay1vcGVuLXJlc3VsdC1pdGVtJzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICdsaXN0LWl0ZW0nOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgc2VsZWN0ZWQ6IGlzU2VsZWN0ZWQsXG4gICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAga2V5PXtzZXJ2aWNlTmFtZSArIGRpck5hbWUgKyBpdGVtSW5kZXh9XG4gICAgICAgICAgICAgICAgb25Nb3VzZURvd249e3RoaXMuc2VsZWN0fVxuICAgICAgICAgICAgICAgIG9uTW91c2VFbnRlcj17dGhpcy5zZXRTZWxlY3RlZEluZGV4LmJpbmQodGhpcywgc2VydmljZU5hbWUsIGRpck5hbWUsIGl0ZW1JbmRleCl9PlxuICAgICAgICAgICAgICAgIHt0aGlzLmNvbXBvbmVudEZvckl0ZW0oaXRlbSwgc2VydmljZU5hbWUpfVxuICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vaGlkZSBmb2xkZXJzIGlmIG9ubHkgMSBsZXZlbCB3b3VsZCBiZSBzaG93blxuICAgICAgICB2YXIgc2hvd0RpcmVjdG9yaWVzID0gZGlyZWN0b3J5TmFtZXMubGVuZ3RoID4gMTtcbiAgICAgICAgdmFyIGRpcmVjdG9yeUxhYmVsID0gc2hvd0RpcmVjdG9yaWVzXG4gICAgICAgICAgPyAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImxpc3QtaXRlbVwiPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uIGljb24tZmlsZS1kaXJlY3RvcnlcIj57ZGlyTmFtZX08L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApXG4gICAgICAgICAgOiBudWxsO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIDxsaSBjbGFzc05hbWU9e2N4KHsnbGlzdC1uZXN0ZWQtaXRlbSc6IHNob3dEaXJlY3Rvcmllc30pfSBrZXk9e2Rpck5hbWV9PlxuICAgICAgICAgICAge2RpcmVjdG9yeUxhYmVsfVxuICAgICAgICAgICAge21lc3NhZ2V9XG4gICAgICAgICAgICA8dWwgY2xhc3NOYW1lPVwibGlzdC10cmVlXCI+XG4gICAgICAgICAgICAgIHtpdGVtQ29tcG9uZW50c31cbiAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgPC9saT5cbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgPGxpIGNsYXNzTmFtZT1cImxpc3QtbmVzdGVkLWl0ZW1cIiBrZXk9e3NlcnZpY2VOYW1lfT5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImxpc3QtaXRlbVwiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiaWNvbiBpY29uLWdlYXJcIj57c2VydmljZU5hbWV9PC9zcGFuPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJsaXN0LXRyZWVcIiByZWY9XCJzZWxlY3Rpb25MaXN0XCI+XG4gICAgICAgICAgICB7ZGlyZWN0b3JpZXNGb3JTZXJ2aWNlfVxuICAgICAgICAgIDwvdWw+XG4gICAgICAgIDwvbGk+XG4gICAgICApO1xuICAgIH0pO1xuICAgIHZhciBub1Jlc3VsdHNNZXNzYWdlID0gbnVsbDtcbiAgICBpZiAob2JqZWN0LmlzRW1wdHkodGhpcy5zdGF0ZS5yZXN1bHRzQnlTZXJ2aWNlKSkge1xuICAgICAgbm9SZXN1bHRzTWVzc2FnZSA9IHRoaXMuX3JlbmRlckVtcHR5TWVzc2FnZSgnU2VhcmNoIGF3YXkhJyk7XG4gICAgfSBlbHNlIGlmIChpdGVtc1JlbmRlcmVkID09PSAwKSB7XG4gICAgICBub1Jlc3VsdHNNZXNzYWdlID0gdGhpcy5fcmVuZGVyRW1wdHlNZXNzYWdlKDxzcGFuPsKvXFxfKOODhClfL8KvPGJyLz5ObyByZXN1bHRzPC9zcGFuPik7XG4gICAgfVxuICAgIHZhciBjdXJyZW50UHJvdmlkZXIgPSB0aGlzLmdldFByb3ZpZGVyKCk7XG4gICAgdmFyIHByb21wdFRleHQgPSAoY3VycmVudFByb3ZpZGVyICYmIGN1cnJlbnRQcm92aWRlci5nZXRQcm9tcHRUZXh0KCkpIHx8ICcnO1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cInNlbGVjdC1saXN0IG9tbmlzZWFyY2gtbW9kYWxcIiByZWY9XCJtb2RhbFwiPlxuICAgICAgICA8QXRvbUlucHV0IHJlZj1cInF1ZXJ5SW5wdXRcIiBwbGFjZWhvbGRlclRleHQ9e3Byb21wdFRleHR9IC8+XG4gICAgICAgIHt0aGlzLl9yZW5kZXJUYWJzKCl9XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib21uaXNlYXJjaC1yZXN1bHRzXCI+XG4gICAgICAgICAge25vUmVzdWx0c01lc3NhZ2V9XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJvbW5pc2VhcmNoLXBhbmVcIj5cbiAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJsaXN0LXRyZWVcIj5cbiAgICAgICAgICAgICAge3NlcnZpY2VzfVxuICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9LFxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gUXVpY2tTZWxlY3Rpb25Db21wb25lbnQ7XG5cbmV4cG9ydCB0eXBlIFF1aWNrU2VsZWN0aW9uQ29tcG9uZW50ID0gUXVpY2tTZWxlY3Rpb25Db21wb25lbnQ7XG4iXX0=