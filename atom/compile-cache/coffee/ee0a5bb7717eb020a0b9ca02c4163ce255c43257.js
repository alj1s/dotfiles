(function() {
  var VariableParser, VariableScanner, countLines, regexp, regexpString, registry, _ref;

  countLines = require('./utils').countLines;

  VariableParser = require('./variable-parser');

  _ref = [], registry = _ref[0], regexpString = _ref[1], regexp = _ref[2];

  module.exports = VariableScanner = (function() {
    function VariableScanner(params) {
      if (params == null) {
        params = {};
      }
      this.parser = params.parser;
      if (this.parser == null) {
        this.parser = new VariableParser;
      }
    }

    VariableScanner.prototype.getRegExp = function() {
      if (registry == null) {
        registry = require('./variable-expressions');
      }
      if (regexpString == null) {
        regexpString = registry.getRegExp();
      }
      return regexp != null ? regexp : regexp = new RegExp(regexpString, 'gm');
    };

    VariableScanner.prototype.search = function(text, start) {
      var index, lastIndex, line, lineCountIndex, match, matchText, result, v, _i, _len;
      if (start == null) {
        start = 0;
      }
      regexp = this.getRegExp();
      regexp.lastIndex = start;
      while (match = regexp.exec(text)) {
        matchText = match[0];
        index = match.index;
        lastIndex = regexp.lastIndex;
        result = this.parser.parse(matchText);
        if (result != null) {
          result.lastIndex += index;
          if (result.length > 0) {
            result.range[0] += index;
            result.range[1] += index;
            line = -1;
            lineCountIndex = 0;
            for (_i = 0, _len = result.length; _i < _len; _i++) {
              v = result[_i];
              v.range[0] += index;
              v.range[1] += index;
              line = v.line = line + countLines(text.slice(lineCountIndex, +v.range[0] + 1 || 9e9));
              lineCountIndex = v.range[0];
            }
            return result;
          } else {
            regexp.lastIndex = result.lastIndex;
          }
        }
      }
      return void 0;
    };

    return VariableScanner;

  })();

}).call(this);
