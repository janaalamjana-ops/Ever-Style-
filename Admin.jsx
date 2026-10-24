import { useEffect, useMemo, useState } from "react";

/* ============================================================
   EVER STYLE — MODERN ADMIN PANEL
   Front-end / localStorage demo version

   OWNER LOGIN
   Email: owner@everstyle.store
   Password: mohonchura-admin

   IMPORTANT:
   For production, move authentication/data to a backend.
============================================================ */

const ADMIN_EMAIL = "owner@everstyle.store";
const ADMIN_PASS = "mohonchura-admin";

const KEY = "ever_style_admin_v3";
const SESSION_KEY = "ever_style_admin_session_v3";
const LOW_STOCK = 5;

const ORDER_STATUSES = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "▦", group: "Overview" },

  { id: "orders", label: "Orders", icon: "◫", group: "Commerce" },
  { id: "products", label: "Products", icon: "◇", group: "Commerce" },
  { id: "inventory", label: "Inventory", icon: "▤", group: "Commerce" },
  { id: "categories", label: "Categories", icon: "⌘", group: "Commerce" },

  { id: "customers", label: "Customers", icon: "◎", group: "Customers" },
  { id: "reviews", label: "Reviews", icon: "★", group: "Customers" },

  { id: "hero", label: "Hero / Banners", icon: "▧", group: "Marketing" },
  { id: "coupons", label: "Coupons", icon: "%", group: "Marketing" },

  { id: "team", label: "Team Access", icon: "♙", group: "System" },
  { id: "audit", label: "Audit Log", icon: "◷", group: "System" },
];

const ALL_TABS = NAV.map((x) => x.id);

const ROLES = {
  Owner: ALL_TABS,
  Manager: ALL_TABS.filter((x) => x !== "team"),
  Support: ["dashboard", "orders", "customers", "reviews"],
  Editor: [
    "dashboard",
    "products",
    "inventory",
    "categories",
    "hero",
  ],
};

const OWNER = {
  id: "OWNER-1",
  name: "Owner",
  email: ADMIN_EMAIL,
  role: "Owner",
  pass: ADMIN_PASS,
  active: true,
};

const money = (value = 0) =>
  `৳${Number(value || 0).toLocaleString("en-BD")}`;

