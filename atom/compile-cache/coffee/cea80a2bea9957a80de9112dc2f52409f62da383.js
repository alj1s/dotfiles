(function() {
  var $, CompositeDisposable, InputView;

  $ = require('atom-space-pen-views').$;

  CompositeDisposable = require('atom').CompositeDisposable;

  InputView = require('./input-view');

  module.exports = {
    config: {
      keepOptionsAfterSearch: {
        type: 'boolean',
        "default": true
      }
    },
    inputView: null,
    activate: function(state) {
      var handleEditorCancel;
      this.subscriber = new CompositeDisposable;
      this.subscriber.add(atom.commands.add('atom-workspace', 'incremental-search:forward', (function(_this) {
        return function() {
          return _this.findPressed('forward');
        };
      })(this)));
      this.subscriber.add(atom.commands.add('atom-workspace', 'incremental-search:backward', (function(_this) {
        return function() {
          return _this.findPressed('backward');
        };
      })(this)));
      handleEditorCancel = (function(_this) {
        return function(_arg) {
          var isMiniEditor, target, _ref;
          target = _arg.target;
          isMiniEditor = target.tagName === 'ATOM-TEXT-EDITOR' && target.hasAttribute('mini');
          if (!isMiniEditor) {
            return (_ref = _this.inputView) != null ? _ref.inputPanel.hide() : void 0;
          }
        };
      })(this);
      return this.subscriber.add(atom.commands.add('atom-workspace', {
        'core:cancel': handleEditorCancel,
        'core:close': handleEditorCancel
      }));
    },
    deactivate: function() {
      var _ref;
      if ((_ref = this.inputView) != null) {
        _ref.destroy();
      }
      return this.inputView = null;
    },
    findPressed: function(direction) {
      this.createViews();
      return this.inputView.trigger(direction);
    },
    createViews: function() {
      if (this.inputView != null) {
        return;
      }
      return this.inputView = new InputView();
    }
  };

}).call(this);
