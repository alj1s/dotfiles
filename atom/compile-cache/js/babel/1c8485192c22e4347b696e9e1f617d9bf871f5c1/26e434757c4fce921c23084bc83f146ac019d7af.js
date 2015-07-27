'use babel';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _require = require('atom');

var Range = _require.Range;

var HackWorker = require('./HackWorker');

var _require2 = require('nuclide-hack-common/lib/constants');

var CompletionType = _require2.CompletionType;
var SymbolType = _require2.SymbolType;

var logger = require('nuclide-logging').getLogger();
// The word char regex include \ to search for namespaced classes.
var wordCharRegex = /[\w\\]/;
// The xhp char regex include : and - to match xhp tags like <ui:button-group>.
var xhpCharRegex = /[\w:-]/;
var XHP_LINE_TEXT_REGEX = /<([a-z][a-z0-9_.:-]*)[^>]*\/?>/gi;

var UPDATE_DEPENDENCIES_INTERVAL_MS = 10000;

/**
 * The HackLanguage is the controller that servers language requests by trying to get worker results
 * and/or results from HackService (which would be executing hh_client on a supporting server)
 * and combining and/or selecting the results to give back to the requester.
 */
module.exports = (function () {
  function HackLanguage(client) {
    _classCallCheck(this, HackLanguage);

    this._hackWorker = new HackWorker();
    this._client = client;
    this._pathContentsMap = {};

    this._setupUpdateDependenciesInterval();
  }

  _createClass(HackLanguage, [{
    key: '_setupUpdateDependenciesInterval',
    value: function _setupUpdateDependenciesInterval() {
      var _this = this;

      // Fetch any dependencies the HackWorker needs after learning about this file.
      // We don't block any realtime logic on the dependency fetching - it could take a while.
      var pendingUpdateDependencies = false;

      var finishUpdateDependencies = function finishUpdateDependencies() {
        pendingUpdateDependencies = false;
      };

      this._updateDependenciesInterval = setInterval(function () {
        if (pendingUpdateDependencies) {
          return;
        }
        pendingUpdateDependencies = true;
        _this.updateDependencies().then(finishUpdateDependencies, finishUpdateDependencies);
      }, UPDATE_DEPENDENCIES_INTERVAL_MS);
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this._hackWorker.dispose();
      clearInterval(this._updateDependenciesInterval);
    }
  }, {
    key: 'getCompletions',
    value: _asyncToGenerator(function* (path, contents, offset) {
      // Calculate the offset of the cursor from the beginning of the file.
      // Then insert AUTO332 in at this offset. (Hack uses this as a marker.)
      var markedContents = contents.substring(0, offset) + 'AUTO332' + contents.substring(offset, contents.length);
      yield this.updateFile(path, markedContents);
      var webWorkerMessage = { cmd: 'hh_auto_complete', args: [path] };
      var response = yield this._hackWorker.runWorkerTask(webWorkerMessage);
      var completionType = getCompletionType(response.completion_type);
      var completions = response.completions;
      if (shouldDoServerCompletion(completionType) || !completions.length) {
        completions = yield this._client.getHackCompletions(markedContents);
      }
      return processCompletions(completions);
    })
  }, {
    key: 'updateFile',
    value: _asyncToGenerator(function* (path, contents) {
      if (contents !== this._pathContentsMap[path]) {
        this._pathContentsMap[path] = contents;
        var webWorkerMessage = { cmd: 'hh_add_file', args: [path, contents] };
        return yield this._hackWorker.runWorkerTask(webWorkerMessage);
      }
    })
  }, {
    key: 'updateDependencies',
    value: _asyncToGenerator(function* () {
      var webWorkerMessage = { cmd: 'hh_get_deps', args: [] };
      var response = yield this._hackWorker.runWorkerTask(webWorkerMessage);
      if (!response.deps.length) {
        return;
      }
      var dependencies = {};
      try {
        dependencies = yield this._client.getHackDependencies(response.deps);
      } catch (err) {
        // Ignore the error, it's just dependency fetching.
        logger.warn('getHackDependencies error:', err);
      }
      // Serially update depednecies not to block the worker from serving other feature requests.
      for (var path in dependencies) {
        yield this.updateDependency(path, dependencies[path]);
      }
    })
  }, {
    key: 'updateDependency',
    value: _asyncToGenerator(function* (path, contents) {
      if (contents !== this._pathContentsMap[path]) {
        var webWorkerMessage = { cmd: 'hh_add_dep', args: [path, contents] };
        yield this._hackWorker.runWorkerTask(webWorkerMessage, { isDependency: true });
      }
    })
  }, {
    key: 'formatSource',
    value: _asyncToGenerator(function* (contents, startPosition, endPosition) {
      var webWorkerMessage = { cmd: 'hh_format', args: [contents, startPosition, endPosition] };
      var response = yield this._hackWorker.runWorkerTask(webWorkerMessage);
      var errorMessage = response.error_message;
      if (errorMessage) {
        if (errorMessage === 'Php_or_decl') {
          throw new Error('Sorry, PHP and <?hh //decl are not supported');
        } else if (errorMessage === 'Parsing_error') {
          throw new Error('Parsing Error! Fix your file so the syntax is valid and retry');
        } else {
          throw new Error('failed formating hack code' + errorMessage);
        }
      } else {
        return response.result;
      }
    })
  }, {
    key: 'getDiagnostics',
    value: _asyncToGenerator(function* (path, contents) {
      if (!isHackFile(contents)) {
        return [];
      }
      yield this.updateFile(path, contents);
      var webWorkerMessage = { cmd: 'hh_check_file', args: [path] };
      var response = yield this._hackWorker.runWorkerTask(webWorkerMessage);
      return parseErrorsFromResponse(response);
    })
  }, {
    key: 'getServerDiagnostics',
    value: _asyncToGenerator(function* () {
      var response = yield this._client.getHackDiagnostics();
      return parseErrorsFromResponse(response);
    })
  }, {
    key: 'getDefinition',
    value: _asyncToGenerator(function* (path, contents, lineNumber, column, lineText) {

      if (!isHackFile(contents)) {
        return null;
      }

      var _ref = yield Promise.all([
      // First Stage. Ask Hack clientside for a result location.
      this._getDefinitionLocationAtPosition(path, contents, lineNumber, column),
      // Second stage. Ask Hack clientside for the name of the symbol we're on. If we get a name,
      // ask the server for the location of this name
      this._getDefinitionFromIdentifyMethod(path, contents, lineNumber, column),
      // Third stage, do simple string parsing of the file to get a string to search the server for.
      // Then ask the server for the location of that string.
      this._getDefinitionFromStringParse(lineText, column)]);

      var _ref2 = _slicedToArray(_ref, 3);

      var clientSideResults = _ref2[0];
      var identifyMethodResults = _ref2[1];
      var stringParseResults = _ref2[2];

      // We now have results from all 3 sources. Chose the best results to show to the user.
      if (identifyMethodResults.length === 1) {
        return identifyMethodResults;
      } else if (stringParseResults.length === 1) {
        return stringParseResults;
      } else if (clientSideResults.length === 1) {
        return clientSideResults;
      } else if (identifyMethodResults.length > 0) {
        return identifyMethodResults;
      } else if (stringParseResults.length > 0) {
        return stringParseResults;
      } else {
        return clientSideResults;
      }
    })
  }, {
    key: 'getSymbolNameAtPosition',
    value: _asyncToGenerator(function* (path, contents, lineNumber, column) {

      yield this.updateFile(path, contents);
      var webWorkerMessage = { cmd: 'hh_get_method_name', args: [path, lineNumber - 1, column - 1] };
      var response = yield this._hackWorker.runWorkerTask(webWorkerMessage);
      if (!response.name) {
        return null;
      }
      var symbolType = getSymbolType(response.result_type);
      var position = response.pos;
      return {
        name: response.name,
        type: symbolType,
        line: position.line,
        column: position.char_start,
        length: position.char_end - position.char_start + 1
      };
    })
  }, {
    key: '_getDefinitionLocationAtPosition',
    value: _asyncToGenerator(function* (path, contents, lineNumber, column) {

      yield this.updateFile(path, contents);
      var webWorkerMessage = { cmd: 'hh_infer_pos', args: [path, lineNumber, column] };
      var response = yield this._hackWorker.runWorkerTask(webWorkerMessage);
      var position = response.pos || {};
      if (position.filename) {
        return [{
          path: position.filename,
          line: position.line - 1,
          column: position.char_start - 1,
          length: position.char_end - position.char_start + 1
        }];
      } else {
        return [];
      }
    })
  }, {
    key: '_getDefinitionFromIdentifyMethod',
    value: _asyncToGenerator(function* (path, contents, lineNumber, column) {

      try {
        var symbol = yield this.getSymbolNameAtPosition(path, contents, lineNumber, column);
        var defs = [];
        if (symbol && symbol.name) {
          defs = yield this._client.getHackDefinition(symbol.name, symbol.type);
        }
        return defs;
      } catch (err) {
        // ignore the error
        logger.warn('_getDefinitionFromIdentifyMethod error:', err);
        return [];
      }
    })
  }, {
    key: '_getDefinitionFromStringParse',
    value: _asyncToGenerator(function* (lineText, column) {
      var _parseStringForExpression2 = this._parseStringForExpression(lineText, column);

      var search = _parseStringForExpression2.search;
      var start = _parseStringForExpression2.start;
      var end = _parseStringForExpression2.end;

      if (!search) {
        return [];
      }
      var defs = [];
      try {
        defs = yield this._client.getHackDefinition(search, SymbolType.UNKNOWN);
      } catch (err) {
        // ignore the error
        logger.warn('_getDefinitionFromStringParse error:', err);
      }
      return defs.map(function (definition) {
        return {
          path: definition.path,
          line: definition.line,
          column: definition.column,
          searchStartColumn: start,
          searchEndColumn: end
        };
      });
    })
  }, {
    key: '_parseStringForExpression',
    value: function _parseStringForExpression(lineText, column) {
      var search = null;
      var start = column;

      var isXHP = false;
      var xhpMatch;
      while (xhpMatch = XHP_LINE_TEXT_REGEX.exec(lineText)) {
        var xhpMatchIndex = xhpMatch.index + 1;
        if (column >= xhpMatchIndex && column < xhpMatchIndex + xhpMatch[1].length) {
          isXHP = true;
          break;
        }
      }

      var syntaxCharRegex = isXHP ? xhpCharRegex : wordCharRegex;
      // Scan for the word start for the hack variable, function or xhp tag
      // we are trying to get the definition for.
      while (start >= 0 && syntaxCharRegex.test(lineText.charAt(start))) {
        start--;
      }
      if (lineText[start] === '$') {
        start--;
      }
      start++;
      var end = column;
      while (syntaxCharRegex.test(lineText.charAt(end))) {
        end++;
      }
      search = lineText.substring(start, end);
      // XHP UI elements start with : but the usages doesn't have that colon.
      if (isXHP && !search.startsWith(':')) {
        search = ':' + search;
      }
      return { search: search, start: start, end: end };
    }
  }, {
    key: 'getType',
    value: _asyncToGenerator(function* (path, contents, expression, lineNumber, column) {
      if (!isHackFile(contents) || !expression.startsWith('$')) {
        return null;
      }
      yield this.updateFile(path, contents);
      var webWorkerMessage = { cmd: 'hh_infer_type', args: [path, lineNumber, column] };

      var _ref3 = yield this._hackWorker.runWorkerTask(webWorkerMessage);

      var type = _ref3.type;

      return type;
    })
  }]);

  return HackLanguage;
})();