const uid = (prefix = "ID") =>
  `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

const now = () => new Date().toISOString();

const ago = (hours) =>
  new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const logEntry = (action, detail, who = "Admin") => ({
  id: uid("LOG"),
  action,
  detail,
  who,
  time: now(),
});

/* ============================================================
   DEFAULT DATA
============================================================ */

const DEFAULT_COUPONS = [
  {
    id: "COUPON-1",
    code: "EVERSTYLE15",
    type: "pct",
    value: 15,
    min: 0,
    expires: "",
    limit: 0,
    used: 0,
    active: true,
  },
  {
    id: "COUPON-2",
    code: "WELCOME200",
    type: "flat",
    value: 200,
    min: 2000,
    expires: "",
    limit: 100,
    used: 0,
    active: true,
  },
];

function createSeed(products = [], cats = [], slides = []) {
  const subCategories = {
    Audio: ["Headphones", "Speakers"],
    Fashion: ["Shoes", "Bags"],
    Tech: ["Laptop", "Phone"],
  };

  return {
    categories: cats
      .filter((x) => x !== "All")
      .map((name, index) => ({
        id: `CAT-${index}`,
        name,
        subs: subCategories[name] || [],
      })),

    products: products.map((product, index) => ({
      id: product.id ?? uid("P"),
      name: product.name || "Unnamed product",
      sku:
        product.sku ||
        `ES-${String(index + 1).padStart(4, "0")}`,
      category: product.cat || "",
      subcategory: "",
      price: Number(product.price || 0),
      stock: product.stock ?? 10,
      low: LOW_STOCK,
      tag: product.tag || "",
      active: true,
      images: product.images || (product.image ? [product.image] : []),
    })),

    orders: [
      {
        id: "ES-4F2K9A",
        name: "Rafi Ahmed",
        phone: "01711000001",
        email: "",
        address: "Dhanmondi, Dhaka",
        items: [
          {
            name: "Aura Wireless Headphones",
            qty: 1,
            price: 12990,
          },
        ],
        total: 12990,
        payment: "Card",
        status: "Pending",
        time: ago(3),
      },
      {
        id: "ES-7B1Q3C",
        name: "Nusrat Jahan",
        phone: "01811000002",
        email: "",
        address: "Agrabad, Chattogram",
        items: [
          {
            name: "Velo Runner Sneakers",
            qty: 2,
            price: 5490,
          },
        ],
        total: 10980,
        payment: "Cash on delivery",
        status: "Processing",
        time: ago(20),
      },
      {
        id: "ES-2D8M5X",
        name: "Tanvir Hasan",
        phone: "01911000003",
        email: "",
        address: "Sylhet",
        items: [
          {
            name: "Zen Mechanical Keyboard",
            qty: 1,
            price: 6990,
          },
        ],
        total: 6990,
        payment: "Card",
        status: "Shipped",
        time: ago(50),
      },
    ],

    reviews: [
      {
        id: "REV-1",
        product: "Aura Wireless Headphones",
        author: "Rafi Ahmed",
        rating: 5,
        text: "Excellent quality and fast delivery.",
        status: "Approved",
        time: ago(50),
      },
      {
        id: "REV-2",
        product: "Velo Runner Sneakers",
        author: "Nusrat Jahan",
        rating: 4,
        text: "Very nice product. Packaging was good.",
        status: "Pending",
        time: ago(10),
      },
    ],

    hero: slides.map((slide) => ({
      id: uid("HERO"),
      image: slide.image || "",
      title: slide.l1 || "",
      title2: slide.l2 || "",
      description: slide.text || "",
      cta: slide.cta || "Shop now",
      category: slide.cat || "All",
      active: true,
    })),

    coupons: DEFAULT_COUPONS,

    team: [{ ...OWNER }],

    logs: [
      logEntry(
        "Admin initialized",
        "Admin panel data created.",
        "System"
      ),
    ],
  };
}

/* ============================================================
   STORAGE
============================================================ */

function getStored() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || null;
  } catch {
    return null;
  }
}

function ensureOwner(data) {
  if (!data) return data;

  let team = Array.isArray(data.team) ? [...data.team] : [];

  const index = team.findIndex(
    (user) =>
      user.id === OWNER.id ||
      String(user.email || "").toLowerCase() ===
        ADMIN_EMAIL.toLowerCase()
  );

  if (index === -1) {
    team.unshift({ ...OWNER });
  } else {
    team[index] = {
      ...team[index],
      id: OWNER.id,
      email: ADMIN_EMAIL,
      role: "Owner",
      pass: ADMIN_PASS,
      active: true,
    };
  }

  return { ...data, team };
}

function loadData(products, cats, slides) {
  const seed = createSeed(products, cats, slides);
  const saved = getStored();

  if (!saved) {
    const data = ensureOwner(seed);

    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {}

    return data;
  }

  const data = ensureOwner({
    ...seed,
    ...saved,

    products: Array.isArray(saved.products)
      ? saved.products
      : seed.products,

    categories: Array.isArray(saved.categories)
      ? saved.categories
      : seed.categories,

    orders: Array.isArray(saved.orders)
      ? saved.orders
      : seed.orders,

    reviews: Array.isArray(saved.reviews)
      ? saved.reviews
      : seed.reviews,

    hero: Array.isArray(saved.hero) ? saved.hero : seed.hero,

    coupons: Array.isArray(saved.coupons)
      ? saved.coupons
      : seed.coupons,

    team: Array.isArray(saved.team) ? saved.team : seed.team,

    logs: Array.isArray(saved.logs) ? saved.logs : seed.logs,
  });

  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}

  return data;
}

/* ============================================================
   STOREFRONT EXPORTS
============================================================ */

export function saveOrder(order) {
  try {
    const data = getStored() || {};

    const nextOrder = {
      ...order,
      time: order.time || order.ts || now(),
      payment: order.payment || order.pay || "Unknown",
    };

    data.orders = [nextOrder, ...(data.orders || [])];

    if (order.coupon) {
      data.coupons = (data.coupons || DEFAULT_COUPONS).map((c) =>
        c.code === order.coupon
          ? { ...c, used: (c.used || 0) + 1 }
          : c
      );
    }

    data.logs = [
      logEntry(
        "New order",
        `${order.id} · ${money(order.total)}`,
        "Customer"
      ),
      ...(data.logs || []),
    ].slice(0, 500);

    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
}

export function findCoupon(code, subtotal) {
  const data = getStored();

  const coupon = (data?.coupons || DEFAULT_COUPONS).find(
    (item) =>
      item.code.toUpperCase() ===
      String(code || "").trim().toUpperCase()
  );

  if (!coupon || !coupon.active) return null;

  if (
    coupon.expires &&
    new Date(`${coupon.expires}T23:59:59`) < new Date()
  )
    return null;

  if (
    coupon.limit &&
    Number(coupon.used || 0) >= Number(coupon.limit)
  )
    return null;

  if (subtotal < Number(coupon.min || 0)) return null;

  return coupon;
}

export function couponValue(coupon, subtotal) {
  if (!coupon) return 0;

  if (coupon.type === "pct") {
    return Math.round((subtotal * coupon.value) / 100);
  }

  return Math.min(Number(coupon.value || 0), subtotal);
}

export function applyAdminCatalog(products, slides, cats) {
  try {
    const data = getStored();
    if (!data) return;

    if (Array.isArray(data.products)) {
      const next = [];

      data.products.forEach((item) => {
        if (item.active === false) return;

        const original =
          products.find((x) => x.id === item.id) || {
            id: item.id,
            rating: 4.5,
          };

        next.push({
          ...original,
          id: item.id,
          name: item.name,
          cat: item.category,
          price: item.price,
          tag: item.tag || undefined,
          images: item.images || [],
          image: item.images?.[0] || original.image,
        });
      });

      products.splice(0, products.length, ...next);
    }

    if (Array.isArray(data.categories)) {
      cats.splice(
        0,
        cats.length,
        "All",
        ...data.categories.map((x) => x.name)
      );
    }

    if (Array.isArray(data.hero) && slides) {
      slides.splice(
        0,
        slides.length,
        ...data.hero
          .filter((x) => x.active !== false && x.image)
          .map((x) => ({
            image: x.image,
            l1: x.title,
            l2: x.title2,
            text: x.description,
            cta: x.cta,
            cat: x.category,
          }))
      );
    }
  } catch {}
}

/* ============================================================
   IMAGE COMPRESS
============================================================ */

function compressImage(file, max = 1000, quality = 0.76) {
  return new Promise((resolve) => {
    if (!file) return resolve(null);

    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const ratio = Math.min(
          1,
          max / Math.max(image.width, image.height)
        );

        const canvas = document.createElement("canvas");

        canvas.width = Math.round(image.width * ratio);
        canvas.height = Math.round(image.height * ratio);

        const ctx = canvas.getContext("2d");

        ctx.drawImage(
          image,
          0,
          0,
          canvas.width,
          canvas.height
        );

        resolve(canvas.toDataURL("image/jpeg", quality));
      };

      image.onerror = () => resolve(null);
      image.src = reader.result;
    };

    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/* ============================================================
   REUSABLE UI
============================================================ */

function Icon({ children }) {
  return <span className="ea-icon">{children}</span>;
}

function Field({ label, children }) {
  return (
    <label className="ea-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Status({ children }) {
  const key = String(children || "")
    .toLowerCase()
    .replace(/\s/g, "-");

  return (
    <span className={`ea-status status-${key}`}>
      <i />
      {children}
    </span>
  );
}

function Empty({ title, text }) {
  return (
    <div className="ea-empty">
      <div className="ea-empty-icon">◇</div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
    </div>
  );
}

function Modal({ title, children, onClose, wide = false }) {
  return (
    <div
      className="ea-modal-bg"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`ea-modal ${wide ? "wide" : ""}`}>
        <div className="ea-modal-head">
          <div>
            <span className="ea-eyebrow">Ever Style Admin</span>
            <h2>{title}</h2>
          </div>

          <button
            type="button"
            className="ea-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="ea-modal-body">{children}</div>
      </div>
    </div>
  );
}

/* ============================================================
   CUSTOMERS HELPER
============================================================ */

function getCustomers(data) {
  const map = {};

  data.orders.forEach((order) => {
    const key =
      order.phone ||
      order.email ||
      `${order.name}-${order.address}`;

    if (!map[key]) {
      map[key] = {
        key,
        name: order.name,
        phone: order.phone,
        email: order.email,
        address: order.address,
        orders: [],
        spent: 0,
      };
    }

    map[key].orders.push(order);

    if (order.status !== "Cancelled") {
      map[key].spent += Number(order.total || 0);
    }
  });

  return Object.values(map).sort(
    (a, b) => b.spent - a.spent
  );
}

/* ============================================================
   DASHBOARD
============================================================ */

function Dashboard({ data, setTab }) {
  const validOrders = data.orders.filter(
    (x) => x.status !== "Cancelled"
  );

  const revenue = validOrders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const customers = getCustomers(data);

  const low = data.products.filter(
    (x) => Number(x.stock) <= Number(x.low ?? LOW_STOCK)
  );

  const pending = data.orders.filter(
    (x) => x.status === "Pending"
  ).length;

  const stats = [
    {
      label: "Total revenue",
      value: money(revenue),
      icon: "৳",
      tab: "orders",
      note: "All non-cancelled orders",
    },
    {
      label: "Total orders",
      value: data.orders.length,
      icon: "◫",
      tab: "orders",
      note: `${pending} waiting`,
    },
    {
      label: "Customers",
      value: customers.length,
      icon: "◎",
      tab: "customers",
      note: "Unique customers",
    },
    {
      label: "Low stock",
      value: low.length,
      icon: "!",
      tab: "inventory",
      note: "Needs attention",
    },
  ];

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();

    date.setDate(date.getDate() - (6 - index));

    const value = validOrders
      .filter(
        (order) =>
          new Date(order.time || order.ts).toDateString() ===
          date.toDateString()
      )
      .reduce(
        (sum, order) => sum + Number(order.total || 0),
        0
      );

    return {
      day: date.toLocaleDateString("en-GB", {
        weekday: "short",
      }),
      value,
    };
  });

  const max = Math.max(...days.map((x) => x.value), 1);

  return (
    <div className="ea-page">
      <section className="ea-stats">
        {stats.map((item) => (
          <button
            type="button"
            key={item.label}
            className="ea-stat"
            onClick={() => setTab(item.tab)}
          >
            <div className="ea-stat-top">
              <span className="ea-stat-icon">{item.icon}</span>
              <span className="ea-stat-arrow">↗</span>
            </div>

            <strong>{item.value}</strong>
            <h3>{item.label}</h3>
            <p>{item.note}</p>
          </button>
        ))}
      </section>

      <section className="ea-dashboard-grid">
        <div className="ea-card ea-chart-card">
          <div className="ea-card-head">
            <div>
              <span className="ea-eyebrow">Performance</span>
              <h2>Sales overview</h2>
            </div>

            <span className="ea-soft-badge">Last 7 days</span>
          </div>

          <div className="ea-chart">
            {days.map((item) => (
              <div className="ea-chart-col" key={item.day}>
                <div className="ea-bar-space">
                  <div
                    className="ea-chart-bar"
                    style={{
                      height: `${Math.max(
                        5,
                        (item.value / max) * 100
                      )}%`,
                    }}
                    title={money(item.value)}
                  />
                </div>

                <span>{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ea-card">
          <div className="ea-card-head">
            <div>
              <span className="ea-eyebrow">Orders</span>
              <h2>Recent orders</h2>
            </div>

            <button
              className="ea-text-btn"
              onClick={() => setTab("orders")}
            >
              View all →
            </button>
          </div>

          <div className="ea-mini-list">
            {data.orders.slice(0, 5).map((order) => (
              <div className="ea-mini-order" key={order.id}>
                <div className="ea-avatar">
                  {order.name?.[0]?.toUpperCase() || "C"}
                </div>

                <div className="ea-mini-main">
                  <b>{order.name}</b>
                  <span>{order.id}</span>
                </div>

                <div className="ea-mini-right">
                  <b>{money(order.total)}</b>
                  <Status>{order.status}</Status>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ea-card">
        <div className="ea-card-head">
          <div>
            <span className="ea-eyebrow">Inventory</span>
            <h2>Stock attention</h2>
          </div>

          <button
            className="ea-text-btn"
            onClick={() => setTab("inventory")}
          >
            Manage inventory →
          </button>
        </div>

        {low.length === 0 ? (
          <Empty
            title="Stock looks good"
            text="There are no low-stock products."
          />
        ) : (
          <div className="ea-table-wrap">
            <table className="ea-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Stock</th>
                </tr>
              </thead>

              <tbody>
                {low.slice(0, 6).map((product) => (
                  <tr key={product.id}>
                    <td>
                      <b>{product.name}</b>
                    </td>
                    <td>{product.sku}</td>
                    <td>{product.category}</td>
                    <td>
                      <Status>
                        {product.stock === 0
                          ? "Out of stock"
                          : "Low stock"}
                      </Status>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/* ============================================================
   ORDERS
============================================================ */

function Orders({ data, update }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);

  const orders = data.orders.filter((order) => {
    const matchFilter =
      filter === "All" || order.status === filter;

    const text = `${order.id} ${order.name} ${
      order.phone || ""
    }`.toLowerCase();

    return (
      matchFilter &&
      text.includes(query.trim().toLowerCase())
    );
  });

  const changeStatus = (order, status) => {
    update(
      (state) => ({
        orders: state.orders.map((x) =>
          x.id === order.id ? { ...x, status } : x
        ),
      }),
      "Order status updated",
      `${order.id}: ${order.status} → ${status}`
    );

    setSelected((current) =>
      current?.id === order.id
        ? { ...current, status }
        : current
    );
  };

  return (
    <>
      <div className="ea-toolbar">
        <div className="ea-search">
          <span>⌕</span>
          <input
            placeholder="Search order, customer or phone..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <select
          className="ea-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {["All", ...ORDER_STATUSES].map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </div>

      <div className="ea-card no-pad">
        <div className="ea-table-wrap">
          <table className="ea-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <b>{order.id}</b>
                  </td>

                  <td>
                    <b>{order.name}</b>
                    <small>{order.phone}</small>
                  </td>

                  <td>{formatDate(order.time || order.ts)}</td>

                  <td>{order.payment || order.pay}</td>

                  <td>
                    <b>{money(order.total)}</b>
                  </td>

                  <td>
                    <Status>{order.status}</Status>
                  </td>

                  <td className="right">
                    <button
                      className="ea-icon-btn"
                      onClick={() => setSelected(order)}
                    >
                      →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!orders.length && (
          <Empty
            title="No orders found"
            text="Try changing your search or filter."
          />
        )}
      </div>

      {selected && (
        <Modal
          title={`Order ${selected.id}`}
          onClose={() => setSelected(null)}
          wide
        >
          <div className="ea-order-summary">
            <div>
              <span>Customer</span>
              <b>{selected.name}</b>
            </div>

            <div>
              <span>Total</span>
              <b>{money(selected.total)}</b>
            </div>

            <div>
              <span>Payment</span>
              <b>{selected.payment || selected.pay}</b>
            </div>

            <div>
              <span>Placed</span>
              <b>{formatDate(selected.time || selected.ts)}</b>
            </div>
          </div>

          <div className="ea-detail-grid">
            <div className="ea-subcard">
              <h3>Order items</h3>

              {(selected.items || []).map((item, index) => (
                <div className="ea-line" key={index}>
                  <div>
                    <b>{item.name}</b>
                    <span>Qty: {item.qty}</span>
                  </div>

                  <b>{money(item.qty * item.price)}</b>
                </div>
              ))}

              {selected.coupon && (
                <div className="ea-line">
                  <span>Coupon: {selected.coupon}</span>
                  <b>−{money(selected.discount || 0)}</b>
                </div>
              )}
            </div>

            <div className="ea-subcard">
              <h3>Customer details</h3>

              <div className="ea-info">
                <span>Phone</span>
                <b>{selected.phone || "—"}</b>
              </div>

              <div className="ea-info">
                <span>Email</span>
                <b>{selected.email || "—"}</b>
              </div>

              <div className="ea-info">
                <span>Address</span>
                <b>{selected.address || "—"}</b>
              </div>

              <Field label="Order status">
                <select
                  className="ea-input"
                  value={selected.status}
                  onChange={(e) =>
                    changeStatus(selected, e.target.value)
                  }
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ============================================================
   PRODUCTS
============================================================ */

const PRODUCT_TAGS = [
  "",
  "New",
  "Sale",
  "Best seller",
  "Top rated",
];

function ProductForm({
  categories,
  initial,
  onSave,
  onClose,
}) {
  const [form, setForm] = useState(
    initial || {
      name: "",
      sku: "",
      price: "",
      stock: "",
      category: categories[0]?.name || "",
      subcategory: "",
      tag: "",
      active: true,
      images: [],
    }
  );

  const subs =
    categories.find((x) => x.name === form.category)?.subs ||
    [];

  const addImages = async (files) => {
    const urls = (
      await Promise.all(
        [...files]
          .slice(0, 4 - (form.images?.length || 0))
          .map((file) => compressImage(file))
      )
    ).filter(Boolean);

    setForm((x) => ({
      ...x,
      images: [...(x.images || []), ...urls].slice(0, 4),
    }));
  };

  const removeImage = (index) => {
    setForm((x) => ({
      ...x,
      images: x.images.filter((_, i) => i !== index),
    }));
  };

  const makeMain = (index) => {
    setForm((x) => {
      const images = [...x.images];
      const [image] = images.splice(index, 1);
      images.unshift(image);

      return { ...x, images };
    });
  };

  const submit = (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      return window.alert("Enter a product name.");
    }

    onSave({
      ...form,
      name: form.name.trim(),
      price: Number(form.price || 0),
      stock: Number(form.stock || 0),
      low: Number(form.low ?? LOW_STOCK),
      sku:
        form.sku?.trim() ||
        `ES-${Date.now().toString().slice(-6)}`,
    });
  };

  return (
    <form onSubmit={submit}>
      <div className="ea-product-editor">
        <div>
          <div className="ea-form-grid">
            <Field label="Product name">
              <input
                className="ea-input"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />
            </Field>

            <Field label="SKU">
              <input
                className="ea-input"
                placeholder="Auto generated"
                value={form.sku || ""}
                onChange={(e) =>
                  setForm({ ...form, sku: e.target.value })
                }
              />
            </Field>

            <Field label="Price (৳)">
              <input
                className="ea-input"
                type="number"
                min="0"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: e.target.value })
                }
              />
            </Field>

            <Field label="Stock">
              <input
                className="ea-input"
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) =>
                  setForm({ ...form, stock: e.target.value })
                }
              />
            </Field>

            <Field label="Category">
              <select
                className="ea-input"
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value,
                    subcategory: "",
                  })
                }
              >
                <option value="">Select category</option>

                {categories.map((cat) => (
                  <option key={cat.id}>{cat.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Sub-category">
              <select
                className="ea-input"
                value={form.subcategory || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    subcategory: e.target.value,
                  })
                }
              >
                <option value="">None</option>

                {subs.map((sub) => (
                  <option key={sub}>{sub}</option>
                ))}
              </select>
            </Field>

            <Field label="Product label">
              <select
                className="ea-input"
                value={form.tag || ""}
                onChange={(e) =>
                  setForm({ ...form, tag: e.target.value })
                }
              >
                {PRODUCT_TAGS.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag || "None"}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Visibility">
              <select
                className="ea-input"
                value={form.active === false ? "hidden" : "visible"}
                onChange={(e) =>
                  setForm({
                    ...form,
                    active: e.target.value === "visible",
                  })
                }
              >
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="ea-image-box">
          <h3>Product images</h3>
          <p>Upload up to 4 product images.</p>

          <div className="ea-product-images">
            {(form.images || []).map((image, index) => (
              <div className="ea-product-image" key={index}>
                <img src={image} alt="" />

                {index === 0 && (
                  <span className="ea-main-photo">Main</span>
                )}

                <button
                  type="button"
                  className="ea-photo-delete"
                  onClick={() => removeImage(index)}
                >
                  ×
                </button>

                {index !== 0 && (
                  <button
                    type="button"
                    className="ea-photo-main"
                    onClick={() => makeMain(index)}
                  >
                    ★
                  </button>
                )}
              </div>
            ))}

            {(form.images || []).length < 4 && (
              <label className="ea-upload">
                <b>＋</b>
                <span>Add image</span>

                <input
                  hidden
                  multiple
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    addImages(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="ea-modal-actions">
        <button
          type="button"
          className="ea-btn secondary"
          onClick={onClose}
        >
          Cancel
        </button>

        <button className="ea-btn primary" type="submit">
          Save product
        </button>
      </div>
    </form>
  );
}

function Products({ data, update }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [editor, setEditor] = useState(null);

  const products = data.products.filter((product) => {
    const matchCategory =
      category === "All" || product.category === category;

    const text = `${product.name} ${product.sku}`.toLowerCase();

    return (
      matchCategory &&
      text.includes(query.trim().toLowerCase())
    );
  });

  const save = (product) => {
    if (editor?.mode === "edit") {
      update(
        (state) => ({
          products: state.products.map((x) =>
            x.id === editor.product.id
              ? { ...x, ...product }
              : x
          ),
        }),
        "Product updated",
        product.name
      );
    } else {
      const item = {
        ...product,
        id: uid("PRODUCT"),
        low: LOW_STOCK,
      };

      update(
        (state) => ({
          products: [item, ...state.products],
        }),
        "Product added",
        item.name
      );
    }

    setEditor(null);
  };

  const remove = (product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;

    update(
      (state) => ({
        products: state.products.filter(
          (x) => x.id !== product.id
        ),
      }),
      "Product deleted",
      product.name
    );
  };

  return (
    <>
      <div className="ea-toolbar">
        <div className="ea-search">
          <span>⌕</span>
          <input
            placeholder="Search products or SKU..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <select
          className="ea-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option>All</option>

          {data.categories.map((cat) => (
            <option key={cat.id}>{cat.name}</option>
          ))}
        </select>

        <button
          className="ea-btn primary"
          onClick={() => setEditor({ mode: "new" })}
        >
          ＋ Add product
        </button>
      </div>

      <div className="ea-product-grid">
        {products.map((product) => (
          <article className="ea-product-card" key={product.id}>
            <div className="ea-product-thumb">
              {product.images?.[0] ? (
                <img src={product.images[0]} alt={product.name} />
              ) : (
                <div className="ea-no-photo">◇</div>
              )}

              <span
                className={`ea-product-state ${
                  product.active === false ? "hidden" : ""
                }`}
              >
                {product.active === false ? "Hidden" : "Live"}
              </span>
            </div>

            <div className="ea-product-body">
              <div className="ea-product-title">
                <div>
                  <h3>{product.name}</h3>
                  <span>{product.sku}</span>
                </div>

                {product.tag && (
                  <span className="ea-tag">{product.tag}</span>
                )}
              </div>

              <div className="ea-product-meta">
                <div>
                  <span>Price</span>
                  <b>{money(product.price)}</b>
                </div>

                <div>
                  <span>Stock</span>
                  <b>{product.stock}</b>
                </div>

                <div>
                  <span>Category</span>
                  <b>{product.category || "—"}</b>
                </div>
              </div>

              <div className="ea-product-actions">
                <button
                  className="ea-btn secondary"
                  onClick={() =>
                    setEditor({
                      mode: "edit",
                      product,
                    })
                  }
                >
                  Edit
                </button>

                <button
                  className="ea-btn danger"
                  onClick={() => remove(product)}
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {!products.length && (
        <Empty
          title="No products found"
          text="Add a product or change your search."
        />
      )}

      {editor && (
        <Modal
          wide
          title={
            editor.mode === "edit"
              ? "Edit product"
              : "Add new product"
          }
          onClose={() => setEditor(null)}
        >
          <ProductForm
            categories={data.categories}
            initial={editor.product}
            onSave={save}
            onClose={() => setEditor(null)}
          />
        </Modal>
      )}
    </>
  );
}

/* ============================================================
   INVENTORY
============================================================ */

function Inventory({ data, update }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");

  const products = data.products.filter((product) => {
    const text = `${product.name} ${product.sku}`.toLowerCase();

    const searchMatch = text.includes(
      query.trim().toLowerCase()
    );

    let filterMatch = true;

    if (filter === "Low stock") {
      filterMatch =
        product.stock > 0 &&
        product.stock <= (product.low ?? LOW_STOCK);
    }

    if (filter === "Out of stock") {
      filterMatch = product.stock === 0;
    }

    return searchMatch && filterMatch;
  });

  const setStock = (product, stock) => {
    stock = Math.max(0, Number(stock || 0));

    update(
      (state) => ({
        products: state.products.map((x) =>
          x.id === product.id ? { ...x, stock } : x
        ),
      }),
      "Inventory adjusted",
      `${product.name}: ${product.stock} → ${stock}`
    );
  };

  const setLow = (product, low) => {
    low = Math.max(0, Number(low || 0));

    update(
      (state) => ({
        products: state.products.map((x) =>
          x.id === product.id ? { ...x, low } : x
        ),
      }),
      "Low stock level updated",
      `${product.name}: ${low}`
    );
  };

  const totalUnits = data.products.reduce(
    (sum, x) => sum + Number(x.stock || 0),
    0
  );

  return (
    <>
      <div className="ea-mini-stats">
        <div>
          <span>Total products</span>
          <b>{data.products.length}</b>
        </div>

        <div>
          <span>Units in stock</span>
          <b>{totalUnits}</b>
        </div>

        <div>
          <span>Low stock</span>
          <b>
            {
              data.products.filter(
                (x) =>
                  x.stock <= (x.low ?? LOW_STOCK)
              ).length
            }
          </b>
        </div>
      </div>

      <div className="ea-toolbar">
        <div className="ea-search">
          <span>⌕</span>
          <input
            placeholder="Search inventory..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <select
          className="ea-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option>All</option>
          <option>Low stock</option>
          <option>Out of stock</option>
        </select>
      </div>

      <div className="ea-card no-pad">
        <div className="ea-table-wrap">
          <table className="ea-table inventory-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Status</th>
                <th>Quick adjust</th>
                <th>Exact stock</th>
                <th>Low alert</th>
              </tr>
            </thead>

            <tbody>
              {products.map((product) => {
                const low =
                  product.stock <=
                  (product.low ?? LOW_STOCK);

                return (
                  <tr key={product.id}>
                    <td>
                      <b>{product.name}</b>
                      <small>{product.category}</small>
                    </td>

                    <td>{product.sku}</td>

                    <td>
                      {low ? (
                        <Status>
                          {product.stock === 0
                            ? "Out of stock"
                            : "Low stock"}
                        </Status>
                      ) : (
                        <Status>In stock</Status>
                      )}
                    </td>

                    <td>
                      <div className="ea-stepper">
                        <button
                          onClick={() =>
                            setStock(
                              product,
                              product.stock - 1
                            )
                          }
                        >
                          −
                        </button>

                        <b>{product.stock}</b>

                        <button
                          onClick={() =>
                            setStock(
                              product,
                              product.stock + 1
                            )
                          }
                        >
                          +
                        </button>
                      </div>
                    </td>

                    <td>
                      <input
                        key={`${product.id}-${product.stock}`}
                        className="ea-small-input"
                        type="number"
                        min="0"
                        defaultValue={product.stock}
                        onBlur={(e) =>
                          setStock(product, e.target.value)
                        }
                      />
                    </td>

                    <td>
                      <input
                        key={`${product.id}-${product.low}`}
                        className="ea-small-input"
                        type="number"
                        min="0"
                        defaultValue={
                          product.low ?? LOW_STOCK
                        }
                        onBlur={(e) =>
                          setLow(product, e.target.value)
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ============================================================
   CATEGORIES
============================================================ */

function Categories({ data, update }) {
  const [name, setName] = useState("");
  const [subs, setSubs] = useState({});

  const addCategory = (e) => {
    e.preventDefault();

    const value = name.trim();

    if (!value) return;

    if (
      data.categories.some(
        (x) =>
          x.name.toLowerCase() === value.toLowerCase()
      )
    ) {
      return window.alert("Category already exists.");
    }

    update(
      (state) => ({
        categories: [
          ...state.categories,
          {
            id: uid("CAT"),
            name: value,
            subs: [],
          },
        ],
      }),
      "Category added",
      value
    );

    setName("");
  };

  const removeCategory = (category) => {
    if (
      data.products.some(
        (x) => x.category === category.name
      )
    ) {
      return window.alert(
        "Move or delete products from this category first."
      );
    }

    if (!window.confirm(`Delete "${category.name}"?`))
      return;

    update(
      (state) => ({
        categories: state.categories.filter(
          (x) => x.id !== category.id
        ),
      }),
      "Category deleted",
      category.name
    );
  };

  const addSub = (category) => {
    const value = (subs[category.id] || "").trim();

    if (!value) return;

    update(
      (state) => ({
        categories: state.categories.map((x) =>
          x.id === category.id
            ? {
                ...x,
                subs: [...(x.subs || []), value],
              }
            : x
        ),
      }),
      "Sub-category added",
      `${category.name} → ${value}`
    );

    setSubs({
      ...subs,
      [category.id]: "",
    });
  };

  const removeSub = (category, sub) => {
    update(
      (state) => ({
        categories: state.categories.map((x) =>
          x.id === category.id
            ? {
                ...x,
                subs: x.subs.filter((s) => s !== sub),
              }
            : x
        ),

        products: state.products.map((product) =>
          product.category === category.name &&
          product.subcategory === sub
            ? { ...product, subcategory: "" }
            : product
        ),
      }),
      "Sub-category deleted",
      `${category.name} → ${sub}`
    );
  };

  return (
    <>
      <form className="ea-create-bar" onSubmit={addCategory}>
        <div>
          <span className="ea-eyebrow">Catalog</span>
          <h3>Create category</h3>
        </div>

        <input
          className="ea-input"
          placeholder="e.g. Fashion"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button className="ea-btn primary">
          ＋ Add category
        </button>
      </form>

      <div className="ea-category-grid">
        {data.categories.map((category) => (
          <div className="ea-card" key={category.id}>
            <div className="ea-card-head">
              <div>
                <h2>{category.name}</h2>
                <p>
                  {
                    data.products.filter(
                      (x) =>
                        x.category === category.name
                    ).length
                  }{" "}
                  products
                </p>
              </div>

              <button
                className="ea-icon-btn danger"
                onClick={() =>
                  removeCategory(category)
                }
              >
                ×
              </button>
            </div>

            <div className="ea-chips">
              {(category.subs || []).map((sub) => (
                <span className="ea-chip" key={sub}>
                  {sub}

                  <button
                    onClick={() =>
                      removeSub(category, sub)
                    }
                  >
                    ×
                  </button>
                </span>
              ))}

              {!category.subs?.length && (
                <span className="ea-muted">
                  No sub-categories
                </span>
              )}
            </div>

            <div className="ea-inline-add">
              <input
                className="ea-input"
                placeholder="New sub-category"
                value={subs[category.id] || ""}
                onChange={(e) =>
                  setSubs({
                    ...subs,
                    [category.id]: e.target.value,
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSub(category);
                  }
                }}
              />

              <button
                className="ea-btn secondary"
                onClick={() => addSub(category)}
              >
                Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ============================================================
   CUSTOMERS
============================================================ */

function Customers({ data }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  const customers = getCustomers(data).filter((customer) =>
    `${customer.name} ${customer.phone || ""} ${
      customer.email || ""
    }`
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );

  return (
    <>
      <div className="ea-toolbar">
        <div className="ea-search">
          <span>⌕</span>

          <input
            placeholder="Search customers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="ea-customer-grid">
        {customers.map((customer) => (
          <button
            className="ea-customer-card"
            key={customer.key}
            onClick={() => setSelected(customer)}
          >
            <div className="ea-customer-avatar">
              {customer.name?.[0]?.toUpperCase()}
            </div>

            <div className="ea-customer-name">
              <h3>{customer.name}</h3>
              <span>{customer.phone || customer.email}</span>
            </div>

            <div className="ea-customer-numbers">
              <div>
                <b>{customer.orders.length}</b>
                <span>Orders</span>
              </div>

              <div>
                <b>{money(customer.spent)}</b>
                <span>Spent</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {!customers.length && (
        <Empty
          title="No customers found"
          text="Customers appear after they place orders."
        />
      )}

      {selected && (
        <Modal
          title={selected.name}
          wide
          onClose={() => setSelected(null)}
        >
          <div className="ea-order-summary">
            <div>
              <span>Phone</span>
              <b>{selected.phone || "—"}</b>
            </div>

            <div>
              <span>Email</span>
              <b>{selected.email || "—"}</b>
            </div>

            <div>
              <span>Orders</span>
              <b>{selected.orders.length}</b>
            </div>

            <div>
              <span>Total spent</span>
              <b>{money(selected.spent)}</b>
            </div>
          </div>

          <div className="ea-subcard">
            <h3>Address</h3>
            <p>{selected.address || "No address"}</p>
          </div>

          <div className="ea-subcard">
            <h3>Order history</h3>

            {selected.orders.map((order) => (
              <div className="ea-line" key={order.id}>
                <div>
                  <b>{order.id}</b>
                  <span>
                    {formatDate(order.time || order.ts)}
                  </span>
                </div>

                <div className="right">
                  <b>{money(order.total)}</b>
                  <Status>{order.status}</Status>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}

/* ============================================================
   REVIEWS
============================================================ */

function Reviews({ data, update }) {
  const [filter, setFilter] = useState("All");

  const reviews = data.reviews.filter(
    (review) =>
      filter === "All" || review.status === filter
  );

  const change = (review, status) => {
    update(
      (state) => ({
        reviews: state.reviews.map((x) =>
          x.id === review.id ? { ...x, status } : x
        ),
      }),
      `Review ${status.toLowerCase()}`,
      `${review.author} · ${review.product}`
    );
  };

  const remove = (review) => {
    if (!window.confirm("Delete this review?")) return;

    update(
      (state) => ({
        reviews: state.reviews.filter(
          (x) => x.id !== review.id
        ),
      }),
      "Review deleted",
      review.product
    );
  };

  return (
    <>
      <div className="ea-filter-tabs">
        {["All", "Pending", "Approved", "Rejected"].map(
          (item) => (
            <button
              className={filter === item ? "active" : ""}
              key={item}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          )
        )}
      </div>

      <div className="ea-review-grid">
        {reviews.map((review) => (
          <article className="ea-review" key={review.id}>
            <div className="ea-review-top">
              <div className="ea-avatar">
                {review.author?.[0]?.toUpperCase()}
              </div>

              <div>
                <h3>{review.author}</h3>
                <span>
                  {formatDate(review.time || review.ts)}
                </span>
              </div>

              <Status>{review.status}</Status>
            </div>

            <div className="ea-stars">
              {"★".repeat(review.rating)}
              <span>
                {"★".repeat(5 - review.rating)}
              </span>
            </div>

            <b className="ea-review-product">
              {review.product}
            </b>

            <p>{review.text}</p>

            <div className="ea-review-actions">
              {review.status !== "Approved" && (
                <button
                  className="ea-btn primary"
                  onClick={() =>
                    change(review, "Approved")
                  }
                >
                  Approve
                </button>
              )}

              {review.status !== "Rejected" && (
                <button
                  className="ea-btn secondary"
                  onClick={() =>
                    change(review, "Rejected")
                  }
                >
                  Reject
                </button>
              )}

              <button
                className="ea-btn danger"
                onClick={() => remove(review)}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      {!reviews.length && (
        <Empty title="No reviews here" />
      )}
    </>
  );
}

/* ============================================================
   HERO / BANNER
============================================================ */

function Hero({ data, update }) {
  const add = () => {
    const slide = {
      id: uid("HERO"),
      image: "",
      title: "New season",
      title2: "New style",
      description: "",
      cta: "Shop now",
      category: "All",
      active: true,
    };

    update(
      (state) => ({
        hero: [...state.hero, slide],
      }),
      "Hero slide added",
      slide.title
    );
  };

  const patch = (slide, changes) => {
    update(
      (state) => ({
        hero: state.hero.map((x) =>
          x.id === slide.id ? { ...x, ...changes } : x
        ),
      }),
      "Hero slide updated",
      slide.title
    );
  };

  const addImage = async (slide, file) => {
    const image = await compressImage(file, 1600, 0.76);

    if (image) patch(slide, { image });
  };

  const remove = (slide) => {
    if (!window.confirm("Delete this hero slide?")) return;

    update(
      (state) => ({
        hero: state.hero.filter(
          (x) => x.id !== slide.id
        ),
      }),
      "Hero slide deleted",
      slide.title
    );
  };

  const move = (index, direction) => {
    const target = index + direction;

    if (target < 0 || target >= data.hero.length) return;

    update(
      (state) => {
        const hero = [...state.hero];

        [hero[index], hero[target]] = [
          hero[target],
          hero[index],
        ];

        return { hero };
      },
      "Hero reordered",
      `Slide ${index + 1}`
    );
  };

  return (
    <>
      <div className="ea-section-actions">
        <p>
          Manage the large banners shown at the top of your
          storefront.
        </p>

        <button className="ea-btn primary" onClick={add}>
          ＋ Add banner
        </button>
      </div>

      <div className="ea-hero-list">
        {data.hero.map((slide, index) => (
          <article className="ea-hero-card" key={slide.id}>
            <div className="ea-hero-preview">
              {slide.image ? (
                <img src={slide.image} alt="" />
              ) : (
                <div className="ea-hero-empty">
                  <b>16:9</b>
                  <span>Add a banner image</span>
                </div>
              )}

              <label className="ea-change-image">
                {slide.image ? "Change image" : "Upload image"}

                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    addImage(slide, e.target.files[0]);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>

            <div className="ea-hero-editor">
              <div className="ea-card-head">
                <div>
                  <span className="ea-eyebrow">
                    Banner {index + 1}
                  </span>
                  <h2>{slide.title || "Untitled"}</h2>
                </div>

                <div className="ea-row-buttons">
                  <button
                    className="ea-icon-btn"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    ↑
                  </button>

                  <button
                    className="ea-icon-btn"
                    disabled={
                      index === data.hero.length - 1
                    }
                    onClick={() => move(index, 1)}
                  >
                    ↓
                  </button>

                  <button
                    className="ea-icon-btn danger"
                    onClick={() => remove(slide)}
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="ea-form-grid">
                <Field label="Headline">
                  <input
                    className="ea-input"
                    defaultValue={slide.title}
                    onBlur={(e) =>
                      patch(slide, {
                        title: e.target.value,
                      })
                    }
                  />
                </Field>

                <Field label="Second line">
                  <input
                    className="ea-input"
                    defaultValue={slide.title2}
                    onBlur={(e) =>
                      patch(slide, {
                        title2: e.target.value,
                      })
                    }
                  />
                </Field>

                <Field label="Button text">
                  <input
                    className="ea-input"
                    defaultValue={slide.cta}
                    onBlur={(e) =>
                      patch(slide, {
                        cta: e.target.value,
                      })
                    }
                  />
                </Field>

                <Field label="Button category">
                  <select
                    className="ea-input"
                    value={slide.category || "All"}
                    onChange={(e) =>
                      patch(slide, {
                        category: e.target.value,
                      })
                    }
                  >
                    <option>All</option>

                    {data.categories.map((cat) => (
                      <option key={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Description">
                <textarea
                  className="ea-input"
                  rows="3"
                  defaultValue={slide.description}
                  onBlur={(e) =>
                    patch(slide, {
                      description: e.target.value,
                    })
                  }
                />
              </Field>
            </div>
          </article>
        ))}
      </div>

      {!data.hero.length && (
        <Empty
          title="No banners"
          text="Create your first storefront banner."
        />
      )}
    </>
  );
}

/* ============================================================
   COUPONS
============================================================ */

function Coupons({ data, update }) {
  const initial = {
    code: "",
    type: "pct",
    value: "",
    min: "",
    expires: "",
    limit: "",
  };

  const [form, setForm] = useState(initial);

  const add = (e) => {
    e.preventDefault();

    const code = form.code
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");

    const value = Number(form.value);

    if (!code || value <= 0) {
      return window.alert(
        "Enter a coupon code and discount value."
      );
    }

    if (
      data.coupons.some(
        (x) => x.code.toUpperCase() === code
      )
    ) {
      return window.alert("Coupon already exists.");
    }

    if (form.type === "pct" && value > 100) {
      return window.alert(
        "Percentage cannot be over 100."
      );
    }

    const coupon = {
      id: uid("COUPON"),
      code,
      type: form.type,
      value,
      min: Number(form.min || 0),
      expires: form.expires,
      limit: Number(form.limit || 0),
      used: 0,
      active: true,
    };

    update(
      (state) => ({
        coupons: [coupon, ...state.coupons],
      }),
      "Coupon created",
      coupon.code
    );

    setForm(initial);
  };

  const toggle = (coupon) => {
    update(
      (state) => ({
        coupons: state.coupons.map((x) =>
          x.id === coupon.id
            ? { ...x, active: !x.active }
            : x
        ),
      }),
      coupon.active
        ? "Coupon paused"
        : "Coupon activated",
      coupon.code
    );
  };

  const remove = (coupon) => {
    if (!window.confirm(`Delete ${coupon.code}?`)) return;

    update(
      (state) => ({
        coupons: state.coupons.filter(
          (x) => x.id !== coupon.id
        ),
      }),
      "Coupon deleted",
      coupon.code
    );
  };

  return (
    <>
      <form className="ea-card" onSubmit={add}>
        <div className="ea-card-head">
          <div>
            <span className="ea-eyebrow">Promotion</span>
            <h2>Create coupon</h2>
          </div>
        </div>

        <div className="ea-form-grid coupon-grid">
          <Field label="Coupon code">
            <input
              className="ea-input uppercase"
              placeholder="SUMMER20"
              value={form.code}
              onChange={(e) =>
                setForm({
                  ...form,
                  code: e.target.value,
                })
              }
            />
          </Field>

          <Field label="Discount type">
            <select
              className="ea-input"
              value={form.type}
              onChange={(e) =>
                setForm({
                  ...form,
                  type: e.target.value,
                })
              }
            >
              <option value="pct">Percentage</option>
              <option value="flat">Fixed amount</option>
            </select>
          </Field>

          <Field
            label={
              form.type === "pct"
                ? "Discount %"
                : "Discount ৳"
            }
          >
            <input
              className="ea-input"
              type="number"
              min="0"
              value={form.value}
              onChange={(e) =>
                setForm({
                  ...form,
                  value: e.target.value,
                })
              }
            />
          </Field>

          <Field label="Minimum order">
            <input
              className="ea-input"
              type="number"
              min="0"
              value={form.min}
              onChange={(e) =>
                setForm({
                  ...form,
                  min: e.target.value,
                })
              }
            />
          </Field>

          <Field label="Expiry">
            <input
              className="ea-input"
              type="date"
              value={form.expires}
              onChange={(e) =>
                setForm({
                  ...form,
                  expires: e.target.value,
                })
              }
            />
          </Field>

          <Field label="Usage limit">
            <input
              className="ea-input"
              type="number"
              min="0"
              placeholder="0 = unlimited"
              value={form.limit}
              onChange={(e) =>
                setForm({
                  ...form,
                  limit: e.target.value,
                })
              }
            />
          </Field>
        </div>

        <button className="ea-btn primary">
          Create coupon
        </button>
      </form>

      <div className="ea-coupon-grid">
        {data.coupons.map((coupon) => (
          <article className="ea-coupon" key={coupon.id}>
            <div className="ea-coupon-side">
              <span>EVER STYLE</span>
              <b>%</b>
            </div>

            <div className="ea-coupon-content">
              <div className="ea-card-head">
                <div>
                  <span className="ea-eyebrow">
                    Coupon code
                  </span>
                  <h2>{coupon.code}</h2>
                </div>

                <Status>
                  {coupon.active ? "Active" : "Paused"}
                </Status>
              </div>

              <strong className="ea-discount">
                {coupon.type === "pct"
                  ? `${coupon.value}% OFF`
                  : `${money(coupon.value)} OFF`}
              </strong>

              <div className="ea-coupon-info">
                <span>
                  Minimum:{" "}
                  {coupon.min
                    ? money(coupon.min)
                    : "None"}
                </span>

                <span>
                  Used: {coupon.used || 0}
                  {coupon.limit
                    ? ` / ${coupon.limit}`
                    : ""}
                </span>

                <span>
                  Expiry: {coupon.expires || "No expiry"}
                </span>
              </div>

              <div className="ea-row-buttons">
                <button
                  className="ea-btn secondary"
                  onClick={() => toggle(coupon)}
                >
                  {coupon.active ? "Pause" : "Activate"}
                </button>

                <button
                  className="ea-btn danger"
                  onClick={() => remove(coupon)}
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

/* ============================================================
   TEAM
============================================================ */

function Team({ data, update, currentUser }) {
  const empty = {
    name: "",
    email: "",
    role: "Support",
    pass: "",
  };

  const [form, setForm] = useState(empty);

  const add = (e) => {
    e.preventDefault();

    const email = form.email.trim().toLowerCase();

    if (
      !form.name.trim() ||
      !email.includes("@") ||
      form.pass.length < 6
    ) {
      return window.alert(
        "Enter name, valid email and a password with at least 6 characters."
      );
    }

    if (
      data.team.some(
        (x) => x.email.toLowerCase() === email
      )
    ) {
      return window.alert(
        "This email already has access."
      );
    }

    const member = {
      id: uid("USER"),
      name: form.name.trim(),
      email,
      role: form.role,
      pass: form.pass,
      active: true,
    };

    update(
      (state) => ({
        team: [...state.team, member],
      }),
      "Team member added",
      `${member.name} · ${member.role}`
    );

    setForm(empty);
  };

  const patch = (member, changes, action) => {
    update(
      (state) => ({
        team: state.team.map((x) =>
          x.id === member.id
            ? { ...x, ...changes }
            : x
        ),
      }),
      action,
      member.name
    );
  };

  const remove = (member) => {
    if (member.id === currentUser.id) {
      return window.alert(
        "You cannot remove your own account."
      );
    }

    if (member.role === "Owner") {
      return window.alert(
        "The primary Owner account cannot be removed here."
      );
    }

    if (!window.confirm(`Remove ${member.name}?`)) return;

    update(
      (state) => ({
        team: state.team.filter(
          (x) => x.id !== member.id
        ),
      }),
      "Team member removed",
      member.name
    );
  };

  return (
    <>
      <form className="ea-card" onSubmit={add}>
        <div className="ea-card-head">
          <div>
            <span className="ea-eyebrow">Permissions</span>
            <h2>Add team member</h2>
          </div>
        </div>

        <div className="ea-form-grid">
          <Field label="Full name">
            <input
              className="ea-input"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
            />
          </Field>

          <Field label="Email">
            <input
              className="ea-input"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                })
              }
            />
          </Field>

          <Field label="Role">
            <select
              className="ea-input"
              value={form.role}
              onChange={(e) =>
                setForm({
                  ...form,
                  role: e.target.value,
                })
              }
            >
              {Object.keys(ROLES).map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </Field>

          <Field label="Passcode">
            <input
              className="ea-input"
              type="password"
              value={form.pass}
              onChange={(e) =>
                setForm({
                  ...form,
                  pass: e.target.value,
                })
              }
            />
          </Field>
        </div>

        <button className="ea-btn primary">
          ＋ Add member
        </button>
      </form>

      <div className="ea-team-grid">
        {data.team.map((member) => (
          <article className="ea-team-card" key={member.id}>
            <div className="ea-team-avatar">
              {member.name?.[0]?.toUpperCase()}
            </div>

            <div className="ea-team-info">
              <h3>
                {member.name}
                {member.id === currentUser.id && (
                  <small> You</small>
                )}
              </h3>

              <span>{member.email}</span>

              <Status>
                {member.active ? "Active" : "Paused"}
              </Status>
            </div>

            <div className="ea-team-controls">
              <select
                className="ea-input"
                value={member.role}
                disabled={member.id === OWNER.id}
                onChange={(e) =>
                  patch(
                    member,
                    { role: e.target.value },
                    "Team role updated"
                  )
                }
              >
                {Object.keys(ROLES).map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>

              {member.id !== OWNER.id && (
                <button
                  className="ea-btn secondary"
                  onClick={() =>
                    patch(
                      member,
                      { active: !member.active },
                      member.active
                        ? "Team access paused"
                        : "Team access restored"
                    )
                  }
                >
                  {member.active ? "Pause" : "Restore"}
                </button>
              )}

              {member.id !== OWNER.id && (
                <button
                  className="ea-btn danger"
                  onClick={() => remove(member)}
                >
                  Remove
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="ea-card">
        <div className="ea-card-head">
          <div>
            <span className="ea-eyebrow">
              Access control
            </span>
            <h2>Role permissions</h2>
          </div>
        </div>

        {Object.entries(ROLES).map(([role, tabs]) => (
          <div className="ea-permission" key={role}>
            <b>{role}</b>

            <span>
              {tabs
                .map(
                  (id) =>
                    NAV.find((x) => x.id === id)?.label
                )
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

/* ============================================================
   AUDIT
============================================================ */

function Audit({ data }) {
  const [query, setQuery] = useState("");

  const logs = data.logs.filter((log) =>
    `${log.action} ${log.detail} ${log.who}`
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );

  return (
    <>
      <div className="ea-toolbar">
        <div className="ea-search">
          <span>⌕</span>

          <input
            placeholder="Search activity..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="ea-card">
        <div className="ea-timeline">
          {logs.map((log) => (
            <div className="ea-timeline-item" key={log.id}>
              <div className="ea-timeline-dot" />

              <div className="ea-timeline-content">
                <div>
                  <b>{log.action}</b>
                  <span>{formatDate(log.time)}</span>
                </div>

                <p>{log.detail}</p>

                <small>By {log.who}</small>
              </div>
            </div>
          ))}
        </div>

        {!logs.length && (
          <Empty title="No activity found" />
        )}
      </div>
    </>
  );
}

/* ============================================================
   PANEL LAYOUT
============================================================ */

const TITLES = {
  dashboard: [
    "Dashboard",
    "Here’s what’s happening with your store.",
  ],
  orders: [
    "Orders",
    "Manage orders, payments and delivery status.",
  ],
  products: [
    "Products",
    "Create and manage your product catalog.",
  ],
  inventory: [
    "Inventory",
    "Track stock and low inventory levels.",
  ],
  categories: [
    "Categories",
    "Organize products and sub-categories.",
  ],
  customers: [
    "Customers",
    "View customers and purchase history.",
  ],
  reviews: [
    "Reviews",
    "Moderate customer product reviews.",
  ],
  hero: [
    "Hero & Banners",
    "Manage your storefront promotional banners.",
  ],
  coupons: [
    "Coupons",
    "Create discounts and promotional codes.",
  ],
  team: [
    "Team Access",
    "Manage staff roles and permissions.",
  ],
  audit: [
    "Audit Log",
    "Review important admin activity.",
  ],
};

function AdminPanel({
  products,
  cats,
  slides,
  userId,
  onBack,
  onLogout,
}) {
  const [data, setData] = useState(() =>
    loadData(products, cats, slides)
  );

  const [tab, setTab] = useState("dashboard");
  const [menu, setMenu] = useState(false);
  const [storageError, setStorageError] = useState(false);

  const currentUser = data.team.find(
    (x) => x.id === userId
  );

  const permissions =
    ROLES[currentUser?.role] || [];

  const activeTab = permissions.includes(tab)
    ? tab
    : "dashboard";

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [data]);

  useEffect(() => {
    if (!currentUser || !currentUser.active) {
      onLogout();
    }
  }, [currentUser, onLogout]);

  if (!currentUser) return null;

  const update = (callback, action, detail) => {
    setData((previous) => {
      const changes = callback(previous);

      return {
        ...previous,
        ...changes,

        logs: [
          logEntry(
            action,
            detail,
            currentUser.name
          ),
          ...(previous.logs || []),
        ].slice(0, 500),
      };
    });
  };

  const navigate = (id) => {
    if (!permissions.includes(id)) return;

    setTab(id);
    setMenu(false);
  };

  const groups = [
    "Overview",
    "Commerce",
    "Customers",
    "Marketing",
    "System",
  ];

  return (
    <div className="ea-admin">
      {menu && (
        <button
          className="ea-overlay"
          onClick={() => setMenu(false)}
        />
      )}

      <aside
        className={`ea-sidebar ${
          menu ? "mobile-open" : ""
        }`}
      >
        <div className="ea-brand">
          <div className="ea-logo">ES</div>

          <div>
            <b>EVER STYLE</b>
            <span>Admin Console</span>
          </div>
        </div>

        <nav className="ea-nav">
          {groups.map((group) => {
            const links = NAV.filter(
              (item) =>
                item.group === group &&
                permissions.includes(item.id)
            );

            if (!links.length) return null;

            return (
              <div className="ea-nav-group" key={group}>
                <span className="ea-nav-label">
                  {group}
                </span>

                {links.map((item) => (
                  <button
                    key={item.id}
                    className={
                      activeTab === item.id
                        ? "active"
                        : ""
                    }
                    onClick={() => navigate(item.id)}
                  >
                    <Icon>{item.icon}</Icon>
                    <span>{item.label}</span>

                    {item.id === "orders" &&
                      data.orders.filter(
                        (x) => x.status === "Pending"
                      ).length > 0 && (
                        <em>
                          {
                            data.orders.filter(
                              (x) =>
                                x.status === "Pending"
                            ).length
                          }
                        </em>
                      )}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="ea-sidebar-bottom">
          <button
            className="ea-store-btn"
            onClick={onBack}
          >
            ↗
            <span>
              <b>View storefront</b>
              <small>Open customer website</small>
            </span>
          </button>

          <div className="ea-user">
            <div className="ea-avatar">
              {currentUser.name?.[0]?.toUpperCase()}
            </div>

            <div>
              <b>{currentUser.name}</b>
              <span>{currentUser.role}</span>
            </div>

            <button onClick={onLogout}>↪</button>
          </div>
        </div>
      </aside>

      <main className="ea-main">
        <header className="ea-header">
          <div className="ea-header-left">
            <button
              className="ea-menu-btn"
              onClick={() => setMenu(true)}
            >
              ☰
            </button>

            <div>
              <h1>{TITLES[activeTab][0]}</h1>
              <p>{TITLES[activeTab][1]}</p>
            </div>
          </div>

          <div className="ea-header-actions">
            <button
              className="ea-btn secondary desktop-shop"
              onClick={onBack}
            >
              View shop ↗
            </button>

            <div className="ea-header-user">
              <div className="ea-avatar">
                {currentUser.name?.[0]?.toUpperCase()}
              </div>

              <div>
                <b>{currentUser.name}</b>
                <span>{currentUser.role}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="ea-content">
          {storageError && (
            <div className="ea-alert">
              Browser storage is full. Remove some uploaded
              images before making more changes.
            </div>
          )}

          {activeTab === "dashboard" && (
            <Dashboard
              data={data}
              setTab={navigate}
            />
          )}

          {activeTab === "orders" && (
            <Orders data={data} update={update} />
          )}

          {activeTab === "products" && (
            <Products data={data} update={update} />
          )}

          {activeTab === "inventory" && (
            <Inventory data={data} update={update} />
          )}

          {activeTab === "categories" && (
            <Categories data={data} update={update} />
          )}

          {activeTab === "customers" && (
            <Customers data={data} />
          )}

          {activeTab === "reviews" && (
            <Reviews data={data} update={update} />
          )}

          {activeTab === "hero" && (
            <Hero data={data} update={update} />
          )}

          {activeTab === "coupons" && (
            <Coupons data={data} update={update} />
          )}

          {activeTab === "team" && (
            <Team
              data={data}
              update={update}
              currentUser={currentUser}
            />
          )}

          {activeTab === "audit" && (
            <Audit data={data} />
          )}
        </div>
      </main>
    </div>
  );
}

/* ============================================================
   LOGIN
============================================================ */

export default function Admin({
  products = [],
  cats = [],
  slides = [],
  onBack = () => {},
}) {
  const [userId, setUserId] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) || "";
    } catch {
      return "";
    }
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const data = loadData(products, cats, slides);

    try {
      localStorage.setItem(
        KEY,
        JSON.stringify(ensureOwner(data))
      );
    } catch {}
  }, []);

  const login = (e) => {
    e.preventDefault();

    const data = ensureOwner(
      getStored() || createSeed(products, cats, slides)
    );

    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {}

    const inputEmail = email.trim().toLowerCase();

    const user = inputEmail
      ? data.team.find(
          (x) =>
            x.email.toLowerCase() === inputEmail &&
            x.active
        )
      : data.team.find(
          (x) => x.role === "Owner" && x.active
        );

    if (user && password === user.pass) {
      try {
        sessionStorage.setItem(
          SESSION_KEY,
          user.id
        );
      } catch {}

      data.logs = [
        logEntry(
          "Signed in",
          "Admin panel opened",
          user.name
        ),
        ...(data.logs || []),
      ];

      try {
        localStorage.setItem(KEY, JSON.stringify(data));
      } catch {}

      setUserId(user.id);
      setPassword("");
      setError(false);
      return;
    }

    setError(true);
  };

  const logout = () => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {}

    setUserId("");
    setEmail("");
    setPassword("");
  };

  return (
    <>
      <style>{adminCSS}</style>

      {userId ? (
        <AdminPanel
          products={products}
          cats={cats}
          slides={slides}
          userId={userId}
          onBack={onBack}
          onLogout={logout}
        />
      ) : (
        <div className="ea-login-page">
          <div className="ea-login-brand">
            <div className="ea-logo large">ES</div>
            <b>EVER STYLE</b>
            <span>ADMIN CONSOLE</span>
          </div>

          <form className="ea-login-card" onSubmit={login}>
            <span className="ea-eyebrow">
              Welcome back
            </span>

            <h1>Sign in to admin</h1>

            <p>
              Manage products, orders, customers and your
              storefront.
            </p>

            <Field label="Email address">
              <input
                className="ea-input login-input"
                type="email"
                placeholder="owner@everstyle.store"
                autoComplete="username"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(false);
                }}
              />
            </Field>

            <Field label="Passcode">
              <input
                className={`ea-input login-input ${
                  error ? "error" : ""
                }`}
                type="password"
                placeholder="Enter your passcode"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
              />

              {error && (
                <small className="ea-error">
                  Incorrect email or passcode.
                </small>
              )}
            </Field>

            <button className="ea-login-button">
              Sign in
              <span>→</span>
            </button>

            <button
              type="button"
              className="ea-back"
              onClick={onBack}
            >
              ← Back to store
            </button>
          </form>

          <span className="ea-login-footer">
            © {new Date().getFullYear()} Ever Style
          </span>
        </div>
      )}
    </>
  );
}

/* ============================================================
   CSS
============================================================ */

const adminCSS = `
*{box-sizing:border-box}

.ea-admin{
  --ea-bg:#f6f7f9;
  --ea-card:#fff;
  --ea-text:#111318;
  --ea-muted:#747982;
  --ea-border:#e7e9ed;
  --ea-soft:#f2f3f5;
  --ea-dark:#111318;
  --ea-accent:#6c4cff;
  --ea-danger:#d84c4c;
  min-height:100vh;
  display:flex;
  background:var(--ea-bg);
  color:var(--ea-text);
  font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
}

.ea-sidebar{
  position:fixed;
  z-index:50;
  left:0;
  top:0;
  bottom:0;
  width:260px;
  background:#111318;
  color:#fff;
  display:flex;
  flex-direction:column;
  padding:22px 14px 14px;
  overflow:auto;
}

.ea-brand{
  display:flex;
  align-items:center;
  gap:12px;
  padding:0 8px 24px;
  border-bottom:1px solid rgba(255,255,255,.08);
}

.ea-logo{
  width:40px;
  height:40px;
  border-radius:12px;
  background:#fff;
  color:#111318;
  display:grid;
  place-items:center;
  font-size:13px;
  font-weight:900;
  letter-spacing:-.5px;
}

.ea-logo.large{
  width:54px;
  height:54px;
  border-radius:16px;
  background:#111318;
  color:#fff;
}

