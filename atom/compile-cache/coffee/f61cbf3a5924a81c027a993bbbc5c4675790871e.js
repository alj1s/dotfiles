(function() {
  var ColorMarker, CompositeDisposable, fill;

  CompositeDisposable = require('atom').CompositeDisposable;

  fill = require('./utils').fill;

  module.exports = ColorMarker = (function() {
    function ColorMarker(_arg) {
      this.marker = _arg.marker, this.color = _arg.color, this.text = _arg.text, this.invalid = _arg.invalid;
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(this.marker.onDidDestroy((function(_this) {
        return function() {
          return _this.destroyed();
        };
      })(this)));
      this.subscriptions.add(this.marker.onDidChange((function(_this) {
        return function() {
          if (!_this.marker.isValid()) {
            return _this.destroy();
          }
        };
      })(this)));
    }

    ColorMarker.prototype.destroy = function() {
      if (this.wasDestroyed) {
        return;
      }
      return this.marker.destroy();
    };

    ColorMarker.prototype.destroyed = function() {
      var _ref;
      if (this.wasDestroyed) {
        return;
      }
      this.subscriptions.dispose();
      _ref = {}, this.marker = _ref.marker, this.color = _ref.color, this.text = _ref.text;
      return this.wasDestroyed = true;
    };

    ColorMarker.prototype.match = function(properties) {
      var bool;
      if (this.wasDestroyed) {
        return false;
      }
      bool = true;
      if (properties.bufferRange != null) {
        bool && (bool = this.marker.getBufferRange().isEqual(properties.bufferRange));
      }
      if (properties.color != null) {
        bool && (bool = properties.color.isEqual(this.color));
      }
      if (properties.match != null) {
        bool && (bool = properties.match === this.text);
      }
      if (properties.text != null) {
        bool && (bool = properties.text === this.text);
      }
      return bool;
    };

    ColorMarker.prototype.serialize = function() {
      var out;
      if (this.wasDestroyed) {
        return;
      }
      out = {
        markerId: String(this.marker.id),
        bufferRange: this.marker.getBufferRange().serialize(),
        color: this.color.serialize(),
        text: this.text,
        variables: this.color.variables
      };
      if (!this.color.isValid()) {
        out.invalid = true;
      }
      return out;
    };

    ColorMarker.prototype.convertContentToHex = function() {
      var hex;
      hex = '#' + fill(this.color.hex, 6);
      return this.marker.displayBuffer.buffer.setTextInRange(this.marker.getBufferRange(), hex);
    };

    ColorMarker.prototype.convertContentToRGBA = function() {
      var rgba;
      if (this.color.alpha === 1) {
        rgba = "rgb(" + (Math.round(this.color.red)) + ", " + (Math.round(this.color.green)) + ", " + (Math.round(this.color.blue)) + ")";
      } else {
        rgba = "rgba(" + (Math.round(this.color.red)) + ", " + (Math.round(this.color.green)) + ", " + (Math.round(this.color.blue)) + ", " + this.color.alpha + ")";
      }
      return this.marker.displayBuffer.buffer.setTextInRange(this.marker.getBufferRange(), rgba);
    };

    return ColorMarker;

  })();

}).call(this);
