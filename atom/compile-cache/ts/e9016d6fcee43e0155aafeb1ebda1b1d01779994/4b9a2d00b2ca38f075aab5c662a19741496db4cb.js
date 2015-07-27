var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var view = require('./view');
var $ = view.$;
var AwesomePanelView = (function (_super) {
    __extends(AwesomePanelView, _super);
    function AwesomePanelView() {
        _super.apply(this, arguments);
    }
    AwesomePanelView.content = function () {
        var _this = this;
        return this.div({ class: 'awesome' }, function () { return _this.div({ class: 'dude', outlet: 'something' }); });
    };
    AwesomePanelView.prototype.init = function () {
        this.something.html('<div>tada</div>');
    };
    return AwesomePanelView;
})(view.View);
exports.AwesomePanelView = AwesomePanelView;
exports.panelView;
exports.panel;
function attach() {
    exports.panelView = new AwesomePanelView({});
    exports.panel = atom.workspace.addModalPanel({ item: exports.panelView, priority: 1000, visible: false });
    /*setInterval(() => {
        panel.isVisible() ? panel.hide() : panel.show();
        console.log('called');
    }, 1000);*/
}
exports.attach = attach;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL2F0b20tdHlwZXNjcmlwdC9saWIvbWFpbi9hdG9tL3ZpZXdzL2F3ZXNvbWVQYW5lbFZpZXcudHMiLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9hdG9tLXR5cGVzY3JpcHQvbGliL21haW4vYXRvbS92aWV3cy9hd2Vzb21lUGFuZWxWaWV3LnRzIl0sIm5hbWVzIjpbIkF3ZXNvbWVQYW5lbFZpZXciLCJBd2Vzb21lUGFuZWxWaWV3LmNvbnN0cnVjdG9yIiwiQXdlc29tZVBhbmVsVmlldy5jb250ZW50IiwiQXdlc29tZVBhbmVsVmlldy5pbml0IiwiYXR0YWNoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxJQUFPLElBQUksV0FBVyxRQUFRLENBQUMsQ0FBQztBQUNoQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBRWYsSUFBYSxnQkFBZ0I7SUFBU0EsVUFBekJBLGdCQUFnQkEsVUFBdUJBO0lBQXBEQSxTQUFhQSxnQkFBZ0JBO1FBQVNDLDhCQUFjQTtJQVlwREEsQ0FBQ0E7SUFUVUQsd0JBQU9BLEdBQWRBO1FBQUFFLGlCQUlDQTtRQUhHQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxLQUFLQSxFQUFFQSxTQUFTQSxFQUFFQSxFQUNoQ0EsY0FBTUEsT0FBQUEsS0FBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsS0FBS0EsRUFBRUEsTUFBTUEsRUFBRUEsTUFBTUEsRUFBRUEsV0FBV0EsRUFBRUEsQ0FBQ0EsRUFBaERBLENBQWdEQSxDQUNyREEsQ0FBQ0E7SUFDVkEsQ0FBQ0E7SUFFREYsK0JBQUlBLEdBQUpBO1FBQ0lHLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLGlCQUFpQkEsQ0FBQ0EsQ0FBQ0E7SUFDM0NBLENBQUNBO0lBQ0xILHVCQUFDQTtBQUFEQSxDQUFDQSxBQVpELEVBQXNDLElBQUksQ0FBQyxJQUFJLEVBWTlDO0FBWlksd0JBQWdCLEdBQWhCLGdCQVlaLENBQUE7QUFFVSxpQkFBMkIsQ0FBQztBQUM1QixhQUFxQixDQUFDO0FBQ2pDLFNBQWdCLE1BQU07SUFDbEJJLGlCQUFTQSxHQUFHQSxJQUFJQSxnQkFBZ0JBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO0lBQ3JDQSxhQUFLQSxHQUFHQSxJQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxhQUFhQSxDQUFDQSxFQUFFQSxJQUFJQSxFQUFFQSxpQkFBU0EsRUFBRUEsUUFBUUEsRUFBRUEsSUFBSUEsRUFBRUEsT0FBT0EsRUFBRUEsS0FBS0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7SUFFMUZBOzs7ZUFHV0E7QUFFZkEsQ0FBQ0E7QUFUZSxjQUFNLEdBQU4sTUFTZixDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHZpZXcgPSByZXF1aXJlKCcuL3ZpZXcnKTtcbnZhciAkID0gdmlldy4kO1xuXG5leHBvcnQgY2xhc3MgQXdlc29tZVBhbmVsVmlldyBleHRlbmRzIHZpZXcuVmlldzxhbnk+IHtcblxuICAgIHByaXZhdGUgc29tZXRoaW5nOiBKUXVlcnk7XG4gICAgc3RhdGljIGNvbnRlbnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRpdih7IGNsYXNzOiAnYXdlc29tZScgfSxcbiAgICAgICAgICAgICgpID0+IHRoaXMuZGl2KHsgY2xhc3M6ICdkdWRlJywgb3V0bGV0OiAnc29tZXRoaW5nJyB9KVxuICAgICAgICAgICAgKTtcbiAgICB9XG5cbiAgICBpbml0KCkge1xuICAgICAgICB0aGlzLnNvbWV0aGluZy5odG1sKCc8ZGl2PnRhZGE8L2Rpdj4nKTtcbiAgICB9XG59XG5cbmV4cG9ydCB2YXIgcGFuZWxWaWV3OiBBd2Vzb21lUGFuZWxWaWV3O1xuZXhwb3J0IHZhciBwYW5lbDogQXRvbUNvcmUuUGFuZWw7XG5leHBvcnQgZnVuY3Rpb24gYXR0YWNoKCkge1xuICAgIHBhbmVsVmlldyA9IG5ldyBBd2Vzb21lUGFuZWxWaWV3KHt9KTtcbiAgICBwYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZE1vZGFsUGFuZWwoeyBpdGVtOiBwYW5lbFZpZXcsIHByaW9yaXR5OiAxMDAwLCB2aXNpYmxlOiBmYWxzZSB9KTtcblxuICAgIC8qc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICBwYW5lbC5pc1Zpc2libGUoKSA/IHBhbmVsLmhpZGUoKSA6IHBhbmVsLnNob3coKTtcbiAgICAgICAgY29uc29sZS5sb2coJ2NhbGxlZCcpO1xuICAgIH0sIDEwMDApOyovXG5cbn1cbiJdfQ==