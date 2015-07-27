(function() {
  var Task;

  Task = require('atom').Task;

  module.exports = {
    startTask: function(paths, callback) {
      var results, taskPath;
      results = [];
      taskPath = require.resolve('./tasks/scan-paths-handler');
      this.task = Task.once(taskPath, paths, (function(_this) {
        return function() {
          _this.task = null;
          return callback(results);
        };
      })(this));
      this.task.on('scan-paths:path-scanned', function(result) {
        return results = results.concat(result);
      });
      return this.task;
    },
    terminateRunningTask: function() {
      var _ref;
      return (_ref = this.task) != null ? _ref.terminate() : void 0;
    }
  };

}).call(this);
