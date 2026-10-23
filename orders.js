import { doc, collection, getDoc, writeBatch, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { auth, db, isBlocked } from "./auth.js";

// Call from the checkout form instead of (or alongside) the Web3Forms post.
// order = { name, phone, social, address, items: [{name, price, quantity}], total }
// Throws Error with message: "not-verified" | "blocked" | "pending"
export async function submitOrder(order) {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) throw new Error("not-verified");
  if (await isBlocked(user)) throw new Error("blocked");
  if ((await getDoc(doc(db, "pending", user.uid))).exists()) throw new Error("pending");

  const orderRef = doc(collection(db, "orders"));
  const batch = writeBatch(db);
  batch.set(orderRef, {
    uid: user.uid,
    email: user.email,
    name: order.name,
    phone: order.phone,
    social: order.social,
    address: order.address,
    items: order.items,
    total: order.total,
    status: "NEW",
    createdAt: serverTimestamp()
  });
  batch.set(doc(db, "pending", user.uid), { orderId: orderRef.id, createdAt: serverTimestamp() });
  await batch.commit();
  return orderRef.id;
}

export const orderErrorMessage = (code) => ({
  "not-verified": "Please verify your email before sending an order request.",
  "blocked": "This account can't send order requests. Please message us on social media.",
  "pending": "You already have an order request being handled. We'll reach out on your social media soon."
}[code] || "We couldn't send your order request. Please try again.");