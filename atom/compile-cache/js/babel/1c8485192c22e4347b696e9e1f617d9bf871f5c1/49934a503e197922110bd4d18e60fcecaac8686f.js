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

var QuickSelectionProvider = require('./QuickSelectionProvider');

var _require = require('nuclide-atom-helpers');

var fileTypeClass = _require.fileTypeClass;

var _require2 = require('nuclide-client');

var getClient = _require2.getClient;

var React = require('react-for-atom');
var path = require('path');

var _require3 = require('nuclide-client');

var getClient = _require3.getClient;

var QuickSelectionProvider = require('./QuickSelectionProvider');
var FileResultComponent = require('./FileResultComponent');

var assign = Object.assign || require('object-assign');
var logger;

function getLogger() {
  if (!logger) {
    logger = require('nuclide-logging').getLogger();
  }
  return logger;
}

var FileListProvider = (function (_QuickSelectionProvider) {
  function FileListProvider() {
    _classCallCheck(this, FileListProvider);

    _get(Object.getPrototypeOf(FileListProvider.prototype), 'constructor', this).apply(this, arguments);
  }

  _inherits(FileListProvider, _QuickSelectionProvider);

  _createClass(FileListProvider, [{
    key: 'getPromptText',
    value: function getPromptText() {
      return 'Fuzzy File Name Search';
    }
  }, {
    key: 'executeQuery',
    value: _asyncToGenerator(function* (query) {
      if (query.length === 0) {
        return {};
      }
      var queries = atom.project.getDirectories().map(_asyncToGenerator(function* (directory) {
        var directoryPath = directory.getPath();
        var basename = directory.getBaseName();
        var client = getClient(directoryPath);

        var searchRequests = {
          filelist: client.searchDirectory(directoryPath, query).then(function (files) {
            return { results: files };
          })
        };
        return _defineProperty({}, basename, searchRequests);
      }));

      var outputs = [];
      try {
        outputs = yield Promise.all(queries);
      } catch (e) {
        getLogger().error(e);
      }
      return assign.apply(null, [{}].concat(outputs));
    })
  }, {
    key: 'getComponentForItem',

    // Returns a component with the filename on top, and the file's folder on the bottom.
    // Styling based on https://github.com/atom/fuzzy-finder/blob/master/lib/fuzzy-finder-view.coffee
    value: function getComponentForItem(item) {
      return FileResultComponent.getComponentForItem(item);
    }
  }]);

  return FileListProvider;
})(QuickSelectionProvider);

