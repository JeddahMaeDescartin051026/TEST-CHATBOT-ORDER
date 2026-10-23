/* CJ Finds - empties the WHOLE bag (badge + cart items) on refresh, new visit, first visit and checkout.

   Load this on every page ABOVE shop.js and bag.js, as a plain script (no "defer"):
   <script src="bag-reset.js"></script>
   ...
   <script src="shop.js"></script>
   <script src="bag.js" defer></script>
   <script src="bag-sync.js" defer></script>
*/
(function () {
  "use strict";

  /* ---------- Settings you can change ---------- */
  var SESSION_FLAG = "cjfinds_session_started";  // marks that this tab has already been opened
  var CART_KEY_PATTERN = /cart|bag|basket/i;     // any saved key with these words gets cleared
  var EXTRA_KEYS = [];                           // add exact key names here if your cart uses another name, e.g. ["cj_items"]
  var CLEAR_ON_CHECKOUT_CLICK = false;           // false = bag clears after the order form is sent (checkout.html does this)
  var CHECKOUT_SELECTOR = ".checkout-button";    // your checkout button
  /* --------------------------------------------- */

  function clearStore(store) {
    try {
      var keys = [];
      for (var i = 0; i < store.length; i++) keys.push(store.key(i));
      keys.forEach(function (k) {
        if (k === SESSION_FLAG) return;
        if (CART_KEY_PATTERN.test(k) || EXTRA_KEYS.indexOf(k) !== -1) store.removeItem(k);
      });
    } catch (e) {}
  }

  function clearBagData() {
    try { clearStore(window.localStorage); } catch (e) {}
    try { clearStore(window.sessionStorage); } catch (e) {}
  }

  // Call this when an order is confirmed: CJBagClearAll()
  function clearAll() {
    clearBagData();
    if (window.CJBag) window.CJBag.set(0);
    document.dispatchEvent(new CustomEvent("cjbag:cleared"));
  }
  window.CJBagClearAll = clearAll;

  // 1. Was this page load a refresh?
  var isReload = false;
  var entries = performance.getEntriesByType && performance.getEntriesByType("navigation");
  if (entries && entries.length) {
    isReload = entries[0].type === "reload";
  } else if (performance.navigation) {
    isReload = performance.navigation.type === 1;
  }

  // 2. Is this the first time this tab/session opened the site?
  var firstVisit = true;
  try {
    firstVisit = !sessionStorage.getItem(SESSION_FLAG);
    sessionStorage.setItem(SESSION_FLAG, "1");
  } catch (e) {}

  // Empty everything before shop.js and bag.js read it
  if (isReload || firstVisit) clearBagData();

  // 3. Empty the bag when the customer continues to checkout
  if (CLEAR_ON_CHECKOUT_CLICK) {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest && e.target.closest(CHECKOUT_SELECTOR);
      if (btn && !btn.disabled) clearAll();
    });
  }
})();
