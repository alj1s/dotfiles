(function() {
  var utils;

  utils = {
    fill: function(str, length, filler) {
      if (filler == null) {
        filler = '0';
      }
      while (str.length < length) {
        str = filler + str;
      }
      return str;
    },
    strip: function(str) {
      return str.replace(/\s+/g, '');
    },
    clamp: function(n) {
      return Math.min(1, Math.max(0, n));
    },
    clampInt: function(n, max) {
      if (max == null) {
        max = 100;
      }
      return Math.min(max, Math.max(0, n));
    },
    readFloat: function(value, vars, color) {
      var res;
      if (vars == null) {
        vars = {};
      }
      res = parseFloat(value);
      if (isNaN(res) && (vars[value] != null)) {
        color.usedVariables.push(value);
        res = parseFloat(vars[value].value);
      }
      return res;
    },
    readInt: function(value, vars, color, base) {
      var res;
      if (vars == null) {
        vars = {};
      }
      if (base == null) {
        base = 10;
      }
      res = parseInt(value, base);
      if (isNaN(res) && (vars[value] != null)) {
        color.usedVariables.push(value);
        res = parseInt(vars[value].value, base);
      }
      return res;
    },
    countLines: function(string) {
      return string.split(/\r\n|\r|\n/g).length;
    },
    readIntOrPercent: function(value, vars, color) {
      var res;
      if (vars == null) {
        vars = {};
      }
      if (!/\d+/.test(value) && (vars[value] != null)) {
        color.usedVariables.push(value);
        value = vars[value].value;
      }
      if (value == null) {
        return NaN;
      }
      if (value.indexOf('%') !== -1) {
        res = Math.round(parseFloat(value) * 2.55);
      } else {
        res = parseInt(value);
      }
      return res;
    },
    readFloatOrPercent: function(amount, vars, color) {
      var res;
      if (vars == null) {
        vars = {};
      }
      if (!/\d+/.test(amount) && (vars[amount] != null)) {
        color.usedVariables.push(amount);
        amount = vars[amount].value;
      }
      if (amount == null) {
        return NaN;
      }
      if (amount.indexOf('%') !== -1) {
        res = parseFloat(amount) / 100;
      } else {
        res = parseFloat(amount);
      }
      return res;
    },
    findClosingIndex: function(s, startIndex, openingChar, closingChar) {
      var curStr, index, nests;
      if (startIndex == null) {
        startIndex = 0;
      }
      if (openingChar == null) {
        openingChar = "[";
      }
      if (closingChar == null) {
        closingChar = "]";
      }
      index = startIndex;
      nests = 1;
      while (nests && index < s.length) {
        curStr = s.substr(index++, 1);
        if (curStr === closingChar) {
          nests--;
        } else if (curStr === openingChar) {
          nests++;
        }
      }
      if (nests === 0) {
        return index - 1;
      } else {
        return -1;
      }
    },
    split: function(s, sep) {
      var a, c, i, l, start;
      if (sep == null) {
        sep = ",";
      }
      a = [];
      l = s.length;
      i = 0;
      start = 0;
      while (i < l) {
        c = s.substr(i, 1);
        switch (c) {
          case "(":
            i = utils.findClosingIndex(s, i + 1, c, ")");
            break;
          case "[":
            i = utils.findClosingIndex(s, i + 1, c, "]");
            break;
          case "":
            i = utils.findClosingIndex(s, i + 1, c, "");
            break;
          case sep:
            a.push(utils.strip(s.substr(start, i - start)));
            start = i + 1;
        }
        i++;
      }
      a.push(utils.strip(s.substr(start, i - start)));
      return a;
    }
  };

  module.exports = utils;

}).call(this);
