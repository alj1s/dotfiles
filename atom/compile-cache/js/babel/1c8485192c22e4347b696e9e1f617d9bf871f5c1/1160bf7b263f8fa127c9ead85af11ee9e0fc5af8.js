'use babel';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _require = require('nuclide-test-helpers');

var uncachedRequire = _require.uncachedRequire;
var spyOnGetterValue = _require.spyOnGetterValue;

var _require2 = require('atom');

var Range = _require2.Range;

var TYPE_HINT_PROVIDER = '../lib/TypeHintProvider';

describe('TypeHintProvider.js', function () {
  var runWith = _asyncToGenerator(function* (enabled, type, word) {
    spyOn(require('nuclide-commons'), 'getConfigValueAsync').andReturn(function () {
      return Promise.resolve(enabled);
    });
    spyOn(require('nuclide-client'), 'getServiceByNuclideUri').andReturn({
      getType: function getType() {
        return Promise.resolve(type);
      }
    });
    spyOnGetterValue(require('nuclide-atom-helpers'), 'extractWordAtPosition').andReturn(word);

    typeHintProvider = new (uncachedRequire(require, TYPE_HINT_PROVIDER))();
    return yield typeHintProvider.typeHint(editor, position);
  });

  var editor = {
    getPath: function getPath() {
      return '';
    },
    getText: function getText() {
      return '';
    }
  };
  var position = [1, 1];
  var range = new Range([1, 2], [3, 4]);

  var typeHintProvider;

  afterEach(function () {
    // we assume here that runWith is called in every spec -- otherwise these
    // will not be spies
    jasmine.unspy(require('nuclide-atom-helpers'), 'extractWordAtPosition');
    jasmine.unspy(require('nuclide-commons'), 'getConfigValueAsync');
    jasmine.unspy(require('nuclide-client'), 'getServiceByNuclideUri');
  });

  it('should return null when disabled', function () {
    waitsForPromise(_asyncToGenerator(function* () {
      expect((yield runWith(false, 'foo', { range: range }))).toBe(null);
    }));
  });

  it('should return the type', function () {
    waitsForPromise(_asyncToGenerator(function* () {
      expect((yield runWith(true, 'foo', { range: range })).hint).toBe('foo');
    }));
  });

  it('should return the range', function () {
    waitsForPromise(_asyncToGenerator(function* () {
      expect((yield runWith(true, 'foo', { range: range })).range).toBe(range);
    }));
  });

  it('should return null when the type is null', function () {
    waitsForPromise(_asyncToGenerator(function* () {
      expect((yield runWith(true, null, { range: range }))).toBe(null);
    }));
  });

  it('should return a default range when the word is null', function () {
    waitsForPromise(_asyncToGenerator(function* () {
      expect((yield runWith(true, 'foo', null)).range).toEqual(new Range(position, position));
    }));
  });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZsb3cvc3BlYy9UeXBlSGludFByb3ZpZGVyLXNwZWMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7OztlQVc4QixPQUFPLENBQUMsc0JBQXNCLENBQUM7O0lBQXBFLGVBQWUsWUFBZixlQUFlO0lBQUUsZ0JBQWdCLFlBQWhCLGdCQUFnQjs7Z0JBQ3hCLE9BQU8sQ0FBQyxNQUFNLENBQUM7O0lBQXhCLEtBQUssYUFBTCxLQUFLOztBQUVWLElBQU0sa0JBQWtCLEdBQUcseUJBQXlCLENBQUM7O0FBRXJELFFBQVEsQ0FBQyxxQkFBcUIsRUFBRSxZQUFNO01Ba0JyQixPQUFPLHFCQUF0QixXQUF1QixPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRTtBQUMxQyxTQUFLLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLEVBQUUscUJBQXFCLENBQUMsQ0FDckQsU0FBUyxDQUFDO2FBQU0sT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUM7S0FBQSxDQUFDLENBQUM7QUFDN0MsU0FBSyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLHdCQUF3QixDQUFDLENBQUMsU0FBUyxDQUFDO0FBQ25FLGFBQU8sRUFBQSxtQkFBRztBQUFFLGVBQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztPQUFFO0tBQzVDLENBQUMsQ0FBQztBQUNILG9CQUFnQixDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxFQUFFLHVCQUF1QixDQUFDLENBQ3ZFLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7QUFFbkIsb0JBQWdCLEdBQUcsS0FBSyxlQUFlLENBQUMsT0FBTyxFQUFFLGtCQUFrQixFQUFDLEVBQUcsQ0FBQztBQUN4RSxXQUFPLE1BQU0sZ0JBQWdCLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztHQUMxRDs7QUE1QkQsTUFBSSxNQUFNLEdBQUc7QUFDWCxXQUFPLEVBQUEsbUJBQUc7QUFBRSxhQUFPLEVBQUUsQ0FBQztLQUFFO0FBQ3hCLFdBQU8sRUFBQSxtQkFBRztBQUFFLGFBQU8sRUFBRSxDQUFDO0tBQUU7R0FDekIsQ0FBQztBQUNGLE1BQUksUUFBUSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3RCLE1BQUksS0FBSyxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRXRDLE1BQUksZ0JBQWdCLENBQUM7O0FBRXJCLFdBQVMsQ0FBQyxZQUFNOzs7QUFHZCxXQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxFQUFFLHVCQUF1QixDQUFDLENBQUM7QUFDeEUsV0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO0FBQ2pFLFdBQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztHQUNwRSxDQUFDLENBQUM7O0FBZUgsSUFBRSxDQUFDLGtDQUFrQyxFQUFFLFlBQU07QUFDM0MsbUJBQWUsbUJBQUMsYUFBWTtBQUMxQixZQUFNLEVBQUMsTUFBTSxPQUFPLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxFQUFDLEtBQUssRUFBTCxLQUFLLEVBQUMsQ0FBQyxDQUFBLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDekQsRUFBQyxDQUFDO0dBQ0osQ0FBQyxDQUFDOztBQUVILElBQUUsQ0FBQyx3QkFBd0IsRUFBRSxZQUFNO0FBQ2pDLG1CQUFlLG1CQUFDLGFBQVk7QUFDMUIsWUFBTSxDQUFDLENBQUMsTUFBTSxPQUFPLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFDLEtBQUssRUFBTCxLQUFLLEVBQUMsQ0FBQyxDQUFBLENBQUUsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ2hFLEVBQUMsQ0FBQztHQUNKLENBQUMsQ0FBQzs7QUFFSCxJQUFFLENBQUMseUJBQXlCLEVBQUUsWUFBTTtBQUNsQyxtQkFBZSxtQkFBQyxhQUFZO0FBQzFCLFlBQU0sQ0FBQyxDQUFDLE1BQU0sT0FBTyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsRUFBQyxLQUFLLEVBQUwsS0FBSyxFQUFDLENBQUMsQ0FBQSxDQUFFLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUNqRSxFQUFDLENBQUM7R0FDSixDQUFDLENBQUM7O0FBRUgsSUFBRSxDQUFDLDBDQUEwQyxFQUFFLFlBQU07QUFDbkQsbUJBQWUsbUJBQUMsYUFBWTtBQUMxQixZQUFNLEVBQUMsTUFBTSxPQUFPLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFDLEtBQUssRUFBTCxLQUFLLEVBQUMsQ0FBQyxDQUFBLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDdkQsRUFBQyxDQUFDO0dBQ0osQ0FBQyxDQUFDOztBQUVILElBQUUsQ0FBQyxxREFBcUQsRUFBRSxZQUFNO0FBQzlELG1CQUFlLG1CQUFDLGFBQVk7QUFDMUIsWUFBTSxDQUFDLENBQUMsTUFBTSxPQUFPLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQSxDQUFFLEtBQUssQ0FBQyxDQUM3QyxPQUFPLENBQUMsSUFBSSxLQUFLLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7S0FDM0MsRUFBQyxDQUFDO0dBQ0osQ0FBQyxDQUFDO0NBQ0osQ0FBQyxDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZsb3cvc3BlYy9UeXBlSGludFByb3ZpZGVyLXNwZWMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIge3VuY2FjaGVkUmVxdWlyZSwgc3B5T25HZXR0ZXJWYWx1ZX0gPSByZXF1aXJlKCdudWNsaWRlLXRlc3QtaGVscGVycycpO1xudmFyIHtSYW5nZX0gPSByZXF1aXJlKCdhdG9tJyk7XG5cbmNvbnN0IFRZUEVfSElOVF9QUk9WSURFUiA9ICcuLi9saWIvVHlwZUhpbnRQcm92aWRlcic7XG5cbmRlc2NyaWJlKCdUeXBlSGludFByb3ZpZGVyLmpzJywgKCkgPT4ge1xuICB2YXIgZWRpdG9yID0ge1xuICAgIGdldFBhdGgoKSB7IHJldHVybiAnJzsgfSxcbiAgICBnZXRUZXh0KCkgeyByZXR1cm4gJyc7IH0sXG4gIH07XG4gIHZhciBwb3NpdGlvbiA9IFsxLCAxXTtcbiAgdmFyIHJhbmdlID0gbmV3IFJhbmdlKFsxLCAyXSwgWzMsIDRdKTtcblxuICB2YXIgdHlwZUhpbnRQcm92aWRlcjtcblxuICBhZnRlckVhY2goKCkgPT4ge1xuICAgIC8vIHdlIGFzc3VtZSBoZXJlIHRoYXQgcnVuV2l0aCBpcyBjYWxsZWQgaW4gZXZlcnkgc3BlYyAtLSBvdGhlcndpc2UgdGhlc2VcbiAgICAvLyB3aWxsIG5vdCBiZSBzcGllc1xuICAgIGphc21pbmUudW5zcHkocmVxdWlyZSgnbnVjbGlkZS1hdG9tLWhlbHBlcnMnKSwgJ2V4dHJhY3RXb3JkQXRQb3NpdGlvbicpO1xuICAgIGphc21pbmUudW5zcHkocmVxdWlyZSgnbnVjbGlkZS1jb21tb25zJyksICdnZXRDb25maWdWYWx1ZUFzeW5jJyk7XG4gICAgamFzbWluZS51bnNweShyZXF1aXJlKCdudWNsaWRlLWNsaWVudCcpLCAnZ2V0U2VydmljZUJ5TnVjbGlkZVVyaScpO1xuICB9KTtcblxuICBhc3luYyBmdW5jdGlvbiBydW5XaXRoKGVuYWJsZWQsIHR5cGUsIHdvcmQpIHtcbiAgICBzcHlPbihyZXF1aXJlKCdudWNsaWRlLWNvbW1vbnMnKSwgJ2dldENvbmZpZ1ZhbHVlQXN5bmMnKVxuICAgICAgLmFuZFJldHVybigoKSA9PiBQcm9taXNlLnJlc29sdmUoZW5hYmxlZCkpO1xuICAgIHNweU9uKHJlcXVpcmUoJ251Y2xpZGUtY2xpZW50JyksICdnZXRTZXJ2aWNlQnlOdWNsaWRlVXJpJykuYW5kUmV0dXJuKHtcbiAgICAgIGdldFR5cGUoKSB7IHJldHVybiBQcm9taXNlLnJlc29sdmUodHlwZSk7IH0sXG4gICAgfSk7XG4gICAgc3B5T25HZXR0ZXJWYWx1ZShyZXF1aXJlKCdudWNsaWRlLWF0b20taGVscGVycycpLCAnZXh0cmFjdFdvcmRBdFBvc2l0aW9uJylcbiAgICAgIC5hbmRSZXR1cm4od29yZCk7XG5cbiAgICB0eXBlSGludFByb3ZpZGVyID0gbmV3ICh1bmNhY2hlZFJlcXVpcmUocmVxdWlyZSwgVFlQRV9ISU5UX1BST1ZJREVSKSkoKTtcbiAgICByZXR1cm4gYXdhaXQgdHlwZUhpbnRQcm92aWRlci50eXBlSGludChlZGl0b3IsIHBvc2l0aW9uKTtcbiAgfVxuXG4gIGl0KCdzaG91bGQgcmV0dXJuIG51bGwgd2hlbiBkaXNhYmxlZCcsICgpID0+IHtcbiAgICB3YWl0c0ZvclByb21pc2UoYXN5bmMgKCkgPT4ge1xuICAgICAgZXhwZWN0KGF3YWl0IHJ1bldpdGgoZmFsc2UsICdmb28nLCB7cmFuZ2V9KSkudG9CZShudWxsKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCByZXR1cm4gdGhlIHR5cGUnLCAoKSA9PiB7XG4gICAgd2FpdHNGb3JQcm9taXNlKGFzeW5jICgpID0+IHtcbiAgICAgIGV4cGVjdCgoYXdhaXQgcnVuV2l0aCh0cnVlLCAnZm9vJywge3JhbmdlfSkpLmhpbnQpLnRvQmUoJ2ZvbycpO1xuICAgIH0pO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIHJldHVybiB0aGUgcmFuZ2UnLCAoKSA9PiB7XG4gICAgd2FpdHNGb3JQcm9taXNlKGFzeW5jICgpID0+IHtcbiAgICAgIGV4cGVjdCgoYXdhaXQgcnVuV2l0aCh0cnVlLCAnZm9vJywge3JhbmdlfSkpLnJhbmdlKS50b0JlKHJhbmdlKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgaXQoJ3Nob3VsZCByZXR1cm4gbnVsbCB3aGVuIHRoZSB0eXBlIGlzIG51bGwnLCAoKSA9PiB7XG4gICAgd2FpdHNGb3JQcm9taXNlKGFzeW5jICgpID0+IHtcbiAgICAgIGV4cGVjdChhd2FpdCBydW5XaXRoKHRydWUsIG51bGwsIHtyYW5nZX0pKS50b0JlKG51bGwpO1xuICAgIH0pO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIHJldHVybiBhIGRlZmF1bHQgcmFuZ2Ugd2hlbiB0aGUgd29yZCBpcyBudWxsJywgKCkgPT4ge1xuICAgIHdhaXRzRm9yUHJvbWlzZShhc3luYyAoKSA9PiB7XG4gICAgICBleHBlY3QoKGF3YWl0IHJ1bldpdGgodHJ1ZSwgJ2ZvbycsIG51bGwpKS5yYW5nZSlcbiAgICAgICAgLnRvRXF1YWwobmV3IFJhbmdlKHBvc2l0aW9uLCBwb3NpdGlvbikpO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl19