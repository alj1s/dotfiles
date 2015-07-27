(function() {
  var BufferColorsScanner, ColorContext, ColorScanner, ColorsChunkSize, createVariableExpression, getRegistry;

  ColorScanner = require('../color-scanner');

  ColorContext = require('../color-context');

  getRegistry = require('../color-expressions').getRegistry;

  createVariableExpression = require('../utils').createVariableExpression;

  ColorsChunkSize = 100;

  BufferColorsScanner = (function() {
    function BufferColorsScanner(config) {
      var colorVariables, variables;
      this.buffer = config.buffer, variables = config.variables, colorVariables = config.colorVariables;
      this.context = new ColorContext(variables, colorVariables);
      this.scanner = new ColorScanner({
        context: this.context
      });
      this.results = [];
    }

    BufferColorsScanner.prototype.scan = function() {
      var lastIndex, result;
      lastIndex = 0;
      while (result = this.scanner.search(this.buffer, lastIndex)) {
        this.results.push(result);
        if (this.results.length >= ColorsChunkSize) {
          this.flushColors();
        }
        lastIndex = result.lastIndex;
      }
      return this.flushColors();
    };

    BufferColorsScanner.prototype.flushColors = function() {
      emit('scan-buffer:colors-found', this.results);
      return this.results = [];
    };

    return BufferColorsScanner;

  })();

  module.exports = function(config) {
    return new BufferColorsScanner(config).scan();
  };

}).call(this);
