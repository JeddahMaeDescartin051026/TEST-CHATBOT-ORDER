/* CJ Finds - "Send Order Request" delivery effect

   CJDeliveryButton.drive(btn)          1) the button zooms until the whole screen is its colour
                                        2) the colour shrinks slowly to the centre of a white screen
                                        3) it turns into a pink truck in the middle of the screen
                                        The promise resolves once the truck has been shown.
   CJDeliveryButton.finish(btn, panel)  the truck drives from the centre off to the right while the
                                        confirmation message (copied from `panel`) slides in from the
                                        left; when the truck is gone the message sits in the centre.
   CJDeliveryButton.reset()             removes everything right away (use if sending fails). */

   (function () {
    var ZOOM_MS = 750;     // button -> full screen
    var PAUSE_MS = 120;    // brief moment fully covered
    var SHRINK_MS = 900;   // colour shrinks to the centre
    var POP_MS = 500;      // truck appears
    var HOLD_MS = 700;     // truck stays in the centre before moving on
    var LEAVE_MS = 2000;   // truck drives off to the right while the message slides in
  
    var overlay = null;
  
    var TRUCK_SVG =
      '<svg viewBox="0 0 120 70" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<g stroke="#b84a6c" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">' +
        '<rect x="3" y="8" width="70" height="42" rx="6" fill="#ffd3de"/>' +
        '<path d="M73 22h22l17 17v11H73z" fill="#e8899f"/>' +
        '<path d="M81 28h12l9 9H81z" fill="#fff4f7"/>' +
        '<rect x="3" y="48" width="109" height="6" rx="3" fill="#b84a6c"/>' +
      '</g>' +
      '<text x="38" y="36" text-anchor="middle" font-family="Playfair Display, serif" font-style="italic" font-size="20" font-weight="700" fill="#b84a6c">CJ</text>' +
      '<g>' +
        '<circle cx="26" cy="56" r="9.5" fill="#5d293e"/>' +
        '<g class="db-wheel"><circle cx="26" cy="56" r="3.6" fill="#ffd3de"/><rect x="25" y="49.5" width="2" height="5" fill="#ffd3de"/></g>' +
        '<circle cx="90" cy="56" r="9.5" fill="#5d293e"/>' +
        '<g class="db-wheel"><circle cx="90" cy="56" r="3.6" fill="#ffd3de"/><rect x="89" y="49.5" width="2" height="5" fill="#ffd3de"/></g>' +
      '</g>' +
      '</svg>';
  
    function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  
    function reduced() {
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  
    function remove() {
      if (overlay) { overlay.remove(); overlay = null; }
      document.documentElement.style.overflow = '';
    }
  
    function drive(btn) {
      remove();
      var cs = getComputedStyle(btn);
      var r = btn.getBoundingClientRect();
      var color = cs.backgroundColor;
  
      var o = overlay = document.createElement('div');
      o.className = 'db-overlay';
      o.setAttribute('aria-hidden', 'true');
      o.style.background = color;
      o.style.left = r.left + 'px';
      o.style.top = r.top + 'px';
      o.style.width = r.width + 'px';
      o.style.height = r.height + 'px';
      o.style.borderRadius = cs.borderRadius;
      o.style.color = cs.color;
      o.style.fontFamily = cs.fontFamily;
      o.style.fontSize = cs.fontSize;
      o.style.fontWeight = cs.fontWeight;
      o.style.letterSpacing = cs.letterSpacing;
      o.innerHTML =
        '<span class="db-label">' + btn.textContent.trim() + '</span>' +
        '<div class="db-truck">' + TRUCK_SVG + '</div>';
      document.body.appendChild(o);
      document.documentElement.style.overflow = 'hidden';
  
      var label = o.querySelector('.db-label');
      var truck = o.querySelector('.db-truck');
  
      if (reduced() || !o.animate) {
        o.style.cssText = 'left:0;top:0;width:100%;height:100%;background:#fff;border-radius:0;';
        truck.style.opacity = 1;
        return wait(HOLD_MS + 400);
      }
  
      // 1) the button zooms until the whole screen is covered in its colour
      var zoom = o.animate([
        { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', borderRadius: cs.borderRadius },
        { left: '0px', top: '0px', width: window.innerWidth + 'px', height: window.innerHeight + 'px', borderRadius: '0px' }
      ], { duration: ZOOM_MS, easing: 'cubic-bezier(.65,0,.25,1)', fill: 'forwards' });
      label.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ZOOM_MS * 0.45, fill: 'forwards' });
  
      return zoom.finished.then(function () {
        // lock the full-screen size, then hand the colour over to a "cover" layer
        o.style.left = '0px'; o.style.top = '0px';
        o.style.width = '100%'; o.style.height = '100%';
        o.style.borderRadius = '0px';
        var cover = document.createElement('div');
        cover.className = 'db-cover';
        cover.style.background = color;
        o.insertBefore(cover, o.firstChild);
        o.style.background = '#fff';          // everything behind the cover is white
        zoom.cancel();
  
        return wait(PAUSE_MS).then(function () {
          // 2) the colour shrinks slowly to the centre of the screen
          var w = window.innerWidth, h = window.innerHeight;
          var R = Math.ceil(Math.hypot(w / 2, h / 2)) + 4;
          var shrink = cover.animate([
            { clipPath: 'circle(' + R + 'px at 50% 50%)' },
            { clipPath: 'circle(0px at 50% 50%)' }
          ], { duration: SHRINK_MS, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
  
          // 3) the moment it reaches the centre, it turns into the truck
          var pop = truck.animate([
            { opacity: 0, transform: 'scale(.15)' },
            { opacity: 1, transform: 'scale(1.12)', offset: .7 },
            { opacity: 1, transform: 'scale(1)' }
          ], { duration: POP_MS, delay: SHRINK_MS - 100, easing: 'ease-out', fill: 'both' });
  
          return Promise.all([shrink.finished, pop.finished]).then(function () {
            cover.remove();
            return wait(HOLD_MS);
          });
        });
      }).catch(function () {});
    }
  
    function finish(btn, panel) {
      var o = overlay;
      if (!o) return Promise.resolve();
      o.removeAttribute('aria-hidden');
  
      var truck = o.querySelector('.db-truck');
      var msg = document.createElement('div');
      msg.className = 'db-message';
      var card = document.createElement('div');
      card.className = 'db-card';
      if (panel) card.innerHTML = panel.innerHTML;   // same text and "Back to the shop" button
      msg.appendChild(card);
      o.appendChild(msg);
  
      if (reduced() || !o.animate) {
        truck.style.display = 'none';
        card.style.transform = 'none';
        return Promise.resolve();
      }
  
      var w = window.innerWidth;
      var opts = { duration: LEAVE_MS, easing: 'cubic-bezier(.45,.05,.55,.95)', fill: 'forwards' };
  
      // the truck drives from the centre off the right side of the screen...
      var drive = truck.animate([
        { transform: 'translateX(0px) scale(1)' },
        { transform: 'translateX(' + (w / 2 + 130) + 'px) scale(1)' }
      ], opts);
  
      // ...while the message slides in slowly from the left to the centre
      var slide = card.animate([
        { transform: 'translateX(-100vw)' },
        { transform: 'translateX(0)' }
      ], opts);
  
      return Promise.all([drive.finished, slide.finished]).then(function () {
        card.style.transform = 'none';
        slide.cancel();
        truck.style.display = 'none';
      }).catch(function () {});
    }
  
    function reset() { remove(); return Promise.resolve(); }
  
    window.CJDeliveryButton = { drive: drive, finish: finish, reset: reset };
  })();
