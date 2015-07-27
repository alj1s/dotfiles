(function() {
  var BackgroundRenderer, RegionRenderer,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  RegionRenderer = require('./region-renderer');

  module.exports = BackgroundRenderer = (function(_super) {
    __extends(BackgroundRenderer, _super);

    function BackgroundRenderer() {
      return BackgroundRenderer.__super__.constructor.apply(this, arguments);
    }

    BackgroundRenderer.prototype.includeTextInRegion = true;

    BackgroundRenderer.prototype.render = function(colorMarker) {
      var color, colorText, l, region, regions, _i, _len;
      color = colorMarker.color.toCSS();
      regions = this.renderRegions(colorMarker);
      l = colorMarker.color.luma;
      colorText = l > 0.43 ? 'black' : 'white';
      for (_i = 0, _len = regions.length; _i < _len; _i++) {
        region = regions[_i];
        this.styleRegion(region, color, colorText);
      }
      return {
        regions: regions
      };
    };

    BackgroundRenderer.prototype.styleRegion = function(region, color, textColor) {
      region.classList.add('background');
      region.style.backgroundColor = color;
      return region.style.color = textColor;
    };

    return BackgroundRenderer;

  })(RegionRenderer);

}).call(this);
