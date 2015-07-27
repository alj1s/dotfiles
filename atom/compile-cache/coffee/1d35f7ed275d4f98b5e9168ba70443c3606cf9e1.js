(function() {
  module.exports = {
    MULTIPLY: function(v1, v2) {
      return v1 * v2 / 255;
    },
    SCREEN: function(v1, v2) {
      return v1 + v2 - (v1 * v2 / 255);
    },
    OVERLAY: function(v1, v2) {
      if (v1 < 128) {
        return 2 * v1 * v2 / 255;
      } else {
        return 255 - (2 * (255 - v1) * (255 - v2) / 255);
      }
    },
    DIFFERENCE: function(v1, v2) {
      return Math.abs(v1 - v2);
    },
    EXCLUSION: function(v1, v2) {
      var cb, cs;
      cb = v1 / 255;
      cs = v2 / 255;
      return (cb + cs - 2 * cb * cs) * 255;
    },
    AVERAGE: function(v1, v2) {
      return (v1 + v2) / 2;
    },
    NEGATION: function(v1, v2) {
      return 255 - Math.abs(v1 + v2 - 255);
    },
    SOFT_LIGHT: function(v1, v2) {
      var cb, cs, d, e;
      cb = v1 / 255;
      cs = v2 / 255;
      d = 1;
      e = cb;
      if (cs > 0.5) {
        e = 1;
        d = cb > 0.25 ? Math.sqrt(cb) : ((16 * cb - 12) * cb + 4) * cb;
      }
      return (cb - ((1 - (2 * cs)) * e * (d - cb))) * 255;
    },
    HARD_LIGHT: function(v1, v2) {
      return module.exports.OVERLAY(v2, v1);
    },
    COLOR_DODGE: function(v1, v2) {
      if (v1 === 255) {
        return v1;
      } else {
        return Math.min(255, (v2 << 8) / (255 - v1));
      }
    },
    COLOR_BURN: function(v1, v2) {
      if (v1 === 0) {
        return v1;
      } else {
        return Math.max(0, 255 - ((255 - v2 << 8) / v1));
      }
    },
    LINEAR_COLOR_DODGE: function(v1, v2) {
      return Math.min(v1 + v2, 255);
    },
    LINEAR_COLOR_BURN: function(v1, v2) {
      if (v1 + v2 < 255) {
        return 0;
      } else {
        return v1 + v2 - 255;
      }
    }
  };

}).call(this);
