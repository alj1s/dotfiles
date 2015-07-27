'use babel';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var createHackLanguageIfNotExisting = _asyncToGenerator(function* (client, filePath) {
  var clientId = client.getID();
  if (clientToHackLanguage[clientId]) {
    return clientToHackLanguage[clientId];
  }
  var hackClient;

  var _ref = yield Promise.all([client.isHackClientAvailable(), client.findNearestFile('.hhconfig', pathUtil.dirname(filePath))]);

  var _ref2 = _slicedToArray(_ref, 2);

  var isHackClientAvailable = _ref2[0];
  var nearestPath = _ref2[1];

  // If multiple calls, were done asynchronously, make sure to return the single-created HackLanguage.
  if (clientToHackLanguage[clientId]) {
    return clientToHackLanguage[clientId];
  }
  if (isHackClientAvailable && nearestPath) {
    hackClient = client;
  } else {
    hackClient = new NullHackClient();
  }
  clientToHackLanguage[clientId] = new HackLanguage(hackClient);
  return clientToHackLanguage[clientId];
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

var _require = require('nuclide-client');

var getClient = _require.getClient;

var _require2 = require('nuclide-atom-helpers');

var extractWordAtPosition = _require2.extractWordAtPosition;

var HackLanguage = require('./HackLanguage');
var NullHackClient = require('./NullHackClient');
var logger = require('nuclide-logging').getLogger();
var url = require('url');
var pathUtil = require('path');

var NULL_CONNECTION_ID = 'null';
var HACK_WORD_REGEX = /[a-zA-Z0-9_$]+/g;

/**
 * This is responsible for managing (creating/disposing) multiple HackLanguage instances,
 * creating the designated HackService instances with the NuclideClient it needs per remote project.
 * Also, it deelegates the language feature request to the correct HackLanguage instance.
 */
var clientToHackLanguage = {};
/**
 * Map of project id to an array of Hack Service diagnostics
 */
var clientToHackLinterCache = {};

module.exports = {

  findDiagnostics: _asyncToGenerator(function* (editor) {
    var buffer = editor.getBuffer();
    var hackLanguage = yield getHackLanguageForBuffer(buffer);
    if (!hackLanguage) {
      return [];
    }

    var editorPath = editor.getPath();

    var _url$parse = url.parse(editorPath);

    var path = _url$parse.path;

    var contents = editor.getText();
    var errors = yield hackLanguage.getDiagnostics(path, contents);
    var mixedErrors = errors;
    var clientId = getClientId(buffer);
    if (clientToHackLinterCache[clientId]) {
      mixedErrors = errors.concat(clientToHackLinterCache[clientId]);
    }

    mixedErrors.forEach(function (error) {
      // Preserve original Nuclide URI so remote files return with a "nuclide://" prefix and are
      // associated with the correct TextEditor and tab.
      error.filePath = editorPath;
    });

    return mixedErrors;
  }),

  fetchCompletionsForEditor: _asyncToGenerator(function* (editor, prefix) {
    var hackLanguage = yield getHackLanguageForBuffer(editor.getBuffer());
    if (!hackLanguage) {
      return [];
    }

    var _url$parse2 = url.parse(editor.getPath());

    var path = _url$parse2.path;

    var contents = editor.getText();
    var cursor = editor.getLastCursor();
    var offset = editor.getBuffer().characterIndexForPosition(cursor.getBufferPosition());
    // The returned completions may have unrelated results, even though the offset is set on the end of the prefix.
    var completions = yield hackLanguage.getCompletions(path, contents, offset);
    // Filter out the completions that do not contain the prefix as a token in the match text case insentively.
    var tokenLowerCase = prefix.toLowerCase();

    var _require3 = require('./utils');

    var compareHackCompletions = _require3.compareHackCompletions;

    var hackCompletionsCompartor = compareHackCompletions(prefix);

    return completions.filter(function (completion) {
      return completion.matchText.toLowerCase().indexOf(tokenLowerCase) >= 0;
    })
    // Sort the auto-completions based on a scoring function considering:
    // case sensitivity, position in the completion, private functions and alphabetical order.
    .sort(function (completion1, completion2) {
      return hackCompletionsCompartor(completion1.matchText, completion2.matchText);
    });
  }),

  formatSourceFromEditor: _asyncToGenerator(function* (editor, range) {
    var buffer = editor.getBuffer();
    var hackLanguage = yield getHackLanguageForBuffer(buffer);
    var startPosition = buffer.characterIndexForPosition(range.start);
    var endPosition = buffer.characterIndexForPosition(range.end);
    return yield hackLanguage.formatSource(buffer.getText(), startPosition + 1, endPosition + 1);
  }),

  typeHintFromEditor: _asyncToGenerator(function* (editor, position) {
    var hackLanguage = yield getHackLanguageForBuffer(editor.getBuffer());
    if (!hackLanguage) {
      return null;
    }
    var matchData = extractWordAtPosition(editor, position, HACK_WORD_REGEX);
    if (!matchData) {
      return null;
    }

    var _url$parse3 = url.parse(editor.getPath());

    var path = _url$parse3.path;

    var contents = editor.getText();

    var type = yield hackLanguage.getType(path, contents, matchData.wordMatch[0], position.row + 1, position.column + 1);
    if (!type) {
      return null;
    } else {
      return {
        hint: type,
        range: matchData.range
      };
    }
  }),

  /**
   * If a location can be found for the declaration, the return value will
   * resolve to an object with these fields: file, line, column.
   */
  findDefinition: _asyncToGenerator(function* (editor, line, column) {
    var hackLanguage = yield getHackLanguageForBuffer(editor.getBuffer());
    if (!hackLanguage) {
      return null;
    }

    var _url$parse4 = url.parse(editor.getPath());

    var path = _url$parse4.path;
    var protocol = _url$parse4.protocol;
    var host = _url$parse4.host;

    var contents = editor.getText();
    var buffer = editor.getBuffer();
    var lineText = buffer.lineForRow(line);
    var result = yield hackLanguage.getDefinition(path, contents, line + 1, column + 1, lineText);
    if (!result || !result.length) {
      return null;
    }
    var pos = result[0];
    var range = null;
    // If the search string was expanded to include more than a valid regex php word.
    // e.g. in case of XHP tags, the start and end column are provided to underline the full range
    // to visit its definition.
    if (pos.searchStartColumn && pos.searchEndColumn) {
      var _require4 = require('atom');

      var Range = _require4.Range;

      range = new Range([line, pos.searchStartColumn], [line, pos.searchEndColumn]);
    }
    return {
      file: getFilePath(pos.path, protocol, host),
      line: pos.line,
      column: pos.column,
      range: range
    };
  }),

  onDidSave: _asyncToGenerator(function* (editor) {
    var _url$parse5 = url.parse(editor.getPath());

    var path = _url$parse5.path;

    var contents = editor.getText();
    var buffer = editor.getBuffer();
    var hackLanguage = yield getHackLanguageForBuffer(buffer);
    if (!hackLanguage) {
      return;
    }

    // Update the HackWorker model with the contents of the file opened or saved.
    yield hackLanguage.updateFile(path, contents);

    var diagnostics = [];
    try {
      diagnostics = yield hackLanguage.getServerDiagnostics();
    } catch (err) {
      logger.error('Hack: getServerDiagnostics failed', err);
    }
    clientToHackLinterCache[getClientId(buffer)] = diagnostics;
    // Trigger the linter to catch the new diagnostics.
    atom.commands.dispatch(atom.views.getView(editor), 'linter:lint');
  })
};

function getFilePath(filePath, protocol, host) {
  if (!protocol || !host) {
    return filePath;
  }
  return protocol + '//' + host + filePath;
}

function getClientId(buffer) {
  var client = getClient(buffer.getUri());
  return client ? client.getID() : 'undefined';
}

function getHackLanguageForBuffer(buffer) {
  var uri = buffer.getUri();

  var _url$parse6 = url.parse(uri);

  var filePath = _url$parse6.path;

  // `getClient` can return null if a file path doesn't have a root directory in the tree.
  // Also, returns null when reloading Atom with open files, while the RemoteConnection creation is pending.
  var client = getClient(uri);
  if (!client) {
    return null;
  }
  return createHackLanguageIfNotExisting(client, filePath);
  // TODO(most): dispose the language/worker on project close.
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWhhY2svbGliL2hhY2suanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7O0lBeU1HLCtCQUErQixxQkFBOUMsV0FBK0MsTUFBcUIsRUFBRSxRQUFnQixFQUF5QjtBQUM3RyxNQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDOUIsTUFBSSxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsRUFBRTtBQUNsQyxXQUFPLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0dBQ3ZDO0FBQ0QsTUFBSSxVQUFVLENBQUM7O2FBQzRCLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUMzRCxNQUFNLENBQUMscUJBQXFCLEVBQUUsRUFDOUIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUNoRSxDQUFDOzs7O01BSEcscUJBQXFCO01BQUUsV0FBVzs7O0FBS3ZDLE1BQUksb0JBQW9CLENBQUMsUUFBUSxDQUFDLEVBQUU7QUFDbEMsV0FBTyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztHQUN2QztBQUNELE1BQUkscUJBQXFCLElBQUksV0FBVyxFQUFFO0FBQ3hDLGNBQVUsR0FBRyxNQUFNLENBQUM7R0FDckIsTUFBTTtBQUNMLGNBQVUsR0FBRyxJQUFJLGNBQWMsRUFBRSxDQUFDO0dBQ25DO0FBQ0Qsc0JBQW9CLENBQUMsUUFBUSxDQUFDLEdBQUcsSUFBSSxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDOUQsU0FBTyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztDQUN2Qzs7Ozs7Ozs7Ozs7Ozs7ZUFuTmlCLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQzs7SUFBdEMsU0FBUyxZQUFULFNBQVM7O2dCQUNnQixPQUFPLENBQUMsc0JBQXNCLENBQUM7O0lBQXhELHFCQUFxQixh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QUUsQ0FBQzs7b0JBQ0gsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7O01BQTFCLFFBQVEsZUFBZCxJQUFJOzs7O0FBR1QsTUFBSSxNQUFNLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzVCLE1BQUksQ0FBQyxNQUFNLEVBQUU7QUFDWCxXQUFPLElBQUksQ0FBQztHQUNiO0FBQ0QsU0FBTywrQkFBK0IsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7O0NBRTFEIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWhhY2svbGliL2hhY2suanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIge2dldENsaWVudH0gPSByZXF1aXJlKCdudWNsaWRlLWNsaWVudCcpO1xudmFyIHtleHRyYWN0V29yZEF0UG9zaXRpb259ID0gcmVxdWlyZSgnbnVjbGlkZS1hdG9tLWhlbHBlcnMnKTtcbnZhciBIYWNrTGFuZ3VhZ2UgPSByZXF1aXJlKCcuL0hhY2tMYW5ndWFnZScpO1xudmFyIE51bGxIYWNrQ2xpZW50ID0gcmVxdWlyZSgnLi9OdWxsSGFja0NsaWVudCcpO1xudmFyIGxvZ2dlciA9IHJlcXVpcmUoJ251Y2xpZGUtbG9nZ2luZycpLmdldExvZ2dlcigpO1xudmFyIHVybCA9IHJlcXVpcmUoJ3VybCcpO1xudmFyIHBhdGhVdGlsID0gcmVxdWlyZSgncGF0aCcpO1xuXG5jb25zdCBOVUxMX0NPTk5FQ1RJT05fSUQgPSAnbnVsbCc7XG5jb25zdCBIQUNLX1dPUkRfUkVHRVggPSAvW2EtekEtWjAtOV8kXSsvZztcblxuLyoqXG4gKiBUaGlzIGlzIHJlc3BvbnNpYmxlIGZvciBtYW5hZ2luZyAoY3JlYXRpbmcvZGlzcG9zaW5nKSBtdWx0aXBsZSBIYWNrTGFuZ3VhZ2UgaW5zdGFuY2VzLFxuICogY3JlYXRpbmcgdGhlIGRlc2lnbmF0ZWQgSGFja1NlcnZpY2UgaW5zdGFuY2VzIHdpdGggdGhlIE51Y2xpZGVDbGllbnQgaXQgbmVlZHMgcGVyIHJlbW90ZSBwcm9qZWN0LlxuICogQWxzbywgaXQgZGVlbGVnYXRlcyB0aGUgbGFuZ3VhZ2UgZmVhdHVyZSByZXF1ZXN0IHRvIHRoZSBjb3JyZWN0IEhhY2tMYW5ndWFnZSBpbnN0YW5jZS5cbiAqL1xudmFyIGNsaWVudFRvSGFja0xhbmd1YWdlOiB7W2NsaWVudElkOiBzdHJpbmddOiBIYWNrTGFuZ3VhZ2V9ID0ge307XG4vKipcbiAqIE1hcCBvZiBwcm9qZWN0IGlkIHRvIGFuIGFycmF5IG9mIEhhY2sgU2VydmljZSBkaWFnbm9zdGljc1xuICovXG52YXIgY2xpZW50VG9IYWNrTGludGVyQ2FjaGU6IHtbY2xpZW50SWQ6IHN0cmluZ106IEFycmF5PGFueT59ID0ge307XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXG4gIGFzeW5jIGZpbmREaWFnbm9zdGljcyhlZGl0b3I6IFRleHRFZGl0b3IpOiBQcm9taXNlPEFycmF5PGFueT4+IHtcbiAgICB2YXIgYnVmZmVyID0gZWRpdG9yLmdldEJ1ZmZlcigpO1xuICAgIHZhciBoYWNrTGFuZ3VhZ2UgPSBhd2FpdCBnZXRIYWNrTGFuZ3VhZ2VGb3JCdWZmZXIoYnVmZmVyKTtcbiAgICBpZiAoIWhhY2tMYW5ndWFnZSkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIHZhciBlZGl0b3JQYXRoID0gZWRpdG9yLmdldFBhdGgoKTtcbiAgICB2YXIge3BhdGh9ID0gdXJsLnBhcnNlKGVkaXRvclBhdGgpO1xuICAgIHZhciBjb250ZW50cyA9IGVkaXRvci5nZXRUZXh0KCk7XG4gICAgdmFyIGVycm9ycyA9IGF3YWl0IGhhY2tMYW5ndWFnZS5nZXREaWFnbm9zdGljcyhwYXRoLCBjb250ZW50cyk7XG4gICAgdmFyIG1peGVkRXJyb3JzID0gZXJyb3JzO1xuICAgIHZhciBjbGllbnRJZCA9IGdldENsaWVudElkKGJ1ZmZlcik7XG4gICAgaWYgKGNsaWVudFRvSGFja0xpbnRlckNhY2hlW2NsaWVudElkXSkge1xuICAgICAgbWl4ZWRFcnJvcnMgPSBlcnJvcnMuY29uY2F0KGNsaWVudFRvSGFja0xpbnRlckNhY2hlW2NsaWVudElkXSk7XG4gICAgfVxuXG4gICAgbWl4ZWRFcnJvcnMuZm9yRWFjaChlcnJvciA9PiB7XG4gICAgICAvLyBQcmVzZXJ2ZSBvcmlnaW5hbCBOdWNsaWRlIFVSSSBzbyByZW1vdGUgZmlsZXMgcmV0dXJuIHdpdGggYSBcIm51Y2xpZGU6Ly9cIiBwcmVmaXggYW5kIGFyZVxuICAgICAgLy8gYXNzb2NpYXRlZCB3aXRoIHRoZSBjb3JyZWN0IFRleHRFZGl0b3IgYW5kIHRhYi5cbiAgICAgIGVycm9yLmZpbGVQYXRoID0gZWRpdG9yUGF0aDtcbiAgICB9KTtcblxuICAgIHJldHVybiBtaXhlZEVycm9ycztcbiAgfSxcblxuICBhc3luYyBmZXRjaENvbXBsZXRpb25zRm9yRWRpdG9yKGVkaXRvcjogVGV4dEVkaXRvciwgcHJlZml4OiBzdHJpbmcpOiBQcm9taXNlPEFycmF5PGFueT4+IHtcbiAgICB2YXIgaGFja0xhbmd1YWdlID0gYXdhaXQgZ2V0SGFja0xhbmd1YWdlRm9yQnVmZmVyKGVkaXRvci5nZXRCdWZmZXIoKSk7XG4gICAgaWYgKCFoYWNrTGFuZ3VhZ2UpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgdmFyIHtwYXRofSA9IHVybC5wYXJzZShlZGl0b3IuZ2V0UGF0aCgpKTtcbiAgICB2YXIgY29udGVudHMgPSBlZGl0b3IuZ2V0VGV4dCgpO1xuICAgIHZhciBjdXJzb3IgPSBlZGl0b3IuZ2V0TGFzdEN1cnNvcigpO1xuICAgIHZhciBvZmZzZXQgPSBlZGl0b3IuZ2V0QnVmZmVyKCkuY2hhcmFjdGVySW5kZXhGb3JQb3NpdGlvbihjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSk7XG4gICAgLy8gVGhlIHJldHVybmVkIGNvbXBsZXRpb25zIG1heSBoYXZlIHVucmVsYXRlZCByZXN1bHRzLCBldmVuIHRob3VnaCB0aGUgb2Zmc2V0IGlzIHNldCBvbiB0aGUgZW5kIG9mIHRoZSBwcmVmaXguXG4gICAgdmFyIGNvbXBsZXRpb25zID0gYXdhaXQgaGFja0xhbmd1YWdlLmdldENvbXBsZXRpb25zKHBhdGgsIGNvbnRlbnRzLCBvZmZzZXQpO1xuICAgIC8vIEZpbHRlciBvdXQgdGhlIGNvbXBsZXRpb25zIHRoYXQgZG8gbm90IGNvbnRhaW4gdGhlIHByZWZpeCBhcyBhIHRva2VuIGluIHRoZSBtYXRjaCB0ZXh0IGNhc2UgaW5zZW50aXZlbHkuXG4gICAgdmFyIHRva2VuTG93ZXJDYXNlID0gcHJlZml4LnRvTG93ZXJDYXNlKCk7XG5cbiAgICB2YXIge2NvbXBhcmVIYWNrQ29tcGxldGlvbnN9ID0gcmVxdWlyZSgnLi91dGlscycpO1xuICAgIHZhciBoYWNrQ29tcGxldGlvbnNDb21wYXJ0b3IgPSBjb21wYXJlSGFja0NvbXBsZXRpb25zKHByZWZpeCk7XG5cbiAgICByZXR1cm4gY29tcGxldGlvbnNcbiAgICAgIC5maWx0ZXIoY29tcGxldGlvbiA9PiBjb21wbGV0aW9uLm1hdGNoVGV4dC50b0xvd2VyQ2FzZSgpLmluZGV4T2YodG9rZW5Mb3dlckNhc2UpID49IDApXG4gICAgICAvLyBTb3J0IHRoZSBhdXRvLWNvbXBsZXRpb25zIGJhc2VkIG9uIGEgc2NvcmluZyBmdW5jdGlvbiBjb25zaWRlcmluZzpcbiAgICAgIC8vIGNhc2Ugc2Vuc2l0aXZpdHksIHBvc2l0aW9uIGluIHRoZSBjb21wbGV0aW9uLCBwcml2YXRlIGZ1bmN0aW9ucyBhbmQgYWxwaGFiZXRpY2FsIG9yZGVyLlxuICAgICAgLnNvcnQoKGNvbXBsZXRpb24xLCBjb21wbGV0aW9uMikgPT4gaGFja0NvbXBsZXRpb25zQ29tcGFydG9yKGNvbXBsZXRpb24xLm1hdGNoVGV4dCwgY29tcGxldGlvbjIubWF0Y2hUZXh0KSk7XG4gIH0sXG5cbiAgYXN5bmMgZm9ybWF0U291cmNlRnJvbUVkaXRvcihlZGl0b3I6IFRleHRFZGl0b3IsIHJhbmdlOiBSYW5nZSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdmFyIGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKTtcbiAgICB2YXIgaGFja0xhbmd1YWdlID0gYXdhaXQgZ2V0SGFja0xhbmd1YWdlRm9yQnVmZmVyKGJ1ZmZlcik7XG4gICAgdmFyIHN0YXJ0UG9zaXRpb24gPSBidWZmZXIuY2hhcmFjdGVySW5kZXhGb3JQb3NpdGlvbihyYW5nZS5zdGFydCk7XG4gICAgdmFyIGVuZFBvc2l0aW9uID0gYnVmZmVyLmNoYXJhY3RlckluZGV4Rm9yUG9zaXRpb24ocmFuZ2UuZW5kKTtcbiAgICByZXR1cm4gYXdhaXQgaGFja0xhbmd1YWdlLmZvcm1hdFNvdXJjZShidWZmZXIuZ2V0VGV4dCgpLCBzdGFydFBvc2l0aW9uICsgMSwgZW5kUG9zaXRpb24gKyAxKTtcbiAgfSxcblxuICBhc3luYyB0eXBlSGludEZyb21FZGl0b3IoZWRpdG9yOiBUZXh0RWRpdG9yLCBwb3NpdGlvbjogUG9pbnQpOiBQcm9taXNlPD9UeXBlSGludD4ge1xuICAgIHZhciBoYWNrTGFuZ3VhZ2UgPSBhd2FpdCBnZXRIYWNrTGFuZ3VhZ2VGb3JCdWZmZXIoZWRpdG9yLmdldEJ1ZmZlcigpKTtcbiAgICBpZiAoIWhhY2tMYW5ndWFnZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHZhciBtYXRjaERhdGEgPSBleHRyYWN0V29yZEF0UG9zaXRpb24oZWRpdG9yLCBwb3NpdGlvbiwgSEFDS19XT1JEX1JFR0VYKTtcbiAgICBpZiAoIW1hdGNoRGF0YSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgdmFyIHtwYXRofSA9IHVybC5wYXJzZShlZGl0b3IuZ2V0UGF0aCgpKTtcbiAgICB2YXIgY29udGVudHMgPSBlZGl0b3IuZ2V0VGV4dCgpO1xuXG4gICAgdmFyIHR5cGUgPSBhd2FpdCBoYWNrTGFuZ3VhZ2UuZ2V0VHlwZShwYXRoLCBjb250ZW50cywgbWF0Y2hEYXRhLndvcmRNYXRjaFswXSwgcG9zaXRpb24ucm93ICsgMSwgcG9zaXRpb24uY29sdW1uICsgMSk7XG4gICAgaWYgKCF0eXBlKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaGludDogdHlwZSxcbiAgICAgICAgcmFuZ2U6IG1hdGNoRGF0YS5yYW5nZSxcbiAgICAgIH07XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBJZiBhIGxvY2F0aW9uIGNhbiBiZSBmb3VuZCBmb3IgdGhlIGRlY2xhcmF0aW9uLCB0aGUgcmV0dXJuIHZhbHVlIHdpbGxcbiAgICogcmVzb2x2ZSB0byBhbiBvYmplY3Qgd2l0aCB0aGVzZSBmaWVsZHM6IGZpbGUsIGxpbmUsIGNvbHVtbi5cbiAgICovXG4gIGFzeW5jIGZpbmREZWZpbml0aW9uKGVkaXRvcjogVGV4dEVkaXRvciwgbGluZTogbnVtYmVyLCBjb2x1bW46IG51bWJlcik6IFByb21pc2U8YW55PiB7XG4gICAgdmFyIGhhY2tMYW5ndWFnZSA9IGF3YWl0IGdldEhhY2tMYW5ndWFnZUZvckJ1ZmZlcihlZGl0b3IuZ2V0QnVmZmVyKCkpO1xuICAgIGlmICghaGFja0xhbmd1YWdlKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgdmFyIHtwYXRoLCBwcm90b2NvbCwgaG9zdH0gPSB1cmwucGFyc2UoZWRpdG9yLmdldFBhdGgoKSk7XG5cbiAgICB2YXIgY29udGVudHMgPSBlZGl0b3IuZ2V0VGV4dCgpO1xuICAgIHZhciBidWZmZXIgPSBlZGl0b3IuZ2V0QnVmZmVyKCk7XG4gICAgdmFyIGxpbmVUZXh0ID0gYnVmZmVyLmxpbmVGb3JSb3cobGluZSk7XG4gICAgdmFyIHJlc3VsdCA9IGF3YWl0IGhhY2tMYW5ndWFnZS5nZXREZWZpbml0aW9uKHBhdGgsIGNvbnRlbnRzLCBsaW5lICsgMSwgY29sdW1uICsgMSwgbGluZVRleHQpO1xuICAgIGlmICghcmVzdWx0IHx8ICFyZXN1bHQubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgdmFyIHBvcyA9IHJlc3VsdFswXTtcbiAgICB2YXIgcmFuZ2UgPSBudWxsO1xuICAgIC8vIElmIHRoZSBzZWFyY2ggc3RyaW5nIHdhcyBleHBhbmRlZCB0byBpbmNsdWRlIG1vcmUgdGhhbiBhIHZhbGlkIHJlZ2V4IHBocCB3b3JkLlxuICAgIC8vIGUuZy4gaW4gY2FzZSBvZiBYSFAgdGFncywgdGhlIHN0YXJ0IGFuZCBlbmQgY29sdW1uIGFyZSBwcm92aWRlZCB0byB1bmRlcmxpbmUgdGhlIGZ1bGwgcmFuZ2VcbiAgICAvLyB0byB2aXNpdCBpdHMgZGVmaW5pdGlvbi5cbiAgICBpZiAocG9zLnNlYXJjaFN0YXJ0Q29sdW1uICYmIHBvcy5zZWFyY2hFbmRDb2x1bW4pIHtcbiAgICAgIHZhciB7UmFuZ2V9ID0gcmVxdWlyZSgnYXRvbScpO1xuICAgICAgcmFuZ2UgPSBuZXcgUmFuZ2UoW2xpbmUsIHBvcy5zZWFyY2hTdGFydENvbHVtbl0sIFtsaW5lLCBwb3Muc2VhcmNoRW5kQ29sdW1uXSk7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBmaWxlOiBnZXRGaWxlUGF0aChwb3MucGF0aCwgcHJvdG9jb2wsIGhvc3QpLFxuICAgICAgbGluZTogcG9zLmxpbmUsXG4gICAgICBjb2x1bW46IHBvcy5jb2x1bW4sXG4gICAgICByYW5nZSxcbiAgICB9O1xuICB9LFxuXG4gIGFzeW5jIG9uRGlkU2F2ZShlZGl0b3I6IFRleHRFZGl0b3IpOiB2b2lkIHtcbiAgICB2YXIge3BhdGh9ID0gdXJsLnBhcnNlKGVkaXRvci5nZXRQYXRoKCkpO1xuICAgIHZhciBjb250ZW50cyA9IGVkaXRvci5nZXRUZXh0KCk7XG4gICAgdmFyIGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKTtcbiAgICB2YXIgaGFja0xhbmd1YWdlID0gYXdhaXQgZ2V0SGFja0xhbmd1YWdlRm9yQnVmZmVyKGJ1ZmZlcik7XG4gICAgaWYgKCFoYWNrTGFuZ3VhZ2UpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgdGhlIEhhY2tXb3JrZXIgbW9kZWwgd2l0aCB0aGUgY29udGVudHMgb2YgdGhlIGZpbGUgb3BlbmVkIG9yIHNhdmVkLlxuICAgIGF3YWl0IGhhY2tMYW5ndWFnZS51cGRhdGVGaWxlKHBhdGgsIGNvbnRlbnRzKTtcblxuICAgIHZhciBkaWFnbm9zdGljcyA9IFtdO1xuICAgIHRyeSB7XG4gICAgICBkaWFnbm9zdGljcyA9IGF3YWl0IGhhY2tMYW5ndWFnZS5nZXRTZXJ2ZXJEaWFnbm9zdGljcygpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgbG9nZ2VyLmVycm9yKCdIYWNrOiBnZXRTZXJ2ZXJEaWFnbm9zdGljcyBmYWlsZWQnLCBlcnIpO1xuICAgIH1cbiAgICBjbGllbnRUb0hhY2tMaW50ZXJDYWNoZVtnZXRDbGllbnRJZChidWZmZXIpXSA9IGRpYWdub3N0aWNzO1xuICAgIC8vIFRyaWdnZXIgdGhlIGxpbnRlciB0byBjYXRjaCB0aGUgbmV3IGRpYWdub3N0aWNzLlxuICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvciksICdsaW50ZXI6bGludCcpO1xuICB9LFxufTtcblxuZnVuY3Rpb24gZ2V0RmlsZVBhdGgoZmlsZVBhdGg6IHN0cmluZywgcHJvdG9jb2w6ID9zdHJpbmcsIGhvc3Q6ID9zdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoIXByb3RvY29sIHx8ICFob3N0KSB7XG4gICAgcmV0dXJuIGZpbGVQYXRoO1xuICB9XG4gIHJldHVybiBwcm90b2NvbCArICcvLycgKyBob3N0ICsgZmlsZVBhdGg7XG59XG5cbmZ1bmN0aW9uIGdldENsaWVudElkKGJ1ZmZlcjogVGV4dEJ1ZmZlcik6IHN0cmluZyB7XG4gIHZhciBjbGllbnQgPSBnZXRDbGllbnQoYnVmZmVyLmdldFVyaSgpKTtcbiAgcmV0dXJuIGNsaWVudCA/IGNsaWVudC5nZXRJRCgpIDogJ3VuZGVmaW5lZCc7XG59XG5cbmZ1bmN0aW9uIGdldEhhY2tMYW5ndWFnZUZvckJ1ZmZlcihidWZmZXI6IFRleHRCdWZmZXIpOiBQcm9taXNlPD9IYWNrTGFuZ3VhZ2U+IHtcbiAgdmFyIHVyaSA9IGJ1ZmZlci5nZXRVcmkoKTtcbiAgdmFyIHtwYXRoOiBmaWxlUGF0aH0gPSB1cmwucGFyc2UodXJpKTtcbiAgLy8gYGdldENsaWVudGAgY2FuIHJldHVybiBudWxsIGlmIGEgZmlsZSBwYXRoIGRvZXNuJ3QgaGF2ZSBhIHJvb3QgZGlyZWN0b3J5IGluIHRoZSB0cmVlLlxuICAvLyBBbHNvLCByZXR1cm5zIG51bGwgd2hlbiByZWxvYWRpbmcgQXRvbSB3aXRoIG9wZW4gZmlsZXMsIHdoaWxlIHRoZSBSZW1vdGVDb25uZWN0aW9uIGNyZWF0aW9uIGlzIHBlbmRpbmcuXG4gIHZhciBjbGllbnQgPSBnZXRDbGllbnQodXJpKTtcbiAgaWYgKCFjbGllbnQpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gY3JlYXRlSGFja0xhbmd1YWdlSWZOb3RFeGlzdGluZyhjbGllbnQsIGZpbGVQYXRoKTtcbiAgLy8gVE9ETyhtb3N0KTogZGlzcG9zZSB0aGUgbGFuZ3VhZ2Uvd29ya2VyIG9uIHByb2plY3QgY2xvc2UuXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUhhY2tMYW5ndWFnZUlmTm90RXhpc3RpbmcoY2xpZW50OiBOdWNsaWRlQ2xpZW50LCBmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxIYWNrTGFuZ3VhZ2U+IHtcbiAgdmFyIGNsaWVudElkID0gY2xpZW50LmdldElEKCk7XG4gIGlmIChjbGllbnRUb0hhY2tMYW5ndWFnZVtjbGllbnRJZF0pIHtcbiAgICByZXR1cm4gY2xpZW50VG9IYWNrTGFuZ3VhZ2VbY2xpZW50SWRdO1xuICB9XG4gIHZhciBoYWNrQ2xpZW50O1xuICB2YXIgW2lzSGFja0NsaWVudEF2YWlsYWJsZSwgbmVhcmVzdFBhdGhdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgIGNsaWVudC5pc0hhY2tDbGllbnRBdmFpbGFibGUoKSxcbiAgICBjbGllbnQuZmluZE5lYXJlc3RGaWxlKCcuaGhjb25maWcnLCBwYXRoVXRpbC5kaXJuYW1lKGZpbGVQYXRoKSksXG4gIF0pO1xuICAvLyBJZiBtdWx0aXBsZSBjYWxscywgd2VyZSBkb25lIGFzeW5jaHJvbm91c2x5LCBtYWtlIHN1cmUgdG8gcmV0dXJuIHRoZSBzaW5nbGUtY3JlYXRlZCBIYWNrTGFuZ3VhZ2UuXG4gIGlmIChjbGllbnRUb0hhY2tMYW5ndWFnZVtjbGllbnRJZF0pIHtcbiAgICByZXR1cm4gY2xpZW50VG9IYWNrTGFuZ3VhZ2VbY2xpZW50SWRdO1xuICB9XG4gIGlmIChpc0hhY2tDbGllbnRBdmFpbGFibGUgJiYgbmVhcmVzdFBhdGgpIHtcbiAgICBoYWNrQ2xpZW50ID0gY2xpZW50O1xuICB9IGVsc2Uge1xuICAgIGhhY2tDbGllbnQgPSBuZXcgTnVsbEhhY2tDbGllbnQoKTtcbiAgfVxuICBjbGllbnRUb0hhY2tMYW5ndWFnZVtjbGllbnRJZF0gPSBuZXcgSGFja0xhbmd1YWdlKGhhY2tDbGllbnQpO1xuICByZXR1cm4gY2xpZW50VG9IYWNrTGFuZ3VhZ2VbY2xpZW50SWRdO1xufVxuIl19