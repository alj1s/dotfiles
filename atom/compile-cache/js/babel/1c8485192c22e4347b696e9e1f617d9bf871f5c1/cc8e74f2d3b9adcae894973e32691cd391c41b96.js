'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

/**
 * Installs the Atom packages specified in the config.
 * @return Promise that resolves if the installation succeeds.
 */

var installPackagesInConfig = _asyncToGenerator(function* (config) {
  var installedPackages = yield getInstalledPackages();
  var packagesToInstall = findPackagesToInstall(config, installedPackages);
  yield installApmPackages(packagesToInstall);
});

/**
 * Calls `apm ls --json`, parses the JSON written to stdout, and filters the value
 * of the `"user"` property of the JSON to produce a map of (name, version) pairs
 * that correspond to user-installed Atom packages.
 */

var getInstalledPackages = _asyncToGenerator(function* () {
  var _require = require('nuclide-commons');

  var asyncExecute = _require.asyncExecute;

  var apm = atom.packages.getApmPath();
  var json;
  try {
    var _ref = yield asyncExecute(apm, ['ls', '--json']);

    var stdout = _ref.stdout;

    json = stdout;
  } catch (e) {
    /*eslint-disable no-console*/
    // Write to the console because this make it easier for users to report errors.
    console.error('Could not get the list of Atom packages from ' + apm + ' ls --json.');
    /*eslint-enable no-console*/
    throw Error(apm + ' ls --json failed with exit code ' + e.exitCode);
  }

  var installedPackages = {};
  JSON.parse(json)['user'].forEach(function (pkg) {
    installedPackages[pkg['name']] = pkg['version'];
  });
  return installedPackages;
});

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function findPackagesToInstall(config, installedPackages) {
  var packagesToInstall = [];
  config.packages.forEach(function (pkg) {
    var name = pkg.name;
    var version = pkg.version;

    if (!name) {
      throw Error('Entry without a name in ' + JSON.stringify(config, null, 2));
    }
    if (!version) {
      throw Error('Entry without a version in ' + JSON.stringify(config, null, 2));
    }
    if (installedPackages[name] !== version) {
      packagesToInstall.push(name + '@' + version);
    }
  });
  return packagesToInstall;
}

/**
 * Installs the list of Atom packages serially.
 */
function installApmPackages(packages) {
  var _require2 = require('nuclide-commons');

  var asyncExecute = _require2.asyncExecute;
  var PromiseQueue = _require2.PromiseQueue;

  var queue = new PromiseQueue();
  var apm = atom.packages.getApmPath();
  var promises = [];
  packages.forEach(function (pkg) {
    var executor = function executor(resolve, reject) {
      return asyncExecute(apm, ['install', pkg]).then(resolve, reject);
    };
    var promise = queue.submit(executor);
    promises.push(promise);
  });
  return Promise.all(promises);
}

module.exports = {
  installPackagesInConfig: installPackagesInConfig,
  __test__: {
    findPackagesToInstall: findPackagesToInstall
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWluc3RhbGxlci9ub2RlX21vZHVsZXMvbnVjbGlkZS1pbnN0YWxsZXItYmFzZS9saWIvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7SUEyQkcsdUJBQXVCLHFCQUF0QyxXQUF1QyxNQUFxQixFQUFXO0FBQ3JFLE1BQUksaUJBQWlCLEdBQUcsTUFBTSxvQkFBb0IsRUFBRSxDQUFDO0FBQ3JELE1BQUksaUJBQWlCLEdBQUcscUJBQXFCLENBQUMsTUFBTSxFQUFFLGlCQUFpQixDQUFDLENBQUM7QUFDekUsUUFBTSxrQkFBa0IsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0NBQzdDOzs7Ozs7OztJQU9jLG9CQUFvQixxQkFBbkMsYUFBcUY7aUJBQzlELE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQzs7TUFBMUMsWUFBWSxZQUFaLFlBQVk7O0FBQ2pCLE1BQUksR0FBRyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDckMsTUFBSSxJQUFJLENBQUM7QUFDVCxNQUFJO2VBQ2EsTUFBTSxZQUFZLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDOztRQUFuRCxNQUFNLFFBQU4sTUFBTTs7QUFDWCxRQUFJLEdBQUcsTUFBTSxDQUFDO0dBQ2YsQ0FBQyxPQUFPLENBQUMsRUFBRTs7O0FBR1YsV0FBTyxDQUFDLEtBQUssbURBQWlELEdBQUcsaUJBQWMsQ0FBQzs7QUFFaEYsVUFBTSxLQUFLLENBQUksR0FBRyx5Q0FBb0MsQ0FBQyxDQUFDLFFBQVEsQ0FBRyxDQUFDO0dBQ3JFOztBQUVELE1BQUksaUJBQWlCLEdBQUcsRUFBRSxDQUFDO0FBQzNCLE1BQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQUEsR0FBRyxFQUFJO0FBQ3RDLHFCQUFpQixDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztHQUNqRCxDQUFDLENBQUM7QUFDSCxTQUFPLGlCQUFpQixDQUFDO0NBQzFCOzs7O0FBRUQsU0FBUyxxQkFBcUIsQ0FDNUIsTUFBcUIsRUFDckIsaUJBQXVELEVBQ3RDO0FBQ2pCLE1BQUksaUJBQWlCLEdBQUcsRUFBRSxDQUFDO0FBQzNCLFFBQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFVBQUEsR0FBRyxFQUFJO1FBQ3hCLElBQUksR0FBYSxHQUFHLENBQXBCLElBQUk7UUFBRSxPQUFPLEdBQUksR0FBRyxDQUFkLE9BQU87O0FBQ2xCLFFBQUksQ0FBQyxJQUFJLEVBQUU7QUFDVCxZQUFNLEtBQUssOEJBQTRCLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBRyxDQUFDO0tBQzNFO0FBQ0QsUUFBSSxDQUFDLE9BQU8sRUFBRTtBQUNaLFlBQU0sS0FBSyxpQ0FBK0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFHLENBQUM7S0FDOUU7QUFDRCxRQUFJLGlCQUFpQixDQUFDLElBQUksQ0FBQyxLQUFLLE9BQU8sRUFBRTtBQUN2Qyx1QkFBaUIsQ0FBQyxJQUFJLENBQUksSUFBSSxTQUFJLE9BQU8sQ0FBRyxDQUFDO0tBQzlDO0dBQ0YsQ0FBQyxDQUFDO0FBQ0gsU0FBTyxpQkFBaUIsQ0FBQztDQUMxQjs7Ozs7QUFLRCxTQUFTLGtCQUFrQixDQUFDLFFBQXVCLEVBQVc7a0JBQ3pCLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQzs7TUFBeEQsWUFBWSxhQUFaLFlBQVk7TUFBRSxZQUFZLGFBQVosWUFBWTs7QUFDL0IsTUFBSSxLQUFLLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQztBQUMvQixNQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQ3JDLE1BQUksUUFBUSxHQUFHLEVBQUUsQ0FBQztBQUNsQixVQUFRLENBQUMsT0FBTyxDQUFDLFVBQUEsR0FBRyxFQUFJO0FBQ3RCLFFBQUksUUFBUSxHQUFHLFNBQVgsUUFBUSxDQUFJLE9BQU8sRUFBRSxNQUFNO2FBQUssWUFBWSxDQUFDLEdBQUcsRUFBRSxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDO0tBQUEsQ0FBQztBQUM5RixRQUFJLE9BQU8sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3JDLFlBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7R0FDeEIsQ0FBQyxDQUFDO0FBQ0gsU0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0NBQzlCOztBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUc7QUFDZix5QkFBdUIsRUFBdkIsdUJBQXVCO0FBQ3ZCLFVBQVEsRUFBRTtBQUNSLHlCQUFxQixFQUFyQixxQkFBcUI7R0FDdEI7Q0FDRixDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWluc3RhbGxlci9ub2RlX21vZHVsZXMvbnVjbGlkZS1pbnN0YWxsZXItYmFzZS9saWIvbWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbnR5cGUgUGFja2FnZU5hbWUgPSBzdHJpbmc7XG50eXBlIFBhY2thZ2VWZXJzaW9uID0gc3RyaW5nO1xuXG50eXBlIEluc3RhbGxDb25maWdFbnRyeSA9IHtcbiAgbmFtZTogUGFja2FnZU5hbWU7XG4gIHZlcnNpb246IFBhY2thZ2VWZXJzaW9uO1xufTtcblxudHlwZSBJbnN0YWxsQ29uZmlnID0ge1xuICBwYWNrYWdlczogQXJyYXk8SW5zdGFsbENvbmZpZ0VudHJ5Pjtcbn07XG5cbi8qKlxuICogSW5zdGFsbHMgdGhlIEF0b20gcGFja2FnZXMgc3BlY2lmaWVkIGluIHRoZSBjb25maWcuXG4gKiBAcmV0dXJuIFByb21pc2UgdGhhdCByZXNvbHZlcyBpZiB0aGUgaW5zdGFsbGF0aW9uIHN1Y2NlZWRzLlxuICovXG5hc3luYyBmdW5jdGlvbiBpbnN0YWxsUGFja2FnZXNJbkNvbmZpZyhjb25maWc6IEluc3RhbGxDb25maWcpOiBQcm9taXNlIHtcbiAgdmFyIGluc3RhbGxlZFBhY2thZ2VzID0gYXdhaXQgZ2V0SW5zdGFsbGVkUGFja2FnZXMoKTtcbiAgdmFyIHBhY2thZ2VzVG9JbnN0YWxsID0gZmluZFBhY2thZ2VzVG9JbnN0YWxsKGNvbmZpZywgaW5zdGFsbGVkUGFja2FnZXMpO1xuICBhd2FpdCBpbnN0YWxsQXBtUGFja2FnZXMocGFja2FnZXNUb0luc3RhbGwpO1xufVxuXG4vKipcbiAqIENhbGxzIGBhcG0gbHMgLS1qc29uYCwgcGFyc2VzIHRoZSBKU09OIHdyaXR0ZW4gdG8gc3Rkb3V0LCBhbmQgZmlsdGVycyB0aGUgdmFsdWVcbiAqIG9mIHRoZSBgXCJ1c2VyXCJgIHByb3BlcnR5IG9mIHRoZSBKU09OIHRvIHByb2R1Y2UgYSBtYXAgb2YgKG5hbWUsIHZlcnNpb24pIHBhaXJzXG4gKiB0aGF0IGNvcnJlc3BvbmQgdG8gdXNlci1pbnN0YWxsZWQgQXRvbSBwYWNrYWdlcy5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gZ2V0SW5zdGFsbGVkUGFja2FnZXMoKTogUHJvbWlzZTx7W2tleTogUGFja2FnZU5hbWVdOiBQYWNrYWdlVmVyc2lvbn0+IHtcbiAgdmFyIHthc3luY0V4ZWN1dGV9ID0gcmVxdWlyZSgnbnVjbGlkZS1jb21tb25zJyk7XG4gIHZhciBhcG0gPSBhdG9tLnBhY2thZ2VzLmdldEFwbVBhdGgoKTtcbiAgdmFyIGpzb247XG4gIHRyeSB7XG4gICAgdmFyIHtzdGRvdXR9ID0gYXdhaXQgYXN5bmNFeGVjdXRlKGFwbSwgWydscycsICctLWpzb24nXSk7XG4gICAganNvbiA9IHN0ZG91dDtcbiAgfSBjYXRjaCAoZSkge1xuICAgIC8qZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSovXG4gICAgLy8gV3JpdGUgdG8gdGhlIGNvbnNvbGUgYmVjYXVzZSB0aGlzIG1ha2UgaXQgZWFzaWVyIGZvciB1c2VycyB0byByZXBvcnQgZXJyb3JzLlxuICAgIGNvbnNvbGUuZXJyb3IoYENvdWxkIG5vdCBnZXQgdGhlIGxpc3Qgb2YgQXRvbSBwYWNrYWdlcyBmcm9tICR7YXBtfSBscyAtLWpzb24uYCk7XG4gICAgLyplc2xpbnQtZW5hYmxlIG5vLWNvbnNvbGUqL1xuICAgIHRocm93IEVycm9yKGAke2FwbX0gbHMgLS1qc29uIGZhaWxlZCB3aXRoIGV4aXQgY29kZSAke2UuZXhpdENvZGV9YCk7XG4gIH1cblxuICB2YXIgaW5zdGFsbGVkUGFja2FnZXMgPSB7fTtcbiAgSlNPTi5wYXJzZShqc29uKVsndXNlciddLmZvckVhY2gocGtnID0+IHtcbiAgICBpbnN0YWxsZWRQYWNrYWdlc1twa2dbJ25hbWUnXV0gPSBwa2dbJ3ZlcnNpb24nXTtcbiAgfSk7XG4gIHJldHVybiBpbnN0YWxsZWRQYWNrYWdlcztcbn1cblxuZnVuY3Rpb24gZmluZFBhY2thZ2VzVG9JbnN0YWxsKFxuICBjb25maWc6IEluc3RhbGxDb25maWcsXG4gIGluc3RhbGxlZFBhY2thZ2VzOiB7W2tleTogUGFja2FnZU5hbWVdOiBQYWNrYWdlVmVyc2lvbn1cbiAgKTogQXJyYXk8c3RyaW5nPiB7XG4gIHZhciBwYWNrYWdlc1RvSW5zdGFsbCA9IFtdO1xuICBjb25maWcucGFja2FnZXMuZm9yRWFjaChwa2cgPT4ge1xuICAgIHZhciB7bmFtZSwgdmVyc2lvbn0gPSBwa2c7XG4gICAgaWYgKCFuYW1lKSB7XG4gICAgICB0aHJvdyBFcnJvcihgRW50cnkgd2l0aG91dCBhIG5hbWUgaW4gJHtKU09OLnN0cmluZ2lmeShjb25maWcsIG51bGwsIDIpfWApO1xuICAgIH1cbiAgICBpZiAoIXZlcnNpb24pIHtcbiAgICAgIHRocm93IEVycm9yKGBFbnRyeSB3aXRob3V0IGEgdmVyc2lvbiBpbiAke0pTT04uc3RyaW5naWZ5KGNvbmZpZywgbnVsbCwgMil9YCk7XG4gICAgfVxuICAgIGlmIChpbnN0YWxsZWRQYWNrYWdlc1tuYW1lXSAhPT0gdmVyc2lvbikge1xuICAgICAgcGFja2FnZXNUb0luc3RhbGwucHVzaChgJHtuYW1lfUAke3ZlcnNpb259YCk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIHBhY2thZ2VzVG9JbnN0YWxsO1xufVxuXG4vKipcbiAqIEluc3RhbGxzIHRoZSBsaXN0IG9mIEF0b20gcGFja2FnZXMgc2VyaWFsbHkuXG4gKi9cbmZ1bmN0aW9uIGluc3RhbGxBcG1QYWNrYWdlcyhwYWNrYWdlczogQXJyYXk8c3RyaW5nPik6IFByb21pc2Uge1xuICB2YXIge2FzeW5jRXhlY3V0ZSwgUHJvbWlzZVF1ZXVlfSA9IHJlcXVpcmUoJ251Y2xpZGUtY29tbW9ucycpO1xuICB2YXIgcXVldWUgPSBuZXcgUHJvbWlzZVF1ZXVlKCk7XG4gIHZhciBhcG0gPSBhdG9tLnBhY2thZ2VzLmdldEFwbVBhdGgoKTtcbiAgdmFyIHByb21pc2VzID0gW107XG4gIHBhY2thZ2VzLmZvckVhY2gocGtnID0+IHtcbiAgICB2YXIgZXhlY3V0b3IgPSAocmVzb2x2ZSwgcmVqZWN0KSA9PiBhc3luY0V4ZWN1dGUoYXBtLCBbJ2luc3RhbGwnLCBwa2ddKS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgdmFyIHByb21pc2UgPSBxdWV1ZS5zdWJtaXQoZXhlY3V0b3IpO1xuICAgIHByb21pc2VzLnB1c2gocHJvbWlzZSk7XG4gIH0pO1xuICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgaW5zdGFsbFBhY2thZ2VzSW5Db25maWcsXG4gIF9fdGVzdF9fOiB7XG4gICAgZmluZFBhY2thZ2VzVG9JbnN0YWxsLFxuICB9LFxufTtcbiJdfQ==