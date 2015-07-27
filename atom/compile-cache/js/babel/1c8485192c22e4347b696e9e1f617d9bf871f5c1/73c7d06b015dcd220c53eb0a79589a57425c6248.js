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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9ub2RlX21vZHVsZXMvbnVjbGlkZS1yZW1vdGUtY29ubmVjdGlvbi9ub2RlX21vZHVsZXMvbnVjbGlkZS1zZXJ2ZXIvbGliL051Y2xpZGVTb2NrZXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBV1osSUFBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDOztlQUNKLE9BQU8sQ0FBQyxTQUFTLENBQUM7O0lBQWxDLFlBQVksWUFBWixZQUFZOztBQUNqQixJQUFJLFNBQVMsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDOUIsSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDOztnQkFDTixPQUFPLENBQUMsUUFBUSxDQUFDOztJQUFqQyxZQUFZLGFBQVosWUFBWTs7QUFDakIsSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7O0FBUXBELElBQU0seUJBQXlCLEdBQUcsRUFBRSxDQUFDO0FBQ3JDLElBQU0scUJBQXFCLEdBQUcsSUFBSSxDQUFDO0FBQ25DLElBQU0scUJBQXFCLEdBQUcsSUFBSSxDQUFDO0FBQ25DLElBQU0sK0JBQStCLEdBQUcsS0FBSyxDQUFDOzs7O0lBR3hDLGFBQWE7QUFFTixXQUZQLGFBQWEsQ0FFTCxTQUFpQixFQUFFLE9BQThCLEVBQUU7MEJBRjNELGFBQWE7O0FBR2YsK0JBSEUsYUFBYSw2Q0FHUDtBQUNSLFFBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDO0FBQzVCLFFBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDO0FBQ3hCLFFBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO0FBQ3BCLFFBQUksQ0FBQyxjQUFjLEdB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LENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7S0FDeEM7OztTQTNQRyxhQUFhO0dBQVMsWUFBWTs7QUE4UHhDLE1BQU0sQ0FBQyxPQUFPLEdBQUcsYUFBYSxDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9ub2RlX21vZHVsZXMvbnVjbGlkZS1yZW1vdGUtY29ubmVjdGlvbi9ub2RlX21vZHVsZXMvbnVjbGlkZS1zZXJ2ZXIvbGliL051Y2xpZGVTb2NrZXQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIgdXJsID0gcmVxdWlyZSgndXJsJyk7XG52YXIge2FzeW5jUmVxdWVzdH0gPSByZXF1aXJlKCcuL3V0aWxzJyk7XG52YXIgV2ViU29ja2V0ID0gcmVxdWlyZSgnd3MnKTtcbnZhciB1dWlkID0gcmVxdWlyZSgndXVpZCcpO1xudmFyIHtFdmVudEVtaXR0ZXJ9ID0gcmVxdWlyZSgnZXZlbnRzJyk7XG52YXIgbG9nZ2VyID0gcmVxdWlyZSgnbnVjbGlkZS1sb2dnaW5nJykuZ2V0TG9nZ2VyKCk7XG5cbnR5cGUgTnVjbGlkZVNvY2tldE9wdGlvbnMgPSB7XG4gIGNlcnRpZmljYXRlQXV0aG9yaXR5Q2VydGlmaWNhdGU6ID9CdWZmZXI7XG4gIGNsaWVudENlcnRpZmljYXRlOiA/QnVmZmVyO1xuICBjbGllbnRLZXk6ID9CdWZmZXI7XG59O1xuXG5jb25zdCBJTklUSUFMX1JFQ09OTkVDVF9USU1FX01TID0gMTA7XG5jb25zdCBNQVhfUkVDT05ORUNUX1RJTUVfTVMgPSA1MDAwO1xuY29uc3QgSEVBUlRCRUFUX0lOVEVSVkFMX01TID0gNTAwMDtcbmNvbnN0IE1BWF9IRUFSVEJFQVRfQVdBWV9SRUNPTk5FQ1RfTVMgPSA2MDAwMDtcblxuLy8gVE9ETyhtb3N0KTogUmVuYW1lIGNsYXNzIHRvIHJlZmxlY3QgaXRzIG5ldyByZXNwb25zaWJpbGl0aWVzIChub3QganVzdCBXZWJTb2NrZXQgY29ubmVjdGlvbikuXG5jbGFzcyBOdWNsaWRlU29ja2V0IGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcblxuICBjb25zdHJ1Y3RvcihzZXJ2ZXJVcmk6IHN0cmluZywgb3B0aW9uczogP051Y2xpZGVTb2NrZXRPcHRpb25zKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl9zZXJ2ZXJVcmkgPSBzZXJ2ZXJVcmk7XG4gICAgdGhpcy5fb3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5pZCA9IHV1aWQudjQoKTtcbiAgICB0aGlzLl9yZWNvbm5lY3RUaW1lID0gSU5JVElBTF9SRUNPTk5FQ1RfVElNRV9NUztcbiAgICB0aGlzLl9yZWNvbm5lY3RUaW1lciA9IG51bGw7XG4gICAgdGhpcy5fY29ubmVjdGVkID0gZmFsc2U7XG4gICAgdGhpcy5fY2xvc2VkID0gZmFsc2U7XG4gICAgdGhpcy5fcHJldmlvdXNseUNvbm5lY3RlZCA9IGZhbHNlO1xuICAgIHRoaXMuX2NhY2hlZE1lc3NhZ2VzID0gW107XG5cbiAgICB2YXIge3Byb3RvY29sLCBob3N0fSA9IHVybC5wYXJzZShzZXJ2ZXJVcmkpO1xuICAgIHZhciB3ZWJzb2NrZXRVcmkgPSAnd3MnICsgKChwcm90b2NvbCA9PT0gJ2h0dHBzOicpID8gJ3MnIDogJycpICsgJzovLycgKyBob3N0O1xuICAgIHRoaXMuX3dlYnNvY2tldFVyaSA9IHdlYnNvY2tldFVyaTtcblxuICAgIHRoaXMuX2hlYXJ0YmVhdENvbm5lY3RlZE9uY2UgPSBmYWxzZTtcbiAgICB0aGlzLl9sYXN0SGVhcnRiZWF0ID0gbnVsbDtcbiAgICB0aGlzLl9sYXN0SGVhcnRiZWF0VGltZSA9IG51bGw7XG4gICAgdGhpcy5fbW9uaXRvclNlcnZlckhlYXJ0YmVhdCgpO1xuXG4gICAgdGhpcy5fcmVjb25uZWN0KCk7XG4gIH1cblxuICB3YWl0Rm9yQ29ubmVjdCgpOiBQcm9taXNlIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgaWYgKHRoaXMuX2Nvbm5lY3RlZCkge1xuICAgICAgICByZXR1cm4gcmVzb2x2ZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5vbignY29ubmVjdCcsIHJlc29sdmUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgX3JlY29ubmVjdCgpIHtcbiAgICB2YXIge2NlcnRpZmljYXRlQXV0aG9yaXR5Q2VydGlmaWNhdGUsIGNsaWVudEtleSwgY2xpZW50Q2VydGlmaWNhdGV9ID0gdGhpcy5fb3B0aW9ucztcbiAgICB2YXIgd2Vic29ja2V0ID0gbmV3IFdlYlNvY2tldCh0aGlzLl93ZWJzb2NrZXRVcmksIHtcbiAgICAgIGNlcnQ6IGNsaWVudENlcnRpZmljYXRlLFxuICAgICAga2V5OiBjbGllbnRLZXksXG4gICAgICBjYTogY2VydGlmaWNhdGVBdXRob3JpdHlDZXJ0aWZpY2F0ZSxcbiAgICB9KTtcblxuICAgIHZhciBvblNvY2tldE9wZW4gPSAoKSA9PiB7XG4gICAgICB0aGlzLl93ZWJzb2NrZXQgPSB3ZWJzb2NrZXQ7XG4gICAgICB0aGlzLl9yZWNvbm5lY3RUaW1lID0gSU5JVElBTF9SRUNPTk5FQ1RfVElNRV9NUztcbiAgICAgIC8vIEhhbmRzaGFrZSB0aGUgc2VydmVyIHdpdGggbXkgY2xpZW50IGlkIHRvIG1hbmFnZSBteSByZS1jb25uZWN0IGF0dGVtcCwgaWYgaXQgaXMuXG4gICAgICB3ZWJzb2NrZXQuc2VuZCh0aGlzLmlkLCAoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLl9wcmV2aW91c2x5Q29ubmVjdGVkKSB7XG4gICAgICAgICAgbG9nZ2VyLmluZm8oJ1dlYlNvY2tldCByZWNvbm5lY3RlZCcpO1xuICAgICAgICAgIHRoaXMuZW1pdCgncmVjb25uZWN0Jyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbG9nZ2VyLmluZm8oJ1dlYlNvY2tldCBjb25uZWN0ZWQnKTtcbiAgICAgICAgICB0aGlzLmVtaXQoJ2Nvbm5lY3QnKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9jb25uZWN0ZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLl9wcmV2aW91c2x5Q29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fY2FjaGVkTWVzc2FnZXMuc3BsaWNlKDApLmZvckVhY2gobWVzc2FnZSA9PiB0aGlzLnNlbmQobWVzc2FnZS5kYXRhKSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgd2Vic29ja2V0Lm9uKCdvcGVuJywgb25Tb2NrZXRPcGVuKTtcblxuICAgIHZhciBvblNvY2tldENsb3NlID0gKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuX3dlYnNvY2tldCAhPT0gd2Vic29ja2V0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZ2dlci5pbmZvKCdXZWJTb2NrZXQgY2xvc2VkLicpO1xuICAgICAgdGhpcy5fd2Vic29ja2V0ID0gbnVsbDtcbiAgICAgIHRoaXMuX2Nvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgdGhpcy5lbWl0KCdkaXNjb25uZWN0Jyk7XG4gICAgICBpZiAoIXRoaXMuX2Nsb3NlZCkge1xuICAgICAgICBsb2dnZXIuaW5mbygnV2ViU29ja2V0IHJlY29ubmVjdGluZyBhZnRlciBjbG9zZWQuJyk7XG4gICAgICAgIHRoaXMuX3NjaGVkdWxlUmVjb25uZWN0KCk7XG4gICAgICB9XG4gICAgfTtcbiAgICB3ZWJzb2NrZXQub24oJ2Nsb3NlJywgb25Tb2NrZXRDbG9zZSk7XG5cbiAgICB2YXIgb25Tb2NrZXRFcnJvciA9IChlcnJvcikgPT4ge1xuICAgICAgaWYgKHRoaXMuX3dlYnNvY2tldCAhPT0gd2Vic29ja2V0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxvZ2dlci5lcnJvcignV2ViU29ja2V0IEVycm9yIC0gcmVjb25uZWN0aW5nLi4uJywgZXJyb3IpO1xuICAgICAgdGhpcy5fY2xlYW5XZWJTb2NrZXQoKTtcbiAgICAgIHRoaXMuX3NjaGVkdWxlUmVjb25uZWN0KCk7XG4gICAgfTtcbiAgICB3ZWJzb2NrZXQub24oJ2Vycm9yJywgb25Tb2NrZXRFcnJvcik7XG5cbiAgICB2YXIgb25Tb2NrZXRNZXNzYWdlID0gKGRhdGEsIGZsYWdzKSA9PiB7XG4gICAgICAvLyBmbGFncy5iaW5hcnkgd2lsbCBiZSBzZXQgaWYgYSBiaW5hcnkgZGF0YSBpcyByZWNlaXZlZC5cbiAgICAgIC8vIGZsYWdzLm1hc2tlZCB3aWxsIGJlIHNldCBpZiB0aGUgZGF0YSB3YXMgbWFza2VkLlxuICAgICAgdmFyIGpzb24gPSBKU09OLnBhcnNlKGRhdGEpO1xuICAgICAgdGhpcy5lbWl0KCdtZXNzYWdlJywganNvbik7XG4gICAgfTtcblxuICAgIHdlYnNvY2tldC5vbignbWVzc2FnZScsIG9uU29ja2V0TWVzc2FnZSk7XG4gICAgLy8gV2ViU29ja2V0IGluaGVyaXRzIGZyb20gRXZlbnRFbWl0dGVyLCBhbmQgZG9lc24ndCBkaXNwb3NlIHRoZSBsaXN0ZW5lcnMgb24gY2xvc2UuXG4gICAgLy8gSGVyZSwgSSBhZGRlZCBhbiBleHBhbmRvIHByb3BlcnR5IGZ1bmN0aW9uIHRvIGFsbG93IGRpc3Bvc2luZyB0aG9zZSBsaXN0ZW5lcnMgb24gdGhlIGNyZWF0ZWQgaW5zdGFuY2UuXG4gICAgd2Vic29ja2V0LmRpc3Bvc2UgPSAoKSA9PiB7XG4gICAgICB3ZWJzb2NrZXQucmVtb3ZlTGlzdGVuZXIoJ29wZW4nLCBvblNvY2tldE9wZW4pO1xuICAgICAgd2Vic29ja2V0LnJlbW92ZUxpc3RlbmVyKCdjbG9zZScsIG9uU29ja2V0Q2xvc2UpO1xuICAgICAgd2Vic29ja2V0LnJlbW92ZUxpc3RlbmVyKCdlcnJvcicsIG9uU29ja2V0RXJyb3IpO1xuICAgICAgd2Vic29ja2V0LnJlbW92ZUxpc3RlbmVyKCdtZXNzYWdlJywgb25Tb2NrZXRNZXNzYWdlKTtcbiAgICB9O1xuICB9XG5cbiAgX2NsZWFuV2ViU29ja2V0KCkge1xuICAgIGlmICh0aGlzLl93ZWJzb2NrZXQpIHtcbiAgICAgIHRoaXMuX3dlYnNvY2tldC5kaXNwb3NlKCk7XG4gICAgICB0aGlzLl93ZWJzb2NrZXQuY2xvc2UoKTtcbiAgICAgIHRoaXMuX3dlYnNvY2tldCA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgX3NjaGVkdWxlUmVjb25uZWN0KCkge1xuICAgIGlmICh0aGlzLl9yZWNvbm5lY3RUaW1lcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBFeHBvbmVudGlhbCByZWNvbm5lY3QgdGltZSB0cmlhbHMuXG4gICAgdGhpcy5fcmVjb25uZWN0VGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuX3JlY29ubmVjdFRpbWVyID0gbnVsbDtcbiAgICAgIHRoaXMuX3JlY29ubmVjdCgpO1xuICAgIH0sIHRoaXMuX3JlY29ubmVjdFRpbWUpO1xuICAgIHRoaXMuX3JlY29ubmVjdFRpbWUgPSB0aGlzLl9yZWNvbm5lY3RUaW1lICogMjtcbiAgICBpZiAodGhpcy5fcmVjb25uZWN0VGltZSA+IE1BWF9SRUNPTk5FQ1RfVElNRV9NUykge1xuICAgICAgdGhpcy5fcmVjb25uZWN0VGltZSA9IE1BWF9SRUNPTk5FQ1RfVElNRV9NUztcbiAgICB9XG4gIH1cblxuICBfY2xlYXJSZWNvbm5lY3RUaW1lcigpIHtcbiAgICBpZiAodGhpcy5fcmVjb25uZWN0VGltZXIpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9yZWNvbm5lY3RUaW1lcik7XG4gICAgICB0aGlzLl9yZWNvbm5lY3RUaW1lciA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgc2VuZChkYXRhOiBhbnkpOiB2b2lkIHtcbiAgICAvLyBXcmFwIHRoZSBkYXRhIGluIGFuIG9iamVjdCwgYmVjYXVzZSBpZiBgZGF0YWAgaXMgYSBwcmltaXRpdmUgZGF0YSB0eXBlLFxuICAgIC8vIGZpbmRpbmcgaXQgaW4gYW4gYXJyYXkgd291bGQgcmV0dXJuIHRoZSBmaXJzdCBtYXRjaGluZyBpdGVtLCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgaW5zZXJ0ZWQgaXRlbS5cbiAgICB2YXIgbWVzc2FnZSA9IHtkYXRhfTtcbiAgICB0aGlzLl9jYWNoZWRNZXNzYWdlcy5wdXNoKG1lc3NhZ2UpO1xuICAgIGlmICghdGhpcy5fY29ubmVjdGVkIHx8ICF0aGlzLl93ZWJzb2NrZXQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fd2Vic29ja2V0LnNlbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSksIChlcnIpID0+IHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgbG9nZ2VyLndhcm4oJ1dlYlNvY2tldCBlcnJvciwgYnV0IGNhY2hpbmcgdGhlIG1lc3NhZ2U6JywgZXJyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBtZXNzYWdlSW5kZXggPSB0aGlzLl9jYWNoZWRNZXNzYWdlcy5pbmRleE9mKG1lc3NhZ2UpO1xuICAgICAgICBpZiAobWVzc2FnZUluZGV4ICE9PSAtMSkge1xuICAgICAgICAgIHRoaXMuX2NhY2hlZE1lc3NhZ2VzLnNwbGljZShtZXNzYWdlSW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyB4aHJSZXF1ZXN0KG9wdGlvbnM6IGFueSk6IFByb21pc2U8c3RyaW5nfGFueT4ge1xuICAgIHZhciB7Y2VydGlmaWNhdGVBdXRob3JpdHlDZXJ0aWZpY2F0ZSwgY2xpZW50S2V5LCBjbGllbnRDZXJ0aWZpY2F0ZX0gPSB0aGlzLl9vcHRpb25zO1xuICAgIGlmIChjZXJ0aWZpY2F0ZUF1dGhvcml0eUNlcnRpZmljYXRlICYmIGNsaWVudEtleSAmJiBjbGllbnRDZXJ0aWZpY2F0ZSkge1xuICAgICAgb3B0aW9ucy5hZ2VudE9wdGlvbnMgPSB7XG4gICAgICAgIGNhOiBjZXJ0aWZpY2F0ZUF1dGhvcml0eUNlcnRpZmljYXRlLFxuICAgICAgICBrZXk6IGNsaWVudEtleSxcbiAgICAgICAgY2VydDogY2xpZW50Q2VydGlmaWNhdGUsXG4gICAgICB9O1xuICAgIH1cblxuICAgIG9wdGlvbnMudXJpID0gdGhpcy5fc2VydmVyVXJpICsgJy8nICsgb3B0aW9ucy51cmk7XG4gICAgdmFyIHtib2R5fSA9IGF3YWl0IGFzeW5jUmVxdWVzdChvcHRpb25zKTtcbiAgICByZXR1cm4gYm9keTtcbiAgfVxuXG4gIF9tb25pdG9yU2VydmVySGVhcnRiZWF0KCk6IHZvaWQge1xuICAgIHRoaXMuX2hlYXJ0YmVhdCgpO1xuICAgIHRoaXMuX2hlYXJ0YmVhdEludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4gdGhpcy5faGVhcnRiZWF0KCksIEhFQVJUQkVBVF9JTlRFUlZBTF9NUyk7XG4gIH1cblxuICBhc3luYyBfaGVhcnRiZWF0KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLnhoclJlcXVlc3Qoe1xuICAgICAgICB1cmk6ICdzZXJ2ZXIvdmVyc2lvbicsXG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgfSk7XG4gICAgICB0aGlzLl9oZWFydGJlYXRDb25uZWN0ZWRPbmNlID0gdHJ1ZTtcbiAgICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgdGhpcy5fbGFzdEhlYXJ0YmVhdFRpbWUgPSB0aGlzLl9sYXN0SGVhcnRiZWF0VGltZSB8fCBub3c7XG4gICAgICBpZiAodGhpcy5fbGFzdEhlYXJ0YmVhdCA9PT0gJ2F3YXknXG4gICAgICAgICAgfHwgKChub3cgLSB0aGlzLl9sYXN0SGVhcnRiZWF0VGltZSkgPiBNQVhfSEVBUlRCRUFUX0FXQVlfUkVDT05ORUNUX01TKSkge1xuICAgICAgICAvLyBUcmlnZ2VyIGEgd2Vic29ja2V0IHJlY29ubmVjdC5cbiAgICAgICAgdGhpcy5fY2xlYW5XZWJTb2NrZXQoKTtcbiAgICAgICAgdGhpcy5fc2NoZWR1bGVSZWNvbm5lY3QoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX2xhc3RIZWFydGJlYXQgID0gJ2hlcmUnO1xuICAgICAgdGhpcy5fbGFzdEhlYXJ0YmVhdFRpbWUgPSBub3c7XG4gICAgICB0aGlzLmVtaXQoJ2hlYXJ0YmVhdCcpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgdGhpcy5fY29ubmVjdGVkID0gZmFsc2U7XG4gICAgICB0aGlzLl9sYXN0SGVhcnRiZWF0ICA9ICdhd2F5JztcbiAgICAgIC8vIEVycm9yIGNvZGUgY291bGQgY291bGQgYmUgb25lIG9mOlxuICAgICAgLy8gWydFTk9URk9VTkQnLCAnRUNPTk5SRUZVU0VEJywgJ0VDT05OUkVTRVQnLCAnRVRJTUVET1VUJ11cbiAgICAgIC8vIEEgaGV1cmlzdGljIG1hcHBpbmcgaXMgZG9uZSBiZXR3ZWVuIHRoZSB4aHIgZXJyb3IgY29kZSB0byB0aGUgc3RhdGUgb2Ygc2VydmVyIGNvbm5lY3Rpb24uXG4gICAgICB2YXIge2NvZGU6IG9yaWdpbmFsQ29kZSwgbWVzc2FnZX0gPSBlcnI7XG4gICAgICB2YXIgY29kZSA9IG51bGw7XG4gICAgICBzd2l0Y2ggKG9yaWdpbmFsQ29kZSkge1xuICAgICAgICBjYXNlICdFTk9URk9VTkQnOlxuICAgICAgICAvLyBBIHNvY2tldCBvcGVyYXRpb24gZmFpbGVkIGJlY2F1c2UgdGhlIG5ldHdvcmsgd2FzIGRvd24uXG4gICAgICAgIGNhc2UgJ0VORVRET1dOJzpcbiAgICAgICAgLy8gVGhlIHJhbmdlIG9mIHRoZSB0ZW1wb3JhcnkgcG9ydHMgZm9yIGNvbm5lY3Rpb24gYXJlIGFsbCB0YWtlbixcbiAgICAgICAgLy8gVGhpcyBpcyB0ZW1wb3JhbCB3aXRoIG1hbnkgaHR0cCByZXF1ZXN0cywgYnV0IHNob3VsZCBiZSBjb3VudGVkIGFzIGEgbmV0d29yayBhd2F5IGV2ZW50LlxuICAgICAgICBjYXNlICdFQUREUk5PVEFWQUlMJzpcbiAgICAgICAgLy8gVGhlIGhvc3Qgc2VydmVyIGlzIHVucmVhY2hhYmxlLCBjb3VsZCBiZSBpbiBhIFZQTi5cbiAgICAgICAgY2FzZSAnRUhPU1RVTlJFQUNIJzpcbiAgICAgICAgLy8gQSByZXF1ZXN0IHRpbWVvdXQgaXMgY29uc2lkZXJlZCBhIG5ldHdvcmsgYXdheSBldmVudC5cbiAgICAgICAgY2FzZSAnRVRJTUVET1VUJzpcbiAgICAgICAgICBjb2RlID0gJ05FVFdPUktfQVdBWSc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ0VDT05OUkVGVVNFRCc6XG4gICAgICAgICAgLy8gU2VydmVyIHNodXQgZG93biBvciBwb3J0IG5vIGxvbmdlciBhY2Nlc3NpYmxlLlxuICAgICAgICAgIGlmICh0aGlzLl9oZWFydGJlYXRDb25uZWN0ZWRPbmNlKSB7XG4gICAgICAgICAgICBjb2RlID0gJ1NFUlZFUl9DUkFTSEVEJztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29kZSA9ICdQT1JUX05PVF9BQ0NFU1NJQkxFJztcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ0VDT05OUkVTRVQnOlxuICAgICAgICAgIGNvZGUgPSAnSU5WQUxJRF9DRVJUSUZJQ0FURSc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgY29kZSA9IG9yaWdpbmFsQ29kZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHRoaXMuZW1pdCgnaGVhcnRiZWF0LmVycm9yJywge2NvZGUsIG9yaWdpbmFsQ29kZSwgbWVzc2FnZX0pO1xuICAgIH1cbiAgfVxuXG4gIGdldFNlcnZlclVyaSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLl9zZXJ2ZXJVcmk7XG4gIH1cblxuICBjbG9zZSgpIHtcbiAgICB0aGlzLl9jbG9zZWQgPSB0cnVlO1xuICAgIGlmICh0aGlzLl9jb25uZWN0ZWQpIHtcbiAgICAgIHRoaXMuX2Nvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgdGhpcy5lbWl0KCdkaXNjb25uZWN0Jyk7XG4gICAgfVxuICAgIGlmICh0aGlzLl9yZWNvbm5lY3RUaW1lcikge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3JlY29ubmVjdFRpbWVyKTtcbiAgICB9XG4gICAgdGhpcy5fY2xlYW5XZWJTb2NrZXQoKTtcbiAgICB0aGlzLl9jYWNoZWRNZXNzYWdlcyA9IFtdO1xuICAgIHRoaXMuX3JlY29ubmVjdFRpbWUgPSBJTklUSUFMX1JFQ09OTkVDVF9USU1FX01TO1xuICAgIGNsZWFySW50ZXJ2YWwodGhpcy5faGVhcnRiZWF0SW50ZXJ2YWwpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTnVjbGlkZVNvY2tldDtcbiJdfQ==