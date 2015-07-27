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
var LazyTreeNode = (function () {

  /**
   * @param fetchChildren returns a Promise that resolves to an Immutable.List
   *     of LazyTreeNode objects.
   */

  function LazyTreeNode(item, parent, isContainer, fetchChildren) {
    _classCallCheck(this, LazyTreeNode);

    this.__item = item;
    this.__parent = parent;
    this.__isContainer = isContainer;
    this._fetchChildren = fetchChildren;
    this._children = null;
    this._isCacheValid = false;
    this._pendingFetch = null;
    this.__key = null;
  }

  _createClass(LazyTreeNode, [{
    key: 'isRoot',
    value: function isRoot() {
      return this.__parent === null;
    }
  }, {
    key: 'getParent',
    value: function getParent() {
      return this.__parent;
    }
  }, {
    key: 'getItem',
    value: function getItem() {
      return this.__item;
    }
  }, {
    key: 'getCachedChildren',
    value: function getCachedChildren() {
      return this._children;
    }
  }, {
    key: 'fetchChildren',
    value: function fetchChildren() {
      var _this = this;

      var pendingFetch = this._pendingFetch;
      if (!pendingFetch) {
        pendingFetch = this._fetchChildren(this).then(function (children) {
          // Store the children before returning them from the Promise.
          _this._children = children;
          _this._isCacheValid = true;
          return children;
        });
        this._pendingFetch = pendingFetch;

        // Make sure that whether the fetch succeeds or fails, the _pendingFetch
        // field is cleared.
        var clear = function clear() {
          _this._pendingFetch = null;
        };
        pendingFetch.then(clear, clear);
      }
      return pendingFetch;
    }
  }, {
    key: 'getKey',

    /**
     * Each node should have a key that uniquely identifies it among the
     * LazyTreeNodes that make up the tree.
     */
    value: function getKey() {
      var key = this.__key;
      if (!key) {
        // TODO(mbolin): Escape slashes.
        var prefix = this.__parent ? this.__parent.getKey() : '/';
        var suffix = this.__isContainer ? '/' : '';
        key = prefix + this.getLabel() + suffix;
        this.__key = key;
      }
      return key;
    }
  }, {
    key: 'getLabel',

    /**
     * @return the string that the tree UI should display for the node
     */
    value: function getLabel() {
      throw new Error('subclasses must override this method');
    }
  }, {
    key: 'isContainer',
    value: function isContainer() {
      return this.__isContainer;
    }
  }, {
    key: 'isCacheValid',
    value: function isCacheValid() {
      return this._isCacheValid;
    }
  }, {
    key: 'invalidateCache',
    value: function invalidateCache() {
      this._isCacheValid = false;
    }
  }]);

  return LazyTreeNode;
})();

module.exports = LazyTreeNode;

// Protected

