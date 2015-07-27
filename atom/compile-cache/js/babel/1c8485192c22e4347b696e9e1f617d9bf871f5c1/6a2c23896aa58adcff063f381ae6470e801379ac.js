var utils_1 = require('../lang/utils');
var packageName = 'atom-typescript';
function getConfig(nameLambda) {
    return atom.config.get(packageName + '.' + utils_1.getName(nameLambda));
}
var Config = (function () {
    function Config() {
        this.schema = {
            debugAtomTs: {
                title: 'Debug: Atom-TypeScript. Please do not use.',
                type: 'boolean',
                'default': false
            },
            preferredQuoteCharacter: {
                title: 'Preferred quote character',
                type: 'string',
                'default': 'none'
            },
            typescriptServices: {
                title: 'Full path (including file name) to a custom `typescriptServices.js`',
                type: 'string',
                'default': ''
            },
            showFileSemanticView: {
                title: '',
                type: 'boolean',
                'default': true
            }
        };
    }
    Object.defineProperty(Config.prototype, 'debugAtomTs', {
        get: function get() {
            var _this = this;
            return getConfig(function () {
                return _this.schema.debugAtomTs;
            });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Config.prototype, 'preferredQuoteCharacter', {
        get: function get() {
            var _this = this;
            return getConfig(function () {
                return _this.schema.preferredQuoteCharacter;
            });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Config.prototype, 'typescriptServices', {
        get: function get() {
            var _this = this;
            return getConfig(function () {
                return _this.schema.typescriptServices;
            });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Config.prototype, 'showFileSemanticView', {
        get: function get() {
            var _this = this;
            return getConfig(function () {
                return _this.schema.showFileSemanticView;
            });
        },
        enumerable: true,
        configurable: true
    });
    return Config;
})();
var config = new Config();
module.exports = config;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9hdG9tLXR5cGVzY3JpcHQvZGlzdC9tYWluL2F0b20vYXRvbUNvbmZpZy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFJLE9BQU8sR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7QUFDdkMsSUFBSSxXQUFXLEdBQUcsaUJBQWlCLENBQUM7QUFDcEMsU0FBUyxTQUFTLENBQUMsVUFBVSxFQUFFO0FBQzNCLFdBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxHQUFHLEdBQUcsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7Q0FDM0U7QUFDRCxJQUFJLE1BQU0sR0FBRyxDQUFDLFlBQVk7QUFDdEIsYUFBUyxNQUFNLEdBQUc7QUFDZCxZQUFJLENBQUMsTUFBTSxHQUFHO0FBQ1YsdUJBQVcsRUFBRTtBQUNULHFCQUFLLEVBQUUsNENBQTRDO0FBQ25ELG9CQUFJLEVBQUUsU0FBUztBQUNmLDJCQUFTLEtBQUs7YUFDakI7QUFDRCxtQ0FBdUIsRUFBRTtBQUNyQixxQkFBSyxFQUFFLDJCQUEyQjtBQUNsQyxvQkFBSSxFQUFFLFFBQVE7QUFDZCwyQkFBUyxNQUFNO2FBQ2xCO0FBQ0QsOEJBQWtCLEVBQUU7QUFDaEIscUJBQUssRUFBRSxxRUFBcUU7QUFDNUUsb0JBQUksRUFBRSxRQUFRO0FBQ2QsMkJBQVMsRUFBRTthQUNkO0FBQ0QsZ0NBQW9CLEVBQUU7QUFDbEIscUJBQUssRUFBRSxFQUFFO0FBQ1Qsb0JBQUksRUFBRSxTQUFTO0FBQ2YsMkJBQVMsSUFBSTthQUNoQjtTQUNKLENBQUM7S0FDTDtBQUNELFVBQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxhQUFhLEVBQUU7QUFDbkQsV0FBRyxFQUFFLGVBQVk7QUFDYixnQkFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDO0FBQ2pCLG1CQUFPLFNBQVMsQ0FBQyxZQUFZO0FBQUUsdUJBQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUM7YUFBRSxDQUFDLENBQUM7U0FDdEU7QUFDRCxrQkFBVSxFQUFFLElBQUk7QUFDaEIsb0JBQVksRUFBRSxJQUFJO0tBQ3JCLENBQUMsQ0FBQztBQUNILFVBQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSx5QkFBeUIsRUFBRTtBQUMvRCxXQUFHLEVBQUUsZUFBWTtBQUNiLGdCQUFJLEtBQUssR0FBRyxJQUFJLENBQUM7QUFDakIsbUJBQU8sU0FBUyxDQUFDLFlBQVk7QUFBRSx1QkFBTyxLQUFLLENBQUMsTUFBTSxDQUFDLHVCQUF1QixDQUFDO2FBQUUsQ0FBQyxDQUFDO1NBQ2xGO0FBQ0Qsa0JBQVUsRUFBRSxJQUFJO0FBQ2hCLG9CQUFZLEVBQUUsSUFBSTtLQUNyQixDQUFDLENBQUM7QUFDSCxVQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsb0JBQW9CLEVBQUU7QUFDMUQsV0FBRyxFQUFFLGVBQVk7QUFDYixnQkFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDO0FBQ2pCLG1CQUFPLFNBQVMsQ0FBQyxZQUFZO0FBQUUsdUJBQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQzthQUFFLENBQUMsQ0FBQztTQUM3RTtBQUNELGtCQUFVLEVBQUUsSUFBSTtBQUNoQixvQkFBWSxFQUFFLElBQUk7S0FDckIsQ0FBQyxDQUFDO0FBQ0gsVUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLHNCQUFzQixFQUFFO0FBQzVELFdBQUcsRUFBRSxlQUFZO0FBQ2IsZ0JBQUksS0FBSyxHQUFHLElBQUksQ0FBQztBQUNqQixtQkFBTyxTQUFTLENBQUMsWUFBWTtBQUFFLHVCQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUM7YUFBRSxDQUFDLENBQUM7U0FDL0U7QUFDRCxrQkFBVSxFQUFFLElBQUk7QUFDaEIsb0JBQVksRUFBRSxJQUFJO0tBQ3JCLENBQUMsQ0FBQztBQUNILFdBQU8sTUFBTSxDQUFDO0NBQ2pCLENBQUEsRUFBRyxDQUFDO0FBQ0wsSUFBSSxNQUFNLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQztBQUMxQixNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvYXRvbS10eXBlc2NyaXB0L2Rpc3QvbWFpbi9hdG9tL2F0b21Db25maWcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgdXRpbHNfMSA9IHJlcXVpcmUoXCIuLi9sYW5nL3V0aWxzXCIpO1xudmFyIHBhY2thZ2VOYW1lID0gJ2F0b20tdHlwZXNjcmlwdCc7XG5mdW5jdGlvbiBnZXRDb25maWcobmFtZUxhbWJkYSkge1xuICAgIHJldHVybiBhdG9tLmNvbmZpZy5nZXQocGFja2FnZU5hbWUgKyAnLicgKyB1dGlsc18xLmdldE5hbWUobmFtZUxhbWJkYSkpO1xufVxudmFyIENvbmZpZyA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQ29uZmlnKCkge1xuICAgICAgICB0aGlzLnNjaGVtYSA9IHtcbiAgICAgICAgICAgIGRlYnVnQXRvbVRzOiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6ICdEZWJ1ZzogQXRvbS1UeXBlU2NyaXB0LiBQbGVhc2UgZG8gbm90IHVzZS4nLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByZWZlcnJlZFF1b3RlQ2hhcmFjdGVyOiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6ICdQcmVmZXJyZWQgcXVvdGUgY2hhcmFjdGVyJyxcbiAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiAnbm9uZSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0eXBlc2NyaXB0U2VydmljZXM6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogJ0Z1bGwgcGF0aCAoaW5jbHVkaW5nIGZpbGUgbmFtZSkgdG8gYSBjdXN0b20gYHR5cGVzY3JpcHRTZXJ2aWNlcy5qc2AnLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6ICcnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2hvd0ZpbGVTZW1hbnRpY1ZpZXc6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogJycsXG4gICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KENvbmZpZy5wcm90b3R5cGUsIFwiZGVidWdBdG9tVHNcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICByZXR1cm4gZ2V0Q29uZmlnKGZ1bmN0aW9uICgpIHsgcmV0dXJuIF90aGlzLnNjaGVtYS5kZWJ1Z0F0b21UczsgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDb25maWcucHJvdG90eXBlLCBcInByZWZlcnJlZFF1b3RlQ2hhcmFjdGVyXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgcmV0dXJuIGdldENvbmZpZyhmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5zY2hlbWEucHJlZmVycmVkUXVvdGVDaGFyYWN0ZXI7IH0pO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQ29uZmlnLnByb3RvdHlwZSwgXCJ0eXBlc2NyaXB0U2VydmljZXNcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICByZXR1cm4gZ2V0Q29uZmlnKGZ1bmN0aW9uICgpIHsgcmV0dXJuIF90aGlzLnNjaGVtYS50eXBlc2NyaXB0U2VydmljZXM7IH0pO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQ29uZmlnLnByb3RvdHlwZSwgXCJzaG93RmlsZVNlbWFudGljVmlld1wiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICAgIHJldHVybiBnZXRDb25maWcoZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMuc2NoZW1hLnNob3dGaWxlU2VtYW50aWNWaWV3OyB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgcmV0dXJuIENvbmZpZztcbn0pKCk7XG52YXIgY29uZmlnID0gbmV3IENvbmZpZygpO1xubW9kdWxlLmV4cG9ydHMgPSBjb25maWc7XG4iXX0=