'use babel';

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

var url = require('url');

var _require = require('./utils');

var asyncRequest = _require.asyncRequest;

var WebSocket = require('ws');
var uuid = require('uuid');

var _require2 = require('events');

var EventEmitter = _require2.EventEmitter;

var logger = require('nuclide-logging').getLogger();

var INITIAL_RECONNECT_TIME_MS = 10;
var MAX_RECONNECT_TIME_MS = 5000;
var HEARTBEAT_INTERVAL_MS = 5000;
var MAX_HEARTBEAT_AWAY_RECONNECT_MS = 60000;

// TODO(most): Rename class to reflect its new responsibilities (not just WebSocket connection).

var NuclideSocket = (function (_EventEmitter) {
  function NuclideSocket(serverUri, options) {
    _classCallCheck(this, NuclideSocket);

    _get(Object.getPrototypeOf(NuclideSocket.prototype), 'constructor', this).call(this);
    this._serverUri = serverUri;
    this._options = options;
    this.id = uuid.v4();
    this._reconnectTime = INITIAL_RECONNECT_TIME_MS;
    this._reconnectTimer = null;
    this._connected = false;
    this._closed = false;
    this._previouslyConnected = false;
    this._cachedMessages = [];

    var _url$parse = url.parse(serverUri);

    var protocol = _url$parse.protocol;
    var host = _url$parse.host;

    var websocketUri = 'ws' + (protocol === 'https:' ? 's' : '') + '://' + host;
    this._websocketUri = websocketUri;

    this._heartbeatConnectedOnce = false;
    this._lastHeartbeat = null;
    this._lastHeartbeatTime = null;
    this._monitorServerHeartbeat();

    this._reconnect();
  }

  _inherits(NuclideSocket, _EventEmitter);

  _createClass(NuclideSocket, [{
    key: 'waitForConnect',
    value: function waitForConnect() {
      var _this = this;

      return new Promise(function (resolve, reject) {
        if (_this._connected) {
          return resolve();
        } else {
          _this.on('connect', resolve);
        }
      });
    }
  }, {
    key: '_reconnect',
    value: function _reconnect() {
      var _this2 = this;

      var _options = this._options;
      var certificateAuthorityCertificate = _options.certificateAuthorityCertificate;
      var clientKey = _options.clientKey;
      var clientCertificate = _options.clientCertificate;

      var websocket = new WebSocket(this._websocketUri, {
        cert: clientCertificate,
        key: clientKey,
        ca: certificateAuthorityCertificate
      });

      var onSocketOpen = function onSocketOpen() {
        _this2._websocket = websocket;
        _this2._reconnectTime = INITIAL_RECONNECT_TIME_MS;
        // Handshake the server with my client id to manage my re-connect attemp, if it is.
        websocket.send(_this2.id, function () {
          if (_this2._previouslyConnected) {
            logger.info('WebSocket reconnected');
            _this2.emit('reconnect');
          } else {
            logger.info('WebSocket connected');
            _this2.emit('connect');
          }
          _this2._connected = true;
          _this2._previouslyConnected = true;
          _this2._cachedMessages.splice(0).forEach(function (message) {
            return _this2.send(message.data);
          });
        });
      };
      websocket.on('open', onSocketOpen);

      var onSocketClose = function onSocketClose() {
        if (_this2._websocket !== websocket) {
          return;
        }
        logger.info('WebSocket closed.');
        _this2._websocket = null;
        _this2._connected = false;
        _this2.emit('disconnect');
        if (!_this2._closed) {
          logger.info('WebSocket reconnecting after closed.');
          _this2._scheduleReconnect();
        }
      };
      websocket.on('close', onSocketClose);

      var onSocketError = function onSocketError(error) {
        if (_this2._websocket !== websocket) {
          return;
        }
        logger.error('WebSocket Error - reconnecting...', error);
        _this2._cleanWebSocket();
        _this2._scheduleReconnect();
      };
      websocket.on('error', onSocketError);

      var onSocketMessage = function onSocketMessage(data, flags) {
        // flags.binary will be set if a binary data is received.
        // flags.masked will be set if the data was masked.
        var json = JSON.parse(data);
        _this2.emit('message', json);
      };

      websocket.on('message', onSocketMessage);
      // WebSocket inherits from EventEmitter, and doesn't dispose the listeners on close.
      // Here, I added an expando property function to allow disposing those listeners on the created instance.
      websocket.dispose = function () {
        websocket.removeListener('open', onSocketOpen);
        websocket.removeListener('close', onSocketClose);
        websocket.removeListener('error', onSocketError);
        websocket.removeListener('message', onSocketMessage);
      };
    }
  }, {
    key: '_cleanWebSocket',
    value: function _cleanWebSocket() {
      if (this._websocket) {
        this._websocket.dispose();
        this._websocket.close();
        this._websocket = null;
      }
    }
  }, {
    key: '_scheduleReconnect',
    value: function _scheduleReconnect() {
      var _this3 = this;

      if (this._reconnectTimer) {
        return;
      }
      // Exponential reconnect time trials.
      this._reconnectTimer = setTimeout(function () {
        _this3._reconnectTimer = null;
        _this3._reconnect();
      }, this._reconnectTime);
      this._reconnectTime = this._reconnectTime * 2;
      if (this._reconnectTime > MAX_RECONNECT_TIME_MS) {
        this._reconnectTime = MAX_RECONNECT_TIME_MS;
      }
    }
  }, {
    key: '_clearReconnectTimer',
    value: function _clearReconnectTimer() {
      if (this._reconnectTimer) {
        clearTimeout(this._reconnectTimer);
        this._reconnectTimer = null;
      }
    }
  }, {
    key: 'send',
    value: function send(data) {
      var _this4 = this;

      // Wrap the data in an object, because if `data` is a primitive data type,
      // finding it in an array would return the first matching item, not necessarily the same inserted item.
      var message = { data: data };
      this._cachedMessages.push(message);
      if (!this._connected || !this._websocket) {
        return;
      }
      this._websocket.send(JSON.stringify(data), function (err) {
        if (err) {
          logger.warn('WebSocket error, but caching the message:', err);
        } else {
          var messageIndex = _this4._cachedMessages.indexOf(message);
          if (messageIndex !== -1) {
            _this4._cachedMessages.splice(messageIndex, 1);
          }
        }
      });
    }
  }, {
    key: 'xhrRequest',
    value: _asyncToGenerator(function* (options) {
      var _options2 = this._options;
      var certificateAuthorityCertificate = _options2.certificateAuthorityCertificate;
      var clientKey = _options2.clientKey;
      var clientCertificate = _options2.clientCertificate;

      if (certificateAuthorityCertificate && clientKey && clientCertificate) {
        options.agentOptions = {
          ca: certificateAuthorityCertificate,
          key: clientKey,
          cert: clientCertificate
        };
      }

      options.uri = this._serverUri + '/' + options.uri;

      var _ref = yield asyncRequest(options);

      var body = _ref.body;

      return body;
    })
  }, {
    key: '_monitorServerHeartbeat',
    value: function _monitorServerHeartbeat() {
      var _this5 = this;

      this._heartbeat();
      this._heartbeatInterval = setInterval(function () {
        return _this5._heartbeat();
      }, HEARTBEAT_INTERVAL_MS);
    }
  }, {
    key: '_heartbeat',
    value: _asyncToGenerator(function* () {
      try {
        yield this.xhrRequest({
          uri: 'server/version',
          method: 'POST'
        });
        this._heartbeatConnectedOnce = true;
        var now = Date.now();
        this._lastHeartbeatTime = this._lastHeartbeatTime || now;
        if (this._lastHeartbeat === 'away' || now - this._lastHeartbeatTime > MAX_HEARTBEAT_AWAY_RECONNECT_MS) {
          // Trigger a websocket reconnect.
          this._cleanWebSocket();
          this._scheduleReconnect();
        }
        this._lastHeartbeat = 'here';
        this._lastHeartbeatTime = now;
        this.emit('heartbeat');
      } catch (err) {
        this._connected = false;
        this._lastHeartbeat = 'away';
        // Error code could could be one of:
        // ['ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT']
        // A heuristic mapping is done between the xhr error code to the state of server connection.
        var originalCode = err.code;
        var message = err.message;

        var code = null;
        switch (originalCode) {
          case 'ENOTFOUND':
          // A socket operation failed because the network was down.
          case 'ENETDOWN':
          // The range of the temporary ports for connection are all taken,
          // This is temporal with many http requests, but should be counted as a network away event.
          case 'EADDRNOTAVAIL':
          // The host server is unreachable, could be in a VPN.
          case 'EHOSTUNREACH':
          // A request timeout is considered a network away event.
          case 'ETIMEDOUT':
            code = 'NETWORK_AWAY';
            break;
          case 'ECONNREFUSED':
            // Server shut down or port no longer accessible.
            if (this._heartbeatConnectedOnce) {
              code = 'SERVER_CRASHED';
            } else {
              code = 'PORT_NOT_ACCESSIBLE';
            }
            break;
          case 'ECONNRESET':
            code = 'INVALID_CERTIFICATE';
            break;
          default:
            code = originalCode;
            break;
        }
        this.emit('heartbeat.error', { code: code, originalCode: originalCode, message: message });
      }
    })
  }, {
    key: 'getServerUri',
    value: function getServerUri() {
      return this._serverUri;
    }
  }, {
    key: 'close',
    value: function close() {
      this._closed = true;
      if (this._connected) {
        this._connected = false;
        this.emit('disconnect');
      }
      if (this._reconnectTimer) {
        clearTimeout(this._reconnectTimer);
      }
      this._cleanWebSocket();
      this._cachedMessages = [];
      this._reconnectTime = INITIAL_RECONNECT_TIME_MS;
      clearInterval(this._heartbeatInterval);
    }
  }]);

  return NuclideSocket;
})(EventEmitter);

