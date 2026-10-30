// 阿康的科技生活站——靜態產生器(零依賴,Node 18+)
// 產出 dist/:首頁、影片、科技快訊(每篇一頁)、熱門股快照、關於、sitemap/rss/feed.json/llms.txt/robots.txt
// 建站時抓 YouTube 頻道 RSS 與 AI 工具的雷達資料;抓不到就用 content/cache 的上一版,永遠不會建失敗
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = __dirname, DIST = path.join(ROOT, 'dist'), C = path.join(ROOT, 'content');
const site = JSON.parse(fs.readFileSync(path.join(C, 'site.json'), 'utf8'));
const NAMES = (() => { try{ return JSON.parse(fs.readFileSync(path.join(C, 'names.json'), 'utf8')); }catch(e){ return {}; } })();
const BUILT = new Date();
const TZ = d => new Date(new Date(d).getTime() + 8 * 3600e3);   // 台北時間顯示
const ymd = d => { const t = TZ(d); return (isNaN(t.getTime()) || t.getTime() < 946684800000) ? '' : t.toISOString().slice(0, 10); };   // 日期壞掉/未知(1970)就留白,不能讓整站建失敗   // 日期壞掉不能讓整站建失敗
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
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/(^|[^"'>=])(https?:\/\/[^\s<]+)/g, (m, pre, u) => `${pre}<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
  const stepsHtml = lines => { const items = lines.filter(l => l.trim()); return `<div class="steps">${items.map((l, i) => { const m = l.trim().match(/^(\p{Extended_Pictographic}\uFE0F?)\s*(.*)$/u); const ic = m ? m[1] : String(i + 1); const t = m ? m[2] : l.trim(); const html = inline(t).replace(/「([^」]+)」/g, '<span class="tok">$1</span>'); return `<div class="step c${i % 6}"><span class="ic">${ic}</span><span class="t">${html}</span></div>`; }).join('')}</div>`; };
  const out = []; let list = null, para = [], tbl = null, code = null, codeLang = '';
  const flushT = () => { if(tbl){ const rows = tbl.filter(r => !/^\s*\|?\s*:?-{2,}/.test(r)).map(r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())); const [hd, ...bd] = rows; out.push(`<div class="tbl"><table><thead><tr>${hd.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${bd.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`); tbl = null; } };
  const flushP = () => { flushT(); if(para.length){ out.push(`<p>${para.map(inline).join('<br>')}</p>`); para = []; } };
  const flushL = () => { if(list){ out.push(`<${list.t}>${list.items.map(i => `<li>${inline(i)}</li>`).join('')}</${list.t}>`); list = null; } };
  for(const raw of src.split('\n')){
    const line = raw.replace(/\s+$/, '');
    if(/^```/.test(line)){
      if(code && codeLang === 'steps'){ out.push(stepsHtml(code)); code = null; continue; }
      if(code){ out.push(`<div class="codebox"><button type="button" class="copy" onclick="cpCode(this)">📋 一鍵複製程式碼</button><pre><code>${esc(code.join('\n'))}</code></pre><button type="button" class="copy copy-b" onclick="cpCode(this)">📋 一鍵複製程式碼（捲到底的從這裡按也可以）</button></div>`); code = null; }
      else { flushP(); flushL(); code = []; codeLang = (line.match(/^```\s*(\w*)/)[1] || '').toLowerCase(); }
      continue;
    }
    if(code){ code.push(raw); continue; }
    if(/^\s*\|.*\|\s*$/.test(line)){ if(para.length){ out.push(`<p>${para.map(inline).join('<br>')}</p>`); para = []; } flushL(); (tbl = tbl || []).push(line); continue; }
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
    if(!cover && yid) cover = `https://i.ytimg.com/vi/${yid}/maxresdefault.jpg`;
    if(!cover){ const im = body.match(/!\[[^\]]*\]\(([^)\s]+)\)/); if(im) cover = im[1]; }
    posts.push({slug, url: `/posts/${slug}`, title: fm.title || slug, seoTitle: fm.seo_title || '', date, category: fm.category || '科技', tags, cover, summary, youtube: fm.youtube || '', ig: fm.ig || '', fb: fm.fb || '', disclosure: fm.disclosure || '', updated: fm.updated || '', featured: /^\d{4}-\d{2}-\d{2}$/.test(fm.featured || '') ? fm.featured : '', merge: (fm.merge || '').split(/[,，\s]+/).filter(Boolean), stats: (fm.stats || '').split(/\s*;\s*/).map(x => x.split(/\s*[｜|]\s*/)).filter(x => x[0] && x[1]).slice(0, 4), html: md(body), text, words: text.length});
  }
  return posts.sort((a, b) => b.date.localeCompare(a.date) || b.slug.localeCompare(a.slug));
}

// ── 影片來源(三層備援):① 頻道 RSS ② 直接讀頻道 /videos 與 /shorts 頁面(YouTube 2026-09 起 RSS 常 404)③ 快取
// 只要拿到影片 ID,沒有精確日期的就到觀看頁抓 publishDate 與觀看數(每次最多 12 支);快取會寫回 GitHub,日期與觀看數跨建站保留
const parseViews = t => { const m = String(t || '').replace(/,/g, '').match(/([\d.]+)\s*([KMB萬億])?/i); if(!m) return 0; const n = parseFloat(m[1]); const u = (m[2] || '').toUpperCase(); return Math.round(n * (u === 'K' ? 1e3 : u === 'M' ? 1e6 : u === 'B' ? 1e9 : u === '萬' ? 1e4 : u === '億' ? 1e8 : 1)); };
const relDays = t => { const m = String(t || '').match(/(\d+)\s*(second|minute|hour|day|week|month|year|秒|分鐘|小時|天|週|個月|年)/); if(!m) return null; const n = +m[1], u = m[2]; return /second|minute|hour|秒|分|小時/.test(u) ? 0 : /day|天/.test(u) ? n : /week|週/.test(u) ? n * 7 : /month|個月/.test(u) ? n * 30 : n * 365; };
const walk = (o, fn) => { if(!o || typeof o !== 'object') return; if(Array.isArray(o)){ o.forEach(x => walk(x, fn)); return; } fn(o); for(const k in o) walk(o[k], fn); };
async function scrapeChannel(kind){
  // 一定要用 zh-TW:用 en 會拿到 YouTube 自動翻譯(甚至檔名)當標題,「iPhone 18」還會被翻成「iPhone 16」
  const html = await fetchText(`https://www.youtube.com/${site.youtubeHandle || '@goodskang'}/${kind}?hl=zh-TW&gl=TW&persist_hl=1&persist_gl=1`, 20000, {cookie: 'CONSENT=YES+cb; PREF=hl=zh-TW&gl=TW', 'accept-language': 'zh-TW,zh;q=0.9'});
  const m = html.match(/var ytInitialData = (\{[\s\S]*?\});\s*<\/script>/); if(!m) throw new Error('no ytInitialData');
  const data = JSON.parse(m[1]); const out = [], seen = new Set();
  walk(data, o => {
    if(o.videoRenderer && o.videoRenderer.videoId){ const v = o.videoRenderer; if(seen.has(v.videoId)) return; seen.add(v.videoId);
      out.push({id: v.videoId, title: (v.title?.runs || []).map(r => r.text).join(''), views: parseViews(v.viewCountText?.simpleText), rel: relDays(v.publishedTimeText?.simpleText), short: kind === 'shorts'}); }
    if(o.lockupViewModel && o.lockupViewModel.contentId && /^[\w-]{11}$/.test(o.lockupViewModel.contentId)){ const l = o.lockupViewModel; if(seen.has(l.contentId)) return; seen.add(l.contentId);
      const md = l.metadata?.lockupMetadataViewModel;
      // 版面常改:不猜欄位位置,把這張卡片裡所有文字撈出來,找「觀看」與「前」
      const strs = []; (function dig(x){ if(!x) return; if(typeof x === 'string'){ if(x.length < 60) strs.push(x); return; } if(typeof x === 'object') for(const k in x) dig(x[k]); })(md?.metadata);
      out.push({id: l.contentId, title: md?.title?.content || '', views: parseViews(strs.find(p => /view|觀看|次/.test(p))), rel: relDays(strs.find(p => /ago|前/.test(p))), short: kind === 'shorts'}); }
    if(o.shortsLockupViewModel){ const sl = o.shortsLockupViewModel; const id = sl.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId || sl.entityId?.replace(/^.*?([\w-]{11})$/, '$1'); if(!id || !/^[\w-]{11}$/.test(id) || seen.has(id)) return; seen.add(id);
      out.push({id, title: sl.overlayMetadata?.primaryText?.content || sl.accessibilityText || '', views: parseViews(sl.overlayMetadata?.secondaryText?.content), rel: null, short: true}); }
  });
  return out;
}
async function watchMeta(id){   // 觀看頁:精確上傳日與觀看數
  const html = await fetchText(`https://www.youtube.com/watch?v=${id}&hl=zh-TW&gl=TW`, 15000, {cookie: 'CONSENT=YES+cb; PREF=hl=zh-TW&gl=TW', 'accept-language': 'zh-TW,zh;q=0.9'});
  const d = (html.match(/"publishDate":"(\d{4}-\d{2}-\d{2})/) || html.match(/"uploadDate":"(\d{4}-\d{2}-\d{2})/) || html.match(/itemprop="(?:datePublished|uploadDate)" content="(\d{4}-\d{2}-\d{2})/) || [])[1], vc = (html.match(/"viewCount":"(\d+)"/) || [])[1], t = (html.match(/<meta name="title" content="([^"]*)"/) || [])[1];
  if(!d && !watchMeta.warned){ watchMeta.warned = true; console.warn('[videos] 觀看頁沒有日期(可能被 YouTube 擋),頁面標題:', (html.match(/<title>([^<]*)</) || [])[1] || html.slice(0, 80).replace(/\s+/g, ' ')); }
  const desc = (html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/) || [])[1];
  return {published: d ? d + 'T12:00:00+08:00' : '', views: Number(vc || 0), title: t ? t.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'") : '', desc: desc ? JSON.parse('"' + desc + '"').replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim().slice(0, 300) : ''};
}
// ⭐ 最穩的路線:YouTube Data API(免費、每天額度 10,000 單位,一次建站只用 ~6 單位)。設 Netlify 環境變數 YT_API_KEY 即啟用:精確上傳時間、繁中標題、觀看數、長度,Shorts 也有日期
async function apiVideos(){
  const KEY = process.env.YT_API_KEY; if(!KEY) return [];
  const uploads = 'UU' + String(site.youtubeChannelId).slice(2);   // 頻道 ID 的 UC → UU 就是「所有上傳」播放清單
  const ids = []; let pageToken = '';
  for(let pg = 0; pg < 3; pg++){   // 最多 150 支
    const j = JSON.parse(await fetchText(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=${uploads}&key=${KEY}${pageToken ? '&pageToken=' + pageToken : ''}`, 15000));
    for(const it of (j.items || [])) if(it.contentDetails?.videoId) ids.push(it.contentDetails.videoId);
    pageToken = j.nextPageToken || ''; if(!pageToken) break;
  }
  const out = [];
  for(let i = 0; i < ids.length; i += 50){
    const j = JSON.parse(await fetchText(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&hl=zh-TW&id=${ids.slice(i, i + 50).join(',')}&key=${KEY}`, 15000));
    for(const v of (j.items || [])){
      const sn = v.snippet || {}, dur = String(v.contentDetails?.duration || '');
      const m = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/) || []; const sec = (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0);
      if(sn.liveBroadcastContent === 'upcoming') continue;
      out.push({id: v.id, title: sn.localized?.title || sn.title || '', published: sn.publishedAt, views: Number(v.statistics?.viewCount || 0), desc: (sn.localized?.description || sn.description || '').slice(0, 300), short: sec > 0 && sec <= 180});   // 3 分鐘內視為 Shorts
    }
  }
  return out;
}
const hasCJK = t => /[\u4e00-\u9fff]/.test(String(t || ''));
async function loadVideos(){
  const cache = readCache('videos.json') || [];
  const map = new Map(); for(const v of cache) map.set(v.id, Object.assign({}, v));
  let fresh = [], src = '';
  try{ fresh = await apiVideos(); if(fresh.length) src = 'api'; }catch(e){ console.warn('[videos] Data API 失敗:', e.message); }
  if(!fresh.length) try{
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
    if(old.published && String(old.published).startsWith('1970')){ old.published = ''; old.approx = true; }
    // 標題:有中文的優先(舊快取是中文、新抓到的是英文翻譯 → 留中文)
    const title = (v.title && (hasCJK(v.title) || !hasCJK(old.title))) ? v.title : (old.title || v.title || '');
    const rec = Object.assign({}, old, {id: v.id, title, views: v.views || old.views || 0, desc: v.desc || old.desc || '', short: v.short != null ? v.short : old.short});
    if(v.published){ rec.published = v.published; rec.approx = false; }
    else if(!old.published || old.approx){ if(v.rel != null){ rec.published = new Date(Date.now() - v.rel * 864e5).toISOString(); rec.approx = true; } need.push(rec); }
    map.set(v.id, rec);
  }
  // 沒日期的先查(Shorts 頁面不給日期),再查只有「幾天前」的;每次最多 20 支,剩下的下次建站再補(快取有寫回才會累積)
  need.sort((a, b) => (a.published ? 1 : 0) - (b.published ? 1 : 0));
  for(const rec of need.slice(0, 20)){ try{ const w = await watchMeta(rec.id); if(w.published){ rec.published = w.published; rec.approx = false; } if(w.views) rec.views = w.views; if(w.title && (!rec.title || (hasCJK(w.title) && !hasCJK(rec.title)))) rec.title = w.title; if(w.desc && !rec.desc) rec.desc = w.desc; }catch(e){ console.warn('[videos] 觀看頁失敗:', rec.id, e.message); } }
  // 🔒 改成私人/刪除的影片要下架:快取裡有、這次頻道/API 沒列出來的,拿 oEmbed 問一次(私人 401/403、刪除 404、公開 200);每次最多查 20 支,只查會出現在站上的前 80 支
  if(fresh.length >= 10){
    const freshIds = new Set(fresh.map(v => v.id));
    const sorted = [...map.values()].filter(v => v.published && !String(v.published).startsWith('1970')).sort((a, b) => String(b.published).localeCompare(String(a.published))).slice(0, 80);
    const suspects = sorted.filter(v => !freshIds.has(v.id)).slice(0, 20);
    for(const v of suspects){
      try{ const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 8000);
        const r = await fetch(`https://www.youtube.com/oembed?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D${v.id}&format=json`, {signal: ctl.signal, headers: {'user-agent': UA}}); clearTimeout(t);
        if([401, 403, 404].includes(r.status)){ map.delete(v.id); console.log(`[videos] 下架 ${v.id}(${r.status}:私人或已刪除)${v.title ? ' ' + v.title.slice(0, 30) : ''}`); }
      }catch(e){}
    }
  }
  // 還是不知道日期的:先沉到最底(1970),絕不能冒充最新影片;下次建站會再查
  for(const rec of map.values()){ if(!rec.published || isNaN(new Date(rec.published).getTime())){ rec.published = '1970-01-01T00:00:00.000Z'; rec.approx = true; } }
  const all = [...map.values()].filter(v => v.id && v.title).sort((a, b) => String(b.published).localeCompare(String(a.published)));
  const undated = all.filter(v => String(v.published).startsWith('1970')).length;
  console.log(`[videos] 來源 ${src || 'cache'}:抓到 ${fresh.length} 支,合計 ${all.length} 支${undated ? `,${undated} 支還沒有日期(排最後;設 YT_API_KEY 可一次補齊)` : ''}`);
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
  // 作戰室的 scan 函式要掃全市場,冷啟動常超過 12 秒——給 45 秒、失敗再試一次;成功就把快取寫回 GitHub,下次建站才不會又退回舊日期
  let okScan = false, okNews = false;
  for(let t = 0; t < 2 && !okScan; t++){ try{ const j = JSON.parse(await fetchText(site.toolFunctions + '/scan', 45000)); if(j && (j.list || Array.isArray(j))){ out.scan = Array.isArray(j) ? {list: j} : j; okScan = true; } }catch(e){ console.warn(`[hot] scan 失敗(第 ${t + 1} 次):`, e.message); } }
  for(let t = 0; t < 2 && !okNews; t++){ try{ const j = JSON.parse(await fetchText(site.toolFunctions + '/news', 30000)); if(j && (j.top || []).length >= 3){ out.news = j; okNews = true; } }catch(e){ console.warn(`[hot] news 失敗(第 ${t + 1} 次):`, e.message); } }
  console.log(`[hot] 強勢股 ${okScan ? '新' : '快取'}(${out.scan?.d || '?'})、話題 ${okNews ? '新' : '快取'}`);
  writeCache('hot.json', out);
  if(okScan || okNews) await pushCache('content/cache/hot.json', JSON.stringify(out));
  return out;
}


