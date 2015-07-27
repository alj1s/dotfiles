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

var MINIMUM_LENGTH = 100;

/**
 * A container for centralizing the logic for making panels scrollable,
 * resizeable, dockable, etc.
 */
var PanelComponent = React.createClass({
  displayName: 'PanelComponent',

  propTypes: {
    children: React.PropTypes.element.isRequired,
    dock: PropTypes.oneOf(['left', 'bottom', 'right']).isRequired,
    initialLength: PropTypes.number
  },

  getDefaultProps: function getDefaultProps() {
    return {
      initalLength: 200
    };
  },

  getInitialState: function getInitialState() {
    return {
      isResizing: false,
      length: this.props.initialLength
    };
  },

  render: function render() {
    // We create an overlay to always display the resize cursor while the user
    // is resizing the panel, even if their mouse leaves the handle.
    var resizeCursorOverlay = null;
    if (this.state.isResizing) {
      resizeCursorOverlay = React.createElement('div', { className: 'nuclide-panel-component-resize-cursor-overlay ' + this.props.dock });
    }

    var containerStyle;
    if (this.props.dock === 'left' || this.props.dock === 'right') {
      containerStyle = {
        width: this.state.length,
        minWidth: MINIMUM_LENGTH
      };
    } else if (this.props.dock === 'bottom') {
      containerStyle = {
        height: this.state.length,
        minHeight: MINIMUM_LENGTH
      };
    }

    var content = React.cloneElement(React.Children.only(this.props.children), { ref: 'child' });

    return React.createElement(
      'div',
      { className: 'nuclide-panel-component ' + this.props.dock,
        ref: 'container',
        style: containerStyle },
      React.createElement('div', { className: 'nuclide-panel-component-resize-handle ' + this.props.dock,
        ref: 'handle',
        onMouseDown: this._handleMouseDown,
        onDoubleClick: this._handleDoubleClick }),
      React.createElement(
        'div',
        { className: 'nuclide-panel-component-scroller' },
        content
      ),
      resizeCursorOverlay
    );
  },

  /**
   * Returns the current resizable length.
   *
   * For panels docked left or right, the length is the width. For panels
   * docked top or bottom, it's the height.
   */
  getLength: function getLength() {
    return this.state.length;
  },

  focus: function focus() {
    this.refs.child.getDOMNode().focus();
  },

  getChildComponent: function getChildComponent() {
    return this.refs.child;
  },

  _handleMouseDown: function _handleMouseDown(event) {
    var _this = this;

    this._resizeSubscriptions = new CompositeDisposable();

    window.addEventListener('mousemove', this._handleMouseMove);
    this._resizeSubscriptions.add({
      dispose: function dispose() {
        return window.removeEventListener('mousemove', _this._handleMouseMove);
      }
    });

    window.addEventListener('mouseup', this._handleMouseUp);
    this._resizeSubscriptions.add({
      dispose: function dispose() {
        return window.removeEventListener('mouseup', _this._handleMouseUp);
      }
    });

    this.setState({ isResizing: true });
  },

  _handleMouseMove: function _handleMouseMove(event) {
    var containerEl = this.refs['container'].getDOMNode();
    var length = 0;
    if (this.props.dock === 'left') {
      length = event.pageX - containerEl.getBoundingClientRect().left;
    } else if (this.props.dock === 'bottom') {
      length = containerEl.getBoundingClientRect().bottom - event.pageY;
    } else if (this.props.dock === 'right') {
      length = containerEl.getBoundingClientRect().right - event.pageX;
    }
    this.setState({ length: length });
  },

  _handleMouseUp: function _handleMouseUp(event) {
    if (this._resizeSubscriptions) {
      this._resizeSubscriptions.dispose();
    }
    this.setState({ isResizing: false });
  },

  /**
   * Resize the pane to fit its contents.
   */
  _handleDoubleClick: function _handleDoubleClick() {
    var _this2 = this;

    // Reset size to 0 and read the content's natural width (after re-layout)
    // to determine the size to scale to.
    this.setState({ length: 0 });
    this.forceUpdate(function () {
      var length = 0;
      var childNode = _this2.refs.child.getDOMNode();
      var handle = _this2.refs.handle.getDOMNode();
      if (_this2.props.dock === 'left' || _this2.props.dock === 'right') {
        length = childNode.offsetWidth + handle.offsetWidth;
      } else if (_this2.props.dock === 'bottom') {
        length = childNode.offsetHeight + handle.offsetHeight;
      } else {
        throw new Error('unhandled dock');
      }
      _this2.setState({ length: length });
    });
  }
});

