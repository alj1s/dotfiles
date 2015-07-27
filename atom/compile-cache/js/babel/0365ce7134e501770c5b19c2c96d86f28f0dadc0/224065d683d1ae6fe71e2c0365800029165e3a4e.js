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

var _require = require('event-kit');

var Disposable = _require.Disposable;

var _require2 = require('./service-manager');

var getRemoteEventName = _require2.getRemoteEventName;

var _require3 = require('./utils');

var serializeArgs = _require3.serializeArgs;

var _require4 = require('events');

var EventEmitter = _require4.EventEmitter;

var NuclideSocket = require('./NuclideSocket');
var extend = require('util')._extend;

var _require5 = require('./config');

var SERVICE_FRAMEWORK_EVENT_CHANNEL = _require5.SERVICE_FRAMEWORK_EVENT_CHANNEL;
var SERVICE_FRAMEWORK_RPC_CHANNEL = _require5.SERVICE_FRAMEWORK_RPC_CHANNEL;
var SERVICE_FRAMEWORK_RPC_TIMEOUT_MS = _require5.SERVICE_FRAMEWORK_RPC_TIMEOUT_MS;

var logger = require('nuclide-logging').getLogger();

var NuclideRemoteEventbus = (function () {
  function NuclideRemoteEventbus(serverUri) {
    var _this = this;

    var options = arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, NuclideRemoteEventbus);

    this.socket = new NuclideSocket(serverUri, options);
    this.socket.on('message', function (message) {
      return _this._handleSocketMessage(message);
    });
    this.eventbus = new EventEmitter();
    this.serviceFrameworkEventEmitter = new EventEmitter();
    this._rpcRequestId = 1;
    this._serviceFrameworkRpcEmitter = new EventEmitter();
    this._eventEmitters = {};
  }

  _createClass(NuclideRemoteEventbus, [{
    key: '_handleSocketMessage',
    value: function _handleSocketMessage(message) {
      var channel = message.channel;
      var event = message.event;

      if (channel === SERVICE_FRAMEWORK_RPC_CHANNEL) {
        var requestId = message.requestId;
        var error = message.error;
        var result = message.result;

        this._serviceFrameworkRpcEmitter.emit(requestId.toString(), error, result);
        return;
      }

      if (channel === SERVICE_FRAMEWORK_EVENT_CHANNEL) {
        this.serviceFrameworkEventEmitter.emit.apply(this.serviceFrameworkEventEmitter, [event.name].concat(event.args));
        return;
      }

      if (event && event.eventEmitterId) {
        var eventEmitterId = event.eventEmitterId;
        var type = event.type;
        var args = event.args;

        var eventEmitter = this._eventEmitters[eventEmitterId];
        if (!eventEmitter) {
          return logger.error('eventEmitter not found: %d', eventEmitterId, type, args);
        }
        eventEmitter.emit.apply(eventEmitter, [type].concat(args));
      }
      this.eventbus.emit(channel, event);
    }
  }, {
    key: '_subscribeEventOnServer',
    value: function _subscribeEventOnServer(serviceName, methodName, serviceOptions) {
      return this.callServiceFrameworkMethod('serviceFramework', 'subscribeEvent',
      /*methodArgs*/[this.socket.id, serviceName, methodName], serviceOptions);
    }
  }, {
    key: '_unsubscribeEventFromServer',
    value: function _unsubscribeEventFromServer(serviceName, methodName, serviceOptions) {
      return this.callServiceFrameworkMethod('serviceFramework', 'unsubscribeEvent',
      /*methodArgs*/[this.socket.id, serviceName, methodName], serviceOptions);
    }
  }, {
    key: 'registerEventListener',
    value: function registerEventListener(localEventName, callback, serviceOptions) {
      var _this2 = this;

      var _localEventName$split = localEventName.split('/');

      var _localEventName$split2 = _slicedToArray(_localEventName$split, 2);

      var serviceName = _localEventName$split2[0];
      var eventMethodName = _localEventName$split2[1];

      var remoteEventName = getRemoteEventName(serviceName, eventMethodName, serviceOptions);
      this.serviceFrameworkEventEmitter.on(remoteEventName, callback);
      var subscribePromise = this._subscribeEventOnServer(serviceName, eventMethodName, serviceOptions);
      return new Disposable(function () {
        _this2.serviceFrameworkEventEmitter.removeListener(remoteEventName, callback);
        return subscribePromise.then(function () {
          return _this2._unsubscribeEventFromServer(serviceName, eventMethodName, serviceOptions);
        });
      });
    }
  }, {
    key: 'callMethod',
    value: _asyncToGenerator(function* (serviceName, methodName, methodArgs, extraOptions) {
      var _serializeArgs = serializeArgs(methodArgs || []);

      var args = _serializeArgs.args;
      var argTypes = _serializeArgs.argTypes;

      try {
        return yield this.socket.xhrRequest(extend({
          uri: serviceName + '/' + methodName,
          qs: {
            args: args,
            argTypes: argTypes
          },
          method: 'GET' }, extraOptions || {}));
      } catch (err) {
        logger.error(err);
        throw err;
      }
    })
  }, {
    key: 'callServiceFrameworkMethod',
    value: _asyncToGenerator(function* (serviceName, methodName, methodArgs, serviceOptions) {
      var _this3 = this;

      var timeout = arguments[4] === undefined ? SERVICE_FRAMEWORK_RPC_TIMEOUT_MS : arguments[4];

      var requestId = this._rpcRequestId++;

      this.socket.send({
        serviceName: serviceName,
        methodName: methodName,
        methodArgs: methodArgs,
        serviceOptions: serviceOptions,
        requestId: requestId
      });

      return new Promise(function (resolve, reject) {
        _this3._serviceFrameworkRpcEmitter.once(requestId.toString(), function (error, result) {
          error ? reject(error) : resolve(result);
        });

        setTimeout(function () {
          _this3._serviceFrameworkRpcEmitter.removeAllListeners(requestId);
          reject('Timeout after ' + timeout + ' for ' + serviceName + '/' + methodName);
        }, timeout);
      });
    })
  }, {
    key: 'subscribeToChannel',
    value: _asyncToGenerator(function* (channel, handler) {
      var _this4 = this;

      yield this._callSubscribe(channel);
      this.eventbus.on(channel, handler);
      return {
        dispose: function dispose() {
          return _this4.removeListener(channel, handler);
        }
      };
    })
  }, {
    key: '_callSubscribe',
    value: _asyncToGenerator(function* (channel) {
      var options = arguments[1] === undefined ? {} : arguments[1];

      // Wait for the client to connect, for the server to find a medium to send the events to.
      yield this.socket.waitForConnect();
      yield this.callMethod(
      /*serviceName*/'eventbus',
      /*methodName*/'subscribe',
      /*methodArgs*/[this.socket.id, channel, options],
      /*extraOptions*/{ method: 'POST', json: true });
    })
  }, {
    key: 'consumeStream',
    value: function consumeStream(streamId) {
      var streamEvents = ['data', 'error', 'close', 'end'];
      return this.consumeEventEmitter(streamId, streamEvents, ['end']);
    }
  }, {
    key: 'consumeEventEmitter',

    /**
     * Subscribe to an event emitter or stream of events happening on the server.
     * Will mainly be used for consumption by streaming services:
     * e.g. like process tailing and watcher service.
     */
    value: _asyncToGenerator(function* (eventEmitterId, eventNames, disposeEventNames) {
      var _this5 = this;

      var eventEmitter = new EventEmitter();
      this._eventEmitters[eventEmitterId] = eventEmitter;
      (disposeEventNames || []).forEach(function (disposeEventName) {
        return eventEmitter.once(disposeEventName, function () {
          return delete _this5._eventEmitters[eventEmitterId];
        });
      });

      yield this._callSubscribe(eventEmitterChannel(eventEmitterId), {
        eventEmitterId: eventEmitterId,
        eventNames: eventNames
      });
      return eventEmitter;
    })
  }, {
    key: 'close',
    value: function close() {
      this.socket.close();
    }
  }]);

  return NuclideRemoteEventbus;
})();

