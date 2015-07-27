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

var path = require('path');
var fs = require('fs');
var HackLanguage = require('../lib/HackLanguage');

describe('HackLanguage', function () {
  var hackLanguage, hackClient;
  beforeEach(function () {
    hackClient = { dispose: function dispose() {} };
    hackLanguage = new HackLanguage(hackClient);
  });

  afterEach(function () {
    hackLanguage.dispose();
  });

  describe('getDiagnostics()', function () {
    it('gets the file errors', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var filePath = path.join(__dirname, 'fixtures', 'HackExample1.php');
        var fileContents = fs.readFileSync(filePath, 'utf8');

        var errors = yield hackLanguage.getDiagnostics(filePath, fileContents);

        expect(errors.length).toBe(1);
        expect(errors[0].type).toBe('Error');
        expect(errors[0].text).toMatch(/await.*async/);
        expect(errors[0].filePath).toBe(filePath);
        expect(errors[0].range.start).toEqual({ row: 14, column: 11 });
      }));
    });
  });

  describe('getCompletions()', function () {
    it('gets the local completions', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var filePath = path.join(__dirname, 'fixtures', 'HackExample2.php');
        var fileContents = fs.readFileSync(filePath, 'utf8');
        var completionOffset = fileContents.indexOf('->') + 2;

        var completions = yield hackLanguage.getCompletions(filePath, fileContents, completionOffset);

        expect(completions.length).toBe(2);
        expect(completions[0]).toEqual({
          matchText: 'doSomething',
          matchSnippet: 'doSomething(${1:$inputText})',
          matchType: 'function($inputText): string'
        });
        expect(completions[1]).toEqual({
          matchText: 'getPayload',
          matchSnippet: 'getPayload()',
          matchType: 'function(): string'
        });
      }));
    });
  });

  describe('formatSource()', function () {
    it('adds new line at the end and fixes indentation', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var contents = '<?hh // strict\n  // misplaced comment and class\n  class HackClass {}';
        var newSource = yield hackLanguage.formatSource(contents, 1, contents.length + 1);
        expect(newSource).toBe('<?hh // strict\n// misplaced comment and class\nclass HackClass {}\n');
      }));
    });
  });

  describe('getType()', function () {
    it('gets the defined and inferred types', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var filePath = path.join(__dirname, 'fixtures', 'HackExample3.php');
        var fileContents = fs.readFileSync(filePath, 'utf8');

        var nullType = yield hackLanguage.getType(filePath, fileContents, 'WebSupportFormCountryTypeahead', 4, 14);
        expect(nullType).toBeNull();
        var timeZoneType = yield hackLanguage.getType(filePath, fileContents, '$timezone_id', 7, 27);
        expect(timeZoneType).toBe('TimeZoneTypeType');
        var groupedAdsType = yield hackLanguage.getType(filePath, fileContents, '$grouped_ads', 9, 11);
        expect(groupedAdsType).toBe('array<string, array>');
      }));
    });
  });

  describe('getDefinition()', function () {
    it('gets the local definition', function () {
      waitsForPromise(_asyncToGenerator(function* () {
        var filePath = path.join(__dirname, 'fixtures', 'HackExample1.php');
        var fileContents = fs.readFileSync(filePath, 'utf8');
        var lineNumber = 15;
        var column = 26;
        var lineText = fileContents.split(/\r\n|\n/)[lineNumber - 1];

        var definitions = yield hackLanguage.getDefinition(filePath, fileContents, lineNumber, column, lineText);

        expect(definitions.length).toBe(1);
        expect(definitions[0]).toEqual({
          path: filePath,
          line: 7,
          column: 6,
          length: 9
        });
      }));
    });

    it('_parseStringForExpression returns a php expression from a line', function () {
      var _hackLanguage$_parseStringForExpression = hackLanguage._parseStringForExpression('  $abcd = 123;', 4);

      var search = _hackLanguage$_parseStringForExpression.search;

      expect(search).toEqual('$abcd');
    });

    it('_parseStringForExpression returns an XHP expression from a line', function () {
      var _hackLanguage$_parseStringForExpression2 = hackLanguage._parseStringForExpression('  <ui:test:element attr="123">', 7);

      var search = _hackLanguage$_parseStringForExpression2.search;

      expect(search).toEqual(':ui:test:element');
    });

    it('_parseStringForExpression returns an php expression from a line with <', function () {
      var _hackLanguage$_parseStringForExpression3 = hackLanguage._parseStringForExpression('  $abc = $def<$lol;', 11);

      var search = _hackLanguage$_parseStringForExpression3.search;

      expect(search).toEqual('$def');
    });

    it('_parseStringForExpression returns an php expression from a line with < and >', function () {
      var _hackLanguage$_parseStringForExpression4 = hackLanguage._parseStringForExpression('  $abc = $def <$lol && $x > $z;', 11);

      var search = _hackLanguage$_parseStringForExpression4.search;

      expect(search).toEqual('$def');
    });

    it('_parseStringForExpression returns an php expression from a line with php code and xhp expression', function () {
      var _hackLanguage$_parseStringForExpression5 = hackLanguage._parseStringForExpression('  $abc = $get$Xhp() . <ui:button attr="cs">;', 25);

      var search = _hackLanguage$_parseStringForExpression5.search;

      expect(search).toEqual(':ui:button');
    });

    it('_parseStringForExpression returns an php expression from a line with multiple xhp expression', function () {
      var lineText = '  $abc = <ui:button attr="cs"> . <ui:radio>;';
      expect(hackLanguage._parseStringForExpression(lineText, 4).search).toBe('$abc');
      expect(hackLanguage._parseStringForExpression(lineText, 15).search).toBe(':ui:button');
      expect(hackLanguage._parseStringForExpression(lineText, 23).search).toBe('attr');
      expect(hackLanguage._parseStringForExpression(lineText, 36).search).toBe(':ui:radio');
    });
  });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWhhY2svc3BlYy9IYWNrTGFuZ3VhZ2Utc3BlYy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7O0FBV1osSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzNCLElBQUksRUFBRSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN2QixJQUFJLFlBQVksR0FBRyxPQUFPLENBQUMscUJBQXFCLENBQUMsQ0FBQzs7QUFFbEQsUUFBUSxDQUFDLGNBQWMsRUFBRSxZQUFNO0FBQzdCLE1BQUksWUFBWSxFQUFFLFVBQVUsQ0FBQztBQUM3QixZQUFVLENBQUMsWUFBTTtBQUNmLGNBQVUsR0FBRyxFQUFDLE9BQU8sRUFBRSxtQkFBTSxFQUFFLEVBQUMsQ0FBQztBQUNqQyxnQkFBWSxHQUFHLElBQUksWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0dBQzdDLENBQUMsQ0FBQzs7QUFFSCxXQUFTLENBQUMsWUFBTTtBQUNkLGdCQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7R0FDeEIsQ0FBQyxDQUFDOztBQUVILFVBQVEsQ0FBQyxrQkFBa0IsRUFBRSxZQUFNO0FBQ2pDLE1BQUUsQ0FBQyxzQkFBc0IsRUFBRSxZQUFNO0FBQy9CLHFCQUFlLG1CQUFDLGFBQVk7QUFDMUIsWUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsVUFBVSxFQUFFLGtCQUFrQixDQUFDLENBQUM7QUFDcEUsWUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7O0FBRXJELFlBQUksTUFBTSxHQUFHLE1BQU0sWUFBWSxDQUFDLGNBQWMsQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUM7O0FBRXZFLGNBQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENB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QUF5QixDQUFDLGlDQUFpQyxFQUFFLEVBQUUsQ0FBQzs7VUFBdkYsTUFBTSw0Q0FBTixNQUFNOztBQUNYLFlBQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDaEMsQ0FBQyxDQUFDOztBQUVILE1BQUUsQ0FBQyxrR0FBa0csRUFBRSxZQUFNO3FEQUM1RixZQUFZLENBQUMseUJBQXlCLENBQUMsOENBQThDLEVBQUUsRUFBRSxDQUFDOztVQUFwRyxNQUFNLDRDQUFOLE1BQU07O0FBQ1gsWUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztLQUN0QyxDQUFDLENBQUM7O0FBRUgsTUFBRSxDQUFDLDhGQUE4RixFQUFFLFlBQU07QUFDdkcsVUFBSSxRQUFRLEdBQUcsOENBQThDLENBQUM7QUFDOUQsWUFBTSxDQUFDLFlBQVksQ0FBQyx5QkFBeUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2hGLFlBQU0sQ0FBQyxZQUFZLENBQUMseUJBQXlCLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUN2RixZQUFNLENBQUMsWUFBWSxDQUFDLHlCQUF5QixDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDakYsWUFBTSxDQUFDLFlBQVksQ0FBQyx5QkFBeUIsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0tBQ3ZGLENBQUMsQ0FBQztHQUNKLENBQUMsQ0FBQztDQUVKLENBQUMsQ0FBQyIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvbnVjbGlkZS1oYWNrL3NwZWMvSGFja0xhbmd1YWdlLXNwZWMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbnZhciBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG52YXIgSGFja0xhbmd1YWdlID0gcmVxdWlyZSgnLi4vbGliL0hhY2tMYW5ndWFnZScpO1xuXG5kZXNjcmliZSgnSGFja0xhbmd1YWdlJywgKCkgPT4ge1xuICB2YXIgaGFja0xhbmd1YWdlLCBoYWNrQ2xpZW50O1xuICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICBoYWNrQ2xpZW50ID0ge2Rpc3Bvc2U6ICgpID0+IHt9fTtcbiAgICBoYWNrTGFuZ3VhZ2UgPSBuZXcgSGFja0xhbmd1YWdlKGhhY2tDbGllbnQpO1xuICB9KTtcblxuICBhZnRlckVhY2goKCkgPT4ge1xuICAgIGhhY2tMYW5ndWFnZS5kaXNwb3NlKCk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdnZXREaWFnbm9zdGljcygpJywgKCkgPT4ge1xuICAgIGl0KCdnZXRzIHRoZSBmaWxlIGVycm9ycycsICgpID0+IHtcbiAgICAgIHdhaXRzRm9yUHJvbWlzZShhc3luYyAoKSA9PiB7XG4gICAgICAgIHZhciBmaWxlUGF0aCA9IHBhdGguam9pbihfX2Rpcm5hbWUsICdmaXh0dXJlcycsICdIYWNrRXhhbXBsZTEucGhwJyk7XG4gICAgICAgIHZhciBmaWxlQ29udGVudHMgPSBmcy5yZWFkRmlsZVN5bmMoZmlsZVBhdGgsICd1dGY4Jyk7XG5cbiAgICAgICAgdmFyIGVycm9ycyA9IGF3YWl0IGhhY2tMYW5ndWFnZS5nZXREaWFnbm9zdGljcyhmaWxlUGF0aCwgZmlsZUNvbnRlbnRzKTtcblxuICAgICAgICBleHBlY3QoZXJyb3JzLmxlbmd0aCkudG9CZSgxKTtcbiAgICAgICAgZXhwZWN0KGVycm9yc1swXS50eXBlKS50b0JlKCdFcnJvcicpO1xuICAgICAgICBleHBlY3QoZXJyb3JzWzBdLnRleHQpLnRvTWF0Y2goL2F3YWl0Liphc3luYy8pO1xuICAgICAgICBleHBlY3QoZXJyb3JzWzBdLmZpbGVQYXRoKS50b0JlKGZpbGVQYXRoKTtcbiAgICAgICAgZXhwZWN0KGVycm9yc1swXS5yYW5nZS5zdGFydCkudG9FcXVhbCh7IHJvdyA6IDE0LCBjb2x1bW4gOiAxMSB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnZ2V0Q29tcGxldGlvbnMoKScsICgpID0+IHtcbiAgICBpdCgnZ2V0cyB0aGUgbG9jYWwgY29tcGxldGlvbnMnLCAoKSA9PiB7XG4gICAgICB3YWl0c0ZvclByb21pc2UoYXN5bmMgKCkgPT4ge1xuICAgICAgICB2YXIgZmlsZVBhdGggPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnZml4dHVyZXMnLCAnSGFja0V4YW1wbGUyLnBocCcpO1xuICAgICAgICB2YXIgZmlsZUNvbnRlbnRzID0gZnMucmVhZEZpbGVTeW5jKGZpbGVQYXRoLCAndXRmOCcpO1xuICAgICAgICB2YXIgY29tcGxldGlvbk9mZnNldCA9IGZpbGVDb250ZW50cy5pbmRleE9mKCctPicpICsgMjtcblxuICAgICAgICB2YXIgY29tcGxldGlvbnMgPSBhd2FpdCBoYWNrTGFuZ3VhZ2UuZ2V0Q29tcGxldGlvbnMoZmlsZVBhdGgsIGZpbGVDb250ZW50cywgY29tcGxldGlvbk9mZnNldCk7XG5cbiAgICAgICAgZXhwZWN0KGNvbXBsZXRpb25zLmxlbmd0aCkudG9CZSgyKTtcbiAgICAgICAgZXhwZWN0KGNvbXBsZXRpb25zWzBdKS50b0VxdWFsKHtcbiAgICAgICAgICBtYXRjaFRleHQgOiAnZG9Tb21ldGhpbmcnLFxuICAgICAgICAgIG1hdGNoU25pcHBldDogJ2RvU29tZXRoaW5nKCR7MTokaW5wdXRUZXh0fSknLFxuICAgICAgICAgIG1hdGNoVHlwZSA6ICdmdW5jdGlvbigkaW5wdXRUZXh0KTogc3RyaW5nJyxcbiAgICAgICAgfSk7XG4gICAgICAgIGV4cGVjdChjb21wbGV0aW9uc1sxXSkudG9FcXVhbCh7XG4gICAgICAgICAgbWF0Y2hUZXh0IDogJ2dldFBheWxvYWQnLFxuICAgICAgICAgIG1hdGNoU25pcHBldDogJ2dldFBheWxvYWQoKScsXG4gICAgICAgICAgbWF0Y2hUeXBlIDogJ2Z1bmN0aW9uKCk6IHN0cmluZycsXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdmb3JtYXRTb3VyY2UoKScsICgpID0+IHtcbiAgICBpdCgnYWRkcyBuZXcgbGluZSBhdCB0aGUgZW5kIGFuZCBmaXhlcyBpbmRlbnRhdGlvbicsICgpID0+IHtcbiAgICAgIHdhaXRzRm9yUHJvbWlzZShhc3luYyAoKSA9PiB7XG4gICAgICAgIHZhciBjb250ZW50cyA9IGA8P2hoIC8vIHN0cmljdFxuICAvLyBtaXNwbGFjZWQgY29tbWVudCBhbmQgY2xhc3NcbiAgY2xhc3MgSGFja0NsYXNzIHt9YDtcbiAgICAgICAgdmFyIG5ld1NvdXJjZSA9IGF3YWl0IGhhY2tMYW5ndWFnZS5mb3JtYXRTb3VyY2UoY29udGVudHMsIDEsIGNvbnRlbnRzLmxlbmd0aCsxKTtcbiAgICAgICAgZXhwZWN0KG5ld1NvdXJjZSkudG9CZShgPD9oaCAvLyBzdHJpY3Rcbi8vIG1pc3BsYWNlZCBjb21tZW50IGFuZCBjbGFzc1xuY2xhc3MgSGFja0NsYXNzIHt9XG5gKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnZ2V0VHlwZSgpJywgKCkgPT4ge1xuICAgIGl0KCdnZXRzIHRoZSBkZWZpbmVkIGFuZCBpbmZlcnJlZCB0eXBlcycsICgpID0+IHtcbiAgICAgIHdhaXRzRm9yUHJvbWlzZShhc3luYyAoKSA9PiB7XG4gICAgICAgIHZhciBmaWxlUGF0aCA9IHBhdGguam9pbihfX2Rpcm5hbWUsICdmaXh0dXJlcycsICdIYWNrRXhhbXBsZTMucGhwJyk7XG4gICAgICAgIHZhciBmaWxlQ29udGVudHMgPSBmcy5yZWFkRmlsZVN5bmMoZmlsZVBhdGgsICd1dGY4Jyk7XG5cbiAgICAgICAgdmFyIG51bGxUeXBlID0gYXdhaXQgaGFja0xhbmd1YWdlLmdldFR5cGUoZmlsZVBhdGgsIGZpbGVDb250ZW50cywgJ1dlYlN1cHBvcnRGb3JtQ291bnRyeVR5cGVhaGVhZCcsIDQsIDE0KTtcbiAgICAgICAgZXhwZWN0KG51bGxUeXBlKS50b0JlTnVsbCgpO1xuICAgICAgICB2YXIgdGltZVpvbmVUeXBlID0gYXdhaXQgaGFja0xhbmd1YWdlLmdldFR5cGUoZmlsZVBhdGgsIGZpbGVDb250ZW50cywgJyR0aW1lem9uZV9pZCcsIDcsIDI3KTtcbiAgICAgICAgZXhwZWN0KHRpbWVab25lVHlwZSkudG9CZSgnVGltZVpvbmVUeXBlVHlwZScpO1xuICAgICAgICB2YXIgZ3JvdXBlZEFkc1R5cGUgPSBhd2FpdCBoYWNrTGFuZ3VhZ2UuZ2V0VHlwZShmaWxlUGF0aCwgZmlsZUNvbnRlbnRzLCAnJGdyb3VwZWRfYWRzJywgOSwgMTEpO1xuICAgICAgICBleHBlY3QoZ3JvdXBlZEFkc1R5cGUpLnRvQmUoJ2FycmF5PHN0cmluZywgYXJyYXk+Jyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2dldERlZmluaXRpb24oKScsICgpID0+IHtcbiAgICBpdCgnZ2V0cyB0aGUgbG9jYWwgZGVmaW5pdGlvbicsICgpID0+IHtcbiAgICAgIHdhaXRzRm9yUHJvbWlzZShhc3luYyAoKSA9PiB7XG4gICAgICAgIHZhciBmaWxlUGF0aCA9IHBhdGguam9pbihfX2Rpcm5hbWUsICdmaXh0dXJlcycsICdIYWNrRXhhbXBsZTEucGhwJyk7XG4gICAgICAgIHZhciBmaWxlQ29udGVudHMgPSBmcy5yZWFkRmlsZVN5bmMoZmlsZVBhdGgsICd1dGY4Jyk7XG4gICAgICAgIHZhciBsaW5lTnVtYmVyID0gMTU7XG4gICAgICAgIHZhciBjb2x1bW4gPSAyNjtcbiAgICAgICAgdmFyIGxpbmVUZXh0ID0gZmlsZUNvbnRlbnRzLnNwbGl0KC9cXHJcXG58XFxuLylbbGluZU51bWJlciAtIDFdO1xuXG4gICAgICAgIHZhciBkZWZpbml0aW9ucyA9IGF3YWl0IGhhY2tMYW5ndWFnZS5nZXREZWZpbml0aW9uKGZpbGVQYXRoLCBmaWxlQ29udGVudHMsIGxpbmVOdW1iZXIsIGNvbHVtbiwgbGluZVRleHQpO1xuXG4gICAgICAgIGV4cGVjdChkZWZpbml0aW9ucy5sZW5ndGgpLnRvQmUoMSk7XG4gICAgICAgIGV4cGVjdChkZWZpbml0aW9uc1swXSkudG9FcXVhbCh7XG4gICAgICAgICAgcGF0aDogZmlsZVBhdGgsXG4gICAgICAgICAgbGluZTogNyxcbiAgICAgICAgICBjb2x1bW46IDYsXG4gICAgICAgICAgbGVuZ3RoOiA5LFxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaXQoJ19wYXJzZVN0cmluZ0ZvckV4cHJlc3Npb24gcmV0dXJucyBhIHBocCBleHByZXNzaW9uIGZyb20gYSBsaW5lJywgKCkgPT4ge1xuICAgICAgdmFyIHtzZWFyY2h9ID0gaGFja0xhbmd1YWdlLl9wYXJzZVN0cmluZ0ZvckV4cHJlc3Npb24oJyAgJGFiY2QgPSAxMjM7JywgNCk7XG4gICAgICBleHBlY3Qoc2VhcmNoKS50b0VxdWFsKCckYWJjZCcpO1xuICAgIH0pO1xuXG4gICAgaXQoJ19wYXJzZVN0cmluZ0ZvckV4cHJlc3Npb24gcmV0dXJucyBhbiBYSFAgZXhwcmVzc2lvbiBmcm9tIGEgbGluZScsICgpID0+IHtcbiAgICAgIHZhciB7c2VhcmNofSA9IGhhY2tMYW5ndWFnZS5fcGFyc2VTdHJpbmdGb3JFeHByZXNzaW9uKCcgIDx1aTp0ZXN0OmVsZW1lbnQgYXR0cj1cIjEyM1wiPicsIDcpO1xuICAgICAgZXhwZWN0KHNlYXJjaCkudG9FcXVhbCgnOnVpOnRlc3Q6ZWxlbWVudCcpO1xuICAgIH0pO1xuXG4gICAgaXQoJ19wYXJzZVN0cmluZ0ZvckV4cHJlc3Npb24gcmV0dXJucyBhbiBwaHAgZXhwcmVzc2lvbiBmcm9tIGEgbGluZSB3aXRoIDwnLCAoKSA9PiB7XG4gICAgICB2YXIge3NlYXJjaH0gPSBoYWNrTGFuZ3VhZ2UuX3BhcnNlU3RyaW5nRm9yRXhwcmVzc2lvbignICAkYWJjID0gJGRlZjwkbG9sOycsIDExKTtcbiAgICAgIGV4cGVjdChzZWFyY2gpLnRvRXF1YWwoJyRkZWYnKTtcbiAgICB9KTtcblxuICAgIGl0KCdfcGFyc2VTdHJpbmdGb3JFeHByZXNzaW9uIHJldHVybnMgYW4gcGhwIGV4cHJlc3Npb24gZnJvbSBhIGxpbmUgd2l0aCA8IGFuZCA+JywgKCkgPT4ge1xuICAgICAgdmFyIHtzZWFyY2h9ID0gaGFja0xhbmd1YWdlLl9wYXJzZVN0cmluZ0ZvckV4cHJlc3Npb24oJyAgJGFiYyA9ICRkZWYgPCRsb2wgJiYgJHggPiAkejsnLCAxMSk7XG4gICAgICBleHBlY3Qoc2VhcmNoKS50b0VxdWFsKCckZGVmJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnX3BhcnNlU3RyaW5nRm9yRXhwcmVzc2lvbiByZXR1cm5zIGFuIHBocCBleHByZXNzaW9uIGZyb20gYSBsaW5lIHdpdGggcGhwIGNvZGUgYW5kIHhocCBleHByZXNzaW9uJywgKCkgPT4ge1xuICAgICAgdmFyIHtzZWFyY2h9ID0gaGFja0xhbmd1YWdlLl9wYXJzZVN0cmluZ0ZvckV4cHJlc3Npb24oJyAgJGFiYyA9ICRnZXQkWGhwKCkgLiA8dWk6YnV0dG9uIGF0dHI9XCJjc1wiPjsnLCAyNSk7XG4gICAgICBleHBlY3Qoc2VhcmNoKS50b0VxdWFsKCc6dWk6YnV0dG9uJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnX3BhcnNlU3RyaW5nRm9yRXhwcmVzc2lvbiByZXR1cm5zIGFuIHBocCBleHByZXNzaW9uIGZyb20gYSBsaW5lIHdpdGggbXVsdGlwbGUgeGhwIGV4cHJlc3Npb24nLCAoKSA9PiB7XG4gICAgICB2YXIgbGluZVRleHQgPSAnICAkYWJjID0gPHVpOmJ1dHRvbiBhdHRyPVwiY3NcIj4gLiA8dWk6cmFkaW8+Oyc7XG4gICAgICBleHBlY3QoaGFja0xhbmd1YWdlLl9wYXJzZVN0cmluZ0ZvckV4cHJlc3Npb24obGluZVRleHQsIDQpLnNlYXJjaCkudG9CZSgnJGFiYycpO1xuICAgICAgZXhwZWN0KGhhY2tMYW5ndWFnZS5fcGFyc2VTdHJpbmdGb3JFeHByZXNzaW9uKGxpbmVUZXh0LCAxNSkuc2VhcmNoKS50b0JlKCc6dWk6YnV0dG9uJyk7XG4gICAgICBleHBlY3QoaGFja0xhbmd1YWdlLl9wYXJzZVN0cmluZ0ZvckV4cHJlc3Npb24obGluZVRleHQsIDIzKS5zZWFyY2gpLnRvQmUoJ2F0dHInKTtcbiAgICAgIGV4cGVjdChoYWNrTGFuZ3VhZ2UuX3BhcnNlU3RyaW5nRm9yRXhwcmVzc2lvbihsaW5lVGV4dCwgMzYpLnNlYXJjaCkudG9CZSgnOnVpOnJhZGlvJyk7XG4gICAgfSk7XG4gIH0pO1xuXG59KTtcbiJdfQ==