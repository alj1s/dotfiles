'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

/**
 * Static method as defined by
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from.
 * @param arrayLike An array-like or iterable object to convert to an array.
 * @param mapFn Map function to call on every element of the array.
 * @param thisArg Value to use as `this` when executing `mapFn`.
 */
function from(_x3) {
  var _arguments = arguments;
  var _again = true;

  _function: while (_again) {
    var arrayLike = _x3;
    mapFn = thisArg = array = _iteratorNormalCompletion = _didIteratorError = _iteratorError = array = _arrayLike$next = done = value = undefined;
    var mapFn = _arguments[1] === undefined ? undefined : _arguments[1];
    _again = false;
    var thisArg = _arguments[2] === undefined ? undefined : _arguments[2];

    if (mapFn === undefined) {
      mapFn = function (arg) {
        return arg;
      };
    }

    // Note that Symbol is not defined when running on Node 0.10.x.
    if (typeof Symbol !== 'undefined' && typeof arrayLike === 'object' && typeof arrayLike[Symbol.iterator] === 'function') {
      var array = [];
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = arrayLike[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var value = _step.value;

          array.push(mapFn.call(thisArg, value));
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator['return']) {
            _iterator['return']();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return array;
    } else if (typeof arrayLike.next === 'function') {
      // See if arrayLike conforms to the iterator protocol. Note that on
      // Node 0.10.x, where we use es6-collections, things like Map.entries() and
      // Set.values() will fall into this case rather than the previous case.
      var array = [];
      while (true) {
        var _arrayLike$next = arrayLike.next();

        var done = _arrayLike$next.done;
        var value = _arrayLike$next.value;

        if (done) {
          break;
        } else {
          array.push(mapFn.call(thisArg, value));
        }
      }
      return array;
    } else if ('length' in arrayLike) {
      return Array.prototype.map.call(arrayLike, mapFn, thisArg);
    } else if (arrayLike instanceof Set) {
      // Backup logic to handle the es6-collections case.
      _arguments = [_x3 = arrayLike.values(), mapFn, thisArg];
      _again = true;
      continue _function;
    } else if (arrayLike instanceof Map) {
      // Backup logic to handle the es6-collections case.
      _arguments = [_x3 = arrayLike.entries(), mapFn, thisArg];
      _again = true;
      continue _function;
    } else {
      throw Error(arrayLike + ' must be an array-like or iterable object to convert to an array.');
    }
  }
}

/**
 * Instance method of Array as defined by
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find.
 * Because we do not want to add elements to Array.prototype, we make this a
 * static method that takes the Array (which would be the receiver if it were an
 * instance method) as the first argument.
 * @param array The array to search.
 * @param Function to execute on each value in the array.
 * @param Object to use as `this` when executing `callback`.
 */
function find(array, callback, thisArg) {
  var resultIndex = findIndex(array, callback, thisArg);
  return resultIndex >= 0 ? array[resultIndex] : undefined;
}

/**
 * Instance method of Array as defined by
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex.
 * Because we do not want to add elements to Array.prototype, we make this a
 * static method that takes the Array (which would be the receiver if it were an
 * instance method) as the first argument.
 * @param array The array to search.
 * @param Function to execute on each value in the array.
 * @param Object to use as `this` when executing `callback`.
 */
function findIndex(array, callback, thisArg) {
  var result = -1;
  array.some(function (element, index, array) {
    if (callback.call(thisArg, element, index, array)) {
      result = index;
      return true;
    } else {
      return false;
    }
  });
  return result;
}

module.exports = {
  find: find,
  findIndex: findIndex,
  from: from
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtdHJlZS9ub2RlX21vZHVsZXMvbnVjbGlkZS1jb21tb25zL2xpYi9hcnJheS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtCWixTQUFTLElBQUk7Ozs7NEJBQTJEO1FBQTFELFNBQVM7QUFBRSxTQUFLLEdBQWMsT0FBTyxHQVMzQyxLQUFLLG9FQVNMLEtBQUsscUJBRUYsSUFBSSxHQUFFLEtBQUs7UUFwQkcsS0FBSyxpQ0FBRyxTQUFTOztRQUFFLE9BQU8saUNBQUcsU0FBUzs7QUFDN0QsUUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO0FBQ3ZCLFdBQUssR0FBRyxVQUFTLEdBQUcsRUFBRTtBQUFFLGVBQU8sR0FBRyxDQUFDO09BQUUsQ0FBQztLQUN2Qzs7O0FBR0QsUUFBSSxPQUFPLE1BQU0sS0FBSyxXQUFXLElBQzdCLE9BQU8sU0FBUyxLQUFLLFFBQVEsSUFDN0IsT0FBTyxTQUFTLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLFVBQVUsRUFBRTtBQUNwRCxVQUFJLEtBQUssR0FBRyxFQUFFLENBQUM7Ozs7OztBQUNmLDZCQUFrQixTQUFTLDhIQUFFO2NBQXBCLEtBQUs7O0FBQ1osZUFBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1NBQ3hDOzs7Ozs7Ozs7Ozs7Ozs7O0FBQ0QsYUFBTyxLQUFLLENBQUM7S0FDZCxNQUFNLElBQUksT0FBTyxTQUFTLENBQUMsSUFBSSxLQUFLLFVBQVUsRUFBRTs7OztBQUkvQyxVQUFJLEtBQUssR0FBRyxFQUFFLENBQUM7QUFDZixhQUFPLElBQUksRUFBRTs4QkFDUyxTQUFTLENBQUMsSUFBSSxFQUFFOztZQUEvQixJQUFJLG1CQUFKLElBQUk7WUFBRSxLQUFLLG1CQUFMLEtBQUs7O0FBQ2hCLFlBQUksSUFBSSxFQUFFO0FBQ1IsZ0JBQU07U0FDUCxNQUFNO0FBQ0wsZUFBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1NBQ3hDO09BQ0Y7QUFDRCxhQUFPLEtBQUssQ0FBQztLQUNkLE1BQU0sSUFBSSxRQUFRLElBQUksU0FBUyxFQUFFO0FBQ2hDLGFBQU8sS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDNUQsTUFBTSxJQUFJLFNBQVMsWUFBWSxHQUFHLEVBQUU7OzBCQUV2QixTQUFTLENBQUMsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFFLE9BQU87OztLQUMvQyxNQUFNLElBQUksU0FBUyxZQUFZLEdBQUcsRUFBRTs7MEJBRXZCLFNBQVMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxLQUFLLEVBQUUsT0FBTzs7O0tBQ2hELE1BQU07QUFDTCxZQUFNLEtBQUssQ0FBQyxTQUFTLEdBQ2pCLG1FQUFtRSxDQUFDLENBQUM7S0FDMUU7R0FDRjtDQUFBOzs7Ozs7Ozs7Ozs7QUFZRCxTQUFTLElBQUksQ0FDVCxLQUFZLEVBQ1osUUFBNEQsRUFDNUQsT0FBYSxFQUFPO0FBQ3RCLE1BQUksV0FBVyxHQUFHLFNBQVMsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ3RELFNBQU8sV0FBVyxJQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsU0FBUyxDQUFDO0NBQ3pEOzs7Ozs7Ozs7Ozs7QUFZRCxTQUFTLFNBQVMsQ0FDZCxLQUFZLEVBQ1osUUFBNEQsRUFDNUQsT0FBYSxFQUFPO0FBQ3RCLE1BQUksTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ2hCLE9BQUssQ0FBQyxJQUFJLENBQUMsVUFBUyxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRTtBQUN6QyxRQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLEVBQUU7QUFDakQsWUFBTSxHQUFHLEtBQUssQ0FBQztBQUNmLGFBQU8sSUFBSSxDQUFDO0tBQ2IsTUFBTTtBQUNMLGFBQU8sS0FBSyxDQUFDO0tBQ2Q7R0FDRixDQUFDLENBQUM7QUFDSCxTQUFPLE1BQU0sQ0FBQztDQUNmOztBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUc7QUFDZixNQUFJLEVBQUosSUFBSTtBQUNKLFdBQVMsRUFBVCxTQUFTO0FBQ1QsTUFBSSxFQUFKLElBQUk7Q0FDTCxDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLWZpbGUtdHJlZS9ub2RlX21vZHVsZXMvbnVjbGlkZS1jb21tb25zL2xpYi9hcnJheS5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbi8qKlxuICogU3RhdGljIG1ldGhvZCBhcyBkZWZpbmVkIGJ5XG4gKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9mcm9tLlxuICogQHBhcmFtIGFycmF5TGlrZSBBbiBhcnJheS1saWtlIG9yIGl0ZXJhYmxlIG9iamVjdCB0byBjb252ZXJ0IHRvIGFuIGFycmF5LlxuICogQHBhcmFtIG1hcEZuIE1hcCBmdW5jdGlvbiB0byBjYWxsIG9uIGV2ZXJ5IGVsZW1lbnQgb2YgdGhlIGFycmF5LlxuICogQHBhcmFtIHRoaXNBcmcgVmFsdWUgdG8gdXNlIGFzIGB0aGlzYCB3aGVuIGV4ZWN1dGluZyBgbWFwRm5gLlxuICovXG5mdW5jdGlvbiBmcm9tKGFycmF5TGlrZSwgbWFwRm4gPSB1bmRlZmluZWQsIHRoaXNBcmcgPSB1bmRlZmluZWQpOiBBcnJheSB7XG4gIGlmIChtYXBGbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbWFwRm4gPSBmdW5jdGlvbihhcmcpIHsgcmV0dXJuIGFyZzsgfTtcbiAgfVxuXG4gIC8vIE5vdGUgdGhhdCBTeW1ib2wgaXMgbm90IGRlZmluZWQgd2hlbiBydW5uaW5nIG9uIE5vZGUgMC4xMC54LlxuICBpZiAodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgIHR5cGVvZiBhcnJheUxpa2UgPT09ICdvYmplY3QnICYmXG4gICAgICB0eXBlb2YgYXJyYXlMaWtlW1N5bWJvbC5pdGVyYXRvcl0gPT09ICdmdW5jdGlvbicpIHtcbiAgICB2YXIgYXJyYXkgPSBbXTtcbiAgICBmb3IgKHZhciB2YWx1ZSBvZiBhcnJheUxpa2UpIHtcbiAgICAgIGFycmF5LnB1c2gobWFwRm4uY2FsbCh0aGlzQXJnLCB2YWx1ZSkpO1xuICAgIH1cbiAgICByZXR1cm4gYXJyYXk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGFycmF5TGlrZS5uZXh0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gU2VlIGlmIGFycmF5TGlrZSBjb25mb3JtcyB0byB0aGUgaXRlcmF0b3IgcHJvdG9jb2wuIE5vdGUgdGhhdCBvblxuICAgIC8vIE5vZGUgMC4xMC54LCB3aGVyZSB3ZSB1c2UgZXM2LWNvbGxlY3Rpb25zLCB0aGluZ3MgbGlrZSBNYXAuZW50cmllcygpIGFuZFxuICAgIC8vIFNldC52YWx1ZXMoKSB3aWxsIGZhbGwgaW50byB0aGlzIGNhc2UgcmF0aGVyIHRoYW4gdGhlIHByZXZpb3VzIGNhc2UuXG4gICAgdmFyIGFycmF5ID0gW107XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIHZhciB7ZG9uZSwgdmFsdWV9ID0gYXJyYXlMaWtlLm5leHQoKTtcbiAgICAgIGlmIChkb25lKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXJyYXkucHVzaChtYXBGbi5jYWxsKHRoaXNBcmcsIHZhbHVlKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhcnJheTtcbiAgfSBlbHNlIGlmICgnbGVuZ3RoJyBpbiBhcnJheUxpa2UpIHtcbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKGFycmF5TGlrZSwgbWFwRm4sIHRoaXNBcmcpO1xuICB9IGVsc2UgaWYgKGFycmF5TGlrZSBpbnN0YW5jZW9mIFNldCkge1xuICAgIC8vIEJhY2t1cCBsb2dpYyB0byBoYW5kbGUgdGhlIGVzNi1jb2xsZWN0aW9ucyBjYXNlLlxuICAgIHJldHVybiBmcm9tKGFycmF5TGlrZS52YWx1ZXMoKSwgbWFwRm4sIHRoaXNBcmcpO1xuICB9IGVsc2UgaWYgKGFycmF5TGlrZSBpbnN0YW5jZW9mIE1hcCkge1xuICAgIC8vIEJhY2t1cCBsb2dpYyB0byBoYW5kbGUgdGhlIGVzNi1jb2xsZWN0aW9ucyBjYXNlLlxuICAgIHJldHVybiBmcm9tKGFycmF5TGlrZS5lbnRyaWVzKCksIG1hcEZuLCB0aGlzQXJnKTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBFcnJvcihhcnJheUxpa2UgK1xuICAgICAgICAnIG11c3QgYmUgYW4gYXJyYXktbGlrZSBvciBpdGVyYWJsZSBvYmplY3QgdG8gY29udmVydCB0byBhbiBhcnJheS4nKTtcbiAgfVxufVxuXG4vKipcbiAqIEluc3RhbmNlIG1ldGhvZCBvZiBBcnJheSBhcyBkZWZpbmVkIGJ5XG4gKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9maW5kLlxuICogQmVjYXVzZSB3ZSBkbyBub3Qgd2FudCB0byBhZGQgZWxlbWVudHMgdG8gQXJyYXkucHJvdG90eXBlLCB3ZSBtYWtlIHRoaXMgYVxuICogc3RhdGljIG1ldGhvZCB0aGF0IHRha2VzIHRoZSBBcnJheSAod2hpY2ggd291bGQgYmUgdGhlIHJlY2VpdmVyIGlmIGl0IHdlcmUgYW5cbiAqIGluc3RhbmNlIG1ldGhvZCkgYXMgdGhlIGZpcnN0IGFyZ3VtZW50LlxuICogQHBhcmFtIGFycmF5IFRoZSBhcnJheSB0byBzZWFyY2guXG4gKiBAcGFyYW0gRnVuY3Rpb24gdG8gZXhlY3V0ZSBvbiBlYWNoIHZhbHVlIGluIHRoZSBhcnJheS5cbiAqIEBwYXJhbSBPYmplY3QgdG8gdXNlIGFzIGB0aGlzYCB3aGVuIGV4ZWN1dGluZyBgY2FsbGJhY2tgLlxuICovXG5mdW5jdGlvbiBmaW5kKFxuICAgIGFycmF5OiBBcnJheSxcbiAgICBjYWxsYmFjazogKGVsZW1lbnQ6IGFueSwgaW5kZXg6IG51bWJlciwgYXJyYXk6IEFycmF5KSA9PiBhbnksXG4gICAgdGhpc0FyZzogP2FueSk6IGFueSB7XG4gIHZhciByZXN1bHRJbmRleCA9IGZpbmRJbmRleChhcnJheSwgY2FsbGJhY2ssIHRoaXNBcmcpO1xuICByZXR1cm4gcmVzdWx0SW5kZXggPj0wID8gYXJyYXlbcmVzdWx0SW5kZXhdIDogdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIEluc3RhbmNlIG1ldGhvZCBvZiBBcnJheSBhcyBkZWZpbmVkIGJ5XG4gKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9maW5kSW5kZXguXG4gKiBCZWNhdXNlIHdlIGRvIG5vdCB3YW50IHRvIGFkZCBlbGVtZW50cyB0byBBcnJheS5wcm90b3R5cGUsIHdlIG1ha2UgdGhpcyBhXG4gKiBzdGF0aWMgbWV0aG9kIHRoYXQgdGFrZXMgdGhlIEFycmF5ICh3aGljaCB3b3VsZCBiZSB0aGUgcmVjZWl2ZXIgaWYgaXQgd2VyZSBhblxuICogaW5zdGFuY2UgbWV0aG9kKSBhcyB0aGUgZmlyc3QgYXJndW1lbnQuXG4gKiBAcGFyYW0gYXJyYXkgVGhlIGFycmF5IHRvIHNlYXJjaC5cbiAqIEBwYXJhbSBGdW5jdGlvbiB0byBleGVjdXRlIG9uIGVhY2ggdmFsdWUgaW4gdGhlIGFycmF5LlxuICogQHBhcmFtIE9iamVjdCB0byB1c2UgYXMgYHRoaXNgIHdoZW4gZXhlY3V0aW5nIGBjYWxsYmFja2AuXG4gKi9cbmZ1bmN0aW9uIGZpbmRJbmRleChcbiAgICBhcnJheTogQXJyYXksXG4gICAgY2FsbGJhY2s6IChlbGVtZW50OiBhbnksIGluZGV4OiBudW1iZXIsIGFycmF5OiBBcnJheSkgPT4gYW55LFxuICAgIHRoaXNBcmc6ID9hbnkpOiBhbnkge1xuICB2YXIgcmVzdWx0ID0gLTE7XG4gIGFycmF5LnNvbWUoZnVuY3Rpb24oZWxlbWVudCwgaW5kZXgsIGFycmF5KSB7XG4gICAgaWYgKGNhbGxiYWNrLmNhbGwodGhpc0FyZywgZWxlbWVudCwgaW5kZXgsIGFycmF5KSkge1xuICAgICAgcmVzdWx0ID0gaW5kZXg7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBmaW5kLFxuICBmaW5kSW5kZXgsXG4gIGZyb20sXG59O1xuIl19