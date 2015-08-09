'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

// NuclideUri's are either a local file path, or a URI
// of the form nuclide://<host>:<port><path>
//
// This package creates, queries and decomposes NuclideUris.

Object.defineProperty(exports, '__esModule', {
  value: true
});

var REMOTE_PATH_URI_PREFIX = 'nuclide://';

var pathPackage = require('path');

function isRemote(uri) {
  return uri.startsWith(REMOTE_PATH_URI_PREFIX);
}

function isLocal(uri) {
  return !isRemote(uri);
}

function createRemoteUri(hostname, remotePort, remotePath) {
  return 'nuclide://' + hostname + ':' + remotePort + remotePath;
}

function parse(uri) {
  return require('url').parse(uri);
}

function parseRemoteUri(remoteUri) {
  if (!isRemote(remoteUri)) {
    throw new Error('Expected remote uri. Got ' + remoteUri);
  }
  return require('url').parse(remoteUri);
}

function getPath(uri) {
  return parse(uri).path;
}

function getHostname(remoteUri) {
  return parseRemoteUri(remoteUri).hostname;
}

function getPort(remoteUri) {
  return Number(parseRemoteUri(remoteUri).port);
}

function join(uri) {
  for (var _len = arguments.length, relativePath = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    relativePath[_key - 1] = arguments[_key];
  }

  if (isRemote(uri)) {
    var _parseRemoteUri = parseRemoteUri(uri);

    var hostname = _parseRemoteUri.hostname;
    var port = _parseRemoteUri.port;
    var path = _parseRemoteUri.path;

    relativePath.splice(0, 0, path);
    return createRemoteUri(hostname, Number(port), pathPackage.join.apply(null, relativePath));
  } else {
    relativePath.splice(0, 0, uri);
    return pathPackage.join.apply(null, relativePath);
  }
}

function normalize(uri) {
  if (isRemote(uri)) {
    var _parseRemoteUri2 = parseRemoteUri(uri);

    var hostname = _parseRemoteUri2.hostname;
    var port = _parseRemoteUri2.port;
    var path = _parseRemoteUri2.path;

    return createRemoteUri(hostname, Number(port), pathPackage.normalize(path));
  } else {
    return pathPackage.normalize(uri);
  }
}

function getParent(uri) {
  // TODO: Is this different than dirname?
  return normalize(join(uri, '..'));
}

function relative(uri, other) {
  var remote = isRemote(uri);
  if (remote !== isRemote(other) || remote && getHostname(uri) !== getHostname(other)) {
    throw new Error('Cannot relative urls on different hosts.');
  }
  if (remote) {
    return pathPackage.relative(getPath(uri), getPath(other));
  } else {
    return pathPackage.relative(uri, other);
  }
}

// TODO: Add optional ext parameter
function basename(uri) {
  if (isRemote(uri)) {
    return pathPackage.basename(getPath(uri));
  } else {
    return pathPackage.basename(uri);
  }
}

function dirname(uri) {
  if (isRemote(uri)) {
    var _parseRemoteUri3 = parseRemoteUri(uri);

    var hostname = _parseRemoteUri3.hostname;
    var port = _parseRemoteUri3.port;
    var path = _parseRemoteUri3.path;

    return createRemoteUri(hostname, Number(port), pathPackage.dirname(path));
  } else {
    return pathPackage.dirname(uri);
  }
}

/**
 * uri is either a file: uri, or a nuclide: uri.
 * must convert file: uri's to just a path for atom.
 *
 * Returns null if not a valid file: URI.
 */
function uriToNuclideUri(uri) {
  var urlParts = require('url').parse(uri, false);
  if (urlParts.protocol === 'file:' && urlParts.path) {
    // only handle real files for now.
    return urlParts.path;
  } else if (isRemote(uri)) {
    return uri;
  } else {
    return null;
  }
}

/**
 * Converts local paths to file: URI's. Leaves remote URI's alone.
 */
function nuclideUriToUri(uri) {
  if (isRemote(uri)) {
    return uri;
  } else {
    return 'file://' + uri;
  }
}

module.exports = {
  basename: basename,
  dirname: dirname,
  isRemote: isRemote,
  isLocal: isLocal,
  createRemoteUri: createRemoteUri,
  parse: parse,
  parseRemoteUri: parseRemoteUri,
  getPath: getPath,
  getHostname: getHostname,
  getPort: getPort,
  join: join,
  relative: relative,
  normalize: normalize,
  getParent: getParent,
  uriToNuclideUri: uriToNuclideUri,
  nuclideUriToUri: nuclideUriToUri
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9ub2RlX21vZHVsZXMvbnVjbGlkZS1yZW1vdGUtdXJpL2xpYi9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQlosSUFBSSxzQkFBc0IsR0FBRyxZQUFZLENBQUM7O0FBRTFDLElBQUksV0FBVyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQzs7QUFFbEMsU0FBUyxRQUFRLENBQUMsR0FBZSxFQUFXO0FBQzFDLFNBQU8sR0FBRyxDQUFDLFVBQVUsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0NBQy9DOztBQUVELFNBQVMsT0FBTyxDQUFDLEdBQWUsRUFBVztBQUN6QyxTQUFPLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ3ZCOztBQUVELFNBQVMsZUFBZSxDQUFDLFFBQWdCLEVBQUUsVUFBa0IsRUFBRSxVQUFrQixFQUFVO0FBQ3pGLHdCQUFvQixRQUFRLFNBQUksVUFBVSxHQUFHLFVBQVUsQ0FBRztDQUMzRDs7QUFFRCxTQUFTLEtBQUssQ0FBQyxHQUFlLEVBQXVEO0FBQ25GLFNBQU8sT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNsQzs7QUFFRCxTQUFTLGNBQWMsQ0FBQyxTQUFxQixFQUFxRDtBQUNoRyxNQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFFO0FBQ3hCLFVBQU0sSUFBSSxLQUFLLENBQUMsMkJBQTJCLEdBQUcsU0FBUyxDQUFDLENBQUM7R0FDMUQ7QUFDRCxTQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7Q0FDeEM7O0FBRUQsU0FBUyxPQUFPLENBQUMsR0FBZSxFQUFVO0FBQ3hDLFNBQU8sS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElB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QUFDZCxTQUFPLEVBQVAsT0FBTztBQUNQLGFBQVcsRUFBWCxXQUFXO0FBQ1gsU0FBTyxFQUFQLE9BQU87QUFDUCxNQUFJLEVBQUosSUFBSTtBQUNKLFVBQVEsRUFBUixRQUFRO0FBQ1IsV0FBUyxFQUFULFNBQVM7QUFDVCxXQUFTLEVBQVQsU0FBUztBQUNULGlCQUFlLEVBQWYsZUFBZTtBQUNmLGlCQUFlLEVBQWYsZUFBZTtDQUNoQixDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9ub2RlX21vZHVsZXMvbnVjbGlkZS1yZW1vdGUtdXJpL2xpYi9tYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxuLy8gTnVjbGlkZVVyaSdzIGFyZSBlaXRoZXIgYSBsb2NhbCBmaWxlIHBhdGgsIG9yIGEgVVJJXG4vLyBvZiB0aGUgZm9ybSBudWNsaWRlOi8vPGhvc3Q+Ojxwb3J0PjxwYXRoPlxuLy9cbi8vIFRoaXMgcGFja2FnZSBjcmVhdGVzLCBxdWVyaWVzIGFuZCBkZWNvbXBvc2VzIE51Y2xpZGVVcmlzLlxuXG5leHBvcnQgdHlwZSBOdWNsaWRlVXJpID0gc3RyaW5nO1xuXG52YXIgUkVNT1RFX1BBVEhfVVJJX1BSRUZJWCA9ICdudWNsaWRlOi8vJztcblxudmFyIHBhdGhQYWNrYWdlID0gcmVxdWlyZSgncGF0aCcpO1xuXG5mdW5jdGlvbiBpc1JlbW90ZSh1cmk6IE51Y2xpZGVVcmkpOiBib29sZWFuIHtcbiAgcmV0dXJuIHVyaS5zdGFydHNXaXRoKFJFTU9URV9QQVRIX1VSSV9QUkVGSVgpO1xufVxuXG5mdW5jdGlvbiBpc0xvY2FsKHVyaTogTnVjbGlkZVVyaSk6IGJvb2xlYW4ge1xuICByZXR1cm4gIWlzUmVtb3RlKHVyaSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlbW90ZVVyaShob3N0bmFtZTogc3RyaW5nLCByZW1vdGVQb3J0OiBudW1iZXIsIHJlbW90ZVBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBgbnVjbGlkZTovLyR7aG9zdG5hbWV9OiR7cmVtb3RlUG9ydH0ke3JlbW90ZVBhdGh9YDtcbn1cblxuZnVuY3Rpb24gcGFyc2UodXJpOiBOdWNsaWRlVXJpKTogeyBob3N0bmFtZTogP3N0cmluZzsgcG9ydDogP3N0cmluZzsgcGF0aDogc3RyaW5nOyB9IHtcbiAgcmV0dXJuIHJlcXVpcmUoJ3VybCcpLnBhcnNlKHVyaSk7XG59XG5cbmZ1bmN0aW9uIHBhcnNlUmVtb3RlVXJpKHJlbW90ZVVyaTogTnVjbGlkZVVyaSk6IHsgaG9zdG5hbWU6IHN0cmluZzsgcG9ydDogc3RyaW5nOyBwYXRoOiBzdHJpbmc7IH0ge1xuICBpZiAoIWlzUmVtb3RlKHJlbW90ZVVyaSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0V4cGVjdGVkIHJlbW90ZSB1cmkuIEdvdCAnICsgcmVtb3RlVXJpKTtcbiAgfVxuICByZXR1cm4gcmVxdWlyZSgndXJsJykucGFyc2UocmVtb3RlVXJpKTtcbn1cblxuZnVuY3Rpb24gZ2V0UGF0aCh1cmk6IE51Y2xpZGVVcmkpOiBzdHJpbmcge1xuICByZXR1cm4gcGFyc2UodXJpKS5wYXRoO1xufVxuXG5mdW5jdGlvbiBnZXRIb3N0bmFtZShyZW1vdGVVcmk6IE51Y2xpZGVVcmkpOiBzdHJpbmcge1xuICByZXR1cm4gcGFyc2VSZW1vdGVVcmkocmVtb3RlVXJpKS5ob3N0bmFtZTtcbn1cblxuZnVuY3Rpb24gZ2V0UG9ydChyZW1vdGVVcmk6IE51Y2xpZGVVcmkpOiBudW1iZXIge1xuICByZXR1cm4gTnVtYmVyKHBhcnNlUmVtb3RlVXJpKHJlbW90ZVVyaSkucG9ydCk7XG59XG5cbmZ1bmN0aW9uIGpvaW4odXJpOiBOdWNsaWRlVXJpLCAuLi5yZWxhdGl2ZVBhdGg6IEFycmF5PHN0cmluZz4pIHtcbiAgaWYgKGlzUmVtb3RlKHVyaSkpIHtcbiAgICB2YXIge2hvc3RuYW1lLCBwb3J0LCBwYXRofSA9IHBhcnNlUmVtb3RlVXJpKHVyaSk7XG4gICAgcmVsYXRpdmVQYXRoLnNwbGljZSgwLCAwLCBwYXRoKTtcbiAgICByZXR1cm4gY3JlYXRlUmVtb3RlVXJpKFxuICAgICAgaG9zdG5hbWUsXG4gICAgICBOdW1iZXIocG9ydCksXG4gICAgICBwYXRoUGFja2FnZS5qb2luLmFwcGx5KG51bGwsIHJlbGF0aXZlUGF0aCkpO1xuICB9IGVsc2Uge1xuICAgIHJlbGF0aXZlUGF0aC5zcGxpY2UoMCwgMCwgdXJpKTtcbiAgICByZXR1cm4gcGF0aFBhY2thZ2Uuam9pbi5hcHBseShudWxsLCByZWxhdGl2ZVBhdGgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZSh1cmk6IE51Y2xpZGVVcmkpOiBOdWNsaWRlVXJpIHtcbiAgaWYgKGlzUmVtb3RlKHVyaSkpIHtcbiAgICB2YXIge2hvc3RuYW1lLCBwb3J0LCBwYXRofSA9IHBhcnNlUmVtb3RlVXJpKHVyaSk7XG4gICAgcmV0dXJuIGNyZWF0ZVJlbW90ZVVyaShcbiAgICAgIGhvc3RuYW1lLFxuICAgICAgTnVtYmVyKHBvcnQpLFxuICAgICAgcGF0aFBhY2thZ2Uubm9ybWFsaXplKHBhdGgpKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcGF0aFBhY2thZ2Uubm9ybWFsaXplKHVyaSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0UGFyZW50KHVyaTogTnVjbGlkZVVyaSk6IE51Y2xpZGVVcmkge1xuICAvLyBUT0RPOiBJcyB0aGlzIGRpZmZlcmVudCB0aGFuIGRpcm5hbWU/XG4gIHJldHVybiBub3JtYWxpemUoam9pbih1cmksICcuLicpKTtcbn1cblxuZnVuY3Rpb24gcmVsYXRpdmUodXJpOiBOdWNsaWRlVXJpLCBvdGhlcjogTnVjbGlkZVVyaSk6IHN0cmluZyB7XG4gIHZhciByZW1vdGUgPSBpc1JlbW90ZSh1cmkpO1xuICBpZiAocmVtb3RlICE9PSBpc1JlbW90ZShvdGhlcikgfHxcbiAgICAgIChyZW1vdGUgJiYgZ2V0SG9zdG5hbWUodXJpKSAhPT0gZ2V0SG9zdG5hbWUob3RoZXIpKSkge1xuICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHJlbGF0aXZlIHVybHMgb24gZGlmZmVyZW50IGhvc3RzLicpO1xuICB9XG4gIGlmIChyZW1vdGUpIHtcbiAgICByZXR1cm4gcGF0aFBhY2thZ2UucmVsYXRpdmUoZ2V0UGF0aCh1cmkpLCBnZXRQYXRoKG90aGVyKSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHBhdGhQYWNrYWdlLnJlbGF0aXZlKHVyaSwgb3RoZXIpO1xuICB9XG59XG5cbi8vIFRPRE86IEFkZCBvcHRpb25hbCBleHQgcGFyYW1ldGVyXG5mdW5jdGlvbiBiYXNlbmFtZSh1cmk6IE51Y2xpZGVVcmkpOiBOdWNsaWRlVXJpIHtcbiAgaWYgKGlzUmVtb3RlKHVyaSkpIHtcbiAgICByZXR1cm4gcGF0aFBhY2thZ2UuYmFzZW5hbWUoZ2V0UGF0aCh1cmkpKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcGF0aFBhY2thZ2UuYmFzZW5hbWUodXJpKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBkaXJuYW1lKHVyaTogTnVjbGlkZVVyaSk6IE51Y2xpZGVVcmkge1xuICBpZiAoaXNSZW1vdGUodXJpKSkge1xuICAgIHZhciB7aG9zdG5hbWUsIHBvcnQsIHBhdGh9ID0gcGFyc2VSZW1vdGVVcmkodXJpKTtcbiAgICByZXR1cm4gY3JlYXRlUmVtb3RlVXJpKFxuICAgICAgaG9zdG5hbWUsXG4gICAgICBOdW1iZXIocG9ydCksXG4gICAgICBwYXRoUGFja2FnZS5kaXJuYW1lKHBhdGgpKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcGF0aFBhY2thZ2UuZGlybmFtZSh1cmkpO1xuICB9XG59XG5cbi8qKlxuICogdXJpIGlzIGVpdGhlciBhIGZpbGU6IHVyaSwgb3IgYSBudWNsaWRlOiB1cmkuXG4gKiBtdXN0IGNvbnZlcnQgZmlsZTogdXJpJ3MgdG8ganVzdCBhIHBhdGggZm9yIGF0b20uXG4gKlxuICogUmV0dXJucyBudWxsIGlmIG5vdCBhIHZhbGlkIGZpbGU6IFVSSS5cbiAqL1xuZnVuY3Rpb24gdXJpVG9OdWNsaWRlVXJpKHVyaTogc3RyaW5nKTogP3N0cmluZyB7XG4gIHZhciB1cmxQYXJ0cyA9IHJlcXVpcmUoJ3VybCcpLnBhcnNlKHVyaSwgZmFsc2UpO1xuICBpZiAodXJsUGFydHMucHJvdG9jb2wgPT09ICdmaWxlOicgJiYgdXJsUGFydHMucGF0aCkgeyAvLyBvbmx5IGhhbmRsZSByZWFsIGZpbGVzIGZvciBub3cuXG4gICAgcmV0dXJuIHVybFBhcnRzLnBhdGg7XG4gIH0gZWxzZSBpZiAoaXNSZW1vdGUodXJpKSkge1xuICAgIHJldHVybiB1cmk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBsb2NhbCBwYXRocyB0byBmaWxlOiBVUkkncy4gTGVhdmVzIHJlbW90ZSBVUkkncyBhbG9uZS5cbiAqL1xuZnVuY3Rpb24gbnVjbGlkZVVyaVRvVXJpKHVyaTogTnVjbGlkZVVyaSk6IHN0cmluZyB7XG4gIGlmIChpc1JlbW90ZSh1cmkpKSB7XG4gICAgcmV0dXJuIHVyaTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gJ2ZpbGU6Ly8nICsgdXJpO1xuICB9XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGJhc2VuYW1lLFxuICBkaXJuYW1lLFxuICBpc1JlbW90ZSxcbiAgaXNMb2NhbCxcbiAgY3JlYXRlUmVtb3RlVXJpLFxuICBwYXJzZSxcbiAgcGFyc2VSZW1vdGVVcmksXG4gIGdldFBhdGgsXG4gIGdldEhvc3RuYW1lLFxuICBnZXRQb3J0LFxuICBqb2luLFxuICByZWxhdGl2ZSxcbiAgbm9ybWFsaXplLFxuICBnZXRQYXJlbnQsXG4gIHVyaVRvTnVjbGlkZVVyaSxcbiAgbnVjbGlkZVVyaVRvVXJpLFxufTtcbiJdfQ==