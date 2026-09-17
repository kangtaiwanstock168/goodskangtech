# 阿康的科技生活站——上線步驟(約 15 分鐘)

這個資料夾就是完整網站原始碼。零套件、零資料庫:Netlify 建站時跑 `node build.js`,自動抓 YouTube 頻道最新影片與 AI 工具的雷達資料,產出所有頁面。

## 一、建 GitHub repo
1. GitHub 新建 repo `goodskang-site`(Public 或 Private 都可)。
2. 把這個資料夾的**全部檔案**上傳(GitHub 網頁 → Add file → Upload files,整個資料夾拖進去;`dist/` 不用上傳,建站會自動產生)。

## 二、建 Netlify 站
1. Netlify → Add new site → Import from Git → 選 `goodskang-site`。
2. Build command 會自動讀 `netlify.toml`(`node build.js`,publish `dist`),直接 Deploy。
3. Site settings → Change site name → `goodskang`(網址變成 goodskang.netlify.app)。之後綁自己的網域也在這裡。
4. `content/site.json` 的 `url` 改成你的正式網址(現在是 https://goodskang.netlify.app)。**FB 粉專網址請確認**(目前填 https://www.facebook.com/goodskang,若不同請改)。

## 三、開啟「手機投稿」(讓每天的貼文自動變網頁)
Netlify → Site configuration → Environment variables,新增 4 個:

| 變數 | 內容 |
|---|---|
| `PUBLISH_KEY` | 你自訂的投稿密碼(例:一串 12 碼以上) |
| `GITHUB_TOKEN` | GitHub → Settings → Developer settings → Fine-grained tokens → 只勾這個 repo、Permissions: **Contents → Read and write** |
| `GITHUB_REPO` | `你的帳號/goodskang-site` |
| `GITHUB_BRANCH` | `main`(預設可不填) |

設好後 **Trigger deploy** 一次。以後打開 `https://goodskang.netlify.app/admin/post.html`(可加到手機主畫面):貼標題、內文、圖(或 YouTube 連結)→ 發布 → 自動寫進 GitHub → Netlify 重建 → 1~2 分鐘上線,首頁/科技快訊/RSS/llms.txt 全部同步。

## 三之二、全自動同步 IG / FB 貼文(不用投稿也會上)
網站每天 06:10、18:10 建站時會用 **Meta Graph API** 抓你自己的 IG / FB 最近 50 則貼文,自動變成文章頁(標題=第一行、標籤=#hashtag、圖片下載到本站、IG/FB 交叉發的同一篇只留一篇並掛兩個原文連結;貼文裡有 YouTube 連結會自動嵌入)。IG/FB 沒有 RSS、也禁止爬蟲,這是唯一穩定合法的做法。設定一次、60 天換一次 token:

1. IG 必須是**商業帳號或創作者帳號**,且已連結你的 FB 粉絲專頁(IG 設定 → 帳號類型與工具 → 可確認)。
2. 到 https://developers.facebook.com → My Apps → Create App(類型選「其他」→「商業」)→ 加入產品 **Instagram Graph API** 與 **Facebook Login for Business**。
3. 開 **Graph API Explorer**(Tools):選你的 App → User Token → 權限勾 `pages_show_list, pages_read_engagement, instagram_basic, business_management` → Generate Access Token(登入授權,勾選你的粉專與 IG)。
4. 在 Explorer 送 `GET /me/accounts` → 記下粉專的 `id`(= **FB_PAGE_ID**)與 `access_token`(這是 **Page Token**,用它建站不會 60 天過期)。
5. 再送 `GET /{FB_PAGE_ID}?fields=instagram_business_account` → 記下 `instagram_business_account.id`(= **IG_USER_ID**)。
6. 把 Page Token 換成長效:`GET /oauth/access_token?grant_type=fb_exchange_token&client_id=APP_ID&client_secret=APP_SECRET&fb_exchange_token=剛才的Token`(App ID/Secret 在 App settings → Basic)。
7. Netlify 環境變數新增:`META_TOKEN`(長效 Page Token)、`IG_USER_ID`、`FB_PAGE_ID` → Trigger deploy。

之後投稿頁只用來發「IG/FB 沒有」的內容,或補圖補影片;同一篇 IG 你手動投稿過(填了 IG 連結),自動抓的就會略過,不會重複。

**懶人替代方案(不碰 Meta 開發者後台)**:IFTTT / Make 設「Instagram 新貼文 → Webhook」,POST 到 `https://goodskang.netlify.app/.netlify/functions/publish`,JSON:`{"key":"你的PUBLISH_KEY","title":"{{Caption}} 前 40 字","body":"{{Caption}}","cover":"{{SourceUrl}}","ig":"{{Url}}"}`。缺點是 IFTTT 的 IG 連接常失效,Graph API 比較穩。

## 四、每天自動更新影片與熱門股
1. Netlify → Site configuration → Build & deploy → **Build hooks** → Add build hook(名稱 daily)→ 複製網址。
2. 環境變數新增 `BUILD_HOOK` = 那個網址。
3. `netlify.toml` 已排程每天台北 06:10 與 18:10 自動重建(抓 YouTube RSS、IG/FB 貼文與雷達);你投稿時也會重建。

## 五、讓 Google / AI 搜尋找到你
- Google Search Console 新增資源 → 提交 `https://goodskang.netlify.app/sitemap.xml`。
- Bing Webmaster Tools 同樣提交 sitemap(ChatGPT 搜尋用 Bing 索引)。
- 站內已內建:每頁 JSON-LD(WebSite / Person / Article / VideoObject / Breadcrumb)、Open Graph、`robots.txt`(明確允許 GPTBot、ClaudeBot、PerplexityBot、Google-Extended 等 AI 爬蟲)、`llms.txt` + `llms-full.txt`(給 AI 讀的全站摘要與全文)、`rss.xml`、`feed.json`。
- 在 YouTube 頻道說明、IG 簡介、AI 工具頁面加上這個網址,讓「阿康 → 網站」的連結關係被抓到。

## 六、GA(選填)
`content/site.json` 的 `ga` 填 `G-XXXXXXX` 即可全站生效。

## 檔案說明
- `build.js`:產生器(想改版型改這裡,CSS 在裡面)
- `content/site.json`:站名、社群連結、關於、里程碑
- `content/posts/*.md`:每篇貼文(投稿頁會自動建;也可手動放)
- `content/img/`:投稿上傳的圖
- `content/cache/`:上次抓到的影片與熱門股(抓不到時的備援)
- `content/names.json`:股票代號→名稱(話題雷達用;想補就補)
- `admin/post.html`:投稿頁(robots 已設 noindex)
- `netlify/functions/publish.js`:投稿寫入 GitHub|`daily.js`:每日排程重建|`hot.js`:熱門股即時代理
- IG/FB 自動同步的文章網址是 `/posts/ig-<貼文ID>.html`、`/posts/fb-<貼文ID>.html`,圖在 `/img/social/`

貼文格式(手動放也行):
```
---
title: 標題
date: 2026-09-17
category: iPhone
tags: iPhone 18 Pro, Apple
cover: https://...(選填;有 youtube 就自動用影片縮圖)
youtube: https://youtu.be/xxxx(選填)
ig: https://www.instagram.com/p/xxxx/(選填,文末嵌入)
fb: https://www.facebook.com/...(選填)
summary: 一句話摘要(選填)
---
內文,支援 # 標題、- 清單、**粗體**、[連結](網址)、![圖](網址);單獨一行貼 YouTube 連結會自動嵌入。
```
