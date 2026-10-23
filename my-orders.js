import { app, watchAuth } from "./auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { esc, peso, getSoldMap, describeOrder, orderLabel } from "./order-status.js";

const db = getFirestore(app);
const TZ = "Asia/Manila";
const $ = (id) => document.getElementById(id);

const formatWhen = (ts) => {
  const d = ts && typeof ts.toDate === "function" ? ts.toDate() : null;
  return d
    ? d.toLocaleString("en-PH", {
        timeZone: TZ, year: "numeric", month: "short", day: "numeric",
        hour: "numeric", minute: "2-digit",
      })
    : "Just now";
};

const STATUS_CLASS = { done: "st-done", sold: "st-sold", partial: "st-partial", pending: "st-pending" };

function itemRow(it, state) {
  if (it === null || typeof it !== "object") return `<li><span>${esc(it)}</span></li>`;
  const name = it.name || it.title || "Item";
  const qty = it.qty ?? it.quantity ?? 1;
  const price = Number(it.price);
  const tag =
    state === "other" ? `<span class="tag tag-sold">SOLD</span>`
    : state === "mine" ? `<span class="tag tag-mine">✓ YOURS</span>`
    : "";
  return `<li class="${state === "other" ? "is-sold" : ""}">
    <span class="iname">${esc(name)}${qty > 1 ? ` <span class="qty">× ${esc(qty)}</span>` : ""}</span>
    <span class="side">${tag}<span>${Number.isFinite(price) ? peso(price * qty) : ""}</span></span>
  </li>`;
}

function orderCard(o, info) {
  const items = Array.isArray(o.items) ? o.items : [];
  const label = orderLabel(o) || `#${o.id.slice(0, 6).toUpperCase()}`;
  return `
  <article class="order-card">
    <div class="oc-head">
      <span class="oc-no">${esc(label)}</span>
      <span>${esc(formatWhen(o.createdAt))}</span>
    </div>
    <div class="oc-status ${STATUS_CLASS[info.kind]}"><strong>${esc(info.title)}</strong><span>${esc(info.text)}</span></div>
    <ul class="oc-items">${items.map((it, i) => itemRow(it, info.states[i])).join("")}</ul>
    <div class="oc-total"><span>Total</span><span>${peso(o.total)}</span></div>
  </article>`;
}

function show(which) {
  $("loading").hidden = which !== "loading";
  $("signedOut").hidden = which !== "signedOut";
  $("unverified").hidden = which !== "unverified";
  $("listView").hidden = which !== "list";
}

/* ---------- Header menu + footer year (same as the account page) ---------- */
const menuBtn = document.querySelector(".menu-toggle");
if (menuBtn) {
  menuBtn.addEventListener("click", () => {
    const panel = document.querySelector(".mobile-menu");
    const open = panel.hidden;
    panel.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
  });
}
$("year").textContent = new Date().getFullYear();

/* ---------- Orders ---------- */
let stopListening = null;
let renderToken = 0;

watchAuth(({ user, canShop }) => {
  if (stopListening) { stopListening(); stopListening = null; }

  if (!user) return show("signedOut");
  if (!canShop) return show("unverified");

  show("list");
  $("error").hidden = true;

  // Only this customer's own orders (matches the Firestore rule). Sorted here, so no index is needed.
  const q = query(collection(db, "orders"), where("uid", "==", user.uid));

  stopListening = onSnapshot(
    q,
    async (snap) => {
      const token = ++renderToken;
      const big = Number.MAX_SAFE_INTEGER;
      const orders = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? big) - (a.createdAt?.toMillis?.() ?? big));

      const infos = await Promise.all(
        orders.map(async (o) => describeOrder(o, await getSoldMap(db, o)))
      );
      if (token !== renderToken) return; // a newer update arrived while checking items

      $("error").hidden = true;
      $("empty").hidden = orders.length > 0;
      $("list").innerHTML = orders.map((o, i) => orderCard(o, infos[i])).join("");
    },
    (err) => {
      console.error(err);
      $("empty").hidden = true;
      $("error").textContent =
        err.code === "permission-denied"
          ? "We couldn't load your orders yet. Please try again later."
          : "Couldn't load your orders. Check your connection and refresh.";
      $("error").hidden = false;
    }
  );
});
