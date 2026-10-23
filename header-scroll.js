/* CJ Finds - header behaviour on every page except checkout.
   - Scrolling DOWN hides the header and shows a tiny "Back to Home" button at the upper right.
   - Scrolling UP shows the header again (and hides the button).
   - The header stays put at the very top of the page, and while the menu or search panel is open. */
   (function () {
    "use strict";
  
    var header = document.querySelector(".site-header");
    if (!header) return;
  
    var onHome = /(^|\/)(index\.html)?$/.test(location.pathname);
    var btn = document.createElement("a");
    btn.className = "back-home";
    btn.textContent = "Back to Home";
    btn.href = onHome ? "#top" : "index.html";
    if (onHome) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
    document.body.appendChild(btn);
  
    var lastY = window.scrollY, ticking = false;
  
    function panelOpen() {
      var m = document.querySelector(".mobile-menu"), s = document.querySelector(".search-panel");
      return (m && !m.hidden) || (s && !s.hidden);
    }
    function show() { header.classList.remove("is-hidden"); btn.classList.remove("show"); }
    function hide() { header.classList.add("is-hidden"); btn.classList.add("show"); }
  
    function update() {
      ticking = false;
      var y = Math.max(0, window.scrollY);   // ignore the bounce at the top on phones
      var diff = y - lastY;
      if (y < header.offsetHeight || panelOpen()) { show(); lastY = y; return; }
      if (Math.abs(diff) < 6) return;        // ignore tiny moves
      if (diff > 0) hide(); else show();
      lastY = y;
    }
  
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
  
    header.addEventListener("focusin", show);   // keyboard users tabbing into the header
  })();
  