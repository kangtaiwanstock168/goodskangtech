// 📖 漫畫讀經匿名統計：POST 收事件、GET 給後台 /bible/stats/ 看
// 只存次數與隨機讀者代碼，不存任何個資。資料放在 Netlify Blobs（store: bible-stats，每天一個 key）。
import { getStore } from "@netlify/blobs";

const BOOKS = new Set(["genesis","exodus","leviticus","numbers","deuteronomy","joshua","judges","ruth","samuel1","samuel2","kings1","kings2","chronicles1","chronicles2","ezra","nehemiah","esther","daniel","mark"]);
const ACTS = new Set(["copy","share","hl","note","pray"]);
const day = (t = Date.now()) => new Date(t + 8 * 3600e3).toISOString().slice(0, 10);
const J = (o, s = 200, cache = "no-store") => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json; charset=utf-8", "cache-control": cache } });

function addEvents(D, b, r, ev) {
  D.u = D.u || {}; D.b = D.b || {}; D.v = D.v || {};
  const B = (D.b[b] = D.b[b] || {});
  for (const e of ev) {
    if (!Array.isArray(e)) continue;
    const [t, n0, x, y] = e, n = +n0;
    if (!(n >= 1 && n <= 150)) continue;
    D.u[r] = 1;
    const C = (B[n] = B[n] || {});
    if (t === "o" || t === "d" || t === "x" || t === "g") {
      C[t] = (C[t] || 0) + 1;
      if (t === "o") { C.r = C.r || {}; C.r[r] = 1; }
    } else if (t === "v" && ACTS.has(x)) {
      C.a = C.a || {}; C.a[x] = (C.a[x] || 0) + 1;
      const vs = String(y || "").split(",").map(Number).filter(v => v >= 1 && v <= 200).slice(0, 30);
      for (const v of vs) { const k = b + ":" + n + ":" + v; const V = (D.v[k] = D.v[k] || {}); V[x] = (V[x] || 0) + 1; }
    }
  }
}

export default async (req) => {
  const store = getStore({ name: "bible-stats", consistency: "strong" });
  if (req.method === "POST") {
    let p; try { const t = await req.text(); if (t.length > 8000) return J({ ok: 0 }, 413); p = JSON.parse(t); } catch (_) { return J({ ok: 0 }, 400); }
    const b = String(p.b || ""), r = String(p.r || "").replace(/[^a-z0-9]/gi, "").slice(0, 20) || "anon", ev = Array.isArray(p.e) ? p.e.slice(0, 40) : [];
    if (!BOOKS.has(b) || !ev.length) return J({ ok: 0 }, 400);
    const key = "d/" + day();
    for (let i = 0; i < 5; i++) {
      const cur = await store.getWithMetadata(key, { type: "json" });
      const D = (cur && cur.data) || {};
      addEvents(D, b, r, ev);
      const res = cur ? await store.setJSON(key, D, { onlyIfMatch: cur.etag }) : await store.setJSON(key, D, { onlyIfNew: true });
      if (!res || res.modified !== false) return J({ ok: 1 });
      await new Promise(z => setTimeout(z, 40 + Math.random() * 120));
    }
    return J({ ok: 0, busy: 1 }, 503);
  }
  // GET ?days=30（最多 180）
  const url = new URL(req.url), days = Math.min(180, Math.max(1, +url.searchParams.get("days") || 30));
  const keys = []; for (let i = 0; i < days; i++) keys.push("d/" + day(Date.now() - i * 864e5));
  const all = await Promise.all(keys.map(k => store.get(k, { type: "json" }).catch(() => null)));
  const U = new Set(), books = {}, verses = {}, daily = [];
  all.forEach((D, i) => {
    const d = keys[i].slice(2); let o = 0, dn = 0; const du = D ? Object.keys(D.u || {}) : [];
    du.forEach(r => U.add(r));
    if (D) {
      for (const b in D.b || {}) {
        const B = (books[b] = books[b] || { ch: {}, R: new Set() });
        for (const n in D.b[b]) {
          const s = D.b[b][n], C = (B.ch[n] = B.ch[n] || { o: 0, d: 0, g: 0, x: 0, a: {}, R: new Set() });
          C.o += s.o || 0; C.d += s.d || 0; C.g += s.g || 0; C.x += s.x || 0; o += s.o || 0; dn += s.d || 0;
          for (const r in s.r || {}) { C.R.add(r); B.R.add(r); }
          for (const a in s.a || {}) C.a[a] = (C.a[a] || 0) + s.a[a];
        }
      }
      for (const k in D.v || {}) { const V = (verses[k] = verses[k] || {}); for (const a in D.v[k]) V[a] = (V[a] || 0) + D.v[k][a]; }
    }
    daily.push({ d, u: du.length, o, dn });
  });
  const outB = {};
  for (const b in books) { const B = books[b]; outB[b] = { readers: B.R.size, ch: {} }; for (const n in B.ch) { const C = B.ch[n]; outB[b].ch[n] = { o: C.o, d: C.d, g: C.g, x: C.x, a: C.a, readers: C.R.size }; } }
  const topV = Object.entries(verses).map(([k, a]) => ({ k, a, t: Object.values(a).reduce((x, y) => x + y, 0) })).sort((p, q) => q.t - p.t).slice(0, 40);
  return J({ days, from: keys[keys.length - 1].slice(2), to: keys[0].slice(2), readers: U.size, books: outB, verses: topV, daily: daily.reverse() }, 200, "public, max-age=60");
};

export const config = { path: "/api/bstat" };
