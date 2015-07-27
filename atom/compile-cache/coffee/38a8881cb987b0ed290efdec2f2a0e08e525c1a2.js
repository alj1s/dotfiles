(function() {
  var ColorExpression, ExpressionsRegistry;

  ColorExpression = require('./color-expression');

  module.exports = ExpressionsRegistry = (function() {
    function ExpressionsRegistry(expressionsType) {
      this.expressionsType = expressionsType;
      this.colorExpressions = {};
    }

    ExpressionsRegistry.prototype.getExpressions = function() {
      var e, k;
      return ((function() {
        var _ref, _results;
        _ref = this.colorExpressions;
        _results = [];
        for (k in _ref) {
          e = _ref[k];
          _results.push(e);
        }
        return _results;
      }).call(this)).sort(function(a, b) {
        return b.priority - a.priority;
      });
    };

    ExpressionsRegistry.prototype.getExpression = function(name) {
      return this.colorExpressions[name];
    };

    ExpressionsRegistry.prototype.getRegExp = function() {
      return this.getExpressions().map(function(e) {
        return "(" + e.regexpString + ")";
      }).join('|');
    };

    ExpressionsRegistry.prototype.createExpression = function(name, regexpString, priority, handle) {
      var newExpression, _ref;
      if (priority == null) {
        priority = 0;
      }
      if (typeof priority === 'function') {
        _ref = [0, priority], priority = _ref[0], handle = _ref[1];
      }
      newExpression = new this.expressionsType({
        name: name,
        regexpString: regexpString,
        handle: handle
      });
      newExpression.priority = priority;
      return this.addExpression(newExpression);
    };

    ExpressionsRegistry.prototype.addExpression = function(expression) {
      return this.colorExpressions[expression.name] = expression;
    };

    ExpressionsRegistry.prototype.removeExpression = function(name) {
      return delete this.colorExpressions[name];
    };

    return ExpressionsRegistry;

  })();

}).call(this);
