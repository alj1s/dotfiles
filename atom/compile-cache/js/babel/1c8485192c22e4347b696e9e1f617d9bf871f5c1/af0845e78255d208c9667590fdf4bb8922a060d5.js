var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

'use babel';

var React = require('react-for-atom');

var _require = require('nuclide-atom-helpers');

var fileTypeClass = _require.fileTypeClass;

var path = require('path');

var FileResultComponent = (function () {
  function FileResultComponent() {
    _classCallCheck(this, FileResultComponent);
  }

  _createClass(FileResultComponent, null, [{
    key: 'getComponentForItem',
    value: function getComponentForItem(item) {
      var filePath = item.path;

      var filenameStart = filePath.lastIndexOf(path.sep);
      var importantIndexes = [filenameStart, filePath.length].concat(item.matchIndexes).sort(function (index1, index2) {
        return index1 - index2;
      });

      var folderComponents = [];
      var filenameComponents = [];

      var last = -1;
      // Split the path into it's path and directory, with matching characters pulled out and highlighted.
      //
      // When there's no matches, the ouptut is equivalent to just calling path.dirname/basename.
      importantIndexes.forEach(function (index) {
        // If the index is after the filename start, push the new text elements
        // into `filenameComponents`, otherwise push them into `folderComponents`.
        var target = index <= filenameStart ? folderComponents : filenameComponents;

        // If there was text before the `index`, push it onto `target` unstyled.
        var previousString = filePath.slice(last + 1, index);
        if (previousString.length !== 0) {
          target.push(React.createElement(
            'span',
            { key: index + 'prev' },
            previousString
          ));
        }

        // Don't put the '/' between the folder path and the filename on either line.
        if (index !== filenameStart && index < filePath.length) {
          var character = filePath.charAt(index);
          target.push(React.createElement(
            'span',
            { key: index, className: 'quick-open-file-search-match' },
            character
          ));
        }

        last = index;
      });

      var filenameClasses = ['file', 'icon', fileTypeClass(filePath)].join(' ');
      var folderClasses = ['path', 'no-icon'].join(' ');

      // `data-name` is support for the "file-icons" package.
      // See: https://atom.io/packages/file-icons
      return React.createElement(
        'div',
        null,
        React.createElement(
          'span',
          { className: filenameClasses, 'data-name': path.basename(filePath) },
          filenameComponents
        ),
        React.createElement(
          'span',
          { className: folderClasses },
          folderComponents
        )
      );
    }
  }]);

  return FileResultComponent;
})();