.ea-brand b{
  display:block;
  font-size:14px;
  letter-spacing:.09em;
}

.ea-brand span{
  display:block;
  margin-top:2px;
  font-size:11px;
  color:#8d929b;
}

.ea-nav{
  flex:1;
  padding:16px 0;
}

.ea-nav-group{
  margin-bottom:20px;
}

.ea-nav-label{
  display:block;
  padding:0 12px 7px;
  color:#656b74;
  font-size:10px;
  font-weight:800;
  text-transform:uppercase;
  letter-spacing:.13em;
}

.ea-nav button{
  width:100%;
  border:0;
  background:transparent;
  color:#aeb3bb;
  padding:9px 11px;
  border-radius:10px;
  display:flex;
  align-items:center;
  gap:11px;
  font:inherit;
  font-size:13px;
  cursor:pointer;
  transition:.18s;
}

.ea-nav button:hover{
  background:rgba(255,255,255,.05);
  color:#fff;
}

.ea-nav button.active{
  background:#fff;
  color:#111318;
  font-weight:700;
}

.ea-nav button em{
  margin-left:auto;
  min-width:20px;
  height:20px;
  border-radius:20px;
  display:grid;
  place-items:center;
  background:#f05b5b;
  color:#fff;
  font-style:normal;
  font-size:10px;
}

