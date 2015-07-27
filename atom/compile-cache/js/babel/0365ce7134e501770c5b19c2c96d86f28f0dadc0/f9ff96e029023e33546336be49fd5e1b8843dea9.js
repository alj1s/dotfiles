'use babel';

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
var LazyTreeNode = require('./LazyTreeNode');
var React = require('react-for-atom');
var addons = React.addons;
var PropTypes = React.PropTypes;

var INDENT_IN_PX = 10;
var INDENT_PER_LEVEL_IN_PX = 15;
var DOWN_ARROW = '';
var RIGHT_ARROW = '';
var SPINNER = '';

/**
 * Represents one entry in a TreeComponent.
 */
var TreeNodeComponent = React.createClass({
  displayName: 'TreeNodeComponent',

  propTypes: {
    node: PropTypes.instanceOf(LazyTreeNode).isRequired,
    depth: PropTypes.number.isRequired,
    onClickArrow: PropTypes.func.isRequired,
    onClick: PropTypes.func.isRequired,
    onDoubleClick: PropTypes.func.isRequired,
    onMouseDown: PropTypes.func.isRequired,
    isExpanded: PropTypes.func.isRequired,
    isSelected: PropTypes.bool.isRequired,
    labelClassNameForNode: PropTypes.func.isRequired,
    rowClassNameForNode: PropTypes.func
  },

  render: function render() {
    var node = this.props.node;

    var rowClassNameFromProps = this.props.rowClassNameForNode && this.props.rowClassNameForNode(node);
    var rowClassName = addons.classSet(_defineProperty({
      // Support for selectors in the "file-icons" package.
      // See: https://atom.io/packages/file-icons
      'entry file list-item': true,

      'nuclide-tree-component-item': true,
      'nuclide-tree-component-selected': this.props.isSelected
    }, rowClassNameFromProps, rowClassNameFromProps));

    var itemStyle = {
      paddingLeft: INDENT_IN_PX + this.props.depth * INDENT_PER_LEVEL_IN_PX
    };

    var arrow;
    if (node.isContainer()) {
      if (this.props.isExpanded(node)) {
        if (node.isCacheValid()) {
          arrow = DOWN_ARROW;
        } else {
          arrow = React.createElement(
            'span',
            { className: 'nuclide-tree-component-item-arrow-spinner' },
            SPINNER
          );
        }
      } else {
        arrow = RIGHT_ARROW;
      }
    }

    var decorationClassName = this.props.labelClassNameForNode(node);
    return React.createElement(
      'div',
      {
        className: rowClassName,
        style: itemStyle,
        onClick: this._onClick,
        onDoubleClick: this._onDoubleClick,
        onMouseDown: this._onMouseDown },
      React.createElement(
        'span',
        { className: 'nuclide-tree-component-item-arrow', ref: 'arrow' },
        arrow
      ),
      React.createElement(
        'span',
        {
          className: decorationClassName,

          'data-name': node.getLabel() },
        node.getLabel()
      )
    );
  },

  _onClick: function _onClick(event) {
    if (this.refs['arrow'].getDOMNode().contains(event.target)) {
      this.props.onClickArrow(event, this.props.node);
    } else {
      this.props.onClick(event, this.props.node);
    }
  },

  _onDoubleClick: function _onDoubleClick(event) {
    this.props.onDoubleClick(event, this.props.node);
  },

  _onMouseDown: function _onMouseDown(event) {
    this.props.onMouseDown(event, this.props.node);
  }
});