module.exports = FileResultComponent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXF1aWNrLW9wZW4vbGliL0ZpbGVSZXN1bHRDb21wb25lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBQSxXQUFXLENBQUM7O0FBYVosSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7O2VBQ2hCLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQzs7SUFBaEQsYUFBYSxZQUFiLGFBQWE7O0FBQ2xCLElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQzs7SUFFckIsbUJBQW1CO1dBQW5CLG1CQUFtQjswQkFBbkIsbUJBQW1COzs7ZUFBbkIsbUJBQW1COztXQUVHLDZCQUFDLElBQWdCLEVBQWdCO0FBQ3pELFVBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7O0FBRXpCLFVBQUksYUFBYSxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ25ELFVBQUksZ0JBQWdCLEdBQUcsQ0FBQyxhQUFhLEVBQUUsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQ3pCLElBQUksQ0FBQyxVQUFDLE1BQU0sRUFBRSxNQUFNO2VBQUssTUFBTSxHQUFHLE1BQU07T0FBQSxDQUFDLENBQUM7O0FBRWxHLFVBQUksZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO0FBQzFCLFVBQUksa0JBQWtCLEdBQUcsRUFBRSxDQUFDOztBQUU1QixVQUFJLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQzs7OztBQUlkLHNCQUFnQixDQUFDLE9BQU8sQ0FBQyxVQUFDLEtBQUssRUFBSzs7O0FBR2xDLFlBQUksTUFBTSxHQUFHLEtBQUssSUFBSSxhQUFhLEdBQUcsZ0JBQWdCLEdBQUcsa0JBQWtCLENBQUM7OztBQUc1RSxZQUFJLGNBQWMsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDckQsWUFBSSxjQUFjLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtBQUMvQixnQkFBTSxDQUFDLElBQUksQ0FBQzs7Y0FBTSxHQUFHLEVBQUUsS0FBSyxHQUFHLE1BQU0sQUFBQztZQUFFLGNBQWM7V0FBUSxDQUFDLENBQUM7U0FDakU7OztBQUdELFlBQUksS0FBSyxLQUFLLGFBQWEsSUFBSSxLQUFLLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRTtBQUN0RCxjQUFJLFNBQVMsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3ZDLGdCQUFNLENBQUMsSUFBSSxDQUFDOztjQUFNLEdBQUcsRUFBRSxLQUFLLEFBQUMsRUFBQyxTQUFTLEVBQUMsOEJBQThCO1lBQUUsU0FBUztXQUFRLENBQUMsQ0FBQztTQUM1Rjs7QUFFRCxZQUFJLEdBQUcsS0FBSyxDQUFDO09BQ2QsQ0FBQyxDQUFDOztBQUVILFVBQUksZUFBZSxHQUFHLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDMUUsVUFBSSxhQUFhLEdBQUcsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDOzs7O0FBSWxELGFBQ0U7OztRQUNFOztZQUFNLFNBQVMsRUFBRSxlQUFlLEFBQUMsRUFBQyxhQUFXLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEFBQUM7VUFDbEUsa0JBQWtCO1NBQ2Q7UUFDUDs7WUFBTSxTQUFTLEVBQUUsYUFBYSxBQUFDO1VBQUUsZ0JBQWdCO1NBQVE7T0FDckQsQ0FDTjtLQUNIOzs7U0FqREcsbUJBQW1COzs7QUFvRHpCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsbUJBQW1CLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL251Y2xpZGUtcXVpY2stb3Blbi9saWIvRmlsZVJlc3VsdENvbXBvbmVudC5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbmltcG9ydCB0eXBlIHtGaWxlUmVzdWx0fSBmcm9tICcuL3R5cGVzJztcblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QtZm9yLWF0b20nKTtcbnZhciB7ZmlsZVR5cGVDbGFzc30gPSByZXF1aXJlKCdudWNsaWRlLWF0b20taGVscGVycycpO1xudmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5cbmNsYXNzIEZpbGVSZXN1bHRDb21wb25lbnQge1xuXG4gIHN0YXRpYyBnZXRDb21wb25lbnRGb3JJdGVtKGl0ZW06IEZpbGVSZXN1bHQpOiBSZWFjdEVsZW1lbnQge1xuICAgIHZhciBmaWxlUGF0aCA9IGl0ZW0ucGF0aDtcblxuICAgIHZhciBmaWxlbmFtZVN0YXJ0ID0gZmlsZVBhdGgubGFzdEluZGV4T2YocGF0aC5zZXApO1xuICAgIHZhciBpbXBvcnRhbnRJbmRleGVzID0gW2ZpbGVuYW1lU3RhcnQsIGZpbGVQYXRoLmxlbmd0aF0uY29uY2F0KGl0ZW0ubWF0Y2hJbmRleGVzKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc29ydCgoaW5kZXgxLCBpbmRleDIpID0+IGluZGV4MSAtIGluZGV4Mik7XG5cbiAgICB2YXIgZm9sZGVyQ29tcG9uZW50cyA9IFtdO1xuICAgIHZhciBmaWxlbmFtZUNvbXBvbmVudHMgPSBbXTtcblxuICAgIHZhciBsYXN0ID0gLTE7XG4gICAgLy8gU3BsaXQgdGhlIHBhdGggaW50byBpdCdzIHBhdGggYW5kIGRpcmVjdG9yeSwgd2l0aCBtYXRjaGluZyBjaGFyYWN0ZXJzIHB1bGxlZCBvdXQgYW5kIGhpZ2hsaWdodGVkLlxuICAgIC8vXG4gICAgLy8gV2hlbiB0aGVyZSdzIG5vIG1hdGNoZXMsIHRoZSBvdXB0dXQgaXMgZXF1aXZhbGVudCB0byBqdXN0IGNhbGxpbmcgcGF0aC5kaXJuYW1lL2Jhc2VuYW1lLlxuICAgIGltcG9ydGFudEluZGV4ZXMuZm9yRWFjaCgoaW5kZXgpID0+IHtcbiAgICAgIC8vIElmIHRoZSBpbmRleCBpcyBhZnRlciB0aGUgZmlsZW5hbWUgc3RhcnQsIHB1c2ggdGhlIG5ldyB0ZXh0IGVsZW1lbnRzXG4gICAgICAvLyBpbnRvIGBmaWxlbmFtZUNvbXBvbmVudHNgLCBvdGhlcndpc2UgcHVzaCB0aGVtIGludG8gYGZvbGRlckNvbXBvbmVudHNgLlxuICAgICAgdmFyIHRhcmdldCA9IGluZGV4IDw9IGZpbGVuYW1lU3RhcnQgPyBmb2xkZXJDb21wb25lbnRzIDogZmlsZW5hbWVDb21wb25lbnRzO1xuXG4gICAgICAvLyBJZiB0aGVyZSB3YXMgdGV4dCBiZWZvcmUgdGhlIGBpbmRleGAsIHB1c2ggaXQgb250byBgdGFyZ2V0YCB1bnN0eWxlZC5cbiAgICAgIHZhciBwcmV2aW91c1N0cmluZyA9IGZpbGVQYXRoLnNsaWNlKGxhc3QgKyAxLCBpbmRleCk7XG4gICAgICBpZiAocHJldmlvdXNTdHJpbmcubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgIHRhcmdldC5wdXNoKDxzcGFuIGtleT17aW5kZXggKyAncHJldid9PntwcmV2aW91c1N0cmluZ308L3NwYW4+KTtcbiAgICAgIH1cblxuICAgICAgLy8gRG9uJ3QgcHV0IHRoZSAnLycgYmV0d2VlbiB0aGUgZm9sZGVyIHBhdGggYW5kIHRoZSBmaWxlbmFtZSBvbiBlaXRoZXIgbGluZS5cbiAgICAgIGlmIChpbmRleCAhPT0gZmlsZW5hbWVTdGFydCAmJiBpbmRleCA8IGZpbGVQYXRoLmxlbmd0aCkge1xuICAgICAgICB2YXIgY2hhcmFjdGVyID0gZmlsZVBhdGguY2hhckF0KGluZGV4KTtcbiAgICAgICAgdGFyZ2V0LnB1c2goPHNwYW4ga2V5PXtpbmRleH0gY2xhc3NOYW1lPVwicXVpY2stb3Blbi1maWxlLXNlYXJjaC1tYXRjaFwiPntjaGFyYWN0ZXJ9PC9zcGFuPik7XG4gICAgICB9XG5cbiAgICAgIGxhc3QgPSBpbmRleDtcbiAgICB9KTtcblxuICAgIHZhciBmaWxlbmFtZUNsYXNzZXMgPSBbJ2ZpbGUnLCAnaWNvbicsIGZpbGVUeXBlQ2xhc3MoZmlsZVBhdGgpXS5qb2luKCcgJyk7XG4gICAgdmFyIGZvbGRlckNsYXNzZXMgPSBbJ3BhdGgnLCAnbm8taWNvbiddLmpvaW4oJyAnKTtcblxuICAgIC8vIGBkYXRhLW5hbWVgIGlzIHN1cHBvcnQgZm9yIHRoZSBcImZpbGUtaWNvbnNcIiBwYWNrYWdlLlxuICAgIC8vIFNlZTogaHR0cHM6Ly9hdG9tLmlvL3BhY2thZ2VzL2ZpbGUtaWNvbnNcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtmaWxlbmFtZUNsYXNzZXN9IGRhdGEtbmFtZT17cGF0aC5iYXNlbmFtZShmaWxlUGF0aCl9PlxuICAgICAgICAgIHtmaWxlbmFtZUNvbXBvbmVudHN9XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtmb2xkZXJDbGFzc2VzfT57Zm9sZGVyQ29tcG9uZW50c308L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVSZXN1bHRDb21wb25lbnQ7XG4iXX0=