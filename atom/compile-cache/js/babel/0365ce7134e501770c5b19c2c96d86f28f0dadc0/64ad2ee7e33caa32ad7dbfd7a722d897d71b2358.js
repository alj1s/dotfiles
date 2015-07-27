'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var fs = require('fs');
var path = require('path');

var TEST_VERSION = 'test-version';
var version;

/*
 * This is the versioning of Nuclide client-server protocol.
 * It is not a communication protocol per se. It is the sum of communication and
 * services API.
 *
 * First, no commit shall break the protocol in that client and server
 * from the same master shall always work with each other.
 * That means, no client new feature shall be enabled before the dependent
 * server serice is in place, while it is OK to add a new server service before
 * the client is ready.
 *
 * Rule number two. Every commit that breaks the backward compatibility shall
 * bump the version in version.json. This includes any client changes
 * (new feature or whatever) that do not work with the older servers.
 * It also includes server changes that break older clients.
 */
function getVersion() {
  if (!version) {
    try {
      // TODO: The reason we are using version.json file is for our Python
      // server scripts to read and parse. We shall at one point rewrite our
      // Python scripts in Node, and then we can hard code the version in code,
      // instead of reading from the json file.
      //
      // Cannot use require() who counts on extension (.json) for parsing file as json.
      var json = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../version.json')));
      version = json.Version.toString();
    } catch (e) {
      version = TEST_VERSION;
      // No VERSION_INFO file, no version. e.g. in your development env.
    }
  }
  return version;
}

module.exports = {
  getVersion: getVersion
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9ub2RlX21vZHVsZXMvbnVjbGlkZS1yZW1vdGUtY29ubmVjdGlvbi9ub2RlX21vZHVsZXMvbnVjbGlkZS12ZXJzaW9uL2xpYi9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7QUFXWixJQUFJLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDdkIsSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDOztBQUUzQixJQUFNLFlBQVksR0FBRyxjQUFjLENBQUM7QUFDcEMsSUFBSSxPQUFPLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtCWixTQUFTLFVBQVUsR0FBVztBQUM1QixNQUFJLENBQUMsT0FBTyxFQUFFO0FBQ1osUUFBSTs7Ozs7OztBQU9GLFVBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNuRixhQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztLQUNuQyxDQUFDLE9BQU8sQ0FBQyxFQUFFO0FBQ1YsYUFBTyxHQUFHLFlBQVksQ0FBQzs7S0FFeEI7R0FDRjtBQUNELFNBQU8sT0FBTyxDQUFDO0NBQ2hCOztBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUc7QUFDZixZQUFVLEVBQVYsVUFBVTtDQUNYLENBQUEiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL251Y2xpZGUtcmVtb3RlLXByb2plY3RzL25vZGVfbW9kdWxlcy9udWNsaWRlLXJlbW90ZS1jb25uZWN0aW9uL25vZGVfbW9kdWxlcy9udWNsaWRlLXZlcnNpb24vbGliL21haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIgZnMgPSByZXF1aXJlKCdmcycpO1xudmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5cbmNvbnN0IFRFU1RfVkVSU0lPTiA9ICd0ZXN0LXZlcnNpb24nO1xudmFyIHZlcnNpb247XG5cbi8qXG4gKiBUaGlzIGlzIHRoZSB2ZXJzaW9uaW5nIG9mIE51Y2xpZGUgY2xpZW50LXNlcnZlciBwcm90b2NvbC5cbiAqIEl0IGlzIG5vdCBhIGNvbW11bmljYXRpb24gcHJvdG9jb2wgcGVyIHNlLiBJdCBpcyB0aGUgc3VtIG9mIGNvbW11bmljYXRpb24gYW5kXG4gKiBzZXJ2aWNlcyBBUEkuXG4gKlxuICogRmlyc3QsIG5vIGNvbW1pdCBzaGFsbCBicmVhayB0aGUgcHJvdG9jb2wgaW4gdGhhdCBjbGllbnQgYW5kIHNlcnZlclxuICogZnJvbSB0aGUgc2FtZSBtYXN0ZXIgc2hhbGwgYWx3YXlzIHdvcmsgd2l0aCBlYWNoIG90aGVyLlxuICogVGhhdCBtZWFucywgbm8gY2xpZW50IG5ldyBmZWF0dXJlIHNoYWxsIGJlIGVuYWJsZWQgYmVmb3JlIHRoZSBkZXBlbmRlbnRcbiAqIHNlcnZlciBzZXJpY2UgaXMgaW4gcGxhY2UsIHdoaWxlIGl0IGlzIE9LIHRvIGFkZCBhIG5ldyBzZXJ2ZXIgc2VydmljZSBiZWZvcmVcbiAqIHRoZSBjbGllbnQgaXMgcmVhZHkuXG4gKlxuICogUnVsZSBudW1iZXIgdHdvLiBFdmVyeSBjb21taXQgdGhhdCBicmVha3MgdGhlIGJhY2t3YXJkIGNvbXBhdGliaWxpdHkgc2hhbGxcbiAqIGJ1bXAgdGhlIHZlcnNpb24gaW4gdmVyc2lvbi5qc29uLiBUaGlzIGluY2x1ZGVzIGFueSBjbGllbnQgY2hhbmdlc1xuICogKG5ldyBmZWF0dXJlIG9yIHdoYXRldmVyKSB0aGF0IGRvIG5vdCB3b3JrIHdpdGggdGhlIG9sZGVyIHNlcnZlcnMuXG4gKiBJdCBhbHNvIGluY2x1ZGVzIHNlcnZlciBjaGFuZ2VzIHRoYXQgYnJlYWsgb2xkZXIgY2xpZW50cy5cbiAqL1xuZnVuY3Rpb24gZ2V0VmVyc2lvbigpOiBzdHJpbmcge1xuICBpZiAoIXZlcnNpb24pIHtcbiAgICB0cnkge1xuICAgICAgLy8gVE9ETzogVGhlIHJlYXNvbiB3ZSBhcmUgdXNpbmcgdmVyc2lvbi5qc29uIGZpbGUgaXMgZm9yIG91ciBQeXRob25cbiAgICAgIC8vIHNlcnZlciBzY3JpcHRzIHRvIHJlYWQgYW5kIHBhcnNlLiBXZSBzaGFsbCBhdCBvbmUgcG9pbnQgcmV3cml0ZSBvdXJcbiAgICAgIC8vIFB5dGhvbiBzY3JpcHRzIGluIE5vZGUsIGFuZCB0aGVuIHdlIGNhbiBoYXJkIGNvZGUgdGhlIHZlcnNpb24gaW4gY29kZSxcbiAgICAgIC8vIGluc3RlYWQgb2YgcmVhZGluZyBmcm9tIHRoZSBqc29uIGZpbGUuXG4gICAgICAvL1xuICAgICAgLy8gQ2Fubm90IHVzZSByZXF1aXJlKCkgd2hvIGNvdW50cyBvbiBleHRlbnNpb24gKC5qc29uKSBmb3IgcGFyc2luZyBmaWxlIGFzIGpzb24uXG4gICAgICB2YXIganNvbiA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi92ZXJzaW9uLmpzb24nKSkpO1xuICAgICAgdmVyc2lvbiA9IGpzb24uVmVyc2lvbi50b1N0cmluZygpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHZlcnNpb24gPSBURVNUX1ZFUlNJT047XG4gICAgICAvLyBObyBWRVJTSU9OX0lORk8gZmlsZSwgbm8gdmVyc2lvbi4gZS5nLiBpbiB5b3VyIGRldmVsb3BtZW50IGVudi5cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZlcnNpb247XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBnZXRWZXJzaW9uLFxufVxuIl19