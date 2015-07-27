(function() {
  var GitRepository, Minimatch, PathLoader, PathsChunkSize, async, fs, path,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  async = require('async');

  fs = require('fs');

  path = require('path');

  GitRepository = require('atom').GitRepository;

  Minimatch = require('minimatch').Minimatch;

  PathsChunkSize = 100;

  PathLoader = (function() {
    function PathLoader(rootPath, config) {
      var ignoreVcsIgnores, repo;
      this.rootPath = rootPath;
      this.timestamp = config.timestamp, this.sourceNames = config.sourceNames, ignoreVcsIgnores = config.ignoreVcsIgnores, this.traverseSymlinkDirectories = config.traverseSymlinkDirectories, this.ignoredNames = config.ignoredNames, this.knownPaths = config.knownPaths;
      if (this.knownPaths == null) {
        this.knownPaths = [];
      }
      this.paths = [];
      this.lostPaths = [];
      this.scannedPaths = [];
      this.repo = null;
      if (ignoreVcsIgnores) {
        repo = GitRepository.open(this.rootPath, {
          refreshOnWindowFocus: false
        });
        if ((repo != null ? repo.getWorkingDirectory() : void 0) === this.rootPath) {
          this.repo = repo;
        }
      }
    }

    PathLoader.prototype.load = function(done) {
      return this.loadPath(this.rootPath, (function(_this) {
        return function() {
          var p, _i, _len, _ref, _ref1;
          _ref = _this.knownPaths;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            p = _ref[_i];
            if (__indexOf.call(_this.scannedPaths, p) < 0) {
              _this.lostPaths.push(p);
            }
          }
          _this.flushPaths();
          if ((_ref1 = _this.repo) != null) {
            _ref1.destroy();
          }
          return done();
        };
      })(this));
    };

    PathLoader.prototype.isSource = function(loadedPath) {
      var relativePath, sourceName, _i, _len, _ref;
      relativePath = path.relative(this.rootPath, loadedPath);
      _ref = this.sourceNames;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        sourceName = _ref[_i];
        if (sourceName.match(relativePath)) {
          return true;
        }
      }
    };

    PathLoader.prototype.isIgnored = function(loadedPath, stats) {
      var ignoredName, relativePath, _i, _len, _ref, _ref1;
      relativePath = path.relative(this.rootPath, loadedPath);
      if ((_ref = this.repo) != null ? _ref.isPathIgnored(relativePath) : void 0) {
        return true;
      } else {
        _ref1 = this.ignoredNames;
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          ignoredName = _ref1[_i];
          if (ignoredName.match(relativePath)) {
            return true;
          }
        }
        return false;
      }
    };

    PathLoader.prototype.isKnown = function(loadedPath) {
      return __indexOf.call(this.knownPaths, loadedPath) >= 0;
    };

    PathLoader.prototype.hasChanged = function(loadedPath, stats) {
      if (stats && (this.timestamp != null)) {
        return stats.ctime >= this.timestamp;
      } else {
        return false;
      }
    };

    PathLoader.prototype.pathLoaded = function(loadedPath, stats, done) {
      this.scannedPaths.push(loadedPath);
      if (this.isSource(loadedPath) && !this.isIgnored(loadedPath, stats)) {
        if (this.isKnown(loadedPath)) {
          if (this.hasChanged(loadedPath, stats)) {
            this.paths.push(loadedPath);
          }
        } else {
          this.paths.push(loadedPath);
        }
      } else {
        if (__indexOf.call(this.knownPaths, loadedPath) >= 0) {
          this.lostPaths.push(loadedPath);
        }
      }
      if (this.paths.length + this.lostPaths.length === PathsChunkSize) {
        this.flushPaths();
      }
      return done();
    };

    PathLoader.prototype.flushPaths = function() {
      if (this.paths.length) {
        emit('load-paths:paths-found', this.paths);
      }
      if (this.lostPaths.length) {
        emit('load-paths:paths-lost', this.lostPaths);
      }
      this.paths = [];
      return this.lostPaths = [];
    };

    PathLoader.prototype.loadPath = function(pathToLoad, done) {
      if (this.isIgnored(pathToLoad)) {
        return done();
      }
      return fs.lstat(pathToLoad, (function(_this) {
        return function(error, stats) {
          if (error != null) {
            return done();
          }
          if (stats.isSymbolicLink()) {
            return fs.stat(pathToLoad, function(error, stats) {
              if (error != null) {
                return done();
              }
              if (stats.isFile()) {
                return _this.pathLoaded(pathToLoad, stats, done);
              } else if (stats.isDirectory()) {
                if (_this.traverseSymlinkDirectories) {
                  return _this.loadFolder(pathToLoad, done);
                } else {
                  return done();
                }
              }
            });
          } else if (stats.isDirectory()) {
            return _this.loadFolder(pathToLoad, done);
          } else if (stats.isFile()) {
            return _this.pathLoaded(pathToLoad, stats, done);
          } else {
            return done();
          }
        };
      })(this));
    };

    PathLoader.prototype.loadFolder = function(folderPath, done) {
      return fs.readdir(folderPath, (function(_this) {
        return function(error, children) {
          if (children == null) {
            children = [];
          }
          return async.each(children, function(childName, next) {
            return _this.loadPath(path.join(folderPath, childName), next);
          }, done);
        };
      })(this));
    };

    return PathLoader;

  })();

  module.exports = function(config) {
    var error, ignore, newConf, source, _i, _j, _len, _len1, _ref, _ref1;
    newConf = {
      ignoreVcsIgnores: config.ignoreVcsIgnores,
      traverseSymlinkDirectories: config.traverseSymlinkDirectories,
      knownPaths: config.knownPaths,
      ignoredNames: [],
      sourceNames: []
    };
    if (config.timestamp != null) {
      newConf.timestamp = new Date(Date.parse(config.timestamp));
    }
    _ref = config.sourceNames;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      source = _ref[_i];
      if (source) {
        try {
          newConf.sourceNames.push(new Minimatch(source, {
            matchBase: true,
            dot: true
          }));
        } catch (_error) {
          error = _error;
          console.warn("Error parsing source pattern (" + source + "): " + error.message);
        }
      }
    }
    _ref1 = config.ignoredNames;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      ignore = _ref1[_j];
      if (ignore) {
        try {
          newConf.ignoredNames.push(new Minimatch(ignore, {
            matchBase: true,
            dot: true
          }));
        } catch (_error) {
          error = _error;
          console.warn("Error parsing ignore pattern (" + ignore + "): " + error.message);
        }
      }
    }
    return async.each(config.paths, function(rootPath, next) {
      return new PathLoader(rootPath, newConf).load(next);
    }, this.async());
  };

}).call(this);
