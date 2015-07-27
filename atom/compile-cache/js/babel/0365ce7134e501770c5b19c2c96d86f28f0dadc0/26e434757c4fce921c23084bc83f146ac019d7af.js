'use babel';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWhhY2svbGliL0hhY2tMYW5ndWFnZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2VBV0UsT0FBTyxDQUFDLE1BQU0sQ0FBQzs7SUFBeEIsS0FBSyxZQUFMLEtBQUs7O0FBQ1YsSUFBSSxVQUFVLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDOztnQkFDTixPQUFPLENBQUMsbUNBQW1DLENBQUM7O0lBQTFFLGNBQWMsYUFBZCxjQUFjO0lBQUUsVUFBVSxhQUFWLFVBQVU7O0FBQy9CLElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDOztBQUVwRCxJQUFJLGFBQWEsR0FBRyxRQUFRLENBQUM7O0FBRTdCLElBQUksWUFBWSxHQUFHLFFBQVEsQ0FBQztBQUM1QixJQUFJLG1CQUFtQixHQUFHLGtDQUFrQyxDQUFDOztBQUU3RCxJQUFNLCtCQUErQixHQUFHLEtBQUssQ0FBQzs7Ozs7OztBQU85QyxNQUFNLENBQUMsT0FBTztBQUVELFdBRlUsWUFBWSxDQUVyQixNQUFxQixFQUFFOzBCQUZkLFlBQVk7O0FBRy9CLFFBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxVQUFVLEVBQUUsQ0FBQztBQUNwQyxRQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztBQUN0QixRQUFJLENBQUMsZ0JBQWdCLEdBQUcsRUFBRSxDQUFDOztBQUUzQixRQUFJLENBQUMsZ0NBQWdDLEVBQUUsQ0FBQztHQUN6Qzs7ZUFSb0IsWUFBWTs7V0FVRCw0Q0FBRzs7Ozs7QUFHakMsVUFBSSx5QkFBeUIsR0FBRyxLQUFLLENBQUM7O0FBRXRDLFVBQUksd0JBQXdCLEdBQUcsU0FBM0Isd0JBQXdCLEdBQVM7QUFDbkMsaUNBQXlCLEdBQUcsS0FBSyxDQUFDO09BQ25DLENBQUM7O0FBRUYsVUFBSSxDQUFDLDJCQUEyQixHQUFHLFdBQVcsQ0FBQyxZQUFNO0FBQ25ELFlBQUkseUJBQXlCLEVBQUU7QUFDN0IsaUJBQU87U0FDUjtBQUNELGlDQUF5QixHQUFHLElBQUksQ0FBQztBQUNqQyxjQUFLLGtCQUFrQixFQUFFLENBQUMsSUFBSSxDQUFDLHdCQUF3QixFQUFFLHdCQUF3QixDQUFDLENBQUM7T0FDcEYsRUFBRSwrQkFBK0IsQ0FBQyxDQUFDO0tBQ3JDOzs7V0FFTSxtQkFBRztBQUNSLFVBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDM0IsbUJBQWEsQ0FBQyxJQUFJLENBQUMsMkJBQTJCLENBQUMsQ0FBQztLQUNqRDs7OzZCQUVtQixXQUFDLElBQVksRUFBRSxRQUFnQixFQUFFLE1BQWMsRUFBdUI7OztBQUd4RixVQUFJLGNBQWMsR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsR0FDOUMsU0FBUyxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM1RCxZQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0FBQzVDLFVBQUksZ0JBQWdCLEdBQUcsRUFBQyxHQUFHLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQztBQUMvRCxVQUFJLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDdEUsVUFBSSxjQUFjLEdBQUcsaUJBQWlCLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0FBQ2pFLFVBQUksV0FBVyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUM7QUFDdkMsVUFBSSx3QkFBd0IsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUU7QUFDbkUsbUJBQVcsR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsY0FBYyxDQUFDLENBQUM7T0FDckU7QUFDRCxhQUFPLGtCQUFrQixDQUFDLFdBQVcsQ0FBQyxDQUFDO0tBQ3hDOzs7NkJBRWUsV0FBQyxJQUFZLEVBQUUsUUFBZ0IsRUFBVztBQUN4RCxVQUFJLFFBQVEsS0FBSyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDNUMsWUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQztBQUN2QyxZQUFJLGdCQUFnQixHQUFHLEVBQUMsR0FBRyxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLEVBQUMsQ0FBQztBQUNwRSxlQUFPLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztPQUMvRDtLQUNGOzs7NkJBRXVCLGFBQVk7QUFDaEMsVUFBSSxnQkFBZ0IsR0FBRyxFQUFDLEdBQUcsRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBQyxDQUFDO0FBQ3RELFVBQUksUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUN0RSxVQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7QUFDekIsZUFBTztPQUNSO0FBQ0QsVUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDO0FBQ3RCLFVBQUk7QUFDRixvQkFBWSxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7T0FDdEUsQ0FBQyxPQUFPLEdBQUcsRUFBRTs7QUFFWixjQUFNLENBQUMsSUFBSSxDQUFDLDRCQUE0QixFQUFFLEdBQUcsQ0FBQyxDQUFDO09BQ2hEOztBQUVELFdBQUssSUFBSSxJQUFJLElBQUksWUFBWSxFQUFFO0FBQzdCLGNBQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztPQUN2RDtLQUNKOzs7NkJBRXFCLFdBQUMsSUFBWSxFQUFFLFFBQWdCLEVBQVc7QUFDOUQsVUFBSSxRQUFRLEtBQUssSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxFQUFFO0FBQzVDLFlBQUksZ0JBQWdCLEdBQUcsRUFBQyxHQUFHLEVBQUUsWUFBWSxFQUFFLElBQUksRUFBRSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsRUFBQyxDQUFDO0FBQ25FLGNBQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLEVBQUUsRUFBQyxZQUFZLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztPQUM5RTtLQUNGOzs7NkJBRWlCLFdBQUMsUUFBZ0IsRUFBRSxhQUFxQixFQUFFLFdBQW1CLEVBQUU7QUFDL0UsVUFBSSxnQkFBZ0IsR0FBRyxFQUFDLEdBQUcsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFLGFBQWEsRUFBRSxXQUFXLENBQUMsRUFBQyxDQUFDO0FBQ3hGLFVBQUksUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUN0RSxVQUFJLFlBQVksR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDO0FBQzFDLFVBQUksWUFBWSxFQUFFO0FBQ2hCLFlBQUksWUFBWSxLQUFLLGFBQWEsRUFBRTtBQUNsQyxnQkFBTSxJQUFJLEtBQUssQ0FBQyw4Q0FBOEMsQ0FBQyxDQUFDO1NBQ2pFLE1BQU0sSUFBSSxZQUFZLEtBQUssZUFBZSxFQUFFO0FBQzNDLGdCQUFNLElBQUksS0FBSyxDQUFDLCtEQUErRCxDQUFDLENBQUM7U0FDbEYsTUFBTTtBQUNMLGdCQUFNLElBQUksS0FBSyxDQUFDLDRCQUE0QixHQUFHLFlBQVksQ0FBQyxDQUFDO1NBQzlEO09BQ0YsTUFBTTtBQUNMLGVBQU8sUUFBUSxDQUFDLE1BQU0sQ0FBQztPQUN4QjtLQUNGOzs7NkJBRW1CLFdBQUMsSUFBWSxFQUFFLFFBQWdCLEVBQXVCO0FBQ3hFLFVBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUU7QUFDekIsZUFBTyxFQUFFLENBQUM7T0FDWDtBQUNELFlBQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDdEMsVUFBSSxnQkFBZ0IsR0FBRyxFQUFDLEdBQUcsRUFBRSxlQUFlLEVBQUUsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQztBQUM1RCxVQUFJLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDdEUsYUFBTyx1QkFBdUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztLQUMxQzs7OzZCQUV5QixhQUF3QjtBQUNoRCxVQUFJLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztBQUN2RCxhQUFPLHVCQUF1QixDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQzFDOzs7NkJBRWtCLFdBQ2YsSUFBWSxFQUNaLFFBQWdCLEVBQ2hCLFVBQWtCLEVBQ2xCLE1BQWMsRUFDZCxRQUFnQixFQUNLOztBQUV2QixVQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFFO0FBQ3pCLGVBQU8sSUFBSSxDQUFDO09BQ2I7O2lCQUdDLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQzs7QUFFaEIsVUFBSSxDQUFDLGdDQUFnQyxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLE1BQU0sQ0FBQzs7O0FBR3pFLFVBQUksQ0FBQyxnQ0FBZ0MsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxNQUFNLENBQUM7OztBQUd6RSxVQUFJLENBQUMsNkJBQTZCLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUNyRCxDQUFDOzs7O1VBVkMsaUJBQWlCO1VBQUUscUJBQXFCO1VBQUUsa0JBQWtCOzs7QUFZakUsVUFBSSxxQkFBcUIsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO0FBQ3RDLGVBQU8scUJBQXFCLENBQUM7T0FDOUIsTUFBTSxJQUFJLGtCQUFrQixDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7QUFDMUMsZUFBTyxrQkFBa0IsQ0FBQztPQUMzQixNQUFNLElBQUksaUJBQWlCLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtBQUN6QyxlQUFPLGlCQUFpQixDQUFDO09BQzFCLE1BQU0sSUFBSSxxQkFBcUIsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO0FBQzNDLGVBQU8scUJBQXFCLENBQUM7T0FDOUIsTUFBTSxJQUFJLGtCQUFrQixDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDeEMsZUFBTyxrQkFBa0IsQ0FBQztPQUMzQixNQUFNO0FBQ0wsZUFBTyxpQkFBaUIsQ0FBQztPQUMxQjtLQUNGOzs7NkJBRTRCLFdBQ3pCLElBQVksRUFDWixRQUFnQixFQUNoQixVQUFrQixFQUNsQixNQUFjLEVBQ0E7O0FBRWhCLFlBQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDdEMsVUFBSSxnQkFBZ0IsR0FBRyxFQUFDLEdBQUcsRUFBRSxvQkFBb0IsRUFBRSxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsVUFBVSxHQUFHLENBQUMsRUFBRSxNQUFNLEdBQUcsQ0FBQyxDQUFDLEVBQUMsQ0FBQztBQUM3RixVQUFJLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDdEUsVUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUU7QUFDbEIsZUFBTyxJQUFJLENBQUM7T0FDYjtBQUNELFVBQUksVUFBVSxHQUFHLGFBQWEsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDckQsVUFBSSxRQUFRLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQztBQUM1QixhQUFPO0FBQ0wsWUFBSSxFQUFFLFFBQVEsQ0FBQyxJQUFJO0FBQ25CLFlBQUksRUFBRSxVQUFVO0FBQ2hCLFlBQUksRUFBRSxRQUFRLENBQUMsSUFBSTtBQUNuQixjQUFNLEVBQUUsUUFBUSxDQUFDLFVBQVU7QUFDM0IsY0FBTSxFQUFFLFFBQVEsQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLFVBQVUsR0FBRyxDQUFDO09BQ3BELENBQUM7S0FDSDs7OzZCQUVxQyxXQUNsQyxJQUFZLEVBQ1osUUFBZ0IsRUFDaEIsVUFBa0IsRUFDbEIsTUFBYyxFQUNPOztBQUV2QixZQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ3RDLFVBQUksZ0JBQWdCLEdBQUcsRUFBQyxHQUFHLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUUsTUFBTSxDQUFDLEVBQUMsQ0FBQztBQUMvRSxVQUFJLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDdEUsVUFBSSxRQUFRLEdBQUcsUUFBUSxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUM7QUFDbEMsVUFBSSxRQUFRLENBQUMsUUFBUSxFQUFFO0FBQ3JCLGVBQU8sQ0FBQztBQUNOLGNBQUksRUFBRSxRQUFRLENBQUMsUUFBUTtBQUN2QixjQUFJLEVBQUUsUUFBUSxDQUFDLElBQUksR0FBRyxDQUFDO0FBQ3ZCLGdCQUFNLEVBQUUsUUFBUSxDQUFDLFVBQVUsR0FBRyxDQUFDO0FBQy9CLGdCQUFNLEVBQUUsUUFBUSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsVUFBVSxHQUFHLENBQUM7U0FDcEQsQ0FBQyxDQUFDO09BQ0osTUFBTTtBQUNMLGVBQU8sRUFBRSxDQUFDO09BQ1g7S0FDRjs7OzZCQUVxQyxXQUNsQyxJQUFZLEVBQ1osUUFBZ0IsRUFDaEIsVUFBa0IsRUFDbEIsTUFBYyxFQUNPOztBQUV2QixVQUFJO0FBQ0YsWUFBSSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDcEYsWUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBQ2QsWUFBSSxNQUFNLElBQUksTUFBTSxDQUFDLElBQUksRUFBRTtBQUN6QixjQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3ZFO0FBQ0QsZUFBTyxJQUFJLENBQUM7T0FDYixDQUFDLE9BQU8sR0FBRyxFQUFFOztBQUVaLGNBQU0sQ0FBQyxJQUFJLENBQUMseUNBQXlDLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDNUQsZUFBTyxFQUFFLENBQUM7T0FDWDtLQUNGOzs7NkJBRWtDLFdBQUMsUUFBZ0IsRUFBRSxNQUFjLEVBQXVCO3VDQUM5RCxJQUFJLENBQUMseUJBQXlCLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQzs7VUFBdEUsTUFBTSw4QkFBTixNQUFNO1VBQUUsS0FBSyw4QkFBTCxLQUFLO1VBQUUsR0FBRyw4QkFBSCxHQUFHOztBQUN2QixVQUFJLENBQUMsTUFBTSxFQUFFO0FBQ1gsZUFBTyxFQUFFLENBQUM7T0FDWDtBQUNELFVBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUNkLFVBQUk7QUFDRixZQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7T0FDekUsQ0FBQyxPQUFPLEdBQUcsRUFBRTs7QUFFWixjQUFNLENBQUMsSUFBSSxDQUFDLHNDQUFzQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO09BQzFEO0FBQ0QsYUFBTyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQUEsVUFBVSxFQUFJO0FBQzVCLGVBQU87QUFDTCxjQUFJLEVBQUUsVUFBVSxDQUFDLElBQUk7QUFDckIsY0FBSSxFQUFFLFVBQVUsQ0FBQyxJQUFJO0FBQ3JCLGdCQUFNLEVBQUUsVUFBVSxDQUFDLE1BQU07QUFDekIsMkJBQWlCLEVBQUUsS0FBSztBQUN4Qix5QkFBZSxFQUFFLEdBQUc7U0FDckIsQ0FBQztPQUNILENBQUMsQ0FBQztLQUNKOzs7V0FFd0IsbUNBQUMsUUFBZ0IsRUFBRSxNQUFjLEVBQVU7QUFDbEUsVUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDO0FBQ2xCLFVBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQzs7QUFFbkIsVUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDO0FBQ2xCLFVBQUksUUFBUSxDQUFDO0FBQ2IsYUFBUSxRQUFRLEdBQUcsbUJBQW1CLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO0FBQ3JELFlBQUksYUFBYSxHQUFHLFFBQVEsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZDLFlBQUksTUFBTSxJQUFJLGFBQWEsSUFBSSxNQUFNLEdBQUksYUFBYSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUc7QUFDNUUsZUFBSyxHQUFHLElBQUksQ0FBQztBQUNiLGdCQUFNO1NBQ1A7T0FDRjs7QUFFRCxVQUFJLGVBQWUsR0FBRyxLQUFLLEdBQUcsWUFBWSxHQUFHLGFBQWEsQ0FBQzs7O0FBRzNELGFBQU8sS0FBSyxJQUFJLENBQUMsSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtBQUNqRSxhQUFLLEVBQUUsQ0FBQztPQUNUO0FBQ0QsVUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxFQUFFO0FBQzNCLGFBQUssRUFBRSxDQUFDO09BQ1Q7QUFDRCxXQUFLLEVBQUUsQ0FBQztBQUNSLFVBQUksR0FBRyxHQUFHLE1BQU0sQ0FBQztBQUNqQixhQUFPLGVBQWUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFO0FBQ2pELFdBQUcsRUFBRSxDQUFDO09BQ1A7QUFDRCxZQUFNLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7O0FBRXhDLFVBQUksS0FBSyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRTtBQUNwQyxjQUFNLEdBQUcsR0FBRyxHQUFHLE1BQU0sQ0FBQztPQUN2QjtBQUNELGFBQU8sRUFBQyxNQUFNLEVBQU4sTUFBTSxFQUFFLEtBQUssRUFBTCxLQUFLLEVBQUUsR0FBRyxFQUFILEdBQUcsRUFBQyxDQUFDO0tBQzdCOzs7NkJBRVksV0FBQyxJQUFZLEVBQUUsUUFBZ0IsRUFBRSxVQUFrQixFQUFFLFVBQWtCLEVBQUUsTUFBYyxFQUFXO0FBQzdHLFVBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFO0FBQ3hELGVBQU8sSUFBSSxDQUFDO09BQ2I7QUFDRCxZQUFNLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ3RDLFVBQUksZ0JBQWdCLEdBQUcsRUFBQyxHQUFHLEVBQUUsZUFBZSxFQUFFLElBQUksRUFBRSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUUsTUFBTSxDQUFDLEVBQUMsQ0FBQzs7a0JBQ25FLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUM7O1VBQTlELElBQUksU0FBSixJQUFJOztBQUNULGFBQU8sSUFBSSxDQUFDO0tBQ2I7OztTQWpTb0IsWUFBWTtJQWtTbEMsQ0FBQzs7QUFFRixJQUFJLHNCQUFzQixHQUFHO0FBQzNCLE1BQUksRUFBRSxjQUFjLENBQUMsRUFBRTtBQUN2QixPQUFLLEVBQUUsY0FBYyxDQUFDLEdBQUc7QUFDekIsUUFBTSxFQUFFLGNBQWMsQ0FBQyxJQUFJO0FBQzNCLGFBQVcsRUFBRSxjQUFjLENBQUMsU0FBUztBQUNyQyxPQUFLLEVBQUUsY0FBYyxDQUFDLEdBQUc7Q0FDMUIsQ0FBQzs7QUFFRixTQUFTLGlCQUFpQixDQUFDLEtBQWEsRUFBRTtBQUN4QyxNQUFJLGNBQWMsR0FBRyxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNuRCxNQUFJLE9BQU8sY0FBYyxLQUFLLFdBQVcsRUFBRTtBQUN6QyxrQkFBYyxHQUFHLGNBQWMsQ0FBQyxJQUFJLENBQUM7R0FDdEM7QUFDRCxTQUFPLGNBQWMsQ0FBQztDQUN2Qjs7QUFFRCxJQUFJLGtCQUFrQixHQUFHO0FBQ3ZCLFNBQU8sRUFBRSxVQUFVLENBQUMsS0FBSztBQUN6QixZQUFVLEVBQUUsVUFBVSxDQUFDLFFBQVE7QUFDL0IsVUFBUSxFQUFFLFVBQVUsQ0FBQyxNQUFNO0FBQzNCLFNBQU8sRUFBRSxVQUFVLENBQUMsS0FBSztDQUMxQixDQUFDOztBQUVGLFNBQVMsYUFBYSxDQUFDLEtBQWEsRUFBRTtBQUNwQyxNQUFJLFVBQVUsR0FBRyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUMzQyxNQUFJLE9BQU8sVUFBVSxLQUFLLFdBQVcsRUFBRTtBQUNyQyxjQUFVLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQztHQUNoQztBQUNELFNBQU8sVUFBVSxDQUFDO0NBQ25COztBQUVELFNBQVMsdUJBQXVCLENBQUMsUUFBYSxFQUFjO0FBQzFELE1BQUksTUFBTSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQUEsS0FBSyxFQUFJO0FBQ3hDLFFBQUksU0FBUyxHQUFHLElBQUksQ0FBQztBQUNyQixRQUFJLFVBQVUsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDO0FBQy9CLFdBQU8sVUFBVSxDQUFDLEdBQUcsQ0FBQyxVQUFBLFNBQVMsRUFBSTtBQUNqQyxVQUFJLENBQUMsU0FBUyxFQUFFO1lBQ1QsS0FBSyxHQUFxQixTQUFTLENBQW5DLEtBQUs7WUFBRSxHQUFHLEdBQWdCLFNBQVMsQ0FBNUIsR0FBRztZQUFFLElBQUksR0FBVSxTQUFTLENBQXZCLElBQUk7WUFBRSxJQUFJLEdBQUksU0FBUyxDQUFqQixJQUFJOztBQUMzQixhQUFLLEVBQUUsQ0FBQztBQUNSLFlBQUksRUFBRSxDQUFDO0FBQ1AsaUJBQVMsR0FBRztBQUNWLGVBQUssRUFBRSxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztBQUM1QyxjQUFJLEVBQUosSUFBSTtBQUNKLGVBQUssRUFBTCxLQUFLO0FBQ0wsY0FBSSxFQUFKLElBQUk7U0FDTCxDQUFDO09BQ0g7QUFDRCxhQUFPO0FBQ0wsWUFBSSxFQUFFLE9BQU87QUFDYixZQUFJLEVBQUUsU0FBUyxDQUFDLEtBQUs7QUFDckIsZ0JBQVEsRUFBRSxTQUFTLENBQUMsSUFBSTtBQUN4QixhQUFLLEVBQUUsU0FBUyxDQUFDLEtBQUs7T0FDdkIsQ0FBQztLQUNILENBQUMsQ0FBQztHQUNKLENBQUMsQ0FBQzs7QUFFSCxTQUFPLEVBQUUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztDQUNwQzs7QUFFRCxJQUFJLHFCQUFxQixHQUFHLElBQUksR0FBRyxDQUFDLENBQ2xDLGNBQWMsQ0FBQyxFQUFFLEVBQ2pCLGNBQWMsQ0FBQyxHQUFHLEVBQ2xCLGNBQWMsQ0FBQyxJQUFJLENBQ3BCLENBQUMsQ0FBQzs7QUFFSCxTQUFTLHdCQUF3QixDQUFDLElBQW9CLEVBQVc7QUFDL0QsU0FBTyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7Q0FDeEM7O0FBRUQsU0FBUyxrQkFBa0IsQ0FBQyxtQkFBK0IsRUFBYztBQUN2RSxTQUFPLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxVQUFDLFVBQVUsRUFBSztRQUN4QyxJQUFJLEdBQXlDLFVBQVUsQ0FBdkQsSUFBSTtRQUFFLElBQUksR0FBbUMsVUFBVSxDQUFqRCxJQUFJO1FBQWdCLGVBQWUsR0FBSSxVQUFVLENBQTNDLFlBQVk7O0FBQzdCLFFBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEtBQUssSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDaEYsVUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7S0FDM0M7QUFDRCxRQUFJLFlBQVksR0FBRyxJQUFJLENBQUM7QUFDeEIsUUFBSSxlQUFlLEVBQUU7VUFDZCxNQUFNLEdBQUksZUFBZSxDQUF6QixNQUFNOzs7QUFFWCxVQUFJLFlBQVksR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQUMsS0FBSyxFQUFFLEtBQUs7ZUFBSyxJQUFJLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQSxHQUFJLEdBQUcsR0FBRyxLQUFLLENBQUMsSUFBSSxHQUFHLEdBQUc7T0FBQSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3hHLGtCQUFZLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxZQUFZLEdBQUcsR0FBRyxDQUFDO0tBQ2hEO0FBQ0QsV0FBTztBQUNMLGtCQUFZLEVBQVosWUFBWTtBQUNaLGVBQVMsRUFBRSxJQUFJO0FBQ2YsZUFBUyxFQUFFLElBQUk7S0FDaEIsQ0FBQztHQUNILENBQUMsQ0FBQztDQUNKOztBQUVELFNBQVMsVUFBVSxDQUFDLFFBQWdCLEVBQVc7QUFDN0MsU0FBTyxRQUFRLElBQUksUUFBUSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztDQUNoRCIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvbnVjbGlkZS1oYWNrL2xpYi9IYWNrTGFuZ3VhZ2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIge1JhbmdlfSA9IHJlcXVpcmUoJ2F0b20nKTtcbnZhciBIYWNrV29ya2VyID0gcmVxdWlyZSgnLi9IYWNrV29ya2VyJyk7XG52YXIge0NvbXBsZXRpb25UeXBlLCBTeW1ib2xUeXBlfSA9IHJlcXVpcmUoJ251Y2xpZGUtaGFjay1jb21tb24vbGliL2NvbnN0YW50cycpO1xudmFyIGxvZ2dlciA9IHJlcXVpcmUoJ251Y2xpZGUtbG9nZ2luZycpLmdldExvZ2dlcigpO1xuLy8gVGhlIHdvcmQgY2hhciByZWdleCBpbmNsdWRlIFxcIHRvIHNlYXJjaCBmb3IgbmFtZXNwYWNlZCBjbGFzc2VzLlxudmFyIHdvcmRDaGFyUmVnZXggPSAvW1xcd1xcXFxdLztcbi8vIFRoZSB4aHAgY2hhciByZWdleCBpbmNsdWRlIDogYW5kIC0gdG8gbWF0Y2ggeGhwIHRhZ3MgbGlrZSA8dWk6YnV0dG9uLWdyb3VwPi5cbnZhciB4aHBDaGFyUmVnZXggPSAvW1xcdzotXS87XG52YXIgWEhQX0xJTkVfVEVYVF9SRUdFWCA9IC88KFthLXpdW2EtejAtOV8uOi1dKilbXj5dKlxcLz8+L2dpO1xuXG5jb25zdCBVUERBVEVfREVQRU5ERU5DSUVTX0lOVEVSVkFMX01TID0gMTAwMDA7XG5cbi8qKlxuICogVGhlIEhhY2tMYW5ndWFnZSBpcyB0aGUgY29udHJvbGxlciB0aGF0IHNlcnZlcnMgbGFuZ3VhZ2UgcmVxdWVzdHMgYnkgdHJ5aW5nIHRvIGdldCB3b3JrZXIgcmVzdWx0c1xuICogYW5kL29yIHJlc3VsdHMgZnJvbSBIYWNrU2VydmljZSAod2hpY2ggd291bGQgYmUgZXhlY3V0aW5nIGhoX2NsaWVudCBvbiBhIHN1cHBvcnRpbmcgc2VydmVyKVxuICogYW5kIGNvbWJpbmluZyBhbmQvb3Igc2VsZWN0aW5nIHRoZSByZXN1bHRzIHRvIGdpdmUgYmFjayB0byB0aGUgcmVxdWVzdGVyLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIEhhY2tMYW5ndWFnZSB7XG5cbiAgY29uc3RydWN0b3IoY2xpZW50OiBOdWNsaWRlQ2xpZW50KSB7XG4gICAgdGhpcy5faGFja1dvcmtlciA9IG5ldyBIYWNrV29ya2VyKCk7XG4gICAgdGhpcy5fY2xpZW50ID0gY2xpZW50O1xuICAgIHRoaXMuX3BhdGhDb250ZW50c01hcCA9IHt9O1xuXG4gICAgdGhpcy5fc2V0dXBVcGRhdGVEZXBlbmRlbmNpZXNJbnRlcnZhbCgpO1xuICB9XG5cbiAgX3NldHVwVXBkYXRlRGVwZW5kZW5jaWVzSW50ZXJ2YWwoKSB7XG4gICAgLy8gRmV0Y2ggYW55IGRlcGVuZGVuY2llcyB0aGUgSGFja1dvcmtlciBuZWVkcyBhZnRlciBsZWFybmluZyBhYm91dCB0aGlzIGZpbGUuXG4gICAgLy8gV2UgZG9uJ3QgYmxvY2sgYW55IHJlYWx0aW1lIGxvZ2ljIG9uIHRoZSBkZXBlbmRlbmN5IGZldGNoaW5nIC0gaXQgY291bGQgdGFrZSBhIHdoaWxlLlxuICAgIHZhciBwZW5kaW5nVXBkYXRlRGVwZW5kZW5jaWVzID0gZmFsc2U7XG5cbiAgICB2YXIgZmluaXNoVXBkYXRlRGVwZW5kZW5jaWVzID0gKCkgPT4ge1xuICAgICAgcGVuZGluZ1VwZGF0ZURlcGVuZGVuY2llcyA9IGZhbHNlO1xuICAgIH07XG5cbiAgICB0aGlzLl91cGRhdGVEZXBlbmRlbmNpZXNJbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIGlmIChwZW5kaW5nVXBkYXRlRGVwZW5kZW5jaWVzKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHBlbmRpbmdVcGRhdGVEZXBlbmRlbmNpZXMgPSB0cnVlO1xuICAgICAgdGhpcy51cGRhdGVEZXBlbmRlbmNpZXMoKS50aGVuKGZpbmlzaFVwZGF0ZURlcGVuZGVuY2llcywgZmluaXNoVXBkYXRlRGVwZW5kZW5jaWVzKTtcbiAgICB9LCBVUERBVEVfREVQRU5ERU5DSUVTX0lOVEVSVkFMX01TKTtcbiAgfVxuXG4gIGRpc3Bvc2UoKSB7XG4gICAgdGhpcy5faGFja1dvcmtlci5kaXNwb3NlKCk7XG4gICAgY2xlYXJJbnRlcnZhbCh0aGlzLl91cGRhdGVEZXBlbmRlbmNpZXNJbnRlcnZhbCk7XG4gIH1cblxuICBhc3luYyBnZXRDb21wbGV0aW9ucyhwYXRoOiBzdHJpbmcsIGNvbnRlbnRzOiBzdHJpbmcsIG9mZnNldDogbnVtYmVyKTogUHJvbWlzZTxBcnJheTxhbnk+PiB7XG4gICAgLy8gQ2FsY3VsYXRlIHRoZSBvZmZzZXQgb2YgdGhlIGN1cnNvciBmcm9tIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGZpbGUuXG4gICAgLy8gVGhlbiBpbnNlcnQgQVVUTzMzMiBpbiBhdCB0aGlzIG9mZnNldC4gKEhhY2sgdXNlcyB0aGlzIGFzIGEgbWFya2VyLilcbiAgICB2YXIgbWFya2VkQ29udGVudHMgPSBjb250ZW50cy5zdWJzdHJpbmcoMCwgb2Zmc2V0KSArXG4gICAgICAgICdBVVRPMzMyJyArIGNvbnRlbnRzLnN1YnN0cmluZyhvZmZzZXQsIGNvbnRlbnRzLmxlbmd0aCk7XG4gICAgYXdhaXQgdGhpcy51cGRhdGVGaWxlKHBhdGgsIG1hcmtlZENvbnRlbnRzKTtcbiAgICB2YXIgd2ViV29ya2VyTWVzc2FnZSA9IHtjbWQ6ICdoaF9hdXRvX2NvbXBsZXRlJywgYXJnczogW3BhdGhdfTtcbiAgICB2YXIgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLl9oYWNrV29ya2VyLnJ1bldvcmtlclRhc2sod2ViV29ya2VyTWVzc2FnZSk7XG4gICAgdmFyIGNvbXBsZXRpb25UeXBlID0gZ2V0Q29tcGxldGlvblR5cGUocmVzcG9uc2UuY29tcGxldGlvbl90eXBlKTtcbiAgICB2YXIgY29tcGxldGlvbnMgPSByZXNwb25zZS5jb21wbGV0aW9ucztcbiAgICBpZiAoc2hvdWxkRG9TZXJ2ZXJDb21wbGV0aW9uKGNvbXBsZXRpb25UeXBlKSB8fCAhY29tcGxldGlvbnMubGVuZ3RoKSB7XG4gICAgICBjb21wbGV0aW9ucyA9IGF3YWl0IHRoaXMuX2NsaWVudC5nZXRIYWNrQ29tcGxldGlvbnMobWFya2VkQ29udGVudHMpO1xuICAgIH1cbiAgICByZXR1cm4gcHJvY2Vzc0NvbXBsZXRpb25zKGNvbXBsZXRpb25zKTtcbiAgfVxuXG4gIGFzeW5jIHVwZGF0ZUZpbGUocGF0aDogc3RyaW5nLCBjb250ZW50czogc3RyaW5nKTogUHJvbWlzZSB7XG4gICAgaWYgKGNvbnRlbnRzICE9PSB0aGlzLl9wYXRoQ29udGVudHNNYXBbcGF0aF0pIHtcbiAgICAgIHRoaXMuX3BhdGhDb250ZW50c01hcFtwYXRoXSA9IGNvbnRlbnRzO1xuICAgICAgdmFyIHdlYldvcmtlck1lc3NhZ2UgPSB7Y21kOiAnaGhfYWRkX2ZpbGUnLCBhcmdzOiBbcGF0aCwgY29udGVudHNdfTtcbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLl9oYWNrV29ya2VyLnJ1bldvcmtlclRhc2sod2ViV29ya2VyTWVzc2FnZSk7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgdXBkYXRlRGVwZW5kZW5jaWVzKCk6IFByb21pc2Uge1xuICAgICAgdmFyIHdlYldvcmtlck1lc3NhZ2UgPSB7Y21kOiAnaGhfZ2V0X2RlcHMnLCBhcmdzOiBbXX07XG4gICAgICB2YXIgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLl9oYWNrV29ya2VyLnJ1bldvcmtlclRhc2sod2ViV29ya2VyTWVzc2FnZSk7XG4gICAgICBpZiAoIXJlc3BvbnNlLmRlcHMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciBkZXBlbmRlbmNpZXMgPSB7fTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGRlcGVuZGVuY2llcyA9IGF3YWl0IHRoaXMuX2NsaWVudC5nZXRIYWNrRGVwZW5kZW5jaWVzKHJlc3BvbnNlLmRlcHMpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIC8vIElnbm9yZSB0aGUgZXJyb3IsIGl0J3MganVzdCBkZXBlbmRlbmN5IGZldGNoaW5nLlxuICAgICAgICBsb2dnZXIud2FybignZ2V0SGFja0RlcGVuZGVuY2llcyBlcnJvcjonLCBlcnIpO1xuICAgICAgfVxuICAgICAgLy8gU2VyaWFsbHkgdXBkYXRlIGRlcGVkbmVjaWVzIG5vdCB0byBibG9jayB0aGUgd29ya2VyIGZyb20gc2VydmluZyBvdGhlciBmZWF0dXJlIHJlcXVlc3RzLlxuICAgICAgZm9yICh2YXIgcGF0aCBpbiBkZXBlbmRlbmNpZXMpIHtcbiAgICAgICAgYXdhaXQgdGhpcy51cGRhdGVEZXBlbmRlbmN5KHBhdGgsIGRlcGVuZGVuY2llc1twYXRoXSk7XG4gICAgICB9XG4gIH1cblxuICBhc3luYyB1cGRhdGVEZXBlbmRlbmN5KHBhdGg6IHN0cmluZywgY29udGVudHM6IHN0cmluZyk6IFByb21pc2Uge1xuICAgIGlmIChjb250ZW50cyAhPT0gdGhpcy5fcGF0aENvbnRlbnRzTWFwW3BhdGhdKSB7XG4gICAgICB2YXIgd2ViV29ya2VyTWVzc2FnZSA9IHtjbWQ6ICdoaF9hZGRfZGVwJywgYXJnczogW3BhdGgsIGNvbnRlbnRzXX07XG4gICAgICBhd2FpdCB0aGlzLl9oYWNrV29ya2VyLnJ1bldvcmtlclRhc2sod2ViV29ya2VyTWVzc2FnZSwge2lzRGVwZW5kZW5jeTogdHJ1ZX0pO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGZvcm1hdFNvdXJjZShjb250ZW50czogc3RyaW5nLCBzdGFydFBvc2l0aW9uOiBudW1iZXIsIGVuZFBvc2l0aW9uOiBudW1iZXIpIHtcbiAgICB2YXIgd2ViV29ya2VyTWVzc2FnZSA9IHtjbWQ6ICdoaF9mb3JtYXQnLCBhcmdzOiBbY29udGVudHMsIHN0YXJ0UG9zaXRpb24sIGVuZFBvc2l0aW9uXX07XG4gICAgdmFyIHJlc3BvbnNlID0gYXdhaXQgdGhpcy5faGFja1dvcmtlci5ydW5Xb3JrZXJUYXNrKHdlYldvcmtlck1lc3NhZ2UpO1xuICAgIHZhciBlcnJvck1lc3NhZ2UgPSByZXNwb25zZS5lcnJvcl9tZXNzYWdlO1xuICAgIGlmIChlcnJvck1lc3NhZ2UpIHtcbiAgICAgIGlmIChlcnJvck1lc3NhZ2UgPT09ICdQaHBfb3JfZGVjbCcpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTb3JyeSwgUEhQIGFuZCA8P2hoIC8vZGVjbCBhcmUgbm90IHN1cHBvcnRlZCcpO1xuICAgICAgfSBlbHNlIGlmIChlcnJvck1lc3NhZ2UgPT09ICdQYXJzaW5nX2Vycm9yJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BhcnNpbmcgRXJyb3IhIEZpeCB5b3VyIGZpbGUgc28gdGhlIHN5bnRheCBpcyB2YWxpZCBhbmQgcmV0cnknKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignZmFpbGVkIGZvcm1hdGluZyBoYWNrIGNvZGUnICsgZXJyb3JNZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHJlc3BvbnNlLnJlc3VsdDtcbiAgICB9XG4gIH1cblxuICBhc3luYyBnZXREaWFnbm9zdGljcyhwYXRoOiBzdHJpbmcsIGNvbnRlbnRzOiBzdHJpbmcpOiBQcm9taXNlPEFycmF5PGFueT4+IHtcbiAgICBpZiAoIWlzSGFja0ZpbGUoY29udGVudHMpKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIGF3YWl0IHRoaXMudXBkYXRlRmlsZShwYXRoLCBjb250ZW50cyk7XG4gICAgdmFyIHdlYldvcmtlck1lc3NhZ2UgPSB7Y21kOiAnaGhfY2hlY2tfZmlsZScsIGFyZ3M6IFtwYXRoXX07XG4gICAgdmFyIHJlc3BvbnNlID0gYXdhaXQgdGhpcy5faGFja1dvcmtlci5ydW5Xb3JrZXJUYXNrKHdlYldvcmtlck1lc3NhZ2UpO1xuICAgIHJldHVybiBwYXJzZUVycm9yc0Zyb21SZXNwb25zZShyZXNwb25zZSk7XG4gIH1cblxuICBhc3luYyBnZXRTZXJ2ZXJEaWFnbm9zdGljcygpOiBQcm9taXNlPEFycmF5PGFueT4+IHtcbiAgICB2YXIgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLl9jbGllbnQuZ2V0SGFja0RpYWdub3N0aWNzKCk7XG4gICAgcmV0dXJuIHBhcnNlRXJyb3JzRnJvbVJlc3BvbnNlKHJlc3BvbnNlKTtcbiAgfVxuXG4gIGFzeW5jIGdldERlZmluaXRpb24oXG4gICAgICBwYXRoOiBzdHJpbmcsXG4gICAgICBjb250ZW50czogc3RyaW5nLFxuICAgICAgbGluZU51bWJlcjogbnVtYmVyLFxuICAgICAgY29sdW1uOiBudW1iZXIsXG4gICAgICBsaW5lVGV4dDogc3RyaW5nXG4gICAgKTogUHJvbWlzZTxBcnJheTxhbnk+PiB7XG5cbiAgICBpZiAoIWlzSGFja0ZpbGUoY29udGVudHMpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgW2NsaWVudFNpZGVSZXN1bHRzLCBpZGVudGlmeU1ldGhvZFJlc3VsdHMsIHN0cmluZ1BhcnNlUmVzdWx0c10gPVxuICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgICAvLyBGaXJzdCBTdGFnZS4gQXNrIEhhY2sgY2xpZW50c2lkZSBmb3IgYSByZXN1bHQgbG9jYXRpb24uXG4gICAgICAgIHRoaXMuX2dldERlZmluaXRpb25Mb2NhdGlvbkF0UG9zaXRpb24ocGF0aCwgY29udGVudHMsIGxpbmVOdW1iZXIsIGNvbHVtbiksXG4gICAgICAgIC8vIFNlY29uZCBzdGFnZS4gQXNrIEhhY2sgY2xpZW50c2lkZSBmb3IgdGhlIG5hbWUgb2YgdGhlIHN5bWJvbCB3ZSdyZSBvbi4gSWYgd2UgZ2V0IGEgbmFtZSxcbiAgICAgICAgLy8gYXNrIHRoZSBzZXJ2ZXIgZm9yIHRoZSBsb2NhdGlvbiBvZiB0aGlzIG5hbWVcbiAgICAgICAgdGhpcy5fZ2V0RGVmaW5pdGlvbkZyb21JZGVudGlmeU1ldGhvZChwYXRoLCBjb250ZW50cywgbGluZU51bWJlciwgY29sdW1uKSxcbiAgICAgICAgLy8gVGhpcmQgc3RhZ2UsIGRvIHNpbXBsZSBzdHJpbmcgcGFyc2luZyBvZiB0aGUgZmlsZSB0byBnZXQgYSBzdHJpbmcgdG8gc2VhcmNoIHRoZSBzZXJ2ZXIgZm9yLlxuICAgICAgICAvLyBUaGVuIGFzayB0aGUgc2VydmVyIGZvciB0aGUgbG9jYXRpb24gb2YgdGhhdCBzdHJpbmcuXG4gICAgICAgIHRoaXMuX2dldERlZmluaXRpb25Gcm9tU3RyaW5nUGFyc2UobGluZVRleHQsIGNvbHVtbiksXG4gICAgICBdKTtcbiAgICAvLyBXZSBub3cgaGF2ZSByZXN1bHRzIGZyb20gYWxsIDMgc291cmNlcy4gQ2hvc2UgdGhlIGJlc3QgcmVzdWx0cyB0byBzaG93IHRvIHRoZSB1c2VyLlxuICAgIGlmIChpZGVudGlmeU1ldGhvZFJlc3VsdHMubGVuZ3RoID09PSAxKSB7XG4gICAgICByZXR1cm4gaWRlbnRpZnlNZXRob2RSZXN1bHRzO1xuICAgIH0gZWxzZSBpZiAoc3RyaW5nUGFyc2VSZXN1bHRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgcmV0dXJuIHN0cmluZ1BhcnNlUmVzdWx0cztcbiAgICB9IGVsc2UgaWYgKGNsaWVudFNpZGVSZXN1bHRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgcmV0dXJuIGNsaWVudFNpZGVSZXN1bHRzO1xuICAgIH0gZWxzZSBpZiAoaWRlbnRpZnlNZXRob2RSZXN1bHRzLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybiBpZGVudGlmeU1ldGhvZFJlc3VsdHM7XG4gICAgfSBlbHNlIGlmIChzdHJpbmdQYXJzZVJlc3VsdHMubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuIHN0cmluZ1BhcnNlUmVzdWx0cztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGNsaWVudFNpZGVSZXN1bHRzO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGdldFN5bWJvbE5hbWVBdFBvc2l0aW9uKFxuICAgICAgcGF0aDogc3RyaW5nLFxuICAgICAgY29udGVudHM6IHN0cmluZyxcbiAgICAgIGxpbmVOdW1iZXI6IG51bWJlcixcbiAgICAgIGNvbHVtbjogbnVtYmVyXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcblxuICAgIGF3YWl0IHRoaXMudXBkYXRlRmlsZShwYXRoLCBjb250ZW50cyk7XG4gICAgdmFyIHdlYldvcmtlck1lc3NhZ2UgPSB7Y21kOiAnaGhfZ2V0X21ldGhvZF9uYW1lJywgYXJnczogW3BhdGgsIGxpbmVOdW1iZXIgLSAxLCBjb2x1bW4gLSAxXX07XG4gICAgdmFyIHJlc3BvbnNlID0gYXdhaXQgdGhpcy5faGFja1dvcmtlci5ydW5Xb3JrZXJUYXNrKHdlYldvcmtlck1lc3NhZ2UpO1xuICAgIGlmICghcmVzcG9uc2UubmFtZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHZhciBzeW1ib2xUeXBlID0gZ2V0U3ltYm9sVHlwZShyZXNwb25zZS5yZXN1bHRfdHlwZSk7XG4gICAgdmFyIHBvc2l0aW9uID0gcmVzcG9uc2UucG9zO1xuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiByZXNwb25zZS5uYW1lLFxuICAgICAgdHlwZTogc3ltYm9sVHlwZSxcbiAgICAgIGxpbmU6IHBvc2l0aW9uLmxpbmUsXG4gICAgICBjb2x1bW46IHBvc2l0aW9uLmNoYXJfc3RhcnQsXG4gICAgICBsZW5ndGg6IHBvc2l0aW9uLmNoYXJfZW5kIC0gcG9zaXRpb24uY2hhcl9zdGFydCArIDEsXG4gICAgfTtcbiAgfVxuXG4gIGFzeW5jIF9nZXREZWZpbml0aW9uTG9jYXRpb25BdFBvc2l0aW9uKFxuICAgICAgcGF0aDogc3RyaW5nLFxuICAgICAgY29udGVudHM6IHN0cmluZyxcbiAgICAgIGxpbmVOdW1iZXI6IG51bWJlcixcbiAgICAgIGNvbHVtbjogbnVtYmVyXG4gICAgKTogUHJvbWlzZTxBcnJheTxhbnk+PiB7XG5cbiAgICBhd2FpdCB0aGlzLnVwZGF0ZUZpbGUocGF0aCwgY29udGVudHMpO1xuICAgIHZhciB3ZWJXb3JrZXJNZXNzYWdlID0ge2NtZDogJ2hoX2luZmVyX3BvcycsIGFyZ3M6IFtwYXRoLCBsaW5lTnVtYmVyLCBjb2x1bW5dfTtcbiAgICB2YXIgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLl9oYWNrV29ya2VyLnJ1bldvcmtlclRhc2sod2ViV29ya2VyTWVzc2FnZSk7XG4gICAgdmFyIHBvc2l0aW9uID0gcmVzcG9uc2UucG9zIHx8IHt9O1xuICAgIGlmIChwb3NpdGlvbi5maWxlbmFtZSkge1xuICAgICAgcmV0dXJuIFt7XG4gICAgICAgIHBhdGg6IHBvc2l0aW9uLmZpbGVuYW1lLFxuICAgICAgICBsaW5lOiBwb3NpdGlvbi5saW5lIC0gMSxcbiAgICAgICAgY29sdW1uOiBwb3NpdGlvbi5jaGFyX3N0YXJ0IC0gMSxcbiAgICAgICAgbGVuZ3RoOiBwb3NpdGlvbi5jaGFyX2VuZCAtIHBvc2l0aW9uLmNoYXJfc3RhcnQgKyAxLFxuICAgICAgfV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBfZ2V0RGVmaW5pdGlvbkZyb21JZGVudGlmeU1ldGhvZChcbiAgICAgIHBhdGg6IHN0cmluZyxcbiAgICAgIGNvbnRlbnRzOiBzdHJpbmcsXG4gICAgICBsaW5lTnVtYmVyOiBudW1iZXIsXG4gICAgICBjb2x1bW46IG51bWJlclxuICAgICk6IFByb21pc2U8QXJyYXk8YW55Pj4ge1xuXG4gICAgdHJ5IHtcbiAgICAgIHZhciBzeW1ib2wgPSBhd2FpdCB0aGlzLmdldFN5bWJvbE5hbWVBdFBvc2l0aW9uKHBhdGgsIGNvbnRlbnRzLCBsaW5lTnVtYmVyLCBjb2x1bW4pO1xuICAgICAgdmFyIGRlZnMgPSBbXTtcbiAgICAgIGlmIChzeW1ib2wgJiYgc3ltYm9sLm5hbWUpIHtcbiAgICAgICAgZGVmcyA9IGF3YWl0IHRoaXMuX2NsaWVudC5nZXRIYWNrRGVmaW5pdGlvbihzeW1ib2wubmFtZSwgc3ltYm9sLnR5cGUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRlZnM7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAvLyBpZ25vcmUgdGhlIGVycm9yXG4gICAgICBsb2dnZXIud2FybignX2dldERlZmluaXRpb25Gcm9tSWRlbnRpZnlNZXRob2QgZXJyb3I6JywgZXJyKTtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBfZ2V0RGVmaW5pdGlvbkZyb21TdHJpbmdQYXJzZShsaW5lVGV4dDogc3RyaW5nLCBjb2x1bW46IG51bWJlcik6IFByb21pc2U8QXJyYXk8YW55Pj4ge1xuICAgIHZhciB7c2VhcmNoLCBzdGFydCwgZW5kfSA9IHRoaXMuX3BhcnNlU3RyaW5nRm9yRXhwcmVzc2lvbihsaW5lVGV4dCwgY29sdW1uKTtcbiAgICBpZiAoIXNlYXJjaCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICB2YXIgZGVmcyA9IFtdO1xuICAgIHRyeSB7XG4gICAgICBkZWZzID0gYXdhaXQgdGhpcy5fY2xpZW50LmdldEhhY2tEZWZpbml0aW9uKHNlYXJjaCwgU3ltYm9sVHlwZS5VTktOT1dOKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIC8vIGlnbm9yZSB0aGUgZXJyb3JcbiAgICAgIGxvZ2dlci53YXJuKCdfZ2V0RGVmaW5pdGlvbkZyb21TdHJpbmdQYXJzZSBlcnJvcjonLCBlcnIpO1xuICAgIH1cbiAgICByZXR1cm4gZGVmcy5tYXAoZGVmaW5pdGlvbiA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBwYXRoOiBkZWZpbml0aW9uLnBhdGgsXG4gICAgICAgIGxpbmU6IGRlZmluaXRpb24ubGluZSxcbiAgICAgICAgY29sdW1uOiBkZWZpbml0aW9uLmNvbHVtbixcbiAgICAgICAgc2VhcmNoU3RhcnRDb2x1bW46IHN0YXJ0LFxuICAgICAgICBzZWFyY2hFbmRDb2x1bW46IGVuZCxcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBfcGFyc2VTdHJpbmdGb3JFeHByZXNzaW9uKGxpbmVUZXh0OiBzdHJpbmcsIGNvbHVtbjogbnVtYmVyKTogc3RyaW5nIHtcbiAgICB2YXIgc2VhcmNoID0gbnVsbDtcbiAgICB2YXIgc3RhcnQgPSBjb2x1bW47XG5cbiAgICB2YXIgaXNYSFAgPSBmYWxzZTtcbiAgICB2YXIgeGhwTWF0Y2g7XG4gICAgd2hpbGUgICh4aHBNYXRjaCA9IFhIUF9MSU5FX1RFWFRfUkVHRVguZXhlYyhsaW5lVGV4dCkpIHtcbiAgICAgIHZhciB4aHBNYXRjaEluZGV4ID0geGhwTWF0Y2guaW5kZXggKyAxO1xuICAgICAgaWYgKGNvbHVtbiA+PSB4aHBNYXRjaEluZGV4ICYmIGNvbHVtbiA8ICh4aHBNYXRjaEluZGV4ICsgeGhwTWF0Y2hbMV0ubGVuZ3RoKSkge1xuICAgICAgICBpc1hIUCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBzeW50YXhDaGFyUmVnZXggPSBpc1hIUCA/IHhocENoYXJSZWdleCA6IHdvcmRDaGFyUmVnZXg7XG4gICAgLy8gU2NhbiBmb3IgdGhlIHdvcmQgc3RhcnQgZm9yIHRoZSBoYWNrIHZhcmlhYmxlLCBmdW5jdGlvbiBvciB4aHAgdGFnXG4gICAgLy8gd2UgYXJlIHRyeWluZyB0byBnZXQgdGhlIGRlZmluaXRpb24gZm9yLlxuICAgIHdoaWxlIChzdGFydCA+PSAwICYmIHN5bnRheENoYXJSZWdleC50ZXN0KGxpbmVUZXh0LmNoYXJBdChzdGFydCkpKSB7XG4gICAgICBzdGFydC0tO1xuICAgIH1cbiAgICBpZiAobGluZVRleHRbc3RhcnRdID09PSAnJCcpIHtcbiAgICAgIHN0YXJ0LS07XG4gICAgfVxuICAgIHN0YXJ0Kys7XG4gICAgdmFyIGVuZCA9IGNvbHVtbjtcbiAgICB3aGlsZSAoc3ludGF4Q2hhclJlZ2V4LnRlc3QobGluZVRleHQuY2hhckF0KGVuZCkpKSB7XG4gICAgICBlbmQrKztcbiAgICB9XG4gICAgc2VhcmNoID0gbGluZVRleHQuc3Vic3RyaW5nKHN0YXJ0LCBlbmQpO1xuICAgIC8vIFhIUCBVSSBlbGVtZW50cyBzdGFydCB3aXRoIDogYnV0IHRoZSB1c2FnZXMgZG9lc24ndCBoYXZlIHRoYXQgY29sb24uXG4gICAgaWYgKGlzWEhQICYmICFzZWFyY2guc3RhcnRzV2l0aCgnOicpKSB7XG4gICAgICBzZWFyY2ggPSAnOicgKyBzZWFyY2g7XG4gICAgfVxuICAgIHJldHVybiB7c2VhcmNoLCBzdGFydCwgZW5kfTtcbiAgfVxuXG4gIGFzeW5jIGdldFR5cGUocGF0aDogc3RyaW5nLCBjb250ZW50czogc3RyaW5nLCBleHByZXNzaW9uOiBzdHJpbmcsIGxpbmVOdW1iZXI6IG51bWJlciwgY29sdW1uOiBudW1iZXIpOiA/c3RyaW5nIHtcbiAgICBpZiAoIWlzSGFja0ZpbGUoY29udGVudHMpIHx8ICFleHByZXNzaW9uLnN0YXJ0c1dpdGgoJyQnKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMudXBkYXRlRmlsZShwYXRoLCBjb250ZW50cyk7XG4gICAgdmFyIHdlYldvcmtlck1lc3NhZ2UgPSB7Y21kOiAnaGhfaW5mZXJfdHlwZScsIGFyZ3M6IFtwYXRoLCBsaW5lTnVtYmVyLCBjb2x1bW5dfTtcbiAgICB2YXIge3R5cGV9ID0gYXdhaXQgdGhpcy5faGFja1dvcmtlci5ydW5Xb3JrZXJUYXNrKHdlYldvcmtlck1lc3NhZ2UpO1xuICAgIHJldHVybiB0eXBlO1xuICB9XG59O1xuXG52YXIgc3RyaW5nVG9Db21wbGV0aW9uVHlwZSA9IHtcbiAgJ2lkJzogQ29tcGxldGlvblR5cGUuSUQsXG4gICduZXcnOiBDb21wbGV0aW9uVHlwZS5ORVcsXG4gICd0eXBlJzogQ29tcGxldGlvblR5cGUuVFlQRSxcbiAgJ2NsYXNzX2dldCc6IENvbXBsZXRpb25UeXBlLkNMQVNTX0dFVCxcbiAgJ3Zhcic6IENvbXBsZXRpb25UeXBlLlZBUixcbn07XG5cbmZ1bmN0aW9uIGdldENvbXBsZXRpb25UeXBlKGlucHV0OiBzdHJpbmcpIHtcbiAgdmFyIGNvbXBsZXRpb25UeXBlID0gc3RyaW5nVG9Db21wbGV0aW9uVHlwZVtpbnB1dF07XG4gIGlmICh0eXBlb2YgY29tcGxldGlvblR5cGUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgY29tcGxldGlvblR5cGUgPSBDb21wbGV0aW9uVHlwZS5OT05FO1xuICB9XG4gIHJldHVybiBjb21wbGV0aW9uVHlwZTtcbn1cblxudmFyIHN0cmluZ1RvU3ltYm9sVHlwZSA9IHtcbiAgJ2NsYXNzJzogU3ltYm9sVHlwZS5DTEFTUyxcbiAgJ2Z1bmN0aW9uJzogU3ltYm9sVHlwZS5GVU5DVElPTixcbiAgJ21ldGhvZCc6IFN5bWJvbFR5cGUuTUVUSE9ELFxuICAnbG9jYWwnOiBTeW1ib2xUeXBlLkxPQ0FMLFxufTtcblxuZnVuY3Rpb24gZ2V0U3ltYm9sVHlwZShpbnB1dDogc3RyaW5nKSB7XG4gIHZhciBzeW1ib2xUeXBlID0gc3RyaW5nVG9TeW1ib2xUeXBlW2lucHV0XTtcbiAgaWYgKHR5cGVvZiBzeW1ib2xUeXBlID09PSAndW5kZWZpbmVkJykge1xuICAgIHN5bWJvbFR5cGUgPSBTeW1ib2xUeXBlLk1FVEhPRDtcbiAgfVxuICByZXR1cm4gc3ltYm9sVHlwZTtcbn1cblxuZnVuY3Rpb24gcGFyc2VFcnJvcnNGcm9tUmVzcG9uc2UocmVzcG9uc2U6IGFueSk6IEFycmF5PGFueT4ge1xuICB2YXIgZXJyb3JzID0gcmVzcG9uc2UuZXJyb3JzLm1hcChlcnJvciA9PiB7XG4gICAgdmFyIHJvb3RDYXVzZSA9IG51bGw7XG4gICAgdmFyIGVycm9yUGFydHMgPSBlcnJvci5tZXNzYWdlO1xuICAgIHJldHVybiBlcnJvclBhcnRzLm1hcChlcnJvclBhcnQgPT4ge1xuICAgICAgaWYgKCFyb290Q2F1c2UpIHtcbiAgICAgICAgdmFyIHtzdGFydCwgZW5kLCBsaW5lLCBwYXRofSA9IGVycm9yUGFydDtcbiAgICAgICAgc3RhcnQtLTtcbiAgICAgICAgbGluZS0tO1xuICAgICAgICByb290Q2F1c2UgPSB7XG4gICAgICAgICAgcmFuZ2U6IG5ldyBSYW5nZShbbGluZSwgc3RhcnRdLCBbbGluZSwgZW5kXSksXG4gICAgICAgICAgcGF0aCxcbiAgICAgICAgICBzdGFydCxcbiAgICAgICAgICBsaW5lLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ0Vycm9yJyxcbiAgICAgICAgdGV4dDogZXJyb3JQYXJ0LmRlc2NyLFxuICAgICAgICBmaWxlUGF0aDogcm9vdENhdXNlLnBhdGgsXG4gICAgICAgIHJhbmdlOiByb290Q2F1c2UucmFuZ2UsXG4gICAgICB9O1xuICAgIH0pO1xuICB9KTtcbiAgLy8gZmxhdHRlbiB0aGUgYXJyYXlzXG4gIHJldHVybiBbXS5jb25jYXQuYXBwbHkoW10sIGVycm9ycyk7XG59XG5cbnZhciBzZXJ2ZXJDb21wbGV0aW9uVHlwZXMgPSBuZXcgU2V0KFtcbiAgQ29tcGxldGlvblR5cGUuSUQsXG4gIENvbXBsZXRpb25UeXBlLk5FVyxcbiAgQ29tcGxldGlvblR5cGUuVFlQRSxcbl0pO1xuXG5mdW5jdGlvbiBzaG91bGREb1NlcnZlckNvbXBsZXRpb24odHlwZTogQ29tcGxldGlvblR5cGUpOiBib29sZWFuIHtcbiAgcmV0dXJuIHNlcnZlckNvbXBsZXRpb25UeXBlcy5oYXModHlwZSk7XG59XG5cbmZ1bmN0aW9uIHByb2Nlc3NDb21wbGV0aW9ucyhjb21wbGV0aW9uc1Jlc3BvbnNlOiBBcnJheTxhbnk+KTogQXJyYXk8YW55PiB7XG4gIHJldHVybiBjb21wbGV0aW9uc1Jlc3BvbnNlLm1hcCgoY29tcGxldGlvbikgPT4ge1xuICAgIHZhciB7bmFtZSwgdHlwZSwgZnVuY19kZXRhaWxzOiBmdW5jdGlvbkRldGFpbHN9ID0gY29tcGxldGlvbjtcbiAgICBpZiAodHlwZSAmJiB0eXBlLmluZGV4T2YoJygnKSA9PT0gMCAmJiB0eXBlLmxhc3RJbmRleE9mKCcpJykgPT09IHR5cGUubGVuZ3RoIC0gMSkge1xuICAgICAgdHlwZSA9IHR5cGUuc3Vic3RyaW5nKDEsIHR5cGUubGVuZ3RoIC0gMSk7XG4gICAgfVxuICAgIHZhciBtYXRjaFNuaXBwZXQgPSBuYW1lO1xuICAgIGlmIChmdW5jdGlvbkRldGFpbHMpIHtcbiAgICAgIHZhciB7cGFyYW1zfSA9IGZ1bmN0aW9uRGV0YWlscztcbiAgICAgIC8vIENvbnN0cnVjdCB0aGUgc25pcHBldDogZS5nLiBteUZ1bmN0aW9uKCR7MTokYXJnMX0sICR7MjokYXJnMn0pO1xuICAgICAgdmFyIHBhcmFtc1N0cmluZyA9IHBhcmFtcy5tYXAoKHBhcmFtLCBpbmRleCkgPT4gJyR7JyArIChpbmRleCArIDEpICsgJzonICsgcGFyYW0ubmFtZSArICd9Jykuam9pbignLCAnKTtcbiAgICAgIG1hdGNoU25pcHBldCA9IG5hbWUgKyAnKCcgKyBwYXJhbXNTdHJpbmcgKyAnKSc7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBtYXRjaFNuaXBwZXQsXG4gICAgICBtYXRjaFRleHQ6IG5hbWUsXG4gICAgICBtYXRjaFR5cGU6IHR5cGUsXG4gICAgfTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGlzSGFja0ZpbGUoY29udGVudHM6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gY29udGVudHMgJiYgY29udGVudHMuc3RhcnRzV2l0aCgnPD9oaCcpO1xufVxuIl19