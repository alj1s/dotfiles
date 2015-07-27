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

var _require = require('nuclide-remote-connection');

var RemoteDirectory = _require.RemoteDirectory;

var RemoteDirectorySearcher = (function () {

  // When constructed, RemoteDirectorySearcher must be passed a function that
  // it can use to get a 'FindInProjectService' for a given remote path.

  function RemoteDirectorySearcher(serviceProvider) {
    _classCallCheck(this, RemoteDirectorySearcher);

    this._serviceProvider = serviceProvider;
  }

  _createClass(RemoteDirectorySearcher, [{
    key: 'canSearchDirectory',
    value: function canSearchDirectory(directory) {
      return RemoteDirectory.isRemoteDirectory(directory);
    }
  }, {
    key: 'search',
    value: function search(directories, regex, options) {
      var _this = this;

      var isCancelled = false;
      var promise = new Promise(function (resolve, reject) {
        // Create and resolve a promise for each search directory.
        var searchPromises = directories.map(function (dir) {
          var service = _this._serviceProvider(dir);
          return service.search(dir.getPath(), regex.source);
        });

        var pathsSearched = 0;
        Promise.all(searchPromises).then(function (allResults) {
          allResults.forEach(function (results) {
            results.forEach(options.didMatch);
            pathsSearched += results.length;
            options.didSearchPaths(pathsSearched);
          });

          // Reject the promise if the search was cancelled, otherwise resolve.
          (isCancelled ? reject : resolve)(null);
        });
      });

      // Return a thenable object with a 'cancel' function that can end a search.
      return {
        then: promise.then.bind(promise),
        cancel: function cancel() {
          isCancelled = true;
        }
      };
    }
  }]);

  return RemoteDirectorySearcher;
})();

