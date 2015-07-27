'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var FlowService = (function () {
  function FlowService() {
    _classCallCheck(this, FlowService);
  }

  _createClass(FlowService, [{
    key: 'findDefinition',
    value: function findDefinition(file, currentContents, line, column) {
      return Promise.reject('Not implemented');
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      return Promise.reject('Not implemented');
    }
  }, {
    key: 'findDiagnostics',
    value: function findDiagnostics(file)
    // Ideally, this would just be Promise<Array<Diagnostic>>, but the service
    // framework doesn't pick up on NuclideUri if it's embedded in a type defined
    // elsewhere.
    {
      return Promise.reject('Not implemented');
    }
  }, {
    key: 'getAutocompleteSuggestions',
    value: function getAutocompleteSuggestions(file, currentContents, line, column, prefix) {
      return Promise.reject('Not implemented');
    }
  }, {
    key: 'getType',
    value: function getType(file, currentContents, line, column) {
      return Promise.reject('Not implemented');
    }
  }]);

  return FlowService;
})();

module.exports = FlowService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZsb3cvbm9kZV9tb2R1bGVzL251Y2xpZGUtZmxvdy1iYXNlL2xpYi9GbG93U2VydmljZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUF1Qk4sV0FBVztXQUFYLFdBQVc7MEJBQVgsV0FBVzs7O2VBQVgsV0FBVzs7V0FFRCx3QkFDWixJQUFnQixFQUNoQixlQUF1QixFQUN2QixJQUFZLEVBQ1osTUFBYyxFQUMyQztBQUN6RCxhQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztLQUMxQzs7O1dBQ00sbUJBQWtCO0FBQ3ZCLGFBQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0tBQzFDOzs7V0FFYyx5QkFDYixJQUFnQjs7OztBQWVsQjtBQUNFLGFBQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0tBQzFDOzs7V0FFeUIsb0NBQ3hCLElBQWdCLEVBQ2hCLGVBQXVCLEVBQ3ZCLElBQVksRUFDWixNQUFjLEVBQ2QsTUFBYyxFQUNBO0FBQ2QsYUFBTyxPQUFPLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7S0FDMUM7OztXQUVNLGlCQUNMLElBQWdCLEVBQ2hCLGVBQXVCLEVBQ3ZCLElBQVksRUFDWixNQUFjLEVBQ0k7QUFDbEIsYUFBTyxPQUFPLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7S0FDMUM7OztTQW5ERyxXQUFXOzs7QUFzRGpCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsV0FBVyxDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZsb3cvbm9kZV9tb2R1bGVzL251Y2xpZGUtZmxvdy1iYXNlL2xpYi9GbG93U2VydmljZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbmV4cG9ydCB0eXBlIERpYWdub3N0aWMgPSB7XG4gIG1lc3NhZ2U6IEFycmF5PHtcbiAgICBwYXRoOiBOdWNsaWRlVXJpO1xuICAgIGRlc2NyOiBzdHJpbmc7XG4gICAgY29kZTogbnVtYmVyO1xuICAgIGxpbmU6IG51bWJlcjtcbiAgICBlbmRsaW5lOiBudW1iZXI7XG4gICAgc3RhcnQ6IG51bWJlcjtcbiAgICBlbmQ6IG51bWJlcjtcbiAgfT5cbn1cblxuY2xhc3MgRmxvd1NlcnZpY2Uge1xuXG4gIGZpbmREZWZpbml0aW9uKFxuICAgIGZpbGU6IE51Y2xpZGVVcmksXG4gICAgY3VycmVudENvbnRlbnRzOiBzdHJpbmcsXG4gICAgbGluZTogbnVtYmVyLFxuICAgIGNvbHVtbjogbnVtYmVyXG4gICk6IFByb21pc2U8P3tmaWxlOk51Y2xpZGVVcmk7IGxpbmU6bnVtYmVyOyBjb2x1bW46bnVtYmVyfT4ge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgnTm90IGltcGxlbWVudGVkJyk7XG4gIH1cbiAgZGlzcG9zZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoJ05vdCBpbXBsZW1lbnRlZCcpO1xuICB9XG5cbiAgZmluZERpYWdub3N0aWNzKFxuICAgIGZpbGU6IE51Y2xpZGVVcmlcbiAgKTogUHJvbWlzZTxBcnJheTx7bWVzc2FnZTpcbiAgICAgICAgQXJyYXk8e1xuICAgICAgICAgIHBhdGg6IE51Y2xpZGVVcmk7XG4gICAgICAgICAgZGVzY3I6IHN0cmluZztcbiAgICAgICAgICBjb2RlOiBudW1iZXI7XG4gICAgICAgICAgbGluZTogbnVtYmVyO1xuICAgICAgICAgIGVuZGxpbmU6IG51bWJlcjtcbiAgICAgICAgICBzdGFydDogbnVtYmVyO1xuICAgICAgICAgIGVuZDogbnVtYmVyO1xuICAgICAgICB9PlxuICAgIH0+PlxuICAvLyBJZGVhbGx5LCB0aGlzIHdvdWxkIGp1c3QgYmUgUHJvbWlzZTxBcnJheTxEaWFnbm9zdGljPj4sIGJ1dCB0aGUgc2VydmljZVxuICAvLyBmcmFtZXdvcmsgZG9lc24ndCBwaWNrIHVwIG9uIE51Y2xpZGVVcmkgaWYgaXQncyBlbWJlZGRlZCBpbiBhIHR5cGUgZGVmaW5lZFxuICAvLyBlbHNld2hlcmUuXG4gIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoJ05vdCBpbXBsZW1lbnRlZCcpO1xuICB9XG5cbiAgZ2V0QXV0b2NvbXBsZXRlU3VnZ2VzdGlvbnMoXG4gICAgZmlsZTogTnVjbGlkZVVyaSxcbiAgICBjdXJyZW50Q29udGVudHM6IHN0cmluZyxcbiAgICBsaW5lOiBudW1iZXIsXG4gICAgY29sdW1uOiBudW1iZXIsXG4gICAgcHJlZml4OiBzdHJpbmdcbiAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoJ05vdCBpbXBsZW1lbnRlZCcpO1xuICB9XG5cbiAgZ2V0VHlwZShcbiAgICBmaWxlOiBOdWNsaWRlVXJpLFxuICAgIGN1cnJlbnRDb250ZW50czogc3RyaW5nLFxuICAgIGxpbmU6IG51bWJlcixcbiAgICBjb2x1bW46IG51bWJlclxuICApOiBQcm9taXNlPD9zdHJpbmc+IHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoJ05vdCBpbXBsZW1lbnRlZCcpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRmxvd1NlcnZpY2U7XG4iXX0=