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
var Disposable = _require.Disposable;

var TYPEHINT_DELAY_MS = 200;

var TypeHintManager = (function () {
  function TypeHintManager() {
    var _this = this;

    _classCallCheck(this, TypeHintManager);

    this._subscriptions = new CompositeDisposable();
    // TODO(most): Replace with @jjiaa's mouseListenerForTextEditor introduced in D2005545.
    this._subscriptions.add(atom.workspace.observeTextEditors(function (editor) {
      var editorView = atom.views.getView(editor);
      var mouseMoveListener = function mouseMoveListener(e) {
        return _this._delayedTypeHint(e, editor, editorView);
      };
      editorView.addEventListener('mousemove', mouseMoveListener);
      var mouseListenerSubscription = new Disposable(function () {
        return editorView.removeEventListener('mousemove', mouseMoveListener);
      });
      var destroySubscription = editor.onDidDestroy(function () {
        _this._clearTypeHintTimer();
        mouseListenerSubscription.dispose();
        _this._subscriptions.remove(mouseListenerSubscription);
        _this._subscriptions.remove(destroySubscription);
      });
      _this._subscriptions.add(mouseListenerSubscription);
      _this._subscriptions.add(destroySubscription);
    }));
    this._typeHintProviders = [];
    this._typeHintElement = document.createElement('div');
    this._typeHintElement.className = 'nuclide-type-hint-overlay';
    this._marker = null;
    this._typeHintTimer = null;
  }

  _createClass(TypeHintManager, [{
    key: '_clearTypeHintTimer',
    value: function _clearTypeHintTimer() {
      clearTimeout(this._typeHintTimer);
      this._typeHintTimer = null;
    }
  }, {
    key: '_delayedTypeHint',
    value: function _delayedTypeHint(e, editor, editorView) {
      var _this2 = this;

      if (this._typeHintTimer) {
        this._clearTypeHintTimer();
      }
      this._typeHintTimer = setTimeout(function () {
        _this2._typeHintTimer = null;
        if (!editorView.component) {
          // The editor was destroyed, but the destroy handler haven't yet been called to cancel the timer.
          return;
        }
        // Delay a bit + Cancel and schedule another update if the mouse keeps moving.
        var screenPosition = editorView.component.screenPositionForMouseEvent(e);
        var position = editor.bufferPositionForScreenPosition(screenPosition);
        _this2._typeHintInEditor(editor, position);
      }, TYPEHINT_DELAY_MS);
    }
  }, {
    key: '_typeHintInEditor',
    value: _asyncToGenerator(function* (editor, position) {
      var _editor$getGrammar = editor.getGrammar();

      var scopeName = _editor$getGrammar.scopeName;

      var matchingProviders = this._getMatchingProvidersForScopeName(scopeName);

      if (this._marker) {
        this._marker.destroy();
        this._marker = null;
      }

      if (!matchingProviders.length) {
        return;
      }

      var typeHint = yield matchingProviders[0].typeHint(editor, position);
      if (!typeHint || this._marker) {
        return;
      }

      var hint = typeHint.hint;
      var range = typeHint.range;

      // Transform the matched element range to the hint range.
      this._marker = editor.markBufferRange(range, { invalidate: 'never' });

      // This relative positioning is to work around the issue that `position: 'head'`
      // doesn't work for overlay decorators are rendered on the bottom right of the given range.
      // Atom issue: https://github.com/atom/atom/issues/6695
      var expressionLength = range.end.column - range.start.column;
      this._typeHintElement.style.left = -(expressionLength * editor.getDefaultCharWidth()) + 'px';
      this._typeHintElement.style.top = -(2 * editor.getLineHeightInPixels()) + 'px';
      this._typeHintElement.textContent = hint;
      editor.decorateMarker(this._marker, { type: 'overlay', position: 'head', item: this._typeHintElement });
    })
  }, {
    key: '_getMatchingProvidersForScopeName',
    value: function _getMatchingProvidersForScopeName(scopeName) {
      return this._typeHintProviders.filter(function (provider) {
        var providerGrammars = provider.selector.split(/, ?/);
        return provider.inclusionPriority > 0 && providerGrammars.indexOf(scopeName) !== -1;
      }).sort(function (providerA, providerB) {
        return providerA.inclusionPriority < providerB.inclusionPriority;
      });
    }
  }, {
    key: 'addProvider',
    value: function addProvider(provider) {
      this._typeHintProviders.push(provider);
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

  return TypeHintManager;
})();

module.exports = TypeHintManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXR5cGUtaGludC9saWIvVHlwZUhpbnRNYW5hZ2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7O2VBVzRCLE9BQU8sQ0FBQyxNQUFNLENBQUM7O0lBQWxELG1CQUFtQixZQUFuQixtQkFBbUI7SUFBRSxVQUFVLFlBQVYsVUFBVTs7QUFFcEMsSUFBTSxpQkFBaUIsR0FBRyxHQUFHLENBQUM7O0lBV3hCLGVBQWU7QUFJUixXQUpQLGVBQWUsR0FJTDs7OzBCQUpWLGVBQWU7O0FBS2pCLFFBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxtQkFBbUIsRUFBRSxDQUFDOztBQUVoRCxRQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLFVBQUEsTUFBTSxFQUFJO0FBQ2xFLFVBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzVDLFVBQUksaUJBQWlCLEdBQUcsU0FBcEIsaUJBQWlCLENBQUksQ0FBQztlQUFLLE1BQUssZ0JBQWdCLENBQUMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxVQUFVLENBQUM7T0FBQSxDQUFDO0FBQzVFLGdCQUFVLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLGlCQUFpQixDQUFDLENBQUM7QUFDNUQsVUFBSSx5QkFBeUIsR0FBRyxJQUFJLFVBQVUsQ0FBQztlQUMzQyxVQUFVLENBQUMsbUJBQW1CLENBQUMsV0FBVyxFQUFFLGlCQUFpQixDQUFDO09BQUEsQ0FBQyxDQUFDO0FBQ3BFLFVBQUksbUJBQW1CLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxZQUFNO0FBQ2xELGNBQUssbUJBQW1CLEVBQUUsQ0FBQztBQUMzQixpQ0FBeUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNwQyxjQUFLLGNBQWMsQ0FBQyxNQUFNLENBQUMseUJBQXlCLENBQUMsQ0FBQztBQUN0RCxjQUFLLGNBQWMsQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUMsQ0FBQztPQUNqRCxDQUFDLENBQUM7QUFDSCxZQUFLLGNBQWMsQ0FBQyxHQUFHLENBQUMseUJBQXlCLENBQUMsQ0FBQztBQUNuRCxZQUFLLGNBQWMsQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsQ0FBQztLQUM5QyxDQUFDLENBQUMsQ0FBQztBQUNKLFFBQUksQ0FBQyxrQkFBa0IsR0FBRyxFQUFFLENBQUM7QUFDN0IsUUFBSSxDQUFDLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDdEQsUUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsR0FBRywyQkFBMkIsQ0FBQztBQUM5RCxRQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztBQUNwQixRQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztHQUM1Qjs7ZUEzQkcsZUFBZTs7V0E2QkEsK0JBQUc7QUFDcEIsa0JBQVksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDbEMsVUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7S0FDNUI7OztXQUVlLDBCQUFDLENBQWEsRUFBRSxNQUFrQixFQUFFLFVBQW1CLEVBQUU7OztBQUN2RSxVQUFJLElBQUksQ0FBQyxjQUFjLEVBQUU7QUFDdkIsWUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7T0FDNUI7QUFDRCxVQUFJLENBQUMsY0FBYyxHQUFHLFVBQVUsQ0FBQyxZQUFNO0FBQ3JDLGVBQUssY0FBYyxHQUFHLElBQUksQ0FBQztBQUMzQixZQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRTs7QUFFekIsaUJBQU87U0FDUjs7QUFFRCxZQUFJLGNBQWMsR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFDLDJCQUEyQixDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pFLFlBQUksUUFBUSxHQUFHLE1BQU0sQ0FBQywrQkFBK0IsQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUN0RSxlQUFLLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztPQUMxQyxFQUFFLGlCQUFpQixDQUFDLENBQUM7S0FDdkI7Ozs2QkFFc0IsV0FBQyxNQUFrQixFQUFFLFFBQWUsRUFBVzsrQkFDbEQsTUFBTSxDQUFDLFVBQVUsRUFBRTs7VUFBaEMsU0FBUyxzQkFBVCxTQUFTOztBQUNkLFVBQUksaUJBQWlCLEdBQUcsSUFBSSxDQUFDLGlDQUFpQyxDQUFDLFNBQVMsQ0FBQyxDQUFDOztBQUUxRSxVQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7QUFDaEIsWUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUN2QixZQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztPQUNyQjs7QUFFRCxVQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxFQUFFO0FBQzdCLGVBQU87T0FDUjs7QUFFRCxVQUFJLFFBQVEsR0FBRyxNQUFNLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDckUsVUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO0FBQzdCLGVBQU87T0FDUjs7VUFFSSxJQUFJLEdBQVcsUUFBUSxDQUF2QixJQUFJO1VBQUUsS0FBSyxHQUFJLFFBQVEsQ0FBakIsS0FBSzs7O0FBRWhCLFVBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsRUFBQyxVQUFVLEVBQUUsT0FBTyxFQUFDLENBQUMsQ0FBQzs7Ozs7QUFLcEUsVUFBSSxnQkFBZ0IsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztBQUM3RCxVQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxFQUFHLGdCQUFnQixHQUFHLE1BQU0sQ0FBQyxtQkFBbUIsRUFBRSxDQUFBLEdBQUssSUFBSSxDQUFDO0FBQy9GLFVBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLEVBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxxQkFBcUIsRUFBRSxDQUFBLEdBQUksSUFBSSxDQUFDO0FBQ2hGLFVBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO0FBQ3pDLFlBQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFDLENBQUMsQ0FBQztLQUN2Rzs7O1dBRWdDLDJDQUFDLFNBQWlCLEVBQTJCO0FBQzVFLGFBQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxVQUFDLFFBQVEsRUFBdUI7QUFDcEUsWUFBSSxnQkFBZ0IsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN0RCxlQUFPLFFBQVEsQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLElBQUksZ0JBQWdCLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO09BQ3JGLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQyxTQUFTLEVBQW9CLFNBQVMsRUFBdUI7QUFDcEUsZUFBTyxTQUFTLENBQUMsaUJBQWlCLEdBQUcsU0FBUyxDQUFDLGlCQUFpQixDQUFDO09BQ2xFLENBQUMsQ0FBQztLQUNKOzs7V0FFVSxxQkFBQyxRQUEwQixFQUFFO0FBQ3RDLFVBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDeEM7OztXQUVNLG1CQUFHO0FBQ1IsVUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFO0FBQ3ZCLFlBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDOUIsWUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7T0FDNUI7S0FDRjs7O1NBckdHLGVBQWU7OztBQXdHckIsTUFBTSxDQUFDLE9BQU8sR0FBRyxlQUFlLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL251Y2xpZGUtdHlwZS1oaW50L2xpYi9UeXBlSGludE1hbmFnZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGV9ID0gcmVxdWlyZSgnYXRvbScpO1xuXG5jb25zdCBUWVBFSElOVF9ERUxBWV9NUyA9IDIwMDtcblxudHlwZSBUeXBlSGludCA9IHtcbiAgaGludDogc3RyaW5nO1xuICByYW5nZTogUmFuZ2U7XG59O1xuXG50eXBlIFR5cGVIaW50UHJvdmlkZXIgPSB7XG4gIHR5cGVIaW50KGVkaXRvcjogVGV4dEVkaXRvciwgYnVmZmVyUG9zaXRpb246IFBvaW50KTogUHJvbWlzZTxUeXBlSGludD47XG59O1xuXG5jbGFzcyBUeXBlSGludE1hbmFnZXIge1xuXG4gIF90eXBlSGludFByb3ZpZGVyczogQXJyYXk8VHlwZUhpbnRQcm92aWRlcj47XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgLy8gVE9ETyhtb3N0KTogUmVwbGFjZSB3aXRoIEBqamlhYSdzIG1vdXNlTGlzdGVuZXJGb3JUZXh0RWRpdG9yIGludHJvZHVjZWQgaW4gRDIwMDU1NDUuXG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVRleHRFZGl0b3JzKGVkaXRvciA9PiB7XG4gICAgICB2YXIgZWRpdG9yVmlldyA9IGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpO1xuICAgICAgdmFyIG1vdXNlTW92ZUxpc3RlbmVyID0gKGUpID0+IHRoaXMuX2RlbGF5ZWRUeXBlSGludChlLCBlZGl0b3IsIGVkaXRvclZpZXcpO1xuICAgICAgZWRpdG9yVmlldy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBtb3VzZU1vdmVMaXN0ZW5lcik7XG4gICAgICB2YXIgbW91c2VMaXN0ZW5lclN1YnNjcmlwdGlvbiA9IG5ldyBEaXNwb3NhYmxlKCgpID0+XG4gICAgICAgICAgZWRpdG9yVmlldy5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBtb3VzZU1vdmVMaXN0ZW5lcikpO1xuICAgICAgdmFyIGRlc3Ryb3lTdWJzY3JpcHRpb24gPSBlZGl0b3Iub25EaWREZXN0cm95KCgpID0+IHtcbiAgICAgICAgdGhpcy5fY2xlYXJUeXBlSGludFRpbWVyKCk7XG4gICAgICAgIG1vdXNlTGlzdGVuZXJTdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xuICAgICAgICB0aGlzLl9zdWJzY3JpcHRpb25zLnJlbW92ZShtb3VzZUxpc3RlbmVyU3Vic2NyaXB0aW9uKTtcbiAgICAgICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5yZW1vdmUoZGVzdHJveVN1YnNjcmlwdGlvbik7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuYWRkKG1vdXNlTGlzdGVuZXJTdWJzY3JpcHRpb24pO1xuICAgICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQoZGVzdHJveVN1YnNjcmlwdGlvbik7XG4gICAgfSkpO1xuICAgIHRoaXMuX3R5cGVIaW50UHJvdmlkZXJzID0gW107XG4gICAgdGhpcy5fdHlwZUhpbnRFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5fdHlwZUhpbnRFbGVtZW50LmNsYXNzTmFtZSA9ICdudWNsaWRlLXR5cGUtaGludC1vdmVybGF5JztcbiAgICB0aGlzLl9tYXJrZXIgPSBudWxsO1xuICAgIHRoaXMuX3R5cGVIaW50VGltZXIgPSBudWxsO1xuICB9XG5cbiAgX2NsZWFyVHlwZUhpbnRUaW1lcigpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5fdHlwZUhpbnRUaW1lcik7XG4gICAgdGhpcy5fdHlwZUhpbnRUaW1lciA9IG51bGw7XG4gIH1cblxuICBfZGVsYXllZFR5cGVIaW50KGU6IE1vdXNlRXZlbnQsIGVkaXRvcjogVGV4dEVkaXRvciwgZWRpdG9yVmlldzogRE9NTm9kZSkge1xuICAgIGlmICh0aGlzLl90eXBlSGludFRpbWVyKSB7XG4gICAgICB0aGlzLl9jbGVhclR5cGVIaW50VGltZXIoKTtcbiAgICB9XG4gICAgdGhpcy5fdHlwZUhpbnRUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5fdHlwZUhpbnRUaW1lciA9IG51bGw7XG4gICAgICBpZiAoIWVkaXRvclZpZXcuY29tcG9uZW50KSB7XG4gICAgICAgIC8vIFRoZSBlZGl0b3Igd2FzIGRlc3Ryb3llZCwgYnV0IHRoZSBkZXN0cm95IGhhbmRsZXIgaGF2ZW4ndCB5ZXQgYmVlbiBjYWxsZWQgdG8gY2FuY2VsIHRoZSB0aW1lci5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgLy8gRGVsYXkgYSBiaXQgKyBDYW5jZWwgYW5kIHNjaGVkdWxlIGFub3RoZXIgdXBkYXRlIGlmIHRoZSBtb3VzZSBrZWVwcyBtb3ZpbmcuXG4gICAgICB2YXIgc2NyZWVuUG9zaXRpb24gPSBlZGl0b3JWaWV3LmNvbXBvbmVudC5zY3JlZW5Qb3NpdGlvbkZvck1vdXNlRXZlbnQoZSk7XG4gICAgICB2YXIgcG9zaXRpb24gPSBlZGl0b3IuYnVmZmVyUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihzY3JlZW5Qb3NpdGlvbik7XG4gICAgICB0aGlzLl90eXBlSGludEluRWRpdG9yKGVkaXRvciwgcG9zaXRpb24pO1xuICAgIH0sIFRZUEVISU5UX0RFTEFZX01TKTtcbiAgfVxuXG4gIGFzeW5jIF90eXBlSGludEluRWRpdG9yKGVkaXRvcjogVGV4dEVkaXRvciwgcG9zaXRpb246IFBvaW50KTogUHJvbWlzZSB7XG4gICAgdmFyIHtzY29wZU5hbWV9ID0gZWRpdG9yLmdldEdyYW1tYXIoKTtcbiAgICB2YXIgbWF0Y2hpbmdQcm92aWRlcnMgPSB0aGlzLl9nZXRNYXRjaGluZ1Byb3ZpZGVyc0ZvclNjb3BlTmFtZShzY29wZU5hbWUpO1xuXG4gICAgaWYgKHRoaXMuX21hcmtlcikge1xuICAgICAgdGhpcy5fbWFya2VyLmRlc3Ryb3koKTtcbiAgICAgIHRoaXMuX21hcmtlciA9IG51bGw7XG4gICAgfVxuXG4gICAgaWYgKCFtYXRjaGluZ1Byb3ZpZGVycy5sZW5ndGgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgdHlwZUhpbnQgPSBhd2FpdCBtYXRjaGluZ1Byb3ZpZGVyc1swXS50eXBlSGludChlZGl0b3IsIHBvc2l0aW9uKTtcbiAgICBpZiAoIXR5cGVIaW50IHx8IHRoaXMuX21hcmtlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciB7aGludCwgcmFuZ2V9ID0gdHlwZUhpbnQ7XG4gICAgLy8gVHJhbnNmb3JtIHRoZSBtYXRjaGVkIGVsZW1lbnQgcmFuZ2UgdG8gdGhlIGhpbnQgcmFuZ2UuXG4gICAgdGhpcy5fbWFya2VyID0gZWRpdG9yLm1hcmtCdWZmZXJSYW5nZShyYW5nZSwge2ludmFsaWRhdGU6ICduZXZlcid9KTtcblxuICAgIC8vIFRoaXMgcmVsYXRpdmUgcG9zaXRpb25pbmcgaXMgdG8gd29yayBhcm91bmQgdGhlIGlzc3VlIHRoYXQgYHBvc2l0aW9uOiAnaGVhZCdgXG4gICAgLy8gZG9lc24ndCB3b3JrIGZvciBvdmVybGF5IGRlY29yYXRvcnMgYXJlIHJlbmRlcmVkIG9uIHRoZSBib3R0b20gcmlnaHQgb2YgdGhlIGdpdmVuIHJhbmdlLlxuICAgIC8vIEF0b20gaXNzdWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2F0b20vaXNzdWVzLzY2OTVcbiAgICB2YXIgZXhwcmVzc2lvbkxlbmd0aCA9IHJhbmdlLmVuZC5jb2x1bW4gLSByYW5nZS5zdGFydC5jb2x1bW47XG4gICAgdGhpcy5fdHlwZUhpbnRFbGVtZW50LnN0eWxlLmxlZnQgPSAtIChleHByZXNzaW9uTGVuZ3RoICogZWRpdG9yLmdldERlZmF1bHRDaGFyV2lkdGgoKSkgKyAgJ3B4JztcbiAgICB0aGlzLl90eXBlSGludEVsZW1lbnQuc3R5bGUudG9wID0gLSAoMiAqIGVkaXRvci5nZXRMaW5lSGVpZ2h0SW5QaXhlbHMoKSkgKyAncHgnO1xuICAgIHRoaXMuX3R5cGVIaW50RWxlbWVudC50ZXh0Q29udGVudCA9IGhpbnQ7XG4gICAgZWRpdG9yLmRlY29yYXRlTWFya2VyKHRoaXMuX21hcmtlciwge3R5cGU6ICdvdmVybGF5JywgcG9zaXRpb246ICdoZWFkJywgaXRlbTogdGhpcy5fdHlwZUhpbnRFbGVtZW50fSk7XG4gIH1cblxuICBfZ2V0TWF0Y2hpbmdQcm92aWRlcnNGb3JTY29wZU5hbWUoc2NvcGVOYW1lOiBzdHJpbmcpOiBBcnJheTxUeXBlSGludFByb3ZpZGVyPiB7XG4gICAgcmV0dXJuIHRoaXMuX3R5cGVIaW50UHJvdmlkZXJzLmZpbHRlcigocHJvdmlkZXI6IFR5cGVIaW50UHJvdmlkZXIpID0+IHtcbiAgICAgIHZhciBwcm92aWRlckdyYW1tYXJzID0gcHJvdmlkZXIuc2VsZWN0b3Iuc3BsaXQoLywgPy8pO1xuICAgICAgcmV0dXJuIHByb3ZpZGVyLmluY2x1c2lvblByaW9yaXR5ID4gMCAmJiBwcm92aWRlckdyYW1tYXJzLmluZGV4T2Yoc2NvcGVOYW1lKSAhPT0gLTE7XG4gICAgfSkuc29ydCgocHJvdmlkZXJBOiBUeXBlSGludFByb3ZpZGVyLCBwcm92aWRlckI6IFR5cGVIaW50UHJvdmlkZXIpID0+IHtcbiAgICAgIHJldHVybiBwcm92aWRlckEuaW5jbHVzaW9uUHJpb3JpdHkgPCBwcm92aWRlckIuaW5jbHVzaW9uUHJpb3JpdHk7XG4gICAgfSk7XG4gIH1cblxuICBhZGRQcm92aWRlcihwcm92aWRlcjogVHlwZUhpbnRQcm92aWRlcikge1xuICAgIHRoaXMuX3R5cGVIaW50UHJvdmlkZXJzLnB1c2gocHJvdmlkZXIpO1xuICB9XG5cbiAgZGlzcG9zZSgpIHtcbiAgICBpZiAodGhpcy5fc3Vic2NyaXB0aW9ucykge1xuICAgICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5kaXNwb3NlKCk7XG4gICAgICB0aGlzLl9zdWJzY3JpcHRpb25zID0gbnVsbDtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBUeXBlSGludE1hbmFnZXI7XG4iXX0=