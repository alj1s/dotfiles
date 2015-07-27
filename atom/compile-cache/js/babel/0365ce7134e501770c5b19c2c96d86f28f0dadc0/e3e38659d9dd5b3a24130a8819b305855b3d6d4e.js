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
var _require = require('nuclide-commons');

var asyncExecute = _require.asyncExecute;
var safeSpawn = _require.safeSpawn;
var findNearestFile = _require.findNearestFile;
var getConfigValueAsync = _require.getConfigValueAsync;

var logger = require('nuclide-logging').getLogger();
var FlowService = require('./FlowService');

var _require2 = require('./FlowHelpers.js');

var getPathToFlow = _require2.getPathToFlow;
var getFlowExecOptions = _require2.getFlowExecOptions;
var insertAutocompleteToken = _require2.insertAutocompleteToken;

var LocalFlowService = (function (_FlowService) {
  function LocalFlowService() {
    _classCallCheck(this, LocalFlowService);

    _get(Object.getPrototypeOf(LocalFlowService.prototype), 'constructor', this).call(this);
    this._startedServers = new Set();
  }

  _inherits(LocalFlowService, _FlowService);

  _createClass(LocalFlowService, [{
    key: 'dispose',
    value: _asyncToGenerator(function* () {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this._startedServers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var server = _step.value;

          // The default, SIGTERM, does not reliably kill the flow servers.
          server.kill('SIGKILL');
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
    })
  }, {
    key: '_execFlow',
    value: _asyncToGenerator(function* (args, options) {
      var maxTries = 5;
      args.push('--no-auto-start');
      var pathToFlow = yield getPathToFlow();
      for (var i = 0;; i++) {
        try {
          var result = yield asyncExecute(pathToFlow, args, options);
          return result;
        } catch (e) {
          if (i >= maxTries) {
            throw e;
          }
          if (e.stderr.match('There is no flow server running')) {
            // the flow root (where .flowconfig exists) conveniently appears in
            // the error message enclosed in single quotes.
            var root = e.stderr.match(/'[^']*'/)[0].replace(/'/g, '');
            // `flow server` will start a server in the foreground. asyncExecute
            // will not resolve the promise until the process exits, which in this
            // case is never. We need to use spawn directly to get access to the
            // ChildProcess object.
            var serverProcess = safeSpawn(pathToFlow, ['server', root]);
            var logIt = function logIt(data) {
              logger.debug('flow server: ' + data);
            };
            serverProcess.stdout.on('data', logIt);
            serverProcess.stderr.on('data', logIt);
            this._startedServers.add(serverProcess);
          } else {
            // not sure what happened, but we'll let the caller deal with it
            throw e;
          }
          // try again
        }
      }
      // otherwise flow complains
      return {};
    })
  }, {
    key: 'findDefinition',
    value: _asyncToGenerator(function* (file, currentContents, line, column) {
      var options = yield getFlowExecOptions(file);
      if (!options) {
        return null;
      }

      // We pass the current contents of the buffer to Flow via stdin.
      // This makes it possible for get-def to operate on the unsaved content in
      // the user's editor rather than what is saved on disk. It would be annoying
      // if the user had to save before using the jump-to-definition feature to
      // ensure he or she got accurate results.
      options.stdin = currentContents;

      var args = ['get-def', '--json', '--path', file, line, column];
      try {
        var result = yield this._execFlow(args, options);
        if (result.exitCode === 0) {
          var json = JSON.parse(result.stdout);
          if (json['path']) {
            // t7492048
            return {
              file: json['path'],
              line: json['line'] - 1,
              column: json['start'] - 1
            };
          } else {
            return null;
          }
        } else {
          logger.error(result.stderr);
          return null;
        }
      } catch (e) {
        logger.error(e.stderr);
        return null;
      }
    })
  }, {
    key: 'findDiagnostics',
    value: _asyncToGenerator(function* (file) {
      var options = yield getFlowExecOptions(file);
      if (!options) {
        return [];
      }

      // Currently, `flow status` does not take the path of a file to check.
      // It would be nice if it would take the path and use it for filtering,
      // as currently the client has to do the filtering.
      //
      // TODO(mbolin): Have `flow status` have the option to read a file from
      // stdin and have its path specified by --path as `flow get-def` does.
      // Then Flow could use the current contents of editor instead of what was
      // most recently saved.
      var args = ['status', '--json'];

      var result;
      try {
        result = yield this._execFlow(args, options);
      } catch (e) {
        // This codepath will be exercised when Flow finds type errors as the
        // exit code will be non-zero. Note this codepath could also be exercised
        // due to a logical error in Nuclide, so we try to differentiate.
        if (e.exitCode !== undefined) {
          result = e;
        } else {
          logger.error(e);
          return [];
        }
      }

      var json;
      try {
        json = JSON.parse(result.stdout);
      } catch (e) {
        logger.error(e);
        return [];
      }

      return json['errors'];
    })
  }, {
    key: 'getAutocompleteSuggestions',
    value: _asyncToGenerator(function* (file, currentContents, line, column, prefix) {
      var options = yield getFlowExecOptions(file);
      if (!options) {
        return [];
      }

      var args = ['autocomplete', '--json', file];

      options.stdin = insertAutocompleteToken(currentContents, line, column);
      try {
        var result = yield this._execFlow(args, options);
        if (result.exitCode === 0) {
          var json = JSON.parse(result.stdout);
          var replacementPrefix = /^\s*$/.test(prefix) ? '' : prefix;
          return json.map(function (item) {
            return {
              text: item['name'],
              rightLabel: item['type'],
              replacementPrefix: replacementPrefix
            };
          });
        } else {
          return [];
        }
      } catch (_) {
        return [];
      }
    })
  }, {
    key: 'getType',
    value: _asyncToGenerator(function* (file, currentContents, line, column) {
      var options = yield getFlowExecOptions(file);
      if (!options) {
        return null;
      }

      options.stdin = currentContents;

      line = line + 1;
      column = column + 1;
      var args = ['type-at-pos', line, column];

      var output;
      try {
        var result = yield this._execFlow(args, options);
        output = result.stdout;
      } catch (e) {
        logger.error('flow type-at-pos failed: ' + file + ':' + line + ':' + column, e);
        return null;
      }
      // instead of returning a nonzero exit code, or saying that the type is
      // "(unknown)", Flow sometimes just prints a message that includes the
      // string "Failure" at the beginning of the second line.
      if (output.match(/\nFailure/)) {
        return null;
      }
      // the type appears by itself on the first line.
      var type = output.split('\n')[0];
      if (type === '(unknown)' || type === '') {
        return null;
      }
      return type;
    })
  }]);

  return LocalFlowService;
})(FlowService);

