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

var _require = require('nuclide-client');

var getServiceByNuclideUri = _require.getServiceByNuclideUri;

var _require2 = require('atom');

var Range = _require2.Range;

/**
 * Currently, a diagnostic from Flow is an object with a "message" property.
 * Each item in the "message" array is an object with the following fields:
 *     - path (string) File that contains the error.
 *     - descr (string) Description of the error.
 *     - line (number) Start line.
 *     - endline (number) End line.
 *     - start (number) Start column.
 *     - end (number) End column.
 *     - code (number) Presumably an error code.
 * The message array may have more than one item. For example, if there is a
 * type incompatibility error, the first item in the message array blames the
 * usage of the wrong type and the second blames the declaration of the type
 * with which the usage disagrees. Note that these could occur in different
 * files.
 */
function flowMessageToLinterMessage(message) {
  // It's unclear why the 1-based to 0-based indexing works the way that it
  // does, but this has the desired effect in the UI, in practice.
  var range = new Range([message['line'] - 1, message['start'] - 1], [message['endline'] - 1, message['end']]);

  return {
    type: 'Error',
    text: message['descr'],
    filePath: message['path'],
    range: range
  };
}

/**
 * In some cases, flow diagnostics will span multiple files. It helps in the case
 * that there's a problem with, say, the the way a function defined in another
 * file is typed conflicts with how you're calling it.
 *
 * You get diagnostics like:
 * File A: <Type string is incompatable>
 * File B: <with type number>
 *
 * We don't have any way to deal with this, so merge the descriptions, so that
 * information doesn't get cut off.
 *
 */
function mergeFlowMessages(messages) {
  var message = messages[0];
  message['descr'] = messages.map(function (msg) {
    return msg['descr'];
  }).join(' ');
  return message;
}

function processDiagnostics(diagnostics, targetFile) {
  var hasMessageWithPath = function hasMessageWithPath(message) {
    return message['path'] === targetFile;
  };

  // Filter messages not addressing `targetFile` and merge messages spanning multiple files.
  var messages = diagnostics.map(function (diagnostic) {
    var diagnosticMessages = diagnostic['message'];
    return mergeFlowMessages(diagnosticMessages);
  }).filter(hasMessageWithPath);

  return messages.map(flowMessageToLinterMessage);
}

