var __extends = this && this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() {
        this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var view = require('./view');
var $ = view.$;
var DocumentationView = (function (_super) {
    __extends(DocumentationView, _super);
    function DocumentationView() {
        _super.apply(this, arguments);
        this.shown = false;
    }
    DocumentationView.content = function () {
        var _this = this;
        return this.div({ 'class': 'atom-ts-documentation padded top' }, function () {
            return _this.div(function () {
                _this.h2({ outlet: 'header' });
                _this.p({ outlet: 'documentation' });
            });
        });
    };
    DocumentationView.prototype.show = function () {
        this.$.addClass('active');this.shown = true;
    };
    DocumentationView.prototype.hide = function () {
        this.$.removeClass('active');this.shown = false;
    };
    DocumentationView.prototype.toggle = function () {
        if (this.shown) {
            this.hide();
        } else {
            this.show();
        }
    };
    DocumentationView.prototype.setContent = function (content) {
        this.header.html(content.display);
        content.documentation = content.documentation.replace(/(?:\r\n|\r|\n)/g, '<br />');
        this.documentation.html(content.documentation);
    };
    DocumentationView.prototype.autoPosition = function () {
        var editor = atom.workspace.getActiveTextEditor();
        var cursor = editor.getCursors()[0];
        var cursorTop = cursor.getPixelRect().top - editor.getScrollTop();
        var editorHeight = editor.getHeight();
        if (editorHeight - cursorTop < 100) {
            this.$.removeClass('bottom');
            this.$.addClass('top');
        } else {
            this.$.removeClass('top');
            this.$.addClass('bottom');
        }
    };
    return DocumentationView;
})(view.View);
exports.DocumentationView = DocumentationView;
function attach() {
    if (exports.docView) return;
    exports.docView = new DocumentationView({});
    $(atom.views.getView(atom.workspace)).append(exports.docView.$);
}
exports.attach = attach;
function testDocumentationView() {
    exports.docView.setContent({
        display: 'this is awesome', documentation: '\n    some docs\n    over\n    many\n    many li\n\n    lines\n    long\n    so\n    long\n    that\n    it\n    should\n\n    start\n    to\n    scroll\n    ', filePath: 'some filepath'
    });
    exports.docView.show();
}
exports.testDocumentationView = testDocumentationView;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9hdG9tLXR5cGVzY3JpcHQvZGlzdC9tYWluL2F0b20vdmlld3MvZG9jdW1lbnRhdGlvblZpZXcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBSSxTQUFTLEdBQUcsQUFBQyxJQUFJLElBQUksSUFBSSxDQUFDLFNBQVMsSUFBSyxVQUFVLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDeEQsU0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEQsYUFBUyxFQUFFLEdBQUc7QUFBRSxZQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQztLQUFFO0FBQ3ZDLEtBQUMsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxLQUFLLElBQUksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFBLEFBQUMsQ0FBQztDQUN4RixDQUFDO0FBQ0YsSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzdCLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDZixJQUFJLGlCQUFpQixHQUFHLENBQUMsVUFBVSxNQUFNLEVBQUU7QUFDdkMsYUFBUyxDQUFDLGlCQUFpQixFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3JDLGFBQVMsaUJBQWlCLEdBQUc7QUFDekIsY0FBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDOUIsWUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7S0FDdEI7QUFDRCxxQkFBaUIsQ0FBQyxPQUFPLEdBQUcsWUFBWTtBQUNwQyxZQUFJLEtBQUssR0FBRyxJQUFJLENBQUM7QUFDakIsZUFBTyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsU0FBTyxrQ0FBa0MsRUFBRSxFQUFFLFlBQVk7QUFBRSxtQkFBTyxLQUFLLENBQUMsR0FBRyxDQUFDLFlBQVk7QUFDdEcscUJBQUssQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztBQUMvQixxQkFBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxlQUFlLEVBQUUsQ0FBQyxDQUFDO2FBQ3hDLENBQUMsQ0FBQztTQUFFLENBQUMsQ0FBQztLQUNWLENBQUM7QUFDRixxQkFBaUIsQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFHLFlBQVk7QUFBRSxZQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxBQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0tBQUUsQ0FBQztBQUNqRyxxQkFBaUIsQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFHLFlBQVk7QUFBRSxZQUFJLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxBQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0tBQUUsQ0FBQztBQUNyRyxxQkFBaUIsQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLFlBQVk7QUFBRSxZQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7QUFDL0QsZ0JBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztTQUNmLE1BQ0k7QUFDRCxnQkFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1NBQ2Y7S0FBRSxDQUFDO0FBQ0oscUJBQWlCLENBQUMsU0FBUyxDQUFDLFVBQVUsR0FBRyxVQUFVLE9BQU8sRUFBRTtBQUN4RCxZQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDbEMsZUFBTyxDQUFDLGFBQWEsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUNuRixZQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7S0FDbEQsQ0FBQztBQUNGLHFCQUFpQixDQUFDLFNBQVMsQ0FBQyxZQUFZLEdBQUcsWUFBWTtBQUNuRCxZQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUM7QUFDbEQsWUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3BDLFlBQUksU0FBUyxHQUFHLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDO0FBQ2xFLFlBQUksWUFBWSxHQUFHLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUN0QyxZQUFJLFlBQVksR0FBRyxTQUFTLEdBQUcsR0FBRyxFQUFFO0FBQ2hDLGdCQUFJLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUM3QixnQkFBSSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDMUIsTUFDSTtBQUNELGdCQUFJLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUMxQixnQkFBSSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDN0I7S0FDSixDQUFDO0FBQ0YsV0FBTyxpQkFBaUIsQ0FBQztDQUM1QixDQUFBLENBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2QsT0FBTyxDQUFDLGlCQUFpQixHQUFHLGlCQUFpQixDQUFDO0FBQzlDLFNBQVMsTUFBTSxHQUFHO0FBQ2QsUUFBSSxPQUFPLENBQUMsT0FBTyxFQUNmLE9BQU87QUFDWCxXQUFPLENBQUMsT0FBTyxHQUFHLElBQUksaUJBQWlCLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDNUMsS0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ25FO0FBQ0QsT0FBTyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7QUFDeEIsU0FBUyxxQkFBcUIsR0FBRztBQUM3QixXQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQztBQUN2QixlQUFPLEVBQUUsaUJBQWlCLEVBQUUsYUFBYSxFQUFFLGdLQUFnSyxFQUFFLFFBQVEsRUFBRSxlQUFlO0tBQ3pPLENBQUMsQ0FBQztBQUNILFdBQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7Q0FDMUI7QUFDRCxPQUFPLENBQUMscUJBQXFCLEdBQUcscUJBQXFCLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL2F0b20tdHlwZXNjcmlwdC9kaXN0L21haW4vYXRvbS92aWV3cy9kb2N1bWVudGF0aW9uVmlldy5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgZnVuY3Rpb24gKGQsIGIpIHtcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG59O1xudmFyIHZpZXcgPSByZXF1aXJlKCcuL3ZpZXcnKTtcbnZhciAkID0gdmlldy4kO1xudmFyIERvY3VtZW50YXRpb25WaWV3ID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoRG9jdW1lbnRhdGlvblZpZXcsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gRG9jdW1lbnRhdGlvblZpZXcoKSB7XG4gICAgICAgIF9zdXBlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB0aGlzLnNob3duID0gZmFsc2U7XG4gICAgfVxuICAgIERvY3VtZW50YXRpb25WaWV3LmNvbnRlbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHJldHVybiB0aGlzLmRpdih7IGNsYXNzOiAnYXRvbS10cy1kb2N1bWVudGF0aW9uIHBhZGRlZCB0b3AnIH0sIGZ1bmN0aW9uICgpIHsgcmV0dXJuIF90aGlzLmRpdihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBfdGhpcy5oMih7IG91dGxldDogJ2hlYWRlcicgfSk7XG4gICAgICAgICAgICBfdGhpcy5wKHsgb3V0bGV0OiAnZG9jdW1lbnRhdGlvbicgfSk7XG4gICAgICAgIH0pOyB9KTtcbiAgICB9O1xuICAgIERvY3VtZW50YXRpb25WaWV3LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gKCkgeyB0aGlzLiQuYWRkQ2xhc3MoJ2FjdGl2ZScpOyB0aGlzLnNob3duID0gdHJ1ZTsgfTtcbiAgICBEb2N1bWVudGF0aW9uVmlldy5wcm90b3R5cGUuaGlkZSA9IGZ1bmN0aW9uICgpIHsgdGhpcy4kLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTsgdGhpcy5zaG93biA9IGZhbHNlOyB9O1xuICAgIERvY3VtZW50YXRpb25WaWV3LnByb3RvdHlwZS50b2dnbGUgPSBmdW5jdGlvbiAoKSB7IGlmICh0aGlzLnNob3duKSB7XG4gICAgICAgIHRoaXMuaGlkZSgpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5zaG93KCk7XG4gICAgfSB9O1xuICAgIERvY3VtZW50YXRpb25WaWV3LnByb3RvdHlwZS5zZXRDb250ZW50ID0gZnVuY3Rpb24gKGNvbnRlbnQpIHtcbiAgICAgICAgdGhpcy5oZWFkZXIuaHRtbChjb250ZW50LmRpc3BsYXkpO1xuICAgICAgICBjb250ZW50LmRvY3VtZW50YXRpb24gPSBjb250ZW50LmRvY3VtZW50YXRpb24ucmVwbGFjZSgvKD86XFxyXFxufFxccnxcXG4pL2csICc8YnIgLz4nKTtcbiAgICAgICAgdGhpcy5kb2N1bWVudGF0aW9uLmh0bWwoY29udGVudC5kb2N1bWVudGF0aW9uKTtcbiAgICB9O1xuICAgIERvY3VtZW50YXRpb25WaWV3LnByb3RvdHlwZS5hdXRvUG9zaXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XG4gICAgICAgIHZhciBjdXJzb3IgPSBlZGl0b3IuZ2V0Q3Vyc29ycygpWzBdO1xuICAgICAgICB2YXIgY3Vyc29yVG9wID0gY3Vyc29yLmdldFBpeGVsUmVjdCgpLnRvcCAtIGVkaXRvci5nZXRTY3JvbGxUb3AoKTtcbiAgICAgICAgdmFyIGVkaXRvckhlaWdodCA9IGVkaXRvci5nZXRIZWlnaHQoKTtcbiAgICAgICAgaWYgKGVkaXRvckhlaWdodCAtIGN1cnNvclRvcCA8IDEwMCkge1xuICAgICAgICAgICAgdGhpcy4kLnJlbW92ZUNsYXNzKCdib3R0b20nKTtcbiAgICAgICAgICAgIHRoaXMuJC5hZGRDbGFzcygndG9wJyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiQucmVtb3ZlQ2xhc3MoJ3RvcCcpO1xuICAgICAgICAgICAgdGhpcy4kLmFkZENsYXNzKCdib3R0b20nKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIERvY3VtZW50YXRpb25WaWV3O1xufSkodmlldy5WaWV3KTtcbmV4cG9ydHMuRG9jdW1lbnRhdGlvblZpZXcgPSBEb2N1bWVudGF0aW9uVmlldztcbmZ1bmN0aW9uIGF0dGFjaCgpIHtcbiAgICBpZiAoZXhwb3J0cy5kb2NWaWV3KVxuICAgICAgICByZXR1cm47XG4gICAgZXhwb3J0cy5kb2NWaWV3ID0gbmV3IERvY3VtZW50YXRpb25WaWV3KHt9KTtcbiAgICAkKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSkpLmFwcGVuZChleHBvcnRzLmRvY1ZpZXcuJCk7XG59XG5leHBvcnRzLmF0dGFjaCA9IGF0dGFjaDtcbmZ1bmN0aW9uIHRlc3REb2N1bWVudGF0aW9uVmlldygpIHtcbiAgICBleHBvcnRzLmRvY1ZpZXcuc2V0Q29udGVudCh7XG4gICAgICAgIGRpc3BsYXk6IFwidGhpcyBpcyBhd2Vzb21lXCIsIGRvY3VtZW50YXRpb246IFwiXFxuICAgIHNvbWUgZG9jc1xcbiAgICBvdmVyXFxuICAgIG1hbnlcXG4gICAgbWFueSBsaVxcblxcbiAgICBsaW5lc1xcbiAgICBsb25nXFxuICAgIHNvXFxuICAgIGxvbmdcXG4gICAgdGhhdFxcbiAgICBpdFxcbiAgICBzaG91bGRcXG5cXG4gICAgc3RhcnRcXG4gICAgdG9cXG4gICAgc2Nyb2xsXFxuICAgIFwiLCBmaWxlUGF0aDogXCJzb21lIGZpbGVwYXRoXCJcbiAgICB9KTtcbiAgICBleHBvcnRzLmRvY1ZpZXcuc2hvdygpO1xufVxuZXhwb3J0cy50ZXN0RG9jdW1lbnRhdGlvblZpZXcgPSB0ZXN0RG9jdW1lbnRhdGlvblZpZXc7XG4iXX0=