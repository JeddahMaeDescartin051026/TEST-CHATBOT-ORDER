/* Stop the page from auto-scrolling on open/reload (smooth scrolling stays for clicks). */
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
document.documentElement.style.scrollBehavior = "auto";
window.addEventListener("load", () => {
  const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (target) target.scrollIntoView(); else window.scrollTo(0, 0);
  requestAnimationFrame(() => { document.documentElement.style.scrollBehavior = ""; });
});

/* Shared logic for women.html, men.html and accessories.html */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = v => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(v);
const CART_KEY = "cjfinds-cart";

/* Products come from products.js (the only file you edit to change products). */
const PAGE = document.body.dataset.page;
const products = window.CJ_PRODUCTS ? window.CJ_PRODUCTS.inCategory(PAGE).map(p => ({ ...p, img: p.front })) : [];
const filters = { type: "all", price: "all", term: "" };
let cart = [];
let toastTimer;

function loadCart() {
  try { cart = JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { cart = []; }
}
function saveCart() {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* storage unavailable */ }
}
function toast(message) {
  const node = $(".toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove("show"), 2300);
}

/* ---------- Products ---------- */
function renderProducts() {
  const grid = $(".product-grid");
  grid.innerHTML = "";
  products.forEach(p => {
    const card = document.createElement("article");
    card.className = "product-card" + (p.sold ? " is-sold" : "");
    card.innerHTML = `
      <button class="favorite" type="button" data-fav-id="${p.id}" aria-pressed="false" aria-label="Add ${p.name} to favorites">♡</button>
      <div class="product-photo" role="img" aria-label="${p.name}" style="background-image:url('${p.img}')">${p.sold ? '<span class="sold-badge">SOLD</span>' : ''}</div>
      <div class="product-info"><div><h3>${p.name}</h3><p>${p.note}</p><span class="product-tag">${p.type}</span></div><strong>${money(p.price)}</strong></div>
      <button class="add-product" ${p.sold ? "disabled" : ""}>${p.sold ? "SOLD" : "Add to bag <span>+</span>"}</button>`;
    $(".add-product", card).addEventListener("click", () => addToCart(p.name, p.price));
    card._product = p;
    grid.appendChild(card);
  });
  const empty = document.createElement("p");
  empty.className = "no-results";
  empty.hidden = true;
  empty.textContent = "No finds match those filters yet. Try another one!";
  grid.appendChild(empty);
  applyFilters();
}
function applyFilters() {
  let shown = 0;
  $$(".product-card").forEach(card => {
    const p = card._product;
    const ok = (filters.type === "all" || p.type === filters.type) &&
      (filters.price === "all" || p.price === filters.price) &&
      (!filters.term || `${p.name} ${p.note} ${p.type}`.toLowerCase().includes(filters.term));
    card.hidden = !ok;
    if (ok) shown++;
  });
  $(".no-results").hidden = shown !== 0;
  $(".result-count").textContent = `${shown} find${shown === 1 ? "" : "s"}`;
}

/* ---------- Cart ---------- */
function addToCart(name, price) {
  const found = cart.find(i => i.name === name && i.price === Number(price));
  if (found) found.quantity += 1; else cart.push({ name, price: Number(price), quantity: 1 });
  renderCart();
  toast(`${name} added to your bag.`);
}
function changeQuantity(item, amount) {
  item.quantity += amount;
  if (item.quantity <= 0) cart = cart.filter(i => i !== item);
  renderCart();
}
function renderCart() {
  const count = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const headerCount = $(".cart-count"); if (headerCount) headerCount.textContent = count;
  $(".bag-heading-count").textContent = `(${count})`;
  const box = $(".cart-items");
  box.innerHTML = "";
  if (!cart.length) {
    const p = document.createElement("p");
    p.className = "empty-cart";
    p.textContent = "Your bag is waiting for something lovely.";
    box.appendChild(p);
  } else {
    cart.forEach(item => {
      const row = document.createElement("div");
      row.className = "cart-line";
      const details = document.createElement("div");
      const h = document.createElement("h3"); h.textContent = item.name;
      const pr = document.createElement("p"); pr.textContent = `${money(item.price)} each`;
      const controls = document.createElement("div"); controls.className = "quantity-controls";
      const minus = document.createElement("button");
      minus.type = "button"; minus.textContent = "−"; minus.setAttribute("aria-label", `Remove one ${item.name}`);
      minus.addEventListener("click", () => changeQuantity(item, -1));
      const q = document.createElement("span"); q.textContent = item.quantity;
      const plus = document.createElement("button");
      plus.type = "button"; plus.textContent = "+"; plus.setAttribute("aria-label", `Add one ${item.name}`);
      plus.addEventListener("click", () => changeQuantity(item, 1));
      controls.append(minus, q, plus);
      details.append(h, pr, controls);
      const total = document.createElement("strong"); total.textContent = money(item.price * item.quantity);
      row.append(details, total);
      box.appendChild(row);
    });
  }
  $(".subtotal").textContent = money(subtotal);
  $(".total").textContent = money(subtotal);
  $(".checkout-button").disabled = count === 0;
  saveCart();
}

/* ---------- Page wiring ---------- */
function setActive(group, button) {
  $$(group).forEach(b => b.classList.toggle("active", b === button));
}
$$("[data-filter]").forEach(b => b.addEventListener("click", () => {
  setActive("[data-filter]", b);
  filters.type = b.dataset.filter;
  applyFilters();
}));
$$("[data-price]").forEach(b => b.addEventListener("click", () => {
  setActive("[data-price]", b);
  filters.price = b.dataset.price === "all" ? "all" : Number(b.dataset.price);
  applyFilters();
}));

$(".menu-toggle").addEventListener("click", () => {
  const panel = $(".mobile-menu");
  const open = panel.hidden;
  panel.hidden = !open;
  $(".menu-toggle").setAttribute("aria-expanded", String(open));
});
$(".search-toggle").addEventListener("click", () => {
  const panel = $(".search-panel");
  panel.hidden = !panel.hidden;
  $(".search-toggle").setAttribute("aria-expanded", String(!panel.hidden));
  if (!panel.hidden) $("#search-input").focus();
});
$(".search-panel").addEventListener("submit", e => {
  e.preventDefault();
  filters.term = $("#search-input").value.trim().toLowerCase();
  applyFilters();
  $(".search-message").textContent = filters.term ? `Showing results for “${$("#search-input").value.trim()}”.` : "Showing all finds.";
  $("#catalog").scrollIntoView({ behavior: "smooth" });
});
$(".cart-toggle")?.addEventListener("click", () => $("#cart-panel").scrollIntoView({ behavior: "smooth", block: "center" }));
$(".checkout-button").addEventListener("click", () => {
  if (cart.length) window.location.href = "checkout.html";
});
$("#year").textContent = new Date().getFullYear();

loadCart();
renderProducts();
renderCart();
/* Empty the bag when bag-reset.js says the order is done */
document.addEventListener("cjbag:cleared", () => {
  cart = [];
  renderCart();
});
