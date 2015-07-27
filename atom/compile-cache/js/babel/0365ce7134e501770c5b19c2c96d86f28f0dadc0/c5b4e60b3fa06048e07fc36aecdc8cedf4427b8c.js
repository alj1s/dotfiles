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

// This should be long enough that it does not interfere with Atom load time,
// but short enough so that users who have just installed the nuclide-installer
// for the first time do not get impatient waiting to see Nuclide packages start
// to appear under Installed Packages in Settings.
var TIME_TO_WAIT_BEFORE_CHECKING_FOR_UPDATES_IN_MS = 5 * 1000;

module.exports = {
  activate: function activate(state) {
    // Add a delay before checking for package updates so that this
    // is not on the critical path for Atom startup.
    setTimeout(_asyncToGenerator(function* () {
      var pathToConfig;
      try {
        pathToConfig = require.resolve('./config.json');
      } catch (e) {
        // The config.json file will not be present in development.
        return;
      }

      var config = require(pathToConfig);

      var _require = require('nuclide-installer-base');

      var installPackagesInConfig = _require.installPackagesInConfig;

      installPackagesInConfig(config);
    }), TIME_TO_WAIT_BEFORE_CHECKING_FOR_UPDATES_IN_MS);
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWluc3RhbGxlci9saWIvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWVaLElBQUksOENBQThDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQzs7QUFFOUQsTUFBTSxDQUFDLE9BQU8sR0FBRztBQUNmLFVBQVEsRUFBQSxrQkFBQyxLQUFjLEVBQVE7OztBQUc3QixjQUFVLG1CQUFDLGFBQVk7QUFDckIsVUFBSSxZQUFZLENBQUM7QUFDakIsVUFBSTtBQUNGLG9CQUFZLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztPQUNqRCxDQUFDLE9BQU8sQ0FBQyxFQUFFOztBQUVWLGVBQU87T0FDUjs7QUFFRCxVQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7O3FCQUNILE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQzs7VUFBNUQsdUJBQXVCLFlBQXZCLHVCQUF1Qjs7QUFDNUIsNkJBQXVCLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDakMsR0FBRSw4Q0FBOEMsQ0FBQyxDQUFDO0dBQ3BEO0NBQ0YsQ0FBQyIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvbnVjbGlkZS1pbnN0YWxsZXIvbGliL21haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG4vLyBUaGlzIHNob3VsZCBiZSBsb25nIGVub3VnaCB0aGF0IGl0IGRvZXMgbm90IGludGVyZmVyZSB3aXRoIEF0b20gbG9hZCB0aW1lLFxuLy8gYnV0IHNob3J0IGVub3VnaCBzbyB0aGF0IHVzZXJzIHdobyBoYXZlIGp1c3QgaW5zdGFsbGVkIHRoZSBudWNsaWRlLWluc3RhbGxlclxuLy8gZm9yIHRoZSBmaXJzdCB0aW1lIGRvIG5vdCBnZXQgaW1wYXRpZW50IHdhaXRpbmcgdG8gc2VlIE51Y2xpZGUgcGFja2FnZXMgc3RhcnRcbi8vIHRvIGFwcGVhciB1bmRlciBJbnN0YWxsZWQgUGFja2FnZXMgaW4gU2V0dGluZ3MuXG52YXIgVElNRV9UT19XQUlUX0JFRk9SRV9DSEVDS0lOR19GT1JfVVBEQVRFU19JTl9NUyA9IDUgKiAxMDAwO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYWN0aXZhdGUoc3RhdGU6ID9PYmplY3QpOiB2b2lkIHtcbiAgICAvLyBBZGQgYSBkZWxheSBiZWZvcmUgY2hlY2tpbmcgZm9yIHBhY2thZ2UgdXBkYXRlcyBzbyB0aGF0IHRoaXNcbiAgICAvLyBpcyBub3Qgb24gdGhlIGNyaXRpY2FsIHBhdGggZm9yIEF0b20gc3RhcnR1cC5cbiAgICBzZXRUaW1lb3V0KGFzeW5jICgpID0+IHtcbiAgICAgIHZhciBwYXRoVG9Db25maWc7XG4gICAgICB0cnkge1xuICAgICAgICBwYXRoVG9Db25maWcgPSByZXF1aXJlLnJlc29sdmUoJy4vY29uZmlnLmpzb24nKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gVGhlIGNvbmZpZy5qc29uIGZpbGUgd2lsbCBub3QgYmUgcHJlc2VudCBpbiBkZXZlbG9wbWVudC5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB2YXIgY29uZmlnID0gcmVxdWlyZShwYXRoVG9Db25maWcpO1xuICAgICAgdmFyIHtpbnN0YWxsUGFja2FnZXNJbkNvbmZpZ30gPSByZXF1aXJlKCdudWNsaWRlLWluc3RhbGxlci1iYXNlJyk7XG4gICAgICBpbnN0YWxsUGFja2FnZXNJbkNvbmZpZyhjb25maWcpO1xuICAgIH0sIFRJTUVfVE9fV0FJVF9CRUZPUkVfQ0hFQ0tJTkdfRk9SX1VQREFURVNfSU5fTVMpO1xuICB9LFxufTtcbiJdfQ==