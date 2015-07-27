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

var pathUtil = require('path');
var crypto = require('crypto');

var _require = require('atom');

var Disposable = _require.Disposable;
var Emitter = _require.Emitter;

var url = require('url');
var logger = require('nuclide-logging').getLogger();

/* Mostly implements https://atom.io/docs/api/latest/File */

var RemoteFile = (function () {
  function RemoteFile(remote, remotePath) {
    _classCallCheck(this, RemoteFile);

    this._remote = remote;

    var _url$parse = url.parse(remotePath);

    var localPath = _url$parse.path;

    this._localPath = localPath;
    this._path = remotePath;
    this._emitter = new Emitter();
    this._subscriptionCount = 0;
    this._cachedContents = null;
    this._deleted = false;
  }

  _createClass(RemoteFile, [{
    key: 'onDidChange',
    value: function onDidChange(callback) {
      this._willAddSubscription();
      return this._trackUnsubscription(this._emitter.on('did-change', callback));
    }
  }, {
    key: 'onDidRename',
    value: function onDidRename(callback) {
      this._willAddSubscription();
      return this._trackUnsubscription(this._emitter.on('did-rename', callback));
    }
  }, {
    key: 'onDidDelete',
    value: function onDidDelete(callback) {
      this._willAddSubscription();
      return this._trackUnsubscription(this._emitter.on('did-delete', callback));
    }
  }, {
    key: '_willAddSubscription',
    value: function _willAddSubscription() {
      this._subscriptionCount++;
      return this._subscribeToNativeChangeEvents();
    }
  }, {
    key: '_subscribeToNativeChangeEvents',
    value: _asyncToGenerator(function* () {
      var _this = this;

      if (this._watchSubscription) {
        return;
      }
      if (this._pendingSubscription) {
        return;
      }
      this._pendingSubscription = true;
      try {
        this._watchSubscription = yield this._remote.getClient().watchFile(this._localPath);
      } catch (err) {
        logger.error('Failed to subscribe RemoteFile:', this._path, err);
      } finally {
        this._pendingSubscription = false;
      }
      if (this._watchSubscription) {
        this._watchSubscription.on('change', function () {
          return _this._handleNativeChangeEvent();
        });
        this._watchSubscription.on('rename', function () {
          return _this._handleNativeRenameEvent();
        });
        this._watchSubscription.on('delete', function () {
          return _this._handleNativeDeleteEvent();
        });
      }
    })
  }, {
    key: '_handleNativeChangeEvent',
    value: _asyncToGenerator(function* () {
      var oldContents = this._cachedContents;
      try {
        var newContents = yield this.read( /*flushCache*/true);
        if (oldContents !== newContents) {
          this._emitter.emit('did-change');
        }
      } catch (error) {
        // We can't read the file, so we cancel the watcher subscription.
        yield this._unsubscribeFromNativeChangeEvents();
        var handled = false;
        var handle = function handle() {
          handled = true;
        };
        error.eventType = 'change';
        this._emitter.emit('will-throw-watch-error', { error: error, handle: handle });
        if (!handled) {
          var newError = new Error('Cannot read file after file change event: ' + this._path);
          newError.originalError = error;
          newError.code = 'ENOENT';
          throw newError;
        }
      }
    })
  }, {
    key: '_handleNativeRenameEvent',
    value: _asyncToGenerator(function* (newPath) {
      yield this._unsubscribeFromNativeChangeEvents();
      this._cachedContents = null;

      var _url$parse2 = url.parse(this._path);

      var protocol = _url$parse2.protocol;
      var host = _url$parse2.host;

      this._localPath = newPath;
      this._path = protocol + '//' + host + this._localPath;
      yield this._subscribeToNativeChangeEvents();
      this._emitter.emit('did-rename');
    })
  }, {
    key: '_handleNativeDeleteEvent',
    value: _asyncToGenerator(function* () {
      yield this._unsubscribeFromNativeChangeEvents();
      this._cachedContents = null;
      if (!this._deleted) {
        this._deleted = true;
        this._emitter.emit('did-delete');
      }
    })
  }, {
    key: '_trackUnsubscription',

    /*
     * Return a new Disposable that upon dispose, will remove the bound watch subscription.
     * When the number of subscriptions reach 0, the file is unwatched.
     */
    value: function _trackUnsubscription(subscription) {
      var _this2 = this;

      return new Disposable(function () {
        subscription.dispose();
        _this2._didRemoveSubscription();
      });
    }
  }, {
    key: '_didRemoveSubscription',
    value: _asyncToGenerator(function* () {
      this._subscriptionCount--;
      if (this._subscriptionCount === 0) {
        yield this._unsubscribeFromNativeChangeEvents();
      }
    })
  }, {
    key: '_unsubscribeFromNativeChangeEvents',
    value: _asyncToGenerator(function* () {
      if (this._watchSubscription) {
        yield this._remote.getClient().unwatchFile(this._localPath);
        this._watchSubscription = null;
      }
    })
  }, {
    key: 'onWillThrowWatchError',
    value: function onWillThrowWatchError(callback) {
      return this._emitter.on('will-throw-watch-error', callback);
    }
  }, {
    key: 'isFile',
    value: function isFile() {
      return true;
    }
  }, {
    key: 'isDirectory',
    value: function isDirectory() {
      return false;
    }
  }, {
    key: 'exists',
    value: function exists() {
      return this._remote.getClient().exists(this._localPath);
    }
  }, {
    key: 'existsSync',
    value: function existsSync() {
      return true;
    }
  }, {
    key: 'getDigestSync',
    value: function getDigestSync() {
      if (this._digest) {
        return this._digest;
      } else {
        throw new Error('getDigestSync is not supported in RemoteFile');
      }
    }
  }, {
    key: 'getDigest',
    value: _asyncToGenerator(function* () {
      if (this._digest) {
        return this._digest;
      }
      yield this.read();
      return this._digest;
    })
  }, {
    key: '_setDigest',
    value: function _setDigest(contents) {
      this._digest = crypto.createHash('sha1').update(contents || '').digest('hex');
    }
  }, {
    key: 'setEncoding',
    value: function setEncoding(encoding) {
      this._encoding = encoding;
    }
  }, {
    key: 'getEncoding',
    value: function getEncoding() {
      return this._encoding;
    }
  }, {
    key: 'getPath',
    value: function getPath() {
      return this._path;
    }
  }, {
    key: 'getLocalPath',
    value: function getLocalPath() {
      return this._localPath;
    }
  }, {
    key: 'getRealPathSync',
    value: function getRealPathSync() {
      return this._realpath || this._path;
    }
  }, {
    key: 'getRealPath',
    value: _asyncToGenerator(function* () {
      if (!this._realpath) {
        this._realpath = yield this._remote.getClient().realpath(this._localPath);
      }
      return this._realpath;
    })
  }, {
    key: 'getBaseName',
    value: function getBaseName() {
      return pathUtil.basename(this._path);
    }
  }, {
    key: 'create',
    value: _asyncToGenerator(function* () {
      yield this._remote.getClient().newFile(this._localPath);
      if (this._subscriptionCount > 0) {
        this._subscribeToNativeChangeEvents();
      }
    })
  }, {
    key: 'delete',
    value: _asyncToGenerator(function* () {
      try {
        yield this._remote.getClient().unlink(this._localPath);
        this._handleNativeDeleteEvent();
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    })
  }, {
    key: 'rename',
    value: _asyncToGenerator(function* (newPath) {
      yield this._remote.getClient().rename(this._localPath, newPath);
      yield this._handleNativeRenameEvent(newPath);
    })
  }, {
    key: 'read',
    value: _asyncToGenerator(function* (flushCache) {
      // TODO: return cachedContents if exists and !flushCache
      // This involves the reload scenario, where the same instance of the file is read(),
      // but the file contents should reload.
      var data = yield this._remote.getClient().readFile(this._localPath);
      var contents = data.toString();
      this._setDigest(contents);
      this._cachedContents = contents;
      // TODO: respect encoding
      return contents;
    })
  }, {
    key: 'readSync',
    value: function readSync(flushcache) {
      throw new Error('readSync is not supported in RemoteFile');
    }
  }, {
    key: 'write',
    value: _asyncToGenerator(function* (text) {
      var previouslyExisted = yield this.exists();
      yield this._remote.getClient().writeFile(this._localPath, text);
      this._cachedContents = text;
      if (!previouslyExisted && this._subscriptionCount > 0) {
        yield this._subscribeToNativeChangeEvents();
      }
    })
  }, {
    key: 'getParent',
    value: function getParent() {
      var _url$parse3 = url.parse(this._path);

      var localPath = _url$parse3.path;
      var protocol = _url$parse3.protocol;
      var host = _url$parse3.host;

      var directoryPath = protocol + '//' + host + pathUtil.dirname(localPath);
      return this._remote.createDirectory(directoryPath);
    }
  }]);

  return RemoteFile;
})();

module.exports = RemoteFile;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9ub2RlX21vZHVsZXMvbnVjbGlkZS1yZW1vdGUtY29ubmVjdGlvbi9saWIvUmVtb3RlRmlsZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQVdaLElBQUksUUFBUSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMvQixJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7O2VBQ0gsT0FBTyxDQUFDLE1BQU0sQ0FBQzs7SUFBdEMsVUFBVSxZQUFWLFVBQVU7SUFBRSxPQUFPLFlBQVAsT0FBTzs7QUFDeEIsSUFBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3pCLElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDOzs7O0lBRzlDLFVBQVU7QUFLSCxXQUxQLFVBQVUsQ0FLRixNQUF3QixFQUFFLFVBQWtCLEVBQUU7MEJBTHRELFVBQVU7O0FBTVosUUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7O3FCQUNFLEdBQUcsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDOztRQUFsQyxTQUFTLGNBQWYsSUFBSTs7QUFDVCxRQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztBQUM1QixRQUFJLENBQUMsS0FBSyxHQUFHLFVBQVUsQ0FBQztBQUN4QixRQUFJLENBQUMsUUFBUSxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7QUFDOUIsUUFBSSxDQUFDLGtCQUFrQixHQUFHLENBQUMsQ0FBQztBQUM1QixRQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztBQUM1QixRQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztHQUN2Qjs7ZUFkRyxVQUFVOztXQWdCSCxxQkFBQyxRQUFRLEVBQWM7QUFD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Q0FBQyxTQUFTLEVBQUUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNoRSxVQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQztBQUM1QixVQUFJLENBQUMsaUJBQWlCLElBQUksSUFBSSxDQUFDLGtCQUFrQixHQUFHLENBQUMsRUFBRTtBQUNyRCxjQUFNLElBQUksQ0FBQyw4QkFBOEIsRUFBRSxDQUFDO09BQzdDO0tBQ0Y7OztXQUVRLHFCQUFvQjt3QkFDYSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7O1VBQWxELFNBQVMsZUFBZixJQUFJO1VBQWEsUUFBUSxlQUFSLFFBQVE7VUFBRSxJQUFJLGVBQUosSUFBSTs7QUFDcEMsVUFBSSxhQUFhLEdBQUcsUUFBUSxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUN6RSxhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0tBQ3BEOzs7U0ExUEcsVUFBVTs7O0FBNlBoQixNQUFNLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQyIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvbnVjbGlkZS1yZW1vdGUtcHJvamVjdHMvbm9kZV9tb2R1bGVzL251Y2xpZGUtcmVtb3RlLWNvbm5lY3Rpb24vbGliL1JlbW90ZUZpbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIgcGF0aFV0aWwgPSByZXF1aXJlKCdwYXRoJyk7XG52YXIgY3J5cHRvID0gcmVxdWlyZSgnY3J5cHRvJyk7XG52YXIge0Rpc3Bvc2FibGUsIEVtaXR0ZXJ9ID0gcmVxdWlyZSgnYXRvbScpO1xudmFyIHVybCA9IHJlcXVpcmUoJ3VybCcpO1xudmFyIGxvZ2dlciA9IHJlcXVpcmUoJ251Y2xpZGUtbG9nZ2luZycpLmdldExvZ2dlcigpO1xuXG4vKiBNb3N0bHkgaW1wbGVtZW50cyBodHRwczovL2F0b20uaW8vZG9jcy9hcGkvbGF0ZXN0L0ZpbGUgKi9cbmNsYXNzIFJlbW90ZUZpbGUge1xuXG4gIF9yZWFscGF0aDogP3N0cmluZztcbiAgX3dhdGNoU3Vic2NyaXB0aW9uOiA/RnNXYXRjaGVyO1xuXG4gIGNvbnN0cnVjdG9yKHJlbW90ZTogUmVtb3RlQ29ubmVjdGlvbiwgcmVtb3RlUGF0aDogc3RyaW5nKSB7XG4gICAgdGhpcy5fcmVtb3RlID0gcmVtb3RlO1xuICAgIHZhciB7cGF0aDogbG9jYWxQYXRofSA9IHVybC5wYXJzZShyZW1vdGVQYXRoKTtcbiAgICB0aGlzLl9sb2NhbFBhdGggPSBsb2NhbFBhdGg7XG4gICAgdGhpcy5fcGF0aCA9IHJlbW90ZVBhdGg7XG4gICAgdGhpcy5fZW1pdHRlciA9IG5ldyBFbWl0dGVyKCk7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9uQ291bnQgPSAwO1xuICAgIHRoaXMuX2NhY2hlZENvbnRlbnRzID0gbnVsbDtcbiAgICB0aGlzLl9kZWxldGVkID0gZmFsc2U7XG4gIH1cblxuICBvbkRpZENoYW5nZShjYWxsYmFjayk6IERpc3Bvc2FibGUge1xuICAgIHRoaXMuX3dpbGxBZGRTdWJzY3JpcHRpb24oKTtcbiAgICByZXR1cm4gdGhpcy5fdHJhY2tVbnN1YnNjcmlwdGlvbih0aGlzLl9lbWl0dGVyLm9uKCdkaWQtY2hhbmdlJywgY2FsbGJhY2spKTtcbiAgfVxuXG4gIG9uRGlkUmVuYW1lKGNhbGxiYWNrKTogRGlzcG9zYWJsZSB7XG4gICAgdGhpcy5fd2lsbEFkZFN1YnNjcmlwdGlvbigpO1xuICAgIHJldHVybiB0aGlzLl90cmFja1Vuc3Vic2NyaXB0aW9uKHRoaXMuX2VtaXR0ZXIub24oJ2RpZC1yZW5hbWUnLCBjYWxsYmFjaykpO1xuICB9XG5cbiAgb25EaWREZWxldGUoY2FsbGJhY2spOiBEaXNwb3NhYmxlIHtcbiAgICB0aGlzLl93aWxsQWRkU3Vic2NyaXB0aW9uKCk7XG4gICAgcmV0dXJuIHRoaXMuX3RyYWNrVW5zdWJzY3JpcHRpb24odGhpcy5fZW1pdHRlci5vbignZGlkLWRlbGV0ZScsIGNhbGxiYWNrKSk7XG4gIH1cblxuICBfd2lsbEFkZFN1YnNjcmlwdGlvbigpOiBQcm9taXNlIHtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25Db3VudCsrO1xuICAgIHJldHVybiB0aGlzLl9zdWJzY3JpYmVUb05hdGl2ZUNoYW5nZUV2ZW50cygpO1xuICB9XG5cbiAgYXN5bmMgX3N1YnNjcmliZVRvTmF0aXZlQ2hhbmdlRXZlbnRzKCk6IFByb21pc2Uge1xuICAgIGlmICh0aGlzLl93YXRjaFN1YnNjcmlwdGlvbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5fcGVuZGluZ1N1YnNjcmlwdGlvbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9wZW5kaW5nU3Vic2NyaXB0aW9uID0gdHJ1ZTtcbiAgICB0cnkge1xuICAgICAgdGhpcy5fd2F0Y2hTdWJzY3JpcHRpb24gPSBhd2FpdCB0aGlzLl9yZW1vdGUuZ2V0Q2xpZW50KCkud2F0Y2hGaWxlKHRoaXMuX2xvY2FsUGF0aCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBsb2dnZXIuZXJyb3IoJ0ZhaWxlZCB0byBzdWJzY3JpYmUgUmVtb3RlRmlsZTonLCB0aGlzLl9wYXRoLCBlcnIpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLl9wZW5kaW5nU3Vic2NyaXB0aW9uID0gZmFsc2U7XG4gICAgfVxuICAgIGlmICh0aGlzLl93YXRjaFN1YnNjcmlwdGlvbikge1xuICAgICAgdGhpcy5fd2F0Y2hTdWJzY3JpcHRpb24ub24oJ2NoYW5nZScsICgpID0+IHRoaXMuX2hhbmRsZU5hdGl2ZUNoYW5nZUV2ZW50KCkpO1xuICAgICAgdGhpcy5fd2F0Y2hTdWJzY3JpcHRpb24ub24oJ3JlbmFtZScsICgpID0+IHRoaXMuX2hhbmRsZU5hdGl2ZVJlbmFtZUV2ZW50KCkpO1xuICAgICAgdGhpcy5fd2F0Y2hTdWJzY3JpcHRpb24ub24oJ2RlbGV0ZScsICgpID0+IHRoaXMuX2hhbmRsZU5hdGl2ZURlbGV0ZUV2ZW50KCkpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIF9oYW5kbGVOYXRpdmVDaGFuZ2VFdmVudCgpOiBQcm9taXNlIHtcbiAgICB2YXIgb2xkQ29udGVudHMgPSB0aGlzLl9jYWNoZWRDb250ZW50cztcbiAgICB0cnkge1xuICAgICAgdmFyIG5ld0NvbnRlbnRzID0gYXdhaXQgdGhpcy5yZWFkKC8qZmx1c2hDYWNoZSovIHRydWUpO1xuICAgICAgaWYgKG9sZENvbnRlbnRzICE9PSBuZXdDb250ZW50cykge1xuICAgICAgICB0aGlzLl9lbWl0dGVyLmVtaXQoJ2RpZC1jaGFuZ2UnKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgLy8gV2UgY2FuJ3QgcmVhZCB0aGUgZmlsZSwgc28gd2UgY2FuY2VsIHRoZSB3YXRjaGVyIHN1YnNjcmlwdGlvbi5cbiAgICAgIGF3YWl0IHRoaXMuX3Vuc3Vic2NyaWJlRnJvbU5hdGl2ZUNoYW5nZUV2ZW50cygpO1xuICAgICAgdmFyIGhhbmRsZWQgPSBmYWxzZTtcbiAgICAgIHZhciBoYW5kbGUgPSAoKSA9PiB7XG4gICAgICAgIGhhbmRsZWQgPSB0cnVlO1xuICAgICAgfTtcbiAgICAgIGVycm9yLmV2ZW50VHlwZSA9ICdjaGFuZ2UnO1xuICAgICAgdGhpcy5fZW1pdHRlci5lbWl0KCd3aWxsLXRocm93LXdhdGNoLWVycm9yJywge2Vycm9yLCBoYW5kbGV9KTtcbiAgICAgIGlmICghaGFuZGxlZCkge1xuICAgICAgICB2YXIgbmV3RXJyb3IgPSBuZXcgRXJyb3IoYENhbm5vdCByZWFkIGZpbGUgYWZ0ZXIgZmlsZSBjaGFuZ2UgZXZlbnQ6ICR7dGhpcy5fcGF0aH1gKTtcbiAgICAgICAgbmV3RXJyb3Iub3JpZ2luYWxFcnJvciA9IGVycm9yO1xuICAgICAgICBuZXdFcnJvci5jb2RlID0gJ0VOT0VOVCc7XG4gICAgICAgIHRocm93IG5ld0Vycm9yO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGFzeW5jIF9oYW5kbGVOYXRpdmVSZW5hbWVFdmVudChuZXdQYXRoOiBzdHJpbmcpOiBQcm9taXNlIHtcbiAgICBhd2FpdCB0aGlzLl91bnN1YnNjcmliZUZyb21OYXRpdmVDaGFuZ2VFdmVudHMoKTtcbiAgICB0aGlzLl9jYWNoZWRDb250ZW50cyA9IG51bGw7XG4gICAgdmFyIHtwcm90b2NvbCwgaG9zdH0gPSB1cmwucGFyc2UodGhpcy5fcGF0aCk7XG4gICAgdGhpcy5fbG9jYWxQYXRoID0gbmV3UGF0aDtcbiAgICB0aGlzLl9wYXRoID0gcHJvdG9jb2wgKyAnLy8nICsgaG9zdCArIHRoaXMuX2xvY2FsUGF0aDtcbiAgICBhd2FpdCB0aGlzLl9zdWJzY3JpYmVUb05hdGl2ZUNoYW5nZUV2ZW50cygpO1xuICAgIHRoaXMuX2VtaXR0ZXIuZW1pdCgnZGlkLXJlbmFtZScpO1xuICB9XG5cbiAgYXN5bmMgX2hhbmRsZU5hdGl2ZURlbGV0ZUV2ZW50KCk6IFByb21pc2Uge1xuICAgIGF3YWl0IHRoaXMuX3Vuc3Vic2NyaWJlRnJvbU5hdGl2ZUNoYW5nZUV2ZW50cygpO1xuICAgIHRoaXMuX2NhY2hlZENvbnRlbnRzID0gbnVsbDtcbiAgICBpZiAoIXRoaXMuX2RlbGV0ZWQpIHtcbiAgICAgIHRoaXMuX2RlbGV0ZWQgPSB0cnVlO1xuICAgICAgdGhpcy5fZW1pdHRlci5lbWl0KCdkaWQtZGVsZXRlJyk7XG4gICAgfVxuICB9XG5cbiAgLypcbiAgICogUmV0dXJuIGEgbmV3IERpc3Bvc2FibGUgdGhhdCB1cG9uIGRpc3Bvc2UsIHdpbGwgcmVtb3ZlIHRoZSBib3VuZCB3YXRjaCBzdWJzY3JpcHRpb24uXG4gICAqIFdoZW4gdGhlIG51bWJlciBvZiBzdWJzY3JpcHRpb25zIHJlYWNoIDAsIHRoZSBmaWxlIGlzIHVud2F0Y2hlZC5cbiAgICovXG4gIF90cmFja1Vuc3Vic2NyaXB0aW9uKHN1YnNjcmlwdGlvbjogRGlzcG9zYWJsZSk6IERpc3Bvc2FibGUge1xuICAgIHJldHVybiBuZXcgRGlzcG9zYWJsZSgoKSA9PiB7XG4gICAgICBzdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xuICAgICAgdGhpcy5fZGlkUmVtb3ZlU3Vic2NyaXB0aW9uKCk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBfZGlkUmVtb3ZlU3Vic2NyaXB0aW9uKCk6IFByb21pc2Uge1xuICAgIHRoaXMuX3N1YnNjcmlwdGlvbkNvdW50LS07XG4gICAgaWYgKHRoaXMuX3N1YnNjcmlwdGlvbkNvdW50ID09PSAwKSB7XG4gICAgICBhd2FpdCB0aGlzLl91bnN1YnNjcmliZUZyb21OYXRpdmVDaGFuZ2VFdmVudHMoKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBfdW5zdWJzY3JpYmVGcm9tTmF0aXZlQ2hhbmdlRXZlbnRzKCk6IFByb21pc2Uge1xuICAgIGlmICh0aGlzLl93YXRjaFN1YnNjcmlwdGlvbikge1xuICAgICAgYXdhaXQgdGhpcy5fcmVtb3RlLmdldENsaWVudCgpLnVud2F0Y2hGaWxlKHRoaXMuX2xvY2FsUGF0aCk7XG4gICAgICB0aGlzLl93YXRjaFN1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgb25XaWxsVGhyb3dXYXRjaEVycm9yKGNhbGxiYWNrKTogRGlzcG9zYWJsZSB7XG4gICAgcmV0dXJuIHRoaXMuX2VtaXR0ZXIub24oJ3dpbGwtdGhyb3ctd2F0Y2gtZXJyb3InLCBjYWxsYmFjayk7XG4gIH1cblxuICBpc0ZpbGUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBpc0RpcmVjdG9yeSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBleGlzdHMoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIHRoaXMuX3JlbW90ZS5nZXRDbGllbnQoKS5leGlzdHModGhpcy5fbG9jYWxQYXRoKTtcbiAgfVxuXG4gIGV4aXN0c1N5bmMoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBnZXREaWdlc3RTeW5jKCk6IHN0cmluZyB7XG4gICAgaWYgKHRoaXMuX2RpZ2VzdCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2RpZ2VzdDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdnZXREaWdlc3RTeW5jIGlzIG5vdCBzdXBwb3J0ZWQgaW4gUmVtb3RlRmlsZScpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGdldERpZ2VzdCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLl9kaWdlc3QpIHtcbiAgICAgIHJldHVybiB0aGlzLl9kaWdlc3Q7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMucmVhZCgpO1xuICAgIHJldHVybiB0aGlzLl9kaWdlc3Q7XG4gIH1cblxuICBfc2V0RGlnZXN0KGNvbnRlbnRzOiBzdHJpbmcpIHtcbiAgICB0aGlzLl9kaWdlc3QgPSBjcnlwdG8uY3JlYXRlSGFzaCgnc2hhMScpLnVwZGF0ZShjb250ZW50cyB8fCAnJykuZGlnZXN0KCdoZXgnKTtcbiAgfVxuXG4gIHNldEVuY29kaW5nKGVuY29kaW5nOiBzdHJpbmcpIHtcbiAgICB0aGlzLl9lbmNvZGluZyA9IGVuY29kaW5nO1xuICB9XG5cbiAgZ2V0RW5jb2RpbmcoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fZW5jb2Rpbmc7XG4gIH1cblxuICBnZXRQYXRoKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuX3BhdGg7XG4gIH1cblxuICBnZXRMb2NhbFBhdGgoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fbG9jYWxQYXRoO1xuICB9XG5cbiAgZ2V0UmVhbFBhdGhTeW5jKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuX3JlYWxwYXRoIHx8IHRoaXMuX3BhdGg7XG4gIH1cblxuICBhc3luYyBnZXRSZWFsUGF0aCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICghdGhpcy5fcmVhbHBhdGgpIHtcbiAgICAgIHRoaXMuX3JlYWxwYXRoID0gYXdhaXQgdGhpcy5fcmVtb3RlLmdldENsaWVudCgpLnJlYWxwYXRoKHRoaXMuX2xvY2FsUGF0aCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9yZWFscGF0aDtcbiAgfVxuXG4gIGdldEJhc2VOYW1lKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHBhdGhVdGlsLmJhc2VuYW1lKHRoaXMuX3BhdGgpO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlKCk6IFByb21pc2Uge1xuICAgIGF3YWl0IHRoaXMuX3JlbW90ZS5nZXRDbGllbnQoKS5uZXdGaWxlKHRoaXMuX2xvY2FsUGF0aCk7XG4gICAgaWYgKHRoaXMuX3N1YnNjcmlwdGlvbkNvdW50ID4gMCkge1xuICAgICAgdGhpcy5fc3Vic2NyaWJlVG9OYXRpdmVDaGFuZ2VFdmVudHMoKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBkZWxldGUoKTogUHJvbWlzZSB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuX3JlbW90ZS5nZXRDbGllbnQoKS51bmxpbmsodGhpcy5fbG9jYWxQYXRoKTtcbiAgICAgIHRoaXMuX2hhbmRsZU5hdGl2ZURlbGV0ZUV2ZW50KCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmIChlcnJvci5jb2RlICE9PSAnRU5PRU5UJykge1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBhc3luYyByZW5hbWUobmV3UGF0aDogc3RyaW5nKTogUHJvbWlzZSB7XG4gICAgYXdhaXQgdGhpcy5fcmVtb3RlLmdldENsaWVudCgpLnJlbmFtZSh0aGlzLl9sb2NhbFBhdGgsIG5ld1BhdGgpO1xuICAgIGF3YWl0IHRoaXMuX2hhbmRsZU5hdGl2ZVJlbmFtZUV2ZW50KG5ld1BhdGgpO1xuICB9XG5cbiAgYXN5bmMgcmVhZChmbHVzaENhY2hlOiBib29sZWFuKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAvLyBUT0RPOiByZXR1cm4gY2FjaGVkQ29udGVudHMgaWYgZXhpc3RzIGFuZCAhZmx1c2hDYWNoZVxuICAgIC8vIFRoaXMgaW52b2x2ZXMgdGhlIHJlbG9hZCBzY2VuYXJpbywgd2hlcmUgdGhlIHNhbWUgaW5zdGFuY2Ugb2YgdGhlIGZpbGUgaXMgcmVhZCgpLFxuICAgIC8vIGJ1dCB0aGUgZmlsZSBjb250ZW50cyBzaG91bGQgcmVsb2FkLlxuICAgIHZhciBkYXRhID0gYXdhaXQgdGhpcy5fcmVtb3RlLmdldENsaWVudCgpLnJlYWRGaWxlKHRoaXMuX2xvY2FsUGF0aCk7XG4gICAgdmFyIGNvbnRlbnRzID0gZGF0YS50b1N0cmluZygpO1xuICAgIHRoaXMuX3NldERpZ2VzdChjb250ZW50cyk7XG4gICAgdGhpcy5fY2FjaGVkQ29udGVudHMgPSBjb250ZW50cztcbiAgICAvLyBUT0RPOiByZXNwZWN0IGVuY29kaW5nXG4gICAgcmV0dXJuIGNvbnRlbnRzO1xuICB9XG5cbiAgcmVhZFN5bmMoZmx1c2hjYWNoZTogYm9vbGVhbik6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdyZWFkU3luYyBpcyBub3Qgc3VwcG9ydGVkIGluIFJlbW90ZUZpbGUnKTtcbiAgfVxuXG4gIGFzeW5jIHdyaXRlKHRleHQ6IHN0cmluZyk6IFByb21pc2Uge1xuICAgIHZhciBwcmV2aW91c2x5RXhpc3RlZCA9IGF3YWl0IHRoaXMuZXhpc3RzKCk7XG4gICAgYXdhaXQgdGhpcy5fcmVtb3RlLmdldENsaWVudCgpLndyaXRlRmlsZSh0aGlzLl9sb2NhbFBhdGgsIHRleHQpO1xuICAgIHRoaXMuX2NhY2hlZENvbnRlbnRzID0gdGV4dDtcbiAgICBpZiAoIXByZXZpb3VzbHlFeGlzdGVkICYmIHRoaXMuX3N1YnNjcmlwdGlvbkNvdW50ID4gMCkge1xuICAgICAgYXdhaXQgdGhpcy5fc3Vic2NyaWJlVG9OYXRpdmVDaGFuZ2VFdmVudHMoKTtcbiAgICB9XG4gIH1cblxuICBnZXRQYXJlbnQoKTogUmVtb3RlRGlyZWN0b3J5IHtcbiAgICB2YXIge3BhdGg6IGxvY2FsUGF0aCwgcHJvdG9jb2wsIGhvc3R9ID0gdXJsLnBhcnNlKHRoaXMuX3BhdGgpO1xuICAgIHZhciBkaXJlY3RvcnlQYXRoID0gcHJvdG9jb2wgKyAnLy8nICsgaG9zdCArIHBhdGhVdGlsLmRpcm5hbWUobG9jYWxQYXRoKTtcbiAgICByZXR1cm4gdGhpcy5fcmVtb3RlLmNyZWF0ZURpcmVjdG9yeShkaXJlY3RvcnlQYXRoKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbW90ZUZpbGU7XG4iXX0=