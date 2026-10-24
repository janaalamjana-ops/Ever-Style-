import { useState, useEffect } from "react";

// ---------------------------------------------------------------------------
// Ever Style admin panel (front-end demo).
// Open it from the footer "Admin" link or by adding  #admin  to the site address.
// IMPORTANT: change the passcode below. Because this runs in the browser, the passcode
// can be read by anyone who inspects the code, and all data is saved only in this
// browser (localStorage). Before real use, move sign-in and data to a real backend.
// ---------------------------------------------------------------------------
const ADMIN_PASS = "mohonchura-admin";
const ADMIN_NAME = "Admin";
const KEY = "mc_admin_v1";
const OK = "mc_admin_ok";
const LOW = 5;
const STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

const money = (n) => `৳${Number(n).toLocaleString("en-IN")}`;
const now = () => new Date().toISOString();
const ago = (h) => new Date(Date.now() - h * 36e5).toISOString();
const fmt = (d) => new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const uid = (p) => p + Math.random().toString(36).slice(2, 8).toUpperCase();
const entry = (act, detail, who = ADMIN_NAME) => ({ id: uid("L"), ts: now(), who, act, detail });

function seed(products, cats) {
  const subs = { Audio: ["Headphones", "Speakers"], Fashion: ["Shoes", "Bags"], Tech: ["Laptops", "Phones"] };
  return {
    cats: cats.filter((c) => c !== "All").map((name, i) => ({ id: "c" + i, name, subs: subs[name] || [] })),
    inv: products.map((p) => ({ id: p.id, name: p.name, cat: p.cat, sub: "", price: p.price, stock: 3 + ((p.id * 7) % 28), sku: "MC-" + String(p.id).padStart(3, "0") })),
    orders: [
      { id: "NV-4F2K9A", name: "Rafi Ahmed", phone: "01711 000001", address: "House 12, Road 5, Dhanmondi, Dhaka", items: [{ name: "Aura Wireless Headphones", qty: 1, price: 12990 }], total: 12990, pay: "Card", status: "Pending", ts: ago(3) },
      { id: "NV-7B1Q3C", name: "Nusrat Jahan", phone: "01811 000002", address: "Flat 4B, Agrabad, Chattogram", items: [{ name: "Velo Runner Sneakers", qty: 2, price: 5490 }, { name: "Halo Sunglasses", qty: 1, price: 2490 }], total: 13470, pay: "Cash on delivery", status: "Processing", ts: ago(20) },
      { id: "NV-2D8M5X", name: "Tanvir Hasan", phone: "01911 000003", address: "Zindabazar, Sylhet", items: [{ name: "Zen Mechanical Keyboard", qty: 1, price: 6990 }], total: 7090, pay: "Card", status: "Shipped", ts: ago(52) },
      { id: "NV-9H6T1P", name: "Sadia Rahman", phone: "01611 000004", address: "Sector 7, Uttara, Dhaka", items: [{ name: "Brew Espresso Machine", qty: 1, price: 18990 }], total: 18990, pay: "Card", status: "Delivered", ts: ago(120) },
      { id: "NV-5C3W7Z", name: "Imran Hossain", phone: "01511 000005", address: "Rajshahi Sadar", items: [{ name: "Slate Minimal Wallet", qty: 1, price: 1490 }], total: 1590, pay: "Cash on delivery", status: "Cancelled", ts: ago(200) },
    ],
    reviews: [
      { id: "R1", product: "Aura Wireless Headphones", author: "Rafi Ahmed", rating: 5, text: "Exactly as described and delivered in two days. Quality is better than expected.", status: "Approved", ts: ago(60) },
      { id: "R2", product: "Velo Runner Sneakers", author: "Nusrat Jahan", rating: 4, text: "Looks premium and works well. Packaging was neat.", status: "Pending", ts: ago(30) },
      { id: "R3", product: "Zen Mechanical Keyboard", author: "Tanvir Hasan", rating: 5, text: "Great value. Support answered my questions quickly.", status: "Pending", ts: ago(10) },
      { id: "R4", product: "Halo Sunglasses", author: "Guest user", rating: 1, text: "Buy cheap watches at my-spam-link dot com", status: "Pending", ts: ago(6) },
    ],
    log: [entry("Panel created", "Sample data loaded", "System")],
  };
}

function read(products, cats) {
  let st = {};
  try { st = JSON.parse(localStorage.getItem(KEY)) || {}; } catch {}
  return { ...seed(products, cats), ...st };
}

// Writes straight to storage. Used by the sign-in screen and by the storefront checkout.
function pushLog(act, detail, who) {
  try {
    const s = JSON.parse(localStorage.getItem(KEY)) || {};
    s.log = [entry(act, detail, who), ...(s.log || [])].slice(0, 500);
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}
export function saveOrder(o) {
  try {
    const s = JSON.parse(localStorage.getItem(KEY)) || {};
    s.orders = [o, ...(s.orders || [])];
    localStorage.setItem(KEY, JSON.stringify(s));
    pushLog("New order", `${o.id} · ${money(o.total)}`, "Customer");
  } catch {}
}

// Shrinks a phone photo to about 700px so it fits in browser storage.
const shrink = (file) => new Promise((res) => {
  const r = new FileReader();
  r.onerror = () => res(null);
  r.onload = () => {
    const im = new Image();
    im.onerror = () => res(null);
    im.onload = () => {
      const k = Math.min(1, 700 / Math.max(im.width, im.height));
      const c = document.createElement("canvas");
      c.width = Math.round(im.width * k);
      c.height = Math.round(im.height * k);
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      res(c.toDataURL("image/jpeg", 0.72));
    };
    im.src = r.result;
  };
  r.readAsDataURL(file);
});

// The storefront calls this once on load so photos added here show on the matching products.
export function applyAdminImages(products) {
  try {
    const inv = (JSON.parse(localStorage.getItem(KEY)) || {}).inv || [];
    products.forEach((p) => {
      const it = inv.find((x) => x.id === p.id);
      if (it && it.images && it.images.length) { p.images = it.images; p.image = it.images[0]; }
    });
  } catch {}
}

const Badge = ({ s }) => <span className={`ad-b s-${s.toLowerCase()}`}>{s}</span>;

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
              <div className="ad-sub">{o.phone}{o.email ? ` · ${o.email}` : ""}</div>
              <div className="ad-sub">{o.address}</div>
              <div className="ad-sub">Payment: {o.pay}</div>
              <label className="fld">Status
                <select className="ad-in" value={o.status} onChange={(e) => setStatus(o, e.target.value)}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
            </div>
          )}
        </div>
      ))}
    </>
  );
}

function Inventory({ d, mut }) {
  const [q, setQ] = useState("");
  const [c, setC] = useState("All");
  const [n, setN] = useState({ name: "", price: "", stock: "", cat: d.cats[0]?.name || "", sub: "" });
  const subsOf = (name) => d.cats.find((x) => x.name === name)?.subs || [];
  const list = d.inv.filter((i) => (c === "All" || i.cat === c) && (i.name + i.sku).toLowerCase().includes(q.trim().toLowerCase()));
  const patch = (i, ch, act, detail) => mut((s) => ({ inv: s.inv.map((x) => (x.id === i.id ? { ...x, ...ch } : x)) }), act, detail);
  const step = (i, dx) => { const v = i.stock + dx; if (v >= 0) patch(i, { stock: v }, "Stock adjusted", `${i.name}: ${i.stock} → ${v}`); };
  const del = (i) => { if (window.confirm(`Delete "${i.name}"?`)) mut((s) => ({ inv: s.inv.filter((x) => x.id !== i.id) }), "Item deleted", i.name); };
  const addPhotos = async (i, files) => {
    const got = (await Promise.all([...files].slice(0, 4).map(shrink))).filter(Boolean);
    if (!got.length) return;
    mut((s) => ({ inv: s.inv.map((x) => (x.id === i.id ? { ...x, images: [...(x.images || []), ...got].slice(0, 4) } : x)) }), "Photos added", `${i.name}: ${got.length} added`);
  };
  const dropPhoto = (i, k) => mut((s) => ({ inv: s.inv.map((x) => (x.id === i.id ? { ...x, images: (x.images || []).filter((_, j) => j !== k) } : x)) }), "Photo removed", `${i.name}: photo ${k + 1}`);
  const mainPhoto = (i, k) => mut((s) => ({ inv: s.inv.map((x) => { if (x.id !== i.id) return x; const a = [...(x.images || [])]; a.unshift(a.splice(k, 1)[0]); return { ...x, images: a }; }) }), "Main photo changed", i.name);
  const add = (e) => {
    e.preventDefault();
    if (!n.name.trim() || !n.cat) return;
    const id = Date.now();
    const it = { id, name: n.name.trim(), cat: n.cat, sub: n.sub, price: +n.price || 0, stock: +n.stock || 0, sku: "MC-" + String(id).slice(-5) };
    mut((s) => ({ inv: [it, ...s.inv] }), "Item added", `${it.name} (${it.stock} in stock)`);
    setN({ ...n, name: "", price: "", stock: "" });
  };
  return (
    <>
      <form className="panel ad-add" onSubmit={add}>
        <h2>Add item</h2>
        <div className="ad-grid">
          <label className="fld">Name<input className="ad-in" value={n.name} onChange={(e) => setN({ ...n, name: e.target.value })} /></label>
          <label className="fld">Price (৳)<input className="ad-in" type="number" min="0" value={n.price} onChange={(e) => setN({ ...n, price: e.target.value })} /></label>
          <label className="fld">Stock<input className="ad-in" type="number" min="0" value={n.stock} onChange={(e) => setN({ ...n, stock: e.target.value })} /></label>
          <label className="fld">Category
            <select className="ad-in" value={n.cat} onChange={(e) => setN({ ...n, cat: e.target.value, sub: "" })}>{d.cats.map((x) => <option key={x.id}>{x.name}</option>)}</select>
          </label>
          <label className="fld">Sub-category
            <select className="ad-in" value={n.sub} onChange={(e) => setN({ ...n, sub: e.target.value })}><option value="">None</option>{subsOf(n.cat).map((x) => <option key={x}>{x}</option>)}</select>
          </label>
          <button className="btn btn-primary" type="submit">Add</button>
        </div>
      </form>
      <div className="ad-tools">
        <input className="search" type="search" placeholder="Search name or SKU" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="sort" value={c} onChange={(e) => setC(e.target.value)} aria-label="Filter by category">
          <option>All</option>{d.cats.map((x) => <option key={x.id}>{x.name}</option>)}
        </select>
      </div>
      {list.map((i) => (
        <div className="ad-item" key={i.id}>
          <div className="ad-head" style={{ cursor: "default" }}>
            <div><b>{i.name}</b><span>{i.sku}{i.sub ? ` · ${i.sub}` : ""}</span></div>
            {i.stock <= LOW && <span className="ad-b s-low">{i.stock === 0 ? "Out of stock" : "Low stock"}</span>}
          </div>
          <div className="ad-grid" style={{ marginTop: ".7rem" }}>
            <label className="fld">Price (৳)
              <input key={`${i.id}-${i.price}`} className="ad-in" type="number" min="0" defaultValue={i.price}
                onBlur={(e) => { const v = +e.target.value; if (v >= 0 && v !== i.price) patch(i, { price: v }, "Price changed", `${i.name}: ${money(i.price)} → ${money(v)}`); }} />
            </label>
            <div className="fld">Stock
              <div className="ad-step">
                <button type="button" aria-label="Decrease stock" onClick={() => step(i, -1)}>−</button>
                <span>{i.stock}</span>
                <button type="button" aria-label="Increase stock" onClick={() => step(i, 1)}>+</button>
              </div>
            </div>
            <label className="fld">Category
              <select className="ad-in" value={i.cat} onChange={(e) => patch(i, { cat: e.target.value, sub: "" }, "Category changed", `${i.name}: ${i.cat} → ${e.target.value}`)}>
                {d.cats.map((x) => <option key={x.id}>{x.name}</option>)}
              </select>
            </label>
            <label className="fld">Sub-category
              <select className="ad-in" value={i.sub} onChange={(e) => patch(i, { sub: e.target.value }, "Sub-category changed", `${i.name}: ${e.target.value || "None"}`)}>
                <option value="">None</option>{subsOf(i.cat).map((x) => <option key={x}>{x}</option>)}
              </select>
            </label>
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
          <button className="rm ad-danger" onClick={() => del(i)}>Delete item</button>
        </div>
      ))}
      {list.length === 0 && <div className="empty">No items found.</div>}
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
    if (d.inv.some((i) => i.cat === c.name)) return window.alert("Move or delete the items in this category first.");
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
            <div><b>{c.name}</b><span>{d.inv.filter((i) => i.cat === c.name).length} items · {c.subs.length} sub-categories</span></div>
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

function Audit({ d }) {
  const [q, setQ] = useState("");
  const list = d.log.filter((l) => (l.act + l.detail + l.who).toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <>
      <div className="ad-tools">
        <input className="search" type="search" placeholder="Search the log" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <p className="note" style={{ marginTop: 0, marginBottom: ".8rem" }}>Every change made here is recorded. Entries cannot be edited or deleted from this panel.</p>
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

function Panel({ products, cats, onBack, onOut }) {
  const [d, setD] = useState(() => read(products, cats));
  const [tab, setTab] = useState("orders");
  const [full, setFull] = useState(false);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(d)); setFull(false); } catch { setFull(true); } }, [d]);
  const mut = (fn, act, detail) => setD((s) => ({ ...s, ...fn(s), log: [entry(act, detail), ...s.log].slice(0, 500) }));
  const revenue = d.orders.filter((o) => o.status !== "Cancelled").reduce((a, o) => a + o.total, 0);
  const stats = [
    ["Orders", d.orders.length],
    ["Revenue", money(revenue)],
    ["Low stock", d.inv.filter((i) => i.stock <= LOW).length],
    ["Reviews to check", d.reviews.filter((r) => r.status === "Pending").length],
  ];
  const tabs = [["orders", "Orders"], ["inventory", "Inventory"], ["categories", "Categories"], ["reviews", "Reviews"], ["audit", "Audit log"]];
  return (
    <main className="wrap ad">
      <div className="ad-top">
        <h1>Admin panel</h1>
        <div className="ad-acts">
          <button className="btn btn-ghost" onClick={onBack}>View shop</button>
          <button className="btn btn-ghost" onClick={() => { pushLog("Signed out", "Admin panel closed"); onOut(); }}>Sign out</button>
        </div>
      </div>
      {full && <p className="note ad-warn">Browser storage is full, so the latest change is not saved. Remove a few photos.</p>}
      <div className="ad-stats">{stats.map(([l, v]) => <div className="ad-stat" key={l}><b>{v}</b><span>{l}</span></div>)}</div>
      <div className="filters ad-tabs" role="tablist">
        {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={`pill ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {tab === "orders" && <Orders d={d} mut={mut} />}
      {tab === "inventory" && <Inventory d={d} mut={mut} />}
      {tab === "categories" && <Categories d={d} mut={mut} />}
      {tab === "reviews" && <Reviews d={d} mut={mut} />}
      {tab === "audit" && <Audit d={d} />}
    </main>
  );
}

export default function Admin({ products, cats, onBack }) {
  const [ok, setOk] = useState(() => { try { return sessionStorage.getItem(OK) === "1"; } catch { return false; } });
  const [pw, setPw] = useState("");
  const [bad, setBad] = useState(false);
  const submit = (e) => {
    e.preventDefault();
    if (pw === ADMIN_PASS) {
      try { sessionStorage.setItem(OK, "1"); } catch {}
      pushLog("Signed in", "Admin panel opened");
      setOk(true);
    } else {
      pushLog("Failed sign-in", "Wrong passcode entered", "Unknown");
      setBad(true);
    }
  };
  const out = () => { try { sessionStorage.removeItem(OK); } catch {} setOk(false); setPw(""); };
  return (
    <>
      <style>{css}</style>
      {ok ? (
        <Panel products={products} cats={cats} onBack={onBack} onOut={out} />
      ) : (
        <main className="wrap">
          <form className="panel ad-gate" onSubmit={submit}>
            <h2>Admin sign-in</h2>
            <label className={`fld ${bad ? "bad" : ""}`}>Passcode
              <input type="password" value={pw} autoComplete="current-password" onChange={(e) => { setPw(e.target.value); setBad(false); }} />
              {bad && <small>Wrong passcode</small>}
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
.ad-stat{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:1rem}
.ad-stat b{display:block;font-family:'Bricolage Grotesque','Hind Siliguri',sans-serif;font-size:1.4rem}
.ad-stat span{color:var(--muted);font-size:.82rem}
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
.ad-line{display:flex;justify-content:space-between;gap:1rem}
.ad-b{display:inline-block;padding:.15rem .6rem;border-radius:99px;font-size:.74rem;font-weight:700;border:1px solid currentColor;white-space:nowrap}
.s-pending{color:#e0a93b}.s-processing{color:#5aa9e6}.s-shipped{color:#9b7ce6}
.s-delivered,.s-approved{color:#3dbb7a}.s-cancelled,.s-rejected,.s-low{color:#C0503F}
.ad-in{padding:.65rem .8rem;border-radius:12px;border:1px solid var(--line);background:var(--surface2);color:var(--text);font:inherit;font-size:.95rem;width:100%}
.ad-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.7rem;align-items:end}
.ad-step{display:inline-flex;align-items:center;justify-content:space-between;gap:.5rem;background:var(--surface2);border:1px solid var(--line);border-radius:12px;padding:.25rem .4rem}
.ad-step button{width:32px;height:32px;border-radius:9px;font-weight:700}
.ad-step span{min-width:2rem;text-align:center;font-weight:700;color:var(--text)}
.ad-chips{display:flex;gap:.4rem;flex-wrap:wrap;margin:.7rem 0}
.ad-chip{display:inline-flex;align-items:center;gap:.3rem;background:var(--surface2);border:1px solid var(--line);border-radius:99px;padding:.25rem .4rem .25rem .8rem;font-size:.86rem}
.ad-chip button{width:22px;height:22px;border-radius:50%;color:var(--muted)}
.ad-danger{color:#C0503F!important;margin-top:.6rem}
.ad-log{display:grid;grid-template-columns:110px 1fr;gap:.2rem .8rem;padding:.7rem 0;border-bottom:1px solid var(--line);font-size:.9rem}
.ad-log time{color:var(--muted);font-size:.8rem}
.ad-photos{display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.9rem}
.ad-ph{position:relative;width:78px;height:78px;border-radius:12px;overflow:hidden;border:1px solid var(--line);background:var(--surface2)}
.ad-ph img{width:100%;height:100%;object-fit:cover;display:block}
.ad-ph em{position:absolute;left:4px;bottom:4px;font-style:normal;font-size:.68rem;font-weight:700;background:rgba(0,0,0,.7);color:#fff;border-radius:99px;padding:.1rem .45rem}
.ad-ph button{position:absolute;width:24px;height:24px;border-radius:50%;background:rgba(0,0,0,.7);color:#fff;line-height:1}
.ad-ph .x{top:4px;right:4px}.ad-ph .m{left:4px;bottom:4px}
.ad-up{display:flex;align-items:center;justify-content:center;border-style:dashed;color:var(--muted);font-size:.8rem;font-weight:600;cursor:pointer;text-align:center}
.ad-warn{color:#C0503F;margin:0 0 1rem}
@media (max-width:640px){.ad-stats{grid-template-columns:repeat(2,1fr)}.ad-log{grid-template-columns:1fr}.ad-tools .btn{flex:1}}
`;
