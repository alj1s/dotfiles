function isBinaryAddition(node) {
    return node.kind == 178 && node.operatorToken.kind == 34;
}
function isStringExpression(node, typeChecker) {
    var type = typeChecker.getTypeAtLocation(node);
    var flags = type.getFlags();
    return !!(flags & 2);
}
function isAPartOfAChainOfStringAdditions(node, typeChecker) {
    var largestSumNode = undefined;
    while (true) {
        if (isBinaryAddition(node) && isStringExpression(node, typeChecker)) {
            largestSumNode = node;
        }
        if (node.kind == 245) {
            return largestSumNode;
        }
        node = node.parent;
    }
}
var StringConcatToTemplate = (function () {
    function StringConcatToTemplate() {
        this.key = StringConcatToTemplate.name;
    }
    StringConcatToTemplate.prototype.canProvideFix = function (info) {
        // Algo
        // Can provide a quick fix if we are part of an expression that
        // is a part of a binary + expression
        // and when these binary +es end we come to an expression which is of type `string`
        var strRoot = isAPartOfAChainOfStringAdditions(info.positionNode, info.typeChecker);
        if (strRoot) {
            return { display: 'String concatenations to a template string' };
        }
    };
    StringConcatToTemplate.prototype.provideFix = function (info) {
        var strRoot = isAPartOfAChainOfStringAdditions(info.positionNode, info.typeChecker);
        var finalOutput = [];
        var current = strRoot;
        var backTickCharacter = '`';
        var backTick = new RegExp(backTickCharacter, 'g');
        var $regex = /\$/g;
        while (true) {
            var appendToFinal = function appendToFinal(node) {
                if (node.kind == 8) {
                    var text = node.getText();
                    var quoteCharacter = text.trim()[0];
                    var quoteRegex = new RegExp(quoteCharacter, 'g');
                    var escapedQuoteRegex = new RegExp('\\\\' + quoteCharacter, 'g');
                    var newText_1 = text.replace(backTick, '\\' + backTickCharacter).replace(escapedQuoteRegex, quoteCharacter).replace($regex, '\\$');
                    newText_1 = newText_1.substr(1, newText_1.length - 2);
                    finalOutput.unshift(newText_1);
                } else if (node.kind == 180 || node.kind == 10) {
                    var text = node.getText();
                    text = text.trim();
                    text = text.substr(1, text.length - 2);
                    finalOutput.unshift(text);
                } else {
                    finalOutput.unshift('${' + node.getText() + '}');
                }
            };

            if (current.kind == 178) {
                var binary = current;
                appendToFinal(binary.right);
                current = binary.left;
            } else {
                appendToFinal(current);
                break;
            }
        }
        var newText = backTickCharacter + finalOutput.join('') + backTickCharacter;
        var refactoring = {
            span: {
                start: strRoot.getStart(),
                length: strRoot.end - strRoot.getStart()
            },
            newText: newText,
            filePath: info.filePath
        };
        return [refactoring];
    };
    return StringConcatToTemplate;
})();
exports.StringConcatToTemplate = StringConcatToTemplate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9hdG9tLXR5cGVzY3JpcHQvZGlzdC9tYWluL2xhbmcvZml4bXl0cy9xdWlja0ZpeGVzL3N0cmluZ0NvbmNhdFRvVGVtcGxhdGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUU7QUFDNUIsV0FBUSxJQUFJLENBQUMsSUFBSSxJQUFJLEdBQUcsSUFDcEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFFO0NBQ3RDO0FBQ0QsU0FBUyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFO0FBQzNDLFFBQUksSUFBSSxHQUFHLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMvQyxRQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDNUIsV0FBTyxDQUFDLEVBQUUsS0FBSyxHQUFHLENBQUMsQ0FBQSxBQUFDLENBQUM7Q0FDeEI7QUFDRCxTQUFTLGdDQUFnQyxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUU7QUFDekQsUUFBSSxjQUFjLEdBQUcsU0FBUyxDQUFDO0FBQy9CLFdBQU8sSUFBSSxFQUFFO0FBQ1QsWUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxrQkFBa0IsQ0FBQyxJQUFJLEVBQUUsV0FBVyxDQUFDLEVBQUU7QUFDakUsMEJBQWMsR0FBRyxJQUFJLENBQUM7U0FDekI7QUFDRCxZQUFJLElBQUksQ0FBQyxJQUFJLElBQUksR0FBRyxFQUFFO0FBQ2xCLG1CQUFPLGNBQWMsQ0FBQztTQUN6QjtBQUNELFlBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO0tBQ3RCO0NBQ0o7QUFDRCxJQUFJLHNCQUFzQixHQUFHLENBQUMsWUFBWTtBQUN0QyxhQUFTLHNCQUFzQixHQUFHO0FBQzlCLFlBQUksQ0FBQyxHQUFHLEdBQUcsc0JBQXNCLENBQUMsSUFBSSxDQUFD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LEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxpQkFBaUIsQ0FBQztBQUMzRSxZQUFJLFdBQVcsR0FBRztBQUNkLGdCQUFJLEVBQUU7QUFDRixxQkFBSyxFQUFFLE9BQU8sQ0FBQyxRQUFRLEVBQUU7QUFDekIsc0JBQU0sRUFBRSxPQUFPLENBQUMsR0FBRyxHQUFHLE9BQU8sQ0FBQyxRQUFRLEVBQUU7YUFDM0M7QUFDRCxtQkFBTyxFQUFFLE9BQU87QUFDaEIsb0JBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtTQUMxQixDQUFDO0FBQ0YsZUFBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0tBQ3hCLENBQUM7QUFDRixXQUFPLHNCQUFzQixDQUFDO0NBQ2pDLENBQUEsRUFBRyxDQUFDO0FBQ0wsT0FBTyxDQUFDLHNCQUFzQixHQUFHLHNCQUFzQixDQUFDIiwiZmlsZSI6Ii9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9hdG9tLXR5cGVzY3JpcHQvZGlzdC9tYWluL2xhbmcvZml4bXl0cy9xdWlja0ZpeGVzL3N0cmluZ0NvbmNhdFRvVGVtcGxhdGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBpc0JpbmFyeUFkZGl0aW9uKG5vZGUpIHtcbiAgICByZXR1cm4gKG5vZGUua2luZCA9PSAxNzggJiZcbiAgICAgICAgbm9kZS5vcGVyYXRvclRva2VuLmtpbmQgPT0gMzQpO1xufVxuZnVuY3Rpb24gaXNTdHJpbmdFeHByZXNzaW9uKG5vZGUsIHR5cGVDaGVja2VyKSB7XG4gICAgdmFyIHR5cGUgPSB0eXBlQ2hlY2tlci5nZXRUeXBlQXRMb2NhdGlvbihub2RlKTtcbiAgICB2YXIgZmxhZ3MgPSB0eXBlLmdldEZsYWdzKCk7XG4gICAgcmV0dXJuICEhKGZsYWdzICYgMik7XG59XG5mdW5jdGlvbiBpc0FQYXJ0T2ZBQ2hhaW5PZlN0cmluZ0FkZGl0aW9ucyhub2RlLCB0eXBlQ2hlY2tlcikge1xuICAgIHZhciBsYXJnZXN0U3VtTm9kZSA9IHVuZGVmaW5lZDtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICBpZiAoaXNCaW5hcnlBZGRpdGlvbihub2RlKSAmJiBpc1N0cmluZ0V4cHJlc3Npb24obm9kZSwgdHlwZUNoZWNrZXIpKSB7XG4gICAgICAgICAgICBsYXJnZXN0U3VtTm9kZSA9IG5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUua2luZCA9PSAyNDUpIHtcbiAgICAgICAgICAgIHJldHVybiBsYXJnZXN0U3VtTm9kZTtcbiAgICAgICAgfVxuICAgICAgICBub2RlID0gbm9kZS5wYXJlbnQ7XG4gICAgfVxufVxudmFyIFN0cmluZ0NvbmNhdFRvVGVtcGxhdGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFN0cmluZ0NvbmNhdFRvVGVtcGxhdGUoKSB7XG4gICAgICAgIHRoaXMua2V5ID0gU3RyaW5nQ29uY2F0VG9UZW1wbGF0ZS5uYW1lO1xuICAgIH1cbiAgICBTdHJpbmdDb25jYXRUb1RlbXBsYXRlLnByb3RvdHlwZS5jYW5Qcm92aWRlRml4ID0gZnVuY3Rpb24gKGluZm8pIHtcbiAgICAgICAgLy8gQWxnb1xuICAgICAgICAvLyBDYW4gcHJvdmlkZSBhIHF1aWNrIGZpeCBpZiB3ZSBhcmUgcGFydCBvZiBhbiBleHByZXNzaW9uIHRoYXRcbiAgICAgICAgLy8gaXMgYSBwYXJ0IG9mIGEgYmluYXJ5ICsgZXhwcmVzc2lvblxuICAgICAgICAvLyBhbmQgd2hlbiB0aGVzZSBiaW5hcnkgK2VzIGVuZCB3ZSBjb21lIHRvIGFuIGV4cHJlc3Npb24gd2hpY2ggaXMgb2YgdHlwZSBgc3RyaW5nYFxuICAgICAgICB2YXIgc3RyUm9vdCA9IGlzQVBhcnRPZkFDaGFpbk9mU3RyaW5nQWRkaXRpb25zKGluZm8ucG9zaXRpb25Ob2RlLCBpbmZvLnR5cGVDaGVja2VyKTtcbiAgICAgICAgaWYgKHN0clJvb3QpIHtcbiAgICAgICAgICAgIHJldHVybiB7IGRpc3BsYXk6ICdTdHJpbmcgY29uY2F0ZW5hdGlvbnMgdG8gYSB0ZW1wbGF0ZSBzdHJpbmcnIH07XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFN0cmluZ0NvbmNhdFRvVGVtcGxhdGUucHJvdG90eXBlLnByb3ZpZGVGaXggPSBmdW5jdGlvbiAoaW5mbykge1xuICAgICAgICB2YXIgc3RyUm9vdCA9IGlzQVBhcnRPZkFDaGFpbk9mU3RyaW5nQWRkaXRpb25zKGluZm8ucG9zaXRpb25Ob2RlLCBpbmZvLnR5cGVDaGVja2VyKTtcbiAgICAgICAgdmFyIGZpbmFsT3V0cHV0ID0gW107XG4gICAgICAgIHZhciBjdXJyZW50ID0gc3RyUm9vdDtcbiAgICAgICAgdmFyIGJhY2tUaWNrQ2hhcmFjdGVyID0gJ2AnO1xuICAgICAgICB2YXIgYmFja1RpY2sgPSBuZXcgUmVnRXhwKGJhY2tUaWNrQ2hhcmFjdGVyLCAnZycpO1xuICAgICAgICB2YXIgJHJlZ2V4ID0gL1xcJC9nO1xuICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgZnVuY3Rpb24gYXBwZW5kVG9GaW5hbChub2RlKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUua2luZCA9PSA4KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0ZXh0ID0gbm9kZS5nZXRUZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBxdW90ZUNoYXJhY3RlciA9IHRleHQudHJpbSgpWzBdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcXVvdGVSZWdleCA9IG5ldyBSZWdFeHAocXVvdGVDaGFyYWN0ZXIsICdnJyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBlc2NhcGVkUXVvdGVSZWdleCA9IG5ldyBSZWdFeHAoXCJcXFxcXFxcXFwiICsgcXVvdGVDaGFyYWN0ZXIsICdnJyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdUZXh0XzEgPSB0ZXh0XG4gICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZShiYWNrVGljaywgXCJcXFxcXCIgKyBiYWNrVGlja0NoYXJhY3RlcilcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKGVzY2FwZWRRdW90ZVJlZ2V4LCBxdW90ZUNoYXJhY3RlcilcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKCRyZWdleCwgJ1xcXFwkJyk7XG4gICAgICAgICAgICAgICAgICAgIG5ld1RleHRfMSA9IG5ld1RleHRfMS5zdWJzdHIoMSwgbmV3VGV4dF8xLmxlbmd0aCAtIDIpO1xuICAgICAgICAgICAgICAgICAgICBmaW5hbE91dHB1dC51bnNoaWZ0KG5ld1RleHRfMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG5vZGUua2luZCA9PSAxODAgfHwgbm9kZS5raW5kID09IDEwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0ZXh0ID0gbm9kZS5nZXRUZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgIHRleHQgPSB0ZXh0LnRyaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgdGV4dCA9IHRleHQuc3Vic3RyKDEsIHRleHQubGVuZ3RoIC0gMik7XG4gICAgICAgICAgICAgICAgICAgIGZpbmFsT3V0cHV0LnVuc2hpZnQodGV4dCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmaW5hbE91dHB1dC51bnNoaWZ0KCckeycgKyBub2RlLmdldFRleHQoKSArICd9Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGN1cnJlbnQua2luZCA9PSAxNzgpIHtcbiAgICAgICAgICAgICAgICB2YXIgYmluYXJ5ID0gY3VycmVudDtcbiAgICAgICAgICAgICAgICBhcHBlbmRUb0ZpbmFsKGJpbmFyeS5yaWdodCk7XG4gICAgICAgICAgICAgICAgY3VycmVudCA9IGJpbmFyeS5sZWZ0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgYXBwZW5kVG9GaW5hbChjdXJyZW50KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgbmV3VGV4dCA9IGJhY2tUaWNrQ2hhcmFjdGVyICsgZmluYWxPdXRwdXQuam9pbignJykgKyBiYWNrVGlja0NoYXJhY3RlcjtcbiAgICAgICAgdmFyIHJlZmFjdG9yaW5nID0ge1xuICAgICAgICAgICAgc3Bhbjoge1xuICAgICAgICAgICAgICAgIHN0YXJ0OiBzdHJSb290LmdldFN0YXJ0KCksXG4gICAgICAgICAgICAgICAgbGVuZ3RoOiBzdHJSb290LmVuZCAtIHN0clJvb3QuZ2V0U3RhcnQoKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG5ld1RleHQ6IG5ld1RleHQsXG4gICAgICAgICAgICBmaWxlUGF0aDogaW5mby5maWxlUGF0aFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gW3JlZmFjdG9yaW5nXTtcbiAgICB9O1xuICAgIHJldHVybiBTdHJpbmdDb25jYXRUb1RlbXBsYXRlO1xufSkoKTtcbmV4cG9ydHMuU3RyaW5nQ29uY2F0VG9UZW1wbGF0ZSA9IFN0cmluZ0NvbmNhdFRvVGVtcGxhdGU7XG4iXX0=