module.exports = NuclideSocket;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9ub2RlX21vZHVsZXMvbnVjbGlkZS1yZW1vdGUtY29ubmVjdGlvbi9ub2RlX21vZHVsZXMvbnVjbGlkZS1zZXJ2ZXIvbGliL051Y2xpZGVTb2NrZXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBV1osSUFBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDOztlQUNKLE9BQU8sQ0FBQyxTQUFTLENBQUM7O0lBQWxDLFlBQVksWUFBWixZQUFZOztBQUNqQixJQUFJLFNBQVMsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDOUIsSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDOztnQkFDTixPQUFPLENBQUMsUUFBUSxDQUFDOztJQUFqQyxZQUFZLGFBQVosWUFBWTs7QUFDakIsSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7O0FBUXBELElBQU0seUJBQXlCLEdBQUcsRUFBRSxDQUFDO0FBQ3JDLElBQU0scUJBQXFCLEdBQUcsSUFBSSxDQUFDO0FBQ25DLElBQU0scUJBQXFCLEdBQUcsSUFBSSxDQUFDO0FBQ25DLElBQU0sK0JBQStCLEdBQUcsS0FBSyxDQUFDOzs7O0lBR3hDLGFBQWE7QUFFTixXQUZQLGFBQWEsQ0FFTCxTQUFpQixFQUFFLE9BQThCLEVBQUU7MEJBRjNELGFBQWE7O0FBR2YsK0JBSEUsYUFBYSw2Q0FHUDtBQUNSLFFBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDO0FBQzVCLFFBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDO0FBQ3hCLFFBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO0FBQ3BCLFFBQUksQ0FBQyxjQUFjLEdB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Q3hDOzs7U0EzUEcsYUFBYTtHQUFTLFlBQVk7O0FBOFB4QyxNQUFNLENBQUMsT0FBTyxHQUFHLGFBQWEsQ0FBQyIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvbnVjbGlkZS1yZW1vdGUtcHJvamVjdHMvbm9kZV9tb2R1bGVzL251Y2xpZGUtcmVtb3RlLWNvbm5lY3Rpb24vbm9kZV9tb2R1bGVzL251Y2xpZGUtc2VydmVyL2xpYi9OdWNsaWRlU29ja2V0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxudmFyIHVybCA9IHJlcXVpcmUoJ3VybCcpO1xudmFyIHthc3luY1JlcXVlc3R9ID0gcmVxdWlyZSgnLi91dGlscycpO1xudmFyIFdlYlNvY2tldCA9IHJlcXVpcmUoJ3dzJyk7XG52YXIgdXVpZCA9IHJlcXVpcmUoJ3V1aWQnKTtcbnZhciB7RXZlbnRFbWl0dGVyfSA9IHJlcXVpcmUoJ2V2ZW50cycpO1xudmFyIGxvZ2dlciA9IHJlcXVpcmUoJ251Y2xpZGUtbG9nZ2luZycpLmdldExvZ2dlcigpO1xuXG50eXBlIE51Y2xpZGVTb2NrZXRPcHRpb25zID0ge1xuICBjZXJ0aWZpY2F0ZUF1dGhvcml0eUNlcnRpZmljYXRlOiA/QnVmZmVyO1xuICBjbGllbnRDZXJ0aWZpY2F0ZTogP0J1ZmZlcjtcbiAgY2xpZW50S2V5OiA/QnVmZmVyO1xufTtcblxuY29uc3QgSU5JVElBTF9SRUNPTk5FQ1RfVElNRV9NUyA9IDEwO1xuY29uc3QgTUFYX1JFQ09OTkVDVF9USU1FX01TID0gNTAwMDtcbmNvbnN0IEhFQVJUQkVBVF9JTlRFUlZBTF9NUyA9IDUwMDA7XG5jb25zdCBNQVhfSEVBUlRCRUFUX0FXQVlfUkVDT05ORUNUX01TID0gNjAwMDA7XG5cbi8vIFRPRE8obW9zdCk6IFJlbmFtZSBjbGFzcyB0byByZWZsZWN0IGl0cyBuZXcgcmVzcG9uc2liaWxpdGllcyAobm90IGp1c3QgV2ViU29ja2V0IGNvbm5lY3Rpb24pLlxuY2xhc3MgTnVjbGlkZVNvY2tldCBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG5cbiAgY29uc3RydWN0b3Ioc2VydmVyVXJpOiBzdHJpbmcsIG9wdGlvbnM6ID9OdWNsaWRlU29ja2V0T3B0aW9ucykge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5fc2VydmVyVXJpID0gc2VydmVyVXJpO1xuICAgIHRoaXMuX29wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMuaWQgPSB1dWlkLnY0KCk7XG4gICAgdGhpcy5fcmVjb25uZWN0VGltZSA9IElOSVRJQUxfUkVDT05ORUNUX1RJTUVfTVM7XG4gICAgdGhpcy5fcmVjb25uZWN0VGltZXIgPSBudWxsO1xuICAgIHRoaXMuX2Nvbm5lY3RlZCA9IGZhbHNlO1xuICAgIHRoaXMuX2Nsb3NlZCA9IGZhbHNlO1xuICAgIHRoaXMuX3ByZXZpb3VzbHlDb25uZWN0ZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9jYWNoZWRNZXNzYWdlcyA9IFtdO1xuXG4gICAgdmFyIHtwcm90b2NvbCwgaG9zdH0gPSB1cmwucGFyc2Uoc2VydmVyVXJpKTtcbiAgICB2YXIgd2Vic29ja2V0VXJpID0gJ3dzJyArICgocHJvdG9jb2wgPT09ICdodHRwczonKSA/ICdzJyA6ICcnKSArICc6Ly8nICsgaG9zdDtcbiAgICB0aGlzLl93ZWJzb2NrZXRVcmkgPSB3ZWJzb2NrZXRVcmk7XG5cbiAgICB0aGlzLl9oZWFydGJlYXRDb25uZWN0ZWRPbmNlID0gZmFsc2U7XG4gICAgdGhpcy5fbGFzdEhlYXJ0YmVhdCA9IG51bGw7XG4gICAgdGhpcy5fbGFzdEhlYXJ0YmVhdFRpbWUgPSBudWxsO1xuICAgIHRoaXMuX21vbml0b3JTZXJ2ZXJIZWFydGJlYXQoKTtcblxuICAgIHRoaXMuX3JlY29ubmVjdCgpO1xuICB9XG5cbiAgd2FpdEZvckNvbm5lY3QoKTogUHJvbWlzZSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGlmICh0aGlzLl9jb25uZWN0ZWQpIHtcbiAgICAgICAgcmV0dXJuIHJlc29sdmUoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMub24oJ2Nvbm5lY3QnLCByZXNvbHZlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIF9yZWNvbm5lY3QoKSB7XG4gICAgdmFyIHtjZXJ0aWZpY2F0ZUF1dGhvcml0eUNlcnRpZmljYXRlLCBjbGllbnRLZXksIGNsaWVudENlcnRpZmljYXRlfSA9IHRoaXMuX29wdGlvbnM7XG4gICAgdmFyIHdlYnNvY2tldCA9IG5ldyBXZWJTb2NrZXQodGhpcy5fd2Vic29ja2V0VXJpLCB7XG4gICAgICBjZXJ0OiBjbGllbnRDZXJ0aWZpY2F0ZSxcbiAgICAgIGtleTogY2xpZW50S2V5LFxuICAgICAgY2E6IGNlcnRpZmljYXRlQXV0aG9yaXR5Q2VydGlmaWNhdGUsXG4gICAgfSk7XG5cbiAgICB2YXIgb25Tb2NrZXRPcGVuID0gKCkgPT4ge1xuICAgICAgdGhpcy5fd2Vic29ja2V0ID0gd2Vic29ja2V0O1xuICAgICAgdGhpcy5fcmVjb25uZWN0VGltZSA9IElOSVRJQUxfUkVDT05ORUNUX1RJTUVfTVM7XG4gICAgICAvLyBIYW5kc2hha2UgdGhlIHNlcnZlciB3aXRoIG15IGNsaWVudCBpZCB0byBtYW5hZ2UgbXkgcmUtY29ubmVjdCBhdHRlbXAsIGlmIGl0IGlzLlxuICAgICAgd2Vic29ja2V0LnNlbmQodGhpcy5pZCwgKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5fcHJldmlvdXNseUNvbm5lY3RlZCkge1xuICAgICAgICAgIGxvZ2dlci5pbmZvKCdXZWJTb2NrZXQgcmVjb25uZWN0ZWQnKTtcbiAgICAgICAgICB0aGlzLmVtaXQoJ3JlY29ubmVjdCcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxvZ2dlci5pbmZvKCdXZWJTb2NrZXQgY29ubmVjdGVkJyk7XG4gICAgICAgICAgdGhpcy5lbWl0KCdjb25uZWN0Jyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fY29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fcHJldmlvdXNseUNvbm5lY3RlZCA9IHRydWU7XG4gICAgICAgIHRoaXMuX2NhY2hlZE1lc3NhZ2VzLnNwbGljZSgwKS5mb3JFYWNoKG1lc3NhZ2UgPT4gdGhpcy5zZW5kKG1lc3NhZ2UuZGF0YSkpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHdlYnNvY2tldC5vbignb3BlbicsIG9uU29ja2V0T3Blbik7XG5cbiAgICB2YXIgb25Tb2NrZXRDbG9zZSA9ICgpID0+IHtcbiAgICAgIGlmICh0aGlzLl93ZWJzb2NrZXQgIT09IHdlYnNvY2tldCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2dnZXIuaW5mbygnV2ViU29ja2V0IGNsb3NlZC4nKTtcbiAgICAgIHRoaXMuX3dlYnNvY2tldCA9IG51bGw7XG4gICAgICB0aGlzLl9jb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgIHRoaXMuZW1pdCgnZGlzY29ubmVjdCcpO1xuICAgICAgaWYgKCF0aGlzLl9jbG9zZWQpIHtcbiAgICAgICAgbG9nZ2VyLmluZm8oJ1dlYlNvY2tldCByZWNvbm5lY3RpbmcgYWZ0ZXIgY2xvc2VkLicpO1xuICAgICAgICB0aGlzLl9zY2hlZHVsZVJlY29ubmVjdCgpO1xuICAgICAgfVxuICAgIH07XG4gICAgd2Vic29ja2V0Lm9uKCdjbG9zZScsIG9uU29ja2V0Q2xvc2UpO1xuXG4gICAgdmFyIG9uU29ja2V0RXJyb3IgPSAoZXJyb3IpID0+IHtcbiAgICAgIGlmICh0aGlzLl93ZWJzb2NrZXQgIT09IHdlYnNvY2tldCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsb2dnZXIuZXJyb3IoJ1dlYlNvY2tldCBFcnJvciAtIHJlY29ubmVjdGluZy4uLicsIGVycm9yKTtcbiAgICAgIHRoaXMuX2NsZWFuV2ViU29ja2V0KCk7XG4gICAgICB0aGlzLl9zY2hlZHVsZVJlY29ubmVjdCgpO1xuICAgIH07XG4gICAgd2Vic29ja2V0Lm9uKCdlcnJvcicsIG9uU29ja2V0RXJyb3IpO1xuXG4gICAgdmFyIG9uU29ja2V0TWVzc2FnZSA9IChkYXRhLCBmbGFncykgPT4ge1xuICAgICAgLy8gZmxhZ3MuYmluYXJ5IHdpbGwgYmUgc2V0IGlmIGEgYmluYXJ5IGRhdGEgaXMgcmVjZWl2ZWQuXG4gICAgICAvLyBmbGFncy5tYXNrZWQgd2lsbCBiZSBzZXQgaWYgdGhlIGRhdGEgd2FzIG1hc2tlZC5cbiAgICAgIHZhciBqc29uID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICAgIHRoaXMuZW1pdCgnbWVzc2FnZScsIGpzb24pO1xuICAgIH07XG5cbiAgICB3ZWJzb2NrZXQub24oJ21lc3NhZ2UnLCBvblNvY2tldE1lc3NhZ2UpO1xuICAgIC8vIFdlYlNvY2tldCBpbmhlcml0cyBmcm9tIEV2ZW50RW1pdHRlciwgYW5kIGRvZXNuJ3QgZGlzcG9zZSB0aGUgbGlzdGVuZXJzIG9uIGNsb3NlLlxuICAgIC8vIEhlcmUsIEkgYWRkZWQgYW4gZXhwYW5kbyBwcm9wZXJ0eSBmdW5jdGlvbiB0byBhbGxvdyBkaXNwb3NpbmcgdGhvc2UgbGlzdGVuZXJzIG9uIHRoZSBjcmVhdGVkIGluc3RhbmNlLlxuICAgIHdlYnNvY2tldC5kaXNwb3NlID0gKCkgPT4ge1xuICAgICAgd2Vic29ja2V0LnJlbW92ZUxpc3RlbmVyKCdvcGVuJywgb25Tb2NrZXRPcGVuKTtcbiAgICAgIHdlYnNvY2tldC5yZW1vdmVMaXN0ZW5lcignY2xvc2UnLCBvblNvY2tldENsb3NlKTtcbiAgICAgIHdlYnNvY2tldC5yZW1vdmVMaXN0ZW5lcignZXJyb3InLCBvblNvY2tldEVycm9yKTtcbiAgICAgIHdlYnNvY2tldC5yZW1vdmVMaXN0ZW5lcignbWVzc2FnZScsIG9uU29ja2V0TWVzc2FnZSk7XG4gICAgfTtcbiAgfVxuXG4gIF9jbGVhbldlYlNvY2tldCgpIHtcbiAgICBpZiAodGhpcy5fd2Vic29ja2V0KSB7XG4gICAgICB0aGlzLl93ZWJzb2NrZXQuZGlzcG9zZSgpO1xuICAgICAgdGhpcy5fd2Vic29ja2V0LmNsb3NlKCk7XG4gICAgICB0aGlzLl93ZWJzb2NrZXQgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIF9zY2hlZHVsZVJlY29ubmVjdCgpIHtcbiAgICBpZiAodGhpcy5fcmVjb25uZWN0VGltZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gRXhwb25lbnRpYWwgcmVjb25uZWN0IHRpbWUgdHJpYWxzLlxuICAgIHRoaXMuX3JlY29ubmVjdFRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aGlzLl9yZWNvbm5lY3RUaW1lciA9IG51bGw7XG4gICAgICB0aGlzLl9yZWNvbm5lY3QoKTtcbiAgICB9LCB0aGlzLl9yZWNvbm5lY3RUaW1lKTtcbiAgICB0aGlzLl9yZWNvbm5lY3RUaW1lID0gdGhpcy5fcmVjb25uZWN0VGltZSAqIDI7XG4gICAgaWYgKHRoaXMuX3JlY29ubmVjdFRpbWUgPiBNQVhfUkVDT05ORUNUX1RJTUVfTVMpIHtcbiAgICAgIHRoaXMuX3JlY29ubmVjdFRpbWUgPSBNQVhfUkVDT05ORUNUX1RJTUVfTVM7XG4gICAgfVxuICB9XG5cbiAgX2NsZWFyUmVjb25uZWN0VGltZXIoKSB7XG4gICAgaWYgKHRoaXMuX3JlY29ubmVjdFRpbWVyKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fcmVjb25uZWN0VGltZXIpO1xuICAgICAgdGhpcy5fcmVjb25uZWN0VGltZXIgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHNlbmQoZGF0YTogYW55KTogdm9pZCB7XG4gICAgLy8gV3JhcCB0aGUgZGF0YSBpbiBhbiBvYmplY3QsIGJlY2F1c2UgaWYgYGRhdGFgIGlzIGEgcHJpbWl0aXZlIGRhdGEgdHlwZSxcbiAgICAvLyBmaW5kaW5nIGl0IGluIGFuIGFycmF5IHdvdWxkIHJldHVybiB0aGUgZmlyc3QgbWF0Y2hpbmcgaXRlbSwgbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIGluc2VydGVkIGl0ZW0uXG4gICAgdmFyIG1lc3NhZ2UgPSB7ZGF0YX07XG4gICAgdGhpcy5fY2FjaGVkTWVzc2FnZXMucHVzaChtZXNzYWdlKTtcbiAgICBpZiAoIXRoaXMuX2Nvbm5lY3RlZCB8fCAhdGhpcy5fd2Vic29ja2V0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuX3dlYnNvY2tldC5zZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpLCAoZXJyKSA9PiB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGxvZ2dlci53YXJuKCdXZWJTb2NrZXQgZXJyb3IsIGJ1dCBjYWNoaW5nIHRoZSBtZXNzYWdlOicsIGVycik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgbWVzc2FnZUluZGV4ID0gdGhpcy5fY2FjaGVkTWVzc2FnZXMuaW5kZXhPZihtZXNzYWdlKTtcbiAgICAgICAgaWYgKG1lc3NhZ2VJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICB0aGlzLl9jYWNoZWRNZXNzYWdlcy5zcGxpY2UobWVzc2FnZUluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgeGhyUmVxdWVzdChvcHRpb25zOiBhbnkpOiBQcm9taXNlPHN0cmluZ3xhbnk+IHtcbiAgICB2YXIge2NlcnRpZmljYXRlQXV0aG9yaXR5Q2VydGlmaWNhdGUsIGNsaWVudEtleSwgY2xpZW50Q2VydGlmaWNhdGV9ID0gdGhpcy5fb3B0aW9ucztcbiAgICBpZiAoY2VydGlmaWNhdGVBdXRob3JpdHlDZXJ0aWZpY2F0ZSAmJiBjbGllbnRLZXkgJiYgY2xpZW50Q2VydGlmaWNhdGUpIHtcbiAgICAgIG9wdGlvbnMuYWdlbnRPcHRpb25zID0ge1xuICAgICAgICBjYTogY2VydGlmaWNhdGVBdXRob3JpdHlDZXJ0aWZpY2F0ZSxcbiAgICAgICAga2V5OiBjbGllbnRLZXksXG4gICAgICAgIGNlcnQ6IGNsaWVudENlcnRpZmljYXRlLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBvcHRpb25zLnVyaSA9IHRoaXMuX3NlcnZlclVyaSArICcvJyArIG9wdGlvbnMudXJpO1xuICAgIHZhciB7Ym9keX0gPSBhd2FpdCBhc3luY1JlcXVlc3Qob3B0aW9ucyk7XG4gICAgcmV0dXJuIGJvZHk7XG4gIH1cblxuICBfbW9uaXRvclNlcnZlckhlYXJ0YmVhdCgpOiB2b2lkIHtcbiAgICB0aGlzLl9oZWFydGJlYXQoKTtcbiAgICB0aGlzLl9oZWFydGJlYXRJbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHRoaXMuX2hlYXJ0YmVhdCgpLCBIRUFSVEJFQVRfSU5URVJWQUxfTVMpO1xuICB9XG5cbiAgYXN5bmMgX2hlYXJ0YmVhdCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy54aHJSZXF1ZXN0KHtcbiAgICAgICAgdXJpOiAnc2VydmVyL3ZlcnNpb24nLFxuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIH0pO1xuICAgICAgdGhpcy5faGVhcnRiZWF0Q29ubmVjdGVkT25jZSA9IHRydWU7XG4gICAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgIHRoaXMuX2xhc3RIZWFydGJlYXRUaW1lID0gdGhpcy5fbGFzdEhlYXJ0YmVhdFRpbWUgfHwgbm93O1xuICAgICAgaWYgKHRoaXMuX2xhc3RIZWFydGJlYXQgPT09ICdhd2F5J1xuICAgICAgICAgIHx8ICgobm93IC0gdGhpcy5fbGFzdEhlYXJ0YmVhdFRpbWUpID4gTUFYX0hFQVJUQkVBVF9BV0FZX1JFQ09OTkVDVF9NUykpIHtcbiAgICAgICAgLy8gVHJpZ2dlciBhIHdlYnNvY2tldCByZWNvbm5lY3QuXG4gICAgICAgIHRoaXMuX2NsZWFuV2ViU29ja2V0KCk7XG4gICAgICAgIHRoaXMuX3NjaGVkdWxlUmVjb25uZWN0KCk7XG4gICAgICB9XG4gICAgICB0aGlzLl9sYXN0SGVhcnRiZWF0ICA9ICdoZXJlJztcbiAgICAgIHRoaXMuX2xhc3RIZWFydGJlYXRUaW1lID0gbm93O1xuICAgICAgdGhpcy5lbWl0KCdoZWFydGJlYXQnKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHRoaXMuX2Nvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgdGhpcy5fbGFzdEhlYXJ0YmVhdCAgPSAnYXdheSc7XG4gICAgICAvLyBFcnJvciBjb2RlIGNvdWxkIGNvdWxkIGJlIG9uZSBvZjpcbiAgICAgIC8vIFsnRU5PVEZPVU5EJywgJ0VDT05OUkVGVVNFRCcsICdFQ09OTlJFU0VUJywgJ0VUSU1FRE9VVCddXG4gICAgICAvLyBBIGhldXJpc3RpYyBtYXBwaW5nIGlzIGRvbmUgYmV0d2VlbiB0aGUgeGhyIGVycm9yIGNvZGUgdG8gdGhlIHN0YXRlIG9mIHNlcnZlciBjb25uZWN0aW9uLlxuICAgICAgdmFyIHtjb2RlOiBvcmlnaW5hbENvZGUsIG1lc3NhZ2V9ID0gZXJyO1xuICAgICAgdmFyIGNvZGUgPSBudWxsO1xuICAgICAgc3dpdGNoIChvcmlnaW5hbENvZGUpIHtcbiAgICAgICAgY2FzZSAnRU5PVEZPVU5EJzpcbiAgICAgICAgLy8gQSBzb2NrZXQgb3BlcmF0aW9uIGZhaWxlZCBiZWNhdXNlIHRoZSBuZXR3b3JrIHdhcyBkb3duLlxuICAgICAgICBjYXNlICdFTkVURE9XTic6XG4gICAgICAgIC8vIFRoZSByYW5nZSBvZiB0aGUgdGVtcG9yYXJ5IHBvcnRzIGZvciBjb25uZWN0aW9uIGFyZSBhbGwgdGFrZW4sXG4gICAgICAgIC8vIFRoaXMgaXMgdGVtcG9yYWwgd2l0aCBtYW55IGh0dHAgcmVxdWVzdHMsIGJ1dCBzaG91bGQgYmUgY291bnRlZCBhcyBhIG5ldHdvcmsgYXdheSBldmVudC5cbiAgICAgICAgY2FzZSAnRUFERFJOT1RBVkFJTCc6XG4gICAgICAgIC8vIFRoZSBob3N0IHNlcnZlciBpcyB1bnJlYWNoYWJsZSwgY291bGQgYmUgaW4gYSBWUE4uXG4gICAgICAgIGNhc2UgJ0VIT1NUVU5SRUFDSCc6XG4gICAgICAgIC8vIEEgcmVxdWVzdCB0aW1lb3V0IGlzIGNvbnNpZGVyZWQgYSBuZXR3b3JrIGF3YXkgZXZlbnQuXG4gICAgICAgIGNhc2UgJ0VUSU1FRE9VVCc6XG4gICAgICAgICAgY29kZSA9ICdORVRXT1JLX0FXQVknO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdFQ09OTlJFRlVTRUQnOlxuICAgICAgICAgIC8vIFNlcnZlciBzaHV0IGRvd24gb3IgcG9ydCBubyBsb25nZXIgYWNjZXNzaWJsZS5cbiAgICAgICAgICBpZiAodGhpcy5faGVhcnRiZWF0Q29ubmVjdGVkT25jZSkge1xuICAgICAgICAgICAgY29kZSA9ICdTRVJWRVJfQ1JBU0hFRCc7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvZGUgPSAnUE9SVF9OT1RfQUNDRVNTSUJMRSc7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdFQ09OTlJFU0VUJzpcbiAgICAgICAgICBjb2RlID0gJ0lOVkFMSURfQ0VSVElGSUNBVEUnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGNvZGUgPSBvcmlnaW5hbENvZGU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICB0aGlzLmVtaXQoJ2hlYXJ0YmVhdC5lcnJvcicsIHtjb2RlLCBvcmlnaW5hbENvZGUsIG1lc3NhZ2V9KTtcbiAgICB9XG4gIH1cblxuICBnZXRTZXJ2ZXJVcmkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fc2VydmVyVXJpO1xuICB9XG5cbiAgY2xvc2UoKSB7XG4gICAgdGhpcy5fY2xvc2VkID0gdHJ1ZTtcbiAgICBpZiAodGhpcy5fY29ubmVjdGVkKSB7XG4gICAgICB0aGlzLl9jb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgIHRoaXMuZW1pdCgnZGlzY29ubmVjdCcpO1xuICAgIH1cbiAgICBpZiAodGhpcy5fcmVjb25uZWN0VGltZXIpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9yZWNvbm5lY3RUaW1lcik7XG4gICAgfVxuICAgIHRoaXMuX2NsZWFuV2ViU29ja2V0KCk7XG4gICAgdGhpcy5fY2FjaGVkTWVzc2FnZXMgPSBbXTtcbiAgICB0aGlzLl9yZWNvbm5lY3RUaW1lID0gSU5JVElBTF9SRUNPTk5FQ1RfVElNRV9NUztcbiAgICBjbGVhckludGVydmFsKHRoaXMuX2hlYXJ0YmVhdEludGVydmFsKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE51Y2xpZGVTb2NrZXQ7XG4iXX0=