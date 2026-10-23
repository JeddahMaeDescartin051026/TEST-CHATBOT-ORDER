/* CJ Finds - only verified customers can check out.
   Add to index.html, women.html, men.html, accessories.html AND checkout.html, before </body>:
   <script type="module" src="checkout-gate.js"></script>

   - On shop pages: the "Continue to checkout" button sends logged-out or unverified
     customers to account.html first, then brings them back to checkout.
   - On checkout.html: anyone who is not logged in and verified is sent to account.html.
   - Adds a small account icon next to the heart in the header. */
   import { auth, checkVerified, watchAuth } from "./auth.js";

   var onCheckoutPage = /(^|\/)checkout(\.html)?$/.test(location.pathname);
   
   function goToAccount(next) {
     location.href = "account.html?next=" + encodeURIComponent(next);
   }
   
   async function isVerifiedNow() {
     await auth.authStateReady();
     var user = auth.currentUser;
     if (!user) return false;
     if (user.emailVerified) return true;
     try { return await checkVerified(); } catch (e) { return false; }
   }
   
   /* ---------- checkout.html guard ---------- */
   if (onCheckoutPage) {
     document.documentElement.style.visibility = "hidden";   // no flash of the form
     isVerifiedNow().then(function (ok) {
       if (ok) document.documentElement.style.visibility = "";
       else goToAccount("checkout.html");
     });
   }
   
   /* ---------- shop pages: intercept the checkout button ---------- */
   document.addEventListener("click", async function (e) {
     var btn = e.target.closest && e.target.closest(".checkout-button");
     if (!btn || btn.disabled || onCheckoutPage) return;
     e.preventDefault();
     e.stopImmediatePropagation();          // runs before shop.js / script.js
     if (await isVerifiedNow()) location.href = "checkout.html";
     else goToAccount("checkout.html");
   }, true);
   
   /* ---------- header account icon ---------- */
   var style = document.createElement("style");
   style.textContent =
     ".account-toggle{position:relative}" +
     ".account-toggle.is-verified::after{content:'';position:absolute;top:6px;right:6px;width:9px;height:9px;" +
     "border-radius:50%;background:#6fae8a;border:2px solid var(--warm-white,#fffdfa)}";
   document.head.appendChild(style);
   
   watchAuth(function (s) {
     var actions = document.querySelector(".header-actions");
     if (!actions) return;
     var link = actions.querySelector(".account-toggle");
     if (!link) {
       link = document.createElement("a");
       link.className = "icon-button account-toggle";
       link.href = "account.html";
       link.innerHTML =
         '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle>' +
         '<path d="M4 20.5c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"></path></svg>';
       var fav = actions.querySelector(".fav-toggle");
       actions.insertBefore(link, fav || null);
     }
     link.classList.toggle("is-verified", s.canShop);
     link.setAttribute("aria-label", s.canShop ? "Your account (verified)" : s.user ? "Verify your email" : "Log in or create an account");
   });