module.exports = LocalFlowService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZsb3cvbm9kZV9tb2R1bGVzL251Y2xpZGUtZmxvdy1iYXNlL2xpYi9Mb2NhbEZsb3dTZXJ2aWNlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsV0FBVyxDQUFDO2VBb0IwRCxPQUFPLENBQUMsaUJBQWlCLENBQUM7O0lBQTNGLFlBQVksWUFBWixZQUFZO0lBQUUsU0FBUyxZQUFULFNBQVM7SUFBRSxlQUFlLFlBQWYsZUFBZTtJQUFFLG1CQUFtQixZQUFuQixtQkFBbUI7O0FBQ2xFLElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQ3BELElBQUksV0FBVyxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQzs7Z0JBQ3dCLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQzs7SUFBekYsYUFBYSxhQUFiLGFBQWE7SUFBRSxrQkFBa0IsYUFBbEIsa0JBQWtCO0lBQUUsdUJBQXVCLGFBQXZCLHVCQUF1Qjs7SUFFekQsZ0JBQWdCO0FBR1QsV0FIUCxnQkFBZ0IsR0FHTjswQkFIVixnQkFBZ0I7O0FBSWxCLCtCQUpFLGdCQUFnQiw2Q0FJVjtBQUNSLFFBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztHQUNsQzs7WUFORyxnQkFBZ0I7O2VBQWhCLGdCQUFnQjs7NkJBUVAsYUFBa0I7Ozs7OztBQUM3Qiw2QkFBbUIsSUFBSSxDQUFDLGVBQWUsOEhBQUU7Y0FBaEMsTUFBTTs7O0FBRWIsZ0JBQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDeEI7Ozs7Ozs7Ozs7Ozs7OztLQUNGOzs7NkJBRWMsV0FBQyxJQUFnQixFQUFFLE9BQWUsRUFBbUI7QUFDbEUsVUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDO0FBQ2pCLFVBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENB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QU0sR0FBRyxDQUFDLENBQUM7QUFDcEIsVUFBSSxJQUFJLEdBQUcsQ0FBQyxhQUFhLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDOztBQUV6QyxVQUFJLE1BQU0sQ0FBQztBQUNYLFVBQUk7QUFDRixZQUFJLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ2pELGNBQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO09BQ3hCLENBQUMsT0FBTyxDQUFDLEVBQUU7QUFDVixjQUFNLENBQUMsS0FBSyxDQUFDLDJCQUEyQixHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDaEYsZUFBTyxJQUFJLENBQUM7T0FDYjs7OztBQUlELFVBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsRUFBRTtBQUM3QixlQUFPLElBQUksQ0FBQztPQUNiOztBQUVELFVBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakMsVUFBSSxJQUFJLEtBQUssV0FBVyxJQUFJLElBQUksS0FBSyxFQUFFLEVBQUU7QUFDdkMsZUFBTyxJQUFJLENBQUM7T0FDYjtBQUNELGFBQU8sSUFBSSxDQUFDO0tBQ2I7OztTQWxORyxnQkFBZ0I7R0FBUyxXQUFXOztBQXFOMUMsTUFBTSxDQUFDLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQyIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvbnVjbGlkZS1mbG93L25vZGVfbW9kdWxlcy9udWNsaWRlLWZsb3ctYmFzZS9saWIvTG9jYWxGbG93U2VydmljZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbmltcG9ydCB0eXBlIHtEaWFnbm9zdGljfSBmcm9tICcuL0Zsb3dTZXJ2aWNlJztcbmltcG9ydCB0eXBlIHtOdWNsaWRlVXJpfSBmcm9tICdudWNsaWRlLXJlbW90ZS11cmknO1xuXG50eXBlIExvYyA9IHtcbiAgZmlsZTogTnVjbGlkZVVyaTtcbiAgbGluZTogbnVtYmVyO1xuICBjb2x1bW46IG51bWJlcjtcbn1cblxudmFyIHthc3luY0V4ZWN1dGUsIHNhZmVTcGF3biwgZmluZE5lYXJlc3RGaWxlLCBnZXRDb25maWdWYWx1ZUFzeW5jfSA9IHJlcXVpcmUoJ251Y2xpZGUtY29tbW9ucycpO1xudmFyIGxvZ2dlciA9IHJlcXVpcmUoJ251Y2xpZGUtbG9nZ2luZycpLmdldExvZ2dlcigpO1xudmFyIEZsb3dTZXJ2aWNlID0gcmVxdWlyZSgnLi9GbG93U2VydmljZScpO1xudmFyIHtnZXRQYXRoVG9GbG93LCBnZXRGbG93RXhlY09wdGlvbnMsIGluc2VydEF1dG9jb21wbGV0ZVRva2VufSA9IHJlcXVpcmUoJy4vRmxvd0hlbHBlcnMuanMnKTtcblxuY2xhc3MgTG9jYWxGbG93U2VydmljZSBleHRlbmRzIEZsb3dTZXJ2aWNlIHtcbiAgX3N0YXJ0ZWRTZXJ2ZXJzOiBTZXQ8Q2hpbGRQcm9jZXNzPjtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX3N0YXJ0ZWRTZXJ2ZXJzID0gbmV3IFNldCgpO1xuICB9XG5cbiAgYXN5bmMgZGlzcG9zZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBmb3IgKHZhciBzZXJ2ZXIgb2YgdGhpcy5fc3RhcnRlZFNlcnZlcnMpIHtcbiAgICAgIC8vIFRoZSBkZWZhdWx0LCBTSUdURVJNLCBkb2VzIG5vdCByZWxpYWJseSBraWxsIHRoZSBmbG93IHNlcnZlcnMuXG4gICAgICBzZXJ2ZXIua2lsbCgnU0lHS0lMTCcpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIF9leGVjRmxvdyhhcmdzOiBBcnJheTxhbnk+LCBvcHRpb25zOiBPYmplY3QpOiBQcm9taXNlPE9iamVjdD4ge1xuICAgIHZhciBtYXhUcmllcyA9IDU7XG4gICAgYXJncy5wdXNoKFwiLS1uby1hdXRvLXN0YXJ0XCIpO1xuICAgIHZhciBwYXRoVG9GbG93ID0gYXdhaXQgZ2V0UGF0aFRvRmxvdygpO1xuICAgIGZvciAodmFyIGkgPSAwOyA7IGkrKykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IGF3YWl0IGFzeW5jRXhlY3V0ZShwYXRoVG9GbG93LCBhcmdzLCBvcHRpb25zKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgaWYgKGkgPj0gbWF4VHJpZXMpIHtcbiAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChlLnN0ZGVyci5tYXRjaChcIlRoZXJlIGlzIG5vIGZsb3cgc2VydmVyIHJ1bm5pbmdcIikpIHtcbiAgICAgICAgICAvLyB0aGUgZmxvdyByb290ICh3aGVyZSAuZmxvd2NvbmZpZyBleGlzdHMpIGNvbnZlbmllbnRseSBhcHBlYXJzIGluXG4gICAgICAgICAgLy8gdGhlIGVycm9yIG1lc3NhZ2UgZW5jbG9zZWQgaW4gc2luZ2xlIHF1b3Rlcy5cbiAgICAgICAgICB2YXIgcm9vdCA9IGUuc3RkZXJyLm1hdGNoKC8nW14nXSonLylbMF0ucmVwbGFjZSgvJy9nLCAnJyk7XG4gICAgICAgICAgLy8gYGZsb3cgc2VydmVyYCB3aWxsIHN0YXJ0IGEgc2VydmVyIGluIHRoZSBmb3JlZ3JvdW5kLiBhc3luY0V4ZWN1dGVcbiAgICAgICAgICAvLyB3aWxsIG5vdCByZXNvbHZlIHRoZSBwcm9taXNlIHVudGlsIHRoZSBwcm9jZXNzIGV4aXRzLCB3aGljaCBpbiB0aGlzXG4gICAgICAgICAgLy8gY2FzZSBpcyBuZXZlci4gV2UgbmVlZCB0byB1c2Ugc3Bhd24gZGlyZWN0bHkgdG8gZ2V0IGFjY2VzcyB0byB0aGVcbiAgICAgICAgICAvLyBDaGlsZFByb2Nlc3Mgb2JqZWN0LlxuICAgICAgICAgIHZhciBzZXJ2ZXJQcm9jZXNzID0gc2FmZVNwYXduKHBhdGhUb0Zsb3csIFsnc2VydmVyJywgcm9vdF0pO1xuICAgICAgICAgIHZhciBsb2dJdCA9IGRhdGEgPT4ge1xuICAgICAgICAgICAgbG9nZ2VyLmRlYnVnKCdmbG93IHNlcnZlcjogJyArIGRhdGEpO1xuICAgICAgICAgIH07XG4gICAgICAgICAgc2VydmVyUHJvY2Vzcy5zdGRvdXQub24oJ2RhdGEnLCBsb2dJdCk7XG4gICAgICAgICAgc2VydmVyUHJvY2Vzcy5zdGRlcnIub24oJ2RhdGEnLCBsb2dJdCk7XG4gICAgICAgICAgdGhpcy5fc3RhcnRlZFNlcnZlcnMuYWRkKHNlcnZlclByb2Nlc3MpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIG5vdCBzdXJlIHdoYXQgaGFwcGVuZWQsIGJ1dCB3ZSdsbCBsZXQgdGhlIGNhbGxlciBkZWFsIHdpdGggaXRcbiAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9XG4gICAgICAgIC8vIHRyeSBhZ2FpblxuICAgICAgfVxuICAgIH1cbiAgICAvLyBvdGhlcndpc2UgZmxvdyBjb21wbGFpbnNcbiAgICByZXR1cm4ge307XG4gIH1cblxuICBhc3luYyBmaW5kRGVmaW5pdGlvbihcbiAgICBmaWxlOiBOdWNsaWRlVXJpLFxuICAgIGN1cnJlbnRDb250ZW50czogc3RyaW5nLFxuICAgIGxpbmU6IG51bWJlcixcbiAgICBjb2x1bW46IG51bWJlclxuICApOiBQcm9taXNlPD9Mb2M+IHtcbiAgICB2YXIgb3B0aW9ucyA9IGF3YWl0IGdldEZsb3dFeGVjT3B0aW9ucyhmaWxlKTtcbiAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8vIFdlIHBhc3MgdGhlIGN1cnJlbnQgY29udGVudHMgb2YgdGhlIGJ1ZmZlciB0byBGbG93IHZpYSBzdGRpbi5cbiAgICAvLyBUaGlzIG1ha2VzIGl0IHBvc3NpYmxlIGZvciBnZXQtZGVmIHRvIG9wZXJhdGUgb24gdGhlIHVuc2F2ZWQgY29udGVudCBpblxuICAgIC8vIHRoZSB1c2VyJ3MgZWRpdG9yIHJhdGhlciB0aGFuIHdoYXQgaXMgc2F2ZWQgb24gZGlzay4gSXQgd291bGQgYmUgYW5ub3lpbmdcbiAgICAvLyBpZiB0aGUgdXNlciBoYWQgdG8gc2F2ZSBiZWZvcmUgdXNpbmcgdGhlIGp1bXAtdG8tZGVmaW5pdGlvbiBmZWF0dXJlIHRvXG4gICAgLy8gZW5zdXJlIGhlIG9yIHNoZSBnb3QgYWNjdXJhdGUgcmVzdWx0cy5cbiAgICBvcHRpb25zLnN0ZGluID0gY3VycmVudENvbnRlbnRzO1xuXG4gICAgdmFyIGFyZ3MgPSBbJ2dldC1kZWYnLCAnLS1qc29uJywgJy0tcGF0aCcsIGZpbGUsIGxpbmUsIGNvbHVtbl07XG4gICAgdHJ5IHtcbiAgICAgIHZhciByZXN1bHQgPSBhd2FpdCB0aGlzLl9leGVjRmxvdyhhcmdzLCBvcHRpb25zKTtcbiAgICAgIGlmIChyZXN1bHQuZXhpdENvZGUgPT09IDApIHtcbiAgICAgICAgdmFyIGpzb24gPSBKU09OLnBhcnNlKHJlc3VsdC5zdGRvdXQpO1xuICAgICAgICBpZiAoanNvblsncGF0aCddKSB7XG4gICAgICAgICAgLy8gdDc0OTIwNDhcbiAgICAgICAgICByZXR1cm4gKHtcbiAgICAgICAgICAgIGZpbGU6IGpzb25bJ3BhdGgnXSxcbiAgICAgICAgICAgIGxpbmU6IGpzb25bJ2xpbmUnXSAtIDEsXG4gICAgICAgICAgICBjb2x1bW46IGpzb25bJ3N0YXJ0J10gLSAxLFxuICAgICAgICAgIH0gOiA/TG9jKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbG9nZ2VyLmVycm9yKHJlc3VsdC5zdGRlcnIpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgIGxvZ2dlci5lcnJvcihlLnN0ZGVycik7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICBhc3luYyBmaW5kRGlhZ25vc3RpY3MoZmlsZTogTnVjbGlkZVVyaSk6IFByb21pc2U8QXJyYXk8RGlhZ25vc3RpYz4+IHtcbiAgICB2YXIgb3B0aW9ucyA9IGF3YWl0IGdldEZsb3dFeGVjT3B0aW9ucyhmaWxlKTtcbiAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICAvLyBDdXJyZW50bHksIGBmbG93IHN0YXR1c2AgZG9lcyBub3QgdGFrZSB0aGUgcGF0aCBvZiBhIGZpbGUgdG8gY2hlY2suXG4gICAgLy8gSXQgd291bGQgYmUgbmljZSBpZiBpdCB3b3VsZCB0YWtlIHRoZSBwYXRoIGFuZCB1c2UgaXQgZm9yIGZpbHRlcmluZyxcbiAgICAvLyBhcyBjdXJyZW50bHkgdGhlIGNsaWVudCBoYXMgdG8gZG8gdGhlIGZpbHRlcmluZy5cbiAgICAvL1xuICAgIC8vIFRPRE8obWJvbGluKTogSGF2ZSBgZmxvdyBzdGF0dXNgIGhhdmUgdGhlIG9wdGlvbiB0byByZWFkIGEgZmlsZSBmcm9tXG4gICAgLy8gc3RkaW4gYW5kIGhhdmUgaXRzIHBhdGggc3BlY2lmaWVkIGJ5IC0tcGF0aCBhcyBgZmxvdyBnZXQtZGVmYCBkb2VzLlxuICAgIC8vIFRoZW4gRmxvdyBjb3VsZCB1c2UgdGhlIGN1cnJlbnQgY29udGVudHMgb2YgZWRpdG9yIGluc3RlYWQgb2Ygd2hhdCB3YXNcbiAgICAvLyBtb3N0IHJlY2VudGx5IHNhdmVkLlxuICAgIHZhciBhcmdzID0gWydzdGF0dXMnLCAnLS1qc29uJ107XG5cbiAgICB2YXIgcmVzdWx0O1xuICAgIHRyeSB7XG4gICAgICByZXN1bHQgPSBhd2FpdCB0aGlzLl9leGVjRmxvdyhhcmdzLCBvcHRpb25zKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAvLyBUaGlzIGNvZGVwYXRoIHdpbGwgYmUgZXhlcmNpc2VkIHdoZW4gRmxvdyBmaW5kcyB0eXBlIGVycm9ycyBhcyB0aGVcbiAgICAgIC8vIGV4aXQgY29kZSB3aWxsIGJlIG5vbi16ZXJvLiBOb3RlIHRoaXMgY29kZXBhdGggY291bGQgYWxzbyBiZSBleGVyY2lzZWRcbiAgICAgIC8vIGR1ZSB0byBhIGxvZ2ljYWwgZXJyb3IgaW4gTnVjbGlkZSwgc28gd2UgdHJ5IHRvIGRpZmZlcmVudGlhdGUuXG4gICAgICBpZiAoZS5leGl0Q29kZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJlc3VsdCA9IGU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsb2dnZXIuZXJyb3IoZSk7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIganNvbjtcbiAgICB0cnkge1xuICAgICAganNvbiA9IEpTT04ucGFyc2UocmVzdWx0LnN0ZG91dCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbG9nZ2VyLmVycm9yKGUpO1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIHJldHVybiBqc29uWydlcnJvcnMnXTtcbiAgfVxuXG4gIGFzeW5jIGdldEF1dG9jb21wbGV0ZVN1Z2dlc3Rpb25zKFxuICAgIGZpbGU6IE51Y2xpZGVVcmksXG4gICAgY3VycmVudENvbnRlbnRzOiBzdHJpbmcsXG4gICAgbGluZTogbnVtYmVyLFxuICAgIGNvbHVtbjogbnVtYmVyLFxuICAgIHByZWZpeDogc3RyaW5nXG4gICk6IFByb21pc2U8YW55PiB7XG4gICAgdmFyIG9wdGlvbnMgPSBhd2FpdCBnZXRGbG93RXhlY09wdGlvbnMoZmlsZSk7XG4gICAgaWYgKCFvcHRpb25zKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgdmFyIGFyZ3MgPSBbJ2F1dG9jb21wbGV0ZScsICctLWpzb24nLCBmaWxlXTtcblxuICAgIG9wdGlvbnMuc3RkaW4gPSBpbnNlcnRBdXRvY29tcGxldGVUb2tlbihjdXJyZW50Q29udGVudHMsIGxpbmUsIGNvbHVtbik7XG4gICAgdHJ5IHtcbiAgICAgIHZhciByZXN1bHQgPSBhd2FpdCB0aGlzLl9leGVjRmxvdyhhcmdzLCBvcHRpb25zKTtcbiAgICAgIGlmIChyZXN1bHQuZXhpdENvZGUgPT09IDApIHtcbiAgICAgICAgdmFyIGpzb24gPSBKU09OLnBhcnNlKHJlc3VsdC5zdGRvdXQpO1xuICAgICAgICB2YXIgcmVwbGFjZW1lbnRQcmVmaXggPSAvXlxccyokLy50ZXN0KHByZWZpeCkgPyAnJyA6IHByZWZpeDtcbiAgICAgICAgcmV0dXJuIGpzb24ubWFwKGl0ZW0gPT4ge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZXh0OiBpdGVtWyduYW1lJ10sXG4gICAgICAgICAgICByaWdodExhYmVsOiBpdGVtWyd0eXBlJ10sXG4gICAgICAgICAgICByZXBsYWNlbWVudFByZWZpeCxcbiAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChfKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZ2V0VHlwZShcbiAgICBmaWxlOiBOdWNsaWRlVXJpLFxuICAgIGN1cnJlbnRDb250ZW50czogc3RyaW5nLFxuICAgIGxpbmU6IG51bWJlcixcbiAgICBjb2x1bW46IG51bWJlclxuICApOiBQcm9taXNlPD9zdHJpbmc+IHtcbiAgICB2YXIgb3B0aW9ucyA9IGF3YWl0IGdldEZsb3dFeGVjT3B0aW9ucyhmaWxlKTtcbiAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIG9wdGlvbnMuc3RkaW4gPSBjdXJyZW50Q29udGVudHM7XG5cbiAgICBsaW5lID0gbGluZSArIDE7XG4gICAgY29sdW1uID0gY29sdW1uICsgMTtcbiAgICB2YXIgYXJncyA9IFsndHlwZS1hdC1wb3MnLCBsaW5lLCBjb2x1bW5dO1xuXG4gICAgdmFyIG91dHB1dDtcbiAgICB0cnkge1xuICAgICAgdmFyIHJlc3VsdCA9IGF3YWl0IHRoaXMuX2V4ZWNGbG93KGFyZ3MsIG9wdGlvbnMpO1xuICAgICAgb3V0cHV0ID0gcmVzdWx0LnN0ZG91dDtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBsb2dnZXIuZXJyb3IoJ2Zsb3cgdHlwZS1hdC1wb3MgZmFpbGVkOiAnICsgZmlsZSArICc6JyArIGxpbmUgKyAnOicgKyBjb2x1bW4sIGUpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIC8vIGluc3RlYWQgb2YgcmV0dXJuaW5nIGEgbm9uemVybyBleGl0IGNvZGUsIG9yIHNheWluZyB0aGF0IHRoZSB0eXBlIGlzXG4gICAgLy8gXCIodW5rbm93bilcIiwgRmxvdyBzb21ldGltZXMganVzdCBwcmludHMgYSBtZXNzYWdlIHRoYXQgaW5jbHVkZXMgdGhlXG4gICAgLy8gc3RyaW5nIFwiRmFpbHVyZVwiIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIHNlY29uZCBsaW5lLlxuICAgIGlmIChvdXRwdXQubWF0Y2goL1xcbkZhaWx1cmUvKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIC8vIHRoZSB0eXBlIGFwcGVhcnMgYnkgaXRzZWxmIG9uIHRoZSBmaXJzdCBsaW5lLlxuICAgIHZhciB0eXBlID0gb3V0cHV0LnNwbGl0KCdcXG4nKVswXTtcbiAgICBpZiAodHlwZSA9PT0gJyh1bmtub3duKScgfHwgdHlwZSA9PT0gJycpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gdHlwZTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExvY2FsRmxvd1NlcnZpY2U7XG4iXX0=