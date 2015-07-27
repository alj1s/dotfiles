(function() {
  module.exports = {
    flatten: function(root, dict, path) {
      var dotPath, isObject, key, value, _, _results;
      _ = require('underscore-plus');
      _results = [];
      for (key in dict) {
        value = dict[key];
        dotPath = key;
        if (path != null) {
          dotPath = "" + path + "." + key;
        }
        isObject = !_.isArray(value) && _.isObject(value);
        if (!isObject) {
          _results.push(root[dotPath] = value);
        } else {
          _results.push(this.flatten(root, dict[key], dotPath));
        }
      }
      return _results;
    },
    enable: function(settings) {
      var currentValue, flatSettings, setting, value, _, _results;
      _ = require('underscore-plus');
      flatSettings = {};
      this.flatten(flatSettings, settings);
      _results = [];
      for (setting in flatSettings) {
        value = flatSettings[setting];
        if (_.isArray(value)) {
          currentValue = atom.config.get(setting);
          value = _.union(currentValue, value);
        }
        _results.push(atom.config.setRawValue(setting, value));
      }
      return _results;
    }
  };

}).call(this);
