import { useState, useMemo, useEffect } from "react";
import Admin, { saveOrder, applyAdminImages } from "./Admin.jsx";

const PRODUCTS = [
  { id: 1, name: "Aura Wireless Headphones", img: "headphones", cat: "Audio", price: 12990, rating: 4.8, tag: "Best seller" },
  { id: 2, name: "Orbit Smart Watch", img: "smartwatch", cat: "Wearables", price: 14990, rating: 4.6, tag: "New" },
  { id: 3, name: "Velo Runner Sneakers", img: "sneakers", cat: "Fashion", price: 5490, rating: 4.7 },
  { id: 4, name: "Noir Leather Backpack", img: "backpack", cat: "Fashion", price: 4290, rating: 4.5 },
  { id: 5, name: "Lumen Mirrorless Camera", img: "camera", cat: "Cameras", price: 89990, rating: 4.9, tag: "Top rated" },
  { id: 6, name: "Halo Sunglasses", img: "sunglasses", cat: "Fashion", price: 2490, rating: 4.4 },
  { id: 7, name: "Pulse Bluetooth Speaker", img: "speaker", cat: "Audio", price: 4990, rating: 4.6 },
  { id: 8, name: "Flux Gaming Controller", img: "gamepad", cat: "Gaming", price: 3490, rating: 4.7, tag: "Sale" },
  { id: 9, name: "Zen Mechanical Keyboard", img: "keyboard", cat: "Gaming", price: 6990, rating: 4.7, tag: "New" },
  { id: 10, name: "Drift Noise-Cancelling Earbuds", img: "earbuds", cat: "Audio", price: 7490, rating: 4.5 },
  { id: 11, name: "Slate Minimal Wallet", img: "wallet", cat: "Fashion", price: 1490, rating: 4.3 },
  { id: 12, name: "Vista Drone 4K", img: "drone", cat: "Cameras", price: 54990, rating: 4.8, tag: "Top rated" },
  { id: 13, name: "Aero Slim Laptop", img: "laptop", cat: "Tech", price: 74990, rating: 4.7, tag: "New" },
  { id: 14, name: "Slate Pro Tablet", img: "tablet", cat: "Tech", price: 34990, rating: 4.5 },
  { id: 15, name: "Vista 27\" 4K Monitor", img: "monitor", cat: "Tech", price: 28990, rating: 4.6 },
  { id: 16, name: "Oud Noir Perfume", img: "perfume", cat: "Fashion", price: 3990, rating: 4.8, tag: "Best seller" },
  { id: 17, name: "Harbor Bomber Jacket", img: "jacket", cat: "Fashion", price: 4590, rating: 4.4 },
  { id: 18, name: "Heritage Analog Watch", img: "wristwatch", cat: "Wearables", price: 9990, rating: 4.7 },
  { id: 19, name: "Arc Desk Lamp", img: "lamp", cat: "Home", price: 2790, rating: 4.5 },
  { id: 20, name: "Brew Espresso Machine", img: "espresso", cat: "Home", price: 18990, rating: 4.8, tag: "Top rated" },
  { id: 21, name: "Form Ergonomic Chair", img: "chair", cat: "Home", price: 15990, rating: 4.6 },
  { id: 22, name: "Groove Record Player", img: "turntable", cat: "Audio", price: 11990, rating: 4.7 },
  { id: 23, name: "Nova X Smartphone", img: "smartphone", cat: "Tech", price: 49990, rating: 4.6, tag: "New" },
  { id: 24, name: "Studio Podcast Microphone", img: "microphone", cat: "Audio", price: 6490, rating: 4.5, tag: "Sale" },
];

const CATS = ["All", ...Array.from(new Set(PRODUCTS.map((p) => p.cat)))];
// ---- Hero slider ----------------------------------------------------------
// Add or remove slides here (4 to 5 works best). Each slide has its own image and text.
// To use your own product photos, put them in your project's  public/hero/  folder
// and set  image: "/hero/1.jpg"  (then 2.jpg, 3.jpg ...). Wide images (16:9) look best.
const SLIDES = [
  { image: "https://loremflickr.com/1600/900/headphones?lock=201", l1: "আপনার পছন্দের", l2: "সবকিছু এক জায়গায়", text: "Hand-picked gadgets, audio and fashion. Free delivery over ৳5,000 and 30-day returns on everything.", cta: "Shop the collection", cat: "All" },
  { image: "https://loremflickr.com/1600/900/laptop?lock=202", l1: "নতুন কালেকশন", l2: "এখন আপনার হাতের নাগালে", text: "Fresh arrivals in tech, added every week. Be the first to get them.", cta: "Shop tech", cat: "Tech" },
  { image: "https://loremflickr.com/1600/900/speaker?lock=203", l1: "সেরা সাউন্ড", l2: "সেরা দামে", text: "Headphones, speakers and earbuds for every budget, with a 1-year warranty.", cta: "Shop audio", cat: "Audio" },
  { image: "https://loremflickr.com/1600/900/fashion?lock=204", l1: "স্টাইল যখন", l2: "আপনার পরিচয়", text: "Sneakers, jackets, bags and fragrances picked for the season.", cta: "Shop fashion", cat: "Fashion" },
  { image: "https://loremflickr.com/1600/900/camera?lock=205", l1: "প্রতিটি মুহূর্ত", l2: "ক্যামেরায় বন্দি করুন", text: "Mirrorless cameras and 4K drones for creators of every level.", cta: "Shop cameras", cat: "Cameras" },
];
applyAdminImages(PRODUCTS); // photos added in the admin panel
// Product photos: put them in  public/products/  named like  headphones.jpg  (main) and headphones-2.jpg, -3.jpg, -4.jpg (gallery).
// Run  node get-images.mjs YOUR_PEXELS_KEY  to download matching photos automatically.
// If a local photo is missing, a random online photo is used, and if that also fails the icon shows.
const localImg = (p, k = 0) => `/products/${p.img}${k ? "-" + (k + 1) : ""}.jpg`;
const flickr = (p, w, h, k = 0) => `https://loremflickr.com/${w}/${h}/${p.img}?lock=${p.id + k * 100}`;
const imgUrl = (p) => p.image || localImg(p);
const fb = (p, w = 600, h = 480, k = 0) => (e) => {
  const el = e.currentTarget;
  if (!p.image && !el.src.includes("loremflickr.com")) el.src = flickr(p, w, h, k);
  else el.style.display = "none";
};
// Login page photo. Replace with your own image link if you like.
const AUTH_IMG = "https://loremflickr.com/1000/1300/shopping?lock=77";
const hide = (e) => { e.currentTarget.style.display = "none"; };

