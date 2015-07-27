var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _defineProperty(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); }

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

var BIGGREP_SEARCH_PROVIDER = 'biggrep';

function getLogger() {
  if (!logger) {
    logger = require('nuclide-logging').getLogger();
  }
  return logger;
}

var BigGrepListProvider = (function (_QuickSelectionProvider) {
  function BigGrepListProvider() {
    _classCallCheck(this, BigGrepListProvider);

    _get(Object.getPrototypeOf(BigGrepListProvider.prototype), 'constructor', this).apply(this, arguments);
  }

  _inherits(BigGrepListProvider, _QuickSelectionProvider);

  _createClass(BigGrepListProvider, [{
    key: 'getPromptText',
    value: function getPromptText() {
      return 'Big Grep Search';
    }
  }, {
    key: 'executeQuery',
    value: _asyncToGenerator(function* (query) {
      var _require = require('nuclide-client');

      var getClient = _require.getClient;

      if (query.length === 0) {
        return [];
      } else {
        var url = require('url');
        var queries = atom.project.getDirectories().map(_asyncToGenerator(function* (directory) {
          var directoryPath = directory.getPath();
          var basename = directory.getBaseName();
          var client = getClient(directoryPath);

          var _url$parse = url.parse(directoryPath);

          var protocol = _url$parse.protocol;
          var host = _url$parse.host;
          var rootDirectory = _url$parse.path;

          var allProviders = yield client.getSearchProviders(rootDirectory);
          var providers = allProviders.filter(function (p) {
            return p.name === BIGGREP_SEARCH_PROVIDER;
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
            request = request.then(function (response) {
              response.results.forEach(function (r) {
                r.query = query;
              });
              return response;
            });
            searchRequests[provider.name] = request;
          });
          return _defineProperty({}, basename, searchRequests);
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
    value: function getComponentForItem(item) {
      var filePath = item.path;
      var filename = pathUtil.basename(filePath);
      var query = item.query || '';
      var context = item.context;

      return React.createElement(
        'div',
        null,
        React.createElement(
          'span',
          { className: 'file icon icon-file-text' },
          filename
        ),
        React.createElement(
          'span',
          { className: 'omnisearch-biggrep-result-context' },
          context
        )
      );
    }
  }]);

  return BigGrepListProvider;
})(QuickSelectionProvider);

module.exports = BigGrepListProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXF1aWNrLW9wZW4vbGliL0JpZ0dyZXBMaXN0UHJvdmlkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLFdBQVcsQ0FBQzs7QUFnQlosSUFBSSxNQUFNLENBQUM7QUFDWCxJQUFJLFFBQVEsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDL0IsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDdEMsSUFBSSxzQkFBc0IsR0FBRyxPQUFPLENBQUMsMEJBQTBCLENBQUMsQ0FBQzs7QUFFakUsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sSUFBSSxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7O0FBRXZELElBQU0sdUJBQXVCLEdBQUcsU0FBUyxDQUFDOztBQUUxQyxTQUFTLFNBQVMsR0FBRztBQUNuQixNQUFJLENBQUMsTUFBTSxFQUFFO0FBQ1gsVUFBTSxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDO0dBQ2pEO0FBQ0QsU0FBTyxNQUFNLENBQUM7Q0FDZjs7SUFFSyxtQkFBbUI7V0FBbkIsbUJBQW1COzBCQUFuQixtQkFBbUI7OytCQUFuQixtQkFBbUI7OztZQUFuQixtQkFBbUI7O2VBQW5CLG1CQUFtQjs7V0FDVix5QkFBRztBQUNkLGFBQU8saUJBQWlCLENBQUM7S0FDMUI7Ozs2QkFFaUIsV0FBQyxLQUFhLEVBQXdCO3FCQUNwQyxPQUFPLENBQUMsZ0JBQWdCLENBQUM7O1VBQXRDLFNBQVMsWUFBVCxTQUFTOztBQUNkLFVBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7QUFDdEIsZUFBTyxFQUFFLENBQUM7T0FDWCxNQUFNO0FBQ0wsWUFBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3pCLFlBQUksT0FB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QyxPQUFPLENBQUM7O0FBRTNCLGFBQ0U7OztRQUNFOztZQUFNLFNBQVMsRUFBQywwQkFBMEI7VUFBRSxRQUFRO1NBQVE7UUFDNUQ7O1lBQU0sU0FBUyxFQUFDLG1DQUFtQztVQUFFLE9BQU87U0FBUTtPQUNoRSxDQUNOO0tBQ0g7OztTQXJFRyxtQkFBbUI7R0FBUyxzQkFBc0I7O0FBd0V4RCxNQUFNLENBQUMsT0FBTyxHQUFHLG1CQUFtQixDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXF1aWNrLW9wZW4vbGliL0JpZ0dyZXBMaXN0UHJvdmlkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7XG4gIEZpbGVSZXN1bHQsXG4gIEdyb3VwZWRSZXN1bHRQcm9taXNlLFxufSBmcm9tICcuL3R5cGVzJztcblxudmFyIGxvZ2dlcjtcbnZhciBwYXRoVXRpbCA9IHJlcXVpcmUoJ3BhdGgnKTtcbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0LWZvci1hdG9tJyk7XG52YXIgUXVpY2tTZWxlY3Rpb25Qcm92aWRlciA9IHJlcXVpcmUoJy4vUXVpY2tTZWxlY3Rpb25Qcm92aWRlcicpO1xuXG52YXIgYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCByZXF1aXJlKCdvYmplY3QtYXNzaWduJyk7XG5cbmNvbnN0IEJJR0dSRVBfU0VBUkNIX1BST1ZJREVSID0gJ2JpZ2dyZXAnO1xuXG5mdW5jdGlvbiBnZXRMb2dnZXIoKSB7XG4gIGlmICghbG9nZ2VyKSB7XG4gICAgbG9nZ2VyID0gcmVxdWlyZSgnbnVjbGlkZS1sb2dnaW5nJykuZ2V0TG9nZ2VyKCk7XG4gIH1cbiAgcmV0dXJuIGxvZ2dlcjtcbn1cblxuY2xhc3MgQmlnR3JlcExpc3RQcm92aWRlciBleHRlbmRzIFF1aWNrU2VsZWN0aW9uUHJvdmlkZXIge1xuICBnZXRQcm9tcHRUZXh0KCkge1xuICAgIHJldHVybiAnQmlnIEdyZXAgU2VhcmNoJztcbiAgfVxuXG4gIGFzeW5jIGV4ZWN1dGVRdWVyeShxdWVyeTogc3RyaW5nKTogR3JvdXBlZFJlc3VsdFByb21pc2Uge1xuICAgIHZhciB7Z2V0Q2xpZW50fSA9IHJlcXVpcmUoJ251Y2xpZGUtY2xpZW50Jyk7XG4gICAgaWYgKHF1ZXJ5Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgdXJsID0gcmVxdWlyZSgndXJsJyk7XG4gICAgICB2YXIgcXVlcmllcyA9IGF0b20ucHJvamVjdC5nZXREaXJlY3RvcmllcygpLm1hcChhc3luYyAoZGlyZWN0b3J5KSA9PiB7XG4gICAgICAgIHZhciBkaXJlY3RvcnlQYXRoID0gZGlyZWN0b3J5LmdldFBhdGgoKTtcbiAgICAgICAgdmFyIGJhc2VuYW1lID0gZGlyZWN0b3J5LmdldEJhc2VOYW1lKCk7XG4gICAgICAgIHZhciBjbGllbnQgPSBnZXRDbGllbnQoZGlyZWN0b3J5UGF0aCk7XG5cbiAgICAgICAgdmFyIHtwcm90b2NvbCwgaG9zdCwgcGF0aDogcm9vdERpcmVjdG9yeX0gPSB1cmwucGFyc2UoZGlyZWN0b3J5UGF0aCk7XG4gICAgICAgIHZhciBhbGxQcm92aWRlcnMgPSBhd2FpdCBjbGllbnQuZ2V0U2VhcmNoUHJvdmlkZXJzKHJvb3REaXJlY3RvcnkpO1xuICAgICAgICB2YXIgcHJvdmlkZXJzID0gYWxsUHJvdmlkZXJzLmZpbHRlcihwID0+IHAubmFtZSA9PT0gQklHR1JFUF9TRUFSQ0hfUFJPVklERVIpO1xuICAgICAgICBpZiAoIXByb3ZpZGVycy5sZW5ndGgpIHtcbiAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc2hvdWxkUHJlcGVuZEJhc2VQYXRoID0gISEocHJvdG9jb2wgJiYgaG9zdCk7XG4gICAgICAgIHZhciBzZWFyY2hSZXF1ZXN0cyA9IHt9O1xuICAgICAgICBwcm92aWRlcnMuZm9yRWFjaChwcm92aWRlciA9PiB7XG4gICAgICAgICAgdmFyIHJlcXVlc3QgPSBjbGllbnQuZG9TZWFyY2hRdWVyeShyb290RGlyZWN0b3J5LCAgcHJvdmlkZXIubmFtZSwgcXVlcnkpO1xuICAgICAgICAgIGlmIChzaG91bGRQcmVwZW5kQmFzZVBhdGgpIHtcbiAgICAgICAgICAgIHJlcXVlc3QgPSByZXF1ZXN0LnRoZW4oXG4gICAgICAgICAgICAgIHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICByZXNwb25zZS5yZXN1bHRzLmZvckVhY2gociA9PiB7ci5wYXRoID0gYCR7cHJvdG9jb2x9Ly8ke2hvc3R9JHtyLnBhdGh9YDt9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlcXVlc3QgPSByZXF1ZXN0LnRoZW4oXG4gICAgICAgICAgICByZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgIHJlc3BvbnNlLnJlc3VsdHMuZm9yRWFjaChyID0+IHtyLnF1ZXJ5ID0gcXVlcnk7fSk7XG4gICAgICAgICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICApO1xuICAgICAgICAgIHNlYXJjaFJlcXVlc3RzW3Byb3ZpZGVyLm5hbWVdID0gcmVxdWVzdDtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB7W2Jhc2VuYW1lXTogc2VhcmNoUmVxdWVzdHN9O1xuICAgICAgfSk7XG5cbiAgICAgIHZhciBvdXRwdXRzID0gW107XG4gICAgICB0cnkge1xuICAgICAgICBvdXRwdXRzID0gYXdhaXQgUHJvbWlzZS5hbGwocXVlcmllcyk7XG4gICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgZ2V0TG9nZ2VyKCkuZXJyb3IoZSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhc3NpZ24uYXBwbHkobnVsbCwgW3t9XS5jb25jYXQob3V0cHV0cykpO1xuICAgIH1cbiAgfVxuXG4gIGdldENvbXBvbmVudEZvckl0ZW0oaXRlbTogRmlsZVJlc3VsdCk6IFJlYWN0RWxlbWVudCB7XG4gICAgdmFyIGZpbGVQYXRoID0gaXRlbS5wYXRoO1xuICAgIHZhciBmaWxlbmFtZSA9IHBhdGhVdGlsLmJhc2VuYW1lKGZpbGVQYXRoKTtcbiAgICB2YXIgcXVlcnkgPSBpdGVtLnF1ZXJ5IHx8ICcnO1xuICAgIHZhciBjb250ZXh0ID0gaXRlbS5jb250ZXh0O1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZpbGUgaWNvbiBpY29uLWZpbGUtdGV4dFwiPntmaWxlbmFtZX08L3NwYW4+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm9tbmlzZWFyY2gtYmlnZ3JlcC1yZXN1bHQtY29udGV4dFwiPntjb250ZXh0fTwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBCaWdHcmVwTGlzdFByb3ZpZGVyO1xuIl19