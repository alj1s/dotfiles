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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtd2F0Y2hlci9saWIvRmlsZVdhdGNoZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7ZUFXZ0IsT0FBTyxDQUFDLE1BQU0sQ0FBQzs7SUFBdEMsbUJBQW1CLFlBQW5CLG1CQUFtQjs7QUFDeEIsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDOztBQUVsQixTQUFTLFNBQVMsR0FBRztBQUNuQixTQUFPLE1BQU0sS0FBSyxNQUFNLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUMsU0FBUyxFQUFFLENBQUEsQUFBQyxDQUFDO0NBQ3BFOztJQUVLLFdBQVc7QUFLSixXQUxQLFdBQVcsQ0FLSCxNQUFrQixFQUFFOzs7MEJBTDVCLFdBQVc7O0FBTWIsUUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7QUFDdEIsUUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLG1CQUFtQixFQUFFLENBQUM7QUFDaEQsUUFBSSxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksRUFBRTtBQUN4QixlQUFTLEVBQUUsQ0FBQyxJQUFJLENBQUMsb0NBQW9DLENBQUMsQ0FBQztBQUN2RCxhQUFPO0tBQ1I7QUFDRCxRQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxZQUFNO0FBQ3ZELFVBQUksTUFBSyxxQkFBcUIsRUFBRSxFQUFFO0FBQ2hDLGlCQUFTLEVBQUUsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsTUFBSyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztBQUNoRSxjQUFLLGFBQWEsRUFBRSxDQUFDO09BQ3RCO0tBQ0YsQ0FBQyxDQUFDLENBQUM7R0FDTDs7ZUFsQkcsV0FBVzs7V0FvQk0saUNBQVk7QUFDL0IsYUFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDO0tBQ2hEOzs7NkJBRWtCLGFBQVk7c0JBQ0gsT0FBTyxDQUFDLG9CQUFvQixDQUFDOztVQUFsRCxPQUFPLGFBQVAsT0FBTztVQUFFLFFBQVEsYUFBUixRQUFROztBQUV0QixVQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ3RDLFVBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDMUMsVUFBSSxRQUFRLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ2xDLFVBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7QUFDeEIsZUFBTyxFQUFFLFFBQVEsR0FBRyx1QkFBdUI7QUFDM0MsZUFBTyxFQUFFLENBQUMsUUFBUSxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUM7T0FDekMsQ0FBQyxDQUFDO0FBQ0gsVUFBSSxNQUFNLEtBQUssQ0FBQyxFQUFFO0FBQ2hCLGVBQU87T0FDUjtBQUNELFVBQUksTUFBTSxLQUFLLENBQUMsRUFBRTtBQUNoQixZQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQ3RDLFlBQUksTUFBTSxFQUFFO0FBQ1YsZ0JBQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUNqQjtBQUNELGVBQU87T0FDUjs7c0JBRWlCLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQzs7VUFBdEMsU0FBUyxhQUFULFNBQVM7O0FBRWQsVUFBSSxNQUFNLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ2pDLFVBQUksQ0FBQyxNQUFNLEVBQUU7QUFDWCxpQkFBUyxFQUFFLENBQUMsS0FBSyxDQUFDLDJDQUEyQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ3pFLGVBQU87T0FDUjs7O0FBR0QsVUFBSSxhQUFhLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3RDLFVBQUksa0JBQWtCLEdBQUcsTUFBTSxNQUFNLENBQUMsUUFBUSxDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQzs7OztBQUl4RSxVQUFJLFdBQVcsR0FBRyxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxFQUFDLEtBQUssRUFBRSxPQUFPLEVBQUMsQ0FBQyxDQUFDOztBQUVwRSxpQkFBVyxDQUFDLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0FBQzNDLGlCQUFXLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztLQUNuRDs7O1dBRU0sbUJBQUc7QUFDUixVQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRTtBQUN4QixlQUFPO09BQ1I7QUFDRCxVQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQzlCLFVBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO0tBQzVCOzs7U0F2RUcsV0FBVzs7O0FBMEVqQixNQUFNLENBQUMsT0FBTyxHQUFHLFdBQVcsQ0FBQyIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvbnVjbGlkZS1maWxlLXdhdGNoZXIvbGliL0ZpbGVXYXRjaGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxudmFyIHtDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUoJ2F0b20nKTtcbnZhciBsb2dnZXIgPSBudWxsO1xuXG5mdW5jdGlvbiBnZXRMb2dnZXIoKSB7XG4gIHJldHVybiBsb2dnZXIgfHwgKGxvZ2dlciA9IHJlcXVpcmUoJ251Y2xpZGUtbG9nZ2luZycpLmdldExvZ2dlcigpKTtcbn1cblxuY2xhc3MgRmlsZVdhdGNoZXIge1xuXG4gIF9lZGl0b3I6IFRleHRFZGl0b3I7XG4gIF9zdWJzY3JpcHRpb25zOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xuXG4gIGNvbnN0cnVjdG9yKGVkaXRvcjogVGV4dEVkaXRvcikge1xuICAgIHRoaXMuX2VkaXRvciA9IGVkaXRvcjtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICBpZiAodGhpcy5fZWRpdG9yID09IG51bGwpIHtcbiAgICAgIGdldExvZ2dlcigpLndhcm4oJ05vIGVkaXRvciBpbnN0YW5jZSBvbiB0aGlzLl9lZGl0b3InKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5fZWRpdG9yLm9uRGlkQ29uZmxpY3QoKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuX3Nob3VsZFByb21wdFRvUmVsb2FkKCkpIHtcbiAgICAgICAgZ2V0TG9nZ2VyKCkuaW5mbygnQ29uZmxpY3QgYXQgZmlsZTogJyArIHRoaXMuX2VkaXRvci5nZXRQYXRoKCkpO1xuICAgICAgICB0aGlzLl9wcm9tcHRSZWxvYWQoKTtcbiAgICAgIH1cbiAgICB9KSk7XG4gIH1cblxuICBfc2hvdWxkUHJvbXB0VG9SZWxvYWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuX2VkaXRvci5nZXRCdWZmZXIoKS5pc0luQ29uZmxpY3QoKTtcbiAgfVxuXG4gIGFzeW5jIF9wcm9tcHRSZWxvYWQoKTogUHJvbWlzZSB7XG4gICAgdmFyIHtnZXRQYXRoLCBiYXNlbmFtZX0gPSByZXF1aXJlKCdudWNsaWRlLXJlbW90ZS11cmknKTtcblxuICAgIHZhciBmaWxlUGF0aCA9IHRoaXMuX2VkaXRvci5nZXRQYXRoKCk7XG4gICAgdmFyIGVuY29kaW5nID0gdGhpcy5fZWRpdG9yLmdldEVuY29kaW5nKCk7XG4gICAgdmFyIGZpbGVOYW1lID0gYmFzZW5hbWUoZmlsZVBhdGgpO1xuICAgIHZhciBjaG9pY2UgPSBhdG9tLmNvbmZpcm0oe1xuICAgICAgbWVzc2FnZTogZmlsZU5hbWUgKyAnIGhhcyBjaGFuZ2VkIG9uIGRpc2suJyxcbiAgICAgIGJ1dHRvbnM6IFsnUmVsb2FkJywgJ0NvbXBhcmUnLCAnSWdub3JlJ10sXG4gICAgfSk7XG4gICAgaWYgKGNob2ljZSA9PT0gMikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoY2hvaWNlID09PSAwKSB7XG4gICAgICB2YXIgYnVmZmVyID0gdGhpcy5fZWRpdG9yLmdldEJ1ZmZlcigpO1xuICAgICAgaWYgKGJ1ZmZlcikge1xuICAgICAgICBidWZmZXIucmVsb2FkKCk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHtnZXRDbGllbnR9ID0gcmVxdWlyZSgnbnVjbGlkZS1jbGllbnQnKTtcblxuICAgIHZhciBjbGllbnQgPSBnZXRDbGllbnQoZmlsZVBhdGgpO1xuICAgIGlmICghY2xpZW50KSB7XG4gICAgICBnZXRMb2dnZXIoKS5lcnJvcignW2ZpbGUtd2F0Y2hlcl06IE5vIGNsaWVudCBmb3VuZCBmb3IgcGF0aDonLCBmaWxlUGF0aCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gTG9hZCB0aGUgZmlsZSBjb250ZW50cyBsb2NhbGx5IG9yIHJlbW90ZWx5LlxuICAgIHZhciBsb2NhbEZpbGVQYXRoID0gZ2V0UGF0aChmaWxlUGF0aCk7XG4gICAgdmFyIGZpbGVzeXN0ZW1Db250ZW50cyA9IGF3YWl0IGNsaWVudC5yZWFkRmlsZShsb2NhbEZpbGVQYXRoLCBlbmNvZGluZyk7XG5cbiAgICAvLyBPcGVuIGEgcmlnaHQgc3BsaXQgcGFuZSB0byBjb21wYXJlIHRoZSBjb250ZW50cy5cbiAgICAvLyBUT0RPOiBXZSBjYW4gdXNlIHRoZSBkaWZmLXZpZXcgaGVyZSB3aGVuIHJlYWR5LlxuICAgIHZhciBzcGxpdEVkaXRvciA9IGF3YWl0IGF0b20ud29ya3NwYWNlLm9wZW4obnVsbCwge3NwbGl0OiAncmlnaHQnfSk7XG5cbiAgICBzcGxpdEVkaXRvci5pbnNlcnRUZXh0KGZpbGVzeXN0ZW1Db250ZW50cyk7XG4gICAgc3BsaXRFZGl0b3Iuc2V0R3JhbW1hcih0aGlzLl9lZGl0b3IuZ2V0R3JhbW1hcigpKTtcbiAgfVxuXG4gIGRlc3Ryb3koKSB7XG4gICAgaWYgKCF0aGlzLl9zdWJzY3JpcHRpb25zKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuZGlzcG9zZSgpO1xuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMgPSBudWxsO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVXYXRjaGVyO1xuIl19