"use strict";

const $=id=>document.getElementById(id);
let A=window.ASSET||{art:{},gtex:{},town:{},props:{}};const JDG=window.JDG,EASY=window.EASY,COMIC=window.COMIC,BOOK=window.BOOK,NCH=CH.length;
const COVER=new Proxy({},{get:(o,k)=>(/^\d+$/.test(k)?(window.BOOK&&BOOK.cv&&BOOK.cv[k]?`img/${BOOK.cv[k]}.webp`:`img/cover-${k}.webp`):(["lion","fox","bee"].includes(k)?`img/${k}.webp`:undefined))});
// ---------- 存檔（只存在這台裝置） ----------
const SK=BOOK.key;let SAVE={ch:{},days:[],mode:""};
try{const r=localStorage.getItem(SK);if(r)SAVE=Object.assign(SAVE,JSON.parse(r));}catch(e){}
function save(){try{localStorage.setItem(SK,JSON.stringify(SAVE));}catch(e){}}
const st=n=>SAVE.ch[n]||(SAVE.ch[n]={done:0,games:{},page:0,note:"",ch:0});
const doneCount=()=>CH.filter(c=>SAVE.ch[c.n]&&SAVE.ch[c.n].done).length;
const gamesDone=()=>Object.values(SAVE.ch).reduce((a,s)=>a+Object.keys(s.games||{}).length,0);
const gamesTotal=()=>Object.values(COMIC).reduce((a,l)=>a+l.filter(x=>!Array.isArray(x)).length,0);
const today=()=>{const d=new Date();return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();};
function streak(){const set=new Set(SAVE.days);let s=0;const d=new Date();if(!set.has(today()))d.setDate(d.getDate()-1);while(set.has(d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate())){s++;d.setDate(d.getDate()-1);}return s;}
const starHTML=()=>"";
// ---------- 音效 ----------
const AU={ctx:null};
function au(){if(!AU.ctx){try{AU.ctx=new (window.AudioContext||window.webkitAudioContext)();AU.m=AU.ctx.createGain();AU.m.gain.value=.5;AU.m.connect(AU.ctx.destination);}catch(e){}}if(AU.ctx&&AU.ctx.state==="suspended")AU.ctx.resume();return AU.ctx;}
function tone(t,type,f0,f1,d,v){const c=AU.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(AU.m);o.start(t);o.stop(t+d+.02);}
function noise(t,d,ft,f0,f1,v){const c=AU.ctx,L=Math.floor(c.sampleRate*d),b=c.createBuffer(1,L,c.sampleRate),ch=b.getChannelData(0);for(let i=0;i<L;i++)ch[i]=(Math.random()*2-1)*(1-i/L);const s=c.createBufferSource();s.buffer=b;const f=c.createBiquadFilter();f.type=ft;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(f1,t+d);const g=c.createGain();g.gain.value=v;s.connect(f);f.connect(g);g.connect(AU.m);s.start(t);}
const SFX={hit(){const t=AU.ctx.currentTime,r=.9+Math.random()*.2;tone(t,"sine",190*r,48,.13,.5);noise(t,.07,"lowpass",4200,600,.38);},
 crit(){const t=AU.ctx.currentTime;tone(t,"sine",95,28,.3,.6);noise(t,.15,"lowpass",6500,300,.5);tone(t,"triangle",2600,2400,.25,.06);},
 kill(){const t=AU.ctx.currentTime;noise(t,.25,"lowpass",2800,120,.42);tone(t,"sine",150,30,.26,.45);},
 swing(){const t=AU.ctx.currentTime;noise(t,.14,"bandpass",900,5000,.35);},
 hurt(){const t=AU.ctx.currentTime;tone(t,"sawtooth",220,90,.18,.18);},
 horn(){const t=AU.ctx.currentTime;[0,.05,.1].forEach((d,i)=>{tone(t+d,"sawtooth",233+i*2,240,1.1,.09);tone(t+d,"square",466,470,1,.03);});},
 smash(){const t=AU.ctx.currentTime;noise(t,.3,"highpass",3000,1200,.5);tone(t,"triangle",900,300,.15,.15);},
 boom(){const t=AU.ctx.currentTime;tone(t,"sine",120,28,.6,.6);noise(t,.7,"lowpass",3000,80,.55);},
 spirit(){const t=AU.ctx.currentTime;[523,659,784,1047].forEach((f,i)=>tone(t+i*.06,"triangle",f,f,.6,.1));tone(t,"sine",80,40,.6,.4);},
 win(){const t=AU.ctx.currentTime;[392,523,659,784].forEach((f,i)=>tone(t+i*.12,"triangle",f,f,.5,.12));},
 page(){const t=AU.ctx.currentTime;noise(t,.28,"bandpass",1800,700,.22);noise(t+.05,.18,"highpass",5000,3000,.06);},
 pop(){const t=AU.ctx.currentTime;tone(t,"sine",520,900,.08,.08);},
 ok(){const t=AU.ctx.currentTime;[784,988,1319].forEach((f,i)=>tone(t+i*.07,"triangle",f,f,.3,.11));},
 bad(){const t=AU.ctx.currentTime;tone(t,"square",200,140,.15,.06);},
 tick(){const t=AU.ctx.currentTime;tone(t,"sine",1200,1100,.05,.05);}};
const sfx=k=>{if(au()&&SFX[k])try{SFX[k]();}catch(e){}};
const IMG={};function img(src){if(!IMG[src]){const i=new Image();i.src=src;IMG[src]=i;}return IMG[src];}
const ART=k=>A.art[k]||A.art.novice;
function toast(t){const d=document.createElement("div");d.className="toast";d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),1900);}
function confetti(){const c=document.createElement("div");c.className="confetti";const col=["#e8c983","#b8452a","#6fbf6a","#3f6a8a","#fff3d6"];for(let i=0;i<46;i++){const p=document.createElement("i");p.style.left=Math.random()*100+"%";p.style.background=col[i%5];p.style.animationDelay=Math.random()*.5+"s";p.style.animationDuration=1.2+Math.random()+"s";c.appendChild(p);}document.body.appendChild(c);setTimeout(()=>c.remove(),2800);}
// ================= 首頁 =================
function nextCh(){return (CH.find(c=>!(SAVE.ch[c.n]&&SAVE.ch[c.n].done))||CH[CH.length-1]).n;}
function coverURL(n){return COVER[n]||ART(CH[n-1].hero);}
const STANDALONE=(window.matchMedia&&matchMedia("(display-mode:standalone),(display-mode:fullscreen)").matches)||navigator.standalone===true;
const IOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
const TOUCH=(navigator.maxTouchPoints||0)>0;
const FSEL=document.documentElement,FSREQ=FSEL.requestFullscreen||FSEL.webkitRequestFullscreen;
const isFS=()=>!!(document.fullscreenElement||document.webkitFullscreenElement);
function goFS(q){if(isFS()||!FSREQ){if(!FSREQ&&!q)toast("這台裝置要用「加入主畫面」才會滿版");return;}try{const p=FSREQ.call(FSEL);if(p&&p.catch)p.catch(()=>{if(!q)toast("這裡不能切全螢幕，加入主畫面後就是滿版");});}catch(_){if(!q)toast("這裡不能切全螢幕，加入主畫面後就是滿版");}}
function exitFS(){try{(document.exitFullscreen||document.webkitExitFullscreen).call(document);}catch(_){}}
function installTip(){if(STANDALONE||!TOUCH||SAVE.notip)return "";
 return `<div class="card tip"><button class="tipx" data-notip="1" aria-label="關閉提示">✕</button><h3>📲 想讓整個螢幕都是漫畫？</h3>${IOS?`<ol><li>用 <b>Safari</b> 打開這一頁</li><li>點 <b>分享</b>（方框加箭頭的圖示）</li><li>選 <b>加入主畫面</b>，再按「加入」</li></ol><p class="note">之後從主畫面的圖示打開，就沒有網址列和分頁列，像一個 App。</p>`:`<ol><li>點瀏覽器右上角的 <b>⋮</b></li><li>選 <b>加到主畫面</b> 或 <b>安裝應用程式</b></li></ol><p class="note">之後從主畫面的圖示打開就是全螢幕。</p>`}</div>`;}
