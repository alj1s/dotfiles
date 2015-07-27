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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZsb3cvbGliL0h5cGVyY2xpY2tQcm92aWRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7O2VBVW1CLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQzs7SUFBbkQsc0JBQXNCLFlBQXRCLHNCQUFzQjs7Z0JBQ04sT0FBTyxDQUFDLHNCQUFzQixDQUFDOztJQUEvQyxZQUFZLGFBQVosWUFBWTs7QUFFakIsSUFBSSxRQUFRLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FDckIsV0FBVyxDQUNaLENBQUMsQ0FBQzs7QUFFSCxNQUFNLENBQUMsT0FBTyxHQUFHO0FBQ2YsVUFBUSxFQUFFLEVBQUU7QUFDWixzQkFBMEIsb0JBQUEsV0FBQyxVQUFzQixFQUFFLElBQVksRUFBRSxLQUFZLEVBQUU7QUFDN0UsUUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRSxDQUFDLFNBQVMsQ0FBQyxFQUFFO0FBQ3BELGFBQU8sSUFBSSxDQUFDO0tBQ2I7O0FBRUQsUUFBSSxJQUFJLEdBQUcsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3BCLFFBQVEsR0FBSSxLQUFLLENBQXhCLEtBQUs7O0FBQ1YsUUFBSSxRQUFRLEdBQUcsTUFBTSxzQkFBc0IsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQzNELGNBQWMsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxFQUFFLFFBQVEsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDdkYsUUFBSSxRQUFRLEVBQUU7QUFDWixhQUFPO0FBQ0wsYUFBSyxFQUFMLEtBQUs7QUFDTCxnQkFBUSxFQUFBLG9CQUFHO0FBQ1Qsc0JBQVksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQzdEO09BQ0YsQ0FBQztLQUNILE1BQU07QUFDTCxhQUFPLElBQUksQ0FBQztLQUNiO0dBQ0YsQ0FBQTtDQUNGLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL251Y2xpZGUtZmxvdy9saWIvSHlwZXJjbGlja1Byb3ZpZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cbnZhciB7Z2V0U2VydmljZUJ5TnVjbGlkZVVyaX0gPSByZXF1aXJlKCdudWNsaWRlLWNsaWVudCcpO1xudmFyIHtnb1RvTG9jYXRpb259ID0gcmVxdWlyZSgnbnVjbGlkZS1hdG9tLWhlbHBlcnMnKTtcblxudmFyIEdSQU1NQVJTID0gbmV3IFNldChbXG4gICdzb3VyY2UuanMnLFxuXSk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBwcmlvcml0eTogMjAsXG4gIGFzeW5jIGdldFN1Z2dlc3Rpb25Gb3JXb3JkKHRleHRFZGl0b3I6IFRleHRFZGl0b3IsIHRleHQ6IHN0cmluZywgcmFuZ2U6IFJhbmdlKSB7XG4gICAgaWYgKCFHUkFNTUFSUy5oYXModGV4dEVkaXRvci5nZXRHcmFtbWFyKCkuc2NvcGVOYW1lKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgdmFyIGZpbGUgPSB0ZXh0RWRpdG9yLmdldFBhdGgoKTtcbiAgICB2YXIge3N0YXJ0OiBwb3NpdGlvbn0gPSByYW5nZTtcbiAgICB2YXIgbG9jYXRpb24gPSBhd2FpdCBnZXRTZXJ2aWNlQnlOdWNsaWRlVXJpKCdGbG93U2VydmljZScsIGZpbGUpXG4gICAgICAgIC5maW5kRGVmaW5pdGlvbihmaWxlLCB0ZXh0RWRpdG9yLmdldFRleHQoKSwgcG9zaXRpb24ucm93ICsgMSwgcG9zaXRpb24uY29sdW1uICsgMSk7XG4gICAgaWYgKGxvY2F0aW9uKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByYW5nZSxcbiAgICAgICAgY2FsbGJhY2soKSB7XG4gICAgICAgICAgZ29Ub0xvY2F0aW9uKGxvY2F0aW9uLmZpbGUsIGxvY2F0aW9uLmxpbmUsIGxvY2F0aW9uLmNvbHVtbik7XG4gICAgICAgIH0sXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH0sXG59O1xuIl19