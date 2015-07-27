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

var Directory = _require.Directory;

try {
  var _require2 = require('./fb/config.json');

  var ignoredRepositories = _require2.ignoredRepositories;
} catch (e) {
  var ignoredRepositories = [];
}

var logger = null;
function getLogger() {
  return logger || (logger = require('nuclide-logging').getLogger());
}

/**
 * @param directory Either a RemoteDirectory or Directory we are interested in.
 * @return If the directory is part of a Mercurial repository, returns an object
 *  with the following field:
 *  * originURL The string URL of the repository origin.
 *  * repoPath The path/uri to the repository (.hg folder).
 *  * workingDirectory A Directory (or RemoteDirectory) object that represents
 *    the repository's working directory.
 *  * workingDirectoryLocalPath The local path to the workingDirectory of the
 *    repository (i.e. if it's a remote directory, the URI minus the hostname).
 *  If the directory is not part of a Mercurial repository, returns null.
 */
function getRepositoryDescription(directory) {
  var _require3 = require('nuclide-remote-connection');

  var RemoteDirectory = _require3.RemoteDirectory;

  if (RemoteDirectory.isRemoteDirectory(directory)) {
    var repositoryDescription = directory.getHgRepositoryDescription();
    if (!repositoryDescription.repoPath) {
      return null;
    }

    // TODO(chenshen) fix the performance issue and enable disabled repositories.
    // Disable remote hg feature for certain hg repsitory due to t7448942.
    if (ignoredRepositories.indexOf(repositoryDescription.originURL) >= 0) {
      logger.debug('{repositoryDescription.originURL} is ignored.');
      return null;
    }

    var remoteConnection = directory._remote;
    var repoPath = repositoryDescription.repoPath;
    var originURL = repositoryDescription.originURL;
    var workingDirectoryPath = repositoryDescription.workingDirectoryPath;

    var workingDirectoryLocalPath = workingDirectoryPath;
    // These paths are all relative to the remote fs. We need to turn these into URIs.
    var repoPath = remoteConnection.getUriOfRemotePath(repoPath);
    var workingDirectoryPath = remoteConnection.getUriOfRemotePath(workingDirectoryPath);
    return {
      originURL: originURL,
      repoPath: repoPath,
      workingDirectory: new RemoteDirectory(remoteConnection, workingDirectoryPath),
      workingDirectoryLocalPath: workingDirectoryLocalPath
    };
  } else {
    var _require4 = require('nuclide-source-control-helpers');

    var findHgRepository = _require4.findHgRepository;

    var repositoryDescription = findHgRepository(directory.getPath());
    if (!repositoryDescription.repoPath) {
      return null;
    }

    var repoPath = repositoryDescription.repoPath;
    var originURL = repositoryDescription.originURL;
    var workingDirectoryPath = repositoryDescription.workingDirectoryPath;

    return {
      originURL: originURL,
      repoPath: repoPath,
      workingDirectory: new Directory(workingDirectoryPath),
      workingDirectoryLocalPath: workingDirectoryPath
    };
  }
}

module.exports = (function () {
  function HgRepositoryProvider() {
    _classCallCheck(this, HgRepositoryProvider);
  }

  _createClass(HgRepositoryProvider, [{
    key: 'repositoryForDirectory',
    value: function repositoryForDirectory(directory) {
      return Promise.resolve(this.repositoryForDirectorySync(directory));
    }
  }, {
    key: 'repositoryForDirectorySync',
    value: function repositoryForDirectorySync(directory) {
      try {
        var repositoryDescription = getRepositoryDescription(directory);
        if (!repositoryDescription) {
          return null;
        }

        var originURL = repositoryDescription.originURL;
        var repoPath = repositoryDescription.repoPath;
        var workingDirectory = repositoryDescription.workingDirectory;
        var workingDirectoryLocalPath = repositoryDescription.workingDirectoryLocalPath;

        var _require5 = require('nuclide-client');

        var getServiceByNuclideUri = _require5.getServiceByNuclideUri;

        var service = getServiceByNuclideUri('HgService', directory.getPath(), { workingDirectory: workingDirectoryLocalPath });

        var _require6 = require('nuclide-hg-repository-client');

        var HgRepositoryClient = _require6.HgRepositoryClient;

        return new HgRepositoryClient(repoPath, service, {
          workingDirectory: workingDirectory,
          projectRootDirectory: directory,
          originURL: originURL
        });
      } catch (err) {
        getLogger().error('Failed to create an HgRepositoryClient for ', directory.getPath(), ', error: ', err);
        return null;
      }
    }
  }]);

  return HgRepositoryProvider;
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWhnLXJlcG9zaXRvcnkvbGliL0hnUmVwb3NpdG9yeVByb3ZpZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7OztlQVdNLE9BQU8sQ0FBQyxNQUFNLENBQUM7O0lBQTVCLFNBQVMsWUFBVCxTQUFTOztBQUVkLElBQUk7a0JBQzBCLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQzs7TUFBbEQsbUJBQW1CLGFBQW5CLG1CQUFtQjtDQUN6QixDQUFDLE9BQU8sQ0FBQyxFQUFFO0FBQ1YsTUFBSSxtQkFBbUIsR0FBRyxFQUFFLENBQUM7Q0FDOUI7O0FBRUQsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDO0FBQ2xCLFNBQVMsU0FBUyxHQUFHO0FBQ25CLFNBQU8sTUFBTSxLQUFLLE1BQU0sR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQSxBQUFDLENBQUM7Q0FDcEU7Ozs7Ozs7Ozs7Ozs7O0FBY0QsU0FBUyx3QkFBd0IsQ0FBQyxTQUFvQixFQUFVO2tCQUN0QyxPQUFPLENBQUMsMkJBQTJCLENBQUM7O01BQXZELGVBQWUsYUFBZixlQUFlOztBQUVwQixNQUFJLGVBQWUsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsRUFBRTtBQUNoRCxRQUFJLHFCQUFxQixHQUFHLFNBQVMsQ0FBQywwQkFBMEIsRUFBRSxDQUFDO0FBQ25FLFFBQUksQ0FBQyxxQkFBcUIsQ0FBQyxRQUFRLEVBQUU7QUFDbkMsYUFBTyxJQUFJLENBQUM7S0FDYjs7OztBQUlELFFBQUksbUJBQW1CLENBQUMsT0FBTyxDQUFDLHFCQUFxQixDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUNyRSxZQUFNLENBQUMsS0FBSyxpREFBaUQsQ0FBQztBQUM5RCxhQUFPLElBQUksQ0FBQztLQUNiOztBQUVELFFBQUksZ0JBQWdCLEdBQUcsU0FB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QUFDeEcsZUFBTyxJQUFJLENBQUM7T0FDYjtLQUNGOzs7U0E5Qm9CLG9CQUFvQjtJQStCMUMsQ0FBQSIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvbnVjbGlkZS1oZy1yZXBvc2l0b3J5L2xpYi9IZ1JlcG9zaXRvcnlQcm92aWRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbnZhciB7RGlyZWN0b3J5fSA9IHJlcXVpcmUoJ2F0b20nKTtcblxudHJ5IHtcbiAgdmFyIHtpZ25vcmVkUmVwb3NpdG9yaWVzfSA9IHJlcXVpcmUoJy4vZmIvY29uZmlnLmpzb24nKTtcbn0gY2F0Y2ggKGUpIHtcbiAgdmFyIGlnbm9yZWRSZXBvc2l0b3JpZXMgPSBbXTtcbn1cblxudmFyIGxvZ2dlciA9IG51bGw7XG5mdW5jdGlvbiBnZXRMb2dnZXIoKSB7XG4gIHJldHVybiBsb2dnZXIgfHwgKGxvZ2dlciA9IHJlcXVpcmUoJ251Y2xpZGUtbG9nZ2luZycpLmdldExvZ2dlcigpKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0gZGlyZWN0b3J5IEVpdGhlciBhIFJlbW90ZURpcmVjdG9yeSBvciBEaXJlY3Rvcnkgd2UgYXJlIGludGVyZXN0ZWQgaW4uXG4gKiBAcmV0dXJuIElmIHRoZSBkaXJlY3RvcnkgaXMgcGFydCBvZiBhIE1lcmN1cmlhbCByZXBvc2l0b3J5LCByZXR1cm5zIGFuIG9iamVjdFxuICogIHdpdGggdGhlIGZvbGxvd2luZyBmaWVsZDpcbiAqICAqIG9yaWdpblVSTCBUaGUgc3RyaW5nIFVSTCBvZiB0aGUgcmVwb3NpdG9yeSBvcmlnaW4uXG4gKiAgKiByZXBvUGF0aCBUaGUgcGF0aC91cmkgdG8gdGhlIHJlcG9zaXRvcnkgKC5oZyBmb2xkZXIpLlxuICogICogd29ya2luZ0RpcmVjdG9yeSBBIERpcmVjdG9yeSAob3IgUmVtb3RlRGlyZWN0b3J5KSBvYmplY3QgdGhhdCByZXByZXNlbnRzXG4gKiAgICB0aGUgcmVwb3NpdG9yeSdzIHdvcmtpbmcgZGlyZWN0b3J5LlxuICogICogd29ya2luZ0RpcmVjdG9yeUxvY2FsUGF0aCBUaGUgbG9jYWwgcGF0aCB0byB0aGUgd29ya2luZ0RpcmVjdG9yeSBvZiB0aGVcbiAqICAgIHJlcG9zaXRvcnkgKGkuZS4gaWYgaXQncyBhIHJlbW90ZSBkaXJlY3RvcnksIHRoZSBVUkkgbWludXMgdGhlIGhvc3RuYW1lKS5cbiAqICBJZiB0aGUgZGlyZWN0b3J5IGlzIG5vdCBwYXJ0IG9mIGEgTWVyY3VyaWFsIHJlcG9zaXRvcnksIHJldHVybnMgbnVsbC5cbiAqL1xuZnVuY3Rpb24gZ2V0UmVwb3NpdG9yeURlc2NyaXB0aW9uKGRpcmVjdG9yeTogRGlyZWN0b3J5KTogP21peGVkIHtcbiAgdmFyIHtSZW1vdGVEaXJlY3Rvcnl9ID0gcmVxdWlyZSgnbnVjbGlkZS1yZW1vdGUtY29ubmVjdGlvbicpO1xuXG4gIGlmIChSZW1vdGVEaXJlY3RvcnkuaXNSZW1vdGVEaXJlY3RvcnkoZGlyZWN0b3J5KSkge1xuICAgIHZhciByZXBvc2l0b3J5RGVzY3JpcHRpb24gPSBkaXJlY3RvcnkuZ2V0SGdSZXBvc2l0b3J5RGVzY3JpcHRpb24oKTtcbiAgICBpZiAoIXJlcG9zaXRvcnlEZXNjcmlwdGlvbi5yZXBvUGF0aCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gVE9ETyhjaGVuc2hlbikgZml4IHRoZSBwZXJmb3JtYW5jZSBpc3N1ZSBhbmQgZW5hYmxlIGRpc2FibGVkIHJlcG9zaXRvcmllcy5cbiAgICAvLyBEaXNhYmxlIHJlbW90ZSBoZyBmZWF0dXJlIGZvciBjZXJ0YWluIGhnIHJlcHNpdG9yeSBkdWUgdG8gdDc0NDg5NDIuXG4gICAgaWYgKGlnbm9yZWRSZXBvc2l0b3JpZXMuaW5kZXhPZihyZXBvc2l0b3J5RGVzY3JpcHRpb24ub3JpZ2luVVJMKSA+PSAwKSB7XG4gICAgICBsb2dnZXIuZGVidWcoYHtyZXBvc2l0b3J5RGVzY3JpcHRpb24ub3JpZ2luVVJMfSBpcyBpZ25vcmVkLmApO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgdmFyIHJlbW90ZUNvbm5lY3Rpb24gPSBkaXJlY3RvcnkuX3JlbW90ZTtcbiAgICB2YXIge3JlcG9QYXRoLCBvcmlnaW5VUkwsIHdvcmtpbmdEaXJlY3RvcnlQYXRofSA9IHJlcG9zaXRvcnlEZXNjcmlwdGlvbjtcbiAgICB2YXIgd29ya2luZ0RpcmVjdG9yeUxvY2FsUGF0aCA9IHdvcmtpbmdEaXJlY3RvcnlQYXRoO1xuICAgIC8vIFRoZXNlIHBhdGhzIGFyZSBhbGwgcmVsYXRpdmUgdG8gdGhlIHJlbW90ZSBmcy4gV2UgbmVlZCB0byB0dXJuIHRoZXNlIGludG8gVVJJcy5cbiAgICB2YXIgcmVwb1BhdGggPSByZW1vdGVDb25uZWN0aW9uLmdldFVyaU9mUmVtb3RlUGF0aChyZXBvUGF0aCk7XG4gICAgdmFyIHdvcmtpbmdEaXJlY3RvcnlQYXRoID0gcmVtb3RlQ29ubmVjdGlvbi5nZXRVcmlPZlJlbW90ZVBhdGgod29ya2luZ0RpcmVjdG9yeVBhdGgpO1xuICAgIHJldHVybiB7XG4gICAgICBvcmlnaW5VUkwsXG4gICAgICByZXBvUGF0aCxcbiAgICAgIHdvcmtpbmdEaXJlY3Rvcnk6IG5ldyBSZW1vdGVEaXJlY3RvcnkocmVtb3RlQ29ubmVjdGlvbiwgd29ya2luZ0RpcmVjdG9yeVBhdGgpLFxuICAgICAgd29ya2luZ0RpcmVjdG9yeUxvY2FsUGF0aCxcbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIHZhciB7ZmluZEhnUmVwb3NpdG9yeX0gPSByZXF1aXJlKCdudWNsaWRlLXNvdXJjZS1jb250cm9sLWhlbHBlcnMnKTtcbiAgICB2YXIgcmVwb3NpdG9yeURlc2NyaXB0aW9uID0gZmluZEhnUmVwb3NpdG9yeShkaXJlY3RvcnkuZ2V0UGF0aCgpKTtcbiAgICBpZiAoIXJlcG9zaXRvcnlEZXNjcmlwdGlvbi5yZXBvUGF0aCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgdmFyIHtyZXBvUGF0aCwgb3JpZ2luVVJMLCB3b3JraW5nRGlyZWN0b3J5UGF0aH0gPSByZXBvc2l0b3J5RGVzY3JpcHRpb247XG4gICAgcmV0dXJuIHtcbiAgICAgIG9yaWdpblVSTCxcbiAgICAgIHJlcG9QYXRoLFxuICAgICAgd29ya2luZ0RpcmVjdG9yeTogbmV3IERpcmVjdG9yeSh3b3JraW5nRGlyZWN0b3J5UGF0aCksXG4gICAgICB3b3JraW5nRGlyZWN0b3J5TG9jYWxQYXRoOiB3b3JraW5nRGlyZWN0b3J5UGF0aCxcbiAgICB9O1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgSGdSZXBvc2l0b3J5UHJvdmlkZXIge1xuICByZXBvc2l0b3J5Rm9yRGlyZWN0b3J5KGRpcmVjdG9yeTogRGlyZWN0b3J5KSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLnJlcG9zaXRvcnlGb3JEaXJlY3RvcnlTeW5jKGRpcmVjdG9yeSkpO1xuICB9XG5cbiAgcmVwb3NpdG9yeUZvckRpcmVjdG9yeVN5bmMoZGlyZWN0b3J5OiBEaXJlY3RvcnkpOiA/SGdSZXBvc2l0b3J5IHtcbiAgICB0cnkge1xuICAgICAgdmFyIHJlcG9zaXRvcnlEZXNjcmlwdGlvbiA9IGdldFJlcG9zaXRvcnlEZXNjcmlwdGlvbihkaXJlY3RvcnkpO1xuICAgICAgaWYgKCFyZXBvc2l0b3J5RGVzY3JpcHRpb24pIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIHZhciB7b3JpZ2luVVJMLCByZXBvUGF0aCwgd29ya2luZ0RpcmVjdG9yeSwgd29ya2luZ0RpcmVjdG9yeUxvY2FsUGF0aH0gPSByZXBvc2l0b3J5RGVzY3JpcHRpb247XG5cbiAgICAgIHZhciB7Z2V0U2VydmljZUJ5TnVjbGlkZVVyaX0gPSByZXF1aXJlKCdudWNsaWRlLWNsaWVudCcpO1xuICAgICAgdmFyIHNlcnZpY2UgPSBnZXRTZXJ2aWNlQnlOdWNsaWRlVXJpKFxuICAgICAgICAnSGdTZXJ2aWNlJyxcbiAgICAgICAgZGlyZWN0b3J5LmdldFBhdGgoKSxcbiAgICAgICAge3dvcmtpbmdEaXJlY3Rvcnk6IHdvcmtpbmdEaXJlY3RvcnlMb2NhbFBhdGh9XG4gICAgICApO1xuICAgICAgdmFyIHtIZ1JlcG9zaXRvcnlDbGllbnR9ID0gcmVxdWlyZSgnbnVjbGlkZS1oZy1yZXBvc2l0b3J5LWNsaWVudCcpO1xuICAgICAgcmV0dXJuIG5ldyBIZ1JlcG9zaXRvcnlDbGllbnQocmVwb1BhdGgsIHNlcnZpY2UsIHtcbiAgICAgICAgd29ya2luZ0RpcmVjdG9yeSxcbiAgICAgICAgcHJvamVjdFJvb3REaXJlY3Rvcnk6IGRpcmVjdG9yeSxcbiAgICAgICAgb3JpZ2luVVJMLFxuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBnZXRMb2dnZXIoKS5lcnJvcignRmFpbGVkIHRvIGNyZWF0ZSBhbiBIZ1JlcG9zaXRvcnlDbGllbnQgZm9yICcsIGRpcmVjdG9yeS5nZXRQYXRoKCksICcsIGVycm9yOiAnLCBlcnIpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG59XG4iXX0=