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

var findDefinition = _require.findDefinition;

var _require2 = require('nuclide-atom-helpers');

var goToLocation = _require2.goToLocation;

var _require3 = require('nuclide-hack-common/lib/constants');

var HACK_GRAMMAR = _require3.HACK_GRAMMAR;

module.exports = {
  priority: 20,
  getSuggestionForWord: _asyncToGenerator(function* (textEditor, text, range) {
    if (HACK_GRAMMAR !== textEditor.getGrammar().scopeName) {
      return null;
    }

    var position = range.start;

    // Create the actual-call promise synchronously for next calls to consume.
    var location = yield findDefinition(textEditor, position.row, position.column);
    if (location) {
      // Optionally use the range returned from the definition match, if any.
      var range = location.range || range;
      return {
        range: range,
        callback: function callback() {
          return goToLocation(location.file, location.line, location.column);
        }
      };
    } else {
      return null;
    }
  })
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWhhY2svbGliL0h5cGVyY2xpY2tQcm92aWRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7O2VBV1csT0FBTyxDQUFDLFFBQVEsQ0FBQzs7SUFBbkMsY0FBYyxZQUFkLGNBQWM7O2dCQUNFLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQzs7SUFBL0MsWUFBWSxhQUFaLFlBQVk7O2dCQUVJLE9BQU8sQ0FBQyxtQ0FBbUMsQ0FBQzs7SUFBNUQsWUFBWSxhQUFaLFlBQVk7O0FBRWpCLE1BQU0sQ0FBQyxPQUFPLEdBQUc7QUFDZixVQUFRLEVBQUUsRUFBRTtBQUNaLEFBQU0sc0JBQW9CLG9CQUFBLFdBQUMsVUFBc0IsRUFBRSxJQUFZLEVBQUUsS0FBWSxFQUFFO0FBQzdFLFFBQUksWUFBWSxLQUFLLFVBQVUsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxTQUFTLEVBQUU7QUFDdEQsYUFBTyxJQUFJLENBQUM7S0FDYjs7UUFFVyxRQUFRLEdBQUksS0FBSyxDQUF4QixLQUFLOzs7QUFHVixRQUFJLFFBQVEsR0FBRyxNQUFNLGNBQWMsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDL0UsUUFBSSxRQUFRLEVBQUU7O0FBRVosVUFBSSxLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUM7QUFDcEMsYUFBTztBQUNMLGFBQUssRUFBTCxLQUFLO0FBQ0wsZ0JBQVEsRUFBRTtpQkFBTSxZQUFZLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUM7U0FBQTtPQUM1RSxDQUFDO0tBQ0gsTUFBTTtBQUNMLGFBQU8sSUFBSSxDQUFDO0tBQ2I7R0FDRixDQUFBO0NBQ0YsQ0FBQyIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvbnVjbGlkZS1oYWNrL2xpYi9IeXBlcmNsaWNrUHJvdmlkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIge2ZpbmREZWZpbml0aW9ufSA9IHJlcXVpcmUoJy4vaGFjaycpO1xudmFyIHtnb1RvTG9jYXRpb259ID0gcmVxdWlyZSgnbnVjbGlkZS1hdG9tLWhlbHBlcnMnKTtcblxudmFyIHtIQUNLX0dSQU1NQVJ9ID0gcmVxdWlyZSgnbnVjbGlkZS1oYWNrLWNvbW1vbi9saWIvY29uc3RhbnRzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBwcmlvcml0eTogMjAsXG4gIGFzeW5jIGdldFN1Z2dlc3Rpb25Gb3JXb3JkKHRleHRFZGl0b3I6IFRleHRFZGl0b3IsIHRleHQ6IHN0cmluZywgcmFuZ2U6IFJhbmdlKSB7XG4gICAgaWYgKEhBQ0tfR1JBTU1BUiAhPT0gdGV4dEVkaXRvci5nZXRHcmFtbWFyKCkuc2NvcGVOYW1lKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIge3N0YXJ0OiBwb3NpdGlvbn0gPSByYW5nZTtcblxuICAgIC8vIENyZWF0ZSB0aGUgYWN0dWFsLWNhbGwgcHJvbWlzZSBzeW5jaHJvbm91c2x5IGZvciBuZXh0IGNhbGxzIHRvIGNvbnN1bWUuXG4gICAgdmFyIGxvY2F0aW9uID0gYXdhaXQgZmluZERlZmluaXRpb24odGV4dEVkaXRvciwgcG9zaXRpb24ucm93LCBwb3NpdGlvbi5jb2x1bW4pO1xuICAgIGlmIChsb2NhdGlvbikge1xuICAgICAgLy8gT3B0aW9uYWxseSB1c2UgdGhlIHJhbmdlIHJldHVybmVkIGZyb20gdGhlIGRlZmluaXRpb24gbWF0Y2gsIGlmIGFueS5cbiAgICAgIHZhciByYW5nZSA9IGxvY2F0aW9uLnJhbmdlIHx8IHJhbmdlO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmFuZ2UsXG4gICAgICAgIGNhbGxiYWNrOiAoKSA9PiBnb1RvTG9jYXRpb24obG9jYXRpb24uZmlsZSwgbG9jYXRpb24ubGluZSwgbG9jYXRpb24uY29sdW1uKSxcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfSxcbn07XG4iXX0=