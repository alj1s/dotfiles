'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var DiffViewModel = (function () {
  // The model will evolve with every step of the diff view to include more of the diff and source control logic.

  function DiffViewModel(uri, filePath) {
    _classCallCheck(this, DiffViewModel);

    this._uri = uri;
    this._filePath = filePath;
    this._diffState = null;
  }

  _createClass(DiffViewModel, [{
    key: 'fetchDiffState',
    value: _asyncToGenerator(function* () {
      var _this = this;

      var find = require('nuclide-commons').array.find;

      var rootDirectory = find(atom.project.getDirectories(), function (directory) {
        return directory.contains(_this._filePath);
      });
      if (!rootDirectory) {
        throw new Error('Cannot find root directory for file: ' + this._filePath);
      }
      var repository = yield atom.project.repositoryForDirectory(rootDirectory);
      if (!repository || repository.getType() !== 'hg') {
        throw new Error('Diff view only supports hg repositories right now: found ' + (repository && repository.getType()));
      }
      var committedContents = yield repository.fetchFileContentAtRevision(this._filePath);

      var _require = require('nuclide-client');

      var getClient = _require.getClient;

      var _require2 = require('nuclide-remote-uri');

      var getPath = _require2.getPath;

      var client = getClient(this._filePath);
      var localFilePath = getPath(this._filePath);
      var filesystemContents = yield client.readFile(localFilePath, 'utf8');

      this._diffState = {
        filePath: this._filePath,
        oldText: committedContents,
        newText: filesystemContents
      };
    })
  }, {
    key: 'getDiffState',
    value: function getDiffState() {
      if (!this._diffState) {
        throw new Error('No diff state is set!');
      }
      return this._diffState;
    }
  }, {
    key: 'getURI',
    value: function getURI() {
      return this._uri;
    }
  }, {
    key: 'computeDiff',
    value: function computeDiff(oldText, newText) {
      var _computeDiffChunks2 = this._computeDiffChunks(oldText, newText);

      var addedLines = _computeDiffChunks2.addedLines;
      var removedLines = _computeDiffChunks2.removedLines;
      var chunks = _computeDiffChunks2.chunks;

      var _computeOffsets2 = this._computeOffsets(chunks);

      var oldLineOffsets = _computeOffsets2.oldLineOffsets;
      var newLineOffsets = _computeOffsets2.newLineOffsets;

      return {
        addedLines: addedLines,
        removedLines: removedLines,
        oldLineOffsets: oldLineOffsets,
        newLineOffsets: newLineOffsets
      };
    }
  }, {
    key: '_computeDiffChunks',
    value: function _computeDiffChunks(oldText, newText) {

      var JsDiff = require('diff');

      // If the last line has changes, JsDiff doesn't return that.
      // Generally, content with new line ending are easier to calculate offsets for.
      if (oldText[oldText.length - 1] !== '\n' || newText[newText.length - 1] !== '\n') {
        oldText += '\n';
        newText += '\n';
      }

      var lineDiff = JsDiff.diffLines(oldText, newText);
      var chunks = [];

      var addedCount = 0;
      var removedCount = 0;
      var nextOffset = 0;
      var offset = 0;

      var addedLines = [];
      var removedLines = [];

      lineDiff.forEach(function (part) {
        var added = part.added;
        var removed = part.removed;
        var value = part.value;

        var count = value.split('\n').length - 1;
        if (!added && !removed) {
          addedCount += count;
          removedCount += count;
          offset = nextOffset;
          nextOffset = 0;
        } else if (added) {
          for (var i = 0; i < count; i++) {
            addedLines.push(addedCount + i);
          }
          addedCount += count;
          nextOffset += count;
        } else {
          for (var i = 0; i < count; i++) {
            removedLines.push(removedCount + i);
          }
          removedCount += count;
          nextOffset -= count;
        }
        chunks.push({ added: added, removed: removed, value: value, count: count, offset: offset });
        offset = 0;
      });
      return { addedLines: addedLines, removedLines: removedLines, chunks: chunks };
    }
  }, {
    key: '_computeOffsets',
    value: function _computeOffsets(diffChunks) {
      var newLineOffsets = {};
      var oldLineOffsets = {};

      var oldLineCount = 0;
      var newLineCount = 0;

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = diffChunks[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var chunk = _step.value;
          var added = chunk.added;
          var removed = chunk.removed;
          var offset = chunk.offset;
          var count = chunk.count;

          if (added) {
            newLineCount += count;
          } else if (removed) {
            oldLineCount += count;
          } else {
            if (offset < 0) {
              newLineOffsets[newLineCount] = offset * -1;
            } else if (offset > 0) {
              oldLineOffsets[oldLineCount] = offset;
            }
            newLineCount += count;
            oldLineCount += count;
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator['return']) {
            _iterator['return']();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return {
        oldLineOffsets: oldLineOffsets,
        newLineOffsets: newLineOffsets
      };
    }
  }]);

  return DiffViewModel;
})();

