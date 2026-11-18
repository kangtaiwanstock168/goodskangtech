---
title: iPhone Duo 開合次數計算教學！每開一次扣一滴血，開滿一千次升級
seo_title: iPhone Duo 開合次數統計教學：捷徑自動記錄＋Scriptable HP 血條 Widget（免費、六個步驟、不用寫程式）
date: 2026-10-29
category: 科技新聞
tags: iPhone Duo, 捷徑, Scriptable, 摺疊手機, 鉸鏈, iOS 27, Widget
cover: /img/duo-titles-cover.jpg
featured: 2026-11-12
read_mins: 5
merge: ig-18014415008967821
next: /posts/2026-10-27-iphone-duo-review｜Duo 兩天實測影片; /posts/2026-10-21-iphone-duo-apple-case-unboxing｜Duo 原廠殼開箱; /posts/2026-10-29-titanshield-pro-magsafe-power-bank｜MagSafe 行動電源怎麼挑
next_title: 👀 血條裝好了？接著看這幾支
summary: 網路一直傳摺疊機開合一萬次會壞，阿康從拿到 iPhone Duo 那天起每一次都記。六個步驟：升到 iOS 27.2、匯入四個捷徑、建兩條自動化、開合三次測試、裝免費的 Scriptable 貼程式碼、放小工具，桌面就有一條 HP 血條，開一次扣一滴，一千次升一級，11 個稱號等你解。
stats: 20,000｜HP 滿血值，開合一次扣 1; 40–50 次｜阿康正常用一天開合的次數; 1,000 次｜升一級，共 11 個稱號; 0 元｜全部用內建捷徑＋免費 Scriptable
---

網路一直傳摺疊機鉸鏈開合一萬次就會出問題。這是傳聞，Apple 沒公布 iPhone Duo 鉸鏈的測試次數。阿康不信，但想親眼看，所以從拿到手那天起每開一次都記。

桌面一個 Widget，兩萬滴血，開一次扣一滴，每一千次升一級換稱號。阿康正常用一天開 40 到 50 次，到今天累計 153 次；照這速度一萬次大約 2027 年年中到，兩萬滴血 2028 年初扣完。

![摺疊機之路 Widget：累計 153、今天 52、HP 剩 19,847](/img/duo-widget-153.jpg)

阿康 10/29 傍晚的桌面：累計 153、今天 52、本週 65，HP 剩 19,847。Widget 自己算的「每天約 21.9 次」是從 10/23 拿到手那天起平均，前三天在測試手機開得少所以偏低，正常用是一天 40 到 50 次。

裝之前先看兩件事：要 iPhone Duo（別的 iPhone 沒有「打開」這個觸發條件），iOS 要 27.2。Duo 出廠是 27.1，27.2 是 10/27 才推的，沒升的話後面全部會卡，所以第①步就是升級。全部免費，不用寫程式，六步大概十分鐘，下面每一張卡就是你手機上要按的一步。

## 六個步驟

**① 先升到 iOS 27.2**

```steps
⚙️ 「設定」→「一般」→「軟體更新」，有 iOS 27.2 就更新
🔎 更新完到「設定」→「一般」→「關於本機」，「iOS 版本」要是 27.2
```

**② 點四個連結，全部按「加入捷徑」**

