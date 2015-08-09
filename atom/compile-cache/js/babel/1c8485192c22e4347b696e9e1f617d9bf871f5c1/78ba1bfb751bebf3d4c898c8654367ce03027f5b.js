// Sample implementation of a react view
// DOCS:
// http://facebook.github.io/react/blog/2015/01/27/react-v0.13.0-beta-1.html#es6-classes
// https://facebook.github.io/react/docs/component-specs.html
var __extends = this && this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() {
        this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var atomUtils_1 = require("../atomUtils");
var sp = require("atom-space-pen-views");
var React = require("react");
var MyComponent = (function (_super) {
    __extends(MyComponent, _super);
    function MyComponent(props) {
        var _this = this;
        _super.call(this, props);
        this.state = { count: 0 };
        this.stop = function () {
            clearInterval(_this.interval);
        };
    }
    MyComponent.prototype.componentDidMount = function () {
        var _this = this;
        this.interval = setInterval(function () {
            _this.setState({ count: _this.state.count + 1 });
        });
    };
    MyComponent.prototype.render = function () {
        return React.createElement("div", { "onClick": this.stop }, "This is a test: ", this.state.count);
    };
    MyComponent.defaultProps = { count: 0 };
    return MyComponent;
})(React.Component);
var RView = (function (_super) {
    __extends(RView, _super);
    function RView(config) {
        var _this = this;
        _super.call(this);
        this.config = config;
        this.getURI = function () {
            return atomUtils_1.uriForPath(_this.constructor.protocol, _this.config.filePath);
        };
        this.getTitle = function () {
            return _this.config.title;
        };
        this.getIconName = function () {
            return _this.config.icon;
        };
        React.render(React.createElement(MyComponent, {}), this.rootDomElement);
    }
    Object.defineProperty(RView.prototype, "rootDomElement", {
        get: function get() {
            return this.mainContent[0];
        },
        enumerable: true,
        configurable: true
    });
    RView.content = function () {
        var _this = this;
        return this.div({ "class": "atomts-r-view native-key-bindings" }, function () {
            _this.div({ outlet: "mainContent" });
        });
    };
    Object.defineProperty(RView.prototype, "$", {
        get: function get() {
            return this;
        },
        enumerable: true,
        configurable: true
    });
    RView.protocol = "atomtsview:";
    return RView;
})(sp.ScrollView);
exports.RView = RView;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9hdG9tLXR5cGVzY3JpcHQvZGlzdC9tYWluL2F0b20vdmlld3MvclZpZXcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUlBLElBQUksU0FBUyxHQUFHLEFBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxTQUFTLElBQUssVUFBVSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQ3hELFNBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RELGFBQVMsRUFBRSxHQUFHO0FBQUUsWUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUM7S0FBRTtBQUN2QyxLQUFDLENBQUMsU0FBUyxHQUFHLENBQUMsS0FBSyxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQSxBQUFDLENBQUM7Q0FDeEYsQ0FBQztBQUNGLElBQUksV0FBVyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUMxQyxJQUFJLEVBQUUsR0FBRyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQztBQUN6QyxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDN0IsSUFBSSxXQUFXLEdBQUcsQ0FBQyxVQUFVLE1BQU0sRUFBRTtBQUNqQyxhQUFTLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQy9CLGFBQVMsV0FBVyxDQUFDLEtBQUssRUFBRTtBQUN4QixZQUFJLEtBQUssR0FBRyxJQUFJLENBQUM7QUFDakIsY0FBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFD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akMsa0JBQVUsRUFBRSxJQUFJO0FBQ2hCLG9CQUFZLEVBQUUsSUFBSTtLQUNyQixDQUFDLENBQUM7QUFDSCxTQUFLLENBQUMsUUFBUSxHQUFHLGFBQWEsQ0FBQztBQUMvQixXQUFPLEtBQUssQ0FBQztDQUNoQixDQUFBLENBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ2xCLE9BQU8sQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9hdG9tLXR5cGVzY3JpcHQvZGlzdC9tYWluL2F0b20vdmlld3MvclZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBTYW1wbGUgaW1wbGVtZW50YXRpb24gb2YgYSByZWFjdCB2aWV3XG4vLyBET0NTOiBcbi8vIGh0dHA6Ly9mYWNlYm9vay5naXRodWIuaW8vcmVhY3QvYmxvZy8yMDE1LzAxLzI3L3JlYWN0LXYwLjEzLjAtYmV0YS0xLmh0bWwjZXM2LWNsYXNzZXNcbi8vIGh0dHBzOi8vZmFjZWJvb2suZ2l0aHViLmlvL3JlYWN0L2RvY3MvY29tcG9uZW50LXNwZWNzLmh0bWxcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgZnVuY3Rpb24gKGQsIGIpIHtcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG59O1xudmFyIGF0b21VdGlsc18xID0gcmVxdWlyZShcIi4uL2F0b21VdGlsc1wiKTtcbnZhciBzcCA9IHJlcXVpcmUoXCJhdG9tLXNwYWNlLXBlbi12aWV3c1wiKTtcbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG52YXIgTXlDb21wb25lbnQgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhNeUNvbXBvbmVudCwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBNeUNvbXBvbmVudChwcm9wcykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBfc3VwZXIuY2FsbCh0aGlzLCBwcm9wcyk7XG4gICAgICAgIHRoaXMuc3RhdGUgPSB7IGNvdW50OiAwIH07XG4gICAgICAgIHRoaXMuc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoX3RoaXMuaW50ZXJ2YWwpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBNeUNvbXBvbmVudC5wcm90b3R5cGUuY29tcG9uZW50RGlkTW91bnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMuaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBfdGhpcy5zZXRTdGF0ZSh7IGNvdW50OiBfdGhpcy5zdGF0ZS5jb3VudCArIDEgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgTXlDb21wb25lbnQucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwge1wib25DbGlja1wiOiB0aGlzLnN0b3B9LCBcIlRoaXMgaXMgYSB0ZXN0OiBcIiwgdGhpcy5zdGF0ZS5jb3VudCk7XG4gICAgfTtcbiAgICBNeUNvbXBvbmVudC5kZWZhdWx0UHJvcHMgPSB7IGNvdW50OiAwIH07XG4gICAgcmV0dXJuIE15Q29tcG9uZW50O1xufSkoUmVhY3QuQ29tcG9uZW50KTtcbnZhciBSVmlldyA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XG4gICAgX19leHRlbmRzKFJWaWV3LCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIFJWaWV3KGNvbmZpZykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBfc3VwZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMuZ2V0VVJJID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gYXRvbVV0aWxzXzEudXJpRm9yUGF0aChfdGhpcy5jb25zdHJ1Y3Rvci5wcm90b2NvbCwgX3RoaXMuY29uZmlnLmZpbGVQYXRoKTsgfTtcbiAgICAgICAgdGhpcy5nZXRUaXRsZSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIF90aGlzLmNvbmZpZy50aXRsZTsgfTtcbiAgICAgICAgdGhpcy5nZXRJY29uTmFtZSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIF90aGlzLmNvbmZpZy5pY29uOyB9O1xuICAgICAgICBSZWFjdC5yZW5kZXIoUmVhY3QuY3JlYXRlRWxlbWVudChNeUNvbXBvbmVudCwge30pLCB0aGlzLnJvb3REb21FbGVtZW50KTtcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFJWaWV3LnByb3RvdHlwZSwgXCJyb290RG9tRWxlbWVudFwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubWFpbkNvbnRlbnRbMF07XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIFJWaWV3LmNvbnRlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHJldHVybiB0aGlzLmRpdih7IGNsYXNzOiAnYXRvbXRzLXItdmlldyBuYXRpdmUta2V5LWJpbmRpbmdzJyB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBfdGhpcy5kaXYoeyBvdXRsZXQ6ICdtYWluQ29udGVudCcgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFJWaWV3LnByb3RvdHlwZSwgXCIkXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBSVmlldy5wcm90b2NvbCA9ICdhdG9tdHN2aWV3Oic7XG4gICAgcmV0dXJuIFJWaWV3O1xufSkoc3AuU2Nyb2xsVmlldyk7XG5leHBvcnRzLlJWaWV3ID0gUlZpZXc7XG4iXX0=