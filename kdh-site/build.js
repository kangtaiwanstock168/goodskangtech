'use strict';
// 金達華實業 KDH PACK 官網建站腳本(零相依,Node 18+)
// 產出 dist/:首頁、產品與機型、包裝影片、機台照片、關於、聯絡、最新消息、英文精簡版、sitemap/robots/llms.txt
// 建站時:1) 抓 YouTube 頻道 RSS 補新影片(抓不到用 content/cache) 2) 圖片第一次從舊站下載並寫回 GitHub content/img,之後直接用 repo 裡的檔案
const fs = require('fs'), path = require('path');
const ROOT = __dirname, DIST = path.join(ROOT, 'dist'), C = path.join(ROOT, 'content');
const J = f => JSON.parse(fs.readFileSync(path.join(C, f), 'utf8'));
const site = J('site.json'), products = J('products.json'), images = J('images.json'), news = J('news.json');
const apps = (() => { try{ return J('applications.json'); }catch(e){ return []; } })();   // 長尾應用頁(鳳梨酥包裝機、卡片包裝機…)
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
.hero .wrap{position:relative;z-index:2;padding:56px 20px}
.herov,.herom,.heroplay{display:none}
.hero.playing{background:#000;min-height:0;display:block}.hero.playing::before,.hero.playing .herom,.hero.playing .heroplay,.hero.playing .wrap{display:none}.hero.playing .herov{display:block;position:relative;width:auto;max-width:100%;aspect-ratio:9/16;max-height:82vh;margin:0 auto;object-fit:contain;background:#000}
.kicker{display:inline-block;background:var(--red);color:#fff;font-weight:700;font-size:.85rem;letter-spacing:.06em;padding:4px 10px;border-radius:6px;margin:0 0 12px}
.reelsec{padding:28px 0 8px}.reelsec .sh{margin-bottom:14px}
.reel{display:grid;gap:14px;grid-template-columns:repeat(4,1fr)}
.rcard{position:relative;display:block;border-radius:12px;overflow:hidden;background:#000;aspect-ratio:4/3;color:#fff}
.rcard img{width:100%;height:100%;object-fit:cover;display:block;opacity:.92}
.rcard b{position:absolute;left:0;right:0;bottom:0;padding:28px 12px 10px;font-size:.88rem;font-weight:600;line-height:1.35;background:linear-gradient(transparent,rgba(0,0,0,.78))}
.rcard .play{position:absolute;left:50%;top:42%;width:50px;height:36px;margin:-18px 0 0 -25px;border-radius:10px;background:var(--red);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(0,0,0,.35)}.rcard .play svg{width:22px;height:22px;fill:#fff}
.rcard:hover{text-decoration:none}
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
a.card{color:var(--ink)}a.card:hover{text-decoration:none}.card .cthumb{display:block}
.chips li a{color:var(--navy2)}
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
.paths{display:grid;gap:18px;grid-template-columns:1fr 1fr}
.path{background:#fff;border:1px solid var(--line);border-radius:14px;padding:24px}
.path .tag{display:inline-block;font-size:.82rem;font-weight:700;color:var(--red);margin-bottom:6px}
.path h3{margin:0 0 8px;font-size:1.2rem;color:var(--navy)}.path p{margin:0;color:var(--ink)}.path .more{display:inline-block;margin-top:12px;font-weight:700;color:var(--red)}
.thenl{margin:26px 0 12px;font-weight:700;color:var(--navy)}
.steps{display:grid;gap:14px;grid-template-columns:repeat(4,1fr);list-style:none;margin:0;padding:0;counter-reset:s}
.steps li{background:#fff;border-radius:12px;padding:18px;border-top:4px solid var(--navy);counter-increment:s}
.steps li::before{content:counter(s);display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:var(--navy);color:#fff;font-weight:700;font-size:.9rem;margin-bottom:8px}
.steps b{display:block;color:var(--navy);margin-bottom:4px}.steps span{color:var(--muted);font-size:.93rem}
@media(max-width:980px){.paths{grid-template-columns:1fr}.path{padding:20px}.steps{grid-template-columns:1fr;gap:10px}.steps li{display:grid;grid-template-columns:28px 1fr;column-gap:12px;align-items:center;padding:14px 16px}.steps li::before{grid-row:span 2;margin:0}.steps b{margin:0}}
.lang{font-size:.85rem;border:1px solid var(--line);border-radius:999px;padding:4px 10px}
@media(max-width:1400px) and (min-width:981px){.logo span{display:none}}
@media(max-width:980px){.logo small{display:none}.prod{grid-template-columns:1fr}.contact{grid-template-columns:1fr}.fgrid{grid-template-columns:1fr}.row2{grid-template-columns:1fr}.logo{font-size:.95rem}
 nav{display:none;position:absolute;left:0;right:0;top:68px;background:#fff;border-bottom:1px solid var(--line);flex-direction:column;align-items:stretch;padding:8px 12px 14px}
 nav.open{display:flex}nav a{padding:12px}nav a.tel{text-align:center}.menu{display:inline-block}.bar{display:flex}section{padding:40px 0}
 .hero{min-height:440px;align-items:flex-end}.hero::before{z-index:1;background:linear-gradient(180deg,rgba(11,42,74,.15) 0%,rgba(11,42,74,.55) 45%,rgba(11,42,74,.92) 100%)}.hero .wrap{padding:40px 20px 28px}.hero h1{font-size:1.75rem}.hero .lede{display:none}
 .herom{display:block;position:absolute;inset:0;background:center/cover no-repeat;z-index:0}
 .heroplay{display:inline-flex;align-items:center;gap:8px;position:absolute;left:50%;top:22%;transform:translate(-50%,-50%);z-index:3;background:var(--red);color:#fff;border:0;border-radius:999px;padding:12px 20px 12px 14px;font:inherit;font-weight:700;font-size:1rem;box-shadow:0 8px 24px rgba(0,0,0,.4)}.heroplay svg{width:24px;height:24px;fill:#fff}
 .card ul{display:none}.card p{margin-bottom:4px}
 .reelsec{padding:22px 0 6px}.reel{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:10px;margin:0 -20px;padding:0 20px 10px;-webkit-overflow-scrolling:touch;scrollbar-width:none}.reel::-webkit-scrollbar{display:none}.rcard{flex:0 0 68%;scroll-snap-align:start}}
`;

const NAV = [['/', '首頁'], ['/products.html', '產品與機型'], ['/machines/', '包裝應用'], ['/videos.html', '包裝影片'], ['/service.html', '保養服務'], ['/about.html', '關於金達華'], ['/contact.html', '聯絡我們']];
const NAV_EN = [['/en/', 'Home'], ['/en/products.html', 'Products'], ['/en/contact.html', 'Contact']];
// 只有這三組中英頁面真的互相對應；其他中文頁沒有英文版，不宣告 hreflang
const LANG_PAIRS = {'/': '/en/', '/products.html': '/en/products.html', '/contact.html': '/en/contact.html'};
function hreflangTags(url){
  const zh = Object.keys(LANG_PAIRS).find(k => k === url || LANG_PAIRS[k] === url);
  if (!zh) return '';
  return `<link rel="alternate" hreflang="zh-Hant" href="${site.url}${zh}"><link rel="alternate" hreflang="en" href="${site.url}${LANG_PAIRS[zh]}"><link rel="alternate" hreflang="x-default" href="${site.url}${zh}">`;
}
function page({title, desc, url, body, cur, lang = 'zh-Hant', image, jsonld, headImg, headLede, headTitle, noindex}){
  const en = lang === 'en'; const nav = en ? NAV_EN : NAV;
  const alt = en ? `<a class="lang" href="/" hreflang="zh-Hant">中文</a>` : `<a class="lang" href="/en/" hreflang="en">English</a>`;
  const full = site.url + url;
  return `<!doctype html><html lang="${en ? 'en' : 'zh-Hant'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${attr(desc)}"><link rel="canonical" href="${full}">
${noindex ? '<meta name="robots" content="noindex">' : hreflangTags(url)}
<meta property="og:type" content="website"><meta property="og:title" content="${attr(title)}"><meta property="og:description" content="${attr(desc)}"><meta property="og:url" content="${full}"><meta property="og:image" content="${attr(image || site.url + img(images.hero[0]))}"><meta property="og:site_name" content="${attr(site.name)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
<style>${CSS}</style>${jsonld ? (Array.isArray(jsonld) ? jsonld : [jsonld]).map(j => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('') : ''}${site.ga4 ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${attr(site.ga4)}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${attr(site.ga4)}',{transport_type:'beacon'});</script>` : ''}</head>
<body><header><div class="wrap top"><a class="logo" href="${en ? '/en/' : '/'}"><img src="${attr(img(images.logo))}" alt="${attr(site.name)}" width="120" height="40"><span>${en ? esc(site.brand) : esc(site.name)}<small>${en ? esc(site.en) : esc(site.brand) + ' · ' + esc(site.en)}</small></span></a>
<button class="menu" aria-label="選單" onclick="document.querySelector('nav').classList.toggle('open')">☰</button>
<nav>${nav.map(([h, t]) => `<a href="${h}"${h === cur ? ' class="cur"' : ''}>${esc(t)}</a>`).join('')}${alt}<a class="tel" href="tel:${attr(site.tel_intl)}">${ico('phone')} ${esc(en ? site.tel_intl : site.tel)}</a></nav></div></header>
${headImg ? `<div class="pagehead" style="background-image:url('${attr(headImg)}')"><div class="wrap"><h1>${esc(headTitle || title.split(/[|｜]/)[0].trim())}</h1><p>${esc(headLede || desc)}</p></div></div>` : ''}
<main>${body}</main>
<footer><div class="wrap"><div class="fgrid"><div><h4>${esc(site.name)}</h4><p>${esc(site.en)}</p><p>${en ? esc(site.description_en) : esc(site.description)}</p></div>
<div><h4>${en ? 'Contact' : '聯絡方式'}</h4><p>${en ? 'Tel' : '電話'}:<a href="tel:${attr(site.tel_intl)}">${esc(en ? site.tel_intl : site.tel)}</a></p><p>${en ? 'Mobile' : '手機'}:<a href="tel:${attr(site.mobile_intl)}">${esc(en ? site.mobile_intl : site.mobile)}</a></p><p>${en ? 'Fax' : '傳真'}:${esc(en ? site.fax_intl : site.fax)}</p><p>Email:<a href="mailto:${attr(site.email)}">${esc(site.email)}</a></p><p>${en ? esc(site.address_en) : esc(site.address)}</p></div>
<div><h4>${en ? 'Links' : '連結'}</h4><p><a href="${attr(site.facebook)}" target="_blank" rel="noopener">Facebook</a></p><p><a href="${attr(site.youtube)}" target="_blank" rel="noopener">YouTube ${en ? 'channel' : '頻道'}</a></p>${en ? '' : '<p><a href="/machines/">包裝應用一覽</a></p><p><a href="/service.html">保養、零件與年約</a></p><p><a href="/subsidy.html">買包裝機可以抵稅嗎</a></p><p><a href="/overseas.html">海外客戶</a></p><p><a href="/gallery.html">機台照片</a></p><p><a href="/news.html">最新消息</a></p>'}<p><a href="${en ? '/' : '/en/'}">${en ? '中文版' : 'English'}</a></p></div></div>
<div class="copy"><span>© ${BUILT.getFullYear()} ${esc(site.name)} ${esc(site.en)}</span><span>${esc(site.slogan_en)}</span></div></div></footer>
<script>(function(){try{var k='kdh_land';if(!sessionStorage.getItem(k)){var q=new URLSearchParams(location.search),u=[];['utm_source','utm_medium','utm_campaign'].forEach(function(n){var v=q.get(n);if(v)u.push(n+'='+v.slice(0,60));});var r='';try{var h=new URL(document.referrer).hostname;if(h&&h!==location.hostname)r=h;}catch(e){}sessionStorage.setItem(k,JSON.stringify({p:location.pathname,u:u.join('&'),r:r}));}}catch(e){}})();</script>
<div class="bar"><a class="tel" href="tel:${attr(site.tel_intl)}">${ico('phone')} ${en ? 'Call' : '打電話'}</a><a href="mailto:${attr(site.email)}">${ico('mail')} Email</a><a href="${en ? '/en/contact.html' : '/contact.html'}#form">${ico('chat')} ${en ? 'Inquiry' : '線上詢問'}</a></div>
${site.ga4 ? `<script>document.addEventListener('click',function(e){var a=e.target.closest('a');if(!a||!window.gtag)return;var h=a.getAttribute('href')||'';if(h.indexOf('tel:')===0)gtag('event','call_click',{link_url:h,page:location.pathname});else if(h.indexOf('mailto:')===0)gtag('event','email_click',{link_url:h,page:location.pathname});else if(/^https?:\/\/(www\.)?(youtube\.com|youtu\.be|facebook\.com)/.test(h))gtag('event','outbound_click',{link_url:h});});document.addEventListener('play',function(e){if(e.target&&e.target.tagName==='VIDEO'&&window.gtag)gtag('event','video_play',{video_url:e.target.currentSrc||e.target.src,page:location.pathname});},true);</script>` : ''}
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
  const INQ_TYPES = [['新機', 'New machine'], ['保養維修', 'Service & repair'], ['中古機', 'Used machine'], ['其他', 'Other']];
  const contactForm = en => `<form name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="${en ? '/en/thanks.html' : '/thanks.html'}" id="form"><input type="hidden" name="form-name" value="contact"><p hidden><label>不要填這格 <input name="bot-field"></label></p>
<input type="hidden" name="landing_page"><input type="hidden" name="form_page"><input type="hidden" name="source">
<div class="row2"><label>${en ? 'Name' : '您的姓名'} <input name="name" required></label><label>${en ? 'Company (optional)' : '公司名稱(選填)'} <input name="company"></label></div>
<div class="row2"><label>${en ? 'Phone' : '聯絡電話'} <input name="phone" type="tel" required></label><label>${en ? 'Email (optional)' : 'Email(選填)'} <input name="email" type="email"></label></div>
<div class="row2"><label>${en ? 'Inquiry type' : '詢問類型'} <select name="inquiry_type" required><option value="">${en ? 'Please choose' : '請選擇'}</option>${INQ_TYPES.map(([zh, e]) => `<option value="${zh}">${en ? e : zh}</option>`).join('')}</select></label><label>${en ? 'Product to pack' : '要包的產品'} <input name="product" maxlength="60"></label></div>
<label>${en ? 'Details: product size (L×W×H), target bags per minute, current packaging film' : '需求內容:產品長寬高、希望每分鐘幾包、目前用的包材'} <textarea name="message" rows="5" required></textarea></label>
<div class="row2"><label>${en ? 'Country / City (optional)' : '所在縣市(選填)'} <input name="city"></label><label>${en ? 'LINE or WhatsApp ID (optional, we will add you)' : 'LINE ID(選填,想用 LINE 聯絡的話我們加您)'} <input name="line_id" maxlength="60"></label></div>
<button class="btn" type="submit">${en ? 'Send inquiry' : '送出詢問'}</button><p class="note">${en ? 'Your details are sent to KDH PACK by email and used to reply to this inquiry. We will reply by phone or email as soon as we can; for urgent matters call ' + esc(site.tel_intl) + '.' : '您填的資料會寄到金達華信箱,用來回覆這次詢問。我們會盡快以電話或 Email 回覆;急件請直接撥 ' + esc(site.tel) + ' 或 ' + esc(site.mobile) + '。'}</p></form>
<script>(function(){var f=document.getElementById('form');if(!f)return;var pre='';try{var q=new URLSearchParams(location.search).get('product');if(q){pre=q.slice(0,60);f.product.value=pre;}}catch(e){}try{var l=JSON.parse(sessionStorage.getItem('kdh_land')||'{}');f.landing_page.value=l.p||'';f.source.value=[l.r,l.u].filter(Boolean).join(' ');}catch(e){}f.form_page.value=location.pathname;f.addEventListener('submit',function(){var b=f.querySelector('button[type=submit]');if(b){b.disabled=true;b.textContent='${en ? 'Sending…' : '送出中…'}';}try{sessionStorage.setItem('kdh_sent',JSON.stringify({t:f.inquiry_type.value,p:(pre&&f.product.value===pre)?pre.slice(0,40):'',fp:location.pathname,lp:f.landing_page.value}));}catch(e){}});window.addEventListener('pageshow',function(){var b=f.querySelector('button[type=submit]');if(b){b.disabled=false;b.textContent='${en ? 'Send inquiry' : '送出詢問'}';}});})();</script>`;
  const contactList = en => `<ul class="clist">
<li>${ico('phone')}<span><b>${en ? 'Tel' : '電話'}</b><a href="tel:${attr(site.tel_intl)}">${esc(en ? site.tel_intl : site.tel)}</a> / <a href="tel:${attr(site.mobile_intl)}">${esc(en ? site.mobile_intl : site.mobile)}</a></span></li>
<li>${ico('mail')}<span><b>Email</b><a href="mailto:${attr(site.email)}">${esc(site.email)}</a></span></li>
<li>${ico('pin')}<span><b>${en ? 'Address' : '地址'}</b><a href="${attr(site.map)}" target="_blank" rel="noopener">${en ? esc(site.address_en) : esc(site.address)}</a></span></li>
<li>${ico('chat')}<span><b>${en ? 'Hours' : '服務時間'}</b>${en ? 'Mon–Fri 08:00–17:30 (Taiwan time); mobile phone around the clock' : esc(site.hours)}</span></li></ul>`;
  const mapEmbed = `<iframe class="map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent('台中市大里區工業路宏巨巷66號')}&output=embed" title="金達華實業地圖"></iframe>`;

  // 首頁
  // 手機版首屏:實拍海報圖＋播放鈕,點了才在原位播放完整影片(不自動播,省流量、也讓人自己按)
  const heroVideo = fs.existsSync(path.join(ROOT, 'static', 'video', 'jelly-tray.mp4')) ? `<div class="herom" style="background-image:url('/video/hero-poster.jpg')"></div><button class="heroplay" type="button" aria-label="播放實際包裝影片" onclick="var h=this.closest('.hero');var v=document.createElement('video');v.src='/video/jelly-tray.mp4';v.controls=true;v.playsInline=true;v.setAttribute('playsinline','');v.className='herov';h.classList.add('playing');h.insertBefore(v,h.firstChild);v.play();">${PLAY}<span>看機器實際包裝</span></button>` : '';
  const reel = [...products.flatMap(p => (p.clips || []).map((c, i) => [`/videos.html#clip-${p.id}-${i}`, c.poster, c.title])), ...byDate.slice(0, 7).map(([id, v]) => [`/videos.html#${id}`, ytThumb(id), v.title])].slice(0, 8);
  const reelHtml = `<section class="reelsec"><div class="wrap"><div class="sh"><h2>實際包裝影片</h2><a href="/videos.html">全部 ${Object.keys(videos).length + products.reduce((n, p) => n + (p.clips || []).length, 0)} 支 →</a></div><div class="reel">${reel.map(([h, img, t]) => `<a class="rcard" href="${attr(h)}"><img src="${attr(img)}" alt="${attr(t)}" loading="lazy" width="480" height="360"><span class="play">${PLAY}</span><b>${esc(t)}</b></a>`).join('')}</div></div></section>`;
  // 訂購流程：常做的產品直接看交機影片；特殊產品才寄樣品評估。之後都是報價 → 製作 → 用客人產品試包 → 交機
  const orderFlow = `<div class="sh"><h2>怎麼跟金達華買包裝機</h2><p>先告訴我們你要包什麼，接下來分兩種情況</p></div>
<div class="paths"><div class="path"><span class="tag">情況一</span><h3>我們常做的產品</h3><p>衛生紙袖珍包、牛軋糖、鳳梨酥、包子、卡片這類，電話裡就能告訴你能不能包，並給你看之前交機的實拍影片。</p><a class="more" href="/machines/">看我們包過哪些產品 →</a></div>
<div class="path"><span class="tag">情況二</span><h3>比較特殊的產品</h3><p>形狀、尺寸或軟硬比較特別，或要連托盤、倒吊式包裝。請寄幾個樣品和現在用的包材到台中，我們看過實物，評估怎麼包、適合哪一型。</p><a class="more" href="/contact.html#form">先來信說明產品 →</a></div></div>
<p class="thenl">接下來的步驟都一樣</p>
<ol class="steps"><li><b>建議機型與報價</b><span>依你的產品、產量和配置個別報價</span></li><li><b>下單製作</b><span>確認規格後開始製作機台</span></li><li><b>用你的產品試包</b><span>機器做好，先用你的產品實際包給你看</span></li><li><b>交機與教學</b><span>安裝試機，教會操作與日常保養</span></li></ol>`;
  const home = `<div class="hero" style="background-image:url('${attr(imgx(images.hero[0], 1800))}')">${heroVideo}<div class="wrap"><p class="kicker">台中大里 · 臥式包裝機製造 30 年</p><h1>包子、鳳梨酥、牛軋糖、卡片、面紙<br>都包得漂亮</h1><p class="lede">金達華實業有限公司,台中大里。臥式自動包裝機專業製造超過 30 年,從規劃、設計、製造到保養一條龍。${esc(site.slogan)}。</p><div class="btns"><a class="btn" href="tel:${attr(site.tel_intl)}">${ico('phone')} ${esc(site.tel)}</a><a class="btn o" href="/contact.html#form">線上詢問</a></div></div></div><span id="reel"></span>${reelHtml}
<section><div class="wrap"><div class="sh"><h2>你的產品,我們都包過</h2><p>五大產品線,點進去看實際包裝影片</p></div><div class="grid">${products.map(p => `<div class="card">${thumb(p)}${ico(p.icon)}<h3>${esc(p.name)}</h3><p>${esc(p.lead)}</p><ul>${p.items.slice(0, 4).map(i => `<li>${esc(i)}</li>`).join('')}</ul><a class="more" href="/products.html#${p.id}">看機型與影片 →</a></div>`).join('')}</div></div></section>
<section style="padding-top:0"><div class="wrap"><div class="sh"><h2>依產品找包裝機</h2><a href="/machines/">全部應用 →</a></div><ul class="chips" style="margin:0">${apps.map(a => `<li><a href="/machines/${a.slug}.html">${esc(a.name)}</a></li>`).join('')}</ul></div></section>
<section class="alt" style="padding-top:36px"><div class="wrap"><div class="grid"><a class="card" href="/service.html"><h3>保養、零件與年約</h3><p>金達華機台的保養、零件與調機，打一通電話就找得到人。</p><span class="more">看售後服務 →</span></a><a class="card" href="/subsidy.html"><h3>買包裝機可以抵稅嗎？</h3><p>智慧機械投資抵減白話整理，100 萬以上可抵 5%，我們協助提供規格說明。</p><span class="more">看怎麼申請 →</span></a><a class="card" href="/overseas.html"><h3>海外客戶</h3><p>香港、馬來西亞、泰國都有金達華的機器在運轉。中文溝通、試包錄影、海運、視訊安裝、保固零件空運。</p><span class="more">看訂購流程 →</span></a></div></div></section>
<section class="alt" style="padding-top:0"><div class="wrap"><div class="sh"><h2>為什麼選擇金達華</h2></div><div class="pts">
<div class="pt"><b>以客為「根」</b><p>客戶是我們的根本。只要客戶有需求,在專業判斷內我們一定盡力達成。</p></div>
<div class="pt"><b>品質與價格的平衡</b><p>品質向國際大廠看齊、價格比進口機實在,給客戶合理的價格與品質的平衡。</p></div>
<div class="pt"><b>服務及時</b><p>包裝機要定期保養、要追蹤使用狀況。我們的電話都不怕客戶 24 小時聯繫,不敢說隨傳隨到,但保證有求必應。</p></div></div></div></section>
<section class="alt" style="padding-top:0"><div class="wrap">${orderFlow}</div></section>
<section class="alt"><div class="wrap"><div class="cta"><div><h2>不確定你的產品能不能包?</h2><p>打個電話、或傳產品照片給我們，常做的產品當場就能回答。中古二手包裝機也歡迎詢問。</p></div><div class="btns"><a class="btn" href="tel:${attr(site.tel_intl)}">${ico('phone')} 打電話 ${esc(site.tel)}</a><a class="btn o" href="/contact.html#form">填詢問單</a></div></div></div></section>
<section><div class="wrap"><div class="contact"><div><div class="sh"><h2>聯絡我們</h2></div>${contactList(false)}</div><div>${mapEmbed}</div></div></div></section>`;
  fs.writeFileSync(path.join(DIST, 'index.html'), page({title: `台中包裝機械廠商｜臥式包裝機・食品包裝機・卡片包裝機・面紙包裝機｜${site.name}`, desc: site.description, url: '/', body: home, cur: '/', jsonld: orgLd()}));

  // 產品
  const prodBody = `<div class="wrap">${products.map(p => `<div class="prod" id="${p.id}"><div><h3>${ico(p.icon)} ${esc(p.name)}</h3><p>${esc(p.lead)}</p><ul class="chips">${p.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>${apps.filter(a => a.line === p.id && a.slug !== 'horizontal-flow-wrapper').length ? `<p style="margin:14px 0 0;font-size:.95rem"><b>專頁：</b>${apps.filter(a => a.line === p.id && a.slug !== 'horizontal-flow-wrapper').map(a => `<a href="/machines/${a.slug}.html">${esc(a.name)}</a>`).join('、')}</p>` : ''}<p style="margin-top:16px"><a class="btn o2" href="/contact.html?product=${encodeURIComponent(p.name)}#form">詢問這類包裝</a></p></div><div class="ytgrid">${clipsOf(p)}${p.videos.slice(0, 4).map(id => `<div>${ytEmbed(id, V(id).title)}<h4>${esc(V(id).title)}</h4></div>`).join('')}</div></div>`).join('')}
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
  const aboutBody = `<div class="wrap"><section><div class="contact"><div><div class="sh"><h2>公司介紹</h2></div><p>金達華實業有限公司${esc(site.founded_note)},位於台中大里。我們擁有最棒的服務,電話都不怕客戶 24 小時聯繫,不敢說隨傳隨到,但可以保證有求必應。</p><p>我們的目標不只是讓客戶得到最漂亮的包裝,更要幫助客戶呈現最棒的品牌形象,進而增進客戶的品牌價值。</p><p>各種產業皆適用:</p><ul><li>卡片類:儲值卡、遊戲卡</li><li>食品類:包子、鳳梨酥、太陽餅、喜餅、菠蘿麵包、三明治</li><li>糖果類:牛軋糖、黑糖、黏性糖果</li><li>面紙類:袖珍包、候選人包、擦手紙</li><li>民生類:刮鬍刀、牙刷、棉花棒</li></ul><p>有任何包裝或自動化需求,還請隨時聯繫我們;中古、二手包裝機也歡迎蒞臨指教詢問。</p></div><div><img src="${attr(imgx(images.company, 1000))}" alt="金達華實業" style="border-radius:14px"></div></div></section>
<section class="alt" style="margin:0 -20px;padding:40px 20px"><div class="sh"><h2>公司賣點</h2></div><div class="pts"><div class="pt"><b>1. 以客為「根」</b><p>客戶是我們的根本,只要客戶有需求,在專業判斷內我們一定盡力達成。</p></div><div class="pt"><b>2. 品質價格平衡</b><p>品質向國際大廠看齊、價格比進口機實在,提供給客戶合理的價格與品質的平衡。</p></div><div class="pt"><b>3. 服務及時</b><p>包裝機這種東西,定期的保養、追蹤客戶使用機器狀況如何是一定要做的。我們的電話都不怕客戶 24 小時聯繫,不敢說隨傳隨到,但可以保證的是我們有求必應。</p></div></div></section></div>`;
  fs.writeFileSync(path.join(DIST, 'about.html'), page({title: `關於金達華|${site.short}`, desc: '金達華實業有限公司,台中大里,專業包裝機生產開發超過 30 年;以客為根、品質價格平衡、服務及時。', url: '/about.html', body: aboutBody, cur: '/about.html', headImg: imgx(images.about_banner[2], 1800)}));

  // 最新消息
  const newsBody = `<div class="wrap"><section><div class="news">${news.sort((a, b) => b.date.localeCompare(a.date)).map(n => `<article><time datetime="${attr(n.date)}">${esc(n.date)}</time><h3>${esc(n.title)}</h3><p>${esc(n.body)}</p></article>`).join('')}</div></section></div>`;
  fs.writeFileSync(path.join(DIST, 'news.html'), page({title: `最新消息|${site.short}`, desc: '金達華實業最新消息與展覽資訊。', url: '/news.html', body: newsBody, cur: '/news.html', headImg: imgx(images.hero[1], 1800)}));

  // 聯絡
  const contactBody = `<div class="wrap"><section style="padding-bottom:0">${orderFlow}</section><section><div class="contact"><div><div class="sh"><h2>線上詢問</h2></div>${contactForm(false)}<p class="note" style="margin-top:14px">香港、馬來西亞、泰國等海外客戶請看<a href="/overseas.html">海外客戶說明</a>；公司購機想申請投資抵減請看<a href="/subsidy.html">抵稅說明</a>。</p></div><div><div class="sh"><h2>聯絡資訊</h2></div>${contactList(false)}<div style="margin-top:20px">${mapEmbed}</div></div></div></section></div>`;
  fs.writeFileSync(path.join(DIST, 'contact.html'), page({title: `聯絡我們|${site.short}`, desc: `電話 ${site.tel}、手機 ${site.mobile}、Email ${site.email};${site.address}。`, url: '/contact.html', body: contactBody, cur: '/contact.html', headImg: imgx(images.hero[2], 1800)}));
  fs.writeFileSync(path.join(DIST, 'thanks.html'), page({title: `已收到您的詢問|${site.short}`, noindex: true, desc: '感謝您的詢問,我們會盡快回覆。', url: '/thanks.html', body: `<div class="wrap"><section style="text-align:center"><h1>已收到您的詢問</h1><p>我們會盡快以電話或 Email 跟您聯絡。急件請直接撥 <a href="tel:${attr(site.tel_intl)}">${esc(site.tel)}</a> 或手機 <a href="tel:${attr(site.mobile_intl)}">${esc(site.mobile)}</a>。</p><p>想先看看別人的包裝成果，可以逛逛<a href="/machines/">包裝應用</a>與<a href="/videos.html">包裝影片</a>。</p><script>(function(){try{var d=sessionStorage.getItem('kdh_sent');if(d&&window.gtag){var o=JSON.parse(d);gtag('event','inquiry_submit',{inquiry_type:o.t||'',product:o.p||'',form_page:o.fp||'',landing_page:o.lp||''});}sessionStorage.removeItem('kdh_sent');}catch(e){}})();</script><p><a class="btn" href="/">回首頁</a></p></section></div>`, cur: ''}));

  // 英文精簡版
  fs.mkdirSync(path.join(DIST, 'en'), {recursive: true});
  const enHome = `<div class="hero" style="background-image:url('${attr(imgx(images.hero[0], 1800))}')">${heroVideo}<div class="wrap"><h1>Horizontal flow wrapping machines<br>built in Taichung, Taiwan for 30+ years</h1><p>${esc(site.description_en)}</p><div class="btns"><a class="btn" href="mailto:${attr(site.email)}">${ico('mail')} ${esc(site.email)}</a><a class="btn o" href="/en/contact.html#form">Send an inquiry</a></div></div></div>
<section><div class="wrap"><div class="sh"><h2>What we pack</h2><p>Five product lines, each with real packing videos</p></div><div class="grid">${products.map(p => `<div class="card">${thumb(p)}${ico(p.icon)}<h3>${esc(p.en)}</h3><p>${esc(p.lead_en)}</p><ul>${p.items_en.slice(0, 4).map(i => `<li>${esc(i)}</li>`).join('')}</ul><a class="more" href="/en/products.html#${p.id}">Machines & videos →</a></div>`).join('')}</div></div></section>
<section class="alt"><div class="wrap"><div class="sh"><h2>Why KDH</h2></div><div class="pts"><div class="pt"><b>Customer first</b><p>If you need it and it is technically sound, we build it.</p></div><div class="pt"><b>Quality at a fair price</b><p>Not the cheapest, not the most expensive: a balance of reliability and cost that Taiwanese makers are known for.</p></div><div class="pt"><b>After-sales that answers</b><p>Maintenance schedules, spare parts and a phone that is picked up. ${esc(site.slogan_en)}</p></div></div></div></section>
<section><div class="wrap"><div class="sh"><h2>Packing videos</h2><a href="${attr(site.youtube)}" target="_blank" rel="noopener">YouTube channel →</a></div><div class="vgrid">${byDate.slice(0, 6).map(([id, v]) => `<a class="vcard" href="https://www.youtube.com/watch?v=${attr(id)}" target="_blank" rel="noopener"><img src="${ytThumb(id)}" alt="${attr(v.title)}" loading="lazy"><span>${esc(v.title)}</span></a>`).join('')}</div></div></section>
<section class="alt"><div class="wrap"><div class="contact"><div><div class="sh"><h2>Contact</h2></div>${contactList(true)}</div><div>${mapEmbed}</div></div></div></section>`;
  fs.writeFileSync(path.join(DIST, 'en', 'index.html'), page({title: `${site.en} (KDH PACK)|Horizontal Flow Wrapping Machines, Taiwan`, desc: site.description_en, url: '/en/', body: enHome, cur: '/en/', lang: 'en', jsonld: orgLd()}));
  const enProd = `<div class="wrap">${products.map(p => `<div class="prod" id="${p.id}"><div><h3>${ico(p.icon)} ${esc(p.en)}</h3><p>${esc(p.lead_en)}</p><ul class="chips">${p.items_en.map(i => `<li>${esc(i)}</li>`).join('')}</ul><p style="margin-top:16px"><a class="btn o2" href="/en/contact.html?product=${encodeURIComponent(p.en)}#form">Ask about this line</a></p></div><div class="ytgrid">${clipsOf(p)}${p.videos.slice(0, 4).map(id => `<div>${ytEmbed(id, V(id).title)}<h4>${esc(V(id).title)}</h4></div>`).join('')}</div></div>`).join('')}</div>`;
  fs.writeFileSync(path.join(DIST, 'en', 'products.html'), page({title: `Products|KDH PACK`, desc: 'Horizontal flow wrappers for food, candy, cards, tissue and daily goods, with packing videos for each line.', url: '/en/products.html', body: enProd, cur: '/en/products.html', lang: 'en', headImg: imgx(images.about_banner[0], 1800)}));
  const enContact = `<div class="wrap"><section><div class="contact"><div><div class="sh"><h2>Inquiry</h2></div>${contactForm(true)}</div><div><div class="sh"><h2>Contact</h2></div>${contactList(true)}<div style="margin-top:20px">${mapEmbed}</div></div></div></section></div>`;
  fs.writeFileSync(path.join(DIST, 'en', 'contact.html'), page({title: `Contact|KDH PACK`, desc: `Tel ${site.tel_intl}, email ${site.email}. ${site.address_en}`, url: '/en/contact.html', body: enContact, cur: '/en/contact.html', lang: 'en', headImg: imgx(images.hero[2], 1800)}));
  fs.writeFileSync(path.join(DIST, 'en', 'thanks.html'), page({title: `Thanks|KDH PACK`, noindex: true, desc: 'We received your inquiry.', url: '/en/thanks.html', body: `<div class="wrap"><section style="text-align:center"><h1>Thank you</h1><p>We received your inquiry and will contact you by phone or email as soon as we can. For urgent matters call <a href="tel:${attr(site.tel_intl)}">${esc(site.tel_intl)}</a>.</p><script>(function(){try{var d=sessionStorage.getItem('kdh_sent');if(d&&window.gtag){var o=JSON.parse(d);gtag('event','inquiry_submit',{inquiry_type:o.t||'',product:o.p||'',form_page:o.fp||'',landing_page:o.lp||''});}sessionStorage.removeItem('kdh_sent');}catch(e){}})();</script><p><a class="btn" href="/en/">Back to home</a></p></section></div>`, cur: '', lang: 'en'}));

  // 長尾應用頁:/machines/<slug>.html,一種應用一頁(搜尋「鳳梨酥包裝機」這類精準詞用)
  fs.mkdirSync(path.join(DIST, 'machines'), {recursive: true});
  const lineOf = id => products.find(p => p.id === id);
  const appUrl = a => `/machines/${a.slug}.html`;
  const appCard = a => `<a class="card applink" href="${appUrl(a)}">${(a.clips && lineOf(a.line) && (lineOf(a.line).clips || [])[0]) ? `<span class="cthumb"><img src="${attr(lineOf(a.line).clips[0].poster)}" alt="${attr(a.name)}" loading="lazy" width="480" height="360"><span class="play">${PLAY}</span></span>` : (a.videos[0] ? `<span class="cthumb"><img src="${ytThumb(a.videos[0])}" alt="${attr(a.name)}" loading="lazy" width="480" height="360"><span class="play">${PLAY}</span></span>` : '')}<h3>${esc(a.name)}</h3><p>${esc(a.alt.join('、'))}</p><span class="more">看影片與常見問題 →</span></a>`;
  for(const a of apps){
    const line = lineOf(a.line) || {};
    const clips = a.clips ? (line.clips || []) : [];
    const related = apps.filter(b => b.slug !== a.slug && (b.line === a.line || b.slug === 'horizontal-flow-wrapper')).slice(0, 6);
    const body = `<div class="wrap"><section style="padding-top:36px"><div class="contact"><div><p style="color:var(--muted);margin:0 0 8px"><a href="/">首頁</a> › <a href="/machines/">包裝應用</a> › ${esc(a.name)}</p><p style="font-size:1.08rem">${esc(a.intro)}</p><ul class="chips">${[...new Set([a.name.replace(/包裝機.*$/, ''), ...a.alt])].filter(Boolean).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
<h2 style="font-size:1.3rem;margin:26px 0 10px">包裝重點</h2><ul>${a.points.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
<div class="btns" style="margin-top:20px"><a class="btn" href="tel:${attr(site.tel_intl)}">${ico('phone')} ${esc(site.tel)}</a><a class="btn o2" href="/contact.html?product=${encodeURIComponent(a.name.replace(/（.*?）/g, ''))}#form">詢問${esc(a.name.replace(/（.*?）/g, ''))}</a></div>
<p class="note" style="margin-top:14px">不確定能不能包？把產品尺寸、每分鐘希望幾包告訴我們。常做的產品會直接給你看之前交機的影片；比較特殊的，再請你寄樣品來評估。<a href="/contact.html">看訂購流程</a></p></div>
<div><div class="ytgrid" style="grid-template-columns:1fr">${clips.map((c, i) => `<div>${clipEmbed(c)}<h4>${esc(c.title)}</h4></div>`).join('')}${a.videos.map(id => `<div>${ytEmbed(id, V(id).title)}<h4>${esc(V(id).title)}</h4></div>`).join('')}${(!clips.length && !a.videos.length) ? `<div class="card"><h3>目前庫存請來電詢問</h3><p>中古機庫存隨時變動，來電 <a href="tel:${attr(site.tel_intl)}">${esc(site.tel)}</a> 或 <a href="tel:${attr(site.mobile_intl)}">${esc(site.mobile)}</a> 最快。</p></div>` : ''}</div></div></section>
<section class="alt" style="margin:0 -20px;padding:40px 20px"><div class="sh"><h2>常見問題</h2></div><div class="news">${a.faq.map(([q, ans]) => `<article><h3>${esc(q)}</h3><p>${esc(ans)}</p></article>`).join('')}</div></section>
<section><div class="sh"><h2>相關包裝應用</h2><a href="/machines/">全部應用 →</a></div><div class="grid">${related.map(appCard).join('')}</div></section></div>`;
    const faqLd = {'@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: a.faq.map(([q, ans]) => ({'@type': 'Question', name: q, acceptedAnswer: {'@type': 'Answer', text: ans}}))};
    const crumbLd = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{'@type': 'ListItem', position: 1, name: '首頁', item: site.url + '/'}, {'@type': 'ListItem', position: 2, name: '包裝應用', item: site.url + '/machines/'}, {'@type': 'ListItem', position: 3, name: a.name, item: site.url + appUrl(a)}]};
    const prodLd = {'@context': 'https://schema.org', '@type': 'Product', name: a.name, brand: {'@type': 'Brand', name: site.brand}, manufacturer: {'@type': 'Organization', name: site.name}, description: a.intro, url: site.url + appUrl(a), image: a.videos[0] ? ytThumb(a.videos[0]) : (clips[0] ? site.url + clips[0].poster : site.url + img(images.hero[0]))};
    const headImg = a.videos[0] ? ytThumb(a.videos[0]) : (clips[0] ? imgx(clips[0].poster, 1200) : imgx(images.about_banner[0], 1800));
    fs.writeFileSync(path.join(DIST, 'machines', a.slug + '.html'), page({title: a.seo_title || `${a.name}｜${a.alt.slice(0, 3).join('、')}｜${site.short} 台中`, desc: a.seo_desc || (a.intro.slice(0, 110).replace(/[，。]$/, '') + '。'), url: appUrl(a), body, cur: '/machines/', headImg, headTitle: a.name, headLede: `適合：${a.alt.join('、')}｜台中大里，臥式包裝機製造 30 年`, image: a.videos[0] ? ytThumb(a.videos[0]) : undefined, jsonld: [faqLd, crumbLd, prodLd]}));
  }
  const appsIndex = `<div class="wrap"><section><p style="max-width:720px">一種產品一頁：點進去看實際包裝影片、包裝重點和常見問題。沒看到你的產品？特殊尺寸、特殊包材、連托盤、倒吊式都可以客製，直接<a href="/contact.html#form">填詢問單</a>或來電 <a href="tel:${attr(site.tel_intl)}">${esc(site.tel)}</a>。</p>${products.map(p => `<h2 style="font-size:1.3rem;margin:28px 0 12px;padding-left:12px;border-left:4px solid var(--red)">${esc(p.name)}</h2><div class="grid">${apps.filter(a => a.line === p.id && a.slug !== 'horizontal-flow-wrapper').map(appCard).join('')}</div>`).join('')}<h2 style="font-size:1.3rem;margin:28px 0 12px;padding-left:12px;border-left:4px solid var(--red)">認識臥式包裝機</h2><div class="grid">${apps.filter(a => a.slug === 'horizontal-flow-wrapper').map(appCard).join('')}</div></section></div>`;
  fs.writeFileSync(path.join(DIST, 'machines', 'index.html'), page({title: `包裝應用一覽｜鳳梨酥、包子、牛軋糖、卡片、面紙、口罩包裝機｜${site.short}`, desc: '金達華臥式包裝機的所有應用：鳳梨酥、包子、蛋黃酥連托盤、果凍、麵包、冰棒、餅乾、牛軋糖、黑糖、卡片、擦手紙、抽取式衛生紙、捲筒衛生紙、口罩、免洗餐具、倒吊式與中古機，每一種都有實際影片與常見問題。', url: '/machines/', body: appsIndex, cur: '/products.html', headImg: imgx(images.video_banner[1], 1800)}));

  // 保養服務頁
  const serviceBody = `<div class="wrap"><section><div class="contact"><div><p style="font-size:1.08rem">包裝機不是買了就結束。封刀會鈍、皮帶會磨、加熱片會老化，產品換規格也要調機。金達華賣出去的每一台機器都由我們自己保養，電話 24 小時找得到人，不敢說隨傳隨到，但保證有求必應。</p>
<h2 style="font-size:1.3rem;margin:26px 0 10px">年度保養合約</h2><p>與其壞了才叫、停線等人，不如固定保養。年約內容依機型與使用量調整，常見包含：</p><ul><li>定期到廠保養（清潔、潤滑、封刀與加熱片檢查、傳動與感測器校正），次數依機型與使用量討論</li><li>常用耗材與零件供應</li><li>電話諮詢，必要時視訊看現場</li><li>產品換規格的調機諮詢</li></ul>
<h2 style="font-size:1.3rem;margin:26px 0 10px">零件與耗材</h2><p>切刀（封刀）、加熱片、皮帶、推爪、感測器等常用零件，金達華自家機型的常用零件可以供應，請告訴我們機型。我們只維修保養金達華自己的機器；用別家包裝機、想換新的，可以把機型和問題告訴我們，看過後建議怎麼換成適合的金達華機型。</p>
<h2 style="font-size:1.3rem;margin:26px 0 10px">舊機換新、改規格</h2><p>機器老了或產品換了，不一定要整台換新。可以評估改規格、換關鍵部件，或舊機折抵換新機；整理過的中古機請看<a href="/machines/used-machines.html">中古二手包裝機</a>。</p>
<div class="btns" style="margin-top:20px"><a class="btn" href="tel:${attr(site.tel_intl)}">${ico('phone')} ${esc(site.tel)}</a><a class="btn o2" href="/contact.html#form">詢問年約或零件</a></div></div>
<div><div class="card"><h3>買機器前就該問的四個售後問題</h3><ul><li>保養誰做？多久一次？</li><li>常用零件有沒有現貨？壞了幾天能到？</li><li>產品換尺寸，調機要不要錢、要多久？</li><li>人不在時，電話誰接？</li></ul><p style="margin-top:10px">這四題金達華的答案都在這一頁，也歡迎拿去問別家。</p></div>
<div class="card" style="margin-top:16px"><h3>買包裝機可以抵稅嗎？</h3><p>公司購置符合條件的智慧機械，依產業創新條例第 10 條之 1 可申請投資抵減。哪些機型可能符合、怎麼申請，整理在<a href="/subsidy.html">這一頁</a>。</p></div></div></div></section></div>`;
  fs.writeFileSync(path.join(DIST, 'service.html'), page({title: `包裝機維修、切刀與零件、年度保養｜台中${site.short}`, desc: '臥式包裝機維修與保養：切刀（封刀）、加熱片、皮帶等零件耗材，年度保養合約，舊機換新與改規格。台中大里金達華，電話 24 小時找得到人。', url: '/service.html', body: serviceBody, cur: '/service.html', headImg: imgx(images.about_banner[2], 1800), headTitle: '包裝機維修、零件與年度保養', headLede: '機器賣出去才是服務的開始。台中大里，30 年臥式包裝機製造與保養。'}));

  // 投資抵減說明頁
  const subsidyBody = `<div class="wrap"><section><div class="contact"><div><p style="font-size:1.08rem">很多老闆猶豫買包裝機，是因為一次要拿出幾十萬。其實公司購置符合條件的智慧機械，可以依<b>產業創新條例第 10 條之 1</b>申請投資抵減，直接抵營利事業所得稅。這一頁把條件整理成白話，細節請以經濟部與財政部公告、以及您的會計師意見為準。</p>
<h2 style="font-size:1.3rem;margin:26px 0 10px">目前的規定（產創條例 10-1）</h2><ul><li>適用期間：2025 年 1 月 1 日至 2029 年 12 月 31 日的投資</li><li>門檻：同一年度投資支出合計 100 萬元以上（上限 20 億元）</li><li>抵減方式二選一：支出的 5% 抵當年度營所稅，或 3% 分三年抵；每年抵減上限為當年度應納營所稅的 30%</li><li>對象：公司或有限合夥事業（獨資、合夥不適用）</li><li>要件：設備須具備「智慧技術元素」（例如數位化管理、虛實整合）並具「智慧化功能」（例如自動參數設定、自動控制、生產資訊可視化），且投資計畫要先向主管機關申請專案核准</li><li>申請時間：交貨當年度結算申報期間開始前 4 個月起，到申報截止日前，在經濟部線上系統申辦</li></ul>
<h2 style="font-size:1.3rem;margin:26px 0 10px">中小企業新方案（草案，尚未通過）</h2><p>行政院 2026 年 10 月通過「中小微企業投資抵減」草案，門檻降到 25 萬元，同樣是 5% 或分三年 3%，擬 2027 年起適用，目前還在立法院審議。通過後門檻更低，對小型食品廠更有感。</p>
<h2 style="font-size:1.3rem;margin:26px 0 10px">金達華的機器符合嗎？</h2><p>要看機型配置。配備 PLC 伺服控制、觸控人機介面、可儲存產品配方與自動參數設定的機型，較有機會符合「智慧化功能」的要件；舊式純機械式機型則不符合。詢價時告訴我們您打算申請抵減，我們會依機型提供規格說明，協助您和會計師準備投資計畫文件。</p>
<p class="note">本頁為一般性說明，不構成稅務建議。是否符合抵減、能抵多少，請以主管機關核准結果為準，並諮詢您的會計師。</p>
<div class="btns" style="margin-top:20px"><a class="btn" href="tel:${attr(site.tel_intl)}">${ico('phone')} ${esc(site.tel)}</a><a class="btn o2" href="/contact.html#form">詢價並說明要申請抵減</a></div></div>
<div><div class="card"><h3>算給你看</h3><p>假設公司買一台 120 萬元、符合條件的包裝機，當年度應納營所稅 40 萬元：</p><ul><li>選 5%：可抵 6 萬元（未超過 40 萬的 30% 上限 12 萬）</li><li>選 3% 分三年：每年抵 3.6 萬元，共 10.8 萬元</li></ul><p style="margin-top:10px;color:var(--muted);font-size:.92rem">試算僅供理解規則，實際以核定為準。</p></div></div></div></section></div>`;
  fs.writeFileSync(path.join(DIST, 'subsidy.html'), page({title: `買包裝機可以抵稅嗎？智慧機械投資抵減白話整理｜${site.short}`, desc: '公司買包裝機可依產業創新條例第 10 條之 1 申請智慧機械投資抵減：100 萬元以上、抵 5% 或分三年 3%、適用到 2029 年；中小企業 25 萬元門檻新方案審議中。金達華協助提供規格說明。', url: '/subsidy.html', body: subsidyBody, cur: '/service.html', headImg: imgx(images.video_banner[2], 1800), headTitle: '買包裝機可以抵稅嗎？', headLede: '智慧機械投資抵減的白話版，與金達華機型怎麼配合申請。'}));

  // 海外與香港客戶頁
  const overseasBody = `<div class="wrap"><section><div class="contact"><div><p style="font-size:1.08rem">金達華的機器不只在台灣運轉。香港的糕餅業者、馬來西亞的紙品廠、泰國的食品廠，都是上網搜尋找到我們、來台中看過機器後下單，用到現在。繁體中文溝通沒有隔閡，規格、交期、保固都能講清楚。</p>
<p class="note">我們與客戶簽有保密約定，網站上不公開客戶名稱、產品細節與機台配置；想知道您的產品我們做過類似的沒有，直接來信問，能說的我們私下告訴您。</p>
<h2 style="font-size:1.3rem;margin:26px 0 10px">海外訂購流程</h2><ol><li><b>告訴我們產品</b>：寄產品照片與尺寸、希望的產量、現有包材。我們常做的產品，會直接給您看之前交機的實拍影片；比較特殊的產品，再請您寄樣品到台中評估。</li><li><b>建議配置與報價</b>：依您的產品與預算提出合適的配置與報價。</li><li><b>製造與試包</b>：機器做好後，用您的產品實際試包、錄影給您看，也歡迎來台中廠驗機。</li><li><b>出貨</b>：木箱固定、海運或空運，出口文件齊備。</li><li><b>安裝與教學</b>：視訊指導安裝與操作；需要到場安裝可另議。</li><li><b>保固與零件</b>：保固期內零件空運補寄，之後零件與耗材持續供應。</li></ol>
<h2 style="font-size:1.3rem;margin:26px 0 10px">為什麼不公開價格</h2><p>同一型包裝機，餵料方式、封口規格、電壓、是否加印字或充氮，價格就不一樣；海運、保固年限也會影響。我們不報一個對誰都不準的公定價，而是先了解您的產品與預算，再把配置調到剛好夠用——預算有限的，可以分階段加配備，或先從<a href="/machines/used-machines.html">整理過的中古機</a>開始。</p>
<h2 style="font-size:1.3rem;margin:26px 0 10px">這些地區常見的產品</h2><p>老婆餅、蛋撻、月餅、雞仔餅、鳳梨酥、牛軋糖、包子、冷凍點心、廚房紙巾、擦手紙、面紙、卡片，都在我們的經驗範圍；請看<a href="/machines/">包裝應用一覽</a>的實拍影片。</p>
<div class="btns" style="margin-top:20px"><a class="btn" href="mailto:${attr(site.email)}">${ico('mail')} ${esc(site.email)}</a><a class="btn o2" href="/contact.html#form">填線上詢問單</a></div>
<p class="note" style="margin-top:14px">海外客戶請優先用 Email 或線上詢問單，附上產品照片；台灣時間週一至週五 08:00–17:30 也可直撥 ${esc(site.tel_intl)}。</p></div>
<div><div class="card"><h3>海外客戶常見問題</h3><ul><li><b>可以提供其他客戶讓我參考嗎？</b>客戶資料依保密約定不提供；我們改用完整運轉影片、試包錄影，也歡迎來台中驗機。</li><li><b>電壓不同怎麼辦？</b>依當地電壓規格製造，下單時告訴我們。</li><li><b>保固怎麼算？</b>依合約，一般自交機起算，零件問題空運補寄。</li><li><b>付款方式？</b>電匯（T/T），訂金與尾款比例於報價時說明。</li><li><b>英文溝通？</b>可以，英文資料請見 <a href="/en/">English</a>。</li></ul></div></div></div></section></div>`;
  fs.writeFileSync(path.join(DIST, 'overseas.html'), page({title: `香港包裝機｜台灣製臥式包裝機械，香港、馬來西亞、泰國客戶｜${site.short}`, desc: '香港、馬來西亞、泰國的食品與紙品廠都用金達華的臺灣製臥式包裝機。繁體中文溝通，試包錄影、海運木箱、視訊安裝、保固零件空運；客戶細節依保密約定不公開，價格依產品與配置個別報價。', url: '/overseas.html', body: overseasBody, cur: '/contact.html', headImg: imgx(images.hero[1], 1800), headTitle: '香港與海外客戶', headLede: '台灣製造、中文溝通。香港、馬來西亞、泰國都有我們的機台在運轉。'}));

  // 其他檔案
  fs.writeFileSync(path.join(DIST, '404.html'), page({title: `找不到頁面|${site.short}`, desc: '頁面不存在', url: '/404.html', body: `<div class="wrap"><section style="text-align:center"><h1>找不到這一頁</h1><p><a class="btn" href="/">回首頁</a></p></section></div>`, cur: ''}));
  fs.writeFileSync(path.join(DIST, 'favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#0B2A4A"/><text x="32" y="42" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="26" fill="#fff">KDH</text><rect x="12" y="48" width="40" height="5" rx="2.5" fill="#C8102E"/></svg>`);
  const urls = ['/', '/products.html', '/videos.html', '/gallery.html', '/about.html', '/news.html', '/contact.html', '/service.html', '/subsidy.html', '/overseas.html', '/machines/', ...apps.map(a => `/machines/${a.slug}.html`), '/en/', '/en/products.html', '/en/contact.html'];
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u => `<url><loc>${site.url}${u}</loc><lastmod>${ymd(BUILT)}</lastmod></url>`).join('')}</urlset>`);
  fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);
  fs.writeFileSync(path.join(DIST, 'llms.txt'), `# ${site.name}(${site.en}, KDH PACK)\n\n> ${site.description}\n\n電話 ${site.tel}|手機 ${site.mobile}|Email ${site.email}|地址 ${site.address}|Facebook ${site.facebook}|YouTube ${site.youtube}\n\n## 產品線\n${products.map(p => `- ${p.name}(${p.en}):${p.items.join('、')}`).join('\n')}\n\n## 包裝應用(一種產品一頁)\n${apps.map(a => `- ${a.name}:${site.url}/machines/${a.slug}.html`).join('\n')}\n\n## 頁面\n${urls.map(u => `- ${site.url}${u}`).join('\n')}\n`);
  fs.writeFileSync(path.join(DIST, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n/llms.txt\n  Content-Type: text/plain; charset=utf-8\n`);
  console.log('build ok →', DIST);
}
main().catch(e => { console.error(e); process.exit(1); });
