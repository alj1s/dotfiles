var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

'use babel';

var getWordTextAndRange = require('./get-word-text-and-range');

/**
 * Construct this object to enable Hyperclick in a text editor.
 * Call `dispose` to disable the feature.
 */

var HyperclickForTextEditor = (function () {
  function HyperclickForTextEditor(textEditor, hyperclick) {
    var _this = this;

    _classCallCheck(this, HyperclickForTextEditor);

    this._textEditor = textEditor;
    this._textEditorView = atom.views.getView(textEditor);

    this._hyperclick = hyperclick;

    this._lastMouseEvent = null;
    // We store the original promise that we use to retrieve the last suggestion
    // so callers can also await it to know when it's available.
    this._lastSuggestionAtMousePromise = null;
    // We store the last suggestion since we must await it immediately anyway.
    this._lastSuggestionAtMouse = null;
    this._navigationMarkers = null;

    this._lastWordRange = null;

    this._onMouseMove = this._onMouseMove.bind(this);
    this._textEditorView.addEventListener('mousemove', this._onMouseMove);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._textEditorView.addEventListener('mousedown', this._onMouseDown);

    this._onKeyDown = this._onKeyDown.bind(this);
    this._textEditorView.addEventListener('keydown', this._onKeyDown);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._textEditorView.addEventListener('keyup', this._onKeyUp);

    this._commandSubscription = atom.commands.add(this._textEditorView, {
      'hyperclick:confirm-cursor': function hyperclickConfirmCursor() {
        return _this._confirmSuggestionAtCursor();
      }
    });
  }

  _createClass(HyperclickForTextEditor, [{
    key: '_confirmSuggestion',
    value: function _confirmSuggestion(suggestion) {
      if (Array.isArray(suggestion.callback) && suggestion.callback.length > 0) {
        this._hyperclick.showSuggestionList(this._textEditor, suggestion);
      } else {
        suggestion.callback();
      }
    }
  }, {
    key: '_onMouseMove',
    value: function _onMouseMove(event) {
      // We save the last `MouseEvent` so the user can trigger Hyperclick by
      // pressing the key without moving the mouse again. We only save the
      // relevant properties to prevent retaining a reference to the event.
      this._lastMouseEvent = {
        clientX: event.clientX,
        clientY: event.clientY
      };

      // Don't fetch suggestions if the mouse is still in the same 'word', where
      // 'word' is a whitespace-delimited group of characters.
      //
      // If the last suggestion had multiple ranges, we have no choice but to
      // fetch suggestions because the new word might be between those ranges.
      // This should be ok because it will reuse that last suggestion until the
      // mouse moves off of it.
      var lastSuggestionIsNotMultiRange = !this._lastSuggestionAtMouse || !Array.isArray(this._lastSuggestionAtMouse.range);
      if (this._isMouseAtLastWordRange() && lastSuggestionIsNotMultiRange) {
        return;
      }

      var _getWordTextAndRange = getWordTextAndRange(this._textEditor, this._getMousePositionAsBufferPosition());

      var range = _getWordTextAndRange.range;

      this._lastWordRange = range;

      if (this._isHyperclickEvent(event)) {
        // Clear the suggestion if the mouse moved out of the range.
        if (!this._isMouseAtLastSuggestion()) {
          this._clearSuggestion();
        }
        this._setSuggestionForLastMouseEvent();
      } else {
        this._clearSuggestion();
      }
    }
  }, {
    key: '_onMouseDown',
    value: function _onMouseDown(event) {
      if (!this._isHyperclickEvent(event)) {
        return;
      }

      if (this._lastSuggestionAtMouse) {
        this._confirmSuggestion(this._lastSuggestionAtMouse);
      }

      this._clearSuggestion();
      // Prevent the <meta-click> event from adding another cursor.
      event.stopPropagation();
    }
  }, {
    key: '_onKeyDown',
    value: function _onKeyDown(event) {
      // Show the suggestion at the last known mouse position.
      if (this._isHyperclickEvent(event)) {
        this._setSuggestionForLastMouseEvent();
      }
    }
  }, {
    key: '_onKeyUp',
    value: function _onKeyUp(event) {
      if (!this._isHyperclickEvent(event)) {
        this._clearSuggestion();
      }
    }
  }, {
    key: 'getSuggestionAtMouse',

    /**
     * Returns a `Promise` that's resolved when the latest suggestion's available.
     */
    value: function getSuggestionAtMouse() {
      return this._lastSuggestionAtMousePromise || Promise.resolve(null);
    }
  }, {
    key: '_setSuggestionForLastMouseEvent',
    value: _asyncToGenerator(function* () {
      if (!this._lastMouseEvent) {
        return;
      }

      var position = this._getMousePositionAsBufferPosition();

      if (this._lastSuggestionAtMouse) {
        var range = this._lastSuggestionAtMouse.range;

        if (this._isPositionInRange(position, range)) {
          return;
        }
      }

      // Show the loading cursor.
      this._textEditorView.classList.add('hyperclick-loading');

      this._lastSuggestionAtMousePromise = this._hyperclick.getSuggestion(this._textEditor, position);
      this._lastSuggestionAtMouse = yield this._lastSuggestionAtMousePromise;
      if (this._lastSuggestionAtMouse && this._isMouseAtLastSuggestion()) {
        // Add the hyperclick markers if there's a new suggestion and it's under the mouse.
        this._updateNavigationMarkers(this._lastSuggestionAtMouse.range, /* loading */false);
      } else {
        // Remove all the markers if we've finished loading and there's no suggestion.
        this._updateNavigationMarkers(null);
      }

      this._textEditorView.classList.remove('hyperclick-loading');
    })
  }, {
    key: '_getMousePositionAsBufferPosition',
    value: function _getMousePositionAsBufferPosition() {
      var screenPosition = this._textEditorView.component.screenPositionForMouseEvent(this._lastMouseEvent);
      return this._textEditor.bufferPositionForScreenPosition(screenPosition);
    }
  }, {
    key: '_isMouseAtLastSuggestion',
    value: function _isMouseAtLastSuggestion() {
      if (!this._lastSuggestionAtMouse) {
        return false;
      }
      return this._isPositionInRange(this._getMousePositionAsBufferPosition(), this._lastSuggestionAtMouse.range);
    }
  }, {
    key: '_isMouseAtLastWordRange',
    value: function _isMouseAtLastWordRange() {
      if (!this._lastWordRange) {
        return false;
      }
      return this._isPositionInRange(this._getMousePositionAsBufferPosition(), this._lastWordRange);
    }
  }, {
    key: '_isPositionInRange',
    value: function _isPositionInRange(position, range) {
      return Array.isArray(range) ? range.some(function (r) {
        return r.containsPoint(position);
      }) : range.containsPoint(position);
    }
  }, {
    key: '_clearSuggestion',
    value: function _clearSuggestion() {
      this._lastSuggestionAtMousePromise = null;
      this._lastSuggestionAtMouse = null;
      this._updateNavigationMarkers(null);
    }
  }, {
    key: '_confirmSuggestionAtCursor',
    value: _asyncToGenerator(function* () {
      var suggestion = yield this._hyperclick.getSuggestion(this._textEditor, this._textEditor.getCursorBufferPosition());
      if (suggestion) {
        this._confirmSuggestion(suggestion);
      }
    })
  }, {
    key: '_updateNavigationMarkers',

    /**
     * Add markers for the given range(s), or clears them if `ranges` is null.
     */
    value: function _updateNavigationMarkers(range, loading) {
      var _this2 = this;

      if (this._navigationMarkers) {
        this._navigationMarkers.forEach(function (marker) {
          return marker.destroy();
        });
        this._navigationMarkers = null;
      }

      // Only change the cursor to a pointer if there is a suggestion ready.
      if (range && !loading) {
        this._textEditorView.classList.add('hyperclick');
      } else {
        this._textEditorView.classList.remove('hyperclick');
      }

      if (range) {
        var ranges = Array.isArray(range) ? range : [range];
        this._navigationMarkers = ranges.map(function (markerRange) {
          var marker = _this2._textEditor.markBufferRange(markerRange, { invalidate: 'never' });
          _this2._textEditor.decorateMarker(marker, { type: 'highlight', 'class': 'hyperclick' });
          return marker;
        });
      }
    }
  }, {
    key: '_isHyperclickEvent',

    /**
     * Returns whether an event should be handled by hyperclick or not.
     */
    value: function _isHyperclickEvent(event) {
      // If the user is pressing either the meta key or the alt key.
      return event.metaKey !== event.altKey;
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this._textEditorView.removeEventListener('mousemove', this._onMouseMove);
      this._textEditorView.removeEventListener('mousedown', this._onMouseDown);
      this._textEditorView.removeEventListener('keydown', this._onKeyDown);
      this._textEditorView.removeEventListener('keyup', this._onKeyUp);
      this._commandSubscription.dispose();
    }
  }]);

  return HyperclickForTextEditor;
})();

