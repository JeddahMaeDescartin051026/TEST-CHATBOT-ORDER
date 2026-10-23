/* CJ Finds - updates the floating bag number when the cart's quantity buttons (- and +) are clicked.
   Load this AFTER bag.js on every page that has the cart:
   <script src="bag-reset.js" defer></script>
   <script src="bag.js" defer></script>
   <script src="bag-sync.js" defer></script>
*/
(function () {
  "use strict";

  var BUTTON_SELECTOR = ".quantity-controls button";    // the - and + buttons in the cart
  var QTY_SELECTOR = ".cart-line .quantity-controls span"; // the quantity number between them

  function cartTotal() {
    var total = 0;
    document.querySelectorAll(QTY_SELECTOR).forEach(function (el) {
      total += parseInt(el.textContent, 10) || 0;
    });
    return total;
  }

  // Capture phase: runs before your cart code changes the quantity,
  // so we can compare the cart's total before and after the click.
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest(BUTTON_SELECTOR);
    if (!btn || !window.CJBag) return;

    var before = cartTotal();
    setTimeout(function () {
      var change = cartTotal() - before;
      if (change !== 0) {
        window.CJBag.set(window.CJBag.get() + change);
      }
    }, 50);
  }, true);
})();
