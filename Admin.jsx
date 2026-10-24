import { useEffect, useMemo, useState } from "react";

/* ============================================================
   EVER STYLE — PREMIUM ADMIN
   Theme matched with storefront:
   Deep Forest Green + Champagne + Cream + White
============================================================ */

const KEY = "mc_admin_v1";
const OK = "mc_admin_ok";

const ADMIN_EMAIL = "owner@everstyle.store";
const ADMIN_PASS = "mohonchura-admin";
const LOW = 5;

const STATUSES = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const OWNER = {
  id: "U1",
  name: "Owner",
  email: ADMIN_EMAIL,
  role: "Owner",
  pass: ADMIN_PASS,
  active: true,
};

const NAV = [
  ["dashboard", "Dashboard", "⌂", "Overview"],
  ["orders", "Orders", "▣", "Commerce"],
  ["products", "Products", "◇", "Commerce"],
  ["inventory", "Inventory", "▤", "Commerce"],
  ["categories", "Categories", "⌘", "Commerce"],
  ["customers", "Customers", "◎", "Customers"],
  ["reviews", "Reviews", "★", "Customers"],
  ["hero", "Hero & Banners", "▧", "Marketing"],
  ["coupons", "Coupons", "%", "Marketing"],
  ["team", "Team Access", "♙", "System"],
  ["audit", "Audit Log", "◷", "System"],
];

const PERMISSIONS = {
  Owner: NAV.map((x) => x[0]),

  Manager: [
    "dashboard",
    "orders",
    "products",
    "inventory",
    "categories",
    "customers",
    "reviews",
    "hero",
    "coupons",
    "audit",
  ],

  Editor: [
    "dashboard",
    "products",
    "inventory",
    "categories",
    "reviews",
    "hero",
  ],

  Support: [
    "dashboard",
    "orders",
    "customers",
    "reviews",
  ],
};

/* ============================================================
   HELPERS
============================================================ */

