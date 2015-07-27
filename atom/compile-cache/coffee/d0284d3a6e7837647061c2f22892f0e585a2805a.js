(function() {
  var VariableParser, registry;

  registry = require('./variable-expressions');

  module.exports = VariableParser = (function() {
    function VariableParser() {}

    VariableParser.prototype.parse = function(expression) {
      var e, _i, _len, _ref;
      _ref = registry.getExpressions();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        e = _ref[_i];
        if (e.match(expression)) {
          return e.parse(expression);
        }
      }
    };

    return VariableParser;

  })();

}).call(this);
