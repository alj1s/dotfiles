'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

module.exports = Object.defineProperties({}, {
  ScriptBufferedProcess: {
    get: function get() {
      return require('./script-buffered-process');
    },
    configurable: true,
    enumerable: true
  },
  fileTypeClass: {
    get: function get() {
      return require('./file-type-class');
    },
    configurable: true,
    enumerable: true
  },
  goToLocation: {
    get: function get() {
      return require('./go-to-location');
    },
    configurable: true,
    enumerable: true
  },
  closeTabForBuffer: {
    get: function get() {
      return require('./close-tab-buffer');
    },
    configurable: true,
    enumerable: true
  },
  extractWordAtPosition: {
    get: function get() {
      return require('./extract-word-at-position');
    },
    configurable: true,
    enumerable: true
  },
  mouseListenerForTextEditor: {
    get: function get() {
      return require('./mouse-listener-for-text-editor');
    },
    configurable: true,
    enumerable: true
  },
  observeLanguageTextEditors: {
    get: function get() {
      return require('./observe-language-text-editors');
    },
    configurable: true,
    enumerable: true
  },
  observeGrammarForTextEditors: {
    get: function get() {
      return require('./observe-grammar-for-text-editors');
    },
    configurable: true,
    enumerable: true
  },
  sysinfo: {
    get: function get() {
      return require('./sysinfo');
    },
    configurable: true,
    enumerable: true
  }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtdHJlZS9ub2RlX21vZHVsZXMvbnVjbGlkZS1hdG9tLWhlbHBlcnMvbGliL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7OztBQVdaLE1BQU0sQ0FBQyxPQUFPLDJCQUFHLEVBb0NoQjtBQW5DSyx1QkFBcUI7U0FBQSxlQUFHO0FBQzFCLGFBQU8sT0FBTyxDQUFDLDJCQUEyQixDQUFDLENBQUM7S0FDN0M7Ozs7QUFFRyxlQUFhO1NBQUEsZUFBRztBQUNsQixhQUFPLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0tBQ3JDOzs7O0FBRUcsY0FBWTtTQUFBLGVBQUc7QUFDakIsYUFBTyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztLQUNwQzs7OztBQUVHLG1CQUFpQjtTQUFBLGVBQUc7QUFDdEIsYUFBTyxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQztLQUN0Qzs7OztBQUVHLHVCQUFxQjtTQUFBLGVBQUc7QUFDMUIsYUFBTyxPQUFPLENBQUMsNEJBQTRCLENBQUMsQ0FBQztLQUM5Qzs7OztBQUVHLDRCQUEwQjtTQUFBLGVBQUc7QUFDL0IsYUFBTyxPQUFPLENBQUMsa0NBQWtDLENBQUMsQ0FBQztLQUNwRDs7OztBQUVHLDRCQUEwQjtTQUFBLGVBQUc7QUFDL0IsYUFBTyxPQUFPLENBQUMsaUNBQWlDLENBQUMsQ0FBQztLQUNuRDs7OztBQUVHLDhCQUE0QjtTQUFBLGVBQUc7QUFDakMsYUFBTyxPQUFPLENBQUMsb0NBQW9DLENBQUMsQ0FBQztLQUN0RDs7OztBQUVHLFNBQU87U0FBQSxlQUFHO0FBQ1osYUFBTyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7S0FDN0I7Ozs7RUFDRixDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtdHJlZS9ub2RlX21vZHVsZXMvbnVjbGlkZS1hdG9tLWhlbHBlcnMvbGliL21haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ2V0IFNjcmlwdEJ1ZmZlcmVkUHJvY2VzcygpIHtcbiAgICByZXR1cm4gcmVxdWlyZSgnLi9zY3JpcHQtYnVmZmVyZWQtcHJvY2VzcycpO1xuICB9LFxuXG4gIGdldCBmaWxlVHlwZUNsYXNzKCkge1xuICAgIHJldHVybiByZXF1aXJlKCcuL2ZpbGUtdHlwZS1jbGFzcycpO1xuICB9LFxuXG4gIGdldCBnb1RvTG9jYXRpb24oKSB7XG4gICAgcmV0dXJuIHJlcXVpcmUoJy4vZ28tdG8tbG9jYXRpb24nKTtcbiAgfSxcblxuICBnZXQgY2xvc2VUYWJGb3JCdWZmZXIoKSB7XG4gICAgcmV0dXJuIHJlcXVpcmUoJy4vY2xvc2UtdGFiLWJ1ZmZlcicpO1xuICB9LFxuXG4gIGdldCBleHRyYWN0V29yZEF0UG9zaXRpb24oKSB7XG4gICAgcmV0dXJuIHJlcXVpcmUoJy4vZXh0cmFjdC13b3JkLWF0LXBvc2l0aW9uJyk7XG4gIH0sXG5cbiAgZ2V0IG1vdXNlTGlzdGVuZXJGb3JUZXh0RWRpdG9yKCkge1xuICAgIHJldHVybiByZXF1aXJlKCcuL21vdXNlLWxpc3RlbmVyLWZvci10ZXh0LWVkaXRvcicpO1xuICB9LFxuXG4gIGdldCBvYnNlcnZlTGFuZ3VhZ2VUZXh0RWRpdG9ycygpIHtcbiAgICByZXR1cm4gcmVxdWlyZSgnLi9vYnNlcnZlLWxhbmd1YWdlLXRleHQtZWRpdG9ycycpO1xuICB9LFxuXG4gIGdldCBvYnNlcnZlR3JhbW1hckZvclRleHRFZGl0b3JzKCkge1xuICAgIHJldHVybiByZXF1aXJlKCcuL29ic2VydmUtZ3JhbW1hci1mb3ItdGV4dC1lZGl0b3JzJyk7XG4gIH0sXG5cbiAgZ2V0IHN5c2luZm8oKSB7XG4gICAgcmV0dXJuIHJlcXVpcmUoJy4vc3lzaW5mbycpO1xuICB9LFxufTtcbiJdfQ==