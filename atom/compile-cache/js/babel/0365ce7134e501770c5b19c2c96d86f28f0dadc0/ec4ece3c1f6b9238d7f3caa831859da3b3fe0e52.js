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

var logger = null;

function getLogger() {
  return logger || (logger = require('nuclide-logging').getLogger());
}

var FileWatcher = (function () {
  function FileWatcher(editor) {
    var _this = this;

    _classCallCheck(this, FileWatcher);

    this._editor = editor;
    this._subscriptions = new CompositeDisposable();
    if (this._editor == null) {
      getLogger().warn('No editor instance on this._editor');
      return;
    }
    this._subscriptions.add(this._editor.onDidConflict(function () {
      if (_this._shouldPromptToReload()) {
        getLogger().info('Conflict at file: ' + _this._editor.getPath());
        _this._promptReload();
      }
    }));
  }

  _createClass(FileWatcher, [{
    key: '_shouldPromptToReload',
    value: function _shouldPromptToReload() {
      return this._editor.getBuffer().isInConflict();
    }
  }, {
    key: '_promptReload',
    value: _asyncToGenerator(function* () {
      var _require2 = require('nuclide-remote-uri');

      var getPath = _require2.getPath;
      var basename = _require2.basename;

      var filePath = this._editor.getPath();
      var encoding = this._editor.getEncoding();
      var fileName = basename(filePath);
      var choice = atom.confirm({
        message: fileName + ' has changed on disk.',
        buttons: ['Reload', 'Compare', 'Ignore']
      });
      if (choice === 2) {
        return;
      }
      if (choice === 0) {
        var buffer = this._editor.getBuffer();
        if (buffer) {
          buffer.reload();
        }
        return;
      }

      var _require3 = require('nuclide-client');

      var getClient = _require3.getClient;

      var client = getClient(filePath);
      if (!client) {
        getLogger().error('[file-watcher]: No client found for path:', filePath);
        return;
      }

      // Load the file contents locally or remotely.
      var localFilePath = getPath(filePath);
      var filesystemContents = yield client.readFile(localFilePath, encoding);

      // Open a right split pane to compare the contents.
      // TODO: We can use the diff-view here when ready.
      var splitEditor = yield atom.workspace.open(null, { split: 'right' });

      splitEditor.insertText(filesystemContents);
      splitEditor.setGrammar(this._editor.getGrammar());
    })
  }, {
    key: 'destroy',
    value: function destroy() {
      if (!this._subscriptions) {
        return;
      }
      this._subscriptions.dispose();
      this._subscriptions = null;
    }
  }]);

  return FileWatcher;
})();

