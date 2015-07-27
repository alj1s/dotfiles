'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

module.exports = {
  /**
   * Call `callback` on every node in the subtree, including `rootNode`.
   */
  forEachCachedNode: function forEachCachedNode(rootNode, callback) {
    var stack = [rootNode];
    while (stack.length !== 0) {
      var node = stack.pop();
      callback(node);
      (node.getCachedChildren() || []).forEach(function (childNode) {
        return stack.push(childNode);
      });
    }
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtdHJlZS9ub2RlX21vZHVsZXMvbnVjbGlkZS11aS10cmVlL2xpYi90cmVlLW5vZGUtdHJhdmVyc2Fscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7O0FBV1osTUFBTSxDQUFDLE9BQU8sR0FBRzs7OztBQUlmLG1CQUFpQixFQUFBLDJCQUFDLFFBQXNCLEVBQUUsUUFBb0MsRUFBRTtBQUM5RSxRQUFJLEtBQUssR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3ZCLFdBQU8sS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7QUFDekIsVUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ3ZCLGNBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNmLE9BQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLElBQUksRUFBRSxDQUFBLENBQUUsT0FBTyxDQUFDLFVBQUMsU0FBUztlQUFLLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO09BQUEsQ0FBQyxDQUFDO0tBQ2hGO0dBQ0Y7Q0FDRixDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtdHJlZS9ub2RlX21vZHVsZXMvbnVjbGlkZS11aS10cmVlL2xpYi90cmVlLW5vZGUtdHJhdmVyc2Fscy5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAvKipcbiAgICogQ2FsbCBgY2FsbGJhY2tgIG9uIGV2ZXJ5IG5vZGUgaW4gdGhlIHN1YnRyZWUsIGluY2x1ZGluZyBgcm9vdE5vZGVgLlxuICAgKi9cbiAgZm9yRWFjaENhY2hlZE5vZGUocm9vdE5vZGU6IExhenlUcmVlTm9kZSwgY2FsbGJhY2s6IChub2RlOiBMYXp5VHJlZU5vZGUpPT52b2lkKSB7XG4gICAgdmFyIHN0YWNrID0gW3Jvb3ROb2RlXTtcbiAgICB3aGlsZSAoc3RhY2subGVuZ3RoICE9PSAwKSB7XG4gICAgICB2YXIgbm9kZSA9IHN0YWNrLnBvcCgpO1xuICAgICAgY2FsbGJhY2sobm9kZSk7XG4gICAgICAobm9kZS5nZXRDYWNoZWRDaGlsZHJlbigpIHx8IFtdKS5mb3JFYWNoKChjaGlsZE5vZGUpID0+IHN0YWNrLnB1c2goY2hpbGROb2RlKSk7XG4gICAgfVxuICB9LFxufTtcbiJdfQ==