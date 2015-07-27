'use babel';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _require = require('./QuickSelectionProvider');

var QuickSelectionProvider = _require.QuickSelectionProvider;

var _require2 = require('nuclide-atom-helpers');

var fileTypeClass = _require2.fileTypeClass;

var _require3 = require('nuclide-client');

var getClient = _require3.getClient;

var React = require('react-for-atom');
var path = require('path');

var _require4 = require('nuclide-client');

var getClient = _require4.getClient;

var QuickSelectionProvider = require('./QuickSelectionProvider');
var FileResultComponent = require('./FileResultComponent');

var OPENFILE_SEARCH_PROVIDER = 'openfiles';

var OpenFileListProvider = (function (_QuickSelectionProvider) {
  function OpenFileListProvider() {
    _classCallCheck(this, OpenFileListProvider);

    _get(Object.getPrototypeOf(OpenFileListProvider.prototype), 'constructor', this).apply(this, arguments);
  }

  _inherits(OpenFileListProvider, _QuickSelectionProvider);

  _createClass(OpenFileListProvider, [{
    key: 'getDebounceDelay',
    value: function getDebounceDelay() {
      return 0;
    }
  }, {
    key: 'getPromptText',
    value: function getPromptText() {
      return 'Search names of open files';
    }
  }, {
    key: 'executeQuery',
    value: _asyncToGenerator(function* (query) {
      var openTabs = Promise.resolve({
        results: OpenFileListProvider.getOpenTabsMatching(query)
      });
      var result = { workspace: {} };
      result.workspace[OPENFILE_SEARCH_PROVIDER] = Promise.resolve(openTabs);
      return result;
    })
  }, {
    key: 'getComponentForItem',
    value: function getComponentForItem(item) {
      return FileResultComponent.getComponentForItem(item);
    }
  }], [{
    key: 'getOpenTabsMatching',

    // Returns the currently opened tabs, ordered from most recently opened to least recently opened.
    value: function getOpenTabsMatching(query) {
      return atom.workspace.getTextEditors().sort(function (a, b) {
        return b.lastOpened - a.lastOpened;
      }).map(function (editor) {
        return editor.getPath();
      }).filter(function (path) {
        return !query.length || new RegExp(query, 'i').test(path);
      }).map(function (file) {
        return { path: file, matchIndexes: [] };
      });
    }
  }, {
    key: 'getOpenTabsForQuery',
    value: _asyncToGenerator(function* (query) {
      var openTabs = Promise.resolve({
        results: this.getOpenTabsMatching(query)
      });
      return Promise.resolve(openTabs);
    })
  }]);

  return OpenFileListProvider;
})(QuickSelectionProvider);

