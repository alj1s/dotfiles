var fsUtil_1 = require('../utils/fsUtil');
;
var fileStatuses = {};
function getFileStatus(filePath) {
    filePath = fsUtil_1.consistentPath(filePath);
    if (!fileStatuses[filePath]) {
        fileStatuses[filePath] = { modified: false, emitDiffers: false };
    }
    return fileStatuses[filePath];
}
exports.getFileStatus = getFileStatus;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9hdG9tLXR5cGVzY3JpcHQvZGlzdC9tYWluL2F0b20vZmlsZVN0YXR1c0NhY2hlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLElBQUksUUFBUSxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQzFDLENBQUM7QUFDRCxJQUFJLFlBQVksR0FBRyxFQUFFLENBQUM7QUFDdEIsU0FBUyxhQUFhLENBQUMsUUFBUSxFQUFFO0FBQzdCLFlBQVEsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzdDLFFBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLEVBQUU7QUFDekIsb0JBQVksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxDQUFDO0tBQ3BFO0FBQ0QsV0FBTyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7Q0FDakM7QUFDRCxPQUFPLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQyIsImZpbGUiOiIvVXNlcnMvYW5kcmV3am9uZXMvLmF0b20vcGFja2FnZXMvYXRvbS10eXBlc2NyaXB0L2Rpc3QvbWFpbi9hdG9tL2ZpbGVTdGF0dXNDYWNoZS5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBmc1V0aWxfMSA9IHJlcXVpcmUoJy4uL3V0aWxzL2ZzVXRpbCcpO1xuO1xudmFyIGZpbGVTdGF0dXNlcyA9IHt9O1xuZnVuY3Rpb24gZ2V0RmlsZVN0YXR1cyhmaWxlUGF0aCkge1xuICAgIGZpbGVQYXRoID0gZnNVdGlsXzEuY29uc2lzdGVudFBhdGgoZmlsZVBhdGgpO1xuICAgIGlmICghZmlsZVN0YXR1c2VzW2ZpbGVQYXRoXSkge1xuICAgICAgICBmaWxlU3RhdHVzZXNbZmlsZVBhdGhdID0geyBtb2RpZmllZDogZmFsc2UsIGVtaXREaWZmZXJzOiBmYWxzZSB9O1xuICAgIH1cbiAgICByZXR1cm4gZmlsZVN0YXR1c2VzW2ZpbGVQYXRoXTtcbn1cbmV4cG9ydHMuZ2V0RmlsZVN0YXR1cyA9IGdldEZpbGVTdGF0dXM7XG4iXX0=