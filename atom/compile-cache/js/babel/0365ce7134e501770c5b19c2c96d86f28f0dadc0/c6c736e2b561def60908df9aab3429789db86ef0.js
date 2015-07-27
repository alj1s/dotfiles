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

/**
 * This designed for logging on both Nuclide client and Nuclide server. It is based on [log4js]
 * (https://www.npmjs.com/package/log4js) with the ability to lazy initialize and update config
 * after initialized.
 * To make sure we only have one instance of log4js logger initialized globally, we save the logger
 * to `global` object.
 */

var LOGGER_CATEGORY = 'nuclide';
var LOGGER_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
var LOG4JS_INSTANCE_KEY = '_nuclide_log4js_logger';

var lazyLogger;

/**
 * Create the log4js logger. Note we could call this function more than once to update the config.
 * params `config` and `options` are configurations used by log4js, refer
 * https://www.npmjs.com/package/log4js#configuration for more information.
 */
function configLog4jsLogger(config, options) {
  var log4js = require('log4js');
  log4js.configure(config, options);
  global[LOG4JS_INSTANCE_KEY] = log4js.getLogger(LOGGER_CATEGORY);
}

// Create a lazy logger, who won't initialize log4js logger until `lazyLogger.$level(...)` is called.
// In this way other package could depends on this upon activate without worrying initialization of
// logger taking too much time.
function createLazyLogger() {
  lazyLogger = {};

  LOGGER_LEVELS.forEach(function (level) {
    lazyLogger[level] = _asyncToGenerator(function* () {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (global[LOG4JS_INSTANCE_KEY] === undefined) {
        var defaultConfig = yield require('./config').getDefaultConfig();
        configLog4jsLogger(defaultConfig, {});
      }
      global[LOG4JS_INSTANCE_KEY][level].apply(global[LOG4JS_INSTANCE_KEY], args);
    });
  });

  return lazyLogger;
}

function getLogger() {
  return lazyLogger ? lazyLogger : createLazyLogger();
}

module.exports = {
  getLogger: getLogger,
  updateConfig: configLog4jsLogger
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9ub2RlX21vZHVsZXMvbnVjbGlkZS1sb2dnaW5nL2xpYi9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW1CWixJQUFNLGVBQWUsR0FBRyxTQUFTLENBQUM7QUFDbEMsSUFBTSxhQUFhLEdBQUcsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQzNFLElBQU0sbUJBQW1CLEdBQUcsd0JBQXdCLENBQUM7O0FBRXJELElBQUksVUFBVSxDQUFDOzs7Ozs7O0FBT2YsU0FBUyxrQkFBa0IsQ0FBQyxNQUFXLEVBQUUsT0FBWSxFQUFRO0FBQzNELE1BQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUMvQixRQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztBQUNsQyxRQUFNLENBQUMsbUJBQW1CLENBQUMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FBQyxDQUFDO0NBQ2pFOzs7OztBQUtELFNBQVMsZ0JBQWdCLEdBQVE7QUFDL0IsWUFBVSxHQUFHLEVBQUUsQ0FBQzs7QUFFaEIsZUFBYSxDQUFDLE9BQU8sQ0FBQyxVQUFDLEtBQUssRUFBSztBQUMvQixjQUFVLENBQUMsS0FBSyxDQUFDLHFCQUFHLGFBQStCO3dDQUFyQixJQUFJO0FBQUosWUFBSTs7O0FBQ2hDLFVBQUksTUFBTSxDQUFDLG1CQUFtQixDQUFDLEtBQUssU0FBUyxFQUFFO0FBQzdDLFlBQUksYUFBYSxHQUFHLE1BQU0sT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLGdCQUFnQixFQUFFLENBQUM7QUFDakUsMEJBQWtCLENBQUMsYUFBYSxFQUFFLEVBQUUsQ0FBQyxDQUFDO09BQ3ZDO0FBQ0QsWUFBTSxDQUFDLG1CQUFtQixDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQzdFLENBQUEsQ0FBQztHQUNILENBQUMsQ0FBQzs7QUFFSCxTQUFPLFVBQVUsQ0FBQztDQUNuQjs7QUFFRCxTQUFTLFNBQVMsR0FBRztBQUNuQixTQUFPLFVBQVUsR0FBRyxVQUFVLEdBQUcsZ0JBQWdCLEVBQUUsQ0FBQztDQUNyRDs7QUFFRCxNQUFNLENBQUMsT0FBTyxHQUFHO0FBQ2YsV0FBUyxFQUFULFNBQVM7QUFDVCxjQUFZLEVBQUUsa0JBQWtCO0NBQ2pDLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL251Y2xpZGUtcmVtb3RlLXByb2plY3RzL25vZGVfbW9kdWxlcy9udWNsaWRlLWxvZ2dpbmcvbGliL21haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG4vKipcbiAqIFRoaXMgZGVzaWduZWQgZm9yIGxvZ2dpbmcgb24gYm90aCBOdWNsaWRlIGNsaWVudCBhbmQgTnVjbGlkZSBzZXJ2ZXIuIEl0IGlzIGJhc2VkIG9uIFtsb2c0anNdXG4gKiAoaHR0cHM6Ly93d3cubnBtanMuY29tL3BhY2thZ2UvbG9nNGpzKSB3aXRoIHRoZSBhYmlsaXR5IHRvIGxhenkgaW5pdGlhbGl6ZSBhbmQgdXBkYXRlIGNvbmZpZ1xuICogYWZ0ZXIgaW5pdGlhbGl6ZWQuXG4gKiBUbyBtYWtlIHN1cmUgd2Ugb25seSBoYXZlIG9uZSBpbnN0YW5jZSBvZiBsb2c0anMgbG9nZ2VyIGluaXRpYWxpemVkIGdsb2JhbGx5LCB3ZSBzYXZlIHRoZSBsb2dnZXJcbiAqIHRvIGBnbG9iYWxgIG9iamVjdC5cbiAqL1xuXG5jb25zdCBMT0dHRVJfQ0FURUdPUlkgPSAnbnVjbGlkZSc7XG5jb25zdCBMT0dHRVJfTEVWRUxTID0gWyd0cmFjZScsICdkZWJ1ZycsICdpbmZvJywgJ3dhcm4nLCAnZXJyb3InLCAnZmF0YWwnXTtcbmNvbnN0IExPRzRKU19JTlNUQU5DRV9LRVkgPSAnX251Y2xpZGVfbG9nNGpzX2xvZ2dlcic7XG5cbnZhciBsYXp5TG9nZ2VyO1xuXG4vKipcbiAqIENyZWF0ZSB0aGUgbG9nNGpzIGxvZ2dlci4gTm90ZSB3ZSBjb3VsZCBjYWxsIHRoaXMgZnVuY3Rpb24gbW9yZSB0aGFuIG9uY2UgdG8gdXBkYXRlIHRoZSBjb25maWcuXG4gKiBwYXJhbXMgYGNvbmZpZ2AgYW5kIGBvcHRpb25zYCBhcmUgY29uZmlndXJhdGlvbnMgdXNlZCBieSBsb2c0anMsIHJlZmVyXG4gKiBodHRwczovL3d3dy5ucG1qcy5jb20vcGFja2FnZS9sb2c0anMjY29uZmlndXJhdGlvbiBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAqL1xuZnVuY3Rpb24gY29uZmlnTG9nNGpzTG9nZ2VyKGNvbmZpZzogYW55LCBvcHRpb25zOiBhbnkpOiB2b2lkIHtcbiAgdmFyIGxvZzRqcyA9IHJlcXVpcmUoJ2xvZzRqcycpO1xuICBsb2c0anMuY29uZmlndXJlKGNvbmZpZywgb3B0aW9ucyk7XG4gIGdsb2JhbFtMT0c0SlNfSU5TVEFOQ0VfS0VZXSA9IGxvZzRqcy5nZXRMb2dnZXIoTE9HR0VSX0NBVEVHT1JZKTtcbn1cblxuLy8gQ3JlYXRlIGEgbGF6eSBsb2dnZXIsIHdobyB3b24ndCBpbml0aWFsaXplIGxvZzRqcyBsb2dnZXIgdW50aWwgYGxhenlMb2dnZXIuJGxldmVsKC4uLilgIGlzIGNhbGxlZC5cbi8vIEluIHRoaXMgd2F5IG90aGVyIHBhY2thZ2UgY291bGQgZGVwZW5kcyBvbiB0aGlzIHVwb24gYWN0aXZhdGUgd2l0aG91dCB3b3JyeWluZyBpbml0aWFsaXphdGlvbiBvZlxuLy8gbG9nZ2VyIHRha2luZyB0b28gbXVjaCB0aW1lLlxuZnVuY3Rpb24gY3JlYXRlTGF6eUxvZ2dlcigpOiBhbnkge1xuICBsYXp5TG9nZ2VyID0ge307XG5cbiAgTE9HR0VSX0xFVkVMUy5mb3JFYWNoKChsZXZlbCkgPT4ge1xuICAgIGxhenlMb2dnZXJbbGV2ZWxdID0gYXN5bmMgKC4uLmFyZ3M6IEFycmF5PGFueT4pID0+IHtcbiAgICAgIGlmIChnbG9iYWxbTE9HNEpTX0lOU1RBTkNFX0tFWV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB2YXIgZGVmYXVsdENvbmZpZyA9IGF3YWl0IHJlcXVpcmUoJy4vY29uZmlnJykuZ2V0RGVmYXVsdENvbmZpZygpO1xuICAgICAgICBjb25maWdMb2c0anNMb2dnZXIoZGVmYXVsdENvbmZpZywge30pO1xuICAgICAgfVxuICAgICAgZ2xvYmFsW0xPRzRKU19JTlNUQU5DRV9LRVldW2xldmVsXS5hcHBseShnbG9iYWxbTE9HNEpTX0lOU1RBTkNFX0tFWV0sIGFyZ3MpO1xuICAgIH07XG4gIH0pO1xuXG4gIHJldHVybiBsYXp5TG9nZ2VyO1xufVxuXG5mdW5jdGlvbiBnZXRMb2dnZXIoKSB7XG4gIHJldHVybiBsYXp5TG9nZ2VyID8gbGF6eUxvZ2dlciA6IGNyZWF0ZUxhenlMb2dnZXIoKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdldExvZ2dlcixcbiAgdXBkYXRlQ29uZmlnOiBjb25maWdMb2c0anNMb2dnZXIsXG59O1xuIl19