.ea-icon{
  width:20px;
  text-align:center;
  font-size:15px;
}

.ea-sidebar-bottom{
  border-top:1px solid rgba(255,255,255,.08);
  padding-top:12px;
}

.ea-store-btn{
  border:0;
  width:100%;
  background:rgba(255,255,255,.05);
  color:#fff;
  padding:10px;
  border-radius:11px;
  display:flex;
  align-items:center;
  gap:10px;
  text-align:left;
  cursor:pointer;
}

.ea-store-btn span{
  display:grid;
}

.ea-store-btn b{
  font-size:12px;
}

.ea-store-btn small{
  color:#858b94;
  font-size:10px;
  margin-top:2px;
}

.ea-user{
  display:flex;
  align-items:center;
  gap:9px;
  margin-top:10px;
  padding:8px;
}

.ea-avatar{
  flex:none;
  width:36px;
  height:36px;
  border-radius:50%;
  display:grid;
  place-items:center;
  background:#ececf1;
  color:#111318;
  font-size:12px;
  font-weight:800;
}

.ea-user>div:nth-child(2){
  min-width:0;
  flex:1;
  display:grid;
}

.ea-user b{
  font-size:12px;
}

.ea-user span{
  color:#7f858e;
  font-size:10px;
}

.ea-user>button{
  border:0;
  background:transparent;
  color:#8e949d;
  cursor:pointer;
  font-size:17px;
}