module.exports = RemoteDirectorySearcher;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9saWIvUmVtb3RlRGlyZWN0b3J5U2VhcmNoZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7O2VBV1ksT0FBTyxDQUFDLDJCQUEyQixDQUFDOztJQUF2RCxlQUFlLFlBQWYsZUFBZTs7SUFpQmQsdUJBQXVCOzs7OztBQUtoQixXQUxQLHVCQUF1QixDQUtmLGVBQThDLEVBQUU7MEJBTHhELHVCQUF1Qjs7QUFNekIsUUFBSSxDQUFDLGdCQUFnQixHQUFHLGVBQWUsQ0FBQztHQUN6Qzs7ZUFQRyx1QkFBdUI7O1dBU1QsNEJBQUMsU0FBc0MsRUFBVztBQUNsRSxhQUFPLGVBQWUsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztLQUNyRDs7O1dBRUssZ0JBQUMsV0FBbUMsRUFBRSxLQUFhLEVBQUUsT0FBZSxFQUF5Qjs7O0FBQ2pHLFVBQUksV0FBVyxHQUFHLEtBQUssQ0FBQztBQUN4QixVQUFJLE9BQU8sR0FBRyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUs7O0FBRTdDLFlBQUksY0FBYyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsVUFBQSxHQUFHLEVBQUk7QUFDMUMsY0FBSSxPQUFPLEdBQUcsTUFBSyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN6QyxpQkFBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDcEQsQ0FBQyxDQUFDOztBQUVILFlBQUksYUFBYSxHQUFHLENBQUMsQ0FBQztBQUN0QixlQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFBLFVBQVUsRUFBSTtBQUM3QyxvQkFBVSxDQUFDLE9BQU8sQ0FBQyxVQUFBLE9BQU8sRUFBSTtBQUM1QixtQkFBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDbEMseUJBQWEsSUFBSSxPQUFPLENBQUMsTUFBTSxDQUFDO0FBQ2hDLG1CQUFPLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1dBQ3ZDLENBQUMsQ0FBQzs7O0FBR0gsV0FBQyxXQUFXLEdBQUcsTUFBTSxHQUFHLE9BQU8sQ0FBQSxDQUFFLElBQUksQ0FBQyxDQUFDO1NBQ3hDLENBQUMsQ0FBQztPQUNKLENBQUMsQ0FBQzs7O0FBR0gsYUFBTztBQUNMLFlBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7QUFDaEMsY0FBTSxFQUFBLGtCQUFHO0FBQ1AscUJBQVcsR0FBRyxJQUFJLENBQUM7U0FDcEI7T0FDRixDQUFDO0tBQ0g7OztTQTFDRyx1QkFBdUI7OztBQTZDN0IsTUFBTSxDQUFDLE9BQU8sR0FBRyx1QkFBdUIsQ0FBQyIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvbnVjbGlkZS1yZW1vdGUtcHJvamVjdHMvbGliL1JlbW90ZURpcmVjdG9yeVNlYXJjaGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxudmFyIHtSZW1vdGVEaXJlY3Rvcnl9ID0gcmVxdWlyZSgnbnVjbGlkZS1yZW1vdGUtY29ubmVjdGlvbicpO1xuXG50eXBlIFNlYXJjaFJlc3VsdCA9IHtcbiAgZmlsZVBhdGg6IHN0cmluZztcbiAgbWF0Y2hlczogQXJyYXk8e2xpbmVUZXh0OiBzdHJpbmc7IGxpbmVUZXh0T2Zmc2V0OiBudW1iZXI7IG1hdGNoVGV4dDogc3RyaW5nOyByYW5nZTogQXJyYXk8QXJyYXk8bnVtYmVyPj59Pjtcbn07XG5cbnR5cGUgRGlyZWN0b3J5U2VhcmNoRGVsZWdhdGUgPSB7XG4gIGRpZE1hdGNoOiAocmVzdWx0OiBTZWFyY2hSZXN1bHQpID0+IHZvaWQ7XG4gIGRpZFNlYXJjaFBhdGhzOiAoY291bnQ6IG51bWJlcikgPT4gdm9pZDtcbn07XG5cbnR5cGUgUmVtb3RlRGlyZWN0b3J5U2VhcmNoID0ge1xuICB0aGVuOiAob25GdWxsZmlsbGVkOiBhbnksIG9uUmVqZWN0ZWQ6IGFueSkgPT4gUHJvbWlzZTxhbnk+O1xuICBjYW5jZWw6ICgpID0+IHZvaWQ7XG59XG5cbmNsYXNzIFJlbW90ZURpcmVjdG9yeVNlYXJjaGVyIHtcbiAgX3NlcnZpY2VQcm92aWRlcjogKGRpcjogUmVtb3RlRGlyZWN0b3J5KSA9PiBhbnk7XG5cbiAgLy8gV2hlbiBjb25zdHJ1Y3RlZCwgUmVtb3RlRGlyZWN0b3J5U2VhcmNoZXIgbXVzdCBiZSBwYXNzZWQgYSBmdW5jdGlvbiB0aGF0XG4gIC8vIGl0IGNhbiB1c2UgdG8gZ2V0IGEgJ0ZpbmRJblByb2plY3RTZXJ2aWNlJyBmb3IgYSBnaXZlbiByZW1vdGUgcGF0aC5cbiAgY29uc3RydWN0b3Ioc2VydmljZVByb3ZpZGVyOiAoZGlyOiBSZW1vdGVEaXJlY3RvcnkpID0+IGFueSkge1xuICAgIHRoaXMuX3NlcnZpY2VQcm92aWRlciA9IHNlcnZpY2VQcm92aWRlcjtcbiAgfVxuXG4gIGNhblNlYXJjaERpcmVjdG9yeShkaXJlY3Rvcnk6IERpcmVjdG9yeSB8IFJlbW90ZURpcmVjdG9yeSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBSZW1vdGVEaXJlY3RvcnkuaXNSZW1vdGVEaXJlY3RvcnkoZGlyZWN0b3J5KTtcbiAgfVxuXG4gIHNlYXJjaChkaXJlY3RvcmllczogQXJyYXk8UmVtb3RlRGlyZWN0b3J5PiwgcmVnZXg6IFJlZ0V4cCwgb3B0aW9uczogT2JqZWN0KTogUmVtb3RlRGlyZWN0b3J5U2VhcmNoIHtcbiAgICB2YXIgaXNDYW5jZWxsZWQgPSBmYWxzZTtcbiAgICB2YXIgcHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIC8vIENyZWF0ZSBhbmQgcmVzb2x2ZSBhIHByb21pc2UgZm9yIGVhY2ggc2VhcmNoIGRpcmVjdG9yeS5cbiAgICAgIHZhciBzZWFyY2hQcm9taXNlcyA9IGRpcmVjdG9yaWVzLm1hcChkaXIgPT4ge1xuICAgICAgICB2YXIgc2VydmljZSA9IHRoaXMuX3NlcnZpY2VQcm92aWRlcihkaXIpO1xuICAgICAgICByZXR1cm4gc2VydmljZS5zZWFyY2goZGlyLmdldFBhdGgoKSwgcmVnZXguc291cmNlKTtcbiAgICAgIH0pO1xuXG4gICAgICB2YXIgcGF0aHNTZWFyY2hlZCA9IDA7XG4gICAgICBQcm9taXNlLmFsbChzZWFyY2hQcm9taXNlcykudGhlbihhbGxSZXN1bHRzID0+IHtcbiAgICAgICAgYWxsUmVzdWx0cy5mb3JFYWNoKHJlc3VsdHMgPT4ge1xuICAgICAgICAgIHJlc3VsdHMuZm9yRWFjaChvcHRpb25zLmRpZE1hdGNoKTtcbiAgICAgICAgICBwYXRoc1NlYXJjaGVkICs9IHJlc3VsdHMubGVuZ3RoO1xuICAgICAgICAgIG9wdGlvbnMuZGlkU2VhcmNoUGF0aHMocGF0aHNTZWFyY2hlZCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFJlamVjdCB0aGUgcHJvbWlzZSBpZiB0aGUgc2VhcmNoIHdhcyBjYW5jZWxsZWQsIG90aGVyd2lzZSByZXNvbHZlLlxuICAgICAgICAoaXNDYW5jZWxsZWQgPyByZWplY3QgOiByZXNvbHZlKShudWxsKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLy8gUmV0dXJuIGEgdGhlbmFibGUgb2JqZWN0IHdpdGggYSAnY2FuY2VsJyBmdW5jdGlvbiB0aGF0IGNhbiBlbmQgYSBzZWFyY2guXG4gICAgcmV0dXJuIHtcbiAgICAgIHRoZW46IHByb21pc2UudGhlbi5iaW5kKHByb21pc2UpLFxuICAgICAgY2FuY2VsKCkge1xuICAgICAgICBpc0NhbmNlbGxlZCA9IHRydWU7XG4gICAgICB9XG4gICAgfTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbW90ZURpcmVjdG9yeVNlYXJjaGVyO1xuIl19