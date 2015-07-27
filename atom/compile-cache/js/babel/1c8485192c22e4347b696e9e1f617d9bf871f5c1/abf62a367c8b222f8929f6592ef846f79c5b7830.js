/**
 * Things we care about:
 * name , kind , text
 */
// Inspired by `ts.forEachChild`:
// https://github.com/Microsoft/TypeScript/blob/65cbd91667acf890f21a3527b3647c7bc994ca32/src/compiler/parser.ts#L43-L320
var astUtils_1 = require('../fixmyts/astUtils');
function astToText(srcFile) {
    //// A useful function for debugging
    // aggregate(srcFile, 0);
    // function aggregate(node: ts.Node, depth: number): void {
    //     console.error(node.kind, (node.name && node.name.text), (node.parent), depth, node);
    //     ts.forEachChild(node, (node) => aggregate(node, depth + 1));
    // }
    var nodeIndex = 0;
    function nodeToNodeDisplay(node, depth) {
        var kind = astUtils_1.syntaxKindToString(node.kind);
        var children = [];
        ts.forEachChild(node, function (cNode) {
            var child = nodeToNodeDisplay(cNode, depth + 1);
            children.push(child);
        });
        var ret = {
            kind: kind,
            children: children,
            pos: node.pos,
            end: node.end,
            depth: depth,
            nodeIndex: nodeIndex,
            rawJson: prettyJSONNoParent(node)
        };
        nodeIndex++;
        return ret;
    }
    var root = nodeToNodeDisplay(srcFile, 0);
    return root;
}
exports.astToText = astToText;
function astToTextFull(srcFile) {
    //// A useful function for debugging
    // aggregate(srcFile, 0);
    // function aggregate(node: ts.Node, depth: number): void {
    //     console.error(node.kind, (node.name && node.name.text), (node.parent), depth, node);
    //     ts.forEachChild(node, (node) => aggregate(node, depth + 1));
    // }
    var nodeIndex = 0;
    function nodeToNodeDisplay(node, depth) {
        var kind = astUtils_1.syntaxKindToString(node.kind);
        var children = [];
        node.getChildren().forEach(function (cNode) {
            var child = nodeToNodeDisplay(cNode, depth + 1);
            children.push(child);
        });
        var ret = {
            kind: kind,
            children: children,
            pos: node.pos,
            end: node.end,
            depth: depth,
            nodeIndex: nodeIndex,
            rawJson: prettyJSONNoParent(node)
        };
        nodeIndex++;
        return ret;
    }
    var root = nodeToNodeDisplay(srcFile, 0);
    return root;
}
exports.astToTextFull = astToTextFull;
function prettyJSONNoParent(object) {
    var cache = [];
    var value = JSON.stringify(object, function (key, value) {
        if (key == 'parent') {
            return;
        }
        if (typeof value === 'object' && value !== null) {
            if (cache.indexOf(value) !== -1) {
                return;
            }
            cache.push(value);
        }
        return value;
    }, 4);
    cache = null;
    return value;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9hdG9tLXR5cGVzY3JpcHQvZGlzdC9tYWluL2xhbmcvbW9kdWxlcy9hc3RUb1RleHQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBTUEsSUFBSSxVQUFVLEdBQUcsT0FBTyxDQUFDLHFCQUFxQixDQUFDLENBQUM7QUFDaEQsU0FBUyxTQUFTLENBQUMsT0FBTyxFQUFFOzs7Ozs7O0FBT3hCLFFBQUksU0FBUyxHQUFHLENBQUMsQ0FBQztBQUNsQixhQUFTLGlCQUFpQixDQUFDLElBQUksRUFBRSxLQUFLLEVBQUU7QUFDcEMsWUFBSSxJQUFJLEdBQUcsVUFBVSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNwRCxZQUFJLFFBQVEsR0FBRyxFQUFFLENBQUM7QUFDbEIsVUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsVUFBVSxLQUFLLEVBQUU7QUFDbkMsZ0JBQUksS0FBSyxHQUFHLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDaEQsb0JBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDeEIsQ0FBQyxDQUFDO0FBQ0gsWUFBSSxHQUFHLEdBQUc7QUFDTixnQkFBSSxFQUFFLElBQUk7QUFDVixvQkFBUSxFQUFFLFFBQVE7QUFDbEIsZUFBRyxFQUFFLElBQUksQ0FBQyxHQUFHO0FBQ2IsZUFBRyxFQUFFLElBQUksQ0FBQyxHQUFHO0FBQ2IsaUJBQUssRUFBRSxLQUFLO0FBQ1oscUJBQVMsRUFBRSxTQUFTO0FBQ3BCLG1CQUFPLEVBQUUsa0JBQWtCLENBQUMsSUFBSSxDQUFDO1NBQ3BDLENBQUM7QUFDRixpQkFBUyxFQUFFLENBQUM7QUFDWixlQUFPLEdBQUcsQ0FBQztLQUNkO0FBQ0QsUUFBSSxJQUFJLEdBQUcsaUJBQWlCLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3pDLFdBQU8sSUFBSSxDQUFDO0NBQ2Y7QUFDRCxPQUFPLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztBQUM5QixTQUFTLGFBQWEsQ0FBQyxPQUFPLEVBQUU7Ozs7Ozs7QUFPNUIsUUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDO0FBQ2xCLGFBQVMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRTtBQUNwQyxZQUFJLElBQUksR0FBRyxVQUFVLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3BELFlBQUksUUFBUSxHQUFHLEVBQUUsQ0FBQztBQUNsQixZQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsT0FBTyxDQUFDLFVBQVUsS0FBSyxFQUFFO0FBQ3hDLGdCQUFJLEtBQUssR0FBRyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ2hELG9CQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3hCLENBQUMsQ0FBQztBQUNILFlBQUksR0FBRyxHQUFHO0FBQ04sZ0JBQUksRUFBRSxJQUFJO0FBQ1Ysb0JBQVEsRUFBRSxRQUFRO0FBQ2xCLGVBQUcsRUFBRSxJQUFJLENBQUMsR0FBRztBQUNiLGVBQUcsRUFBRSxJQUFJLENBQUMsR0FBRztBQUNiLGlCQUFLLEVBQUUsS0FBSztBQUNaLHFCQUFTLEVBQUUsU0FBUztBQUNwQixtQkFBTyxFQUFFLGtCQUFrQixDQUFDLElBQUksQ0FBQztTQUNwQyxDQUFDO0FBQ0YsaUJBQVMsRUFBRSxDQUFDO0FBQ1osZUFBTyxHQUFHLENBQUM7S0FDZDtBQUNELFFBQUksSUFBSSxHQUFHLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztBQUN6QyxXQUFPLElBQUksQ0FBQztDQUNmO0FBQ0QsT0FBTyxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUM7QUFDdEMsU0FBUyxrQkFBa0IsQ0FBQyxNQUFNLEVBQUU7QUFDaEMsUUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ2YsUUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsVUFBVSxHQUFHLEVBQUUsS0FBSyxFQUFFO0FBQ3JELFlBQUksR0FBRyxJQUFJLFFBQVEsRUFBRTtBQUNqQixtQkFBTztTQUNWO0FBQ0QsWUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksS0FBSyxLQUFLLElBQUksRUFBRTtBQUM3QyxnQkFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO0FBQzdCLHVCQUFPO2FBQ1Y7QUFDRCxpQkFBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNyQjtBQUNELGVBQU8sS0FBSyxDQUFDO0tBQ2hCLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDTixTQUFLLEdBQUcsSUFBSSxDQUFDO0FBQ2IsV0FBTyxLQUFLLENBQUM7Q0FDaEIiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL2F0b20tdHlwZXNjcmlwdC9kaXN0L21haW4vbGFuZy9tb2R1bGVzL2FzdFRvVGV4dC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGhpbmdzIHdlIGNhcmUgYWJvdXQ6XG4gKiBuYW1lICwga2luZCAsIHRleHRcbiAqL1xuLy8gSW5zcGlyZWQgYnkgYHRzLmZvckVhY2hDaGlsZGA6XG4vLyBodHRwczovL2dpdGh1Yi5jb20vTWljcm9zb2Z0L1R5cGVTY3JpcHQvYmxvYi82NWNiZDkxNjY3YWNmODkwZjIxYTM1MjdiMzY0N2M3YmM5OTRjYTMyL3NyYy9jb21waWxlci9wYXJzZXIudHMjTDQzLUwzMjBcbnZhciBhc3RVdGlsc18xID0gcmVxdWlyZShcIi4uL2ZpeG15dHMvYXN0VXRpbHNcIik7XG5mdW5jdGlvbiBhc3RUb1RleHQoc3JjRmlsZSkge1xuICAgIC8vLy8gQSB1c2VmdWwgZnVuY3Rpb24gZm9yIGRlYnVnZ2luZ1xuICAgIC8vIGFnZ3JlZ2F0ZShzcmNGaWxlLCAwKTtcbiAgICAvLyBmdW5jdGlvbiBhZ2dyZWdhdGUobm9kZTogdHMuTm9kZSwgZGVwdGg6IG51bWJlcik6IHZvaWQge1xuICAgIC8vICAgICBjb25zb2xlLmVycm9yKG5vZGUua2luZCwgKG5vZGUubmFtZSAmJiBub2RlLm5hbWUudGV4dCksIChub2RlLnBhcmVudCksIGRlcHRoLCBub2RlKTtcbiAgICAvLyAgICAgdHMuZm9yRWFjaENoaWxkKG5vZGUsIChub2RlKSA9PiBhZ2dyZWdhdGUobm9kZSwgZGVwdGggKyAxKSk7XG4gICAgLy8gfVxuICAgIHZhciBub2RlSW5kZXggPSAwO1xuICAgIGZ1bmN0aW9uIG5vZGVUb05vZGVEaXNwbGF5KG5vZGUsIGRlcHRoKSB7XG4gICAgICAgIHZhciBraW5kID0gYXN0VXRpbHNfMS5zeW50YXhLaW5kVG9TdHJpbmcobm9kZS5raW5kKTtcbiAgICAgICAgdmFyIGNoaWxkcmVuID0gW107XG4gICAgICAgIHRzLmZvckVhY2hDaGlsZChub2RlLCBmdW5jdGlvbiAoY05vZGUpIHtcbiAgICAgICAgICAgIHZhciBjaGlsZCA9IG5vZGVUb05vZGVEaXNwbGF5KGNOb2RlLCBkZXB0aCArIDEpO1xuICAgICAgICAgICAgY2hpbGRyZW4ucHVzaChjaGlsZCk7XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgcmV0ID0ge1xuICAgICAgICAgICAga2luZDoga2luZCxcbiAgICAgICAgICAgIGNoaWxkcmVuOiBjaGlsZHJlbixcbiAgICAgICAgICAgIHBvczogbm9kZS5wb3MsXG4gICAgICAgICAgICBlbmQ6IG5vZGUuZW5kLFxuICAgICAgICAgICAgZGVwdGg6IGRlcHRoLFxuICAgICAgICAgICAgbm9kZUluZGV4OiBub2RlSW5kZXgsXG4gICAgICAgICAgICByYXdKc29uOiBwcmV0dHlKU09OTm9QYXJlbnQobm9kZSlcbiAgICAgICAgfTtcbiAgICAgICAgbm9kZUluZGV4Kys7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxuICAgIHZhciByb290ID0gbm9kZVRvTm9kZURpc3BsYXkoc3JjRmlsZSwgMCk7XG4gICAgcmV0dXJuIHJvb3Q7XG59XG5leHBvcnRzLmFzdFRvVGV4dCA9IGFzdFRvVGV4dDtcbmZ1bmN0aW9uIGFzdFRvVGV4dEZ1bGwoc3JjRmlsZSkge1xuICAgIC8vLy8gQSB1c2VmdWwgZnVuY3Rpb24gZm9yIGRlYnVnZ2luZ1xuICAgIC8vIGFnZ3JlZ2F0ZShzcmNGaWxlLCAwKTtcbiAgICAvLyBmdW5jdGlvbiBhZ2dyZWdhdGUobm9kZTogdHMuTm9kZSwgZGVwdGg6IG51bWJlcik6IHZvaWQge1xuICAgIC8vICAgICBjb25zb2xlLmVycm9yKG5vZGUua2luZCwgKG5vZGUubmFtZSAmJiBub2RlLm5hbWUudGV4dCksIChub2RlLnBhcmVudCksIGRlcHRoLCBub2RlKTtcbiAgICAvLyAgICAgdHMuZm9yRWFjaENoaWxkKG5vZGUsIChub2RlKSA9PiBhZ2dyZWdhdGUobm9kZSwgZGVwdGggKyAxKSk7XG4gICAgLy8gfVxuICAgIHZhciBub2RlSW5kZXggPSAwO1xuICAgIGZ1bmN0aW9uIG5vZGVUb05vZGVEaXNwbGF5KG5vZGUsIGRlcHRoKSB7XG4gICAgICAgIHZhciBraW5kID0gYXN0VXRpbHNfMS5zeW50YXhLaW5kVG9TdHJpbmcobm9kZS5raW5kKTtcbiAgICAgICAgdmFyIGNoaWxkcmVuID0gW107XG4gICAgICAgIG5vZGUuZ2V0Q2hpbGRyZW4oKS5mb3JFYWNoKGZ1bmN0aW9uIChjTm9kZSkge1xuICAgICAgICAgICAgdmFyIGNoaWxkID0gbm9kZVRvTm9kZURpc3BsYXkoY05vZGUsIGRlcHRoICsgMSk7XG4gICAgICAgICAgICBjaGlsZHJlbi5wdXNoKGNoaWxkKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciByZXQgPSB7XG4gICAgICAgICAgICBraW5kOiBraW5kLFxuICAgICAgICAgICAgY2hpbGRyZW46IGNoaWxkcmVuLFxuICAgICAgICAgICAgcG9zOiBub2RlLnBvcyxcbiAgICAgICAgICAgIGVuZDogbm9kZS5lbmQsXG4gICAgICAgICAgICBkZXB0aDogZGVwdGgsXG4gICAgICAgICAgICBub2RlSW5kZXg6IG5vZGVJbmRleCxcbiAgICAgICAgICAgIHJhd0pzb246IHByZXR0eUpTT05Ob1BhcmVudChub2RlKVxuICAgICAgICB9O1xuICAgICAgICBub2RlSW5kZXgrKztcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG4gICAgdmFyIHJvb3QgPSBub2RlVG9Ob2RlRGlzcGxheShzcmNGaWxlLCAwKTtcbiAgICByZXR1cm4gcm9vdDtcbn1cbmV4cG9ydHMuYXN0VG9UZXh0RnVsbCA9IGFzdFRvVGV4dEZ1bGw7XG5mdW5jdGlvbiBwcmV0dHlKU09OTm9QYXJlbnQob2JqZWN0KSB7XG4gICAgdmFyIGNhY2hlID0gW107XG4gICAgdmFyIHZhbHVlID0gSlNPTi5zdHJpbmdpZnkob2JqZWN0LCBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICBpZiAoa2V5ID09ICdwYXJlbnQnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGlmIChjYWNoZS5pbmRleE9mKHZhbHVlKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYWNoZS5wdXNoKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfSwgNCk7XG4gICAgY2FjaGUgPSBudWxsO1xuICAgIHJldHVybiB2YWx1ZTtcbn1cbiJdfQ==