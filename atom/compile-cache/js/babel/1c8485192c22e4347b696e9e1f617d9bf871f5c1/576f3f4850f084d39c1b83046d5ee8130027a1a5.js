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

var QuickSelectionProvider = require('./QuickSelectionProvider');

function _loadProvider(providerName) {
  var provider = null;
  try {
    // for now, assume that providers are stored in quick-open/lib
    provider = require('./' + providerName);
  } catch (e) {
    throw new Error('Provider "' + providerName + '" not found', e);
  }
  return provider;
}

/**
 * A singleton cache for search providers and results.
 */

var SearchResultManager = (function () {
  function SearchResultManager() {
    _classCallCheck(this, SearchResultManager);

    this._cachedProviders = {};
  }

  _createClass(SearchResultManager, [{
    key: 'getProvider',

    /**
     * Returns a lazily loaded, cached instance of the search provider with the given name.
     *
     * @param providerName Name of the provider to be `require()`d, instantiated and returned.
     * @return cached provider instance.
     */
    value: function getProvider(providerName) {
      if (!this._cachedProviders[providerName]) {
        var LazyProvider = _loadProvider(providerName);
        this._cachedProviders[providerName] = new LazyProvider();
      }
      return this._cachedProviders[providerName];
    }
  }]);

  return SearchResultManager;
})();

module.exports = new SearchResultManager();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXF1aWNrLW9wZW4vbGliL1NlYXJjaFJlc3VsdE1hbmFnZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7O0FBV1osSUFBSSxzQkFBc0IsR0FBRyxPQUFPLENBQUMsMEJBQTBCLENBQUMsQ0FBQzs7QUFFakUsU0FBUyxhQUFhLENBQUMsWUFBb0IsRUFBRTtBQUMzQyxNQUFJLFFBQVEsR0FBRyxJQUFJLENBQUM7QUFDcEIsTUFBSTs7QUFFRixZQUFRLEdBQUcsT0FBTyxDQUFDLElBQUksR0FBRyxZQUFZLENBQUMsQ0FBQztHQUN6QyxDQUFDLE9BQU8sQ0FBQyxFQUFFO0FBQ1YsVUFBTSxJQUFJLEtBQUssQ0FBQyxZQUFZLEdBQUcsWUFBWSxHQUFHLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQztHQUNqRTtBQUNELFNBQU8sUUFBUSxDQUFDO0NBQ2pCOzs7Ozs7SUFLSyxtQkFBbUI7QUFDWixXQURQLG1CQUFtQixHQUNUOzBCQURWLG1CQUFtQjs7QUFFckIsUUFBSSxDQUFDLGdCQUFnQixHQUFHLEVBQUUsQ0FBQztHQUM1Qjs7ZUFIRyxtQkFBbUI7Ozs7Ozs7OztXQVdaLHFCQUFDLFlBQW9CLEVBQTJCO0FBQ3pELFVBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxDQUFDLEVBQUU7QUFDeEMsWUFBSSxZQUFZLEdBQUcsYUFBYSxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQy9DLFlBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsR0FBRyxJQUFJLFlBQVksRUFBRSxDQUFDO09BQzFEO0FBQ0QsYUFBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxDQUFDLENBQUM7S0FDNUM7OztTQWpCRyxtQkFBbUI7OztBQXFCekIsTUFBTSxDQUFDLE9BQU8sR0FBRyxJQUFJLG1CQUFtQixFQUFFLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL251Y2xpZGUtcXVpY2stb3Blbi9saWIvU2VhcmNoUmVzdWx0TWFuYWdlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbnZhciBRdWlja1NlbGVjdGlvblByb3ZpZGVyID0gcmVxdWlyZSgnLi9RdWlja1NlbGVjdGlvblByb3ZpZGVyJyk7XG5cbmZ1bmN0aW9uIF9sb2FkUHJvdmlkZXIocHJvdmlkZXJOYW1lOiBzdHJpbmcpIHtcbiAgdmFyIHByb3ZpZGVyID0gbnVsbDtcbiAgdHJ5IHtcbiAgICAvLyBmb3Igbm93LCBhc3N1bWUgdGhhdCBwcm92aWRlcnMgYXJlIHN0b3JlZCBpbiBxdWljay1vcGVuL2xpYlxuICAgIHByb3ZpZGVyID0gcmVxdWlyZSgnLi8nICsgcHJvdmlkZXJOYW1lKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHRocm93IG5ldyBFcnJvcignUHJvdmlkZXIgXCInICsgcHJvdmlkZXJOYW1lICsgJ1wiIG5vdCBmb3VuZCcsIGUpO1xuICB9XG4gIHJldHVybiBwcm92aWRlcjtcbn1cblxuLyoqXG4gKiBBIHNpbmdsZXRvbiBjYWNoZSBmb3Igc2VhcmNoIHByb3ZpZGVycyBhbmQgcmVzdWx0cy5cbiAqL1xuY2xhc3MgU2VhcmNoUmVzdWx0TWFuYWdlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX2NhY2hlZFByb3ZpZGVycyA9IHt9O1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBsYXppbHkgbG9hZGVkLCBjYWNoZWQgaW5zdGFuY2Ugb2YgdGhlIHNlYXJjaCBwcm92aWRlciB3aXRoIHRoZSBnaXZlbiBuYW1lLlxuICAgKlxuICAgKiBAcGFyYW0gcHJvdmlkZXJOYW1lIE5hbWUgb2YgdGhlIHByb3ZpZGVyIHRvIGJlIGByZXF1aXJlKClgZCwgaW5zdGFudGlhdGVkIGFuZCByZXR1cm5lZC5cbiAgICogQHJldHVybiBjYWNoZWQgcHJvdmlkZXIgaW5zdGFuY2UuXG4gICAqL1xuICBnZXRQcm92aWRlcihwcm92aWRlck5hbWU6IHN0cmluZykgOiBRdWlja1NlbGVjdGlvblByb3ZpZGVyIHtcbiAgICBpZiAoIXRoaXMuX2NhY2hlZFByb3ZpZGVyc1twcm92aWRlck5hbWVdKSB7XG4gICAgICB2YXIgTGF6eVByb3ZpZGVyID0gX2xvYWRQcm92aWRlcihwcm92aWRlck5hbWUpO1xuICAgICAgdGhpcy5fY2FjaGVkUHJvdmlkZXJzW3Byb3ZpZGVyTmFtZV0gPSBuZXcgTGF6eVByb3ZpZGVyKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9jYWNoZWRQcm92aWRlcnNbcHJvdmlkZXJOYW1lXTtcbiAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IFNlYXJjaFJlc3VsdE1hbmFnZXIoKTtcbiJdfQ==