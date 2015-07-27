'use babel';

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9ub2RlX21vZHVsZXMvbnVjbGlkZS1jbGllbnQvbGliL3NlcnZpY2UtbWFuYWdlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7O0FBV1osSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7O2VBQ0gsT0FBTyxDQUFDLDJCQUEyQixDQUFDOztJQUFoRix3Q0FBd0MsWUFBeEMsd0NBQXdDOztnQkFDckIsT0FBTyxDQUFDLG9DQUFvQyxDQUFDOztJQUFoRSxlQUFlLGFBQWYsZUFBZTs7Z0JBQ0ssT0FBTyxDQUFDLDJCQUEyQixDQUFDOztJQUF4RCxnQkFBZ0IsYUFBaEIsZ0JBQWdCOztnQkFDUyxPQUFPLENBQUMsb0JBQW9CLENBQUM7O0lBQXRELFFBQVEsYUFBUixRQUFRO0lBQUUsV0FBVyxhQUFYLFdBQVc7O0FBRTFCLElBQUksY0FBYyxHQUFHLHdDQUF3QyxFQUFFLENBQUM7Ozs7QUFJaEUsSUFBSSxjQUFnQyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7O0FBRWpELGdCQUFnQixDQUFDLDBCQUEwQixDQUFDLFVBQUMsVUFBVSxFQUF1Qjs7Ozs7O0FBQzVFLHlCQUF1QixjQUFjLDhIQUFFO1VBQTlCLFVBQVU7O3VDQUNpQixVQUFVOztVQUF2QyxRQUFRO1VBQUUsZUFBZTs7QUFDOUIsVUFBSSxlQUFlLENBQUMsV0FBVyxLQUFLLFVBQVUsRUFBRTtBQUM5QyxzQkFBYyxVQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7T0FDakM7S0FDRjs7Ozs7Ozs7Ozs7Ozs7O0NBQ0YsQ0FBQyxDQUFDOzs7Ozs7Ozs7QUFTSCxTQUFTLHNCQUFzQixDQUM3QixXQUFtQixFQUdiO01BRk4sVUFBdUIsZ0NBQUcsSUFBSTtNQUM5QixjQUFvQixnQ0FBRyxJQUFJOztBQUUzQixNQUFJLFFBQVEsR0FBRyxBQUFDLFVBQVUsSUFBSSxRQUFRLENBQUMsVUFBVSxDQUFDLEdBQ2hELFdBQVcsQ0FBQyxVQUFVLENBQUMsR0FDdkIsSUFBSSxDQUFDO0FBQ1AsU0FBTyxVQUFVLENBQUMsV0FBVyxFQUFFLFFBQVEsRUFBRSxjQUFjLENBQUMsQ0FBQztDQUMxRDs7Ozs7OztBQU9ELFNBQVMsVUFBVSxDQUFDLFdBQW1CLEVBQUUsUUFBaUIsRUFBRSxjQUFvQixFQUFROytCQUNoRSxjQUFjLENBQUMsTUFBTSxDQUFDLFVBQUEsTUFBTTtXQUFJLE1BQU0sQ0FBQyxJQUFJLEtBQUssV0FBVztHQUFBLENBQUM7Ozs7TUFBN0UsYUFBYTs7QUFDbEIsTUFBSSxDQUFDLGFBQWEsRUFBRTtBQUNsQixVQUFNLENBQUMsS0FBSyxDQUFDLHVCQUF1QixFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBQ25ELFdBQU8sSUFBSSxDQUFDO0dBQ2I7O0FBRUQsTUFBSSxRQUFRLEdBQUcsV0FBVyxHQUFHLEdBQUcsSUFBSSxRQUFRLEdBQUcsUUFBUSxHQUFHLEVBQUUsQ0FBQSxBQUFDLEdBQUcsR0FBRyxHQUFHLGVBQWUsQ0FBQyxjQUFjLENBQUMsQ0FBQzs7QUFFdEcsTUFBSSxjQUFjLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFO0FBQ2hDLFdBQU8sY0FBYyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztHQUNyQzs7QUFFRCxnQkFBYyxHQUFHLGNBQWMsSUFBSSxFQUFFLENBQUM7O0FBRXRDLE1BQUksUUFBUSxFQUFFO0FBQ1osUUFBSSxlQUFlLEdBQUcsbUJBQW1CLENBQUMsYUFBYSxFQUFFLFFBQVEsRUFBRSxjQUFjLENBQUMsQ0FBQztHQUNwRixNQUFNO0FBQ0wsUUFBSSxlQUFlLEdBQUcsa0JBQWtCLENBQUMsYUFBYSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0dBQ3pFO0FBQ0QsZ0JBQWMsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLGVBQWUsQ0FBQyxDQUFDOztBQUU5QyxTQUFPLGVBQWUsQ0FBQztDQUN4Qjs7QUFFRCxTQUFTLG1CQUFtQixDQUFDLGFBQTRCLEVBQUUsUUFBZ0IsRUFBRSxjQUFtQixFQUFPO2tCQUNwRSxPQUFPLENBQUMsNkJBQTZCLENBQUM7O01BQWxFLHdCQUF3QixhQUF4Qix3QkFBd0I7O0FBQzdCLE1BQUksa0JBQWtCLEdBQUcsd0JBQXdCLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzVFLE1BQUksZ0JBQWdCLEdBQUcsZ0JBQWdCLENBQUMsb0JBQW9CLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQzdFLFNBQU8sSUFBSSxrQkFBa0IsQ0FBQyxnQkFBZ0IsRUFBRSxjQUFjLENBQUMsQ0FBQztDQUNqRTs7QUFFRCxTQUFTLGtCQUFrQixDQUFDLGFBQTRCLEVBQUUsY0FBbUIsRUFBTztBQUNsRixNQUFJLFlBQVksR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3pELFNBQU8sSUFBSSxZQUFZLENBQUMsY0FBYyxDQUFDLENBQUM7Q0FDekM7O0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRztBQUNmLFlBQVUsRUFBVixVQUFVO0FBQ1Ysd0JBQXNCLEVBQXRCLHNCQUFzQjtDQUN2QixDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9ub2RlX21vZHVsZXMvbnVjbGlkZS1jbGllbnQvbGliL3NlcnZpY2UtbWFuYWdlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbnZhciBsb2dnZXIgPSByZXF1aXJlKCdudWNsaWRlLWxvZ2dpbmcnKS5nZXRMb2dnZXIoKTtcbnZhciB7bG9hZENvbmZpZ3NPZlNlcnZpY2VXaXRoU2VydmljZUZyYW1ld29ya30gPSByZXF1aXJlKCdudWNsaWRlLXNlcnZlci9saWIvY29uZmlnJyk7XG52YXIge29wdGlvbnNUb1N0cmluZ30gPSByZXF1aXJlKCdudWNsaWRlLXNlcnZlci9saWIvc2VydmljZS1tYW5hZ2VyJyk7XG52YXIge1JlbW90ZUNvbm5lY3Rpb259ID0gcmVxdWlyZSgnbnVjbGlkZS1yZW1vdGUtY29ubmVjdGlvbicpO1xudmFyIHtpc1JlbW90ZSwgZ2V0SG9zdG5hbWV9ID0gcmVxdWlyZSgnbnVjbGlkZS1yZW1vdGUtdXJpJyk7XG5cbnZhciBzZXJ2aWNlQ29uZmlncyA9IGxvYWRDb25maWdzT2ZTZXJ2aWNlV2l0aFNlcnZpY2VGcmFtZXdvcmsoKTtcblxuLy8gQSBjYWNoZSBzdG9yZXMgc2VydmljZXMgaW4gZm9ybSBvZiAnJHNlcnZpY2VOYW1lQCRob3N0OiRvcHRpb25zJyA9PiAkc2VydmljZU9iamVjdC4gQSBzcGVjaWFsXG4vLyBjYXNlIHdvdWxkIGJlIHRoZSBsb2NhbCBzZXJ2aWNlLCB3aGVyZSB0aGUgJGhvc3Qgd2lsbCBiZSBlbXB0eSBzdHJpbmcuXG52YXIgY2FjaGVkU2VydmljZXM6IE1hcDxzdHJpbmcsIGFueT4gPSBuZXcgTWFwKCk7XG5cblJlbW90ZUNvbm5lY3Rpb24ub25EaWRDbG9zZVJlbW90ZUNvbm5lY3Rpb24oKGNvbm5lY3Rpb246IFJlbW90ZUNvbm5lY3Rpb24pID0+IHtcbiAgZm9yICh2YXIgY2FjaGVFbnRyeSBvZiBjYWNoZWRTZXJ2aWNlcykge1xuICAgIHZhciBbY2FjaGVLZXksIHNlcnZpY2VJbnN0YW5jZV0gPSBjYWNoZUVudHJ5O1xuICAgIGlmIChzZXJ2aWNlSW5zdGFuY2UuX2Nvbm5lY3Rpb24gPT09IGNvbm5lY3Rpb24pIHtcbiAgICAgIGNhY2hlZFNlcnZpY2VzLmRlbGV0ZShjYWNoZUtleSk7XG4gICAgfVxuICB9XG59KTtcblxuLyoqXG4gKiBDcmVhdGUgb3IgZ2V0IGEgY2FjaGVkIHNlcnZpY2Ugd2l0aCBnaXZlbiBzZXJ2aWNlT3B0aW9ucy5cbiAqIEBwYXJhbSBudWNsaWRlVXJpIEl0IGNvdWxkIGVpdGhlciBiZSBlaXRoZXIgYSBsb2NhbCBwYXRoIG9yIGEgcmVtb3RlIHBhdGggaW4gZm9ybSBvZlxuICogICAgYG51Y2xpZGU6JGhvc3Q6JHBvcnQvJHBhdGhgLiBUaGUgZnVuY3Rpb24gd2lsbCB1c2UgdGhlICRob3N0IGZyb20gcmVtb3RlIHBhdGggdG9cbiAqICAgIGNyZWF0ZSBhIHJlbW90ZSBzZXJ2aWNlIHdpdGggZ2l2ZW4gc2VydmljZU9wdGlvbnMgb3IgY3JlYXRlIGEgbG9jYWwgc2VydmljZSBpZiB0aGVcbiAqICAgIHVyaSBpcyBsb2NhbCBwYXRoLlxuICovXG5mdW5jdGlvbiBnZXRTZXJ2aWNlQnlOdWNsaWRlVXJpKFxuICBzZXJ2aWNlTmFtZTogc3RyaW5nLFxuICBudWNsaWRlVXJpOiA/TnVjbGlkZVVyaSA9IG51bGwsXG4gIHNlcnZpY2VPcHRpb25zOiA/YW55ID0gbnVsbFxuKTogP2FueSB7XG4gIHZhciBob3N0bmFtZSA9IChudWNsaWRlVXJpICYmIGlzUmVtb3RlKG51Y2xpZGVVcmkpKSA/XG4gICAgZ2V0SG9zdG5hbWUobnVjbGlkZVVyaSkgOlxuICAgIG51bGw7XG4gIHJldHVybiBnZXRTZXJ2aWNlKHNlcnZpY2VOYW1lLCBob3N0bmFtZSwgc2VydmljZU9wdGlvbnMpO1xufVxuXG4vKipcbiAqIENyZWF0ZSBvciBnZXQgYSBjYWNoZWQgc2VydmljZSB3aXRoIGdpdmVuIHNlcnZpY2VPcHRpb25zLiBJZiBob3N0bmFtZSBpcyBudWxsIG9yIGVtcHR5IHN0cmluZyxcbiAqIGl0IHJldHVybnMgYSBsb2NhbCBzZXJ2aWNlLCBvdGhlcndpc2UgYSByZW1vdGUgc2VydmljZSB3aWxsIGJlIHJldHVybmVkLiBGb3IgdGhlIHNhbWUgaG9zdFxuICogc2VydmljZU9wdGlvbnMsIHRoZSBzYW1lIHNlcnZpY2UgaW5zdGFuY2Ugd2lsbCBiZSByZXR1cm5lZC5cbiAqL1xuZnVuY3Rpb24gZ2V0U2VydmljZShzZXJ2aWNlTmFtZTogc3RyaW5nLCBob3N0bmFtZTogP3N0cmluZywgc2VydmljZU9wdGlvbnM6ID9hbnkpOiA/YW55IHtcbiAgdmFyIFtzZXJ2aWNlQ29uZmlnXSA9IHNlcnZpY2VDb25maWdzLmZpbHRlcihjb25maWcgPT4gY29uZmlnLm5hbWUgPT09IHNlcnZpY2VOYW1lKTtcbiAgaWYgKCFzZXJ2aWNlQ29uZmlnKSB7XG4gICAgbG9nZ2VyLmVycm9yKCdTZXJ2aWNlICVzIHVuZGVmaW5lZC4nLCBzZXJ2aWNlTmFtZSk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICB2YXIgY2FjaGVLZXkgPSBzZXJ2aWNlTmFtZSArICdAJyArIChob3N0bmFtZSA/IGhvc3RuYW1lIDogJycpICsgJzonICsgb3B0aW9uc1RvU3RyaW5nKHNlcnZpY2VPcHRpb25zKTtcblxuICBpZiAoY2FjaGVkU2VydmljZXMuaGFzKGNhY2hlS2V5KSkge1xuICAgIHJldHVybiBjYWNoZWRTZXJ2aWNlcy5nZXQoY2FjaGVLZXkpO1xuICB9XG5cbiAgc2VydmljZU9wdGlvbnMgPSBzZXJ2aWNlT3B0aW9ucyB8fCB7fTtcblxuICBpZiAoaG9zdG5hbWUpIHtcbiAgICB2YXIgc2VydmljZUluc3RhbmNlID0gY3JlYXRlUmVtb3RlU2VydmljZShzZXJ2aWNlQ29uZmlnLCBob3N0bmFtZSwgc2VydmljZU9wdGlvbnMpO1xuICB9IGVsc2Uge1xuICAgIHZhciBzZXJ2aWNlSW5zdGFuY2UgPSBjcmVhdGVMb2NhbFNlcnZpY2Uoc2VydmljZUNvbmZpZywgc2VydmljZU9wdGlvbnMpO1xuICB9XG4gIGNhY2hlZFNlcnZpY2VzLnNldChjYWNoZUtleSwgc2VydmljZUluc3RhbmNlKTtcblxuICByZXR1cm4gc2VydmljZUluc3RhbmNlO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVSZW1vdGVTZXJ2aWNlKHNlcnZpY2VDb25maWc6IFNlcnZpY2VDb25maWcsIGhvc3RuYW1lOiBzdHJpbmcsIHNlcnZpY2VPcHRpb25zOiBhbnkpOiBhbnkge1xuICB2YXIge3JlcXVpcmVSZW1vdGVTZXJ2aWNlU3luY30gPSByZXF1aXJlKCdudWNsaWRlLXNlcnZpY2UtdHJhbnNmb3JtZXInKTtcbiAgdmFyIHJlbW90ZVNlcnZpY2VDbGFzcyA9IHJlcXVpcmVSZW1vdGVTZXJ2aWNlU3luYyhzZXJ2aWNlQ29uZmlnLmRlZmluaXRpb24pO1xuICB2YXIgcmVtb3RlQ29ubmVjdGlvbiA9IFJlbW90ZUNvbm5lY3Rpb24uZ2V0QnlIb3N0bmFtZUFuZFBhdGgoaG9zdG5hbWUsIG51bGwpO1xuICByZXR1cm4gbmV3IHJlbW90ZVNlcnZpY2VDbGFzcyhyZW1vdGVDb25uZWN0aW9uLCBzZXJ2aWNlT3B0aW9ucyk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUxvY2FsU2VydmljZShzZXJ2aWNlQ29uZmlnOiBTZXJ2aWNlQ29uZmlnLCBzZXJ2aWNlT3B0aW9uczogYW55KTogYW55IHtcbiAgdmFyIHNlcnZpY2VDbGFzcyA9IHJlcXVpcmUoc2VydmljZUNvbmZpZy5pbXBsZW1lbnRhdGlvbik7XG4gIHJldHVybiBuZXcgc2VydmljZUNsYXNzKHNlcnZpY2VPcHRpb25zKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdldFNlcnZpY2UsXG4gIGdldFNlcnZpY2VCeU51Y2xpZGVVcmksXG59O1xuIl19