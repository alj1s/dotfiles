'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

/**
 * O(1)-check if a given object is empty (has no properties, inherited or not)
 */
function isEmpty(obj) {
  for (var key in obj) {
    return false;
  }
  return true;
}

function copyProperties(src, dest) {
  for (var key in src) {
    dest[key] = src[key];
  }
}

/**
 * Modeled after Object.assign():
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
 */
function assign(target) {
  for (var _len = arguments.length, sources = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    sources[_key - 1] = arguments[_key];
  }

  sources.forEach(function (source) {
    return copyProperties(source, target);
  });
  return target;
}

/**
 * Constructs an enumeration with keys equal to their value.
 * e.g. keyMirror({a: null, b: null}) => {a: 'a', b: 'b'}
 *
 * Based off the equivalent function in www.
 */
function keyMirror(obj) {
  var ret = {};
  Object.keys(obj).forEach(function (key) {
    ret[key] = key;
  });
  return ret;
}

module.exports = {
  assign: assign,
  isEmpty: isEmpty,
  keyMirror: keyMirror
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWluc3RhbGxlci9ub2RlX21vZHVsZXMvbnVjbGlkZS1pbnN0YWxsZXItYmFzZS9ub2RlX21vZHVsZXMvbnVjbGlkZS1jb21tb25zL2xpYi9vYmplY3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7OztBQWNaLFNBQVMsT0FBTyxDQUFDLEdBQVcsRUFBUTtBQUNsQyxPQUFLLElBQUksR0FBRyxJQUFJLEdBQUcsRUFBRTtBQUNuQixXQUFPLEtBQUssQ0FBQztHQUNkO0FBQ0QsU0FBTyxJQUFJLENBQUM7Q0FDYjs7QUFFRCxTQUFTLGNBQWMsQ0FBQyxHQUFXLEVBQUUsSUFBWSxFQUFRO0FBQ3ZELE9BQUssSUFBSSxHQUFHLElBQUksR0FBRyxFQUFFO0FBQ25CLFFBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7R0FDdEI7Q0FDRjs7Ozs7O0FBTUQsU0FBUyxNQUFNLENBQUMsTUFBYyxFQUFxQztvQ0FBaEMsT0FBTztBQUFQLFdBQU87OztBQUN4QyxTQUFPLENBQUMsT0FBTyxDQUFDLFVBQUEsTUFBTTtXQUFJLGNBQWMsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDO0dBQUEsQ0FBQyxDQUFDO0FBQzFELFNBQU8sTUFBTSxDQUFDO0NBQ2Y7Ozs7Ozs7O0FBUUQsU0FBUyxTQUFTLENBQUMsR0FBVyxFQUFVO0FBQ3RDLE1BQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztBQUNiLFFBQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQUEsR0FBRyxFQUFJO0FBQzlCLE9BQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUM7R0FDaEIsQ0FBQyxDQUFDO0FBQ0gsU0FBTyxHQUFHLENBQUM7Q0FDWjs7QUFFRCxNQUFNLENBQUMsT0FBTyxHQUFHO0FBQ2YsUUFBTSxFQUFOLE1BQU07QUFDTixTQUFPLEVBQVAsT0FBTztBQUNQLFdBQVMsRUFBVCxTQUFTO0NBQ1YsQ0FBQyIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvbnVjbGlkZS1pbnN0YWxsZXIvbm9kZV9tb2R1bGVzL251Y2xpZGUtaW5zdGFsbGVyLWJhc2Uvbm9kZV9tb2R1bGVzL251Y2xpZGUtY29tbW9ucy9saWIvb2JqZWN0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxuLyoqXG4gKiBPKDEpLWNoZWNrIGlmIGEgZ2l2ZW4gb2JqZWN0IGlzIGVtcHR5IChoYXMgbm8gcHJvcGVydGllcywgaW5oZXJpdGVkIG9yIG5vdClcbiAqL1xuZnVuY3Rpb24gaXNFbXB0eShvYmo6IE9iamVjdCk6IGJvb2wge1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBjb3B5UHJvcGVydGllcyhzcmM6IE9iamVjdCwgZGVzdDogT2JqZWN0KTogdm9pZCB7XG4gIGZvciAodmFyIGtleSBpbiBzcmMpIHtcbiAgICBkZXN0W2tleV0gPSBzcmNba2V5XTtcbiAgfVxufVxuXG4vKipcbiAqIE1vZGVsZWQgYWZ0ZXIgT2JqZWN0LmFzc2lnbigpOlxuICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvT2JqZWN0L2Fzc2lnblxuICovXG5mdW5jdGlvbiBhc3NpZ24odGFyZ2V0OiBPYmplY3QsIC4uLnNvdXJjZXM6IEFycmF5PE9iamVjdD4pOiBPYmplY3Qge1xuICBzb3VyY2VzLmZvckVhY2goc291cmNlID0+IGNvcHlQcm9wZXJ0aWVzKHNvdXJjZSwgdGFyZ2V0KSk7XG4gIHJldHVybiB0YXJnZXQ7XG59XG5cbi8qKlxuICogQ29uc3RydWN0cyBhbiBlbnVtZXJhdGlvbiB3aXRoIGtleXMgZXF1YWwgdG8gdGhlaXIgdmFsdWUuXG4gKiBlLmcuIGtleU1pcnJvcih7YTogbnVsbCwgYjogbnVsbH0pID0+IHthOiAnYScsIGI6ICdiJ31cbiAqXG4gKiBCYXNlZCBvZmYgdGhlIGVxdWl2YWxlbnQgZnVuY3Rpb24gaW4gd3d3LlxuICovXG5mdW5jdGlvbiBrZXlNaXJyb3Iob2JqOiBPYmplY3QpOiBPYmplY3Qge1xuICB2YXIgcmV0ID0ge307XG4gIE9iamVjdC5rZXlzKG9iaikuZm9yRWFjaChrZXkgPT4ge1xuICAgIHJldFtrZXldID0ga2V5O1xuICB9KTtcbiAgcmV0dXJuIHJldDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFzc2lnbixcbiAgaXNFbXB0eSxcbiAga2V5TWlycm9yLFxufTtcbiJdfQ==