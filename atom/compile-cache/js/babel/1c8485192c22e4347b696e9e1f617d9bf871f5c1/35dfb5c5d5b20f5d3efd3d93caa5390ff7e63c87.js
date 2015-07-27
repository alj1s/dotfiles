'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

/*
 * @param screenLines The original screen lines before adding offsets.
 * @param lineOffsets The offset map from buffer line numbers to the number of lines of offset requested there.
 * @param startBufferRow The buffer row at which the next range of screen lines is started.
 * @param endBufferRow The buffer row at which the next range of screen lines is ended.
 * @param emptyLineFactory A custom function to create a new empty line, representing an offset screen line.
 */
function buildLineRangesWithOffsets(screenLines, lineOffsets, startBufferRow, endBufferRow, emptyLineFactory) {

  var offsetLineNumbers = Object.keys(lineOffsets).sort().map(function (lineNumber) {
    return parseInt(lineNumber, 10);
  });

  var priorScreenLine = startBufferRow;
  var newRegions = [];
  var newScreenLines = [];

  var captureScreenLinesRegion = function captureScreenLinesRegion(toScreenLine) {
    if (toScreenLine < priorScreenLine) {
      return;
    }
    var numberOfRows = toScreenLine - priorScreenLine;
    if (numberOfRows > 0) {
      // Add the portion of the original screenLines until toScreenLine.
      newScreenLines.push.apply(newScreenLines, screenLines.slice(priorScreenLine - startBufferRow, toScreenLine - startBufferRow));
      // This is normal 1 to 1 buffer to screen row region.
      newRegions.push({ bufferRows: numberOfRows, screenRows: numberOfRows });
    }
    priorScreenLine = toScreenLine + 1;
  };

  // Construct the new screen lines and regions, by adding empty lines at the offset lines
  // and returning ranges with screenRows = bufferRows + offsetLines.
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = offsetLineNumbers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var offsetLineNumber = _step.value;

      if (offsetLineNumber < priorScreenLine || offsetLineNumber >= endBufferRow) {
        continue;
      }
      var offsetLines = lineOffsets[offsetLineNumber];
      captureScreenLinesRegion(offsetLineNumber - 1);
      // Add empty screen lines to represent offsets.
      for (var i = 0; i < offsetLines; i++) {
        newScreenLines.push(emptyLineFactory());
      }
      var startOffsetBufferLineNumber = offsetLineNumber - startBufferRow - 1;
      // TODO: fix when we have more control on the buffer to screen line mapping
      // Currently, if we have offsets at the begining of the file, the gutter numbering would be confusing
      // because it considers the first offset line is the line to be numbered.
      if (startOffsetBufferLineNumber >= 0) {
        // The buffer line should be inserted above the empty offset lines added.
        newScreenLines.splice(newScreenLines.length - offsetLines, 0, screenLines[startOffsetBufferLineNumber]);
      } else {
        // startOffsetBufferLineNumber = -1 in case the offsets are in the begining of the file.
        newScreenLines.push(screenLines[0]);
        priorScreenLine++;
      }
      newRegions.push({ bufferRows: 1, screenRows: offsetLines + 1 });
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator['return']) {
        _iterator['return']();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  // Capture a single region to the end of the screen lines.
  captureScreenLinesRegion(endBufferRow);

  return { regions: newRegions, screenLines: newScreenLines };
}

