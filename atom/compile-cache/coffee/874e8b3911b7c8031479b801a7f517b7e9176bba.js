(function() {
  var ExpressionsRegistry;

  ExpressionsRegistry = require('../lib/expressions-registry');

  describe('ExpressionsRegistry', function() {
    var Dummy, registry, _ref;
    _ref = [], registry = _ref[0], Dummy = _ref[1];
    beforeEach(function() {
      Dummy = (function() {
        function Dummy(_arg) {
          this.name = _arg.name;
        }

        return Dummy;

      })();
      return registry = new ExpressionsRegistry(Dummy);
    });
    describe('::createExpression', function() {
      return describe('called with enough data', function() {
        return it('creates a new expression of this registry expressions type', function() {
          var expression;
          expression = registry.createExpression('dummy', 'foo');
          expect(expression.constructor).toBe(Dummy);
          return expect(registry.getExpressions()).toEqual([expression]);
        });
      });
    });
    describe('::addExpression', function() {
      return it('adds a previously created expression in the registry', function() {
        var expression;
        expression = new Dummy({
          name: 'bar'
        });
        registry.addExpression(expression);
        expect(registry.getExpression('bar')).toBe(expression);
        return expect(registry.getExpressions()).toEqual([expression]);
      });
    });
    describe('::getExpressions', function() {
      return it('returns the expression based on their priority', function() {
        var expression1, expression2, expression3;
        expression1 = registry.createExpression('dummy1', '', 2);
        expression2 = registry.createExpression('dummy2', '', 0);
        expression3 = registry.createExpression('dummy3', '', 1);
        return expect(registry.getExpressions()).toEqual([expression1, expression3, expression2]);
      });
    });
    return describe('::removeExpression', function() {
      return it('removes an expression with its name', function() {
        registry.createExpression('dummy', 'foo');
        registry.removeExpression('dummy');
        return expect(registry.getExpressions()).toEqual([]);
      });
    });
  });

}).call(this);
