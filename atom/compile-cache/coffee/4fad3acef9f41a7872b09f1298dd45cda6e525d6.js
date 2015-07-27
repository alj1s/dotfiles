(function() {
  module.exports = {
    activate: function() {
      return console.log('green', '#00ff00');
    },
    deactivate: function() {
      return console.log('red', '#ff0000', 'text-color');
    }
  };

}).call(this);