const uid = (prefix = "ID") =>
  `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;

const money = (n = 0) =>
  `৳${Number(n || 0).toLocaleString("en-BD")}`;

const dateText = (value) => {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
};

const todayISO = () => new Date().toISOString();

function logItem(action, detail, who = "System") {
  return {
    id: uid("LOG"),
    action,
    detail,
    who,
    time: todayISO(),
  };
}

function safeParse(value, fallback = null) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getStored() {
  if (typeof window === "undefined") return null;

  return safeParse(localStorage.getItem(KEY), null);
}

function saveStored(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/* ============================================================
   IMAGE COMPRESSION
============================================================ */

function imageToDataURL(file, maxSize = 1200, quality = 0.78) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");

    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        const scale = Math.min(
          1,
          maxSize / Math.max(img.width, img.height)
        );

        const canvas = document.createElement("canvas");

        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext("2d");

        ctx.drawImage(
          img,
          0,
          0,
          canvas.width,
          canvas.height
        );

        resolve(canvas.toDataURL("image/jpeg", quality));
      };

      img.onerror = reject;
      img.src = reader.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ============================================================
   INITIAL DATA
============================================================ */

function normalizeProduct(p, index = 0) {
  const images =
    Array.isArray(p.images) && p.images.length
      ? p.images
      : p.image
      ? [p.image]
      : [];

  return {
    id: p.id ?? uid("P"),
    name: p.name || "Untitled product",
    sku: p.sku || `ES-${String(index + 1).padStart(4, "0")}`,
    category: p.category || p.cat || "",
    subcategory: p.subcategory || "",
    price: Number(p.price || 0),
    stock: Number(p.stock ?? 10),
    low: Number(p.low ?? LOW),
    tag: p.tag || "",
    active: p.active !== false,
    images,
    img: p.img || "",
  };
}

function seed(products = [], cats = [], slides = []) {
  const categoryList = cats
    .filter((x) => x && x !== "All")
    .map((name, index) => ({
      id: `CAT-${index + 1}`,
      name,
      subs: [],
    }));

  return {
    products: products.map(normalizeProduct),

    categories: categoryList,

    orders: [],

    reviews: [],

    hero: slides.map((slide, index) => ({
      id: `HERO-${index + 1}`,
      image: slide.image || "",
      title: slide.l1 || "",
      title2: slide.l2 || "",
      description: slide.text || "",
      cta: slide.cta || "Shop now",
      category: slide.cat || "All",
      active: true,
    })),

    coupons: [
      {
        id: "CP-1",
        code: "WELCOME10",
        type: "percent",
        value: 10,
        min: 0,
        expires: "",
        limit: 0,
        used: 0,
        active: true,
      },
    ],

    team: [{ ...OWNER }],

    logs: [
      logItem(
        "Admin initialized",
        "Ever Style admin panel initialized.",
        "System"
      ),
    ],
  };
}

function repairOwner(data) {
  let team = Array.isArray(data.team) ? [...data.team] : [];

  const index = team.findIndex(
    (u) =>
      u.id === OWNER.id ||
      String(u.email || "").toLowerCase() ===
        ADMIN_EMAIL.toLowerCase()
  );

  if (index === -1) {
    team.unshift({ ...OWNER });
  } else {
    team[index] = {
      ...team[index],
      id: OWNER.id,
      name: team[index].name || "Owner",
      email: ADMIN_EMAIL,
      role: "Owner",
      pass: ADMIN_PASS,
      active: true,
    };
  }

  return {
    ...data,
    team,
  };
}

function readData(products, cats, slides) {
  const fresh = seed(products, cats, slides);
  const saved = getStored();

  if (!saved) {
    const data = repairOwner(fresh);
    saveStored(data);
    return data;
  }

  const merged = {
    ...fresh,
    ...saved,

    products: Array.isArray(saved.products)
      ? saved.products.map(normalizeProduct)
      : fresh.products,

    categories: Array.isArray(saved.categories)
      ? saved.categories
      : fresh.categories,

    orders: Array.isArray(saved.orders)
      ? saved.orders
      : [],

    reviews: Array.isArray(saved.reviews)
      ? saved.reviews
      : [],

    hero: Array.isArray(saved.hero)
      ? saved.hero
      : fresh.hero,

    coupons: Array.isArray(saved.coupons)
      ? saved.coupons
      : fresh.coupons,

    team: Array.isArray(saved.team)
      ? saved.team
      : fresh.team,

    logs: Array.isArray(saved.logs)
      ? saved.logs
      : fresh.logs,
  };

  const repaired = repairOwner(merged);

  saveStored(repaired);

  return repaired;
}

/* ============================================================
   STOREFRONT HELPERS
   Used by App.jsx
============================================================ */

export function saveOrder(order) {
  const data = getStored() || {
    orders: [],
    coupons: [],
    logs: [],
  };

  const newOrder = {
    ...order,

    id:
      order.id ||
      `ES-${Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase()}`,

    status: order.status || "Pending",

    time:
      order.time ||
      order.ts ||
      new Date().toISOString(),

    payment:
      order.payment ||
      order.pay ||
      "Cash on delivery",
  };

  data.orders = [
    newOrder,
    ...(Array.isArray(data.orders) ? data.orders : []),
  ];

  if (order.coupon) {
    data.coupons = (data.coupons || []).map((c) =>
      c.code === order.coupon
        ? {
            ...c,
            used: Number(c.used || 0) + 1,
          }
        : c
    );
  }

  data.logs = [
    logItem(
      "New order",
      `${newOrder.id} · ${money(newOrder.total)}`,
      "Customer"
    ),
    ...(data.logs || []),
  ].slice(0, 500);

  saveStored(data);

  return newOrder;
}

export function findCoupon(code, subtotal = 0) {
  const data = getStored();

  const coupons = data?.coupons || [];

  const normalized = String(code || "")
    .trim()
    .toUpperCase();

  const coupon = coupons.find(
    (x) =>
      String(x.code || "").toUpperCase() === normalized
  );

  if (!coupon || coupon.active === false) return null;

  if (
    coupon.expires &&
    new Date(`${coupon.expires}T23:59:59`) <
      new Date()
  ) {
    return null;
  }

  if (
    Number(coupon.limit || 0) > 0 &&
    Number(coupon.used || 0) >=
      Number(coupon.limit)
  ) {
    return null;
  }

  if (Number(subtotal) < Number(coupon.min || 0)) {
    return null;
  }

  return coupon;
}

export function couponValue(coupon, subtotal = 0) {
  if (!coupon) return 0;

  if (
    coupon.type === "percent" ||
    coupon.type === "pct"
  ) {
    return Math.min(
      Number(subtotal),
      Math.round(
        (Number(subtotal) *
          Number(coupon.value || 0)) /
          100
      )
    );
  }

  return Math.min(
    Number(subtotal),
    Number(coupon.value || 0)
  );
}

export function applyAdminCatalog(
  products,
  cats,
  slides
) {
  try {
    const data = getStored();

    if (!data) return;

    if (
      Array.isArray(products) &&
      Array.isArray(data.products)
    ) {
      const nextProducts = data.products
        .filter((x) => x.active !== false)
        .map((item) => {
          const original =
            products.find(
              (x) =>
                String(x.id) === String(item.id)
            ) || {};

          return {
            ...original,
            id: item.id,
            name: item.name,
            cat: item.category,
            price: Number(item.price || 0),
            stock: Number(item.stock || 0),
            tag: item.tag || undefined,
            image:
              item.images?.[0] ||
              original.image,
            images: item.images || [],
            img: item.img || original.img,
          };
        });

      products.splice(
        0,
        products.length,
        ...nextProducts
      );
    }

    if (
      Array.isArray(cats) &&
      Array.isArray(data.categories)
    ) {
      cats.splice(
        0,
        cats.length,
        "All",
        ...data.categories.map((x) => x.name)
      );
    }

    if (
      Array.isArray(slides) &&
      Array.isArray(data.hero)
    ) {
      slides.splice(
        0,
        slides.length,
        ...data.hero
          .filter((x) => x.active !== false)
          .map((x) => ({
            image: x.image || "",
            l1: x.title || "",
            l2: x.title2 || "",
            text: x.description || "",
            cta: x.cta || "Shop now",
            cat: x.category || "All",
          }))
      );
    }
  } catch (error) {
    console.error("Admin catalog error:", error);
  }
}

/* ============================================================
   REUSABLE UI
============================================================ */

function Status({ value }) {
  const cls = String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "-");

  return (
    <span className={`ad-status ad-${cls}`}>
      <i />
      {value}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <label className="ad-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Empty({
  icon = "◇",
  title,
  text,
}) {
  return (
    <div className="ad-empty">
      <div>{icon}</div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
    </div>
  );
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
}) {
  return (
    <div
      className="ad-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget)
          onClose();
      }}
    >
      <section
        className={`ad-modal ${
          wide ? "ad-modal-wide" : ""
        }`}
      >
        <header className="ad-modal-head">
          <div>
            <span>EVER STYLE ADMIN</span>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>

          <button
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="ad-modal-content">
          {children}
        </div>
      </section>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      className={`ad-toggle ${
        value ? "on" : ""
      }`}
      onClick={() => onChange(!value)}
    >
      <span />
    </button>
  );
}

/* ============================================================
   CUSTOMER AGGREGATION
============================================================ */

function buildCustomers(orders) {
  const map = {};

  (orders || []).forEach((order) => {
    const key =
      order.phone ||
      order.email ||
      `${order.name}-${order.address}`;

    if (!map[key]) {
      map[key] = {
        id: key,
        name: order.name || "Customer",
        phone: order.phone || "",
        email: order.email || "",
        address: order.address || "",
        spent: 0,
        orders: [],
      };
    }

    map[key].orders.push(order);

    if (order.status !== "Cancelled") {
      map[key].spent += Number(
        order.total || 0
      );
    }
  });

  return Object.values(map).sort(
    (a, b) => b.spent - a.spent
  );
}

/* ============================================================
   DASHBOARD
============================================================ */

function Dashboard({ data, go }) {
  const customers = useMemo(
    () => buildCustomers(data.orders),
    [data.orders]
  );

  const revenue = data.orders
    .filter(
      (x) => x.status !== "Cancelled"
    )
    .reduce(
      (sum, x) =>
        sum + Number(x.total || 0),
      0
    );

  const pending = data.orders.filter(
    (x) => x.status === "Pending"
  ).length;

  const low = data.products.filter(
    (x) =>
      Number(x.stock || 0) <=
      Number(x.low ?? LOW)
  );

  const approvedReviews =
    data.reviews.filter(
      (x) => x.status === "Approved"
    ).length;

  const stats = [
    {
      label: "Total Revenue",
      value: money(revenue),
      note: "From active orders",
      icon: "৳",
      target: "orders",
    },
    {
      label: "Orders",
      value: data.orders.length,
      note: `${pending} pending`,
      icon: "▣",
      target: "orders",
    },
    {
      label: "Customers",
      value: customers.length,
      note: "Unique customers",
      icon: "◎",
      target: "customers",
    },
    {
      label: "Low Stock",
      value: low.length,
      note: "Needs attention",
      icon: "!",
      target: "inventory",
    },
  ];

  const chart = Array.from(
    { length: 7 },
    (_, i) => {
      const date = new Date();

      date.setDate(
        date.getDate() - (6 - i)
      );

      const amount = data.orders
        .filter((order) => {
          const d = new Date(
            order.time || order.ts
          );

          return (
            d.toDateString() ===
              date.toDateString() &&
            order.status !== "Cancelled"
          );
        })
        .reduce(
          (sum, x) =>
            sum + Number(x.total || 0),
          0
        );

      return {
        label: date.toLocaleDateString(
          "en-GB",
          { weekday: "short" }
        ),
        amount,
      };
    }
  );

  const maxChart = Math.max(
    ...chart.map((x) => x.amount),
    1
  );

  return (
    <div className="ad-stack">
      <section className="ad-stats">
        {stats.map((item) => (
          <button
            key={item.label}
            className="ad-stat"
            onClick={() => go(item.target)}
          >
            <div className="ad-stat-top">
              <span className="ad-stat-icon">
                {item.icon}
              </span>

              <span className="ad-stat-arrow">
                ↗
              </span>
            </div>

            <strong>{item.value}</strong>
            <h3>{item.label}</h3>
            <p>{item.note}</p>
          </button>
        ))}
      </section>

      <section className="ad-dashboard-grid">
        <article className="ad-card">
          <div className="ad-card-head">
            <div>
              <span className="ad-kicker">
                PERFORMANCE
              </span>
              <h2>Sales overview</h2>
            </div>

            <span className="ad-pill">
              Last 7 days
            </span>
          </div>

          <div className="ad-chart">
            {chart.map((x) => (
              <div
                className="ad-chart-item"
                key={x.label}
              >
                <div className="ad-chart-space">
                  <div
                    className="ad-chart-bar"
                    style={{
                      height: `${Math.max(
                        4,
                        (x.amount /
                          maxChart) *
                          100
                      )}%`,
                    }}
                    title={money(x.amount)}
                  />
                </div>

                <span>{x.label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="ad-card">
          <div className="ad-card-head">
            <div>
              <span className="ad-kicker">
                ACTIVITY
              </span>
              <h2>Store overview</h2>
            </div>
          </div>

          <div className="ad-overview-list">
            <button
              onClick={() => go("products")}
            >
              <span>
                <i>◇</i>
                Products
              </span>
              <b>{data.products.length}</b>
            </button>

            <button
              onClick={() => go("reviews")}
            >
              <span>
                <i>★</i>
                Approved reviews
              </span>
              <b>{approvedReviews}</b>
            </button>

            <button
              onClick={() => go("coupons")}
            >
              <span>
                <i>%</i>
                Active coupons
              </span>
              <b>
                {
                  data.coupons.filter(
                    (x) => x.active
                  ).length
                }
              </b>
            </button>

            <button
              onClick={() => go("hero")}
            >
              <span>
                <i>▧</i>
                Hero banners
              </span>
              <b>{data.hero.length}</b>
            </button>
          </div>
        </article>
      </section>

      <section className="ad-card">
        <div className="ad-card-head">
          <div>
            <span className="ad-kicker">
              RECENT
            </span>
            <h2>Latest orders</h2>
          </div>

          <button
            className="ad-link"
            onClick={() => go("orders")}
          >
            View all →
          </button>
        </div>

        {data.orders.length ? (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {data.orders
                  .slice(0, 6)
                  .map((order) => (
                    <tr key={order.id}>
                      <td>
                        <b>{order.id}</b>
                      </td>

                      <td>
                        <b>
                          {order.name ||
                            "Customer"}
                        </b>
                        <small>
                          {order.phone ||
                            order.email}
                        </small>
                      </td>

                      <td>
                        <b>
                          {money(
                            order.total
                          )}
                        </b>
                      </td>

                      <td>
                        <Status
                          value={
                            order.status
                          }
                        />
                      </td>

                      <td>
                        {dateText(
                          order.time ||
                            order.ts
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            icon="▣"
            title="No orders yet"
            text="New customer orders will appear here."
          />
        )}
      </section>

      <section className="ad-card">
        <div className="ad-card-head">
          <div>
            <span className="ad-kicker">
              INVENTORY
            </span>
            <h2>Stock attention</h2>
          </div>

          <button
            className="ad-link"
            onClick={() =>
              go("inventory")
            }
          >
            Manage stock →
          </button>
        </div>

        {low.length ? (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {low
                  .slice(0, 7)
                  .map((product) => (
                    <tr key={product.id}>
                      <td>
                        <b>
                          {product.name}
                        </b>
                      </td>

                      <td>
                        {product.sku}
                      </td>

                      <td>
                        {product.category ||
                          "—"}
                      </td>

                      <td>
                        {product.stock}
                      </td>

                      <td>
                        <Status
                          value={
                            product.stock <=
                            0
                              ? "Out of stock"
                              : "Low stock"
                          }
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Inventory looks good"
            text="No low-stock products right now."
          />
        )}
      </section>
    </div>
  );
}

/* ============================================================
   ORDERS
============================================================ */

function Orders({ data, update }) {
  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState("All");

  const [selected, setSelected] =
    useState(null);

  const orders = useMemo(() => {
    return data.orders.filter(
      (order) => {
        const matchStatus =
          filter === "All" ||
          order.status === filter;

        const text = `${order.id} ${
          order.name || ""
        } ${order.phone || ""} ${
          order.email || ""
        }`.toLowerCase();

        return (
          matchStatus &&
          text.includes(
            search
              .trim()
              .toLowerCase()
          )
        );
      }
    );
  }, [
    data.orders,
    search,
    filter,
  ]);

  const setStatus = (
    order,
    status
  ) => {
    update(
      (state) => ({
        orders: state.orders.map(
          (x) =>
            x.id === order.id
              ? { ...x, status }
              : x
        ),
      }),
      "Order updated",
      `${order.id}: ${order.status} → ${status}`
    );

    setSelected((current) =>
      current?.id === order.id
        ? {
            ...current,
            status,
          }
        : current
    );
  };

  return (
    <>
      <div className="ad-toolbar">
        <div className="ad-search">
          <span>⌕</span>
          <input
            placeholder="Search order, customer or phone..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <select
          className="ad-select"
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value)
          }
        >
          <option>All</option>

          {STATUSES.map((x) => (
            <option key={x}>
              {x}
            </option>
          ))}
        </select>
      </div>

      <section className="ad-card ad-no-padding">
        {orders.length ? (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Order ID</th>
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
                      <b>
                        {order.name ||
                          "Customer"}
                      </b>
                      <small>
                        {order.phone ||
                          order.email ||
                          "—"}
                      </small>
                    </td>

                    <td>
                      {dateText(
                        order.time ||
                          order.ts
                      )}
                    </td>

                    <td>
                      {order.payment ||
                        order.pay ||
                        "—"}
                    </td>

                    <td>
                      <b>
                        {money(
                          order.total
                        )}
                      </b>
                    </td>

                    <td>
                      <Status
                        value={
                          order.status
                        }
                      />
                    </td>

                    <td>
                      <button
                        className="ad-round-btn"
                        onClick={() =>
                          setSelected(
                            order
                          )
                        }
                      >
                        →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            icon="▣"
            title="No orders found"
            text="Try another search or status filter."
          />
        )}
      </section>

      {selected && (
        <Modal
          wide
          title={`Order ${selected.id}`}
          subtitle="Order details and fulfilment"
          onClose={() =>
            setSelected(null)
          }
        >
          <div className="ad-summary-grid">
            <div>
              <span>Customer</span>
              <b>
                {selected.name ||
                  "Customer"}
              </b>
            </div>

            <div>
              <span>Total</span>
              <b>
                {money(
                  selected.total
                )}
              </b>
            </div>

            <div>
              <span>Payment</span>
              <b>
                {selected.payment ||
                  selected.pay ||
                  "—"}
              </b>
            </div>

            <div>
              <span>Placed</span>
              <b>
                {dateText(
                  selected.time ||
                    selected.ts
                )}
              </b>
            </div>
          </div>

          <div className="ad-two-col">
            <section className="ad-inner-card">
              <h3>Order items</h3>

              {(selected.items || [])
                .length ? (
                selected.items.map(
                  (item, index) => (
                    <div
                      className="ad-line"
                      key={index}
                    >
                      <div>
                        <b>
                          {item.name}
                        </b>
                        <span>
                          Qty:{" "}
                          {item.qty ||
                            1}
                        </span>
                      </div>

                      <b>
                        {money(
                          Number(
                            item.price ||
                              0
                          ) *
                            Number(
                              item.qty ||
                                1
                            )
                        )}
                      </b>
                    </div>
                  )
                )
              ) : (
                <p className="ad-muted">
                  No item details
                  available.
                </p>
              )}

              {selected.coupon && (
                <div className="ad-line">
                  <div>
                    <b>
                      Coupon
                    </b>
                    <span>
                      {
                        selected.coupon
                      }
                    </span>
                  </div>

                  <b>
                    −
                    {money(
                      selected.discount ||
                        0
                    )}
                  </b>
                </div>
              )}
            </section>

            <section className="ad-inner-card">
              <h3>
                Customer details
              </h3>

              <div className="ad-info-row">
                <span>Phone</span>
                <b>
                  {selected.phone ||
                    "—"}
                </b>
              </div>

              <div className="ad-info-row">
                <span>Email</span>
                <b>
                  {selected.email ||
                    "—"}
                </b>
              </div>

              <div className="ad-info-row">
                <span>
                  Address
                </span>
                <b>
                  {selected.address ||
                    "—"}
                </b>
              </div>

              <Field label="Order status">
                <select
                  className="ad-input"
                  value={
                    selected.status
                  }
                  onChange={(e) =>
                    setStatus(
                      selected,
                      e.target.value
                    )
                  }
                >
                  {STATUSES.map(
                    (x) => (
                      <option
                        key={x}
                      >
                        {x}
                      </option>
                    )
                  )}
                </select>
              </Field>
            </section>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ============================================================
   PRODUCT EDITOR
============================================================ */

function ProductEditor({
  product,
  categories,
  onSave,
  onClose,
}) {
  const [form, setForm] =
    useState(
      product
        ? {
            ...product,
            images:
              product.images || [],
          }
        : {
            name: "",
            sku: "",
            category:
              categories[0]?.name ||
              "",
            subcategory: "",
            price: "",
            stock: 10,
            low: LOW,
            tag: "",
            active: true,
            images: [],
            img: "",
          }
    );

  const [uploading, setUploading] =
    useState(false);

  const subs =
    categories.find(
      (x) =>
        x.name === form.category
    )?.subs || [];

  const uploadImages = async (
    files
  ) => {
    if (!files?.length) return;

    setUploading(true);

    try {
      const remaining =
        4 -
        (form.images?.length ||
          0);

      const selected = [
        ...files,
      ].slice(0, remaining);

      const urls =
        await Promise.all(
          selected.map((file) =>
            imageToDataURL(
              file,
              1200,
              0.78
            )
          )
        );

      setForm((old) => ({
        ...old,
        images: [
          ...(old.images || []),
          ...urls.filter(Boolean),
        ].slice(0, 4),
      }));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setForm((old) => ({
      ...old,
      images: old.images.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const mainImage = (index) => {
    setForm((old) => {
      const images = [
        ...old.images,
      ];

      const [image] =
        images.splice(index, 1);

      images.unshift(image);

      return {
        ...old,
        images,
      };
    });
  };

  const submit = (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert(
        "Please enter product name."
      );
      return;
    }

    onSave({
      ...form,

      name: form.name.trim(),

      sku:
        form.sku.trim() ||
        `ES-${Date.now()
          .toString()
          .slice(-6)}`,

      price: Number(
        form.price || 0
      ),

      stock: Number(
        form.stock || 0
      ),

      low: Number(
        form.low || LOW
      ),
    });
  };

  return (
    <form onSubmit={submit}>
      <div className="ad-product-editor">
        <div className="ad-form-section">
          <div className="ad-form-section-title">
            <span>01</span>
            <div>
              <h3>
                Product information
              </h3>
              <p>
                Basic product details
                and pricing.
              </p>
            </div>
          </div>

          <div className="ad-form-grid">
            <Field label="Product name">
              <input
                className="ad-input"
                placeholder="Product name"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name:
                      e.target
                        .value,
                  })
                }
              />
            </Field>

            <Field label="SKU">
              <input
                className="ad-input"
                placeholder="Auto generated"
                value={
                  form.sku || ""
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    sku:
                      e.target
                        .value,
                  })
                }
              />
            </Field>

            <Field label="Price (৳)">
              <input
                className="ad-input"
                type="number"
                min="0"
                value={form.price}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price:
                      e.target
                        .value,
                  })
                }
              />
            </Field>

            <Field label="Stock quantity">
              <input
                className="ad-input"
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) =>
                  setForm({
                    ...form,
                    stock:
                      e.target
                        .value,
                  })
                }
              />
            </Field>

            <Field label="Low stock warning">
              <input
                className="ad-input"
                type="number"
                min="0"
                value={form.low}
                onChange={(e) =>
                  setForm({
                    ...form,
                    low:
                      e.target
                        .value,
                  })
                }
              />
            </Field>

            <Field label="Product label">
              <select
                className="ad-input"
                value={
                  form.tag || ""
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    tag:
                      e.target
                        .value,
                  })
                }
              >
                <option value="">
                  None
                </option>
                <option>
                  New
                </option>
                <option>
                  Sale
                </option>
                <option>
                  Best seller
                </option>
                <option>
                  Top rated
                </option>
              </select>
            </Field>
          </div>
        </div>

        <div className="ad-form-section">
          <div className="ad-form-section-title">
            <span>02</span>

            <div>
              <h3>
                Category
              </h3>
              <p>
                Organize this product
                in your catalog.
              </p>
            </div>
          </div>

          <div className="ad-form-grid">
            <Field label="Category">
              <select
                className="ad-input"
                value={
                  form.category
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    category:
                      e.target
                        .value,
                    subcategory:
                      "",
                  })
                }
              >
                <option value="">
                  Select category
                </option>

                {categories.map(
                  (cat) => (
                    <option
                      key={cat.id}
                    >
                      {cat.name}
                    </option>
                  )
                )}
              </select>
            </Field>

            <Field label="Sub-category">
              <select
                className="ad-input"
                value={
                  form.subcategory ||
                  ""
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    subcategory:
                      e.target
                        .value,
                  })
                }
              >
                <option value="">
                  None
                </option>

                {subs.map((x) => (
                  <option key={x}>
                    {x}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="ad-visibility">
            <div>
              <b>
                Product visibility
              </b>
              <span>
                Show this product on
                your storefront.
              </span>
            </div>

            <Toggle
              value={
                form.active !== false
              }
              onChange={(active) =>
                setForm({
                  ...form,
                  active,
                })
              }
            />
          </div>
        </div>

        <div className="ad-form-section">
          <div className="ad-form-section-title">
            <span>03</span>

            <div>
              <h3>
                Product images
              </h3>
              <p>
                Add up to 4 images.
                First image is the main
                product photo.
              </p>
            </div>
          </div>

          <div className="ad-image-grid">
            {(form.images || []).map(
              (image, index) => (
                <div
                  className="ad-product-image"
                  key={index}
                >
                  <img
                    src={image}
                    alt=""
                  />

                  {index === 0 && (
                    <span className="ad-main-image">
                      Main
                    </span>
                  )}

                  <button
                    type="button"
                    className="ad-remove-image"
                    onClick={() =>
                      removeImage(
                        index
                      )
                    }
                  >
                    ×
                  </button>

                  {index > 0 && (
                    <button
                      type="button"
                      className="ad-make-main"
                      onClick={() =>
                        mainImage(
                          index
                        )
                      }
                    >
                      ★
                    </button>
                  )}
                </div>
              )
            )}

            {(form.images || [])
              .length < 4 && (
              <label className="ad-image-upload">
                <div>＋</div>
                <b>
                  {uploading
                    ? "Processing..."
                    : "Add image"}
                </b>
                <span>
                  JPG, PNG or WEBP
                </span>

                <input
                  hidden
                  multiple
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    uploadImages(
                      e.target.files
                    );
                    e.target.value =
                      "";
                  }}
                />
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="ad-modal-actions">
        <button
          type="button"
          className="ad-btn ad-btn-light"
          onClick={onClose}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="ad-btn ad-btn-primary"
        >
          Save product
        </button>
      </div>
    </form>
  );
}

/* ============================================================
   PRODUCTS
============================================================ */

function Products({ data, update }) {
  const [search, setSearch] =
    useState("");

  const [category, setCategory] =
    useState("All");

  const [editor, setEditor] =
    useState(null);

  const products = useMemo(
    () =>
      data.products.filter(
        (p) => {
          const matchesCategory =
            category === "All" ||
            p.category === category;

          const text = `${p.name} ${
            p.sku || ""
          }`.toLowerCase();

          return (
            matchesCategory &&
            text.includes(
              search
                .trim()
                .toLowerCase()
            )
          );
        }
      ),
    [
      data.products,
      category,
      search,
    ]
  );

  const save = (product) => {
    if (editor?.product) {
      update(
        (state) => ({
          products:
            state.products.map(
              (x) =>
                x.id ===
                editor.product.id
                  ? {
                      ...x,
                      ...product,
                    }
                  : x
            ),
        }),
        "Product updated",
        product.name
      );
    } else {
      const newProduct = {
        ...product,
        id: uid("PRODUCT"),
      };

      update(
        (state) => ({
          products: [
            newProduct,
            ...state.products,
          ],
        }),
        "Product added",
        newProduct.name
      );
    }

    setEditor(null);
  };

  const remove = (product) => {
    if (
      !confirm(
        `Delete "${product.name}"?`
      )
    )
      return;

    update(
      (state) => ({
        products:
          state.products.filter(
            (x) =>
              x.id !== product.id
          ),
      }),
      "Product deleted",
      product.name
    );
  };

  const toggle = (product) => {
    update(
      (state) => ({
        products:
          state.products.map(
            (x) =>
              x.id === product.id
                ? {
                    ...x,
                    active:
                      !x.active,
                  }
                : x
          ),
      }),
      product.active
        ? "Product hidden"
        : "Product published",
      product.name
    );
  };

  return (
    <>
      <div className="ad-toolbar">
        <div className="ad-search">
          <span>⌕</span>

          <input
            placeholder="Search products or SKU..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <select
          className="ad-select"
          value={category}
          onChange={(e) =>
            setCategory(e.target.value)
          }
        >
          <option>All</option>

          {data.categories.map(
            (x) => (
              <option key={x.id}>
                {x.name}
              </option>
            )
          )}
        </select>

        <button
          className="ad-btn ad-btn-primary"
          onClick={() =>
            setEditor({
              product: null,
            })
          }
        >
          ＋ Add product
        </button>
      </div>

      {products.length ? (
        <div className="ad-product-grid">
          {products.map((product) => (
            <article
              className="ad-product-card"
              key={product.id}
            >
              <div className="ad-product-photo">
                {product.images?.[0] ? (
                  <img
                    src={
                      product
                        .images[0]
                    }
                    alt={
                      product.name
                    }
                  />
                ) : (
                  <div className="ad-photo-placeholder">
                    ◇
                  </div>
                )}

                <span
                  className={`ad-live ${
                    product.active
                      ? ""
                      : "hidden"
                  }`}
                >
                  {product.active
                    ? "Live"
                    : "Hidden"}
                </span>

                {product.tag && (
                  <span className="ad-product-tag">
                    {product.tag}
                  </span>
                )}
              </div>

              <div className="ad-product-info">
                <span className="ad-product-category">
                  {product.category ||
                    "Uncategorized"}
                </span>

                <h3>
                  {product.name}
                </h3>

                <p>
                  {product.sku}
                </p>

                <div className="ad-product-data">
                  <div>
                    <span>
                      Price
                    </span>
                    <b>
                      {money(
                        product.price
                      )}
                    </b>
                  </div>

                  <div>
                    <span>
                      Stock
                    </span>
                    <b>
                      {
                        product.stock
                      }
                    </b>
                  </div>

                  <div>
                    <span>
                      Status
                    </span>
                    <Status
                      value={
                        product.stock <=
                        0
                          ? "Out of stock"
                          : product.stock <=
                            (product.low ||
                              LOW)
                          ? "Low stock"
                          : "In stock"
                      }
                    />
                  </div>
                </div>

                <div className="ad-product-buttons">
                  <button
                    className="ad-btn ad-btn-light"
                    onClick={() =>
                      setEditor({
                        product,
                      })
                    }
                  >
                    Edit
                  </button>

                  <button
                    className="ad-icon-action"
                    title={
                      product.active
                        ? "Hide"
                        : "Publish"
                    }
                    onClick={() =>
                      toggle(product)
                    }
                  >
                    {product.active
                      ? "◉"
                      : "○"}
                  </button>

                  <button
                    className="ad-icon-action danger"
                    onClick={() =>
                      remove(product)
                    }
                  >
                    ×
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="ad-card">
          <Empty
            title="No products found"
            text="Create a new product or change your filters."
          />
        </section>
      )}

      {editor && (
        <Modal
          wide
          title={
            editor.product
              ? "Edit product"
              : "Add new product"
          }
          subtitle="Manage product information, images and inventory."
          onClose={() =>
            setEditor(null)
          }
        >
          <ProductEditor
            product={
              editor.product
            }
            categories={
              data.categories
            }
            onSave={save}
            onClose={() =>
              setEditor(null)
            }
          />
        </Modal>
      )}
    </>
  );
}

/* ============================================================
   INVENTORY
============================================================ */

function Inventory({
  data,
  update,
}) {
  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState("All");

  const products = useMemo(
    () =>
      data.products.filter(
        (p) => {
          const text = `${p.name} ${
            p.sku || ""
          }`.toLowerCase();

          if (
            !text.includes(
              search
                .trim()
                .toLowerCase()
            )
          )
            return false;

          if (
            filter === "Low stock"
          ) {
            return (
              p.stock > 0 &&
              p.stock <=
                (p.low || LOW)
            );
          }

          if (
            filter ===
            "Out of stock"
          ) {
            return p.stock <= 0;
          }

          return true;
        }
      ),
    [
      data.products,
      search,
      filter,
    ]
  );

  const changeStock = (
    product,
    value
  ) => {
    const stock = Math.max(
      0,
      Number(value || 0)
    );

    if (stock === product.stock)
      return;

    update(
      (state) => ({
        products:
          state.products.map(
            (x) =>
              x.id === product.id
                ? {
                    ...x,
                    stock,
                  }
                : x
          ),
      }),
      "Inventory updated",
      `${product.name}: ${product.stock} → ${stock}`
    );
  };

  const changeLow = (
    product,
    value
  ) => {
    const low = Math.max(
      0,
      Number(value || 0)
    );

    update(
      (state) => ({
        products:
          state.products.map(
            (x) =>
              x.id === product.id
                ? {
                    ...x,
                    low,
                  }
                : x
          ),
      }),
      "Low-stock alert updated",
      `${product.name}: ${low}`
    );
  };

  const units =
    data.products.reduce(
      (sum, x) =>
        sum +
        Number(x.stock || 0),
      0
    );

  const lowCount =
    data.products.filter(
      (x) =>
        x.stock <=
        (x.low || LOW)
    ).length;

  return (
    <>
      <section className="ad-mini-stats">
        <div>
          <span>
            Total products
          </span>
          <b>
            {data.products.length}
          </b>
        </div>

        <div>
          <span>
            Units in stock
          </span>
          <b>{units}</b>
        </div>

        <div>
          <span>
            Low / out of stock
          </span>
          <b>{lowCount}</b>
        </div>
      </section>

      <div className="ad-toolbar">
        <div className="ad-search">
          <span>⌕</span>

          <input
            placeholder="Search inventory..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <select
          className="ad-select"
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value)
          }
        >
          <option>All</option>
          <option>
            Low stock
          </option>
          <option>
            Out of stock
          </option>
        </select>
      </div>

      <section className="ad-card ad-no-padding">
        {products.length ? (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Status</th>
                  <th>Quick stock</th>
                  <th>Exact stock</th>
                  <th>Low alert</th>
                </tr>
              </thead>

              <tbody>
                {products.map(
                  (product) => (
                    <tr
                      key={
                        product.id
                      }
                    >
                      <td>
                        <div className="ad-table-product">
                          {product
                            .images?.[0] ? (
                            <img
                              src={
                                product
                                  .images[0]
                              }
                              alt=""
                            />
                          ) : (
                            <span>
                              ◇
                            </span>
                          )}

                          <div>
                            <b>
                              {
                                product.name
                              }
                            </b>
                            <small>
                              {product.category ||
                                "—"}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        {product.sku}
                      </td>

                      <td>
                        <Status
                          value={
                            product.stock <=
                            0
                              ? "Out of stock"
                              : product.stock <=
                                (product.low ||
                                  LOW)
                              ? "Low stock"
                              : "In stock"
                          }
                        />
                      </td>

                      <td>
                        <div className="ad-stepper">
                          <button
                            onClick={() =>
                              changeStock(
                                product,
                                product.stock -
                                  1
                              )
                            }
                          >
                            −
                          </button>

                          <b>
                            {
                              product.stock
                            }
                          </b>

                          <button
                            onClick={() =>
                              changeStock(
                                product,
                                product.stock +
                                  1
                              )
                            }
                          >
                            +
                          </button>
                        </div>
                      </td>

                      <td>
                        <input
                          key={`stock-${product.id}-${product.stock}`}
                          className="ad-number"
                          type="number"
                          min="0"
                          defaultValue={
                            product.stock
                          }
                          onBlur={(
                            e
                          ) =>
                            changeStock(
                              product,
                              e.target
                                .value
                            )
                          }
                        />
                      </td>

                      <td>
                        <input
                          key={`low-${product.id}-${product.low}`}
                          className="ad-number"
                          type="number"
                          min="0"
                          defaultValue={
                            product.low ||
                            LOW
                          }
                          onBlur={(
                            e
                          ) =>
                            changeLow(
                              product,
                              e.target
                                .value
                            )
                          }
                        />
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No inventory found"
            text="Try another filter."
          />
        )}
      </section>
    </>
  );
}

/* ============================================================
   CATEGORIES
============================================================ */

function Categories({
  data,
  update,
}) {
  const [name, setName] =
    useState("");

  const [subInputs, setSubInputs] =
    useState({});

  const addCategory = (e) => {
    e.preventDefault();

    const value = name.trim();

    if (!value) return;

    if (
      data.categories.some(
        (x) =>
          x.name.toLowerCase() ===
          value.toLowerCase()
      )
    ) {
      alert(
        "Category already exists."
      );
      return;
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

  const addSub = (category) => {
    const value = String(
      subInputs[category.id] || ""
    ).trim();

    if (!value) return;

    if (
      category.subs?.some(
        (x) =>
          x.toLowerCase() ===
          value.toLowerCase()
      )
    ) {
      alert(
        "Sub-category already exists."
      );
      return;
    }

    update(
      (state) => ({
        categories:
          state.categories.map(
            (x) =>
              x.id === category.id
                ? {
                    ...x,
                    subs: [
                      ...(x.subs ||
                        []),
                      value,
                    ],
                  }
                : x
          ),
      }),
      "Sub-category added",
      `${category.name} → ${value}`
    );

    setSubInputs((old) => ({
      ...old,
      [category.id]: "",
    }));
  };

  const removeSub = (
    category,
    sub
  ) => {
    update(
      (state) => ({
        categories:
          state.categories.map(
            (x) =>
              x.id === category.id
                ? {
                    ...x,
                    subs: (
                      x.subs || []
                    ).filter(
                      (s) =>
                        s !== sub
                    ),
                  }
                : x
          ),

        products:
          state.products.map(
            (p) =>
              p.category ===
                category.name &&
              p.subcategory === sub
                ? {
                    ...p,
                    subcategory:
                      "",
                  }
                : p
          ),
      }),
      "Sub-category deleted",
      `${category.name} → ${sub}`
    );
  };

  const removeCategory = (
    category
  ) => {
    const used =
      data.products.some(
        (x) =>
          x.category ===
          category.name
      );

    if (used) {
      alert(
        "This category has products. Move or delete those products first."
      );
      return;
    }

    if (
      !confirm(
        `Delete category "${category.name}"?`
      )
    )
      return;

    update(
      (state) => ({
        categories:
          state.categories.filter(
            (x) =>
              x.id !== category.id
          ),
      }),
      "Category deleted",
      category.name
    );
  };

  return (
    <>
      <form
        className="ad-create-category"
        onSubmit={addCategory}
      >
        <div>
          <span className="ad-kicker">
            CATALOG
          </span>
          <h2>
            Create a category
          </h2>
          <p>
            Add a new product
            category to your store.
          </p>
        </div>

        <input
          className="ad-input"
          placeholder="e.g. Fashion"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
        />

        <button className="ad-btn ad-btn-primary">
          ＋ Add category
        </button>
      </form>

      {data.categories.length ? (
        <div className="ad-category-grid">
          {data.categories.map(
            (category) => {
              const count =
                data.products.filter(
                  (x) =>
                    x.category ===
                    category.name
                ).length;

              return (
                <article
                  className="ad-card"
                  key={
                    category.id
                  }
                >
                  <div className="ad-card-head">
                    <div>
                      <span className="ad-kicker">
                        CATEGORY
                      </span>
                      <h2>
                        {
                          category.name
                        }
                      </h2>
                      <p>
                        {count}{" "}
                        product
                        {count === 1
                          ? ""
                          : "s"}
                      </p>
                    </div>

                    <button
                      className="ad-round-btn danger"
                      onClick={() =>
                        removeCategory(
                          category
                        )
                      }
                    >
                      ×
                    </button>
                  </div>

                  <div className="ad-subcategories">
                    {(category.subs ||
                      []).map(
                      (sub) => (
                        <span
                          key={sub}
                        >
                          {sub}

                          <button
                            onClick={() =>
                              removeSub(
                                category,
                                sub
                              )
                            }
                          >
                            ×
                          </button>
                        </span>
                      )
                    )}

                    {!category.subs
                      ?.length && (
                      <p className="ad-muted">
                        No
                        sub-categories
                        yet.
                      </p>
                    )}
                  </div>

                  <div className="ad-inline-form">
                    <input
                      className="ad-input"
                      placeholder="Add sub-category"
                      value={
                        subInputs[
                          category.id
                        ] || ""
                      }
                      onChange={(e) =>
                        setSubInputs(
                          (old) => ({
                            ...old,
                            [category.id]:
                              e
                                .target
                                .value,
                          })
                        )
                      }
                      onKeyDown={(
                        e
                      ) => {
                        if (
                          e.key ===
                          "Enter"
                        ) {
                          e.preventDefault();
                          addSub(
                            category
                          );
                        }
                      }}
                    />

                    <button
                      className="ad-btn ad-btn-light"
                      onClick={() =>
                        addSub(
                          category
                        )
                      }
                    >
                      Add
                    </button>
                  </div>
                </article>
              );
            }
          )}
        </div>
      ) : (
        <section className="ad-card">
          <Empty
            title="No categories"
            text="Create your first category."
          />
        </section>
      )}
    </>
  );
}

/* ============================================================
   CUSTOMERS
============================================================ */

function Customers({ data }) {
  const [search, setSearch] =
    useState("");

  const [selected, setSelected] =
    useState(null);

  const customers = useMemo(
    () =>
      buildCustomers(
        data.orders
      ).filter((c) =>
        `${c.name} ${c.phone} ${c.email}`
          .toLowerCase()
          .includes(
            search
              .trim()
              .toLowerCase()
          )
      ),
    [data.orders, search]
  );

  return (
    <>
      <div className="ad-toolbar">
        <div className="ad-search">
          <span>⌕</span>

          <input
            placeholder="Search customers..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>
      </div>

      {customers.length ? (
        <div className="ad-customer-grid">
          {customers.map(
            (customer) => (
              <button
                className="ad-customer"
                key={customer.id}
                onClick={() =>
                  setSelected(
                    customer
                  )
                }
              >
                <div className="ad-customer-avatar">
                  {customer.name
                    ?.charAt(0)
                    .toUpperCase() ||
                    "C"}
                </div>

                <div className="ad-customer-main">
                  <h3>
                    {customer.name}
                  </h3>

                  <span>
                    {customer.phone ||
                      customer.email ||
                      "No contact"}
                  </span>
                </div>

                <div className="ad-customer-stats">
                  <div>
                    <b>
                      {
                        customer
                          .orders
                          .length
                      }
                    </b>
                    <span>
                      Orders
                    </span>
                  </div>

                  <div>
                    <b>
                      {money(
                        customer.spent
                      )}
                    </b>
                    <span>
                      Spent
                    </span>
                  </div>
                </div>

                <span className="ad-customer-arrow">
                  →
                </span>
              </button>
            )
          )}
        </div>
      ) : (
        <section className="ad-card">
          <Empty
            icon="◎"
            title="No customers found"
            text="Customers are created automatically from orders."
          />
        </section>
      )}

      {selected && (
        <Modal
          wide
          title={selected.name}
          subtitle="Customer profile and order history"
          onClose={() =>
            setSelected(null)
          }
        >
          <div className="ad-summary-grid">
            <div>
              <span>Phone</span>
              <b>
                {selected.phone ||
                  "—"}
              </b>
            </div>

            <div>
              <span>Email</span>
              <b>
                {selected.email ||
                  "—"}
              </b>
            </div>

            <div>
              <span>Orders</span>
              <b>
                {
                  selected.orders
                    .length
                }
              </b>
            </div>

            <div>
              <span>Total spent</span>
              <b>
                {money(
                  selected.spent
                )}
              </b>
            </div>
          </div>

          <section className="ad-inner-card">
            <h3>
              Shipping address
            </h3>

            <p className="ad-muted">
              {selected.address ||
                "No address available."}
            </p>
          </section>

          <section className="ad-inner-card">
            <h3>Order history</h3>

            {selected.orders.map(
              (order) => (
                <div
                  className="ad-line"
                  key={order.id}
                >
                  <div>
                    <b>
                      {order.id}
                    </b>

                    <span>
                      {dateText(
                        order.time ||
                          order.ts
                      )}
                    </span>
                  </div>

                  <div className="ad-line-right">
                    <b>
                      {money(
                        order.total
                      )}
                    </b>

                    <Status
                      value={
                        order.status
                      }
                    />
                  </div>
                </div>
              )
            )}
          </section>
        </Modal>
      )}
    </>
  );
}

/* ============================================================
   REVIEWS
============================================================ */

function Reviews({ data, update }) {
  const [filter, setFilter] =
    useState("All");

  const reviews =
    data.reviews.filter(
      (x) =>
        filter === "All" ||
        x.status === filter
    );

  const setStatus = (
    review,
    status
  ) => {
    update(
      (state) => ({
        reviews:
          state.reviews.map(
            (x) =>
              x.id === review.id
                ? {
                    ...x,
                    status,
                  }
                : x
          ),
      }),
      `Review ${status.toLowerCase()}`,
      `${review.author || "Customer"} · ${review.product}`
    );
  };

  const remove = (review) => {
    if (
      !confirm(
        "Delete this review?"
      )
    )
      return;

    update(
      (state) => ({
        reviews:
          state.reviews.filter(
            (x) =>
              x.id !== review.id
          ),
      }),
      "Review deleted",
      review.product
    );
  };

  return (
    <>
      <div className="ad-tabs">
        {[
          "All",
          "Pending",
          "Approved",
          "Rejected",
        ].map((x) => (
          <button
            key={x}
            className={
              filter === x
                ? "active"
                : ""
            }
            onClick={() =>
              setFilter(x)
            }
          >
            {x}
          </button>
        ))}
      </div>

      {reviews.length ? (
        <div className="ad-review-grid">
          {reviews.map((review) => (
            <article
              className="ad-review-card"
              key={review.id}
            >
              <div className="ad-review-head">
                <div className="ad-review-avatar">
                  {(review.author ||
                    "C")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <h3>
                    {review.author ||
                      "Customer"}
                  </h3>

                  <span>
                    {dateText(
                      review.time ||
                        review.ts
                    )}
                  </span>
                </div>

                <Status
                  value={
                    review.status
                  }
                />
              </div>

              <div className="ad-stars">
                <b>
                  {"★".repeat(
                    Number(
                      review.rating ||
                        0
                    )
                  )}
                </b>

                <span>
                  {"★".repeat(
                    Math.max(
                      0,
                      5 -
                        Number(
                          review.rating ||
                            0
                        )
                    )
                  )}
                </span>
              </div>

              <span className="ad-review-product">
                {review.product}
              </span>

              <p>
                {review.text}
              </p>

              <div className="ad-review-actions">
                {review.status !==
                  "Approved" && (
                  <button
                    className="ad-btn ad-btn-primary"
                    onClick={() =>
                      setStatus(
                        review,
                        "Approved"
                      )
                    }
                  >
                    Approve
                  </button>
                )}

                {review.status !==
                  "Rejected" && (
                  <button
                    className="ad-btn ad-btn-light"
                    onClick={() =>
                      setStatus(
                        review,
                        "Rejected"
                      )
                    }
                  >
                    Reject
                  </button>
                )}

                <button
                  className="ad-btn ad-btn-danger"
                  onClick={() =>
                    remove(review)
                  }
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="ad-card">
          <Empty
            icon="★"
            title="No reviews"
            text="Customer reviews will appear here."
          />
        </section>
      )}
    </>
  );
}

/* ============================================================
   HERO / BANNERS
============================================================ */

function Hero({ data, update }) {
  const addBanner = () => {
    const banner = {
      id: uid("HERO"),
      image: "",
      title: "New collection",
      title2: "Discover your style",
      description:
        "Explore our latest products.",
      cta: "Shop now",
      category: "All",
      active: true,
    };

    update(
      (state) => ({
        hero: [
          ...state.hero,
          banner,
        ],
      }),
      "Hero banner added",
      banner.title
    );
  };

  const patch = (
    banner,
    changes,
    log = true
  ) => {
    update(
      (state) => ({
        hero: state.hero.map(
          (x) =>
            x.id === banner.id
              ? {
                  ...x,
                  ...changes,
                }
              : x
        ),
      }),
      log
        ? "Hero banner updated"
        : "Hero changed",
      banner.title
    );
  };

  const upload = async (
    banner,
    file
  ) => {
    if (!file) return;

    const image =
      await imageToDataURL(
        file,
        1800,
        0.78
      );

    patch(banner, { image });
  };

  const remove = (banner) => {
    if (
      !confirm(
        "Delete this banner?"
      )
    )
      return;

    update(
      (state) => ({
        hero: state.hero.filter(
          (x) =>
            x.id !== banner.id
        ),
      }),
      "Hero banner deleted",
      banner.title
    );
  };

  const move = (
    index,
    direction
  ) => {
    const target =
      index + direction;

    if (
      target < 0 ||
      target >= data.hero.length
    )
      return;

    update(
      (state) => {
        const hero = [
          ...state.hero,
        ];

        [
          hero[index],
          hero[target],
        ] = [
          hero[target],
          hero[index],
        ];

        return { hero };
      },
      "Hero order changed",
      `Banner ${index + 1}`
    );
  };

  return (
    <>
      <div className="ad-section-intro">
        <div>
          <span className="ad-kicker">
            STOREFRONT
          </span>
          <h2>
            Hero slider management
          </h2>
          <p>
            Upload promotional
            images and manage the
            homepage hero slider.
          </p>
        </div>

        <button
          className="ad-btn ad-btn-primary"
          onClick={addBanner}
        >
          ＋ Add banner
        </button>
      </div>

      {data.hero.length ? (
        <div className="ad-hero-list">
          {data.hero.map(
            (banner, index) => (
              <article
                className="ad-hero-card"
                key={banner.id}
              >
                <div className="ad-hero-preview">
                  {banner.image ? (
                    <img
                      src={
                        banner.image
                      }
                      alt=""
                    />
                  ) : (
                    <div className="ad-hero-placeholder">
                      <span>
                        ▧
                      </span>
                      <b>
                        Banner image
                      </b>
                      <small>
                        Recommended
                        1600 × 900
                      </small>
                    </div>
                  )}

                  <label className="ad-upload-banner">
                    {banner.image
                      ? "Change image"
                      : "Upload image"}

                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={(
                        e
                      ) => {
                        upload(
                          banner,
                          e.target
                            .files[0]
                        );

                        e.target.value =
                          "";
                      }}
                    />
                  </label>

                  <div className="ad-banner-number">
                    {String(
                      index + 1
                    ).padStart(
                      2,
                      "0"
                    )}
                  </div>
                </div>

                <div className="ad-hero-form">
                  <div className="ad-card-head">
                    <div>
                      <span className="ad-kicker">
                        BANNER{" "}
                        {index + 1}
                      </span>

                      <h2>
                        {banner.title ||
                          "Untitled banner"}
                      </h2>
                    </div>

                    <div className="ad-small-actions">
                      <button
                        disabled={
                          index === 0
                        }
                        onClick={() =>
                          move(
                            index,
                            -1
                          )
                        }
                      >
                        ↑
                      </button>

                      <button
                        disabled={
                          index ===
                          data.hero
                            .length -
                            1
                        }
                        onClick={() =>
                          move(
                            index,
                            1
                          )
                        }
                      >
                        ↓
                      </button>

                      <button
                        className="danger"
                        onClick={() =>
                          remove(
                            banner
                          )
                        }
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  <div className="ad-form-grid">
                    <Field label="Main headline">
                      <input
                        className="ad-input"
                        defaultValue={
                          banner.title
                        }
                        onBlur={(
                          e
                        ) =>
                          patch(
                            banner,
                            {
                              title:
                                e
                                  .target
                                  .value,
                            }
                          )
                        }
                      />
                    </Field>

                    <Field label="Second headline">
                      <input
                        className="ad-input"
                        defaultValue={
                          banner.title2
                        }
                        onBlur={(
                          e
                        ) =>
                          patch(
                            banner,
                            {
                              title2:
                                e
                                  .target
                                  .value,
                            }
                          )
                        }
                      />
                    </Field>

                    <Field label="CTA button">
                      <input
                        className="ad-input"
                        defaultValue={
                          banner.cta
                        }
                        onBlur={(
                          e
                        ) =>
                          patch(
                            banner,
                            {
                              cta:
                                e
                                  .target
                                  .value,
                            }
                          )
                        }
                      />
                    </Field>

                    <Field label="CTA category">
                      <select
                        className="ad-input"
                        value={
                          banner.category ||
                          "All"
                        }
                        onChange={(
                          e
                        ) =>
                          patch(
                            banner,
                            {
                              category:
                                e
                                  .target
                                  .value,
                            }
                          )
                        }
                      >
                        <option>
                          All
                        </option>

                        {data.categories.map(
                          (cat) => (
                            <option
                              key={
                                cat.id
                              }
                            >
                              {
                                cat.name
                              }
                            </option>
                          )
                        )}
                      </select>
                    </Field>
                  </div>

                  <Field label="Description">
                    <textarea
                      className="ad-input"
                      rows="3"
                      defaultValue={
                        banner.description
                      }
                      onBlur={(
                        e
                      ) =>
                        patch(
                          banner,
                          {
                            description:
                              e
                                .target
                                .value,
                          }
                        )
                      }
                    />
                  </Field>

                  <div className="ad-visibility">
                    <div>
                      <b>
                        Banner active
                      </b>
                      <span>
                        Show this
                        banner on the
                        storefront.
                      </span>
                    </div>

                    <Toggle
                      value={
                        banner.active !==
                        false
                      }
                      onChange={(
                        active
                      ) =>
                        patch(
                          banner,
                          {
                            active,
                          }
                        )
                      }
                    />
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      ) : (
        <section className="ad-card">
          <Empty
            icon="▧"
            title="No hero banners"
            text="Add your first homepage banner."
          />
        </section>
      )}
    </>
  );
}

/* ============================================================
   COUPONS
============================================================ */

function Coupons({
  data,
  update,
}) {
  const blank = {
    code: "",
    type: "percent",
    value: "",
    min: "",
    expires: "",
    limit: "",
  };

  const [form, setForm] =
    useState(blank);

  const create = (e) => {
    e.preventDefault();

    const code = form.code
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");

    const value = Number(
      form.value || 0
    );

    if (!code || value <= 0) {
      alert(
        "Enter a coupon code and discount value."
      );
      return;
    }

    if (
      data.coupons.some(
        (x) =>
          x.code.toUpperCase() ===
          code
      )
    ) {
      alert(
        "Coupon already exists."
      );
      return;
    }

    if (
      form.type === "percent" &&
      value > 100
    ) {
      alert(
        "Percentage cannot be over 100."
      );
      return;
    }

    const coupon = {
      id: uid("CP"),
      code,
      type: form.type,
      value,
      min: Number(
        form.min || 0
      ),
      expires:
        form.expires || "",
      limit: Number(
        form.limit || 0
      ),
      used: 0,
      active: true,
    };

    update(
      (state) => ({
        coupons: [
          coupon,
          ...state.coupons,
        ],
      }),
      "Coupon created",
      coupon.code
    );

    setForm(blank);
  };

  const toggle = (coupon) => {
    update(
      (state) => ({
        coupons:
          state.coupons.map(
            (x) =>
              x.id === coupon.id
                ? {
                    ...x,
                    active:
                      !x.active,
                  }
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
    if (
      !confirm(
        `Delete coupon ${coupon.code}?`
      )
    )
      return;

    update(
      (state) => ({
        coupons:
          state.coupons.filter(
            (x) =>
              x.id !== coupon.id
          ),
      }),
      "Coupon deleted",
      coupon.code
    );
  };

  return (
    <>
      <form
        className="ad-card"
        onSubmit={create}
      >
        <div className="ad-card-head">
          <div>
            <span className="ad-kicker">
              PROMOTIONS
            </span>
            <h2>
              Create coupon
            </h2>
            <p>
              Create percentage or
              fixed discounts for
              customers.
            </p>
          </div>
        </div>

        <div className="ad-coupon-form">
          <Field label="Coupon code">
            <input
              className="ad-input uppercase"
              placeholder="SAVE20"
              value={form.code}
              onChange={(e) =>
                setForm({
                  ...form,
                  code:
                    e.target.value,
                })
              }
            />
          </Field>

          <Field label="Discount type">
            <select
              className="ad-input"
              value={form.type}
              onChange={(e) =>
                setForm({
                  ...form,
                  type:
                    e.target.value,
                })
              }
            >
              <option value="percent">
                Percentage
              </option>

              <option value="fixed">
                Fixed amount
              </option>
            </select>
          </Field>

          <Field
            label={
              form.type ===
              "percent"
                ? "Discount %"
                : "Discount ৳"
            }
          >
            <input
              className="ad-input"
              type="number"
              min="0"
              value={form.value}
              onChange={(e) =>
                setForm({
                  ...form,
                  value:
                    e.target.value,
                })
              }
            />
          </Field>

          <Field label="Minimum order">
            <input
              className="ad-input"
              type="number"
              min="0"
              value={form.min}
              onChange={(e) =>
                setForm({
                  ...form,
                  min:
                    e.target.value,
                })
              }
            />
          </Field>

          <Field label="Expiry date">
            <input
              className="ad-input"
              type="date"
              value={form.expires}
              onChange={(e) =>
                setForm({
                  ...form,
                  expires:
                    e.target.value,
                })
              }
            />
          </Field>

          <Field label="Usage limit">
            <input
              className="ad-input"
              type="number"
              min="0"
              placeholder="0 = unlimited"
              value={form.limit}
              onChange={(e) =>
                setForm({
                  ...form,
                  limit:
                    e.target.value,
                })
              }
            />
          </Field>
        </div>

        <button className="ad-btn ad-btn-primary">
          Create coupon
        </button>
      </form>

      {data.coupons.length ? (
        <div className="ad-coupon-grid">
          {data.coupons.map(
            (coupon) => (
              <article
                className="ad-coupon"
                key={coupon.id}
              >
                <div className="ad-coupon-strip">
                  <span>
                    EVER STYLE
                  </span>
                  <b>%</b>
                </div>

                <div className="ad-coupon-main">
                  <div className="ad-card-head">
                    <div>
                      <span className="ad-kicker">
                        COUPON
                      </span>

                      <h2>
                        {
                          coupon.code
                        }
                      </h2>
                    </div>

                    <Status
                      value={
                        coupon.active
                          ? "Active"
                          : "Paused"
                      }
                    />
                  </div>

                  <strong className="ad-discount">
                    {coupon.type ===
                      "percent" ||
                    coupon.type ===
                      "pct"
                      ? `${coupon.value}% OFF`
                      : `${money(
                          coupon.value
                        )} OFF`}
                  </strong>

                  <div className="ad-coupon-details">
                    <span>
                      Minimum:{" "}
                      {coupon.min
                        ? money(
                            coupon.min
                          )
                        : "None"}
                    </span>

                    <span>
                      Used:{" "}
                      {coupon.used ||
                        0}
                      {coupon.limit
                        ? ` / ${coupon.limit}`
                        : ""}
                    </span>

                    <span>
                      Expiry:{" "}
                      {coupon.expires ||
                        "No expiry"}
                    </span>
                  </div>

                  <div className="ad-row-actions">
                    <button
                      className="ad-btn ad-btn-light"
                      onClick={() =>
                        toggle(
                          coupon
                        )
                      }
                    >
                      {coupon.active
                        ? "Pause"
                        : "Activate"}
                    </button>

                    <button
                      className="ad-btn ad-btn-danger"
                      onClick={() =>
                        remove(
                          coupon
                        )
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      ) : (
        <section className="ad-card">
          <Empty
            title="No coupons"
            text="Create your first discount coupon."
          />
        </section>
      )}
    </>
  );
}

/* ============================================================
   TEAM
============================================================ */

function Team({
  data,
  update,
  currentUser,
}) {
  const blank = {
    name: "",
    email: "",
    role: "Support",
    pass: "",
  };

  const [form, setForm] =
    useState(blank);

  const add = (e) => {
    e.preventDefault();

    const email = form.email
      .trim()
      .toLowerCase();

    if (
      !form.name.trim() ||
      !email.includes("@") ||
      form.pass.length < 6
    ) {
      alert(
        "Enter name, valid email and at least 6 character passcode."
      );
      return;
    }

    if (
      data.team.some(
        (x) =>
          String(
            x.email || ""
          ).toLowerCase() ===
          email
      )
    ) {
      alert(
        "This email already has access."
      );
      return;
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
        team: [
          ...state.team,
          member,
        ],
      }),
      "Team member added",
      `${member.name} · ${member.role}`
    );

    setForm(blank);
  };

  const patch = (
    member,
    changes,
    action
  ) => {
    update(
      (state) => ({
        team: state.team.map(
          (x) =>
            x.id === member.id
              ? {
                  ...x,
                  ...changes,
                }
              : x
        ),
      }),
      action,
      member.name
    );
  };

  const remove = (member) => {
    if (
      member.id === OWNER.id
    ) {
      alert(
        "Primary Owner cannot be removed."
      );
      return;
    }

    if (
      member.id ===
      currentUser.id
    ) {
      alert(
        "You cannot remove yourself."
      );
      return;
    }

    if (
      !confirm(
        `Remove ${member.name}?`
      )
    )
      return;

    update(
      (state) => ({
        team: state.team.filter(
          (x) =>
            x.id !== member.id
        ),
      }),
      "Team member removed",
      member.name
    );
  };

  return (
    <>
      <form
        className="ad-card"
        onSubmit={add}
      >
        <div className="ad-card-head">
          <div>
            <span className="ad-kicker">
              ACCESS CONTROL
            </span>
            <h2>
              Add team member
            </h2>
            <p>
              Give staff access with
              role-based permissions.
            </p>
          </div>
        </div>

        <div className="ad-form-grid">
          <Field label="Full name">
            <input
              className="ad-input"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name:
                    e.target.value,
                })
              }
            />
          </Field>

          <Field label="Email">
            <input
              className="ad-input"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email:
                    e.target.value,
                })
              }
            />
          </Field>

          <Field label="Role">
            <select
              className="ad-input"
              value={form.role}
              onChange={(e) =>
                setForm({
                  ...form,
                  role:
                    e.target.value,
                })
              }
            >
              {Object.keys(
                PERMISSIONS
              ).map((role) => (
                <option
                  key={role}
                >
                  {role}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Passcode">
            <input
              className="ad-input"
              type="password"
              value={form.pass}
              onChange={(e) =>
                setForm({
                  ...form,
                  pass:
                    e.target.value,
                })
              }
            />
          </Field>
        </div>

        <button className="ad-btn ad-btn-primary">
          ＋ Add member
        </button>
      </form>

      <div className="ad-team-list">
        {data.team.map(
          (member) => (
            <article
              className="ad-team-member"
              key={member.id}
            >
              <div className="ad-team-avatar">
                {member.name
                  ?.charAt(0)
                  .toUpperCase() ||
                  "U"}
              </div>

              <div className="ad-team-info">
                <h3>
                  {member.name}

                  {member.id ===
                    currentUser.id && (
                    <small>
                      {" "}
                      You
                    </small>
                  )}
                </h3>

                <span>
                  {member.email}
                </span>
              </div>

              <Status
                value={
                  member.active
                    ? "Active"
                    : "Paused"
                }
              />

              <div className="ad-team-actions">
                <select
                  className="ad-select"
                  value={
                    member.role
                  }
                  disabled={
                    member.id ===
                    OWNER.id
                  }
                  onChange={(e) =>
                    patch(
                      member,
                      {
                        role:
                          e.target
                            .value,
                      },
                      "Team role updated"
                    )
                  }
                >
                  {Object.keys(
                    PERMISSIONS
                  ).map((role) => (
                    <option
                      key={role}
                    >
                      {role}
                    </option>
                  ))}
                </select>

                {member.id !==
                  OWNER.id && (
                  <button
                    className="ad-btn ad-btn-light"
                    onClick={() =>
                      patch(
                        member,
                        {
                          active:
                            !member.active,
                        },
                        member.active
                          ? "Team access paused"
                          : "Team access restored"
                      )
                    }
                  >
                    {member.active
                      ? "Pause"
                      : "Restore"}
                  </button>
                )}

                {member.id !==
                  OWNER.id && (
                  <button
                    className="ad-btn ad-btn-danger"
                    onClick={() =>
                      remove(
                        member
                      )
                    }
                  >
                    Remove
                  </button>
                )}
              </div>
            </article>
          )
        )}
      </div>

      <section className="ad-card">
        <div className="ad-card-head">
          <div>
            <span className="ad-kicker">
              PERMISSIONS
            </span>
            <h2>
              Role permissions
            </h2>
          </div>
        </div>

        {Object.entries(
          PERMISSIONS
        ).map(
          ([role, pages]) => (
            <div
              className="ad-permission-row"
              key={role}
            >
              <b>{role}</b>

              <span>
                {pages
                  .map(
                    (page) =>
                      NAV.find(
                        (x) =>
                          x[0] ===
                          page
                      )?.[1]
                  )
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
          )
        )}
      </section>
    </>
  );
}

/* ============================================================
   AUDIT LOG
============================================================ */

function Audit({ data }) {
  const [search, setSearch] =
    useState("");

  const logs = data.logs.filter(
    (log) =>
      `${log.action} ${log.detail} ${log.who}`
        .toLowerCase()
        .includes(
          search
            .trim()
            .toLowerCase()
        )
  );

  return (
    <>
      <div className="ad-toolbar">
        <div className="ad-search">
          <span>⌕</span>

          <input
            placeholder="Search activity..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>
      </div>

      <section className="ad-card">
        {logs.length ? (
          <div className="ad-timeline">
            {logs.map((log) => (
              <div
                className="ad-log"
                key={log.id}
              >
                <div className="ad-log-line">
                  <span />
                </div>

                <div className="ad-log-content">
                  <div>
                    <h3>
                      {log.action}
                    </h3>

                    <time>
                      {dateText(
                        log.time
                      )}
                    </time>
                  </div>

                  <p>
                    {log.detail}
                  </p>

                  <small>
                    By {log.who}
                  </small>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty
            icon="◷"
            title="No activity found"
          />
        )}
      </section>
    </>
  );
}

/* ============================================================
   PAGE TITLES
============================================================ */

const TITLES = {
  dashboard: {
    title: "Dashboard",
    text: "A complete overview of your Ever Style store.",
  },

  orders: {
    title: "Orders",
    text: "Manage customer orders, payments and fulfilment.",
  },

  products: {
    title: "Products",
    text: "Manage your product catalog, pricing and images.",
  },

  inventory: {
    title: "Inventory",
    text: "Track stock quantities and low-stock alerts.",
  },

  categories: {
    title: "Categories",
    text: "Organize products into categories and sub-categories.",
  },

  customers: {
    title: "Customers",
    text: "View customer profiles, spending and order history.",
  },

  reviews: {
    title: "Reviews",
    text: "Moderate and manage customer product reviews.",
  },

  hero: {
    title: "Hero & Banners",
    text: "Control the promotional content on your storefront.",
  },

  coupons: {
    title: "Coupons",
    text: "Create and manage promotional discount codes.",
  },

  team: {
    title: "Team Access",
    text: "Manage staff accounts, roles and permissions.",
  },

  audit: {
    title: "Audit Log",
    text: "Track important changes made inside the admin panel.",
  },
};

/* ============================================================
   MAIN PANEL
============================================================ */

function Panel({
  products,
  cats,
  slides,
  meId,
  onBack,
  logout,
}) {
  const [data, setData] =
    useState(() =>
      readData(
        products,
        cats,
        slides
      )
    );

  const [page, setPage] =
    useState("dashboard");

  const [mobileMenu, setMobileMenu] =
    useState(false);

  const [storageWarning, setStorageWarning] =
    useState(false);

  const me = data.team.find(
    (x) => x.id === meId
  );

  const allowed =
    PERMISSIONS[me?.role] || [];

  useEffect(() => {
    if (!me || !me.active) {
      try {
        sessionStorage.removeItem(OK);
      } catch {}

      logout();
    }
  }, [me?.id, me?.active]);

  useEffect(() => {
    const ok = saveStored(data);

    setStorageWarning(!ok);
  }, [data]);

  if (!me || !me.active) {
    return (
      <div className="ad-session-repair">
        <div className="ad-session-repair-card">
          <span className="ad-session-spinner" />
          <b>Restoring admin session...</b>
          <small>Please wait a moment.</small>
        </div>
      </div>
    );
  }

  const currentPage =
    allowed.includes(page)
      ? page
      : "dashboard";

  const go = (id) => {
    if (!allowed.includes(id))
      return;

    setPage(id);
    setMobileMenu(false);
  };

  const update = (
    callback,
    action,
    detail
  ) => {
    setData((old) => {
      const changes =
        callback(old) || {};

      return {
        ...old,
        ...changes,

        logs: [
          logItem(
            action,
            detail,
            me.name
          ),
          ...(old.logs || []),
        ].slice(0, 500),
      };
    });
  };

  const groups = [
    "Overview",
    "Commerce",
    "Customers",
    "Marketing",
    "System",
  ];

  const title =
    TITLES[currentPage];

  const pending =
    data.orders.filter(
      (x) => x.status === "Pending"
    ).length;

  return (
    <div className="ad-shell">
      {mobileMenu && (
        <button
          className="ad-mobile-overlay"
          onClick={() =>
            setMobileMenu(false)
          }
        />
      )}

      <aside
        className={`ad-sidebar ${
          mobileMenu
            ? "ad-sidebar-open"
            : ""
        }`}
      >
        <div className="ad-brand">
          <div className="ad-brand-mark">
            ES
          </div>

          <div>
            <strong>
              EVER STYLE
            </strong>
            <span>
              ADMIN CONSOLE
            </span>
          </div>
        </div>

        <nav className="ad-nav">
          {groups.map((group) => {
            const items =
              NAV.filter(
                (x) =>
                  x[3] === group &&
                  allowed.includes(
                    x[0]
                  )
              );

            if (!items.length)
              return null;

            return (
              <div
                className="ad-nav-group"
                key={group}
              >
                <span className="ad-nav-title">
                  {group}
                </span>

                {items.map(
                  ([
                    id,
                    label,
                    icon,
                  ]) => (
                    <button
                      key={id}
                      className={
                        currentPage ===
                        id
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        go(id)
                      }
                    >
                      <span className="ad-nav-icon">
                        {icon}
                      </span>

                      <span>
                        {label}
                      </span>

                      {id ===
                        "orders" &&
                        pending >
                          0 && (
                          <em>
                            {
                              pending
                            }
                          </em>
                        )}
                    </button>
                  )
                )}
              </div>
            );
          })}
        </nav>

        <div className="ad-sidebar-footer">
          <button
            className="ad-view-store"
            onClick={onBack}
          >
            <span className="ad-view-icon">
              ↗
            </span>

            <div>
              <b>
                View storefront
              </b>
              <small>
                Open Ever Style
              </small>
            </div>
          </button>

          <div className="ad-admin-user">
            <div className="ad-admin-avatar">
              {me.name
                ?.charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <b>{me.name}</b>
              <span>{me.role}</span>
            </div>

            <button
              title="Sign out"
              onClick={logout}
            >
              ↪
            </button>
          </div>
        </div>
      </aside>

      <main className="ad-main">
        <header className="ad-header">
          <div className="ad-header-left">
            <button
              className="ad-menu-button"
              onClick={() =>
                setMobileMenu(true)
              }
            >
              ☰
            </button>

            <div>
              <span className="ad-header-kicker">
                EVER STYLE / ADMIN
              </span>

              <h1>
                {title.title}
              </h1>

              <p>
                {title.text}
              </p>
            </div>
          </div>

          <div className="ad-header-right">
            <button
              className="ad-store-button"
              onClick={onBack}
            >
              View store
              <span>↗</span>
            </button>

            <div className="ad-header-profile">
              <div>
                {me.name
                  ?.charAt(0)
                  .toUpperCase()}
              </div>

              <span>
                <b>{me.name}</b>
                <small>
                  {me.role}
                </small>
              </span>
            </div>
          </div>
        </header>

        <div className="ad-content">
          {storageWarning && (
            <div className="ad-warning">
              Browser storage is
              almost/full. Remove some
              uploaded images before
              adding more.
            </div>
          )}

          {currentPage ===
            "dashboard" && (
            <Dashboard
              data={data}
              go={go}
            />
          )}

          {currentPage ===
            "orders" && (
            <Orders
              data={data}
              update={update}
            />
          )}

          {currentPage ===
            "products" && (
            <Products
              data={data}
              update={update}
            />
          )}

          {currentPage ===
            "inventory" && (
            <Inventory
              data={data}
              update={update}
            />
          )}

          {currentPage ===
            "categories" && (
            <Categories
              data={data}
              update={update}
            />
          )}

          {currentPage ===
            "customers" && (
            <Customers
              data={data}
            />
          )}

          {currentPage ===
            "reviews" && (
            <Reviews
              data={data}
              update={update}
            />
          )}

          {currentPage ===
            "hero" && (
            <Hero
              data={data}
              update={update}
            />
          )}

          {currentPage ===
            "coupons" && (
            <Coupons
              data={data}
              update={update}
            />
          )}

          {currentPage ===
            "team" && (
            <Team
              data={data}
              update={update}
              currentUser={me}
            />
          )}

          {currentPage ===
            "audit" && (
            <Audit data={data} />
          )}
        </div>
      </main>
    </div>
  );
}

/* ============================================================
   ADMIN LOGIN
============================================================ */

export default function Admin({
  products = [],
  cats = [],
  slides = [],
  onBack = () => {},
}) {
  const [meId, setMeId] =
    useState(() => {
      try {
        return (
          sessionStorage.getItem(
            OK
          ) || ""
        );
      } catch {
        return "";
      }
    });

  const [email, setEmail] =
    useState("");

  const [pass, setPass] =
    useState("");

  const [error, setError] =
    useState(false);

  const [showPass, setShowPass] =
    useState(false);

  useEffect(() => {
    const data = readData(
      products,
      cats,
      slides
    );

    saveStored(
      repairOwner(data)
    );
  }, [products, cats, slides]);

  const login = (e) => {
    e.preventDefault();

    const data = repairOwner(
      readData(
        products,
        cats,
        slides
      )
    );

    saveStored(data);

    const em = email
      .trim()
      .toLowerCase();

    const user = em
      ? data.team.find(
          (x) =>
            String(
              x.email || ""
            ).toLowerCase() ===
              em &&
            x.active
        )
      : data.team.find(
          (x) =>
            x.role === "Owner" &&
            x.active
        );

    if (
      user &&
      pass === user.pass
    ) {
      try {
        sessionStorage.setItem(
          OK,
          user.id
        );
      } catch {}

      data.logs = [
        logItem(
          "Signed in",
          "Admin panel opened.",
          user.name
        ),
        ...(data.logs || []),
      ];

      saveStored(data);

      setMeId(user.id);
      setPass("");
      setError(false);

      return;
    }

    setError(true);
  };

  const logout = () => {
    try {
      sessionStorage.removeItem(
        OK
      );
    } catch {}

    setMeId("");
    setEmail("");
    setPass("");
  };

  return (
    <>
      <style>{ADMIN_CSS}</style>

      {meId ? (
        <Panel
          products={products}
          cats={cats}
          slides={slides}
          meId={meId}
          onBack={onBack}
          logout={logout}
        />
      ) : (
        <div className="ad-login">
          <div className="ad-login-decoration ad-dec-1" />
          <div className="ad-login-decoration ad-dec-2" />

          <button
            className="ad-login-back"
            onClick={onBack}
          >
            ← Back to store
          </button>

          <section className="ad-login-panel">
            <div className="ad-login-brand">
              <div className="ad-login-logo">
                ES
              </div>

              <div>
                <strong>
                  EVER STYLE
                </strong>

                <span>
                  ADMIN CONSOLE
                </span>
              </div>
            </div>

            <div className="ad-login-copy">
              <span>
                STORE MANAGEMENT
              </span>

              <h1>
                Welcome
                <br />
                back.
              </h1>

              <p>
                Manage your products,
                orders, customers and
                storefront from one
                beautifully organized
                workspace.
              </p>
            </div>

            <div className="ad-login-feature">
              <div>01</div>
              <span>
                <b>
                  Complete control
                </b>
                Products, inventory,
                orders and marketing.
              </span>
            </div>

            <div className="ad-login-feature">
              <div>02</div>
              <span>
                <b>
                  Secure access
                </b>
                Role-based access for
                your admin team.
              </span>
            </div>
          </section>

          <section className="ad-login-form-side">
            <form
              className="ad-login-form"
              onSubmit={login}
            >
              <div className="ad-login-form-head">
                <span>
                  ADMIN ACCESS
                </span>

                <h2>
                  Sign in to your
                  account
                </h2>

                <p>
                  Enter your admin
                  credentials to
                  continue.
                </p>
              </div>

              <Field label="Email address">
                <input
                  className="ad-input ad-login-input"
                  type="email"
                  placeholder="owner@everstyle.store"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => {
                    setEmail(
                      e.target.value
                    );
                    setError(false);
                  }}
                />
              </Field>

              <Field label="Passcode">
                <div className="ad-password">
                  <input
                    className={`ad-input ad-login-input ${
                      error
                        ? "error"
                        : ""
                    }`}
                    type={
                      showPass
                        ? "text"
                        : "password"
                    }
                    placeholder="Enter passcode"
                    autoComplete="current-password"
                    value={pass}
                    onChange={(e) => {
                      setPass(
                        e.target
                          .value
                      );
                      setError(
                        false
                      );
                    }}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPass(
                        !showPass
                      )
                    }
                  >
                    {showPass
                      ? "Hide"
                      : "Show"}
                  </button>
                </div>
              </Field>

              {error && (
                <div className="ad-login-error">
                  Incorrect email or
                  passcode. Please try
                  again.
                </div>
              )}

              <button className="ad-signin">
                <span>
                  Sign in to admin
                </span>
                <b>→</b>
              </button>

              <div className="ad-login-hint">
                <span>
                  Owner access
                </span>

                <p>
                  You can leave the
                  email field empty and
                  use the Owner
                  passcode.
                </p>
              </div>
            </form>
          </section>

          <div className="ad-login-footer">
            © 2026 Ever Style ·
            Premium lifestyle
            marketplace
          </div>
        </div>
      )}
    </>
  );
}

/* ============================================================
   CSS — STORE MATCHED THEME
============================================================ */

const ADMIN_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&family=Hind+Siliguri:wght@400;500;600;700&display=swap');

*{
  box-sizing:border-box;
}

.ad-shell,
.ad-login{
  --green:#17392B;
  --green-2:#1F4A38;
  --green-3:#285A45;
  --green-soft:#E8EFEA;
  --cream:#F7F3E8;
  --cream-2:#F5EBD2;
  --champagne:#E8D4A5;
  --gold:#C6A968;
  --white:#FFFFFF;
  --ink:#17201B;
  --muted:#758078;
  --border:#E3E8E3;
  --danger:#B94B47;
  --orange:#B87726;

  font-family:"DM Sans","Hind Siliguri",sans-serif;
  color:var(--ink);
}

.ad-shell button,
.ad-shell input,
.ad-shell select,
.ad-shell textarea,
.ad-login button,
.ad-login input,
.ad-login select{
  font:inherit;
}

.ad-shell h1,
.ad-shell h2,
.ad-shell h3,
.ad-login h1,
.ad-login h2,
.ad-login h3{
  font-family:"Bricolage Grotesque","Hind Siliguri",sans-serif;
}

/* ---------- MAIN LAYOUT ---------- */

.ad-shell{
  min-height:100vh;
  display:flex;
  background:#F7F8F5;
}

.ad-sidebar{
  width:270px;
  position:fixed;
  z-index:60;
  left:0;
  top:0;
  bottom:0;
  background:var(--green);
  color:white;
  display:flex;
  flex-direction:column;
  overflow:auto;
  padding:22px 15px 15px;
}

.ad-brand{
  min-height:65px;
  display:flex;
  align-items:center;
  gap:12px;
  padding:0 8px 20px;
  border-bottom:1px solid rgba(255,255,255,.11);
}

.ad-brand-mark{
  width:43px;
  height:43px;
  border-radius:50%;
  display:grid;
  place-items:center;
  flex:none;
  background:var(--cream-2);
  color:var(--green);
  font-family:"Bricolage Grotesque",sans-serif;
  font-size:13px;
  font-weight:800;
  letter-spacing:-.04em;
}

.ad-brand>div:last-child{
  display:grid;
  gap:2px;
}

.ad-brand strong{
  font-family:"Bricolage Grotesque",sans-serif;
  font-size:15px;
  letter-spacing:.12em;
}

.ad-brand span{
  font-size:8px;
  color:#AFC0B7;
  letter-spacing:.17em;
}

.ad-nav{
  flex:1;
  padding:21px 0;
}

.ad-nav-group{
  margin-bottom:23px;
}

.ad-nav-title{
  display:block;
  padding:0 12px 8px;
  color:#779285;
  font-size:9px;
  font-weight:700;
  letter-spacing:.15em;
  text-transform:uppercase;
}

.ad-nav button{
  width:100%;
  min-height:43px;
  border:0;
  padding:0 12px;
  border-radius:12px;
  display:flex;
  align-items:center;
  gap:11px;
  background:transparent;
  color:#B9C8C0;
  cursor:pointer;
  text-align:left;
  font-size:12px;
  transition:.2s ease;
}

.ad-nav button:hover{
  background:rgba(255,255,255,.06);
  color:#fff;
}

.ad-nav button.active{
  background:var(--cream-2);
  color:var(--green);
  font-weight:700;
  box-shadow:0 7px 22px rgba(0,0,0,.1);
}

.ad-nav-icon{
  width:21px;
  text-align:center;
  font-size:16px;
}

.ad-nav button em{
  margin-left:auto;
  min-width:21px;
  height:21px;
  padding:0 5px;
  border-radius:20px;
  display:grid;
  place-items:center;
  background:#D96D60;
  color:#fff;
  font-size:9px;
  font-style:normal;
}

.ad-sidebar-footer{
  padding-top:13px;
  border-top:1px solid rgba(255,255,255,.1);
}

.ad-view-store{
  width:100%;
  border:1px solid rgba(255,255,255,.1);
  background:rgba(255,255,255,.05);
  color:#fff;
  border-radius:13px;
  padding:11px;
  display:flex;
  align-items:center;
  gap:10px;
  cursor:pointer;
  text-align:left;
}

.ad-view-icon{
  width:35px;
  height:35px;
  border-radius:10px;
  background:var(--cream-2);
  color:var(--green);
  display:grid;
  place-items:center;
  font-size:15px;
}

.ad-view-store div{
  display:grid;
  gap:2px;
}

.ad-view-store b{
  font-size:11px;
}

.ad-view-store small{
  font-size:9px;
  color:#91A79B;
}

.ad-admin-user{
  display:flex;
  align-items:center;
  gap:9px;
  padding:13px 7px 2px;
}

.ad-admin-avatar{
  width:37px;
  height:37px;
  flex:none;
  border-radius:50%;
  display:grid;
  place-items:center;
  background:#285342;
  color:var(--cream-2);
  border:1px solid rgba(255,255,255,.12);
  font-weight:700;
  font-size:11px;
}

.ad-admin-user>div:nth-child(2){
  min-width:0;
  flex:1;
  display:grid;
}

.ad-admin-user b{
  font-size:11px;
}

.ad-admin-user span{
  color:#8EA598;
  font-size:9px;
}

.ad-admin-user>button{
  border:0;
  background:transparent;
  color:#9BAFA4;
  font-size:17px;
  cursor:pointer;
}

.ad-main{
  min-height:100vh;
  width:calc(100% - 270px);
  margin-left:270px;
}

.ad-header{
  min-height:92px;
  padding:17px 30px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:20px;
  background:rgba(255,255,255,.96);
  border-bottom:1px solid var(--border);
  position:sticky;
  top:0;
  z-index:30;
  backdrop-filter:blur(15px);
}

.ad-header-left{
  display:flex;
  align-items:center;
  gap:13px;
}

.ad-header-kicker{
  display:block;
  margin-bottom:2px;
  color:#9AA39C;
  font-size:8px;
  font-weight:700;
  letter-spacing:.14em;
}

.ad-header h1{
  margin:0;
  color:var(--green);
  font-size:23px;
  line-height:1.1;
  letter-spacing:-.035em;
}

.ad-header p{
  margin:5px 0 0;
  color:#89928C;
  font-size:10px;
}

.ad-header-right{
  display:flex;
  align-items:center;
  gap:13px;
}

.ad-store-button{
  min-height:39px;
  padding:0 14px;
  border:1px solid #DCE3DD;
  border-radius:10px;
  display:flex;
  align-items:center;
  gap:10px;
  background:#fff;
  color:var(--green);
  cursor:pointer;
  font-size:10px;
  font-weight:700;
}

.ad-header-profile{
  padding-left:13px;
  border-left:1px solid var(--border);
  display:flex;
  align-items:center;
  gap:8px;
}

.ad-header-profile>div{
  width:35px;
  height:35px;
  border-radius:50%;
  display:grid;
  place-items:center;
  background:var(--green);
  color:var(--cream-2);
  font-size:10px;
  font-weight:700;
}

.ad-header-profile>span{
  display:grid;
}

.ad-header-profile b{
  font-size:10px;
}

.ad-header-profile small{
  color:#939C96;
  font-size:8px;
}

.ad-menu-button{
  display:none;
  width:40px;
  height:40px;
  border:1px solid var(--border);
  border-radius:10px;
  background:#fff;
  color:var(--green);
  cursor:pointer;
}

.ad-content{
  width:min(1500px,100%);
  margin:auto;
  padding:28px;
}

.ad-stack{
  display:grid;
  gap:18px;
}

/* ---------- CARDS ---------- */

.ad-card{
  margin:0 0 18px;
  padding:20px;
  background:#fff;
  border:1px solid var(--border);
  border-radius:18px;
  box-shadow:0 3px 15px rgba(23,57,43,.025);
}

.ad-no-padding{
  padding:0;
  overflow:hidden;
}

.ad-card-head{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:15px;
  margin-bottom:18px;
}

.ad-card-head h2{
  margin:3px 0 0;
  color:var(--green);
  font-size:16px;
  letter-spacing:-.02em;
}

.ad-card-head p{
  margin:4px 0 0;
  color:var(--muted);
  font-size:10px;
}

.ad-kicker{
  color:#9B8B64;
  font-size:8px;
  font-weight:700;
  letter-spacing:.14em;
}

.ad-pill{
  padding:6px 10px;
  border-radius:30px;
  background:var(--cream);
  color:#88774F;
  font-size:9px;
}

/* ---------- DASHBOARD ---------- */

.ad-stats{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:13px;
}

.ad-stat{
  min-height:165px;
  padding:18px;
  border:1px solid var(--border);
  border-radius:17px;
  background:#fff;
  text-align:left;
  cursor:pointer;
  transition:.2s;
}

.ad-stat:hover{
  transform:translateY(-3px);
  border-color:#CAD7CE;
  box-shadow:0 13px 35px rgba(23,57,43,.07);
}

.ad-stat-top{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:19px;
}

.ad-stat-icon{
  width:40px;
  height:40px;
  border-radius:12px;
  display:grid;
  place-items:center;
  background:var(--green-soft);
  color:var(--green);
  font-size:15px;
  font-weight:700;
}

.ad-stat-arrow{
  color:#A8B1AB;
}

.ad-stat strong{
  display:block;
  color:var(--green);
  font-family:"Bricolage Grotesque",sans-serif;
  font-size:25px;
  letter-spacing:-.04em;
}

.ad-stat h3{
  margin:6px 0 3px;
  color:#344239;
  font-size:11px;
}

.ad-stat p{
  margin:0;
  color:#9AA29D;
  font-size:9px;
}

.ad-dashboard-grid{
  display:grid;
  grid-template-columns:minmax(0,1.5fr) minmax(300px,.75fr);
  gap:18px;
}

.ad-chart{
  height:240px;
  display:flex;
  align-items:flex-end;
  gap:14px;
  padding-top:15px;
}

.ad-chart-item{
  flex:1;
  height:100%;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:8px;
}

.ad-chart-space{
  width:100%;
  flex:1;
  display:flex;
  align-items:flex-end;
  justify-content:center;
  border-bottom:1px solid #EBEFEB;
}

.ad-chart-bar{
  width:min(42px,72%);
  min-height:4px;
  border-radius:7px 7px 2px 2px;
  background:linear-gradient(180deg,#285A45,#17392B);
}

.ad-chart-item>span{
  color:#969F99;
  font-size:9px;
}

.ad-overview-list{
  display:grid;
}

.ad-overview-list button{
  min-height:55px;
  border:0;
  border-bottom:1px solid #EEF1EE;
  background:transparent;
  display:flex;
  align-items:center;
  justify-content:space-between;
  cursor:pointer;
  color:var(--green);
}

.ad-overview-list button:last-child{
  border:0;
}

.ad-overview-list button>span{
  display:flex;
  align-items:center;
  gap:10px;
  font-size:10px;
  font-weight:600;
}

.ad-overview-list i{
  width:31px;
  height:31px;
  border-radius:9px;
  display:grid;
  place-items:center;
  background:var(--cream);
  color:#8E7B4D;
  font-style:normal;
}

.ad-overview-list b{
  font-size:13px;
}

/* ---------- TABLE ---------- */

.ad-table-wrap{
  width:100%;
  overflow:auto;
}

.ad-table{
  width:100%;
  min-width:720px;
  border-collapse:collapse;
}

.ad-table th{
  padding:12px 16px;
  background:#FAFBF8;
  border-bottom:1px solid var(--border);
  color:#929C95;
  text-align:left;
  font-size:8px;
  font-weight:700;
  letter-spacing:.1em;
  text-transform:uppercase;
}

.ad-table td{
  padding:14px 16px;
  border-bottom:1px solid #EEF1EE;
  color:#647068;
  font-size:10px;
}

.ad-table tbody tr:last-child td{
  border-bottom:0;
}

.ad-table tbody tr:hover{
  background:#FCFDFB;
}

.ad-table td b{
  color:#28372E;
  font-size:10px;
}

.ad-table td small{
  display:block;
  margin-top:3px;
  color:#9BA39E;
  font-size:8px;
}

/* ---------- STATUS ---------- */

.ad-status{
  width:max-content;
  padding:5px 8px;
  border-radius:30px;
  display:inline-flex;
  align-items:center;
  gap:5px;
  background:#F0F2F0;
  color:#69736C;
  font-size:8px;
  font-weight:700;
  white-space:nowrap;
}

.ad-status i{
  width:5px;
  height:5px;
  border-radius:50%;
  background:currentColor;
}

.ad-active,
.ad-approved,
.ad-delivered,
.ad-in-stock{
  color:#397459;
  background:#EAF4ED;
}

.ad-pending,
.ad-low-stock{
  color:#9A6A24;
  background:#FFF5E3;
}

.ad-processing{
  color:#47709A;
  background:#EDF4FA;
}

.ad-shipped{
  color:#765F9A;
  background:#F2EEFA;
}

.ad-cancelled,
.ad-rejected,
.ad-out-of-stock{
  color:#A94A47;
  background:#FBEDEC;
}

.ad-paused{
  color:#7E7663;
  background:#F3F0E8;
}

/* ---------- TOOLBAR ---------- */

.ad-toolbar{
  margin-bottom:15px;
  display:flex;
  align-items:center;
  gap:9px;
}

.ad-search{
  position:relative;
  flex:1;
  max-width:480px;
}

.ad-search>span{
  position:absolute;
  z-index:2;
  left:13px;
  top:50%;
  transform:translateY(-50%);
  color:#909B94;
  font-size:16px;
}

.ad-search input{
  width:100%;
  min-height:42px;
  padding:0 13px 0 38px;
  border:1px solid var(--border);
  border-radius:11px;
  outline:0;
  background:#fff;
  color:var(--ink);
  font-size:10px;
}

.ad-input,
.ad-select{
  min-height:42px;
  width:100%;
  padding:9px 11px;
  border:1px solid #DDE4DE;
  border-radius:10px;
  outline:0;
  background:#fff;
  color:#25352B;
  font-size:10px;
}

.ad-select{
  width:auto;
  min-width:135px;
}

.ad-input:focus,
.ad-select:focus,
.ad-search input:focus{
  border-color:#8AA193;
  box-shadow:0 0 0 3px rgba(23,57,43,.055);
}

textarea.ad-input{
  resize:vertical;
}

.ad-field{
  display:grid;
  gap:6px;
}

.ad-field>span{
  color:#58675E;
  font-size:9px;
  font-weight:600;
}

.ad-btn{
  min-height:40px;
  padding:0 14px;
  border:1px solid transparent;
  border-radius:10px;
  cursor:pointer;
  font-size:9px;
  font-weight:700;
  white-space:nowrap;
}

.ad-btn-primary{
  background:var(--green);
  color:var(--cream-2);
  box-shadow:0 6px 15px rgba(23,57,43,.12);
}

.ad-btn-primary:hover{
  background:var(--green-2);
}

.ad-btn-light{
  background:#fff;
  color:var(--green);
  border-color:#DDE4DE;
}

.ad-btn-danger{
  background:#fff;
  color:var(--danger);
  border-color:#EED9D7;
}

.ad-link{
  border:0;
  background:transparent;
  color:#6B796F;
  font-size:9px;
  font-weight:700;
  cursor:pointer;
}

.ad-round-btn{
  width:34px;
  height:34px;
  border:1px solid var(--border);
  border-radius:9px;
  background:#fff;
  color:var(--green);
  cursor:pointer;
}

.ad-round-btn.danger{
  color:var(--danger);
}

/* ---------- MODAL ---------- */

.ad-modal-backdrop{
  position:fixed;
  z-index:150;
  inset:0;
  padding:20px;
  display:grid;
  place-items:center;
  background:rgba(9,28,20,.58);
  backdrop-filter:blur(6px);
}

.ad-modal{
  width:min(580px,100%);
  max-height:92vh;
  overflow:auto;
  background:#FAFBF8;
  border:1px solid rgba(255,255,255,.2);
  border-radius:20px;
  box-shadow:0 30px 100px rgba(0,0,0,.25);
}

.ad-modal-wide{
  width:min(960px,100%);
}

.ad-modal-head{
  position:sticky;
  z-index:5;
  top:0;
  padding:19px 22px;
  background:rgba(255,255,255,.96);
  border-bottom:1px solid var(--border);
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:15px;
  backdrop-filter:blur(15px);
}

.ad-modal-head>div>span{
  color:#9B8B64;
  font-size:8px;
  font-weight:700;
  letter-spacing:.13em;
}

.ad-modal-head h2{
  margin:4px 0 0;
  color:var(--green);
  font-size:18px;
}

.ad-modal-head p{
  margin:4px 0 0;
  color:#8B958E;
  font-size:9px;
}

.ad-modal-head>button{
  width:36px;
  height:36px;
  border:1px solid var(--border);
  border-radius:10px;
  background:#fff;
  color:var(--green);
  cursor:pointer;
  font-size:19px;
}

.ad-modal-content{
  padding:22px;
}

.ad-modal-actions{
  padding-top:18px;
  margin-top:20px;
  border-top:1px solid var(--border);
  display:flex;
  justify-content:flex-end;
  gap:8px;
}

/* ---------- ORDER DETAILS ---------- */

.ad-summary-grid{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:9px;
  margin-bottom:17px;
}

.ad-summary-grid>div{
  min-height:70px;
  padding:12px;
  border:1px solid var(--border);
  border-radius:12px;
  background:#fff;
  display:grid;
  align-content:center;
  gap:4px;
}

.ad-summary-grid span{
  color:#929C95;
  font-size:8px;
}

.ad-summary-grid b{
  color:var(--green);
  font-size:10px;
}

.ad-two-col{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:13px;
}

.ad-inner-card{
  padding:15px;
  margin-bottom:12px;
  border:1px solid var(--border);
  border-radius:14px;
  background:#fff;
}

.ad-inner-card h3{
  margin:0 0 12px;
  color:var(--green);
  font-size:12px;
}

.ad-line{
  min-height:48px;
  border-bottom:1px solid #EEF1EE;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
}

.ad-line:last-child{
  border-bottom:0;
}

.ad-line>div{
  display:grid;
  gap:2px;
}

.ad-line b{
  color:#314038;
  font-size:9px;
}

.ad-line span{
  color:#929B95;
  font-size:8px;
}

.ad-line-right{
  justify-items:end;
}

.ad-info-row{
  padding:8px 0;
  display:grid;
  gap:3px;
}

.ad-info-row span{
  color:#909A93;
  font-size:8px;
}

.ad-info-row b{
  color:#35433B;
  font-size:9px;
}

/* ---------- PRODUCT ---------- */

.ad-product-grid{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:14px;
}

.ad-product-card{
  overflow:hidden;
  background:#fff;
  border:1px solid var(--border);
  border-radius:17px;
  transition:.2s;
}

.ad-product-card:hover{
  transform:translateY(-2px);
  box-shadow:0 13px 35px rgba(23,57,43,.07);
}

.ad-product-photo{
  position:relative;
  aspect-ratio:4/3;
  overflow:hidden;
  background:var(--cream);
}

.ad-product-photo img{
  width:100%;
  height:100%;
  object-fit:cover;
  display:block;
}

.ad-photo-placeholder{
  width:100%;
  height:100%;
  display:grid;
  place-items:center;
  color:#A59C84;
  font-size:35px;
}

.ad-live,
.ad-product-tag{
  position:absolute;
  top:10px;
  padding:5px 8px;
  border-radius:30px;
  background:rgba(255,255,255,.94);
  box-shadow:0 3px 13px rgba(0,0,0,.08);
  font-size:8px;
  font-weight:700;
}

.ad-live{
  left:10px;
  color:#397459;
}

.ad-live.hidden{
  color:#A34D49;
}

.ad-product-tag{
  right:10px;
  color:#816E42;
}

.ad-product-info{
  padding:15px;
}

.ad-product-category{
  color:#98875D;
  font-size:8px;
  font-weight:700;
  text-transform:uppercase;
  letter-spacing:.09em;
}

.ad-product-info h3{
  margin:5px 0 2px;
  color:var(--green);
  font-size:13px;
}

.ad-product-info>p{
  margin:0;
  color:#9BA39D;
  font-size:8px;
}

.ad-product-data{
  margin:14px 0;
  padding:11px 0;
  border-top:1px solid #EEF1EE;
  border-bottom:1px solid #EEF1EE;
  display:grid;
  grid-template-columns:1fr .7fr 1.2fr;
  gap:8px;
}

.ad-product-data>div{
  min-width:0;
  display:grid;
  gap:3px;
}

.ad-product-data>div>span{
  color:#9AA29D;
  font-size:7px;
}

.ad-product-data b{
  color:#35443A;
  font-size:9px;
}

.ad-product-buttons{
  display:flex;
  gap:6px;
}

.ad-product-buttons .ad-btn{
  flex:1;
}

.ad-icon-action{
  width:40px;
  min-height:40px;
  border:1px solid var(--border);
  border-radius:10px;
  background:#fff;
  color:var(--green);
  cursor:pointer;
}

.ad-icon-action.danger{
  color:var(--danger);
}

.ad-product-editor{
  display:grid;
  gap:14px;
}

.ad-form-section{
  padding:17px;
  border:1px solid var(--border);
  border-radius:15px;
  background:#fff;
}

.ad-form-section-title{
  margin-bottom:16px;
  display:flex;
  align-items:flex-start;
  gap:10px;
}

.ad-form-section-title>span{
  width:30px;
  height:30px;
  flex:none;
  border-radius:50%;
  display:grid;
  place-items:center;
  background:var(--cream-2);
  color:var(--green);
  font-size:8px;
  font-weight:700;
}

.ad-form-section-title h3{
  margin:0;
  color:var(--green);
  font-size:12px;
}

.ad-form-section-title p{
  margin:3px 0 0;
  color:#929C95;
  font-size:8px;
}

.ad-form-grid{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:12px;
}

.ad-visibility{
  min-height:63px;
  margin-top:13px;
  padding:11px 13px;
  border-radius:12px;
  background:#F7F8F5;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:15px;
}

.ad-visibility>div{
  display:grid;
  gap:3px;
}

.ad-visibility b{
  color:#35443A;
  font-size:9px;
}

.ad-visibility span{
  color:#929B95;
  font-size:8px;
}

.ad-toggle{
  width:42px;
  height:23px;
  padding:3px;
  border:0;
  border-radius:30px;
  background:#CCD4CF;
  cursor:pointer;
  transition:.2s;
}

.ad-toggle span{
  display:block;
  width:17px;
  height:17px;
  border-radius:50%;
  background:#fff;
  transition:.2s;
}

.ad-toggle.on{
  background:var(--green);
}

.ad-toggle.on span{
  transform:translateX(19px);
}

.ad-image-grid{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:9px;
}

.ad-product-image,
.ad-image-upload{
  position:relative;
  aspect-ratio:1;
  overflow:hidden;
  border-radius:12px;
}

.ad-product-image{
  border:1px solid var(--border);
}

.ad-product-image img{
  width:100%;
  height:100%;
  object-fit:cover;
}

.ad-image-upload{
  border:1px dashed #B9C8BE;
  background:#F9FAF7;
  color:#75857B;
  display:grid;
  place-items:center;
  align-content:center;
  gap:3px;
  cursor:pointer;
}

.ad-image-upload>div{
  color:var(--green);
  font-size:22px;
}

.ad-image-upload b{
  font-size:9px;
}

.ad-image-upload span{
  font-size:7px;
  color:#A0A8A2;
}

.ad-main-image{
  position:absolute;
  left:6px;
  bottom:6px;
  padding:4px 7px;
  border-radius:20px;
  background:var(--green);
  color:var(--cream-2);
  font-size:7px;
}

.ad-remove-image,
.ad-make-main{
  position:absolute;
  width:25px;
  height:25px;
  border:0;
  border-radius:50%;
  background:rgba(23,57,43,.9);
  color:#fff;
  cursor:pointer;
}

.ad-remove-image{
  top:6px;
  right:6px;
}

.ad-make-main{
  bottom:6px;
  left:6px;
}

/* ---------- INVENTORY ---------- */

.ad-mini-stats{
  margin-bottom:15px;
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:11px;
}

.ad-mini-stats>div{
  min-height:90px;
  padding:15px;
  border:1px solid var(--border);
  border-radius:15px;
  background:#fff;
  display:grid;
  align-content:center;
  gap:5px;
}

.ad-mini-stats span{
  color:#909A93;
  font-size:8px;
}

.ad-mini-stats b{
  color:var(--green);
  font-family:"Bricolage Grotesque",sans-serif;
  font-size:21px;
}

.ad-stepper{
  width:max-content;
  padding:3px;
  border:1px solid var(--border);
  border-radius:9px;
  display:flex;
  align-items:center;
  gap:6px;
}

.ad-stepper button{
  width:27px;
  height:27px;
  border:0;
  border-radius:6px;
  background:var(--green-soft);
  color:var(--green);
  cursor:pointer;
}

.ad-stepper b{
  min-width:25px;
  text-align:center;
}

.ad-number{
  width:72px;
  height:34px;
  padding:0 8px;
  border:1px solid var(--border);
  border-radius:8px;
  outline:0;
}

.ad-table-product{
  display:flex;
  align-items:center;
  gap:9px;
}

.ad-table-product img,
.ad-table-product>span{
  width:38px;
  height:38px;
  flex:none;
  border-radius:9px;
}

.ad-table-product img{
  object-fit:cover;
}

.ad-table-product>span{
  background:var(--cream);
  color:#9A8B65;
  display:grid;
  place-items:center;
}

.ad-table-product>div{
  display:grid;
}

/* ---------- CATEGORY ---------- */

.ad-create-category{
  margin-bottom:15px;
  padding:18px;
  border:1px solid var(--border);
  border-radius:17px;
  background:#fff;
  display:grid;
  grid-template-columns:1fr minmax(220px,360px) auto;
  align-items:end;
  gap:12px;
}

.ad-create-category h2{
  margin:4px 0 2px;
  color:var(--green);
  font-size:15px;
}

.ad-create-category p{
  margin:0;
  color:#909A93;
  font-size:9px;
}

.ad-category-grid{
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:14px;
}

.ad-subcategories{
  min-height:55px;
  display:flex;
  flex-wrap:wrap;
  align-items:flex-start;
  gap:6px;
  margin-bottom:12px;
}

.ad-subcategories>span{
  padding:5px 6px 5px 9px;
  border:1px solid var(--border);
  border-radius:30px;
  display:flex;
  align-items:center;
  gap:6px;
  color:#5F6D64;
  font-size:8px;
}

.ad-subcategories button{
  width:18px;
  height:18px;
  border:0;
  border-radius:50%;
  background:#EEF1EE;
  color:#6F7A73;
  cursor:pointer;
}

.ad-inline-form{
  display:flex;
  gap:7px;
}

/* ---------- CUSTOMERS ---------- */

.ad-customer-grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:13px;
}

.ad-customer{
  position:relative;
  padding:16px;
  border:1px solid var(--border);
  border-radius:16px;
  background:#fff;
  cursor:pointer;
  text-align:left;
  transition:.2s;
}

.ad-customer:hover{
  transform:translateY(-2px);
  border-color:#CAD7CE;
}

.ad-customer-avatar{
  width:44px;
  height:44px;
  margin-bottom:11px;
  border-radius:14px;
  background:var(--green);
  color:var(--cream-2);
  display:grid;
  place-items:center;
  font-family:"Bricolage Grotesque",sans-serif;
  font-weight:700;
}

.ad-customer-main h3{
  margin:0;
  color:var(--green);
  font-size:12px;
}

.ad-customer-main span{
  display:block;
  margin-top:3px;
  color:#949D97;
  font-size:8px;
}

.ad-customer-stats{
  margin-top:13px;
  padding-top:11px;
  border-top:1px solid #EEF1EE;
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:8px;
}

.ad-customer-stats>div{
  display:grid;
  gap:2px;
}

.ad-customer-stats b{
  color:#3C4A41;
  font-size:9px;
}

.ad-customer-stats span{
  color:#9BA39E;
  font-size:7px;
}

.ad-customer-arrow{
  position:absolute;
  right:15px;
  top:15px;
  color:#9BA69F;
}

/* ---------- REVIEWS ---------- */

.ad-tabs{
  display:flex;
  flex-wrap:wrap;
  gap:5px;
  margin-bottom:14px;
}

.ad-tabs button{
  min-height:35px;
  padding:0 12px;
  border:1px solid var(--border);
  border-radius:9px;
  background:#fff;
  color:#748078;
  cursor:pointer;
  font-size:8px;
}

.ad-tabs button.active{
  border-color:var(--green);
  background:var(--green);
  color:var(--cream-2);
}

.ad-review-grid{
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:13px;
}

.ad-review-card{
  padding:17px;
  border:1px solid var(--border);
  border-radius:16px;
  background:#fff;
}

.ad-review-head{
  display:flex;
  align-items:center;
  gap:9px;
}

.ad-review-avatar{
  width:37px;
  height:37px;
  flex:none;
  border-radius:50%;
  background:var(--green-soft);
  color:var(--green);
  display:grid;
  place-items:center;
  font-size:10px;
  font-weight:700;
}

.ad-review-head>div:nth-child(2){
  flex:1;
  display:grid;
  gap:2px;
}

.ad-review-head h3{
  margin:0;
  color:#35433B;
  font-size:10px;
}

.ad-review-head span{
  color:#9BA39E;
  font-size:7px;
}

.ad-stars{
  margin:13px 0 8px;
  font-size:12px;
  letter-spacing:1px;
}

.ad-stars b{
  color:#C6A45B;
}

.ad-stars span{
  color:#E3E6E3;
}

.ad-review-product{
  color:#6D796F;
  font-size:8px;
  font-weight:700;
}

.ad-review-card>p{
  min-height:42px;
  color:#657168;
  font-size:9px;
  line-height:1.6;
}

.ad-review-actions{
  display:flex;
  gap:6px;
}

/* ---------- HERO ---------- */

.ad-section-intro{
  margin-bottom:15px;
  padding:18px 20px;
  border-radius:17px;
  background:var(--green);
  color:#fff;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:20px;
}

.ad-section-intro h2{
  margin:4px 0 2px;
  color:var(--cream-2);
  font-size:17px;
}

.ad-section-intro p{
  margin:0;
  color:#A9BBB0;
  font-size:9px;
}

.ad-section-intro .ad-btn-primary{
  background:var(--cream-2);
  color:var(--green);
}

.ad-hero-card{
  margin-bottom:14px;
  overflow:hidden;
  border:1px solid var(--border);
  border-radius:18px;
  background:#fff;
  display:grid;
  grid-template-columns:minmax(300px,.85fr) 1.15fr;
}

.ad-hero-preview{
  position:relative;
  min-height:310px;
  background:var(--cream);
}

.ad-hero-preview>img{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  object-fit:cover;
}

.ad-hero-placeholder{
  width:100%;
  height:100%;
  min-height:310px;
  display:grid;
  place-items:center;
  align-content:center;
  gap:3px;
  color:#8E8264;
}

.ad-hero-placeholder>span{
  font-size:29px;
}

.ad-hero-placeholder b{
  font-size:10px;
}

.ad-hero-placeholder small{
  font-size:8px;
}

.ad-upload-banner{
  position:absolute;
  left:13px;
  bottom:13px;
  padding:8px 11px;
  border-radius:9px;
  background:rgba(255,255,255,.95);
  color:var(--green);
  box-shadow:0 5px 18px rgba(0,0,0,.1);
  font-size:8px;
  font-weight:700;
  cursor:pointer;
}

.ad-banner-number{
  position:absolute;
  right:13px;
  top:13px;
  width:34px;
  height:34px;
  border-radius:50%;
  display:grid;
  place-items:center;
  background:rgba(23,57,43,.9);
  color:var(--cream-2);
  font-size:8px;
  font-weight:700;
}

.ad-hero-form{
  padding:20px;
}

.ad-small-actions{
  display:flex;
  gap:5px;
}

.ad-small-actions button{
  width:32px;
  height:32px;
  border:1px solid var(--border);
  border-radius:8px;
  background:#fff;
  color:var(--green);
  cursor:pointer;
}

.ad-small-actions button.danger{
  color:var(--danger);
}

.ad-small-actions button:disabled{
  opacity:.35;
  cursor:not-allowed;
}

/* ---------- COUPON ---------- */

.ad-coupon-form{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:12px;
  margin-bottom:14px;
}

.uppercase{
  text-transform:uppercase;
}

.ad-coupon-grid{
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:13px;
}

.ad-coupon{
  min-height:220px;
  overflow:hidden;
  display:flex;
  border:1px solid var(--border);
  border-radius:17px;
  background:#fff;
}

.ad-coupon-strip{
  width:73px;
  padding:14px 6px;
  background:var(--green);
  color:var(--cream-2);
  display:flex;
  flex-direction:column;
  justify-content:space-between;
  align-items:center;
}

.ad-coupon-strip span{
  writing-mode:vertical-rl;
  transform:rotate(180deg);
  font-size:7px;
  letter-spacing:.17em;
}

.ad-coupon-strip b{
  font-size:25px;
}

.ad-coupon-main{
  flex:1;
  padding:17px;
}

.ad-discount{
  display:block;
  margin:15px 0;
  color:var(--green);
  font-family:"Bricolage Grotesque",sans-serif;
  font-size:24px;
  letter-spacing:-.04em;
}

.ad-coupon-details{
  margin-bottom:13px;
  display:grid;
  gap:4px;
  color:#8C968F;
  font-size:8px;
}

.ad-row-actions{
  display:flex;
  gap:6px;
}

/* ---------- TEAM ---------- */

.ad-team-list{
  display:grid;
  gap:9px;
  margin-bottom:17px;
}

.ad-team-member{
  padding:13px;
  border:1px solid var(--border);
  border-radius:15px;
  background:#fff;
  display:flex;
  align-items:center;
  gap:11px;
}

.ad-team-avatar{
  width:43px;
  height:43px;
  flex:none;
  border-radius:13px;
  display:grid;
  place-items:center;
  background:var(--green);
  color:var(--cream-2);
  font-weight:700;
}

.ad-team-info{
  flex:1;
  display:grid;
  gap:2px;
}

.ad-team-info h3{
  margin:0;
  color:#35443A;
  font-size:10px;
}

.ad-team-info h3 small{
  color:#A0A8A2;
  font-size:7px;
  font-weight:400;
}

.ad-team-info span{
  color:#929C95;
  font-size:8px;
}

.ad-team-actions{
  display:flex;
  align-items:center;
  gap:6px;
}

.ad-permission-row{
  padding:10px 0;
  border-bottom:1px solid #EEF1EE;
  display:grid;
  grid-template-columns:100px 1fr;
  gap:12px;
}

.ad-permission-row:last-child{
  border:0;
}

.ad-permission-row b{
  color:var(--green);
  font-size:9px;
}

.ad-permission-row span{
  color:#88938C;
  font-size:8px;
}

/* ---------- AUDIT ---------- */

.ad-log{
  min-height:72px;
  display:grid;
  grid-template-columns:18px 1fr;
  gap:8px;
}

.ad-log-line{
  position:relative;
  display:flex;
  justify-content:center;
}

.ad-log-line:after{
  content:"";
  position:absolute;
  top:15px;
  bottom:0;
  width:1px;
  background:#E0E6E1;
}

.ad-log:last-child .ad-log-line:after{
  display:none;
}

.ad-log-line span{
  position:relative;
  z-index:2;
  width:10px;
  height:10px;
  margin-top:4px;
  border:3px solid var(--green);
  border-radius:50%;
  background:#fff;
}

.ad-log-content{
  padding-bottom:17px;
}

.ad-log-content>div{
  display:flex;
  justify-content:space-between;
  gap:15px;
}

.ad-log-content h3{
  margin:0;
  color:#35443A;
  font-size:10px;
}

.ad-log-content time{
  color:#9CA49F;
  font-size:7px;
}

.ad-log-content p{
  margin:4px 0;
  color:#69756D;
  font-size:9px;
}

.ad-log-content small{
  color:#A0A7A2;
  font-size:7px;
}

/* ---------- EMPTY ---------- */

.ad-empty{
  min-height:210px;
  padding:30px 15px;
  display:grid;
  justify-items:center;
  align-content:center;
  text-align:center;
}

.ad-empty>div{
  width:49px;
  height:49px;
  border-radius:50%;
  display:grid;
  place-items:center;
  background:var(--cream);
  color:#9B8B65;
  font-size:20px;
}

.ad-empty h3{
  margin:10px 0 3px;
  color:var(--green);
  font-size:12px;
}

.ad-empty p,
.ad-muted{
  margin:0;
  color:#929C95;
  font-size:9px;
}

.ad-warning{
  margin-bottom:14px;
  padding:11px 13px;
  border:1px solid #E8CFC9;
  border-radius:11px;
  background:#FFF3EF;
  color:#9A5148;
  font-size:9px;
}

/* ============================================================
   LOGIN
============================================================ */

.ad-login{
  position:relative;
  min-height:100vh;
  overflow:hidden;
  display:grid;
  grid-template-columns:1fr 1fr;
  background:#F8F7F1;
}

.ad-login-decoration{
  position:absolute;
  pointer-events:none;
  border-radius:50%;
}

.ad-dec-1{
  width:420px;
  height:420px;
  left:-170px;
  bottom:-180px;
  border:1px solid rgba(232,212,165,.15);
}

.ad-dec-2{
  width:260px;
  height:260px;
  left:31%;
  top:-150px;
  border:1px solid rgba(232,212,165,.12);
}

.ad-login-back{
  position:absolute;
  z-index:5;
  top:25px;
  right:28px;
  border:0;
  background:transparent;
  color:#718077;
  cursor:pointer;
  font-size:9px;
  font-weight:600;
}

.ad-login-panel{
  position:relative;
  padding:55px clamp(35px,6vw,90px);
  background:var(--green);
  color:#fff;
  display:flex;
  flex-direction:column;
  justify-content:center;
}

.ad-login-brand{
  position:absolute;
  left:clamp(35px,6vw,90px);
  top:35px;
  display:flex;
  align-items:center;
  gap:11px;
}

.ad-login-logo{
  width:42px;
  height:42px;
  border-radius:50%;
  display:grid;
  place-items:center;
  background:var(--cream-2);
  color:var(--green);
  font-family:"Bricolage Grotesque",sans-serif;
  font-size:12px;
  font-weight:800;
}

.ad-login-brand>div:last-child{
  display:grid;
}

.ad-login-brand strong{
  font-family:"Bricolage Grotesque",sans-serif;
  font-size:13px;
  letter-spacing:.12em;
}

.ad-login-brand span{
  color:#91A79B;
  font-size:7px;
  letter-spacing:.15em;
}

.ad-login-copy{
  max-width:500px;
  margin-bottom:38px;
}

.ad-login-copy>span{
  color:var(--champagne);
  font-size:8px;
  font-weight:700;
  letter-spacing:.18em;
}

.ad-login-copy h1{
  margin:12px 0 14px;
  color:var(--cream-2);
  font-size:clamp(50px,6vw,82px);
  line-height:.88;
  letter-spacing:-.065em;
}

.ad-login-copy p{
  max-width:420px;
  margin:0;
  color:#AFC0B7;
  font-size:11px;
  line-height:1.75;
}

.ad-login-feature{
  max-width:430px;
  min-height:63px;
  border-top:1px solid rgba(255,255,255,.1);
  display:flex;
  align-items:center;
  gap:13px;
}

.ad-login-feature>div{
  width:31px;
  height:31px;
  border-radius:50%;
  display:grid;
  place-items:center;
  background:rgba(255,255,255,.06);
  color:var(--champagne);
  font-size:7px;
}

.ad-login-feature>span{
  display:grid;
  color:#91A79B;
  font-size:8px;
}

.ad-login-feature b{
  margin-bottom:2px;
  color:#E8EFEA;
  font-size:9px;
}

.ad-login-form-side{
  display:grid;
  place-items:center;
  padding:70px 30px;
}

.ad-login-form{
  width:min(410px,100%);
}

.ad-login-form-head{
  margin-bottom:28px;
}

.ad-login-form-head>span{
  color:#9B8B64;
  font-size:8px;
  font-weight:700;
  letter-spacing:.16em;
}

.ad-login-form-head h2{
  margin:8px 0 6px;
  color:var(--green);
  font-size:30px;
  line-height:1.05;
  letter-spacing:-.04em;
}

.ad-login-form-head p{
  margin:0;
  color:#8B968F;
  font-size:10px;
}

.ad-login-form .ad-field{
  margin-bottom:14px;
}

.ad-login-input{
  min-height:49px;
  padding-left:13px;
  background:#fff;
}

.ad-password{
  position:relative;
}

.ad-password .ad-input{
  padding-right:60px;
}

.ad-password button{
  position:absolute;
  right:9px;
  top:50%;
  transform:translateY(-50%);
  border:0;
  background:transparent;
  color:#718077;
  font-size:8px;
  font-weight:700;
  cursor:pointer;
}

.ad-login-input.error{
  border-color:#C96C63;
}

.ad-login-error{
  margin:-3px 0 13px;
  padding:9px 11px;
  border-radius:9px;
  background:#FBECEA;
  color:#A64E47;
  font-size:8px;
}

.ad-signin{
  width:100%;
  min-height:50px;
  margin-top:4px;
  padding:0 17px;
  border:0;
  border-radius:11px;
  background:var(--green);
  color:var(--cream-2);
  display:flex;
  align-items:center;
  justify-content:space-between;
  cursor:pointer;
  font-size:10px;
  font-weight:700;
  box-shadow:0 10px 25px rgba(23,57,43,.13);
}

.ad-signin b{
  font-size:16px;
}

.ad-login-hint{
  margin-top:20px;
  padding-top:16px;
  border-top:1px solid #E3E7E2;
}

.ad-login-hint span{
  color:#718078;
  font-size:8px;
  font-weight:700;
}

.ad-login-hint p{
  margin:3px 0 0;
  color:#9AA39D;
  font-size:8px;
  line-height:1.5;
}

.ad-login-footer{
  position:absolute;
  right:28px;
  bottom:20px;
  color:#A1A9A4;
  font-size:7px;
}

/* ---------- SESSION REPAIR ---------- */

.ad-session-repair{
  min-height:100vh;
  display:grid;
  place-items:center;
  padding:24px;
  background:#F8F7F1;
}

.ad-session-repair-card{
  min-width:260px;
  padding:28px;
  border:1px solid var(--border);
  border-radius:18px;
  background:#fff;
  display:grid;
  justify-items:center;
  gap:8px;
  color:var(--green);
  box-shadow:0 18px 50px rgba(23,57,43,.08);
}

.ad-session-repair-card small{
  color:#929C95;
  font-size:8px;
}

.ad-session-spinner{
  width:34px;
  height:34px;
  margin-bottom:5px;
  border:3px solid #E6ECE8;
  border-top-color:var(--green);
  border-radius:50%;
  animation:adSessionSpin .75s linear infinite;
}

@keyframes adSessionSpin{
  to{transform:rotate(360deg)}
}

/* ---------- RESPONSIVE ---------- */

.ad-mobile-overlay{
  display:none;
}

@media(max-width:1200px){
  .ad-stats{
    grid-template-columns:repeat(2,1fr);
  }

  .ad-dashboard-grid{
    grid-template-columns:1fr;
  }

  .ad-product-grid,
  .ad-customer-grid{
    grid-template-columns:repeat(2,1fr);
  }

  .ad-coupon-grid{
    grid-template-columns:1fr;
  }
}

@media(max-width:950px){
  .ad-sidebar{
    transform:translateX(-105%);
    transition:.25s ease;
    box-shadow:25px 0 60px rgba(0,0,0,.22);
  }

  .ad-sidebar.ad-sidebar-open{
    transform:translateX(0);
  }

  .ad-mobile-overlay{
    display:block;
    position:fixed;
    z-index:55;
    inset:0;
    border:0;
    background:rgba(9,28,20,.5);
  }

  .ad-main{
    width:100%;
    margin-left:0;
  }

  .ad-menu-button{
    display:block;
  }

  .ad-hero-card{
    grid-template-columns:1fr;
  }

  .ad-hero-preview{
    min-height:280px;
  }

  .ad-summary-grid{
    grid-template-columns:repeat(2,1fr);
  }

  .ad-login{
    grid-template-columns:.9fr 1.1fr;
  }

  .ad-login-copy h1{
    font-size:55px;
  }
}

@media(max-width:760px){
  .ad-content{
    padding:16px;
  }

  .ad-header{
    min-height:76px;
    padding:13px 16px;
  }

  .ad-header-kicker,
  .ad-header p{
    display:none;
  }

  .ad-header h1{
    font-size:19px;
  }

  .ad-header-profile,
  .ad-store-button{
    display:none;
  }

  .ad-toolbar{
    align-items:stretch;
    flex-direction:column;
  }

  .ad-search{
    max-width:none;
  }

  .ad-select{
    width:100%;
  }

  .ad-product-grid,
  .ad-customer-grid,
  .ad-review-grid,
  .ad-category-grid,
  .ad-mini-stats{
    grid-template-columns:1fr;
  }

  .ad-form-grid,
  .ad-coupon-form,
  .ad-two-col{
    grid-template-columns:1fr;
  }

  .ad-create-category{
    grid-template-columns:1fr;
    align-items:stretch;
  }

  .ad-team-member{
    flex-wrap:wrap;
  }

  .ad-team-info{
    min-width:calc(100% - 60px);
  }

  .ad-team-actions{
    width:100%;
    flex-wrap:wrap;
  }

  .ad-team-actions .ad-select{
    width:100%;
  }

  .ad-image-grid{
    grid-template-columns:repeat(2,1fr);
  }

  .ad-modal-backdrop{
    padding:7px;
  }

  .ad-modal{
    max-height:96vh;
    border-radius:15px;
  }

  .ad-modal-content{
    padding:15px;
  }

  .ad-login{
    display:block;
    min-height:100vh;
  }

  .ad-login-panel{
    min-height:390px;
    padding:100px 25px 35px;
  }

  .ad-login-brand{
    left:25px;
    top:25px;
  }

  .ad-login-copy{
    margin-bottom:20px;
  }

  .ad-login-copy h1{
    font-size:52px;
  }

  .ad-login-copy p{
    font-size:9px;
  }

  .ad-login-feature{
    display:none;
  }

  .ad-login-form-side{
    padding:35px 20px 60px;
  }

  .ad-login-back{
    top:28px;
    right:20px;
    color:#C7D2CC;
  }

  .ad-login-footer{
    right:20px;
    bottom:18px;
  }
}

@media(max-width:480px){
  .ad-stats{
    grid-template-columns:1fr 1fr;
    gap:8px;
  }

  .ad-stat{
    min-height:145px;
    padding:13px;
  }

  .ad-stat strong{
    font-size:20px;
  }

  .ad-stat-icon{
    width:34px;
    height:34px;
  }

  .ad-summary-grid{
    grid-template-columns:1fr;
  }

  .ad-section-intro{
    align-items:flex-start;
    flex-direction:column;
  }

  .ad-product-data{
    grid-template-columns:1fr 1fr;
  }

  .ad-coupon-strip{
    width:55px;
  }
}
`;
