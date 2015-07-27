(function() {
  var Color, ColorContext, ColorExpression, ColorParser,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Color = require('./color');

  ColorParser = null;

  ColorExpression = require('./color-expression');

  module.exports = ColorContext = (function() {
    function ColorContext(variables, colorVariables, parser) {
      var v, _i, _j, _len, _len1, _ref, _ref1;
      this.variables = variables != null ? variables : [];
      this.colorVariables = colorVariables != null ? colorVariables : [];
      this.parser = parser;
      this.vars = {};
      this.colorVars = {};
      _ref = this.variables;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        v = _ref[_i];
        this.vars[v.name] = v;
      }
      _ref1 = this.colorVariables;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        v = _ref1[_j];
        this.colorVars[v.name] = v;
      }
      if (this.parser == null) {
        ColorParser = require('./color-parser');
        this.parser = new ColorParser;
      }
      this.usedVariables = [];
    }

    ColorContext.prototype.clone = function() {
      return new ColorContext(this.variables, this.colorVariables, this.parser);
    };

    ColorContext.prototype.containsVariable = function(variableName) {
      return __indexOf.call(this.getVariablesNames(), variableName) >= 0;
    };

    ColorContext.prototype.hasColorVariables = function() {
      return this.colorVariables.length > 0;
    };

    ColorContext.prototype.getVariables = function() {
      return this.variables;
    };

    ColorContext.prototype.getColorVariables = function() {
      return this.colorVariables;
    };

    ColorContext.prototype.getVariablesNames = function() {
      return this.varNames != null ? this.varNames : this.varNames = Object.keys(this.vars);
    };

    ColorContext.prototype.getVariablesCount = function() {
      return this.varCount != null ? this.varCount : this.varCount = this.getVariablesNames().length;
    };

    ColorContext.prototype.readUsedVariables = function() {
      var usedVariables, v, _i, _len, _ref;
      usedVariables = [];
      _ref = this.usedVariables;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        v = _ref[_i];
        if (__indexOf.call(usedVariables, v) < 0) {
          usedVariables.push(v);
        }
      }
      this.usedVariables = [];
      return usedVariables;
    };

    ColorContext.prototype.readColorExpression = function(value) {
      if (this.colorVars[value] != null) {
        this.usedVariables.push(value);
        return this.colorVars[value].value;
      } else {
        return value;
      }
    };

    ColorContext.prototype.readColor = function(value, keepAllVariables) {
      var result;
      if (keepAllVariables == null) {
        keepAllVariables = false;
      }
      result = this.parser.parse(this.readColorExpression(value), this.clone());
      if (result != null) {
        if (keepAllVariables || __indexOf.call(this.usedVariables, value) < 0) {
          result.variables = result.variables.concat(this.readUsedVariables());
        }
        return result;
      }
    };

    ColorContext.prototype.readFloat = function(value) {
      var res;
      res = parseFloat(value);
      if (isNaN(res) && (this.vars[value] != null)) {
        this.usedVariables.push(value);
        res = parseFloat(this.vars[value].value);
      }
      return res;
    };

    ColorContext.prototype.readInt = function(value, base) {
      var res;
      if (base == null) {
        base = 10;
      }
      res = parseInt(value, base);
      if (isNaN(res) && (this.vars[value] != null)) {
        this.usedVariables.push(value);
        res = parseInt(this.vars[value].value, base);
      }
      return res;
    };

    ColorContext.prototype.readPercent = function(value) {
      if (!/\d+/.test(value) && (this.vars[value] != null)) {
        this.usedVariables.push(value);
        value = this.vars[value].value;
      }
      return Math.round(parseFloat(value) * 2.55);
    };

    ColorContext.prototype.readIntOrPercent = function(value) {
      var res;
      if (!/\d+/.test(value) && (this.vars[value] != null)) {
        this.usedVariables.push(value);
        value = this.vars[value].value;
      }
      if (value == null) {
        return NaN;
      }
      if (value.indexOf('%') !== -1) {
        res = Math.round(parseFloat(value) * 2.55);
      } else {
        res = parseInt(value);
      }
      return res;
    };

    ColorContext.prototype.readFloatOrPercent = function(amount) {
      var res;
      if (!/\d+/.test(amount) && (this.vars[amount] != null)) {
        this.usedVariables.push(amount);
        amount = this.vars[amount].value;
      }
      if (amount == null) {
        return NaN;
      }
      if (amount.indexOf('%') !== -1) {
        res = parseFloat(amount) / 100;
      } else {
        res = parseFloat(amount);
        if (res > 1) {
          res = res / 100;
        }
        res;
      }
      return res;
    };

    return ColorContext;

  })();

}).call(this);
