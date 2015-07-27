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

var CompositeDisposable = _require.CompositeDisposable;

var logger;

var CodeFormatManager = (function () {
  function CodeFormatManager() {
    var _this = this;

    _classCallCheck(this, CodeFormatManager);

    this._subscriptions = new CompositeDisposable();
    this._subscriptions.add(atom.commands.add('atom-text-editor', 'nuclide-code-format:format-code',
    // Atom doesn't accept in-command modification of the text editor contents.
    function () {
      return process.nextTick(function () {
        return _this._formatCodeInActiveTextEditor(_this._editor);
      });
    }));
    this._codeFormatProviders = [];
  }

  _createClass(CodeFormatManager, [{
    key: '_formatCodeInActiveTextEditor',
    value: _asyncToGenerator(function* () {
      var editor = atom.workspace.getActiveTextEditor();
      if (!editor) {
        return getLogger().info('No active text editor to format its code!');
      }

      var _editor$getGrammar = editor.getGrammar();

      var scopeName = _editor$getGrammar.scopeName;

      var matchingProviders = this._getMatchingProvidersForScopeName(scopeName);

      if (!matchingProviders.length) {
        return getLogger().info('No code format providers registered for scopeName:', scopeName);
      }

      var buffer = editor.getBuffer();
      var selectionRange = editor.getSelectedBufferRange();
      var selectionStart = selectionRange.start;
      var selectionEnd = selectionRange.end;

      var formatRange = null;
      if (selectionStart.isEqual(selectionEnd)) {
        // If no selection is done, then, the whole file is wanted to be formatted.
        formatRange = buffer.getRange();
      } else {
        // Format selections should start at the begining of the line,
        // and end at the end of the selection line.

        var _require2 = require('atom');

        var Range = _require2.Range;

        formatRange = new Range({ row: selectionStart.row, column: 0 }, { row: selectionEnd.row, column: buffer.lineLengthForRow(selectionEnd.row) });
      }

      var codeReplacement = yield matchingProviders[0].formatCode(editor, formatRange);
      // TODO(most): save cursor location.
      editor.setTextInBufferRange(formatRange, codeReplacement);
    })
  }, {
    key: '_getMatchingProvidersForScopeName',
    value: function _getMatchingProvidersForScopeName(scopeName) {
      return this._codeFormatProviders.filter(function (provider) {
        var providerGrammars = provider.selector.split(/, ?/);
        return provider.inclusionPriority > 0 && providerGrammars.indexOf(scopeName) !== -1;
      }).sort(function (providerA, providerB) {
        return providerA.inclusionPriority < providerB.inclusionPriority;
      });
    }
  }, {
    key: 'addProvider',
    value: function addProvider(provider) {
      this._codeFormatProviders.push(provider);
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      if (this._subscriptions) {
        this._subscriptions.dispose();
        this._subscriptions = null;
      }
    }
  }]);

  return CodeFormatManager;
})();

function getLogger() {
  return logger || (logger = require('nuclide-logging').getLogger());
}

