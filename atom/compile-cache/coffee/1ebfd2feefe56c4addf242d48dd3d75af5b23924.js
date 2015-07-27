(function() {
  var fs, path,
    __slice = [].slice;

  fs = require('fs');

  path = require('path');

  beforeEach(function() {
    var compare;
    compare = function(a, b, p) {
      return Math.abs(b - a) < (Math.pow(10, -p) / 2);
    };
    return this.addMatchers({
      toBeComponentArrayCloseTo: function(arr, precision) {
        var notText;
        if (precision == null) {
          precision = 0;
        }
        notText = this.isNot ? " not" : "";
        this.message = (function(_this) {
          return function() {
            return "Expected " + (jasmine.pp(_this.actual)) + " to" + notText + " be an array whose values are close to " + (jasmine.pp(arr)) + " with a precision of " + precision;
          };
        })(this);
        if (this.actual.length !== arr.length) {
          return false;
        }
        return this.actual.every(function(value, i) {
          return compare(value, arr[i], precision);
        });
      },
      toBeValid: function() {
        var notText;
        notText = this.isNot ? " not" : "";
        this.message = (function(_this) {
          return function() {
            return "Expected " + (jasmine.pp(_this.actual)) + " to" + notText + " be a valid color";
          };
        })(this);
        return this.actual.isValid();
      },
      toBeColor: function(colorOrRed, green, blue, alpha) {
        var color, hex, notText, red;
        if (green == null) {
          green = 0;
        }
        if (blue == null) {
          blue = 0;
        }
        if (alpha == null) {
          alpha = 1;
        }
        color = (function() {
          switch (typeof colorOrRed) {
            case 'object':
              return colorOrRed;
            case 'number':
              return {
                red: colorOrRed,
                green: green,
                blue: blue,
                alpha: alpha
              };
            case 'string':
              colorOrRed = colorOrRed.replace(/#|0x/, '');
              hex = parseInt(colorOrRed, 16);
              switch (colorOrRed.length) {
                case 8:
                  alpha = (hex >> 24 & 0xff) / 255;
                  red = hex >> 16 & 0xff;
                  green = hex >> 8 & 0xff;
                  blue = hex & 0xff;
                  break;
                case 6:
                  red = hex >> 16 & 0xff;
                  green = hex >> 8 & 0xff;
                  blue = hex & 0xff;
                  break;
                case 3:
                  red = (hex >> 8 & 0xf) * 17;
                  green = (hex >> 4 & 0xf) * 17;
                  blue = (hex & 0xf) * 17;
                  break;
                default:
                  red = 0;
                  green = 0;
                  blue = 0;
                  alpha = 1;
              }
              return {
                red: red,
                green: green,
                blue: blue,
                alpha: alpha
              };
            default:
              return {
                red: 0,
                green: 0,
                blue: 0,
                alpha: 1
              };
          }
        })();
        notText = this.isNot ? " not" : "";
        this.message = (function(_this) {
          return function() {
            return "Expected " + (jasmine.pp(_this.actual)) + " to" + notText + " be a color equal to " + (jasmine.pp(color));
          };
        })(this);
        return Math.round(this.actual.red) === color.red && Math.round(this.actual.green) === color.green && Math.round(this.actual.blue) === color.blue && compare(this.actual.alpha, color.alpha, 1);
      }
    });
  });

  module.exports = {
    jsonFixture: function() {
      var paths;
      paths = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return function(fixture, data) {
        var json, jsonPath;
        jsonPath = path.resolve.apply(path, __slice.call(paths).concat([fixture]));
        json = fs.readFileSync(jsonPath).toString();
        json = json.replace(/#\{([\w\[\]]+)\}/g, function(m, w) {
          var match, _;
          if (match = /^\[(\w+)\]$/.exec(w)) {
            _ = match[0], w = match[1];
            return data[w].shift();
          } else {
            return data[w];
          }
        });
        return JSON.parse(json);
      };
    }
  };

}).call(this);
