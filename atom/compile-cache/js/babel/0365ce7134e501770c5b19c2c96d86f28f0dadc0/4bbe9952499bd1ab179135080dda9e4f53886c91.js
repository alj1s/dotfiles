'use babel';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
var Dequeue = require('dequeue');

var _require = require('events');

var EventEmitter = _require.EventEmitter;

/**
 * FIFO queue that executes Promise executors one at a time, in order.
 *
 * The executor function passed to the constructor of a Promise is evaluated
 * immediately. This may not always be desirable. Use a PromiseQueue if you have
 * a sequence of async operations that need to use a shared resource serially.
 */
module.exports = (function () {
  function PromiseQueue() {
    _classCallCheck(this, PromiseQueue);

    this._fifo = new Dequeue();
    this._emitter = new EventEmitter();
    this._isRunning = false;
    this._nextRequestId = 1;
  }

  _createClass(PromiseQueue, [{
    key: 'submit',

    /**
     * @param executor A function that takes resolve and reject callbacks, just
     *     like the Promise constructor.
     * @return A Promise that will be resolved/rejected in response to the
     *     execution of the executor.
     */
    value: function submit(executor) {
      var _this = this;

      var id = this._getNextRequestId();
      this._fifo.push({ id: id, executor: executor });
      var promise = new Promise(function (resolve, reject) {
        _this._emitter.once(id, function (result) {
          var isSuccess = result.isSuccess;
          var value = result.value;

          (isSuccess ? resolve : reject)(value);
        });
      });
      this._run();
      return promise;
    }
  }, {
    key: '_run',
    value: function _run() {
      var _this2 = this;

      if (this._isRunning) {
        return;
      }

      if (this._fifo.length === 0) {
        return;
      }

      var _fifo$shift = this._fifo.shift();

      var id = _fifo$shift.id;
      var executor = _fifo$shift.executor;

      this._isRunning = true;
      new Promise(executor).then(function (result) {
        _this2._emitter.emit(id, { isSuccess: true, value: result });
        _this2._isRunning = false;
        _this2._run();
      }, function (error) {
        _this2._emitter.emit(id, { isSuccess: false, value: error });
        _this2._isRunning = false;
        _this2._run();
      });
    }
  }, {
    key: '_getNextRequestId',
    value: function _getNextRequestId() {
      return (this._nextRequestId++).toString(16);
    }
  }]);

  return PromiseQueue;
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWluc3RhbGxlci9ub2RlX21vZHVsZXMvbnVjbGlkZS1pbnN0YWxsZXItYmFzZS9ub2RlX21vZHVsZXMvbnVjbGlkZS1jb21tb25zL2xpYi9Qcm9taXNlUXVldWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7QUFVWixJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7O2VBQ1osT0FBTyxDQUFDLFFBQVEsQ0FBQzs7SUFBakMsWUFBWSxZQUFaLFlBQVk7Ozs7Ozs7OztBQVVqQixNQUFNLENBQUMsT0FBTztBQUdELFdBRlAsWUFBWSxHQUVGOzBCQUZWLFlBQVk7O0FBR2QsUUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBQzNCLFFBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQztBQUNuQyxRQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztBQUN4QixRQUFJLENBQUMsY0FBYyxHQUFHLENBQUMsQ0FBQztHQUN6Qjs7ZUFQRyxZQUFZOzs7Ozs7Ozs7V0FlVixnQkFBQyxRQUFRLEVBQVc7OztBQUN4QixVQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztBQUNsQyxVQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBQyxDQUFDLENBQUM7QUFDOUMsVUFBSSxPQUFPLEdBQUcsSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFLO0FBQzdDLGNBQUssUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsVUFBQyxNQUFNLEVBQUs7Y0FDNUIsU0FBUyxHQUFXLE1BQU0sQ0FBMUIsU0FBUztjQUFFLEtBQUssR0FBSSxNQUFNLENBQWYsS0FBSzs7QUFDckIsV0FBQyxTQUFTLEdBQUcsT0FBTyxHQUFHLE1BQU0sQ0FBQSxDQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ3ZDLENBQUMsQ0FBQztPQUNKLENBQUMsQ0FBQztBQUNILFVBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNaLGFBQU8sT0FBTyxDQUFDO0tBQ2hCOzs7V0FFRyxnQkFBRzs7O0FBQ0wsVUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO0FBQ25CLGVBQU87T0FDUjs7QUFFRCxVQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtBQUMzQixlQUFPO09BQ1I7O3dCQUVvQixJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRTs7VUFBbEMsRUFBRSxlQUFGLEVBQUU7VUFBRSxRQUFRLGVBQVIsUUFBUTs7QUFDakIsVUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7QUFDdkIsVUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUMsTUFBTSxFQUFLO0FBQ3JDLGVBQUssUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUMsQ0FBQyxDQUFDO0FBQ3pELGVBQUssVUFBVSxHQUFHLEtBQUssQ0FBQztBQUN4QixlQUFLLElBQUksRUFBRSxDQUFDO09BQ2IsRUFBRSxVQUFDLEtBQUssRUFBSztBQUNaLGVBQUssUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDO0FBQ3pELGVBQUssVUFBVSxHQUFHLEtBQUssQ0FBQztBQUN4QixlQUFLLElBQUksRUFBRSxDQUFDO09BQ2IsQ0FBQyxDQUFDO0tBQ0o7OztXQUVnQiw2QkFBVztBQUMxQixhQUFPLENBQUMsSUFBSSxDQUFDLGNBQWMsR0FBRSxDQUFFLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUM3Qzs7O1NBcERHLFlBQVk7SUFxRGpCLENBQUEiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL251Y2xpZGUtaW5zdGFsbGVyL25vZGVfbW9kdWxlcy9udWNsaWRlLWluc3RhbGxlci1iYXNlL25vZGVfbW9kdWxlcy9udWNsaWRlLWNvbW1vbnMvbGliL1Byb21pc2VRdWV1ZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG52YXIgRGVxdWV1ZSA9IHJlcXVpcmUoJ2RlcXVldWUnKTtcbnZhciB7RXZlbnRFbWl0dGVyfSA9IHJlcXVpcmUoJ2V2ZW50cycpO1xuXG5cbi8qKlxuICogRklGTyBxdWV1ZSB0aGF0IGV4ZWN1dGVzIFByb21pc2UgZXhlY3V0b3JzIG9uZSBhdCBhIHRpbWUsIGluIG9yZGVyLlxuICpcbiAqIFRoZSBleGVjdXRvciBmdW5jdGlvbiBwYXNzZWQgdG8gdGhlIGNvbnN0cnVjdG9yIG9mIGEgUHJvbWlzZSBpcyBldmFsdWF0ZWRcbiAqIGltbWVkaWF0ZWx5LiBUaGlzIG1heSBub3QgYWx3YXlzIGJlIGRlc2lyYWJsZS4gVXNlIGEgUHJvbWlzZVF1ZXVlIGlmIHlvdSBoYXZlXG4gKiBhIHNlcXVlbmNlIG9mIGFzeW5jIG9wZXJhdGlvbnMgdGhhdCBuZWVkIHRvIHVzZSBhIHNoYXJlZCByZXNvdXJjZSBzZXJpYWxseS5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgUHJvbWlzZVF1ZXVlIHtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9maWZvID0gbmV3IERlcXVldWUoKTtcbiAgICB0aGlzLl9lbWl0dGVyID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICAgIHRoaXMuX2lzUnVubmluZyA9IGZhbHNlO1xuICAgIHRoaXMuX25leHRSZXF1ZXN0SWQgPSAxO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBleGVjdXRvciBBIGZ1bmN0aW9uIHRoYXQgdGFrZXMgcmVzb2x2ZSBhbmQgcmVqZWN0IGNhbGxiYWNrcywganVzdFxuICAgKiAgICAgbGlrZSB0aGUgUHJvbWlzZSBjb25zdHJ1Y3Rvci5cbiAgICogQHJldHVybiBBIFByb21pc2UgdGhhdCB3aWxsIGJlIHJlc29sdmVkL3JlamVjdGVkIGluIHJlc3BvbnNlIHRvIHRoZVxuICAgKiAgICAgZXhlY3V0aW9uIG9mIHRoZSBleGVjdXRvci5cbiAgICovXG4gIHN1Ym1pdChleGVjdXRvcik6IFByb21pc2Uge1xuICAgIHZhciBpZCA9IHRoaXMuX2dldE5leHRSZXF1ZXN0SWQoKTtcbiAgICB0aGlzLl9maWZvLnB1c2goe2lkOiBpZCwgZXhlY3V0b3I6IGV4ZWN1dG9yfSk7XG4gICAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICB0aGlzLl9lbWl0dGVyLm9uY2UoaWQsIChyZXN1bHQpID0+IHtcbiAgICAgICAgdmFyIHtpc1N1Y2Nlc3MsIHZhbHVlfSA9IHJlc3VsdDtcbiAgICAgICAgKGlzU3VjY2VzcyA/IHJlc29sdmUgOiByZWplY3QpKHZhbHVlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHRoaXMuX3J1bigpO1xuICAgIHJldHVybiBwcm9taXNlO1xuICB9XG5cbiAgX3J1bigpIHtcbiAgICBpZiAodGhpcy5faXNSdW5uaW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2ZpZm8ubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHtpZCwgZXhlY3V0b3J9ID0gdGhpcy5fZmlmby5zaGlmdCgpO1xuICAgIHRoaXMuX2lzUnVubmluZyA9IHRydWU7XG4gICAgbmV3IFByb21pc2UoZXhlY3V0b3IpLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgdGhpcy5fZW1pdHRlci5lbWl0KGlkLCB7aXNTdWNjZXNzOiB0cnVlLCB2YWx1ZTogcmVzdWx0fSk7XG4gICAgICB0aGlzLl9pc1J1bm5pbmcgPSBmYWxzZTtcbiAgICAgIHRoaXMuX3J1bigpO1xuICAgIH0sIChlcnJvcikgPT4ge1xuICAgICAgdGhpcy5fZW1pdHRlci5lbWl0KGlkLCB7aXNTdWNjZXNzOiBmYWxzZSwgdmFsdWU6IGVycm9yfSk7XG4gICAgICB0aGlzLl9pc1J1bm5pbmcgPSBmYWxzZTtcbiAgICAgIHRoaXMuX3J1bigpO1xuICAgIH0pO1xuICB9XG5cbiAgX2dldE5leHRSZXF1ZXN0SWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gKHRoaXMuX25leHRSZXF1ZXN0SWQrKykudG9TdHJpbmcoMTYpO1xuICB9XG59XG4iXX0=