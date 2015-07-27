'use babel';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _require = require('atom');

var Point = _require.Point;
var Range = _require.Range;

var AutocompleteProvider = (function () {
  function AutocompleteProvider() {
    _classCallCheck(this, AutocompleteProvider);
  }

  _createClass(AutocompleteProvider, [{
    key: 'getAutocompleteSuggestions',
    value: _asyncToGenerator(function* (request) {
      var replacementPrefix = this.findPrefix(request.editor);
      if (!replacementPrefix) {
        return [];
      }

      var _require2 = require('./hack');

      var fetchCompletionsForEditor = _require2.fetchCompletionsForEditor;

      var completions = yield fetchCompletionsForEditor(request.editor, replacementPrefix);

      return completions.map(function (completion) {
        return {
          snippet: completion.matchSnippet,
          replacementPrefix: replacementPrefix,
          rightLabel: completion.matchType
        };
      });
    })
  }, {
    key: 'findPrefix',
    value: function findPrefix(editor) {
      var cursor = editor.getLastCursor();
      // We use custom wordRegex to adopt php variables starting with $.
      var currentRange = cursor.getCurrentWordBufferRange({ wordRegex: /(\$\w*)|\w+/ });
      // Current word might go beyond the cursor, so we cut it.
      var range = new Range(currentRange.start, new Point(cursor.getBufferRow(), cursor.getBufferColumn()));
      var prefix = editor.getTextInBufferRange(range).trim();
      // Prefix could just be $ or ends with string literal.
      if (prefix === '$' || !/[\W]$/.test(prefix)) {
        return prefix;
      } else {
        return '';
      }
    }
  }]);

  return AutocompleteProvider;
})();

