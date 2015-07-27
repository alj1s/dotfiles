(function() {
  var Palette;

  module.exports = Palette = (function() {
    function Palette(colors) {
      this.colors = colors != null ? colors : {};
    }

    Palette.prototype.getColor = function(name) {
      return this.colors[name];
    };

    Palette.prototype.getNames = function(ref) {
      return this.tuple().filter(function(_arg) {
        var color, _;
        _ = _arg[0], color = _arg[1];
        return color.isEqual(ref);
      }).map(function(_arg) {
        var name;
        name = _arg[0];
        return name;
      });
    };

    Palette.prototype.sortedByColor = function() {
      return this.tuple().sort((function(_this) {
        return function(_arg, _arg1) {
          var a, b, _, __;
          _ = _arg[0], a = _arg[1];
          __ = _arg1[0], b = _arg1[1];
          return _this.compareColors(a, b);
        };
      })(this));
    };

    Palette.prototype.sortedByName = function() {
      return this.tuple().sort(function(_arg, _arg1) {
        var a, b;
        a = _arg[0];
        b = _arg1[0];
        if (a > b) {
          return 1;
        } else if (a < b) {
          return -1;
        } else {
          return 0;
        }
      });
    };

    Palette.prototype.getColorsNames = function() {
      return Object.keys(this.colors);
    };

    Palette.prototype.getColorsCount = function() {
      return this.getColorsNames().length;
    };

    Palette.prototype.eachColor = function(iterator) {
      var k, v, _ref, _results;
      _ref = this.colors;
      _results = [];
      for (k in _ref) {
        v = _ref[k];
        _results.push(iterator(k, v));
      }
      return _results;
    };

    Palette.prototype.tuple = function() {
      return this.eachColor(function(name, color) {
        return [name, color];
      });
    };

    Palette.prototype.compareColors = function(a, b) {
      var aHue, aLightness, aSaturation, bHue, bLightness, bSaturation, _ref, _ref1;
      _ref = a.hsl, aHue = _ref[0], aSaturation = _ref[1], aLightness = _ref[2];
      _ref1 = b.hsl, bHue = _ref1[0], bSaturation = _ref1[1], bLightness = _ref1[2];
      if (aHue < bHue) {
        return -1;
      } else if (aHue > bHue) {
        return 1;
      } else if (aSaturation < bSaturation) {
        return -1;
      } else if (aSaturation > bSaturation) {
        return 1;
      } else if (aLightness < bLightness) {
        return -1;
      } else if (aLightness > bLightness) {
        return 1;
      } else {
        return 0;
      }
    };

    return Palette;

  })();

}).call(this);
