// 📮 投稿:admin/post.html 送來的貼文 → 寫進 GitHub repo 的 content/posts/(圖片進 content/img/)→ Netlify 自動重建
// 需要環境變數:PUBLISH_KEY(投稿密碼)、GITHUB_TOKEN(有 repo 內容寫入權限的 fine-grained token)、GITHUB_REPO(owner/repo)、GITHUB_BRANCH(預設 main)
exports.handler = async (event) => {
  const J = (code, body) => ({statusCode: code, headers: {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store'}, body: JSON.stringify(body)});
  if(event.httpMethod !== 'POST') return J(405, {error: 'POST only'});
  let b; try{ b = JSON.parse(event.body || '{}'); }catch(e){ return J(400, {error: 'bad json'}); }
  const KEY = process.env.PUBLISH_KEY || '';
  if(!KEY || b.key !== KEY) return J(401, {error: '密碼錯誤'});
  const TOKEN = process.env.GITHUB_TOKEN, REPO = process.env.GITHUB_REPO, BR = process.env.GITHUB_BRANCH || 'main';
  if(!TOKEN || !REPO) return J(500, {error: '伺服器未設定 GITHUB_TOKEN / GITHUB_REPO'});
  const title = String(b.title || '').trim(), body = String(b.body || '').trim();
  if(!title || !body) return J(400, {error: '標題與內文必填'});
  const tz = new Date(Date.now() + 8 * 3600e3);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(b.date || '') ? b.date : tz.toISOString().slice(0, 10);
  const stamp = tz.toISOString().slice(11, 16).replace(':', '');
  const ascii = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  const slug = `${date}-${stamp}${ascii ? '-' + ascii : ''}`;
  const gh = async (p, method, payload) => {
    const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${p}`, {method, headers: {authorization: `Bearer ${TOKEN}`, accept: 'application/vnd.github+json', 'content-type': 'application/json', 'user-agent': 'goodskang-site'}, body: payload ? JSON.stringify(payload) : undefined});
    const j = await r.json().catch(() => ({}));
    if(!r.ok) throw new Error(`GitHub ${r.status}: ${j.message || ''}`);
    return j;
  };
  let cover = String(b.cover || '').trim();
  try{
    if(b.image && b.image.base64){
      const ext = /png/i.test(b.image.type || '') ? 'png' : 'jpg';
      const ip = `content/img/${slug}.${ext}`;
      await gh(ip, 'PUT', {message: `img: ${title}`, branch: BR, content: b.image.base64.replace(/^data:[^,]+,/, '')});
      cover = `/img/${slug}.${ext}`;
    }
    const fm = [`title: ${title.replace(/\n/g, ' ')}`, `date: ${date}`, `category: ${(b.category || '科技').trim()}`, `tags: ${(b.tags || '').trim()}`, cover ? `cover: ${cover}` : '', b.youtube ? `youtube: ${String(b.youtube).trim()}` : '', b.ig ? `ig: ${String(b.ig).trim()}` : '', b.fb ? `fb: ${String(b.fb).trim()}` : '', b.summary ? `summary: ${String(b.summary).trim().replace(/\n/g, ' ')}` : ''].filter(Boolean).join('\n');
    const mdText = `---\n${fm}\n---\n${body}\n`;
    await gh(`content/posts/${slug}.md`, 'PUT', {message: `post: ${title}`, branch: BR, content: Buffer.from(mdText, 'utf8').toString('base64')});
    return J(200, {ok: true, slug, url: `/posts/${slug}.html`, note: 'Netlify 正在重建,約 1~2 分鐘後文章上線'});
  }catch(e){ return J(500, {error: e.message}); }
};
