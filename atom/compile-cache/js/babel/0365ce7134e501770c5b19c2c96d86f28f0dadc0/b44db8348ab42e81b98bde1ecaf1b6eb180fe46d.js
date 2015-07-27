'use babel';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _require = require('./hack');

var findDiagnostics = _require.findDiagnostics;

var _require2 = require('nuclide-hack-common/lib/constants');

var HACK_GRAMMAR = _require2.HACK_GRAMMAR;

module.exports = {
  grammarScopes: [HACK_GRAMMAR],
  scope: 'file',
  lintOnFly: true,
  lint: _asyncToGenerator(function* (textEditor) {
    var file = textEditor.getBuffer().file;
    if (!file) {
      return [];
    }

    var diagnostics = yield findDiagnostics(textEditor);
    return diagnostics.length ? diagnostics : [];
  })
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWhhY2svbGliL0hhY2tMaW50ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7OztlQVdZLE9BQU8sQ0FBQyxRQUFRLENBQUM7O0lBQXBDLGVBQWUsWUFBZixlQUFlOztnQkFDQyxPQUFPLENBQUMsbUNBQW1DLENBQUM7O0lBQTVELFlBQVksYUFBWixZQUFZOztBQUVqQixNQUFNLENBQUMsT0FBTyxHQUFHO0FBQ2YsZUFBYSxFQUFFLENBQUMsWUFBWSxDQUFDO0FBQzdCLE9BQUssRUFBRSxNQUFNO0FBQ2IsV0FBUyxFQUFFLElBQUk7QUFDZixNQUFVLG9CQUFBLFdBQUMsVUFBc0IsRUFBMEI7QUFDekQsUUFBSSxJQUFJLEdBQUcsVUFBVSxDQUFDLFNBQVMsRUFBRSxDQUFDLElBQUksQ0FBQztBQUN2QyxRQUFJLENBQUMsSUFBSSxFQUFFO0FBQ1QsYUFBTyxFQUFFLENBQUM7S0FDWDs7QUFFRCxRQUFJLFdBQVcsR0FBRyxNQUFNLGVBQWUsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNwRCxXQUFPLFdBQVcsQ0FBQyxNQUFNLEdBQUcsV0FBVyxHQUFHLEVBQUUsQ0FBQztHQUM5QyxDQUFBO0NBQ0YsQ0FBQyIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvbnVjbGlkZS1oYWNrL2xpYi9IYWNrTGludGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxudmFyIHtmaW5kRGlhZ25vc3RpY3N9ID0gcmVxdWlyZSgnLi9oYWNrJyk7XG52YXIge0hBQ0tfR1JBTU1BUn0gPSByZXF1aXJlKCdudWNsaWRlLWhhY2stY29tbW9uL2xpYi9jb25zdGFudHMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdyYW1tYXJTY29wZXM6IFtIQUNLX0dSQU1NQVJdLFxuICBzY29wZTogJ2ZpbGUnLFxuICBsaW50T25GbHk6IHRydWUsXG4gIGFzeW5jIGxpbnQodGV4dEVkaXRvcjogVGV4dEVkaXRvcik6IFByb21pc2U8QXJyYXk8T2JqZWN0Pj4ge1xuICAgIHZhciBmaWxlID0gdGV4dEVkaXRvci5nZXRCdWZmZXIoKS5maWxlO1xuICAgIGlmICghZmlsZSkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIHZhciBkaWFnbm9zdGljcyA9IGF3YWl0IGZpbmREaWFnbm9zdGljcyh0ZXh0RWRpdG9yKTtcbiAgICByZXR1cm4gZGlhZ25vc3RpY3MubGVuZ3RoID8gZGlhZ25vc3RpY3MgOiBbXTtcbiAgfSxcbn07XG4iXX0=