module.exports = {
  grammarScopes: ['source.js', 'source.js.jsx'],
  scope: 'file',
  lintOnFly: true,
  lint: _asyncToGenerator(function* (textEditor) {
    var file = textEditor.getPath();
    if (!file) {
      return [];
    }

    var diagnostics = yield getServiceByNuclideUri('FlowService', file).findDiagnostics(file);
    if (!diagnostics.length) {
      return [];
    }

    return processDiagnostics(diagnostics, file);
  }),
  processDiagnostics: processDiagnostics
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZsb3cvbGliL0Zsb3dMaW50ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7OztlQVdtQixPQUFPLENBQUMsZ0JBQWdCLENBQUM7O0lBQW5ELHNCQUFzQixZQUF0QixzQkFBc0I7O2dCQUNiLE9BQU8sQ0FBQyxNQUFNLENBQUM7O0lBQXhCLEtBQUssYUFBTCxLQUFLOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQlYsU0FBUywwQkFBMEIsQ0FBQyxPQUFPLEVBQUU7OztBQUczQyxNQUFJLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FDbkIsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsRUFDM0MsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUN6QyxDQUFDOztBQUVGLFNBQU87QUFDTCxRQUFJLEVBQUUsT0FBTztBQUNiLFFBQUksRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDO0FBQ3RCLFlBQVEsRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDO0FBQ3pCLFNBQUssRUFBRSxLQUFLO0dBQ2IsQ0FBQztDQUNIOzs7Ozs7Ozs7Ozs7Ozs7QUFlRCxTQUFTLGlCQUFpQixDQUFDLFFBQWUsRUFBRTtBQUMxQyxNQUFJLE9BQU8sR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUIsU0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsVUFBQyxHQUFHO1dBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQztHQUFBLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDL0QsU0FBTyxPQUFPLENBQUM7Q0FDaEI7O0FBRUQsU0FBUyxrQkFBa0IsQ0FBQyxXQUEwQixFQUFFLFVBQWtCLEVBQUU7QUFDMUUsTUFBSSxrQkFBa0IsR0FBRyxTQUFyQixrQkFBa0IsQ0FBWSxPQUFPLEVBQUU7QUFDekMsV0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssVUFBVSxDQUFDO0dBQ3ZDLENBQUM7OztBQUdGLE1BQUksUUFBUSxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUUsVUFBQyxVQUFVLEVBQUs7QUFDaEMsUUFBSSxrQkFBa0IsR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDL0MsV0FBTyxpQkFBaUIsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0dBQzdDLENBQUMsQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsQ0FBQzs7QUFFN0MsU0FBTyxRQUFRLENBQUMsR0FBRyxDQUFDLDBCQUEwQixDQUFDLENBQUM7Q0FDakQ7O0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRztBQUNmLGVBQWEsRUFBRSxDQUFDLFdBQVcsRUFBRSxlQUFlLENBQUM7QUFDN0MsT0FBSyxFQUFFLE1BQU07QUFDYixXQUFTLEVBQUUsSUFBSTtBQUNmLE1BQVUsb0JBQUEsV0FBQyxVQUFzQixFQUEwQjtBQUN6RCxRQUFJLElBQUksR0FBRyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDaEMsUUFBSSxDQUFDLElBQUksRUFBRTtBQUNULGFBQU8sRUFBRSxDQUFDO0tBQ1g7O0FBRUQsUUFBSSxXQUFXLEdBQUcsTUFBTSxzQkFBc0IsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzFGLFFBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFO0FBQ3ZCLGFBQU8sRUFBRSxDQUFDO0tBQ1g7O0FBRUQsV0FBTyxrQkFBa0IsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7R0FDOUMsQ0FBQTtBQUNELG9CQUFrQixFQUFsQixrQkFBa0I7Q0FDbkIsQ0FBQyIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvbnVjbGlkZS1mbG93L2xpYi9GbG93TGludGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxudmFyIHtnZXRTZXJ2aWNlQnlOdWNsaWRlVXJpfSA9IHJlcXVpcmUoJ251Y2xpZGUtY2xpZW50Jyk7XG52YXIge1JhbmdlfSA9IHJlcXVpcmUoJ2F0b20nKTtcblxuLyoqXG4gKiBDdXJyZW50bHksIGEgZGlhZ25vc3RpYyBmcm9tIEZsb3cgaXMgYW4gb2JqZWN0IHdpdGggYSBcIm1lc3NhZ2VcIiBwcm9wZXJ0eS5cbiAqIEVhY2ggaXRlbSBpbiB0aGUgXCJtZXNzYWdlXCIgYXJyYXkgaXMgYW4gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZyBmaWVsZHM6XG4gKiAgICAgLSBwYXRoIChzdHJpbmcpIEZpbGUgdGhhdCBjb250YWlucyB0aGUgZXJyb3IuXG4gKiAgICAgLSBkZXNjciAoc3RyaW5nKSBEZXNjcmlwdGlvbiBvZiB0aGUgZXJyb3IuXG4gKiAgICAgLSBsaW5lIChudW1iZXIpIFN0YXJ0IGxpbmUuXG4gKiAgICAgLSBlbmRsaW5lIChudW1iZXIpIEVuZCBsaW5lLlxuICogICAgIC0gc3RhcnQgKG51bWJlcikgU3RhcnQgY29sdW1uLlxuICogICAgIC0gZW5kIChudW1iZXIpIEVuZCBjb2x1bW4uXG4gKiAgICAgLSBjb2RlIChudW1iZXIpIFByZXN1bWFibHkgYW4gZXJyb3IgY29kZS5cbiAqIFRoZSBtZXNzYWdlIGFycmF5IG1heSBoYXZlIG1vcmUgdGhhbiBvbmUgaXRlbS4gRm9yIGV4YW1wbGUsIGlmIHRoZXJlIGlzIGFcbiAqIHR5cGUgaW5jb21wYXRpYmlsaXR5IGVycm9yLCB0aGUgZmlyc3QgaXRlbSBpbiB0aGUgbWVzc2FnZSBhcnJheSBibGFtZXMgdGhlXG4gKiB1c2FnZSBvZiB0aGUgd3JvbmcgdHlwZSBhbmQgdGhlIHNlY29uZCBibGFtZXMgdGhlIGRlY2xhcmF0aW9uIG9mIHRoZSB0eXBlXG4gKiB3aXRoIHdoaWNoIHRoZSB1c2FnZSBkaXNhZ3JlZXMuIE5vdGUgdGhhdCB0aGVzZSBjb3VsZCBvY2N1ciBpbiBkaWZmZXJlbnRcbiAqIGZpbGVzLlxuICovXG5mdW5jdGlvbiBmbG93TWVzc2FnZVRvTGludGVyTWVzc2FnZShtZXNzYWdlKSB7XG4gIC8vIEl0J3MgdW5jbGVhciB3aHkgdGhlIDEtYmFzZWQgdG8gMC1iYXNlZCBpbmRleGluZyB3b3JrcyB0aGUgd2F5IHRoYXQgaXRcbiAgLy8gZG9lcywgYnV0IHRoaXMgaGFzIHRoZSBkZXNpcmVkIGVmZmVjdCBpbiB0aGUgVUksIGluIHByYWN0aWNlLlxuICB2YXIgcmFuZ2UgPSBuZXcgUmFuZ2UoXG4gICAgW21lc3NhZ2VbJ2xpbmUnXSAtIDEsIG1lc3NhZ2VbJ3N0YXJ0J10gLSAxXSxcbiAgICBbbWVzc2FnZVsnZW5kbGluZSddIC0gMSwgbWVzc2FnZVsnZW5kJ11dXG4gICk7XG5cbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnRXJyb3InLFxuICAgIHRleHQ6IG1lc3NhZ2VbJ2Rlc2NyJ10sXG4gICAgZmlsZVBhdGg6IG1lc3NhZ2VbJ3BhdGgnXSxcbiAgICByYW5nZTogcmFuZ2UsXG4gIH07XG59XG5cbi8qKlxuICogSW4gc29tZSBjYXNlcywgZmxvdyBkaWFnbm9zdGljcyB3aWxsIHNwYW4gbXVsdGlwbGUgZmlsZXMuIEl0IGhlbHBzIGluIHRoZSBjYXNlXG4gKiB0aGF0IHRoZXJlJ3MgYSBwcm9ibGVtIHdpdGgsIHNheSwgdGhlIHRoZSB3YXkgYSBmdW5jdGlvbiBkZWZpbmVkIGluIGFub3RoZXJcbiAqIGZpbGUgaXMgdHlwZWQgY29uZmxpY3RzIHdpdGggaG93IHlvdSdyZSBjYWxsaW5nIGl0LlxuICpcbiAqIFlvdSBnZXQgZGlhZ25vc3RpY3MgbGlrZTpcbiAqIEZpbGUgQTogPFR5cGUgc3RyaW5nIGlzIGluY29tcGF0YWJsZT5cbiAqIEZpbGUgQjogPHdpdGggdHlwZSBudW1iZXI+XG4gKlxuICogV2UgZG9uJ3QgaGF2ZSBhbnkgd2F5IHRvIGRlYWwgd2l0aCB0aGlzLCBzbyBtZXJnZSB0aGUgZGVzY3JpcHRpb25zLCBzbyB0aGF0XG4gKiBpbmZvcm1hdGlvbiBkb2Vzbid0IGdldCBjdXQgb2ZmLlxuICpcbiAqL1xuZnVuY3Rpb24gbWVyZ2VGbG93TWVzc2FnZXMobWVzc2FnZXM6IEFycmF5KSB7XG4gIHZhciBtZXNzYWdlID0gbWVzc2FnZXNbMF07XG4gIG1lc3NhZ2VbJ2Rlc2NyJ10gPSBtZXNzYWdlcy5tYXAoKG1zZyk9Pm1zZ1snZGVzY3InXSkuam9pbignICcpO1xuICByZXR1cm4gbWVzc2FnZTtcbn1cblxuZnVuY3Rpb24gcHJvY2Vzc0RpYWdub3N0aWNzKGRpYWdub3N0aWNzOiBBcnJheTxPYmplY3Q+LCB0YXJnZXRGaWxlOiBzdHJpbmcpIHtcbiAgdmFyIGhhc01lc3NhZ2VXaXRoUGF0aCA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gbWVzc2FnZVsncGF0aCddID09PSB0YXJnZXRGaWxlO1xuICB9O1xuXG4gIC8vIEZpbHRlciBtZXNzYWdlcyBub3QgYWRkcmVzc2luZyBgdGFyZ2V0RmlsZWAgYW5kIG1lcmdlIG1lc3NhZ2VzIHNwYW5uaW5nIG11bHRpcGxlIGZpbGVzLlxuICB2YXIgbWVzc2FnZXMgPSBkaWFnbm9zdGljcy5tYXAoIChkaWFnbm9zdGljKSA9PiB7XG4gICAgICAgICAgICAgICAgICB2YXIgZGlhZ25vc3RpY01lc3NhZ2VzID0gZGlhZ25vc3RpY1snbWVzc2FnZSddO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIG1lcmdlRmxvd01lc3NhZ2VzKGRpYWdub3N0aWNNZXNzYWdlcyk7XG4gICAgICAgICAgICAgICAgIH0pLmZpbHRlcihoYXNNZXNzYWdlV2l0aFBhdGgpO1xuXG4gIHJldHVybiBtZXNzYWdlcy5tYXAoZmxvd01lc3NhZ2VUb0xpbnRlck1lc3NhZ2UpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ3JhbW1hclNjb3BlczogWydzb3VyY2UuanMnLCAnc291cmNlLmpzLmpzeCddLFxuICBzY29wZTogJ2ZpbGUnLFxuICBsaW50T25GbHk6IHRydWUsXG4gIGFzeW5jIGxpbnQodGV4dEVkaXRvcjogVGV4dEVkaXRvcik6IFByb21pc2U8QXJyYXk8T2JqZWN0Pj4ge1xuICAgIHZhciBmaWxlID0gdGV4dEVkaXRvci5nZXRQYXRoKCk7XG4gICAgaWYgKCFmaWxlKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgdmFyIGRpYWdub3N0aWNzID0gYXdhaXQgZ2V0U2VydmljZUJ5TnVjbGlkZVVyaSgnRmxvd1NlcnZpY2UnLCBmaWxlKS5maW5kRGlhZ25vc3RpY3MoZmlsZSk7XG4gICAgaWYgKCFkaWFnbm9zdGljcy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvY2Vzc0RpYWdub3N0aWNzKGRpYWdub3N0aWNzLCBmaWxlKTtcbiAgfSxcbiAgcHJvY2Vzc0RpYWdub3N0aWNzLFxufTtcbiJdfQ==