module.exports = FileListProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXF1aWNrLW9wZW4vbGliL0ZpbGVMaXN0UHJvdmlkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLFdBQVcsQ0FBQzs7QUFnQlosSUFBSSxzQkFBc0IsR0FBRyxPQUFPLENBQUMsMEJBQTBCLENBQUMsQ0FBQzs7ZUFDM0MsT0FBTyxDQUFDLHNCQUFzQixDQUFDOztJQUFoRCxhQUFhLFlBQWIsYUFBYTs7Z0JBQ0EsT0FBTyxDQUFDLGdCQUFnQixDQUFDOztJQUF0QyxTQUFTLGFBQVQsU0FBUzs7QUFDZCxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUN0QyxJQUFJLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7O2dCQUNULE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQzs7SUFBdEMsU0FBUyxhQUFULFNBQVM7O0FBQ2QsSUFBSSxzQkFBc0IsR0FBRyxPQUFPLENBQUMsMEJBQTBCLENBQUMsQ0FBQztBQUNqRSxJQUFJLG1CQUFtQixHQUFHLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDOztBQUUzRCxJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxJQUFJLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUN2RCxJQUFJLE1BQU0sQ0FBQzs7QUFFWCxTQUFTLFNBQVMsR0FBRztBQUNuQixNQUFJLENBQUMsTUFBTSxFQUFFO0FBQ1gsVUFBTSxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDO0dBQ2pEO0FBQ0QsU0FBTyxNQUFNLENBQUM7Q0FDZjs7SUFDSyxnQkFBZ0I7V0FBaEIsZ0JBQWdCOzBCQUFoQixnQkFBZ0I7OytCQUFoQixnQkFBZ0I7OztZQUFoQixnQkFBZ0I7O2VBQWhCLGdCQUFnQjs7V0FFUCx5QkFBRztBQUNkLGFBQU8sd0JBQXdCLENBQUM7S0FDakM7Ozs2QkFFaUIsV0FBQyxLQUFhLEVBQXdCO0FBQ3RELFVBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7QUFDdEIsZUFBTyxFQUFFLENBQUM7T0FDWDtBQUNELFVBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUMsR0FBRyxtQkFBQyxXQUFPLFNBQVMsRUFBSztBQUNuRSxZQUFJLGFBQWEsR0FBRyxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDeEMsWUFBSSxRQUFRLEdBQUcsU0FBUyxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3ZDLFlBQUksTUFBTSxHQUFHLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQzs7QUFFdEMsWUFBSSxjQUFjLEdBQUc7QUFDbkIsa0JBQVEsRUFBRSxNQUFNLENBQUMsZUFBZSxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQSxLQUFLLEVBQUk7QUFBQyxtQkFBTyxFQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUMsQ0FBQztXQUFDLENBQUM7U0FDakcsQ0FBQztBQUNGLG1DQUFTLFFBQVEsRUFBRyxjQUFjLEVBQUU7T0FDckMsRUFBQyxDQUFDOztBQUVILFVBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQztBQUNqQixVQUFJO0FBQ0YsZUFBTyxHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztPQUN0QyxDQUFDLE9BQU0sQ0FBQyxFQUFFO0FBQ1QsaUJBQVMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztPQUN0QjtBQUNELGFBQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztLQUNqRDs7Ozs7O1dBSWtCLDZCQUFDLElBQWdCLEVBQWdCO0FBQ2xELGFBQU8sbUJBQW1CLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDdEQ7OztTQWxDRyxnQkFBZ0I7R0FBUyxzQkFBc0I7O0FBcUNyRCxNQUFNLENBQUMsT0FBTyxHQUFHLGdCQUFnQixDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXF1aWNrLW9wZW4vbGliL0ZpbGVMaXN0UHJvdmlkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7XG4gIEZpbGVSZXN1bHQsXG4gIEdyb3VwZWRSZXN1bHRQcm9taXNlLFxufSBmcm9tICcuL3R5cGVzJztcblxudmFyIFF1aWNrU2VsZWN0aW9uUHJvdmlkZXIgPSByZXF1aXJlKCcuL1F1aWNrU2VsZWN0aW9uUHJvdmlkZXInKTtcbnZhciB7ZmlsZVR5cGVDbGFzc30gPSByZXF1aXJlKCdudWNsaWRlLWF0b20taGVscGVycycpO1xudmFyIHtnZXRDbGllbnR9ID0gcmVxdWlyZSgnbnVjbGlkZS1jbGllbnQnKTtcbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0LWZvci1hdG9tJyk7XG52YXIgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbnZhciB7Z2V0Q2xpZW50fSA9IHJlcXVpcmUoJ251Y2xpZGUtY2xpZW50Jyk7XG52YXIgUXVpY2tTZWxlY3Rpb25Qcm92aWRlciA9IHJlcXVpcmUoJy4vUXVpY2tTZWxlY3Rpb25Qcm92aWRlcicpO1xudmFyIEZpbGVSZXN1bHRDb21wb25lbnQgPSByZXF1aXJlKCcuL0ZpbGVSZXN1bHRDb21wb25lbnQnKTtcblxudmFyIGFzc2lnbiA9IE9iamVjdC5hc3NpZ24gfHwgcmVxdWlyZSgnb2JqZWN0LWFzc2lnbicpO1xudmFyIGxvZ2dlcjtcblxuZnVuY3Rpb24gZ2V0TG9nZ2VyKCkge1xuICBpZiAoIWxvZ2dlcikge1xuICAgIGxvZ2dlciA9IHJlcXVpcmUoJ251Y2xpZGUtbG9nZ2luZycpLmdldExvZ2dlcigpO1xuICB9XG4gIHJldHVybiBsb2dnZXI7XG59XG5jbGFzcyBGaWxlTGlzdFByb3ZpZGVyIGV4dGVuZHMgUXVpY2tTZWxlY3Rpb25Qcm92aWRlciB7XG5cbiAgZ2V0UHJvbXB0VGV4dCgpIHtcbiAgICByZXR1cm4gJ0Z1enp5IEZpbGUgTmFtZSBTZWFyY2gnO1xuICB9XG5cbiAgYXN5bmMgZXhlY3V0ZVF1ZXJ5KHF1ZXJ5OiBzdHJpbmcpOiBHcm91cGVkUmVzdWx0UHJvbWlzZSB7XG4gICAgaWYgKHF1ZXJ5Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHt9O1xuICAgIH1cbiAgICB2YXIgcXVlcmllcyA9IGF0b20ucHJvamVjdC5nZXREaXJlY3RvcmllcygpLm1hcChhc3luYyAoZGlyZWN0b3J5KSA9PiB7XG4gICAgICB2YXIgZGlyZWN0b3J5UGF0aCA9IGRpcmVjdG9yeS5nZXRQYXRoKCk7XG4gICAgICB2YXIgYmFzZW5hbWUgPSBkaXJlY3RvcnkuZ2V0QmFzZU5hbWUoKTtcbiAgICAgIHZhciBjbGllbnQgPSBnZXRDbGllbnQoZGlyZWN0b3J5UGF0aCk7XG5cbiAgICAgIHZhciBzZWFyY2hSZXF1ZXN0cyA9IHtcbiAgICAgICAgZmlsZWxpc3Q6IGNsaWVudC5zZWFyY2hEaXJlY3RvcnkoZGlyZWN0b3J5UGF0aCwgcXVlcnkpLnRoZW4oZmlsZXMgPT4ge3JldHVybiB7cmVzdWx0czogZmlsZXN9O30pLFxuICAgICAgfTtcbiAgICAgIHJldHVybiB7W2Jhc2VuYW1lXTogc2VhcmNoUmVxdWVzdHN9O1xuICAgIH0pO1xuXG4gICAgdmFyIG91dHB1dHMgPSBbXTtcbiAgICB0cnkge1xuICAgICAgb3V0cHV0cyA9IGF3YWl0IFByb21pc2UuYWxsKHF1ZXJpZXMpO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgZ2V0TG9nZ2VyKCkuZXJyb3IoZSk7XG4gICAgfVxuICAgIHJldHVybiBhc3NpZ24uYXBwbHkobnVsbCwgW3t9XS5jb25jYXQob3V0cHV0cykpO1xuICB9XG5cbiAgLy8gUmV0dXJucyBhIGNvbXBvbmVudCB3aXRoIHRoZSBmaWxlbmFtZSBvbiB0b3AsIGFuZCB0aGUgZmlsZSdzIGZvbGRlciBvbiB0aGUgYm90dG9tLlxuICAvLyBTdHlsaW5nIGJhc2VkIG9uIGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2Z1enp5LWZpbmRlci9ibG9iL21hc3Rlci9saWIvZnV6enktZmluZGVyLXZpZXcuY29mZmVlXG4gIGdldENvbXBvbmVudEZvckl0ZW0oaXRlbTogRmlsZVJlc3VsdCk6IFJlYWN0RWxlbWVudCB7XG4gICAgcmV0dXJuIEZpbGVSZXN1bHRDb21wb25lbnQuZ2V0Q29tcG9uZW50Rm9ySXRlbShpdGVtKTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBGaWxlTGlzdFByb3ZpZGVyO1xuIl19