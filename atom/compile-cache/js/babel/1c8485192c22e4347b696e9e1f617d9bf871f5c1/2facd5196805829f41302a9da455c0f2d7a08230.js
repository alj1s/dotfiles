'use babel';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _require = require('atom');

var CompositeDisposable = _require.CompositeDisposable;
var TextBuffer = _require.TextBuffer;

var NuclideTextBuffer = (function (_TextBuffer) {
  function NuclideTextBuffer(connection, params) {
    _classCallCheck(this, NuclideTextBuffer);

    _get(Object.getPrototypeOf(NuclideTextBuffer.prototype), 'constructor', this).call(this, params);
    this.connection = connection;
    this.setPath(params.filePath);
  }

  _inherits(NuclideTextBuffer, _TextBuffer);

  _createClass(NuclideTextBuffer, [{
    key: 'setPath',
    value: function setPath(filePath) {
      if (!this.connection) {
        // If this.connection is not set, then the superclass constructor is still executing.
        // NuclideTextBuffer's constructor will ensure setPath() is called once this.constructor
        // is set.
        return;
      }
      if (filePath === this.getPath()) {
        return;
      }
      if (filePath) {
        this.file = this.createFile(filePath);
        this.file.setEncoding(this.getEncoding());
        this.subscribeToFile();
      } else {
        this.file = null;
      }
      this.emitter.emit('did-change-path', this.getPath());
    }
  }, {
    key: 'createFile',
    value: function createFile(filePath) {
      return this.connection.createFile(filePath);
    }
  }, {
    key: 'saveAs',
    value: _asyncToGenerator(function* (filePath) {
      if (!filePath) {
        throw new Error('Can\'t save buffer with no file path');
      }

      this.emitter.emit('will-save', { path: filePath });
      this.setPath(filePath);
      try {
        yield this.file.write(this.getText());
        this.cachedDiskContents = this.getText();
        this.conflict = false;
        this.emitModifiedStatusChanged(false);
        this.emitter.emit('did-save', { path: filePath });
      } catch (e) {
        atom.notifications.addError('Failed to save remote file: ' + e.message);
      }
    })
  }, {
    key: 'updateCachedDiskContentsSync',
    value: function updateCachedDiskContentsSync() {
      throw new Error('updateCachedDiskContentsSync isn\'t supported in NuclideTextBuffer');
    }
  }, {
    key: 'subscribeToFile',
    value: function subscribeToFile() {
      var _this = this;

      if (this.fileSubscriptions) {
        this.fileSubscriptions.dispose();
      }
      this.fileSubscriptions = new CompositeDisposable();

      this.fileSubscriptions.add(this.file.onDidChange(_asyncToGenerator(function* () {
        var isModified = yield _this._isModified();
        if (isModified) {
          _this.conflict = true;
        }
        var previousContents = _this.cachedDiskContents;
        yield _this.updateCachedDiskContents();
        if (previousContents === _this.cachedDiskContents) {
          return;
        }
        if (_this.conflict) {
          _this.emitter.emit('did-conflict');
        } else {
          _this.reload();
        }
      })));

      this.fileSubscriptions.add(this.file.onDidDelete(function () {
        var modified = _this.getText() !== _this.cachedDiskContents;
        _this.wasModifiedBeforeRemove = modified;
        if (modified) {
          _this.updateCachedDiskContents();
        } else {
          _this.destroy();
        }
      }));

      this.fileSubscriptions.add(this.file.onDidRename(function () {
        _this.emitter.emit('did-change-path', _this.getPath());
      }));

      this.fileSubscriptions.add(this.file.onWillThrowWatchError(function (errorObject) {
        _this.emitter.emit('will-throw-watch-error', errorObject);
      }));
    }
  }, {
    key: '_isModified',
    value: _asyncToGenerator(function* () {
      if (!this.loaded) {
        return false;
      }
      if (this.file) {
        var exists = yield this.file.exists();
        if (exists) {
          return this.getText() !== this.cachedDiskContents;
        } else {
          return this.wasModifiedBeforeRemove != null ? this.wasModifiedBeforeRemove : !this.isEmpty();
        }
      } else {
        return !this.isEmpty();
      }
    })
  }]);

  return NuclideTextBuffer;
})(TextBuffer);

