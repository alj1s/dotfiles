'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import type Hyperclick from './Hyperclick';

var getWordTextAndRange = require('./get-word-text-and-range');

/**
 * Construct this object to enable Hyperclick in a text editor.
 * Call `dispose` to disable the feature.
 */
class HyperclickForTextEditor {
  constructor(textEditor: TextEditor, hyperclick: Hyperclick) {
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
      'hyperclick:confirm-cursor': () => this._confirmSuggestionAtCursor(),
    });
  }

  _confirmSuggestion(suggestion: HyperclickSuggestion): void {
    if (Array.isArray(suggestion.callback) && suggestion.callback.length > 0) {
      this._hyperclick.showSuggestionList(this._textEditor, suggestion);
    } else {
      suggestion.callback();
    }
  }

  _onMouseMove(event: MouseEvent): ?Promise {
    // We save the last `MouseEvent` so the user can trigger Hyperclick by
    // pressing the key without moving the mouse again. We only save the
    // relevant properties to prevent retaining a reference to the event.
    this._lastMouseEvent = {
      clientX: event.clientX,
      clientY: event.clientY,
    };

    // Don't fetch suggestions if the mouse is still in the same 'word', where
    // 'word' is a whitespace-delimited group of characters.
    //
    // If the last suggestion had multiple ranges, we have no choice but to
    // fetch suggestions because the new word might be between those ranges.
    // This should be ok because it will reuse that last suggestion until the
    // mouse moves off of it.
    var lastSuggestionIsNotMultiRange = !this._lastSuggestionAtMouse ||
        !Array.isArray(this._lastSuggestionAtMouse.range);
    if (this._isMouseAtLastWordRange() && lastSuggestionIsNotMultiRange) {
      return;
    }
    var {range} = getWordTextAndRange(this._textEditor, this._getMousePositionAsBufferPosition());
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

  _onMouseDown(event: MouseEvent): void {
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

  _onKeyDown(event: KeyboardEvent): void {
    // Show the suggestion at the last known mouse position.
    if (this._isHyperclickEvent(event)) {
      this._setSuggestionForLastMouseEvent();
    }
  }

  _onKeyUp(event: KeyboardEvent): void {
    if (!this._isHyperclickEvent(event)) {
      this._clearSuggestion();
    }
  }

  /**
   * Returns a `Promise` that's resolved when the latest suggestion's available.
   */
  getSuggestionAtMouse(): Promise<HyperclickSuggestion> {
    return this._lastSuggestionAtMousePromise || Promise.resolve(null);
  }

  async _setSuggestionForLastMouseEvent(): Promise<void> {
    if (!this._lastMouseEvent) {
      return;
    }

    var position = this._getMousePositionAsBufferPosition();

    if (this._lastSuggestionAtMouse) {
      var {range} = this._lastSuggestionAtMouse;
      if (this._isPositionInRange(position, range)) {
        return;
      }
    }

    // Show the loading cursor.
    this._textEditorView.classList.add('hyperclick-loading');

    this._lastSuggestionAtMousePromise = this._hyperclick.getSuggestion(this._textEditor, position);
    this._lastSuggestionAtMouse = await this._lastSuggestionAtMousePromise;
    if (this._lastSuggestionAtMouse && this._isMouseAtLastSuggestion()) {
      // Add the hyperclick markers if there's a new suggestion and it's under the mouse.
      this._updateNavigationMarkers(this._lastSuggestionAtMouse.range, /* loading */ false);
    } else {
      // Remove all the markers if we've finished loading and there's no suggestion.
      this._updateNavigationMarkers(null);
    }

    this._textEditorView.classList.remove('hyperclick-loading');
  }

  _getMousePositionAsBufferPosition(): atom$Point {
    var screenPosition = this._textEditorView.component.screenPositionForMouseEvent(this._lastMouseEvent);
    return this._textEditor.bufferPositionForScreenPosition(screenPosition);
  }

  _isMouseAtLastSuggestion(): boolean {
    if (!this._lastSuggestionAtMouse) {
      return false;
    }
    return this._isPositionInRange(this._getMousePositionAsBufferPosition(), this._lastSuggestionAtMouse.range);
  }

  _isMouseAtLastWordRange(): boolean {
    if (!this._lastWordRange) {
      return false;
    }
    return this._isPositionInRange(this._getMousePositionAsBufferPosition(), this._lastWordRange);
  }

  _isPositionInRange(position: atom$Point, range: Range | Array<Range>): boolean {
    return (Array.isArray(range)
        ? range.some(r => r.containsPoint(position))
        : range.containsPoint(position));
  }

  _clearSuggestion(): void {
    this._lastSuggestionAtMousePromise = null;
    this._lastSuggestionAtMouse = null;
    this._updateNavigationMarkers(null);
  }

  async _confirmSuggestionAtCursor(): Promise<void> {
    var suggestion = await this._hyperclick.getSuggestion(
        this._textEditor,
        this._textEditor.getCursorBufferPosition());
    if (suggestion) {
      this._confirmSuggestion(suggestion);
    }
  }

  /**
   * Add markers for the given range(s), or clears them if `ranges` is null.
   */
  _updateNavigationMarkers(range: ?(Range | Array<Range>), loading?: boolean): void {
    if (this._navigationMarkers) {
      this._navigationMarkers.forEach(marker => marker.destroy());
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
      this._navigationMarkers = ranges.map(markerRange => {
        var marker = this._textEditor.markBufferRange(markerRange, {invalidate: 'never'});
        this._textEditor.decorateMarker(
            marker,
            {type: 'highlight', class: 'hyperclick'});
        return marker;
      });
    }
  }

  /**
   * Returns whether an event should be handled by hyperclick or not.
   */
  _isHyperclickEvent(event: KeyboardEvent | MouseEvent): boolean {
    // If the user is pressing either the meta key or the alt key.
    return event.metaKey !== event.altKey;
  }

  dispose() {
    this._textEditorView.removeEventListener('mousemove', this._onMouseMove);
    this._textEditorView.removeEventListener('mousedown', this._onMouseDown);
    this._textEditorView.removeEventListener('keydown', this._onKeyDown);
    this._textEditorView.removeEventListener('keyup', this._onKeyUp);
    this._commandSubscription.dispose();
  }
}

module.exports = HyperclickForTextEditor;
