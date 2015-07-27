(function() {
  var Color, SVGColors, hexARGBToRGB, hexRGBAToRGB, hexToRGB, hslToRGB, hsvToHWB, hsvToRGB, hwbToHSV, hwbToRGB, rgbToHSL, rgbToHSV, rgbToHWB, rgbToHex, rgbToHexARGB, rgbToHexRGBA, _ref;

  _ref = require('./color-conversions'), hexARGBToRGB = _ref.hexARGBToRGB, hexRGBAToRGB = _ref.hexRGBAToRGB, hexToRGB = _ref.hexToRGB, hslToRGB = _ref.hslToRGB, hsvToHWB = _ref.hsvToHWB, hsvToRGB = _ref.hsvToRGB, hwbToHSV = _ref.hwbToHSV, hwbToRGB = _ref.hwbToRGB, rgbToHSL = _ref.rgbToHSL, rgbToHSV = _ref.rgbToHSV, rgbToHWB = _ref.rgbToHWB, rgbToHex = _ref.rgbToHex, rgbToHexARGB = _ref.rgbToHexARGB, rgbToHexRGBA = _ref.rgbToHexRGBA;

  SVGColors = require('./svg-colors');

  module.exports = Color = (function() {
    Color.colorComponents = [['red', 0], ['green', 1], ['blue', 2], ['alpha', 3]];

    function Color(r, g, b, a) {
      var expr, i, k, v, _i, _len, _ref1;
      if (r == null) {
        r = 0;
      }
      if (g == null) {
        g = 0;
      }
      if (b == null) {
        b = 0;
      }
      if (a == null) {
        a = 1;
      }
      if (typeof r === 'object') {
        if (Array.isArray(r)) {
          for (i = _i = 0, _len = r.length; _i < _len; i = ++_i) {
            v = r[i];
            this[i] = v;
          }
        } else {
          for (k in r) {
            v = r[k];
            this[k] = v;
          }
        }
      } else if (typeof r === 'string') {
        if (r in SVGColors.allCases) {
          this.name = r;
          r = SVGColors.allCases[r];
        }
        expr = r.replace(/\#|0x/, '');
        if (expr.length === 6) {
          this.hex = expr;
          this.alpha = 1;
        } else {
          this.hexARGB = expr;
        }
      } else {
        _ref1 = [r, g, b, a], this.red = _ref1[0], this.green = _ref1[1], this.blue = _ref1[2], this.alpha = _ref1[3];
      }
    }

    Color.colorComponents.forEach(function(_arg) {
      var component, index;
      component = _arg[0], index = _arg[1];
      return Object.defineProperty(Color.prototype, component, {
        enumerable: true,
        get: function() {
          return this[index];
        },
        set: function(component) {
          return this[index] = component;
        }
      });
    });

    Object.defineProperty(Color.prototype, 'rgb', {
      enumerable: true,
      get: function() {
        return [this.red, this.green, this.blue];
      },
      set: function(_arg) {
        this.red = _arg[0], this.green = _arg[1], this.blue = _arg[2];
      }
    });

    Object.defineProperty(Color.prototype, 'rgba', {
      enumerable: true,
      get: function() {
        return [this.red, this.green, this.blue, this.alpha];
      },
      set: function(_arg) {
        this.red = _arg[0], this.green = _arg[1], this.blue = _arg[2], this.alpha = _arg[3];
      }
    });

    Object.defineProperty(Color.prototype, 'argb', {
      enumerable: true,
      get: function() {
        return [this.alpha, this.red, this.green, this.blue];
      },
      set: function(_arg) {
        this.alpha = _arg[0], this.red = _arg[1], this.green = _arg[2], this.blue = _arg[3];
      }
    });

    Object.defineProperty(Color.prototype, 'hsv', {
      enumerable: true,
      get: function() {
        return rgbToHSV(this.red, this.green, this.blue);
      },
      set: function(hsv) {
        var _ref1;
        return _ref1 = hsvToRGB.apply(this.constructor, hsv), this.red = _ref1[0], this.green = _ref1[1], this.blue = _ref1[2], _ref1;
      }
    });

    Object.defineProperty(Color.prototype, 'hsva', {
      enumerable: true,
      get: function() {
        return this.hsv.concat(this.alpha);
      },
      set: function(hsva) {
        var h, s, v, _ref1;
        h = hsva[0], s = hsva[1], v = hsva[2], this.alpha = hsva[3];
        return _ref1 = hsvToRGB.apply(this.constructor, [h, s, v]), this.red = _ref1[0], this.green = _ref1[1], this.blue = _ref1[2], _ref1;
      }
    });

    Object.defineProperty(Color.prototype, 'hsl', {
      enumerable: true,
      get: function() {
        return rgbToHSL(this.red, this.green, this.blue);
      },
      set: function(hsl) {
        var _ref1;
        return _ref1 = hslToRGB.apply(this.constructor, hsl), this.red = _ref1[0], this.green = _ref1[1], this.blue = _ref1[2], _ref1;
      }
    });

    Object.defineProperty(Color.prototype, 'hsla', {
      enumerable: true,
      get: function() {
        return this.hsl.concat(this.alpha);
      },
      set: function(hsl) {
        var h, l, s, _ref1;
        h = hsl[0], s = hsl[1], l = hsl[2], this.alpha = hsl[3];
        return _ref1 = hslToRGB.apply(this.constructor, [h, s, l]), this.red = _ref1[0], this.green = _ref1[1], this.blue = _ref1[2], _ref1;
      }
    });

    Object.defineProperty(Color.prototype, 'hwb', {
      enumerable: true,
      get: function() {
        return rgbToHWB(this.red, this.green, this.blue);
      },
      set: function(hwb) {
        var _ref1;
        return _ref1 = hwbToRGB.apply(this.constructor, hwb), this.red = _ref1[0], this.green = _ref1[1], this.blue = _ref1[2], _ref1;
      }
    });

    Object.defineProperty(Color.prototype, 'hwba', {
      enumerable: true,
      get: function() {
        return this.hwb.concat(this.alpha);
      },
      set: function(hwb) {
        var b, h, w, _ref1;
        h = hwb[0], w = hwb[1], b = hwb[2], this.alpha = hwb[3];
        return _ref1 = hwbToRGB.apply(this.constructor, [h, w, b]), this.red = _ref1[0], this.green = _ref1[1], this.blue = _ref1[2], _ref1;
      }
    });

    Object.defineProperty(Color.prototype, 'hex', {
      enumerable: true,
      get: function() {
        return rgbToHex(this.red, this.green, this.blue);
      },
      set: function(hex) {
        var _ref1;
        return _ref1 = hexToRGB(hex), this.red = _ref1[0], this.green = _ref1[1], this.blue = _ref1[2], _ref1;
      }
    });

    Object.defineProperty(Color.prototype, 'hexARGB', {
      enumerable: true,
      get: function() {
        return rgbToHexARGB(this.red, this.green, this.blue, this.alpha);
      },
      set: function(hex) {
        var _ref1;
        return _ref1 = hexARGBToRGB(hex), this.red = _ref1[0], this.green = _ref1[1], this.blue = _ref1[2], this.alpha = _ref1[3], _ref1;
      }
    });

    Object.defineProperty(Color.prototype, 'hexRGBA', {
      enumerable: true,
      get: function() {
        return rgbToHexRGBA(this.red, this.green, this.blue, this.alpha);
      },
      set: function(hex) {
        var _ref1;
        return _ref1 = hexRGBAToRGB(hex), this.red = _ref1[0], this.green = _ref1[1], this.blue = _ref1[2], this.alpha = _ref1[3], _ref1;
      }
    });

    Object.defineProperty(Color.prototype, 'length', {
      enumerable: true,
      get: function() {
        return 4;
      }
    });

    Object.defineProperty(Color.prototype, 'hue', {
      enumerable: true,
      get: function() {
        return this.hsl[0];
      },
      set: function(hue) {
        var hsl;
        hsl = this.hsl;
        hsl[0] = hue;
        return this.hsl = hsl;
      }
    });

    Object.defineProperty(Color.prototype, 'saturation', {
      enumerable: true,
      get: function() {
        return this.hsl[1];
      },
      set: function(saturation) {
        var hsl;
        hsl = this.hsl;
        hsl[1] = saturation;
        return this.hsl = hsl;
      }
    });

    Object.defineProperty(Color.prototype, 'lightness', {
      enumerable: true,
      get: function() {
        return this.hsl[2];
      },
      set: function(lightness) {
        var hsl;
        hsl = this.hsl;
        hsl[2] = lightness;
        return this.hsl = hsl;
      }
    });

    Object.defineProperty(Color.prototype, 'luma', {
      enumerable: true,
      get: function() {
        var b, g, r;
        r = this[0] / 255;
        g = this[1] / 255;
        b = this[2] / 255;
        r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
        g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
        b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      }
    });

    Color.prototype.isValid = function() {
      return !this.invalid && (this.red != null) && (this.green != null) && (this.blue != null) && (this.alpha != null) && !isNaN(this.red) && !isNaN(this.green) && !isNaN(this.blue) && !isNaN(this.alpha);
    };

    Color.prototype.clone = function() {
      return new Color(this.red, this.green, this.blue, this.alpha);
    };

    Color.prototype.isEqual = function(color) {
      return color.red === this.red && color.green === this.green && color.blue === this.blue && color.alpha === this.alpha;
    };

    Color.prototype.interpolate = function(col, ratio, preserveAlpha) {
      var iratio;
      if (preserveAlpha == null) {
        preserveAlpha = true;
      }
      iratio = 1 - ratio;
      if (col == null) {
        return clone();
      }
      return new Color(Math.floor(this.red * iratio + col.red * ratio), Math.floor(this.green * iratio + col.green * ratio), Math.floor(this.blue * iratio + col.blue * ratio), Math.floor(preserveAlpha ? this.alpha : this.alpha * iratio + col.alpha * ratio));
    };

    Color.prototype.transparentize = function(alpha) {
      return new Color(this.red, this.green, this.blue, alpha);
    };

    Color.prototype.blend = function(color, method, preserveAlpha) {
      var a, b, g, r;
      if (preserveAlpha == null) {
        preserveAlpha = true;
      }
      r = method(this.red, color.red);
      g = method(this.green, color.green);
      b = method(this.blue, color.blue);
      a = preserveAlpha ? this.alpha : method(this.alpha, color.alpha);
      return new Color(r, g, b, a);
    };

    Color.prototype.toCSS = function() {
      var rnd;
      rnd = Math.round;
      if (this.alpha === 1) {
        return "rgb(" + (rnd(this.red)) + "," + (rnd(this.green)) + "," + (rnd(this.blue)) + ")";
      } else {
        return "rgba(" + (rnd(this.red)) + "," + (rnd(this.green)) + "," + (rnd(this.blue)) + "," + this.alpha + ")";
      }
    };

    Color.prototype.serialize = function() {
      return [this.red, this.green, this.blue, this.alpha];
    };

    return Color;

  })();

}).call(this);
