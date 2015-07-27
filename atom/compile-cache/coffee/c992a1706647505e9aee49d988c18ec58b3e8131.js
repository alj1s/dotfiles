(function() {
  var RegionRenderer, UnderlineRenderer,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  RegionRenderer = require('./region-renderer');

  module.exports = UnderlineRenderer = (function(_super) {
    __extends(UnderlineRenderer, _super);

    function UnderlineRenderer() {
      return UnderlineRenderer.__super__.constructor.apply(this, arguments);
    }

    UnderlineRenderer.prototype.render = function(colorMarker) {
      var color, region, regions, _i, _len;
      color = colorMarker.color.toCSS();
      regions = this.renderRegions(colorMarker);
      for (_i = 0, _len = regions.length; _i < _len; _i++) {
        region = regions[_i];
        this.styleRegion(region, color);
      }
      return {
        regions: regions
      };
    };

    UnderlineRenderer.prototype.styleRegion = function(region, color) {
      region.classList.add('underline');
      return region.style.backgroundColor = color;
    };

    return UnderlineRenderer;

  })(RegionRenderer);

}).call(this);
