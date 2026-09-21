// 阿康的科技生活站——靜態產生器(零依賴,Node 18+)
// 產出 dist/:首頁、影片、科技快訊(每篇一頁)、熱門股快照、關於、sitemap/rss/feed.json/llms.txt/robots.txt
// 建站時抓 YouTube 頻道 RSS 與 AI 工具的雷達資料;抓不到就用 content/cache 的上一版,永遠不會建失敗
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = __dirname, DIST = path.join(ROOT, 'dist'), C = path.join(ROOT, 'content');
const site = JSON.parse(fs.readFileSync(path.join(C, 'site.json'), 'utf8'));
const NAMES = (() => { try{ return JSON.parse(fs.readFileSync(path.join(C, 'names.json'), 'utf8')); }catch(e){ return {}; } })();
const BUILT = new Date();
// 日期一律先過 asDate:缺少或格式壞掉的來源資料回 null,絕不讓 toISOString 拋 RangeError 把建站打斷
const asDate = d => { if(d == null || d === '') return null; const t = new Date(d).getTime(); return isNaN(t) ? null : new Date(t); };
const newestFirst = (a, b) => { const x = asDate(a), y = asDate(b); if(!x && !y) return 0; if(!x) return 1; if(!y) return -1; return y.getTime() - x.getTime(); };   // 新的排前面,沒日期的排最後
const TZ = d => new Date((asDate(d) || BUILT).getTime() + 8 * 3600e3);   // 台北時間顯示(無效日期退回建站時間)
const ymd = d => TZ(d).toISOString().slice(0, 10);
const iso = d => (asDate(d) || BUILT).toISOString();
const ymdOr = d => asDate(d) ? ymd(d) : '';   // 上傳日還沒抓到(Shorts 常見)就留空,下次建站補上
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const attr = esc;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
const fetchText = async (url, ms = 12000, headers = {}) => {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
  try{ const r = await fetch(url, {signal: ctl.signal, headers: Object.assign({'user-agent': UA, 'accept-language': 'en-US,en;q=0.9'}, headers)}); if(!r.ok) throw new Error('HTTP ' + r.status); return await r.text(); }
  finally{ clearTimeout(t); }
};
const readCache = f => { try{ return JSON.parse(fs.readFileSync(path.join(C, 'cache', f), 'utf8')); }catch(e){ return null; } };
const writeCache = (f, v) => { try{ fs.writeFileSync(path.join(C, 'cache', f), JSON.stringify(v)); }catch(e){} };

// ── Markdown(夠用就好:標題、段落、粗體、連結、圖片、清單、引用、YouTube 連結自動嵌入) ──
function md(src){
  const inline = t => esc(t)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/(^|[^"'>=])(https?:\/\/[^\s<]+)/g, (m, pre, u) => `${pre}<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
  const out = []; let list = null, para = [];
  const flushP = () => { if(para.length){ out.push(`<p>${para.map(inline).join('<br>')}</p>`); para = []; } };
  const flushL = () => { if(list){ out.push(`<${list.t}>${list.items.map(i => `<li>${inline(i)}</li>`).join('')}</${list.t}>`); list = null; } };
  for(const raw of src.split('\n')){
    const line = raw.replace(/\s+$/, '');
    const yt = line.match(/^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
    if(yt){ flushP(); flushL(); out.push(ytEmbed(yt[1])); continue; }
    const h = line.match(/^(#{1,3})\s+(.*)/);
    if(h){ flushP(); flushL(); const n = h[1].length <= 2 ? 2 : 3; out.push(`<h${n}>${inline(h[2])}</h${n}>`); continue; }   // 文章標題已是 h1:#、## → h2,### → h3
    const li = line.match(/^\s*[-*]\s+(.*)/), oli = line.match(/^\s*\d+[.)]\s+(.*)/);
    if(li || oli){ flushP(); const t = li ? 'ul' : 'ol'; if(!list || list.t !== t){ flushL(); list = {t, items: []}; } list.items.push((li || oli)[1]); continue; }
    if(/^\s*>\s?/.test(line)){ flushP(); flushL(); out.push(`<blockquote>${inline(line.replace(/^\s*>\s?/, ''))}</blockquote>`); continue; }
    if(!line.trim()){ flushP(); flushL(); continue; }
    flushL(); para.push(line);
  }
  flushP(); flushL();
  return out.join('\n');
}
const ytEmbed = id => `<div class="yt"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="YouTube video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
const ytId = u => { const m = String(u || '').match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/); return m ? m[1] : ''; };

// ── 讀貼文 ──
function loadPosts(){
  const dir = path.join(C, 'posts'); if(!fs.existsSync(dir)) return [];
  const posts = [];
  for(const f of fs.readdirSync(dir)){
    if(!f.endsWith('.md')) continue;
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    const fm = {}; let body = raw;
    if(m){ body = m[2]; for(const l of m[1].split('\n')){ const k = l.match(/^([\w-]+):\s*(.*)$/); if(k) fm[k[1].trim()] = k[2].trim(); } }
    const slug = f.replace(/\.md$/, '');
    const date = fm.date || slug.slice(0, 10);
    const tags = (fm.tags || '').split(/[,，]/).map(s => s.trim()).filter(Boolean);
    const text = body.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/[#>*\-]/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\s+/g, ' ').trim();
    const summary = fm.summary || text.slice(0, 120);
    let cover = fm.cover || '';
    const yid = ytId(fm.youtube);
    if(!cover && yid) cover = `https://i.ytimg.com/vi/${yid}/hqdefault.jpg`;
    if(!cover){ const im = body.match(/!\[[^\]]*\]\(([^)\s]+)\)/); if(im) cover = im[1]; }
    posts.push({slug, url: `/posts/${slug}.html`, title: fm.title || slug, date, category: fm.category || '科技', tags, cover, summary, youtube: fm.youtube || '', ig: fm.ig || '', fb: fm.fb || '', html: md(body), text, words: text.length});
  }
  return posts.sort((a, b) => b.date.localeCompare(a.date) || b.slug.localeCompare(a.slug));
}

