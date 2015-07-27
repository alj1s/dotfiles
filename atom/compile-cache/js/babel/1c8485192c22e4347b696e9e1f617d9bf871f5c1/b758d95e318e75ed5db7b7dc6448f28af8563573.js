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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9oeXBlcmNsaWNrL2xpYi9TdWdnZXN0aW9uTGlzdEVsZW1lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztlQVc0QixPQUFPLENBQUMsTUFBTSxDQUFDOztJQUFsRCxtQkFBbUIsWUFBbkIsbUJBQW1CO0lBQUUsVUFBVSxZQUFWLFVBQVU7O0FBQ3BDLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDOzs7Ozs7O0lBTWhDLHFCQUFxQjtXQUFyQixxQkFBcUI7MEJBQXJCLHFCQUFxQjs7K0JBQXJCLHFCQUFxQjs7O1lBQXJCLHFCQUFxQjs7ZUFBckIscUJBQXFCOztXQUNmLG9CQUFDLEtBQUssRUFBRTtBQUNoQixVQUFJLENBQUMsS0FBSyxFQUFFO0FBQ1YsZUFBTztPQUNSO0FBQ0QsVUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7QUFDcEIsYUFBTyxJQUFJLENBQUM7S0FDYjs7O1dBRWUsNEJBQUc7QUFDakIsV0FBSyxDQUFDLE1BQU0sQ0FBQyxvQkFBQyxjQUFjLElBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxNQUFNLEFBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQ3JFOzs7V0FFTSxtQkFBRztBQUNSLFdBQUssQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNuQyxVQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7QUFDbkIsWUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7T0FDbkM7S0FDRjs7O1NBbEJHLHFCQUFxQjtHQUFTLFdBQVc7O0FBcUIvQyxJQUFJLGNBQWMsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDOzs7QUFDckMsZ0JBQWMsRUFBRSxTQUFTOztBQUV6QixXQUFTLEVBQUU7QUFDVCxrQkFBYyxFQUFFLEtBQUssQ0FBQyxTQUFTLENB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QUFRLENBQUMsRUFBQyxhQUFhLEVBQUUsQ0FBQyxFQUFDLENBQUMsQ0FBQztBQUNsQyxRQUFJLEtBQUssRUFBRTtBQUNULFdBQUssQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO0tBQ2xDO0dBQ0Y7O0FBRUQsdUJBQXFCLEVBQUEsaUNBQUc7QUFDdEIsUUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7QUFDN0QsUUFBSSxZQUFZLEdBQUcsUUFBUSxDQUFDLHNCQUFzQixDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xFLGdCQUFZLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLENBQUM7R0FDNUM7Q0FDRixDQUFDLENBQUM7O0FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRyxxQkFBcUIsR0FBRyxRQUFRLENBQUMsZUFBZSxDQUFDLDRCQUE0QixFQUFFLEVBQUMsU0FBUyxFQUFFLHFCQUFxQixDQUFDLFNBQVMsRUFBQyxDQUFDLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL2h5cGVyY2xpY2svbGliL1N1Z2dlc3Rpb25MaXN0RWxlbWVudC5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbnZhciB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZX0gPSByZXF1aXJlKCdhdG9tJyk7XG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC1mb3ItYXRvbScpO1xuXG4vKipcbiAqIFdlIG5lZWQgdG8gY3JlYXRlIHRoaXMgY3VzdG9tIEhUTUwgZWxlbWVudCBzbyB3ZSBjYW4gaG9vayBpbnRvIHRoZSB2aWV3XG4gKiByZWdpc3RyeS4gVGhlIG92ZXJsYXkgZGVjb3JhdGlvbiBvbmx5IHdvcmtzIHRocm91Z2ggdGhlIHZpZXcgcmVnaXN0cnkuXG4gKi9cbmNsYXNzIFN1Z2dlc3Rpb25MaXN0RWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgaW5pdGlhbGl6ZShtb2RlbCkge1xuICAgIGlmICghbW9kZWwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fbW9kZWwgPSBtb2RlbDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGF0dGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgUmVhY3QucmVuZGVyKDxTdWdnZXN0aW9uTGlzdCBzdWdnZXN0aW9uTGlzdD17dGhpcy5fbW9kZWx9IC8+LCB0aGlzKTtcbiAgfVxuXG4gIGRpc3Bvc2UoKSB7XG4gICAgUmVhY3QudW5tb3VudENvbXBvbmVudEF0Tm9kZSh0aGlzKTtcbiAgICBpZiAodGhpcy5wYXJlbnROb2RlKSB7XG4gICAgICB0aGlzLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcyk7XG4gICAgfVxuICB9XG59XG5cbnZhciBTdWdnZXN0aW9uTGlzdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgX3N1YnNjcmlwdGlvbnM6IHVuZGVmaW5lZCxcblxuICBwcm9wVHlwZXM6IHtcbiAgICBzdWdnZXN0aW9uTGlzdDogUmVhY3QuUHJvcFR5cGVzLm9iamVjdCxcbiAgfSxcblxuICBnZXRJbml0aWFsU3RhdGUoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNlbGVjdGVkSW5kZXg6IDAsXG4gICAgICBpdGVtczogW10sXG4gICAgfTtcbiAgfSxcblxuICBjb21wb25lbnRXaWxsTW91bnQoKSB7XG4gICAgdGhpcy5faXRlbXMgPSB0aGlzLnByb3BzLnN1Z2dlc3Rpb25MaXN0LmdldFN1Z2dlc3Rpb24oKS5jYWxsYmFjaztcbiAgICB0aGlzLl90ZXh0RWRpdG9yID0gdGhpcy5wcm9wcy5zdWdnZXN0aW9uTGlzdC5nZXRUZXh0RWRpdG9yKCk7XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG5cbiAgICB2YXIgdGV4dEVkaXRvclZpZXcgPSBhdG9tLnZpZXdzLmdldFZpZXcodGhpcy5fdGV4dEVkaXRvcik7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICAgIGF0b20uY29tbWFuZHMuYWRkKHRleHRFZGl0b3JWaWV3LCB7XG4gICAgICAgICAgJ2NvcmU6bW92ZS11cCc6IHRoaXMuX21vdmVTZWxlY3Rpb25VcCxcbiAgICAgICAgICAnY29yZTptb3ZlLWRvd24nOiB0aGlzLl9tb3ZlU2VsZWN0aW9uRG93bixcbiAgICAgICAgICAnY29yZTptb3ZlLXRvLXRvcCc6IHRoaXMuX21vdmVTZWxlY3Rpb25Ub1RvcCxcbiAgICAgICAgICAnY29yZTptb3ZlLXRvLWJvdHRvbSc6IHRoaXMuX21vdmVTZWxlY3Rpb25Ub0JvdHRvbSxcbiAgICAgICAgICAnY29yZTpjYW5jZWwnOiB0aGlzLl9jbG9zZSxcbiAgICAgICAgICAnZWRpdG9yOm5ld2xpbmUnOiB0aGlzLl9jb25maXJtLFxuICAgICAgICB9KSk7XG5cbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmFkZCh0aGlzLl90ZXh0RWRpdG9yLm9uRGlkQ2hhbmdlKHRoaXMuX2Nsb3NlKSk7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5fdGV4dEVkaXRvci5vbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uKHRoaXMuX2Nsb3NlKSk7XG5cbiAgICAvLyBQcmV2ZW50IHNjcm9sbGluZyB0aGUgZWRpdG9yIHdoZW4gc2Nyb2xsaW5nIHRoZSBzdWdnZXN0aW9uIGxpc3QuXG4gICAgdmFyIHN0b3BQcm9wYWdhdGlvbiA9IChldmVudCkgPT4gZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzWydzY3JvbGxlciddKS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXdoZWVsJywgc3RvcFByb3BhZ2F0aW9uKTtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmFkZChuZXcgRGlzcG9zYWJsZSgoKSA9PiB7XG4gICAgICBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnNbJ3Njcm9sbGVyJ10pLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNld2hlZWwnLCBzdG9wUHJvcGFnYXRpb24pO1xuICAgIH0pKTtcblxuICAgIHZhciBrZXlkb3duID0gKGV2ZW50KSA9PiB7XG4gICAgICAvLyBJZiB0aGUgdXNlciBwcmVzc2VzIHRoZSBlbnRlciBrZXksIGNvbmZpcm0gdGhlIHNlbGVjdGlvbi5cbiAgICAgIGlmIChldmVudC5rZXlDb2RlID09PSAxMykge1xuICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgdGhpcy5fY29uZmlybSgpO1xuICAgICAgfVxuICAgIH1cbiAgICB0ZXh0RWRpdG9yVmlldy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywga2V5ZG93bik7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQobmV3IERpc3Bvc2FibGUoKCkgPT4ge1xuICAgICAgdGV4dEVkaXRvclZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGtleWRvd24pO1xuICAgIH0pKTtcbiAgfSxcblxuICByZW5kZXIoKSB7XG4gICAgdmFyIGl0ZW1Db21wb25lbnRzID0gdGhpcy5faXRlbXMubWFwKChpdGVtLCBpbmRleCkgPT4ge1xuICAgICAgdmFyIGNsYXNzTmFtZSA9ICdoeXBlcmNsaWNrLXJlc3VsdC1pdGVtJztcbiAgICAgIGlmIChpbmRleCA9PT0gdGhpcy5zdGF0ZS5zZWxlY3RlZEluZGV4KSB7XG4gICAgICAgIGNsYXNzTmFtZSArPSAnIHNlbGVjdGVkJztcbiAgICAgIH1cbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxsaSBjbGFzc05hbWU9e2NsYXNzTmFtZX1cbiAgICAgICAgICAgIGtleT17aW5kZXh9XG4gICAgICAgICAgICBvbk1vdXNlRG93bj17dGhpcy5fY29uZmlybX1cbiAgICAgICAgICAgIG9uTW91c2VFbnRlcj17dGhpcy5fc2V0U2VsZWN0ZWRJbmRleC5iaW5kKHRoaXMsIGluZGV4KX0+XG4gICAgICAgICAge2l0ZW0udGl0bGV9XG4gICAgICAgIDwvbGk+XG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdwb3BvdmVyLWxpc3Qgc2VsZWN0LWxpc3QgaHlwZXJjbGljay1zdWdnZXN0aW9uLWxpc3Qtc2Nyb2xsZXInIHJlZj0nc2Nyb2xsZXInPlxuICAgICAgICA8b2wgY2xhc3NOYW1lPSdsaXN0LWdyb3VwJyByZWY9J3NlbGVjdGlvbkxpc3QnPlxuICAgICAgICAgIHtpdGVtQ29tcG9uZW50c31cbiAgICAgICAgPC9vbD5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkVXBkYXRlKHByZXZQcm9wczogbWl4ZWQsIHByZXZTdGF0ZTogbWl4ZWQpIHtcbiAgICBpZiAocHJldlN0YXRlLnNlbGVjdGVkSW5kZXggIT09IHRoaXMuc3RhdGUuc2VsZWN0ZWRJbmRleCkge1xuICAgICAgdGhpcy5fdXBkYXRlU2Nyb2xsUG9zaXRpb24oKTtcbiAgICB9XG4gIH0sXG5cbiAgY29tcG9uZW50V2lsbFVubW91bnQoKSB7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5kaXNwb3NlKCk7XG4gIH0sXG5cbiAgX2NvbmZpcm0oKSB7XG4gICAgdGhpcy5faXRlbXNbdGhpcy5zdGF0ZS5zZWxlY3RlZEluZGV4XS5jYWxsYmFjaygpO1xuICAgIHRoaXMuX2Nsb3NlKCk7XG4gIH0sXG5cbiAgX2Nsb3NlKCkge1xuICAgIHRoaXMucHJvcHMuc3VnZ2VzdGlvbkxpc3QuaGlkZSgpO1xuICB9LFxuXG4gIF9zZXRTZWxlY3RlZEluZGV4KGluZGV4OiBudW1iZXIpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIHNlbGVjdGVkSW5kZXg6IGluZGV4LFxuICAgIH0pO1xuICB9LFxuXG4gIF9tb3ZlU2VsZWN0aW9uRG93bihldmVudCkge1xuICAgIGlmICh0aGlzLnN0YXRlLnNlbGVjdGVkSW5kZXggPCB0aGlzLl9pdGVtcy5sZW5ndGggLSAxKSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtzZWxlY3RlZEluZGV4OiB0aGlzLnN0YXRlLnNlbGVjdGVkSW5kZXggKyAxfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX21vdmVTZWxlY3Rpb25Ub1RvcCgpO1xuICAgIH1cbiAgICBpZiAoZXZlbnQpIHtcbiAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgIH1cbiAgfSxcblxuICBfbW92ZVNlbGVjdGlvblVwKGV2ZW50KSB7XG4gICAgaWYgKHRoaXMuc3RhdGUuc2VsZWN0ZWRJbmRleCA+IDApIHtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe3NlbGVjdGVkSW5kZXg6IHRoaXMuc3RhdGUuc2VsZWN0ZWRJbmRleCAtIDF9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fbW92ZVNlbGVjdGlvblRvQm90dG9tKCk7XG4gICAgfVxuICAgIGlmIChldmVudCkge1xuICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgfVxuICB9LFxuXG4gIF9tb3ZlU2VsZWN0aW9uVG9Cb3R0b20oZXZlbnQpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtzZWxlY3RlZEluZGV4OiBNYXRoLm1heCh0aGlzLl9pdGVtcy5sZW5ndGggLSAxLCAwKX0pO1xuICAgIGlmIChldmVudCkge1xuICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgfVxuICB9LFxuXG4gIF9tb3ZlU2VsZWN0aW9uVG9Ub3AoZXZlbnQpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtzZWxlY3RlZEluZGV4OiAwfSk7XG4gICAgaWYgKGV2ZW50KSB7XG4gICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICB9XG4gIH0sXG5cbiAgX3VwZGF0ZVNjcm9sbFBvc2l0aW9uKCkge1xuICAgIHZhciBsaXN0Tm9kZSA9IFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmc1snc2VsZWN0aW9uTGlzdCddKTtcbiAgICB2YXIgc2VsZWN0ZWROb2RlID0gbGlzdE5vZGUuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnc2VsZWN0ZWQnKVswXTtcbiAgICBzZWxlY3RlZE5vZGUuc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZChmYWxzZSk7XG4gIH0sXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdWdnZXN0aW9uTGlzdEVsZW1lbnQgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoJ2h5cGVyY2xpY2stc3VnZ2VzdGlvbi1saXN0Jywge3Byb3RvdHlwZTogU3VnZ2VzdGlvbkxpc3RFbGVtZW50LnByb3RvdHlwZX0pO1xuIl19