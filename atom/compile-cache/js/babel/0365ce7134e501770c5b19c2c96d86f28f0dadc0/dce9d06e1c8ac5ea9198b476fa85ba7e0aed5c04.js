'use babel';

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

var path = require('path');
var url = require('url');

var _require = require('atom');

var Disposable = _require.Disposable;
var Emitter = _require.Emitter;

var logger = require('nuclide-logging').getLogger();

var MARKER_PROPERTY_FOR_REMOTE_DIRECTORY = '__nuclide_remote_directory__';

/* Mostly implements https://atom.io/docs/api/latest/Directory */

var RemoteDirectory = (function () {

  /**
   * @param uri should be of the form "nuclide://example.com:9090/path/to/directory".
   */

  function RemoteDirectory(remote, uri, options) {
    _classCallCheck(this, RemoteDirectory);

    Object.defineProperty(this, MARKER_PROPERTY_FOR_REMOTE_DIRECTORY, { value: true });
    this._remote = remote;
    this._uri = uri;
    this._emitter = new Emitter();
    this._subscriptionCount = 0;

    var _url$parse = url.parse(uri);

    var directoryPath = _url$parse.path;
    var protocol = _url$parse.protocol;
    var host = _url$parse.host;

    /** In the example, this would be "nuclide://example.com:9090". */
    this._host = protocol + '//' + host;
    /** In the example, this would be "/path/to/directory". */
    this._localPath = directoryPath;
    // A workaround before Atom 2.0: see ::getHgRepoInfo of main.js.
    this._hgRepositoryDescription = options ? options.hgRepositoryDescription : null;
  }

  _createClass(RemoteDirectory, [{
    key: 'onDidChange',
    value: function onDidChange(callback) {
      this._willAddSubscription();
      return this._trackUnsubscription(this._emitter.on('did-change', callback));
    }
  }, {
    key: '_willAddSubscription',
    value: _asyncToGenerator(function* () {
      this._subscriptionCount++;
      if (this._pendingSubscription) {
        return;
      }
      this._pendingSubscription = true;
      try {
        yield this._subscribeToNativeChangeEvents();
      } catch (err) {
        logger.error('Failed to subscribe RemoteDirectory:', this._localPath, err);
      } finally {
        this._pendingSubscription = false;
      }
    })
  }, {
    key: '_subscribeToNativeChangeEvents',
    value: _asyncToGenerator(function* () {
      var _this = this;

      if (this._watchSubscription) {
        return;
      }
      this._watchSubscription = yield this._remote.getClient().watchDirectory(this._localPath);
      this._watchSubscription.on('change', function (change) {
        return _this._handleNativeChangeEvent(change);
      });
    })
  }, {
    key: '_handleNativeChangeEvent',
    value: function _handleNativeChangeEvent(changes) {
      this._emitter.emit('did-change', changes);
    }
  }, {
    key: '_trackUnsubscription',
    value: function _trackUnsubscription(subscription) {
      var _this2 = this;

      return new Disposable(function () {
        subscription.dispose();
        _this2._didRemoveSubscription();
      });
    }
  }, {
    key: '_didRemoveSubscription',
    value: function _didRemoveSubscription() {
      this._subscriptionCount--;
      if (this._subscriptionCount === 0) {
        return this._unsubscribeFromNativeChangeEvents();
      }
    }
  }, {
    key: '_unsubscribeFromNativeChangeEvents',
    value: _asyncToGenerator(function* () {
      if (this._watchSubscription) {
        yield this._remote.getClient().unwatchDirectory(this._localPath);
        this._watchSubscription = null;
      }
    })
  }, {
    key: 'isFile',
    value: function isFile() {
      return false;
    }
  }, {
    key: 'isDirectory',
    value: function isDirectory() {
      return true;
    }
  }, {
    key: 'isRoot',
    value: function isRoot() {
      return this._isRoot(this._localPath);
    }
  }, {
    key: '_isRoot',
    value: function _isRoot(filePath) {
      filePath = path.normalize(filePath);
      var parts = path.parse(filePath);
      return parts.root === filePath;
    }
  }, {
    key: 'getPath',
    value: function getPath() {
      return this._uri;
    }
  }, {
    key: 'getLocalPath',
    value: function getLocalPath() {
      return this._localPath;
    }
  }, {
    key: 'getHost',
    value: function getHost() {
      return this._host;
    }
  }, {
    key: 'getRealPathSync',
    value: function getRealPathSync() {
      throw new Error('Not implemented');
    }
  }, {
    key: 'getBaseName',
    value: function getBaseName() {
      return path.basename(this._localPath);
    }
  }, {
    key: 'relativize',
    value: function relativize(uri) {
      if (!uri) {
        return uri;
      }
      // Note: host of uri must match this._host.
      var subpath = url.parse(uri).path;
      return path.relative(this._localPath, subpath);
    }
  }, {
    key: 'getParent',
    value: function getParent() {
      if (this.isRoot()) {
        return this;
      } else {
        var uri = this._host + path.normalize(path.join(this._localPath, '..'));
        return this._remote.createDirectory(uri);
      }
    }
  }, {
    key: 'getFile',
    value: function getFile(filename) {
      var uri = this._host + path.join(this._localPath, filename);
      return this._remote.createFile(uri);
    }
  }, {
    key: 'getSubdirectory',
    value: function getSubdirectory(dirname) {
      var uri = this._host + path.join(this._localPath, dirname);
      return this._remote.createDirectory(uri);
    }
  }, {
    key: 'create',
    value: _asyncToGenerator(function* () {
      yield this._remote.getClient().mkdirp(this._localPath);
      if (this._subscriptionCount > 0) {
        this._subscribeToNativeChangeEvents();
      }
    })
  }, {
    key: 'delete',
    value: _asyncToGenerator(function* () {
      yield this._remote.getClient().rmdir(this._localPath);
      this._unsubscribeFromNativeChangeEvents();
    })
  }, {
    key: 'rename',

    /**
     * Renames this directory to the given absolute path.
     */
    value: _asyncToGenerator(function* (newPath) {
      yield this._remote.getClient().rename(this._localPath, newPath);

      // Unsubscribe from the old `this._localPath`. This must be done before
      // setting the new `this._localPath`.
      yield this._unsubscribeFromNativeChangeEvents();

      var _url$parse2 = url.parse(this._uri);

      var protocol = _url$parse2.protocol;
      var host = _url$parse2.host;

      this._localPath = newPath;
      this._uri = protocol + '//' + host + this._localPath;

      // Subscribe to changes for the new `this._localPath`. This must be done
      // after setting the new `this._localPath`.
      if (this._subscriptionCount > 0) {
        yield this._subscribeToNativeChangeEvents();
      }
    })
  }, {
    key: 'getEntriesSync',
    value: function getEntriesSync() {
      throw new Error('not implemented');
    }
  }, {
    key: 'getEntries',
    value: _asyncToGenerator(function* (callback) {
      var _this3 = this;

      var entries = yield this._remote.getClient().readdir(this._localPath);
      var directories = [];
      var files = [];
      entries.sort(function (a, b) {
        return a.file.toLowerCase().localeCompare(b.file.toLowerCase());
      }).forEach(function (entry) {
        var uri = _this3._host + path.join(_this3._localPath, entry.file);
        if (entry.stats.isFile()) {
          files.push(_this3._remote.createFile(uri));
        } else {
          directories.push(_this3._remote.createDirectory(uri));
        }
      });
      callback(null, directories.concat(files));
    })
  }, {
    key: 'contains',
    value: function contains(pathToCheck) {
      // Ideally, the type of pathToCheck would be `string` rather than `?string`;
      // however, as shown by https://github.com/atom/git-diff/pull/53,
      // `editor.getPath()` unexpectedly returns `?string` rather than `string`,
      // and its return value is often used with this method, so it is important
      // to tolerate null as an input.
      if (pathToCheck) {
        return pathToCheck.startsWith(this.getPath());
      } else {
        return false;
      }
    }
  }, {
    key: 'off',
    value: function off() {}
  }, {
    key: 'getHgRepositoryDescription',

    // A workaround before Atom 2.0: see ::getHgRepoInfo of main.js.
    value: function getHgRepositoryDescription() {
      return this._hgRepositoryDescription;
    }
  }], [{
    key: 'isRemoteDirectory',
    value: function isRemoteDirectory(directory) {
      return directory[MARKER_PROPERTY_FOR_REMOTE_DIRECTORY] === true;
    }
  }]);

  return RemoteDirectory;
})();

