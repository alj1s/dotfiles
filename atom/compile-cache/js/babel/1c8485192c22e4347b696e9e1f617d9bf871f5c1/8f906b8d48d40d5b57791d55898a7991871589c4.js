var TypeAssertPropertyAccessToAny = (function () {
    function TypeAssertPropertyAccessToAny() {
        this.key = TypeAssertPropertyAccessToAny.name;
    }
    TypeAssertPropertyAccessToAny.prototype.canProvideFix = function (info) {
        var relevantError = info.positionErrors.filter(function (x) {
            return x.code == ts.Diagnostics.Property_0_does_not_exist_on_type_1.code;
        })[0];
        if (!relevantError) return;
        if (info.positionNode.kind !== 66) return;
        var match = getIdentifierName(info.positionErrorMessages[0]);
        if (!match) return;
        var identifierName = match.identifierName;
        return { display: "Assert \"any\" for property access \"" + identifierName + "\"" };
    };
    TypeAssertPropertyAccessToAny.prototype.provideFix = function (info) {
        var parent = info.positionNode.parent;
        if (parent.kind == 163) {
            var propertyAccess = parent;
            var start = propertyAccess.getStart();
            var end = propertyAccess.dotToken.getStart();
            var oldText = propertyAccess.getText().substr(0, end - start);
            var refactoring = {
                filePath: info.filePath,
                span: {
                    start: start,
                    length: end - start
                },
                newText: "(" + oldText + " as any)"
            };
            return [refactoring];
        }
        return [];
    };
    return TypeAssertPropertyAccessToAny;
})();
exports.TypeAssertPropertyAccessToAny = TypeAssertPropertyAccessToAny;
function getIdentifierName(errorText) {
    var match = /Property \'(\w+)\' does not exist on type \.*/.exec(errorText);
    if (!match) return;
    var identifierName = match[1];
    return { identifierName: identifierName };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9hdG9tLXR5cGVzY3JpcHQvZGlzdC9tYWluL2xhbmcvZml4bXl0cy9xdWlja0ZpeGVzL3R5cGVBc3NlcnRQcm9wZXJ0eUFjY2Vzc1RvQW55LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLElBQUksNkJBQTZCLEdBQUcsQ0FBQyxZQUFZO0FBQzdDLGFBQVMsNkJBQTZCLEdBQUc7QUFDckMsWUFBSSxDQUFDLEdBQUcsR0FBRyw2QkFBNkIsQ0FBQyxJQUFJLENBQUM7S0FDakQ7QUFDRCxpQ0FBNkIsQ0FBQyxTQUFTLENBQUMsYUFBYSxHQUFHLFVBQVUsSUFBSSxFQUFFO0FBQ3BFLFlBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFO0FBQUUsbUJBQU8sQ0FBQyxDQUFDLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxDQUFDLG1DQUFtQyxDQUFDLElBQUksQ0FBQztTQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM5SSxZQUFJLENBQUMsYUFBYSxFQUNkLE9BQU87QUFDWCxZQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLEVBQUUsRUFDN0IsT0FBTztBQUNYLFlBQUksS0FBSyxHQUFHLGlCQUFpQixDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzdELFlBQUksQ0FBQyxLQUFLLEVBQ04sT0FBTztBQUNYLFlBQUksY0FBYyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUM7QUFDMUMsZUFBTyxFQUFFLE9BQU8sRUFBRSx1Q0FBdUMsR0FBRyxjQUFjLEdBQUcsSUFBSSxFQUFFLENBQUM7S0FDdkYsQ0FBQztBQUNGLGlDQUE2QixDQUFDLFNBQVMsQ0FBQyxVQUFVLEdBQUcsVUFBVSxJQUFJLEVBQUU7QUFDakUsWUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUM7QUFDdEMsWUFBSSxNQUFNLENBQUMsSUFBSSxJQUFJLEdBQUcsRUFBRTtBQUNwQixnQkFBSSxjQUFjLEdBQUcsTUFBTSxDQUFDO0FBQzVCLGdCQUFJLEtBQUssR0FBRyxjQUFjLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDdEMsZ0JBQUksR0FBRyxHQUFHLGNBQWMsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDN0MsZ0JBQUksT0FBTyxHQUFHLGNBQWMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEdBQUcsR0FBRyxLQUFLLENBQUMsQ0FBQztBQUM5RCxnQkFBSSxXQUFXLEdBQUc7QUFDZCx3QkFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO0FBQ3ZCLG9CQUFJLEVBQUU7QUFDRix5QkFBSyxFQUFFLEtBQUs7QUFDWiwwQkFBTSxFQUFFLEdBQUcsR0FBRyxLQUFLO2lCQUN0QjtBQUNELHVCQUFPLEVBQUUsR0FBRyxHQUFHLE9BQU8sR0FBRyxVQUFVO2FBQ3RDLENBQUM7QUFDRixtQkFBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1NBQ3hCO0FBQ0QsZUFBTyxFQUFFLENBQUM7S0FDYixDQUFDO0FBQ0YsV0FBTyw2QkFBNkIsQ0FBQztDQUN4QyxDQUFBLEVBQUcsQ0FBQztBQUNMLE9BQU8sQ0FBQyw2QkFBNkIsR0FBRyw2QkFBNkIsQ0FBQztBQUN0RSxTQUFTLGlCQUFpQixDQUFDLFNBQVMsRUFBRTtBQUNsQyxRQUFJLEtBQUssR0FBRywrQ0FBK0MsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDNUUsUUFBSSxDQUFDLEtBQUssRUFDTixPQUFPO0FBQ1gsUUFBSSxjQUFjLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzlCLFdBQU8sRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFFLENBQUM7Q0FDN0MiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL2F0b20tdHlwZXNjcmlwdC9kaXN0L21haW4vbGFuZy9maXhteXRzL3F1aWNrRml4ZXMvdHlwZUFzc2VydFByb3BlcnR5QWNjZXNzVG9BbnkuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgVHlwZUFzc2VydFByb3BlcnR5QWNjZXNzVG9BbnkgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFR5cGVBc3NlcnRQcm9wZXJ0eUFjY2Vzc1RvQW55KCkge1xuICAgICAgICB0aGlzLmtleSA9IFR5cGVBc3NlcnRQcm9wZXJ0eUFjY2Vzc1RvQW55Lm5hbWU7XG4gICAgfVxuICAgIFR5cGVBc3NlcnRQcm9wZXJ0eUFjY2Vzc1RvQW55LnByb3RvdHlwZS5jYW5Qcm92aWRlRml4ID0gZnVuY3Rpb24gKGluZm8pIHtcbiAgICAgICAgdmFyIHJlbGV2YW50RXJyb3IgPSBpbmZvLnBvc2l0aW9uRXJyb3JzLmZpbHRlcihmdW5jdGlvbiAoeCkgeyByZXR1cm4geC5jb2RlID09IHRzLkRpYWdub3N0aWNzLlByb3BlcnR5XzBfZG9lc19ub3RfZXhpc3Rfb25fdHlwZV8xLmNvZGU7IH0pWzBdO1xuICAgICAgICBpZiAoIXJlbGV2YW50RXJyb3IpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlmIChpbmZvLnBvc2l0aW9uTm9kZS5raW5kICE9PSA2NilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdmFyIG1hdGNoID0gZ2V0SWRlbnRpZmllck5hbWUoaW5mby5wb3NpdGlvbkVycm9yTWVzc2FnZXNbMF0pO1xuICAgICAgICBpZiAoIW1hdGNoKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB2YXIgaWRlbnRpZmllck5hbWUgPSBtYXRjaC5pZGVudGlmaWVyTmFtZTtcbiAgICAgICAgcmV0dXJuIHsgZGlzcGxheTogXCJBc3NlcnQgXFxcImFueVxcXCIgZm9yIHByb3BlcnR5IGFjY2VzcyBcXFwiXCIgKyBpZGVudGlmaWVyTmFtZSArIFwiXFxcIlwiIH07XG4gICAgfTtcbiAgICBUeXBlQXNzZXJ0UHJvcGVydHlBY2Nlc3NUb0FueS5wcm90b3R5cGUucHJvdmlkZUZpeCA9IGZ1bmN0aW9uIChpbmZvKSB7XG4gICAgICAgIHZhciBwYXJlbnQgPSBpbmZvLnBvc2l0aW9uTm9kZS5wYXJlbnQ7XG4gICAgICAgIGlmIChwYXJlbnQua2luZCA9PSAxNjMpIHtcbiAgICAgICAgICAgIHZhciBwcm9wZXJ0eUFjY2VzcyA9IHBhcmVudDtcbiAgICAgICAgICAgIHZhciBzdGFydCA9IHByb3BlcnR5QWNjZXNzLmdldFN0YXJ0KCk7XG4gICAgICAgICAgICB2YXIgZW5kID0gcHJvcGVydHlBY2Nlc3MuZG90VG9rZW4uZ2V0U3RhcnQoKTtcbiAgICAgICAgICAgIHZhciBvbGRUZXh0ID0gcHJvcGVydHlBY2Nlc3MuZ2V0VGV4dCgpLnN1YnN0cigwLCBlbmQgLSBzdGFydCk7XG4gICAgICAgICAgICB2YXIgcmVmYWN0b3JpbmcgPSB7XG4gICAgICAgICAgICAgICAgZmlsZVBhdGg6IGluZm8uZmlsZVBhdGgsXG4gICAgICAgICAgICAgICAgc3Bhbjoge1xuICAgICAgICAgICAgICAgICAgICBzdGFydDogc3RhcnQsXG4gICAgICAgICAgICAgICAgICAgIGxlbmd0aDogZW5kIC0gc3RhcnQsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBuZXdUZXh0OiBcIihcIiArIG9sZFRleHQgKyBcIiBhcyBhbnkpXCJcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gW3JlZmFjdG9yaW5nXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gW107XG4gICAgfTtcbiAgICByZXR1cm4gVHlwZUFzc2VydFByb3BlcnR5QWNjZXNzVG9Bbnk7XG59KSgpO1xuZXhwb3J0cy5UeXBlQXNzZXJ0UHJvcGVydHlBY2Nlc3NUb0FueSA9IFR5cGVBc3NlcnRQcm9wZXJ0eUFjY2Vzc1RvQW55O1xuZnVuY3Rpb24gZ2V0SWRlbnRpZmllck5hbWUoZXJyb3JUZXh0KSB7XG4gICAgdmFyIG1hdGNoID0gL1Byb3BlcnR5IFxcJyhcXHcrKVxcJyBkb2VzIG5vdCBleGlzdCBvbiB0eXBlIFxcLiovLmV4ZWMoZXJyb3JUZXh0KTtcbiAgICBpZiAoIW1hdGNoKVxuICAgICAgICByZXR1cm47XG4gICAgdmFyIGlkZW50aWZpZXJOYW1lID0gbWF0Y2hbMV07XG4gICAgcmV0dXJuIHsgaWRlbnRpZmllck5hbWU6IGlkZW50aWZpZXJOYW1lIH07XG59XG4iXX0=