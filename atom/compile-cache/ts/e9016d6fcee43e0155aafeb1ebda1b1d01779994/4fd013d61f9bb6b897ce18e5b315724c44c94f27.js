var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
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
        get: function () {
            return this;
        },
        enumerable: true,
        configurable: true
    });
    View.content = function () {
        throw new Error('Must override the base View static content member');
    };
    View.prototype.init = function () {
    };
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
        get: function () {
            return this;
        },
        enumerable: true,
        configurable: true
    });
    ScrollView.content = function () {
        throw new Error('Must override the base View static content member');
    };
    ScrollView.prototype.init = function () {
    };
    return ScrollView;
})(sp.ScrollView);
exports.ScrollView = ScrollView;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5kb3RmaWxlcy9hdG9tL3BhY2thZ2VzL2F0b20tdHlwZXNjcmlwdC9saWIvbWFpbi9hdG9tL3ZpZXdzL3ZpZXcudHMiLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9hdG9tLXR5cGVzY3JpcHQvbGliL21haW4vYXRvbS92aWV3cy92aWV3LnRzIl0sIm5hbWVzIjpbIlZpZXciLCJWaWV3LmNvbnN0cnVjdG9yIiwiVmlldy4kIiwiVmlldy5jb250ZW50IiwiVmlldy5pbml0IiwiU2Nyb2xsVmlldyIsIlNjcm9sbFZpZXcuY29uc3RydWN0b3IiLCJTY3JvbGxWaWV3LiQiLCJTY3JvbGxWaWV3LmNvbnRlbnQiLCJTY3JvbGxWaWV3LmluaXQiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUVBLElBQU8sRUFBRSxXQUFXLHNCQUFzQixDQUFDLENBQUM7QUFFNUMsSUFBYSxJQUFJO0lBQWtCQSxVQUF0QkEsSUFBSUEsVUFBeUJBO0lBU3RDQSxTQVRTQSxJQUFJQSxDQVNNQSxPQUFnQkE7UUFDL0JDLGlCQUFPQSxDQUFDQTtRQURPQSxZQUFPQSxHQUFQQSxPQUFPQSxDQUFTQTtRQUUvQkEsSUFBSUEsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0E7SUFDaEJBLENBQUNBO0lBWERELHNCQUFJQSxtQkFBQ0E7YUFBTEE7WUFDSUUsTUFBTUEsQ0FBTUEsSUFBSUEsQ0FBQ0E7UUFDckJBLENBQUNBOzs7T0FBQUY7SUFFTUEsWUFBT0EsR0FBZEE7UUFDSUcsTUFBTUEsSUFBSUEsS0FBS0EsQ0FBQ0EsbURBQW1EQSxDQUFDQSxDQUFDQTtJQUN6RUEsQ0FBQ0E7SUFNREgsbUJBQUlBLEdBQUpBO0lBQVNJLENBQUNBO0lBQ2RKLFdBQUNBO0FBQURBLENBQUNBLEFBZEQsRUFBbUMsRUFBRSxDQUFDLElBQUksRUFjekM7QUFkWSxZQUFJLEdBQUosSUFjWixDQUFBO0FBRVUsU0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFFcEIsSUFBYSxVQUFVO0lBQWtCSyxVQUE1QkEsVUFBVUEsVUFBK0JBO0lBU2xEQSxTQVRTQSxVQUFVQSxDQVNBQSxPQUFnQkE7UUFDL0JDLGlCQUFPQSxDQUFDQTtRQURPQSxZQUFPQSxHQUFQQSxPQUFPQSxDQUFTQTtRQUUvQkEsSUFBSUEsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0E7SUFDaEJBLENBQUNBO0lBWERELHNCQUFJQSx5QkFBQ0E7YUFBTEE7WUFDSUUsTUFBTUEsQ0FBTUEsSUFBSUEsQ0FBQ0E7UUFDckJBLENBQUNBOzs7T0FBQUY7SUFFTUEsa0JBQU9BLEdBQWRBO1FBQ0lHLE1BQU1BLElBQUlBLEtBQUtBLENBQUNBLG1EQUFtREEsQ0FBQ0EsQ0FBQ0E7SUFDekVBLENBQUNBO0lBTURILHlCQUFJQSxHQUFKQTtJQUFTSSxDQUFDQTtJQUNkSixpQkFBQ0E7QUFBREEsQ0FBQ0EsQUFkRCxFQUF5QyxFQUFFLENBQUMsVUFBVSxFQWNyRDtBQWRZLGtCQUFVLEdBQVYsVUFjWixDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiXG5cbmltcG9ydCBzcCA9IHJlcXVpcmUoXCJhdG9tLXNwYWNlLXBlbi12aWV3c1wiKTtcblxuZXhwb3J0IGNsYXNzIFZpZXc8T3B0aW9ucz4gZXh0ZW5kcyBzcC5WaWV3IHtcbiAgICBnZXQgJCgpOiBKUXVlcnkge1xuICAgICAgICByZXR1cm4gPGFueT50aGlzO1xuICAgIH1cblxuICAgIHN0YXRpYyBjb250ZW50KCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ011c3Qgb3ZlcnJpZGUgdGhlIGJhc2UgVmlldyBzdGF0aWMgY29udGVudCBtZW1iZXInKTtcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgb3B0aW9uczogT3B0aW9ucykge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmluaXQoKTtcbiAgICB9XG4gICAgaW5pdCgpIHsgfVxufVxuXG5leHBvcnQgdmFyICQgPSBzcC4kO1xuXG5leHBvcnQgY2xhc3MgU2Nyb2xsVmlldzxPcHRpb25zPiBleHRlbmRzIHNwLlNjcm9sbFZpZXcge1xuICAgIGdldCAkKCk6IEpRdWVyeSB7XG4gICAgICAgIHJldHVybiA8YW55PnRoaXM7XG4gICAgfVxuXG4gICAgc3RhdGljIGNvbnRlbnQoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTXVzdCBvdmVycmlkZSB0aGUgYmFzZSBWaWV3IHN0YXRpYyBjb250ZW50IG1lbWJlcicpO1xuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBvcHRpb25zOiBPcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuaW5pdCgpO1xuICAgIH1cbiAgICBpbml0KCkgeyB9XG59Il19