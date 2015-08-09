Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _cssbeautify = require('cssbeautify');

var _cssbeautify2 = _interopRequireDefault(_cssbeautify);

var _csscomb = require('csscomb');

var _csscomb2 = _interopRequireDefault(_csscomb);

'use babel';

var directory = atom.project.getDirectories().shift();
var userConfigPath = directory ? directory.resolve('.csscomb.json') : '';
var atomConfigPath = _path2['default'].join(__dirname, './csscomb.json');

var config = {
  configureWithPreset: {
    title: 'Configure with preset',
    description: 'Configure with preset config.',
    type: 'string',
    'default': 'csscomb',
    'enum': ['csscomb', 'zen', 'yandex']
  },
  configureWithJSON: {
    title: 'Configure with JSON',
    description: 'Configure with JSON file in the current directory.',
    type: 'boolean',
    'default': false
  },
  executeOnSave: {
    title: 'Execute on save',
    description: 'Execute sorting CSS property on save.',
    type: 'boolean',
    'default': false
  },
  indentType: {
    title: 'Indent Type',
    type: 'string',
    'default': 'space',
    'enum': ['space', 'tab']
  },
  indentSize: {
    title: 'Indent Size',
    type: 'number',
    'default': 2
  }
};

exports.config = config;
var configureWithPreset = function configureWithPreset() {
  return atom.config.get('atom-csscomb.configureWithPreset');
};
var configureWithJSON = function configureWithJSON() {
  return atom.config.get('atom-csscomb.configureWithJSON');
};
var executeOnSave = function executeOnSave() {
  return atom.config.get('atom-csscomb.executeOnSave');
};
var indentType = function indentType() {
  return atom.config.get('atom-csscomb.indentType');
};
var indentSize = function indentSize() {
  return atom.config.get('atom-csscomb.indentSize');
};

var execute = function execute() {

  var editor = atom.workspace.getActiveTextEditor();

  if (!editor) {
    return;
  }

  var text = editor.getText();
  var selectedText = editor.getSelectedText();

  var configJSON = null;
  var presetType = configureWithPreset();

  if (configureWithJSON()) {
    if (_fs2['default'].existsSync(userConfigPath)) {
      configJSON = require(userConfigPath);
    } else if (_fs2['default'].existsSync(atomConfigPath)) {
      configJSON = require(atomConfigPath);
    }
  }

  if (!configJSON) {
    configJSON = _csscomb2['default'].getConfig(presetType);
  }

  var csscomb = new _csscomb2['default']();
  csscomb.configure(configJSON);

  var grammer = editor.getGrammar().name.toLowerCase();
  var syntax = grammer || 'css';

  var indent = '';
  switch (indentType()) {
    case 'space':
      indent = Array(indentSize() + 1).join(' ');
      break;
    case 'tab':
      indent = '\t';
      break;
  }

  if (selectedText.length !== 0) {
    try {
      selectedText = csscomb.processString(selectedText, {
        syntax: syntax
      });
      editor.setTextInBufferRange(editor.getSelectedBufferRange(), (0, _cssbeautify2['default'])(selectedText, {
        indent: indent
      }));
    } catch (e) {}
  } else {
    try {
      text = csscomb.processString(text, {
        syntax: syntax
      });
      editor.setText((0, _cssbeautify2['default'])(text, {
        indent: indent
      }));
    } catch (e) {}
  }
};

var editorObserver = null;

var activate = function activate(state) {
  atom.commands.add('atom-workspace', 'atom-csscomb:execute', function () {
    execute();
  });
  editorObserver = atom.workspace.observeTextEditors(function (editor) {
    editor.getBuffer().onWillSave(function () {
      if (executeOnSave()) {
        execute();
      }
    });
  });
};