.ea-main{
  width:calc(100% - 260px);
  margin-left:260px;
  min-height:100vh;
}

.ea-header{
  min-height:88px;
  padding:17px 28px;
  background:#fff;
  border-bottom:1px solid var(--ea-border);
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:20px;
  position:sticky;
  top:0;
  z-index:20;
}

.ea-header-left{
  display:flex;
  align-items:center;
  gap:12px;
}

.ea-header h1{
  margin:0;
  font-size:22px;
  letter-spacing:-.03em;
}

.ea-header p{
  margin:4px 0 0;
  color:var(--ea-muted);
  font-size:12px;
}

.ea-header-actions{
  display:flex;
  align-items:center;
  gap:12px;
}

.ea-header-user{
  display:flex;
  align-items:center;
  gap:8px;
  padding-left:12px;
  border-left:1px solid var(--ea-border);
}

.ea-header-user>div:last-child{
  display:grid;
}

.ea-header-user b{
  font-size:12px;
}

.ea-header-user span{
  font-size:10px;
  color:var(--ea-muted);
}

.ea-menu-btn{
  display:none;
  border:1px solid var(--ea-border);
  background:#fff;
  width:40px;
  height:40px;
  border-radius:10px;
}

.ea-content{
  max-width:1500px;
  margin:auto;
  padding:28px;
}

.ea-page{
  display:grid;
  gap:20px;
}

.ea-stats{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:14px;
}

.ea-stat{
  border:1px solid var(--ea-border);
  background:#fff;
  border-radius:16px;
  padding:18px;
  text-align:left;
  cursor:pointer;
  transition:.2s;
}

.ea-stat:hover{
  transform:translateY(-2px);
  box-shadow:0 12px 35px rgba(20,20,30,.06);
}

.ea-stat-top{
  display:flex;
  align-items:center;
  justify-content:space-between;
  margin-bottom:20px;
}

.ea-stat-icon{
  width:38px;
  height:38px;
  border-radius:11px;
  background:#f1f1f4;
  display:grid;
  place-items:center;
  font-weight:800;
}

.ea-stat-arrow{
  color:#a5a8ae;
}

.ea-stat strong{
  display:block;
  font-size:25px;
  letter-spacing:-.04em;
}

.ea-stat h3{
  margin:5px 0 2px;
  font-size:12px;
}

.ea-stat p{
  margin:0;
  color:var(--ea-muted);
  font-size:10px;
}

.ea-dashboard-grid{
  display:grid;
  grid-template-columns:minmax(0,1.5fr) minmax(320px,.8fr);
  gap:20px;
}

.ea-card{
  background:#fff;
  border:1px solid var(--ea-border);
  border-radius:16px;
  padding:20px;
  margin-bottom:18px;
}

.ea-card.no-pad{
  padding:0;
  overflow:hidden;
}

.ea-card-head{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:15px;
  margin-bottom:18px;
}

.ea-card-head h2{
  margin:3px 0 0;
  font-size:16px;
  letter-spacing:-.02em;
}

.ea-card-head p{
  margin:4px 0 0;
  color:var(--ea-muted);
  font-size:11px;
}

.ea-eyebrow{
  color:#969ba3;
  text-transform:uppercase;
  letter-spacing:.12em;
  font-size:9px;
  font-weight:800;
}

.ea-soft-badge{
  background:#f2f3f5;
  border-radius:99px;
  padding:6px 9px;
  color:#6e737c;
  font-size:10px;
}

.ea-text-btn{
  border:0;
  background:transparent;
  color:#626872;
  font-size:11px;
  font-weight:700;
  cursor:pointer;
}

.ea-chart{
  height:240px;
  display:flex;
  gap:13px;
  align-items:flex-end;
  padding-top:20px;
}

.ea-chart-col{
  flex:1;
  height:100%;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:8px;
}

.ea-bar-space{
  flex:1;
  width:100%;
  display:flex;
  align-items:flex-end;
  justify-content:center;
  border-bottom:1px solid #eee;
}

.ea-chart-bar{
  width:min(40px,70%);
  background:#111318;
  border-radius:6px 6px 2px 2px;
  min-height:5px;
}

.ea-chart-col>span{
  font-size:10px;
  color:#92969e;
}

.ea-mini-list{
  display:grid;
}

.ea-mini-order{
  display:flex;
  align-items:center;
  gap:10px;
  padding:11px 0;
  border-bottom:1px solid #f0f1f3;
}

.ea-mini-order:last-child{
  border:0;
}

.ea-mini-main{
  flex:1;
  min-width:0;
  display:grid;
}

.ea-mini-main b{
  font-size:11px;
}

.ea-mini-main span{
  color:#92969d;
  font-size:9px;
  margin-top:2px;
}

.ea-mini-right{
  display:grid;
  justify-items:end;
  gap:4px;
}

.ea-mini-right>b{
  font-size:11px;
}

.ea-status{
  display:inline-flex;
  align-items:center;
  gap:5px;
  width:max-content;
  padding:4px 7px;
  border-radius:99px;
  background:#f2f3f4;
  color:#62676f;
  font-size:9px;
  font-weight:700;
  white-space:nowrap;
}

.ea-status i{
  width:5px;
  height:5px;
  border-radius:50%;
  background:currentColor;
}

