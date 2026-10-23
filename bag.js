/* CJ Finds - floating bag button
   Add this to every page, just before </body>:
   <script src="bag.js" defer></script>
*/
(function () {
  "use strict";

  /* ---------- Settings you can change ---------- */
  var CART_URL = "cart.html";                    // page the bag opens
  var STORAGE_KEY = "cjfinds_bag_count";         // where the count is remembered
  var ADD_SELECTOR = ".add-product, .detail-add"; // your ADD TO BAG buttons
  var SCROLL_TO_PANEL_IF_PRESENT = true;         // pages with a .cart-panel scroll to it instead of leaving
  /* --------------------------------------------- */

  var css = [
    ".cj-bag{position:fixed;left:max(18px,env(safe-area-inset-left,0px));bottom:max(18px,env(safe-area-inset-bottom,0px));z-index:40;",
    "width:58px;height:58px;border-radius:50%;display:grid;place-items:center;text-decoration:none;cursor:pointer;",
    "background:var(--sage-dark,#783b50);color:var(--warm-white,#fffdfa);",
    "box-shadow:0 10px 26px rgba(120,59,80,.32);transition:transform .2s,background .2s;-webkit-tap-highlight-color:transparent}",
    ".cj-bag:hover{background:#5d293e;transform:translateY(-2px)}",
    ".cj-bag:focus-visible{outline:2px solid var(--sage-dark,#783b50);outline-offset:4px}",
    ".cj-bag svg{width:26px;height:26px;display:block}",
    ".cj-bag-count{position:absolute;top:-5px;right:-5px;min-width:22px;height:22px;padding:0 6px;border-radius:999px;",
    "display:grid;place-items:center;font:700 11px/1 'DM Sans',sans-serif;",
    "background:var(--warm-white,#fffdfa);color:var(--sage-dark,#783b50);border:2px solid var(--sage,#b47d85);",
    "transform:scale(0);transition:transform .2s}",
    ".cj-bag.has-items .cj-bag-count{transform:scale(1)}",
    ".cj-bag.shake{animation:cj-shake .6s ease}",
    ".cj-bag.shake .cj-bag-count{animation:cj-pop .35s ease}",
    "@keyframes cj-shake{0%,100%{transform:rotate(0)}15%{transform:rotate(-14deg)}30%{transform:rotate(12deg)}",
    "45%{transform:rotate(-9deg)}60%{transform:rotate(6deg)}75%{transform:rotate(-3deg)}}",
    "@keyframes cj-pop{0%{transform:scale(1)}50%{transform:scale(1.35)}100%{transform:scale(1)}}",
    "@media (prefers-reduced-motion:reduce){.cj-bag.shake,.cj-bag.shake .cj-bag-count{animation:none}}",
    "@media (max-width:600px){.cj-bag{width:52px;height:52px;left:max(14px,env(safe-area-inset-left,0px));bottom:max(14px,env(safe-area-inset-bottom,0px))}}"
  ].join("");

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var bag = document.createElement("a");
  bag.className = "cj-bag";
  bag.href = CART_URL;
  bag.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M6 8h12l1 12H5L6 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>' +
    '<span class="cj-bag-count" aria-hidden="true">0</span>';
  document.body.appendChild(bag);

  var badge = bag.querySelector(".cj-bag-count");

  function getCount() {
    try { return parseInt(localStorage.getItem(STORAGE_KEY), 10) || 0; } catch (e) { return 0; }
  }

  function render(n) {
    badge.textContent = n > 99 ? "99+" : String(n);
    bag.classList.toggle("has-items", n > 0);
    bag.setAttribute("aria-label", "Open bag, " + n + (n === 1 ? " item" : " items"));
  }

  function setCount(n) {
    n = Math.max(0, parseInt(n, 10) || 0);
    try { localStorage.setItem(STORAGE_KEY, n); } catch (e) {}
    render(n);
  }

  function shake() {
    bag.classList.remove("shake");
    void bag.offsetWidth; // restart the animation if clicked repeatedly
    bag.classList.add("shake");
  }

  function addOne() {
    setCount(getCount() + 1);
    shake();
  }

  // Works for buttons that are added to the page later, too
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest(ADD_SELECTOR);
    if (btn && !btn.disabled) addOne();
  });

  // Open the cart
  bag.addEventListener("click", function (e) {
    var panel = document.querySelector(".cart-panel");
    if (SCROLL_TO_PANEL_IF_PRESENT && panel) {
      e.preventDefault();
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  // Keep the number in sync across open tabs/pages
  window.addEventListener("storage", function (e) {
    if (e.key === STORAGE_KEY) render(getCount());
  });

  // Lets other scripts (like shop.js) control the number: CJBag.set(3), CJBag.add()
  window.CJBag = { get: getCount, set: setCount, add: addOne };

  render(getCount());
})();
