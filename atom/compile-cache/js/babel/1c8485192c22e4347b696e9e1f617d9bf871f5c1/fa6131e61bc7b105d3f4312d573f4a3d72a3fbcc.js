'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var subscriptions = null;
var watchers = null;

module.exports = {

  activate: function activate(state) {
    var _require = require('atom');

    var CompositeDisposable = _require.CompositeDisposable;

    subscriptions = new CompositeDisposable();
    watchers = new Map();

    subscriptions.add(atom.workspace.observeTextEditors(function (editor) {
      if (watchers.has(editor)) {
        return;
      }

      var FileWatcher = require('./FileWatcher');
      var fileWatcher = new FileWatcher(editor);
      watchers.set(editor, fileWatcher);

      subscriptions.add(editor.onDidDestroy(function () {
        fileWatcher.destroy();
        watchers['delete'](editor);
      }));
    }));

    // Disable the file-watcher package from showing the promot, if installed.
    atom.config.set('file-watcher.promptWhenFileHasChangedOnDisk', false);
  },

  deactivate: function deactivate() {
    if (!subscriptions) {
      return;
    }
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = watchers.values()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var fileWatcher = _step.value;

        fileWatcher.destroy();
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator['return']) {
          _iterator['return']();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    subscriptions.dispose();
    subscriptions = null;
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtd2F0Y2hlci9saWIvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7O0FBV1osSUFBSSxhQUFtQyxHQUFHLElBQUksQ0FBQztBQUMvQyxJQUFJLFFBQWMsR0FBRyxJQUFJLENBQUM7O0FBRTFCLE1BQU0sQ0FBQyxPQUFPLEdBQUc7O0FBRWYsVUFBUSxFQUFBLGtCQUFDLEtBQWMsRUFBUTttQkFDRCxPQUFPLENBQUMsTUFBTSxDQUFDOztRQUF0QyxtQkFBbUIsWUFBbkIsbUJBQW1COztBQUV4QixpQkFBYSxHQUFHLElBQUksbUJBQW1CLEVBQUUsQ0FBQztBQUMxQyxZQUFRLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQzs7QUFFckIsaUJBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxVQUFBLE1BQU0sRUFBSTtBQUM1RCxVQUFJLFFBQVEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDeEIsZUFBTztPQUNSOztBQUVELFVBQUksV0FBVyxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUMzQyxVQUFJLFdBQVcsR0FBRyxJQUFJLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMxQyxjQUFRLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsQ0FBQzs7QUFFbEMsbUJBQWEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxZQUFNO0FBQzFDLG1CQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDdEIsZ0JBQVEsVUFBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO09BQ3pCLENBQUMsQ0FBQyxDQUFDO0tBQ0wsQ0FBQyxDQUFDLENBQUM7OztBQUdKLFFBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLDZDQUE2QyxFQUFFLEtBQUssQ0FBQyxDQUFDO0dBQ3ZFOztBQUVELFlBQVUsRUFBQSxzQkFBUztBQUNqQixRQUFJLENBQUMsYUFBYSxFQUFFO0FBQ2xCLGFBQU87S0FDUjs7Ozs7O0FBQ0QsMkJBQXdCLFFBQVEsQ0FBQyxNQUFNLEVBQUUsOEhBQUU7WUFBbEMsV0FBVzs7QUFDbEIsbUJBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztPQUN2Qjs7Ozs7Ozs7Ozs7Ozs7OztBQUNELGlCQUFhLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDeEIsaUJBQWEsR0FBRyxJQUFJLENBQUM7R0FDdEI7Q0FDRixDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtd2F0Y2hlci9saWIvbWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbnZhciBzdWJzY3JpcHRpb25zOiA/Q29tcG9zaXRlRGlzcG9zYWJsZSA9IG51bGw7XG52YXIgd2F0Y2hlcnM6ID9NYXAgPSBudWxsO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICBhY3RpdmF0ZShzdGF0ZTogP09iamVjdCk6IHZvaWQge1xuICAgIHZhciB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlKCdhdG9tJyk7XG5cbiAgICBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICB3YXRjaGVycyA9IG5ldyBNYXAoKTtcblxuICAgIHN1YnNjcmlwdGlvbnMuYWRkKGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycyhlZGl0b3IgPT4ge1xuICAgICAgaWYgKHdhdGNoZXJzLmhhcyhlZGl0b3IpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdmFyIEZpbGVXYXRjaGVyID0gcmVxdWlyZSgnLi9GaWxlV2F0Y2hlcicpO1xuICAgICAgdmFyIGZpbGVXYXRjaGVyID0gbmV3IEZpbGVXYXRjaGVyKGVkaXRvcik7XG4gICAgICB3YXRjaGVycy5zZXQoZWRpdG9yLCBmaWxlV2F0Y2hlcik7XG5cbiAgICAgIHN1YnNjcmlwdGlvbnMuYWRkKGVkaXRvci5vbkRpZERlc3Ryb3koKCkgPT4ge1xuICAgICAgICBmaWxlV2F0Y2hlci5kZXN0cm95KCk7XG4gICAgICAgIHdhdGNoZXJzLmRlbGV0ZShlZGl0b3IpO1xuICAgICAgfSkpO1xuICAgIH0pKTtcblxuICAgIC8vIERpc2FibGUgdGhlIGZpbGUtd2F0Y2hlciBwYWNrYWdlIGZyb20gc2hvd2luZyB0aGUgcHJvbW90LCBpZiBpbnN0YWxsZWQuXG4gICAgYXRvbS5jb25maWcuc2V0KCdmaWxlLXdhdGNoZXIucHJvbXB0V2hlbkZpbGVIYXNDaGFuZ2VkT25EaXNrJywgZmFsc2UpO1xuICB9LFxuXG4gIGRlYWN0aXZhdGUoKTogdm9pZCB7XG4gICAgaWYgKCFzdWJzY3JpcHRpb25zKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGZvciAodmFyIGZpbGVXYXRjaGVyIG9mIHdhdGNoZXJzLnZhbHVlcygpKSB7XG4gICAgICBmaWxlV2F0Y2hlci5kZXN0cm95KCk7XG4gICAgfVxuICAgIHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpO1xuICAgIHN1YnNjcmlwdGlvbnMgPSBudWxsO1xuICB9LFxufTtcbiJdfQ==