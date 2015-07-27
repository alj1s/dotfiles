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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9ub2RlX21vZHVsZXMvbnVjbGlkZS1yZW1vdGUtY29ubmVjdGlvbi9saWIvU3NoSGFuZHNoYWtlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBV1osSUFBSSxhQUFhLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUMzQyxJQUFJLEVBQUUsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDNUIsSUFBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3pCLElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN6QixJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQzs7QUFFcEQsSUFBSSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQzs7ZUFDbkMsT0FBTyxDQUFDLGlCQUFpQixDQUFDOztJQUF2QyxTQUFTLFlBQVQsU0FBUzs7O0FBR2QsSUFBSSxTQUFTLEdBQUcsUUFBUSxDQUFDO0FBQ3pCLElBQUksWUFBWSxHQUFHLDJCQUEyQixDQUFDOztBQWEvQyxJQUFJLGdCQUFnQixHQUFHO0FBQ3JCLFdBQVMsRUFBRSxXQUFXO0FBQ3RCLFVBQVEsRUFBRSxVQUFVO0FBQ3BCLGFBQVcsRUFBRSxhQUFhO0NBQzNCLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7SUErQkksWUFBWTtBQWFMLFdBYlAsWUFBWSxDQWFKLFFBQStCLEVBQUUsVUFBMEIsRUFBRTs7OzBCQWJyRSxZQUFZOztBQWNkLFFBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO0FBQzFCLFFBQUksQ0FBQywwQkFBMEIsR0FBRyxDQUFDLENBQUM7QUFDcEMsUUFBSSxDQUFDLFdBQVcsR0FB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QUFVO1NBQzNCLENBQUMsQ0FBQztBQUNILHVCQUFlLENBQUMsVUFBVSxDQUFDLENBQUM7T0FDN0IsTUFBTTtBQUNMLFlBQUksQ0FBQyxpQkFBaUIsR0FBRyxHQUFHLENBQUMsWUFBWSxDQUFDLFVBQUMsSUFBSSxFQUFLO0FBQ2xELGlCQUFLLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUMzQixDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxXQUFXLEVBQUUsWUFBTTtBQUM5QixjQUFJLFVBQVUsR0FBRyxJQUFJLGdCQUFnQixDQUFDO0FBQ3BDLGdCQUFJLEVBQUUsV0FBVztBQUNqQixnQkFBSSxFQUFFLE9BQUssYUFBYSxFQUFFO0FBQzFCLGVBQUcsRUFBRSxPQUFLLE9BQU8sQ0FBQyxHQUFHO1dBQ3RCLENBQUMsQ0FBQztBQUNILHlCQUFlLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDN0IsQ0FBQyxDQUFDO09BQ0o7S0FDRjs7O1dBRVkseUJBQVk7QUFDdkIsYUFBTyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7S0FDOUU7OztXQUVRLHFCQUE4QjtBQUNyQyxhQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7S0FDckI7OztTQWxQRyxZQUFZOzs7QUFxUGxCLFlBQVksQ0FBQyxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQzs7QUFFakQsTUFBTSxDQUFDLE9BQU8sR0FBRyxZQUFZLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL251Y2xpZGUtcmVtb3RlLXByb2plY3RzL25vZGVfbW9kdWxlcy9udWNsaWRlLXJlbW90ZS1jb25uZWN0aW9uL2xpYi9Tc2hIYW5kc2hha2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIgU3NoQ29ubmVjdGlvbiA9IHJlcXVpcmUoJ3NzaDInKS5DbGllbnQ7XG52YXIgZnMgPSByZXF1aXJlKCdmcy1wbHVzJyk7XG52YXIgbmV0ID0gcmVxdWlyZSgnbmV0Jyk7XG52YXIgdXJsID0gcmVxdWlyZSgndXJsJyk7XG52YXIgbG9nZ2VyID0gcmVxdWlyZSgnbnVjbGlkZS1sb2dnaW5nJykuZ2V0TG9nZ2VyKCk7XG5cbnZhciBSZW1vdGVDb25uZWN0aW9uID0gcmVxdWlyZSgnLi9SZW1vdGVDb25uZWN0aW9uJyk7XG52YXIge2ZzUHJvbWlzZX0gPSByZXF1aXJlKCdudWNsaWRlLWNvbW1vbnMnKTtcblxuLy8gU3luYyB3b3JkIGFuZCByZWdleCBwYXR0ZXJuIGZvciBwYXJzaW5nIGNvbW1hbmQgc3Rkb3V0LlxudmFyIFNZTkNfV09SRCA9ICdTWU5TWU4nO1xudmFyIFNURE9VVF9SRUdFWCA9IC9TWU5TWU5cXG4oW1xcc1xcU10qKVxcblNZTlNZTi87XG5cbnR5cGUgU3NoQ29ubmVjdGlvbkNvbmZpZ3VyYXRpb24gPSB7XG4gIGhvc3Q6IHN0cmluZzsgLy8gaG9zdCBudWNsaWRlIHNlcnZlciBpcyBydW5uaW5nIG9uXG4gIHNzaFBvcnQ6IG51bWJlcjsgLy8gc3NoIHBvcnQgb2YgaG9zdCBudWNsaWRlIHNlcnZlciBpcyBydW5uaW5nIG9uXG4gIHVzZXJuYW1lOiBzdHJpbmc7IC8vIHVzZXJuYW1lIHRvIGF1dGhlbnRpY2F0ZSBhc1xuICBwYXRoVG9Qcml2YXRlS2V5OiBzdHJpbmc7IC8vIFRoZSBwYXRoIHRvIHByaXZhdGUga2V5XG4gIHJlbW90ZVNlcnZlckNvbW1hbmQ6IHN0cmluZzsgLy8gQ29tbWFuZCB0byB1c2UgdG8gc3RhcnQgc2VydmVyXG4gIGN3ZDogc3RyaW5nOyAvLyBQYXRoIHRvIHJlbW90ZSBkaXJlY3RvcnkgdXNlciBzaG91bGQgc3RhcnQgaW4gdXBvbiBjb25uZWN0aW9uLlxuICBhdXRoTWV0aG9kOiBzdHJpbmc7IC8vIFdoaWNoIG9mIHRoZSBhdXRoZW50aWNhdGlvbiBtZXRob2RzIGluIGBTdXBwb3J0ZWRNZXRob2RzYCB0byB1c2UuXG4gIHBhc3N3b3JkOiBzdHJpbmc7IC8vIGZvciBzaW1wbGUgcGFzc3dvcmQtYmFzZWQgYXV0aGVudGljYXRpb25cbn1cblxudmFyIFN1cHBvcnRlZE1ldGhvZHMgPSB7XG4gIFNTTF9BR0VOVDogJ1NTTF9BR0VOVCcsXG4gIFBBU1NXT1JEOiAnUEFTU1dPUkQnLFxuICBQUklWQVRFX0tFWTogJ1BSSVZBVEVfS0VZJyxcbn07XG5cbi8qKlxuICogVGhlIHNlcnZlciBpcyBhc2tpbmcgZm9yIHJlcGxpZXMgdG8gdGhlIGdpdmVuIHByb21wdHMgZm9yXG4gKiBrZXlib2FyZC1pbnRlcmFjdGl2ZSB1c2VyIGF1dGhlbnRpY2F0aW9uLlxuICpcbiAqIEBwYXJhbSBuYW1lIGlzIGdlbmVyYWxseSB3aGF0IHlvdSdkIHVzZSBhc1xuICogICAgIGEgd2luZG93IHRpdGxlIChmb3IgR1VJIGFwcHMpLlxuICogQHBhcmFtIHByb21wdHMgaXMgYW4gYXJyYXkgb2YgeyBwcm9tcHQ6ICdQYXNzd29yZDogJyxcbiAqICAgICBlY2hvOiBmYWxzZSB9IHN0eWxlIG9iamVjdHMgKGhlcmUgZWNobyBpbmRpY2F0ZXMgd2hldGhlciB1c2VyIGlucHV0XG4gKiAgICAgc2hvdWxkIGJlIGRpc3BsYXllZCBvbiB0aGUgc2NyZWVuKS5cbiAqIEBwYXJhbSBmaW5pc2g6IFRoZSBhbnN3ZXJzIGZvciBhbGwgcHJvbXB0cyBtdXN0IGJlIHByb3ZpZGVkIGFzIGFuXG4gKiAgICAgYXJyYXkgb2Ygc3RyaW5ncyBhbmQgcGFzc2VkIHRvIGZpbmlzaCB3aGVuIHlvdSBhcmUgcmVhZHkgdG8gY29udGludWUuIE5vdGU6XG4gKiAgICAgSXQncyBwb3NzaWJsZSBmb3IgdGhlIHNlcnZlciB0byBjb21lIGJhY2sgYW5kIGFzayBtb3JlIHF1ZXN0aW9ucy5cbiAqL1xudHlwZSBLZXlib2FyZEludGVyYWN0aXZlQ2FsbGJhY2sgPSAoXG4gIG5hbWU6IHN0cmluZyxcbiAgaW5zdHJ1Y3Rpb25zOiBzdHJpbmcsXG4gIGluc3RydWN0aW9uc0xhbmc6IHN0cmluZyxcbiAgcHJvbXB0czogQXJyYXk8e3Byb21wdDogc3RyaW5nOyBlY2hvOiBib29sZWFuO30+LFxuICBmaW5pc2g6IChhbnN3ZXJzOiBBcnJheTxzdHJpbmc+KSA9PiB2b2lkKSAgPT4gdm9pZDtcblxudHlwZSBTc2hDb25uZWN0aW9uRGVsZWdhdGUgPSB7XG4gIC8qKiBJbnZva2VkIHdoZW4gc2VydmVyIHJlcXVlc3RzIGtleWJvYXJkIGludGVyYWN0aW9uICovXG4gIG9uS2V5Ym9hcmRJbnRlcmFjdGl2ZTogS2V5Ym9hcmRJbnRlcmFjdGl2ZUNhbGxiYWNrO1xuICAvKiogSW52b2tlZCB3aGVuIGNvbm5lY3Rpb24gaXMgc3VjZXNzZnVsICovXG4gIG9uQ29ubmVjdDogKGNvbm5lY3Rpb246IFJlbW90ZUNvbm5lY3Rpb24pID0+IHZvaWQ7XG4gIC8qKiBJbnZva2VkIHdoZW4gY29ubmVjdGlvbiBpcyBmYWlscyAqL1xuICBvbkVycm9yOiAoZXJyb3I6IEVycm9yLCBjb25maWc6IFNzaENvbm5lY3Rpb25Db25maWd1cmF0aW9uKSA9PiB2b2lkO1xufVxuXG5jbGFzcyBTc2hIYW5kc2hha2Uge1xuICBfZGVsZWdhdGU6IFNzaENvbm5lY3Rpb25EZWxlZ2F0ZTtcbiAgX2Nvbm5lY3Rpb246IFNzaENvbm5lY3Rpb247XG4gIF9jb25maWc6IFNzaENvbm5lY3Rpb25Db25maWd1cmF0aW9uO1xuICBfZm9yd2FyZGluZ1NlcnZlcjogbmV0LlNvY2tldDtcbiAgX3JlbW90ZUhvc3Q6ID9zdHJpbmc7XG4gIF9yZW1vdGVQb3J0OiA/bnVtYmVyO1xuICBfY2VydGlmaWNhdGVBdXRob3JpdHlDZXJ0aWZpY2F0ZTogP0J1ZmZlcjtcbiAgX2NsaWVudENlcnRpZmljYXRlOiA/QnVmZmVyO1xuICBfY2xpZW50S2V5OiA/QnVmZmVyO1xuICBfaGVhcnRiZWF0TmV0d29ya0F3YXlDb3VudDogaW50O1xuICBfbGFzdEhlYXJ0YmVhdE5vdGlmaWNhdGlvbjogP0hlYXJ0YmVhdE5vdGlmaWNhdGlvbjtcblxuICBjb25zdHJ1Y3RvcihkZWxlZ2F0ZTogU3NoQ29ubmVjdGlvbkRlbGVnYXRlLCBjb25uZWN0aW9uPzogU3NoQ29ubmVjdGlvbikge1xuICAgIHRoaXMuX2RlbGVnYXRlID0gZGVsZWdhdGU7XG4gICAgdGhpcy5faGVhcnRiZWF0TmV0d29ya0F3YXlDb3VudCA9IDA7XG4gICAgdGhpcy5fY29ubmVjdGlvbiA9IGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uIDogbmV3IFNzaENvbm5lY3Rpb24oKTtcbiAgICB0aGlzLl9jb25uZWN0aW9uLm9uKCdyZWFkeScsIHRoaXMuX29uQ29ubmVjdC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLl9jb25uZWN0aW9uLm9uKCdlcnJvcicsIGUgPT4gdGhpcy5fZGVsZWdhdGUub25FcnJvcihlLCB0aGlzLl9jb25maWcpKTtcbiAgICB0aGlzLl9jb25uZWN0aW9uLm9uKCdrZXlib2FyZC1pbnRlcmFjdGl2ZScsIHRoaXMuX29uS2V5Ym9hcmRJbnRlcmFjdGl2ZS5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIGNvbm5lY3QoY29uZmlnOiBTc2hDb25uZWN0aW9uQ29uZmlndXJhdGlvbik6IHZvaWQge1xuICAgIHZhciBleGlzdGluZ0Nvbm5lY3Rpb24gPSBSZW1vdGVDb25uZWN0aW9uLmdldEJ5SG9zdG5hbWVBbmRQYXRoKGNvbmZpZy5ob3N0LCBjb25maWcuY3dkKTtcbiAgICBpZiAoZXhpc3RpbmdDb25uZWN0aW9uKSB7XG4gICAgICB0aGlzLl9kZWxlZ2F0ZS5vbkNvbm5lY3QoZXhpc3RpbmdDb25uZWN0aW9uLCB0aGlzLl9jb25maWcpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX2NvbmZpZyA9IGNvbmZpZztcblxuICAgIHZhciB7bG9va3VwUHJlZmVySXB2Nn0gPSByZXF1aXJlKCdudWNsaWRlLWNvbW1vbnMnKS5kbnNVdGlscztcblxuICAgIGxvb2t1cFByZWZlcklwdjYoY29uZmlnLmhvc3QpLnRoZW4oKGFkZHJlc3MpID0+IHtcbiAgICAgIGlmIChjb25maWcuYXV0aE1ldGhvZCA9PT0gU3VwcG9ydGVkTWV0aG9kcy5TU0xfQUdFTlQpIHtcbiAgICAgICAgLy8gUG9pbnQgdG8gc3NoLWFnZW50J3Mgc29ja2V0IGZvciBzc2gtYWdlbnQtYmFzZWQgYXV0aGVudGljYXRpb24uXG4gICAgICAgIHZhciBhZ2VudCA9IHByb2Nlc3MuZW52WydTU0hfQVVUSF9TT0NLJ107XG4gICAgICAgIGlmICghYWdlbnQgJiYgL153aW4vLnRlc3QocHJvY2Vzcy5wbGF0Zm9ybSkpIHtcbiAgICAgICAgICAvLyAjMTAwOiBPbiBXaW5kb3dzLCBmYWxsIGJhY2sgdG8gcGFnZWFudC5cbiAgICAgICAgICBhZ2VudCA9ICdwYWdlYW50JztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9jb25uZWN0aW9uLmNvbm5lY3Qoe1xuICAgICAgICAgIGhvc3Q6IGFkZHJlc3MsXG4gICAgICAgICAgcG9ydDogY29uZmlnLnNzaFBvcnQsXG4gICAgICAgICAgdXNlcm5hbWU6IGNvbmZpZy51c2VybmFtZSxcbiAgICAgICAgICBhZ2VudCxcbiAgICAgICAgICB0cnlLZXlib2FyZDogdHJ1ZSxcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2UgaWYgKGNvbmZpZy5hdXRoTWV0aG9kID09PSBTdXBwb3J0ZWRNZXRob2RzLlBBU1NXT1JEKSB7XG4gICAgICAgICAgLy8gV2hlbiB0aGUgdXNlciBjaG9vc2VzIHBhc3N3b3JkLWJhc2VkIGF1dGhlbnRpY2F0aW9uLCB3ZSBzcGVjaWZ5XG4gICAgICAgICAgLy8gdGhlIGNvbmZpZyBhcyBmb2xsb3dzIHNvIHRoYXQgaXQgdHJpZXMgc2ltcGxlIHBhc3N3b3JkIGF1dGggYW5kXG4gICAgICAgICAgLy8gZmFpbGluZyB0aGF0IGl0IGZhbGxzIHRocm91Z2ggdG8gdGhlIGtleWJvYXJkIGludGVyYWN0aXZlIHBhdGhcbiAgICAgICAgICB0aGlzLl9jb25uZWN0aW9uLmNvbm5lY3Qoe1xuICAgICAgICAgICAgaG9zdDogYWRkcmVzcyxcbiAgICAgICAgICAgIHBvcnQ6IGNvbmZpZy5zc2hQb3J0LFxuICAgICAgICAgICAgdXNlcm5hbWU6IGNvbmZpZy51c2VybmFtZSxcbiAgICAgICAgICAgIHBhc3N3b3JkOiBjb25maWcucGFzc3dvcmQsXG4gICAgICAgICAgICB0cnlLZXlib2FyZDogdHJ1ZSxcbiAgICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSBpZiAoY29uZmlnLmF1dGhNZXRob2QgPT09IFN1cHBvcnRlZE1ldGhvZHMuUFJJVkFURV9LRVkpIHtcbiAgICAgICAgLy8gV2UgdXNlIGZzLXBsdXMncyBub3JtYWxpemUoKSBmdW5jdGlvbiBiZWNhdXNlIGl0IHdpbGwgZXhwYW5kIHRoZSB+LCBpZiBwcmVzZW50LlxuICAgICAgICB2YXIgZXhwYW5kZWRQYXRoID0gZnMubm9ybWFsaXplKGNvbmZpZy5wYXRoVG9Qcml2YXRlS2V5KTtcbiAgICAgICAgZnNQcm9taXNlLnJlYWRGaWxlKGV4cGFuZGVkUGF0aCkudGhlbihwcml2YXRlS2V5ID0+IHtcbiAgICAgICAgICB0aGlzLl9jb25uZWN0aW9uLmNvbm5lY3Qoe1xuICAgICAgICAgICAgaG9zdDogYWRkcmVzcyxcbiAgICAgICAgICAgIHBvcnQ6IGNvbmZpZy5zc2hQb3J0LFxuICAgICAgICAgICAgdXNlcm5hbWU6IGNvbmZpZy51c2VybmFtZSxcbiAgICAgICAgICAgIHByaXZhdGVLZXksXG4gICAgICAgICAgICB0cnlLZXlib2FyZDogdHJ1ZSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSkuY2F0Y2goKGUpID0+IHtcbiAgICAgICAgICB0aGlzLl9kZWxlZ2F0ZS5vbkVycm9yKGUsIHRoaXMuX2NvbmZpZyk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGF1dGhlbnRpY2F0aW9uIG1ldGhvZCcpO1xuICAgICAgfVxuICAgIH0pLmNhdGNoKChlKSA9PiB7XG4gICAgICB0aGlzLl9kZWxlZ2F0ZS5vbkVycm9yKGUsIHRoaXMuX2NvbmZpZyk7XG4gICAgfSk7XG4gIH1cblxuICBjYW5jZWwoKSB7XG4gICAgdGhpcy5fY29ubmVjdGlvbi5lbmQoKTtcbiAgfVxuXG4gIF9vbktleWJvYXJkSW50ZXJhY3RpdmUoXG4gICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICBpbnN0cnVjdGlvbnM6IHN0cmluZyxcbiAgICAgIGluc3RydWN0aW9uc0xhbmc6IHN0cmluZyxcbiAgICAgIHByb21wdHM6IEFycmF5PHtwcm9tcHQ6IHN0cmluZzsgZWNobzogYm9vbGVhbjt9PixcbiAgICAgIGZpbmlzaDogKGFuc3dlcnM6IEFycmF5PHN0cmluZz4pID0+IHZvaWQpOiB2b2lkIHtcbiAgICB0aGlzLl9kZWxlZ2F0ZS5vbktleWJvYXJkSW50ZXJhY3RpdmUobmFtZSwgaW5zdHJ1Y3Rpb25zLCBpbnN0cnVjdGlvbnNMYW5nLCBwcm9tcHRzLCBmaW5pc2gpO1xuICB9XG5cbiAgX2ZvcndhcmRTb2NrZXQoc29ja2V0OiBuZXQuU29ja2V0KTogdm9pZCB7XG4gICAgdGhpcy5fY29ubmVjdGlvbi5mb3J3YXJkT3V0KFxuICAgICAgc29ja2V0LnJlbW90ZUFkZHJlc3MsXG4gICAgICBzb2NrZXQucmVtb3RlUG9ydCxcbiAgICAgICdsb2NhbGhvc3QnLFxuICAgICAgdGhpcy5fcmVtb3RlUG9ydCxcbiAgICAgIChlcnIsIHN0cmVhbSkgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgc29ja2V0LmVuZCgpO1xuICAgICAgICAgIGxvZ2dlci5lcnJvcihlcnIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHNvY2tldC5waXBlKHN0cmVhbSk7XG4gICAgICAgIHN0cmVhbS5waXBlKHNvY2tldCk7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIF91cGRhdGVTZXJ2ZXJJbmZvKHNlcnZlckluZm8pIHtcbiAgICB0aGlzLl9yZW1vdGVQb3J0ID0gc2VydmVySW5mby5wb3J0O1xuICAgIHRoaXMuX3JlbW90ZUhvc3QgPSBgJHtzZXJ2ZXJJbmZvLmhvc3RuYW1lIHx8IHRoaXMuX2NvbmZpZy5ob3N0fWA7XG4gICAgLy8gQmVjYXVzZSB0aGUgdmFsdWUgZm9yIHRoZSBJbml0aWFsIERpcmVjdG9yeSB0aGF0IHRoZSB1c2VyIHN1cHBsaWVkIG1heSBoYXZlXG4gICAgLy8gYmVlbiBhIHN5bWxpbmsgdGhhdCB3YXMgcmVzb2x2ZWQgYnkgdGhlIHNlcnZlciwgb3ZlcndyaXRlIHRoZSBvcmlnaW5hbCBgY3dkYFxuICAgIC8vIHZhbHVlIHdpdGggdGhlIHJlc29sdmVkIHZhbHVlLlxuICAgIHRoaXMuX2NvbmZpZy5jd2QgPSBzZXJ2ZXJJbmZvLndvcmtzcGFjZTtcbiAgICB0aGlzLl9jZXJ0aWZpY2F0ZUF1dGhvcml0eUNlcnRpZmljYXRlID0gc2VydmVySW5mby5jYTtcbiAgICB0aGlzLl9jbGllbnRDZXJ0aWZpY2F0ZSA9IHNlcnZlckluZm8uY2VydDtcbiAgICB0aGlzLl9jbGllbnRLZXkgPSBzZXJ2ZXJJbmZvLmtleTtcbiAgfVxuXG4gIF9pc1NlY3VyZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fY2VydGlmaWNhdGVBdXRob3JpdHlDZXJ0aWZpY2F0ZVxuICAgICAgICAmJiB0aGlzLl9jbGllbnRDZXJ0aWZpY2F0ZVxuICAgICAgICAmJiB0aGlzLl9jbGllbnRLZXk7XG4gIH1cblxuICBfc3RhcnRSZW1vdGVTZXJ2ZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHZhciBlcnJvclRleHQgPSAnJztcbiAgICAgIHZhciBzdGRPdXQgPSAnJztcblxuICAgICAgLy9UT0RPOiBlc2NhcGUgYW55IHNpbmdsZSBxdW90ZXNcbiAgICAgIC8vVE9ETzogdGhlIHRpbWVvdXQgdmFsdWUgc2hhbGwgYmUgY29uZmlndXJhYmxlIHVzaW5nIC5qc29uIGZpbGUgdG9vICh0NjkwNDY5MSkuXG4gICAgICB2YXIgY21kID0gYCR7dGhpcy5fY29uZmlnLnJlbW90ZVNlcnZlckNvbW1hbmR9IC0td29ya3NwYWNlPSR7dGhpcy5fY29uZmlnLmN3ZH0gLS1jb21tb25fbmFtZT0ke3RoaXMuX2NvbmZpZy5ob3N0fSAtdCAyMGA7XG4gICAgICAvLyBBZGQgc3luYyB3b3JkIGJlZm9yZSBhbmQgYWZ0ZXIgdGhlIHJlbW90ZSBjb21tYW5kLCBzbyB0aGF0IHdlIGNhbiBleHRyYWN0IHRoZSBzdGRvdXRcbiAgICAgIC8vIHdpdGhvdXQgbm9pc2VzIGZyb20gLmJhc2hyYyBvciAuYmFzaF9wcm9maWxlLlxuICAgICAgLy8gTm90ZTogd2UgdXNlIC0tbG9naW4gdG8gaW1pdGF0ZSBhIGxvZ2luIHNoZWxsLiAgVGhpcyB3aWxsIG9ubHkgZXhlY3V0ZVxuICAgICAgLy8gLnByb2ZpbGUvLmJhc2hfcHJvZmlsZS8uYmFzaF9sb2dpbi4gIC5iYXNocmMgd2lsbCBvbmx5IGJlIGxvYWRlZCBpZlxuICAgICAgLy8gaXQgaXMgc291cmNlZCBpbiBvbmUgb2YgdGhlIGxvZ2luIHNjcmlwdHMuICBUaGlzIGlzIHByZXR0eSB0eXBpY2FsXG4gICAgICAvLyB0aG91Z2ggc28gbGlrZWx5IC5iYXNocmMgd2lsbCBiZSBsb2FkZWQuXG4gICAgICAvLyBOb3RlIDI6IFdlIGFsc28gcnVuIHRoaXMgYXMgYW4gaW50ZXJhY3RpdmUgc2hlbGwsIGV2ZW4gdGhvdWdoIGl0IGlzbid0LlxuICAgICAgLy8gVGhhdCBpcyBzbyBhbnl0aGluZyBiZWhpbmQgYW4gYGlmIFsgLXogJFBTMSBdYCwgc3VjaCBhcyBhZGRpbmcgZW50cmllc1xuICAgICAgLy8gdG8gdGhlICRQQVRILCB3aWxsIG5vdCBiZSBza2lwcGVkXG4gICAgICB0aGlzLl9jb25uZWN0aW9uLmV4ZWMoYGJhc2ggLS1sb2dpbiAtaSAtYyAnZWNobyAke1NZTkNfV09SRH07JHtjbWR9O2VjaG8gJHtTWU5DX1dPUkR9J2AsIChlcnIsIHN0cmVhbSkgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHN0cmVhbS5vbignY2xvc2UnLCBhc3luYyAoY29kZSwgc2lnbmFsKSA9PiB7XG4gICAgICAgICAgdmFyIHJlamVjdFdpdGhFcnJvciA9IChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICBlcnJvclRleHQgPSBgJHtlcnJvcn1cXG5cXG5zdGRlcnI6JHtlcnJvclRleHR9YDtcbiAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihlcnJvclRleHQpKTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgaWYgKGNvZGUgPT09IDApIHtcbiAgICAgICAgICAgIHZhciBzZXJ2ZXJJbmZvO1xuICAgICAgICAgICAgdmFyIG1hdGNoID0gU1RET1VUX1JFR0VYLmV4ZWMoc3RkT3V0KTtcbiAgICAgICAgICAgIGlmICghbWF0Y2gpIHtcbiAgICAgICAgICAgICAgcmVqZWN0V2l0aEVycm9yKGBCYWQgc3Rkb3V0IGZyb20gcmVtb3RlIHNlcnZlcjogJHtzdGRPdXR9YCk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIHNlcnZlckluZm8gPSBKU09OLnBhcnNlKG1hdGNoWzFdKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgcmVqZWN0V2l0aEVycm9yKGBCYWQgSlNPTiByZXBseSBmcm9tIE51Y2xpZGUgc2VydmVyOiAke21hdGNoWzFdfWApO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXNlcnZlckluZm8ud29ya3NwYWNlKSB7XG4gICAgICAgICAgICAgIHJlamVjdFdpdGhFcnJvcihgQ291bGQgbm90IGZpbmQgZGlyZWN0b3J5OiAke3RoaXMuX2NvbmZpZy5jd2R9YCk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVXBkYXRlIHNlcnZlciBpbmZvIHRoYXQgaXMgbmVlZGVkIGZvciBzZXR0aW5nIHVwIGNsaWVudC5cbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVNlcnZlckluZm8oc2VydmVySW5mbyk7XG4gICAgICAgICAgICByZXNvbHZlKHVuZGVmaW5lZCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoZXJyb3JUZXh0KSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KS5vbignZGF0YScsIChkYXRhKSA9PiB7XG4gICAgICAgICAgc3RkT3V0ICs9IGRhdGE7XG4gICAgICAgIH0pLnN0ZGVyci5vbignZGF0YScsIChkYXRhKSA9PiB7XG4gICAgICAgICAgZXJyb3JUZXh0ICs9IGRhdGE7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBfb25Db25uZWN0KCk6IHZvaWQge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLl9zdGFydFJlbW90ZVNlcnZlcigpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHRoaXMuX2RlbGVnYXRlLm9uRXJyb3IoZSwgdGhpcy5fY29uZmlnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgZmluaXNoSGFuZHNoYWtlID0gYXN5bmMoY29ubmVjdGlvbjogUmVtb3RlQ29ubmVjdGlvbikgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgY29ubmVjdGlvbi5pbml0aWFsaXplKCk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGVycm9yID0gbmV3IEVycm9yKGBGYWlsZWQgdG8gY29ubmVjdCB0byBOdWNsaWRlIHNlcnZlciBvbiAke3RoaXMuX2NvbmZpZy5ob3N0fTogJHtlLm1lc3NhZ2V9YCk7XG4gICAgICAgIHRoaXMuX2RlbGVnYXRlLm9uRXJyb3IoZXJyb3IsIHRoaXMuX2NvbmZpZyk7XG4gICAgICB9XG4gICAgICB0aGlzLl9kZWxlZ2F0ZS5vbkNvbm5lY3QoY29ubmVjdGlvbiwgdGhpcy5fY29uZmlnKTtcbiAgICB9O1xuXG4gICAgLy8gVXNlIGFuIHNzaCB0dW5uZWwgaWYgc2VydmVyIGlzIG5vdCBzZWN1cmVcbiAgICBpZiAodGhpcy5faXNTZWN1cmUoKSkge1xuICAgICAgdmFyIGNvbm5lY3Rpb24gPSBuZXcgUmVtb3RlQ29ubmVjdGlvbih7XG4gICAgICAgIGhvc3Q6IHRoaXMuX3JlbW90ZUhvc3QsXG4gICAgICAgIHBvcnQ6IHRoaXMuX3JlbW90ZVBvcnQsXG4gICAgICAgIGN3ZDogdGhpcy5fY29uZmlnLmN3ZCxcbiAgICAgICAgY2VydGlmaWNhdGVBdXRob3JpdHlDZXJ0aWZpY2F0ZTogdGhpcy5fY2VydGlmaWNhdGVBdXRob3JpdHlDZXJ0aWZpY2F0ZSxcbiAgICAgICAgY2xpZW50Q2VydGlmaWNhdGU6IHRoaXMuX2NsaWVudENlcnRpZmljYXRlLFxuICAgICAgICBjbGllbnRLZXk6IHRoaXMuX2NsaWVudEtleVxuICAgICAgfSk7XG4gICAgICBmaW5pc2hIYW5kc2hha2UoY29ubmVjdGlvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2ZvcndhcmRpbmdTZXJ2ZXIgPSBuZXQuY3JlYXRlU2VydmVyKChzb2NrKSA9PiB7XG4gICAgICAgIHRoaXMuX2ZvcndhcmRTb2NrZXQoc29jayk7XG4gICAgICB9KS5saXN0ZW4oMCwgJ2xvY2FsaG9zdCcsICgpID0+IHtcbiAgICAgICAgdmFyIGNvbm5lY3Rpb24gPSBuZXcgUmVtb3RlQ29ubmVjdGlvbih7XG4gICAgICAgICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gICAgICAgICAgcG9ydDogdGhpcy5fZ2V0TG9jYWxQb3J0KCksXG4gICAgICAgICAgY3dkOiB0aGlzLl9jb25maWcuY3dkXG4gICAgICAgIH0pO1xuICAgICAgICBmaW5pc2hIYW5kc2hha2UoY29ubmVjdGlvbik7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBfZ2V0TG9jYWxQb3J0KCk6ID9udW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9mb3J3YXJkaW5nU2VydmVyID8gdGhpcy5fZm9yd2FyZGluZ1NlcnZlci5hZGRyZXNzKCkucG9ydCA6IG51bGw7XG4gIH1cblxuICBnZXRDb25maWcoKTogU3NoQ29ubmVjdGlvbkNvbmZpZ3VyYXRpb257XG4gICAgcmV0dXJuIHRoaXMuX2NvbmZpZztcbiAgfVxufVxuXG5Tc2hIYW5kc2hha2UuU3VwcG9ydGVkTWV0aG9kcyA9IFN1cHBvcnRlZE1ldGhvZHM7XG5cbm1vZHVsZS5leHBvcnRzID0gU3NoSGFuZHNoYWtlO1xuIl19