module.exports = PanelComponent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtdHJlZS9ub2RlX21vZHVsZXMvbnVjbGlkZS1wYW5lbC9saWIvUGFuZWxDb21wb25lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7OztlQVVnQixPQUFPLENBQUMsTUFBTSxDQUFDOztJQUF0QyxtQkFBbUIsWUFBbkIsbUJBQW1COztBQUN4QixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQzs7SUFFakMsU0FBUyxHQUFJLEtBQUssQ0FBbEIsU0FBUzs7QUFFZCxJQUFJLGNBQWMsR0FBRyxHQUFHLENBQUM7Ozs7OztBQU16QixJQUFJLGNBQWMsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDOzs7QUFDckMsV0FBUyxFQUFFO0FBQ1QsWUFBUSxFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFVBQVU7QUFDNUMsUUFBSSxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsVUFBVTtBQUM3RCxpQkFBYSxFQUFFLFNBQVMsQ0FBQyxNQUFNO0dBQ2hDOztBQUVELGlCQUFlLEVBQUEsMkJBQVc7QUFDeEIsV0FBTztBQUNMLGtCQUFZLEVBQUUsR0FBRztLQUNsQixDQUFDO0dBQ0g7O0FBRUQsaUJBQWUsRUFBQSwyQkFBVztBQUN4QixXQUFPO0FBQ0wsZ0JBQVUsRUFBRSxLQUFLO0FBQ2pCLFlBQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWE7S0FDakMsQ0FBQztHQUNIOztBQUVELFFBQU0sRUFBQSxrQkFBaUI7OztBQUdyQixRQUFJLG1CQUFtQixHQUFHLElBQUksQ0FBQztBQUMvQixRQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFO0FBQ3pCLHlCQUFtQixHQUFHLDZCQUFLLFNBQVMscURBQW1ELElB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QUFDM0MsVUFBSSxPQUFLLEtBQUssQ0FBQyxJQUFJLEtBQUssTUFBTSxJQUFJLE9BQUssS0FBSyxDQUFDLElBQUksS0FBSyxPQUFPLEVBQUU7QUFDN0QsY0FBTSxHQUFHLFNBQVMsQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQztPQUNyRCxNQUFNLElBQUksT0FBSyxLQUFLLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRTtBQUN2QyxjQUFNLEdBQUcsU0FBUyxDQUFDLFlBQVksR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDO09BQ3ZELE1BQU07QUFDTCxjQUFNLElBQUksS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUM7T0FDbkM7QUFDRCxhQUFLLFFBQVEsQ0FBQyxFQUFDLE1BQU0sRUFBTixNQUFNLEVBQUMsQ0FBQyxDQUFDO0tBQ3pCLENBQUMsQ0FBQztHQUNKO0NBQ0YsQ0FBQyxDQUFDOztBQUVILE1BQU0sQ0FBQyxPQUFPLEdBQUcsY0FBYyxDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtdHJlZS9ub2RlX21vZHVsZXMvbnVjbGlkZS1wYW5lbC9saWIvUGFuZWxDb21wb25lbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xudmFyIHtDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUoJ2F0b20nKTtcbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0LWZvci1hdG9tJyk7XG5cbnZhciB7UHJvcFR5cGVzfSA9IFJlYWN0O1xuXG52YXIgTUlOSU1VTV9MRU5HVEggPSAxMDA7XG5cbi8qKlxuICogQSBjb250YWluZXIgZm9yIGNlbnRyYWxpemluZyB0aGUgbG9naWMgZm9yIG1ha2luZyBwYW5lbHMgc2Nyb2xsYWJsZSxcbiAqIHJlc2l6ZWFibGUsIGRvY2thYmxlLCBldGMuXG4gKi9cbnZhciBQYW5lbENvbXBvbmVudCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgcHJvcFR5cGVzOiB7XG4gICAgY2hpbGRyZW46IFJlYWN0LlByb3BUeXBlcy5lbGVtZW50LmlzUmVxdWlyZWQsXG4gICAgZG9jazogUHJvcFR5cGVzLm9uZU9mKFsnbGVmdCcsICdib3R0b20nLCAncmlnaHQnXSkuaXNSZXF1aXJlZCxcbiAgICBpbml0aWFsTGVuZ3RoOiBQcm9wVHlwZXMubnVtYmVyLFxuICB9LFxuXG4gIGdldERlZmF1bHRQcm9wcygpOiBPYmplY3Qge1xuICAgIHJldHVybiB7XG4gICAgICBpbml0YWxMZW5ndGg6IDIwMCxcbiAgICB9O1xuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZSgpOiBPYmplY3Qge1xuICAgIHJldHVybiB7XG4gICAgICBpc1Jlc2l6aW5nOiBmYWxzZSxcbiAgICAgIGxlbmd0aDogdGhpcy5wcm9wcy5pbml0aWFsTGVuZ3RoLFxuICAgIH07XG4gIH0sXG5cbiAgcmVuZGVyKCk6IFJlYWN0RWxlbWVudCB7XG4gICAgLy8gV2UgY3JlYXRlIGFuIG92ZXJsYXkgdG8gYWx3YXlzIGRpc3BsYXkgdGhlIHJlc2l6ZSBjdXJzb3Igd2hpbGUgdGhlIHVzZXJcbiAgICAvLyBpcyByZXNpemluZyB0aGUgcGFuZWwsIGV2ZW4gaWYgdGhlaXIgbW91c2UgbGVhdmVzIHRoZSBoYW5kbGUuXG4gICAgdmFyIHJlc2l6ZUN1cnNvck92ZXJsYXkgPSBudWxsO1xuICAgIGlmICh0aGlzLnN0YXRlLmlzUmVzaXppbmcpIHtcbiAgICAgIHJlc2l6ZUN1cnNvck92ZXJsYXkgPSA8ZGl2IGNsYXNzTmFtZT17YG51Y2xpZGUtcGFuZWwtY29tcG9uZW50LXJlc2l6ZS1jdXJzb3Itb3ZlcmxheSAke3RoaXMucHJvcHMuZG9ja31gfSAvPjtcbiAgICB9XG5cbiAgICB2YXIgY29udGFpbmVyU3R5bGU7XG4gICAgaWYgKHRoaXMucHJvcHMuZG9jayA9PT0gJ2xlZnQnIHx8IHRoaXMucHJvcHMuZG9jayA9PT0gJ3JpZ2h0Jykge1xuICAgICAgY29udGFpbmVyU3R5bGUgPSB7XG4gICAgICAgIHdpZHRoOiB0aGlzLnN0YXRlLmxlbmd0aCxcbiAgICAgICAgbWluV2lkdGg6IE1JTklNVU1fTEVOR1RILFxuICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKHRoaXMucHJvcHMuZG9jayA9PT0gJ2JvdHRvbScpIHtcbiAgICAgIGNvbnRhaW5lclN0eWxlID0ge1xuICAgICAgICBoZWlnaHQ6IHRoaXMuc3RhdGUubGVuZ3RoLFxuICAgICAgICBtaW5IZWlnaHQ6IE1JTklNVU1fTEVOR1RILFxuICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgY29udGVudCA9IFJlYWN0LmNsb25lRWxlbWVudChcbiAgICAgIFJlYWN0LkNoaWxkcmVuLm9ubHkodGhpcy5wcm9wcy5jaGlsZHJlbiksXG4gICAgICB7cmVmOiAnY2hpbGQnfSk7XG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9e2BudWNsaWRlLXBhbmVsLWNvbXBvbmVudCAke3RoaXMucHJvcHMuZG9ja31gfVxuICAgICAgICAgICByZWY9J2NvbnRhaW5lcidcbiAgICAgICAgICAgc3R5bGU9e2NvbnRhaW5lclN0eWxlfT5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9e2BudWNsaWRlLXBhbmVsLWNvbXBvbmVudC1yZXNpemUtaGFuZGxlICR7dGhpcy5wcm9wcy5kb2NrfWB9XG4gICAgICAgICAgICAgcmVmPSdoYW5kbGUnXG4gICAgICAgICAgICAgb25Nb3VzZURvd249e3RoaXMuX2hhbmRsZU1vdXNlRG93bn1cbiAgICAgICAgICAgICBvbkRvdWJsZUNsaWNrPXt0aGlzLl9oYW5kbGVEb3VibGVDbGlja30gLz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J251Y2xpZGUtcGFuZWwtY29tcG9uZW50LXNjcm9sbGVyJz5cbiAgICAgICAgICB7Y29udGVudH1cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIHtyZXNpemVDdXJzb3JPdmVybGF5fVxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfSxcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY3VycmVudCByZXNpemFibGUgbGVuZ3RoLlxuICAgKlxuICAgKiBGb3IgcGFuZWxzIGRvY2tlZCBsZWZ0IG9yIHJpZ2h0LCB0aGUgbGVuZ3RoIGlzIHRoZSB3aWR0aC4gRm9yIHBhbmVsc1xuICAgKiBkb2NrZWQgdG9wIG9yIGJvdHRvbSwgaXQncyB0aGUgaGVpZ2h0LlxuICAgKi9cbiAgZ2V0TGVuZ3RoKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdGUubGVuZ3RoO1xuICB9LFxuXG4gIGZvY3VzKCk6IHZvaWQge1xuICAgIHRoaXMucmVmcy5jaGlsZC5nZXRET01Ob2RlKCkuZm9jdXMoKTtcbiAgfSxcblxuICBnZXRDaGlsZENvbXBvbmVudCgpOiB2b2lkIHtcbiAgICByZXR1cm4gdGhpcy5yZWZzLmNoaWxkO1xuICB9LFxuXG4gIF9oYW5kbGVNb3VzZURvd24oZXZlbnQ6IFN5bnRoZXRpY01vdXNlRXZlbnQpOiB2b2lkIHtcbiAgICB0aGlzLl9yZXNpemVTdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcblxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLl9oYW5kbGVNb3VzZU1vdmUpO1xuICAgIHRoaXMuX3Jlc2l6ZVN1YnNjcmlwdGlvbnMuYWRkKHtcbiAgICAgIGRpc3Bvc2U6ICgpID0+IHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCB0aGlzLl9oYW5kbGVNb3VzZU1vdmUpXG4gICAgfSk7XG5cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMuX2hhbmRsZU1vdXNlVXApO1xuICAgIHRoaXMuX3Jlc2l6ZVN1YnNjcmlwdGlvbnMuYWRkKHtcbiAgICAgIGRpc3Bvc2U6ICgpID0+IHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5faGFuZGxlTW91c2VVcClcbiAgICB9KTtcblxuICAgIHRoaXMuc2V0U3RhdGUoe2lzUmVzaXppbmc6IHRydWV9KTtcbiAgfSxcblxuICBfaGFuZGxlTW91c2VNb3ZlKGV2ZW50OiBTeW50aGV0aWNNb3VzZUV2ZW50KTogdm9pZCB7XG4gICAgdmFyIGNvbnRhaW5lckVsID0gdGhpcy5yZWZzWydjb250YWluZXInXS5nZXRET01Ob2RlKCk7XG4gICAgdmFyIGxlbmd0aCA9IDA7XG4gICAgaWYgKHRoaXMucHJvcHMuZG9jayA9PT0gJ2xlZnQnKSB7XG4gICAgICBsZW5ndGggPSBldmVudC5wYWdlWCAtIGNvbnRhaW5lckVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQ7XG4gICAgfSBlbHNlIGlmICh0aGlzLnByb3BzLmRvY2sgPT09ICdib3R0b20nKSB7XG4gICAgICBsZW5ndGggPSBjb250YWluZXJFbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5ib3R0b20gLSBldmVudC5wYWdlWTtcbiAgICB9IGVsc2UgaWYgKHRoaXMucHJvcHMuZG9jayA9PT0gJ3JpZ2h0Jykge1xuICAgICAgbGVuZ3RoID0gY29udGFpbmVyRWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkucmlnaHQgLSBldmVudC5wYWdlWDtcbiAgICB9XG4gICAgdGhpcy5zZXRTdGF0ZSh7bGVuZ3RofSk7XG4gIH0sXG5cbiAgX2hhbmRsZU1vdXNlVXAoZXZlbnQ6IFN5bnRoZXRpY01vdXNlRXZlbnQpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fcmVzaXplU3Vic2NyaXB0aW9ucykge1xuICAgICAgdGhpcy5fcmVzaXplU3Vic2NyaXB0aW9ucy5kaXNwb3NlKCk7XG4gICAgfVxuICAgIHRoaXMuc2V0U3RhdGUoe2lzUmVzaXppbmc6IGZhbHNlfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJlc2l6ZSB0aGUgcGFuZSB0byBmaXQgaXRzIGNvbnRlbnRzLlxuICAgKi9cbiAgX2hhbmRsZURvdWJsZUNsaWNrKCk6IHZvaWQge1xuICAgIC8vIFJlc2V0IHNpemUgdG8gMCBhbmQgcmVhZCB0aGUgY29udGVudCdzIG5hdHVyYWwgd2lkdGggKGFmdGVyIHJlLWxheW91dClcbiAgICAvLyB0byBkZXRlcm1pbmUgdGhlIHNpemUgdG8gc2NhbGUgdG8uXG4gICAgdGhpcy5zZXRTdGF0ZSh7bGVuZ3RoOiAwfSk7XG4gICAgdGhpcy5mb3JjZVVwZGF0ZSgoKSA9PiB7XG4gICAgICB2YXIgbGVuZ3RoID0gMDtcbiAgICAgIHZhciBjaGlsZE5vZGUgPSB0aGlzLnJlZnMuY2hpbGQuZ2V0RE9NTm9kZSgpO1xuICAgICAgdmFyIGhhbmRsZSA9IHRoaXMucmVmcy5oYW5kbGUuZ2V0RE9NTm9kZSgpO1xuICAgICAgaWYgKHRoaXMucHJvcHMuZG9jayA9PT0gJ2xlZnQnIHx8IHRoaXMucHJvcHMuZG9jayA9PT0gJ3JpZ2h0Jykge1xuICAgICAgICBsZW5ndGggPSBjaGlsZE5vZGUub2Zmc2V0V2lkdGggKyBoYW5kbGUub2Zmc2V0V2lkdGg7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMucHJvcHMuZG9jayA9PT0gJ2JvdHRvbScpIHtcbiAgICAgICAgbGVuZ3RoID0gY2hpbGROb2RlLm9mZnNldEhlaWdodCArIGhhbmRsZS5vZmZzZXRIZWlnaHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3VuaGFuZGxlZCBkb2NrJyk7XG4gICAgICB9XG4gICAgICB0aGlzLnNldFN0YXRlKHtsZW5ndGh9KTtcbiAgICB9KTtcbiAgfSxcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBhbmVsQ29tcG9uZW50O1xuIl19