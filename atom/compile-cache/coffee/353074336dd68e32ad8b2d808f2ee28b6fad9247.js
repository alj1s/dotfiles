(function() {
  var RegionRenderer;

  module.exports = RegionRenderer = (function() {
    function RegionRenderer() {}

    RegionRenderer.prototype.includeTextInRegion = false;

    RegionRenderer.prototype.renderRegions = function(colorMarker) {
      var displayBuffer, range, regions, row, rowSpan, _i, _ref, _ref1;
      range = colorMarker.marker.getScreenRange();
      if (range.isEmpty()) {
        return [];
      }
      rowSpan = range.end.row - range.start.row;
      regions = [];
      displayBuffer = colorMarker.marker.displayBuffer;
      if (rowSpan === 0) {
        regions.push(this.createRegion(range.start, range.end, colorMarker));
      } else {
        regions.push(this.createRegion(range.start, {
          row: range.start.row,
          column: Infinity
        }, colorMarker, displayBuffer.screenLines[range.start.row]));
        if (rowSpan > 1) {
          for (row = _i = _ref = range.start.row + 1, _ref1 = range.end.row; _ref <= _ref1 ? _i < _ref1 : _i > _ref1; row = _ref <= _ref1 ? ++_i : --_i) {
            regions.push(this.createRegion({
              row: row,
              column: 0
            }, {
              row: row,
              column: Infinity
            }, colorMarker, displayBuffer.screenLines[row]));
          }
        }
        regions.push(this.createRegion({
          row: range.end.row,
          column: 0
        }, range.end, colorMarker, displayBuffer.screenLines[range.end.row]));
      }
      return regions;
    };

    RegionRenderer.prototype.createRegion = function(start, end, colorMarker, screenLine) {
      var bufferRange, charWidth, clippedEnd, clippedStart, css, displayBuffer, endPosition, lineHeight, name, needAdjustment, region, startPosition, text, value, _ref, _ref1;
      displayBuffer = colorMarker.marker.displayBuffer;
      lineHeight = displayBuffer.getLineHeightInPixels();
      charWidth = displayBuffer.getDefaultCharWidth();
      clippedStart = {
        row: start.row,
        column: (_ref = screenLine != null ? screenLine.clipScreenColumn(start.column) : void 0) != null ? _ref : start.column
      };
      clippedEnd = {
        row: end.row,
        column: (_ref1 = screenLine != null ? screenLine.clipScreenColumn(end.column) : void 0) != null ? _ref1 : end.column
      };
      bufferRange = displayBuffer.bufferRangeForScreenRange({
        start: clippedStart,
        end: clippedEnd
      });
      needAdjustment = (screenLine != null ? screenLine.isSoftWrapped() : void 0) && end.column >= (screenLine != null ? screenLine.text.length : void 0) - (screenLine != null ? screenLine.softWrapIndentationDelta : void 0);
      if (needAdjustment) {
        bufferRange.end.column++;
      }
      startPosition = displayBuffer.pixelPositionForScreenPosition(clippedStart);
      endPosition = displayBuffer.pixelPositionForScreenPosition(clippedEnd);
      text = displayBuffer.buffer.getTextInRange(bufferRange);
      css = {};
      css.left = startPosition.left;
      css.top = startPosition.top;
      css.width = endPosition.left - startPosition.left;
      if (needAdjustment) {
        css.width += charWidth;
      }
      css.height = lineHeight;
      region = document.createElement('div');
      region.className = 'region';
      if (this.includeTextInRegion) {
        region.textContent = text;
      }
      for (name in css) {
        value = css[name];
        region.style[name] = value + 'px';
      }
      return region;
    };

    return RegionRenderer;

  })();

}).call(this);
