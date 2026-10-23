import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Shared by orders.js (checkout), my-orders.js and order-lookup.js (chatbot).

export const ORDER_PREFIX = "051026-";

// "051026-3": built from the order's number so it can't be faked
export const orderLabel = (o) =>
  o && o.orderSeq != null ? ORDER_PREFIX + o.orderSeq : (o && o.orderNo) || "";

export const AWAITING_TEXT =
  "Awaiting chat from our team. Please check your message request if you haven't got any message yet.";

export const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));

export const peso = (n) =>
  "₱" + Number(n || 0).toLocaleString("en-PH", { maximumFractionDigits: 2 });

// "The same item" = product id if the order saved one, otherwise the item name
export const itemKey = (it) =>
  it && typeof it === "object"
    ? String(it.id ?? it.productId ?? it.name ?? it.title ?? "").trim().toLowerCase()
    : String(it ?? "").trim().toLowerCase();

// Firestore document id for a sold item (the admin page uses the exact same rule)
export const soldDocId = (key) => "i_" + encodeURIComponent(key).slice(0, 400);

// Map of itemKey -> "mine" (sold through this order) | "other" (sold through a different order)
export async function getSoldMap(db, order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const keys = [...new Set(items.map(itemKey).filter(Boolean))];
  const map = new Map();
  await Promise.all(
    keys.map(async (k) => {
      try {
        const snap = await getDoc(doc(db, "soldItems", soldDocId(k)));
        if (snap.exists()) map.set(k, snap.data().orderId === order.id ? "mine" : "other");
      } catch (err) {
        // If it can't be read, treat the item as not sold
      }
    })
  );
  return map;
}

// What the customer should be told about an order
export function describeOrder(order, soldMap) {
  const items = Array.isArray(order.items) ? order.items : [];
  const states = items.map((it) => soldMap.get(itemKey(it)) || "available");
  const otherCount = states.filter((s) => s === "other").length;

  if (order.status === "COMPLETED") {
    return {
      kind: "done",
      title: "Order & Payment Completed",
      text:
        "Thank you for shopping with CJ Finds!" +
        (otherCount ? " Items marked SOLD were no longer available." : ""),
      states,
    };
  }
  if (items.length > 0 && otherCount === items.length) {
    return {
      kind: "sold",
      title: "Item Sold",
      text: "Sorry, the item(s) in this order were already sold to another customer.",
      states,
    };
  }
  if (otherCount > 0) {
    return {
      kind: "partial",
      title: "Some Items Sold",
      text:
        "The highlighted items are already sold. We'll chat you only about the items that are still available. Please check your message request if you haven't got any message yet.",
      states,
    };
  }
  return { kind: "pending", title: "Order Pending", text: AWAITING_TEXT, states };
}
