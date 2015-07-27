'use babel';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var DiffViewElement = (function (_HTMLElement) {
  function DiffViewElement() {
    _classCallCheck(this, DiffViewElement);

    _get(Object.getPrototypeOf(DiffViewElement.prototype), 'constructor', this).apply(this, arguments);
  }

  _inherits(DiffViewElement, _HTMLElement);

  _createClass(DiffViewElement, [{
    key: 'initialize',
    value: function initialize(model) {
      this._model = model;
      return this;
    }
  }, {
    key: 'getTitle',

    /**
     * Return the tab title for the opened diff view tab item.
     */
    value: function getTitle() {
      return 'Diff View';
    }
  }, {
    key: 'getURI',

    /**
     * Return the tab URI for the opened diff view tab item.
     * This guarantees only one diff view will be opened per URI.
     */
    value: function getURI() {
      return this._model.getURI();
    }
  }]);

  return DiffViewElement;
})(HTMLElement);

module.exports = DiffViewElement = document.registerElement('nuclide-diff-view', {
  prototype: DiffViewElement.prototype
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWRpZmYtdmlldy9saWIvRGlmZlZpZXdFbGVtZW50LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFXTixlQUFlO1dBQWYsZUFBZTswQkFBZixlQUFlOzsrQkFBZixlQUFlOzs7WUFBZixlQUFlOztlQUFmLGVBQWU7O1dBRVQsb0JBQUMsS0FBSyxFQUFFO0FBQ2hCLFVBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO0FBQ3BCLGFBQU8sSUFBSSxDQUFDO0tBQ2I7Ozs7Ozs7V0FLTyxvQkFBRztBQUNULGFBQU8sV0FBVyxDQUFDO0tBQ3BCOzs7Ozs7OztXQU1LLGtCQUFHO0FBQ1AsYUFBTyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0tBQzdCOzs7U0FwQkcsZUFBZTtHQUFTLFdBQVc7O0FBd0J6QyxNQUFNLENBQUMsT0FBTyxHQUFHLGVBQWUsR0FBRyxRQUFRLENBQUMsZUFBZSxDQUFDLG1CQUFtQixFQUFFO0FBQy9FLFdBQVMsRUFBRSxlQUFlLENBQUMsU0FBUztDQUNyQyxDQUFDLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL251Y2xpZGUtZGlmZi12aWV3L2xpYi9EaWZmVmlld0VsZW1lbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG5jbGFzcyBEaWZmVmlld0VsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG5cbiAgaW5pdGlhbGl6ZShtb2RlbCkge1xuICAgIHRoaXMuX21vZGVsID0gbW9kZWw7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIHRoZSB0YWIgdGl0bGUgZm9yIHRoZSBvcGVuZWQgZGlmZiB2aWV3IHRhYiBpdGVtLlxuICAgKi9cbiAgZ2V0VGl0bGUoKSB7XG4gICAgcmV0dXJuICdEaWZmIFZpZXcnO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiB0aGUgdGFiIFVSSSBmb3IgdGhlIG9wZW5lZCBkaWZmIHZpZXcgdGFiIGl0ZW0uXG4gICAqIFRoaXMgZ3VhcmFudGVlcyBvbmx5IG9uZSBkaWZmIHZpZXcgd2lsbCBiZSBvcGVuZWQgcGVyIFVSSS5cbiAgICovXG4gIGdldFVSSSgpIHtcbiAgICByZXR1cm4gdGhpcy5fbW9kZWwuZ2V0VVJJKCk7XG4gIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IERpZmZWaWV3RWxlbWVudCA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCgnbnVjbGlkZS1kaWZmLXZpZXcnLCB7XG4gIHByb3RvdHlwZTogRGlmZlZpZXdFbGVtZW50LnByb3RvdHlwZSxcbn0pO1xuIl19