var stringToCompletionType = {
  'id': CompletionType.ID,
  'new': CompletionType.NEW,
  'type': CompletionType.TYPE,
  'class_get': CompletionType.CLASS_GET,
  'var': CompletionType.VAR
};

function getCompletionType(input) {
  var completionType = stringToCompletionType[input];
  if (typeof completionType === 'undefined') {
    completionType = CompletionType.NONE;
  }
  return completionType;
}

var stringToSymbolType = {
  'class': SymbolType.CLASS,
  'function': SymbolType.FUNCTION,
  'method': SymbolType.METHOD,
  'local': SymbolType.LOCAL
};

function getSymbolType(input) {
  var symbolType = stringToSymbolType[input];
  if (typeof symbolType === 'undefined') {
    symbolType = SymbolType.METHOD;
  }
  return symbolType;
}

function parseErrorsFromResponse(response) {
  var errors = response.errors.map(function (error) {
    var rootCause = null;
    var errorParts = error.message;
    return errorParts.map(function (errorPart) {
      if (!rootCause) {
        var start = errorPart.start;
        var end = errorPart.end;
        var line = errorPart.line;
        var path = errorPart.path;

        start--;
        line--;
        rootCause = {
          range: new Range([line, start], [line, end]),
          path: path,
          start: start,
          line: line
        };
      }
      return {
        type: 'Error',
        text: errorPart.descr,
        filePath: rootCause.path,
        range: rootCause.range
      };
    });
  });
  // flatten the arrays
  return [].concat.apply([], errors);
}

var serverCompletionTypes = new Set([CompletionType.ID, CompletionType.NEW, CompletionType.TYPE]);

function shouldDoServerCompletion(type) {
  return serverCompletionTypes.has(type);
}

function processCompletions(completionsResponse) {
  return completionsResponse.map(function (completion) {
    var name = completion.name;
    var type = completion.type;
    var functionDetails = completion.func_details;

    if (type && type.indexOf('(') === 0 && type.lastIndexOf(')') === type.length - 1) {
      type = type.substring(1, type.length - 1);
    }
    var matchSnippet = name;
    if (functionDetails) {
      var params = functionDetails.params;

      // Construct the snippet: e.g. myFunction(${1:$arg1}, ${2:$arg2});
      var paramsString = params.map(function (param, index) {
        return '${' + (index + 1) + ':' + param.name + '}';
      }).join(', ');
      matchSnippet = name + '(' + paramsString + ')';
    }
    return {
      matchSnippet: matchSnippet,
      matchText: name,
      matchType: type
    };
  });
}

