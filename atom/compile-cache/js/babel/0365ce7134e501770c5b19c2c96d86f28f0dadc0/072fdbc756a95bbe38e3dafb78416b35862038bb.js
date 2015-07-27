'use babel';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var logger = require('nuclide-logging').getLogger();

var _require = require('nuclide-server/lib/config');

var loadConfigsOfServiceWithServiceFramework = _require.loadConfigsOfServiceWithServiceFramework;

var _require2 = require('nuclide-server/lib/service-manager');

var optionsToString = _require2.optionsToString;

var _require3 = require('nuclide-remote-connection');

var RemoteConnection = _require3.RemoteConnection;

var _require4 = require('nuclide-remote-uri');

var isRemote = _require4.isRemote;
var getHostname = _require4.getHostname;

var serviceConfigs = loadConfigsOfServiceWithServiceFramework();

// A cache stores services in form of '$serviceName@$host:$options' => $serviceObject. A special
// case would be the local service, where the $host will be empty string.
var cachedServices = new Map();

RemoteConnection.onDidCloseRemoteConnection(function (connection) {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = cachedServices[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var cacheEntry = _step.value;

      var _cacheEntry = _slicedToArray(cacheEntry, 2);

      var cacheKey = _cacheEntry[0];
      var serviceInstance = _cacheEntry[1];

      if (serviceInstance._connection === connection) {
        cachedServices['delete'](cacheKey);
      }
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
});

/**
 * Create or get a cached service with given serviceOptions.
 * @param nuclideUri It could either be either a local path or a remote path in form of
 *    `nuclide:$host:$port/$path`. The function will use the $host from remote path to
 *    create a remote service with given serviceOptions or create a local service if the
 *    uri is local path.
 */
function getServiceByNuclideUri(serviceName) {
  var nuclideUri = arguments[1] === undefined ? null : arguments[1];
  var serviceOptions = arguments[2] === undefined ? null : arguments[2];

  var hostname = nuclideUri && isRemote(nuclideUri) ? getHostname(nuclideUri) : null;
  return getService(serviceName, hostname, serviceOptions);
}

/**
 * Create or get a cached service with given serviceOptions. If hostname is null or empty string,
 * it returns a local service, otherwise a remote service will be returned. For the same host
 * serviceOptions, the same service instance will be returned.
 */
function getService(serviceName, hostname, serviceOptions) {
  var _serviceConfigs$filter = serviceConfigs.filter(function (config) {
    return config.name === serviceName;
  });

  var _serviceConfigs$filter2 = _slicedToArray(_serviceConfigs$filter, 1);

  var serviceConfig = _serviceConfigs$filter2[0];

  if (!serviceConfig) {
    logger.error('Service %s undefined.', serviceName);
    return null;
  }

  var cacheKey = serviceName + '@' + (hostname ? hostname : '') + ':' + optionsToString(serviceOptions);

  if (cachedServices.has(cacheKey)) {
    return cachedServices.get(cacheKey);
  }

  serviceOptions = serviceOptions || {};

  if (hostname) {
    var serviceInstance = createRemoteService(serviceConfig, hostname, serviceOptions);
  } else {
    var serviceInstance = createLocalService(serviceConfig, serviceOptions);
  }
  cachedServices.set(cacheKey, serviceInstance);

  return serviceInstance;
}

function createRemoteService(serviceConfig, hostname, serviceOptions) {
  var _require5 = require('nuclide-service-transformer');

  var requireRemoteServiceSync = _require5.requireRemoteServiceSync;

  var remoteServiceClass = requireRemoteServiceSync(serviceConfig.definition);
  var remoteConnection = RemoteConnection.getByHostnameAndPath(hostname, null);
  return new remoteServiceClass(remoteConnection, serviceOptions);
}

function createLocalService(serviceConfig, serviceOptions) {
  var serviceClass = require(serviceConfig.implementation);
  return new serviceClass(serviceOptions);
}

module.exports = {
  getService: getService,
  getServiceByNuclideUri: getServiceByNuclideUri
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9ub2RlX21vZHVsZXMvbnVjbGlkZS1jbGllbnQvbGliL3NlcnZpY2UtbWFuYWdlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7O0FBV1osSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7O2VBQ0gsT0FBTyxDQUFDLDJCQUEyQixDQUFDOztJQUFoRix3Q0FBd0MsWUFBeEMsd0NBQXdDOztnQkFDckIsT0FBTyxDQUFDLG9DQUFvQyxDQUFDOztJQUFoRSxlQUFlLGFBQWYsZUFBZTs7Z0JBQ0ssT0FBTyxDQUFDLDJCQUEyQixDQUFDOztJQUF4RCxnQkFBZ0IsYUFBaEIsZ0JBQWdCOztnQkFDUyxPQUFPLENBQUMsb0JBQW9CLENBQUM7O0lBQXRELFFBQVEsYUFBUixRQUFRO0lBQUUsV0FBVyxhQUFYLFdBQVc7O0FBRTFCLElBQUksY0FBYyxHQUFHLHdDQUF3QyxFQUFFLENBQUM7Ozs7QUFJaEUsSUFBSSxjQUFnQyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7O0FBRWpELGdCQUFnQixDQUFDLDBCQUEwQixDQUFDLFVBQUMsVUFBVSxFQUF1Qjs7Ozs7O0FBQzVFLHlCQUF1QixjQUFjLDhIQUFFO1VBQTlCLFVBQVU7O3VDQUNpQixVQUFVOztVQUF2QyxRQUFRO1VBQUUsZUFBZTs7QUFDOUIsVUFBSSxlQUFlLENBQUMsV0FBVyxLQUFLLFVBQVUsRUFBRTtBQUM5QyxzQkFBYyxVQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7T0FDakM7S0FDRjs7Ozs7Ozs7Ozs7Ozs7O0NBQ0YsQ0FBQyxDQUFDOzs7Ozs7Ozs7QUFTSCxTQUFTLHNCQUFzQixDQUM3QixXQUFtQixFQUdiO01BRk4sVUFBdUIsZ0NBQUcsSUFBSTtNQUM5QixjQUFvQixnQ0FBRyxJQUFJOztBQUUzQixNQUFJLFFBQVEsR0FBRyxVQUFXLElBQUksUUFBUSxDQUFDLFVBQVUsQ0FBQyxHQUNoRCxXQUFXLENBQUMsVUFBVSxDQUFDLEdBQ3ZCLElBQUksQ0FBQztBQUNQLFNBQU8sVUFBVSxDQUFDLFdBQVcsRUFBRSxRQUFRLEVBQUUsY0FBYyxDQUFDLENBQUM7Q0FDMUQ7Ozs7Ozs7QUFPRCxTQUFTLFVBQVUsQ0FBQyxXQUFtQixFQUFFLFFBQWlCLEVBQUUsY0FBb0IsRUFBUTsrQkFDaEUsY0FBYyxDQUFDLE1BQU0sQ0FBQyxVQUFBLE1BQU07V0FBSSxNQUFNLENBQUMsSUFBSSxLQUFLLFdBQVc7R0FBQSxDQUFDOzs7O01BQTdFLGFBQWE7O0FBQ2xCLE1BQUksQ0FBQyxhQUFhLEVBQUU7QUFDbEIsVUFBTSxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxXQUFXLENBQUMsQ0FBQztBQUNuRCxXQUFPLElBQUksQ0FBQztHQUNiOztBQUVELE1BQUksUUFBUSxHQUFHLFdBQVcsR0FBRyxHQUFHLElBQUksUUFBUSxHQUFHLFFBQVEsR0FBRyxFQUFFLENBQUEsR0FBSSxHQUFHLEdBQUcsZUFBZSxDQUFDLGNBQWMsQ0FBQyxDQUFDOztBQUV0RyxNQUFJLGNBQWMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUU7QUFDaEMsV0FBTyxjQUFjLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0dBQ3JDOztBQUVELGdCQUFjLEdBQUcsY0FBYyxJQUFJLEVBQUUsQ0FBQzs7QUFFdEMsTUFBSSxRQUFRLEVBQUU7QUFDWixRQUFJLGVBQWUsR0FBRyxtQkFBbUIsQ0FBQyxhQUFhLEVBQUUsUUFBUSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0dBQ3BGLE1BQU07QUFDTCxRQUFJLGVBQWUsR0FBRyxrQkFBa0IsQ0FBQyxhQUFhLEVBQUUsY0FBYyxDQUFDLENBQUM7R0FDekU7QUFDRCxnQkFBYyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsZUFBZSxDQUFDLENBQUM7O0FBRTlDLFNBQU8sZUFBZSxDQUFDO0NBQ3hCOztBQUVELFNBQVMsbUJBQW1CLENBQUMsYUFBNEIsRUFBRSxRQUFnQixFQUFFLGNBQW1CLEVBQU87a0JBQ3BFLE9BQU8sQ0FBQyw2QkFBNkIsQ0FBQzs7TUFBbEUsd0JBQXdCLGFBQXhCLHdCQUF3Qjs7QUFDN0IsTUFBSSxrQkFBa0IsR0FBRyx3QkFBd0IsQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDNUUsTUFBSSxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDN0UsU0FBTyxJQUFJLGtCQUFrQixDQUFDLGdCQUFnQixFQUFFLGNBQWMsQ0FBQyxDQUFDO0NBQ2pFOztBQUVELFNBQVMsa0JBQWtCLENBQUMsYUFBNEIsRUFBRSxjQUFtQixFQUFPO0FBQ2xGLE1BQUksWUFBWSxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDekQsU0FBTyxJQUFJLFlBQVksQ0FBQyxjQUFjLENBQUMsQ0FBQztDQUN6Qzs7QUFFRCxNQUFNLENBQUMsT0FBTyxHQUFHO0FBQ2YsWUFBVSxFQUFWLFVBQVU7QUFDVix3QkFBc0IsRUFBdEIsc0JBQXNCO0NBQ3ZCLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL251Y2xpZGUtcmVtb3RlLXByb2plY3RzL25vZGVfbW9kdWxlcy9udWNsaWRlLWNsaWVudC9saWIvc2VydmljZS1tYW5hZ2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxudmFyIGxvZ2dlciA9IHJlcXVpcmUoJ251Y2xpZGUtbG9nZ2luZycpLmdldExvZ2dlcigpO1xudmFyIHtsb2FkQ29uZmlnc09mU2VydmljZVdpdGhTZXJ2aWNlRnJhbWV3b3JrfSA9IHJlcXVpcmUoJ251Y2xpZGUtc2VydmVyL2xpYi9jb25maWcnKTtcbnZhciB7b3B0aW9uc1RvU3RyaW5nfSA9IHJlcXVpcmUoJ251Y2xpZGUtc2VydmVyL2xpYi9zZXJ2aWNlLW1hbmFnZXInKTtcbnZhciB7UmVtb3RlQ29ubmVjdGlvbn0gPSByZXF1aXJlKCdudWNsaWRlLXJlbW90ZS1jb25uZWN0aW9uJyk7XG52YXIge2lzUmVtb3RlLCBnZXRIb3N0bmFtZX0gPSByZXF1aXJlKCdudWNsaWRlLXJlbW90ZS11cmknKTtcblxudmFyIHNlcnZpY2VDb25maWdzID0gbG9hZENvbmZpZ3NPZlNlcnZpY2VXaXRoU2VydmljZUZyYW1ld29yaygpO1xuXG4vLyBBIGNhY2hlIHN0b3JlcyBzZXJ2aWNlcyBpbiBmb3JtIG9mICckc2VydmljZU5hbWVAJGhvc3Q6JG9wdGlvbnMnID0+ICRzZXJ2aWNlT2JqZWN0LiBBIHNwZWNpYWxcbi8vIGNhc2Ugd291bGQgYmUgdGhlIGxvY2FsIHNlcnZpY2UsIHdoZXJlIHRoZSAkaG9zdCB3aWxsIGJlIGVtcHR5IHN0cmluZy5cbnZhciBjYWNoZWRTZXJ2aWNlczogTWFwPHN0cmluZywgYW55PiA9IG5ldyBNYXAoKTtcblxuUmVtb3RlQ29ubmVjdGlvbi5vbkRpZENsb3NlUmVtb3RlQ29ubmVjdGlvbigoY29ubmVjdGlvbjogUmVtb3RlQ29ubmVjdGlvbikgPT4ge1xuICBmb3IgKHZhciBjYWNoZUVudHJ5IG9mIGNhY2hlZFNlcnZpY2VzKSB7XG4gICAgdmFyIFtjYWNoZUtleSwgc2VydmljZUluc3RhbmNlXSA9IGNhY2hlRW50cnk7XG4gICAgaWYgKHNlcnZpY2VJbnN0YW5jZS5fY29ubmVjdGlvbiA9PT0gY29ubmVjdGlvbikge1xuICAgICAgY2FjaGVkU2VydmljZXMuZGVsZXRlKGNhY2hlS2V5KTtcbiAgICB9XG4gIH1cbn0pO1xuXG4vKipcbiAqIENyZWF0ZSBvciBnZXQgYSBjYWNoZWQgc2VydmljZSB3aXRoIGdpdmVuIHNlcnZpY2VPcHRpb25zLlxuICogQHBhcmFtIG51Y2xpZGVVcmkgSXQgY291bGQgZWl0aGVyIGJlIGVpdGhlciBhIGxvY2FsIHBhdGggb3IgYSByZW1vdGUgcGF0aCBpbiBmb3JtIG9mXG4gKiAgICBgbnVjbGlkZTokaG9zdDokcG9ydC8kcGF0aGAuIFRoZSBmdW5jdGlvbiB3aWxsIHVzZSB0aGUgJGhvc3QgZnJvbSByZW1vdGUgcGF0aCB0b1xuICogICAgY3JlYXRlIGEgcmVtb3RlIHNlcnZpY2Ugd2l0aCBnaXZlbiBzZXJ2aWNlT3B0aW9ucyBvciBjcmVhdGUgYSBsb2NhbCBzZXJ2aWNlIGlmIHRoZVxuICogICAgdXJpIGlzIGxvY2FsIHBhdGguXG4gKi9cbmZ1bmN0aW9uIGdldFNlcnZpY2VCeU51Y2xpZGVVcmkoXG4gIHNlcnZpY2VOYW1lOiBzdHJpbmcsXG4gIG51Y2xpZGVVcmk6ID9OdWNsaWRlVXJpID0gbnVsbCxcbiAgc2VydmljZU9wdGlvbnM6ID9hbnkgPSBudWxsXG4pOiA/YW55IHtcbiAgdmFyIGhvc3RuYW1lID0gKG51Y2xpZGVVcmkgJiYgaXNSZW1vdGUobnVjbGlkZVVyaSkpID9cbiAgICBnZXRIb3N0bmFtZShudWNsaWRlVXJpKSA6XG4gICAgbnVsbDtcbiAgcmV0dXJuIGdldFNlcnZpY2Uoc2VydmljZU5hbWUsIGhvc3RuYW1lLCBzZXJ2aWNlT3B0aW9ucyk7XG59XG5cbi8qKlxuICogQ3JlYXRlIG9yIGdldCBhIGNhY2hlZCBzZXJ2aWNlIHdpdGggZ2l2ZW4gc2VydmljZU9wdGlvbnMuIElmIGhvc3RuYW1lIGlzIG51bGwgb3IgZW1wdHkgc3RyaW5nLFxuICogaXQgcmV0dXJucyBhIGxvY2FsIHNlcnZpY2UsIG90aGVyd2lzZSBhIHJlbW90ZSBzZXJ2aWNlIHdpbGwgYmUgcmV0dXJuZWQuIEZvciB0aGUgc2FtZSBob3N0XG4gKiBzZXJ2aWNlT3B0aW9ucywgdGhlIHNhbWUgc2VydmljZSBpbnN0YW5jZSB3aWxsIGJlIHJldHVybmVkLlxuICovXG5mdW5jdGlvbiBnZXRTZXJ2aWNlKHNlcnZpY2VOYW1lOiBzdHJpbmcsIGhvc3RuYW1lOiA/c3RyaW5nLCBzZXJ2aWNlT3B0aW9uczogP2FueSk6ID9hbnkge1xuICB2YXIgW3NlcnZpY2VDb25maWddID0gc2VydmljZUNvbmZpZ3MuZmlsdGVyKGNvbmZpZyA9PiBjb25maWcubmFtZSA9PT0gc2VydmljZU5hbWUpO1xuICBpZiAoIXNlcnZpY2VDb25maWcpIHtcbiAgICBsb2dnZXIuZXJyb3IoJ1NlcnZpY2UgJXMgdW5kZWZpbmVkLicsIHNlcnZpY2VOYW1lKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHZhciBjYWNoZUtleSA9IHNlcnZpY2VOYW1lICsgJ0AnICsgKGhvc3RuYW1lID8gaG9zdG5hbWUgOiAnJykgKyAnOicgKyBvcHRpb25zVG9TdHJpbmcoc2VydmljZU9wdGlvbnMpO1xuXG4gIGlmIChjYWNoZWRTZXJ2aWNlcy5oYXMoY2FjaGVLZXkpKSB7XG4gICAgcmV0dXJuIGNhY2hlZFNlcnZpY2VzLmdldChjYWNoZUtleSk7XG4gIH1cblxuICBzZXJ2aWNlT3B0aW9ucyA9IHNlcnZpY2VPcHRpb25zIHx8IHt9O1xuXG4gIGlmIChob3N0bmFtZSkge1xuICAgIHZhciBzZXJ2aWNlSW5zdGFuY2UgPSBjcmVhdGVSZW1vdGVTZXJ2aWNlKHNlcnZpY2VDb25maWcsIGhvc3RuYW1lLCBzZXJ2aWNlT3B0aW9ucyk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIHNlcnZpY2VJbnN0YW5jZSA9IGNyZWF0ZUxvY2FsU2VydmljZShzZXJ2aWNlQ29uZmlnLCBzZXJ2aWNlT3B0aW9ucyk7XG4gIH1cbiAgY2FjaGVkU2VydmljZXMuc2V0KGNhY2hlS2V5LCBzZXJ2aWNlSW5zdGFuY2UpO1xuXG4gIHJldHVybiBzZXJ2aWNlSW5zdGFuY2U7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlbW90ZVNlcnZpY2Uoc2VydmljZUNvbmZpZzogU2VydmljZUNvbmZpZywgaG9zdG5hbWU6IHN0cmluZywgc2VydmljZU9wdGlvbnM6IGFueSk6IGFueSB7XG4gIHZhciB7cmVxdWlyZVJlbW90ZVNlcnZpY2VTeW5jfSA9IHJlcXVpcmUoJ251Y2xpZGUtc2VydmljZS10cmFuc2Zvcm1lcicpO1xuICB2YXIgcmVtb3RlU2VydmljZUNsYXNzID0gcmVxdWlyZVJlbW90ZVNlcnZpY2VTeW5jKHNlcnZpY2VDb25maWcuZGVmaW5pdGlvbik7XG4gIHZhciByZW1vdGVDb25uZWN0aW9uID0gUmVtb3RlQ29ubmVjdGlvbi5nZXRCeUhvc3RuYW1lQW5kUGF0aChob3N0bmFtZSwgbnVsbCk7XG4gIHJldHVybiBuZXcgcmVtb3RlU2VydmljZUNsYXNzKHJlbW90ZUNvbm5lY3Rpb24sIHNlcnZpY2VPcHRpb25zKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlTG9jYWxTZXJ2aWNlKHNlcnZpY2VDb25maWc6IFNlcnZpY2VDb25maWcsIHNlcnZpY2VPcHRpb25zOiBhbnkpOiBhbnkge1xuICB2YXIgc2VydmljZUNsYXNzID0gcmVxdWlyZShzZXJ2aWNlQ29uZmlnLmltcGxlbWVudGF0aW9uKTtcbiAgcmV0dXJuIG5ldyBzZXJ2aWNlQ2xhc3Moc2VydmljZU9wdGlvbnMpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ2V0U2VydmljZSxcbiAgZ2V0U2VydmljZUJ5TnVjbGlkZVVyaSxcbn07XG4iXX0=