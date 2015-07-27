(function() {
  var DotRenderer;

  module.exports = DotRenderer = (function() {
    function DotRenderer() {}

    DotRenderer.prototype.render = function(colorMarker) {
      var charWidth, column, displayBuffer, index, lineHeight, markers, pixelPosition, range, screenLine;
      range = colorMarker.marker.getScreenRange();
      displayBuffer = colorMarker.marker.displayBuffer;
      charWidth = displayBuffer.getDefaultCharWidth();
      markers = displayBuffer.findMarkers({
        type: 'pigments-color',
        intersectsScreenRowRange: [range.end.row, range.end.row]
      });
      index = markers.indexOf(colorMarker.marker);
      screenLine = displayBuffer.screenLines[range.end.row];
      lineHeight = displayBuffer.getLineHeightInPixels();
      column = (screenLine.getMaxScreenColumn() + 1) * charWidth;
      pixelPosition = displayBuffer.pixelPositionForScreenPosition(range.end);
      return {
        "class": 'dot',
        style: {
          backgroundColor: colorMarker.color.toCSS(),
          top: (pixelPosition.top + lineHeight / 2) + 'px',
          left: (column + index * 18) + 'px'
        }
      };
    };

    return DotRenderer;

  })();

}).call(this);