// ── 影片來源(三層備援):① 頻道 RSS ② 直接讀頻道 /videos 與 /shorts 頁面(YouTube 2026-09 起 RSS 常 404)③ 快取
// 只要拿到影片 ID,沒有精確日期的就到觀看頁抓 publishDate 與觀看數(每次最多 12 支);快取會寫回 GitHub,日期與觀看數跨建站保留
const parseViews = t => { const m = String(t || '').replace(/,/g, '').match(/([\d.]+)\s*([KMB萬億])?/i); if(!m) return 0; const n = parseFloat(m[1]); const u = (m[2] || '').toUpperCase(); return Math.round(n * (u === 'K' ? 1e3 : u === 'M' ? 1e6 : u === 'B' ? 1e9 : u === '萬' ? 1e4 : u === '億' ? 1e8 : 1)); };
const relDays = t => { const m = String(t || '').match(/(\d+)\s*(second|minute|hour|day|week|month|year|秒|分鐘|小時|天|週|個月|年)/); if(!m) return null; const n = +m[1], u = m[2]; return /second|minute|hour|秒|分|小時/.test(u) ? 0 : /day|天/.test(u) ? n : /week|週/.test(u) ? n * 7 : /month|個月/.test(u) ? n * 30 : n * 365; };
const walk = (o, fn) => { if(!o || typeof o !== 'object') return; if(Array.isArray(o)){ o.forEach(x => walk(x, fn)); return; } fn(o); for(const k in o) walk(o[k], fn); };
async function scrapeChannel(kind){
  const html = await fetchText(`https://www.youtube.com/${site.youtubeHandle || '@goodskang'}/${kind}?hl=en`, 20000, {cookie: 'CONSENT=YES+cb; SOCS=CAISEwgDEgk2ODE4NTQwOTgaAmVuIAEaBgiA_LyuBg'});
  const m = html.match(/var ytInitialData = (\{[\s\S]*?\});\s*<\/script>/); if(!m) throw new Error('no ytInitialData');
  const data = JSON.parse(m[1]); const out = [], seen = new Set();
  walk(data, o => {
    if(o.videoRenderer && o.videoRenderer.videoId){ const v = o.videoRenderer; if(seen.has(v.videoId)) return; seen.add(v.videoId);
      out.push({id: v.videoId, title: (v.title?.runs || []).map(r => r.text).join(''), views: parseViews(v.viewCountText?.simpleText), rel: relDays(v.publishedTimeText?.simpleText), short: kind === 'shorts'}); }
    if(o.lockupViewModel && o.lockupViewModel.contentId && /^[\w-]{11}$/.test(o.lockupViewModel.contentId)){ const l = o.lockupViewModel; if(seen.has(l.contentId)) return; seen.add(l.contentId);
      const md = l.metadata?.lockupMetadataViewModel; const parts = (md?.metadata?.contentMetadataViewModel?.metadataRows || []).flatMap(r => (r.metadataParts || []).map(p => p.text?.content || ''));
      out.push({id: l.contentId, title: md?.title?.content || '', views: parseViews(parts.find(p => /view|觀看/.test(p))), rel: relDays(parts.find(p => /ago|前/.test(p))), short: kind === 'shorts'}); }
    if(o.shortsLockupViewModel){ const sl = o.shortsLockupViewModel; const id = sl.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId || sl.entityId?.replace(/^.*?([\w-]{11})$/, '$1'); if(!id || !/^[\w-]{11}$/.test(id) || seen.has(id)) return; seen.add(id);
      out.push({id, title: sl.overlayMetadata?.primaryText?.content || sl.accessibilityText || '', views: parseViews(sl.overlayMetadata?.secondaryText?.content), rel: null, short: true}); }
  });
  return out;
}
async function watchMeta(id){   // 觀看頁:精確上傳日與觀看數
  const html = await fetchText(`https://www.youtube.com/watch?v=${id}&hl=en`, 15000, {cookie: 'CONSENT=YES+cb'});
  const d = (html.match(/"publishDate":"(\d{4}-\d{2}-\d{2})/) || [])[1], vc = (html.match(/"viewCount":"(\d+)"/) || [])[1], t = (html.match(/<meta name="title" content="([^"]*)"/) || [])[1];
  const desc = (html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/) || [])[1];
  return {published: d ? d + 'T12:00:00+08:00' : '', views: Number(vc || 0), title: t ? t.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'") : '', desc: desc ? JSON.parse('"' + desc + '"').replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim().slice(0, 300) : ''};
}
async function loadVideos(){
  const cache = readCache('videos.json') || [];
  const map = new Map(); for(const v of cache) map.set(v.id, Object.assign({}, v));
  let fresh = [], src = '';
  try{
    const xml = await fetchText(`https://www.youtube.com/feeds/videos.xml?channel_id=${site.youtubeChannelId}`);
    for(const e of xml.split('<entry>').slice(1)){
      const g = re => { const m = e.match(re); return m ? m[1] : ''; };
      const id = g(/<yt:videoId>([^<]+)</); if(!id) continue;
      fresh.push({id, title: g(/<title>([^<]*)<\/title>/).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>'), published: g(/<published>([^<]+)</), views: Number(g(/<media:statistics views="(\d+)"/) || 0), desc: g(/<media:description>([\s\S]*?)<\/media:description>/).replace(/&amp;/g, '&').replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim().slice(0, 300)});
    }
    if(fresh.length) src = 'rss';
  }catch(e){ console.warn('[videos] RSS 失敗:', e.message); }
  if(!fresh.length){
    for(const kind of ['videos', 'shorts']){ try{ const a = await scrapeChannel(kind); fresh.push(...a); }catch(e){ console.warn(`[videos] 頻道 ${kind} 頁失敗:`, e.message); } }
    if(fresh.length) src = 'page';
  }
  // 合併:頁面抓到的沒有精確日期 → 先用快取的;快取也沒有 → 去觀看頁抓(每次最多 12 支)
  let need = [];
  for(const v of fresh){
    const old = map.get(v.id) || {};
    const rec = Object.assign({}, old, {id: v.id, title: v.title || old.title || '', views: v.views || old.views || 0, desc: v.desc || old.desc || '', short: v.short != null ? v.short : old.short});
    if(v.published) rec.published = v.published;
    else if(!old.published || old.approx){ if(v.rel != null){ rec.published = new Date(Date.now() - v.rel * 864e5).toISOString(); rec.approx = true; } need.push(rec); }
    map.set(v.id, rec);
  }
  need.sort((a, b) => (a.published ? 1 : 0) - (b.published ? 1 : 0));   // 完全沒日期的先抓
  for(const rec of need.slice(0, 12)){ try{ const w = await watchMeta(rec.id); if(w.published){ rec.published = w.published; rec.approx = false; } if(w.views) rec.views = w.views; if(w.title && !rec.title) rec.title = w.title; if(w.desc && !rec.desc) rec.desc = w.desc; }catch(e){ console.warn('[videos] 觀看頁失敗:', rec.id, e.message); } if(!rec.published){ rec.published = new Date().toISOString(); rec.approx = true; } }
  const all = [...map.values()].filter(v => v.id && v.title).sort((a, b) => newestFirst(a.published, b.published));
  console.log(`[videos] 來源 ${src || 'cache'}:新 ${fresh.length} 支,合計 ${all.length} 支`);
  if(fresh.length){ const kept = all.slice(0, 300); writeCache('videos.json', kept); await pushCache('content/cache/videos.json', JSON.stringify(kept)); }
  return all;
}
// 快取寫回 GitHub(有 GITHUB_TOKEN 才做;commit 訊息帶 [skip netlify] 不會觸發重建)
async function pushCache(p, body){
  const TOKEN = process.env.GITHUB_TOKEN, REPO = process.env.GITHUB_REPO, BR = process.env.GITHUB_BRANCH || 'main', BASE = (process.env.GITHUB_BASE || 'goodskang-site').replace(/^\/|\/$/g, '');
  if(!TOKEN || !REPO) return;
  const full = (BASE ? BASE + '/' : '') + p;
  try{
    const h = {authorization: `Bearer ${TOKEN}`, accept: 'application/vnd.github+json', 'user-agent': 'goodskang-site', 'content-type': 'application/json'};
    const cur = await fetch(`https://api.github.com/repos/${REPO}/contents/${full}?ref=${BR}`, {headers: h}).then(r => r.ok ? r.json() : null);
    if(cur && Buffer.from(cur.content || '', 'base64').toString('utf8') === body) return;
    const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${full}`, {method: 'PUT', headers: h, body: JSON.stringify({message: `cache: ${p} [skip netlify]`, branch: BR, content: Buffer.from(body, 'utf8').toString('base64'), sha: cur ? cur.sha : undefined})});
    console.log('[cache] 寫回 GitHub', p, r.status);
  }catch(e){ console.warn('[cache] 寫回失敗:', e.message); }
}

// ── 抓 AI 工具的雷達(強勢股 scan + 話題 news) ──
async function loadHot(){
  const cache = readCache('hot.json') || {scan: null, news: null};
  const out = {fetchedAt: BUILT.toISOString(), scan: cache.scan, news: cache.news};
  try{ const j = JSON.parse(await fetchText(site.toolFunctions + '/scan')); if(j && (j.list || Array.isArray(j))){ out.scan = Array.isArray(j) ? {list: j} : j; } }catch(e){ console.warn('[hot] scan 失敗,用快取:', e.message); }
  try{ const j = JSON.parse(await fetchText(site.toolFunctions + '/news', 20000)); if(j && (j.top || []).length >= 3) out.news = j; }catch(e){ console.warn('[hot] news 失敗,用快取:', e.message); }
  writeCache('hot.json', out);
  return out;
}

// ── 自動抓 IG / FB 貼文(Meta Graph API;需環境變數 META_TOKEN + IG_USER_ID / FB_PAGE_ID)──
// 每次建站抓最近 50 則,圖片下載到 dist/img/social/(IG 的 CDN 圖檔網址會過期,所以要抓下來自己放)
// 同一篇 IG/FB 交叉發文只留一篇(比對前 60 字),FB 連結掛在同一篇底下
async function loadSocial(){
  const token = process.env.META_TOKEN, igToken = process.env.IG_TOKEN;
  if(!token && !igToken) return [];
  const G = 'https://graph.facebook.com/v21.0';
  const imgDir = path.join(DIST, 'img', 'social'); fs.mkdirSync(imgDir, {recursive: true});
  const grab = async (url, id) => {   // 下載圖到本站;失敗回空字串
    try{ const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 15000);
      const r = await fetch(url, {signal: ctl.signal}); clearTimeout(t); if(!r.ok) return '';
      const buf = Buffer.from(await r.arrayBuffer()); if(buf.length < 1000) return '';
      const ext = /png/i.test(r.headers.get('content-type') || '') ? 'png' : 'jpg';
      fs.writeFileSync(path.join(imgDir, `${id}.${ext}`), buf); return `/img/social/${id}.${ext}`; }catch(e){ return ''; }
  };
  const tagsOf = t => [...String(t).matchAll(/#([^\s#]+)/g)].map(m => m[1]).slice(0, 8);
  const titleOf = t => { const first = String(t).split('\n').map(x => x.trim()).find(x => x && !/^#/.test(x)) || ''; return first.replace(/#\S+/g, '').trim().slice(0, 48) || '新貼文'; };
  const mk = (src, id, text, date, permalink, imgUrl, extra) => ({slug: `${src}-${id}`, url: `/posts/${src}-${id}.html`, title: titleOf(text), date: ymd(date), category: src === 'ig' ? '科技快訊' : '科技快訊', tags: tagsOf(text), cover: '', coverRemote: imgUrl || '', summary: String(text).replace(/#\S+/g, '').replace(/\s+/g, ' ').trim().slice(0, 120), youtube: (String(text).match(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/) || [''])[0], ig: src === 'ig' ? permalink : '', fb: src === 'fb' ? permalink : '', html: md(String(text)), text: String(text).replace(/\s+/g, ' ').trim(), words: String(text).length, source: src, auto: true, ...extra});
  const out = [];
  // 路線 A(最簡單):Instagram API with Instagram Login——只要 IG 帳號本身,不需要粉專;Meta 後台「產生權杖」一鍵取得,60 天到期前再按一次
  try{
    if(igToken){
      const j = JSON.parse(await fetchText(`https://graph.instagram.com/v21.0/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=50&access_token=${igToken}`, 20000));
      for(const m of (j.data || [])){ if(!m.caption) continue; out.push(mk('ig', m.id, m.caption, m.timestamp, m.permalink, m.media_type === 'VIDEO' ? (m.thumbnail_url || m.media_url) : m.media_url, {})); }
    }
  }catch(e){ console.warn('[social] IG(Instagram Login) 抓取失敗:', e.message); }
  // 路線 B:透過粉專的 Graph API(META_TOKEN + IG_USER_ID / FB_PAGE_ID)
  try{
    if(token && process.env.IG_USER_ID && !out.length){
      const j = JSON.parse(await fetchText(`${G}/${process.env.IG_USER_ID}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=50&access_token=${token}`, 20000));
      for(const m of (j.data || [])){ if(!m.caption) continue; out.push(mk('ig', m.id, m.caption, m.timestamp, m.permalink, m.media_type === 'VIDEO' ? (m.thumbnail_url || m.media_url) : m.media_url, {})); }
    }
  }catch(e){ console.warn('[social] IG 抓取失敗:', e.message); }
  try{
    if(token && process.env.FB_PAGE_ID){
      const j = JSON.parse(await fetchText(`${G}/${process.env.FB_PAGE_ID}/posts?fields=id,message,created_time,permalink_url,full_picture&limit=50&access_token=${token}`, 20000));
      for(const m of (j.data || [])){ if(!m.message) continue;
        const key = String(m.message).replace(/\s+/g, '').slice(0, 60);
        const dup = out.find(p => p.source === 'ig' && p.text.replace(/\s+/g, '').slice(0, 60) === key);
        if(dup){ dup.fb = m.permalink_url; continue; }   // 交叉發文:併進 IG 那篇
        out.push(mk('fb', m.id.replace(/[^\w-]/g, '_'), m.message, m.created_time, m.permalink_url, m.full_picture, {})); }
    }
  }catch(e){ console.warn('[social] FB 抓取失敗:', e.message); }
  for(const p of out){ if(p.coverRemote){ p.cover = await grab(p.coverRemote, p.slug); if(!p.cover && p.youtube) p.cover = `https://i.ytimg.com/vi/${ytId(p.youtube)}/hqdefault.jpg`; } else if(p.youtube) p.cover = `https://i.ytimg.com/vi/${ytId(p.youtube)}/hqdefault.jpg`; }
  console.log(`[social] IG/FB 自動貼文 ${out.length} 篇`);
  return out;
}

// ── 版型 ──
const CSS = `
:root{--bg:#0d1117;--card:#161b22;--border:#30363d;--text:#e6edf3;--muted:#8b949e;--accent:#58a6ff;--gold:#d29922;--red:#f85149;--green:#3fb950}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--text);font-family:"Noto Sans TC",-apple-system,"PingFang TC","Microsoft JhengHei",sans-serif;line-height:1.7}
a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
img{max-width:100%;height:auto}
.wrap{max-width:1120px;margin:0 auto;padding:0 16px}
header.top{position:sticky;top:0;z-index:50;background:rgba(13,17,23,.92);backdrop-filter:blur(10px);border-bottom:1px solid var(--border)}
.nav{display:flex;align-items:center;gap:14px;height:58px}
.logo{display:flex;align-items:center;gap:8px;font-weight:900;font-size:1.05rem;color:var(--text);white-space:nowrap}
.logo b{color:var(--accent)}
.menu{display:flex;gap:4px;margin-left:auto;overflow-x:auto;scrollbar-width:none}
.menu a{padding:6px 10px;border-radius:8px;color:var(--muted);font-weight:600;font-size:.92rem;white-space:nowrap}
.menu a.on,.menu a:hover{color:var(--text);background:rgba(88,166,255,.12);text-decoration:none}
.hero{display:grid;grid-template-columns:1.4fr 1fr;gap:16px;margin:18px 0}
@media(max-width:820px){.hero{grid-template-columns:1fr}}
.card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;overflow:hidden}
.hero .main{padding:0}
.hero .main .yt{border-radius:14px 14px 0 0}
.hero .main .cap{padding:12px 16px}
.hero .side .item{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)}
.hero .side .item:last-child{border-bottom:0}
.hero .side img{width:96px;height:64px;object-fit:cover;border-radius:8px;flex:none}
.sec{display:flex;align-items:baseline;gap:10px;margin:26px 0 10px}
.sec h2{margin:0;font-size:1.25rem}.sec a{margin-left:auto;font-size:.9rem}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px}
.v{background:var(--card);border:1px solid var(--border);border-radius:12px;overflow:hidden;transition:transform .15s}
.v:hover{transform:translateY(-2px)}.v img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block}
.v .t{padding:10px 12px;font-weight:700;font-size:.95rem;line-height:1.5;color:var(--text)}
.v .m{padding:0 12px 10px;color:var(--muted);font-size:.8rem}
.list .row{display:grid;grid-template-columns:150px 1fr;gap:14px;padding:12px 0;border-bottom:1px solid var(--border)}
.list .row img{width:150px;height:96px;object-fit:cover;border-radius:10px}
.list .row h3{margin:0 0 4px;font-size:1.05rem;line-height:1.45}
.list .row p{margin:0;color:var(--muted);font-size:.9rem}
.tag{display:inline-block;padding:1px 9px;border-radius:999px;border:1px solid var(--border);font-size:.75rem;color:var(--muted);margin-right:6px}
.cat{color:var(--gold);font-weight:700;font-size:.8rem}
@media(max-width:560px){.list .row{grid-template-columns:110px 1fr}.list .row img{width:110px;height:72px}}
.yt{position:relative;aspect-ratio:16/9;background:#000}.yt iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.cta{display:grid;grid-template-columns:1.2fr 1fr;gap:16px;align-items:center;background:linear-gradient(135deg,rgba(88,166,255,.14),rgba(210,153,34,.10));border:1px solid var(--accent);border-radius:16px;padding:22px}
@media(max-width:820px){.cta{grid-template-columns:1fr}}
.cta h2{margin:0 0 6px;font-size:1.4rem}.cta p{margin:0 0 12px;color:var(--muted)}
.btn{display:inline-block;padding:11px 18px;border-radius:10px;background:var(--accent);color:#0d1117;font-weight:800;text-decoration:none}
.btn:hover{text-decoration:none;filter:brightness(1.1)}
.btn.o{background:transparent;color:var(--accent);border:1px solid var(--accent)}
.feat{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px}
.feat div{background:rgba(13,17,23,.6);border:1px solid var(--border);border-radius:10px;padding:10px;font-size:.88rem}
.hot{display:grid;grid-template-columns:1fr 1fr;gap:14px}@media(max-width:820px){.hot{grid-template-columns:1fr}}
.stock{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border);font-size:.95rem}
.stock:last-child{border-bottom:0}.up{color:var(--red)}.down{color:var(--green)}
.stock .nm{font-weight:700}.stock .sub{color:var(--muted);font-size:.8rem}
.chips a{display:inline-block;padding:4px 12px;border-radius:999px;border:1px solid var(--border);background:rgba(88,166,255,.08);margin:3px 6px 3px 0;font-weight:700;font-size:.88rem}
article{max-width:780px;margin:0 auto}
article h1{font-size:1.7rem;line-height:1.35;margin:14px 0 6px}
article .meta{color:var(--muted);font-size:.9rem;margin-bottom:14px}
article .body{font-size:1.05rem}article .body h2{font-size:1.25rem;margin-top:26px;border-left:4px solid var(--accent);padding-left:10px}
article .body img{border-radius:12px;margin:8px 0}article .body blockquote{border-left:3px solid var(--gold);margin:12px 0;padding:6px 12px;color:var(--muted)}
.cover{width:100%;max-height:440px;object-fit:cover;border-radius:14px}
.social{display:flex;gap:10px;flex-wrap:wrap}
.social a{padding:8px 14px;border-radius:10px;border:1px solid var(--border);background:var(--card);font-weight:700}
footer{margin:40px 0 20px;padding-top:18px;border-top:1px solid var(--border);color:var(--muted);font-size:.85rem;line-height:1.8}
.disc{margin-top:8px;padding:8px 12px;border:1px dashed var(--gold);border-radius:8px;color:var(--gold);font-size:.82rem}
.milestone{display:grid;grid-template-columns:90px 1fr;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)}
.milestone b{color:var(--gold)}
.pill{display:inline-block;padding:2px 10px;border-radius:999px;background:rgba(210,153,34,.15);color:var(--gold);font-size:.78rem;font-weight:700}
`;

const NAV = [['/', '首頁'], ['/videos.html', '📺 影片'], ['/posts.html', '📰 科技快訊'], ['/hot.html', '📈 熱門股'], [site.tool, '🧮 AI 股票工具'], ['/about.html', '關於阿康 / 合作']];
function page({title, desc, url, body, jsonld = [], image, type = 'website', noindex = false, cur = ''}){
  const full = url.startsWith('http') ? url : site.url + url;
  const img = image || `${site.url}/og.png`;
  const ld = [{'@context': 'https://schema.org', '@type': 'WebSite', name: site.name, url: site.url, potentialAction: {'@type': 'SearchAction', target: site.url + '/posts.html?q={search_term_string}', 'query-input': 'required name=search_term_string'}},
    {'@context': 'https://schema.org', '@type': 'Person', name: site.author, alternateName: 'GOODSKANG', url: site.url, email: site.email, sameAs: [site.youtube, site.instagram, site.facebook, site.tool], jobTitle: '科技 YouTuber / 台股 AI 工具開發者', description: site.about},
    ...jsonld];
  return `<!DOCTYPE html><html lang="zh-Hant-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${attr(desc)}">
<link rel="canonical" href="${full}">
${noindex ? '<meta name="robots" content="noindex,nofollow">' : '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">'}
<meta property="og:type" content="${type}"><meta property="og:site_name" content="${attr(site.name)}"><meta property="og:locale" content="zh_TW">
<meta property="og:title" content="${attr(title)}"><meta property="og:description" content="${attr(desc)}"><meta property="og:url" content="${full}"><meta property="og:image" content="${attr(img)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${attr(title)}"><meta name="twitter:description" content="${attr(desc)}"><meta name="twitter:image" content="${attr(img)}">
<link rel="alternate" type="application/rss+xml" title="${attr(site.name)} RSS" href="${site.url}/rss.xml">
<link rel="alternate" type="application/feed+json" title="${attr(site.name)} JSON Feed" href="${site.url}/feed.json">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://i.ytimg.com">
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
${site.ga ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${site.ga}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${site.ga}');</script>` : ''}
</head><body>
<header class="top"><div class="wrap nav"><a class="logo" href="/">🏠 阿康 <b>GOODSKANG</b></a><nav class="menu">${NAV.map(([h, t]) => `<a href="${h}"${cur === h ? ' class="on"' : ''}${h.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`).join('')}</nav></div></header>
<main class="wrap">${body}</main>
<footer class="wrap">
<div class="social"><a href="${site.youtube}" target="_blank" rel="noopener">▶ YouTube</a><a href="${site.instagram}" target="_blank" rel="noopener">📷 Instagram</a><a href="${site.facebook}" target="_blank" rel="noopener">📘 Facebook</a><a href="${site.tool}" target="_blank" rel="noopener">🧮 台股 AI 作戰室</a><a href="mailto:${site.email}">✉️ 合作邀約</a></div>
<p style="margin-top:12px;">© ${BUILT.getFullYear()} ${esc(site.name)}(GOODSKANG)・本站內容為原創,未經授權禁止複製或商業使用・<a href="/rss.xml">RSS</a>・<a href="/llms.txt">llms.txt</a>・最後更新 ${ymd(BUILT)}</p>
<div class="disc">⚠️ 股市相關內容皆為歷史統計與公開資料整理,非投資建議,損益自負。</div>
</footer></body></html>`;
}
const vCard = v => `<a class="v" href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener"><img src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="${attr(v.title)}" loading="lazy"><div class="t">${esc(v.title)}</div><div class="m">${[ymdOr(v.published), v.views ? `${Number(v.views).toLocaleString('zh-TW')} 次觀看` : ''].filter(Boolean).join('・')}</div></a>`;
const pRow = p => `<div class="row"><a href="${p.url}">${p.cover ? `<img src="${attr(p.cover)}" alt="${attr(p.title)}" loading="lazy">` : `<div style="width:150px;height:96px;border-radius:10px;background:rgba(88,166,255,.1);display:flex;align-items:center;justify-content:center;font-size:2rem;">📰</div>`}</a><div><span class="cat">${esc(p.category)}</span> <span style="color:var(--muted);font-size:.8rem;">${p.date}</span>${p.auto ? `<span class="tag">${p.source === 'ig' ? '📷 IG' : '📘 FB'}</span>` : ''}<h3><a href="${p.url}" style="color:var(--text);">${esc(p.title)}</a></h3><p>${esc(p.summary)}</p></div></div>`;
const nmOf = id => NAMES[id] || id;
function hotBlock(hot){
  const list = ((hot.scan && hot.scan.list) || []).slice(0, 8), top = ((hot.news && hot.news.top) || []).slice(0, 8);
  const link = id => `${site.tool}?s=${encodeURIComponent(id)}`;
  const a = list.length ? list.map(h => `<div class="stock"><span><a class="nm" href="${link(h.id)}" target="_blank" rel="noopener">${esc((h.name || h.id).replace(/\*/g, ''))}</a> <span class="sub">${h.id}${h.k ? '・🔥 人氣' : ''}</span></span><span><b>${h.c}</b> <span class="up">▲ ${Number(h.pct).toFixed(2)}%</span> <span class="sub">${(h.val / 1e8).toFixed(1)} 億</span></span></div>`).join('') : '<p style="color:var(--muted);">今日資料更新中。</p>';
  const b = top.length ? top.map(x => `<div class="stock"><span><a class="nm" href="${link(x.id)}" target="_blank" rel="noopener">${esc(nmOf(x.id))}</a> <span class="sub">${x.id}</span></span><span class="sub">📰 ${x.n} 則</span></div>`).join('') : '<p style="color:var(--muted);">今日資料更新中。</p>';
  const themes = ((hot.news && hot.news.themes) || []).slice(0, 4).map(t => `<span class="pill">${esc(t.name)}</span> ${(t.stocks || []).slice(0, 4).map(s => `<a href="${link(s.id)}" target="_blank" rel="noopener">${esc(nmOf(s.id))}</a>`).join('、')}`).join(' <span style="opacity:.4">|</span> ');
  return `<div class="hot"><div class="card"><h3 style="margin:0 0 8px;">⚡ 強勢股雷達 <span class="sub" style="color:var(--muted);font-size:.8rem;">${esc((hot.scan && hot.scan.d) || '')} 收盤・成交值最大的上漲股與漲停股</span></h3>${a}</div><div class="card"><h3 style="margin:0 0 8px;">📰 話題雷達 <span style="color:var(--muted);font-size:.8rem;">${esc((hot.news && hot.news.day) || '')} 新聞被點名次數</span></h3>${b}${themes ? `<p style="margin:10px 0 0;font-size:.9rem;line-height:2;">🎯 今日主題:${themes}</p>` : ''}</div></div><p class="disc">依證交所/櫃買公開資料與新聞報導則數客觀排序,非選股建議;點任一檔可直接到 AI 作戰室看五燈檢查表與交易計畫卡。</p>`;
}

// ── 產出 ──
async function main(){
  fs.rmSync(DIST, {recursive: true, force: true}); fs.mkdirSync(path.join(DIST, 'posts'), {recursive: true});
  fs.mkdirSync(path.join(DIST, 'img'), {recursive: true});
  const manual = loadPosts();
  const [videos, hot, social] = await Promise.all([loadVideos(), loadHot(), loadSocial()]);
  // 手動貼文優先;自動抓的 IG/FB 貼文若手動已寫過(同一個 IG 連結)就略過
  const posts = manual.concat(social.filter(sp => !manual.some(mp => (mp.ig && mp.ig === sp.ig) || (mp.fb && mp.fb === sp.fb)))).sort((a, b) => b.date.localeCompare(a.date) || b.slug.localeCompare(a.slug));
  console.log(`posts ${posts.length}, videos ${videos.length}, hot ${(hot.scan && hot.scan.list || []).length}/${(hot.news && hot.news.top || []).length}`);
  // 靜態檔
  if(fs.existsSync(path.join(C, 'img'))) fs.cpSync(path.join(C, 'img'), path.join(DIST, 'img'), {recursive: true});
  if(fs.existsSync(path.join(ROOT, 'static'))) fs.cpSync(path.join(ROOT, 'static'), DIST, {recursive: true});
  if(fs.existsSync(path.join(ROOT, 'admin'))) fs.cpSync(path.join(ROOT, 'admin'), path.join(DIST, 'admin'), {recursive: true});
  fs.writeFileSync(path.join(DIST, 'favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0d1117"/><rect x="24" y="14" width="16" height="30" rx="4" fill="#f85149"/><rect x="31" y="6" width="2" height="8" fill="#f85149"/><rect x="31" y="44" width="2" height="10" fill="#f85149"/><circle cx="28" cy="26" r="2" fill="#0d1117"/><circle cx="36" cy="26" r="2" fill="#0d1117"/><path d="M27 34q5 4 10 0" stroke="#0d1117" stroke-width="2" fill="none"/></svg>`);
  // 首頁:大圖=最新一支;右欄「本週影片」=7 天內的影片,觀看數高→低、同觀看數新→舊;不足 4 支就用最新的補
  const latest = videos.find(v => asDate(v.published)) || videos[0];
  const wk = Date.now() - 7 * 864e5;
  const week = videos.filter(v => v.id !== (latest && latest.id) && new Date(v.published).getTime() >= wk).sort((a, b) => (b.views || 0) - (a.views || 0) || newestFirst(a.published, b.published));
  const vid4 = week.concat(videos.filter(v => v.id !== (latest && latest.id) && !week.includes(v))).slice(0, 4);
  const toolFeat = ['🚦 五燈順勢檢查表', '🛡 防守位與部位計算', '📋 交易計畫卡(5/10/20 日歷史統計)', '📈 話題雷達・強勢股雷達', '🐢 六種存股策略回測', '💰 本益比體檢'];
  const ctaHtml = `<div class="cta"><div><h2>🧮 阿康的台股 AI 作戰室——免費・免註冊</h2><p>打一檔代號:五燈檢查表、標註 K 線、防守與部位、交易計畫卡馬上出來;想存股就做六種策略回測。不報明牌、不喊進出,把數據攤開你自己決定。</p><a class="btn" href="${site.tool}" target="_blank" rel="noopener">開啟工具 →</a> <a class="btn o" href="/hot.html">看今日熱門股</a></div><div class="feat">${toolFeat.map(f => `<div>${f}</div>`).join('')}</div></div>`;
  // 首頁
  const home = `
<section class="hero">
  <div class="card main">${latest ? `${ytEmbed(latest.id)}<div class="cap"><span class="pill">${['最新影片', ymdOr(latest.published)].filter(Boolean).join('・')}</span><h2 style="margin:6px 0 4px;font-size:1.15rem;line-height:1.45;"><a href="https://www.youtube.com/watch?v=${latest.id}" target="_blank" rel="noopener" style="color:var(--text)">${esc(latest.title)}</a></h2>${latest.desc ? `<p style="margin:0;color:var(--muted);font-size:.9rem;">${esc(latest.desc.slice(0, 110))}…</p>` : ''}</div>` : '<div class="cap">影片載入中</div>'}</div>
  <div class="card side"><h3 style="margin:0 0 6px;">📺 本週影片 <span style="color:var(--muted);font-size:.78rem;font-weight:400;">7 天內・依觀看數</span></h3>${vid4.map(v => `<a class="item" href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener"><img src="https://i.ytimg.com/vi/${v.id}/mqdefault.jpg" alt="" loading="lazy"><div style="font-size:.9rem;line-height:1.45;color:var(--text);font-weight:600;">${esc(v.title)}<div style="color:var(--muted);font-size:.78rem;font-weight:400;">${[ymdOr(v.published), v.views ? Number(v.views).toLocaleString('zh-TW') + ' 次' : ''].filter(Boolean).join('・')}</div></div></a>`).join('')}<a href="/videos.html" style="display:block;margin-top:8px;font-size:.9rem;">全部影片 →</a></div>
</section>
<div class="sec"><h2>📰 科技快訊</h2><span style="color:var(--muted);font-size:.85rem;">每天更新的 iPhone・Apple・特斯拉・AI 產業整理</span><a href="/posts.html">更多 →</a></div>
<div class="list card">${posts.slice(0, 8).map(pRow).join('') || '<p style="color:var(--muted);">第一篇快訊準備中。</p>'}</div>
<div class="sec"><h2>🧮 台股 AI 工具</h2></div>${ctaHtml}
<div class="sec"><h2>📈 今日熱門股快照</h2><span style="color:var(--muted);font-size:.85rem;">每天自動更新</span><a href="/hot.html">完整 →</a></div>${hotBlock(hot)}
<div class="sec"><h2>📺 更多影片</h2><a href="${site.youtube}" target="_blank" rel="noopener">到 YouTube 訂閱 →</a></div>
<div class="grid">${videos.slice(5, 13).map(vCard).join('')}</div>
<div class="sec"><h2>👋 關於阿康</h2><a href="/about.html">完整介紹 / 合作邀約 →</a></div>
<div class="card"><p style="margin:0;">${esc(site.about)}</p></div>`;
  fs.writeFileSync(path.join(DIST, 'index.html'), page({title: `${site.name}|iPhone・Apple・特斯拉開箱 & 台股 AI 工具`, desc: site.description, url: '/', body: home, cur: '/', image: latest ? `https://i.ytimg.com/vi/${latest.id}/maxresdefault.jpg` : ''}));
  // 影片頁
  const vLd = videos.slice(0, 30).map(v => ({'@context': 'https://schema.org', '@type': 'VideoObject', name: v.title, description: v.desc || v.title, thumbnailUrl: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`, uploadDate: iso(v.published), embedUrl: `https://www.youtube-nocookie.com/embed/${v.id}`, url: `https://www.youtube.com/watch?v=${v.id}`, author: {'@type': 'Person', name: site.author}}));
  fs.writeFileSync(path.join(DIST, 'videos.html'), page({title: `影片總覽|${site.name}`, desc: `阿康 YouTube 頻道最新影片:${videos.slice(0, 3).map(v => v.title).join('、')}`, url: '/videos.html', cur: '/videos.html', jsonld: vLd, body: `<div class="sec"><h2>📺 全部影片</h2><a href="${site.youtube}" target="_blank" rel="noopener">YouTube 頻道 →</a></div><div class="grid">${videos.map(vCard).join('')}</div>`}));
  // 快訊列表
  const cats = [...new Set(posts.map(p => p.category))];
  fs.writeFileSync(path.join(DIST, 'posts.html'), page({title: `科技快訊|${site.name}`, desc: '阿康每天整理的 iPhone、Apple、特斯拉、AI 產業與台股快訊。', url: '/posts.html', cur: '/posts.html', body: `<div class="sec"><h2>📰 科技快訊</h2><span style="color:var(--muted);font-size:.85rem;">共 ${posts.length} 篇</span></div><p class="chips">${cats.map(c => `<a href="#" onclick="event.preventDefault();[...document.querySelectorAll('.list .row')].forEach(r=>r.style.display=(this.dataset.c==='*'||r.dataset.c===this.dataset.c)?'':'none')" data-c="${attr(c)}">${esc(c)}</a>`).join('')}<a href="#" data-c="*" onclick="event.preventDefault();[...document.querySelectorAll('.list .row')].forEach(r=>r.style.display='')">全部</a></p><div class="list card">${posts.map(p => pRow(p).replace('<div class="row">', `<div class="row" data-c="${attr(p.category)}">`)).join('')}</div>`}));
  // 每篇文章
  for(const [i, p] of posts.entries()){
    const rel = posts.filter(q => q.slug !== p.slug && (q.category === p.category || q.tags.some(t => p.tags.includes(t)))).slice(0, 4);
    const ld = [{'@context': 'https://schema.org', '@type': 'Article', headline: p.title, description: p.summary, image: p.cover ? [p.cover] : undefined, datePublished: p.date, dateModified: p.date, author: {'@type': 'Person', name: site.author, url: site.url}, publisher: {'@type': 'Organization', name: site.name, logo: {'@type': 'ImageObject', url: site.url + '/favicon.svg'}}, mainEntityOfPage: site.url + p.url, keywords: p.tags.join(', '), articleSection: p.category, inLanguage: 'zh-Hant-TW', wordCount: p.words},
      {'@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{'@type': 'ListItem', position: 1, name: '首頁', item: site.url + '/'}, {'@type': 'ListItem', position: 2, name: '科技快訊', item: site.url + '/posts.html'}, {'@type': 'ListItem', position: 3, name: p.title, item: site.url + p.url}]}];
    const yid = ytId(p.youtube);
    const embeds = (yid && !p.html.includes(`embed/${yid}`) ? ytEmbed(yid) : '')
      + (p.ig ? `<blockquote class="instagram-media" data-instgrm-permalink="${attr(p.ig)}" data-instgrm-version="14" style="margin:12px 0;"><a href="${attr(p.ig)}" target="_blank" rel="noopener">在 Instagram 看這則貼文</a></blockquote><script async src="https://www.instagram.com/embed.js"></script>` : '')
      + (p.fb ? `<p><a class="btn o" href="${attr(p.fb)}" target="_blank" rel="noopener">📘 在 Facebook 看這則貼文</a></p>` : '');
    const body = `<article><p style="margin:14px 0 0;"><a href="/posts.html">← 科技快訊</a> <span class="cat">${esc(p.category)}</span>${p.auto ? ` <span class="tag">${p.source === 'ig' ? '📷 Instagram' : '📘 Facebook'} 自動同步</span>` : ''}</p><h1>${esc(p.title)}</h1><div class="meta">${p.date}・${esc(site.author)}・${p.tags.map(t => `<span class="tag">#${esc(t)}</span>`).join('')}</div>${p.cover && !yid ? `<img class="cover" src="${attr(p.cover)}" alt="${attr(p.title)}">` : ''}${yid ? ytEmbed(yid) : ''}<div class="body">${p.html.replace(yid ? ytEmbed(yid) : '__none__', '')}</div>${p.ig || p.fb ? `<h2 style="font-size:1.05rem;margin-top:24px;">原始貼文</h2>${embeds.replace(ytEmbed(yid), '')}` : ''}
<div style="margin-top:26px;">${ctaHtml}</div>
${rel.length ? `<div class="sec"><h2>延伸閱讀</h2></div><div class="list card">${rel.map(pRow).join('')}</div>` : ''}
<div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap;">${posts[i + 1] ? `<a class="btn o" href="${posts[i + 1].url}">← 上一篇:${esc(posts[i + 1].title.slice(0, 18))}…</a>` : ''}${posts[i - 1] ? `<a class="btn o" href="${posts[i - 1].url}">下一篇:${esc(posts[i - 1].title.slice(0, 18))}… →</a>` : ''}</div></article>`;
    fs.writeFileSync(path.join(DIST, 'posts', p.slug + '.html'), page({title: `${p.title}|${site.short}`, desc: p.summary, url: p.url, image: p.cover, type: 'article', jsonld: ld, cur: '/posts.html', body}));
  }
  // 熱門股頁(建站快照 + 前端每 10 分鐘向本站函式要最新)
  fs.writeFileSync(path.join(DIST, 'hot.html'), page({title: `今日熱門股快照|${site.name}`, desc: `每天自動更新:強勢股雷達與話題雷達(${(hot.scan && hot.scan.d) || ''})。點任一檔直接到台股 AI 作戰室看五燈檢查表。`, url: '/hot.html', cur: '/hot.html', body: `<div class="sec"><h2>📈 今日熱門股快照</h2><span id="hotTime" style="color:var(--muted);font-size:.85rem;">快照時間 ${TZ(hot.fetchedAt || BUILT).toISOString().replace('T', ' ').slice(0, 16)}(台北)</span></div><div id="hotBox">${hotBlock(hot)}</div>${ctaHtml}
<script>(async()=>{try{const r=await fetch('/.netlify/functions/hot');if(!r.ok)return;const j=await r.json();if(j&&j.html){document.getElementById('hotBox').innerHTML=j.html;document.getElementById('hotTime').textContent='即時 '+new Date().toLocaleString('zh-TW',{hour12:false});}}catch(e){}})();</script>`}));
  // 關於
  const about = `<article><h1>👋 關於阿康(GOODSKANG)</h1><div class="body"><p>${esc(site.about)}</p>
<h2>頻道里程碑</h2>${site.milestones.map(([d, t]) => `<div class="milestone"><b>${esc(d)}</b><span>${esc(t)}</span></div>`).join('')}
<h2>三個平台</h2><ul><li><a href="${site.youtube}" target="_blank" rel="noopener">YouTube 阿康爸的平安科技日常</a>——每週 3~5 支開箱與心得</li><li><a href="${site.instagram}" target="_blank" rel="noopener">Instagram @goodskang</a>・<a href="${site.facebook}" target="_blank" rel="noopener">Facebook</a>——每天的科技快訊</li><li><a href="${site.tool}" target="_blank" rel="noopener">阿康的台股 AI 作戰室</a>——免費台股工具</li></ul>
<h2>💼 合作邀約</h2><p>工商影片秉持公開、公正原則,影片內一定會標示廠商 Sponsor 資訊。合作請寄 <a href="mailto:${site.email}">${site.email}</a>,或到 IG / FB 私訊(通常比較快收到)。</p>
<form name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field" class="card" style="display:grid;gap:10px;max-width:560px;"><input type="hidden" name="form-name" value="contact"><p style="display:none"><label>不要填<input name="bot-field"></label></p><label>品牌 / 公司<input name="company" required style="width:100%;padding:9px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text)"></label><label>Email<input name="email" type="email" required style="width:100%;padding:9px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text)"></label><label>合作內容<textarea name="message" rows="4" required style="width:100%;padding:9px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text)"></textarea></label><button class="btn" type="submit" style="border:0;cursor:pointer;">送出</button></form>
</div></article>`;
  fs.writeFileSync(path.join(DIST, 'about.html'), page({title: `關於阿康 / 合作邀約|${site.name}`, desc: site.about, url: '/about.html', cur: '/about.html', type: 'profile', body: about}));
  // sitemap / rss / feed.json / robots / llms
  const urls = [['/', BUILT], ['/videos.html', BUILT], ['/posts.html', BUILT], ['/hot.html', BUILT], ['/about.html', BUILT], ...posts.map(p => [p.url, p.date])];
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(([u, d]) => `<url><loc>${site.url}${u}</loc><lastmod>${ymd(d)}</lastmod></url>`).join('')}</urlset>`);
  const rssItems = [...posts.slice(0, 30).map(p => ({title: p.title, url: site.url + p.url, date: p.date, desc: p.summary, html: p.html})), ...videos.slice(0, 15).map(v => ({title: '📺 ' + v.title, url: `https://www.youtube.com/watch?v=${v.id}`, date: v.published, desc: v.desc || v.title, html: `<p>${esc(v.desc || v.title)}</p>`}))].filter(i => asDate(i.date)).sort((a, b) => newestFirst(a.date, b.date));
  fs.writeFileSync(path.join(DIST, 'rss.xml'), `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${esc(site.name)}</title><link>${site.url}</link><description>${esc(site.description)}</description><language>zh-TW</language><atom:link href="${site.url}/rss.xml" rel="self" type="application/rss+xml"/>${rssItems.map(i => `<item><title>${esc(i.title)}</title><link>${i.url}</link><guid>${i.url}</guid><pubDate>${asDate(i.date).toUTCString()}</pubDate><description><![CDATA[${i.html}]]></description></item>`).join('')}</channel></rss>`);
  fs.writeFileSync(path.join(DIST, 'feed.json'), JSON.stringify({version: 'https://jsonfeed.org/version/1.1', title: site.name, home_page_url: site.url, feed_url: site.url + '/feed.json', description: site.description, language: 'zh-Hant', authors: [{name: site.author, url: site.url}], items: rssItems.map(i => ({id: i.url, url: i.url, title: i.title, content_html: i.html, summary: i.desc, date_published: iso(i.date)}))}));
  fs.writeFileSync(path.join(DIST, 'robots.txt'), `# 歡迎所有搜尋引擎與 AI 爬蟲索引本站(投稿後台除外)\nUser-agent: *\nAllow: /\nDisallow: /admin/\n\n${['GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'ClaudeBot', 'Claude-Web', 'anthropic-ai', 'PerplexityBot', 'Google-Extended', 'Googlebot', 'Bingbot', 'CCBot', 'Applebot', 'Applebot-Extended', 'Bytespider', 'Amazonbot', 'DuckAssistBot', 'meta-externalagent'].map(b => `User-agent: ${b}\nAllow: /`).join('\n\n')}\n\nSitemap: ${site.url}/sitemap.xml\n`);
  const llms = `# ${site.name}(GOODSKANG)\n\n> ${site.description}\n\n作者:${site.author}(${site.email})。YouTube:${site.youtube}|Instagram:${site.instagram}|Facebook:${site.facebook}|台股 AI 工具:${site.tool}\n\n## 站內頁面\n- [首頁](${site.url}/)\n- [影片總覽](${site.url}/videos.html):YouTube 頻道最新影片\n- [科技快訊](${site.url}/posts.html):每天更新的 iPhone、Apple、特斯拉、AI 產業整理\n- [今日熱門股快照](${site.url}/hot.html):強勢股雷達與話題雷達,每天自動更新\n- [關於阿康 / 合作](${site.url}/about.html)\n- [台股 AI 作戰室](${site.tool}):五燈順勢檢查表、交易計畫卡、六種策略回測(免費、免註冊,非投資建議)\n\n## 最新科技快訊\n${posts.slice(0, 30).map(p => `- [${p.title}](${site.url}${p.url}):${p.summary}`).join('\n')}\n\n## 最新影片\n${videos.slice(0, 15).map(v => `- [${v.title}](https://www.youtube.com/watch?v=${v.id})${ymdOr(v.published) ? `(${ymdOr(v.published)})` : ''}`).join('\n')}\n\n## 完整內容\n- [llms-full.txt](${site.url}/llms-full.txt)\n`;
  fs.writeFileSync(path.join(DIST, 'llms.txt'), llms);
  fs.writeFileSync(path.join(DIST, 'llms-full.txt'), llms + '\n\n---\n\n' + posts.map(p => `# ${p.title}\n日期:${p.date}|分類:${p.category}|標籤:${p.tags.join(', ')}|網址:${site.url}${p.url}\n\n${p.text}\n`).join('\n---\n\n'));
  fs.writeFileSync(path.join(DIST, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n/index.html\n  Cache-Control: public, max-age=0, must-revalidate\n/hot.html\n  Cache-Control: public, max-age=0, must-revalidate\n/llms.txt\n  Content-Type: text/plain; charset=utf-8\n/llms-full.txt\n  Content-Type: text/plain; charset=utf-8\n`);
  console.log('build ok →', DIST);
}
main().catch(e => { console.error(e); process.exit(1); });
