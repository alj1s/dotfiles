var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

'use babel';

var React = require('react-for-atom');

/**
 * Base class for a provider for QuickSelectionComponent.
 */

var QuickSelectionProvider = (function () {
  function QuickSelectionProvider() {
    _classCallCheck(this, QuickSelectionProvider);
  }

  _createClass(QuickSelectionProvider, [{
    key: 'getPromptText',

    /**
     *  gets prompt text
     */
    value: function getPromptText() {
      throw new Error('Not implemented');
    }
  }, {
    key: 'getDebounceDelay',

    /**
     * Returns the number of milliseconds used to debounce any calls to executeQuery.
     */
    value: function getDebounceDelay() {
      return 200;
    }
  }, {
    key: 'executeQuery',

    /**
     * Asynchronously executes a search based on @query.
     */
    value: function executeQuery(query) {
      return Promise.reject('Not implemented');
    }
  }, {
    key: 'getComponentForItem',

    /**
     * Returns a ReactElement based on @item, which should be an
     * object returned from executeQuery, above.
     */
    value: function getComponentForItem(item) {
      return React.createElement(
        'div',
        null,
        item.toString()
      );
    }
  }]);

  return QuickSelectionProvider;
})();

module.exports = QuickSelectionProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXF1aWNrLW9wZW4vbGliL1F1aWNrU2VsZWN0aW9uUHJvdmlkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBQSxXQUFXLENBQUM7O0FBZ0JaLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDOzs7Ozs7SUFLaEMsc0JBQXNCO1dBQXRCLHNCQUFzQjswQkFBdEIsc0JBQXNCOzs7ZUFBdEIsc0JBQXNCOzs7Ozs7V0FJYix5QkFBVztBQUN0QixZQUFNLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7S0FDcEM7Ozs7Ozs7V0FLZSw0QkFBVztBQUN6QixhQUFPLEdBQUcsQ0FBQztLQUNaOzs7Ozs7O1dBS1csc0JBQUMsS0FBYSxFQUF3QjtBQUNoRCxhQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztLQUMxQzs7Ozs7Ozs7V0FNa0IsNkJBQUMsSUFBZ0IsRUFBZ0I7QUFDbEQsYUFBTzs7O1FBQU0sSUFBSSxDQUFDLFFBQVEsRUFBRTtPQUFPLENBQUE7S0FDcEM7OztTQTVCRyxzQkFBc0I7OztBQWdDNUIsTUFBTSxDQUFDLE9BQU8sR0FBRyxzQkFBc0IsQ0FBQyIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvbnVjbGlkZS1xdWljay1vcGVuL2xpYi9RdWlja1NlbGVjdGlvblByb3ZpZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxuaW1wb3J0IHR5cGUge1xuICBGaWxlUmVzdWx0LFxuICBHcm91cGVkUmVzdWx0UHJvbWlzZSxcbn0gZnJvbSAnLi90eXBlcyc7XG5cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0LWZvci1hdG9tJyk7XG5cbi8qKlxuICogQmFzZSBjbGFzcyBmb3IgYSBwcm92aWRlciBmb3IgUXVpY2tTZWxlY3Rpb25Db21wb25lbnQuXG4gKi9cbmNsYXNzIFF1aWNrU2VsZWN0aW9uUHJvdmlkZXIge1xuICAvKipcbiAgICogIGdldHMgcHJvbXB0IHRleHRcbiAgICovXG4gIGdldFByb21wdFRleHQoKTogc3RyaW5nIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBpbXBsZW1lbnRlZCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdXNlZCB0byBkZWJvdW5jZSBhbnkgY2FsbHMgdG8gZXhlY3V0ZVF1ZXJ5LlxuICAgKi9cbiAgZ2V0RGVib3VuY2VEZWxheSgpOiBudW1iZXIge1xuICAgIHJldHVybiAyMDA7XG4gIH1cblxuICAvKipcbiAgICogQXN5bmNocm9ub3VzbHkgZXhlY3V0ZXMgYSBzZWFyY2ggYmFzZWQgb24gQHF1ZXJ5LlxuICAgKi9cbiAgZXhlY3V0ZVF1ZXJ5KHF1ZXJ5OiBzdHJpbmcpOiBHcm91cGVkUmVzdWx0UHJvbWlzZSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCdOb3QgaW1wbGVtZW50ZWQnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgUmVhY3RFbGVtZW50IGJhc2VkIG9uIEBpdGVtLCB3aGljaCBzaG91bGQgYmUgYW5cbiAgICogb2JqZWN0IHJldHVybmVkIGZyb20gZXhlY3V0ZVF1ZXJ5LCBhYm92ZS5cbiAgICovXG4gIGdldENvbXBvbmVudEZvckl0ZW0oaXRlbTogRmlsZVJlc3VsdCk6IFJlYWN0RWxlbWVudCB7XG4gICAgcmV0dXJuIDxkaXY+e2l0ZW0udG9TdHJpbmcoKX08L2Rpdj5cbiAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gUXVpY2tTZWxlY3Rpb25Qcm92aWRlcjtcbiJdfQ==