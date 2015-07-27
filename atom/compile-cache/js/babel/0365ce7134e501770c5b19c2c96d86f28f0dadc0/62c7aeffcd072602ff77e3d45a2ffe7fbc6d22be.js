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

var SuggestionList = (function () {
  function SuggestionList() {
    _classCallCheck(this, SuggestionList);
  }

  _createClass(SuggestionList, [{
    key: 'show',
    value: function show(textEditor, suggestion) {
      if (!textEditor || !suggestion) {
        return;
      }

      this._textEditor = textEditor;
      this._suggestion = suggestion;

      this.hide();

      var _ref = Array.isArray(suggestion.range) ? suggestion.range[0] : suggestion.range;

      var position = _ref.start;

      this._suggestionMarker = textEditor.markBufferPosition(position);
      if (this._suggestionMarker) {
        this._overlayDecoration = textEditor.decorateMarker(this._suggestionMarker, {
          type: 'overlay',
          item: this
        });
      }
    }
  }, {
    key: 'hide',
    value: function hide() {
      atom.views.getView(this).dispose();
      if (this._suggestionMarker) {
        this._suggestionMarker.destroy();
      } else if (this._overlayDecoration) {
        this._overlayDecoration.destroy();
      }
      this._suggestionMarker = undefined;
      this._overlayDecoration = undefined;
    }
  }, {
    key: 'getTextEditor',
    value: function getTextEditor() {
      return this._textEditor;
    }
  }, {
    key: 'getSuggestion',
    value: function getSuggestion() {
      return this._suggestion;
    }
  }]);

  return SuggestionList;
})();

module.exports = SuggestionList;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9oeXBlcmNsaWNrL2xpYi9TdWdnZXN0aW9uTGlzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7SUFXTixjQUFjO1dBQWQsY0FBYzswQkFBZCxjQUFjOzs7ZUFBZCxjQUFjOztXQUNkLGNBQUMsVUFBc0IsRUFBRSxVQUFnQyxFQUFRO0FBQ25FLFVBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxVQUFVLEVBQUU7QUFDOUIsZUFBTztPQUNSOztBQUVELFVBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDO0FBQzlCLFVBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDOztBQUU5QixVQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7O2lCQUVZLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLEtBQUs7O1VBQXBGLFFBQVEsUUFBZixLQUFLOztBQUNWLFVBQUksQ0FBQyxpQkFBaUIsR0FBRyxVQUFVLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDakUsVUFBSSxJQUFJLENBQUMsaUJBQWlCLEVBQUU7QUFDMUIsWUFBSSxDQUFDLGtCQUFrQixHQUFHLFVBQVUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFO0FBQzFFLGNBQUksRUFBRSxTQUFTO0FBQ2YsY0FBSSxFQUFFLElBQUk7U0FDWCxDQUFDLENBQUM7T0FDSjtLQUNGOzs7V0FFRyxnQkFBRztBQUNMLFVBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ25DLFVBQUksSUFBSSxDQUFDLGlCQUFpQixFQUFFO0FBQzFCLFlBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQztPQUNsQyxNQUFNLElBQUksSUFBSSxDQUFDLGtCQUFrQixFQUFFO0FBQ2xDLFlBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQztPQUNuQztBQUNELFVBQUksQ0FBQyxpQkFBaUIsR0FBRyxTQUFTLENBQUM7QUFDbkMsVUFBSSxDQUFDLGtCQUFrQixHQUFHLFNBQVMsQ0FBQztLQUNyQzs7O1dBRVkseUJBQWdCO0FBQzNCLGFBQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztLQUN6Qjs7O1dBRVkseUJBQTBCO0FBQ3JDLGFBQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztLQUN6Qjs7O1NBdENHLGNBQWM7OztBQXlDcEIsTUFBTSxDQUFDLE9BQU8sR0FBRyxjQUFjLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL2h5cGVyY2xpY2svbGliL1N1Z2dlc3Rpb25MaXN0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxuY2xhc3MgU3VnZ2VzdGlvbkxpc3Qge1xuICBzaG93KHRleHRFZGl0b3I6IFRleHRFZGl0b3IsIHN1Z2dlc3Rpb246IEh5cGVyY2xpY2tTdWdnZXN0aW9uKTogdm9pZCB7XG4gICAgaWYgKCF0ZXh0RWRpdG9yIHx8ICFzdWdnZXN0aW9uKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fdGV4dEVkaXRvciA9IHRleHRFZGl0b3I7XG4gICAgdGhpcy5fc3VnZ2VzdGlvbiA9IHN1Z2dlc3Rpb247XG5cbiAgICB0aGlzLmhpZGUoKTtcblxuICAgIHZhciB7c3RhcnQ6IHBvc2l0aW9ufSA9IEFycmF5LmlzQXJyYXkoc3VnZ2VzdGlvbi5yYW5nZSkgPyBzdWdnZXN0aW9uLnJhbmdlWzBdIDogc3VnZ2VzdGlvbi5yYW5nZTtcbiAgICB0aGlzLl9zdWdnZXN0aW9uTWFya2VyID0gdGV4dEVkaXRvci5tYXJrQnVmZmVyUG9zaXRpb24ocG9zaXRpb24pO1xuICAgIGlmICh0aGlzLl9zdWdnZXN0aW9uTWFya2VyKSB7XG4gICAgICB0aGlzLl9vdmVybGF5RGVjb3JhdGlvbiA9IHRleHRFZGl0b3IuZGVjb3JhdGVNYXJrZXIodGhpcy5fc3VnZ2VzdGlvbk1hcmtlciwge1xuICAgICAgICB0eXBlOiAnb3ZlcmxheScsXG4gICAgICAgIGl0ZW06IHRoaXMsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBoaWRlKCkge1xuICAgIGF0b20udmlld3MuZ2V0Vmlldyh0aGlzKS5kaXNwb3NlKCk7XG4gICAgaWYgKHRoaXMuX3N1Z2dlc3Rpb25NYXJrZXIpIHtcbiAgICAgIHRoaXMuX3N1Z2dlc3Rpb25NYXJrZXIuZGVzdHJveSgpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fb3ZlcmxheURlY29yYXRpb24pIHtcbiAgICAgIHRoaXMuX292ZXJsYXlEZWNvcmF0aW9uLmRlc3Ryb3koKTtcbiAgICB9XG4gICAgdGhpcy5fc3VnZ2VzdGlvbk1hcmtlciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9vdmVybGF5RGVjb3JhdGlvbiA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGdldFRleHRFZGl0b3IoKTogP1RleHRFZGl0b3Ige1xuICAgIHJldHVybiB0aGlzLl90ZXh0RWRpdG9yO1xuICB9XG5cbiAgZ2V0U3VnZ2VzdGlvbigpOiA/SHlwZXJjbGlja1N1Z2dlc3Rpb24ge1xuICAgIHJldHVybiB0aGlzLl9zdWdnZXN0aW9uO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU3VnZ2VzdGlvbkxpc3Q7XG4iXX0=