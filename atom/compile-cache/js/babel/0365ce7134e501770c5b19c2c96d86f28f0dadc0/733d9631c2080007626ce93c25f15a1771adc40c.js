'use babel';

var createExecEnvironment = _asyncToGenerator(function* (originalEnv, commonBinaryPaths) {
  var execEnv = assign({}, originalEnv);
  execEnv.PATH = execEnv.PATH || '';

  var platformPath;
  var commonBinaryPathsAppended = false;
  try {
    platformPath = yield getPlatformPath();
  } catch (error) {
    // If there's an error fetching the platform's PATH, use the default set of common binary paths.
    appendCommonBinaryPaths(execEnv, commonBinaryPaths);
    commonBinaryPathsAppended = true;
  }

  // If the platform returns a non-empty PATH, use it. Otherwise use the default set of common
  // binary paths.
  if (platformPath) {
    execEnv.PATH = platformPath;
  } else if (!commonBinaryPathsAppended) {
    appendCommonBinaryPaths(execEnv, commonBinaryPaths);
  }

  return execEnv;
});

var asyncExecute = _asyncToGenerator(function* (command, args) {
  var options = arguments[2] === undefined ? {} : arguments[2];

  var result = yield checkOutput(command, args, options);
  if (result.exitCode !== 0) {
    throw result;
  }
  return result;
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

var _require = require('child_process');

var execFile = _require.execFile;
var spawn = _require.spawn;

var _require2 = require('./object');

var assign = _require2.assign;

var path = require('path');
var PromiseQueue = require('./PromiseQueue');

var platformPathPromise;

var blockingQueues = {};
var COMMON_BINARY_PATHS = ['/usr/bin', '/bin', '/usr/sbin', '/sbin', '/usr/local/bin'];

/* Captures the value of the PATH env variable returned by Darwin's (OS X) `path_helper` utility.
 * `path_helper -s`'s return value looks like this:
 *
 *     PATH="/usr/bin"; export PATH;
 */
var DARWIN_PATH_HELPER_REGEXP = /PATH=\"([^\"]+)\"/;

var STREAM_NAMES = ['stdin', 'stdout', 'stderr'];

function getPlatformPath() {
  if (platformPathPromise) {
    // Path is being fetched, await the Promise that's in flight.
    return platformPathPromise;
  }

  if (process.platform === 'darwin') {
    // OS X apps don't inherit PATH when not launched from the CLI, so reconstruct it. This is a
    // bug, filed against Atom Linter here: https://github.com/AtomLinter/Linter/issues/150
    // TODO(jjiaa): remove this hack when the Atom issue is closed
    platformPathPromise = new Promise(function (resolve, reject) {
      execFile('/usr/libexec/path_helper', ['-s'], function (error, stdout, stderr) {
        if (error) {
          reject(error);
        } else {
          var match = stdout.match(DARWIN_PATH_HELPER_REGEXP);
          resolve(match && match.length > 1 ? match[1] : '');
        }
      });
    });
  } else {
    platformPathPromise = Promise.resolve('');
  }

  return platformPathPromise;
}

function appendCommonBinaryPaths(env, commonBinaryPaths) {
  commonBinaryPaths.forEach(function (binaryPath) {
    if (env.PATH.indexOf(binaryPath) === -1) {
      env.PATH += path.delimiter + binaryPath;
    }
  });
}

function logError() {
  // Can't use nuclide-logging here to not cause cycle dependency.
  /*eslint-disable no-console*/
  console.error.apply(console, arguments);
  /*eslint-enable no-console*/
}

function monitorStreamErrors(process, command, args, options) {
  STREAM_NAMES.forEach(function (streamName) {
    process[streamName].on('error', function (error) {
      // This can happen without the full execution of the command to fail, but we want to learn about it.
      logError('stream error with command:', command, args, options, 'error:', error);
    });
  });
}

/** Basically like spawn, except it handles and logs errors instead of crashing
  * the process. This is much lower-level than asyncExecute. Unless you have a
  * specific reason you should use asyncExecute instead. */
function safeSpawn(command) {
  var args = arguments[1] === undefined ? [] : arguments[1];
  var options = arguments[2] === undefined ? {} : arguments[2];

  var child = spawn(command, args, options);
  monitorStreamErrors(child, command, args, options);
  child.on('error', function (error) {
    logError('error with command:', command, args, options, 'error:', error);
  });
  return child;
}

/**
 * Returns a promise that resolves to the result of executing a process.
 *
 * @param command The command to execute.
 * @param args The arguments to pass to the command.
 * @param options Options for changing how to run the command.
 *     See here: http://nodejs.org/api/child_process.html
 *     The additional options we provide:
 *       queueName string The queue on which to block dependent calls.
 *       stdin string The contents to write to stdin.
 *       pipedCommand string a command to pipe the output of command through.
 *       pipedArgs array of strings as arguments.
 * @return Promise that resolves to an object with the properties:
 *     stdout string The contents of the process's output stream.
 *     stderr string The contents of the process's error stream.
 *     exitCode number The exit code returned by the process.
 */
function checkOutput(command, args) {
  var options = arguments[2] === undefined ? {} : arguments[2];

  // Clone passed in options so this function doesn't modify an object it doesn't own.
  var localOptions = assign({}, options);

  var executor = function executor(resolve, reject) {
    var firstChild;
    var lastChild;

    var firstChildStderr;
    if (localOptions.pipedCommand) {
      // If a second command is given, pipe stdout of first to stdin of second. String output
      // returned in this function's Promise will be stderr/stdout of the second command.
      firstChild = spawn(command, args, localOptions);
      monitorStreamErrors(firstChild, command, args, localOptions);
      firstChildStderr = '';

      firstChild.on('error', function (error) {
        // Reject early with the result when encountering an error.
        reject({
          command: [command].concat(args).join(' '),
          errorMessage: error.message,
          exitCode: error.code,
          stderr: firstChildStderr,
          stdout: ''
        });
      });

      firstChild.stderr.on('data', function (data) {
        firstChildStderr += data;
      });

      lastChild = spawn(localOptions.pipedCommand, localOptions.pipedArgs, localOptions);
      monitorStreamErrors(lastChild, command, args, localOptions);
      firstChild.stdout.pipe(lastChild.stdin);
    } else {
      lastChild = spawn(command, args, localOptions);
      monitorStreamErrors(lastChild, command, args, localOptions);
      firstChild = lastChild;
    }

    var stderr = '';
    var stdout = '';
    lastChild.on('close', function (exitCode) {
      resolve({
        exitCode: exitCode,
        stderr: stderr,
        stdout: stdout
      });
    });

    lastChild.on('error', function (error) {
      // Reject early with the result when encountering an error.
      reject({
        command: [command].concat(args).join(' '),
        errorMessage: error.message,
        exitCode: error.code,
        stderr: stderr,
        stdout: stdout
      });
    });

    lastChild.stderr.on('data', function (data) {
      stderr += data;
    });
    lastChild.stdout.on('data', function (data) {
      stdout += data;
    });

    if (typeof localOptions.stdin === 'string') {
      // Note that the Node docs have this scary warning about stdin.end() on
      // http://nodejs.org/api/child_process.html#child_process_child_stdin:
      //
      // "A Writable Stream that represents the child process's stdin. Closing
      // this stream via end() often causes the child process to terminate."
      //
      // In practice, this has not appeared to cause any issues thus far.
      firstChild.stdin.write(localOptions.stdin);
      firstChild.stdin.end();
    }
  };

  function makePromise() {
    if (localOptions.queueName === undefined) {
      return new Promise(executor);
    } else {
      if (!blockingQueues[localOptions.queueName]) {
        blockingQueues[localOptions.queueName] = new PromiseQueue();
      }
      return blockingQueues[localOptions.queueName].submit(executor);
    }
  }

  return createExecEnvironment(localOptions.env || process.env, COMMON_BINARY_PATHS).then(function (val) {
    localOptions.env = val;
    return makePromise();
  }, function (err) {
    localOptions.env = localOptions.env || process.env;
    return makePromise();
  });
}

module.exports = {
  asyncExecute: asyncExecute,
  checkOutput: checkOutput,
  safeSpawn: safeSpawn,
  __test__: {
    DARWIN_PATH_HELPER_REGEXP: DARWIN_PATH_HELPER_REGEXP,
    createExecEnvironment: createExecEnvironment
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWluc3RhbGxlci9ub2RlX21vZHVsZXMvbnVjbGlkZS1pbnN0YWxsZXItYmFzZS9ub2RlX21vZHVsZXMvbnVjbGlkZS1jb21tb25zL2xpYi9wcm9jZXNzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7SUFvRUcscUJBQXFCLHFCQUFwQyxXQUNJLFdBQW1CLEVBQUUsaUJBQWdDLEVBQW1CO0FBQzFFLE1BQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxFQUFFLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDdEMsU0FBTyxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQzs7QUFFbEMsTUFBSSxZQUFZLENBQUM7QUFDakIsTUFBSSx5QkFBeUIsR0FBRyxLQUFLLENBQUM7QUFDdEMsTUFBSTtBQUNGLGdCQUFZLEdBQUcsTUFBTSxlQUFlLEVBQUUsQ0FBQztHQUN4QyxDQUFDLE9BQU8sS0FBSyxFQUFFOztBQUVkLDJCQUF1QixDQUFDLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0FBQ3BELDZCQUF5QixHQUFHLElBQUksQ0FBQztHQUNsQzs7OztBQUlELE1BQUksWUFBWSxFQUFFO0FBQ2hCLFdBQU8sQ0FBQyxJQUFJLEdBQUcsWUFBWSxDQUFDO0dBQzdCLE1BQU0sSUFBSSxDQUFDLHlCQUF5QixFQUFFO0FBQ3JDLDJCQUF1QixDQUFDLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0dBQ3JEOztBQUVELFNBQU8sT0FBTyxDQUFDO0NBQ2hCOztJQWtLYyxZQUFZLHFCQUEzQixXQUNJLE9BQWUsRUFDZixJQUFtQixFQUNzQztNQUF6RCxPQUFnQixnQ0FBRyxFQUFFOztBQUN2QixNQUFJLE1BQU0sR0FBRyxNQUFNLFdBQVcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ3ZELE1BQUksTUFBTSxDQUFDLFFB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QUMsU0FBUyxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQ2hFO0dBQ0Y7O0FBRUQsU0FBTyxxQkFBcUIsQ0FBQyxZQUFZLENBQUMsR0FBRyxJQUFJLE9BQU8sQ0FBQyxHQUFHLEVBQUUsbUJBQW1CLENBQUMsQ0FBQyxJQUFJLENBQ3JGLFVBQUEsR0FBRyxFQUFJO0FBQ0wsZ0JBQVksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO0FBQ3ZCLFdBQU8sV0FBVyxFQUFFLENBQUM7R0FDdEIsRUFDRCxVQUFBLEdBQUcsRUFBSTtBQUNMLGdCQUFZLENBQUMsR0FBRyxHQUFHLFlBQVksQ0FBQyxHQUFHLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQztBQUNuRCxXQUFPLFdBQVcsRUFBRSxDQUFDO0dBQ3RCLENBQ0YsQ0FBQztDQUNIOztBQWFELE1BQU0sQ0FBQyxPQUFPLEdBQUc7QUFDZixjQUFZLEVBQVosWUFBWTtBQUNaLGFBQVcsRUFBWCxXQUFXO0FBQ1gsV0FBUyxFQUFULFNBQVM7QUFDVCxVQUFRLEVBQUU7QUFDUiw2QkFBeUIsRUFBekIseUJBQXlCO0FBQ3pCLHlCQUFxQixFQUFyQixxQkFBcUI7R0FDdEI7Q0FDRixDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWluc3RhbGxlci9ub2RlX21vZHVsZXMvbnVjbGlkZS1pbnN0YWxsZXItYmFzZS9ub2RlX21vZHVsZXMvbnVjbGlkZS1jb21tb25zL2xpYi9wcm9jZXNzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxudmFyIHtcbiAgZXhlY0ZpbGUsXG4gIHNwYXduLFxufSA9IHJlcXVpcmUoJ2NoaWxkX3Byb2Nlc3MnKTtcbnZhciB7YXNzaWdufSA9IHJlcXVpcmUoJy4vb2JqZWN0Jyk7XG52YXIgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbnZhciBQcm9taXNlUXVldWUgPSByZXF1aXJlKCcuL1Byb21pc2VRdWV1ZScpO1xuXG52YXIgcGxhdGZvcm1QYXRoUHJvbWlzZTogP1Byb21pc2U8c3RyaW5nPjtcblxudmFyIGJsb2NraW5nUXVldWVzID0ge307XG52YXIgQ09NTU9OX0JJTkFSWV9QQVRIUyA9IFsnL3Vzci9iaW4nLCAnL2JpbicsICcvdXNyL3NiaW4nLCAnL3NiaW4nLCAnL3Vzci9sb2NhbC9iaW4nXTtcblxuLyogQ2FwdHVyZXMgdGhlIHZhbHVlIG9mIHRoZSBQQVRIIGVudiB2YXJpYWJsZSByZXR1cm5lZCBieSBEYXJ3aW4ncyAoT1MgWCkgYHBhdGhfaGVscGVyYCB1dGlsaXR5LlxuICogYHBhdGhfaGVscGVyIC1zYCdzIHJldHVybiB2YWx1ZSBsb29rcyBsaWtlIHRoaXM6XG4gKlxuICogICAgIFBBVEg9XCIvdXNyL2JpblwiOyBleHBvcnQgUEFUSDtcbiAqL1xudmFyIERBUldJTl9QQVRIX0hFTFBFUl9SRUdFWFAgPSAvUEFUSD1cXFwiKFteXFxcIl0rKVxcXCIvO1xuXG5jb25zdCBTVFJFQU1fTkFNRVMgPSBbJ3N0ZGluJywgJ3N0ZG91dCcsICdzdGRlcnInXTtcblxuZnVuY3Rpb24gZ2V0UGxhdGZvcm1QYXRoKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGlmIChwbGF0Zm9ybVBhdGhQcm9taXNlKSB7XG4gICAgLy8gUGF0aCBpcyBiZWluZyBmZXRjaGVkLCBhd2FpdCB0aGUgUHJvbWlzZSB0aGF0J3MgaW4gZmxpZ2h0LlxuICAgIHJldHVybiBwbGF0Zm9ybVBhdGhQcm9taXNlO1xuICB9XG5cbiAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nKSB7XG4gICAgLy8gT1MgWCBhcHBzIGRvbid0IGluaGVyaXQgUEFUSCB3aGVuIG5vdCBsYXVuY2hlZCBmcm9tIHRoZSBDTEksIHNvIHJlY29uc3RydWN0IGl0LiBUaGlzIGlzIGFcbiAgICAvLyBidWcsIGZpbGVkIGFnYWluc3QgQXRvbSBMaW50ZXIgaGVyZTogaHR0cHM6Ly9naXRodWIuY29tL0F0b21MaW50ZXIvTGludGVyL2lzc3Vlcy8xNTBcbiAgICAvLyBUT0RPKGpqaWFhKTogcmVtb3ZlIHRoaXMgaGFjayB3aGVuIHRoZSBBdG9tIGlzc3VlIGlzIGNsb3NlZFxuICAgIHBsYXRmb3JtUGF0aFByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBleGVjRmlsZSgnL3Vzci9saWJleGVjL3BhdGhfaGVscGVyJywgWyctcyddLCAoZXJyb3IsIHN0ZG91dCwgc3RkZXJyKSA9PiB7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIG1hdGNoID0gc3Rkb3V0Lm1hdGNoKERBUldJTl9QQVRIX0hFTFBFUl9SRUdFWFApO1xuICAgICAgICAgIHJlc29sdmUoKG1hdGNoICYmIG1hdGNoLmxlbmd0aCA+IDEpID8gbWF0Y2hbMV0gOiAnJyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHBsYXRmb3JtUGF0aFByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoJycpO1xuICB9XG5cbiAgcmV0dXJuIHBsYXRmb3JtUGF0aFByb21pc2U7XG59XG5cbmZ1bmN0aW9uIGFwcGVuZENvbW1vbkJpbmFyeVBhdGhzKGVudjogT2JqZWN0LCBjb21tb25CaW5hcnlQYXRoczogQXJyYXk8c3RyaW5nPik6IHZvaWQge1xuICBjb21tb25CaW5hcnlQYXRocy5mb3JFYWNoKChiaW5hcnlQYXRoKSA9PiB7XG4gICAgaWYgKGVudi5QQVRILmluZGV4T2YoYmluYXJ5UGF0aCkgPT09IC0xKSB7XG4gICAgICBlbnYuUEFUSCArPSBwYXRoLmRlbGltaXRlciArIGJpbmFyeVBhdGg7XG4gICAgfVxuICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gY3JlYXRlRXhlY0Vudmlyb25tZW50KFxuICAgIG9yaWdpbmFsRW52OiBPYmplY3QsIGNvbW1vbkJpbmFyeVBhdGhzOiBBcnJheTxzdHJpbmc+KTogUHJvbWlzZTxPYmplY3Q+IHtcbiAgdmFyIGV4ZWNFbnYgPSBhc3NpZ24oe30sIG9yaWdpbmFsRW52KTtcbiAgZXhlY0Vudi5QQVRIID0gZXhlY0Vudi5QQVRIIHx8ICcnO1xuXG4gIHZhciBwbGF0Zm9ybVBhdGg7XG4gIHZhciBjb21tb25CaW5hcnlQYXRoc0FwcGVuZGVkID0gZmFsc2U7XG4gIHRyeSB7XG4gICAgcGxhdGZvcm1QYXRoID0gYXdhaXQgZ2V0UGxhdGZvcm1QYXRoKCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgLy8gSWYgdGhlcmUncyBhbiBlcnJvciBmZXRjaGluZyB0aGUgcGxhdGZvcm0ncyBQQVRILCB1c2UgdGhlIGRlZmF1bHQgc2V0IG9mIGNvbW1vbiBiaW5hcnkgcGF0aHMuXG4gICAgYXBwZW5kQ29tbW9uQmluYXJ5UGF0aHMoZXhlY0VudiwgY29tbW9uQmluYXJ5UGF0aHMpO1xuICAgIGNvbW1vbkJpbmFyeVBhdGhzQXBwZW5kZWQgPSB0cnVlO1xuICB9XG5cbiAgLy8gSWYgdGhlIHBsYXRmb3JtIHJldHVybnMgYSBub24tZW1wdHkgUEFUSCwgdXNlIGl0LiBPdGhlcndpc2UgdXNlIHRoZSBkZWZhdWx0IHNldCBvZiBjb21tb25cbiAgLy8gYmluYXJ5IHBhdGhzLlxuICBpZiAocGxhdGZvcm1QYXRoKSB7XG4gICAgZXhlY0Vudi5QQVRIID0gcGxhdGZvcm1QYXRoO1xuICB9IGVsc2UgaWYgKCFjb21tb25CaW5hcnlQYXRoc0FwcGVuZGVkKSB7XG4gICAgYXBwZW5kQ29tbW9uQmluYXJ5UGF0aHMoZXhlY0VudiwgY29tbW9uQmluYXJ5UGF0aHMpO1xuICB9XG5cbiAgcmV0dXJuIGV4ZWNFbnY7XG59XG5cbmZ1bmN0aW9uIGxvZ0Vycm9yKC4uLmFyZ3MpIHtcbiAgLy8gQ2FuJ3QgdXNlIG51Y2xpZGUtbG9nZ2luZyBoZXJlIHRvIG5vdCBjYXVzZSBjeWNsZSBkZXBlbmRlbmN5LlxuICAvKmVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUqL1xuICBjb25zb2xlLmVycm9yKC4uLmFyZ3MpO1xuICAvKmVzbGludC1lbmFibGUgbm8tY29uc29sZSovXG59XG5cbmZ1bmN0aW9uIG1vbml0b3JTdHJlYW1FcnJvcnMocHJvY2VzczogY2hpbGRfcHJvY2VzcyRDaGlsZFByb2Nlc3MsIGNvbW1hbmQsIGFyZ3MsIG9wdGlvbnMpOiB2b2lkIHtcbiAgU1RSRUFNX05BTUVTLmZvckVhY2goc3RyZWFtTmFtZSA9PiB7XG4gICAgcHJvY2Vzc1tzdHJlYW1OYW1lXS5vbignZXJyb3InLCBlcnJvciA9PiB7XG4gICAgICAvLyBUaGlzIGNhbiBoYXBwZW4gd2l0aG91dCB0aGUgZnVsbCBleGVjdXRpb24gb2YgdGhlIGNvbW1hbmQgdG8gZmFpbCwgYnV0IHdlIHdhbnQgdG8gbGVhcm4gYWJvdXQgaXQuXG4gICAgICBsb2dFcnJvcignc3RyZWFtIGVycm9yIHdpdGggY29tbWFuZDonLCBjb21tYW5kLCBhcmdzLCBvcHRpb25zLCAnZXJyb3I6JywgZXJyb3IpO1xuICAgIH0pO1xuICB9KTtcbn1cblxuLyoqIEJhc2ljYWxseSBsaWtlIHNwYXduLCBleGNlcHQgaXQgaGFuZGxlcyBhbmQgbG9ncyBlcnJvcnMgaW5zdGVhZCBvZiBjcmFzaGluZ1xuICAqIHRoZSBwcm9jZXNzLiBUaGlzIGlzIG11Y2ggbG93ZXItbGV2ZWwgdGhhbiBhc3luY0V4ZWN1dGUuIFVubGVzcyB5b3UgaGF2ZSBhXG4gICogc3BlY2lmaWMgcmVhc29uIHlvdSBzaG91bGQgdXNlIGFzeW5jRXhlY3V0ZSBpbnN0ZWFkLiAqL1xuZnVuY3Rpb24gc2FmZVNwYXduKGNvbW1hbmQ6IHN0cmluZywgYXJnczogQXJyYXk8c3RyaW5nPiA9IFtdLCBvcHRpb25zOiBPYmplY3QgPSB7fSk6IGNoaWxkX3Byb2Nlc3MkQ2hpbGRQcm9jZXNzIHtcbiAgdmFyIGNoaWxkID0gc3Bhd24oY29tbWFuZCwgYXJncywgb3B0aW9ucyk7XG4gIG1vbml0b3JTdHJlYW1FcnJvcnMoY2hpbGQsIGNvbW1hbmQsIGFyZ3MsIG9wdGlvbnMpO1xuICBjaGlsZC5vbignZXJyb3InLCBlcnJvciA9PiB7XG4gICAgbG9nRXJyb3IoJ2Vycm9yIHdpdGggY29tbWFuZDonLCBjb21tYW5kLCBhcmdzLCBvcHRpb25zLCAnZXJyb3I6JywgZXJyb3IpO1xuICB9KTtcbiAgcmV0dXJuIGNoaWxkO1xufVxuXG50eXBlIHByb2Nlc3MkYXN5bmNFeGVjdXRlUmV0ID0ge1xuICBjb21tYW5kPzogc3RyaW5nO1xuICBlcnJvck1lc3NhZ2U/OiBzdHJpbmc7XG4gIGV4aXRDb2RlOiBudW1iZXI7XG4gIHN0ZGVycjogc3RyaW5nO1xuICBzdGRvdXQ6IHN0cmluZztcbn07XG5cbi8qKlxuICogUmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB0byB0aGUgcmVzdWx0IG9mIGV4ZWN1dGluZyBhIHByb2Nlc3MuXG4gKlxuICogQHBhcmFtIGNvbW1hbmQgVGhlIGNvbW1hbmQgdG8gZXhlY3V0ZS5cbiAqIEBwYXJhbSBhcmdzIFRoZSBhcmd1bWVudHMgdG8gcGFzcyB0byB0aGUgY29tbWFuZC5cbiAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgZm9yIGNoYW5naW5nIGhvdyB0byBydW4gdGhlIGNvbW1hbmQuXG4gKiAgICAgU2VlIGhlcmU6IGh0dHA6Ly9ub2RlanMub3JnL2FwaS9jaGlsZF9wcm9jZXNzLmh0bWxcbiAqICAgICBUaGUgYWRkaXRpb25hbCBvcHRpb25zIHdlIHByb3ZpZGU6XG4gKiAgICAgICBxdWV1ZU5hbWUgc3RyaW5nIFRoZSBxdWV1ZSBvbiB3aGljaCB0byBibG9jayBkZXBlbmRlbnQgY2FsbHMuXG4gKiAgICAgICBzdGRpbiBzdHJpbmcgVGhlIGNvbnRlbnRzIHRvIHdyaXRlIHRvIHN0ZGluLlxuICogICAgICAgcGlwZWRDb21tYW5kIHN0cmluZyBhIGNvbW1hbmQgdG8gcGlwZSB0aGUgb3V0cHV0IG9mIGNvbW1hbmQgdGhyb3VnaC5cbiAqICAgICAgIHBpcGVkQXJncyBhcnJheSBvZiBzdHJpbmdzIGFzIGFyZ3VtZW50cy5cbiAqIEByZXR1cm4gUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIGFuIG9iamVjdCB3aXRoIHRoZSBwcm9wZXJ0aWVzOlxuICogICAgIHN0ZG91dCBzdHJpbmcgVGhlIGNvbnRlbnRzIG9mIHRoZSBwcm9jZXNzJ3Mgb3V0cHV0IHN0cmVhbS5cbiAqICAgICBzdGRlcnIgc3RyaW5nIFRoZSBjb250ZW50cyBvZiB0aGUgcHJvY2VzcydzIGVycm9yIHN0cmVhbS5cbiAqICAgICBleGl0Q29kZSBudW1iZXIgVGhlIGV4aXQgY29kZSByZXR1cm5lZCBieSB0aGUgcHJvY2Vzcy5cbiAqL1xuZnVuY3Rpb24gY2hlY2tPdXRwdXQoXG4gICAgY29tbWFuZDogc3RyaW5nLFxuICAgIGFyZ3M6IEFycmF5PHN0cmluZz4sXG4gICAgb3B0aW9uczogP09iamVjdCA9IHt9KTogUHJvbWlzZTxwcm9jZXNzJGFzeW5jRXhlY3V0ZVJldD4ge1xuICAvLyBDbG9uZSBwYXNzZWQgaW4gb3B0aW9ucyBzbyB0aGlzIGZ1bmN0aW9uIGRvZXNuJ3QgbW9kaWZ5IGFuIG9iamVjdCBpdCBkb2Vzbid0IG93bi5cbiAgdmFyIGxvY2FsT3B0aW9ucyA9IGFzc2lnbih7fSwgb3B0aW9ucyk7XG5cbiAgdmFyIGV4ZWN1dG9yID0gKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIHZhciBmaXJzdENoaWxkO1xuICAgIHZhciBsYXN0Q2hpbGQ7XG5cbiAgICB2YXIgZmlyc3RDaGlsZFN0ZGVycjtcbiAgICBpZiAobG9jYWxPcHRpb25zLnBpcGVkQ29tbWFuZCkge1xuICAgICAgLy8gSWYgYSBzZWNvbmQgY29tbWFuZCBpcyBnaXZlbiwgcGlwZSBzdGRvdXQgb2YgZmlyc3QgdG8gc3RkaW4gb2Ygc2Vjb25kLiBTdHJpbmcgb3V0cHV0XG4gICAgICAvLyByZXR1cm5lZCBpbiB0aGlzIGZ1bmN0aW9uJ3MgUHJvbWlzZSB3aWxsIGJlIHN0ZGVyci9zdGRvdXQgb2YgdGhlIHNlY29uZCBjb21tYW5kLlxuICAgICAgZmlyc3RDaGlsZCA9IHNwYXduKGNvbW1hbmQsIGFyZ3MsIGxvY2FsT3B0aW9ucyk7XG4gICAgICBtb25pdG9yU3RyZWFtRXJyb3JzKGZpcnN0Q2hpbGQsIGNvbW1hbmQsIGFyZ3MsIGxvY2FsT3B0aW9ucyk7XG4gICAgICBmaXJzdENoaWxkU3RkZXJyID0gJyc7XG5cbiAgICAgIGZpcnN0Q2hpbGQub24oJ2Vycm9yJywgZXJyb3IgPT4ge1xuICAgICAgICAvLyBSZWplY3QgZWFybHkgd2l0aCB0aGUgcmVzdWx0IHdoZW4gZW5jb3VudGVyaW5nIGFuIGVycm9yLlxuICAgICAgICByZWplY3Qoe1xuICAgICAgICAgIGNvbW1hbmQ6IFtjb21tYW5kXS5jb25jYXQoYXJncykuam9pbignICcpLFxuICAgICAgICAgIGVycm9yTWVzc2FnZTogZXJyb3IubWVzc2FnZSxcbiAgICAgICAgICBleGl0Q29kZTogZXJyb3IuY29kZSxcbiAgICAgICAgICBzdGRlcnI6IGZpcnN0Q2hpbGRTdGRlcnIsXG4gICAgICAgICAgc3Rkb3V0OiAnJyxcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgZmlyc3RDaGlsZC5zdGRlcnIub24oJ2RhdGEnLCBkYXRhID0+IHtcbiAgICAgICAgZmlyc3RDaGlsZFN0ZGVyciArPSBkYXRhO1xuICAgICAgfSk7XG5cbiAgICAgIGxhc3RDaGlsZCA9IHNwYXduKGxvY2FsT3B0aW9ucy5waXBlZENvbW1hbmQsIGxvY2FsT3B0aW9ucy5waXBlZEFyZ3MsIGxvY2FsT3B0aW9ucyk7XG4gICAgICBtb25pdG9yU3RyZWFtRXJyb3JzKGxhc3RDaGlsZCwgY29tbWFuZCwgYXJncywgbG9jYWxPcHRpb25zKTtcbiAgICAgIGZpcnN0Q2hpbGQuc3Rkb3V0LnBpcGUobGFzdENoaWxkLnN0ZGluKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGFzdENoaWxkID0gc3Bhd24oY29tbWFuZCwgYXJncywgbG9jYWxPcHRpb25zKTtcbiAgICAgIG1vbml0b3JTdHJlYW1FcnJvcnMobGFzdENoaWxkLCBjb21tYW5kLCBhcmdzLCBsb2NhbE9wdGlvbnMpO1xuICAgICAgZmlyc3RDaGlsZCA9IGxhc3RDaGlsZDtcbiAgICB9XG5cbiAgICB2YXIgc3RkZXJyID0gJyc7XG4gICAgdmFyIHN0ZG91dCA9ICcnO1xuICAgIGxhc3RDaGlsZC5vbignY2xvc2UnLCBleGl0Q29kZSA9PiB7XG4gICAgICByZXNvbHZlKHtcbiAgICAgICAgZXhpdENvZGUsXG4gICAgICAgIHN0ZGVycixcbiAgICAgICAgc3Rkb3V0LFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBsYXN0Q2hpbGQub24oJ2Vycm9yJywgZXJyb3IgPT4ge1xuICAgICAgLy8gUmVqZWN0IGVhcmx5IHdpdGggdGhlIHJlc3VsdCB3aGVuIGVuY291bnRlcmluZyBhbiBlcnJvci5cbiAgICAgIHJlamVjdCh7XG4gICAgICAgIGNvbW1hbmQ6IFtjb21tYW5kXS5jb25jYXQoYXJncykuam9pbignICcpLFxuICAgICAgICBlcnJvck1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UsXG4gICAgICAgIGV4aXRDb2RlOiBlcnJvci5jb2RlLFxuICAgICAgICBzdGRlcnIsXG4gICAgICAgIHN0ZG91dCxcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgbGFzdENoaWxkLnN0ZGVyci5vbignZGF0YScsIGRhdGEgPT4ge1xuICAgICAgc3RkZXJyICs9IGRhdGE7XG4gICAgfSk7XG4gICAgbGFzdENoaWxkLnN0ZG91dC5vbignZGF0YScsIGRhdGEgPT4ge1xuICAgICAgc3Rkb3V0ICs9IGRhdGE7XG4gICAgfSk7XG5cbiAgICBpZiAodHlwZW9mIGxvY2FsT3B0aW9ucy5zdGRpbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgIC8vIE5vdGUgdGhhdCB0aGUgTm9kZSBkb2NzIGhhdmUgdGhpcyBzY2FyeSB3YXJuaW5nIGFib3V0IHN0ZGluLmVuZCgpIG9uXG4gICAgICAvLyBodHRwOi8vbm9kZWpzLm9yZy9hcGkvY2hpbGRfcHJvY2Vzcy5odG1sI2NoaWxkX3Byb2Nlc3NfY2hpbGRfc3RkaW46XG4gICAgICAvL1xuICAgICAgLy8gXCJBIFdyaXRhYmxlIFN0cmVhbSB0aGF0IHJlcHJlc2VudHMgdGhlIGNoaWxkIHByb2Nlc3MncyBzdGRpbi4gQ2xvc2luZ1xuICAgICAgLy8gdGhpcyBzdHJlYW0gdmlhIGVuZCgpIG9mdGVuIGNhdXNlcyB0aGUgY2hpbGQgcHJvY2VzcyB0byB0ZXJtaW5hdGUuXCJcbiAgICAgIC8vXG4gICAgICAvLyBJbiBwcmFjdGljZSwgdGhpcyBoYXMgbm90IGFwcGVhcmVkIHRvIGNhdXNlIGFueSBpc3N1ZXMgdGh1cyBmYXIuXG4gICAgICBmaXJzdENoaWxkLnN0ZGluLndyaXRlKGxvY2FsT3B0aW9ucy5zdGRpbik7XG4gICAgICBmaXJzdENoaWxkLnN0ZGluLmVuZCgpO1xuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBtYWtlUHJvbWlzZSgpIHtcbiAgICBpZiAobG9jYWxPcHRpb25zLnF1ZXVlTmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoZXhlY3V0b3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIWJsb2NraW5nUXVldWVzW2xvY2FsT3B0aW9ucy5xdWV1ZU5hbWVdKSB7XG4gICAgICAgIGJsb2NraW5nUXVldWVzW2xvY2FsT3B0aW9ucy5xdWV1ZU5hbWVdID0gbmV3IFByb21pc2VRdWV1ZSgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGJsb2NraW5nUXVldWVzW2xvY2FsT3B0aW9ucy5xdWV1ZU5hbWVdLnN1Ym1pdChleGVjdXRvcik7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNyZWF0ZUV4ZWNFbnZpcm9ubWVudChsb2NhbE9wdGlvbnMuZW52IHx8IHByb2Nlc3MuZW52LCBDT01NT05fQklOQVJZX1BBVEhTKS50aGVuKFxuICAgIHZhbCA9PiB7XG4gICAgICBsb2NhbE9wdGlvbnMuZW52ID0gdmFsO1xuICAgICAgcmV0dXJuIG1ha2VQcm9taXNlKCk7XG4gICAgfSxcbiAgICBlcnIgPT4ge1xuICAgICAgbG9jYWxPcHRpb25zLmVudiA9IGxvY2FsT3B0aW9ucy5lbnYgfHwgcHJvY2Vzcy5lbnY7XG4gICAgICByZXR1cm4gbWFrZVByb21pc2UoKTtcbiAgICB9XG4gICk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGFzeW5jRXhlY3V0ZShcbiAgICBjb21tYW5kOiBzdHJpbmcsXG4gICAgYXJnczogQXJyYXk8c3RyaW5nPixcbiAgICBvcHRpb25zOiA/T2JqZWN0ID0ge30pOiBQcm9taXNlPHByb2Nlc3MkYXN5bmNFeGVjdXRlUmV0PiB7XG4gIHZhciByZXN1bHQgPSBhd2FpdCBjaGVja091dHB1dChjb21tYW5kLCBhcmdzLCBvcHRpb25zKTtcbiAgaWYgKHJlc3VsdC5leGl0Q29kZSAhPT0gMCkge1xuICAgIHRocm93IHJlc3VsdDtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYXN5bmNFeGVjdXRlLFxuICBjaGVja091dHB1dCxcbiAgc2FmZVNwYXduLFxuICBfX3Rlc3RfXzoge1xuICAgIERBUldJTl9QQVRIX0hFTFBFUl9SRUdFWFAsXG4gICAgY3JlYXRlRXhlY0Vudmlyb25tZW50LFxuICB9LFxufTtcbiJdfQ==