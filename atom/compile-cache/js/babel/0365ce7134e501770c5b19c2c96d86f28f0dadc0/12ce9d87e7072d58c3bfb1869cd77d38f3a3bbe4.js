'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var AtomInput = require('nuclide-ui-atom-input');

var _require = require('atom');

var CompositeDisposable = _require.CompositeDisposable;

var path = require('path');
var React = require('react-for-atom');

var PropTypes = React.PropTypes;

/**
 * Component that displays UI to create a new file.
 */
var FileDialogComponent = React.createClass({
  displayName: 'FileDialogComponent',

  propTypes: {
    rootDirectory: PropTypes.object.isRequired,
    // The File or Directory to prepopulate the input with.
    initialEntry: PropTypes.object.isRequired,
    // Label for the message above the input. Will be displayed to the user.
    message: PropTypes.element.isRequired,
    // Will be called if the user confirms the 'add' action. Will be called before `onClose`.
    onConfirm: PropTypes.func.isRequired,
    // Will be called regardless of whether the user confirms.
    onClose: PropTypes.func.isRequired,
    // Whether or not to initially select the base name of the path.
    // This is useful for renaming files.
    shouldSelectBasename: PropTypes.bool
  },

  getDefaultProps: function getDefaultProps() {
    return {
      shouldSelectBasename: false
    };
  },

  componentDidMount: function componentDidMount() {
    this._isClosed = false;

    this._subscriptions = new CompositeDisposable();

    var component = this.refs['entryPath'];
    var element = component.getDOMNode();
    this._subscriptions.add(atom.commands.add(element, {
      'core:confirm': this.confirm,
      'core:cancel': this.close
    }));

    var entryPath = this.props.rootDirectory.relativize(this.props.initialEntry.getPath());
    if (entryPath !== '' && this.props.initialEntry.isDirectory()) {
      entryPath = path.normalize(entryPath + '/');
    }

    component.focus();

    var editor = component.getTextEditor();
    component.setText(entryPath);
    if (this.props.shouldSelectBasename) {
      var _path$parse = path.parse(entryPath);

      var base = _path$parse.base;
      var name = _path$parse.name;
      var dir = _path$parse.dir;

      var selectionStart = dir ? dir.length + 1 : 0;
      var selectionEnd = selectionStart + name.length;
      editor.setSelectedBufferRange([[0, selectionStart], [0, selectionEnd]]);
    }
  },

  componentWillUnmount: function componentWillUnmount() {
    if (this._subscriptions) {
      this._subscriptions.dispose();
      this._subscriptions = null;
    }
  },

  render: function render() {
    // The root element cannot have a 'key' property, so we use a dummy
    // <div> as the root. Ideally, the <atom-panel> would be the root.
    return React.createElement(
      'div',
      null,
      React.createElement(
        'atom-panel',
        { className: 'modal from-top', key: 'add-dialog' },
        React.createElement(
          'label',
          null,
          this.props.message
        ),
        React.createElement(AtomInput, { ref: 'entryPath', onBlur: this.close })
      )
    );
  },

  confirm: function confirm() {
    this.props.onConfirm(this.props.rootDirectory, this.refs['entryPath'].getText());
    this.close();
  },

  close: function close() {
    if (!this._isClosed) {
      this._isClosed = true;
      this.props.onClose();
    }
  }
});

