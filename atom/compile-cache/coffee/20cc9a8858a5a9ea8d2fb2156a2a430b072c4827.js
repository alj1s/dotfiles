(function() {
  var OutlineRenderer, RegionRenderer,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  RegionRenderer = require('./region-renderer');

  module.exports = OutlineRenderer = (function(_super) {
    __extends(OutlineRenderer, _super);

    function OutlineRenderer() {
      return OutlineRenderer.__super__.constructor.apply(this, arguments);
    }

    OutlineRenderer.prototype.render = function(colorMarker) {
      var color, range, region, regions, rowSpan, _i, _len;
      range = colorMarker.marker.getScreenRange();
      if (range.isEmpty()) {
        return [];
      }
      color = colorMarker.color.toCSS();
      rowSpan = range.end.row - range.start.row;
      regions = this.renderRegions(colorMarker);
      for (_i = 0, _len = regions.length; _i < _len; _i++) {
        region = regions[_i];
        this.styleRegion(region, color);
      }
      return {
        regions: regions
      };
    };

    OutlineRenderer.prototype.styleRegion = function(region, color) {
      region.classList.add('outline');
      return region.style.borderColor = color;
    };

    return OutlineRenderer;

  })(RegionRenderer);

}).call(this);