| | 點這個 |
|---|---|
| A 打開 iPhone | [匯入 A](https://www.icloud.com/shortcuts/b8b58839bd6545138ec511bd5078c48a) |
| B 算次數 | [匯入 B](https://www.icloud.com/shortcuts/a89d51bfad614842b9c40985935f977d) |
| C 刪除 | [匯入 C](https://www.icloud.com/shortcuts/dfe722a85f6c4a868888904762ad93b5) |
| D 累積 | [匯入 D](https://www.icloud.com/shortcuts/22637bc9e5514043bc96c5bcce536d0d) |

加完到「所有捷徑」會看到四個。iCloud 連結帶不過去「什麼時候跑」這件事，所以 A 和 C 要跑的時機，下一步自己設，兩條加起來一分鐘。

[[卡:/posts/2026-10-27-iphone-duo-review｜📺 四個捷徑加好了？先看阿康 Duo 用兩天的真實續航｜看完按返回，接著做第 ③ 步 →]]

**③ 建兩條自動化，告訴手機 A、C 什麼時候跑**

A 這條，每次打開手機就記一次：

```steps
📱 打開「捷徑」App，點「自動化」分頁（攤開時在左邊側欄，闔起來在最下面）
➕ 右上角「＋」
📲 清單裡找「iPhone 打開時」（有的版本叫「iPhone 打開或閉合」，勾「打開」；清單裡沒有就是還在 27.1，回第①步）
⚡ 選「立即執行」，不要選「確認後執行」
➡️ 按右上角「下一步」（一定要先按這個，這一頁的搜尋框只搜觸發條件，搜不到捷徑）
🔍 跳到捷徑清單那頁後，搜尋框打「打開 iPhone」，點「A 打開 iPhone」
✅ 右上角「完成」
```

C 這條，每天 04:00 換天：

```steps
➕ 回「自動化」分頁，右上角「＋」
⏰ 清單裡找「特定時間」
🕓 時間改「04:00」，重複選「每日」
⚡ 有「立即執行」就選它；只有「啟用」和「通知」兩個開關的話，「啟用」開著就好
➡️ 按右上角「下一步」（先按這個才會到捷徑清單）
🔍 跳到捷徑清單那頁後，搜尋框打「刪除」（只打 c 常常找不到），點「C 刪除」
✅ 右上角「完成」
```

做完「自動化」分頁會有兩條：「iPhone 打開時 → 打開 iPhone A」和「04:00（每天）→ C 刪除」，開關都是綠的。

**④ 開合三次，按「B 算次數」**

```steps
📱 手機闔上再打開，做三次
▶️ 到「所有捷徑」點「B 算次數」
🔓 第一次會問「要允許取用檔案嗎」，按「永遠允許」
3️⃣ 跳「3」就成功；還是 0 或 1 看下面常見問題 Q3
```

**⑤ 裝 Scriptable，貼程式碼**

```steps
⬇️ App Store 搜「Scriptable」免費下載，或點 https://apps.apple.com/tw/app/scriptable/id1405459188
⚙️ 打開 Scriptable，左上角齒輪
📁 「File Bookmarks」→「＋」→「Pick Folder」
☁️ 跳出檔案畫面：最下面點「瀏覽」→「iCloud 雲碟」→ 「捷徑」資料夾（圖示是捷徑 App 的 logo）→ 右上角「打開」
✏️ 名稱打「Shortcuts」（S 大寫，其他小寫）→「Save」
➕ 回 Scriptable 首頁，右上角「＋」新增腳本，名稱改成「Duo」
📋 按下面黃色「一鍵複製程式碼」，回 Scriptable 在空白處長按 →「貼上」
```

```
const fm = FileManager.iCloud()
const dir = fm.bookmarkedPath("Shortcuts")
const BASE = 0
const GOAL = 20000
const START = null
const LV_STEP = 1000

function readLines(name) {
  const p = fm.joinPath(dir, name)
  if (!fm.fileExists(p)) return []
  try { fm.downloadFileFromiCloud(p) } catch (e) {}
  return (fm.readString(p) || "").split("\n")
}

const today = readLines("duo_today.txt").filter(l => l.trim() === "open").length

const byDay = {}
let cur = null
let undated = 0
function parseDay(l) {
  let m = l.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/)
  if (m) return new Date(+m[1], +m[2] - 1, +m[3])
  m = l.match(/(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/)
  if (m) return new Date(+m[1], +m[2] - 1, +m[3])
  m = l.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/)
  if (m) return new Date(+m[3], +m[1] - 1, +m[2])
  const t = Date.parse(l.replace(/\s+at\s+/i, " ").replace(/[上下]午/g, ""))
  return isNaN(t) ? null : new Date(t)
}
for (const raw of readLines("duo_history.txt")) {
  const l = raw.trim()
  if (!l) continue
  if (l === "open") {
    if (cur) byDay[cur]++
    else undated++
    continue
  }
  const d = parseDay(l)
  if (d) {
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - 1)
    cur = d.toDateString()
    if (!(cur in byDay)) byDay[cur] = 0
  } else {
    cur = null
  }
}

const now = new Date()
const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0)
const weekStart = new Date(dayStart); weekStart.setDate(dayStart.getDate() - ((dayStart.getDay() + 6) % 7))
const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

function sumFrom(start) {
  let s = 0
  for (const k in byDay) if (new Date(k) >= start) s += byDay[k]
  return s
}
const hist = sumFrom(new Date(0)) + undated
const week = sumFrom(weekStart) + today
const month = sumFrom(monthStart) + today + BASE
const total = BASE + hist + today

const hp = Math.max(0, GOAL - total)
const hpPct = hp / GOAL
const hpColor = hpPct > 0.5 ? new Color("#30d158")
              : hpPct > 0.2 ? new Color("#ffd60a")
              : new Color("#ff453a")

const titles = [
  "摺疊初心者", "摺疊見習生", "摺疊勇者", "摺疊達人", "摺疊騎士",
  "鉸鏈大師", "鉸鏈狂人", "鉸鏈守護者", "鉸鏈傳說", "鉸鏈終結者", "鉸鏈宗師"
]
const lv = Math.min(Math.floor(total / LV_STEP) + 1, titles.length)
const title = titles[lv - 1]
const nextLv = lv < titles.length ? LV_STEP * lv - total : 0
const lvColor = lv >= 11 ? new Color("#ffd700")
              : lv >= 9  ? new Color("#ff9f0a")
              : lv >= 6  ? new Color("#bf5af2")
              : lv >= 3  ? new Color("#64d2ff")
              : new Color("#c8cce6")

const quip = today === 0 ? "手機在休假"
           : today < 10 ? "佛系使用"
           : today < 30 ? "正常人的一天"
           : today < 50 ? "有點黏手機"
           : today < 80 ? "手指在練肌肉"
           : "跟鉸鏈吵架中"

let firstDay = dayStart
for (const k in byDay) { const d = new Date(k); if (d < firstDay) firstDay = d }
const startDay = START || firstDay
const days = Math.max(1, Math.round((dayStart - startDay) / 86400000) + 1)
const rate = total / days
const daysLeft = rate > 0 ? Math.round(hp / rate) : 0
const zero = new Date(now); zero.setDate(zero.getDate() + daysLeft)
const df = new DateFormatter(); df.dateFormat = "yyyy/MM/dd"

const gray = new Color("#9aa0c0")
const white = Color.white()
const w = new ListWidget()
w.backgroundColor = new Color("#14172b")
w.setPadding(11, 16, 9, 16)

const head = w.addStack(); head.centerAlignContent()
const h1 = head.addText("摺疊機之路")
h1.font = Font.boldSystemFont(13); h1.textColor = white
head.addSpacer()
const lvT = head.addText("Lv." + lv + "  " + title)
lvT.font = Font.boldSystemFont(11); lvT.textColor = lvColor

w.addSpacer(8)

const body = w.addStack(); body.centerAlignContent()

const L = body.addStack(); L.layoutVertically(); L.size = new Size(96, 0)
const l1 = L.addText("累計開合"); l1.font = Font.systemFont(10); l1.textColor = gray
const l2 = L.addText(total.toLocaleString()); l2.font = Font.boldSystemFont(30); l2.textColor = white; l2.minimumScaleFactor = 0.6
const l3 = L.addText("次"); l3.font = Font.systemFont(10); l3.textColor = gray

body.addSpacer()

const C = body.addStack(); C.layoutVertically(); C.centerAlignContent()
const c1 = C.addText("今天"); c1.font = Font.systemFont(10); c1.textColor = gray; c1.centerAlignText()
const c2 = C.addText(String(today)); c2.font = Font.boldSystemFont(46); c2.textColor = hpColor; c2.centerAlignText(); c2.minimumScaleFactor = 0.6
const c3 = C.addText(quip); c3.font = Font.systemFont(10); c3.textColor = new Color("#c8cce6"); c3.centerAlignText()

body.addSpacer()

const R = body.addStack(); R.layoutVertically(); R.size = new Size(96, 0)
function mini(label, val, color) {
  const r = R.addStack(); r.centerAlignContent()
  r.addSpacer()
  const a = r.addText(label + "  "); a.font = Font.systemFont(10); a.textColor = gray
  const b = r.addText(String(val)); b.font = Font.boldSystemFont(14); b.textColor = color || white
  R.addSpacer(3)
}
mini("本週", week)
mini("本月", month)
mini("升級還差", nextLv > 0 ? nextLv.toLocaleString() : "滿級", lvColor)

w.addSpacer(8)

const hpHead = w.addStack(); hpHead.centerAlignContent()
const hl = hpHead.addText("HP"); hl.font = Font.boldSystemFont(10); hl.textColor = hpColor
hpHead.addSpacer(6)
const hv = hpHead.addText(hp.toLocaleString() + " / " + GOAL.toLocaleString()); hv.font = Font.systemFont(10); hv.textColor = gray
hpHead.addSpacer()
const hpTxt = hpHead.addText((hpPct * 100).toFixed(1) + "%"); hpTxt.font = Font.boldSystemFont(10); hpTxt.textColor = hpColor

w.addSpacer(3)
const bar = w.addStack()
bar.size = new Size(0, 6); bar.cornerRadius = 3
bar.backgroundColor = new Color("#2a2e4a")
const fill = bar.addStack()
fill.backgroundColor = hpColor; fill.cornerRadius = 3
fill.size = new Size(Math.max(2, 300 * hpPct), 6)
bar.addSpacer()

w.addSpacer(4)
const ft = w.addText("每天約 " + rate.toFixed(1) + " 次・照這速度 " + df.string(zero) + " 血條歸零")
ft.font = Font.systemFont(9); ft.textColor = new Color("#6b7090"); ft.minimumScaleFactor = 0.8

w.refreshAfterDate = new Date(Date.now() + 10 * 60 * 1000)
Script.setWidget(w)
w.presentMedium()
Script.complete()
```

**⑥ 放到桌面**

```steps
👆 主畫面空白處長按，左上角「＋」加入小工具
🔎 搜「Scriptable」，選「中尺寸」那一款，加入
👆 長按剛放上去的 Widget →「編輯小工具」
📜 「Script」點進去選「Duo」
✅ 點旁邊空白處關掉，血條就出來了
```

搞定。Widget 會顯示今天次數、累計、本週、本月、稱號、HP 血條和「照這速度哪天歸零」。

**開合完數字沒馬上動？正常的，看這兩張卡**

```steps
⏱️ Widget 不是即時的，大概每 3 到 5 分鐘才自己更新一次，開完合完數字還停在原地很正常
👆 想立刻看到最新數字：手指點一下 Widget，它會馬上重算一次
```

💬 **做到一半卡關？**先看下面的[常見問題 →](#s2)，大家遇過的狀況都整理在 12 題裡，照你手機上看到的畫面找對應那題，幾乎都能自己解決。

[[接著看]]

## 常見問題

每一題都是「你在 iPhone Duo 上會看到的畫面」。捷徑 App 攤開時分頁在左邊側欄，闔起來時在畫面最下面，位置不同、名字一樣。

### Q1. 「自動化」清單裡找不到「iPhone 打開時」／點連結寫「此自動化操作需要較新版本的捷徑」
你的 iOS 還是 27.1。「iPhone 打開時」這個條件是 27.2 才有的，27.1 的清單裡不會有它。

```steps
⚙️ 「設定」→「一般」→「軟體更新」，更新到 iOS 27.2
🔁 回第③步建自動化，這次清單裡就有「iPhone 打開時」了；捷徑不用重新匯入
```

### Q2. C 的「特定時間」那頁，「立即執行」「確認後執行」「執行時通知」要選哪個？為什麼是四點？
C 是「換天」用的：每天 04:00 把今天的紀錄搬進歷史檔、今天歸零。
- 有「立即執行」就選它。選「確認後執行」，四點只會跳一則通知問你，沒人會按，天就永遠不換
- 那頁只有「啟用此自動化操作」和「執行時通知」：「啟用」開著就會自己跑，「通知」隨你
- 選四點不選十二點，是因為半夜十二點很多人還在滑，四點幾乎沒人在開合，熬夜那幾次算前一天比較合理

### Q3. 開合三次，按 B 跳出來還是 0 或 1
A 沒有在每次打開時跑，照卡片順序查，查到哪張不對就修哪張：

```steps
📂 「自動化」分頁有「iPhone 打開時」這條嗎？沒有 → 回第③步建；清單裡找不到這個條件 → 看 Q1
⚡ 點進那條，是「立即執行」嗎？「確認後執行」每次只會跳通知，不會自己記
▶️ 回「所有捷徑」手動按一下 A，跳「要允許取用檔案嗎」按「永遠允許」。自動化在背景跑不會問你，沒按過會悄悄失敗
📄 「檔案」App →「瀏覽」→「iCloud 雲碟」→「捷徑」資料夾 → 打開 duo_today.txt，幾行 open 就是記了幾次
💬 檔案有 3 行但 B 說 1 → 截圖私訊我
```

### Q4. 按 A 跳紅字「無法執行動作，因為所選位置不存在」／檔案 App 找不到 Shortcuts 資料夾／Scriptable 的 Pick Folder 看不到 iCloud 雲碟
三個是同一件事：紀錄要寫進 iCloud 雲碟裡「捷徑」App 的資料夾。那個資料夾在中文 iPhone 上顯示「捷徑」，不是 Shortcuts，圖示是捷徑 App 的 logo。

```steps
⚙️ 「設定」→ 最上面你的名字 →「iCloud」→「雲碟」
☁️ 「同步此 iPhone」打開
📋 同一頁往下「顯示全部」，把「捷徑」打開
🔄 把捷徑 App 從多工整個滑掉，重開
▶️ 到「所有捷徑」手動按一次 A，「捷徑」資料夾會自己長出來，不用自己建
📁 Scriptable 的 Pick Folder 停在別的資料夾：最下面點「瀏覽」（或左上角「<」退到「位置」）→「iCloud 雲碟」→「捷徑」→ 右上角「打開」
```

### Q5. C 跑到「刪除檔案」那格跳紅字／四點手機剛好關機
紅字：點進 C，把「刪除」那格裡的檔案重新選一次 duo_today.txt。關機：那天不會換天，兩天的次數疊在一起，歷史檔裡看日期分得出來。

### Q6. 從 IG 或 Facebook 點進這篇，黃色「一鍵複製程式碼」按了沒反應
IG 和 FB 自己的瀏覽器會擋剪貼簿。

```steps
⋯ 右上角「⋯」→「用 Safari 開啟」
📋 再按一次黃色「一鍵複製程式碼」
🧭 還是不行：用 Safari 開 https://goodskang.tw/Duo.txt ，長按「全選」→「拷貝」
```

### Q7. 開合完 Widget 數字沒動／整塊紅字「No bookmark named "Shortcuts" found」
數字沒動是正常的，Widget 不是即時的：

```steps
⏱️ Widget 大概每 3 到 5 分鐘才自己更新一次
👆 想馬上看到最新數字，點一下 Widget 就立刻重算
```

紅字是 Scriptable 找不到書籤：Scriptable → 左上齒輪 →「File Bookmarks」，書籤名稱要是「Shortcuts」（S 大寫），沒有就照第⑤步加一個，加完點一下 Widget 紅字就消失。

### Q8. 我拿到 Duo 已經開過很多次了，想從真實數字開始
Scriptable 裡點開 Duo 腳本，最上面 `BASE = 0` 改成你估的次數，右上角「完成」，點一下 Widget 就會算進去。「每天約幾次」會自動從你第一天有紀錄的日期開始算，不用另外設定日期。

### Q9. 我不是 Duo 可以玩嗎？資料會傳到阿康那邊嗎？
別的 iPhone 不行，「iPhone 打開時」只有 iPhone Duo 的捷徑有。資料哪都不傳，三個檔案都在你自己 iCloud 雲碟的「捷徑」資料夾，捷徑和 Scriptable 都在你手機上跑，阿康看不到你開幾次。

### Q10. 四個捷徑都加了，搜尋框打「打開 iPhone」卻找不到「A 打開 iPhone」
你還在第一頁。建自動化有兩頁：第一頁的搜尋框只搜「觸發條件」（時間、鬧鐘、Wi-Fi 那些），不會列出捷徑。

```steps
📲 第一頁：選「iPhone 打開時」＋「立即執行」
➡️ 按右上角「下一步」
🔍 第二頁才是捷徑清單，這時搜尋框打「打開 iPhone」就會看到「A 打開 iPhone」
📂 下一步之後還是沒有：回「所有捷徑」看 A 是不是真的加進來了，沒有就回第②步再點一次「匯入 A」
```

### Q11. 當天有算，隔天累計就歸零
兩個原因，看你是按 D 還是看桌面 Widget。

按 D 看累計：11/16 前匯入的 D 讀錯檔案，數的是今天不是歷史，照下面改一格就好。

```steps
📱 「所有捷徑」找到「D 累計」，點右上角「⋯」打開編輯
📄 第一格「取得檔案」，把「duo_today.txt」改成「duo_history.txt」
✅ 右上角「完成」，再按一次 D 就是正確的累計
```

看桌面 Widget：手機語言不是中文的話，舊版程式讀不懂歷史檔裡的日期，以前的次數就沒算進去。11/16 已更新程式，重新貼一次就好，以前的次數都還在，貼完會自己補回來。

```steps
📋 回第⑤步，按黃色「一鍵複製程式碼」
📜 打開 Scriptable 的「Duo」，空白處長按「全選」→「貼上」蓋掉舊的 → 右上角「完成」
👆 點一下桌面 Widget，累計就回來了
```

### Q12. 換了新手機：A 跳「無法打開檔案 duo_today.txt」／Widget 紅字「Cannot resolve bookmark named "Shortcuts"」
捷徑會跟著 iCloud 搬過來，但有三樣東西只存在舊手機：Scriptable 的書籤、「允許取用檔案」的授權、還有下載到手機裡的檔案。新手機要各補一次。

```steps
☁️ 「設定」→ 你的名字 →「iCloud」→「雲碟」，「同步此 iPhone」打開，「顯示全部」裡的「捷徑」也打開
📄 「檔案」App →「瀏覽」→「iCloud 雲碟」→「捷徑」，duo_today.txt 和 duo_history.txt 各點開一次，旁邊的雲朵消失才算下載好
▶️ 「所有捷徑」手動按一次 A，跳「要允許取用檔案嗎」按「永遠允許」
▶️ C 也手動按一次，按「永遠允許」（今天已記的次數會先算到昨天，總累計不會少）
📂 「自動化」分頁確認「iPhone 打開時 → A」和「04:00 → C」兩條都在、都是「立即執行」，沒有就照第③步重建
📁 Scriptable → 左上齒輪 →「File Bookmarks」→「＋」→「Pick Folder」→「瀏覽」→「iCloud 雲碟」→「捷徑」→「打開」，名稱打「Shortcuts」→「Save」
👆 點一下桌面 Widget，紅字消失、數字回來
```

舊手機記得把「自動化」裡這兩條關掉或刪掉。兩支手機共用同一份 iCloud 檔案，舊手機的 C 在 04:00 也會跑，同一天會被搬兩次，累計就重複算了。

## 稱號長什麼樣

每 1,000 次升一級，5,000 次從「摺疊」系換成「鉸鏈」系，10,000 次鉸鏈宗師。

![摺疊機之路 11 個稱號：摺疊初心者到鉸鏈宗師](/img/duo-titles-cover.jpg)

| 累計 | 稱號 |
|---|---|
| 0 | 摺疊初心者 |
| 1,000 | 摺疊見習生 |
| 2,000 | 摺疊勇者 |
| 3,000 | 摺疊達人 |
| 4,000 | 摺疊騎士 |
| 5,000 | 鉸鏈大師 |
| 6,000 | 鉸鏈狂人 |
| 7,000 | 鉸鏈守護者 |
| 8,000 | 鉸鏈傳說 |
| 9,000 | 鉸鏈終結者 |
| 10,000 | 鉸鏈宗師 |

## 原理，想知道再看

iPhone Duo 的捷徑 App 多了一個別的 iPhone 沒有的觸發條件「iPhone 打開時」。A 就是跟著這條自動化跑：每次展開手機，往 iCloud 的 duo_today.txt 加一行 open。B 數這個檔有幾行，就是今天幾次。C 每天 04:00 把 duo_today.txt 整包搬進 duo_history.txt、再清空，這就是換天。D 數歷史檔裡的 open，就是以前的總和。Widget 把兩個加起來畫成血條。

三個檔案都在 iCloud 雲碟的「捷徑」資料夾（英文叫 Shortcuts），用「檔案」App 打得開，資料在你自己手上，不經過任何伺服器。

想改的只有程式最上面幾行：`BASE` 是裝之前已經開過的次數，`GOAL` 是滿血 HP（預設 20000），`START` 留 `null` 會自動用第一天有紀錄的日期，`LV_STEP` 是幾次升一級（預設 1000）。

## 阿康自己最想看的

一萬次那天它還好不好。前三天都在測試手機，第四天起正常用，一天 40 到 50 次。照這個速度，一萬次大約落在 2027 年 6 月，兩萬滴血 2028 年初扣完。中間如果鉸鏈真的出事，從第一天到出事那天每一次都有紀錄，到時候再來一篇。

資料來源：累計 153 次、今天 52 次為阿康 2026-10-29 17:20 手機桌面 Widget 截圖；「一天 40 到 50 次」為 10/26 起正常使用的實際紀錄，一萬次與兩萬次日期以每天 45 次推算；「一萬次會壞」為網路傳聞，Apple 未公布 iPhone Duo 鉸鏈測試次數；四條捷徑為 iOS 27.2 實機建立並以 iCloud 連結分享；iOS 27.2 正式版於 2026-10-26（台灣 10/27）推出、iPhone Duo 出廠為 iOS 27.1，依 Apple 開發者發佈資訊；iCloud 分享連結在他人裝置上不會帶入自動化觸發條件、需自行建立，為 10/30 觀眾於 iOS 27.2 實測；常見問題整理自 10/29–30 觀眾私訊回報；Scriptable 讀取 Shortcuts 資料夾需先設 File Bookmark，依 Scriptable 官方文件 https://docs.scriptable.app/filemanager 。