module.exports = OpenFileListProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXF1aWNrLW9wZW4vbGliL09wZW5GaWxlTGlzdFByb3ZpZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztlQVdtQixPQUFPLENBQUMsMEJBQTBCLENBQUM7O0lBQTdELHNCQUFzQixZQUF0QixzQkFBc0I7O2dCQUNMLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQzs7SUFBaEQsYUFBYSxhQUFiLGFBQWE7O2dCQUNBLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQzs7SUFBdEMsU0FBUyxhQUFULFNBQVM7O0FBQ2QsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDdEMsSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDOztnQkFDVCxPQUFPLENBQUMsZ0JBQWdCLENBQUM7O0lBQXRDLFNBQVMsYUFBVCxTQUFTOztBQUNkLElBQUksc0JBQXNCLEdBQUcsT0FBTyxDQUFDLDBCQUEwQixDQUFDLENBQUM7QUFDakUsSUFBSSxtQkFBbUIsR0FBRyxPQUFPLENBQUMsdUJBQXVCLENBQUMsQ0FBQzs7QUFFM0QsSUFBSSx3QkFBd0IsR0FBRyxXQUFXLENBQUM7O0lBRXJDLG9CQUFvQjtXQUFwQixvQkFBb0I7MEJBQXBCLG9CQUFvQjs7K0JBQXBCLG9CQUFvQjs7O1lBQXBCLG9CQUFvQjs7ZUFBcEIsb0JBQW9COztXQVdSLDRCQUFXO0FBQ3pCLGFBQU8sQ0FBQyxDQUFDO0tBQ1Y7OztXQUVZLHlCQUFHO0FBQ2QsYUFBTyw0QkFBNEIsQ0FBQztLQUNyQzs7OzZCQUVpQixXQUFDLEtBQWEsRUFBK0M7QUFDN0UsVUFBSSxRQUFRLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQztBQUM3QixlQUFPLEVBQUUsb0JBQW9CLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDO09BQ3pELENBQUMsQ0FBQztBQUNILFVBQUksTUFBTSxHQUFHLEVBQUMsU0FBUyxFQUFFLEVBQUUsRUFBQyxDQUFDO0FBQzdCLFlBQU0sQ0FBQyxTQUFTLENBQUMsd0JBQXdCLENBQUMsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3ZFLGFBQU8sTUFBTSxDQUFDO0tBQ2Y7OztXQVNrQiw2QkFBQyxJQUFnQixFQUFnQjtBQUNsRCxhQUFPLG1CQUFtQixDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ3REOzs7OztXQWxDeUIsNkJBQUMsS0FBYSxFQUFpQjtBQUN2RCxhQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxFQUFFLENBQ3BDLElBQUksQ0FBQyxVQUFDLENBQUMsRUFBQyxDQUFDO2VBQUssQ0FBQyxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsVUFBVTtPQUFBLENBQUMsQ0FDMUMsR0FBRyxDQUFDLFVBQUMsTUFBTTtlQUFLLE1BQU0sQ0FBQyxPQUFPLEVBQUU7T0FBQSxDQUFDLENBQ2pDLE1BQU0sQ0FBQyxVQUFBLElBQUk7ZUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksQUFBQyxJQUFJLE1BQU0sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUUsSUFBSSxDQUFDLElBQUksQ0FBQztPQUFBLENBQUMsQ0FDcEUsR0FBRyxDQUFDLFVBQUMsSUFBSTtlQUFNLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsRUFBRSxFQUFDO09BQUMsQ0FBQyxDQUFDO0tBQ25EOzs7NkJBbUIrQixXQUFDLEtBQWEsRUFBK0M7QUFDM0YsVUFBSSxRQUFRLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQztBQUM3QixlQUFPLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQztPQUN6QyxDQUFDLENBQUM7QUFDSCxhQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDbEM7OztTQWpDRyxvQkFBb0I7R0FBUyxzQkFBc0I7O0FBd0N6RCxNQUFNLENBQUMsT0FBTyxHQUFHLG9CQUFvQixDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXF1aWNrLW9wZW4vbGliL09wZW5GaWxlTGlzdFByb3ZpZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxudmFyIHtRdWlja1NlbGVjdGlvblByb3ZpZGVyfSA9IHJlcXVpcmUoJy4vUXVpY2tTZWxlY3Rpb25Qcm92aWRlcicpO1xudmFyIHtmaWxlVHlwZUNsYXNzfSA9IHJlcXVpcmUoJ251Y2xpZGUtYXRvbS1oZWxwZXJzJyk7XG52YXIge2dldENsaWVudH0gPSByZXF1aXJlKCdudWNsaWRlLWNsaWVudCcpO1xudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QtZm9yLWF0b20nKTtcbnZhciBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xudmFyIHtnZXRDbGllbnR9ID0gcmVxdWlyZSgnbnVjbGlkZS1jbGllbnQnKTtcbnZhciBRdWlja1NlbGVjdGlvblByb3ZpZGVyID0gcmVxdWlyZSgnLi9RdWlja1NlbGVjdGlvblByb3ZpZGVyJyk7XG52YXIgRmlsZVJlc3VsdENvbXBvbmVudCA9IHJlcXVpcmUoJy4vRmlsZVJlc3VsdENvbXBvbmVudCcpO1xuXG52YXIgT1BFTkZJTEVfU0VBUkNIX1BST1ZJREVSID0gJ29wZW5maWxlcyc7XG5cbmNsYXNzIE9wZW5GaWxlTGlzdFByb3ZpZGVyIGV4dGVuZHMgUXVpY2tTZWxlY3Rpb25Qcm92aWRlciB7XG5cbiAgLy8gUmV0dXJucyB0aGUgY3VycmVudGx5IG9wZW5lZCB0YWJzLCBvcmRlcmVkIGZyb20gbW9zdCByZWNlbnRseSBvcGVuZWQgdG8gbGVhc3QgcmVjZW50bHkgb3BlbmVkLlxuICBzdGF0aWMgZ2V0T3BlblRhYnNNYXRjaGluZyhxdWVyeTogc3RyaW5nKTogQXJyYXk8c3RyaW5nPiB7XG4gICAgcmV0dXJuIGF0b20ud29ya3NwYWNlLmdldFRleHRFZGl0b3JzKClcbiAgICAgLnNvcnQoKGEsYikgPT4gYi5sYXN0T3BlbmVkIC0gYS5sYXN0T3BlbmVkKVxuICAgICAubWFwKChlZGl0b3IpID0+IGVkaXRvci5nZXRQYXRoKCkpXG4gICAgIC5maWx0ZXIocGF0aCA9PiAhcXVlcnkubGVuZ3RoIHx8IChuZXcgUmVnRXhwKHF1ZXJ5LCAnaScpKS50ZXN0KHBhdGgpKVxuICAgICAubWFwKChmaWxlKSA9PiAoe3BhdGg6IGZpbGUsIG1hdGNoSW5kZXhlczogW119KSk7XG4gIH1cblxuICBnZXREZWJvdW5jZURlbGF5KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICBnZXRQcm9tcHRUZXh0KCkge1xuICAgIHJldHVybiAnU2VhcmNoIG5hbWVzIG9mIG9wZW4gZmlsZXMnO1xuICB9XG5cbiAgYXN5bmMgZXhlY3V0ZVF1ZXJ5KHF1ZXJ5OiBzdHJpbmcpOiB7W2tleTogc3RyaW5nXTogUHJvbWlzZTxBcnJheTxGaWxlUmVzdWx0Pj59IHtcbiAgICB2YXIgb3BlblRhYnMgPSBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgcmVzdWx0czogT3BlbkZpbGVMaXN0UHJvdmlkZXIuZ2V0T3BlblRhYnNNYXRjaGluZyhxdWVyeSlcbiAgICB9KTtcbiAgICB2YXIgcmVzdWx0ID0ge3dvcmtzcGFjZToge319O1xuICAgIHJlc3VsdC53b3Jrc3BhY2VbT1BFTkZJTEVfU0VBUkNIX1BST1ZJREVSXSA9IFByb21pc2UucmVzb2x2ZShvcGVuVGFicyk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHN0YXRpYyBhc3luYyBnZXRPcGVuVGFic0ZvclF1ZXJ5KHF1ZXJ5OiBzdHJpbmcpOiB7W2tleTogc3RyaW5nXTogUHJvbWlzZTxBcnJheTxGaWxlUmVzdWx0Pj59IHtcbiAgICB2YXIgb3BlblRhYnMgPSBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgcmVzdWx0czogdGhpcy5nZXRPcGVuVGFic01hdGNoaW5nKHF1ZXJ5KVxuICAgIH0pO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUob3BlblRhYnMpO1xuICB9XG5cbiAgZ2V0Q29tcG9uZW50Rm9ySXRlbShpdGVtOiBGaWxlUmVzdWx0KTogUmVhY3RFbGVtZW50IHtcbiAgICByZXR1cm4gRmlsZVJlc3VsdENvbXBvbmVudC5nZXRDb21wb25lbnRGb3JJdGVtKGl0ZW0pO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE9wZW5GaWxlTGlzdFByb3ZpZGVyO1xuIl19