(function() {
  var Task;

  Task = require('atom').Task;

  module.exports = {
    startTask: function(config, callback) {
      var dirtied, removed, task, taskPath;
      dirtied = [];
      removed = [];
      taskPath = require.resolve('./tasks/load-paths-handler');
      task = Task.once(taskPath, config, function() {
        return callback({
          dirtied: dirtied,
          removed: removed
        });
      });
      task.on('load-paths:paths-found', function(paths) {
        return dirtied.push.apply(dirtied, paths);
      });
      task.on('load-paths:paths-lost', function(paths) {
        return removed.push.apply(removed, paths);
      });
      return task;
    }
  };

}).call(this);