.status-delivered,
.status-approved,
.status-active,
.status-in-stock{
  color:#25835a;
  background:#edf8f2;
}

.status-pending,
.status-low-stock{
  color:#a86a12;
  background:#fff6e7;
}

.status-processing{
  color:#356bb5;
  background:#edf4ff;
}

.status-shipped{
  color:#6d51b4;
  background:#f2edff;
}

.status-cancelled,
.status-rejected,
.status-out-of-stock{
  color:#b54444;
  background:#fff0f0;
}

.ea-table-wrap{
  width:100%;
  overflow:auto;
}

.ea-table{
  width:100%;
  border-collapse:collapse;
  min-width:720px;
}

.ea-table th{
  background:#fafafb;
  color:#8c9199;
  text-transform:uppercase;
  letter-spacing:.08em;
  font-size:9px;
  font-weight:800;
  text-align:left;
  padding:12px 16px;
  border-bottom:1px solid var(--ea-border);
}

.ea-table td{
  padding:14px 16px;
  border-bottom:1px solid #f0f1f3;
  font-size:11px;
  color:#646a72;
}

.ea-table tbody tr:last-child td{
  border-bottom:0;
}

.ea-table tbody tr:hover{
  background:#fcfcfd;
}

.ea-table td b{
  color:#22252a;
  font-size:11px;
}

.ea-table td small{
  display:block;
  margin-top:3px;
  color:#9a9ea5;
  font-size:9px;
}

.right{
  text-align:right!important;
}

.ea-toolbar{
  display:flex;
  align-items:center;
  gap:10px;
  margin-bottom:16px;
}

.ea-search{
  min-width:220px;
  max-width:460px;
  flex:1;
  position:relative;
}

.ea-search>span{
  position:absolute;
  left:13px;
  top:50%;
  transform:translateY(-50%);
  color:#9ca0a7;
}

.ea-search input{
  width:100%;
  height:42px;
  padding:0 14px 0 38px;
  border:1px solid var(--ea-border);
  border-radius:11px;
  background:#fff;
  outline:0;
  font:inherit;
  font-size:12px;
}

.ea-select,
.ea-input{
  width:100%;
  min-height:42px;
  padding:9px 11px;
  border:1px solid var(--ea-border);
  border-radius:10px;
  background:#fff;
  color:#22252a;
  outline:0;
  font:inherit;
  font-size:12px;
}

.ea-select{
  width:auto;
  min-width:130px;
}

.ea-input:focus,
.ea-search input:focus{
  border-color:#9c9fa6;
  box-shadow:0 0 0 3px rgba(30,30,40,.04);
}

textarea.ea-input{
  resize:vertical;
}

.ea-field{
  display:grid;
  gap:6px;
}

.ea-field>span{
  color:#5e646c;
  font-size:10px;
  font-weight:700;
}

.ea-btn{
  min-height:40px;
  border:1px solid transparent;
  border-radius:10px;
  padding:0 14px;
  font:inherit;
  font-size:11px;
  font-weight:700;
  cursor:pointer;
  white-space:nowrap;
}

.ea-btn.primary{
  background:#111318;
  color:#fff;
}

.ea-btn.secondary{
  background:#fff;
  color:#30343a;
  border-color:var(--ea-border);
}

.ea-btn.danger{
  background:#fff;
  color:#bd4646;
  border-color:#f0dada;
}

.ea-icon-btn{
  width:34px;
  height:34px;
  border:1px solid var(--ea-border);
  border-radius:9px;
  background:#fff;
  color:#565b63;
  cursor:pointer;
}

.ea-icon-btn.danger{
  color:#c14b4b;
}

.ea-icon-btn:disabled{
  opacity:.35;
  cursor:not-allowed;
}

.ea-empty{
  padding:45px 20px;
  display:grid;
  justify-items:center;
  text-align:center;
}

.ea-empty-icon{
  width:48px;
  height:48px;
  border-radius:50%;
  background:#f3f4f5;
  display:grid;
  place-items:center;
  color:#858a92;
  font-size:20px;
}

.ea-empty h3{
  margin:10px 0 4px;
  font-size:14px;
}

.ea-empty p{
  margin:0;
  color:#92969d;
  font-size:11px;
}

.ea-modal-bg{
  position:fixed;
  z-index:100;
  inset:0;
  background:rgba(8,10,14,.56);
  backdrop-filter:blur(5px);
  display:grid;
  place-items:center;
  padding:20px;
}

.ea-modal{
  width:min(560px,100%);
  max-height:90vh;
  overflow:auto;
  background:#fff;
  border-radius:18px;
  box-shadow:0 30px 100px rgba(0,0,0,.25);
}

.ea-modal.wide{
  width:min(950px,100%);
}

.ea-modal-head{
  position:sticky;
  top:0;
  z-index:5;
  background:#fff;
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:15px;
  padding:18px 22px;
  border-bottom:1px solid var(--ea-border);
}

.ea-modal-head h2{
  margin:3px 0 0;
  font-size:18px;
}

.ea-close{
  width:36px;
  height:36px;
  border:1px solid var(--ea-border);
  background:#fff;
  border-radius:10px;
  font-size:20px;
  cursor:pointer;
}

.ea-modal-body{
  padding:22px;
}

.ea-modal-actions{
  display:flex;
  justify-content:flex-end;
  gap:8px;
  padding-top:20px;
  margin-top:20px;
  border-top:1px solid var(--ea-border);
}

.ea-order-summary{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:10px;
  margin-bottom:18px;
}

.ea-order-summary>div{
  padding:13px;
  background:#f7f8f9;
  border-radius:11px;
  display:grid;
  gap:4px;
}

.ea-order-summary span{
  color:#8c9198;
  font-size:9px;
}

.ea-order-summary b{
  font-size:11px;
}

.ea-detail-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:14px;
}

.ea-subcard{
  border:1px solid var(--ea-border);
  border-radius:13px;
  padding:15px;
  margin-bottom:12px;
}

.ea-subcard h3{
  margin:0 0 12px;
  font-size:12px;
}

.ea-subcard p{
  color:#6d7279;
  font-size:11px;
}

.ea-line{
  display:flex;
  justify-content:space-between;
  gap:15px;
  align-items:center;
  padding:9px 0;
  border-bottom:1px solid #f0f1f3;
  font-size:11px;
}

.ea-line:last-child{
  border:0;
}

.ea-line>div{
  display:grid;
}

.ea-line span{
  color:#8e9299;
  font-size:9px;
  margin-top:2px;
}

.ea-info{
  display:grid;
  gap:3px;
  padding:7px 0;
}

.ea-info span{
  color:#8f949b;
  font-size:9px;
}

.ea-info b{
  font-size:11px;
}

.ea-product-grid{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:15px;
}

.ea-product-card{
  overflow:hidden;
  border:1px solid var(--ea-border);
  border-radius:15px;
  background:#fff;
}

.ea-product-thumb{
  position:relative;
  aspect-ratio:4/3;
  background:#f3f4f5;
  overflow:hidden;
}

.ea-product-thumb img{
  width:100%;
  height:100%;
  object-fit:cover;
  display:block;
}

.ea-no-photo{
  width:100%;
  height:100%;
  display:grid;
  place-items:center;
  color:#a4a8af;
  font-size:32px;
}

.ea-product-state{
  position:absolute;
  top:10px;
  left:10px;
  background:#fff;
  color:#277957;
  border-radius:99px;
  padding:5px 8px;
  font-size:9px;
  font-weight:800;
  box-shadow:0 3px 12px rgba(0,0,0,.08);
}

.ea-product-state.hidden{
  color:#b34747;
}

.ea-product-body{
  padding:15px;
}

.ea-product-title{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:10px;
}

.ea-product-title h3{
  margin:0;
  font-size:13px;
}

.ea-product-title>div>span{
  display:block;
  color:#989ca3;
  font-size:9px;
  margin-top:3px;
}

.ea-tag{
  background:#f0f1f3;
  padding:4px 7px;
  border-radius:99px;
  font-size:8px;
  white-space:nowrap;
}

.ea-product-meta{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  margin:15px 0;
  padding:12px 0;
  border-top:1px solid #f0f1f3;
  border-bottom:1px solid #f0f1f3;
}

.ea-product-meta>div{
  display:grid;
  gap:3px;
}

.ea-product-meta span{
  color:#969aa1;
  font-size:8px;
}

.ea-product-meta b{
  font-size:10px;
}

.ea-product-actions{
  display:flex;
  gap:7px;
}

.ea-product-actions .ea-btn{
  flex:1;
}

.ea-product-editor{
  display:grid;
  grid-template-columns:1.2fr .8fr;
  gap:25px;
}

.ea-form-grid{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:14px;
}

.ea-image-box{
  border:1px solid var(--ea-border);
  border-radius:13px;
  padding:15px;
}

.ea-image-box h3{
  margin:0;
  font-size:12px;
}

.ea-image-box>p{
  margin:4px 0 13px;
  color:#92969d;
  font-size:9px;
}

.ea-product-images{
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:9px;
}

.ea-product-image,
.ea-upload{
  position:relative;
  aspect-ratio:1;
  overflow:hidden;
  border-radius:10px;
  border:1px solid var(--ea-border);
}

.ea-product-image img{
  width:100%;
  height:100%;
  object-fit:cover;
}

.ea-upload{
  border-style:dashed;
  display:grid;
  place-items:center;
  align-content:center;
  gap:3px;
  cursor:pointer;
  color:#898e96;
}

.ea-upload b{
  font-size:20px;
}

.ea-upload span{
  font-size:9px;
}

.ea-main-photo{
  position:absolute;
  left:6px;
  bottom:6px;
  background:#111318;
  color:#fff;
  border-radius:99px;
  padding:3px 6px;
  font-size:8px;
}

.ea-photo-delete,
.ea-photo-main{
  position:absolute;
  border:0;
  width:25px;
  height:25px;
  border-radius:50%;
  background:rgba(17,19,24,.82);
  color:#fff;
  cursor:pointer;
}

.ea-photo-delete{
  right:6px;
  top:6px;
}

.ea-photo-main{
  left:6px;
  bottom:6px;
}

.ea-mini-stats{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:12px;
  margin-bottom:16px;
}

.ea-mini-stats>div{
  border:1px solid var(--ea-border);
  border-radius:13px;
  background:#fff;
  padding:14px;
  display:grid;
  gap:4px;
}

.ea-mini-stats span{
  color:#8f949b;
  font-size:9px;
}

.ea-mini-stats b{
  font-size:20px;
}

.ea-stepper{
  display:inline-flex;
  align-items:center;
  gap:7px;
  border:1px solid var(--ea-border);
  border-radius:9px;
  padding:3px;
}

.ea-stepper button{
  width:28px;
  height:27px;
  border:0;
  border-radius:6px;
  background:#f3f4f5;
  cursor:pointer;
}

.ea-stepper b{
  min-width:25px;
  text-align:center;
}

.ea-small-input{
  width:75px;
  height:34px;
  border:1px solid var(--ea-border);
  border-radius:8px;
  padding:0 8px;
}

.ea-create-bar{
  display:grid;
  grid-template-columns:1fr minmax(200px,350px) auto;
  align-items:end;
  gap:12px;
  background:#fff;
  border:1px solid var(--ea-border);
  border-radius:15px;
  padding:18px;
  margin-bottom:17px;
}

.ea-create-bar h3{
  margin:3px 0 0;
  font-size:14px;
}

.ea-category-grid{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:15px;
}

.ea-chips{
  min-height:45px;
  display:flex;
  flex-wrap:wrap;
  align-items:flex-start;
  gap:6px;
  margin-bottom:12px;
}

.ea-chip{
  display:inline-flex;
  align-items:center;
  gap:6px;
  border:1px solid var(--ea-border);
  border-radius:99px;
  padding:5px 6px 5px 10px;
  font-size:10px;
}

.ea-chip button{
  border:0;
  background:#f0f1f3;
  width:19px;
  height:19px;
  border-radius:50%;
  cursor:pointer;
}

.ea-muted{
  color:#969aa1;
  font-size:10px;
}

.ea-inline-add{
  display:flex;
  gap:7px;
}

.ea-customer-grid{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:14px;
}

