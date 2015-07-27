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

var _require = require('atom');

var CompositeDisposable = _require.CompositeDisposable;
var Disposable = _require.Disposable;

var net = require('net');
var url = require('url');
var logger = require('nuclide-logging').getLogger();

var _require2 = require('events');

var EventEmitter = _require2.EventEmitter;

var RemoteFile = require('./RemoteFile');
var RemoteDirectory = require('./RemoteDirectory');
var NuclideClient = require('nuclide-server/lib/NuclideClient');
var NuclideRemoteEventbus = require('nuclide-server/lib/NuclideRemoteEventbus');

var _require3 = require('nuclide-commons');

var fsPromise = _require3.fsPromise;

var _require4 = require('nuclide-version');

var getVersion = _require4.getVersion;

var HEARTBEAT_AWAY_REPORT_COUNT = 3;
var HEARTBEAT_NOTIFICATION_ERROR = 1;
var HEARTBEAT_NOTIFICATION_WARNING = 2;

var _connections = [];
var _emitter = new EventEmitter();

var RemoteConnection = (function () {
  function RemoteConnection(config) {
    _classCallCheck(this, RemoteConnection);

    this._subscriptions = new CompositeDisposable();
    this._entries = {};
    this._config = config;
    this._heartbeatNetworkAwayCount = 0;
    this._closed = false;
  }

  _createClass(RemoteConnection, [{
    key: 'dispose',
    value: function dispose() {
      this._subscriptions.dispose();
    }
  }, {
    key: '_setHgRepoInfo',

    // A workaround before Atom 2.0: Atom's Project::setPaths currently uses
    // ::repositoryForDirectorySync, so we need the repo information to already be
    // available when the new path is added. t6913624 tracks cleanup of this.
    value: _asyncToGenerator(function* () {
      var eventBus = this.getClient().eventbus;
      var remotePath = this.getPathForInitialWorkingDirectory();
      var hgRepoDescription = yield eventBus.callMethod(
      /*serviceName*/'sourceControl',
      /*methodName*/'getHgRepository',
      /*methodArgs*/[remotePath],
      /*extraOptions*/{ method: 'POST', json: true });
      this._setHgRepositoryDescription(hgRepoDescription);
    })
  }, {
    key: '_monitorConnectionHeartbeat',
    value: function _monitorConnectionHeartbeat() {
      var _this = this;

      var socket = this.getClient().eventbus.socket;
      var serverUri = socket.getServerUri();

      /**
       * Adds an Atom notification for the detected heartbeat network status
       * The function makes sure not to add many notifications for the same event and prioritize new events.
       */
      var addHeartbeatNotification = function addHeartbeatNotification(type, errorCode, message, dismissable) {
        var _ref = _this._lastHeartbeatNotification || {};

        var code = _ref.code;
        var existingNotification = _ref.notification;

        if (code && code === errorCode && dismissable) {
          // A dismissible heartbeat notification with this code is already active.
          return;
        }
        var notification;
        switch (type) {
          case HEARTBEAT_NOTIFICATION_ERROR:
            notification = atom.notifications.addError(message, { dismissable: dismissable });
            break;
          case HEARTBEAT_NOTIFICATION_WARNING:
            notification = atom.notifications.addWarning(message, { dismissable: dismissable });
            break;
          default:
            throw new Error('Unrecongnized heartbeat notification type');
        }
        if (existingNotification) {
          existingNotification.dismiss();
        }
        _this._lastHeartbeatNotification = {
          notification: notification,
          code: errorCode
        };
      };

      var onHeartbeat = function onHeartbeat() {
        if (_this._lastHeartbeatNotification) {
          // If there has been existing heartbeat error/warning,
          // that means connection has been lost and we shall show a message about connection
          // being restored without a reconnect prompt.
          var notification = _this._lastHeartbeatNotification.notification;

          notification.dismiss();
          atom.notifications.addSuccess('Connection restored to Nuclide Server at: ' + serverUri);
          _this._heartbeatNetworkAwayCount = 0;
          _this._lastHeartbeatNotification = null;
        }
      };

      var notifyNetworkAway = function notifyNetworkAway(code) {
        _this._heartbeatNetworkAwayCount++;
        if (_this._heartbeatNetworkAwayCount >= HEARTBEAT_AWAY_REPORT_COUNT) {
          addHeartbeatNotification(HEARTBEAT_NOTIFICATION_WARNING, code, 'Nuclide server can not be reached at: ' + serverUri + '<br/>Check your network connection!',
          /*dismissable*/true);
        }
      };

      var onHeartbeatError = function onHeartbeatError(error) {
        var code = error.code;
        var message = error.message;
        var originalCode = error.originalCode;

        logger.info('Heartbeat network error:', code, originalCode, message);
        switch (code) {
          case 'NETWORK_AWAY':
            // Notify switching networks, disconnected, timeout, unreachable server or fragile connection.
            notifyNetworkAway(code);
            break;
          case 'SERVER_CRASHED':
            // Server shut down or port no longer accessible.
            // Notify the server was there, but now gone.
            addHeartbeatNotification(HEARTBEAT_NOTIFICATION_ERROR, code, 'Nuclide server crashed!<br/>' + 'Please reload Nuclide to restore your remote project connection! : (⌃-⌥-⌘-L)',
            /*dismissable*/true);
            // TODO(most) reconnect RemoteConnection, restore the current project state,
            // and finally change dismissable to false and type to 'WARNING'.
            break;
          case 'PORT_NOT_ACCESSIBLE':
            // Notify never heard a heartbeat from the server.

            var _url$parse = url.parse(serverUri),
                port = _url$parse.port;

            addHeartbeatNotification(HEARTBEAT_NOTIFICATION_ERROR, code, 'Nuclide server is not reachable.<br/>It could be running on a port that is not accessible: ' + port,
            /*dismissable*/true);
            break;
          case 'INVALID_CERTIFICATE':
            // Notify the client certificate is not accepted by nuclide server (certificate mismatch).
            addHeartbeatNotification(HEARTBEAT_NOTIFICATION_ERROR, code, 'Connection Reset Error!!<br/>This could be caused by the client certificate mismatching the server certificate.<br/>' + 'Please reload Nuclide to restore your remote project connection! : (⌃-⌥-⌘-L)',
            /*dismissable*/true);
            // TODO(most): reconnect RemoteConnection, restore the current project state.
            // and finally change dismissable to false and type to 'WARNING'.
            break;
          default:
            notifyNetworkAway(code);
            logger.error('Unrecongnized heartbeat error code: ' + code, message);
            break;
        }
      };
      socket.on('heartbeat', onHeartbeat);
      socket.on('heartbeat.error', onHeartbeatError);

      this._subscriptions.add(new Disposable(function () {
        socket.removeListener('heartbeat', onHeartbeat);
        socket.removeListener('heartbeat.error', onHeartbeatError);
      }));
    }
  }, {
    key: 'getUriOfRemotePath',
    value: function getUriOfRemotePath(remotePath) {
      return 'nuclide://' + this.getRemoteHost() + remotePath;
    }
  }, {
    key: 'getPathOfUri',
    value: function getPathOfUri(uri) {
      return url.parse(uri).path;
    }
  }, {
    key: 'createDirectory',
    value: function createDirectory(uri) {
      var _url$parse2 = url.parse(uri);

      var path = _url$parse2.path;

      path = require('path').normalize(path);

      var entry = this._entries[path];
      if (!entry || entry.getLocalPath() !== path) {
        this._entries[path] = entry = new RemoteDirectory(this, this.getUriOfRemotePath(path), { hgRepositoryDescription: this._hgRepositoryDescription });
        // TODO: We should add the following line to keep the cache up-to-date.
        // We need to implement onDidRename and onDidDelete in RemoteDirectory
        // first. It's ok that we don't add the handlers for now since we have
        // the check `entry.getLocalPath() !== path` above.
        //
        // this._addHandlersForEntry(entry);
      }

      if (!entry.isDirectory()) {
        throw new Error('Path is not a directory:' + uri);
      }

      return entry;
    }
  }, {
    key: '_setHgRepositoryDescription',

    // A workaround before Atom 2.0: see ::getHgRepoInfo of main.js.
    value: function _setHgRepositoryDescription(hgRepositoryDescription) {
      this._hgRepositoryDescription = hgRepositoryDescription;
    }
  }, {
    key: 'createFile',
    value: function createFile(uri) {
      var _url$parse3 = url.parse(uri);

      var path = _url$parse3.path;

      path = require('path').normalize(path);

      var entry = this._entries[path];
      if (!entry || entry.getLocalPath() !== path) {
        this._entries[path] = entry = new RemoteFile(this, this.getUriOfRemotePath(path));
        this._addHandlersForEntry(entry);
      }

      if (entry.isDirectory()) {
        throw new Error('Path is not a file');
      }

      return entry;
    }
  }, {
    key: '_addHandlersForEntry',
    value: function _addHandlersForEntry(entry) {
      var _this2 = this;

      var oldPath = entry.getLocalPath();
      var renameSubscription = entry.onDidRename(function () {
        delete _this2._entries[oldPath];
        _this2._entries[entry.getLocalPath()] = entry;
      });
      var deleteSubscription = entry.onDidDelete(function () {
        delete _this2._entries[entry.getLocalPath()];
        renameSubscription.dispose();
        deleteSubscription.dispose();
      });
    }
  }, {
    key: 'initialize',
    value: _asyncToGenerator(function* () {
      // Right now we don't re-handshake.
      if (this._initialized === undefined) {
        this._initialized = false;
        // Do version check.
        var client = this._getClient();
        var serverVersion;
        try {
          serverVersion = yield client.version();
        } catch (e) {
          client.close();
          throw e;
        }
        var clientVersion = getVersion();
        if (clientVersion != serverVersion) {
          client.close();
          throw new Error('Version mismatch. Client at ' + clientVersion + ' while server at ' + serverVersion + '.');
        }
        this._initialized = true;
        this._monitorConnectionHeartbeat();
        // A workaround before Atom 2.0: see ::getHgRepoInfo.
        yield this._setHgRepoInfo();
        // Save to cache.
        this._addConnection();
      }
    })
  }, {
    key: '_addConnection',
    value: function _addConnection() {
      _connections.push(this);
      _emitter.emit('did-add', this);
    }
  }, {
    key: 'close',
    value: function close() {
      // Close the eventbus that will stop the heartbeat interval, websocket reconnect trials, ..etc.
      if (this._client) {
        this._client.close();
        this._client = null;
      }
      if (!this._closed) {
        // Future getClient calls should fail, if it has a cached RemoteConnection instance.
        this._closed = true;
        // Remove from _connections to not be considered in future connection queries.
        _connections.splice(_connections.indexOf(this), 1);
        _emitter.emit('did-close', this);
      }
    }
  }, {
    key: 'getClient',
    value: function getClient() {
      if (!this._initialized) {
        throw new Error('Remote connection has not been initialized.');
      } else if (this._closed) {
        throw new Error('Remote connection has been closed.');
      } else {
        return this._getClient();
      }
    }
  }, {
    key: '_getClient',
    value: function _getClient() {
      if (!this._client) {
        var uri;
        var cwd = this._config.cwd;
        var options = {};

        // Use https if we have key, cert, and ca
        if (this._isSecure()) {
          options.certificateAuthorityCertificate = this._config.certificateAuthorityCertificate;
          options.clientCertificate = this._config.clientCertificate;
          options.clientKey = this._config.clientKey;
          uri = 'https://' + this.getRemoteHost();
        } else {
          uri = 'http://' + this.getRemoteHost();
        }

        // The remote connection and client are identified by both the remote host and the inital working directory.
        var clientId = this.getRemoteHost() + this.getPathForInitialWorkingDirectory();
        this._client = new NuclideClient(clientId, new NuclideRemoteEventbus(uri, options), { cwd: cwd });
        // Start watching the project for changes.
        this._client.watchDirectoryRecursive(cwd, /* do nothing on change */function () {})['catch'](function (err) {
          var warningMessage = 'Watcher failed to start - watcher features disabled!<br/>' + (err.message ? 'DETAILS: ' + err.message : '');
          // Add a persistent warning message to make sure the user sees it and intentionally dismissing it.
          atom.notifications.addWarning(warningMessage, { dismissable: true });
        });
      }
      return this._client;
    }
  }, {
    key: 'makeRpc',

    /**
     * Make rpc call through this connection given serviceUri in form of `$serviceName/$methodName`
     * and args as arguments list.
     */
    value: function makeRpc(serviceUri, args, serviceOptions) {
      return this.getClient().makeRpc(serviceUri, args, serviceOptions);
    }
  }, {
    key: 'registerEventListener',
    value: function registerEventListener(eventName, callback, serviceOptions) {
      return this.getClient().registerEventListener(eventName, callback, serviceOptions);
    }
  }, {
    key: '_isSecure',
    value: function _isSecure() {
      return this._config.certificateAuthorityCertificate && this._config.clientCertificate && this._config.clientKey;
    }
  }, {
    key: 'getRemoteHost',
    value: function getRemoteHost() {
      return this._config.host + ':' + this._config.port;
    }
  }, {
    key: 'getRemoteHostname',
    value: function getRemoteHostname() {
      return this._config.host;
    }
  }, {
    key: 'getUriForInitialWorkingDirectory',
    value: function getUriForInitialWorkingDirectory() {
      return this.getUriOfRemotePath(this.getPathForInitialWorkingDirectory());
    }
  }, {
    key: 'getPathForInitialWorkingDirectory',
    value: function getPathForInitialWorkingDirectory() {
      return this._config.cwd;
    }
  }, {
    key: 'getConfig',
    value: function getConfig() {
      return this._config;
    }
  }], [{
    key: 'onDidAddRemoteConnection',
    value: function onDidAddRemoteConnection(handler) {
      _emitter.on('did-add', handler);
      return new Disposable(function () {
        _emitter.removeListener('did-add', handler);
      });
    }
  }, {
    key: 'onDidCloseRemoteConnection',
    value: function onDidCloseRemoteConnection(handler) {
      _emitter.on('did-close', handler);
      return new Disposable(function () {
        _emitter.removeListener('did-close', handler);
      });
    }
  }, {
    key: 'getForUri',
    value: function getForUri(uri) {
      var _url$parse4 = url.parse(uri);

      var hostname = _url$parse4.hostname;
      var path = _url$parse4.path;

      return RemoteConnection.getByHostnameAndPath(hostname, path);
    }
  }, {
    key: 'getByHostnameAndPath',

    /**
     * Get cached connection match the hostname and the path has the prefix of connection.cwd. If path is null,
     * then return the connection who matches the hostname and ignore connection.cwd.
     */
    value: function getByHostnameAndPath(hostname, path) {
      return _connections.filter(function (connection) {
        return connection.getRemoteHostname() === hostname && (path === null || path.startsWith(connection.getPathForInitialWorkingDirectory()));
      })[0];
    }
  }, {
    key: 'getByHostname',
    value: function getByHostname(hostname) {
      return _connections.filter(function (connection) {
        return connection.getRemoteHostname() === hostname;
      });
    }
  }]);

  return RemoteConnection;
})();

