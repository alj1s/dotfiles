(function() {
  var ColorProject, CompositeDisposable, PigmentsAPI, PigmentsProvider, url, _ref;

  CompositeDisposable = require('atom').CompositeDisposable;

  ColorProject = require('./color-project');

  _ref = [], PigmentsProvider = _ref[0], PigmentsAPI = _ref[1], url = _ref[2];

  module.exports = {
    config: {
      traverseIntoSymlinkDirectories: {
        type: 'boolean',
        "default": false
      },
      sourceNames: {
        type: 'array',
        "default": ['**/*.styl', '**/*.stylus', '**/*.less', '**/*.sass', '**/*.scss'],
        description: "Glob patterns of files to scan for variables.",
        items: {
          type: 'string'
        }
      },
      ignoredNames: {
        type: 'array',
        "default": ["vendor/*", "node_modules/*", "spec/*", "test/*"],
        description: "Glob patterns of files to ignore when scanning the project for variables.",
        items: {
          type: 'string'
        }
      },
      ignoredScopes: {
        type: 'array',
        "default": [],
        description: "Regular expressions of scopes in which colors are ignored. For example, to ignore all colors in comments you can use `\\.comment`.",
        items: {
          type: 'string'
        }
      },
      autocompleteScopes: {
        type: 'array',
        "default": ['.source.css', '.source.css.less', '.source.sass', '.source.css.scss', '.source.stylus'],
        description: 'The autocomplete provider will only complete color names in editors whose scope is present in this list.',
        items: {
          type: 'string'
        }
      },
      extendAutocompleteToVariables: {
        type: 'boolean',
        "default": false,
        description: 'When enabled, the autocomplete provider will also provides completion for non-color variables.'
      },
      markerType: {
        type: 'string',
        "default": 'background',
        "enum": ['background', 'outline', 'underline', 'dot', 'square-dot']
      },
      sortPaletteColors: {
        type: 'string',
        "default": 'none',
        "enum": ['none', 'by name', 'by color']
      },
      groupPaletteColors: {
        type: 'string',
        "default": 'none',
        "enum": ['none', 'by file']
      },
      mergeColorDuplicates: {
        type: 'boolean',
        "default": false
      },
      delayBeforeScan: {
        type: 'integer',
        "default": 500,
        description: 'Number of milliseconds after which the current buffer will be scanned for changes in the colors. This delay starts at the end of the text input and will be aborted if you start typing again during the interval.'
      },
      ignoreVcsIgnoredPaths: {
        type: 'boolean',
        "default": true,
        title: 'Ignore VCS Ignored Paths'
      }
    },
    activate: function(state) {
      var convertMethod;
      require('./register-elements');
      this.project = state.project != null ? atom.deserializers.deserialize(state.project) : new ColorProject();
      atom.commands.add('atom-workspace', {
        'pigments:find-colors': (function(_this) {
          return function() {
            return _this.findColors();
          };
        })(this),
        'pigments:show-palette': (function(_this) {
          return function() {
            return _this.showPalette();
          };
        })(this),
        'pigments:reload': (function(_this) {
          return function() {
            return _this.reloadProjectVariables();
          };
        })(this)
      });
      convertMethod = (function(_this) {
        return function(action) {
          return function(event) {
            var colorBuffer, editor, marker;
            marker = _this.lastEvent != null ? action(_this.colorMarkerForMouseEvent(_this.lastEvent)) : (editor = atom.workspace.getActiveTextEditor(), colorBuffer = _this.project.colorBufferForEditor(editor), editor.getCursors().forEach(function(cursor) {
              marker = colorBuffer.getColorMarkerAtBufferPosition(cursor.getBufferPosition());
              return action(marker);
            }));
            return _this.lastEvent = null;
          };
        };
      })(this);
      atom.commands.add('atom-text-editor', {
        'pigments:convert-to-hex': convertMethod(function(marker) {
          if (marker != null) {
            return marker.convertContentToHex();
          }
        }),
        'pigments:convert-to-rgba': convertMethod(function(marker) {
          if (marker != null) {
            return marker.convertContentToRGBA();
          }
        })
      });
      atom.workspace.addOpener((function(_this) {
        return function(uriToOpen) {
          var host, protocol, _ref1;
          url || (url = require('url'));
          _ref1 = url.parse(uriToOpen), protocol = _ref1.protocol, host = _ref1.host;
          if (!(protocol === 'pigments:' && host === 'search')) {
            return;
          }
          return atom.views.getView(_this.project.findAllColors());
        };
      })(this));
      atom.workspace.addOpener((function(_this) {
        return function(uriToOpen) {
          var host, protocol, _ref1;
          url || (url = require('url'));
          _ref1 = url.parse(uriToOpen), protocol = _ref1.protocol, host = _ref1.host;
          if (!(protocol === 'pigments:' && host === 'palette')) {
            return;
          }
          return atom.views.getView(_this.project.getPalette());
        };
      })(this));
      return atom.contextMenu.add({
        'atom-text-editor': [
          {
            label: 'Pigments',
            submenu: [
              {
                label: 'Convert to hexadecimal',
                command: 'pigments:convert-to-hex'
              }, {
                label: 'Convert to rgba',
                command: 'pigments:convert-to-rgba'
              }
            ],
            shouldDisplay: (function(_this) {
              return function(event) {
                return _this.shouldDisplayContextMenu(event);
              };
            })(this)
          }
        ]
      });
    },
    deactivate: function() {
      var _ref1;
      return (_ref1 = this.getProject()) != null ? typeof _ref1.destroy === "function" ? _ref1.destroy() : void 0 : void 0;
    },
    provideAutocomplete: function() {
      if (PigmentsProvider == null) {
        PigmentsProvider = require('./pigments-provider');
      }
      return new PigmentsProvider(this.getProject());
    },
    provideAPI: function() {
      if (PigmentsAPI == null) {
        PigmentsAPI = require('./pigments-api');
      }
      return new PigmentsAPI(this.getProject());
    },
    shouldDisplayContextMenu: function(event) {
      this.lastEvent = event;
      setTimeout(((function(_this) {
        return function() {
          return _this.lastEvent = null;
        };
      })(this)), 10);
      return this.colorMarkerForMouseEvent(event) != null;
    },
    colorMarkerForMouseEvent: function(event) {
      var colorBuffer, editor;
      editor = atom.workspace.getActiveTextEditor();
      colorBuffer = this.project.colorBufferForEditor(editor);
      return colorBuffer != null ? colorBuffer.colorMarkerForMouseEvent(event) : void 0;
    },
    serialize: function() {
      return {
        project: this.project.serialize()
      };
    },
    getProject: function() {
      return this.project;
    },
    findColors: function() {
      var pane, uri;
      uri = "pigments://search";
      pane = atom.workspace.paneForURI(uri);
      pane || (pane = atom.workspace.getActivePane());
      return atom.workspace.openURIInPane(uri, pane, {});
    },
    showPalette: function() {
      return this.project.initialize().then(function() {
        var pane, uri;
        uri = "pigments://palette";
        pane = atom.workspace.paneForURI(uri);
        pane || (pane = atom.workspace.getActivePane());
        return atom.workspace.openURIInPane(uri, pane, {});
      })["catch"](function(reason) {
        return console.error(reason);
      });
    },
    reloadProjectVariables: function() {
      return this.project.initialize().then((function(_this) {
        return function() {
          return _this.project.loadPathsAndVariables();
        };
      })(this))["catch"](function(reason) {
        return console.error(reason);
      });
    }
  };

}).call(this);
