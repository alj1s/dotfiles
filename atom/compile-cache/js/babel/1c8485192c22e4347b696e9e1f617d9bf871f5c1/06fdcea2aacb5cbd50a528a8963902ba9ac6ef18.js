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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9ub2RlX21vZHVsZXMvbnVjbGlkZS1yZW1vdGUtY29ubmVjdGlvbi9saWIvUmVtb3RlQ29ubmVjdGlvbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7OztlQVc0QixPQUFPLENBQUMsTUFBTSxDQUFDOztJQUFsRCxtQkFBbUIsWUFBbkIsbUJBQW1CO0lBQUUsVUFBVSxZQUFWLFVBQVU7O0FBQ3BDLElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN6QixJQUFJLEdBQUcsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDekIsSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7O2dCQUMvQixPQUFPLENBQUMsUUFBUSxDQUFDOztJQUFqQyxZQUFZLGFBQVosWUFBWTs7QUFFakIsSUFBSSxVQUFVLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3pDLElBQUksZUFBZSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0FBQ25ELElBQUksYUFBYSxHQUFHLE9BQU8sQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO0FBQ2hFLElBQUkscUJBQXFCLEdBQUcsT0FBTyxDQUFDLDBDQUEwQyxDQUFDLENBQUM7O2dCQUM5RCxPQUFPLENBQUMsaUJBQWlCLENBQUM7O0lBQXZDLFNBQVMsYUFBVCxTQUFTOztnQkFDSyxPQUFPLENBQUMsaUJBQWlCLENBQUM7O0lBQXhDLFVBQVUsYUFBVixVQUFVOztBQUVmLElBQU0sMkJBQTJCLEdBQUcsQ0FBQyxDQUFDO0FBQ3RDLElBQU0sNEJBQTRCLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZDLElBQU0sOEJBQThCLEdBQUcsQ0FBQyxDQUFDOztBQWdCekMsSUFBSSxZQUFxQyxHQUFH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SUFBSSxHQUFHO0FBQ3RCLGFBQVcsRUFBRSxZQUFZO0NBQzFCLENBQUM7O0FBRUYsTUFBTSxDQUFDLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQyIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvbnVjbGlkZS1yZW1vdGUtcHJvamVjdHMvbm9kZV9tb2R1bGVzL251Y2xpZGUtcmVtb3RlLWNvbm5lY3Rpb24vbGliL1JlbW90ZUNvbm5lY3Rpb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGV9ID0gcmVxdWlyZSgnYXRvbScpO1xudmFyIG5ldCA9IHJlcXVpcmUoJ25ldCcpO1xudmFyIHVybCA9IHJlcXVpcmUoJ3VybCcpO1xudmFyIGxvZ2dlciA9IHJlcXVpcmUoJ251Y2xpZGUtbG9nZ2luZycpLmdldExvZ2dlcigpO1xudmFyIHtFdmVudEVtaXR0ZXJ9ID0gcmVxdWlyZSgnZXZlbnRzJyk7XG5cbnZhciBSZW1vdGVGaWxlID0gcmVxdWlyZSgnLi9SZW1vdGVGaWxlJyk7XG52YXIgUmVtb3RlRGlyZWN0b3J5ID0gcmVxdWlyZSgnLi9SZW1vdGVEaXJlY3RvcnknKTtcbnZhciBOdWNsaWRlQ2xpZW50ID0gcmVxdWlyZSgnbnVjbGlkZS1zZXJ2ZXIvbGliL051Y2xpZGVDbGllbnQnKTtcbnZhciBOdWNsaWRlUmVtb3RlRXZlbnRidXMgPSByZXF1aXJlKCdudWNsaWRlLXNlcnZlci9saWIvTnVjbGlkZVJlbW90ZUV2ZW50YnVzJyk7XG52YXIge2ZzUHJvbWlzZX0gPSByZXF1aXJlKCdudWNsaWRlLWNvbW1vbnMnKTtcbnZhciB7Z2V0VmVyc2lvbn0gPSByZXF1aXJlKCdudWNsaWRlLXZlcnNpb24nKTtcblxuY29uc3QgSEVBUlRCRUFUX0FXQVlfUkVQT1JUX0NPVU5UID0gMztcbmNvbnN0IEhFQVJUQkVBVF9OT1RJRklDQVRJT05fRVJST1IgPSAxO1xuY29uc3QgSEVBUlRCRUFUX05PVElGSUNBVElPTl9XQVJOSU5HID0gMjtcblxudHlwZSBIZWFydGJlYXROb3RpZmljYXRpb24gPSB7XG4gIG5vdGlmaWNhdGlvbjogTm90aWZpY2F0aW9uO1xuICBjb2RlOiBzdHJpbmc7XG59XG5cbnR5cGUgUmVtb3RlQ29ubmVjdGlvbkNvbmZpZ3VyYXRpb24gPSB7XG4gIGhvc3Q6IHN0cmluZzsgLy8gaG9zdCBudWNsaWRlIHNlcnZlciBpcyBydW5uaW5nIG9uLlxuICBwb3J0OiBudW1iZXI7IC8vIHBvcnQgdG8gY29ubmVjdCB0by5cbiAgY3dkOiBzdHJpbmc7IC8vIFBhdGggdG8gcmVtb3RlIGRpcmVjdG9yeSB1c2VyIHNob3VsZCBzdGFydCBpbiB1cG9uIGNvbm5lY3Rpb24uXG4gIGNlcnRpZmljYXRlQXV0aG9yaXR5Q2VydGlmaWNhdGU6ID9CdWZmZXI7IC8vIGNlcnRpZmljYXRlIG9mIGNlcnRpZmljYXRlIGF1dGhvcml0eS5cbiAgY2xpZW50Q2VydGlmaWNhdGU6ID9CdWZmZXI7IC8vIGNsaWVudCBjZXJ0aWZpY2F0ZSBmb3IgaHR0cHMgY29ubmVjdGlvbi5cbiAgY2xpZW50S2V5OiA/QnVmZmVyOyAvLyBrZXkgZm9yIGh0dHBzIGNvbm5lY3Rpb24uXG59XG5cbnZhciBfY29ubmVjdGlvbnM6IEFycmF5PFJlbW90ZUNvbm5lY3Rpb24+ID0gW107XG52YXIgX2VtaXR0ZXI6IEV2ZW50RW1pdHRlciA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuY2xhc3MgUmVtb3RlQ29ubmVjdGlvbiB7XG4gIF9lbnRyaWVzOiB7W3BhdGg6IHN0cmluZ106IFJlbW90ZUZpbGV8UmVtb3RlRGlyZWN0b3J5fTtcbiAgX2NvbmZpZzogUmVtb3RlQ29ubmVjdGlvbkNvbmZpZ3VyYXRpb247XG4gIF9pbml0aWFsaXplZDogP2Jvb2w7XG4gIF9jbG9zZWQ6ID9ib29sO1xuXG4gIF9oZWFydGJlYXROZXR3b3JrQXdheUNvdW50OiBpbnQ7XG4gIF9sYXN0SGVhcnRiZWF0Tm90aWZpY2F0aW9uOiA/SGVhcnRiZWF0Tm90aWZpY2F0aW9uO1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogUmVtb3RlQ29ubmVjdGlvbkNvbmZpZ3VyYXRpb24pIHtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICB0aGlzLl9lbnRyaWVzID0ge307XG4gICAgdGhpcy5fY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMuX2hlYXJ0YmVhdE5ldHdvcmtBd2F5Q291bnQgPSAwO1xuICAgIHRoaXMuX2Nsb3NlZCA9IGZhbHNlO1xuICB9XG5cbiAgZGlzcG9zZSgpOiB2b2lkIHtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKTtcbiAgfVxuXG4gIC8vIEEgd29ya2Fyb3VuZCBiZWZvcmUgQXRvbSAyLjA6IEF0b20ncyBQcm9qZWN0OjpzZXRQYXRocyBjdXJyZW50bHkgdXNlc1xuICAvLyA6OnJlcG9zaXRvcnlGb3JEaXJlY3RvcnlTeW5jLCBzbyB3ZSBuZWVkIHRoZSByZXBvIGluZm9ybWF0aW9uIHRvIGFscmVhZHkgYmVcbiAgLy8gYXZhaWxhYmxlIHdoZW4gdGhlIG5ldyBwYXRoIGlzIGFkZGVkLiB0NjkxMzYyNCB0cmFja3MgY2xlYW51cCBvZiB0aGlzLlxuICBhc3luYyBfc2V0SGdSZXBvSW5mbygpOiB2b2lkIHtcbiAgICB2YXIgZXZlbnRCdXMgPSB0aGlzLmdldENsaWVudCgpLmV2ZW50YnVzO1xuICAgIHZhciByZW1vdGVQYXRoID0gdGhpcy5nZXRQYXRoRm9ySW5pdGlhbFdvcmtpbmdEaXJlY3RvcnkoKTtcbiAgICB2YXIgaGdSZXBvRGVzY3JpcHRpb24gPSBhd2FpdCBldmVudEJ1cy5jYWxsTWV0aG9kKFxuICAgICAgLypzZXJ2aWNlTmFtZSovICdzb3VyY2VDb250cm9sJyxcbiAgICAgIC8qbWV0aG9kTmFtZSovICdnZXRIZ1JlcG9zaXRvcnknLFxuICAgICAgLyptZXRob2RBcmdzKi8gW3JlbW90ZVBhdGhdLFxuICAgICAgLypleHRyYU9wdGlvbnMqLyB7bWV0aG9kOiAnUE9TVCcsIGpzb246IHRydWV9XG4gICAgKTtcbiAgICB0aGlzLl9zZXRIZ1JlcG9zaXRvcnlEZXNjcmlwdGlvbihoZ1JlcG9EZXNjcmlwdGlvbik7XG4gIH1cblxuICBfbW9uaXRvckNvbm5lY3Rpb25IZWFydGJlYXQoKSB7XG4gICAgdmFyIHNvY2tldCA9IHRoaXMuZ2V0Q2xpZW50KCkuZXZlbnRidXMuc29ja2V0O1xuICAgIHZhciBzZXJ2ZXJVcmkgPSBzb2NrZXQuZ2V0U2VydmVyVXJpKCk7XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGFuIEF0b20gbm90aWZpY2F0aW9uIGZvciB0aGUgZGV0ZWN0ZWQgaGVhcnRiZWF0IG5ldHdvcmsgc3RhdHVzXG4gICAgICogVGhlIGZ1bmN0aW9uIG1ha2VzIHN1cmUgbm90IHRvIGFkZCBtYW55IG5vdGlmaWNhdGlvbnMgZm9yIHRoZSBzYW1lIGV2ZW50IGFuZCBwcmlvcml0aXplIG5ldyBldmVudHMuXG4gICAgICovXG4gICAgdmFyIGFkZEhlYXJ0YmVhdE5vdGlmaWNhdGlvbiA9ICh0eXBlOiBzdHJpbmcsIGVycm9yQ29kZTogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcsIGRpc21pc3NhYmxlOiBib29sZWFuKSA9PiB7XG4gICAgICB2YXIge2NvZGUsIG5vdGlmaWNhdGlvbjogZXhpc3RpbmdOb3RpZmljYXRpb259ID0gdGhpcy5fbGFzdEhlYXJ0YmVhdE5vdGlmaWNhdGlvbiB8fCB7fTtcbiAgICAgIGlmIChjb2RlICYmIGNvZGUgPT09IGVycm9yQ29kZSAmJiBkaXNtaXNzYWJsZSkge1xuICAgICAgICAvLyBBIGRpc21pc3NpYmxlIGhlYXJ0YmVhdCBub3RpZmljYXRpb24gd2l0aCB0aGlzIGNvZGUgaXMgYWxyZWFkeSBhY3RpdmUuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciBub3RpZmljYXRpb247XG4gICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgY2FzZSBIRUFSVEJFQVRfTk9USUZJQ0FUSU9OX0VSUk9SOlxuICAgICAgICAgIG5vdGlmaWNhdGlvbiA9IGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihtZXNzYWdlLCB7ZGlzbWlzc2FibGV9KTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBIRUFSVEJFQVRfTk9USUZJQ0FUSU9OX1dBUk5JTkc6XG4gICAgICAgICAgbm90aWZpY2F0aW9uID0gYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcobWVzc2FnZSwge2Rpc21pc3NhYmxlfSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbnJlY29uZ25pemVkIGhlYXJ0YmVhdCBub3RpZmljYXRpb24gdHlwZScpO1xuICAgICAgfVxuICAgICAgaWYgKGV4aXN0aW5nTm90aWZpY2F0aW9uKSB7XG4gICAgICAgIGV4aXN0aW5nTm90aWZpY2F0aW9uLmRpc21pc3MoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX2xhc3RIZWFydGJlYXROb3RpZmljYXRpb24gPSB7XG4gICAgICAgIG5vdGlmaWNhdGlvbixcbiAgICAgICAgY29kZTogZXJyb3JDb2RlLFxuICAgICAgfTtcbiAgICB9O1xuXG4gICAgdmFyIG9uSGVhcnRiZWF0ID0gKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuX2xhc3RIZWFydGJlYXROb3RpZmljYXRpb24pIHtcbiAgICAgICAgLy8gSWYgdGhlcmUgaGFzIGJlZW4gZXhpc3RpbmcgaGVhcnRiZWF0IGVycm9yL3dhcm5pbmcsXG4gICAgICAgIC8vIHRoYXQgbWVhbnMgY29ubmVjdGlvbiBoYXMgYmVlbiBsb3N0IGFuZCB3ZSBzaGFsbCBzaG93IGEgbWVzc2FnZSBhYm91dCBjb25uZWN0aW9uXG4gICAgICAgIC8vIGJlaW5nIHJlc3RvcmVkIHdpdGhvdXQgYSByZWNvbm5lY3QgcHJvbXB0LlxuICAgICAgICB2YXIge25vdGlmaWNhdGlvbn0gPSB0aGlzLl9sYXN0SGVhcnRiZWF0Tm90aWZpY2F0aW9uO1xuICAgICAgICBub3RpZmljYXRpb24uZGlzbWlzcygpO1xuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkU3VjY2VzcygnQ29ubmVjdGlvbiByZXN0b3JlZCB0byBOdWNsaWRlIFNlcnZlciBhdDogJyArIHNlcnZlclVyaSk7XG4gICAgICAgIHRoaXMuX2hlYXJ0YmVhdE5ldHdvcmtBd2F5Q291bnQgPSAwO1xuICAgICAgICB0aGlzLl9sYXN0SGVhcnRiZWF0Tm90aWZpY2F0aW9uID0gbnVsbDtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIG5vdGlmeU5ldHdvcmtBd2F5ID0gKGNvZGU6IHN0cmluZykgPT4ge1xuICAgICAgdGhpcy5faGVhcnRiZWF0TmV0d29ya0F3YXlDb3VudCsrO1xuICAgICAgaWYgKHRoaXMuX2hlYXJ0YmVhdE5ldHdvcmtBd2F5Q291bnQgPj0gSEVBUlRCRUFUX0FXQVlfUkVQT1JUX0NPVU5UKSB7XG4gICAgICAgIGFkZEhlYXJ0YmVhdE5vdGlmaWNhdGlvbihIRUFSVEJFQVRfTk9USUZJQ0FUSU9OX1dBUk5JTkcsIGNvZGUsXG4gICAgICAgICAgJ051Y2xpZGUgc2VydmVyIGNhbiBub3QgYmUgcmVhY2hlZCBhdDogJyArIHNlcnZlclVyaSArXG4gICAgICAgICAgJzxici8+Q2hlY2sgeW91ciBuZXR3b3JrIGNvbm5lY3Rpb24hJyxcbiAgICAgICAgICAvKmRpc21pc3NhYmxlKi8gdHJ1ZSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHZhciBvbkhlYXJ0YmVhdEVycm9yID0gKGVycm9yOiBhbnkpID0+IHtcbiAgICAgIHZhciB7Y29kZSwgbWVzc2FnZSwgb3JpZ2luYWxDb2RlfSA9IGVycm9yO1xuICAgICAgbG9nZ2VyLmluZm8oJ0hlYXJ0YmVhdCBuZXR3b3JrIGVycm9yOicsIGNvZGUsIG9yaWdpbmFsQ29kZSwgbWVzc2FnZSk7XG4gICAgICBzd2l0Y2ggKGNvZGUpIHtcbiAgICAgICAgICBjYXNlICdORVRXT1JLX0FXQVknOlxuICAgICAgICAgICAgLy8gTm90aWZ5IHN3aXRjaGluZyBuZXR3b3JrcywgZGlzY29ubmVjdGVkLCB0aW1lb3V0LCB1bnJlYWNoYWJsZSBzZXJ2ZXIgb3IgZnJhZ2lsZSBjb25uZWN0aW9uLlxuICAgICAgICAgICAgbm90aWZ5TmV0d29ya0F3YXkoY29kZSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdTRVJWRVJfQ1JBU0hFRCc6XG4gICAgICAgICAgICAvLyBTZXJ2ZXIgc2h1dCBkb3duIG9yIHBvcnQgbm8gbG9uZ2VyIGFjY2Vzc2libGUuXG4gICAgICAgICAgICAvLyBOb3RpZnkgdGhlIHNlcnZlciB3YXMgdGhlcmUsIGJ1dCBub3cgZ29uZS5cbiAgICAgICAgICAgIGFkZEhlYXJ0YmVhdE5vdGlmaWNhdGlvbihIRUFSVEJFQVRfTk9USUZJQ0FUSU9OX0VSUk9SLCBjb2RlLFxuICAgICAgICAgICAgICAgICdOdWNsaWRlIHNlcnZlciBjcmFzaGVkITxici8+JyArXG4gICAgICAgICAgICAgICAgJ1BsZWFzZSByZWxvYWQgTnVjbGlkZSB0byByZXN0b3JlIHlvdXIgcmVtb3RlIHByb2plY3QgY29ubmVjdGlvbiEgOiAo4oyDLeKMpS3ijJgtTCknLFxuICAgICAgICAgICAgICAgIC8qZGlzbWlzc2FibGUqLyB0cnVlKTtcbiAgICAgICAgICAgIC8vIFRPRE8obW9zdCkgcmVjb25uZWN0IFJlbW90ZUNvbm5lY3Rpb24sIHJlc3RvcmUgdGhlIGN1cnJlbnQgcHJvamVjdCBzdGF0ZSxcbiAgICAgICAgICAgIC8vIGFuZCBmaW5hbGx5IGNoYW5nZSBkaXNtaXNzYWJsZSB0byBmYWxzZSBhbmQgdHlwZSB0byAnV0FSTklORycuXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdQT1JUX05PVF9BQ0NFU1NJQkxFJzpcbiAgICAgICAgICAgIC8vIE5vdGlmeSBuZXZlciBoZWFyZCBhIGhlYXJ0YmVhdCBmcm9tIHRoZSBzZXJ2ZXIuXG4gICAgICAgICAgICB2YXIge3BvcnR9ID0gdXJsLnBhcnNlKHNlcnZlclVyaSk7XG4gICAgICAgICAgICBhZGRIZWFydGJlYXROb3RpZmljYXRpb24oSEVBUlRCRUFUX05PVElGSUNBVElPTl9FUlJPUiwgY29kZSxcbiAgICAgICAgICAgICAgICAnTnVjbGlkZSBzZXJ2ZXIgaXMgbm90IHJlYWNoYWJsZS48YnIvPkl0IGNvdWxkIGJlIHJ1bm5pbmcgb24gYSBwb3J0IHRoYXQgaXMgbm90IGFjY2Vzc2libGU6ICcgKyBwb3J0LFxuICAgICAgICAgICAgICAgIC8qZGlzbWlzc2FibGUqLyB0cnVlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ0lOVkFMSURfQ0VSVElGSUNBVEUnOlxuICAgICAgICAgICAgLy8gTm90aWZ5IHRoZSBjbGllbnQgY2VydGlmaWNhdGUgaXMgbm90IGFjY2VwdGVkIGJ5IG51Y2xpZGUgc2VydmVyIChjZXJ0aWZpY2F0ZSBtaXNtYXRjaCkuXG4gICAgICAgICAgICBhZGRIZWFydGJlYXROb3RpZmljYXRpb24oSEVBUlRCRUFUX05PVElGSUNBVElPTl9FUlJPUiwgY29kZSxcbiAgICAgICAgICAgICAgICAnQ29ubmVjdGlvbiBSZXNldCBFcnJvciEhPGJyLz5UaGlzIGNvdWxkIGJlIGNhdXNlZCBieSB0aGUgY2xpZW50IGNlcnRpZmljYXRlIG1pc21hdGNoaW5nIHRoZSBzZXJ2ZXIgY2VydGlmaWNhdGUuPGJyLz4nICtcbiAgICAgICAgICAgICAgICAnUGxlYXNlIHJlbG9hZCBOdWNsaWRlIHRvIHJlc3RvcmUgeW91ciByZW1vdGUgcHJvamVjdCBjb25uZWN0aW9uISA6ICjijIMt4oylLeKMmC1MKScsXG4gICAgICAgICAgICAgICAgLypkaXNtaXNzYWJsZSovIHRydWUpO1xuICAgICAgICAgICAgLy8gVE9ETyhtb3N0KTogcmVjb25uZWN0IFJlbW90ZUNvbm5lY3Rpb24sIHJlc3RvcmUgdGhlIGN1cnJlbnQgcHJvamVjdCBzdGF0ZS5cbiAgICAgICAgICAgIC8vIGFuZCBmaW5hbGx5IGNoYW5nZSBkaXNtaXNzYWJsZSB0byBmYWxzZSBhbmQgdHlwZSB0byAnV0FSTklORycuXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgbm90aWZ5TmV0d29ya0F3YXkoY29kZSk7XG4gICAgICAgICAgICBsb2dnZXIuZXJyb3IoJ1VucmVjb25nbml6ZWQgaGVhcnRiZWF0IGVycm9yIGNvZGU6ICcgKyBjb2RlLCBtZXNzYWdlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBzb2NrZXQub24oJ2hlYXJ0YmVhdCcsIG9uSGVhcnRiZWF0KTtcbiAgICBzb2NrZXQub24oJ2hlYXJ0YmVhdC5lcnJvcicsIG9uSGVhcnRiZWF0RXJyb3IpO1xuXG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQobmV3IERpc3Bvc2FibGUoKCkgPT4ge1xuICAgICAgc29ja2V0LnJlbW92ZUxpc3RlbmVyKCdoZWFydGJlYXQnLCBvbkhlYXJ0YmVhdCk7XG4gICAgICBzb2NrZXQucmVtb3ZlTGlzdGVuZXIoJ2hlYXJ0YmVhdC5lcnJvcicsIG9uSGVhcnRiZWF0RXJyb3IpO1xuICAgIH0pKTtcbiAgfVxuXG4gIGdldFVyaU9mUmVtb3RlUGF0aChyZW1vdGVQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBgbnVjbGlkZTovLyR7dGhpcy5nZXRSZW1vdGVIb3N0KCl9JHtyZW1vdGVQYXRofWA7XG4gIH1cblxuICBnZXRQYXRoT2ZVcmkodXJpOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiB1cmwucGFyc2UodXJpKS5wYXRoO1xuICB9XG5cbiAgY3JlYXRlRGlyZWN0b3J5KHVyaTogc3RyaW5nKTogP1JlbW90ZURpcmVjdG9yeSB7XG4gICAgdmFyIHtwYXRofSA9IHVybC5wYXJzZSh1cmkpO1xuICAgIHBhdGggPSByZXF1aXJlKCdwYXRoJykubm9ybWFsaXplKHBhdGgpO1xuXG4gICAgdmFyIGVudHJ5ID0gdGhpcy5fZW50cmllc1twYXRoXTtcbiAgICBpZiAoIWVudHJ5IHx8IGVudHJ5LmdldExvY2FsUGF0aCgpICE9PSBwYXRoKSB7XG4gICAgICB0aGlzLl9lbnRyaWVzW3BhdGhdID0gZW50cnkgPSBuZXcgUmVtb3RlRGlyZWN0b3J5KFxuICAgICAgICB0aGlzLFxuICAgICAgICB0aGlzLmdldFVyaU9mUmVtb3RlUGF0aChwYXRoKSxcbiAgICAgICAge2hnUmVwb3NpdG9yeURlc2NyaXB0aW9uOiB0aGlzLl9oZ1JlcG9zaXRvcnlEZXNjcmlwdGlvbn1cbiAgICAgICk7XG4gICAgICAvLyBUT0RPOiBXZSBzaG91bGQgYWRkIHRoZSBmb2xsb3dpbmcgbGluZSB0byBrZWVwIHRoZSBjYWNoZSB1cC10by1kYXRlLlxuICAgICAgLy8gV2UgbmVlZCB0byBpbXBsZW1lbnQgb25EaWRSZW5hbWUgYW5kIG9uRGlkRGVsZXRlIGluIFJlbW90ZURpcmVjdG9yeVxuICAgICAgLy8gZmlyc3QuIEl0J3Mgb2sgdGhhdCB3ZSBkb24ndCBhZGQgdGhlIGhhbmRsZXJzIGZvciBub3cgc2luY2Ugd2UgaGF2ZVxuICAgICAgLy8gdGhlIGNoZWNrIGBlbnRyeS5nZXRMb2NhbFBhdGgoKSAhPT0gcGF0aGAgYWJvdmUuXG4gICAgICAvL1xuICAgICAgLy8gdGhpcy5fYWRkSGFuZGxlcnNGb3JFbnRyeShlbnRyeSk7XG4gICAgfVxuXG4gICAgaWYgKCFlbnRyeS5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BhdGggaXMgbm90IGEgZGlyZWN0b3J5OicgKyB1cmkpO1xuICAgIH1cblxuICAgIHJldHVybiBlbnRyeTtcbiAgfVxuXG4gIC8vIEEgd29ya2Fyb3VuZCBiZWZvcmUgQXRvbSAyLjA6IHNlZSA6OmdldEhnUmVwb0luZm8gb2YgbWFpbi5qcy5cbiAgX3NldEhnUmVwb3NpdG9yeURlc2NyaXB0aW9uKGhnUmVwb3NpdG9yeURlc2NyaXB0aW9uKTogdm9pZCB7XG4gICAgdGhpcy5faGdSZXBvc2l0b3J5RGVzY3JpcHRpb24gPSBoZ1JlcG9zaXRvcnlEZXNjcmlwdGlvbjtcbiAgfVxuXG4gIGNyZWF0ZUZpbGUodXJpOiBzdHJpbmcpOiA/UmVtb3RlRmlsZSB7XG4gICAgdmFyIHtwYXRofSA9IHVybC5wYXJzZSh1cmkpO1xuICAgIHBhdGggPSByZXF1aXJlKCdwYXRoJykubm9ybWFsaXplKHBhdGgpO1xuXG4gICAgdmFyIGVudHJ5ID0gdGhpcy5fZW50cmllc1twYXRoXTtcbiAgICBpZiAoIWVudHJ5IHx8IGVudHJ5LmdldExvY2FsUGF0aCgpICE9PSBwYXRoKSB7XG4gICAgICB0aGlzLl9lbnRyaWVzW3BhdGhdID0gZW50cnkgPSBuZXcgUmVtb3RlRmlsZSh0aGlzLCB0aGlzLmdldFVyaU9mUmVtb3RlUGF0aChwYXRoKSk7XG4gICAgICB0aGlzLl9hZGRIYW5kbGVyc0ZvckVudHJ5KGVudHJ5KTtcbiAgICB9XG5cbiAgICBpZiAoZW50cnkuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdQYXRoIGlzIG5vdCBhIGZpbGUnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZW50cnk7XG4gIH1cblxuICBfYWRkSGFuZGxlcnNGb3JFbnRyeShlbnRyeTogRmlsZSB8IERpcmVjdG9yeSk6IHZvaWQge1xuICAgIHZhciBvbGRQYXRoID0gZW50cnkuZ2V0TG9jYWxQYXRoKCk7XG4gICAgdmFyIHJlbmFtZVN1YnNjcmlwdGlvbiA9IGVudHJ5Lm9uRGlkUmVuYW1lKCgpID0+IHtcbiAgICAgIGRlbGV0ZSB0aGlzLl9lbnRyaWVzW29sZFBhdGhdO1xuICAgICAgdGhpcy5fZW50cmllc1tlbnRyeS5nZXRMb2NhbFBhdGgoKV0gPSBlbnRyeTtcbiAgICB9KTtcbiAgICB2YXIgZGVsZXRlU3Vic2NyaXB0aW9uID0gZW50cnkub25EaWREZWxldGUoKCkgPT4ge1xuICAgICAgZGVsZXRlIHRoaXMuX2VudHJpZXNbZW50cnkuZ2V0TG9jYWxQYXRoKCldO1xuICAgICAgcmVuYW1lU3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcbiAgICAgIGRlbGV0ZVN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBpbml0aWFsaXplKCk6IHZvaWQge1xuICAgIC8vIFJpZ2h0IG5vdyB3ZSBkb24ndCByZS1oYW5kc2hha2UuXG4gICAgaWYgKHRoaXMuX2luaXRpYWxpemVkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuX2luaXRpYWxpemVkID0gZmFsc2U7XG4gICAgICAvLyBEbyB2ZXJzaW9uIGNoZWNrLlxuICAgICAgdmFyIGNsaWVudCA9IHRoaXMuX2dldENsaWVudCgpO1xuICAgICAgdmFyIHNlcnZlclZlcnNpb247XG4gICAgICB0cnkge1xuICAgICAgICBzZXJ2ZXJWZXJzaW9uID0gYXdhaXQgY2xpZW50LnZlcnNpb24oKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2xpZW50LmNsb3NlKCk7XG4gICAgICAgIHRocm93IGU7XG4gICAgICB9XG4gICAgICB2YXIgY2xpZW50VmVyc2lvbiA9IGdldFZlcnNpb24oKTtcbiAgICAgIGlmIChjbGllbnRWZXJzaW9uICE9IHNlcnZlclZlcnNpb24pIHtcbiAgICAgICAgY2xpZW50LmNsb3NlKCk7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVmVyc2lvbiBtaXNtYXRjaC4gQ2xpZW50IGF0ICR7Y2xpZW50VmVyc2lvbn0gd2hpbGUgc2VydmVyIGF0ICR7c2VydmVyVmVyc2lvbn0uYCk7XG4gICAgICB9XG4gICAgICB0aGlzLl9pbml0aWFsaXplZCA9IHRydWU7XG4gICAgICB0aGlzLl9tb25pdG9yQ29ubmVjdGlvbkhlYXJ0YmVhdCgpO1xuICAgICAgLy8gQSB3b3JrYXJvdW5kIGJlZm9yZSBBdG9tIDIuMDogc2VlIDo6Z2V0SGdSZXBvSW5mby5cbiAgICAgIGF3YWl0IHRoaXMuX3NldEhnUmVwb0luZm8oKTtcbiAgICAgIC8vIFNhdmUgdG8gY2FjaGUuXG4gICAgICB0aGlzLl9hZGRDb25uZWN0aW9uKCk7XG4gICAgfVxuICB9XG5cbiAgX2FkZENvbm5lY3Rpb24oKSB7XG4gICAgX2Nvbm5lY3Rpb25zLnB1c2godGhpcyk7XG4gICAgX2VtaXR0ZXIuZW1pdCgnZGlkLWFkZCcsIHRoaXMpO1xuICB9XG5cbiAgY2xvc2UoKTogdm9pZCB7XG4gICAgLy8gQ2xvc2UgdGhlIGV2ZW50YnVzIHRoYXQgd2lsbCBzdG9wIHRoZSBoZWFydGJlYXQgaW50ZXJ2YWwsIHdlYnNvY2tldCByZWNvbm5lY3QgdHJpYWxzLCAuLmV0Yy5cbiAgICBpZiAodGhpcy5fY2xpZW50KSB7XG4gICAgICB0aGlzLl9jbGllbnQuY2xvc2UoKTtcbiAgICAgIHRoaXMuX2NsaWVudCA9IG51bGw7XG4gICAgfVxuICAgIGlmICghdGhpcy5fY2xvc2VkKSB7XG4gICAgICAvLyBGdXR1cmUgZ2V0Q2xpZW50IGNhbGxzIHNob3VsZCBmYWlsLCBpZiBpdCBoYXMgYSBjYWNoZWQgUmVtb3RlQ29ubmVjdGlvbiBpbnN0YW5jZS5cbiAgICAgIHRoaXMuX2Nsb3NlZCA9IHRydWU7XG4gICAgICAvLyBSZW1vdmUgZnJvbSBfY29ubmVjdGlvbnMgdG8gbm90IGJlIGNvbnNpZGVyZWQgaW4gZnV0dXJlIGNvbm5lY3Rpb24gcXVlcmllcy5cbiAgICAgIF9jb25uZWN0aW9ucy5zcGxpY2UoX2Nvbm5lY3Rpb25zLmluZGV4T2YodGhpcyksIDEpO1xuICAgICAgX2VtaXR0ZXIuZW1pdCgnZGlkLWNsb3NlJywgdGhpcyk7XG4gICAgfVxuICB9XG5cbiAgZ2V0Q2xpZW50KCk6IE51Y2xpZGVDbGllbnQge1xuICAgIGlmICghdGhpcy5faW5pdGlhbGl6ZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUmVtb3RlIGNvbm5lY3Rpb24gaGFzIG5vdCBiZWVuIGluaXRpYWxpemVkLicpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fY2xvc2VkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlbW90ZSBjb25uZWN0aW9uIGhhcyBiZWVuIGNsb3NlZC4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuX2dldENsaWVudCgpO1xuICAgIH1cbiAgfVxuXG4gIF9nZXRDbGllbnQoKTogTnVjbGlkZUNsaWVudCB7XG4gICAgaWYgKCF0aGlzLl9jbGllbnQpIHtcbiAgICAgIHZhciB1cmk7XG4gICAgICB2YXIgY3dkID0gdGhpcy5fY29uZmlnLmN3ZDtcbiAgICAgIHZhciBvcHRpb25zID0ge307XG5cbiAgICAgIC8vIFVzZSBodHRwcyBpZiB3ZSBoYXZlIGtleSwgY2VydCwgYW5kIGNhXG4gICAgICBpZiAodGhpcy5faXNTZWN1cmUoKSkge1xuICAgICAgICBvcHRpb25zLmNlcnRpZmljYXRlQXV0aG9yaXR5Q2VydGlmaWNhdGUgPSB0aGlzLl9jb25maWcuY2VydGlmaWNhdGVBdXRob3JpdHlDZXJ0aWZpY2F0ZTtcbiAgICAgICAgb3B0aW9ucy5jbGllbnRDZXJ0aWZpY2F0ZSA9IHRoaXMuX2NvbmZpZy5jbGllbnRDZXJ0aWZpY2F0ZTtcbiAgICAgICAgb3B0aW9ucy5jbGllbnRLZXkgPSB0aGlzLl9jb25maWcuY2xpZW50S2V5O1xuICAgICAgICB1cmkgPSBgaHR0cHM6Ly8ke3RoaXMuZ2V0UmVtb3RlSG9zdCgpfWA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1cmkgPSBgaHR0cDovLyR7dGhpcy5nZXRSZW1vdGVIb3N0KCl9YDtcbiAgICAgIH1cblxuICAgICAgLy8gVGhlIHJlbW90ZSBjb25uZWN0aW9uIGFuZCBjbGllbnQgYXJlIGlkZW50aWZpZWQgYnkgYm90aCB0aGUgcmVtb3RlIGhvc3QgYW5kIHRoZSBpbml0YWwgd29ya2luZyBkaXJlY3RvcnkuXG4gICAgICB2YXIgY2xpZW50SWQgPSB0aGlzLmdldFJlbW90ZUhvc3QoKSArIHRoaXMuZ2V0UGF0aEZvckluaXRpYWxXb3JraW5nRGlyZWN0b3J5KCk7XG4gICAgICB0aGlzLl9jbGllbnQgPSBuZXcgTnVjbGlkZUNsaWVudChjbGllbnRJZCwgbmV3IE51Y2xpZGVSZW1vdGVFdmVudGJ1cyh1cmksIG9wdGlvbnMpLCB7Y3dkfSk7XG4gICAgICAvLyBTdGFydCB3YXRjaGluZyB0aGUgcHJvamVjdCBmb3IgY2hhbmdlcy5cbiAgICAgIHRoaXMuX2NsaWVudC53YXRjaERpcmVjdG9yeVJlY3Vyc2l2ZShjd2QsIC8qIGRvIG5vdGhpbmcgb24gY2hhbmdlICovKCkgPT4ge30pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgdmFyIHdhcm5pbmdNZXNzYWdlID0gJ1dhdGNoZXIgZmFpbGVkIHRvIHN0YXJ0IC0gd2F0Y2hlciBmZWF0dXJlcyBkaXNhYmxlZCE8YnIvPicgK1xuICAgICAgICAgICAgKGVyci5tZXNzYWdlID8gKCdERVRBSUxTOiAnICsgZXJyLm1lc3NhZ2UpIDogJycpO1xuICAgICAgICAvLyBBZGQgYSBwZXJzaXN0ZW50IHdhcm5pbmcgbWVzc2FnZSB0byBtYWtlIHN1cmUgdGhlIHVzZXIgc2VlcyBpdCBhbmQgaW50ZW50aW9uYWxseSBkaXNtaXNzaW5nIGl0LlxuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyh3YXJuaW5nTWVzc2FnZSwge2Rpc21pc3NhYmxlOiB0cnVlfSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2NsaWVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBNYWtlIHJwYyBjYWxsIHRocm91Z2ggdGhpcyBjb25uZWN0aW9uIGdpdmVuIHNlcnZpY2VVcmkgaW4gZm9ybSBvZiBgJHNlcnZpY2VOYW1lLyRtZXRob2ROYW1lYFxuICAgKiBhbmQgYXJncyBhcyBhcmd1bWVudHMgbGlzdC5cbiAgICovXG4gIG1ha2VScGMoc2VydmljZVVyaTogc3RyaW5nLCBhcmdzOiBBcnJheTxhbnk+LCBzZXJ2aWNlT3B0aW9uczogYW55KTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gdGhpcy5nZXRDbGllbnQoKS5tYWtlUnBjKHNlcnZpY2VVcmksIGFyZ3MsIHNlcnZpY2VPcHRpb25zKTtcbiAgfVxuXG4gIHJlZ2lzdGVyRXZlbnRMaXN0ZW5lcihldmVudE5hbWU6IHN0cmluZywgY2FsbGJhY2s6IChwYXlsb2FkOiBhbnkpID0+IHZvaWQsIHNlcnZpY2VPcHRpb25zOiBhbnkpOiBEaXNwb3NhYmxlIHtcbiAgICByZXR1cm4gdGhpcy5nZXRDbGllbnQoKS5yZWdpc3RlckV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBjYWxsYmFjaywgc2VydmljZU9wdGlvbnMpO1xuICB9XG5cblxuICBfaXNTZWN1cmUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbmZpZy5jZXJ0aWZpY2F0ZUF1dGhvcml0eUNlcnRpZmljYXRlXG4gICAgICAgICYmIHRoaXMuX2NvbmZpZy5jbGllbnRDZXJ0aWZpY2F0ZVxuICAgICAgICAmJiB0aGlzLl9jb25maWcuY2xpZW50S2V5O1xuICB9XG5cbiAgZ2V0UmVtb3RlSG9zdCgpOiBzdHJpbmcge1xuICAgIHJldHVybiBgJHt0aGlzLl9jb25maWcuaG9zdH06JHt0aGlzLl9jb25maWcucG9ydH1gO1xuICB9XG5cbiAgZ2V0UmVtb3RlSG9zdG5hbWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fY29uZmlnLmhvc3Q7XG4gIH1cblxuICBnZXRVcmlGb3JJbml0aWFsV29ya2luZ0RpcmVjdG9yeSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmdldFVyaU9mUmVtb3RlUGF0aCh0aGlzLmdldFBhdGhGb3JJbml0aWFsV29ya2luZ0RpcmVjdG9yeSgpKTtcbiAgfVxuXG4gIGdldFBhdGhGb3JJbml0aWFsV29ya2luZ0RpcmVjdG9yeSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLl9jb25maWcuY3dkO1xuICB9XG5cbiAgZ2V0Q29uZmlnKCk6IFJlbW90ZUNvbm5lY3Rpb25Db25maWd1cmF0aW9ue1xuICAgIHJldHVybiB0aGlzLl9jb25maWc7XG4gIH1cblxuICBzdGF0aWMgb25EaWRBZGRSZW1vdGVDb25uZWN0aW9uKGhhbmRsZXI6IChjb25uZWN0aW9uOiBSZW1vdGVDb25uZWN0aW9uKSA9PiB2b2lkKTogRGlzcG9zYWJsZSB7XG4gICAgX2VtaXR0ZXIub24oJ2RpZC1hZGQnLCBoYW5kbGVyKTtcbiAgICByZXR1cm4gbmV3IERpc3Bvc2FibGUoKCkgPT4ge1xuICAgICAgX2VtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoJ2RpZC1hZGQnLCBoYW5kbGVyKTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBvbkRpZENsb3NlUmVtb3RlQ29ubmVjdGlvbihoYW5kbGVyOiAoY29ubmVjdGlvbjogUmVtb3RlQ29ubmVjdGlvbikgPT4gdm9pZCk6IERpc3Bvc2FibGUge1xuICAgIF9lbWl0dGVyLm9uKCdkaWQtY2xvc2UnLCBoYW5kbGVyKTtcbiAgICByZXR1cm4gbmV3IERpc3Bvc2FibGUoKCkgPT4ge1xuICAgICAgX2VtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoJ2RpZC1jbG9zZScsIGhhbmRsZXIpO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGdldEZvclVyaSh1cmk6IHN0cmluZyk6ID9SZW1vdGVDb25uZWN0aW9uIHtcbiAgICB2YXIge2hvc3RuYW1lLCBwYXRofSA9IHVybC5wYXJzZSh1cmkpO1xuICAgIHJldHVybiBSZW1vdGVDb25uZWN0aW9uLmdldEJ5SG9zdG5hbWVBbmRQYXRoKGhvc3RuYW1lLCBwYXRoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgY2FjaGVkIGNvbm5lY3Rpb24gbWF0Y2ggdGhlIGhvc3RuYW1lIGFuZCB0aGUgcGF0aCBoYXMgdGhlIHByZWZpeCBvZiBjb25uZWN0aW9uLmN3ZC4gSWYgcGF0aCBpcyBudWxsLFxuICAgKiB0aGVuIHJldHVybiB0aGUgY29ubmVjdGlvbiB3aG8gbWF0Y2hlcyB0aGUgaG9zdG5hbWUgYW5kIGlnbm9yZSBjb25uZWN0aW9uLmN3ZC5cbiAgICovXG4gIHN0YXRpYyBnZXRCeUhvc3RuYW1lQW5kUGF0aChob3N0bmFtZTogc3RyaW5nLCBwYXRoOiA/c3RyaW5nKTogP1JlbW90ZUNvbm5lY3Rpb24ge1xuICAgIHJldHVybiBfY29ubmVjdGlvbnMuZmlsdGVyKChjb25uZWN0aW9uKSA9PiB7XG4gICAgICByZXR1cm4gY29ubmVjdGlvbi5nZXRSZW1vdGVIb3N0bmFtZSgpID09PSBob3N0bmFtZSAmJlxuICAgICAgICAgIChwYXRoID09PSBudWxsIHx8IHBhdGguc3RhcnRzV2l0aChjb25uZWN0aW9uLmdldFBhdGhGb3JJbml0aWFsV29ya2luZ0RpcmVjdG9yeSgpKSk7XG4gICAgfSlbMF07XG4gIH1cblxuICBzdGF0aWMgZ2V0QnlIb3N0bmFtZShob3N0bmFtZTogc3RyaW5nKTogQXJyYXk8UmVtb3RlQ29ubmVjdGlvbj4ge1xuICAgIHJldHVybiBfY29ubmVjdGlvbnMuZmlsdGVyKGNvbm5lY3Rpb24gPT4gY29ubmVjdGlvbi5nZXRSZW1vdGVIb3N0bmFtZSgpID09PSBob3N0bmFtZSk7XG4gIH1cbn1cblxuLy8gRXhwb3NlIGxvY2FsIHZhcmlhYmxlcyBmb3IgdGVzdGFiaWxpdHkuXG5SZW1vdGVDb25uZWN0aW9uLnRlc3QgPSB7XG4gIGNvbm5lY3Rpb25zOiBfY29ubmVjdGlvbnMsXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbW90ZUNvbm5lY3Rpb247XG4iXX0=