'use babel';

/**
 * Searches upwards through the filesystem from pathToFile to find a file with
 *   fileName.
 * @param fileName The name of the file to find.
 * @param pathToDirectory Where to begin the search. Must be a path to a directory, not a
 *   file.
 * @return directory that contains the nearest file or null.
 */

var findNearestFile = _asyncToGenerator(function* (fileName, pathToDirectory) {
  // TODO(5586355): If this becomes a bottleneck, we should consider memoizing
  // this function. The downside would be that if someone added a closer file
  // with fileName to pathToFile (or deleted the one that was cached), then we
  // would have a bug. This would probably be pretty rare, though.
  var currentPath = path.resolve(pathToDirectory);
  do {
    var fileToFind = path.join(currentPath, fileName);
    var hasFile = yield exists(fileToFind);
    if (hasFile) {
      return currentPath;
    }

    if (isRoot(currentPath)) {
      return null;
    }
    currentPath = path.dirname(currentPath);
  } while (true);
});

/**
 * Runs the equivalent of `mkdir -p` with the given path.
 *
 * Like most implementations of mkdirp, if it fails, it is possible that
 * directories were created for some prefix of the given path.
 * @return true if the path was created; false if it already existed.
 */

var mkdirp = _asyncToGenerator(function* (filePath) {
  var isExistingDirectory = yield exists(filePath);
  if (isExistingDirectory) {
    return false;
  } else {
    return new Promise(function (resolve, reject) {
      mkdirpLib(filePath, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }
});

/**
 * Removes directories even if they are non-empty. Does not fail if the directory doesn't exist.
 */

var rmdir = _asyncToGenerator(function* (filePath) {
  return new Promise(function (resolve, reject) {
    rimraf(filePath, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
});

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var fs = require('fs');
var path = require('path');
var mkdirpLib = require('mkdirp');
var rimraf = require('rimraf');

function isRoot(filePath) {
  return path.dirname(filePath) === filePath;
}

/**
 * Create a temp directory with given prefix. The caller is responsible for cleaning up the
 *   drectory.
 * @param prefix optinal prefix for the temp directory name.
 * @return path to a temporary directory.
 */
function tempdir() {
  var prefix = arguments[0] === undefined ? '' : arguments[0];

  return new Promise(function (resolve, reject) {
    require('temp').mkdir(prefix, function (err, dirPath) {
      if (err) {
        reject(err);
      } else {
        resolve(dirPath);
      }
    });
  });
}

/**
 * @return path to a temporary file. The caller is responsible for cleaning up
 *     the file.
 */
function tempfile(options) {
  return new Promise(function (resolve, reject) {
    require('temp').open(options, function (err, info) {
      if (err) {
        reject(err);
      } else {
        resolve(info.path);
      }
    });
  });
}

function exists(filePath) {
  return new Promise(function (resolve, reject) {
    fs.exists(filePath, resolve);
  });
}

var asyncFs = {
  exists: exists,
  findNearestFile: findNearestFile,
  isRoot: isRoot,
  mkdirp: mkdirp,
  rmdir: rmdir,
  tempdir: tempdir,
  tempfile: tempfile
};

['lstat', 'mkdir', 'readdir', 'readFile', 'readlink', 'realpath', 'rename', 'stat', 'symlink', 'unlink', 'writeFile'].forEach(function (methodName) {
  asyncFs[methodName] = function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var method = fs[methodName];
    return new Promise(function (resolve, reject) {
      method.apply(fs, args.concat([function (err, result) {
        return err ? reject(err) : resolve(result);
      }]));
    });
  };
});

module.exports = asyncFs;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9ub2RlX21vZHVsZXMvbnVjbGlkZS1yZW1vdGUtY29ubmVjdGlvbi9ub2RlX21vZHVsZXMvbnVjbGlkZS1jb21tb25zL2xpYi9maWxlc3lzdGVtLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7SUE4REcsZUFBZSxxQkFBOUIsV0FBK0IsUUFBZ0IsRUFBRSxlQUF1QixFQUFvQjs7Ozs7QUFLMUYsTUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUNoRCxLQUFHO0FBQ0QsUUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDbEQsUUFBSSxPQUFPLEdBQUcsTUFBTSxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDdkMsUUFBSSxPQUFPLEVBQUU7QUFDWCxhQUFPLFdBQVcsQ0FBQztLQUNwQjs7QUFFRCxRQUFJLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFBRTtBQUN2QixhQUFPLElBQUksQ0FBQztLQUNiO0FBQ0QsZUFBVyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7R0FDekMsUUFBUSxJQUFJLEVBQUU7Q0FDaEI7Ozs7Ozs7Ozs7SUFlYyxNQUFNLHFCQUFyQixXQUFzQixRQUFnQixFQUFvQjtBQUN4RCxNQUFJLG1CQUFtQixHQUFHLE1BQU0sTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ2pELE1BQUksbUJBQW1CLEVBQUU7QUFDdkIsV0FBTyxLQUFLLENBQUM7R0FDZCxNQUFNO0FBQ0wsV0FBTyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUs7QUFDdEMsZUFBUyxDQUFDLFFBQVEsRUFBRSxVQUFDLEdBQUcsRUFBSztBQUMzQixZQUFJLEdBQUcsRUFBRTtBQUNQLGdCQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDYixNQUFNO0FBQ0wsaUJBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUNmO09BQ0YsQ0FBQyxDQUFDO0tBQ0osQ0FBQyxDQUFDO0dBQ0o7Q0FDRjs7Ozs7O0lBS2MsS0FBSyxxQkFBcEIsV0FBcUIsUUFBZ0IsRUFBVztBQUM5QyxTQUFPLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBSztBQUN0QyxVQUFNLENBQUMsUUFBUSxFQUFFLFVBQUMsR0FBRyxFQUFLO0FBQ3hCLFVBQUksR0FBRyxFQUFFO0FBQ1AsY0FBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO09BQ2IsTUFBTTtBQUNMLGVBQU8sRUFBRSxDQUFDO09BQ1g7S0FDRixDQUFDLENBQUM7R0FDSixDQUFDLENBQUM7Q0FDSjs7Ozs7Ozs7Ozs7Ozs7QUFsSEQsSUFBSSxFQUFFLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3ZCLElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMzQixJQUFJLFNBQVMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDbEMsSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDOztBQUUvQixTQUFTLE1BQU0sQ0FBQyxRQUFnQixFQUFXO0FBQ3pDLFNBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxRQUFRLENBQUM7Q0FDNUM7Ozs7Ozs7O0FBUUQsU0FBUyxPQUFPLEdBQXFDO01BQXBDLE1BQU0sZ0NBQUMsRUFBRTs7QUFDeEIsU0FBTyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUs7QUFDdEMsV0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsVUFBQyxHQUFHLEVBQUUsT0FBTyxFQUFLO0FBQzlDLFVBQUksR0FBRyxFQUFFO0FBQ1AsY0FBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO09BQ2IsTUFBTTtBQUNMLGVBQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztPQUNsQjtLQUNGLENBQUMsQ0FBQztHQUNKLENBQUMsQ0FBQztDQUNKOzs7Ozs7QUFNRCxTQUFTLFFBQVEsQ0FBQyxPQUFZLEVBQW1CO0FBQy9DLFNBQU8sSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFLO0FBQ3RDLFdBQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFVBQUMsR0FBRyxFQUFFLElBQUksRUFBSztBQUMzQyxVQUFJLEdBQUcsRUFBRTtBQUNQLGNBQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztPQUNiLE1BQU07QUFDTCxlQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO09BQ3BCO0tBQ0YsQ0FBQyxDQUFDO0dBQ0osQ0FBQyxDQUFDO0NBQ0o7O0FBOEJELFNBQVMsTUFBTSxDQUFDLFFBQWdCLEVBQW9CO0FBQ2xELFNBQU8sSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFLO0FBQ3RDLE1BQUUsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0dBQzlCLENBQUMsQ0FBQztDQUNKOztBQXlDRCxJQUFJLE9BQU8sR0FBRztBQUNaLFFBQU0sRUFBTixNQUFNO0FBQ04saUJBQWUsRUFBZixlQUFlO0FBQ2YsUUFBTSxFQUFOLE1BQU07QUFDTixRQUFNLEVBQU4sTUFBTTtBQUNOLE9BQUssRUFBTCxLQUFLO0FBQ0wsU0FBTyxFQUFQLE9BQU87QUFDUCxVQUFRLEVBQVIsUUFBUTtDQUNULENBQUM7O0FBRUYsQ0FDRSxPQUFPLEVBQ1AsT0FBTyxFQUNQLFNBQVMsRUFDVCxVQUFVLEVBQ1YsVUFBVSxFQUNWLFVBQVUsRUFDVixRQUFRLEVBQ1IsTUFBTSxFQUNOLFNBQVMsRUFDVCxRQUFRLEVBQ1IsV0FBVyxDQUNaLENBQUMsT0FBTyxDQUFDLFVBQUMsVUFBVSxFQUFLO0FBQ3hCLFNBQU8sQ0FBQyxVQUFVLENBQUMsR0FBRyxZQUFrQjtzQ0FBTixJQUFJO0FBQUosVUFBSTs7O0FBQ3BDLFFBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM1QixXQUFPLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBSztBQUN0QyxZQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQzNCLFVBQUMsR0FBRyxFQUFFLE1BQU07ZUFBSyxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7T0FBQSxDQUNyRCxDQUFDLENBQUMsQ0FBQztLQUNMLENBQUMsQ0FBQztHQUNKLENBQUM7Q0FDSCxDQUFDLENBQUM7O0FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL251Y2xpZGUtcmVtb3RlLXByb2plY3RzL25vZGVfbW9kdWxlcy9udWNsaWRlLXJlbW90ZS1jb25uZWN0aW9uL25vZGVfbW9kdWxlcy9udWNsaWRlLWNvbW1vbnMvbGliL2ZpbGVzeXN0ZW0uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIgZnMgPSByZXF1aXJlKCdmcycpO1xudmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG52YXIgbWtkaXJwTGliID0gcmVxdWlyZSgnbWtkaXJwJyk7XG52YXIgcmltcmFmID0gcmVxdWlyZSgncmltcmFmJyk7XG5cbmZ1bmN0aW9uIGlzUm9vdChmaWxlUGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBwYXRoLmRpcm5hbWUoZmlsZVBhdGgpID09PSBmaWxlUGF0aDtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSB0ZW1wIGRpcmVjdG9yeSB3aXRoIGdpdmVuIHByZWZpeC4gVGhlIGNhbGxlciBpcyByZXNwb25zaWJsZSBmb3IgY2xlYW5pbmcgdXAgdGhlXG4gKiAgIGRyZWN0b3J5LlxuICogQHBhcmFtIHByZWZpeCBvcHRpbmFsIHByZWZpeCBmb3IgdGhlIHRlbXAgZGlyZWN0b3J5IG5hbWUuXG4gKiBAcmV0dXJuIHBhdGggdG8gYSB0ZW1wb3JhcnkgZGlyZWN0b3J5LlxuICovXG5mdW5jdGlvbiB0ZW1wZGlyKHByZWZpeD0nJzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICByZXF1aXJlKCd0ZW1wJykubWtkaXIocHJlZml4LCAoZXJyLCBkaXJQYXRoKSA9PiB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzb2x2ZShkaXJQYXRoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG59XG5cbi8qKlxuICogQHJldHVybiBwYXRoIHRvIGEgdGVtcG9yYXJ5IGZpbGUuIFRoZSBjYWxsZXIgaXMgcmVzcG9uc2libGUgZm9yIGNsZWFuaW5nIHVwXG4gKiAgICAgdGhlIGZpbGUuXG4gKi9cbmZ1bmN0aW9uIHRlbXBmaWxlKG9wdGlvbnM6IGFueSk6IFByb21pc2U8c3RyaW5nPiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgcmVxdWlyZSgndGVtcCcpLm9wZW4ob3B0aW9ucywgKGVyciwgaW5mbykgPT4ge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc29sdmUoaW5mby5wYXRoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG59XG5cbi8qKlxuICogU2VhcmNoZXMgdXB3YXJkcyB0aHJvdWdoIHRoZSBmaWxlc3lzdGVtIGZyb20gcGF0aFRvRmlsZSB0byBmaW5kIGEgZmlsZSB3aXRoXG4gKiAgIGZpbGVOYW1lLlxuICogQHBhcmFtIGZpbGVOYW1lIFRoZSBuYW1lIG9mIHRoZSBmaWxlIHRvIGZpbmQuXG4gKiBAcGFyYW0gcGF0aFRvRGlyZWN0b3J5IFdoZXJlIHRvIGJlZ2luIHRoZSBzZWFyY2guIE11c3QgYmUgYSBwYXRoIHRvIGEgZGlyZWN0b3J5LCBub3QgYVxuICogICBmaWxlLlxuICogQHJldHVybiBkaXJlY3RvcnkgdGhhdCBjb250YWlucyB0aGUgbmVhcmVzdCBmaWxlIG9yIG51bGwuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGZpbmROZWFyZXN0RmlsZShmaWxlTmFtZTogc3RyaW5nLCBwYXRoVG9EaXJlY3Rvcnk6IHN0cmluZyk6IFByb21pc2U8P3N0cmluZz4ge1xuICAvLyBUT0RPKDU1ODYzNTUpOiBJZiB0aGlzIGJlY29tZXMgYSBib3R0bGVuZWNrLCB3ZSBzaG91bGQgY29uc2lkZXIgbWVtb2l6aW5nXG4gIC8vIHRoaXMgZnVuY3Rpb24uIFRoZSBkb3duc2lkZSB3b3VsZCBiZSB0aGF0IGlmIHNvbWVvbmUgYWRkZWQgYSBjbG9zZXIgZmlsZVxuICAvLyB3aXRoIGZpbGVOYW1lIHRvIHBhdGhUb0ZpbGUgKG9yIGRlbGV0ZWQgdGhlIG9uZSB0aGF0IHdhcyBjYWNoZWQpLCB0aGVuIHdlXG4gIC8vIHdvdWxkIGhhdmUgYSBidWcuIFRoaXMgd291bGQgcHJvYmFibHkgYmUgcHJldHR5IHJhcmUsIHRob3VnaC5cbiAgdmFyIGN1cnJlbnRQYXRoID0gcGF0aC5yZXNvbHZlKHBhdGhUb0RpcmVjdG9yeSk7XG4gIGRvIHtcbiAgICB2YXIgZmlsZVRvRmluZCA9IHBhdGguam9pbihjdXJyZW50UGF0aCwgZmlsZU5hbWUpO1xuICAgIHZhciBoYXNGaWxlID0gYXdhaXQgZXhpc3RzKGZpbGVUb0ZpbmQpO1xuICAgIGlmIChoYXNGaWxlKSB7XG4gICAgICByZXR1cm4gY3VycmVudFBhdGg7XG4gICAgfVxuXG4gICAgaWYgKGlzUm9vdChjdXJyZW50UGF0aCkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjdXJyZW50UGF0aCA9IHBhdGguZGlybmFtZShjdXJyZW50UGF0aCk7XG4gIH0gd2hpbGUgKHRydWUpO1xufVxuXG5mdW5jdGlvbiBleGlzdHMoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGZzLmV4aXN0cyhmaWxlUGF0aCwgcmVzb2x2ZSk7XG4gIH0pO1xufVxuXG4vKipcbiAqIFJ1bnMgdGhlIGVxdWl2YWxlbnQgb2YgYG1rZGlyIC1wYCB3aXRoIHRoZSBnaXZlbiBwYXRoLlxuICpcbiAqIExpa2UgbW9zdCBpbXBsZW1lbnRhdGlvbnMgb2YgbWtkaXJwLCBpZiBpdCBmYWlscywgaXQgaXMgcG9zc2libGUgdGhhdFxuICogZGlyZWN0b3JpZXMgd2VyZSBjcmVhdGVkIGZvciBzb21lIHByZWZpeCBvZiB0aGUgZ2l2ZW4gcGF0aC5cbiAqIEByZXR1cm4gdHJ1ZSBpZiB0aGUgcGF0aCB3YXMgY3JlYXRlZDsgZmFsc2UgaWYgaXQgYWxyZWFkeSBleGlzdGVkLlxuICovXG5hc3luYyBmdW5jdGlvbiBta2RpcnAoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICB2YXIgaXNFeGlzdGluZ0RpcmVjdG9yeSA9IGF3YWl0IGV4aXN0cyhmaWxlUGF0aCk7XG4gIGlmIChpc0V4aXN0aW5nRGlyZWN0b3J5KSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBta2RpcnBMaWIoZmlsZVBhdGgsIChlcnIpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc29sdmUodHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogUmVtb3ZlcyBkaXJlY3RvcmllcyBldmVuIGlmIHRoZXkgYXJlIG5vbi1lbXB0eS4gRG9lcyBub3QgZmFpbCBpZiB0aGUgZGlyZWN0b3J5IGRvZXNuJ3QgZXhpc3QuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHJtZGlyKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICByaW1yYWYoZmlsZVBhdGgsIChlcnIpID0+IHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xufVxuXG52YXIgYXN5bmNGcyA9IHtcbiAgZXhpc3RzLFxuICBmaW5kTmVhcmVzdEZpbGUsXG4gIGlzUm9vdCxcbiAgbWtkaXJwLFxuICBybWRpcixcbiAgdGVtcGRpcixcbiAgdGVtcGZpbGUsXG59O1xuXG5bXG4gICdsc3RhdCcsXG4gICdta2RpcicsXG4gICdyZWFkZGlyJyxcbiAgJ3JlYWRGaWxlJyxcbiAgJ3JlYWRsaW5rJyxcbiAgJ3JlYWxwYXRoJyxcbiAgJ3JlbmFtZScsXG4gICdzdGF0JyxcbiAgJ3N5bWxpbmsnLFxuICAndW5saW5rJyxcbiAgJ3dyaXRlRmlsZScsXG5dLmZvckVhY2goKG1ldGhvZE5hbWUpID0+IHtcbiAgYXN5bmNGc1ttZXRob2ROYW1lXSA9IGZ1bmN0aW9uKC4uLmFyZ3MpIHtcbiAgICB2YXIgbWV0aG9kID0gZnNbbWV0aG9kTmFtZV07XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIG1ldGhvZC5hcHBseShmcywgYXJncy5jb25jYXQoW1xuICAgICAgICAoZXJyLCByZXN1bHQpID0+IGVyciA/IHJlamVjdChlcnIpIDogcmVzb2x2ZShyZXN1bHQpXG4gICAgICBdKSk7XG4gICAgfSk7XG4gIH07XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBhc3luY0ZzO1xuIl19