const ICONS = {
  bag: `<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>`,
  user: `<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`,
  menu: `<path d="M4 6h16M4 12h16M4 18h16"/>`,
  x: `<path d="M18 6 6 18M6 6l12 12"/>`,
  heart: `<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/>`,
  truck: `<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>`,
  undo: `<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5 5.5 5.5 0 0 1-5.5 5.5H11"/>`,
  shield: `<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>`,
  headset: `<path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2z"/><path d="M21 16v2a4 4 0 0 1-4 4h-5"/>`,
  check: `<path d="M20 6 9 17l-5-5"/>`,
  plus: `<path d="M5 12h14M12 5v14"/>`,
  minus: `<path d="M5 12h14"/>`,
  arrowRight: `<path d="M5 12h14m-7-7 7 7-7 7"/>`,
  arrowLeft: `<path d="m12 19-7-7 7-7M19 12H5"/>`,
  star: `<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.12 2.12 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.12 2.12 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.12 2.12 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.12 2.12 0 0 0 1.597-1.16z"/>`,
  card: `<rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>`,
  cash: `<rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>`,
  headphones: `<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>`,
  watch: `<path d="M12 10v2.2l1.6 1"/><path d="m16.13 7.66-.81-4.05a2 2 0 0 0-2-1.61h-2.68a2 2 0 0 0-2 1.61l-.78 4.05"/><path d="m7.88 16.36.8 4a2 2 0 0 0 2 1.64h2.72a2 2 0 0 0 2-1.64l.8-4"/><circle cx="12" cy="12" r="6"/>`,
  shirt: `<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>`,
  camera: `<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>`,
  gamepad: `<path d="M6 12h4M8 10v4"/><path d="M15 13h.01M18 11h.01"/><rect width="20" height="12" x="2" y="6" rx="6"/>`,
  home: `<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>`,
  laptop: `<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M2 20h20"/>`,
};
const CAT_ICON = { Audio: "headphones", Wearables: "watch", Fashion: "shirt", Cameras: "camera", Gaming: "gamepad", Home: "home", Tech: "laptop" };
function Icon({ name, size = 20, fill = false, sw = 1.6 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: ICONS[name] }} />
  );
}
const money = (n) => `৳${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const css = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500;700;800&family=DM+Sans:wght@400;500;600&family=Hind+Siliguri:wght@400;500;600;700&display=swap');
:root{
  --bg:#FFFFFF; --surface:#F5F8F3; --surface2:#E6EDE3; --line:rgba(23,57,43,.12);
  --text:#17392B; --muted:#5A6B61; --violet:#1F4A38; --violet-h:#2A5C47; --peach:#1F4A38; --pink:#1F4A38;
}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--text);font-family:'DM Sans','Hind Siliguri',system-ui,sans-serif;line-height:1.55;-webkit-font-smoothing:antialiased}
h1,h2,h3,.brand{font-family:'Bricolage Grotesque','DM Sans','Hind Siliguri',sans-serif;letter-spacing:-.02em}
button{font:inherit;color:inherit;cursor:pointer;border:0;background:none}
a{color:inherit;text-decoration:none}
:focus-visible{outline:2px solid var(--peach);outline-offset:3px;border-radius:8px}
.wrap{width:min(1200px,100% - 2rem);margin-inline:auto}

/* nav */
.nav{position:sticky;top:0;z-index:30;backdrop-filter:blur(16px);background:rgba(23,57,43,.8);border-bottom:1px solid var(--line)}
.nav .wrap{display:flex;align-items:center;justify-content:space-between;height:68px;gap:1rem}
.brand{font-size:1.45rem;font-weight:800;display:flex;align-items:center;gap:.5rem}
.brand i{width:26px;height:26px;border-radius:9px;background:var(--violet);display:inline-block;transform:rotate(12deg)}
.links{display:flex;gap:1.75rem;color:var(--muted);font-weight:500}
.links a:hover{color:var(--text)}
.actions{display:flex;align-items:center;gap:.5rem}
.icon-btn{position:relative;width:44px;height:44px;border-radius:14px;background:var(--surface);border:1px solid var(--line);display:grid;place-items:center;font-size:1.15rem;transition:background .2s}
.icon-btn:hover{background:var(--surface2)}
.badge{position:absolute;top:-6px;right:-6px;min-width:20px;height:20px;padding:0 5px;border-radius:99px;background:var(--pink);font-size:.72rem;font-weight:700;display:grid;place-items:center}
.burger{display:none}
.mobile-menu{display:none}

/* hero */
.hero{position:relative;overflow:hidden;padding:5.5rem 0 4.5rem}

.hero h1{font-size:clamp(2.6rem,6.4vw,5rem);line-height:1.02;font-weight:800}
.hero h1 span{color:var(--pink)}
.hero p{margin:1.4rem 0 2rem;color:var(--muted);font-size:1.12rem;max-width:46ch}
.cta-row{display:flex;gap:.8rem;flex-wrap:wrap}
.btn{padding:.9rem 1.6rem;border-radius:16px;font-weight:600;transition:transform .2s,box-shadow .2s,background .2s}
.btn-primary{background:var(--violet);box-shadow:0 10px 30px -8px rgba(245,235,210,.5)}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 16px 36px -8px rgba(245,235,210,.65)}
.btn-ghost{border:1px solid var(--line);background:var(--surface)}
.btn-ghost:hover{background:var(--surface2)}
.stats{display:flex;gap:2.2rem;margin-top:2.6rem;flex-wrap:wrap}
.stats b{display:block;font-family:'Bricolage Grotesque','Hind Siliguri',sans-serif;font-size:1.7rem}
.stats span{color:var(--muted);font-size:.9rem}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}

/* features strip */
.perks{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin:3.5rem 0 0}
.perk{padding:1.2rem 1.3rem;border-radius:20px;background:var(--surface);border:1px solid var(--line);display:flex;gap:.9rem;align-items:center}
.perk em{font-style:normal;font-size:1.5rem}
.perk b{display:block;font-size:.98rem}
.perk span{color:var(--muted);font-size:.85rem}

/* products */
.sec-head{display:flex;justify-content:space-between;align-items:end;gap:1rem;flex-wrap:wrap;margin-bottom:1.6rem}
.sec-head h2{font-size:clamp(1.8rem,4vw,2.6rem);font-weight:800}
.filters{display:flex;gap:.5rem;overflow-x:auto;padding-bottom:.3rem;max-width:100%;scrollbar-width:none}
.filters::-webkit-scrollbar{display:none}
.pill{white-space:nowrap;padding:.55rem 1.1rem;border-radius:99px;border:1px solid var(--line);background:var(--surface);color:var(--muted);font-weight:500;transition:all .2s}
.pill:hover{color:var(--text)}
.pill.on{background:var(--text);color:#17392B;border-color:var(--text)}
.search{width:100%;max-width:320px;padding:.7rem 1rem;border-radius:14px;border:1px solid var(--line);background:var(--surface);color:var(--text);font:inherit}
.search::placeholder{color:var(--muted)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:1.3rem}
.product{background:var(--surface);border:1px solid var(--line);border-radius:26px;padding:.8rem;display:flex;flex-direction:column;transition:transform .25s,border-color .25s}
.product:hover{transform:translateY(-6px);border-color:rgba(245,235,210,.8)}
.thumb{position:relative;aspect-ratio:1/.85;border-radius:19px;display:grid;place-items:center;font-size:4.2rem;overflow:hidden}
.thumb::after{content:"";position:absolute;width:140%;height:60%;bottom:-35%;left:-20%;background:rgba(255,255,255,.14);border-radius:50%}
.tag{position:absolute;top:.7rem;left:.7rem;z-index:3;background:rgba(23,57,43,.8);backdrop-filter:blur(8px);padding:.25rem .7rem;border-radius:99px;font-size:.78rem;font-weight:600}
.pbody{padding:1rem .6rem .5rem;display:flex;flex-direction:column;gap:.35rem;flex:1}
.pcat{color:var(--muted);font-size:.85rem}
.pbody h3{font-size:1.08rem;font-weight:700;line-height:1.25}
.rate{color:var(--peach);font-size:.88rem}
.pfoot{display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:.8rem}
.price{font-family:'Bricolage Grotesque','Hind Siliguri',sans-serif;font-size:1.35rem;font-weight:700}
.add{padding:.6rem 1rem;border-radius:13px;background:var(--surface2);border:1px solid var(--line);font-weight:600;font-size:.9rem;transition:all .2s}
.add:hover{background:var(--violet);border-color:var(--violet)}
.empty{grid-column:1/-1;text-align:center;color:var(--muted);padding:3rem 1rem;border:1px dashed var(--line);border-radius:22px}

/* banner */
.banner{margin:5rem 0;border-radius:34px;padding:clamp(2rem,6vw,4rem);background:var(--violet);display:flex;justify-content:space-between;align-items:center;gap:2rem;flex-wrap:wrap;position:relative;overflow:hidden}
.banner h2{font-size:clamp(1.7rem,4vw,2.8rem);font-weight:800;max-width:18ch;line-height:1.1}
.banner p{margin-top:.8rem;color:rgba(255,255,255,.8)}
.news{display:flex;gap:.6rem;flex-wrap:wrap;width:min(420px,100%)}
.news input{flex:1;min-width:180px;padding:.9rem 1rem;border-radius:14px;border:1px solid rgba(255,255,255,.25);background:rgba(23,57,43,.5);color:#fff;font:inherit}
.news input::placeholder{color:rgba(255,255,255,.6)}
.news button{padding:.9rem 1.4rem;border-radius:14px;background:#fff;color:#17392B;font-weight:700}

/* footer */
footer{border-top:1px solid var(--line);padding:3rem 0 2rem;color:var(--muted)}
.fgrid{display:grid;grid-template-columns:1.6fr repeat(3,1fr);gap:2rem}
.fgrid h4{color:var(--text);margin-bottom:.8rem;font-size:.98rem}
.fgrid a{display:block;margin:.4rem 0;font-size:.92rem}
.fgrid a:hover{color:var(--text)}
.copy{margin-top:2.5rem;padding-top:1.4rem;border-top:1px solid var(--line);font-size:.86rem;display:flex;justify-content:space-between;flex-wrap:wrap;gap:.5rem}

/* cart drawer */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(4px);z-index:40;opacity:0;pointer-events:none;transition:opacity .25s}
.overlay.open{opacity:1;pointer-events:auto}
.drawer{position:fixed;top:0;right:0;height:100%;width:min(420px,100%);background:var(--surface);border-left:1px solid var(--line);z-index:50;transform:translateX(100%);transition:transform .3s ease;display:flex;flex-direction:column}
.drawer.open{transform:none}
.dhead{display:flex;justify-content:space-between;align-items:center;padding:1.2rem 1.4rem;border-bottom:1px solid var(--line)}
.dhead h3{font-size:1.3rem}
.items{flex:1;overflow-y:auto;padding:1rem 1.4rem;display:flex;flex-direction:column;gap:1rem}
.item{display:grid;grid-template-columns:64px 1fr auto;gap:.9rem;align-items:center}
.item .mini{width:64px;height:64px;border-radius:16px;display:grid;place-items:center;font-size:1.8rem}
.item b{display:block;font-size:.95rem;line-height:1.25}
.qty{display:inline-flex;align-items:center;gap:.6rem;margin-top:.35rem;background:var(--surface2);border-radius:10px;padding:.15rem .4rem}
.qty button{width:26px;height:26px;border-radius:8px;font-weight:700}
.qty button:hover{background:rgba(255,255,255,.1)}
.rm{color:var(--muted);font-size:.82rem}
.rm:hover{color:var(--pink)}
.dfoot{padding:1.3rem 1.4rem;border-top:1px solid var(--line);display:grid;gap:.8rem}
.row{display:flex;justify-content:space-between;color:var(--muted)}
.row.total{color:var(--text);font-size:1.2rem;font-weight:700}
.dfoot .btn{width:100%}
.cart-empty{margin:auto;text-align:center;color:var(--muted)}
.cart-empty span{font-size:3rem;display:block;margin-bottom:.5rem}
.toast{position:fixed;left:50%;bottom:24px;transform:translate(-50%,120px);background:var(--text);color:#17392B;padding:.75rem 1.2rem;border-radius:14px;font-weight:600;z-index:60;transition:transform .3s;max-width:calc(100% - 2rem)}
.toast.show{transform:translate(-50%,0)}

/* responsive */
@media (max-width:960px){
  
  
    .perks{grid-template-columns:repeat(2,1fr)}
  .fgrid{grid-template-columns:1fr 1fr}
}
@media (max-width:760px){
  .links{display:none}
  .burger{display:grid}
  .mobile-menu{display:grid;gap:.2rem;padding:0 1rem;max-height:0;overflow:hidden;transition:max-height .3s,padding .3s;border-bottom:1px solid transparent}
  .mobile-menu.open{max-height:260px;padding:.5rem 1rem 1rem;border-color:var(--line)}
  .mobile-menu a{padding:.7rem .4rem;color:var(--muted);font-weight:500}
}
@media (max-width:520px){
  .perks{grid-template-columns:1fr}
  footer{padding-top:2.2rem}
  .fgrid{grid-template-columns:1fr 1fr;gap:1.8rem 1rem;text-align:center}
  .fgrid>div:first-child{grid-column:1/-1}
  .fgrid>div:first-child .brand{justify-content:center}
  .fgrid>div:first-child p{margin-inline:auto}
  .fgrid>div:last-child{grid-column:1/-1;padding-top:1.4rem;border-top:1px solid var(--line)}
  .fgrid a{overflow-wrap:anywhere}
  .grid{grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:.9rem}
  .stats{gap:1.4rem}
  .btn{flex:1;text-align:center}
}

/* ---- v2: extra polish ---- */
body{background:var(--bg)}
.hero h1{font-size:clamp(2.4rem,7vw,5.4rem)}
.hero p{font-size:clamp(1rem,2.4vw,1.15rem)}
.btn-primary{background:var(--violet);transition:background .2s,transform .2s,box-shadow .2s}
.btn-primary:hover{background:var(--violet-h)}
@keyframes spin{to{transform:rotate(360deg)}}
.marquee{overflow:hidden;border-block:1px solid var(--line);background:rgba(30,70,54,.6);padding:1rem 0;margin-bottom:2.5rem}
.track{display:flex;gap:3rem;width:max-content;animation:slide 28s linear infinite;font-family:'Bricolage Grotesque','Hind Siliguri',sans-serif;font-weight:700;font-size:1.25rem;color:var(--muted)}
.track span{display:flex;align-items:center;gap:3rem}
.track span::after{content:"";width:8px;height:8px;background:var(--violet);transform:rotate(45deg);align-self:center}
@keyframes slide{to{transform:translateX(-50%)}}
.perk{background:var(--surface);backdrop-filter:blur(10px)}
.product{position:relative;background:var(--surface);backdrop-filter:blur(10px)}
.product:hover{box-shadow:0 30px 60px -28px rgba(245,235,210,.4)}
.thumb span:last-child{transition:transform .4s;filter:drop-shadow(0 14px 18px rgba(0,0,0,.35))}
.product:hover .thumb span:last-child{transform:scale(1.12) rotate(-6deg)}
.heart{position:absolute;top:.6rem;right:.6rem;z-index:3;width:38px;height:38px;border-radius:50%;background:rgba(23,57,43,.8);backdrop-filter:blur(8px);display:grid;place-items:center;font-size:1.05rem;transition:transform .2s}
.heart:hover{transform:scale(1.15)}
.heart.on{background:var(--pink)}
.old{color:var(--muted);text-decoration:line-through;font-size:.9rem;margin-right:.4rem}
.tools{display:flex;gap:.6rem;flex-wrap:wrap;width:100%;max-width:560px;justify-content:flex-end}
.tools .search{flex:1;min-width:180px}
.sort{padding:.7rem 1rem;border-radius:14px;border:1px solid var(--line);background:var(--surface);color:var(--text);font:inherit}
.banner>*{position:relative}
.drawer{background:rgba(255,255,255,.98);backdrop-filter:blur(20px)}
@media (max-width:960px){
  .tools{max-width:100%;justify-content:flex-start}
  .sec-head{align-items:stretch}
}
@media (max-width:760px){
  .nav .wrap{height:60px}
  
  .banner{margin:3rem 0;border-radius:26px}
  .news{width:100%}
  .news button{flex:1}
  .copy{flex-direction:column;align-items:center;text-align:center}
}
@media (max-width:520px){
  .wrap{width:min(1200px,100% - 1.4rem)}
  .grid{grid-template-columns:repeat(2,1fr);gap:.7rem}
  .product{padding:.5rem;border-radius:20px}
  .thumb{font-size:3rem;border-radius:15px}
  .pbody{padding:.7rem .3rem .3rem}
  .pbody h3{font-size:.95rem}
  .pfoot{flex-direction:column;align-items:stretch;gap:.6rem}
  .add{width:100%;padding:.65rem}
  .price{font-size:1.15rem}
  .tools .sort,.tools .search{flex:1 1 100%}
  .drawer{padding-bottom:env(safe-area-inset-bottom)}
    }
@media (max-width:360px){.grid{grid-template-columns:1fr}}
@media (hover:none){.product:hover{transform:none}}
.pimg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1;transition:transform .5s}
.product:hover .pimg{transform:scale(1.08)}

/* ---- checkout ---- */
.co{padding:2.2rem 0 4rem}
.co-top{display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-bottom:1.6rem}
.co-top h1{font-size:clamp(1.8rem,5vw,2.8rem);font-weight:800}
.back{color:var(--muted);font-weight:500}
.back:hover{color:var(--text)}
.co-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,.85fr);gap:1.6rem;align-items:start}
.panel{background:var(--surface);border:1px solid var(--line);border-radius:26px;padding:clamp(1.1rem,3vw,1.8rem);margin-bottom:1.2rem;backdrop-filter:blur(10px)}
.panel h2{font-size:1.25rem;margin-bottom:1.1rem}
.fields{display:grid;grid-template-columns:1fr 1fr;gap:.9rem}
.fld{display:grid;gap:.35rem;font-size:.88rem;color:var(--muted)}
.fld.full{grid-column:1/-1}
.fld input,.fld select,.fld textarea{width:100%;padding:.8rem .95rem;border-radius:13px;border:1px solid var(--line);background:var(--surface);color:var(--text);font:inherit;font-size:1rem}
.fld textarea{resize:vertical;min-height:70px}
.fld input:focus,.fld select:focus,.fld textarea:focus{outline:2px solid var(--violet);border-color:transparent}
.fld.bad input,.fld.bad select{border-color:var(--pink)}
.fld small{color:var(--pink);font-size:.8rem}
.opt{display:flex;align-items:center;gap:.9rem;padding:.95rem 1.1rem;border-radius:16px;border:1px solid var(--line);background:var(--surface);cursor:pointer;margin-bottom:.7rem;transition:border-color .2s,background .2s}
.opt:has(input:checked){border-color:var(--violet);background:rgba(245,235,210,.15)}
.opt input{accent-color:var(--violet);width:18px;height:18px}
.opt div{flex:1}
.opt b{display:block}
.opt span{color:var(--muted);font-size:.86rem}
.opt em{font-style:normal;font-weight:700}
.note{color:var(--muted);font-size:.82rem;margin-top:.7rem}
.sum{position:sticky;top:84px}
.sum .line{display:grid;grid-template-columns:56px 1fr auto;gap:.8rem;align-items:center;margin-bottom:.9rem}
.sum .mini{width:56px;height:56px;border-radius:14px;display:grid;place-items:center;font-size:1.5rem;position:relative;overflow:hidden}
.sum .line b{font-size:.92rem;line-height:1.25;display:block}
.sum .line span{color:var(--muted);font-size:.82rem}
.promo{display:flex;gap:.5rem;margin:1rem 0}
.promo input{flex:1;min-width:0;padding:.75rem .9rem;border-radius:13px;border:1px solid var(--line);background:var(--surface);color:var(--text);font:inherit;text-transform:uppercase}
.promo button{padding:0 1.1rem;border-radius:13px;background:var(--surface2);border:1px solid var(--line);font-weight:600}
.sum .row{margin:.45rem 0}
.sum .green{color:#fff}
.place{width:100%;margin-top:1.1rem;font-size:1.05rem}
.done{max-width:560px;margin:3rem auto;text-align:center;padding:2.5rem 1.5rem}
.done .ok{width:84px;height:84px;margin:0 auto 1.3rem;border-radius:50%;display:grid;place-items:center;font-size:2.4rem;background:var(--violet);box-shadow:0 20px 50px -15px rgba(245,235,210,.5)}
.done h1{font-size:clamp(1.8rem,5vw,2.5rem);margin-bottom:.6rem}
.done p{color:var(--muted);margin-bottom:.4rem}
.done .id{display:inline-block;margin:1rem 0 1.6rem;padding:.6rem 1.2rem;border-radius:14px;background:var(--surface2);border:1px solid var(--line);font-weight:700;letter-spacing:.04em}
@media (max-width:900px){.co-grid{grid-template-columns:1fr}.sum{position:static;order:-1}}
@media (max-width:520px){.fields{grid-template-columns:1fr}.panel{border-radius:20px}.opt{padding:.8rem}}

/* ---- auth ---- */
.auth{display:grid;grid-template-columns:1fr 1fr;min-height:calc(100vh - 68px)}
.auth-art{position:relative;overflow:hidden;padding:clamp(2rem,5vw,4rem);display:flex;flex-direction:column;justify-content:flex-end;gap:1rem;background:var(--violet)}
.auth-art>*{position:relative}
.auth-art .big{font-size:clamp(4rem,9vw,7rem);line-height:1;filter:drop-shadow(0 20px 30px rgba(0,0,0,.35));animation:float 6s ease-in-out infinite}
.auth-art h2{font-size:clamp(1.8rem,3.6vw,2.8rem);font-weight:800;line-height:1.1;max-width:16ch}
.auth-art p{color:rgba(255,255,255,.82);max-width:38ch}
.auth-form{display:grid;place-items:center;padding:clamp(1.4rem,5vw,3rem)}
.auth-box{width:min(420px,100%)}
.auth-box h1{font-size:clamp(1.7rem,4vw,2.3rem);font-weight:800;margin-bottom:.4rem}
.auth-box>p{color:var(--muted);margin-bottom:1.5rem}
.tabs{display:grid;grid-template-columns:1fr 1fr;gap:.3rem;padding:.3rem;border-radius:16px;background:var(--surface);border:1px solid var(--line);margin-bottom:1.5rem}
.tabs button{padding:.65rem;border-radius:12px;font-weight:600;color:var(--muted);transition:all .2s}
.tabs button.on{background:var(--surface2);color:var(--text)}
.stack{display:grid;gap:1rem}
.pw{position:relative}
.pw input{padding-right:4.6rem}
.pw button{position:absolute;right:.5rem;top:50%;transform:translateY(-50%);padding:.35rem .6rem;border-radius:9px;color:var(--muted);font-size:.85rem}
.pw button:hover{color:var(--text)}
.rowb{display:flex;justify-content:space-between;align-items:center;gap:.8rem;flex-wrap:wrap;font-size:.9rem;color:var(--muted)}
.rowb label{display:flex;align-items:center;gap:.5rem;cursor:pointer}
.rowb input{accent-color:var(--violet);width:16px;height:16px}
.lnk{color:var(--peach);font-weight:600}
.lnk:hover{text-decoration:underline}
.divider{display:flex;align-items:center;gap:.8rem;color:var(--muted);font-size:.85rem;margin:1.3rem 0}
.divider::before,.divider::after{content:"";flex:1;height:1px;background:var(--line)}
.social{width:100%;padding:.85rem;border-radius:16px;border:1px solid var(--line);background:var(--surface);font-weight:600;transition:background .2s}
.social:hover{background:var(--surface2)}
.okbox{padding:1rem 1.2rem;border-radius:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.3);margin-bottom:1rem;color:#fff}
.acct{position:relative}
.avatar{background:var(--violet);border:0;font-weight:700;font-family:'Bricolage Grotesque','Hind Siliguri',sans-serif}
.acct-menu{position:absolute;right:0;top:calc(100% + 10px);width:230px;padding:1rem;border-radius:18px;background:var(--surface);border:1px solid var(--line);box-shadow:0 24px 50px -20px rgba(0,0,0,.8);z-index:40}
.acct-menu b{display:block}
.acct-menu span{display:block;color:var(--muted);font-size:.85rem;word-break:break-all;margin-bottom:.8rem}
.acct-menu button{width:100%;padding:.65rem;border-radius:12px;background:var(--surface2);border:1px solid var(--line);font-weight:600}
.acct-menu button:hover{border-color:var(--pink)}
@media (max-width:860px){.auth{grid-template-columns:1fr}.auth-art{min-height:200px;padding:1.6rem;justify-content:center}.auth-art .big{font-size:3.2rem}.auth-art h2{font-size:1.6rem}.auth-art p{display:none}}

/* ---- hero v3 ---- */
.hero h1{font-size:clamp(2.2rem,6.2vw,4.6rem);line-height:1.25;font-weight:600}
.hero h1 .out{display:block;color:transparent;-webkit-text-stroke:1px #fff}
@keyframes fade{from{opacity:0;transform:scale(1.04)}to{opacity:1;transform:none}}

/* ---- hero v4: one full-width image section ---- */
.hero{padding:4px 0 2.5rem}
.hero-card{position:relative;overflow:hidden;border-radius:clamp(22px,4vw,38px);min-height:clamp(560px,84vh,740px);display:flex;align-items:center;background:var(--surface2);border:1px solid var(--line)}
.hero-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;animation:fade .6s ease}
.hero-shade{position:absolute;inset:0;background:rgba(23,57,43,.62)}
.hero-copy{position:relative;z-index:2;padding:clamp(1.5rem,5vw,4.5rem);max-width:760px}
.hero-copy p{color:#E4E9E2;margin:1.2rem 0 1.8rem}
.hero-copy .stats{margin-top:2.2rem}
.hero-card @keyframes fade{from{opacity:0}to{opacity:1}}
@media (max-width:860px){
  .hero-card{flex-direction:column;align-items:stretch;justify-content:space-between;min-height:680px}
      }
@media (max-width:520px){
  .hero{padding-top:4px}
  .hero-copy{padding:5rem 1.2rem 1rem}
    .hero h1{line-height:1.3}
}

/* ---- icons ---- */
.icon-btn svg,.heart svg{display:block}
.perk em{width:48px;height:48px;border-radius:14px;background:var(--surface2);border:1px solid var(--line);display:grid;place-items:center;flex-shrink:0}
.rate{display:inline-flex;align-items:center;gap:.3rem}
.rt{display:inline-flex;align-items:center;gap:.3rem}
.heart.on{color:#fff}
.back{display:inline-flex;align-items:center;gap:.4rem}
.qty button{display:grid;place-items:center}
.opt em{display:grid;place-items:center}
.cart-empty span{display:grid;place-items:center;margin-bottom:.8rem;color:var(--muted)}
.done .ok{color:#fff}
.auth-art .big{color:#fff}
.thumb{color:var(--muted)}
/* ---- product page ---- */
.plink{font:inherit;color:inherit;text-align:left;padding:0}
.plink:hover{color:var(--pink)}
.pdp{padding:1.6rem 0 6rem}
.crumb{display:flex;gap:.7rem;align-items:center;color:var(--muted);margin-bottom:1.4rem;flex-wrap:wrap}
.crumb button{display:inline-flex;align-items:center;gap:.4rem;font-weight:500}
.crumb button:hover{color:var(--text)}
.pdp-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:clamp(1.4rem,4vw,3.5rem);align-items:start}
.gallery{position:sticky;top:84px}
.g-main{position:relative;aspect-ratio:1;border-radius:28px;overflow:hidden;background:var(--surface2);border:1px solid var(--line);display:grid;place-items:center}
.g-main img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;animation:fade .4s ease}
.g-fb{color:var(--muted)}
.g-thumbs{display:grid;grid-template-columns:repeat(4,1fr);gap:.7rem;margin-top:.8rem}
.g-thumbs button{position:relative;aspect-ratio:1;border-radius:16px;overflow:hidden;border:2px solid var(--line);background:var(--surface2);transition:border-color .2s}
.g-thumbs button img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.g-thumbs button.on{border-color:#fff}
.info h1{font-size:clamp(1.7rem,4vw,2.6rem);font-weight:800;line-height:1.15;margin:.3rem 0 .8rem}
.rrow{display:flex;align-items:center;gap:.6rem;color:var(--muted);flex-wrap:wrap}
.rrow b{color:var(--text)}
.stars{display:inline-flex;gap:2px;color:#fff}
.pp{display:flex;align-items:baseline;gap:.8rem;flex-wrap:wrap;margin:1.1rem 0 .6rem}
.pp strong{font-family:'Bricolage Grotesque','Hind Siliguri',sans-serif;font-size:clamp(1.8rem,4vw,2.4rem)}
.pp s{color:var(--muted)}
.pp em{font-style:normal;background:var(--violet);padding:.2rem .6rem;border-radius:99px;font-size:.8rem;font-weight:700}
.stock{display:flex;align-items:center;gap:.4rem;color:#fff;font-weight:500;margin-bottom:1rem}
.lead{color:var(--muted);max-width:58ch;margin-bottom:1.5rem}
.buyrow{display:flex;gap:.7rem;align-items:center;flex-wrap:wrap}
.big-qty{margin:0;padding:.3rem .5rem;border-radius:14px;gap:.9rem}
.big-qty button{width:34px;height:34px}
.big-qty span{min-width:1.4rem;text-align:center;font-weight:700}
.grow{flex:1;min-width:200px}
.wishbtn.on{background:var(--violet);border-color:var(--violet)}
.buy{width:100%;margin-top:.7rem}
.assure{list-style:none;margin-top:1.6rem;display:grid;gap:.9rem;padding-top:1.4rem;border-top:1px solid var(--line)}
.assure li{display:flex;gap:.9rem;align-items:flex-start}
.assure svg{margin-top:2px}
.assure b{display:block}
.assure span{color:var(--muted);font-size:.88rem}
.tabs-wrap{margin:3.5rem 0}
.ptabs{display:flex;gap:.4rem;border-bottom:1px solid var(--line);overflow-x:auto}
.ptabs button{padding:.9rem 1.2rem;color:var(--muted);font-weight:600;border-bottom:2px solid transparent;white-space:nowrap}
.ptabs button.on{color:var(--text);border-color:var(--violet)}
.tab-body{padding:1.6rem 0;color:var(--muted);max-width:760px}
.specs div{display:grid;grid-template-columns:minmax(120px,200px) 1fr;gap:1rem;padding:.8rem 0;border-bottom:1px solid var(--line)}
.specs dd{color:var(--text)}
.revs{display:grid;gap:1.3rem}
.revs article{display:flex;gap:1rem}
.revs .av{width:42px;height:42px;border-radius:50%;background:var(--violet);color:#fff;display:grid;place-items:center;font-weight:700;flex-shrink:0}
.revs b{color:var(--text);margin-right:.6rem}
.revs p{margin-top:.3rem}
.rel-h{font-size:clamp(1.5rem,3.4vw,2.1rem);font-weight:800;margin-bottom:1.3rem}
.rcard{text-align:left;color:inherit;width:100%}
.pdp-bar{display:none}
@media (max-width:860px){
  .pdp-grid{grid-template-columns:1fr}
  .gallery{position:static}
  .pdp-bar{position:fixed;left:0;right:0;bottom:0;z-index:25;display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.8rem 1rem calc(.8rem + env(safe-area-inset-bottom));background:rgba(255,255,255,.96);backdrop-filter:blur(14px);border-top:1px solid var(--line)}
  .pdp-bar span{display:block;color:var(--muted);font-size:.78rem;max-width:150px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .pdp-bar b{font-family:'Bricolage Grotesque','Hind Siliguri',sans-serif;font-size:1.2rem}
  .pdp-bar .btn{padding:.8rem 1.3rem}
}
@media (max-width:520px){.specs div{grid-template-columns:1fr;gap:.2rem}.g-main{border-radius:20px}}

.auth-art>.auth-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;animation:fade .6s ease}
.auth-art>.auth-shade{position:absolute;inset:0;background:rgba(23,57,43,.55)}
.auth-art>.auth-brand{position:absolute;top:clamp(1.2rem,3vw,2rem);left:clamp(1.4rem,4vw,3rem);color:#fff}
.auth-art h2,.auth-art p{position:relative;z-index:1}
@media (max-width:860px){.auth-art{min-height:240px}.auth-art>.auth-brand{display:none}}

/* ---- hero slider ---- */
.hero-bg{opacity:0;transition:opacity .9s ease;animation:none}
.hero-bg.on{opacity:1}
.rise{animation:rise .7s ease both}
@keyframes rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.hero-ctrl{position:absolute;z-index:3;right:clamp(1rem,4vw,2.5rem);bottom:clamp(1rem,4vw,2.5rem);display:flex;align-items:center;gap:.7rem}
.dots{display:flex;gap:.4rem;margin-right:.6rem}
.dots button{width:10px;height:10px;border-radius:99px;background:rgba(255,255,255,.4);transition:width .3s,background .3s}
.dots button.on{width:28px;background:#fff}
.arrow{width:50px;height:50px;border-radius:50%;display:grid;place-items:center;border:1px solid rgba(255,255,255,.5);background:rgba(23,57,43,.45);backdrop-filter:blur(8px);color:#fff;transition:background .2s,border-color .2s}
.arrow:hover{background:var(--violet);border-color:var(--violet)}
@media (max-width:860px){
  .hero-card{flex-direction:row;align-items:flex-start;justify-content:flex-start;min-height:0}
  .hero-copy{padding:1.4rem 1.4rem 5.5rem}
  .hero-ctrl{left:1.4rem;right:1.4rem}
  .dots{margin-right:auto}
  .arrow{width:44px;height:44px}
}
@media (max-width:520px){.hero-copy{padding:1.2rem 1.2rem 5.5rem}}
@media (max-width:520px){.hero-copy .stats{flex-wrap:nowrap;gap:.8rem;justify-content:space-between;margin-top:1.4rem}.hero-copy .stats>div{flex:1;min-width:0}.hero-copy .stats b{font-size:1.15rem}.hero-copy .stats span{display:block;font-size:.72rem;line-height:1.25}}


/* ---- hover and press effect for every button ---- */
button:not(#_){transition:transform .2s ease,box-shadow .2s ease,background .2s,border-color .2s,color .2s,width .3s}
@media (hover:hover){
  button:hover{transform:translateY(-2px)}
  .pw button:hover{transform:translateY(calc(-50% - 2px))}
  .add:hover,.pill:hover,.icon-btn:hover,.arrow:hover,.social:hover,.promo button:hover,.news button:hover,.acct-menu button:hover,.btn-ghost:hover,.tabs button:hover,.g-thumbs button:hover{box-shadow:0 10px 22px -10px rgba(245,235,210,.55)}
}
button:active:not(#_){transform:translateY(0) scale(.97)}
.pw button:active:not(#_){transform:translateY(-50%) scale(.97)}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
/* Ever Style: white page, deep-green sections */
.nav,.hero-card,.banner,footer,.auth-art{--bg:#17392B;--surface:#1E4636;--surface2:#265543;--line:rgba(255,255,255,.14);--text:#F9FAF4;--muted:#AEBDAA;--violet:#F5EBD2;--violet-h:#E8DCBB;--peach:#F5EBD2;--pink:#F5EBD2;color:var(--text)}
footer{background:#17392B;color:var(--muted)}
.perk em{background:#fff}
.banner,.auth-art{background:linear-gradient(120deg,#1F4A38,#17392B)}
.hero-shade{background:linear-gradient(90deg,rgba(23,57,43,.92),rgba(23,57,43,.5))}
.tag{background:rgba(245,235,210,.95);color:#17392B}
.heart{background:rgba(255,255,255,.94);color:#17392B}
.product{background:#fff;backdrop-filter:none;box-shadow:0 1px 2px rgba(23,57,43,.05)}
.product:hover{border-color:rgba(31,74,56,.4);box-shadow:0 26px 50px -26px rgba(23,57,43,.4)}
.price{color:var(--violet)}
.btn-primary{box-shadow:0 10px 24px -10px rgba(31,74,56,.55)}
.btn-primary:hover{box-shadow:0 16px 30px -10px rgba(31,74,56,.6)}
.nav .btn-primary,.hero-card .btn-primary,.banner .btn-primary,.auth-art .btn-primary{box-shadow:0 10px 30px -10px rgba(0,0,0,.45)}
.btn-primary,.add:hover,.avatar,.pp em,.wishbtn.on,.arrow:hover,.revs .av,.heart.on,.badge,.done .ok{color:var(--bg)}
.pill.on{color:var(--bg)}
.toast{color:var(--bg)}
.news input{background:#17392B;border-color:transparent;color:#F9FAF4}
.news button{background:#F5EBD2;color:#17392B}
.stars,.stock,.sum .green{color:var(--violet)}
.okbox{background:var(--surface);border-color:var(--line);color:var(--text)}
.g-thumbs button.on{border-color:var(--violet)}
.qty button:hover{background:rgba(23,57,43,.08)}
.opt:has(input:checked){background:rgba(31,74,56,.08)}
.fld.bad input,.fld.bad select{border-color:#C0503F}
.fld small{color:#C0503F}
`;

const money2 = money;

function CheckoutPage({ user, cart, onBack, onPlaced }) {
  const [f, setF] = useState({ email: user?.email || "", phone: "", first: user ? user.name.split(" ")[0] : "", last: user ? user.name.split(" ").slice(1).join(" ") : "", address: "", city: "", zip: "", country: "Bangladesh", note: "", cardName: "", card: "", exp: "", cvc: "" });
  const [ship, setShip] = useState("standard");
  const [pay, setPay] = useState("card");
  const [promo, setPromo] = useState("");
  const [applied, setApplied] = useState(false);
  const [err, setErr] = useState({});
  const [order, setOrder] = useState(null);

  const sub = cart.reduce((s, i) => s + i.qty * i.price, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const discount = applied ? Math.round(sub * 15) / 100 : 0;
  const shipping = ship === "express" ? 250 : sub - discount > 5000 ? 0 : 100;
  const total = sub - discount + shipping;

  const set = (k, fmt) => (e) => setF({ ...f, [k]: fmt ? fmt(e.target.value) : e.target.value });
  const fmtCard = (v) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const fmtExp = (v) => { const d = v.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d; };
  const field = (k, label, props = {}, fmt) => (
    <label className={`fld ${props.full ? "full" : ""} ${err[k] ? "bad" : ""}`}>
      {label}
      <input value={f[k]} onChange={set(k, fmt)} {...props} full={undefined} />
      {err[k] && <small>{err[k]}</small>}
    </label>
  );

  const applyPromo = () => {
    if (promo.trim().toUpperCase() === "EVERSTYLE15") setApplied(true);
    else { setApplied(false); setErr({ ...err, promo: "x" }); }
  };

  const submit = (e) => {
    e.preventDefault();
    const r = "Required";
    const x = {};
    if (!/^\S+@\S+\.\S+$/.test(f.email)) x.email = "Enter a valid email";
    if (f.phone.replace(/\D/g, "").length < 7) x.phone = "Enter a valid phone number";
    ["first", "last", "address", "city", "zip"].forEach((k) => { if (!f[k].trim()) x[k] = r; });
    if (pay === "card") {
      if (!f.cardName.trim()) x.cardName = r;
      if (f.card.replace(/\s/g, "").length !== 16) x.card = "Enter 16 digits";
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(f.exp)) x.exp = "Use MM/YY";
      if (f.cvc.length < 3) x.cvc = "3 digits";
    }
    setErr(x);
    if (Object.keys(x).length) {
      setTimeout(() => document.querySelector(".fld.bad")?.scrollIntoView({ behavior: "smooth", block: "center" }), 30);
      return;
    }
    const oid = "NV-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    setOrder({ id: oid, email: f.email, total, pay });
    saveOrder({ id: oid, name: `${f.first} ${f.last}`.trim(), phone: f.phone, email: f.email, address: `${f.address}, ${f.city} ${f.zip}, ${f.country}`, items: cart.map((i) => ({ name: i.name, qty: i.qty, price: i.price })), total, pay: pay === "cod" ? "Cash on delivery" : "Card", status: "Pending", ts: new Date().toISOString() });
    onPlaced();
    window.scrollTo(0, 0);
  };

  if (order)
    return (
      <main className="wrap">
        <div className="panel done">
          <div className="ok"><Icon name="check" size={40} sw={2.2} /></div>
          <h1>Order placed</h1>
          <p>Thank you, {f.first}. We sent a confirmation to {order.email}.</p>
          <p>{order.pay === "cod" ? `Pay ${money2(order.total)} in cash on delivery.` : `${money2(order.total)} was charged to your card.`}</p>
          <span className="id">Order {order.id}</span>
          <div><button className="btn btn-primary" onClick={onBack}>Continue shopping</button></div>
        </div>
      </main>
    );

  if (cart.length === 0)
    return (
      <main className="wrap">
        <div className="panel done">
          <div className="ok"><Icon name="bag" size={38} /></div>
          <h1>Your cart is empty</h1>
          <p>Add a product before you check out.</p>
          <div style={{ marginTop: "1.4rem" }}><button className="btn btn-primary" onClick={onBack}>Browse products</button></div>
        </div>
      </main>
    );

  return (
    <main className="wrap co">
      <div className="co-top">
        <h1>Checkout</h1>
        <button className="back" onClick={onBack}><Icon name="arrowLeft" size={16} /> Back to shop</button>
      </div>
      <form className="co-grid" onSubmit={submit} noValidate>
        <div>
          <section className="panel">
            <h2>Contact</h2>
            <div className="fields">
              {field("email", "Email", { type: "email", autoComplete: "email", placeholder: "you@example.com" })}
              {field("phone", "Phone", { type: "tel", autoComplete: "tel", placeholder: "+880 1XXX XXXXXX" })}
            </div>
          </section>

          <section className="panel">
            <h2>Shipping address</h2>
            <div className="fields">
              {field("first", "First name", { autoComplete: "given-name" })}
              {field("last", "Last name", { autoComplete: "family-name" })}
              {field("address", "Address", { full: true, autoComplete: "street-address", placeholder: "House, road, area" })}
              {field("city", "City", { autoComplete: "address-level2" })}
              {field("zip", "Postal code", { autoComplete: "postal-code", inputMode: "numeric" })}
              <label className="fld full">
                Country
                <select value={f.country} onChange={set("country")}>
                  {["Bangladesh", "India", "United States", "United Kingdom", "Canada", "Australia"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label className="fld full">
                Delivery note (optional)
                <textarea value={f.note} onChange={set("note")} placeholder="Landmark, gate code, preferred time" />
              </label>
            </div>
          </section>

          <section className="panel">
            <h2>Delivery method</h2>
            <label className="opt"><input type="radio" name="ship" checked={ship === "standard"} onChange={() => setShip("standard")} /><div><b>Standard</b><span>3 to 5 business days</span></div><em>{sub - discount > 5000 ? "Free" : "৳100"}</em></label>
            <label className="opt"><input type="radio" name="ship" checked={ship === "express"} onChange={() => setShip("express")} /><div><b>Express</b><span>1 to 2 business days</span></div><em>৳250</em></label>
          </section>

          <section className="panel">
            <h2>Payment</h2>
            <label className="opt"><input type="radio" name="pay" checked={pay === "card"} onChange={() => setPay("card")} /><div><b>Credit or debit card</b><span>Visa, Mastercard, Amex</span></div><em><Icon name="card" size={22} /></em></label>
            {pay === "card" && (
              <div className="fields" style={{ margin: ".4rem 0 .9rem" }}>
                {field("cardName", "Name on card", { full: true, autoComplete: "cc-name" })}
                {field("card", "Card number", { full: true, autoComplete: "cc-number", inputMode: "numeric", placeholder: "1234 5678 9012 3456" }, fmtCard)}
                {field("exp", "Expiry", { autoComplete: "cc-exp", inputMode: "numeric", placeholder: "MM/YY" }, fmtExp)}
                {field("cvc", "CVC", { autoComplete: "cc-csc", inputMode: "numeric", placeholder: "123" }, (v) => v.replace(/\D/g, "").slice(0, 4))}
              </div>
            )}
            <label className="opt"><input type="radio" name="pay" checked={pay === "cod"} onChange={() => setPay("cod")} /><div><b>Cash on delivery</b><span>Pay when your order arrives</span></div><em><Icon name="cash" size={22} /></em></label>
            <p className="note">This is a demo checkout. Card details are not sent or stored anywhere. Connect a payment provider such as SSLCommerz, bKash or Nagad before going live.</p>
          </section>
        </div>

        <aside className="panel sum">
          <h2>Order summary ({count})</h2>
          {cart.map((i) => (
            <div className="line" key={i.id}>
              <div className="mini" style={{ background: "var(--surface2)" }}>
                <Icon name={CAT_ICON[i.cat]} size={22} />
                <img className="pimg" src={imgUrl(i)} alt="" onError={fb(i, 112, 112)} />
              </div>
              <div><b>{i.name}</b><span>Qty {i.qty}</span></div>
              <b>{money2(i.price * i.qty)}</b>
            </div>
          ))}
          <div className="promo">
            <input value={promo} onChange={(e) => { setPromo(e.target.value); setApplied(false); setErr({ ...err, promo: "" }); }} placeholder="Promo code" aria-label="Promo code" />
            <button type="button" onClick={applyPromo}>Apply</button>
          </div>
          {err.promo && <p className="note" style={{ color: "#C0503F", marginTop: "-.5rem" }}>That code isn't valid. Try EVERSTYLE15.</p>}
          <div className="row"><span>Subtotal</span><span>{money2(sub)}</span></div>
          {applied && <div className="row green"><span>Promo (15%)</span><span>−{money2(discount)}</span></div>}
          <div className="row"><span>Shipping</span><span>{shipping === 0 ? "Free" : money2(shipping)}</span></div>
          <div className="row total"><span>Total</span><span>{money2(total)}</span></div>
          <button type="submit" className="btn btn-primary place">{pay === "cod" ? "Place order" : `Pay ${money2(total)}`}</button>
        </aside>
      </form>
    </main>
  );
}

function AuthPage({ onAuth, onBack }) {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "" });
  const [show, setShow] = useState(false);
  const [err, setErr] = useState({});
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const switchTo = (m) => { setMode(m); setErr({}); setSent(false); };

  const submit = (e) => {
    e.preventDefault();
    const x = {};
    if (mode === "signup" && f.name.trim().length < 2) x.name = "Enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) x.email = "Enter a valid email";
    if (mode !== "forgot" && f.password.length < 6) x.password = "Use at least 6 characters";
    if (mode === "signup" && f.confirm !== f.password) x.confirm = "Passwords don't match";
    setErr(x);
    if (Object.keys(x).length) return;
    if (mode === "forgot") return setSent(true);
    const name = mode === "signup" ? f.name.trim() : f.email.split("@")[0];
    onAuth({ name: name.charAt(0).toUpperCase() + name.slice(1), email: f.email });
  };

  const input = (k, label, props = {}) => (
    <label className={`fld ${err[k] ? "bad" : ""}`}>
      {label}
      {props.type === "password" ? (
        <span className="pw">
          <input value={f[k]} onChange={set(k)} {...props} type={show ? "text" : "password"} />
          <button type="button" onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button>
        </span>
      ) : (
        <input value={f[k]} onChange={set(k)} {...props} />
      )}
      {err[k] && <small>{err[k]}</small>}
    </label>
  );

  return (
    <main className="auth">
      <section className="auth-art" aria-hidden="true">
        <img className="auth-img" src={AUTH_IMG} alt="" onError={hide} />
        <div className="auth-shade" />
        <div className="brand auth-brand">Ever Style</div>
        <h2>Your style, your orders, all in one place.</h2>
        <p>Track orders, save your wishlist and check out faster with your account.</p>
      </section>
      <section className="auth-form">
        <div className="auth-box">
          {mode === "forgot" ? (
            <>
              <h1>Reset password</h1>
              <p>Enter your email and we'll send you a link to set a new password.</p>
            </>
          ) : (
            <>
              <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
              <p>{mode === "login" ? "Sign in to continue shopping." : "Join Ever Style to get 15% off your first order."}</p>
              <div className="tabs" role="tablist">
                <button className={mode === "login" ? "on" : ""} onClick={() => switchTo("login")}>Sign in</button>
                <button className={mode === "signup" ? "on" : ""} onClick={() => switchTo("signup")}>Sign up</button>
              </div>
            </>
          )}
          {sent && <div className="okbox" role="status">Reset link sent to {f.email}. Check your inbox.</div>}
          <form className="stack" onSubmit={submit} noValidate>
            {mode === "signup" && input("name", "Full name", { autoComplete: "name" })}
            {input("email", "Email", { type: "email", autoComplete: "email", placeholder: "you@example.com" })}
            {mode !== "forgot" && input("password", "Password", { type: "password", autoComplete: mode === "login" ? "current-password" : "new-password" })}
            {mode === "signup" && input("confirm", "Confirm password", { type: "password", autoComplete: "new-password" })}
            {mode === "login" && (
              <div className="rowb">
                <label><input type="checkbox" defaultChecked /> Remember me</label>
                <button type="button" className="lnk" onClick={() => switchTo("forgot")}>Forgot password?</button>
              </div>
            )}
            <button type="submit" className="btn btn-primary">
              {mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
            </button>
          </form>
          {mode !== "forgot" && (
            <>
              <div className="divider">or</div>
              <button className="social" type="button" onClick={() => onAuth({ name: "Demo customer", email: "demo@everstyle.store" })}>
                Continue with Google
              </button>
            </>
          )}
          <p className="note" style={{ textAlign: "center", marginTop: "1.2rem" }}>
            {mode === "forgot" ? (
              <button className="lnk" onClick={() => switchTo("login")}>Back to sign in</button>
            ) : (
              <button className="lnk" onClick={onBack}>Continue as guest</button>
            )}
          </p>
          <p className="note" style={{ textAlign: "center" }}>Demo sign-in: any valid email and a password of 6+ characters works. Connect a real backend before going live.</p>
        </div>
      </section>
    </main>
  );
}

const galUrl = (p, k) => (p.images && p.images[k]) || (k === 0 && p.image ? p.image : localImg(p, k));

const CAT_DESC = {
  Audio: "Rich, balanced sound with deep bass and clear vocals. Built for long listening sessions with a comfortable fit and reliable wireless pairing.",
  Wearables: "A lightweight, durable wearable that keeps you on time and on track. Sharp display, all-day comfort and a strap that suits any outfit.",
  Fashion: "Carefully finished with quality materials and a clean, modern cut. Made to look good on day one and hold up through daily wear.",
  Cameras: "Capture sharp, detailed photos and video in any light. Intuitive controls make it easy to shoot like a pro from the first day.",
  Gaming: "Responsive, precise and built for long sessions. Plug in, play, and feel the difference in every move.",
  Home: "Designed to make your space more comfortable and more useful. Solid build quality with a finish that fits any room.",
  Tech: "Fast, reliable and designed for everyday work and play. A crisp display, strong battery and a premium build you will notice.",
};
const CAT_SPECS = {
  Audio: [["Connectivity", "Bluetooth 5.3 / wired"], ["Battery", "Up to 30 hours"], ["Charging", "USB-C fast charge"]],
  Wearables: [["Water resistance", "5 ATM"], ["Battery", "Up to 7 days"], ["Compatibility", "Android and iOS"]],
  Fashion: [["Material", "Premium blend"], ["Care", "Wipe or gentle wash"], ["Fit", "True to size"]],
  Cameras: [["Video", "4K at 30 fps"], ["Battery", "Up to 400 shots"], ["Storage", "SD card slot"]],
  Gaming: [["Connection", "Wireless 2.4 GHz / USB-C"], ["Compatibility", "PC and console"], ["Battery", "Up to 40 hours"]],
  Home: [["Material", "Metal and engineered wood"], ["Power", "Standard 220V"], ["Assembly", "Simple, tools included"]],
  Tech: [["Display", "High resolution, anti-glare"], ["Battery", "All-day use"], ["Ports", "USB-C, headphone jack"]],
};
const REVIEWS = [
  ["Rafi Ahmed", 5, "Exactly as described and delivered in two days. Quality is better than I expected for the price."],
  ["Nusrat Jahan", 4, "Looks premium and works well. Packaging was neat. Would buy again."],
  ["Tanvir Hasan", 5, "Great value. Customer support answered my questions quickly before I ordered."],
];

function Stars({ n, size = 14 }) {
  return <span className="stars">{[1, 2, 3, 4, 5].map((i) => <span key={i} style={{ opacity: i <= Math.round(n) ? 1 : 0.25 }}><Icon name="star" size={size} fill /></span>)}</span>;
}

function ProductPage({ p, all, wish, toggleWish, add, onBack, onOpen, onBuy }) {
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [tab, setTab] = useState("desc");
  useEffect(() => { setQty(1); setImg(0); setTab("desc"); }, [p.id]);
  const sale = p.tag === "Sale";
  const left = p.id % 4 === 0 ? 4 : null;
  const related = [...all.filter((x) => x.cat === p.cat && x.id !== p.id), ...all.filter((x) => x.cat !== p.cat && x.id !== p.id)].slice(0, 4);
  const saved = wish.includes(p.id);

  return (
    <main className="wrap pdp">
      <nav className="crumb" aria-label="Breadcrumb">
        <button onClick={onBack}><Icon name="arrowLeft" size={16} /> Back to shop</button>
        <span>/ {p.cat}</span>
      </nav>

      <div className="pdp-grid">
        <div className="gallery">
          <div className="g-main">
            <span className="g-fb"><Icon name={CAT_ICON[p.cat]} size={72} sw={1.1} /></span>
            <img key={img + "-" + p.id} src={galUrl(p, img)} alt={p.name} onError={fb(p, 800, 800, img)} />
            {p.tag && <span className="tag">{p.tag}</span>}
          </div>
          <div className="g-thumbs">
            {[0, 1, 2, 3].map((k) => (
              <button key={k} className={k === img ? "on" : ""} aria-label={`Photo ${k + 1}`} onClick={() => setImg(k)}>
                <img src={galUrl(p, k)} alt="" onError={fb(p, 200, 200, k)} />
              </button>
            ))}
          </div>
        </div>

        <div className="info">
          <span className="pcat">{p.cat}</span>
          <h1>{p.name}</h1>
          <div className="rrow"><Stars n={p.rating} size={16} /><b>{p.rating}</b><span>({40 + p.id * 7} reviews)</span></div>
          <div className="pp">
            <strong>{money(p.price)}</strong>
            {sale && <s>{money(Math.round(p.price * 1.25))}</s>}
            {sale && <em>Save 20%</em>}
          </div>
          <p className="stock"><Icon name="check" size={16} sw={2.2} /> {left ? `Only ${left} left in stock` : "In stock, ready to ship"}</p>
          <p className="lead">{CAT_DESC[p.cat]}</p>

          <div className="buyrow">
            <div className="qty big-qty">
              <button aria-label="Decrease quantity" onClick={() => setQty(Math.max(1, qty - 1))}><Icon name="minus" size={16} /></button>
              <span>{qty}</span>
              <button aria-label="Increase quantity" onClick={() => setQty(Math.min(10, qty + 1))}><Icon name="plus" size={16} /></button>
            </div>
            <button className="btn btn-primary grow" onClick={() => add(p, qty)}>Add to cart · {money(p.price * qty)}</button>
            <button className={`icon-btn wishbtn ${saved ? "on" : ""}`} aria-label="Save to wishlist" aria-pressed={saved} onClick={() => toggleWish(p.id)}><Icon name="heart" size={20} fill={saved} /></button>
          </div>
          <button className="btn btn-ghost buy" onClick={() => onBuy(p, qty)}>Buy it now</button>

          <ul className="assure">
            <li><Icon name="truck" size={20} /><div><b>Free delivery over ৳5,000</b><span>Dhaka 1 to 2 days, outside Dhaka 3 to 5 days</span></div></li>
            <li><Icon name="undo" size={20} /><div><b>30-day easy returns</b><span>No questions asked</span></div></li>
            <li><Icon name="shield" size={20} /><div><b>1-year warranty</b><span>Genuine product guarantee</span></div></li>
          </ul>
        </div>
      </div>

      <section className="tabs-wrap">
        <div className="ptabs" role="tablist">
          {[["desc", "Description"], ["spec", "Specifications"], ["rev", "Reviews"]].map(([k, l]) => (
            <button key={k} className={tab === k ? "on" : ""} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
        <div className="tab-body">
          {tab === "desc" && <p>{CAT_DESC[p.cat]} The {p.name} comes in retail packaging with all accessories and a printed quick-start guide. Every order is checked before it leaves our warehouse.</p>}
          {tab === "spec" && (
            <dl className="specs">
              {[["Model", p.name], ["Category", p.cat], ...CAT_SPECS[p.cat], ["Warranty", "1 year"]].map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
            </dl>
          )}
          {tab === "rev" && (
            <div className="revs">
              {REVIEWS.map(([n, r, t]) => (
                <article key={n}><div className="av">{n[0]}</div><div><b>{n}</b><Stars n={r} size={13} /><p>{t}</p></div></article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="rel-h">You may also like</h2>
        <div className="grid rel">
          {related.map((x) => (
            <button key={x.id} className="product rcard" onClick={() => onOpen(x)}>
              <div className="thumb" style={{ background: "var(--surface2)" }}>
                <span style={{ position: "relative", zIndex: 0, color: "var(--muted)" }}><Icon name={CAT_ICON[x.cat]} size={44} sw={1.2} /></span>
                <img className="pimg" src={imgUrl(x)} alt={x.name} loading="lazy" onError={fb(x)} />
              </div>
              <div className="pbody"><h3>{x.name}</h3><span className="price">{money(x.price)}</span></div>
            </button>
          ))}
        </div>
      </section>

      <div className="pdp-bar">
        <div><span>{p.name}</span><b>{money(p.price * qty)}</b></div>
        <button className="btn btn-primary" onClick={() => add(p, qty)}>Add to cart</button>
      </div>
    </main>
  );
}

export default function App() {
  const [cat, setCat] = useState("All");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState("");
  const [wish, setWish] = useState([]);
  const [view, setView] = useState(() => (typeof window !== "undefined" && (window.location.hash === "#admin" || window.location.pathname === "/admin") ? "admin" : "shop"));
  useEffect(() => {
    const go = () => { if (window.location.hash === "#admin" || window.location.pathname === "/admin") { setView("admin"); window.scrollTo(0, 0); } };
    window.addEventListener("hashchange", go);
    window.addEventListener("popstate", go);
    return () => { window.removeEventListener("hashchange", go); window.removeEventListener("popstate", go); };
  }, []);
  const [si, setSi] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = (d) => setSi((i) => (i + d + SLIDES.length) % SLIDES.length);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setSi((i) => (i + 1) % SLIDES.length), 6500);
    return () => clearInterval(t);
  }, [paused, si]);
  const [pid, setPid] = useState(null);
  const openProduct = (p) => { setPid(p.id); setView("product"); window.scrollTo(0, 0); };
  const sl = SLIDES[si];
  const [acct, setAcct] = useState(false);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("everstyle_user")) || null; } catch { return null; }
  });
  const signIn = (u) => {
    setUser(u);
    try { localStorage.setItem("everstyle_user", JSON.stringify(u)); } catch {}
    setView("shop");
    window.scrollTo(0, 0);
    setToast(`Welcome, ${u.name}`);
  };
  const signOut = () => {
    setUser(null);
    setAcct(false);
    try { localStorage.removeItem("everstyle_user"); } catch {}
    setToast("Signed out");
  };
  const navClick = (e) => {
    const a = e.target.closest("a");
    const h = a && a.getAttribute("href");
    if (!h || h[0] !== "#") return;
    e.preventDefault();
    if (h === "#admin") { setView("admin"); window.scrollTo(0, 0); return; }
    setView("shop");
    setTimeout(() => (h === "#top" ? window.scrollTo({ top: 0, behavior: "smooth" }) : document.querySelector(h)?.scrollIntoView({ behavior: "smooth" })), 40);
  };
  const [sort, setSort] = useState("featured");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const list = useMemo(() => {
    const r = PRODUCTS.filter(
      (p) =>
        (cat === "All" || p.cat === cat) &&
        p.name.toLowerCase().includes(query.trim().toLowerCase())
    );
    if (sort === "low") r.sort((a, b) => a.price - b.price);
    if (sort === "high") r.sort((a, b) => b.price - a.price);
    if (sort === "rating") r.sort((a, b) => b.rating - a.rating);
    return r;
  }, [cat, query, sort]);
  const toggleWish = (id) =>
    setWish((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));

  const count = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = cart.reduce((s, i) => s + i.qty * i.price, 0);
  const shipping = subtotal > 5000 || subtotal === 0 ? 0 : 100;

  const add = (p, q = 1) => {
    setCart((c) =>
      c.find((i) => i.id === p.id)
        ? c.map((i) => (i.id === p.id ? { ...i, qty: i.qty + q } : i))
        : [...c, { ...p, qty: q }]
    );
    setToast(`Added to cart: ${p.name}`);
  };
  const change = (id, d) =>
    setCart((c) =>
      c.map((i) => (i.id === id ? { ...i, qty: i.qty + d } : i)).filter((i) => i.qty > 0)
    );
  const remove = (id) => setCart((c) => c.filter((i) => i.id !== id));

  return (
    <>
      <style>{css}</style>

      <header className="nav" onClick={navClick}>
        <div className="wrap">
          <a href="#top" className="brand">Ever Style</a>
          <nav className="links" aria-label="Main">
            <a href="#shop">Shop</a>
            <a href="#deals">Deals</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="actions">
            <div className="acct">
              {user ? (
                <>
                  <button className="icon-btn avatar" aria-label="Account" aria-expanded={acct} onClick={() => setAcct(!acct)}>
                    {user.name.charAt(0).toUpperCase()}
                  </button>
                  {acct && (
                    <div className="acct-menu">
                      <b>{user.name}</b>
                      <span>{user.email}</span>
                      <button onClick={signOut}>Sign out</button>
                    </div>
                  )}
                </>
              ) : (
                <button className="icon-btn" aria-label="Sign in" onClick={() => { setView("login"); setMenu(false); window.scrollTo(0, 0); }}><Icon name="user" size={20} /></button>
              )}
            </div>
            <button className="icon-btn" aria-label="Open cart" onClick={() => setOpen(true)}>
              <Icon name="bag" size={20} />{count > 0 && <span className="badge">{count}</span>}
            </button>
            <button className="icon-btn burger" aria-label="Toggle menu" onClick={() => setMenu(!menu)}>
              <Icon name={menu ? "x" : "menu"} size={20} />
            </button>
          </div>
        </div>
        <div className={`mobile-menu ${menu ? "open" : ""}`} onClick={() => setMenu(false)}>
          <a href="#shop">Shop</a>
          <a href="#deals">Deals</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </div>
      </header>

      {view === "product" && PRODUCTS.find((x) => x.id === pid) ? (
        <ProductPage
          p={PRODUCTS.find((x) => x.id === pid)}
          all={PRODUCTS}
          wish={wish}
          toggleWish={toggleWish}
          add={add}
          onBack={() => { setView("shop"); setTimeout(() => document.querySelector("#shop")?.scrollIntoView(), 30); }}
          onOpen={openProduct}
          onBuy={(p, q) => { add(p, q); setView("checkout"); window.scrollTo(0, 0); }}
        />
      ) : view === "admin" ? (
        <Admin products={PRODUCTS} cats={CATS} onBack={() => { try { window.history.replaceState(null, "", "/"); } catch {} setView("shop"); window.scrollTo(0, 0); }} />
      ) : view === "login" ? (
        <AuthPage onAuth={signIn} onBack={() => { setView("shop"); window.scrollTo(0, 0); }} />
      ) : view === "checkout" ? (
        <CheckoutPage user={user} cart={cart} onBack={() => { setView("shop"); window.scrollTo(0, 0); }} onPlaced={() => setCart([])} />
      ) : (
      <main id="top">
        <section className="hero">
          <div className="wrap">
            <div className="hero-card" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
              {SLIDES.map((x, i) => (
                <img key={i} className={`hero-bg ${i === si ? "on" : ""}`} src={x.image} alt="" loading={i === 0 ? "eager" : "lazy"} onError={hide} />
              ))}
              <div className="hero-shade" />

              <div className="hero-copy">
                <h1 key={"h" + si} className="rise">
                  <span className="out">{sl.l1}</span>
                  {sl.l2}
                </h1>
                <p key={"p" + si} className="rise">{sl.text}</p>
                <div className="cta-row">
                  <button className="btn btn-primary" onClick={() => { setCat(sl.cat); document.querySelector("#shop")?.scrollIntoView({ behavior: "smooth" }); }}>{sl.cta}</button>
                  <a href="#deals" className="btn btn-ghost">See deals</a>
                </div>
                <div className="stats">
                  <div><b>48k+</b><span>Happy customers</span></div>
                  <div><b>1,200</b><span>Products</span></div>
                  <div><b className="rt">4.8 <Icon name="star" size={16} fill /></b><span>Average rating</span></div>
                </div>
              </div>

              <div className="hero-ctrl">
                <div className="dots" role="tablist" aria-label="Slides">
                  {SLIDES.map((_, i) => (
                    <button key={i} className={i === si ? "on" : ""} aria-label={`Slide ${i + 1}`} aria-selected={i === si} onClick={() => setSi(i)} />
                  ))}
                </div>
                <button className="arrow" aria-label="Previous slide" onClick={() => go(-1)}><Icon name="arrowLeft" size={20} /></button>
                <button className="arrow" aria-label="Next slide" onClick={() => go(1)}><Icon name="arrowRight" size={20} /></button>
              </div>
            </div>
          </div>
        </section>

        <div className="wrap">
          <section id="shop">
            <div className="sec-head">
              <h2>Shop all products</h2>
              <div className="tools">
                <input
                  className="search"
                  type="search"
                  placeholder="Search products"
                  aria-label="Search products"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <select className="sort" aria-label="Sort products" value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="featured">Featured</option>
                  <option value="low">Price: low to high</option>
                  <option value="high">Price: high to low</option>
                  <option value="rating">Top rated</option>
                </select>
              </div>
            </div>
            <div className="filters" role="tablist" aria-label="Categories" style={{ marginBottom: "1.4rem" }}>
              {CATS.map((c) => (
                <button key={c} className={`pill ${cat === c ? "on" : ""}`} onClick={() => setCat(c)}>
                  {c}
                </button>
              ))}
            </div>

            <div className="grid">
              {list.length === 0 && (
                <div className="empty">No products match your search. Try another word or category.</div>
              )}
              {list.map((p) => (
                <article className="product" key={p.id}>
                  <div className="thumb" style={{ background: "var(--surface2)", cursor: "pointer" }} onClick={() => openProduct(p)}>
                    {p.tag && <span className="tag">{p.tag}</span>}
                    <button
                      className={`heart ${wish.includes(p.id) ? "on" : ""}`}
                      aria-label="Save to wishlist"
                      aria-pressed={wish.includes(p.id)}
                      onClick={(e) => { e.stopPropagation(); toggleWish(p.id); }}
                    >
                      <Icon name="heart" size={18} fill={wish.includes(p.id)} />
                    </button>
                    <span style={{ position: "relative", zIndex: 0, color: "var(--muted)" }}><Icon name={CAT_ICON[p.cat]} size={52} sw={1.2} /></span>
                    <img className="pimg" src={imgUrl(p)} alt={p.name} loading="lazy" onError={fb(p)} />
                  </div>
                  <div className="pbody">
                    <span className="pcat">{p.cat}</span>
                    <h3><button className="plink" onClick={() => openProduct(p)}>{p.name}</button></h3>
                    <span className="rate"><Icon name="star" size={14} fill /> {p.rating}</span>
                    <div className="pfoot">
                      <span>
                        {p.tag === "Sale" && <span className="old">{money(Math.round(p.price * 1.25))}</span>}
                        <span className="price">{money(p.price)}</span>
                      </span>
                      <button className="add" onClick={() => add(p)}>Add to cart</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="perks" id="about">
            {[
              ["truck", "Free delivery", "On orders over ৳5,000"],
              ["undo", "Easy returns", "30 days, no questions"],
              ["shield", "Secure checkout", "Encrypted payments"],
              ["headset", "Real support", "Replies within an hour"],
            ].map(([e, t, s]) => (
              <div className="perk" key={t}>
                <em><Icon name={e} size={22} /></em>
                <div><b>{t}</b><span>{s}</span></div>
              </div>
            ))}
          </div>

          <section className="banner" id="deals">
            <div>
              <h2>Get 15% off your first order</h2>
              <p>Join the list for early access to drops and member-only deals.</p>
            </div>
            <form className="news" onSubmit={(e) => { e.preventDefault(); setToast("You're subscribed"); e.target.reset(); }}>
              <input type="email" required placeholder="Your email address" aria-label="Email address" />
              <button type="submit">Subscribe</button>
            </form>
          </section>
        </div>
      </main>
      )}

      <footer id="contact" onClick={navClick}>
        <div className="wrap">
          <div className="fgrid">
            <div>
              <a href="#top" className="brand" style={{ color: "var(--text)" }}>Ever Style</a>
              <p style={{ marginTop: ".8rem", maxWidth: "32ch" }}>Considered tech and fashion, delivered to your door.</p>
            </div>
            <div><h4>Shop</h4><a href="#shop">Audio</a><a href="#shop">Wearables</a><a href="#shop">Fashion</a></div>
            <div><h4>Help</h4><a href="#contact">Shipping</a><a href="#contact">Returns</a><a href="#contact">Track order</a></div>
            <div><h4>Company</h4><a href="#about">About us</a><a href="#contact">Careers</a><a href="#contact">hello@everstyle.store</a><a href="#admin">Admin</a></div>
          </div>
          <div className="copy"><span>© 2026 Ever Style. All rights reserved.</span><span>Privacy · Terms</span></div>
        </div>
      </footer>

      <div className={`overlay ${open ? "open" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`drawer ${open ? "open" : ""}`} aria-label="Shopping cart" aria-hidden={!open}>
        <div className="dhead">
          <h3>Your cart ({count})</h3>
          <button className="icon-btn" aria-label="Close cart" onClick={() => setOpen(false)}><Icon name="x" size={18} /></button>
        </div>
        <div className="items">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <span><Icon name="bag" size={46} sw={1.2} /></span>
              Your cart is empty.<br />Add a product to get started.
            </div>
          ) : (
            cart.map((i) => (
              <div className="item" key={i.id}>
                <div className="mini" style={{ background: "var(--surface2)", position: "relative", overflow: "hidden" }}>
                  <Icon name={CAT_ICON[i.cat]} size={22} />
                  <img className="pimg" src={imgUrl(i)} alt="" onError={fb(i, 128, 128)} />
                </div>
                <div>
                  <b>{i.name}</b>
                  <div className="qty">
                    <button aria-label="Decrease quantity" onClick={() => change(i.id, -1)}><Icon name="minus" size={14} /></button>
                    {i.qty}
                    <button aria-label="Increase quantity" onClick={() => change(i.id, 1)}><Icon name="plus" size={14} /></button>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <b>{money(i.price * i.qty)}</b>
                  <button className="rm" onClick={() => remove(i.id)}>Remove</button>
                </div>
              </div>
            ))
          )}
        </div>
        {cart.length > 0 && (
          <div className="dfoot">
            <div className="row"><span>Subtotal</span><span>{money(subtotal)}</span></div>
            <div className="row"><span>Shipping</span><span>{shipping === 0 ? "Free" : money(shipping)}</span></div>
            <div className="row total"><span>Total</span><span>{money(subtotal + shipping)}</span></div>
            <button className="btn btn-primary" onClick={() => { setOpen(false); setView("checkout"); window.scrollTo(0, 0); }}>Checkout</button>
          </div>
        )}
      </aside>

      <div className={`toast ${toast ? "show" : ""}`} role="status">{toast}</div>
    </>
  );
}
