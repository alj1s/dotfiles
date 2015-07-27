(function() {
  var CompositeDisposable, EventsDelegation, StickyTitle;

  CompositeDisposable = require('atom').CompositeDisposable;

  EventsDelegation = require('atom-utils').EventsDelegation;

  module.exports = StickyTitle = (function() {
    EventsDelegation.includeInto(StickyTitle);

    function StickyTitle(stickies, scrollContainer) {
      this.stickies = stickies;
      this.scrollContainer = scrollContainer;
      this.subscriptions = new CompositeDisposable;
      Array.prototype.forEach.call(this.stickies, function(sticky) {
        sticky.parentNode.style.height = sticky.offsetHeight + 'px';
        return sticky.style.width = sticky.offsetWidth + 'px';
      });
      this.subscriptions.add(this.subscribeTo(this.scrollContainer, {
        'scroll': (function(_this) {
          return function(e) {
            return _this.scroll(e);
          };
        })(this)
      }));
    }

    StickyTitle.prototype.dispose = function() {
      this.subscriptions.dispose();
      this.stickies = null;
      return this.scrollContainer = null;
    };

    StickyTitle.prototype.scroll = function(e) {
      var delta;
      delta = this.lastScrollTop ? this.lastScrollTop - this.scrollContainer.scrollTop : 0;
      Array.prototype.forEach.call(this.stickies, (function(_this) {
        return function(sticky, i) {
          var nextSticky, nextTop, parentTop, prevSticky, prevTop, scrollTop, top;
          nextSticky = _this.stickies[i + 1];
          prevSticky = _this.stickies[i - 1];
          scrollTop = _this.scrollContainer.getBoundingClientRect().top;
          parentTop = sticky.parentNode.getBoundingClientRect().top;
          top = sticky.getBoundingClientRect().top;
          if (parentTop < scrollTop) {
            if (!sticky.classList.contains('absolute')) {
              sticky.classList.add('fixed');
              sticky.style.top = scrollTop + 'px';
              if (nextSticky != null) {
                nextTop = nextSticky.parentNode.getBoundingClientRect().top;
                if (top + sticky.offsetHeight >= nextTop) {
                  sticky.classList.add('absolute');
                  return sticky.style.top = _this.scrollContainer.scrollTop + 'px';
                }
              }
            }
          } else {
            sticky.classList.remove('fixed');
            if ((prevSticky != null) && prevSticky.classList.contains('absolute')) {
              prevTop = prevSticky.getBoundingClientRect().top;
              if (delta < 0) {
                prevTop -= prevSticky.offsetHeight;
              }
              if (scrollTop <= prevTop) {
                prevSticky.classList.remove('absolute');
                return prevSticky.style.top = scrollTop + 'px';
              }
            }
          }
        };
      })(this));
      return this.lastScrollTop = this.scrollContainer.scrollTop;
    };

    return StickyTitle;

  })();

}).call(this);
