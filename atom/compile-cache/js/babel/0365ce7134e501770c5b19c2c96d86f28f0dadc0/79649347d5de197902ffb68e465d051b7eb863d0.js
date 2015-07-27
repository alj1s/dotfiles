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

var SshConnection = require('ssh2').Client;
var fs = require('fs-plus');
var net = require('net');
var url = require('url');
var logger = require('nuclide-logging').getLogger();

var RemoteConnection = require('./RemoteConnection');

var _require = require('nuclide-commons');

var fsPromise = _require.fsPromise;

// Sync word and regex pattern for parsing command stdout.
var SYNC_WORD = 'SYNSYN';
var STDOUT_REGEX = /SYNSYN\n([\s\S]*)\nSYNSYN/;

var SupportedMethods = {
  SSL_AGENT: 'SSL_AGENT',
  PASSWORD: 'PASSWORD',
  PRIVATE_KEY: 'PRIVATE_KEY'
};

/**
 * The server is asking for replies to the given prompts for
 * keyboard-interactive user authentication.
 *
 * @param name is generally what you'd use as
 *     a window title (for GUI apps).
 * @param prompts is an array of { prompt: 'Password: ',
 *     echo: false } style objects (here echo indicates whether user input
 *     should be displayed on the screen).
 * @param finish: The answers for all prompts must be provided as an
 *     array of strings and passed to finish when you are ready to continue. Note:
 *     It's possible for the server to come back and ask more questions.
 */

var SshHandshake = (function () {
  function SshHandshake(delegate, connection) {
    var _this = this;

    _classCallCheck(this, SshHandshake);

    this._delegate = delegate;
    this._heartbeatNetworkAwayCount = 0;
    this._connection = connection ? connection : new SshConnection();
    this._connection.on('ready', this._onConnect.bind(this));
    this._connection.on('error', function (e) {
      return _this._delegate.onError(e, _this._config);
    });
    this._connection.on('keyboard-interactive', this._onKeyboardInteractive.bind(this));
  }

  _createClass(SshHandshake, [{
    key: 'connect',
    value: function connect(config) {
      var _this2 = this;

      var existingConnection = RemoteConnection.getByHostnameAndPath(config.host, config.cwd);
      if (existingConnection) {
        this._delegate.onConnect(existingConnection, this._config);
        return;
      }

      this._config = config;

      var lookupPreferIpv6 = require('nuclide-commons').dnsUtils.lookupPreferIpv6;

      lookupPreferIpv6(config.host).then(function (address) {
        if (config.authMethod === SupportedMethods.SSL_AGENT) {
          // Point to ssh-agent's socket for ssh-agent-based authentication.
          var agent = process.env['SSH_AUTH_SOCK'];
          if (!agent && /^win/.test(process.platform)) {
            // #100: On Windows, fall back to pageant.
            agent = 'pageant';
          }
          _this2._connection.connect({
            host: address,
            port: config.sshPort,
            username: config.username,
            agent: agent,
            tryKeyboard: true
          });
        } else if (config.authMethod === SupportedMethods.PASSWORD) {
          // When the user chooses password-based authentication, we specify
          // the config as follows so that it tries simple password auth and
          // failing that it falls through to the keyboard interactive path
          _this2._connection.connect({
            host: address,
            port: config.sshPort,
            username: config.username,
            password: config.password,
            tryKeyboard: true
          });
        } else if (config.authMethod === SupportedMethods.PRIVATE_KEY) {
          // We use fs-plus's normalize() function because it will expand the ~, if present.
          var expandedPath = fs.normalize(config.pathToPrivateKey);
          fsPromise.readFile(expandedPath).then(function (privateKey) {
            _this2._connection.connect({
              host: address,
              port: config.sshPort,
              username: config.username,
              privateKey: privateKey,
              tryKeyboard: true
            });
          })['catch'](function (e) {
            _this2._delegate.onError(e, _this2._config);
          });
        } else {
          throw new Error('Invalid authentication method');
        }
      })['catch'](function (e) {
        _this2._delegate.onError(e, _this2._config);
      });
    }
  }, {
    key: 'cancel',
    value: function cancel() {
      this._connection.end();
    }
  }, {
    key: '_onKeyboardInteractive',
    value: function _onKeyboardInteractive(name, instructions, instructionsLang, prompts, finish) {
      this._delegate.onKeyboardInteractive(name, instructions, instructionsLang, prompts, finish);
    }
  }, {
    key: '_forwardSocket',
    value: function _forwardSocket(socket) {
      this._connection.forwardOut(socket.remoteAddress, socket.remotePort, 'localhost', this._remotePort, function (err, stream) {
        if (err) {
          socket.end();
          logger.error(err);
          return;
        }

        socket.pipe(stream);
        stream.pipe(socket);
      });
    }
  }, {
    key: '_updateServerInfo',
    value: function _updateServerInfo(serverInfo) {
      this._remotePort = serverInfo.port;
      this._remoteHost = '' + (serverInfo.hostname || this._config.host);
      // Because the value for the Initial Directory that the user supplied may have
      // been a symlink that was resolved by the server, overwrite the original `cwd`
      // value with the resolved value.
      this._config.cwd = serverInfo.workspace;
      this._certificateAuthorityCertificate = serverInfo.ca;
      this._clientCertificate = serverInfo.cert;
      this._clientKey = serverInfo.key;
    }
  }, {
    key: '_isSecure',
    value: function _isSecure() {
      return this._certificateAuthorityCertificate && this._clientCertificate && this._clientKey;
    }
  }, {
    key: '_startRemoteServer',
    value: function _startRemoteServer() {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        var errorText = '';
        var stdOut = '';

        //TODO: escape any single quotes
        //TODO: the timeout value shall be configurable using .json file too (t6904691).
        var cmd = _this3._config.remoteServerCommand + ' --workspace=' + _this3._config.cwd + ' --common_name=' + _this3._config.host + ' -t 20';
        // Add sync word before and after the remote command, so that we can extract the stdout
        // without noises from .bashrc or .bash_profile.
        // Note: we use --login to imitate a login shell.  This will only execute
        // .profile/.bash_profile/.bash_login.  .bashrc will only be loaded if
        // it is sourced in one of the login scripts.  This is pretty typical
        // though so likely .bashrc will be loaded.
        // Note 2: We also run this as an interactive shell, even though it isn't.
        // That is so anything behind an `if [ -z $PS1 ]`, such as adding entries
        // to the $PATH, will not be skipped
        _this3._connection.exec('bash --login -i -c \'echo ' + SYNC_WORD + ';' + cmd + ';echo ' + SYNC_WORD + '\'', function (err, stream) {
          if (err) {
            reject(err);
            return;
          }
          stream.on('close', _asyncToGenerator(function* (code, signal) {
            var rejectWithError = function rejectWithError(error) {
              logger.error(error);
              errorText = error + '\n\nstderr:' + errorText;
              reject(new Error(errorText));
            };

            if (code === 0) {
              var serverInfo;
              var match = STDOUT_REGEX.exec(stdOut);
              if (!match) {
                rejectWithError('Bad stdout from remote server: ' + stdOut);
                return;
              }
              try {
                serverInfo = JSON.parse(match[1]);
              } catch (e) {
                rejectWithError('Bad JSON reply from Nuclide server: ' + match[1]);
                return;
              }
              if (!serverInfo.workspace) {
                rejectWithError('Could not find directory: ' + _this3._config.cwd);
                return;
              }

              // Update server info that is needed for setting up client.
              _this3._updateServerInfo(serverInfo);
              resolve(undefined);
            } else {
              reject(new Error(errorText));
            }
          })).on('data', function (data) {
            stdOut += data;
          }).stderr.on('data', function (data) {
            errorText += data;
          });
        });
      });
    }
  }, {
    key: '_onConnect',
    value: _asyncToGenerator(function* () {
      var _this4 = this;

      try {
        yield this._startRemoteServer();
      } catch (e) {
        this._delegate.onError(e, this._config);
        return;
      }

      var finishHandshake = _asyncToGenerator(function* (connection) {
        try {
          yield connection.initialize();
        } catch (e) {
          error = new Error('Failed to connect to Nuclide server on ' + _this4._config.host + ': ' + e.message);
          _this4._delegate.onError(error, _this4._config);
        }
        _this4._delegate.onConnect(connection, _this4._config);
      });

      // Use an ssh tunnel if server is not secure
      if (this._isSecure()) {
        var connection = new RemoteConnection({
          host: this._remoteHost,
          port: this._remotePort,
          cwd: this._config.cwd,
          certificateAuthorityCertificate: this._certificateAuthorityCertificate,
          clientCertificate: this._clientCertificate,
          clientKey: this._clientKey
        });
        finishHandshake(connection);
      } else {
        this._forwardingServer = net.createServer(function (sock) {
          _this4._forwardSocket(sock);
        }).listen(0, 'localhost', function () {
          var connection = new RemoteConnection({
            host: 'localhost',
            port: _this4._getLocalPort(),
            cwd: _this4._config.cwd
          });
          finishHandshake(connection);
        });
      }
    })
  }, {
    key: '_getLocalPort',
    value: function _getLocalPort() {
      return this._forwardingServer ? this._forwardingServer.address().port : null;
    }
  }, {
    key: 'getConfig',
    value: function getConfig() {
      return this._config;
    }
  }]);

  return SshHandshake;
})();

