
  import {
    getFirestore,
    collection,
    doc,
    runTransaction,
    serverTimestamp
  } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

  import { app, auth } from "./auth.js";

  const db = getFirestore(app);

  // Every order gets the next number: 051026-1, 051026-2, 051026-3 ...
  const ORDER_PREFIX = "051026-";

  window.CJSaveOrder = async function (order) {
    await auth.authStateReady();

    const user = auth.currentUser;

    if (!user) {
      throw new Error("Please log in before ordering.");
    }

    // Refresh the user's profile from Firebase.
    await user.reload();

    // Check the latest email verification status.
    if (!user.emailVerified) {
      throw new Error(
        "Your email is not verified yet. Please verify your email before ordering."
      );
    }

    // Refresh the ID token so Firestore receives the latest claims.
    const token = await user.getIdTokenResult(true);

    if (token.claims.email_verified !== true) {
      throw new Error(
        "Your verification status has not updated yet. Please sign out, log in again, and retry your order."
      );
    }

    // Take the next order number and save the order in ONE transaction,
    // so two customers can never get the same number.
    const counterRef = doc(db, "counters", "orders");
    const orderRef = doc(collection(db, "orders"));

    const result = await runTransaction(db, async (tx) => {
      const snap = await tx.get(counterRef);
      const next = (snap.exists() ? Number(snap.data().last) || 0 : 0) + 1;
      const orderNo = ORDER_PREFIX + next;

      tx.set(counterRef, { last: next });
      tx.set(orderRef, {
        uid: user.uid,
        email: user.email,
        name: order.name,
        phone: order.phone,
        social: order.social,
        address: order.address,
        items: order.items,
        total: order.total,
        status: "NOT COMPLETED",
        note: "",
        orderNo: orderNo,
        orderSeq: next,
        createdAt: serverTimestamp()
      });
      return { id: orderRef.id, orderNo: orderNo };
    });

    return result;
  };
