/* CJ Finds - favorites (the heart).
   - Every heart button on the site (data-fav-id) saves/removes a piece. Favorites are kept on the
     customer's device, so they are still there after a refresh or the next visit (the bag is not).
   - The heart icon in the header opens favorites.html, where customers add saved pieces to the bag.
   - A product marked  sold: true  in products.js shows a SOLD tag and cannot be added to the bag.
   Load AFTER products.js. Used by every page. */
   (function () {
    "use strict";
  
    var KEY = "cjfinds-favs";        // NOTE: must NOT contain "cart", "bag" or "basket" (bag-reset.js clears those keys)
    var CART_KEY = "cjfinds-cart";   // same bag the other pages use
    var BAG_URL = "index.html#cart-panel";
  
    var P = window.CJ_PRODUCTS;
    if (!P) return;
  
    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
    var money = function (v) {
      return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(v);
    };
    function esc(t) {
      return String(t).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    }
  
    /* ---------- Saved favorites ---------- */
    var favs = readFavs();
    function readFavs() {
      try {
        var d = JSON.parse(localStorage.getItem(KEY));
        return Array.isArray(d) ? d.filter(function (x) { return typeof x === "string"; }) : [];
      } catch (e) { return []; }
    }
    function writeFavs() { try { localStorage.setItem(KEY, JSON.stringify(favs)); } catch (e) {} }
    function has(id) { return favs.indexOf(id) !== -1; }
    function nameOf(id) { return P.byId[id] ? P.byId[id].name : "this piece"; }
  
    var toastTimer;
    function toast(message) {
      var node = $(".toast");
      if (!node) return;
      node.textContent = message;
      node.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { node.classList.remove("show"); }, 2300);
    }
  
    function toggle(id) {
      if (has(id)) {
        favs = favs.filter(function (x) { return x !== id; });
        toast("Removed from your favorites.");
      } else {
        favs.push(id);
        toast(nameOf(id) + " saved to your favorites.");
      }
      writeFavs();
      sync();
      if (grid) renderPage();
    }
  
    // Favorites page: the "Remove" button under each piece
    function removeFav(id) {
      favs = favs.filter(function (x) { return x !== id; });
      writeFavs();
      toast("Removed from your favorites.");
      sync();
      if (grid) renderPage();
    }
  
    /* ---------- Keep every heart + the header count up to date ---------- */
    function sync() {
      var n = favs.length;
      $$(".fav-toggle").forEach(function (link) {
        link.classList.toggle("has-favs", n > 0);
        link.setAttribute("aria-label", "Open favorites (" + n + (n === 1 ? " piece" : " pieces") + ")");
        var badge = $(".fav-count", link);
        if (badge) { badge.textContent = n > 99 ? "99+" : n; badge.classList.toggle("is-zero", n === 0); }
      });
      $$("[data-fav-id]").forEach(function (btn) {
        var id = btn.getAttribute("data-fav-id");
        var on = has(id);
        btn.classList.toggle("liked", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
        if (btn.classList.contains("fav-button")) {
          btn.textContent = on ? "♥ Saved to favorites" : "♡ Save to favorites";
        } else {
          btn.textContent = on ? "♥" : "♡";
          btn.setAttribute("aria-label", (on ? "Remove " : "Add ") + nameOf(id) + (on ? " from favorites" : " to favorites"));
        }
      });
    }
  
    document.addEventListener("click", function (e) {
      var btn = e.target.closest && e.target.closest("[data-fav-id]");
      if (!btn) return;
      e.preventDefault();
      toggle(btn.getAttribute("data-fav-id"));
    });
  
    // Cards that are drawn after this script runs (product page, filters) get their heart state too
    if (window.MutationObserver) {
      var queued = false;
      new MutationObserver(function () {
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () { queued = false; sync(); });
      }).observe(document.body, { childList: true, subtree: true });
    }
    window.addEventListener("storage", function (e) {
      if (e.key === KEY) { favs = readFavs(); sync(); if (grid) renderPage(); }
    });
  
    /* ---------- Favorites page ---------- */
    var grid = document.getElementById("fav-grid");
  
    function loadCart() {
      try { var d = JSON.parse(localStorage.getItem(CART_KEY)); return Array.isArray(d) ? d : []; } catch (e) { return []; }
    }
    function inBag(p) {
      return loadCart().some(function (i) { return i.name === p.name && Number(i.price) === p.price; });
    }
    function addToBag(p) {
      var cart = loadCart();
      var found = cart.filter(function (i) { return i.name === p.name && Number(i.price) === p.price; })[0];
      if (found) found.quantity += 1; else cart.push({ name: p.name, price: p.price, quantity: 1 });
      try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
      if (window.CJBag) window.CJBag.add();   // floating bag: shake + number
    }
  
    function cardHtml(id) {
      var p = P.byId[id];
      if (!p) {   // removed from products.js, or its name/price was changed
        return '<article class="product-card fav-card is-sold">' +
          '<div class="product-photo fav-missing" role="img" aria-label="No longer available"><span class="sold-badge">UNAVAILABLE</span></div>' +
          '<div class="product-info"><div><h3>No longer available</h3><p>This piece is no longer in the shop.</p></div></div>' +
          '<button class="fav-add" type="button" disabled>UNAVAILABLE</button>' +
          '<button class="fav-remove" type="button" data-remove-id="' + esc(id) + '">Remove</button></article>';
      }
      var label = p.sold ? "SOLD" : (inBag(p) ? "In your bag ✓" : "Add to bag <span>+</span>");
      var disabled = (p.sold || inBag(p)) ? " disabled" : "";
      return '<article class="product-card fav-card' + (p.sold ? " is-sold" : "") + '">' +
        '<div class="product-photo" role="img" aria-label="' + esc(p.name) + '" style="background-image:url(\'' + esc(p.front) + '\')">' +
          (p.sold ? '<span class="sold-badge">SOLD</span>' : "") + '</div>' +
        '<div class="product-info"><div><h3>' + esc(p.name) + '</h3><p>' + esc(p.note) + '</p><span class="product-tag">' + esc(p.type) + '</span></div><strong>' + money(p.price) + '</strong></div>' +
        '<button class="fav-add" type="button" data-add-id="' + esc(p.id) + '"' + disabled + '>' + label + '</button>' +
        '<button class="fav-remove" type="button" data-remove-id="' + esc(p.id) + '" aria-label="Remove ' + esc(p.name) + ' from favorites">Remove</button>' +
        '</article>';
    }
  
    function renderPage() {
      var ids = favs.slice().reverse();   // newest first
      var sold = 0, available = 0;
      ids.forEach(function (id) {
        var p = P.byId[id];
        if (p && !p.sold) { if (!inBag(p)) available++; } else sold++;
      });
  
      grid.innerHTML = ids.map(cardHtml).join("");
      $("#fav-empty").hidden = ids.length !== 0;
      $("#fav-toolbar").hidden = ids.length === 0;
      grid.hidden = ids.length === 0;
  
      $("#fav-count").textContent = ids.length + (ids.length === 1 ? " saved piece" : " saved pieces") + (sold ? " · " + sold + " sold" : "");
      $("#fav-sold-note").hidden = sold === 0;
      var all = $("#fav-add-all");
      all.disabled = available === 0;
      all.textContent = available > 0 ? "Add all available to bag (" + available + ")" : "Nothing new to add";
      sync();
    }
  
    if (grid) {
      grid.addEventListener("click", function (e) {
        var rm = e.target.closest && e.target.closest("[data-remove-id]");
        if (rm) { removeFav(rm.getAttribute("data-remove-id")); return; }
        var btn = e.target.closest && e.target.closest("[data-add-id]");
        if (!btn || btn.disabled) return;
        var p = P.byId[btn.getAttribute("data-add-id")];
        if (!p || p.sold) return;
        addToBag(p);
        toast(p.name + " added to your bag.");
        renderPage();
      });
      $("#fav-add-all").addEventListener("click", function () {
        var added = 0;
        favs.forEach(function (id) {
          var p = P.byId[id];
          if (p && !p.sold && !inBag(p)) { addToBag(p); added++; }
        });
        toast(added ? added + (added === 1 ? " piece" : " pieces") + " added to your bag." : "Nothing new to add.");
        renderPage();
      });
  
      // This page has no bag panel, so the floating bag opens the bag on the homepage
      var floatingBag = $(".cj-bag");
      if (floatingBag) floatingBag.setAttribute("href", BAG_URL);
  
      var menuBtn = $(".menu-toggle");
      if (menuBtn) menuBtn.addEventListener("click", function () {
        var panel = $(".mobile-menu");
        var willOpen = panel.hidden;
        panel.hidden = !willOpen;
        menuBtn.setAttribute("aria-expanded", String(willOpen));
      });
      var year = $("#year"); if (year) year.textContent = new Date().getFullYear();
      renderPage();
    } else {
      sync();
    }
  
    window.CJFav = { has: has, toggle: toggle, list: function () { return favs.slice(); }, sync: sync };
  })();
  