module.exports = FileWatcher;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtd2F0Y2hlci9saWIvRmlsZVdhdGNoZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7ZUFXZ0IsT0FBTyxDQUFDLE1BQU0sQ0FBQzs7SUFBdEMsbUJBQW1CLFlBQW5CLG1CQUFtQjs7QUFDeEIsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDOztBQUVsQixTQUFTLFNBQVMsR0FBRztBQUNuQixTQUFPLE1BQU0sS0FBSyxNQUFNLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUMsU0FBUyxFQUFFLENBQUEsQ0FBRTtDQUNwRTs7SUFFSyxXQUFXO0FBS0osV0FMUCxXQUFXLENBS0gsTUFBa0IsRUFBRTs7OzBCQUw1QixXQUFXOztBQU1iLFFBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDO0FBQ3RCLFFBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxtQkFBbUIsRUFBRSxDQUFDO0FBQ2hELFFBQUksSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLEVBQUU7QUFDeEIsZUFBUyxFQUFFLENBQUMsSUFBSSxDQUFDLG9DQUFvQyxDQUFDLENBQUM7QUFDdkQsYUFBTztLQUNSO0FBQ0QsUUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsWUFBTTtBQUN2RCxVQUFJLE1BQUsscUJBQXFCLEVBQUUsRUFBRTtBQUNoQyxpQkFBUyxFQUFFLENBQUMsSUFBSSxDQUFDLG9CQUFvQixHQUFHLE1BQUssT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7QUFDaEUsY0FBSyxhQUFhLEVBQUUsQ0FBQztPQUN0QjtLQUNGLENBQUMsQ0FBQyxDQUFDO0dBQ0w7O2VBbEJHLFdBQVc7O1dBb0JNLGlDQUFZO0FBQy9CLGFBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztLQUNoRDs7OzZCQUVrQixhQUFZO3NCQUNILE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQzs7VUFBbEQsT0FBTyxhQUFQLE9BQU87VUFBRSxRQUFRLGFBQVIsUUFBUTs7QUFFdEIsVUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUN0QyxVQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQzFDLFVBQUksUUFBUSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNsQyxVQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO0FBQ3hCLGVBQU8sRUFBRSxRQUFRLEdBQUcsdUJBQXVCO0FBQzNDLGVBQU8sRUFBRSxDQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsUUFBUSxDQUFDO09BQ3pDLENBQUMsQ0FBQztBQUNILFVBQUksTUFBTSxLQUFLLENBQUMsRUFBRTtBQUNoQixlQUFPO09BQ1I7QUFDRCxVQUFJLE1BQU0sS0FBSyxDQUFDLEVBQUU7QUFDaEIsWUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUN0QyxZQUFJLE1BQU0sRUFBRTtBQUNWLGdCQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDakI7QUFDRCxlQUFPO09BQ1I7O3NCQUVpQixPQUFPLENBQUMsZ0JBQWdCLENBQUM7O1VBQXRDLFNBQVMsYUFBVCxTQUFTOztBQUVkLFVBQUksTUFBTSxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNqQyxVQUFJLENBQUMsTUFBTSxFQUFFO0FBQ1gsaUJBQVMsRUFBRSxDQUFDLEtBQUssQ0FBQywyQ0FBMkMsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUN6RSxlQUFPO09BQ1I7OztBQUdELFVBQUksYUFBYSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUN0QyxVQUFJLGtCQUFrQixHQUFHLE1BQU0sTUFBTSxDQUFDLFFBQVEsQ0FBQyxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUM7Ozs7QUFJeEUsVUFBSSxXQUFXLEdBQUcsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBQyxLQUFLLEVBQUUsT0FBTyxFQUFDLENBQUMsQ0FBQzs7QUFFcEUsaUJBQVcsQ0FBQyxVQUFVLENBQUMsa0JBQWtCLENBQUMsQ0FBQztBQUMzQyxpQkFBVyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7S0FDbkQ7OztXQUVNLG1CQUFHO0FBQ1IsVUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUU7QUFDeEIsZUFBTztPQUNSO0FBQ0QsVUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUM5QixVQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztLQUM1Qjs7O1NBdkVHLFdBQVc7OztBQTBFakIsTUFBTSxDQUFDLE9BQU8sR0FBRyxXQUFXLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL251Y2xpZGUtZmlsZS13YXRjaGVyL2xpYi9GaWxlV2F0Y2hlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbnZhciB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlKCdhdG9tJyk7XG52YXIgbG9nZ2VyID0gbnVsbDtcblxuZnVuY3Rpb24gZ2V0TG9nZ2VyKCkge1xuICByZXR1cm4gbG9nZ2VyIHx8IChsb2dnZXIgPSByZXF1aXJlKCdudWNsaWRlLWxvZ2dpbmcnKS5nZXRMb2dnZXIoKSk7XG59XG5cbmNsYXNzIEZpbGVXYXRjaGVyIHtcblxuICBfZWRpdG9yOiBUZXh0RWRpdG9yO1xuICBfc3Vic2NyaXB0aW9uczogQ29tcG9zaXRlRGlzcG9zYWJsZTtcblxuICBjb25zdHJ1Y3RvcihlZGl0b3I6IFRleHRFZGl0b3IpIHtcbiAgICB0aGlzLl9lZGl0b3IgPSBlZGl0b3I7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgaWYgKHRoaXMuX2VkaXRvciA9PSBudWxsKSB7XG4gICAgICBnZXRMb2dnZXIoKS53YXJuKCdObyBlZGl0b3IgaW5zdGFuY2Ugb24gdGhpcy5fZWRpdG9yJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuYWRkKHRoaXMuX2VkaXRvci5vbkRpZENvbmZsaWN0KCgpID0+IHtcbiAgICAgIGlmICh0aGlzLl9zaG91bGRQcm9tcHRUb1JlbG9hZCgpKSB7XG4gICAgICAgIGdldExvZ2dlcigpLmluZm8oJ0NvbmZsaWN0IGF0IGZpbGU6ICcgKyB0aGlzLl9lZGl0b3IuZ2V0UGF0aCgpKTtcbiAgICAgICAgdGhpcy5fcHJvbXB0UmVsb2FkKCk7XG4gICAgICB9XG4gICAgfSkpO1xuICB9XG5cbiAgX3Nob3VsZFByb21wdFRvUmVsb2FkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9lZGl0b3IuZ2V0QnVmZmVyKCkuaXNJbkNvbmZsaWN0KCk7XG4gIH1cblxuICBhc3luYyBfcHJvbXB0UmVsb2FkKCk6IFByb21pc2Uge1xuICAgIHZhciB7Z2V0UGF0aCwgYmFzZW5hbWV9ID0gcmVxdWlyZSgnbnVjbGlkZS1yZW1vdGUtdXJpJyk7XG5cbiAgICB2YXIgZmlsZVBhdGggPSB0aGlzLl9lZGl0b3IuZ2V0UGF0aCgpO1xuICAgIHZhciBlbmNvZGluZyA9IHRoaXMuX2VkaXRvci5nZXRFbmNvZGluZygpO1xuICAgIHZhciBmaWxlTmFtZSA9IGJhc2VuYW1lKGZpbGVQYXRoKTtcbiAgICB2YXIgY2hvaWNlID0gYXRvbS5jb25maXJtKHtcbiAgICAgIG1lc3NhZ2U6IGZpbGVOYW1lICsgJyBoYXMgY2hhbmdlZCBvbiBkaXNrLicsXG4gICAgICBidXR0b25zOiBbJ1JlbG9hZCcsICdDb21wYXJlJywgJ0lnbm9yZSddLFxuICAgIH0pO1xuICAgIGlmIChjaG9pY2UgPT09IDIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGNob2ljZSA9PT0gMCkge1xuICAgICAgdmFyIGJ1ZmZlciA9IHRoaXMuX2VkaXRvci5nZXRCdWZmZXIoKTtcbiAgICAgIGlmIChidWZmZXIpIHtcbiAgICAgICAgYnVmZmVyLnJlbG9hZCgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciB7Z2V0Q2xpZW50fSA9IHJlcXVpcmUoJ251Y2xpZGUtY2xpZW50Jyk7XG5cbiAgICB2YXIgY2xpZW50ID0gZ2V0Q2xpZW50KGZpbGVQYXRoKTtcbiAgICBpZiAoIWNsaWVudCkge1xuICAgICAgZ2V0TG9nZ2VyKCkuZXJyb3IoJ1tmaWxlLXdhdGNoZXJdOiBObyBjbGllbnQgZm91bmQgZm9yIHBhdGg6JywgZmlsZVBhdGgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIExvYWQgdGhlIGZpbGUgY29udGVudHMgbG9jYWxseSBvciByZW1vdGVseS5cbiAgICB2YXIgbG9jYWxGaWxlUGF0aCA9IGdldFBhdGgoZmlsZVBhdGgpO1xuICAgIHZhciBmaWxlc3lzdGVtQ29udGVudHMgPSBhd2FpdCBjbGllbnQucmVhZEZpbGUobG9jYWxGaWxlUGF0aCwgZW5jb2RpbmcpO1xuXG4gICAgLy8gT3BlbiBhIHJpZ2h0IHNwbGl0IHBhbmUgdG8gY29tcGFyZSB0aGUgY29udGVudHMuXG4gICAgLy8gVE9ETzogV2UgY2FuIHVzZSB0aGUgZGlmZi12aWV3IGhlcmUgd2hlbiByZWFkeS5cbiAgICB2YXIgc3BsaXRFZGl0b3IgPSBhd2FpdCBhdG9tLndvcmtzcGFjZS5vcGVuKG51bGwsIHtzcGxpdDogJ3JpZ2h0J30pO1xuXG4gICAgc3BsaXRFZGl0b3IuaW5zZXJ0VGV4dChmaWxlc3lzdGVtQ29udGVudHMpO1xuICAgIHNwbGl0RWRpdG9yLnNldEdyYW1tYXIodGhpcy5fZWRpdG9yLmdldEdyYW1tYXIoKSk7XG4gIH1cblxuICBkZXN0cm95KCkge1xuICAgIGlmICghdGhpcy5fc3Vic2NyaXB0aW9ucykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKTtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zID0gbnVsbDtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBGaWxlV2F0Y2hlcjtcbiJdfQ==