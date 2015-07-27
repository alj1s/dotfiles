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
var SymbolListProvider = require('./SymbolListProvider');
var BigGrepListProvider = require('./BigGrepListProvider');
var FileListProvider = require('./FileListProvider');
var OpenFileListProvider = require('./OpenFileListProvider');

var assign = Object.assign || require('object-assign');

var MAX_RESULTS_PER_SERVICE = 5;
var CUSTOM_RENDERERS = {
  hack: SymbolListProvider,
  biggrep: BigGrepListProvider,
  filelist: FileListProvider,
  openfiles: OpenFileListProvider
};

var OmniSearchResultProvider = (function (_QuickSelectionProvider) {
  function OmniSearchResultProvider() {
    _classCallCheck(this, OmniSearchResultProvider);

    _get(Object.getPrototypeOf(OmniSearchResultProvider.prototype), 'constructor', this).apply(this, arguments);
  }

  _inherits(OmniSearchResultProvider, _QuickSelectionProvider);

  _createClass(OmniSearchResultProvider, [{
    key: 'getPromptText',
    value: function getPromptText() {
      return 'Search for anything...';
    }
  }, {
    key: 'executeQuery',
    value: _asyncToGenerator(function* (query) {
      var _this = this;

      if (query.length === 0) {
        return {
          workspace: {
            openfiles: require('./OpenFileListProvider').getOpenTabsForQuery(query)
          }
        };
      } else {
        var queries = atom.project.getDirectories().map(_asyncToGenerator(function* (directory) {
          return _this._getQueriesForDirectory(query, directory);
        }));

        queries.push(Promise.resolve({
          workspace: {
            openfiles: require('./OpenFileListProvider').getOpenTabsForQuery(query)
          }
        }));

        try {
          var outputs = yield Promise.all(queries);
        } catch (e) {
          this.getLogger().error(e);
        }
        return assign.apply(null, [{}].concat(outputs));
      }
    })
  }, {
    key: '_getQueriesForDirectory',
    value: _asyncToGenerator(function* (query, directory) {
      var _require = require('nuclide-client');

      var getClient = _require.getClient;

      var directoryPath = directory.getPath();
      var basename = directory.getBaseName();
      var client = getClient(directoryPath);

      var url = require('url');

      var _url$parse = url.parse(directoryPath);

      var protocol = _url$parse.protocol;
      var host = _url$parse.host;
      var rootDirectory = _url$parse.path;

      var providers = yield client.getSearchProviders(rootDirectory);

      var searchRequests = {};
      // fileName search
      searchRequests.filelist = client.searchDirectory(directoryPath, query).then(function (files) {
        return {
          results: files.slice(0, MAX_RESULTS_PER_SERVICE)
        };
      });
      var shouldPrependBasePath = !!(protocol && host);
      providers.forEach(function (provider) {
        searchRequests[provider.name] = client.doSearchQuery(rootDirectory, provider.name, query).then(function (results) {
          return assign({}, results, {
            results: results.results.slice(0, MAX_RESULTS_PER_SERVICE).map(function (r) {
              r.path = shouldPrependBasePath ? protocol + '//' + host + r.path : r.path;
              return r;
            })
          });
        });
      });
      var queryMap = {};
      queryMap[basename] = searchRequests;
      return queryMap;
    })
  }, {
    key: 'getComponentForItem',
    value: function getComponentForItem(item, serviceName) {

      var customRenderer = CUSTOM_RENDERERS[serviceName];
      if (customRenderer) {
        return new customRenderer().getComponentForItem(item);
      }
      var filename = pathUtil.basename(item.path);

      return React.createElement(
        'div',
        { className: 'file icon icon-file-text' },
        filename
      );
    }
  }, {
    key: 'getLogger',
    value: function getLogger() {
      if (!logger) {
        logger = require('nuclide-logging').getLogger();
      }
      return logger;
    }
  }]);

  return OmniSearchResultProvider;
})(QuickSelectionProvider);

module.exports = OmniSearchResultProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXF1aWNrLW9wZW4vbGliL09tbmlTZWFyY2hSZXN1bHRQcm92aWRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLFdBQVcsQ0FBQzs7QUFnQlosSUFBSSxNQUFNLENBQUM7QUFDWCxJQUFJLFFBQVEsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDL0IsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDdEMsSUFBSSxzQkFBc0IsR0FBRyxPQUFPLENBQUMsMEJBQTBCLENBQUMsQ0FBQztBQUNqRSxJQUFJLGtCQUFrQixHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0FBQ3pELElBQUksbUJBQW1CLEdBQUcsT0FBTyxDQUFDLHVCQUF1QixDQUFDLENBQUM7QUFDM0QsSUFBSSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQztBQUNyRCxJQUFJLG9CQUFvQixHQUFHLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDOztBQUU3RCxJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxJQUFJLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQzs7QUFFdkQsSUFBSSx1QkFBdUIsR0FBRyxDQUFDLENBQUM7QUFDaEMsSUFBSSxnQkFBZ0IsR0FBRztBQUNyQixNQUFJLEVBQUUsa0JBQWtCO0FBQ3hCLFNBQU8sRUFBRSxtQkFBbUI7QUFDNUIsVUFBUSxFQUFFLGdCQUFnQjtBQUMxQixXQUFTLEVBQUUsb0JBQW9CO0NBQ2hDLENBQUM7O0lBRUksd0JBQXdCO1dBQXhCLHdCQUF3QjswQkFBeEIsd0JBQXdCOzsrQkFBeEIsd0JBQXdCOzs7WUFBeEIsd0JBQXdCOztlQUF4Qix3QkFBd0I7O1dBQ2YseUJBQUc7QUFDZCxhQUFPLHdCQUF3QixDQUFDO0tBQ2pDOzs7NkJBRWlCLFdBQUMs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R0FBRyxDQUFDLENBQUMsSUFBSSxHQUFLLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDMUUscUJBQU8sQ0FBQyxDQUFDO2FBQ1YsQ0FBQztXQUNMLENBQ0Y7U0FBQSxDQUNGLENBQUM7T0FDUCxDQUFDLENBQUM7QUFDSCxVQUFJLFFBQVEsR0FBRyxFQUFFLENBQUM7QUFDbEIsY0FBUSxDQUFDLFFBQVEsQ0FBQyxHQUFHLGNBQWMsQ0FBQztBQUNwQyxhQUFPLFFBQVEsQ0FBQztLQUNqQjs7O1dBRWtCLDZCQUFDLElBQWdCLEVBQUUsV0FBb0IsRUFBZ0I7O0FBRXhFLFVBQUksY0FBYyxHQUFHLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQ25ELFVBQUksY0FBYyxFQUFFO0FBQ2xCLGVBQU8sQUFBQyxJQUFJLGNBQWMsRUFBRSxDQUFFLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDO09BQ3pEO0FBQ0QsVUFBSSxRQUFRLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBRTVDLGFBQ0U7O1VBQUssU0FBUyxFQUFDLDBCQUEwQjtRQUN0QyxRQUFRO09BQ0wsQ0FDTjtLQUNIOzs7V0FFUSxxQkFBRztBQUNWLFVBQUksQ0FBQyxNQUFNLEVBQUU7QUFDWCxjQUFNLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7T0FDakQ7QUFDRCxhQUFPLE1BQU0sQ0FBQztLQUNmOzs7U0FoR0csd0JBQXdCO0dBQVMsc0JBQXNCOztBQW1HN0QsTUFBTSxDQUFDLE9BQU8sR0FBRyx3QkFBd0IsQ0FBQyIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvbnVjbGlkZS1xdWljay1vcGVuL2xpYi9PbW5pU2VhcmNoUmVzdWx0UHJvdmlkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7XG4gIEZpbGVSZXN1bHQsXG4gIEdyb3VwZWRSZXN1bHRQcm9taXNlLFxufSBmcm9tICcuL3R5cGVzJztcblxudmFyIGxvZ2dlcjtcbnZhciBwYXRoVXRpbCA9IHJlcXVpcmUoJ3BhdGgnKTtcbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0LWZvci1hdG9tJyk7XG52YXIgUXVpY2tTZWxlY3Rpb25Qcm92aWRlciA9IHJlcXVpcmUoJy4vUXVpY2tTZWxlY3Rpb25Qcm92aWRlcicpO1xudmFyIFN5bWJvbExpc3RQcm92aWRlciA9IHJlcXVpcmUoJy4vU3ltYm9sTGlzdFByb3ZpZGVyJyk7XG52YXIgQmlnR3JlcExpc3RQcm92aWRlciA9IHJlcXVpcmUoJy4vQmlnR3JlcExpc3RQcm92aWRlcicpO1xudmFyIEZpbGVMaXN0UHJvdmlkZXIgPSByZXF1aXJlKCcuL0ZpbGVMaXN0UHJvdmlkZXInKTtcbnZhciBPcGVuRmlsZUxpc3RQcm92aWRlciA9IHJlcXVpcmUoJy4vT3BlbkZpbGVMaXN0UHJvdmlkZXInKTtcblxudmFyIGFzc2lnbiA9IE9iamVjdC5hc3NpZ24gfHwgcmVxdWlyZSgnb2JqZWN0LWFzc2lnbicpO1xuXG52YXIgTUFYX1JFU1VMVFNfUEVSX1NFUlZJQ0UgPSA1O1xudmFyIENVU1RPTV9SRU5ERVJFUlMgPSB7XG4gIGhhY2s6IFN5bWJvbExpc3RQcm92aWRlcixcbiAgYmlnZ3JlcDogQmlnR3JlcExpc3RQcm92aWRlcixcbiAgZmlsZWxpc3Q6IEZpbGVMaXN0UHJvdmlkZXIsXG4gIG9wZW5maWxlczogT3BlbkZpbGVMaXN0UHJvdmlkZXIsXG59O1xuXG5jbGFzcyBPbW5pU2VhcmNoUmVzdWx0UHJvdmlkZXIgZXh0ZW5kcyBRdWlja1NlbGVjdGlvblByb3ZpZGVyIHtcbiAgZ2V0UHJvbXB0VGV4dCgpIHtcbiAgICByZXR1cm4gJ1NlYXJjaCBmb3IgYW55dGhpbmcuLi4nO1xuICB9XG5cbiAgYXN5bmMgZXhlY3V0ZVF1ZXJ5KHF1ZXJ5OiBzdHJpbmcpOiBHcm91cGVkUmVzdWx0UHJvbWlzZSB7XG4gICAgaWYgKHF1ZXJ5Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgd29ya3NwYWNlOiB7XG4gICAgICAgICAgb3BlbmZpbGVzOiByZXF1aXJlKCcuL09wZW5GaWxlTGlzdFByb3ZpZGVyJykuZ2V0T3BlblRhYnNGb3JRdWVyeShxdWVyeSlcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHF1ZXJpZXMgPSBhdG9tLnByb2plY3QuZ2V0RGlyZWN0b3JpZXMoKS5tYXAoXG4gICAgICAgIGFzeW5jKGRpcmVjdG9yeSkgPT4gdGhpcy5fZ2V0UXVlcmllc0ZvckRpcmVjdG9yeShxdWVyeSwgZGlyZWN0b3J5KVxuICAgICAgKTtcblxuICAgICAgcXVlcmllcy5wdXNoKFByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgIHdvcmtzcGFjZToge1xuICAgICAgICAgIG9wZW5maWxlczogcmVxdWlyZSgnLi9PcGVuRmlsZUxpc3RQcm92aWRlcicpLmdldE9wZW5UYWJzRm9yUXVlcnkocXVlcnkpLFxuICAgICAgICB9LFxuICAgICAgfSkpO1xuXG4gICAgICB0cnkge1xuICAgICAgICB2YXIgb3V0cHV0cyA9IGF3YWl0IFByb21pc2UuYWxsKHF1ZXJpZXMpO1xuICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgIHRoaXMuZ2V0TG9nZ2VyKCkuZXJyb3IoZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gYXNzaWduLmFwcGx5KG51bGwsIFt7fV0uY29uY2F0KG91dHB1dHMpKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBfZ2V0UXVlcmllc0ZvckRpcmVjdG9yeShxdWVyeTogc3RyaW5nLCBkaXJlY3Rvcnk6IGFueSk6IGFueSB7XG4gICAgdmFyIHtnZXRDbGllbnR9ID0gcmVxdWlyZSgnbnVjbGlkZS1jbGllbnQnKTtcbiAgICB2YXIgZGlyZWN0b3J5UGF0aCA9IGRpcmVjdG9yeS5nZXRQYXRoKCk7XG4gICAgdmFyIGJhc2VuYW1lID0gZGlyZWN0b3J5LmdldEJhc2VOYW1lKCk7XG4gICAgdmFyIGNsaWVudCA9IGdldENsaWVudChkaXJlY3RvcnlQYXRoKTtcblxuICAgIHZhciB1cmwgPSByZXF1aXJlKCd1cmwnKTtcbiAgICB2YXIge3Byb3RvY29sLCBob3N0LCBwYXRoOiByb290RGlyZWN0b3J5fSA9IHVybC5wYXJzZShkaXJlY3RvcnlQYXRoKTtcbiAgICB2YXIgcHJvdmlkZXJzID0gYXdhaXQgY2xpZW50LmdldFNlYXJjaFByb3ZpZGVycyhyb290RGlyZWN0b3J5KTtcblxuICAgIHZhciBzZWFyY2hSZXF1ZXN0cyA9IHt9O1xuICAgIC8vIGZpbGVOYW1lIHNlYXJjaFxuICAgIHNlYXJjaFJlcXVlc3RzLmZpbGVsaXN0ID0gY2xpZW50LnNlYXJjaERpcmVjdG9yeShkaXJlY3RvcnlQYXRoLCBxdWVyeSlcbiAgICAgIC50aGVuKGZpbGVzID0+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICByZXN1bHRzOiBmaWxlcy5zbGljZSgwLCBNQVhfUkVTVUxUU19QRVJfU0VSVklDRSlcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgIHZhciBzaG91bGRQcmVwZW5kQmFzZVBhdGggPSAhIShwcm90b2NvbCAmJiBob3N0KTtcbiAgICBwcm92aWRlcnMuZm9yRWFjaChwcm92aWRlciA9PiB7XG4gICAgICBzZWFyY2hSZXF1ZXN0c1twcm92aWRlci5uYW1lXSA9XG4gICAgICAgIGNsaWVudFxuICAgICAgICAgIC5kb1NlYXJjaFF1ZXJ5KHJvb3REaXJlY3RvcnksIHByb3ZpZGVyLm5hbWUsIHF1ZXJ5KVxuICAgICAgICAgIC50aGVuKFxuICAgICAgICAgICAgcmVzdWx0cyA9PiBhc3NpZ24oXG4gICAgICAgICAgICAgIHt9LFxuICAgICAgICAgICAgICByZXN1bHRzLFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmVzdWx0czogcmVzdWx0c1xuICAgICAgICAgICAgICAgICAgLnJlc3VsdHNcbiAgICAgICAgICAgICAgICAgIC5zbGljZSgwLCBNQVhfUkVTVUxUU19QRVJfU0VSVklDRSlcbiAgICAgICAgICAgICAgICAgIC5tYXAociA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHIucGF0aCA9IHNob3VsZFByZXBlbmRCYXNlUGF0aCA/IGAke3Byb3RvY29sfS8vJHtob3N0fSR7ci5wYXRofWAgOiByLnBhdGg7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByO1xuICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKVxuICAgICAgICAgICk7XG4gICAgfSk7XG4gICAgdmFyIHF1ZXJ5TWFwID0ge307XG4gICAgcXVlcnlNYXBbYmFzZW5hbWVdID0gc2VhcmNoUmVxdWVzdHM7XG4gICAgcmV0dXJuIHF1ZXJ5TWFwO1xuICB9XG5cbiAgZ2V0Q29tcG9uZW50Rm9ySXRlbShpdGVtOiBGaWxlUmVzdWx0LCBzZXJ2aWNlTmFtZTogP3N0cmluZyk6IFJlYWN0RWxlbWVudCB7XG5cbiAgICB2YXIgY3VzdG9tUmVuZGVyZXIgPSBDVVNUT01fUkVOREVSRVJTW3NlcnZpY2VOYW1lXTtcbiAgICBpZiAoY3VzdG9tUmVuZGVyZXIpIHtcbiAgICAgIHJldHVybiAobmV3IGN1c3RvbVJlbmRlcmVyKCkpLmdldENvbXBvbmVudEZvckl0ZW0oaXRlbSk7XG4gICAgfVxuICAgIHZhciBmaWxlbmFtZSA9IHBhdGhVdGlsLmJhc2VuYW1lKGl0ZW0ucGF0aCk7XG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJmaWxlIGljb24gaWNvbi1maWxlLXRleHRcIj5cbiAgICAgICAge2ZpbGVuYW1lfVxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfVxuXG4gIGdldExvZ2dlcigpIHtcbiAgICBpZiAoIWxvZ2dlcikge1xuICAgICAgbG9nZ2VyID0gcmVxdWlyZSgnbnVjbGlkZS1sb2dnaW5nJykuZ2V0TG9nZ2VyKCk7XG4gICAgfVxuICAgIHJldHVybiBsb2dnZXI7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBPbW5pU2VhcmNoUmVzdWx0UHJvdmlkZXI7XG4iXX0=