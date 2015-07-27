(function() {
  var $$$, TextEditorView, View, _ref;

  _ref = require('atom-space-pen-views'), $$$ = _ref.$$$, View = _ref.View, TextEditorView = _ref.TextEditorView;

  module.exports = function() {
    return this.div({
      tabIndex: -1,
      "class": 'atomts-rename-view'
    }, (function(_this) {
      return function() {
        _this.div({
          "class": 'block'
        }, function() {
          return _this.div(function() {
            _this.span({
              outlet: 'title'
            }, function() {
              return 'Rename Variable';
            });
            return _this.span({
              "class": 'subtle-info-message'
            }, function() {
              _this.span('Close this panel with ');
              _this.span({
                "class": 'highlight'
              }, 'esc');
              _this.span(' key. And commit with the ');
              _this.span({
                "class": 'highlight'
              }, 'enter');
              return _this.span('key.');
            });
          });
        });
        _this.div({
          "class": 'find-container block'
        }, function() {
          return _this.div({
            "class": 'editor-container'
          }, function() {
            return _this.subview('newNameEditor', new TextEditorView({
              mini: true,
              placeholderText: 'new name'
            }));
          });
        });
        _this.div({
          outlet: 'fileCount'
        }, function() {});
        _this.br({});
        return _this.div({
          "class": 'highlight-error',
          style: 'display:none',
          outlet: 'validationMessage'
        });
      };
    })(this));
  };

}).call(this);
