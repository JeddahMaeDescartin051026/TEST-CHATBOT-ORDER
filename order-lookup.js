// Loaded by chatbot.js only when a customer asks about an order.
import { app, auth } from "./auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  limit,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ORDER_PREFIX, peso, getSoldMap, describeOrder, orderLabel } from "./order-status.js";

const db = getFirestore(app);

// Matches 051026-1, 051026-12, "051026 - 3" ...
const ORDER_NO_RE = /\b051026\s*-\s*(\d{1,9})\b/i;

// Reply text uses the chatbot's own format: **bold**, [link](page.html), line breaks
function itemLines(order, info) {
  const items = Array.isArray(order.items) ? order.items : [];
  const lines = items.map((it, i) => {
    const o = it && typeof it === "object" ? it : { name: String(it) };
    const name = o.name || o.title || "Item";
    const qty = o.qty ?? o.quantity ?? 1;
    const price = Number(o.price);
    const amount = Number.isFinite(price) ? ` – ${peso(price * qty)}` : "";
    const base = `• ${name}${qty > 1 ? ` ×${qty}` : ""}${amount}`;
    const state = info.states[i];
    if (state === "other") return `${base} — **SOLD**`;
    if (state === "mine") return `${base} — ✓ Yours`;
    return base;
  });
  lines.push(`Total: **${peso(order.total)}**`);
  return lines.join("\n");
}

// Returns { text } for the chatbot to show. Only the logged-in owner can look up an order.
export async function getOrderReply(message) {
  const m = String(message || "").match(ORDER_NO_RE);
  if (!m) {
    return {
      text:
        `Please type your order number so I can check it, for example **${ORDER_PREFIX}1**. ` +
        `You'll see it right after you place your order, and in [My Orders](my-orders.html).`,
    };
  }
  const seq = Number(m[1]);
  const label = `${ORDER_PREFIX}${seq}`;

  try {
    if (auth.authStateReady) await auth.authStateReady();
    const user = auth.currentUser;
    if (!user || !user.emailVerified) {
      return {
        text: "Please [log in](account.html?next=index.html) with your verified account so I can look up your order.",
      };
    }

    const snap = await getDocs(
      query(
        collection(db, "orders"),
        where("uid", "==", user.uid),
        where("orderSeq", "==", seq),
        limit(1)
      )
    );
    if (snap.empty) {
      return { text: `I couldn't find order **${label}** under your account. Please double-check the number.` };
    }

    const order = { id: snap.docs[0].id, ...snap.docs[0].data() };
    const info = describeOrder(order, await getSoldMap(db, order));

    // Still waiting and nothing sold: just the awaiting message
    if (info.kind === "pending") {
      return { text: `**Order ${orderLabel(order)}**\n${info.text}` };
    }

    return {
      text: `**Order ${orderLabel(order)}**\n**${info.title}**\n${info.text}\n\n${itemLines(order, info)}`,
    };
  } catch (err) {
    console.error(err);
    return { text: "Sorry, I couldn't check that right now. Please try again in a moment." };
  }
}
