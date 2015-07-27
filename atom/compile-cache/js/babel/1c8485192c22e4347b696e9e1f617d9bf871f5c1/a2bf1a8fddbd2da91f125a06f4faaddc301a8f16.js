'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _require = require('atom');

var CompositeDisposable = _require.CompositeDisposable;

var React = require('react-for-atom');
var PropTypes = React.PropTypes;

var DiffViewComponent = React.createClass({
  displayName: 'DiffViewComponent',

  propTypes: {
    model: PropTypes.object.isRequired
  },

  componentDidMount: function componentDidMount() {
    this._subscriptions = new CompositeDisposable();

    var DiffViewEditor = require('./DiffViewEditor');

    this._oldDiffEditor = new DiffViewEditor(this._getOldTextEditorElement());
    this._newDiffEditor = new DiffViewEditor(this._getNewTextEditorElement());

    // The first version of the diff view will have both editors readonly.
    // But later on, the right editor will be editable and savable.
    this._oldDiffEditor.setReadOnly();
    this._newDiffEditor.setReadOnly();

    var diffViewState = this.props.model.getDiffState();
    var oldText = diffViewState.oldText;
    var newText = diffViewState.newText;
    var filePath = diffViewState.filePath;

    this._oldDiffEditor.setFileContents(filePath, oldText);
    this._newDiffEditor.setFileContents(filePath, newText);

    var SyncScroll = require('./SyncScroll');
    this._subscriptions.add(new SyncScroll(this._getOldTextEditorElement().getModel(), this._getNewTextEditorElement().getModel()));

    this._updateDiffMarkers();
  },

  _updateDiffMarkers: function _updateDiffMarkers() {
    var _props$model$computeDiff = this.props.model.computeDiff(this._oldDiffEditor.getText(), this._newDiffEditor.getText());

    var addedLines = _props$model$computeDiff.addedLines;
    var removedLines = _props$model$computeDiff.removedLines;
    var oldLineOffsets = _props$model$computeDiff.oldLineOffsets;
    var newLineOffsets = _props$model$computeDiff.newLineOffsets;

    // Set the empty space offsets in the diff editors marking for no-matching diff section.
    this._newDiffEditor.setOffsets(newLineOffsets);
    this._oldDiffEditor.setOffsets(oldLineOffsets);

    // Set highlighted lines in the diff editors marking the added and deleted lines.
    // This trigges a redraw for the editor, hence being done after the offsets have been set.
    this._newDiffEditor.setHighlightedLines(addedLines, undefined);
    this._oldDiffEditor.setHighlightedLines(undefined, removedLines);
  },

  componentWillUnmount: function componentWillUnmount() {
    if (this._subscriptions) {
      this._subscriptions.dispose();
      this._subscriptions = null;
    }
  },

  render: function render() {
    return React.createElement(
      'div',
      { className: 'diff-view-component' },
      React.createElement(
        'div',
        { className: 'split-pane' },
        React.createElement(
          'div',
          { className: 'title' },
          React.createElement(
            'p',
            null,
            'Original'
          )
        ),
        React.createElement('atom-text-editor', { ref: 'old', style: { height: '100%' } })
      ),
      React.createElement(
        'div',
        { className: 'split-pane' },
        React.createElement(
          'div',
          { className: 'title' },
          React.createElement(
            'p',
            null,
            'Changed'
          )
        ),
        React.createElement('atom-text-editor', { ref: 'new', style: { height: '100%' } })
      )
    );
  },

  _getOldTextEditorElement: function _getOldTextEditorElement() {
    return this.refs['old'].getDOMNode();
  },

  _getNewTextEditorElement: function _getNewTextEditorElement() {
    return this.refs['new'].getDOMNode();
  }

});

