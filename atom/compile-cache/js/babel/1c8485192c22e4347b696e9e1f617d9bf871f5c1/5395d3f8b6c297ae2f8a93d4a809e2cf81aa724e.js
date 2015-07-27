'use babel';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var React = require('react-for-atom');
var QuickSelectionComponent = require('../lib/QuickSelectionComponent');
var QuickSelectionProvider = require('../lib/QuickSelectionProvider');

var TestQuickSelectionProvider = (function (_QuickSelectionProvider) {
  function TestQuickSelectionProvider(items) {
    _classCallCheck(this, TestQuickSelectionProvider);

    _get(Object.getPrototypeOf(TestQuickSelectionProvider.prototype), 'constructor', this).call(this);
    this._items = items;
  }

  _inherits(TestQuickSelectionProvider, _QuickSelectionProvider);

  _createClass(TestQuickSelectionProvider, [{
    key: 'getPromptText',
    value: function getPromptText() {
      return 'test';
    }
  }, {
    key: 'executeQuery',
    value: function executeQuery(query) {
      return Promise.resolve(this._items);
    }
  }]);

  return TestQuickSelectionProvider;
})(QuickSelectionProvider);

describe('QuickSelectionComponent', function () {
  var componentRoot;
  var component;

  beforeEach(function () {
    spyOn(Date, 'now').andCallFake(function () {
      return window.now;
    });

    componentRoot = document.createElement('div');
    document.body.appendChild(componentRoot);

    var testProvider = new TestQuickSelectionProvider({});
    component = React.render(React.createElement(QuickSelectionComponent, { provider: testProvider }), componentRoot);
  });

  afterEach(function () {
    React.unmountComponentAtNode(componentRoot);
    document.body.removeChild(componentRoot);
  });

  // Updates the component to be using a TestQuickSelectionProvider that will serve @items, then
  // executes @callback after the component has completely updated to be using the new provider.
  function withItemsSetTo(items, callback) {
    waitsForPromise(function () {
      return new Promise(function (resolve, reject) {

        component.onItemsChanged(function (newItems) {
          resolve(component);
        });
        component = React.render(React.createElement(QuickSelectionComponent, { provider: new TestQuickSelectionProvider(items) }), componentRoot);
        window.advanceClock(250);

        component.clear();
      }).then(callback);
    });
  }

  describe('Confirmation', function () {
    it('should return the selected item on selection', function () {
      withItemsSetTo({ testDirectory: { testProvider: Promise.resolve({ results: [1, 2, 3] }) } }, function () {

        var selectedItemIndex = component.getSelectedIndex();
        expect(selectedItemIndex.selectedDirectory).toBe('');
        expect(selectedItemIndex.selectedService).toBe('');
        expect(selectedItemIndex.selectedItemIndex).toBe(-1);

        waitsForPromise(function () {
          return new Promise(function (resolve, reject) {
            component.onSelection(function (item) {
              expect(item).toBe(1);
              resolve();
            });

            component.moveSelectionDown();
            component.select();
          });
        });
      });
    });

    it('should select on the core:confirm command (enter)', function () {
      withItemsSetTo({ testDirectory: { testProvider: Promise.resolve({ results: [1, 2, 3] }) } }, function () {
        var componentNode = component.getDOMNode();

        var selectedItemIndex = component.getSelectedIndex();
        expect(selectedItemIndex.selectedDirectory).toBe('');
        expect(selectedItemIndex.selectedService).toBe('');
        expect(selectedItemIndex.selectedItemIndex).toBe(-1);

        waitsForPromise(function () {
          return new Promise(function (resolve, reject) {
            component.onSelection(function (item) {
              expect(item).toBe(1);
              resolve();
            });

            component.moveSelectionDown();
            atom.commands.dispatch(componentNode, 'core:confirm');
          });
        });
      });
    });

    it('should cancel instead of selecting when there are no items', function () {
      withItemsSetTo({}, function () {
        waitsForPromise(function () {
          return new Promise(function (resolve, reject) {
            component.onCancellation(function (item) {
              resolve();
            });

            component.select();
          });
        });
      });
    });
  });

  describe('Cancellation', function () {
    it('should cancel on the core:cancel command (esc)', function () {
      withItemsSetTo({ testDirectory: { testProvider: Promise.resolve({ results: [1, 2, 3] }) } }, function () {
        var componentNode = component.getDOMNode();

        waitsForPromise(function () {
          return new Promise(function (resolve, reject) {
            component.onCancellation(function (item) {
              resolve();
            });

            atom.commands.dispatch(componentNode, 'core:cancel');
          });
        });
      });
    });
  });

  describe('Selection', function () {
    it('should start out without selection', function () {
      withItemsSetTo({ testDirectory: { testProvider: Promise.resolve({ results: [1, 2, 3] }) } }, function () {
        var selectedItemIndex = component.getSelectedIndex();
        expect(selectedItemIndex.selectedDirectory).toBe('');
        expect(selectedItemIndex.selectedService).toBe('');
        expect(selectedItemIndex.selectedItemIndex).toBe(-1);
      });
    });

    it('should move the selection and wrap at the top/bottom', function () {
      withItemsSetTo({ testDirectory: { testProvider: Promise.resolve({ results: [1, 2, 3] }) } }, function () {
        expect(component.getSelectedIndex().selectedItemIndex).toBe(-1);

        waitsForPromise(function () {
          return new Promise(function (resolve, reject) {
            component.onSelectionChanged(function (newIndex) {
              resolve(newIndex);
            });
            component.moveSelectionDown();
          }).then(function (newIndex) {
            expect(newIndex.selectedItemIndex).toBe(0);
          });
        });

        waitsForPromise(function () {
          return new Promise(function (resolve, reject) {
            component.onSelectionChanged(function (newIndex) {
              resolve(newIndex);
            });
            component.moveSelectionDown();
          }).then(function (newIndex) {
            expect(newIndex.selectedItemIndex).toBe(1);
          });
        });

        waitsForPromise(function () {
          return new Promise(function (resolve, reject) {
            component.onSelectionChanged(function (newIndex) {
              resolve(newIndex);
            });
            component.moveSelectionDown();
          }).then(function (newIndex) {
            expect(newIndex.selectedItemIndex).toBe(2);
          });
        });

        waitsForPromise(function () {
          return new Promise(function (resolve, reject) {
            component.onSelectionChanged(function (newIndex) {
              resolve(newIndex);
            });
            component.moveSelectionDown();
          }).then(function (newIndex) {
            expect(newIndex.selectedItemIndex).toBe(0);
          });
        });

        waitsForPromise(function () {
          return new Promise(function (resolve, reject) {
            component.onSelectionChanged(function (newIndex) {
              resolve(newIndex);
            });
            component.moveSelectionUp();
          }).then(function (newIndex) {
            expect(newIndex.selectedItemIndex).toBe(2);
          });
        });

        waitsForPromise(function () {
          return new Promise(function (resolve, reject) {
            component.onSelectionChanged(function (newIndex) {
              resolve(newIndex);
            });
            component.moveSelectionUp();
          }).then(function (newIndex) {
            expect(newIndex.selectedItemIndex).toBe(1);
          });
        });

        waitsForPromise(function () {
          return new Promise(function (resolve, reject) {
            component.onSelectionChanged(function (newIndex) {
              resolve(newIndex);
            });
            component.moveSelectionUp();
          }).then(function (newIndex) {
            expect(newIndex.selectedItemIndex).toBe(0);
          });
        });

        waitsForPromise(function () {
          return new Promise(function (resolve, reject) {
            component.onSelectionChanged(function (newIndex) {
              resolve(newIndex);
            });
            component.moveSelectionUp();
          }).then(function (newIndex) {
            expect(newIndex.selectedItemIndex).toBe(2);
          });
        });
      });
    });

    it('should move the selection appropriately on core:move* commands', function () {
      withItemsSetTo({ testDirectory: { testProvider: Promise.resolve({ results: [1, 2, 3] }) } }, function () {
        var componentNode = component.getDOMNode();

        var steps = [{ expectedIndex: 0, nextCommand: 'core:move-up' }, { expectedIndex: 2, nextCommand: 'core:move-down' }, { expectedIndex: 0, nextCommand: 'core:move-down' }, { expectedIndex: 1, nextCommand: 'core:move-to-bottom' }, { expectedIndex: 2, nextCommand: 'core:move-to-top' }, { expectedIndex: 0, nextCommand: '' }];
        var index = 0;

        expect(component.getSelectedIndex().selectedItemIndex).toBe(-1);
        waitsForPromise(function () {
          return new Promise(function (resolve, reject) {
            component.onSelectionChanged(function (newIndex) {
              if (index === steps.length - 1) {
                resolve();
              } else {
                var spec = steps[index];
                expect(newIndex.selectedItemIndex).toBe(spec.expectedIndex);
                atom.commands.dispatch(componentNode, spec.nextCommand);
                index++;
              }
            });
            component.moveSelectionToTop();
          });
        });
      });
    });

    it('should reset the selection when the list contents change', function () {
      withItemsSetTo({ testDirectory: { testProvider: Promise.resolve({ results: [1, 2, 3] }) } }, function () {
        expect(component.getSelectedIndex().selectedItemIndex).toBe(-1);

        waitsForPromise(function () {
          return new Promise(function (resolve, reject) {
            component.onSelectionChanged(function (newIndex) {
              resolve(newIndex);
            });
            component.moveSelectionDown();
          }).then(function (newIndex) {
            expect(newIndex.selectedItemIndex).toBe(0);
          });
        });

        withItemsSetTo({ testDirectory: { testProvider: Promise.resolve({ results: [5, 6, 7] }) } }, function () {
          expect(component.getSelectedIndex().selectedItemIndex).toBe(-1);
        });
      });
    });

    it('should keep the selection index at -1 when there are no items', function () {
      withItemsSetTo({}, function () {
        //enable setTimeout: https://discuss.atom.io/t/solved-settimeout-not-working-firing-in-specs-tests/11427
        jasmine.unspy(window, 'setTimeout');

        expect(component.getSelectedIndex().selectedItemIndex).toBe(-1);

        waitsForPromise(function () {
          return new Promise(function (resolve, reject) {
            setTimeout(function () {
              expect(component.getSelectedIndex().selectedItemIndex).toBe(-1);
              resolve();
            }, 0);
            component.moveSelectionDown();
          });
        });

        waitsForPromise(function () {
          return new Promise(function (resolve, reject) {
            setTimeout(function () {
              expect(component.getSelectedIndex().selectedItemIndex).toBe(-1);
              resolve();
            }, 0);
            component.moveSelectionToBottom();
          });
        });

        waitsForPromise(function () {
          return new Promise(function (resolve, reject) {
            setTimeout(function () {
              expect(component.getSelectedIndex().selectedItemIndex).toBe(-1);
              resolve();
            }, 0);
            component.moveSelectionUp();
          });
        });

        waitsForPromise(function () {
          return new Promise(function (resolve, reject) {
            setTimeout(function () {
              expect(component.getSelectedIndex().selectedItemIndex).toBe(-1);
              resolve();
            }, 0);
            component.moveSelectionToTop();
          });
        });
      });
    });
  });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXF1aWNrLW9wZW4vc3BlYy9RdWlja1NlbGVjdGlvbkNvbXBvbmVudC1zcGVjLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFXWixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUN0QyxJQUFJLHVCQUF1QixHQUFHLE9BQU8sQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO0FBQ3hFLElBQUksc0JBQXNCLEdBQUcsT0FBTyxDQUFDLCtCQUErQixDQUFDLENBQUM7O0lBRWhFLDBCQUEwQjtBQUduQixXQUhQLDBCQUEwQixDQUdsQixLQUE4QyxFQUFFOzBCQUh4RCwwQkFBMEI7O0FBSTVCLCtCQUpFLDBCQUEwQiw2Q0FJcEI7QUFDUixRQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztHQUNyQjs7WUFORywwQkFBMEI7O2VBQTFCLDBCQUEwQjs7V0FRakIseUJBQUc7QUFDZCxhQUFPLE1BQU0sQ0FBQztLQUNmOzs7V0FFVyxzQkFBQyxLQUFhLEVBQW9EO0FBQzVFLGFBQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDckM7OztTQWRHLDBCQUEwQjtHQUFTLHNCQUFzQjs7QUFpQi9ELFFBQVEsQ0FBQyx5QkFBeUIsRUFBRSxZQUFNO0FBQ3hDLE1BQUksYUFBbUIsQ0FBQztBQUN4QixNQUFJLFNBQWtDLENBQUM7O0FBRXZDLFlBQVUsQ0FBQyxZQUFNO0FBQ2YsU0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxXQUFXLENBQUM7YUFBTSxNQUFNLENBQUMsR0FBRztLQUFBLENBQUMsQ0FBQzs7QUFFakQsaUJBQWEsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzlDLFlBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxD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RUFBRSxDQUFDLGlCQUFpQixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEUscUJBQU8sRUFBRSxDQUFDO2FBQ1gsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNOLHFCQUFTLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztXQUNoQyxDQUFDO1NBQUEsQ0FBQyxDQUFDO09BQ0wsQ0FBQyxDQUFDO0tBQ0osQ0FBQyxDQUFDO0dBQ0osQ0FBQyxDQUFDO0NBQ0osQ0FBQyxDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXF1aWNrLW9wZW4vc3BlYy9RdWlja1NlbGVjdGlvbkNvbXBvbmVudC1zcGVjLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QtZm9yLWF0b20nKTtcbnZhciBRdWlja1NlbGVjdGlvbkNvbXBvbmVudCA9IHJlcXVpcmUoJy4uL2xpYi9RdWlja1NlbGVjdGlvbkNvbXBvbmVudCcpO1xudmFyIFF1aWNrU2VsZWN0aW9uUHJvdmlkZXIgPSByZXF1aXJlKCcuLi9saWIvUXVpY2tTZWxlY3Rpb25Qcm92aWRlcicpO1xuXG5jbGFzcyBUZXN0UXVpY2tTZWxlY3Rpb25Qcm92aWRlciBleHRlbmRzIFF1aWNrU2VsZWN0aW9uUHJvdmlkZXIge1xuICBfaXRlbXM6IHtzdHJpbmc6IHtzdHJpbmc6IFByb21pc2U8RmlsZVJlc3VsdD59fTtcblxuICBjb25zdHJ1Y3RvcihpdGVtczoge3N0cmluZzoge3N0cmluZzogUHJvbWlzZTxGaWxlUmVzdWx0Pn19KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl9pdGVtcyA9IGl0ZW1zO1xuICB9XG5cbiAgZ2V0UHJvbXB0VGV4dCgpIHtcbiAgICByZXR1cm4gJ3Rlc3QnO1xuICB9XG5cbiAgZXhlY3V0ZVF1ZXJ5KHF1ZXJ5OiBTdHJpbmcpOiBQcm9taXNlPHtzdHJpbmc6IHtzdHJpbmc6IFByb21pc2U8RmlsZVJlc3VsdD59fT4ge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5faXRlbXMpO1xuICB9XG59XG5cbmRlc2NyaWJlKCdRdWlja1NlbGVjdGlvbkNvbXBvbmVudCcsICgpID0+IHtcbiAgdmFyIGNvbXBvbmVudFJvb3Q6IE5vZGU7XG4gIHZhciBjb21wb25lbnQ6IFF1aWNrU2VsZWN0aW9uQ29tcG9uZW50O1xuXG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIHNweU9uKERhdGUsICdub3cnKS5hbmRDYWxsRmFrZSgoKSA9PiB3aW5kb3cubm93KTtcblxuICAgIGNvbXBvbmVudFJvb3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGNvbXBvbmVudFJvb3QpO1xuXG4gICAgdmFyIHRlc3RQcm92aWRlciA9IG5ldyBUZXN0UXVpY2tTZWxlY3Rpb25Qcm92aWRlcih7fSk7XG4gICAgY29tcG9uZW50ID0gUmVhY3QucmVuZGVyKFxuICAgICAgPFF1aWNrU2VsZWN0aW9uQ29tcG9uZW50IHByb3ZpZGVyPXt0ZXN0UHJvdmlkZXJ9IC8+LFxuICAgICAgY29tcG9uZW50Um9vdFxuICAgICk7XG4gIH0pO1xuXG4gIGFmdGVyRWFjaCgoKSA9PiB7XG4gICAgUmVhY3QudW5tb3VudENvbXBvbmVudEF0Tm9kZShjb21wb25lbnRSb290KTtcbiAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGNvbXBvbmVudFJvb3QpO1xuICB9KTtcblxuICAvLyBVcGRhdGVzIHRoZSBjb21wb25lbnQgdG8gYmUgdXNpbmcgYSBUZXN0UXVpY2tTZWxlY3Rpb25Qcm92aWRlciB0aGF0IHdpbGwgc2VydmUgQGl0ZW1zLCB0aGVuXG4gIC8vIGV4ZWN1dGVzIEBjYWxsYmFjayBhZnRlciB0aGUgY29tcG9uZW50IGhhcyBjb21wbGV0ZWx5IHVwZGF0ZWQgdG8gYmUgdXNpbmcgdGhlIG5ldyBwcm92aWRlci5cbiAgZnVuY3Rpb24gd2l0aEl0ZW1zU2V0VG8oaXRlbXM6IHtzdHJpbmc6IHtzdHJpbmc6IFByb21pc2U8RmlsZVJlc3VsdD59fSwgY2FsbGJhY2s6IChjb21wb25lbnQ6IFF1aWNrU2VsZWN0aW9uQ29tcG9uZW50KSA9PiB2b2lkKSB7XG4gICAgd2FpdHNGb3JQcm9taXNlKCgpID0+IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgY29tcG9uZW50Lm9uSXRlbXNDaGFuZ2VkKChuZXdJdGVtcykgPT4ge1xuICAgICAgICByZXNvbHZlKGNvbXBvbmVudCk7XG4gICAgICB9KTtcbiAgICAgIGNvbXBvbmVudCA9IFJlYWN0LnJlbmRlcihcbiAgICAgICAgPFF1aWNrU2VsZWN0aW9uQ29tcG9uZW50IHByb3ZpZGVyPXtuZXcgVGVzdFF1aWNrU2VsZWN0aW9uUHJvdmlkZXIoaXRlbXMpfSAvPixcbiAgICAgICAgY29tcG9uZW50Um9vdFxuICAgICAgKTtcbiAgICAgIHdpbmRvdy5hZHZhbmNlQ2xvY2soMjUwKTtcblxuICAgICAgY29tcG9uZW50LmNsZWFyKCk7XG5cbiAgICAgIH0pLnRoZW4oY2FsbGJhY2spXG4gICAgKTtcbiAgfVxuXG4gIGRlc2NyaWJlKCdDb25maXJtYXRpb24nLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gdGhlIHNlbGVjdGVkIGl0ZW0gb24gc2VsZWN0aW9uJywgKCkgPT4ge1xuICAgICAgd2l0aEl0ZW1zU2V0VG8oe3Rlc3REaXJlY3Rvcnk6IHt0ZXN0UHJvdmlkZXI6IFByb21pc2UucmVzb2x2ZSh7cmVzdWx0czogWzEsIDIsIDNdfSl9fSwgKCkgPT4ge1xuXG4gICAgICAgIHZhciBzZWxlY3RlZEl0ZW1JbmRleCA9IGNvbXBvbmVudC5nZXRTZWxlY3RlZEluZGV4KCk7XG4gICAgICAgIGV4cGVjdChzZWxlY3RlZEl0ZW1JbmRleC5zZWxlY3RlZERpcmVjdG9yeSkudG9CZSgnJyk7XG4gICAgICAgIGV4cGVjdChzZWxlY3RlZEl0ZW1JbmRleC5zZWxlY3RlZFNlcnZpY2UpLnRvQmUoJycpO1xuICAgICAgICBleHBlY3Qoc2VsZWN0ZWRJdGVtSW5kZXguc2VsZWN0ZWRJdGVtSW5kZXgpLnRvQmUoLTEpO1xuXG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSgoKSA9PiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb21wb25lbnQub25TZWxlY3Rpb24oKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgZXhwZWN0KGl0ZW0pLnRvQmUoMSk7XG4gICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb21wb25lbnQubW92ZVNlbGVjdGlvbkRvd24oKTtcbiAgICAgICAgICAgIGNvbXBvbmVudC5zZWxlY3QoKTtcbiAgICAgICAgICB9KSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgc2VsZWN0IG9uIHRoZSBjb3JlOmNvbmZpcm0gY29tbWFuZCAoZW50ZXIpJywgKCkgPT4ge1xuICAgICAgd2l0aEl0ZW1zU2V0VG8oe3Rlc3REaXJlY3Rvcnk6IHt0ZXN0UHJvdmlkZXI6IFByb21pc2UucmVzb2x2ZSh7cmVzdWx0czogWzEsIDIsIDNdfSl9fSwgKCkgPT4ge1xuICAgICAgICB2YXIgY29tcG9uZW50Tm9kZSA9IGNvbXBvbmVudC5nZXRET01Ob2RlKCk7XG5cbiAgICAgICAgdmFyIHNlbGVjdGVkSXRlbUluZGV4ID0gY29tcG9uZW50LmdldFNlbGVjdGVkSW5kZXgoKTtcbiAgICAgICAgZXhwZWN0KHNlbGVjdGVkSXRlbUluZGV4LnNlbGVjdGVkRGlyZWN0b3J5KS50b0JlKCcnKTtcbiAgICAgICAgZXhwZWN0KHNlbGVjdGVkSXRlbUluZGV4LnNlbGVjdGVkU2VydmljZSkudG9CZSgnJyk7XG4gICAgICAgIGV4cGVjdChzZWxlY3RlZEl0ZW1JbmRleC5zZWxlY3RlZEl0ZW1JbmRleCkudG9CZSgtMSk7XG5cbiAgICAgICAgd2FpdHNGb3JQcm9taXNlKCgpID0+IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbXBvbmVudC5vblNlbGVjdGlvbigoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICBleHBlY3QoaXRlbSkudG9CZSgxKTtcbiAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbXBvbmVudC5tb3ZlU2VsZWN0aW9uRG93bigpO1xuICAgICAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChjb21wb25lbnROb2RlLCAnY29yZTpjb25maXJtJyk7XG4gICAgICAgICAgfSkpO1xuICAgICAgfSk7XG5cbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgY2FuY2VsIGluc3RlYWQgb2Ygc2VsZWN0aW5nIHdoZW4gdGhlcmUgYXJlIG5vIGl0ZW1zJywgKCkgPT4ge1xuICAgICAgd2l0aEl0ZW1zU2V0VG8oe30sICgpID0+IHtcbiAgICAgICAgd2FpdHNGb3JQcm9taXNlKCgpID0+IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbXBvbmVudC5vbkNhbmNlbGxhdGlvbigoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgY29tcG9uZW50LnNlbGVjdCgpO1xuICAgICAgICAgIH0pKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnQ2FuY2VsbGF0aW9uJywgKCkgPT4ge1xuICAgIGl0KCdzaG91bGQgY2FuY2VsIG9uIHRoZSBjb3JlOmNhbmNlbCBjb21tYW5kIChlc2MpJywgKCkgPT4ge1xuICAgICAgd2l0aEl0ZW1zU2V0VG8oe3Rlc3REaXJlY3Rvcnk6IHt0ZXN0UHJvdmlkZXI6IFByb21pc2UucmVzb2x2ZSh7cmVzdWx0czogWzEsIDIsIDNdfSl9fSwgKCkgPT4ge1xuICAgICAgICB2YXIgY29tcG9uZW50Tm9kZSA9IGNvbXBvbmVudC5nZXRET01Ob2RlKCk7XG5cbiAgICAgICAgd2FpdHNGb3JQcm9taXNlKCgpID0+IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbXBvbmVudC5vbkNhbmNlbGxhdGlvbigoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChjb21wb25lbnROb2RlLCAnY29yZTpjYW5jZWwnKTtcbiAgICAgICAgICB9KSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ1NlbGVjdGlvbicsICgpID0+IHtcbiAgICBpdCgnc2hvdWxkIHN0YXJ0IG91dCB3aXRob3V0IHNlbGVjdGlvbicsICgpID0+IHtcbiAgICAgIHdpdGhJdGVtc1NldFRvKHt0ZXN0RGlyZWN0b3J5OiB7dGVzdFByb3ZpZGVyOiBQcm9taXNlLnJlc29sdmUoe3Jlc3VsdHM6IFsxLCAyLCAzXX0pfX0sICgpID0+IHtcbiAgICAgICAgdmFyIHNlbGVjdGVkSXRlbUluZGV4ID0gY29tcG9uZW50LmdldFNlbGVjdGVkSW5kZXgoKTtcbiAgICAgICAgZXhwZWN0KHNlbGVjdGVkSXRlbUluZGV4LnNlbGVjdGVkRGlyZWN0b3J5KS50b0JlKCcnKTtcbiAgICAgICAgZXhwZWN0KHNlbGVjdGVkSXRlbUluZGV4LnNlbGVjdGVkU2VydmljZSkudG9CZSgnJyk7XG4gICAgICAgIGV4cGVjdChzZWxlY3RlZEl0ZW1JbmRleC5zZWxlY3RlZEl0ZW1JbmRleCkudG9CZSgtMSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgbW92ZSB0aGUgc2VsZWN0aW9uIGFuZCB3cmFwIGF0IHRoZSB0b3AvYm90dG9tJywgKCkgPT4ge1xuICAgICAgd2l0aEl0ZW1zU2V0VG8oe3Rlc3REaXJlY3Rvcnk6IHt0ZXN0UHJvdmlkZXI6IFByb21pc2UucmVzb2x2ZSh7cmVzdWx0czogWzEsIDIsIDNdfSl9fSwgKCkgPT4ge1xuICAgICAgICBleHBlY3QoY29tcG9uZW50LmdldFNlbGVjdGVkSW5kZXgoKS5zZWxlY3RlZEl0ZW1JbmRleCkudG9CZSgtMSk7XG5cbiAgICAgICAgd2FpdHNGb3JQcm9taXNlKCgpID0+IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICBjb21wb25lbnQub25TZWxlY3Rpb25DaGFuZ2VkKChuZXdJbmRleCkgPT4ge1xuICAgICAgICAgICAgcmVzb2x2ZShuZXdJbmRleCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgY29tcG9uZW50Lm1vdmVTZWxlY3Rpb25Eb3duKCk7XG4gICAgICAgIH0pLnRoZW4obmV3SW5kZXggPT4ge1xuICAgICAgICAgIGV4cGVjdChuZXdJbmRleC5zZWxlY3RlZEl0ZW1JbmRleCkudG9CZSgwKTtcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSgoKSA9PiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgY29tcG9uZW50Lm9uU2VsZWN0aW9uQ2hhbmdlZCgobmV3SW5kZXgpID0+IHtcbiAgICAgICAgICAgIHJlc29sdmUobmV3SW5kZXgpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGNvbXBvbmVudC5tb3ZlU2VsZWN0aW9uRG93bigpO1xuICAgICAgICB9KS50aGVuKG5ld0luZGV4ID0+IHtcbiAgICAgICAgICBleHBlY3QobmV3SW5kZXguc2VsZWN0ZWRJdGVtSW5kZXgpLnRvQmUoMSk7XG4gICAgICAgIH0pKTtcblxuICAgICAgICB3YWl0c0ZvclByb21pc2UoKCkgPT4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgIGNvbXBvbmVudC5vblNlbGVjdGlvbkNoYW5nZWQoKG5ld0luZGV4KSA9PiB7XG4gICAgICAgICAgICByZXNvbHZlKG5ld0luZGV4KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBjb21wb25lbnQubW92ZVNlbGVjdGlvbkRvd24oKTtcbiAgICAgICAgfSkudGhlbihuZXdJbmRleCA9PiB7XG4gICAgICAgICAgZXhwZWN0KG5ld0luZGV4LnNlbGVjdGVkSXRlbUluZGV4KS50b0JlKDIpO1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgd2FpdHNGb3JQcm9taXNlKCgpID0+IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICBjb21wb25lbnQub25TZWxlY3Rpb25DaGFuZ2VkKChuZXdJbmRleCkgPT4ge1xuICAgICAgICAgICAgcmVzb2x2ZShuZXdJbmRleCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgY29tcG9uZW50Lm1vdmVTZWxlY3Rpb25Eb3duKCk7XG4gICAgICAgIH0pLnRoZW4obmV3SW5kZXggPT4ge1xuICAgICAgICAgIGV4cGVjdChuZXdJbmRleC5zZWxlY3RlZEl0ZW1JbmRleCkudG9CZSgwKTtcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSgoKSA9PiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgY29tcG9uZW50Lm9uU2VsZWN0aW9uQ2hhbmdlZCgobmV3SW5kZXgpID0+IHtcbiAgICAgICAgICAgIHJlc29sdmUobmV3SW5kZXgpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGNvbXBvbmVudC5tb3ZlU2VsZWN0aW9uVXAoKTtcbiAgICAgICAgfSkudGhlbihuZXdJbmRleCA9PiB7XG4gICAgICAgICAgZXhwZWN0KG5ld0luZGV4LnNlbGVjdGVkSXRlbUluZGV4KS50b0JlKDIpO1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgd2FpdHNGb3JQcm9taXNlKCgpID0+IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICBjb21wb25lbnQub25TZWxlY3Rpb25DaGFuZ2VkKChuZXdJbmRleCkgPT4ge1xuICAgICAgICAgICAgcmVzb2x2ZShuZXdJbmRleCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgY29tcG9uZW50Lm1vdmVTZWxlY3Rpb25VcCgpO1xuICAgICAgICB9KS50aGVuKG5ld0luZGV4ID0+IHtcbiAgICAgICAgICBleHBlY3QobmV3SW5kZXguc2VsZWN0ZWRJdGVtSW5kZXgpLnRvQmUoMSk7XG4gICAgICAgIH0pKTtcblxuICAgICAgICB3YWl0c0ZvclByb21pc2UoKCkgPT4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgIGNvbXBvbmVudC5vblNlbGVjdGlvbkNoYW5nZWQoKG5ld0luZGV4KSA9PiB7XG4gICAgICAgICAgICByZXNvbHZlKG5ld0luZGV4KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBjb21wb25lbnQubW92ZVNlbGVjdGlvblVwKCk7XG4gICAgICAgIH0pLnRoZW4obmV3SW5kZXggPT4ge1xuICAgICAgICAgIGV4cGVjdChuZXdJbmRleC5zZWxlY3RlZEl0ZW1JbmRleCkudG9CZSgwKTtcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSgoKSA9PiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgY29tcG9uZW50Lm9uU2VsZWN0aW9uQ2hhbmdlZCgobmV3SW5kZXgpID0+IHtcbiAgICAgICAgICAgIHJlc29sdmUobmV3SW5kZXgpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGNvbXBvbmVudC5tb3ZlU2VsZWN0aW9uVXAoKTtcbiAgICAgICAgfSkudGhlbihuZXdJbmRleCA9PiB7XG4gICAgICAgICAgZXhwZWN0KG5ld0luZGV4LnNlbGVjdGVkSXRlbUluZGV4KS50b0JlKDIpO1xuICAgICAgICB9KSk7XG5cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCBtb3ZlIHRoZSBzZWxlY3Rpb24gYXBwcm9wcmlhdGVseSBvbiBjb3JlOm1vdmUqIGNvbW1hbmRzJywgKCkgPT4ge1xuICAgICAgd2l0aEl0ZW1zU2V0VG8oe3Rlc3REaXJlY3Rvcnk6IHt0ZXN0UHJvdmlkZXI6IFByb21pc2UucmVzb2x2ZSh7cmVzdWx0czogWzEsIDIsIDNdfSl9fSwgKCkgPT4ge1xuICAgICAgICB2YXIgY29tcG9uZW50Tm9kZSA9IGNvbXBvbmVudC5nZXRET01Ob2RlKCk7XG5cbiAgICAgICAgdmFyIHN0ZXBzID0gW1xuICAgICAgICAgIHtleHBlY3RlZEluZGV4OiAwLCBuZXh0Q29tbWFuZDogJ2NvcmU6bW92ZS11cCd9LFxuICAgICAgICAgIHtleHBlY3RlZEluZGV4OiAyLCBuZXh0Q29tbWFuZDogJ2NvcmU6bW92ZS1kb3duJ30sXG4gICAgICAgICAge2V4cGVjdGVkSW5kZXg6IDAsIG5leHRDb21tYW5kOiAnY29yZTptb3ZlLWRvd24nfSxcbiAgICAgICAgICB7ZXhwZWN0ZWRJbmRleDogMSwgbmV4dENvbW1hbmQ6ICdjb3JlOm1vdmUtdG8tYm90dG9tJ30sXG4gICAgICAgICAge2V4cGVjdGVkSW5kZXg6IDIsIG5leHRDb21tYW5kOiAnY29yZTptb3ZlLXRvLXRvcCd9LFxuICAgICAgICAgIHtleHBlY3RlZEluZGV4OiAwLCBuZXh0Q29tbWFuZDogJyd9LFxuICAgICAgICBdO1xuICAgICAgICB2YXIgaW5kZXggPSAwO1xuXG4gICAgICAgIGV4cGVjdChjb21wb25lbnQuZ2V0U2VsZWN0ZWRJbmRleCgpLnNlbGVjdGVkSXRlbUluZGV4KS50b0JlKC0xKTtcbiAgICAgICAgd2FpdHNGb3JQcm9taXNlKCgpID0+IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICBjb21wb25lbnQub25TZWxlY3Rpb25DaGFuZ2VkKChuZXdJbmRleCkgPT4ge1xuICAgICAgICAgICAgaWYgKGluZGV4ID09PSBzdGVwcy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHZhciBzcGVjID0gc3RlcHNbaW5kZXhdO1xuICAgICAgICAgICAgICBleHBlY3QobmV3SW5kZXguc2VsZWN0ZWRJdGVtSW5kZXgpLnRvQmUoc3BlYy5leHBlY3RlZEluZGV4KTtcbiAgICAgICAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChjb21wb25lbnROb2RlLCBzcGVjLm5leHRDb21tYW5kKTtcbiAgICAgICAgICAgICAgaW5kZXgrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICBjb21wb25lbnQubW92ZVNlbGVjdGlvblRvVG9wKCk7XG4gICAgICAgIH0pKTtcblxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHJlc2V0IHRoZSBzZWxlY3Rpb24gd2hlbiB0aGUgbGlzdCBjb250ZW50cyBjaGFuZ2UnLCAoKSA9PiB7XG4gICAgICB3aXRoSXRlbXNTZXRUbyh7dGVzdERpcmVjdG9yeToge3Rlc3RQcm92aWRlcjogUHJvbWlzZS5yZXNvbHZlKHtyZXN1bHRzOiBbMSwgMiwgM119KX19LCAoKSA9PiB7XG4gICAgICAgIGV4cGVjdChjb21wb25lbnQuZ2V0U2VsZWN0ZWRJbmRleCgpLnNlbGVjdGVkSXRlbUluZGV4KS50b0JlKC0xKTtcblxuICAgICAgICB3YWl0c0ZvclByb21pc2UoKCkgPT4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgIGNvbXBvbmVudC5vblNlbGVjdGlvbkNoYW5nZWQoKG5ld0luZGV4KSA9PiB7XG4gICAgICAgICAgICByZXNvbHZlKG5ld0luZGV4KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBjb21wb25lbnQubW92ZVNlbGVjdGlvbkRvd24oKTtcbiAgICAgICAgfSkudGhlbihuZXdJbmRleCA9PiB7XG4gICAgICAgICAgZXhwZWN0KG5ld0luZGV4LnNlbGVjdGVkSXRlbUluZGV4KS50b0JlKDApO1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgd2l0aEl0ZW1zU2V0VG8oe3Rlc3REaXJlY3Rvcnk6IHt0ZXN0UHJvdmlkZXI6IFByb21pc2UucmVzb2x2ZSh7cmVzdWx0czogWzUsIDYsIDddfSl9fSwgKCkgPT4ge1xuICAgICAgICAgIGV4cGVjdChjb21wb25lbnQuZ2V0U2VsZWN0ZWRJbmRleCgpLnNlbGVjdGVkSXRlbUluZGV4KS50b0JlKC0xKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQga2VlcCB0aGUgc2VsZWN0aW9uIGluZGV4IGF0IC0xIHdoZW4gdGhlcmUgYXJlIG5vIGl0ZW1zJywgKCkgPT4ge1xuICAgICAgd2l0aEl0ZW1zU2V0VG8oe30sICgpID0+IHtcbiAgICAgICAgLy9lbmFibGUgc2V0VGltZW91dDogaHR0cHM6Ly9kaXNjdXNzLmF0b20uaW8vdC9zb2x2ZWQtc2V0dGltZW91dC1ub3Qtd29ya2luZy1maXJpbmctaW4tc3BlY3MtdGVzdHMvMTE0MjdcbiAgICAgICAgamFzbWluZS51bnNweSh3aW5kb3csICdzZXRUaW1lb3V0Jyk7XG5cbiAgICAgICAgZXhwZWN0KGNvbXBvbmVudC5nZXRTZWxlY3RlZEluZGV4KCkuc2VsZWN0ZWRJdGVtSW5kZXgpLnRvQmUoLTEpO1xuXG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSgoKSA9PiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBleHBlY3QoY29tcG9uZW50LmdldFNlbGVjdGVkSW5kZXgoKS5zZWxlY3RlZEl0ZW1JbmRleCkudG9CZSgtMSk7XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgY29tcG9uZW50Lm1vdmVTZWxlY3Rpb25Eb3duKCk7XG4gICAgICAgIH0pKTtcblxuICAgICAgICB3YWl0c0ZvclByb21pc2UoKCkgPT4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgZXhwZWN0KGNvbXBvbmVudC5nZXRTZWxlY3RlZEluZGV4KCkuc2VsZWN0ZWRJdGVtSW5kZXgpLnRvQmUoLTEpO1xuICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgIH0sIDApO1xuICAgICAgICAgIGNvbXBvbmVudC5tb3ZlU2VsZWN0aW9uVG9Cb3R0b20oKTtcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSgoKSA9PiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBleHBlY3QoY29tcG9uZW50LmdldFNlbGVjdGVkSW5kZXgoKS5zZWxlY3RlZEl0ZW1JbmRleCkudG9CZSgtMSk7XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgY29tcG9uZW50Lm1vdmVTZWxlY3Rpb25VcCgpO1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgd2FpdHNGb3JQcm9taXNlKCgpID0+IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIGV4cGVjdChjb21wb25lbnQuZ2V0U2VsZWN0ZWRJbmRleCgpLnNlbGVjdGVkSXRlbUluZGV4KS50b0JlKC0xKTtcbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICBjb21wb25lbnQubW92ZVNlbGVjdGlvblRvVG9wKCk7XG4gICAgICAgIH0pKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl19