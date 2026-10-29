---
title: iPhone Duo 開合次數怎麼算？阿康用捷徑幫手機裝一條 HP 血條，開一次扣一滴血
seo_title: iPhone Duo 開合次數統計教學：捷徑自動記錄＋Scriptable HP 血條 Widget（免費、不用寫程式）
date: 2026-10-29
category: 科技新聞
tags: iPhone Duo, 捷徑, Scriptable, 摺疊手機, 鉸鏈, iOS 27, Widget
cover: /img/duo-titles-cover.jpg
summary: 網路一直傳摺疊機開合一萬次會壞，阿康從拿到 iPhone Duo 那天開始每一次都記。點四個連結匯入捷徑、裝一個免費 App，桌面就有一條 HP 血條：今天幾次、累計幾次、還剩幾滴血自動跳，一千次升一級。
stats: 20,000｜HP 滿血值，開合一次扣 1; 105 次｜阿康 10/23 入手到 10/29 的累計; 1,000 次｜升一級，共 11 個稱號; 0 元｜全部用內建捷徑＋免費 Scriptable
---
網路一直傳摺疊機鉸鏈開合一萬次就會出問題。這是傳聞，Apple 沒有公布 iPhone Duo 鉸鏈的測試次數。阿康不信，但想親眼看，所以從 10/23 拿到手那天開始，每開一次都記下來。

做出來的東西長這樣：桌面一個 Widget，兩萬滴血，開一次扣一滴。今天開幾次、累計幾次自動算，一千次升一級，從「摺疊初心者」練到「鉸鏈宗師」。六天扣了 105 滴，照這速度要到 2030 年才歸零。

整套只要點四個連結、裝一個免費 App，不用寫程式。五分鐘照做就有。

## 四個步驟

**1. 匯入 A「打開 iPhone」**

點 [匯入 A 打開 iPhone](https://www.icloud.com/shortcuts/b8b58839bd6545138ec511bd5078c48a)，按「加入自動化」。這條是自動化：以後每次把 iPhone Duo 展開，它就在 iCloud 的 duo_today.txt 加一行 open。只有 iPhone Duo 有「打開時」這個觸發條件，其他 iPhone 匯入也不會記。

**2. 匯入 B「算次數」和 D「累計」**

點 [匯入 B 算次數](https://www.icloud.com/shortcuts/a89d51bfad614842b9c40985935f977d) 和 [匯入 D 累計](https://www.icloud.com/shortcuts/93475e469fb444fdbd3c460c7609f8ea)，各按「加入捷徑」。B 顯示今天開了幾次，D 顯示歷史累計。

**3. 匯入 C「刪除」**

點 [匯入 C 刪除](https://www.icloud.com/shortcuts/dfe722a85f6c4a868888904762ad93b5)，按「加入自動化」。這條每天 04:00 自動把今天的紀錄搬進 duo_history.txt、今天歸零。

**4. 測試**

把手機合上再打開三次，按「B 算次數」，跳 3 就成功。第一次跑會問「要允許取用檔案嗎」，按「永遠允許」，半夜自動跑才不會卡住。

## 桌面血條 Widget（Scriptable）

1. App Store 裝免費的 **Scriptable**
2. 打開 Scriptable → 左上設定 → **File Bookmarks** → ＋ → **Pick Folder** → iCloud 雲碟 → **Shortcuts** → 名稱打 Shortcuts
3. 回首頁按 ＋ 新增腳本，名稱改成 Duo
4. 用 Safari 打開 [Duo.txt](https://goodskang.tw/Duo.txt)，長按文字 → 全選 → 拷貝，回 Scriptable 貼進去
5. 主畫面長按 → 加入小工具 → Scriptable → 選**中尺寸** → 放上去後長按 → 編輯小工具 → Script 選 Duo

Widget 會顯示今天次數、累計、本週、本月、稱號、HP 血條和「照這速度哪天歸零」。數字 10 到 15 分鐘更新一次，要看當下的按 B。

想改的只有程式最上面幾行：BASE 是裝之前已經開過的次數（剛拿到手填 0），GOAL 是滿血 HP（預設 20000），START 是拿到手機的日期（月份要減 1，10 月填 9）。

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

## 要注意的是

- 三個檔案都在 iCloud 雲碟的 Shortcuts 資料夾，用「檔案」App 打得開，資料在你自己手上。
- C 跑到「刪除」那步如果報錯，點進 C 把刪除那格重新選一次 duo_today.txt 就好。
- 04:00 手機關機的話那天不會歸檔，兩天的次數會疊在一起，看歷史檔分得出來。

## 阿康自己最想看的

一萬次那天它還好不好。拿到手六天 105 次，平均一天不到 20，照這速度要開四年多。中間如果鉸鏈真的出事，從第一天到出事那天每一次都有紀錄，到時候再來一篇。

資料來源：開合次數、稱號、HP 數字為阿康 2026-10-29 自己手機上的 Widget 畫面；「一萬次會壞」為網路傳聞，Apple 未公布 iPhone Duo 鉸鏈測試次數；四條捷徑為 iOS 27.2 實機建立並以 iCloud 連結分享（A、C 含自動化觸發條件）；Scriptable 讀取 Shortcuts 資料夾需先設 File Bookmark，依 Scriptable 官方文件 https://docs.scriptable.app/filemanager 。
