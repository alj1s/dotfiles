'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
var LazyFileTreeNode = require('../lib/LazyFileTreeNode');

describe('LazyFileTreeNode', function () {
  describe('getKey', function () {
    it('only ends with one "/" if the file is a container', function () {
      var node = new LazyFileTreeNode({
        getPath: function getPath() {
          return '/a/b/';
        },
        isDirectory: function isDirectory() {
          return true;
        } });
      expect(node.getKey()).toEqual('/a/b/');
    });

    it('ends with a "/" if the file is a container', function () {
      var node = new LazyFileTreeNode({
        getPath: function getPath() {
          return '/a/b';
        },
        isDirectory: function isDirectory() {
          return true;
        } });
      expect(node.getKey()).toEqual('/a/b/');
    });

    it('does not end with a "/" if the file is not a container', function () {
      var node = new LazyFileTreeNode({
        getPath: function getPath() {
          return '/a/b';
        },
        isDirectory: function isDirectory() {
          return false;
        } });
      expect(node.getKey()).toEqual('/a/b');
    });
  });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtdHJlZS9zcGVjL0xhenlGaWxlVHJlZU5vZGUtc3BlYy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7QUFVWixJQUFJLGdCQUFnQixHQUFHLE9BQU8sQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDOztBQUUxRCxRQUFRLENBQUMsa0JBQWtCLEVBQUUsWUFBTTtBQUNqQyxVQUFRLENBQUMsUUFBUSxFQUFFLFlBQU07QUFDdkIsTUFBRSxDQUFDLG1EQUFtRCxFQUFFLFlBQU07QUFDNUQsVUFBSSxJQUFJLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQztBQUM1QixlQUFPLEVBQUEsbUJBQUc7QUFDUixpQkFBTyxPQUFPLENBQUM7U0FDaEI7QUFDRCxtQkFBVyxFQUFBLHVCQUFHO0FBQ1osaUJBQU8sSUFBSSxDQUFDO1NBQ2IsRUFBQyxDQUFDLENBQUM7QUFDUixZQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQ3hDLENBQUMsQ0FBQzs7QUFFSCxNQUFFLENBQUMsNENBQTRDLEVBQUUsWUFBTTtBQUNyRCxVQUFJLElBQUksR0FBRyxJQUFJLGdCQUFnQixDQUFDO0FBQzVCLGVBQU8sRUFBQSxtQkFBRztBQUNSLGlCQUFPLE1BQU0sQ0FBQztTQUNmO0FBQ0QsbUJBQVcsRUFBQSx1QkFBRztBQUNaLGlCQUFPLElBQUksQ0FBQztTQUNiLEVBQUMsQ0FBQyxDQUFDO0FBQ1IsWUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUN4QyxDQUFDLENBQUM7O0FBRUgsTUFBRSxDQUFDLHdEQUF3RCxFQUFFLFlBQU07QUFDakUsVUFBSSxJQUFJLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQztBQUM1QixlQUFPLEVBQUEsbUJBQUc7QUFDUixpQkFBTyxNQUFNLENBQUM7U0FDZjtBQUNELG1CQUFXLEVBQUEsdUJBQUc7QUFDWixpQkFBTyxLQUFLLENBQUM7U0FDZCxFQUFDLENBQUMsQ0FBQztBQUNSLFlBQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDdkMsQ0FBQyxDQUFDO0dBQ0osQ0FBQyxDQUFDO0NBQ0osQ0FBQyxDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtdHJlZS9zcGVjL0xhenlGaWxlVHJlZU5vZGUtc3BlYy5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG52YXIgTGF6eUZpbGVUcmVlTm9kZSA9IHJlcXVpcmUoJy4uL2xpYi9MYXp5RmlsZVRyZWVOb2RlJyk7XG5cbmRlc2NyaWJlKCdMYXp5RmlsZVRyZWVOb2RlJywgKCkgPT4ge1xuICBkZXNjcmliZSgnZ2V0S2V5JywgKCkgPT4ge1xuICAgIGl0KCdvbmx5IGVuZHMgd2l0aCBvbmUgXCIvXCIgaWYgdGhlIGZpbGUgaXMgYSBjb250YWluZXInLCAoKSA9PiB7XG4gICAgICB2YXIgbm9kZSA9IG5ldyBMYXp5RmlsZVRyZWVOb2RlKHtcbiAgICAgICAgICBnZXRQYXRoKCkge1xuICAgICAgICAgICAgcmV0dXJuICcvYS9iLyc7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBpc0RpcmVjdG9yeSgpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH19KTtcbiAgICAgIGV4cGVjdChub2RlLmdldEtleSgpKS50b0VxdWFsKCcvYS9iLycpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2VuZHMgd2l0aCBhIFwiL1wiIGlmIHRoZSBmaWxlIGlzIGEgY29udGFpbmVyJywgKCkgPT4ge1xuICAgICAgdmFyIG5vZGUgPSBuZXcgTGF6eUZpbGVUcmVlTm9kZSh7XG4gICAgICAgICAgZ2V0UGF0aCgpIHtcbiAgICAgICAgICAgIHJldHVybiAnL2EvYic7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBpc0RpcmVjdG9yeSgpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH19KTtcbiAgICAgIGV4cGVjdChub2RlLmdldEtleSgpKS50b0VxdWFsKCcvYS9iLycpO1xuICAgIH0pO1xuXG4gICAgaXQoJ2RvZXMgbm90IGVuZCB3aXRoIGEgXCIvXCIgaWYgdGhlIGZpbGUgaXMgbm90IGEgY29udGFpbmVyJywgKCkgPT4ge1xuICAgICAgdmFyIG5vZGUgPSBuZXcgTGF6eUZpbGVUcmVlTm9kZSh7XG4gICAgICAgICAgZ2V0UGF0aCgpIHtcbiAgICAgICAgICAgIHJldHVybiAnL2EvYic7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBpc0RpcmVjdG9yeSgpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9fSk7XG4gICAgICBleHBlY3Qobm9kZS5nZXRLZXkoKSkudG9FcXVhbCgnL2EvYicpO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl19