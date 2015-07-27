(function() {
  var DotRenderer, SquareDotRenderer,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  DotRenderer = require('./dot');

  module.exports = SquareDotRenderer = (function(_super) {
    __extends(SquareDotRenderer, _super);

    function SquareDotRenderer() {
      return SquareDotRenderer.__super__.constructor.apply(this, arguments);
    }

    SquareDotRenderer.prototype.render = function(colorMarker) {
      var properties;
      properties = SquareDotRenderer.__super__.render.apply(this, arguments);
      properties["class"] += ' square';
      return properties;
    };

    return SquareDotRenderer;

  })(DotRenderer);

}).call(this);
