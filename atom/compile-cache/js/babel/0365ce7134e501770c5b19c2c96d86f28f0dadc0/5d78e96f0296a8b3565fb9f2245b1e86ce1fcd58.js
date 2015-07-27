'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

module.exports = Object.defineProperties({}, {
  findHgRepository: {
    get: function get() {
      return require('./hg-repository');
    },
    configurable: true,
    enumerable: true
  }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWhnLXJlcG9zaXRvcnkvbm9kZV9tb2R1bGVzL251Y2xpZGUtc291cmNlLWNvbnRyb2wtaGVscGVycy9saWIvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7O0FBV1osTUFBTSxDQUFDLE9BQU8sMkJBQUcsRUFJaEI7QUFISyxrQkFBZ0I7U0FBQSxlQUFHO0FBQ3JCLGFBQU8sT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7S0FDbkM7Ozs7RUFDRixDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWhnLXJlcG9zaXRvcnkvbm9kZV9tb2R1bGVzL251Y2xpZGUtc291cmNlLWNvbnRyb2wtaGVscGVycy9saWIvbWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBnZXQgZmluZEhnUmVwb3NpdG9yeSgpIHtcbiAgICByZXR1cm4gcmVxdWlyZSgnLi9oZy1yZXBvc2l0b3J5Jyk7XG4gIH0sXG59O1xuIl19