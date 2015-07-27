(function() {
  var BlendModes, Color, ColorExpression, ExpressionsRegistry, MAX_PER_COMPONENT, SVGColors, blendMethod, clamp, clampInt, comma, contrast, createVariableRegExpString, cssColor, float, floatOrPercent, hexadecimal, int, intOrPercent, isInvalid, mixColors, namePrefixes, notQuote, optionalPercent, pe, percent, ps, readParam, split, strip, variables, _ref, _ref1,
    __slice = [].slice;

  cssColor = require('css-color-function');

  _ref = require('./regexes'), int = _ref.int, float = _ref.float, percent = _ref.percent, optionalPercent = _ref.optionalPercent, intOrPercent = _ref.intOrPercent, floatOrPercent = _ref.floatOrPercent, comma = _ref.comma, notQuote = _ref.notQuote, hexadecimal = _ref.hexadecimal, ps = _ref.ps, pe = _ref.pe, variables = _ref.variables, namePrefixes = _ref.namePrefixes, createVariableRegExpString = _ref.createVariableRegExpString;

  _ref1 = require('./utils'), strip = _ref1.strip, split = _ref1.split, clamp = _ref1.clamp, clampInt = _ref1.clampInt;

  ExpressionsRegistry = require('./expressions-registry');

  ColorExpression = require('./color-expression');

  SVGColors = require('./svg-colors');

  Color = require('./color');

  BlendModes = require('./blend-modes');

  MAX_PER_COMPONENT = {
    red: 255,
    green: 255,
    blue: 255,
    alpha: 1,
    hue: 360,
    saturation: 100,
    lightness: 100
  };

  mixColors = function(color1, color2, amount) {
    var color, inverse;
    if (amount == null) {
      amount = 0.5;
    }
    inverse = 1 - amount;
    color = new Color;
    color.rgba = [Math.floor(color1.red * amount) + Math.floor(color2.red * inverse), Math.floor(color1.green * amount) + Math.floor(color2.green * inverse), Math.floor(color1.blue * amount) + Math.floor(color2.blue * inverse), color1.alpha * amount + color2.alpha * inverse];
    return color;
  };

  contrast = function(base, dark, light, threshold) {
    var _ref2;
    if (dark == null) {
      dark = new Color('black');
    }
    if (light == null) {
      light = new Color('white');
    }
    if (threshold == null) {
      threshold = 0.43;
    }
    if (dark.luma > light.luma) {
      _ref2 = [dark, light], light = _ref2[0], dark = _ref2[1];
    }
    if (base.luma > threshold) {
      return dark;
    } else {
      return light;
    }
  };

  blendMethod = function(registry, name, method) {
    return registry.createExpression(name, strip("" + name + ps + " ( " + notQuote + " " + comma + " " + notQuote + " ) " + pe), function(match, expression, context) {
      var baseColor1, baseColor2, color1, color2, expr, _, _ref2, _ref3;
      _ = match[0], expr = match[1];
      _ref2 = split(expr), color1 = _ref2[0], color2 = _ref2[1];
      baseColor1 = context.readColor(color1);
      baseColor2 = context.readColor(color2);
      if (isInvalid(baseColor1) || isInvalid(baseColor2)) {
        return this.invalid = true;
      }
      return _ref3 = baseColor1.blend(baseColor2, method), this.rgba = _ref3.rgba, _ref3;
    });
  };

  readParam = function(param, block) {
    var name, re, value, _, _ref2;
    re = RegExp("\\$(\\w+):\\s*((-?" + float + ")|" + variables + ")");
    if (re.test(param)) {
      _ref2 = re.exec(param), _ = _ref2[0], name = _ref2[1], value = _ref2[2];
      return block(name, value);
    }
  };

  isInvalid = function(color) {
    return !(color != null ? color.isValid() : void 0);
  };

  module.exports = {
    getRegistry: function(context) {
      var colorRegexp, colors, paletteRegexpString, registry;
      registry = new ExpressionsRegistry(ColorExpression);
      registry.createExpression('css_hexa_8', "#(" + hexadecimal + "{8})(?![\\d\\w])", function(match, expression, context) {
        var hexa, _;
        _ = match[0], hexa = match[1];
        return this.hexRGBA = hexa;
      });
      registry.createExpression('css_hexa_6', "#(" + hexadecimal + "{6})(?![\\d\\w])", function(match, expression, context) {
        var hexa, _;
        _ = match[0], hexa = match[1];
        return this.hex = hexa;
      });
      registry.createExpression('css_hexa_4', "(" + namePrefixes + ")#(" + hexadecimal + "{4})(?![\\d\\w])", function(match, expression, context) {
        var colorAsInt, hexa, _;
        _ = match[0], _ = match[1], hexa = match[2];
        colorAsInt = context.readInt(hexa, 16);
        this.colorExpression = "#" + hexa;
        this.red = (colorAsInt >> 12 & 0xf) * 17;
        this.green = (colorAsInt >> 8 & 0xf) * 17;
        this.blue = (colorAsInt >> 4 & 0xf) * 17;
        return this.alpha = ((colorAsInt & 0xf) * 17) / 255;
      });
      registry.createExpression('css_hexa_3', "(" + namePrefixes + ")#(" + hexadecimal + "{3})(?![\\d\\w])", function(match, expression, context) {
        var colorAsInt, hexa, _;
        _ = match[0], _ = match[1], hexa = match[2];
        colorAsInt = context.readInt(hexa, 16);
        this.colorExpression = "#" + hexa;
        this.red = (colorAsInt >> 8 & 0xf) * 17;
        this.green = (colorAsInt >> 4 & 0xf) * 17;
        return this.blue = (colorAsInt & 0xf) * 17;
      });
      registry.createExpression('int_hexa_8', "0x(" + hexadecimal + "{8})(?!" + hexadecimal + ")", function(match, expression, context) {
        var hexa, _;
        _ = match[0], hexa = match[1];
        return this.hexARGB = hexa;
      });
      registry.createExpression('int_hexa_6', "0x(" + hexadecimal + "{6})(?!" + hexadecimal + ")", function(match, expression, context) {
        var hexa, _;
        _ = match[0], hexa = match[1];
        return this.hex = hexa;
      });
      registry.createExpression('css_rgb', strip("rgb" + ps + "\\s* (" + intOrPercent + "|" + variables + ") " + comma + " (" + intOrPercent + "|" + variables + ") " + comma + " (" + intOrPercent + "|" + variables + ") " + pe), function(match, expression, context) {
        var b, g, r, _;
        _ = match[0], r = match[1], _ = match[2], _ = match[3], g = match[4], _ = match[5], _ = match[6], b = match[7];
        this.red = context.readIntOrPercent(r);
        this.green = context.readIntOrPercent(g);
        this.blue = context.readIntOrPercent(b);
        return this.alpha = 1;
      });
      registry.createExpression('css_rgba', strip("rgba" + ps + "\\s* (" + intOrPercent + "|" + variables + ") " + comma + " (" + intOrPercent + "|" + variables + ") " + comma + " (" + intOrPercent + "|" + variables + ") " + comma + " (" + float + "|" + variables + ") " + pe), function(match, expression, context) {
        var a, b, g, r, _;
        _ = match[0], r = match[1], _ = match[2], _ = match[3], g = match[4], _ = match[5], _ = match[6], b = match[7], _ = match[8], _ = match[9], a = match[10];
        this.red = context.readIntOrPercent(r);
        this.green = context.readIntOrPercent(g);
        this.blue = context.readIntOrPercent(b);
        return this.alpha = context.readFloat(a);
      });
      registry.createExpression('stylus_rgba', strip("rgba" + ps + "\\s* (" + notQuote + ") " + comma + " (" + float + "|" + variables + ") " + pe), function(match, expression, context) {
        var a, baseColor, subexpr, _;
        _ = match[0], subexpr = match[1], a = match[2];
        baseColor = context.readColor(subexpr);
        if (isInvalid(baseColor)) {
          return this.invalid = true;
        }
        this.rgb = baseColor.rgb;
        return this.alpha = context.readFloat(a);
      });
      registry.createExpression('css_hsl', strip("hsl" + ps + "\\s* (" + int + "|" + variables + ") " + comma + " (" + percent + "|" + variables + ") " + comma + " (" + percent + "|" + variables + ") " + pe), function(match, expression, context) {
        var h, hsl, l, s, _;
        _ = match[0], h = match[1], _ = match[2], s = match[3], _ = match[4], l = match[5];
        hsl = [context.readInt(h), context.readFloat(s), context.readFloat(l)];
        if (hsl.some(function(v) {
          return (v == null) || isNaN(v);
        })) {
          return this.invalid = true;
        }
        this.hsl = hsl;
        return this.alpha = 1;
      });
      registry.createExpression('css_hsla', strip("hsla" + ps + "\\s* (" + int + "|" + variables + ") " + comma + " (" + percent + "|" + variables + ") " + comma + " (" + percent + "|" + variables + ") " + comma + " (" + float + "|" + variables + ") " + pe), function(match, expression, context) {
        var a, h, hsl, l, s, _;
        _ = match[0], h = match[1], _ = match[2], s = match[3], _ = match[4], l = match[5], _ = match[6], a = match[7];
        hsl = [context.readInt(h), context.readFloat(s), context.readFloat(l)];
        if (hsl.some(function(v) {
          return (v == null) || isNaN(v);
        })) {
          return this.invalid = true;
        }
        this.hsl = hsl;
        return this.alpha = context.readFloat(a);
      });
      registry.createExpression('hsv', strip("hsv" + ps + "\\s* (" + int + "|" + variables + ") " + comma + " (" + percent + "|" + variables + ") " + comma + " (" + percent + "|" + variables + ") " + pe), function(match, expression, context) {
        var h, hsv, s, v, _;
        _ = match[0], h = match[1], _ = match[2], s = match[3], _ = match[4], v = match[5];
        hsv = [context.readInt(h), context.readFloat(s), context.readFloat(v)];
        if (hsv.some(function(v) {
          return (v == null) || isNaN(v);
        })) {
          return this.invalid = true;
        }
        this.hsv = hsv;
        return this.alpha = 1;
      });
      registry.createExpression('hsva', strip("hsva" + ps + "\\s* (" + int + "|" + variables + ") " + comma + " (" + percent + "|" + variables + ") " + comma + " (" + percent + "|" + variables + ") " + comma + " (" + float + "|" + variables + ") " + pe), function(match, expression, context) {
        var a, h, hsv, s, v, _;
        _ = match[0], h = match[1], _ = match[2], s = match[3], _ = match[4], v = match[5], _ = match[6], a = match[7];
        hsv = [context.readInt(h), context.readFloat(s), context.readFloat(v)];
        if (hsv.some(function(v) {
          return (v == null) || isNaN(v);
        })) {
          return this.invalid = true;
        }
        this.hsv = hsv;
        return this.alpha = context.readFloat(a);
      });
      registry.createExpression('vec4', strip("vec4" + ps + "\\s* (" + float + ") " + comma + " (" + float + ") " + comma + " (" + float + ") " + comma + " (" + float + ") " + pe), function(match, expression, context) {
        var a, h, l, s, _;
        _ = match[0], h = match[1], s = match[2], l = match[3], a = match[4];
        return this.rgba = [context.readFloat(h) * 255, context.readFloat(s) * 255, context.readFloat(l) * 255, context.readFloat(a)];
      });
      registry.createExpression('hwb', strip("hwb" + ps + "\\s* (" + int + "|" + variables + ") " + comma + " (" + percent + "|" + variables + ") " + comma + " (" + percent + "|" + variables + ") (" + comma + "(" + float + "|" + variables + "))? " + pe), function(match, expression, context) {
        var a, b, h, w, _;
        _ = match[0], h = match[1], _ = match[2], w = match[3], _ = match[4], b = match[5], _ = match[6], _ = match[7], a = match[8];
        this.hwb = [context.readInt(h), context.readFloat(w), context.readFloat(b)];
        return this.alpha = a != null ? context.readFloat(a) : 1;
      });
      registry.createExpression('gray', strip("gray" + ps + "\\s* (" + percent + "|" + variables + ") (" + comma + "(" + float + "|" + variables + "))? " + pe), 1, function(match, expression, context) {
        var a, p, _;
        _ = match[0], p = match[1], _ = match[2], _ = match[3], a = match[4];
        p = context.readFloat(p) / 100 * 255;
        this.rgb = [p, p, p];
        return this.alpha = a != null ? context.readFloat(a) : 1;
      });
      colors = Object.keys(SVGColors.allCases);
      colorRegexp = "(" + namePrefixes + ")(" + (colors.join('|')) + ")(?!\\s*[-\\.:=\\(])\\b";
      registry.createExpression('named_colors', colorRegexp, function(match, expression, context) {
        var name, _;
        _ = match[0], _ = match[1], name = match[2];
        this.colorExpression = this.name = name;
        return this.hex = SVGColors.allCases[name].replace('#', '');
      });
      registry.createExpression('darken', strip("darken" + ps + " (" + notQuote + ") " + comma + " (" + optionalPercent + "|" + variables + ") " + pe), function(match, expression, context) {
        var amount, baseColor, h, l, s, subexpr, _, _ref2;
        _ = match[0], subexpr = match[1], amount = match[2];
        amount = context.readFloat(amount);
        baseColor = context.readColor(subexpr);
        if (isInvalid(baseColor)) {
          return this.invalid = true;
        }
        _ref2 = baseColor.hsl, h = _ref2[0], s = _ref2[1], l = _ref2[2];
        this.hsl = [h, s, clampInt(l - amount)];
        return this.alpha = baseColor.alpha;
      });
      registry.createExpression('lighten', strip("lighten" + ps + " (" + notQuote + ") " + comma + " (" + optionalPercent + "|" + variables + ") " + pe), function(match, expression, context) {
        var amount, baseColor, h, l, s, subexpr, _, _ref2;
        _ = match[0], subexpr = match[1], amount = match[2];
        amount = context.readFloat(amount);
        baseColor = context.readColor(subexpr);
        if (isInvalid(baseColor)) {
          return this.invalid = true;
        }
        _ref2 = baseColor.hsl, h = _ref2[0], s = _ref2[1], l = _ref2[2];
        this.hsl = [h, s, clampInt(l + amount)];
        return this.alpha = baseColor.alpha;
      });
      registry.createExpression('fade', strip("fade" + ps + " (" + notQuote + ") " + comma + " (" + floatOrPercent + "|" + variables + ") " + pe), function(match, expression, context) {
        var amount, baseColor, subexpr, _;
        _ = match[0], subexpr = match[1], amount = match[2];
        amount = context.readFloatOrPercent(amount);
        baseColor = context.readColor(subexpr);
        if (isInvalid(baseColor)) {
          return this.invalid = true;
        }
        this.rgb = baseColor.rgb;
        return this.alpha = amount;
      });
      registry.createExpression('transparentize', strip("(transparentize|fadeout)" + ps + " (" + notQuote + ") " + comma + " (" + floatOrPercent + "|" + variables + ") " + pe), function(match, expression, context) {
        var amount, baseColor, subexpr, _;
        _ = match[0], _ = match[1], subexpr = match[2], amount = match[3];
        amount = context.readFloatOrPercent(amount);
        baseColor = context.readColor(subexpr);
        if (isInvalid(baseColor)) {
          return this.invalid = true;
        }
        this.rgb = baseColor.rgb;
        return this.alpha = clamp(baseColor.alpha - amount);
      });
      registry.createExpression('opacify', strip("(opacify|fadein)" + ps + " (" + notQuote + ") " + comma + " (" + floatOrPercent + "|" + variables + ") " + pe), function(match, expression, context) {
        var amount, baseColor, subexpr, _;
        _ = match[0], _ = match[1], subexpr = match[2], amount = match[3];
        amount = context.readFloatOrPercent(amount);
        baseColor = context.readColor(subexpr);
        if (isInvalid(baseColor)) {
          return this.invalid = true;
        }
        this.rgb = baseColor.rgb;
        return this.alpha = clamp(baseColor.alpha + amount);
      });
      registry.createExpression('adjust-hue', strip("adjust-hue" + ps + " (" + notQuote + ") " + comma + " (-?" + int + "deg|" + variables + "|-?" + optionalPercent + ") " + pe), function(match, expression, context) {
        var amount, baseColor, h, l, s, subexpr, _, _ref2;
        _ = match[0], subexpr = match[1], amount = match[2];
        amount = context.readFloat(amount);
        baseColor = context.readColor(subexpr);
        if (isInvalid(baseColor)) {
          return this.invalid = true;
        }
        _ref2 = baseColor.hsl, h = _ref2[0], s = _ref2[1], l = _ref2[2];
        this.hsl = [(h + amount) % 360, s, l];
        return this.alpha = baseColor.alpha;
      });
      registry.createExpression('mix', strip("mix" + ps + " ( " + notQuote + " " + comma + " " + notQuote + " " + comma + " (" + floatOrPercent + "|" + variables + ") ) " + pe), function(match, expression, context) {
        var amount, baseColor1, baseColor2, color1, color2, expr, _, _ref2, _ref3;
        _ = match[0], expr = match[1];
        _ref2 = split(expr), color1 = _ref2[0], color2 = _ref2[1], amount = _ref2[2];
        if (amount != null) {
          amount = context.readFloatOrPercent(amount);
        } else {
          amount = 0.5;
        }
        baseColor1 = context.readColor(color1);
        baseColor2 = context.readColor(color2);
        if (isInvalid(baseColor1) || isInvalid(baseColor2)) {
          return this.invalid = true;
        }
        return _ref3 = mixColors(baseColor1, baseColor2, amount), this.rgba = _ref3.rgba, _ref3;
      });
      registry.createExpression('tint', strip("tint" + ps + " (" + notQuote + ") " + comma + " (" + floatOrPercent + "|" + variables + ") " + pe), function(match, expression, context) {
        var amount, baseColor, subexpr, white, _;
        _ = match[0], subexpr = match[1], amount = match[2];
        amount = context.readFloatOrPercent(amount);
        baseColor = context.readColor(subexpr);
        if (isInvalid(baseColor)) {
          return this.invalid = true;
        }
        white = new Color(255, 255, 255);
        return this.rgba = mixColors(white, baseColor, amount).rgba;
      });
      registry.createExpression('shade', strip("shade" + ps + " (" + notQuote + ") " + comma + " (" + floatOrPercent + "|" + variables + ") " + pe), function(match, expression, context) {
        var amount, baseColor, black, subexpr, _;
        _ = match[0], subexpr = match[1], amount = match[2];
        amount = context.readFloatOrPercent(amount);
        baseColor = context.readColor(subexpr);
        if (isInvalid(baseColor)) {
          return this.invalid = true;
        }
        black = new Color(0, 0, 0);
        return this.rgba = mixColors(black, baseColor, amount).rgba;
      });
      registry.createExpression('desaturate', "desaturate" + ps + "(" + notQuote + ")" + comma + "(" + floatOrPercent + "|" + variables + ")" + pe, function(match, expression, context) {
        var amount, baseColor, h, l, s, subexpr, _, _ref2;
        _ = match[0], subexpr = match[1], amount = match[2];
        amount = context.readFloatOrPercent(amount);
        baseColor = context.readColor(subexpr);
        if (isInvalid(baseColor)) {
          return this.invalid = true;
        }
        _ref2 = baseColor.hsl, h = _ref2[0], s = _ref2[1], l = _ref2[2];
        this.hsl = [h, clampInt(s - amount * 100), l];
        return this.alpha = baseColor.alpha;
      });
      registry.createExpression('saturate', strip("saturate" + ps + " (" + notQuote + ") " + comma + " (" + floatOrPercent + "|" + variables + ") " + pe), function(match, expression, context) {
        var amount, baseColor, h, l, s, subexpr, _, _ref2;
        _ = match[0], subexpr = match[1], amount = match[2];
        amount = context.readFloatOrPercent(amount);
        baseColor = context.readColor(subexpr);
        if (isInvalid(baseColor)) {
          return this.invalid = true;
        }
        _ref2 = baseColor.hsl, h = _ref2[0], s = _ref2[1], l = _ref2[2];
        this.hsl = [h, clampInt(s + amount * 100), l];
        return this.alpha = baseColor.alpha;
      });
      registry.createExpression('grayscale', "gr(a|e)yscale" + ps + "(" + notQuote + ")" + pe, function(match, expression, context) {
        var baseColor, h, l, s, subexpr, _, _ref2;
        _ = match[0], _ = match[1], subexpr = match[2];
        baseColor = context.readColor(subexpr);
        if (isInvalid(baseColor)) {
          return this.invalid = true;
        }
        _ref2 = baseColor.hsl, h = _ref2[0], s = _ref2[1], l = _ref2[2];
        this.hsl = [h, 0, l];
        return this.alpha = baseColor.alpha;
      });
      registry.createExpression('invert', "invert" + ps + "(" + notQuote + ")" + pe, function(match, expression, context) {
        var b, baseColor, g, r, subexpr, _, _ref2;
        _ = match[0], subexpr = match[1];
        baseColor = context.readColor(subexpr);
        if (isInvalid(baseColor)) {
          return this.invalid = true;
        }
        _ref2 = baseColor.rgb, r = _ref2[0], g = _ref2[1], b = _ref2[2];
        this.rgb = [255 - r, 255 - g, 255 - b];
        return this.alpha = baseColor.alpha;
      });
      registry.createExpression('complement', "complement" + ps + "(" + notQuote + ")" + pe, function(match, expression, context) {
        var baseColor, h, l, s, subexpr, _, _ref2;
        _ = match[0], subexpr = match[1];
        baseColor = context.readColor(subexpr);
        if (isInvalid(baseColor)) {
          return this.invalid = true;
        }
        _ref2 = baseColor.hsl, h = _ref2[0], s = _ref2[1], l = _ref2[2];
        this.hsl = [(h + 180) % 360, s, l];
        return this.alpha = baseColor.alpha;
      });
      registry.createExpression('spin', strip("spin" + ps + " (" + notQuote + ") " + comma + " (-?" + int + "|" + variables + ") " + pe), function(match, expression, context) {
        var angle, baseColor, h, l, s, subexpr, _, _ref2;
        _ = match[0], subexpr = match[1], angle = match[2];
        baseColor = context.readColor(subexpr);
        angle = context.readInt(angle);
        if (isInvalid(baseColor)) {
          return this.invalid = true;
        }
        _ref2 = baseColor.hsl, h = _ref2[0], s = _ref2[1], l = _ref2[2];
        this.hsl = [(360 + h + angle) % 360, s, l];
        return this.alpha = baseColor.alpha;
      });
      registry.createExpression('contrast_n_arguments', strip("contrast" + ps + " ( " + notQuote + " " + comma + " " + notQuote + " ) " + pe), function(match, expression, context) {
        var base, baseColor, dark, expr, light, res, threshold, _, _ref2, _ref3;
        _ = match[0], expr = match[1];
        _ref2 = split(expr), base = _ref2[0], dark = _ref2[1], light = _ref2[2], threshold = _ref2[3];
        baseColor = context.readColor(base);
        dark = context.readColor(dark);
        light = context.readColor(light);
        if (threshold != null) {
          threshold = context.readPercent(threshold);
        }
        if (isInvalid(baseColor)) {
          return this.invalid = true;
        }
        if (dark != null ? dark.invalid : void 0) {
          return this.invalid = true;
        }
        if (light != null ? light.invalid : void 0) {
          return this.invalid = true;
        }
        res = contrast(baseColor, dark, light);
        if (isInvalid(res)) {
          return this.invalid = true;
        }
        return _ref3 = contrast(baseColor, dark, light, threshold), this.rgb = _ref3.rgb, _ref3;
      });
      registry.createExpression('contrast_1_argument', strip("contrast" + ps + " (" + notQuote + ") " + pe), function(match, expression, context) {
        var baseColor, subexpr, _, _ref2;
        _ = match[0], subexpr = match[1];
        baseColor = context.readColor(subexpr);
        if (isInvalid(baseColor)) {
          return this.invalid = true;
        }
        return _ref2 = contrast(baseColor), this.rgb = _ref2.rgb, _ref2;
      });
      registry.createExpression('css_color_function', "(" + namePrefixes + ")(color" + ps + "(" + notQuote + ")" + pe + ")", function(match, expression, context) {
        var e, expr, rgba, _;
        try {
          _ = match[0], _ = match[1], expr = match[2];
          rgba = cssColor.convert(expr);
          this.rgba = context.readColor(rgba).rgba;
          return this.colorExpression = expr;
        } catch (_error) {
          e = _error;
          return this.invalid = true;
        }
      });
      registry.createExpression('sass_adjust_color', "adjust-color" + ps + "(" + notQuote + ")" + pe, 1, function(match, expression, context) {
        var baseColor, param, params, subexpr, subject, _, _i, _len, _ref2;
        _ = match[0], subexpr = match[1];
        _ref2 = split(subexpr), subject = _ref2[0], params = 2 <= _ref2.length ? __slice.call(_ref2, 1) : [];
        baseColor = context.readColor(subject);
        if (isInvalid(baseColor)) {
          return this.invalid = true;
        }
        for (_i = 0, _len = params.length; _i < _len; _i++) {
          param = params[_i];
          readParam(param, function(name, value) {
            return baseColor[name] += context.readFloat(value);
          });
        }
        return this.rgba = baseColor.rgba;
      });
      registry.createExpression('sass_scale_color', "scale-color" + ps + "(" + notQuote + ")" + pe, 1, function(match, expression, context) {
        var baseColor, param, params, subexpr, subject, _, _i, _len, _ref2;
        _ = match[0], subexpr = match[1];
        _ref2 = split(subexpr), subject = _ref2[0], params = 2 <= _ref2.length ? __slice.call(_ref2, 1) : [];
        baseColor = context.readColor(subject);
        if (isInvalid(baseColor)) {
          return this.invalid = true;
        }
        for (_i = 0, _len = params.length; _i < _len; _i++) {
          param = params[_i];
          readParam(param, function(name, value) {
            var dif, result;
            value = context.readFloat(value) / 100;
            result = value > 0 ? (dif = MAX_PER_COMPONENT[name] - baseColor[name], result = baseColor[name] + dif * value) : result = baseColor[name] * (1 + value);
            return baseColor[name] = result;
          });
        }
        return this.rgba = baseColor.rgba;
      });
      registry.createExpression('sass_change_color', "change-color" + ps + "(" + notQuote + ")" + pe, 1, function(match, expression, context) {
        var baseColor, param, params, subexpr, subject, _, _i, _len, _ref2;
        _ = match[0], subexpr = match[1];
        _ref2 = split(subexpr), subject = _ref2[0], params = 2 <= _ref2.length ? __slice.call(_ref2, 1) : [];
        baseColor = context.readColor(subject);
        if (isInvalid(baseColor)) {
          return this.invalid = true;
        }
        for (_i = 0, _len = params.length; _i < _len; _i++) {
          param = params[_i];
          readParam(param, function(name, value) {
            return baseColor[name] = context.readFloat(value);
          });
        }
        return this.rgba = baseColor.rgba;
      });
      registry.createExpression('stylus_blend', strip("blend" + ps + " ( " + notQuote + " " + comma + " " + notQuote + " ) " + pe), function(match, expression, context) {
        var baseColor1, baseColor2, color1, color2, expr, _, _ref2;
        _ = match[0], expr = match[1];
        _ref2 = split(expr), color1 = _ref2[0], color2 = _ref2[1];
        baseColor1 = context.readColor(color1);
        baseColor2 = context.readColor(color2);
        if (isInvalid(baseColor1) || isInvalid(baseColor2)) {
          return this.invalid = true;
        }
        return this.rgba = [baseColor1.red * baseColor1.alpha + baseColor2.red * (1 - baseColor1.alpha), baseColor1.green * baseColor1.alpha + baseColor2.green * (1 - baseColor1.alpha), baseColor1.blue * baseColor1.alpha + baseColor2.blue * (1 - baseColor1.alpha), baseColor1.alpha + baseColor2.alpha - baseColor1.alpha * baseColor2.alpha];
      });
      blendMethod(registry, 'multiply', BlendModes.MULTIPLY);
      blendMethod(registry, 'screen', BlendModes.SCREEN);
      blendMethod(registry, 'overlay', BlendModes.OVERLAY);
      blendMethod(registry, 'softlight', BlendModes.SOFT_LIGHT);
      blendMethod(registry, 'hardlight', BlendModes.HARD_LIGHT);
      blendMethod(registry, 'difference', BlendModes.DIFFERENCE);
      blendMethod(registry, 'exclusion', BlendModes.EXCLUSION);
      blendMethod(registry, 'average', BlendModes.AVERAGE);
      blendMethod(registry, 'negation', BlendModes.NEGATION);
      if (context != null ? context.hasColorVariables() : void 0) {
        paletteRegexpString = createVariableRegExpString(context.getColorVariables());
        registry.createExpression('variables', paletteRegexpString, 1, function(match, expression, context) {
          var baseColor, name, _;
          _ = match[0], _ = match[1], name = match[2];
          baseColor = context.readColor(name);
          this.colorExpression = name;
          this.variables = baseColor != null ? baseColor.variables : void 0;
          if (isInvalid(baseColor)) {
            return this.invalid = true;
          }
          return this.rgba = baseColor.rgba;
        });
      }
      return registry;
    }
  };

}).call(this);
