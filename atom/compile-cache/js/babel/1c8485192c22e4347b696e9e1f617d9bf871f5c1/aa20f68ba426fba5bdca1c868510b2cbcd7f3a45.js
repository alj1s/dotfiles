'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

function extractWordAtPosition(editor, position, wordRegex) {
  if (!wordRegex) {
    wordRegex = editor.getLastCursor().wordRegExp();
  }
  var buffer = editor.getBuffer();
  var row = position.row;
  var column = position.column;

  var rowRange = buffer.rangeForRow(row);
  var matchData;
  // Extract the expression from the row text.
  buffer.scanInRange(wordRegex, rowRange, function (data) {
    var range = data.range;

    if (range.containsPoint(position)) {
      matchData = data;
    }
    // Stop the scan if the scanner has passed our position.
    if (range.end.column > column) {
      data.stop();
    }
  });
  if (matchData) {
    return {
      wordMatch: matchData.match,
      range: matchData.range
    };
  } else {
    return null;
  }
}

module.exports = extractWordAtPosition;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZsb3cvbm9kZV9tb2R1bGVzL251Y2xpZGUtYXRvbS1oZWxwZXJzL2xpYi9leHRyYWN0LXdvcmQtYXQtcG9zaXRpb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7OztBQVdaLFNBQVMscUJBQXFCLENBQzFCLE1BQXVCLEVBQ3ZCLFFBQW9CLEVBQ3BCLFNBQWtCLEVBQWlDO0FBQ3JELE1BQUksQ0FBQyxTQUFTLEVBQUU7QUFDZCxhQUFTLEdBQUcsTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUFDO0dBQ2pEO0FBQ0QsTUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO01BQzNCLEdBQUcsR0FBWSxRQUFRLENBQXZCLEdBQUc7TUFBRSxNQUFNLEdBQUksUUFBUSxDQUFsQixNQUFNOztBQUNoQixNQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZDLE1BQUksU0FBUyxDQUFDOztBQUVkLFFBQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxVQUFDLElBQUksRUFBSztRQUMzQyxLQUFLLEdBQUksSUFBSSxDQUFiLEtBQUs7O0FBQ1YsUUFBSSxLQUFLLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxFQUFFO0FBQ2pDLGVBQVMsR0FBRyxJQUFJLENBQUM7S0FDbEI7O0FBRUQsUUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxNQUFNLEVBQUU7QUFDN0IsVUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0tBQ2I7R0FDRixDQUFDLENBQUM7QUFDSCxNQUFJLFNBQVMsRUFBRTtBQUNiLFdBQU87QUFDTCxlQUFTLEVBQUUsU0FBUyxDQUFDLEtBQUs7QUFDMUIsV0FBSyxFQUFFLFNBQVMsQ0FBQyxLQUFLO0tBQ3ZCLENBQUM7R0FDSCxNQUFNO0FBQ0wsV0FBTyxJQUFJLENBQUM7R0FDYjtDQUNGOztBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUcscUJBQXFCLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL251Y2xpZGUtZmxvdy9ub2RlX21vZHVsZXMvbnVjbGlkZS1hdG9tLWhlbHBlcnMvbGliL2V4dHJhY3Qtd29yZC1hdC1wb3NpdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbmZ1bmN0aW9uIGV4dHJhY3RXb3JkQXRQb3NpdGlvbihcbiAgICBlZGl0b3I6IGF0b20kVGV4dEVkaXRvcixcbiAgICBwb3NpdGlvbjogYXRvbSRQb2ludCxcbiAgICB3b3JkUmVnZXg6ID9SZWdFeHApOiA/e3dvcmQ6IHN0cmluZzsgcmFuZ2U6IFJhbmdlfSB7XG4gIGlmICghd29yZFJlZ2V4KSB7XG4gICAgd29yZFJlZ2V4ID0gZWRpdG9yLmdldExhc3RDdXJzb3IoKS53b3JkUmVnRXhwKCk7XG4gIH1cbiAgdmFyIGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKTtcbiAgdmFyIHtyb3csIGNvbHVtbn0gPSBwb3NpdGlvbjtcbiAgdmFyIHJvd1JhbmdlID0gYnVmZmVyLnJhbmdlRm9yUm93KHJvdyk7XG4gIHZhciBtYXRjaERhdGE7XG4gIC8vIEV4dHJhY3QgdGhlIGV4cHJlc3Npb24gZnJvbSB0aGUgcm93IHRleHQuXG4gIGJ1ZmZlci5zY2FuSW5SYW5nZSh3b3JkUmVnZXgsIHJvd1JhbmdlLCAoZGF0YSkgPT4ge1xuICAgIHZhciB7cmFuZ2V9ID0gZGF0YTtcbiAgICBpZiAocmFuZ2UuY29udGFpbnNQb2ludChwb3NpdGlvbikpIHtcbiAgICAgIG1hdGNoRGF0YSA9IGRhdGE7XG4gICAgfVxuICAgIC8vIFN0b3AgdGhlIHNjYW4gaWYgdGhlIHNjYW5uZXIgaGFzIHBhc3NlZCBvdXIgcG9zaXRpb24uXG4gICAgaWYgKHJhbmdlLmVuZC5jb2x1bW4gPiBjb2x1bW4pIHtcbiAgICAgIGRhdGEuc3RvcCgpO1xuICAgIH1cbiAgfSk7XG4gIGlmIChtYXRjaERhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgd29yZE1hdGNoOiBtYXRjaERhdGEubWF0Y2gsXG4gICAgICByYW5nZTogbWF0Y2hEYXRhLnJhbmdlLFxuICAgIH07XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBleHRyYWN0V29yZEF0UG9zaXRpb247XG4iXX0=