// Private
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtdHJlZS9ub2RlX21vZHVsZXMvbnVjbGlkZS11aS10cmVlL2xpYi9MYXp5VHJlZU5vZGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBQSxXQUFXLENBQUM7SUFhTixZQUFZOzs7Ozs7O0FBa0JMLFdBbEJQLFlBQVksQ0FtQlosSUFBUyxFQUNULE1BQXFCLEVBQ3JCLFdBQW9CLEVBQ3BCLGFBQThDLEVBQUU7MEJBdEJoRCxZQUFZOztBQXVCZCxRQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztBQUNuQixRQUFJLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQztBQUN2QixRQUFJLENBQUMsYUFBYSxHQUFHLFdBQVcsQ0FBQztBQUNqQyxRQUFJLENBQUMsY0FBYyxHQUFHLGFBQWEsQ0FBQztBQUNwQyxRQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztBQUN0QixRQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztBQUMzQixRQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztBQUMxQixRQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztHQUNuQjs7ZUEvQkcsWUFBWTs7V0FpQ1Ysa0JBQVk7QUFDaEIsYUFBTyxJQUFJLENBQUMsUUFBUSxLQUFLLElBQUksQ0FBQztLQUMvQjs7O1dBRVEscUJBQWtCO0FBQ3pCLGFBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztLQUN0Qjs7O1dBRU0sbUJBQVE7QUFDYixhQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7S0FDcEI7OztXQUVnQiw2QkFBa0M7QUFDakQsYUFBTyxJQUFJLENBQUMsU0FBUyxDQUFDO0tBQ3ZCOzs7V0FFWSx5QkFBWTs7O0FBQ3ZCLFVBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUM7QUFDdEMsVUFBSSxDQUFDLFlBQVksRUFBRTtBQUNqQixvQkFBWSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUMsUUFBUSxFQUFLOztBQUV0RCxnQkFBSyxTQUFTLEdBQUcsUUFBUSxDQUFDO0FBQzFCLGdCQUFLLGFBQWEsR0FBRyxJQUFJLENBQUM7QUFDMUIsaUJBQU8sUUFBUSxDQUFDO1NBQ2pCLENBQUMsQ0FBQztBQUNQLFlBQUksQ0FBQyxhQUFhLEdBQUcsWUFBWSxDQUFDOzs7O0FBSWxDLFlBQUksS0FBSyxHQUFHLFNBQVIsS0FBSyxHQUFTO0FBQ2hCLGdCQUFLLGFBQWEsR0FBRyxJQUFJLENBQUM7U0FDM0IsQ0FBQztBQUNGLG9CQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztPQUNqQztBQUNELGFBQU8sWUFBWSxDQUFDO0tBQ3JCOzs7Ozs7OztXQU1LLGtCQUFXO0FBQ2YsVUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztBQUNyQixVQUFJLENBQUMsR0FBRyxFQUFFOztBQUVSLFlBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUM7QUFDMUQsWUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLGFBQWEsR0FBRyxHQUFHLEdBQUcsRUFBRSxDQUFDO0FBQzNDLFdBQUcsR0FBRyxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLE1BQU0sQ0FBQztBQUN4QyxZQUFJLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQztPQUNsQjtBQUNELGFBQU8sR0FBRyxDQUFDO0tBQ1o7Ozs7Ozs7V0FLTyxvQkFBVztBQUNqQixZQUFNLElBQUksS0FBSyxDQUFDLHNDQUFzQyxDQUFDLENBQUM7S0FDekQ7OztXQUVVLHVCQUFZO0FBQ3JCLGFBQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztLQUMzQjs7O1dBRVcsd0JBQVk7QUFDdEIsYUFBTyxJQUFJLENBQUMsYUFBYSxDQUFDO0tBQzNCOzs7V0FFYywyQkFBUztBQUN0QixVQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztLQUM1Qjs7O1NBdkdHLFlBQVk7OztBQTJHbEIsTUFBTSxDQUFDLE9BQU8sR0FBRyxZQUFZLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL251Y2xpZGUtZmlsZS10cmVlL25vZGVfbW9kdWxlcy9udWNsaWRlLXVpLXRyZWUvbGliL0xhenlUcmVlTm9kZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbmltcG9ydCB0eXBlIEltbXV0YWJsZSBmcm9tICdpbW11dGFibGUnO1xuXG5jbGFzcyBMYXp5VHJlZU5vZGUge1xuXG4gIC8vIFByb3RlY3RlZFxuICBfX2lzQ29udGFpbmVyOiBib29sZWFuO1xuICBfX2l0ZW06IGFueTtcbiAgX19rZXk6ID9zdHJpbmc7XG4gIF9fcGFyZW50OiA/TGF6eVRyZWVOb2RlO1xuXG4gIC8vIFByaXZhdGVcbiAgX2NoaWxkcmVuOiA/SW1tdXRhYmxlLkxpc3Q7XG4gIF9mZXRjaENoaWxkcmVuOiAobm9kZTogTGF6eVRyZWVOb2RlKSA9PiBQcm9taXNlO1xuICBfaXNDYWNoZVZhbGlkOiBib29sZWFuO1xuICBfcGVuZGluZ0ZldGNoOiA/UHJvbWlzZTtcblxuICAvKipcbiAgICogQHBhcmFtIGZldGNoQ2hpbGRyZW4gcmV0dXJucyBhIFByb21pc2UgdGhhdCByZXNvbHZlcyB0byBhbiBJbW11dGFibGUuTGlzdFxuICAgKiAgICAgb2YgTGF6eVRyZWVOb2RlIG9iamVjdHMuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIGl0ZW06IGFueSxcbiAgICAgIHBhcmVudDogP0xhenlUcmVlTm9kZSxcbiAgICAgIGlzQ29udGFpbmVyOiBib29sZWFuLFxuICAgICAgZmV0Y2hDaGlsZHJlbjogKG5vZGU6IExhenlUcmVlTm9kZSkgPT4gUHJvbWlzZSkge1xuICAgIHRoaXMuX19pdGVtID0gaXRlbTtcbiAgICB0aGlzLl9fcGFyZW50ID0gcGFyZW50O1xuICAgIHRoaXMuX19pc0NvbnRhaW5lciA9IGlzQ29udGFpbmVyO1xuICAgIHRoaXMuX2ZldGNoQ2hpbGRyZW4gPSBmZXRjaENoaWxkcmVuO1xuICAgIHRoaXMuX2NoaWxkcmVuID0gbnVsbDtcbiAgICB0aGlzLl9pc0NhY2hlVmFsaWQgPSBmYWxzZTtcbiAgICB0aGlzLl9wZW5kaW5nRmV0Y2ggPSBudWxsO1xuICAgIHRoaXMuX19rZXkgPSBudWxsO1xuICB9XG5cbiAgaXNSb290KCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9fcGFyZW50ID09PSBudWxsO1xuICB9XG5cbiAgZ2V0UGFyZW50KCk6ID9MYXp5VHJlZU5vZGUge1xuICAgIHJldHVybiB0aGlzLl9fcGFyZW50O1xuICB9XG5cbiAgZ2V0SXRlbSgpOiBhbnkge1xuICAgIHJldHVybiB0aGlzLl9faXRlbTtcbiAgfVxuXG4gIGdldENhY2hlZENoaWxkcmVuKCk6ID9JbW11dGFibGUuTGlzdDxMYXp5VHJlZU5vZGU+IHtcbiAgICByZXR1cm4gdGhpcy5fY2hpbGRyZW47XG4gIH1cblxuICBmZXRjaENoaWxkcmVuKCk6IFByb21pc2Uge1xuICAgIHZhciBwZW5kaW5nRmV0Y2ggPSB0aGlzLl9wZW5kaW5nRmV0Y2g7XG4gICAgaWYgKCFwZW5kaW5nRmV0Y2gpIHtcbiAgICAgIHBlbmRpbmdGZXRjaCA9IHRoaXMuX2ZldGNoQ2hpbGRyZW4odGhpcykudGhlbigoY2hpbGRyZW4pID0+IHtcbiAgICAgICAgICAgIC8vIFN0b3JlIHRoZSBjaGlsZHJlbiBiZWZvcmUgcmV0dXJuaW5nIHRoZW0gZnJvbSB0aGUgUHJvbWlzZS5cbiAgICAgICAgICAgIHRoaXMuX2NoaWxkcmVuID0gY2hpbGRyZW47XG4gICAgICAgICAgICB0aGlzLl9pc0NhY2hlVmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuIGNoaWxkcmVuO1xuICAgICAgICAgIH0pO1xuICAgICAgdGhpcy5fcGVuZGluZ0ZldGNoID0gcGVuZGluZ0ZldGNoO1xuXG4gICAgICAvLyBNYWtlIHN1cmUgdGhhdCB3aGV0aGVyIHRoZSBmZXRjaCBzdWNjZWVkcyBvciBmYWlscywgdGhlIF9wZW5kaW5nRmV0Y2hcbiAgICAgIC8vIGZpZWxkIGlzIGNsZWFyZWQuXG4gICAgICB2YXIgY2xlYXIgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuX3BlbmRpbmdGZXRjaCA9IG51bGw7XG4gICAgICB9O1xuICAgICAgcGVuZGluZ0ZldGNoLnRoZW4oY2xlYXIsIGNsZWFyKTtcbiAgICB9XG4gICAgcmV0dXJuIHBlbmRpbmdGZXRjaDtcbiAgfVxuXG4gIC8qKlxuICAgKiBFYWNoIG5vZGUgc2hvdWxkIGhhdmUgYSBrZXkgdGhhdCB1bmlxdWVseSBpZGVudGlmaWVzIGl0IGFtb25nIHRoZVxuICAgKiBMYXp5VHJlZU5vZGVzIHRoYXQgbWFrZSB1cCB0aGUgdHJlZS5cbiAgICovXG4gIGdldEtleSgpOiBzdHJpbmcge1xuICAgIHZhciBrZXkgPSB0aGlzLl9fa2V5O1xuICAgIGlmICgha2V5KSB7XG4gICAgICAvLyBUT0RPKG1ib2xpbik6IEVzY2FwZSBzbGFzaGVzLlxuICAgICAgdmFyIHByZWZpeCA9IHRoaXMuX19wYXJlbnQgPyB0aGlzLl9fcGFyZW50LmdldEtleSgpIDogJy8nO1xuICAgICAgdmFyIHN1ZmZpeCA9IHRoaXMuX19pc0NvbnRhaW5lciA/ICcvJyA6ICcnO1xuICAgICAga2V5ID0gcHJlZml4ICsgdGhpcy5nZXRMYWJlbCgpICsgc3VmZml4O1xuICAgICAgdGhpcy5fX2tleSA9IGtleTtcbiAgICB9XG4gICAgcmV0dXJuIGtleTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHRoZSBzdHJpbmcgdGhhdCB0aGUgdHJlZSBVSSBzaG91bGQgZGlzcGxheSBmb3IgdGhlIG5vZGVcbiAgICovXG4gIGdldExhYmVsKCk6IHN0cmluZyB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzdWJjbGFzc2VzIG11c3Qgb3ZlcnJpZGUgdGhpcyBtZXRob2QnKTtcbiAgfVxuXG4gIGlzQ29udGFpbmVyKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9faXNDb250YWluZXI7XG4gIH1cblxuICBpc0NhY2hlVmFsaWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2lzQ2FjaGVWYWxpZDtcbiAgfVxuXG4gIGludmFsaWRhdGVDYWNoZSgpOiB2b2lkIHtcbiAgICB0aGlzLl9pc0NhY2hlVmFsaWQgPSBmYWxzZTtcbiAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gTGF6eVRyZWVOb2RlO1xuIl19