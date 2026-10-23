/* CJ Finds - makes every product photo clickable (opens product.html with the front and back view)
   and shows a tiny size icon on each photo.

   Add these two lines to index.html, women.html, men.html and accessories.html,
   right after the bag-sync.js line (just before </body>):
   <script src="products.js" defer></script>
   <script src="product-links.js" defer></script>
*/
(function () {
    "use strict";
  
    /* ---------- Settings you can change ---------- */
    var PRODUCT_PAGE = "product.html";
    var PHOTO_SELECTOR = ".product-photo, .detail-image"; // featured finds photos + Editor's Pick photo
    var SHOW_SIZE_ON_PHOTOS = true;                       // tiny size icon (S / XL / XXL / OS) on each photo
    /* --------------------------------------------- */
  
    var P = window.CJ_PRODUCTS;
    if (!P) return;
  
    var style = document.createElement("style");
    style.textContent = [
      ".pl-clickable{position:relative;cursor:pointer;transition:filter .2s}",
      ".pl-clickable:hover{filter:brightness(.96)}",
      ".pl-clickable:focus-visible{outline:2px solid var(--sage-dark,#783b50);outline-offset:3px}",
      ".pl-size{position:absolute;left:10px;bottom:10px;min-width:28px;height:28px;padding:0 8px;border-radius:999px;",
      "display:grid;place-items:center;background:rgba(255,253,250,.94);color:var(--sage-dark,#783b50);",
      "border:1px solid var(--line,rgba(120,59,80,.14));font:700 10px/1 'DM Sans',sans-serif;letter-spacing:.03em;pointer-events:none}"
    ].join("");
    document.head.appendChild(style);
  
    function parsePrice(text) {
      var digits = String(text || "").replace(/[^0-9]/g, "");
      return digits ? Number(digits) : NaN;
    }
  
    // Figure out which product a photo belongs to (by name + price)
    function productFor(photo) {
      var card = photo.closest(".product-card");
      if (card) {
        var title = card.querySelector("h3");
        var price = card.querySelector(".product-info strong");
        return P.find(title && title.textContent.trim(), parsePrice(price && price.textContent));
      }
      var detail = photo.closest(".product-detail");
      if (detail) {
        var add = detail.querySelector(".detail-add");
        return add ? P.find(add.dataset.product, Number(add.dataset.price)) : null;
      }
      return null;
    }
  
    function enhance(photo) {
      if (photo.dataset.productId) return;
      var product = productFor(photo);
      if (!product) return;
      photo.dataset.productId = product.id;
      photo.classList.add("pl-clickable");
      photo.setAttribute("role", "link");
      photo.setAttribute("tabindex", "0");
      photo.setAttribute("aria-label", "View " + product.name + " - front and back");
      photo.setAttribute("title", "View front & back");
      if (SHOW_SIZE_ON_PHOTOS) {
        var chip = document.createElement("span");
        chip.className = "pl-size";
        chip.textContent = product.size;
        chip.setAttribute("aria-hidden", "true");
        photo.appendChild(chip);
      }
    }
  
    function open(photo) {
      window.location.href = PRODUCT_PAGE + "?id=" + encodeURIComponent(photo.dataset.productId);
    }
  
    document.querySelectorAll(PHOTO_SELECTOR).forEach(enhance);
  
    document.addEventListener("click", function (e) {
      var photo = e.target.closest && e.target.closest(PHOTO_SELECTOR);
      if (photo && photo.dataset.productId) open(photo);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var photo = e.target.closest && e.target.closest(PHOTO_SELECTOR);
      if (photo && photo.dataset.productId) { e.preventDefault(); open(photo); }
    });
  
    // Pick up cards that get drawn after this script runs
    var grid = document.querySelector(".product-grid");
    if (grid && window.MutationObserver) {
      new MutationObserver(function () {
        grid.querySelectorAll(PHOTO_SELECTOR).forEach(enhance);
      }).observe(grid, { childList: true });
    }
  })();
  