function isHackFile(contents) {
  return contents && contents.startsWith('<?hh');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWhhY2svbGliL0hhY2tMYW5ndWFnZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2VBV0UsT0FBTyxDQUFDLE1BQU0sQ0FBQzs7SUFBeEIsS0FBSyxZQUFMLEtBQUs7O0FBQ1YsSUFBSSxVQUFVLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDOztnQkFDTixPQUFPLENBQUMsbUNBQW1DLENBQUM7O0lBQTFFLGNBQWMsYUFBZCxjQUFjO0lBQUUsVUFBVSxhQUFWLFVBQVU7O0FBQy9CLElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDOztBQUVwRCxJQUFJLGFBQWEsR0FBRyxRQUFRLENBQUM7O0FBRTdCLElBQUksWUFBWSxHQUFHLFFBQVEsQ0FBQztBQUM1QixJQUFJLG1CQUFtQixHQUFHLGtDQUFrQyxDQUFDOztBQUU3RCxJQUFNLCtCQUErQixHQUFHLEtBQUssQ0FBQzs7Ozs7OztBQU85QyxNQUFNLENBQUMsT0FBTztBQUVELFdBRlUsWUFBWSxDQUVyQixNQUFxQixFQUFFOzBCQUZkLFlBQVk7O0FBRy9CLFFBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxVQUFVLEVBQUUsQ0FBQztBQUNwQyxRQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztBQUN0QixRQUFJLENBQUMsZ0JBQWdCLEdBQUcsRUFBRSxDQUFDOztBQUUzQixRQUFJLENBQUMsZ0NBQWdDLEVBQUUsQ0FBQztHQUN6Qzs7ZUFSb0IsWUFBWTs7V0FVRCw0Q0FBRzs7Ozs7QUFHakMsVUFBSSx5QkFBeUIsR0FBRyxLQUFLLENBQUM7O0FBRXRDLFVBQUksd0JBQXdCLEdBQUcsU0FBM0Isd0JBQXdCLEdBQVM7QUFDbkMsaUNBQXlCLEdBQUcsS0FBSyxDQUFDO09BQ25DLENBQUM7O0FBRUYsVUFBSSxDQUFD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TSxHQUFHLENBQUMsRUFBRTtBQUNoRixVQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztLQUMzQztBQUNELFFBQUksWUFBWSxHQUFHLElBQUksQ0FBQztBQUN4QixRQUFJLGVBQWUsRUFBRTtVQUNkLE1BQU0sR0FBSSxlQUFlLENBQXpCLE1BQU07OztBQUVYLFVBQUksWUFBWSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBQyxLQUFLLEVBQUUsS0FBSztlQUFLLElBQUksSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFBLEFBQUMsR0FBRyxHQUFHLEdBQUcsS0FBSyxDQUFDLElBQUksR0FBRyxHQUFHO09BQUEsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN4RyxrQkFBWSxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsWUFBWSxHQUFHLEdBQUcsQ0FBQztLQUNoRDtBQUNELFdBQU87QUFDTCxrQkFBWSxFQUFaLFlBQVk7QUFDWixlQUFTLEVBQUUsSUFBSTtBQUNmLGVBQVMsRUFBRSxJQUFJO0tBQ2hCLENBQUM7R0FDSCxDQUFDLENBQUM7Q0FDSjs7QUFFRCxTQUFTLFVBQVUsQ0FBQyxRQUFnQixFQUFXO0FBQzdDLFNBQU8sUUFBUSxJQUFJLFFBQVEsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7Q0FDaEQiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL251Y2xpZGUtaGFjay9saWIvSGFja0xhbmd1YWdlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxudmFyIHtSYW5nZX0gPSByZXF1aXJlKCdhdG9tJyk7XG52YXIgSGFja1dvcmtlciA9IHJlcXVpcmUoJy4vSGFja1dvcmtlcicpO1xudmFyIHtDb21wbGV0aW9uVHlwZSwgU3ltYm9sVHlwZX0gPSByZXF1aXJlKCdudWNsaWRlLWhhY2stY29tbW9uL2xpYi9jb25zdGFudHMnKTtcbnZhciBsb2dnZXIgPSByZXF1aXJlKCdudWNsaWRlLWxvZ2dpbmcnKS5nZXRMb2dnZXIoKTtcbi8vIFRoZSB3b3JkIGNoYXIgcmVnZXggaW5jbHVkZSBcXCB0byBzZWFyY2ggZm9yIG5hbWVzcGFjZWQgY2xhc3Nlcy5cbnZhciB3b3JkQ2hhclJlZ2V4ID0gL1tcXHdcXFxcXS87XG4vLyBUaGUgeGhwIGNoYXIgcmVnZXggaW5jbHVkZSA6IGFuZCAtIHRvIG1hdGNoIHhocCB0YWdzIGxpa2UgPHVpOmJ1dHRvbi1ncm91cD4uXG52YXIgeGhwQ2hhclJlZ2V4ID0gL1tcXHc6LV0vO1xudmFyIFhIUF9MSU5FX1RFWFRfUkVHRVggPSAvPChbYS16XVthLXowLTlfLjotXSopW14+XSpcXC8/Pi9naTtcblxuY29uc3QgVVBEQVRFX0RFUEVOREVOQ0lFU19JTlRFUlZBTF9NUyA9IDEwMDAwO1xuXG4vKipcbiAqIFRoZSBIYWNrTGFuZ3VhZ2UgaXMgdGhlIGNvbnRyb2xsZXIgdGhhdCBzZXJ2ZXJzIGxhbmd1YWdlIHJlcXVlc3RzIGJ5IHRyeWluZyB0byBnZXQgd29ya2VyIHJlc3VsdHNcbiAqIGFuZC9vciByZXN1bHRzIGZyb20gSGFja1NlcnZpY2UgKHdoaWNoIHdvdWxkIGJlIGV4ZWN1dGluZyBoaF9jbGllbnQgb24gYSBzdXBwb3J0aW5nIHNlcnZlcilcbiAqIGFuZCBjb21iaW5pbmcgYW5kL29yIHNlbGVjdGluZyB0aGUgcmVzdWx0cyB0byBnaXZlIGJhY2sgdG8gdGhlIHJlcXVlc3Rlci5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBIYWNrTGFuZ3VhZ2Uge1xuXG4gIGNvbnN0cnVjdG9yKGNsaWVudDogTnVjbGlkZUNsaWVudCkge1xuICAgIHRoaXMuX2hhY2tXb3JrZXIgPSBuZXcgSGFja1dvcmtlcigpO1xuICAgIHRoaXMuX2NsaWVudCA9IGNsaWVudDtcbiAgICB0aGlzLl9wYXRoQ29udGVudHNNYXAgPSB7fTtcblxuICAgIHRoaXMuX3NldHVwVXBkYXRlRGVwZW5kZW5jaWVzSW50ZXJ2YWwoKTtcbiAgfVxuXG4gIF9zZXR1cFVwZGF0ZURlcGVuZGVuY2llc0ludGVydmFsKCkge1xuICAgIC8vIEZldGNoIGFueSBkZXBlbmRlbmNpZXMgdGhlIEhhY2tXb3JrZXIgbmVlZHMgYWZ0ZXIgbGVhcm5pbmcgYWJvdXQgdGhpcyBmaWxlLlxuICAgIC8vIFdlIGRvbid0IGJsb2NrIGFueSByZWFsdGltZSBsb2dpYyBvbiB0aGUgZGVwZW5kZW5jeSBmZXRjaGluZyAtIGl0IGNvdWxkIHRha2UgYSB3aGlsZS5cbiAgICB2YXIgcGVuZGluZ1VwZGF0ZURlcGVuZGVuY2llcyA9IGZhbHNlO1xuXG4gICAgdmFyIGZpbmlzaFVwZGF0ZURlcGVuZGVuY2llcyA9ICgpID0+IHtcbiAgICAgIHBlbmRpbmdVcGRhdGVEZXBlbmRlbmNpZXMgPSBmYWxzZTtcbiAgICB9O1xuXG4gICAgdGhpcy5fdXBkYXRlRGVwZW5kZW5jaWVzSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICBpZiAocGVuZGluZ1VwZGF0ZURlcGVuZGVuY2llcykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBwZW5kaW5nVXBkYXRlRGVwZW5kZW5jaWVzID0gdHJ1ZTtcbiAgICAgIHRoaXMudXBkYXRlRGVwZW5kZW5jaWVzKCkudGhlbihmaW5pc2hVcGRhdGVEZXBlbmRlbmNpZXMsIGZpbmlzaFVwZGF0ZURlcGVuZGVuY2llcyk7XG4gICAgfSwgVVBEQVRFX0RFUEVOREVOQ0lFU19JTlRFUlZBTF9NUyk7XG4gIH1cblxuICBkaXNwb3NlKCkge1xuICAgIHRoaXMuX2hhY2tXb3JrZXIuZGlzcG9zZSgpO1xuICAgIGNsZWFySW50ZXJ2YWwodGhpcy5fdXBkYXRlRGVwZW5kZW5jaWVzSW50ZXJ2YWwpO1xuICB9XG5cbiAgYXN5bmMgZ2V0Q29tcGxldGlvbnMocGF0aDogc3RyaW5nLCBjb250ZW50czogc3RyaW5nLCBvZmZzZXQ6IG51bWJlcik6IFByb21pc2U8QXJyYXk8YW55Pj4ge1xuICAgIC8vIENhbGN1bGF0ZSB0aGUgb2Zmc2V0IG9mIHRoZSBjdXJzb3IgZnJvbSB0aGUgYmVnaW5uaW5nIG9mIHRoZSBmaWxlLlxuICAgIC8vIFRoZW4gaW5zZXJ0IEFVVE8zMzIgaW4gYXQgdGhpcyBvZmZzZXQuIChIYWNrIHVzZXMgdGhpcyBhcyBhIG1hcmtlci4pXG4gICAgdmFyIG1hcmtlZENvbnRlbnRzID0gY29udGVudHMuc3Vic3RyaW5nKDAsIG9mZnNldCkgK1xuICAgICAgICAnQVVUTzMzMicgKyBjb250ZW50cy5zdWJzdHJpbmcob2Zmc2V0LCBjb250ZW50cy5sZW5ndGgpO1xuICAgIGF3YWl0IHRoaXMudXBkYXRlRmlsZShwYXRoLCBtYXJrZWRDb250ZW50cyk7XG4gICAgdmFyIHdlYldvcmtlck1lc3NhZ2UgPSB7Y21kOiAnaGhfYXV0b19jb21wbGV0ZScsIGFyZ3M6IFtwYXRoXX07XG4gICAgdmFyIHJlc3BvbnNlID0gYXdhaXQgdGhpcy5faGFja1dvcmtlci5ydW5Xb3JrZXJUYXNrKHdlYldvcmtlck1lc3NhZ2UpO1xuICAgIHZhciBjb21wbGV0aW9uVHlwZSA9IGdldENvbXBsZXRpb25UeXBlKHJlc3BvbnNlLmNvbXBsZXRpb25fdHlwZSk7XG4gICAgdmFyIGNvbXBsZXRpb25zID0gcmVzcG9uc2UuY29tcGxldGlvbnM7XG4gICAgaWYgKHNob3VsZERvU2VydmVyQ29tcGxldGlvbihjb21wbGV0aW9uVHlwZSkgfHwgIWNvbXBsZXRpb25zLmxlbmd0aCkge1xuICAgICAgY29tcGxldGlvbnMgPSBhd2FpdCB0aGlzLl9jbGllbnQuZ2V0SGFja0NvbXBsZXRpb25zKG1hcmtlZENvbnRlbnRzKTtcbiAgICB9XG4gICAgcmV0dXJuIHByb2Nlc3NDb21wbGV0aW9ucyhjb21wbGV0aW9ucyk7XG4gIH1cblxuICBhc3luYyB1cGRhdGVGaWxlKHBhdGg6IHN0cmluZywgY29udGVudHM6IHN0cmluZyk6IFByb21pc2Uge1xuICAgIGlmIChjb250ZW50cyAhPT0gdGhpcy5fcGF0aENvbnRlbnRzTWFwW3BhdGhdKSB7XG4gICAgICB0aGlzLl9wYXRoQ29udGVudHNNYXBbcGF0aF0gPSBjb250ZW50cztcbiAgICAgIHZhciB3ZWJXb3JrZXJNZXNzYWdlID0ge2NtZDogJ2hoX2FkZF9maWxlJywgYXJnczogW3BhdGgsIGNvbnRlbnRzXX07XG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy5faGFja1dvcmtlci5ydW5Xb3JrZXJUYXNrKHdlYldvcmtlck1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIHVwZGF0ZURlcGVuZGVuY2llcygpOiBQcm9taXNlIHtcbiAgICAgIHZhciB3ZWJXb3JrZXJNZXNzYWdlID0ge2NtZDogJ2hoX2dldF9kZXBzJywgYXJnczogW119O1xuICAgICAgdmFyIHJlc3BvbnNlID0gYXdhaXQgdGhpcy5faGFja1dvcmtlci5ydW5Xb3JrZXJUYXNrKHdlYldvcmtlck1lc3NhZ2UpO1xuICAgICAgaWYgKCFyZXNwb25zZS5kZXBzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2YXIgZGVwZW5kZW5jaWVzID0ge307XG4gICAgICB0cnkge1xuICAgICAgICBkZXBlbmRlbmNpZXMgPSBhd2FpdCB0aGlzLl9jbGllbnQuZ2V0SGFja0RlcGVuZGVuY2llcyhyZXNwb25zZS5kZXBzKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAvLyBJZ25vcmUgdGhlIGVycm9yLCBpdCdzIGp1c3QgZGVwZW5kZW5jeSBmZXRjaGluZy5cbiAgICAgICAgbG9nZ2VyLndhcm4oJ2dldEhhY2tEZXBlbmRlbmNpZXMgZXJyb3I6JywgZXJyKTtcbiAgICAgIH1cbiAgICAgIC8vIFNlcmlhbGx5IHVwZGF0ZSBkZXBlZG5lY2llcyBub3QgdG8gYmxvY2sgdGhlIHdvcmtlciBmcm9tIHNlcnZpbmcgb3RoZXIgZmVhdHVyZSByZXF1ZXN0cy5cbiAgICAgIGZvciAodmFyIHBhdGggaW4gZGVwZW5kZW5jaWVzKSB7XG4gICAgICAgIGF3YWl0IHRoaXMudXBkYXRlRGVwZW5kZW5jeShwYXRoLCBkZXBlbmRlbmNpZXNbcGF0aF0pO1xuICAgICAgfVxuICB9XG5cbiAgYXN5bmMgdXBkYXRlRGVwZW5kZW5jeShwYXRoOiBzdHJpbmcsIGNvbnRlbnRzOiBzdHJpbmcpOiBQcm9taXNlIHtcbiAgICBpZiAoY29udGVudHMgIT09IHRoaXMuX3BhdGhDb250ZW50c01hcFtwYXRoXSkge1xuICAgICAgdmFyIHdlYldvcmtlck1lc3NhZ2UgPSB7Y21kOiAnaGhfYWRkX2RlcCcsIGFyZ3M6IFtwYXRoLCBjb250ZW50c119O1xuICAgICAgYXdhaXQgdGhpcy5faGFja1dvcmtlci5ydW5Xb3JrZXJUYXNrKHdlYldvcmtlck1lc3NhZ2UsIHtpc0RlcGVuZGVuY3k6IHRydWV9KTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBmb3JtYXRTb3VyY2UoY29udGVudHM6IHN0cmluZywgc3RhcnRQb3NpdGlvbjogbnVtYmVyLCBlbmRQb3NpdGlvbjogbnVtYmVyKSB7XG4gICAgdmFyIHdlYldvcmtlck1lc3NhZ2UgPSB7Y21kOiAnaGhfZm9ybWF0JywgYXJnczogW2NvbnRlbnRzLCBzdGFydFBvc2l0aW9uLCBlbmRQb3NpdGlvbl19O1xuICAgIHZhciByZXNwb25zZSA9IGF3YWl0IHRoaXMuX2hhY2tXb3JrZXIucnVuV29ya2VyVGFzayh3ZWJXb3JrZXJNZXNzYWdlKTtcbiAgICB2YXIgZXJyb3JNZXNzYWdlID0gcmVzcG9uc2UuZXJyb3JfbWVzc2FnZTtcbiAgICBpZiAoZXJyb3JNZXNzYWdlKSB7XG4gICAgICBpZiAoZXJyb3JNZXNzYWdlID09PSAnUGhwX29yX2RlY2wnKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignU29ycnksIFBIUCBhbmQgPD9oaCAvL2RlY2wgYXJlIG5vdCBzdXBwb3J0ZWQnKTtcbiAgICAgIH0gZWxzZSBpZiAoZXJyb3JNZXNzYWdlID09PSAnUGFyc2luZ19lcnJvcicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQYXJzaW5nIEVycm9yISBGaXggeW91ciBmaWxlIHNvIHRoZSBzeW50YXggaXMgdmFsaWQgYW5kIHJldHJ5Jyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ZhaWxlZCBmb3JtYXRpbmcgaGFjayBjb2RlJyArIGVycm9yTWVzc2FnZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiByZXNwb25zZS5yZXN1bHQ7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZ2V0RGlhZ25vc3RpY3MocGF0aDogc3RyaW5nLCBjb250ZW50czogc3RyaW5nKTogUHJvbWlzZTxBcnJheTxhbnk+PiB7XG4gICAgaWYgKCFpc0hhY2tGaWxlKGNvbnRlbnRzKSkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLnVwZGF0ZUZpbGUocGF0aCwgY29udGVudHMpO1xuICAgIHZhciB3ZWJXb3JrZXJNZXNzYWdlID0ge2NtZDogJ2hoX2NoZWNrX2ZpbGUnLCBhcmdzOiBbcGF0aF19O1xuICAgIHZhciByZXNwb25zZSA9IGF3YWl0IHRoaXMuX2hhY2tXb3JrZXIucnVuV29ya2VyVGFzayh3ZWJXb3JrZXJNZXNzYWdlKTtcbiAgICByZXR1cm4gcGFyc2VFcnJvcnNGcm9tUmVzcG9uc2UocmVzcG9uc2UpO1xuICB9XG5cbiAgYXN5bmMgZ2V0U2VydmVyRGlhZ25vc3RpY3MoKTogUHJvbWlzZTxBcnJheTxhbnk+PiB7XG4gICAgdmFyIHJlc3BvbnNlID0gYXdhaXQgdGhpcy5fY2xpZW50LmdldEhhY2tEaWFnbm9zdGljcygpO1xuICAgIHJldHVybiBwYXJzZUVycm9yc0Zyb21SZXNwb25zZShyZXNwb25zZSk7XG4gIH1cblxuICBhc3luYyBnZXREZWZpbml0aW9uKFxuICAgICAgcGF0aDogc3RyaW5nLFxuICAgICAgY29udGVudHM6IHN0cmluZyxcbiAgICAgIGxpbmVOdW1iZXI6IG51bWJlcixcbiAgICAgIGNvbHVtbjogbnVtYmVyLFxuICAgICAgbGluZVRleHQ6IHN0cmluZ1xuICAgICk6IFByb21pc2U8QXJyYXk8YW55Pj4ge1xuXG4gICAgaWYgKCFpc0hhY2tGaWxlKGNvbnRlbnRzKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgdmFyIFtjbGllbnRTaWRlUmVzdWx0cywgaWRlbnRpZnlNZXRob2RSZXN1bHRzLCBzdHJpbmdQYXJzZVJlc3VsdHNdID1cbiAgICAgIGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgLy8gRmlyc3QgU3RhZ2UuIEFzayBIYWNrIGNsaWVudHNpZGUgZm9yIGEgcmVzdWx0IGxvY2F0aW9uLlxuICAgICAgICB0aGlzLl9nZXREZWZpbml0aW9uTG9jYXRpb25BdFBvc2l0aW9uKHBhdGgsIGNvbnRlbnRzLCBsaW5lTnVtYmVyLCBjb2x1bW4pLFxuICAgICAgICAvLyBTZWNvbmQgc3RhZ2UuIEFzayBIYWNrIGNsaWVudHNpZGUgZm9yIHRoZSBuYW1lIG9mIHRoZSBzeW1ib2wgd2UncmUgb24uIElmIHdlIGdldCBhIG5hbWUsXG4gICAgICAgIC8vIGFzayB0aGUgc2VydmVyIGZvciB0aGUgbG9jYXRpb24gb2YgdGhpcyBuYW1lXG4gICAgICAgIHRoaXMuX2dldERlZmluaXRpb25Gcm9tSWRlbnRpZnlNZXRob2QocGF0aCwgY29udGVudHMsIGxpbmVOdW1iZXIsIGNvbHVtbiksXG4gICAgICAgIC8vIFRoaXJkIHN0YWdlLCBkbyBzaW1wbGUgc3RyaW5nIHBhcnNpbmcgb2YgdGhlIGZpbGUgdG8gZ2V0IGEgc3RyaW5nIHRvIHNlYXJjaCB0aGUgc2VydmVyIGZvci5cbiAgICAgICAgLy8gVGhlbiBhc2sgdGhlIHNlcnZlciBmb3IgdGhlIGxvY2F0aW9uIG9mIHRoYXQgc3RyaW5nLlxuICAgICAgICB0aGlzLl9nZXREZWZpbml0aW9uRnJvbVN0cmluZ1BhcnNlKGxpbmVUZXh0LCBjb2x1bW4pLFxuICAgICAgXSk7XG4gICAgLy8gV2Ugbm93IGhhdmUgcmVzdWx0cyBmcm9tIGFsbCAzIHNvdXJjZXMuIENob3NlIHRoZSBiZXN0IHJlc3VsdHMgdG8gc2hvdyB0byB0aGUgdXNlci5cbiAgICBpZiAoaWRlbnRpZnlNZXRob2RSZXN1bHRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgcmV0dXJuIGlkZW50aWZ5TWV0aG9kUmVzdWx0cztcbiAgICB9IGVsc2UgaWYgKHN0cmluZ1BhcnNlUmVzdWx0cy5sZW5ndGggPT09IDEpIHtcbiAgICAgIHJldHVybiBzdHJpbmdQYXJzZVJlc3VsdHM7XG4gICAgfSBlbHNlIGlmIChjbGllbnRTaWRlUmVzdWx0cy5sZW5ndGggPT09IDEpIHtcbiAgICAgIHJldHVybiBjbGllbnRTaWRlUmVzdWx0cztcbiAgICB9IGVsc2UgaWYgKGlkZW50aWZ5TWV0aG9kUmVzdWx0cy5sZW5ndGggPiAwKSB7XG4gICAgICByZXR1cm4gaWRlbnRpZnlNZXRob2RSZXN1bHRzO1xuICAgIH0gZWxzZSBpZiAoc3RyaW5nUGFyc2VSZXN1bHRzLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybiBzdHJpbmdQYXJzZVJlc3VsdHM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjbGllbnRTaWRlUmVzdWx0cztcbiAgICB9XG4gIH1cblxuICBhc3luYyBnZXRTeW1ib2xOYW1lQXRQb3NpdGlvbihcbiAgICAgIHBhdGg6IHN0cmluZyxcbiAgICAgIGNvbnRlbnRzOiBzdHJpbmcsXG4gICAgICBsaW5lTnVtYmVyOiBudW1iZXIsXG4gICAgICBjb2x1bW46IG51bWJlclxuICAgICk6IFByb21pc2U8YW55PiB7XG5cbiAgICBhd2FpdCB0aGlzLnVwZGF0ZUZpbGUocGF0aCwgY29udGVudHMpO1xuICAgIHZhciB3ZWJXb3JrZXJNZXNzYWdlID0ge2NtZDogJ2hoX2dldF9tZXRob2RfbmFtZScsIGFyZ3M6IFtwYXRoLCBsaW5lTnVtYmVyIC0gMSwgY29sdW1uIC0gMV19O1xuICAgIHZhciByZXNwb25zZSA9IGF3YWl0IHRoaXMuX2hhY2tXb3JrZXIucnVuV29ya2VyVGFzayh3ZWJXb3JrZXJNZXNzYWdlKTtcbiAgICBpZiAoIXJlc3BvbnNlLm5hbWUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICB2YXIgc3ltYm9sVHlwZSA9IGdldFN5bWJvbFR5cGUocmVzcG9uc2UucmVzdWx0X3R5cGUpO1xuICAgIHZhciBwb3NpdGlvbiA9IHJlc3BvbnNlLnBvcztcbiAgICByZXR1cm4ge1xuICAgICAgbmFtZTogcmVzcG9uc2UubmFtZSxcbiAgICAgIHR5cGU6IHN5bWJvbFR5cGUsXG4gICAgICBsaW5lOiBwb3NpdGlvbi5saW5lLFxuICAgICAgY29sdW1uOiBwb3NpdGlvbi5jaGFyX3N0YXJ0LFxuICAgICAgbGVuZ3RoOiBwb3NpdGlvbi5jaGFyX2VuZCAtIHBvc2l0aW9uLmNoYXJfc3RhcnQgKyAxLFxuICAgIH07XG4gIH1cblxuICBhc3luYyBfZ2V0RGVmaW5pdGlvbkxvY2F0aW9uQXRQb3NpdGlvbihcbiAgICAgIHBhdGg6IHN0cmluZyxcbiAgICAgIGNvbnRlbnRzOiBzdHJpbmcsXG4gICAgICBsaW5lTnVtYmVyOiBudW1iZXIsXG4gICAgICBjb2x1bW46IG51bWJlclxuICAgICk6IFByb21pc2U8QXJyYXk8YW55Pj4ge1xuXG4gICAgYXdhaXQgdGhpcy51cGRhdGVGaWxlKHBhdGgsIGNvbnRlbnRzKTtcbiAgICB2YXIgd2ViV29ya2VyTWVzc2FnZSA9IHtjbWQ6ICdoaF9pbmZlcl9wb3MnLCBhcmdzOiBbcGF0aCwgbGluZU51bWJlciwgY29sdW1uXX07XG4gICAgdmFyIHJlc3BvbnNlID0gYXdhaXQgdGhpcy5faGFja1dvcmtlci5ydW5Xb3JrZXJUYXNrKHdlYldvcmtlck1lc3NhZ2UpO1xuICAgIHZhciBwb3NpdGlvbiA9IHJlc3BvbnNlLnBvcyB8fCB7fTtcbiAgICBpZiAocG9zaXRpb24uZmlsZW5hbWUpIHtcbiAgICAgIHJldHVybiBbe1xuICAgICAgICBwYXRoOiBwb3NpdGlvbi5maWxlbmFtZSxcbiAgICAgICAgbGluZTogcG9zaXRpb24ubGluZSAtIDEsXG4gICAgICAgIGNvbHVtbjogcG9zaXRpb24uY2hhcl9zdGFydCAtIDEsXG4gICAgICAgIGxlbmd0aDogcG9zaXRpb24uY2hhcl9lbmQgLSBwb3NpdGlvbi5jaGFyX3N0YXJ0ICsgMSxcbiAgICAgIH1dO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgX2dldERlZmluaXRpb25Gcm9tSWRlbnRpZnlNZXRob2QoXG4gICAgICBwYXRoOiBzdHJpbmcsXG4gICAgICBjb250ZW50czogc3RyaW5nLFxuICAgICAgbGluZU51bWJlcjogbnVtYmVyLFxuICAgICAgY29sdW1uOiBudW1iZXJcbiAgICApOiBQcm9taXNlPEFycmF5PGFueT4+IHtcblxuICAgIHRyeSB7XG4gICAgICB2YXIgc3ltYm9sID0gYXdhaXQgdGhpcy5nZXRTeW1ib2xOYW1lQXRQb3NpdGlvbihwYXRoLCBjb250ZW50cywgbGluZU51bWJlciwgY29sdW1uKTtcbiAgICAgIHZhciBkZWZzID0gW107XG4gICAgICBpZiAoc3ltYm9sICYmIHN5bWJvbC5uYW1lKSB7XG4gICAgICAgIGRlZnMgPSBhd2FpdCB0aGlzLl9jbGllbnQuZ2V0SGFja0RlZmluaXRpb24oc3ltYm9sLm5hbWUsIHN5bWJvbC50eXBlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkZWZzO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgLy8gaWdub3JlIHRoZSBlcnJvclxuICAgICAgbG9nZ2VyLndhcm4oJ19nZXREZWZpbml0aW9uRnJvbUlkZW50aWZ5TWV0aG9kIGVycm9yOicsIGVycik7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgX2dldERlZmluaXRpb25Gcm9tU3RyaW5nUGFyc2UobGluZVRleHQ6IHN0cmluZywgY29sdW1uOiBudW1iZXIpOiBQcm9taXNlPEFycmF5PGFueT4+IHtcbiAgICB2YXIge3NlYXJjaCwgc3RhcnQsIGVuZH0gPSB0aGlzLl9wYXJzZVN0cmluZ0ZvckV4cHJlc3Npb24obGluZVRleHQsIGNvbHVtbik7XG4gICAgaWYgKCFzZWFyY2gpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgdmFyIGRlZnMgPSBbXTtcbiAgICB0cnkge1xuICAgICAgZGVmcyA9IGF3YWl0IHRoaXMuX2NsaWVudC5nZXRIYWNrRGVmaW5pdGlvbihzZWFyY2gsIFN5bWJvbFR5cGUuVU5LTk9XTik7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAvLyBpZ25vcmUgdGhlIGVycm9yXG4gICAgICBsb2dnZXIud2FybignX2dldERlZmluaXRpb25Gcm9tU3RyaW5nUGFyc2UgZXJyb3I6JywgZXJyKTtcbiAgICB9XG4gICAgcmV0dXJuIGRlZnMubWFwKGRlZmluaXRpb24gPT4ge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcGF0aDogZGVmaW5pdGlvbi5wYXRoLFxuICAgICAgICBsaW5lOiBkZWZpbml0aW9uLmxpbmUsXG4gICAgICAgIGNvbHVtbjogZGVmaW5pdGlvbi5jb2x1bW4sXG4gICAgICAgIHNlYXJjaFN0YXJ0Q29sdW1uOiBzdGFydCxcbiAgICAgICAgc2VhcmNoRW5kQ29sdW1uOiBlbmQsXG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgX3BhcnNlU3RyaW5nRm9yRXhwcmVzc2lvbihsaW5lVGV4dDogc3RyaW5nLCBjb2x1bW46IG51bWJlcik6IHN0cmluZyB7XG4gICAgdmFyIHNlYXJjaCA9IG51bGw7XG4gICAgdmFyIHN0YXJ0ID0gY29sdW1uO1xuXG4gICAgdmFyIGlzWEhQID0gZmFsc2U7XG4gICAgdmFyIHhocE1hdGNoO1xuICAgIHdoaWxlICAoeGhwTWF0Y2ggPSBYSFBfTElORV9URVhUX1JFR0VYLmV4ZWMobGluZVRleHQpKSB7XG4gICAgICB2YXIgeGhwTWF0Y2hJbmRleCA9IHhocE1hdGNoLmluZGV4ICsgMTtcbiAgICAgIGlmIChjb2x1bW4gPj0geGhwTWF0Y2hJbmRleCAmJiBjb2x1bW4gPCAoeGhwTWF0Y2hJbmRleCArIHhocE1hdGNoWzFdLmxlbmd0aCkpIHtcbiAgICAgICAgaXNYSFAgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgc3ludGF4Q2hhclJlZ2V4ID0gaXNYSFAgPyB4aHBDaGFyUmVnZXggOiB3b3JkQ2hhclJlZ2V4O1xuICAgIC8vIFNjYW4gZm9yIHRoZSB3b3JkIHN0YXJ0IGZvciB0aGUgaGFjayB2YXJpYWJsZSwgZnVuY3Rpb24gb3IgeGhwIHRhZ1xuICAgIC8vIHdlIGFyZSB0cnlpbmcgdG8gZ2V0IHRoZSBkZWZpbml0aW9uIGZvci5cbiAgICB3aGlsZSAoc3RhcnQgPj0gMCAmJiBzeW50YXhDaGFyUmVnZXgudGVzdChsaW5lVGV4dC5jaGFyQXQoc3RhcnQpKSkge1xuICAgICAgc3RhcnQtLTtcbiAgICB9XG4gICAgaWYgKGxpbmVUZXh0W3N0YXJ0XSA9PT0gJyQnKSB7XG4gICAgICBzdGFydC0tO1xuICAgIH1cbiAgICBzdGFydCsrO1xuICAgIHZhciBlbmQgPSBjb2x1bW47XG4gICAgd2hpbGUgKHN5bnRheENoYXJSZWdleC50ZXN0KGxpbmVUZXh0LmNoYXJBdChlbmQpKSkge1xuICAgICAgZW5kKys7XG4gICAgfVxuICAgIHNlYXJjaCA9IGxpbmVUZXh0LnN1YnN0cmluZyhzdGFydCwgZW5kKTtcbiAgICAvLyBYSFAgVUkgZWxlbWVudHMgc3RhcnQgd2l0aCA6IGJ1dCB0aGUgdXNhZ2VzIGRvZXNuJ3QgaGF2ZSB0aGF0IGNvbG9uLlxuICAgIGlmIChpc1hIUCAmJiAhc2VhcmNoLnN0YXJ0c1dpdGgoJzonKSkge1xuICAgICAgc2VhcmNoID0gJzonICsgc2VhcmNoO1xuICAgIH1cbiAgICByZXR1cm4ge3NlYXJjaCwgc3RhcnQsIGVuZH07XG4gIH1cblxuICBhc3luYyBnZXRUeXBlKHBhdGg6IHN0cmluZywgY29udGVudHM6IHN0cmluZywgZXhwcmVzc2lvbjogc3RyaW5nLCBsaW5lTnVtYmVyOiBudW1iZXIsIGNvbHVtbjogbnVtYmVyKTogP3N0cmluZyB7XG4gICAgaWYgKCFpc0hhY2tGaWxlKGNvbnRlbnRzKSB8fCAhZXhwcmVzc2lvbi5zdGFydHNXaXRoKCckJykpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLnVwZGF0ZUZpbGUocGF0aCwgY29udGVudHMpO1xuICAgIHZhciB3ZWJXb3JrZXJNZXNzYWdlID0ge2NtZDogJ2hoX2luZmVyX3R5cGUnLCBhcmdzOiBbcGF0aCwgbGluZU51bWJlciwgY29sdW1uXX07XG4gICAgdmFyIHt0eXBlfSA9IGF3YWl0IHRoaXMuX2hhY2tXb3JrZXIucnVuV29ya2VyVGFzayh3ZWJXb3JrZXJNZXNzYWdlKTtcbiAgICByZXR1cm4gdHlwZTtcbiAgfVxufTtcblxudmFyIHN0cmluZ1RvQ29tcGxldGlvblR5cGUgPSB7XG4gICdpZCc6IENvbXBsZXRpb25UeXBlLklELFxuICAnbmV3JzogQ29tcGxldGlvblR5cGUuTkVXLFxuICAndHlwZSc6IENvbXBsZXRpb25UeXBlLlRZUEUsXG4gICdjbGFzc19nZXQnOiBDb21wbGV0aW9uVHlwZS5DTEFTU19HRVQsXG4gICd2YXInOiBDb21wbGV0aW9uVHlwZS5WQVIsXG59O1xuXG5mdW5jdGlvbiBnZXRDb21wbGV0aW9uVHlwZShpbnB1dDogc3RyaW5nKSB7XG4gIHZhciBjb21wbGV0aW9uVHlwZSA9IHN0cmluZ1RvQ29tcGxldGlvblR5cGVbaW5wdXRdO1xuICBpZiAodHlwZW9mIGNvbXBsZXRpb25UeXBlID09PSAndW5kZWZpbmVkJykge1xuICAgIGNvbXBsZXRpb25UeXBlID0gQ29tcGxldGlvblR5cGUuTk9ORTtcbiAgfVxuICByZXR1cm4gY29tcGxldGlvblR5cGU7XG59XG5cbnZhciBzdHJpbmdUb1N5bWJvbFR5cGUgPSB7XG4gICdjbGFzcyc6IFN5bWJvbFR5cGUuQ0xBU1MsXG4gICdmdW5jdGlvbic6IFN5bWJvbFR5cGUuRlVOQ1RJT04sXG4gICdtZXRob2QnOiBTeW1ib2xUeXBlLk1FVEhPRCxcbiAgJ2xvY2FsJzogU3ltYm9sVHlwZS5MT0NBTCxcbn07XG5cbmZ1bmN0aW9uIGdldFN5bWJvbFR5cGUoaW5wdXQ6IHN0cmluZykge1xuICB2YXIgc3ltYm9sVHlwZSA9IHN0cmluZ1RvU3ltYm9sVHlwZVtpbnB1dF07XG4gIGlmICh0eXBlb2Ygc3ltYm9sVHlwZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBzeW1ib2xUeXBlID0gU3ltYm9sVHlwZS5NRVRIT0Q7XG4gIH1cbiAgcmV0dXJuIHN5bWJvbFR5cGU7XG59XG5cbmZ1bmN0aW9uIHBhcnNlRXJyb3JzRnJvbVJlc3BvbnNlKHJlc3BvbnNlOiBhbnkpOiBBcnJheTxhbnk+IHtcbiAgdmFyIGVycm9ycyA9IHJlc3BvbnNlLmVycm9ycy5tYXAoZXJyb3IgPT4ge1xuICAgIHZhciByb290Q2F1c2UgPSBudWxsO1xuICAgIHZhciBlcnJvclBhcnRzID0gZXJyb3IubWVzc2FnZTtcbiAgICByZXR1cm4gZXJyb3JQYXJ0cy5tYXAoZXJyb3JQYXJ0ID0+IHtcbiAgICAgIGlmICghcm9vdENhdXNlKSB7XG4gICAgICAgIHZhciB7c3RhcnQsIGVuZCwgbGluZSwgcGF0aH0gPSBlcnJvclBhcnQ7XG4gICAgICAgIHN0YXJ0LS07XG4gICAgICAgIGxpbmUtLTtcbiAgICAgICAgcm9vdENhdXNlID0ge1xuICAgICAgICAgIHJhbmdlOiBuZXcgUmFuZ2UoW2xpbmUsIHN0YXJ0XSwgW2xpbmUsIGVuZF0pLFxuICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgc3RhcnQsXG4gICAgICAgICAgbGluZSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdFcnJvcicsXG4gICAgICAgIHRleHQ6IGVycm9yUGFydC5kZXNjcixcbiAgICAgICAgZmlsZVBhdGg6IHJvb3RDYXVzZS5wYXRoLFxuICAgICAgICByYW5nZTogcm9vdENhdXNlLnJhbmdlLFxuICAgICAgfTtcbiAgICB9KTtcbiAgfSk7XG4gIC8vIGZsYXR0ZW4gdGhlIGFycmF5c1xuICByZXR1cm4gW10uY29uY2F0LmFwcGx5KFtdLCBlcnJvcnMpO1xufVxuXG52YXIgc2VydmVyQ29tcGxldGlvblR5cGVzID0gbmV3IFNldChbXG4gIENvbXBsZXRpb25UeXBlLklELFxuICBDb21wbGV0aW9uVHlwZS5ORVcsXG4gIENvbXBsZXRpb25UeXBlLlRZUEUsXG5dKTtcblxuZnVuY3Rpb24gc2hvdWxkRG9TZXJ2ZXJDb21wbGV0aW9uKHR5cGU6IENvbXBsZXRpb25UeXBlKTogYm9vbGVhbiB7XG4gIHJldHVybiBzZXJ2ZXJDb21wbGV0aW9uVHlwZXMuaGFzKHR5cGUpO1xufVxuXG5mdW5jdGlvbiBwcm9jZXNzQ29tcGxldGlvbnMoY29tcGxldGlvbnNSZXNwb25zZTogQXJyYXk8YW55Pik6IEFycmF5PGFueT4ge1xuICByZXR1cm4gY29tcGxldGlvbnNSZXNwb25zZS5tYXAoKGNvbXBsZXRpb24pID0+IHtcbiAgICB2YXIge25hbWUsIHR5cGUsIGZ1bmNfZGV0YWlsczogZnVuY3Rpb25EZXRhaWxzfSA9IGNvbXBsZXRpb247XG4gICAgaWYgKHR5cGUgJiYgdHlwZS5pbmRleE9mKCcoJykgPT09IDAgJiYgdHlwZS5sYXN0SW5kZXhPZignKScpID09PSB0eXBlLmxlbmd0aCAtIDEpIHtcbiAgICAgIHR5cGUgPSB0eXBlLnN1YnN0cmluZygxLCB0eXBlLmxlbmd0aCAtIDEpO1xuICAgIH1cbiAgICB2YXIgbWF0Y2hTbmlwcGV0ID0gbmFtZTtcbiAgICBpZiAoZnVuY3Rpb25EZXRhaWxzKSB7XG4gICAgICB2YXIge3BhcmFtc30gPSBmdW5jdGlvbkRldGFpbHM7XG4gICAgICAvLyBDb25zdHJ1Y3QgdGhlIHNuaXBwZXQ6IGUuZy4gbXlGdW5jdGlvbigkezE6JGFyZzF9LCAkezI6JGFyZzJ9KTtcbiAgICAgIHZhciBwYXJhbXNTdHJpbmcgPSBwYXJhbXMubWFwKChwYXJhbSwgaW5kZXgpID0+ICckeycgKyAoaW5kZXggKyAxKSArICc6JyArIHBhcmFtLm5hbWUgKyAnfScpLmpvaW4oJywgJyk7XG4gICAgICBtYXRjaFNuaXBwZXQgPSBuYW1lICsgJygnICsgcGFyYW1zU3RyaW5nICsgJyknO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgbWF0Y2hTbmlwcGV0LFxuICAgICAgbWF0Y2hUZXh0OiBuYW1lLFxuICAgICAgbWF0Y2hUeXBlOiB0eXBlLFxuICAgIH07XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBpc0hhY2tGaWxlKGNvbnRlbnRzOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIGNvbnRlbnRzICYmIGNvbnRlbnRzLnN0YXJ0c1dpdGgoJzw/aGgnKTtcbn1cbiJdfQ==