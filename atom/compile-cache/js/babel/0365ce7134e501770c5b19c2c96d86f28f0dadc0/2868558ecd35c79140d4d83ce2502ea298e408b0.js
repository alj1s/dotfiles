'use babel';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

/**
 * This code implements the NuclideFs client.  It uses the request module to
 * make XHR requests to the NuclideFS service.  It is a Promise based API.
 */

var fs = require('fs');
var extend = require('util')._extend;

var NuclideClient = (function () {
  function NuclideClient(id, eventbus) {
    var options = arguments[2] === undefined ? {} : arguments[2];

    _classCallCheck(this, NuclideClient);

    this._id = id;
    this.eventbus = eventbus;
    this._options = options;
    this._searchProviders = {};
  }

  _createClass(NuclideClient, [{
    key: 'getID',
    value: function getID() {
      return this._id;
    }
  }, {
    key: 'readFile',

    /**
     * Reads a file from remote FS
     *
     * @param path the path to the file to read
     * @param options set of options that are passed to fs.createReadStream.
     *
     * It returns promise that resolves to a Buffer with the file contents.
     */
    value: _asyncToGenerator(function* (path, options) {
      return this.eventbus.callMethod(
      /*serviceName*/'fs',
      /*methodName*/'readFile',
      /*methodArgs*/[path, options]);
    })
  }, {
    key: 'writeFile',

    /**
     * Writes a file to the remote FS
     *
     * @param path the path to the file to read
     * @param data a node buffer of the data to write to file
     * @param options set of options that are passed to fs.createReadStream.
     *
     * It returns a void promise.
     */
    value: function writeFile(path, data, options) {
      return this.eventbus.callMethod(
      /*serviceName*/'fs',
      /*methodName*/'writeFile',
      /*methodArgs*/[path, options],
      /*extraOptions*/{ body: data, method: 'POST' });
    }
  }, {
    key: 'newFile',

    /**
     * Creates a new, empty file on the remote FS.
     *
     * If no file (or directory) at the specified path exists, creates the parent
     * directories (if necessary) and then writes an empty file at the specified
     * path.
     *
     * @return A boolean indicating whether the file was created.
     */
    value: function newFile(path) {
      return this.eventbus.callMethod(
      /*serviceName*/'fs',
      /*methodName*/'newFile',
      /*methodArgs*/[path],
      /*extraOptions*/{ method: 'POST', json: true });
    }
  }, {
    key: 'stat',

    /**
     * Returns an fs.Stats promise from remote FS
     *
     * @param path the path to the file/directory to get Stats for
     */
    value: _asyncToGenerator(function* (path) {
      var body = yield this.eventbus.callMethod(
      /*serviceName*/'fs',
      /*methodName*/'stat',
      /*methodArgs*/[path],
      /*extraOptions*/{ json: true });
      return createStats(body);
    })
  }, {
    key: 'readdir',

    /**
     * Returns a promism that resolves to an array of
     * {file: 'name', stats: <fs.Stats>} from remote FS
     *
     * @param path the path to the directory to get entries for
     */
    value: _asyncToGenerator(function* (path) {
      var body = yield this.eventbus.callMethod(
      /*serviceName*/'fs',
      /*methodName*/'readdir',
      /*methodArgs*/[path],
      /*extraOptions*/{ json: true });
      return body.map(function (entry) {
        return {
          file: entry.file,
          stats: createStats(entry.stats),
          isSymbolicLink: entry.isSymbolicLink
        };
      });
    })
  }, {
    key: 'lstat',

    /**
     * Returns an fs.Stats promise from remote FS
     *
     * @param path the path to the file/directory to get Stats for
     *
     * Same as stats call above except it will return the stats for the
     * underlying file if a link is passed.
     */
    value: _asyncToGenerator(function* (path) {
      var body = yield this.eventbus.callMethod(
      /*serviceName*/'fs',
      /*methodName*/'lstat',
      /*methodArgs*/[path],
      /*extraOptions*/{ json: true });
      return createStats(body);
    })
  }, {
    key: 'exists',

    /**
     * Checks for existence of a file/directory/link on a remote FS
     *
     * @param path the path to the file/directory to check for existence
     *
     * It returns promise that resolve to true if file exists, false otherwise.
     */
    value: function exists(path) {
      return this.eventbus.callMethod(
      /*serviceName*/'fs',
      /*methodName*/'exists',
      /*methodArgs*/[path],
      /*extraOptions*/{ json: true });
    }
  }, {
    key: 'realpath',

    /**
     * Gets the real path of a file path.
     * It could be different than the given path if the file is a symlink
     * or exists in a symlinked directory.
     */
    value: function realpath(path) {
      return this.eventbus.callMethod(
      /*serviceName*/'fs',
      /*methodName*/'realpath',
      /*methodArgs*/[path]);
    }
  }, {
    key: 'rename',

    /**
     * Rename a file or folder.
     */
    value: function rename(sourcePath, destinationPath) {
      return this.eventbus.callMethod(
      /*serviceName*/'fs',
      /*methodName*/'rename',
      /*methodArgs*/[sourcePath, destinationPath],
      /*extraOptions*/{ method: 'POST' });
    }
  }, {
    key: 'mkdir',

    /**
     * Creates a new directory with the given path.
     * Throws EEXIST error if the directory already exists.
     * Throws ENOENT if the path given is nested in a non-existing directory.
     */
    value: function mkdir(path) {
      return this.eventbus.callMethod(
      /*serviceName*/'fs',
      /*methodName*/'mkdir',
      /*methodArgs*/[path],
      /*extraOptions*/{ method: 'POST' });
    }
  }, {
    key: 'mkdirp',

    /**
     * Runs the equivalent of `mkdir -p` with the given path.
     *
     * Like most implementations of mkdirp, if it fails, it is possible that
     * directories were created for some prefix of the given path.
     * @return true if the path was created; false if it already existed.
     */
    value: function mkdirp(path) {
      return this.eventbus.callMethod(
      /*serviceName*/'fs',
      /*methodName*/'mkdirp',
      /*methodArgs*/[path],
      /*extraOptions*/{ method: 'POST', json: true });
    }
  }, {
    key: 'rmdir',

    /*
     * Removes directories even if they are non-empty. Does not fail if the directory doesn't exist.
     */
    value: function rmdir(path) {
      return this.eventbus.callMethod(
      /*serviceName*/'fs',
      /*methodName*/'rmdir',
      /*methodArgs*/[path],
      /*extraOptions*/{ method: 'POST', json: true });
    }
  }, {
    key: 'unlink',

    /**
     * Removes files. Does not fail if the file doesn't exist.
     */
    value: function unlink(path) {
      return this.eventbus.callMethod(
      /*serviceName*/'fs',
      /*methodName*/'unlink',
      /*methodArgs*/[path],
      /*extraOptions*/{ method: 'POST', json: true });
    }
  }, {
    key: 'findNearestFile',
    value: function findNearestFile(fileName, pathToDirectory) {
      return this.eventbus.callMethod(
      /*serviceName*/'fs',
      /*methodName*/'findNearestFile',
      /*methodArgs*/[fileName, pathToDirectory],
      /*extraOptions*/{ json: true });
    }
  }, {
    key: 'makeRpc',

    /**
     * Make rpc call to service given serviceUri in form of `$serviceName/$methodName` and args as arguments list.
     */
    value: function makeRpc(serviceUri, args, serviceOptions) {
      var _serviceUri$split = serviceUri.split('/');

      var _serviceUri$split2 = _slicedToArray(_serviceUri$split, 2);

      var serviceName = _serviceUri$split2[0];
      var methodName = _serviceUri$split2[1];

      return this.eventbus.callServiceFrameworkMethod(serviceName, methodName,
      /* methodArgs */args,
      /* serviceOptions */serviceOptions);
    }
  }, {
    key: 'registerEventListener',
    value: function registerEventListener(eventName, callback, serviceOptions) {
      return this.eventbus.registerEventListener(eventName, callback, serviceOptions);
    }
  }, {
    key: 'searchDirectory',

    /**
     * Searches the contents of `directory` for paths mathing `query`.
     */
    value: _asyncToGenerator(function* (directory, query) {
      return yield this.eventbus.callMethod(
      /*serviceName*/'search',
      /*methodName*/'directory',
      /*methodArgs*/[directory, query],
      /*extraOptions*/{ json: true });
    })
  }, {
    key: 'version',

    /**
     * Returns the server version.
     */
    value: function version() {
      return this.eventbus.callMethod(
      /*serviceName*/'server',
      /*methodName*/'version',
      /*methodArgs*/[],
      /*extraOptions*/{ method: 'POST', json: true });
    }
  }, {
    key: 'shutdownServer',

    /**
     * Returns the server version.
     */
    value: function shutdownServer() {
      return this.eventbus.callMethod(
      /*serviceName*/'server',
      /*methodName*/'shutdown',
      /*methodArgs*/[],
      /*extraOptions*/{ method: 'POST' });
    }
  }, {
    key: 'watchFile',
    value: _asyncToGenerator(function* (filePath) {
      var watcherId = yield this.eventbus.callMethod(
      /*serviceName*/'watcher',
      /*methodName*/'watchFile',
      /*methodArgs*/[filePath],
      /*extraOptions*/{ method: 'POST', json: true });
      return yield this.eventbus.consumeEventEmitter(watcherId, ['change', 'rename', 'delete']);
    })
  }, {
    key: 'watchDirectory',
    value: _asyncToGenerator(function* (directoryPath) {
      var watcherId = yield this.eventbus.callMethod(
      /*serviceName*/'watcher',
      /*methodName*/'watchDirectory',
      /*methodArgs*/[directoryPath],
      /*extraOptions*/{ method: 'POST', json: true });
      return yield this.eventbus.consumeEventEmitter(watcherId, ['change']);
    })
  }, {
    key: 'watchDirectoryRecursive',
    value: _asyncToGenerator(function* (directoryPath, handler) {
      var watchChannel = watchDirectoryChannel(directoryPath);
      yield this.eventbus.subscribeToChannel(watchChannel, handler);
      yield this.eventbus.callMethod(
      /*serviceName*/'watcher',
      /*methodName*/'watchDirectoryRecursive',
      /*methodArgs*/[directoryPath, watchChannel],
      /*extraOptions*/{ method: 'POST', json: true });
    })
  }, {
    key: 'unwatchFile',
    value: function unwatchFile(filePath) {
      return this.eventbus.callMethod(
      /*serviceName*/'watcher',
      /*methodName*/'unwatchFile',
      /*methodArgs*/[filePath],
      /*extraOptions*/{ method: 'POST', json: true });
    }
  }, {
    key: 'unwatchDirectory',
    value: function unwatchDirectory(directoryPath) {
      return this.eventbus.callMethod(
      /*serviceName*/'watcher',
      /*methodName*/'unwatchDirectory',
      /*methodArgs*/[directoryPath],
      /*extraOptions*/{ method: 'POST', json: true });
    }
  }, {
    key: 'unwatchDirectoryRecursive',
    value: function unwatchDirectoryRecursive(directoryPath) {
      return this.eventbus.callMethod(
      /*serviceName*/'watcher',
      /*methodName*/'unwatchDirectoryRecursive',
      /*methodArgs*/[directoryPath],
      /*extraOptions*/{ method: 'POST', json: true });
    }
  }, {
    key: 'doSearchQuery',
    value: function doSearchQuery(rootDirectory, provider, query) {
      return this.eventbus.callMethod(
      /*serviceName*/'search',
      /*methodName*/'query',
      /*methodArgs*/[rootDirectory, provider, query],
      /*extraOptions*/{ method: 'POST', json: true });
    }
  }, {
    key: 'getSearchProviders',
    value: _asyncToGenerator(function* (rootDirectory) {
      var providers = this._searchProviders[rootDirectory];
      if (providers) {
        return providers;
      }
      providers = yield this.eventbus.callMethod(
      /*serviceName*/'search',
      /*methodName*/'listProviders',
      /*methodArgs*/[rootDirectory],
      /*extraOptions*/{ method: 'POST', json: true });

      this._searchProviders[rootDirectory] = providers;

      return providers;
    })
  }, {
    key: 'getHackDiagnostics',
    value: function getHackDiagnostics() {
      var cwd = this._options.cwd;

      return this.eventbus.callMethod(
      /*serviceName*/'hack',
      /*methodName*/'getDiagnostics',
      /*methodArgs*/[{ cwd: cwd }],
      /*extraOptions*/{ method: 'POST', json: true });
    }
  }, {
    key: 'getHackCompletions',
    value: function getHackCompletions(query) {
      var cwd = this._options.cwd;

      return this.eventbus.callMethod(
      /*serviceName*/'hack',
      /*methodName*/'getCompletions',
      /*methodArgs*/[query, { cwd: cwd }],
      /*extraOptions*/{ method: 'POST', json: true });
    }
  }, {
    key: 'getHackDefinition',
    value: function getHackDefinition(query, symbolType) {
      var cwd = this._options.cwd;

      return this.eventbus.callMethod(
      /*serviceName*/'hack',
      /*methodName*/'getDefinition',
      /*methodArgs*/[query, symbolType, { cwd: cwd }],
      /*extraOptions*/{ method: 'POST', json: true });
    }
  }, {
    key: 'getHackDependencies',
    value: function getHackDependencies(dependenciesInfo) {
      var cwd = this._options.cwd;

      return this.eventbus.callMethod(
      /*serviceName*/'hack',
      /*methodName*/'getDependencies',
      /*methodArgs*/[dependenciesInfo, { cwd: cwd }],
      /*extraOptions*/{ method: 'POST', json: true });
    }
  }, {
    key: 'getHackSearchResults',
    value: function getHackSearchResults(search, filterTypes, searchPostfix) {
      var cwd = this._options.cwd;

      return this.eventbus.callMethod(
      /*serviceName*/'hack',
      /*methodName*/'getSearchResults',
      /*methodArgs*/[search, filterTypes, searchPostfix, { cwd: cwd }],
      /*extraOptions*/{ method: 'POST', json: true });
    }
  }, {
    key: 'isHackClientAvailable',
    value: function isHackClientAvailable() {
      return this.eventbus.callMethod(
      /*serviceName*/'hack',
      /*methodName*/'isClientAvailable',
      /*methodArgs*/[],
      /*extraOptions*/{ method: 'POST', json: true });
    }
  }, {
    key: 'close',
    value: function close() {
      if (this.eventbus) {
        this.eventbus.close();
        this.eventbus = null;
      }
    }
  }]);

  return NuclideClient;
})();

