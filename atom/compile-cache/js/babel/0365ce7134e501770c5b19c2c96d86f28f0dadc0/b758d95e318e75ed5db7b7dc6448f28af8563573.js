'use babel';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

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
var Disposable = _require.Disposable;

var React = require('react-for-atom');

/**
 * We need to create this custom HTML element so we can hook into the view
 * registry. The overlay decoration only works through the view registry.
 */

var SuggestionListElement = (function (_HTMLElement) {
  function SuggestionListElement() {
    _classCallCheck(this, SuggestionListElement);

    _get(Object.getPrototypeOf(SuggestionListElement.prototype), 'constructor', this).apply(this, arguments);
  }

  _inherits(SuggestionListElement, _HTMLElement);

  _createClass(SuggestionListElement, [{
    key: 'initialize',
    value: function initialize(model) {
      if (!model) {
        return;
      }
      this._model = model;
      return this;
    }
  }, {
    key: 'attachedCallback',
    value: function attachedCallback() {
      React.render(React.createElement(SuggestionList, { suggestionList: this._model }), this);
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      React.unmountComponentAtNode(this);
      if (this.parentNode) {
        this.parentNode.removeChild(this);
      }
    }
  }]);

  return SuggestionListElement;
})(HTMLElement);

var SuggestionList = React.createClass({
  displayName: 'SuggestionList',

  _subscriptions: undefined,

  propTypes: {
    suggestionList: React.PropTypes.object
  },

  getInitialState: function getInitialState() {
    return {
      selectedIndex: 0,
      items: []
    };
  },

  componentWillMount: function componentWillMount() {
    this._items = this.props.suggestionList.getSuggestion().callback;
    this._textEditor = this.props.suggestionList.getTextEditor();
  },

  componentDidMount: function componentDidMount() {
    var _this = this;

    this._subscriptions = new CompositeDisposable();

    var textEditorView = atom.views.getView(this._textEditor);
    this._subscriptions.add(atom.commands.add(textEditorView, {
      'core:move-up': this._moveSelectionUp,
      'core:move-down': this._moveSelectionDown,
      'core:move-to-top': this._moveSelectionToTop,
      'core:move-to-bottom': this._moveSelectionToBottom,
      'core:cancel': this._close,
      'editor:newline': this._confirm
    }));

    this._subscriptions.add(this._textEditor.onDidChange(this._close));
    this._subscriptions.add(this._textEditor.onDidChangeCursorPosition(this._close));

    // Prevent scrolling the editor when scrolling the suggestion list.
    var stopPropagation = function stopPropagation(event) {
      return event.stopPropagation();
    };
    React.findDOMNode(this.refs['scroller']).addEventListener('mousewheel', stopPropagation);
    this._subscriptions.add(new Disposable(function () {
      React.findDOMNode(_this.refs['scroller']).removeEventListener('mousewheel', stopPropagation);
    }));

    var keydown = function keydown(event) {
      // If the user presses the enter key, confirm the selection.
      if (event.keyCode === 13) {
        event.stopImmediatePropagation();
        _this._confirm();
      }
    };
    textEditorView.addEventListener('keydown', keydown);
    this._subscriptions.add(new Disposable(function () {
      textEditorView.removeEventListener('keydown', keydown);
    }));
  },

  render: function render() {
    var _this2 = this;

    var itemComponents = this._items.map(function (item, index) {
      var className = 'hyperclick-result-item';
      if (index === _this2.state.selectedIndex) {
        className += ' selected';
      }
      return React.createElement(
        'li',
        { className: className,
          key: index,
          onMouseDown: _this2._confirm,
          onMouseEnter: _this2._setSelectedIndex.bind(_this2, index) },
        item.title
      );
    });

    return React.createElement(
      'div',
      { className: 'popover-list select-list hyperclick-suggestion-list-scroller', ref: 'scroller' },
      React.createElement(
        'ol',
        { className: 'list-group', ref: 'selectionList' },
        itemComponents
      )
    );
  },

  componentDidUpdate: function componentDidUpdate(prevProps, prevState) {
    if (prevState.selectedIndex !== this.state.selectedIndex) {
      this._updateScrollPosition();
    }
  },

  componentWillUnmount: function componentWillUnmount() {
    this._subscriptions.dispose();
  },

  _confirm: function _confirm() {
    this._items[this.state.selectedIndex].callback();
    this._close();
  },

  _close: function _close() {
    this.props.suggestionList.hide();
  },

  _setSelectedIndex: function _setSelectedIndex(index) {
    this.setState({
      selectedIndex: index
    });
  },

  _moveSelectionDown: function _moveSelectionDown(event) {
    if (this.state.selectedIndex < this._items.length - 1) {
      this.setState({ selectedIndex: this.state.selectedIndex + 1 });
    } else {
      this._moveSelectionToTop();
    }
    if (event) {
      event.stopImmediatePropagation();
    }
  },

  _moveSelectionUp: function _moveSelectionUp(event) {
    if (this.state.selectedIndex > 0) {
      this.setState({ selectedIndex: this.state.selectedIndex - 1 });
    } else {
      this._moveSelectionToBottom();
    }
    if (event) {
      event.stopImmediatePropagation();
    }
  },

  _moveSelectionToBottom: function _moveSelectionToBottom(event) {
    this.setState({ selectedIndex: Math.max(this._items.length - 1, 0) });
    if (event) {
      event.stopImmediatePropagation();
    }
  },

  _moveSelectionToTop: function _moveSelectionToTop(event) {
    this.setState({ selectedIndex: 0 });
    if (event) {
      event.stopImmediatePropagation();
    }
  },

  _updateScrollPosition: function _updateScrollPosition() {
    var listNode = React.findDOMNode(this.refs['selectionList']);
    var selectedNode = listNode.getElementsByClassName('selected')[0];
    selectedNode.scrollIntoViewIfNeeded(false);
  }
});