module.exports = FileDialogComponent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtdHJlZS9saWIvRmlsZURpYWxvZ0NvbXBvbmVudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7O0FBV1osSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLHVCQUF1QixDQUFDLENBQUM7O2VBQ3JCLE9BQU8sQ0FBQyxNQUFNLENBQUM7O0lBQXRDLG1CQUFtQixZQUFuQixtQkFBbUI7O0FBQ3hCLElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMzQixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQzs7SUFFakMsU0FBUyxHQUFJLEtBQUssQ0FBbEIsU0FBUzs7Ozs7QUFLZCxJQUFJLG1CQUFtQixHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUM7OztBQUMxQyxXQUFTLEVBQUU7QUFDVCxpQkFBYSxFQUFFLFNBQVMsQ0FBQyxNQUFNLENBQUMsVUFBVTs7QUFFMUMsZ0JBQVksRUFBRSxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQVU7O0FBRXpDLFdBQU8sRUFBRSxTQUFTLENBQUMsT0FBTyxDQUFDLFVBQVU7O0FBRXJDLGFBQVMsRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVU7O0FBRXBDLFdBQU8sRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVU7OztBQUdsQyx3QkFBb0IsRUFBRSxTQUFTLENBQUMsSUFBSTtHQUNyQzs7QUFFRCxpQkFBZSxFQUFBLDJCQUFHO0FBQ2hCLFdBQU87QUFDTCwwQkFBb0IsRUFBRSxLQUFLO0tBQzVCLENBQUM7R0FDSDs7QUFFRCxtQkFBaUIsRUFBQSw2QkFBRztBQUNsQixRQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQzs7QUFFdkIsUUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLG1CQUFtQixFQUFFLENBQUM7O0FBRWhELFFBQUksU0FBUyxHQUFH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bGVEaWFsb2dDb21wb25lbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIgQXRvbUlucHV0ID0gcmVxdWlyZSgnbnVjbGlkZS11aS1hdG9tLWlucHV0Jyk7XG52YXIge0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSgnYXRvbScpO1xudmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC1mb3ItYXRvbScpO1xuXG52YXIge1Byb3BUeXBlc30gPSBSZWFjdDtcblxuLyoqXG4gKiBDb21wb25lbnQgdGhhdCBkaXNwbGF5cyBVSSB0byBjcmVhdGUgYSBuZXcgZmlsZS5cbiAqL1xudmFyIEZpbGVEaWFsb2dDb21wb25lbnQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIHByb3BUeXBlczoge1xuICAgIHJvb3REaXJlY3Rvcnk6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICAvLyBUaGUgRmlsZSBvciBEaXJlY3RvcnkgdG8gcHJlcG9wdWxhdGUgdGhlIGlucHV0IHdpdGguXG4gICAgaW5pdGlhbEVudHJ5OiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgLy8gTGFiZWwgZm9yIHRoZSBtZXNzYWdlIGFib3ZlIHRoZSBpbnB1dC4gV2lsbCBiZSBkaXNwbGF5ZWQgdG8gdGhlIHVzZXIuXG4gICAgbWVzc2FnZTogUHJvcFR5cGVzLmVsZW1lbnQuaXNSZXF1aXJlZCxcbiAgICAvLyBXaWxsIGJlIGNhbGxlZCBpZiB0aGUgdXNlciBjb25maXJtcyB0aGUgJ2FkZCcgYWN0aW9uLiBXaWxsIGJlIGNhbGxlZCBiZWZvcmUgYG9uQ2xvc2VgLlxuICAgIG9uQ29uZmlybTogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAvLyBXaWxsIGJlIGNhbGxlZCByZWdhcmRsZXNzIG9mIHdoZXRoZXIgdGhlIHVzZXIgY29uZmlybXMuXG4gICAgb25DbG9zZTogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAvLyBXaGV0aGVyIG9yIG5vdCB0byBpbml0aWFsbHkgc2VsZWN0IHRoZSBiYXNlIG5hbWUgb2YgdGhlIHBhdGguXG4gICAgLy8gVGhpcyBpcyB1c2VmdWwgZm9yIHJlbmFtaW5nIGZpbGVzLlxuICAgIHNob3VsZFNlbGVjdEJhc2VuYW1lOiBQcm9wVHlwZXMuYm9vbCxcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNob3VsZFNlbGVjdEJhc2VuYW1lOiBmYWxzZSxcbiAgICB9O1xuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgIHRoaXMuX2lzQ2xvc2VkID0gZmFsc2U7XG5cbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcblxuICAgIHZhciBjb21wb25lbnQgPSB0aGlzLnJlZnNbJ2VudHJ5UGF0aCddO1xuICAgIHZhciBlbGVtZW50ID0gY29tcG9uZW50LmdldERPTU5vZGUoKTtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcbiAgICAgICAgZWxlbWVudCxcbiAgICAgICAge1xuICAgICAgICAgICdjb3JlOmNvbmZpcm0nOiB0aGlzLmNvbmZpcm0sXG4gICAgICAgICAgJ2NvcmU6Y2FuY2VsJzogdGhpcy5jbG9zZSxcbiAgICAgICAgfSkpO1xuXG4gICAgdmFyIGVudHJ5UGF0aCA9IHRoaXMucHJvcHMucm9vdERpcmVjdG9yeS5yZWxhdGl2aXplKHRoaXMucHJvcHMuaW5pdGlhbEVudHJ5LmdldFBhdGgoKSk7XG4gICAgaWYgKGVudHJ5UGF0aCAhPT0gJycgJiYgdGhpcy5wcm9wcy5pbml0aWFsRW50cnkuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgZW50cnlQYXRoID0gcGF0aC5ub3JtYWxpemUoZW50cnlQYXRoICsgJy8nKTtcbiAgICB9XG5cbiAgICBjb21wb25lbnQuZm9jdXMoKTtcblxuICAgIHZhciBlZGl0b3IgPSBjb21wb25lbnQuZ2V0VGV4dEVkaXRvcigpO1xuICAgIGNvbXBvbmVudC5zZXRUZXh0KGVudHJ5UGF0aCk7XG4gICAgaWYgKHRoaXMucHJvcHMuc2hvdWxkU2VsZWN0QmFzZW5hbWUpIHtcbiAgICAgIHZhciB7YmFzZSwgbmFtZSwgZGlyfSA9IHBhdGgucGFyc2UoZW50cnlQYXRoKTtcbiAgICAgIHZhciBzZWxlY3Rpb25TdGFydCA9IGRpciA/IGRpci5sZW5ndGggKyAxIDogMDtcbiAgICAgIHZhciBzZWxlY3Rpb25FbmQgPSBzZWxlY3Rpb25TdGFydCArIG5hbWUubGVuZ3RoO1xuICAgICAgZWRpdG9yLnNldFNlbGVjdGVkQnVmZmVyUmFuZ2UoW1swLCBzZWxlY3Rpb25TdGFydF0sIFswLCBzZWxlY3Rpb25FbmRdXSk7XG4gICAgfVxuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgIGlmICh0aGlzLl9zdWJzY3JpcHRpb25zKSB7XG4gICAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKTtcbiAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMgPSBudWxsO1xuICAgIH1cbiAgfSxcblxuICByZW5kZXIoKSB7XG4gICAgLy8gVGhlIHJvb3QgZWxlbWVudCBjYW5ub3QgaGF2ZSBhICdrZXknIHByb3BlcnR5LCBzbyB3ZSB1c2UgYSBkdW1teVxuICAgIC8vIDxkaXY+IGFzIHRoZSByb290LiBJZGVhbGx5LCB0aGUgPGF0b20tcGFuZWw+IHdvdWxkIGJlIHRoZSByb290LlxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8YXRvbS1wYW5lbCBjbGFzc05hbWU9J21vZGFsIGZyb20tdG9wJyBrZXk9J2FkZC1kaWFsb2cnPlxuICAgICAgICAgIDxsYWJlbD57dGhpcy5wcm9wcy5tZXNzYWdlfTwvbGFiZWw+XG4gICAgICAgICAgPEF0b21JbnB1dCByZWY9J2VudHJ5UGF0aCcgb25CbHVyPXt0aGlzLmNsb3NlfSAvPlxuICAgICAgICA8L2F0b20tcGFuZWw+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9LFxuXG4gIGNvbmZpcm0oKSB7XG4gICAgdGhpcy5wcm9wcy5vbkNvbmZpcm0odGhpcy5wcm9wcy5yb290RGlyZWN0b3J5LCB0aGlzLnJlZnNbJ2VudHJ5UGF0aCddLmdldFRleHQoKSk7XG4gICAgdGhpcy5jbG9zZSgpO1xuICB9LFxuXG4gIGNsb3NlKCkge1xuICAgIGlmICghdGhpcy5faXNDbG9zZWQpIHtcbiAgICAgIHRoaXMuX2lzQ2xvc2VkID0gdHJ1ZTtcbiAgICAgIHRoaXMucHJvcHMub25DbG9zZSgpO1xuICAgIH1cbiAgfSxcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVEaWFsb2dDb21wb25lbnQ7XG4iXX0=