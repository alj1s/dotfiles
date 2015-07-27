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

var React = require('react-for-atom');

var PanelComponent = require('./PanelComponent');

/**
 * Instantiating this class adds it to the UI (even if it's not visible).
 * It currently does this with `atom.workspace.addLeftPanel()` but should
 * support different sides in the future.
 */

var PanelController = (function () {
  function PanelController(childElement, props, state) {
    _classCallCheck(this, PanelController);

    this._hostEl = document.createElement('div');
    // Fill the entire panel with this div so content can also use 100% to fill
    // up the entire panel.
    this._hostEl.style.height = '100%';

    var shouldBeVisible = false;
    var initialLength = null;
    if (state) {
      props.initialLength = state.resizableLength;
      shouldBeVisible = state.isVisible;
    }

    this._component = React.render(React.createElement(
      PanelComponent,
      props,
      childElement
    ), this._hostEl);
    this._panel = atom.workspace.addLeftPanel({ item: this._hostEl, visible: shouldBeVisible });
  }

  _createClass(PanelController, [{
    key: 'destroy',
    value: function destroy() {
      React.unmountComponentAtNode(this._hostEl);
      this._panel.destroy();
    }
  }, {
    key: 'toggle',
    value: function toggle() {
      this.setVisible(!this.isVisible());
    }
  }, {
    key: 'setVisible',
    value: function setVisible(shouldBeVisible) {
      if (shouldBeVisible) {
        this._panel.show();
        this._component.focus();
      } else {
        this._panel.hide();
      }
    }
  }, {
    key: 'isVisible',
    value: function isVisible() {
      return this._panel.isVisible();
    }
  }, {
    key: 'getChildComponent',
    value: function getChildComponent() {
      return this._component.getChildComponent();
    }
  }, {
    key: 'serialize',
    value: function serialize() {
      return {
        isVisible: this.isVisible(),
        resizableLength: this._component.getLength()
      };
    }
  }]);

  return PanelController;
})();

