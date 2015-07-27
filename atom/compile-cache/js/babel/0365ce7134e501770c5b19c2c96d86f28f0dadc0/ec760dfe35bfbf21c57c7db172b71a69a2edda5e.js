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

var hack = require('./hack');

module.exports = (function () {
  function TypeHintProvider() {
    _classCallCheck(this, TypeHintProvider);
  }

  _createClass(TypeHintProvider, [{
    key: 'typeHint',
    value: function typeHint(editor, position) {
      return hack.typeHintFromEditor(editor, position);
    }
  }]);

  return TypeHintProvider;
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWhhY2svbGliL1R5cGVIaW50UHJvdmlkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7O0FBV1osSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDOztBQUU3QixNQUFNLENBQUMsT0FBTztXQUFTLGdCQUFnQjswQkFBaEIsZ0JBQWdCOzs7ZUFBaEIsZ0JBQWdCOztXQUU3QixrQkFBQyxNQUFrQixFQUFFLFFBQWUsRUFBcUI7QUFDL0QsYUFBTyxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0tBQ2xEOzs7U0FKb0IsZ0JBQWdCO0lBTXRDLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL251Y2xpZGUtaGFjay9saWIvVHlwZUhpbnRQcm92aWRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbnZhciBoYWNrID0gcmVxdWlyZSgnLi9oYWNrJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgVHlwZUhpbnRQcm92aWRlciB7XG5cbiAgdHlwZUhpbnQoZWRpdG9yOiBUZXh0RWRpdG9yLCBwb3NpdGlvbjogUG9pbnQpOiBQcm9taXNlPFR5cGVIaW50PiB7XG4gICAgcmV0dXJuIGhhY2sudHlwZUhpbnRGcm9tRWRpdG9yKGVkaXRvciwgcG9zaXRpb24pO1xuICB9XG5cbn07XG4iXX0=