;

module.exports = DiffViewModel;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWRpZmYtdmlldy9saWIvRGlmZlZpZXdNb2RlbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBd0JOLGFBQWE7OztBQUVOLFdBRlAsYUFBYSxDQUVMLEdBQVcsRUFBRSxRQUFnQixFQUFFOzBCQUZ2QyxhQUFhOztBQUdmLFFBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO0FBQ2hCLFFBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO0FBQzFCLFFBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO0dBQ3hCOztlQU5HLGFBQWE7OzZCQVFHLGFBQWtCOzs7VUFDL0IsSUFBSSxHQUFJLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLEtBQUssQ0FBeEMsSUFBSTs7QUFDVCxVQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsRUFBRSxVQUFBLFNBQVM7ZUFBSSxTQUFTLENBQUMsUUFBUSxDQUFDLE1BQUssU0FBUyxDQUFDO09BQUEsQ0FBQyxDQUFDO0FBQ3pHLFVBQUksQ0FBQyxhQUFhLEVBQUU7QUFDbEIsY0FBTSxJQUFJLEtBQUssQ0FBQyx1Q0FBdUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7T0FDM0U7QUFDRCxVQUFJLFVBQVUsR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDMUUsVUFBSSxDQUFDLFVBQVUsSUFBSSxVQUFVLENBQUMsT0FBTyxFQUFFLEtBQUssSUFBSSxFQUFFO0FBQ2hELGNBQU0sSUFBSSxLQUFLLENBQUMsMkRBQTJELElBQUksVUFBVSxJQUFJLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQSxDQUFFLENBQUM7T0FDckg7QUFDRCxVQUFJLGlCQUFpQixHQUFHLE1BQU0sVUFBVSxD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Q0FBQzs7Ozs7OztBQUVyQiw2QkFBa0IsVUFBVSw4SEFBRTtjQUFyQixLQUFLO2NBQ1AsS0FBSyxHQUE0QixLQUFLLENBQXRDLEtBQUs7Y0FBRSxPQUFPLEdBQW1CLEtBQUssQ0FBL0IsT0FBTztjQUFFLE1BQU0sR0FBVyxLQUFLLENBQXRCLE1BQU07Y0FBRSxLQUFLLEdBQUksS0FBSyxDQUFkLEtBQUs7O0FBQ2xDLGNBQUksS0FBSyxFQUFFO0FBQ1Qsd0JBQVksSUFBSSxLQUFLLENBQUM7V0FDdkIsTUFBTSxJQUFJLE9BQU8sRUFBRTtBQUNsQix3QkFBWSxJQUFJLEtBQUssQ0FBQztXQUN2QixNQUFNO0FBQ0wsZ0JBQUksTUFBTSxHQUFHLENBQUMsRUFBRTtBQUNkLDRCQUFjLENBQUMsWUFBWSxDQUFDLEdBQUcsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO2FBQzVDLE1BQU0sSUFBSSxNQUFNLEdBQUcsQ0FBQyxFQUFFO0FBQ3JCLDRCQUFjLENBQUMsWUFBWSxDQUFDLEdBQUcsTUFBTSxDQUFDO2FBQ3ZDO0FBQ0Qsd0JBQVksSUFBSSxLQUFLLENBQUM7QUFDdEIsd0JBQVksSUFBSSxLQUFLLENBQUM7V0FDdkI7U0FDRjs7Ozs7Ozs7Ozs7Ozs7OztBQUVELGFBQU87QUFDTCxzQkFBYyxFQUFkLGNBQWM7QUFDZCxzQkFBYyxFQUFkLGNBQWM7T0FDZixDQUFDO0tBQ0g7OztTQXZJRyxhQUFhOzs7QUF3SWxCLENBQUM7O0FBRUYsTUFBTSxDQUFDLE9BQU8sR0FBRyxhQUFhLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL251Y2xpZGUtZGlmZi12aWV3L2xpYi9EaWZmVmlld01vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxudHlwZSBEaWZmVmlld1N0YXRlID0ge1xuICBmaWxlUGF0aDogc3RyaW5nO1xuICBvbGRUZXh0OiBzdHJpbmc7XG4gIG5ld1RleHQ6IHN0cmluZztcbn07XG5cbnR5cGUgVGV4dERpZmYgPSB7XG4gIGFkZGVkTGluZXM6IEFycmF5PG51bWJlcj47XG4gIHJlbW92ZWRMaW5lczogQXJyYXk8bnVtYmVyPjtcbiAgb2xkTGluZU9mZnNldHM6IHtbbGluZU51bWJlcjogc3RyaW5nXTogbnVtYmVyfTtcbiAgbmV3TGluZU9mZnNldHM6IHtbbGluZU51bWJlcjogc3RyaW5nXTogbnVtYmVyfTtcbn07XG5cbmNsYXNzIERpZmZWaWV3TW9kZWwge1xuICAvLyBUaGUgbW9kZWwgd2lsbCBldm9sdmUgd2l0aCBldmVyeSBzdGVwIG9mIHRoZSBkaWZmIHZpZXcgdG8gaW5jbHVkZSBtb3JlIG9mIHRoZSBkaWZmIGFuZCBzb3VyY2UgY29udHJvbCBsb2dpYy5cbiAgY29uc3RydWN0b3IodXJpOiBzdHJpbmcsIGZpbGVQYXRoOiBzdHJpbmcpIHtcbiAgICB0aGlzLl91cmkgPSB1cmk7XG4gICAgdGhpcy5fZmlsZVBhdGggPSBmaWxlUGF0aDtcbiAgICB0aGlzLl9kaWZmU3RhdGUgPSBudWxsO1xuICB9XG5cbiAgYXN5bmMgZmV0Y2hEaWZmU3RhdGUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdmFyIHtmaW5kfSA9IHJlcXVpcmUoJ251Y2xpZGUtY29tbW9ucycpLmFycmF5O1xuICAgIHZhciByb290RGlyZWN0b3J5ID0gZmluZChhdG9tLnByb2plY3QuZ2V0RGlyZWN0b3JpZXMoKSwgZGlyZWN0b3J5ID0+IGRpcmVjdG9yeS5jb250YWlucyh0aGlzLl9maWxlUGF0aCkpO1xuICAgIGlmICghcm9vdERpcmVjdG9yeSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgZmluZCByb290IGRpcmVjdG9yeSBmb3IgZmlsZTogJyArIHRoaXMuX2ZpbGVQYXRoKTtcbiAgICB9XG4gICAgdmFyIHJlcG9zaXRvcnkgPSBhd2FpdCBhdG9tLnByb2plY3QucmVwb3NpdG9yeUZvckRpcmVjdG9yeShyb290RGlyZWN0b3J5KTtcbiAgICBpZiAoIXJlcG9zaXRvcnkgfHwgcmVwb3NpdG9yeS5nZXRUeXBlKCkgIT09ICdoZycpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRGlmZiB2aWV3IG9ubHkgc3VwcG9ydHMgaGcgcmVwb3NpdG9yaWVzIHJpZ2h0IG5vdzogZm91bmQgJyArIChyZXBvc2l0b3J5ICYmIHJlcG9zaXRvcnkuZ2V0VHlwZSgpKSk7XG4gICAgfVxuICAgIHZhciBjb21taXR0ZWRDb250ZW50cyA9IGF3YWl0IHJlcG9zaXRvcnkuZmV0Y2hGaWxlQ29udGVudEF0UmV2aXNpb24odGhpcy5fZmlsZVBhdGgpO1xuXG4gICAgdmFyIHtnZXRDbGllbnR9ID0gcmVxdWlyZSgnbnVjbGlkZS1jbGllbnQnKTtcbiAgICB2YXIge2dldFBhdGh9ID0gcmVxdWlyZSgnbnVjbGlkZS1yZW1vdGUtdXJpJyk7XG5cbiAgICB2YXIgY2xpZW50ID0gZ2V0Q2xpZW50KHRoaXMuX2ZpbGVQYXRoKTtcbiAgICB2YXIgbG9jYWxGaWxlUGF0aCA9IGdldFBhdGgodGhpcy5fZmlsZVBhdGgpO1xuICAgIHZhciBmaWxlc3lzdGVtQ29udGVudHMgPSBhd2FpdCBjbGllbnQucmVhZEZpbGUobG9jYWxGaWxlUGF0aCwgJ3V0ZjgnKTtcblxuICAgIHRoaXMuX2RpZmZTdGF0ZSA9IHtcbiAgICAgIGZpbGVQYXRoOiB0aGlzLl9maWxlUGF0aCxcbiAgICAgIG9sZFRleHQ6IGNvbW1pdHRlZENvbnRlbnRzLFxuICAgICAgbmV3VGV4dDogZmlsZXN5c3RlbUNvbnRlbnRzLFxuICAgIH07XG4gIH1cblxuICBnZXREaWZmU3RhdGUoKTogRGlmZlZpZXdTdGF0ZSB7XG4gICAgaWYgKCF0aGlzLl9kaWZmU3RhdGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZGlmZiBzdGF0ZSBpcyBzZXQhJyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9kaWZmU3RhdGU7XG4gIH1cblxuICBnZXRVUkkoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fdXJpO1xuICB9XG5cbiAgY29tcHV0ZURpZmYob2xkVGV4dDogc3RyaW5nLCBuZXdUZXh0OiBzdHJpbmcpOiBUZXh0RGlmZiB7XG4gICAgdmFyIHthZGRlZExpbmVzLCByZW1vdmVkTGluZXMsIGNodW5rc30gPSB0aGlzLl9jb21wdXRlRGlmZkNodW5rcyhvbGRUZXh0LCBuZXdUZXh0KTtcbiAgICB2YXIge29sZExpbmVPZmZzZXRzLCBuZXdMaW5lT2Zmc2V0c30gPSB0aGlzLl9jb21wdXRlT2Zmc2V0cyhjaHVua3MpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGFkZGVkTGluZXMsXG4gICAgICByZW1vdmVkTGluZXMsXG4gICAgICBvbGRMaW5lT2Zmc2V0cyxcbiAgICAgIG5ld0xpbmVPZmZzZXRzLFxuICAgIH07XG4gIH1cblxuICBfY29tcHV0ZURpZmZDaHVua3Mob2xkVGV4dDogc3RyaW5nLCBuZXdUZXh0OiBzdHJpbmcpXG4gICAgICA6e2FkZGVkTGluZXM6IEFycmF5PG51bWJlcj47IHJlbW92ZWRMaW5lczogQXJyYXk8bnVtYmVyPjsgY2h1bmtzOiBBcnJheTxhbnk+O30ge1xuXG4gICAgdmFyIEpzRGlmZiA9IHJlcXVpcmUoJ2RpZmYnKTtcblxuICAgIC8vIElmIHRoZSBsYXN0IGxpbmUgaGFzIGNoYW5nZXMsIEpzRGlmZiBkb2Vzbid0IHJldHVybiB0aGF0LlxuICAgIC8vIEdlbmVyYWxseSwgY29udGVudCB3aXRoIG5ldyBsaW5lIGVuZGluZyBhcmUgZWFzaWVyIHRvIGNhbGN1bGF0ZSBvZmZzZXRzIGZvci5cbiAgICBpZiAob2xkVGV4dFtvbGRUZXh0Lmxlbmd0aCAtIDFdICE9PSAnXFxuJyB8fCBuZXdUZXh0W25ld1RleHQubGVuZ3RoIC0gMV0gIT09ICdcXG4nKSB7XG4gICAgICBvbGRUZXh0ICs9ICdcXG4nO1xuICAgICAgbmV3VGV4dCArPSAnXFxuJztcbiAgICB9XG5cbiAgICB2YXIgbGluZURpZmYgPSBKc0RpZmYuZGlmZkxpbmVzKG9sZFRleHQsIG5ld1RleHQpO1xuICAgIHZhciBjaHVua3MgPSBbXTtcblxuICAgIHZhciBhZGRlZENvdW50ID0gMDtcbiAgICB2YXIgcmVtb3ZlZENvdW50ID0gMDtcbiAgICB2YXIgbmV4dE9mZnNldCA9IDA7XG4gICAgdmFyIG9mZnNldCA9IDA7XG5cbiAgICB2YXIgYWRkZWRMaW5lcyA9IFtdO1xuICAgIHZhciByZW1vdmVkTGluZXMgPSBbXTtcblxuICAgIGxpbmVEaWZmLmZvckVhY2gocGFydCA9PiB7XG4gICAgICB2YXIge2FkZGVkLCByZW1vdmVkLCB2YWx1ZX0gPSBwYXJ0O1xuICAgICAgdmFyIGNvdW50ID0gdmFsdWUuc3BsaXQoJ1xcbicpLmxlbmd0aCAtIDE7XG4gICAgICBpZiAoIWFkZGVkICYmICFyZW1vdmVkKSB7XG4gICAgICAgIGFkZGVkQ291bnQgKz0gY291bnQ7XG4gICAgICAgIHJlbW92ZWRDb3VudCArPSBjb3VudDtcbiAgICAgICAgb2Zmc2V0ID0gbmV4dE9mZnNldDtcbiAgICAgICAgbmV4dE9mZnNldCA9IDA7XG4gICAgICB9IGVsc2UgaWYgKGFkZGVkKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgIGFkZGVkTGluZXMucHVzaChhZGRlZENvdW50ICsgaSk7XG4gICAgICAgIH1cbiAgICAgICAgYWRkZWRDb3VudCArPSBjb3VudDtcbiAgICAgICAgbmV4dE9mZnNldCArPSBjb3VudDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgIHJlbW92ZWRMaW5lcy5wdXNoKHJlbW92ZWRDb3VudCArIGkpO1xuICAgICAgICB9XG4gICAgICAgIHJlbW92ZWRDb3VudCArPSBjb3VudDtcbiAgICAgICAgbmV4dE9mZnNldCAtPSBjb3VudDtcbiAgICAgIH1cbiAgICAgIGNodW5rcy5wdXNoKHthZGRlZCwgcmVtb3ZlZCwgdmFsdWUsIGNvdW50LCBvZmZzZXR9KTtcbiAgICAgIG9mZnNldCA9IDA7XG4gICAgfSk7XG4gICAgcmV0dXJuIHthZGRlZExpbmVzLCByZW1vdmVkTGluZXMsIGNodW5rc307XG4gIH1cblxuICBfY29tcHV0ZU9mZnNldHMoZGlmZkNodW5rczogQXJyYXk8YW55Pik6IHtvbGRMaW5lT2Zmc2V0czogYW55OyBuZXdMaW5lT2Zmc2V0czogYW55O30ge1xuICAgIHZhciBuZXdMaW5lT2Zmc2V0cyA9IHt9O1xuICAgIHZhciBvbGRMaW5lT2Zmc2V0cyA9IHt9O1xuXG4gICAgdmFyIG9sZExpbmVDb3VudCA9IDA7XG4gICAgdmFyIG5ld0xpbmVDb3VudCA9IDA7XG5cbiAgICBmb3IgKHZhciBjaHVuayBvZiBkaWZmQ2h1bmtzKSB7XG4gICAgICB2YXIge2FkZGVkLCByZW1vdmVkLCBvZmZzZXQsIGNvdW50fSA9IGNodW5rO1xuICAgICAgaWYgKGFkZGVkKSB7XG4gICAgICAgIG5ld0xpbmVDb3VudCArPSBjb3VudDtcbiAgICAgIH0gZWxzZSBpZiAocmVtb3ZlZCkge1xuICAgICAgICBvbGRMaW5lQ291bnQgKz0gY291bnQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAob2Zmc2V0IDwgMCkge1xuICAgICAgICAgIG5ld0xpbmVPZmZzZXRzW25ld0xpbmVDb3VudF0gPSBvZmZzZXQgKiAtMTtcbiAgICAgICAgfSBlbHNlIGlmIChvZmZzZXQgPiAwKSB7XG4gICAgICAgICAgb2xkTGluZU9mZnNldHNbb2xkTGluZUNvdW50XSA9IG9mZnNldDtcbiAgICAgICAgfVxuICAgICAgICBuZXdMaW5lQ291bnQgKz0gY291bnQ7XG4gICAgICAgIG9sZExpbmVDb3VudCArPSBjb3VudDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgb2xkTGluZU9mZnNldHMsXG4gICAgICBuZXdMaW5lT2Zmc2V0cyxcbiAgICB9O1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IERpZmZWaWV3TW9kZWw7XG4iXX0=