.ea-customer-card{
  border:1px solid var(--ea-border);
  border-radius:15px;
  background:#fff;
  padding:16px;
  text-align:left;
  cursor:pointer;
}

.ea-customer-avatar{
  width:42px;
  height:42px;
  border-radius:13px;
  background:#111318;
  color:#fff;
  display:grid;
  place-items:center;
  font-weight:800;
  margin-bottom:12px;
}

.ea-customer-name h3{
  margin:0;
  font-size:13px;
}

.ea-customer-name span{
  display:block;
  margin-top:3px;
  color:#92969d;
  font-size:9px;
}

.ea-customer-numbers{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:10px;
  margin-top:14px;
  padding-top:12px;
  border-top:1px solid #f0f1f3;
}

.ea-customer-numbers>div{
  display:grid;
  gap:2px;
}

.ea-customer-numbers b{
  font-size:11px;
}

.ea-customer-numbers span{
  color:#9a9ea5;
  font-size:8px;
}

.ea-filter-tabs{
  display:flex;
  gap:5px;
  margin-bottom:15px;
}

.ea-filter-tabs button{
  border:1px solid var(--ea-border);
  background:#fff;
  padding:8px 12px;
  border-radius:9px;
  color:#777c84;
  font-size:10px;
  cursor:pointer;
}

.ea-filter-tabs button.active{
  background:#111318;
  color:#fff;
  border-color:#111318;
}

.ea-review-grid{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:14px;
}

.ea-review{
  border:1px solid var(--ea-border);
  background:#fff;
  border-radius:15px;
  padding:17px;
}

.ea-review-top{
  display:flex;
  align-items:center;
  gap:9px;
}

.ea-review-top>div:nth-child(2){
  flex:1;
  display:grid;
}

.ea-review-top h3{
  margin:0;
  font-size:11px;
}

.ea-review-top span{
  color:#999da4;
  font-size:8px;
}

.ea-stars{
  margin:13px 0 8px;
  color:#dca52f;
  letter-spacing:2px;
  font-size:13px;
}

.ea-stars span{
  color:#e5e6e8;
}

.ea-review-product{
  font-size:10px;
}

.ea-review p{
  color:#696f77;
  font-size:10px;
  line-height:1.6;
}

.ea-review-actions{
  display:flex;
  gap:6px;
  margin-top:12px;
}

.ea-section-actions{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:15px;
  margin-bottom:15px;
}

.ea-section-actions p{
  margin:0;
  color:#777c84;
  font-size:11px;
}

.ea-hero-card{
  display:grid;
  grid-template-columns:minmax(300px,.8fr) 1.2fr;
  overflow:hidden;
  background:#fff;
  border:1px solid var(--ea-border);
  border-radius:16px;
  margin-bottom:15px;
}

.ea-hero-preview{
  position:relative;
  min-height:280px;
  background:#eceef0;
}

.ea-hero-preview img{
  width:100%;
  height:100%;
  position:absolute;
  inset:0;
  object-fit:cover;
}

.ea-hero-empty{
  height:100%;
  min-height:280px;
  display:grid;
  place-items:center;
  align-content:center;
  color:#969ba3;
}

.ea-hero-empty b{
  font-size:25px;
}

.ea-hero-empty span{
  font-size:10px;
}

.ea-change-image{
  position:absolute;
  left:12px;
  bottom:12px;
  padding:8px 11px;
  border-radius:9px;
  background:#fff;
  box-shadow:0 5px 20px rgba(0,0,0,.12);
  font-size:10px;
  font-weight:700;
  cursor:pointer;
}

.ea-hero-editor{
  padding:20px;
}

.ea-row-buttons{
  display:flex;
  gap:6px;
  flex-wrap:wrap;
}

.coupon-grid{
  grid-template-columns:repeat(3,1fr);
  margin-bottom:14px;
}

.uppercase{
  text-transform:uppercase;
}

.ea-coupon-grid{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:14px;
}

.ea-coupon{
  display:flex;
  min-height:220px;
  overflow:hidden;
  border:1px solid var(--ea-border);
  border-radius:15px;
  background:#fff;
}

.ea-coupon-side{
  width:80px;
  background:#111318;
  color:#fff;
  display:flex;
  flex-direction:column;
  justify-content:space-between;
  align-items:center;
  padding:15px 5px;
}

.ea-coupon-side span{
  writing-mode:vertical-rl;
  transform:rotate(180deg);
  font-size:8px;
  letter-spacing:.18em;
}

.ea-coupon-side b{
  font-size:26px;
}

.ea-coupon-content{
  flex:1;
  padding:17px;
}

.ea-discount{
  display:block;
  margin:15px 0;
  font-size:24px;
  letter-spacing:-.04em;
}

.ea-coupon-info{
  display:grid;
  gap:4px;
  color:#858a92;
  font-size:9px;
  margin-bottom:14px;
}

.ea-team-grid{
  display:grid;
  gap:10px;
  margin-bottom:18px;
}

.ea-team-card{
  display:flex;
  align-items:center;
  gap:12px;
  background:#fff;
  border:1px solid var(--ea-border);
  border-radius:14px;
  padding:14px;
}

.ea-team-avatar{
  width:44px;
  height:44px;
  border-radius:13px;
  background:#111318;
  color:#fff;
  display:grid;
  place-items:center;
  font-weight:800;
}

.ea-team-info{
  flex:1;
  display:grid;
  gap:3px;
}

.ea-team-info h3{
  margin:0;
  font-size:12px;
}

.ea-team-info h3 small{
  color:#979ba2;
  font-size:8px;
  font-weight:500;
}

.ea-team-info>span{
  color:#8f949b;
  font-size:9px;
}

.ea-team-controls{
  display:flex;
  align-items:center;
  gap:6px;
}

.ea-team-controls .ea-input{
  width:120px;
}

.ea-permission{
  display:grid;
  grid-template-columns:100px 1fr;
  gap:12px;
  padding:10px 0;
  border-bottom:1px solid #f0f1f3;
}

.ea-permission:last-child{
  border:0;
}

.ea-permission b{
  font-size:10px;
}

.ea-permission span{
  color:#848991;
  font-size:9px;
}

.ea-timeline{
  position:relative;
}

.ea-timeline-item{
  position:relative;
  display:grid;
  grid-template-columns:18px 1fr;
  gap:10px;
}

.ea-timeline-item:not(:last-child):before{
  content:"";
  position:absolute;
  left:5px;
  top:15px;
  bottom:-8px;
  width:1px;
  background:#e5e7ea;
}

.ea-timeline-dot{
  position:relative;
  z-index:1;
  width:11px;
  height:11px;
  margin-top:5px;
  border:3px solid #111318;
  border-radius:50%;
  background:#fff;
}

.ea-timeline-content{
  padding-bottom:18px;
}

.ea-timeline-content>div{
  display:flex;
  justify-content:space-between;
  gap:15px;
}

.ea-timeline-content b{
  font-size:11px;
}

.ea-timeline-content span{
  color:#999da4;
  font-size:8px;
}

.ea-timeline-content p{
  margin:4px 0;
  color:#696f77;
  font-size:10px;
}

.ea-timeline-content small{
  color:#9a9ea5;
  font-size:8px;
}

.ea-alert{
  padding:11px 13px;
  margin-bottom:15px;
  border:1px solid #f0cfcf;
  background:#fff1f1;
  color:#aa3e3e;
  border-radius:10px;
  font-size:10px;
}

.ea-overlay{
  display:none;
}

.ea-login-page{
  min-height:100vh;
  background:#f5f5f6;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  padding:30px 20px;
  font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
}

.ea-login-brand{
  display:grid;
  justify-items:center;
  margin-bottom:24px;
}

.ea-login-brand b{
  margin-top:10px;
  font-size:14px;
  letter-spacing:.13em;
}

.ea-login-brand>span{
  margin-top:3px;
  color:#999da4;
  font-size:8px;
  letter-spacing:.17em;
}

.ea-login-card{
  width:min(420px,100%);
  background:#fff;
  border:1px solid #e6e8eb;
  border-radius:20px;
  padding:30px;
  box-shadow:0 20px 60px rgba(20,20,30,.06);
}

.ea-login-card h1{
  margin:5px 0 7px;
  font-size:25px;
  letter-spacing:-.04em;
}

.ea-login-card>p{
  margin:0 0 22px;
  color:#858a92;
  font-size:11px;
  line-height:1.6;
}

.ea-login-card .ea-field{
  margin-bottom:13px;
}

.ea-login-button{
  width:100%;
  height:46px;
  margin-top:5px;
  border:0;
  border-radius:11px;
  background:#111318;
  color:#fff;
  padding:0 16px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  font-weight:700;
  cursor:pointer;
}

.ea-back{
  display:block;
  margin:16px auto 0;
  border:0;
  background:transparent;
  color:#858a92;
  font-size:10px;
  cursor:pointer;
}

.ea-login-footer{
  margin-top:18px;
  color:#aaaeb5;
  font-size:8px;
}

.ea-error{
  color:#bf4646;
  font-size:9px;
}

.ea-input.error{
  border-color:#d86464;
}

@media(max-width:1150px){
  .ea-stats{
    grid-template-columns:repeat(2,1fr);
  }

  .ea-dashboard-grid{
    grid-template-columns:1fr;
  }

  .ea-product-grid,
  .ea-customer-grid{
    grid-template-columns:repeat(2,1fr);
  }

  .ea-coupon-grid{
    grid-template-columns:1fr;
  }
}

@media(max-width:900px){
  .ea-sidebar{
    transform:translateX(-105%);
    transition:.25s;
    box-shadow:20px 0 50px rgba(0,0,0,.2);
  }

  .ea-sidebar.mobile-open{
    transform:translateX(0);
  }

  .ea-overlay{
    display:block;
    position:fixed;
    z-index:45;
    inset:0;
    border:0;
    background:rgba(0,0,0,.4);
  }

  .ea-main{
    width:100%;
    margin-left:0;
  }

  .ea-menu-btn{
    display:block;
  }

  .ea-product-editor,
  .ea-hero-card{
    grid-template-columns:1fr;
  }

  .ea-hero-preview{
    min-height:240px;
  }

  .ea-order-summary{
    grid-template-columns:repeat(2,1fr);
  }
}

@media(max-width:700px){
  .ea-content{
    padding:16px;
  }

  .ea-header{
    min-height:76px;
    padding:13px 16px;
  }

  .ea-header h1{
    font-size:18px;
  }

  .ea-header p{
    display:none;
  }

  .ea-header-user,
  .desktop-shop{
    display:none;
  }

  .ea-stats,
  .ea-product-grid,
  .ea-customer-grid,
  .ea-review-grid,
  .ea-category-grid,
  .ea-mini-stats{
    grid-template-columns:1fr;
  }

  .ea-toolbar{
    align-items:stretch;
    flex-direction:column;
  }

  .ea-search{
    max-width:none;
  }

  .ea-select{
    width:100%;
  }

  .ea-form-grid,
  .coupon-grid,
  .ea-detail-grid{
    grid-template-columns:1fr;
  }

  .ea-create-bar{
    grid-template-columns:1fr;
    align-items:stretch;
  }

  .ea-order-summary{
    grid-template-columns:1fr 1fr;
  }

  .ea-team-card{
    align-items:flex-start;
    flex-wrap:wrap;
  }

  .ea-team-info{
    min-width:calc(100% - 60px);
  }

  .ea-team-controls{
    width:100%;
    flex-wrap:wrap;
  }

  .ea-team-controls .ea-input{
    width:100%;
  }

  .ea-modal-bg{
    padding:8px;
  }

  .ea-modal{
    border-radius:14px;
    max-height:95vh;
  }

  .ea-modal-body{
    padding:16px;
  }

  .ea-product-editor{
    gap:16px;
  }
}

@media(max-width:430px){
  .ea-stats{
    grid-template-columns:1fr 1fr;
    gap:8px;
  }

  .ea-stat{
    padding:13px;
  }

  .ea-stat strong{
    font-size:19px;
  }

  .ea-stat-top{
    margin-bottom:12px;
  }

  .ea-order-summary{
    grid-template-columns:1fr;
  }

  .ea-product-images{
    grid-template-columns:1fr 1fr;
  }

  .ea-coupon-side{
    width:55px;
  }
}
`;
