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

'use babel';

var logger;
var pathUtil = require('path');
var React = require('react-for-atom');

var QuickSelectionProvider = require('./QuickSelectionProvider');

var assign = Object.assign || require('object-assign');
var cx = require('react-classset');

var HACK_SEARCH_PROVIDER = 'hack';

var ICONS = {
  'interface': 'icon-puzzle',
  'function': 'icon-zap',
  'method': 'icon-zap',
  'typedef': 'icon-tag',
  'class': 'icon-code',
  'abstract class': 'icon-code',
  'constant': 'icon-quote',
  'trait': 'icon-checklist',
  'enum': 'icon-file-binary',
  'default': 'no-icon',
  'unknown': 'icon-squirrel'
};

function bestIconForItem(item) {
  if (!item.additionalInfo) {
    return ICONS['default'];
  }
  // look for exact match
  if (ICONS[item.additionalInfo]) {
    return ICONS[item.additionalInfo];
  };
  // look for presence match, e.g. in 'static method in FooBarClass'
  for (var keyword in ICONS) {
    if (item.additionalInfo.indexOf(keyword) !== -1) {
      return ICONS[keyword];
    }
  }
  return ICONS.unknown;
}

function getLogger() {
  if (!logger) {
    logger = require('nuclide-logging').getLogger();
  }
  return logger;
}

var SymbolListProvider = (function (_QuickSelectionProvider) {
  function SymbolListProvider() {
    _classCallCheck(this, SymbolListProvider);

    _get(Object.getPrototypeOf(SymbolListProvider.prototype), 'constructor', this).apply(this, arguments);
  }

  _inherits(SymbolListProvider, _QuickSelectionProvider);

  _createClass(SymbolListProvider, [{
    key: 'getPromptText',
    value: function getPromptText() {
      return 'Symbol Search: prefix @ = function % = constants # = class';
    }
  }, {
    key: 'executeQuery',
    value: _asyncToGenerator(function* (query) {
      var _require = require('nuclide-client');

      var getClient = _require.getClient;

      if (query.length === 0) {
        return [];
      } else {
        var queries = atom.project.getDirectories().map(_asyncToGenerator(function* (directory) {
          var directoryPath = directory.getPath();
          var basename = directory.getBaseName();

          var client = getClient(directoryPath);

          var url = require('url');

          var _url$parse = url.parse(directoryPath);

          var protocol = _url$parse.protocol;
          var host = _url$parse.host;
          var rootDirectory = _url$parse.path;

          var allProviders = yield client.getSearchProviders(rootDirectory);
          var providers = allProviders.filter(function (p) {
            return p.name === HACK_SEARCH_PROVIDER;
          });
          if (!providers.length) {
            return [];
          }
          var shouldPrependBasePath = !!(protocol && host);
          var searchRequests = {};
          providers.forEach(function (provider) {
            var request = client.doSearchQuery(rootDirectory, provider.name, query);
            if (shouldPrependBasePath) {
              request = request.then(function (response) {
                response.results.forEach(function (r) {
                  r.path = protocol + '//' + host + r.path;
                });
                return response;
              });
            }
            searchRequests[provider.name] = request;
          });
          var queries = {};
          queries[basename] = searchRequests;
          return queries;
        }));

        var outputs = [];
        try {
          outputs = yield Promise.all(queries);
        } catch (e) {
          getLogger().error(e);
        }
        return assign.apply(null, [{}].concat(outputs));
      }
    })
  }, {
    key: 'getComponentForItem',

    // Returns a component with the name of the symbol on top, and the file's name on the bottom.
    // Styling based on https://github.com/atom/fuzzy-finder/blob/master/lib/fuzzy-finder-view.coffee
    value: function getComponentForItem(item) {
      var filePath = item.path;
      var filename = pathUtil.basename(filePath);
      var name = item.name;

      var icon = bestIconForItem(item);
      var symbolClasses = cx('file', 'icon', icon);
      return React.createElement(
        'div',
        { title: item.additionalInfo || '' },
        React.createElement(
          'span',
          { className: symbolClasses },
          React.createElement(
            'code',
            null,
            name
          )
        ),
        React.createElement(
          'span',
          { className: 'omnisearch-symbol-result-filename' },
          filename
        )
      );
    }
  }]);

  return SymbolListProvider;
})(QuickSelectionProvider);

