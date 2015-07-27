'use babel';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _require = require('nuclide-atom-helpers');

var extractWordAtPosition = _require.extractWordAtPosition;

var _require2 = require('nuclide-client');

var getServiceByNuclideUri = _require2.getServiceByNuclideUri;

var _require3 = require('atom');

var Range = _require3.Range;

var _require4 = require('nuclide-commons');

var getConfigValueAsync = _require4.getConfigValueAsync;

var JAVASCRIPT_WORD_REGEX = /[a-zA-Z0-9_$]+/g;

module.exports = (function () {
  function TypeHintProvider() {
    _classCallCheck(this, TypeHintProvider);
  }

  _createClass(TypeHintProvider, [{
    key: 'typeHint',
    value: _asyncToGenerator(function* (editor, position) {
      var enabled = yield getConfigValueAsync('nuclide-flow.enableTypeHints')();
      if (!enabled) {
        return null;
      }
      var filePath = editor.getPath();
      var contents = editor.getText();
      var flowService = yield getServiceByNuclideUri('FlowService', filePath);

      var type = yield flowService.getType(filePath, contents, position.row, position.column);
      if (type === null) {
        return null;
      }

      // TODO(nmote) refine this regex to better capture JavaScript expressions.
      // Having this regex be not quite right is just a display issue, though --
      // it only affects the location of the tooltip.
      var word = extractWordAtPosition(editor, position, JAVASCRIPT_WORD_REGEX);
      var range;
      if (word) {
        range = word.range;
      } else {
        range = new Range(position, position);
      }
      return {
        hint: type,
        range: range
      };
    })
  }]);

  return TypeHintProvider;
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZsb3cvbGliL1R5cGVIaW50UHJvdmlkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7ZUFXa0IsT0FBTyxDQUFDLHNCQUFzQixDQUFDOztJQUF4RCxxQkFBcUIsWUFBckIscUJBQXFCOztnQkFDSyxPQUFPLENBQUMsZ0JBQWdCLENBQUM7O0lBQW5ELHNCQUFzQixhQUF0QixzQkFBc0I7O2dCQUNiLE9BQU8sQ0FBQyxNQUFNLENBQUM7O0lBQXhCLEtBQUssYUFBTCxLQUFLOztnQkFDa0IsT0FBTyxDQUFDLGlCQUFpQixDQUFDOztJQUFqRCxtQkFBbUIsYUFBbkIsbUJBQW1COztBQUV4QixJQUFNLHFCQUFxQixHQUFHLGlCQUFpQixDQUFDOztBQUVoRCxNQUFNLENBQUMsT0FBTztXQUFTLGdCQUFnQjswQkFBaEIsZ0JBQWdCOzs7ZUFBaEIsZ0JBQWdCOzs2QkFFdkIsV0FBQyxNQUFrQixFQUFFLFFBQWUsRUFBc0I7QUFDdEUsVUFBSSxPQUFPLEdBQUcsTUFBTSxtQkFBbUIsQ0FBQyw4QkFBOEIsQ0FBQyxFQUFFLENBQUM7QUFDMUUsVUFBSSxDQUFDLE9BQU8sRUFBRTtBQUNaLGVBQU8sSUFBSSxDQUFDO09BQ2I7QUFDRCxVQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDaEMsVUFBSSxRQUFRLEdBQUcsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ2hDLFVBQUksV0FBVyxHQUFHLE1BQU0sc0JBQXNCLENBQUMsYUFBYSxFQUFFLFFBQVEsQ0FBQyxDQUFDOztBQUV4RSxVQUFJLElBQUksR0FBRyxNQUFNLFdBQVcsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUN4RixVQUFJLElBQUksS0FBSyxJQUFJLEVBQUU7QUFDakIsZUFBTyxJQUFJLENBQUM7T0FDYjs7Ozs7QUFLRCxVQUFJLElBQUksR0FBRyxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLHFCQUFxQixDQUFDLENBQUM7QUFDMUUsVUFBSSxLQUFLLENBQUM7QUFDVixVQUFJLElBQUksRUFBRTtBQUNSLGFBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO09BQ3BCLE1BQU07QUFDTCxhQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO09BQ3ZDO0FBQ0QsYUFBTztBQUNMLFlBQUksRUFBRSxJQUFJO0FBQ1YsYUFBSyxFQUFMLEtBQUs7T0FDTixDQUFDO0tBQ0g7OztTQTlCb0IsZ0JBQWdCO0lBZ0N0QyxDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZsb3cvbGliL1R5cGVIaW50UHJvdmlkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIge2V4dHJhY3RXb3JkQXRQb3NpdGlvbn0gPSByZXF1aXJlKCdudWNsaWRlLWF0b20taGVscGVycycpO1xudmFyIHtnZXRTZXJ2aWNlQnlOdWNsaWRlVXJpfSA9IHJlcXVpcmUoJ251Y2xpZGUtY2xpZW50Jyk7XG52YXIge1JhbmdlfSA9IHJlcXVpcmUoJ2F0b20nKTtcbnZhciB7Z2V0Q29uZmlnVmFsdWVBc3luY30gPSByZXF1aXJlKCdudWNsaWRlLWNvbW1vbnMnKTtcblxuY29uc3QgSkFWQVNDUklQVF9XT1JEX1JFR0VYID0gL1thLXpBLVowLTlfJF0rL2c7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgVHlwZUhpbnRQcm92aWRlciB7XG5cbiAgYXN5bmMgdHlwZUhpbnQoZWRpdG9yOiBUZXh0RWRpdG9yLCBwb3NpdGlvbjogUG9pbnQpOiBQcm9taXNlPD9UeXBlSGludD4ge1xuICAgIHZhciBlbmFibGVkID0gYXdhaXQgZ2V0Q29uZmlnVmFsdWVBc3luYygnbnVjbGlkZS1mbG93LmVuYWJsZVR5cGVIaW50cycpKCk7XG4gICAgaWYgKCFlbmFibGVkKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgdmFyIGZpbGVQYXRoID0gZWRpdG9yLmdldFBhdGgoKTtcbiAgICB2YXIgY29udGVudHMgPSBlZGl0b3IuZ2V0VGV4dCgpO1xuICAgIHZhciBmbG93U2VydmljZSA9IGF3YWl0IGdldFNlcnZpY2VCeU51Y2xpZGVVcmkoJ0Zsb3dTZXJ2aWNlJywgZmlsZVBhdGgpO1xuXG4gICAgdmFyIHR5cGUgPSBhd2FpdCBmbG93U2VydmljZS5nZXRUeXBlKGZpbGVQYXRoLCBjb250ZW50cywgcG9zaXRpb24ucm93LCBwb3NpdGlvbi5jb2x1bW4pO1xuICAgIGlmICh0eXBlID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBUT0RPKG5tb3RlKSByZWZpbmUgdGhpcyByZWdleCB0byBiZXR0ZXIgY2FwdHVyZSBKYXZhU2NyaXB0IGV4cHJlc3Npb25zLlxuICAgIC8vIEhhdmluZyB0aGlzIHJlZ2V4IGJlIG5vdCBxdWl0ZSByaWdodCBpcyBqdXN0IGEgZGlzcGxheSBpc3N1ZSwgdGhvdWdoIC0tXG4gICAgLy8gaXQgb25seSBhZmZlY3RzIHRoZSBsb2NhdGlvbiBvZiB0aGUgdG9vbHRpcC5cbiAgICB2YXIgd29yZCA9IGV4dHJhY3RXb3JkQXRQb3NpdGlvbihlZGl0b3IsIHBvc2l0aW9uLCBKQVZBU0NSSVBUX1dPUkRfUkVHRVgpO1xuICAgIHZhciByYW5nZTtcbiAgICBpZiAod29yZCkge1xuICAgICAgcmFuZ2UgPSB3b3JkLnJhbmdlO1xuICAgIH0gZWxzZSB7XG4gICAgICByYW5nZSA9IG5ldyBSYW5nZShwb3NpdGlvbiwgcG9zaXRpb24pO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgaGludDogdHlwZSxcbiAgICAgIHJhbmdlLFxuICAgIH07XG4gIH1cblxufTtcbiJdfQ==