function renderHome(){const n=nextCh(),c=CH[n-1],D=doneCount(),all=D===NCH,s=SAVE.ch[n],resume=s&&s.page>0&&!s.done;
 $("home").innerHTML=`<div class="wrap"><div class="hero"><div class="bg" style="background-image:url(${COVER[BOOK.hero]})"></div><div class="shade"></div>
  <a class="tosh" href="../">‹ 全部書卷</a><div class="txt"><h1>${BOOK.name}</h1><div class="sub">${BOOK.sub}</div></div></div>
 <div class="today"><div class="cv" style="background-image:url(${coverURL(n)})"></div><div class="bd"><div class="lab">${all?"上架的都讀完了":D?"今天讀這一章":"從這裡開始"}</div><h2>第 ${n} 章　${c.title}</h2><div class="meta">${c.who}・${COMIC[n].length} 頁漫畫＋小遊戲</div>${BOOK.pre?`<button class="btn ghost wide" data-pre="1" style="margin-bottom:8px">📖 先看導讀：這卷書在講什麼？</button>`:""}<button class="btn pri wide" data-open="${n}">${all?"再看一次":resume?"接著看":D?"翻開第 "+n+" 章":"翻開第一章"}</button></div></div>
 ${installTip()}
 <div class="stats"><div class="stat"><b>${D}</b><span>讀完章數 / ${NCH}</span></div><div class="stat"><b>${streak()}</b><span>連續讀經天數</span></div><div class="stat"><b>${gamesDone()}</b><span>小遊戲過關 / ${gamesTotal()}</span></div></div>
 <div class="card"><h3>${NCH} 本漫畫</h3><p class="note" style="margin:0 0 10px">一章就是一本。${BOOK.battle?"⚔ 的章節可以親自上場打仗。":""}${BOOK.more||""}</p>
  <div class="shelf">${CH.map(c=>{const d=SAVE.ch[c.n]&&SAVE.ch[c.n].done;return `<button class="bk ${c.n===n&&!all?"cur":""}" data-open="${c.n}" style="background-image:url(${coverURL(c.n)})" aria-label="第 ${c.n} 章 ${c.title}"><i>${c.n}${c.battle?" ⚔":""}</i>${d?`<span class="ok">✓</span>`:""}<b>${c.title}</b></button>`;}).join("")}</div></div>
 <div class="card"><h3>閱讀方式</h3><div class="seg"><button data-mode="flip" class="${R.mode==="flip"?"on":""}">📖 翻頁（左右滑）</button><button data-mode="scroll" class="${R.mode==="scroll"?"on":""}">📜 條漫（往下滑）</button></div><p class="note" style="margin:8px 0 0">左右滑翻頁，每一頁都剛好一個畫面；電腦用滾輪、觸控板或方向鍵也可以翻。iPad 橫放、Duo 打開橫拿、電腦會自動變成左右兩頁。</p></div>
 <details class="card intro"${D?"":" open"}><summary>第一次讀${BOOK.name}？先看這 1 分鐘</summary>${BOOK.intro.replace("{cycle}",cycleSVG())}
  <p>每一頁漫畫下面都是真的和合本經文。看漫畫的時候順便讀那兩三句，就讀完一章了。</p></details>
 <p class="note" style="text-align:center">經文：和合本。進度只存在這台裝置。</p></div>`;}
function cycleSVG(){const s=["離開神","被欺壓","呼求神","神拯救","享太平"],c=["#b8452a","#7a4a8a","#3f6a8a","#c9a35a","#4a8a5a"];let g="";
 s.forEach((t,i)=>{const a=-Math.PI/2+i*2*Math.PI/5,x=160+Math.cos(a)*96,y=124+Math.sin(a)*88;g+=`<circle cx="${x}" cy="${y}" r="36" fill="${c[i]}"/><text x="${x}" y="${y+6}" text-anchor="middle" font-family="Noto Serif TC" font-weight="700" font-size="16" fill="#fff">${t}</text>`;});
 return `<svg class="cycle" viewBox="0 0 320 250" role="img" aria-label="離開神、被欺壓、呼求神、神拯救、享太平，一再循環"><circle cx="160" cy="124" r="94" fill="none" stroke="#5a4a33" stroke-width="2" stroke-dasharray="5 6"/>${g}<text x="160" y="120" text-anchor="middle" font-family="Noto Serif TC" font-size="13" fill="#a8977a">一輪</text><text x="160" y="138" text-anchor="middle" font-family="Noto Serif TC" font-size="13" fill="#a8977a">比一輪糟</text></svg>`;}
// ================= 頁面產生 =================
const DH={scout:46,boss:64,troll:62,orc:54,lion:40,fox:24,bee:34};
const CREA={lion:"lion",fox:"fox",bee:"bee"},EMO={lion:"🦁",fox:"🦊",bee:"🐝"};
const BTITLE={ehud:"以笏刺殺伊磯倫",barak:"他泊山下迎戰鐵車",gideon:"三百勇士夜襲",jephthah:"耶弗他戰亞捫",samson1:"驢腮骨擊殺一千人",samson2:"推倒大袞廟"};
const BCOVER={ehud:3,barak:4,gideon:7,jephthah:11,samson1:15,samson2:16};
let CUR=null;const R={n:0,pages:[],i:0,mode:"flip",spread:false,busy:false};
const VLIM=120;
function cjk(s){return (s||"").replace(/（[^）]*）/g,"").replace(/[^一-鿿]/g,"");}
function buildPages(n){const P=[];if(n===1&&BOOK.pre&&BOOK.pre.length&&!SAVE.preSeen)BOOK.pre.forEach((d,i)=>P.push({t:"pre",d:d,k:i}));P.push({t:"cover"});const __=[],T=JDG[n-1],N=T.length,all=cjk(T.join(""));
 const sc=[];COMIC[n].forEach((x,k)=>{if(Array.isArray(x))sc.push(x);});
 const st=[];sc.forEach((x,i)=>{let m=Math.min.apply(null,x[5].length?x[5]:[1]);m=i?Math.max(m,st[i-1]+1):1;st.push(m);});
 let si=0;
 COMIC[n].forEach((x,k)=>{if(!Array.isArray(x)){P.push({t:"game",d:x,k:"g"+k});return;}
  const a=st[si],b=si===sc.length-1?N:Math.min(N,st[si+1]-1);si++;if(a>b)return;
  const ill=(window.NOILL||[]).includes(n+"-"+k)?"":`img/${n}-${k}.webp`;x.ill=ill;
  const chunks=[];{const L=v=>T[v-1].length;let tot=0;for(let v=a;v<=b;v++)tot+=L(v);
   if(tot<=170){const c=[];for(let v=a;v<=b;v++)c.push(v);chunks.push(c);}
   else{let v=a,cur=[],len=0;while(v<=b&&(!cur.length||len+L(v)<=130)){cur.push(v);len+=L(v);v++;}
    let rest=0;for(let u=v;u<=b;u++)rest+=L(u);while(rest<90&&cur.length>1){v--;cur.pop();rest+=L(v);}chunks.push(cur);const kk=Math.max(1,Math.ceil(rest/230)),tg=rest/kk;cur=[];len=0;
    for(;v<=b;v++){if(cur.length&&(len+L(v)>250||len+L(v)/2>tg)){chunks.push(cur);cur=[];len=0;}cur.push(v);len+=L(v);}
    if(cur.length)chunks.push(cur);}}
  chunks.forEach((vs,j)=>{const y=x.slice();y[5]=vs;y.part=j;if(ill)y.ill=ill;
   const lab=/^【[^】]*】/.exec(x[3]||"");y[3]=!j&&lab?lab[0]:"";
   const here=cjk(vs.map(v=>T[v-1]).join(""));
   y[4]=(x[4]||[]).filter(s=>{const c=cjk(s[1]);return c.length>1&&here.indexOf(c)>=0;});
   const ex=Object.assign({},x[6]||{});if(j){ex.s=null;ex.fx=(ex.fx||"").replace("big","");}y[6]=ex;
   P.push({t:"scene",d:y});});});
 P.push({t:"end"},{t:"next"});return P;}
function verses(n,vs){const V=JDG[n-1];const ref=vs.length>1&&vs[vs.length-1]-vs[0]===vs.length-1?`${vs[0]}–${vs[vs.length-1]}`:vs.join("、");
 return `<div class="vbox"><span class="vr">📖 ${BOOK.name} ${n}:${ref}</span>${vs.map(v=>V[v-1]?`<p class="v"><sup>${v}${V[v]===""?"–"+(v+1):""}</sup>${V[v-1]}</p>`:"").join("")}</div>`;}
// 旁白如果幾乎就是下面那段經文，就不重複顯示，把空間留給放大的經文
function dupCap(cap,n,vs){if(!cap||cap.charAt(0)==="【")return false;const cl=s=>s.replace(/[^一-鿿]/g,"");const c=cl(cap),t=cl(vs.map(v=>JDG[n-1][v-1]||"").join(""));if(c.length<4)return false;let hit=0,tot=0;for(let i=0;i<c.length-1;i++){tot++;if(t.indexOf(c.substr(i,2))>=0)hit++;}return hit/tot>=.72;}
function sceneHTML(n,d,k){const [mood,gr,cast,cap,say,vs,ex={}]=d;const fx=(ex.fx||"").split(" ").filter(Boolean);
 if(d.part&&d.ill)return `<div class="tband"><i style="background-image:url(${d.ill})"></i><span>${BOOK.name}・第 ${n} 章</span></div>${verses(n,vs)}`;
 if(d.ill){let h=`<div class="panel ill ${fx.includes("shake")?"fx-shake":""}"><i class="pbg" style="background-image:url(${d.ill})"></i><img class="illimg" alt="" src="${d.ill}" decoding="async" ${R.mode==="scroll"?'loading="lazy"':""} draggable="false">`;
  if(fx.includes("rays"))h+=`<div class="fx fx-rays"></div>`;if(fx.includes("rain"))h+=`<div class="fx fx-rain"></div>`;if(fx.includes("fire"))h+=`<div class="fx fx-fire"></div>`;if(fx.includes("torch"))h+=`<div class="fx fx-torch"></div>`;
  if(ex.s)h+=`<div class="sfx" style="left:${Math.max(24,Math.min(76,ex.s[1]))}%">${ex.s[0]}</div>`;
  // 對白和旁白放在圖的下緣，不蓋住人物的臉
  h+=`</div><div class="talk ${fx.includes("big")?"big":""}">`;
  say.forEach(([i,t],j)=>{const dl=(.5+j*.5).toFixed(2);h+=i<0?`<div class="bb god" style="--d:${dl}s">${t}</div>`:`<div class="bb ${j%2?"r":""}" style="--d:${dl}s">${t}</div>`;});
  return h+(cap?`<div class="cap">${cap}</div>`:"")+`</div>${verses(n,vs)}`;}
 let h=`<div class="panel m-${mood} ${fx.includes("shake")?"fx-shake":""} ${fx.includes("big")?"big":""}"><div class="sky"></div>`;
 if(gr==="in")h+=`<div class="wall"></div><div class="gnd in"></div>`;else h+=`<div class="gnd" style="background-image:url(${A.gtex[{m:"meadow",f:"forest",r:"road",a:"ash"}[gr]]})"></div>`;
 if(fx.includes("rays"))h+=`<div class="fx fx-rays"></div>`;if(fx.includes("speed"))h+=`<div class="fx fx-speed"></div>`;
 for(const p of ex.p||[]){const [key,x,hh]=p.split(" ");const src=A.town[key]||A.props[key];if(src)h+=`<img class="pr" alt="" src="${src}" style="left:${x}%;height:${hh}%">`;}
 const pos=[];cast.forEach((s,i)=>{let [key,x,hh]=s.split(" ");const fl=key[0]==="~";if(fl)key=key.slice(1);x=+x;hh=+(hh||DH[key]||58);pos.push([x,hh]);
  const cls=`c ${fl?"fl":""} ${x>50?"fr":""}`;const st=`left:${x}%;height:${hh}%;--d:${(i*.18).toFixed(2)}s`;
  if(CREA[key]){const src=COVER[CREA[key]];h+=src?`<img class="${cls}" alt="" src="${src}" style="${st}">`:`<span class="${cls} emo" style="left:${x}%;--d:${i*.18}s">${EMO[key]}</span>`;}
  else h+=`<img class="${cls}" alt="" src="${ART(key)}" style="${st}">`;});
 if(fx.includes("rain"))h+=`<div class="fx fx-rain"></div>`;if(fx.includes("fire"))h+=`<div class="fx fx-fire"></div>`;if(fx.includes("torch"))h+=`<div class="fx fx-torch"></div>`;if(fx.includes("vignette"))h+=`<div class="fx fx-vignette"></div>`;
 say.forEach(([i,t],j)=>{const dl=(.75+j*.6).toFixed(2);if(i<0){h+=`<div class="bb god" style="top:5%;--d:${dl}s">${t}</div>`;return;}
  const x=pos[i]?pos[i][0]:50,left=Math.max(3,Math.min(51,x-23)),tx=Math.max(12,Math.min(88,(x-left)/46*100));
  h+=`<div class="bb" style="left:${left}%;top:${4+j*21}%;--tx:${tx}%;--d:${dl}s">${t}</div>`;});
 if(ex.s)h+=`<div class="sfx" style="left:${ex.s[1]}%;top:${ex.s[2]}%">${ex.s[0]}</div>`;
 h+=(cap?`<div class="cap">${cap}</div>`:"")+`</div>${verses(n,vs)}`;return h;}
function coverHTML(n){const c=CH[n-1],sc=COMIC[n].filter(Array.isArray).length,gm=COMIC[n].length-sc;
 return `<div class="art ${COVER[n]?"":"fb"}" style="background-image:url(${coverURL(n)})"></div><div class="sh"></div>
 <div class="top"><small>${BOOK.name} 第 ${n} 章</small><h1>${c.title}</h1></div>
 <div class="bot"><p>${c.line}</p><div class="chips"><span>${c.who}</span><span>${JDG[n-1].length} 節經文全收</span><span>${gm} 個小遊戲</span>${c.battle?`<span>⚔ 實戰</span>`:""}</div><div class="swipe">← 往左滑翻頁</div></div>`;}
function gameArt(n,k){const i=R.pages.findIndex(p=>p.k===k);for(let j=i-1;j>0;j--){const P=R.pages[j];if(P&&P.t==="scene"&&P.d.ill)return P.d.ill;}return coverURL(n);}
function gameHTML(n,g,k){const s=st(n),G=gs(n,k),solved=!!s.games[k];let b="",q=g.q;
 if(g.g==="choice"){if(!G.ord)G.ord=shuffle([0,1,2,3]);
  G.ord.forEach(o=>{let cl="";if(G.ans!==undefined){if(o===0)cl="ok";else if(o===G.ans)cl="bad";}b+=`<button class="gopt ${cl}" data-gc="${k}" data-o="${o}">${g.o[o]}</button>`;});
  if(G.ans!==undefined)b+=`<div class="gfb"><b>${G.ans===0?"答對了！":"答案是："+g.o[0]}</b><br>${g.w}</div>${G.ans!==0?`<button class="gopt again" data-greset="${k}">再試一次</button>`:""}`;}
 else if(g.g==="pick"){if(!G.sel)G.sel={};b+=`<div class="pickg">`;
  g.items.forEach(([t,ok],i)=>{let cl=G.sel[i]?"sel":"";if(G.chk){cl=ok?(G.sel[i]?"ok":"dn"):(G.sel[i]?"bad":"");}b+=`<button class="gopt ${cl}" data-gp="${k}" data-i="${i}">${t}</button>`;});
  b+=`</div>`;if(G.chk){const good=g.items.every(([t,ok],i)=>!!ok===!!G.sel[i]);b+=`<div class="gfb"><b>${good?"全對！":"差一點，綠框是正確答案"}</b><br>${g.w}</div>${good?"":`<button class="gopt again" data-greset="${k}">再試一次</button>`}`;}
  else b+=`<button class="btn pri wide" data-gpchk="${k}">確認</button>`;}
 else if(g.g==="order"){if(!G.pool)G.pool=shuffle(g.items.map((x,i)=>i)),G.got=0;const fin=G.got===g.items.length;
  (fin?g.items.map((x,i)=>i):G.pool).forEach(i=>{b+=`<button class="gopt ${i<G.got?"ok":""} ${G.bad===i?"shk":""}" data-go2="${k}" data-i="${i}">${i<G.got?(i+1)+"．":""}${g.items[i]}</button>`;});
  if(fin)b+=`<div class="gfb"><b>排好了！</b><br>${g.w}</div>`;}
 else if(g.g==="mash"){const c=G.c||0,fin=c>=g.n;b+=`<div class="mash"><button class="tgt" data-gm="${k}" aria-label="連點">${COVER[g.img]?`<img alt="" src="${COVER[g.img]}" draggable="false">`:`<span style="font-size:110px">${EMO[g.img]}</span>`}</button><div class="meter"><i style="width:${Math.min(100,c/g.n*100)}%"></i></div><div class="mlab">${fin?"成功！":g.label}</div></div>${fin?`<div class="gfb">${g.done}</div>`:""}`;}
 else if(g.g==="battle"){const won=!!s.ch;q=`換你上場：${BTITLE[g.k]}`;b+=`<button class="btcard" data-battle="${g.k}"><div class="art" style="background-image:url(${coverURL(BCOVER[g.k])})"></div><em>${won?"再打一次":"點我開打"}</em><span>⚔ ${BTITLE[g.k]}</span></button><p class="bhelp">點畫面上的敵人，主角就會衝過去攻擊；能量滿了按右下角的大按鈕。${won?"<br><b>✓ 已經打贏過了！</b>":""}</p>`;}
 return `<div class="gm g-${g.g}"><div class="ghead" style="background-image:url(${gameArt(n,k)})"><span class="tag">🎮 小遊戲${solved?"　✓ 過關":""}</span><h2>${q}</h2></div><div class="gbody"><div class="fitin">${b}</div></div></div>`;}
function endHTML(n){const c=CH[n-1],e=EASY[n],s=st(n),V=JDG[n-1];
 return `<div class="endp"><div class="ghead ehead" style="background-image:url(${coverURL(n)})"><span class="tag">📝 第 ${n} 章・靈修回應</span><h2>先停一下，別急著翻</h2></div><div class="ebody"><div class="fitin"><div class="keyv"><div class="rf">帶走一句經文・${BOOK.name} ${n}:${e.key}</div><div class="tx">${V[e.key-1]}</div><button class="btn ghost" data-copy="1" style="min-height:36px;font-size:14px">複製這節經文</button></div>
 <div class="step"><b>👣 走進去</b>${e.me||"如果你就站在這一章的現場，你會是裡面的哪一個人？你會怎麼反應？"}</div><div class="step"><b>🪞 照自己</b>${e.ask}</div>
 ${R.mode==="scroll"&&!s.done?`<button class="btn pri wide" data-finish="1">✓ 完成今天的讀經</button>`:(n<NCH?`<button class="btn pri wide nxgo" data-open="${n+1}"><small>✓ 第 ${n} 章讀完了・下一章</small><b>第 ${n+1} 章　${CH[n].title}　›</b></button><div class="swhint">← 往左滑還有一頁：回應神</div>`:`<div class="donebox">✓ ${BOOK.endnote||"這卷書讀完了"}</div>`)}</div></div></div>`;}
function nextHTML(n){const s=st(n),e=EASY[n],last=n>=NCH,nx=last?null:CH[n];
 return `<div class="endp nextp"><div class="ghead ehead" style="background-image:url(${last?coverURL(n):coverURL(n+1)})"><span class="tag">${last?"✓ 全卷讀完":"← 再往左滑＝下一章"}</span><h2>帶著這一章去生活</h2></div><div class="ebody"><div class="fitin">
 <div class="step pray"><b>🙏 回應神</b>${e.pray||"主啊，這一章祢要我改變的是什麼？求祢幫助我今天就去做，不要只是知道。"}</div>
 <textarea id="note" placeholder="寫下今天要做的一件小事，或一句禱告（可以不寫，只存在這台裝置）">${(s.note||"").replace(/</g,"&lt;")}</textarea>
 <button class="deepbtn" data-deep="1"><em>📚</em><span><b>深度解析</b>了解背景，是為了更明白神的心</span></button>
 ${last?`<button class="btn pri wide" data-home="1">回${BOOK.name}目錄</button>`:`<button class="nxcard" data-open="${n+1}"><i style="background-image:url(${coverURL(n+1)})"></i><span><small>下一章</small><b>第 ${n+1} 章　${nx.title}</b><em>${nx.line||""}</em></span></button>`}<div class="navrow"><button class="btn ghost" data-home="1">本卷目錄</button><a class="btn ghost" href="../">📚 回書架選書</a></div></div></div></div>`;}
const GS={};const gs=(n,k)=>GS[n+k]||(GS[n+k]={});
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function pageEl(k,play){const P=R.pages[k];const d=document.createElement("div");d.className="pg";d.dataset.k=k;
 if(!P){d.style.background="#e8dcc0";return d;}
 if(P.t==="cover"){d.classList.add("cover");d.innerHTML=coverHTML(R.n);}
 else if(P.t==="scene"){d.innerHTML=sceneHTML(R.n,P.d,k)+`<span class="pno">${k}</span>`;}
 else if(P.t==="game"){d.innerHTML=gameHTML(R.n,P.d,P.k);}
 else if(P.t==="pre")d.innerHTML=preHTML(P.d,P.k); else if(P.t==="next")d.innerHTML=nextHTML(R.n);else d.innerHTML=endHTML(R.n);
 if(play)requestAnimationFrame(()=>requestAnimationFrame(()=>d.classList.add("play")));return d;}
// ================= 閱讀器版面（滿版、自動隱藏工具列） =================
let PW=0,PH=0,BLEED=false,UIT=0;const NS=16;
function showUI(on,keep){const r=$("reader");r.classList.toggle("ui",on);clearTimeout(UIT);if(on&&!keep&&R.mode==="flip")UIT=setTimeout(()=>r.classList.remove("ui"),2600);}
function layout(){const S=$("stage"),W=S.clientWidth||innerWidth,H=S.clientHeight||innerHeight;R.spread=R.mode==="flip"&&W>=760&&W/H>1.12;
 const w=R.spread?W/2:W,r=w/H;
 if(r>=.42&&r<=.86){PW=Math.floor(w);PH=Math.floor(H);BLEED=true;}
 else if(r<.42){PW=Math.floor(w);PH=Math.floor(Math.min(H,w/.44));BLEED=true;}
 else{PH=Math.floor(H);PW=Math.floor(H*.76);BLEED=false;}}
function openBook(n){n=+n;if(TOUCH&&!STANDALONE&&!$("reader").classList.contains("on"))goFS(true);R.n=n;CUR=CH[n-1];R.pages=buildPages(n);const s=st(n);R.i=Math.min(s.page||0,R.pages.length-1);
 if(s.done)R.i=0;$("home").classList.remove("on");$("reader").classList.add("on");document.body.style.overflow="hidden";
 $("rtitle").textContent=`第 ${n} 章・${CUR.title}`;try{history.replaceState(null,"","#ch"+n);}catch(e){}
 renderBook(true);showUI(true);if(!SAVE.hinted){SAVE.hinted=1;save();const h=document.createElement("div");h.className="hint";h.textContent=R.mode==="flip"?"左右滑動翻頁・點中間叫出選單":"往下滑繼續看";$("stage").appendChild(h);}}
function closeBook(){$("reader").classList.remove("on");$("home").classList.add("on");document.body.style.overflow="";renderHome();try{history.replaceState(null,"","#");}catch(e){}window.scrollTo(0,0);}
function norm(i){if(R.spread)i=i-(i%2);return Math.max(0,Math.min(i,lastIdx()));}
function lastIdx(){const L=R.pages.length-1;return R.spread?L-(L%2):L;}
// 經文字級自動縮到剛好放得下（每種頁面尺寸只量一次）
const FIT={};
function fitScene(el,k,key){const vb=el.querySelector(".vbox"),pn=el.querySelector(".panel");if(!vb)return;
 const H=["","46%","40%","40%","36%","36%"];
 if(FIT[key]===undefined){const base=parseFloat(getComputedStyle(vb).fontSize);let fs=base,n=0,st=0;const over=()=>vb.scrollHeight>vb.clientHeight+1;const set=()=>{vb.style.fontSize=fs+"px";};
  if(!over()){const mx=base*(pn?1.3:1.45);while(!over()&&fs<mx&&n++<40){fs+=.5;set();}if(over()){fs-=.5;set();}}
  else if(!pn){while(over()&&fs>13&&n++<60){fs-=.5;set();}}
  else{const lim=[base,base,base,Math.max(16,base-2),Math.max(16,base-2),13];
   for(st=0;st<6;st++){if(H[st])pn.style.height=H[st];while(over()&&fs>lim[st]&&n++<90){fs-=.5;set();}if(!over())break;}
   if(st>5)st=5;}
  FIT[key]=[fs,st];}
 const f=FIT[key];vb.style.fontSize=f[0]+"px";if(f[1]&&pn&&H[f[1]])pn.style.height=H[f[1]];}
// 小遊戲和結尾頁：內容超過一頁就整塊等比例縮小，永遠不用往下滑
function fitBody(el){if(R.mode==="scroll")return;el.querySelectorAll(".fitin").forEach(f=>{let k=1;const set=()=>{f.style.width=(100/k)+"%";f.style.height=(100/k)+"%";f.style.transform=k<1?`scale(${k})`:"";};set();
  let n=0;while(f.scrollHeight>f.clientHeight+1&&k>.5&&n++<16){k-=.04;set();}});}
function fitPage(el,k){const P=R.pages[k];if(!P||R.mode==="scroll")return;const m=$("meas");m.style.width=PW+"px";m.style.height=PH+"px";m.appendChild(el);
 if(P.t==="scene")fitScene(el,k,R.n+"|"+k+"|"+PW+"x"+PH);else if(P.t==="pre")growPre(el);else{fitBody(el);if(P.t==="end")growHead(el);}m.removeChild(el);}
function mkPage(k,play){const el=pageEl(k,play);if(k>=0&&k<R.pages.length)fitPage(el,k);return el;}
function preImg(x){return typeof x==="string"?`img/${x}.webp`:coverURL(x||1);}
function preHTML(d,k){const N=BOOK.pre.length,u=preImg(d.img);return `<div class="prep2"><div class="primg"><i class="pbg" style="background-image:url(${u})"></i><img alt="" src="${u}" draggable="false"><span class="prtag">導讀 ${k+1} / ${N}</span></div><div class="prbody"><div class="prnote">📖 ${BOOK.name}導讀・這幾頁是背景介紹，不是聖經經文</div><div class="fitin"><h2>${d.t}</h2>${d.p.map(x=>`<p>${x}</p>`).join("")}</div><div class="prnext">${k===N-1?"往左滑，翻開第 1 章 ›":"往左滑繼續 ›"}</div></div></div>`;}
function growPre(el){const f=el.querySelector(".prbody .fitin"),im=el.querySelector(".primg");if(!f)return;let fs=17;const set=()=>{f.style.fontSize=fs+"px";},over=()=>f.scrollHeight>f.clientHeight+1;set();let n=0;
 if(!over()){while(!over()&&fs<30&&n++<40){fs+=.5;set();}if(over()){fs-=.5;set();}return;}
 for(const h of ["40%","33%"]){im.style.flex="0 0 "+h;if(!over())return;}
 while(over()&&fs>14&&n++<20){fs-=.5;set();}}
// 章末頁：內容不滿一頁時，把多出來的空間給上面的圖
function growHead(el){const eb=el.querySelector(".endp .ebody"),gh=el.querySelector(".endp .ghead");if(!eb||!gh)return;const f=eb.querySelector(".fitin");if(!f||f.style.transform)return;
 const H=eb.clientHeight;f.style.height="auto";const h=f.offsetHeight;f.style.height="100%";const free=H-h-40;if(free<30)return;
 const add=Math.min(free,Math.max(0,PH*.5-gh.offsetHeight));if(add<20)return;gh.style.flex="0 0 "+(gh.offsetHeight+add)+"px";}
