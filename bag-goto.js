/* CJ Finds - takes the customer to the bag after ADD TO BAG is clicked.
   Add this line to index.html, women.html, men.html and accessories.html,
   right after the bag-sync.js line (just before </body>):
   <script src="bag-goto.js" defer></script>
*/
(function () {
    "use strict";
  
    /* ---------- Settings you can change ---------- */
    var ADD_SELECTOR = ".add-product, .detail-add"; // ADD TO BAG buttons in Featured Finds + the Editor's Pick button
    var BAG_SELECTOR = "#cart-panel";    // the bag on the page
    var DELAY_MS = 350;                  // short pause so the shake/toast play and the item shows up first
    var HIGHLIGHT = true;                // briefly glow the bag so the new item is easy to spot
    /* --------------------------------------------- */
  
    var style = document.createElement("style");
    style.textContent =
      "@keyframes cj-bag-glow{0%{box-shadow:0 0 0 0 rgba(180,125,133,.55)}" +
      "70%{box-shadow:0 0 0 14px rgba(180,125,133,0)}100%{box-shadow:0 0 0 0 rgba(180,125,133,0)}}" +
      ".cj-bag-glow{animation:cj-bag-glow 1s ease-out 1}" +
      "@media (prefers-reduced-motion:reduce){.cj-bag-glow{animation:none}}";
    document.head.appendChild(style);
  
    // Works for cards that are added to the page later (women/men/accessories pages)
    document.addEventListener("click", function (e) {
      var btn = e.target.closest && e.target.closest(ADD_SELECTOR);
      if (!btn || btn.disabled) return;
  
      setTimeout(function () {
        var bag = document.querySelector(BAG_SELECTOR);
        if (!bag) return;
        var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        bag.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
        if (HIGHLIGHT) {
          bag.classList.remove("cj-bag-glow");
          void bag.offsetWidth; // restart the glow if clicked again
          bag.classList.add("cj-bag-glow");
        }
      }, DELAY_MS);
    });
  })();
  
