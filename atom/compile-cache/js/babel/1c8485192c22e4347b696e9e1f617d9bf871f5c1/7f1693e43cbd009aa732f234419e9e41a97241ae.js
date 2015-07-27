'use babel';
/* @flow */

var _require = require('atom');

var TextEditor = _require.TextEditor;

describe('PHP grammar', function () {
  var grammar = null;

  beforeEach(function () {
    waitsForPromise(function () {
      return atom.packages.activatePackage('nuclide-language-hack');
    });
    runs(function () {
      return grammar = atom.grammars.grammarForScopeName('text.html.hack');
    });
  });

  it('parses the grammar', function () {
    expect(grammar).toBeTruthy();
    expect(grammar.scopeName).toBe('text.html.hack');
  });

  describe('operators', function () {
    it('should tokenize = correctly', function () {
      var tokens = grammar.tokenizeLines('<?hh\n$test = 2;');
      expect(tokens[1][0]).toEqual({
        value: '$',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'variable.other.php', 'punctuation.definition.variable.php']
      });
      expect(tokens[1][2]).toEqual({
        value: ' ',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
      });
      expect(tokens[1][3]).toEqual({
        value: '=',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'keyword.operator.assignment.php']
      });
      expect(tokens[1][4]).toEqual({
        value: ' ',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
      });
      expect(tokens[1][5]).toEqual({
        value: '2',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'constant.numeric.php']
      });
      expect(tokens[1][6]).toEqual({
        value: ';',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'punctuation.terminator.expression.php']
      });
    });

    it('should tokenize + correctly', function () {
      var tokens = grammar.tokenizeLines('<?hh\n1 + 2;');
      expect(tokens[1][0]).toEqual({
        value: '1',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'constant.numeric.php']
      });
      expect(tokens[1][1]).toEqual({
        value: ' ',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
      });
      expect(tokens[1][2]).toEqual({
        value: '+',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'keyword.operator.arithmetic.php']
      });
      expect(tokens[1][3]).toEqual({
        value: ' ',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
      });
      expect(tokens[1][4]).toEqual({
        value: '2',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'constant.numeric.php']
      });
      expect(tokens[1][5]).toEqual({
        value: ';',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'punctuation.terminator.expression.php']
      });
    });

    it('should tokenize - correctly', function () {
      var tokens = grammar.tokenizeLines('<?hh\n1 - 2;');
      expect(tokens[1][0]).toEqual({
        value: '1',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'constant.numeric.php']
      });
      expect(tokens[1][1]).toEqual({
        value: ' ',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
      });
      expect(tokens[1][2]).toEqual({
        value: '-',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'keyword.operator.arithmetic.php']
      });
      expect(tokens[1][3]).toEqual({
        value: ' ',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
      });
      expect(tokens[1][4]).toEqual({
        value: '2',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'constant.numeric.php']
      });
      expect(tokens[1][5]).toEqual({
        value: ';',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'punctuation.terminator.expression.php']
      });
    });

    it('should tokenize * correctly', function () {
      var tokens = grammar.tokenizeLines('<?hh\n1 * 2;');
      expect(tokens[1][0]).toEqual({
        value: '1',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'constant.numeric.php']
      });
      expect(tokens[1][1]).toEqual({
        value: ' ',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
      });
      expect(tokens[1][2]).toEqual({
        value: '*',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'keyword.operator.arithmetic.php']
      });
      expect(tokens[1][3]).toEqual({
        value: ' ',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
      });
      expect(tokens[1][4]).toEqual({
        value: '2',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'constant.numeric.php']
      });
      expect(tokens[1][5]).toEqual({
        value: ';',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'punctuation.terminator.expression.php']
      });
    });

    it('should tokenize / correctly', function () {
      var tokens = grammar.tokenizeLines('<?hh\n1 / 2;');
      expect(tokens[1][0]).toEqual({
        value: '1',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'constant.numeric.php']
      });
      expect(tokens[1][1]).toEqual({
        value: ' ',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
      });
      expect(tokens[1][2]).toEqual({
        value: '/',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'keyword.operator.arithmetic.php']
      });
      expect(tokens[1][3]).toEqual({
        value: ' ',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
      });
      expect(tokens[1][4]).toEqual({
        value: '2',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'constant.numeric.php']
      });
      expect(tokens[1][5]).toEqual({
        value: ';',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'punctuation.terminator.expression.php']
      });
    });

    it('should tokenize % correctly', function () {
      var tokens = grammar.tokenizeLines('<?hh\n1 % 2;');
      expect(tokens[1][0]).toEqual({
        value: '1',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'constant.numeric.php']
      });
      expect(tokens[1][1]).toEqual({
        value: ' ',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
      });
      expect(tokens[1][2]).toEqual({
        value: '%',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'keyword.operator.arithmetic.php']
      });
      expect(tokens[1][3]).toEqual({
        value: ' ',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
      });
      expect(tokens[1][4]).toEqual({
        value: '2',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'constant.numeric.php']
      });
      expect(tokens[1][5]).toEqual({
        value: ';',
        scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'punctuation.terminator.expression.php']
      });
    });

    describe('combined operators', function () {
      it('should tokenize += correctly', function () {
        var tokens = grammar.tokenizeLines('<?hh\n$test += 2;');
        expect(tokens[1][0]).toEqual({
          value: '$',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'variable.other.php', 'punctuation.definition.variable.php']
        });
        expect(tokens[1][1]).toEqual({
          value: 'test',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'variable.other.php']
        });
        expect(tokens[1][2]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
        });
        expect(tokens[1][3]).toEqual({
          value: '+=',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'keyword.operator.assignment.php']
        });
        expect(tokens[1][4]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
        });
        expect(tokens[1][5]).toEqual({
          value: '2',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'constant.numeric.php']
        });
        expect(tokens[1][6]).toEqual({
          value: ';',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'punctuation.terminator.expression.php']
        });
      });

      it('should tokenize -= correctly', function () {
        var tokens = grammar.tokenizeLines('<?hh\n$test -= 2;');
        expect(tokens[1][0]).toEqual({
          value: '$',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'variable.other.php', 'punctuation.definition.variable.php']
        });
        expect(tokens[1][1]).toEqual({
          value: 'test',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'variable.other.php']
        });
        expect(tokens[1][2]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
        });
        expect(tokens[1][3]).toEqual({
          value: '-=',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'keyword.operator.assignment.php']
        });
        expect(tokens[1][4]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
        });
        expect(tokens[1][5]).toEqual({
          value: '2',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'constant.numeric.php']
        });
        expect(tokens[1][6]).toEqual({
          value: ';',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'punctuation.terminator.expression.php']
        });
      });

      it('should tokenize *= correctly', function () {
        var tokens = grammar.tokenizeLines('<?hh\n$test *= 2;');
        expect(tokens[1][0]).toEqual({
          value: '$',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'variable.other.php', 'punctuation.definition.variable.php']
        });
        expect(tokens[1][1]).toEqual({
          value: 'test',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'variable.other.php']
        });
        expect(tokens[1][2]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
        });
        expect(tokens[1][3]).toEqual({
          value: '*=',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'keyword.operator.assignment.php']
        });
        expect(tokens[1][4]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
        });
        expect(tokens[1][5]).toEqual({
          value: '2',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'constant.numeric.php']
        });
        expect(tokens[1][6]).toEqual({
          value: ';',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'punctuation.terminator.expression.php']
        });
      });

      it('should tokenize /= correctly', function () {
        var tokens = grammar.tokenizeLines('<?hh\n$test /= 2;');
        expect(tokens[1][0]).toEqual({
          value: '$',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'variable.other.php', 'punctuation.definition.variable.php']
        });
        expect(tokens[1][1]).toEqual({
          value: 'test',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'variable.other.php']
        });
        expect(tokens[1][2]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
        });
        expect(tokens[1][3]).toEqual({
          value: '/=',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'keyword.operator.assignment.php']
        });
        expect(tokens[1][4]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
        });
        expect(tokens[1][5]).toEqual({
          value: '2',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'constant.numeric.php']
        });
        expect(tokens[1][6]).toEqual({
          value: ';',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'punctuation.terminator.expression.php']
        });
      });

      it('should tokenize %= correctly', function () {
        var tokens = grammar.tokenizeLines('<?hh\n$test %= 2;');
        expect(tokens[1][0]).toEqual({
          value: '$',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'variable.other.php', 'punctuation.definition.variable.php']
        });
        expect(tokens[1][1]).toEqual({
          value: 'test',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'variable.other.php']
        });
        expect(tokens[1][2]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
        });
        expect(tokens[1][3]).toEqual({
          value: '%=',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'keyword.operator.assignment.php']
        });
        expect(tokens[1][4]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
        });
        expect(tokens[1][5]).toEqual({
          value: '2',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'constant.numeric.php']
        });
        expect(tokens[1][6]).toEqual({
          value: ';',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'punctuation.terminator.expression.php']
        });
      });

      it('should tokenize .= correctly', function () {
        var tokens = grammar.tokenizeLines('<?hh\n$test .= 2;');
        expect(tokens[1][0]).toEqual({
          value: '$',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'variable.other.php', 'punctuation.definition.variable.php']
        });
        expect(tokens[1][1]).toEqual({
          value: 'test',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'variable.other.php']
        });
        expect(tokens[1][2]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
        });
        expect(tokens[1][3]).toEqual({
          value: '.=',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'keyword.operator.string.php']
        });
        expect(tokens[1][4]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
        });
        expect(tokens[1][5]).toEqual({
          value: '2',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'constant.numeric.php']
        });
        expect(tokens[1][6]).toEqual({
          value: ';',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'punctuation.terminator.expression.php']
        });
      });

      it('should tokenize &= correctly', function () {
        var tokens = grammar.tokenizeLines('<?hh\n$test &= 2;');
        expect(tokens[1][0]).toEqual({
          value: '$',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'variable.other.php', 'punctuation.definition.variable.php']
        });
        expect(tokens[1][1]).toEqual({
          value: 'test',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'variable.other.php']
        });
        expect(tokens[1][2]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
        });
        expect(tokens[1][3]).toEqual({
          value: '&=',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'keyword.operator.assignment.php']
        });
        expect(tokens[1][4]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
        });
        expect(tokens[1][5]).toEqual({
          value: '2',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'constant.numeric.php']
        });
        expect(tokens[1][6]).toEqual({
          value: ';',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'punctuation.terminator.expression.php']
        });
      });

      it('should tokenize |= correctly', function () {
        var tokens = grammar.tokenizeLines('<?hh\n$test |= 2;');
        expect(tokens[1][0]).toEqual({
          value: '$',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'variable.other.php', 'punctuation.definition.variable.php']
        });
        expect(tokens[1][1]).toEqual({
          value: 'test',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'variable.other.php']
        });
        expect(tokens[1][2]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
        });
        expect(tokens[1][3]).toEqual({
          value: '|=',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'keyword.operator.assignment.php']
        });
        expect(tokens[1][4]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
        });
        expect(tokens[1][5]).toEqual({
          value: '2',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'constant.numeric.php']
        });
        expect(tokens[1][6]).toEqual({
          value: ';',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'punctuation.terminator.expression.php']
        });
      });

      it('should tokenize ^= correctly', function () {
        var tokens = grammar.tokenizeLines('<?hh\n$test ^= 2;');
        expect(tokens[1][0]).toEqual({
          value: '$',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'variable.other.php', 'punctuation.definition.variable.php']
        });
        expect(tokens[1][1]).toEqual({
          value: 'test',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'variable.other.php']
        });
        expect(tokens[1][2]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
        });
        expect(tokens[1][3]).toEqual({
          value: '^=',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'keyword.operator.assignment.php']
        });
        expect(tokens[1][4]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
        });
        expect(tokens[1][5]).toEqual({
          value: '2',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'constant.numeric.php']
        });
        expect(tokens[1][6]).toEqual({
          value: ';',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'punctuation.terminator.expression.php']
        });
      });

      it('should tokenize <<= correctly', function () {
        var tokens = grammar.tokenizeLines('<?hh\n$test <<= 2;');
        expect(tokens[1][0]).toEqual({
          value: '$',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'variable.other.php', 'punctuation.definition.variable.php']
        });
        expect(tokens[1][1]).toEqual({
          value: 'test',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'variable.other.php']
        });
        expect(tokens[1][2]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
        });
        expect(tokens[1][3]).toEqual({
          value: '<<=',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'keyword.operator.assignment.php']
        });
        expect(tokens[1][4]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
        });
        expect(tokens[1][5]).toEqual({
          value: '2',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'constant.numeric.php']
        });
        expect(tokens[1][6]).toEqual({
          value: ';',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'punctuation.terminator.expression.php']
        });
      });

      it('should tokenize >>= correctly', function () {
        var tokens = grammar.tokenizeLines('<?hh\n$test >>= 2;');
        expect(tokens[1][0]).toEqual({
          value: '$',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'variable.other.php', 'punctuation.definition.variable.php']
        });
        expect(tokens[1][1]).toEqual({
          value: 'test',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'variable.other.php']
        });
        expect(tokens[1][2]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
        });
        expect(tokens[1][3]).toEqual({
          value: '>>=',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'keyword.operator.assignment.php']
        });
        expect(tokens[1][4]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
        });
        expect(tokens[1][5]).toEqual({
          value: '2',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'constant.numeric.php']
        });
        expect(tokens[1][6]).toEqual({
          value: ';',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'punctuation.terminator.expression.php']
        });
      });

      xit('should tokenize namespace at the same line as <?hh', function () {
        var tokens = grammar.tokenizeLines('<?hh namespace Test;');
        expect(tokens[0][1]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.namespace.php']
        });
        expect(tokens[0][2]).toEqual({
          value: 'namespace',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.namespace.php', 'keyword.other.namespace.php']
        });
        expect(tokens[0][3]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.namespace.php']
        });
        expect(tokens[0][4]).toEqual({
          value: 'Test',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.namespace.php', 'entity.name.type.namespace.php']
        });
        expect(tokens[0][5]).toEqual({
          value: ';',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'punctuation.terminator.expression.php']
        });
      });

      it('should tokenize namespace correctly', function () {
        var tokens = grammar.tokenizeLines('<?hh\nnamespace Test;');
        expect(tokens[1][0]).toEqual({
          value: 'namespace',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.namespace.php', 'keyword.other.namespace.php']
        });
        expect(tokens[1][1]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.namespace.php']
        });
        expect(tokens[1][2]).toEqual({
          value: 'Test',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.namespace.php', 'entity.name.type.namespace.php']
        });
        expect(tokens[1][3]).toEqual({
          value: ';',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'punctuation.terminator.expression.php']
        });
      });

      it('should tokenize default array type with old array value correctly', function () {
        var tokens = grammar.tokenizeLines('<?hh\nfunction array_test(array $value = array()) {}');
        expect(tokens[1][0]).toEqual({
          value: 'function',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.function.php', 'storage.type.function.php']
        });
        expect(tokens[1][1]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.function.php']
        });
        expect(tokens[1][2]).toEqual({
          value: 'array_test',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.function.php', 'entity.name.function.php']
        });
        expect(tokens[1][3]).toEqual({
          value: '(',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.function.php', 'punctuation.definition.parameters.begin.php']
        });
        expect(tokens[1][4]).toEqual({
          value: 'array',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php', 'storage.type.php']
        });
        expect(tokens[1][5]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php']
        });
        expect(tokens[1][6]).toEqual({
          value: '$',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php', 'variable.other.php', 'punctuation.definition.variable.php']
        });
        expect(tokens[1][7]).toEqual({
          value: 'value',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php', 'variable.other.php']
        });
        expect(tokens[1][8]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php']
        });
        expect(tokens[1][9]).toEqual({
          value: '=',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php', 'keyword.operator.assignment.php']
        });
        expect(tokens[1][10]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php']
        });
        expect(tokens[1][11]).toEqual({
          value: 'array',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php', 'support.function.construct.php']
        });
        expect(tokens[1][12]).toEqual({
          value: '(',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php', 'punctuation.definition.array.begin.php']
        });
        expect(tokens[1][13]).toEqual({
          value: ')',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.array.php', 'punctuation.definition.array.end.php']
        });
        expect(tokens[1][14]).toEqual({
          value: ')',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.function.php', 'punctuation.definition.parameters.end.php']
        });
        expect(tokens[1][15]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
        });
        expect(tokens[1][16]).toEqual({
          value: '{',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'punctuation.section.scope.begin.php']
        });
        expect(tokens[1][17]).toEqual({
          value: '}',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'punctuation.section.scope.end.php']
        });
      });

      it('should tokenize default array type with short array value correctly', function () {
        var tokens = grammar.tokenizeLines('<?hh\nfunction array_test(array $value = []) {}');
        expect(tokens[1][0]).toEqual({
          value: 'function',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.function.php', 'storage.type.function.php']
        });
        expect(tokens[1][1]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.function.php']
        });
        expect(tokens[1][2]).toEqual({
          value: 'array_test',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.function.php', 'entity.name.function.php']
        });
        expect(tokens[1][3]).toEqual({
          value: '(',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.function.php', 'punctuation.definition.parameters.begin.php']
        });
        expect(tokens[1][4]).toEqual({
          value: 'array',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.short.array.php', 'storage.type.php']
        });
        expect(tokens[1][5]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.short.array.php']
        });
        expect(tokens[1][6]).toEqual({
          value: '$',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.short.array.php', 'variable.other.php', 'punctuation.definition.variable.php']
        });
        expect(tokens[1][7]).toEqual({
          value: 'value',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.short.array.php', 'variable.other.php']
        });
        expect(tokens[1][8]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.short.array.php']
        });
        expect(tokens[1][9]).toEqual({
          value: '=',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.short.array.php']
        });
        expect(tokens[1][10]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.short.array.php']
        });
        expect(tokens[1][11]).toEqual({
          value: '[',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.short.array.php', 'punctuation.definition.short.array.begin.php']
        });
        expect(tokens[1][12]).toEqual({
          value: ']',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.function.php', 'meta.function.arguments.php', 'meta.function.argument.short.array.php', 'punctuation.definition.short.array.end.php']
        });
        expect(tokens[1][13]).toEqual({
          value: ')',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'meta.function.php', 'punctuation.definition.parameters.end.php']
        });
        expect(tokens[1][14]).toEqual({
          value: ' ',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack']
        });
        expect(tokens[1][15]).toEqual({
          value: '{',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'punctuation.section.scope.begin.php']
        });
        expect(tokens[1][16]).toEqual({
          value: '}',
          scopes: ['text.html.hack', 'meta.embedded.block.php', 'source.hack', 'punctuation.section.scope.end.php']
        });
      });
    });
  });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWxhbmd1YWdlLWhhY2svc3BlYy9oYWNrLXNwZWMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7ZUFHTyxPQUFPLENBQUMsTUFBTSxDQUFDOztJQUE3QixVQUFVLFlBQVYsVUFBVTs7QUFFZixRQUFRLENBQUMsYUFBYSxFQUFFLFlBQU07QUFDNUIsTUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDOztBQUVuQixZQUFVLENBQUMsWUFBTTtBQUNmLG1CQUFlLENBQUM7YUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyx1QkFBdUIsQ0FBQztLQUFBLENBQUMsQ0FBQztBQUM5RSxRQUFJLENBQUM7YUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxnQkFBZ0IsQ0FBQztLQUFBLENBQUMsQ0FBQztHQUMzRSxDQUFDLENBQUM7O0FBRUgsSUFBRSxDQUFDLG9CQUFvQixFQUFFLFlBQU07QUFDN0IsVUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQzdCLFVBQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7R0FDbEQsQ0FBQyxDQUFDOztBQUVILFVBQVEsQ0FBQyxXQUFXLEVBQUUsWUFBTTtBQUMxQixNQUFFLENBQUMsNkJBQTZCLEVBQUUsWUFBTTtBQUN0QyxVQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLGtCQUFrQixDQUFDLENBQUM7QUFDdkQsWUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztBQUMzQixhQUFLLEVBQUUsR0FBRztBQUNWLGNBQU0sRUFBRSxDQUFDLGdCQUFnQixFQUFFLHlCQUF5QixFQUFFLGFBQWEsRUFBRSxvQkFBb0IsRUFBRSxx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LEVBQUUsQ0FBQyxnQkFBZ0IsRUFBRSx5QkFBeUIsRUFBRSxhQUFhLEVBQUUsbUNBQW1DLENBQUM7U0FDMUcsQ0FBQyxDQUFDO09BQ0osQ0FBQyxDQUFDO0tBQ0osQ0FBQyxDQUFDO0dBQ0osQ0FBQyxDQUFDO0NBQ0osQ0FBQyxDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWxhbmd1YWdlLWhhY2svc3BlYy9oYWNrLXNwZWMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbnZhciB7VGV4dEVkaXRvcn0gPSByZXF1aXJlKCdhdG9tJyk7XG5cbmRlc2NyaWJlKCdQSFAgZ3JhbW1hcicsICgpID0+IHtcbiAgdmFyIGdyYW1tYXIgPSBudWxsO1xuXG4gIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgIHdhaXRzRm9yUHJvbWlzZSgoKSA9PiBhdG9tLnBhY2thZ2VzLmFjdGl2YXRlUGFja2FnZSgnbnVjbGlkZS1sYW5ndWFnZS1oYWNrJykpO1xuICAgIHJ1bnMoKCkgPT4gZ3JhbW1hciA9IGF0b20uZ3JhbW1hcnMuZ3JhbW1hckZvclNjb3BlTmFtZSgndGV4dC5odG1sLmhhY2snKSk7XG4gIH0pO1xuXG4gIGl0KCdwYXJzZXMgdGhlIGdyYW1tYXInLCAoKSA9PiB7XG4gICAgZXhwZWN0KGdyYW1tYXIpLnRvQmVUcnV0aHkoKTtcbiAgICBleHBlY3QoZ3JhbW1hci5zY29wZU5hbWUpLnRvQmUoJ3RleHQuaHRtbC5oYWNrJyk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdvcGVyYXRvcnMnLCAoKSA9PiB7XG4gICAgaXQoJ3Nob3VsZCB0b2tlbml6ZSA9IGNvcnJlY3RseScsICgpID0+IHtcbiAgICAgIHZhciB0b2tlbnMgPSBncmFtbWFyLnRva2VuaXplTGluZXMoXCI8P2hoXFxuJHRlc3QgPSAyO1wiKTtcbiAgICAgIGV4cGVjdCh0b2tlbnNbMV1bMF0pLnRvRXF1YWwoe1xuICAgICAgICB2YWx1ZTogJyQnLFxuICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAndmFyaWFibGUub3RoZXIucGhwJywgJ3B1bmN0dWF0aW9uLmRlZmluaXRpb24udmFyaWFibGUucGhwJ11cbiAgICAgIH0pO1xuICAgICAgZXhwZWN0KHRva2Vuc1sxXVsyXSkudG9FcXVhbCh7XG4gICAgICAgIHZhbHVlOiAnICcsXG4gICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjayddXG4gICAgICB9KTtcbiAgICAgIGV4cGVjdCh0b2tlbnNbMV1bM10pLnRvRXF1YWwoe1xuICAgICAgICB2YWx1ZTogJz0nLFxuICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAna2V5d29yZC5vcGVyYXRvci5hc3NpZ25tZW50LnBocCddXG4gICAgICB9KTtcbiAgICAgIGV4cGVjdCh0b2tlbnNbMV1bNF0pLnRvRXF1YWwoe1xuICAgICAgICB2YWx1ZTogJyAnLFxuICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snXVxuICAgICAgfSk7XG4gICAgICBleHBlY3QodG9rZW5zWzFdWzVdKS50b0VxdWFsKHtcbiAgICAgICAgdmFsdWU6ICcyJyxcbiAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ2NvbnN0YW50Lm51bWVyaWMucGhwJ11cbiAgICAgIH0pO1xuICAgICAgZXhwZWN0KHRva2Vuc1sxXVs2XSkudG9FcXVhbCh7XG4gICAgICAgIHZhbHVlOiAnOycsXG4gICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdwdW5jdHVhdGlvbi50ZXJtaW5hdG9yLmV4cHJlc3Npb24ucGhwJ11cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB0b2tlbml6ZSArIGNvcnJlY3RseScsICgpID0+IHtcbiAgICAgIHZhciB0b2tlbnMgPSBncmFtbWFyLnRva2VuaXplTGluZXMoXCI8P2hoXFxuMSArIDI7XCIpO1xuICAgICAgZXhwZWN0KHRva2Vuc1sxXVswXSkudG9FcXVhbCh7XG4gICAgICAgIHZhbHVlOiAnMScsXG4gICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdjb25zdGFudC5udW1lcmljLnBocCddXG4gICAgICB9KTtcbiAgICAgIGV4cGVjdCh0b2tlbnNbMV1bMV0pLnRvRXF1YWwoe1xuICAgICAgICB2YWx1ZTogJyAnLFxuICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snXVxuICAgICAgfSk7XG4gICAgICBleHBlY3QodG9rZW5zWzFdWzJdKS50b0VxdWFsKHtcbiAgICAgICAgdmFsdWU6ICcrJyxcbiAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ2tleXdvcmQub3BlcmF0b3IuYXJpdGhtZXRpYy5waHAnXVxuICAgICAgfSk7XG4gICAgICBleHBlY3QodG9rZW5zWzFdWzNdKS50b0VxdWFsKHtcbiAgICAgICAgdmFsdWU6ICcgJyxcbiAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJ11cbiAgICAgIH0pO1xuICAgICAgZXhwZWN0KHRva2Vuc1sxXVs0XSkudG9FcXVhbCh7XG4gICAgICAgIHZhbHVlOiAnMicsXG4gICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdjb25zdGFudC5udW1lcmljLnBocCddXG4gICAgICB9KTtcbiAgICAgIGV4cGVjdCh0b2tlbnNbMV1bNV0pLnRvRXF1YWwoe1xuICAgICAgICB2YWx1ZTogJzsnLFxuICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAncHVuY3R1YXRpb24udGVybWluYXRvci5leHByZXNzaW9uLnBocCddXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdG9rZW5pemUgLSBjb3JyZWN0bHknLCAoKSA9PiB7XG4gICAgICB2YXIgdG9rZW5zID0gZ3JhbW1hci50b2tlbml6ZUxpbmVzKFwiPD9oaFxcbjEgLSAyO1wiKTtcbiAgICAgIGV4cGVjdCh0b2tlbnNbMV1bMF0pLnRvRXF1YWwoe1xuICAgICAgICB2YWx1ZTogJzEnLFxuICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAnY29uc3RhbnQubnVtZXJpYy5waHAnXVxuICAgICAgfSk7XG4gICAgICBleHBlY3QodG9rZW5zWzFdWzFdKS50b0VxdWFsKHtcbiAgICAgICAgdmFsdWU6ICcgJyxcbiAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJ11cbiAgICAgIH0pO1xuICAgICAgZXhwZWN0KHRva2Vuc1sxXVsyXSkudG9FcXVhbCh7XG4gICAgICAgIHZhbHVlOiAnLScsXG4gICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdrZXl3b3JkLm9wZXJhdG9yLmFyaXRobWV0aWMucGhwJ11cbiAgICAgIH0pO1xuICAgICAgZXhwZWN0KHRva2Vuc1sxXVszXSkudG9FcXVhbCh7XG4gICAgICAgIHZhbHVlOiAnICcsXG4gICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjayddXG4gICAgICB9KTtcbiAgICAgIGV4cGVjdCh0b2tlbnNbMV1bNF0pLnRvRXF1YWwoe1xuICAgICAgICB2YWx1ZTogJzInLFxuICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAnY29uc3RhbnQubnVtZXJpYy5waHAnXVxuICAgICAgfSk7XG4gICAgICBleHBlY3QodG9rZW5zWzFdWzVdKS50b0VxdWFsKHtcbiAgICAgICAgdmFsdWU6ICc7JyxcbiAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ3B1bmN0dWF0aW9uLnRlcm1pbmF0b3IuZXhwcmVzc2lvbi5waHAnXVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBpdCgnc2hvdWxkIHRva2VuaXplICogY29ycmVjdGx5JywgKCkgPT4ge1xuICAgICAgdmFyIHRva2VucyA9IGdyYW1tYXIudG9rZW5pemVMaW5lcyhcIjw/aGhcXG4xICogMjtcIik7XG4gICAgICBleHBlY3QodG9rZW5zWzFdWzBdKS50b0VxdWFsKHtcbiAgICAgICAgdmFsdWU6ICcxJyxcbiAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ2NvbnN0YW50Lm51bWVyaWMucGhwJ11cbiAgICAgIH0pO1xuICAgICAgZXhwZWN0KHRva2Vuc1sxXVsxXSkudG9FcXVhbCh7XG4gICAgICAgIHZhbHVlOiAnICcsXG4gICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjayddXG4gICAgICB9KTtcbiAgICAgIGV4cGVjdCh0b2tlbnNbMV1bMl0pLnRvRXF1YWwoe1xuICAgICAgICB2YWx1ZTogJyonLFxuICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAna2V5d29yZC5vcGVyYXRvci5hcml0aG1ldGljLnBocCddXG4gICAgICB9KTtcbiAgICAgIGV4cGVjdCh0b2tlbnNbMV1bM10pLnRvRXF1YWwoe1xuICAgICAgICB2YWx1ZTogJyAnLFxuICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snXVxuICAgICAgfSk7XG4gICAgICBleHBlY3QodG9rZW5zWzFdWzRdKS50b0VxdWFsKHtcbiAgICAgICAgdmFsdWU6ICcyJyxcbiAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ2NvbnN0YW50Lm51bWVyaWMucGhwJ11cbiAgICAgIH0pO1xuICAgICAgZXhwZWN0KHRva2Vuc1sxXVs1XSkudG9FcXVhbCh7XG4gICAgICAgIHZhbHVlOiAnOycsXG4gICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdwdW5jdHVhdGlvbi50ZXJtaW5hdG9yLmV4cHJlc3Npb24ucGhwJ11cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ3Nob3VsZCB0b2tlbml6ZSAvIGNvcnJlY3RseScsICgpID0+IHtcbiAgICAgIHZhciB0b2tlbnMgPSBncmFtbWFyLnRva2VuaXplTGluZXMoXCI8P2hoXFxuMSAvIDI7XCIpO1xuICAgICAgZXhwZWN0KHRva2Vuc1sxXVswXSkudG9FcXVhbCh7XG4gICAgICAgIHZhbHVlOiAnMScsXG4gICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdjb25zdGFudC5udW1lcmljLnBocCddXG4gICAgICB9KTtcbiAgICAgIGV4cGVjdCh0b2tlbnNbMV1bMV0pLnRvRXF1YWwoe1xuICAgICAgICB2YWx1ZTogJyAnLFxuICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snXVxuICAgICAgfSk7XG4gICAgICBleHBlY3QodG9rZW5zWzFdWzJdKS50b0VxdWFsKHtcbiAgICAgICAgdmFsdWU6ICcvJyxcbiAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ2tleXdvcmQub3BlcmF0b3IuYXJpdGhtZXRpYy5waHAnXVxuICAgICAgfSk7XG4gICAgICBleHBlY3QodG9rZW5zWzFdWzNdKS50b0VxdWFsKHtcbiAgICAgICAgdmFsdWU6ICcgJyxcbiAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJ11cbiAgICAgIH0pO1xuICAgICAgZXhwZWN0KHRva2Vuc1sxXVs0XSkudG9FcXVhbCh7XG4gICAgICAgIHZhbHVlOiAnMicsXG4gICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdjb25zdGFudC5udW1lcmljLnBocCddXG4gICAgICB9KTtcbiAgICAgIGV4cGVjdCh0b2tlbnNbMV1bNV0pLnRvRXF1YWwoe1xuICAgICAgICB2YWx1ZTogJzsnLFxuICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAncHVuY3R1YXRpb24udGVybWluYXRvci5leHByZXNzaW9uLnBocCddXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGl0KCdzaG91bGQgdG9rZW5pemUgJSBjb3JyZWN0bHknLCAoKSA9PiB7XG4gICAgICB2YXIgdG9rZW5zID0gZ3JhbW1hci50b2tlbml6ZUxpbmVzKFwiPD9oaFxcbjEgJSAyO1wiKTtcbiAgICAgIGV4cGVjdCh0b2tlbnNbMV1bMF0pLnRvRXF1YWwoe1xuICAgICAgICB2YWx1ZTogJzEnLFxuICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAnY29uc3RhbnQubnVtZXJpYy5waHAnXVxuICAgICAgfSk7XG4gICAgICBleHBlY3QodG9rZW5zWzFdWzFdKS50b0VxdWFsKHtcbiAgICAgICAgdmFsdWU6ICcgJyxcbiAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJ11cbiAgICAgIH0pO1xuICAgICAgZXhwZWN0KHRva2Vuc1sxXVsyXSkudG9FcXVhbCh7XG4gICAgICAgIHZhbHVlOiAnJScsXG4gICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdrZXl3b3JkLm9wZXJhdG9yLmFyaXRobWV0aWMucGhwJ11cbiAgICAgIH0pO1xuICAgICAgZXhwZWN0KHRva2Vuc1sxXVszXSkudG9FcXVhbCh7XG4gICAgICAgIHZhbHVlOiAnICcsXG4gICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjayddXG4gICAgICB9KTtcbiAgICAgIGV4cGVjdCh0b2tlbnNbMV1bNF0pLnRvRXF1YWwoe1xuICAgICAgICB2YWx1ZTogJzInLFxuICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAnY29uc3RhbnQubnVtZXJpYy5waHAnXVxuICAgICAgfSk7XG4gICAgICBleHBlY3QodG9rZW5zWzFdWzVdKS50b0VxdWFsKHtcbiAgICAgICAgdmFsdWU6ICc7JyxcbiAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ3B1bmN0dWF0aW9uLnRlcm1pbmF0b3IuZXhwcmVzc2lvbi5waHAnXVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnY29tYmluZWQgb3BlcmF0b3JzJywgKCkgPT4ge1xuICAgICAgaXQoJ3Nob3VsZCB0b2tlbml6ZSArPSBjb3JyZWN0bHknLCAoKSA9PiB7XG4gICAgICAgIHZhciB0b2tlbnMgPSBncmFtbWFyLnRva2VuaXplTGluZXMoXCI8P2hoXFxuJHRlc3QgKz0gMjtcIik7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bMF0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnJCcsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ3ZhcmlhYmxlLm90aGVyLnBocCcsICdwdW5jdHVhdGlvbi5kZWZpbml0aW9uLnZhcmlhYmxlLnBocCddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzFdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJ3Rlc3QnLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICd2YXJpYWJsZS5vdGhlci5waHAnXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVsyXSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICcgJyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVszXSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICcrPScsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ2tleXdvcmQub3BlcmF0b3IuYXNzaWdubWVudC5waHAnXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVs0XSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICcgJyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVs1XSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICcyJyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAnY29uc3RhbnQubnVtZXJpYy5waHAnXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVs2XSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICc7JyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAncHVuY3R1YXRpb24udGVybWluYXRvci5leHByZXNzaW9uLnBocCddXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgdG9rZW5pemUgLT0gY29ycmVjdGx5JywgKCkgPT4ge1xuICAgICAgICB2YXIgdG9rZW5zID0gZ3JhbW1hci50b2tlbml6ZUxpbmVzKFwiPD9oaFxcbiR0ZXN0IC09IDI7XCIpO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzBdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJyQnLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICd2YXJpYWJsZS5vdGhlci5waHAnLCAncHVuY3R1YXRpb24uZGVmaW5pdGlvbi52YXJpYWJsZS5waHAnXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVsxXSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICd0ZXN0JyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAndmFyaWFibGUub3RoZXIucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bMl0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnICcsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bM10pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnLT0nLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdrZXl3b3JkLm9wZXJhdG9yLmFzc2lnbm1lbnQucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bNF0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnICcsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bNV0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnMicsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ2NvbnN0YW50Lm51bWVyaWMucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bNl0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnOycsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ3B1bmN0dWF0aW9uLnRlcm1pbmF0b3IuZXhwcmVzc2lvbi5waHAnXVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIHRva2VuaXplICo9IGNvcnJlY3RseScsICgpID0+IHtcbiAgICAgICAgdmFyIHRva2VucyA9IGdyYW1tYXIudG9rZW5pemVMaW5lcyhcIjw/aGhcXG4kdGVzdCAqPSAyO1wiKTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVswXSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICckJyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAndmFyaWFibGUub3RoZXIucGhwJywgJ3B1bmN0dWF0aW9uLmRlZmluaXRpb24udmFyaWFibGUucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bMV0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAndGVzdCcsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ3ZhcmlhYmxlLm90aGVyLnBocCddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzJdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJyAnLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjayddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzNdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJyo9JyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAna2V5d29yZC5vcGVyYXRvci5hc3NpZ25tZW50LnBocCddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzRdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJyAnLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjayddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzVdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJzInLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdjb25zdGFudC5udW1lcmljLnBocCddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzZdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJzsnLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdwdW5jdHVhdGlvbi50ZXJtaW5hdG9yLmV4cHJlc3Npb24ucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCB0b2tlbml6ZSAvPSBjb3JyZWN0bHknLCAoKSA9PiB7XG4gICAgICAgIHZhciB0b2tlbnMgPSBncmFtbWFyLnRva2VuaXplTGluZXMoXCI8P2hoXFxuJHRlc3QgLz0gMjtcIik7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bMF0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnJCcsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ3ZhcmlhYmxlLm90aGVyLnBocCcsICdwdW5jdHVhdGlvbi5kZWZpbml0aW9uLnZhcmlhYmxlLnBocCddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzFdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJ3Rlc3QnLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICd2YXJpYWJsZS5vdGhlci5waHAnXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVsyXSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICcgJyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVszXSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICcvPScsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ2tleXdvcmQub3BlcmF0b3IuYXNzaWdubWVudC5waHAnXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVs0XSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICcgJyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVs1XSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICcyJyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAnY29uc3RhbnQubnVtZXJpYy5waHAnXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVs2XSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICc7JyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAncHVuY3R1YXRpb24udGVybWluYXRvci5leHByZXNzaW9uLnBocCddXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgdG9rZW5pemUgJT0gY29ycmVjdGx5JywgKCkgPT4ge1xuICAgICAgICB2YXIgdG9rZW5zID0gZ3JhbW1hci50b2tlbml6ZUxpbmVzKFwiPD9oaFxcbiR0ZXN0ICU9IDI7XCIpO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzBdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJyQnLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICd2YXJpYWJsZS5vdGhlci5waHAnLCAncHVuY3R1YXRpb24uZGVmaW5pdGlvbi52YXJpYWJsZS5waHAnXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVsxXSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICd0ZXN0JyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAndmFyaWFibGUub3RoZXIucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bMl0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnICcsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bM10pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnJT0nLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdrZXl3b3JkLm9wZXJhdG9yLmFzc2lnbm1lbnQucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bNF0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnICcsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bNV0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnMicsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ2NvbnN0YW50Lm51bWVyaWMucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bNl0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnOycsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ3B1bmN0dWF0aW9uLnRlcm1pbmF0b3IuZXhwcmVzc2lvbi5waHAnXVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIHRva2VuaXplIC49IGNvcnJlY3RseScsICgpID0+IHtcbiAgICAgICAgdmFyIHRva2VucyA9IGdyYW1tYXIudG9rZW5pemVMaW5lcyhcIjw/aGhcXG4kdGVzdCAuPSAyO1wiKTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVswXSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICckJyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAndmFyaWFibGUub3RoZXIucGhwJywgJ3B1bmN0dWF0aW9uLmRlZmluaXRpb24udmFyaWFibGUucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bMV0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAndGVzdCcsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ3ZhcmlhYmxlLm90aGVyLnBocCddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzJdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJyAnLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjayddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzNdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJy49JyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAna2V5d29yZC5vcGVyYXRvci5zdHJpbmcucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bNF0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnICcsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bNV0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnMicsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ2NvbnN0YW50Lm51bWVyaWMucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bNl0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnOycsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ3B1bmN0dWF0aW9uLnRlcm1pbmF0b3IuZXhwcmVzc2lvbi5waHAnXVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIHRva2VuaXplICY9IGNvcnJlY3RseScsICgpID0+IHtcbiAgICAgICAgdmFyIHRva2VucyA9IGdyYW1tYXIudG9rZW5pemVMaW5lcyhcIjw/aGhcXG4kdGVzdCAmPSAyO1wiKTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVswXSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICckJyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAndmFyaWFibGUub3RoZXIucGhwJywgJ3B1bmN0dWF0aW9uLmRlZmluaXRpb24udmFyaWFibGUucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bMV0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAndGVzdCcsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ3ZhcmlhYmxlLm90aGVyLnBocCddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzJdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJyAnLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjayddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzNdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJyY9JyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAna2V5d29yZC5vcGVyYXRvci5hc3NpZ25tZW50LnBocCddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzRdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJyAnLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjayddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzVdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJzInLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdjb25zdGFudC5udW1lcmljLnBocCddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzZdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJzsnLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdwdW5jdHVhdGlvbi50ZXJtaW5hdG9yLmV4cHJlc3Npb24ucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCB0b2tlbml6ZSB8PSBjb3JyZWN0bHknLCAoKSA9PiB7XG4gICAgICAgIHZhciB0b2tlbnMgPSBncmFtbWFyLnRva2VuaXplTGluZXMoXCI8P2hoXFxuJHRlc3QgfD0gMjtcIik7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bMF0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnJCcsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ3ZhcmlhYmxlLm90aGVyLnBocCcsICdwdW5jdHVhdGlvbi5kZWZpbml0aW9uLnZhcmlhYmxlLnBocCddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzFdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJ3Rlc3QnLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICd2YXJpYWJsZS5vdGhlci5waHAnXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVsyXSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICcgJyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVszXSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICd8PScsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ2tleXdvcmQub3BlcmF0b3IuYXNzaWdubWVudC5waHAnXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVs0XSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICcgJyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVs1XSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICcyJyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAnY29uc3RhbnQubnVtZXJpYy5waHAnXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVs2XSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICc7JyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAncHVuY3R1YXRpb24udGVybWluYXRvci5leHByZXNzaW9uLnBocCddXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgdG9rZW5pemUgXj0gY29ycmVjdGx5JywgKCkgPT4ge1xuICAgICAgICB2YXIgdG9rZW5zID0gZ3JhbW1hci50b2tlbml6ZUxpbmVzKFwiPD9oaFxcbiR0ZXN0IF49IDI7XCIpO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzBdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJyQnLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICd2YXJpYWJsZS5vdGhlci5waHAnLCAncHVuY3R1YXRpb24uZGVmaW5pdGlvbi52YXJpYWJsZS5waHAnXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVsxXSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICd0ZXN0JyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAndmFyaWFibGUub3RoZXIucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bMl0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnICcsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bM10pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnXj0nLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdrZXl3b3JkLm9wZXJhdG9yLmFzc2lnbm1lbnQucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bNF0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnICcsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bNV0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnMicsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ2NvbnN0YW50Lm51bWVyaWMucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bNl0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnOycsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ3B1bmN0dWF0aW9uLnRlcm1pbmF0b3IuZXhwcmVzc2lvbi5waHAnXVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIHRva2VuaXplIDw8PSBjb3JyZWN0bHknLCAoKSA9PiB7XG4gICAgICAgIHZhciB0b2tlbnMgPSBncmFtbWFyLnRva2VuaXplTGluZXMoXCI8P2hoXFxuJHRlc3QgPDw9IDI7XCIpO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzBdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJyQnLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICd2YXJpYWJsZS5vdGhlci5waHAnLCAncHVuY3R1YXRpb24uZGVmaW5pdGlvbi52YXJpYWJsZS5waHAnXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVsxXSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICd0ZXN0JyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAndmFyaWFibGUub3RoZXIucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bMl0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnICcsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bM10pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnPDw9JyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAna2V5d29yZC5vcGVyYXRvci5hc3NpZ25tZW50LnBocCddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzRdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJyAnLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjayddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzVdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJzInLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdjb25zdGFudC5udW1lcmljLnBocCddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzZdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJzsnLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdwdW5jdHVhdGlvbi50ZXJtaW5hdG9yLmV4cHJlc3Npb24ucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCB0b2tlbml6ZSA+Pj0gY29ycmVjdGx5JywgKCkgPT4ge1xuICAgICAgICB2YXIgdG9rZW5zID0gZ3JhbW1hci50b2tlbml6ZUxpbmVzKFwiPD9oaFxcbiR0ZXN0ID4+PSAyO1wiKTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVswXSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICckJyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAndmFyaWFibGUub3RoZXIucGhwJywgJ3B1bmN0dWF0aW9uLmRlZmluaXRpb24udmFyaWFibGUucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bMV0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAndGVzdCcsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ3ZhcmlhYmxlLm90aGVyLnBocCddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzJdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJyAnLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjayddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzNdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJz4+PScsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ2tleXdvcmQub3BlcmF0b3IuYXNzaWdubWVudC5waHAnXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVs0XSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICcgJyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVs1XSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICcyJyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAnY29uc3RhbnQubnVtZXJpYy5waHAnXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVs2XSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICc7JyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAncHVuY3R1YXRpb24udGVybWluYXRvci5leHByZXNzaW9uLnBocCddXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIHhpdCgnc2hvdWxkIHRva2VuaXplIG5hbWVzcGFjZSBhdCB0aGUgc2FtZSBsaW5lIGFzIDw/aGgnLCAoKSA9PiB7XG4gICAgICAgIHZhciB0b2tlbnMgPSBncmFtbWFyLnRva2VuaXplTGluZXMoXCI8P2hoIG5hbWVzcGFjZSBUZXN0O1wiKTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1swXVsxXSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICcgJyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAnbWV0YS5uYW1lc3BhY2UucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMF1bMl0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnbmFtZXNwYWNlJyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAnbWV0YS5uYW1lc3BhY2UucGhwJywgJ2tleXdvcmQub3RoZXIubmFtZXNwYWNlLnBocCddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzBdWzNdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJyAnLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdtZXRhLm5hbWVzcGFjZS5waHAnXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1swXVs0XSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICdUZXN0JyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAnbWV0YS5uYW1lc3BhY2UucGhwJywgJ2VudGl0eS5uYW1lLnR5cGUubmFtZXNwYWNlLnBocCddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzBdWzVdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJzsnLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdwdW5jdHVhdGlvbi50ZXJtaW5hdG9yLmV4cHJlc3Npb24ucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCB0b2tlbml6ZSBuYW1lc3BhY2UgY29ycmVjdGx5JywgKCkgPT4ge1xuICAgICAgICB2YXIgdG9rZW5zID0gZ3JhbW1hci50b2tlbml6ZUxpbmVzKFwiPD9oaFxcbm5hbWVzcGFjZSBUZXN0O1wiKTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVswXSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICduYW1lc3BhY2UnLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdtZXRhLm5hbWVzcGFjZS5waHAnLCAna2V5d29yZC5vdGhlci5uYW1lc3BhY2UucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bMV0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnICcsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ21ldGEubmFtZXNwYWNlLnBocCddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzJdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJ1Rlc3QnLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdtZXRhLm5hbWVzcGFjZS5waHAnLCAnZW50aXR5Lm5hbWUudHlwZS5uYW1lc3BhY2UucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bM10pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnOycsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ3B1bmN0dWF0aW9uLnRlcm1pbmF0b3IuZXhwcmVzc2lvbi5waHAnXVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIHRva2VuaXplIGRlZmF1bHQgYXJyYXkgdHlwZSB3aXRoIG9sZCBhcnJheSB2YWx1ZSBjb3JyZWN0bHknLCAoKSA9PiB7XG4gICAgICAgIHZhciB0b2tlbnMgPSBncmFtbWFyLnRva2VuaXplTGluZXMoXCI8P2hoXFxuZnVuY3Rpb24gYXJyYXlfdGVzdChhcnJheSAkdmFsdWUgPSBhcnJheSgpKSB7fVwiKTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVswXSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICdmdW5jdGlvbicsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ21ldGEuZnVuY3Rpb24ucGhwJywgJ3N0b3JhZ2UudHlwZS5mdW5jdGlvbi5waHAnXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVsxXSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICcgJyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAnbWV0YS5mdW5jdGlvbi5waHAnXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVsyXSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICdhcnJheV90ZXN0JyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAnbWV0YS5mdW5jdGlvbi5waHAnLCAnZW50aXR5Lm5hbWUuZnVuY3Rpb24ucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bM10pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnKCcsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ21ldGEuZnVuY3Rpb24ucGhwJywgJ3B1bmN0dWF0aW9uLmRlZmluaXRpb24ucGFyYW1ldGVycy5iZWdpbi5waHAnXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVs0XSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICdhcnJheScsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ21ldGEuZnVuY3Rpb24ucGhwJywgJ21ldGEuZnVuY3Rpb24uYXJndW1lbnRzLnBocCcsICdtZXRhLmZ1bmN0aW9uLmFyZ3VtZW50LmFycmF5LnBocCcsICdzdG9yYWdlLnR5cGUucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bNV0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnICcsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ21ldGEuZnVuY3Rpb24ucGhwJywgJ21ldGEuZnVuY3Rpb24uYXJndW1lbnRzLnBocCcsICdtZXRhLmZ1bmN0aW9uLmFyZ3VtZW50LmFycmF5LnBocCddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzZdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJyQnLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdtZXRhLmZ1bmN0aW9uLnBocCcsICdtZXRhLmZ1bmN0aW9uLmFyZ3VtZW50cy5waHAnLCAnbWV0YS5mdW5jdGlvbi5hcmd1bWVudC5hcnJheS5waHAnLCAndmFyaWFibGUub3RoZXIucGhwJywgJ3B1bmN0dWF0aW9uLmRlZmluaXRpb24udmFyaWFibGUucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bN10pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAndmFsdWUnLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdtZXRhLmZ1bmN0aW9uLnBocCcsICdtZXRhLmZ1bmN0aW9uLmFyZ3VtZW50cy5waHAnLCAnbWV0YS5mdW5jdGlvbi5hcmd1bWVudC5hcnJheS5waHAnLCAndmFyaWFibGUub3RoZXIucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bOF0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnICcsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ21ldGEuZnVuY3Rpb24ucGhwJywgJ21ldGEuZnVuY3Rpb24uYXJndW1lbnRzLnBocCcsICdtZXRhLmZ1bmN0aW9uLmFyZ3VtZW50LmFycmF5LnBocCddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzldKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJz0nLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdtZXRhLmZ1bmN0aW9uLnBocCcsICdtZXRhLmZ1bmN0aW9uLmFyZ3VtZW50cy5waHAnLCAnbWV0YS5mdW5jdGlvbi5hcmd1bWVudC5hcnJheS5waHAnLCAna2V5d29yZC5vcGVyYXRvci5hc3NpZ25tZW50LnBocCddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzEwXSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICcgJyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAnbWV0YS5mdW5jdGlvbi5waHAnLCAnbWV0YS5mdW5jdGlvbi5hcmd1bWVudHMucGhwJywgJ21ldGEuZnVuY3Rpb24uYXJndW1lbnQuYXJyYXkucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bMTFdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJ2FycmF5JyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAnbWV0YS5mdW5jdGlvbi5waHAnLCAnbWV0YS5mdW5jdGlvbi5hcmd1bWVudHMucGhwJywgJ21ldGEuZnVuY3Rpb24uYXJndW1lbnQuYXJyYXkucGhwJywgJ3N1cHBvcnQuZnVuY3Rpb24uY29uc3RydWN0LnBocCddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzEyXSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICcoJyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAnbWV0YS5mdW5jdGlvbi5waHAnLCAnbWV0YS5mdW5jdGlvbi5hcmd1bWVudHMucGhwJywgJ21ldGEuZnVuY3Rpb24uYXJndW1lbnQuYXJyYXkucGhwJywgJ3B1bmN0dWF0aW9uLmRlZmluaXRpb24uYXJyYXkuYmVnaW4ucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bMTNdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJyknLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdtZXRhLmZ1bmN0aW9uLnBocCcsICdtZXRhLmZ1bmN0aW9uLmFyZ3VtZW50cy5waHAnLCAnbWV0YS5mdW5jdGlvbi5hcmd1bWVudC5hcnJheS5waHAnLCAncHVuY3R1YXRpb24uZGVmaW5pdGlvbi5hcnJheS5lbmQucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bMTRdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJyknLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdtZXRhLmZ1bmN0aW9uLnBocCcsICdwdW5jdHVhdGlvbi5kZWZpbml0aW9uLnBhcmFtZXRlcnMuZW5kLnBocCddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzE1XSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICcgJyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVsxNl0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAneycsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ3B1bmN0dWF0aW9uLnNlY3Rpb24uc2NvcGUuYmVnaW4ucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bMTddKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJ30nLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdwdW5jdHVhdGlvbi5zZWN0aW9uLnNjb3BlLmVuZC5waHAnXVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIHRva2VuaXplIGRlZmF1bHQgYXJyYXkgdHlwZSB3aXRoIHNob3J0IGFycmF5IHZhbHVlIGNvcnJlY3RseScsICgpID0+IHtcbiAgICAgICAgdmFyIHRva2VucyA9IGdyYW1tYXIudG9rZW5pemVMaW5lcyhcIjw/aGhcXG5mdW5jdGlvbiBhcnJheV90ZXN0KGFycmF5ICR2YWx1ZSA9IFtdKSB7fVwiKTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVswXSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICdmdW5jdGlvbicsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ21ldGEuZnVuY3Rpb24ucGhwJywgJ3N0b3JhZ2UudHlwZS5mdW5jdGlvbi5waHAnXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVsxXSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICcgJyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAnbWV0YS5mdW5jdGlvbi5waHAnXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVsyXSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICdhcnJheV90ZXN0JyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAnbWV0YS5mdW5jdGlvbi5waHAnLCAnZW50aXR5Lm5hbWUuZnVuY3Rpb24ucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bM10pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnKCcsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ21ldGEuZnVuY3Rpb24ucGhwJywgJ3B1bmN0dWF0aW9uLmRlZmluaXRpb24ucGFyYW1ldGVycy5iZWdpbi5waHAnXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVs0XSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICdhcnJheScsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ21ldGEuZnVuY3Rpb24ucGhwJywgJ21ldGEuZnVuY3Rpb24uYXJndW1lbnRzLnBocCcsICdtZXRhLmZ1bmN0aW9uLmFyZ3VtZW50LnNob3J0LmFycmF5LnBocCcsICdzdG9yYWdlLnR5cGUucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bNV0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnICcsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ21ldGEuZnVuY3Rpb24ucGhwJywgJ21ldGEuZnVuY3Rpb24uYXJndW1lbnRzLnBocCcsICdtZXRhLmZ1bmN0aW9uLmFyZ3VtZW50LnNob3J0LmFycmF5LnBocCddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzZdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJyQnLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdtZXRhLmZ1bmN0aW9uLnBocCcsICdtZXRhLmZ1bmN0aW9uLmFyZ3VtZW50cy5waHAnLCAnbWV0YS5mdW5jdGlvbi5hcmd1bWVudC5zaG9ydC5hcnJheS5waHAnLCAndmFyaWFibGUub3RoZXIucGhwJywgJ3B1bmN0dWF0aW9uLmRlZmluaXRpb24udmFyaWFibGUucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bN10pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAndmFsdWUnLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdtZXRhLmZ1bmN0aW9uLnBocCcsICdtZXRhLmZ1bmN0aW9uLmFyZ3VtZW50cy5waHAnLCAnbWV0YS5mdW5jdGlvbi5hcmd1bWVudC5zaG9ydC5hcnJheS5waHAnLCAndmFyaWFibGUub3RoZXIucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bOF0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnICcsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ21ldGEuZnVuY3Rpb24ucGhwJywgJ21ldGEuZnVuY3Rpb24uYXJndW1lbnRzLnBocCcsICdtZXRhLmZ1bmN0aW9uLmFyZ3VtZW50LnNob3J0LmFycmF5LnBocCddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzldKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJz0nLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdtZXRhLmZ1bmN0aW9uLnBocCcsICdtZXRhLmZ1bmN0aW9uLmFyZ3VtZW50cy5waHAnLCAnbWV0YS5mdW5jdGlvbi5hcmd1bWVudC5zaG9ydC5hcnJheS5waHAnXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVsxMF0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAnICcsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ21ldGEuZnVuY3Rpb24ucGhwJywgJ21ldGEuZnVuY3Rpb24uYXJndW1lbnRzLnBocCcsICdtZXRhLmZ1bmN0aW9uLmFyZ3VtZW50LnNob3J0LmFycmF5LnBocCddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzExXSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICdbJyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snLCAnbWV0YS5mdW5jdGlvbi5waHAnLCAnbWV0YS5mdW5jdGlvbi5hcmd1bWVudHMucGhwJywgJ21ldGEuZnVuY3Rpb24uYXJndW1lbnQuc2hvcnQuYXJyYXkucGhwJywgJ3B1bmN0dWF0aW9uLmRlZmluaXRpb24uc2hvcnQuYXJyYXkuYmVnaW4ucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bMTJdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJ10nLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdtZXRhLmZ1bmN0aW9uLnBocCcsICdtZXRhLmZ1bmN0aW9uLmFyZ3VtZW50cy5waHAnLCAnbWV0YS5mdW5jdGlvbi5hcmd1bWVudC5zaG9ydC5hcnJheS5waHAnLCAncHVuY3R1YXRpb24uZGVmaW5pdGlvbi5zaG9ydC5hcnJheS5lbmQucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bMTNdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJyknLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdtZXRhLmZ1bmN0aW9uLnBocCcsICdwdW5jdHVhdGlvbi5kZWZpbml0aW9uLnBhcmFtZXRlcnMuZW5kLnBocCddXG4gICAgICAgIH0pO1xuICAgICAgICBleHBlY3QodG9rZW5zWzFdWzE0XSkudG9FcXVhbCh7XG4gICAgICAgICAgdmFsdWU6ICcgJyxcbiAgICAgICAgICBzY29wZXM6IFsndGV4dC5odG1sLmhhY2snLCAnbWV0YS5lbWJlZGRlZC5ibG9jay5waHAnLCAnc291cmNlLmhhY2snXVxuICAgICAgICB9KTtcbiAgICAgICAgZXhwZWN0KHRva2Vuc1sxXVsxNV0pLnRvRXF1YWwoe1xuICAgICAgICAgIHZhbHVlOiAneycsXG4gICAgICAgICAgc2NvcGVzOiBbJ3RleHQuaHRtbC5oYWNrJywgJ21ldGEuZW1iZWRkZWQuYmxvY2sucGhwJywgJ3NvdXJjZS5oYWNrJywgJ3B1bmN0dWF0aW9uLnNlY3Rpb24uc2NvcGUuYmVnaW4ucGhwJ11cbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdCh0b2tlbnNbMV1bMTZdKS50b0VxdWFsKHtcbiAgICAgICAgICB2YWx1ZTogJ30nLFxuICAgICAgICAgIHNjb3BlczogWyd0ZXh0Lmh0bWwuaGFjaycsICdtZXRhLmVtYmVkZGVkLmJsb2NrLnBocCcsICdzb3VyY2UuaGFjaycsICdwdW5jdHVhdGlvbi5zZWN0aW9uLnNjb3BlLmVuZC5waHAnXVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl19