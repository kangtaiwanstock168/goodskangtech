(function(){const B=window.BOOKDATA.genesis;window.JDG=B.TEXT;window.EASY=B.EASY;window.COMIC=B.COMIC;window.DEEP=B.DEEP;
window.CHLIST=Object.keys(B.COMIC).map(Number).sort((a,b)=>a-b).map(n=>Object.assign({n:n},B.CH[n]));
window.BOOK={id:"genesis",name:"創世記",key:"genesis_comic_v1",sub:"漫畫讀經・50 天・一天一章",hero:1,battle:0,
 more:"",endnote:"創世記 50 章讀完了！",
 intro:"<p>創世記是整本聖經的<b>第一卷</b>，講「一切是怎麼開始的」：世界、人、家庭、罪，還有神怎麼開始祂的拯救計畫。</p><p>前 11 章像廣角鏡頭，從創造拍到巴別塔；第 12 章之後鏡頭拉近，只跟著<b>亞伯拉罕一家四代</b>。</p>"};})();
const CH=window.CHLIST;
