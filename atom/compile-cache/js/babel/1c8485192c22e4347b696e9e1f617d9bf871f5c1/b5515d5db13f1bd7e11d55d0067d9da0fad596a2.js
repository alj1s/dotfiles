var transformerRegistry_1 = require("../transformerRegistry");
var NullTransformer = (function () {
    function NullTransformer() {
        this.name = "null";
    }
    NullTransformer.prototype.transform = function (code) {
        return { code: code };
    };
    return NullTransformer;
})();
exports.NullTransformer = NullTransformer;
transformerRegistry_1.add(new NullTransformer());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9hdG9tLXR5cGVzY3JpcHQvZGlzdC9tYWluL2xhbmcvdHJhbnNmb3JtZXJzL2ltcGxlbWVudGF0aW9ucy9udWxsVHJhbnNmb3JtZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBSSxxQkFBcUIsR0FBRyxPQUFPLENBQUMsd0JBQXdCLENBQUMsQ0FBQztBQUM5RCxJQUFJLGVBQWUsR0FBRyxDQUFDLFlBQVk7QUFDL0IsYUFBUyxlQUFlLEdBQUc7QUFDdkIsWUFBSSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUM7S0FDdEI7QUFDRCxtQkFBZSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEdBQUcsVUFBVSxJQUFJLEVBQUU7QUFDbEQsZUFBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQztLQUN6QixDQUFDO0FBQ0YsV0FBTyxlQUFlLENBQUM7Q0FDMUIsQ0FBQSxFQUFHLENBQUM7QUFDTCxPQUFPLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQztBQUMxQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxlQUFlLEVBQUUsQ0FBQyxDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9hdG9tLXR5cGVzY3JpcHQvZGlzdC9tYWluL2xhbmcvdHJhbnNmb3JtZXJzL2ltcGxlbWVudGF0aW9ucy9udWxsVHJhbnNmb3JtZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgdHJhbnNmb3JtZXJSZWdpc3RyeV8xID0gcmVxdWlyZShcIi4uL3RyYW5zZm9ybWVyUmVnaXN0cnlcIik7XG52YXIgTnVsbFRyYW5zZm9ybWVyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBOdWxsVHJhbnNmb3JtZXIoKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IFwibnVsbFwiO1xuICAgIH1cbiAgICBOdWxsVHJhbnNmb3JtZXIucHJvdG90eXBlLnRyYW5zZm9ybSA9IGZ1bmN0aW9uIChjb2RlKSB7XG4gICAgICAgIHJldHVybiB7IGNvZGU6IGNvZGUgfTtcbiAgICB9O1xuICAgIHJldHVybiBOdWxsVHJhbnNmb3JtZXI7XG59KSgpO1xuZXhwb3J0cy5OdWxsVHJhbnNmb3JtZXIgPSBOdWxsVHJhbnNmb3JtZXI7XG50cmFuc2Zvcm1lclJlZ2lzdHJ5XzEuYWRkKG5ldyBOdWxsVHJhbnNmb3JtZXIoKSk7XG4iXX0=