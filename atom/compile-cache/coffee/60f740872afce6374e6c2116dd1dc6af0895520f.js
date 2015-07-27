(function() {
  var event, mouseEvent, objectCenterCoordinates;

  event = function(type, properties) {
    if (properties == null) {
      properties = {};
    }
    return new Event(type, properties);
  };

  mouseEvent = function(type, properties) {
    var defaults, k, v;
    defaults = {
      bubbles: true,
      cancelable: type !== "mousemove",
      view: window,
      detail: 0,
      pageX: 0,
      pageY: 0,
      clientX: 0,
      clientY: 0,
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      button: 0,
      relatedTarget: void 0
    };
    for (k in defaults) {
      v = defaults[k];
      if (properties[k] == null) {
        properties[k] = v;
      }
    }
    return new MouseEvent(type, properties);
  };

  objectCenterCoordinates = function(target) {
    var height, left, top, width, _ref;
    _ref = target.getBoundingClientRect(), top = _ref.top, left = _ref.left, width = _ref.width, height = _ref.height;
    return {
      x: left + width / 2,
      y: top + height / 2
    };
  };

  module.exports = {
    objectCenterCoordinates: objectCenterCoordinates,
    mouseEvent: mouseEvent,
    event: event
  };

  ['mousedown', 'mousemove', 'mouseup', 'click'].forEach(function(key) {
    return module.exports[key] = function(target, x, y, cx, cy, btn) {
      var _ref;
      if (!((x != null) && (y != null))) {
        _ref = objectCenterCoordinates(target), x = _ref.x, y = _ref.y;
      }
      if (!((cx != null) && (cy != null))) {
        cx = x;
        cy = y;
      }
      return target.dispatchEvent(mouseEvent(key, {
        target: target,
        pageX: x,
        pageY: y,
        clientX: cx,
        clientY: cy,
        button: btn
      }));
    };
  });

  module.exports.mousewheel = function(target, deltaX, deltaY) {
    if (deltaX == null) {
      deltaX = 0;
    }
    if (deltaY == null) {
      deltaY = 0;
    }
    return target.dispatchEvent(mouseEvent('mousewheel', {
      target: target,
      deltaX: deltaX,
      deltaY: deltaY
    }));
  };

  module.exports.change = function(target) {
    return target.dispatchEvent(event('change', {
      target: target
    }));
  };

}).call(this);
