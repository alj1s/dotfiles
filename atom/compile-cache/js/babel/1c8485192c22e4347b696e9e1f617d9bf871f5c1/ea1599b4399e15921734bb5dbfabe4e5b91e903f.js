'use babel';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

/**
 * Calls the given functions and returns the first non-null return value.
 */

var findTruthyReturnValue = _asyncToGenerator(function* (fns) {
  for (var i = 0; i < fns.length; i++) {
    var fn = fns[i];
    var result = typeof fn === 'function' ? (yield fn()) : null;
    if (result) {
      return result;
    }
  }
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var SuggestionList = require('./SuggestionList');
var SuggestionListElement = require('./SuggestionListElement');
var getWordTextAndRange = require('./get-word-text-and-range');

/**
 * Construct this object to enable Hyperclick in the Atom workspace.
 * Call `dispose` to disable the feature.
 */

var Hyperclick = (function () {
  function Hyperclick() {
    var _this = this;

    _classCallCheck(this, Hyperclick);

    this._consumedProviders = [];

    this._suggestionList = new SuggestionList();
    this._suggestionListViewSubscription = atom.views.addViewProvider(SuggestionList, function (model) {
      return new SuggestionListElement().initialize(model);
    });

    this._hyperclickForTextEditors = new Set();
    this._textEditorSubscription = atom.workspace.observeTextEditors(function (textEditor) {
      var HyperclickForTextEditor = require('./HyperclickForTextEditor');
      var hyperclickForTextEditor = new HyperclickForTextEditor(textEditor, _this);
      _this._hyperclickForTextEditors.add(hyperclickForTextEditor);

      textEditor.onDidDestroy(function () {
        hyperclickForTextEditor.dispose();
        _this._hyperclickForTextEditors['delete'](hyperclickForTextEditor);
      });
    });
  }

  _createClass(Hyperclick, [{
    key: 'dispose',
    value: function dispose() {
      this._consumedProviders = null;
      if (this._textEditorSubscription) {
        this._textEditorSubscription.dispose();
        this._textEditorSubscription = null;
      }
      this._hyperclickForTextEditors.forEach(function (hyperclick) {
        return hyperclick.dispose();
      });
      this._hyperclickForTextEditors.clear();
    }
  }, {
    key: 'consumeProvider',
    value: function consumeProvider(provider) {
      var _this2 = this;

      if (Array.isArray(provider)) {
        provider.forEach(function (singleProvider) {
          return _this2._consumeSingleProvider(singleProvider);
        });
      } else {
        this._consumeSingleProvider(provider);
      }
    }
  }, {
    key: '_consumeSingleProvider',
    value: function _consumeSingleProvider(provider) {
      var priority = provider.priority || 0;
      for (var i = 0, len = this._consumedProviders.length; i < len; i++) {
        var item = this._consumedProviders[i];
        if (provider === item) {
          return;
        }

        var itemPriority = item.priority || 0;
        if (priority > itemPriority) {
          this._consumedProviders.splice(i, 0, provider);
          return;
        }
      }

      // If we made it all the way through the loop, provider must be lower
      // priority than all of the existing providers, so add it to the end.
      this._consumedProviders.push(provider);
    }
  }, {
    key: 'getSuggestion',

    /**
     * Returns the first suggestion from the consumed providers.
     */
    value: function getSuggestion(textEditor, position) {
      return findTruthyReturnValue(this._consumedProviders.map(function (provider) {
        if (provider.getSuggestion) {
          return function () {
            return provider.getSuggestion(textEditor, position);
          };
        } else if (provider.getSuggestionForWord) {
          return function () {
            var _getWordTextAndRange = getWordTextAndRange(textEditor, position, provider.wordRegExp);

            var text = _getWordTextAndRange.text;
            var range = _getWordTextAndRange.range;

            return provider.getSuggestionForWord(textEditor, text, range);
          };
        }

        throw new Error('Hyperclick must have either `getSuggestion` or `getSuggestionForWord`');
      }));
    }
  }, {
    key: 'showSuggestionList',
    value: function showSuggestionList(textEditor, suggestion) {
      this._suggestionList.show(textEditor, suggestion);
    }
  }]);

  return Hyperclick;
})();

module.exports = Hyperclick;

// Use this to provide a suggestion for single-word matches.
// Optionally set `wordRegExp` to adjust word-matching.

// Use this to provide a suggestion if it can have non-contiguous ranges.
// A primary use-case for this is Objective-C methods.

// The higher this is, the more precedence the provider gets. Defaults to 0.

// The range(s) to underline to provide as a visual cue for clicking.

// The function to call when the underlined text is clicked.
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9oeXBlcmNsaWNrL2xpYi9IeXBlcmNsaWNrLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7SUF5Q0cscUJBQXFCLHFCQUFwQyxXQUFxQyxHQUEwQyxFQUFnQjtBQUM3RixPQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUNuQyxRQUFJLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEIsUUFBSSxNQUFNLEdBQUcsT0FBTyxFQUFFLEtBQUssVUFBVSxJQUFHLE1BQU0sRUFBRSxFQUFFLENBQUEsR0FBRyxJQUFJLENBQUM7QUFDMUQsUUFBSSxNQUFNLEVBQUU7QUFDVixhQUFPLE1BQU0sQ0FBQztLQUNmO0dBQ0Y7Q0FDRjs7Ozs7Ozs7Ozs7Ozs7OztBQXRDRCxJQUFJLGNBQWMsR0FBRyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztBQUNqRCxJQUFJLHFCQUFxQixHQUFHLE9BQU8sQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0FBQy9ELElBQUksbUJBQW1CLEdBQUcsT0FBTyxDQUFDLDJCQUEyQixDQUFDLENBQUM7Ozs7Ozs7SUEwQ3pELFVBQVU7QUFDSCxXQURQLFVBQVUsR0FDQTs7OzBCQURWLFVBQVU7O0FBRVosUUFBSSxDQUFDLGtCQUFrQixHQUFHLEVBQUUsQ0FBQzs7QUFFN0IsUUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLGNBQWMsRUFBRSxDQUFDO0FBQzVDLFFBQUksQ0FBQywrQkFBK0IsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FDN0QsY0FBYyxFQUNkLFVBQUEsS0FBSzthQUFJLElBQUkscUJBQXFCLEVBQUUsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO0tBQUEsQ0FBQyxDQUFDOztBQUU1RCxRQUFJLENBQUMseUJBQXlC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N0UsSUFBSSx3QkFBSixJQUFJO2dCQUFFLEtBQUssd0JBQUwsS0FBSzs7QUFDaEIsbUJBQU8sUUFBUSxDQUFDLG9CQUFvQixDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7V0FDL0QsQ0FBQztTQUNIOztBQUVELGNBQU0sSUFBSSxLQUFLLENBQUMsdUVBQXVFLENBQUMsQ0FBQTtPQUN6RixDQUFDLENBQUMsQ0FBQztLQUNMOzs7V0FFaUIsNEJBQUMsVUFBc0IsRUFBRSxVQUFnQyxFQUFRO0FBQ2pGLFVBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FBQztLQUNuRDs7O1NBaEZHLFVBQVU7OztBQW1GaEIsTUFBTSxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL2h5cGVyY2xpY2svbGliL0h5cGVyY2xpY2suanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIgU3VnZ2VzdGlvbkxpc3QgPSByZXF1aXJlKCcuL1N1Z2dlc3Rpb25MaXN0Jyk7XG52YXIgU3VnZ2VzdGlvbkxpc3RFbGVtZW50ID0gcmVxdWlyZSgnLi9TdWdnZXN0aW9uTGlzdEVsZW1lbnQnKTtcbnZhciBnZXRXb3JkVGV4dEFuZFJhbmdlID0gcmVxdWlyZSgnLi9nZXQtd29yZC10ZXh0LWFuZC1yYW5nZScpO1xuXG50eXBlIEh5cGVyY2xpY2tQcm92aWRlciA9IHtcbiAgLy8gVXNlIHRoaXMgdG8gcHJvdmlkZSBhIHN1Z2dlc3Rpb24gZm9yIHNpbmdsZS13b3JkIG1hdGNoZXMuXG4gIC8vIE9wdGlvbmFsbHkgc2V0IGB3b3JkUmVnRXhwYCB0byBhZGp1c3Qgd29yZC1tYXRjaGluZy5cbiAgZ2V0U3VnZ2VzdGlvbkZvcldvcmQ/OiAodGV4dEVkaXRvcjogVGV4dEVkaXRvciwgdGV4dDogc3RyaW5nLCByYW5nZTogUmFuZ2UpID0+XG4gICAgICA/UHJvbWlzZTxIeXBlcmNsaWNrU3VnZ2VzdGlvbj47XG4gIHdvcmRSZWdFeHA/OiBSZWdFeHA7XG5cbiAgLy8gVXNlIHRoaXMgdG8gcHJvdmlkZSBhIHN1Z2dlc3Rpb24gaWYgaXQgY2FuIGhhdmUgbm9uLWNvbnRpZ3VvdXMgcmFuZ2VzLlxuICAvLyBBIHByaW1hcnkgdXNlLWNhc2UgZm9yIHRoaXMgaXMgT2JqZWN0aXZlLUMgbWV0aG9kcy5cbiAgZ2V0U3VnZ2VzdGlvbj86ICh0ZXh0RWRpdG9yOiBUZXh0RWRpdG9yLCBwb3NpdGlvbjogYXRvbSRQb2ludCkgPT4gP1Byb21pc2U8SHlwZXJjbGlja1N1Z2dlc3Rpb24+O1xuXG4gIC8vIFRoZSBoaWdoZXIgdGhpcyBpcywgdGhlIG1vcmUgcHJlY2VkZW5jZSB0aGUgcHJvdmlkZXIgZ2V0cy4gRGVmYXVsdHMgdG8gMC5cbiAgcHJpb3JpdHk/OiBudW1iZXI7XG59O1xuXG50eXBlIEh5cGVyY2xpY2tTdWdnZXN0aW9uID0ge1xuICAvLyBUaGUgcmFuZ2UocykgdG8gdW5kZXJsaW5lIHRvIHByb3ZpZGUgYXMgYSB2aXN1YWwgY3VlIGZvciBjbGlja2luZy5cbiAgcmFuZ2U6ID9SYW5nZSB8ID9BcnJheTxSYW5nZT47XG5cbiAgLy8gVGhlIGZ1bmN0aW9uIHRvIGNhbGwgd2hlbiB0aGUgdW5kZXJsaW5lZCB0ZXh0IGlzIGNsaWNrZWQuXG4gIGNhbGxiYWNrOiAoKSA9PiB2b2lkIHwgQXJyYXk8e3RpdGxlOiBzdHJpbmc7IGNhbGxiYWNrOiAoKSA9PiB7fX0+O1xufTtcblxuLyoqXG4gKiBDYWxscyB0aGUgZ2l2ZW4gZnVuY3Rpb25zIGFuZCByZXR1cm5zIHRoZSBmaXJzdCBub24tbnVsbCByZXR1cm4gdmFsdWUuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGZpbmRUcnV0aHlSZXR1cm5WYWx1ZShmbnM6IEFycmF5PHVuZGVmaW5lZCB8ICgpID0+IFByb21pc2U8YW55Pj4pOiBQcm9taXNlPGFueT4ge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGZucy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBmbiA9IGZuc1tpXTtcbiAgICB2YXIgcmVzdWx0ID0gdHlwZW9mIGZuID09PSAnZnVuY3Rpb24nID8gYXdhaXQgZm4oKSA6IG51bGw7XG4gICAgaWYgKHJlc3VsdCkge1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDb25zdHJ1Y3QgdGhpcyBvYmplY3QgdG8gZW5hYmxlIEh5cGVyY2xpY2sgaW4gdGhlIEF0b20gd29ya3NwYWNlLlxuICogQ2FsbCBgZGlzcG9zZWAgdG8gZGlzYWJsZSB0aGUgZmVhdHVyZS5cbiAqL1xuY2xhc3MgSHlwZXJjbGljayB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX2NvbnN1bWVkUHJvdmlkZXJzID0gW107XG5cbiAgICB0aGlzLl9zdWdnZXN0aW9uTGlzdCA9IG5ldyBTdWdnZXN0aW9uTGlzdCgpO1xuICAgIHRoaXMuX3N1Z2dlc3Rpb25MaXN0Vmlld1N1YnNjcmlwdGlvbiA9IGF0b20udmlld3MuYWRkVmlld1Byb3ZpZGVyKFxuICAgICAgICBTdWdnZXN0aW9uTGlzdCxcbiAgICAgICAgbW9kZWwgPT4gbmV3IFN1Z2dlc3Rpb25MaXN0RWxlbWVudCgpLmluaXRpYWxpemUobW9kZWwpKTtcblxuICAgIHRoaXMuX2h5cGVyY2xpY2tGb3JUZXh0RWRpdG9ycyA9IG5ldyBTZXQoKTtcbiAgICB0aGlzLl90ZXh0RWRpdG9yU3Vic2NyaXB0aW9uID0gYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVRleHRFZGl0b3JzKHRleHRFZGl0b3IgPT4ge1xuICAgICAgdmFyIEh5cGVyY2xpY2tGb3JUZXh0RWRpdG9yID0gcmVxdWlyZSgnLi9IeXBlcmNsaWNrRm9yVGV4dEVkaXRvcicpO1xuICAgICAgdmFyIGh5cGVyY2xpY2tGb3JUZXh0RWRpdG9yID0gbmV3IEh5cGVyY2xpY2tGb3JUZXh0RWRpdG9yKHRleHRFZGl0b3IsIHRoaXMpO1xuICAgICAgdGhpcy5faHlwZXJjbGlja0ZvclRleHRFZGl0b3JzLmFkZChoeXBlcmNsaWNrRm9yVGV4dEVkaXRvcik7XG5cbiAgICAgIHRleHRFZGl0b3Iub25EaWREZXN0cm95KCgpID0+IHtcbiAgICAgICAgaHlwZXJjbGlja0ZvclRleHRFZGl0b3IuZGlzcG9zZSgpO1xuICAgICAgICB0aGlzLl9oeXBlcmNsaWNrRm9yVGV4dEVkaXRvcnMuZGVsZXRlKGh5cGVyY2xpY2tGb3JUZXh0RWRpdG9yKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgZGlzcG9zZSgpIHtcbiAgICB0aGlzLl9jb25zdW1lZFByb3ZpZGVycyA9IG51bGw7XG4gICAgaWYgKHRoaXMuX3RleHRFZGl0b3JTdWJzY3JpcHRpb24pIHtcbiAgICAgIHRoaXMuX3RleHRFZGl0b3JTdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xuICAgICAgdGhpcy5fdGV4dEVkaXRvclN1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgfVxuICAgIHRoaXMuX2h5cGVyY2xpY2tGb3JUZXh0RWRpdG9ycy5mb3JFYWNoKGh5cGVyY2xpY2sgPT4gaHlwZXJjbGljay5kaXNwb3NlKCkpO1xuICAgIHRoaXMuX2h5cGVyY2xpY2tGb3JUZXh0RWRpdG9ycy5jbGVhcigpO1xuICB9XG5cbiAgY29uc3VtZVByb3ZpZGVyKHByb3ZpZGVyOiBIeXBlcmNsaWNrUHJvdmlkZXIgfCBBcnJheTxIeXBlcmNsaWNrUHJvdmlkZXI+KTogdm9pZCB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkocHJvdmlkZXIpKSB7XG4gICAgICBwcm92aWRlci5mb3JFYWNoKHNpbmdsZVByb3ZpZGVyID0+IHRoaXMuX2NvbnN1bWVTaW5nbGVQcm92aWRlcihzaW5nbGVQcm92aWRlcikpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9jb25zdW1lU2luZ2xlUHJvdmlkZXIocHJvdmlkZXIpO1xuICAgIH1cbiAgfVxuXG4gIF9jb25zdW1lU2luZ2xlUHJvdmlkZXIocHJvdmlkZXI6IEh5cGVyY2xpY2tQcm92aWRlcik6IHZvaWQge1xuICAgIHZhciBwcmlvcml0eSA9IHByb3ZpZGVyLnByaW9yaXR5IHx8IDA7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRoaXMuX2NvbnN1bWVkUHJvdmlkZXJzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICB2YXIgaXRlbSA9IHRoaXMuX2NvbnN1bWVkUHJvdmlkZXJzW2ldO1xuICAgICAgaWYgKHByb3ZpZGVyID09PSBpdGVtKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdmFyIGl0ZW1Qcmlvcml0eSA9IGl0ZW0ucHJpb3JpdHkgfHwgMDtcbiAgICAgIGlmIChwcmlvcml0eSA+IGl0ZW1Qcmlvcml0eSkge1xuICAgICAgICB0aGlzLl9jb25zdW1lZFByb3ZpZGVycy5zcGxpY2UoaSwgMCwgcHJvdmlkZXIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSWYgd2UgbWFkZSBpdCBhbGwgdGhlIHdheSB0aHJvdWdoIHRoZSBsb29wLCBwcm92aWRlciBtdXN0IGJlIGxvd2VyXG4gICAgLy8gcHJpb3JpdHkgdGhhbiBhbGwgb2YgdGhlIGV4aXN0aW5nIHByb3ZpZGVycywgc28gYWRkIGl0IHRvIHRoZSBlbmQuXG4gICAgdGhpcy5fY29uc3VtZWRQcm92aWRlcnMucHVzaChwcm92aWRlcik7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZmlyc3Qgc3VnZ2VzdGlvbiBmcm9tIHRoZSBjb25zdW1lZCBwcm92aWRlcnMuXG4gICAqL1xuICBnZXRTdWdnZXN0aW9uKHRleHRFZGl0b3I6IFRleHRFZGl0b3IsIHBvc2l0aW9uOiBQb2ludCk6IFByb21pc2Uge1xuICAgIHJldHVybiBmaW5kVHJ1dGh5UmV0dXJuVmFsdWUodGhpcy5fY29uc3VtZWRQcm92aWRlcnMubWFwKHByb3ZpZGVyID0+IHtcbiAgICAgIGlmIChwcm92aWRlci5nZXRTdWdnZXN0aW9uKSB7XG4gICAgICAgIHJldHVybiAoKSA9PiBwcm92aWRlci5nZXRTdWdnZXN0aW9uKHRleHRFZGl0b3IsIHBvc2l0aW9uKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvdmlkZXIuZ2V0U3VnZ2VzdGlvbkZvcldvcmQpIHtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICB2YXIge3RleHQsIHJhbmdlfSA9IGdldFdvcmRUZXh0QW5kUmFuZ2UodGV4dEVkaXRvciwgcG9zaXRpb24sIHByb3ZpZGVyLndvcmRSZWdFeHApO1xuICAgICAgICAgIHJldHVybiBwcm92aWRlci5nZXRTdWdnZXN0aW9uRm9yV29yZCh0ZXh0RWRpdG9yLCB0ZXh0LCByYW5nZSk7XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIHRocm93IG5ldyBFcnJvcignSHlwZXJjbGljayBtdXN0IGhhdmUgZWl0aGVyIGBnZXRTdWdnZXN0aW9uYCBvciBgZ2V0U3VnZ2VzdGlvbkZvcldvcmRgJylcbiAgICB9KSk7XG4gIH1cblxuICBzaG93U3VnZ2VzdGlvbkxpc3QodGV4dEVkaXRvcjogVGV4dEVkaXRvciwgc3VnZ2VzdGlvbjogSHlwZXJjbGlja1N1Z2dlc3Rpb24pOiB2b2lkIHtcbiAgICB0aGlzLl9zdWdnZXN0aW9uTGlzdC5zaG93KHRleHRFZGl0b3IsIHN1Z2dlc3Rpb24pO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gSHlwZXJjbGljaztcbiJdfQ==