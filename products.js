/* CJ Finds - THE ONLY PRODUCT FILE.
   Every page (homepage, Women, Men, Accessories and the product page) reads from this list.
   To add, edit or remove a product, change it here and nowhere else.

   FIELDS
   name         product name (keep each name unique within its category)
   note         short line under the name
   price        number only, e.g. 299  (the price filters are 199 / 299 / 399 / 499)
   type         "casual", "formal" or "sports"
   category     "women", "men" or "accessories"
   size         "S", "XL", "XXL" or "OS" (one size). Pre-loved pieces are one-of-a-kind.
   front        front photo: a key from IMG below, OR a link / file path (e.g. "photos/knit-front.jpg")
   back         back photo link / file path. Leave "" to show a mirrored SAMPLE back view.
   description  text shown on the product page
   featured     true = also shown in "Featured finds" on the homepage
   editorsPick  true = shown as the "Editor's pick" on the homepage (use on ONE product only)
   sold         true = piece is sold. It gets a SOLD tag everywhere (shop pages, product page, customers' Favorites)
                and can no longer be added to the bag. Remove the word again to put it back on sale.
   NOTE         customers' favorites are saved by name + price. If you change a product's name or price,
                it counts as a new product and their saved heart on the old one disappears.

   Load this file BEFORE shop.js / script.js on every page (already done in the HTML files).
*/
(function () {
  "use strict";

  /* Sample photos. Replace with your own: change a link here, or put a path in "front" below. */
  var IMG = {
    knit: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=900&q=85",
    blazer: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=85",
    tote: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=85",
    women: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85",
    men: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=85",
    bag: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85",
    fashion: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=85"
  };

  var SIZE_NAMES = { S: "Small", XL: "Extra large", XXL: "Double extra large", OS: "One size" };
  var CATEGORY_NAMES = { women: "Women", men: "Men", accessories: "Accessories" };

  /* ================= YOUR PRODUCTS ================= */
  var PRODUCTS = [
    // ---- Women ----
    { name: "Everyday Knit", note: "Soft-touch essential", price: 299, type: "casual", category: "women", size: "S",
      front: "knit", back: "", featured: true, sold: true,
      description: "A soft-touch knit that layers over anything. Lightly worn and gently cared for." },
    { name: "Tailored Blazer", note: "Modern relaxed fit", price: 499, type: "formal", category: "women", size: "XL",
      front: "blazer", back: "", featured: true, editorsPick: true,
      description: "An effortlessly polished layer, cut for everyday ease and made to pair with the pieces you already love." },
    { name: "Sage Linen Top", note: "Breezy and light", price: 199, type: "casual", category: "women", size: "S",
      front: "fashion", back: "",
      description: "A light linen top that keeps you cool on warm days. Easy to dress up or down." },
    { name: "Pleated Midi Skirt", note: "Office to dinner", price: 399, type: "formal", category: "women", size: "XL",
      front: "women", back: "",
      description: "A flowy pleated midi that moves nicely and goes from the office to dinner." },
    { name: "Active Crop Set", note: "Stretchy, gym-ready", price: 299, type: "sports", category: "women", size: "S",
      front: "knit", back: "",
      description: "A stretchy two-piece set that stays in place through workouts." },
    { name: "Wrap Dress", note: "Pre-loved favorite", price: 499, type: "formal", category: "women", size: "XXL",
      front: "fashion", back: "",
      description: "A flattering wrap dress with an adjustable waist. A pre-loved favorite." },

    // ---- Men ----
    { name: "Classic Oxford Shirt", note: "Crisp and clean", price: 299, type: "formal", category: "men", size: "XL",
      front: "men", back: "",
      description: "A crisp oxford shirt with a clean collar. Great under a blazer or on its own." },
    { name: "Black Minimal Tee", note: "Everyday staple", price: 199, type: "casual", category: "men", size: "XXL",
      front: "men", back: "",
      description: "A plain black tee with a soft hand-feel. The easiest thing to throw on." },
    { name: "Slim Chino Pants", note: "Easy smart-casual", price: 399, type: "casual", category: "men", size: "XL",
      front: "blazer", back: "",
      description: "Slim chinos with a little stretch, easy to wear for work or weekends." },
    { name: "Wool-Blend Blazer", note: "Sharp, lightly worn", price: 499, type: "formal", category: "men", size: "XXL",
      front: "blazer", back: "",
      description: "A sharp wool-blend blazer, only lightly worn and still holding its shape." },
    { name: "Performance Jersey", note: "Quick-dry fabric", price: 199, type: "sports", category: "men", size: "XL",
      front: "men", back: "",
      description: "A quick-dry jersey that stays light and breathable during training." },
    { name: "Track Shorts", note: "Light and flexible", price: 299, type: "sports", category: "men", size: "S",
      front: "knit", back: "",
      description: "Light, flexible shorts with an elastic waist, ready for the track or the gym." },

    // ---- Accessories ----
    { name: "Everyday Tote", note: "Room for everything", price: 499, type: "casual", category: "accessories", size: "OS",
      front: "tote", back: "", featured: true,
      description: "A roomy tote with sturdy handles, made for work, errands and everything in between." },
    { name: "Leather Crossbody", note: "Compact and chic", price: 399, type: "formal", category: "accessories", size: "OS",
      front: "bag", back: "",
      description: "A compact crossbody with an adjustable strap. Fits your phone, wallet and keys." },
    { name: "Canvas Gym Bag", note: "Tough and roomy", price: 299, type: "sports", category: "accessories", size: "OS",
      front: "bag", back: "",
      description: "A tough canvas bag with space for your shoes, clothes and a water bottle." },
    { name: "Silk Scarf", note: "Soft blush print", price: 199, type: "casual", category: "accessories", size: "OS",
      front: "fashion", back: "",
      description: "A soft blush-print scarf to wear on your neck, in your hair or on a bag." },
    /*
     { name: "Classic Belt", note: "Polished finish", price: 199, type: "formal", category: "accessories", size: "S",
    front: "tote", back: "", sold: true,
      description: "A classic belt with a polished buckle that ties any outfit together." }, 
      */
    { name: "Sport Cap", note: "Adjustable fit", price: 199, type: "sports", category: "accessories", size: "OS",
      front: "men", back: "",
      description: "An adjustable sport cap with a curved brim and a comfortable fit." }
  ];
  /* ================================================== */

  function slug(text) {
    return String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function makeId(name, price) { return slug(name) + "-" + Number(price); }

  var list = [];
  var byId = {};
  PRODUCTS.forEach(function (r) {
    var p = {
      id: makeId(r.name, r.price),
      name: r.name,
      note: r.note || "",
      price: Number(r.price),
      type: r.type,
      category: r.category,
      size: r.size,
      front: IMG[r.front] || r.front,
      back: r.back || "",              // empty = sample back view (mirrored front photo)
      description: r.description || "",
      featured: !!r.featured,
      editorsPick: !!r.editorsPick,
      sold: !!r.sold
    };
    list.push(p);
    byId[p.id] = p;
  });

  window.CJ_PRODUCTS = {
    list: list,
    byId: byId,
    makeId: makeId,
    find: function (name, price) { return byId[makeId(name, price)] || null; },
    inCategory: function (key) { return list.filter(function (p) { return p.category === key; }); },
    featured: function () { return list.filter(function (p) { return p.featured; }); },
    editorsPick: function () { return list.filter(function (p) { return p.editorsPick; })[0] || null; },
    sizeName: function (size) { return SIZE_NAMES[size] || size; },
    categoryName: function (key) { return CATEGORY_NAMES[key] || key; }
  };
})();
