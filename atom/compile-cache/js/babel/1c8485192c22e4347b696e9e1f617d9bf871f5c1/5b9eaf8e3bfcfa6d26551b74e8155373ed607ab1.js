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

var _require = require('atom');

var CompositeDisposable = _require.CompositeDisposable;

var SyncScroll = (function () {
  function SyncScroll(editor1, editor2) {
    var _this = this;

    _classCallCheck(this, SyncScroll);

    this._subscriptions = new CompositeDisposable();
    this._syncInfo = [{
      editor: editor1,
      scrolling: false
    }, {
      editor: editor2,
      scrolling: false
    }];

    this._syncInfo.forEach(function (editorInfo, i) {
      // Note that `onDidChangeScrollTop` isn't technically in the public API.
      _this._subscriptions.add(editorInfo.editor.onDidChangeScrollTop(function () {
        return _this._scrollPositionChanged(i);
      }));
    });
  }

  _createClass(SyncScroll, [{
    key: '_scrollPositionChanged',
    value: function _scrollPositionChanged(changeScrollIndex) {
      var thisInfo = this._syncInfo[changeScrollIndex];
      var otherInfo = this._syncInfo[1 - changeScrollIndex];
      if (thisInfo.scrolling) {
        return;
      }
      var thisEditor = thisInfo.editor;
      var otherEditor = otherInfo.editor;

      otherInfo.scrolling = true;
      otherEditor.setScrollTop(thisEditor.getScrollTop());
      otherInfo.scrolling = false;
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

  return SyncScroll;
})();

module.exports = SyncScroll;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWRpZmYtdmlldy9saWIvU3luY1Njcm9sbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7ZUFXZ0IsT0FBTyxDQUFDLE1BQU0sQ0FBQzs7SUFBdEMsbUJBQW1CLFlBQW5CLG1CQUFtQjs7SUFFbEIsVUFBVTtBQUVILFdBRlAsVUFBVSxDQUVGLE9BQW1CLEVBQUUsT0FBbUIsRUFBRTs7OzBCQUZsRCxVQUFVOztBQUdaLFFBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxtQkFBbUIsRUFBRSxDQUFDO0FBQ2hELFFBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQztBQUNoQixZQUFNLEVBQUUsT0FBTztBQUNmLGVBQVMsRUFBRSxLQUFLO0tBQ2pCLEVBQUU7QUFDRCxZQUFNLEVBQUUsT0FBTztBQUNmLGVBQVMsRUFBRSxLQUFLO0tBQ2pCLENBQUMsQ0FBQzs7QUFFSCxRQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxVQUFDLFVBQVUsRUFBRSxDQUFDLEVBQUs7O0FBRXhDLFlBQUssY0FBYyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDO2VBQU0sTUFBSyxzQkFBc0IsQ0FBQyxDQUFDLENBQUM7T0FBQSxDQUFDLENBQUMsQ0FBQztLQUN2RyxDQUFDLENBQUM7R0FDSjs7ZUFoQkcsVUFBVTs7V0FrQlEsZ0NBQUMsaUJBQXlCLEVBQVE7QUFDdEQsVUFBSSxRQUFRLEdBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQ2xELFVBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLGlCQUFpQixDQUFDLENBQUM7QUFDdEQsVUFBSSxRQUFRLENBQUMsU0FBUyxFQUFFO0FBQ3RCLGVBQU87T0FDUjtVQUNZLFVBQVUsR0FBSSxRQUFRLENBQTlCLE1BQU07VUFDRSxXQUFXLEdBQUksU0FBUyxDQUFoQyxNQUFNOztBQUNYLGVBQVMsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO0FBQzNCLGlCQUFXLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO0FBQ3BELGVBQVMsQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO0tBQzdCOzs7V0FFTSxtQkFBUztBQUNkLFVBQUksSUFBSSxDQUFDLGNBQWMsRUFBRTtBQUN2QixZQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQzlCLFlBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO09BQzVCO0tBQ0Y7OztTQXBDRyxVQUFVOzs7QUF1Q2hCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsVUFBVSxDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWRpZmYtdmlldy9saWIvU3luY1Njcm9sbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbnZhciB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlKCdhdG9tJyk7XG5cbmNsYXNzIFN5bmNTY3JvbGwge1xuXG4gIGNvbnN0cnVjdG9yKGVkaXRvcjE6IFRleHRFZGl0b3IsIGVkaXRvcjI6IFRleHRFZGl0b3IpIHtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICB0aGlzLl9zeW5jSW5mbyA9IFt7XG4gICAgICBlZGl0b3I6IGVkaXRvcjEsXG4gICAgICBzY3JvbGxpbmc6IGZhbHNlLFxuICAgIH0sIHtcbiAgICAgIGVkaXRvcjogZWRpdG9yMixcbiAgICAgIHNjcm9sbGluZzogZmFsc2UsXG4gICAgfV07XG5cbiAgICB0aGlzLl9zeW5jSW5mby5mb3JFYWNoKChlZGl0b3JJbmZvLCBpKSA9PiB7XG4gICAgICAvLyBOb3RlIHRoYXQgYG9uRGlkQ2hhbmdlU2Nyb2xsVG9wYCBpc24ndCB0ZWNobmljYWxseSBpbiB0aGUgcHVibGljIEFQSS5cbiAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuYWRkKGVkaXRvckluZm8uZWRpdG9yLm9uRGlkQ2hhbmdlU2Nyb2xsVG9wKCgpID0+IHRoaXMuX3Njcm9sbFBvc2l0aW9uQ2hhbmdlZChpKSkpO1xuICAgIH0pO1xuICB9XG5cbiAgX3Njcm9sbFBvc2l0aW9uQ2hhbmdlZChjaGFuZ2VTY3JvbGxJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gICAgdmFyIHRoaXNJbmZvICA9IHRoaXMuX3N5bmNJbmZvW2NoYW5nZVNjcm9sbEluZGV4XTtcbiAgICB2YXIgb3RoZXJJbmZvID0gdGhpcy5fc3luY0luZm9bMSAtIGNoYW5nZVNjcm9sbEluZGV4XTtcbiAgICBpZiAodGhpc0luZm8uc2Nyb2xsaW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB7ZWRpdG9yOiB0aGlzRWRpdG9yfSA9IHRoaXNJbmZvO1xuICAgIHZhciB7ZWRpdG9yOiBvdGhlckVkaXRvcn0gPSBvdGhlckluZm87XG4gICAgb3RoZXJJbmZvLnNjcm9sbGluZyA9IHRydWU7XG4gICAgb3RoZXJFZGl0b3Iuc2V0U2Nyb2xsVG9wKHRoaXNFZGl0b3IuZ2V0U2Nyb2xsVG9wKCkpO1xuICAgIG90aGVySW5mby5zY3JvbGxpbmcgPSBmYWxzZTtcbiAgfVxuXG4gIGRpc3Bvc2UoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX3N1YnNjcmlwdGlvbnMpIHtcbiAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuZGlzcG9zZSgpO1xuICAgICAgdGhpcy5fc3Vic2NyaXB0aW9ucyA9IG51bGw7XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU3luY1Njcm9sbDtcbiJdfQ==