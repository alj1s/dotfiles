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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZsb3cvbGliL0Zsb3dMaW50ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7OztlQVdtQixPQUFPLENBQUMsZ0JBQWdCLENBQUM7O0lBQW5ELHNCQUFzQixZQUF0QixzQkFBc0I7O2dCQUNiLE9BQU8sQ0FBQyxNQUFNLENBQUM7O0lBQXhCLEtBQUssYUFBTCxLQUFLOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQlYsU0FBUywwQkFBMEIsQ0FBQyxPQUFPLEVBQUU7OztBQUczQyxNQUFJLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FDbkIsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsRUFDM0MsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUN6QyxDQUFDOztBQUVGLFNBQU87QUFDTCxRQUFJLEVBQUUsT0FBTztBQUNiLFFBQUksRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDO0FBQ3RCLFlBQVEsRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDO0FBQ3pCLFNBQUssRUFBRSxLQUFLO0dBQ2IsQ0FBQztDQUNIOzs7Ozs7Ozs7Ozs7Ozs7QUFlRCxTQUFTLGlCQUFpQixDQUFDLFFBQWUsRUFBRTtBQUMxQyxNQUFJLE9BQU8sR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUIsU0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsVUFBQyxHQUFHO1dBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQztHQUFBLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDL0QsU0FBTyxPQUFPLENBQUM7Q0FDaEI7O0FBRUQsU0FBUyxrQkFBa0IsQ0FBQyxXQUEwQixFQUFFLFVBQWtCLEVBQUU7QUFDMUUsTUFBSSxrQkFBa0IsR0FBRyxTQUFyQixrQkFBa0IsQ0FBWSxPQUFPLEVBQUU7QUFDekMsV0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssVUFBVSxDQUFDO0dBQ3ZDLENBQUM7OztBQUdGLE1BQUksUUFBUSxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUUsVUFBQyxVQUFVLEVBQUs7QUFDaEMsUUFBSSxrQkFBa0IsR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDL0MsV0FBTyxpQkFBaUIsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0dBQzdDLENBQUMsQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsQ0FBQzs7QUFFN0MsU0FBTyxRQUFRLENBQUMsR0FBRyxDQUFDLDBCQUEwQixDQUFDLENBQUM7Q0FDakQ7O0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRztBQUNmLGVBQWEsRUFBRSxDQUFDLFdBQVcsRUFBRSxlQUFlLENBQUM7QUFDN0MsT0FBSyxFQUFFLE1BQU07QUFDYixXQUFTLEVBQUUsSUFBSTtBQUNmLEFBQU0sTUFBSSxvQkFBQSxXQUFDLFVBQXNCLEVBQTBCO0FBQ3pELFFBQUksSUFBSSxHQUFHLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNoQyxRQUFJLENBQUMsSUFBSSxFQUFFO0FBQ1QsYUFBTyxFQUFFLENBQUM7S0FDWDs7QUFFRCxRQUFJLFdBQVcsR0FBRyxNQUFNLHNCQUFzQixDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDMUYsUUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUU7QUFDdkIsYUFBTyxFQUFFLENBQUM7S0FDWDs7QUFFRCxXQUFPLGtCQUFrQixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztHQUM5QyxDQUFBO0FBQ0Qsb0JBQWtCLEVBQWxCLGtCQUFrQjtDQUNuQixDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZsb3cvbGliL0Zsb3dMaW50ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIge2dldFNlcnZpY2VCeU51Y2xpZGVVcml9ID0gcmVxdWlyZSgnbnVjbGlkZS1jbGllbnQnKTtcbnZhciB7UmFuZ2V9ID0gcmVxdWlyZSgnYXRvbScpO1xuXG4vKipcbiAqIEN1cnJlbnRseSwgYSBkaWFnbm9zdGljIGZyb20gRmxvdyBpcyBhbiBvYmplY3Qgd2l0aCBhIFwibWVzc2FnZVwiIHByb3BlcnR5LlxuICogRWFjaCBpdGVtIGluIHRoZSBcIm1lc3NhZ2VcIiBhcnJheSBpcyBhbiBvYmplY3Qgd2l0aCB0aGUgZm9sbG93aW5nIGZpZWxkczpcbiAqICAgICAtIHBhdGggKHN0cmluZykgRmlsZSB0aGF0IGNvbnRhaW5zIHRoZSBlcnJvci5cbiAqICAgICAtIGRlc2NyIChzdHJpbmcpIERlc2NyaXB0aW9uIG9mIHRoZSBlcnJvci5cbiAqICAgICAtIGxpbmUgKG51bWJlcikgU3RhcnQgbGluZS5cbiAqICAgICAtIGVuZGxpbmUgKG51bWJlcikgRW5kIGxpbmUuXG4gKiAgICAgLSBzdGFydCAobnVtYmVyKSBTdGFydCBjb2x1bW4uXG4gKiAgICAgLSBlbmQgKG51bWJlcikgRW5kIGNvbHVtbi5cbiAqICAgICAtIGNvZGUgKG51bWJlcikgUHJlc3VtYWJseSBhbiBlcnJvciBjb2RlLlxuICogVGhlIG1lc3NhZ2UgYXJyYXkgbWF5IGhhdmUgbW9yZSB0aGFuIG9uZSBpdGVtLiBGb3IgZXhhbXBsZSwgaWYgdGhlcmUgaXMgYVxuICogdHlwZSBpbmNvbXBhdGliaWxpdHkgZXJyb3IsIHRoZSBmaXJzdCBpdGVtIGluIHRoZSBtZXNzYWdlIGFycmF5IGJsYW1lcyB0aGVcbiAqIHVzYWdlIG9mIHRoZSB3cm9uZyB0eXBlIGFuZCB0aGUgc2Vjb25kIGJsYW1lcyB0aGUgZGVjbGFyYXRpb24gb2YgdGhlIHR5cGVcbiAqIHdpdGggd2hpY2ggdGhlIHVzYWdlIGRpc2FncmVlcy4gTm90ZSB0aGF0IHRoZXNlIGNvdWxkIG9jY3VyIGluIGRpZmZlcmVudFxuICogZmlsZXMuXG4gKi9cbmZ1bmN0aW9uIGZsb3dNZXNzYWdlVG9MaW50ZXJNZXNzYWdlKG1lc3NhZ2UpIHtcbiAgLy8gSXQncyB1bmNsZWFyIHdoeSB0aGUgMS1iYXNlZCB0byAwLWJhc2VkIGluZGV4aW5nIHdvcmtzIHRoZSB3YXkgdGhhdCBpdFxuICAvLyBkb2VzLCBidXQgdGhpcyBoYXMgdGhlIGRlc2lyZWQgZWZmZWN0IGluIHRoZSBVSSwgaW4gcHJhY3RpY2UuXG4gIHZhciByYW5nZSA9IG5ldyBSYW5nZShcbiAgICBbbWVzc2FnZVsnbGluZSddIC0gMSwgbWVzc2FnZVsnc3RhcnQnXSAtIDFdLFxuICAgIFttZXNzYWdlWydlbmRsaW5lJ10gLSAxLCBtZXNzYWdlWydlbmQnXV1cbiAgKTtcblxuICByZXR1cm4ge1xuICAgIHR5cGU6ICdFcnJvcicsXG4gICAgdGV4dDogbWVzc2FnZVsnZGVzY3InXSxcbiAgICBmaWxlUGF0aDogbWVzc2FnZVsncGF0aCddLFxuICAgIHJhbmdlOiByYW5nZSxcbiAgfTtcbn1cblxuLyoqXG4gKiBJbiBzb21lIGNhc2VzLCBmbG93IGRpYWdub3N0aWNzIHdpbGwgc3BhbiBtdWx0aXBsZSBmaWxlcy4gSXQgaGVscHMgaW4gdGhlIGNhc2VcbiAqIHRoYXQgdGhlcmUncyBhIHByb2JsZW0gd2l0aCwgc2F5LCB0aGUgdGhlIHdheSBhIGZ1bmN0aW9uIGRlZmluZWQgaW4gYW5vdGhlclxuICogZmlsZSBpcyB0eXBlZCBjb25mbGljdHMgd2l0aCBob3cgeW91J3JlIGNhbGxpbmcgaXQuXG4gKlxuICogWW91IGdldCBkaWFnbm9zdGljcyBsaWtlOlxuICogRmlsZSBBOiA8VHlwZSBzdHJpbmcgaXMgaW5jb21wYXRhYmxlPlxuICogRmlsZSBCOiA8d2l0aCB0eXBlIG51bWJlcj5cbiAqXG4gKiBXZSBkb24ndCBoYXZlIGFueSB3YXkgdG8gZGVhbCB3aXRoIHRoaXMsIHNvIG1lcmdlIHRoZSBkZXNjcmlwdGlvbnMsIHNvIHRoYXRcbiAqIGluZm9ybWF0aW9uIGRvZXNuJ3QgZ2V0IGN1dCBvZmYuXG4gKlxuICovXG5mdW5jdGlvbiBtZXJnZUZsb3dNZXNzYWdlcyhtZXNzYWdlczogQXJyYXkpIHtcbiAgdmFyIG1lc3NhZ2UgPSBtZXNzYWdlc1swXTtcbiAgbWVzc2FnZVsnZGVzY3InXSA9IG1lc3NhZ2VzLm1hcCgobXNnKT0+bXNnWydkZXNjciddKS5qb2luKCcgJyk7XG4gIHJldHVybiBtZXNzYWdlO1xufVxuXG5mdW5jdGlvbiBwcm9jZXNzRGlhZ25vc3RpY3MoZGlhZ25vc3RpY3M6IEFycmF5PE9iamVjdD4sIHRhcmdldEZpbGU6IHN0cmluZykge1xuICB2YXIgaGFzTWVzc2FnZVdpdGhQYXRoID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgIHJldHVybiBtZXNzYWdlWydwYXRoJ10gPT09IHRhcmdldEZpbGU7XG4gIH07XG5cbiAgLy8gRmlsdGVyIG1lc3NhZ2VzIG5vdCBhZGRyZXNzaW5nIGB0YXJnZXRGaWxlYCBhbmQgbWVyZ2UgbWVzc2FnZXMgc3Bhbm5pbmcgbXVsdGlwbGUgZmlsZXMuXG4gIHZhciBtZXNzYWdlcyA9IGRpYWdub3N0aWNzLm1hcCggKGRpYWdub3N0aWMpID0+IHtcbiAgICAgICAgICAgICAgICAgIHZhciBkaWFnbm9zdGljTWVzc2FnZXMgPSBkaWFnbm9zdGljWydtZXNzYWdlJ107XG4gICAgICAgICAgICAgICAgICByZXR1cm4gbWVyZ2VGbG93TWVzc2FnZXMoZGlhZ25vc3RpY01lc3NhZ2VzKTtcbiAgICAgICAgICAgICAgICAgfSkuZmlsdGVyKGhhc01lc3NhZ2VXaXRoUGF0aCk7XG5cbiAgcmV0dXJuIG1lc3NhZ2VzLm1hcChmbG93TWVzc2FnZVRvTGludGVyTWVzc2FnZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBncmFtbWFyU2NvcGVzOiBbJ3NvdXJjZS5qcycsICdzb3VyY2UuanMuanN4J10sXG4gIHNjb3BlOiAnZmlsZScsXG4gIGxpbnRPbkZseTogdHJ1ZSxcbiAgYXN5bmMgbGludCh0ZXh0RWRpdG9yOiBUZXh0RWRpdG9yKTogUHJvbWlzZTxBcnJheTxPYmplY3Q+PiB7XG4gICAgdmFyIGZpbGUgPSB0ZXh0RWRpdG9yLmdldFBhdGgoKTtcbiAgICBpZiAoIWZpbGUpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICB2YXIgZGlhZ25vc3RpY3MgPSBhd2FpdCBnZXRTZXJ2aWNlQnlOdWNsaWRlVXJpKCdGbG93U2VydmljZScsIGZpbGUpLmZpbmREaWFnbm9zdGljcyhmaWxlKTtcbiAgICBpZiAoIWRpYWdub3N0aWNzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIHJldHVybiBwcm9jZXNzRGlhZ25vc3RpY3MoZGlhZ25vc3RpY3MsIGZpbGUpO1xuICB9LFxuICBwcm9jZXNzRGlhZ25vc3RpY3MsXG59O1xuIl19