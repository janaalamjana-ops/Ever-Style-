import { useState, useEffect } from "react";

// ---------------------------------------------------------------------------
// Ever Style admin panel (front-end demo).
// Open it from the footer "Admin" link or with /admin or #admin on the site address.
// Sign in with your email + passcode. Leave the email empty to sign in as the Owner
// with the passcode below. CHANGE IT before you publish.
// IMPORTANT: this runs in the browser. Passcodes and all data (orders, products, staff)
// are kept in this browser only (localStorage) and are visible to anyone who can inspect
// the code. Before real use, move sign-in and data to a real backend.
// ---------------------------------------------------------------------------
const ADMIN_PASS = "mohonchura-admin";
const KEY = "mc_admin_v1";
const OK = "mc_admin_ok";
const LOW = 5;
const STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
const TABS = [["dashboard", "Dashboard"], ["orders", "Orders"], ["products", "Products"], ["inventory", "Inventory"], ["categories", "Categories"], ["customers", "Customers"], ["reviews", "Reviews"], ["hero", "Hero images"], ["coupons", "Coupons"], ["team", "Team access"], ["audit", "Audit log"]];
const ALL = TABS.map((t) => t[0]);
const ROLES = {
  Owner: ALL,
  Manager: ALL.filter((k) => k !== "team"),
  Support: ["dashboard", "orders", "customers", "reviews"],
  Editor: ["dashboard", "products", "inventory", "categories", "hero"],
};
const OWNER0 = { id: "U1", name: "Owner", email: "owner@everstyle.store", role: "Owner", pass: ADMIN_PASS, active: true };
const COUPONS0 = [
  { id: "K1", code: "EVERSTYLE15", type: "pct", value: 15, min: 0, expires: "", limit: 0, used: 0, active: true },
  { id: "K2", code: "WELCOME200", type: "flat", value: 200, min: 2000, expires: "", limit: 100, used: 0, active: true },
];

const money = (n) => `৳${Number(n).toLocaleString("en-IN")}`;
const now = () => new Date().toISOString();
const ago = (h) => new Date(Date.now() - h * 36e5).toISOString();
const fmt = (d) => new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const uid = (p) => p + Math.random().toString(36).slice(2, 8).toUpperCase();
const entry = (act, detail, who = "Admin") => ({ id: uid("L"), ts: now(), who, act, detail });
const lowAt = (i) => (i.low ?? LOW);

function seed(products, cats, slides) {
  const subs = { Audio: ["Headphones", "Speakers"], Fashion: ["Shoes", "Bags"], Tech: ["Laptops", "Phones"] };
  return {
    cats: cats.filter((c) => c !== "All").map((name, i) => ({ id: "c" + i, name, subs: subs[name] || [] })),
    inv: products.map((p) => ({ id: p.id, name: p.name, cat: p.cat, sub: "", price: p.price, tag: p.tag || "", active: true, low: LOW, stock: 3 + ((p.id * 7) % 28), sku: "ES-" + String(p.id).padStart(3, "0") })),
    orders: [
      { id: "NV-4F2K9A", name: "Rafi Ahmed", phone: "01711 000001", address: "House 12, Road 5, Dhanmondi, Dhaka", items: [{ name: "Aura Wireless Headphones", qty: 1, price: 12990 }], total: 12990, pay: "Card", status: "Pending", ts: ago(3) },
      { id: "NV-7B1Q3C", name: "Nusrat Jahan", phone: "01811 000002", address: "Flat 4B, Agrabad, Chattogram", items: [{ name: "Velo Runner Sneakers", qty: 2, price: 5490 }, { name: "Halo Sunglasses", qty: 1, price: 2490 }], total: 13470, pay: "Cash on delivery", status: "Processing", ts: ago(20) },
      { id: "NV-2D8M5X", name: "Tanvir Hasan", phone: "01911 000003", address: "Zindabazar, Sylhet", items: [{ name: "Zen Mechanical Keyboard", qty: 1, price: 6990 }], total: 7090, pay: "Card", status: "Shipped", ts: ago(52) },
      { id: "NV-9H6T1P", name: "Sadia Rahman", phone: "01611 000004", address: "Sector 7, Uttara, Dhaka", items: [{ name: "Brew Espresso Machine", qty: 1, price: 18990 }], total: 16140, coupon: "EVERSTYLE15", discount: 2849, pay: "Card", status: "Delivered", ts: ago(120) },
      { id: "NV-5C3W7Z", name: "Imran Hossain", phone: "01511 000005", address: "Rajshahi Sadar", items: [{ name: "Slate Minimal Wallet", qty: 1, price: 1490 }], total: 1590, pay: "Cash on delivery", status: "Cancelled", ts: ago(200) },
    ],
    reviews: [
      { id: "R1", product: "Aura Wireless Headphones", author: "Rafi Ahmed", rating: 5, text: "Exactly as described and delivered in two days. Quality is better than expected.", status: "Approved", ts: ago(60) },
      { id: "R2", product: "Velo Runner Sneakers", author: "Nusrat Jahan", rating: 4, text: "Looks premium and works well. Packaging was neat.", status: "Pending", ts: ago(30) },
      { id: "R3", product: "Zen Mechanical Keyboard", author: "Tanvir Hasan", rating: 5, text: "Great value. Support answered my questions quickly.", status: "Pending", ts: ago(10) },
      { id: "R4", product: "Halo Sunglasses", author: "Guest user", rating: 1, text: "Buy cheap watches at my-spam-link dot com", status: "Pending", ts: ago(6) },
    ],
    hero: slides.map((s) => ({ id: uid("H"), image: s.image, l1: s.l1, l2: s.l2, text: s.text, cta: s.cta, cat: s.cat })),
    coupons: COUPONS0.map((c) => ({ ...c })),
    team: [{ ...OWNER0 }],
    log: [entry("Panel created", "Sample data loaded", "System")],
  };
}

function read(products, cats, slides) {
  let st = {};
  try { st = JSON.parse(localStorage.getItem(KEY)) || {}; } catch {}
  return { ...seed(products, cats, slides), ...st };
}
const stored = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };

// Direct storage writes: used by sign-in and by the storefront.
function pushLog(act, detail, who) {
  try {
    const s = stored();
    s.log = [entry(act, detail, who), ...(s.log || [])].slice(0, 500);
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}
export function saveOrder(o) {
  try {
    const s = stored();
    s.orders = [o, ...(s.orders || [])];
    if (o.coupon) s.coupons = (s.coupons || COUPONS0).map((c) => (c.code === o.coupon ? { ...c, used: (c.used || 0) + 1 } : c));
    localStorage.setItem(KEY, JSON.stringify(s));
    pushLog("New order", `${o.id} · ${money(o.total)}`, "Customer");
  } catch {}
}

// Storefront: returns the coupon if it can be used on an order of this size, else null.
export function findCoupon(code, sub) {
  const c = (stored().coupons || COUPONS0).find((x) => x.code.toUpperCase() === String(code).trim().toUpperCase());
  if (!c || !c.active) return null;
  if (c.expires && new Date(c.expires + "T23:59:59") < new Date()) return null;
  if (c.limit && (c.used || 0) >= c.limit) return null;
  if (sub < (c.min || 0)) return null;
  return c;
}
export const couponValue = (c, sub) => (c.type === "pct" ? Math.round(sub * c.value) / 100 : Math.min(c.value, sub));

// Storefront: call once on load. Applies products, categories and hero slides saved in the admin panel.
export function applyAdminCatalog(products, slides, cats) {
  try {
    const st = stored();
    if (st.inv && st.inv.length) {
      const next = [];
      st.inv.forEach((it) => {
        if (it.active === false) return;
        const p = products.find((x) => x.id === it.id) || { id: it.id, img: "product", rating: 4.5 };
        p.name = it.name; p.cat = it.cat; p.price = it.price;
        if (it.tag) p.tag = it.tag; else delete p.tag;
        if (it.images && it.images.length) { p.images = it.images; p.image = it.images[0]; }
        next.push(p);
      });
      products.splice(0, products.length, ...next);
    }
    if (st.cats && st.cats.length) cats.splice(0, cats.length, "All", ...st.cats.map((c) => c.name));
    if (st.hero && st.hero.length) slides.splice(0, slides.length, ...st.hero.filter((h) => h.image).map((h) => ({ image: h.image, l1: h.l1, l2: h.l2, text: h.text, cta: h.cta || "Shop now", cat: h.cat || "All" })));
  } catch {}
}

// Shrinks a phone photo so it fits in browser storage.
const shrink = (file, max = 700, q = 0.72) => new Promise((res) => {
  const r = new FileReader();
  r.onerror = () => res(null);
  r.onload = () => {
    const im = new Image();
    im.onerror = () => res(null);
    im.onload = () => {
      const k = Math.min(1, max / Math.max(im.width, im.height));
      const c = document.createElement("canvas");
      c.width = Math.round(im.width * k);
      c.height = Math.round(im.height * k);
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      res(c.toDataURL("image/jpeg", q));
    };
    im.src = r.result;
  };
  r.readAsDataURL(file);
});

const customersOf = (d) => {
  const m = {};
  d.orders.forEach((o) => {
    const k = (o.phone || o.email || o.name).replace(/\s/g, "");
    const c = m[k] || (m[k] = { key: k, name: o.name, phone: o.phone, email: o.email, address: o.address, orders: [], spent: 0 });
    c.orders.push(o);
    if (o.status !== "Cancelled") c.spent += o.total;
    if (o.email) c.email = o.email;
  });
  return Object.values(m).sort((a, b) => b.spent - a.spent);
};

const Badge = ({ s }) => <span className={`ad-b s-${s.toLowerCase()}`}>{s}</span>;
const Field = ({ label, children }) => <label className="fld">{label}{children}</label>;

function Dashboard({ d, go }) {
  const live = d.orders.filter((o) => o.status !== "Cancelled");
  const rev = live.reduce((a, o) => a + o.total, 0);
  const days = [...Array(7)].map((_, i) => {
    const t = new Date(); t.setDate(t.getDate() - (6 - i));
    return { l: t.toLocaleDateString("en-GB", { weekday: "short" }), v: live.filter((o) => new Date(o.ts).toDateString() === t.toDateString()).reduce((a, o) => a + o.total, 0) };
  });
  const max = Math.max(1, ...days.map((x) => x.v));
  const sold = {};
  live.forEach((o) => o.items.forEach((i) => { sold[i.name] = (sold[i.name] || 0) + i.qty; }));
  const top = Object.entries(sold).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const low = d.inv.filter((i) => i.stock <= lowAt(i));
  const stats = [
    ["Orders", d.orders.length, "orders"], ["Revenue", money(rev), "orders"],
    ["Pending orders", d.orders.filter((o) => o.status === "Pending").length, "orders"], ["Low stock", low.length, "inventory"],
    ["Customers", customersOf(d).length, "customers"], ["Reviews to check", d.reviews.filter((r) => r.status === "Pending").length, "reviews"],
    ["Products", d.inv.length, "products"], ["Active coupons", d.coupons.filter((c) => c.active).length, "coupons"],
  ];
  return (
    <>
      <div className="ad-stats">{stats.map(([l, v, t]) => <button className="ad-stat" key={l} onClick={() => go(t)}><b>{v}</b><span>{l}</span></button>)}</div>
      <div className="panel">
        <h2>Sales, last 7 days</h2>
        <div className="ad-bars">{days.map((x, i) => <div key={i}><i style={{ height: `${Math.max(4, (x.v / max) * 100)}%` }} title={money(x.v)} /><span>{x.l}</span></div>)}</div>
      </div>
      <div className="ad-two">
        <div className="panel">
          <h2>Recent orders</h2>
          {d.orders.slice(0, 5).map((o) => <div className="ad-line" key={o.id}><span>{o.id} · {o.name}</span><span>{money(o.total)} <Badge s={o.status} /></span></div>)}
        </div>
        <div className="panel">
          <h2>Needs restock</h2>
          {low.length === 0 && <p className="ad-sub">Everything is well stocked.</p>}
          {low.slice(0, 6).map((i) => <div className="ad-line" key={i.id}><span>{i.name}</span><span className="ad-b s-low">{i.stock} left</span></div>)}
        </div>
        <div className="panel">
          <h2>Top sellers</h2>
          {top.length === 0 && <p className="ad-sub">No sales yet.</p>}
          {top.map(([n, q]) => <div className="ad-line" key={n}><span>{n}</span><span>{q} sold</span></div>)}
        </div>
      </div>
    </>
  );
}

function Orders({ d, mut }) {
  const [f, setF] = useState("All");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);
  const list = d.orders.filter((o) => (f === "All" || o.status === f) && (o.id + o.name).toLowerCase().includes(q.trim().toLowerCase()));
  const setStatus = (o, st) => mut((s) => ({ orders: s.orders.map((x) => (x.id === o.id ? { ...x, status: st } : x)) }), "Order status", `${o.id}: ${o.status} → ${st}`);
  return (
    <>
      <div className="ad-tools">
        <input className="search" type="search" placeholder="Search order or customer" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="sort" value={f} onChange={(e) => setF(e.target.value)} aria-label="Filter by status">
          {["All", ...STATUSES].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      {list.length === 0 && <div className="empty">No orders found.</div>}
      {list.map((o) => (
        <div className="ad-item" key={o.id}>
          <div className="ad-head" onClick={() => setOpen(open === o.id ? null : o.id)}>
            <div><b>{o.id}</b><span>{o.name} · {fmt(o.ts)}</span></div>
            <div className="ad-r"><b>{money(o.total)}</b><Badge s={o.status} /></div>
          </div>
          {open === o.id && (
            <div className="ad-more">
              {o.items.map((i, k) => <div key={k} className="ad-line"><span>{i.qty} × {i.name}</span><span>{money(i.qty * i.price)}</span></div>)}
              {o.coupon && <div className="ad-line"><span>Coupon {o.coupon}</span><span>−{money(o.discount || 0)}</span></div>}
              <div className="ad-sub">{o.phone}{o.email ? ` · ${o.email}` : ""}</div>
              <div className="ad-sub">{o.address}</div>
              <div className="ad-sub">Payment: {o.pay}</div>
              <Field label="Status">
                <select className="ad-in" value={o.status} onChange={(e) => setStatus(o, e.target.value)}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
            </div>
          )}
        </div>
      ))}
    </>
  );
}

const TAGS = ["", "New", "Sale", "Best seller", "Top rated"];

function Products({ d, mut }) {
  const [q, setQ] = useState("");
  const [c, setC] = useState("All");
  const [n, setN] = useState({ name: "", price: "", stock: "", cat: d.cats[0]?.name || "", sub: "", tag: "" });
  const subsOf = (name) => d.cats.find((x) => x.name === name)?.subs || [];
  const list = d.inv.filter((i) => (c === "All" || i.cat === c) && (i.name + i.sku).toLowerCase().includes(q.trim().toLowerCase()));
  const patch = (i, ch, act, detail) => mut((s) => ({ inv: s.inv.map((x) => (x.id === i.id ? { ...x, ...ch } : x)) }), act, detail);
  const del = (i) => { if (window.confirm(`Delete "${i.name}"?`)) mut((s) => ({ inv: s.inv.filter((x) => x.id !== i.id) }), "Product deleted", i.name); };
  const addPhotos = async (i, files) => {
    const got = (await Promise.all([...files].slice(0, 4).map((f) => shrink(f)))).filter(Boolean);
    if (!got.length) return;
    mut((s) => ({ inv: s.inv.map((x) => (x.id === i.id ? { ...x, images: [...(x.images || []), ...got].slice(0, 4) } : x)) }), "Photos added", `${i.name}: ${got.length} added`);
  };
  const dropPhoto = (i, k) => mut((s) => ({ inv: s.inv.map((x) => (x.id === i.id ? { ...x, images: (x.images || []).filter((_, j) => j !== k) } : x)) }), "Photo removed", `${i.name}: photo ${k + 1}`);
  const mainPhoto = (i, k) => mut((s) => ({ inv: s.inv.map((x) => { if (x.id !== i.id) return x; const a = [...(x.images || [])]; a.unshift(a.splice(k, 1)[0]); return { ...x, images: a }; }) }), "Main photo changed", i.name);
  const add = (e) => {
    e.preventDefault();
    if (!n.name.trim() || !n.cat) return;
    const id = Date.now();
    const it = { id, name: n.name.trim(), cat: n.cat, sub: n.sub, price: +n.price || 0, tag: n.tag, active: true, low: LOW, stock: +n.stock || 0, sku: "ES-" + String(id).slice(-5) };
    mut((s) => ({ inv: [it, ...s.inv] }), "Product added", `${it.name} (${money(it.price)})`);
    setN({ ...n, name: "", price: "", stock: "" });
  };
  return (
    <>
      <form className="panel ad-add" onSubmit={add}>
        <h2>Add product</h2>
        <div className="ad-grid">
          <Field label="Name"><input className="ad-in" value={n.name} onChange={(e) => setN({ ...n, name: e.target.value })} /></Field>
          <Field label="Price (৳)"><input className="ad-in" type="number" min="0" value={n.price} onChange={(e) => setN({ ...n, price: e.target.value })} /></Field>
          <Field label="Opening stock"><input className="ad-in" type="number" min="0" value={n.stock} onChange={(e) => setN({ ...n, stock: e.target.value })} /></Field>
          <Field label="Category"><select className="ad-in" value={n.cat} onChange={(e) => setN({ ...n, cat: e.target.value, sub: "" })}>{d.cats.map((x) => <option key={x.id}>{x.name}</option>)}</select></Field>
          <Field label="Sub-category"><select className="ad-in" value={n.sub} onChange={(e) => setN({ ...n, sub: e.target.value })}><option value="">None</option>{subsOf(n.cat).map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Label"><select className="ad-in" value={n.tag} onChange={(e) => setN({ ...n, tag: e.target.value })}>{TAGS.map((t) => <option key={t} value={t}>{t || "None"}</option>)}</select></Field>
          <button className="btn btn-primary" type="submit">Add</button>
        </div>
      </form>
      <div className="ad-tools">
        <input className="search" type="search" placeholder="Search name or SKU" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="sort" value={c} onChange={(e) => setC(e.target.value)} aria-label="Filter by category"><option>All</option>{d.cats.map((x) => <option key={x.id}>{x.name}</option>)}</select>
      </div>
      {list.map((i) => (
        <div className="ad-item" key={i.id}>
          <div className="ad-head" style={{ cursor: "default" }}>
            <div><b>{i.name}</b><span>{i.sku}{i.sub ? ` · ${i.sub}` : ""}</span></div>
            {i.active === false && <span className="ad-b s-cancelled">Hidden</span>}
          </div>
          <div className="ad-grid" style={{ marginTop: ".7rem" }}>
            <Field label="Name"><input key={`${i.id}-${i.name}`} className="ad-in" defaultValue={i.name} onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== i.name) patch(i, { name: v }, "Product renamed", `${i.name} → ${v}`); }} /></Field>
            <Field label="Price (৳)"><input key={`${i.id}-${i.price}`} className="ad-in" type="number" min="0" defaultValue={i.price} onBlur={(e) => { const v = +e.target.value; if (v >= 0 && v !== i.price) patch(i, { price: v }, "Price changed", `${i.name}: ${money(i.price)} → ${money(v)}`); }} /></Field>
            <Field label="Category"><select className="ad-in" value={i.cat} onChange={(e) => patch(i, { cat: e.target.value, sub: "" }, "Category changed", `${i.name}: ${i.cat} → ${e.target.value}`)}>{d.cats.map((x) => <option key={x.id}>{x.name}</option>)}</select></Field>
            <Field label="Sub-category"><select className="ad-in" value={i.sub} onChange={(e) => patch(i, { sub: e.target.value }, "Sub-category changed", `${i.name}: ${e.target.value || "None"}`)}><option value="">None</option>{subsOf(i.cat).map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Label"><select className="ad-in" value={i.tag || ""} onChange={(e) => patch(i, { tag: e.target.value }, "Label changed", `${i.name}: ${e.target.value || "None"}`)}>{TAGS.map((t) => <option key={t} value={t}>{t || "None"}</option>)}</select></Field>
            <Field label="On the store"><select className="ad-in" value={i.active === false ? "no" : "yes"} onChange={(e) => patch(i, { active: e.target.value === "yes" }, e.target.value === "yes" ? "Product shown" : "Product hidden", i.name)}><option value="yes">Visible</option><option value="no">Hidden</option></select></Field>
          </div>
          <div className="ad-photos">
            {(i.images || []).map((src, k) => (
              <div className="ad-ph" key={k}>
                <img src={src} alt="" />
                {k === 0 ? <em>Main</em> : <button type="button" className="m" aria-label="Make main photo" onClick={() => mainPhoto(i, k)}>★</button>}
                <button type="button" className="x" aria-label="Remove photo" onClick={() => dropPhoto(i, k)}>×</button>
              </div>
            ))}
            {(i.images || []).length < 4 && (
              <label className="ad-ph ad-up">+ Photo
                <input type="file" accept="image/*" multiple hidden onChange={(e) => { addPhotos(i, e.target.files); e.target.value = ""; }} />
              </label>
            )}
          </div>
          <button className="rm ad-danger" onClick={() => del(i)}>Delete product</button>
        </div>
      ))}
      {list.length === 0 && <div className="empty">No products found.</div>}
    </>
  );
}

function Inventory({ d, mut }) {
  const [q, setQ] = useState("");
  const [f, setF] = useState("All");
  const units = d.inv.reduce((a, i) => a + i.stock, 0);
  const list = d.inv.filter((i) => (i.name + i.sku).toLowerCase().includes(q.trim().toLowerCase()) && (f === "All" || (f === "Out of stock" ? i.stock === 0 : i.stock <= lowAt(i))));
  const setStock = (i, v) => { if (v >= 0 && v !== i.stock) mut((s) => ({ inv: s.inv.map((x) => (x.id === i.id ? { ...x, stock: v } : x)) }), "Stock adjusted", `${i.name}: ${i.stock} → ${v}`); };
  const setLow = (i, v) => { if (v >= 0 && v !== lowAt(i)) mut((s) => ({ inv: s.inv.map((x) => (x.id === i.id ? { ...x, low: v } : x)) }), "Low-stock alert changed", `${i.name}: ${lowAt(i)} → ${v}`); };
  return (
    <>
      <p className="ad-sub" style={{ marginBottom: ".8rem" }}>{d.inv.length} products · {units} units in stock</p>
      <div className="ad-tools">
        <input className="search" type="search" placeholder="Search name or SKU" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="sort" value={f} onChange={(e) => setF(e.target.value)} aria-label="Filter stock">{["All", "Low stock", "Out of stock"].map((s) => <option key={s}>{s}</option>)}</select>
      </div>
      {list.map((i) => (
        <div className="ad-item" key={i.id}>
          <div className="ad-head" style={{ cursor: "default" }}>
            <div><b>{i.name}</b><span>{i.sku} · {i.cat}</span></div>
            {i.stock <= lowAt(i) && <span className="ad-b s-low">{i.stock === 0 ? "Out of stock" : "Low stock"}</span>}
          </div>
          <div className="ad-grid" style={{ marginTop: ".7rem" }}>
            <div className="fld">Quick adjust
              <div className="ad-step">
                <button type="button" aria-label="Remove 10" onClick={() => setStock(i, i.stock - 10)}>−10</button>
                <button type="button" aria-label="Remove 1" onClick={() => setStock(i, i.stock - 1)}>−</button>
                <span>{i.stock}</span>
                <button type="button" aria-label="Add 1" onClick={() => setStock(i, i.stock + 1)}>+</button>
                <button type="button" aria-label="Add 10" onClick={() => setStock(i, i.stock + 10)}>+10</button>
              </div>
            </div>
            <Field label="Set exact stock"><input key={`${i.id}-${i.stock}`} className="ad-in" type="number" min="0" defaultValue={i.stock} onBlur={(e) => setStock(i, +e.target.value)} /></Field>
            <Field label="Alert when stock is"><input key={`${i.id}-l${lowAt(i)}`} className="ad-in" type="number" min="0" defaultValue={lowAt(i)} onBlur={(e) => setLow(i, +e.target.value)} /></Field>
          </div>
        </div>
      ))}
      {list.length === 0 && <div className="empty">Nothing here.</div>}
    </>
  );
}

function Categories({ d, mut }) {
  const [nc, setNc] = useState("");
  const [ns, setNs] = useState({});
  const addCat = (e) => {
    e.preventDefault();
    const name = nc.trim();
    if (!name || d.cats.some((c) => c.name.toLowerCase() === name.toLowerCase())) return;
    mut((s) => ({ cats: [...s.cats, { id: uid("c"), name, subs: [] }] }), "Category added", name);
    setNc("");
  };
  const delCat = (c) => {
    if (d.inv.some((i) => i.cat === c.name)) return window.alert("Move or delete the products in this category first.");
    if (window.confirm(`Delete "${c.name}"?`)) mut((s) => ({ cats: s.cats.filter((x) => x.id !== c.id) }), "Category deleted", c.name);
  };
  const addSub = (c, e) => {
    e.preventDefault();
    const v = (ns[c.id] || "").trim();
    if (!v || c.subs.includes(v)) return;
    mut((s) => ({ cats: s.cats.map((x) => (x.id === c.id ? { ...x, subs: [...x.subs, v] } : x)) }), "Sub-category added", `${c.name} › ${v}`);
    setNs({ ...ns, [c.id]: "" });
  };
  const delSub = (c, v) => mut((s) => ({
    cats: s.cats.map((x) => (x.id === c.id ? { ...x, subs: x.subs.filter((y) => y !== v) } : x)),
    inv: s.inv.map((i) => (i.cat === c.name && i.sub === v ? { ...i, sub: "" } : i)),
  }), "Sub-category deleted", `${c.name} › ${v}`);
  return (
    <>
      <form className="ad-tools" onSubmit={addCat}>
        <input className="search" placeholder="New category name" value={nc} onChange={(e) => setNc(e.target.value)} />
        <button className="btn btn-primary" type="submit">Add category</button>
      </form>
      {d.cats.map((c) => (
        <div className="ad-item" key={c.id}>
          <div className="ad-head" style={{ cursor: "default" }}>
            <div><b>{c.name}</b><span>{d.inv.filter((i) => i.cat === c.name).length} products · {c.subs.length} sub-categories</span></div>
            <button className="rm ad-danger" onClick={() => delCat(c)}>Delete</button>
          </div>
          <div className="ad-chips">
            {c.subs.length === 0 && <span className="ad-sub">No sub-categories yet.</span>}
            {c.subs.map((v) => <span className="ad-chip" key={v}>{v}<button aria-label={`Remove ${v}`} onClick={() => delSub(c, v)}>×</button></span>)}
          </div>
          <form className="ad-tools" style={{ marginBottom: 0 }} onSubmit={(e) => addSub(c, e)}>
            <input className="ad-in" style={{ flex: 1 }} placeholder={`Add sub-category to ${c.name}`} value={ns[c.id] || ""} onChange={(e) => setNs({ ...ns, [c.id]: e.target.value })} />
            <button className="btn btn-ghost" type="submit">Add</button>
          </form>
        </div>
      ))}
    </>
  );
}

function Customers({ d }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);
  const list = customersOf(d).filter((c) => (c.name + (c.phone || "") + (c.email || "")).toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <>
      <div className="ad-tools"><input className="search" type="search" placeholder="Search name, phone or email" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {list.length === 0 && <div className="empty">No customers yet. They appear here when they place an order.</div>}
      {list.map((c) => (
        <div className="ad-item" key={c.key}>
          <div className="ad-head" onClick={() => setOpen(open === c.key ? null : c.key)}>
            <div><b>{c.name}</b><span>{c.orders.length} order{c.orders.length > 1 ? "s" : ""} · last {fmt(c.orders[0].ts)}</span></div>
            <div className="ad-r"><b>{money(c.spent)}</b><span>spent</span></div>
          </div>
          {open === c.key && (
            <div className="ad-more">
              <div className="ad-sub">{c.phone}{c.email ? ` · ${c.email}` : ""}</div>
              <div className="ad-sub">{c.address}</div>
              {c.orders.map((o) => <div className="ad-line" key={o.id}><span>{o.id} · {fmt(o.ts)}</span><span>{money(o.total)} <Badge s={o.status} /></span></div>)}
            </div>
          )}
        </div>
      ))}
    </>
  );
}

function Reviews({ d, mut }) {
  const [f, setF] = useState("All");
  const list = d.reviews.filter((r) => f === "All" || r.status === f);
  const set = (r, st) => mut((s) => ({ reviews: s.reviews.map((x) => (x.id === r.id ? { ...x, status: st } : x)) }), `Review ${st.toLowerCase()}`, `${r.author} on ${r.product}`);
  const del = (r) => { if (window.confirm("Delete this review?")) mut((s) => ({ reviews: s.reviews.filter((x) => x.id !== r.id) }), "Review deleted", `${r.author} on ${r.product}`); };
  return (
    <>
      <div className="filters" style={{ marginBottom: "1rem" }}>
        {["All", "Pending", "Approved", "Rejected"].map((s) => <button key={s} className={`pill ${f === s ? "on" : ""}`} onClick={() => setF(s)}>{s}</button>)}
      </div>
      {list.length === 0 && <div className="empty">No reviews here.</div>}
      {list.map((r) => (
        <div className="ad-item" key={r.id}>
          <div className="ad-head" style={{ cursor: "default" }}>
            <div><b>{r.product}</b><span>{r.author} · {fmt(r.ts)}</span></div>
            <Badge s={r.status} />
          </div>
          <div style={{ margin: ".6rem 0 .2rem" }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
          <p className="ad-sub" style={{ marginBottom: ".7rem" }}>{r.text}</p>
          <div className="ad-acts">
            {r.status !== "Approved" && <button className="btn btn-primary" onClick={() => set(r, "Approved")}>Approve</button>}
            {r.status !== "Rejected" && <button className="btn btn-ghost" onClick={() => set(r, "Rejected")}>Reject</button>}
            <button className="rm ad-danger" onClick={() => del(r)}>Delete</button>
          </div>
        </div>
      ))}
    </>
  );
}

function Hero({ d, mut }) {
  const hs = d.hero;
  const upd = (h, ch, act, detail) => mut((s) => ({ hero: s.hero.map((x) => (x.id === h.id ? { ...x, ...ch } : x)) }), act, detail);
  const pick = async (h, i, file) => { const url = file && (await shrink(file, 1400, 0.68)); if (url) upd(h, { image: url }, "Hero image changed", `Slide ${i + 1}`); };
  const add = () => hs.length < 6 && mut((s) => ({ hero: [...s.hero, { id: uid("H"), image: "", l1: "New headline", l2: "Second line", text: "", cta: "Shop now", cat: "All" }] }), "Hero slide added", `Slide ${hs.length + 1}`);
  const del = (h, i) => { if (hs.length > 1 && window.confirm(`Delete slide ${i + 1}?`)) mut((s) => ({ hero: s.hero.filter((x) => x.id !== h.id) }), "Hero slide deleted", `Slide ${i + 1}`); };
  const move = (i, dx) => { const j = i + dx; if (j < 0 || j >= hs.length) return; mut((s) => { const a = [...s.hero]; [a[i], a[j]] = [a[j], a[i]]; return { hero: a }; }, "Hero slides reordered", `Slide ${i + 1} moved`); };
  const txt = (h, k, label, i) => (
    <Field label={label}><input key={`${h.id}-${k}-${h[k]}`} className="ad-in" defaultValue={h[k]} onBlur={(e) => e.target.value !== h[k] && upd(h, { [k]: e.target.value }, "Hero text changed", `Slide ${i + 1}: ${label}`)} /></Field>
  );
  return (
    <>
      <p className="ad-sub" style={{ marginBottom: "1rem" }}>These slides rotate at the top of the shop. Use wide photos (16:9). Slides without an image are skipped on the store.</p>
      {hs.map((h, i) => (
        <div className="ad-item" key={h.id}>
          <div className="ad-head" style={{ cursor: "default" }}>
            <b>Slide {i + 1}</b>
            <div className="ad-acts">
              <button className="btn btn-ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">↑</button>
              <button className="btn btn-ghost" disabled={i === hs.length - 1} onClick={() => move(i, 1)} aria-label="Move down">↓</button>
            </div>
          </div>
          <div className="ad-prev">
            {h.image ? <img src={h.image} alt="" /> : <span>No image yet</span>}
            <label className="btn btn-primary">{h.image ? "Change image" : "Add image"}
              <input type="file" accept="image/*" hidden onChange={(e) => { pick(h, i, e.target.files[0]); e.target.value = ""; }} />
            </label>
          </div>
          <div className="ad-grid">
            {txt(h, "l1", "Headline", i)}
            {txt(h, "l2", "Second line", i)}
            {txt(h, "cta", "Button text", i)}
            <Field label="Button opens"><select className="ad-in" value={h.cat || "All"} onChange={(e) => upd(h, { cat: e.target.value }, "Hero link changed", `Slide ${i + 1}: ${e.target.value}`)}><option>All</option>{d.cats.map((c) => <option key={c.id}>{c.name}</option>)}</select></Field>
          </div>
          <Field label="Description"><textarea key={`${h.id}-t-${h.text}`} className="ad-in" rows={2} defaultValue={h.text} onBlur={(e) => e.target.value !== h.text && upd(h, { text: e.target.value }, "Hero text changed", `Slide ${i + 1}: description`)} /></Field>
          {hs.length > 1 && <button className="rm ad-danger" onClick={() => del(h, i)}>Delete slide</button>}
        </div>
      ))}
      {hs.length < 6 && <button className="btn btn-ghost" onClick={add}>+ Add slide</button>}
    </>
  );
}

function Coupons({ d, mut }) {
  const blank = { code: "", type: "pct", value: "", min: "", expires: "", limit: "" };
  const [n, setN] = useState(blank);
  const desc = (c) => `${c.type === "pct" ? c.value + "% off" : money(c.value) + " off"}${c.min ? ` · min ${money(c.min)}` : ""}${c.expires ? ` · until ${c.expires}` : ""} · used ${c.used || 0}${c.limit ? "/" + c.limit : ""}`;
  const add = (e) => {
    e.preventDefault();
    const code = n.code.trim().toUpperCase().replace(/\s+/g, "");
    const value = +n.value;
    if (!code || !(value > 0) || (n.type === "pct" && value > 100)) return window.alert("Enter a code and a valid amount (percent can't be over 100).");
    if (d.coupons.some((c) => c.code === code)) return window.alert("That code already exists.");
    const c = { id: uid("K"), code, type: n.type, value, min: +n.min || 0, expires: n.expires, limit: +n.limit || 0, used: 0, active: true };
    mut((s) => ({ coupons: [c, ...s.coupons] }), "Coupon created", `${code}: ${desc(c)}`);
    setN(blank);
  };
  const toggle = (c) => mut((s) => ({ coupons: s.coupons.map((x) => (x.id === c.id ? { ...x, active: !x.active } : x)) }), c.active ? "Coupon paused" : "Coupon activated", c.code);
  const del = (c) => { if (window.confirm(`Delete ${c.code}?`)) mut((s) => ({ coupons: s.coupons.filter((x) => x.id !== c.id) }), "Coupon deleted", c.code); };
  return (
    <>
      <form className="panel ad-add" onSubmit={add}>
        <h2>New coupon</h2>
        <div className="ad-grid">
          <Field label="Code"><input className="ad-in" style={{ textTransform: "uppercase" }} value={n.code} onChange={(e) => setN({ ...n, code: e.target.value })} /></Field>
          <Field label="Type"><select className="ad-in" value={n.type} onChange={(e) => setN({ ...n, type: e.target.value })}><option value="pct">Percent off</option><option value="flat">Fixed amount (৳)</option></select></Field>
          <Field label={n.type === "pct" ? "Percent" : "Amount (৳)"}><input className="ad-in" type="number" min="0" value={n.value} onChange={(e) => setN({ ...n, value: e.target.value })} /></Field>
          <Field label="Minimum order (৳)"><input className="ad-in" type="number" min="0" value={n.min} onChange={(e) => setN({ ...n, min: e.target.value })} /></Field>
          <Field label="Expires"><input className="ad-in" type="date" value={n.expires} onChange={(e) => setN({ ...n, expires: e.target.value })} /></Field>
          <Field label="Max uses (0 = no limit)"><input className="ad-in" type="number" min="0" value={n.limit} onChange={(e) => setN({ ...n, limit: e.target.value })} /></Field>
          <button className="btn btn-primary" type="submit">Create</button>
        </div>
      </form>
      {d.coupons.length === 0 && <div className="empty">No coupons yet.</div>}
      {d.coupons.map((c) => (
        <div className="ad-item" key={c.id}>
          <div className="ad-head" style={{ cursor: "default" }}>
            <div><b>{c.code}</b><span>{desc(c)}</span></div>
            <span className={`ad-b ${c.active ? "s-approved" : "s-rejected"}`}>{c.active ? "Active" : "Paused"}</span>
          </div>
          <div className="ad-acts" style={{ marginTop: ".7rem" }}>
            <button className="btn btn-ghost" onClick={() => toggle(c)}>{c.active ? "Pause" : "Activate"}</button>
            <button className="rm ad-danger" onClick={() => del(c)}>Delete</button>
          </div>
        </div>
      ))}
    </>
  );
}

function Team({ d, mut, me }) {
  const blank = { name: "", email: "", role: "Support", pass: "" };
  const [n, setN] = useState(blank);
  const owners = d.team.filter((u) => u.role === "Owner" && u.active).length;
  const patch = (u, ch, act, detail) => mut((s) => ({ team: s.team.map((x) => (x.id === u.id ? { ...x, ...ch } : x)) }), act, detail);
  const add = (e) => {
    e.preventDefault();
    const email = n.email.trim().toLowerCase();
    if (!n.name.trim() || !email.includes("@") || n.pass.length < 6) return window.alert("Enter a name, a valid email and a passcode of at least 6 characters.");
    if (d.team.some((u) => u.email.toLowerCase() === email)) return window.alert("That email already has access.");
    const u = { id: uid("U"), name: n.name.trim(), email, role: n.role, pass: n.pass, active: true };
    mut((s) => ({ team: [...s.team, u] }), "Team member added", `${u.name} (${u.role})`);
    setN(blank);
  };
  const role = (u, r) => { if (u.role === "Owner" && owners < 2) return window.alert("There must be at least one active Owner."); patch(u, { role: r }, "Role changed", `${u.name}: ${u.role} → ${r}`); };
  const toggle = (u) => { if (u.id === me.id) return window.alert("You can't pause your own access."); if (u.role === "Owner" && u.active && owners < 2) return window.alert("There must be at least one active Owner."); patch(u, { active: !u.active }, u.active ? "Access paused" : "Access restored", u.name); };
  const reset = (u) => { const p = window.prompt(`New passcode for ${u.name} (6+ characters)`); if (p && p.length >= 6) patch(u, { pass: p }, "Passcode reset", u.name); else if (p) window.alert("Too short."); };
  const del = (u) => { if (u.id === me.id) return window.alert("You can't remove yourself."); if (u.role === "Owner" && owners < 2) return window.alert("There must be at least one active Owner."); if (window.confirm(`Remove ${u.name}?`)) mut((s) => ({ team: s.team.filter((x) => x.id !== u.id) }), "Team member removed", u.name); };
  return (
    <>
      <form className="panel ad-add" onSubmit={add}>
        <h2>Give someone access</h2>
        <div className="ad-grid">
          <Field label="Name"><input className="ad-in" value={n.name} onChange={(e) => setN({ ...n, name: e.target.value })} /></Field>
          <Field label="Email"><input className="ad-in" type="email" value={n.email} onChange={(e) => setN({ ...n, email: e.target.value })} /></Field>
          <Field label="Role"><select className="ad-in" value={n.role} onChange={(e) => setN({ ...n, role: e.target.value })}>{Object.keys(ROLES).map((r) => <option key={r}>{r}</option>)}</select></Field>
          <Field label="Passcode"><input className="ad-in" value={n.pass} onChange={(e) => setN({ ...n, pass: e.target.value })} /></Field>
          <button className="btn btn-primary" type="submit">Add</button>
        </div>
      </form>
      {d.team.map((u) => (
        <div className="ad-item" key={u.id}>
          <div className="ad-head" style={{ cursor: "default" }}>
            <div><b>{u.name}{u.id === me.id ? " (you)" : ""}</b><span>{u.email}</span></div>
            <span className={`ad-b ${u.active ? "s-approved" : "s-rejected"}`}>{u.active ? "Active" : "Paused"}</span>
          </div>
          <div className="ad-acts" style={{ marginTop: ".7rem" }}>
            <select className="ad-in" style={{ width: "auto" }} value={u.role} onChange={(e) => role(u, e.target.value)} aria-label="Role">{Object.keys(ROLES).map((r) => <option key={r}>{r}</option>)}</select>
            <button className="btn btn-ghost" onClick={() => reset(u)}>Reset passcode</button>
            <button className="btn btn-ghost" onClick={() => toggle(u)}>{u.active ? "Pause" : "Restore"}</button>
            <button className="rm ad-danger" onClick={() => del(u)}>Remove</button>
          </div>
        </div>
      ))}
      <div className="panel">
        <h2>What each role can open</h2>
        {Object.entries(ROLES).map(([r, ks]) => <div className="ad-line" key={r} style={{ padding: ".4rem 0" }}><b>{r}</b><span className="ad-sub" style={{ textAlign: "right" }}>{ks.map((k) => TABS.find((t) => t[0] === k)[1]).join(", ")}</span></div>)}
      </div>
    </>
  );
}

function Audit({ d }) {
  const [q, setQ] = useState("");
  const list = d.log.filter((l) => (l.act + l.detail + l.who).toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <>
      <div className="ad-tools"><input className="search" type="search" placeholder="Search the log" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <p className="note" style={{ marginTop: 0, marginBottom: ".8rem" }}>Every change made here is recorded with who made it. Entries cannot be edited or deleted from this panel.</p>
      {list.map((l) => (
        <div className="ad-log" key={l.id}>
          <time>{fmt(l.ts)}</time>
          <div><b>{l.act}</b><span className="ad-sub"> · {l.who}</span><div className="ad-sub">{l.detail}</div></div>
        </div>
      ))}
      {list.length === 0 && <div className="empty">Nothing matches.</div>}
    </>
  );
}

function Panel({ products, cats, slides, meId, onBack, onOut }) {
  const [d, setD] = useState(() => read(products, cats, slides));
  const [tab, setTab] = useState("dashboard");
  const [full, setFull] = useState(false);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(d)); setFull(false); } catch { setFull(true); } }, [d]);
  const me = d.team.find((u) => u.id === meId);
  useEffect(() => { if (!me || !me.active) onOut(); }, [me]);
  if (!me || !me.active) return null;
  const allowed = ROLES[me.role] || [];
  const tabs = TABS.filter(([k]) => allowed.includes(k));
  const cur = allowed.includes(tab) ? tab : "dashboard";
  const mut = (fn, act, detail) => setD((s) => ({ ...s, ...fn(s), log: [entry(act, detail, me.name), ...s.log].slice(0, 500) }));
  const go = (k) => allowed.includes(k) && setTab(k);
  return (
    <main className="wrap ad">
      <div className="ad-top">
        <div><h1>Admin panel</h1><span className="ad-sub">{me.name} · {me.role}</span></div>
        <div className="ad-acts">
          <button className="btn btn-ghost" onClick={onBack}>View shop</button>
          <button className="btn btn-ghost" onClick={() => { pushLog("Signed out", "Admin panel closed", me.name); onOut(); }}>Sign out</button>
        </div>
      </div>
      {full && <p className="note ad-warn">Browser storage is full, so the latest change is not saved. Remove a few photos.</p>}
      <div className="filters ad-tabs" role="tablist">
        {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={cur === k} className={`pill ${cur === k ? "on" : ""}`} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {cur === "dashboard" && <Dashboard d={d} go={go} />}
      {cur === "orders" && <Orders d={d} mut={mut} />}
      {cur === "products" && <Products d={d} mut={mut} />}
      {cur === "inventory" && <Inventory d={d} mut={mut} />}
      {cur === "categories" && <Categories d={d} mut={mut} />}
      {cur === "customers" && <Customers d={d} />}
      {cur === "reviews" && <Reviews d={d} mut={mut} />}
      {cur === "hero" && <Hero d={d} mut={mut} />}
      {cur === "coupons" && <Coupons d={d} mut={mut} />}
      {cur === "team" && <Team d={d} mut={mut} me={me} />}
      {cur === "audit" && <Audit d={d} />}
    </main>
  );
}

export default function Admin({ products, cats, slides, onBack }) {
  const [meId, setMeId] = useState(() => { try { return sessionStorage.getItem(OK) || ""; } catch { return ""; } });
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [bad, setBad] = useState(false);
  const submit = (e) => {
    e.preventDefault();
    const team = stored().team || [OWNER0];
    const em = email.trim().toLowerCase();
    const u = em ? team.find((x) => x.email.toLowerCase() === em) : team.find((x) => x.role === "Owner" && x.active);
    if (u && u.active && pw === u.pass) {
      try { sessionStorage.setItem(OK, u.id); } catch {}
      pushLog("Signed in", "Admin panel opened", u.name);
      setMeId(u.id);
    } else {
      pushLog("Failed sign-in", `Attempt for ${em || "owner"}`, "Unknown");
      setBad(true);
    }
  };
  const out = () => { try { sessionStorage.removeItem(OK); } catch {} setMeId(""); setPw(""); };
  return (
    <>
      <style>{css}</style>
      {meId ? (
        <Panel products={products} cats={cats} slides={slides || []} meId={meId} onBack={onBack} onOut={out} />
      ) : (
        <main className="wrap">
          <form className="panel ad-gate" onSubmit={submit}>
            <h2>Admin sign-in</h2>
            <Field label="Email (leave empty for Owner)"><input type="email" value={email} autoComplete="username" onChange={(e) => { setEmail(e.target.value); setBad(false); }} /></Field>
            <label className={`fld ${bad ? "bad" : ""}`} style={{ marginTop: ".8rem" }}>Passcode
              <input type="password" value={pw} autoComplete="current-password" onChange={(e) => { setPw(e.target.value); setBad(false); }} />
              {bad && <small>Wrong email or passcode, or access is paused</small>}
            </label>
            <button className="btn btn-primary" type="submit" style={{ width: "100%", marginTop: "1rem" }}>Sign in</button>
            <button className="lnk" type="button" style={{ display: "block", margin: "1rem auto 0" }} onClick={onBack}>Back to shop</button>
          </form>
        </main>
      )}
    </>
  );
}

const css = `
.ad{padding:1.6rem 0 4rem}
.ad-gate{max-width:420px;margin:3rem auto}
.ad-top{display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:1.2rem}
.ad-top h1{font-size:clamp(1.6rem,4.5vw,2.4rem);font-weight:800}
.ad-acts{display:flex;gap:.5rem;flex-wrap:wrap;align-items:center}
.ad-acts .btn{padding:.6rem 1.1rem;border-radius:12px}
.ad-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:.8rem;margin-bottom:1.2rem}
.ad-stat{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:1rem;text-align:left}
.ad-stat b{display:block;font-family:'Bricolage Grotesque','Hind Siliguri',sans-serif;font-size:1.4rem}
.ad-stat span{color:var(--muted);font-size:.82rem}
.ad-two{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem}
.ad-bars{display:flex;align-items:flex-end;gap:.6rem;height:150px}
.ad-bars div{flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:.4rem}
.ad-bars i{display:block;width:100%;max-width:46px;background:var(--violet);border-radius:8px 8px 3px 3px}
.ad-bars span{font-size:.74rem;color:var(--muted)}
.ad-tabs{margin-bottom:1.2rem}
.ad-tools{display:flex;gap:.6rem;flex-wrap:wrap;margin-bottom:1rem}
.ad-tools .search{flex:1;min-width:160px;max-width:none}
.ad-add{margin-bottom:1.2rem}
.ad-item{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:.9rem 1rem;margin-bottom:.7rem}
.ad-head{display:flex;justify-content:space-between;align-items:center;gap:.8rem;cursor:pointer}
.ad-head b{display:block}
.ad-head span,.ad-sub{color:var(--muted);font-size:.84rem}
.ad-head div>span{display:block}
.ad-r{text-align:right;display:grid;gap:.3rem;justify-items:end}
.ad-more{margin-top:.8rem;padding-top:.8rem;border-top:1px solid var(--line);display:grid;gap:.5rem;font-size:.92rem}
.ad-line{display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:.35rem 0;font-size:.92rem}
.ad-b{display:inline-block;padding:.15rem .6rem;border-radius:99px;font-size:.74rem;font-weight:700;border:1px solid currentColor;white-space:nowrap}
.s-pending{color:#B7791F}.s-processing{color:#2B6CB0}.s-shipped{color:#6B46C1}
.s-delivered,.s-approved{color:#2F855A}.s-cancelled,.s-rejected,.s-low{color:#C0503F}
.ad-in{padding:.65rem .8rem;border-radius:12px;border:1px solid var(--line);background:var(--surface2);color:var(--text);font:inherit;font-size:.95rem;width:100%}
.ad-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.7rem;align-items:end;margin-bottom:.7rem}
.ad-step{display:inline-flex;align-items:center;justify-content:space-between;gap:.3rem;background:var(--surface2);border:1px solid var(--line);border-radius:12px;padding:.25rem .3rem}
.ad-step button{min-width:32px;height:32px;padding:0 .3rem;border-radius:9px;font-weight:700;font-size:.82rem}
.ad-step span{min-width:2rem;text-align:center;font-weight:700;color:var(--text)}
.ad-chips{display:flex;gap:.4rem;flex-wrap:wrap;margin:.7rem 0}
.ad-chip{display:inline-flex;align-items:center;gap:.3rem;background:var(--surface2);border:1px solid var(--line);border-radius:99px;padding:.25rem .4rem .25rem .8rem;font-size:.86rem}
.ad-chip button{width:22px;height:22px;border-radius:50%;color:var(--muted)}
.ad-danger{color:#C0503F!important}
.ad-log{display:grid;grid-template-columns:110px 1fr;gap:.2rem .8rem;padding:.7rem 0;border-bottom:1px solid var(--line);font-size:.9rem}
.ad-log time{color:var(--muted);font-size:.8rem}
.ad-photos{display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.4rem}
.ad-ph{position:relative;width:78px;height:78px;border-radius:12px;overflow:hidden;border:1px solid var(--line);background:var(--surface2)}
.ad-ph img{width:100%;height:100%;object-fit:cover;display:block}
.ad-ph em{position:absolute;left:4px;bottom:4px;font-style:normal;font-size:.68rem;font-weight:700;background:rgba(0,0,0,.7);color:#fff;border-radius:99px;padding:.1rem .45rem}
.ad-ph button{position:absolute;width:24px;height:24px;border-radius:50%;background:rgba(0,0,0,.7);color:#fff;line-height:1}
.ad-ph .x{top:4px;right:4px}.ad-ph .m{left:4px;bottom:4px}
.ad-up{display:flex;align-items:center;justify-content:center;border-style:dashed;color:var(--muted);font-size:.8rem;font-weight:600;cursor:pointer;text-align:center}
.ad-prev{position:relative;aspect-ratio:16/6;border-radius:14px;overflow:hidden;background:var(--surface2);border:1px solid var(--line);margin:.8rem 0;display:grid;place-items:center;color:var(--muted)}
.ad-prev img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.ad-prev .btn{position:absolute;right:.7rem;bottom:.7rem;padding:.5rem 1rem;border-radius:11px;cursor:pointer}
textarea.ad-in{resize:vertical}
.ad-warn{color:#C0503F;margin:0 0 1rem}
@media (max-width:640px){.ad-stats{grid-template-columns:repeat(2,1fr)}.ad-log{grid-template-columns:1fr}.ad-tools .btn{flex:1}}
`;