function eventEmitterChannel(id) {
  return 'event_emitter/' + id;
}

module.exports = NuclideRemoteEventbus;
// default request method is 'GET'.
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9ub2RlX21vZHVsZXMvbnVjbGlkZS1yZW1vdGUtY29ubmVjdGlvbi9ub2RlX21vZHVsZXMvbnVjbGlkZS1zZXJ2ZXIvbGliL051Y2xpZGVSZW1vdGVFdmVudGJ1cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2VBV08sT0FBTyxDQUFDLFdBQVcsQ0FBQzs7SUFBbEMsVUFBVSxZQUFWLFVBQVU7O2dCQUNZLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQzs7SUFBbEQsa0JBQWtCLGFBQWxCLGtCQUFrQjs7Z0JBQ0QsT0FBTyxDQUFDLFNBQVMsQ0FBQzs7SUFBbkMsYUFBYSxhQUFiLGFBQWE7O2dCQUNHLE9BQU8sQ0FBQyxRQUFRLENBQUM7O0lBQWpDLFlBQVksYUFBWixZQUFZOztBQUNqQixJQUFJLGFBQWEsR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUMvQyxJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDOztnQkFHQyxPQUFPLENBQUMsVUFBVSxDQUFDOztJQUZwRCwrQkFBK0IsYUFBL0IsK0JBQStCO0lBQ2xDLDZCQUE2QixhQUE3Qiw2QkFBNkI7SUFDN0IsZ0NBQWdDLGFBQWhDLGdDQUFnQzs7QUFDbEMsSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7O0lBUTlDLHFCQUFxQjtBQUNkLFdBRFAscUJBQXFCLENBQ2IsU0FBaUIsRUFBK0M7OztRQUE3QyxPQUFzQyxnQ0FBRyxFQUFFOzswQkFEdEUscUJBQXFCOztBQUV2QixRQUFJLENBQUMsTUFBTSxHQUFHLElBQUksYUFBYSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztBQUNwRCxRQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsVUFBQyxPQUFPO2FBQUssTUFBSyxvQkFBb0IsQ0FBQyxPQUFPLENBQUM7S0FBQSxDQUFDLENBQUM7QUFDM0UsUUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLFlBQVksRUFBRSxDQUFDO0FBQ25DLFFBQUksQ0FBQyw0QkFBNEIsR0FBRyxJQUFJLFlBQVksRUFBRSxDQUFDO0FBQ3ZELFFBQUksQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZCLFFBQUksQ0FBQywyQkFBMkIsR0FBRyxJQUFJLFlBQVksRUFBRSxDQUFDO0FBQ3RELFFBQUksQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDO0dBQzFCOztlQVRHLHFCQUFxQjs7V0FXTCw4QkFBQyxPQUFZLEVBQUU7VUFDNUIsT0FBTyxHQUFXLE9BQU8sQ0FBekIsT0FBTztVQUFFLEtBQUssR0FBSSxPQUFPLENBQWhCLEtBQUs7O0FBRW5CLFVBQUksT0FBTyxLQUFLLDZCQUE2QixFQUFFO1lBQ3hDLFNBQVMsR0FBbUIsT0FBTyxDQUFuQyxTQUFTO1lBQUUsS0FBSyxHQUFZLE9BQU8sQ0FBeEIsS0FBSztZQUFFLE1BQU0sR0FBSSxPQUFPLENBQWpCLE1BQU07O0FBQzdCLFlBQUksQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztBQUMzRSxlQUFPO09BQ1I7O0FBRUQsVUFBSSxPQUFPLEtBQUssK0JBQStCLEVBQUU7QUFDL0MsWUFBSSxDQUFDLDRCQUE0QixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLDRCQUE0QixFQUMxRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDckMsZUFBTztPQUNSOztBQUVELFVBQUksS0FBSyxJQUFJLEtBQUssQ0FBQyxjQUFjLEVBQUU7WUFDNUIsY0FBYyxHQUFnQixLQUFLLENBQW5DLGNBQWM7WUFBRSxJQUFJLEdBQVUsS0FBSyxDQUFuQixJQUFJO1lBQUUsSUFBSSxHQUFJLEtBQUssQ0FBYixJQUFJOztBQUMvQixZQUFJLFlBQVksR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3ZELFlBQUksQ0FBQyxZQUFZLEVBQUU7QUFDakIsaUJBQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyw0QkFBNEIsRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQy9FO0FBQ0Qsb0JBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO09BQzVEO0FBQ0QsVUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ3BDOzs7V0FFc0IsaUNBQUMsV0FBbUIsRUFBRSxVQUFrQixFQUFFLGNBQW1CLEVBQVc7QUFDN0YsYUFBTyxJQUFJLENBQUMsMEJBQTBCLENBQ3BDLGtCQUFrQixFQUNsQixnQkFBZ0I7b0JBQ0QsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxXQUFXLEVBQUUsVUFBVSxDQUFDLEVBQ3hELGNBQWMsQ0FDaEIsQ0FBQztLQUNGOzs7V0FFMEIscUNBQUMsV0FBbUIsRUFBRSxVQUFrQixFQUFFLGNBQW1CLEVBQVc7QUFDakcsYUFBTyxJQUFJLENBQUMsMEJBQTBCLENBQ3BDLGtCQUFrQixFQUNsQixrQkFBa0I7b0JBQ0gsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxXQUFXLEVBQUUsVUFBVSxDQUFDLEVBQ3hELGNBQWMsQ0FDaEIsQ0FBQztLQUNGOzs7V0FFb0IsK0JBQ25CLGNBQXNCLEVBQ3RCLFFBQXVDLEVBQ3ZDLGNBQW1CLEVBQ1A7OztrQ0FDeUIsY0FBYyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7Ozs7VUFBekQsV0FBVztVQUFFLGVBQWU7O0FBQ2pDLFVBQUksZUFBZSxHQUFHLGtCQUFrQixDQUFDLFdBQVcsRUFBRSxlQUFlLEVBQUUsY0FBYyxDQUFDLENBQUM7QUFDdkYsVUFBSSxDQUFDLDRCQUE0QixDQUFDLEVBQUUsQ0FBQyxlQUFlLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDaEUsVUFBSSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUMsV0FBVyxFQUFFLGVBQWUsRUFBRSxjQUFjLENBQUMsQ0FBQztBQUNsRyxhQUFPLElBQUksVUFBVSxDQUFDLFlBQU07QUFDMUIsZUFBSyw0QkFBNEIsQ0FBQyxjQUFjLENBQUMsZUFBZSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQzVFLGVBQU8sZ0JBQWdCLENBQUMsSUFBSSxDQUN4QjtpQkFBTSxPQUFLLDJCQUEyQixDQUFDLFdBQVcsRUFBRSxlQUFlLEVBQUUsY0FBYyxDQUFDO1NBQUEsQ0FBQyxDQUFDO09BQzNGLENBQUMsQ0FBQztLQUNKOzs7NkJBRWUsV0FDWixXQUFtQixFQUNuQixVQUFrQixFQUNsQixVQUF1QixFQUN2QixZQUFrQixFQUNHOzJCQUNBLGFBQWEsQ0FBQyxVQUFVLElBQUksRUFBRSxDQUFDOztVQUFqRCxJQUFJLGtCQUFKLElBQUk7VUFBRSxRQUFRLGtCQUFSLFFBQVE7O0FBQ25CLFVBQUk7QUFDRixlQUFPLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDO0FBQ3pDLGFBQUcsRUFBRSxXQUFXLEdBQUcsR0FBRyxHQUFHLFVBQVU7QUFDbkMsWUFBRSxFQUFFO0FBQ0YsZ0JBQUksRUFBSixJQUFJO0FBQ0osb0JBQVEsRUFBUixRQUFRO1dBQ1Q7QUFDRCxnQkFBTSxFQUFFLEtBQUssRUFDZCxFQUFFLFlBQVksSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO09BQ3pCLENBQUMsT0FBTyxHQUFHLEVBQUU7QUFDWixjQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2xCLGNBQU0sR0FBRyxDQUFDO09BQ1g7S0FDRjs7OzZCQUUrQixXQUM1QixXQUFtQixFQUNuQixVQUFrQixFQUNsQixVQUFzQixFQUN0QixjQUFtQixFQUVFOzs7VUFEckIsT0FBTyxnQ0FBQyxnQ0FBZ0M7O0FBRzFDLFVBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUcsQ0FBQzs7QUFFdEMsVUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7QUFDZixtQkFBVyxFQUFYLFdBQVc7QUFDWCxrQkFBVSxFQUFWLFVBQVU7QUFDVixrQkFBVSxFQUFWLFVBQVU7QUFDVixzQkFBYyxFQUFkLGNBQWM7QUFDZCxpQkFBUyxFQUFULFNBQVM7T0FDVixDQUFDLENBQUM7O0FBRUgsYUFBTyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUs7QUFDdEMsZUFBSywyQkFBMkIsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxFQUFFLFVBQUMsS0FBSyxFQUFFLE1BQU0sRUFBSztBQUM3RSxlQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUN6QyxDQUFDLENBQUM7O0FBRUgsa0JBQVUsQ0FBQyxZQUFNO0FBQ2YsaUJBQUssMkJBQTJCLENBQUMsa0JBQWtCLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDL0QsZ0JBQU0sb0JBQWtCLE9BQU8sYUFBUSxXQUFXLFNBQUksVUFBVSxDQUFHLENBQUM7U0FDckUsRUFBRSxPQUFPLENBQUMsQ0FBQztPQUNiLENBQUMsQ0FBQztLQUNKOzs7NkJBRXVCLFdBQUMsT0FBZSxFQUFFLE9BQThCLEVBQXVCOzs7QUFDN0YsWUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ25DLFVBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztBQUNuQyxhQUFPO0FBQ0wsZUFBTyxFQUFFO2lCQUFNLE9BQUssY0FBYyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUM7U0FBQTtPQUNyRCxDQUFDO0tBQ0g7Ozs2QkFFbUIsV0FBQyxPQUFlLEVBQStCO1VBQTdCLE9BQWEsZ0NBQUcsRUFBRTs7O0FBRXRELFlBQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUNuQyxZQUFNLElBQUksQ0FBQyxVQUFVO3FCQUNILFVBQVU7b0JBQ1gsV0FBVztvQkFDWCxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUM7c0JBQ2hDLEVBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDLENBQzlDLENBQUM7S0FDSDs7O1dBRVksdUJBQUMsUUFBZ0IsRUFBbUI7QUFDL0MsVUFBSSxZQUFZLEdBQUcsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNyRCxhQUFPLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLEVBQUUsWUFBWSxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztLQUNsRTs7Ozs7Ozs7OzZCQU93QixXQUNyQixjQUFzQixFQUN0QixVQUF5QixFQUN6QixpQkFBaUMsRUFDVjs7O0FBRXpCLFVBQUksWUFBWSxHQUFHLElBQUksWUFBWSxFQUFFLENBQUM7QUFDdEMsVUFBSSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsR0FBRyxZQUFZLENBQUM7QUFDbkQsT0FBQyxpQkFBaUIsSUFBSSxFQUFFLENBQUEsQ0FBRSxPQUFPLENBQUMsVUFBQyxnQkFBZ0I7ZUFDakQsWUFBWSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRTtpQkFBTyxPQUFPLE9BQUssY0FBYyxDQUFDLGNBQWMsQ0FBQztTQUFBLENBQUM7T0FBQSxDQUN2RixDQUFDOztBQUVGLFlBQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxtQkFBbUIsQ0FBQyxjQUFjLENBQUMsRUFBRTtBQUM3RCxzQkFBYyxFQUFkLGNBQWM7QUFDZCxrQkFBVSxFQUFWLFVBQVU7T0FDWCxDQUFDLENBQUM7QUFDSCxhQUFPLFlBQVksQ0FBQztLQUNyQjs7O1dBRUksaUJBQVM7QUFDWixVQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO0tBQ3JCOzs7U0E3S0cscUJBQXFCOzs7QUFnTDNCLFNBQVMsbUJBQW1CLENBQUMsRUFBVSxFQUFFO0FBQ3ZDLFNBQU8sZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO0NBQzlCOztBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUcscUJBQXFCLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL251Y2xpZGUtcmVtb3RlLXByb2plY3RzL25vZGVfbW9kdWxlcy9udWNsaWRlLXJlbW90ZS1jb25uZWN0aW9uL25vZGVfbW9kdWxlcy9udWNsaWRlLXNlcnZlci9saWIvTnVjbGlkZVJlbW90ZUV2ZW50YnVzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxudmFyIHtEaXNwb3NhYmxlfSA9IHJlcXVpcmUoJ2V2ZW50LWtpdCcpO1xudmFyIHtnZXRSZW1vdGVFdmVudE5hbWV9ID0gcmVxdWlyZSgnLi9zZXJ2aWNlLW1hbmFnZXInKTtcbnZhciB7c2VyaWFsaXplQXJnc30gPSByZXF1aXJlKCcuL3V0aWxzJyk7XG52YXIge0V2ZW50RW1pdHRlcn0gPSByZXF1aXJlKCdldmVudHMnKTtcbnZhciBOdWNsaWRlU29ja2V0ID0gcmVxdWlyZSgnLi9OdWNsaWRlU29ja2V0Jyk7XG52YXIgZXh0ZW5kID0gcmVxdWlyZSgndXRpbCcpLl9leHRlbmQ7XG52YXIge1NFUlZJQ0VfRlJBTUVXT1JLX0VWRU5UX0NIQU5ORUwsXG4gIFNFUlZJQ0VfRlJBTUVXT1JLX1JQQ19DSEFOTkVMLFxuICBTRVJWSUNFX0ZSQU1FV09SS19SUENfVElNRU9VVF9NU30gPSByZXF1aXJlKCcuL2NvbmZpZycpO1xudmFyIGxvZ2dlciA9IHJlcXVpcmUoJ251Y2xpZGUtbG9nZ2luZycpLmdldExvZ2dlcigpO1xuXG50eXBlIE51Y2xpZGVSZW1vdGVFdmVudGJ1c09wdGlvbnMgPSB7XG4gIGNlcnRpZmljYXRlQXV0aG9yaXR5Q2VydGlmaWNhdGU6ID9CdWZmZXI7XG4gIGNsaWVudENlcnRpZmljYXRlOiA/QnVmZmVyO1xuICBjbGllbnRLZXk6ID9CdWZmZXI7XG59O1xuXG5jbGFzcyBOdWNsaWRlUmVtb3RlRXZlbnRidXMge1xuICBjb25zdHJ1Y3RvcihzZXJ2ZXJVcmk6IHN0cmluZywgb3B0aW9uczogP051Y2xpZGVSZW1vdGVFdmVudGJ1c09wdGlvbnMgPSB7fSkge1xuICAgIHRoaXMuc29ja2V0ID0gbmV3IE51Y2xpZGVTb2NrZXQoc2VydmVyVXJpLCBvcHRpb25zKTtcbiAgICB0aGlzLnNvY2tldC5vbignbWVzc2FnZScsIChtZXNzYWdlKSA9PiB0aGlzLl9oYW5kbGVTb2NrZXRNZXNzYWdlKG1lc3NhZ2UpKTtcbiAgICB0aGlzLmV2ZW50YnVzID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICAgIHRoaXMuc2VydmljZUZyYW1ld29ya0V2ZW50RW1pdHRlciA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgICB0aGlzLl9ycGNSZXF1ZXN0SWQgPSAxO1xuICAgIHRoaXMuX3NlcnZpY2VGcmFtZXdvcmtScGNFbWl0dGVyID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICAgIHRoaXMuX2V2ZW50RW1pdHRlcnMgPSB7fTtcbiAgfVxuXG4gIF9oYW5kbGVTb2NrZXRNZXNzYWdlKG1lc3NhZ2U6IGFueSkge1xuICAgIHZhciB7Y2hhbm5lbCwgZXZlbnR9ID0gbWVzc2FnZTtcblxuICAgIGlmIChjaGFubmVsID09PSBTRVJWSUNFX0ZSQU1FV09SS19SUENfQ0hBTk5FTCkge1xuICAgICAgdmFyIHtyZXF1ZXN0SWQsIGVycm9yLCByZXN1bHR9ID0gbWVzc2FnZTtcbiAgICAgIHRoaXMuX3NlcnZpY2VGcmFtZXdvcmtScGNFbWl0dGVyLmVtaXQocmVxdWVzdElkLnRvU3RyaW5nKCksIGVycm9yLCByZXN1bHQpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChjaGFubmVsID09PSBTRVJWSUNFX0ZSQU1FV09SS19FVkVOVF9DSEFOTkVMKSB7XG4gICAgICB0aGlzLnNlcnZpY2VGcmFtZXdvcmtFdmVudEVtaXR0ZXIuZW1pdC5hcHBseSh0aGlzLnNlcnZpY2VGcmFtZXdvcmtFdmVudEVtaXR0ZXIsXG4gICAgICAgICAgW2V2ZW50Lm5hbWVdLmNvbmNhdChldmVudC5hcmdzKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGV2ZW50ICYmIGV2ZW50LmV2ZW50RW1pdHRlcklkKSB7XG4gICAgICB2YXIge2V2ZW50RW1pdHRlcklkLCB0eXBlLCBhcmdzfSA9IGV2ZW50O1xuICAgICAgdmFyIGV2ZW50RW1pdHRlciA9IHRoaXMuX2V2ZW50RW1pdHRlcnNbZXZlbnRFbWl0dGVySWRdO1xuICAgICAgaWYgKCFldmVudEVtaXR0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGxvZ2dlci5lcnJvcignZXZlbnRFbWl0dGVyIG5vdCBmb3VuZDogJWQnLCBldmVudEVtaXR0ZXJJZCwgdHlwZSwgYXJncyk7XG4gICAgICB9XG4gICAgICBldmVudEVtaXR0ZXIuZW1pdC5hcHBseShldmVudEVtaXR0ZXIsIFt0eXBlXS5jb25jYXQoYXJncykpO1xuICAgIH1cbiAgICB0aGlzLmV2ZW50YnVzLmVtaXQoY2hhbm5lbCwgZXZlbnQpO1xuICB9XG5cbiAgX3N1YnNjcmliZUV2ZW50T25TZXJ2ZXIoc2VydmljZU5hbWU6IHN0cmluZywgbWV0aG9kTmFtZTogc3RyaW5nLCBzZXJ2aWNlT3B0aW9uczogYW55KTogUHJvbWlzZSB7XG4gICAgcmV0dXJuIHRoaXMuY2FsbFNlcnZpY2VGcmFtZXdvcmtNZXRob2QoXG4gICAgICAnc2VydmljZUZyYW1ld29yaycsXG4gICAgICAnc3Vic2NyaWJlRXZlbnQnLFxuICAgICAgLyptZXRob2RBcmdzKi8gW3RoaXMuc29ja2V0LmlkLCBzZXJ2aWNlTmFtZSwgbWV0aG9kTmFtZV0sXG4gICAgICBzZXJ2aWNlT3B0aW9uc1xuICAgKTtcbiAgfVxuXG4gIF91bnN1YnNjcmliZUV2ZW50RnJvbVNlcnZlcihzZXJ2aWNlTmFtZTogc3RyaW5nLCBtZXRob2ROYW1lOiBzdHJpbmcsIHNlcnZpY2VPcHRpb25zOiBhbnkpOiBQcm9taXNlIHtcbiAgICByZXR1cm4gdGhpcy5jYWxsU2VydmljZUZyYW1ld29ya01ldGhvZChcbiAgICAgICdzZXJ2aWNlRnJhbWV3b3JrJyxcbiAgICAgICd1bnN1YnNjcmliZUV2ZW50JyxcbiAgICAgIC8qbWV0aG9kQXJncyovIFt0aGlzLnNvY2tldC5pZCwgc2VydmljZU5hbWUsIG1ldGhvZE5hbWVdLFxuICAgICAgc2VydmljZU9wdGlvbnNcbiAgICk7XG4gIH1cblxuICByZWdpc3RlckV2ZW50TGlzdGVuZXIoXG4gICAgbG9jYWxFdmVudE5hbWU6IHN0cmluZywgXG4gICAgY2FsbGJhY2s6ICguLi5hcmdzOiBBcnJheTxhbnk+KSA9PiB2b2lkLCBcbiAgICBzZXJ2aWNlT3B0aW9uczogYW55XG4gICk6IERpc3Bvc2FibGUge1xuICAgIHZhciBbc2VydmljZU5hbWUsIGV2ZW50TWV0aG9kTmFtZV0gPSBsb2NhbEV2ZW50TmFtZS5zcGxpdCgnLycpO1xuICAgIHZhciByZW1vdGVFdmVudE5hbWUgPSBnZXRSZW1vdGVFdmVudE5hbWUoc2VydmljZU5hbWUsIGV2ZW50TWV0aG9kTmFtZSwgc2VydmljZU9wdGlvbnMpO1xuICAgIHRoaXMuc2VydmljZUZyYW1ld29ya0V2ZW50RW1pdHRlci5vbihyZW1vdGVFdmVudE5hbWUsIGNhbGxiYWNrKTtcbiAgICB2YXIgc3Vic2NyaWJlUHJvbWlzZSA9IHRoaXMuX3N1YnNjcmliZUV2ZW50T25TZXJ2ZXIoc2VydmljZU5hbWUsIGV2ZW50TWV0aG9kTmFtZSwgc2VydmljZU9wdGlvbnMpO1xuICAgIHJldHVybiBuZXcgRGlzcG9zYWJsZSgoKSA9PiB7XG4gICAgICB0aGlzLnNlcnZpY2VGcmFtZXdvcmtFdmVudEVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIocmVtb3RlRXZlbnROYW1lLCBjYWxsYmFjayk7XG4gICAgICByZXR1cm4gc3Vic2NyaWJlUHJvbWlzZS50aGVuKFxuICAgICAgICAgICgpID0+IHRoaXMuX3Vuc3Vic2NyaWJlRXZlbnRGcm9tU2VydmVyKHNlcnZpY2VOYW1lLCBldmVudE1ldGhvZE5hbWUsIHNlcnZpY2VPcHRpb25zKSk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBjYWxsTWV0aG9kKFxuICAgICAgc2VydmljZU5hbWU6IHN0cmluZyxcbiAgICAgIG1ldGhvZE5hbWU6IHN0cmluZyxcbiAgICAgIG1ldGhvZEFyZ3M6ID9BcnJheTxhbnk+LFxuICAgICAgZXh0cmFPcHRpb25zOiA/YW55XG4gICAgKTogUHJvbWlzZTxzdHJpbmd8YW55PiB7XG4gICAgdmFyIHthcmdzLCBhcmdUeXBlc30gPSBzZXJpYWxpemVBcmdzKG1ldGhvZEFyZ3MgfHwgW10pO1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy5zb2NrZXQueGhyUmVxdWVzdChleHRlbmQoe1xuICAgICAgICB1cmk6IHNlcnZpY2VOYW1lICsgJy8nICsgbWV0aG9kTmFtZSxcbiAgICAgICAgcXM6IHtcbiAgICAgICAgICBhcmdzLFxuICAgICAgICAgIGFyZ1R5cGVzLFxuICAgICAgICB9LFxuICAgICAgICBtZXRob2Q6ICdHRVQnLCAvLyBkZWZhdWx0IHJlcXVlc3QgbWV0aG9kIGlzICdHRVQnLlxuICAgICAgfSwgZXh0cmFPcHRpb25zIHx8IHt9KSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBsb2dnZXIuZXJyb3IoZXJyKTtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gIH1cblxuICBhc3luYyBjYWxsU2VydmljZUZyYW1ld29ya01ldGhvZChcbiAgICAgIHNlcnZpY2VOYW1lOiBzdHJpbmcsXG4gICAgICBtZXRob2ROYW1lOiBzdHJpbmcsXG4gICAgICBtZXRob2RBcmdzOiBBcnJheTxhbnk+LFxuICAgICAgc2VydmljZU9wdGlvbnM6IGFueSxcbiAgICAgIHRpbWVvdXQ9U0VSVklDRV9GUkFNRVdPUktfUlBDX1RJTUVPVVRfTVM6IG51bWJlclxuICAgICk6IFByb21pc2U8c3RyaW5nfGFueT4ge1xuXG4gICAgdmFyIHJlcXVlc3RJZCA9IHRoaXMuX3JwY1JlcXVlc3RJZCArKztcblxuICAgIHRoaXMuc29ja2V0LnNlbmQoe1xuICAgICAgc2VydmljZU5hbWUsXG4gICAgICBtZXRob2ROYW1lLFxuICAgICAgbWV0aG9kQXJncyxcbiAgICAgIHNlcnZpY2VPcHRpb25zLFxuICAgICAgcmVxdWVzdElkLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHRoaXMuX3NlcnZpY2VGcmFtZXdvcmtScGNFbWl0dGVyLm9uY2UocmVxdWVzdElkLnRvU3RyaW5nKCksIChlcnJvciwgcmVzdWx0KSA9PiB7XG4gICAgICAgIGVycm9yID8gcmVqZWN0KGVycm9yKSA6IHJlc29sdmUocmVzdWx0KTtcbiAgICAgIH0pO1xuXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5fc2VydmljZUZyYW1ld29ya1JwY0VtaXR0ZXIucmVtb3ZlQWxsTGlzdGVuZXJzKHJlcXVlc3RJZCk7XG4gICAgICAgIHJlamVjdChgVGltZW91dCBhZnRlciAke3RpbWVvdXR9IGZvciAke3NlcnZpY2VOYW1lfS8ke21ldGhvZE5hbWV9YCk7XG4gICAgICB9LCB0aW1lb3V0KTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIHN1YnNjcmliZVRvQ2hhbm5lbChjaGFubmVsOiBzdHJpbmcsIGhhbmRsZXI6IChldmVudDogP2FueSkgPT4gdm9pZCk6IFByb21pc2U8RGlzcG9zYWJsZT4ge1xuICAgIGF3YWl0IHRoaXMuX2NhbGxTdWJzY3JpYmUoY2hhbm5lbCk7XG4gICAgdGhpcy5ldmVudGJ1cy5vbihjaGFubmVsLCBoYW5kbGVyKTtcbiAgICByZXR1cm4ge1xuICAgICAgZGlzcG9zZTogKCkgPT4gdGhpcy5yZW1vdmVMaXN0ZW5lcihjaGFubmVsLCBoYW5kbGVyKSxcbiAgICB9O1xuICB9XG5cbiAgYXN5bmMgX2NhbGxTdWJzY3JpYmUoY2hhbm5lbDogc3RyaW5nLCBvcHRpb25zOiA/YW55ID0ge30pOiBQcm9taXNlIHtcbiAgICAvLyBXYWl0IGZvciB0aGUgY2xpZW50IHRvIGNvbm5lY3QsIGZvciB0aGUgc2VydmVyIHRvIGZpbmQgYSBtZWRpdW0gdG8gc2VuZCB0aGUgZXZlbnRzIHRvLlxuICAgIGF3YWl0IHRoaXMuc29ja2V0LndhaXRGb3JDb25uZWN0KCk7XG4gICAgYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgLypzZXJ2aWNlTmFtZSovICdldmVudGJ1cycsXG4gICAgICAvKm1ldGhvZE5hbWUqLyAnc3Vic2NyaWJlJyxcbiAgICAgIC8qbWV0aG9kQXJncyovIFt0aGlzLnNvY2tldC5pZCwgY2hhbm5lbCwgb3B0aW9uc10sXG4gICAgICAvKmV4dHJhT3B0aW9ucyovIHttZXRob2Q6ICdQT1NUJywganNvbjogdHJ1ZX1cbiAgICApO1xuICB9XG5cbiAgY29uc3VtZVN0cmVhbShzdHJlYW1JZDogbnVtYmVyKTogUHJvbWlzZTxTdHJlYW0+IHtcbiAgICB2YXIgc3RyZWFtRXZlbnRzID0gWydkYXRhJywgJ2Vycm9yJywgJ2Nsb3NlJywgJ2VuZCddO1xuICAgIHJldHVybiB0aGlzLmNvbnN1bWVFdmVudEVtaXR0ZXIoc3RyZWFtSWQsIHN0cmVhbUV2ZW50cywgWydlbmQnXSk7XG4gIH1cblxuICAvKipcbiAgICogU3Vic2NyaWJlIHRvIGFuIGV2ZW50IGVtaXR0ZXIgb3Igc3RyZWFtIG9mIGV2ZW50cyBoYXBwZW5pbmcgb24gdGhlIHNlcnZlci5cbiAgICogV2lsbCBtYWlubHkgYmUgdXNlZCBmb3IgY29uc3VtcHRpb24gYnkgc3RyZWFtaW5nIHNlcnZpY2VzOlxuICAgKiBlLmcuIGxpa2UgcHJvY2VzcyB0YWlsaW5nIGFuZCB3YXRjaGVyIHNlcnZpY2UuXG4gICAqL1xuICBhc3luYyBjb25zdW1lRXZlbnRFbWl0dGVyKFxuICAgICAgZXZlbnRFbWl0dGVySWQ6IG51bWJlcixcbiAgICAgIGV2ZW50TmFtZXM6IEFycmF5PHN0cmluZz4sXG4gICAgICBkaXNwb3NlRXZlbnROYW1lczogP0FycmF5PHN0cmluZz5cbiAgICApOiBQcm9taXNlPEV2ZW50RW1pdHRlcj4ge1xuXG4gICAgdmFyIGV2ZW50RW1pdHRlciA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgICB0aGlzLl9ldmVudEVtaXR0ZXJzW2V2ZW50RW1pdHRlcklkXSA9IGV2ZW50RW1pdHRlcjtcbiAgICAoZGlzcG9zZUV2ZW50TmFtZXMgfHwgW10pLmZvckVhY2goKGRpc3Bvc2VFdmVudE5hbWUpID0+XG4gICAgICBldmVudEVtaXR0ZXIub25jZShkaXNwb3NlRXZlbnROYW1lLCAoKSA9PiAgZGVsZXRlIHRoaXMuX2V2ZW50RW1pdHRlcnNbZXZlbnRFbWl0dGVySWRdKVxuICAgICk7XG5cbiAgICBhd2FpdCB0aGlzLl9jYWxsU3Vic2NyaWJlKGV2ZW50RW1pdHRlckNoYW5uZWwoZXZlbnRFbWl0dGVySWQpLCB7XG4gICAgICBldmVudEVtaXR0ZXJJZCxcbiAgICAgIGV2ZW50TmFtZXMsXG4gICAgfSk7XG4gICAgcmV0dXJuIGV2ZW50RW1pdHRlcjtcbiAgfVxuXG4gIGNsb3NlKCk6IHZvaWQge1xuICAgIHRoaXMuc29ja2V0LmNsb3NlKCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZXZlbnRFbWl0dGVyQ2hhbm5lbChpZDogbnVtYmVyKSB7XG4gIHJldHVybiAnZXZlbnRfZW1pdHRlci8nICsgaWQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTnVjbGlkZVJlbW90ZUV2ZW50YnVzO1xuIl19