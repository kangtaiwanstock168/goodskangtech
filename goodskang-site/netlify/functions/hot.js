// 📈 熱門股即時代理:向 AI 作戰室的 scan / news 函式拿最新資料,組成 HTML 給 hot.html 前端替換(避免跨網域問題)
const site = require('../../content/site.json');
let names = {}; try{ names = require('../../content/names.json'); }catch(e){}
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
exports.handler = async () => {
  const get = async (u, ms) => { const c = new AbortController(); const t = setTimeout(() => c.abort(), ms); try{ const r = await fetch(u, {signal: c.signal}); return r.ok ? await r.json() : null; }catch(e){ return null; } finally{ clearTimeout(t); } };
  const [scanRaw, news] = await Promise.all([get(site.toolFunctions + '/scan', 8000), get(site.toolFunctions + '/news', 9000)]);
  const scan = Array.isArray(scanRaw) ? {list: scanRaw} : scanRaw;
  const list = ((scan && scan.list) || []).slice(0, 8), top = ((news && news.top) || []).slice(0, 8);
  if(!list.length && !top.length) return {statusCode: 503, headers: {'cache-control': 'no-store'}, body: '{}'};
  const link = id => `${site.tool}?s=${encodeURIComponent(id)}`, nm = id => names[id] || id;
  const a = list.map(h => `<div class="stock"><span><a class="nm" href="${link(h.id)}" target="_blank" rel="noopener">${esc((h.name || h.id).replace(/\*/g, ''))}</a> <span class="sub">${h.id}${h.k ? '・🔥 人氣' : ''}</span></span><span><b>${h.c}</b> <span class="up">▲ ${Number(h.pct).toFixed(2)}%</span> <span class="sub">${(h.val / 1e8).toFixed(1)} 億</span></span></div>`).join('') || '<p style="color:var(--muted);">今日資料更新中。</p>';
  const b = top.map(x => `<div class="stock"><span><a class="nm" href="${link(x.id)}" target="_blank" rel="noopener">${esc(nm(x.id))}</a> <span class="sub">${x.id}</span></span><span class="sub">📰 ${x.n} 則</span></div>`).join('') || '<p style="color:var(--muted);">今日資料更新中。</p>';
  const themes = ((news && news.themes) || []).slice(0, 4).map(t => `<span class="pill">${esc(t.name)}</span> ${(t.stocks || []).slice(0, 4).map(s => `<a href="${link(s.id)}" target="_blank" rel="noopener">${esc(nm(s.id))}</a>`).join('、')}`).join(' <span style="opacity:.4">|</span> ');
  const html = `<div class="hot"><div class="card"><h3 style="margin:0 0 8px;">⚡ 強勢股雷達 <span style="color:var(--muted);font-size:.8rem;">${esc((scan && scan.d) || '')} 收盤</span></h3>${a}</div><div class="card"><h3 style="margin:0 0 8px;">📰 話題雷達 <span style="color:var(--muted);font-size:.8rem;">${esc((news && news.day) || '')}</span></h3>${b}${themes ? `<p style="margin:10px 0 0;font-size:.9rem;line-height:2;">🎯 今日主題:${themes}</p>` : ''}</div></div><p class="disc">依證交所/櫃買公開資料與新聞報導則數客觀排序,非選股建議。</p>`;
  return {statusCode: 200, headers: {'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=600'}, body: JSON.stringify({html})};
};
