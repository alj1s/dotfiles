'use babel';

var isFlowInstalled = _asyncToGenerator(function* () {
  var os = require('os');
  var platform = os.platform();
  if (platform === 'linux' || platform === 'darwin') {
    var flowPath = yield getPathToFlow();
    try {
      yield asyncExecute('which', [flowPath]);
      return true;
    } catch (e) {
      return false;
    }
  } else {
    // Flow does not currently work in Windows.
    return false;
  }
});

/**
* If this returns null, then it is not safe to run flow.
*/

var getFlowExecOptions = _asyncToGenerator(function* (file) {
  var flowConfigDirectory = yield findNearestFile('.flowconfig', path.dirname(file));
  var installed = yield isFlowInstalled();
  if (flowConfigDirectory && installed) {
    // TODO(nmote) remove typecast once Flow allows Promises to have covariant
    // type params
    return {
      cwd: flowConfigDirectory
    };
  } else {
    return null;
  }
});

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var path = require('path');

var _require = require('nuclide-commons');

var asyncExecute = _require.asyncExecute;
var findNearestFile = _require.findNearestFile;
var getConfigValueAsync = _require.getConfigValueAsync;

function insertAutocompleteToken(contents, line, col) {
  var lines = contents.split('\n');
  var theLine = lines[line];
  theLine = theLine.substring(0, col) + 'AUTO332' + theLine.substring(col);
  lines[line] = theLine;
  return lines.join('\n');
}

function getPathToFlow() {
  if (global.atom) {
    return getConfigValueAsync('nuclide-flow.pathToFlow')();
  } else {
    return Promise.resolve('flow');
  }
}