exports.activate = activate;
var deactivate = function deactivate() {
  editorObserver.dispose();
};
exports.deactivate = deactivate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9hdG9tLWNzc2NvbWIvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O2tCQUV3QixJQUFJOzs7O29CQUNKLE1BQU07Ozs7MkJBQ04sYUFBYTs7Ozt1QkFDYixTQUFTOzs7O0FBTGpDLFdBQVcsQ0FBQzs7QUFPWixJQUFNLFNBQVMsR0FBUSxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQzdELElBQU0sY0FBYyxHQUFHLFNBQVMsR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUMzRSxJQUFNLGNBQWMsR0FBRyxrQkFBSyxJQUFJLENBQUMsU0FBUyxFQUFFLGdCQUFnQixDQUFDLENBQUM7O0FBRXZELElBQUksTUFBTSxHQUFHO0FBQ2xCLHFCQUFtQixFQUFFO0FBQ25CLFNBQUssRUFBRSx1QkFBdUI7QUFDOUIsZUFBVyxFQUFFLCtCQUErQjtBQUM1QyxRQUFJLEVBQUUsUUFBUTtBQUNkLGVBQVMsU0FBUztBQUNsQixZQUFNLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxRQUFRLENBQUM7R0FDbkM7QUFDRCxtQkFBaUIsRUFBRTtBQUNqQixTQUFLLEVBQUUscUJBQXFCO0FBQzVCLGVBQVcsRUFBRSxvREFBb0Q7QUFDakUsUUFBSSxFQUFFLFNBQVM7QUFDZixlQUFTLEtBQUs7R0FDZjtBQUNELGVBQWEsRUFBRTtBQUNiLFNBQUssRUFBRSxpQkFBaUI7QUFDeEIsZUFBVyxFQUFFLHVDQUF1QztBQUNwRCxRQUFJLEVBQUUsU0FBUztBQUNmLGVBQVMsS0FBSztHQUNmO0FBQ0QsWUFBVSxFQUFFO0FBQ1YsU0FBSyxFQUFFLGFBQWE7QUFDcEIsUUFBSSxFQUFFLFFBQVE7QUFDZCxlQUFTLE9BQU87QUFDaEIsWUFBTSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUM7R0FDdkI7QUFDRCxZQUFVLEVB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LENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRTtHQUNmLE1BQU07QUFDTCxRQUFJO0FBQ0YsVUFBSSxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFO0FBQ2pDLGNBQU0sRUFBRSxNQUFNO09BQ2YsQ0FBQyxDQUFDO0FBQ0gsWUFBTSxDQUFDLE9BQU8sQ0FDWiw4QkFBWSxJQUFJLEVBQUU7QUFDaEIsY0FBTSxFQUFFLE1BQU07T0FDZixDQUFDLENBQ0gsQ0FBQTtLQUNGLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRTtHQUNmO0NBQ0YsQ0FBQzs7QUFFRixJQUFJLGNBQWMsR0FBRyxJQUFJLENBQUM7O0FBRW5CLElBQU0sUUFBUSxHQUFHLFNBQVgsUUFBUSxDQUFJLEtBQUssRUFBSztBQUNqQyxNQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxzQkFBc0IsRUFBRSxZQUFNO0FBQ2hFLFdBQU8sRUFBRSxDQUFDO0dBQ1gsQ0FBQyxDQUFDO0FBQ0gsZ0JBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLFVBQUMsTUFBTSxFQUFLO0FBQzdELFVBQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxVQUFVLENBQUMsWUFBTTtBQUNsQyxVQUFJLGFBQWEsRUFBRSxFQUFFO0FBQ25CLGVBQU8sRUFBRSxDQUFDO09BQ1g7S0FDRixDQUFDLENBQUM7R0FDSixDQUFDLENBQUM7Q0FDSixDQUFDOztRQVhXLFFBQVEsR0FBUixRQUFRO0FBYWQsSUFBTSxVQUFVLEdBQUcsU0FBYixVQUFVLEdBQVM7QUFDOUIsZ0JBQWMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztDQUMxQixDQUFDO1FBRlcsVUFBVSxHQUFWLFVBQVUiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL2F0b20tY3NzY29tYi9pbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuXG5pbXBvcnQgZnMgICAgICAgICAgZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGggICAgICAgIGZyb20gJ3BhdGgnO1xuaW1wb3J0IENTU0JlYXV0aWZ5IGZyb20gJ2Nzc2JlYXV0aWZ5JztcbmltcG9ydCBDU1NDb21iICAgICBmcm9tICdjc3Njb21iJztcblxuY29uc3QgZGlyZWN0b3J5ICAgICAgPSBhdG9tLnByb2plY3QuZ2V0RGlyZWN0b3JpZXMoKS5zaGlmdCgpO1xuY29uc3QgdXNlckNvbmZpZ1BhdGggPSBkaXJlY3RvcnkgPyBkaXJlY3RvcnkucmVzb2x2ZSgnLmNzc2NvbWIuanNvbicpIDogJyc7XG5jb25zdCBhdG9tQ29uZmlnUGF0aCA9IHBhdGguam9pbihfX2Rpcm5hbWUsICcuL2Nzc2NvbWIuanNvbicpO1xuXG5leHBvcnQgbGV0IGNvbmZpZyA9IHtcbiAgY29uZmlndXJlV2l0aFByZXNldDoge1xuICAgIHRpdGxlOiAnQ29uZmlndXJlIHdpdGggcHJlc2V0JyxcbiAgICBkZXNjcmlwdGlvbjogJ0NvbmZpZ3VyZSB3aXRoIHByZXNldCBjb25maWcuJyxcbiAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICBkZWZhdWx0OiAnY3NzY29tYicsXG4gICAgZW51bTogWydjc3Njb21iJywgJ3plbicsICd5YW5kZXgnXVxuICB9LFxuICBjb25maWd1cmVXaXRoSlNPTjoge1xuICAgIHRpdGxlOiAnQ29uZmlndXJlIHdpdGggSlNPTicsXG4gICAgZGVzY3JpcHRpb246ICdDb25maWd1cmUgd2l0aCBKU09OIGZpbGUgaW4gdGhlIGN1cnJlbnQgZGlyZWN0b3J5LicsXG4gICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgIGRlZmF1bHQ6IGZhbHNlXG4gIH0sXG4gIGV4ZWN1dGVPblNhdmU6IHtcbiAgICB0aXRsZTogJ0V4ZWN1dGUgb24gc2F2ZScsXG4gICAgZGVzY3JpcHRpb246ICdFeGVjdXRlIHNvcnRpbmcgQ1NTIHByb3BlcnR5IG9uIHNhdmUuJyxcbiAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgZGVmYXVsdDogZmFsc2VcbiAgfSxcbiAgaW5kZW50VHlwZToge1xuICAgIHRpdGxlOiAnSW5kZW50IFR5cGUnLFxuICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgIGRlZmF1bHQ6ICdzcGFjZScsXG4gICAgZW51bTogWydzcGFjZScsICd0YWInXVxuICB9LFxuICBpbmRlbnRTaXplOiB7XG4gICAgdGl0bGU6ICdJbmRlbnQgU2l6ZScsXG4gICAgdHlwZTogJ251bWJlcicsXG4gICAgZGVmYXVsdDogMlxuICB9XG59O1xuXG5jb25zdCBjb25maWd1cmVXaXRoUHJlc2V0ID0gKCkgPT4gYXRvbS5jb25maWcuZ2V0KCdhdG9tLWNzc2NvbWIuY29uZmlndXJlV2l0aFByZXNldCcpO1xuY29uc3QgY29uZmlndXJlV2l0aEpTT04gICA9ICgpID0+IGF0b20uY29uZmlnLmdldCgnYXRvbS1jc3Njb21iLmNvbmZpZ3VyZVdpdGhKU09OJyk7XG5jb25zdCBleGVjdXRlT25TYXZlICAgICAgID0gKCkgPT4gYXRvbS5jb25maWcuZ2V0KCdhdG9tLWNzc2NvbWIuZXhlY3V0ZU9uU2F2ZScpO1xuY29uc3QgaW5kZW50VHlwZSAgICAgICAgICA9ICgpID0+IGF0b20uY29uZmlnLmdldCgnYXRvbS1jc3Njb21iLmluZGVudFR5cGUnKTtcbmNvbnN0IGluZGVudFNpemUgICAgICAgICAgPSAoKSA9PiBhdG9tLmNvbmZpZy5nZXQoJ2F0b20tY3NzY29tYi5pbmRlbnRTaXplJyk7XG5cbmNvbnN0IGV4ZWN1dGUgPSAoKSA9PiB7XG5cbiAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuXG4gIGlmICghZWRpdG9yKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgbGV0IHRleHQgPSBlZGl0b3IuZ2V0VGV4dCgpO1xuICBsZXQgc2VsZWN0ZWRUZXh0ID0gZWRpdG9yLmdldFNlbGVjdGVkVGV4dCgpO1xuXG4gIGxldCBjb25maWdKU09OID0gbnVsbDtcbiAgbGV0IHByZXNldFR5cGUgPSBjb25maWd1cmVXaXRoUHJlc2V0KCk7XG5cbiAgaWYgKGNvbmZpZ3VyZVdpdGhKU09OKCkpIHtcbiAgICBpZiAoZnMuZXhpc3RzU3luYyh1c2VyQ29uZmlnUGF0aCkpIHtcbiAgICAgIGNvbmZpZ0pTT04gPSByZXF1aXJlKHVzZXJDb25maWdQYXRoKTtcbiAgICB9IGVsc2UgaWYgKGZzLmV4aXN0c1N5bmMoYXRvbUNvbmZpZ1BhdGgpKSB7XG4gICAgICBjb25maWdKU09OID0gcmVxdWlyZShhdG9tQ29uZmlnUGF0aCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFjb25maWdKU09OKSB7XG4gICAgY29uZmlnSlNPTiA9IENTU0NvbWIuZ2V0Q29uZmlnKHByZXNldFR5cGUpO1xuICB9XG5cbiAgbGV0IGNzc2NvbWIgPSBuZXcgQ1NTQ29tYigpO1xuICBjc3Njb21iLmNvbmZpZ3VyZShjb25maWdKU09OKTtcblxuICBsZXQgZ3JhbW1lciA9IGVkaXRvci5nZXRHcmFtbWFyKCkubmFtZS50b0xvd2VyQ2FzZSgpO1xuICBsZXQgc3ludGF4ID0gZ3JhbW1lciB8fCAnY3NzJztcblxuICBsZXQgaW5kZW50ID0gJyc7XG4gIHN3aXRjaCAoaW5kZW50VHlwZSgpKSB7XG4gICAgY2FzZSAnc3BhY2UnOlxuICAgICAgaW5kZW50ID0gQXJyYXkoaW5kZW50U2l6ZSgpICsgMSkuam9pbignICcpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAndGFiJzpcbiAgICAgIGluZGVudCA9ICdcXHQnO1xuICAgICAgYnJlYWs7XG4gIH1cblxuICBpZiAoc2VsZWN0ZWRUZXh0Lmxlbmd0aCAhPT0gMCkge1xuICAgIHRyeSB7XG4gICAgICBzZWxlY3RlZFRleHQgPSBjc3Njb21iLnByb2Nlc3NTdHJpbmcoc2VsZWN0ZWRUZXh0LCB7XG4gICAgICAgIHN5bnRheDogc3ludGF4XG4gICAgICB9KTtcbiAgICAgIGVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZShcbiAgICAgICAgZWRpdG9yLmdldFNlbGVjdGVkQnVmZmVyUmFuZ2UoKSxcbiAgICAgICAgQ1NTQmVhdXRpZnkoc2VsZWN0ZWRUZXh0LCB7XG4gICAgICAgICAgaW5kZW50OiBpbmRlbnRcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZSkge31cbiAgfSBlbHNlIHtcbiAgICB0cnkge1xuICAgICAgdGV4dCA9IGNzc2NvbWIucHJvY2Vzc1N0cmluZyh0ZXh0LCB7XG4gICAgICAgIHN5bnRheDogc3ludGF4XG4gICAgICB9KTtcbiAgICAgIGVkaXRvci5zZXRUZXh0KFxuICAgICAgICBDU1NCZWF1dGlmeSh0ZXh0LCB7XG4gICAgICAgICAgaW5kZW50OiBpbmRlbnRcbiAgICAgICAgfSlcbiAgICAgIClcbiAgICB9IGNhdGNoIChlKSB7fVxuICB9XG59O1xuXG5sZXQgZWRpdG9yT2JzZXJ2ZXIgPSBudWxsO1xuXG5leHBvcnQgY29uc3QgYWN0aXZhdGUgPSAoc3RhdGUpID0+IHtcbiAgYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20td29ya3NwYWNlJywgJ2F0b20tY3NzY29tYjpleGVjdXRlJywgKCkgPT4ge1xuICAgIGV4ZWN1dGUoKTtcbiAgfSk7XG4gIGVkaXRvck9ic2VydmVyID0gYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVRleHRFZGl0b3JzKChlZGl0b3IpID0+IHtcbiAgICBlZGl0b3IuZ2V0QnVmZmVyKCkub25XaWxsU2F2ZSgoKSA9PiB7XG4gICAgICBpZiAoZXhlY3V0ZU9uU2F2ZSgpKSB7XG4gICAgICAgIGV4ZWN1dGUoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG59O1xuXG5leHBvcnQgY29uc3QgZGVhY3RpdmF0ZSA9ICgpID0+IHtcbiAgZWRpdG9yT2JzZXJ2ZXIuZGlzcG9zZSgpO1xufTtcbiJdfQ==