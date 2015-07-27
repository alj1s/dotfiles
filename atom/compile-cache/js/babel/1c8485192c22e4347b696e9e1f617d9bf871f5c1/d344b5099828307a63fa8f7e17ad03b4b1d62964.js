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

var fs = require('fs');
var path = require('path');
var logger = require('nuclide-logging').getLogger();

var DEFAULT_WEBWORKER_TIMEOUT = 30 * 1000;
var DEFAULT_POOR_PERF_TIMEOUT = 8 * 1000;

/**
 * HackWorker uses the hh_ide.js that's a translation from OCaml to JavaScript (not readable).
 * It's responsible for providing language services without hitting the server, if possible.
 * e.g. some autocompletions, go to definition, diagnostic requests and outline could be served locally.
 * This is done as a web worker not to block the main UI thread when executing language tasks.
 */

var HackWorker = (function () {
  function HackWorker(options) {
    var _this = this;

    _classCallCheck(this, HackWorker);

    options = options || {};
    this._activeTask = null;
    this._taskQueue = [];
    this._depTaskQueue = [];
    this._webWorkerTimeout = options.webWorkerTimeout || DEFAULT_WEBWORKER_TIMEOUT;
    this._poorPefTimeout = options.poorPerfTimeout || DEFAULT_POOR_PERF_TIMEOUT;
    this._worker = options.worker || startWebWorker();
    this._worker.addEventListener('message', function (e) {
      return _this._handleHackWorkerReply(e.data);
    }, false);
    this._worker.addEventListener('error', function (error) {
      return _this._handleHackWorkerError(error);
    }, false);
  }

  _createClass(HackWorker, [{
    key: 'runWorkerTask',

    /**
     * Runs a web worker task and returns a promise of the value expected from the hack worker.
     */
    value: function runWorkerTask(workerMessage, options) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        options = options || {};
        var queue = options.isDependency ? _this2._depTaskQueue : _this2._taskQueue;
        queue.push({
          workerMessage: workerMessage,
          onResponse: function onResponse(response) {
            var internalError = response.internal_error;
            if (internalError) {
              logger.error('Hack Worker: Internal Error! - ' + String(internalError) + ' - ' + JSON.stringify(workerMessage));
              reject(internalError);
            } else {
              resolve(response);
            }
          },
          onFail: function onFail(error) {
            logger.error('Hack Worker: Error!', error, JSON.stringify(workerMessage));
            reject(error);
          }
        });
        _this2._dispatchTaskIfReady();
      });
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this._worker.terminate();
    }
  }, {
    key: '_dispatchTaskIfReady',
    value: function _dispatchTaskIfReady() {
      if (this._activeTask) {
        return;
      }
      if (this._taskQueue.length) {
        this._activeTask = this._taskQueue.shift();
      } else if (this._depTaskQueue.length) {
        this._activeTask = this._depTaskQueue.shift();
      }
      if (this._activeTask) {
        // dispatch it and start timers
        var workerMessage = this._activeTask.workerMessage;
        this._dispatchTask(workerMessage);
        this._timeoutTimer = setTimeout(function () {
          logger.warn('Webworker is stuck in a job!', JSON.stringify(workerMessage));
        }, this._webWorkerTimeout);
        this._performanceTimer = setTimeout(function () {
          logger.warn('Poor Webworker Performance!', JSON.stringify(workerMessage));
        }, this._poorPefTimeout);
      }
    }
  }, {
    key: '_dispatchTask',
    value: function _dispatchTask(task) {
      this._worker.postMessage(task);
    }
  }, {
    key: '_handleHackWorkerReply',
    value: function _handleHackWorkerReply(reply) {
      this._clearTimers();
      if (this._activeTask) {
        this._activeTask.onResponse(reply);
      } else {
        logger.error('Hack Worker replied without an active task!');
      }
      this._activeTask = null;
      this._dispatchTaskIfReady();
    }
  }, {
    key: '_handleHackWorkerError',
    value: function _handleHackWorkerError(error) {
      this._clearTimers();
      if (this._activeTask) {
        this._activeTask.onFail(error);
      } else {
        logger.error('Hack Worker errored without an active task!');
      }
      this._activeTask = null;
      this._dispatchTaskIfReady();
    }
  }, {
    key: '_clearTimers',
    value: function _clearTimers() {
      clearTimeout(this._timeoutTimer);
      clearTimeout(this._performanceTimer);
    }
  }]);

  return HackWorker;
})();

function startWebWorker() {
  // Hacky way to load the worker files from the filesystem as text,
  // then inject the text into Blob url for the WebWorker to consume.
  // http://stackoverflow.com/questions/10343913/how-to-create-a-web-worker-from-a-string
  // I did so because I can't use the atom:// url protocol to load resources in javascript:
  // https://github.com/atom/atom/blob/master/src/browser/atom-protocol-handler.coffee
  var hhIdeText = fs.readFileSync(path.join(__dirname, '../static/hh_ide.js'));
  var webWorkerText = fs.readFileSync(path.join(__dirname, '../static/HackWebWorker.js'));
  // Concatenate the code text to pass to the Worker in a blob url
  var workerText = hhIdeText + '\n//<<MERGE>>\n' + webWorkerText;
  var Blob = window.Blob;
  var Worker = window.Worker;
  var URL = window.URL;

  var blob = new Blob([workerText], { type: 'application/javascript' });
  var worker = new Worker(URL.createObjectURL(blob));
  return worker;
}

module.exports = HackWorker;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWhhY2svbGliL0hhY2tXb3JrZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7O0FBV1osSUFBSSxFQUFFLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3ZCLElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMzQixJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQzs7QUFFcEQsSUFBSSx5QkFBeUIsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDO0FBQzFDLElBQUkseUJBQXlCLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQzs7Ozs7Ozs7O0lBaUJuQyxVQUFVO0FBV0gsV0FYUCxVQUFVLENBV0YsT0FBMkIsRUFBRTs7OzBCQVhyQyxVQUFVOztBQVlaLFdBQU8sR0FBRyxPQUFPLElBQUksRUFBRSxDQUFDO0FBQ3hCLFFBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO0FBQ3hCLFFBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDO0FBQ3JCLFFBQUksQ0FBQyxhQUFhLEdBQUcsRUFBRSxDQUFDO0FBQ3hCLFFBQUksQ0FBQyxpQkFBaUIsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLElBQUkseUJBQXlCLENBQUM7QUFDL0UsUUFBSSxDQUFDLGVBQWUsR0FBRyxPQUFPLENBQUMsZUFBZSxJQUFJLHlCQUF5QixDQUFDO0FBQzVFLFFBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sSUFBSSxjQUFjLEVBQUUsQ0FBQztBQUNsRCxRQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxVQUFDLENBQUM7YUFBSyxNQUFLLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7S0FBQSxFQUFFLEtBQUssQ0FBQyxDQUFD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QUFpQixNQUFNLENBQTNCLElBQUk7TUFBRSxNQUFNLEdBQVMsTUFBTSxDQUFyQixNQUFNO01BQUUsR0FBRyxHQUFJLE1BQU0sQ0FBYixHQUFHOztBQUN0QixNQUFJLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUMsSUFBSSxFQUFFLHdCQUF3QixFQUFDLENBQUMsQ0FBQztBQUNwRSxNQUFJLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDbkQsU0FBTyxNQUFNLENBQUM7Q0FDZjs7QUFFRCxNQUFNLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQyIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvbnVjbGlkZS1oYWNrL2xpYi9IYWNrV29ya2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxudmFyIGZzID0gcmVxdWlyZSgnZnMnKTtcbnZhciBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xudmFyIGxvZ2dlciA9IHJlcXVpcmUoJ251Y2xpZGUtbG9nZ2luZycpLmdldExvZ2dlcigpO1xuXG52YXIgREVGQVVMVF9XRUJXT1JLRVJfVElNRU9VVCA9IDMwICogMTAwMDtcbnZhciBERUZBVUxUX1BPT1JfUEVSRl9USU1FT1VUID0gOCAqIDEwMDA7XG5cbnR5cGUgV29ya2VyVGFzayA9IHtcbiAgd29ya2VyTWVzc2FnZTogYW55O1xuICBvblJlc3BvbnNlOiAocmVzcG9uc2U6IGFueSkgPT4gdm9pZDtcbiAgb25GYWlsOiAoZXJyb3I6IEVycm9yKSA9PiB2b2lkO1xufTtcblxuLyoqXG4gKiBIYWNrV29ya2VyIHVzZXMgdGhlIGhoX2lkZS5qcyB0aGF0J3MgYSB0cmFuc2xhdGlvbiBmcm9tIE9DYW1sIHRvIEphdmFTY3JpcHQgKG5vdCByZWFkYWJsZSkuXG4gKiBJdCdzIHJlc3BvbnNpYmxlIGZvciBwcm92aWRpbmcgbGFuZ3VhZ2Ugc2VydmljZXMgd2l0aG91dCBoaXR0aW5nIHRoZSBzZXJ2ZXIsIGlmIHBvc3NpYmxlLlxuICogZS5nLiBzb21lIGF1dG9jb21wbGV0aW9ucywgZ28gdG8gZGVmaW5pdGlvbiwgZGlhZ25vc3RpYyByZXF1ZXN0cyBhbmQgb3V0bGluZSBjb3VsZCBiZSBzZXJ2ZWQgbG9jYWxseS5cbiAqIFRoaXMgaXMgZG9uZSBhcyBhIHdlYiB3b3JrZXIgbm90IHRvIGJsb2NrIHRoZSBtYWluIFVJIHRocmVhZCB3aGVuIGV4ZWN1dGluZyBsYW5ndWFnZSB0YXNrcy5cbiAqL1xuXG50eXBlIEhhY2tXb3JrZXJPcHRpb25zID0ge3dlYldvcmtlclRpbWVvdXQ6ID9udW1iZXI7IHBvb3JQZXJmVGltZW91dDogP251bWJlcjsgd29ya2VyOiA/V29ya2VyO307XG5cbmNsYXNzIEhhY2tXb3JrZXIge1xuXG4gIF9hY3RpdmVUYXNrOiA/V29ya2VyVGFzaztcbiAgX3Rhc2tRdWV1ZTogQXJyYXk8V29ya2VyVGFzaz47XG4gIF9kZXBUYXNrUXVldWU6IEFycmF5PFdvcmtlclRhc2s+O1xuICBfd2ViV29ya2VyVGltZW91dDogbnVtYmVyO1xuICBfcG9vclBlZlRpbWVvdXQ6IG51bWJlcjtcbiAgX3dvcmtlcjogV29ya2VyO1xuICBfdGltZW91dFRpbWVyOiBhbnk7XG4gIF9wZXJmb3JtYW5jZVRpbWVyOiBhbnk7XG5cbiAgY29uc3RydWN0b3Iob3B0aW9uczogP0hhY2tXb3JrZXJPcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdGhpcy5fYWN0aXZlVGFzayA9IG51bGw7XG4gICAgdGhpcy5fdGFza1F1ZXVlID0gW107XG4gICAgdGhpcy5fZGVwVGFza1F1ZXVlID0gW107XG4gICAgdGhpcy5fd2ViV29ya2VyVGltZW91dCA9IG9wdGlvbnMud2ViV29ya2VyVGltZW91dCB8fCBERUZBVUxUX1dFQldPUktFUl9USU1FT1VUO1xuICAgIHRoaXMuX3Bvb3JQZWZUaW1lb3V0ID0gb3B0aW9ucy5wb29yUGVyZlRpbWVvdXQgfHwgREVGQVVMVF9QT09SX1BFUkZfVElNRU9VVDtcbiAgICB0aGlzLl93b3JrZXIgPSBvcHRpb25zLndvcmtlciB8fCBzdGFydFdlYldvcmtlcigpO1xuICAgIHRoaXMuX3dvcmtlci5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgKGUpID0+IHRoaXMuX2hhbmRsZUhhY2tXb3JrZXJSZXBseShlLmRhdGEpLCBmYWxzZSk7XG4gICAgdGhpcy5fd29ya2VyLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgKGVycm9yKSA9PiB0aGlzLl9oYW5kbGVIYWNrV29ya2VyRXJyb3IoZXJyb3IpLCBmYWxzZSk7XG4gIH1cblxuICAvKipcbiAgICogUnVucyBhIHdlYiB3b3JrZXIgdGFzayBhbmQgcmV0dXJucyBhIHByb21pc2Ugb2YgdGhlIHZhbHVlIGV4cGVjdGVkIGZyb20gdGhlIGhhY2sgd29ya2VyLlxuICAgKi9cbiAgcnVuV29ya2VyVGFzayh3b3JrZXJNZXNzYWdlOiBhbnksIG9wdGlvbnM6IGFueSk6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgdmFyIHF1ZXVlID0gb3B0aW9ucy5pc0RlcGVuZGVuY3kgPyB0aGlzLl9kZXBUYXNrUXVldWUgOiB0aGlzLl90YXNrUXVldWU7XG4gICAgICBxdWV1ZS5wdXNoKHtcbiAgICAgICAgd29ya2VyTWVzc2FnZSxcbiAgICAgICAgb25SZXNwb25zZTogKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgdmFyIGludGVybmFsRXJyb3IgPSByZXNwb25zZS5pbnRlcm5hbF9lcnJvcjtcbiAgICAgICAgICBpZiAoaW50ZXJuYWxFcnJvcikge1xuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKCdIYWNrIFdvcmtlcjogSW50ZXJuYWwgRXJyb3IhIC0gJyArXG4gICAgICAgICAgICAgICAgU3RyaW5nKGludGVybmFsRXJyb3IpICsgJyAtICcgKyBKU09OLnN0cmluZ2lmeSh3b3JrZXJNZXNzYWdlKSk7XG4gICAgICAgICAgICByZWplY3QoaW50ZXJuYWxFcnJvcik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc29sdmUocmVzcG9uc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgb25GYWlsOiAoZXJyb3IpID0+IHtcbiAgICAgICAgICBsb2dnZXIuZXJyb3IoJ0hhY2sgV29ya2VyOiBFcnJvciEnLCBlcnJvciwgSlNPTi5zdHJpbmdpZnkod29ya2VyTWVzc2FnZSkpO1xuICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIHRoaXMuX2Rpc3BhdGNoVGFza0lmUmVhZHkoKTtcbiAgICB9KTtcbiAgfVxuXG4gIGRpc3Bvc2UoKSB7XG4gICAgdGhpcy5fd29ya2VyLnRlcm1pbmF0ZSgpO1xuICB9XG5cbiAgX2Rpc3BhdGNoVGFza0lmUmVhZHkoKSB7XG4gICAgaWYgKHRoaXMuX2FjdGl2ZVRhc2spIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3Rhc2tRdWV1ZS5sZW5ndGgpIHtcbiAgICAgIHRoaXMuX2FjdGl2ZVRhc2sgPSB0aGlzLl90YXNrUXVldWUuc2hpZnQoKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2RlcFRhc2tRdWV1ZS5sZW5ndGgpIHtcbiAgICAgIHRoaXMuX2FjdGl2ZVRhc2sgPSB0aGlzLl9kZXBUYXNrUXVldWUuc2hpZnQoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuX2FjdGl2ZVRhc2spIHtcbiAgICAgIC8vIGRpc3BhdGNoIGl0IGFuZCBzdGFydCB0aW1lcnNcbiAgICAgIHZhciB3b3JrZXJNZXNzYWdlID0gdGhpcy5fYWN0aXZlVGFzay53b3JrZXJNZXNzYWdlO1xuICAgICAgdGhpcy5fZGlzcGF0Y2hUYXNrKHdvcmtlck1lc3NhZ2UpO1xuICAgICAgdGhpcy5fdGltZW91dFRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGxvZ2dlci53YXJuKCdXZWJ3b3JrZXIgaXMgc3R1Y2sgaW4gYSBqb2IhJywgSlNPTi5zdHJpbmdpZnkod29ya2VyTWVzc2FnZSkpO1xuICAgICAgfSwgdGhpcy5fd2ViV29ya2VyVGltZW91dCk7XG4gICAgICB0aGlzLl9wZXJmb3JtYW5jZVRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGxvZ2dlci53YXJuKCdQb29yIFdlYndvcmtlciBQZXJmb3JtYW5jZSEnLCBKU09OLnN0cmluZ2lmeSh3b3JrZXJNZXNzYWdlKSk7XG4gICAgICB9LCB0aGlzLl9wb29yUGVmVGltZW91dCk7XG4gICAgfVxuICB9XG5cbiAgX2Rpc3BhdGNoVGFzayh0YXNrOiBXb3JrZXJUYXNrKSB7XG4gICAgdGhpcy5fd29ya2VyLnBvc3RNZXNzYWdlKHRhc2spO1xuICB9XG5cbiAgX2hhbmRsZUhhY2tXb3JrZXJSZXBseShyZXBseTogYW55KSB7XG4gICAgdGhpcy5fY2xlYXJUaW1lcnMoKTtcbiAgICBpZiAodGhpcy5fYWN0aXZlVGFzaykge1xuICAgICAgdGhpcy5fYWN0aXZlVGFzay5vblJlc3BvbnNlKHJlcGx5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgbG9nZ2VyLmVycm9yKCdIYWNrIFdvcmtlciByZXBsaWVkIHdpdGhvdXQgYW4gYWN0aXZlIHRhc2shJyk7XG4gICAgfVxuICAgIHRoaXMuX2FjdGl2ZVRhc2sgPSBudWxsO1xuICAgIHRoaXMuX2Rpc3BhdGNoVGFza0lmUmVhZHkoKTtcbiAgfVxuXG4gIF9oYW5kbGVIYWNrV29ya2VyRXJyb3IoZXJyb3I6IEVycm9yKSB7XG4gICAgdGhpcy5fY2xlYXJUaW1lcnMoKTtcbiAgICBpZiAodGhpcy5fYWN0aXZlVGFzaykge1xuICAgICAgdGhpcy5fYWN0aXZlVGFzay5vbkZhaWwoZXJyb3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsb2dnZXIuZXJyb3IoJ0hhY2sgV29ya2VyIGVycm9yZWQgd2l0aG91dCBhbiBhY3RpdmUgdGFzayEnKTtcbiAgICB9XG4gICAgdGhpcy5fYWN0aXZlVGFzayA9IG51bGw7XG4gICAgdGhpcy5fZGlzcGF0Y2hUYXNrSWZSZWFkeSgpO1xuICB9XG5cbiAgX2NsZWFyVGltZXJzKCkge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLl90aW1lb3V0VGltZXIpO1xuICAgIGNsZWFyVGltZW91dCh0aGlzLl9wZXJmb3JtYW5jZVRpbWVyKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzdGFydFdlYldvcmtlcigpOiBXb3JrZXIge1xuICAvLyBIYWNreSB3YXkgdG8gbG9hZCB0aGUgd29ya2VyIGZpbGVzIGZyb20gdGhlIGZpbGVzeXN0ZW0gYXMgdGV4dCxcbiAgLy8gdGhlbiBpbmplY3QgdGhlIHRleHQgaW50byBCbG9iIHVybCBmb3IgdGhlIFdlYldvcmtlciB0byBjb25zdW1lLlxuICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwMzQzOTEzL2hvdy10by1jcmVhdGUtYS13ZWItd29ya2VyLWZyb20tYS1zdHJpbmdcbiAgLy8gSSBkaWQgc28gYmVjYXVzZSBJIGNhbid0IHVzZSB0aGUgYXRvbTovLyB1cmwgcHJvdG9jb2wgdG8gbG9hZCByZXNvdXJjZXMgaW4gamF2YXNjcmlwdDpcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2F0b20vYXRvbS9ibG9iL21hc3Rlci9zcmMvYnJvd3Nlci9hdG9tLXByb3RvY29sLWhhbmRsZXIuY29mZmVlXG4gIHZhciBoaElkZVRleHQgPSBmcy5yZWFkRmlsZVN5bmMocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL3N0YXRpYy9oaF9pZGUuanMnKSk7XG4gIHZhciB3ZWJXb3JrZXJUZXh0ID0gZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi9zdGF0aWMvSGFja1dlYldvcmtlci5qcycpKTtcbiAgLy8gQ29uY2F0ZW5hdGUgdGhlIGNvZGUgdGV4dCB0byBwYXNzIHRvIHRoZSBXb3JrZXIgaW4gYSBibG9iIHVybFxuICB2YXIgd29ya2VyVGV4dCA9IGhoSWRlVGV4dCArICdcXG4vLzw8TUVSR0U+PlxcbicgKyB3ZWJXb3JrZXJUZXh0O1xuICB2YXIge0Jsb2IsIFdvcmtlciwgVVJMfSA9IHdpbmRvdztcbiAgdmFyIGJsb2IgPSBuZXcgQmxvYihbd29ya2VyVGV4dF0sIHt0eXBlOiAnYXBwbGljYXRpb24vamF2YXNjcmlwdCd9KTtcbiAgdmFyIHdvcmtlciA9IG5ldyBXb3JrZXIoVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKSk7XG4gIHJldHVybiB3b3JrZXI7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gSGFja1dvcmtlcjtcbiJdfQ==