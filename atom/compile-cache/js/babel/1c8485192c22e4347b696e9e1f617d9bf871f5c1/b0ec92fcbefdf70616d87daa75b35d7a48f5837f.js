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

var _require2 = require('nuclide-atom-helpers');

var goToLocation = _require2.goToLocation;

var GRAMMARS = new Set(['source.js']);

module.exports = {
  priority: 20,
  getSuggestionForWord: _asyncToGenerator(function* (textEditor, text, range) {
    if (!GRAMMARS.has(textEditor.getGrammar().scopeName)) {
      return null;
    }

    var file = textEditor.getPath();
    var position = range.start;

    var location = yield getServiceByNuclideUri('FlowService', file).findDefinition(file, textEditor.getText(), position.row + 1, position.column + 1);
    if (location) {
      return {
        range: range,
        callback: function callback() {
          goToLocation(location.file, location.line, location.column);
        }
      };
    } else {
      return null;
    }
  })
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZsb3cvbGliL0h5cGVyY2xpY2tQcm92aWRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7O2VBVW1CLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQzs7SUFBbkQsc0JBQXNCLFlBQXRCLHNCQUFzQjs7Z0JBQ04sT0FBTyxDQUFDLHNCQUFzQixDQUFDOztJQUEvQyxZQUFZLGFBQVosWUFBWTs7QUFFakIsSUFBSSxRQUFRLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FDckIsV0FBVyxDQUNaLENBQUMsQ0FBQzs7QUFFSCxNQUFNLENBQUMsT0FBTyxHQUFHO0FBQ2YsVUFBUSxFQUFFLEVBQUU7QUFDWixBQUFNLHNCQUFvQixvQkFBQSxXQUFDLFVBQXNCLEVBQUUsSUFBWSxFQUFFLEtBQVksRUFBRTtBQUM3RSxRQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFFLENBQUMsU0FBUyxDQUFDLEVBQUU7QUFDcEQsYUFBTyxJQUFJLENBQUM7S0FDYjs7QUFFRCxRQUFJLElBQUksR0FBRyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDcEIsUUFBUSxHQUFJLEtBQUssQ0FBeEIsS0FBSzs7QUFDVixRQUFJLFFBQVEsR0FBRyxNQUFNLHNCQUFzQixDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FDM0QsY0FBYyxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLEVBQUUsUUFBUSxDQUFDLEdBQUcsR0FBRyxDQUFDLEVBQUUsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztBQUN2RixRQUFJLFFBQVEsRUFBRTtBQUNaLGFBQU87QUFDTCxhQUFLLEVBQUwsS0FBSztBQUNMLGdCQUFRLEVBQUEsb0JBQUc7QUFDVCxzQkFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDN0Q7T0FDRixDQUFDO0tBQ0gsTUFBTTtBQUNMLGFBQU8sSUFBSSxDQUFDO0tBQ2I7R0FDRixDQUFBO0NBQ0YsQ0FBQyIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvbnVjbGlkZS1mbG93L2xpYi9IeXBlcmNsaWNrUHJvdmlkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xudmFyIHtnZXRTZXJ2aWNlQnlOdWNsaWRlVXJpfSA9IHJlcXVpcmUoJ251Y2xpZGUtY2xpZW50Jyk7XG52YXIge2dvVG9Mb2NhdGlvbn0gPSByZXF1aXJlKCdudWNsaWRlLWF0b20taGVscGVycycpO1xuXG52YXIgR1JBTU1BUlMgPSBuZXcgU2V0KFtcbiAgJ3NvdXJjZS5qcycsXG5dKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHByaW9yaXR5OiAyMCxcbiAgYXN5bmMgZ2V0U3VnZ2VzdGlvbkZvcldvcmQodGV4dEVkaXRvcjogVGV4dEVkaXRvciwgdGV4dDogc3RyaW5nLCByYW5nZTogUmFuZ2UpIHtcbiAgICBpZiAoIUdSQU1NQVJTLmhhcyh0ZXh0RWRpdG9yLmdldEdyYW1tYXIoKS5zY29wZU5hbWUpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgZmlsZSA9IHRleHRFZGl0b3IuZ2V0UGF0aCgpO1xuICAgIHZhciB7c3RhcnQ6IHBvc2l0aW9ufSA9IHJhbmdlO1xuICAgIHZhciBsb2NhdGlvbiA9IGF3YWl0IGdldFNlcnZpY2VCeU51Y2xpZGVVcmkoJ0Zsb3dTZXJ2aWNlJywgZmlsZSlcbiAgICAgICAgLmZpbmREZWZpbml0aW9uKGZpbGUsIHRleHRFZGl0b3IuZ2V0VGV4dCgpLCBwb3NpdGlvbi5yb3cgKyAxLCBwb3NpdGlvbi5jb2x1bW4gKyAxKTtcbiAgICBpZiAobG9jYXRpb24pIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJhbmdlLFxuICAgICAgICBjYWxsYmFjaygpIHtcbiAgICAgICAgICBnb1RvTG9jYXRpb24obG9jYXRpb24uZmlsZSwgbG9jYXRpb24ubGluZSwgbG9jYXRpb24uY29sdW1uKTtcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfSxcbn07XG4iXX0=