module.exports = PanelController;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtdHJlZS9ub2RlX21vZHVsZXMvbnVjbGlkZS1wYW5lbC9saWIvUGFuZWxDb250cm9sbGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7OztBQVdaLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDOztBQUV0QyxJQUFJLGNBQWMsR0FBRyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQzs7Ozs7Ozs7SUFZM0MsZUFBZTtBQUlSLFdBSlAsZUFBZSxDQUtqQixZQUEwQixFQUMxQixLQUFxQixFQUNyQixLQUE0QixFQUM1QjswQkFSRSxlQUFlOztBQVNqQixRQUFJLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7OztBQUc3QyxRQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDOztBQUVuQyxRQUFJLGVBQWUsR0FBRyxLQUFLLENBQUM7QUFDNUIsUUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDO0FBQ3pCLFFBQUksS0FBSyxFQUFFO0FBQ1QsV0FBSyxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUMsZUFBZSxDQUFDO0FBQzVDLHFCQUFlLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQztLQUNuQzs7QUFFRCxRQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQzFCO0FBQUMsb0JBQWM7TUFBSyxLQUFLO01BQUcsWUFBWTtLQUFrQixFQUMxRCxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDbEIsUUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxFQUFDLElBQUksRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxlQUFlLEVBQUMsQ0FBQyxDQUFDO0dBQzNGOztlQXpCRyxlQUFlOztXQTJCWixtQkFBUztBQUNkLFdBQUssQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDM0MsVUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztLQUN2Qjs7O1dBRUssa0JBQVM7QUFDYixVQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7S0FDcEM7OztXQUVTLG9CQUFDLGVBQXdCLEVBQVE7QUFDekMsVUFBSSxlQUFlLEVBQUU7QUFDbkIsWUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNuQixZQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDO09BQ3pCLE1BQU07QUFDTCxZQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO09BQ3BCO0tBQ0Y7OztXQUVRLHFCQUFZO0FBQ25CLGFBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztLQUNoQzs7O1dBRWdCLDZCQUFtQjtBQUNsQyxhQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztLQUM1Qzs7O1dBRVEscUJBQXlCO0FBQ2hDLGFBQU87QUFDTCxpQkFBUyxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUU7QUFDM0IsdUJBQWUsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRTtPQUM3QyxDQUFDO0tBQ0g7OztTQTFERyxlQUFlOzs7QUE2RHJCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsZUFBZSxDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtdHJlZS9ub2RlX21vZHVsZXMvbnVjbGlkZS1wYW5lbC9saWIvUGFuZWxDb250cm9sbGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QtZm9yLWF0b20nKTtcblxudmFyIFBhbmVsQ29tcG9uZW50ID0gcmVxdWlyZSgnLi9QYW5lbENvbXBvbmVudCcpO1xuXG50eXBlIFBhbmVsQ29udHJvbGxlclN0YXRlID0ge1xuICBpc1Zpc2libGU6IGJvb2xlYW47XG4gIHJlc2l6YWJsZUxlbmd0aDogbnVtYmVyO1xufTtcblxuLyoqXG4gKiBJbnN0YW50aWF0aW5nIHRoaXMgY2xhc3MgYWRkcyBpdCB0byB0aGUgVUkgKGV2ZW4gaWYgaXQncyBub3QgdmlzaWJsZSkuXG4gKiBJdCBjdXJyZW50bHkgZG9lcyB0aGlzIHdpdGggYGF0b20ud29ya3NwYWNlLmFkZExlZnRQYW5lbCgpYCBidXQgc2hvdWxkXG4gKiBzdXBwb3J0IGRpZmZlcmVudCBzaWRlcyBpbiB0aGUgZnV0dXJlLlxuICovXG5jbGFzcyBQYW5lbENvbnRyb2xsZXIge1xuICBfaG9zdEVsOiBIVE1MRWxlbWVudDtcbiAgX3BhbmVsOiBhdG9tJFBhbmVsO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGNoaWxkRWxlbWVudDogUmVhY3RFbGVtZW50LFxuICAgIHByb3BzOiB7ZG9jazogc3RyaW5nfSxcbiAgICBzdGF0ZTogP1BhbmVsQ29udHJvbGxlclN0YXRlXG4gICkge1xuICAgIHRoaXMuX2hvc3RFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIC8vIEZpbGwgdGhlIGVudGlyZSBwYW5lbCB3aXRoIHRoaXMgZGl2IHNvIGNvbnRlbnQgY2FuIGFsc28gdXNlIDEwMCUgdG8gZmlsbFxuICAgIC8vIHVwIHRoZSBlbnRpcmUgcGFuZWwuXG4gICAgdGhpcy5faG9zdEVsLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcblxuICAgIHZhciBzaG91bGRCZVZpc2libGUgPSBmYWxzZTtcbiAgICB2YXIgaW5pdGlhbExlbmd0aCA9IG51bGw7XG4gICAgaWYgKHN0YXRlKSB7XG4gICAgICBwcm9wcy5pbml0aWFsTGVuZ3RoID0gc3RhdGUucmVzaXphYmxlTGVuZ3RoO1xuICAgICAgc2hvdWxkQmVWaXNpYmxlID0gc3RhdGUuaXNWaXNpYmxlO1xuICAgIH1cblxuICAgIHRoaXMuX2NvbXBvbmVudCA9IFJlYWN0LnJlbmRlcihcbiAgICAgICAgPFBhbmVsQ29tcG9uZW50IHsuLi5wcm9wc30+e2NoaWxkRWxlbWVudH08L1BhbmVsQ29tcG9uZW50PixcbiAgICAgICAgdGhpcy5faG9zdEVsKTtcbiAgICB0aGlzLl9wYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZExlZnRQYW5lbCh7aXRlbTogdGhpcy5faG9zdEVsLCB2aXNpYmxlOiBzaG91bGRCZVZpc2libGV9KTtcbiAgfVxuXG4gIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgUmVhY3QudW5tb3VudENvbXBvbmVudEF0Tm9kZSh0aGlzLl9ob3N0RWwpO1xuICAgIHRoaXMuX3BhbmVsLmRlc3Ryb3koKTtcbiAgfVxuXG4gIHRvZ2dsZSgpOiB2b2lkIHtcbiAgICB0aGlzLnNldFZpc2libGUoIXRoaXMuaXNWaXNpYmxlKCkpO1xuICB9XG5cbiAgc2V0VmlzaWJsZShzaG91bGRCZVZpc2libGU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgICBpZiAoc2hvdWxkQmVWaXNpYmxlKSB7XG4gICAgICB0aGlzLl9wYW5lbC5zaG93KCk7XG4gICAgICB0aGlzLl9jb21wb25lbnQuZm9jdXMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fcGFuZWwuaGlkZSgpO1xuICAgIH1cbiAgfVxuXG4gIGlzVmlzaWJsZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5fcGFuZWwuaXNWaXNpYmxlKCk7XG4gIH1cblxuICBnZXRDaGlsZENvbXBvbmVudCgpOiBSZWFjdENvbXBvbmVudCB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbXBvbmVudC5nZXRDaGlsZENvbXBvbmVudCgpO1xuICB9XG5cbiAgc2VyaWFsaXplKCk6IFBhbmVsQ29udHJvbGxlclN0YXRlIHtcbiAgICByZXR1cm4ge1xuICAgICAgaXNWaXNpYmxlOiB0aGlzLmlzVmlzaWJsZSgpLFxuICAgICAgcmVzaXphYmxlTGVuZ3RoOiB0aGlzLl9jb21wb25lbnQuZ2V0TGVuZ3RoKCksXG4gICAgfTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBhbmVsQ29udHJvbGxlcjtcbiJdfQ==