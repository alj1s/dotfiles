var __extends = this && this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() {
        this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var sp = require("atom-space-pen-views");
var View = (function (_super) {
    __extends(View, _super);
    function View(options) {
        _super.call(this);
        this.options = options;
        this.init();
    }
    Object.defineProperty(View.prototype, "$", {
        get: function get() {
            return this;
        },
        enumerable: true,
        configurable: true
    });
    View.content = function () {
        throw new Error("Must override the base View static content member");
    };
    View.prototype.init = function () {};
    return View;
})(sp.View);
exports.View = View;
exports.$ = sp.$;
var ScrollView = (function (_super) {
    __extends(ScrollView, _super);
    function ScrollView(options) {
        _super.call(this);
        this.options = options;
        this.init();
    }
    Object.defineProperty(ScrollView.prototype, "$", {
        get: function get() {
            return this;
        },
        enumerable: true,
        configurable: true
    });
    ScrollView.content = function () {
        throw new Error("Must override the base View static content member");
    };
    ScrollView.prototype.init = function () {};
    return ScrollView;
})(sp.ScrollView);
exports.ScrollView = ScrollView;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9hdG9tLXR5cGVzY3JpcHQvZGlzdC9tYWluL2F0b20vdmlld3Mvdmlldy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFJLFNBQVMsR0FBRyxBQUFDLElBQUksSUFBSSxJQUFJLENBQUMsU0FBUyxJQUFLLFVBQVUsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUN4RCxTQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN0RCxhQUFTLEVBQUUsR0FBRztBQUFFLFlBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDO0tBQUU7QUFDdkMsS0FBQyxDQUFDLFNBQVMsR0FBRyxDQUFDLEtBQUssSUFBSSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUEsQUFBQyxDQUFDO0NBQ3hGLENBQUM7QUFDRixJQUFJLEVBQUUsR0FBRyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQztBQUN6QyxJQUFJLElBQUksR0FBRyxDQUFDLFVBQVUsTUFBTSxFQUFFO0FBQzFCLGFBQVMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDeEIsYUFBUyxJQUFJLENBQUMsT0FBTyxFQUFFO0FBQ25CLGNBQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDbEIsWUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7QUFDdkIsWUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0tBQ2Y7QUFDRCxVQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFO0FBQ3ZDLFdBQUcsRUFBRSxlQUFZO0FBQ2IsbUJBQU8sSUFBSSxDQUFDO1NBQ2Y7QUFDRCxrQkFBVSxFQUFFLElBQUk7QUFDaEIsb0JBQVksRUFBRSxJQUFJO0tBQ3JCLENBQUMsQ0FBQztBQUNILFFBQUksQ0FBQyxPQUFPLEdBQUcsWUFBWTtBQUN2QixjQUFNLElBQUksS0FBSyxDQUFDLG1EQUFtRCxDQUFDLENBQUM7S0FDeEUsQ0FBQztBQUNGLFFBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFHLFlBQVksRUFBRyxDQUFDO0FBQ3RDLFdBQU8sSUFBSSxDQUFDO0NBQ2YsQ0FBQSxDQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNaLE9BQU8sQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ3BCLE9BQU8sQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNqQixJQUFJLFVBQVUsR0FBRyxDQUFDLFVBQVUsTUFBTSxFQUFFO0FBQ2hDLGFBQVMsQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDOUIsYUFBUyxVQUFVLENBQUMsT0FBTyxFQUFFO0FBQ3pCLGNBQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDbEIsWUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7QUFDdkIsWUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0tBQ2Y7QUFDRCxVQUFNLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFO0FBQzdDLFdBQUcsRUFBRSxlQUFZO0FBQ2IsbUJBQU8sSUFBSSxDQUFDO1NBQ2Y7QUFDRCxrQkFBVSxFQUFFLElBQUk7QUFDaEIsb0JBQVksRUFBRSxJQUFJO0tBQ3JCLENBQUMsQ0FBQztBQUNILGNBQVUsQ0FBQyxPQUFPLEdBQUcsWUFBWTtBQUM3QixjQUFNLElBQUksS0FBSyxDQUFDLG1EQUFtRCxDQUFDLENBQUM7S0FDeEUsQ0FBQztBQUNGLGNBQVUsQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFHLFlBQVksRUFBRyxDQUFDO0FBQzVDLFdBQU8sVUFBVSxDQUFDO0NBQ3JCLENBQUEsQ0FBRSxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDbEIsT0FBTyxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL2F0b20tdHlwZXNjcmlwdC9kaXN0L21haW4vYXRvbS92aWV3cy92aWV3LmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCBmdW5jdGlvbiAoZCwgYikge1xuICAgIGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdO1xuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbn07XG52YXIgc3AgPSByZXF1aXJlKFwiYXRvbS1zcGFjZS1wZW4tdmlld3NcIik7XG52YXIgVmlldyA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKFZpZXcsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gVmlldyhvcHRpb25zKSB7XG4gICAgICAgIF9zdXBlci5jYWxsKHRoaXMpO1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgICB0aGlzLmluaXQoKTtcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFZpZXcucHJvdG90eXBlLCBcIiRcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBWaWV3LmNvbnRlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTXVzdCBvdmVycmlkZSB0aGUgYmFzZSBWaWV3IHN0YXRpYyBjb250ZW50IG1lbWJlcicpO1xuICAgIH07XG4gICAgVmlldy5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uICgpIHsgfTtcbiAgICByZXR1cm4gVmlldztcbn0pKHNwLlZpZXcpO1xuZXhwb3J0cy5WaWV3ID0gVmlldztcbmV4cG9ydHMuJCA9IHNwLiQ7XG52YXIgU2Nyb2xsVmlldyA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKFNjcm9sbFZpZXcsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gU2Nyb2xsVmlldyhvcHRpb25zKSB7XG4gICAgICAgIF9zdXBlci5jYWxsKHRoaXMpO1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgICB0aGlzLmluaXQoKTtcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNjcm9sbFZpZXcucHJvdG90eXBlLCBcIiRcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBTY3JvbGxWaWV3LmNvbnRlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTXVzdCBvdmVycmlkZSB0aGUgYmFzZSBWaWV3IHN0YXRpYyBjb250ZW50IG1lbWJlcicpO1xuICAgIH07XG4gICAgU2Nyb2xsVmlldy5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uICgpIHsgfTtcbiAgICByZXR1cm4gU2Nyb2xsVmlldztcbn0pKHNwLlNjcm9sbFZpZXcpO1xuZXhwb3J0cy5TY3JvbGxWaWV3ID0gU2Nyb2xsVmlldztcbiJdfQ==