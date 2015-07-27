(function() {
  var defaultIndentChar, defaultIndentSize, defaultIndentWithTabs, softTabs, tabLength, _ref, _ref1;

  tabLength = (_ref = typeof atom !== "undefined" && atom !== null ? atom.config.get('editor.tabLength') : void 0) != null ? _ref : 4;

  softTabs = (_ref1 = typeof atom !== "undefined" && atom !== null ? atom.config.get('editor.softTabs') : void 0) != null ? _ref1 : true;

  defaultIndentSize = (softTabs ? tabLength : 1);

  defaultIndentChar = (softTabs ? " " : "\t");

  defaultIndentWithTabs = !softTabs;

  module.exports = {
    name: "Ruby",
    namespace: "ruby",

    /*
    Supported Grammars
     */
    grammars: ["Ruby", "Ruby on Rails"],

    /*
    Supported extensions
     */
    extensions: ["rb"],
    options: {
      indent_size: {
        type: 'integer',
        "default": defaultIndentSize,
        minimum: 0,
        description: "Indentation size/length"
      },
      indent_char: {
        type: 'string',
        "default": defaultIndentChar,
        description: "Indentation character",
        "enum": [" ", "\t"]
      }
    }
  };

}).call(this);
