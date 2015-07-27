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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWhnLXJlcG9zaXRvcnkvbGliL0hnUmVwb3NpdG9yeVByb3ZpZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7OztlQVdNLE9BQU8sQ0FBQyxNQUFNLENBQUM7O0lBQTVCLFNBQVMsWUFBVCxTQUFTOztBQUVkLElBQUk7a0JBQzBCLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQzs7TUFBbEQsbUJBQW1CLGFBQW5CLG1CQUFtQjtDQUN6QixDQUFDLE9BQU8sQ0FBQyxFQUFFO0FBQ1YsTUFBSSxtQkFBbUIsR0FBRyxFQUFFLENBQUM7Q0FDOUI7O0FBRUQsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDO0FBQ2xCLFNBQVMsU0FBUyxHQUFHO0FBQ25CLFNBQU8sTUFBTSxLQUFLLE1BQU0sR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQSxDQUFFO0NBQ3BFOzs7Ozs7Ozs7Ozs7OztBQWNELFNBQVMsd0JBQXdCLENBQUMsU0FBb0IsRUFBVTtrQkFDdEMsT0FBTyxDQUFDLDJCQUEyQixDQUFDOztNQUF2RCxlQUFlLGFBQWYsZUFBZTs7QUFFcEIsTUFBSSxlQUFlLENBQUMsaUJBQWlCLENBQUMsU0FBUyxDQUFDLEVBQUU7QUFDaEQsUUFBSSxxQkFBcUIsR0FBRyxTQUFTLENBQUMsMEJBQTBCLEVBQUUsQ0FBQztBQUNuRSxRQUFJLENBQUMscUJBQXFCLENBQUMsUUFBUSxFQUFFO0FBQ25DLGFBQU8sSUFBSSxDQUFDO0tBQ2I7Ozs7QUFJRCxRQUFJLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDckUsWUFBTSxDQUFDLEtBQUssaURBQWlELENBQUM7QUFDOUQsYUFBTyxJQUFJLENBQUM7S0FDYjs7QUFFRCxRQUFJLGdCQUFnQixHQUFHLFNBQVMsQ0FB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LGVBQU8sSUFBSSxDQUFDO09BQ2I7S0FDRjs7O1NBOUJvQixvQkFBb0I7SUErQjFDLENBQUEiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL251Y2xpZGUtaGctcmVwb3NpdG9yeS9saWIvSGdSZXBvc2l0b3J5UHJvdmlkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIge0RpcmVjdG9yeX0gPSByZXF1aXJlKCdhdG9tJyk7XG5cbnRyeSB7XG4gIHZhciB7aWdub3JlZFJlcG9zaXRvcmllc30gPSByZXF1aXJlKCcuL2ZiL2NvbmZpZy5qc29uJyk7XG59IGNhdGNoIChlKSB7XG4gIHZhciBpZ25vcmVkUmVwb3NpdG9yaWVzID0gW107XG59XG5cbnZhciBsb2dnZXIgPSBudWxsO1xuZnVuY3Rpb24gZ2V0TG9nZ2VyKCkge1xuICByZXR1cm4gbG9nZ2VyIHx8IChsb2dnZXIgPSByZXF1aXJlKCdudWNsaWRlLWxvZ2dpbmcnKS5nZXRMb2dnZXIoKSk7XG59XG5cbi8qKlxuICogQHBhcmFtIGRpcmVjdG9yeSBFaXRoZXIgYSBSZW1vdGVEaXJlY3Rvcnkgb3IgRGlyZWN0b3J5IHdlIGFyZSBpbnRlcmVzdGVkIGluLlxuICogQHJldHVybiBJZiB0aGUgZGlyZWN0b3J5IGlzIHBhcnQgb2YgYSBNZXJjdXJpYWwgcmVwb3NpdG9yeSwgcmV0dXJucyBhbiBvYmplY3RcbiAqICB3aXRoIHRoZSBmb2xsb3dpbmcgZmllbGQ6XG4gKiAgKiBvcmlnaW5VUkwgVGhlIHN0cmluZyBVUkwgb2YgdGhlIHJlcG9zaXRvcnkgb3JpZ2luLlxuICogICogcmVwb1BhdGggVGhlIHBhdGgvdXJpIHRvIHRoZSByZXBvc2l0b3J5ICguaGcgZm9sZGVyKS5cbiAqICAqIHdvcmtpbmdEaXJlY3RvcnkgQSBEaXJlY3RvcnkgKG9yIFJlbW90ZURpcmVjdG9yeSkgb2JqZWN0IHRoYXQgcmVwcmVzZW50c1xuICogICAgdGhlIHJlcG9zaXRvcnkncyB3b3JraW5nIGRpcmVjdG9yeS5cbiAqICAqIHdvcmtpbmdEaXJlY3RvcnlMb2NhbFBhdGggVGhlIGxvY2FsIHBhdGggdG8gdGhlIHdvcmtpbmdEaXJlY3Rvcnkgb2YgdGhlXG4gKiAgICByZXBvc2l0b3J5IChpLmUuIGlmIGl0J3MgYSByZW1vdGUgZGlyZWN0b3J5LCB0aGUgVVJJIG1pbnVzIHRoZSBob3N0bmFtZSkuXG4gKiAgSWYgdGhlIGRpcmVjdG9yeSBpcyBub3QgcGFydCBvZiBhIE1lcmN1cmlhbCByZXBvc2l0b3J5LCByZXR1cm5zIG51bGwuXG4gKi9cbmZ1bmN0aW9uIGdldFJlcG9zaXRvcnlEZXNjcmlwdGlvbihkaXJlY3Rvcnk6IERpcmVjdG9yeSk6ID9taXhlZCB7XG4gIHZhciB7UmVtb3RlRGlyZWN0b3J5fSA9IHJlcXVpcmUoJ251Y2xpZGUtcmVtb3RlLWNvbm5lY3Rpb24nKTtcblxuICBpZiAoUmVtb3RlRGlyZWN0b3J5LmlzUmVtb3RlRGlyZWN0b3J5KGRpcmVjdG9yeSkpIHtcbiAgICB2YXIgcmVwb3NpdG9yeURlc2NyaXB0aW9uID0gZGlyZWN0b3J5LmdldEhnUmVwb3NpdG9yeURlc2NyaXB0aW9uKCk7XG4gICAgaWYgKCFyZXBvc2l0b3J5RGVzY3JpcHRpb24ucmVwb1BhdGgpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8vIFRPRE8oY2hlbnNoZW4pIGZpeCB0aGUgcGVyZm9ybWFuY2UgaXNzdWUgYW5kIGVuYWJsZSBkaXNhYmxlZCByZXBvc2l0b3JpZXMuXG4gICAgLy8gRGlzYWJsZSByZW1vdGUgaGcgZmVhdHVyZSBmb3IgY2VydGFpbiBoZyByZXBzaXRvcnkgZHVlIHRvIHQ3NDQ4OTQyLlxuICAgIGlmIChpZ25vcmVkUmVwb3NpdG9yaWVzLmluZGV4T2YocmVwb3NpdG9yeURlc2NyaXB0aW9uLm9yaWdpblVSTCkgPj0gMCkge1xuICAgICAgbG9nZ2VyLmRlYnVnKGB7cmVwb3NpdG9yeURlc2NyaXB0aW9uLm9yaWdpblVSTH0gaXMgaWdub3JlZC5gKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHZhciByZW1vdGVDb25uZWN0aW9uID0gZGlyZWN0b3J5Ll9yZW1vdGU7XG4gICAgdmFyIHtyZXBvUGF0aCwgb3JpZ2luVVJMLCB3b3JraW5nRGlyZWN0b3J5UGF0aH0gPSByZXBvc2l0b3J5RGVzY3JpcHRpb247XG4gICAgdmFyIHdvcmtpbmdEaXJlY3RvcnlMb2NhbFBhdGggPSB3b3JraW5nRGlyZWN0b3J5UGF0aDtcbiAgICAvLyBUaGVzZSBwYXRocyBhcmUgYWxsIHJlbGF0aXZlIHRvIHRoZSByZW1vdGUgZnMuIFdlIG5lZWQgdG8gdHVybiB0aGVzZSBpbnRvIFVSSXMuXG4gICAgdmFyIHJlcG9QYXRoID0gcmVtb3RlQ29ubmVjdGlvbi5nZXRVcmlPZlJlbW90ZVBhdGgocmVwb1BhdGgpO1xuICAgIHZhciB3b3JraW5nRGlyZWN0b3J5UGF0aCA9IHJlbW90ZUNvbm5lY3Rpb24uZ2V0VXJpT2ZSZW1vdGVQYXRoKHdvcmtpbmdEaXJlY3RvcnlQYXRoKTtcbiAgICByZXR1cm4ge1xuICAgICAgb3JpZ2luVVJMLFxuICAgICAgcmVwb1BhdGgsXG4gICAgICB3b3JraW5nRGlyZWN0b3J5OiBuZXcgUmVtb3RlRGlyZWN0b3J5KHJlbW90ZUNvbm5lY3Rpb24sIHdvcmtpbmdEaXJlY3RvcnlQYXRoKSxcbiAgICAgIHdvcmtpbmdEaXJlY3RvcnlMb2NhbFBhdGgsXG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICB2YXIge2ZpbmRIZ1JlcG9zaXRvcnl9ID0gcmVxdWlyZSgnbnVjbGlkZS1zb3VyY2UtY29udHJvbC1oZWxwZXJzJyk7XG4gICAgdmFyIHJlcG9zaXRvcnlEZXNjcmlwdGlvbiA9IGZpbmRIZ1JlcG9zaXRvcnkoZGlyZWN0b3J5LmdldFBhdGgoKSk7XG4gICAgaWYgKCFyZXBvc2l0b3J5RGVzY3JpcHRpb24ucmVwb1BhdGgpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHZhciB7cmVwb1BhdGgsIG9yaWdpblVSTCwgd29ya2luZ0RpcmVjdG9yeVBhdGh9ID0gcmVwb3NpdG9yeURlc2NyaXB0aW9uO1xuICAgIHJldHVybiB7XG4gICAgICBvcmlnaW5VUkwsXG4gICAgICByZXBvUGF0aCxcbiAgICAgIHdvcmtpbmdEaXJlY3Rvcnk6IG5ldyBEaXJlY3Rvcnkod29ya2luZ0RpcmVjdG9yeVBhdGgpLFxuICAgICAgd29ya2luZ0RpcmVjdG9yeUxvY2FsUGF0aDogd29ya2luZ0RpcmVjdG9yeVBhdGgsXG4gICAgfTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEhnUmVwb3NpdG9yeVByb3ZpZGVyIHtcbiAgcmVwb3NpdG9yeUZvckRpcmVjdG9yeShkaXJlY3Rvcnk6IERpcmVjdG9yeSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5yZXBvc2l0b3J5Rm9yRGlyZWN0b3J5U3luYyhkaXJlY3RvcnkpKTtcbiAgfVxuXG4gIHJlcG9zaXRvcnlGb3JEaXJlY3RvcnlTeW5jKGRpcmVjdG9yeTogRGlyZWN0b3J5KTogP0hnUmVwb3NpdG9yeSB7XG4gICAgdHJ5IHtcbiAgICAgIHZhciByZXBvc2l0b3J5RGVzY3JpcHRpb24gPSBnZXRSZXBvc2l0b3J5RGVzY3JpcHRpb24oZGlyZWN0b3J5KTtcbiAgICAgIGlmICghcmVwb3NpdG9yeURlc2NyaXB0aW9uKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICB2YXIge29yaWdpblVSTCwgcmVwb1BhdGgsIHdvcmtpbmdEaXJlY3RvcnksIHdvcmtpbmdEaXJlY3RvcnlMb2NhbFBhdGh9ID0gcmVwb3NpdG9yeURlc2NyaXB0aW9uO1xuXG4gICAgICB2YXIge2dldFNlcnZpY2VCeU51Y2xpZGVVcml9ID0gcmVxdWlyZSgnbnVjbGlkZS1jbGllbnQnKTtcbiAgICAgIHZhciBzZXJ2aWNlID0gZ2V0U2VydmljZUJ5TnVjbGlkZVVyaShcbiAgICAgICAgJ0hnU2VydmljZScsXG4gICAgICAgIGRpcmVjdG9yeS5nZXRQYXRoKCksXG4gICAgICAgIHt3b3JraW5nRGlyZWN0b3J5OiB3b3JraW5nRGlyZWN0b3J5TG9jYWxQYXRofVxuICAgICAgKTtcbiAgICAgIHZhciB7SGdSZXBvc2l0b3J5Q2xpZW50fSA9IHJlcXVpcmUoJ251Y2xpZGUtaGctcmVwb3NpdG9yeS1jbGllbnQnKTtcbiAgICAgIHJldHVybiBuZXcgSGdSZXBvc2l0b3J5Q2xpZW50KHJlcG9QYXRoLCBzZXJ2aWNlLCB7XG4gICAgICAgIHdvcmtpbmdEaXJlY3RvcnksXG4gICAgICAgIHByb2plY3RSb290RGlyZWN0b3J5OiBkaXJlY3RvcnksXG4gICAgICAgIG9yaWdpblVSTCxcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgZ2V0TG9nZ2VyKCkuZXJyb3IoJ0ZhaWxlZCB0byBjcmVhdGUgYW4gSGdSZXBvc2l0b3J5Q2xpZW50IGZvciAnLCBkaXJlY3RvcnkuZ2V0UGF0aCgpLCAnLCBlcnJvcjogJywgZXJyKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxufVxuIl19