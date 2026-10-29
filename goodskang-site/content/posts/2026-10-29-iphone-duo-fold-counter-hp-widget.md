---
title: iPhone Duo 開合次數計算教學！每開一次扣一滴血，開滿一千次升級
seo_title: iPhone Duo 開合次數統計教學：捷徑自動記錄＋Scriptable HP 血條 Widget（免費、五個步驟、不用寫程式）
date: 2026-10-29
category: 科技新聞
tags: iPhone Duo, 捷徑, Scriptable, 摺疊手機, 鉸鏈, iOS 27, Widget
cover: /img/duo-titles-cover.jpg
summary: 網路一直傳摺疊機開合一萬次會壞，阿康從拿到 iPhone Duo 那天起每一次都記。五個步驟：點四個連結匯入捷徑、裝免費的 Scriptable、貼程式碼、放小工具，桌面就有一條 HP 血條，開一次扣一滴，一千次升一級，11 個稱號等你解。
stats: 20,000｜HP 滿血值，開合一次扣 1; 40–50 次｜阿康正常用一天開合的次數; 1,000 次｜升一級，共 11 個稱號; 0 元｜全部用內建捷徑＋免費 Scriptable
---

網路一直傳摺疊機鉸鏈開合一萬次就會出問題。這是傳聞，Apple 沒公布 iPhone Duo 鉸鏈的測試次數。阿康不信，但想親眼看，所以從拿到手那天起每開一次都記。

桌面一個 Widget，兩萬滴血，開一次扣一滴，每一千次升一級換稱號。阿康正常用一天開 40 到 50 次，到今天累計 153 次；照這速度一萬次大約 2027 年年中到，兩萬滴血 2028 年初扣完。

![摺疊機之路 Widget：累計 153、今天 52、HP 剩 19,847](/img/duo-widget-153.jpg)

阿康 10/29 傍晚的桌面：累計 153、今天 52、本週 65，HP 剩 19,847。Widget 自己算的「每天約 21.9 次」是從 10/23 拿到手那天起平均，前三天在測試手機開得少所以偏低，正常用是一天 40 到 50 次。

裝之前先看三件事：要 iPhone Duo（別的 iPhone 沒有「打開」這個觸發條件）、iOS 27.2、五分鐘。全部免費，不用寫程式，照下面五步點就好。

## 五個步驟

**① 點四個連結，匯入捷徑**

| | 點這個 | 跳出來按什麼 |
|---|---|---|
| A 打開 iPhone | [匯入 A](https://www.icloud.com/shortcuts/b8b58839bd6545138ec511bd5078c48a) | 加入自動化 |
| B 算次數 | [匯入 B](https://www.icloud.com/shortcuts/a89d51bfad614842b9c40985935f977d) | 加入捷徑 |
| C 刪除 | [匯入 C](https://www.icloud.com/shortcuts/dfe722a85f6c4a868888904762ad93b5) | 加入自動化 |
| D 累計 | [匯入 D](https://www.icloud.com/shortcuts/93475e469fb444fdbd3c460c7609f8ea) | 加入捷徑 |

A 和 C 是自動化，匯入時會多一頁設定。A 的「iPhone 打開時」照預設就好。C 是每天 04:00 跑的，那一頁**選「立即執行」，不要選「確認後執行」**；「執行時通知」開不開都可以。為什麼，下面「換天」那段講。

**② 開合三次，按「B 算次數」**

跳 3 就成功。第一次跑會問「要允許取用檔案嗎」，按「永遠允許」。沒跳 3 的話，去「捷徑 → 自動化」看 A 有沒有在，沒有就回①重新匯入 A。

**③ 裝 Scriptable**

免費：[App Store 下載](https://apps.apple.com/tw/app/scriptable/id1405459188)。打開後左上齒輪 → File Bookmarks → ＋ → Pick Folder → iCloud 雲碟 → Shortcuts → 名稱打 `Shortcuts`（大小寫要一樣）。

**④ 貼程式碼**

Scriptable 首頁按 ＋ 新增腳本，名稱改成 `Duo`。按下面**黃色的「一鍵複製程式碼」**，回 Scriptable 在空白處長按 → 貼上。程式很長，捲到最下面也有一顆一樣的按鈕。

```
const fm = FileManager.iCloud()
const dir = fm.bookmarkedPath("Shortcuts")
const BASE = 0
const GOAL = 20000
const START = new Date(2026, 9, 23)
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
for (const l of readLines("duo_history.txt")) {
  const m = l.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
  if (m) {
    const d = new Date(+m[1], +m[2] - 1, +m[3])
    d.setDate(d.getDate() - 1)
    cur = d.toDateString()
    if (!(cur in byDay)) byDay[cur] = 0
  } else if (l.trim() === "open" && cur) {
    byDay[cur]++
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
const hist = sumFrom(new Date(0))
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
           : today <= 10 ? "佛系使用"
           : today <= 30 ? "正常人的一天"
           : today <= 60 ? "手指在練肌肉"
           : "跟鉸鏈吵架中"

const days = Math.max(1, (dayStart - START) / 86400000 + 1)
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

**⑤ 放到桌面**

主畫面長按 → 加入小工具 → Scriptable → 選**中尺寸** → 放上去後長按 → 編輯小工具 → Script 選 Duo。

搞定。Widget 會顯示今天次數、累計、本週、本月、稱號、HP 血條和「照這速度哪天歸零」，10 到 15 分鐘更新一次，要看當下的按 B。

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

iPhone Duo 的捷徑 App 多了一個別的 iPhone 沒有的觸發條件「iPhone 打開時」。A 就是這條自動化：每次展開手機，往 iCloud 的 duo_today.txt 加一行 open。B 數這個檔有幾行，就是今天幾次。D 數歷史檔 duo_history.txt 裡的 open，就是以前的總和。Widget 把兩個加起來。

**C 是「換天」。** 手機不知道什麼叫「今天」，C 就是告訴它：每天凌晨 04:00，把 duo_today.txt 整包搬進 duo_history.txt，再把 duo_today.txt 清空，今天從 0 開始。選 04:00 不選 00:00，是因為半夜十二點很多人還在滑手機，04:00 幾乎沒人在開合，一天就是「04:00 到隔天 04:00」，熬夜那幾次會算在前一天，比較合理。

所以 C 一定要選「立即執行」。選「確認後執行」的話，04:00 它只會跳一個通知問你要不要跑，沒人會在凌晨四點按，天就不會換，今天的數字會一直往上疊，累計也不會動。選「立即執行」它就自己默默做，你睡覺它換天。「執行時通知」只是跑完跟你說一聲，開不開都不影響。

三個檔案都在 iCloud 雲碟的 Shortcuts 資料夾，用「檔案」App 打得開，資料在你自己手上，不經過任何伺服器。

想改的只有程式最上面幾行：`BASE` 是裝之前已經開過的次數（剛拿到手填 0），`GOAL` 是滿血 HP（預設 20000），`START` 是拿到手機的日期（月份要減 1，10 月填 9）。

## 常見問題

**開合三次，B 一直是 1？**
九成是 A 沒有每次自己跑，只跑了你按的那一次。三個地方看：①捷徑 App → 自動化 → 點「iPhone 打開時」那條 → 要是「立即執行」，不能是「確認後執行」；②回捷徑首頁手動按一下 A，跳「要允許取用檔案嗎」按「永遠允許」，自動化在背景跑不會問你，沒按過它會悄悄失敗；③檔案 App → iCloud 雲碟 → Shortcuts → 打開 duo_today.txt，幾行 open 就是記了幾次，有 3 行但 B 顯示 1 才是 B 的問題。

**C 那個 04:00 的「立即執行」要不要開？**
要。C 是換天用的，選「確認後執行」它四點只會問你、不會做，天就不會換。原理在上面「換天」那段。

**從 IG、Facebook 點進來，複製鈕按了沒反應？**
IG 和 FB 內建的瀏覽器會擋剪貼簿。按右上角「⋯」→「用 Safari 開啟」再按一次黃色按鈕；或直接用 Safari 開 [Duo.txt](https://goodskang.tw/Duo.txt) 長按全選。

**Widget 數字不動？**
Widget 10 到 15 分鐘才更新一次，不是壞了。要看當下的按 B。長按 Widget → 編輯小工具 → 再點回來，會立刻刷新一次。

**別的 iPhone 可以用嗎？**
不行。「iPhone 打開時」只有 iPhone Duo 有，其他 iPhone 匯入不會記。

**C 跑到「刪除」那步報錯？**
點進 C，把刪除那格重新選一次 duo_today.txt 就好。

**04:00 手機關機怎麼辦？**
那天不會換天，兩天的次數會疊在一起，歷史檔裡看日期分得出來。

## 阿康自己最想看的

一萬次那天它還好不好。前三天都在測試手機，第四天起正常用，一天 40 到 50 次。照這個速度，一萬次大約落在 2027 年 6 月，兩萬滴血 2028 年初扣完。中間如果鉸鏈真的出事，從第一天到出事那天每一次都有紀錄，到時候再來一篇。

資料來源：累計 153 次、今天 52 次為阿康 2026-10-29 17:20 手機桌面 Widget 截圖；「一天 40 到 50 次」為 10/26 起正常使用的實際紀錄，一萬次與兩萬次日期以每天 45 次推算；「一萬次會壞」為網路傳聞，Apple 未公布 iPhone Duo 鉸鏈測試次數；四條捷徑為 iOS 27.2 實機建立並以 iCloud 連結分享（A、C 含自動化觸發條件）；Scriptable 讀取 Shortcuts 資料夾需先設 File Bookmark，依 Scriptable 官方文件 https://docs.scriptable.app/filemanager 。
