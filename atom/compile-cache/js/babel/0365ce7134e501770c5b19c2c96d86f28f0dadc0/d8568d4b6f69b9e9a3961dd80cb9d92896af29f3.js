'use babel';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

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

var loadController;
var fileTreeController = null;
var subscriptions = null;

// Unload 'tree-view' so we can control whether it is activated or not.
//
// Running the code in the global scope here ensures that it's called before
// 'tree-view' is activated. This allows us to unload it before it's activated,
// ensuring it has minimal impact on startup time.
var loadSubscription = atom.packages.onDidLoadInitialPackages(function () {
  if (atom.packages.isPackageLoaded('tree-view')) {
    atom.packages.unloadPackage('tree-view');
  }
  loadSubscription.dispose();
  loadSubscription = null;
});

module.exports = {
  activate: function activate(state) {
    // We need to check if the package is already disabled, otherwise Atom will
    // add it to the 'core.disabledPackages' config multiple times.
    if (!atom.packages.isPackageDisabled('tree-view')) {
      atom.packages.disablePackage('tree-view');
    }

    // Show the file tree by default.
    state = state || {};
    state.panel = state.panel || { isVisible: true };

    /**
     * Lazily load the FileTreeController, to minimize startup time.
     */
    loadController = _asyncToGenerator(function* () {
      if (!fileTreeController) {
        var FileTreeController = require('./FileTreeController');
        fileTreeController = new FileTreeController(state);
      }
      return fileTreeController;
    });

    subscriptions = new CompositeDisposable();
    subscriptions.add(atom.commands.add('atom-workspace', {
      'nuclide-file-tree:toggle': _asyncToGenerator(function* () {
        return (yield loadController()).toggle();
      }),
      'nuclide-file-tree:show': _asyncToGenerator(function* () {
        return (yield loadController()).setVisible(true);
      }),
      'nuclide-file-tree:reveal-active-file': _asyncToGenerator(function* () {
        return (yield loadController()).revealActiveFile();
      })
    }));

    if (state.panel.isVisible) {
      loadController();
    }
  },

  getController: function getController() {
    return loadController;
  },

  deactivate: function deactivate() {
    if (subscriptions) {
      subscriptions.dispose();
      subscriptions = null;
    }
    if (fileTreeController) {
      fileTreeController.destroy();
      fileTreeController = null;
    }

    // The user most likely wants either `nuclide-file-tree` or `tree-view` at
    // any given point. If `nuclide-file-tree` is disabled, we should re-enable
    // `tree-view` so they can still browse files.
    //
    // If the user only ever wants to use `nuclide-file-tree`, we still need to
    // enable `tree-view` on shutdown. Otherwise, disabling `nuclide-file-tree`
    // and reloading Atom would keep `tree-view` disabled.
    atom.packages.enablePackage('tree-view');
  },

  serialize: function serialize() {
    if (fileTreeController) {
      return fileTreeController.serialize();
    }
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtdHJlZS9saWIvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7O2VBVWdCLE9BQU8sQ0FBQyxNQUFNLENBQUM7O0lBQXRDLG1CQUFtQixZQUFuQixtQkFBbUI7O0FBRXhCLElBQUksY0FBaUQsQ0FBQztBQUN0RCxJQUFJLGtCQUF1QyxHQUFHLElBQUksQ0FBQztBQUNuRCxJQUFJLGFBQW1DLEdBQUcsSUFBSSxDQUFDOzs7Ozs7O0FBTy9DLElBQUksZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyx3QkFBd0IsQ0FBQyxZQUFNO0FBQ2xFLE1BQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLEVBQUU7QUFDOUMsUUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUM7R0FDMUM7QUFDRCxrQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUMzQixrQkFBZ0IsR0FBRyxJQUFJLENBQUM7Q0FDekIsQ0FBQyxDQUFDOztBQUVILE1BQU0sQ0FBQyxPQUFPLEdBQUc7QUFDZixVQUFRLEVBQUEsa0JBQUMsS0FBK0IsRUFBUTs7O0FBRzlDLFFBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxFQUFFO0FBQ2pELFVBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0tBQzNDOzs7QUFHRCxTQUFLLEdBQUcsS0FBSyxJQUFJLEVBQUUsQ0FBQztBQUNwQixTQUFLLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLElBQUksRUFBQyxTQUFTLEVBQUUsSUFBSSxFQUFDLENBQUM7Ozs7O0FBSy9DLGtCQUFjLHFCQUFHLGFBQVk7QUFDM0IsVUFBSSxDQUFDLGtCQUFrQixFQUFFO0FBQ3ZCLFlBQUksa0JBQWtCLEdBQUcsT0FBTyxDQUFDLHNCQUFzQixDQUFDLENBQUM7QUFDekQsMEJBQWtCLEdBQUcsSUFBSSxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztPQUNwRDtBQUNELGFBQU8sa0JBQWtCLENBQUM7S0FDM0IsQ0FBQSxDQUFDOztBQUVGLGlCQUFhLEdBQUcsSUFBSSxtQkFBbUIsRUFBRSxDQUFDO0FBQzFDLGlCQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUMvQixnQkFBZ0IsRUFDaEI7QUFDRSxnQ0FBMEIsb0JBQUU7ZUFBWSxDQUFDLE1BQU0sY0FBYyxFQUFFLENBQUEsQ0FBRSxNQUFNLEVBQUU7T0FBQSxDQUFBO0FBQ3pFLDhCQUF3QixvQkFBRTtlQUFZLENBQUMsTUFBTSxjQUFjLEVBQUUsQ0FBQSxDQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUM7T0FBQSxDQUFBO0FBQy9FLDRDQUFzQyxvQkFBRTtlQUFZLENBQUMsTUFBTSxjQUFjLEVBQUUsQ0FBQSxDQUFFLGdCQUFnQixFQUFFO09BQUEsQ0FBQTtLQUNoRyxDQUFDLENBQUMsQ0FBQzs7QUFFUixRQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFO0FBQ3pCLG9CQUFjLEVBQUUsQ0FBQztLQUNsQjtHQUNGOztBQUVELGVBQWEsRUFBQSx5QkFBc0M7QUFDakQsV0FBTyxjQUFjLENBQUM7R0FDdkI7O0FBRUQsWUFBVSxFQUFBLHNCQUFTO0FBQ2pCLFFBQUksYUFBYSxFQUFFO0FBQ2pCLG1CQUFhLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDeEIsbUJBQWEsR0FBRyxJQUFJLENBQUM7S0FDdEI7QUFDRCxRQUFJLGtCQUFrQixFQUFFO0FBQ3RCLHdCQUFrQixDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQzdCLHdCQUFrQixHQUFHLElBQUksQ0FBQztLQUMzQjs7Ozs7Ozs7O0FBU0QsUUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUM7R0FDMUM7O0FBRUQsV0FBUyxFQUFBLHFCQUE2QjtBQUNwQyxRQUFJLGtCQUFrQixFQUFFO0FBQ3RCLGFBQU8sa0JBQWtCLENBQUMsU0FBUyxFQUFFLENBQUM7S0FDdkM7R0FDRjtDQUNGLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL251Y2xpZGUtZmlsZS10cmVlL2xpYi9tYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cbnZhciB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlKCdhdG9tJyk7XG5cbnZhciBsb2FkQ29udHJvbGxlcjogKCkgPT4gUHJvbWlzZTxGaWxlVHJlZUNvbnRyb2xsZXI+O1xudmFyIGZpbGVUcmVlQ29udHJvbGxlcjogP0ZpbGVUcmVlQ29udHJvbGxlciA9IG51bGw7XG52YXIgc3Vic2NyaXB0aW9uczogP0NvbXBvc2l0ZURpc3Bvc2FibGUgPSBudWxsO1xuXG4vLyBVbmxvYWQgJ3RyZWUtdmlldycgc28gd2UgY2FuIGNvbnRyb2wgd2hldGhlciBpdCBpcyBhY3RpdmF0ZWQgb3Igbm90LlxuLy9cbi8vIFJ1bm5pbmcgdGhlIGNvZGUgaW4gdGhlIGdsb2JhbCBzY29wZSBoZXJlIGVuc3VyZXMgdGhhdCBpdCdzIGNhbGxlZCBiZWZvcmVcbi8vICd0cmVlLXZpZXcnIGlzIGFjdGl2YXRlZC4gVGhpcyBhbGxvd3MgdXMgdG8gdW5sb2FkIGl0IGJlZm9yZSBpdCdzIGFjdGl2YXRlZCxcbi8vIGVuc3VyaW5nIGl0IGhhcyBtaW5pbWFsIGltcGFjdCBvbiBzdGFydHVwIHRpbWUuXG52YXIgbG9hZFN1YnNjcmlwdGlvbiA9IGF0b20ucGFja2FnZXMub25EaWRMb2FkSW5pdGlhbFBhY2thZ2VzKCgpID0+IHtcbiAgaWYgKGF0b20ucGFja2FnZXMuaXNQYWNrYWdlTG9hZGVkKCd0cmVlLXZpZXcnKSkge1xuICAgIGF0b20ucGFja2FnZXMudW5sb2FkUGFja2FnZSgndHJlZS12aWV3Jyk7XG4gIH1cbiAgbG9hZFN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XG4gIGxvYWRTdWJzY3JpcHRpb24gPSBudWxsO1xufSk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhY3RpdmF0ZShzdGF0ZTogP0ZpbGVUcmVlQ29udHJvbGxlclN0YXRlKTogdm9pZCB7XG4gICAgLy8gV2UgbmVlZCB0byBjaGVjayBpZiB0aGUgcGFja2FnZSBpcyBhbHJlYWR5IGRpc2FibGVkLCBvdGhlcndpc2UgQXRvbSB3aWxsXG4gICAgLy8gYWRkIGl0IHRvIHRoZSAnY29yZS5kaXNhYmxlZFBhY2thZ2VzJyBjb25maWcgbXVsdGlwbGUgdGltZXMuXG4gICAgaWYgKCFhdG9tLnBhY2thZ2VzLmlzUGFja2FnZURpc2FibGVkKCd0cmVlLXZpZXcnKSkge1xuICAgICAgYXRvbS5wYWNrYWdlcy5kaXNhYmxlUGFja2FnZSgndHJlZS12aWV3Jyk7XG4gICAgfVxuXG4gICAgLy8gU2hvdyB0aGUgZmlsZSB0cmVlIGJ5IGRlZmF1bHQuXG4gICAgc3RhdGUgPSBzdGF0ZSB8fCB7fTtcbiAgICBzdGF0ZS5wYW5lbCA9IHN0YXRlLnBhbmVsIHx8IHtpc1Zpc2libGU6IHRydWV9O1xuXG4gICAgLyoqXG4gICAgICogTGF6aWx5IGxvYWQgdGhlIEZpbGVUcmVlQ29udHJvbGxlciwgdG8gbWluaW1pemUgc3RhcnR1cCB0aW1lLlxuICAgICAqL1xuICAgIGxvYWRDb250cm9sbGVyID0gYXN5bmMgKCkgPT4ge1xuICAgICAgaWYgKCFmaWxlVHJlZUNvbnRyb2xsZXIpIHtcbiAgICAgICAgdmFyIEZpbGVUcmVlQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vRmlsZVRyZWVDb250cm9sbGVyJyk7XG4gICAgICAgIGZpbGVUcmVlQ29udHJvbGxlciA9IG5ldyBGaWxlVHJlZUNvbnRyb2xsZXIoc3RhdGUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZpbGVUcmVlQ29udHJvbGxlcjtcbiAgICB9O1xuXG4gICAgc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXG4gICAgICAgICdhdG9tLXdvcmtzcGFjZScsXG4gICAgICAgIHtcbiAgICAgICAgICAnbnVjbGlkZS1maWxlLXRyZWU6dG9nZ2xlJzogYXN5bmMgKCkgPT4gKGF3YWl0IGxvYWRDb250cm9sbGVyKCkpLnRvZ2dsZSgpLFxuICAgICAgICAgICdudWNsaWRlLWZpbGUtdHJlZTpzaG93JzogYXN5bmMgKCkgPT4gKGF3YWl0IGxvYWRDb250cm9sbGVyKCkpLnNldFZpc2libGUodHJ1ZSksXG4gICAgICAgICAgJ251Y2xpZGUtZmlsZS10cmVlOnJldmVhbC1hY3RpdmUtZmlsZSc6IGFzeW5jICgpID0+IChhd2FpdCBsb2FkQ29udHJvbGxlcigpKS5yZXZlYWxBY3RpdmVGaWxlKCksXG4gICAgICAgIH0pKTtcblxuICAgIGlmIChzdGF0ZS5wYW5lbC5pc1Zpc2libGUpIHtcbiAgICAgIGxvYWRDb250cm9sbGVyKCk7XG4gICAgfVxuICB9LFxuXG4gIGdldENvbnRyb2xsZXIoKTogKCkgPT4gUHJvbWlzZTxGaWxlVHJlZUNvbnRyb2xsZXI+IHtcbiAgICByZXR1cm4gbG9hZENvbnRyb2xsZXI7XG4gIH0sXG5cbiAgZGVhY3RpdmF0ZSgpOiB2b2lkIHtcbiAgICBpZiAoc3Vic2NyaXB0aW9ucykge1xuICAgICAgc3Vic2NyaXB0aW9ucy5kaXNwb3NlKCk7XG4gICAgICBzdWJzY3JpcHRpb25zID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKGZpbGVUcmVlQ29udHJvbGxlcikge1xuICAgICAgZmlsZVRyZWVDb250cm9sbGVyLmRlc3Ryb3koKTtcbiAgICAgIGZpbGVUcmVlQ29udHJvbGxlciA9IG51bGw7XG4gICAgfVxuXG4gICAgLy8gVGhlIHVzZXIgbW9zdCBsaWtlbHkgd2FudHMgZWl0aGVyIGBudWNsaWRlLWZpbGUtdHJlZWAgb3IgYHRyZWUtdmlld2AgYXRcbiAgICAvLyBhbnkgZ2l2ZW4gcG9pbnQuIElmIGBudWNsaWRlLWZpbGUtdHJlZWAgaXMgZGlzYWJsZWQsIHdlIHNob3VsZCByZS1lbmFibGVcbiAgICAvLyBgdHJlZS12aWV3YCBzbyB0aGV5IGNhbiBzdGlsbCBicm93c2UgZmlsZXMuXG4gICAgLy9cbiAgICAvLyBJZiB0aGUgdXNlciBvbmx5IGV2ZXIgd2FudHMgdG8gdXNlIGBudWNsaWRlLWZpbGUtdHJlZWAsIHdlIHN0aWxsIG5lZWQgdG9cbiAgICAvLyBlbmFibGUgYHRyZWUtdmlld2Agb24gc2h1dGRvd24uIE90aGVyd2lzZSwgZGlzYWJsaW5nIGBudWNsaWRlLWZpbGUtdHJlZWBcbiAgICAvLyBhbmQgcmVsb2FkaW5nIEF0b20gd291bGQga2VlcCBgdHJlZS12aWV3YCBkaXNhYmxlZC5cbiAgICBhdG9tLnBhY2thZ2VzLmVuYWJsZVBhY2thZ2UoJ3RyZWUtdmlldycpO1xuICB9LFxuXG4gIHNlcmlhbGl6ZSgpOiA/RmlsZVRyZWVDb250cm9sbGVyU3RhdGUge1xuICAgIGlmIChmaWxlVHJlZUNvbnRyb2xsZXIpIHtcbiAgICAgIHJldHVybiBmaWxlVHJlZUNvbnRyb2xsZXIuc2VyaWFsaXplKCk7XG4gICAgfVxuICB9XG59O1xuIl19