module.exports = {
  buildLineRangesWithOffsets: buildLineRangesWithOffsets
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWRpZmYtdmlldy9saWIvZWRpdG9yLXV0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBdUJaLFNBQVMsMEJBQTBCLENBQy9CLFdBQXVCLEVBQ3ZCLFdBQWdCLEVBQ2hCLGNBQXNCLEVBQ3RCLFlBQW9CLEVBQ3BCLGdCQUEyQixFQUNGOztBQUUzQixNQUFJLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLFVBQUEsVUFBVTtXQUFJLFFBQVEsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDO0dBQUEsQ0FBQyxDQUFDOztBQUVwRyxNQUFJLGVBQWUsR0FBRyxjQUFjLENBQUM7QUFDckMsTUFBSSxVQUFVLEdBQUcsRUFBRSxDQUFDO0FBQ3BCLE1BQUksY0FBYyxHQUFHLEVBQUUsQ0FBQzs7QUFFeEIsTUFBSSx3QkFBd0IsR0FBRyxTQUEzQix3QkFBd0IsQ0FBSSxZQUFZLEVBQWE7QUFDdkQsUUFBSSxZQUFZLEdBQUcsZUFBZSxFQUFFO0FBQ2xDLGFBQU87S0FDUjtBQUNELFFBQUksWUFBWSxHQUFHLFlBQVksR0FBRyxlQUFlLENBQUM7QUFDbEQsUUFBSSxZQUFZLEdBQUcsQ0FBQyxFQUFFOztBQUVwQixvQkFBYyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxFQUFFLFdBQVcsQ0FBQyxLQUFLLENBQUMsZUFBZSxHQUFHLGNBQWMsRUFBRSxZQUFZLEdBQUcsY0FBYyxDQUFDLENBQUMsQ0FBQzs7QUFFOUgsZ0JBQVUsQ0FBQyxJQUFJLENBQUMsRUFBQyxVQUFVLEVBQUUsWUFBWSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUMsQ0FBQyxDQUFDO0tBQ3ZFO0FBQ0QsbUJBQWUsR0FBRyxZQUFZLEdBQUcsQ0FBQyxDQUFDO0dBQ3BDLENBQUM7Ozs7Ozs7OztBQUlGLHlCQUE2QixpQkFBaUIsOEhBQUU7VUFBdkMsZ0JBQWdCOztBQUN2QixVQUFJLGdCQUFnQixHQUFHLGVBQWUsSUFBSSxnQkFBZ0IsSUFBSSxZQUFZLEVBQUU7QUFDMUUsaUJBQVM7T0FDVjtBQUNELFVBQUksV0FBVyxHQUFHLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQ2hELDhCQUF3QixDQUFDLGdCQUFnQixHQUFHLENBQUMsQ0FBQyxDQUFDOztBQUUvQyxXQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsV0FBVyxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ3BDLHNCQUFjLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQztPQUN6QztBQUNELFVBQUksMkJBQTJCLEdBQUcsZ0JBQWdCLEdBQUcsY0FBYyxHQUFHLENBQUMsQ0FBQzs7OztBQUl4RSxVQUFJLDJCQUEyQixJQUFJLENBQUMsRUFBRTs7QUFFcEMsc0JBQWMsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sR0FBRyxXQUFXLEVBQUUsQ0FBQyxFQUFFLFdBQVcsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLENBQUM7T0FDekcsTUFBTTs7QUFFTCxzQkFBYyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwQyx1QkFBZSxFQUFFLENBQUM7T0FDbkI7QUFDRCxnQkFBVSxDQUFDLElBQUksQ0FBQyxFQUFDLFVBQVUsRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLFdBQVcsR0FBRyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0tBQy9EOzs7Ozs7Ozs7Ozs7Ozs7OztBQUdELDBCQUF3QixDQUFDLFlBQVksQ0FBQyxDQUFDOztBQUV2QyxTQUFPLEVBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFDLENBQUM7Q0FDM0Q7O0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRztBQUNmLDRCQUEwQixFQUExQiwwQkFBMEI7Q0FDM0IsQ0FBQyIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvbnVjbGlkZS1kaWZmLXZpZXcvbGliL2VkaXRvci11dGlscy5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbiB0eXBlIExpbmVSYW5nZXNXaXRoT2Zmc2V0cyA9IHtcbiAgcmVnaW9uczogQXJyYXk8e2J1ZmZlclJvd3M6IG51bWJlcjsgc2NyZWVuUm93czogbnVtYmVyfT47XG4gIHNjcmVlbkxpbmVzOiBBcnJheTxhbnk+O1xuIH07XG5cbi8qXG4gKiBAcGFyYW0gc2NyZWVuTGluZXMgVGhlIG9yaWdpbmFsIHNjcmVlbiBsaW5lcyBiZWZvcmUgYWRkaW5nIG9mZnNldHMuXG4gKiBAcGFyYW0gbGluZU9mZnNldHMgVGhlIG9mZnNldCBtYXAgZnJvbSBidWZmZXIgbGluZSBudW1iZXJzIHRvIHRoZSBudW1iZXIgb2YgbGluZXMgb2Ygb2Zmc2V0IHJlcXVlc3RlZCB0aGVyZS5cbiAqIEBwYXJhbSBzdGFydEJ1ZmZlclJvdyBUaGUgYnVmZmVyIHJvdyBhdCB3aGljaCB0aGUgbmV4dCByYW5nZSBvZiBzY3JlZW4gbGluZXMgaXMgc3RhcnRlZC5cbiAqIEBwYXJhbSBlbmRCdWZmZXJSb3cgVGhlIGJ1ZmZlciByb3cgYXQgd2hpY2ggdGhlIG5leHQgcmFuZ2Ugb2Ygc2NyZWVuIGxpbmVzIGlzIGVuZGVkLlxuICogQHBhcmFtIGVtcHR5TGluZUZhY3RvcnkgQSBjdXN0b20gZnVuY3Rpb24gdG8gY3JlYXRlIGEgbmV3IGVtcHR5IGxpbmUsIHJlcHJlc2VudGluZyBhbiBvZmZzZXQgc2NyZWVuIGxpbmUuXG4gKi9cbmZ1bmN0aW9uIGJ1aWxkTGluZVJhbmdlc1dpdGhPZmZzZXRzKFxuICAgIHNjcmVlbkxpbmVzOiBBcnJheTxhbnk+LFxuICAgIGxpbmVPZmZzZXRzOiBhbnksXG4gICAgc3RhcnRCdWZmZXJSb3c6IG51bWJlcixcbiAgICBlbmRCdWZmZXJSb3c6IG51bWJlcixcbiAgICBlbXB0eUxpbmVGYWN0b3J5OiAoKSA9PiBhbnlcbiAgICApOiBMaW5lUmFuZ2VzV2l0aE9mZnNldHMge1xuXG4gIHZhciBvZmZzZXRMaW5lTnVtYmVycyA9IE9iamVjdC5rZXlzKGxpbmVPZmZzZXRzKS5zb3J0KCkubWFwKGxpbmVOdW1iZXIgPT4gcGFyc2VJbnQobGluZU51bWJlciwgMTApKTtcblxuICB2YXIgcHJpb3JTY3JlZW5MaW5lID0gc3RhcnRCdWZmZXJSb3c7XG4gIHZhciBuZXdSZWdpb25zID0gW107XG4gIHZhciBuZXdTY3JlZW5MaW5lcyA9IFtdO1xuXG4gIHZhciBjYXB0dXJlU2NyZWVuTGluZXNSZWdpb24gPSAodG9TY3JlZW5MaW5lOiBudW1iZXIpID0+IHtcbiAgICBpZiAodG9TY3JlZW5MaW5lIDwgcHJpb3JTY3JlZW5MaW5lKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBudW1iZXJPZlJvd3MgPSB0b1NjcmVlbkxpbmUgLSBwcmlvclNjcmVlbkxpbmU7XG4gICAgaWYgKG51bWJlck9mUm93cyA+IDApIHtcbiAgICAgIC8vIEFkZCB0aGUgcG9ydGlvbiBvZiB0aGUgb3JpZ2luYWwgc2NyZWVuTGluZXMgdW50aWwgdG9TY3JlZW5MaW5lLlxuICAgICAgbmV3U2NyZWVuTGluZXMucHVzaC5hcHBseShuZXdTY3JlZW5MaW5lcywgc2NyZWVuTGluZXMuc2xpY2UocHJpb3JTY3JlZW5MaW5lIC0gc3RhcnRCdWZmZXJSb3csIHRvU2NyZWVuTGluZSAtIHN0YXJ0QnVmZmVyUm93KSk7XG4gICAgICAvLyBUaGlzIGlzIG5vcm1hbCAxIHRvIDEgYnVmZmVyIHRvIHNjcmVlbiByb3cgcmVnaW9uLlxuICAgICAgbmV3UmVnaW9ucy5wdXNoKHtidWZmZXJSb3dzOiBudW1iZXJPZlJvd3MsIHNjcmVlblJvd3M6IG51bWJlck9mUm93c30pO1xuICAgIH1cbiAgICBwcmlvclNjcmVlbkxpbmUgPSB0b1NjcmVlbkxpbmUgKyAxO1xuICB9O1xuXG4gIC8vIENvbnN0cnVjdCB0aGUgbmV3IHNjcmVlbiBsaW5lcyBhbmQgcmVnaW9ucywgYnkgYWRkaW5nIGVtcHR5IGxpbmVzIGF0IHRoZSBvZmZzZXQgbGluZXNcbiAgLy8gYW5kIHJldHVybmluZyByYW5nZXMgd2l0aCBzY3JlZW5Sb3dzID0gYnVmZmVyUm93cyArIG9mZnNldExpbmVzLlxuICBmb3IgKHZhciBvZmZzZXRMaW5lTnVtYmVyIG9mIG9mZnNldExpbmVOdW1iZXJzKSB7XG4gICAgaWYgKG9mZnNldExpbmVOdW1iZXIgPCBwcmlvclNjcmVlbkxpbmUgfHwgb2Zmc2V0TGluZU51bWJlciA+PSBlbmRCdWZmZXJSb3cpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICB2YXIgb2Zmc2V0TGluZXMgPSBsaW5lT2Zmc2V0c1tvZmZzZXRMaW5lTnVtYmVyXTtcbiAgICBjYXB0dXJlU2NyZWVuTGluZXNSZWdpb24ob2Zmc2V0TGluZU51bWJlciAtIDEpO1xuICAgIC8vIEFkZCBlbXB0eSBzY3JlZW4gbGluZXMgdG8gcmVwcmVzZW50IG9mZnNldHMuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvZmZzZXRMaW5lczsgaSsrKSB7XG4gICAgICBuZXdTY3JlZW5MaW5lcy5wdXNoKGVtcHR5TGluZUZhY3RvcnkoKSk7XG4gICAgfVxuICAgIHZhciBzdGFydE9mZnNldEJ1ZmZlckxpbmVOdW1iZXIgPSBvZmZzZXRMaW5lTnVtYmVyIC0gc3RhcnRCdWZmZXJSb3cgLSAxO1xuICAgIC8vIFRPRE86IGZpeCB3aGVuIHdlIGhhdmUgbW9yZSBjb250cm9sIG9uIHRoZSBidWZmZXIgdG8gc2NyZWVuIGxpbmUgbWFwcGluZ1xuICAgIC8vIEN1cnJlbnRseSwgaWYgd2UgaGF2ZSBvZmZzZXRzIGF0IHRoZSBiZWdpbmluZyBvZiB0aGUgZmlsZSwgdGhlIGd1dHRlciBudW1iZXJpbmcgd291bGQgYmUgY29uZnVzaW5nXG4gICAgLy8gYmVjYXVzZSBpdCBjb25zaWRlcnMgdGhlIGZpcnN0IG9mZnNldCBsaW5lIGlzIHRoZSBsaW5lIHRvIGJlIG51bWJlcmVkLlxuICAgIGlmIChzdGFydE9mZnNldEJ1ZmZlckxpbmVOdW1iZXIgPj0gMCkge1xuICAgICAgLy8gVGhlIGJ1ZmZlciBsaW5lIHNob3VsZCBiZSBpbnNlcnRlZCBhYm92ZSB0aGUgZW1wdHkgb2Zmc2V0IGxpbmVzIGFkZGVkLlxuICAgICAgbmV3U2NyZWVuTGluZXMuc3BsaWNlKG5ld1NjcmVlbkxpbmVzLmxlbmd0aCAtIG9mZnNldExpbmVzLCAwLCBzY3JlZW5MaW5lc1tzdGFydE9mZnNldEJ1ZmZlckxpbmVOdW1iZXJdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gc3RhcnRPZmZzZXRCdWZmZXJMaW5lTnVtYmVyID0gLTEgaW4gY2FzZSB0aGUgb2Zmc2V0cyBhcmUgaW4gdGhlIGJlZ2luaW5nIG9mIHRoZSBmaWxlLlxuICAgICAgbmV3U2NyZWVuTGluZXMucHVzaChzY3JlZW5MaW5lc1swXSk7XG4gICAgICBwcmlvclNjcmVlbkxpbmUrKztcbiAgICB9XG4gICAgbmV3UmVnaW9ucy5wdXNoKHtidWZmZXJSb3dzOiAxLCBzY3JlZW5Sb3dzOiBvZmZzZXRMaW5lcyArIDF9KTtcbiAgfVxuXG4gIC8vIENhcHR1cmUgYSBzaW5nbGUgcmVnaW9uIHRvIHRoZSBlbmQgb2YgdGhlIHNjcmVlbiBsaW5lcy5cbiAgY2FwdHVyZVNjcmVlbkxpbmVzUmVnaW9uKGVuZEJ1ZmZlclJvdyk7XG5cbiAgcmV0dXJuIHtyZWdpb25zOiBuZXdSZWdpb25zLCBzY3JlZW5MaW5lczogbmV3U2NyZWVuTGluZXN9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYnVpbGRMaW5lUmFuZ2VzV2l0aE9mZnNldHMsXG59O1xuIl19