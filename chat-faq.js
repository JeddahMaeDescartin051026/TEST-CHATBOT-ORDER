/* CJ Finds - CHATBOT CONTENT. This is the file you edit to change what the chatbot says.
   (Product answers come from products.js automatically. You never type products here.)

   HOW IT WORKS
   1. The customer types a question.
   2. The bot looks for KEYWORDS from the list below in the question.
   3. The FAQ with the most keyword matches is the answer.
   4. If nothing matches, the bot says the "fallback" message.

   TO ADD A QUESTION: copy one block inside FAQS, then change keywords and answer.
   keywords   words or phrases a customer might type, ALL lowercase, no punctuation (use "pre loved", not "pre-loved")
              Plural forms (bag / bags) match automatically.
   answer     the reply. Use \n for a new line, **bold**, and [link text](page.html) for links.
              An answer can also be a function for live product data.
   priority   true = important topics (payment, shipping...) that should win over a product search
   chips      optional quick-reply buttons shown under the answer
              (replies without chips automatically get a "Menu" button that shows the suggested questions)

   Search for the "EDIT" marks below. Those are facts only you know (shipping, returns, selling). */

   window.CJ_CHAT = {

    /* ================= EDIT THESE FACTS ================= */
    STORE: {
      name: "CJ Finds",

      // EDIT: replace each text with your real policy. These are safe placeholders.
      // We talk to customers through social media, so these answers point to Messenger and Instagram.
      shipping: "Shipping fee and delivery time depend on your location. After you submit your order, our team will message you on Messenger or Instagram to confirm both.",
      returns: "Because every piece is pre-loved, please check the size and details before you order. For returns, exchanges, or cancellations, message our team on Messenger or Instagram as soon as possible.",
      qrSteps: "QR is our only payment option. After you submit your order, our team will message you on Messenger or Instagram with the QR code and payment steps, so please check your message request.",
      location: "You can shop with us right here on this website. For pickup or any other location questions, message our team on Messenger or Instagram.",
      sell: "Have pre-loved pieces you'd like to sell? We'd love to hear from you! Message our team on Messenger or Instagram with photos and details.",
      custom: "Looking for something made just for you? Message our team on Messenger or Instagram with your idea, and we'll get back to you.",

      scarcity: "Every piece is pre-loved and one of a kind, so grab it before it's gone!"
    },
    /* ===================================================== */

    greeting: "Hi! I'm the CJ Finds assistant. 💗\nAsk me about our pre-loved finds, prices, sizes, payment, or how to order.",

    fallback: "That seems to be an irrelevant question or there might be some typos. Please ask me again.",

    /* Quick-reply buttons shown when the chat opens, after the fallback message, and when the customer taps "Menu" */
    suggestions: [
      "What payment methods do you accept?",
      "How does your shipping work?",
      "Show me items under ₱300.",
      "What sizes do you have?",
      "Can I have my pre-loved items sold on your website?",
      "How do I order?"
    ],

    /* ================= QUESTIONS & ANSWERS ================= */
    faqs: [

      /* ---------- Small talk ---------- */
      { keywords: ["hi", "hello", "hey", "hola", "kumusta", "good morning", "good afternoon", "good evening", "yo"],
        answer: function (H) { return H.cfg.greeting; } },

      { keywords: ["Where are you from", "where"],
        answer: "We are from Cebu City. We could work with and become our sellers!" },
       
      { keywords: ["How does your shipping work?"],
        answer: "Buyer will pay for the shipping. We use J&T as our carrier for our deliveries, that's why it is very important to indicate your address. As much as possible, we will do our best to have low fees for shipping" },

      { keywords: ["Can I have my pre-loved items sold on your website?"],
        answer: "If you are interested in renting a space in our website, please contact us directly on Facebook: JM Descartin or Christian Tumulak. We look forward to do business with you!"},

      { keywords: ["thank you", "thanks", "thank u", "salamat", "ty", "much appreciated"],
        answer: "You're welcome! 💗 Anything else I can help you find?" },

      { keywords: ["bye", "goodbye", "see you", "see ya", "later"],
        answer: "Bye for now! Come back anytime for more pre-loved finds. 💗" },

      { keywords: ["who are you", "what can you do", "help", "assist", "your name", "can you help", "need help"],
        answer: "I'm the CJ Finds assistant! I can help with:\n• Our products, prices, and sizes\n• Payment, shipping, and returns\n• How to order\n• Selling your pre-loved items\n\nJust type your question.",
        chips: true },

      { keywords: ["who created you", "who is your CEO", "master", "designer", "web developer", "create", "founder", "owner", "admin", "contact", "boss", "manage"],
        answer: "I'm the CJ Finds assistant! I was founded by the hardwork of Christian and Jeddah. They have poured their dedication in making CJ FINDS possible.",
        chips: true },

      { keywords: ["are you a bot", "are you a robot", "are you ai", "are you human", "real person", "talk to human", "talk to a person", "talk to someone", "customer service", "customer support", "live agent"],
        answer: "I'm an automated assistant that answers from a ready list of questions, not a person. For anything I can't answer, please message our team on Messenger or Instagram." },

      /* ---------- About the shop ---------- */
      { keywords: ["about", "what is cj finds", "who is cj finds", "tell me about", "pre loved", "preloved", "second hand", "secondhand", "thrift", "ukay", "ukay ukay", "used clothes", "what does pre loved mean"],
        answer: "**CJ Finds** is a pre-loved fashion shop. Our tagline says it best: *Pre-Loved. Re-Loved. Yours.*\nWe offer Women, Men, and Accessories, carefully picked and priced to be easy on your wallet.",
        chips: true },

      { keywords: ["tagline", "slogan", "motto"],
        answer: "Pre-Loved. Re-Loved. Yours. 💗" },

      { keywords: ["condition", "quality", "worn", "used", "defect", "defects", "flaw", "flaws", "damage", "damaged", "stain", "stains", "good as new", "authentic", "original", "legit", "genuine", "fake", "brand new"],
        answer: "All our pieces are pre-loved, so they've been worn before, and we describe each one on its product page. Open an item to see its details and photos.\nAs with any pre-loved clothing, we recommend washing it before first use.\nHave a question about a specific piece? Message our team on Messenger or Instagram." },

      { keywords: ["stock", "in stock", "available", "availability", "restock", "sold out", "how many left", "one of a kind", "last piece", "still available", "left"],
        answer: function (H) { return H.STORE.scarcity + "\nWhat you see on the site is what we currently have. Browse [Women](women.html), [Men](men.html), or [Accessories](accessories.html)."; } },

      { keywords: ["clean", "cleaned", "wash", "washed", "laundry", "sanitize", "sanitized", "hygiene", "care"],
        answer: "As with any pre-loved clothing, we recommend washing your piece before first use. For care questions about a specific item, message our team on Messenger or Instagram." },

      /* ---------- Payment (QR only) ---------- */
      { keywords: ["cash on delivery", "cod", "pay on delivery", "pay when delivered", "pay upon delivery", "pay when it arrives"],
        priority: true,
        answer: "Cash on Delivery isn't available. We accept **QR only.**\nAfter you submit your order, our team will chat you via Messenger or Instagram for further information, so please check your message request.",
        chips: ["How does QR payment work?"] },

      { keywords: ["payment", "payment methods", "payment options", "how to pay", "how do i pay", "pay", "paying", "gcash", "maya", "paymaya", "paypal", "credit card", "debit card", "bank transfer", "installment", "mode of payment"],
        priority: true,
        answer: "**QR only.**\nAfter you submit your order, our team will chat you via Messenger or Instagram for further information, so please check your message request.",
        chips: ["How does QR payment work?"] },

      { keywords: ["qr", "qr code", "qr payment", "scan to pay", "scan"],
        priority: true,
        answer: function (H) { return H.STORE.qrSteps; } },

      /* ---------- Ordering ---------- */
      { keywords: ["how to order", "how do i order", "how can i order", "how to buy", "how do i buy", "how to purchase", "place order", "place an order", "i want to order", "checkout", "check out", "ordering process"],
        priority: true,
        answer: "Ordering is easy. Here's how:\n1. Browse [Women](women.html), [Men](men.html), or [Accessories](accessories.html).\n2. Tap **Add to bag** on the pieces you love.\n3. Open your bag with the bag button on the bottom left.\n4. Go to checkout and fill in your name, phone number, social media account, and delivery address.\n5. Submit your order and pay through QR. Our team will chat you via Messenger or Instagram for further information, so please check your message request." },

      { keywords: ["add to bag", "add to cart", "cart", "shopping bag", "shopping cart", "my bag", "my cart", "remove item", "remove from bag", "empty bag", "bag is empty", "view bag", "open bag", "see my bag"],
        priority: true,
        answer: "Tap **Add to bag** on any item. Your bag is the round button at the bottom left of the screen, and it shows how many items are inside. Open it any time to review your items before checkout." },

      { keywords: ["track", "tracking", "track my order", "track order", "where is my order", "order status", "status of my order", "my order"],
        priority: true,
        answer: "After you submit your order, our team will update you through Messenger or Instagram, so please check your message request. If you haven't heard from us yet, message our team there with your name and what you ordered." },

      { keywords: ["account", "login", "log in", "sign in", "sign up", "register", "password", "create account"],
        answer: "No account needed! Just add items to your bag and check out." },

      { keywords: ["safe", "secure", "security", "privacy", "scam", "trust", "trusted", "legitimate"],
        answer: "You only pay through QR, so you never enter card details on our site. After you submit your order, our team will message you on Messenger or Instagram, so please check your message request." },

      /* ---------- Shipping, returns, contact ---------- */
      { keywords: ["shipping", "shipping fee", "delivery", "delivery fee", "deliver", "ship", "how long", "delivery time", "when will i receive", "when will it arrive", "courier", "free shipping", "nationwide", "international", "abroad"],
        priority: true,
        answer: function (H) { return H.STORE.shipping; } },

      { keywords: ["return", "returns", "refund", "exchange", "wrong size", "cancel", "cancellation", "change item", "money back", "return policy"],
        priority: true,
        answer: function (H) { return H.STORE.returns; } },

      { keywords: ["contact", "email", "phone", "phone number", "call", "message", "facebook", "instagram", "social", "social media", "tiktok", "reach you", "support"],
        priority: true,
        answer: "We keep in touch through social media. After you submit your order, our team will chat you via Messenger or Instagram, so please check your message request. 💗" },

      { keywords: ["location", "address", "where are you", "where are you located", "store", "physical store", "branch", "visit", "pickup", "pick up", "opening hours", "store hours", "business hours"],
        priority: true,
        answer: function (H) { return H.STORE.location; } },

      { keywords: ["not working", "error", "bug", "website problem", "site problem", "problem", "issue", "broken", "cannot", "cant"],
        answer: "Sorry about that! Try refreshing the page first. If it keeps happening, message our team on Messenger or Instagram and tell us what went wrong." },

      /* ---------- Products, prices, sizes (live data from products.js) ---------- */
      { keywords: ["price", "prices", "how much", "cost", "pricing", "price range", "affordable", "cheap", "budget", "expensive", "how much are your items"],
        answer: function (H) {
          var r = H.range();
          return "Everything on our site is priced from **" + H.money(r.min) + "** to **" + H.money(r.max) + "**.\n" +
                 "Price filters on the shop pages: " + H.prices().map(H.money).join(", ") + ".\n" +
                 "Try asking: \"items under ₱300\", \"cheapest bag\", or \"women's items at ₱199\".";
        },
        chips: ["Show me items under ₱300.", "Show me the cheapest items."] },

      { keywords: ["filter", "filters", "sort", "filter by price", "filter by style", "search", "find items"],
        answer: "On the Women, Men, and Accessories pages, you can filter by **Style** (Casual, Formal, Sports) and by **Price** (₱199, ₱299, ₱399, ₱499). Tap a filter button to narrow the items, or just ask me, like \"formal items under ₱400\"." },

      { keywords: ["size", "sizes", "sizing", "size chart", "size guide", "measurements", "measurement", "what size", "fit", "fits", "available sizes"],
        answer: function (H) {
          var s = H.sizes().map(function (x) { return "• " + x.name + " (" + x.count + " item" + (x.count === 1 ? "" : "s") + ")"; }).join("\n");
          return "Sizes we currently have:\n" + s + "\nEach item's size is shown on its card and product page. Need measurements for a specific piece? Message our team on Messenger or Instagram.\nYou can also ask me, like \"XL items\".";
        },
        chips: ["Show me small items.", "Show me XL items."] },

      { keywords: ["categories", "category", "what do you sell", "what do you have", "what do you offer", "products", "product", "catalog", "catalogue", "collection", "collections", "items", "shop", "browse", "show me everything", "all items", "all products", "how many products", "how many items"],
        answer: function (H) {
          return "We have **" + H.list.length + " finds** right now:\n" +
            "• [Women](women.html): " + H.count("women") + " items\n" +
            "• [Men](men.html): " + H.count("men") + " items\n" +
            "• [Accessories](accessories.html): " + H.count("accessories") + " items\n" +
            "Ask me about a category, like \"show me men's items\".";
        },
        chips: ["Show me women's items.", "Show me men's items.", "Show me accessories."] },

      { keywords: ["new arrivals", "new arrival", "new", "latest", "just in", "newest", "new stock", "new items", "whats new", "recent"],
        answer: "Our newest finds are on the **New Arrivals** section of the [homepage](index.html). New pieces are added regularly." },

      { keywords: ["recommend", "recommendation", "suggest", "suggestion", "best seller", "best sellers", "bestseller", "popular", "featured", "editors pick", "editor's pick", "favorite", "top pick", "what should i buy", "what do you recommend"],
        answer: function (H) {
          var f = H.P.featured();
          if (!f.length) { return "Browse our shop pages to see all our finds! Ask me for items by category or budget."; }
          return "Our featured finds right now:\n" + f.map(H.line).join("\n") + "\nWant something else? Tell me your budget or style.";
        } },

      { keywords: ["negotiate", "haggle", "tawad", "lower price", "last price", "can i get a lower price", "price down", "bargain"],
        answer: "Our prices are as listed on each item." },

      { keywords: ["gift", "present", "birthday", "gift wrap", "surprise", "anniversary"],
        answer: "Pre-loved finds make lovely gifts! Tell me the budget and who it's for, like \"gift for women under ₱400\", and I'll suggest some pieces." },

      { keywords: ["bulk", "wholesale", "reseller", "resell", "dropship", "dropshipping", "many pieces", "large order"],
        answer: "For bulk orders or reselling, please message our team on Messenger or Instagram so we can talk it through." },

      { keywords: ["favorite item", "wishlist", "wish list", "heart", "save item", "save for later", "favorites", "favourite"],
        answer: "Tap the ♡ on any product card to save it as a favorite." },

      /* ---------- Sell with us / custom ---------- */
      { keywords: ["sell with us", "sell my clothes", "sell my items", "consign", "consignment", "sell preloved", "sell pre loved", "how to sell", "become a seller", "i want to sell", "sell clothes"],
        priority: true,
        answer: function (H) { return H.STORE.sell; } },

      { keywords: ["we design for you", "custom", "customize", "customise", "custom order", "made to order", "tailor", "personalized", "personalised", "bespoke"],
        priority: true,
        answer: function (H) { return H.STORE.custom; } },

      /* ---------- Menu ---------- */
      { keywords: ["menu", "main menu", "show menu", "suggested questions", "suggested question", "list of questions", "what can i ask", "what can i ask you", "faq", "faqs"],
        priority: true,
        answer: "Here are some questions you can pick from:",
        chips: true }
    ]
  };