function createStats(jsonStats) {
  var stats = new fs.Stats();

  stats.dev = jsonStats.dev;
  stats.mode = jsonStats.mode;
  stats.nlink = jsonStats.nlink;
  stats.uid = jsonStats.uid;
  stats.gid = jsonStats.gid;
  stats.rdev = jsonStats.rdev;
  stats.blksize = jsonStats.blksize;
  stats.ino = jsonStats.ino;
  stats.size = jsonStats.size;
  stats.blocks = jsonStats.blocks;
  stats.atime = new Date(jsonStats.atime);
  stats.mtime = new Date(jsonStats.mtime);
  stats.ctime = new Date(jsonStats.ctime);

  if (jsonStats.birthtime) {
    stats.birthtime = new Date(jsonStats.birthtime);
  }

  return stats;
}

module.exports = NuclideClient;

function watchDirectoryChannel(directoryPath) {
  return 'watch' + directoryPath;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9ub2RlX21vZHVsZXMvbnVjbGlkZS1yZW1vdGUtY29ubmVjdGlvbi9ub2RlX21vZHVsZXMvbnVjbGlkZS1zZXJ2ZXIvbGliL051Y2xpZGVDbGllbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBZ0JaLElBQUksRUFBRSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN2QixJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDOztJQVEvQixhQUFhO0FBQ04sV0FEUCxhQUFhLENBQ0wsRUFBVSxFQUFFLFFBQTBCLEVBQXVDO1FBQXJDLE9BQThCLGdDQUFHLEVBQUU7OzBCQURuRixhQUFhOztBQUVmLFFBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDO0FBQ2QsUUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7QUFDekIsUUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7QUFDeEIsUUFBSSxDQUFDLGdCQUFnQixHQUFHLEVBQUUsQ0FBQztHQUM1Qjs7ZUFORyxhQUFhOztXQVFaLGlCQUFHO0FBQ04sYUFBTyxJQUFJLENBQUMsR0FBRyxDQUFDO0tBQ2pCOzs7Ozs7Ozs7Ozs7NkJBVWEsV0FBQyxJQUFZLEVBQUUsT0FBWSxFQUFtQjtBQUMxRCxhQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVTtxQkFDYixJQUFJO29CQUNMLFVBQVU7b0JBQ1YsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQy9CLENBQUM7S0FDSDs7Ozs7Ozs7Ozs7OztXQVdRLG1CQUFDLElBQVksRUFBRSxJQUFZLEVBQUUsT0FBWSxFQUFpQjtBQUNqRSxhQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVTtxQkFDYixJQUFJO29CQUNMLFdBQVc7b0JBQ1gsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDO3NCQUNiLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFDLENBQzlDLENBQUM7S0FDSDs7Ozs7Ozs7Ozs7OztXQVdNLGlCQUFDLElBQVksRUFBb0I7QUFDdEMsYUFBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVU7cUJBQ2IsSUFBSTtvQkFDTCxTQUFTO29CQUNULENBQUMsSUFBSSxDQUFDO3NCQUNKLEVBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDLENBQzlDLENBQUM7S0FDSDs7Ozs7Ozs7OzZCQU9TLFdBQUMsSUFBWSxFQUFxQjtBQUMxQyxVQUFJLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVTtxQkFDdkIsSUFBSTtvQkFDTCxNQUFNO29CQUNOLENBQUMsSUFBSSxDQUFDO3NCQUNKLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBQyxDQUM5QixDQUFDO0FBQ0YsYUFBTyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDMUI7Ozs7Ozs7Ozs7NkJBUVksV0FBQyxJQUFZLEVBQWlDO0FBQ3pELFVBQUksSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVO3FCQUN2QixJQUFJO29CQUNMLFNBQVM7b0JBQ1QsQ0FBQyxJQUFJLENBQUM7c0JBQ0osRUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFDLENBQzlCLENBQUM7QUFDRixhQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBQyxLQUFLLEVBQUs7QUFDekIsZUFBTztBQUNMLGNBQUksRUFBRSxLQUFLLENBQUMsSUFBSTtBQUNoQixlQUFLLEVBQUUsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7QUFDL0Isd0JBQWMsRUFBRSxLQUFLLENBQUMsY0FBYztTQUNyQyxDQUFDO09BQ0gsQ0FBQyxDQUFDO0tBQ0o7Ozs7Ozs7Ozs7Ozs2QkFVVSxXQUFDLElBQVksRUFBcUI7QUFDM0MsVUFBSSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVU7cUJBQ3ZCLElBQUk7b0JBQ0wsT0FBTztvQkFDUCxDQUFDLElBQUksQ0FBQztzQkFDSixFQUFDLElBQUksRUFBRSxJQUFJLEVBQUMsQ0FDOUIsQ0FBQztBQUNGLGFBQU8sV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQzFCOzs7Ozs7Ozs7OztXQVNLLGdCQUFDLElBQVksRUFBb0I7QUFDckMsYUFBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVU7cUJBQ2IsSUFBSTtvQkFDTCxRQUFRO29CQUNSLENBQUMsSUFBSSxDQUFDO3NCQUNKLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBQyxDQUM5QixDQUFDO0tBQ0g7Ozs7Ozs7OztXQU9PLGtCQUFDLElBQVksRUFBbUI7QUFDdEMsYUFBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVU7cUJBQ2IsSUFBSTtvQkFDTCxVQUFVO29CQUNWLENBQUMsSUFBSSxDQUFDLENBQ3RCLENBQUM7S0FDSDs7Ozs7OztXQUtLLGdCQUFDLFVBQWtCLEVBQUUsZUFBdUIsRUFBVztBQUMzRCxhQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVTtxQkFDYixJQUFJO29CQUNMLFFBQVE7b0JBQ1IsQ0FBQyxVQUFVLEVBQUUsZUFBZSxDQUFDO3NCQUMzQixFQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUMsQ0FDbEMsQ0FBQztLQUNIOzs7Ozs7Ozs7V0FPSSxlQUFDLElBQVksRUFBbUI7QUFDbkMsYUFBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVU7cUJBQ2IsSUFBSTtvQkFDTCxPQUFPO29CQUNQLENBQUMsSUFBSSxDQUFDO3NCQUNKLEVBQUMsTUFBTSxFQUFFLE1BQU0sRUFBQyxDQUNsQyxDQUFDO0tBQ0g7Ozs7Ozs7Ozs7O1dBU0ssZ0JBQUMsSUFBWSxFQUFvQjtBQUNyQyxhQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVTtxQkFDYixJQUFJO29CQUNMLFFBQVE7b0JBQ1IsQ0FBQyxJQUFJLENBQUM7c0JBQ0osRUFBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUMsQ0FDOUMsQ0FBQztLQUNIOzs7Ozs7O1dBS0ksZUFBQyxJQUFZLEVBQVc7QUFDM0IsYUFBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVU7cUJBQ2IsSUFBSTtvQkFDTCxPQUFPO29CQUNQLENBQUMsSUFBSSxDQUFDO3NCQUNKLEVBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDLENBQzlDLENBQUM7S0FDSDs7Ozs7OztXQUtLLGdCQUFDLElBQVksRUFBVztBQUM1QixhQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVTtxQkFDYixJQUFJO29CQUNMLFFBQVE7b0JBQ1IsQ0FBQyxJQUFJLENBQUM7c0JBQ0osRUFBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUMsQ0FDOUMsQ0FBQztLQUNIOzs7V0FFYyx5QkFBQyxRQUFnQixFQUFFLGVBQXVCLEVBQW9CO0FBQzNFLGFBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVO3FCQUNiLElBQUk7b0JBQ0wsaUJBQWlCO29CQUNqQixDQUFDLFFBQVEsRUFBRSxlQUFlLENBQUM7c0JBQ3pCLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBQyxDQUM5QixDQUFDO0tBQ0g7Ozs7Ozs7V0FLTSxpQkFBQyxVQUFrQixFQUFFLElBQWdCLEVBQUUsY0FBbUIsRUFBZ0I7OEJBQy9DLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDOzs7O1VBQWhELFdBQVc7VUFBRSxVQUFVOztBQUM1QixhQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsMEJBQTBCLENBQzdDLFdBQVcsRUFDWCxVQUFVO3NCQUNPLElBQUk7MEJBQ0EsY0FBYyxDQUNyQyxDQUFDO0tBQ0Y7OztXQUVvQiwrQkFBQyxTQUFpQixFQUFFLFFBQXVDLEVBQUUsY0FBbUIsRUFBYztBQUNqSCxhQUFPLElBQUksQ0FBQyxRQUFRLENBQUMscUJBQXFCLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxjQUFjLENBQUMsQ0FBQztLQUNqRjs7Ozs7Ozs2QkFLb0IsV0FBQyxTQUFpQixFQUFFLEtBQWEsRUFBZ0I7QUFDcEUsYUFBTyxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVTtxQkFDbkIsUUFBUTtvQkFDVCxXQUFXO29CQUNYLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQztzQkFDaEIsRUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFDLENBQzlCLENBQUM7S0FDSDs7Ozs7OztXQUtNLG1CQUEyQjtBQUNoQyxhQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVTtxQkFDYixRQUFRO29CQUNULFNBQVM7b0JBQ1QsRUFBRTtzQkFDQSxFQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQyxDQUM5QyxDQUFDO0tBQ0g7Ozs7Ozs7V0FLYSwwQkFBWTtBQUN4QixhQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVTtxQkFDYixRQUFRO29CQUNULFVBQVU7b0JBQ1YsRUFBRTtzQkFDQSxFQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUMsQ0FDbEMsQ0FBQztLQUNIOzs7NkJBRWMsV0FBQyxRQUFnQixFQUFzQjtBQUNwRCxVQUFJLFNBQVMsR0FBRyxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVTtxQkFDNUIsU0FBUztvQkFDVixXQUFXO29CQUNYLENBQUMsUUFBUSxDQUFDO3NCQUNSLEVBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDLENBQzlDLENBQUM7QUFDRixhQUFPLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7S0FDM0Y7Ozs2QkFFbUIsV0FBQyxhQUFxQixFQUFzQjtBQUM5RCxVQUFJLFNBQVMsR0FBRyxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVTtxQkFDNUIsU0FBUztvQkFDVixnQkFBZ0I7b0JBQ2hCLENBQUMsYUFBYSxDQUFDO3NCQUNiLEVBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDLENBQzlDLENBQUM7QUFDRixhQUFPLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0tBQ3ZFOzs7NkJBRTRCLFdBQUMsYUFBcUIsRUFBRSxPQUEwQyxFQUFFO0FBQy9GLFVBQUksWUFBWSxHQUFHLHFCQUFxQixDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ3hELFlBQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDOUQsWUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVU7cUJBQ1osU0FBUztvQkFDVix5QkFBeUI7b0JBQ3pCLENBQUMsYUFBYSxFQUFFLFlBQVksQ0FBQztzQkFDM0IsRUFBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUMsQ0FDOUMsQ0FBQztLQUNIOzs7V0FFVSxxQkFBQyxRQUFnQixFQUFXO0FBQ3JDLGFBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVO3FCQUNiLFNBQVM7b0JBQ1YsYUFBYTtvQkFDYixDQUFDLFFBQVEsQ0FBQztzQkFDUixFQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQyxDQUM5QyxDQUFDO0tBQ0g7OztXQUVlLDBCQUFDLGFBQXFCLEVBQVc7QUFDL0MsYUFBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVU7cUJBQ2IsU0FBUztvQkFDVixrQkFBa0I7b0JBQ2xCLENBQUMsYUFBYSxDQUFDO3NCQUNiLEVBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDLENBQzlDLENBQUM7S0FDSDs7O1dBRXdCLG1DQUFDLGFBQXFCLEVBQVc7QUFDeEQsYUFBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVU7cUJBQ2IsU0FBUztvQkFDViwyQkFBMkI7b0JBQzNCLENBQUMsYUFBYSxDQUFDO3NCQUNiLEVBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDLENBQzlDLENBQUM7S0FDSDs7O1dBRVksdUJBQUMsYUFBb0IsRUFBRSxRQUFnQixFQUFFLEtBQWEsRUFBVztBQUM1RSxhQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVTtxQkFDYixRQUFRO29CQUNULE9BQU87b0JBQ1AsQ0FBQyxhQUFhLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQztzQkFDOUIsRUFBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUMsQ0FDOUMsQ0FBQztLQUNIOzs7NkJBRXVCLFdBQUMsYUFBcUIsRUFBaUM7QUFDN0UsVUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ3JELFVBQUksU0FBUyxFQUFFO0FBQ2IsZUFBTyxTQUFTLENBQUM7T0FDbEI7QUFDRCxlQUFTLEdBQUcsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVU7cUJBQ3hCLFFBQVE7b0JBQ1QsZUFBZTtvQkFDZixDQUFDLGFBQWEsQ0FBQztzQkFDYixFQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQyxDQUM5QyxDQUFDOztBQUVGLFVBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLENBQUMsR0FBRyxTQUFTLENBQUM7O0FBRWpELGFBQU8sU0FBUyxDQUFDO0tBQ2xCOzs7V0FFaUIsOEJBQVk7VUFDdkIsR0FBRyxHQUFJLElBQUksQ0FBQyxRQUFRLENBQXBCLEdBQUc7O0FBQ1IsYUFBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVU7cUJBQ2IsTUFBTTtvQkFDUCxnQkFBZ0I7b0JBQ2hCLENBQUMsRUFBQyxHQUFHLEVBQUgsR0FBRyxFQUFDLENBQUM7c0JBQ0wsRUFBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUMsQ0FDOUMsQ0FBQztLQUNIOzs7V0FFaUIsNEJBQUMsS0FBYSxFQUFXO1VBQ3BDLEdBQUcsR0FBSSxJQUFJLENBQUMsUUFBUSxDQUFwQixHQUFHOztBQUNSLGFBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVO3FCQUNiLE1BQU07b0JBQ1AsZ0JBQWdCO29CQUNoQixDQUFDLEtBQUssRUFBRSxFQUFDLEdBQUcsRUFBSCxHQUFHLEVBQUMsQ0FBQztzQkFDWixFQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQyxDQUM5QyxDQUFDO0tBQ0g7OztXQUVnQiwyQkFBQyxLQUFhLEVBQUUsVUFBc0IsRUFBVztVQUMzRCxHQUFHLEdBQUksSUFBSSxDQUFDLFFBQVEsQ0FBcEIsR0FBRzs7QUFDUixhQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVTtxQkFDYixNQUFNO29CQUNQLGVBQWU7b0JBQ2YsQ0FBQyxLQUFLLEVBQUUsVUFBVSxFQUFFLEVBQUMsR0FBRyxFQUFILEdBQUcsRUFBQyxDQUFDO3NCQUN4QixFQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQyxDQUM5QyxDQUFDO0tBQ0g7OztXQUVrQiw2QkFBQyxnQkFBcUQsRUFBZ0I7VUFDbEYsR0FBRyxHQUFJLElBQUksQ0FBQyxRQUFRLENBQXBCLEdBQUc7O0FBQ1IsYUFBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVU7cUJBQ2IsTUFBTTtvQkFDUCxpQkFBaUI7b0JBQ2pCLENBQUMsZ0JBQWdCLEVBQUUsRUFBQyxHQUFHLEVBQUgsR0FBRyxFQUFDLENBQUM7c0JBQ3ZCLEVBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDLENBQzlDLENBQUM7S0FDSDs7O1dBRW1CLDhCQUNoQixNQUFjLEVBQ2QsV0FBcUMsRUFDckMsYUFBc0IsRUFBVztVQUM5QixHQUFHLEdBQUksSUFBSSxDQUFDLFFBQVEsQ0FBcEIsR0FBRzs7QUFDUixhQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVTtxQkFDYixNQUFNO29CQUNQLGtCQUFrQjtvQkFDbEIsQ0FBQyxNQUFNLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFBRSxFQUFDLEdBQUcsRUFBSCxHQUFHLEVBQUMsQ0FBQztzQkFDekMsRUFBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUMsQ0FDOUMsQ0FBQztLQUNIOzs7V0FFb0IsaUNBQXFCO0FBQ3hDLGFBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVO3FCQUNiLE1BQU07b0JBQ1AsbUJBQW1CO29CQUNuQixFQUFFO3NCQUNBLEVBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDLENBQzlDLENBQUM7S0FDSDs7O1dBRUksaUJBQVU7QUFDYixVQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7QUFDakIsWUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUN0QixZQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztPQUN0QjtLQUNGOzs7U0EzYUcsYUFBYTs7O0FBOGFuQixTQUFTLFdBQVcsQ0FBQyxTQUFjLEVBQUU7QUFDbkMsTUFBSSxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUM7O0FBRTNCLE9BQUssQ0FBQyxHQUFHLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQztBQUMxQixPQUFLLENBQUMsSUFBSSxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUM7QUFDNUIsT0FBSyxDQUFDLEtBQUssR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDO0FBQzlCLE9BQUssQ0FBQyxHQUFHLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQztBQUMxQixPQUFLLENBQUMsR0FBRyxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUM7QUFDMUIsT0FBSyxDQUFDLElBQUksR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDO0FBQzVCLE9BQUssQ0FBQyxPQUFPLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQztBQUNsQyxPQUFLLENBQUMsR0FBRyxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUM7QUFDMUIsT0FBSyxDQUFDLElBQUksR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDO0FBQzVCLE9BQUssQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUNoQyxPQUFLLENBQUMsS0FBSyxHQUFHLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN4QyxPQUFLLENBQUMsS0FBSyxHQUFHLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN4QyxPQUFLLENBQUMsS0FBSyxHQUFHLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQzs7QUFFeEMsTUFBSSxTQUFTLENBQUMsU0FBUyxFQUFFO0FBQ3ZCLFNBQUssQ0FBQyxTQUFTLEdBQUcsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0dBQ2pEOztBQUVELFNBQU8sS0FBSyxDQUFDO0NBQ2Q7O0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRyxhQUFhLENBQUM7O0FBRS9CLFNBQVMscUJBQXFCLENBQUMsYUFBcUIsRUFBRTtBQUNwRCxTQUFPLE9BQU8sR0FBRyxhQUFhLENBQUM7Q0FDaEMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL251Y2xpZGUtcmVtb3RlLXByb2plY3RzL25vZGVfbW9kdWxlcy9udWNsaWRlLXJlbW90ZS1jb25uZWN0aW9uL25vZGVfbW9kdWxlcy9udWNsaWRlLXNlcnZlci9saWIvTnVjbGlkZUNsaWVudC5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbi8qKlxuICogVGhpcyBjb2RlIGltcGxlbWVudHMgdGhlIE51Y2xpZGVGcyBjbGllbnQuICBJdCB1c2VzIHRoZSByZXF1ZXN0IG1vZHVsZSB0b1xuICogbWFrZSBYSFIgcmVxdWVzdHMgdG8gdGhlIE51Y2xpZGVGUyBzZXJ2aWNlLiAgSXQgaXMgYSBQcm9taXNlIGJhc2VkIEFQSS5cbiAqL1xuXG52YXIgZnMgPSByZXF1aXJlKCdmcycpO1xudmFyIGV4dGVuZCA9IHJlcXVpcmUoJ3V0aWwnKS5fZXh0ZW5kO1xuXG50eXBlIEZpbGVXaXRoU3RhdHMgPSB7ZmlsZTogc3RyaW5nOyBzdGF0czogZnMuU3RhdHN9O1xudHlwZSBFeGVjUmVzdWx0ID0ge2Vycm9yOiA/RXJyb3I7IHN0ZG91dDogc3RyaW5nOyBzdGRlcnI6IHN0cmluZ307XG50eXBlIE51Y2xpZGVDbGllbnRPcHRpb25zID0ge1xuICBjd2Q6ID9zdHJpbmc7XG59O1xuXG5jbGFzcyBOdWNsaWRlQ2xpZW50IHtcbiAgY29uc3RydWN0b3IoaWQ6IHN0cmluZywgZXZlbnRidXMgOiBOdWNsaWRlRXZlbnRidXMsIG9wdGlvbnM6ID9OdWNsaWRlQ2xpZW50T3B0aW9ucyA9IHt9KSB7XG4gICAgdGhpcy5faWQgPSBpZDtcbiAgICB0aGlzLmV2ZW50YnVzID0gZXZlbnRidXM7XG4gICAgdGhpcy5fb3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5fc2VhcmNoUHJvdmlkZXJzID0ge307XG4gIH1cblxuICBnZXRJRCgpIHtcbiAgICByZXR1cm4gdGhpcy5faWQ7XG4gIH1cblxuICAvKipcbiAgICogUmVhZHMgYSBmaWxlIGZyb20gcmVtb3RlIEZTXG4gICAqXG4gICAqIEBwYXJhbSBwYXRoIHRoZSBwYXRoIHRvIHRoZSBmaWxlIHRvIHJlYWRcbiAgICogQHBhcmFtIG9wdGlvbnMgc2V0IG9mIG9wdGlvbnMgdGhhdCBhcmUgcGFzc2VkIHRvIGZzLmNyZWF0ZVJlYWRTdHJlYW0uXG4gICAqXG4gICAqIEl0IHJldHVybnMgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIGEgQnVmZmVyIHdpdGggdGhlIGZpbGUgY29udGVudHMuXG4gICAqL1xuICBhc3luYyByZWFkRmlsZShwYXRoOiBzdHJpbmcsIG9wdGlvbnM/OiB7fSk6IFByb21pc2U8QnVmZmVyPiB7XG4gICAgcmV0dXJuIHRoaXMuZXZlbnRidXMuY2FsbE1ldGhvZChcbiAgICAgIC8qc2VydmljZU5hbWUqLyAnZnMnLFxuICAgICAgLyptZXRob2ROYW1lKi8gJ3JlYWRGaWxlJyxcbiAgICAgIC8qbWV0aG9kQXJncyovIFtwYXRoLCBvcHRpb25zXVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogV3JpdGVzIGEgZmlsZSB0byB0aGUgcmVtb3RlIEZTXG4gICAqXG4gICAqIEBwYXJhbSBwYXRoIHRoZSBwYXRoIHRvIHRoZSBmaWxlIHRvIHJlYWRcbiAgICogQHBhcmFtIGRhdGEgYSBub2RlIGJ1ZmZlciBvZiB0aGUgZGF0YSB0byB3cml0ZSB0byBmaWxlXG4gICAqIEBwYXJhbSBvcHRpb25zIHNldCBvZiBvcHRpb25zIHRoYXQgYXJlIHBhc3NlZCB0byBmcy5jcmVhdGVSZWFkU3RyZWFtLlxuICAgKlxuICAgKiBJdCByZXR1cm5zIGEgdm9pZCBwcm9taXNlLlxuICAgKi9cbiAgd3JpdGVGaWxlKHBhdGg6IHN0cmluZywgZGF0YTogQnVmZmVyLCBvcHRpb25zPzoge30pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5ldmVudGJ1cy5jYWxsTWV0aG9kKFxuICAgICAgLypzZXJ2aWNlTmFtZSovICdmcycsXG4gICAgICAvKm1ldGhvZE5hbWUqLyAnd3JpdGVGaWxlJyxcbiAgICAgIC8qbWV0aG9kQXJncyovIFtwYXRoLCBvcHRpb25zXSxcbiAgICAgIC8qZXh0cmFPcHRpb25zKi8ge2JvZHk6IGRhdGEsIG1ldGhvZDogJ1BPU1QnfVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldywgZW1wdHkgZmlsZSBvbiB0aGUgcmVtb3RlIEZTLlxuICAgKlxuICAgKiBJZiBubyBmaWxlIChvciBkaXJlY3RvcnkpIGF0IHRoZSBzcGVjaWZpZWQgcGF0aCBleGlzdHMsIGNyZWF0ZXMgdGhlIHBhcmVudFxuICAgKiBkaXJlY3RvcmllcyAoaWYgbmVjZXNzYXJ5KSBhbmQgdGhlbiB3cml0ZXMgYW4gZW1wdHkgZmlsZSBhdCB0aGUgc3BlY2lmaWVkXG4gICAqIHBhdGguXG4gICAqXG4gICAqIEByZXR1cm4gQSBib29sZWFuIGluZGljYXRpbmcgd2hldGhlciB0aGUgZmlsZSB3YXMgY3JlYXRlZC5cbiAgICovXG4gIG5ld0ZpbGUocGF0aDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIHRoaXMuZXZlbnRidXMuY2FsbE1ldGhvZChcbiAgICAgIC8qc2VydmljZU5hbWUqLyAnZnMnLFxuICAgICAgLyptZXRob2ROYW1lKi8gJ25ld0ZpbGUnLFxuICAgICAgLyptZXRob2RBcmdzKi8gW3BhdGhdLFxuICAgICAgLypleHRyYU9wdGlvbnMqLyB7bWV0aG9kOiAnUE9TVCcsIGpzb246IHRydWV9XG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIGZzLlN0YXRzIHByb21pc2UgZnJvbSByZW1vdGUgRlNcbiAgICpcbiAgICogQHBhcmFtIHBhdGggdGhlIHBhdGggdG8gdGhlIGZpbGUvZGlyZWN0b3J5IHRvIGdldCBTdGF0cyBmb3JcbiAgICovXG4gIGFzeW5jIHN0YXQocGF0aDogc3RyaW5nKTogUHJvbWlzZTxmcy5TdGF0cz4ge1xuICAgIHZhciBib2R5ID0gYXdhaXQgdGhpcy5ldmVudGJ1cy5jYWxsTWV0aG9kKFxuICAgICAgLypzZXJ2aWNlTmFtZSovICdmcycsXG4gICAgICAvKm1ldGhvZE5hbWUqLyAnc3RhdCcsXG4gICAgICAvKm1ldGhvZEFyZ3MqLyBbcGF0aF0sXG4gICAgICAvKmV4dHJhT3B0aW9ucyovIHtqc29uOiB0cnVlfVxuICAgICk7XG4gICAgcmV0dXJuIGNyZWF0ZVN0YXRzKGJvZHkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBwcm9taXNtIHRoYXQgcmVzb2x2ZXMgdG8gYW4gYXJyYXkgb2ZcbiAgICoge2ZpbGU6ICduYW1lJywgc3RhdHM6IDxmcy5TdGF0cz59IGZyb20gcmVtb3RlIEZTXG4gICAqXG4gICAqIEBwYXJhbSBwYXRoIHRoZSBwYXRoIHRvIHRoZSBkaXJlY3RvcnkgdG8gZ2V0IGVudHJpZXMgZm9yXG4gICAqL1xuICBhc3luYyByZWFkZGlyKHBhdGg6IHN0cmluZyk6IFByb21pc2U8QXJyYXk8RmlsZVdpdGhTdGF0cz4+IHtcbiAgICB2YXIgYm9keSA9IGF3YWl0IHRoaXMuZXZlbnRidXMuY2FsbE1ldGhvZChcbiAgICAgIC8qc2VydmljZU5hbWUqLyAnZnMnLFxuICAgICAgLyptZXRob2ROYW1lKi8gJ3JlYWRkaXInLFxuICAgICAgLyptZXRob2RBcmdzKi8gW3BhdGhdLFxuICAgICAgLypleHRyYU9wdGlvbnMqLyB7anNvbjogdHJ1ZX1cbiAgICApO1xuICAgIHJldHVybiBib2R5Lm1hcCgoZW50cnkpID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGZpbGU6IGVudHJ5LmZpbGUsXG4gICAgICAgIHN0YXRzOiBjcmVhdGVTdGF0cyhlbnRyeS5zdGF0cyksXG4gICAgICAgIGlzU3ltYm9saWNMaW5rOiBlbnRyeS5pc1N5bWJvbGljTGluayxcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBmcy5TdGF0cyBwcm9taXNlIGZyb20gcmVtb3RlIEZTXG4gICAqXG4gICAqIEBwYXJhbSBwYXRoIHRoZSBwYXRoIHRvIHRoZSBmaWxlL2RpcmVjdG9yeSB0byBnZXQgU3RhdHMgZm9yXG4gICAqXG4gICAqIFNhbWUgYXMgc3RhdHMgY2FsbCBhYm92ZSBleGNlcHQgaXQgd2lsbCByZXR1cm4gdGhlIHN0YXRzIGZvciB0aGVcbiAgICogdW5kZXJseWluZyBmaWxlIGlmIGEgbGluayBpcyBwYXNzZWQuXG4gICAqL1xuICBhc3luYyBsc3RhdChwYXRoOiBzdHJpbmcpOiBQcm9taXNlPGZzLlN0YXRzPiB7XG4gICAgdmFyIGJvZHkgPSBhd2FpdCB0aGlzLmV2ZW50YnVzLmNhbGxNZXRob2QoXG4gICAgICAvKnNlcnZpY2VOYW1lKi8gJ2ZzJyxcbiAgICAgIC8qbWV0aG9kTmFtZSovICdsc3RhdCcsXG4gICAgICAvKm1ldGhvZEFyZ3MqLyBbcGF0aF0sXG4gICAgICAvKmV4dHJhT3B0aW9ucyovIHtqc29uOiB0cnVlfVxuICAgICk7XG4gICAgcmV0dXJuIGNyZWF0ZVN0YXRzKGJvZHkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBmb3IgZXhpc3RlbmNlIG9mIGEgZmlsZS9kaXJlY3RvcnkvbGluayBvbiBhIHJlbW90ZSBGU1xuICAgKlxuICAgKiBAcGFyYW0gcGF0aCB0aGUgcGF0aCB0byB0aGUgZmlsZS9kaXJlY3RvcnkgdG8gY2hlY2sgZm9yIGV4aXN0ZW5jZVxuICAgKlxuICAgKiBJdCByZXR1cm5zIHByb21pc2UgdGhhdCByZXNvbHZlIHRvIHRydWUgaWYgZmlsZSBleGlzdHMsIGZhbHNlIG90aGVyd2lzZS5cbiAgICovXG4gIGV4aXN0cyhwYXRoOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gdGhpcy5ldmVudGJ1cy5jYWxsTWV0aG9kKFxuICAgICAgLypzZXJ2aWNlTmFtZSovICdmcycsXG4gICAgICAvKm1ldGhvZE5hbWUqLyAnZXhpc3RzJyxcbiAgICAgIC8qbWV0aG9kQXJncyovIFtwYXRoXSxcbiAgICAgIC8qZXh0cmFPcHRpb25zKi8ge2pzb246IHRydWV9XG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSByZWFsIHBhdGggb2YgYSBmaWxlIHBhdGguXG4gICAqIEl0IGNvdWxkIGJlIGRpZmZlcmVudCB0aGFuIHRoZSBnaXZlbiBwYXRoIGlmIHRoZSBmaWxlIGlzIGEgc3ltbGlua1xuICAgKiBvciBleGlzdHMgaW4gYSBzeW1saW5rZWQgZGlyZWN0b3J5LlxuICAgKi9cbiAgcmVhbHBhdGgocGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gdGhpcy5ldmVudGJ1cy5jYWxsTWV0aG9kKFxuICAgICAgLypzZXJ2aWNlTmFtZSovICdmcycsXG4gICAgICAvKm1ldGhvZE5hbWUqLyAncmVhbHBhdGgnLFxuICAgICAgLyptZXRob2RBcmdzKi8gW3BhdGhdXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW5hbWUgYSBmaWxlIG9yIGZvbGRlci5cbiAgICovXG4gIHJlbmFtZShzb3VyY2VQYXRoOiBzdHJpbmcsIGRlc3RpbmF0aW9uUGF0aDogc3RyaW5nKTogUHJvbWlzZSB7XG4gICAgcmV0dXJuIHRoaXMuZXZlbnRidXMuY2FsbE1ldGhvZChcbiAgICAgIC8qc2VydmljZU5hbWUqLyAnZnMnLFxuICAgICAgLyptZXRob2ROYW1lKi8gJ3JlbmFtZScsXG4gICAgICAvKm1ldGhvZEFyZ3MqLyBbc291cmNlUGF0aCwgZGVzdGluYXRpb25QYXRoXSxcbiAgICAgIC8qZXh0cmFPcHRpb25zKi8ge21ldGhvZDogJ1BPU1QnfVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBkaXJlY3Rvcnkgd2l0aCB0aGUgZ2l2ZW4gcGF0aC5cbiAgICogVGhyb3dzIEVFWElTVCBlcnJvciBpZiB0aGUgZGlyZWN0b3J5IGFscmVhZHkgZXhpc3RzLlxuICAgKiBUaHJvd3MgRU5PRU5UIGlmIHRoZSBwYXRoIGdpdmVuIGlzIG5lc3RlZCBpbiBhIG5vbi1leGlzdGluZyBkaXJlY3RvcnkuXG4gICAqL1xuICBta2RpcihwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiB0aGlzLmV2ZW50YnVzLmNhbGxNZXRob2QoXG4gICAgICAvKnNlcnZpY2VOYW1lKi8gJ2ZzJyxcbiAgICAgIC8qbWV0aG9kTmFtZSovICdta2RpcicsXG4gICAgICAvKm1ldGhvZEFyZ3MqLyBbcGF0aF0sXG4gICAgICAvKmV4dHJhT3B0aW9ucyovIHttZXRob2Q6ICdQT1NUJ31cbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJ1bnMgdGhlIGVxdWl2YWxlbnQgb2YgYG1rZGlyIC1wYCB3aXRoIHRoZSBnaXZlbiBwYXRoLlxuICAgKlxuICAgKiBMaWtlIG1vc3QgaW1wbGVtZW50YXRpb25zIG9mIG1rZGlycCwgaWYgaXQgZmFpbHMsIGl0IGlzIHBvc3NpYmxlIHRoYXRcbiAgICogZGlyZWN0b3JpZXMgd2VyZSBjcmVhdGVkIGZvciBzb21lIHByZWZpeCBvZiB0aGUgZ2l2ZW4gcGF0aC5cbiAgICogQHJldHVybiB0cnVlIGlmIHRoZSBwYXRoIHdhcyBjcmVhdGVkOyBmYWxzZSBpZiBpdCBhbHJlYWR5IGV4aXN0ZWQuXG4gICAqL1xuICBta2RpcnAocGF0aDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIHRoaXMuZXZlbnRidXMuY2FsbE1ldGhvZChcbiAgICAgIC8qc2VydmljZU5hbWUqLyAnZnMnLFxuICAgICAgLyptZXRob2ROYW1lKi8gJ21rZGlycCcsXG4gICAgICAvKm1ldGhvZEFyZ3MqLyBbcGF0aF0sXG4gICAgICAvKmV4dHJhT3B0aW9ucyovIHttZXRob2Q6ICdQT1NUJywganNvbjogdHJ1ZX1cbiAgICApO1xuICB9XG5cbiAgLypcbiAgICogUmVtb3ZlcyBkaXJlY3RvcmllcyBldmVuIGlmIHRoZXkgYXJlIG5vbi1lbXB0eS4gRG9lcyBub3QgZmFpbCBpZiB0aGUgZGlyZWN0b3J5IGRvZXNuJ3QgZXhpc3QuXG4gICAqL1xuICBybWRpcihwYXRoOiBzdHJpbmcpOiBQcm9taXNlIHtcbiAgICByZXR1cm4gdGhpcy5ldmVudGJ1cy5jYWxsTWV0aG9kKFxuICAgICAgLypzZXJ2aWNlTmFtZSovICdmcycsXG4gICAgICAvKm1ldGhvZE5hbWUqLyAncm1kaXInLFxuICAgICAgLyptZXRob2RBcmdzKi8gW3BhdGhdLFxuICAgICAgLypleHRyYU9wdGlvbnMqLyB7bWV0aG9kOiAnUE9TVCcsIGpzb246IHRydWV9XG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGZpbGVzLiBEb2VzIG5vdCBmYWlsIGlmIHRoZSBmaWxlIGRvZXNuJ3QgZXhpc3QuXG4gICAqL1xuICB1bmxpbmsocGF0aDogc3RyaW5nKTogUHJvbWlzZSB7XG4gICAgcmV0dXJuIHRoaXMuZXZlbnRidXMuY2FsbE1ldGhvZChcbiAgICAgIC8qc2VydmljZU5hbWUqLyAnZnMnLFxuICAgICAgLyptZXRob2ROYW1lKi8gJ3VubGluaycsXG4gICAgICAvKm1ldGhvZEFyZ3MqLyBbcGF0aF0sXG4gICAgICAvKmV4dHJhT3B0aW9ucyovIHttZXRob2Q6ICdQT1NUJywganNvbjogdHJ1ZX1cbiAgICApO1xuICB9XG5cbiAgZmluZE5lYXJlc3RGaWxlKGZpbGVOYW1lOiBzdHJpbmcsIHBhdGhUb0RpcmVjdG9yeTogc3RyaW5nKTogUHJvbWlzZTw/c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMuZXZlbnRidXMuY2FsbE1ldGhvZChcbiAgICAgIC8qc2VydmljZU5hbWUqLyAnZnMnLFxuICAgICAgLyptZXRob2ROYW1lKi8gJ2ZpbmROZWFyZXN0RmlsZScsXG4gICAgICAvKm1ldGhvZEFyZ3MqLyBbZmlsZU5hbWUsIHBhdGhUb0RpcmVjdG9yeV0sXG4gICAgICAvKmV4dHJhT3B0aW9ucyovIHtqc29uOiB0cnVlfVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogTWFrZSBycGMgY2FsbCB0byBzZXJ2aWNlIGdpdmVuIHNlcnZpY2VVcmkgaW4gZm9ybSBvZiBgJHNlcnZpY2VOYW1lLyRtZXRob2ROYW1lYCBhbmQgYXJncyBhcyBhcmd1bWVudHMgbGlzdC5cbiAgICovXG4gIG1ha2VScGMoc2VydmljZVVyaTogc3RyaW5nLCBhcmdzOiBBcnJheTxhbnk+LCBzZXJ2aWNlT3B0aW9uczogYW55KTogUHJvbWlzZTxhbnk+IHtcbiAgICB2YXIgW3NlcnZpY2VOYW1lLCBtZXRob2ROYW1lXSA9IHNlcnZpY2VVcmkuc3BsaXQoJy8nKTtcbiAgICByZXR1cm4gdGhpcy5ldmVudGJ1cy5jYWxsU2VydmljZUZyYW1ld29ya01ldGhvZChcbiAgICAgIHNlcnZpY2VOYW1lLFxuICAgICAgbWV0aG9kTmFtZSxcbiAgICAgIC8qIG1ldGhvZEFyZ3MgKi8gYXJncyxcbiAgICAgIC8qIHNlcnZpY2VPcHRpb25zICovIHNlcnZpY2VPcHRpb25zXG4gICApO1xuICB9XG5cbiAgcmVnaXN0ZXJFdmVudExpc3RlbmVyKGV2ZW50TmFtZTogc3RyaW5nLCBjYWxsYmFjazogKC4uLmFyZ3M6IEFycmF5PGFueT4pID0+IHZvaWQsIHNlcnZpY2VPcHRpb25zOiBhbnkpOiBEaXNwb3NhYmxlIHtcbiAgICByZXR1cm4gdGhpcy5ldmVudGJ1cy5yZWdpc3RlckV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBjYWxsYmFjaywgc2VydmljZU9wdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlYXJjaGVzIHRoZSBjb250ZW50cyBvZiBgZGlyZWN0b3J5YCBmb3IgcGF0aHMgbWF0aGluZyBgcXVlcnlgLlxuICAgKi9cbiAgYXN5bmMgc2VhcmNoRGlyZWN0b3J5KGRpcmVjdG9yeTogc3RyaW5nLCBxdWVyeTogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5ldmVudGJ1cy5jYWxsTWV0aG9kKFxuICAgICAgLypzZXJ2aWNlTmFtZSovICdzZWFyY2gnLFxuICAgICAgLyptZXRob2ROYW1lKi8gJ2RpcmVjdG9yeScsXG4gICAgICAvKm1ldGhvZEFyZ3MqLyBbZGlyZWN0b3J5LCBxdWVyeV0sXG4gICAgICAvKmV4dHJhT3B0aW9ucyovIHtqc29uOiB0cnVlfVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgc2VydmVyIHZlcnNpb24uXG4gICAqL1xuICB2ZXJzaW9uKCk6IFByb21pc2U8bnVtYmVyfHN0cmluZz4ge1xuICAgIHJldHVybiB0aGlzLmV2ZW50YnVzLmNhbGxNZXRob2QoXG4gICAgICAvKnNlcnZpY2VOYW1lKi8gJ3NlcnZlcicsXG4gICAgICAvKm1ldGhvZE5hbWUqLyAndmVyc2lvbicsXG4gICAgICAvKm1ldGhvZEFyZ3MqLyBbXSxcbiAgICAgIC8qZXh0cmFPcHRpb25zKi8ge21ldGhvZDogJ1BPU1QnLCBqc29uOiB0cnVlfVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgc2VydmVyIHZlcnNpb24uXG4gICAqL1xuICBzaHV0ZG93blNlcnZlcigpOiBQcm9taXNlIHtcbiAgICByZXR1cm4gdGhpcy5ldmVudGJ1cy5jYWxsTWV0aG9kKFxuICAgICAgLypzZXJ2aWNlTmFtZSovICdzZXJ2ZXInLFxuICAgICAgLyptZXRob2ROYW1lKi8gJ3NodXRkb3duJyxcbiAgICAgIC8qbWV0aG9kQXJncyovIFtdLFxuICAgICAgLypleHRyYU9wdGlvbnMqLyB7bWV0aG9kOiAnUE9TVCd9XG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIHdhdGNoRmlsZShmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxGc1dhdGNoZXI+IHtcbiAgICB2YXIgd2F0Y2hlcklkID0gYXdhaXQgdGhpcy5ldmVudGJ1cy5jYWxsTWV0aG9kKFxuICAgICAgLypzZXJ2aWNlTmFtZSovICd3YXRjaGVyJyxcbiAgICAgIC8qbWV0aG9kTmFtZSovICd3YXRjaEZpbGUnLFxuICAgICAgLyptZXRob2RBcmdzKi8gW2ZpbGVQYXRoXSxcbiAgICAgIC8qZXh0cmFPcHRpb25zKi8ge21ldGhvZDogJ1BPU1QnLCBqc29uOiB0cnVlfVxuICAgICk7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZXZlbnRidXMuY29uc3VtZUV2ZW50RW1pdHRlcih3YXRjaGVySWQsIFsnY2hhbmdlJywgJ3JlbmFtZScsICdkZWxldGUnXSk7XG4gIH1cblxuICBhc3luYyB3YXRjaERpcmVjdG9yeShkaXJlY3RvcnlQYXRoOiBzdHJpbmcpOiBQcm9taXNlPEZzV2F0Y2hlcj4ge1xuICAgIHZhciB3YXRjaGVySWQgPSBhd2FpdCB0aGlzLmV2ZW50YnVzLmNhbGxNZXRob2QoXG4gICAgICAvKnNlcnZpY2VOYW1lKi8gJ3dhdGNoZXInLFxuICAgICAgLyptZXRob2ROYW1lKi8gJ3dhdGNoRGlyZWN0b3J5JyxcbiAgICAgIC8qbWV0aG9kQXJncyovIFtkaXJlY3RvcnlQYXRoXSxcbiAgICAgIC8qZXh0cmFPcHRpb25zKi8ge21ldGhvZDogJ1BPU1QnLCBqc29uOiB0cnVlfVxuICAgICk7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZXZlbnRidXMuY29uc3VtZUV2ZW50RW1pdHRlcih3YXRjaGVySWQsIFsnY2hhbmdlJ10pO1xuICB9XG5cbiAgYXN5bmMgd2F0Y2hEaXJlY3RvcnlSZWN1cnNpdmUoZGlyZWN0b3J5UGF0aDogc3RyaW5nLCBoYW5kbGVyOiAobnVtYmVyT2ZDaGFuZ2VzOiBudW1iZXIpID0+IHZvaWQpIHtcbiAgICB2YXIgd2F0Y2hDaGFubmVsID0gd2F0Y2hEaXJlY3RvcnlDaGFubmVsKGRpcmVjdG9yeVBhdGgpO1xuICAgIGF3YWl0IHRoaXMuZXZlbnRidXMuc3Vic2NyaWJlVG9DaGFubmVsKHdhdGNoQ2hhbm5lbCwgaGFuZGxlcik7XG4gICAgYXdhaXQgdGhpcy5ldmVudGJ1cy5jYWxsTWV0aG9kKFxuICAgICAgLypzZXJ2aWNlTmFtZSovICd3YXRjaGVyJyxcbiAgICAgIC8qbWV0aG9kTmFtZSovICd3YXRjaERpcmVjdG9yeVJlY3Vyc2l2ZScsXG4gICAgICAvKm1ldGhvZEFyZ3MqLyBbZGlyZWN0b3J5UGF0aCwgd2F0Y2hDaGFubmVsXSxcbiAgICAgIC8qZXh0cmFPcHRpb25zKi8ge21ldGhvZDogJ1BPU1QnLCBqc29uOiB0cnVlfVxuICAgICk7XG4gIH1cblxuICB1bndhdGNoRmlsZShmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZSB7XG4gICAgcmV0dXJuIHRoaXMuZXZlbnRidXMuY2FsbE1ldGhvZChcbiAgICAgIC8qc2VydmljZU5hbWUqLyAnd2F0Y2hlcicsXG4gICAgICAvKm1ldGhvZE5hbWUqLyAndW53YXRjaEZpbGUnLFxuICAgICAgLyptZXRob2RBcmdzKi8gW2ZpbGVQYXRoXSxcbiAgICAgIC8qZXh0cmFPcHRpb25zKi8ge21ldGhvZDogJ1BPU1QnLCBqc29uOiB0cnVlfVxuICAgICk7XG4gIH1cblxuICB1bndhdGNoRGlyZWN0b3J5KGRpcmVjdG9yeVBhdGg6IHN0cmluZyk6IFByb21pc2Uge1xuICAgIHJldHVybiB0aGlzLmV2ZW50YnVzLmNhbGxNZXRob2QoXG4gICAgICAvKnNlcnZpY2VOYW1lKi8gJ3dhdGNoZXInLFxuICAgICAgLyptZXRob2ROYW1lKi8gJ3Vud2F0Y2hEaXJlY3RvcnknLFxuICAgICAgLyptZXRob2RBcmdzKi8gW2RpcmVjdG9yeVBhdGhdLFxuICAgICAgLypleHRyYU9wdGlvbnMqLyB7bWV0aG9kOiAnUE9TVCcsIGpzb246IHRydWV9XG4gICAgKTtcbiAgfVxuXG4gIHVud2F0Y2hEaXJlY3RvcnlSZWN1cnNpdmUoZGlyZWN0b3J5UGF0aDogc3RyaW5nKTogUHJvbWlzZSB7XG4gICAgcmV0dXJuIHRoaXMuZXZlbnRidXMuY2FsbE1ldGhvZChcbiAgICAgIC8qc2VydmljZU5hbWUqLyAnd2F0Y2hlcicsXG4gICAgICAvKm1ldGhvZE5hbWUqLyAndW53YXRjaERpcmVjdG9yeVJlY3Vyc2l2ZScsXG4gICAgICAvKm1ldGhvZEFyZ3MqLyBbZGlyZWN0b3J5UGF0aF0sXG4gICAgICAvKmV4dHJhT3B0aW9ucyovIHttZXRob2Q6ICdQT1NUJywganNvbjogdHJ1ZX1cbiAgICApO1xuICB9XG5cbiAgZG9TZWFyY2hRdWVyeShyb290RGlyZWN0b3J5OnN0cmluZywgcHJvdmlkZXI6IHN0cmluZywgcXVlcnk6IHN0cmluZyk6IFByb21pc2Uge1xuICAgIHJldHVybiB0aGlzLmV2ZW50YnVzLmNhbGxNZXRob2QoXG4gICAgICAvKnNlcnZpY2VOYW1lKi8gJ3NlYXJjaCcsXG4gICAgICAvKm1ldGhvZE5hbWUqLyAncXVlcnknLFxuICAgICAgLyptZXRob2RBcmdzKi8gW3Jvb3REaXJlY3RvcnksIHByb3ZpZGVyLCBxdWVyeV0sXG4gICAgICAvKmV4dHJhT3B0aW9ucyovIHttZXRob2Q6ICdQT1NUJywganNvbjogdHJ1ZX1cbiAgICApO1xuICB9XG5cbiAgYXN5bmMgZ2V0U2VhcmNoUHJvdmlkZXJzKHJvb3REaXJlY3Rvcnk6IHN0cmluZyk6IFByb21pc2U8QXJyYXk8e25hbWU6c3RyaW5nfT4+IHtcbiAgICB2YXIgcHJvdmlkZXJzID0gdGhpcy5fc2VhcmNoUHJvdmlkZXJzW3Jvb3REaXJlY3RvcnldO1xuICAgIGlmIChwcm92aWRlcnMpIHtcbiAgICAgIHJldHVybiBwcm92aWRlcnM7XG4gICAgfVxuICAgIHByb3ZpZGVycyA9IGF3YWl0IHRoaXMuZXZlbnRidXMuY2FsbE1ldGhvZChcbiAgICAgIC8qc2VydmljZU5hbWUqLyAnc2VhcmNoJyxcbiAgICAgIC8qbWV0aG9kTmFtZSovICdsaXN0UHJvdmlkZXJzJyxcbiAgICAgIC8qbWV0aG9kQXJncyovIFtyb290RGlyZWN0b3J5XSxcbiAgICAgIC8qZXh0cmFPcHRpb25zKi8ge21ldGhvZDogJ1BPU1QnLCBqc29uOiB0cnVlfVxuICAgICk7XG5cbiAgICB0aGlzLl9zZWFyY2hQcm92aWRlcnNbcm9vdERpcmVjdG9yeV0gPSBwcm92aWRlcnM7XG5cbiAgICByZXR1cm4gcHJvdmlkZXJzO1xuICB9XG5cbiAgZ2V0SGFja0RpYWdub3N0aWNzKCk6IFByb21pc2Uge1xuICAgIHZhciB7Y3dkfSA9IHRoaXMuX29wdGlvbnM7XG4gICAgcmV0dXJuIHRoaXMuZXZlbnRidXMuY2FsbE1ldGhvZChcbiAgICAgIC8qc2VydmljZU5hbWUqLyAnaGFjaycsXG4gICAgICAvKm1ldGhvZE5hbWUqLyAnZ2V0RGlhZ25vc3RpY3MnLFxuICAgICAgLyptZXRob2RBcmdzKi8gW3tjd2R9XSxcbiAgICAgIC8qZXh0cmFPcHRpb25zKi8ge21ldGhvZDogJ1BPU1QnLCBqc29uOiB0cnVlfVxuICAgICk7XG4gIH1cblxuICBnZXRIYWNrQ29tcGxldGlvbnMocXVlcnk6IHN0cmluZyk6IFByb21pc2Uge1xuICAgIHZhciB7Y3dkfSA9IHRoaXMuX29wdGlvbnM7XG4gICAgcmV0dXJuIHRoaXMuZXZlbnRidXMuY2FsbE1ldGhvZChcbiAgICAgIC8qc2VydmljZU5hbWUqLyAnaGFjaycsXG4gICAgICAvKm1ldGhvZE5hbWUqLyAnZ2V0Q29tcGxldGlvbnMnLFxuICAgICAgLyptZXRob2RBcmdzKi8gW3F1ZXJ5LCB7Y3dkfV0sXG4gICAgICAvKmV4dHJhT3B0aW9ucyovIHttZXRob2Q6ICdQT1NUJywganNvbjogdHJ1ZX1cbiAgICApO1xuICB9XG5cbiAgZ2V0SGFja0RlZmluaXRpb24ocXVlcnk6IHN0cmluZywgc3ltYm9sVHlwZTogU3ltYm9sVHlwZSk6IFByb21pc2Uge1xuICAgIHZhciB7Y3dkfSA9IHRoaXMuX29wdGlvbnM7XG4gICAgcmV0dXJuIHRoaXMuZXZlbnRidXMuY2FsbE1ldGhvZChcbiAgICAgIC8qc2VydmljZU5hbWUqLyAnaGFjaycsXG4gICAgICAvKm1ldGhvZE5hbWUqLyAnZ2V0RGVmaW5pdGlvbicsXG4gICAgICAvKm1ldGhvZEFyZ3MqLyBbcXVlcnksIHN5bWJvbFR5cGUsIHtjd2R9XSxcbiAgICAgIC8qZXh0cmFPcHRpb25zKi8ge21ldGhvZDogJ1BPU1QnLCBqc29uOiB0cnVlfVxuICAgICk7XG4gIH1cblxuICBnZXRIYWNrRGVwZW5kZW5jaWVzKGRlcGVuZGVuY2llc0luZm86IEFycmF5PHtuYW1lOiBzdHJpbmc7IHR5cGU6IHN0cmluZ30+KTogUHJvbWlzZTxhbnk+IHtcbiAgICB2YXIge2N3ZH0gPSB0aGlzLl9vcHRpb25zO1xuICAgIHJldHVybiB0aGlzLmV2ZW50YnVzLmNhbGxNZXRob2QoXG4gICAgICAvKnNlcnZpY2VOYW1lKi8gJ2hhY2snLFxuICAgICAgLyptZXRob2ROYW1lKi8gJ2dldERlcGVuZGVuY2llcycsXG4gICAgICAvKm1ldGhvZEFyZ3MqLyBbZGVwZW5kZW5jaWVzSW5mbywge2N3ZH1dLFxuICAgICAgLypleHRyYU9wdGlvbnMqLyB7bWV0aG9kOiAnUE9TVCcsIGpzb246IHRydWV9XG4gICAgKTtcbiAgfVxuXG4gIGdldEhhY2tTZWFyY2hSZXN1bHRzKFxuICAgICAgc2VhcmNoOiBzdHJpbmcsXG4gICAgICBmaWx0ZXJUeXBlczogP0FycmF5PFNlYXJjaFJlc3VsdFR5cGU+LFxuICAgICAgc2VhcmNoUG9zdGZpeDogP3N0cmluZyk6IFByb21pc2Uge1xuICAgIHZhciB7Y3dkfSA9IHRoaXMuX29wdGlvbnM7XG4gICAgcmV0dXJuIHRoaXMuZXZlbnRidXMuY2FsbE1ldGhvZChcbiAgICAgIC8qc2VydmljZU5hbWUqLyAnaGFjaycsXG4gICAgICAvKm1ldGhvZE5hbWUqLyAnZ2V0U2VhcmNoUmVzdWx0cycsXG4gICAgICAvKm1ldGhvZEFyZ3MqLyBbc2VhcmNoLCBmaWx0ZXJUeXBlcywgc2VhcmNoUG9zdGZpeCwge2N3ZH1dLFxuICAgICAgLypleHRyYU9wdGlvbnMqLyB7bWV0aG9kOiAnUE9TVCcsIGpzb246IHRydWV9XG4gICAgKTtcbiAgfVxuXG4gIGlzSGFja0NsaWVudEF2YWlsYWJsZSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gdGhpcy5ldmVudGJ1cy5jYWxsTWV0aG9kKFxuICAgICAgLypzZXJ2aWNlTmFtZSovICdoYWNrJyxcbiAgICAgIC8qbWV0aG9kTmFtZSovICdpc0NsaWVudEF2YWlsYWJsZScsXG4gICAgICAvKm1ldGhvZEFyZ3MqLyBbXSxcbiAgICAgIC8qZXh0cmFPcHRpb25zKi8ge21ldGhvZDogJ1BPU1QnLCBqc29uOiB0cnVlfVxuICAgICk7XG4gIH1cblxuICBjbG9zZSgpIDogdm9pZCB7XG4gICAgaWYgKHRoaXMuZXZlbnRidXMpIHtcbiAgICAgIHRoaXMuZXZlbnRidXMuY2xvc2UoKTtcbiAgICAgIHRoaXMuZXZlbnRidXMgPSBudWxsO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVTdGF0cyhqc29uU3RhdHM6IGFueSkge1xuICB2YXIgc3RhdHMgPSBuZXcgZnMuU3RhdHMoKTtcblxuICBzdGF0cy5kZXYgPSBqc29uU3RhdHMuZGV2O1xuICBzdGF0cy5tb2RlID0ganNvblN0YXRzLm1vZGU7XG4gIHN0YXRzLm5saW5rID0ganNvblN0YXRzLm5saW5rO1xuICBzdGF0cy51aWQgPSBqc29uU3RhdHMudWlkO1xuICBzdGF0cy5naWQgPSBqc29uU3RhdHMuZ2lkO1xuICBzdGF0cy5yZGV2ID0ganNvblN0YXRzLnJkZXY7XG4gIHN0YXRzLmJsa3NpemUgPSBqc29uU3RhdHMuYmxrc2l6ZTtcbiAgc3RhdHMuaW5vID0ganNvblN0YXRzLmlubztcbiAgc3RhdHMuc2l6ZSA9IGpzb25TdGF0cy5zaXplO1xuICBzdGF0cy5ibG9ja3MgPSBqc29uU3RhdHMuYmxvY2tzO1xuICBzdGF0cy5hdGltZSA9IG5ldyBEYXRlKGpzb25TdGF0cy5hdGltZSk7XG4gIHN0YXRzLm10aW1lID0gbmV3IERhdGUoanNvblN0YXRzLm10aW1lKTtcbiAgc3RhdHMuY3RpbWUgPSBuZXcgRGF0ZShqc29uU3RhdHMuY3RpbWUpO1xuXG4gIGlmIChqc29uU3RhdHMuYmlydGh0aW1lKSB7XG4gICAgc3RhdHMuYmlydGh0aW1lID0gbmV3IERhdGUoanNvblN0YXRzLmJpcnRodGltZSk7XG4gIH1cblxuICByZXR1cm4gc3RhdHM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTnVjbGlkZUNsaWVudDtcblxuZnVuY3Rpb24gd2F0Y2hEaXJlY3RvcnlDaGFubmVsKGRpcmVjdG9yeVBhdGg6IHN0cmluZykge1xuICByZXR1cm4gJ3dhdGNoJyArIGRpcmVjdG9yeVBhdGg7XG59XG4iXX0=