// Inspiration : https://atom.io/packages/ide-haskell
// and https://atom.io/packages/ide-flow
var atomUtils = require('./atomUtils');
var parent = require('../../worker/parent');
var path = require('path');
var fs = require('fs');
var emissary = require('emissary');
var Subscriber = emissary.Subscriber;
var tooltipView = require('./views/tooltipView');
var TooltipView = tooltipView.TooltipView;
var atom_space_pen_views_1 = require('atom-space-pen-views');
var escape = require('escape-html');
function getFromShadowDom(element, selector) {
    var el = element[0];
    var found = el.rootElement.querySelectorAll(selector);
    return atom_space_pen_views_1.$(found[0]);
}
exports.getFromShadowDom = getFromShadowDom;
function attach(editorView, editor) {
    var rawView = editorView[0];
    var filePath = editor.getPath();
    var filename = path.basename(filePath);
    var ext = path.extname(filename);
    if (!atomUtils.isAllowedExtension(ext)) return;
    if (!fs.existsSync(filePath)) {
        return;
    }
    var scroll = getFromShadowDom(editorView, '.scroll-view');
    var subscriber = new Subscriber();
    var exprTypeTimeout = null;
    var exprTypeTooltip = null;
    var lastExprTypeBufferPt;
    subscriber.subscribe(scroll, 'mousemove', function (e) {
        var pixelPt = pixelPositionFromMouseEvent(editorView, e);
        var screenPt = editor.screenPositionForPixelPosition(pixelPt);
        var bufferPt = editor.bufferPositionForScreenPosition(screenPt);
        if (lastExprTypeBufferPt && lastExprTypeBufferPt.isEqual(bufferPt) && exprTypeTooltip) return;
        lastExprTypeBufferPt = bufferPt;
        clearExprTypeTimeout();
        exprTypeTimeout = setTimeout(function () {
            return showExpressionType(e);
        }, 100);
    });
    subscriber.subscribe(scroll, 'mouseout', function (e) {
        return clearExprTypeTimeout();
    });
    subscriber.subscribe(scroll, 'keydown', function (e) {
        return clearExprTypeTimeout();
    });
    editor.onDidDestroy(function () {
        return deactivate();
    });
    function showExpressionType(e) {
        if (exprTypeTooltip) return;
        var pixelPt = pixelPositionFromMouseEvent(editorView, e);
        pixelPt.top += editor.displayBuffer.getScrollTop();
        pixelPt.left += editor.displayBuffer.getScrollLeft();
        var screenPt = editor.screenPositionForPixelPosition(pixelPt);
        var bufferPt = editor.bufferPositionForScreenPosition(screenPt);
        var curCharPixelPt = rawView.pixelPositionForBufferPosition([bufferPt.row, bufferPt.column]);
        var nextCharPixelPt = rawView.pixelPositionForBufferPosition([bufferPt.row, bufferPt.column + 1]);
        if (curCharPixelPt.left >= nextCharPixelPt.left) return;
        var offset = editor.getLineHeightInPixels() * 0.7;
        var tooltipRect = {
            left: e.clientX,
            right: e.clientX,
            top: e.clientY - offset,
            bottom: e.clientY + offset
        };
        exprTypeTooltip = new TooltipView(tooltipRect);
        var position = atomUtils.getEditorPositionForBufferPosition(editor, bufferPt);
        parent.quickInfo({ filePath: filePath, position: position }).then(function (resp) {
            if (!resp.valid) {
                hideExpressionType();
            } else {
                var message = '<b>' + escape(resp.name) + '</b>';
                if (resp.comment) {
                    message = message + ('<br/><i>' + escape(resp.comment).replace(/(?:\r\n|\r|\n)/g, '<br />') + '</i>');
                }
                if (exprTypeTooltip) {
                    exprTypeTooltip.updateText(message);
                }
            }
        });
    }
    function deactivate() {
        subscriber.unsubscribe();
        clearExprTypeTimeout();
    }
    function clearExprTypeTimeout() {
        if (exprTypeTimeout) {
            clearTimeout(exprTypeTimeout);
            exprTypeTimeout = null;
        }
        hideExpressionType();
    }
    function hideExpressionType() {
        if (!exprTypeTooltip) return;
        exprTypeTooltip.$.remove();
        exprTypeTooltip = null;
    }
}
exports.attach = attach;
function pixelPositionFromMouseEvent(editorView, event) {
    var clientX = event.clientX,
        clientY = event.clientY;
    var linesClientRect = getFromShadowDom(editorView, '.lines')[0].getBoundingClientRect();
    var top = clientY - linesClientRect.top;
    var left = clientX - linesClientRect.left;
    return { top: top, left: left };
}
function screenPositionFromMouseEvent(editorView, event) {
    return editorView.getModel().screenPositionForPixelPosition(pixelPositionFromMouseEvent(editorView, event));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9hdG9tLXR5cGVzY3JpcHQvZGlzdC9tYWluL2F0b20vdG9vbHRpcE1hbmFnZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQSxJQUFJLFNBQVMsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDdkMsSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLHFCQUFxQixDQUFDLENBQUM7QUFDNUMsSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzNCLElBQUksRUFBRSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN2QixJQUFJLFFBQVEsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDbkMsSUFBSSxVQUFVLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQztBQUNyQyxJQUFJLFdBQVcsR0FBRyxPQUFPLENBQUMscUJBQXFCLENBQUMsQ0FBQztBQUNqRCxJQUFJLFdBQVcsR0FBRyxXQUFXLENBQUMsV0FBVyxDQUFDO0FBQzFDLElBQUksc0JBQXNCLEdBQUcsT0FBTyxDQUFDLHNCQUFzQixDQUFDLENBQUM7QUFDN0QsSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ3BDLFNBQVMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRTtBQUN6QyxRQUFJLEVBQUUsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEIsUUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUN0RCxXQUFPLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUM3QztBQUNELE9BQU8sQ0FBQyxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQztBQUM1QyxTQUFTLE1BQU0sQ0FBQyxVQUFVLEVBQUUsTUFBTSxFQUFFO0FB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VSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7Q0FDL0ciLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL2F0b20tdHlwZXNjcmlwdC9kaXN0L21haW4vYXRvbS90b29sdGlwTWFuYWdlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIEluc3BpcmF0aW9uIDogaHR0cHM6Ly9hdG9tLmlvL3BhY2thZ2VzL2lkZS1oYXNrZWxsXG4vLyBhbmQgaHR0cHM6Ly9hdG9tLmlvL3BhY2thZ2VzL2lkZS1mbG93XG52YXIgYXRvbVV0aWxzID0gcmVxdWlyZSgnLi9hdG9tVXRpbHMnKTtcbnZhciBwYXJlbnQgPSByZXF1aXJlKCcuLi8uLi93b3JrZXIvcGFyZW50Jyk7XG52YXIgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbnZhciBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG52YXIgZW1pc3NhcnkgPSByZXF1aXJlKCdlbWlzc2FyeScpO1xudmFyIFN1YnNjcmliZXIgPSBlbWlzc2FyeS5TdWJzY3JpYmVyO1xudmFyIHRvb2x0aXBWaWV3ID0gcmVxdWlyZSgnLi92aWV3cy90b29sdGlwVmlldycpO1xudmFyIFRvb2x0aXBWaWV3ID0gdG9vbHRpcFZpZXcuVG9vbHRpcFZpZXc7XG52YXIgYXRvbV9zcGFjZV9wZW5fdmlld3NfMSA9IHJlcXVpcmUoXCJhdG9tLXNwYWNlLXBlbi12aWV3c1wiKTtcbnZhciBlc2NhcGUgPSByZXF1aXJlKCdlc2NhcGUtaHRtbCcpO1xuZnVuY3Rpb24gZ2V0RnJvbVNoYWRvd0RvbShlbGVtZW50LCBzZWxlY3Rvcikge1xuICAgIHZhciBlbCA9IGVsZW1lbnRbMF07XG4gICAgdmFyIGZvdW5kID0gZWwucm9vdEVsZW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG4gICAgcmV0dXJuIGF0b21fc3BhY2VfcGVuX3ZpZXdzXzEuJChmb3VuZFswXSk7XG59XG5leHBvcnRzLmdldEZyb21TaGFkb3dEb20gPSBnZXRGcm9tU2hhZG93RG9tO1xuZnVuY3Rpb24gYXR0YWNoKGVkaXRvclZpZXcsIGVkaXRvcikge1xuICAgIHZhciByYXdWaWV3ID0gZWRpdG9yVmlld1swXTtcbiAgICB2YXIgZmlsZVBhdGggPSBlZGl0b3IuZ2V0UGF0aCgpO1xuICAgIHZhciBmaWxlbmFtZSA9IHBhdGguYmFzZW5hbWUoZmlsZVBhdGgpO1xuICAgIHZhciBleHQgPSBwYXRoLmV4dG5hbWUoZmlsZW5hbWUpO1xuICAgIGlmICghYXRvbVV0aWxzLmlzQWxsb3dlZEV4dGVuc2lvbihleHQpKVxuICAgICAgICByZXR1cm47XG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKGZpbGVQYXRoKSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBzY3JvbGwgPSBnZXRGcm9tU2hhZG93RG9tKGVkaXRvclZpZXcsICcuc2Nyb2xsLXZpZXcnKTtcbiAgICB2YXIgc3Vic2NyaWJlciA9IG5ldyBTdWJzY3JpYmVyKCk7XG4gICAgdmFyIGV4cHJUeXBlVGltZW91dCA9IG51bGw7XG4gICAgdmFyIGV4cHJUeXBlVG9vbHRpcCA9IG51bGw7XG4gICAgdmFyIGxhc3RFeHByVHlwZUJ1ZmZlclB0O1xuICAgIHN1YnNjcmliZXIuc3Vic2NyaWJlKHNjcm9sbCwgJ21vdXNlbW92ZScsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHZhciBwaXhlbFB0ID0gcGl4ZWxQb3NpdGlvbkZyb21Nb3VzZUV2ZW50KGVkaXRvclZpZXcsIGUpO1xuICAgICAgICB2YXIgc2NyZWVuUHQgPSBlZGl0b3Iuc2NyZWVuUG9zaXRpb25Gb3JQaXhlbFBvc2l0aW9uKHBpeGVsUHQpO1xuICAgICAgICB2YXIgYnVmZmVyUHQgPSBlZGl0b3IuYnVmZmVyUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihzY3JlZW5QdCk7XG4gICAgICAgIGlmIChsYXN0RXhwclR5cGVCdWZmZXJQdCAmJiBsYXN0RXhwclR5cGVCdWZmZXJQdC5pc0VxdWFsKGJ1ZmZlclB0KSAmJiBleHByVHlwZVRvb2x0aXApXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGxhc3RFeHByVHlwZUJ1ZmZlclB0ID0gYnVmZmVyUHQ7XG4gICAgICAgIGNsZWFyRXhwclR5cGVUaW1lb3V0KCk7XG4gICAgICAgIGV4cHJUeXBlVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyByZXR1cm4gc2hvd0V4cHJlc3Npb25UeXBlKGUpOyB9LCAxMDApO1xuICAgIH0pO1xuICAgIHN1YnNjcmliZXIuc3Vic2NyaWJlKHNjcm9sbCwgJ21vdXNlb3V0JywgZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGNsZWFyRXhwclR5cGVUaW1lb3V0KCk7IH0pO1xuICAgIHN1YnNjcmliZXIuc3Vic2NyaWJlKHNjcm9sbCwgJ2tleWRvd24nLCBmdW5jdGlvbiAoZSkgeyByZXR1cm4gY2xlYXJFeHByVHlwZVRpbWVvdXQoKTsgfSk7XG4gICAgZWRpdG9yLm9uRGlkRGVzdHJveShmdW5jdGlvbiAoKSB7IHJldHVybiBkZWFjdGl2YXRlKCk7IH0pO1xuICAgIGZ1bmN0aW9uIHNob3dFeHByZXNzaW9uVHlwZShlKSB7XG4gICAgICAgIGlmIChleHByVHlwZVRvb2x0aXApXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHZhciBwaXhlbFB0ID0gcGl4ZWxQb3NpdGlvbkZyb21Nb3VzZUV2ZW50KGVkaXRvclZpZXcsIGUpO1xuICAgICAgICBwaXhlbFB0LnRvcCArPSBlZGl0b3IuZGlzcGxheUJ1ZmZlci5nZXRTY3JvbGxUb3AoKTtcbiAgICAgICAgcGl4ZWxQdC5sZWZ0ICs9IGVkaXRvci5kaXNwbGF5QnVmZmVyLmdldFNjcm9sbExlZnQoKTtcbiAgICAgICAgdmFyIHNjcmVlblB0ID0gZWRpdG9yLnNjcmVlblBvc2l0aW9uRm9yUGl4ZWxQb3NpdGlvbihwaXhlbFB0KTtcbiAgICAgICAgdmFyIGJ1ZmZlclB0ID0gZWRpdG9yLmJ1ZmZlclBvc2l0aW9uRm9yU2NyZWVuUG9zaXRpb24oc2NyZWVuUHQpO1xuICAgICAgICB2YXIgY3VyQ2hhclBpeGVsUHQgPSByYXdWaWV3LnBpeGVsUG9zaXRpb25Gb3JCdWZmZXJQb3NpdGlvbihbYnVmZmVyUHQucm93LCBidWZmZXJQdC5jb2x1bW5dKTtcbiAgICAgICAgdmFyIG5leHRDaGFyUGl4ZWxQdCA9IHJhd1ZpZXcucGl4ZWxQb3NpdGlvbkZvckJ1ZmZlclBvc2l0aW9uKFtidWZmZXJQdC5yb3csIGJ1ZmZlclB0LmNvbHVtbiArIDFdKTtcbiAgICAgICAgaWYgKGN1ckNoYXJQaXhlbFB0LmxlZnQgPj0gbmV4dENoYXJQaXhlbFB0LmxlZnQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHZhciBvZmZzZXQgPSBlZGl0b3IuZ2V0TGluZUhlaWdodEluUGl4ZWxzKCkgKiAwLjc7XG4gICAgICAgIHZhciB0b29sdGlwUmVjdCA9IHtcbiAgICAgICAgICAgIGxlZnQ6IGUuY2xpZW50WCxcbiAgICAgICAgICAgIHJpZ2h0OiBlLmNsaWVudFgsXG4gICAgICAgICAgICB0b3A6IGUuY2xpZW50WSAtIG9mZnNldCxcbiAgICAgICAgICAgIGJvdHRvbTogZS5jbGllbnRZICsgb2Zmc2V0XG4gICAgICAgIH07XG4gICAgICAgIGV4cHJUeXBlVG9vbHRpcCA9IG5ldyBUb29sdGlwVmlldyh0b29sdGlwUmVjdCk7XG4gICAgICAgIHZhciBwb3NpdGlvbiA9IGF0b21VdGlscy5nZXRFZGl0b3JQb3NpdGlvbkZvckJ1ZmZlclBvc2l0aW9uKGVkaXRvciwgYnVmZmVyUHQpO1xuICAgICAgICBwYXJlbnQucXVpY2tJbmZvKHsgZmlsZVBhdGg6IGZpbGVQYXRoLCBwb3NpdGlvbjogcG9zaXRpb24gfSkudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgICAgaWYgKCFyZXNwLnZhbGlkKSB7XG4gICAgICAgICAgICAgICAgaGlkZUV4cHJlc3Npb25UeXBlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgbWVzc2FnZSA9IFwiPGI+XCIgKyBlc2NhcGUocmVzcC5uYW1lKSArIFwiPC9iPlwiO1xuICAgICAgICAgICAgICAgIGlmIChyZXNwLmNvbW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9IG1lc3NhZ2UgKyAoXCI8YnIvPjxpPlwiICsgZXNjYXBlKHJlc3AuY29tbWVudCkucmVwbGFjZSgvKD86XFxyXFxufFxccnxcXG4pL2csICc8YnIgLz4nKSArIFwiPC9pPlwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGV4cHJUeXBlVG9vbHRpcCkge1xuICAgICAgICAgICAgICAgICAgICBleHByVHlwZVRvb2x0aXAudXBkYXRlVGV4dChtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBkZWFjdGl2YXRlKCkge1xuICAgICAgICBzdWJzY3JpYmVyLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgIGNsZWFyRXhwclR5cGVUaW1lb3V0KCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNsZWFyRXhwclR5cGVUaW1lb3V0KCkge1xuICAgICAgICBpZiAoZXhwclR5cGVUaW1lb3V0KSB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQoZXhwclR5cGVUaW1lb3V0KTtcbiAgICAgICAgICAgIGV4cHJUeXBlVGltZW91dCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaGlkZUV4cHJlc3Npb25UeXBlKCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGhpZGVFeHByZXNzaW9uVHlwZSgpIHtcbiAgICAgICAgaWYgKCFleHByVHlwZVRvb2x0aXApXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGV4cHJUeXBlVG9vbHRpcC4kLnJlbW92ZSgpO1xuICAgICAgICBleHByVHlwZVRvb2x0aXAgPSBudWxsO1xuICAgIH1cbn1cbmV4cG9ydHMuYXR0YWNoID0gYXR0YWNoO1xuZnVuY3Rpb24gcGl4ZWxQb3NpdGlvbkZyb21Nb3VzZUV2ZW50KGVkaXRvclZpZXcsIGV2ZW50KSB7XG4gICAgdmFyIGNsaWVudFggPSBldmVudC5jbGllbnRYLCBjbGllbnRZID0gZXZlbnQuY2xpZW50WTtcbiAgICB2YXIgbGluZXNDbGllbnRSZWN0ID0gZ2V0RnJvbVNoYWRvd0RvbShlZGl0b3JWaWV3LCAnLmxpbmVzJylbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgdmFyIHRvcCA9IGNsaWVudFkgLSBsaW5lc0NsaWVudFJlY3QudG9wO1xuICAgIHZhciBsZWZ0ID0gY2xpZW50WCAtIGxpbmVzQ2xpZW50UmVjdC5sZWZ0O1xuICAgIHJldHVybiB7IHRvcDogdG9wLCBsZWZ0OiBsZWZ0IH07XG59XG5mdW5jdGlvbiBzY3JlZW5Qb3NpdGlvbkZyb21Nb3VzZUV2ZW50KGVkaXRvclZpZXcsIGV2ZW50KSB7XG4gICAgcmV0dXJuIGVkaXRvclZpZXcuZ2V0TW9kZWwoKS5zY3JlZW5Qb3NpdGlvbkZvclBpeGVsUG9zaXRpb24ocGl4ZWxQb3NpdGlvbkZyb21Nb3VzZUV2ZW50KGVkaXRvclZpZXcsIGV2ZW50KSk7XG59XG4iXX0=