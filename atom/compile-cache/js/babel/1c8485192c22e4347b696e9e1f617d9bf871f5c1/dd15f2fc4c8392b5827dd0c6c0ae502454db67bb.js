'use babel';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _require = require('atom');

var Range = _require.Range;

var _require2 = require('./editor-utils');

var buildLineRangesWithOffsets = _require2.buildLineRangesWithOffsets;

/**
 * The DiffViewEditor manages the lifecycle of the two editors used in the diff view,
 * and controls its rendering of highlights and offsets.
 */
module.exports = (function () {
  function DiffViewEditor(editorElement) {
    var _this = this;

    _classCallCheck(this, DiffViewEditor);

    this._editorElement = editorElement;
    this._editor = editorElement.getModel();

    this._markers = [];
    this._lineOffsets = {};

    // Ugly Hack to the display buffer to allow fake soft wrapped lines,
    // to create the non-numbered empty space needed between real text buffer lines.
    this._originalBuildScreenLines = this._editor.displayBuffer.buildScreenLines;
    this._editor.displayBuffer.buildScreenLines = function () {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _this._buildScreenLinesWithOffsets.apply(_this, args);
    };

    // There is no editor API to cancel foldability, but deep inside the line state creation,
    // it uses those functions to determine if a line is foldable or not.
    // For Diff View, folding breaks offsets, hence we need to make it unfoldable.
    this._editor.isFoldableAtScreenRow = this._editor.isFoldableAtBufferRow = function () {
      return false;
    };
  }

  _createClass(DiffViewEditor, [{
    key: 'setFileContents',
    value: function setFileContents(filePath, contents) {
      this._editor.setText(contents);
      var grammar = atom.grammars.selectGrammar(filePath, contents);
      this._editor.setGrammar(grammar);
    }
  }, {
    key: 'getText',
    value: function getText() {
      return this._editor.getText();
    }
  }, {
    key: 'setHighlightedLines',

    /**
     * @param addedLines An array of buffer line numbers that should be highlighted as added.
     * @param removedLines An array of buffer line numbers that should be highlighted as removed.
     */
    value: function setHighlightedLines() {
      var _this2 = this;

      var addedLines = arguments[0] === undefined ? [] : arguments[0];
      var removedLines = arguments[1] === undefined ? [] : arguments[1];
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this._markers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var marker = _step.value;

          marker.destroy();
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

      this._markers = addedLines.map(function (lineNumber) {
        return _this2._createLineMarker(lineNumber, 'insert');
      }).concat(removedLines.map(function (lineNumber) {
        return _this2._createLineMarker(lineNumber, 'delete');
      }));
    }
  }, {
    key: '_createLineMarker',

    /**
     * @param lineNumber A buffer line number to be highlighted.
     * @param type The type of highlight to be applied to the line.
    *    Could be a value of: ['insert', 'delete'].
     */
    value: function _createLineMarker(lineNumber, type) {
      var screenPosition = this._editor.screenPositionForBufferPosition({ row: lineNumber, column: 0 });
      var range = new Range(screenPosition, { row: screenPosition.row, column: this._editor.lineTextForScreenRow(screenPosition.row).length }
      // TODO: highlight the full line when the mapping between buffer lines to screen line is implemented.
      // {row: screenPosition.row + 1, column: 0}
      );
      var marker = this._editor.markScreenRange(range, { invalidate: 'never' });
      var klass = 'diff-view-' + type;
      this._editor.decorateMarker(marker, { type: 'line-number', 'class': klass });
      this._editor.decorateMarker(marker, { type: 'highlight', 'class': klass });
      return marker;
    }
  }, {
    key: 'setOffsets',
    value: function setOffsets(lineOffsets) {
      this._lineOffsets = lineOffsets;
      // When the diff view is editable: upon edits in the new editor, the old editor needs to update its
      // rendering state to show the offset wrapped lines.
      // This isn't a public API, but came from a discussion on the Atom public channel.
      // Needed Atom API: Request a full re-render from an editor.
      this._editor.displayBuffer.updateAllScreenLines();
      this._editorElement.component.presenter.updateState();
    }
  }, {
    key: '_buildScreenLinesWithOffsets',
    value: function _buildScreenLinesWithOffsets(startBufferRow, endBufferRow) {
      var _originalBuildScreenLines$apply = this._originalBuildScreenLines.apply(this._editor.displayBuffer, arguments);

      var regions = _originalBuildScreenLines$apply.regions;
      var screenLines = _originalBuildScreenLines$apply.screenLines;

      if (!Object.keys(this._lineOffsets).length) {
        return { regions: regions, screenLines: screenLines };
      }

      return buildLineRangesWithOffsets(screenLines, this._lineOffsets, startBufferRow, endBufferRow, function () {
        var copy = screenLines[0].copy();
        copy.token = [];
        copy.text = 'empty_lolo';
        copy.tags = [];
        return copy;
      });
    }
  }, {
    key: 'setReadOnly',
    value: function setReadOnly() {
      // Unfotunately, there is no other clean way to make an editor read only.
      // Got this from Atom's code to make an editor read-only.
      // Filed an issue: https://github.com/atom/atom/issues/6880
      this._editorElement.removeAttribute('tabindex');
      this._editor.getDecorations({ 'class': 'cursor-line', type: 'line' })[0].destroy();
    }
  }]);

  return DiffViewEditor;
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWRpZmYtdmlldy9saWIvRGlmZlZpZXdFZGl0b3IuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7O2VBV0csT0FBTyxDQUFDLE1BQU0sQ0FBQzs7SUFBekIsS0FBSyxZQUFMLEtBQUs7O2dCQUN5QixPQUFPLENBQUMsZ0JBQWdCLENBQUM7O0lBQXZELDBCQUEwQixhQUExQiwwQkFBMEI7Ozs7OztBQU0vQixNQUFNLENBQUMsT0FBTztBQUVELFdBRlUsY0FBYyxDQUV2QixhQUFnQyxFQUFFOzs7MEJBRnpCLGNBQWM7O0FBR2pDLFFBQUksQ0FBQyxjQUFjLEdBQUcsYUFBYSxDQUFDO0FBQ3BDLFFBQUksQ0FBQyxPQUFPLEdBQUcsYUFBYSxDQUFDLFFBQVEsRUFBRSxDQUFDOztBQUV4QyxRQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztBQUNuQixRQUFJLENBQUMsWUFBWSxHQUFHLEVBQUUsQ0FBQzs7OztBQUl2QixRQUFJLENBQUMseUJBQXlCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUM7QUFDN0UsUUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLEdBQUc7d0NBQUksSUFBSTtBQUFKLFlBQUk7OzthQUFLLE1BQUssNEJBQTRCLENBQUMsS0FBSyxRQUFPLElBQUksQ0FBQztLQUFBLENBQUM7Ozs7O0FBSy9HLFFBQUksQ0FBQyxPQUFPLENBQUMscUJBQXFCLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsR0FBRzthQUFNLEtBQUs7S0FBQSxDQUFDO0dBQ3ZGOztlQWxCb0IsY0FBYzs7V0FvQnBCLHlCQUFDLFFBQWdCLEVBQUUsUUFBZ0IsRUFBUTtBQUN4RCxVQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUMvQixVQUFJLE9B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WSxFQUM1RixZQUFNO0FBQ0osWUFBSSxJQUFJLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ2pDLFlBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ2hCLFlBQUksQ0FBQyxJQUFJLEdBQUcsWUFBWSxDQUFDO0FBQ3pCLFlBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBQ2YsZUFBTyxJQUFJLENBQUM7T0FDYixDQUNGLENBQUM7S0FDSDs7O1dBRVUsdUJBQVM7Ozs7QUFJbEIsVUFBSSxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDaEQsVUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsRUFBQyxTQUFPLGFBQWEsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztLQUNoRjs7O1NBL0ZvQixjQUFjO0lBZ0dwQyxDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWRpZmYtdmlldy9saWIvRGlmZlZpZXdFZGl0b3IuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIge1JhbmdlfSAgPSByZXF1aXJlKCdhdG9tJyk7XG52YXIge2J1aWxkTGluZVJhbmdlc1dpdGhPZmZzZXRzfSA9IHJlcXVpcmUoJy4vZWRpdG9yLXV0aWxzJyk7XG5cbi8qKlxuICogVGhlIERpZmZWaWV3RWRpdG9yIG1hbmFnZXMgdGhlIGxpZmVjeWNsZSBvZiB0aGUgdHdvIGVkaXRvcnMgdXNlZCBpbiB0aGUgZGlmZiB2aWV3LFxuICogYW5kIGNvbnRyb2xzIGl0cyByZW5kZXJpbmcgb2YgaGlnaGxpZ2h0cyBhbmQgb2Zmc2V0cy5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBEaWZmVmlld0VkaXRvciB7XG5cbiAgY29uc3RydWN0b3IoZWRpdG9yRWxlbWVudDogVGV4dEVkaXRvckVsZW1lbnQpIHtcbiAgICB0aGlzLl9lZGl0b3JFbGVtZW50ID0gZWRpdG9yRWxlbWVudDtcbiAgICB0aGlzLl9lZGl0b3IgPSBlZGl0b3JFbGVtZW50LmdldE1vZGVsKCk7XG5cbiAgICB0aGlzLl9tYXJrZXJzID0gW107XG4gICAgdGhpcy5fbGluZU9mZnNldHMgPSB7fTtcblxuICAgIC8vIFVnbHkgSGFjayB0byB0aGUgZGlzcGxheSBidWZmZXIgdG8gYWxsb3cgZmFrZSBzb2Z0IHdyYXBwZWQgbGluZXMsXG4gICAgLy8gdG8gY3JlYXRlIHRoZSBub24tbnVtYmVyZWQgZW1wdHkgc3BhY2UgbmVlZGVkIGJldHdlZW4gcmVhbCB0ZXh0IGJ1ZmZlciBsaW5lcy5cbiAgICB0aGlzLl9vcmlnaW5hbEJ1aWxkU2NyZWVuTGluZXMgPSB0aGlzLl9lZGl0b3IuZGlzcGxheUJ1ZmZlci5idWlsZFNjcmVlbkxpbmVzO1xuICAgIHRoaXMuX2VkaXRvci5kaXNwbGF5QnVmZmVyLmJ1aWxkU2NyZWVuTGluZXMgPSAoLi4uYXJncykgPT4gdGhpcy5fYnVpbGRTY3JlZW5MaW5lc1dpdGhPZmZzZXRzLmFwcGx5KHRoaXMsIGFyZ3MpO1xuXG4gICAgLy8gVGhlcmUgaXMgbm8gZWRpdG9yIEFQSSB0byBjYW5jZWwgZm9sZGFiaWxpdHksIGJ1dCBkZWVwIGluc2lkZSB0aGUgbGluZSBzdGF0ZSBjcmVhdGlvbixcbiAgICAvLyBpdCB1c2VzIHRob3NlIGZ1bmN0aW9ucyB0byBkZXRlcm1pbmUgaWYgYSBsaW5lIGlzIGZvbGRhYmxlIG9yIG5vdC5cbiAgICAvLyBGb3IgRGlmZiBWaWV3LCBmb2xkaW5nIGJyZWFrcyBvZmZzZXRzLCBoZW5jZSB3ZSBuZWVkIHRvIG1ha2UgaXQgdW5mb2xkYWJsZS5cbiAgICB0aGlzLl9lZGl0b3IuaXNGb2xkYWJsZUF0U2NyZWVuUm93ID0gdGhpcy5fZWRpdG9yLmlzRm9sZGFibGVBdEJ1ZmZlclJvdyA9ICgpID0+IGZhbHNlO1xuICB9XG5cbiAgc2V0RmlsZUNvbnRlbnRzKGZpbGVQYXRoOiBzdHJpbmcsIGNvbnRlbnRzOiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLl9lZGl0b3Iuc2V0VGV4dChjb250ZW50cyk7XG4gICAgdmFyIGdyYW1tYXIgPSBhdG9tLmdyYW1tYXJzLnNlbGVjdEdyYW1tYXIoZmlsZVBhdGgsIGNvbnRlbnRzKTtcbiAgICB0aGlzLl9lZGl0b3Iuc2V0R3JhbW1hcihncmFtbWFyKTtcbiAgfVxuXG4gIGdldFRleHQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fZWRpdG9yLmdldFRleHQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0gYWRkZWRMaW5lcyBBbiBhcnJheSBvZiBidWZmZXIgbGluZSBudW1iZXJzIHRoYXQgc2hvdWxkIGJlIGhpZ2hsaWdodGVkIGFzIGFkZGVkLlxuICAgKiBAcGFyYW0gcmVtb3ZlZExpbmVzIEFuIGFycmF5IG9mIGJ1ZmZlciBsaW5lIG51bWJlcnMgdGhhdCBzaG91bGQgYmUgaGlnaGxpZ2h0ZWQgYXMgcmVtb3ZlZC5cbiAgICovXG4gIHNldEhpZ2hsaWdodGVkTGluZXMoYWRkZWRMaW5lczogP0FycmF5PG51bWJlcj4gPSBbXSwgcmVtb3ZlZExpbmVzOiA/QXJyYXk8bnVtYmVyPiA9IFtdKSB7XG4gICAgZm9yICh2YXIgbWFya2VyIG9mIHRoaXMuX21hcmtlcnMpIHtcbiAgICAgIG1hcmtlci5kZXN0cm95KCk7XG4gICAgfVxuICAgIHRoaXMuX21hcmtlcnMgPSBhZGRlZExpbmVzLm1hcChsaW5lTnVtYmVyID0+IHRoaXMuX2NyZWF0ZUxpbmVNYXJrZXIobGluZU51bWJlciwgJ2luc2VydCcpKVxuICAgICAgICAuY29uY2F0KHJlbW92ZWRMaW5lcy5tYXAobGluZU51bWJlciA9PiB0aGlzLl9jcmVhdGVMaW5lTWFya2VyKGxpbmVOdW1iZXIsICdkZWxldGUnKSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBsaW5lTnVtYmVyIEEgYnVmZmVyIGxpbmUgbnVtYmVyIHRvIGJlIGhpZ2hsaWdodGVkLlxuICAgKiBAcGFyYW0gdHlwZSBUaGUgdHlwZSBvZiBoaWdobGlnaHQgdG8gYmUgYXBwbGllZCB0byB0aGUgbGluZS5cbiAgKiAgICBDb3VsZCBiZSBhIHZhbHVlIG9mOiBbJ2luc2VydCcsICdkZWxldGUnXS5cbiAgICovXG4gIF9jcmVhdGVMaW5lTWFya2VyKGxpbmVOdW1iZXI6IG51bWJlciwgdHlwZTogc3RyaW5nKTogTWFya2VyIHtcbiAgICB2YXIgc2NyZWVuUG9zaXRpb24gPSB0aGlzLl9lZGl0b3Iuc2NyZWVuUG9zaXRpb25Gb3JCdWZmZXJQb3NpdGlvbih7cm93OiBsaW5lTnVtYmVyLCBjb2x1bW46IDB9KTtcbiAgICB2YXIgcmFuZ2UgPSBuZXcgUmFuZ2UoXG4gICAgICAgIHNjcmVlblBvc2l0aW9uLFxuICAgICAgICB7cm93OiBzY3JlZW5Qb3NpdGlvbi5yb3csIGNvbHVtbjogdGhpcy5fZWRpdG9yLmxpbmVUZXh0Rm9yU2NyZWVuUm93KHNjcmVlblBvc2l0aW9uLnJvdykubGVuZ3RofVxuICAgICAgICAvLyBUT0RPOiBoaWdobGlnaHQgdGhlIGZ1bGwgbGluZSB3aGVuIHRoZSBtYXBwaW5nIGJldHdlZW4gYnVmZmVyIGxpbmVzIHRvIHNjcmVlbiBsaW5lIGlzIGltcGxlbWVudGVkLlxuICAgICAgICAvLyB7cm93OiBzY3JlZW5Qb3NpdGlvbi5yb3cgKyAxLCBjb2x1bW46IDB9XG4gICAgKTtcbiAgICB2YXIgbWFya2VyID0gdGhpcy5fZWRpdG9yLm1hcmtTY3JlZW5SYW5nZShyYW5nZSwge2ludmFsaWRhdGU6ICduZXZlcid9KTtcbiAgICB2YXIga2xhc3MgPSAnZGlmZi12aWV3LScgKyB0eXBlO1xuICAgIHRoaXMuX2VkaXRvci5kZWNvcmF0ZU1hcmtlcihtYXJrZXIsIHt0eXBlOiAnbGluZS1udW1iZXInLCBjbGFzczoga2xhc3N9KTtcbiAgICB0aGlzLl9lZGl0b3IuZGVjb3JhdGVNYXJrZXIobWFya2VyLCB7dHlwZTogJ2hpZ2hsaWdodCcsIGNsYXNzOiBrbGFzc30pO1xuICAgIHJldHVybiBtYXJrZXI7XG4gIH1cblxuICBzZXRPZmZzZXRzKGxpbmVPZmZzZXRzOiBhbnkpOiB2b2lkIHtcbiAgICB0aGlzLl9saW5lT2Zmc2V0cyA9IGxpbmVPZmZzZXRzO1xuICAgIC8vIFdoZW4gdGhlIGRpZmYgdmlldyBpcyBlZGl0YWJsZTogdXBvbiBlZGl0cyBpbiB0aGUgbmV3IGVkaXRvciwgdGhlIG9sZCBlZGl0b3IgbmVlZHMgdG8gdXBkYXRlIGl0c1xuICAgIC8vIHJlbmRlcmluZyBzdGF0ZSB0byBzaG93IHRoZSBvZmZzZXQgd3JhcHBlZCBsaW5lcy5cbiAgICAvLyBUaGlzIGlzbid0IGEgcHVibGljIEFQSSwgYnV0IGNhbWUgZnJvbSBhIGRpc2N1c3Npb24gb24gdGhlIEF0b20gcHVibGljIGNoYW5uZWwuXG4gICAgLy8gTmVlZGVkIEF0b20gQVBJOiBSZXF1ZXN0IGEgZnVsbCByZS1yZW5kZXIgZnJvbSBhbiBlZGl0b3IuXG4gICAgdGhpcy5fZWRpdG9yLmRpc3BsYXlCdWZmZXIudXBkYXRlQWxsU2NyZWVuTGluZXMoKTtcbiAgICB0aGlzLl9lZGl0b3JFbGVtZW50LmNvbXBvbmVudC5wcmVzZW50ZXIudXBkYXRlU3RhdGUoKTtcbiAgfVxuXG4gIF9idWlsZFNjcmVlbkxpbmVzV2l0aE9mZnNldHMoc3RhcnRCdWZmZXJSb3c6IG51bWJlciwgZW5kQnVmZmVyUm93OiBudW1iZXIpOiBMaW5lUmFuZ2VzV2l0aE9mZnNldHMge1xuICAgIHZhciB7cmVnaW9ucywgc2NyZWVuTGluZXN9ID0gdGhpcy5fb3JpZ2luYWxCdWlsZFNjcmVlbkxpbmVzLmFwcGx5KHRoaXMuX2VkaXRvci5kaXNwbGF5QnVmZmVyLCBhcmd1bWVudHMpO1xuICAgIGlmICghT2JqZWN0LmtleXModGhpcy5fbGluZU9mZnNldHMpLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHtyZWdpb25zLCBzY3JlZW5MaW5lc307XG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1aWxkTGluZVJhbmdlc1dpdGhPZmZzZXRzKHNjcmVlbkxpbmVzLCB0aGlzLl9saW5lT2Zmc2V0cywgc3RhcnRCdWZmZXJSb3csIGVuZEJ1ZmZlclJvdyxcbiAgICAgICgpID0+IHtcbiAgICAgICAgdmFyIGNvcHkgPSBzY3JlZW5MaW5lc1swXS5jb3B5KCk7XG4gICAgICAgIGNvcHkudG9rZW4gPSBbXTtcbiAgICAgICAgY29weS50ZXh0ID0gJ2VtcHR5X2xvbG8nO1xuICAgICAgICBjb3B5LnRhZ3MgPSBbXTtcbiAgICAgICAgcmV0dXJuIGNvcHk7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIHNldFJlYWRPbmx5KCk6IHZvaWQge1xuICAgIC8vIFVuZm90dW5hdGVseSwgdGhlcmUgaXMgbm8gb3RoZXIgY2xlYW4gd2F5IHRvIG1ha2UgYW4gZWRpdG9yIHJlYWQgb25seS5cbiAgICAvLyBHb3QgdGhpcyBmcm9tIEF0b20ncyBjb2RlIHRvIG1ha2UgYW4gZWRpdG9yIHJlYWQtb25seS5cbiAgICAvLyBGaWxlZCBhbiBpc3N1ZTogaHR0cHM6Ly9naXRodWIuY29tL2F0b20vYXRvbS9pc3N1ZXMvNjg4MFxuICAgIHRoaXMuX2VkaXRvckVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCd0YWJpbmRleCcpO1xuICAgIHRoaXMuX2VkaXRvci5nZXREZWNvcmF0aW9ucyh7Y2xhc3M6ICdjdXJzb3ItbGluZScsIHR5cGU6ICdsaW5lJ30pWzBdLmRlc3Ryb3koKTtcbiAgfVxufTtcbiJdfQ==