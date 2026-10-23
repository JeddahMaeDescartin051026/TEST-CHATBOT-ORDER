/* CJ Finds - every piece is one of a kind, so it can go in the bag only once.
   A second click on ADD TO BAG (or on the + button in the bag) shows a pop-up instead.

   Load this as a plain script right after bag-reset.js and BEFORE products.js, shop.js, script.js, bag.js:
   <script src="bag-reset.js"></script>
   <script src="one-stock.js"></script>
*/
(function () {
  "use strict";

  /* ---------- Settings you can change ---------- */
  var CART_KEY = "cjfinds-cart";                    // same bag shop.js, script.js and product.js use
  var ADD_SELECTOR = ".add-product, .detail-add, .buy-button"; // ADD TO BAG buttons (cards, Editor's Pick, product page)
  var BLOCK_PLUS_IN_BAG = true;                     // also block the + button in the bag (it would add a 2nd piece)
  var MESSAGE = "Item already in your bag.";
  /* --------------------------------------------- */

  var style = document.createElement("style");
  style.textContent =
    ".stock-overlay{position:fixed;inset:0;background:rgba(93,41,62,.35);display:flex;align-items:center;" +
    "justify-content:center;z-index:2147483000;padding:20px}" +
    ".stock-box{background:#fffdfa;border-radius:18px;padding:26px 22px 22px;max-width:330px;width:100%;" +
    "text-align:center;box-shadow:0 12px 32px rgba(93,41,62,.25);font-family:'DM Sans',sans-serif;" +
    "animation:stockIn .22s ease-out}" +
    ".stock-box .stock-icon{font-size:1.5rem;color:#783b50;margin-bottom:6px}" +
    ".stock-box p{margin:0 0 18px;color:#5d293e;font-size:1rem;line-height:1.45}" +
    ".stock-box button{background:#5d293e;color:#fff;border:0;border-radius:999px;padding:10px 28px;" +
    "cursor:pointer;font:inherit;font-size:.95rem}" +
    "@keyframes stockIn{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:none}}" +
    "@media (prefers-reduced-motion:reduce){.stock-box{animation:none}}";
  document.head.appendChild(style);

  var lastFocus = null;
  function showStockError() {
    if (document.querySelector(".stock-overlay")) return;
    lastFocus = document.activeElement;
    var overlay = document.createElement("div");
    overlay.className = "stock-overlay";
    overlay.setAttribute("role", "alertdialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Out of stock");
    overlay.innerHTML =
      '<div class="stock-box"><div class="stock-icon" aria-hidden="true">✦</div><p></p>' +
      '<button type="button">OK</button></div>';
    overlay.querySelector("p").textContent = MESSAGE;
    function close() {
      overlay.remove();
      document.removeEventListener("keydown", onKey, true);
      if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
    }
    function onKey(e) { if (e.key === "Escape" || e.key === "Enter") { e.preventDefault(); close(); } }
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay || e.target.tagName === "BUTTON") close();
    });
    document.addEventListener("keydown", onKey, true);
    document.body.appendChild(overlay);
    overlay.querySelector("button").focus();
  }

  function norm(s) { return String(s || "").replace(/\s+/g, " ").trim().toLowerCase(); }
  function digits(s) { var d = String(s || "").replace(/[^0-9]/g, ""); return d ? Number(d) : NaN; }

  function readCart() {
    try {
      var cart = JSON.parse(localStorage.getItem(CART_KEY));
      return Array.isArray(cart) ? cart : [];
    } catch (e) { return []; }
  }

  /* Works out which product an ADD TO BAG button belongs to */
  function identify(btn) {
    // Homepage Editor's Pick and Featured Finds: data-product / data-price
    if (btn.dataset && btn.dataset.product) {
      return { name: btn.dataset.product, price: Number(btn.dataset.price) };
    }
    // Product page: the product comes from the ?id= in the address
    var P = window.CJ_PRODUCTS;
    if (P && btn.classList.contains("buy-button")) {
      var id = new URLSearchParams(window.location.search).get("id");
      if (id && P.byId[id]) return { name: P.byId[id].name, price: P.byId[id].price };
    }
    // Product cards on the Women / Men / Accessories pages
    var card = btn.closest(".product-card");
    if (card) {
      var title = card.querySelector("h3");
      var price = card.querySelector(".product-info strong");
      if (title) return { name: title.textContent, price: digits(price && price.textContent) };
    }
    return null;
  }

  function inBag(product) {
    if (!product) return false;
    return readCart().some(function (item) {
      return norm(item.name) === norm(product.name) &&
        (isNaN(product.price) || Number(item.price) === product.price);
    });
  }

  /* Capture phase on document: runs before shop.js, script.js, product.js, bag.js and bag-sync.js,
     so a blocked click never adds anything or moves the bag badge. */
  document.addEventListener("click", function (e) {
    var target = e.target;
    if (!target || !target.closest) return;

    // 1. ADD TO BAG buttons
    var btn = target.closest(ADD_SELECTOR);
    if (btn && !btn.disabled && inBag(identify(btn))) {
      e.preventDefault();
      e.stopImmediatePropagation();
      showStockError();
      return;
    }

    // 2. The + button in the bag would add a second piece of the same product
    if (BLOCK_PLUS_IN_BAG) {
      var plus = target.closest(".quantity-controls button");
      if (plus && plus.textContent.trim() === "+") {
        e.preventDefault();
        e.stopImmediatePropagation();
        showStockError();
      }
    }
  }, true);
})();
