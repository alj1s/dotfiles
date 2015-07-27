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

var NullHackClient = (function () {
  function NullHackClient() {
    _classCallCheck(this, NullHackClient);
  }

  _createClass(NullHackClient, [{
    key: 'getHackDiagnostics',
    value: function getHackDiagnostics() {
      return Promise.resolve({ errors: [] });
    }
  }, {
    key: 'getHackCompletions',
    value: function getHackCompletions(query) {
      return Promise.resolve([]);
    }
  }, {
    key: 'getHackDefinition',
    value: function getHackDefinition(query, symbolType) {
      return Promise.resolve([]);
    }
  }, {
    key: 'getHackDependencies',
    value: function getHackDependencies(dependenciesInfo) {
      return Promise.resolve({});
    }
  }, {
    key: 'getHackSearchResults',
    value: function getHackSearchResults(search, filterTypes, searchPostfix) {
      return Promise.resolve([]);
    }
  }]);

  return NullHackClient;
})();

module.exports = NullHackClient;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWhhY2svbGliL051bGxIYWNrQ2xpZW50LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7OztJQVdOLGNBQWM7V0FBZCxjQUFjOzBCQUFkLGNBQWM7OztlQUFkLGNBQWM7O1dBRUEsOEJBQXdCO0FBQ3hDLGFBQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUMsQ0FBQyxDQUFDO0tBQ3RDOzs7V0FFaUIsNEJBQUMsS0FBYSxFQUF1QjtBQUNyRCxhQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7S0FDNUI7OztXQUVnQiwyQkFBQyxLQUFhLEVBQUUsVUFBc0IsRUFBdUI7QUFDNUUsYUFBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0tBQzVCOzs7V0FFa0IsNkJBQUMsZ0JBQXFELEVBQWdCO0FBQ3ZGLGFBQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUM1Qjs7O1dBRW1CLDhCQUNoQixNQUFjLEVBQ2QsV0FBcUMsRUFDckMsYUFBc0IsRUFDRDtBQUN2QixhQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7S0FDNUI7OztTQXhCRyxjQUFjOzs7QUE0QnBCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsY0FBYyxDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWhhY2svbGliL051bGxIYWNrQ2xpZW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxuY2xhc3MgTnVsbEhhY2tDbGllbnQge1xuXG4gIGdldEhhY2tEaWFnbm9zdGljcygpOiBQcm9taXNlPEFycmF5PGFueT4+IHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtlcnJvcnM6IFtdfSk7XG4gIH1cblxuICBnZXRIYWNrQ29tcGxldGlvbnMocXVlcnk6IHN0cmluZyk6IFByb21pc2U8QXJyYXk8YW55Pj4ge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICB9XG5cbiAgZ2V0SGFja0RlZmluaXRpb24ocXVlcnk6IHN0cmluZywgc3ltYm9sVHlwZTogU3ltYm9sVHlwZSk6IFByb21pc2U8QXJyYXk8YW55Pj4ge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICB9XG5cbiAgZ2V0SGFja0RlcGVuZGVuY2llcyhkZXBlbmRlbmNpZXNJbmZvOiBBcnJheTx7bmFtZTogc3RyaW5nOyB0eXBlOiBzdHJpbmd9Pik6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7fSk7XG4gIH1cblxuICBnZXRIYWNrU2VhcmNoUmVzdWx0cyhcbiAgICAgIHNlYXJjaDogc3RyaW5nLFxuICAgICAgZmlsdGVyVHlwZXM6ID9BcnJheTxTZWFyY2hSZXN1bHRUeXBlPixcbiAgICAgIHNlYXJjaFBvc3RmaXg6ID9zdHJpbmdcbiAgICApOiBQcm9taXNlPEFycmF5PGFueT4+IHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gTnVsbEhhY2tDbGllbnQ7XG4iXX0=