module.exports = TreeNodeComponent;
// `data-name` is support for selectors in the "file-icons" package.
// See: https://atom.io/packages/file-icons
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtdHJlZS9ub2RlX21vZHVsZXMvbnVjbGlkZS11aS10cmVlL2xpYi9UcmVlTm9kZUNvbXBvbmVudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7QUFVWixJQUFJLFlBQVksR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUM3QyxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUVwQyxNQUFNLEdBRUosS0FBSyxDQUZQLE1BQU07SUFDTixTQUFTLEdBQ1AsS0FBSyxDQURQLFNBQVM7O0FBR1gsSUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDO0FBQ3RCLElBQUksc0JBQXNCLEdBQUcsRUFBRSxDQUFDO0FBQ2hDLElBQUksVUFBVSxHQUFHLEdBQVEsQ0FBQztBQUMxQixJQUFJLFdBQVcsR0FBRyxHQUFRLENBQUM7QUFDM0IsSUFBSSxPQUFPLEdBQUcsR0FBUSxDQUFDOzs7OztBQUt2QixJQUFJLGlCQUFpQixHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUM7OztBQUN4QyxXQUFTLEVBQUU7QUFDVCxRQUFJLEVBQUUsU0FBUyxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxVQUFVO0FBQ25ELFNBQUssRUFBRSxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQVU7QUFDbEMsZ0JBQVksRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVU7QUFDdkMsV0FBTyxFQUFFLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVTtBQUNsQyxpQkFBYSxFQUFFLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVTtBQUN4QyxlQUFXLEVBQUUsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVO0FBQ3RDLGNBQVUsRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVU7QUFDckMsY0FBVSxFQUFFLFNBQVMsQ0FBQyxJQUFJLENBQUMs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TyxHQUFHLGlCQUFpQixDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtdHJlZS9ub2RlX21vZHVsZXMvbnVjbGlkZS11aS10cmVlL2xpYi9UcmVlTm9kZUNvbXBvbmVudC5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG52YXIgTGF6eVRyZWVOb2RlID0gcmVxdWlyZSgnLi9MYXp5VHJlZU5vZGUnKTtcbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0LWZvci1hdG9tJyk7XG52YXIge1xuICBhZGRvbnMsXG4gIFByb3BUeXBlcyxcbn0gPSBSZWFjdDtcblxudmFyIElOREVOVF9JTl9QWCA9IDEwO1xudmFyIElOREVOVF9QRVJfTEVWRUxfSU5fUFggPSAxNTtcbnZhciBET1dOX0FSUk9XID0gJ1xcdUYwQTMnO1xudmFyIFJJR0hUX0FSUk9XID0gJ1xcdUYwNzgnO1xudmFyIFNQSU5ORVIgPSAnXFx1RjA4Nyc7XG5cbi8qKlxuICogUmVwcmVzZW50cyBvbmUgZW50cnkgaW4gYSBUcmVlQ29tcG9uZW50LlxuICovXG52YXIgVHJlZU5vZGVDb21wb25lbnQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIHByb3BUeXBlczoge1xuICAgIG5vZGU6IFByb3BUeXBlcy5pbnN0YW5jZU9mKExhenlUcmVlTm9kZSkuaXNSZXF1aXJlZCxcbiAgICBkZXB0aDogUHJvcFR5cGVzLm51bWJlci5pc1JlcXVpcmVkLFxuICAgIG9uQ2xpY2tBcnJvdzogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICBvbkNsaWNrOiBQcm9wVHlwZXMuZnVuYy5pc1JlcXVpcmVkLFxuICAgIG9uRG91YmxlQ2xpY2s6IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgb25Nb3VzZURvd246IFByb3BUeXBlcy5mdW5jLmlzUmVxdWlyZWQsXG4gICAgaXNFeHBhbmRlZDogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICBpc1NlbGVjdGVkOiBQcm9wVHlwZXMuYm9vbC5pc1JlcXVpcmVkLFxuICAgIGxhYmVsQ2xhc3NOYW1lRm9yTm9kZTogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICByb3dDbGFzc05hbWVGb3JOb2RlOiBQcm9wVHlwZXMuZnVuYyxcbiAgfSxcblxuICByZW5kZXIoKTogUmVhY3RFbGVtZW50IHtcbiAgICB2YXIgbm9kZSA9IHRoaXMucHJvcHMubm9kZTtcblxuICAgIHZhciByb3dDbGFzc05hbWVGcm9tUHJvcHMgPVxuICAgICAgICB0aGlzLnByb3BzLnJvd0NsYXNzTmFtZUZvck5vZGUgJiYgdGhpcy5wcm9wcy5yb3dDbGFzc05hbWVGb3JOb2RlKG5vZGUpO1xuICAgIHZhciByb3dDbGFzc05hbWUgPSBhZGRvbnMuY2xhc3NTZXQoe1xuICAgICAgLy8gU3VwcG9ydCBmb3Igc2VsZWN0b3JzIGluIHRoZSBcImZpbGUtaWNvbnNcIiBwYWNrYWdlLlxuICAgICAgLy8gU2VlOiBodHRwczovL2F0b20uaW8vcGFja2FnZXMvZmlsZS1pY29uc1xuICAgICAgJ2VudHJ5IGZpbGUgbGlzdC1pdGVtJzogdHJ1ZSxcblxuICAgICAgJ251Y2xpZGUtdHJlZS1jb21wb25lbnQtaXRlbSc6IHRydWUsXG4gICAgICAnbnVjbGlkZS10cmVlLWNvbXBvbmVudC1zZWxlY3RlZCc6IHRoaXMucHJvcHMuaXNTZWxlY3RlZCxcbiAgICAgIFtyb3dDbGFzc05hbWVGcm9tUHJvcHNdOiByb3dDbGFzc05hbWVGcm9tUHJvcHMsXG4gICAgfSk7XG5cbiAgICB2YXIgaXRlbVN0eWxlID0ge1xuICAgICAgcGFkZGluZ0xlZnQ6IElOREVOVF9JTl9QWCArIHRoaXMucHJvcHMuZGVwdGggKiBJTkRFTlRfUEVSX0xFVkVMX0lOX1BYLFxuICAgIH07XG5cbiAgICB2YXIgYXJyb3c7XG4gICAgaWYgKG5vZGUuaXNDb250YWluZXIoKSkge1xuICAgICAgaWYgKHRoaXMucHJvcHMuaXNFeHBhbmRlZChub2RlKSkge1xuICAgICAgICBpZiAobm9kZS5pc0NhY2hlVmFsaWQoKSkge1xuICAgICAgICAgIGFycm93ID0gRE9XTl9BUlJPVztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhcnJvdyA9IDxzcGFuIGNsYXNzTmFtZT0nbnVjbGlkZS10cmVlLWNvbXBvbmVudC1pdGVtLWFycm93LXNwaW5uZXInPntTUElOTkVSfTwvc3Bhbj47XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFycm93ID0gUklHSFRfQVJST1c7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGRlY29yYXRpb25DbGFzc05hbWUgPSB0aGlzLnByb3BzLmxhYmVsQ2xhc3NOYW1lRm9yTm9kZShub2RlKTtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdlxuICAgICAgICBjbGFzc05hbWU9e3Jvd0NsYXNzTmFtZX1cbiAgICAgICAgc3R5bGU9e2l0ZW1TdHlsZX1cbiAgICAgICAgb25DbGljaz17dGhpcy5fb25DbGlja31cbiAgICAgICAgb25Eb3VibGVDbGljaz17dGhpcy5fb25Eb3VibGVDbGlja31cbiAgICAgICAgb25Nb3VzZURvd249e3RoaXMuX29uTW91c2VEb3dufT5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdudWNsaWRlLXRyZWUtY29tcG9uZW50LWl0ZW0tYXJyb3cnIHJlZj0nYXJyb3cnPlxuICAgICAgICAgIHthcnJvd31cbiAgICAgICAgPC9zcGFuPlxuICAgICAgICA8c3BhblxuICAgICAgICAgIGNsYXNzTmFtZT17ZGVjb3JhdGlvbkNsYXNzTmFtZX1cbiAgICAgICAgICAvLyBgZGF0YS1uYW1lYCBpcyBzdXBwb3J0IGZvciBzZWxlY3RvcnMgaW4gdGhlIFwiZmlsZS1pY29uc1wiIHBhY2thZ2UuXG4gICAgICAgICAgLy8gU2VlOiBodHRwczovL2F0b20uaW8vcGFja2FnZXMvZmlsZS1pY29uc1xuICAgICAgICAgIGRhdGEtbmFtZT17bm9kZS5nZXRMYWJlbCgpfT5cbiAgICAgICAgICB7bm9kZS5nZXRMYWJlbCgpfVxuICAgICAgICA8L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9LFxuXG4gIF9vbkNsaWNrKGV2ZW50OiBTeW50aGV0aWNFdmVudCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnJlZnNbJ2Fycm93J10uZ2V0RE9NTm9kZSgpLmNvbnRhaW5zKGV2ZW50LnRhcmdldCkpIHtcbiAgICAgIHRoaXMucHJvcHMub25DbGlja0Fycm93KGV2ZW50LCB0aGlzLnByb3BzLm5vZGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnByb3BzLm9uQ2xpY2soZXZlbnQsIHRoaXMucHJvcHMubm9kZSk7XG4gICAgfVxuICB9LFxuXG4gIF9vbkRvdWJsZUNsaWNrKGV2ZW50OiBTeW50aGV0aWNFdmVudCk6IHZvaWQge1xuICAgIHRoaXMucHJvcHMub25Eb3VibGVDbGljayhldmVudCwgdGhpcy5wcm9wcy5ub2RlKTtcbiAgfSxcblxuICBfb25Nb3VzZURvd24oZXZlbnQ6IFN5bnRoZXRpY0V2ZW50KTogdm9pZCB7XG4gICAgdGhpcy5wcm9wcy5vbk1vdXNlRG93bihldmVudCwgdGhpcy5wcm9wcy5ub2RlKTtcbiAgfSxcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRyZWVOb2RlQ29tcG9uZW50O1xuIl19