module.exports = AutocompleteProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWhhY2svbGliL0F1dG9jb21wbGV0ZVByb3ZpZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7O2VBV1MsT0FBTyxDQUFDLE1BQU0sQ0FBQzs7SUFBL0IsS0FBSyxZQUFMLEtBQUs7SUFBRSxLQUFLLFlBQUwsS0FBSzs7SUFFWCxvQkFBb0I7V0FBcEIsb0JBQW9COzBCQUFwQixvQkFBb0I7OztlQUFwQixvQkFBb0I7OzZCQUVRLFdBQzVCLE9BQTBGLEVBQ3BDO0FBQ3hELFVBQUksaUJBQWlCLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDeEQsVUFBSSxDQUFDLGlCQUFpQixFQUFFO0FBQ3RCLGVBQU8sRUFBRSxDQUFDO09BQ1g7O3NCQUVpQyxPQUFPLENBQUMsUUFBUSxDQUFDOztVQUE5Qyx5QkFBeUIsYUFBekIseUJBQXlCOztBQUM5QixVQUFJLFdBQVcsR0FBRyxNQUFNLHlCQUF5QixDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsaUJBQWlCLENBQUMsQ0FBQzs7QUFFckYsYUFBTyxXQUFXLENBQUMsR0FBRyxDQUFDLFVBQUEsVUFBVSxFQUFJO0FBQ25DLGVBQU87QUFDTCxpQkFBTyxFQUFFLFVBQVUsQ0FBQyxZQUFZO0FBQ2hDLDJCQUFpQixFQUFqQixpQkFBaUI7QUFDakIsb0JBQVUsRUFBRSxVQUFVLENBQUMsU0FBUztTQUNqQyxDQUFDO09BQ0gsQ0FBQyxDQUFDO0tBQ0o7OztXQUVTLG9CQUFDLE1BQWtCLEVBQVU7QUFDckMsVUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDOztBQUVwQyxVQUFJLFlBQVksR0FBRyxNQUFNLENBQUMseUJBQXlCLENBQUMsRUFBQyxTQUFTLEVBQUMsYUFBYSxFQUFDLENBQUMsQ0FBQzs7QUFFL0UsVUFBSSxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQ2pCLFlBQVksQ0FBQyxLQUFLLEVBQ2xCLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsRUFBRSxNQUFNLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ2hFLFVBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQzs7QUFFdkQsVUFBSSxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUMzQyxlQUFPLE1BQU0sQ0FBQztPQUNmLE1BQU07QUFDTCxlQUFPLEVBQUUsQ0FBQztPQUNYO0tBQ0Y7OztTQXJDRyxvQkFBb0I7OztBQXdDMUIsTUFBTSxDQUFDLE9BQU8sR0FBRyxvQkFBb0IsQ0FBQyIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvbnVjbGlkZS1oYWNrL2xpYi9BdXRvY29tcGxldGVQcm92aWRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbnZhciB7UG9pbnQsIFJhbmdlfSA9IHJlcXVpcmUoJ2F0b20nKTtcblxuY2xhc3MgQXV0b2NvbXBsZXRlUHJvdmlkZXIge1xuXG4gIGFzeW5jIGdldEF1dG9jb21wbGV0ZVN1Z2dlc3Rpb25zKFxuICAgICAgcmVxdWVzdDoge2VkaXRvcjogVGV4dEVkaXRvcjsgYnVmZmVyUG9zaXRpb246IFBvaW50OyBzY29wZURlc2NyaXB0b3I6IGFueTsgcHJlZml4OiBzdHJpbmd9KTpcbiAgICAgIFByb21pc2U8QXJyYXk8e3NuaXBwZXQ6IHN0cmluZzsgcmlnaHRMYWJlbDogc3RyaW5nfT4+IHtcbiAgICB2YXIgcmVwbGFjZW1lbnRQcmVmaXggPSB0aGlzLmZpbmRQcmVmaXgocmVxdWVzdC5lZGl0b3IpO1xuICAgIGlmICghcmVwbGFjZW1lbnRQcmVmaXgpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICB2YXIge2ZldGNoQ29tcGxldGlvbnNGb3JFZGl0b3J9ID0gcmVxdWlyZSgnLi9oYWNrJyk7XG4gICAgdmFyIGNvbXBsZXRpb25zID0gYXdhaXQgZmV0Y2hDb21wbGV0aW9uc0ZvckVkaXRvcihyZXF1ZXN0LmVkaXRvciwgcmVwbGFjZW1lbnRQcmVmaXgpO1xuXG4gICAgcmV0dXJuIGNvbXBsZXRpb25zLm1hcChjb21wbGV0aW9uID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHNuaXBwZXQ6IGNvbXBsZXRpb24ubWF0Y2hTbmlwcGV0LFxuICAgICAgICByZXBsYWNlbWVudFByZWZpeCxcbiAgICAgICAgcmlnaHRMYWJlbDogY29tcGxldGlvbi5tYXRjaFR5cGUsXG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgZmluZFByZWZpeChlZGl0b3I6IFRleHRFZGl0b3IpOiBzdHJpbmcge1xuICAgIHZhciBjdXJzb3IgPSBlZGl0b3IuZ2V0TGFzdEN1cnNvcigpO1xuICAgIC8vIFdlIHVzZSBjdXN0b20gd29yZFJlZ2V4IHRvIGFkb3B0IHBocCB2YXJpYWJsZXMgc3RhcnRpbmcgd2l0aCAkLlxuICAgIHZhciBjdXJyZW50UmFuZ2UgPSBjdXJzb3IuZ2V0Q3VycmVudFdvcmRCdWZmZXJSYW5nZSh7d29yZFJlZ2V4Oi8oXFwkXFx3Kil8XFx3Ky99KTtcbiAgICAvLyBDdXJyZW50IHdvcmQgbWlnaHQgZ28gYmV5b25kIHRoZSBjdXJzb3IsIHNvIHdlIGN1dCBpdC5cbiAgICB2YXIgcmFuZ2UgPSBuZXcgUmFuZ2UoXG4gICAgICAgIGN1cnJlbnRSYW5nZS5zdGFydCxcbiAgICAgICAgbmV3IFBvaW50KGN1cnNvci5nZXRCdWZmZXJSb3coKSwgY3Vyc29yLmdldEJ1ZmZlckNvbHVtbigpKSk7XG4gICAgdmFyIHByZWZpeCA9IGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShyYW5nZSkudHJpbSgpO1xuICAgIC8vIFByZWZpeCBjb3VsZCBqdXN0IGJlICQgb3IgZW5kcyB3aXRoIHN0cmluZyBsaXRlcmFsLlxuICAgIGlmIChwcmVmaXggPT09ICckJyB8fCAhL1tcXFddJC8udGVzdChwcmVmaXgpKSB7XG4gICAgICByZXR1cm4gcHJlZml4O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQXV0b2NvbXBsZXRlUHJvdmlkZXI7XG4iXX0=