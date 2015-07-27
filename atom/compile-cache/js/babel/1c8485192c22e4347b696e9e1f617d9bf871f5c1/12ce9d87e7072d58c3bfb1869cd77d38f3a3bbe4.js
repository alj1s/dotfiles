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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtdHJlZS9saWIvRmlsZURpYWxvZ0NvbXBvbmVudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7O0FBV1osSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLHVCQUF1QixDQUFDLENBQUM7O2VBQ3JCLE9BQU8sQ0FBQyxNQUFNLENBQUM7O0lBQXRDLG1CQUFtQixZQUFuQixtQkFBbUI7O0FBQ3hCLElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMzQixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQzs7SUFFakMsU0FBUyxHQUFJLEtBQUssQ0FBbEIsU0FBUzs7Ozs7QUFLZCxJQUFJLG1CQUFtQixHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUM7OztBQUMxQyxXQUFTLEVBQUU7QUFDVCxpQkFBYSxFQUFFLFNBQVMsQ0FBQyxNQUFNLENBQUMsVUFBVTs7QUFFMUMsZ0JBQVksRUFBRSxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQVU7O0FBRXpDLFdBQU8sRUFBRSxTQUFTLENBQUMsT0FBTyxDQUFDLFVBQVU7O0FBRXJDLGFBQVMsRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVU7O0FBRXBDLFdBQU8sRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVU7OztBQUdsQyx3QkFBb0IsRUFBRSxTQUFTLENBQUMsSUFBSTtHQUNyQzs7QUFFRCxpQkFBZSxFQUFBLDJCQUFHO0FBQ2hCLFdBQU87QUFDTCwwQkFBb0IsRUFBRSxLQUFLO0tBQzVCLENBQUM7R0FDSDs7QUFFRCxtQkFBaUIsRUFBQSw2QkFBRztBQUNsQixRQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQzs7QUFFdkIsUUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLG1CQUFtQixFQUFFLENBQUM7O0FBRWhELFFBQUksU0FBUyxHQUFH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aWIvRmlsZURpYWxvZ0NvbXBvbmVudC5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbnZhciBBdG9tSW5wdXQgPSByZXF1aXJlKCdudWNsaWRlLXVpLWF0b20taW5wdXQnKTtcbnZhciB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlKCdhdG9tJyk7XG52YXIgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0LWZvci1hdG9tJyk7XG5cbnZhciB7UHJvcFR5cGVzfSA9IFJlYWN0O1xuXG4vKipcbiAqIENvbXBvbmVudCB0aGF0IGRpc3BsYXlzIFVJIHRvIGNyZWF0ZSBhIG5ldyBmaWxlLlxuICovXG52YXIgRmlsZURpYWxvZ0NvbXBvbmVudCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgcHJvcFR5cGVzOiB7XG4gICAgcm9vdERpcmVjdG9yeTogUHJvcFR5cGVzLm9iamVjdC5pc1JlcXVpcmVkLFxuICAgIC8vIFRoZSBGaWxlIG9yIERpcmVjdG9yeSB0byBwcmVwb3B1bGF0ZSB0aGUgaW5wdXQgd2l0aC5cbiAgICBpbml0aWFsRW50cnk6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICAvLyBMYWJlbCBmb3IgdGhlIG1lc3NhZ2UgYWJvdmUgdGhlIGlucHV0LiBXaWxsIGJlIGRpc3BsYXllZCB0byB0aGUgdXNlci5cbiAgICBtZXNzYWdlOiBQcm9wVHlwZXMuZWxlbWVudC5pc1JlcXVpcmVkLFxuICAgIC8vIFdpbGwgYmUgY2FsbGVkIGlmIHRoZSB1c2VyIGNvbmZpcm1zIHRoZSAnYWRkJyBhY3Rpb24uIFdpbGwgYmUgY2FsbGVkIGJlZm9yZSBgb25DbG9zZWAuXG4gICAgb25Db25maXJtOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgIC8vIFdpbGwgYmUgY2FsbGVkIHJlZ2FyZGxlc3Mgb2Ygd2hldGhlciB0aGUgdXNlciBjb25maXJtcy5cbiAgICBvbkNsb3NlOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgIC8vIFdoZXRoZXIgb3Igbm90IHRvIGluaXRpYWxseSBzZWxlY3QgdGhlIGJhc2UgbmFtZSBvZiB0aGUgcGF0aC5cbiAgICAvLyBUaGlzIGlzIHVzZWZ1bCBmb3IgcmVuYW1pbmcgZmlsZXMuXG4gICAgc2hvdWxkU2VsZWN0QmFzZW5hbWU6IFByb3BUeXBlcy5ib29sLFxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wcygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc2hvdWxkU2VsZWN0QmFzZW5hbWU6IGZhbHNlLFxuICAgIH07XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgdGhpcy5faXNDbG9zZWQgPSBmYWxzZTtcblxuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuXG4gICAgdmFyIGNvbXBvbmVudCA9IHRoaXMucmVmc1snZW50cnlQYXRoJ107XG4gICAgdmFyIGVsZW1lbnQgPSBjb21wb25lbnQuZ2V0RE9NTm9kZSgpO1xuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29tbWFuZHMuYWRkKFxuICAgICAgICBlbGVtZW50LFxuICAgICAgICB7XG4gICAgICAgICAgJ2NvcmU6Y29uZmlybSc6IHRoaXMuY29uZmlybSxcbiAgICAgICAgICAnY29yZTpjYW5jZWwnOiB0aGlzLmNsb3NlLFxuICAgICAgICB9KSk7XG5cbiAgICB2YXIgZW50cnlQYXRoID0gdGhpcy5wcm9wcy5yb290RGlyZWN0b3J5LnJlbGF0aXZpemUodGhpcy5wcm9wcy5pbml0aWFsRW50cnkuZ2V0UGF0aCgpKTtcbiAgICBpZiAoZW50cnlQYXRoICE9PSAnJyAmJiB0aGlzLnByb3BzLmluaXRpYWxFbnRyeS5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICBlbnRyeVBhdGggPSBwYXRoLm5vcm1hbGl6ZShlbnRyeVBhdGggKyAnLycpO1xuICAgIH1cblxuICAgIGNvbXBvbmVudC5mb2N1cygpO1xuXG4gICAgdmFyIGVkaXRvciA9IGNvbXBvbmVudC5nZXRUZXh0RWRpdG9yKCk7XG4gICAgY29tcG9uZW50LnNldFRleHQoZW50cnlQYXRoKTtcbiAgICBpZiAodGhpcy5wcm9wcy5zaG91bGRTZWxlY3RCYXNlbmFtZSkge1xuICAgICAgdmFyIHtiYXNlLCBuYW1lLCBkaXJ9ID0gcGF0aC5wYXJzZShlbnRyeVBhdGgpO1xuICAgICAgdmFyIHNlbGVjdGlvblN0YXJ0ID0gZGlyID8gZGlyLmxlbmd0aCArIDEgOiAwO1xuICAgICAgdmFyIHNlbGVjdGlvbkVuZCA9IHNlbGVjdGlvblN0YXJ0ICsgbmFtZS5sZW5ndGg7XG4gICAgICBlZGl0b3Iuc2V0U2VsZWN0ZWRCdWZmZXJSYW5nZShbWzAsIHNlbGVjdGlvblN0YXJ0XSwgWzAsIHNlbGVjdGlvbkVuZF1dKTtcbiAgICB9XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQoKSB7XG4gICAgaWYgKHRoaXMuX3N1YnNjcmlwdGlvbnMpIHtcbiAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuZGlzcG9zZSgpO1xuICAgICAgdGhpcy5fc3Vic2NyaXB0aW9ucyA9IG51bGw7XG4gICAgfVxuICB9LFxuXG4gIHJlbmRlcigpIHtcbiAgICAvLyBUaGUgcm9vdCBlbGVtZW50IGNhbm5vdCBoYXZlIGEgJ2tleScgcHJvcGVydHksIHNvIHdlIHVzZSBhIGR1bW15XG4gICAgLy8gPGRpdj4gYXMgdGhlIHJvb3QuIElkZWFsbHksIHRoZSA8YXRvbS1wYW5lbD4gd291bGQgYmUgdGhlIHJvb3QuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxhdG9tLXBhbmVsIGNsYXNzTmFtZT0nbW9kYWwgZnJvbS10b3AnIGtleT0nYWRkLWRpYWxvZyc+XG4gICAgICAgICAgPGxhYmVsPnt0aGlzLnByb3BzLm1lc3NhZ2V9PC9sYWJlbD5cbiAgICAgICAgICA8QXRvbUlucHV0IHJlZj0nZW50cnlQYXRoJyBvbkJsdXI9e3RoaXMuY2xvc2V9IC8+XG4gICAgICAgIDwvYXRvbS1wYW5lbD5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG5cbiAgY29uZmlybSgpIHtcbiAgICB0aGlzLnByb3BzLm9uQ29uZmlybSh0aGlzLnByb3BzLnJvb3REaXJlY3RvcnksIHRoaXMucmVmc1snZW50cnlQYXRoJ10uZ2V0VGV4dCgpKTtcbiAgICB0aGlzLmNsb3NlKCk7XG4gIH0sXG5cbiAgY2xvc2UoKSB7XG4gICAgaWYgKCF0aGlzLl9pc0Nsb3NlZCkge1xuICAgICAgdGhpcy5faXNDbG9zZWQgPSB0cnVlO1xuICAgICAgdGhpcy5wcm9wcy5vbkNsb3NlKCk7XG4gICAgfVxuICB9LFxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRmlsZURpYWxvZ0NvbXBvbmVudDtcbiJdfQ==