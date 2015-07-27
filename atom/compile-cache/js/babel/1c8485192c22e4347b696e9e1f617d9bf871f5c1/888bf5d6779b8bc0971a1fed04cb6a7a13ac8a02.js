'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var DiffViewModel = require('../lib/DiffViewModel');

describe('DiffViewModel', function () {
  describe('computeDiff()', function () {
    var model = null;

    beforeEach(function () {
      model = new DiffViewModel();
    });

    afterEach(function () {
      model = null;
    });

    it('diffs two empty texts', function () {
      var _model$computeDiff = model.computeDiff('', '');

      var addedLines = _model$computeDiff.addedLines;
      var removedLines = _model$computeDiff.removedLines;
      var oldLineOffsets = _model$computeDiff.oldLineOffsets;
      var newLineOffsets = _model$computeDiff.newLineOffsets;

      expect(addedLines).toEqual([]);
      expect(removedLines).toEqual([]);
      expect(oldLineOffsets).toEqual({});
      expect(newLineOffsets).toEqual({});
    });

    it('diffs simple text with one line changes', function () {
      var _model$computeDiff2 = model.computeDiff('simple text\non multiline\nsame end line', 'on multiline\nadded text\nsame end line');

      var addedLines = _model$computeDiff2.addedLines;
      var removedLines = _model$computeDiff2.removedLines;
      var oldLineOffsets = _model$computeDiff2.oldLineOffsets;
      var newLineOffsets = _model$computeDiff2.newLineOffsets;

      expect(addedLines).toEqual([1]); // the second line is newly added.
      expect(removedLines).toEqual([0]); // the first line was removed.
      expect(oldLineOffsets).toEqual({ 2: 1 }); // offset 1 for the new added line.
      expect(newLineOffsets).toEqual({ 0: 1 }); // offset 1 for the first removed line.
    });

    it('diffs multi-line text changes', function () {
      var _model$computeDiff3 = model.computeDiff('This text is intended for testing.\nIf we test at too low a level,\ntesting for matching tags\nwith pattern matching,\nour tests will be BAD.\nThe slightest change in layout,\ncould break a large number of tests.\n', 'This text is intended for testing.\nwith pattern matching,\nadding different two lines\nreplacing the two lines removed above!\nour tests will be BAD.\nThe slightest change in layout,\ncould break a large number of tests.\nadding a non-new-line line');

      var addedLines = _model$computeDiff3.addedLines;
      var removedLines = _model$computeDiff3.removedLines;
      var oldLineOffsets = _model$computeDiff3.oldLineOffsets;
      var newLineOffsets = _model$computeDiff3.newLineOffsets;

      expect(addedLines).toEqual([2, 3, 7]); // 2 lines were added in the middle and one at the end.
      expect(removedLines).toEqual([1, 2, 7]); // 2 lines were removed in the middle and last new-line replaced.
      expect(oldLineOffsets).toEqual({ 4: 2 }); // offset 2 for the 2 lines added after the sync line.
      expect(newLineOffsets).toEqual({ 1: 2 }); // offset 2 for the 2 lines removed before the sync line.
    });
  });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWRpZmYtdmlldy9zcGVjL0RpZmZWaWV3TW9kZWwtc3BlYy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7O0FBV1osSUFBSSxhQUFhLEdBQUcsT0FBTyxDQUFDLHNCQUFzQixDQUFDLENBQUM7O0FBRXBELFFBQVEsQ0FBQyxlQUFlLEVBQUUsWUFBTTtBQUM5QixVQUFRLENBQUMsZUFBZSxFQUFFLFlBQU07QUFDOUIsUUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDOztBQUVqQixjQUFVLENBQUMsWUFBTTtBQUNmLFdBQUssR0FBRyxJQUFJLGFBQWEsRUFBRSxDQUFDO0tBQzdCLENBQUMsQ0FBQzs7QUFFSCxhQUFTLENBQUMsWUFBTTtBQUNkLFdBQUssR0FBRyxJQUFJLENBQUM7S0FDZCxDQUFDLENBQUM7O0FBRUgsTUFBRSxDQUFDLHVCQUF1QixFQUFFLFlBQU07K0JBQ2lDLEtBQUssQ0FBQyxXQUFXLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQzs7VUFBckYsVUFBVSxzQkFBVixVQUFVO1VBQUUsWUFBWSxzQkFBWixZQUFZO1VBQUUsY0FBYyxzQkFBZCxjQUFjO1VBQUUsY0FBYyxzQkFBZCxjQUFjOztBQUM3RCxZQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQy9CLFlBQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDakMsWUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNuQyxZQUFNLENBQUMsY0FBYyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0tBQ3BDLENBQUMsQ0FBQzs7QUFFSCxNQUFFLENBQUMseUNBQXlDLEVBQUUsWUFBTTtnQ0FDZSxLQUFLLENBQUMsV0FBVyx1RkFPakY7O1VBUEksVUFBVSx1QkFBVixVQUFVO1VBQUUsWUFBWSx1QkFBWixZQUFZO1VBQUUsY0FBYyx1QkFBZCxjQUFjO1VBQUUsY0FBYyx1QkFBZCxjQUFjOztBQVM3RCxZQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoQyxZQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsQyxZQUFNLENBQUMsY0FBYyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUMsQ0FBQyxFQUFFLENBQUMsRUFBQyxDQUFDLENBQUM7QUFDdkMsWUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFDLENBQUMsRUFBRSxDQUFDLEVBQUMsQ0FBQyxDQUFDO0tBQ3hDLENBQUMsQ0FBQzs7QUFFSCxNQUFFLENBQUMsK0JBQStCLEVBQUUsWUFBTTtnQ0FDeUIsS0FBSyxDQUFDLFdBQVcsdWRBZ0JqRjs7VUFoQkksVUFBVSx1QkFBVixVQUFVO1VBQUUsWUFBWSx1QkFBWixZQUFZO1VBQUUsY0FBYyx1QkFBZCxjQUFjO1VBQUUsY0FBYyx1QkFBZCxjQUFjOztBQWtCN0QsWUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0QyxZQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3hDLFlBQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBQyxDQUFDLEVBQUUsQ0FBQyxFQUFDLENBQUMsQ0FBQztBQUN2QyxZQUFNLENBQUMsY0FBYyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUMsQ0FBQyxFQUFFLENBQUMsRUFBQyxDQUFDLENBQUM7S0FDeEMsQ0FBQyxDQUFDO0dBRUosQ0FBQyxDQUFDO0NBQ0osQ0FBQyxDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWRpZmYtdmlldy9zcGVjL0RpZmZWaWV3TW9kZWwtc3BlYy5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbnZhciBEaWZmVmlld01vZGVsID0gcmVxdWlyZSgnLi4vbGliL0RpZmZWaWV3TW9kZWwnKTtcblxuZGVzY3JpYmUoJ0RpZmZWaWV3TW9kZWwnLCAoKSA9PiB7XG4gIGRlc2NyaWJlKCdjb21wdXRlRGlmZigpJywgKCkgPT4ge1xuICAgIHZhciBtb2RlbCA9IG51bGw7XG5cbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIG1vZGVsID0gbmV3IERpZmZWaWV3TW9kZWwoKTtcbiAgICB9KTtcblxuICAgIGFmdGVyRWFjaCgoKSA9PiB7XG4gICAgICBtb2RlbCA9IG51bGw7XG4gICAgfSk7XG5cbiAgICBpdCgnZGlmZnMgdHdvIGVtcHR5IHRleHRzJywgKCkgPT4ge1xuICAgICAgdmFyIHthZGRlZExpbmVzLCByZW1vdmVkTGluZXMsIG9sZExpbmVPZmZzZXRzLCBuZXdMaW5lT2Zmc2V0c30gPSBtb2RlbC5jb21wdXRlRGlmZignJywgJycpO1xuICAgICAgZXhwZWN0KGFkZGVkTGluZXMpLnRvRXF1YWwoW10pO1xuICAgICAgZXhwZWN0KHJlbW92ZWRMaW5lcykudG9FcXVhbChbXSk7XG4gICAgICBleHBlY3Qob2xkTGluZU9mZnNldHMpLnRvRXF1YWwoe30pO1xuICAgICAgZXhwZWN0KG5ld0xpbmVPZmZzZXRzKS50b0VxdWFsKHt9KTtcbiAgICB9KTtcblxuICAgIGl0KCdkaWZmcyBzaW1wbGUgdGV4dCB3aXRoIG9uZSBsaW5lIGNoYW5nZXMnLCAoKSA9PiB7XG4gICAgICB2YXIge2FkZGVkTGluZXMsIHJlbW92ZWRMaW5lcywgb2xkTGluZU9mZnNldHMsIG5ld0xpbmVPZmZzZXRzfSA9IG1vZGVsLmNvbXB1dGVEaWZmKFxuYHNpbXBsZSB0ZXh0XG5vbiBtdWx0aWxpbmVcbnNhbWUgZW5kIGxpbmVgLFxuYG9uIG11bHRpbGluZVxuYWRkZWQgdGV4dFxuc2FtZSBlbmQgbGluZWBcbiAgICAgICk7XG5cbiAgICAgIGV4cGVjdChhZGRlZExpbmVzKS50b0VxdWFsKFsxXSk7IC8vIHRoZSBzZWNvbmQgbGluZSBpcyBuZXdseSBhZGRlZC5cbiAgICAgIGV4cGVjdChyZW1vdmVkTGluZXMpLnRvRXF1YWwoWzBdKTsgLy8gdGhlIGZpcnN0IGxpbmUgd2FzIHJlbW92ZWQuXG4gICAgICBleHBlY3Qob2xkTGluZU9mZnNldHMpLnRvRXF1YWwoezI6IDF9KTsgLy8gb2Zmc2V0IDEgZm9yIHRoZSBuZXcgYWRkZWQgbGluZS5cbiAgICAgIGV4cGVjdChuZXdMaW5lT2Zmc2V0cykudG9FcXVhbCh7MDogMX0pOyAvLyBvZmZzZXQgMSBmb3IgdGhlIGZpcnN0IHJlbW92ZWQgbGluZS5cbiAgICB9KTtcblxuICAgIGl0KCdkaWZmcyBtdWx0aS1saW5lIHRleHQgY2hhbmdlcycsICgpID0+IHtcbiAgICAgIHZhciB7YWRkZWRMaW5lcywgcmVtb3ZlZExpbmVzLCBvbGRMaW5lT2Zmc2V0cywgbmV3TGluZU9mZnNldHN9ID0gbW9kZWwuY29tcHV0ZURpZmYoXG5gVGhpcyB0ZXh0IGlzIGludGVuZGVkIGZvciB0ZXN0aW5nLlxuSWYgd2UgdGVzdCBhdCB0b28gbG93IGEgbGV2ZWwsXG50ZXN0aW5nIGZvciBtYXRjaGluZyB0YWdzXG53aXRoIHBhdHRlcm4gbWF0Y2hpbmcsXG5vdXIgdGVzdHMgd2lsbCBiZSBCQUQuXG5UaGUgc2xpZ2h0ZXN0IGNoYW5nZSBpbiBsYXlvdXQsXG5jb3VsZCBicmVhayBhIGxhcmdlIG51bWJlciBvZiB0ZXN0cy5cbmAsIGBUaGlzIHRleHQgaXMgaW50ZW5kZWQgZm9yIHRlc3RpbmcuXG53aXRoIHBhdHRlcm4gbWF0Y2hpbmcsXG5hZGRpbmcgZGlmZmVyZW50IHR3byBsaW5lc1xucmVwbGFjaW5nIHRoZSB0d28gbGluZXMgcmVtb3ZlZCBhYm92ZSFcbm91ciB0ZXN0cyB3aWxsIGJlIEJBRC5cblRoZSBzbGlnaHRlc3QgY2hhbmdlIGluIGxheW91dCxcbmNvdWxkIGJyZWFrIGEgbGFyZ2UgbnVtYmVyIG9mIHRlc3RzLlxuYWRkaW5nIGEgbm9uLW5ldy1saW5lIGxpbmVgXG4gICAgICApO1xuXG4gICAgICBleHBlY3QoYWRkZWRMaW5lcykudG9FcXVhbChbMiwgMywgN10pOyAvLyAyIGxpbmVzIHdlcmUgYWRkZWQgaW4gdGhlIG1pZGRsZSBhbmQgb25lIGF0IHRoZSBlbmQuXG4gICAgICBleHBlY3QocmVtb3ZlZExpbmVzKS50b0VxdWFsKFsxLCAyLCA3XSk7IC8vIDIgbGluZXMgd2VyZSByZW1vdmVkIGluIHRoZSBtaWRkbGUgYW5kIGxhc3QgbmV3LWxpbmUgcmVwbGFjZWQuXG4gICAgICBleHBlY3Qob2xkTGluZU9mZnNldHMpLnRvRXF1YWwoezQ6IDJ9KTsgLy8gb2Zmc2V0IDIgZm9yIHRoZSAyIGxpbmVzIGFkZGVkIGFmdGVyIHRoZSBzeW5jIGxpbmUuXG4gICAgICBleHBlY3QobmV3TGluZU9mZnNldHMpLnRvRXF1YWwoezE6IDJ9KTsgLy8gb2Zmc2V0IDIgZm9yIHRoZSAyIGxpbmVzIHJlbW92ZWQgYmVmb3JlIHRoZSBzeW5jIGxpbmUuXG4gICAgfSk7XG5cbiAgfSk7XG59KTtcbiJdfQ==