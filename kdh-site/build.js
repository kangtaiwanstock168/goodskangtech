'use strict';
// 金達華實業 KDH PACK 官網建站腳本(零相依,Node 18+)
// 產出 dist/:首頁、產品與機型、包裝影片、機台照片、關於、聯絡、最新消息、英文精簡版、sitemap/robots/llms.txt
// 建站時:1) 抓 YouTube 頻道 RSS 補新影片(抓不到用 content/cache) 2) 圖片第一次從舊站下載並寫回 GitHub content/img,之後直接用 repo 裡的檔案
const fs = require('fs'), path = require('path');
const ROOT = __dirname, DIST = path.join(ROOT, 'dist'), C = path.join(ROOT, 'content');
const J = f => JSON.parse(fs.readFileSync(path.join(C, f), 'utf8'));
const site = J('site.json'), products = J('products.json'), images = J('images.json'), news = J('news.json');
const BUILT = new Date();
const TZ = d => new Date(new Date(d).getTime() + 8 * 3600e3);
const ymd = d => { const t = TZ(d); return isNaN(t.getTime()) ? '' : t.toISOString().slice(0, 10); };
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const attr = esc;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
const fetchBuf = async (url, ms = 15000) => {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
  try{ const r = await fetch(url, {signal: ctl.signal, headers: {'user-agent': UA}}); if(!r.ok) throw new Error('HTTP ' + r.status); return Buffer.from(await r.arrayBuffer()); }
  finally{ clearTimeout(t); }
};
const fetchText = async (url, ms) => (await fetchBuf(url, ms)).toString('utf8');
const readCache = f => { try{ return JSON.parse(fs.readFileSync(path.join(C, 'cache', f), 'utf8')); }catch(e){ return null; } };
const writeCache = (f, v) => { try{ fs.mkdirSync(path.join(C, 'cache'), {recursive: true}); fs.writeFileSync(path.join(C, 'cache', f), JSON.stringify(v)); }catch(e){} };

