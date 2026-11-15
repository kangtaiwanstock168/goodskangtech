(function(){const B=window.BOOKDATA.exodus;window.JDG=B.TEXT;window.EASY=B.EASY;window.COMIC=B.COMIC;window.DEEP=B.DEEP;
window.CHLIST=Object.keys(B.COMIC).map(Number).sort((a,b)=>a-b).map(n=>Object.assign({n:n},B.CH[n]));
const L=window.CHLIST.length;
window.BOOK={id:"exodus",name:"出埃及記",key:"exodus_comic_v1",sub:"漫畫讀經・40 天・一天一章",hero:3,battle:0,
 more:L<40?"第 "+(L+1)+"–40 章製作中，會一批一批上架。":"",endnote:L<40?"目前上架到第 "+L+" 章，後面的章節製作中":"出埃及記 40 章讀完了！",
 intro:"<p>創世記結尾，雅各一家七十人搬到埃及。四百年後，他們變成了<b>幾百萬人的奴隸</b>。出埃及記講神怎麼把他們救出來。</p><p>前半是故事：摩西、十災、過紅海、西奈山。後半是神教這群剛脫離奴隸身分的人<b>怎麼跟祂一起生活</b>：律法和會幕。</p>"};})();
const CH=window.CHLIST;
