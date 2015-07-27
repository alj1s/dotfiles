var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var view = require('./view');
var $ = view.$;
var PlainMessageView = (function (_super) {
    __extends(PlainMessageView, _super);
    function PlainMessageView() {
        _super.apply(this, arguments);
    }
    PlainMessageView.content = function () {
        this.div({
            class: 'plain-message'
        });
    };
    PlainMessageView.prototype.init = function () {
        this.$.html(this.options.message);
        this.$.addClass(this.options.className);
    };
    PlainMessageView.prototype.getSummary = function () {
        return {
            summary: this.options.message,
            rawSummary: true,
            className: this.options.className
        };
    };
    return PlainMessageView;
})(view.View);
exports.PlainMessageView = PlainMessageView;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL2F0b20tdHlwZXNjcmlwdC9saWIvbWFpbi9hdG9tL3ZpZXdzL3BsYWluTWVzc2FnZVZpZXcudHMiLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9hdG9tLXR5cGVzY3JpcHQvbGliL21haW4vYXRvbS92aWV3cy9wbGFpbk1lc3NhZ2VWaWV3LnRzIl0sIm5hbWVzIjpbIlBsYWluTWVzc2FnZVZpZXciLCJQbGFpbk1lc3NhZ2VWaWV3LmNvbnN0cnVjdG9yIiwiUGxhaW5NZXNzYWdlVmlldy5jb250ZW50IiwiUGxhaW5NZXNzYWdlVmlldy5pbml0IiwiUGxhaW5NZXNzYWdlVmlldy5nZXRTdW1tYXJ5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxJQUFPLElBQUksV0FBVyxRQUFRLENBQUMsQ0FBQztBQUNoQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBU2YsSUFBYSxnQkFBZ0I7SUFBU0EsVUFBekJBLGdCQUFnQkEsVUFBK0JBO0lBQTVEQSxTQUFhQSxnQkFBZ0JBO1FBQVNDLDhCQUFzQkE7SUFvQjVEQSxDQUFDQTtJQWxCVUQsd0JBQU9BLEdBQWRBO1FBQ0lFLElBQUlBLENBQUNBLEdBQUdBLENBQUNBO1lBQ0xBLEtBQUtBLEVBQUVBLGVBQWVBO1NBQ3pCQSxDQUFDQSxDQUFDQTtJQUNQQSxDQUFDQTtJQUVERiwrQkFBSUEsR0FBSkE7UUFDSUcsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0E7UUFDbENBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLFFBQVFBLENBQUNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLFNBQVNBLENBQUNBLENBQUNBO0lBQzVDQSxDQUFDQTtJQUVESCxxQ0FBVUEsR0FBVkE7UUFDSUksTUFBTUEsQ0FBQ0E7WUFDSEEsT0FBT0EsRUFBRUEsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsT0FBT0E7WUFDN0JBLFVBQVVBLEVBQUVBLElBQUlBO1lBQ2hCQSxTQUFTQSxFQUFFQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxTQUFTQTtTQUNwQ0EsQ0FBQ0E7SUFDTkEsQ0FBQ0E7SUFDTEosdUJBQUNBO0FBQURBLENBQUNBLEFBcEJELEVBQXNDLElBQUksQ0FBQyxJQUFJLEVBb0I5QztBQXBCWSx3QkFBZ0IsR0FBaEIsZ0JBb0JaLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdmlldyA9IHJlcXVpcmUoJy4vdmlldycpO1xudmFyICQgPSB2aWV3LiQ7XG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcblxuZXhwb3J0IGludGVyZmFjZSBWaWV3T3B0aW9ucyB7XG4gICAgLyoqIHlvdXIgbWVzc2FnZSB0byB0aGUgcGVvcGxlICovXG4gICAgbWVzc2FnZTogc3RyaW5nO1xuICAgIGNsYXNzTmFtZTogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgUGxhaW5NZXNzYWdlVmlldyBleHRlbmRzIHZpZXcuVmlldzxWaWV3T3B0aW9ucz4ge1xuXG4gICAgc3RhdGljIGNvbnRlbnQoKSB7XG4gICAgICAgIHRoaXMuZGl2KHtcbiAgICAgICAgICAgIGNsYXNzOiAncGxhaW4tbWVzc2FnZSdcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaW5pdCgpIHtcbiAgICAgICAgdGhpcy4kLmh0bWwodGhpcy5vcHRpb25zLm1lc3NhZ2UpO1xuICAgICAgICB0aGlzLiQuYWRkQ2xhc3ModGhpcy5vcHRpb25zLmNsYXNzTmFtZSk7XG4gICAgfVxuXG4gICAgZ2V0U3VtbWFyeSgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1bW1hcnk6IHRoaXMub3B0aW9ucy5tZXNzYWdlLFxuICAgICAgICAgICAgcmF3U3VtbWFyeTogdHJ1ZSxcbiAgICAgICAgICAgIGNsYXNzTmFtZTogdGhpcy5vcHRpb25zLmNsYXNzTmFtZVxuICAgICAgICB9O1xuICAgIH1cbn0iXX0=