function preSeen(){if(R.n!==1||SAVE.preSeen||!BOOK.pre)return;const P=R.pages[R.i];if(P&&P.t!=="pre"){SAVE.preSeen=1;save();}}
function autoDone(){if(R.mode==="scroll"||!R.n)return;const s=st(R.n);if(s.done)return;const ks=R.spread?[R.i,R.i+1]:[R.i];if(!ks.some(k=>R.pages[k]&&(R.pages[k].t==="end"||R.pages[k].t==="next")))return;
 s.done=1;if(!SAVE.days.includes(today()))SAVE.days.push(today());save();sfx("win");confetti();toast(doneCount()===NCH?`${BOOK.name} ${NCH} 章全部讀完！`:`第 ${R.n} 章完成・連續 ${streak()} 天`);}
function hopCh(dir){if(R.mode==="scroll")return false;if(dir>0&&R.n<NCH){const n=R.n+1;st(n).page=0;openBook(n);R.i=0;renderBook(true);return true;}
 if(dir<0&&R.i===0&&R.n>1){openBook(R.n-1);R.i=norm(lastIdx());renderBook(true);return true;}return false;}
function renderBook(play){layout();autoDone();preSeen();const S=$("stage");S.className=(R.mode==="scroll"?"scroll":"")+(BLEED?" bleed":"");S.innerHTML="";$("rmode").textContent=R.mode==="scroll"?"📖":"📜";
 if(R.mode==="scroll"){showUI(true,true);renderScroll();return;}
 R.i=norm(R.i);const book=document.createElement("div");book.className="book";book.style.width=(R.spread?PW*2:PW)+"px";book.style.height=PH+"px";book.style.perspective=Math.round(PW*4.2)+"px";
 if(R.spread){book.append(slot(0,R.i,play),slot(PW,R.i+1,play),spine());}else book.append(slot(0,R.i,play));
 S.appendChild(book);updBar();prefetch();}
function spine(){const sp=document.createElement("div");sp.className="spine";sp.style.left=PW+"px";return sp;}
function prefetch(){for(let k=R.i+1;k<R.i+5;k++){const P=R.pages[k];if(P&&P.t==="scene"&&P.d.ill)img(P.d.ill);}}
function slot(x,k,play){const s=document.createElement("div");s.className="slot";s.style.left=x+"px";s.style.width=PW+"px";s.appendChild(mkPage(k<R.pages.length?k:-1,play));const sh=document.createElement("div");sh.className="shade";s.appendChild(sh);return s;}
function updBar(){const L=R.pages.length,cur=Math.min(R.i+(R.spread?2:1),L);$("rpn").textContent=`${cur} / ${L}`;$("rpb").style.width=(cur/L*100)+"%";const s=st(R.n);if(R.i>s.page){s.page=R.i;save();}}
function renderScroll(){const S=$("stage");const w=Math.min(innerWidth-16,720);
 R.pages.forEach((P,k)=>{const el=pageEl(k,false);el.style.width=w+"px";if(P.t==="cover")el.style.height=Math.round(w*1.3)+"px";else if(P.t==="scene")el.style.minHeight=Math.round(w*1.15)+"px";S.appendChild(el);});
 const io=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting){e.target.classList.add("play");const k=+e.target.dataset.k;if(k>R.i){R.i=k;updBar();}}},{root:S,threshold:.35});
 S.querySelectorAll(".pg").forEach(p=>io.observe(p));const t=S.querySelector(`.pg[data-k="${R.i}"]`);if(t&&R.i>0)S.scrollTop=t.offsetTop-6;updBar();}
// ================= 翻頁：把紙切成 12 條，一條一條彎，做出捲起來的紙 =================
let FL=null;
function canGo(dir){if(R.mode==="scroll")return false;const step=R.spread?2:1;const t=R.i+dir*step;return t>=0&&t<=lastIdx();}
// side "R"：書脊在左、往左翻；side "L"：書脊在右、往右翻
function buildLeaf(frontK,backK,side){const w=PW/NS,leaf=document.createElement("div");leaf.className="leaf";leaf.style.width=PW+"px";
 const front=mkPage(frontK),back=backK===null?null:mkPage(backK);const strips=[];let parent=leaf;
 for(let i=0;i<NS;i++){const s=document.createElement("div");s.className="st";s.style.width=(w+.7)+"px";
  if(side==="R"){s.style.left=(i?w:0)+"px";s.style.transformOrigin="0 50%";}else{s.style.left=(i?-w:PW-w)+"px";s.style.transformOrigin="100% 50%";}
  const mk=(src,off,cls)=>{const f=document.createElement("div");f.className="f "+cls;const hold=document.createElement("div");hold.className="hold";hold.style.width=PW+"px";hold.style.left=(-off)+"px";
   if(src)hold.appendChild(i===NS-1?src:src.cloneNode(true));else hold.classList.add("blank");f.appendChild(hold);const sh=document.createElement("div");sh.className="sh";f.appendChild(sh);s.appendChild(f);return sh;};
  const fo=side==="R"?i*w:(NS-1-i)*w,bo=side==="R"?(NS-1-i)*w:i*w;
  const shF=mk(front,fo,"ff"),shB=mk(back,bo,"fb");parent.appendChild(s);strips.push({el:s,shF,shB});parent=s;}
 return {leaf,strips,side};}
function beginFlip(dir){if(FL||!canGo(dir))return null;const book=$("stage").querySelector(".book");if(!book)return null;const step=R.spread?2:1,i=R.i;book.innerHTML="";
 let L,under=[],rev=false;
 if(!R.spread){if(dir>0){under.push(slot(0,i+1));L=buildLeaf(i,null,"R");}else{under.push(slot(0,i));L=buildLeaf(i-1,null,"R");rev=true;}L.leaf.style.left="0px";}
 else if(dir>0){under.push(slot(0,i),slot(PW,i+3));L=buildLeaf(i+1,i+2,"R");L.leaf.style.left=PW+"px";}
 else{under.push(slot(0,i-2),slot(PW,i+1));L=buildLeaf(i,i-1,"L");L.leaf.style.left="0px";}
 const cast=document.createElement("div");cast.className="cast";
 book.append(...under,cast,L.leaf);if(R.spread)book.appendChild(spine());
 FL={dir,step,rev,under,cast,p:0,...L};setP(0);sfx("page");return FL;}
function setP(p){const f=FL;if(!f)return;f.p=p;const q=f.rev?1-p:p,LAG=.3,sg=f.side==="R"?-1:1;let prev=0,x=0,pF=0,pB=0;
 const col=v=>v>=0?`rgba(0,0,0,${v.toFixed(3)})`:`rgba(255,255,255,${(-v).toFixed(3)})`;
 for(let i=0;i<NS;i++){const u=(i+1)/NS,a=180*Math.max(0,Math.min(1,q*(1+LAG)-LAG*(1-u))),s=f.strips[i],rad=a*Math.PI/180,bend=(a-prev)/(180/NS*1.6);
  s.el.style.transform=`rotateY(${(sg*(a-prev)).toFixed(2)}deg)`;
  // 正值＝變暗、負值＝反光；每一條從上一條的亮度漸變到自己的亮度，接縫才看不出來
  const vF=Math.sin(Math.min(rad,Math.PI/2))*.5-Math.min(.22,bend*.3),vB=Math.max(0,Math.sin(rad))*.34-Math.min(.25,bend*.35);
  s.shF.style.background=`linear-gradient(${f.side==="R"?90:270}deg,${col(i?pF:vF)},${col(vF)})`;
  s.shB.style.background=`linear-gradient(${f.side==="R"?270:90}deg,${col(i?pB:vB)},${col(vB)})`;
  pF=vF;pB=vB;x+=Math.cos(rad)*PW/NS;prev=a;}
 // 紙落在下面那頁的影子，跟著紙邊走
 const lift=Math.sin(Math.PI*q),base=f.side==="R"?parseFloat(f.leaf.style.left):PW,edge=f.side==="R"?base+x:base-x;
 f.cast.style.opacity=(lift*.85).toFixed(3);f.cast.style.left=(f.side==="R"?Math.min(edge,base)-10:Math.min(edge,base))+"px";f.cast.style.width=(Math.abs(x)+50+lift*40)+"px";
 f.cast.style.background=`linear-gradient(${edge>base?90:270}deg,rgba(0,0,0,.05),rgba(0,0,0,.45) 70%,rgba(0,0,0,0))`;
 f.under.forEach((u,j)=>{const s=u.querySelector(".shade");if(s)s.style.opacity=((1-q)*.35*(j===f.under.length-1?1:0)).toFixed(3);});
 if(!R.spread)f.leaf.style.opacity=q>.82?Math.max(0,(1-q)/.18).toFixed(3):1;}
const easeIO=k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2,easeO=k=>1-Math.pow(1-k,3);
function animP(to,done,tap){const f=FL;if(!f)return;const from=f.p,t0=performance.now(),D=tap?430:Math.max(150,Math.abs(to-from)*340),E=tap?easeIO:easeO;
 const step=now=>{if(FL!==f)return;const k=Math.min(1,(now-t0)/D);setP(from+(to-from)*E(k));if(k<1)requestAnimationFrame(step);else done();};requestAnimationFrame(step);}
function finishFlip(tap){const f=FL;if(!f)return;animP(1,()=>{R.i+=f.dir*f.step;FL=null;renderBook(true);},tap);}
function cancelFlip(){const f=FL;if(!f)return;animP(0,()=>{FL=null;renderBook(false);});}
function go(dir){if(R.mode==="scroll"){const S=$("stage");S.scrollBy({top:dir*S.clientHeight*.85,behavior:"smooth"});return;}if(FL)return;if(!canGo(dir)){if(!hopCh(dir))bump(dir);return;}au();if(beginFlip(dir))finishFlip(true);}
function bump(dir){const b=$("stage").querySelector(".book");if(!b)return;b.animate([{transform:"translateX(0)"},{transform:`translateX(${-dir*14}px)`},{transform:"translateX(0)"}],{duration:260});}
// 拖曳翻頁：紙跟著手指走
let DR=null;const NOFLIP="button,textarea,a,summary,input";
$("stage").addEventListener("pointerdown",e=>{if(R.mode==="scroll"||FL)return;if(e.target.closest(NOFLIP))return;DR={x:e.clientX,y:e.clientY,t:performance.now(),on:false,id:e.pointerId,lx:e.clientX,lt:performance.now(),v:0};});
$("stage").addEventListener("pointermove",e=>{if(!DR||DR.id!==e.pointerId)return;const dx=e.clientX-DR.x,dy=e.clientY-DR.y,now=performance.now();
 if(!DR.on){if(Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)*1.2){const dir=dx<0?1:-1;if(!canGo(dir)){DR=null;if(!hopCh(dir))bump(dir);return;}au();if(!beginFlip(dir)){DR=null;return;}DR.on=true;DR.x=e.clientX;try{$("stage").setPointerCapture(e.pointerId);}catch(_){}}else if(Math.abs(dy)>14){DR=null;}return;}
 if(now>DR.lt){DR.v=(e.clientX-DR.lx)/(now-DR.lt);DR.lx=e.clientX;DR.lt=now;}
 const w=R.spread?PW*1.7:PW*1.15;setP(Math.max(0,Math.min(1,Math.abs(e.clientX-DR.x)/w)));});
const endDrag=e=>{if(!DR)return;const d=DR;DR=null;if(!d.on||!FL)return;const fwd=FL.dir>0?-d.v:d.v;if(fwd>.35||(FL.p>.3&&fwd>-.25))finishFlip();else cancelFlip();};
$("stage").addEventListener("dragstart",e=>e.preventDefault());
$("stage").addEventListener("pointerup",endDrag);$("stage").addEventListener("pointercancel",e=>{if(DR&&DR.on)cancelFlip();DR=null;});
// 點兩側翻頁、點中間叫出或收起工具列
$("stage").addEventListener("click",e=>{if(FL)return;if(e.target.closest(NOFLIP+",details"))return;if(R.mode==="scroll")return;const b=$("stage").querySelector(".book");if(!b)return;const r=b.getBoundingClientRect(),x=(e.clientX-r.left)/r.width;
 if(x<.25)go(-1);else if(x>.75)go(1);else if(!e.target.closest(".gm,.endp"))showUI(!$("reader").classList.contains("ui"));});
document.addEventListener("keydown",e=>{if(!$("reader").classList.contains("on")||$("bt").classList.contains("on")||e.target.tagName==="TEXTAREA")return;if($("deep").classList.contains("on")&&e.key!=="Escape")return;if(e.key==="ArrowRight"||e.key===" "||e.key==="PageDown"){e.preventDefault();go(1);}if(e.key==="ArrowLeft"||e.key==="PageUp"){e.preventDefault();go(-1);}if(e.key==="Escape"){if($("deep").classList.contains("on"))closeDeep();else closeBook();}});
$("rprev").onclick=()=>{go(-1);showUI(true);};$("rnext").onclick=()=>{go(1);showUI(true);};$("rhome").onclick=()=>closeBook();
$("rmode").onclick=()=>{return;R.mode=R.mode==="flip"?"scroll":"flip";SAVE.mode=R.mode;save();renderBook(true);showUI(true);};
$("rfull").onclick=()=>{if(isFS())exitFS();else goFS();};
let RT=0;window.addEventListener("resize",()=>{clearTimeout(RT);RT=setTimeout(()=>{if($("reader").classList.contains("on")&&!FL&&!$("bt").classList.contains("on"))renderBook(false);},150);});
// 只重畫目前看得到的頁面（小遊戲用）
function refresh(k){const el=$("stage").querySelector(`.pg[data-k="${k}"]`);if(!el)return;const sc=el.querySelector(".gbody,.ebody");const top=sc?sc.scrollTop:0;const n=pageEl(k,false);n.classList.add("play");if(R.mode==="scroll")n.style.width=el.style.width;el.replaceWith(n);const s2=n.querySelector(".gbody,.ebody");fitBody(n);}
function renderChallenge(){const k=R.pages.findIndex(p=>p.t==="game"&&p.d.g==="battle");if(k>=0){if(st(R.n).ch)solve(k,true);refresh(k);}}
function solve(k,quiet){const P=R.pages[k];if(!P||P.t!=="game")return;const s=st(R.n);if(!s.games[P.k]){s.games[P.k]=1;save();if(!quiet){sfx("ok");confetti();}}}
let BTP=null;
function loadBattle(){if(BTP)return BTP;toast("戰鬥載入中…");const ld=src=>new Promise((ok,no)=>{const e=document.createElement("script");e.src=src;e.onload=ok;e.onerror=no;document.body.appendChild(e);});
 BTP=ld("assets.js").then(()=>{A=window.ASSET;return ld("battle.js");});BTP.catch(()=>{BTP=null;});return BTP;}
function openDeep(n){const c=CH[n-1],D=window.DEEP[n],L=D.s.length;
 let h=`<button class="dx" data-deepx="1" aria-label="關閉深度解析">✕</button><div class="dwrap"><div class="dhead" style="background-image:url(${coverURL(n)})"><small>${BOOK.name} 第 ${n} 章・深度解析</small><h1>${c.title}</h1></div><div class="dbody"><div class="dlead">${D.lead}</div><div class="dheart">了解背景，是為了更明白神的心、回頭看自己，不是為了比別人懂得多，更不是拿來量別人。</div>`;
 D.s.forEach(([t,...ps],i)=>{h+=`<div class="dsec ${i===L-1?"last":""}"><h3><i>${i+1}</i>${t}</h3>${ps.map(p=>`<p>${p}</p>`).join("")}</div>`;});
 h+=`<div class="dmore">${c.tbl?`<h3>一張表看懂</h3><table><thead><tr>${c.tbl.h.map(x=>`<th>${x}</th>`).join("")}</tr></thead><tbody>${c.tbl.r.map(r=>`<tr>${r.map(x=>`<td>${x}</td>`).join("")}</tr>`).join("")}</tbody></table>`:""}
 ${c.d4&&c.d4.refs?`<h3>聖經其他地方怎麼說</h3>${c.d4.refs.map(([r,t])=>`<div class="rf"><b>${r}</b>${t}</div>`).join("")}`:""}</div>
 <button class="btn pri wide" data-deepx="1" style="margin-top:18px">看完了，回到漫畫</button></div></div>`;
 const el=$("deep");el.innerHTML=h;el.classList.add("on");el.scrollTop=0;}
function closeDeep(){$("deep").classList.remove("on");$("deep").innerHTML="";}
// ================= 點擊 =================
document.addEventListener("click",ev=>{const b=ev.target.closest("button");if(!b)return;au();const pg=b.closest(".pg"),k=pg?+pg.dataset.k:-1;
 if(b.dataset.open){if($("reader").classList.contains("on")){openBook(b.dataset.open);}else openBook(b.dataset.open);return;}
 if(b.dataset.deep){openDeep(R.n);return;}
 if(b.dataset.deepx){closeDeep();return;}
 if(b.dataset.home){closeBook();return;}
 if(b.dataset.notip){SAVE.notip=1;save();renderHome();return;}
 if(b.dataset.mode){R.mode=b.dataset.mode;SAVE.mode=R.mode;save();renderHome();return;}
 const P=R.pages[k];
 if(b.dataset.gc!==undefined){const G=gs(R.n,b.dataset.gc);if(G.ans!==undefined)return;G.ans=+b.dataset.o;if(G.ans===0)solve(k);else sfx("bad");refresh(k);return;}
 if(b.dataset.greset!==undefined){const G=gs(R.n,b.dataset.greset);for(const x in G)delete G[x];refresh(k);return;}
 if(b.dataset.gp!==undefined){const G=gs(R.n,b.dataset.gp);if(G.chk)return;const i=+b.dataset.i;G.sel[i]=!G.sel[i];sfx("tick");refresh(k);return;}
 if(b.dataset.gpchk!==undefined){const G=gs(R.n,b.dataset.gpchk);G.chk=1;const good=P.d.items.every(([t,ok],i)=>!!ok===!!G.sel[i]);if(good)solve(k);else sfx("bad");refresh(k);return;}
 if(b.dataset.go2!==undefined){const G=gs(R.n,b.dataset.go2);const i=+b.dataset.i;if(i<G.got)return;if(i===G.got){G.got++;G.bad=-1;sfx("pop");if(G.got===P.d.items.length)solve(k);}else{G.bad=i;sfx("bad");}refresh(k);return;}
 if(b.dataset.gm!==undefined){const G=gs(R.n,b.dataset.gm);G.c=(G.c||0)+1;if(G.c>P.d.n)return;sfx(G.c===P.d.n?"crit":"hit");if(G.c===P.d.n){solve(k);refresh(k);return;}const m=pg.querySelector(".meter i");if(m)m.style.width=(G.c/P.d.n*100)+"%";b.classList.remove("hit");void b.offsetWidth;b.classList.add("hit");return;}
 if(b.dataset.battle){loadBattle().then(()=>startBattle(b.dataset.battle),()=>toast("戰鬥載入失敗，請檢查網路再試一次"));return;}
 if(b.dataset.copy){const e=EASY[R.n],t=`「${JDG[R.n-1][e.key-1]}」（${BOOK.name} ${R.n}:${e.key}）`;try{navigator.clipboard.writeText(t).then(()=>toast("已複製"),()=>toast("無法複製，請長按經文"));}catch(_){toast("無法複製，請長按經文");}return;}
 if(b.dataset.finish){const s=st(R.n);const t=document.getElementById("note");if(t)s.note=t.value;s.done=1;s.page=0;if(!SAVE.days.includes(today()))SAVE.days.push(today());save();sfx("win");confetti();toast(doneCount()===NCH?`${BOOK.name}上架的 ${NCH} 章全部讀完！`:`第 ${R.n} 章完成・連續 ${streak()} 天`);refresh(k);if(R.mode==="flip")setTimeout(()=>{if(!FL&&$("reader").classList.contains("on"))go(1);},900);return;}
});
document.addEventListener("input",e=>{if(e.target.id==="note"&&R.n){st(R.n).note=e.target.value;save();}});

if("serviceWorker" in navigator){try{navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>{if(/\/bible\/[a-z]+\/$/.test(r.scope))r.unregister();}));navigator.serviceWorker.register("../sw.js",{scope:"../"});}catch(e){}}
renderHome();const m0=location.hash.match(/^#ch(\d+)$/);if(m0&&CH[+m0[1]-1])openBook(+m0[1]);

// 滾輪／觸控板：一個手勢翻一頁，慣性滑動不會連翻
(function(){let acc=0,lock=false,tm=0,last=0;
 $("reader").addEventListener("wheel",e=>{if($("deep").classList.contains("on")||$("bt").classList.contains("on"))return;if(e.target.closest("textarea"))return;e.preventDefault();
  let d=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;if(e.deltaMode===1)d*=30;const now=performance.now();
  clearTimeout(tm);const rel=()=>{if(performance.now()-last<520){tm=setTimeout(rel,120);return;}lock=false;acc=0;};tm=setTimeout(rel,220);
  if(lock){if(now-last>700&&Math.abs(d)>60){lock=false;acc=0;}else return;}
  acc+=d;if(Math.abs(acc)>=40){lock=true;last=now;const dir=acc>0?1:-1;acc=0;go(dir);}},{passive:false});})();

document.addEventListener("click",e=>{const b=e.target.closest("[data-pre]");if(!b)return;e.stopPropagation();SAVE.preSeen=0;st(1).page=0;const d=st(1).done;st(1).done=0;openBook(1);st(1).done=d;R.i=0;renderBook(true);},true);

// 工具列加「書架」：隨時可以回首頁選書
(function(){const h=$("rhome");if(h&&!$("rshelf")){const a=document.createElement("a");a.id="rshelf";a.className="icon";a.href="../";a.setAttribute("aria-label","回書架選書");a.textContent="📚";h.after(a);}})();
