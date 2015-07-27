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

/* eslint-env browser */

var _require = require('atom');

var Point = _require.Point;
var Range = _require.Range;

var Hyperclick = require('../lib/Hyperclick');

describe('Hyperclick', function () {
  var textEditor;
  var textEditorView;
  var hyperclick;
  var hyperclickForTextEditor;
  beforeEach(function () {
    return waitsForPromise(_asyncToGenerator(function* () {
      textEditor = yield atom.workspace.open('hyperclick.txt');
      textEditorView = atom.views.getView(textEditor);

      // We need the view attached to the DOM for the mouse events to work.
      jasmine.attachToDOM(textEditorView);

      hyperclick = new Hyperclick();
      hyperclickForTextEditor = hyperclick._hyperclickForTextEditors.values().next().value;
    }));
  });

  afterEach(function () {
    hyperclick.dispose();
  });

  /**
   * Returns the pixel position in the DOM of the text editor's screen position.
   * This is used for dispatching mouse events in the text editor.
   *
   * Adapted from https://github.com/atom/atom/blob/5272584d2910e5b3f2b0f309aab4775eb0f779a6/spec/text-editor-component-spec.coffee#L2845
   */
  function clientCoordinatesForScreenPosition(screenPosition) {
    var positionOffset = textEditorView.pixelPositionForScreenPosition(screenPosition);
    var scrollViewClientRect = textEditorView.component.domNode.querySelector('.scroll-view').getBoundingClientRect();
    var clientX = scrollViewClientRect.left + positionOffset.left - textEditor.getScrollLeft();
    var clientY = scrollViewClientRect.top + positionOffset.top - textEditor.getScrollTop();
    return { clientX: clientX, clientY: clientY };
  }

  function dispatch(eventClass, type, position, properties) {
    var _clientCoordinatesForScreenPosition = clientCoordinatesForScreenPosition(position);

    var clientX = _clientCoordinatesForScreenPosition.clientX;
    var clientY = _clientCoordinatesForScreenPosition.clientY;

    if (properties) {
      properties.clientX = clientX;
      properties.clientY = clientY;
    } else {
      properties = { clientX: clientX, clientY: clientY };
    }
    var event = new eventClass(type, properties);
    textEditorView.dispatchEvent(event);
  }

  describe('<meta-mousemove> + <meta-mousedown>', function () {
    it('consumes single-word providers without wordRegExp', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var callback = jasmine.createSpy('callback');
        var provider = {
          getSuggestionForWord: function getSuggestionForWord(sourceTextEditor, text, range) {
            return { range: range, callback: callback };
          }
        };
        spyOn(provider, 'getSuggestionForWord').andCallThrough();
        hyperclick.consumeProvider(provider);

        var position = new Point(0, 1);
        var expectedText = 'word1';
        var expectedRange = Range.fromObject([[0, 0], [0, 5]]);

        dispatch(MouseEvent, 'mousemove', position, { metaKey: true });
        yield hyperclickForTextEditor.getSuggestionAtMouse();
        expect(provider.getSuggestionForWord).toHaveBeenCalledWith(textEditor, expectedText, expectedRange);

        dispatch(MouseEvent, 'mousedown', position, { metaKey: true });
        expect(callback.callCount).toBe(1);
      }));
    });

    it('consumes single-word providers with wordRegExp', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var callback = jasmine.createSpy('callback');
        var provider = {
          getSuggestionForWord: function getSuggestionForWord(sourceTextEditor, text, range) {
            return { range: range, callback: callback };
          },
          wordRegExp: /word/g
        };
        spyOn(provider, 'getSuggestionForWord').andCallThrough();
        hyperclick.consumeProvider(provider);

        var position = new Point(0, 8);
        var expectedText = 'word';
        var expectedRange = Range.fromObject([[0, 6], [0, 10]]);

        dispatch(MouseEvent, 'mousemove', position, { metaKey: true });
        yield hyperclickForTextEditor.getSuggestionAtMouse();
        expect(provider.getSuggestionForWord).toHaveBeenCalledWith(textEditor, expectedText, expectedRange);

        dispatch(MouseEvent, 'mousedown', position, { metaKey: true });
        expect(callback.callCount).toBe(1);
      }));
    });

    it('consumes multi-range providers', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var callback = jasmine.createSpy('callback');
        var provider = {
          getSuggestion: function getSuggestion(sourceTextEditor, sourcePosition) {
            var range = [new Range(sourcePosition, sourcePosition.translate([0, 1])), new Range(sourcePosition.translate([0, 2]), sourcePosition.translate([0, 3]))];
            return { range: range, callback: callback };
          }
        };
        spyOn(provider, 'getSuggestion').andCallThrough();
        hyperclick.consumeProvider(provider);

        var position = new Point(0, 8);

        dispatch(MouseEvent, 'mousemove', position, { metaKey: true });
        yield hyperclickForTextEditor.getSuggestionAtMouse();
        expect(provider.getSuggestion).toHaveBeenCalledWith(textEditor, position);

        dispatch(MouseEvent, 'mousedown', position, { metaKey: true });
        expect(callback.callCount).toBe(1);
      }));
    });

    it('consumes multiple providers from different sources', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var callback1 = jasmine.createSpy('callback');
        var provider1 = {
          // Do not return a suggestion, so we can fall through to provider2.
          getSuggestionForWord: function getSuggestionForWord(sourceTextEditor, text, range) {}
        };
        spyOn(provider1, 'getSuggestionForWord').andCallThrough();

        var callback2 = jasmine.createSpy('callback');
        var provider2 = {
          getSuggestionForWord: function getSuggestionForWord(sourceTextEditor, text, range) {
            return { range: range, callback: callback2 };
          }
        };
        spyOn(provider2, 'getSuggestionForWord').andCallThrough();

        hyperclick.consumeProvider(provider1);
        hyperclick.consumeProvider(provider2);

        var position = new Point(0, 1);
        var expectedText = 'word1';
        var expectedRange = Range.fromObject([[0, 0], [0, 5]]);

        dispatch(MouseEvent, 'mousemove', position, { metaKey: true });
        yield hyperclickForTextEditor.getSuggestionAtMouse();
        expect(provider2.getSuggestionForWord).toHaveBeenCalledWith(textEditor, expectedText, expectedRange);

        dispatch(MouseEvent, 'mousedown', position, { metaKey: true });
        expect(callback1.callCount).toBe(0);
        expect(callback2.callCount).toBe(1);
      }));
    });

    it('consumes multiple providers from the same source', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var callback1 = jasmine.createSpy('callback');
        var provider1 = {
          // Do not return a suggestion, so we can fall through to provider2.
          getSuggestionForWord: function getSuggestionForWord(sourceTextEditor, text, range) {}
        };
        spyOn(provider1, 'getSuggestionForWord').andCallThrough();

        var callback2 = jasmine.createSpy('callback');
        var provider2 = {
          getSuggestionForWord: function getSuggestionForWord(sourceTextEditor, text, range) {
            return { range: range, callback: callback2 };
          }
        };
        spyOn(provider2, 'getSuggestionForWord').andCallThrough();

        hyperclick.consumeProvider([provider1, provider2]);

        var position = new Point(0, 1);
        var expectedText = 'word1';
        var expectedRange = Range.fromObject([[0, 0], [0, 5]]);

        dispatch(MouseEvent, 'mousemove', position, { metaKey: true });
        yield hyperclickForTextEditor.getSuggestionAtMouse();
        expect(provider2.getSuggestionForWord).toHaveBeenCalledWith(textEditor, expectedText, expectedRange);

        dispatch(MouseEvent, 'mousedown', position, { metaKey: true });
        expect(callback1.callCount).toBe(0);
        expect(callback2.callCount).toBe(1);
      }));
    });
  });

  describe('avoids excessive calls', function () {
    it('ignores <mousemove> in the same word as the last position', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var provider = {
          getSuggestionForWord: function getSuggestionForWord(sourceTextEditor, text, range) {
            // Never resolve this, so we know that no suggestion is set.
            return new Promise(function () {});
          }
        };
        spyOn(provider, 'getSuggestionForWord').andCallThrough();
        hyperclick.consumeProvider(provider);

        var position = new Point(0, 1);
        dispatch(MouseEvent, 'mousemove', position, { metaKey: true });
        dispatch(MouseEvent, 'mousemove', position.translate([0, 1]), { metaKey: true });
        dispatch(MouseEvent, 'mousemove', position.translate([0, 2]), { metaKey: true });

        expect(provider.getSuggestionForWord.callCount).toBe(1);
      }));
    });

    it('ignores <mousemove> in the same single-range as the last suggestion', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var callback = jasmine.createSpy('callback');
        var provider = {
          getSuggestionForWord: function getSuggestionForWord(sourceTextEditor, text, range) {
            return { range: range, callback: callback };
          }
        };
        spyOn(provider, 'getSuggestionForWord').andCallThrough();
        hyperclick.consumeProvider(provider);

        var position = new Point(0, 1);
        var expectedText = 'word1';
        var expectedRange = Range.fromObject([[0, 0], [0, 5]]);

        dispatch(MouseEvent, 'mousemove', position, { metaKey: true });
        yield hyperclickForTextEditor.getSuggestionAtMouse();
        expect(provider.getSuggestionForWord).toHaveBeenCalledWith(textEditor, expectedText, expectedRange);

        dispatch(MouseEvent, 'mousemove', position.translate([0, 1]), { metaKey: true });
        yield hyperclickForTextEditor.getSuggestionAtMouse();

        expect(provider.getSuggestionForWord.callCount).toBe(1);

        dispatch(MouseEvent, 'mousedown', position, { metaKey: true });
        expect(callback.callCount).toBe(1);
      }));
    });

    it('handles <mousemove> in a different single-range as the last suggestion', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var callback = jasmine.createSpy('callback');
        var provider = {
          getSuggestionForWord: function getSuggestionForWord(sourceTextEditor, text, range) {
            return { range: range, callback: callback };
          }
        };
        spyOn(provider, 'getSuggestionForWord').andCallThrough();
        hyperclick.consumeProvider(provider);

        var position1 = new Point(0, 1);
        var expectedText1 = 'word1';
        var expectedRange1 = Range.fromObject([[0, 0], [0, 5]]);

        dispatch(MouseEvent, 'mousemove', position1, { metaKey: true });
        yield hyperclickForTextEditor.getSuggestionAtMouse();
        expect(provider.getSuggestionForWord).toHaveBeenCalledWith(textEditor, expectedText1, expectedRange1);

        var position2 = new Point(0, 8);
        var expectedText2 = 'word2';
        var expectedRange2 = Range.fromObject([[0, 6], [0, 11]]);
        dispatch(MouseEvent, 'mousemove', position2, { metaKey: true });
        yield hyperclickForTextEditor.getSuggestionAtMouse();
        expect(provider.getSuggestionForWord).toHaveBeenCalledWith(textEditor, expectedText2, expectedRange2);

        expect(provider.getSuggestionForWord.callCount).toBe(2);

        dispatch(MouseEvent, 'mousedown', position2, { metaKey: true });
        expect(callback.callCount).toBe(1);
      }));
    });

    it('ignores <mousemove> in the same multi-range as the last suggestion', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var range = [new Range(new Point(0, 1), new Point(0, 2)), new Range(new Point(0, 4), new Point(0, 5))];
        var callback = jasmine.createSpy('callback');
        var provider = {
          getSuggestion: function getSuggestion(sourceTextEditor, sourcePosition) {
            return { range: range, callback: callback };
          }
        };
        spyOn(provider, 'getSuggestion').andCallThrough();
        hyperclick.consumeProvider(provider);

        var position = new Point(0, 1);

        dispatch(MouseEvent, 'mousemove', position, { metaKey: true });
        yield hyperclickForTextEditor.getSuggestionAtMouse();
        expect(provider.getSuggestion).toHaveBeenCalledWith(textEditor, position);

        dispatch(MouseEvent, 'mousemove', new Point(0, 4), { metaKey: true });
        yield hyperclickForTextEditor.getSuggestionAtMouse();

        expect(provider.getSuggestion.callCount).toBe(1);

        dispatch(MouseEvent, 'mousedown', position, { metaKey: true });
        expect(callback.callCount).toBe(1);
      }));
    });

    it('handles <mousemove> in a different multi-range as the last suggestion', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var range = [new Range(new Point(0, 1), new Point(0, 2)), new Range(new Point(0, 4), new Point(0, 5))];
        var callback = jasmine.createSpy('callback');
        var provider = {
          getSuggestion: function getSuggestion(sourceTextEditor, position) {
            return { range: range, callback: callback };
          }
        };
        spyOn(provider, 'getSuggestion').andCallThrough();
        hyperclick.consumeProvider(provider);

        var position1 = new Point(0, 1);

        dispatch(MouseEvent, 'mousemove', position1, { metaKey: true });
        yield hyperclickForTextEditor.getSuggestionAtMouse();
        expect(provider.getSuggestion).toHaveBeenCalledWith(textEditor, position1);

        var position2 = new Point(0, 3);
        dispatch(MouseEvent, 'mousemove', position2, { metaKey: true });
        yield hyperclickForTextEditor.getSuggestionAtMouse();
        expect(provider.getSuggestion).toHaveBeenCalledWith(textEditor, position2);

        expect(provider.getSuggestion.callCount).toBe(2);

        dispatch(MouseEvent, 'mousedown', position2, { metaKey: true });
        expect(callback.callCount).toBe(1);
      }));
    });
  });

  describe('adds the `hyperclick` CSS class', function () {
    var provider = {
      getSuggestionForWord: function getSuggestionForWord(sourceTextEditor, text, range) {
        return { range: range, callback: function callback() {} };
      }
    };

    beforeEach(function () {
      hyperclick.consumeProvider(provider);
    });

    it('adds on <meta-mousemove>, removes on <meta-mousedown>', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var position = new Point(0, 1);

        expect(textEditorView.classList.contains('hyperclick')).toBe(false);

        dispatch(MouseEvent, 'mousemove', position, { metaKey: true });
        yield hyperclickForTextEditor.getSuggestionAtMouse();
        expect(textEditorView.classList.contains('hyperclick')).toBe(true);

        dispatch(MouseEvent, 'mousedown', position, { metaKey: true });
        expect(textEditorView.classList.contains('hyperclick')).toBe(false);
      }));
    });

    it('adds on <meta-keydown>, removes on <meta-keyup>', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var position = new Point(0, 1);

        // We need to move the mouse once, so Hyperclick knows where it is.
        dispatch(MouseEvent, 'mousemove', position);
        expect(textEditorView.classList.contains('hyperclick')).toBe(false);

        dispatch(KeyboardEvent, 'keydown', position, { metaKey: true });
        yield hyperclickForTextEditor.getSuggestionAtMouse();
        expect(textEditorView.classList.contains('hyperclick')).toBe(true);

        dispatch(KeyboardEvent, 'keyup', position);
        expect(textEditorView.classList.contains('hyperclick')).toBe(false);
      }));
    });
  });

  describe('hyperclick:confirm-cursor', function () {
    it('confirms the suggestion at the cursor even if the mouse moved', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var callback = jasmine.createSpy('callback');
        var provider = {
          getSuggestionForWord: function getSuggestionForWord(sourceTextEditor, text, range) {
            return { range: range, callback: callback };
          }
        };
        spyOn(provider, 'getSuggestionForWord').andCallThrough();
        hyperclick.consumeProvider(provider);

        var mousePosition = new Point(0, 1);
        dispatch(MouseEvent, 'mousemove', mousePosition, { metaKey: true });
        yield hyperclickForTextEditor.getSuggestionAtMouse();

        textEditor.setCursorBufferPosition(new Point(0, 8));
        atom.commands.dispatch(textEditorView, 'hyperclick:confirm-cursor');
        expect(provider.getSuggestionForWord).toHaveBeenCalledWith(textEditor, 'word2', Range.fromObject([[0, 6], [0, 11]]));
        waitsFor(function () {
          return callback.callCount === 1;
        });
      }));
    });
  });

  describe('priority', function () {
    it('confirms higher priority provider when it is consumed first', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var callback1 = jasmine.createSpy('callback');
        var provider1 = {
          getSuggestionForWord: function getSuggestionForWord(sourceTextEditor, text, range) {
            return { range: range, callback: callback1 };
          },
          priority: 5
        };
        hyperclick.consumeProvider(provider1);

        var callback2 = jasmine.createSpy('callback');
        var provider2 = {
          getSuggestionForWord: function getSuggestionForWord(sourceTextEditor, text, range) {
            return { range: range, callback: callback1 };
          },
          priority: 3
        };
        hyperclick.consumeProvider(provider2);

        var mousePosition = new Point(0, 1);
        dispatch(MouseEvent, 'mousemove', mousePosition, { metaKey: true });
        yield hyperclickForTextEditor.getSuggestionAtMouse();
        dispatch(MouseEvent, 'mousedown', mousePosition, { metaKey: true });

        expect(callback1.callCount).toBe(1);
        expect(callback2.callCount).toBe(0);
      }));
    });

    it('confirms higher priority provider when it is consumed last', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var callback1 = jasmine.createSpy('callback');
        var provider1 = {
          getSuggestionForWord: function getSuggestionForWord(sourceTextEditor, text, range) {
            return { range: range, callback: callback1 };
          },
          priority: 3
        };
        hyperclick.consumeProvider(provider1);

        var callback2 = jasmine.createSpy('callback');
        var provider2 = {
          getSuggestionForWord: function getSuggestionForWord(sourceTextEditor, text, range) {
            return { range: range, callback: callback2 };
          },
          priority: 5
        };
        hyperclick.consumeProvider(provider2);

        var mousePosition = new Point(0, 1);
        dispatch(MouseEvent, 'mousemove', mousePosition, { metaKey: true });
        yield hyperclickForTextEditor.getSuggestionAtMouse();
        dispatch(MouseEvent, 'mousedown', mousePosition, { metaKey: true });

        expect(callback1.callCount).toBe(0);
        expect(callback2.callCount).toBe(1);
      }));
    });

    it('confirms >0 priority before default priority', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var callback1 = jasmine.createSpy('callback');
        var provider1 = {
          getSuggestionForWord: function getSuggestionForWord(sourceTextEditor, text, range) {
            return { range: range, callback: callback1 };
          }
        };
        hyperclick.consumeProvider(provider1);

        var callback2 = jasmine.createSpy('callback');
        var provider2 = {
          getSuggestionForWord: function getSuggestionForWord(sourceTextEditor, text, range) {
            return { range: range, callback: callback2 };
          },
          priority: 1
        };
        hyperclick.consumeProvider(provider2);

        var mousePosition = new Point(0, 1);
        dispatch(MouseEvent, 'mousemove', mousePosition, { metaKey: true });
        yield hyperclickForTextEditor.getSuggestionAtMouse();
        dispatch(MouseEvent, 'mousedown', mousePosition, { metaKey: true });

        expect(callback1.callCount).toBe(0);
        expect(callback2.callCount).toBe(1);
      }));
    });

    it('confirms <0 priority after default priority', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var callback1 = jasmine.createSpy('callback');
        var provider1 = {
          getSuggestionForWord: function getSuggestionForWord(sourceTextEditor, text, range) {
            return { range: range, callback: callback1 };
          },
          priority: -1
        };
        hyperclick.consumeProvider(provider1);

        var callback2 = jasmine.createSpy('callback');
        var provider2 = {
          getSuggestionForWord: function getSuggestionForWord(sourceTextEditor, text, range) {
            return { range: range, callback: callback2 };
          }
        };
        hyperclick.consumeProvider(provider2);

        var mousePosition = new Point(0, 1);
        dispatch(MouseEvent, 'mousemove', mousePosition, { metaKey: true });
        yield hyperclickForTextEditor.getSuggestionAtMouse();
        dispatch(MouseEvent, 'mousedown', mousePosition, { metaKey: true });

        expect(callback1.callCount).toBe(0);
        expect(callback2.callCount).toBe(1);
      }));
    });

    it('confirms same-priority in the order they are consumed', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var callback1 = jasmine.createSpy('callback');
        var provider1 = {
          getSuggestionForWord: function getSuggestionForWord(sourceTextEditor, text, range) {
            return { range: range, callback: callback1 };
          }
        };
        hyperclick.consumeProvider(provider1);

        var callback2 = jasmine.createSpy('callback');
        var provider2 = {
          getSuggestionForWord: function getSuggestionForWord(sourceTextEditor, text, range) {
            return { range: range, callback: callback2 };
          }
        };
        hyperclick.consumeProvider(provider2);

        var mousePosition = new Point(0, 1);
        dispatch(MouseEvent, 'mousemove', mousePosition, { metaKey: true });
        yield hyperclickForTextEditor.getSuggestionAtMouse();
        dispatch(MouseEvent, 'mousedown', mousePosition, { metaKey: true });

        expect(callback1.callCount).toBe(1);
        expect(callback2.callCount).toBe(0);
      }));
    });

    it('confirms highest priority provider when multiple are consumed at a time', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var callback1 = jasmine.createSpy('callback');
        var provider1 = {
          getSuggestionForWord: function getSuggestionForWord(sourceTextEditor, text, range) {
            return { range: range, callback: callback1 };
          },
          priority: 1
        };
        var callback2 = jasmine.createSpy('callback');
        var provider2 = {
          getSuggestionForWord: function getSuggestionForWord(sourceTextEditor, text, range) {
            return { range: range, callback: callback2 };
          },
          priority: 2
        };

        hyperclick.consumeProvider([provider1, provider2]);

        var mousePosition = new Point(0, 1);
        dispatch(MouseEvent, 'mousemove', mousePosition, { metaKey: true });
        yield hyperclickForTextEditor.getSuggestionAtMouse();
        dispatch(MouseEvent, 'mousedown', mousePosition, { metaKey: true });

        expect(callback1.callCount).toBe(0);
        expect(callback2.callCount).toBe(1);
      }));
    });
  });

  describe('multiple suggestions', function () {
    it('confirms the first suggestion', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var callback = [{
          title: 'callback1',
          callback: jasmine.createSpy('callback1')
        }, {
          title: 'callback2',
          callback: jasmine.createSpy('callback1')
        }];
        var provider = {
          getSuggestionForWord: function getSuggestionForWord(sourceTextEditor, text, range) {
            return { range: range, callback: callback };
          }
        };
        hyperclick.consumeProvider(provider);

        var position = new Point(0, 1);
        dispatch(MouseEvent, 'mousemove', position, { metaKey: true });
        yield hyperclickForTextEditor.getSuggestionAtMouse();
        dispatch(MouseEvent, 'mousedown', position, { metaKey: true });

        var suggestionListEl = textEditorView.querySelector('hyperclick-suggestion-list');
        expect(suggestionListEl).toExist();

        atom.commands.dispatch(textEditorView, 'editor:newline');

        expect(callback[0].callback.callCount).toBe(1);
        expect(callback[1].callback.callCount).toBe(0);
        expect(textEditorView.querySelector('hyperclick-suggestion-list')).not.toExist();
      }));
    });

    it('confirms the second suggestion', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var callback = [{
          title: 'callback1',
          callback: jasmine.createSpy('callback1')
        }, {
          title: 'callback2',
          callback: jasmine.createSpy('callback1')
        }];
        var provider = {
          getSuggestionForWord: function getSuggestionForWord(sourceTextEditor, text, range) {
            return { range: range, callback: callback };
          }
        };
        hyperclick.consumeProvider(provider);

        var position = new Point(0, 1);
        dispatch(MouseEvent, 'mousemove', position, { metaKey: true });
        yield hyperclickForTextEditor.getSuggestionAtMouse();
        dispatch(MouseEvent, 'mousedown', position, { metaKey: true });

        var suggestionListEl = textEditorView.querySelector('hyperclick-suggestion-list');
        expect(suggestionListEl).toExist();

        atom.commands.dispatch(textEditorView, 'core:move-down');
        atom.commands.dispatch(textEditorView, 'editor:newline');

        expect(callback[0].callback.callCount).toBe(0);
        expect(callback[1].callback.callCount).toBe(1);
        expect(textEditorView.querySelector('hyperclick-suggestion-list')).not.toExist();
      }));
    });

    it('is cancelable', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var callback = [{
          title: 'callback1',
          callback: jasmine.createSpy('callback1')
        }, {
          title: 'callback2',
          callback: jasmine.createSpy('callback1')
        }];
        var provider = {
          getSuggestionForWord: function getSuggestionForWord(sourceTextEditor, text, range) {
            return { range: range, callback: callback };
          }
        };
        hyperclick.consumeProvider(provider);

        var position = new Point(0, 1);
        dispatch(MouseEvent, 'mousemove', position, { metaKey: true });
        yield hyperclickForTextEditor.getSuggestionAtMouse();
        dispatch(MouseEvent, 'mousedown', position, { metaKey: true });

        var suggestionListEl = textEditorView.querySelector('hyperclick-suggestion-list');
        expect(suggestionListEl).toExist();

        atom.commands.dispatch(textEditorView, 'core:cancel');

        expect(callback[0].callback.callCount).toBe(0);
        expect(callback[1].callback.callCount).toBe(0);
        expect(textEditorView.querySelector('hyperclick-suggestion-list')).not.toExist();
      }));
    });
  });

  describe('when the editor has soft-wrapped lines', function () {
    beforeEach(function () {
      textEditor.setSoftWrapped(true);
      atom.config.set('editor.softWrapAtPreferredLineLength', true);
      atom.config.set('editor.preferredLineLength', 6); // This wraps each word onto its own line.
    });

    it('Hyperclick correctly detects the word being moused over.', function () {
      waitsForPromise(_asyncToGenerator(function* () {

        var callback = jasmine.createSpy('callback');
        var provider = {
          getSuggestionForWord: function getSuggestionForWord(sourceTextEditor, text, range) {
            return { range: range, callback: callback };
          }
        };
        spyOn(provider, 'getSuggestionForWord').andCallThrough();
        hyperclick.consumeProvider(provider);

        var position = new Point(8, 0);
        var expectedText = 'word9';
        var expectedBufferRange = Range.fromObject([[2, 12], [2, 17]]);
        dispatch(MouseEvent, 'mousemove', position, { metaKey: true });
        yield hyperclickForTextEditor.getSuggestionAtMouse();
        expect(provider.getSuggestionForWord).toHaveBeenCalledWith(textEditor, expectedText, expectedBufferRange);
        expect(provider.getSuggestionForWord.callCount).toBe(1);
      }));
    });
  });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9oeXBlcmNsaWNrL3NwZWMvSHlwZXJjbGljay1zcGVjLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7OztlQWFTLE9BQU8sQ0FBQyxNQUFNLENBQUM7O0lBQS9CLEtBQUssWUFBTCxLQUFLO0lBQUUsS0FBSyxZQUFMLEtBQUs7O0FBQ2pCLElBQUksVUFBVSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDOztBQUU5QyxRQUFRLENBQUMsWUFBWSxFQUFFLFlBQU07QUFDM0IsTUFBSSxVQUFVLENBQUM7QUFDZixNQUFJLGNBQWMsQ0FBQztBQUNuQixNQUFJLFVBQVUsQ0FBQztBQUNmLE1BQUksdUJBQXVCLENBQUM7QUFDNUIsWUFBVSxDQUFDO1dBQU0sZUFBZSxtQkFBQyxhQUFZO0FBQzNDLGdCQUFVLEdBQUcsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQ3pELG9CQUFjLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7OztBQUdoRCxhQUFPLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxDQUFDOztBQUVwQyxnQkFBVSxHQUFHLElBQUksVUFBVSxFQUFFLENBQUM7QUFDOUIsNkJBQXVCLEdBQUcsVUFBVSxDQUFDLHlCQUF5QixDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQztLQUN0RixFQUFDO0dBQUEsQ0FBQyxDQUFDOztBQUVKLFdBQVMsQ0FBQyxZQUFNO0FBQ2QsY0FBVSxDQUFDLE9BQU8sRUFBRSxDQUFDO0dBQ3RCLENBQUMsQ0FBQzs7Ozs7Ozs7QUFRSCxXQUFTLGtDQUFrQyxDQUFDLGNBQXFCLEVBQXNDO0FBQ3JHLFFBQUksY0FBYyxHQUFHLGNBQWMsQ0FBQyw4QkFBOEIsQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUNuRixRQUFJLG9CQUFvQixHQUFHLGNBQWMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUN0RCxhQUFhLENBQUMsY0FBYyxDQUFDLENBQzdCLHFCQUFxQixFQUFFLENBQUM7QUFDN0IsUUFBSSxPQUFPLEdBQUcsb0JBQW9CLENBQUMsSUFBSSxHQUFHLGNBQWMsQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDLGFBQWEsRUFBRSxDQUFDO0FBQzNGLFFBQUksT0FBTyxHQUFHLG9CQUFvQixDQUFDLEdBQUcsR0FBRyxjQUFjLENBQUMsR0FBRyxHQUFHLFVBQVUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztBQUN4RixXQUFPLEVBQUMsT0FBTyxFQUFQLE9BQU8sRUFBRSxPQUFPLEVBQVAsT0FBTyxFQUFDLENBQUM7R0FDM0I7O0FBRUQsV0FBUyxRQUFRLENBQ2IsVUFBc0MsRUFDdEMsSUFBWSxFQUNaLFFBQWUsRUFDZixVQUFrQixFQUFROzhDQUNILGtDQUFrQyxDQUFDLFFBQVEsQ0FBQzs7UUFBaEUsT0FBTyx1Q0FBUCxPQUFPO1FBQUUsT0FBTyx1Q0FBUCxPQUFPOztBQUNyQixRQUFJLFVBQVUsRUFBRTtBQUNkLGdCQUFVLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztBQUM3QixnQkFBVSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7S0FDOUIsTUFBTTtBQUNMLGdCQUFVLEdBQUcsRUFBQyxPQUFPLEVBQVAsT0FBTyxFQUFFLE9BQU8sRUFBUCxPQUFPLEVBQUMsQ0FBQztLQUNqQztBQUNELFFBQUksS0FBSyxHQUFHLElBQUksVUFBVSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztBQUM3QyxrQkFBYyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztHQUNyQzs7QUFFRCxVQUFRLENBQUMscUNBQXFDLEVBQUUsWUFBTTtBQUNwRCxNQUFFLENBQUMsbURBQW1ELEVBQUUsWUFBTTtBQUM1RCxxQkFBZSxtQkFBQyxhQUFZO0FBQzFCLFlBQUksUUFBUSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDN0MsWUFBSSxRQUFRLEdBQUc7QUFDYiw4QkFBb0IsRUFBQSw4QkFBQyxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFO0FBQ2xELG1CQUFPLEVBQUMsS0FBSyxFQUFMLEtBQUssRUFBRSxRQUFRLEVBQVIsUUFBUSxFQUFDLENBQUM7V0FDMUI7U0FDRixDQUFDO0FBQ0YsYUFBSyxDQUFDLFFBQVEsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ3pELGtCQUFVLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDOztBQUVyQyxZQUFJLFFBQVEsR0FBRyxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDL0IsWUFBSSxZQUFZLEdBQUcsT0FBTyxDQUFDO0FBQzNCLFlBQUksYUFBYSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRXZELGdCQUFRLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztBQUM3RCxjQUFNLHVCQUF1QixDQUFDLG9CQUFvQixFQUFFLENBQUM7QUFDckQsY0FBTSxDQUFDLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLG9CQUFvQixDQUN0RCxVQUFVLEVBQ1YsWUFBWSxFQUNaLGFBQWEsQ0FBQyxDQUFDOztBQUVuQixnQkFBUSxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7QUFDN0QsY0FBTSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7T0FDcEMsRUFBQyxDQUFDO0tBQ0osQ0FBQyxDQUFDOztBQUVILE1BQUUsQ0FBQyxnREFBZ0QsRUFBRSxZQUFNO0FBQ3pELHFCQUFlLG1CQUFDLGFBQVk7QUFDMUIsWUFBSSxRQUFRLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM3QyxZQUFJLFFBQVEsR0FBRztBQUNiLDhCQUFvQixFQUFBLDhCQUFDLGdCQUFnQixFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7QUFDbEQsbUJBQU8sRUFBQyxLQUFLLEVBQUwsS0FBSyxFQUFFLFFBQVEsRUFBUixRQUFRLEVBQUMsQ0FBQztXQUMxQjtBQUNELG9CQUFVLEVBQUUsT0FBTztTQUNwQixDQUFDO0FBQ0YsYUFBSyxDQUFDLFFBQVEsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ3pELGtCQUFVLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDOztBQUVyQyxZQUFJLFFBQVEsR0FBRyxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDL0IsWUFBSSxZQUFZLEdBQUcsTUFBTSxDQUFDO0FBQzFCLFlBQUksYUFBYSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRXhELGdCQUFRLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztBQUM3RCxjQUFNLHVCQUF1QixDQUFDLG9CQUFvQixFQUFFLENBQUM7QUFDckQsY0FBTSxDQUFDLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLG9CQUFvQixDQUN0RCxVQUFVLEVBQ1YsWUFBWSxFQUNaLGFBQWEsQ0FBQyxDQUFDOztBQUVuQixnQkFBUSxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7QUFDN0QsY0FBTSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7T0FDcEMsRUFBQyxDQUFDO0tBQ0osQ0FBQyxDQUFDOztBQUVILE1BQUUsQ0FBQyxnQ0FBZ0MsRUFBRSxZQUFNO0FBQ3pDLHFCQUFlLG1CQUFDLGFBQVk7QUFDMUIsWUFBSSxRQUFRLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM3QyxZQUFJLFFBQVEsR0FBRztBQUNiLHVCQUFhLEVBQUEsdUJBQUMsZ0JBQTRCLEVBQUUsY0FBcUIsRUFBRTtBQUNqRSxnQkFBSSxLQUFLLEdBQUcsQ0FDVixJQUFJLEtBQUssQ0FBQyxjQUFjLEVBQUUsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQzNELElBQUksS0FBSyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FDOUUsQ0FBQztBQUNGLG1CQUFPLEVBQUMsS0FBSyxFQUFMLEtBQUssRUFBRSxRQUFRLEVBQVIsUUFBUSxFQUFDLENBQUM7V0FDMUI7U0FDRixDQUFDO0FBQ0YsYUFBSyxDQUFDLFFBQVEsRUFBRSxlQUFlLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUNsRCxrQkFBVSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQzs7QUFFckMsWUFBSSxRQUFRLEdBQUcsSUFBSSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDOztBQUUvQixnQkFBUSxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7QUFDN0QsY0FBTSx1QkFBdUIsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO0FBQ3JELGNBQU0sQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLENBQUMsb0JBQW9CLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDOztBQUUxRSxnQkFBUSxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7QUFDN0QsY0FBTSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7T0FDcEMsRUFBQyxDQUFDO0tBQ0osQ0FBQyxDQUFDOztBQUVILE1BQUUsQ0FBQyxvREFBb0QsRUFBRSxZQUFNO0FBQzdELHFCQUFlLG1CQUFDLGFBQVk7QUFDMUIsWUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM5QyxZQUFJLFNBQVMsR0FBRzs7QUFFZCw4QkFBb0IsRUFBQSw4QkFBQyxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUU7U0FDdkQsQ0FBQztBQUNGLGFBQUssQ0FBQyxTQUFTLEVBQUUsc0JBQXNCLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQzs7QUFFMUQsWUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM5QyxZQUFJLFNBQVMsR0FBRztBQUNkLDhCQUFvQixFQUFBLDhCQUFDLGdCQUFnQixFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7QUFDbEQsbUJBQU8sRUFBQyxLQUFLLEVBQUwsS0FBSyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUMsQ0FBQztXQUNyQztTQUNGLENBQUM7QUFDRixhQUFLLENBQUMsU0FBUyxFQUFFLHNCQUFzQixDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7O0FBRTFELGtCQUFVLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ3RDLGtCQUFVLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDOztBQUV0QyxZQUFJLFFBQVEsR0FBRyxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDL0IsWUFBSSxZQUFZLEdBQUcsT0FBTyxDQUFDO0FBQzNCLFlBQUksYUFBYSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRXZELGdCQUFRLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztBQUM3RCxjQUFNLHVCQUF1QixDQUFDLG9CQUFvQixFQUFFLENBQUM7QUFDckQsY0FBTSxDQUFDLFNBQVMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLG9CQUFvQixDQUN2RCxVQUFVLEVBQ1YsWUFBWSxFQUNaLGFBQWEsQ0FBQyxDQUFDOztBQUVuQixnQkFBUSxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7QUFDN0QsY0FBTSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEMsY0FBTSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7T0FDckMsRUFBQyxDQUFDO0tBQ0osQ0FBQyxDQUFDOztBQUVILE1BQUUsQ0FBQyxrREFBa0QsRUFBRSxZQUFNO0FBQzNELHFCQUFlLG1CQUFDLGFBQVk7QUFDMUIsWUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM5QyxZQUFJLFNBQVMsR0FBRzs7QUFFZCw4QkFBb0IsRUFBQSw4QkFBQyxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUU7U0FDdkQsQ0FBQztBQUNGLGFBQUssQ0FBQyxTQUFTLEVBQUUsc0JBQXNCLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQzs7QUFFMUQsWUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM5QyxZQUFJLFNBQVMsR0FBRztBQUNkLDhCQUFvQixFQUFBLDhCQUFDLGdCQUFnQixFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7QUFDbEQsbUJBQU8sRUFBQyxLQUFLLEVBQUwsS0FBSyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUMsQ0FBQztXQUNyQztTQUNGLENBQUM7QUFDRixhQUFLLENBQUMsU0FBUyxFQUFFLHNCQUFzQixDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7O0FBRTFELGtCQUFVLENBQUMsZUFBZSxDQUFDLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7O0FBRW5ELFlBQUksUUFBUSxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUMvQixZQUFJLFlBQVksR0FBRyxPQUFPLENBQUM7QUFDM0IsWUFBSSxhQUFhLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7QUFFdkQsZ0JBQVEsQ0FBQyxVQUFVLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxFQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0FBQzdELGNBQU0sdUJBQXVCLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztBQUNyRCxjQUFNLENBQUMsU0FBUyxDQUFDLG9CQUFvQixDQUFDLENBQUMsb0JBQW9CLENBQ3ZELFVBQVUsRUFDVixZQUFZLEVBQ1osYUFBYSxDQUFDLENBQUM7O0FBRW5CLGdCQUFRLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztBQUM3RCxjQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwQyxjQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztPQUNyQyxFQUFDLENBQUM7S0FDSixDQUFDLENBQUM7R0FDSixDQUFDLENBQUM7O0FBRUgsVUFBUSxDQUFDLHdCQUF3QixFQUFFLFlBQU07QUFDdkMsTUFBRSxDQUFDLDJEQUEyRCxFQUFFLFlBQU07QUFDcEUscUJBQWUsbUJBQUMsYUFBWTtBQUMxQixZQUFJLFFBQVEsR0FBRztBQUNiLDhCQUFvQixFQUFBLDhCQUFDLGdCQUFnQixFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7O0FBRWxELG1CQUFPLElBQUksT0FBTyxDQUFDLFlBQU0sRUFBRSxDQUFDLENBQUM7V0FDOUI7U0FDRixDQUFDO0FBQ0YsYUFBSyxDQUFDLFFBQVEsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ3pELGtCQUFVLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDOztBQUVyQyxZQUFJLFFBQVEsR0FBRyxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDL0IsZ0JBQVEsQ0FBQyxVQUFVLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxFQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0FBQzdELGdCQUFRLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztBQUMvRSxnQkFBUSxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7O0FBRS9FLGNBQU0sQ0FBQyxRQUFRLENBQUMsb0JBQW9CLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO09BQ3pELEVBQUMsQ0FBQztLQUNKLENBQUMsQ0FBQzs7QUFFSCxNQUFFLENBQUMscUVBQXFFLEVBQUUsWUFBTTtBQUM5RSxxQkFBZSxtQkFBQyxhQUFZO0FBQzFCLFlBQUksUUFBUSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDN0MsWUFBSSxRQUFRLEdBQUc7QUFDYiw4QkFBb0IsRUFBQSw4QkFBQyxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFO0FBQ2xELG1CQUFPLEVBQUMsS0FBSyxFQUFMLEtBQUssRUFBRSxRQUFRLEVBQVIsUUFBUSxFQUFDLENBQUM7V0FDMUI7U0FDRixDQUFDO0FBQ0YsYUFBSyxDQUFDLFFBQVEsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ3pELGtCQUFVLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDOztBQUVyQyxZQUFJLFFBQVEsR0FBRyxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDL0IsWUFBSSxZQUFZLEdBQUcsT0FBTyxDQUFDO0FBQzNCLFlBQUksYUFBYSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRXZELGdCQUFRLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztBQUM3RCxjQUFNLHVCQUF1QixDQUFDLG9CQUFvQixFQUFFLENBQUM7QUFDckQsY0FBTSxDQUFDLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLG9CQUFvQixDQUN0RCxVQUFVLEVBQ1YsWUFBWSxFQUNaLGFBQWEsQ0FBQyxDQUFDOztBQUVuQixnQkFBUSxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7QUFDL0UsY0FBTSx1QkFBdUIsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDOztBQUVyRCxjQUFNLENBQUMsUUFBUSxDQUFDLG9CQUFvQixDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzs7QUFFeEQsZ0JBQVEsQ0FBQyxVQUFVLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxFQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0FBQzdELGNBQU0sQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO09BQ3BDLEVBQUMsQ0FBQztLQUNKLENBQUMsQ0FBQzs7QUFFSCxNQUFFLENBQUMsd0VBQXdFLEVBQUUsWUFBTTtBQUNqRixxQkFBZSxtQkFBQyxhQUFZO0FBQzFCLFlBQUksUUFBUSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDN0MsWUFBSSxRQUFRLEdBQUc7QUFDYiw4QkFBb0IsRUFBQSw4QkFBQyxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFO0FBQ2xELG1CQUFPLEVBQUMsS0FBSyxFQUFMLEtBQUssRUFBRSxRQUFRLEVBQVIsUUFBUSxFQUFDLENBQUM7V0FDMUI7U0FDRixDQUFDO0FBQ0YsYUFBSyxDQUFDLFFBQVEsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ3pELGtCQUFVLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDOztBQUVyQyxZQUFJLFNBQVMsR0FBRyxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDaEMsWUFBSSxhQUFhLEdBQUcsT0FBTyxDQUFDO0FBQzVCLFlBQUksY0FBYyxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRXhELGdCQUFRLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztBQUM5RCxjQUFNLHVCQUF1QixDQUFDLG9CQUFvQixFQUFFLENBQUM7QUFDckQsY0FBTSxDQUFDLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLG9CQUFvQixDQUN0RCxVQUFVLEVBQ1YsYUFBYSxFQUNiLGNBQWMsQ0FBQyxDQUFDOztBQUVwQixZQUFJLFNBQVMsR0FBRyxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDaEMsWUFBSSxhQUFhLEdBQUcsT0FBTyxDQUFDO0FBQzVCLFlBQUksY0FBYyxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekQsZ0JBQVEsQ0FBQyxVQUFVLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxFQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0FBQzlELGNBQU0sdUJBQXVCLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztBQUNyRCxjQUFNLENBQUMsUUFBUSxDQUFDLG9CQUFvQixDQUFDLENBQUMsb0JBQW9CLENBQ3RELFVBQVUsRUFDVixhQUFhLEVBQ2IsY0FBYyxDQUFDLENBQUM7O0FBRXBCLGNBQU0sQ0FBQyxRQUFRLENBQUMsb0JBQW9CLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDOztBQUV4RCxnQkFBUSxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7QUFDOUQsY0FBTSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7T0FDcEMsRUFBQyxDQUFDO0tBQ0osQ0FBQyxDQUFDOztBQUVILE1BQUUsQ0FBQyxvRUFBb0UsRUFBRSxZQUFNO0FBQzdFLHFCQUFlLG1CQUFDLGFBQVk7QUFDMUIsWUFBSSxLQUFLLEdBQUcsQ0FDVixJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQzNDLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FDNUMsQ0FBQztBQUNGLFlBQUksUUFBUSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDN0MsWUFBSSxRQUFRLEdBQUc7QUFDYix1QkFBYSxFQUFBLHVCQUFDLGdCQUE0QixFQUFFLGNBQXFCLEVBQUU7QUFDakUsbUJBQU8sRUFBQyxLQUFLLEVBQUwsS0FBSyxFQUFFLFFBQVEsRUFBUixRQUFRLEVBQUMsQ0FBQztXQUMxQjtTQUNGLENBQUM7QUFDRixhQUFLLENBQUMsUUFBUSxFQUFFLGVBQWUsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ2xELGtCQUFVLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDOztBQUVyQyxZQUFJLFFBQVEsR0FBRyxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7O0FBRS9CLGdCQUFRLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztBQUM3RCxjQUFNLHVCQUF1QixDQUFDLG9CQUFvQixFQUFFLENBQUM7QUFDckQsY0FBTSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7O0FBRTFFLGdCQUFRLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztBQUNwRSxjQUFNLHVCQUF1QixDQUFDLG9CQUFvQixFQUFFLENBQUM7O0FBRXJELGNBQU0sQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzs7QUFFakQsZ0JBQVEsQ0FBQyxVQUFVLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxFQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0FBQzdELGNBQU0sQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO09BQ3BDLEVBQUMsQ0FBQztLQUNKLENBQUMsQ0FBQzs7QUFFSCxNQUFFLENBQUMsdUVBQXVFLEVBQUUsWUFBTTtBQUNoRixxQkFBZSxtQkFBQyxhQUFZO0FBQzFCLFlBQUksS0FBSyxHQUFHLENBQ1YsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUMzQyxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQzVDLENBQUM7QUFDRixZQUFJLFFBQVEsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzdDLFlBQUksUUFBUSxHQUFHO0FBQ2IsdUJBQWEsRUFBQSx1QkFBQyxnQkFBNEIsRUFBRSxRQUFlLEVBQUU7QUFDM0QsbUJBQU8sRUFBQyxLQUFLLEVBQUwsS0FBSyxFQUFFLFFBQVEsRUFBUixRQUFRLEVBQUMsQ0FBQztXQUMxQjtTQUNGLENBQUM7QUFDRixhQUFLLENBQUMsUUFBUSxFQUFFLGVBQWUsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ2xELGtCQUFVLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDOztBQUVyQyxZQUFJLFNBQVMsR0FBRyxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7O0FBRWhDLGdCQUFRLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztBQUM5RCxjQUFNLHVCQUF1QixDQUFDLG9CQUFvQixFQUFFLENBQUM7QUFDckQsY0FBTSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLENBQUM7O0FBRTNFLFlBQUksU0FBUyxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNoQyxnQkFBUSxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7QUFDOUQsY0FBTSx1QkFBdUIsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO0FBQ3JELGNBQU0sQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLENBQUMsb0JBQW9CLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDOztBQUUzRSxjQUFNLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRWpELGdCQUFRLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztBQUM5RCxjQUFNLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztPQUNwQyxFQUFDLENBQUM7S0FDSixDQUFDLENBQUM7R0FDSixDQUFDLENBQUM7O0FBRUgsVUFBUSxDQUFDLGlDQUFpQyxFQUFFLFlBQU07QUFDaEQsUUFBSSxRQUFRLEdBQUc7QUFDYiwwQkFBb0IsRUFBQSw4QkFBQyxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFO0FBQ2xELGVBQU8sRUFBQyxLQUFLLEVBQUwsS0FBSyxFQUFFLFFBQVEsRUFBQSxvQkFBRyxFQUFFLEVBQUMsQ0FBQztPQUMvQjtLQUNGLENBQUM7O0FBRUYsY0FBVSxDQUFDLFlBQU07QUFDZixnQkFBVSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQztLQUN0QyxDQUFDLENBQUM7O0FBRUgsTUFBRSxDQUFDLHVEQUF1RCxFQUFFLFlBQU07QUFDaEUscUJBQWUsbUJBQUMsYUFBWTtBQUMxQixZQUFJLFFBQVEsR0FBRyxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7O0FBRS9CLGNBQU0sQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQzs7QUFFcEUsZ0JBQVEsQ0FBQyxVQUFVLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxFQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0FBQzdELGNBQU0sdUJBQXVCLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztBQUNyRCxjQUFNLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBRW5FLGdCQUFRLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztBQUM3RCxjQUFNLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7T0FDckUsRUFBQyxDQUFDO0tBQ0osQ0FBQyxDQUFDOztBQUVILE1BQUUsQ0FBQyxpREFBaUQsRUFBRSxZQUFNO0FBQzFELHFCQUFlLG1CQUFDLGFBQVk7QUFDMUIsWUFBSSxRQUFRLEdBQUcsSUFBSSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDOzs7QUFHL0IsZ0JBQVEsQ0FBQyxVQUFVLEVBQUUsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQzVDLGNBQU0sQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQzs7QUFFcEUsZ0JBQVEsQ0FBQyxhQUFhLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxFQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0FBQzlELGNBQU0sdUJBQXVCLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztBQUNyRCxjQUFNLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBRW5FLGdCQUFRLENBQUMsYUFBYSxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztBQUMzQyxjQUFNLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7T0FDckUsRUFBQyxDQUFDO0tBQ0osQ0FBQyxDQUFDO0dBQ0osQ0FBQyxDQUFDOztBQUVILFVBQVEsQ0FBQywyQkFBMkIsRUFBRSxZQUFNO0FBQzFDLE1BQUUsQ0FBQywrREFBK0QsRUFBRSxZQUFNO0FBQ3hFLHFCQUFlLG1CQUFDLGFBQVk7QUFDMUIsWUFBSSxRQUFRLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM3QyxZQUFJLFFBQVEsR0FBRztBQUNiLDhCQUFvQixFQUFBLDhCQUFDLGdCQUFnQixFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7QUFDbEQsbUJBQU8sRUFBQyxLQUFLLEVBQUwsS0FBSyxFQUFFLFFBQVEsRUFBUixRQUFRLEVBQUMsQ0FBQztXQUMxQjtTQUNGLENBQUM7QUFDRixhQUFLLENBQUMsUUFBUSxFQUFFLHNCQUFzQixDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDekQsa0JBQVUsQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7O0FBRXJDLFlBQUksYUFBYSxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNwQyxnQkFBUSxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7QUFDbEUsY0FBTSx1QkFBdUIsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDOztBQUVyRCxrQkFBVSxDQUFDLHVCQUF1QixDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3BELFlBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLGNBQWMsRUFBRSwyQkFBMkIsQ0FBQyxDQUFDO0FBQ3BFLGNBQU0sQ0FBQyxRQUFRLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxvQkFBb0IsQ0FDdEQsVUFBVSxFQUNWLE9BQU8sRUFDUCxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekMsZ0JBQVEsQ0FBQztpQkFBTSxRQUFRLENBQUMsU0FBUyxLQUFLLENBQUM7U0FBQSxDQUFDLENBQUM7T0FDMUMsRUFBQyxDQUFDO0tBQ0osQ0FBQyxDQUFDO0dBQ0osQ0FBQyxDQUFDOztBQUVILFVBQVEsQ0FBQyxVQUFVLEVBQUUsWUFBTTtBQUN6QixNQUFFLENBQUMsNkRBQTZELEVBQUUsWUFBTTtBQUN0RSxxQkFBZSxtQkFBQyxhQUFZO0FBQzFCLFlBQUksU0FBUyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDOUMsWUFBSSxTQUFTLEdBQUc7QUFDZCw4QkFBb0IsRUFBQSw4QkFBQyxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFO0FBQ2xELG1CQUFPLEVBQUMsS0FBSyxFQUFMLEtBQUssRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFDLENBQUM7V0FDckM7QUFDRCxrQkFBUSxFQUFFLENBQUM7U0FDWixDQUFDO0FBQ0Ysa0JBQVUsQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUM7O0FBRXRDLFlBQUksU0FBUyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDOUMsWUFBSSxTQUFTLEdBQUc7QUFDZCw4QkFBb0IsRUFBQSw4QkFBQyxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFO0FBQ2xELG1CQUFPLEVBQUMsS0FBSyxFQUFMLEtBQUssRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFDLENBQUM7V0FDckM7QUFDRCxrQkFBUSxFQUFFLENBQUM7U0FDWixDQUFDO0FBQ0Ysa0JBQVUsQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUM7O0FBRXRDLFlBQUksYUFBYSxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNwQyxnQkFBUSxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7QUFDbEUsY0FBTSx1QkFBdUIsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO0FBQ3JELGdCQUFRLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQzs7QUFFbEUsY0FBTSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEMsY0FBTSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7T0FDckMsRUFBQyxDQUFDO0tBQ0osQ0FBQyxDQUFDOztBQUVILE1BQUUsQ0FBQyw0REFBNEQsRUFBRSxZQUFNO0FBQ3JFLHFCQUFlLG1CQUFDLGFBQVk7QUFDMUIsWUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM5QyxZQUFJLFNBQVMsR0FBRztBQUNkLDhCQUFvQixFQUFBLDhCQUFDLGdCQUFnQixFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7QUFDbEQsbUJBQU8sRUFBQyxLQUFLLEVBQUwsS0FBSyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUMsQ0FBQztXQUNyQztBQUNELGtCQUFRLEVBQUUsQ0FBQztTQUNaLENBQUM7QUFDRixrQkFBVSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQzs7QUFFdEMsWUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM5QyxZQUFJLFNBQVMsR0FBRztBQUNkLDhCQUFvQixFQUFBLDhCQUFDLGdCQUFnQixFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7QUFDbEQsbUJBQU8sRUFBQyxLQUFLLEVBQUwsS0FBSyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUMsQ0FBQztXQUNyQztBQUNELGtCQUFRLEVBQUUsQ0FBQztTQUNaLENBQUM7QUFDRixrQkFBVSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQzs7QUFFdEMsWUFBSSxhQUFhLEdBQUcsSUFBSSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3BDLGdCQUFRLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztBQUNsRSxjQUFNLHVCQUF1QixDQUFDLG9CQUFvQixFQUFFLENBQUM7QUFDckQsZ0JBQVEsQ0FBQyxVQUFVLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFBRSxFQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDOztBQUVsRSxjQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwQyxjQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztPQUNyQyxFQUFDLENBQUM7S0FDSixDQUFDLENBQUM7O0FBRUgsTUFBRSxDQUFDLDhDQUE4QyxFQUFFLFlBQU07QUFDdkQscUJBQWUsbUJBQUMsYUFBWTtBQUMxQixZQUFJLFNBQVMsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzlDLFlBQUksU0FBUyxHQUFHO0FBQ2QsOEJBQW9CLEVBQUEsOEJBQUMsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRTtBQUNsRCxtQkFBTyxFQUFDLEtBQUssRUFBTCxLQUFLLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBQyxDQUFDO1dBQ3JDO1NBQ0YsQ0FBQztBQUNGLGtCQUFVLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDOztBQUV0QyxZQUFJLFNBQVMsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzlDLFlBQUksU0FBUyxHQUFHO0FBQ2QsOEJBQW9CLEVBQUEsOEJBQUMsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRTtBQUNsRCxtQkFBTyxFQUFDLEtBQUssRUFBTCxLQUFLLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBQyxDQUFDO1dBQ3JDO0FBQ0Qsa0JBQVEsRUFBRSxDQUFDO1NBQ1osQ0FBQztBQUNGLGtCQUFVLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDOztBQUV0QyxZQUFJLGFBQWEsR0FBRyxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDcEMsZ0JBQVEsQ0FBQyxVQUFVLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFBRSxFQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0FBQ2xFLGNBQU0sdUJBQXVCLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztBQUNyRCxnQkFBUSxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7O0FBRWxFLGNBQU0sQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3BDLGNBQU0sQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO09BQ3JDLEVBQUMsQ0FBQztLQUNKLENBQUMsQ0FBQzs7QUFFSCxNQUFFLENBQUMsNkNBQTZDLEVBQUUsWUFBTTtBQUN0RCxxQkFBZSxtQkFBQyxhQUFZO0FBQzFCLFlBQUksU0FBUyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDOUMsWUFBSSxTQUFTLEdBQUc7QUFDZCw4QkFBb0IsRUFBQSw4QkFBQyxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFO0FBQ2xELG1CQUFPLEVBQUMsS0FBSyxFQUFMLEtBQUssRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFDLENBQUM7V0FDckM7QUFDRCxrQkFBUSxFQUFFLENBQUMsQ0FBQztTQUNiLENBQUM7QUFDRixrQkFBVSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQzs7QUFFdEMsWUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM5QyxZQUFJLFNBQVMsR0FBRztBQUNkLDhCQUFvQixFQUFBLDhCQUFDLGdCQUFnQixFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7QUFDbEQsbUJBQU8sRUFBQyxLQUFLLEVBQUwsS0FBSyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUMsQ0FBQztXQUNyQztTQUNGLENBQUM7QUFDRixrQkFBVSxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQzs7QUFFdEMsWUFBSSxhQUFhLEdBQUcsSUFBSSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3BDLGdCQUFRLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztBQUNsRSxjQUFNLHVCQUF1QixDQUFDLG9CQUFvQixFQUFFLENBQUM7QUFDckQsZ0JBQVEsQ0FBQyxVQUFVLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFBRSxFQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDOztBQUVsRSxjQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwQyxjQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztPQUNyQyxFQUFDLENBQUM7S0FDSixDQUFDLENBQUM7O0FBRUgsTUFBRSxDQUFDLHVEQUF1RCxFQUFFLFlBQU07QUFDaEUscUJBQWUsbUJBQUMsYUFBWTtBQUMxQixZQUFJLFNBQVMsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzlDLFlBQUksU0FBUyxHQUFHO0FBQ2QsOEJBQW9CLEVBQUEsOEJBQUMsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRTtBQUNsRCxtQkFBTyxFQUFDLEtBQUssRUFBTCxLQUFLLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBQyxDQUFDO1dBQ3JDO1NBQ0YsQ0FBQztBQUNGLGtCQUFVLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDOztBQUV0QyxZQUFJLFNBQVMsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzlDLFlBQUksU0FBUyxHQUFHO0FBQ2QsOEJBQW9CLEVBQUEsOEJBQUMsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRTtBQUNsRCxtQkFBTyxFQUFDLEtBQUssRUFBTCxLQUFLLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBQyxDQUFDO1dBQ3JDO1NBQ0YsQ0FBQztBQUNGLGtCQUFVLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDOztBQUV0QyxZQUFJLGFBQWEsR0FBRyxJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDcEMsZ0JBQVEsQ0FBQyxVQUFVLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFBRSxFQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0FBQ2xFLGNBQU0sdUJBQXVCLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztBQUNyRCxnQkFBUSxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7O0FBRWxFLGNBQU0sQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3BDLGNBQU0sQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO09BQ3JDLEVBQUMsQ0FBQztLQUNKLENBQUMsQ0FBQzs7QUFFSCxNQUFFLENBQUMseUVBQXlFLEVBQUUsWUFBTTtBQUNsRixxQkFBZSxtQkFBQyxhQUFZO0FBQzFCLFlBQUksU0FBUyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDOUMsWUFBSSxTQUFTLEdBQUc7QUFDZCw4QkFBb0IsRUFBQSw4QkFBQyxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFO0FBQ2xELG1CQUFPLEVBQUMsS0FBSyxFQUFMLEtBQUssRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFDLENBQUM7V0FDckM7QUFDRCxrQkFBUSxFQUFFLENBQUM7U0FDWixDQUFDO0FBQ0YsWUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM5QyxZQUFJLFNBQVMsR0FBRztBQUNkLDhCQUFvQixFQUFBLDhCQUFDLGdCQUFnQixFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7QUFDbEQsbUJBQU8sRUFBQyxLQUFLLEVBQUwsS0FBSyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUMsQ0FBQztXQUNyQztBQUNELGtCQUFRLEVBQUUsQ0FBQztTQUNaLENBQUM7O0FBRUYsa0JBQVUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQzs7QUFFbkQsWUFBSSxhQUFhLEdBQUcsSUFBSSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3BDLGdCQUFRLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztBQUNsRSxjQUFNLHVCQUF1QixDQUFDLG9CQUFvQixFQUFFLENBQUM7QUFDckQsZ0JBQVEsQ0FBQyxVQUFVLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFBRSxFQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDOztBQUVsRSxjQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwQyxjQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztPQUNyQyxFQUFDLENBQUM7S0FDSixDQUFDLENBQUM7R0FDSixDQUFDLENBQUM7O0FBRUgsVUFBUSxDQUFDLHNCQUFzQixFQUFFLFlBQU07QUFDckMsTUFBRSxDQUFDLCtCQUErQixFQUFFLFlBQU07QUFDeEMscUJBQWUsbUJBQUMsYUFBWTtBQUMxQixZQUFJLFFBQVEsR0FBRyxDQUNiO0FBQ0UsZUFBSyxFQUFFLFdBQVc7QUFDbEIsa0JBQVEsRUFBRSxPQUFPLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQztTQUN6QyxFQUNEO0FBQ0UsZUFBSyxFQUFFLFdBQVc7QUFDbEIsa0JBQVEsRUFBRSxPQUFPLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQztTQUN6QyxDQUNGLENBQUM7QUFDRixZQUFJLFFBQVEsR0FBRztBQUNiLDhCQUFvQixFQUFBLDhCQUFDLGdCQUFnQixFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7QUFDbEQsbUJBQU8sRUFBQyxLQUFLLEVBQUwsS0FBSyxFQUFFLFFBQVEsRUFBUixRQUFRLEVBQUMsQ0FBQztXQUMxQjtTQUNGLENBQUM7QUFDRixrQkFBVSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQzs7QUFFckMsWUFBSSxRQUFRLEdBQUcsSUFBSSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQy9CLGdCQUFRLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztBQUM3RCxjQUFNLHVCQUF1QixDQUFDLG9CQUFvQixFQUFFLENBQUM7QUFDckQsZ0JBQVEsQ0FBQyxVQUFVLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxFQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDOztBQUU3RCxZQUFJLGdCQUFnQixHQUFHLGNBQWMsQ0FBQyxhQUFhLENBQUMsNEJBQTRCLENBQUMsQ0FBQztBQUNsRixjQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQzs7QUFFbkMsWUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsY0FBYyxFQUFFLGdCQUFnQixDQUFDLENBQUM7O0FBRXpELGNBQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQyxjQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0MsY0FBTSxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsNEJBQTRCLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztPQUNsRixFQUFDLENBQUM7S0FDSixDQUFDLENBQUM7O0FBRUgsTUFBRSxDQUFDLGdDQUFnQyxFQUFFLFlBQU07QUFDekMscUJBQWUsbUJBQUMsYUFBWTtBQUMxQixZQUFJLFFBQVEsR0FBRyxDQUNiO0FBQ0UsZUFBSyxFQUFFLFdBQVc7QUFDbEIsa0JBQVEsRUFBRSxPQUFPLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQztTQUN6QyxFQUNEO0FBQ0UsZUFBSyxFQUFFLFdBQVc7QUFDbEIsa0JBQVEsRUFBRSxPQUFPLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQztTQUN6QyxDQUNGLENBQUM7QUFDRixZQUFJLFFBQVEsR0FBRztBQUNiLDhCQUFvQixFQUFBLDhCQUFDLGdCQUFnQixFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7QUFDbEQsbUJBQU8sRUFBQyxLQUFLLEVBQUwsS0FBSyxFQUFFLFFBQVEsRUFBUixRQUFRLEVBQUMsQ0FBQztXQUMxQjtTQUNGLENBQUM7QUFDRixrQkFBVSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQzs7QUFFckMsWUFBSSxRQUFRLEdBQUcsSUFBSSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQy9CLGdCQUFRLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztBQUM3RCxjQUFNLHVCQUF1QixDQUFDLG9CQUFvQixFQUFFLENBQUM7QUFDckQsZ0JBQVEsQ0FBQyxVQUFVLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxFQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDOztBQUU3RCxZQUFJLGdCQUFnQixHQUFHLGNBQWMsQ0FBQyxhQUFhLENBQUMsNEJBQTRCLENBQUMsQ0FBQztBQUNsRixjQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQzs7QUFFbkMsWUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsY0FBYyxFQUFFLGdCQUFnQixDQUFDLENBQUM7QUFDekQsWUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsY0FBYyxFQUFFLGdCQUFnQixDQUFDLENBQUM7O0FBRXpELGNBQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQyxjQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0MsY0FBTSxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsNEJBQTRCLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztPQUNsRixFQUFDLENBQUM7S0FDSixDQUFDLENBQUM7O0FBRUgsTUFBRSxDQUFDLGVBQWUsRUFBRSxZQUFNO0FBQ3hCLHFCQUFlLG1CQUFDLGFBQVk7QUFDMUIsWUFBSSxRQUFRLEdBQUcsQ0FDYjtBQUNFLGVBQUssRUFBRSxXQUFXO0FBQ2xCLGtCQUFRLEVBQUUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUM7U0FDekMsRUFDRDtBQUNFLGVBQUssRUFBRSxXQUFXO0FBQ2xCLGtCQUFRLEVBQUUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUM7U0FDekMsQ0FDRixDQUFDO0FBQ0YsWUFBSSxRQUFRLEdBQUc7QUFDYiw4QkFBb0IsRUFBQSw4QkFBQyxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFO0FBQ2xELG1CQUFPLEVBQUMsS0FBSyxFQUFMLEtBQUssRUFBRSxRQUFRLEVBQVIsUUFBUSxFQUFDLENBQUM7V0FDMUI7U0FDRixDQUFDO0FBQ0Ysa0JBQVUsQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7O0FBRXJDLFlBQUksUUFBUSxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUMvQixnQkFBUSxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7QUFDN0QsY0FBTSx1QkFBdUIsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO0FBQ3JELGdCQUFRLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQzs7QUFFN0QsWUFBSSxnQkFBZ0IsR0FBRyxjQUFjLENBQUMsYUFBYSxDQUFDLDRCQUE0QixDQUFDLENBQUM7QUFDbEYsY0FBTSxDQUFDLGdCQUFnQixDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7O0FBRW5DLFlBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLGNBQWMsRUFBRSxhQUFhLENBQUMsQ0FBQzs7QUFFdEQsY0FBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQy9DLGNBQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQyxjQUFNLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO09BQ2xGLEVBQUMsQ0FBQztLQUNKLENBQUMsQ0FBQztHQUNKLENBQUMsQ0FBQzs7QUFFSCxVQUFRLENBQUMsd0NBQXdDLEVBQUUsWUFBTTtBQUN2RCxjQUFVLENBQUMsWUFBTTtBQUNmLGdCQUFVLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2hDLFVBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLHNDQUFzQyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQzlELFVBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLDRCQUE0QixFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQ2xELENBQUMsQ0FBQzs7QUFFSCxNQUFFLENBQUMsMERBQTBELEVBQUUsWUFBTTtBQUNuRSxxQkFBZSxtQkFBQyxhQUFZOztBQUUxQixZQUFJLFFBQVEsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzdDLFlBQUksUUFBUSxHQUFHO0FBQ2IsOEJBQW9CLEVBQUEsOEJBQUMsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRTtBQUNsRCxtQkFBTyxFQUFDLEtBQUssRUFBTCxLQUFLLEVBQUUsUUFBUSxFQUFSLFFBQVEsRUFBQyxDQUFDO1dBQzFCO1NBQ0YsQ0FBQztBQUNGLGFBQUssQ0FBQyxRQUFRLEVBQUUsc0JBQXNCLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUN6RCxrQkFBVSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQzs7QUFFckMsWUFBSSxRQUFRLEdBQUcsSUFBSSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQy9CLFlBQUksWUFBWSxHQUFHLE9BQU8sQ0FBQztBQUMzQixZQUFJLG1CQUFtQixHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0QsZ0JBQVEsQ0FBQyxVQUFVLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxFQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0FBQzdELGNBQU0sdUJBQXVCLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztBQUNyRCxjQUFNLENBQUMsUUFBUSxDQUFDLG9CQUFvQixDQUFDLENBQUMsb0JBQW9CLENBQ3RELFVBQVUsRUFDVixZQUFZLEVBQ1osbUJBQW1CLENBQUMsQ0FBQztBQUN6QixjQUFNLENBQUMsUUFBUSxDQUFDLG9CQUFvQixDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztPQUN6RCxFQUFDLENBQUM7S0FDSixDQUFDLENBQUM7R0FDSixDQUFDLENBQUM7Q0FDSixDQUFDLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL2h5cGVyY2xpY2svc3BlYy9IeXBlcmNsaWNrLXNwZWMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG4vKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cblxudmFyIHtQb2ludCwgUmFuZ2V9ID0gcmVxdWlyZSgnYXRvbScpO1xudmFyIEh5cGVyY2xpY2sgPSByZXF1aXJlKCcuLi9saWIvSHlwZXJjbGljaycpO1xuXG5kZXNjcmliZSgnSHlwZXJjbGljaycsICgpID0+IHtcbiAgdmFyIHRleHRFZGl0b3I7XG4gIHZhciB0ZXh0RWRpdG9yVmlldztcbiAgdmFyIGh5cGVyY2xpY2s7XG4gIHZhciBoeXBlcmNsaWNrRm9yVGV4dEVkaXRvcjtcbiAgYmVmb3JlRWFjaCgoKSA9PiB3YWl0c0ZvclByb21pc2UoYXN5bmMgKCkgPT4ge1xuICAgIHRleHRFZGl0b3IgPSBhd2FpdCBhdG9tLndvcmtzcGFjZS5vcGVuKCdoeXBlcmNsaWNrLnR4dCcpO1xuICAgIHRleHRFZGl0b3JWaWV3ID0gYXRvbS52aWV3cy5nZXRWaWV3KHRleHRFZGl0b3IpO1xuXG4gICAgLy8gV2UgbmVlZCB0aGUgdmlldyBhdHRhY2hlZCB0byB0aGUgRE9NIGZvciB0aGUgbW91c2UgZXZlbnRzIHRvIHdvcmsuXG4gICAgamFzbWluZS5hdHRhY2hUb0RPTSh0ZXh0RWRpdG9yVmlldyk7XG5cbiAgICBoeXBlcmNsaWNrID0gbmV3IEh5cGVyY2xpY2soKTtcbiAgICBoeXBlcmNsaWNrRm9yVGV4dEVkaXRvciA9IGh5cGVyY2xpY2suX2h5cGVyY2xpY2tGb3JUZXh0RWRpdG9ycy52YWx1ZXMoKS5uZXh0KCkudmFsdWU7XG4gIH0pKTtcblxuICBhZnRlckVhY2goKCkgPT4ge1xuICAgIGh5cGVyY2xpY2suZGlzcG9zZSgpO1xuICB9KTtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgcGl4ZWwgcG9zaXRpb24gaW4gdGhlIERPTSBvZiB0aGUgdGV4dCBlZGl0b3IncyBzY3JlZW4gcG9zaXRpb24uXG4gICAqIFRoaXMgaXMgdXNlZCBmb3IgZGlzcGF0Y2hpbmcgbW91c2UgZXZlbnRzIGluIHRoZSB0ZXh0IGVkaXRvci5cbiAgICpcbiAgICogQWRhcHRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2F0b20vYmxvYi81MjcyNTg0ZDI5MTBlNWIzZjJiMGYzMDlhYWI0Nzc1ZWIwZjc3OWE2L3NwZWMvdGV4dC1lZGl0b3ItY29tcG9uZW50LXNwZWMuY29mZmVlI0wyODQ1XG4gICAqL1xuICBmdW5jdGlvbiBjbGllbnRDb29yZGluYXRlc0ZvclNjcmVlblBvc2l0aW9uKHNjcmVlblBvc2l0aW9uOiBQb2ludCk6IHtjbGllbnRYOiBudW1iZXI7IGNsaWVudFk6IG51bWJlcn0ge1xuICAgIHZhciBwb3NpdGlvbk9mZnNldCA9IHRleHRFZGl0b3JWaWV3LnBpeGVsUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihzY3JlZW5Qb3NpdGlvbik7XG4gICAgdmFyIHNjcm9sbFZpZXdDbGllbnRSZWN0ID0gdGV4dEVkaXRvclZpZXcuY29tcG9uZW50LmRvbU5vZGVcbiAgICAgICAgLnF1ZXJ5U2VsZWN0b3IoJy5zY3JvbGwtdmlldycpXG4gICAgICAgIC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICB2YXIgY2xpZW50WCA9IHNjcm9sbFZpZXdDbGllbnRSZWN0LmxlZnQgKyBwb3NpdGlvbk9mZnNldC5sZWZ0IC0gdGV4dEVkaXRvci5nZXRTY3JvbGxMZWZ0KCk7XG4gICAgdmFyIGNsaWVudFkgPSBzY3JvbGxWaWV3Q2xpZW50UmVjdC50b3AgKyBwb3NpdGlvbk9mZnNldC50b3AgLSB0ZXh0RWRpdG9yLmdldFNjcm9sbFRvcCgpO1xuICAgIHJldHVybiB7Y2xpZW50WCwgY2xpZW50WX07XG4gIH1cblxuICBmdW5jdGlvbiBkaXNwYXRjaChcbiAgICAgIGV2ZW50Q2xhc3M6IEtleWJvYXJkRXZlbnQgfCBNb3VzZUV2ZW50LFxuICAgICAgdHlwZTogc3RyaW5nLFxuICAgICAgcG9zaXRpb246IFBvaW50LFxuICAgICAgcHJvcGVydGllcz86IG1peGVkKTogdm9pZCB7XG4gICAgdmFyIHtjbGllbnRYLCBjbGllbnRZfSA9IGNsaWVudENvb3JkaW5hdGVzRm9yU2NyZWVuUG9zaXRpb24ocG9zaXRpb24pO1xuICAgIGlmIChwcm9wZXJ0aWVzKSB7XG4gICAgICBwcm9wZXJ0aWVzLmNsaWVudFggPSBjbGllbnRYO1xuICAgICAgcHJvcGVydGllcy5jbGllbnRZID0gY2xpZW50WTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJvcGVydGllcyA9IHtjbGllbnRYLCBjbGllbnRZfTtcbiAgICB9XG4gICAgdmFyIGV2ZW50ID0gbmV3IGV2ZW50Q2xhc3ModHlwZSwgcHJvcGVydGllcyk7XG4gICAgdGV4dEVkaXRvclZpZXcuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gIH1cblxuICBkZXNjcmliZSgnPG1ldGEtbW91c2Vtb3ZlPiArIDxtZXRhLW1vdXNlZG93bj4nLCAoKSA9PiB7XG4gICAgaXQoJ2NvbnN1bWVzIHNpbmdsZS13b3JkIHByb3ZpZGVycyB3aXRob3V0IHdvcmRSZWdFeHAnLCAoKSA9PiB7XG4gICAgICB3YWl0c0ZvclByb21pc2UoYXN5bmMgKCkgPT4ge1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBqYXNtaW5lLmNyZWF0ZVNweSgnY2FsbGJhY2snKTtcbiAgICAgICAgdmFyIHByb3ZpZGVyID0ge1xuICAgICAgICAgIGdldFN1Z2dlc3Rpb25Gb3JXb3JkKHNvdXJjZVRleHRFZGl0b3IsIHRleHQsIHJhbmdlKSB7XG4gICAgICAgICAgICByZXR1cm4ge3JhbmdlLCBjYWxsYmFja307XG4gICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgICAgc3B5T24ocHJvdmlkZXIsICdnZXRTdWdnZXN0aW9uRm9yV29yZCcpLmFuZENhbGxUaHJvdWdoKCk7XG4gICAgICAgIGh5cGVyY2xpY2suY29uc3VtZVByb3ZpZGVyKHByb3ZpZGVyKTtcblxuICAgICAgICB2YXIgcG9zaXRpb24gPSBuZXcgUG9pbnQoMCwgMSk7XG4gICAgICAgIHZhciBleHBlY3RlZFRleHQgPSAnd29yZDEnO1xuICAgICAgICB2YXIgZXhwZWN0ZWRSYW5nZSA9IFJhbmdlLmZyb21PYmplY3QoW1swLCAwXSwgWzAsIDVdXSk7XG5cbiAgICAgICAgZGlzcGF0Y2goTW91c2VFdmVudCwgJ21vdXNlbW92ZScsIHBvc2l0aW9uLCB7bWV0YUtleTogdHJ1ZX0pO1xuICAgICAgICBhd2FpdCBoeXBlcmNsaWNrRm9yVGV4dEVkaXRvci5nZXRTdWdnZXN0aW9uQXRNb3VzZSgpO1xuICAgICAgICBleHBlY3QocHJvdmlkZXIuZ2V0U3VnZ2VzdGlvbkZvcldvcmQpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxuICAgICAgICAgICAgdGV4dEVkaXRvcixcbiAgICAgICAgICAgIGV4cGVjdGVkVGV4dCxcbiAgICAgICAgICAgIGV4cGVjdGVkUmFuZ2UpO1xuXG4gICAgICAgIGRpc3BhdGNoKE1vdXNlRXZlbnQsICdtb3VzZWRvd24nLCBwb3NpdGlvbiwge21ldGFLZXk6IHRydWV9KTtcbiAgICAgICAgZXhwZWN0KGNhbGxiYWNrLmNhbGxDb3VudCkudG9CZSgxKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2NvbnN1bWVzIHNpbmdsZS13b3JkIHByb3ZpZGVycyB3aXRoIHdvcmRSZWdFeHAnLCAoKSA9PiB7XG4gICAgICB3YWl0c0ZvclByb21pc2UoYXN5bmMgKCkgPT4ge1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBqYXNtaW5lLmNyZWF0ZVNweSgnY2FsbGJhY2snKTtcbiAgICAgICAgdmFyIHByb3ZpZGVyID0ge1xuICAgICAgICAgIGdldFN1Z2dlc3Rpb25Gb3JXb3JkKHNvdXJjZVRleHRFZGl0b3IsIHRleHQsIHJhbmdlKSB7XG4gICAgICAgICAgICByZXR1cm4ge3JhbmdlLCBjYWxsYmFja307XG4gICAgICAgICAgfSxcbiAgICAgICAgICB3b3JkUmVnRXhwOiAvd29yZC9nLFxuICAgICAgICB9O1xuICAgICAgICBzcHlPbihwcm92aWRlciwgJ2dldFN1Z2dlc3Rpb25Gb3JXb3JkJykuYW5kQ2FsbFRocm91Z2goKTtcbiAgICAgICAgaHlwZXJjbGljay5jb25zdW1lUHJvdmlkZXIocHJvdmlkZXIpO1xuXG4gICAgICAgIHZhciBwb3NpdGlvbiA9IG5ldyBQb2ludCgwLCA4KTtcbiAgICAgICAgdmFyIGV4cGVjdGVkVGV4dCA9ICd3b3JkJztcbiAgICAgICAgdmFyIGV4cGVjdGVkUmFuZ2UgPSBSYW5nZS5mcm9tT2JqZWN0KFtbMCwgNl0sIFswLCAxMF1dKTtcblxuICAgICAgICBkaXNwYXRjaChNb3VzZUV2ZW50LCAnbW91c2Vtb3ZlJywgcG9zaXRpb24sIHttZXRhS2V5OiB0cnVlfSk7XG4gICAgICAgIGF3YWl0IGh5cGVyY2xpY2tGb3JUZXh0RWRpdG9yLmdldFN1Z2dlc3Rpb25BdE1vdXNlKCk7XG4gICAgICAgIGV4cGVjdChwcm92aWRlci5nZXRTdWdnZXN0aW9uRm9yV29yZCkudG9IYXZlQmVlbkNhbGxlZFdpdGgoXG4gICAgICAgICAgICB0ZXh0RWRpdG9yLFxuICAgICAgICAgICAgZXhwZWN0ZWRUZXh0LFxuICAgICAgICAgICAgZXhwZWN0ZWRSYW5nZSk7XG5cbiAgICAgICAgZGlzcGF0Y2goTW91c2VFdmVudCwgJ21vdXNlZG93bicsIHBvc2l0aW9uLCB7bWV0YUtleTogdHJ1ZX0pO1xuICAgICAgICBleHBlY3QoY2FsbGJhY2suY2FsbENvdW50KS50b0JlKDEpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnY29uc3VtZXMgbXVsdGktcmFuZ2UgcHJvdmlkZXJzJywgKCkgPT4ge1xuICAgICAgd2FpdHNGb3JQcm9taXNlKGFzeW5jICgpID0+IHtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gamFzbWluZS5jcmVhdGVTcHkoJ2NhbGxiYWNrJyk7XG4gICAgICAgIHZhciBwcm92aWRlciA9IHtcbiAgICAgICAgICBnZXRTdWdnZXN0aW9uKHNvdXJjZVRleHRFZGl0b3I6IFRleHRFZGl0b3IsIHNvdXJjZVBvc2l0aW9uOiBQb2ludCkge1xuICAgICAgICAgICAgdmFyIHJhbmdlID0gW1xuICAgICAgICAgICAgICBuZXcgUmFuZ2Uoc291cmNlUG9zaXRpb24sIHNvdXJjZVBvc2l0aW9uLnRyYW5zbGF0ZShbMCwgMV0pKSxcbiAgICAgICAgICAgICAgbmV3IFJhbmdlKHNvdXJjZVBvc2l0aW9uLnRyYW5zbGF0ZShbMCwgMl0pLCBzb3VyY2VQb3NpdGlvbi50cmFuc2xhdGUoWzAsIDNdKSksXG4gICAgICAgICAgICBdO1xuICAgICAgICAgICAgcmV0dXJuIHtyYW5nZSwgY2FsbGJhY2t9O1xuICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICAgIHNweU9uKHByb3ZpZGVyLCAnZ2V0U3VnZ2VzdGlvbicpLmFuZENhbGxUaHJvdWdoKCk7XG4gICAgICAgIGh5cGVyY2xpY2suY29uc3VtZVByb3ZpZGVyKHByb3ZpZGVyKTtcblxuICAgICAgICB2YXIgcG9zaXRpb24gPSBuZXcgUG9pbnQoMCwgOCk7XG5cbiAgICAgICAgZGlzcGF0Y2goTW91c2VFdmVudCwgJ21vdXNlbW92ZScsIHBvc2l0aW9uLCB7bWV0YUtleTogdHJ1ZX0pO1xuICAgICAgICBhd2FpdCBoeXBlcmNsaWNrRm9yVGV4dEVkaXRvci5nZXRTdWdnZXN0aW9uQXRNb3VzZSgpO1xuICAgICAgICBleHBlY3QocHJvdmlkZXIuZ2V0U3VnZ2VzdGlvbikudG9IYXZlQmVlbkNhbGxlZFdpdGgodGV4dEVkaXRvciwgcG9zaXRpb24pO1xuXG4gICAgICAgIGRpc3BhdGNoKE1vdXNlRXZlbnQsICdtb3VzZWRvd24nLCBwb3NpdGlvbiwge21ldGFLZXk6IHRydWV9KTtcbiAgICAgICAgZXhwZWN0KGNhbGxiYWNrLmNhbGxDb3VudCkudG9CZSgxKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2NvbnN1bWVzIG11bHRpcGxlIHByb3ZpZGVycyBmcm9tIGRpZmZlcmVudCBzb3VyY2VzJywgKCkgPT4ge1xuICAgICAgd2FpdHNGb3JQcm9taXNlKGFzeW5jICgpID0+IHtcbiAgICAgICAgdmFyIGNhbGxiYWNrMSA9IGphc21pbmUuY3JlYXRlU3B5KCdjYWxsYmFjaycpO1xuICAgICAgICB2YXIgcHJvdmlkZXIxID0ge1xuICAgICAgICAgIC8vIERvIG5vdCByZXR1cm4gYSBzdWdnZXN0aW9uLCBzbyB3ZSBjYW4gZmFsbCB0aHJvdWdoIHRvIHByb3ZpZGVyMi5cbiAgICAgICAgICBnZXRTdWdnZXN0aW9uRm9yV29yZChzb3VyY2VUZXh0RWRpdG9yLCB0ZXh0LCByYW5nZSkge31cbiAgICAgICAgfTtcbiAgICAgICAgc3B5T24ocHJvdmlkZXIxLCAnZ2V0U3VnZ2VzdGlvbkZvcldvcmQnKS5hbmRDYWxsVGhyb3VnaCgpO1xuXG4gICAgICAgIHZhciBjYWxsYmFjazIgPSBqYXNtaW5lLmNyZWF0ZVNweSgnY2FsbGJhY2snKTtcbiAgICAgICAgdmFyIHByb3ZpZGVyMiA9IHtcbiAgICAgICAgICBnZXRTdWdnZXN0aW9uRm9yV29yZChzb3VyY2VUZXh0RWRpdG9yLCB0ZXh0LCByYW5nZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtyYW5nZSwgY2FsbGJhY2s6IGNhbGxiYWNrMn07XG4gICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgICAgc3B5T24ocHJvdmlkZXIyLCAnZ2V0U3VnZ2VzdGlvbkZvcldvcmQnKS5hbmRDYWxsVGhyb3VnaCgpO1xuXG4gICAgICAgIGh5cGVyY2xpY2suY29uc3VtZVByb3ZpZGVyKHByb3ZpZGVyMSk7XG4gICAgICAgIGh5cGVyY2xpY2suY29uc3VtZVByb3ZpZGVyKHByb3ZpZGVyMik7XG5cbiAgICAgICAgdmFyIHBvc2l0aW9uID0gbmV3IFBvaW50KDAsIDEpO1xuICAgICAgICB2YXIgZXhwZWN0ZWRUZXh0ID0gJ3dvcmQxJztcbiAgICAgICAgdmFyIGV4cGVjdGVkUmFuZ2UgPSBSYW5nZS5mcm9tT2JqZWN0KFtbMCwgMF0sIFswLCA1XV0pO1xuXG4gICAgICAgIGRpc3BhdGNoKE1vdXNlRXZlbnQsICdtb3VzZW1vdmUnLCBwb3NpdGlvbiwge21ldGFLZXk6IHRydWV9KTtcbiAgICAgICAgYXdhaXQgaHlwZXJjbGlja0ZvclRleHRFZGl0b3IuZ2V0U3VnZ2VzdGlvbkF0TW91c2UoKTtcbiAgICAgICAgZXhwZWN0KHByb3ZpZGVyMi5nZXRTdWdnZXN0aW9uRm9yV29yZCkudG9IYXZlQmVlbkNhbGxlZFdpdGgoXG4gICAgICAgICAgICB0ZXh0RWRpdG9yLFxuICAgICAgICAgICAgZXhwZWN0ZWRUZXh0LFxuICAgICAgICAgICAgZXhwZWN0ZWRSYW5nZSk7XG5cbiAgICAgICAgZGlzcGF0Y2goTW91c2VFdmVudCwgJ21vdXNlZG93bicsIHBvc2l0aW9uLCB7bWV0YUtleTogdHJ1ZX0pO1xuICAgICAgICBleHBlY3QoY2FsbGJhY2sxLmNhbGxDb3VudCkudG9CZSgwKTtcbiAgICAgICAgZXhwZWN0KGNhbGxiYWNrMi5jYWxsQ291bnQpLnRvQmUoMSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdjb25zdW1lcyBtdWx0aXBsZSBwcm92aWRlcnMgZnJvbSB0aGUgc2FtZSBzb3VyY2UnLCAoKSA9PiB7XG4gICAgICB3YWl0c0ZvclByb21pc2UoYXN5bmMgKCkgPT4ge1xuICAgICAgICB2YXIgY2FsbGJhY2sxID0gamFzbWluZS5jcmVhdGVTcHkoJ2NhbGxiYWNrJyk7XG4gICAgICAgIHZhciBwcm92aWRlcjEgPSB7XG4gICAgICAgICAgLy8gRG8gbm90IHJldHVybiBhIHN1Z2dlc3Rpb24sIHNvIHdlIGNhbiBmYWxsIHRocm91Z2ggdG8gcHJvdmlkZXIyLlxuICAgICAgICAgIGdldFN1Z2dlc3Rpb25Gb3JXb3JkKHNvdXJjZVRleHRFZGl0b3IsIHRleHQsIHJhbmdlKSB7fVxuICAgICAgICB9O1xuICAgICAgICBzcHlPbihwcm92aWRlcjEsICdnZXRTdWdnZXN0aW9uRm9yV29yZCcpLmFuZENhbGxUaHJvdWdoKCk7XG5cbiAgICAgICAgdmFyIGNhbGxiYWNrMiA9IGphc21pbmUuY3JlYXRlU3B5KCdjYWxsYmFjaycpO1xuICAgICAgICB2YXIgcHJvdmlkZXIyID0ge1xuICAgICAgICAgIGdldFN1Z2dlc3Rpb25Gb3JXb3JkKHNvdXJjZVRleHRFZGl0b3IsIHRleHQsIHJhbmdlKSB7XG4gICAgICAgICAgICByZXR1cm4ge3JhbmdlLCBjYWxsYmFjazogY2FsbGJhY2syfTtcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgICBzcHlPbihwcm92aWRlcjIsICdnZXRTdWdnZXN0aW9uRm9yV29yZCcpLmFuZENhbGxUaHJvdWdoKCk7XG5cbiAgICAgICAgaHlwZXJjbGljay5jb25zdW1lUHJvdmlkZXIoW3Byb3ZpZGVyMSwgcHJvdmlkZXIyXSk7XG5cbiAgICAgICAgdmFyIHBvc2l0aW9uID0gbmV3IFBvaW50KDAsIDEpO1xuICAgICAgICB2YXIgZXhwZWN0ZWRUZXh0ID0gJ3dvcmQxJztcbiAgICAgICAgdmFyIGV4cGVjdGVkUmFuZ2UgPSBSYW5nZS5mcm9tT2JqZWN0KFtbMCwgMF0sIFswLCA1XV0pO1xuXG4gICAgICAgIGRpc3BhdGNoKE1vdXNlRXZlbnQsICdtb3VzZW1vdmUnLCBwb3NpdGlvbiwge21ldGFLZXk6IHRydWV9KTtcbiAgICAgICAgYXdhaXQgaHlwZXJjbGlja0ZvclRleHRFZGl0b3IuZ2V0U3VnZ2VzdGlvbkF0TW91c2UoKTtcbiAgICAgICAgZXhwZWN0KHByb3ZpZGVyMi5nZXRTdWdnZXN0aW9uRm9yV29yZCkudG9IYXZlQmVlbkNhbGxlZFdpdGgoXG4gICAgICAgICAgICB0ZXh0RWRpdG9yLFxuICAgICAgICAgICAgZXhwZWN0ZWRUZXh0LFxuICAgICAgICAgICAgZXhwZWN0ZWRSYW5nZSk7XG5cbiAgICAgICAgZGlzcGF0Y2goTW91c2VFdmVudCwgJ21vdXNlZG93bicsIHBvc2l0aW9uLCB7bWV0YUtleTogdHJ1ZX0pO1xuICAgICAgICBleHBlY3QoY2FsbGJhY2sxLmNhbGxDb3VudCkudG9CZSgwKTtcbiAgICAgICAgZXhwZWN0KGNhbGxiYWNrMi5jYWxsQ291bnQpLnRvQmUoMSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2F2b2lkcyBleGNlc3NpdmUgY2FsbHMnLCAoKSA9PiB7XG4gICAgaXQoJ2lnbm9yZXMgPG1vdXNlbW92ZT4gaW4gdGhlIHNhbWUgd29yZCBhcyB0aGUgbGFzdCBwb3NpdGlvbicsICgpID0+IHtcbiAgICAgIHdhaXRzRm9yUHJvbWlzZShhc3luYyAoKSA9PiB7XG4gICAgICAgIHZhciBwcm92aWRlciA9IHtcbiAgICAgICAgICBnZXRTdWdnZXN0aW9uRm9yV29yZChzb3VyY2VUZXh0RWRpdG9yLCB0ZXh0LCByYW5nZSkge1xuICAgICAgICAgICAgLy8gTmV2ZXIgcmVzb2x2ZSB0aGlzLCBzbyB3ZSBrbm93IHRoYXQgbm8gc3VnZ2VzdGlvbiBpcyBzZXQuXG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKCkgPT4ge30pO1xuICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICAgIHNweU9uKHByb3ZpZGVyLCAnZ2V0U3VnZ2VzdGlvbkZvcldvcmQnKS5hbmRDYWxsVGhyb3VnaCgpO1xuICAgICAgICBoeXBlcmNsaWNrLmNvbnN1bWVQcm92aWRlcihwcm92aWRlcik7XG5cbiAgICAgICAgdmFyIHBvc2l0aW9uID0gbmV3IFBvaW50KDAsIDEpO1xuICAgICAgICBkaXNwYXRjaChNb3VzZUV2ZW50LCAnbW91c2Vtb3ZlJywgcG9zaXRpb24sIHttZXRhS2V5OiB0cnVlfSk7XG4gICAgICAgIGRpc3BhdGNoKE1vdXNlRXZlbnQsICdtb3VzZW1vdmUnLCBwb3NpdGlvbi50cmFuc2xhdGUoWzAsIDFdKSwge21ldGFLZXk6IHRydWV9KTtcbiAgICAgICAgZGlzcGF0Y2goTW91c2VFdmVudCwgJ21vdXNlbW92ZScsIHBvc2l0aW9uLnRyYW5zbGF0ZShbMCwgMl0pLCB7bWV0YUtleTogdHJ1ZX0pO1xuXG4gICAgICAgIGV4cGVjdChwcm92aWRlci5nZXRTdWdnZXN0aW9uRm9yV29yZC5jYWxsQ291bnQpLnRvQmUoMSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdpZ25vcmVzIDxtb3VzZW1vdmU+IGluIHRoZSBzYW1lIHNpbmdsZS1yYW5nZSBhcyB0aGUgbGFzdCBzdWdnZXN0aW9uJywgKCkgPT4ge1xuICAgICAgd2FpdHNGb3JQcm9taXNlKGFzeW5jICgpID0+IHtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gamFzbWluZS5jcmVhdGVTcHkoJ2NhbGxiYWNrJyk7XG4gICAgICAgIHZhciBwcm92aWRlciA9IHtcbiAgICAgICAgICBnZXRTdWdnZXN0aW9uRm9yV29yZChzb3VyY2VUZXh0RWRpdG9yLCB0ZXh0LCByYW5nZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtyYW5nZSwgY2FsbGJhY2t9O1xuICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICAgIHNweU9uKHByb3ZpZGVyLCAnZ2V0U3VnZ2VzdGlvbkZvcldvcmQnKS5hbmRDYWxsVGhyb3VnaCgpO1xuICAgICAgICBoeXBlcmNsaWNrLmNvbnN1bWVQcm92aWRlcihwcm92aWRlcik7XG5cbiAgICAgICAgdmFyIHBvc2l0aW9uID0gbmV3IFBvaW50KDAsIDEpO1xuICAgICAgICB2YXIgZXhwZWN0ZWRUZXh0ID0gJ3dvcmQxJztcbiAgICAgICAgdmFyIGV4cGVjdGVkUmFuZ2UgPSBSYW5nZS5mcm9tT2JqZWN0KFtbMCwgMF0sIFswLCA1XV0pO1xuXG4gICAgICAgIGRpc3BhdGNoKE1vdXNlRXZlbnQsICdtb3VzZW1vdmUnLCBwb3NpdGlvbiwge21ldGFLZXk6IHRydWV9KTtcbiAgICAgICAgYXdhaXQgaHlwZXJjbGlja0ZvclRleHRFZGl0b3IuZ2V0U3VnZ2VzdGlvbkF0TW91c2UoKTtcbiAgICAgICAgZXhwZWN0KHByb3ZpZGVyLmdldFN1Z2dlc3Rpb25Gb3JXb3JkKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcbiAgICAgICAgICAgIHRleHRFZGl0b3IsXG4gICAgICAgICAgICBleHBlY3RlZFRleHQsXG4gICAgICAgICAgICBleHBlY3RlZFJhbmdlKTtcblxuICAgICAgICBkaXNwYXRjaChNb3VzZUV2ZW50LCAnbW91c2Vtb3ZlJywgcG9zaXRpb24udHJhbnNsYXRlKFswLCAxXSksIHttZXRhS2V5OiB0cnVlfSk7XG4gICAgICAgIGF3YWl0IGh5cGVyY2xpY2tGb3JUZXh0RWRpdG9yLmdldFN1Z2dlc3Rpb25BdE1vdXNlKCk7XG5cbiAgICAgICAgZXhwZWN0KHByb3ZpZGVyLmdldFN1Z2dlc3Rpb25Gb3JXb3JkLmNhbGxDb3VudCkudG9CZSgxKTtcblxuICAgICAgICBkaXNwYXRjaChNb3VzZUV2ZW50LCAnbW91c2Vkb3duJywgcG9zaXRpb24sIHttZXRhS2V5OiB0cnVlfSk7XG4gICAgICAgIGV4cGVjdChjYWxsYmFjay5jYWxsQ291bnQpLnRvQmUoMSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdoYW5kbGVzIDxtb3VzZW1vdmU+IGluIGEgZGlmZmVyZW50IHNpbmdsZS1yYW5nZSBhcyB0aGUgbGFzdCBzdWdnZXN0aW9uJywgKCkgPT4ge1xuICAgICAgd2FpdHNGb3JQcm9taXNlKGFzeW5jICgpID0+IHtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gamFzbWluZS5jcmVhdGVTcHkoJ2NhbGxiYWNrJyk7XG4gICAgICAgIHZhciBwcm92aWRlciA9IHtcbiAgICAgICAgICBnZXRTdWdnZXN0aW9uRm9yV29yZChzb3VyY2VUZXh0RWRpdG9yLCB0ZXh0LCByYW5nZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtyYW5nZSwgY2FsbGJhY2t9O1xuICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICAgIHNweU9uKHByb3ZpZGVyLCAnZ2V0U3VnZ2VzdGlvbkZvcldvcmQnKS5hbmRDYWxsVGhyb3VnaCgpO1xuICAgICAgICBoeXBlcmNsaWNrLmNvbnN1bWVQcm92aWRlcihwcm92aWRlcik7XG5cbiAgICAgICAgdmFyIHBvc2l0aW9uMSA9IG5ldyBQb2ludCgwLCAxKTtcbiAgICAgICAgdmFyIGV4cGVjdGVkVGV4dDEgPSAnd29yZDEnO1xuICAgICAgICB2YXIgZXhwZWN0ZWRSYW5nZTEgPSBSYW5nZS5mcm9tT2JqZWN0KFtbMCwgMF0sIFswLCA1XV0pO1xuXG4gICAgICAgIGRpc3BhdGNoKE1vdXNlRXZlbnQsICdtb3VzZW1vdmUnLCBwb3NpdGlvbjEsIHttZXRhS2V5OiB0cnVlfSk7XG4gICAgICAgIGF3YWl0IGh5cGVyY2xpY2tGb3JUZXh0RWRpdG9yLmdldFN1Z2dlc3Rpb25BdE1vdXNlKCk7XG4gICAgICAgIGV4cGVjdChwcm92aWRlci5nZXRTdWdnZXN0aW9uRm9yV29yZCkudG9IYXZlQmVlbkNhbGxlZFdpdGgoXG4gICAgICAgICAgICB0ZXh0RWRpdG9yLFxuICAgICAgICAgICAgZXhwZWN0ZWRUZXh0MSxcbiAgICAgICAgICAgIGV4cGVjdGVkUmFuZ2UxKTtcblxuICAgICAgICB2YXIgcG9zaXRpb24yID0gbmV3IFBvaW50KDAsIDgpO1xuICAgICAgICB2YXIgZXhwZWN0ZWRUZXh0MiA9ICd3b3JkMic7XG4gICAgICAgIHZhciBleHBlY3RlZFJhbmdlMiA9IFJhbmdlLmZyb21PYmplY3QoW1swLCA2XSwgWzAsIDExXV0pO1xuICAgICAgICBkaXNwYXRjaChNb3VzZUV2ZW50LCAnbW91c2Vtb3ZlJywgcG9zaXRpb24yLCB7bWV0YUtleTogdHJ1ZX0pO1xuICAgICAgICBhd2FpdCBoeXBlcmNsaWNrRm9yVGV4dEVkaXRvci5nZXRTdWdnZXN0aW9uQXRNb3VzZSgpO1xuICAgICAgICBleHBlY3QocHJvdmlkZXIuZ2V0U3VnZ2VzdGlvbkZvcldvcmQpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxuICAgICAgICAgICAgdGV4dEVkaXRvcixcbiAgICAgICAgICAgIGV4cGVjdGVkVGV4dDIsXG4gICAgICAgICAgICBleHBlY3RlZFJhbmdlMik7XG5cbiAgICAgICAgZXhwZWN0KHByb3ZpZGVyLmdldFN1Z2dlc3Rpb25Gb3JXb3JkLmNhbGxDb3VudCkudG9CZSgyKTtcblxuICAgICAgICBkaXNwYXRjaChNb3VzZUV2ZW50LCAnbW91c2Vkb3duJywgcG9zaXRpb24yLCB7bWV0YUtleTogdHJ1ZX0pO1xuICAgICAgICBleHBlY3QoY2FsbGJhY2suY2FsbENvdW50KS50b0JlKDEpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnaWdub3JlcyA8bW91c2Vtb3ZlPiBpbiB0aGUgc2FtZSBtdWx0aS1yYW5nZSBhcyB0aGUgbGFzdCBzdWdnZXN0aW9uJywgKCkgPT4ge1xuICAgICAgd2FpdHNGb3JQcm9taXNlKGFzeW5jICgpID0+IHtcbiAgICAgICAgdmFyIHJhbmdlID0gW1xuICAgICAgICAgIG5ldyBSYW5nZShuZXcgUG9pbnQoMCwgMSksIG5ldyBQb2ludCgwLCAyKSksXG4gICAgICAgICAgbmV3IFJhbmdlKG5ldyBQb2ludCgwLCA0KSwgbmV3IFBvaW50KDAsIDUpKSxcbiAgICAgICAgXTtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gamFzbWluZS5jcmVhdGVTcHkoJ2NhbGxiYWNrJyk7XG4gICAgICAgIHZhciBwcm92aWRlciA9IHtcbiAgICAgICAgICBnZXRTdWdnZXN0aW9uKHNvdXJjZVRleHRFZGl0b3I6IFRleHRFZGl0b3IsIHNvdXJjZVBvc2l0aW9uOiBQb2ludCkge1xuICAgICAgICAgICAgcmV0dXJuIHtyYW5nZSwgY2FsbGJhY2t9O1xuICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICAgIHNweU9uKHByb3ZpZGVyLCAnZ2V0U3VnZ2VzdGlvbicpLmFuZENhbGxUaHJvdWdoKCk7XG4gICAgICAgIGh5cGVyY2xpY2suY29uc3VtZVByb3ZpZGVyKHByb3ZpZGVyKTtcblxuICAgICAgICB2YXIgcG9zaXRpb24gPSBuZXcgUG9pbnQoMCwgMSk7XG5cbiAgICAgICAgZGlzcGF0Y2goTW91c2VFdmVudCwgJ21vdXNlbW92ZScsIHBvc2l0aW9uLCB7bWV0YUtleTogdHJ1ZX0pO1xuICAgICAgICBhd2FpdCBoeXBlcmNsaWNrRm9yVGV4dEVkaXRvci5nZXRTdWdnZXN0aW9uQXRNb3VzZSgpO1xuICAgICAgICBleHBlY3QocHJvdmlkZXIuZ2V0U3VnZ2VzdGlvbikudG9IYXZlQmVlbkNhbGxlZFdpdGgodGV4dEVkaXRvciwgcG9zaXRpb24pO1xuXG4gICAgICAgIGRpc3BhdGNoKE1vdXNlRXZlbnQsICdtb3VzZW1vdmUnLCBuZXcgUG9pbnQoMCwgNCksIHttZXRhS2V5OiB0cnVlfSk7XG4gICAgICAgIGF3YWl0IGh5cGVyY2xpY2tGb3JUZXh0RWRpdG9yLmdldFN1Z2dlc3Rpb25BdE1vdXNlKCk7XG5cbiAgICAgICAgZXhwZWN0KHByb3ZpZGVyLmdldFN1Z2dlc3Rpb24uY2FsbENvdW50KS50b0JlKDEpO1xuXG4gICAgICAgIGRpc3BhdGNoKE1vdXNlRXZlbnQsICdtb3VzZWRvd24nLCBwb3NpdGlvbiwge21ldGFLZXk6IHRydWV9KTtcbiAgICAgICAgZXhwZWN0KGNhbGxiYWNrLmNhbGxDb3VudCkudG9CZSgxKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2hhbmRsZXMgPG1vdXNlbW92ZT4gaW4gYSBkaWZmZXJlbnQgbXVsdGktcmFuZ2UgYXMgdGhlIGxhc3Qgc3VnZ2VzdGlvbicsICgpID0+IHtcbiAgICAgIHdhaXRzRm9yUHJvbWlzZShhc3luYyAoKSA9PiB7XG4gICAgICAgIHZhciByYW5nZSA9IFtcbiAgICAgICAgICBuZXcgUmFuZ2UobmV3IFBvaW50KDAsIDEpLCBuZXcgUG9pbnQoMCwgMikpLFxuICAgICAgICAgIG5ldyBSYW5nZShuZXcgUG9pbnQoMCwgNCksIG5ldyBQb2ludCgwLCA1KSksXG4gICAgICAgIF07XG4gICAgICAgIHZhciBjYWxsYmFjayA9IGphc21pbmUuY3JlYXRlU3B5KCdjYWxsYmFjaycpO1xuICAgICAgICB2YXIgcHJvdmlkZXIgPSB7XG4gICAgICAgICAgZ2V0U3VnZ2VzdGlvbihzb3VyY2VUZXh0RWRpdG9yOiBUZXh0RWRpdG9yLCBwb3NpdGlvbjogUG9pbnQpIHtcbiAgICAgICAgICAgIHJldHVybiB7cmFuZ2UsIGNhbGxiYWNrfTtcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgICBzcHlPbihwcm92aWRlciwgJ2dldFN1Z2dlc3Rpb24nKS5hbmRDYWxsVGhyb3VnaCgpO1xuICAgICAgICBoeXBlcmNsaWNrLmNvbnN1bWVQcm92aWRlcihwcm92aWRlcik7XG5cbiAgICAgICAgdmFyIHBvc2l0aW9uMSA9IG5ldyBQb2ludCgwLCAxKTtcblxuICAgICAgICBkaXNwYXRjaChNb3VzZUV2ZW50LCAnbW91c2Vtb3ZlJywgcG9zaXRpb24xLCB7bWV0YUtleTogdHJ1ZX0pO1xuICAgICAgICBhd2FpdCBoeXBlcmNsaWNrRm9yVGV4dEVkaXRvci5nZXRTdWdnZXN0aW9uQXRNb3VzZSgpO1xuICAgICAgICBleHBlY3QocHJvdmlkZXIuZ2V0U3VnZ2VzdGlvbikudG9IYXZlQmVlbkNhbGxlZFdpdGgodGV4dEVkaXRvciwgcG9zaXRpb24xKTtcblxuICAgICAgICB2YXIgcG9zaXRpb24yID0gbmV3IFBvaW50KDAsIDMpO1xuICAgICAgICBkaXNwYXRjaChNb3VzZUV2ZW50LCAnbW91c2Vtb3ZlJywgcG9zaXRpb24yLCB7bWV0YUtleTogdHJ1ZX0pO1xuICAgICAgICBhd2FpdCBoeXBlcmNsaWNrRm9yVGV4dEVkaXRvci5nZXRTdWdnZXN0aW9uQXRNb3VzZSgpO1xuICAgICAgICBleHBlY3QocHJvdmlkZXIuZ2V0U3VnZ2VzdGlvbikudG9IYXZlQmVlbkNhbGxlZFdpdGgodGV4dEVkaXRvciwgcG9zaXRpb24yKTtcblxuICAgICAgICBleHBlY3QocHJvdmlkZXIuZ2V0U3VnZ2VzdGlvbi5jYWxsQ291bnQpLnRvQmUoMik7XG5cbiAgICAgICAgZGlzcGF0Y2goTW91c2VFdmVudCwgJ21vdXNlZG93bicsIHBvc2l0aW9uMiwge21ldGFLZXk6IHRydWV9KTtcbiAgICAgICAgZXhwZWN0KGNhbGxiYWNrLmNhbGxDb3VudCkudG9CZSgxKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnYWRkcyB0aGUgYGh5cGVyY2xpY2tgIENTUyBjbGFzcycsICgpID0+IHtcbiAgICB2YXIgcHJvdmlkZXIgPSB7XG4gICAgICBnZXRTdWdnZXN0aW9uRm9yV29yZChzb3VyY2VUZXh0RWRpdG9yLCB0ZXh0LCByYW5nZSkge1xuICAgICAgICByZXR1cm4ge3JhbmdlLCBjYWxsYmFjaygpIHt9fTtcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgaHlwZXJjbGljay5jb25zdW1lUHJvdmlkZXIocHJvdmlkZXIpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2FkZHMgb24gPG1ldGEtbW91c2Vtb3ZlPiwgcmVtb3ZlcyBvbiA8bWV0YS1tb3VzZWRvd24+JywgKCkgPT4ge1xuICAgICAgd2FpdHNGb3JQcm9taXNlKGFzeW5jICgpID0+IHtcbiAgICAgICAgdmFyIHBvc2l0aW9uID0gbmV3IFBvaW50KDAsIDEpO1xuXG4gICAgICAgIGV4cGVjdCh0ZXh0RWRpdG9yVmlldy5jbGFzc0xpc3QuY29udGFpbnMoJ2h5cGVyY2xpY2snKSkudG9CZShmYWxzZSk7XG5cbiAgICAgICAgZGlzcGF0Y2goTW91c2VFdmVudCwgJ21vdXNlbW92ZScsIHBvc2l0aW9uLCB7bWV0YUtleTogdHJ1ZX0pO1xuICAgICAgICBhd2FpdCBoeXBlcmNsaWNrRm9yVGV4dEVkaXRvci5nZXRTdWdnZXN0aW9uQXRNb3VzZSgpO1xuICAgICAgICBleHBlY3QodGV4dEVkaXRvclZpZXcuY2xhc3NMaXN0LmNvbnRhaW5zKCdoeXBlcmNsaWNrJykpLnRvQmUodHJ1ZSk7XG5cbiAgICAgICAgZGlzcGF0Y2goTW91c2VFdmVudCwgJ21vdXNlZG93bicsIHBvc2l0aW9uLCB7bWV0YUtleTogdHJ1ZX0pO1xuICAgICAgICBleHBlY3QodGV4dEVkaXRvclZpZXcuY2xhc3NMaXN0LmNvbnRhaW5zKCdoeXBlcmNsaWNrJykpLnRvQmUoZmFsc2UpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnYWRkcyBvbiA8bWV0YS1rZXlkb3duPiwgcmVtb3ZlcyBvbiA8bWV0YS1rZXl1cD4nLCAoKSA9PiB7XG4gICAgICB3YWl0c0ZvclByb21pc2UoYXN5bmMgKCkgPT4ge1xuICAgICAgICB2YXIgcG9zaXRpb24gPSBuZXcgUG9pbnQoMCwgMSk7XG5cbiAgICAgICAgLy8gV2UgbmVlZCB0byBtb3ZlIHRoZSBtb3VzZSBvbmNlLCBzbyBIeXBlcmNsaWNrIGtub3dzIHdoZXJlIGl0IGlzLlxuICAgICAgICBkaXNwYXRjaChNb3VzZUV2ZW50LCAnbW91c2Vtb3ZlJywgcG9zaXRpb24pO1xuICAgICAgICBleHBlY3QodGV4dEVkaXRvclZpZXcuY2xhc3NMaXN0LmNvbnRhaW5zKCdoeXBlcmNsaWNrJykpLnRvQmUoZmFsc2UpO1xuXG4gICAgICAgIGRpc3BhdGNoKEtleWJvYXJkRXZlbnQsICdrZXlkb3duJywgcG9zaXRpb24sIHttZXRhS2V5OiB0cnVlfSk7XG4gICAgICAgIGF3YWl0IGh5cGVyY2xpY2tGb3JUZXh0RWRpdG9yLmdldFN1Z2dlc3Rpb25BdE1vdXNlKCk7XG4gICAgICAgIGV4cGVjdCh0ZXh0RWRpdG9yVmlldy5jbGFzc0xpc3QuY29udGFpbnMoJ2h5cGVyY2xpY2snKSkudG9CZSh0cnVlKTtcblxuICAgICAgICBkaXNwYXRjaChLZXlib2FyZEV2ZW50LCAna2V5dXAnLCBwb3NpdGlvbik7XG4gICAgICAgIGV4cGVjdCh0ZXh0RWRpdG9yVmlldy5jbGFzc0xpc3QuY29udGFpbnMoJ2h5cGVyY2xpY2snKSkudG9CZShmYWxzZSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2h5cGVyY2xpY2s6Y29uZmlybS1jdXJzb3InLCAoKSA9PiB7XG4gICAgaXQoJ2NvbmZpcm1zIHRoZSBzdWdnZXN0aW9uIGF0IHRoZSBjdXJzb3IgZXZlbiBpZiB0aGUgbW91c2UgbW92ZWQnLCAoKSA9PiB7XG4gICAgICB3YWl0c0ZvclByb21pc2UoYXN5bmMgKCkgPT4ge1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBqYXNtaW5lLmNyZWF0ZVNweSgnY2FsbGJhY2snKTtcbiAgICAgICAgdmFyIHByb3ZpZGVyID0ge1xuICAgICAgICAgIGdldFN1Z2dlc3Rpb25Gb3JXb3JkKHNvdXJjZVRleHRFZGl0b3IsIHRleHQsIHJhbmdlKSB7XG4gICAgICAgICAgICByZXR1cm4ge3JhbmdlLCBjYWxsYmFja307XG4gICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgICAgc3B5T24ocHJvdmlkZXIsICdnZXRTdWdnZXN0aW9uRm9yV29yZCcpLmFuZENhbGxUaHJvdWdoKCk7XG4gICAgICAgIGh5cGVyY2xpY2suY29uc3VtZVByb3ZpZGVyKHByb3ZpZGVyKTtcblxuICAgICAgICB2YXIgbW91c2VQb3NpdGlvbiA9IG5ldyBQb2ludCgwLCAxKTtcbiAgICAgICAgZGlzcGF0Y2goTW91c2VFdmVudCwgJ21vdXNlbW92ZScsIG1vdXNlUG9zaXRpb24sIHttZXRhS2V5OiB0cnVlfSk7XG4gICAgICAgIGF3YWl0IGh5cGVyY2xpY2tGb3JUZXh0RWRpdG9yLmdldFN1Z2dlc3Rpb25BdE1vdXNlKCk7XG5cbiAgICAgICAgdGV4dEVkaXRvci5zZXRDdXJzb3JCdWZmZXJQb3NpdGlvbihuZXcgUG9pbnQoMCwgOCkpO1xuICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKHRleHRFZGl0b3JWaWV3LCAnaHlwZXJjbGljazpjb25maXJtLWN1cnNvcicpO1xuICAgICAgICBleHBlY3QocHJvdmlkZXIuZ2V0U3VnZ2VzdGlvbkZvcldvcmQpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxuICAgICAgICAgICAgdGV4dEVkaXRvcixcbiAgICAgICAgICAgICd3b3JkMicsXG4gICAgICAgICAgICBSYW5nZS5mcm9tT2JqZWN0KFtbMCwgNl0sIFswLCAxMV1dKSk7XG4gICAgICAgIHdhaXRzRm9yKCgpID0+IGNhbGxiYWNrLmNhbGxDb3VudCA9PT0gMSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ3ByaW9yaXR5JywgKCkgPT4ge1xuICAgIGl0KCdjb25maXJtcyBoaWdoZXIgcHJpb3JpdHkgcHJvdmlkZXIgd2hlbiBpdCBpcyBjb25zdW1lZCBmaXJzdCcsICgpID0+IHtcbiAgICAgIHdhaXRzRm9yUHJvbWlzZShhc3luYyAoKSA9PiB7XG4gICAgICAgIHZhciBjYWxsYmFjazEgPSBqYXNtaW5lLmNyZWF0ZVNweSgnY2FsbGJhY2snKTtcbiAgICAgICAgdmFyIHByb3ZpZGVyMSA9IHtcbiAgICAgICAgICBnZXRTdWdnZXN0aW9uRm9yV29yZChzb3VyY2VUZXh0RWRpdG9yLCB0ZXh0LCByYW5nZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtyYW5nZSwgY2FsbGJhY2s6IGNhbGxiYWNrMX07XG4gICAgICAgICAgfSxcbiAgICAgICAgICBwcmlvcml0eTogNSxcbiAgICAgICAgfTtcbiAgICAgICAgaHlwZXJjbGljay5jb25zdW1lUHJvdmlkZXIocHJvdmlkZXIxKTtcblxuICAgICAgICB2YXIgY2FsbGJhY2syID0gamFzbWluZS5jcmVhdGVTcHkoJ2NhbGxiYWNrJyk7XG4gICAgICAgIHZhciBwcm92aWRlcjIgPSB7XG4gICAgICAgICAgZ2V0U3VnZ2VzdGlvbkZvcldvcmQoc291cmNlVGV4dEVkaXRvciwgdGV4dCwgcmFuZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiB7cmFuZ2UsIGNhbGxiYWNrOiBjYWxsYmFjazF9O1xuICAgICAgICAgIH0sXG4gICAgICAgICAgcHJpb3JpdHk6IDMsXG4gICAgICAgIH07XG4gICAgICAgIGh5cGVyY2xpY2suY29uc3VtZVByb3ZpZGVyKHByb3ZpZGVyMik7XG5cbiAgICAgICAgdmFyIG1vdXNlUG9zaXRpb24gPSBuZXcgUG9pbnQoMCwgMSk7XG4gICAgICAgIGRpc3BhdGNoKE1vdXNlRXZlbnQsICdtb3VzZW1vdmUnLCBtb3VzZVBvc2l0aW9uLCB7bWV0YUtleTogdHJ1ZX0pO1xuICAgICAgICBhd2FpdCBoeXBlcmNsaWNrRm9yVGV4dEVkaXRvci5nZXRTdWdnZXN0aW9uQXRNb3VzZSgpO1xuICAgICAgICBkaXNwYXRjaChNb3VzZUV2ZW50LCAnbW91c2Vkb3duJywgbW91c2VQb3NpdGlvbiwge21ldGFLZXk6IHRydWV9KTtcblxuICAgICAgICBleHBlY3QoY2FsbGJhY2sxLmNhbGxDb3VudCkudG9CZSgxKTtcbiAgICAgICAgZXhwZWN0KGNhbGxiYWNrMi5jYWxsQ291bnQpLnRvQmUoMCk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdjb25maXJtcyBoaWdoZXIgcHJpb3JpdHkgcHJvdmlkZXIgd2hlbiBpdCBpcyBjb25zdW1lZCBsYXN0JywgKCkgPT4ge1xuICAgICAgd2FpdHNGb3JQcm9taXNlKGFzeW5jICgpID0+IHtcbiAgICAgICAgdmFyIGNhbGxiYWNrMSA9IGphc21pbmUuY3JlYXRlU3B5KCdjYWxsYmFjaycpO1xuICAgICAgICB2YXIgcHJvdmlkZXIxID0ge1xuICAgICAgICAgIGdldFN1Z2dlc3Rpb25Gb3JXb3JkKHNvdXJjZVRleHRFZGl0b3IsIHRleHQsIHJhbmdlKSB7XG4gICAgICAgICAgICByZXR1cm4ge3JhbmdlLCBjYWxsYmFjazogY2FsbGJhY2sxfTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHByaW9yaXR5OiAzLFxuICAgICAgICB9O1xuICAgICAgICBoeXBlcmNsaWNrLmNvbnN1bWVQcm92aWRlcihwcm92aWRlcjEpO1xuXG4gICAgICAgIHZhciBjYWxsYmFjazIgPSBqYXNtaW5lLmNyZWF0ZVNweSgnY2FsbGJhY2snKTtcbiAgICAgICAgdmFyIHByb3ZpZGVyMiA9IHtcbiAgICAgICAgICBnZXRTdWdnZXN0aW9uRm9yV29yZChzb3VyY2VUZXh0RWRpdG9yLCB0ZXh0LCByYW5nZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtyYW5nZSwgY2FsbGJhY2s6IGNhbGxiYWNrMn07XG4gICAgICAgICAgfSxcbiAgICAgICAgICBwcmlvcml0eTogNSxcbiAgICAgICAgfTtcbiAgICAgICAgaHlwZXJjbGljay5jb25zdW1lUHJvdmlkZXIocHJvdmlkZXIyKTtcblxuICAgICAgICB2YXIgbW91c2VQb3NpdGlvbiA9IG5ldyBQb2ludCgwLCAxKTtcbiAgICAgICAgZGlzcGF0Y2goTW91c2VFdmVudCwgJ21vdXNlbW92ZScsIG1vdXNlUG9zaXRpb24sIHttZXRhS2V5OiB0cnVlfSk7XG4gICAgICAgIGF3YWl0IGh5cGVyY2xpY2tGb3JUZXh0RWRpdG9yLmdldFN1Z2dlc3Rpb25BdE1vdXNlKCk7XG4gICAgICAgIGRpc3BhdGNoKE1vdXNlRXZlbnQsICdtb3VzZWRvd24nLCBtb3VzZVBvc2l0aW9uLCB7bWV0YUtleTogdHJ1ZX0pO1xuXG4gICAgICAgIGV4cGVjdChjYWxsYmFjazEuY2FsbENvdW50KS50b0JlKDApO1xuICAgICAgICBleHBlY3QoY2FsbGJhY2syLmNhbGxDb3VudCkudG9CZSgxKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2NvbmZpcm1zID4wIHByaW9yaXR5IGJlZm9yZSBkZWZhdWx0IHByaW9yaXR5JywgKCkgPT4ge1xuICAgICAgd2FpdHNGb3JQcm9taXNlKGFzeW5jICgpID0+IHtcbiAgICAgICAgdmFyIGNhbGxiYWNrMSA9IGphc21pbmUuY3JlYXRlU3B5KCdjYWxsYmFjaycpO1xuICAgICAgICB2YXIgcHJvdmlkZXIxID0ge1xuICAgICAgICAgIGdldFN1Z2dlc3Rpb25Gb3JXb3JkKHNvdXJjZVRleHRFZGl0b3IsIHRleHQsIHJhbmdlKSB7XG4gICAgICAgICAgICByZXR1cm4ge3JhbmdlLCBjYWxsYmFjazogY2FsbGJhY2sxfTtcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgICBoeXBlcmNsaWNrLmNvbnN1bWVQcm92aWRlcihwcm92aWRlcjEpO1xuXG4gICAgICAgIHZhciBjYWxsYmFjazIgPSBqYXNtaW5lLmNyZWF0ZVNweSgnY2FsbGJhY2snKTtcbiAgICAgICAgdmFyIHByb3ZpZGVyMiA9IHtcbiAgICAgICAgICBnZXRTdWdnZXN0aW9uRm9yV29yZChzb3VyY2VUZXh0RWRpdG9yLCB0ZXh0LCByYW5nZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtyYW5nZSwgY2FsbGJhY2s6IGNhbGxiYWNrMn07XG4gICAgICAgICAgfSxcbiAgICAgICAgICBwcmlvcml0eTogMSxcbiAgICAgICAgfTtcbiAgICAgICAgaHlwZXJjbGljay5jb25zdW1lUHJvdmlkZXIocHJvdmlkZXIyKTtcblxuICAgICAgICB2YXIgbW91c2VQb3NpdGlvbiA9IG5ldyBQb2ludCgwLCAxKTtcbiAgICAgICAgZGlzcGF0Y2goTW91c2VFdmVudCwgJ21vdXNlbW92ZScsIG1vdXNlUG9zaXRpb24sIHttZXRhS2V5OiB0cnVlfSk7XG4gICAgICAgIGF3YWl0IGh5cGVyY2xpY2tGb3JUZXh0RWRpdG9yLmdldFN1Z2dlc3Rpb25BdE1vdXNlKCk7XG4gICAgICAgIGRpc3BhdGNoKE1vdXNlRXZlbnQsICdtb3VzZWRvd24nLCBtb3VzZVBvc2l0aW9uLCB7bWV0YUtleTogdHJ1ZX0pO1xuXG4gICAgICAgIGV4cGVjdChjYWxsYmFjazEuY2FsbENvdW50KS50b0JlKDApO1xuICAgICAgICBleHBlY3QoY2FsbGJhY2syLmNhbGxDb3VudCkudG9CZSgxKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2NvbmZpcm1zIDwwIHByaW9yaXR5IGFmdGVyIGRlZmF1bHQgcHJpb3JpdHknLCAoKSA9PiB7XG4gICAgICB3YWl0c0ZvclByb21pc2UoYXN5bmMgKCkgPT4ge1xuICAgICAgICB2YXIgY2FsbGJhY2sxID0gamFzbWluZS5jcmVhdGVTcHkoJ2NhbGxiYWNrJyk7XG4gICAgICAgIHZhciBwcm92aWRlcjEgPSB7XG4gICAgICAgICAgZ2V0U3VnZ2VzdGlvbkZvcldvcmQoc291cmNlVGV4dEVkaXRvciwgdGV4dCwgcmFuZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiB7cmFuZ2UsIGNhbGxiYWNrOiBjYWxsYmFjazF9O1xuICAgICAgICAgIH0sXG4gICAgICAgICAgcHJpb3JpdHk6IC0xLFxuICAgICAgICB9O1xuICAgICAgICBoeXBlcmNsaWNrLmNvbnN1bWVQcm92aWRlcihwcm92aWRlcjEpO1xuXG4gICAgICAgIHZhciBjYWxsYmFjazIgPSBqYXNtaW5lLmNyZWF0ZVNweSgnY2FsbGJhY2snKTtcbiAgICAgICAgdmFyIHByb3ZpZGVyMiA9IHtcbiAgICAgICAgICBnZXRTdWdnZXN0aW9uRm9yV29yZChzb3VyY2VUZXh0RWRpdG9yLCB0ZXh0LCByYW5nZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtyYW5nZSwgY2FsbGJhY2s6IGNhbGxiYWNrMn07XG4gICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgICAgaHlwZXJjbGljay5jb25zdW1lUHJvdmlkZXIocHJvdmlkZXIyKTtcblxuICAgICAgICB2YXIgbW91c2VQb3NpdGlvbiA9IG5ldyBQb2ludCgwLCAxKTtcbiAgICAgICAgZGlzcGF0Y2goTW91c2VFdmVudCwgJ21vdXNlbW92ZScsIG1vdXNlUG9zaXRpb24sIHttZXRhS2V5OiB0cnVlfSk7XG4gICAgICAgIGF3YWl0IGh5cGVyY2xpY2tGb3JUZXh0RWRpdG9yLmdldFN1Z2dlc3Rpb25BdE1vdXNlKCk7XG4gICAgICAgIGRpc3BhdGNoKE1vdXNlRXZlbnQsICdtb3VzZWRvd24nLCBtb3VzZVBvc2l0aW9uLCB7bWV0YUtleTogdHJ1ZX0pO1xuXG4gICAgICAgIGV4cGVjdChjYWxsYmFjazEuY2FsbENvdW50KS50b0JlKDApO1xuICAgICAgICBleHBlY3QoY2FsbGJhY2syLmNhbGxDb3VudCkudG9CZSgxKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2NvbmZpcm1zIHNhbWUtcHJpb3JpdHkgaW4gdGhlIG9yZGVyIHRoZXkgYXJlIGNvbnN1bWVkJywgKCkgPT4ge1xuICAgICAgd2FpdHNGb3JQcm9taXNlKGFzeW5jICgpID0+IHtcbiAgICAgICAgdmFyIGNhbGxiYWNrMSA9IGphc21pbmUuY3JlYXRlU3B5KCdjYWxsYmFjaycpO1xuICAgICAgICB2YXIgcHJvdmlkZXIxID0ge1xuICAgICAgICAgIGdldFN1Z2dlc3Rpb25Gb3JXb3JkKHNvdXJjZVRleHRFZGl0b3IsIHRleHQsIHJhbmdlKSB7XG4gICAgICAgICAgICByZXR1cm4ge3JhbmdlLCBjYWxsYmFjazogY2FsbGJhY2sxfTtcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgICBoeXBlcmNsaWNrLmNvbnN1bWVQcm92aWRlcihwcm92aWRlcjEpO1xuXG4gICAgICAgIHZhciBjYWxsYmFjazIgPSBqYXNtaW5lLmNyZWF0ZVNweSgnY2FsbGJhY2snKTtcbiAgICAgICAgdmFyIHByb3ZpZGVyMiA9IHtcbiAgICAgICAgICBnZXRTdWdnZXN0aW9uRm9yV29yZChzb3VyY2VUZXh0RWRpdG9yLCB0ZXh0LCByYW5nZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtyYW5nZSwgY2FsbGJhY2s6IGNhbGxiYWNrMn07XG4gICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgICAgaHlwZXJjbGljay5jb25zdW1lUHJvdmlkZXIocHJvdmlkZXIyKTtcblxuICAgICAgICB2YXIgbW91c2VQb3NpdGlvbiA9IG5ldyBQb2ludCgwLCAxKTtcbiAgICAgICAgZGlzcGF0Y2goTW91c2VFdmVudCwgJ21vdXNlbW92ZScsIG1vdXNlUG9zaXRpb24sIHttZXRhS2V5OiB0cnVlfSk7XG4gICAgICAgIGF3YWl0IGh5cGVyY2xpY2tGb3JUZXh0RWRpdG9yLmdldFN1Z2dlc3Rpb25BdE1vdXNlKCk7XG4gICAgICAgIGRpc3BhdGNoKE1vdXNlRXZlbnQsICdtb3VzZWRvd24nLCBtb3VzZVBvc2l0aW9uLCB7bWV0YUtleTogdHJ1ZX0pO1xuXG4gICAgICAgIGV4cGVjdChjYWxsYmFjazEuY2FsbENvdW50KS50b0JlKDEpO1xuICAgICAgICBleHBlY3QoY2FsbGJhY2syLmNhbGxDb3VudCkudG9CZSgwKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2NvbmZpcm1zIGhpZ2hlc3QgcHJpb3JpdHkgcHJvdmlkZXIgd2hlbiBtdWx0aXBsZSBhcmUgY29uc3VtZWQgYXQgYSB0aW1lJywgKCkgPT4ge1xuICAgICAgd2FpdHNGb3JQcm9taXNlKGFzeW5jICgpID0+IHtcbiAgICAgICAgdmFyIGNhbGxiYWNrMSA9IGphc21pbmUuY3JlYXRlU3B5KCdjYWxsYmFjaycpO1xuICAgICAgICB2YXIgcHJvdmlkZXIxID0ge1xuICAgICAgICAgIGdldFN1Z2dlc3Rpb25Gb3JXb3JkKHNvdXJjZVRleHRFZGl0b3IsIHRleHQsIHJhbmdlKSB7XG4gICAgICAgICAgICByZXR1cm4ge3JhbmdlLCBjYWxsYmFjazogY2FsbGJhY2sxfTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHByaW9yaXR5OiAxLFxuICAgICAgICB9O1xuICAgICAgICB2YXIgY2FsbGJhY2syID0gamFzbWluZS5jcmVhdGVTcHkoJ2NhbGxiYWNrJyk7XG4gICAgICAgIHZhciBwcm92aWRlcjIgPSB7XG4gICAgICAgICAgZ2V0U3VnZ2VzdGlvbkZvcldvcmQoc291cmNlVGV4dEVkaXRvciwgdGV4dCwgcmFuZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiB7cmFuZ2UsIGNhbGxiYWNrOiBjYWxsYmFjazJ9O1xuICAgICAgICAgIH0sXG4gICAgICAgICAgcHJpb3JpdHk6IDIsXG4gICAgICAgIH07XG5cbiAgICAgICAgaHlwZXJjbGljay5jb25zdW1lUHJvdmlkZXIoW3Byb3ZpZGVyMSwgcHJvdmlkZXIyXSk7XG5cbiAgICAgICAgdmFyIG1vdXNlUG9zaXRpb24gPSBuZXcgUG9pbnQoMCwgMSk7XG4gICAgICAgIGRpc3BhdGNoKE1vdXNlRXZlbnQsICdtb3VzZW1vdmUnLCBtb3VzZVBvc2l0aW9uLCB7bWV0YUtleTogdHJ1ZX0pO1xuICAgICAgICBhd2FpdCBoeXBlcmNsaWNrRm9yVGV4dEVkaXRvci5nZXRTdWdnZXN0aW9uQXRNb3VzZSgpO1xuICAgICAgICBkaXNwYXRjaChNb3VzZUV2ZW50LCAnbW91c2Vkb3duJywgbW91c2VQb3NpdGlvbiwge21ldGFLZXk6IHRydWV9KTtcblxuICAgICAgICBleHBlY3QoY2FsbGJhY2sxLmNhbGxDb3VudCkudG9CZSgwKTtcbiAgICAgICAgZXhwZWN0KGNhbGxiYWNrMi5jYWxsQ291bnQpLnRvQmUoMSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ211bHRpcGxlIHN1Z2dlc3Rpb25zJywgKCkgPT4ge1xuICAgIGl0KCdjb25maXJtcyB0aGUgZmlyc3Qgc3VnZ2VzdGlvbicsICgpID0+IHtcbiAgICAgIHdhaXRzRm9yUHJvbWlzZShhc3luYyAoKSA9PiB7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0aXRsZTogJ2NhbGxiYWNrMScsXG4gICAgICAgICAgICBjYWxsYmFjazogamFzbWluZS5jcmVhdGVTcHkoJ2NhbGxiYWNrMScpLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdGl0bGU6ICdjYWxsYmFjazInLFxuICAgICAgICAgICAgY2FsbGJhY2s6IGphc21pbmUuY3JlYXRlU3B5KCdjYWxsYmFjazEnKSxcbiAgICAgICAgICB9LFxuICAgICAgICBdO1xuICAgICAgICB2YXIgcHJvdmlkZXIgPSB7XG4gICAgICAgICAgZ2V0U3VnZ2VzdGlvbkZvcldvcmQoc291cmNlVGV4dEVkaXRvciwgdGV4dCwgcmFuZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiB7cmFuZ2UsIGNhbGxiYWNrfTtcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgICBoeXBlcmNsaWNrLmNvbnN1bWVQcm92aWRlcihwcm92aWRlcik7XG5cbiAgICAgICAgdmFyIHBvc2l0aW9uID0gbmV3IFBvaW50KDAsIDEpO1xuICAgICAgICBkaXNwYXRjaChNb3VzZUV2ZW50LCAnbW91c2Vtb3ZlJywgcG9zaXRpb24sIHttZXRhS2V5OiB0cnVlfSk7XG4gICAgICAgIGF3YWl0IGh5cGVyY2xpY2tGb3JUZXh0RWRpdG9yLmdldFN1Z2dlc3Rpb25BdE1vdXNlKCk7XG4gICAgICAgIGRpc3BhdGNoKE1vdXNlRXZlbnQsICdtb3VzZWRvd24nLCBwb3NpdGlvbiwge21ldGFLZXk6IHRydWV9KTtcblxuICAgICAgICB2YXIgc3VnZ2VzdGlvbkxpc3RFbCA9IHRleHRFZGl0b3JWaWV3LnF1ZXJ5U2VsZWN0b3IoJ2h5cGVyY2xpY2stc3VnZ2VzdGlvbi1saXN0Jyk7XG4gICAgICAgIGV4cGVjdChzdWdnZXN0aW9uTGlzdEVsKS50b0V4aXN0KCk7XG5cbiAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaCh0ZXh0RWRpdG9yVmlldywgJ2VkaXRvcjpuZXdsaW5lJyk7XG5cbiAgICAgICAgZXhwZWN0KGNhbGxiYWNrWzBdLmNhbGxiYWNrLmNhbGxDb3VudCkudG9CZSgxKTtcbiAgICAgICAgZXhwZWN0KGNhbGxiYWNrWzFdLmNhbGxiYWNrLmNhbGxDb3VudCkudG9CZSgwKTtcbiAgICAgICAgZXhwZWN0KHRleHRFZGl0b3JWaWV3LnF1ZXJ5U2VsZWN0b3IoJ2h5cGVyY2xpY2stc3VnZ2VzdGlvbi1saXN0JykpLm5vdC50b0V4aXN0KCk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdjb25maXJtcyB0aGUgc2Vjb25kIHN1Z2dlc3Rpb24nLCAoKSA9PiB7XG4gICAgICB3YWl0c0ZvclByb21pc2UoYXN5bmMgKCkgPT4ge1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdGl0bGU6ICdjYWxsYmFjazEnLFxuICAgICAgICAgICAgY2FsbGJhY2s6IGphc21pbmUuY3JlYXRlU3B5KCdjYWxsYmFjazEnKSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRpdGxlOiAnY2FsbGJhY2syJyxcbiAgICAgICAgICAgIGNhbGxiYWNrOiBqYXNtaW5lLmNyZWF0ZVNweSgnY2FsbGJhY2sxJyksXG4gICAgICAgICAgfSxcbiAgICAgICAgXTtcbiAgICAgICAgdmFyIHByb3ZpZGVyID0ge1xuICAgICAgICAgIGdldFN1Z2dlc3Rpb25Gb3JXb3JkKHNvdXJjZVRleHRFZGl0b3IsIHRleHQsIHJhbmdlKSB7XG4gICAgICAgICAgICByZXR1cm4ge3JhbmdlLCBjYWxsYmFja307XG4gICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgICAgaHlwZXJjbGljay5jb25zdW1lUHJvdmlkZXIocHJvdmlkZXIpO1xuXG4gICAgICAgIHZhciBwb3NpdGlvbiA9IG5ldyBQb2ludCgwLCAxKTtcbiAgICAgICAgZGlzcGF0Y2goTW91c2VFdmVudCwgJ21vdXNlbW92ZScsIHBvc2l0aW9uLCB7bWV0YUtleTogdHJ1ZX0pO1xuICAgICAgICBhd2FpdCBoeXBlcmNsaWNrRm9yVGV4dEVkaXRvci5nZXRTdWdnZXN0aW9uQXRNb3VzZSgpO1xuICAgICAgICBkaXNwYXRjaChNb3VzZUV2ZW50LCAnbW91c2Vkb3duJywgcG9zaXRpb24sIHttZXRhS2V5OiB0cnVlfSk7XG5cbiAgICAgICAgdmFyIHN1Z2dlc3Rpb25MaXN0RWwgPSB0ZXh0RWRpdG9yVmlldy5xdWVyeVNlbGVjdG9yKCdoeXBlcmNsaWNrLXN1Z2dlc3Rpb24tbGlzdCcpO1xuICAgICAgICBleHBlY3Qoc3VnZ2VzdGlvbkxpc3RFbCkudG9FeGlzdCgpO1xuXG4gICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2godGV4dEVkaXRvclZpZXcsICdjb3JlOm1vdmUtZG93bicpO1xuICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKHRleHRFZGl0b3JWaWV3LCAnZWRpdG9yOm5ld2xpbmUnKTtcblxuICAgICAgICBleHBlY3QoY2FsbGJhY2tbMF0uY2FsbGJhY2suY2FsbENvdW50KS50b0JlKDApO1xuICAgICAgICBleHBlY3QoY2FsbGJhY2tbMV0uY2FsbGJhY2suY2FsbENvdW50KS50b0JlKDEpO1xuICAgICAgICBleHBlY3QodGV4dEVkaXRvclZpZXcucXVlcnlTZWxlY3RvcignaHlwZXJjbGljay1zdWdnZXN0aW9uLWxpc3QnKSkubm90LnRvRXhpc3QoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ2lzIGNhbmNlbGFibGUnLCAoKSA9PiB7XG4gICAgICB3YWl0c0ZvclByb21pc2UoYXN5bmMgKCkgPT4ge1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdGl0bGU6ICdjYWxsYmFjazEnLFxuICAgICAgICAgICAgY2FsbGJhY2s6IGphc21pbmUuY3JlYXRlU3B5KCdjYWxsYmFjazEnKSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRpdGxlOiAnY2FsbGJhY2syJyxcbiAgICAgICAgICAgIGNhbGxiYWNrOiBqYXNtaW5lLmNyZWF0ZVNweSgnY2FsbGJhY2sxJyksXG4gICAgICAgICAgfSxcbiAgICAgICAgXTtcbiAgICAgICAgdmFyIHByb3ZpZGVyID0ge1xuICAgICAgICAgIGdldFN1Z2dlc3Rpb25Gb3JXb3JkKHNvdXJjZVRleHRFZGl0b3IsIHRleHQsIHJhbmdlKSB7XG4gICAgICAgICAgICByZXR1cm4ge3JhbmdlLCBjYWxsYmFja307XG4gICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgICAgaHlwZXJjbGljay5jb25zdW1lUHJvdmlkZXIocHJvdmlkZXIpO1xuXG4gICAgICAgIHZhciBwb3NpdGlvbiA9IG5ldyBQb2ludCgwLCAxKTtcbiAgICAgICAgZGlzcGF0Y2goTW91c2VFdmVudCwgJ21vdXNlbW92ZScsIHBvc2l0aW9uLCB7bWV0YUtleTogdHJ1ZX0pO1xuICAgICAgICBhd2FpdCBoeXBlcmNsaWNrRm9yVGV4dEVkaXRvci5nZXRTdWdnZXN0aW9uQXRNb3VzZSgpO1xuICAgICAgICBkaXNwYXRjaChNb3VzZUV2ZW50LCAnbW91c2Vkb3duJywgcG9zaXRpb24sIHttZXRhS2V5OiB0cnVlfSk7XG5cbiAgICAgICAgdmFyIHN1Z2dlc3Rpb25MaXN0RWwgPSB0ZXh0RWRpdG9yVmlldy5xdWVyeVNlbGVjdG9yKCdoeXBlcmNsaWNrLXN1Z2dlc3Rpb24tbGlzdCcpO1xuICAgICAgICBleHBlY3Qoc3VnZ2VzdGlvbkxpc3RFbCkudG9FeGlzdCgpO1xuXG4gICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2godGV4dEVkaXRvclZpZXcsICdjb3JlOmNhbmNlbCcpO1xuXG4gICAgICAgIGV4cGVjdChjYWxsYmFja1swXS5jYWxsYmFjay5jYWxsQ291bnQpLnRvQmUoMCk7XG4gICAgICAgIGV4cGVjdChjYWxsYmFja1sxXS5jYWxsYmFjay5jYWxsQ291bnQpLnRvQmUoMCk7XG4gICAgICAgIGV4cGVjdCh0ZXh0RWRpdG9yVmlldy5xdWVyeVNlbGVjdG9yKCdoeXBlcmNsaWNrLXN1Z2dlc3Rpb24tbGlzdCcpKS5ub3QudG9FeGlzdCgpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCd3aGVuIHRoZSBlZGl0b3IgaGFzIHNvZnQtd3JhcHBlZCBsaW5lcycsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIHRleHRFZGl0b3Iuc2V0U29mdFdyYXBwZWQodHJ1ZSk7XG4gICAgICBhdG9tLmNvbmZpZy5zZXQoJ2VkaXRvci5zb2Z0V3JhcEF0UHJlZmVycmVkTGluZUxlbmd0aCcsIHRydWUpO1xuICAgICAgYXRvbS5jb25maWcuc2V0KCdlZGl0b3IucHJlZmVycmVkTGluZUxlbmd0aCcsIDYpOyAvLyBUaGlzIHdyYXBzIGVhY2ggd29yZCBvbnRvIGl0cyBvd24gbGluZS5cbiAgICB9KTtcblxuICAgIGl0KCdIeXBlcmNsaWNrIGNvcnJlY3RseSBkZXRlY3RzIHRoZSB3b3JkIGJlaW5nIG1vdXNlZCBvdmVyLicsICgpID0+IHtcbiAgICAgIHdhaXRzRm9yUHJvbWlzZShhc3luYyAoKSA9PiB7XG5cbiAgICAgICAgdmFyIGNhbGxiYWNrID0gamFzbWluZS5jcmVhdGVTcHkoJ2NhbGxiYWNrJyk7XG4gICAgICAgIHZhciBwcm92aWRlciA9IHtcbiAgICAgICAgICBnZXRTdWdnZXN0aW9uRm9yV29yZChzb3VyY2VUZXh0RWRpdG9yLCB0ZXh0LCByYW5nZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtyYW5nZSwgY2FsbGJhY2t9O1xuICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICAgIHNweU9uKHByb3ZpZGVyLCAnZ2V0U3VnZ2VzdGlvbkZvcldvcmQnKS5hbmRDYWxsVGhyb3VnaCgpO1xuICAgICAgICBoeXBlcmNsaWNrLmNvbnN1bWVQcm92aWRlcihwcm92aWRlcik7XG5cbiAgICAgICAgdmFyIHBvc2l0aW9uID0gbmV3IFBvaW50KDgsIDApO1xuICAgICAgICB2YXIgZXhwZWN0ZWRUZXh0ID0gJ3dvcmQ5JztcbiAgICAgICAgdmFyIGV4cGVjdGVkQnVmZmVyUmFuZ2UgPSBSYW5nZS5mcm9tT2JqZWN0KFtbMiwgMTJdLCBbMiwgMTddXSk7XG4gICAgICAgIGRpc3BhdGNoKE1vdXNlRXZlbnQsICdtb3VzZW1vdmUnLCBwb3NpdGlvbiwge21ldGFLZXk6IHRydWV9KTtcbiAgICAgICAgYXdhaXQgaHlwZXJjbGlja0ZvclRleHRFZGl0b3IuZ2V0U3VnZ2VzdGlvbkF0TW91c2UoKTtcbiAgICAgICAgZXhwZWN0KHByb3ZpZGVyLmdldFN1Z2dlc3Rpb25Gb3JXb3JkKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcbiAgICAgICAgICAgIHRleHRFZGl0b3IsXG4gICAgICAgICAgICBleHBlY3RlZFRleHQsXG4gICAgICAgICAgICBleHBlY3RlZEJ1ZmZlclJhbmdlKTtcbiAgICAgICAgZXhwZWN0KHByb3ZpZGVyLmdldFN1Z2dlc3Rpb25Gb3JXb3JkLmNhbGxDb3VudCkudG9CZSgxKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl19