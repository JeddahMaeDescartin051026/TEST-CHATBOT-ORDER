/* CJ Finds - account page: create account, log in, verify email. */
import {
    auth, signUp, logIn, logOut, resendVerification,
    checkVerified, resetPassword, watchAuth, authMessage
  } from "./auth.js";
  
  var $ = function (s) { return document.querySelector(s); };
  
  /* Where to go after verifying (only plain page names, never other websites) */
  var params = new URLSearchParams(location.search);
  var rawNext = params.get("next") || "";
  var NEXT = /^[a-z0-9_-]+\.html(#[\w-]+)?$/i.test(rawNext) ? rawNext : "index.html";
  var cameFromCheckout = params.has("next");
  
  var mode = "signup";
  var cooldownTimer = null;
  var redirecting = false;
  
  function say(text, kind) {
    var m = $("#msg");
    m.textContent = text || "";
    m.className = "auth-message" + (kind ? " is-" + kind : "");
  }
  
  function showPanel(name) {
    ["form", "verify", "done"].forEach(function (p) { $("#panel-" + p).hidden = p !== name; });
  }
  
  function setMode(next) {
    mode = next;
    document.querySelectorAll(".auth-tab").forEach(function (t) {
      t.classList.toggle("active", t.dataset.mode === mode);
    });
    var signup = mode === "signup";
    $("#form-title").textContent = signup ? "Create your account" : "Welcome back";
    $("#form-lead").textContent = signup
      ? "Verify your email once, then shop and order with us."
      : "Log in to continue to checkout.";
    $("#submit").textContent = signup ? "Create account" : "Log in";
    $("#password").autocomplete = signup ? "new-password" : "current-password";
    $("#forgot").hidden = signup;
    say("");
  }
  
  /* Decide which panel to show for the current user */
  function render(user) {
    if (!user) { showPanel("form"); return; }
    if (user.emailVerified) {
      $("#done-email").textContent = user.email;
      $("#btn-continue").href = NEXT;
      $("#btn-continue").textContent = cameFromCheckout ? "Continue to checkout" : "Continue shopping";
      showPanel("done");
      if (cameFromCheckout && !redirecting) {
        redirecting = true;
        setTimeout(function () { location.href = NEXT; }, 900);
      }
    } else {
      $("#verify-email").textContent = user.email;
      showPanel("verify");
    }
  }
  
  /* ---------- Form ---------- */
  document.querySelectorAll(".auth-tab").forEach(function (t) {
    t.addEventListener("click", function () { setMode(t.dataset.mode); });
  });
  
  $("#auth-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    var email = $("#email").value.trim();
    var password = $("#password").value;
    if (!email || !password) { say("Please fill in your email and password.", "error"); return; }
  
    var btn = $("#submit");
    btn.disabled = true;
    say(mode === "signup" ? "Creating your account…" : "Logging you in…");
    try {
      if (mode === "signup") {
        await signUp(email, password);
        say("Account created! We sent you a verification email.", "ok");
        startCooldown();
      } else {
        await logIn(email, password);
        say("");
      }
      render(auth.currentUser);
    } catch (err) {
      say(authMessage(err), "error");
    } finally {
      btn.disabled = false;
    }
  });
  
  $("#forgot").addEventListener("click", async function () {
    var email = $("#email").value.trim();
    if (!email) { say("Type your email above first, then tap “Forgot your password?”.", "error"); return; }
    try {
      await resetPassword(email);
      say("If that email has an account, a reset link is on its way.", "ok");
    } catch (err) {
      say(authMessage(err), "error");
    }
  });
  
  /* ---------- Verify panel ---------- */
  async function confirmVerified(quiet) {
    try {
      var ok = await checkVerified();
      if (ok) { say("Email verified. Thank you!", "ok"); render(auth.currentUser); }
      else if (!quiet) say("Not verified yet. Open the link in your email, then try again.", "error");
    } catch (err) {
      if (!quiet) say(authMessage(err), "error");
    }
  }
  $("#btn-verified").addEventListener("click", function () { confirmVerified(false); });
  
  function startCooldown() {
    var btn = $("#btn-resend");
    var left = 60;
    clearInterval(cooldownTimer);
    btn.disabled = true;
    btn.textContent = "Resend email (" + left + "s)";
    cooldownTimer = setInterval(function () {
      left -= 1;
      if (left <= 0) {
        clearInterval(cooldownTimer);
        btn.disabled = false;
        btn.textContent = "Resend email";
      } else {
        btn.textContent = "Resend email (" + left + "s)";
      }
    }, 1000);
  }
  $("#btn-resend").addEventListener("click", async function () {
    try {
      await resendVerification();
      say("Verification email sent again. Check your inbox and spam folder.", "ok");
      startCooldown();
    } catch (err) {
      say(authMessage(err), "error");
    }
  });
  
  $("#btn-switch").addEventListener("click", async function () { await logOut(); say(""); setMode("signup"); });
  $("#btn-logout").addEventListener("click", async function () { await logOut(); redirecting = true; say("You’re logged out."); setMode("login"); });
  
  /* When the customer comes back from their email app/tab, check automatically */
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && auth.currentUser && !auth.currentUser.emailVerified) {
      confirmVerified(true);
    }
  });
  
  /* ---------- Header menu + footer year ---------- */
  var menuBtn = document.querySelector(".menu-toggle");
  if (menuBtn) menuBtn.addEventListener("click", function () {
    var panel = document.querySelector(".mobile-menu");
    var open = panel.hidden;
    panel.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  $("#year").textContent = new Date().getFullYear();
  
  /* ---------- Start ---------- */
  setMode("signup");
  watchAuth(function (s) { render(s.user); });