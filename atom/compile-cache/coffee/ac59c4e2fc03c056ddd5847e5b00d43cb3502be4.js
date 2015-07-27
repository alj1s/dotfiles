(function() {
  var ColorParser, ColorScanner, countLines, getRegistry;

  countLines = require('./utils').countLines;

  getRegistry = require('./color-expressions').getRegistry;

  ColorParser = require('./color-parser');

  module.exports = ColorScanner = (function() {
    function ColorScanner(params) {
      if (params == null) {
        params = {};
      }
      this.parser = params.parser, this.context = params.context;
      if (this.parser == null) {
        this.parser = new ColorParser;
      }
    }

    ColorScanner.prototype.getRegExp = function() {
      var registry;
      registry = getRegistry(this.context);
      return this.regexp = new RegExp(registry.getRegExp(), 'g');
    };

    ColorScanner.prototype.search = function(text, start) {
      var color, index, lastIndex, match, matchText;
      if (start == null) {
        start = 0;
      }
      this.regexp = this.getRegExp();
      this.regexp.lastIndex = start;
      if (match = this.regexp.exec(text)) {
        matchText = match[0];
        lastIndex = this.regexp.lastIndex;
        color = this.parser.parse(matchText, this.context);
        if ((index = matchText.indexOf(color.colorExpression)) > 0) {
          lastIndex += -matchText.length + index + color.colorExpression.length;
          matchText = color.colorExpression;
        }
        return {
          color: color,
          match: matchText,
          lastIndex: lastIndex,
          range: [lastIndex - matchText.length, lastIndex],
          line: countLines(text.slice(0, +(lastIndex - matchText.length) + 1 || 9e9)) - 1
        };
      }
    };

    return ColorScanner;

  })();

}).call(this);
