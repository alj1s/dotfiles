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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtdHJlZS9ub2RlX21vZHVsZXMvbnVjbGlkZS11aS10cmVlL25vZGVfbW9kdWxlcy9udWNsaWRlLWF0b20tbnBtL2xpYi9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7SUFjRyxVQUFVLHFCQUF6QixXQUEwQixVQUFrQixFQUFXOztBQUVyRCxNQUFJLEVBQUUsTUFBTSxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFBLEFBQUMsRUFBRTtBQUN6QyxXQUFPO0dBQ1I7Ozs7Ozs7QUFPRCxHQUFDLE1BQU0sU0FBUyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQSxDQUMvQixNQUFNLENBQUMsVUFBQSxRQUFRO1dBQUssUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQztHQUFDLENBQUM7OztHQUc3RSxJQUFJLEVBQUUsQ0FDTixHQUFHLENBQUMsVUFBQSxRQUFRO1dBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztHQUFBLENBQUMsQ0FBQztDQUN0Rjs7Ozs7Ozs7Ozs7Ozs7QUFwQkQsSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDOztlQUNULE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQzs7SUFBdkMsU0FBUyxZQUFULFNBQVM7O0FBcUJkLE1BQU0sQ0FBQyxPQUFPLEdBQUc7QUFDZixNQUFJLEVBQUEsY0FBQyxPQUFlLEVBQUUsWUFBb0IsRUFBTztBQUMvQyxRQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtBQUNqQixVQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztLQUNuQjs7QUFFRCxRQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsRUFBRTtBQUMvQixVQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDOztBQUV2RSxVQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3hDLGdCQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztLQUM5QztBQUNELFdBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztHQUNuQztDQUNGLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL251Y2xpZGUtZmlsZS10cmVlL25vZGVfbW9kdWxlcy9udWNsaWRlLXVpLXRyZWUvbm9kZV9tb2R1bGVzL251Y2xpZGUtYXRvbS1ucG0vbGliL21haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbnZhciB7ZnNQcm9taXNlfSA9IHJlcXVpcmUoJ251Y2xpZGUtY29tbW9ucycpO1xuXG5hc3luYyBmdW5jdGlvbiBsb2FkU3R5bGVzKHN0eWxlc1BhdGg6IHN0cmluZyk6IFByb21pc2Uge1xuICAvLyBUT0RPKGpqaWFhKTogSWYgcG9zc2libGUsIGNoZWNrIHRoYXQgYHN0eWxlc1BhdGhgIGlzIGFsc28gYSBkaXJlY3RvcnkuXG4gIGlmICghKGF3YWl0IGZzUHJvbWlzZS5leGlzdHMoc3R5bGVzUGF0aCkpKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gVE9ETyhqamlhYSk6IEZpbmQgYSB3YXkgdG8gcmVtb3ZlIHRoZSBzdHlsZXNoZWV0cyB3aGVuIHRoZXkncmUgdW5uZWVkZWQuXG4gIC8vIE5vdGU6IERpc3Bvc2luZyB0aGUgdmFsdWVzIG9mIHRoZSBzdGF0ZW1lbnQgYmVsb3cgcmVtb3ZlcyB0aGUgc3R5bGVzaGVldHMuXG4gIC8vXG4gIC8vIFRoZSBzdHlsZXNoZWV0cyB3aWxsIGJlIGxvYWRlZCBhc3luY2hyb25vdXNseSwgc28gdGhlcmUgbWlnaHQgYmUgYSBzbGlnaHRcbiAgLy8gdmlzdWFsIGdsaXRjaCBpZiB0aGUgd2lkZ2V0IGlzIGRyYXduIGJlZm9yZSB0aGUgc3R5bGVzaGVldHMgYXJlIGxvYWRlZC5cbiAgKGF3YWl0IGZzUHJvbWlzZS5yZWFkZGlyKHN0eWxlc1BhdGgpKVxuICAgICAgLmZpbHRlcihmaWxlUGF0aCA9PiAoZmlsZVBhdGguZW5kc1dpdGgoJy5sZXNzJykgfHwgZmlsZVBhdGguZW5kc1dpdGgoJy5jc3MnKSkpXG4gICAgICAvLyBTdHlsZXMgc2hvdWxkIGJlIGxvYWRlZCBpbiBhbHBoYWJldGljYWwgb3JkZXIgYWNjb3JkaW5nIHRvXG4gICAgICAvLyBodHRwczovL2F0b20uaW8vZG9jcy92MC4xODYuMC9jcmVhdGluZy1hLXBhY2thZ2VcbiAgICAgIC5zb3J0KClcbiAgICAgIC5tYXAoZmlsZVBhdGggPT4gYXRvbS50aGVtZXMucmVxdWlyZVN0eWxlc2hlZXQocGF0aC5qb2luKHN0eWxlc1BhdGgsIGZpbGVQYXRoKSkpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbG9hZChsaWJQYXRoOiBzdHJpbmcsIG1haW5GaWxlbmFtZTogc3RyaW5nKTogYW55IHtcbiAgICBpZiAoIWF0b20ubnVjbGlkZSkge1xuICAgICAgYXRvbS5udWNsaWRlID0ge307XG4gICAgfVxuXG4gICAgaWYgKCFhdG9tLm51Y2xpZGVbbWFpbkZpbGVuYW1lXSkge1xuICAgICAgYXRvbS5udWNsaWRlW21haW5GaWxlbmFtZV0gPSByZXF1aXJlKHBhdGguam9pbihsaWJQYXRoLCBtYWluRmlsZW5hbWUpKTtcblxuICAgICAgdmFyIHBhY2thZ2VQYXRoID0gcGF0aC5kaXJuYW1lKGxpYlBhdGgpO1xuICAgICAgbG9hZFN0eWxlcyhwYXRoLmpvaW4ocGFja2FnZVBhdGgsICdzdHlsZXMnKSk7XG4gICAgfVxuICAgIHJldHVybiBhdG9tLm51Y2xpZGVbbWFpbkZpbGVuYW1lXTtcbiAgfSxcbn07XG4iXX0=