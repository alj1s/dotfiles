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

var _require = require('nuclide-ui-tree');

var LazyTreeNode = _require.LazyTreeNode;

var LazyFileTreeNode = (function (_LazyTreeNode) {
  function LazyFileTreeNode(file, parent, fetchChildren) {
    _classCallCheck(this, LazyFileTreeNode);

    _get(Object.getPrototypeOf(LazyFileTreeNode.prototype), 'constructor', this).call(this, file, parent, file.isDirectory(), fetchChildren);
    this._file = file;
    this.__key = null;
  }

  _inherits(LazyFileTreeNode, _LazyTreeNode);

  _createClass(LazyFileTreeNode, [{
    key: 'getCachedChildren',

    /**
     * @return a sorted list where directories appear before files and items
     *     are alphabetized by base name within their own type.
     */
    value: function getCachedChildren() {
      return _get(Object.getPrototypeOf(LazyFileTreeNode.prototype), 'getCachedChildren', this).call(this);
    }
  }, {
    key: 'getKey',
    value: function getKey() {
      if (!this.__key) {
        var label = this.__parent ? this.__parent.getKey() + this.getLabel() : this._file.getPath();
        var suffix = this.__isContainer && !label.endsWith('/') ? '/' : '';
        this.__key = label + suffix;
      }
      return this.__key;
    }
  }, {
    key: 'getLabel',
    value: function getLabel() {
      return this._file.getBaseName();
    }
  }, {
    key: 'isSymlink',
    value: function isSymlink() {
      // The `symlink` property is assigned in the atom$Directory and atom$File
      // constructors with the `@symlink` class property syntax in its argument
      // list.
      return this._file.symlink;
    }
  }]);

  return LazyFileTreeNode;
})(LazyTreeNode);

module.exports = LazyFileTreeNode;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtdHJlZS9saWIvTGF6eUZpbGVUcmVlTm9kZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2VBV1MsT0FBTyxDQUFDLGlCQUFpQixDQUFDOztJQUExQyxZQUFZLFlBQVosWUFBWTs7SUFFWCxnQkFBZ0I7QUFJVCxXQUpQLGdCQUFnQixDQUtoQixJQUFnQyxFQUNoQyxNQUF5QixFQUN6QixhQUE4QyxFQUFFOzBCQVBoRCxnQkFBZ0I7O0FBUWxCLCtCQVJFLGdCQUFnQiw2Q0FRWixJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxhQUFhLEVBQUU7QUFDdkQsUUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7QUFDbEIsUUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7R0FDbkI7O1lBWEcsZ0JBQWdCOztlQUFoQixnQkFBZ0I7Ozs7Ozs7V0FpQkgsNkJBQWtDO0FBQ2pELHdDQWxCRSxnQkFBZ0IsbURBa0JlO0tBQ2xDOzs7V0FFSyxrQkFBVztBQUNmLFVBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFO0FBQ2YsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQzVGLFlBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxhQUFhLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUM7QUFDbkUsWUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLEdBQUcsTUFBTSxDQUFDO09BQzdCO0FBQ0QsYUFBTyxJQUFJLENBQUMsS0FBSyxDQUFDO0tBQ25COzs7V0FFTyxvQkFBVztBQUNqQixhQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUM7S0FDakM7OztXQUVRLHFCQUFZOzs7O0FBSW5CLGFBQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUM7S0FDM0I7OztTQXZDRyxnQkFBZ0I7R0FBUyxZQUFZOztBQTJDM0MsTUFBTSxDQUFDLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQyIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvbnVjbGlkZS1maWxlLXRyZWUvbGliL0xhenlGaWxlVHJlZU5vZGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIge0xhenlUcmVlTm9kZX0gPSByZXF1aXJlKCdudWNsaWRlLXVpLXRyZWUnKTtcblxuY2xhc3MgTGF6eUZpbGVUcmVlTm9kZSBleHRlbmRzIExhenlUcmVlTm9kZSB7XG5cbiAgX2ZpbGU6IChhdG9tJEZpbGUgfCBhdG9tJERpcmVjdG9yeSk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBmaWxlOiBhdG9tJEZpbGUgfCBhdG9tJERpcmVjdG9yeSxcbiAgICAgIHBhcmVudDogP0xhenlGaWxlVHJlZU5vZGUsXG4gICAgICBmZXRjaENoaWxkcmVuOiAobm9kZTogTGF6eVRyZWVOb2RlKSA9PiBQcm9taXNlKSB7XG4gICAgc3VwZXIoZmlsZSwgcGFyZW50LCBmaWxlLmlzRGlyZWN0b3J5KCksIGZldGNoQ2hpbGRyZW4pO1xuICAgIHRoaXMuX2ZpbGUgPSBmaWxlO1xuICAgIHRoaXMuX19rZXkgPSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm4gYSBzb3J0ZWQgbGlzdCB3aGVyZSBkaXJlY3RvcmllcyBhcHBlYXIgYmVmb3JlIGZpbGVzIGFuZCBpdGVtc1xuICAgKiAgICAgYXJlIGFscGhhYmV0aXplZCBieSBiYXNlIG5hbWUgd2l0aGluIHRoZWlyIG93biB0eXBlLlxuICAgKi9cbiAgZ2V0Q2FjaGVkQ2hpbGRyZW4oKTogP0ltbXV0YWJsZS5MaXN0PExhenlUcmVlTm9kZT4ge1xuICAgIHJldHVybiBzdXBlci5nZXRDYWNoZWRDaGlsZHJlbigpO1xuICB9XG5cbiAgZ2V0S2V5KCk6IHN0cmluZyB7XG4gICAgaWYgKCF0aGlzLl9fa2V5KSB7XG4gICAgICB2YXIgbGFiZWwgPSB0aGlzLl9fcGFyZW50ID8gdGhpcy5fX3BhcmVudC5nZXRLZXkoKSArIHRoaXMuZ2V0TGFiZWwoKSA6IHRoaXMuX2ZpbGUuZ2V0UGF0aCgpO1xuICAgICAgdmFyIHN1ZmZpeCA9IHRoaXMuX19pc0NvbnRhaW5lciAmJiAhbGFiZWwuZW5kc1dpdGgoJy8nKSA/ICcvJyA6ICcnO1xuICAgICAgdGhpcy5fX2tleSA9IGxhYmVsICsgc3VmZml4O1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fX2tleTtcbiAgfVxuXG4gIGdldExhYmVsKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuX2ZpbGUuZ2V0QmFzZU5hbWUoKTtcbiAgfVxuXG4gIGlzU3ltbGluaygpOiBib29sZWFuIHtcbiAgICAvLyBUaGUgYHN5bWxpbmtgIHByb3BlcnR5IGlzIGFzc2lnbmVkIGluIHRoZSBhdG9tJERpcmVjdG9yeSBhbmQgYXRvbSRGaWxlXG4gICAgLy8gY29uc3RydWN0b3JzIHdpdGggdGhlIGBAc3ltbGlua2AgY2xhc3MgcHJvcGVydHkgc3ludGF4IGluIGl0cyBhcmd1bWVudFxuICAgIC8vIGxpc3QuXG4gICAgcmV0dXJuIHRoaXMuX2ZpbGUuc3ltbGluaztcbiAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gTGF6eUZpbGVUcmVlTm9kZTtcbiJdfQ==