
  import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp
  } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

  import { app, auth } from "./auth.js";

  const db = getFirestore(app);

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

    // Save the order only after verification succeeds.
    return addDoc(collection(db, "orders"), {
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
      createdAt: serverTimestamp()
    });
  };