module.exports = HyperclickForTextEditor;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9oeXBlcmNsaWNrL2xpYi9IeXBlcmNsaWNrRm9yVGV4dEVkaXRvci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsV0FBVyxDQUFDOztBQWFaLElBQUksbUJBQW1CLEdBQUcsT0FBTyxDQUFDLDJCQUEyQixDQUFDLENBQUM7Ozs7Ozs7SUFNekQsdUJBQXVCO0FBQ2hCLFdBRFAsdUJBQXVCLENBQ2YsVUFBc0IsRUFBRSxVQUFzQixFQUFFOzs7MEJBRHhELHVCQUF1Qjs7QUFFekIsUUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7QUFDOUIsUUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQzs7QUFFdEQsUUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUM7O0FBRTlCLFFBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDOzs7QUFHNUIsUUFBSSxDQUFDLDZCQUE2QixHQUFHLElBQUksQ0FBQzs7QUFFMUMsUUFBSSxDQUFDLHNCQUFzQixHQUFHLElBQUksQ0FBQztBQUNuQyxRQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDOztBQUUvQixRQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQzs7QUFFM0IsUUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNqRCxRQUFJLENBQUMsZUFBZSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDdEUsUUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNqRCxRQUFJLENBQUMsZUFBZSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7O0FBRXRFLFFBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDN0MsUUFBSSxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ2xFLFFBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDekMsUUFBSSxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDOztBQUU5RCxRQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRTtBQUNsRSxpQ0FBMkIsRUFBRTtlQUFNLE1BQUssMEJBQTBCLEVBQUU7T0FBQTtLQUNyRSxDQUFDLENBQUM7R0FDSjs7ZUE5QkcsdUJBQXVCOztXQWdDVCw0QkFBQyxVQUFnQyxFQUFRO0FBQ3pELFVBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO0FBQ3hFLFlBQUksQ0FBQyxXQUFXLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxVQUFVLENBQUMsQ0FBQztPQUNuRSxNQUFNO0FBQ0wsa0JBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztPQUN2QjtLQUNGOzs7V0FFVyxzQkFBQyxLQUFpQixFQUFZOzs7O0FBSXhDLFVBQUksQ0FBQyxlQUFlLEdBQUc7QUFDckIsZUFBTyxFQUFFLEtBQUssQ0FBQyxPQUFPO0FBQ3RCLGVBQU8sRUFBRSxLQUFLLENBQUMsT0FBTztPQUN2QixDQUFDOzs7Ozs7Ozs7QUFTRixVQUFJLDZCQUE2QixHQUFHLENBQUMsSUFBSSxDQUFDLHNCQUFzQixJQUM1RCxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3RELFVBQUksSUFBSSxDQUFDLHVCQUF1QixFQUFFLElBQUksNkJBQTZCLEVBQUU7QUFDbkUsZUFBTztPQUNSOztpQ0FDYSxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxpQ0FBaUMsRUFBRSxDQUFDOztVQUF4RixLQUFLLHdCQUFMLEtBQUs7O0FBQ1YsVUFBSSxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUM7O0FBRTVCLFVBQUksSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxFQUFFOztBQUVsQyxZQUFJLENBQUMsSUFBSSxDQUFDLHdCQUF3QixFQUFFLEVBQUU7QUFDcEMsY0FBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7U0FDekI7QUFDRCxZQUFJLENBQUMsK0JBQStCLEVBQUUsQ0FBQztPQUN4QyxNQUFNO0FBQ0wsWUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7T0FDekI7S0FDRjs7O1dBRVcsc0JBQUMsS0FBaUIsRUFBUTtBQUNwQyxVQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQ25DLGVBQU87T0FDUjs7QUFFRCxVQUFJLElBQUksQ0FBQyxzQkFBc0IsRUFBRTtBQUMvQixZQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUM7T0FDdEQ7O0FBRUQsVUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7O0FBRXhCLFdBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQztLQUN6Qjs7O1dBRVMsb0JBQUMsS0FBb0IsRUFBUTs7QUFFckMsVUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDbEMsWUFBSSxDQUFDLCtCQUErQixFQUFFLENBQUM7T0FDeEM7S0FDRjs7O1dBRU8sa0JBQUMsS0FBb0IsRUFBUTtBQUNuQyxVQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQ25DLFlBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO09BQ3pCO0tBQ0Y7Ozs7Ozs7V0FLbUIsZ0NBQWtDO0FBQ3BELGFBQU8sSUFBSSxDQUFDLDZCQUE2QixJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDcEU7Ozs2QkFFb0MsYUFBa0I7QUFDckQsVUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUU7QUFDekIsZUFBTztPQUNSOztBQUVELFVBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxpQ0FBaUMsRUFBRSxDQUFDOztBQUV4RCxVQUFJLElBQUksQ0FBQyxzQkFBc0IsRUFBRTtZQUMxQixLQUFLLEdBQUksSUFBSSxDQUFDLHNCQUFzQixDQUFwQyxLQUFLOztBQUNWLFlBQUksSUFBSSxDQUFDLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsRUFBRTtBQUM1QyxpQkFBTztTQUNSO09BQ0Y7OztBQUdELFVBQUksQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDOztBQUV6RCxVQUFJLENBQUMsNkJBQTZCLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUNoRyxVQUFJLENBQUMsc0JBQXNCLEdBQUcsTUFBTSxJQUFJLENBQUMsNkJBQTZCLENBQUM7QUFDdkUsVUFBSSxJQUFJLENBQUMsc0JBQXNCLElBQUksSUFBSSxDQUFDLHdCQUF3QixFQUFFLEVBQUU7O0FBRWxFLFlBQUksQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxlQUFnQixLQUFLLENBQUMsQ0FBQztPQUN2RixNQUFNOztBQUVMLFlBQUksQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztPQUNyQzs7QUFFRCxVQUFJLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsQ0FBQztLQUM3RDs7O1dBRWdDLDZDQUFlO0FBQzlDLFVBQUksY0FBYyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLDJCQUEyQixDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUN0RyxhQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsK0JBQStCLENBQUMsY0FBYyxDQUFDLENBQUM7S0FDekU7OztXQUV1QixvQ0FBWTtBQUNsQyxVQUFJLENBQUMsSUFBSSxDQUFDLHNCQUFzQixFQUFFO0FBQ2hDLGVBQU8sS0FBSyxDQUFDO09BQ2Q7QUFDRCxhQUFPLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsaUNBQWlDLEVBQUUsRUFBRSxJQUFJLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDN0c7OztXQUVzQixtQ0FBWTtBQUNqQyxVQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRTtBQUN4QixlQUFPLEtBQUssQ0FBQztPQUNkO0FBQ0QsYUFBTyxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLGlDQUFpQyxFQUFFLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0tBQy9GOzs7V0FFaUIsNEJBQUMsUUFBb0IsRUFBRSxLQUEyQixFQUFXO0FBQzdFLGFBQVEsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FDdEIsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFBLENBQUM7ZUFBSSxDQUFDLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQztPQUFBLENBQUMsR0FDMUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBRTtLQUN0Qzs7O1dBRWUsNEJBQVM7QUFDdkIsVUFBSSxDQUFDLDZCQUE2QixHQUFHLElBQUksQ0FBQztBQUMxQyxVQUFJLENBQUMsc0JBQXNCLEdBQUcsSUFBSSxDQUFDO0FBQ25DLFVBQUksQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUNyQzs7OzZCQUUrQixhQUFrQjtBQUNoRCxVQUFJLFVBQVUsR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUNqRCxJQUFJLENBQUMsV0FBVyxFQUNoQixJQUFJLENBQUMsV0FBVyxDQUFDLHVCQUF1QixFQUFFLENBQUMsQ0FBQztBQUNoRCxVQUFJLFVBQVUsRUFBRTtBQUNkLFlBQUksQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztPQUNyQztLQUNGOzs7Ozs7O1dBS3VCLGtDQUFDLEtBQThCLEVBQUUsT0FBaUIsRUFBUTs7O0FBQ2hGLFVBQUksSUFBSSxDQUFDLGtCQUFrQixFQUFFO0FBQzNCLFlBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsVUFBQSxNQUFNO2lCQUFJLE1BQU0sQ0FBQyxPQUFPLEVBQUU7U0FBQSxDQUFDLENBQUM7QUFDNUQsWUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQztPQUNoQzs7O0FBR0QsVUFBSSxLQUFLLElBQUksQ0FBQyxPQUFPLEVBQUU7QUFDckIsWUFBSSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO09BQ2xELE1BQU07QUFDTCxZQUFJLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUM7T0FDckQ7O0FBRUQsVUFBSSxLQUFLLEVBQUU7QUFDVCxZQUFJLE1BQU0sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3BELFlBQUksQ0FBQyxrQkFBa0IsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQUEsV0FBVyxFQUFJO0FBQ2xELGNBQUksTUFBTSxHQUFHLE9BQUssV0FBVyxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsRUFBQyxVQUFVLEVBQUUsT0FBTyxFQUFDLENBQUMsQ0FBQztBQUNsRixpQkFBSyxXQUFXLENBQUMsY0FBYyxDQUMzQixNQUFNLEVBQ04sRUFBQyxJQUFJLEVBQUUsV0FBVyxFQUFFLFNBQU8sWUFBWSxFQUFDLENBQUMsQ0FBQztBQUM5QyxpQkFBTyxNQUFNLENBQUM7U0FDZixDQUFDLENBQUM7T0FDSjtLQUNGOzs7Ozs7O1dBS2lCLDRCQUFDLEtBQWlDLEVBQVc7O0FBRTdELGFBQU8sS0FBSyxDQUFDLE9BQU8sS0FBSyxLQUFLLENBQUMsTUFBTSxDQUFDO0tBQ3ZDOzs7V0FFTSxtQkFBRztBQUNSLFVBQUksQ0FBQyxlQUFlLENBQUMsbUJBQW1CLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUN6RSxVQUFJLENBQUMsZUFBZSxDQUFDLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDekUsVUFBSSxDQUFDLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3JFLFVBQUksQ0FBQyxlQUFlLENBQUMsbUJBQW1CLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNqRSxVQUFJLENBQUMsb0JBQW9CLENBQUMsT0FBTyxFQUFFLENBQUM7S0FDckM7OztTQTdORyx1QkFBdUI7OztBQWdPN0IsTUFBTSxDQUFDLE9BQU8sR0FBRyx1QkFBdUIsQ0FBQyIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvaHlwZXJjbGljay9saWIvSHlwZXJjbGlja0ZvclRleHRFZGl0b3IuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG5pbXBvcnQgdHlwZSBIeXBlcmNsaWNrIGZyb20gJy4vSHlwZXJjbGljayc7XG5cbnZhciBnZXRXb3JkVGV4dEFuZFJhbmdlID0gcmVxdWlyZSgnLi9nZXQtd29yZC10ZXh0LWFuZC1yYW5nZScpO1xuXG4vKipcbiAqIENvbnN0cnVjdCB0aGlzIG9iamVjdCB0byBlbmFibGUgSHlwZXJjbGljayBpbiBhIHRleHQgZWRpdG9yLlxuICogQ2FsbCBgZGlzcG9zZWAgdG8gZGlzYWJsZSB0aGUgZmVhdHVyZS5cbiAqL1xuY2xhc3MgSHlwZXJjbGlja0ZvclRleHRFZGl0b3Ige1xuICBjb25zdHJ1Y3Rvcih0ZXh0RWRpdG9yOiBUZXh0RWRpdG9yLCBoeXBlcmNsaWNrOiBIeXBlcmNsaWNrKSB7XG4gICAgdGhpcy5fdGV4dEVkaXRvciA9IHRleHRFZGl0b3I7XG4gICAgdGhpcy5fdGV4dEVkaXRvclZpZXcgPSBhdG9tLnZpZXdzLmdldFZpZXcodGV4dEVkaXRvcik7XG5cbiAgICB0aGlzLl9oeXBlcmNsaWNrID0gaHlwZXJjbGljaztcblxuICAgIHRoaXMuX2xhc3RNb3VzZUV2ZW50ID0gbnVsbDtcbiAgICAvLyBXZSBzdG9yZSB0aGUgb3JpZ2luYWwgcHJvbWlzZSB0aGF0IHdlIHVzZSB0byByZXRyaWV2ZSB0aGUgbGFzdCBzdWdnZXN0aW9uXG4gICAgLy8gc28gY2FsbGVycyBjYW4gYWxzbyBhd2FpdCBpdCB0byBrbm93IHdoZW4gaXQncyBhdmFpbGFibGUuXG4gICAgdGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlUHJvbWlzZSA9IG51bGw7XG4gICAgLy8gV2Ugc3RvcmUgdGhlIGxhc3Qgc3VnZ2VzdGlvbiBzaW5jZSB3ZSBtdXN0IGF3YWl0IGl0IGltbWVkaWF0ZWx5IGFueXdheS5cbiAgICB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2UgPSBudWxsO1xuICAgIHRoaXMuX25hdmlnYXRpb25NYXJrZXJzID0gbnVsbDtcblxuICAgIHRoaXMuX2xhc3RXb3JkUmFuZ2UgPSBudWxsO1xuXG4gICAgdGhpcy5fb25Nb3VzZU1vdmUgPSB0aGlzLl9vbk1vdXNlTW92ZS5iaW5kKHRoaXMpO1xuICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIHRoaXMuX29uTW91c2VNb3ZlKTtcbiAgICB0aGlzLl9vbk1vdXNlRG93biA9IHRoaXMuX29uTW91c2VEb3duLmJpbmQodGhpcyk7XG4gICAgdGhpcy5fdGV4dEVkaXRvclZpZXcuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fb25Nb3VzZURvd24pO1xuXG4gICAgdGhpcy5fb25LZXlEb3duID0gdGhpcy5fb25LZXlEb3duLmJpbmQodGhpcyk7XG4gICAgdGhpcy5fdGV4dEVkaXRvclZpZXcuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHRoaXMuX29uS2V5RG93bik7XG4gICAgdGhpcy5fb25LZXlVcCA9IHRoaXMuX29uS2V5VXAuYmluZCh0aGlzKTtcbiAgICB0aGlzLl90ZXh0RWRpdG9yVmlldy5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIHRoaXMuX29uS2V5VXApO1xuXG4gICAgdGhpcy5fY29tbWFuZFN1YnNjcmlwdGlvbiA9IGF0b20uY29tbWFuZHMuYWRkKHRoaXMuX3RleHRFZGl0b3JWaWV3LCB7XG4gICAgICAnaHlwZXJjbGljazpjb25maXJtLWN1cnNvcic6ICgpID0+IHRoaXMuX2NvbmZpcm1TdWdnZXN0aW9uQXRDdXJzb3IoKSxcbiAgICB9KTtcbiAgfVxuXG4gIF9jb25maXJtU3VnZ2VzdGlvbihzdWdnZXN0aW9uOiBIeXBlcmNsaWNrU3VnZ2VzdGlvbik6IHZvaWQge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHN1Z2dlc3Rpb24uY2FsbGJhY2spICYmIHN1Z2dlc3Rpb24uY2FsbGJhY2subGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5faHlwZXJjbGljay5zaG93U3VnZ2VzdGlvbkxpc3QodGhpcy5fdGV4dEVkaXRvciwgc3VnZ2VzdGlvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN1Z2dlc3Rpb24uY2FsbGJhY2soKTtcbiAgICB9XG4gIH1cblxuICBfb25Nb3VzZU1vdmUoZXZlbnQ6IE1vdXNlRXZlbnQpOiA/UHJvbWlzZSB7XG4gICAgLy8gV2Ugc2F2ZSB0aGUgbGFzdCBgTW91c2VFdmVudGAgc28gdGhlIHVzZXIgY2FuIHRyaWdnZXIgSHlwZXJjbGljayBieVxuICAgIC8vIHByZXNzaW5nIHRoZSBrZXkgd2l0aG91dCBtb3ZpbmcgdGhlIG1vdXNlIGFnYWluLiBXZSBvbmx5IHNhdmUgdGhlXG4gICAgLy8gcmVsZXZhbnQgcHJvcGVydGllcyB0byBwcmV2ZW50IHJldGFpbmluZyBhIHJlZmVyZW5jZSB0byB0aGUgZXZlbnQuXG4gICAgdGhpcy5fbGFzdE1vdXNlRXZlbnQgPSB7XG4gICAgICBjbGllbnRYOiBldmVudC5jbGllbnRYLFxuICAgICAgY2xpZW50WTogZXZlbnQuY2xpZW50WSxcbiAgICB9O1xuXG4gICAgLy8gRG9uJ3QgZmV0Y2ggc3VnZ2VzdGlvbnMgaWYgdGhlIG1vdXNlIGlzIHN0aWxsIGluIHRoZSBzYW1lICd3b3JkJywgd2hlcmVcbiAgICAvLyAnd29yZCcgaXMgYSB3aGl0ZXNwYWNlLWRlbGltaXRlZCBncm91cCBvZiBjaGFyYWN0ZXJzLlxuICAgIC8vXG4gICAgLy8gSWYgdGhlIGxhc3Qgc3VnZ2VzdGlvbiBoYWQgbXVsdGlwbGUgcmFuZ2VzLCB3ZSBoYXZlIG5vIGNob2ljZSBidXQgdG9cbiAgICAvLyBmZXRjaCBzdWdnZXN0aW9ucyBiZWNhdXNlIHRoZSBuZXcgd29yZCBtaWdodCBiZSBiZXR3ZWVuIHRob3NlIHJhbmdlcy5cbiAgICAvLyBUaGlzIHNob3VsZCBiZSBvayBiZWNhdXNlIGl0IHdpbGwgcmV1c2UgdGhhdCBsYXN0IHN1Z2dlc3Rpb24gdW50aWwgdGhlXG4gICAgLy8gbW91c2UgbW92ZXMgb2ZmIG9mIGl0LlxuICAgIHZhciBsYXN0U3VnZ2VzdGlvbklzTm90TXVsdGlSYW5nZSA9ICF0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2UgfHxcbiAgICAgICAgIUFycmF5LmlzQXJyYXkodGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlLnJhbmdlKTtcbiAgICBpZiAodGhpcy5faXNNb3VzZUF0TGFzdFdvcmRSYW5nZSgpICYmIGxhc3RTdWdnZXN0aW9uSXNOb3RNdWx0aVJhbmdlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB7cmFuZ2V9ID0gZ2V0V29yZFRleHRBbmRSYW5nZSh0aGlzLl90ZXh0RWRpdG9yLCB0aGlzLl9nZXRNb3VzZVBvc2l0aW9uQXNCdWZmZXJQb3NpdGlvbigpKTtcbiAgICB0aGlzLl9sYXN0V29yZFJhbmdlID0gcmFuZ2U7XG5cbiAgICBpZiAodGhpcy5faXNIeXBlcmNsaWNrRXZlbnQoZXZlbnQpKSB7XG4gICAgICAvLyBDbGVhciB0aGUgc3VnZ2VzdGlvbiBpZiB0aGUgbW91c2UgbW92ZWQgb3V0IG9mIHRoZSByYW5nZS5cbiAgICAgIGlmICghdGhpcy5faXNNb3VzZUF0TGFzdFN1Z2dlc3Rpb24oKSkge1xuICAgICAgICB0aGlzLl9jbGVhclN1Z2dlc3Rpb24oKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX3NldFN1Z2dlc3Rpb25Gb3JMYXN0TW91c2VFdmVudCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9jbGVhclN1Z2dlc3Rpb24oKTtcbiAgICB9XG4gIH1cblxuICBfb25Nb3VzZURvd24oZXZlbnQ6IE1vdXNlRXZlbnQpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX2lzSHlwZXJjbGlja0V2ZW50KGV2ZW50KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2UpIHtcbiAgICAgIHRoaXMuX2NvbmZpcm1TdWdnZXN0aW9uKHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZSk7XG4gICAgfVxuXG4gICAgdGhpcy5fY2xlYXJTdWdnZXN0aW9uKCk7XG4gICAgLy8gUHJldmVudCB0aGUgPG1ldGEtY2xpY2s+IGV2ZW50IGZyb20gYWRkaW5nIGFub3RoZXIgY3Vyc29yLlxuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICB9XG5cbiAgX29uS2V5RG93bihldmVudDogS2V5Ym9hcmRFdmVudCk6IHZvaWQge1xuICAgIC8vIFNob3cgdGhlIHN1Z2dlc3Rpb24gYXQgdGhlIGxhc3Qga25vd24gbW91c2UgcG9zaXRpb24uXG4gICAgaWYgKHRoaXMuX2lzSHlwZXJjbGlja0V2ZW50KGV2ZW50KSkge1xuICAgICAgdGhpcy5fc2V0U3VnZ2VzdGlvbkZvckxhc3RNb3VzZUV2ZW50KCk7XG4gICAgfVxuICB9XG5cbiAgX29uS2V5VXAoZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX2lzSHlwZXJjbGlja0V2ZW50KGV2ZW50KSkge1xuICAgICAgdGhpcy5fY2xlYXJTdWdnZXN0aW9uKCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBgUHJvbWlzZWAgdGhhdCdzIHJlc29sdmVkIHdoZW4gdGhlIGxhdGVzdCBzdWdnZXN0aW9uJ3MgYXZhaWxhYmxlLlxuICAgKi9cbiAgZ2V0U3VnZ2VzdGlvbkF0TW91c2UoKTogUHJvbWlzZTxIeXBlcmNsaWNrU3VnZ2VzdGlvbj4ge1xuICAgIHJldHVybiB0aGlzLl9sYXN0U3VnZ2VzdGlvbkF0TW91c2VQcm9taXNlIHx8IFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgfVxuXG4gIGFzeW5jIF9zZXRTdWdnZXN0aW9uRm9yTGFzdE1vdXNlRXZlbnQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLl9sYXN0TW91c2VFdmVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBwb3NpdGlvbiA9IHRoaXMuX2dldE1vdXNlUG9zaXRpb25Bc0J1ZmZlclBvc2l0aW9uKCk7XG5cbiAgICBpZiAodGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlKSB7XG4gICAgICB2YXIge3JhbmdlfSA9IHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZTtcbiAgICAgIGlmICh0aGlzLl9pc1Bvc2l0aW9uSW5SYW5nZShwb3NpdGlvbiwgcmFuZ2UpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBTaG93IHRoZSBsb2FkaW5nIGN1cnNvci5cbiAgICB0aGlzLl90ZXh0RWRpdG9yVmlldy5jbGFzc0xpc3QuYWRkKCdoeXBlcmNsaWNrLWxvYWRpbmcnKTtcblxuICAgIHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZVByb21pc2UgPSB0aGlzLl9oeXBlcmNsaWNrLmdldFN1Z2dlc3Rpb24odGhpcy5fdGV4dEVkaXRvciwgcG9zaXRpb24pO1xuICAgIHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZSA9IGF3YWl0IHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZVByb21pc2U7XG4gICAgaWYgKHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZSAmJiB0aGlzLl9pc01vdXNlQXRMYXN0U3VnZ2VzdGlvbigpKSB7XG4gICAgICAvLyBBZGQgdGhlIGh5cGVyY2xpY2sgbWFya2VycyBpZiB0aGVyZSdzIGEgbmV3IHN1Z2dlc3Rpb24gYW5kIGl0J3MgdW5kZXIgdGhlIG1vdXNlLlxuICAgICAgdGhpcy5fdXBkYXRlTmF2aWdhdGlvbk1hcmtlcnModGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlLnJhbmdlLCAvKiBsb2FkaW5nICovIGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gUmVtb3ZlIGFsbCB0aGUgbWFya2VycyBpZiB3ZSd2ZSBmaW5pc2hlZCBsb2FkaW5nIGFuZCB0aGVyZSdzIG5vIHN1Z2dlc3Rpb24uXG4gICAgICB0aGlzLl91cGRhdGVOYXZpZ2F0aW9uTWFya2VycyhudWxsKTtcbiAgICB9XG5cbiAgICB0aGlzLl90ZXh0RWRpdG9yVmlldy5jbGFzc0xpc3QucmVtb3ZlKCdoeXBlcmNsaWNrLWxvYWRpbmcnKTtcbiAgfVxuXG4gIF9nZXRNb3VzZVBvc2l0aW9uQXNCdWZmZXJQb3NpdGlvbigpOiBhdG9tJFBvaW50IHtcbiAgICB2YXIgc2NyZWVuUG9zaXRpb24gPSB0aGlzLl90ZXh0RWRpdG9yVmlldy5jb21wb25lbnQuc2NyZWVuUG9zaXRpb25Gb3JNb3VzZUV2ZW50KHRoaXMuX2xhc3RNb3VzZUV2ZW50KTtcbiAgICByZXR1cm4gdGhpcy5fdGV4dEVkaXRvci5idWZmZXJQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uKHNjcmVlblBvc2l0aW9uKTtcbiAgfVxuXG4gIF9pc01vdXNlQXRMYXN0U3VnZ2VzdGlvbigpOiBib29sZWFuIHtcbiAgICBpZiAoIXRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5faXNQb3NpdGlvbkluUmFuZ2UodGhpcy5fZ2V0TW91c2VQb3NpdGlvbkFzQnVmZmVyUG9zaXRpb24oKSwgdGhpcy5fbGFzdFN1Z2dlc3Rpb25BdE1vdXNlLnJhbmdlKTtcbiAgfVxuXG4gIF9pc01vdXNlQXRMYXN0V29yZFJhbmdlKCk6IGJvb2xlYW4ge1xuICAgIGlmICghdGhpcy5fbGFzdFdvcmRSYW5nZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5faXNQb3NpdGlvbkluUmFuZ2UodGhpcy5fZ2V0TW91c2VQb3NpdGlvbkFzQnVmZmVyUG9zaXRpb24oKSwgdGhpcy5fbGFzdFdvcmRSYW5nZSk7XG4gIH1cblxuICBfaXNQb3NpdGlvbkluUmFuZ2UocG9zaXRpb246IGF0b20kUG9pbnQsIHJhbmdlOiBSYW5nZSB8IEFycmF5PFJhbmdlPik6IGJvb2xlYW4ge1xuICAgIHJldHVybiAoQXJyYXkuaXNBcnJheShyYW5nZSlcbiAgICAgICAgPyByYW5nZS5zb21lKHIgPT4gci5jb250YWluc1BvaW50KHBvc2l0aW9uKSlcbiAgICAgICAgOiByYW5nZS5jb250YWluc1BvaW50KHBvc2l0aW9uKSk7XG4gIH1cblxuICBfY2xlYXJTdWdnZXN0aW9uKCk6IHZvaWQge1xuICAgIHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZVByb21pc2UgPSBudWxsO1xuICAgIHRoaXMuX2xhc3RTdWdnZXN0aW9uQXRNb3VzZSA9IG51bGw7XG4gICAgdGhpcy5fdXBkYXRlTmF2aWdhdGlvbk1hcmtlcnMobnVsbCk7XG4gIH1cblxuICBhc3luYyBfY29uZmlybVN1Z2dlc3Rpb25BdEN1cnNvcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB2YXIgc3VnZ2VzdGlvbiA9IGF3YWl0IHRoaXMuX2h5cGVyY2xpY2suZ2V0U3VnZ2VzdGlvbihcbiAgICAgICAgdGhpcy5fdGV4dEVkaXRvcixcbiAgICAgICAgdGhpcy5fdGV4dEVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpKTtcbiAgICBpZiAoc3VnZ2VzdGlvbikge1xuICAgICAgdGhpcy5fY29uZmlybVN1Z2dlc3Rpb24oc3VnZ2VzdGlvbik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBtYXJrZXJzIGZvciB0aGUgZ2l2ZW4gcmFuZ2UocyksIG9yIGNsZWFycyB0aGVtIGlmIGByYW5nZXNgIGlzIG51bGwuXG4gICAqL1xuICBfdXBkYXRlTmF2aWdhdGlvbk1hcmtlcnMocmFuZ2U6ID8oUmFuZ2UgfCBBcnJheTxSYW5nZT4pLCBsb2FkaW5nPzogYm9vbGVhbik6IHZvaWQge1xuICAgIGlmICh0aGlzLl9uYXZpZ2F0aW9uTWFya2Vycykge1xuICAgICAgdGhpcy5fbmF2aWdhdGlvbk1hcmtlcnMuZm9yRWFjaChtYXJrZXIgPT4gbWFya2VyLmRlc3Ryb3koKSk7XG4gICAgICB0aGlzLl9uYXZpZ2F0aW9uTWFya2VycyA9IG51bGw7XG4gICAgfVxuXG4gICAgLy8gT25seSBjaGFuZ2UgdGhlIGN1cnNvciB0byBhIHBvaW50ZXIgaWYgdGhlcmUgaXMgYSBzdWdnZXN0aW9uIHJlYWR5LlxuICAgIGlmIChyYW5nZSAmJiAhbG9hZGluZykge1xuICAgICAgdGhpcy5fdGV4dEVkaXRvclZpZXcuY2xhc3NMaXN0LmFkZCgnaHlwZXJjbGljaycpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl90ZXh0RWRpdG9yVmlldy5jbGFzc0xpc3QucmVtb3ZlKCdoeXBlcmNsaWNrJyk7XG4gICAgfVxuXG4gICAgaWYgKHJhbmdlKSB7XG4gICAgICB2YXIgcmFuZ2VzID0gQXJyYXkuaXNBcnJheShyYW5nZSkgPyByYW5nZSA6IFtyYW5nZV07XG4gICAgICB0aGlzLl9uYXZpZ2F0aW9uTWFya2VycyA9IHJhbmdlcy5tYXAobWFya2VyUmFuZ2UgPT4ge1xuICAgICAgICB2YXIgbWFya2VyID0gdGhpcy5fdGV4dEVkaXRvci5tYXJrQnVmZmVyUmFuZ2UobWFya2VyUmFuZ2UsIHtpbnZhbGlkYXRlOiAnbmV2ZXInfSk7XG4gICAgICAgIHRoaXMuX3RleHRFZGl0b3IuZGVjb3JhdGVNYXJrZXIoXG4gICAgICAgICAgICBtYXJrZXIsXG4gICAgICAgICAgICB7dHlwZTogJ2hpZ2hsaWdodCcsIGNsYXNzOiAnaHlwZXJjbGljayd9KTtcbiAgICAgICAgcmV0dXJuIG1hcmtlcjtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHdoZXRoZXIgYW4gZXZlbnQgc2hvdWxkIGJlIGhhbmRsZWQgYnkgaHlwZXJjbGljayBvciBub3QuXG4gICAqL1xuICBfaXNIeXBlcmNsaWNrRXZlbnQoZXZlbnQ6IEtleWJvYXJkRXZlbnQgfCBNb3VzZUV2ZW50KTogYm9vbGVhbiB7XG4gICAgLy8gSWYgdGhlIHVzZXIgaXMgcHJlc3NpbmcgZWl0aGVyIHRoZSBtZXRhIGtleSBvciB0aGUgYWx0IGtleS5cbiAgICByZXR1cm4gZXZlbnQubWV0YUtleSAhPT0gZXZlbnQuYWx0S2V5O1xuICB9XG5cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLl90ZXh0RWRpdG9yVmlldy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLl9vbk1vdXNlTW92ZSk7XG4gICAgdGhpcy5fdGV4dEVkaXRvclZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5fb25Nb3VzZURvd24pO1xuICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCB0aGlzLl9vbktleURvd24pO1xuICAgIHRoaXMuX3RleHRFZGl0b3JWaWV3LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5fb25LZXlVcCk7XG4gICAgdGhpcy5fY29tbWFuZFN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBIeXBlcmNsaWNrRm9yVGV4dEVkaXRvcjtcbiJdfQ==