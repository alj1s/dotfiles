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

var SymbolListProvider = require('../lib/SymbolListProvider');
var nuclideClient = require('nuclide-client');
var mockClient;
var provider;

describe('SymbolListProvider', function () {
  describe('executeQuery', function () {
    beforeEach(function () {
      mockClient = jasmine.createSpyObj('NuclideClient', ['getSearchProviders', 'doSearchQuery']);
      mockClient.doSearchQuery.andReturn(Promise.resolve({ results: [{ path: '/some/path' }] }));
      spyOn(nuclideClient, 'getClient').andReturn(mockClient);
      provider = new SymbolListProvider();
    });

    describe('local searching', function () {
      beforeEach(function () {
        spyOn(atom.project, 'getDirectories').andReturn([{
          getPath: function getPath() {
            return '/';
          },
          getBaseName: function getBaseName() {
            return 'base';
          }
        }]);
      });

      it('returns local paths', function () {
        waitsForPromise(_asyncToGenerator(function* () {
          mockClient.getSearchProviders.andReturn(Promise.resolve([{ name: 'hack' }]));

          var queries = yield provider.executeQuery('asdf');
          expect(mockClient.getSearchProviders).toHaveBeenCalledWith('/');
          expect(mockClient.doSearchQuery).toHaveBeenCalledWith('/', 'hack', 'asdf');
          expect(Object.keys(queries)).toEqual(['base']);
          expect(Object.keys(queries.base)).toEqual(['hack']);

          var result = yield queries.base.hack;

          expect(result.results[0].path).toEqual('/some/path');
        }));
      });
    });

    describe('remote searching', function () {
      beforeEach(function () {
        spyOn(atom.project, 'getDirectories').andReturn([{
          getPath: function getPath() {
            return 'nuclide://some.host:1234/some/remote/path';
          },
          getBaseName: function getBaseName() {
            return 'path';
          }
        }]);
      });

      it('returns remote paths when doing remote search', function () {
        waitsForPromise(_asyncToGenerator(function* () {
          mockClient.getSearchProviders.andReturn(Promise.resolve([{ name: 'hack' }]));

          var queries = yield provider.executeQuery('asdf');
          expect(mockClient.getSearchProviders).toHaveBeenCalledWith('/some/remote/path');
          expect(mockClient.doSearchQuery).toHaveBeenCalledWith('/some/remote/path', 'hack', 'asdf');

          expect(Object.keys(queries)).toEqual(['path']);
          expect(Object.keys(queries.path)).toEqual(['hack']);

          var result = yield queries.path.hack;
          expect(result.results[0].path).toEqual('nuclide://some.host:1234/some/path');
        }));
      });

      it('does not call doSearchQuery if hack not available', function () {
        waitsForPromise(_asyncToGenerator(function* () {
          mockClient.getSearchProviders.andReturn(Promise.resolve([]));

          var queries = yield provider.executeQuery('asdf');
          expect(mockClient.getSearchProviders).toHaveBeenCalledWith('/some/remote/path');
          expect(mockClient.doSearchQuery).not.toHaveBeenCalled();
          expect(queries).toEqual({});
        }));
      });
    });
  });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXF1aWNrLW9wZW4vc3BlYy9TeW1ib2xMaXN0UHJvdmlkZXItc3BlYy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7O0FBV1osSUFBSSxrQkFBa0IsR0FBRyxPQUFPLENBQUMsMkJBQTJCLENBQUMsQ0FBQztBQUM5RCxJQUFJLGFBQWEsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUM5QyxJQUFJLFVBQVUsQ0FBQztBQUNmLElBQUksUUFBUSxDQUFDOztBQUViLFFBQVEsQ0FBQyxvQkFBb0IsRUFBRSxZQUFNO0FBQ25DLFVBQVEsQ0FBQyxjQUFjLEVBQUUsWUFBTTtBQUM3QixjQUFVLENBQUMsWUFBTTtBQUNmLGdCQUFVLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDO0FBQzVGLGdCQUFVLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBQyxJQUFJLEVBQUUsWUFBWSxFQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQztBQUN4RixXQUFLLENBQUMsYUFBYSxFQUFFLFdBQVcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUN4RCxjQUFRLEdBQUcsSUFBSSxrQkFBa0IsRUFBRSxDQUFDO0tBQ3JDLENBQUMsQ0FBQzs7QUFFSCxZQUFRLENBQUMsaUJBQWlCLEVBQUUsWUFBTTtBQUNoQyxnQkFBVSxDQUFDLFlBQU07QUFDZixhQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQy9DLGlCQUFPLEVBQUU7bUJBQU0sR0FBRztXQUFBO0FBQ2xCLHFCQUFXLEVBQUU7bUJBQU0sTUFBTTtXQUFBO1NBQzFCLENBQUMsQ0FBQyxDQUFDO09BQ0wsQ0FBQyxDQUFDOztBQUVILFFBQUUsQ0FBQyxxQkFBcUIsRUFBRSxZQUFNO0FBQzlCLHVCQUFlLG1CQUFDLGFBQVk7QUFDMUIsb0JBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUMsSUFBSSxFQUFFLE1BQU0sRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOztBQUUzRSxjQUFJLE9BQU8sR0FBRyxNQUFNLFFBQVEsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDbEQsZ0JBQU0sQ0FBQyxVQUFVLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNoRSxnQkFBTSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQzNFLGdCQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDL0MsZ0JBQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7O0FBRXBELGNBQUksTUFBTSxHQUFHLE1BQU0sT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7O0FBRXJDLGdCQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7U0FDdEQsRUFBQyxDQUFDO09BQ0osQ0FBQyxDQUFDO0tBQ0osQ0FBQyxDQUFDOztBQUVILFlBQVEsQ0FBQyxrQkFBa0IsRUFBRSxZQUFNO0FBQ2pDLGdCQUFVLENBQUMsWUFBTTtBQUNmLGFBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLGdCQUFnQixDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDL0MsaUJBQU8sRUFBRTttQkFBTSwyQ0FBMkM7V0FBQTtBQUMxRCxxQkFBVyxFQUFFO21CQUFNLE1BQU07V0FBQTtTQUMxQixDQUFDLENBQUMsQ0FBQztPQUNMLENBQUMsQ0FBQzs7QUFFSCxRQUFFLENBQUMsK0NBQStDLEVBQUUsWUFBTTtBQUN4RCx1QkFBZSxtQkFBQyxhQUFZO0FBQzFCLG9CQUFVLENBQUMsa0JBQWtCLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFDLElBQUksRUFBRSxNQUFNLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7QUFFM0UsY0FBSSxPQUFPLEdBQUcsTUFBTSxRQUFRLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2xELGdCQUFNLENBQUMsVUFBVSxDQUFDLGtCQUFrQixDQUFDLENBQUMsb0JBQW9CLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUNoRixnQkFBTSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxtQkFBbUIsRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7O0FBRTNGLGdCQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDL0MsZ0JBQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7O0FBRXBELGNBQUksTUFBTSxHQUFHLE1BQU0sT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDckMsZ0JBQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO1NBQzlFLEVBQUMsQ0FBQztPQUNKLENBQUMsQ0FBQzs7QUFFSCxRQUFFLENBQUMsbURBQW1ELEVBQUUsWUFBTTtBQUM1RCx1QkFBZSxtQkFBQyxhQUFZO0FBQzFCLG9CQUFVLENBQUMsa0JBQWtCLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzs7QUFFN0QsY0FBSSxPQUFPLEdBQUcsTUFBTSxRQUFRLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2xELGdCQUFNLENBQUMsVUFBVSxDQUFDLGtCQUFrQixDQUFDLENBQUMsb0JBQW9CLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUNoRixnQkFBTSxDQUFDLFVBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztBQUN4RCxnQkFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUM3QixFQUFDLENBQUM7T0FDSixDQUFDLENBQUM7S0FDSixDQUFDLENBQUM7R0FDSixDQUFDLENBQUM7Q0FDSixDQUFDLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL251Y2xpZGUtcXVpY2stb3Blbi9zcGVjL1N5bWJvbExpc3RQcm92aWRlci1zcGVjLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxudmFyIFN5bWJvbExpc3RQcm92aWRlciA9IHJlcXVpcmUoJy4uL2xpYi9TeW1ib2xMaXN0UHJvdmlkZXInKTtcbnZhciBudWNsaWRlQ2xpZW50ID0gcmVxdWlyZSgnbnVjbGlkZS1jbGllbnQnKTtcbnZhciBtb2NrQ2xpZW50O1xudmFyIHByb3ZpZGVyO1xuXG5kZXNjcmliZSgnU3ltYm9sTGlzdFByb3ZpZGVyJywgKCkgPT4ge1xuICBkZXNjcmliZSgnZXhlY3V0ZVF1ZXJ5JywgKCkgPT4ge1xuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xuICAgICAgbW9ja0NsaWVudCA9IGphc21pbmUuY3JlYXRlU3B5T2JqKCdOdWNsaWRlQ2xpZW50JywgWydnZXRTZWFyY2hQcm92aWRlcnMnLCAnZG9TZWFyY2hRdWVyeSddKTtcbiAgICAgIG1vY2tDbGllbnQuZG9TZWFyY2hRdWVyeS5hbmRSZXR1cm4oUHJvbWlzZS5yZXNvbHZlKHsgcmVzdWx0czogW3twYXRoOiAnL3NvbWUvcGF0aCd9XX0pKTtcbiAgICAgIHNweU9uKG51Y2xpZGVDbGllbnQsICdnZXRDbGllbnQnKS5hbmRSZXR1cm4obW9ja0NsaWVudCk7XG4gICAgICBwcm92aWRlciA9IG5ldyBTeW1ib2xMaXN0UHJvdmlkZXIoKTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdsb2NhbCBzZWFyY2hpbmcnLCAoKSA9PiB7XG4gICAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgICAgc3B5T24oYXRvbS5wcm9qZWN0LCAnZ2V0RGlyZWN0b3JpZXMnKS5hbmRSZXR1cm4oW3tcbiAgICAgICAgICBnZXRQYXRoOiAoKSA9PiAnLycsXG4gICAgICAgICAgZ2V0QmFzZU5hbWU6ICgpID0+ICdiYXNlJyxcbiAgICAgICAgfV0pO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdyZXR1cm5zIGxvY2FsIHBhdGhzJywgKCkgPT4ge1xuICAgICAgICB3YWl0c0ZvclByb21pc2UoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIG1vY2tDbGllbnQuZ2V0U2VhcmNoUHJvdmlkZXJzLmFuZFJldHVybihQcm9taXNlLnJlc29sdmUoW3tuYW1lOiAnaGFjayd9XSkpO1xuXG4gICAgICAgICAgdmFyIHF1ZXJpZXMgPSBhd2FpdCBwcm92aWRlci5leGVjdXRlUXVlcnkoJ2FzZGYnKTtcbiAgICAgICAgICBleHBlY3QobW9ja0NsaWVudC5nZXRTZWFyY2hQcm92aWRlcnMpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKCcvJyk7XG4gICAgICAgICAgZXhwZWN0KG1vY2tDbGllbnQuZG9TZWFyY2hRdWVyeSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoJy8nLCAnaGFjaycsICdhc2RmJyk7XG4gICAgICAgICAgZXhwZWN0KE9iamVjdC5rZXlzKHF1ZXJpZXMpKS50b0VxdWFsKFsnYmFzZSddKTtcbiAgICAgICAgICBleHBlY3QoT2JqZWN0LmtleXMocXVlcmllcy5iYXNlKSkudG9FcXVhbChbJ2hhY2snXSk7XG5cbiAgICAgICAgICB2YXIgcmVzdWx0ID0gYXdhaXQgcXVlcmllcy5iYXNlLmhhY2s7XG5cbiAgICAgICAgICBleHBlY3QocmVzdWx0LnJlc3VsdHNbMF0ucGF0aCkudG9FcXVhbCgnL3NvbWUvcGF0aCcpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ3JlbW90ZSBzZWFyY2hpbmcnLCAoKSA9PiB7XG4gICAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgICAgc3B5T24oYXRvbS5wcm9qZWN0LCAnZ2V0RGlyZWN0b3JpZXMnKS5hbmRSZXR1cm4oW3tcbiAgICAgICAgICBnZXRQYXRoOiAoKSA9PiAnbnVjbGlkZTovL3NvbWUuaG9zdDoxMjM0L3NvbWUvcmVtb3RlL3BhdGgnLFxuICAgICAgICAgIGdldEJhc2VOYW1lOiAoKSA9PiAncGF0aCcsXG4gICAgICAgIH1dKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgncmV0dXJucyByZW1vdGUgcGF0aHMgd2hlbiBkb2luZyByZW1vdGUgc2VhcmNoJywgKCkgPT4ge1xuICAgICAgICB3YWl0c0ZvclByb21pc2UoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIG1vY2tDbGllbnQuZ2V0U2VhcmNoUHJvdmlkZXJzLmFuZFJldHVybihQcm9taXNlLnJlc29sdmUoW3tuYW1lOiAnaGFjayd9XSkpO1xuXG4gICAgICAgICAgdmFyIHF1ZXJpZXMgPSBhd2FpdCBwcm92aWRlci5leGVjdXRlUXVlcnkoJ2FzZGYnKTtcbiAgICAgICAgICBleHBlY3QobW9ja0NsaWVudC5nZXRTZWFyY2hQcm92aWRlcnMpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKCcvc29tZS9yZW1vdGUvcGF0aCcpO1xuICAgICAgICAgIGV4cGVjdChtb2NrQ2xpZW50LmRvU2VhcmNoUXVlcnkpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKCcvc29tZS9yZW1vdGUvcGF0aCcsICdoYWNrJywgJ2FzZGYnKTtcblxuICAgICAgICAgIGV4cGVjdChPYmplY3Qua2V5cyhxdWVyaWVzKSkudG9FcXVhbChbJ3BhdGgnXSk7XG4gICAgICAgICAgZXhwZWN0KE9iamVjdC5rZXlzKHF1ZXJpZXMucGF0aCkpLnRvRXF1YWwoWydoYWNrJ10pO1xuXG4gICAgICAgICAgdmFyIHJlc3VsdCA9IGF3YWl0IHF1ZXJpZXMucGF0aC5oYWNrO1xuICAgICAgICAgIGV4cGVjdChyZXN1bHQucmVzdWx0c1swXS5wYXRoKS50b0VxdWFsKCdudWNsaWRlOi8vc29tZS5ob3N0OjEyMzQvc29tZS9wYXRoJyk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdkb2VzIG5vdCBjYWxsIGRvU2VhcmNoUXVlcnkgaWYgaGFjayBub3QgYXZhaWxhYmxlJywgKCkgPT4ge1xuICAgICAgICB3YWl0c0ZvclByb21pc2UoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIG1vY2tDbGllbnQuZ2V0U2VhcmNoUHJvdmlkZXJzLmFuZFJldHVybihQcm9taXNlLnJlc29sdmUoW10pKTtcblxuICAgICAgICAgIHZhciBxdWVyaWVzID0gYXdhaXQgcHJvdmlkZXIuZXhlY3V0ZVF1ZXJ5KCdhc2RmJyk7XG4gICAgICAgICAgZXhwZWN0KG1vY2tDbGllbnQuZ2V0U2VhcmNoUHJvdmlkZXJzKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCgnL3NvbWUvcmVtb3RlL3BhdGgnKTtcbiAgICAgICAgICBleHBlY3QobW9ja0NsaWVudC5kb1NlYXJjaFF1ZXJ5KS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgICAgICAgIGV4cGVjdChxdWVyaWVzKS50b0VxdWFsKHt9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59KTtcbiJdfQ==