exports.forEachChild = ts.forEachChild;
function forEachChildRecursive(node, cbNode, depth) {
    if (depth === void 0) {
        depth = 0;
    }
    var res = cbNode(node, depth);
    forEachChildRecursive(node, cbNode, depth + 1);
    return res;
}
exports.forEachChildRecursive = forEachChildRecursive;
function syntaxKindToString(syntaxKind) {
    return ts.SyntaxKind[syntaxKind];
}
exports.syntaxKindToString = syntaxKindToString;
function getNodeByKindAndName(program, kind, name) {
    var found = undefined;
    function findNode(node) {
        if (node.kind == kind) {
            if (node.kind == 211) {
                if (node.name.text == name) {
                    found = node;
                }
            }
            if (node.kind == 212) {
                if (node.name.text == name) {
                    found = node;
                }
            }
        }
        if (!found) {
            exports.forEachChild(node, findNode);
        }
    }
    for (var _i = 0, _a = program.getSourceFiles(); _i < _a.length; _i++) {
        var file = _a[_i];
        exports.forEachChild(file, findNode);
    }
    return found;
}
exports.getNodeByKindAndName = getNodeByKindAndName;
function getSourceFileImports(srcFile) {
    var modules = [];
    getImports(srcFile, modules);
    return modules;
}
exports.getSourceFileImports = getSourceFileImports;
function getSourceFileImportsWithTextRange(srcFile) {
    var modules = [];
    getImportsWithTextRange(srcFile, modules);
    return modules;
}
exports.getSourceFileImportsWithTextRange = getSourceFileImportsWithTextRange;
function getImports(searchNode, importedModules) {
    ts.forEachChild(searchNode, function (node) {
        if (node.kind === 219 || node.kind === 218 || node.kind === 225) {
            var moduleNameExpr = getExternalModuleName(node);
            if (moduleNameExpr && moduleNameExpr.kind === 8) {
                importedModules.push(moduleNameExpr.text);
            }
        } else if (node.kind === 215 && node.name.kind === 8) {
            getImports(node.body, importedModules);
        }
    });
}
function getExternalModuleName(node) {
    if (node.kind === 219) {
        return node.moduleSpecifier;
    }
    if (node.kind === 218) {
        var reference = node.moduleReference;
        if (reference.kind === 229) {
            return reference.expression;
        }
    }
    if (node.kind === 225) {
        return node.moduleSpecifier;
    }
}
function getImportsWithTextRange(searchNode, importedModules) {
    ts.forEachChild(searchNode, function (node) {
        if (node.kind === 219 || node.kind === 218 || node.kind === 225) {
            var moduleNameExpr = getExternalModuleName(node);
            if (moduleNameExpr && moduleNameExpr.kind === 8) {
                var moduleExpr = moduleNameExpr;
                importedModules.push({
                    text: moduleExpr.text,
                    range: { pos: moduleExpr.getStart() + 1, end: moduleExpr.getEnd() - 1 }
                });
            }
        } else if (node.kind === 215 && node.name.kind === 8) {
            getImportsWithTextRange(node.body, importedModules);
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9hdG9tLXR5cGVzY3JpcHQvZGlzdC9tYWluL2xhbmcvZml4bXl0cy9hc3RVdGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLENBQUMsWUFBWSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUM7QUFDdkMsU0FBUyxxQkFBcUIsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRTtBQUNoRCxRQUFJLEtBQUssS0FBSyxLQUFLLENBQUMsRUFBRTtBQUFFLGFBQUssR0FBRyxDQUFDLENBQUM7S0FBRTtBQUNwQyxRQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQzlCLHlCQUFxQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQy9DLFdBQU8sR0FBRyxDQUFDO0NBQ2Q7QUFDRCxPQUFPLENBQUMscUJBQXFCLEdBQUcscUJBQXFCLENBQUM7QUFDdEQsU0FBUyxrQkFBa0IsQ0FBQyxVQUFVLEVBQUU7QUFDcEMsV0FBTyxFQUFFLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0NBQ3BDO0FBQ0QsT0FBTyxDQUFDLGtCQUFrQixHQUFHLGtCQUFrQixDQUFDO0FBQ2hELFNBQVMsb0JBQW9CLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUU7QUFDL0MsUUFBSSxLQUFLLEdBQUcsU0FBUyxDQUFDO0FBQ3RCLGFBQVMsUUFBUSxDQUFDLElBQUksRUFBRTtBQUNwQixZQUFJLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxFQUFFO0FBQ25CLGdCQUFJLElBQUksQ0FBQyxJQUFJLElBQUksR0FBRyxFQUFFO0FBQ2xCLG9CQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksRUFBRTtBQUN4Qix5QkFBSyxHQUFHLElBQUksQ0FBQztpQkFDaEI7YUFDSjtBQUNE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VSxJQUFJLEVBQUU7QUFDeEMsWUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLEdBQUcsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLEdBQUcsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLEdBQUcsRUFBRTtBQUM3RCxnQkFBSSxjQUFjLEdBQUcscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDakQsZ0JBQUksY0FBYyxJQUFJLGNBQWMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxFQUFFO0FBQzdDLG9CQUFJLFVBQVUsR0FBRyxjQUFjLENBQUM7QUFDaEMsK0JBQWUsQ0FBQyxJQUFJLENBQUM7QUFDakIsd0JBQUksRUFBRSxVQUFVLENBQUMsSUFBSTtBQUNyQix5QkFBSyxFQUFFLEVBQUUsR0FBRyxFQUFFLFVBQVUsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLFVBQVUsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLEVBQUU7aUJBQzFFLENBQUMsQ0FBQzthQUNOO1NBQ0osTUFDSSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLENBQUMsRUFBRTtBQUNoRCxtQ0FBdUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLGVBQWUsQ0FBQyxDQUFDO1NBQ3ZEO0tBQ0osQ0FBQyxDQUFDO0NBQ04iLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL2F0b20tdHlwZXNjcmlwdC9kaXN0L21haW4vbGFuZy9maXhteXRzL2FzdFV0aWxzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0cy5mb3JFYWNoQ2hpbGQgPSB0cy5mb3JFYWNoQ2hpbGQ7XG5mdW5jdGlvbiBmb3JFYWNoQ2hpbGRSZWN1cnNpdmUobm9kZSwgY2JOb2RlLCBkZXB0aCkge1xuICAgIGlmIChkZXB0aCA9PT0gdm9pZCAwKSB7IGRlcHRoID0gMDsgfVxuICAgIHZhciByZXMgPSBjYk5vZGUobm9kZSwgZGVwdGgpO1xuICAgIGZvckVhY2hDaGlsZFJlY3Vyc2l2ZShub2RlLCBjYk5vZGUsIGRlcHRoICsgMSk7XG4gICAgcmV0dXJuIHJlcztcbn1cbmV4cG9ydHMuZm9yRWFjaENoaWxkUmVjdXJzaXZlID0gZm9yRWFjaENoaWxkUmVjdXJzaXZlO1xuZnVuY3Rpb24gc3ludGF4S2luZFRvU3RyaW5nKHN5bnRheEtpbmQpIHtcbiAgICByZXR1cm4gdHMuU3ludGF4S2luZFtzeW50YXhLaW5kXTtcbn1cbmV4cG9ydHMuc3ludGF4S2luZFRvU3RyaW5nID0gc3ludGF4S2luZFRvU3RyaW5nO1xuZnVuY3Rpb24gZ2V0Tm9kZUJ5S2luZEFuZE5hbWUocHJvZ3JhbSwga2luZCwgbmFtZSkge1xuICAgIHZhciBmb3VuZCA9IHVuZGVmaW5lZDtcbiAgICBmdW5jdGlvbiBmaW5kTm9kZShub2RlKSB7XG4gICAgICAgIGlmIChub2RlLmtpbmQgPT0ga2luZCkge1xuICAgICAgICAgICAgaWYgKG5vZGUua2luZCA9PSAyMTEpIHtcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5uYW1lLnRleHQgPT0gbmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBmb3VuZCA9IG5vZGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5vZGUua2luZCA9PSAyMTIpIHtcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5uYW1lLnRleHQgPT0gbmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBmb3VuZCA9IG5vZGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgIGV4cG9ydHMuZm9yRWFjaENoaWxkKG5vZGUsIGZpbmROb2RlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gcHJvZ3JhbS5nZXRTb3VyY2VGaWxlcygpOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICB2YXIgZmlsZSA9IF9hW19pXTtcbiAgICAgICAgZXhwb3J0cy5mb3JFYWNoQ2hpbGQoZmlsZSwgZmluZE5vZGUpO1xuICAgIH1cbiAgICByZXR1cm4gZm91bmQ7XG59XG5leHBvcnRzLmdldE5vZGVCeUtpbmRBbmROYW1lID0gZ2V0Tm9kZUJ5S2luZEFuZE5hbWU7XG5mdW5jdGlvbiBnZXRTb3VyY2VGaWxlSW1wb3J0cyhzcmNGaWxlKSB7XG4gICAgdmFyIG1vZHVsZXMgPSBbXTtcbiAgICBnZXRJbXBvcnRzKHNyY0ZpbGUsIG1vZHVsZXMpO1xuICAgIHJldHVybiBtb2R1bGVzO1xufVxuZXhwb3J0cy5nZXRTb3VyY2VGaWxlSW1wb3J0cyA9IGdldFNvdXJjZUZpbGVJbXBvcnRzO1xuZnVuY3Rpb24gZ2V0U291cmNlRmlsZUltcG9ydHNXaXRoVGV4dFJhbmdlKHNyY0ZpbGUpIHtcbiAgICB2YXIgbW9kdWxlcyA9IFtdO1xuICAgIGdldEltcG9ydHNXaXRoVGV4dFJhbmdlKHNyY0ZpbGUsIG1vZHVsZXMpO1xuICAgIHJldHVybiBtb2R1bGVzO1xufVxuZXhwb3J0cy5nZXRTb3VyY2VGaWxlSW1wb3J0c1dpdGhUZXh0UmFuZ2UgPSBnZXRTb3VyY2VGaWxlSW1wb3J0c1dpdGhUZXh0UmFuZ2U7XG5mdW5jdGlvbiBnZXRJbXBvcnRzKHNlYXJjaE5vZGUsIGltcG9ydGVkTW9kdWxlcykge1xuICAgIHRzLmZvckVhY2hDaGlsZChzZWFyY2hOb2RlLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICBpZiAobm9kZS5raW5kID09PSAyMTkgfHwgbm9kZS5raW5kID09PSAyMTggfHwgbm9kZS5raW5kID09PSAyMjUpIHtcbiAgICAgICAgICAgIHZhciBtb2R1bGVOYW1lRXhwciA9IGdldEV4dGVybmFsTW9kdWxlTmFtZShub2RlKTtcbiAgICAgICAgICAgIGlmIChtb2R1bGVOYW1lRXhwciAmJiBtb2R1bGVOYW1lRXhwci5raW5kID09PSA4KSB7XG4gICAgICAgICAgICAgICAgaW1wb3J0ZWRNb2R1bGVzLnB1c2gobW9kdWxlTmFtZUV4cHIudGV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobm9kZS5raW5kID09PSAyMTUgJiYgbm9kZS5uYW1lLmtpbmQgPT09IDgpIHtcbiAgICAgICAgICAgIGdldEltcG9ydHMobm9kZS5ib2R5LCBpbXBvcnRlZE1vZHVsZXMpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5mdW5jdGlvbiBnZXRFeHRlcm5hbE1vZHVsZU5hbWUobm9kZSkge1xuICAgIGlmIChub2RlLmtpbmQgPT09IDIxOSkge1xuICAgICAgICByZXR1cm4gbm9kZS5tb2R1bGVTcGVjaWZpZXI7XG4gICAgfVxuICAgIGlmIChub2RlLmtpbmQgPT09IDIxOCkge1xuICAgICAgICB2YXIgcmVmZXJlbmNlID0gbm9kZS5tb2R1bGVSZWZlcmVuY2U7XG4gICAgICAgIGlmIChyZWZlcmVuY2Uua2luZCA9PT0gMjI5KSB7XG4gICAgICAgICAgICByZXR1cm4gcmVmZXJlbmNlLmV4cHJlc3Npb247XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKG5vZGUua2luZCA9PT0gMjI1KSB7XG4gICAgICAgIHJldHVybiBub2RlLm1vZHVsZVNwZWNpZmllcjtcbiAgICB9XG59XG5mdW5jdGlvbiBnZXRJbXBvcnRzV2l0aFRleHRSYW5nZShzZWFyY2hOb2RlLCBpbXBvcnRlZE1vZHVsZXMpIHtcbiAgICB0cy5mb3JFYWNoQ2hpbGQoc2VhcmNoTm9kZSwgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgaWYgKG5vZGUua2luZCA9PT0gMjE5IHx8IG5vZGUua2luZCA9PT0gMjE4IHx8IG5vZGUua2luZCA9PT0gMjI1KSB7XG4gICAgICAgICAgICB2YXIgbW9kdWxlTmFtZUV4cHIgPSBnZXRFeHRlcm5hbE1vZHVsZU5hbWUobm9kZSk7XG4gICAgICAgICAgICBpZiAobW9kdWxlTmFtZUV4cHIgJiYgbW9kdWxlTmFtZUV4cHIua2luZCA9PT0gOCkge1xuICAgICAgICAgICAgICAgIHZhciBtb2R1bGVFeHByID0gbW9kdWxlTmFtZUV4cHI7XG4gICAgICAgICAgICAgICAgaW1wb3J0ZWRNb2R1bGVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBtb2R1bGVFeHByLnRleHQsXG4gICAgICAgICAgICAgICAgICAgIHJhbmdlOiB7IHBvczogbW9kdWxlRXhwci5nZXRTdGFydCgpICsgMSwgZW5kOiBtb2R1bGVFeHByLmdldEVuZCgpIC0gMSB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobm9kZS5raW5kID09PSAyMTUgJiYgbm9kZS5uYW1lLmtpbmQgPT09IDgpIHtcbiAgICAgICAgICAgIGdldEltcG9ydHNXaXRoVGV4dFJhbmdlKG5vZGUuYm9keSwgaW1wb3J0ZWRNb2R1bGVzKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuIl19