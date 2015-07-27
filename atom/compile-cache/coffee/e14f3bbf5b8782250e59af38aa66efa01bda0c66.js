(function() {
  var ColorBufferElement, ColorMarkerElement, CompositeDisposable, Emitter, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ref = require('atom'), Emitter = _ref.Emitter, CompositeDisposable = _ref.CompositeDisposable;

  ColorMarkerElement = require('./color-marker-element');

  ColorBufferElement = (function(_super) {
    __extends(ColorBufferElement, _super);

    function ColorBufferElement() {
      return ColorBufferElement.__super__.constructor.apply(this, arguments);
    }

    ColorBufferElement.prototype.createdCallback = function() {
      var _ref1;
      _ref1 = [0, 0], this.editorScrollLeft = _ref1[0], this.editorScrollTop = _ref1[1];
      this.emitter = new Emitter;
      this.subscriptions = new CompositeDisposable;
      this.shadowRoot = this.createShadowRoot();
      this.displayedMarkers = [];
      this.usedMarkers = [];
      this.unusedMarkers = [];
      this.viewsByMarkers = new WeakMap;
      return this.subscriptions.add(atom.config.observe('pigments.markerType', (function(_this) {
        return function(type) {
          if (type === 'background') {
            return _this.classList.add('above-editor-content');
          } else {
            return _this.classList.remove('above-editor-content');
          }
        };
      })(this)));
    };

    ColorBufferElement.prototype.attachedCallback = function() {
      this.attached = true;
      return this.updateMarkers();
    };

    ColorBufferElement.prototype.detachedCallback = function() {
      return this.attached = false;
    };

    ColorBufferElement.prototype.onDidUpdate = function(callback) {
      return this.emitter.on('did-update', callback);
    };

    ColorBufferElement.prototype.getModel = function() {
      return this.colorBuffer;
    };

    ColorBufferElement.prototype.setModel = function(colorBuffer) {
      this.colorBuffer = colorBuffer;
      this.editor = this.colorBuffer.editor;
      this.editorElement = atom.views.getView(this.editor);
      this.colorBuffer.initialize().then((function(_this) {
        return function() {
          return _this.updateMarkers();
        };
      })(this));
      this.subscriptions.add(this.colorBuffer.onDidUpdateColorMarkers((function(_this) {
        return function() {
          return _this.updateMarkers();
        };
      })(this)));
      this.subscriptions.add(this.colorBuffer.onDidDestroy((function(_this) {
        return function() {
          return _this.destroy();
        };
      })(this)));
      this.subscriptions.add(this.editor.onDidChangeScrollLeft((function(_this) {
        return function(editorScrollLeft) {
          _this.editorScrollLeft = editorScrollLeft;
          return _this.updateScroll();
        };
      })(this)));
      this.subscriptions.add(this.editor.onDidChangeScrollTop((function(_this) {
        return function(editorScrollTop) {
          _this.editorScrollTop = editorScrollTop;
          _this.updateScroll();
          return _this.updateMarkers();
        };
      })(this)));
      this.subscriptions.add(this.editor.onDidChange((function(_this) {
        return function() {
          return _this.usedMarkers.forEach(function(marker) {
            return marker.checkScreenRange();
          });
        };
      })(this)));
      this.subscriptions.add(this.editor.onDidAddCursor((function(_this) {
        return function() {
          return _this.requestSelectionUpdate();
        };
      })(this)));
      this.subscriptions.add(this.editor.onDidRemoveCursor((function(_this) {
        return function() {
          return _this.requestSelectionUpdate();
        };
      })(this)));
      this.subscriptions.add(this.editor.onDidChangeCursorPosition((function(_this) {
        return function() {
          return _this.requestSelectionUpdate();
        };
      })(this)));
      this.subscriptions.add(this.editor.onDidAddSelection((function(_this) {
        return function() {
          return _this.requestSelectionUpdate();
        };
      })(this)));
      this.subscriptions.add(this.editor.onDidRemoveSelection((function(_this) {
        return function() {
          return _this.requestSelectionUpdate();
        };
      })(this)));
      this.subscriptions.add(this.editor.onDidChangeSelectionRange((function(_this) {
        return function() {
          return _this.requestSelectionUpdate();
        };
      })(this)));
      this.subscriptions.add(this.editor.displayBuffer.onDidTokenize((function(_this) {
        return function() {
          return _this.editorConfigChanged();
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('editor.fontSize', (function(_this) {
        return function() {
          return _this.editorConfigChanged();
        };
      })(this)));
      this.subscriptions.add(atom.config.observe('editor.lineHeight', (function(_this) {
        return function() {
          return _this.editorConfigChanged();
        };
      })(this)));
      this.subscriptions.add(atom.styles.onDidAddStyleElement((function(_this) {
        return function() {
          return _this.editorConfigChanged();
        };
      })(this)));
      this.subscriptions.add(this.editorElement.onDidAttach((function(_this) {
        return function() {
          return _this.attach();
        };
      })(this)));
      return this.subscriptions.add(this.editorElement.onDidDetach((function(_this) {
        return function() {
          return _this.detach();
        };
      })(this)));
    };

    ColorBufferElement.prototype.attach = function() {
      var _ref1;
      if (this.parentNode != null) {
        return;
      }
      return (_ref1 = this.getEditorRoot().querySelector('.lines')) != null ? _ref1.appendChild(this) : void 0;
    };

    ColorBufferElement.prototype.detach = function() {
      if (this.parentNode == null) {
        return;
      }
      return this.parentNode.removeChild(this);
    };

    ColorBufferElement.prototype.updateScroll = function() {
      if (this.editorElement.hasTiledRendering) {
        return this.style.webkitTransform = "translate3d(" + (-this.editorScrollLeft) + "px, " + (-this.editorScrollTop) + "px, 0)";
      }
    };

    ColorBufferElement.prototype.destroy = function() {
      this.detach();
      this.subscriptions.dispose();
      this.releaseAllMarkerViews();
      return this.colorModel = null;
    };

    ColorBufferElement.prototype.getEditorRoot = function() {
      var _ref1;
      return (_ref1 = this.editorElement.shadowRoot) != null ? _ref1 : this.editorElement;
    };

    ColorBufferElement.prototype.editorConfigChanged = function() {
      if (this.parentNode == null) {
        return;
      }
      this.usedMarkers.forEach((function(_this) {
        return function(marker) {
          if (marker.colorMarker != null) {
            return marker.render();
          } else {
            console.warn("A marker view was found in the used instance pool while having a null model", marker);
            return _this.releaseMarkerElement(marker);
          }
        };
      })(this));
      return this.updateMarkers();
    };

    ColorBufferElement.prototype.requestSelectionUpdate = function() {
      if (this.updateRequested) {
        return;
      }
      this.updateRequested = true;
      return requestAnimationFrame((function(_this) {
        return function() {
          _this.updateRequested = false;
          if (_this.editor.getBuffer().isDestroyed()) {
            return;
          }
          return _this.updateSelections();
        };
      })(this));
    };

    ColorBufferElement.prototype.updateSelections = function() {
      var marker, view, _i, _len, _ref1, _results;
      if (this.editor.isDestroyed()) {
        return;
      }
      _ref1 = this.displayedMarkers;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        marker = _ref1[_i];
        view = this.viewsByMarkers.get(marker);
        if (view != null) {
          view.style.display = '';
          _results.push(this.hideMarkerIfInSelection(marker, view));
        } else {
          _results.push(console.warn("A color marker was found in the displayed markers array without an associated view", marker));
        }
      }
      return _results;
    };

    ColorBufferElement.prototype.updateMarkers = function() {
      var m, markers, _i, _j, _len, _len1, _ref1, _ref2;
      markers = this.colorBuffer.findValidColorMarkers({
        intersectsScreenRowRange: this.editor.displayBuffer.getVisibleRowRange()
      });
      _ref1 = this.displayedMarkers;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        m = _ref1[_i];
        if (__indexOf.call(markers, m) < 0) {
          this.releaseMarkerView(m);
        }
      }
      for (_j = 0, _len1 = markers.length; _j < _len1; _j++) {
        m = markers[_j];
        if (((_ref2 = m.color) != null ? _ref2.isValid() : void 0) && __indexOf.call(this.displayedMarkers, m) < 0) {
          this.requestMarkerView(m);
        }
      }
      this.displayedMarkers = markers;
      return this.emitter.emit('did-update');
    };

    ColorBufferElement.prototype.requestMarkerView = function(marker) {
      var view;
      if (this.unusedMarkers.length) {
        view = this.unusedMarkers.shift();
      } else {
        view = new ColorMarkerElement;
        view.onDidRelease((function(_this) {
          return function(_arg) {
            var marker;
            marker = _arg.marker;
            _this.displayedMarkers.splice(_this.displayedMarkers.indexOf(marker), 1);
            return _this.releaseMarkerView(marker);
          };
        })(this));
        this.shadowRoot.appendChild(view);
      }
      view.setModel(marker);
      this.hideMarkerIfInSelection(marker, view);
      this.usedMarkers.push(view);
      this.viewsByMarkers.set(marker, view);
      return view;
    };

    ColorBufferElement.prototype.releaseMarkerView = function(markerOrView) {
      var marker, view;
      marker = markerOrView;
      view = this.viewsByMarkers.get(markerOrView);
      if (view != null) {
        if (marker != null) {
          this.viewsByMarkers["delete"](marker);
        }
        return this.releaseMarkerElement(view);
      }
    };

    ColorBufferElement.prototype.releaseMarkerElement = function(view) {
      this.usedMarkers.splice(this.usedMarkers.indexOf(view), 1);
      if (!view.isReleased()) {
        view.release(false);
      }
      return this.unusedMarkers.push(view);
    };

    ColorBufferElement.prototype.releaseAllMarkerViews = function() {
      var view, _i, _j, _len, _len1, _ref1, _ref2;
      _ref1 = this.usedMarkers;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        view = _ref1[_i];
        view.destroy();
      }
      _ref2 = this.unusedMarkers;
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        view = _ref2[_j];
        view.destroy();
      }
      this.usedMarkers = [];
      return this.unusedMarkers = [];
    };

    ColorBufferElement.prototype.hideMarkerIfInSelection = function(marker, view) {
      var markerRange, range, selection, selections, _i, _len, _ref1, _results;
      selections = this.editor.getSelections();
      _results = [];
      for (_i = 0, _len = selections.length; _i < _len; _i++) {
        selection = selections[_i];
        range = selection.getScreenRange();
        markerRange = (_ref1 = marker.marker) != null ? _ref1.getScreenRange() : void 0;
        if (!((markerRange != null) && (range != null))) {
          continue;
        }
        if (markerRange.intersectsWith(range)) {
          _results.push(view.style.display = 'none');
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    return ColorBufferElement;

  })(HTMLElement);

  module.exports = ColorBufferElement = document.registerElement('pigments-markers', {
    prototype: ColorBufferElement.prototype
  });

  ColorBufferElement.registerViewProvider = function(modelClass) {
    return atom.views.addViewProvider(modelClass, function(model) {
      var element;
      element = new ColorBufferElement;
      element.setModel(model);
      return element;
    });
  };

}).call(this);