const inlineText = t => esc(t)
  .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
  .replace(/(^|[^"'>=])(https?:\/\/[^\s<]+)/g, (m, pre, u) => `${pre}<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
// IG / FB 貼文專用排版:第一行＝標題(不重複)、emoji 開頭短句→小標、「對你來說」→重點框、「要注意的是」→引言、「資料來源」→小字、hashtag 行移除
function socialMd(src, title){
  const EMO = /^[\p{Extended_Pictographic}☀-➿][️‍\p{Extended_Pictographic}]*\s*/u;
  const lines = String(src).replace(/\r/g, '').split('\n').map(l => l.replace(/\s+$/, ''));
  const out = []; let para = [];
  const flushP = () => { if(para.length){ out.push(`<p>${para.map(inlineText).join('<br>')}</p>`); para = []; } };
  let first = true;
  for(let line of lines){
    const t = line.trim();
    if(!t){ flushP(); continue; }
    if(/^(#\S+\s*)+$/.test(t)) continue;                                   // 純 hashtag 行
    line = t.replace(/\s*#[^\s#]+/g, '').trim(); if(!line) continue;        // 行內 hashtag
    if(first){ first = false; if(title && line.replace(/[！!？?。]/g, '') .startsWith(title.replace(/[！!？?。…]/g, '').slice(0, 20))) continue; } // 第一行＝標題
    const emo = line.match(EMO);
    if(emo && line.length - emo[0].length <= 30){ flushP(); out.push(`<h2>${inlineText(line)}</h2>`); continue; }
    if(/^對你來說[:：]/.test(line)){ flushP(); out.push(`<p class="tip"><b>對你來說</b>${inlineText(line.replace(/^對你來說[:：]\s*/, ''))}</p>`); continue; }
    if(/^(要注意的是|注意[:：]|提醒[:：])/.test(line)){ flushP(); out.push(`<blockquote>${inlineText(line)}</blockquote>`); continue; }
    if(/^(資料來源|參考資料|來源)[:：]/.test(line)){ flushP(); out.push(`<p class="src">${inlineText(line)}</p>`); continue; }
    para.push(line);
  }
  flushP();
  return out.join('\n');
}

// ── 文章版型強化:每個小標一張區塊卡、「你…」好處句、要注意框、問句卡、資料來源收合、目錄、分享列 ──
function enhance(html, p){
  html = html.replace(/<p>((?:資料來源|參考資料|來源|資料與圖片|資料)[:：][\s\S]*?)<\/p>/g, '<p class="src">$1</p>');
  html = html.replace(/<p>(要注意的是[\s\S]*?)<\/p>/g, '<blockquote>$1</blockquote>');
  const srcs = [], warns = [];
  html = html.replace(/<p class="src">([\s\S]*?)<\/p>/g, (m, x) => { srcs.push(x); return ''; });
  html = html.replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, (m, x) => { if(/要注意|注意[:：]|提醒[:：]/.test(x)){ warns.push(x); return '<!--WARN-->'; } return m; });
  // 文末問句:最後一個以問號結尾的段落
  let ask = '';
  const ps = [...html.matchAll(/<p>([^]*?)<\/p>/g)];
  const last = ps[ps.length - 1];
  if(last && /[？?]\s*$/.test(last[1].replace(/<[^>]+>/g, '').trim()) && last[1].replace(/<[^>]+>/g, '').length < 120){ ask = last[1]; html = html.slice(0, last.index) + html.slice(last.index + last[0].length); }
  // IG 貼文:要注意之後、以「我」為主的段落＝阿康的看法,獨立成一張卡
  let stance = '';
  if(p && p.auto && !/阿康怎麼看|我怎麼看|我的看法/.test(html)){ const wi = html.lastIndexOf('<!--WARN-->'); if(wi >= 0){ const tail = html.slice(wi + 11); const mine = [...tail.matchAll(/<p>([^]*?)<\/p>/g)].filter(m => /我/.test(m[1])); if(mine.length){ stance = mine.map(m => `<p>${m[1]}</p>`).join(''); let t2 = tail; for(const m of mine) t2 = t2.replace(m[0], ''); html = html.slice(0, wi + 11) + t2; } } }
  // 段落以「你」開頭＝好處句
  html = html.replace(/<p>(你[^]*?)<\/p>/g, '<p class="you">$1</p>');
  // 沒有小標的 IG 長文:第一段當引言,其餘每段一張編號卡
  if(p && p.auto && !/<h2>/.test(html)){ const paras = [...html.matchAll(/<p( class="you")?>([^]*?)<\/p>/g)]; if(paras.length >= 4){ let k = 0; html = html.replace(/<p( class="you")?>([^]*?)<\/p>/g, (m, c, x) => { k++; if(k === paras.length && /轉給|傳給|丟進|分享給|tag/.test(x)) return `<div class="ask"><b>分享</b><p>${x}</p></div>`; return k === 1 ? m : `<section class="blk c${(k - 2) % 4} pt"><span class="no">${k - 1}</span><p>${x}</p></section>`; }); } }
  // 依 h2 切區塊
  const parts = html.split(/(?=<h2>)/);
  const intro = parts[0].startsWith('<h2>') ? '' : parts.shift();
  const heads = [];
  const blocks = parts.map((sec, i) => {
    const h = (sec.match(/^<h2>([^]*?)<\/h2>/) || [, ''])[1];
    const plain = h.replace(/<[^>]+>/g, '').trim();
    const id = 's' + (i + 1); heads.push([id, plain]);
    const kind = /阿康怎麼看|我怎麼看|我的看法|我的選擇|我的建議|我的結論/.test(plain) ? 'me' : /重點速覽|一次看懂|懶人包|重點整理/.test(plain) ? 'sum' : 'c' + (i % 4);
    const body = sec.replace(/^<h2>[^]*?<\/h2>/, '').replace(/<!--WARN-->/g, () => warns.length ? `<div class="warn"><b>要注意</b>${warns.shift().replace(/^要注意的是[，,:：]?\s*/, '')}</div>` : '');
    return `<section class="blk ${kind}" id="${id}"><h2>${h}</h2>${body}</section>`;
  });
  const introHtml = intro.replace(/<!--WARN-->/g, () => warns.length ? `<div class="warn"><b>要注意</b>${warns.shift().replace(/^要注意的是[，,:：]?\s*/, '')}</div>` : '');
  const toc = heads.length >= 3 ? `<nav class="toc" aria-label="這篇重點"><b>這篇重點</b>${heads.map(([id, t]) => `<a href="#${id}">${esc(t.replace(/^[^\p{L}\p{N}]+/u, ''))}</a>`).join('')}</nav>` : '';
  const rest = warns.map(w => `<div class="warn"><b>要注意</b>${w.replace(/^要注意的是[，,:：]?\s*/, '')}</div>`).join('');
  const askHtml = ask ? `<div class="ask"><b>聊聊</b><p>${ask}</p>${p && p.ig ? `<a href="${attr(p.ig)}" target="_blank" rel="noopener">到 Instagram 留言 ↗</a>` : ''}</div>` : '';
  const srcHtml = srcs.length ? `<details class="srcbox"><summary>資料來源與說明</summary>${srcs.map(x => `<p>${x}</p>`).join('')}</details>` : '';
  const stanceHtml = stance ? `<section class="blk me"><h2>阿康怎麼看</h2>${stance}</section>` : '';
  return `<div class="lead">${introHtml}</div>${toc}${blocks.join('')}${rest}${stanceHtml}${askHtml}${srcHtml}`;
}
// 影片時間碼自動連結:文中的 2:10、3:40 點了直接讓上方影片從那一秒播(新分頁則開 YouTube 對應時間)
function tsLink(html, yid){
  if(!yid) return html;
  let inA = 0;
  return html.split(/(<[^>]+>)/).map(seg => {
    if(seg.startsWith('<')){ if(/^<a[\s>]/i.test(seg)) inA++; else if(/^<\/a>/i.test(seg)) inA = Math.max(0, inA - 1); return seg; }
    if(inA) return seg;
    return seg.replace(/(上午|下午|晚上|早上|凌晨|中午)?\s?(?<![\d:])(\d{1,2}):([0-5]\d)(?![\d:])/g, (m, ampm, mm, ss) => {
      if(ampm) return m;
      const t = Number(mm) * 60 + Number(ss), lead = m.slice(0, m.length - (mm + ':' + ss).length);
      return `${lead}<a class="ts" href="https://www.youtube.com/watch?v=${yid}&amp;t=${t}s" data-t="${t}" onclick="return tsGo(this)">${mm}:${ss}</a>`;
    });
  }).join('');
}
// 時間碼移到文末:新聞讀者先讀完文章,想查證的人再到「影片對照」點時間碼——內文不再出現 (▶ 2:32)
// 抽的規則:全形/半形括號包住的 2:32、3:50–4:02、2:20、4:20 整組拿掉;「阿康 7:40 說」這種裸時間也拿掉;上午/下午 開頭的時刻不動
function tsStrip(html, yid){
  if(!yid) return {html, sections: []};
  const T = String.raw`(?<![\d:])\d{1,2}:[0-5]\d(?![\d:])`;
  const GROUP = new RegExp(String.raw`\s*[（(]\s*(?:▶\s*)?${T}(?:\s*[–\-~、,，/]\s*(?:▶\s*)?${T})*\s*[)）]`, 'g');
  const BARE = new RegExp(String.raw`(?<!上午|下午|晚上|早上|凌晨|中午)(?<![\d:])\s?(${T})\s?`, 'g');
  const sections = [];
  const parts = html.split(/(?=<section class="blk)/);
  const out = parts.map((seg, i) => {
    const h = (seg.match(/<h2>([^]*?)<\/h2>/) || [])[1];
    const title = h ? h.replace(/<[^>]+>/g, '').trim() : (i === 0 ? '開頭' : '');
    const times = [];
    const take = m => { for(const t of m.match(new RegExp(T, 'g')) || []){ if(!times.includes(t)) times.push(t); } return ''; };
    // 只動文字節點,不碰標籤裡的屬性
    let inA = 0;
    const cleaned = seg.split(/(<[^>]+>)/).map(x => {
      if(x.startsWith('<')){ if(/^<a[\s>]/i.test(x)) inA++; else if(/^<\/a>/i.test(x)) inA = Math.max(0, inA - 1); return x; }
      if(inA) return x;
      return x.replace(GROUP, take).replace(BARE, (m, t, off, str) => { const pre = str.slice(Math.max(0, off - 3), off); if(/上午|下午|晚上|早上|凌晨|中午/.test(pre)) return m; take(t); return ''; }).replace(/ {2,}/g, ' ').replace(/\s+([,，。、;；:：)）」])/g, '$1');
    }).join('');
    if(times.length && title) sections.push({title, times});
    return cleaned;
  });
  return {html: out.join(''), sections};
}
// 分級閱讀:內文裡的「錢和數字」金色、「原話」淡藍,其餘白字——眼睛掃過去就知道哪裡是重點;標題、連結、目錄、影片對照不處理
function hiText(html){
  const NUM = /(NT\$\s?[\d,]+(?:\.\d+)?|US\$\s?[\d,]+(?:\.\d+)?|(?<![\w.])[\d,]+(?:\.\d+)?\s?(?:元|萬元|萬|億|g|kg|mm|cm|吋|%|％|倍|W|mAh|GB|TB|Hz|nits|小時|分鐘|天|年)(?![\w]))/g;
  const QT = /「([^「」]{4,120})」/g;
  let skip = 0;   // 在 h2/h3/a/nav.toc 裡面就不動
  return html.split(/(<[^>]+>)/).map(x => {
    if(x.startsWith('<')){
      if(/^<(h2|h3|a|nav)[\s>]/i.test(x)) skip++;
      else if(/^<\/(h2|h3|a|nav)>/i.test(x)) skip = Math.max(0, skip - 1);
      return x;
    }
    if(skip || !x.trim()) return x;
    return x.replace(QT, '<span class="qt">「$1」</span>').replace(NUM, m => `<b class="num">${m}</b>`);
  }).join('');
}
// 數字卡:依單位自動配 emoji(錢 💰、重量 ⚖️、尺寸 📏、百分比 📊、時間 ⏱、容量 💾)
const kpiIcon = n => /NT\$|US\$|\$|元|萬|億/.test(n) ? '💰' : /\bk?g\b|公斤|公克/.test(n) ? '⚖️' : /mm|cm|吋|公分/.test(n) ? '📏' : /%|％/.test(n) ? '📊' : /小時|分鐘|秒|天|hr|min/i.test(n) ? '⏱' : /GB|TB|mAh|W\b/.test(n) ? '🔋' : '🔹';
function tsAppendix(sections, yid){
  if(!yid || !sections.length) return '';
  const sec = t => { const [m, s2] = t.split(':').map(Number); return m * 60 + s2; };
  return `<section class="tsbox" id="tsbox"><h2>影片對照</h2><p>文章裡的數字和原話都出自影片;想查證,點時間碼就從那一秒播。</p>${sections.map(x => `<div class="tsrow"><b>${esc(x.title)}</b><span>${x.times.map(t => `<a class="ts" href="https://www.youtube.com/watch?v=${yid}&amp;t=${sec(t)}s" data-t="${sec(t)}" onclick="return tsGo(this)">${t}</a>`).join('')}</span></div>`).join('')}</section>`;
}
const TS_JS = `<script>function tsGo(a){var f=document.querySelector('article .yt iframe');if(!f)return true;var u=f.src.split('?')[0];f.src=u+'?start='+a.dataset.t+'&autoplay=1';f.closest('.yt').scrollIntoView({behavior:'smooth',block:'center'});return false}</script>`;
const shareBar = (p, where) => { const u = site.url + p.url, t = p.title; const e = encodeURIComponent;
  return `<div class="share ${where}" data-url="${attr(u)}" data-title="${attr(t)}"><span class="lbl">分享給朋友</span><a class="sh line" href="https://social-plugins.line.me/lineit/share?url=${e(u)}" target="_blank" rel="noopener">LINE</a><a class="sh fb" href="https://www.facebook.com/sharer/sharer.php?u=${e(u)}" target="_blank" rel="noopener">Facebook</a><a class="sh th" href="https://www.threads.net/intent/post?text=${e(t + ' ' + u)}" target="_blank" rel="noopener">Threads</a><button type="button" class="sh cp" onclick="shCopy(this)">📎 複製連結</button><button type="button" class="sh more" onclick="shMore(this)">IG・更多</button></div>`; };
const SHARE_JS = `<script>function cpCode(b){var t=b.parentNode.querySelector('code').textContent;var ok=function(){var o=b.textContent;b.textContent='已複製 ✓ 回 Scriptable 長按貼上';b.classList.add('done');setTimeout(function(){b.textContent=o;b.classList.remove('done')},3000)};var legacy=function(){try{var ta=document.createElement('textarea');ta.value=t;ta.setAttribute('readonly','');ta.style.cssText='position:fixed;top:0;left:0;opacity:0;font-size:16px';document.body.appendChild(ta);ta.focus();ta.select();ta.setSelectionRange(0,t.length);var r=document.execCommand('copy');document.body.removeChild(ta);if(r){ok();return}}catch(e){}var o=b.textContent;b.textContent='這個瀏覽器不給複製，請用右上角「用 Safari 開啟」再按一次';setTimeout(function(){b.textContent=o},4000)};if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(ok,legacy)}else{legacy()}}function shCopy(b){var u=b.parentNode.dataset.url;var ok=function(){var o=b.textContent;b.textContent='已複製 ✓';setTimeout(function(){b.textContent=o},1600)};if(navigator.clipboard){navigator.clipboard.writeText(u).then(ok,function(){prompt('複製這個連結',u)})}else{prompt('複製這個連結',u)}}function shMore(b){var d=b.parentNode.dataset;if(navigator.share){navigator.share({title:d.title,url:d.url}).catch(function(){})}else{shCopy(b.previousElementSibling);alert('已複製連結，可以貼到 IG 限動或私訊。')}}</script>`;

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
  // Cache authorized IG videos in this deploy: no expiring CDN URL or IG app redirect in the player.
  const videoDir = path.join(DIST, 'media', 'social');
  fs.mkdirSync(videoDir, {recursive: true});
  let videoBytes = 0;
  const videoBudget = 512 * 1024 * 1024, perVideoLimit = 128 * 1024 * 1024;
  const grabVideo = async (url, id) => {
    if(!url || videoBytes >= videoBudget) return '';
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 45000);
    try {
      const u = new URL(url);
      if(u.protocol !== 'https:' || !/(^|\.)(cdninstagram\.com|fbcdn\.net)$/.test(u.hostname)){ console.warn('[social] video host rejected:', id, u.hostname); return ''; }
      const r = await fetch(u, {signal: ctl.signal});
      const type = r.headers.get('content-type') || '';
      if(!r.ok || !r.body || !/^(video\/mp4|application\/octet-stream)(?:;|$)/i.test(type)){ console.warn('[social] video response rejected:', id, r.status, type); return ''; }
      const limit = Math.min(perVideoLimit, videoBudget - videoBytes);
      if(Number(r.headers.get('content-length')) > limit){ console.warn('[social] video size limit:', id, r.headers.get('content-length')); ctl.abort(); return ''; }
      const chunks = []; let size = 0;
      for await(const chunk of r.body){ size += chunk.length; if(size > limit){ ctl.abort(); return ''; } chunks.push(chunk); }
      const data = Buffer.concat(chunks);
      if(size < 1000 || data.toString('ascii', 4, 8) !== 'ftyp'){ console.warn('[social] video invalid MP4:', id); return ''; }
      fs.writeFileSync(path.join(videoDir, id + '.mp4'), data);
      videoBytes += size;
      return '/media/social/' + id + '.mp4';
    } catch(e){ console.warn('[social] video unavailable:', id); return ''; }
    finally { clearTimeout(timer); }
  };
  const tagsOf = t => [...String(t).matchAll(/#([^\s#]+)/g)].map(m => m[1]).slice(0, 8);
  // 截斷規則：先找句號問號驚嘆號，再找逗號頓號，最後空白；不切斷英文型號或數字
  const cutAt = (s, n, dots) => { s = String(s).trim(); if(s.length <= n) return s; const c = s.slice(0, n);
    for(const re of [/^[\s\S]*[！？。!?…」）)](?=[^！？。!?…」）)]*$)/, /^[\s\S]*[，、,；;：:](?=[^，、,；;：:]*$)/, /^[\s\S]*\s(?=\S*$)/]){ const m = c.match(re); if(m && m[0].length >= n * 0.5) return m[0].replace(/[，、,；;：:\s]+$/, '').replace(/[A-Za-z0-9]/.test(s[m[0].length] || '') ? /(?:\s*[A-Za-z0-9.+]+)+$/ : /$^/, '') + (dots && !/[！？。!?…]$/.test(m[0].trim()) ? '…' : ''); }
    return c.replace(/[A-Za-z0-9.]+$/, '').trim() + '…'; };
  const summaryOf = t => { const ls = String(t).replace(/\r/g, '').split('\n').map(x => x.replace(/#[^\s#]+/g, '').trim()).filter(Boolean); const tt = titleOf(t).replace(/[！!？?。…]/g, '').slice(0, 20); if(ls.length > 1 && ls[0].replace(/[！!？?。…]/g, '').startsWith(tt)) ls.shift(); return cutAt(ls.join(' ').replace(/\s+/g, ' ').trim(), 120, true); };
  const titleOf = t => { const first = String(t).split('\n').map(x => x.trim()).find(x => x && !/^#/.test(x)) || ''; return cutAt(first.replace(/#\S+/g, '').trim(), 80, false) || '新貼文'; };
  const mk = (src, id, text, date, permalink, imgUrl, extra) => ({slug: `${src}-${id}`, url: `/posts/${src}-${id}`, title: titleOf(text), date: ymd(date), iso: date || '', category: '科技快訊', tags: tagsOf(text), cover: '', coverRemote: imgUrl || '', summary: summaryOf(text), youtube: (String(text).match(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/) || [''])[0], ig: src === 'ig' ? permalink : '', fb: src === 'fb' ? permalink : '', html: socialMd(String(text), titleOf(text)), text: String(text).replace(/\s+/g, ' ').trim(), words: String(text).length, thin: String(text).length < 200, source: src, auto: true, ...extra});
  const out = []; let j_ig = [];
  // 路線 A(最簡單):Instagram API with Instagram Login——只要 IG 帳號本身,不需要粉專;Meta 後台「產生權杖」一鍵取得,60 天到期前再按一次
  try{
    if(igToken){
      const j = JSON.parse(await fetchText(`https://graph.instagram.com/v21.0/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=50&access_token=${igToken}`, 20000)); j_ig = j.data || [];
      for(const m of (j.data || [])){ if(!m.caption) continue; out.push(mk('ig', m.id, m.caption, m.timestamp, m.permalink, m.media_type === 'VIDEO' ? (m.thumbnail_url || m.media_url) : m.media_url, {video: m.media_type === 'VIDEO', videoRemote: m.media_type === 'VIDEO' ? m.media_url : ''})); }
    }
    // 輪播貼文:另外抓每張圖(失敗不影響主流程)
    if(igToken){ let n = 0; for(const m of (j_ig || [])){ if(m.media_type !== 'CAROUSEL_ALBUM' || n >= 25) continue; n++;
      try{ const c = JSON.parse(await fetchText(`https://graph.instagram.com/v21.0/${m.id}/children?fields=id,media_type,media_url,thumbnail_url&access_token=${igToken}`, 15000));
        const post = out.find(x => x.slug === 'ig-' + m.id); if(post) post.slidesRemote = (c.data || []).map(k => k.media_type === 'VIDEO' ? (k.thumbnail_url || '') : k.media_url).filter(Boolean).slice(0, 10);
      }catch(e){ console.warn('[social] 輪播子圖抓取失敗:', m.id); } } }
  }catch(e){ console.warn('[social] IG(Instagram Login) 抓取失敗:', e.message); }
  // 路線 B:透過粉專的 Graph API(META_TOKEN + IG_USER_ID / FB_PAGE_ID)
  try{
    if(token && process.env.IG_USER_ID && !out.length){
      const j = JSON.parse(await fetchText(`${G}/${process.env.IG_USER_ID}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=50&access_token=${token}`, 20000));
      for(const m of (j.data || [])){ if(!m.caption) continue; out.push(mk('ig', m.id, m.caption, m.timestamp, m.permalink, m.media_type === 'VIDEO' ? (m.thumbnail_url || m.media_url) : m.media_url, {video: m.media_type === 'VIDEO', videoRemote: m.media_type === 'VIDEO' ? m.media_url : ''})); }
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
  for(const p of out){ if(p.coverRemote){ p.cover = await grab(p.coverRemote, p.slug); if(!p.cover && p.youtube) p.cover = `https://i.ytimg.com/vi/${ytId(p.youtube)}/maxresdefault.jpg`; } else if(p.youtube) p.cover = `https://i.ytimg.com/vi/${ytId(p.youtube)}/maxresdefault.jpg`; }
  for(const p of out){ if(p.video && p.videoRemote) p.videoSrc = await grabVideo(p.videoRemote, p.slug); }
  for(const p of out){ if(p.slidesRemote && p.slidesRemote.length > 1){ const got = []; for(const [k, u] of p.slidesRemote.entries()){ const g = await grab(u, `${p.slug}-${k + 1}`); if(g) got.push(g); } if(got.length > 1) p.slides = got; } }
  console.log('[social] hosted video MB:', Math.round(videoBytes / 1024 / 1024));
  console.log(`[social] IG/FB 自動貼文 ${out.length} 篇`);
  return out;
}

// ── 版型 ──
const CSS = `
/* 阿康網站設計規則（新頁面、新元件一律只用這些變數，不要再寫死顏色和圓角）
   顏色：底 --bg、卡片 --card、線 --border、字 --text／--muted
         藍 --accent＝連結與一般強調；金 --gold＝重點、數字、阿康觀點；綠 --green＝給讀者的建議；紅 --red＝要注意；琥珀 --amber＝第四種區塊色
         每個顏色三種深淺：-soft（底色）、-strong（滑過）、-line（框線）
   圓角：--r 卡片與圖片、--r-s 按鈕與小元件、--pill 標籤與膠囊
   原則：一個區塊只用一個強調色；數字用 --gold；不放大型 3D 動畫，速度優先 */
:root{--bg:#10141D;--card:#161B27;--border:#2A3140;--text:#EDEFF4;--muted:#9BA3B4;--accent:#5B85F5;--gold:#FFD43B;--amber:#E0A45C;--red:#F26B6B;--green:#4CC38A;
--accent-soft:rgba(91,133,245,.12);--accent-strong:rgba(91,133,245,.24);--accent-line:rgba(91,133,245,.35);
--gold-soft:rgba(255,212,59,.1);--gold-line:rgba(255,212,59,.4);--green-soft:rgba(76,195,138,.08);--red-soft:rgba(242,107,107,.08);--red-line:rgba(242,107,107,.35);
--r:12px;--r-s:8px;--pill:999px}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--text);font-family:"Noto Sans TC",-apple-system,"PingFang TC","Microsoft JhengHei",sans-serif;line-height:1.7}
a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
img{max-width:100%;height:auto}
.wrap{max-width:1120px;margin:0 auto;padding:0 16px}
header.top{position:sticky;top:0;z-index:50;background:rgba(16,20,29,.96);border-bottom:1px solid var(--border)}
.nav{display:flex;align-items:center;gap:14px;height:58px}
.logo{display:flex;align-items:center;gap:8px;font-weight:900;font-size:1.05rem;color:var(--text);white-space:nowrap}
.logo b{color:var(--accent)}.logo .home{color:var(--muted);flex:none}.logo:hover{text-decoration:none}.logo:hover .home{color:var(--text)}
.plug{margin:22px 0 0;padding-top:12px;border-top:1px solid var(--border);color:var(--muted);font-size:.92rem}.note{color:var(--muted);font-size:.85rem;font-style:italic;margin:8px 0 4px;line-height:1.6}

.menu{display:flex;gap:4px;margin-left:auto;overflow-x:auto;scrollbar-width:none}
.menu a{padding:6px 10px;border-radius:var(--r-s);color:var(--muted);font-weight:600;font-size:.92rem;white-space:nowrap}
.menu a.on,.menu a:hover{color:var(--text);background:var(--accent-soft);text-decoration:none}
@media(max-width:760px){.nav{flex-wrap:wrap;height:auto;padding:10px 0 6px;gap:6px}.menu{margin-left:0;width:100%}.menu a{padding:6px 9px;font-size:.88rem}}
.mergecta{display:grid;gap:2px;margin:14px 0;padding:14px 16px;border:2px solid var(--gold);border-radius:var(--r);background:color-mix(in srgb,var(--gold) 10%,transparent);color:var(--text);text-decoration:none}.mergecta span{font-size:.85rem;color:var(--gold);font-weight:700}.mergecta b{font-size:1.05rem;line-height:1.45}.mergecta em{font-style:normal;color:var(--accent);font-weight:700}.mergecta.reel{border-color:var(--border);background:var(--card,transparent)}.mergecta:hover{filter:brightness(1.08)}.hotc{border:2px solid var(--gold)!important}.hotc h3{color:var(--gold)}
.hero{display:grid;grid-template-columns:1.4fr 1fr;gap:16px;margin:18px 0}
@media(max-width:820px){.hero{grid-template-columns:1fr}}
.card{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:16px;overflow:hidden}
.hero .main{padding:0}
.hero .main .yt{border-radius:var(--r) 12px 0 0}
.hero .main .cap{padding:12px 16px}
.hero .side .item{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)}
.hero .side .item:last-child{border-bottom:0}
.hero .side img{width:96px;height:64px;object-fit:cover;border-radius:var(--r-s);flex:none}
.sec{display:flex;align-items:baseline;gap:10px;margin:30px 0 10px;flex-wrap:wrap}
.sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.sec h1,.sec h2{margin:0;font-size:1.25rem;white-space:nowrap;padding-left:12px;border-left:3px solid var(--gold)}.sec a{margin-left:auto;font-size:.9rem}
.sec>span{color:var(--muted);font-size:.85rem}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px}
.v{background:var(--card);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;transition:transform .15s}
.v:hover{transform:translateY(-2px)}.v img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block}
.v .t{padding:10px 12px;font-weight:700;font-size:.95rem;line-height:1.5;color:var(--text)}
.v .m{padding:0 12px 10px;color:var(--muted);font-size:.8rem}
.list .row{display:grid;grid-template-columns:150px 1fr;gap:14px;padding:12px 0;border-bottom:1px solid var(--border);align-items:start}
.list .row img{width:150px;height:96px;object-fit:cover;border-radius:var(--r)}
.list .row.igrow{grid-template-columns:112px 1fr}.list .row.igrow img{width:112px;height:140px;object-fit:cover;object-position:center top;border-radius:var(--r);background:var(--bg)}
.list .row h3{margin:0 0 4px;font-size:1.05rem;line-height:1.45}
.list .row p{margin:0;color:var(--muted);font-size:.9rem}
.tag{display:inline-block;padding:1px 9px;border-radius:var(--pill);border:1px solid var(--border);font-size:.75rem;color:var(--muted);margin-right:6px}
.cat{color:var(--gold);font-weight:700;font-size:.8rem}
@media(max-width:560px){.list .row{grid-template-columns:110px 1fr}.list .row img{width:110px;height:72px}.list .row.igrow{grid-template-columns:96px 1fr}.list .row.igrow img{width:96px;height:120px}}
.yt{position:relative;aspect-ratio:16/9;background:#000}.yt iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.cta{display:grid;grid-template-columns:1.2fr 1fr;gap:16px;align-items:center;background:var(--card);border:1px solid var(--border);border-left:4px solid var(--gold);border-radius:var(--r);padding:22px}
@media(max-width:820px){.cta{grid-template-columns:1fr}}
.cta h2{margin:0 0 6px;font-size:1.4rem}.cta p{margin:0 0 12px;color:var(--muted)}
.btn{display:inline-block;padding:11px 18px;border-radius:var(--r-s);background:var(--gold);color:#10141D;font-weight:800;text-decoration:none}
.btn:hover{text-decoration:none;filter:brightness(1.1)}
.btn.o{background:transparent;color:var(--text);border:1px solid var(--border)}
.feat{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px}
.feat div{background:var(--bg);border:1px solid var(--border);border-radius:var(--r-s);padding:10px;font-size:.88rem}
.hot{display:grid;grid-template-columns:1fr 1fr;gap:14px}@media(max-width:820px){.hot{grid-template-columns:1fr}}
.stock{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border);font-size:.95rem}
.stock:last-child{border-bottom:0}.up{color:var(--red)}.down{color:var(--green)}
.stock .nm{font-weight:700}.stock .sub{color:var(--muted);font-size:.8rem}
.chips a{display:inline-block;padding:4px 12px;border-radius:var(--pill);border:1px solid var(--border);background:transparent;margin:3px 6px 3px 0;font-weight:700;font-size:.88rem}
/* 文章頁(2026-10 改版):像 MacRumors / 9to5Mac 一樣用「讀的版面」——內文不裝框、行距寬、小標是純文字;只有「阿康怎麼看」和「要注意」保留底色 */
.artwrap{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:32px;align-items:start;margin-top:8px}
@media(max-width:980px){.artwrap{grid-template-columns:1fr}.artwrap>.rail{display:none}}
article{max-width:760px;margin:0 auto;min-width:0;width:100%}
article h1{font-size:1.85rem;line-height:1.3;margin:10px 0 10px;letter-spacing:-.01em}
.by{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:.9rem;margin:0 0 14px}.by .av{width:30px;height:30px;border-radius:50%;background:var(--gold) url(/favicon.svg) center/70% no-repeat;flex:none}.by b{color:var(--text);font-weight:700}
.crumb{color:var(--muted);font-size:.85rem;margin:14px 0 0;letter-spacing:.02em}.crumb .cat{margin-left:8px}
article .meta{color:var(--muted);font-size:.85rem;margin-bottom:14px}
article .body{font-size:1.08rem}article .body h2{font-size:1.32rem;margin:36px 0 10px;border-left:4px solid var(--gold);padding-left:12px;line-height:1.4;color:var(--gold)}article .body h3{font-size:1.08rem;margin:24px 0 6px;color:var(--amber)}
article .body p code,article .body li code,article .body td code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.88em;background:var(--accent-soft);padding:1px 6px;border-radius:4px}article .body .steps{margin:12px 0 18px;display:flex;flex-direction:column}article .body .step{display:flex;align-items:center;gap:12px;background:#1b1d24;border:1px solid var(--border);border-radius:14px;padding:11px 14px;position:relative}article .body .step+.step{margin-top:12px}article .body .step+.step::before{content:"";position:absolute;left:32px;top:-13px;width:2px;height:13px;background:#3c4050}article .body .step .ic{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.15rem;font-weight:800;color:#fff;flex:none}article .body .step .t{font-size:1rem;line-height:1.55}article .body .step .tok{display:inline-block;background:rgba(47,124,246,.2);color:#8ab8ff;padding:1px 7px;border-radius:7px;font-weight:700;margin:0 2px}article .body .step.c0 .ic{background:#2f7cf6}article .body .step.c1 .ic{background:#f5a623}article .body .step.c2 .ic{background:#30b050}article .body .step.c3 .ic{background:#8e5ce6}article .body .step.c4 .ic{background:#e5484d}article .body .step.c5 .ic{background:#6e6e73}article .body .codebox{margin:14px 0}article .body .codebox pre{margin:0;padding:14px;background:#0b0d10;color:#e6e6e6;border:1px solid var(--border);border-radius:var(--r);overflow-x:auto;font-size:.82rem;line-height:1.55;-webkit-overflow-scrolling:touch}article .body .codebox code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre}article .body .codebox .copy{display:block;width:100%;margin:0 0 10px;font-size:1.05rem;font-weight:700;padding:15px 16px;border-radius:12px;border:0;background:var(--gold);color:#111;cursor:pointer;text-align:center;box-shadow:0 2px 10px rgba(0,0,0,.35)}article .body .codebox .copy-b{margin:10px 0 0}article .body .codebox .copy.done{background:#2ecc71}article .body .codebox .copy:active{transform:scale(.98)}article .body img{border-radius:var(--r);margin:8px 0}article .body blockquote{border-left:3px solid var(--gold);margin:12px 0;padding:6px 12px;color:var(--muted)}
.body .tbl{overflow-x:auto;margin:14px 0}.body table{width:100%;border-collapse:collapse;font-size:.95rem}.body th,.body td{border:1px solid var(--border);padding:9px 12px;text-align:left;vertical-align:top;line-height:1.6}.body th{background:var(--accent-soft);white-space:nowrap}.body td:first-child{white-space:nowrap;font-weight:600}
.cover{width:100%;max-height:440px;object-fit:cover;border-radius:var(--r)}
.cover.social{display:block;width:100%;max-width:min(420px,100%);max-height:525px;margin:0 auto;object-fit:contain;background:var(--bg)}.native-video{margin:16px auto;max-width:420px}.native-video video{display:block;width:100%;max-height:75vh;aspect-ratio:9/16;object-fit:contain;background:#000;border-radius:var(--r)}.native-video .play-note{color:var(--muted);font-size:.9rem;margin:8px 0}.native-video .video-error{color:var(--gold);font-size:.9rem}.video-links{margin:12px auto 20px;max-width:420px}.video-links .ig-url{font-size:.82rem;line-height:1.5;overflow-wrap:anywhere;margin:10px 0 0}.video-links .ig-help{font-size:.82rem;color:var(--muted);line-height:1.6;margin:8px 0}.native-video a:focus-visible,.video-links a:focus-visible{outline:2px solid var(--gold);outline-offset:4px}.igtop{display:flex;justify-content:center;margin:12px 0}.igtop .instagram-media{margin:0 auto!important;max-width:420px!important;min-width:0!important;width:100%!important}
article .body p{line-height:1.9;margin:14px 0}
article .body h2{font-size:1.32rem;margin:36px 0 10px}
article .body .tip{border-left:3px solid var(--gold);background:var(--gold-soft);padding:8px 12px;border-radius:0}
article .body .tip b{color:var(--gold);margin-right:6px}
article .body .src{color:var(--muted);font-size:.85rem;margin-top:22px}
article .body .lead p:first-child{font-size:1.16rem;color:var(--text);line-height:1.9;padding-left:14px;border-left:3px solid var(--accent)}
article .body .num{color:var(--gold);font-weight:700;font-variant-numeric:tabular-nums}article .body .qt{color:#CFE0FF}article .body td .num{font-weight:700}
@media(max-width:560px){article .body{font-size:1.02rem}article .body .lead p:first-child{font-size:1.08rem}article .body h2{font-size:1.18rem;margin:28px 0 8px}}
.toc{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:baseline;margin:18px 0 10px;padding:12px 16px;background:var(--card);border:1px solid var(--border);border-radius:var(--r)}.toc b{font-size:.82rem;color:var(--gold);margin-right:4px;letter-spacing:.04em;width:100%}.toc a{font-size:.92rem;color:var(--muted);padding:0}.toc a::before{content:'';display:inline-block;width:5px;height:5px;border-radius:50%;background:var(--accent);margin:0 6px 2px 0}.toc a:hover{color:var(--text);text-decoration:none}@media(max-width:560px){.toc{gap:4px 0}.toc a{width:100%;padding:3px 0}}
article .body .blk{--c:var(--accent);background:transparent;border:0;border-radius:0;padding:0;margin:0;scroll-margin-top:90px}
article .body .blk.c1{--c:var(--gold)}article .body .blk.c2{--c:var(--green)}article .body .blk.c3{--c:var(--amber)}
article .body .blk h2{border-left:4px solid var(--gold);padding-left:12px;margin:36px 0 10px;font-size:1.32rem;color:var(--gold)}
article .body .blk.sum{--c:var(--gold)}article .body .blk.sum h2::before{content:"";}article .body .blk.sum .tbl{margin:8px 0 14px}
article .body .blk.me{--c:var(--gold);background:var(--gold-soft);border:1px solid var(--gold-line);border-left:4px solid var(--gold);border-radius:var(--r);padding:4px 20px 12px;margin:30px 0}
article .body .blk.me h2{color:var(--gold);margin:14px 0 6px;font-size:1.15rem;border-left:0;padding-left:0}
article .body .tsbox{margin:36px 0 10px;padding:14px 18px 8px;border:1px solid var(--border);border-radius:var(--r);background:var(--card)}article .body .tsbox h2{font-size:1.05rem;margin:0 0 4px;border-left:0;padding-left:0;color:var(--text)}article .body .tsbox h2::before{content:'🎬 ';}article .body .tsbox p{margin:0 0 8px;color:var(--muted);font-size:.9rem}article .body .tsrow{display:grid;grid-template-columns:minmax(120px,38%) 1fr;gap:10px;padding:8px 0;border-top:1px solid var(--border);align-items:baseline}article .body .tsrow b{font-size:.92rem;font-weight:700;line-height:1.5}article .body .tsrow a.ts{display:inline-block;font-size:.88rem;color:var(--text);background:var(--accent-soft);border-radius:var(--r-s);padding:2px 8px;margin:2px 6px 2px 0}article .body .tsrow a.ts::before{color:var(--accent)}@media(max-width:560px){article .body .tsrow{grid-template-columns:1fr}}
article .body p.you{background:transparent;border-left:3px solid var(--green);padding:2px 0 2px 14px;border-radius:0}
article .body .warn{background:var(--red-soft);border:1px solid var(--red-line);border-radius:var(--r);padding:12px 16px;margin:16px 0;line-height:1.8}
article .body .warn b{display:block;color:var(--red);font-size:.9rem;margin-bottom:2px}
article .body .ask{background:var(--accent-soft);border:1px solid var(--accent-line);border-radius:var(--r);padding:12px 16px;margin:18px 0}
article .body .ask b{color:var(--accent);font-size:.9rem}article .body .ask p{margin:4px 0;font-size:1.08rem;font-weight:700}article .body .ask a{font-size:.9rem}
article .body .srcbox{margin:18px 0 6px;border:1px solid var(--border);border-radius:var(--r);padding:8px 14px;color:var(--muted);font-size:.85rem}article .body .srcbox summary{cursor:pointer;font-weight:700}article .body .srcbox p{line-height:1.7;margin:8px 0}
article .body .blk .tbl{margin:8px 0 10px}
article .body a.ts{font-weight:600;font-size:.82em;color:var(--muted);padding:0 2px;border-radius:0;background:transparent;white-space:nowrap;vertical-align:baseline}article .body a.ts::before{content:"▶";font-size:.7em;margin-right:2px;color:var(--accent)}article .body a.ts:hover{color:var(--accent);text-decoration:none}
article .body .blk.pt{display:flex;gap:12px;align-items:flex-start;padding:4px 0;margin:10px 0;border:0}article .body .blk.pt p{margin:0}article .body .blk.pt .no{flex:none;width:24px;height:24px;border-radius:50%;background:var(--card);border:1px solid var(--border);color:var(--muted);font-weight:800;font-size:.78rem;display:flex;align-items:center;justify-content:center;margin-top:5px}
.share{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:14px 0}.share.bottom{margin:22px 0 4px;padding:14px;background:var(--card);border:1px solid var(--border);border-radius:var(--r)}
.share .lbl{font-size:.85rem;color:var(--muted);margin-right:2px}
.share .sh{font:inherit;font-size:.85rem;font-weight:700;padding:6px 12px;border-radius:var(--pill);border:1px solid var(--border);background:transparent;color:var(--text);cursor:pointer;text-decoration:none;line-height:1.4}.share .sh.cp{border-color:var(--gold);color:var(--gold)}.linecta{margin-top:26px;padding:18px 18px 16px;border:1px solid #06C755;border-radius:var(--r);background:rgba(6,199,85,.08)}.linecta h2{margin:0 0 6px;font-size:1.15rem}.linecta p{margin:0 0 12px;color:var(--muted)}.linecta .btn.lnj{background:#06C755;border-color:#06C755;color:#fff;font-weight:800}
.share .sh:hover{text-decoration:none;border-color:var(--muted)}.share .line{border-color:#06C755;color:#06C755}.share .fb{border-color:#4C7BF3;color:#7EA0F7}.share .more{background:var(--gold-soft);border-color:var(--gold-line);color:var(--gold)}
.gal{margin:12px auto;max-width:440px}.gal .track{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;border-radius:var(--r);scrollbar-width:none}.gal .track::-webkit-scrollbar{display:none}
.gal .track img{flex:0 0 100%;width:100%;aspect-ratio:4/5;object-fit:cover;scroll-snap-align:center;margin:0;border-radius:0;background:var(--card)}
.gal .galnav{display:flex;align-items:center;justify-content:space-between;margin-top:6px;color:var(--muted);font-size:.85rem}.gal .galnav button{font:inherit;font-size:1.2rem;width:36px;height:36px;border-radius:50%;border:1px solid var(--border);background:var(--card);color:var(--text);cursor:pointer}
@media(max-width:560px){article .body .blk{padding:4px 14px 8px}article h1{font-size:1.4rem}.share .lbl{width:100%}}
.social{display:flex;gap:10px;flex-wrap:wrap}
.social a{padding:8px 14px;border-radius:var(--r-s);border:1px solid var(--border);background:transparent;font-weight:700;color:var(--text)}
footer{margin:40px 0 20px;padding-top:18px;border-top:1px solid var(--border);color:var(--muted);font-size:.85rem;line-height:1.8}
.disc{margin-top:10px;padding:10px 0 0;border-top:1px solid var(--border);color:var(--muted);font-size:.82rem}
.milestone{display:grid;grid-template-columns:90px 1fr;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)}
.milestone b{color:var(--gold)}
.pill{display:inline-block;padding:2px 10px;border-radius:var(--pill);background:var(--gold-soft);color:var(--gold);font-size:.78rem;font-weight:700}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin:18px 0 6px;border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
/* 首頁(2026-10 改版,MacRumors / 9to5Mac 式):第一屏=一則大主題+最新清單;第二排=四張圖卡;再來是新聞河流+右欄 */
.fp{display:grid;grid-template-columns:1.55fr 1fr;gap:18px;margin:16px 0 8px}
@media(max-width:820px){.fp{grid-template-columns:1fr}}
.lead1{position:relative;display:block;border-radius:var(--r);overflow:hidden;background:var(--card);border:1px solid var(--border)}
.lead1 img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block}
.lead1 .ov{padding:14px 18px 16px}
.lead1 .k{display:inline-block;padding:2px 10px;border-radius:var(--pill);background:var(--gold);color:#10141D;font-size:.75rem;font-weight:800;margin-bottom:8px}
.lead1 h2{margin:0;font-size:1.5rem;line-height:1.35;color:var(--text)}
.lead1 p{margin:8px 0 0;color:var(--muted);font-size:.95rem;line-height:1.6}
.lead1 .meta{color:var(--muted);font-size:.8rem;margin-top:8px}
@media(max-width:560px){.lead1 h2{font-size:1.2rem}.lead1 .ov{padding:12px 14px 14px}.lead1 p{display:none}}
.latest{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:14px 16px}
.latest h3{margin:0 0 4px;font-size:1rem;letter-spacing:.02em;display:flex;align-items:center;gap:8px}
.latest h3::after{content:"";flex:1;height:1px;background:var(--border)}
.latest a.it{display:grid;grid-template-columns:82px 1fr;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);align-items:start;color:var(--text)}
.latest a.it:last-of-type{border-bottom:0}.latest a.it:hover{text-decoration:none}.latest a.it:hover b{color:var(--accent)}
.latest a.it img{width:82px;height:56px;object-fit:cover;border-radius:var(--r-s);background:var(--bg)}
.latest a.it b{display:block;font-size:.93rem;line-height:1.45;font-weight:700}
.latest .m{color:var(--muted);font-size:.76rem;margin-top:3px}
.latest .more{display:block;margin-top:8px;font-size:.88rem}
.k2{display:inline-block;font-size:.72rem;font-weight:800;color:var(--gold);margin-right:6px}
.strip{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:14px 0 6px}
@media(max-width:820px){.strip{grid-template-columns:repeat(2,1fr)}}
.strip a{display:block;background:var(--card);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;color:var(--text);transition:transform .15s}
.strip a:hover{transform:translateY(-2px);text-decoration:none}.strip a:hover b{color:var(--accent)}
.strip img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block}
.strip b{display:block;padding:10px 12px 4px;font-size:.92rem;line-height:1.45}
.strip .m{padding:0 12px 10px;color:var(--muted);font-size:.76rem}
.two{display:grid;grid-template-columns:1fr 330px;gap:22px;margin-top:8px;align-items:start}
@media(max-width:900px){.two{grid-template-columns:1fr}}
.river .row{grid-template-columns:168px 1fr;padding:14px 0}.river .row img{width:168px;height:106px}
.river .row.igrow{grid-template-columns:120px 1fr}.river .row.igrow img{width:120px;height:150px}
.river .row h3{font-size:1.08rem}.river .row p{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
@media(max-width:560px){.river .row{grid-template-columns:110px 1fr}.river .row img{width:110px;height:72px}.river .row.igrow{grid-template-columns:96px 1fr}.river .row.igrow img{width:96px;height:120px}}
.rail .card{margin-bottom:16px}.rail h3{margin:0 0 8px;font-size:1rem;display:flex;align-items:center;gap:8px}.rail h3::after{content:"";flex:1;height:1px;background:var(--border)}
.rail .vi{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);color:var(--text);align-items:start}.rail .vi:last-of-type{border-bottom:0}.rail .vi:hover{text-decoration:none}.rail .vi:hover b{color:var(--accent)}
.rail .vi img{width:96px;height:64px;object-fit:cover;border-radius:var(--r-s);flex:none}.rail .vi b{display:block;font-size:.88rem;line-height:1.45;font-weight:600}.rail .vi .m{color:var(--muted);font-size:.74rem;margin-top:2px}
.rail .stock{font-size:.9rem}
.ctaS{background:var(--card);border:1px solid var(--border);border-left:4px solid var(--gold);border-radius:var(--r);padding:14px 16px}.ctaS h3::after{display:none}.ctaS p{margin:4px 0 10px;color:var(--muted);font-size:.9rem;line-height:1.6}
.kpi{padding:12px 14px;border-right:1px solid var(--border)}.kpi:last-child{border-right:0}
.kpi i{font-style:normal;font-size:.95rem;display:block;margin-bottom:2px}.kpi b{display:block;color:var(--gold);font-size:1.3rem;font-weight:800;line-height:1.25;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.kpi span{display:block;color:var(--muted);font-size:.8rem;line-height:1.45;margin-top:3px}
@media(max-width:640px){.kpis{grid-template-columns:1fr 1fr}.kpi b{font-size:1.1rem}.kpi:nth-child(2n){border-right:0}.kpi:nth-child(-n+2){border-bottom:1px solid var(--border)}}
.pop .row{grid-template-columns:168px 1fr;padding:14px 0}.pop .row img{width:168px;height:106px}.pop .row h3{font-size:1.08rem}@media(max-width:560px){.pop .row{grid-template-columns:110px 1fr}.pop .row img{width:110px;height:72px}}
.rail .it{display:grid;grid-template-columns:82px 1fr;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);color:var(--text);align-items:start}.rail .it:last-of-type{border-bottom:0}.rail .it:hover{text-decoration:none}.rail .it:hover b{color:var(--accent)}.rail .it img{width:82px;height:56px;object-fit:cover;border-radius:var(--r-s);background:var(--bg)}.rail .it b{display:block;font-size:.9rem;line-height:1.45;font-weight:700}.rail .it .m{color:var(--muted);font-size:.74rem;margin-top:3px}
`;

const NAV = [['/videos.html', '最新影片'], ['/posts.html', '3C 科技新聞'], ['/travel.html', '親子旅遊快訊'], ['/picks.html', '阿康愛用清單推薦'], ['/hot.html', 'AI 股票工具'], ['/about.html', '關於阿康 / 合作']];
// 分區:愛用清單(導購指南)、親子旅遊、其餘都是 3C 科技新聞
const isPick = p => p.category === '阿康愛用清單';
const TECH_T = /iPhone|iPad|Apple|蘋果|AirPods|Mac|特斯拉|Tesla|手機/i;
const isTravel = p => p.category === '親子旅遊' || !TECH_T.test(p.title) && /日本|沖繩|福岡|大阪|東京|京都|北海道|樂桃|退稅|親子旅遊|自由行|出國/.test(p.title + ' ' + p.tags.join(' '));
const secOf = p => isTravel(p) ? {url: '/travel.html', name: '親子旅遊快訊', label: '親子旅遊'} : isPick(p) ? {url: '/picks.html', name: '阿康愛用清單推薦', label: '愛用清單'} : {url: '/posts.html', name: '3C 科技新聞', label: p.category};
// 新聞文末延伸閱讀(MacRumors 式:一篇最多一行;業配／導購文本身不加)
const PLUGS = [
  [p => /iPhone ?1[78]/i.test(p.title + ' ' + p.tags.join(' ')), '/posts/2026-10-19-iphone-accessories.html', 'iPhone 18 Pro 充電頭實測、舊殼能不能沿用，整理在這篇'],
  [p => /特斯拉|Tesla|Model ?Y|Model ?3/i.test(p.title + ' ' + p.tags.join(' ')), '/posts/2026-10-19-model-y-accessories.html', 'Model Y 開三年的配件心得和車主折扣碼，整理在這篇'],
  [p => isTravel(p), '/posts/2026-10-19-japan-family-trip.html', '帶 1 歲、2 歲小孩去日本前，我們家的確認清單']];
const plugOf = p => { if(isPick(p) || /合作|業配|贊助|優惠碼|折扣碼|賣場|專屬優惠|聯盟|分潤/.test(p.text)) return ''; const m = PLUGS.find(([t, u]) => t(p) && !p.url.endsWith(u)); return m ? `<p class="plug">延伸閱讀:<a href="${m[1]}">${esc(m[2])}</a></p>` : ''; };
// 網址一律用沒有 .html 的版本（Netlify 會把站內連結改成這個樣子），canonical、sitemap、og:url 跟著一致
const clean = u => String(u).replace(/(^|\/)index\.html$/, '$1').replace(/\.html(?=$|[?#])/, '');
const cleanHtml = h => h.replace(/((?:href|src)=["'](?:https:\/\/goodskang\.tw)?\/[^"'?#]*?)\.html(?=["'?#])/g, '$1');
function page({title, desc, url, body, jsonld = [], image, type = 'website', noindex = false, cur = '', h1 = ''}){
  const full = url.startsWith('http') ? url : site.url + clean(url);
  const img = image ? (image.startsWith('/') ? site.url + image : image) : `${site.url}/og.png`;
  const ld = [{'@context': 'https://schema.org', '@type': 'WebSite', name: site.name, alternateName: [site.short, 'GOODSKANG'], url: site.url, potentialAction: {'@type': 'SearchAction', target: site.url + '/posts?q={search_term_string}', 'query-input': 'required name=search_term_string'}},
    {'@context': 'https://schema.org', '@type': 'Person', name: site.author, alternateName: 'GOODSKANG', url: site.url, email: site.email, sameAs: [site.youtube, site.instagram, site.facebook, site.tool], jobTitle: '科技 YouTuber / 台股 AI 工具開發者', description: site.about},
    ...jsonld];
  return cleanHtml(`<!DOCTYPE html><html lang="zh-Hant-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${attr(desc)}">
<link rel="canonical" href="${full}">
${noindex ? '<meta name="robots" content="noindex,follow">' : '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">'}
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
<header class="top"><div class="wrap nav"><a class="logo" href="/" aria-label="回首頁"><svg class="home" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5M5.5 9.8V20h4.8v-5.5h3.4V20h4.8V9.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>阿康 <b>GOODSKANG</b></a><nav class="menu">${NAV.map(([h, t]) => `<a href="${h}"${cur === h ? ' class="on"' : ''}${h.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`).join('')}</nav></div></header>
<main class="wrap">${h1 ? `<h1 class="sr">${esc(h1)}</h1>` : ''}${body}</main>
<footer class="wrap">
<div class="social"><a href="${site.youtube}" target="_blank" rel="noopener">YouTube</a><a href="${site.instagram}" target="_blank" rel="noopener">Instagram</a><a href="${site.facebook}" target="_blank" rel="noopener">Facebook</a><a href="${site.tool}" target="_blank" rel="noopener">台股 AI 作戰室</a><a href="mailto:${site.email}">合作邀約</a></div>
<p style="margin-top:12px;">© ${BUILT.getFullYear()} ${esc(site.name)}(GOODSKANG)・本站內容為原創,未經授權禁止複製或商業使用・<a href="/rss.xml">RSS</a>・<a href="/llms.txt">llms.txt</a>・最後更新 ${ymd(BUILT)}</p>
<div class="disc">股市相關內容皆為歷史統計與公開資料整理,非投資建議,損益自負。</div>
</footer></body></html>`);
}
const vCard = v => `<a class="v" href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener"><img src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="${attr(v.title)}" loading="lazy"><div class="t">${esc(v.title)}</div><div class="m">${[ymd(v.published), v.views ? `${Number(v.views).toLocaleString('zh-TW')} 次觀看` : ''].filter(Boolean).join('・')}</div></a>`;
const pRow = p => `<div class="row${p.auto ? ' igrow' : ''}" data-c="${attr(p.category)}"><a href="${p.url}">${p.cover ? `<img src="${attr(p.cover)}" alt="${attr(p.title)}" loading="lazy">` : `<div style="width:150px;height:96px;border-radius:var(--r);background:var(--accent-soft);display:flex;align-items:center;justify-content:center;font-size:2rem;"></div>`}</a><div><span class="cat">${esc(secOf(p).label)}</span> <span style="color:var(--muted);font-size:.8rem;">${p.date}</span>${p.auto ? `<span class="tag">${p.source === 'ig' ? 'IG' : 'FB'}</span>` : ''}<h3><a href="${p.url}" style="color:var(--text);">${esc(p.title)}</a></h3><p>${esc(p.summary)}</p></div></div>`;
const nmOf = id => NAMES[id] || id;
function hotBlock(hot){
  const list = ((hot.scan && hot.scan.list) || []).slice(0, 8), top = ((hot.news && hot.news.top) || []).slice(0, 8);
  const link = id => `${site.tool}?s=${encodeURIComponent(id)}`;
  const a = list.length ? list.map(h => `<div class="stock"><span><a class="nm" href="${link(h.id)}" target="_blank" rel="noopener">${esc((h.name || h.id).replace(/\*/g, ''))}</a> <span class="sub">${h.id}${h.k ? '・人氣' : ''}</span></span><span><b>${h.c}</b> <span class="up">▲ ${Number(h.pct).toFixed(2)}%</span> <span class="sub">${(h.val / 1e8).toFixed(1)} 億</span></span></div>`).join('') : '<p style="color:var(--muted);">今日資料更新中。</p>';
  const b = top.length ? top.map(x => `<div class="stock"><span><a class="nm" href="${link(x.id)}" target="_blank" rel="noopener">${esc(nmOf(x.id))}</a> <span class="sub">${x.id}</span></span><span class="sub">${x.n} 則</span></div>`).join('') : '<p style="color:var(--muted);">今日資料更新中。</p>';
  const themes = ((hot.news && hot.news.themes) || []).slice(0, 4).map(t => `<span class="pill">${esc(t.name)}</span> ${(t.stocks || []).slice(0, 4).map(s => `<a href="${link(s.id)}" target="_blank" rel="noopener">${esc(nmOf(s.id))}</a>`).join('、')}`).join(' <span style="opacity:.4">|</span> ');
  return `<div class="hot"><div class="card"><h3 style="margin:0 0 8px;">強勢股雷達 <span class="sub" style="color:var(--muted);font-size:.8rem;">${esc((hot.scan && hot.scan.d) || '')} 收盤・成交值最大的上漲股與漲停股</span></h3>${a}</div><div class="card"><h3 style="margin:0 0 8px;">話題雷達 <span style="color:var(--muted);font-size:.8rem;">${esc((hot.news && hot.news.day) || '')} 新聞被點名次數</span></h3>${b}${themes ? `<p style="margin:10px 0 0;font-size:.9rem;line-height:2;">今日主題:${themes}</p>` : ''}</div></div><p class="disc">依證交所/櫃買公開資料與新聞報導則數客觀排序,非選股建議;點任一檔可直接到 AI 作戰室看五燈檢查表與交易計畫卡。</p>`;
}

// ── 產出 ──
async function main(){
  fs.rmSync(DIST, {recursive: true, force: true}); fs.mkdirSync(path.join(DIST, 'posts'), {recursive: true});
  fs.mkdirSync(path.join(DIST, 'img'), {recursive: true});
  const manual = loadPosts();
  const [videos, hot, social] = await Promise.all([loadVideos(), loadHot(), loadSocial()]);
  // 手動貼文優先;自動抓的 IG/FB 貼文若手動已寫過(同一個 IG 連結)就略過
  const posts = manual.concat(social.filter(sp => !manual.some(mp => (mp.ig && mp.ig === sp.ig) || (mp.fb && mp.fb === sp.fb)))).sort((a, b) => b.date.localeCompare(a.date) || b.slug.localeCompare(a.slug));
  // 2026-10-30 阿康:同一件事的 IG 短版併到主文(主文 frontmatter 寫 merge: ig-xxxx),列表只留主文;
  // 主文寫 featured: YYYY-MM-DD → 到那天前固定當首頁大圖、各頁右欄「大家都在看」
  const TODAY = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
  for(const mp of manual) for(const s of (mp.merge || [])){ const c = posts.find(q => q.slug === s && q !== mp); if(c){ c.parent = mp; (mp.kids = mp.kids || []).push(c); } }
  const isFeat = p => !!p.featured && p.featured >= TODAY && !p.parent;
  const listed = p => !p.thin && !p.parent;
  const pub = posts.filter(p => !p.parent);
  const featOrder = arr => arr.filter(isFeat).concat(arr.filter(p => !isFeat(p)));
  const news = featOrder(pub.filter(p => !isPick(p) && !isTravel(p))), travel = pub.filter(isTravel), picks = pub.filter(isPick);
  console.log(`posts ${posts.length}, videos ${videos.length}, hot ${(hot.scan && hot.scan.list || []).length}/${(hot.news && hot.news.top || []).length}`);
  // 靜態檔
  if(fs.existsSync(path.join(C, 'img'))) fs.cpSync(path.join(C, 'img'), path.join(DIST, 'img'), {recursive: true});
  if(fs.existsSync(path.join(ROOT, 'static'))) fs.cpSync(path.join(ROOT, 'static'), DIST, {recursive: true});
  if(fs.existsSync(path.join(ROOT, 'admin'))) fs.cpSync(path.join(ROOT, 'admin'), path.join(DIST, 'admin'), {recursive: true});
  fs.writeFileSync(path.join(DIST, 'favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0d1117"/><rect x="24" y="14" width="16" height="30" rx="4" fill="#f85149"/><rect x="31" y="6" width="2" height="8" fill="#f85149"/><rect x="31" y="44" width="2" height="10" fill="#f85149"/><circle cx="28" cy="26" r="2" fill="#0d1117"/><circle cx="36" cy="26" r="2" fill="#0d1117"/><path d="M27 34q5 4 10 0" stroke="#0d1117" stroke-width="2" fill="none"/></svg>`);
  // 首頁(MacRumors / 9to5Mac 式):第一屏=一則大主題+最新清單,第二排=四張圖卡(本週最多人看的影片),再來是新聞河流+右欄
  // 「本週影片」=7 天內的影片,觀看數高→低、同觀看數新→舊;不足 4 支就用最新的補
  const latest = videos[0];
  const wk = Date.now() - 7 * 864e5;
  const week = videos.filter(v => v.id !== (latest && latest.id) && new Date(v.published).getTime() >= wk).sort((a, b) => (b.views || 0) - (a.views || 0) || String(b.published).localeCompare(String(a.published)));
  const vid4 = week.concat(videos.filter(v => v.id !== (latest && latest.id) && !week.includes(v))).slice(0, 4);
  const toolFeat = ['五燈順勢檢查表', '防守位與部位計算', '交易計畫卡(5/10/20 日歷史統計)', '話題雷達・強勢股雷達', '六種存股策略回測', '本益比體檢'];
  const ctaHtml = `<div class="cta"><div><h2>阿康的台股 AI 作戰室——免費・免註冊</h2><p>打一檔代號:五燈檢查表、標註 K 線、防守與部位、交易計畫卡馬上出來;想存股就做六種策略回測。不報明牌、不喊進出,把數據攤開你自己決定。</p><a class="btn" href="${site.tool}" target="_blank" rel="noopener">開啟工具 →</a> <a class="btn o" href="/hot.html">看今日熱門股</a></div><div class="feat">${toolFeat.map(f => `<div>${f}</div>`).join('')}</div></div>`;
  // 「多久以前」:今天用小時,其餘用日期(IG 有精確時間、手寫文章只有日期)
  const ago = (iso, date) => { const t = iso ? new Date(iso).getTime() : NaN; if(!isNaN(t)){ const h = (Date.now() - t) / 36e5; if(h < 1) return '剛剛'; if(h < 24) return `${Math.floor(h)} 小時前`; if(h < 48) return '昨天'; } return date || ymd(iso); };
  // 新聞河流:所有文章(原創實測、IG 快訊、親子旅遊、愛用清單)依時間混排;太短的 IG 頁不進首頁
  const river = posts.filter(listed);
  const lead = river.find(p => isFeat(p) && p.cover) || river.find(p => !p.auto && p.cover) || river.find(p => p.cover) || river[0];
  const rest = river.filter(p => p !== lead);
  const vTime = v => `https://www.youtube.com/watch?v=${v.id}`;
  const leadHtml = lead
    ? `<a class="lead1" href="${lead.url}"><img src="${attr(lead.cover || (latest ? `https://i.ytimg.com/vi/${latest.id}/maxresdefault.jpg` : ''))}" alt="${attr(lead.title)}" fetchpriority="high"><div class="ov"><span class="k">${isFeat(lead) ? '🔥 大家都在看・' : ''}${esc(secOf(lead).label)}</span><h2>${esc(lead.title)}</h2><p>${esc(lead.summary.slice(0, 90))}${lead.summary.length > 90 ? '…' : ''}</p><div class="meta">${ago(lead.iso, lead.date)}・${esc(site.author)}</div></div></a>`
    : (latest ? `<a class="lead1" href="${vTime(latest)}" target="_blank" rel="noopener"><img src="https://i.ytimg.com/vi/${latest.id}/maxresdefault.jpg" alt="${attr(latest.title)}"><div class="ov"><span class="k">最新影片</span><h2>${esc(latest.title)}</h2><div class="meta">${ymd(latest.published)}</div></div></a>` : '');
  const latestList = rest.slice(0, 5).map(p => `<a class="it" href="${p.url}">${p.cover ? `<img src="${attr(p.cover)}" alt="" loading="lazy">` : `<span style="width:82px;height:56px;border-radius:var(--r-s);background:var(--accent-soft);display:block;"></span>`}<span><b>${esc(p.title)}</b><span class="m"><span class="k2">${esc(secOf(p).label)}</span>${ago(p.iso, p.date)}</span></span></a>`).join('');
  const stripHtml = vid4.length ? `<div class="sec" style="margin-top:22px;"><h2>本週影片</h2><span>${week.length ? '7 天內・最多人看' : '最新上片'}</span><a href="/videos.html">全部影片 →</a></div><div class="strip">${(latest ? [latest].concat(vid4) : vid4).slice(0, 4).map(v => `<a href="${vTime(v)}" target="_blank" rel="noopener"><img src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="${attr(v.title)}" loading="lazy"><b>${esc(v.title)}</b><span class="m">${[ymd(v.published), v.views ? Number(v.views).toLocaleString('zh-TW') + ' 次' : ''].filter(Boolean).join('・')}</span></a>`).join('')}</div>` : '';
  const riverRows = rest.slice(5, 17).map(p => pRow(p).replace('<span style="color:var(--muted);font-size:.8rem;">' + p.date + '</span>', `<span style="color:var(--muted);font-size:.8rem;">${ago(p.iso, p.date)}</span>`)).join('');
  const railVideos = videos.slice(0, 6).filter(v => v !== latest && !vid4.includes(v)).concat(videos.slice(6, 14)).slice(0, 5);
  const hotMini = (() => { const list = ((hot.scan && hot.scan.list) || []).slice(0, 5); if(!list.length) return ''; const link = id => `${site.tool}?s=${encodeURIComponent(id)}`;
    return `<div class="card"><h3>今日強勢股 <span style="color:var(--muted);font-size:.75rem;font-weight:400;">${esc((hot.scan && hot.scan.d) || '')}</span></h3>${list.map(h => `<div class="stock"><span><a class="nm" href="${link(h.id)}" target="_blank" rel="noopener">${esc((h.name || h.id).replace(/\*/g, ''))}</a> <span class="sub">${h.id}</span></span><span><b>${h.c}</b> <span class="up">▲ ${Number(h.pct).toFixed(2)}%</span></span></div>`).join('')}<a href="/hot.html" style="display:block;margin-top:8px;font-size:.88rem;">話題雷達、完整名單 →</a><p class="disc" style="margin-top:8px;">公開資料客觀排序,非選股建議。</p></div>`; })();
  const home = `
<section class="fp">
  ${leadHtml}
  <div class="latest"><h3>最新</h3>${latestList}<a class="more" href="/posts.html">更多 3C 科技新聞 →</a></div>
</section>
${stripHtml}
<div class="two">
  <div>
    <div class="sec"><h2>科技新聞</h2><span>實測文章・IG 快訊・親子旅遊,依時間排</span><a href="/posts.html">更多 →</a></div>
    <div class="list card river">${riverRows || '<p style="color:var(--muted);">第一篇快訊準備中。</p>'}</div>
    ${travel.length ? `<div class="sec"><h2>親子旅遊快訊</h2><span>帶兩個小孩出國的實際經驗</span><a href="/travel.html">更多 →</a></div><div class="list card">${travel.slice(0, 3).map(pRow).join('')}</div>` : ''}
    ${picks.length ? `<div class="sec"><h2>阿康愛用清單</h2><span>自己在用、親手測過才放</span><a href="/picks.html">全部 →</a></div><div class="list card">${picks.slice(0, 3).map(pRow).join('')}</div>` : ''}
  </div>
  <aside class="rail">
    <div class="card ctaS"><h3>台股 AI 作戰室</h3><p>打一檔代號,五燈檢查表、交易計畫卡、六種存股回測馬上出來。免費、免註冊,不報明牌。</p><a class="btn" href="${site.tool}" target="_blank" rel="noopener">開啟工具 →</a></div>
    ${hotMini}
    ${railVideos.length ? `<div class="card"><h3>更多影片</h3>${railVideos.map(v => `<a class="vi" href="${vTime(v)}" target="_blank" rel="noopener"><img src="https://i.ytimg.com/vi/${v.id}/mqdefault.jpg" alt="" loading="lazy"><span><b>${esc(v.title)}</b><span class="m">${[ymd(v.published), v.views ? Number(v.views).toLocaleString('zh-TW') + ' 次' : ''].filter(Boolean).join('・')}</span></span></a>`).join('')}<a href="${site.youtube}" target="_blank" rel="noopener" style="display:block;margin-top:8px;font-size:.88rem;">到 YouTube 訂閱 →</a></div>` : ''}
    <div class="card"><h3>關於阿康</h3><p style="margin:0;color:var(--muted);font-size:.9rem;line-height:1.7;">${esc(site.about.slice(0, 110))}…</p><a href="/about.html" style="display:block;margin-top:8px;font-size:.88rem;">完整介紹 / 合作邀約 →</a></div>
  </aside>
</div>
<div class="sec"><h2>今日熱門股快照</h2><span>每天自動更新</span><a href="/hot.html">完整 →</a></div>${hotBlock(hot)}
<div style="margin-top:22px;">${ctaHtml}</div>`;
  fs.writeFileSync(path.join(DIST, 'index.html'), page({title: `${site.name}|iPhone・Apple・特斯拉開箱 & 台股 AI 工具`, desc: site.description, url: '/', body: home, cur: '/', h1: `${site.name}：iPhone、Apple、特斯拉開箱與台股 AI 工具`, image: latest ? `https://i.ytimg.com/vi/${latest.id}/maxresdefault.jpg` : ''}));
  // 影片頁
  const vLd = videos.slice(0, 30).map(v => ({'@context': 'https://schema.org', '@type': 'VideoObject', name: v.title, description: v.desc || v.title, thumbnailUrl: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`, ...(v.published && !v.published.startsWith('1970') ? {uploadDate: v.published} : {}), embedUrl: `https://www.youtube-nocookie.com/embed/${v.id}`, url: `https://www.youtube.com/watch?v=${v.id}`, author: {'@type': 'Person', name: site.author}}));
  fs.writeFileSync(path.join(DIST, 'videos.html'), page({title: `最新影片|${site.name}`, desc: `阿康 YouTube 頻道最新影片:${videos.slice(0, 3).map(v => v.title).join('、')}`, url: '/videos.html', cur: '/videos.html', jsonld: vLd, body: `<div class="sec"><h1>最新影片</h1><a href="${site.youtube}" target="_blank" rel="noopener">YouTube 頻道 →</a></div><div class="grid">${videos.map(vCard).join('')}</div>`}));
  // 列表頁:3C 科技新聞／親子旅遊快訊／阿康愛用清單推薦
  const clean_llms = t => t.replace(/(goodskang\.tw\/[\w\/-]*?)\.html/g, '$1');
  const listPage = (file, h, desc, arr, chips, intro) => {
    const cats = chips ? [...new Set(arr.map(p => p.category))] : [];
    const chipHtml = cats.length > 1 ? `<p class="chips">${cats.map(c => `<a href="#" onclick="event.preventDefault();[...document.querySelectorAll('.list .row')].forEach(r=>r.style.display=(r.dataset.c===this.dataset.c)?'':'none')" data-c="${attr(c)}">${esc(c)}</a>`).join('')}<a href="#" onclick="event.preventDefault();[...document.querySelectorAll('.list .row')].forEach(r=>r.style.display='')">全部</a></p>` : '';
    fs.writeFileSync(path.join(DIST, file), page({title: `${h}|${site.name}`, desc, url: '/' + file, cur: '/' + file, body: `<div class="sec"><h1>${h}</h1><span style="color:var(--muted);font-size:.85rem;">共 ${arr.length} 篇</span></div>${intro || ''}${chipHtml}<div class="list card">${arr.map(pRow).join('') || '<p style="color:var(--muted);">準備中。</p>'}</div>`}));
  };
  listPage('posts.html', '3C 科技新聞', '阿康整理的 iPhone、Apple、特斯拉、AI 產業新聞與實測觀點。', news, true);
  listPage('travel.html', '親子旅遊快訊', '阿康帶 1 歲、2 歲兩個小孩出國的實際經驗：日本自由行、機票優惠、退稅新制與出發前準備。', travel, false);
  listPage('picks.html', '阿康愛用清單推薦', '阿康自己在用、親手測過的 iPhone 配件、特斯拉配件與出國用品，附觀眾優惠碼。', picks, false, `<p style="color:var(--muted);margin:0 0 12px;">我自己在用、親手測過才放進來。部分連結為聯盟或合作連結，透過連結購買我可能拿到分潤，你付的價格不會變。</p>`);
  // 每篇文章（IG 有真實發文時間就用台灣時間；手寫文章只標日期，有 updated 才寫修改日）
  const tw = d => { const t = d ? new Date(d) : null; return t && !isNaN(t) ? new Date(t.getTime() + 8 * 3600e3).toISOString().slice(0, 19) + '+08:00' : ''; };
  // 文章頁右欄(桌機):最新 5 篇 + 作戰室入口——9to5Mac 的 Featured 欄
  const railIt = q => `<a class="it" href="${q.url}">${q.cover ? `<img src="${attr(q.cover)}" alt="" loading="lazy">` : `<span style="width:82px;height:56px;border-radius:var(--r-s);background:var(--accent-soft);display:block;"></span>`}<span><b>${esc(q.title)}</b><span class="m"><span class="k2">${esc(secOf(q).label)}</span>${q.date}</span></span></a>`;
  const featRail = self => { const f = pub.filter(q => isFeat(q) && q !== self && q !== (self && self.parent)); return f.length ? `<div class="card hotc"><h3>🔥 大家都在看</h3>${f.slice(0, 3).map(railIt).join('')}</div>` : ''; };
  const artRail0 = `<aside class="rail">@@FEAT@@<div class="card"><h3>最新</h3>${posts.filter(q => listed(q) && !isFeat(q)).slice(0, 5).map(q => `<a class="it" href="${q.url}">${q.cover ? `<img src="${attr(q.cover)}" alt="" loading="lazy">` : `<span style="width:82px;height:56px;border-radius:var(--r-s);background:var(--accent-soft);display:block;"></span>`}<span><b>${esc(q.title)}</b><span class="m"><span class="k2">${esc(secOf(q).label)}</span>${q.date}</span></span></a>`).join('')}</div><div class="card ctaS"><h3>台股 AI 作戰室</h3><p>打一檔代號,五燈檢查表、交易計畫卡、六種存股回測馬上出來。免費、免註冊,不報明牌。</p><a class="btn" href="${site.tool}" target="_blank" rel="noopener">開啟工具 →</a></div></aside>`;
  for(const [i, p] of posts.entries()){
    const artRail = artRail0.replace('@@FEAT@@', featRail(p));
    // 同主題文章:共用的具體標籤、標題裡同一個產品名、原創實測優先;太短的 IG 頁不列
    const GEN = /^(阿康報好康|阿康愛用清單|Apple|蘋果|iPhone|科技|3C)$/i;
    const TOPIC = /(iPhone Duo|iPhone 18 Pro Max|iPhone 18 Pro|iPhone 17|iPhone Air|AirPods Pro 3|AirPods Max 2|AirPods 5|AirPods|Beats 360|Beats Pill|Beats|HomeView|HomePod mini 2|HomePod|Apple TV|Apple Watch|iPad mini|iPad|MacBook|Mac|Model Y|Roadster|Tesla|特斯拉|FSD|CASETiFY|MagSafe|行動電源|保護殼|回收|退稅|日本|沖繩|福岡|樂桃|Fold ?8|Galaxy|三星|台積電|RTX ?5090|HONOR|LINE)/gi;
    const topics = s => new Set((String(s).match(TOPIC) || []).map(x => x.toLowerCase().replace(/\s+/g, '')));
    const tp = topics(p.title + ' ' + p.tags.join(' '));
    const prim = (String(p.title).match(TOPIC) || [''])[0].toLowerCase().replace(/\s+/g, '');   // 標題裡第一個產品名＝這篇的主角
    const rel = posts.filter(q => q.slug !== p.slug && listed(q) && q !== p.parent).map(q => {
      let s = 0; for(const t of q.tags) if(p.tags.includes(t)) s += GEN.test(t) ? 0.5 : 3;
      for(const x of topics(q.title + ' ' + q.tags.join(' '))) if(tp.has(x)) s += 4;
      if(prim && topics(q.title).has(prim)) s += 6;
      if(!q.auto) s += 2; if(secOf(q).url === secOf(p).url) s += 1; if(q.category === p.category) s += 0.5;
      return [s, q]; }).filter(([s]) => s >= 5).sort((a, b) => b[0] - a[0] || String(b[1].date).localeCompare(String(a[1].date))).slice(0, 4).map(([, q]) => q);
    const ld = [{'@context': 'https://schema.org', '@type': p.category === '科技新聞' ? 'NewsArticle' : 'Article', headline: p.title, description: p.summary, image: p.cover ? [p.cover.startsWith('/') ? site.url + p.cover : p.cover] : undefined, datePublished: tw(p.iso) || p.date, dateModified: p.updated || tw(p.iso) || p.date, author: {'@type': 'Person', name: site.author, url: site.url + '/about'}, publisher: {'@type': 'Organization', name: site.name, logo: {'@type': 'ImageObject', url: site.url + '/favicon.svg'}}, mainEntityOfPage: site.url + p.url, keywords: p.tags.join(', '), articleSection: secOf(p).label, inLanguage: 'zh-Hant-TW', wordCount: p.words},
      {'@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{'@type': 'ListItem', position: 1, name: '首頁', item: site.url + '/'}, {'@type': 'ListItem', position: 2, name: secOf(p).name, item: site.url + clean(secOf(p).url)}, {'@type': 'ListItem', position: 3, name: p.title, item: site.url + p.url}]}];
    const yid = ytId(p.youtube);
    const vMeta = yid && videos.find(v => v.id === yid);
    if(vMeta && vMeta.published && !vMeta.approx && !String(vMeta.published).startsWith('1970')) ld.push({'@context': 'https://schema.org', '@type': 'VideoObject', name: vMeta.title, description: vMeta.desc || p.summary || vMeta.title, thumbnailUrl: [`https://i.ytimg.com/vi/${yid}/maxresdefault.jpg`, `https://i.ytimg.com/vi/${yid}/hqdefault.jpg`], uploadDate: vMeta.published, embedUrl: `https://www.youtube-nocookie.com/embed/${yid}`, url: `https://www.youtube.com/watch?v=${yid}`, author: {'@type': 'Person', name: site.author}});
    const videoHero = p.video && p.ig ? (p.videoSrc
      ? `<div class="native-video"><video controls playsinline preload="none" poster="${attr(p.cover || '')}" aria-label="${attr(p.title)}" src="${attr(p.videoSrc)}" onerror="this.parentElement.querySelector('.video-error').hidden=false"><a href="${attr(p.ig)}">到 IG 看原文</a></video><p class="play-note">點播放即可觀看，不用離開網站。</p><p class="video-error" role="status" hidden>影片暫時無法播放，請重新整理，或使用下方 IG 原文連結。</p></div>`
      : (yid ? '' : `<div class="native-video">${p.cover ? '<a href="' + attr(p.ig) + '" target="_blank" rel="noopener" aria-label="到 Instagram 觀看：' + attr(p.title) + '"><img class="cover social" src="' + attr(p.cover) + '" alt="' + attr(p.title) + '"></a>' : ''}<p class="play-note">這支影片請到 Instagram 觀看。</p></div>`)) : '';
    const videoLinks = p.video && p.ig ? `<div class="video-links"><a class="btn${p.videoSrc || yid ? ' o' : ''}" href="${attr(p.ig)}" target="_blank" rel="noopener">${p.videoSrc || yid ? '到 Instagram 留言／看原文 ↗' : '到 Instagram 觀看 ↗'}</a><p class="ig-url">原文網址：<a href="${attr(p.ig)}" target="_blank" rel="noopener">${esc(p.ig)}</a></p><p class="ig-help">若卡在開啟 App 的畫面，可長按原文網址複製，再貼到 Safari 或 Chrome 開啟；不必重新下載 IG。</p></div>` : '';
    const igEmbed = p.ig ? `<blockquote class="instagram-media" data-instgrm-permalink="${attr(p.ig)}" data-instgrm-version="14" style="margin:12px 0;"><a href="${attr(p.ig)}" target="_blank" rel="noopener">在 Instagram 看這則貼文</a></blockquote><script async src="https://www.instagram.com/embed.js"></script>` : '';
    const embeds = (yid && !p.html.includes(`embed/${yid}`) ? ytEmbed(yid) : '') + igEmbed
      + (p.fb ? `<p><a class="btn o" href="${attr(p.fb)}" target="_blank" rel="noopener">在 Facebook 看這則貼文</a></p>` : '');
    const mins = Math.max(1, Math.round((p.words || 0) / 420));
    const tsR = tsStrip(enhance(p.html.replace(yid ? ytEmbed(yid) : '__none__', ''), p), p.auto ? '' : yid);
    const body = `<div class="artwrap"><article><p class="crumb"><a href="${secOf(p).url}">${secOf(p).name}</a><span class="cat">${esc(secOf(p).label)}</span>${p.auto ? ` <span class="tag">${p.source === 'ig' ? 'Instagram' : 'Facebook'} 同步</span>` : ''}</p><h1>${esc(p.title)}</h1><div class="by"><span class="av" aria-hidden="true"></span><span><b>${esc(site.author)}</b>・${p.date}${p.updated ? `(更新 ${p.updated})` : ''}${!p.auto ? `・約 ${mins} 分鐘讀完` : ''}</span></div>${shareBar(p, 'top')}${p.parent ? `<a class="mergecta" href="${p.parent.url}"><span>📌 這則是 IG 短版</span><b>完整教學在這篇：${esc(p.parent.title)}</b><em>看完整步驟 →</em></a>` : ''}${p.kids && p.kids.some(k => k.ig) ? `<a class="mergecta reel" href="${attr(p.kids.find(k => k.ig).ig)}" target="_blank" rel="noopener"><span>▶ 先看 30 秒效果</span><b>${esc(p.kids.find(k => k.ig).title)}</b><em>到 Instagram 看 Reel ↗</em></a>` : ''}${p.video && p.ig ? videoHero : (p.slides ? `<div class="gal" aria-label="輪播圖片"><div class="track">${p.slides.map((g, k) => `<img src="${attr(g)}" alt="${attr(p.title)} 第 ${k + 1} 張" loading="${k ? 'lazy' : 'eager'}">`).join('')}</div><div class="galnav"><button type="button" onclick="galGo(this,-1)" aria-label="上一張">‹</button><span>滑動看 ${p.slides.length} 張</span><button type="button" onclick="galGo(this,1)" aria-label="下一張">›</button></div></div>` : (p.cover && !yid ? `<img class="cover${p.auto ? ' social' : ''}" src="${attr(p.cover)}" alt="${attr(p.title)}">` : ''))}${yid && !p.videoSrc ? ytEmbed(yid) : ''}${p.disclosure ? `<p class="note">${esc(p.disclosure)}</p>` : ''}${p.stats && p.stats.length ? `<div class="kpis" aria-label="關鍵數字">${p.stats.map(([n, l]) => `<div class="kpi"><i>${kpiIcon(n)}</i><b>${esc(n)}</b><span>${esc(l)}</span></div>`).join('')}</div>` : ''}${videoLinks}<div class="body">${hiText(tsR.html)}${tsAppendix(tsR.sections, p.auto ? '' : yid)}${plugOf(p)}</div>${shareBar(p, 'bottom')}${SHARE_JS}${yid && !p.auto ? TS_JS : ''}<script>function galGo(b,d){var t=b.closest('.gal').querySelector('.track');t.scrollBy({left:d*t.clientWidth,behavior:'smooth'})}</script>${(p.ig || p.fb) && !(p.video && p.ig) ? `<h2 style="font-size:1.05rem;margin-top:24px;">原始貼文</h2>${embeds.replace(ytEmbed(yid), '')}` : ''}
${secOf(p).url === '/posts.html' ? `<div style="margin-top:26px;">${ctaHtml}</div>` : ''}
<div class="linecta"><h2>💬 加入阿康的科技好康 LINE 社群</h2><p>新品消息、團購好康第一時間丟社群，這種教學卡關也可以直接在裡面問，阿康本人在。</p><a class="btn lnj" href="https://line.me/ti/g2/-pss-Qh7VBGsfn6_6CI6BK9xipk3wl8MPifxOQ?utm_source=invitation&utm_medium=link_copy&utm_campaign=default" target="_blank" rel="noopener">加入 LINE 社群 →</a></div>
<div class="meta" style="margin-top:22px;">${p.tags.map(t => `<span class="tag">#${esc(t)}</span>`).join('')}</div>
${(() => { const more = rel.length >= 2 ? rel : rel.concat(posts.filter(q => q.slug !== p.slug && listed(q) && !rel.includes(q)).slice(0, 4 - rel.length)); return more.length ? `<div class="sec"><h2>${rel.length >= 2 ? '同主題文章' : '更多阿康的文章'}</h2><a href="${secOf(p).url}">${secOf(p).name} →</a></div><div class="list pop">${more.map(pRow).join('')}</div>` : ''; })()}
<div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap;">${posts[i + 1] ? `<a class="btn o" href="${posts[i + 1].url}">← 上一篇:${esc(posts[i + 1].title.slice(0, 18))}…</a>` : ''}${posts[i - 1] ? `<a class="btn o" href="${posts[i - 1].url}">下一篇:${esc(posts[i - 1].title.slice(0, 18))}… →</a>` : ''}</div></article>${artRail}</div>`;
    fs.writeFileSync(path.join(DIST, 'posts', p.slug + '.html'), page({title: `${p.seoTitle || p.title}|${site.name}`, desc: p.summary, url: p.parent ? p.parent.url : p.url, image: p.cover, type: 'article', jsonld: ld, noindex: !!p.thin, cur: secOf(p).url, body}));
  }
  // 熱門股頁(建站快照 + 前端每 10 分鐘向本站函式要最新)
  fs.writeFileSync(path.join(DIST, 'hot.html'), page({title: `AI 股票工具・今日熱門股|${site.name}`, desc: `每天自動更新:強勢股雷達與話題雷達(${(hot.scan && hot.scan.d) || ''})。點任一檔直接到台股 AI 作戰室看五燈檢查表。`, url: '/hot.html', cur: '/hot.html', body: `<div class="sec"><h1>AI 股票工具</h1></div>${ctaHtml.replace(' <a class="btn o" href="/hot.html">看今日熱門股</a>', '')}<div class="sec"><h2>今日熱門股快照</h2><span id="hotTime" style="color:var(--muted);font-size:.85rem;">快照時間 ${TZ(hot.fetchedAt || BUILT).toISOString().replace('T', ' ').slice(0, 16)}(台北)</span></div><div id="hotBox">${hotBlock(hot)}</div>
<script>(async()=>{try{const r=await fetch('/.netlify/functions/hot');if(!r.ok)return;const j=await r.json();if(j&&j.html){document.getElementById('hotBox').innerHTML=j.html;document.getElementById('hotTime').textContent='即時 '+new Date().toLocaleString('zh-TW',{hour12:false});}}catch(e){}})();</script>`}));
  // 關於
  const about = `<article><h1>關於阿康(GOODSKANG)</h1><div class="body"><p>${esc(site.about)}</p>
<h2>頻道里程碑</h2>${site.milestones.map(([d, t]) => `<div class="milestone"><b>${esc(d)}</b><span>${esc(t)}</span></div>`).join('')}
<h2>三個平台</h2><ul><li><a href="${site.youtube}" target="_blank" rel="noopener">YouTube 阿康爸的平安科技日常</a>——每週 3~5 支開箱與心得</li><li><a href="${site.instagram}" target="_blank" rel="noopener">Instagram @goodskang</a>・<a href="${site.facebook}" target="_blank" rel="noopener">Facebook</a>——每天的科技快訊</li><li><a href="${site.tool}" target="_blank" rel="noopener">阿康的台股 AI 作戰室</a>——免費台股工具</li></ul>
<h2>合作邀約</h2><p>工商影片秉持公開、公正原則,影片內一定會標示廠商 Sponsor 資訊。合作請寄 <a href="mailto:${site.email}">${site.email}</a>,或到 IG / FB 私訊(通常比較快收到)。</p>
<form name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field" class="card" style="display:grid;gap:10px;max-width:560px;"><input type="hidden" name="form-name" value="contact"><p style="display:none"><label>不要填<input name="bot-field"></label></p><label>品牌 / 公司<input name="company" required style="width:100%;padding:9px;border-radius:var(--r-s);border:1px solid var(--border);background:var(--bg);color:var(--text)"></label><label>Email<input name="email" type="email" required style="width:100%;padding:9px;border-radius:var(--r-s);border:1px solid var(--border);background:var(--bg);color:var(--text)"></label><label>合作內容<textarea name="message" rows="4" required style="width:100%;padding:9px;border-radius:var(--r-s);border:1px solid var(--border);background:var(--bg);color:var(--text)"></textarea></label><button class="btn" type="submit" style="border:0;cursor:pointer;">送出</button></form>
</div></article>`;
  fs.writeFileSync(path.join(DIST, 'about.html'), page({title: `關於阿康 / 合作邀約|${site.name}`, desc: site.about, url: '/about.html', cur: '/about.html', type: 'profile', body: about}));
  // sitemap / rss / feed.json / robots / llms
  const urls = [['/', BUILT], ['/videos.html', BUILT], ['/posts.html', BUILT], ['/travel.html', BUILT], ['/picks.html', BUILT], ['/hot.html', BUILT], ['/about.html', BUILT], ...posts.filter(listed).map(p => [p.url, p.updated || p.date])];  // 太短的 IG 頁不放 sitemap、不送 IndexNow
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(([u, d]) => `<url><loc>${site.url}${clean(u)}</loc><lastmod>${ymd(d)}</lastmod></url>`).join('')}</urlset>`);
  const rssItems = [...pub.slice(0, 30).map(p => ({title: p.title, url: site.url + p.url, date: p.date, desc: p.summary, html: clean_llms(p.html)})), ...videos.slice(0, 15).map(v => ({title: '' + v.title, url: `https://www.youtube.com/watch?v=${v.id}`, date: v.published, desc: v.desc || v.title, html: `<p>${esc(v.desc || v.title)}</p>`}))].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  fs.writeFileSync(path.join(DIST, 'rss.xml'), `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${esc(site.name)}</title><link>${site.url}</link><description>${esc(site.description)}</description><language>zh-TW</language><atom:link href="${site.url}/rss.xml" rel="self" type="application/rss+xml"/>${rssItems.map(i => `<item><title>${esc(i.title)}</title><link>${i.url}</link><guid>${i.url}</guid><pubDate>${new Date(i.date).toUTCString()}</pubDate><description><![CDATA[${i.html}]]></description></item>`).join('')}</channel></rss>`);
  fs.writeFileSync(path.join(DIST, 'feed.json'), JSON.stringify({version: 'https://jsonfeed.org/version/1.1', title: site.name, home_page_url: site.url, feed_url: site.url + '/feed.json', description: site.description, language: 'zh-Hant', authors: [{name: site.author, url: site.url}], items: rssItems.map(i => ({id: i.url, url: i.url, title: i.title, content_html: i.html, summary: i.desc, date_published: new Date(i.date).toISOString()}))}));
  fs.writeFileSync(path.join(DIST, 'robots.txt'), `# 歡迎所有搜尋引擎與 AI 爬蟲索引本站(投稿後台除外)\nUser-agent: *\nAllow: /\nDisallow: /admin/\n\n${['GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'ClaudeBot', 'Claude-Web', 'anthropic-ai', 'PerplexityBot', 'Google-Extended', 'Googlebot', 'Bingbot', 'CCBot', 'Applebot', 'Applebot-Extended', 'Bytespider', 'Amazonbot', 'DuckAssistBot', 'meta-externalagent'].map(b => `User-agent: ${b}\nAllow: /\nDisallow: /admin/`).join('\n\n')}\n\nSitemap: ${site.url}/sitemap.xml\n`);
  const llms = clean_llms(`# ${site.name}(GOODSKANG)\n\n> ${site.description}\n\n作者:${site.author}(${site.email})。YouTube:${site.youtube}|Instagram:${site.instagram}|Facebook:${site.facebook}|台股 AI 工具:${site.tool}\n\n## 站內頁面\n- [首頁](${site.url}/)\n- [最新影片](${site.url}/videos.html):YouTube 頻道最新影片\n- [3C 科技新聞](${site.url}/posts.html):iPhone、Apple、特斯拉、AI 產業新聞與阿康的實測觀點\n- [親子旅遊快訊](${site.url}/travel.html):帶小孩去日本的實際經驗與出發前準備\n- [阿康愛用清單推薦](${site.url}/picks.html):阿康自己在用、親手測過的配件與用品\n- [AI 股票工具・今日熱門股](${site.url}/hot.html):強勢股雷達與話題雷達,每天自動更新\n- [關於阿康 / 合作](${site.url}/about.html)\n- [台股 AI 作戰室](${site.tool}):五燈順勢檢查表、交易計畫卡、六種策略回測(免費、免註冊,非投資建議)\n\n## 最新科技快訊\n${pub.slice(0, 30).map(p => `- [${p.title}](${site.url}${p.url}):${p.summary}`).join('\n')}\n\n## 最新影片\n${videos.slice(0, 15).map(v => `- [${v.title}](https://www.youtube.com/watch?v=${v.id})(${ymd(v.published)})`).join('\n')}\n\n## 完整內容\n- [llms-full.txt](${site.url}/llms-full.txt)\n`);
  fs.writeFileSync(path.join(DIST, 'llms.txt'), llms);
  fs.writeFileSync(path.join(DIST, 'llms-full.txt'), llms + '\n\n---\n\n' + pub.map(p => `# ${p.title}\n日期:${p.date}|分類:${p.category}|標籤:${p.tags.join(', ')}|網址:${site.url}${p.url}\n\n${p.text}\n`).join('\n---\n\n'));
  fs.writeFileSync(path.join(DIST, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n/index.html\n  Cache-Control: public, max-age=0, must-revalidate\n/hot.html\n  Cache-Control: public, max-age=0, must-revalidate\n/llms.txt\n  Content-Type: text/plain; charset=utf-8\n/llms-full.txt\n  Content-Type: text/plain; charset=utf-8\n`);
  console.log('build ok →', DIST);
  await indexNow(urls);
}
// IndexNow:每次建站把「本次有變動」的網址推給 Bing(ChatGPT 搜尋、Copilot 都用 Bing 索引)與其他支援的引擎,不用再手動去 Bing 後台提交。
// 金鑰檔放 static/<32 位 hex>.txt(內容就是金鑰本身),建站會一起複製到站上根目錄;每個網址同一個 lastmod 只送一次(記在 content/cache/indexnow.json)
async function indexNow(urls){
  let key = process.env.INDEXNOW_KEY || '';
  try{ if(!key) key = fs.readdirSync(path.join(ROOT, 'static')).map(f => (f.match(/^([a-f0-9]{32})\.txt$/) || [])[1]).find(Boolean) || ''; }catch(e){}
  if(!key){ console.log('[indexnow] 沒有金鑰檔,略過'); return; }
  const prev = readCache('indexnow.json') || {};
  const fresh = urls.map(([u, d]) => [site.url + clean(u), ymd(d)]).filter(([u, d]) => prev[u] !== d);
  if(!fresh.length){ console.log('[indexnow] 沒有新網址'); return; }
  try{
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 15000);
    const r = await fetch('https://api.indexnow.org/indexnow', {method: 'POST', signal: ctl.signal, headers: {'content-type': 'application/json; charset=utf-8'}, body: JSON.stringify({host: site.url.replace(/^https?:\/\//, ''), key, keyLocation: `${site.url}/${key}.txt`, urlList: fresh.map(([u]) => u).slice(0, 10000)})});
    clearTimeout(t);
    console.log(`[indexnow] 送出 ${fresh.length} 個網址,回應 ${r.status}`);
    if(r.status === 200 || r.status === 202){ for(const [u, d] of fresh) prev[u] = d; writeCache('indexnow.json', prev); await pushCache('content/cache/indexnow.json', JSON.stringify(prev)); }
  }catch(e){ console.warn('[indexnow] 失敗:', e.message); }
}
main().catch(e => { console.error(e); process.exit(1); });