module.exports = RemoteDirectory;

// This method is part of the EmitterMixin used by Atom's local Directory, but not documented
// as part of the API - https://atom.io/docs/api/latest/Directory,
// However, it appears to be called in project.coffee by Atom.
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9ub2RlX21vZHVsZXMvbnVjbGlkZS1yZW1vdGUtY29ubmVjdGlvbi9saWIvUmVtb3RlRGlyZWN0b3J5LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBV1osSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzNCLElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQzs7ZUFDRyxPQUFPLENBQUMsTUFBTSxDQUFDOztJQUF0QyxVQUFVLFlBQVYsVUFBVTtJQUFFLE9BQU8sWUFBUCxPQUFPOztBQUN4QixJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQzs7QUFFcEQsSUFBSSxvQ0FBb0MsR0FBRyw4QkFBOEIsQ0FBQzs7OztJQUdwRSxlQUFlOzs7Ozs7QUFVUixXQVZQLGVBQWUsQ0FVUCxNQUF3QixFQUFFLEdBQVcsRUFBRSxPQUFhLEVBQUU7MEJBVjlELGVBQWU7O0FBV2pCLFVBQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLG9DQUFvQyxFQUFFLEVBQUMsS0FBSyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7QUFDakYsUUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7QUFDdEIsUUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7QUFDaEIsUUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBQzlCLFFBQUksQ0FBQyxrQkFBa0IsR0FBRyxDQUFDLENBQUM7O3FCQUNnQixHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQzs7UUFBL0MsYUFBYSxjQUFuQixJQUFJO1FBQWlCLFFBQVEsY0FBUixRQUFRO1FBQUUsSUFBSSxjQUFKLElBQUk7OztBQUV4QyxRQUFJLENBQUMsS0FBSyxHQUFHLFFBQVEsR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDOztBQUVwQyxRQUFJLENBQUMsVUFBVSxHQUFHLGFBQWEsQ0FBQzs7QUFFaEMsUUFBSSxDQUFDLHdCQUF3QixHQUFHLE9BQU8sR0FBRyxPQUFPLENBQUMsdUJBQXVCLEdBQUcsSUFBSSxDQUFDO0dBQ2xGOztlQXZCRyxlQUFlOztXQXlCUixxQkFBQyxRQUFRLEVBQWM7QUFDaEMsVUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7QUFDNUIsYUFBTyxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7S0FDNUU7Ozs2QkFFeUIsYUFBWTtBQUNwQyxVQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztBQUMxQixVQUFJLElBQUksQ0FBQyxvQkFBb0IsRUFBRTtBQUM3QixlQUFPO09BQ1I7QUFDRCxVQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDO0FBQ2pDLFVBQUk7QUFDRixjQUFNLElBQUksQ0FBQyw4QkFBOEIsRUFBRSxDQUFDO09BQzdDLENBQUMsT0FBTyxHQUFHLEVBQUU7QUFDWixjQUFNLENBQUMsS0FBSyxDQUFDLHNDQUFzQyxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDLENBQUM7T0FDNUUsU0FBUztBQUNSLFlBQUksQ0FBQyxvQkFBb0IsR0FBRyxLQUFLLENBQUM7T0FDbkM7S0FDRjs7OzZCQUVtQyxhQUFZOzs7QUFDOUMsVUFBSSxJQUFJLENBQUMsa0JBQWtCLEVBQUU7QUFDM0IsZUFBTztPQUNSO0FBQ0QsVUFBSSxDQUFDLGtCQUFrQixHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3pGLFVBQUksQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLFVBQUMsTUFBTTtlQUFLLE1BQUssd0JBQXdCLENBQUMsTUFBTSxDQUFDO09BQUEsQ0FBQyxDQUFDO0tBQ3pGOzs7V0FFdUIsa0NBQUMsT0FBMEIsRUFBRTtBQUNuRCxVQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDM0M7OztXQUVtQiw4QkFBQyxZQUFZLEVBQWM7OztBQUM3QyxhQUFPLElBQUksVUFBVSxDQUFDLFlBQU07QUFDMUIsb0JBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUN2QixlQUFLLHNCQUFzQixFQUFFLENBQUM7T0FDL0IsQ0FBQyxDQUFDO0tBQ0o7OztXQUVxQixrQ0FBWTtBQUNoQyxVQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztBQUMxQixVQUFJLElBQUksQ0FBQyxrQkFBa0IsS0FBSyxDQUFDLEVBQUU7QUFDakMsZUFBTyxJQUFJLENBQUMsa0NBQWtDLEVBQUUsQ0FBQztPQUNsRDtLQUNGOzs7NkJBRXVDLGFBQVk7QUFDbEQsVUFBSSxJQUFJLENBQUMsa0JBQWtCLEVBQUU7QUFDM0IsY0FBTSxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNqRSxZQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO09BQ2hDO0tBQ0Y7OztXQUVLLGtCQUFZO0FBQ2hCLGFBQU8sS0FBSyxDQUFDO0tBQ2Q7OztXQUVVLHVCQUFZO0FBQ3JCLGFBQU8sSUFBSSxDQUFDO0tBQ2I7OztXQUVLLGtCQUFZO0FBQ2hCLGFBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7S0FDdEM7OztXQUVNLGlCQUFDLFFBQVEsRUFBRTtBQUNoQixjQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNwQyxVQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ2pDLGFBQU8sS0FBSyxDQUFDLElBQUksS0FBSyxRQUFRLENBQUM7S0FDaEM7OztXQUVNLG1CQUFXO0FBQ2hCLGFBQU8sSUFBSSxDQUFDLElBQUksQ0FBQztLQUNsQjs7O1dBRVcsd0JBQVc7QUFDckIsYUFBTyxJQUFJLENBQUMsVUFBVSxDQUFDO0tBQ3hCOzs7V0FFTSxtQkFBVztBQUNoQixhQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7S0FDbkI7OztXQUVjLDJCQUFXO0FBQ3hCLFlBQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztLQUNwQzs7O1dBRVUsdUJBQVc7QUFDcEIsYUFBTyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztLQUN2Qzs7O1dBRVMsb0JBQUMsR0FBVyxFQUFVO0FBQzlCLFVBQUksQ0FBQyxHQUFHLEVBQUU7QUFDUixlQUFPLEdBQUcsQ0FBQztPQUNaOztBQUVELFVBQUksT0FBTyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQ2xDLGFBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQ2hEOzs7V0FFUSxxQkFBb0I7QUFDM0IsVUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUU7QUFDakIsZUFBTyxJQUFJLENBQUM7T0FDYixNQUFNO0FBQ0wsWUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ3hFLGVBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUM7T0FDMUM7S0FDRjs7O1dBRU0saUJBQUMsUUFBZ0IsRUFBYztBQUNwQyxVQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUM1RCxhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ3JDOzs7V0FFYyx5QkFBQyxPQUFlLEVBQVU7QUFDdkMsVUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDM0QsYUFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUMxQzs7OzZCQUVXLGFBQXFCO0FBQy9CLFlBQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3ZELFVBQUksSUFBSSxDQUFDLGtCQUFrQixHQUFHLENBQUMsRUFBRTtBQUMvQixZQUFJLENBQUMsOEJBQThCLEVBQUUsQ0FBQztPQUN2QztLQUNGOzs7NkJBRVcsYUFBWTtBQUN0QixZQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUN0RCxVQUFJLENBQUMsa0NBQWtDLEVBQUUsQ0FBQztLQUMzQzs7Ozs7Ozs2QkFLVyxXQUFDLE9BQWUsRUFBVztBQUNyQyxZQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7Ozs7QUFJaEUsWUFBTSxJQUFJLENBQUMsa0NBQWtDLEVBQUUsQ0FBQzs7d0JBRXpCLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQzs7VUFBdEMsUUFBUSxlQUFSLFFBQVE7VUFBRSxJQUFJLGVBQUosSUFBSTs7QUFDbkIsVUFBSSxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUM7QUFDMUIsVUFBSSxDQUFDLElBQUksR0FBRyxRQUFRLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDOzs7O0FBSXJELFVBQUksSUFBSSxDQUFDLGtCQUFrQixHQUFHLENBQUMsRUFBRTtBQUMvQixjQUFNLElBQUksQ0FBQyw4QkFBOEIsRUFBRSxDQUFDO09BQzdDO0tBQ0Y7OztXQUVhLDBCQUFHO0FBQ2YsWUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0tBQ3BDOzs7NkJBRWUsV0FBQyxRQUFRLEVBQUU7OztBQUN6QixVQUFJLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUN0RSxVQUFJLFdBQVcsR0FBRyxFQUFFLENBQUM7QUFDckIsVUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ2YsYUFBTyxDQUFDLElBQUksQ0FBQyxVQUFDLENBQUMsRUFBRSxDQUFDLEVBQUs7QUFDckIsZUFBTyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7T0FDakUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFDLEtBQUssRUFBSztBQUNwQixZQUFJLEdBQUcsR0FBRyxPQUFLLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQUssVUFBVSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM5RCxZQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUU7QUFDeEIsZUFBSyxDQUFDLElBQUksQ0FBQyxPQUFLLE9BQU8sQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztTQUMxQyxNQUFNO0FBQ0wscUJBQVcsQ0FBQyxJQUFJLENBQUMsT0FBSyxPQUFPLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7U0FDckQ7T0FDRixDQUFDLENBQUM7QUFDSCxjQUFRLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztLQUMzQzs7O1dBRU8sa0JBQUMsV0FBb0IsRUFBVzs7Ozs7O0FBTXRDLFVBQUksV0FBVyxFQUFFO0FBQ2YsZUFBTyxXQUFXLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO09BQy9DLE1BQU07QUFDTCxlQUFPLEtBQUssQ0FBQztPQUNkO0tBQ0Y7OztXQUVFLGVBQUcsRUFJTDs7Ozs7V0FHeUIsc0NBQUc7QUFDM0IsYUFBTyxJQUFJLENBQUMsd0JBQXdCLENBQUM7S0FDdEM7OztXQTNOdUIsMkJBQUMsU0FBc0MsRUFBVztBQUN4RSxhQUFPLFNBQVMsQ0FBQyxvQ0FBb0MsQ0FBQyxLQUFLLElBQUksQ0FBQztLQUNqRTs7O1NBSEcsZUFBZTs7O0FBK05yQixNQUFNLENBQUMsT0FBTyxHQUFHLGVBQWUsQ0FBQyIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvbnVjbGlkZS1yZW1vdGUtcHJvamVjdHMvbm9kZV9tb2R1bGVzL251Y2xpZGUtcmVtb3RlLWNvbm5lY3Rpb24vbGliL1JlbW90ZURpcmVjdG9yeS5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbnZhciBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xudmFyIHVybCA9IHJlcXVpcmUoJ3VybCcpO1xudmFyIHtEaXNwb3NhYmxlLCBFbWl0dGVyfSA9IHJlcXVpcmUoJ2F0b20nKTtcbnZhciBsb2dnZXIgPSByZXF1aXJlKCdudWNsaWRlLWxvZ2dpbmcnKS5nZXRMb2dnZXIoKTtcblxudmFyIE1BUktFUl9QUk9QRVJUWV9GT1JfUkVNT1RFX0RJUkVDVE9SWSA9ICdfX251Y2xpZGVfcmVtb3RlX2RpcmVjdG9yeV9fJztcblxuLyogTW9zdGx5IGltcGxlbWVudHMgaHR0cHM6Ly9hdG9tLmlvL2RvY3MvYXBpL2xhdGVzdC9EaXJlY3RvcnkgKi9cbmNsYXNzIFJlbW90ZURpcmVjdG9yeSB7XG4gIHN0YXRpYyBpc1JlbW90ZURpcmVjdG9yeShkaXJlY3Rvcnk6IERpcmVjdG9yeSB8IFJlbW90ZURpcmVjdG9yeSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBkaXJlY3RvcnlbTUFSS0VSX1BST1BFUlRZX0ZPUl9SRU1PVEVfRElSRUNUT1JZXSA9PT0gdHJ1ZTtcbiAgfVxuXG4gIF93YXRjaFN1YnNjcmlwdGlvbjogP0ZzV2F0Y2hlcjtcblxuICAvKipcbiAgICogQHBhcmFtIHVyaSBzaG91bGQgYmUgb2YgdGhlIGZvcm0gXCJudWNsaWRlOi8vZXhhbXBsZS5jb206OTA5MC9wYXRoL3RvL2RpcmVjdG9yeVwiLlxuICAgKi9cbiAgY29uc3RydWN0b3IocmVtb3RlOiBSZW1vdGVDb25uZWN0aW9uLCB1cmk6IHN0cmluZywgb3B0aW9uczogP2FueSkge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBNQVJLRVJfUFJPUEVSVFlfRk9SX1JFTU9URV9ESVJFQ1RPUlksIHt2YWx1ZTogdHJ1ZX0pO1xuICAgIHRoaXMuX3JlbW90ZSA9IHJlbW90ZTtcbiAgICB0aGlzLl91cmkgPSB1cmk7XG4gICAgdGhpcy5fZW1pdHRlciA9IG5ldyBFbWl0dGVyKCk7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9uQ291bnQgPSAwO1xuICAgIHZhciB7cGF0aDogZGlyZWN0b3J5UGF0aCwgcHJvdG9jb2wsIGhvc3R9ID0gdXJsLnBhcnNlKHVyaSk7XG4gICAgLyoqIEluIHRoZSBleGFtcGxlLCB0aGlzIHdvdWxkIGJlIFwibnVjbGlkZTovL2V4YW1wbGUuY29tOjkwOTBcIi4gKi9cbiAgICB0aGlzLl9ob3N0ID0gcHJvdG9jb2wgKyAnLy8nICsgaG9zdDtcbiAgICAvKiogSW4gdGhlIGV4YW1wbGUsIHRoaXMgd291bGQgYmUgXCIvcGF0aC90by9kaXJlY3RvcnlcIi4gKi9cbiAgICB0aGlzLl9sb2NhbFBhdGggPSBkaXJlY3RvcnlQYXRoO1xuICAgIC8vIEEgd29ya2Fyb3VuZCBiZWZvcmUgQXRvbSAyLjA6IHNlZSA6OmdldEhnUmVwb0luZm8gb2YgbWFpbi5qcy5cbiAgICB0aGlzLl9oZ1JlcG9zaXRvcnlEZXNjcmlwdGlvbiA9IG9wdGlvbnMgPyBvcHRpb25zLmhnUmVwb3NpdG9yeURlc2NyaXB0aW9uIDogbnVsbDtcbiAgfVxuXG4gIG9uRGlkQ2hhbmdlKGNhbGxiYWNrKTogRGlzcG9zYWJsZSB7XG4gICAgdGhpcy5fd2lsbEFkZFN1YnNjcmlwdGlvbigpO1xuICAgIHJldHVybiB0aGlzLl90cmFja1Vuc3Vic2NyaXB0aW9uKHRoaXMuX2VtaXR0ZXIub24oJ2RpZC1jaGFuZ2UnLCBjYWxsYmFjaykpO1xuICB9XG5cbiAgYXN5bmMgX3dpbGxBZGRTdWJzY3JpcHRpb24oKTogUHJvbWlzZSB7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9uQ291bnQrKztcbiAgICBpZiAodGhpcy5fcGVuZGluZ1N1YnNjcmlwdGlvbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9wZW5kaW5nU3Vic2NyaXB0aW9uID0gdHJ1ZTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5fc3Vic2NyaWJlVG9OYXRpdmVDaGFuZ2VFdmVudHMoKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGxvZ2dlci5lcnJvcignRmFpbGVkIHRvIHN1YnNjcmliZSBSZW1vdGVEaXJlY3Rvcnk6JywgdGhpcy5fbG9jYWxQYXRoLCBlcnIpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLl9wZW5kaW5nU3Vic2NyaXB0aW9uID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgX3N1YnNjcmliZVRvTmF0aXZlQ2hhbmdlRXZlbnRzKCk6IFByb21pc2Uge1xuICAgIGlmICh0aGlzLl93YXRjaFN1YnNjcmlwdGlvbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl93YXRjaFN1YnNjcmlwdGlvbiA9IGF3YWl0IHRoaXMuX3JlbW90ZS5nZXRDbGllbnQoKS53YXRjaERpcmVjdG9yeSh0aGlzLl9sb2NhbFBhdGgpO1xuICAgIHRoaXMuX3dhdGNoU3Vic2NyaXB0aW9uLm9uKCdjaGFuZ2UnLCAoY2hhbmdlKSA9PiB0aGlzLl9oYW5kbGVOYXRpdmVDaGFuZ2VFdmVudChjaGFuZ2UpKTtcbiAgfVxuXG4gIF9oYW5kbGVOYXRpdmVDaGFuZ2VFdmVudChjaGFuZ2VzOiBBcnJheTxGaWxlQ2hhbmdlPikge1xuICAgIHRoaXMuX2VtaXR0ZXIuZW1pdCgnZGlkLWNoYW5nZScsIGNoYW5nZXMpO1xuICB9XG5cbiAgX3RyYWNrVW5zdWJzY3JpcHRpb24oc3Vic2NyaXB0aW9uKTogRGlzcG9zYWJsZSB7XG4gICAgcmV0dXJuIG5ldyBEaXNwb3NhYmxlKCgpID0+IHtcbiAgICAgIHN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XG4gICAgICB0aGlzLl9kaWRSZW1vdmVTdWJzY3JpcHRpb24oKTtcbiAgICB9KTtcbiAgfVxuXG4gIF9kaWRSZW1vdmVTdWJzY3JpcHRpb24oKTogUHJvbWlzZSB7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9uQ291bnQtLTtcbiAgICBpZiAodGhpcy5fc3Vic2NyaXB0aW9uQ291bnQgPT09IDApIHtcbiAgICAgIHJldHVybiB0aGlzLl91bnN1YnNjcmliZUZyb21OYXRpdmVDaGFuZ2VFdmVudHMoKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBfdW5zdWJzY3JpYmVGcm9tTmF0aXZlQ2hhbmdlRXZlbnRzKCk6IFByb21pc2Uge1xuICAgIGlmICh0aGlzLl93YXRjaFN1YnNjcmlwdGlvbikge1xuICAgICAgYXdhaXQgdGhpcy5fcmVtb3RlLmdldENsaWVudCgpLnVud2F0Y2hEaXJlY3RvcnkodGhpcy5fbG9jYWxQYXRoKTtcbiAgICAgIHRoaXMuX3dhdGNoU3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBpc0ZpbGUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaXNEaXJlY3RvcnkoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBpc1Jvb3QoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2lzUm9vdCh0aGlzLl9sb2NhbFBhdGgpO1xuICB9XG5cbiAgX2lzUm9vdChmaWxlUGF0aCkge1xuICAgIGZpbGVQYXRoID0gcGF0aC5ub3JtYWxpemUoZmlsZVBhdGgpO1xuICAgIHZhciBwYXJ0cyA9IHBhdGgucGFyc2UoZmlsZVBhdGgpO1xuICAgIHJldHVybiBwYXJ0cy5yb290ID09PSBmaWxlUGF0aDtcbiAgfVxuXG4gIGdldFBhdGgoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fdXJpO1xuICB9XG5cbiAgZ2V0TG9jYWxQYXRoKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuX2xvY2FsUGF0aDtcbiAgfVxuXG4gIGdldEhvc3QoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5faG9zdDtcbiAgfVxuXG4gIGdldFJlYWxQYXRoU3luYygpOiBzdHJpbmcge1xuICAgIHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkJyk7XG4gIH1cblxuICBnZXRCYXNlTmFtZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBwYXRoLmJhc2VuYW1lKHRoaXMuX2xvY2FsUGF0aCk7XG4gIH1cblxuICByZWxhdGl2aXplKHVyaTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAoIXVyaSkge1xuICAgICAgcmV0dXJuIHVyaTtcbiAgICB9XG4gICAgLy8gTm90ZTogaG9zdCBvZiB1cmkgbXVzdCBtYXRjaCB0aGlzLl9ob3N0LlxuICAgIHZhciBzdWJwYXRoID0gdXJsLnBhcnNlKHVyaSkucGF0aDtcbiAgICByZXR1cm4gcGF0aC5yZWxhdGl2ZSh0aGlzLl9sb2NhbFBhdGgsIHN1YnBhdGgpO1xuICB9XG5cbiAgZ2V0UGFyZW50KCk6IFJlbW90ZURpcmVjdG9yeSB7XG4gICAgaWYgKHRoaXMuaXNSb290KCkpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgdXJpID0gdGhpcy5faG9zdCArIHBhdGgubm9ybWFsaXplKHBhdGguam9pbih0aGlzLl9sb2NhbFBhdGgsICcuLicpKTtcbiAgICAgIHJldHVybiB0aGlzLl9yZW1vdGUuY3JlYXRlRGlyZWN0b3J5KHVyaSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0RmlsZShmaWxlbmFtZTogc3RyaW5nKTogUmVtb3RlRmlsZSB7XG4gICAgdmFyIHVyaSA9IHRoaXMuX2hvc3QgKyBwYXRoLmpvaW4odGhpcy5fbG9jYWxQYXRoLCBmaWxlbmFtZSk7XG4gICAgcmV0dXJuIHRoaXMuX3JlbW90ZS5jcmVhdGVGaWxlKHVyaSk7XG4gIH1cblxuICBnZXRTdWJkaXJlY3RvcnkoZGlybmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICB2YXIgdXJpID0gdGhpcy5faG9zdCArIHBhdGguam9pbih0aGlzLl9sb2NhbFBhdGgsIGRpcm5hbWUpO1xuICAgIHJldHVybiB0aGlzLl9yZW1vdGUuY3JlYXRlRGlyZWN0b3J5KHVyaSk7XG4gIH1cblxuICBhc3luYyBjcmVhdGUoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgYXdhaXQgdGhpcy5fcmVtb3RlLmdldENsaWVudCgpLm1rZGlycCh0aGlzLl9sb2NhbFBhdGgpO1xuICAgIGlmICh0aGlzLl9zdWJzY3JpcHRpb25Db3VudCA+IDApIHtcbiAgICAgIHRoaXMuX3N1YnNjcmliZVRvTmF0aXZlQ2hhbmdlRXZlbnRzKCk7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZGVsZXRlKCk6IFByb21pc2Uge1xuICAgIGF3YWl0IHRoaXMuX3JlbW90ZS5nZXRDbGllbnQoKS5ybWRpcih0aGlzLl9sb2NhbFBhdGgpO1xuICAgIHRoaXMuX3Vuc3Vic2NyaWJlRnJvbU5hdGl2ZUNoYW5nZUV2ZW50cygpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbmFtZXMgdGhpcyBkaXJlY3RvcnkgdG8gdGhlIGdpdmVuIGFic29sdXRlIHBhdGguXG4gICAqL1xuICBhc3luYyByZW5hbWUobmV3UGF0aDogc3RyaW5nKTogUHJvbWlzZSB7XG4gICAgYXdhaXQgdGhpcy5fcmVtb3RlLmdldENsaWVudCgpLnJlbmFtZSh0aGlzLl9sb2NhbFBhdGgsIG5ld1BhdGgpO1xuXG4gICAgLy8gVW5zdWJzY3JpYmUgZnJvbSB0aGUgb2xkIGB0aGlzLl9sb2NhbFBhdGhgLiBUaGlzIG11c3QgYmUgZG9uZSBiZWZvcmVcbiAgICAvLyBzZXR0aW5nIHRoZSBuZXcgYHRoaXMuX2xvY2FsUGF0aGAuXG4gICAgYXdhaXQgdGhpcy5fdW5zdWJzY3JpYmVGcm9tTmF0aXZlQ2hhbmdlRXZlbnRzKCk7XG5cbiAgICB2YXIge3Byb3RvY29sLCBob3N0fSA9IHVybC5wYXJzZSh0aGlzLl91cmkpO1xuICAgIHRoaXMuX2xvY2FsUGF0aCA9IG5ld1BhdGg7XG4gICAgdGhpcy5fdXJpID0gcHJvdG9jb2wgKyAnLy8nICsgaG9zdCArIHRoaXMuX2xvY2FsUGF0aDtcblxuICAgIC8vIFN1YnNjcmliZSB0byBjaGFuZ2VzIGZvciB0aGUgbmV3IGB0aGlzLl9sb2NhbFBhdGhgLiBUaGlzIG11c3QgYmUgZG9uZVxuICAgIC8vIGFmdGVyIHNldHRpbmcgdGhlIG5ldyBgdGhpcy5fbG9jYWxQYXRoYC5cbiAgICBpZiAodGhpcy5fc3Vic2NyaXB0aW9uQ291bnQgPiAwKSB7XG4gICAgICBhd2FpdCB0aGlzLl9zdWJzY3JpYmVUb05hdGl2ZUNoYW5nZUV2ZW50cygpO1xuICAgIH1cbiAgfVxuXG4gIGdldEVudHJpZXNTeW5jKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignbm90IGltcGxlbWVudGVkJyk7XG4gIH1cblxuICBhc3luYyBnZXRFbnRyaWVzKGNhbGxiYWNrKSB7XG4gICAgdmFyIGVudHJpZXMgPSBhd2FpdCB0aGlzLl9yZW1vdGUuZ2V0Q2xpZW50KCkucmVhZGRpcih0aGlzLl9sb2NhbFBhdGgpO1xuICAgIHZhciBkaXJlY3RvcmllcyA9IFtdO1xuICAgIHZhciBmaWxlcyA9IFtdO1xuICAgIGVudHJpZXMuc29ydCgoYSwgYikgPT4ge1xuICAgICAgcmV0dXJuIGEuZmlsZS50b0xvd2VyQ2FzZSgpLmxvY2FsZUNvbXBhcmUoYi5maWxlLnRvTG93ZXJDYXNlKCkpO1xuICAgIH0pLmZvckVhY2goKGVudHJ5KSA9PiB7XG4gICAgICB2YXIgdXJpID0gdGhpcy5faG9zdCArIHBhdGguam9pbih0aGlzLl9sb2NhbFBhdGgsIGVudHJ5LmZpbGUpO1xuICAgICAgaWYgKGVudHJ5LnN0YXRzLmlzRmlsZSgpKSB7XG4gICAgICAgIGZpbGVzLnB1c2godGhpcy5fcmVtb3RlLmNyZWF0ZUZpbGUodXJpKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkaXJlY3Rvcmllcy5wdXNoKHRoaXMuX3JlbW90ZS5jcmVhdGVEaXJlY3RvcnkodXJpKSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgY2FsbGJhY2sobnVsbCwgZGlyZWN0b3JpZXMuY29uY2F0KGZpbGVzKSk7XG4gIH1cblxuICBjb250YWlucyhwYXRoVG9DaGVjazogP3N0cmluZyk6IGJvb2xlYW4ge1xuICAgIC8vIElkZWFsbHksIHRoZSB0eXBlIG9mIHBhdGhUb0NoZWNrIHdvdWxkIGJlIGBzdHJpbmdgIHJhdGhlciB0aGFuIGA/c3RyaW5nYDtcbiAgICAvLyBob3dldmVyLCBhcyBzaG93biBieSBodHRwczovL2dpdGh1Yi5jb20vYXRvbS9naXQtZGlmZi9wdWxsLzUzLFxuICAgIC8vIGBlZGl0b3IuZ2V0UGF0aCgpYCB1bmV4cGVjdGVkbHkgcmV0dXJucyBgP3N0cmluZ2AgcmF0aGVyIHRoYW4gYHN0cmluZ2AsXG4gICAgLy8gYW5kIGl0cyByZXR1cm4gdmFsdWUgaXMgb2Z0ZW4gdXNlZCB3aXRoIHRoaXMgbWV0aG9kLCBzbyBpdCBpcyBpbXBvcnRhbnRcbiAgICAvLyB0byB0b2xlcmF0ZSBudWxsIGFzIGFuIGlucHV0LlxuICAgIGlmIChwYXRoVG9DaGVjaykge1xuICAgICAgcmV0dXJuIHBhdGhUb0NoZWNrLnN0YXJ0c1dpdGgodGhpcy5nZXRQYXRoKCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgb2ZmKCkge1xuICAgIC8vIFRoaXMgbWV0aG9kIGlzIHBhcnQgb2YgdGhlIEVtaXR0ZXJNaXhpbiB1c2VkIGJ5IEF0b20ncyBsb2NhbCBEaXJlY3RvcnksIGJ1dCBub3QgZG9jdW1lbnRlZFxuICAgIC8vIGFzIHBhcnQgb2YgdGhlIEFQSSAtIGh0dHBzOi8vYXRvbS5pby9kb2NzL2FwaS9sYXRlc3QvRGlyZWN0b3J5LFxuICAgIC8vIEhvd2V2ZXIsIGl0IGFwcGVhcnMgdG8gYmUgY2FsbGVkIGluIHByb2plY3QuY29mZmVlIGJ5IEF0b20uXG4gIH1cblxuICAvLyBBIHdvcmthcm91bmQgYmVmb3JlIEF0b20gMi4wOiBzZWUgOjpnZXRIZ1JlcG9JbmZvIG9mIG1haW4uanMuXG4gIGdldEhnUmVwb3NpdG9yeURlc2NyaXB0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9oZ1JlcG9zaXRvcnlEZXNjcmlwdGlvbjtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbW90ZURpcmVjdG9yeTtcbiJdfQ==