module.exports = CodeFormatManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWNvZGUtZm9ybWF0L2xpYi9Db2RlRm9ybWF0TWFuYWdlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7OztlQVdnQixPQUFPLENBQUMsTUFBTSxDQUFDOztJQUF0QyxtQkFBbUIsWUFBbkIsbUJBQW1COztBQUN4QixJQUFJLE1BQU0sQ0FBQzs7SUFNTCxpQkFBaUI7QUFFVixXQUZQLGlCQUFpQixHQUVQOzs7MEJBRlYsaUJBQWlCOztBQUduQixRQUFJLENBQUMsY0FBYyxHQUFHLElBQUksbUJBQW1CLEVBQUUsQ0FBQztBQUNoRCxRQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FDdkMsa0JBQWtCLEVBQ2xCLGlDQUFpQzs7QUFFakM7YUFBTSxPQUFPLENBQUMsUUFBUSxDQUFDO2VBQU0sTUFBSyw2QkFBNkIsQ0FBQyxNQUFLLE9BQU8sQ0FBQztPQUFBLENBQUM7S0FBQSxDQUMvRSxDQUFDLENBQUM7QUFDSCxRQUFJLENBQUMsb0JBQW9CLEdBQUcsRUFBRSxDQUFDO0dBQ2hDOztlQVhHLGlCQUFpQjs7NkJBYWMsYUFBWTtBQUM3QyxVQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUM7QUFDbEQsVUFBSSxDQUFDLE1BQU0sRUFBRTtBQUNYLGVBQU8sU0FBUyxFQUFFLENBQUMsSUFBSSxDQUFDLDJDQUEyQyxDQUFDLENBQUM7T0FDdEU7OytCQUVpQixNQUFNLENBQUMsVUFBVSxFQUFFOztVQUFoQyxTQUFTLHNCQUFULFNBQVM7O0FBQ2QsVUFBSSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsaUNBQWlDLENBQUMsU0FBUyxDQUFDLENBQUM7O0FBRTFFLFVBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUU7QUFDN0IsZUFBTyxTQUFTLEVBQUUsQ0FBQyxJQUFJLENBQUMsb0RBQW9ELEVBQUUsU0FBUyxDQUFDLENBQUM7T0FDMUY7O0FBRUQsVUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQ2hDLFVBQUksY0FBYyxHQUFHLE1BQU0sQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1VBQ3pDLGNBQWMsR0FBdUIsY0FBYyxDQUExRCxLQUFLO1VBQXVCLFlBQVksR0FBSSxjQUFjLENBQW5DLEdBQUc7O0FBQy9CLFVBQUksV0FBVyxHQUFHLElBQUksQ0FBQztBQUN2QixVQUFJLGNBQWMsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLEVBQUU7O0FBRXhDLG1CQUFXLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO09BQ2pDLE1BQU07Ozs7d0JBR1MsT0FBTyxDQUFDLE1BQU0sQ0FBQzs7WUFBeEIsS0FBSyxhQUFMLEtBQUs7O0FBQ1YsbUJBQVcsR0FBRyxJQUFJLEtBQUssQ0FDbkIsRUFBQyxHQUFHLEVBQUUsY0FBYyxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFDLEVBQ3BDLEVBQUMsR0FBRyxFQUFFLFlBQVksQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEVBQUMsQ0FDN0UsQ0FBQztPQUNIOztBQUVELFVBQUksZUFBZSxHQUFHLE1BQU0saUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsQ0FBQzs7QUFFakYsWUFBTSxDQUFDLG9CQUFvQixDQUFDLFdBQVcsRUFBRSxlQUFlLENBQUMsQ0FBQztLQUMzRDs7O1dBRWdDLDJDQUFDLFNBQWlCLEVBQTZCO0FBQzlFLGFBQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxVQUFDLFFBQVEsRUFBeUI7QUFDeEUsWUFBSSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN0RCxlQUFPLFFBQVEsQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLElBQUksZ0JBQWdCLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO09BQ3JGLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQyxTQUFTLEVBQXNCLFNBQVMsRUFBeUI7QUFDeEUsZUFBTyxTQUFTLENBQUMsaUJBQWlCLEdBQUcsU0FBUyxDQUFDLGlCQUFpQixDQUFDO09BQ2xFLENBQUMsQ0FBQztLQUNKOzs7V0FFVSxxQkFBQyxRQUE0QixFQUFFO0FBQ3hDLFVBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDMUM7OztXQUVNLG1CQUFHO0FBQ1IsVUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFO0FBQ3ZCLFlBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDOUIsWUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7T0FDNUI7S0FDRjs7O1NBbEVHLGlCQUFpQjs7O0FBcUV2QixTQUFTLFNBQVMsR0FBRztBQUNuQixTQUFPLE1BQU0sS0FBSyxNQUFNLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUMsU0FBUyxFQUFFLENBQUEsQ0FBRTtDQUNwRTs7QUFFRCxNQUFNLENBQUMsT0FBTyxHQUFHLGlCQUFpQixDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWNvZGUtZm9ybWF0L2xpYi9Db2RlRm9ybWF0TWFuYWdlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbnZhciB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlKCdhdG9tJyk7XG52YXIgbG9nZ2VyO1xuXG50eXBlIENvZGVGb3JtYXRQcm92aWRlciA9IHtcbiAgZm9ybWF0Q29kZShlZGl0b3I6IFRleHRFZGl0b3IsIHJhbmdlOiBSYW5nZSk6IFByb21pc2U8c3RyaW5nPjtcbn07XG5cbmNsYXNzIENvZGVGb3JtYXRNYW5hZ2VyIHtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcbiAgICAgICdhdG9tLXRleHQtZWRpdG9yJyxcbiAgICAgICdudWNsaWRlLWNvZGUtZm9ybWF0OmZvcm1hdC1jb2RlJyxcbiAgICAgIC8vIEF0b20gZG9lc24ndCBhY2NlcHQgaW4tY29tbWFuZCBtb2RpZmljYXRpb24gb2YgdGhlIHRleHQgZWRpdG9yIGNvbnRlbnRzLlxuICAgICAgKCkgPT4gcHJvY2Vzcy5uZXh0VGljaygoKSA9PiB0aGlzLl9mb3JtYXRDb2RlSW5BY3RpdmVUZXh0RWRpdG9yKHRoaXMuX2VkaXRvcikpXG4gICAgKSk7XG4gICAgdGhpcy5fY29kZUZvcm1hdFByb3ZpZGVycyA9IFtdO1xuICB9XG5cbiAgYXN5bmMgX2Zvcm1hdENvZGVJbkFjdGl2ZVRleHRFZGl0b3IoKTogUHJvbWlzZSB7XG4gICAgdmFyIGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcbiAgICBpZiAoIWVkaXRvcikge1xuICAgICAgcmV0dXJuIGdldExvZ2dlcigpLmluZm8oJ05vIGFjdGl2ZSB0ZXh0IGVkaXRvciB0byBmb3JtYXQgaXRzIGNvZGUhJyk7XG4gICAgfVxuXG4gICAgdmFyIHtzY29wZU5hbWV9ID0gZWRpdG9yLmdldEdyYW1tYXIoKTtcbiAgICB2YXIgbWF0Y2hpbmdQcm92aWRlcnMgPSB0aGlzLl9nZXRNYXRjaGluZ1Byb3ZpZGVyc0ZvclNjb3BlTmFtZShzY29wZU5hbWUpO1xuXG4gICAgaWYgKCFtYXRjaGluZ1Byb3ZpZGVycy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBnZXRMb2dnZXIoKS5pbmZvKCdObyBjb2RlIGZvcm1hdCBwcm92aWRlcnMgcmVnaXN0ZXJlZCBmb3Igc2NvcGVOYW1lOicsIHNjb3BlTmFtZSk7XG4gICAgfVxuXG4gICAgdmFyIGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKTtcbiAgICB2YXIgc2VsZWN0aW9uUmFuZ2UgPSBlZGl0b3IuZ2V0U2VsZWN0ZWRCdWZmZXJSYW5nZSgpO1xuICAgIHZhciB7c3RhcnQ6IHNlbGVjdGlvblN0YXJ0LCBlbmQ6IHNlbGVjdGlvbkVuZH0gPSBzZWxlY3Rpb25SYW5nZTtcbiAgICB2YXIgZm9ybWF0UmFuZ2UgPSBudWxsO1xuICAgIGlmIChzZWxlY3Rpb25TdGFydC5pc0VxdWFsKHNlbGVjdGlvbkVuZCkpIHtcbiAgICAgIC8vIElmIG5vIHNlbGVjdGlvbiBpcyBkb25lLCB0aGVuLCB0aGUgd2hvbGUgZmlsZSBpcyB3YW50ZWQgdG8gYmUgZm9ybWF0dGVkLlxuICAgICAgZm9ybWF0UmFuZ2UgPSBidWZmZXIuZ2V0UmFuZ2UoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRm9ybWF0IHNlbGVjdGlvbnMgc2hvdWxkIHN0YXJ0IGF0IHRoZSBiZWdpbmluZyBvZiB0aGUgbGluZSxcbiAgICAgIC8vIGFuZCBlbmQgYXQgdGhlIGVuZCBvZiB0aGUgc2VsZWN0aW9uIGxpbmUuXG4gICAgICB2YXIge1JhbmdlfSA9IHJlcXVpcmUoJ2F0b20nKTtcbiAgICAgIGZvcm1hdFJhbmdlID0gbmV3IFJhbmdlKFxuICAgICAgICAgIHtyb3c6IHNlbGVjdGlvblN0YXJ0LnJvdywgY29sdW1uOiAwfSxcbiAgICAgICAgICB7cm93OiBzZWxlY3Rpb25FbmQucm93LCBjb2x1bW46IGJ1ZmZlci5saW5lTGVuZ3RoRm9yUm93KHNlbGVjdGlvbkVuZC5yb3cpfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICB2YXIgY29kZVJlcGxhY2VtZW50ID0gYXdhaXQgbWF0Y2hpbmdQcm92aWRlcnNbMF0uZm9ybWF0Q29kZShlZGl0b3IsIGZvcm1hdFJhbmdlKTtcbiAgICAvLyBUT0RPKG1vc3QpOiBzYXZlIGN1cnNvciBsb2NhdGlvbi5cbiAgICBlZGl0b3Iuc2V0VGV4dEluQnVmZmVyUmFuZ2UoZm9ybWF0UmFuZ2UsIGNvZGVSZXBsYWNlbWVudCk7XG4gIH1cblxuICBfZ2V0TWF0Y2hpbmdQcm92aWRlcnNGb3JTY29wZU5hbWUoc2NvcGVOYW1lOiBzdHJpbmcpOiBBcnJheTxDb2RlRm9ybWF0UHJvdmlkZXI+IHtcbiAgICByZXR1cm4gdGhpcy5fY29kZUZvcm1hdFByb3ZpZGVycy5maWx0ZXIoKHByb3ZpZGVyOiBDb2RlRm9ybWF0UHJvdmlkZXIpID0+IHtcbiAgICAgIHZhciBwcm92aWRlckdyYW1tYXJzID0gcHJvdmlkZXIuc2VsZWN0b3Iuc3BsaXQoLywgPy8pO1xuICAgICAgcmV0dXJuIHByb3ZpZGVyLmluY2x1c2lvblByaW9yaXR5ID4gMCAmJiBwcm92aWRlckdyYW1tYXJzLmluZGV4T2Yoc2NvcGVOYW1lKSAhPT0gLTE7XG4gICAgfSkuc29ydCgocHJvdmlkZXJBOiBDb2RlRm9ybWF0UHJvdmlkZXIsIHByb3ZpZGVyQjogQ29kZUZvcm1hdFByb3ZpZGVyKSA9PiB7XG4gICAgICByZXR1cm4gcHJvdmlkZXJBLmluY2x1c2lvblByaW9yaXR5IDwgcHJvdmlkZXJCLmluY2x1c2lvblByaW9yaXR5O1xuICAgIH0pO1xuICB9XG5cbiAgYWRkUHJvdmlkZXIocHJvdmlkZXI6IENvZGVGb3JtYXRQcm92aWRlcikge1xuICAgIHRoaXMuX2NvZGVGb3JtYXRQcm92aWRlcnMucHVzaChwcm92aWRlcik7XG4gIH1cblxuICBkaXNwb3NlKCkge1xuICAgIGlmICh0aGlzLl9zdWJzY3JpcHRpb25zKSB7XG4gICAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKTtcbiAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMgPSBudWxsO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRMb2dnZXIoKSB7XG4gIHJldHVybiBsb2dnZXIgfHwgKGxvZ2dlciA9IHJlcXVpcmUoJ251Y2xpZGUtbG9nZ2luZycpLmdldExvZ2dlcigpKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDb2RlRm9ybWF0TWFuYWdlcjtcbiJdfQ==