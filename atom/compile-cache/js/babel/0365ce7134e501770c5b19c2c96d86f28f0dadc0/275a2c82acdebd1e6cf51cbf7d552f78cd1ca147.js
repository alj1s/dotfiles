'use babel';

var loadStyles = _asyncToGenerator(function* (stylesPath) {
  // TODO(jjiaa): If possible, check that `stylesPath` is also a directory.
  if (!(yield fsPromise.exists(stylesPath))) {
    return;
  }

  // TODO(jjiaa): Find a way to remove the stylesheets when they're unneeded.
  // Note: Disposing the values of the statement below removes the stylesheets.
  //
  // The stylesheets will be loaded asynchronously, so there might be a slight
  // visual glitch if the widget is drawn before the stylesheets are loaded.
  (yield fsPromise.readdir(stylesPath)).filter(function (filePath) {
    return filePath.endsWith('.less') || filePath.endsWith('.css');
  })
  // Styles should be loaded in alphabetical order according to
  // https://atom.io/docs/v0.186.0/creating-a-package
  .sort().map(function (filePath) {
    return atom.themes.requireStylesheet(path.join(stylesPath, filePath));
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

var path = require('path');

var _require = require('nuclide-commons');

var fsPromise = _require.fsPromise;

module.exports = {
  load: function load(libPath, mainFilename) {
    if (!atom.nuclide) {
      atom.nuclide = {};
    }

    if (!atom.nuclide[mainFilename]) {
      atom.nuclide[mainFilename] = require(path.join(libPath, mainFilename));

      var packagePath = path.dirname(libPath);
      loadStyles(path.join(packagePath, 'styles'));
    }
    return atom.nuclide[mainFilename];
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtdHJlZS9ub2RlX21vZHVsZXMvbnVjbGlkZS11aS10cmVlL25vZGVfbW9kdWxlcy9udWNsaWRlLWF0b20tbnBtL2xpYi9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7SUFjRyxVQUFVLHFCQUF6QixXQUEwQixVQUFrQixFQUFXOztBQUVyRCxNQUFJLEVBQUUsTUFBTSxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFBLEVBQUc7QUFDekMsV0FBTztHQUNSOzs7Ozs7O0FBT0QsR0FBQyxNQUFNLFNBQVMsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUEsQ0FDL0IsTUFBTSxDQUFDLFVBQUEsUUFBUTtXQUFLLFFBQVEsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUM7R0FBQyxDQUFDOzs7R0FHN0UsSUFBSSxFQUFFLENBQ04sR0FBRyxDQUFDLFVBQUEsUUFBUTtXQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7R0FBQSxDQUFDLENBQUM7Q0FDdEY7Ozs7Ozs7Ozs7Ozs7O0FBcEJELElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQzs7ZUFDVCxPQUFPLENBQUMsaUJBQWlCLENBQUM7O0lBQXZDLFNBQVMsWUFBVCxTQUFTOztBQXFCZCxNQUFNLENBQUMsT0FBTyxHQUFHO0FBQ2YsTUFBSSxFQUFBLGNBQUMsT0FBZSxFQUFFLFlBQW9CLEVBQU87QUFDL0MsUUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUU7QUFDakIsVUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7S0FDbkI7O0FBRUQsUUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLEVBQUU7QUFDL0IsVUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQzs7QUFFdkUsVUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUN4QyxnQkFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7S0FDOUM7QUFDRCxXQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7R0FDbkM7Q0FDRixDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtdHJlZS9ub2RlX21vZHVsZXMvbnVjbGlkZS11aS10cmVlL25vZGVfbW9kdWxlcy9udWNsaWRlLWF0b20tbnBtL2xpYi9tYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxudmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG52YXIge2ZzUHJvbWlzZX0gPSByZXF1aXJlKCdudWNsaWRlLWNvbW1vbnMnKTtcblxuYXN5bmMgZnVuY3Rpb24gbG9hZFN0eWxlcyhzdHlsZXNQYXRoOiBzdHJpbmcpOiBQcm9taXNlIHtcbiAgLy8gVE9ETyhqamlhYSk6IElmIHBvc3NpYmxlLCBjaGVjayB0aGF0IGBzdHlsZXNQYXRoYCBpcyBhbHNvIGEgZGlyZWN0b3J5LlxuICBpZiAoIShhd2FpdCBmc1Byb21pc2UuZXhpc3RzKHN0eWxlc1BhdGgpKSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIFRPRE8oamppYWEpOiBGaW5kIGEgd2F5IHRvIHJlbW92ZSB0aGUgc3R5bGVzaGVldHMgd2hlbiB0aGV5J3JlIHVubmVlZGVkLlxuICAvLyBOb3RlOiBEaXNwb3NpbmcgdGhlIHZhbHVlcyBvZiB0aGUgc3RhdGVtZW50IGJlbG93IHJlbW92ZXMgdGhlIHN0eWxlc2hlZXRzLlxuICAvL1xuICAvLyBUaGUgc3R5bGVzaGVldHMgd2lsbCBiZSBsb2FkZWQgYXN5bmNocm9ub3VzbHksIHNvIHRoZXJlIG1pZ2h0IGJlIGEgc2xpZ2h0XG4gIC8vIHZpc3VhbCBnbGl0Y2ggaWYgdGhlIHdpZGdldCBpcyBkcmF3biBiZWZvcmUgdGhlIHN0eWxlc2hlZXRzIGFyZSBsb2FkZWQuXG4gIChhd2FpdCBmc1Byb21pc2UucmVhZGRpcihzdHlsZXNQYXRoKSlcbiAgICAgIC5maWx0ZXIoZmlsZVBhdGggPT4gKGZpbGVQYXRoLmVuZHNXaXRoKCcubGVzcycpIHx8IGZpbGVQYXRoLmVuZHNXaXRoKCcuY3NzJykpKVxuICAgICAgLy8gU3R5bGVzIHNob3VsZCBiZSBsb2FkZWQgaW4gYWxwaGFiZXRpY2FsIG9yZGVyIGFjY29yZGluZyB0b1xuICAgICAgLy8gaHR0cHM6Ly9hdG9tLmlvL2RvY3MvdjAuMTg2LjAvY3JlYXRpbmctYS1wYWNrYWdlXG4gICAgICAuc29ydCgpXG4gICAgICAubWFwKGZpbGVQYXRoID0+IGF0b20udGhlbWVzLnJlcXVpcmVTdHlsZXNoZWV0KHBhdGguam9pbihzdHlsZXNQYXRoLCBmaWxlUGF0aCkpKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGxvYWQobGliUGF0aDogc3RyaW5nLCBtYWluRmlsZW5hbWU6IHN0cmluZyk6IGFueSB7XG4gICAgaWYgKCFhdG9tLm51Y2xpZGUpIHtcbiAgICAgIGF0b20ubnVjbGlkZSA9IHt9O1xuICAgIH1cblxuICAgIGlmICghYXRvbS5udWNsaWRlW21haW5GaWxlbmFtZV0pIHtcbiAgICAgIGF0b20ubnVjbGlkZVttYWluRmlsZW5hbWVdID0gcmVxdWlyZShwYXRoLmpvaW4obGliUGF0aCwgbWFpbkZpbGVuYW1lKSk7XG5cbiAgICAgIHZhciBwYWNrYWdlUGF0aCA9IHBhdGguZGlybmFtZShsaWJQYXRoKTtcbiAgICAgIGxvYWRTdHlsZXMocGF0aC5qb2luKHBhY2thZ2VQYXRoLCAnc3R5bGVzJykpO1xuICAgIH1cbiAgICByZXR1cm4gYXRvbS5udWNsaWRlW21haW5GaWxlbmFtZV07XG4gIH0sXG59O1xuIl19