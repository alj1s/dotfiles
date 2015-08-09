var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var atomUtils = require("../atomUtils");
/**
 * https://github.com/atom/atom-space-pen-views
 */
var FileSymbolsView = (function (_super) {
    __extends(FileSymbolsView, _super);
    function FileSymbolsView() {
        _super.apply(this, arguments);
        this.panel = null;
    }
    Object.defineProperty(FileSymbolsView.prototype, "$", {
        get: function () {
            return this;
        },
        enumerable: true,
        configurable: true
    });
    FileSymbolsView.prototype.setNavBarItems = function (tsItems, filePath) {
        var items = tsItems;
        this.filePath = filePath;
        super.setItems.call(this, items);
    };
    /** override */
    FileSymbolsView.prototype.viewForItem = function (item) {
        return "\n            <li>\n                <div class=\"highlight\">" + (Array(item.indent * 2).join('&nbsp;') + (item.indent ? "\u221F " : '') + item.text) + "</div>\n                <div class=\"pull-right\" style=\"font-weight: bold; color:" + atomUtils.kindToColor(item.kind) + "\">" + item.kind + "</div>\n                <div class=\"clear\"> line: " + (item.position.line + 1) + "</div>\n            </li>\n        ";
    };
    /** override */
    FileSymbolsView.prototype.confirmed = function (item) {
        atom.workspace.open(this.filePath, {
            initialLine: item.position.line,
            initialColumn: item.position.col
        });
        this.hide();
    };
    FileSymbolsView.prototype.getFilterKey = function () {
        return 'text';
    };
    FileSymbolsView.prototype.show = function () {
        this.storeFocusedElement();
        if (!this.panel)
            this.panel = atom.workspace.addModalPanel({ item: this });
        this.panel.show();
        this.focusFilterEditor();
    };
    FileSymbolsView.prototype.hide = function () {
        this.panel.hide();
        this.restoreFocus();
    };
    FileSymbolsView.prototype.cancelled = function () {
        this.hide();
    };
    return FileSymbolsView;
})(sp.SelectListView);
exports.FileSymbolsView = FileSymbolsView;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5kb3RmaWxlcy9hdG9tL3BhY2thZ2VzL2F0b20tdHlwZXNjcmlwdC9saWIvbWFpbi9hdG9tL3ZpZXdzL2ZpbGVTeW1ib2xzVmlldy50cyIsInNvdXJjZXMiOlsiL1VzZXJzL2FuZHJld2pvbmVzLy5kb3RmaWxlcy9hdG9tL3BhY2thZ2VzL2F0b20tdHlwZXNjcmlwdC9saWIvbWFpbi9hdG9tL3ZpZXdzL2ZpbGVTeW1ib2xzVmlldy50cyJdLCJuYW1lcyI6WyJGaWxlU3ltYm9sc1ZpZXciLCJGaWxlU3ltYm9sc1ZpZXcuY29uc3RydWN0b3IiLCJGaWxlU3ltYm9sc1ZpZXcuJCIsIkZpbGVTeW1ib2xzVmlldy5zZXROYXZCYXJJdGVtcyIsIkZpbGVTeW1ib2xzVmlldy52aWV3Rm9ySXRlbSIsIkZpbGVTeW1ib2xzVmlldy5jb25maXJtZWQiLCJGaWxlU3ltYm9sc1ZpZXcuZ2V0RmlsdGVyS2V5IiwiRmlsZVN5bWJvbHNWaWV3LnNob3ciLCJGaWxlU3ltYm9sc1ZpZXcuaGlkZSIsIkZpbGVTeW1ib2xzVmlldy5jYW5jZWxsZWQiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUVBLElBQU8sU0FBUyxXQUFXLGNBQWMsQ0FBQyxDQUFDO0FBTTNDLEFBSEE7O0dBRUc7SUFDVSxlQUFlO0lBQVNBLFVBQXhCQSxlQUFlQSxVQUEwQkE7SUFBdERBLFNBQWFBLGVBQWVBO1FBQVNDLDhCQUFpQkE7UUF1Q2xEQSxVQUFLQSxHQUFtQkEsSUFBSUEsQ0FBQ0E7SUFnQmpDQSxDQUFDQTtJQXJER0Qsc0JBQUlBLDhCQUFDQTthQUFMQTtZQUNJRSxNQUFNQSxDQUFNQSxJQUFJQSxDQUFDQTtRQUNyQkEsQ0FBQ0E7OztPQUFBRjtJQUdNQSx3Q0FBY0EsR0FBckJBLFVBQXNCQSxPQUE0QkEsRUFBRUEsUUFBUUE7UUFFeERHLElBQUlBLEtBQUtBLEdBQXdCQSxPQUFPQSxDQUFDQTtRQUV6Q0EsSUFBSUEsQ0FBQ0EsUUFBUUEsR0FBR0EsUUFBUUEsQ0FBQ0E7UUFFekJBLEtBQUtBLENBQUNBLFFBQVFBLFlBQUNBLEtBQUtBLENBQUNBLENBQUFBO0lBQ3pCQSxDQUFDQTtJQUVESCxlQUFlQTtJQUNmQSxxQ0FBV0EsR0FBWEEsVUFBWUEsSUFBdUJBO1FBQy9CSSxNQUFNQSxDQUFDQSxtRUFFMkJBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLEdBQUdBLFNBQVNBLEdBQUdBLEVBQUVBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLElBQUlBLDRGQUNsREEsU0FBU0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsV0FBTUEsSUFBSUEsQ0FBQ0EsSUFBSUEsNkRBQzdFQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxJQUFJQSxHQUFHQSxDQUFDQSx5Q0FFekRBLENBQUNBO0lBQ05BLENBQUNBO0lBRURKLGVBQWVBO0lBQ2ZBLG1DQUFTQSxHQUFUQSxVQUFVQSxJQUF1QkE7UUFDN0JLLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLEVBQUVBO1lBQy9CQSxXQUFXQSxFQUFFQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxJQUFJQTtZQUMvQkEsYUFBYUEsRUFBRUEsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsR0FBR0E7U0FDbkNBLENBQUNBLENBQUNBO1FBRUhBLElBQUlBLENBQUNBLElBQUlBLEVBQUVBLENBQUNBO0lBQ2hCQSxDQUFDQTtJQUVETCxzQ0FBWUEsR0FBWkE7UUFBaUJNLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBO0lBQUNBLENBQUNBO0lBR2pDTiw4QkFBSUEsR0FBSkE7UUFDSU8sSUFBSUEsQ0FBQ0EsbUJBQW1CQSxFQUFFQSxDQUFDQTtRQUMzQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0E7WUFBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsR0FBR0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsYUFBYUEsQ0FBQ0EsRUFBRUEsSUFBSUEsRUFBRUEsSUFBSUEsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDM0VBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLElBQUlBLEVBQUVBLENBQUFBO1FBRWpCQSxJQUFJQSxDQUFDQSxpQkFBaUJBLEVBQUVBLENBQUNBO0lBQzdCQSxDQUFDQTtJQUNEUCw4QkFBSUEsR0FBSkE7UUFDSVEsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0E7UUFDbEJBLElBQUlBLENBQUNBLFlBQVlBLEVBQUVBLENBQUNBO0lBQ3hCQSxDQUFDQTtJQUVEUixtQ0FBU0EsR0FBVEE7UUFDSVMsSUFBSUEsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0E7SUFDaEJBLENBQUNBO0lBQ0xULHNCQUFDQTtBQUFEQSxDQUFDQSxBQXZERCxFQUFxQyxFQUFFLENBQUMsY0FBYyxFQXVEckQ7QUF2RFksdUJBQWUsR0FBZixlQXVEWixDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHNwID0gcmVxdWlyZSgnYXRvbS1zcGFjZS1wZW4tdmlld3MnKTtcbmltcG9ydCBtYWluUGFuZWxWaWV3ID0gcmVxdWlyZSgnLi9tYWluUGFuZWxWaWV3Jyk7XG5pbXBvcnQgYXRvbVV0aWxzID0gcmVxdWlyZShcIi4uL2F0b21VdGlsc1wiKTtcblxuXG4vKiogXG4gKiBodHRwczovL2dpdGh1Yi5jb20vYXRvbS9hdG9tLXNwYWNlLXBlbi12aWV3c1xuICovXG5leHBvcnQgY2xhc3MgRmlsZVN5bWJvbHNWaWV3IGV4dGVuZHMgc3AuU2VsZWN0TGlzdFZpZXcge1xuXG4gICAgZ2V0ICQoKTogSlF1ZXJ5IHtcbiAgICAgICAgcmV0dXJuIDxhbnk+dGhpcztcbiAgICB9XG5cbiAgICBwdWJsaWMgZmlsZVBhdGg6IHN0cmluZztcbiAgICBwdWJsaWMgc2V0TmF2QmFySXRlbXModHNJdGVtczogTmF2aWdhdGlvbkJhckl0ZW1bXSwgZmlsZVBhdGgpIHtcblxuICAgICAgICB2YXIgaXRlbXM6IE5hdmlnYXRpb25CYXJJdGVtW10gPSB0c0l0ZW1zO1xuXG4gICAgICAgIHRoaXMuZmlsZVBhdGggPSBmaWxlUGF0aDtcblxuICAgICAgICBzdXBlci5zZXRJdGVtcyhpdGVtcylcbiAgICB9XG5cbiAgICAvKiogb3ZlcnJpZGUgKi9cbiAgICB2aWV3Rm9ySXRlbShpdGVtOiBOYXZpZ2F0aW9uQmFySXRlbSkge1xuICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJoaWdobGlnaHRcIj4keyBBcnJheShpdGVtLmluZGVudCAqIDIpLmpvaW4oJyZuYnNwOycpICsgKGl0ZW0uaW5kZW50ID8gXCJcXHUyMjFGIFwiIDogJycpICsgaXRlbS50ZXh0fTwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwdWxsLXJpZ2h0XCIgc3R5bGU9XCJmb250LXdlaWdodDogYm9sZDsgY29sb3I6JHthdG9tVXRpbHMua2luZFRvQ29sb3IoaXRlbS5raW5kKSB9XCI+JHtpdGVtLmtpbmR9PC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNsZWFyXCI+IGxpbmU6ICR7aXRlbS5wb3NpdGlvbi5saW5lICsgMX08L2Rpdj5cbiAgICAgICAgICAgIDwvbGk+XG4gICAgICAgIGA7XG4gICAgfVxuICAgIFxuICAgIC8qKiBvdmVycmlkZSAqL1xuICAgIGNvbmZpcm1lZChpdGVtOiBOYXZpZ2F0aW9uQmFySXRlbSkge1xuICAgICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKHRoaXMuZmlsZVBhdGgsIHtcbiAgICAgICAgICAgIGluaXRpYWxMaW5lOiBpdGVtLnBvc2l0aW9uLmxpbmUsXG4gICAgICAgICAgICBpbml0aWFsQ29sdW1uOiBpdGVtLnBvc2l0aW9uLmNvbFxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmhpZGUoKTtcbiAgICB9XG5cbiAgICBnZXRGaWx0ZXJLZXkoKSB7IHJldHVybiAndGV4dCc7IH1cblxuICAgIHBhbmVsOiBBdG9tQ29yZS5QYW5lbCA9IG51bGw7XG4gICAgc2hvdygpIHtcbiAgICAgICAgdGhpcy5zdG9yZUZvY3VzZWRFbGVtZW50KCk7XG4gICAgICAgIGlmICghdGhpcy5wYW5lbCkgdGhpcy5wYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZE1vZGFsUGFuZWwoeyBpdGVtOiB0aGlzIH0pO1xuICAgICAgICB0aGlzLnBhbmVsLnNob3coKVxuXG4gICAgICAgIHRoaXMuZm9jdXNGaWx0ZXJFZGl0b3IoKTtcbiAgICB9XG4gICAgaGlkZSgpIHtcbiAgICAgICAgdGhpcy5wYW5lbC5oaWRlKCk7XG4gICAgICAgIHRoaXMucmVzdG9yZUZvY3VzKCk7XG4gICAgfVxuXG4gICAgY2FuY2VsbGVkKCkge1xuICAgICAgICB0aGlzLmhpZGUoKTtcbiAgICB9XG59XG4iXX0=