module.exports = NuclideTextBuffer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9hbmRyZXdqb25lcy8uYXRvbS9wYWNrYWdlcy9udWNsaWRlLXJlbW90ZS1wcm9qZWN0cy9saWIvTnVjbGlkZVRleHRCdWZmZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2VBVzRCLE9BQU8sQ0FBQyxNQUFNLENBQUM7O0lBQWxELG1CQUFtQixZQUFuQixtQkFBbUI7SUFBRSxVQUFVLFlBQVYsVUFBVTs7SUFFOUIsaUJBQWlCO0FBRVYsV0FGUCxpQkFBaUIsQ0FFVCxVQUE0QixFQUFFLE1BQVcsRUFBRTswQkFGbkQsaUJBQWlCOztBQUduQiwrQkFIRSxpQkFBaUIsNkNBR2IsTUFBTSxFQUFFO0FBQ2QsUUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7QUFDN0IsUUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7R0FDL0I7O1lBTkcsaUJBQWlCOztlQUFqQixpQkFBaUI7O1dBUWQsaUJBQUMsUUFBZ0IsRUFBUTtBQUM5QixVQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRTs7OztBQUlwQixlQUFPO09BQ1I7QUFDRCxVQUFJLFFBQVEsS0FBSyxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUU7QUFDL0IsZUFBTztPQUNSO0FBQ0QsVUFBSSxRQUFRLEVBQUU7QUFDWixZQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDdEMsWUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7QUFDMUMsWUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO09BQ3hCLE1BQU07QUFDTCxZQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztPQUNsQjtBQUNELFVBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxPQUFPLEVB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QyxDQUFDOztBQUVKLFVBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxVQUFDLFdBQVcsRUFBSztBQUN4RSxjQUFLLE9BQU8sQ0FBQyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsV0FBVyxDQUFDLENBQUM7T0FDNUQsQ0FBQyxDQUFDLENBQUM7S0FDTDs7OzZCQUVnQixhQUFxQjtBQUNwQyxVQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtBQUNoQixlQUFPLEtBQUssQ0FBQztPQUNkO0FBQ0QsVUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFO0FBQ2IsWUFBSSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ3RDLFlBQUksTUFBTSxFQUFFO0FBQ1YsaUJBQU8sSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztTQUNuRCxNQUFNO0FBQ0wsaUJBQU8sSUFBSSxDQUFDLHVCQUF1QixJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsdUJBQXVCLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDOUY7T0FDRixNQUFNO0FBQ0wsZUFBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztPQUN4QjtLQUNGOzs7U0E5R0csaUJBQWlCO0dBQVMsVUFBVTs7QUFpSDFDLE1BQU0sQ0FBQyxPQUFPLEdBQUcsaUJBQWlCLENBQUMiLCJmaWxlIjoiL1VzZXJzL2FuZHJld2pvbmVzLy5hdG9tL3BhY2thZ2VzL251Y2xpZGUtcmVtb3RlLXByb2plY3RzL2xpYi9OdWNsaWRlVGV4dEJ1ZmZlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbnZhciB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgVGV4dEJ1ZmZlcn0gPSByZXF1aXJlKCdhdG9tJyk7XG5cbmNsYXNzIE51Y2xpZGVUZXh0QnVmZmVyIGV4dGVuZHMgVGV4dEJ1ZmZlciB7XG5cbiAgY29uc3RydWN0b3IoY29ubmVjdGlvbjogUmVtb3RlQ29ubmVjdGlvbiwgcGFyYW1zOiBhbnkpIHtcbiAgICBzdXBlcihwYXJhbXMpO1xuICAgIHRoaXMuY29ubmVjdGlvbiA9IGNvbm5lY3Rpb247XG4gICAgdGhpcy5zZXRQYXRoKHBhcmFtcy5maWxlUGF0aCk7XG4gIH1cblxuICBzZXRQYXRoKGZpbGVQYXRoOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuY29ubmVjdGlvbikge1xuICAgICAgLy8gSWYgdGhpcy5jb25uZWN0aW9uIGlzIG5vdCBzZXQsIHRoZW4gdGhlIHN1cGVyY2xhc3MgY29uc3RydWN0b3IgaXMgc3RpbGwgZXhlY3V0aW5nLlxuICAgICAgLy8gTnVjbGlkZVRleHRCdWZmZXIncyBjb25zdHJ1Y3RvciB3aWxsIGVuc3VyZSBzZXRQYXRoKCkgaXMgY2FsbGVkIG9uY2UgdGhpcy5jb25zdHJ1Y3RvclxuICAgICAgLy8gaXMgc2V0LlxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoZmlsZVBhdGggPT09IHRoaXMuZ2V0UGF0aCgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChmaWxlUGF0aCkge1xuICAgICAgdGhpcy5maWxlID0gdGhpcy5jcmVhdGVGaWxlKGZpbGVQYXRoKTtcbiAgICAgIHRoaXMuZmlsZS5zZXRFbmNvZGluZyh0aGlzLmdldEVuY29kaW5nKCkpO1xuICAgICAgdGhpcy5zdWJzY3JpYmVUb0ZpbGUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5maWxlID0gbnVsbDtcbiAgICB9XG4gICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2RpZC1jaGFuZ2UtcGF0aCcsIHRoaXMuZ2V0UGF0aCgpKTtcbiAgfVxuXG4gIGNyZWF0ZUZpbGUoZmlsZVBhdGg6IHN0cmluZyk6IFJlbW90ZUZpbGUge1xuICAgIHJldHVybiB0aGlzLmNvbm5lY3Rpb24uY3JlYXRlRmlsZShmaWxlUGF0aCk7XG4gIH1cblxuICBhc3luYyBzYXZlQXMoZmlsZVBhdGg6IHN0cmluZykge1xuICAgIGlmICghZmlsZVBhdGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2FuXFwndCBzYXZlIGJ1ZmZlciB3aXRoIG5vIGZpbGUgcGF0aCcpO1xuICAgIH1cblxuICAgIHRoaXMuZW1pdHRlci5lbWl0KCd3aWxsLXNhdmUnLCB7cGF0aDogZmlsZVBhdGh9KTtcbiAgICB0aGlzLnNldFBhdGgoZmlsZVBhdGgpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmZpbGUud3JpdGUodGhpcy5nZXRUZXh0KCkpO1xuICAgICAgdGhpcy5jYWNoZWREaXNrQ29udGVudHMgPSB0aGlzLmdldFRleHQoKTtcbiAgICAgIHRoaXMuY29uZmxpY3QgPSBmYWxzZTtcbiAgICAgIHRoaXMuZW1pdE1vZGlmaWVkU3RhdHVzQ2hhbmdlZChmYWxzZSk7XG4gICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnZGlkLXNhdmUnLCB7cGF0aDogZmlsZVBhdGh9KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoYEZhaWxlZCB0byBzYXZlIHJlbW90ZSBmaWxlOiAke2UubWVzc2FnZX1gKTtcbiAgICB9XG4gIH1cblxuICB1cGRhdGVDYWNoZWREaXNrQ29udGVudHNTeW5jKCkge1xuICAgIHRocm93IG5ldyBFcnJvcigndXBkYXRlQ2FjaGVkRGlza0NvbnRlbnRzU3luYyBpc25cXCd0IHN1cHBvcnRlZCBpbiBOdWNsaWRlVGV4dEJ1ZmZlcicpO1xuICB9XG5cbiAgc3Vic2NyaWJlVG9GaWxlKCkge1xuICAgIGlmICh0aGlzLmZpbGVTdWJzY3JpcHRpb25zKSB7XG4gICAgICB0aGlzLmZpbGVTdWJzY3JpcHRpb25zLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgdGhpcy5maWxlU3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG5cbiAgICB0aGlzLmZpbGVTdWJzY3JpcHRpb25zLmFkZCh0aGlzLmZpbGUub25EaWRDaGFuZ2UoYXN5bmMgKCkgPT4ge1xuICAgICAgdmFyIGlzTW9kaWZpZWQgPSBhd2FpdCB0aGlzLl9pc01vZGlmaWVkKCk7XG4gICAgICBpZiAoaXNNb2RpZmllZCkge1xuICAgICAgICB0aGlzLmNvbmZsaWN0ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHZhciBwcmV2aW91c0NvbnRlbnRzID0gdGhpcy5jYWNoZWREaXNrQ29udGVudHM7XG4gICAgICBhd2FpdCB0aGlzLnVwZGF0ZUNhY2hlZERpc2tDb250ZW50cygpO1xuICAgICAgaWYgKHByZXZpb3VzQ29udGVudHMgPT09IHRoaXMuY2FjaGVkRGlza0NvbnRlbnRzKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmNvbmZsaWN0KSB7XG4gICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtY29uZmxpY3QnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucmVsb2FkKCk7XG4gICAgICB9XG4gICAgfSkpO1xuXG4gICAgdGhpcy5maWxlU3Vic2NyaXB0aW9ucy5hZGQodGhpcy5maWxlLm9uRGlkRGVsZXRlKCgpID0+IHtcbiAgICAgIHZhciBtb2RpZmllZCA9IHRoaXMuZ2V0VGV4dCgpICE9PSB0aGlzLmNhY2hlZERpc2tDb250ZW50cztcbiAgICAgIHRoaXMud2FzTW9kaWZpZWRCZWZvcmVSZW1vdmUgPSBtb2RpZmllZDtcbiAgICAgIGlmIChtb2RpZmllZCkge1xuICAgICAgICB0aGlzLnVwZGF0ZUNhY2hlZERpc2tDb250ZW50cygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5kZXN0cm95KCk7XG4gICAgICB9XG4gICAgfSkpO1xuXG4gICAgdGhpcy5maWxlU3Vic2NyaXB0aW9ucy5hZGQodGhpcy5maWxlLm9uRGlkUmVuYW1lKCgpID0+IHtcbiAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2RpZC1jaGFuZ2UtcGF0aCcsIHRoaXMuZ2V0UGF0aCgpKTtcbiAgICB9KSk7XG5cbiAgICB0aGlzLmZpbGVTdWJzY3JpcHRpb25zLmFkZCh0aGlzLmZpbGUub25XaWxsVGhyb3dXYXRjaEVycm9yKChlcnJvck9iamVjdCkgPT4ge1xuICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnd2lsbC10aHJvdy13YXRjaC1lcnJvcicsIGVycm9yT2JqZWN0KTtcbiAgICB9KSk7XG4gIH1cblxuICBhc3luYyBfaXNNb2RpZmllZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAoIXRoaXMubG9hZGVkKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICh0aGlzLmZpbGUpIHtcbiAgICAgIHZhciBleGlzdHMgPSBhd2FpdCB0aGlzLmZpbGUuZXhpc3RzKCk7XG4gICAgICBpZiAoZXhpc3RzKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFRleHQoKSAhPT0gdGhpcy5jYWNoZWREaXNrQ29udGVudHM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy53YXNNb2RpZmllZEJlZm9yZVJlbW92ZSAhPSBudWxsID8gdGhpcy53YXNNb2RpZmllZEJlZm9yZVJlbW92ZSA6ICF0aGlzLmlzRW1wdHkoKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICF0aGlzLmlzRW1wdHkoKTtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBOdWNsaWRlVGV4dEJ1ZmZlcjtcbiJdfQ==