// Expose local variables for testability.
RemoteConnection.test = {
  connections: _connections
};

module.exports = RemoteConnection;
// host nuclide server is running on.
// port to connect to.
// Path to remote directory user should start in upon connection.
// certificate of certificate authority.
// client certificate for https connection.
// key for https connection.
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9ub2RlX21vZHVsZXMvbnVjbGlkZS1yZW1vdGUtY29ubmVjdGlvbi9saWIvUmVtb3RlQ29ubmVjdGlvbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7OztlQVc0QixPQUFPLENBQUMsTUFBTSxDQUFDOztJQUFsRCxtQkFBbUIsWUFBbkIsbUJBQW1CO0lBQUUsVUFBVSxZQUFWLFVBQVU7O0FBQ3BDLElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN6QixJQUFJLEdBQUcsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDekIsSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7O2dCQUMvQixPQUFPLENBQUMsUUFBUSxDQUFDOztJQUFqQyxZQUFZLGFBQVosWUFBWTs7QUFFakIsSUFBSSxVQUFVLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3pDLElBQUksZUFBZSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0FBQ25ELElBQUksYUFBYSxHQUFHLE9BQU8sQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO0FBQ2hFLElBQUkscUJBQXFCLEdBQUcsT0FBTyxDQUFDLDBDQUEwQyxDQUFDLENBQUM7O2dCQUM5RCxPQUFPLENBQUMsaUJBQWlCLENBQUM7O0lBQXZDLFNBQVMsYUFBVCxTQUFTOztnQkFDSyxPQUFPLENBQUMsaUJBQWlCLENBQUM7O0lBQXhDLFVBQVUsYUFBVixVQUFVOztBQUVmLElBQU0sMkJBQTJCLEdBQUcsQ0FBQyxDQUFDO0FBQ3RDLElBQU0sNEJBQTRCLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZDLElBQU0sOEJBQThCLEdBQUcsQ0FBQyxDQUFDOztBQWdCekMsSUFBSSxZQUFxQyxHQUFHLEVBQUUsQ0FBQztBQUMvQyxJQUFJLFFBQXNCLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQzs7SUFFMUMsZ0JBQWdCO0FBU1QsV0FUUCxnQkFBZ0IsQ0FTUixNQUFxQyxFQUFFOzBCQVQvQyxnQkFBZ0I7O0FBVWxCLFFBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxtQkFBbUIsRUFBRSxDQUFDO0FBQ2hELFFBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO0FBQ25CLFFBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO0FBQ3RCLFFBQUksQ0FBQywwQkFBMEIsR0FBRyxDQUFDLENBQUM7QUFDcEMsUUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7R0FDdEI7O2VBZkcsZ0JBQWdCOztXQWlCYixtQkFBUztBQUNkLFVBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLENBQUM7S0FDL0I7Ozs7Ozs7NkJBS21CLGFBQVM7QUFDM0IsVUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLFFBQVEsQ0FBQztBQUN6QyxVQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsaUNBQWlDLEVBQUUsQ0FBQztBQUMxRCxVQUFJLGlCQUFpQixHQUFHLE1BQU0sUUFBUSxDQUFDLFVBQVU7cUJBQy9CLGVBQWU7b0JBQ2hCLGlCQUFpQjtvQkFDakIsQ0FBQyxVQUFVLENBQUM7c0JBQ1YsRUFBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUMsQ0FDOUMsQ0FBQztBQUNGLFVBQUksQ0FBQywyQkFBMkIsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0tBQ3JEOzs7V0FFMEIsdUNBQUc7OztBQUM1QixVQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQztBQUM5QyxVQUFJLFNBQVMsR0FBRyxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUM7Ozs7OztBQU10QyxVQUFJLHdCQUF3QixHQUFHLFNBQTNCLHdCQUF3QixDQUFJLElBQUksRUFBVSxTQUFTLEVBQVUsT0FBTyxFQUFVLFdBQVcsRUFBYzttQkFDeEQsTUFBSywwQkFBMEIsSUFBSSxFQUFFOztZQUFqRixJQUFJLFFBQUosSUFBSTtZQUFnQixvQkFBb0IsUUFBbEMsWUFBWTs7QUFDdkIsWUFBSSxJQUFJLElBQUksSUFBSSxLQUFLLFNBQVMsSUFBSSxXQUFXLEVBQUU7O0FBRTdDLGlCQUFPO1NBQ1I7QUFDRCxZQUFJLFlBQVksQ0FBQztBQUNqQixnQkFBUSxJQUFJO0FBQ1YsZUFBSyw0QkFBNEI7QUFDL0Isd0JBQVksR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsRUFBQyxXQUFXLEVBQVgsV0FBVyxFQUFDLENBQUMsQ0FBQztBQUNuRSxrQkFBTTtBQUFBLGVBQ0gsOEJBQThCO0FBQ2pDLHdCQUFZLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLEVBQUMsV0FBVyxFQUFYLFdBQVcsRUFBQyxDQUFDLENBQUM7QUFDckUsa0JBQU07QUFBQTtBQUVOLGtCQUFNLElBQUksS0FBSyxDQUFDLDJDQUEyQyxDQUFDLENBQUM7QUFBQSxTQUNoRTtBQUNELFlBQUksb0JBQW9CLEVBQUU7QUFDeEIsOEJBQW9CLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDaEM7QUFDRCxjQUFLLDBCQUEwQixHQUFHO0FBQ2hDLHNCQUFZLEVBQVosWUFBWTtBQUNaLGNBQUksRUFBRSxTQUFTO1NBQ2hCLENBQUM7T0FDSCxDQUFDOztBQUVGLFVBQUksV0FBVyxHQUFHLFNBQWQsV0FBVyxHQUFTO0FBQ3RCLFlBQUksTUFBSywwQkFBMEIsRUFBRTs7OztjQUk5QixZQUFZLEdBQUksTUFBSywwQkFBMEIsQ0FBL0MsWUFBWTs7QUFDakIsc0JBQVksQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUN2QixjQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyw0Q0FBNEMsR0FBRyxTQUFTLENBQUMsQ0FBQztBQUN4RixnQkFBSywwQkFBMEIsR0FBRyxDQUFDLENBQUM7QUFDcEMsZ0JBQUssMEJBQTBCLEdBQUcsSUFBSSxDQUFDO1NBQ3hDO09BQ0YsQ0FBQzs7QUFFRixVQUFJLGlCQUFpQixHQUFHLFNBQXBCLGlCQUFpQixDQUFJLElBQUksRUFBYTtBQUN4QyxjQUFLLDBCQUEwQixFQUFFLENBQUM7QUFDbEMsWUFBSSxNQUFLLDBCQUEwQixJQUFJLDJCQUEyQixFQUFFO0FBQ2xFLGtDQUF3QixDQUFDLDhCQUE4QixFQUFFLElBQUksRUFDM0Qsd0NBQXdDLEdBQUcsU0FBUyxHQUNwRCxxQ0FBcUM7eUJBQ3JCLElBQUksQ0FBQyxDQUFDO1NBQ3pCO09BQ0YsQ0FBQzs7QUFFRixVQUFJLGdCQUFnQixHQUFHLFNBQW5CLGdCQUFnQixDQUFJLEtBQUssRUFBVTtZQUNoQyxJQUFJLEdBQTJCLEtBQUssQ0FBcEMsSUFBSTtZQUFFLE9BQU8sR0FBa0IsS0FBSyxDQUE5QixPQUFPO1lBQUUsWUFBWSxHQUFJLEtBQUssQ0FBckIsWUFBWTs7QUFDaEMsY0FBTSxDQUFDLElBQUksQ0FBQywwQkFBMEIsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ3JFLGdCQUFRLElBQUk7QUFDUixlQUFLLGNBQWM7O0FBRWpCLDZCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3hCLGtCQUFNO0FBQUEsZUFDSCxnQkFBZ0I7OztBQUduQixvQ0FBd0IsQ0FBQyw0QkFBNEIsRUFBRSxJQUFJLEVBQ3ZELDhCQUE4QixHQUM5Qiw4RUFBOEU7MkJBQzlELElBQUksQ0FBQyxDQUFDOzs7QUFHMUIsa0JBQU07QUFBQSxlQUNILHFCQUFxQjs7OzZCQUVYLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDO2dCQUE1QixJQUFJLGNBQUosSUFBSTs7QUFDVCxvQ0FBd0IsQ0FBQyw0QkFBNEIsRUFBRSxJQUFJLEVBQ3ZELDZGQUE2RixHQUFHLElBQUk7MkJBQ3BGLElBQUksQ0FBQyxDQUFDO0FBQzFCLGtCQUFNO0FBQUEsZUFDSCxxQkFBcUI7O0FBRXhCLG9DQUF3QixDQUFDLDRCQUE0QixFQUFFLElBQUksRUFDdkQsc0hBQXNILEdBQ3RILDhFQUE4RTsyQkFDOUQsSUFBSSxDQUFDLENBQUM7OztBQUcxQixrQkFBTTtBQUFBO0FBRU4sNkJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDeEIsa0JBQU0sQ0FBQyxLQUFLLENBQUMsc0NBQXNDLEdBQUcsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ3JFLGtCQUFNO0FBQUEsU0FDVDtPQUNKLENBQUM7QUFDRixZQUFNLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQztBQUNwQyxZQUFNLENBQUMsRUFBRSxDQUFDLGlCQUFpQixFQUFFLGdCQUFnQixDQUFDLENBQUM7O0FBRS9DLFVBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksVUFBVSxDQUFDLFlBQU07QUFDM0MsY0FBTSxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDaEQsY0FBTSxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO09BQzVELENBQUMsQ0FBQyxDQUFDO0tBQ0w7OztXQUVpQiw0QkFBQyxVQUFrQixFQUFVO0FBQzdDLDRCQUFvQixJQUFJLENBQUMsYUFBYSxFQUFFLEdBQUcsVUFBVSxDQUFHO0tBQ3pEOzs7V0FFVyxzQkFBQyxHQUFXLEVBQVU7QUFDaEMsYUFBTyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztLQUM1Qjs7O1dBRWMseUJBQUMsR0FBVyxFQUFvQjt3QkFDaEMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7O1VBQXRCLElBQUksZUFBSixJQUFJOztBQUNULFVBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDOztBQUV2QyxVQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2hDLFVBQUksQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLFlBQVksRUFBRSxLQUFLLElBQUksRUFBRTtBQUMzQyxZQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssR0FBRyxJQUFJLGVBQWUsQ0FDL0MsSUFBSSxFQUNKLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFDN0IsRUFBQyx1QkFBdUIsRUFBRSxJQUFJLENBQUMsd0JBQXdCLEVBQUMsQ0FDekQsQ0FBQzs7Ozs7OztPQU9IOztBQUVELFVBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLEVBQUU7QUFDeEIsY0FBTSxJQUFJLEtBQUssQ0FBQywwQkFBMEIsR0FBRyxHQUFHLENBQUMsQ0FBQztPQUNuRDs7QUFFRCxhQUFPLEtBQUssQ0FBQztLQUNkOzs7OztXQUcwQixxQ0FBQyx1QkFBdUIsRUFBUTtBQUN6RCxVQUFJLENBQUMsd0JBQXdCLEdBQUcsdUJBQXVCLENBQUM7S0FDekQ7OztXQUVTLG9CQUFDLEdBQVcsRUFBZTt3QkFDdEIsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7O1VBQXRCLElBQUksZUFBSixJQUFJOztBQUNULFVBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDOztBQUV2QyxVQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2hDLFVBQUksQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLFlBQVksRUFBRSxLQUFLLElBQUksRUFBRTtBQUMzQyxZQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssR0FBRyxJQUFJLFVBQVUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDbEYsWUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxDQUFDO09BQ2xDOztBQUVELFVBQUksS0FBSyxDQUFDLFdBQVcsRUFBRSxFQUFFO0FBQ3ZCLGNBQU0sSUFBSSxLQUFLLENBQUMsb0JBQW9CLENBQUMsQ0FBQztPQUN2Qzs7QUFFRCxhQUFPLEtBQUssQ0FBQztLQUNkOzs7V0FFbUIsOEJBQUMsS0FBdUIsRUFBUTs7O0FBQ2xELFVBQUksT0FBTyxHQUFHLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQztBQUNuQyxVQUFJLGtCQUFrQixHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsWUFBTTtBQUMvQyxlQUFPLE9BQUssUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzlCLGVBQUssUUFBUSxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQztPQUM3QyxDQUFDLENBQUM7QUFDSCxVQUFJLGtCQUFrQixHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsWUFBTTtBQUMvQyxlQUFPLE9BQUssUUFBUSxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO0FBQzNDLDBCQUFrQixDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQzdCLDBCQUFrQixDQUFDLE9BQU8sRUFBRSxDQUFDO09BQzlCLENBQUMsQ0FBQztLQUNKOzs7NkJBRWUsYUFBUzs7QUFFdkIsVUFBSSxJQUFJLENBQUMsWUFBWSxLQUFLLFNBQVMsRUFBRTtBQUNuQyxZQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQzs7QUFFMUIsWUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQy9CLFlBQUksYUFBYSxDQUFDO0FBQ2xCLFlBQUk7QUFDRix1QkFBYSxHQUFHLE1BQU0sTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQ3hDLENBQUMsT0FBTyxDQUFDLEVBQUU7QUFDVixnQkFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2YsZ0JBQU0sQ0FBQyxDQUFDO1NBQ1Q7QUFDRCxZQUFJLGFBQWEsR0FBRyxVQUFVLEVBQUUsQ0FBQztBQUNqQyxZQUFJLGFBQWEsSUFBSSxhQUFhLEVBQUU7QUFDbEMsZ0JBQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNmLGdCQUFNLElBQUksS0FBSyxrQ0FBZ0MsYUFBYSx5QkFBb0IsYUFBYSxPQUFJLENBQUM7U0FDbkc7QUFDRCxZQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztBQUN6QixZQUFJLENBQUMsMkJBQTJCLEVBQUUsQ0FBQzs7QUFFbkMsY0FBTSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7O0FBRTVCLFlBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztPQUN2QjtLQUNGOzs7V0FFYSwwQkFBRztBQUNmLGtCQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3hCLGNBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQ2hDOzs7V0FFSSxpQkFBUzs7QUFFWixVQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7QUFDaEIsWUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNyQixZQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztPQUNyQjtBQUNELFVBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFOztBQUVqQixZQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQzs7QUFFcEIsb0JBQVksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNuRCxnQkFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7T0FDbEM7S0FDRjs7O1dBRVEscUJBQWtCO0FBQ3pCLFVBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFO0FBQ3RCLGNBQU0sSUFBSSxLQUFLLENBQUMsNkNBQTZDLENBQUMsQ0FBQztPQUNoRSxNQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtBQUN2QixjQUFNLElBQUksS0FBSyxDQUFDLG9DQUFvQyxDQUFDLENBQUM7T0FDdkQsTUFBTTtBQUNMLGVBQU8sSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO09BQzFCO0tBQ0Y7OztXQUVTLHNCQUFrQjtBQUMxQixVQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtBQUNqQixZQUFJLEdBQUcsQ0FBQztBQUNSLFlBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDO0FBQzNCLFlBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQzs7O0FBR2pCLFlBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxFQUFFO0FBQ3BCLGlCQUFPLENBQUMsK0JBQStCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQywrQkFBK0IsQ0FBQztBQUN2RixpQkFBTyxDQUFDLGlCQUFpQixHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUM7QUFDM0QsaUJBQU8sQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUM7QUFDM0MsYUFBRyxnQkFBYyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUc7U0FDekMsTUFBTTtBQUNMLGFBQUcsZUFBYSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUc7U0FDeEM7OztBQUdELFlBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsR0FBRyxJQUFJLENBQUMsaUNBQWlDLEVBQUUsQ0FBQztBQUMvRSxZQUFJLENBQUMsT0FBTyxHQUFHLElBQUksYUFBYSxDQUFDLFFBQVEsRUFBRSxJQUFJLHFCQUFxQixDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsRUFBRSxFQUFDLEdBQUcsRUFBSCxHQUFHLEVBQUMsQ0FBQyxDQUFDOztBQUUzRixZQUFJLENBQUMsT0FBTyxDQUFDLHVCQUF1QixDQUFDLEdBQUcsNEJBQTRCLFlBQU0sRUFBRSxDQUFDLFNBQU0sQ0FBQyxVQUFDLEdBQUcsRUFBSztBQUMzRixjQUFJLGNBQWMsR0FBRywyREFBMkQsSUFDM0UsR0FBRyxDQUFDLE9BQU8sR0FBSSxXQUFXLEdBQUcsR0FBRyxDQUFDLE9BQU8sR0FBSSxFQUFFLENBQUEsQ0FBRTs7QUFFckQsY0FBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsY0FBYyxFQUFFLEVBQUMsV0FBVyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7U0FDcEUsQ0FBQyxDQUFDO09BQ0o7QUFDRCxhQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7S0FDckI7Ozs7Ozs7O1dBTU0saUJBQUMsVUFBa0IsRUFBRSxJQUFnQixFQUFFLGNBQW1CLEVBQWdCO0FBQy9FLGFBQU8sSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0tBQ25FOzs7V0FFb0IsK0JBQUMsU0FBaUIsRUFBRSxRQUFnQyxFQUFFLGNBQW1CLEVBQWM7QUFDMUcsYUFBTyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMscUJBQXFCLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxjQUFjLENBQUMsQ0FBQztLQUNwRjs7O1dBR1EscUJBQVk7QUFDbkIsYUFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLCtCQUErQixJQUM1QyxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixJQUM5QixJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQztLQUMvQjs7O1dBRVkseUJBQVc7QUFDdEIsYUFBVSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksU0FBSSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBRztLQUNwRDs7O1dBRWdCLDZCQUFXO0FBQzFCLGFBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7S0FDMUI7OztXQUUrQiw0Q0FBVztBQUN6QyxhQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsaUNBQWlDLEVBQUUsQ0FBQyxDQUFDO0tBQzFFOzs7V0FFZ0MsNkNBQVc7QUFDMUMsYUFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQztLQUN6Qjs7O1dBRVEscUJBQWlDO0FBQ3hDLGFBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztLQUNyQjs7O1dBRThCLGtDQUFDLE9BQStDLEVBQWM7QUFDM0YsY0FBUSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDaEMsYUFBTyxJQUFJLFVBQVUsQ0FBQyxZQUFNO0FBQzFCLGdCQUFRLENBQUMsY0FBYyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztPQUM3QyxDQUFDLENBQUM7S0FDSjs7O1dBRWdDLG9DQUFDLE9BQStDLEVBQWM7QUFDN0YsY0FBUSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDbEMsYUFBTyxJQUFJLFVBQVUsQ0FBQyxZQUFNO0FBQzFCLGdCQUFRLENBQUMsY0FBYyxDQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQztPQUMvQyxDQUFDLENBQUM7S0FDSjs7O1dBRWUsbUJBQUMsR0FBVyxFQUFxQjt3QkFDeEIsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7O1VBQWhDLFFBQVEsZUFBUixRQUFRO1VBQUUsSUFBSSxlQUFKLElBQUk7O0FBQ25CLGFBQU8sZ0JBQWdCLENBQUMsb0JBQW9CLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQzlEOzs7Ozs7OztXQU0wQiw4QkFBQyxRQUFnQixFQUFFLElBQWEsRUFBcUI7QUFDOUUsYUFBTyxZQUFZLENBQUMsTUFBTSxDQUFDLFVBQUMsVUFBVSxFQUFLO0FBQ3pDLGVBQU8sVUFBVSxDQUFDLGlCQUFpQixFQUFFLEtBQUssUUFBUSxLQUM3QyxJQUFJLEtBQUssSUFBSSxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLGlDQUFpQyxFQUFFLENBQUMsQ0FBQSxDQUFFO09BQ3hGLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNQOzs7V0FFbUIsdUJBQUMsUUFBZ0IsRUFBMkI7QUFDOUQsYUFBTyxZQUFZLENBQUMsTUFBTSxDQUFDLFVBQUEsVUFBVTtlQUFJLFVBQVUsQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLFFBQVE7T0FBQSxDQUFDLENBQUM7S0FDdkY7OztTQWpYRyxnQkFBZ0I7Ozs7QUFxWHRCLGdCQUFnQixDQUFDLElBQUksR0FBRztBQUN0QixhQUFXLEVBQUUsWUFBWTtDQUMxQixDQUFDOztBQUVGLE1BQU0sQ0FBQyxPQUFPLEdBQUcsZ0JBQWdCLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL251Y2xpZGUtcmVtb3RlLXByb2plY3RzL25vZGVfbW9kdWxlcy9udWNsaWRlLXJlbW90ZS1jb25uZWN0aW9uL2xpYi9SZW1vdGVDb25uZWN0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxudmFyIHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlfSA9IHJlcXVpcmUoJ2F0b20nKTtcbnZhciBuZXQgPSByZXF1aXJlKCduZXQnKTtcbnZhciB1cmwgPSByZXF1aXJlKCd1cmwnKTtcbnZhciBsb2dnZXIgPSByZXF1aXJlKCdudWNsaWRlLWxvZ2dpbmcnKS5nZXRMb2dnZXIoKTtcbnZhciB7RXZlbnRFbWl0dGVyfSA9IHJlcXVpcmUoJ2V2ZW50cycpO1xuXG52YXIgUmVtb3RlRmlsZSA9IHJlcXVpcmUoJy4vUmVtb3RlRmlsZScpO1xudmFyIFJlbW90ZURpcmVjdG9yeSA9IHJlcXVpcmUoJy4vUmVtb3RlRGlyZWN0b3J5Jyk7XG52YXIgTnVjbGlkZUNsaWVudCA9IHJlcXVpcmUoJ251Y2xpZGUtc2VydmVyL2xpYi9OdWNsaWRlQ2xpZW50Jyk7XG52YXIgTnVjbGlkZVJlbW90ZUV2ZW50YnVzID0gcmVxdWlyZSgnbnVjbGlkZS1zZXJ2ZXIvbGliL051Y2xpZGVSZW1vdGVFdmVudGJ1cycpO1xudmFyIHtmc1Byb21pc2V9ID0gcmVxdWlyZSgnbnVjbGlkZS1jb21tb25zJyk7XG52YXIge2dldFZlcnNpb259ID0gcmVxdWlyZSgnbnVjbGlkZS12ZXJzaW9uJyk7XG5cbmNvbnN0IEhFQVJUQkVBVF9BV0FZX1JFUE9SVF9DT1VOVCA9IDM7XG5jb25zdCBIRUFSVEJFQVRfTk9USUZJQ0FUSU9OX0VSUk9SID0gMTtcbmNvbnN0IEhFQVJUQkVBVF9OT1RJRklDQVRJT05fV0FSTklORyA9IDI7XG5cbnR5cGUgSGVhcnRiZWF0Tm90aWZpY2F0aW9uID0ge1xuICBub3RpZmljYXRpb246IE5vdGlmaWNhdGlvbjtcbiAgY29kZTogc3RyaW5nO1xufVxuXG50eXBlIFJlbW90ZUNvbm5lY3Rpb25Db25maWd1cmF0aW9uID0ge1xuICBob3N0OiBzdHJpbmc7IC8vIGhvc3QgbnVjbGlkZSBzZXJ2ZXIgaXMgcnVubmluZyBvbi5cbiAgcG9ydDogbnVtYmVyOyAvLyBwb3J0IHRvIGNvbm5lY3QgdG8uXG4gIGN3ZDogc3RyaW5nOyAvLyBQYXRoIHRvIHJlbW90ZSBkaXJlY3RvcnkgdXNlciBzaG91bGQgc3RhcnQgaW4gdXBvbiBjb25uZWN0aW9uLlxuICBjZXJ0aWZpY2F0ZUF1dGhvcml0eUNlcnRpZmljYXRlOiA/QnVmZmVyOyAvLyBjZXJ0aWZpY2F0ZSBvZiBjZXJ0aWZpY2F0ZSBhdXRob3JpdHkuXG4gIGNsaWVudENlcnRpZmljYXRlOiA/QnVmZmVyOyAvLyBjbGllbnQgY2VydGlmaWNhdGUgZm9yIGh0dHBzIGNvbm5lY3Rpb24uXG4gIGNsaWVudEtleTogP0J1ZmZlcjsgLy8ga2V5IGZvciBodHRwcyBjb25uZWN0aW9uLlxufVxuXG52YXIgX2Nvbm5lY3Rpb25zOiBBcnJheTxSZW1vdGVDb25uZWN0aW9uPiA9IFtdO1xudmFyIF9lbWl0dGVyOiBFdmVudEVtaXR0ZXIgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cbmNsYXNzIFJlbW90ZUNvbm5lY3Rpb24ge1xuICBfZW50cmllczoge1twYXRoOiBzdHJpbmddOiBSZW1vdGVGaWxlfFJlbW90ZURpcmVjdG9yeX07XG4gIF9jb25maWc6IFJlbW90ZUNvbm5lY3Rpb25Db25maWd1cmF0aW9uO1xuICBfaW5pdGlhbGl6ZWQ6ID9ib29sO1xuICBfY2xvc2VkOiA/Ym9vbDtcblxuICBfaGVhcnRiZWF0TmV0d29ya0F3YXlDb3VudDogaW50O1xuICBfbGFzdEhlYXJ0YmVhdE5vdGlmaWNhdGlvbjogP0hlYXJ0YmVhdE5vdGlmaWNhdGlvbjtcblxuICBjb25zdHJ1Y3Rvcihjb25maWc6IFJlbW90ZUNvbm5lY3Rpb25Db25maWd1cmF0aW9uKSB7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgdGhpcy5fZW50cmllcyA9IHt9O1xuICAgIHRoaXMuX2NvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLl9oZWFydGJlYXROZXR3b3JrQXdheUNvdW50ID0gMDtcbiAgICB0aGlzLl9jbG9zZWQgPSBmYWxzZTtcbiAgfVxuXG4gIGRpc3Bvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5kaXNwb3NlKCk7XG4gIH1cblxuICAvLyBBIHdvcmthcm91bmQgYmVmb3JlIEF0b20gMi4wOiBBdG9tJ3MgUHJvamVjdDo6c2V0UGF0aHMgY3VycmVudGx5IHVzZXNcbiAgLy8gOjpyZXBvc2l0b3J5Rm9yRGlyZWN0b3J5U3luYywgc28gd2UgbmVlZCB0aGUgcmVwbyBpbmZvcm1hdGlvbiB0byBhbHJlYWR5IGJlXG4gIC8vIGF2YWlsYWJsZSB3aGVuIHRoZSBuZXcgcGF0aCBpcyBhZGRlZC4gdDY5MTM2MjQgdHJhY2tzIGNsZWFudXAgb2YgdGhpcy5cbiAgYXN5bmMgX3NldEhnUmVwb0luZm8oKTogdm9pZCB7XG4gICAgdmFyIGV2ZW50QnVzID0gdGhpcy5nZXRDbGllbnQoKS5ldmVudGJ1cztcbiAgICB2YXIgcmVtb3RlUGF0aCA9IHRoaXMuZ2V0UGF0aEZvckluaXRpYWxXb3JraW5nRGlyZWN0b3J5KCk7XG4gICAgdmFyIGhnUmVwb0Rlc2NyaXB0aW9uID0gYXdhaXQgZXZlbnRCdXMuY2FsbE1ldGhvZChcbiAgICAgIC8qc2VydmljZU5hbWUqLyAnc291cmNlQ29udHJvbCcsXG4gICAgICAvKm1ldGhvZE5hbWUqLyAnZ2V0SGdSZXBvc2l0b3J5JyxcbiAgICAgIC8qbWV0aG9kQXJncyovIFtyZW1vdGVQYXRoXSxcbiAgICAgIC8qZXh0cmFPcHRpb25zKi8ge21ldGhvZDogJ1BPU1QnLCBqc29uOiB0cnVlfVxuICAgICk7XG4gICAgdGhpcy5fc2V0SGdSZXBvc2l0b3J5RGVzY3JpcHRpb24oaGdSZXBvRGVzY3JpcHRpb24pO1xuICB9XG5cbiAgX21vbml0b3JDb25uZWN0aW9uSGVhcnRiZWF0KCkge1xuICAgIHZhciBzb2NrZXQgPSB0aGlzLmdldENsaWVudCgpLmV2ZW50YnVzLnNvY2tldDtcbiAgICB2YXIgc2VydmVyVXJpID0gc29ja2V0LmdldFNlcnZlclVyaSgpO1xuXG4gICAgLyoqXG4gICAgICogQWRkcyBhbiBBdG9tIG5vdGlmaWNhdGlvbiBmb3IgdGhlIGRldGVjdGVkIGhlYXJ0YmVhdCBuZXR3b3JrIHN0YXR1c1xuICAgICAqIFRoZSBmdW5jdGlvbiBtYWtlcyBzdXJlIG5vdCB0byBhZGQgbWFueSBub3RpZmljYXRpb25zIGZvciB0aGUgc2FtZSBldmVudCBhbmQgcHJpb3JpdGl6ZSBuZXcgZXZlbnRzLlxuICAgICAqL1xuICAgIHZhciBhZGRIZWFydGJlYXROb3RpZmljYXRpb24gPSAodHlwZTogc3RyaW5nLCBlcnJvckNvZGU6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nLCBkaXNtaXNzYWJsZTogYm9vbGVhbikgPT4ge1xuICAgICAgdmFyIHtjb2RlLCBub3RpZmljYXRpb246IGV4aXN0aW5nTm90aWZpY2F0aW9ufSA9IHRoaXMuX2xhc3RIZWFydGJlYXROb3RpZmljYXRpb24gfHwge307XG4gICAgICBpZiAoY29kZSAmJiBjb2RlID09PSBlcnJvckNvZGUgJiYgZGlzbWlzc2FibGUpIHtcbiAgICAgICAgLy8gQSBkaXNtaXNzaWJsZSBoZWFydGJlYXQgbm90aWZpY2F0aW9uIHdpdGggdGhpcyBjb2RlIGlzIGFscmVhZHkgYWN0aXZlLlxuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2YXIgbm90aWZpY2F0aW9uO1xuICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgIGNhc2UgSEVBUlRCRUFUX05PVElGSUNBVElPTl9FUlJPUjpcbiAgICAgICAgICBub3RpZmljYXRpb24gPSBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IobWVzc2FnZSwge2Rpc21pc3NhYmxlfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgSEVBUlRCRUFUX05PVElGSUNBVElPTl9XQVJOSU5HOlxuICAgICAgICAgIG5vdGlmaWNhdGlvbiA9IGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nKG1lc3NhZ2UsIHtkaXNtaXNzYWJsZX0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVW5yZWNvbmduaXplZCBoZWFydGJlYXQgbm90aWZpY2F0aW9uIHR5cGUnKTtcbiAgICAgIH1cbiAgICAgIGlmIChleGlzdGluZ05vdGlmaWNhdGlvbikge1xuICAgICAgICBleGlzdGluZ05vdGlmaWNhdGlvbi5kaXNtaXNzKCk7XG4gICAgICB9XG4gICAgICB0aGlzLl9sYXN0SGVhcnRiZWF0Tm90aWZpY2F0aW9uID0ge1xuICAgICAgICBub3RpZmljYXRpb24sXG4gICAgICAgIGNvZGU6IGVycm9yQ29kZSxcbiAgICAgIH07XG4gICAgfTtcblxuICAgIHZhciBvbkhlYXJ0YmVhdCA9ICgpID0+IHtcbiAgICAgIGlmICh0aGlzLl9sYXN0SGVhcnRiZWF0Tm90aWZpY2F0aW9uKSB7XG4gICAgICAgIC8vIElmIHRoZXJlIGhhcyBiZWVuIGV4aXN0aW5nIGhlYXJ0YmVhdCBlcnJvci93YXJuaW5nLFxuICAgICAgICAvLyB0aGF0IG1lYW5zIGNvbm5lY3Rpb24gaGFzIGJlZW4gbG9zdCBhbmQgd2Ugc2hhbGwgc2hvdyBhIG1lc3NhZ2UgYWJvdXQgY29ubmVjdGlvblxuICAgICAgICAvLyBiZWluZyByZXN0b3JlZCB3aXRob3V0IGEgcmVjb25uZWN0IHByb21wdC5cbiAgICAgICAgdmFyIHtub3RpZmljYXRpb259ID0gdGhpcy5fbGFzdEhlYXJ0YmVhdE5vdGlmaWNhdGlvbjtcbiAgICAgICAgbm90aWZpY2F0aW9uLmRpc21pc3MoKTtcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFN1Y2Nlc3MoJ0Nvbm5lY3Rpb24gcmVzdG9yZWQgdG8gTnVjbGlkZSBTZXJ2ZXIgYXQ6ICcgKyBzZXJ2ZXJVcmkpO1xuICAgICAgICB0aGlzLl9oZWFydGJlYXROZXR3b3JrQXdheUNvdW50ID0gMDtcbiAgICAgICAgdGhpcy5fbGFzdEhlYXJ0YmVhdE5vdGlmaWNhdGlvbiA9IG51bGw7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHZhciBub3RpZnlOZXR3b3JrQXdheSA9IChjb2RlOiBzdHJpbmcpID0+IHtcbiAgICAgIHRoaXMuX2hlYXJ0YmVhdE5ldHdvcmtBd2F5Q291bnQrKztcbiAgICAgIGlmICh0aGlzLl9oZWFydGJlYXROZXR3b3JrQXdheUNvdW50ID49IEhFQVJUQkVBVF9BV0FZX1JFUE9SVF9DT1VOVCkge1xuICAgICAgICBhZGRIZWFydGJlYXROb3RpZmljYXRpb24oSEVBUlRCRUFUX05PVElGSUNBVElPTl9XQVJOSU5HLCBjb2RlLFxuICAgICAgICAgICdOdWNsaWRlIHNlcnZlciBjYW4gbm90IGJlIHJlYWNoZWQgYXQ6ICcgKyBzZXJ2ZXJVcmkgK1xuICAgICAgICAgICc8YnIvPkNoZWNrIHlvdXIgbmV0d29yayBjb25uZWN0aW9uIScsXG4gICAgICAgICAgLypkaXNtaXNzYWJsZSovIHRydWUpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgb25IZWFydGJlYXRFcnJvciA9IChlcnJvcjogYW55KSA9PiB7XG4gICAgICB2YXIge2NvZGUsIG1lc3NhZ2UsIG9yaWdpbmFsQ29kZX0gPSBlcnJvcjtcbiAgICAgIGxvZ2dlci5pbmZvKCdIZWFydGJlYXQgbmV0d29yayBlcnJvcjonLCBjb2RlLCBvcmlnaW5hbENvZGUsIG1lc3NhZ2UpO1xuICAgICAgc3dpdGNoIChjb2RlKSB7XG4gICAgICAgICAgY2FzZSAnTkVUV09SS19BV0FZJzpcbiAgICAgICAgICAgIC8vIE5vdGlmeSBzd2l0Y2hpbmcgbmV0d29ya3MsIGRpc2Nvbm5lY3RlZCwgdGltZW91dCwgdW5yZWFjaGFibGUgc2VydmVyIG9yIGZyYWdpbGUgY29ubmVjdGlvbi5cbiAgICAgICAgICAgIG5vdGlmeU5ldHdvcmtBd2F5KGNvZGUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnU0VSVkVSX0NSQVNIRUQnOlxuICAgICAgICAgICAgLy8gU2VydmVyIHNodXQgZG93biBvciBwb3J0IG5vIGxvbmdlciBhY2Nlc3NpYmxlLlxuICAgICAgICAgICAgLy8gTm90aWZ5IHRoZSBzZXJ2ZXIgd2FzIHRoZXJlLCBidXQgbm93IGdvbmUuXG4gICAgICAgICAgICBhZGRIZWFydGJlYXROb3RpZmljYXRpb24oSEVBUlRCRUFUX05PVElGSUNBVElPTl9FUlJPUiwgY29kZSxcbiAgICAgICAgICAgICAgICAnTnVjbGlkZSBzZXJ2ZXIgY3Jhc2hlZCE8YnIvPicgK1xuICAgICAgICAgICAgICAgICdQbGVhc2UgcmVsb2FkIE51Y2xpZGUgdG8gcmVzdG9yZSB5b3VyIHJlbW90ZSBwcm9qZWN0IGNvbm5lY3Rpb24hIDogKOKMgy3ijKUt4oyYLUwpJyxcbiAgICAgICAgICAgICAgICAvKmRpc21pc3NhYmxlKi8gdHJ1ZSk7XG4gICAgICAgICAgICAvLyBUT0RPKG1vc3QpIHJlY29ubmVjdCBSZW1vdGVDb25uZWN0aW9uLCByZXN0b3JlIHRoZSBjdXJyZW50IHByb2plY3Qgc3RhdGUsXG4gICAgICAgICAgICAvLyBhbmQgZmluYWxseSBjaGFuZ2UgZGlzbWlzc2FibGUgdG8gZmFsc2UgYW5kIHR5cGUgdG8gJ1dBUk5JTkcnLlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnUE9SVF9OT1RfQUNDRVNTSUJMRSc6XG4gICAgICAgICAgICAvLyBOb3RpZnkgbmV2ZXIgaGVhcmQgYSBoZWFydGJlYXQgZnJvbSB0aGUgc2VydmVyLlxuICAgICAgICAgICAgdmFyIHtwb3J0fSA9IHVybC5wYXJzZShzZXJ2ZXJVcmkpO1xuICAgICAgICAgICAgYWRkSGVhcnRiZWF0Tm90aWZpY2F0aW9uKEhFQVJUQkVBVF9OT1RJRklDQVRJT05fRVJST1IsIGNvZGUsXG4gICAgICAgICAgICAgICAgJ051Y2xpZGUgc2VydmVyIGlzIG5vdCByZWFjaGFibGUuPGJyLz5JdCBjb3VsZCBiZSBydW5uaW5nIG9uIGEgcG9ydCB0aGF0IGlzIG5vdCBhY2Nlc3NpYmxlOiAnICsgcG9ydCxcbiAgICAgICAgICAgICAgICAvKmRpc21pc3NhYmxlKi8gdHJ1ZSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdJTlZBTElEX0NFUlRJRklDQVRFJzpcbiAgICAgICAgICAgIC8vIE5vdGlmeSB0aGUgY2xpZW50IGNlcnRpZmljYXRlIGlzIG5vdCBhY2NlcHRlZCBieSBudWNsaWRlIHNlcnZlciAoY2VydGlmaWNhdGUgbWlzbWF0Y2gpLlxuICAgICAgICAgICAgYWRkSGVhcnRiZWF0Tm90aWZpY2F0aW9uKEhFQVJUQkVBVF9OT1RJRklDQVRJT05fRVJST1IsIGNvZGUsXG4gICAgICAgICAgICAgICAgJ0Nvbm5lY3Rpb24gUmVzZXQgRXJyb3IhITxici8+VGhpcyBjb3VsZCBiZSBjYXVzZWQgYnkgdGhlIGNsaWVudCBjZXJ0aWZpY2F0ZSBtaXNtYXRjaGluZyB0aGUgc2VydmVyIGNlcnRpZmljYXRlLjxici8+JyArXG4gICAgICAgICAgICAgICAgJ1BsZWFzZSByZWxvYWQgTnVjbGlkZSB0byByZXN0b3JlIHlvdXIgcmVtb3RlIHByb2plY3QgY29ubmVjdGlvbiEgOiAo4oyDLeKMpS3ijJgtTCknLFxuICAgICAgICAgICAgICAgIC8qZGlzbWlzc2FibGUqLyB0cnVlKTtcbiAgICAgICAgICAgIC8vIFRPRE8obW9zdCk6IHJlY29ubmVjdCBSZW1vdGVDb25uZWN0aW9uLCByZXN0b3JlIHRoZSBjdXJyZW50IHByb2plY3Qgc3RhdGUuXG4gICAgICAgICAgICAvLyBhbmQgZmluYWxseSBjaGFuZ2UgZGlzbWlzc2FibGUgdG8gZmFsc2UgYW5kIHR5cGUgdG8gJ1dBUk5JTkcnLlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIG5vdGlmeU5ldHdvcmtBd2F5KGNvZGUpO1xuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdVbnJlY29uZ25pemVkIGhlYXJ0YmVhdCBlcnJvciBjb2RlOiAnICsgY29kZSwgbWVzc2FnZSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH07XG4gICAgc29ja2V0Lm9uKCdoZWFydGJlYXQnLCBvbkhlYXJ0YmVhdCk7XG4gICAgc29ja2V0Lm9uKCdoZWFydGJlYXQuZXJyb3InLCBvbkhlYXJ0YmVhdEVycm9yKTtcblxuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuYWRkKG5ldyBEaXNwb3NhYmxlKCgpID0+IHtcbiAgICAgIHNvY2tldC5yZW1vdmVMaXN0ZW5lcignaGVhcnRiZWF0Jywgb25IZWFydGJlYXQpO1xuICAgICAgc29ja2V0LnJlbW92ZUxpc3RlbmVyKCdoZWFydGJlYXQuZXJyb3InLCBvbkhlYXJ0YmVhdEVycm9yKTtcbiAgICB9KSk7XG4gIH1cblxuICBnZXRVcmlPZlJlbW90ZVBhdGgocmVtb3RlUGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYG51Y2xpZGU6Ly8ke3RoaXMuZ2V0UmVtb3RlSG9zdCgpfSR7cmVtb3RlUGF0aH1gO1xuICB9XG5cbiAgZ2V0UGF0aE9mVXJpKHVyaTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdXJsLnBhcnNlKHVyaSkucGF0aDtcbiAgfVxuXG4gIGNyZWF0ZURpcmVjdG9yeSh1cmk6IHN0cmluZyk6ID9SZW1vdGVEaXJlY3Rvcnkge1xuICAgIHZhciB7cGF0aH0gPSB1cmwucGFyc2UodXJpKTtcbiAgICBwYXRoID0gcmVxdWlyZSgncGF0aCcpLm5vcm1hbGl6ZShwYXRoKTtcblxuICAgIHZhciBlbnRyeSA9IHRoaXMuX2VudHJpZXNbcGF0aF07XG4gICAgaWYgKCFlbnRyeSB8fCBlbnRyeS5nZXRMb2NhbFBhdGgoKSAhPT0gcGF0aCkge1xuICAgICAgdGhpcy5fZW50cmllc1twYXRoXSA9IGVudHJ5ID0gbmV3IFJlbW90ZURpcmVjdG9yeShcbiAgICAgICAgdGhpcyxcbiAgICAgICAgdGhpcy5nZXRVcmlPZlJlbW90ZVBhdGgocGF0aCksXG4gICAgICAgIHtoZ1JlcG9zaXRvcnlEZXNjcmlwdGlvbjogdGhpcy5faGdSZXBvc2l0b3J5RGVzY3JpcHRpb259XG4gICAgICApO1xuICAgICAgLy8gVE9ETzogV2Ugc2hvdWxkIGFkZCB0aGUgZm9sbG93aW5nIGxpbmUgdG8ga2VlcCB0aGUgY2FjaGUgdXAtdG8tZGF0ZS5cbiAgICAgIC8vIFdlIG5lZWQgdG8gaW1wbGVtZW50IG9uRGlkUmVuYW1lIGFuZCBvbkRpZERlbGV0ZSBpbiBSZW1vdGVEaXJlY3RvcnlcbiAgICAgIC8vIGZpcnN0LiBJdCdzIG9rIHRoYXQgd2UgZG9uJ3QgYWRkIHRoZSBoYW5kbGVycyBmb3Igbm93IHNpbmNlIHdlIGhhdmVcbiAgICAgIC8vIHRoZSBjaGVjayBgZW50cnkuZ2V0TG9jYWxQYXRoKCkgIT09IHBhdGhgIGFib3ZlLlxuICAgICAgLy9cbiAgICAgIC8vIHRoaXMuX2FkZEhhbmRsZXJzRm9yRW50cnkoZW50cnkpO1xuICAgIH1cblxuICAgIGlmICghZW50cnkuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdQYXRoIGlzIG5vdCBhIGRpcmVjdG9yeTonICsgdXJpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZW50cnk7XG4gIH1cblxuICAvLyBBIHdvcmthcm91bmQgYmVmb3JlIEF0b20gMi4wOiBzZWUgOjpnZXRIZ1JlcG9JbmZvIG9mIG1haW4uanMuXG4gIF9zZXRIZ1JlcG9zaXRvcnlEZXNjcmlwdGlvbihoZ1JlcG9zaXRvcnlEZXNjcmlwdGlvbik6IHZvaWQge1xuICAgIHRoaXMuX2hnUmVwb3NpdG9yeURlc2NyaXB0aW9uID0gaGdSZXBvc2l0b3J5RGVzY3JpcHRpb247XG4gIH1cblxuICBjcmVhdGVGaWxlKHVyaTogc3RyaW5nKTogP1JlbW90ZUZpbGUge1xuICAgIHZhciB7cGF0aH0gPSB1cmwucGFyc2UodXJpKTtcbiAgICBwYXRoID0gcmVxdWlyZSgncGF0aCcpLm5vcm1hbGl6ZShwYXRoKTtcblxuICAgIHZhciBlbnRyeSA9IHRoaXMuX2VudHJpZXNbcGF0aF07XG4gICAgaWYgKCFlbnRyeSB8fCBlbnRyeS5nZXRMb2NhbFBhdGgoKSAhPT0gcGF0aCkge1xuICAgICAgdGhpcy5fZW50cmllc1twYXRoXSA9IGVudHJ5ID0gbmV3IFJlbW90ZUZpbGUodGhpcywgdGhpcy5nZXRVcmlPZlJlbW90ZVBhdGgocGF0aCkpO1xuICAgICAgdGhpcy5fYWRkSGFuZGxlcnNGb3JFbnRyeShlbnRyeSk7XG4gICAgfVxuXG4gICAgaWYgKGVudHJ5LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUGF0aCBpcyBub3QgYSBmaWxlJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGVudHJ5O1xuICB9XG5cbiAgX2FkZEhhbmRsZXJzRm9yRW50cnkoZW50cnk6IEZpbGUgfCBEaXJlY3RvcnkpOiB2b2lkIHtcbiAgICB2YXIgb2xkUGF0aCA9IGVudHJ5LmdldExvY2FsUGF0aCgpO1xuICAgIHZhciByZW5hbWVTdWJzY3JpcHRpb24gPSBlbnRyeS5vbkRpZFJlbmFtZSgoKSA9PiB7XG4gICAgICBkZWxldGUgdGhpcy5fZW50cmllc1tvbGRQYXRoXTtcbiAgICAgIHRoaXMuX2VudHJpZXNbZW50cnkuZ2V0TG9jYWxQYXRoKCldID0gZW50cnk7XG4gICAgfSk7XG4gICAgdmFyIGRlbGV0ZVN1YnNjcmlwdGlvbiA9IGVudHJ5Lm9uRGlkRGVsZXRlKCgpID0+IHtcbiAgICAgIGRlbGV0ZSB0aGlzLl9lbnRyaWVzW2VudHJ5LmdldExvY2FsUGF0aCgpXTtcbiAgICAgIHJlbmFtZVN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XG4gICAgICBkZWxldGVTdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgaW5pdGlhbGl6ZSgpOiB2b2lkIHtcbiAgICAvLyBSaWdodCBub3cgd2UgZG9uJ3QgcmUtaGFuZHNoYWtlLlxuICAgIGlmICh0aGlzLl9pbml0aWFsaXplZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLl9pbml0aWFsaXplZCA9IGZhbHNlO1xuICAgICAgLy8gRG8gdmVyc2lvbiBjaGVjay5cbiAgICAgIHZhciBjbGllbnQgPSB0aGlzLl9nZXRDbGllbnQoKTtcbiAgICAgIHZhciBzZXJ2ZXJWZXJzaW9uO1xuICAgICAgdHJ5IHtcbiAgICAgICAgc2VydmVyVmVyc2lvbiA9IGF3YWl0IGNsaWVudC52ZXJzaW9uKCk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNsaWVudC5jbG9zZSgpO1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuICAgICAgdmFyIGNsaWVudFZlcnNpb24gPSBnZXRWZXJzaW9uKCk7XG4gICAgICBpZiAoY2xpZW50VmVyc2lvbiAhPSBzZXJ2ZXJWZXJzaW9uKSB7XG4gICAgICAgIGNsaWVudC5jbG9zZSgpO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFZlcnNpb24gbWlzbWF0Y2guIENsaWVudCBhdCAke2NsaWVudFZlcnNpb259IHdoaWxlIHNlcnZlciBhdCAke3NlcnZlclZlcnNpb259LmApO1xuICAgICAgfVxuICAgICAgdGhpcy5faW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgICAgdGhpcy5fbW9uaXRvckNvbm5lY3Rpb25IZWFydGJlYXQoKTtcbiAgICAgIC8vIEEgd29ya2Fyb3VuZCBiZWZvcmUgQXRvbSAyLjA6IHNlZSA6OmdldEhnUmVwb0luZm8uXG4gICAgICBhd2FpdCB0aGlzLl9zZXRIZ1JlcG9JbmZvKCk7XG4gICAgICAvLyBTYXZlIHRvIGNhY2hlLlxuICAgICAgdGhpcy5fYWRkQ29ubmVjdGlvbigpO1xuICAgIH1cbiAgfVxuXG4gIF9hZGRDb25uZWN0aW9uKCkge1xuICAgIF9jb25uZWN0aW9ucy5wdXNoKHRoaXMpO1xuICAgIF9lbWl0dGVyLmVtaXQoJ2RpZC1hZGQnLCB0aGlzKTtcbiAgfVxuXG4gIGNsb3NlKCk6IHZvaWQge1xuICAgIC8vIENsb3NlIHRoZSBldmVudGJ1cyB0aGF0IHdpbGwgc3RvcCB0aGUgaGVhcnRiZWF0IGludGVydmFsLCB3ZWJzb2NrZXQgcmVjb25uZWN0IHRyaWFscywgLi5ldGMuXG4gICAgaWYgKHRoaXMuX2NsaWVudCkge1xuICAgICAgdGhpcy5fY2xpZW50LmNsb3NlKCk7XG4gICAgICB0aGlzLl9jbGllbnQgPSBudWxsO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuX2Nsb3NlZCkge1xuICAgICAgLy8gRnV0dXJlIGdldENsaWVudCBjYWxscyBzaG91bGQgZmFpbCwgaWYgaXQgaGFzIGEgY2FjaGVkIFJlbW90ZUNvbm5lY3Rpb24gaW5zdGFuY2UuXG4gICAgICB0aGlzLl9jbG9zZWQgPSB0cnVlO1xuICAgICAgLy8gUmVtb3ZlIGZyb20gX2Nvbm5lY3Rpb25zIHRvIG5vdCBiZSBjb25zaWRlcmVkIGluIGZ1dHVyZSBjb25uZWN0aW9uIHF1ZXJpZXMuXG4gICAgICBfY29ubmVjdGlvbnMuc3BsaWNlKF9jb25uZWN0aW9ucy5pbmRleE9mKHRoaXMpLCAxKTtcbiAgICAgIF9lbWl0dGVyLmVtaXQoJ2RpZC1jbG9zZScsIHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIGdldENsaWVudCgpOiBOdWNsaWRlQ2xpZW50IHtcbiAgICBpZiAoIXRoaXMuX2luaXRpYWxpemVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlbW90ZSBjb25uZWN0aW9uIGhhcyBub3QgYmVlbiBpbml0aWFsaXplZC4nKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2Nsb3NlZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdSZW1vdGUgY29ubmVjdGlvbiBoYXMgYmVlbiBjbG9zZWQuJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLl9nZXRDbGllbnQoKTtcbiAgICB9XG4gIH1cblxuICBfZ2V0Q2xpZW50KCk6IE51Y2xpZGVDbGllbnQge1xuICAgIGlmICghdGhpcy5fY2xpZW50KSB7XG4gICAgICB2YXIgdXJpO1xuICAgICAgdmFyIGN3ZCA9IHRoaXMuX2NvbmZpZy5jd2Q7XG4gICAgICB2YXIgb3B0aW9ucyA9IHt9O1xuXG4gICAgICAvLyBVc2UgaHR0cHMgaWYgd2UgaGF2ZSBrZXksIGNlcnQsIGFuZCBjYVxuICAgICAgaWYgKHRoaXMuX2lzU2VjdXJlKCkpIHtcbiAgICAgICAgb3B0aW9ucy5jZXJ0aWZpY2F0ZUF1dGhvcml0eUNlcnRpZmljYXRlID0gdGhpcy5fY29uZmlnLmNlcnRpZmljYXRlQXV0aG9yaXR5Q2VydGlmaWNhdGU7XG4gICAgICAgIG9wdGlvbnMuY2xpZW50Q2VydGlmaWNhdGUgPSB0aGlzLl9jb25maWcuY2xpZW50Q2VydGlmaWNhdGU7XG4gICAgICAgIG9wdGlvbnMuY2xpZW50S2V5ID0gdGhpcy5fY29uZmlnLmNsaWVudEtleTtcbiAgICAgICAgdXJpID0gYGh0dHBzOi8vJHt0aGlzLmdldFJlbW90ZUhvc3QoKX1gO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdXJpID0gYGh0dHA6Ly8ke3RoaXMuZ2V0UmVtb3RlSG9zdCgpfWA7XG4gICAgICB9XG5cbiAgICAgIC8vIFRoZSByZW1vdGUgY29ubmVjdGlvbiBhbmQgY2xpZW50IGFyZSBpZGVudGlmaWVkIGJ5IGJvdGggdGhlIHJlbW90ZSBob3N0IGFuZCB0aGUgaW5pdGFsIHdvcmtpbmcgZGlyZWN0b3J5LlxuICAgICAgdmFyIGNsaWVudElkID0gdGhpcy5nZXRSZW1vdGVIb3N0KCkgKyB0aGlzLmdldFBhdGhGb3JJbml0aWFsV29ya2luZ0RpcmVjdG9yeSgpO1xuICAgICAgdGhpcy5fY2xpZW50ID0gbmV3IE51Y2xpZGVDbGllbnQoY2xpZW50SWQsIG5ldyBOdWNsaWRlUmVtb3RlRXZlbnRidXModXJpLCBvcHRpb25zKSwge2N3ZH0pO1xuICAgICAgLy8gU3RhcnQgd2F0Y2hpbmcgdGhlIHByb2plY3QgZm9yIGNoYW5nZXMuXG4gICAgICB0aGlzLl9jbGllbnQud2F0Y2hEaXJlY3RvcnlSZWN1cnNpdmUoY3dkLCAvKiBkbyBub3RoaW5nIG9uIGNoYW5nZSAqLygpID0+IHt9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgIHZhciB3YXJuaW5nTWVzc2FnZSA9ICdXYXRjaGVyIGZhaWxlZCB0byBzdGFydCAtIHdhdGNoZXIgZmVhdHVyZXMgZGlzYWJsZWQhPGJyLz4nICtcbiAgICAgICAgICAgIChlcnIubWVzc2FnZSA/ICgnREVUQUlMUzogJyArIGVyci5tZXNzYWdlKSA6ICcnKTtcbiAgICAgICAgLy8gQWRkIGEgcGVyc2lzdGVudCB3YXJuaW5nIG1lc3NhZ2UgdG8gbWFrZSBzdXJlIHRoZSB1c2VyIHNlZXMgaXQgYW5kIGludGVudGlvbmFsbHkgZGlzbWlzc2luZyBpdC5cbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcod2FybmluZ01lc3NhZ2UsIHtkaXNtaXNzYWJsZTogdHJ1ZX0pO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9jbGllbnQ7XG4gIH1cblxuICAvKipcbiAgICogTWFrZSBycGMgY2FsbCB0aHJvdWdoIHRoaXMgY29ubmVjdGlvbiBnaXZlbiBzZXJ2aWNlVXJpIGluIGZvcm0gb2YgYCRzZXJ2aWNlTmFtZS8kbWV0aG9kTmFtZWBcbiAgICogYW5kIGFyZ3MgYXMgYXJndW1lbnRzIGxpc3QuXG4gICAqL1xuICBtYWtlUnBjKHNlcnZpY2VVcmk6IHN0cmluZywgYXJnczogQXJyYXk8YW55Piwgc2VydmljZU9wdGlvbnM6IGFueSk6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0Q2xpZW50KCkubWFrZVJwYyhzZXJ2aWNlVXJpLCBhcmdzLCBzZXJ2aWNlT3B0aW9ucyk7XG4gIH1cblxuICByZWdpc3RlckV2ZW50TGlzdGVuZXIoZXZlbnROYW1lOiBzdHJpbmcsIGNhbGxiYWNrOiAocGF5bG9hZDogYW55KSA9PiB2b2lkLCBzZXJ2aWNlT3B0aW9uczogYW55KTogRGlzcG9zYWJsZSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0Q2xpZW50KCkucmVnaXN0ZXJFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgY2FsbGJhY2ssIHNlcnZpY2VPcHRpb25zKTtcbiAgfVxuXG5cbiAgX2lzU2VjdXJlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9jb25maWcuY2VydGlmaWNhdGVBdXRob3JpdHlDZXJ0aWZpY2F0ZVxuICAgICAgICAmJiB0aGlzLl9jb25maWcuY2xpZW50Q2VydGlmaWNhdGVcbiAgICAgICAgJiYgdGhpcy5fY29uZmlnLmNsaWVudEtleTtcbiAgfVxuXG4gIGdldFJlbW90ZUhvc3QoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYCR7dGhpcy5fY29uZmlnLmhvc3R9OiR7dGhpcy5fY29uZmlnLnBvcnR9YDtcbiAgfVxuXG4gIGdldFJlbW90ZUhvc3RuYW1lKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbmZpZy5ob3N0O1xuICB9XG5cbiAgZ2V0VXJpRm9ySW5pdGlhbFdvcmtpbmdEaXJlY3RvcnkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5nZXRVcmlPZlJlbW90ZVBhdGgodGhpcy5nZXRQYXRoRm9ySW5pdGlhbFdvcmtpbmdEaXJlY3RvcnkoKSk7XG4gIH1cblxuICBnZXRQYXRoRm9ySW5pdGlhbFdvcmtpbmdEaXJlY3RvcnkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fY29uZmlnLmN3ZDtcbiAgfVxuXG4gIGdldENvbmZpZygpOiBSZW1vdGVDb25uZWN0aW9uQ29uZmlndXJhdGlvbntcbiAgICByZXR1cm4gdGhpcy5fY29uZmlnO1xuICB9XG5cbiAgc3RhdGljIG9uRGlkQWRkUmVtb3RlQ29ubmVjdGlvbihoYW5kbGVyOiAoY29ubmVjdGlvbjogUmVtb3RlQ29ubmVjdGlvbikgPT4gdm9pZCk6IERpc3Bvc2FibGUge1xuICAgIF9lbWl0dGVyLm9uKCdkaWQtYWRkJywgaGFuZGxlcik7XG4gICAgcmV0dXJuIG5ldyBEaXNwb3NhYmxlKCgpID0+IHtcbiAgICAgIF9lbWl0dGVyLnJlbW92ZUxpc3RlbmVyKCdkaWQtYWRkJywgaGFuZGxlcik7XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgb25EaWRDbG9zZVJlbW90ZUNvbm5lY3Rpb24oaGFuZGxlcjogKGNvbm5lY3Rpb246IFJlbW90ZUNvbm5lY3Rpb24pID0+IHZvaWQpOiBEaXNwb3NhYmxlIHtcbiAgICBfZW1pdHRlci5vbignZGlkLWNsb3NlJywgaGFuZGxlcik7XG4gICAgcmV0dXJuIG5ldyBEaXNwb3NhYmxlKCgpID0+IHtcbiAgICAgIF9lbWl0dGVyLnJlbW92ZUxpc3RlbmVyKCdkaWQtY2xvc2UnLCBoYW5kbGVyKTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBnZXRGb3JVcmkodXJpOiBzdHJpbmcpOiA/UmVtb3RlQ29ubmVjdGlvbiB7XG4gICAgdmFyIHtob3N0bmFtZSwgcGF0aH0gPSB1cmwucGFyc2UodXJpKTtcbiAgICByZXR1cm4gUmVtb3RlQ29ubmVjdGlvbi5nZXRCeUhvc3RuYW1lQW5kUGF0aChob3N0bmFtZSwgcGF0aCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGNhY2hlZCBjb25uZWN0aW9uIG1hdGNoIHRoZSBob3N0bmFtZSBhbmQgdGhlIHBhdGggaGFzIHRoZSBwcmVmaXggb2YgY29ubmVjdGlvbi5jd2QuIElmIHBhdGggaXMgbnVsbCxcbiAgICogdGhlbiByZXR1cm4gdGhlIGNvbm5lY3Rpb24gd2hvIG1hdGNoZXMgdGhlIGhvc3RuYW1lIGFuZCBpZ25vcmUgY29ubmVjdGlvbi5jd2QuXG4gICAqL1xuICBzdGF0aWMgZ2V0QnlIb3N0bmFtZUFuZFBhdGgoaG9zdG5hbWU6IHN0cmluZywgcGF0aDogP3N0cmluZyk6ID9SZW1vdGVDb25uZWN0aW9uIHtcbiAgICByZXR1cm4gX2Nvbm5lY3Rpb25zLmZpbHRlcigoY29ubmVjdGlvbikgPT4ge1xuICAgICAgcmV0dXJuIGNvbm5lY3Rpb24uZ2V0UmVtb3RlSG9zdG5hbWUoKSA9PT0gaG9zdG5hbWUgJiZcbiAgICAgICAgICAocGF0aCA9PT0gbnVsbCB8fCBwYXRoLnN0YXJ0c1dpdGgoY29ubmVjdGlvbi5nZXRQYXRoRm9ySW5pdGlhbFdvcmtpbmdEaXJlY3RvcnkoKSkpO1xuICAgIH0pWzBdO1xuICB9XG5cbiAgc3RhdGljIGdldEJ5SG9zdG5hbWUoaG9zdG5hbWU6IHN0cmluZyk6IEFycmF5PFJlbW90ZUNvbm5lY3Rpb24+IHtcbiAgICByZXR1cm4gX2Nvbm5lY3Rpb25zLmZpbHRlcihjb25uZWN0aW9uID0+IGNvbm5lY3Rpb24uZ2V0UmVtb3RlSG9zdG5hbWUoKSA9PT0gaG9zdG5hbWUpO1xuICB9XG59XG5cbi8vIEV4cG9zZSBsb2NhbCB2YXJpYWJsZXMgZm9yIHRlc3RhYmlsaXR5LlxuUmVtb3RlQ29ubmVjdGlvbi50ZXN0ID0ge1xuICBjb25uZWN0aW9uczogX2Nvbm5lY3Rpb25zLFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZW1vdGVDb25uZWN0aW9uO1xuIl19