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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWluc3RhbGxlci9ub2RlX21vZHVsZXMvbnVjbGlkZS1pbnN0YWxsZXItYmFzZS9ub2RlX21vZHVsZXMvbnVjbGlkZS1jb21tb25zL2xpYi9wcm9jZXNzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7SUFvRUcscUJBQXFCLHFCQUFwQyxXQUNJLFdBQW1CLEVBQUUsaUJBQWdDLEVBQW1CO0FBQzFFLE1BQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxFQUFFLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDdEMsU0FBTyxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQzs7QUFFbEMsTUFBSSxZQUFZLENBQUM7QUFDakIsTUFBSSx5QkFBeUIsR0FBRyxLQUFLLENBQUM7QUFDdEMsTUFBSTtBQUNGLGdCQUFZLEdBQUcsTUFBTSxlQUFlLEVBQUUsQ0FBQztHQUN4QyxDQUFDLE9BQU8sS0FBSyxFQUFFOztBQUVkLDJCQUF1QixDQUFDLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0FBQ3BELDZCQUF5QixHQUFHLElBQUksQ0FBQztHQUNsQzs7OztBQUlELE1BQUksWUFBWSxFQUFFO0FBQ2hCLFdBQU8sQ0FBQyxJQUFJLEdBQUcsWUFBWSxDQUFDO0dBQzdCLE1BQU0sSUFBSSxDQUFDLHlCQUF5QixFQUFFO0FBQ3JDLDJCQUF1QixDQUFDLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0dBQ3JEOztBQUVELFNBQU8sT0FBTyxDQUFDO0NBQ2hCOztJQWtLYyxZQUFZLHFCQUEzQixXQUNJLE9BQWUsRUFDZixJQUFtQixFQUNzQztNQUF6RCxPQUFnQixnQ0FBRyxFQUFFOztBQUN2QixNQUFJLE1BQU0sR0FBRyxNQUFNLFdBQVcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ3ZELE1BQUksTUFBTSxDQUFDLFFB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QVksQ0FBQyxTQUFTLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDaEU7R0FDRjs7QUFFRCxTQUFPLHFCQUFxQixDQUFDLFlBQVksQ0FBQyxHQUFHLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDLElBQUksQ0FDckYsVUFBQSxHQUFHLEVBQUk7QUFDTCxnQkFBWSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7QUFDdkIsV0FBTyxXQUFXLEVBQUUsQ0FBQztHQUN0QixFQUNELFVBQUEsR0FBRyxFQUFJO0FBQ0wsZ0JBQVksQ0FBQyxHQUFHLEdBQUcsWUFBWSxDQUFDLEdBQUcsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDO0FBQ25ELFdBQU8sV0FBVyxFQUFFLENBQUM7R0FDdEIsQ0FDRixDQUFDO0NBQ0g7O0FBYUQsTUFBTSxDQUFDLE9BQU8sR0FBRztBQUNmLGNBQVksRUFBWixZQUFZO0FBQ1osYUFBVyxFQUFYLFdBQVc7QUFDWCxXQUFTLEVBQVQsU0FBUztBQUNULFVBQVEsRUFBRTtBQUNSLDZCQUF5QixFQUF6Qix5QkFBeUI7QUFDekIseUJBQXFCLEVBQXJCLHFCQUFxQjtHQUN0QjtDQUNGLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL251Y2xpZGUtaW5zdGFsbGVyL25vZGVfbW9kdWxlcy9udWNsaWRlLWluc3RhbGxlci1iYXNlL25vZGVfbW9kdWxlcy9udWNsaWRlLWNvbW1vbnMvbGliL3Byb2Nlc3MuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIge1xuICBleGVjRmlsZSxcbiAgc3Bhd24sXG59ID0gcmVxdWlyZSgnY2hpbGRfcHJvY2VzcycpO1xudmFyIHthc3NpZ259ID0gcmVxdWlyZSgnLi9vYmplY3QnKTtcbnZhciBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xudmFyIFByb21pc2VRdWV1ZSA9IHJlcXVpcmUoJy4vUHJvbWlzZVF1ZXVlJyk7XG5cbnZhciBwbGF0Zm9ybVBhdGhQcm9taXNlOiA/UHJvbWlzZTxzdHJpbmc+O1xuXG52YXIgYmxvY2tpbmdRdWV1ZXMgPSB7fTtcbnZhciBDT01NT05fQklOQVJZX1BBVEhTID0gWycvdXNyL2JpbicsICcvYmluJywgJy91c3Ivc2JpbicsICcvc2JpbicsICcvdXNyL2xvY2FsL2JpbiddO1xuXG4vKiBDYXB0dXJlcyB0aGUgdmFsdWUgb2YgdGhlIFBBVEggZW52IHZhcmlhYmxlIHJldHVybmVkIGJ5IERhcndpbidzIChPUyBYKSBgcGF0aF9oZWxwZXJgIHV0aWxpdHkuXG4gKiBgcGF0aF9oZWxwZXIgLXNgJ3MgcmV0dXJuIHZhbHVlIGxvb2tzIGxpa2UgdGhpczpcbiAqXG4gKiAgICAgUEFUSD1cIi91c3IvYmluXCI7IGV4cG9ydCBQQVRIO1xuICovXG52YXIgREFSV0lOX1BBVEhfSEVMUEVSX1JFR0VYUCA9IC9QQVRIPVxcXCIoW15cXFwiXSspXFxcIi87XG5cbmNvbnN0IFNUUkVBTV9OQU1FUyA9IFsnc3RkaW4nLCAnc3Rkb3V0JywgJ3N0ZGVyciddO1xuXG5mdW5jdGlvbiBnZXRQbGF0Zm9ybVBhdGgoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgaWYgKHBsYXRmb3JtUGF0aFByb21pc2UpIHtcbiAgICAvLyBQYXRoIGlzIGJlaW5nIGZldGNoZWQsIGF3YWl0IHRoZSBQcm9taXNlIHRoYXQncyBpbiBmbGlnaHQuXG4gICAgcmV0dXJuIHBsYXRmb3JtUGF0aFByb21pc2U7XG4gIH1cblxuICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbicpIHtcbiAgICAvLyBPUyBYIGFwcHMgZG9uJ3QgaW5oZXJpdCBQQVRIIHdoZW4gbm90IGxhdW5jaGVkIGZyb20gdGhlIENMSSwgc28gcmVjb25zdHJ1Y3QgaXQuIFRoaXMgaXMgYVxuICAgIC8vIGJ1ZywgZmlsZWQgYWdhaW5zdCBBdG9tIExpbnRlciBoZXJlOiBodHRwczovL2dpdGh1Yi5jb20vQXRvbUxpbnRlci9MaW50ZXIvaXNzdWVzLzE1MFxuICAgIC8vIFRPRE8oamppYWEpOiByZW1vdmUgdGhpcyBoYWNrIHdoZW4gdGhlIEF0b20gaXNzdWUgaXMgY2xvc2VkXG4gICAgcGxhdGZvcm1QYXRoUHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGV4ZWNGaWxlKCcvdXNyL2xpYmV4ZWMvcGF0aF9oZWxwZXInLCBbJy1zJ10sIChlcnJvciwgc3Rkb3V0LCBzdGRlcnIpID0+IHtcbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgbWF0Y2ggPSBzdGRvdXQubWF0Y2goREFSV0lOX1BBVEhfSEVMUEVSX1JFR0VYUCk7XG4gICAgICAgICAgcmVzb2x2ZSgobWF0Y2ggJiYgbWF0Y2gubGVuZ3RoID4gMSkgPyBtYXRjaFsxXSA6ICcnKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgcGxhdGZvcm1QYXRoUHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgnJyk7XG4gIH1cblxuICByZXR1cm4gcGxhdGZvcm1QYXRoUHJvbWlzZTtcbn1cblxuZnVuY3Rpb24gYXBwZW5kQ29tbW9uQmluYXJ5UGF0aHMoZW52OiBPYmplY3QsIGNvbW1vbkJpbmFyeVBhdGhzOiBBcnJheTxzdHJpbmc+KTogdm9pZCB7XG4gIGNvbW1vbkJpbmFyeVBhdGhzLmZvckVhY2goKGJpbmFyeVBhdGgpID0+IHtcbiAgICBpZiAoZW52LlBBVEguaW5kZXhPZihiaW5hcnlQYXRoKSA9PT0gLTEpIHtcbiAgICAgIGVudi5QQVRIICs9IHBhdGguZGVsaW1pdGVyICsgYmluYXJ5UGF0aDtcbiAgICB9XG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBjcmVhdGVFeGVjRW52aXJvbm1lbnQoXG4gICAgb3JpZ2luYWxFbnY6IE9iamVjdCwgY29tbW9uQmluYXJ5UGF0aHM6IEFycmF5PHN0cmluZz4pOiBQcm9taXNlPE9iamVjdD4ge1xuICB2YXIgZXhlY0VudiA9IGFzc2lnbih7fSwgb3JpZ2luYWxFbnYpO1xuICBleGVjRW52LlBBVEggPSBleGVjRW52LlBBVEggfHwgJyc7XG5cbiAgdmFyIHBsYXRmb3JtUGF0aDtcbiAgdmFyIGNvbW1vbkJpbmFyeVBhdGhzQXBwZW5kZWQgPSBmYWxzZTtcbiAgdHJ5IHtcbiAgICBwbGF0Zm9ybVBhdGggPSBhd2FpdCBnZXRQbGF0Zm9ybVBhdGgoKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAvLyBJZiB0aGVyZSdzIGFuIGVycm9yIGZldGNoaW5nIHRoZSBwbGF0Zm9ybSdzIFBBVEgsIHVzZSB0aGUgZGVmYXVsdCBzZXQgb2YgY29tbW9uIGJpbmFyeSBwYXRocy5cbiAgICBhcHBlbmRDb21tb25CaW5hcnlQYXRocyhleGVjRW52LCBjb21tb25CaW5hcnlQYXRocyk7XG4gICAgY29tbW9uQmluYXJ5UGF0aHNBcHBlbmRlZCA9IHRydWU7XG4gIH1cblxuICAvLyBJZiB0aGUgcGxhdGZvcm0gcmV0dXJucyBhIG5vbi1lbXB0eSBQQVRILCB1c2UgaXQuIE90aGVyd2lzZSB1c2UgdGhlIGRlZmF1bHQgc2V0IG9mIGNvbW1vblxuICAvLyBiaW5hcnkgcGF0aHMuXG4gIGlmIChwbGF0Zm9ybVBhdGgpIHtcbiAgICBleGVjRW52LlBBVEggPSBwbGF0Zm9ybVBhdGg7XG4gIH0gZWxzZSBpZiAoIWNvbW1vbkJpbmFyeVBhdGhzQXBwZW5kZWQpIHtcbiAgICBhcHBlbmRDb21tb25CaW5hcnlQYXRocyhleGVjRW52LCBjb21tb25CaW5hcnlQYXRocyk7XG4gIH1cblxuICByZXR1cm4gZXhlY0Vudjtcbn1cblxuZnVuY3Rpb24gbG9nRXJyb3IoLi4uYXJncykge1xuICAvLyBDYW4ndCB1c2UgbnVjbGlkZS1sb2dnaW5nIGhlcmUgdG8gbm90IGNhdXNlIGN5Y2xlIGRlcGVuZGVuY3kuXG4gIC8qZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSovXG4gIGNvbnNvbGUuZXJyb3IoLi4uYXJncyk7XG4gIC8qZXNsaW50LWVuYWJsZSBuby1jb25zb2xlKi9cbn1cblxuZnVuY3Rpb24gbW9uaXRvclN0cmVhbUVycm9ycyhwcm9jZXNzOiBjaGlsZF9wcm9jZXNzJENoaWxkUHJvY2VzcywgY29tbWFuZCwgYXJncywgb3B0aW9ucyk6IHZvaWQge1xuICBTVFJFQU1fTkFNRVMuZm9yRWFjaChzdHJlYW1OYW1lID0+IHtcbiAgICBwcm9jZXNzW3N0cmVhbU5hbWVdLm9uKCdlcnJvcicsIGVycm9yID0+IHtcbiAgICAgIC8vIFRoaXMgY2FuIGhhcHBlbiB3aXRob3V0IHRoZSBmdWxsIGV4ZWN1dGlvbiBvZiB0aGUgY29tbWFuZCB0byBmYWlsLCBidXQgd2Ugd2FudCB0byBsZWFybiBhYm91dCBpdC5cbiAgICAgIGxvZ0Vycm9yKCdzdHJlYW0gZXJyb3Igd2l0aCBjb21tYW5kOicsIGNvbW1hbmQsIGFyZ3MsIG9wdGlvbnMsICdlcnJvcjonLCBlcnJvcik7XG4gICAgfSk7XG4gIH0pO1xufVxuXG4vKiogQmFzaWNhbGx5IGxpa2Ugc3Bhd24sIGV4Y2VwdCBpdCBoYW5kbGVzIGFuZCBsb2dzIGVycm9ycyBpbnN0ZWFkIG9mIGNyYXNoaW5nXG4gICogdGhlIHByb2Nlc3MuIFRoaXMgaXMgbXVjaCBsb3dlci1sZXZlbCB0aGFuIGFzeW5jRXhlY3V0ZS4gVW5sZXNzIHlvdSBoYXZlIGFcbiAgKiBzcGVjaWZpYyByZWFzb24geW91IHNob3VsZCB1c2UgYXN5bmNFeGVjdXRlIGluc3RlYWQuICovXG5mdW5jdGlvbiBzYWZlU3Bhd24oY29tbWFuZDogc3RyaW5nLCBhcmdzOiBBcnJheTxzdHJpbmc+ID0gW10sIG9wdGlvbnM6IE9iamVjdCA9IHt9KTogY2hpbGRfcHJvY2VzcyRDaGlsZFByb2Nlc3Mge1xuICB2YXIgY2hpbGQgPSBzcGF3bihjb21tYW5kLCBhcmdzLCBvcHRpb25zKTtcbiAgbW9uaXRvclN0cmVhbUVycm9ycyhjaGlsZCwgY29tbWFuZCwgYXJncywgb3B0aW9ucyk7XG4gIGNoaWxkLm9uKCdlcnJvcicsIGVycm9yID0+IHtcbiAgICBsb2dFcnJvcignZXJyb3Igd2l0aCBjb21tYW5kOicsIGNvbW1hbmQsIGFyZ3MsIG9wdGlvbnMsICdlcnJvcjonLCBlcnJvcik7XG4gIH0pO1xuICByZXR1cm4gY2hpbGQ7XG59XG5cbnR5cGUgcHJvY2VzcyRhc3luY0V4ZWN1dGVSZXQgPSB7XG4gIGNvbW1hbmQ/OiBzdHJpbmc7XG4gIGVycm9yTWVzc2FnZT86IHN0cmluZztcbiAgZXhpdENvZGU6IG51bWJlcjtcbiAgc3RkZXJyOiBzdHJpbmc7XG4gIHN0ZG91dDogc3RyaW5nO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIHRoZSByZXN1bHQgb2YgZXhlY3V0aW5nIGEgcHJvY2Vzcy5cbiAqXG4gKiBAcGFyYW0gY29tbWFuZCBUaGUgY29tbWFuZCB0byBleGVjdXRlLlxuICogQHBhcmFtIGFyZ3MgVGhlIGFyZ3VtZW50cyB0byBwYXNzIHRvIHRoZSBjb21tYW5kLlxuICogQHBhcmFtIG9wdGlvbnMgT3B0aW9ucyBmb3IgY2hhbmdpbmcgaG93IHRvIHJ1biB0aGUgY29tbWFuZC5cbiAqICAgICBTZWUgaGVyZTogaHR0cDovL25vZGVqcy5vcmcvYXBpL2NoaWxkX3Byb2Nlc3MuaHRtbFxuICogICAgIFRoZSBhZGRpdGlvbmFsIG9wdGlvbnMgd2UgcHJvdmlkZTpcbiAqICAgICAgIHF1ZXVlTmFtZSBzdHJpbmcgVGhlIHF1ZXVlIG9uIHdoaWNoIHRvIGJsb2NrIGRlcGVuZGVudCBjYWxscy5cbiAqICAgICAgIHN0ZGluIHN0cmluZyBUaGUgY29udGVudHMgdG8gd3JpdGUgdG8gc3RkaW4uXG4gKiAgICAgICBwaXBlZENvbW1hbmQgc3RyaW5nIGEgY29tbWFuZCB0byBwaXBlIHRoZSBvdXRwdXQgb2YgY29tbWFuZCB0aHJvdWdoLlxuICogICAgICAgcGlwZWRBcmdzIGFycmF5IG9mIHN0cmluZ3MgYXMgYXJndW1lbnRzLlxuICogQHJldHVybiBQcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYW4gb2JqZWN0IHdpdGggdGhlIHByb3BlcnRpZXM6XG4gKiAgICAgc3Rkb3V0IHN0cmluZyBUaGUgY29udGVudHMgb2YgdGhlIHByb2Nlc3MncyBvdXRwdXQgc3RyZWFtLlxuICogICAgIHN0ZGVyciBzdHJpbmcgVGhlIGNvbnRlbnRzIG9mIHRoZSBwcm9jZXNzJ3MgZXJyb3Igc3RyZWFtLlxuICogICAgIGV4aXRDb2RlIG51bWJlciBUaGUgZXhpdCBjb2RlIHJldHVybmVkIGJ5IHRoZSBwcm9jZXNzLlxuICovXG5mdW5jdGlvbiBjaGVja091dHB1dChcbiAgICBjb21tYW5kOiBzdHJpbmcsXG4gICAgYXJnczogQXJyYXk8c3RyaW5nPixcbiAgICBvcHRpb25zOiA/T2JqZWN0ID0ge30pOiBQcm9taXNlPHByb2Nlc3MkYXN5bmNFeGVjdXRlUmV0PiB7XG4gIC8vIENsb25lIHBhc3NlZCBpbiBvcHRpb25zIHNvIHRoaXMgZnVuY3Rpb24gZG9lc24ndCBtb2RpZnkgYW4gb2JqZWN0IGl0IGRvZXNuJ3Qgb3duLlxuICB2YXIgbG9jYWxPcHRpb25zID0gYXNzaWduKHt9LCBvcHRpb25zKTtcblxuICB2YXIgZXhlY3V0b3IgPSAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgdmFyIGZpcnN0Q2hpbGQ7XG4gICAgdmFyIGxhc3RDaGlsZDtcblxuICAgIHZhciBmaXJzdENoaWxkU3RkZXJyO1xuICAgIGlmIChsb2NhbE9wdGlvbnMucGlwZWRDb21tYW5kKSB7XG4gICAgICAvLyBJZiBhIHNlY29uZCBjb21tYW5kIGlzIGdpdmVuLCBwaXBlIHN0ZG91dCBvZiBmaXJzdCB0byBzdGRpbiBvZiBzZWNvbmQuIFN0cmluZyBvdXRwdXRcbiAgICAgIC8vIHJldHVybmVkIGluIHRoaXMgZnVuY3Rpb24ncyBQcm9taXNlIHdpbGwgYmUgc3RkZXJyL3N0ZG91dCBvZiB0aGUgc2Vjb25kIGNvbW1hbmQuXG4gICAgICBmaXJzdENoaWxkID0gc3Bhd24oY29tbWFuZCwgYXJncywgbG9jYWxPcHRpb25zKTtcbiAgICAgIG1vbml0b3JTdHJlYW1FcnJvcnMoZmlyc3RDaGlsZCwgY29tbWFuZCwgYXJncywgbG9jYWxPcHRpb25zKTtcbiAgICAgIGZpcnN0Q2hpbGRTdGRlcnIgPSAnJztcblxuICAgICAgZmlyc3RDaGlsZC5vbignZXJyb3InLCBlcnJvciA9PiB7XG4gICAgICAgIC8vIFJlamVjdCBlYXJseSB3aXRoIHRoZSByZXN1bHQgd2hlbiBlbmNvdW50ZXJpbmcgYW4gZXJyb3IuXG4gICAgICAgIHJlamVjdCh7XG4gICAgICAgICAgY29tbWFuZDogW2NvbW1hbmRdLmNvbmNhdChhcmdzKS5qb2luKCcgJyksXG4gICAgICAgICAgZXJyb3JNZXNzYWdlOiBlcnJvci5tZXNzYWdlLFxuICAgICAgICAgIGV4aXRDb2RlOiBlcnJvci5jb2RlLFxuICAgICAgICAgIHN0ZGVycjogZmlyc3RDaGlsZFN0ZGVycixcbiAgICAgICAgICBzdGRvdXQ6ICcnLFxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBmaXJzdENoaWxkLnN0ZGVyci5vbignZGF0YScsIGRhdGEgPT4ge1xuICAgICAgICBmaXJzdENoaWxkU3RkZXJyICs9IGRhdGE7XG4gICAgICB9KTtcblxuICAgICAgbGFzdENoaWxkID0gc3Bhd24obG9jYWxPcHRpb25zLnBpcGVkQ29tbWFuZCwgbG9jYWxPcHRpb25zLnBpcGVkQXJncywgbG9jYWxPcHRpb25zKTtcbiAgICAgIG1vbml0b3JTdHJlYW1FcnJvcnMobGFzdENoaWxkLCBjb21tYW5kLCBhcmdzLCBsb2NhbE9wdGlvbnMpO1xuICAgICAgZmlyc3RDaGlsZC5zdGRvdXQucGlwZShsYXN0Q2hpbGQuc3RkaW4pO1xuICAgIH0gZWxzZSB7XG4gICAgICBsYXN0Q2hpbGQgPSBzcGF3bihjb21tYW5kLCBhcmdzLCBsb2NhbE9wdGlvbnMpO1xuICAgICAgbW9uaXRvclN0cmVhbUVycm9ycyhsYXN0Q2hpbGQsIGNvbW1hbmQsIGFyZ3MsIGxvY2FsT3B0aW9ucyk7XG4gICAgICBmaXJzdENoaWxkID0gbGFzdENoaWxkO1xuICAgIH1cblxuICAgIHZhciBzdGRlcnIgPSAnJztcbiAgICB2YXIgc3Rkb3V0ID0gJyc7XG4gICAgbGFzdENoaWxkLm9uKCdjbG9zZScsIGV4aXRDb2RlID0+IHtcbiAgICAgIHJlc29sdmUoe1xuICAgICAgICBleGl0Q29kZSxcbiAgICAgICAgc3RkZXJyLFxuICAgICAgICBzdGRvdXQsXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGxhc3RDaGlsZC5vbignZXJyb3InLCBlcnJvciA9PiB7XG4gICAgICAvLyBSZWplY3QgZWFybHkgd2l0aCB0aGUgcmVzdWx0IHdoZW4gZW5jb3VudGVyaW5nIGFuIGVycm9yLlxuICAgICAgcmVqZWN0KHtcbiAgICAgICAgY29tbWFuZDogW2NvbW1hbmRdLmNvbmNhdChhcmdzKS5qb2luKCcgJyksXG4gICAgICAgIGVycm9yTWVzc2FnZTogZXJyb3IubWVzc2FnZSxcbiAgICAgICAgZXhpdENvZGU6IGVycm9yLmNvZGUsXG4gICAgICAgIHN0ZGVycixcbiAgICAgICAgc3Rkb3V0LFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBsYXN0Q2hpbGQuc3RkZXJyLm9uKCdkYXRhJywgZGF0YSA9PiB7XG4gICAgICBzdGRlcnIgKz0gZGF0YTtcbiAgICB9KTtcbiAgICBsYXN0Q2hpbGQuc3Rkb3V0Lm9uKCdkYXRhJywgZGF0YSA9PiB7XG4gICAgICBzdGRvdXQgKz0gZGF0YTtcbiAgICB9KTtcblxuICAgIGlmICh0eXBlb2YgbG9jYWxPcHRpb25zLnN0ZGluID09PSAnc3RyaW5nJykge1xuICAgICAgLy8gTm90ZSB0aGF0IHRoZSBOb2RlIGRvY3MgaGF2ZSB0aGlzIHNjYXJ5IHdhcm5pbmcgYWJvdXQgc3RkaW4uZW5kKCkgb25cbiAgICAgIC8vIGh0dHA6Ly9ub2RlanMub3JnL2FwaS9jaGlsZF9wcm9jZXNzLmh0bWwjY2hpbGRfcHJvY2Vzc19jaGlsZF9zdGRpbjpcbiAgICAgIC8vXG4gICAgICAvLyBcIkEgV3JpdGFibGUgU3RyZWFtIHRoYXQgcmVwcmVzZW50cyB0aGUgY2hpbGQgcHJvY2VzcydzIHN0ZGluLiBDbG9zaW5nXG4gICAgICAvLyB0aGlzIHN0cmVhbSB2aWEgZW5kKCkgb2Z0ZW4gY2F1c2VzIHRoZSBjaGlsZCBwcm9jZXNzIHRvIHRlcm1pbmF0ZS5cIlxuICAgICAgLy9cbiAgICAgIC8vIEluIHByYWN0aWNlLCB0aGlzIGhhcyBub3QgYXBwZWFyZWQgdG8gY2F1c2UgYW55IGlzc3VlcyB0aHVzIGZhci5cbiAgICAgIGZpcnN0Q2hpbGQuc3RkaW4ud3JpdGUobG9jYWxPcHRpb25zLnN0ZGluKTtcbiAgICAgIGZpcnN0Q2hpbGQuc3RkaW4uZW5kKCk7XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIG1ha2VQcm9taXNlKCkge1xuICAgIGlmIChsb2NhbE9wdGlvbnMucXVldWVOYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShleGVjdXRvcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghYmxvY2tpbmdRdWV1ZXNbbG9jYWxPcHRpb25zLnF1ZXVlTmFtZV0pIHtcbiAgICAgICAgYmxvY2tpbmdRdWV1ZXNbbG9jYWxPcHRpb25zLnF1ZXVlTmFtZV0gPSBuZXcgUHJvbWlzZVF1ZXVlKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gYmxvY2tpbmdRdWV1ZXNbbG9jYWxPcHRpb25zLnF1ZXVlTmFtZV0uc3VibWl0KGV4ZWN1dG9yKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gY3JlYXRlRXhlY0Vudmlyb25tZW50KGxvY2FsT3B0aW9ucy5lbnYgfHwgcHJvY2Vzcy5lbnYsIENPTU1PTl9CSU5BUllfUEFUSFMpLnRoZW4oXG4gICAgdmFsID0+IHtcbiAgICAgIGxvY2FsT3B0aW9ucy5lbnYgPSB2YWw7XG4gICAgICByZXR1cm4gbWFrZVByb21pc2UoKTtcbiAgICB9LFxuICAgIGVyciA9PiB7XG4gICAgICBsb2NhbE9wdGlvbnMuZW52ID0gbG9jYWxPcHRpb25zLmVudiB8fCBwcm9jZXNzLmVudjtcbiAgICAgIHJldHVybiBtYWtlUHJvbWlzZSgpO1xuICAgIH1cbiAgKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gYXN5bmNFeGVjdXRlKFxuICAgIGNvbW1hbmQ6IHN0cmluZyxcbiAgICBhcmdzOiBBcnJheTxzdHJpbmc+LFxuICAgIG9wdGlvbnM6ID9PYmplY3QgPSB7fSk6IFByb21pc2U8cHJvY2VzcyRhc3luY0V4ZWN1dGVSZXQ+IHtcbiAgdmFyIHJlc3VsdCA9IGF3YWl0IGNoZWNrT3V0cHV0KGNvbW1hbmQsIGFyZ3MsIG9wdGlvbnMpO1xuICBpZiAocmVzdWx0LmV4aXRDb2RlICE9PSAwKSB7XG4gICAgdGhyb3cgcmVzdWx0O1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhc3luY0V4ZWN1dGUsXG4gIGNoZWNrT3V0cHV0LFxuICBzYWZlU3Bhd24sXG4gIF9fdGVzdF9fOiB7XG4gICAgREFSV0lOX1BBVEhfSEVMUEVSX1JFR0VYUCxcbiAgICBjcmVhdGVFeGVjRW52aXJvbm1lbnQsXG4gIH0sXG59O1xuIl19