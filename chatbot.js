/* CJ Finds - chat icon + keyword chatbot.
   You normally DON'T edit this file. Edit chat-faq.js (answers) and products.js (products).
   Load order on every page (already done): products.js, chat-faq.js, chatbot.js */
   (function () {
    "use strict";
  
    var CFG = window.CJ_CHAT;
    var P = window.CJ_PRODUCTS;
    if (!CFG || !P) { return; }
  
    var STORE = CFG.STORE || {};
    var PRODUCT_PAGE = "product.html";
    var PAGES = { women: "women.html", men: "men.html", accessories: "accessories.html" };
  
    /* ---------- Words the bot understands for filtering products ---------- */
    var CAT_WORDS = {
      women: ["women", "woman", "womens", "ladies", "lady", "girl", "girls", "female", "her", "dress", "dresses", "skirt", "skirts", "blouse", "knit"],
      men: ["men", "man", "mens", "guys", "guy", "male", "boys", "gentleman", "him", "oxford", "chino", "chinos", "jersey", "shorts"],
      accessories: ["accessories", "accessory", "bag", "bags", "tote", "crossbody", "belt", "belts", "scarf", "scarves", "cap", "caps", "handbag", "purse", "gym bag"]
    };
    var TYPE_WORDS = {
      casual: ["casual", "everyday wear", "relaxed", "chill", "lounge"],
      formal: ["formal", "office", "work", "dressy", "elegant", "business", "interview", "party"],
      sports: ["sports", "sport", "gym", "workout", "athletic", "training", "running", "exercise", "fitness"]
    };
    var SIZE_WORDS = {
      S: ["small", "size s", "size small"],
      XL: ["xl", "extra large", "size xl"],
      XXL: ["xxl", "double xl", "double extra large", "size xxl"],
      OS: ["one size", "free size", "onesize"]
    };
    var CHEAP_WORDS = ["cheapest", "cheap", "lowest price", "least expensive", "most affordable", "affordable", "budget friendly", "lowest"];
    var PRICEY_WORDS = ["most expensive", "priciest", "highest price", "expensive", "premium", "highest"];
  
    /* Words from product names that are too general to identify one product */
    var GENERIC = ["bag", "set", "top", "pants", "tee", "track", "sport", "active", "casual", "formal", "gym"];
  
    /* ---------- Helpers ---------- */
    function norm(t) {
      return String(t).toLowerCase().replace(/['’`]/g, "").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
    }
    function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  
    var reCache = {};
    function has(n, kw) {
      var k = norm(kw);
      if (!k) { return false; }
      var re = reCache[k] || (reCache[k] = new RegExp("(^| )" + escRe(k) + "(s|es)?( |$)"));
      return re.test(n);
    }
    function anyOf(n, list) { return list.some(function (w) { return has(n, w); }); }
    function wordCount(s) { return norm(s).split(" ").length; }
  
    function money(v) { return "₱" + Number(v).toLocaleString("en-PH"); }
    function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
    function esc(s) {
      return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
  
    /* Product name as a link to its page (front + back view): product.html?id=... */
    function productLink(p) {
      return "[**" + p.name + "**](" + PRODUCT_PAGE + "?id=" + encodeURIComponent(p.id) + ")";
    }
    function line(p) {
      return "• " + productLink(p) + " — " + money(p.price) + " · " + P.categoryName(p.category) + " · " + cap(p.type) + " · " + P.sizeName(p.size) + (p.sold ? " · SOLD" : "");
    }
    function range() {
      var prices = P.list.map(function (p) { return p.price; });
      return { min: Math.min.apply(null, prices), max: Math.max.apply(null, prices) };
    }
    function prices() {
      var seen = {};
      return P.list.map(function (p) { return p.price; }).filter(function (v) { return seen[v] ? false : (seen[v] = true); })
        .sort(function (a, b) { return a - b; });
    }
    function count(cat) { return P.inCategory(cat).length; }
    function sizes() {
      var order = ["S", "XL", "XXL", "OS"], map = {};
      P.list.forEach(function (p) { map[p.size] = (map[p.size] || 0) + 1; });
      return Object.keys(map).sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); })
        .map(function (k) { return { code: k, name: P.sizeName(k), count: map[k] }; });
    }
  
    var H = { cfg: CFG, STORE: STORE, P: P, list: P.list, money: money, line: line, range: range, prices: prices, count: count, sizes: sizes };
  
    /* ---------- Product matching ---------- */
    function nameTokens(p) {
      return norm(p.name).split(" ").filter(function (t) { return t.length >= 3 && GENERIC.indexOf(t) === -1; });
    }
  
    function findProducts(n) {
      var strong = [], weak = [], best = 0;
      P.list.forEach(function (p) {
        var toks = nameTokens(p);
        var hit = toks.filter(function (t) { return has(n, t); }).length;
        if (!hit) { return; }
        if (hit === toks.length && toks.length >= 2) { strong.push(p); }
        else { weak.push({ p: p, hit: hit }); if (hit > best) { best = hit; } }
      });
      var top = weak.filter(function (w) { return w.hit === best; }).map(function (w) { return w.p; });
      if (top.length > 3) { top = []; }
      return { strong: strong, weak: top };
    }
  
    function detail(p) {
      return productLink(p) + " — " + money(p.price) + "\n" +
        P.categoryName(p.category) + " · " + cap(p.type) + " · Size " + P.sizeName(p.size) + "\n" +
        (p.description ? p.description + "\n" : "") +
        "Find it in [" + P.categoryName(p.category) + "](" + PAGES[p.category] + ").";
    }
  
    function upsell(items) {
      if (!items.length || items.some(function (p) { return p.category === "accessories"; })) { return ""; }
      var acc = P.inCategory("accessories").slice().sort(function (a, b) { return a.price - b.price; })[0];
      if (!acc) { return ""; }
      return "\n\n💡 Complete the look with the **" + acc.name + "** for just " + money(acc.price) + ".";
    }
  
    function productDetailReply(items) {
      var text = items.slice(0, 3).map(detail).join("\n\n") + "\n\n" + (STORE.scarcity || "") + upsell(items);
      return { text: text.trim() };
    }
  
    /* ---------- Filters (category / style / size / price) ---------- */
    function parsePrice(n) {
      var cleaned = n.replace(/size \d+/g, " ");
      var m = cleaned.match(/(^| )(\d{2,5})( |$)/);
      if (!m) { return null; }
      var dir = "eq";
      if (/(^| )(under|below|less than|lower than|cheaper than|within|max|maximum|up to|not more than|budget|at most|not over|beneath)( |$)/.test(cleaned)) { dir = "max"; }
      else if (/(^| )(above|over|more than|higher than|at least|min|minimum|beyond|starting|from)( |$)/.test(cleaned)) { dir = "min"; }
      return { v: parseInt(m[2], 10), dir: dir };
    }
  
    function getFilters(n) {
      var f = { cats: [], types: [], sizes: [], price: parsePrice(n), sort: null };
      Object.keys(CAT_WORDS).forEach(function (k) { if (anyOf(n, CAT_WORDS[k])) { f.cats.push(k); } });
      Object.keys(TYPE_WORDS).forEach(function (k) { if (anyOf(n, TYPE_WORDS[k])) { f.types.push(k); } });
      Object.keys(SIZE_WORDS).forEach(function (k) { if (anyOf(n, SIZE_WORDS[k])) { f.sizes.push(k); } });
      if (anyOf(n, PRICEY_WORDS)) { f.sort = "desc"; }
      else if (anyOf(n, CHEAP_WORDS)) { f.sort = "asc"; }
      f.any = !!(f.cats.length || f.types.length || f.sizes.length || f.price || f.sort);
      return f;
    }
  
    function filterReply(f) {
      var base = P.list.filter(function (p) {
        return (!f.cats.length || f.cats.indexOf(p.category) > -1) &&
               (!f.types.length || f.types.indexOf(p.type) > -1) &&
               (!f.sizes.length || f.sizes.indexOf(p.size) > -1);
      });
      var r = range(), items = base, intro = "";
  
      if (f.price) {
        var v = f.price.v;
        if (f.price.dir === "max") { items = base.filter(function (p) { return p.price <= v; }); intro = "Here's what we have at " + money(v) + " and below:"; }
        else if (f.price.dir === "min") { items = base.filter(function (p) { return p.price >= v; }); intro = "Here's what we have at " + money(v) + " and above:"; }
        else {
          items = base.filter(function (p) { return p.price === v; });
          intro = "Here's what we have at " + money(v) + ":";
          if (!items.length && base.length) {
            var near = Math.min.apply(null, base.map(function (p) { return Math.abs(p.price - v); }));
            items = base.filter(function (p) { return Math.abs(p.price - v) === near; });
            intro = "Nothing at exactly " + money(v) + ", but the closest are:";
          }
        }
        if (!items.length) {
          return { text: "I couldn't find a match for that. Our finds range from " + money(r.min) + " to " + money(r.max) + ". Try a different budget or ask for another category.", chips: true };
        }
      } else if (f.sort) {
        intro = f.sort === "asc" ? "Our most affordable finds:" : "Our top-priced finds:";
      } else {
        var label = [];
        if (f.types.length) { label.push(f.types.map(cap).join("/")); }
        if (f.sizes.length) { label.push(f.sizes.map(function (s) { return P.sizeName(s); }).join("/") + " size"); }
        if (f.cats.length) { label.push(f.cats.map(P.categoryName).join(" & ")); }
        intro = "Here are our " + label.join(" · ") + " finds:";
      }
  
      if (!items.length) {
        return { text: "I couldn't find a match for that right now. Browse [Women](women.html), [Men](men.html), or [Accessories](accessories.html) to see everything.", chips: true };
      }
  
      items = items.slice();
      if (f.sort) { items.sort(function (a, b) { return f.sort === "asc" ? a.price - b.price : b.price - a.price; }); }
      var total = items.length, shown = items.slice(0, 6);
      var text = intro + "\n" + shown.map(line).join("\n");
      var cats = [];
      shown.forEach(function (p) { if (cats.indexOf(p.category) === -1) { cats.push(p.category); } });
      if (total > shown.length) { text += "\n…and " + (total - shown.length) + " more."; }
      text += "\nSee them in " + cats.map(function (c) { return "[" + P.categoryName(c) + "](" + PAGES[c] + ")"; }).join(" · ") + ".";
      text += upsell(shown);
      return { text: text };
    }
  
    /* ---------- FAQ matching ---------- */
    function bestFaq(n) {
      var best = null, bestScore = 0;
      CFG.faqs.forEach(function (faq) {
        var s = 0;
        faq.keywords.forEach(function (kw) { if (has(n, kw)) { s += wordCount(kw); } });
        if (faq.priority) { s *= 3; }
        if (s > bestScore) { best = faq; bestScore = s; }
      });
      return { faq: best, score: bestScore };
    }
  
    function faqReply(faq) {
      var a = typeof faq.answer === "function" ? faq.answer(H) : faq.answer;
      a = String(a);
      var chips = faq.chips === true ? CFG.suggestions : (faq.chips || null);
      return { text: a, chips: chips };
    }
  
    /* ---------- THE BRAIN: picks the reply for one question ---------- */
    function answer(question) {
      var n = norm(question);
      if (!n) { return { text: CFG.fallback, chips: CFG.suggestions }; }
  
      var prod = findProducts(n);
      if (prod.strong.length) { return productDetailReply(prod.strong); }
  
      var faq = bestFaq(n);
      if (faq.faq && faq.score >= 3) { return faqReply(faq.faq); }
  
      if (prod.weak.length) { return productDetailReply(prod.weak); }
  
      var f = getFilters(n);
      if (f.any) { return filterReply(f); }
  
      if (faq.faq) { return faqReply(faq.faq); }
  
      return { text: CFG.fallback, chips: CFG.suggestions };
    }
  
    window.CJ_CHAT_ENGINE = { answer: answer, norm: norm };
  
    if (typeof document === "undefined" || !document.body) { return; }
  
    /* ================= CHAT WINDOW (the icon and panel) ================= */
    var STORAGE = "cjfinds_chat";
    var RETURN_KEY = "cjfinds_chat_return";   /* page + scroll position to come back to */
    var REOPEN_KEY = "cjfinds_chat_reopen";   /* set by "Back to chat" so the chat opens again */
    var onProductPage = !!document.getElementById("product-root");
  
    var css = [
      ".cj-chat-btn{position:fixed;left:max(18px,env(safe-area-inset-left,0px));bottom:calc(max(18px,env(safe-area-inset-bottom,0px)) + 70px);z-index:41;",
      "width:58px;height:58px;border-radius:50%;display:grid;place-items:center;cursor:pointer;padding:0;",
      "background:var(--warm-white,#fffdfa);color:var(--sage-dark,#783b50);border:2px solid var(--sage,#b47d85);",
      "box-shadow:0 10px 26px rgba(120,59,80,.28);transition:transform .2s,background .2s;-webkit-tap-highlight-color:transparent}",
      ".cj-back-chat{position:sticky;top:10px;z-index:30;display:inline-flex;align-items:center;gap:8px;min-height:44px;margin:6px 0 10px;padding:0 18px;border-radius:999px;cursor:pointer;",
      "background:var(--warm-white,#fffdfa);color:var(--sage-dark,#783b50);border:1px solid var(--sage,#b47d85);box-shadow:0 6px 18px rgba(120,59,80,.18);font:700 13px 'DM Sans',system-ui,sans-serif}",
      ".cj-back-chat:hover{background:#f7e8ec}.cj-back-chat:focus-visible{outline:2px solid var(--sage-dark,#783b50);outline-offset:3px}",
      ".cj-chat-btn:hover{transform:translateY(-2px);background:#f7e8ec}",
      ".cj-chat-btn:focus-visible{outline:2px solid var(--sage-dark,#783b50);outline-offset:4px}",
      ".cj-chat-btn svg{width:26px;height:26px;display:block}",
      ".cj-chat-panel{position:fixed;left:max(18px,env(safe-area-inset-left,0px));bottom:calc(max(18px,env(safe-area-inset-bottom,0px)) + 140px);z-index:42;",
      "width:min(360px,calc(100vw - 28px));height:min(500px,calc(100vh - 180px));display:flex;flex-direction:column;overflow:hidden;",
      "background:var(--warm-white,#fffdfa);border-radius:20px;border:1px solid rgba(180,125,133,.35);box-shadow:0 18px 50px rgba(120,59,80,.28);",
      "font-family:'DM Sans',system-ui,sans-serif;font-size:14px;color:#3b2a30;animation:cj-chat-in .22s ease}",
      ".cj-chat-panel:focus{outline:none}.cj-chat-panel[hidden]{display:none}",
      "@keyframes cj-chat-in{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}",
      ".cj-chat-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 16px;background:var(--sage-dark,#783b50);color:#fffdfa}",
      ".cj-chat-head strong{display:block;font-size:15px}.cj-chat-head span{font-size:12px;opacity:.85}",
      ".cj-chat-close{background:none;border:0;color:inherit;font-size:24px;line-height:1;cursor:pointer;padding:2px 6px;border-radius:8px}",
      ".cj-chat-close:hover{background:rgba(255,255,255,.18)}",
      ".cj-chat-log{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:14px;display:flex;flex-direction:column;gap:10px;scroll-behavior:smooth}",
      ".cj-msg{max-width:86%;padding:10px 13px;border-radius:16px;line-height:1.45;word-wrap:break-word;overflow-wrap:anywhere}",
      ".cj-msg a{color:inherit;font-weight:700;text-decoration:underline}",
      ".cj-msg.bot{align-self:flex-start;background:#f7e8ec;border-bottom-left-radius:5px}",
      ".cj-msg.user{align-self:flex-end;background:var(--sage-dark,#783b50);color:#fffdfa;border-bottom-right-radius:5px}",
      ".cj-chips{display:flex;flex-wrap:wrap;gap:6px;align-self:flex-start;max-width:100%}",
      ".cj-chip{background:#fffdfa;border:1px solid var(--sage,#b47d85);color:var(--sage-dark,#783b50);border-radius:999px;padding:6px 11px;font:inherit;font-size:12.5px;cursor:pointer;text-align:left}",
      ".cj-chip:hover{background:#f7e8ec}",
      ".cj-typing{display:inline-flex;gap:4px;padding:2px 0}.cj-typing i{width:6px;height:6px;border-radius:50%;background:#b47d85;animation:cj-dot 1s infinite}",
      ".cj-typing i:nth-child(2){animation-delay:.15s}.cj-typing i:nth-child(3){animation-delay:.3s}",
      "@keyframes cj-dot{0%,60%,100%{opacity:.25;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}",
      ".cj-chat-form{display:flex;gap:8px;padding:10px;border-top:1px solid rgba(180,125,133,.25);background:#fffdfa}",
      ".cj-chat-form input{flex:1;min-width:0;border:1px solid rgba(180,125,133,.55);border-radius:999px;padding:10px 14px;font:inherit;background:#fff;color:inherit}",
      ".cj-chat-form input:focus{outline:2px solid var(--sage-dark,#783b50);outline-offset:1px}",
      ".cj-chat-form button{border:0;border-radius:999px;padding:0 16px;background:var(--sage-dark,#783b50);color:#fffdfa;font:inherit;font-weight:700;cursor:pointer}",
      ".cj-chat-form button:hover{background:#5d293e}",
      "@media (max-width:600px){.cj-chat-btn{width:52px;height:52px;left:max(14px,env(safe-area-inset-left,0px));bottom:calc(max(14px,env(safe-area-inset-bottom,0px)) + 64px)}}",
      "@media (max-width:600px),(max-height:500px){",
      ".cj-chat-panel{top:0;left:0;right:0;bottom:auto;width:100%;max-width:100%;height:100vh;height:100dvh;max-height:none;border:0;border-radius:0;box-shadow:none;animation:none}",
      ".cj-chat-head{padding:max(14px,env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) 14px max(16px,env(safe-area-inset-left,0px))}",
      ".cj-chat-close{font-size:30px;min-width:44px;min-height:44px}",
      ".cj-chat-form{padding:10px max(10px,env(safe-area-inset-right,0px)) max(10px,env(safe-area-inset-bottom,0px)) max(10px,env(safe-area-inset-left,0px))}",
      ".cj-chat-form input{font-size:16px}.cj-chat-form button{min-height:44px}}",
      "@media (prefers-reduced-motion:reduce){.cj-chat-panel{animation:none}.cj-typing i{animation:none}.cj-chat-log{scroll-behavior:auto}}"
    ].join("");
  
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cj-chat-btn";
    btn.setAttribute("aria-label", "Open chat");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.5L3 20.5l1.6-5A8.5 8.5 0 1 1 21 11.5z"/><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01"/></svg>';
  
    var panel = document.createElement("div");
    panel.className = "cj-chat-panel";
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "CJ Finds chat assistant");
    panel.setAttribute("tabindex", "-1");
    panel.innerHTML =
      '<div class="cj-chat-head"><div><strong>CJ Finds Assistant</strong><span>Ask about products, prices &amp; orders</span></div>' +
      '<button type="button" class="cj-chat-close" aria-label="Close chat">×</button></div>' +
      '<div class="cj-chat-log" aria-live="polite"></div>' +
      '<form class="cj-chat-form" autocomplete="off"><input type="text" maxlength="200" placeholder="Type your question…" aria-label="Type your question">' +
      '<button type="submit">Send</button></form>';
  
    document.body.appendChild(panel);
    document.body.appendChild(btn);
  
    var log = panel.querySelector(".cj-chat-log");
    var form = panel.querySelector("form");
    var input = panel.querySelector("input");
    var history = [];
    var isOpen = false;

    /* ---------- Phones: full-screen chat, page behind is locked ---------- */
    var MOBILE = window.matchMedia ? window.matchMedia("(max-width:600px),(max-height:500px)") : null;
    var locked = false, lockY = 0;
    function isMobile() { return !!(MOBILE && MOBILE.matches); }

    function lockPage() {
      if (locked) { return; }
      lockY = window.pageYOffset || document.documentElement.scrollTop || 0;
      var b = document.body.style;
      b.position = "fixed"; b.top = "-" + lockY + "px"; b.left = "0"; b.right = "0"; b.width = "100%";
      document.documentElement.style.overscrollBehavior = "none";
      locked = true;
    }
    function unlockPage() {
      if (!locked) { return; }
      var b = document.body.style;
      b.position = ""; b.top = ""; b.left = ""; b.right = ""; b.width = "";
      document.documentElement.style.overscrollBehavior = "";
      locked = false;
      var root = document.documentElement;
      root.style.scrollBehavior = "auto";      /* jump back instantly, no smooth scroll */
      window.scrollTo(0, lockY);
      root.style.scrollBehavior = "";
    }
    /* Keeps the chat exactly the size of the visible screen, even when the phone keyboard is open */
    function fitToViewport() {
      var vv = window.visualViewport;
      if (!isOpen || !isMobile() || !vv) { panel.style.height = ""; panel.style.top = ""; return; }
      panel.style.height = vv.height + "px";
      panel.style.top = vv.offsetTop + "px";
      scrollDown();
    }
    function syncLayout() {
      if (isOpen && isMobile()) { lockPage(); } else { unlockPage(); }
      fitToViewport();
    }
  
    /* Safe text formatting: **bold**, *italic*, [link](page.html), line breaks */
    function fmt(text) {
      var s = esc(text);
      s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      s = s.replace(/\*(.+?)\*/g, "<em>$1</em>");
      s = s.replace(/\[([^\]]+)\]\(([A-Za-z0-9_\-./#?=&;]+)\)/g, '<a href="$2">$1</a>');
      return s.replace(/\n/g, "<br>");
    }
  
    function save() {
      try { sessionStorage.setItem(STORAGE, JSON.stringify({ open: isOpen, msgs: history.slice(-40) })); } catch (e) {}
    }
  
    function scrollDown() { log.scrollTop = log.scrollHeight; }
  
    function addMsg(from, text, remember) {
      var d = document.createElement("div");
      d.className = "cj-msg " + from;
      if (from === "user") { d.textContent = text; } else { d.innerHTML = fmt(text); }
      log.appendChild(d);
      if (remember !== false) { history.push({ from: from, text: text }); save(); }
      scrollDown();
      return d;
    }
  
    function addChips(list) {
      if (!list || !list.length) { return; }
      var wrap = document.createElement("div");
      wrap.className = "cj-chips";
      list.forEach(function (q) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "cj-chip";
        b.textContent = q;
        b.addEventListener("click", function () { wrap.remove(); ask(q); });
        wrap.appendChild(b);
      });
      log.appendChild(wrap);
      scrollDown();
    }
  
    /* Replies with no suggested questions get a "Menu" button that shows the list of questions to pick from */
    var MENU_CHIP = ["Menu"];

    function ask(question) {
      var q = String(question).trim().slice(0, 200);
      if (!q) { return; }
      log.querySelectorAll(".cj-chips").forEach(function (c) { c.remove(); });
      addMsg("user", q);
  
      var typing = document.createElement("div");
      typing.className = "cj-msg bot";
      typing.innerHTML = '<span class="cj-typing"><i></i><i></i><i></i></span>';
      log.appendChild(typing);
      scrollDown();
  
      var reply = answer(q);
      window.setTimeout(function () {
        typing.remove();
        addMsg("bot", reply.text);
        var chips = reply.chips === true ? CFG.suggestions : reply.chips;
        addChips(chips && chips.length ? chips : MENU_CHIP);
      }, 450);
    }
  
    function setOpen(open, focus) {
      isOpen = open;
      panel.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Close chat" : "Open chat");
      if (open && !log.children.length) {
        addMsg("bot", CFG.greeting);
        addChips(CFG.suggestions);
      }
      syncLayout();
      if (open) {
        scrollDown();
        /* On phones don't pop the keyboard open automatically; it would cover the chat. */
        if (isMobile()) { panel.focus({ preventScroll: true }); }
        else if (focus !== false) { input.focus(); }
      }
      save();
    }
  
    if (MOBILE) {
      if (MOBILE.addEventListener) { MOBILE.addEventListener("change", syncLayout); }
      else if (MOBILE.addListener) { MOBILE.addListener(syncLayout); }
    }
    window.addEventListener("resize", syncLayout);
    window.addEventListener("orientationchange", syncLayout);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", fitToViewport);
      window.visualViewport.addEventListener("scroll", fitToViewport);
    }
    /* While the chat is open on a phone, touches only scroll the message list */
    document.addEventListener("touchmove", function (e) {
      if (locked && !log.contains(e.target)) { e.preventDefault(); }
    }, { passive: false });

    log.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a");
      if (!a || (a.getAttribute("href") || "").indexOf(PRODUCT_PAGE + "?") !== 0) { return; }
      try {
        /* keep the ORIGINAL page if the customer is already on a product page */
        if (!sessionStorage.getItem(RETURN_KEY) || !onProductPage) {
          sessionStorage.setItem(RETURN_KEY, JSON.stringify({ url: location.href, y: locked ? lockY : (window.pageYOffset || 0) }));
        }
      } catch (err) {}
      save();
    });

    btn.addEventListener("click", function () { setOpen(!isOpen); });
    panel.querySelector(".cj-chat-close").addEventListener("click", function () { setOpen(false); btn.focus(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && isOpen) { setOpen(false); btn.focus(); } });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = input.value;
      input.value = "";
      ask(v);
    });
        /* The chat is always CLOSED when a page loads. A refresh starts a brand-new chat. */
  try {
    var nav = performance.getEntriesByType("navigation")[0];
    if (nav && nav.type === "reload") { sessionStorage.removeItem(STORAGE); }
    var saved = JSON.parse(sessionStorage.getItem(STORAGE) || "null");
    if (saved && saved.msgs && saved.msgs.length) {
      history = saved.msgs;
      history.forEach(function (m) { addMsg(m.from, m.text, false); });
      addChips(MENU_CHIP);   /* chat restored (e.g. coming back from a product page): offer the Menu */
    }
  } catch (e) {}

  /* ---------- Product page <-> chat ---------- */
  var ret = null, reopen = false;
  try {
    ret = JSON.parse(sessionStorage.getItem(RETURN_KEY) || "null");
    reopen = sessionStorage.getItem(REOPEN_KEY) === "1";
    sessionStorage.removeItem(REOPEN_KEY);
  } catch (e) {}

  if (onProductPage) {
    /* "Back to chat" button: only when the customer arrived from a chat link */
    if (ret && ret.url) {
      var back = document.createElement("button");
      back.type = "button";
      back.className = "cj-back-chat";
      back.innerHTML = '<span aria-hidden="true">←</span> Back to chat';
      var host = document.querySelector("main") || document.body;
      host.insertBefore(back, host.firstChild);
      var goBack = function () {
        try {
          if (new URL(ret.url, location.href).origin !== location.origin) { return; }
          sessionStorage.setItem(REOPEN_KEY, "1");
        } catch (e) { return; }
        location.href = ret.url;
      };
      back.addEventListener("click", goBack);
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && !isOpen && !document.body.classList.contains("lb-open")) { goBack(); }
      }, true);   /* capture: runs before the chat's own Escape handler closes it */
    }
  } else {
    var navType = "";
    try { navType = performance.getEntriesByType("navigation")[0].type; } catch (e) {}
    if (ret && (reopen || navType === "back_forward")) {
      var restore = function () {
        if (typeof ret.y === "number") {
          var root = document.documentElement;
          root.style.scrollBehavior = "auto";
          window.scrollTo(0, ret.y);
          root.style.scrollBehavior = "";
        }
        setOpen(true, false);
      };
      if (document.readyState === "complete") { restore(); } else { window.addEventListener("load", restore); }
    }
    try { sessionStorage.removeItem(RETURN_KEY); } catch (e) {}
  }
})();
  
