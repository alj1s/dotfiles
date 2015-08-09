'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _require = require('./service-manager');

var getService = _require.getService;
var getServiceByNuclideUri = _require.getServiceByNuclideUri;

var localClients = {};

var _require2 = require('nuclide-remote-connection');

var RemoteConnection = _require2.RemoteConnection;

var localEventBus = null;

var _require3 = require('./utils');

var containsPath = _require3.containsPath;

var _require4 = require('nuclide-remote-uri');

var isRemote = _require4.isRemote;

module.exports = {
  getClient: function getClient(path) {
    if (isRemote(path)) {
      var connection = RemoteConnection.getForUri(path);
      return connection ? connection.getClient() : null;
    } else {
      var localClient = null;
      if (!localEventBus) {
        var NuclideLocalEventbus = require('nuclide-server/lib/NuclideLocalEventbus');
        localEventBus = new NuclideLocalEventbus();
      }
      atom.project.getPaths().forEach(function (rootPath) {
        if (!containsPath(rootPath, path)) {
          return;
        }
        // Create a local client with its root as the working directory, if none already exists.
        if (!localClients[rootPath]) {
          var NuclideClient = require('nuclide-server/lib/NuclideClient');

          localClients[rootPath] = new NuclideClient(
          /*id: string*/'local',
          /*eventbus: NuclideLocalEventBus*/localEventBus,
          /*options: NuclideClientOptions*/{ cwd: rootPath });
        }
        localClient = localClients[rootPath];
      });
      return localClient;
    }
  },
  getService: getService,
  getServiceByNuclideUri: getServiceByNuclideUri
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9ub2RlX21vZHVsZXMvbnVjbGlkZS1jbGllbnQvbGliL21haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7OztlQVcrQixPQUFPLENBQUMsbUJBQW1CLENBQUM7O0lBQWxFLFVBQVUsWUFBVixVQUFVO0lBQUUsc0JBQXNCLFlBQXRCLHNCQUFzQjs7QUFDdkMsSUFBSSxZQUFpRCxHQUFHLEVBQUUsQ0FBQzs7Z0JBQ2xDLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQzs7SUFBeEQsZ0JBQWdCLGFBQWhCLGdCQUFnQjs7QUFDckIsSUFBSSxhQUFvQyxHQUFHLElBQUksQ0FBQzs7Z0JBQzNCLE9BQU8sQ0FBQyxTQUFTLENBQUM7O0lBQWxDLFlBQVksYUFBWixZQUFZOztnQkFDQSxPQUFPLENBQUMsb0JBQW9CLENBQUM7O0lBQXpDLFFBQVEsYUFBUixRQUFROztBQUViLE1BQU0sQ0FBQyxPQUFPLEdBQUc7QUFDZixXQUFTLEVBQUEsbUJBQUMsSUFBWSxFQUFrQjtBQUN0QyxRQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUNsQixVQUFJLFVBQVUsR0FBRyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDbEQsYUFBTyxVQUFVLEdBQUcsVUFBVSxDQUFDLFNBQVMsRUFBRSxHQUFHLElBQUksQ0FBQztLQUNuRCxNQUFNO0FBQ0wsVUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDO0FBQ3ZCLFVBQUksQ0FBQyxhQUFhLEVBQUU7QUFDbEIsWUFBSSxvQkFBb0IsR0FBRyxPQUFPLENBQUMseUNBQXlDLENBQUMsQ0FBQztBQUM5RSxxQkFBYSxHQUFHLElBQUksb0JBQW9CLEVBQUUsQ0FBQztPQUM1QztBQUNELFVBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDLFVBQUEsUUFBUSxFQUFJO0FBQzFDLFlBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxFQUFFO0FBQ2pDLGlCQUFPO1NBQ1I7O0FBRUQsWUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsRUFBRTtBQUMzQixjQUFJLGFBQWEsR0FBRyxPQUFPLENBQUMsa0NBQWtDLENBQUMsQ0FBQzs7QUFHaEUsc0JBQVksQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLGFBQWE7d0JBQ3pCLE9BQU87NENBQ2EsYUFBYTsyQ0FDZCxFQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUMsQ0FDbEQsQ0FBQztTQUNIO0FBQ0QsbUJBQVcsR0FBRyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7T0FDdEMsQ0FBQyxDQUFDO0FBQ0gsYUFBTyxXQUFXLENBQUM7S0FDcEI7R0FDRjtBQUNELFlBQVUsRUFBVixVQUFVO0FBQ1Ysd0JBQXNCLEVBQXRCLHNCQUFzQjtDQUN2QixDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9ub2RlX21vZHVsZXMvbnVjbGlkZS1jbGllbnQvbGliL21haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIge2dldFNlcnZpY2UsIGdldFNlcnZpY2VCeU51Y2xpZGVVcml9ID0gcmVxdWlyZSgnLi9zZXJ2aWNlLW1hbmFnZXInKTtcbnZhciBsb2NhbENsaWVudHM6IHtbcm9vdFBhdGg6IHN0cmluZ106IE51Y2xpZGVDbGllbnR9ID0ge307XG52YXIge1JlbW90ZUNvbm5lY3Rpb259ID0gcmVxdWlyZSgnbnVjbGlkZS1yZW1vdGUtY29ubmVjdGlvbicpO1xudmFyIGxvY2FsRXZlbnRCdXM6ID9OdWNsaWRlTG9jYWxFdmVudGJ1cyA9IG51bGw7XG52YXIge2NvbnRhaW5zUGF0aH0gPSByZXF1aXJlKCcuL3V0aWxzJyk7XG52YXIge2lzUmVtb3RlfSA9IHJlcXVpcmUoJ251Y2xpZGUtcmVtb3RlLXVyaScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ2V0Q2xpZW50KHBhdGg6IHN0cmluZyk6ID9OdWNsaWRlQ2xpZW50IHtcbiAgICBpZiAoaXNSZW1vdGUocGF0aCkpIHtcbiAgICAgIHZhciBjb25uZWN0aW9uID0gUmVtb3RlQ29ubmVjdGlvbi5nZXRGb3JVcmkocGF0aCk7XG4gICAgICByZXR1cm4gY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0Q2xpZW50KCkgOiBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgbG9jYWxDbGllbnQgPSBudWxsO1xuICAgICAgaWYgKCFsb2NhbEV2ZW50QnVzKSB7XG4gICAgICAgIHZhciBOdWNsaWRlTG9jYWxFdmVudGJ1cyA9IHJlcXVpcmUoJ251Y2xpZGUtc2VydmVyL2xpYi9OdWNsaWRlTG9jYWxFdmVudGJ1cycpO1xuICAgICAgICBsb2NhbEV2ZW50QnVzID0gbmV3IE51Y2xpZGVMb2NhbEV2ZW50YnVzKCk7XG4gICAgICB9XG4gICAgICBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKS5mb3JFYWNoKHJvb3RQYXRoID0+IHtcbiAgICAgICAgaWYgKCFjb250YWluc1BhdGgocm9vdFBhdGgsIHBhdGgpKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIENyZWF0ZSBhIGxvY2FsIGNsaWVudCB3aXRoIGl0cyByb290IGFzIHRoZSB3b3JraW5nIGRpcmVjdG9yeSwgaWYgbm9uZSBhbHJlYWR5IGV4aXN0cy5cbiAgICAgICAgaWYgKCFsb2NhbENsaWVudHNbcm9vdFBhdGhdKSB7XG4gICAgICAgICAgdmFyIE51Y2xpZGVDbGllbnQgPSByZXF1aXJlKCdudWNsaWRlLXNlcnZlci9saWIvTnVjbGlkZUNsaWVudCcpO1xuXG5cbiAgICAgICAgICBsb2NhbENsaWVudHNbcm9vdFBhdGhdID0gbmV3IE51Y2xpZGVDbGllbnQoXG4gICAgICAgICAgICAvKmlkOiBzdHJpbmcqLyAnbG9jYWwnLFxuICAgICAgICAgICAgLypldmVudGJ1czogTnVjbGlkZUxvY2FsRXZlbnRCdXMqLyBsb2NhbEV2ZW50QnVzLFxuICAgICAgICAgICAgLypvcHRpb25zOiBOdWNsaWRlQ2xpZW50T3B0aW9ucyovIHtjd2Q6IHJvb3RQYXRofVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgbG9jYWxDbGllbnQgPSBsb2NhbENsaWVudHNbcm9vdFBhdGhdO1xuICAgICAgfSk7XG4gICAgICByZXR1cm4gbG9jYWxDbGllbnQ7XG4gICAgfVxuICB9LFxuICBnZXRTZXJ2aWNlLFxuICBnZXRTZXJ2aWNlQnlOdWNsaWRlVXJpLFxufTtcbiJdfQ==