module.exports = {
  insertAutocompleteToken: insertAutocompleteToken,
  isFlowInstalled: isFlowInstalled,
  getPathToFlow: getPathToFlow,
  getFlowExecOptions: getFlowExecOptions
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZsb3cvbm9kZV9tb2R1bGVzL251Y2xpZGUtZmxvdy1iYXNlL2xpYi9GbG93SGVscGVycy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7O0lBc0JHLGVBQWUscUJBQTlCLGFBQW1EO0FBQ2pELE1BQUksRUFBRSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN2QixNQUFJLFFBQVEsR0FBRyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDN0IsTUFBSSxRQUFRLEtBQUssT0FBTyxJQUFJLFFBQVEsS0FBSyxRQUFRLEVBQUU7QUFDakQsUUFBSSxRQUFRLEdBQUcsTUFBTSxhQUFhLEVBQUUsQ0FBQztBQUNyQyxRQUFJO0FBQ0YsWUFBTSxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztBQUN4QyxhQUFPLElBQUksQ0FBQztLQUNiLENBQUMsT0FBTyxDQUFDLEVBQUU7QUFDVixhQUFPLEtBQUssQ0FBQztLQUNkO0dBQ0YsTUFBTTs7QUFFTCxXQUFPLEtBQUssQ0FBQztHQUNkO0NBQ0Y7Ozs7OztJQWFjLGtCQUFrQixxQkFBakMsV0FBa0MsSUFBWSxFQUFvQjtBQUNoRSxNQUFJLG1CQUFtQixHQUFHLE1BQU0sZUFBZSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDbkYsTUFBSSxTQUFTLEdBQUcsTUFBTSxlQUFlLEVBQUUsQ0FBQztBQUN4QyxNQUFJLG1CQUFtQixJQUFJLFNBQVMsRUFBRTs7O0FBR3BDLFdBQVE7QUFDTixTQUFHLEVBQUUsbUJBQW1CO0tBQ3pCLENBQVc7R0FDYixNQUFNO0FBQ0wsV0FBTyxJQUFJLENBQUM7R0FDYjtDQUNGOzs7Ozs7Ozs7Ozs7OztBQW5ERCxJQUFJLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7O2VBQ2dDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQzs7SUFBaEYsWUFBWSxZQUFaLFlBQVk7SUFBRSxlQUFlLFlBQWYsZUFBZTtJQUFFLG1CQUFtQixZQUFuQixtQkFBbUI7O0FBRXZELFNBQVMsdUJBQXVCLENBQUMsUUFBZ0IsRUFBRSxJQUFZLEVBQUUsR0FBVyxFQUFVO0FBQ3BGLE1BQUksS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDakMsTUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzFCLFNBQU8sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsR0FBRyxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN6RSxPQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDO0FBQ3RCLFNBQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztDQUN6Qjs7QUFtQkQsU0FBUyxhQUFhLEdBQW9CO0FBQ3hDLE1BQUksTUFBTSxDQUFDLElBQUksRUFBRTtBQUNmLFdBQU8sbUJBQW1CLENBQUMseUJBQXlCLENBQUMsRUFBRSxDQUFDO0dBQ3pELE1BQU07QUFDTCxXQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7R0FDaEM7Q0FDRjs7QUFtQkQsTUFBTSxDQUFDLE9BQU8sR0FBRztBQUNmLHlCQUF1QixFQUF2Qix1QkFBdUI7QUFDdkIsaUJBQWUsRUFBZixlQUFlO0FBQ2YsZUFBYSxFQUFiLGFBQWE7QUFDYixvQkFBa0IsRUFBbEIsa0JBQWtCO0NBQ25CLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL251Y2xpZGUtZmxvdy9ub2RlX21vZHVsZXMvbnVjbGlkZS1mbG93LWJhc2UvbGliL0Zsb3dIZWxwZXJzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxudmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG52YXIge2FzeW5jRXhlY3V0ZSwgZmluZE5lYXJlc3RGaWxlLCBnZXRDb25maWdWYWx1ZUFzeW5jfSA9IHJlcXVpcmUoJ251Y2xpZGUtY29tbW9ucycpO1xuXG5mdW5jdGlvbiBpbnNlcnRBdXRvY29tcGxldGVUb2tlbihjb250ZW50czogc3RyaW5nLCBsaW5lOiBudW1iZXIsIGNvbDogbnVtYmVyKTogc3RyaW5nIHtcbiAgdmFyIGxpbmVzID0gY29udGVudHMuc3BsaXQoJ1xcbicpO1xuICB2YXIgdGhlTGluZSA9IGxpbmVzW2xpbmVdO1xuICB0aGVMaW5lID0gdGhlTGluZS5zdWJzdHJpbmcoMCwgY29sKSArICdBVVRPMzMyJyArIHRoZUxpbmUuc3Vic3RyaW5nKGNvbCk7XG4gIGxpbmVzW2xpbmVdID0gdGhlTGluZTtcbiAgcmV0dXJuIGxpbmVzLmpvaW4oJ1xcbicpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBpc0Zsb3dJbnN0YWxsZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIHZhciBvcyA9IHJlcXVpcmUoJ29zJyk7XG4gIHZhciBwbGF0Zm9ybSA9IG9zLnBsYXRmb3JtKCk7XG4gIGlmIChwbGF0Zm9ybSA9PT0gJ2xpbnV4JyB8fCBwbGF0Zm9ybSA9PT0gJ2RhcndpbicpIHtcbiAgICB2YXIgZmxvd1BhdGggPSBhd2FpdCBnZXRQYXRoVG9GbG93KCk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGFzeW5jRXhlY3V0ZSgnd2hpY2gnLCBbZmxvd1BhdGhdKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gRmxvdyBkb2VzIG5vdCBjdXJyZW50bHkgd29yayBpbiBXaW5kb3dzLlxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRQYXRoVG9GbG93KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGlmIChnbG9iYWwuYXRvbSkge1xuICAgIHJldHVybiBnZXRDb25maWdWYWx1ZUFzeW5jKCdudWNsaWRlLWZsb3cucGF0aFRvRmxvdycpKCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgnZmxvdycpO1xuICB9XG59XG5cbi8qKlxuKiBJZiB0aGlzIHJldHVybnMgbnVsbCwgdGhlbiBpdCBpcyBub3Qgc2FmZSB0byBydW4gZmxvdy5cbiovXG5hc3luYyBmdW5jdGlvbiBnZXRGbG93RXhlY09wdGlvbnMoZmlsZTogc3RyaW5nKTogUHJvbWlzZTw/T2JqZWN0PiB7XG4gIHZhciBmbG93Q29uZmlnRGlyZWN0b3J5ID0gYXdhaXQgZmluZE5lYXJlc3RGaWxlKCcuZmxvd2NvbmZpZycsIHBhdGguZGlybmFtZShmaWxlKSk7XG4gIHZhciBpbnN0YWxsZWQgPSBhd2FpdCBpc0Zsb3dJbnN0YWxsZWQoKTtcbiAgaWYgKGZsb3dDb25maWdEaXJlY3RvcnkgJiYgaW5zdGFsbGVkKSB7XG4gICAgLy8gVE9ETyhubW90ZSkgcmVtb3ZlIHR5cGVjYXN0IG9uY2UgRmxvdyBhbGxvd3MgUHJvbWlzZXMgdG8gaGF2ZSBjb3ZhcmlhbnRcbiAgICAvLyB0eXBlIHBhcmFtc1xuICAgIHJldHVybiAoe1xuICAgICAgY3dkOiBmbG93Q29uZmlnRGlyZWN0b3J5LFxuICAgIH06ID9PYmplY3QpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBpbnNlcnRBdXRvY29tcGxldGVUb2tlbixcbiAgaXNGbG93SW5zdGFsbGVkLFxuICBnZXRQYXRoVG9GbG93LFxuICBnZXRGbG93RXhlY09wdGlvbnMsXG59O1xuIl19