// —— 寫回 GitHub(需 Netlify 環境變數 GITHUB_TOKEN、GITHUB_REPO,與 goodskang 站共用)——
async function pushFile(rel, buf, msg){
  const TOKEN = process.env.GITHUB_TOKEN, REPO = process.env.GITHUB_REPO, BR = process.env.GITHUB_BRANCH || 'main', BASE = (process.env.GITHUB_BASE || 'kdh-site').replace(/^\/|\/$/g, '');
  if(!TOKEN || !REPO) return false;
  const full = `${BASE}/${rel}`;
  const h = {authorization: `Bearer ${TOKEN}`, accept: 'application/vnd.github+json', 'user-agent': 'kdh-build', 'content-type': 'application/json'};
  try{
    const cur = await fetch(`https://api.github.com/repos/${REPO}/contents/${full}?ref=${BR}`, {headers: h}).then(r => r.ok ? r.json() : null).catch(() => null);
    const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${full}`, {method: 'PUT', headers: h, body: JSON.stringify({message: `${msg || 'cache: ' + rel} [skip netlify]`, branch: BR, content: buf.toString('base64'), sha: cur ? cur.sha : undefined})});
    console.log('[github] 寫回', rel, r.status); return r.ok;
  }catch(e){ console.warn('[github] 寫回失敗:', rel, e.message); return false; }
}

// —— 圖片:repo 有就用 repo 的;沒有就從舊站抓一次並寫回 repo ——
const IMG = {};   // 舊站相對路徑 → 站上網址
async function loadImages(){
  const all = [...images.hero, ...images.about_banner, ...images.video_banner, images.logo, images.company, ...images.gallery];
  fs.mkdirSync(path.join(DIST, 'img'), {recursive: true});
  for(const p of all){
    const name = path.basename(p); const local = path.join(C, 'img', name);
    if(fs.existsSync(local)){ fs.copyFileSync(local, path.join(DIST, 'img', name)); IMG[p] = '/img/' + name; continue; }
    try{
      const buf = await fetchBuf(site.old_site_upload + p); if(buf.length < 500) throw new Error('太小');
      fs.mkdirSync(path.join(C, 'img'), {recursive: true}); fs.writeFileSync(local, buf); fs.writeFileSync(path.join(DIST, 'img', name), buf);
      IMG[p] = '/img/' + name; console.log('[img] 下載', name, buf.length);
      await pushFile('content/img/' + name, buf, 'img: ' + name);
    }catch(e){ console.warn('[img] 抓不到', p, e.message); IMG[p] = site.old_site_upload + p; }
  }
}
const img = p => IMG[p] || (site.old_site_upload + p);
// Netlify Image CDN:站上的圖片依需要縮圖壓縮(本機預覽時直接用原圖)
const imgx = (p, w = 1400) => { const u = img(p); return (u.startsWith('/') && process.env.NETLIFY) ? `/.netlify/images?url=${encodeURIComponent(u)}&w=${w}&q=78` : u; };

// —— 影片:頻道 RSS + oEmbed 補標題 + 快取 ——
async function loadVideos(){
  const cache = readCache('videos.json') || {};
  try{
    const x = await fetchText(`https://www.youtube.com/feeds/videos.xml?channel_id=${site.youtube_channel_id}`, 12000);
    const ids = [...x.matchAll(/<yt:videoId>([^<]+)<\/yt:videoId>/g)].map(m => m[1]);
    const titles = [...x.matchAll(/<media:title>([^<]*)<\/media:title>/g)].map(m => m[1]);
    const dates = [...x.matchAll(/<published>([^<]+)<\/published>/g)].map(m => m[1]);
    ids.forEach((id, i) => { cache[id] = Object.assign(cache[id] || {}, {title: titles[i] || cache[id]?.title || '', published: dates[i] || cache[id]?.published || ''}); });
    console.log('[videos] RSS 抓到', ids.length, '支');
  }catch(e){ console.warn('[videos] RSS 失敗,用快取:', e.message); }
  const wanted = new Set(products.flatMap(p => p.videos));
  for(const id of wanted){
    if(cache[id] && cache[id].title) continue;
    try{ const o = JSON.parse(await fetchText(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`, 10000)); cache[id] = Object.assign(cache[id] || {}, {title: o.title || id}); }
    catch(e){ cache[id] = cache[id] || {title: id}; }
  }
  writeCache('videos.json', cache);
  await pushFile('content/cache/videos.json', Buffer.from(JSON.stringify(cache)), 'cache: videos');
  return cache;
}
const ytThumb = id => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
const ytEmbed = (id, title) => `<div class="yt"><iframe src="https://www.youtube-nocookie.com/embed/${attr(id)}?rel=0" title="${attr(title || '')}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
// 自家拍的短片(放 static/video/,非 YouTube):直式 9:16,用 <video> 播
const clipEmbed = c => `<div class="clip"><video controls playsinline preload="metadata" poster="${attr(c.poster)}" src="${attr(c.src)}" title="${attr(c.title)}"></video></div>`;
const clipsOf = p => (p.clips || []).map((c, i) => `<div id="clip-${attr(p.id)}-${i}">${clipEmbed(c)}<h4>${esc(c.title)}</h4></div>`).join('');
const copyDir = (from, to) => { if(!fs.existsSync(from)) return; fs.mkdirSync(to, {recursive: true}); for(const f of fs.readdirSync(from)){ const a = path.join(from, f), b = path.join(to, f); fs.statSync(a).isDirectory() ? copyDir(a, b) : fs.copyFileSync(a, b); } };
const vCard = (id, v, lazy = true) => `<a class="vcard" href="/videos.html#${attr(id)}"><img src="${ytThumb(id)}" alt="${attr(v.title || '')}" loading="lazy" width="480" height="360"><span>${esc(v.title || id)}</span></a>`;

// —— 版型 ——
const ICONS = {
  bread: '<svg viewBox="0 0 24 24"><path d="M4 11a4 4 0 0 1 4-4h8a4 4 0 0 1 1 7.9V19H7v-4.1A4 4 0 0 1 4 11z"/><path d="M7 15h10"/></svg>',
  candy: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M8 10 3 7v10l5-3M16 10l5-3v10l-5-3"/></svg>',
  cards: '<svg viewBox="0 0 24 24"><rect x="3" y="7" width="14" height="10" rx="2"/><path d="M7 4h14v10M3 12h14"/></svg>',
  tissue: '<svg viewBox="0 0 24 24"><rect x="3" y="9" width="18" height="11" rx="2"/><path d="M8 9c2-3 6-3 8 0M9 20v-5h6v5"/></svg>',
  tools: '<svg viewBox="0 0 24 24"><path d="M14 7a4 4 0 0 1 5.6 3.6L9 21l-3-3L16.4 7.4A4 4 0 0 1 14 7z"/><path d="M3 21l3-3"/></svg>',
  phone: '<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
  mail: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  pin: '<svg viewBox="0 0 24 24"><path d="M12 21s7-6.5 7-11a7 7 0 0 0-14 0c0 4.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  chat: '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4V5z"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>'
};
const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
// 產品卡片頂端的影片縮圖(第一支影片),點了到影片頁
const thumb = p => p.clips && p.clips[0] ? `<a class="cthumb" href="/videos.html#clip-${attr(p.id)}-0" aria-label="${attr(p.name)} 包裝影片"><img src="${attr(p.clips[0].poster)}" alt="${attr(p.clips[0].title)}" loading="lazy" width="480" height="360"><span class="play">${PLAY}</span></a>` : p.videos && p.videos[0] ? `<a class="cthumb" href="/videos.html#${attr(p.videos[0])}" aria-label="${attr(p.name)} 包裝影片"><img src="${ytThumb(p.videos[0])}" alt="${attr(p.name)} 包裝影片" loading="lazy" width="480" height="360"><span class="play">${PLAY}</span></a>` : '';
const ico = n => `<i class="ico" aria-hidden="true">${ICONS[n] || ''}</i>`;

const CSS = `
:root{--navy:#0B2A4A;--navy2:#133B66;--red:#C8102E;--ink:#1B2430;--muted:#5B6675;--line:#E3E8EF;--bg:#F4F6F9;--card:#fff}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;font-family:"Noto Sans TC",-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang TC","Microsoft JhengHei",sans-serif;color:var(--ink);background:#fff;line-height:1.7;font-size:16px}
a{color:var(--navy2);text-decoration:none}a:hover{text-decoration:underline}
img{max-width:100%;height:auto;display:block}
.wrap{max-width:1120px;margin:0 auto;padding:0 20px}
header{position:sticky;top:0;z-index:20;background:#fff;border-bottom:1px solid var(--line)}
.top{display:flex;align-items:center;justify-content:space-between;height:68px;gap:12px;min-width:0}
.logo{display:flex;align-items:center;gap:10px;font-weight:700;color:var(--navy);font-size:1.02rem;white-space:nowrap;min-width:0;overflow:hidden}
.logo img{height:38px;width:auto;max-width:130px;object-fit:contain}
.logo small{display:block;font-size:.7rem;font-weight:500;color:var(--muted);letter-spacing:.06em}
nav{display:flex;gap:4px;align-items:center}
nav a{padding:8px 9px;border-radius:8px;color:var(--ink);font-weight:500;white-space:nowrap;font-size:.95rem}
nav a:hover,nav a.cur{background:var(--bg);text-decoration:none;color:var(--navy)}
nav a.tel{background:var(--red);color:#fff;font-weight:700}nav a.tel:hover{background:#A60D26;color:#fff}
.menu{display:none;background:none;border:1px solid var(--line);border-radius:8px;padding:8px 10px;font-size:1rem}
.hero{position:relative;color:#fff;background:var(--navy) center/cover no-repeat;min-height:460px;display:flex;align-items:center}
.hero::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(11,42,74,.92) 0%,rgba(11,42,74,.75) 55%,rgba(11,42,74,.35) 100%)}
.hero .wrap{position:relative;padding:56px 20px}
.hero h1{font-size:clamp(1.7rem,4.2vw,2.8rem);line-height:1.25;margin:0 0 14px;letter-spacing:.01em}
.hero p{font-size:1.1rem;max-width:640px;margin:0 0 26px;color:#DCE6F2}
.btn{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border-radius:10px;font-weight:700;background:var(--red);color:#fff;border:2px solid var(--red)}
.btn:hover{background:#A60D26;border-color:#A60D26;text-decoration:none;color:#fff}
.btn.o{background:transparent;color:#fff;border-color:rgba(255,255,255,.7)}.btn.o:hover{background:rgba(255,255,255,.12)}
.btn.o2{background:#fff;color:var(--navy);border-color:var(--navy)}.btn.o2:hover{background:var(--bg)}
.btns{display:flex;gap:12px;flex-wrap:wrap}
.ico{display:inline-flex;width:1.2em;height:1.2em;vertical-align:-.25em}.ico svg{width:100%;height:100%;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
section{padding:56px 0}section.alt{background:var(--bg)}
.sh{display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin:0 0 24px;flex-wrap:wrap}
.sh h2{font-size:1.6rem;margin:0;padding-left:14px;border-left:5px solid var(--red);line-height:1.2}
.sh p{margin:0;color:var(--muted)}
.grid{display:grid;gap:18px;grid-template-columns:repeat(auto-fill,minmax(250px,1fr))}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:22px;transition:box-shadow .15s}
.card:hover{box-shadow:0 8px 24px rgba(11,42,74,.08)}
.card .ico{width:38px;height:38px;color:var(--red);margin-bottom:10px}
.cthumb{position:relative;display:block;margin:-22px -22px 16px;aspect-ratio:16/9;background:#0A1F36;overflow:hidden;border-radius:14px 14px 0 0}
.cthumb img{width:100%;height:100%;object-fit:cover;transition:transform .25s}.cthumb:hover img{transform:scale(1.04)}
.cthumb .play{position:absolute;left:50%;top:50%;width:58px;height:42px;margin:-21px 0 0 -29px;border-radius:12px;background:var(--red);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(0,0,0,.35)}
.cthumb .play svg{width:26px;height:26px;fill:#fff}
.card h3{margin:0 0 8px;font-size:1.15rem;color:var(--navy)}
.card p{margin:0 0 10px;color:var(--muted);font-size:.95rem}
.card ul{margin:0;padding-left:18px;color:var(--ink);font-size:.93rem}
.card .more{display:inline-block;margin-top:12px;font-weight:700;color:var(--red)}
.pts{display:grid;gap:18px;grid-template-columns:repeat(auto-fill,minmax(280px,1fr))}
.pt{background:#fff;border-radius:14px;padding:24px;border-top:4px solid var(--navy)}
.pt b{display:block;font-size:1.1rem;color:var(--navy);margin-bottom:6px}
.pt p{margin:0;color:var(--ink)}
.vgrid{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(240px,1fr))}
.vcard{display:block;background:#fff;border:1px solid var(--line);border-radius:12px;overflow:hidden;color:var(--ink)}
.vcard:hover{text-decoration:none;box-shadow:0 8px 24px rgba(11,42,74,.1)}
.vcard img{aspect-ratio:4/3;object-fit:cover;width:100%}
.vcard span{display:block;padding:10px 12px;font-size:.92rem;font-weight:500;line-height:1.4}
.yt{position:relative;aspect-ratio:16/9;background:#000;border-radius:12px;overflow:hidden}
.yt iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.clip{aspect-ratio:9/16;max-width:320px;margin:0 auto;background:#000;border-radius:12px;overflow:hidden}.clip video{width:100%;height:100%;object-fit:cover;display:block}
.ytgrid{display:grid;gap:18px;grid-template-columns:repeat(auto-fill,minmax(280px,1fr))}
.ytgrid h4{margin:8px 0 0;font-size:.95rem;font-weight:500}
.prod{display:grid;gap:28px;grid-template-columns:1.1fr 1.6fr;align-items:start;padding:28px 0;border-top:1px solid var(--line)}
.prod:first-of-type{border-top:0}
.prod h3{font-size:1.4rem;color:var(--navy);margin:0 0 8px}
.prod .ico{width:30px;height:30px;color:var(--red)}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 0;padding:0;list-style:none}
.chips li{background:var(--bg);border:1px solid var(--line);border-radius:999px;padding:5px 12px;font-size:.9rem}
.cta{background:var(--navy);color:#fff;border-radius:18px;padding:36px;display:flex;justify-content:space-between;align-items:center;gap:24px;flex-wrap:wrap}
.cta h2{margin:0 0 6px;font-size:1.5rem}.cta p{margin:0;color:#CFDCEB}
.contact{display:grid;gap:28px;grid-template-columns:1fr 1fr}
.clist{list-style:none;padding:0;margin:0;display:grid;gap:12px}
.clist li{display:flex;gap:12px;align-items:flex-start;font-size:1.02rem}
.clist .ico{color:var(--red);width:1.4em;height:1.4em;flex:none;margin-top:3px}
.clist b{display:block;font-size:.8rem;color:var(--muted);font-weight:500}
.map{border:0;width:100%;height:320px;border-radius:14px;background:var(--bg)}
form{display:grid;gap:14px}
label{display:grid;gap:6px;font-weight:500;font-size:.95rem}
input,textarea,select{font:inherit;padding:11px 12px;border:1px solid #C9D2DE;border-radius:10px;background:#fff}
input:focus,textarea:focus{outline:2px solid var(--navy2);border-color:var(--navy2)}
.row2{display:grid;gap:14px;grid-template-columns:1fr 1fr}
.gal{display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}
.gal img{border-radius:12px;aspect-ratio:4/3;object-fit:cover;width:100%;border:1px solid var(--line)}
.news{display:grid;gap:14px}.news article{background:#fff;border:1px solid var(--line);border-radius:12px;padding:18px 20px}
.news time{color:var(--muted);font-size:.9rem}.news h3{margin:4px 0 6px;font-size:1.1rem}
.pagehead{background:var(--navy) center/cover;color:#fff;position:relative}
.pagehead::before{content:"";position:absolute;inset:0;background:rgba(11,42,74,.85)}
.pagehead .wrap{position:relative;padding:48px 20px}.pagehead h1{margin:0 0 6px;font-size:2rem}.pagehead p{margin:0;color:#CFDCEB}
footer{background:#0A1F36;color:#C5D1DE;padding:40px 0 90px;font-size:.92rem}
footer a{color:#fff}.fgrid{display:grid;gap:24px;grid-template-columns:1.2fr 1fr 1fr}
footer h4{color:#fff;margin:0 0 10px;font-size:1rem}footer p{margin:0 0 6px}
.copy{border-top:1px solid rgba(255,255,255,.12);margin-top:24px;padding-top:16px;color:#8FA3B8;font-size:.82rem;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px}
.bar{display:none;position:fixed;left:0;right:0;bottom:0;z-index:30;background:#fff;border-top:1px solid var(--line);padding:8px 10px;gap:8px}
.bar a{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:11px 6px;border-radius:10px;font-weight:700;font-size:.92rem;background:var(--bg);color:var(--navy)}
.bar a.tel{background:var(--red);color:#fff}
.note{background:#FFF7E6;border:1px solid #F3D9A4;border-radius:10px;padding:10px 14px;font-size:.9rem;color:#6B4E00}
.lang{font-size:.85rem;border:1px solid var(--line);border-radius:999px;padding:4px 10px}
@media(max-width:1400px) and (min-width:981px){.logo span{display:none}}
@media(max-width:980px){.logo small{display:none}.prod{grid-template-columns:1fr}.contact{grid-template-columns:1fr}.fgrid{grid-template-columns:1fr}.row2{grid-template-columns:1fr}.logo{font-size:.95rem}
 nav{display:none;position:absolute;left:0;right:0;top:68px;background:#fff;border-bottom:1px solid var(--line);flex-direction:column;align-items:stretch;padding:8px 12px 14px}
 nav.open{display:flex}nav a{padding:12px}nav a.tel{text-align:center}.menu{display:inline-block}.bar{display:flex}.hero{min-height:380px}section{padding:40px 0}}
`;

const NAV = [['/', '首頁'], ['/products.html', '產品與機型'], ['/videos.html', '包裝影片'], ['/gallery.html', '機台照片'], ['/about.html', '關於金達華'], ['/news.html', '最新消息'], ['/contact.html', '聯絡我們']];
const NAV_EN = [['/en/', 'Home'], ['/en/products.html', 'Products'], ['/en/contact.html', 'Contact']];
function page({title, desc, url, body, cur, lang = 'zh-Hant', image, jsonld, headImg}){
  const en = lang === 'en'; const nav = en ? NAV_EN : NAV;
  const alt = en ? `<a class="lang" href="/" hreflang="zh-Hant">中文</a>` : `<a class="lang" href="/en/" hreflang="en">English</a>`;
  const full = site.url + url;
  return `<!doctype html><html lang="${en ? 'en' : 'zh-Hant'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${attr(desc)}"><link rel="canonical" href="${full}">
<link rel="alternate" hreflang="zh-Hant" href="${site.url}${en ? url.replace(/^\/en\/?/, '/') : url}"><link rel="alternate" hreflang="en" href="${site.url}${en ? url : (url === '/' ? '/en/' : '/en' + url)}">
<meta property="og:type" content="website"><meta property="og:title" content="${attr(title)}"><meta property="og:description" content="${attr(desc)}"><meta property="og:url" content="${full}"><meta property="og:image" content="${attr(image || site.url + img(images.hero[0]))}"><meta property="og:site_name" content="${attr(site.name)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<style>${CSS}</style>${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ''}</head>
<body><header><div class="wrap top"><a class="logo" href="${en ? '/en/' : '/'}"><img src="${attr(img(images.logo))}" alt="${attr(site.name)}" width="120" height="40"><span>${en ? esc(site.brand) : esc(site.name)}<small>${en ? esc(site.en) : esc(site.brand) + ' · ' + esc(site.en)}</small></span></a>
<button class="menu" aria-label="選單" onclick="document.querySelector('nav').classList.toggle('open')">☰</button>
<nav>${nav.map(([h, t]) => `<a href="${h}"${h === cur ? ' class="cur"' : ''}>${esc(t)}</a>`).join('')}${alt}<a class="tel" href="tel:${attr(site.tel_intl)}">${ico('phone')} ${esc(site.tel)}</a></nav></div></header>
${headImg ? `<div class="pagehead" style="background-image:url('${attr(headImg)}')"><div class="wrap"><h1>${esc(title.split('|')[0].trim())}</h1><p>${esc(desc)}</p></div></div>` : ''}
<main>${body}</main>
<footer><div class="wrap"><div class="fgrid"><div><h4>${esc(site.name)}</h4><p>${esc(site.en)}</p><p>${en ? esc(site.description_en) : esc(site.description)}</p></div>
<div><h4>${en ? 'Contact' : '聯絡方式'}</h4><p>${en ? 'Tel' : '電話'}:<a href="tel:${attr(site.tel_intl)}">${esc(site.tel)}</a></p><p>${en ? 'Mobile' : '手機'}:<a href="tel:${attr(site.mobile_intl)}">${esc(site.mobile)}</a></p><p>${en ? 'Fax' : '傳真'}:${esc(site.fax)}</p><p>Email:<a href="mailto:${attr(site.email)}">${esc(site.email)}</a></p><p>${en ? esc(site.address_en) : esc(site.address)}</p></div>
<div><h4>${en ? 'Links' : '連結'}</h4><p><a href="${attr(site.facebook)}" target="_blank" rel="noopener">Facebook</a></p><p><a href="${attr(site.youtube)}" target="_blank" rel="noopener">YouTube ${en ? 'channel' : '頻道'}</a></p><p><a href="${en ? '/' : '/en/'}">${en ? '中文版' : 'English'}</a></p></div></div>
<div class="copy"><span>© ${BUILT.getFullYear()} ${esc(site.name)} ${esc(site.en)}</span><span>${esc(site.slogan_en)}</span></div></div></footer>
<div class="bar"><a class="tel" href="tel:${attr(site.tel_intl)}">${ico('phone')} ${en ? 'Call' : '打電話'}</a><a href="mailto:${attr(site.email)}">${ico('mail')} Email</a><a href="${en ? '/en/contact.html' : '/contact.html'}#form">${ico('chat')} ${en ? 'Inquiry' : '線上詢問'}</a></div>
</body></html>`;
}

const orgLd = () => ({'@context': 'https://schema.org', '@type': 'LocalBusiness', name: site.name, alternateName: [site.en, site.brand], url: site.url, telephone: site.tel_intl, email: site.email, address: {'@type': 'PostalAddress', streetAddress: '工業路宏巨巷 66 號', addressLocality: '大里區', addressRegion: '台中市', postalCode: '412', addressCountry: 'TW'}, sameAs: [site.facebook, site.youtube], description: site.description});

async function main(){
  fs.rmSync(DIST, {recursive: true, force: true}); fs.mkdirSync(DIST, {recursive: true});
  copyDir(path.join(ROOT, 'static'), DIST);
  await loadImages();
  const videos = await loadVideos();
  const V = id => videos[id] || {title: id};
  const byDate = Object.entries(videos).filter(([, v]) => v.published).sort((a, b) => String(b[1].published).localeCompare(String(a[1].published)));
  const contactForm = en => `<form name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="${en ? '/en/thanks.html' : '/thanks.html'}" id="form"><input type="hidden" name="form-name" value="contact"><p hidden><label>不要填這格 <input name="bot-field"></label></p>
<div class="row2"><label>${en ? 'Name' : '您的姓名'} <input name="name" required></label><label>${en ? 'Company' : '公司名稱'} <input name="company"></label></div>
<div class="row2"><label>${en ? 'Phone' : '聯絡電話'} <input name="phone" type="tel" required></label><label>Email <input name="email" type="email"></label></div>
<label>${en ? 'What do you want to pack? (product, size, bags per minute)' : '想包什麼產品?(產品名稱、大小、每分鐘希望幾包)'} <textarea name="message" rows="5" required></textarea></label>
<label>${en ? 'Country / City' : '所在縣市'} <input name="city"></label>
<button class="btn" type="submit">${en ? 'Send inquiry' : '送出詢問'}</button><p class="note">${en ? 'We reply by phone or email within one business day. Leave a phone number if you want us to call.' : '我們會在一個工作天內以電話或 Email 回覆;急件請直接撥 ' + esc(site.tel) + ' 或 ' + esc(site.mobile) + '。'}</p></form>`;
  const contactList = en => `<ul class="clist">
<li>${ico('phone')}<span><b>${en ? 'Tel' : '電話'}</b><a href="tel:${attr(site.tel_intl)}">${esc(site.tel)}</a> / <a href="tel:${attr(site.mobile_intl)}">${esc(site.mobile)}</a></span></li>
<li>${ico('mail')}<span><b>Email</b><a href="mailto:${attr(site.email)}">${esc(site.email)}</a></span></li>
<li>${ico('pin')}<span><b>${en ? 'Address' : '地址'}</b><a href="${attr(site.map)}" target="_blank" rel="noopener">${en ? esc(site.address_en) : esc(site.address)}</a></span></li>
<li>${ico('chat')}<span><b>${en ? 'Hours' : '服務時間'}</b>${en ? 'Mon–Fri 08:00–17:30 (Taiwan time); phone and LINE around the clock' : esc(site.hours)}</span></li></ul>`;
  const mapEmbed = `<iframe class="map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent('台中市大里區工業路宏巨巷66號')}&output=embed" title="金達華實業地圖"></iframe>`;

  // 首頁
  const home = `<div class="hero" style="background-image:url('${attr(imgx(images.hero[0], 1800))}')"><div class="wrap"><h1>${esc(site.tagline)}<br>包子、鳳梨酥、牛軋糖、卡片、面紙都包得漂亮</h1><p>金達華實業有限公司,台中大里。臥式自動包裝機專業製造超過 30 年,從規劃、設計、製造到保養一條龍。${esc(site.slogan)}。</p><div class="btns"><a class="btn" href="tel:${attr(site.tel_intl)}">${ico('phone')} ${esc(site.tel)}</a><a class="btn o" href="/contact.html#form">線上詢問,告訴我們你要包什麼</a></div></div></div>
<section><div class="wrap"><div class="sh"><h2>你的產品,我們都包過</h2><p>五大產品線,點進去看實際包裝影片</p></div><div class="grid">${products.map(p => `<div class="card">${thumb(p)}${ico(p.icon)}<h3>${esc(p.name)}</h3><p>${esc(p.lead)}</p><ul>${p.items.slice(0, 4).map(i => `<li>${esc(i)}</li>`).join('')}</ul><a class="more" href="/products.html#${p.id}">看機型與影片 →</a></div>`).join('')}</div></div></section>
<section class="alt"><div class="wrap"><div class="sh"><h2>為什麼選擇金達華</h2></div><div class="pts">
<div class="pt"><b>以客為「根」</b><p>客戶是我們的根本。只要客戶有需求,在專業判斷內我們一定盡力達成。</p></div>
<div class="pt"><b>品質與價格的平衡</b><p>比品質我們可能比不過歐美日機器,比價格我們鐵定比不過中國印度;我們在夾縫中求生存,給客戶合理的價格與品質的平衡。</p></div>
<div class="pt"><b>服務及時</b><p>包裝機要定期保養、要追蹤使用狀況。我們的 LINE 和電話都不怕客戶 24 小時聯繫,不敢說隨傳隨到,但保證有求必應。</p></div></div></div></section>
<section><div class="wrap"><div class="sh"><h2>包裝影片</h2><a href="/videos.html">全部影片 →</a></div><div class="vgrid">${byDate.slice(0, 6).map(([id, v]) => vCard(id, v)).join('')}</div></div></section>
<section class="alt"><div class="wrap"><div class="cta"><div><h2>不確定你的產品能不能包?</h2><p>拍張照、或把樣品寄來,我們直接用機器試給你看。中古二手包裝機也歡迎詢問。</p></div><div class="btns"><a class="btn" href="tel:${attr(site.tel_intl)}">${ico('phone')} 打電話 ${esc(site.tel)}</a><a class="btn o" href="/contact.html#form">填詢問單</a></div></div></div></section>
<section><div class="wrap"><div class="contact"><div><div class="sh"><h2>聯絡我們</h2></div>${contactList(false)}</div><div>${mapEmbed}</div></div></div></section>`;
  fs.writeFileSync(path.join(DIST, 'index.html'), page({title: `${site.name}|臥式包裝機・食品包裝機・卡片包裝機・面紙包裝機|台中大里`, desc: site.description, url: '/', body: home, cur: '/', jsonld: orgLd()}));

  // 產品
  const prodBody = `<div class="wrap">${products.map(p => `<div class="prod" id="${p.id}"><div><h3>${ico(p.icon)} ${esc(p.name)}</h3><p>${esc(p.lead)}</p><ul class="chips">${p.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul><p style="margin-top:16px"><a class="btn o2" href="/contact.html#form">詢問這類包裝</a></p></div><div class="ytgrid">${clipsOf(p)}${p.videos.slice(0, 4).map(id => `<div>${ytEmbed(id, V(id).title)}<h4>${esc(V(id).title)}</h4></div>`).join('')}</div></div>`).join('')}
<div class="cta" style="margin:40px 0"><div><h2>沒看到你的產品?</h2><p>特殊尺寸、特殊包材、倒吊式、連托盤一起包,都可以客製。</p></div><a class="btn" href="/contact.html#form">告訴我們你要包什麼</a></div></div>`;
  fs.writeFileSync(path.join(DIST, 'products.html'), page({title: `產品與機型|${site.short}`, desc: '食品、糖果、卡片、面紙紙品、民生用品與特殊需求五大產品線的臥式包裝機,每一類都有實際包裝影片。', url: '/products.html', body: prodBody, cur: '/products.html', headImg: imgx(images.about_banner[0], 1800)}));

  // 影片
  const vidBody = `<div class="wrap">${products.map(p => `<section style="padding:28px 0"><div class="sh"><h2>${esc(p.name)}</h2><a href="/products.html#${p.id}">看機型 →</a></div><div class="ytgrid">${clipsOf(p)}${p.videos.map(id => `<div id="${attr(id)}">${ytEmbed(id, V(id).title)}<h4>${esc(V(id).title)}</h4></div>`).join('')}</div></section>`).join('')}
<section style="padding:28px 0"><div class="sh"><h2>頻道最新影片</h2><a href="${attr(site.youtube)}" target="_blank" rel="noopener">YouTube 頻道 →</a></div><div class="vgrid">${byDate.slice(0, 9).map(([id, v]) => `<a class="vcard" href="https://www.youtube.com/watch?v=${attr(id)}" target="_blank" rel="noopener"><img src="${ytThumb(id)}" alt="${attr(v.title)}" loading="lazy"><span>${esc(v.title)}</span></a>`).join('')}</div></section></div>`;
  fs.writeFileSync(path.join(DIST, 'videos.html'), page({title: `包裝影片|${site.short}`, desc: '金達華臥式包裝機實際運轉影片:包子、鳳梨酥、牛軋糖、黑糖、卡片、擦手紙、衛生紙、口罩、免洗餐具。', url: '/videos.html', body: vidBody, cur: '/videos.html', headImg: imgx(images.video_banner[0], 1800)}));

  // 照片
  const galBody = `<div class="wrap"><section><div class="sh"><h2>機台參考照片</h2><p>更多照片陸續更新</p></div><div class="gal">${[...images.gallery, images.company, ...images.hero, ...images.about_banner].map(p => `<a href="${attr(img(p))}" target="_blank" rel="noopener"><img src="${attr(imgx(p, 900))}" alt="金達華包裝機" loading="lazy"></a>`).join('')}</div></section></div>`;
  fs.writeFileSync(path.join(DIST, 'gallery.html'), page({title: `機台照片|${site.short}`, desc: '金達華臥式包裝機機台參考照片。', url: '/gallery.html', body: galBody, cur: '/gallery.html', headImg: imgx(images.about_banner[1], 1800)}));

  // 關於
  const aboutBody = `<div class="wrap"><section><div class="contact"><div><div class="sh"><h2>公司介紹</h2></div><p>金達華實業有限公司${esc(site.founded_note)},位於台中大里。我們擁有最棒的服務,LINE 和電話都不怕客戶 24 小時聯繫,不敢說隨傳隨到,但可以保證有求必應。</p><p>我們的目標不只是讓客戶得到最漂亮的包裝,更要幫助客戶呈現最棒的品牌形象,進而增進客戶的品牌價值。</p><p>各種產業皆適用:</p><ul><li>卡片類:儲值卡、遊戲卡</li><li>食品類:包子、鳳梨酥、太陽餅、喜餅、菠蘿麵包、三明治</li><li>糖果類:牛軋糖、黑糖、黏性糖果</li><li>面紙類:袖珍包、候選人包、擦手紙</li><li>民生類:刮鬍刀、牙刷、棉花棒</li></ul><p>有任何包裝或自動化需求,還請隨時聯繫我們;中古、二手包裝機也歡迎蒞臨指教詢問。</p></div><div><img src="${attr(imgx(images.company, 1000))}" alt="金達華實業" style="border-radius:14px"></div></div></section>
<section class="alt" style="margin:0 -20px;padding:40px 20px"><div class="sh"><h2>公司賣點</h2></div><div class="pts"><div class="pt"><b>1. 以客為「根」</b><p>客戶是我們的根本,只要客戶有需求,在專業判斷內我們一定盡力達成。</p></div><div class="pt"><b>2. 品質價格平衡</b><p>比品質我們可能比不過歐美日機器,比價格我們鐵定比不過中國印度,但我們在「夾縫中求生存」,提供給客戶合理的價格與品質的平衡。</p></div><div class="pt"><b>3. 服務及時</b><p>包裝機這種東西,定期的保養、追蹤客戶使用機器狀況如何是一定要做的。我們的 LINE 電話都不怕客戶 24 小時聯繫,不敢說隨傳隨到,但可以保證的是我們有求必應。</p></div></div></section></div>`;
  fs.writeFileSync(path.join(DIST, 'about.html'), page({title: `關於金達華|${site.short}`, desc: '金達華實業有限公司,台中大里,專業包裝機生產開發超過 30 年;以客為根、品質價格平衡、服務及時。', url: '/about.html', body: aboutBody, cur: '/about.html', headImg: imgx(images.about_banner[2], 1800)}));

  // 最新消息
  const newsBody = `<div class="wrap"><section><div class="news">${news.sort((a, b) => b.date.localeCompare(a.date)).map(n => `<article><time datetime="${attr(n.date)}">${esc(n.date)}</time><h3>${esc(n.title)}</h3><p>${esc(n.body)}</p></article>`).join('')}</div></section></div>`;
  fs.writeFileSync(path.join(DIST, 'news.html'), page({title: `最新消息|${site.short}`, desc: '金達華實業最新消息與展覽資訊。', url: '/news.html', body: newsBody, cur: '/news.html', headImg: imgx(images.hero[1], 1800)}));

  // 聯絡
  const contactBody = `<div class="wrap"><section><div class="contact"><div><div class="sh"><h2>線上詢問</h2></div>${contactForm(false)}</div><div><div class="sh"><h2>聯絡資訊</h2></div>${contactList(false)}<div style="margin-top:20px">${mapEmbed}</div></div></div></section></div>`;
  fs.writeFileSync(path.join(DIST, 'contact.html'), page({title: `聯絡我們|${site.short}`, desc: `電話 ${site.tel}、手機 ${site.mobile}、Email ${site.email};${site.address}。`, url: '/contact.html', body: contactBody, cur: '/contact.html', headImg: imgx(images.hero[2], 1800)}));
  fs.writeFileSync(path.join(DIST, 'thanks.html'), page({title: `已收到您的詢問|${site.short}`, desc: '感謝您的詢問,我們會在一個工作天內回覆。', url: '/thanks.html', body: `<div class="wrap"><section style="text-align:center"><h1>已收到您的詢問</h1><p>我們會在一個工作天內以電話或 Email 回覆。急件請直接撥 <a href="tel:${attr(site.tel_intl)}">${esc(site.tel)}</a>。</p><p><a class="btn" href="/">回首頁</a></p></section></div>`, cur: ''}));

  // 英文精簡版
  fs.mkdirSync(path.join(DIST, 'en'), {recursive: true});
  const enHome = `<div class="hero" style="background-image:url('${attr(imgx(images.hero[0], 1800))}')"><div class="wrap"><h1>Horizontal flow wrapping machines<br>built in Taichung, Taiwan for 30+ years</h1><p>${esc(site.description_en)}</p><div class="btns"><a class="btn" href="mailto:${attr(site.email)}">${ico('mail')} ${esc(site.email)}</a><a class="btn o" href="/en/contact.html#form">Send an inquiry</a></div></div></div>
<section><div class="wrap"><div class="sh"><h2>What we pack</h2><p>Five product lines, each with real packing videos</p></div><div class="grid">${products.map(p => `<div class="card">${thumb(p)}${ico(p.icon)}<h3>${esc(p.en)}</h3><p>${esc(p.lead_en)}</p><ul>${p.items_en.slice(0, 4).map(i => `<li>${esc(i)}</li>`).join('')}</ul><a class="more" href="/en/products.html#${p.id}">Machines & videos →</a></div>`).join('')}</div></div></section>
<section class="alt"><div class="wrap"><div class="sh"><h2>Why KDH</h2></div><div class="pts"><div class="pt"><b>Customer first</b><p>If you need it and it is technically sound, we build it.</p></div><div class="pt"><b>Quality at a fair price</b><p>Not the cheapest, not the most expensive: a balance of reliability and cost that Taiwanese makers are known for.</p></div><div class="pt"><b>After-sales that answers</b><p>Maintenance schedules, spare parts and a phone that is picked up. ${esc(site.slogan_en)}</p></div></div></div></section>
<section><div class="wrap"><div class="sh"><h2>Packing videos</h2><a href="${attr(site.youtube)}" target="_blank" rel="noopener">YouTube channel →</a></div><div class="vgrid">${byDate.slice(0, 6).map(([id, v]) => `<a class="vcard" href="https://www.youtube.com/watch?v=${attr(id)}" target="_blank" rel="noopener"><img src="${ytThumb(id)}" alt="${attr(v.title)}" loading="lazy"><span>${esc(v.title)}</span></a>`).join('')}</div></div></section>
<section class="alt"><div class="wrap"><div class="contact"><div><div class="sh"><h2>Contact</h2></div>${contactList(true)}</div><div>${mapEmbed}</div></div></div></section>`;
  fs.writeFileSync(path.join(DIST, 'en', 'index.html'), page({title: `${site.en} (KDH PACK)|Horizontal Flow Wrapping Machines, Taiwan`, desc: site.description_en, url: '/en/', body: enHome, cur: '/en/', lang: 'en', jsonld: orgLd()}));
  const enProd = `<div class="wrap">${products.map(p => `<div class="prod" id="${p.id}"><div><h3>${ico(p.icon)} ${esc(p.en)}</h3><p>${esc(p.lead_en)}</p><ul class="chips">${p.items_en.map(i => `<li>${esc(i)}</li>`).join('')}</ul><p style="margin-top:16px"><a class="btn o2" href="/en/contact.html#form">Ask about this line</a></p></div><div class="ytgrid">${clipsOf(p)}${p.videos.slice(0, 4).map(id => `<div>${ytEmbed(id, V(id).title)}<h4>${esc(V(id).title)}</h4></div>`).join('')}</div></div>`).join('')}</div>`;
  fs.writeFileSync(path.join(DIST, 'en', 'products.html'), page({title: `Products|KDH PACK`, desc: 'Horizontal flow wrappers for food, candy, cards, tissue and daily goods, with packing videos for each line.', url: '/en/products.html', body: enProd, cur: '/en/products.html', lang: 'en', headImg: imgx(images.about_banner[0], 1800)}));
  const enContact = `<div class="wrap"><section><div class="contact"><div><div class="sh"><h2>Inquiry</h2></div>${contactForm(true)}</div><div><div class="sh"><h2>Contact</h2></div>${contactList(true)}<div style="margin-top:20px">${mapEmbed}</div></div></div></section></div>`;
  fs.writeFileSync(path.join(DIST, 'en', 'contact.html'), page({title: `Contact|KDH PACK`, desc: `Tel ${site.tel_intl}, email ${site.email}. ${site.address_en}`, url: '/en/contact.html', body: enContact, cur: '/en/contact.html', lang: 'en', headImg: imgx(images.hero[2], 1800)}));
  fs.writeFileSync(path.join(DIST, 'en', 'thanks.html'), page({title: `Thanks|KDH PACK`, desc: 'We received your inquiry.', url: '/en/thanks.html', body: `<div class="wrap"><section style="text-align:center"><h1>Thank you</h1><p>We received your inquiry and will reply within one business day.</p><p><a class="btn" href="/en/">Back to home</a></p></section></div>`, cur: '', lang: 'en'}));

  // 其他檔案
  fs.writeFileSync(path.join(DIST, '404.html'), page({title: `找不到頁面|${site.short}`, desc: '頁面不存在', url: '/404.html', body: `<div class="wrap"><section style="text-align:center"><h1>找不到這一頁</h1><p><a class="btn" href="/">回首頁</a></p></section></div>`, cur: ''}));
  fs.writeFileSync(path.join(DIST, 'favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#0B2A4A"/><text x="32" y="42" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="26" fill="#fff">KDH</text><rect x="12" y="48" width="40" height="5" rx="2.5" fill="#C8102E"/></svg>`);
  const urls = ['/', '/products.html', '/videos.html', '/gallery.html', '/about.html', '/news.html', '/contact.html', '/en/', '/en/products.html', '/en/contact.html'];
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u => `<url><loc>${site.url}${u}</loc><lastmod>${ymd(BUILT)}</lastmod></url>`).join('')}</urlset>`);
  fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);
  fs.writeFileSync(path.join(DIST, 'llms.txt'), `# ${site.name}(${site.en}, KDH PACK)\n\n> ${site.description}\n\n電話 ${site.tel}|手機 ${site.mobile}|Email ${site.email}|地址 ${site.address}|Facebook ${site.facebook}|YouTube ${site.youtube}\n\n## 產品線\n${products.map(p => `- ${p.name}(${p.en}):${p.items.join('、')}`).join('\n')}\n\n## 頁面\n${urls.map(u => `- ${site.url}${u}`).join('\n')}\n`);
  fs.writeFileSync(path.join(DIST, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n/llms.txt\n  Content-Type: text/plain; charset=utf-8\n`);
  console.log('build ok →', DIST);
}
main().catch(e => { console.error(e); process.exit(1); });
