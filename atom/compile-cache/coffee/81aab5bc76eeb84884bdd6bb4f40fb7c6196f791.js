(function() {
  var ColorMarkerElement, CompositeDisposable, Emitter, RENDERERS, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ref = require('atom'), CompositeDisposable = _ref.CompositeDisposable, Emitter = _ref.Emitter;

  RENDERERS = {
    'background': require('./renderers/background'),
    'outline': require('./renderers/outline'),
    'underline': require('./renderers/underline'),
    'dot': require('./renderers/dot'),
    'square-dot': require('./renderers/square-dot')
  };

  ColorMarkerElement = (function(_super) {
    __extends(ColorMarkerElement, _super);

    function ColorMarkerElement() {
      return ColorMarkerElement.__super__.constructor.apply(this, arguments);
    }

    ColorMarkerElement.prototype.renderer = new RENDERERS.background;

    ColorMarkerElement.prototype.createdCallback = function() {
      this.emitter = new Emitter;
      return this.released = true;
    };

    ColorMarkerElement.prototype.attachedCallback = function() {};

    ColorMarkerElement.prototype.detachedCallback = function() {};

    ColorMarkerElement.prototype.onDidRelease = function(callback) {
      return this.emitter.on('did-release', callback);
    };

    ColorMarkerElement.prototype.getModel = function() {
      return this.colorMarker;
    };

    ColorMarkerElement.prototype.setModel = function(colorMarker) {
      this.colorMarker = colorMarker;
      if (!this.released) {
        return;
      }
      this.released = false;
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(this.colorMarker.marker.onDidDestroy((function(_this) {
        return function() {
          return _this.release();
        };
      })(this)));
      this.subscriptions.add(this.colorMarker.marker.onDidChange((function(_this) {
        return function(data) {
          var isValid;
          isValid = data.isValid;
          if (isValid) {
            return _this.render();
          } else {
            return _this.release();
          }
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('pigments.markerType', (function(_this) {
        return function(type) {
          return _this.render();
        };
      })(this)));
      return this.render();
    };

    ColorMarkerElement.prototype.destroy = function() {
      var _ref1, _ref2;
      if ((_ref1 = this.parentNode) != null) {
        _ref1.removeChild(this);
      }
      if ((_ref2 = this.subscriptions) != null) {
        _ref2.dispose();
      }
      return this.clear();
    };

    ColorMarkerElement.prototype.render = function() {
      var classes, cls, k, region, regions, style, v, _i, _j, _len, _len1, _ref1;
      this.innerHTML = '';
      _ref1 = this.renderer.render(this.colorMarker), style = _ref1.style, regions = _ref1.regions, cls = _ref1["class"];
      if (regions != null) {
        for (_i = 0, _len = regions.length; _i < _len; _i++) {
          region = regions[_i];
          this.appendChild(region);
        }
      }
      if (cls != null) {
        classes = cls.split(' ');
        for (_j = 0, _len1 = classes.length; _j < _len1; _j++) {
          cls = classes[_j];
          this.classList.add(cls);
        }
      }
      if (style != null) {
        for (k in style) {
          v = style[k];
          this.style[k] = v;
        }
      } else {
        this.style.cssText = '';
      }
      return this.lastMarkerScreenRange = this.colorMarker.marker.getScreenRange();
    };

    ColorMarkerElement.prototype.checkScreenRange = function() {
      if (!this.lastMarkerScreenRange.isEqual(this.colorMarker.marker.getScreenRange())) {
        return this.render();
      }
    };

    ColorMarkerElement.prototype.isReleased = function() {
      return this.released;
    };

    ColorMarkerElement.prototype.release = function(dispatchEvent) {
      var marker;
      if (dispatchEvent == null) {
        dispatchEvent = true;
      }
      if (this.released) {
        return;
      }
      this.subscriptions.dispose();
      marker = this.colorMarker;
      this.clear();
      if (dispatchEvent) {
        return this.emitter.emit('did-release', {
          marker: marker,
          view: this
        });
      }
    };

    ColorMarkerElement.prototype.clear = function() {
      this.subscriptions = null;
      this.colorMarker = null;
      this.released = true;
      this.innerHTML = '';
      this.className = '';
      return this.style.cssText = '';
    };

    return ColorMarkerElement;

  })(HTMLElement);

  module.exports = ColorMarkerElement = document.registerElement('pigments-color-marker', {
    prototype: ColorMarkerElement.prototype
  });

  ColorMarkerElement.setMarkerType = function(markerType) {
    return this.prototype.renderer = new RENDERERS[markerType];
  };

}).call(this);
