(function() {
  var Color, Palette;

  require('./spec-helper');

  Color = require('../lib/color');

  Palette = require('../lib/palette');

  describe('Palette', function() {
    var colors, palette, _ref;
    _ref = [], colors = _ref[0], palette = _ref[1];
    beforeEach(function() {
      colors = {
        red: new Color('#ff0000'),
        green: new Color('#00ff00'),
        blue: new Color('#0000ff'),
        redCopy: new Color('#ff0000')
      };
      return palette = new Palette(colors);
    });
    describe('::getColorsCount', function() {
      return it('returns the number of colors in the palette', function() {
        return expect(palette.getColorsCount()).toEqual(4);
      });
    });
    describe('::getColorsNames', function() {
      return it('returns the names of the colors in the palette', function() {
        return expect(palette.getColorsNames()).toEqual(['red', 'green', 'blue', 'redCopy']);
      });
    });
    describe('::getColor', function() {
      it('returns the color with the given name', function() {
        return expect(palette.getColor('red')).toBeColor('#ff0000');
      });
      return it('returns undefined if the name does not exist in this palette', function() {
        return expect(palette.getColor('foo')).toBeUndefined();
      });
    });
    describe('::getNames', function() {
      return it('returns all the names a color have in the palette', function() {
        expect(palette.getNames(new Color('#ff0000'))).toEqual(['red', 'redCopy']);
        return expect(palette.getNames(new Color('#00ff00'))).toEqual(['green']);
      });
    });
    describe('::sortedByName', function() {
      return it('returns the colors and names sorted by name', function() {
        return expect(palette.sortedByName()).toEqual([['blue', palette.getColor('blue')], ['green', palette.getColor('green')], ['red', palette.getColor('red')], ['redCopy', palette.getColor('redCopy')]]);
      });
    });
    return describe('::sortedByColor', function() {
      return it('returns the colors and names sorted by colors', function() {
        return expect(palette.sortedByColor()).toEqual([['red', palette.getColor('red')], ['redCopy', palette.getColor('redCopy')], ['green', palette.getColor('green')], ['blue', palette.getColor('blue')]]);
      });
    });
  });

}).call(this);
