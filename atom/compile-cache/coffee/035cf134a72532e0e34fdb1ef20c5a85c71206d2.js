(function() {
  var BufferVariablesScanner, ColorContext, VariableScanner, VariablesChunkSize;

  VariableScanner = require('../variable-scanner');

  ColorContext = require('../color-context');

  VariablesChunkSize = 100;

  BufferVariablesScanner = (function() {
    function BufferVariablesScanner(config) {
      this.buffer = config.buffer;
      this.scanner = new VariableScanner();
      this.results = [];
    }

    BufferVariablesScanner.prototype.scan = function() {
      var lastIndex, results;
      lastIndex = 0;
      while (results = this.scanner.search(this.buffer, lastIndex)) {
        this.results = this.results.concat(results);
        if (this.results.length >= VariablesChunkSize) {
          this.flushVariables();
        }
        lastIndex = results.lastIndex;
      }
      return this.flushVariables();
    };

    BufferVariablesScanner.prototype.flushVariables = function() {
      emit('scan-buffer:variables-found', this.results);
      return this.results = [];
    };

    return BufferVariablesScanner;

  })();

  module.exports = function(config) {
    return new BufferVariablesScanner(config).scan();
  };

}).call(this);
