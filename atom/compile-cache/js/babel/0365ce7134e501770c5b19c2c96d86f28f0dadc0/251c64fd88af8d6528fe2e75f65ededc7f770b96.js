'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

module.exports = Object.defineProperties({

  asyncFind: function asyncFind(items, test, thisArg) {
    return require('./promises').asyncFind(items, test, thisArg);
  },

  getConfigValueAsync: function getConfigValueAsync(key) {
    return require('./config').getConfigValueAsync(key);
  },

  asyncExecute: function asyncExecute(command, args, options) {
    return require('./process').asyncExecute(command, args, options);
  },

  checkOutput: function checkOutput(command, args, options) {
    return require('./process').checkOutput(command, args, options);
  },

  denodeify: function denodeify(f) {
    return require('./promises').denodeify(f);
  },

  safeSpawn: function safeSpawn(command, args, options) {
    return require('./process').safeSpawn(command, args, options);
  },

  readFile: function readFile(filePath, options) {
    return require('./filesystem').readFile(filePath, options);
  },

  findNearestFile: function findNearestFile(fileName, pathToDirectory) {
    return require('./filesystem').findNearestFile(fileName, pathToDirectory);
  }

}, {
  array: {
    get: function get() {
      return require('./array');
    },
    configurable: true,
    enumerable: true
  },
  object: {
    get: function get() {
      return require('./object');
    },
    configurable: true,
    enumerable: true
  },
  fsPromise: {
    get: function get() {
      return require('./filesystem');
    },
    configurable: true,
    enumerable: true
  },
  httpPromise: {
    get: function get() {
      return require('./http');
    },
    configurable: true,
    enumerable: true
  },
  strings: {
    get: function get() {
      return require('./strings');
    },
    configurable: true,
    enumerable: true
  },
  paths: {
    get: function get() {
      return require('./paths');
    },
    configurable: true,
    enumerable: true
  },
  PromiseQueue: {
    get: function get() {
      return require('./PromiseQueue');
    },
    configurable: true,
    enumerable: true
  },
  extend: {
    get: function get() {
      return require('./extend');
    },
    configurable: true,
    enumerable: true
  },
  debounce: {
    get: function get() {
      return require('./debounce');
    },
    configurable: true,
    enumerable: true
  },
  vcs: {
    get: function get() {
      return require('./vcs');
    },
    configurable: true,
    enumerable: true
  },
  dnsUtils: {
    get: function get() {
      return require('./dns_utils');
    },
    configurable: true,
    enumerable: true
  },
  env: {
    get: function get() {
      return require('./environment');
    },
    configurable: true,
    enumerable: true
  }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9ub2RlX21vZHVsZXMvbnVjbGlkZS1yZW1vdGUtY29ubmVjdGlvbi9ub2RlX21vZHVsZXMvbnVjbGlkZS1jb21tb25zL2xpYi9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7QUFXWixNQUFNLENBQUMsT0FBTywyQkFBRzs7QUFFZixXQUFTLEVBQUEsbUJBQUMsS0FBWSxFQUFFLElBQVMsRUFBRSxPQUFZLEVBQVc7QUFDeEQsV0FBTyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7R0FDOUQ7O0FBRUQscUJBQW1CLEVBQUEsNkJBQUMsR0FBVyxFQUFpQjtBQUM5QyxXQUFPLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztHQUNyRDs7QUFFRCxjQUFZLEVBQUEsc0JBQUMsT0FBZSxFQUFFLElBQW1CLEVBQUUsT0FBWSxFQUFXO0FBQ3hFLFdBQU8sT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0dBQ2xFOztBQUVELGFBQVcsRUFBQSxxQkFBQyxPQUFlLEVBQUUsSUFBbUIsRUFBRSxPQUFnQixFQUFXO0FBQzNFLFdBQU8sT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0dBQ2pFOztBQUVELFdBQVMsRUFBQSxtQkFBQyxDQUErQixFQUF5QztBQUNoRixXQUFPLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7R0FDM0M7O0FBRUQsV0FBUyxFQUFBLG1CQUFDLE9BQWUsRUFBRSxJQUFtQixFQUFFLE9BQWUsRUFBZ0I7QUFDN0UsV0FBTyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7R0FDL0Q7O0FBRUQsVUFBUSxFQUFBLGtCQUFDLFFBQWdCLEVBQUUsT0FBYSxFQUFXO0FBQ2pELFdBQU8sT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7R0FDNUQ7O0FBRUQsaUJBQWUsRUFBQSx5QkFBQyxRQUFnQixFQUFFLGVBQXVCLEVBQW9CO0FBQzNFLFdBQU8sT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsZUFBZSxDQUFDLENBQUM7R0FDM0U7O0NBaURGO0FBL0NLLE9BQUs7U0FBQSxlQUFHO0FBQ1YsYUFBTyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7S0FDM0I7Ozs7QUFFRyxRQUFNO1NBQUEsZUFBRztBQUNYLGFBQU8sT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0tBQzVCOzs7O0FBRUcsV0FBUztTQUFBLGVBQUc7QUFDZCxhQUFPLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztLQUNoQzs7OztBQUVHLGFBQVc7U0FBQSxlQUFHO0FBQ2hCLGFBQU8sT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQzFCOzs7O0FBRUcsU0FBTztTQUFBLGVBQUc7QUFDWixhQUFPLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztLQUM3Qjs7OztBQUVHLE9BQUs7U0FBQSxlQUFHO0FBQ1YsYUFBTyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7S0FDM0I7Ozs7QUFFRyxjQUFZO1NBQUEsZUFBRztBQUNqQixhQUFPLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0tBQ2xDOzs7O0FBRUcsUUFBTTtTQUFBLGVBQUc7QUFDWCxhQUFPLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztLQUM1Qjs7OztBQUVHLFVBQVE7U0FBQSxlQUFHO0FBQ2IsYUFBTyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7S0FDOUI7Ozs7QUFFRyxLQUFHO1NBQUEsZUFBRztBQUNSLGFBQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQ3pCOzs7O0FBRUcsVUFBUTtTQUFBLGVBQUc7QUFDYixhQUFPLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztLQUMvQjs7OztBQUVHLEtBQUc7U0FBQSxlQUFHO0FBQ1IsYUFBTyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7S0FDakM7Ozs7RUFDRixDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9ub2RlX21vZHVsZXMvbnVjbGlkZS1yZW1vdGUtY29ubmVjdGlvbi9ub2RlX21vZHVsZXMvbnVjbGlkZS1jb21tb25zL2xpYi9tYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgYXN5bmNGaW5kKGl0ZW1zOiBBcnJheSwgdGVzdDogYW55LCB0aGlzQXJnOiBhbnkpOiBQcm9taXNlIHtcbiAgICByZXR1cm4gcmVxdWlyZSgnLi9wcm9taXNlcycpLmFzeW5jRmluZChpdGVtcywgdGVzdCwgdGhpc0FyZyk7XG4gIH0sXG5cbiAgZ2V0Q29uZmlnVmFsdWVBc3luYyhrZXk6IHN0cmluZyk6ICgpID0+IFByb21pc2Uge1xuICAgIHJldHVybiByZXF1aXJlKCcuL2NvbmZpZycpLmdldENvbmZpZ1ZhbHVlQXN5bmMoa2V5KTtcbiAgfSxcblxuICBhc3luY0V4ZWN1dGUoY29tbWFuZDogc3RyaW5nLCBhcmdzOiBBcnJheTxzdHJpbmc+LCBvcHRpb25zOiBhbnkpOiBQcm9taXNlIHtcbiAgICByZXR1cm4gcmVxdWlyZSgnLi9wcm9jZXNzJykuYXN5bmNFeGVjdXRlKGNvbW1hbmQsIGFyZ3MsIG9wdGlvbnMpO1xuICB9LFxuXG4gIGNoZWNrT3V0cHV0KGNvbW1hbmQ6IHN0cmluZywgYXJnczogQXJyYXk8c3RyaW5nPiwgb3B0aW9uczogP09iamVjdCk6IFByb21pc2Uge1xuICAgIHJldHVybiByZXF1aXJlKCcuL3Byb2Nlc3MnKS5jaGVja091dHB1dChjb21tYW5kLCBhcmdzLCBvcHRpb25zKTtcbiAgfSxcblxuICBkZW5vZGVpZnkoZjogKC4uLmFyZ3M6IEFycmF5PGFueT4pID0+IGFueSk6ICguLi5hcmdzOiBBcnJheTxhbnk+KSA9PiBQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiByZXF1aXJlKCcuL3Byb21pc2VzJykuZGVub2RlaWZ5KGYpO1xuICB9LFxuXG4gIHNhZmVTcGF3bihjb21tYW5kOiBzdHJpbmcsIGFyZ3M6IEFycmF5PHN0cmluZz4sIG9wdGlvbnM6IE9iamVjdCk6IENoaWxkUHJvY2VzcyB7XG4gICAgcmV0dXJuIHJlcXVpcmUoJy4vcHJvY2VzcycpLnNhZmVTcGF3bihjb21tYW5kLCBhcmdzLCBvcHRpb25zKTtcbiAgfSxcblxuICByZWFkRmlsZShmaWxlUGF0aDogc3RyaW5nLCBvcHRpb25zPzogYW55KTogUHJvbWlzZSB7XG4gICAgcmV0dXJuIHJlcXVpcmUoJy4vZmlsZXN5c3RlbScpLnJlYWRGaWxlKGZpbGVQYXRoLCBvcHRpb25zKTtcbiAgfSxcblxuICBmaW5kTmVhcmVzdEZpbGUoZmlsZU5hbWU6IHN0cmluZywgcGF0aFRvRGlyZWN0b3J5OiBzdHJpbmcpOiBQcm9taXNlPD9zdHJpbmc+IHtcbiAgICByZXR1cm4gcmVxdWlyZSgnLi9maWxlc3lzdGVtJykuZmluZE5lYXJlc3RGaWxlKGZpbGVOYW1lLCBwYXRoVG9EaXJlY3RvcnkpO1xuICB9LFxuXG4gIGdldCBhcnJheSgpIHtcbiAgICByZXR1cm4gcmVxdWlyZSgnLi9hcnJheScpO1xuICB9LFxuXG4gIGdldCBvYmplY3QoKSB7XG4gICAgcmV0dXJuIHJlcXVpcmUoJy4vb2JqZWN0Jyk7XG4gIH0sXG5cbiAgZ2V0IGZzUHJvbWlzZSgpIHtcbiAgICByZXR1cm4gcmVxdWlyZSgnLi9maWxlc3lzdGVtJyk7XG4gIH0sXG5cbiAgZ2V0IGh0dHBQcm9taXNlKCkge1xuICAgIHJldHVybiByZXF1aXJlKCcuL2h0dHAnKTtcbiAgfSxcblxuICBnZXQgc3RyaW5ncygpIHtcbiAgICByZXR1cm4gcmVxdWlyZSgnLi9zdHJpbmdzJyk7XG4gIH0sXG5cbiAgZ2V0IHBhdGhzKCkge1xuICAgIHJldHVybiByZXF1aXJlKCcuL3BhdGhzJyk7XG4gIH0sXG5cbiAgZ2V0IFByb21pc2VRdWV1ZSgpIHtcbiAgICByZXR1cm4gcmVxdWlyZSgnLi9Qcm9taXNlUXVldWUnKTtcbiAgfSxcblxuICBnZXQgZXh0ZW5kKCkge1xuICAgIHJldHVybiByZXF1aXJlKCcuL2V4dGVuZCcpO1xuICB9LFxuXG4gIGdldCBkZWJvdW5jZSgpIHtcbiAgICByZXR1cm4gcmVxdWlyZSgnLi9kZWJvdW5jZScpO1xuICB9LFxuXG4gIGdldCB2Y3MoKSB7XG4gICAgcmV0dXJuIHJlcXVpcmUoJy4vdmNzJyk7XG4gIH0sXG5cbiAgZ2V0IGRuc1V0aWxzKCkge1xuICAgIHJldHVybiByZXF1aXJlKCcuL2Ruc191dGlscycpO1xuICB9LFxuXG4gIGdldCBlbnYoKSB7XG4gICAgcmV0dXJuIHJlcXVpcmUoJy4vZW52aXJvbm1lbnQnKTtcbiAgfSxcbn07XG4iXX0=