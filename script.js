const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = value => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);
let cart = [];
let toastTimer;
const CART_KEY = "cjfinds-cart"; // same key shop.js uses, so the bag is shared across pages
function loadCart() {
  try { cart = JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { cart = []; }
  if (!Array.isArray(cart)) cart = [];
}
function saveCart() {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
}

function toast(message) {
  const node = $(".toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove("show"), 2300);
}


/* Homepage "Featured finds" and "Editor's pick" are drawn from products.js */
function renderHomepageProducts() {
  const P = window.CJ_PRODUCTS;
  if (!P) return;
  const grid = $(".product-grid");
  if (grid) {
    grid.innerHTML = "";
    P.featured().forEach(p => {
      const card = document.createElement("article");
      card.className = "product-card" + (p.sold ? " is-sold" : "");
      card.dataset.category = p.category === "accessories" ? "accessories" : "fashion";
      card.innerHTML = `
        <button class="favorite" type="button" data-fav-id="${p.id}" aria-pressed="false" aria-label="Add ${p.name} to favorites">♡</button>
        <div class="product-photo" role="img" aria-label="${p.name}" style="background-image:url('${p.front}')">${p.sold ? '<span class="sold-badge">SOLD</span>' : ''}</div>
        <div class="product-info"><div><h3>${p.name}</h3><p>${p.note}</p></div><strong>${money(p.price)}</strong></div>
        <button class="add-product" type="button" data-product="${p.name}" data-price="${p.price}" ${p.sold ? "disabled" : ""}>${p.sold ? "SOLD" : "Add to bag <span>+</span>"}</button>`;
      grid.appendChild(card);
    });
  }
  const pick = P.editorsPick();
  const detail = $(".product-detail");
  if (detail && pick) {
    detail.innerHTML = `
      <div class="detail-image" role="img" aria-label="${pick.name}" style="background-image:url('${pick.front}')">${pick.sold ? '<span class="sold-badge">SOLD</span>' : ''}</div>
      <div class="detail-copy">
        <p class="eyebrow">Editor's pick</p><h2>The ${pick.name}</h2>
        <div class="detail-price">${money(pick.price)}</div>
        <p class="detail-description">${pick.description}</p>
        <button class="primary-button detail-add" type="button" data-product="${pick.name}" data-price="${pick.price}" ${pick.sold ? "disabled" : ""}>${pick.sold ? "SOLD" : "Add to Cart <span>→</span>"}</button>
        <p class="detail-note">Grab it before it's too late!</p>
      </div>`;
  } else if (detail) {
    detail.hidden = true;
  }
}
renderHomepageProducts();

// Responsive navigation and search panels.
$(".menu-toggle").addEventListener("click", () => {
  const panel = $(".mobile-menu");
  const willOpen = panel.hidden;
  panel.hidden = !willOpen;
  $(".menu-toggle").setAttribute("aria-expanded", String(willOpen));
});
$$(".mobile-menu a").forEach(link => link.addEventListener("click", () => {
  $(".mobile-menu").hidden = true;
  $(".menu-toggle").setAttribute("aria-expanded", "false");
}));
$(".search-toggle").addEventListener("click", () => {
  const panel = $(".search-panel");
  panel.hidden = !panel.hidden;
  $(".search-toggle").setAttribute("aria-expanded", String(!panel.hidden));
  if (!panel.hidden) $("#search-input").focus();
});
$(".search-panel").addEventListener("submit", event => {
  event.preventDefault();
  const term = $("#search-input").value.trim().toLowerCase();
  const cards = $$(".product-card");
  let matches = 0;
  cards.forEach(card => {
    const found = !term || card.textContent.toLowerCase().includes(term);
    card.hidden = !found;
    if (found) matches++;
  });
  $(".search-message").textContent = term ? `${matches} matching find${matches === 1 ? "" : "s"} shown below.` : "Showing all featured finds.";
  $("#featured").scrollIntoView({ behavior: "smooth" });
});

// Hero pagination keeps the original composition and changes the active marker.
$$(".hero-pagination button").forEach(button => button.addEventListener("click", () => {
  $$(".hero-pagination button").forEach(item => item.classList.toggle("active", item === button));
  const hero = $(".hero");
  const slides = [
    ["New Season", "Modern<br>Essentials", "Timeless pieces for a more<br class=\"desktop-break\"> confident you."],
    ["Quiet Luxury", "Everyday<br>Elegance", "Considered details. Effortless<br class=\"desktop-break\"> confidence."],
    ["New Favorites", "Made to<br>Last", "Versatile pieces for wherever<br class=\"desktop-break\"> life takes you."]
  ];
  const slide = slides[Number(button.dataset.slide)];
  $(".hero-copy .eyebrow").textContent = slide[0];
  $("h1", hero).innerHTML = slide[1];
  $(".hero-description", hero).innerHTML = slide[2];
}));

// Category filters.
$$(".filter-chip").forEach(button => button.addEventListener("click", () => {
  $$(".filter-chip").forEach(item => item.classList.toggle("active", item === button));
  const filter = button.dataset.filter;
  $$(".product-card").forEach(card => card.hidden = filter !== "all" && card.dataset.category !== filter);
}));

// Favorite hearts are handled by favorites.js

// Product detail color and size selectors.
$$(".color-option").forEach(button => button.addEventListener("click", () => {
  $$(".color-option").forEach(item => item.classList.toggle("selected", item === button));
  $("#selected-color").textContent = button.dataset.color;
}));
$$(".size-options button").forEach(button => button.addEventListener("click", () => {
  $$(".size-options button").forEach(item => item.classList.toggle("selected", item === button));
  $("#selected-size").textContent = button.textContent;
}));

function addToCart(name, price) {
  const found = cart.find(item => item.name === name);
  if (found) found.quantity += 1;
  else cart.push({ name, price: Number(price), quantity: 1 });
  renderCart();
  toast(`${name} added to your bag.`);
}
$$(".add-product, .detail-add").forEach(button => button.addEventListener("click", () => {
  addToCart(button.dataset.product, button.dataset.price);
}));

function renderCart() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const headerCount = $(".cart-count"); if (headerCount) headerCount.textContent = count;
  $(".bag-heading-count").textContent = `(${count})`;
  const container = $(".cart-items");
  container.innerHTML = "";
  if (!cart.length) {
    const empty = document.createElement("p");
    empty.className = "empty-cart";
    empty.textContent = "Your bag is waiting for something lovely.";
    container.appendChild(empty);
  } else {
    cart.forEach(item => {
      const row = document.createElement("div");
      row.className = "cart-line";
      const details = document.createElement("div");
      const name = document.createElement("h3");
      name.textContent = item.name;
      const price = document.createElement("p");
      price.textContent = `${money(item.price)} each`;
      const controls = document.createElement("div");
      controls.className = "quantity-controls";
      const minus = document.createElement("button");
      minus.type = "button"; minus.textContent = "−"; minus.setAttribute("aria-label", `Remove one ${item.name}`);
      minus.addEventListener("click", () => changeQuantity(item.name, -1));
      const quantity = document.createElement("span"); quantity.textContent = item.quantity;
      const plus = document.createElement("button");
      plus.type = "button"; plus.textContent = "+"; plus.setAttribute("aria-label", `Add one ${item.name}`);
      plus.addEventListener("click", () => changeQuantity(item.name, 1));
      controls.append(minus, quantity, plus);
      details.append(name, price, controls);
      const lineTotal = document.createElement("strong");
      lineTotal.textContent = money(item.price * item.quantity);
      row.append(details, lineTotal);
      container.appendChild(row);
    });
  }
  $(".subtotal").textContent = money(subtotal);
  $(".total").textContent = money(subtotal);
  $(".checkout-button").disabled = count === 0;
  saveCart();
}
function changeQuantity(name, amount) {
  const item = cart.find(product => product.name === name);
  if (!item) return;
  item.quantity += amount;
  if (item.quantity <= 0) cart = cart.filter(product => product.name !== name);
  renderCart();
}
$(".cart-toggle")?.addEventListener("click", () => $("#cart-panel").scrollIntoView({ behavior: "smooth", block: "center" }));
$(".checkout-button").addEventListener("click", () => {
  if (!cart.length) return;
  window.location.href = "checkout.html";
});

$$(".swatch").forEach(button => button.addEventListener("click", () => {
  const colors = {
    blush: ["#f8f1e9", "#c68183", "#783b50"],
    rose: ["#f8f1e9", "#b47d85", "#783b50"],
    powder: ["#f8f1e9", "#eed5d0", "#783b50"],
    mauve: ["#f8f1e9", "#783b50", "#603344"]
  };
  const key = [...button.classList].find(name => colors[name]);
  if (!key) return;
  document.documentElement.style.setProperty("--mint", colors[key][0]);
  document.documentElement.style.setProperty("--sage", colors[key][1]);
  document.documentElement.style.setProperty("--sage-dark", colors[key][2]);
  toast(`${button.getAttribute("aria-label")} palette selected.`);
}));
$("#year").textContent = new Date().getFullYear();
loadCart();
renderCart();

/* Empty the bag when bag-reset.js says the order is done */
document.addEventListener("cjbag:cleared", () => {
  cart = [];
  renderCart();
});
