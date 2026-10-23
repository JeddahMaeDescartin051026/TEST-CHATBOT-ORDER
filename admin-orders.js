import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { firebaseConfig } from "./firebase-config.js";

/* ---------- Setup ---------- */
const ADMIN_EMAIL = "chanchan.tumulak@gmail.com";
const TZ = "Asia/Manila"; // Philippine time, UTC+8 (no daylight saving)
const MAX_ORDERS = 500;

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = (id) => document.getElementById(id);
const el = {
  loginView: $("loginView"),
  deniedView: $("deniedView"),
  appView: $("appView"),
  who: $("who"),
  whoEmail: $("whoEmail"),
  loginForm: $("loginForm"),
  loginEmail: $("loginEmail"),
  loginPassword: $("loginPassword"),
  loginBtn: $("loginBtn"),
  loginMsg: $("loginMsg"),
  deniedText: $("deniedText"),
  fromDate: $("fromDate"),
  toDate: $("toDate"),
  statusFilter: $("statusFilter"),
  searchBox: $("searchBox"),
  applyBtn: $("applyBtn"),
  chips: $("chips"),
  sumCount: $("sumCount"),
  sumTotal: $("sumTotal"),
  sumPending: $("sumPending"),
  listMsg: $("listMsg"),
  orders: $("orders"),
  toast: $("toast"),
};

let allOrders = []; // orders returned by the last Firestore query

/* ---------- Helpers ---------- */
const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));

const peso = (n) =>
  "₱" + Number(n || 0).toLocaleString("en-PH", { maximumFractionDigits: 2 });

// "YYYY-MM-DD" for a Date, as seen in Philippine time
const manilaYMD = (d = new Date()) =>
  d.toLocaleDateString("en-CA", { timeZone: TZ });

const addDays = (ymd, n) => {
  const d = new Date(ymd + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// Start of a Philippine calendar day as a Timestamp
const dayStart = (ymd) => Timestamp.fromDate(new Date(ymd + "T00:00:00+08:00"));

const formatWhen = (ts) => {
  const d = ts && typeof ts.toDate === "function" ? ts.toDate() : null;
  if (!d) return "No date";
  return d.toLocaleString("en-PH", {
    timeZone: TZ,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

let toastTimer;
function toast(text) {
  el.toast.textContent = text;
  el.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.toast.hidden = true), 2800);
}

function showMessage(text, isError = false) {
  el.listMsg.textContent = text;
  el.listMsg.classList.toggle("msg-error", isError);
  el.listMsg.hidden = !text;
}

function showView(name) {
  el.loginView.hidden = name !== "login";
  el.deniedView.hidden = name !== "denied";
  el.appView.hidden = name !== "app";
}

/* ---------- Auth ---------- */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    el.who.hidden = true;
    showView("login");
    return;
  }

  el.who.hidden = false;
  el.whoEmail.textContent = user.email || "";

  const isAdmin =
    user.emailVerified && (user.email || "").toLowerCase() === ADMIN_EMAIL;

  if (!isAdmin) {
    el.deniedText.textContent = !user.emailVerified
      ? "This email isn't verified yet. Verify it, then sign in again."
      : `Only ${ADMIN_EMAIL} can view orders. Sign out and use that account.`;
    showView("denied");
    return;
  }

  showView("app");
  applyRange("7");
});

el.loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  el.loginMsg.hidden = true;
  el.loginBtn.disabled = true;
  try {
    await signInWithEmailAndPassword(
      auth,
      el.loginEmail.value.trim(),
      el.loginPassword.value
    );
    el.loginPassword.value = "";
  } catch (err) {
    el.loginMsg.textContent =
      err.code === "auth/too-many-requests"
        ? "Too many attempts. Wait a few minutes and try again."
        : "Wrong email or password.";
    el.loginMsg.hidden = false;
  } finally {
    el.loginBtn.disabled = false;
  }
});

const doSignOut = () => signOut(auth);
$("signOutBtn").addEventListener("click", doSignOut);
$("deniedSignOut").addEventListener("click", doSignOut);

/* ---------- Date range chips ---------- */
function applyRange(range) {
  const today = manilaYMD();
  let from = "";
  let to = "";

  if (range === "today") { from = today; to = today; }
  else if (range === "yesterday") { from = to = addDays(today, -1); }
  else if (range === "7") { from = addDays(today, -6); to = today; }
  else if (range === "month") { from = today.slice(0, 8) + "01"; to = today; }
  // "all" leaves both empty

  el.fromDate.value = from;
  el.toDate.value = to;

  el.chips.querySelectorAll(".chip").forEach((c) =>
    c.classList.toggle("is-active", c.dataset.range === range)
  );
  loadOrders();
}

el.chips.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (chip) applyRange(chip.dataset.range);
});

// Typing your own dates clears the quick-range highlight
[el.fromDate, el.toDate].forEach((input) =>
  input.addEventListener("change", () =>
    el.chips.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-active"))
  )
);

el.applyBtn.addEventListener("click", loadOrders);
el.statusFilter.addEventListener("change", render);
el.searchBox.addEventListener("input", render);

/* ---------- Load from Firestore ---------- */
async function loadOrders() {
  showMessage("Loading orders…");
  el.orders.innerHTML = "";
  el.applyBtn.disabled = true;

  try {
    const constraints = [];
    if (el.fromDate.value) {
      constraints.push(where("createdAt", ">=", dayStart(el.fromDate.value)));
    }
    if (el.toDate.value) {
      // "To" is inclusive, so stop before the start of the next day
      constraints.push(where("createdAt", "<", dayStart(addDays(el.toDate.value, 1))));
    }
    constraints.push(orderBy("createdAt", "desc"), limit(MAX_ORDERS));

    const snap = await getDocs(query(collection(db, "orders"), ...constraints));
    allOrders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    showMessage("");
    render();
  } catch (err) {
    console.error(err);
    allOrders = [];
    render();
    if (err.code === "permission-denied") {
      showMessage(
        "Firestore denied access. Sign in as the verified admin email used in your rules.",
        true
      );
    } else if (err.code === "failed-precondition") {
      showMessage(
        "Firestore needs an index for this query. Open the browser console (F12) and click the link in the error to create it.",
        true
      );
    } else {
      showMessage("Couldn't load orders. Check your connection and try again.", true);
    }
  } finally {
    el.applyBtn.disabled = false;
  }
}

/* ---------- Render ---------- */
function visibleOrders() {
  const status = el.statusFilter.value;
  const q = el.searchBox.value.trim().toLowerCase();

  return allOrders.filter((o) => {
    if (status && o.status !== status) return false;
    if (!q) return true;
    return [o.name, o.email, o.phone, o.social, o.id]
      .some((v) => String(v || "").toLowerCase().includes(q));
  });
}

function itemLine(it) {
  if (it === null || typeof it !== "object") {
    return `<li><span>${esc(it)}</span></li>`;
  }
  const name = it.name || it.title || "Item";
  const qty = it.qty ?? it.quantity ?? 1;
  const price = Number(it.price);
  const extras = [it.size, it.color, it.condition].filter(Boolean).join(", ");
  return `
    <li>
      <span>${esc(name)}${qty > 1 ? ` × ${esc(qty)}` : ""}
        ${extras ? `<span class="meta"> (${esc(extras)})</span>` : ""}</span>
      <span>${Number.isFinite(price) ? peso(price * qty) : ""}</span>
    </li>`;
}

function orderHTML(o) {
  const done = o.status === "COMPLETED";
  const items = Array.isArray(o.items) ? o.items : [];

  return `
  <details class="order" data-id="${esc(o.id)}">
    <summary>
      <span class="o-name">${esc(o.name || "No name")}</span>
      <span class="o-total">${peso(o.total)}</span>
      <span class="o-date">${esc(formatWhen(o.createdAt))}</span>
      <span class="pill ${done ? "pill-done" : "pill-pending"}">${done ? "Completed" : "Not completed"}</span>
    </summary>
    <div class="order-body">
      <div class="kv">
        <h2>Customer</h2>
        <p><span class="k">Email</span>${esc(o.email)}</p>
        <p><span class="k">Phone</span>${esc(o.phone)}</p>
        <p><span class="k">Social</span>${esc(o.social)}</p>
        <p><span class="k">Address</span>${esc(o.address)}</p>
        ${o.note ? `<p><span class="k">Note</span>${esc(o.note)}</p>` : ""}
      </div>
      <div>
        <h2>Items (${items.length})</h2>
        <ul class="items">${items.map(itemLine).join("") || "<li>No items</li>"}</ul>
      </div>
      <div class="full actions">
        <button type="button" class="btn btn-primary btn-small" data-action="toggle">
          ${done ? "Mark as not completed" : "Mark as completed"}
        </button>
        <button type="button" class="btn btn-danger btn-small" data-action="delete">Delete</button>
      </div>
      <p class="full order-id">Order ID: ${esc(o.id)}</p>
    </div>
  </details>`;
}

function render() {
  const list = visibleOrders();

  el.orders.innerHTML = list.map(orderHTML).join("");

  el.sumCount.textContent = list.length;
  el.sumTotal.textContent = peso(list.reduce((s, o) => s + (Number(o.total) || 0), 0));
  el.sumPending.textContent = list.filter((o) => o.status !== "COMPLETED").length;

  if (!list.length && el.listMsg.hidden) {
    showMessage(
      allOrders.length
        ? "No orders match your status or search filters."
        : "No orders in this date range. Try a wider range or choose All."
    );
  } else if (list.length && !el.listMsg.classList.contains("msg-error")) {
    showMessage("");
  }

  if (allOrders.length === MAX_ORDERS) {
    toast(`Showing the latest ${MAX_ORDERS} orders. Narrow the dates to see others.`);
  }
}

/* ---------- Actions: complete / delete ---------- */
el.orders.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const id = btn.closest(".order").dataset.id;
  const order = allOrders.find((o) => o.id === id);
  if (!order) return;

  btn.disabled = true;
  try {
    if (btn.dataset.action === "toggle") {
      const next = order.status === "COMPLETED" ? "NOT COMPLETED" : "COMPLETED";
      await updateDoc(doc(db, "orders", id), { status: next });
      order.status = next;
      toast(next === "COMPLETED" ? "Marked as completed" : "Marked as not completed");
      render();
      // keep the order open after re-render
      el.orders.querySelector(`[data-id="${CSS.escape(id)}"]`)?.setAttribute("open", "");
    } else if (btn.dataset.action === "delete") {
      if (!confirm(`Delete the order from ${order.name || "this customer"}? This can't be undone.`)) {
        btn.disabled = false;
        return;
      }
      await deleteDoc(doc(db, "orders", id));
      allOrders = allOrders.filter((o) => o.id !== id);
      toast("Order deleted");
      render();
    }
  } catch (err) {
    console.error(err);
    toast("Couldn't update the order. Try again.");
    btn.disabled = false;
  }
});