'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
module.exports = {

  getConfigValueAsync: function getConfigValueAsync(key) {
    return (function () {
      var observedValue;
      var promiseThatResolvesToValue = new Promise(function (resolve, reject) {
        // Note that this creates an observer for the key that will never be
        // disabled: the key will continue to be observed for the lifetime of
        // the app.
        atom.config.observe(key, function (value) {
          // TODO(mbolin): Figure out why this is called with undefined sometimes.
          if (value !== undefined) {
            observedValue = value;
            promiseThatResolvesToValue = undefined;
            resolve(value);
          }
        });
      });

      return function () {
        return observedValue ? Promise.resolve(observedValue) : promiseThatResolvesToValue;
      };
    })();
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZsb3cvbm9kZV9tb2R1bGVzL251Y2xpZGUtY29tbW9ucy9saWIvY29uZmlnLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7OztBQVVaLE1BQU0sQ0FBQyxPQUFPLEdBQUc7O0FBRWYscUJBQW1CLEVBQUEsNkJBQUMsR0FBRyxFQUFpQjtBQUN0QyxXQUFPLENBQUMsWUFBVztBQUNqQixVQUFJLGFBQWEsQ0FBQztBQUNsQixVQUFJLDBCQUEwQixHQUFHLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBSzs7OztBQUloRSxZQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsVUFBQSxLQUFLLEVBQUk7O0FBRWhDLGNBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtBQUN2Qix5QkFBYSxHQUFHLEtBQUssQ0FBQztBQUN0QixzQ0FBMEIsR0FBRyxTQUFTLENBQUM7QUFDdkMsbUJBQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztXQUNoQjtTQUNGLENBQUMsQ0FBQztPQUNKLENBQUMsQ0FBQzs7QUFFSCxhQUFPLFlBQVc7QUFDaEIsZUFBTyxhQUFhLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsR0FDakQsMEJBQTBCLENBQUM7T0FDaEMsQ0FBQztLQUNILENBQUEsRUFBRyxDQUFDO0dBQ047Q0FDRixDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZsb3cvbm9kZV9tb2R1bGVzL251Y2xpZGUtY29tbW9ucy9saWIvY29uZmlnLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gIGdldENvbmZpZ1ZhbHVlQXN5bmMoa2V5KTogKCkgPT4gUHJvbWlzZSB7XG4gICAgcmV0dXJuIChmdW5jdGlvbigpIHtcbiAgICAgIHZhciBvYnNlcnZlZFZhbHVlO1xuICAgICAgdmFyIHByb21pc2VUaGF0UmVzb2x2ZXNUb1ZhbHVlID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAvLyBOb3RlIHRoYXQgdGhpcyBjcmVhdGVzIGFuIG9ic2VydmVyIGZvciB0aGUga2V5IHRoYXQgd2lsbCBuZXZlciBiZVxuICAgICAgICAvLyBkaXNhYmxlZDogdGhlIGtleSB3aWxsIGNvbnRpbnVlIHRvIGJlIG9ic2VydmVkIGZvciB0aGUgbGlmZXRpbWUgb2ZcbiAgICAgICAgLy8gdGhlIGFwcC5cbiAgICAgICAgYXRvbS5jb25maWcub2JzZXJ2ZShrZXksIHZhbHVlID0+IHtcbiAgICAgICAgICAvLyBUT0RPKG1ib2xpbik6IEZpZ3VyZSBvdXQgd2h5IHRoaXMgaXMgY2FsbGVkIHdpdGggdW5kZWZpbmVkIHNvbWV0aW1lcy5cbiAgICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgb2JzZXJ2ZWRWYWx1ZSA9IHZhbHVlO1xuICAgICAgICAgICAgcHJvbWlzZVRoYXRSZXNvbHZlc1RvVmFsdWUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICByZXNvbHZlKHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIG9ic2VydmVkVmFsdWUgPyBQcm9taXNlLnJlc29sdmUob2JzZXJ2ZWRWYWx1ZSkgOlxuICAgICAgICAgICAgcHJvbWlzZVRoYXRSZXNvbHZlc1RvVmFsdWU7XG4gICAgICB9O1xuICAgIH0pKCk7XG4gIH0sXG59O1xuIl19