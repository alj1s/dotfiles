(function() {
  var CompositeDisposable, InputView, SearchModel, TextEditorView, View, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ref = require('atom-space-pen-views'), View = _ref.View, TextEditorView = _ref.TextEditorView;

  CompositeDisposable = require('atom').CompositeDisposable;

  SearchModel = require('./search-model');

  module.exports = InputView = (function(_super) {
    __extends(InputView, _super);

    function InputView() {
      this.toggleCaseOption = __bind(this.toggleCaseOption, this);
      this.toggleRegexOption = __bind(this.toggleRegexOption, this);
      return InputView.__super__.constructor.apply(this, arguments);
    }

    InputView.content = function() {
      return this.div({
        tabIndex: -1,
        "class": 'isearch tool-panel panel-bottom padded'
      }, (function(_this) {
        return function() {
          _this.div({
            "class": 'block'
          }, function() {
            _this.span({
              outlet: 'descriptionLabel',
              "class": 'description'
            }, 'Incremental Search');
            return _this.span({
              outlet: 'optionsLabel',
              "class": 'options'
            });
          });
          return _this.div({
            "class": 'find-container block'
          }, function() {
            _this.div({
              "class": 'editor-container'
            }, function() {
              return _this.subview('findEditor', new TextEditorView({
                mini: true,
                placeholderText: 'search'
              }));
            });
            return _this.div({
              "class": 'btn-group btn-toggle btn-group-options'
            }, function() {
              _this.button({
                outlet: 'regexOptionButton',
                "class": 'btn'
              }, '.*');
              return _this.button({
                outlet: 'caseOptionButton',
                "class": 'btn'
              }, 'Aa');
            });
          });
        };
      })(this));
    };

    InputView.prototype.initialize = function(serializeState) {
      this.subscriptions = new CompositeDisposable;
      serializeState = serializeState || {};
      this.searchModel = new SearchModel(serializeState.modelState);
      return this.handleEvents();
    };

    InputView.prototype.handleEvents = function() {
      this.findEditor.getModel().onDidStopChanging((function(_this) {
        return function() {
          return _this.updateSearchText();
        };
      })(this));
      this.subscriptions.add(atom.commands.add(this.findEditor.element, {
        'core:confirm': (function(_this) {
          return function() {
            return _this.trigger('forward');
          };
        })(this)
      }));
      this.subscriptions.add(atom.commands.add(this.element, {
        'core:close': (function(_this) {
          return function() {
            return _this.cancelSearch();
          };
        })(this),
        'core:cancel': (function(_this) {
          return function() {
            return _this.cancelSearch();
          };
        })(this),
        'incremental-search:toggle-regex-option': this.toggleRegexOption,
        'incremental-search:toggle-case-option': this.toggleCaseOption,
        'incremental-search:focus-editor': (function(_this) {
          return function() {
            return _this.focusEditor();
          };
        })(this),
        'incremental-search:slurp': (function(_this) {
          return function() {
            return _this.slurp();
          };
        })(this)
      }));
      this.regexOptionButton.on('click', this.toggleRegexOption);
      this.caseOptionButton.on('click', this.toggleCaseOption);
      return this.searchModel.on('updatedOptions', (function(_this) {
        return function() {
          _this.updateOptionButtons();
          return _this.updateOptionsLabel();
        };
      })(this));
    };

    InputView.prototype.attached = function() {
      if (this.tooltipSubscriptions != null) {
        return;
      }
      this.tooltipSubscriptions = new CompositeDisposable;
      this.tooltipSubscriptions.add(atom.tooltips.add(this.regexOptionButton, {
        title: "Use Regex",
        keyBindingCommand: 'incremental-search:toggle-regex-option',
        keyBindingTarget: this.findEditor[0]
      }));
      return this.tooltipSubscriptions.add(atom.tooltips.add(this.caseOptionButton, {
        title: "Match Case",
        keyBindingCommand: 'incremental-search:toggle-case-option',
        keyBindingTarget: this.findEditor[0]
      }));
    };

    InputView.prototype.hideAllTooltips = function() {
      var _ref1;
      if ((_ref1 = this.tooltipSubscriptions) != null) {
        _ref1.dispose();
      }
      return this.tooltipSubscriptions = null;
    };

    InputView.prototype.slurp = function() {
      this.searchModel.slurp();
      return this.findEditor.setText(this.searchModel.pattern);
    };

    InputView.prototype.toggleRegexOption = function() {
      this.searchModel.update({
        pattern: this.findEditor.getText(),
        useRegex: !this.searchModel.useRegex
      });
      this.updateOptionsLabel();
      return this.updateOptionButtons();
    };

    InputView.prototype.toggleCaseOption = function() {
      this.searchModel.update({
        pattern: this.findEditor.getText(),
        caseSensitive: !this.searchModel.caseSensitive
      });
      this.updateOptionsLabel();
      return this.updateOptionButtons();
    };

    InputView.prototype.updateSearchText = function() {
      var pattern;
      pattern = this.findEditor.getText();
      return this.searchModel.update({
        pattern: pattern
      });
    };

    InputView.prototype.serialize = function() {
      return {
        modelState: this.searchModel.serialize()
      };
    };

    InputView.prototype.destroy = function() {
      var _ref1, _ref2;
      if ((_ref1 = this.subscriptions) != null) {
        _ref1.dispose();
      }
      return (_ref2 = this.tooltipSubscriptions) != null ? _ref2.dispose() : void 0;
    };

    InputView.prototype.detach = function() {
      var workspaceElement;
      this.hideAllTooltips();
      workspaceElement = atom.views.getView(atom.workspace);
      workspaceElement.focus();
      return InputView.__super__.detach.call(this);
    };

    InputView.prototype.trigger = function(direction) {
      var pattern;
      this.searchModel.direction = direction;
      this.updateOptionsLabel();
      this.updateOptionButtons();
      if (!this.hasParent()) {
        this.inputPanel = atom.workspace.addBottomPanel({
          item: this
        });
        pattern = '';
        this.findEditor.setText(pattern);
        this.searchModel.start(pattern);
      }
      this.inputPanel.show();
      if (!this.findEditor.hasClass('is-focused')) {
        this.findEditor.focus();
        return;
      }
      if (this.findEditor.getText()) {
        return this.searchModel.findNext();
      } else {
        if (this.searchModel.history.length) {
          pattern = this.searchModel.history[this.searchModel.history.length - 1];
          this.findEditor.setText(pattern);
          return this.searchModel.update({
            pattern: pattern
          });
        }
      }
    };

    InputView.prototype.stopSearch = function() {
      this.searchModel.stopSearch(this.findEditor.getText());
      return this.detach();
    };

    InputView.prototype.cancelSearch = function() {
      var _ref1;
      this.searchModel.cancelSearch();
      if ((_ref1 = this.inputPanel) != null) {
        _ref1.hide();
      }
      return this.detach();
    };

    InputView.prototype.updateOptionsLabel = function() {
      var label;
      label = [];
      if (this.searchModel.useRegex) {
        label.push('regex');
      }
      if (this.searchModel.caseSensitive) {
        label.push('case sensitive');
      } else {
        label.push('case insensitive');
      }
      return this.optionsLabel.text(' (' + label.join(', ') + ')');
    };

    InputView.prototype.updateOptionButtons = function() {
      this.setOptionButtonState(this.regexOptionButton, this.searchModel.useRegex);
      return this.setOptionButtonState(this.caseOptionButton, this.searchModel.caseSensitive);
    };

    InputView.prototype.setOptionButtonState = function(optionButton, selected) {
      if (selected) {
        return optionButton.addClass('selected');
      } else {
        return optionButton.removeClass('selected');
      }
    };

    InputView.prototype.focusEditor = function() {
      if (this.searchModel.lastPosition) {
        this.searchModel.moveCursorToCurrent();
        return atom.workspaceView.getActiveView().focus();
      }
    };

    return InputView;

  })(View);

}).call(this);
