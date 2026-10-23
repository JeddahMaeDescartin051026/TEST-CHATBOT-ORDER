/* CJ Finds - product page: shows the front view, back view, size icon and ADD TO BAG.
   Used by product.html (opened by clicking any product photo, e.g. product.html?id=everyday-knit-299). */
   (function () {
    "use strict";
  
    var P = window.CJ_PRODUCTS;
    var CART_KEY = "cjfinds-cart";           // same bag the other pages use
    var BAG_URL = "index.html#cart-panel";   // where the bag is shown
    var toastTimer;
  
    var $ = function (s, r) { return (r || document).querySelector(s); };
    var money = function (v) {
      return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(v);
    };
    function esc(text) {
      return String(text).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    }
  
    /* ---------- Bag (same storage as shop.js / script.js) ---------- */
    function loadCart() {
      try {
        var data = JSON.parse(localStorage.getItem(CART_KEY));
        return Array.isArray(data) ? data : [];
      } catch (e) { return []; }
    }
    function saveCart(cart) {
      try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
    }
    function showHeaderCount() {
      var count = loadCart().reduce(function (sum, item) { return sum + (item.quantity || 0); }, 0);
      var headerCount = $(".cart-count"); if (headerCount) headerCount.textContent = count;
    }
    function toast(message) {
      var node = $(".toast");
      node.textContent = message;
      node.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { node.classList.remove("show"); }, 2300);
    }
    function addToBag(p) {
      var cart = loadCart();
      var found = cart.find(function (i) { return i.name === p.name && Number(i.price) === p.price; });
      if (found) found.quantity += 1;
      else cart.push({ name: p.name, price: p.price, quantity: 1 });
      saveCart(cart);
      showHeaderCount();
      if (window.CJBag) window.CJBag.add();   // floating bag: shake + number
      toast(p.name + " added to your bag.");
    }
  
    /* ---------- Page ---------- */
    function render(p) {
      document.title = p.name + " — CJ Finds";
      var category = P.categoryName(p.category);
      $("#crumbs").innerHTML =
        '<a href="index.html">Home</a> / <a href="' + esc(p.category) + '.html">' + esc(category) + "</a> / " + esc(p.name);
  
      var backClass = p.back ? "" : " is-sample-back";
      var backImage = p.back || p.front;
  
      $("#product-root").innerHTML =
        '<div class="product-gallery">' +
          '<figure class="view"><div class="view-frame" role="button" tabindex="0" data-view="0" aria-label="Open front view of ' + esc(p.name) + ' full screen"><div class="view-photo" role="img" aria-label="Front view of ' + esc(p.name) + '" style="background-image:url(\'' + esc(p.front) + '\')"></div><span class="zoom-hint" aria-hidden="true">⤢</span>' + (p.sold ? '<span class="sold-badge">SOLD</span>' : '') + '</div><figcaption>Front view</figcaption></figure>' +
          '<figure class="view"><div class="view-frame" role="button" tabindex="0" data-view="1" aria-label="Open back view of ' + esc(p.name) + ' full screen"><div class="view-photo' + backClass + '" role="img" aria-label="Back view of ' + esc(p.name) + '" style="background-image:url(\'' + esc(backImage) + '\')"></div><span class="zoom-hint" aria-hidden="true">⤢</span>' + (p.sold ? '<span class="sold-badge">SOLD</span>' : '') + '</div><figcaption>Back view</figcaption></figure>' +
        "</div>" +
        '<div class="product-summary">' +
          '<p class="eyebrow">' + esc(category) + " · " + esc(p.type) + "</p>" +
          "<h1>" + esc(p.name) + "</h1>" +
          '<p class="product-note">' + esc(p.note) + "</p>" +
          '<p class="product-price">' + money(p.price) + "</p>" +
          '<p class="product-desc">' + esc(p.description) + "</p>" +
          '<div class="size-row"><span class="size-label">Size</span>' +
            '<span class="size-chip" title="' + esc(P.sizeName(p.size)) + '">' + esc(p.size) + "</span>" +
            '<span class="size-name">' + esc(P.sizeName(p.size)) + "</span></div>" +
          '<button class="primary-button buy-button" type="button"' + (p.sold ? ' disabled>SOLD' : '>Add to bag <span>+</span>') + '</button>' +
          '<button class="fav-button" type="button" data-fav-id="' + esc(p.id) + '">♡ Save to favorites</button>' +
          '<a class="view-bag" href="' + BAG_URL + '">View bag →</a>' +
          '<p class="pay-note">Cash on Delivery · QR payment</p>' +
        "</div>";
  
      $(".buy-button").addEventListener("click", function () { addToBag(p); });
  
      setupLightbox([
        { src: p.front, label: "Front view", mirrored: false, alt: "Front view of " + p.name },
        { src: backImage, label: "Back view", mirrored: !p.back, alt: "Back view of " + p.name }
      ]);
    }
  
    /* ---------- Full-screen viewer (click a photo to enlarge it) ---------- */
    function setupLightbox(views) {
      var box = document.createElement("div");
      box.className = "lightbox";
      box.hidden = true;
      box.setAttribute("role", "dialog");
      box.setAttribute("aria-modal", "true");
      box.setAttribute("aria-label", "Product photo, full screen");
      box.innerHTML =
        '<button class="lb-close" type="button" aria-label="Close full screen">&times;</button>' +
        '<button class="lb-nav lb-prev" type="button" aria-label="Previous photo">&#8249;</button>' +
        '<div class="lb-stage"><img class="lb-img" alt=""></div>' +
        '<button class="lb-nav lb-next" type="button" aria-label="Next photo">&#8250;</button>' +
        '<p class="lb-caption"></p>';
      document.body.appendChild(box);
  
      var img = $(".lb-img", box);
      var caption = $(".lb-caption", box);
      var current = 0;
      var opener = null;
  
      function show(index) {
        current = (index + views.length) % views.length;
        var v = views[current];
        img.src = v.src;
        img.alt = v.alt;
        img.classList.toggle("is-sample-back", v.mirrored);
        caption.textContent = v.label + " (" + (current + 1) + " of " + views.length + ")";
      }
      function open(index, trigger) {
        opener = trigger || null;
        show(index);
        box.hidden = false;
        document.body.classList.add("lb-open");
        $(".lb-close", box).focus();
      }
      function close() {
        box.hidden = true;
        document.body.classList.remove("lb-open");
        img.removeAttribute("src");
        if (opener) opener.focus();
      }
  
      document.querySelectorAll(".view-frame").forEach(function (frame) {
        frame.addEventListener("click", function () { open(Number(frame.dataset.view), frame); });
        frame.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(Number(frame.dataset.view), frame); }
        });
      });
      $(".lb-close", box).addEventListener("click", close);
      $(".lb-prev", box).addEventListener("click", function () { show(current - 1); });
      $(".lb-next", box).addEventListener("click", function () { show(current + 1); });
      // click the dark area (not the photo) to close
      box.addEventListener("click", function (e) {
        if (e.target === box || e.target.classList.contains("lb-stage")) close();
      });
      document.addEventListener("keydown", function (e) {
        if (box.hidden) return;
        if (e.key === "Escape") close();
        else if (e.key === "ArrowLeft") show(current - 1);
        else if (e.key === "ArrowRight") show(current + 1);
        else if (e.key === "Tab") {           // keep keyboard focus inside the viewer
          var focusable = box.querySelectorAll("button");
          var first = focusable[0], last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      });
    }
  
    function renderMissing() {
      document.title = "Product not found — CJ Finds";
      $("#product-root").innerHTML =
        '<div class="product-missing"><h1>We couldn\u2019t find that piece</h1>' +
        '<p>It may have been sold. <a href="index.html#featured">Browse featured finds</a></p></div>';
    }
  
    var id = new URLSearchParams(window.location.search).get("id");
    var product = P && id ? P.byId[id] : null;
    if (product) render(product); else renderMissing();
  
    /* ---------- Header, menu, floating bag ---------- */
    showHeaderCount();
    $("#year").textContent = new Date().getFullYear();
    $(".menu-toggle").addEventListener("click", function () {
      var panel = $(".mobile-menu");
      var willOpen = panel.hidden;
      panel.hidden = !willOpen;
      $(".menu-toggle").setAttribute("aria-expanded", String(willOpen));
    });
  
    // This page has no bag panel, so the floating bag opens the bag on the homepage
    var floatingBag = $(".cj-bag");
    if (floatingBag) floatingBag.setAttribute("href", BAG_URL);
  })();
  
