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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWhhY2svbGliL0hhY2tMaW50ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7OztlQVdZLE9BQU8sQ0FBQyxRQUFRLENBQUM7O0lBQXBDLGVBQWUsWUFBZixlQUFlOztnQkFDQyxPQUFPLENBQUMsbUNBQW1DLENBQUM7O0lBQTVELFlBQVksYUFBWixZQUFZOztBQUVqQixNQUFNLENBQUMsT0FBTyxHQUFHO0FBQ2YsZUFBYSxFQUFFLENBQUMsWUFBWSxDQUFDO0FBQzdCLE9BQUssRUFBRSxNQUFNO0FBQ2IsV0FBUyxFQUFFLElBQUk7QUFDZixBQUFNLE1BQUksb0JBQUEsV0FBQyxVQUFzQixFQUEwQjtBQUN6RCxRQUFJLElBQUksR0FBRyxVQUFVLENBQUMsU0FBUyxFQUFFLENBQUMsSUFBSSxDQUFDO0FBQ3ZDLFFBQUksQ0FBQyxJQUFJLEVBQUU7QUFDVCxhQUFPLEVBQUUsQ0FBQztLQUNYOztBQUVELFFBQUksV0FBVyxHQUFHLE1BQU0sZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3BELFdBQU8sV0FBVyxDQUFDLE1BQU0sR0FBRyxXQUFXLEdBQUcsRUFBRSxDQUFDO0dBQzlDLENBQUE7Q0FDRixDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWhhY2svbGliL0hhY2tMaW50ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIge2ZpbmREaWFnbm9zdGljc30gPSByZXF1aXJlKCcuL2hhY2snKTtcbnZhciB7SEFDS19HUkFNTUFSfSA9IHJlcXVpcmUoJ251Y2xpZGUtaGFjay1jb21tb24vbGliL2NvbnN0YW50cycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ3JhbW1hclNjb3BlczogW0hBQ0tfR1JBTU1BUl0sXG4gIHNjb3BlOiAnZmlsZScsXG4gIGxpbnRPbkZseTogdHJ1ZSxcbiAgYXN5bmMgbGludCh0ZXh0RWRpdG9yOiBUZXh0RWRpdG9yKTogUHJvbWlzZTxBcnJheTxPYmplY3Q+PiB7XG4gICAgdmFyIGZpbGUgPSB0ZXh0RWRpdG9yLmdldEJ1ZmZlcigpLmZpbGU7XG4gICAgaWYgKCFmaWxlKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgdmFyIGRpYWdub3N0aWNzID0gYXdhaXQgZmluZERpYWdub3N0aWNzKHRleHRFZGl0b3IpO1xuICAgIHJldHVybiBkaWFnbm9zdGljcy5sZW5ndGggPyBkaWFnbm9zdGljcyA6IFtdO1xuICB9LFxufTtcbiJdfQ==