SshHandshake.SupportedMethods = SupportedMethods;

module.exports = SshHandshake;
// host nuclide server is running on
// ssh port of host nuclide server is running on
// username to authenticate as
// The path to private key
// Command to use to start server
// Path to remote directory user should start in upon connection.
// Which of the authentication methods in `SupportedMethods` to use.
// for simple password-based authentication

/** Invoked when server requests keyboard interaction */

/** Invoked when connection is sucessful */

/** Invoked when connection is fails */
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9ub2RlX21vZHVsZXMvbnVjbGlkZS1yZW1vdGUtY29ubmVjdGlvbi9saWIvU3NoSGFuZHNoYWtlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBV1osSUFBSSxhQUFhLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUMzQyxJQUFJLEVBQUUsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDNUIsSUFBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3pCLElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN6QixJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQzs7QUFFcEQsSUFBSSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQzs7ZUFDbkMsT0FBTyxDQUFDLGlCQUFpQixDQUFDOztJQUF2QyxTQUFTLFlBQVQsU0FBUzs7O0FBR2QsSUFBSSxTQUFTLEdBQUcsUUFBUSxDQUFDO0FBQ3pCLElBQUksWUFBWSxHQUFHLDJCQUEyQixDQUFDOztBQWEvQyxJQUFJLGdCQUFnQixHQUFHO0FBQ3JCLFdBQVMsRUFBRSxXQUFXO0FBQ3RCLFVBQVEsRUFBRSxVQUFVO0FBQ3BCLGFBQVcsRUFBRSxhQUFhO0NBQzNCLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7SUErQkksWUFBWTtBQWFMLFdBYlAsWUFBWSxDQWFKLFFBQStCLEVBQUUsVUFBMEIsRUFBRTs7OzBCQWJyRSxZQUFZOztBQWNkLFFBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO0FBQzFCLFFBQUksQ0FBQywwQkFBMEIsR0FBRyxDQUFDLENBQUM7QUFDcEMsUUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLEdBQUcsVUFBVSxHQUFHLElBQUksYUFBYSxFQUFFLENBQUM7QUFDakUsUUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDekQsUUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLFVBQUEsQ0FBQzthQUFJLE1BQUssU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsTUFBSyxPQUFPLENBQUM7S0FBQSxDQUFDLENBQUM7QUFDM0UsUUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsc0JBQXNCLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0dBQ3JGOztlQXBCRyxZQUFZOztXQXNCVCxpQkFBQyxNQUFrQyxFQUFROzs7QUFDaEQsVUFBSSxrQkFBa0IsR0FBRyxnQkFBZ0IsQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN4RixVQUFJLGtCQUFrQixFQUFFO0FBQ3RCLFlBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUMzRCxlQUFPO09BQ1I7O0FBRUQsVUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7O1VBRWpCLGdCQUFnQixHQUFJLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLFFBQVEsQ0FBdkQsZ0JBQWdCOztBQUVyQixzQkFBZ0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUMsT0FBTyxFQUFLO0FBQzlDLFlBQUksTUFBTSxDQUFDLFVBQVUsS0FBSyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUU7O0FBRXBELGNBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLENBQUM7QUFDekMsY0FBSSxDQUFDLEtBQUssSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTs7QUFFM0MsaUJBQUssR0FBRyxTQUFTLENBQUM7V0FDbkI7QUFDRCxpQkFBSyxXQUFXLENBQUMsT0FBTyxDQUFDO0FBQ3ZCLGdCQUFJLEVBQUUsT0FBTztBQUNiLGdCQUFJLEVBQUUsTUFBTSxDQUFDLE9BQU87QUFDcEIsb0JBQVEsRUFBRSxNQUFNLENBQUMsUUFBUTtBQUN6QixpQkFBSyxFQUFMLEtBQUs7QUFDTCx1QkFBVyxFQUFFLElBQUk7V0FDbEIsQ0FBQyxDQUFDO1NBQ0osTUFBTSxJQUFJLE1BQU0sQ0FBQyxVQUFVLEtBQUssZ0JBQWdCLENBQUMsUUFBUSxFQUFFOzs7O0FBSXhELGlCQUFLLFdBQVcsQ0FBQyxPQUFPLENBQUM7QUFDdkIsZ0JBQUksRUFBRSxPQUFPO0FBQ2IsZ0JBQUksRUFBRSxNQUFNLENBQUMsT0FBTztBQUNwQixvQkFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRO0FBQ3pCLG9CQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVE7QUFDekIsdUJBQVcsRUFBRSxJQUFJO1dBQ2xCLENBQUMsQ0FBQztTQUNOLE1BQU0sSUFBSSxNQUFNLENBQUMsVUFBVSxLQUFLLGdCQUFnQixDQUFDLFdBQVcsRUFBRTs7QUFFN0QsY0FBSSxZQUFZLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUN6RCxtQkFBUyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQSxVQUFVLEVBQUk7QUFDbEQsbUJBQUssV0FBVyxDQUFDLE9BQU8sQ0FBQztBQUN2QixrQkFBSSxFQUFFLE9BQU87QUFDYixrQkFBSSxFQUFFLE1BQU0sQ0FBQyxPQUFPO0FBQ3BCLHNCQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVE7QUFDekIsd0JBQVUsRUFBVixVQUFVO0FBQ1YseUJBQVcsRUFBRSxJQUFJO2FBQ2xCLENBQUMsQ0FBQztXQUNKLENBQUMsU0FBTSxDQUFDLFVBQUMsQ0FBQyxFQUFLO0FBQ2QsbUJBQUssU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsT0FBSyxPQUFPLENBQUMsQ0FBQztXQUN6QyxDQUFDLENBQUM7U0FDSixNQUFNO0FBQ0wsZ0JBQU0sSUFBSSxLQUFLLENBQUMsK0JBQStCLENBQUMsQ0FBQztTQUNsRDtPQUNGLENBQUMsU0FBTSxDQUFDLFVBQUMsQ0FBQyxFQUFLO0FBQ2QsZUFBSyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxPQUFLLE9BQU8sQ0FBQyxDQUFDO09BQ3pDLENBQUMsQ0FBQztLQUNKOzs7V0FFSyxrQkFBRztBQUNQLFVBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUM7S0FDeEI7OztXQUVxQixnQ0FDbEIsSUFBWSxFQUNaLFlBQW9CLEVBQ3BCLGdCQUF3QixFQUN4QixPQUFnRCxFQUNoRCxNQUF3QyxFQUFRO0FBQ2xELFVBQUksQ0FBQyxTQUFTLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxnQkFBZ0IsRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7S0FDN0Y7OztXQUVhLHdCQUFDLE1BQWtCLEVBQVE7QUFDdkMsVUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQ3pCLE1BQU0sQ0FBQyxhQUFhLEVBQ3BCLE1BQU0sQ0FBQyxVQUFVLEVBQ2pCLFdBQVcsRUFDWCxJQUFJLENBQUMsV0FBVyxFQUNoQixVQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUs7QUFDZixZQUFJLEdBQUcsRUFBRTtBQUNQLGdCQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDYixnQkFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNsQixpQkFBTztTQUNSOztBQUVELGNBQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDcEIsY0FBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztPQUNyQixDQUNGLENBQUM7S0FDSDs7O1dBRWdCLDJCQUFDLFVBQVUsRUFBRTtBQUM1QixVQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUM7QUFDbkMsVUFBSSxDQUFDLFdBQVcsU0FBTSxVQUFVLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFBLENBQUc7Ozs7QUFJakUsVUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEdBQUcsVUFBVSxDQUFDLFNBQVMsQ0FBQztBQUN4QyxVQUFJLENBQUMsZ0NBQWdDLEdBQUcsVUFBVSxDQUFDLEVBQUUsQ0FBQztBQUN0RCxVQUFJLENBQUMsa0JBQWtCLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQztBQUMxQyxVQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUM7S0FDbEM7OztXQUVRLHFCQUFZO0FBQ25CLGFBQU8sSUFBSSxDQUFDLGdDQUFnQyxJQUNyQyxJQUFJLENBQUMsa0JBQWtCLElBQ3ZCLElBQUksQ0FBQyxVQUFVLENBQUM7S0FDeEI7OztXQUVpQiw4QkFBa0I7OztBQUNsQyxhQUFPLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBSztBQUN0QyxZQUFJLFNBQVMsR0FBRyxFQUFFLENBQUM7QUFDbkIsWUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDOzs7O0FBSWhCLFlBQUksR0FBRyxHQUFNLE9BQUssT0FBTyxDQUFDLG1CQUFtQixxQkFBZ0IsT0FBSyxPQUFPLENBQUMsR0FBRyx1QkFBa0IsT0FBSyxPQUFPLENBQUMsSUFBSSxXQUFRLENBQUM7Ozs7Ozs7Ozs7QUFVekgsZUFBSyxXQUFXLENBQUMsSUFBSSxnQ0FBNkIsU0FBUyxTQUFJLEdBQUcsY0FBUyxTQUFTLFNBQUssVUFBQyxHQUFHLEVBQUUsTUFBTSxFQUFLO0FBQ3hHLGNBQUksR0FBRyxFQUFFO0FBQ1Asa0JBQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNaLG1CQUFPO1dBQ1I7QUFDRCxnQkFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLG9CQUFFLFdBQU8sSUFBSSxFQUFFLE1BQU0sRUFBSztBQUN6QyxnQkFBSSxlQUFlLEdBQUcsU0FBbEIsZUFBZSxDQUFJLEtBQUssRUFBSztBQUM3QixvQkFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNwQix1QkFBUyxHQUFNLEtBQUssbUJBQWMsU0FBUyxDQUFHO0FBQzlDLG9CQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQzthQUNoQyxDQUFDOztBQUVGLGdCQUFJLElBQUksS0FBSyxDQUFDLEVBQUU7QUFDZCxrQkFBSSxVQUFVLENBQUM7QUFDZixrQkFBSSxLQUFLLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUN0QyxrQkFBSSxDQUFDLEtBQUssRUFBRTtBQUNWLCtCQUFlLHFDQUFtQyxNQUFNLENBQUcsQ0FBQztBQUM1RCx1QkFBTztlQUNSO0FBQ0Qsa0JBQUk7QUFDRiwwQkFBVSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7ZUFDbkMsQ0FBQyxPQUFPLENBQUMsRUFBRTtBQUNWLCtCQUFlLDBDQUF3QyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUcsQ0FBQztBQUNuRSx1QkFBTztlQUNSO0FBQ0Qsa0JBQUksQ0FBQyxVQUFVLENBQUMsU0FBUyxFQUFFO0FBQ3pCLCtCQUFlLGdDQUE4QixPQUFLLE9BQU8sQ0FBQyxHQUFHLENBQUcsQ0FBQztBQUNqRSx1QkFBTztlQUNSOzs7QUFHRCxxQkFBSyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNuQyxxQkFBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2FBQ3BCLE1BQU07QUFDTCxvQkFBTSxDQUFDLElBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7YUFDOUI7V0FDRixFQUFDLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxVQUFDLElBQUksRUFBSztBQUN0QixrQkFBTSxJQUFJLElBQUksQ0FBQztXQUNoQixDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsVUFBQyxJQUFJLEVBQUs7QUFDN0IscUJBQVMsSUFBSSxJQUFJLENBQUM7V0FDbkIsQ0FBQyxDQUFDO1NBQ0osQ0FBQyxDQUFDO09BQ0osQ0FBQyxDQUFDO0tBQ0o7Ozs2QkFFZSxhQUFTOzs7QUFDdkIsVUFBSTtBQUNGLGNBQU0sSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7T0FDakMsQ0FBQyxPQUFPLENBQUMsRUFBRTtBQUNWLFlBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDeEMsZUFBTztPQUNSOztBQUVELFVBQUksZUFBZSxxQkFBRyxXQUFNLFVBQVUsRUFBdUI7QUFDM0QsWUFBSTtBQUNGLGdCQUFNLFVBQVUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztTQUMvQixDQUFDLE9BQU8sQ0FBQyxFQUFFO0FBQ1YsZUFBSyxHQUFHLElBQUksS0FBSyw2Q0FBMkMsT0FBSyxPQUFPLENBQUMsSUFBSSxVQUFLLENBQUMsQ0FBQyxPQUFPLENBQUcsQ0FBQztBQUMvRixpQkFBSyxTQUFTLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxPQUFLLE9BQU8sQ0FBQyxDQUFDO1NBQzdDO0FBQ0QsZUFBSyxTQUFTLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxPQUFLLE9BQU8sQ0FBQyxDQUFDO09BQ3BELENBQUEsQ0FBQzs7O0FBR0YsVUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLEVBQUU7QUFDcEIsWUFBSSxVQUFVLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQztBQUNwQyxjQUFJLEVBQUUsSUFBSSxDQUFDLFdBQVc7QUFDdEIsY0FBSSxFQUFFLElBQUksQ0FBQyxXQUFXO0FBQ3RCLGFBQUcsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUc7QUFDckIseUNBQStCLEVBQUUsSUFBSSxDQUFDLGdDQUFnQztBQUN0RSwyQkFBaUIsRUFBRSxJQUFJLENBQUMsa0JBQWtCO0FBQzFDLG1CQUFTLEVBQUUsSUFBSSxDQUFDLFVBQVU7U0FDM0IsQ0FBQyxDQUFDO0FBQ0gsdUJBQWUsQ0FBQyxVQUFVLENBQUMsQ0FBQztPQUM3QixNQUFNO0FBQ0wsWUFBSSxDQUFDLGlCQUFpQixHQUFHLEdBQUcsQ0FBQyxZQUFZLENBQUMsVUFBQyxJQUFJLEVBQUs7QUFDbEQsaUJBQUssY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzNCLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLFdBQVcsRUFBRSxZQUFNO0FBQzlCLGNBQUksVUFBVSxHQUFHLElBQUksZ0JBQWdCLENBQUM7QUFDcEMsZ0JBQUksRUFBRSxXQUFXO0FBQ2pCLGdCQUFJLEVBQUUsT0FBSyxhQUFhLEVBQUU7QUFDMUIsZUFBRyxFQUFFLE9BQUssT0FBTyxDQUFDLEdBQUc7V0FDdEIsQ0FBQyxDQUFDO0FBQ0gseUJBQWUsQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUM3QixDQUFDLENBQUM7T0FDSjtLQUNGOzs7V0FFWSx5QkFBWTtBQUN2QixhQUFPLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztLQUM5RTs7O1dBRVEscUJBQThCO0FBQ3JDLGFBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztLQUNyQjs7O1NBbFBHLFlBQVk7OztBQXFQbEIsWUFBWSxDQUFDLGdCQUFnQixHQUFHLGdCQUFnQixDQUFDOztBQUVqRCxNQUFNLENBQUMsT0FBTyxHQUFHLFlBQVksQ0FBQyIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvbnVjbGlkZS1yZW1vdGUtcHJvamVjdHMvbm9kZV9tb2R1bGVzL251Y2xpZGUtcmVtb3RlLWNvbm5lY3Rpb24vbGliL1NzaEhhbmRzaGFrZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbnZhciBTc2hDb25uZWN0aW9uID0gcmVxdWlyZSgnc3NoMicpLkNsaWVudDtcbnZhciBmcyA9IHJlcXVpcmUoJ2ZzLXBsdXMnKTtcbnZhciBuZXQgPSByZXF1aXJlKCduZXQnKTtcbnZhciB1cmwgPSByZXF1aXJlKCd1cmwnKTtcbnZhciBsb2dnZXIgPSByZXF1aXJlKCdudWNsaWRlLWxvZ2dpbmcnKS5nZXRMb2dnZXIoKTtcblxudmFyIFJlbW90ZUNvbm5lY3Rpb24gPSByZXF1aXJlKCcuL1JlbW90ZUNvbm5lY3Rpb24nKTtcbnZhciB7ZnNQcm9taXNlfSA9IHJlcXVpcmUoJ251Y2xpZGUtY29tbW9ucycpO1xuXG4vLyBTeW5jIHdvcmQgYW5kIHJlZ2V4IHBhdHRlcm4gZm9yIHBhcnNpbmcgY29tbWFuZCBzdGRvdXQuXG52YXIgU1lOQ19XT1JEID0gJ1NZTlNZTic7XG52YXIgU1RET1VUX1JFR0VYID0gL1NZTlNZTlxcbihbXFxzXFxTXSopXFxuU1lOU1lOLztcblxudHlwZSBTc2hDb25uZWN0aW9uQ29uZmlndXJhdGlvbiA9IHtcbiAgaG9zdDogc3RyaW5nOyAvLyBob3N0IG51Y2xpZGUgc2VydmVyIGlzIHJ1bm5pbmcgb25cbiAgc3NoUG9ydDogbnVtYmVyOyAvLyBzc2ggcG9ydCBvZiBob3N0IG51Y2xpZGUgc2VydmVyIGlzIHJ1bm5pbmcgb25cbiAgdXNlcm5hbWU6IHN0cmluZzsgLy8gdXNlcm5hbWUgdG8gYXV0aGVudGljYXRlIGFzXG4gIHBhdGhUb1ByaXZhdGVLZXk6IHN0cmluZzsgLy8gVGhlIHBhdGggdG8gcHJpdmF0ZSBrZXlcbiAgcmVtb3RlU2VydmVyQ29tbWFuZDogc3RyaW5nOyAvLyBDb21tYW5kIHRvIHVzZSB0byBzdGFydCBzZXJ2ZXJcbiAgY3dkOiBzdHJpbmc7IC8vIFBhdGggdG8gcmVtb3RlIGRpcmVjdG9yeSB1c2VyIHNob3VsZCBzdGFydCBpbiB1cG9uIGNvbm5lY3Rpb24uXG4gIGF1dGhNZXRob2Q6IHN0cmluZzsgLy8gV2hpY2ggb2YgdGhlIGF1dGhlbnRpY2F0aW9uIG1ldGhvZHMgaW4gYFN1cHBvcnRlZE1ldGhvZHNgIHRvIHVzZS5cbiAgcGFzc3dvcmQ6IHN0cmluZzsgLy8gZm9yIHNpbXBsZSBwYXNzd29yZC1iYXNlZCBhdXRoZW50aWNhdGlvblxufVxuXG52YXIgU3VwcG9ydGVkTWV0aG9kcyA9IHtcbiAgU1NMX0FHRU5UOiAnU1NMX0FHRU5UJyxcbiAgUEFTU1dPUkQ6ICdQQVNTV09SRCcsXG4gIFBSSVZBVEVfS0VZOiAnUFJJVkFURV9LRVknLFxufTtcblxuLyoqXG4gKiBUaGUgc2VydmVyIGlzIGFza2luZyBmb3IgcmVwbGllcyB0byB0aGUgZ2l2ZW4gcHJvbXB0cyBmb3JcbiAqIGtleWJvYXJkLWludGVyYWN0aXZlIHVzZXIgYXV0aGVudGljYXRpb24uXG4gKlxuICogQHBhcmFtIG5hbWUgaXMgZ2VuZXJhbGx5IHdoYXQgeW91J2QgdXNlIGFzXG4gKiAgICAgYSB3aW5kb3cgdGl0bGUgKGZvciBHVUkgYXBwcykuXG4gKiBAcGFyYW0gcHJvbXB0cyBpcyBhbiBhcnJheSBvZiB7IHByb21wdDogJ1Bhc3N3b3JkOiAnLFxuICogICAgIGVjaG86IGZhbHNlIH0gc3R5bGUgb2JqZWN0cyAoaGVyZSBlY2hvIGluZGljYXRlcyB3aGV0aGVyIHVzZXIgaW5wdXRcbiAqICAgICBzaG91bGQgYmUgZGlzcGxheWVkIG9uIHRoZSBzY3JlZW4pLlxuICogQHBhcmFtIGZpbmlzaDogVGhlIGFuc3dlcnMgZm9yIGFsbCBwcm9tcHRzIG11c3QgYmUgcHJvdmlkZWQgYXMgYW5cbiAqICAgICBhcnJheSBvZiBzdHJpbmdzIGFuZCBwYXNzZWQgdG8gZmluaXNoIHdoZW4geW91IGFyZSByZWFkeSB0byBjb250aW51ZS4gTm90ZTpcbiAqICAgICBJdCdzIHBvc3NpYmxlIGZvciB0aGUgc2VydmVyIHRvIGNvbWUgYmFjayBhbmQgYXNrIG1vcmUgcXVlc3Rpb25zLlxuICovXG50eXBlIEtleWJvYXJkSW50ZXJhY3RpdmVDYWxsYmFjayA9IChcbiAgbmFtZTogc3RyaW5nLFxuICBpbnN0cnVjdGlvbnM6IHN0cmluZyxcbiAgaW5zdHJ1Y3Rpb25zTGFuZzogc3RyaW5nLFxuICBwcm9tcHRzOiBBcnJheTx7cHJvbXB0OiBzdHJpbmc7IGVjaG86IGJvb2xlYW47fT4sXG4gIGZpbmlzaDogKGFuc3dlcnM6IEFycmF5PHN0cmluZz4pID0+IHZvaWQpICA9PiB2b2lkO1xuXG50eXBlIFNzaENvbm5lY3Rpb25EZWxlZ2F0ZSA9IHtcbiAgLyoqIEludm9rZWQgd2hlbiBzZXJ2ZXIgcmVxdWVzdHMga2V5Ym9hcmQgaW50ZXJhY3Rpb24gKi9cbiAgb25LZXlib2FyZEludGVyYWN0aXZlOiBLZXlib2FyZEludGVyYWN0aXZlQ2FsbGJhY2s7XG4gIC8qKiBJbnZva2VkIHdoZW4gY29ubmVjdGlvbiBpcyBzdWNlc3NmdWwgKi9cbiAgb25Db25uZWN0OiAoY29ubmVjdGlvbjogUmVtb3RlQ29ubmVjdGlvbikgPT4gdm9pZDtcbiAgLyoqIEludm9rZWQgd2hlbiBjb25uZWN0aW9uIGlzIGZhaWxzICovXG4gIG9uRXJyb3I6IChlcnJvcjogRXJyb3IsIGNvbmZpZzogU3NoQ29ubmVjdGlvbkNvbmZpZ3VyYXRpb24pID0+IHZvaWQ7XG59XG5cbmNsYXNzIFNzaEhhbmRzaGFrZSB7XG4gIF9kZWxlZ2F0ZTogU3NoQ29ubmVjdGlvbkRlbGVnYXRlO1xuICBfY29ubmVjdGlvbjogU3NoQ29ubmVjdGlvbjtcbiAgX2NvbmZpZzogU3NoQ29ubmVjdGlvbkNvbmZpZ3VyYXRpb247XG4gIF9mb3J3YXJkaW5nU2VydmVyOiBuZXQuU29ja2V0O1xuICBfcmVtb3RlSG9zdDogP3N0cmluZztcbiAgX3JlbW90ZVBvcnQ6ID9udW1iZXI7XG4gIF9jZXJ0aWZpY2F0ZUF1dGhvcml0eUNlcnRpZmljYXRlOiA/QnVmZmVyO1xuICBfY2xpZW50Q2VydGlmaWNhdGU6ID9CdWZmZXI7XG4gIF9jbGllbnRLZXk6ID9CdWZmZXI7XG4gIF9oZWFydGJlYXROZXR3b3JrQXdheUNvdW50OiBpbnQ7XG4gIF9sYXN0SGVhcnRiZWF0Tm90aWZpY2F0aW9uOiA/SGVhcnRiZWF0Tm90aWZpY2F0aW9uO1xuXG4gIGNvbnN0cnVjdG9yKGRlbGVnYXRlOiBTc2hDb25uZWN0aW9uRGVsZWdhdGUsIGNvbm5lY3Rpb24/OiBTc2hDb25uZWN0aW9uKSB7XG4gICAgdGhpcy5fZGVsZWdhdGUgPSBkZWxlZ2F0ZTtcbiAgICB0aGlzLl9oZWFydGJlYXROZXR3b3JrQXdheUNvdW50ID0gMDtcbiAgICB0aGlzLl9jb25uZWN0aW9uID0gY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24gOiBuZXcgU3NoQ29ubmVjdGlvbigpO1xuICAgIHRoaXMuX2Nvbm5lY3Rpb24ub24oJ3JlYWR5JywgdGhpcy5fb25Db25uZWN0LmJpbmQodGhpcykpO1xuICAgIHRoaXMuX2Nvbm5lY3Rpb24ub24oJ2Vycm9yJywgZSA9PiB0aGlzLl9kZWxlZ2F0ZS5vbkVycm9yKGUsIHRoaXMuX2NvbmZpZykpO1xuICAgIHRoaXMuX2Nvbm5lY3Rpb24ub24oJ2tleWJvYXJkLWludGVyYWN0aXZlJywgdGhpcy5fb25LZXlib2FyZEludGVyYWN0aXZlLmJpbmQodGhpcykpO1xuICB9XG5cbiAgY29ubmVjdChjb25maWc6IFNzaENvbm5lY3Rpb25Db25maWd1cmF0aW9uKTogdm9pZCB7XG4gICAgdmFyIGV4aXN0aW5nQ29ubmVjdGlvbiA9IFJlbW90ZUNvbm5lY3Rpb24uZ2V0QnlIb3N0bmFtZUFuZFBhdGgoY29uZmlnLmhvc3QsIGNvbmZpZy5jd2QpO1xuICAgIGlmIChleGlzdGluZ0Nvbm5lY3Rpb24pIHtcbiAgICAgIHRoaXMuX2RlbGVnYXRlLm9uQ29ubmVjdChleGlzdGluZ0Nvbm5lY3Rpb24sIHRoaXMuX2NvbmZpZyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fY29uZmlnID0gY29uZmlnO1xuXG4gICAgdmFyIHtsb29rdXBQcmVmZXJJcHY2fSA9IHJlcXVpcmUoJ251Y2xpZGUtY29tbW9ucycpLmRuc1V0aWxzO1xuXG4gICAgbG9va3VwUHJlZmVySXB2Nihjb25maWcuaG9zdCkudGhlbigoYWRkcmVzcykgPT4ge1xuICAgICAgaWYgKGNvbmZpZy5hdXRoTWV0aG9kID09PSBTdXBwb3J0ZWRNZXRob2RzLlNTTF9BR0VOVCkge1xuICAgICAgICAvLyBQb2ludCB0byBzc2gtYWdlbnQncyBzb2NrZXQgZm9yIHNzaC1hZ2VudC1iYXNlZCBhdXRoZW50aWNhdGlvbi5cbiAgICAgICAgdmFyIGFnZW50ID0gcHJvY2Vzcy5lbnZbJ1NTSF9BVVRIX1NPQ0snXTtcbiAgICAgICAgaWYgKCFhZ2VudCAmJiAvXndpbi8udGVzdChwcm9jZXNzLnBsYXRmb3JtKSkge1xuICAgICAgICAgIC8vICMxMDA6IE9uIFdpbmRvd3MsIGZhbGwgYmFjayB0byBwYWdlYW50LlxuICAgICAgICAgIGFnZW50ID0gJ3BhZ2VhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2Nvbm5lY3Rpb24uY29ubmVjdCh7XG4gICAgICAgICAgaG9zdDogYWRkcmVzcyxcbiAgICAgICAgICBwb3J0OiBjb25maWcuc3NoUG9ydCxcbiAgICAgICAgICB1c2VybmFtZTogY29uZmlnLnVzZXJuYW1lLFxuICAgICAgICAgIGFnZW50LFxuICAgICAgICAgIHRyeUtleWJvYXJkOiB0cnVlLFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSBpZiAoY29uZmlnLmF1dGhNZXRob2QgPT09IFN1cHBvcnRlZE1ldGhvZHMuUEFTU1dPUkQpIHtcbiAgICAgICAgICAvLyBXaGVuIHRoZSB1c2VyIGNob29zZXMgcGFzc3dvcmQtYmFzZWQgYXV0aGVudGljYXRpb24sIHdlIHNwZWNpZnlcbiAgICAgICAgICAvLyB0aGUgY29uZmlnIGFzIGZvbGxvd3Mgc28gdGhhdCBpdCB0cmllcyBzaW1wbGUgcGFzc3dvcmQgYXV0aCBhbmRcbiAgICAgICAgICAvLyBmYWlsaW5nIHRoYXQgaXQgZmFsbHMgdGhyb3VnaCB0byB0aGUga2V5Ym9hcmQgaW50ZXJhY3RpdmUgcGF0aFxuICAgICAgICAgIHRoaXMuX2Nvbm5lY3Rpb24uY29ubmVjdCh7XG4gICAgICAgICAgICBob3N0OiBhZGRyZXNzLFxuICAgICAgICAgICAgcG9ydDogY29uZmlnLnNzaFBvcnQsXG4gICAgICAgICAgICB1c2VybmFtZTogY29uZmlnLnVzZXJuYW1lLFxuICAgICAgICAgICAgcGFzc3dvcmQ6IGNvbmZpZy5wYXNzd29yZCxcbiAgICAgICAgICAgIHRyeUtleWJvYXJkOiB0cnVlLFxuICAgICAgICAgIH0pO1xuICAgICAgfSBlbHNlIGlmIChjb25maWcuYXV0aE1ldGhvZCA9PT0gU3VwcG9ydGVkTWV0aG9kcy5QUklWQVRFX0tFWSkge1xuICAgICAgICAvLyBXZSB1c2UgZnMtcGx1cydzIG5vcm1hbGl6ZSgpIGZ1bmN0aW9uIGJlY2F1c2UgaXQgd2lsbCBleHBhbmQgdGhlIH4sIGlmIHByZXNlbnQuXG4gICAgICAgIHZhciBleHBhbmRlZFBhdGggPSBmcy5ub3JtYWxpemUoY29uZmlnLnBhdGhUb1ByaXZhdGVLZXkpO1xuICAgICAgICBmc1Byb21pc2UucmVhZEZpbGUoZXhwYW5kZWRQYXRoKS50aGVuKHByaXZhdGVLZXkgPT4ge1xuICAgICAgICAgIHRoaXMuX2Nvbm5lY3Rpb24uY29ubmVjdCh7XG4gICAgICAgICAgICBob3N0OiBhZGRyZXNzLFxuICAgICAgICAgICAgcG9ydDogY29uZmlnLnNzaFBvcnQsXG4gICAgICAgICAgICB1c2VybmFtZTogY29uZmlnLnVzZXJuYW1lLFxuICAgICAgICAgICAgcHJpdmF0ZUtleSxcbiAgICAgICAgICAgIHRyeUtleWJvYXJkOiB0cnVlLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KS5jYXRjaCgoZSkgPT4ge1xuICAgICAgICAgIHRoaXMuX2RlbGVnYXRlLm9uRXJyb3IoZSwgdGhpcy5fY29uZmlnKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgYXV0aGVudGljYXRpb24gbWV0aG9kJyk7XG4gICAgICB9XG4gICAgfSkuY2F0Y2goKGUpID0+IHtcbiAgICAgIHRoaXMuX2RlbGVnYXRlLm9uRXJyb3IoZSwgdGhpcy5fY29uZmlnKTtcbiAgICB9KTtcbiAgfVxuXG4gIGNhbmNlbCgpIHtcbiAgICB0aGlzLl9jb25uZWN0aW9uLmVuZCgpO1xuICB9XG5cbiAgX29uS2V5Ym9hcmRJbnRlcmFjdGl2ZShcbiAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgIGluc3RydWN0aW9uczogc3RyaW5nLFxuICAgICAgaW5zdHJ1Y3Rpb25zTGFuZzogc3RyaW5nLFxuICAgICAgcHJvbXB0czogQXJyYXk8e3Byb21wdDogc3RyaW5nOyBlY2hvOiBib29sZWFuO30+LFxuICAgICAgZmluaXNoOiAoYW5zd2VyczogQXJyYXk8c3RyaW5nPikgPT4gdm9pZCk6IHZvaWQge1xuICAgIHRoaXMuX2RlbGVnYXRlLm9uS2V5Ym9hcmRJbnRlcmFjdGl2ZShuYW1lLCBpbnN0cnVjdGlvbnMsIGluc3RydWN0aW9uc0xhbmcsIHByb21wdHMsIGZpbmlzaCk7XG4gIH1cblxuICBfZm9yd2FyZFNvY2tldChzb2NrZXQ6IG5ldC5Tb2NrZXQpOiB2b2lkIHtcbiAgICB0aGlzLl9jb25uZWN0aW9uLmZvcndhcmRPdXQoXG4gICAgICBzb2NrZXQucmVtb3RlQWRkcmVzcyxcbiAgICAgIHNvY2tldC5yZW1vdGVQb3J0LFxuICAgICAgJ2xvY2FsaG9zdCcsXG4gICAgICB0aGlzLl9yZW1vdGVQb3J0LFxuICAgICAgKGVyciwgc3RyZWFtKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICBzb2NrZXQuZW5kKCk7XG4gICAgICAgICAgbG9nZ2VyLmVycm9yKGVycik7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc29ja2V0LnBpcGUoc3RyZWFtKTtcbiAgICAgICAgc3RyZWFtLnBpcGUoc29ja2V0KTtcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgX3VwZGF0ZVNlcnZlckluZm8oc2VydmVySW5mbykge1xuICAgIHRoaXMuX3JlbW90ZVBvcnQgPSBzZXJ2ZXJJbmZvLnBvcnQ7XG4gICAgdGhpcy5fcmVtb3RlSG9zdCA9IGAke3NlcnZlckluZm8uaG9zdG5hbWUgfHwgdGhpcy5fY29uZmlnLmhvc3R9YDtcbiAgICAvLyBCZWNhdXNlIHRoZSB2YWx1ZSBmb3IgdGhlIEluaXRpYWwgRGlyZWN0b3J5IHRoYXQgdGhlIHVzZXIgc3VwcGxpZWQgbWF5IGhhdmVcbiAgICAvLyBiZWVuIGEgc3ltbGluayB0aGF0IHdhcyByZXNvbHZlZCBieSB0aGUgc2VydmVyLCBvdmVyd3JpdGUgdGhlIG9yaWdpbmFsIGBjd2RgXG4gICAgLy8gdmFsdWUgd2l0aCB0aGUgcmVzb2x2ZWQgdmFsdWUuXG4gICAgdGhpcy5fY29uZmlnLmN3ZCA9IHNlcnZlckluZm8ud29ya3NwYWNlO1xuICAgIHRoaXMuX2NlcnRpZmljYXRlQXV0aG9yaXR5Q2VydGlmaWNhdGUgPSBzZXJ2ZXJJbmZvLmNhO1xuICAgIHRoaXMuX2NsaWVudENlcnRpZmljYXRlID0gc2VydmVySW5mby5jZXJ0O1xuICAgIHRoaXMuX2NsaWVudEtleSA9IHNlcnZlckluZm8ua2V5O1xuICB9XG5cbiAgX2lzU2VjdXJlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9jZXJ0aWZpY2F0ZUF1dGhvcml0eUNlcnRpZmljYXRlXG4gICAgICAgICYmIHRoaXMuX2NsaWVudENlcnRpZmljYXRlXG4gICAgICAgICYmIHRoaXMuX2NsaWVudEtleTtcbiAgfVxuXG4gIF9zdGFydFJlbW90ZVNlcnZlcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdmFyIGVycm9yVGV4dCA9ICcnO1xuICAgICAgdmFyIHN0ZE91dCA9ICcnO1xuXG4gICAgICAvL1RPRE86IGVzY2FwZSBhbnkgc2luZ2xlIHF1b3Rlc1xuICAgICAgLy9UT0RPOiB0aGUgdGltZW91dCB2YWx1ZSBzaGFsbCBiZSBjb25maWd1cmFibGUgdXNpbmcgLmpzb24gZmlsZSB0b28gKHQ2OTA0NjkxKS5cbiAgICAgIHZhciBjbWQgPSBgJHt0aGlzLl9jb25maWcucmVtb3RlU2VydmVyQ29tbWFuZH0gLS13b3Jrc3BhY2U9JHt0aGlzLl9jb25maWcuY3dkfSAtLWNvbW1vbl9uYW1lPSR7dGhpcy5fY29uZmlnLmhvc3R9IC10IDIwYDtcbiAgICAgIC8vIEFkZCBzeW5jIHdvcmQgYmVmb3JlIGFuZCBhZnRlciB0aGUgcmVtb3RlIGNvbW1hbmQsIHNvIHRoYXQgd2UgY2FuIGV4dHJhY3QgdGhlIHN0ZG91dFxuICAgICAgLy8gd2l0aG91dCBub2lzZXMgZnJvbSAuYmFzaHJjIG9yIC5iYXNoX3Byb2ZpbGUuXG4gICAgICAvLyBOb3RlOiB3ZSB1c2UgLS1sb2dpbiB0byBpbWl0YXRlIGEgbG9naW4gc2hlbGwuICBUaGlzIHdpbGwgb25seSBleGVjdXRlXG4gICAgICAvLyAucHJvZmlsZS8uYmFzaF9wcm9maWxlLy5iYXNoX2xvZ2luLiAgLmJhc2hyYyB3aWxsIG9ubHkgYmUgbG9hZGVkIGlmXG4gICAgICAvLyBpdCBpcyBzb3VyY2VkIGluIG9uZSBvZiB0aGUgbG9naW4gc2NyaXB0cy4gIFRoaXMgaXMgcHJldHR5IHR5cGljYWxcbiAgICAgIC8vIHRob3VnaCBzbyBsaWtlbHkgLmJhc2hyYyB3aWxsIGJlIGxvYWRlZC5cbiAgICAgIC8vIE5vdGUgMjogV2UgYWxzbyBydW4gdGhpcyBhcyBhbiBpbnRlcmFjdGl2ZSBzaGVsbCwgZXZlbiB0aG91Z2ggaXQgaXNuJ3QuXG4gICAgICAvLyBUaGF0IGlzIHNvIGFueXRoaW5nIGJlaGluZCBhbiBgaWYgWyAteiAkUFMxIF1gLCBzdWNoIGFzIGFkZGluZyBlbnRyaWVzXG4gICAgICAvLyB0byB0aGUgJFBBVEgsIHdpbGwgbm90IGJlIHNraXBwZWRcbiAgICAgIHRoaXMuX2Nvbm5lY3Rpb24uZXhlYyhgYmFzaCAtLWxvZ2luIC1pIC1jICdlY2hvICR7U1lOQ19XT1JEfTske2NtZH07ZWNobyAke1NZTkNfV09SRH0nYCwgKGVyciwgc3RyZWFtKSA9PiB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgc3RyZWFtLm9uKCdjbG9zZScsIGFzeW5jIChjb2RlLCBzaWduYWwpID0+IHtcbiAgICAgICAgICB2YXIgcmVqZWN0V2l0aEVycm9yID0gKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgIGxvZ2dlci5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgIGVycm9yVGV4dCA9IGAke2Vycm9yfVxcblxcbnN0ZGVycjoke2Vycm9yVGV4dH1gO1xuICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKGVycm9yVGV4dCkpO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICBpZiAoY29kZSA9PT0gMCkge1xuICAgICAgICAgICAgdmFyIHNlcnZlckluZm87XG4gICAgICAgICAgICB2YXIgbWF0Y2ggPSBTVERPVVRfUkVHRVguZXhlYyhzdGRPdXQpO1xuICAgICAgICAgICAgaWYgKCFtYXRjaCkge1xuICAgICAgICAgICAgICByZWplY3RXaXRoRXJyb3IoYEJhZCBzdGRvdXQgZnJvbSByZW1vdGUgc2VydmVyOiAke3N0ZE91dH1gKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgc2VydmVySW5mbyA9IEpTT04ucGFyc2UobWF0Y2hbMV0pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICByZWplY3RXaXRoRXJyb3IoYEJhZCBKU09OIHJlcGx5IGZyb20gTnVjbGlkZSBzZXJ2ZXI6ICR7bWF0Y2hbMV19YCk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghc2VydmVySW5mby53b3Jrc3BhY2UpIHtcbiAgICAgICAgICAgICAgcmVqZWN0V2l0aEVycm9yKGBDb3VsZCBub3QgZmluZCBkaXJlY3Rvcnk6ICR7dGhpcy5fY29uZmlnLmN3ZH1gKTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBVcGRhdGUgc2VydmVyIGluZm8gdGhhdCBpcyBuZWVkZWQgZm9yIHNldHRpbmcgdXAgY2xpZW50LlxuICAgICAgICAgICAgdGhpcy5fdXBkYXRlU2VydmVySW5mbyhzZXJ2ZXJJbmZvKTtcbiAgICAgICAgICAgIHJlc29sdmUodW5kZWZpbmVkKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihlcnJvclRleHQpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pLm9uKCdkYXRhJywgKGRhdGEpID0+IHtcbiAgICAgICAgICBzdGRPdXQgKz0gZGF0YTtcbiAgICAgICAgfSkuc3RkZXJyLm9uKCdkYXRhJywgKGRhdGEpID0+IHtcbiAgICAgICAgICBlcnJvclRleHQgKz0gZGF0YTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIF9vbkNvbm5lY3QoKTogdm9pZCB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuX3N0YXJ0UmVtb3RlU2VydmVyKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhpcy5fZGVsZWdhdGUub25FcnJvcihlLCB0aGlzLl9jb25maWcpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBmaW5pc2hIYW5kc2hha2UgPSBhc3luYyhjb25uZWN0aW9uOiBSZW1vdGVDb25uZWN0aW9uKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBjb25uZWN0aW9uLmluaXRpYWxpemUoKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoYEZhaWxlZCB0byBjb25uZWN0IHRvIE51Y2xpZGUgc2VydmVyIG9uICR7dGhpcy5fY29uZmlnLmhvc3R9OiAke2UubWVzc2FnZX1gKTtcbiAgICAgICAgdGhpcy5fZGVsZWdhdGUub25FcnJvcihlcnJvciwgdGhpcy5fY29uZmlnKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX2RlbGVnYXRlLm9uQ29ubmVjdChjb25uZWN0aW9uLCB0aGlzLl9jb25maWcpO1xuICAgIH07XG5cbiAgICAvLyBVc2UgYW4gc3NoIHR1bm5lbCBpZiBzZXJ2ZXIgaXMgbm90IHNlY3VyZVxuICAgIGlmICh0aGlzLl9pc1NlY3VyZSgpKSB7XG4gICAgICB2YXIgY29ubmVjdGlvbiA9IG5ldyBSZW1vdGVDb25uZWN0aW9uKHtcbiAgICAgICAgaG9zdDogdGhpcy5fcmVtb3RlSG9zdCxcbiAgICAgICAgcG9ydDogdGhpcy5fcmVtb3RlUG9ydCxcbiAgICAgICAgY3dkOiB0aGlzLl9jb25maWcuY3dkLFxuICAgICAgICBjZXJ0aWZpY2F0ZUF1dGhvcml0eUNlcnRpZmljYXRlOiB0aGlzLl9jZXJ0aWZpY2F0ZUF1dGhvcml0eUNlcnRpZmljYXRlLFxuICAgICAgICBjbGllbnRDZXJ0aWZpY2F0ZTogdGhpcy5fY2xpZW50Q2VydGlmaWNhdGUsXG4gICAgICAgIGNsaWVudEtleTogdGhpcy5fY2xpZW50S2V5XG4gICAgICB9KTtcbiAgICAgIGZpbmlzaEhhbmRzaGFrZShjb25uZWN0aW9uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fZm9yd2FyZGluZ1NlcnZlciA9IG5ldC5jcmVhdGVTZXJ2ZXIoKHNvY2spID0+IHtcbiAgICAgICAgdGhpcy5fZm9yd2FyZFNvY2tldChzb2NrKTtcbiAgICAgIH0pLmxpc3RlbigwLCAnbG9jYWxob3N0JywgKCkgPT4ge1xuICAgICAgICB2YXIgY29ubmVjdGlvbiA9IG5ldyBSZW1vdGVDb25uZWN0aW9uKHtcbiAgICAgICAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICAgICAgICBwb3J0OiB0aGlzLl9nZXRMb2NhbFBvcnQoKSxcbiAgICAgICAgICBjd2Q6IHRoaXMuX2NvbmZpZy5jd2RcbiAgICAgICAgfSk7XG4gICAgICAgIGZpbmlzaEhhbmRzaGFrZShjb25uZWN0aW9uKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIF9nZXRMb2NhbFBvcnQoKTogP251bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX2ZvcndhcmRpbmdTZXJ2ZXIgPyB0aGlzLl9mb3J3YXJkaW5nU2VydmVyLmFkZHJlc3MoKS5wb3J0IDogbnVsbDtcbiAgfVxuXG4gIGdldENvbmZpZygpOiBTc2hDb25uZWN0aW9uQ29uZmlndXJhdGlvbntcbiAgICByZXR1cm4gdGhpcy5fY29uZmlnO1xuICB9XG59XG5cblNzaEhhbmRzaGFrZS5TdXBwb3J0ZWRNZXRob2RzID0gU3VwcG9ydGVkTWV0aG9kcztcblxubW9kdWxlLmV4cG9ydHMgPSBTc2hIYW5kc2hha2U7XG4iXX0=