module.exports = SymbolListProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXF1aWNrLW9wZW4vbGliL1N5bWJvbExpc3RQcm92aWRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLFdBQVcsQ0FBQzs7QUFnQlosSUFBSSxNQUFNLENBQUM7QUFDWCxJQUFJLFFBQVEsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDL0IsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7O0FBRXRDLElBQUksc0JBQXNCLEdBQUcsT0FBTyxDQUFDLDBCQUEwQixDQUFDLENBQUM7O0FBRWpFLElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLElBQUksT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDO0FBQ3ZELElBQUksRUFBRSxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDOztBQUVuQyxJQUFJLG9CQUFvQixHQUFHLE1BQU0sQ0FBQzs7QUFFbEMsSUFBSSxLQUFLLEdBQUc7QUFDVixhQUFXLEVBQUUsYUFBYTtBQUMxQixZQUFVLEVBQUUsVUFBVTtBQUN0QixVQUFRLEVBQUUsVUFBVTtBQUNwQixXQUFTLEVBQUUsVUFBVTtBQUNyQixTQUFPLEVBQUUsV0FBVztBQUNwQixrQkFBZ0IsRUFBRSxXQUFXO0FBQzdCLFlBQVUsRUFBRSxZQUFZO0FBQ3hCLFNBQU8sRUFBRSxnQkFBZ0I7QUFDekIsUUFBTSxFQUFFLGtCQUFrQjtBQUMxQixXQUFTLEVBQUUsU0FBUztBQUNwQixXQUFTLEVBQUUsZUFBZTtDQUMzQixDQUFBOztBQUVELFNBQVMsZUFBZSxDQUFDLElBQUksRUFBRTtBQUM3QixNQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRTtBQUN4QixXQUFPLEtBQUssV0FBUSxDQUFDO0dBQ3RCOztBQUVELE1BQUksS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsRUFBRTtBQUM5QixX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ZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXF1aWNrLW9wZW4vbGliL1N5bWJvbExpc3RQcm92aWRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbmltcG9ydCB0eXBlIHtcbiAgRmlsZVJlc3VsdCxcbiAgR3JvdXBlZFJlc3VsdFByb21pc2UsXG59IGZyb20gJy4vdHlwZXMnO1xuXG52YXIgbG9nZ2VyO1xudmFyIHBhdGhVdGlsID0gcmVxdWlyZSgncGF0aCcpO1xudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QtZm9yLWF0b20nKTtcblxudmFyIFF1aWNrU2VsZWN0aW9uUHJvdmlkZXIgPSByZXF1aXJlKCcuL1F1aWNrU2VsZWN0aW9uUHJvdmlkZXInKTtcblxudmFyIGFzc2lnbiA9IE9iamVjdC5hc3NpZ24gfHwgcmVxdWlyZSgnb2JqZWN0LWFzc2lnbicpO1xudmFyIGN4ID0gcmVxdWlyZSgncmVhY3QtY2xhc3NzZXQnKTtcblxudmFyIEhBQ0tfU0VBUkNIX1BST1ZJREVSID0gJ2hhY2snO1xuXG52YXIgSUNPTlMgPSB7XG4gICdpbnRlcmZhY2UnOiAnaWNvbi1wdXp6bGUnLFxuICAnZnVuY3Rpb24nOiAnaWNvbi16YXAnLFxuICAnbWV0aG9kJzogJ2ljb24temFwJyxcbiAgJ3R5cGVkZWYnOiAnaWNvbi10YWcnLFxuICAnY2xhc3MnOiAnaWNvbi1jb2RlJyxcbiAgJ2Fic3RyYWN0IGNsYXNzJzogJ2ljb24tY29kZScsXG4gICdjb25zdGFudCc6ICdpY29uLXF1b3RlJyxcbiAgJ3RyYWl0JzogJ2ljb24tY2hlY2tsaXN0JyxcbiAgJ2VudW0nOiAnaWNvbi1maWxlLWJpbmFyeScsXG4gICdkZWZhdWx0JzogJ25vLWljb24nLFxuICAndW5rbm93bic6ICdpY29uLXNxdWlycmVsJyxcbn1cblxuZnVuY3Rpb24gYmVzdEljb25Gb3JJdGVtKGl0ZW0pIHtcbiAgaWYgKCFpdGVtLmFkZGl0aW9uYWxJbmZvKSB7XG4gICAgcmV0dXJuIElDT05TLmRlZmF1bHQ7XG4gIH1cbiAgLy8gbG9vayBmb3IgZXhhY3QgbWF0Y2hcbiAgaWYgKElDT05TW2l0ZW0uYWRkaXRpb25hbEluZm9dKSB7XG4gICAgcmV0dXJuIElDT05TW2l0ZW0uYWRkaXRpb25hbEluZm9dO1xuICB9O1xuICAvLyBsb29rIGZvciBwcmVzZW5jZSBtYXRjaCwgZS5nLiBpbiAnc3RhdGljIG1ldGhvZCBpbiBGb29CYXJDbGFzcydcbiAgZm9yICh2YXIga2V5d29yZCBpbiBJQ09OUykge1xuICAgIGlmIChpdGVtLmFkZGl0aW9uYWxJbmZvLmluZGV4T2Yoa2V5d29yZCkgIT09IC0xKSB7XG4gICAgICByZXR1cm4gSUNPTlNba2V5d29yZF07XG4gICAgfVxuICB9XG4gIHJldHVybiBJQ09OUy51bmtub3duO1xufVxuXG5mdW5jdGlvbiBnZXRMb2dnZXIoKSB7XG4gIGlmICghbG9nZ2VyKSB7XG4gICAgbG9nZ2VyID0gcmVxdWlyZSgnbnVjbGlkZS1sb2dnaW5nJykuZ2V0TG9nZ2VyKCk7XG4gIH1cbiAgcmV0dXJuIGxvZ2dlcjtcbn1cblxuY2xhc3MgU3ltYm9sTGlzdFByb3ZpZGVyIGV4dGVuZHMgUXVpY2tTZWxlY3Rpb25Qcm92aWRlciB7XG4gIGdldFByb21wdFRleHQoKSB7XG4gICAgcmV0dXJuICdTeW1ib2wgU2VhcmNoOiBwcmVmaXggQCA9IGZ1bmN0aW9uICUgPSBjb25zdGFudHMgIyA9IGNsYXNzJztcbiAgfVxuXG4gIGFzeW5jIGV4ZWN1dGVRdWVyeShxdWVyeTogc3RyaW5nKTogR3JvdXBlZFJlc3VsdFByb21pc2Uge1xuICAgIHZhciB7Z2V0Q2xpZW50fSA9IHJlcXVpcmUoJ251Y2xpZGUtY2xpZW50Jyk7XG4gICAgaWYgKHF1ZXJ5Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgcXVlcmllcyA9IGF0b20ucHJvamVjdC5nZXREaXJlY3RvcmllcygpLm1hcChhc3luYyAoZGlyZWN0b3J5KSA9PiB7XG4gICAgICAgIHZhciBkaXJlY3RvcnlQYXRoID0gZGlyZWN0b3J5LmdldFBhdGgoKTtcbiAgICAgICAgdmFyIGJhc2VuYW1lID0gZGlyZWN0b3J5LmdldEJhc2VOYW1lKCk7XG5cbiAgICAgICAgdmFyIGNsaWVudCA9IGdldENsaWVudChkaXJlY3RvcnlQYXRoKTtcblxuICAgICAgICB2YXIgdXJsID0gcmVxdWlyZSgndXJsJyk7XG4gICAgICAgIHZhciB7cHJvdG9jb2wsIGhvc3QsIHBhdGg6IHJvb3REaXJlY3Rvcnl9ID0gdXJsLnBhcnNlKGRpcmVjdG9yeVBhdGgpO1xuXG4gICAgICAgIHZhciBhbGxQcm92aWRlcnMgPSBhd2FpdCBjbGllbnQuZ2V0U2VhcmNoUHJvdmlkZXJzKHJvb3REaXJlY3RvcnkpO1xuICAgICAgICB2YXIgcHJvdmlkZXJzID0gYWxsUHJvdmlkZXJzLmZpbHRlcihwID0+IHAubmFtZSA9PT0gSEFDS19TRUFSQ0hfUFJPVklERVIpO1xuICAgICAgICBpZiAoIXByb3ZpZGVycy5sZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHNob3VsZFByZXBlbmRCYXNlUGF0aCA9ICEhKHByb3RvY29sICYmIGhvc3QpO1xuICAgICAgICB2YXIgc2VhcmNoUmVxdWVzdHMgPSB7fTtcbiAgICAgICAgcHJvdmlkZXJzLmZvckVhY2gocHJvdmlkZXIgPT4ge1xuICAgICAgICAgIHZhciByZXF1ZXN0ID0gY2xpZW50LmRvU2VhcmNoUXVlcnkocm9vdERpcmVjdG9yeSwgIHByb3ZpZGVyLm5hbWUsIHF1ZXJ5KTtcbiAgICAgICAgICBpZiAoc2hvdWxkUHJlcGVuZEJhc2VQYXRoKSB7XG4gICAgICAgICAgICByZXF1ZXN0ID0gcmVxdWVzdC50aGVuKFxuICAgICAgICAgICAgICByZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzcG9uc2UucmVzdWx0cy5mb3JFYWNoKHIgPT4ge3IucGF0aCA9IGAke3Byb3RvY29sfS8vJHtob3N0fSR7ci5wYXRofWB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHNlYXJjaFJlcXVlc3RzW3Byb3ZpZGVyLm5hbWVdID0gcmVxdWVzdDtcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBxdWVyaWVzID0ge307XG4gICAgICAgIHF1ZXJpZXNbYmFzZW5hbWVdID0gc2VhcmNoUmVxdWVzdHM7XG4gICAgICAgIHJldHVybiBxdWVyaWVzO1xuICAgICAgfSk7XG5cbiAgICAgIHZhciBvdXRwdXRzID0gW107XG4gICAgICB0cnkge1xuICAgICAgICBvdXRwdXRzID0gYXdhaXQgUHJvbWlzZS5hbGwocXVlcmllcyk7XG4gICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgZ2V0TG9nZ2VyKCkuZXJyb3IoZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gYXNzaWduLmFwcGx5KG51bGwsIFt7fV0uY29uY2F0KG91dHB1dHMpKTtcbiAgICB9XG4gIH1cblxuICAvLyBSZXR1cm5zIGEgY29tcG9uZW50IHdpdGggdGhlIG5hbWUgb2YgdGhlIHN5bWJvbCBvbiB0b3AsIGFuZCB0aGUgZmlsZSdzIG5hbWUgb24gdGhlIGJvdHRvbS5cbiAgLy8gU3R5bGluZyBiYXNlZCBvbiBodHRwczovL2dpdGh1Yi5jb20vYXRvbS9mdXp6eS1maW5kZXIvYmxvYi9tYXN0ZXIvbGliL2Z1enp5LWZpbmRlci12aWV3LmNvZmZlZVxuICBnZXRDb21wb25lbnRGb3JJdGVtKGl0ZW06IEZpbGVSZXN1bHQpOiBSZWFjdEVsZW1lbnQge1xuICAgIHZhciBmaWxlUGF0aCA9IGl0ZW0ucGF0aDtcbiAgICB2YXIgZmlsZW5hbWUgPSBwYXRoVXRpbC5iYXNlbmFtZShmaWxlUGF0aCk7XG4gICAgdmFyIG5hbWUgPSBpdGVtLm5hbWU7XG5cbiAgICB2YXIgaWNvbiA9IGJlc3RJY29uRm9ySXRlbShpdGVtKTtcbiAgICB2YXIgc3ltYm9sQ2xhc3NlcyA9IGN4KCdmaWxlJywgJ2ljb24nLCBpY29uKTtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiB0aXRsZT17aXRlbS5hZGRpdGlvbmFsSW5mbyB8fCAnJ30+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT17c3ltYm9sQ2xhc3Nlc30+PGNvZGU+e25hbWV9PC9jb2RlPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwib21uaXNlYXJjaC1zeW1ib2wtcmVzdWx0LWZpbGVuYW1lXCI+e2ZpbGVuYW1lfTwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTeW1ib2xMaXN0UHJvdmlkZXI7XG4iXX0=