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

var _require = require('nuclide-remote-connection');

var RemoteConnection = _require.RemoteConnection;
var RemoteDirectory = _require.RemoteDirectory;

/**
 * The prefix a URI must have for `RemoteDirectoryProvider` to try to produce a
 * `RemoteDirectory` for it. This should also be the path prefix checked by the
 * handler we register with `atom.project.registerOpener()` to open remote files.
 */
var REMOTE_PATH_URI_PREFIX = 'nuclide://';

var RemoteDirectoryProvider = (function () {
  function RemoteDirectoryProvider() {
    _classCallCheck(this, RemoteDirectoryProvider);
  }

  _createClass(RemoteDirectoryProvider, [{
    key: 'directoryForURISync',
    value: function directoryForURISync(uri) {
      if (!uri.startsWith(REMOTE_PATH_URI_PREFIX)) {
        return null;
      }

      var connection = RemoteConnection.getForUri(uri);
      if (connection) {
        return connection.createDirectory(uri);
      } else {
        // TODO: Handle case where connection is not yet established. This could
        // happen when someone had a nuclide:// file open before and then s/he
        // restarted the workspace and Atom tried to restore the state.
        return null;
      }
    }
  }, {
    key: 'directoryForURI',
    value: function directoryForURI(uri) {
      return Promise.resolve(this.directoryForURISync(uri));
    }
  }]);

  return RemoteDirectoryProvider;
})();

module.exports = RemoteDirectoryProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9saWIvUmVtb3RlRGlyZWN0b3J5UHJvdmlkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7O2VBVzhCLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQzs7SUFBekUsZ0JBQWdCLFlBQWhCLGdCQUFnQjtJQUFFLGVBQWUsWUFBZixlQUFlOzs7Ozs7O0FBT3RDLElBQUksc0JBQXNCLEdBQUcsWUFBWSxDQUFDOztJQUVwQyx1QkFBdUI7V0FBdkIsdUJBQXVCOzBCQUF2Qix1QkFBdUI7OztlQUF2Qix1QkFBdUI7O1dBQ1IsNkJBQUMsR0FBVyxFQUFvQjtBQUNqRCxVQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxzQkFBc0IsQ0FBQyxFQUFFO0FBQzNDLGVBQU8sSUFBSSxDQUFDO09BQ2I7O0FBRUQsVUFBSSxVQUFVLEdBQUcsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2pELFVBQUksVUFBVSxFQUFFO0FBQ2QsZUFBTyxVQUFVLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDO09BQ3hDLE1BQU07Ozs7QUFJTCxlQUFPLElBQUksQ0FBQztPQUNiO0tBQ0Y7OztXQUVjLHlCQUFDLEdBQVcsRUFBVztBQUNwQyxhQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7S0FDdkQ7OztTQW5CRyx1QkFBdUI7OztBQXNCN0IsTUFBTSxDQUFDLE9BQU8sR0FBRyx1QkFBdUIsQ0FBQyIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvbnVjbGlkZS1yZW1vdGUtcHJvamVjdHMvbGliL1JlbW90ZURpcmVjdG9yeVByb3ZpZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxudmFyIHtSZW1vdGVDb25uZWN0aW9uLCBSZW1vdGVEaXJlY3Rvcnl9ID0gcmVxdWlyZSgnbnVjbGlkZS1yZW1vdGUtY29ubmVjdGlvbicpO1xuXG4vKipcbiAqIFRoZSBwcmVmaXggYSBVUkkgbXVzdCBoYXZlIGZvciBgUmVtb3RlRGlyZWN0b3J5UHJvdmlkZXJgIHRvIHRyeSB0byBwcm9kdWNlIGFcbiAqIGBSZW1vdGVEaXJlY3RvcnlgIGZvciBpdC4gVGhpcyBzaG91bGQgYWxzbyBiZSB0aGUgcGF0aCBwcmVmaXggY2hlY2tlZCBieSB0aGVcbiAqIGhhbmRsZXIgd2UgcmVnaXN0ZXIgd2l0aCBgYXRvbS5wcm9qZWN0LnJlZ2lzdGVyT3BlbmVyKClgIHRvIG9wZW4gcmVtb3RlIGZpbGVzLlxuICovXG52YXIgUkVNT1RFX1BBVEhfVVJJX1BSRUZJWCA9ICdudWNsaWRlOi8vJztcblxuY2xhc3MgUmVtb3RlRGlyZWN0b3J5UHJvdmlkZXIge1xuICBkaXJlY3RvcnlGb3JVUklTeW5jKHVyaTogc3RyaW5nKTogP1JlbW90ZURpcmVjdG9yeSB7XG4gICAgaWYgKCF1cmkuc3RhcnRzV2l0aChSRU1PVEVfUEFUSF9VUklfUFJFRklYKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgdmFyIGNvbm5lY3Rpb24gPSBSZW1vdGVDb25uZWN0aW9uLmdldEZvclVyaSh1cmkpO1xuICAgIGlmIChjb25uZWN0aW9uKSB7XG4gICAgICByZXR1cm4gY29ubmVjdGlvbi5jcmVhdGVEaXJlY3RvcnkodXJpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVE9ETzogSGFuZGxlIGNhc2Ugd2hlcmUgY29ubmVjdGlvbiBpcyBub3QgeWV0IGVzdGFibGlzaGVkLiBUaGlzIGNvdWxkXG4gICAgICAvLyBoYXBwZW4gd2hlbiBzb21lb25lIGhhZCBhIG51Y2xpZGU6Ly8gZmlsZSBvcGVuIGJlZm9yZSBhbmQgdGhlbiBzL2hlXG4gICAgICAvLyByZXN0YXJ0ZWQgdGhlIHdvcmtzcGFjZSBhbmQgQXRvbSB0cmllZCB0byByZXN0b3JlIHRoZSBzdGF0ZS5cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGRpcmVjdG9yeUZvclVSSSh1cmk6IHN0cmluZyk6IFByb21pc2Uge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5kaXJlY3RvcnlGb3JVUklTeW5jKHVyaSkpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUmVtb3RlRGlyZWN0b3J5UHJvdmlkZXI7XG4iXX0=