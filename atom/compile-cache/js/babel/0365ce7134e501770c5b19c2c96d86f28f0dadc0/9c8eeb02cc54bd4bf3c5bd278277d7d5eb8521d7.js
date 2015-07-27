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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWhhY2svbGliL0h5cGVyY2xpY2tQcm92aWRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7O2VBV1csT0FBTyxDQUFDLFFBQVEsQ0FBQzs7SUFBbkMsY0FBYyxZQUFkLGNBQWM7O2dCQUNFLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQzs7SUFBL0MsWUFBWSxhQUFaLFlBQVk7O2dCQUVJLE9BQU8sQ0FBQyxtQ0FBbUMsQ0FBQzs7SUFBNUQsWUFBWSxhQUFaLFlBQVk7O0FBRWpCLE1BQU0sQ0FBQyxPQUFPLEdBQUc7QUFDZixVQUFRLEVBQUUsRUFBRTtBQUNaLHNCQUEwQixvQkFBQSxXQUFDLFVBQXNCLEVBQUUsSUFBWSxFQUFFLEtBQVksRUFBRTtBQUM3RSxRQUFJLFlBQVksS0FBSyxVQUFVLENBQUMsVUFBVSxFQUFFLENBQUMsU0FBUyxFQUFFO0FBQ3RELGFBQU8sSUFBSSxDQUFDO0tBQ2I7O1FBRVcsUUFBUSxHQUFJLEtBQUssQ0FBeEIsS0FBSzs7O0FBR1YsUUFBSSxRQUFRLEdBQUcsTUFBTSxjQUFjLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQy9FLFFBQUksUUFBUSxFQUFFOztBQUVaLFVBQUksS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDO0FBQ3BDLGFBQU87QUFDTCxhQUFLLEVBQUwsS0FBSztBQUNMLGdCQUFRLEVBQUU7aUJBQU0sWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDO1NBQUE7T0FDNUUsQ0FBQztLQUNILE1BQU07QUFDTCxhQUFPLElBQUksQ0FBQztLQUNiO0dBQ0YsQ0FBQTtDQUNGLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL251Y2xpZGUtaGFjay9saWIvSHlwZXJjbGlja1Byb3ZpZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxudmFyIHtmaW5kRGVmaW5pdGlvbn0gPSByZXF1aXJlKCcuL2hhY2snKTtcbnZhciB7Z29Ub0xvY2F0aW9ufSA9IHJlcXVpcmUoJ251Y2xpZGUtYXRvbS1oZWxwZXJzJyk7XG5cbnZhciB7SEFDS19HUkFNTUFSfSA9IHJlcXVpcmUoJ251Y2xpZGUtaGFjay1jb21tb24vbGliL2NvbnN0YW50cycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgcHJpb3JpdHk6IDIwLFxuICBhc3luYyBnZXRTdWdnZXN0aW9uRm9yV29yZCh0ZXh0RWRpdG9yOiBUZXh0RWRpdG9yLCB0ZXh0OiBzdHJpbmcsIHJhbmdlOiBSYW5nZSkge1xuICAgIGlmIChIQUNLX0dSQU1NQVIgIT09IHRleHRFZGl0b3IuZ2V0R3JhbW1hcigpLnNjb3BlTmFtZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgdmFyIHtzdGFydDogcG9zaXRpb259ID0gcmFuZ2U7XG5cbiAgICAvLyBDcmVhdGUgdGhlIGFjdHVhbC1jYWxsIHByb21pc2Ugc3luY2hyb25vdXNseSBmb3IgbmV4dCBjYWxscyB0byBjb25zdW1lLlxuICAgIHZhciBsb2NhdGlvbiA9IGF3YWl0IGZpbmREZWZpbml0aW9uKHRleHRFZGl0b3IsIHBvc2l0aW9uLnJvdywgcG9zaXRpb24uY29sdW1uKTtcbiAgICBpZiAobG9jYXRpb24pIHtcbiAgICAgIC8vIE9wdGlvbmFsbHkgdXNlIHRoZSByYW5nZSByZXR1cm5lZCBmcm9tIHRoZSBkZWZpbml0aW9uIG1hdGNoLCBpZiBhbnkuXG4gICAgICB2YXIgcmFuZ2UgPSBsb2NhdGlvbi5yYW5nZSB8fCByYW5nZTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJhbmdlLFxuICAgICAgICBjYWxsYmFjazogKCkgPT4gZ29Ub0xvY2F0aW9uKGxvY2F0aW9uLmZpbGUsIGxvY2F0aW9uLmxpbmUsIGxvY2F0aW9uLmNvbHVtbiksXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH0sXG59O1xuIl19