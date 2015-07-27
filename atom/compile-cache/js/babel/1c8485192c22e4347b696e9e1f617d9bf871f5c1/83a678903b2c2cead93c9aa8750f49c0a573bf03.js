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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXR5cGUtaGludC9saWIvVHlwZUhpbnRNYW5hZ2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7O2VBVzRCLE9BQU8sQ0FBQyxNQUFNLENBQUM7O0lBQWxELG1CQUFtQixZQUFuQixtQkFBbUI7SUFBRSxVQUFVLFlBQVYsVUFBVTs7QUFFcEMsSUFBTSxpQkFBaUIsR0FBRyxHQUFHLENBQUM7O0lBV3hCLGVBQWU7QUFJUixXQUpQLGVBQWUsR0FJTDs7OzBCQUpWLGVBQWU7O0FBS2pCLFFBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxtQkFBbUIsRUFBRSxDQUFDOztBQUVoRCxRQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLFVBQUEsTUFBTSxFQUFJO0FBQ2xFLFVBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzVDLFVBQUksaUJBQWlCLEdBQUcsU0FBcEIsaUJBQWlCLENBQUksQ0FBQztlQUFLLE1BQUssZ0JBQWdCLENBQUMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxVQUFVLENBQUM7T0FBQSxDQUFDO0FBQzVFLGdCQUFVLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLGlCQUFpQixDQUFDLENBQUM7QUFDNUQsVUFBSSx5QkFBeUIsR0FBRyxJQUFJLFVBQVUsQ0FBQztlQUMzQyxVQUFVLENBQUMsbUJBQW1CLENBQUMsV0FBVyxFQUFFLGlCQUFpQixDQUFDO09BQUEsQ0FBQyxDQUFDO0FBQ3BFLFVBQUksbUJBQW1CLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxZQUFNO0FBQ2xELGNBQUssbUJBQW1CLEVBQUUsQ0FBQztBQUMzQixpQ0FBeUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNwQyxjQUFLLGNBQWMs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O0tBQ0Y7OztTQXJHRyxlQUFlOzs7QUF3R3JCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsZUFBZSxDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXR5cGUtaGludC9saWIvVHlwZUhpbnRNYW5hZ2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxudmFyIHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlfSA9IHJlcXVpcmUoJ2F0b20nKTtcblxuY29uc3QgVFlQRUhJTlRfREVMQVlfTVMgPSAyMDA7XG5cbnR5cGUgVHlwZUhpbnQgPSB7XG4gIGhpbnQ6IHN0cmluZztcbiAgcmFuZ2U6IFJhbmdlO1xufTtcblxudHlwZSBUeXBlSGludFByb3ZpZGVyID0ge1xuICB0eXBlSGludChlZGl0b3I6IFRleHRFZGl0b3IsIGJ1ZmZlclBvc2l0aW9uOiBQb2ludCk6IFByb21pc2U8VHlwZUhpbnQ+O1xufTtcblxuY2xhc3MgVHlwZUhpbnRNYW5hZ2VyIHtcblxuICBfdHlwZUhpbnRQcm92aWRlcnM6IEFycmF5PFR5cGVIaW50UHJvdmlkZXI+O1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgIC8vIFRPRE8obW9zdCk6IFJlcGxhY2Ugd2l0aCBAamppYWEncyBtb3VzZUxpc3RlbmVyRm9yVGV4dEVkaXRvciBpbnRyb2R1Y2VkIGluIEQyMDA1NTQ1LlxuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuYWRkKGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycyhlZGl0b3IgPT4ge1xuICAgICAgdmFyIGVkaXRvclZpZXcgPSBhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKTtcbiAgICAgIHZhciBtb3VzZU1vdmVMaXN0ZW5lciA9IChlKSA9PiB0aGlzLl9kZWxheWVkVHlwZUhpbnQoZSwgZWRpdG9yLCBlZGl0b3JWaWV3KTtcbiAgICAgIGVkaXRvclZpZXcuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgbW91c2VNb3ZlTGlzdGVuZXIpO1xuICAgICAgdmFyIG1vdXNlTGlzdGVuZXJTdWJzY3JpcHRpb24gPSBuZXcgRGlzcG9zYWJsZSgoKSA9PlxuICAgICAgICAgIGVkaXRvclZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgbW91c2VNb3ZlTGlzdGVuZXIpKTtcbiAgICAgIHZhciBkZXN0cm95U3Vic2NyaXB0aW9uID0gZWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiB7XG4gICAgICAgIHRoaXMuX2NsZWFyVHlwZUhpbnRUaW1lcigpO1xuICAgICAgICBtb3VzZUxpc3RlbmVyU3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcbiAgICAgICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5yZW1vdmUobW91c2VMaXN0ZW5lclN1YnNjcmlwdGlvbik7XG4gICAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMucmVtb3ZlKGRlc3Ryb3lTdWJzY3JpcHRpb24pO1xuICAgICAgfSk7XG4gICAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmFkZChtb3VzZUxpc3RlbmVyU3Vic2NyaXB0aW9uKTtcbiAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuYWRkKGRlc3Ryb3lTdWJzY3JpcHRpb24pO1xuICAgIH0pKTtcbiAgICB0aGlzLl90eXBlSGludFByb3ZpZGVycyA9IFtdO1xuICAgIHRoaXMuX3R5cGVIaW50RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMuX3R5cGVIaW50RWxlbWVudC5jbGFzc05hbWUgPSAnbnVjbGlkZS10eXBlLWhpbnQtb3ZlcmxheSc7XG4gICAgdGhpcy5fbWFya2VyID0gbnVsbDtcbiAgICB0aGlzLl90eXBlSGludFRpbWVyID0gbnVsbDtcbiAgfVxuXG4gIF9jbGVhclR5cGVIaW50VGltZXIoKSB7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuX3R5cGVIaW50VGltZXIpO1xuICAgIHRoaXMuX3R5cGVIaW50VGltZXIgPSBudWxsO1xuICB9XG5cbiAgX2RlbGF5ZWRUeXBlSGludChlOiBNb3VzZUV2ZW50LCBlZGl0b3I6IFRleHRFZGl0b3IsIGVkaXRvclZpZXc6IERPTU5vZGUpIHtcbiAgICBpZiAodGhpcy5fdHlwZUhpbnRUaW1lcikge1xuICAgICAgdGhpcy5fY2xlYXJUeXBlSGludFRpbWVyKCk7XG4gICAgfVxuICAgIHRoaXMuX3R5cGVIaW50VGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuX3R5cGVIaW50VGltZXIgPSBudWxsO1xuICAgICAgaWYgKCFlZGl0b3JWaWV3LmNvbXBvbmVudCkge1xuICAgICAgICAvLyBUaGUgZWRpdG9yIHdhcyBkZXN0cm95ZWQsIGJ1dCB0aGUgZGVzdHJveSBoYW5kbGVyIGhhdmVuJ3QgeWV0IGJlZW4gY2FsbGVkIHRvIGNhbmNlbCB0aGUgdGltZXIuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIC8vIERlbGF5IGEgYml0ICsgQ2FuY2VsIGFuZCBzY2hlZHVsZSBhbm90aGVyIHVwZGF0ZSBpZiB0aGUgbW91c2Uga2VlcHMgbW92aW5nLlxuICAgICAgdmFyIHNjcmVlblBvc2l0aW9uID0gZWRpdG9yVmlldy5jb21wb25lbnQuc2NyZWVuUG9zaXRpb25Gb3JNb3VzZUV2ZW50KGUpO1xuICAgICAgdmFyIHBvc2l0aW9uID0gZWRpdG9yLmJ1ZmZlclBvc2l0aW9uRm9yU2NyZWVuUG9zaXRpb24oc2NyZWVuUG9zaXRpb24pO1xuICAgICAgdGhpcy5fdHlwZUhpbnRJbkVkaXRvcihlZGl0b3IsIHBvc2l0aW9uKTtcbiAgICB9LCBUWVBFSElOVF9ERUxBWV9NUyk7XG4gIH1cblxuICBhc3luYyBfdHlwZUhpbnRJbkVkaXRvcihlZGl0b3I6IFRleHRFZGl0b3IsIHBvc2l0aW9uOiBQb2ludCk6IFByb21pc2Uge1xuICAgIHZhciB7c2NvcGVOYW1lfSA9IGVkaXRvci5nZXRHcmFtbWFyKCk7XG4gICAgdmFyIG1hdGNoaW5nUHJvdmlkZXJzID0gdGhpcy5fZ2V0TWF0Y2hpbmdQcm92aWRlcnNGb3JTY29wZU5hbWUoc2NvcGVOYW1lKTtcblxuICAgIGlmICh0aGlzLl9tYXJrZXIpIHtcbiAgICAgIHRoaXMuX21hcmtlci5kZXN0cm95KCk7XG4gICAgICB0aGlzLl9tYXJrZXIgPSBudWxsO1xuICAgIH1cblxuICAgIGlmICghbWF0Y2hpbmdQcm92aWRlcnMubGVuZ3RoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHR5cGVIaW50ID0gYXdhaXQgbWF0Y2hpbmdQcm92aWRlcnNbMF0udHlwZUhpbnQoZWRpdG9yLCBwb3NpdGlvbik7XG4gICAgaWYgKCF0eXBlSGludCB8fCB0aGlzLl9tYXJrZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIge2hpbnQsIHJhbmdlfSA9IHR5cGVIaW50O1xuICAgIC8vIFRyYW5zZm9ybSB0aGUgbWF0Y2hlZCBlbGVtZW50IHJhbmdlIHRvIHRoZSBoaW50IHJhbmdlLlxuICAgIHRoaXMuX21hcmtlciA9IGVkaXRvci5tYXJrQnVmZmVyUmFuZ2UocmFuZ2UsIHtpbnZhbGlkYXRlOiAnbmV2ZXInfSk7XG5cbiAgICAvLyBUaGlzIHJlbGF0aXZlIHBvc2l0aW9uaW5nIGlzIHRvIHdvcmsgYXJvdW5kIHRoZSBpc3N1ZSB0aGF0IGBwb3NpdGlvbjogJ2hlYWQnYFxuICAgIC8vIGRvZXNuJ3Qgd29yayBmb3Igb3ZlcmxheSBkZWNvcmF0b3JzIGFyZSByZW5kZXJlZCBvbiB0aGUgYm90dG9tIHJpZ2h0IG9mIHRoZSBnaXZlbiByYW5nZS5cbiAgICAvLyBBdG9tIGlzc3VlOiBodHRwczovL2dpdGh1Yi5jb20vYXRvbS9hdG9tL2lzc3Vlcy82Njk1XG4gICAgdmFyIGV4cHJlc3Npb25MZW5ndGggPSByYW5nZS5lbmQuY29sdW1uIC0gcmFuZ2Uuc3RhcnQuY29sdW1uO1xuICAgIHRoaXMuX3R5cGVIaW50RWxlbWVudC5zdHlsZS5sZWZ0ID0gLSAoZXhwcmVzc2lvbkxlbmd0aCAqIGVkaXRvci5nZXREZWZhdWx0Q2hhcldpZHRoKCkpICsgICdweCc7XG4gICAgdGhpcy5fdHlwZUhpbnRFbGVtZW50LnN0eWxlLnRvcCA9IC0gKDIgKiBlZGl0b3IuZ2V0TGluZUhlaWdodEluUGl4ZWxzKCkpICsgJ3B4JztcbiAgICB0aGlzLl90eXBlSGludEVsZW1lbnQudGV4dENvbnRlbnQgPSBoaW50O1xuICAgIGVkaXRvci5kZWNvcmF0ZU1hcmtlcih0aGlzLl9tYXJrZXIsIHt0eXBlOiAnb3ZlcmxheScsIHBvc2l0aW9uOiAnaGVhZCcsIGl0ZW06IHRoaXMuX3R5cGVIaW50RWxlbWVudH0pO1xuICB9XG5cbiAgX2dldE1hdGNoaW5nUHJvdmlkZXJzRm9yU2NvcGVOYW1lKHNjb3BlTmFtZTogc3RyaW5nKTogQXJyYXk8VHlwZUhpbnRQcm92aWRlcj4ge1xuICAgIHJldHVybiB0aGlzLl90eXBlSGludFByb3ZpZGVycy5maWx0ZXIoKHByb3ZpZGVyOiBUeXBlSGludFByb3ZpZGVyKSA9PiB7XG4gICAgICB2YXIgcHJvdmlkZXJHcmFtbWFycyA9IHByb3ZpZGVyLnNlbGVjdG9yLnNwbGl0KC8sID8vKTtcbiAgICAgIHJldHVybiBwcm92aWRlci5pbmNsdXNpb25Qcmlvcml0eSA+IDAgJiYgcHJvdmlkZXJHcmFtbWFycy5pbmRleE9mKHNjb3BlTmFtZSkgIT09IC0xO1xuICAgIH0pLnNvcnQoKHByb3ZpZGVyQTogVHlwZUhpbnRQcm92aWRlciwgcHJvdmlkZXJCOiBUeXBlSGludFByb3ZpZGVyKSA9PiB7XG4gICAgICByZXR1cm4gcHJvdmlkZXJBLmluY2x1c2lvblByaW9yaXR5IDwgcHJvdmlkZXJCLmluY2x1c2lvblByaW9yaXR5O1xuICAgIH0pO1xuICB9XG5cbiAgYWRkUHJvdmlkZXIocHJvdmlkZXI6IFR5cGVIaW50UHJvdmlkZXIpIHtcbiAgICB0aGlzLl90eXBlSGludFByb3ZpZGVycy5wdXNoKHByb3ZpZGVyKTtcbiAgfVxuXG4gIGRpc3Bvc2UoKSB7XG4gICAgaWYgKHRoaXMuX3N1YnNjcmlwdGlvbnMpIHtcbiAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuZGlzcG9zZSgpO1xuICAgICAgdGhpcy5fc3Vic2NyaXB0aW9ucyA9IG51bGw7XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVHlwZUhpbnRNYW5hZ2VyO1xuIl19