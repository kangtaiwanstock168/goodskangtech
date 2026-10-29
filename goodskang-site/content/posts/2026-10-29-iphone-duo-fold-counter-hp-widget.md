---
title: iPhone Duo 開合次數怎麼算？阿康用捷徑幫手機裝一條 HP 血條，開一次扣一滴血
seo_title: iPhone Duo 開合次數統計教學：捷徑自動記錄＋Scriptable HP 血條 Widget（免費、不用寫程式）
date: 2026-10-29
category: 科技新聞
tags: iPhone Duo, 捷徑, Scriptable, 摺疊手機, 鉸鏈, iOS 27, Widget
cover: /img/duo-hp-widget.jpg
summary: 網路一直傳摺疊機開合一萬次會壞，阿康從拿到 iPhone Duo 那天開始每一次都記。三條捷徑加一個免費 App，桌面上就有一條 HP 血條，今天幾次、累計幾次、還剩幾滴血全部自動跳。捷徑連結和 Widget 程式碼都在這篇，複製貼上就能用。
stats: 20,000｜HP 滿血值，開合一次扣 1; 105 次｜阿康 10/23 入手到 10/29 的累計; 1,000 次｜升一級，共 11 個稱號; 0 元｜全部用內建捷徑＋免費 Scriptable
---
網路一直傳摺疊機鉸鏈開合一萬次就會出問題。這是傳聞，Apple 沒有公布 iPhone Duo 鉸鏈的測試次數。阿康不信，但想親眼看，所以從 10/23 拿到手那天開始，每開一次都記下來。

做出來的東西長這樣：桌面一個 Widget，兩萬滴血，開一次扣一滴。今天開幾次、這週幾次、累計幾次自動算，一千次升一級，從「摺疊初心者」一路練到「鉸鏈宗師」。六天扣了 105 滴，照這速度要到 2030 年才歸零。

整套不用寫程式、不用越獄，只用 iOS 內建的捷徑 App 加一個免費的 Scriptable。下面三段照做，十分鐘內你的手機也會有血條。

## 原理一句話

iPhone Duo 的捷徑 App 多了一個別的 iPhone 沒有的自動化觸發條件：「iPhone 打開時」。每次把手機展開，它就往 iCloud 的一個文字檔寫一行 `open`。Widget 數這個檔有幾行，就是你開了幾次。每天凌晨四點，另一條自動化把今天的紀錄搬到歷史檔、今天歸零。

三個檔案都在 iCloud 雲碟的 Shortcuts 資料夾裡，用「檔案」App 隨時打得開，你的資料在你自己手上。

## 第一步：匯入三條捷徑

點下面的連結，捷徑 App 會問你要不要加入，按「加入捷徑」就好。

| 捷徑 | 做什麼 | 連結 |
|---|---|---|
| A 打開 iPhone | 往 duo_today.txt 加一行 open（給自動化呼叫） | [匯入 A 打開 iPhone](https://www.icloud.com/shortcuts/b8b58839bd6545138ec511bd5078c48a) |
| B 算次數 | 顯示今天開了幾次 | [匯入 B 算次數](https://www.icloud.com/shortcuts/a89d51bfad614842b9c40985935f977d) |
| C 刪除 | 每天把今天的紀錄歸檔、歸零 | [匯入 C 刪除](https://www.icloud.com/shortcuts/dfe722a85f6c4a868888904762ad93b5) |
| D 累計 | 顯示歷史檔累計開了幾次 | [匯入 D 累計](https://www.icloud.com/shortcuts/93475e469fb444fdbd3c460c7609f8ea) |

匯入後先按一下「B 算次數」，跳出 0 就代表檔案路徑沒問題。

## 第二步：設兩條自動化

自動化沒辦法用連結分享，要自己在捷徑 App 的「自動化」分頁建，各三步。

**開合記錄**

1. 自動化 → 右上 ＋ → 找「iPhone 打開或閉合」，只勾「打開」
2. 選「立即執行」，把「執行時通知」關掉
3. 下一步 → 選「執行捷徑」→ 選「A 打開 iPhone」

**每日歸檔**

1. 自動化 → ＋ → 「特定時間」→ 04:00、每日
2. 選「立即執行」
3. 下一步 → 「執行捷徑」→ 選「C 刪除」

設好之後把手機合上再打開三次，按「B 算次數」應該跳 3。跳 0 的話回去看第一條自動化有沒有選到「立即執行」。

第一次跑會跳一個「要允許取用檔案嗎」的視窗，按「永遠允許」，以後半夜自動跑才不會卡住。

## 第三步：桌面血條 Widget

1. App Store 裝 **Scriptable**（免費）
2. 打開 Scriptable → 左上設定 → **File Bookmarks** → ＋ → **Pick Folder** → iCloud 雲碟 → **Shortcuts** → 名稱打 `Shortcuts`
3. 回首頁按 ＋ 新增腳本，把下面整段貼進去，名稱改成 `Duo`
4. 主畫面長按 → 加入小工具 → Scriptable → 選**中尺寸** → 放上去後長按 → 編輯小工具 → Script 選 `Duo`

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

想改的只有最上面幾行：

| 變數 | 意思 | 怎麼改 |
|---|---|---|
| BASE | 裝之前已經開過的估計次數 | 阿康自己填 88；你剛拿到手就填 0 |
| GOAL | 滿血 HP | 想對一萬次傳聞就改 10000 |
| START | 你拿到手機的日期 | 月份要減 1，10 月填 9 |
| LV_STEP | 幾次升一級 | 預設 1000 |

## 稱號表

| 累計次數 | 稱號 | 顏色 |
|---|---|---|
| 0 | 摺疊初心者 | 白 |
| 1,000 | 摺疊見習生 | 白 |
| 2,000 | 摺疊勇者 | 藍 |
| 3,000 | 摺疊達人 | 藍 |
| 4,000 | 摺疊騎士 | 藍 |
| 5,000 | 鉸鏈大師 | 紫 |
| 6,000 | 鉸鏈狂人 | 紫 |
| 7,000 | 鉸鏈守護者 | 紫 |
| 8,000 | 鉸鏈傳說 | 橘 |
| 9,000 | 鉸鏈終結者 | 橘 |
| 10,000 | 鉸鏈宗師 | 金 |

## 要注意的是

- 「iPhone 打開時」這個觸發條件只有 iPhone Duo 有，其他 iPhone 匯入捷徑也不會記。
- Widget 不是即時的，iOS 自己決定多久刷新，通常 10 到 15 分鐘；要看當下的數字按「B 算次數」，看累計按「D 累計」。
- 每日歸檔設在 04:00，手機那時候關機或沒電就不會跑，兩天的次數會疊在一起，隔天看歷史檔分得出來。
- 捷徑把日期變數放進檔名時會自動轉成帶時間的格式，所以這套設計完全不把日期放進檔名，想自己改的人注意這點。
- 半開、帳篷模式會不會算一次，阿康沒辦法驗證，你可以開合十次對一下檔案行數。

## 阿康自己最想看的

一萬次那天它還好不好。拿到手六天 105 次，平均一天不到 20，照這速度要開四年多。中間如果鉸鏈真的出事，從第一天到出事那天的每一次都有紀錄，到時候再來一篇。

資料來源：開合次數、稱號、HP 數字為阿康 2026-10-29 自己手機上的 Widget 畫面；「一萬次會壞」為網路傳聞，Apple 未公布 iPhone Duo 鉸鏈測試次數；捷徑「iPhone 打開或閉合」自動化為 iOS 27.2 實機畫面；Scriptable 讀取 Shortcuts 資料夾需先設 File Bookmark，依 Scriptable 官方文件 https://docs.scriptable.app/filemanager 。
