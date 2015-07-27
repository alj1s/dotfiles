(function() {
  var decimal, float, int, namePrefixes, percent, variables;

  int = '\\d+';

  decimal = "\\." + int;

  float = "(?:" + int + "|" + int + decimal + "|" + decimal + ")";

  percent = "" + float + "%";

  variables = '(@[a-zA-Z0-9\\-_]+|\\$[a-zA-Z0-9\\-_]+|[a-zA-Z_][a-zA-Z0-9\\-_]*)';

  namePrefixes = '^| |:|=|,|\\n|\'|"|\\(|\\[|\\{';

  module.exports = {
    int: int,
    float: float,
    percent: percent,
    optionalPercent: "" + float + "%?",
    intOrPercent: "(" + percent + "|" + int + ")",
    floatOrPercent: "(" + percent + "|" + float + ")",
    comma: '\\s*,\\s*',
    notQuote: "[^\"'\\n]+",
    hexadecimal: '[\\da-fA-F]',
    ps: '\\(\\s*',
    pe: '\\s*\\)',
    variables: variables,
    namePrefixes: namePrefixes,
    createVariableRegExpString: function(variables) {
      var v, variableNames, _i, _len;
      variableNames = [];
      for (_i = 0, _len = variables.length; _i < _len; _i++) {
        v = variables[_i];
        variableNames.push(v.name.replace(/[-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"));
      }
      variableNames = variableNames.join('|');
      return "(" + namePrefixes + ")(" + variableNames + ")(?!_|-|\\w|\\d|[ \\t]*[\\.:=])";
    }
  };

}).call(this);