module.exports = DiffViewComponent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWRpZmYtdmlldy9saWIvRGlmZlZpZXdDb21wb25lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7OztlQVdnQixPQUFPLENBQUMsTUFBTSxDQUFDOztJQUF0QyxtQkFBbUIsWUFBbkIsbUJBQW1COztBQUN4QixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUNqQyxTQUFTLEdBQUksS0FBSyxDQUFsQixTQUFTOztBQUVkLElBQUksaUJBQWlCLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQzs7O0FBQ3hDLFdBQVMsRUFBRTtBQUNULFNBQUssRUFBRSxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQVU7R0FDbkM7O0FBRUQsbUJBQWlCLEVBQUEsNkJBQUc7QUFDbEIsUUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLG1CQUFtQixFQUFFLENBQUM7O0FBRWhELFFBQUksY0FBYyxHQUFHLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDOztBQUVqRCxRQUFJLENBQUMsY0FBYyxHQUFHLElBQUksY0FBYyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDLENBQUM7QUFDMUUsUUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLGNBQWMsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQyxDQUFDOzs7O0FBSTFFLFFBQUksQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDbEMsUUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsQ0FBQzs7QUFFbEMsUUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDL0MsT0FBTyxHQUF1QixhQUFhLENBQTNDLE9BQU87UUFBRSxPQUFPLEdBQWMsYUFBYSxDQUFsQyxPQUFPO1FBQUUsUUFBUSxHQUFJLGFBQWEsQ0FBekIsUUFBUTs7QUFDL0IsUUFBSSxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ3ZELFFBQUksQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQzs7QUFFdkQsUUFBSSxVQUFVLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3pDLFFBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksVUFBVSxDQUNsQyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFDMUMsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUMsUUFBUSxFQUFFLENBQzNDLENBQ0YsQ0FBQzs7QUFFRixRQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztHQUMzQjs7QUFFRCxvQkFBa0IsRUFBQSw4QkFBRzttQ0FFZixJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxDQUFDOztRQUR6RixVQUFVLDRCQUFWLFVBQVU7UUFBRSxZQUFZLDRCQUFaLFlBQVk7UUFBRSxjQUFjLDRCQUFkLGNBQWM7UUFBRSxjQUFjLDRCQUFkLGNBQWM7OztBQUk3RCxRQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUMvQyxRQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUMsQ0FBQzs7OztBQUkvQyxRQUFJLENBQUMsY0FBYyxDQUFDLG1CQUFtQixDQUFDLFVBQVUsRUFBRSxTQUFTLENBQUMsQ0FBQztBQUMvRCxRQUFJLENBQUMsY0FBYyxDQUFDLG1CQUFtQixDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQztHQUNsRTs7QUFFRCxzQkFBb0IsRUFBQSxnQ0FBUztBQUMzQixRQUFJLElBQUksQ0FBQyxjQUFjLEVBQUU7QUFDdkIsVUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUM5QixVQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztLQUM1QjtHQUNGOztBQUVELFFBQU0sRUFBQSxrQkFBaUI7QUFDckIsV0FDRTs7UUFBSyxTQUFTLEVBQUMscUJBQXFCO01BQ2xDOztVQUFLLFNBQVMsRUFBQyxZQUFZO1FBQ3pCOztZQUFLLFNBQVMsRUFBQyxPQUFPO1VBQ3BCOzs7O1dBQWU7U0FDWDtRQUNOLDBDQUFrQixHQUFHLEVBQUMsS0FBSyxFQUFDLEtBQUssRUFBRSxFQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUMsQUFBQyxHQUFHO09BQ25EO01BQ047O1VBQUssU0FBUyxFQUFDLFlBQVk7UUFDekI7O1lBQUssU0FBUyxFQUFDLE9BQU87VUFDcEI7Ozs7V0FBYztTQUNWO1FBQ04sMENBQWtCLEdBQUcsRUFBQyxLQUFLLEVBQUMsS0FBSyxFQUFFLEVBQUMsTUFBTSxFQUFFLE1BQU0sRUFBQyxBQUFDLEdBQUc7T0FDbkQ7S0FDRixDQUNOO0dBQ0g7O0FBRUQsMEJBQXdCLEVBQUEsb0NBQXNCO0FBQzVDLFdBQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQztHQUN0Qzs7QUFFRCwwQkFBd0IsRUFBQSxvQ0FBc0I7QUFDNUMsV0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDO0dBQ3RDOztDQUVGLENBQUMsQ0FBQzs7QUFFSCxNQUFNLENBQUMsT0FBTyxHQUFHLGlCQUFpQixDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWRpZmYtdmlldy9saWIvRGlmZlZpZXdDb21wb25lbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIge0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSgnYXRvbScpO1xudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QtZm9yLWF0b20nKTtcbnZhciB7UHJvcFR5cGVzfSA9IFJlYWN0O1xuXG52YXIgRGlmZlZpZXdDb21wb25lbnQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIHByb3BUeXBlczoge1xuICAgIG1vZGVsOiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gIH0sXG5cbiAgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG5cbiAgICB2YXIgRGlmZlZpZXdFZGl0b3IgPSByZXF1aXJlKCcuL0RpZmZWaWV3RWRpdG9yJyk7XG5cbiAgICB0aGlzLl9vbGREaWZmRWRpdG9yID0gbmV3IERpZmZWaWV3RWRpdG9yKHRoaXMuX2dldE9sZFRleHRFZGl0b3JFbGVtZW50KCkpO1xuICAgIHRoaXMuX25ld0RpZmZFZGl0b3IgPSBuZXcgRGlmZlZpZXdFZGl0b3IodGhpcy5fZ2V0TmV3VGV4dEVkaXRvckVsZW1lbnQoKSk7XG5cbiAgICAvLyBUaGUgZmlyc3QgdmVyc2lvbiBvZiB0aGUgZGlmZiB2aWV3IHdpbGwgaGF2ZSBib3RoIGVkaXRvcnMgcmVhZG9ubHkuXG4gICAgLy8gQnV0IGxhdGVyIG9uLCB0aGUgcmlnaHQgZWRpdG9yIHdpbGwgYmUgZWRpdGFibGUgYW5kIHNhdmFibGUuXG4gICAgdGhpcy5fb2xkRGlmZkVkaXRvci5zZXRSZWFkT25seSgpO1xuICAgIHRoaXMuX25ld0RpZmZFZGl0b3Iuc2V0UmVhZE9ubHkoKTtcblxuICAgIHZhciBkaWZmVmlld1N0YXRlID0gdGhpcy5wcm9wcy5tb2RlbC5nZXREaWZmU3RhdGUoKTtcbiAgICB2YXIge29sZFRleHQsIG5ld1RleHQsIGZpbGVQYXRofSA9IGRpZmZWaWV3U3RhdGU7XG4gICAgdGhpcy5fb2xkRGlmZkVkaXRvci5zZXRGaWxlQ29udGVudHMoZmlsZVBhdGgsIG9sZFRleHQpO1xuICAgIHRoaXMuX25ld0RpZmZFZGl0b3Iuc2V0RmlsZUNvbnRlbnRzKGZpbGVQYXRoLCBuZXdUZXh0KTtcblxuICAgIHZhciBTeW5jU2Nyb2xsID0gcmVxdWlyZSgnLi9TeW5jU2Nyb2xsJyk7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQobmV3IFN5bmNTY3JvbGwoXG4gICAgICAgIHRoaXMuX2dldE9sZFRleHRFZGl0b3JFbGVtZW50KCkuZ2V0TW9kZWwoKSxcbiAgICAgICAgdGhpcy5fZ2V0TmV3VGV4dEVkaXRvckVsZW1lbnQoKS5nZXRNb2RlbCgpXG4gICAgICApXG4gICAgKTtcblxuICAgIHRoaXMuX3VwZGF0ZURpZmZNYXJrZXJzKCk7XG4gIH0sXG5cbiAgX3VwZGF0ZURpZmZNYXJrZXJzKCkge1xuICAgIHZhciB7YWRkZWRMaW5lcywgcmVtb3ZlZExpbmVzLCBvbGRMaW5lT2Zmc2V0cywgbmV3TGluZU9mZnNldHN9ID1cbiAgICAgICAgdGhpcy5wcm9wcy5tb2RlbC5jb21wdXRlRGlmZih0aGlzLl9vbGREaWZmRWRpdG9yLmdldFRleHQoKSwgdGhpcy5fbmV3RGlmZkVkaXRvci5nZXRUZXh0KCkpO1xuXG4gICAgLy8gU2V0IHRoZSBlbXB0eSBzcGFjZSBvZmZzZXRzIGluIHRoZSBkaWZmIGVkaXRvcnMgbWFya2luZyBmb3Igbm8tbWF0Y2hpbmcgZGlmZiBzZWN0aW9uLlxuICAgIHRoaXMuX25ld0RpZmZFZGl0b3Iuc2V0T2Zmc2V0cyhuZXdMaW5lT2Zmc2V0cyk7XG4gICAgdGhpcy5fb2xkRGlmZkVkaXRvci5zZXRPZmZzZXRzKG9sZExpbmVPZmZzZXRzKTtcblxuICAgIC8vIFNldCBoaWdobGlnaHRlZCBsaW5lcyBpbiB0aGUgZGlmZiBlZGl0b3JzIG1hcmtpbmcgdGhlIGFkZGVkIGFuZCBkZWxldGVkIGxpbmVzLlxuICAgIC8vIFRoaXMgdHJpZ2dlcyBhIHJlZHJhdyBmb3IgdGhlIGVkaXRvciwgaGVuY2UgYmVpbmcgZG9uZSBhZnRlciB0aGUgb2Zmc2V0cyBoYXZlIGJlZW4gc2V0LlxuICAgIHRoaXMuX25ld0RpZmZFZGl0b3Iuc2V0SGlnaGxpZ2h0ZWRMaW5lcyhhZGRlZExpbmVzLCB1bmRlZmluZWQpO1xuICAgIHRoaXMuX29sZERpZmZFZGl0b3Iuc2V0SGlnaGxpZ2h0ZWRMaW5lcyh1bmRlZmluZWQsIHJlbW92ZWRMaW5lcyk7XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX3N1YnNjcmlwdGlvbnMpIHtcbiAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuZGlzcG9zZSgpO1xuICAgICAgdGhpcy5fc3Vic2NyaXB0aW9ucyA9IG51bGw7XG4gICAgfVxuICB9LFxuXG4gIHJlbmRlcigpOiBSZWFjdEVsZW1lbnQge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZGlmZi12aWV3LWNvbXBvbmVudCc+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdzcGxpdC1wYW5lJz5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0ndGl0bGUnPlxuICAgICAgICAgICAgPHA+T3JpZ2luYWw8L3A+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGF0b20tdGV4dC1lZGl0b3IgcmVmPSdvbGQnIHN0eWxlPXt7aGVpZ2h0OiAnMTAwJSd9fSAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J3NwbGl0LXBhbmUnPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSd0aXRsZSc+XG4gICAgICAgICAgICA8cD5DaGFuZ2VkPC9wPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxhdG9tLXRleHQtZWRpdG9yIHJlZj0nbmV3JyBzdHlsZT17e2hlaWdodDogJzEwMCUnfX0gLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9LFxuXG4gIF9nZXRPbGRUZXh0RWRpdG9yRWxlbWVudCgpOiBUZXh0RWRpdG9yRWxlbWVudCB7XG4gICAgcmV0dXJuIHRoaXMucmVmc1snb2xkJ10uZ2V0RE9NTm9kZSgpO1xuICB9LFxuXG4gIF9nZXROZXdUZXh0RWRpdG9yRWxlbWVudCgpOiBUZXh0RWRpdG9yRWxlbWVudCB7XG4gICAgcmV0dXJuIHRoaXMucmVmc1snbmV3J10uZ2V0RE9NTm9kZSgpO1xuICB9LFxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBEaWZmVmlld0NvbXBvbmVudDtcbiJdfQ==