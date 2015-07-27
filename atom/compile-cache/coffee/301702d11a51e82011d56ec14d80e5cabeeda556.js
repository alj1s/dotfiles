(function() {
  var Color, ColorContext, ColorExpression, ColorParser, getRegistry;

  Color = require('./color');

  ColorExpression = require('./color-expression');

  ColorContext = null;

  getRegistry = require('./color-expressions').getRegistry;

  module.exports = ColorParser = (function() {
    function ColorParser() {}

    ColorParser.prototype.parse = function(expression, context) {
      var e, registry, res, _i, _len, _ref;
      if (context == null) {
        if (ColorContext == null) {
          ColorContext = require('./color-context');
        }
        context = new ColorContext;
      }
      if (context.parser == null) {
        context.parser = this;
      }
      if ((expression == null) || expression === '') {
        return void 0;
      }
      registry = getRegistry(context);
      _ref = registry.getExpressions();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        e = _ref[_i];
        if (e.match(expression)) {
          res = e.parse(expression, context);
          res.variables = context.readUsedVariables();
          return res;
        }
      }
      return void 0;
    };

    return ColorParser;

  })();

}).call(this);
