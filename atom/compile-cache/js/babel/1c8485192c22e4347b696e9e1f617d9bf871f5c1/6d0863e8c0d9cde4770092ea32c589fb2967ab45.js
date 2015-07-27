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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWNvZGUtZm9ybWF0L2xpYi9Db2RlRm9ybWF0TWFuYWdlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7OztlQVdnQixPQUFPLENBQUMsTUFBTSxDQUFDOztJQUF0QyxtQkFBbUIsWUFBbkIsbUJBQW1COztBQUN4QixJQUFJLE1BQU0sQ0FBQzs7SUFNTCxpQkFBaUI7QUFFVixXQUZQLGlCQUFpQixHQUVQOzs7MEJBRlYsaUJBQWlCOztBQUduQixRQUFJLENBQUMsY0FBYyxHQUFHLElBQUksbUJBQW1CLEVBQUUsQ0FBQztBQUNoRCxRQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FDdkMsa0JBQWtCLEVBQ2xCLGlDQUFpQzs7QUFFakM7YUFBTSxPQUFPLENBQUMsUUFBUSxDQUFDO2VBQU0sTUFBSyw2QkFBNkIsQ0FBQyxNQUFLLE9BQU8sQ0FBQztPQUFBLENBQUM7S0FBQSxDQUMvRSxDQUFDLENBQUM7QUFDSCxRQUFJLENBQUMsb0JBQW9CLEdBQUcsRUFBRSxDQUFDO0dBQ2hDOztlQVhHLGlCQUFpQjs7NkJBYWMsYUFBWTtBQUM3QyxVQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUM7QUFDbEQsVUFBSSxDQUFDLE1BQU0sRUFBRTtBQUNYLGVBQU8sU0FBUyxFQUFFLENBQUMsSUFBSSxDQUFDLDJDQUEyQyxDQUFDLENBQUM7T0FDdEU7OytCQUVpQixNQUFNLENBQUMsVUFBVSxFQUFFOztVQUFoQyxTQUFTLHNCQUFULFNBQVM7O0FBQ2QsVUFBSSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsaUNBQWlDLENBQUMsU0FBUyxDQUFDLENBQUM7O0FBRTFFLFVBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUU7QUFDN0IsZUFBTyxTQUFTLEVBQUUsQ0FBQyxJQUFJLENBQUMsb0RBQW9ELEVBQUUsU0FBUyxDQUFDLENBQUM7T0FDMUY7O0FBRUQsVUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQ2hDLFVBQUksY0FBYyxHQUFHLE1BQU0sQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1VBQ3pDLGNBQWMsR0FBdUIsY0FBYyxDQUExRCxLQUFLO1VBQXVCLFlBQVksR0FBSSxjQUFjLENBQW5DLEdBQUc7O0FBQy9CLFVBQUksV0FBVyxHQUFHLElBQUksQ0FBQztBQUN2QixVQUFJLGNBQWMsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLEVBQUU7O0FBRXhDLG1CQUFXLEdBQUcsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO09BQ2pDLE1BQU07Ozs7d0JBR1MsT0FBTyxDQUFDLE1BQU0sQ0FBQzs7WUFBeEIsS0FBSyxhQUFMLEtBQUs7O0FBQ1YsbUJBQVcsR0FBRyxJQUFJLEtBQUssQ0FDbkIsRUFBQyxHQUFHLEVBQUUsY0FBYyxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFDLEVBQ3BDLEVBQUMsR0FBRyxFQUFFLFlBQVksQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEVBQUMsQ0FDN0UsQ0FBQztPQUNIOztBQUVELFVBQUksZUFBZSxHQUFHLE1BQU0saUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsQ0FBQzs7QUFFakYsWUFBTSxDQUFDLG9CQUFvQixDQUFDLFdBQVcsRUFBRSxlQUFlLENBQUMsQ0FBQztLQUMzRDs7O1dBRWdDLDJDQUFDLFNBQWlCLEVBQTZCO0FBQzlFLGFBQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxVQUFDLFFBQVEsRUFBeUI7QUFDeEUsWUFBSSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN0RCxlQUFPLFFBQVEsQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLElBQUksZ0JBQWdCLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO09BQ3JGLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQyxTQUFTLEVBQXNCLFNBQVMsRUFBeUI7QUFDeEUsZUFBTyxTQUFTLENBQUMsaUJBQWlCLEdBQUcsU0FBUyxDQUFDLGlCQUFpQixDQUFDO09BQ2xFLENBQUMsQ0FBQztLQUNKOzs7V0FFVSxxQkFBQyxRQUE0QixFQUFFO0FBQ3hDLFVBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDMUM7OztXQUVNLG1CQUFHO0FBQ1IsVUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFO0FBQ3ZCLFlBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDOUIsWUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7T0FDNUI7S0FDRjs7O1NBbEVHLGlCQUFpQjs7O0FBcUV2QixTQUFTLFNBQVMsR0FBRztBQUNuQixTQUFPLE1BQU0sS0FBSyxNQUFNLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUMsU0FBUyxFQUFFLENBQUEsQUFBQyxDQUFDO0NBQ3BFOztBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUcsaUJBQWlCLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL251Y2xpZGUtY29kZS1mb3JtYXQvbGliL0NvZGVGb3JtYXRNYW5hZ2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxudmFyIHtDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUoJ2F0b20nKTtcbnZhciBsb2dnZXI7XG5cbnR5cGUgQ29kZUZvcm1hdFByb3ZpZGVyID0ge1xuICBmb3JtYXRDb2RlKGVkaXRvcjogVGV4dEVkaXRvciwgcmFuZ2U6IFJhbmdlKTogUHJvbWlzZTxzdHJpbmc+O1xufTtcblxuY2xhc3MgQ29kZUZvcm1hdE1hbmFnZXIge1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29tbWFuZHMuYWRkKFxuICAgICAgJ2F0b20tdGV4dC1lZGl0b3InLFxuICAgICAgJ251Y2xpZGUtY29kZS1mb3JtYXQ6Zm9ybWF0LWNvZGUnLFxuICAgICAgLy8gQXRvbSBkb2Vzbid0IGFjY2VwdCBpbi1jb21tYW5kIG1vZGlmaWNhdGlvbiBvZiB0aGUgdGV4dCBlZGl0b3IgY29udGVudHMuXG4gICAgICAoKSA9PiBwcm9jZXNzLm5leHRUaWNrKCgpID0+IHRoaXMuX2Zvcm1hdENvZGVJbkFjdGl2ZVRleHRFZGl0b3IodGhpcy5fZWRpdG9yKSlcbiAgICApKTtcbiAgICB0aGlzLl9jb2RlRm9ybWF0UHJvdmlkZXJzID0gW107XG4gIH1cblxuICBhc3luYyBfZm9ybWF0Q29kZUluQWN0aXZlVGV4dEVkaXRvcigpOiBQcm9taXNlIHtcbiAgICB2YXIgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICAgIGlmICghZWRpdG9yKSB7XG4gICAgICByZXR1cm4gZ2V0TG9nZ2VyKCkuaW5mbygnTm8gYWN0aXZlIHRleHQgZWRpdG9yIHRvIGZvcm1hdCBpdHMgY29kZSEnKTtcbiAgICB9XG5cbiAgICB2YXIge3Njb3BlTmFtZX0gPSBlZGl0b3IuZ2V0R3JhbW1hcigpO1xuICAgIHZhciBtYXRjaGluZ1Byb3ZpZGVycyA9IHRoaXMuX2dldE1hdGNoaW5nUHJvdmlkZXJzRm9yU2NvcGVOYW1lKHNjb3BlTmFtZSk7XG5cbiAgICBpZiAoIW1hdGNoaW5nUHJvdmlkZXJzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGdldExvZ2dlcigpLmluZm8oJ05vIGNvZGUgZm9ybWF0IHByb3ZpZGVycyByZWdpc3RlcmVkIGZvciBzY29wZU5hbWU6Jywgc2NvcGVOYW1lKTtcbiAgICB9XG5cbiAgICB2YXIgYnVmZmVyID0gZWRpdG9yLmdldEJ1ZmZlcigpO1xuICAgIHZhciBzZWxlY3Rpb25SYW5nZSA9IGVkaXRvci5nZXRTZWxlY3RlZEJ1ZmZlclJhbmdlKCk7XG4gICAgdmFyIHtzdGFydDogc2VsZWN0aW9uU3RhcnQsIGVuZDogc2VsZWN0aW9uRW5kfSA9IHNlbGVjdGlvblJhbmdlO1xuICAgIHZhciBmb3JtYXRSYW5nZSA9IG51bGw7XG4gICAgaWYgKHNlbGVjdGlvblN0YXJ0LmlzRXF1YWwoc2VsZWN0aW9uRW5kKSkge1xuICAgICAgLy8gSWYgbm8gc2VsZWN0aW9uIGlzIGRvbmUsIHRoZW4sIHRoZSB3aG9sZSBmaWxlIGlzIHdhbnRlZCB0byBiZSBmb3JtYXR0ZWQuXG4gICAgICBmb3JtYXRSYW5nZSA9IGJ1ZmZlci5nZXRSYW5nZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBGb3JtYXQgc2VsZWN0aW9ucyBzaG91bGQgc3RhcnQgYXQgdGhlIGJlZ2luaW5nIG9mIHRoZSBsaW5lLFxuICAgICAgLy8gYW5kIGVuZCBhdCB0aGUgZW5kIG9mIHRoZSBzZWxlY3Rpb24gbGluZS5cbiAgICAgIHZhciB7UmFuZ2V9ID0gcmVxdWlyZSgnYXRvbScpO1xuICAgICAgZm9ybWF0UmFuZ2UgPSBuZXcgUmFuZ2UoXG4gICAgICAgICAge3Jvdzogc2VsZWN0aW9uU3RhcnQucm93LCBjb2x1bW46IDB9LFxuICAgICAgICAgIHtyb3c6IHNlbGVjdGlvbkVuZC5yb3csIGNvbHVtbjogYnVmZmVyLmxpbmVMZW5ndGhGb3JSb3coc2VsZWN0aW9uRW5kLnJvdyl9XG4gICAgICApO1xuICAgIH1cblxuICAgIHZhciBjb2RlUmVwbGFjZW1lbnQgPSBhd2FpdCBtYXRjaGluZ1Byb3ZpZGVyc1swXS5mb3JtYXRDb2RlKGVkaXRvciwgZm9ybWF0UmFuZ2UpO1xuICAgIC8vIFRPRE8obW9zdCk6IHNhdmUgY3Vyc29yIGxvY2F0aW9uLlxuICAgIGVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZShmb3JtYXRSYW5nZSwgY29kZVJlcGxhY2VtZW50KTtcbiAgfVxuXG4gIF9nZXRNYXRjaGluZ1Byb3ZpZGVyc0ZvclNjb3BlTmFtZShzY29wZU5hbWU6IHN0cmluZyk6IEFycmF5PENvZGVGb3JtYXRQcm92aWRlcj4ge1xuICAgIHJldHVybiB0aGlzLl9jb2RlRm9ybWF0UHJvdmlkZXJzLmZpbHRlcigocHJvdmlkZXI6IENvZGVGb3JtYXRQcm92aWRlcikgPT4ge1xuICAgICAgdmFyIHByb3ZpZGVyR3JhbW1hcnMgPSBwcm92aWRlci5zZWxlY3Rvci5zcGxpdCgvLCA/Lyk7XG4gICAgICByZXR1cm4gcHJvdmlkZXIuaW5jbHVzaW9uUHJpb3JpdHkgPiAwICYmIHByb3ZpZGVyR3JhbW1hcnMuaW5kZXhPZihzY29wZU5hbWUpICE9PSAtMTtcbiAgICB9KS5zb3J0KChwcm92aWRlckE6IENvZGVGb3JtYXRQcm92aWRlciwgcHJvdmlkZXJCOiBDb2RlRm9ybWF0UHJvdmlkZXIpID0+IHtcbiAgICAgIHJldHVybiBwcm92aWRlckEuaW5jbHVzaW9uUHJpb3JpdHkgPCBwcm92aWRlckIuaW5jbHVzaW9uUHJpb3JpdHk7XG4gICAgfSk7XG4gIH1cblxuICBhZGRQcm92aWRlcihwcm92aWRlcjogQ29kZUZvcm1hdFByb3ZpZGVyKSB7XG4gICAgdGhpcy5fY29kZUZvcm1hdFByb3ZpZGVycy5wdXNoKHByb3ZpZGVyKTtcbiAgfVxuXG4gIGRpc3Bvc2UoKSB7XG4gICAgaWYgKHRoaXMuX3N1YnNjcmlwdGlvbnMpIHtcbiAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuZGlzcG9zZSgpO1xuICAgICAgdGhpcy5fc3Vic2NyaXB0aW9ucyA9IG51bGw7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGdldExvZ2dlcigpIHtcbiAgcmV0dXJuIGxvZ2dlciB8fCAobG9nZ2VyID0gcmVxdWlyZSgnbnVjbGlkZS1sb2dnaW5nJykuZ2V0TG9nZ2VyKCkpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvZGVGb3JtYXRNYW5hZ2VyO1xuIl19