module.exports = SuggestionListElement = document.registerElement('hyperclick-suggestion-list', { prototype: SuggestionListElement.prototype });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9oeXBlcmNsaWNrL2xpYi9TdWdnZXN0aW9uTGlzdEVsZW1lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztlQVc0QixPQUFPLENBQUMsTUFBTSxDQUFDOztJQUFsRCxtQkFBbUIsWUFBbkIsbUJBQW1CO0lBQUUsVUFBVSxZQUFWLFVBQVU7O0FBQ3BDLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDOzs7Ozs7O0lBTWhDLHFCQUFxQjtXQUFyQixxQkFBcUI7MEJBQXJCLHFCQUFxQjs7K0JBQXJCLHFCQUFxQjs7O1lBQXJCLHFCQUFxQjs7ZUFBckIscUJBQXFCOztXQUNmLG9CQUFDLEtBQUssRUFBRTtBQUNoQixVQUFJLENBQUMsS0FBSyxFQUFFO0FBQ1YsZUFBTztPQUNSO0FBQ0QsVUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7QUFDcEIsYUFBTyxJQUFJLENBQUM7S0FDYjs7O1dBRWUsNEJBQUc7QUFDakIsV0FBSyxDQUFDLE1BQU0sQ0FBQyxvQkFBQyxjQUFjLElBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxNQUFNLEdBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztLQUNyRTs7O1dBRU0sbUJBQUc7QUFDUixXQUFLLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDbkMsVUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO0FBQ25CLFlBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO09BQ25DO0tBQ0Y7OztTQWxCRyxxQkFBcUI7R0FBUyxXQUFXOztBQXFCL0MsSUFBSSxjQUFjLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQzs7O0FBQ3JDLGdCQUFjLEVBQUUsU0FBUzs7QUFFekIsV0FBUyxFQUFFO0FBQ1Qsa0JBQWMsRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLE1B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QUFDLEVBQUMsQ0FBQyxDQUFDO0FBQ2xDLFFBQUksS0FBSyxFQUFFO0FBQ1QsV0FBSyxDQUFDLHdCQUF3QixFQUFFLENBQUM7S0FDbEM7R0FDRjs7QUFFRCx1QkFBcUIsRUFBQSxpQ0FBRztBQUN0QixRQUFJLFFBQVEsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztBQUM3RCxRQUFJLFlBQVksR0FBRyxRQUFRLENBQUMsc0JBQXNCLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEUsZ0JBQVksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztHQUM1QztDQUNGLENBQUMsQ0FBQzs7QUFFSCxNQUFNLENBQUMsT0FBTyxHQUFHLHFCQUFxQixHQUFHLFFBQVEsQ0FBQyxlQUFlLENBQUMsNEJBQTRCLEVBQUUsRUFBQyxTQUFTLEVBQUUscUJBQXFCLENBQUMsU0FBUyxFQUFDLENBQUMsQ0FBQyIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvaHlwZXJjbGljay9saWIvU3VnZ2VzdGlvbkxpc3RFbGVtZW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxudmFyIHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlfSA9IHJlcXVpcmUoJ2F0b20nKTtcbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0LWZvci1hdG9tJyk7XG5cbi8qKlxuICogV2UgbmVlZCB0byBjcmVhdGUgdGhpcyBjdXN0b20gSFRNTCBlbGVtZW50IHNvIHdlIGNhbiBob29rIGludG8gdGhlIHZpZXdcbiAqIHJlZ2lzdHJ5LiBUaGUgb3ZlcmxheSBkZWNvcmF0aW9uIG9ubHkgd29ya3MgdGhyb3VnaCB0aGUgdmlldyByZWdpc3RyeS5cbiAqL1xuY2xhc3MgU3VnZ2VzdGlvbkxpc3RFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICBpbml0aWFsaXplKG1vZGVsKSB7XG4gICAgaWYgKCFtb2RlbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9tb2RlbCA9IG1vZGVsO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgYXR0YWNoZWRDYWxsYmFjaygpIHtcbiAgICBSZWFjdC5yZW5kZXIoPFN1Z2dlc3Rpb25MaXN0IHN1Z2dlc3Rpb25MaXN0PXt0aGlzLl9tb2RlbH0gLz4sIHRoaXMpO1xuICB9XG5cbiAgZGlzcG9zZSgpIHtcbiAgICBSZWFjdC51bm1vdW50Q29tcG9uZW50QXROb2RlKHRoaXMpO1xuICAgIGlmICh0aGlzLnBhcmVudE5vZGUpIHtcbiAgICAgIHRoaXMucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzKTtcbiAgICB9XG4gIH1cbn1cblxudmFyIFN1Z2dlc3Rpb25MaXN0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBfc3Vic2NyaXB0aW9uczogdW5kZWZpbmVkLFxuXG4gIHByb3BUeXBlczoge1xuICAgIHN1Z2dlc3Rpb25MaXN0OiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0LFxuICB9LFxuXG4gIGdldEluaXRpYWxTdGF0ZSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc2VsZWN0ZWRJbmRleDogMCxcbiAgICAgIGl0ZW1zOiBbXSxcbiAgICB9O1xuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxNb3VudCgpIHtcbiAgICB0aGlzLl9pdGVtcyA9IHRoaXMucHJvcHMuc3VnZ2VzdGlvbkxpc3QuZ2V0U3VnZ2VzdGlvbigpLmNhbGxiYWNrO1xuICAgIHRoaXMuX3RleHRFZGl0b3IgPSB0aGlzLnByb3BzLnN1Z2dlc3Rpb25MaXN0LmdldFRleHRFZGl0b3IoKTtcbiAgfSxcblxuICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcblxuICAgIHZhciB0ZXh0RWRpdG9yVmlldyA9IGF0b20udmlld3MuZ2V0Vmlldyh0aGlzLl90ZXh0RWRpdG9yKTtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmFkZChcbiAgICAgICAgYXRvbS5jb21tYW5kcy5hZGQodGV4dEVkaXRvclZpZXcsIHtcbiAgICAgICAgICAnY29yZTptb3ZlLXVwJzogdGhpcy5fbW92ZVNlbGVjdGlvblVwLFxuICAgICAgICAgICdjb3JlOm1vdmUtZG93bic6IHRoaXMuX21vdmVTZWxlY3Rpb25Eb3duLFxuICAgICAgICAgICdjb3JlOm1vdmUtdG8tdG9wJzogdGhpcy5fbW92ZVNlbGVjdGlvblRvVG9wLFxuICAgICAgICAgICdjb3JlOm1vdmUtdG8tYm90dG9tJzogdGhpcy5fbW92ZVNlbGVjdGlvblRvQm90dG9tLFxuICAgICAgICAgICdjb3JlOmNhbmNlbCc6IHRoaXMuX2Nsb3NlLFxuICAgICAgICAgICdlZGl0b3I6bmV3bGluZSc6IHRoaXMuX2NvbmZpcm0sXG4gICAgICAgIH0pKTtcblxuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuYWRkKHRoaXMuX3RleHRFZGl0b3Iub25EaWRDaGFuZ2UodGhpcy5fY2xvc2UpKTtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmFkZCh0aGlzLl90ZXh0RWRpdG9yLm9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24odGhpcy5fY2xvc2UpKTtcblxuICAgIC8vIFByZXZlbnQgc2Nyb2xsaW5nIHRoZSBlZGl0b3Igd2hlbiBzY3JvbGxpbmcgdGhlIHN1Z2dlc3Rpb24gbGlzdC5cbiAgICB2YXIgc3RvcFByb3BhZ2F0aW9uID0gKGV2ZW50KSA9PiBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnNbJ3Njcm9sbGVyJ10pLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNld2hlZWwnLCBzdG9wUHJvcGFnYXRpb24pO1xuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuYWRkKG5ldyBEaXNwb3NhYmxlKCgpID0+IHtcbiAgICAgIFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmc1snc2Nyb2xsZXInXSkucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V3aGVlbCcsIHN0b3BQcm9wYWdhdGlvbik7XG4gICAgfSkpO1xuXG4gICAgdmFyIGtleWRvd24gPSAoZXZlbnQpID0+IHtcbiAgICAgIC8vIElmIHRoZSB1c2VyIHByZXNzZXMgdGhlIGVudGVyIGtleSwgY29uZmlybSB0aGUgc2VsZWN0aW9uLlxuICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT09IDEzKSB7XG4gICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgICB0aGlzLl9jb25maXJtKCk7XG4gICAgICB9XG4gICAgfVxuICAgIHRleHRFZGl0b3JWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBrZXlkb3duKTtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmFkZChuZXcgRGlzcG9zYWJsZSgoKSA9PiB7XG4gICAgICB0ZXh0RWRpdG9yVmlldy5yZW1vdmVFdmVudExpc3RlbmVyKCdrZXlkb3duJywga2V5ZG93bik7XG4gICAgfSkpO1xuICB9LFxuXG4gIHJlbmRlcigpIHtcbiAgICB2YXIgaXRlbUNvbXBvbmVudHMgPSB0aGlzLl9pdGVtcy5tYXAoKGl0ZW0sIGluZGV4KSA9PiB7XG4gICAgICB2YXIgY2xhc3NOYW1lID0gJ2h5cGVyY2xpY2stcmVzdWx0LWl0ZW0nO1xuICAgICAgaWYgKGluZGV4ID09PSB0aGlzLnN0YXRlLnNlbGVjdGVkSW5kZXgpIHtcbiAgICAgICAgY2xhc3NOYW1lICs9ICcgc2VsZWN0ZWQnO1xuICAgICAgfVxuICAgICAgcmV0dXJuIChcbiAgICAgICAgPGxpIGNsYXNzTmFtZT17Y2xhc3NOYW1lfVxuICAgICAgICAgICAga2V5PXtpbmRleH1cbiAgICAgICAgICAgIG9uTW91c2VEb3duPXt0aGlzLl9jb25maXJtfVxuICAgICAgICAgICAgb25Nb3VzZUVudGVyPXt0aGlzLl9zZXRTZWxlY3RlZEluZGV4LmJpbmQodGhpcywgaW5kZXgpfT5cbiAgICAgICAgICB7aXRlbS50aXRsZX1cbiAgICAgICAgPC9saT5cbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9J3BvcG92ZXItbGlzdCBzZWxlY3QtbGlzdCBoeXBlcmNsaWNrLXN1Z2dlc3Rpb24tbGlzdC1zY3JvbGxlcicgcmVmPSdzY3JvbGxlcic+XG4gICAgICAgIDxvbCBjbGFzc05hbWU9J2xpc3QtZ3JvdXAnIHJlZj0nc2VsZWN0aW9uTGlzdCc+XG4gICAgICAgICAge2l0ZW1Db21wb25lbnRzfVxuICAgICAgICA8L29sPlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfSxcblxuICBjb21wb25lbnREaWRVcGRhdGUocHJldlByb3BzOiBtaXhlZCwgcHJldlN0YXRlOiBtaXhlZCkge1xuICAgIGlmIChwcmV2U3RhdGUuc2VsZWN0ZWRJbmRleCAhPT0gdGhpcy5zdGF0ZS5zZWxlY3RlZEluZGV4KSB7XG4gICAgICB0aGlzLl91cGRhdGVTY3JvbGxQb3NpdGlvbigpO1xuICAgIH1cbiAgfSxcblxuICBjb21wb25lbnRXaWxsVW5tb3VudCgpIHtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKTtcbiAgfSxcblxuICBfY29uZmlybSgpIHtcbiAgICB0aGlzLl9pdGVtc1t0aGlzLnN0YXRlLnNlbGVjdGVkSW5kZXhdLmNhbGxiYWNrKCk7XG4gICAgdGhpcy5fY2xvc2UoKTtcbiAgfSxcblxuICBfY2xvc2UoKSB7XG4gICAgdGhpcy5wcm9wcy5zdWdnZXN0aW9uTGlzdC5oaWRlKCk7XG4gIH0sXG5cbiAgX3NldFNlbGVjdGVkSW5kZXgoaW5kZXg6IG51bWJlcikge1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgc2VsZWN0ZWRJbmRleDogaW5kZXgsXG4gICAgfSk7XG4gIH0sXG5cbiAgX21vdmVTZWxlY3Rpb25Eb3duKGV2ZW50KSB7XG4gICAgaWYgKHRoaXMuc3RhdGUuc2VsZWN0ZWRJbmRleCA8IHRoaXMuX2l0ZW1zLmxlbmd0aCAtIDEpIHtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe3NlbGVjdGVkSW5kZXg6IHRoaXMuc3RhdGUuc2VsZWN0ZWRJbmRleCArIDF9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fbW92ZVNlbGVjdGlvblRvVG9wKCk7XG4gICAgfVxuICAgIGlmIChldmVudCkge1xuICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgfVxuICB9LFxuXG4gIF9tb3ZlU2VsZWN0aW9uVXAoZXZlbnQpIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5zZWxlY3RlZEluZGV4ID4gMCkge1xuICAgICAgdGhpcy5zZXRTdGF0ZSh7c2VsZWN0ZWRJbmRleDogdGhpcy5zdGF0ZS5zZWxlY3RlZEluZGV4IC0gMX0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9tb3ZlU2VsZWN0aW9uVG9Cb3R0b20oKTtcbiAgICB9XG4gICAgaWYgKGV2ZW50KSB7XG4gICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICB9XG4gIH0sXG5cbiAgX21vdmVTZWxlY3Rpb25Ub0JvdHRvbShldmVudCkge1xuICAgIHRoaXMuc2V0U3RhdGUoe3NlbGVjdGVkSW5kZXg6IE1hdGgubWF4KHRoaXMuX2l0ZW1zLmxlbmd0aCAtIDEsIDApfSk7XG4gICAgaWYgKGV2ZW50KSB7XG4gICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICB9XG4gIH0sXG5cbiAgX21vdmVTZWxlY3Rpb25Ub1RvcChldmVudCkge1xuICAgIHRoaXMuc2V0U3RhdGUoe3NlbGVjdGVkSW5kZXg6IDB9KTtcbiAgICBpZiAoZXZlbnQpIHtcbiAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgIH1cbiAgfSxcblxuICBfdXBkYXRlU2Nyb2xsUG9zaXRpb24oKSB7XG4gICAgdmFyIGxpc3ROb2RlID0gUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzWydzZWxlY3Rpb25MaXN0J10pO1xuICAgIHZhciBzZWxlY3RlZE5vZGUgPSBsaXN0Tm9kZS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdzZWxlY3RlZCcpWzBdO1xuICAgIHNlbGVjdGVkTm9kZS5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKGZhbHNlKTtcbiAgfSxcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN1Z2dlc3Rpb25MaXN0RWxlbWVudCA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCgnaHlwZXJjbGljay1zdWdnZXN0aW9uLWxpc3QnLCB7cHJvdG90eXBlOiBTdWdnZXN0aW9uTGlzdEVsZW1lbnQucHJvdG90eXBlfSk7XG4iXX0=