"use strict";

window.NOBATTLE=false;
const PREC=new Map();let KEEP=0,LITE=null;
function lite(){if(LITE===null){const q=location.search;LITE=/[?&]lite=0/.test(q)?false:(/[?&]lite=1/.test(q)||!!(window.matchMedia&&matchMedia("(pointer:coarse)").matches));}return LITE;}
function pkey(k){return R.n+"|"+k+"|"+PW+"x"+PH;}
function takePage(k,play){const key=pkey(k),el=PREC.get(key);if(!el)return null;PREC.delete(key);
 if(play&&!el.classList.contains("play"))requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add("play")));return el;}
function stash(root){if(!root)return;root.querySelectorAll(".slot>.pg[data-k],.leaf.lite .f>.pg[data-k]").forEach(el=>{const k=+el.dataset.k;if(k>=0&&k<R.pages.length){el.remove();PREC.set(pkey(k),el);}});}
function mkPage0(k){const el=pageEl(k,false);if(k>=0&&k<R.pages.length)fitPage(el,k);return el;}
function warmFlip(){if(R.mode==="scroll")return;const i=R.i,ks=R.spread?[i-2,i-1,i+2,i+3]:[i-1,i+1];
 const keep=new Set(ks.map(pkey));for(const k of [...PREC.keys()])if(!keep.has(k))PREC.delete(k);
 const todo=ks.filter(k=>k>=0&&k<R.pages.length&&R.pages[k].t==="scene"&&!PREC.has(pkey(k)));const n0=R.n,i0=R.i;
 const go=()=>{if(R.n!==n0||R.i!==i0||FL||!todo.length||R.mode==="scroll")return;const k=todo.shift(),key=pkey(k);
  if(!PREC.has(key))PREC.set(key,mkPage0(k));if(todo.length)RIC(go,600);};
 if(todo.length)RIC(go,600);}
function buildLeaf2(frontK,backK,side){const leaf=document.createElement("div");leaf.className="leaf lite "+side;leaf.style.width=PW+"px";
 leaf.style.transformOrigin=side==="R"?"0 50%":"100% 50%";
 const mk=(k,cls)=>{const f=document.createElement("div");f.className="f "+cls;if(k===null)f.classList.add("blank");else f.appendChild(mkPage(k));
  const sh=document.createElement("div");sh.className="sh";f.appendChild(sh);leaf.appendChild(f);return f;};
 const F=mk(frontK,"ff"),B=mk(backK,"fb");return {leaf,strips:[],side,lite:true,F,B};}
function BL(a,b,s){return lite()?buildLeaf2(a,b,s):buildLeaf(a,b,s);}
function setP2(p){const f=FL;if(!f)return;f.p=p;const q=f.rev?1-p:p,sg=f.side==="R"?-1:1,a=180*q,rad=a*Math.PI/180,sn=Math.sin(rad);
 f.leaf.style.transform=`rotateY(${(sg*a).toFixed(2)}deg)`;
 const fv=a<90;if(f._fv!==fv){f._fv=fv;f.F.style.visibility=fv?"visible":"hidden";f.B.style.visibility=fv?"hidden":"visible";}
 f.F.lastChild.style.opacity=(sn*.8).toFixed(3);f.B.lastChild.style.opacity=(sn*.75).toFixed(3);
 const x=Math.cos(rad)*PW,lift=Math.sin(Math.PI*q),base=f.side==="R"?parseFloat(f.leaf.style.left):PW,edge=f.side==="R"?base+x:base-x;
 const L=f.side==="R"?Math.min(edge,base)-10:Math.min(edge,base),w=Math.abs(x)+50+lift*40;
 f.cast.style.opacity=(lift*.85).toFixed(3);f.cast.style.transform=`translateX(${L.toFixed(1)}px) scaleX(${(w/PW).toFixed(4)})`;
 const cd=edge>base?1:0;if(f._cd!==cd){f._cd=cd;f.cast.style.background=`linear-gradient(${cd?90:270}deg,rgba(0,0,0,.05),rgba(0,0,0,.42) 70%,rgba(0,0,0,0))`;}
 f.under.forEach((u,j)=>{const s=u.querySelector(".shade");if(s)s.style.opacity=((1-q)*.35*(j===f.under.length-1?1:0)).toFixed(3);});
 if(!R.spread)f.leaf.style.opacity=q>.82?Math.max(0,(1-q)/.18).toFixed(3):1;}

const LISTCH={"genesis": [5, 10, 11, 36, 46], "exodus": [6], "numbers": [1, 2, 3, 7, 26, 33, 34], "joshua": [12, 13, 15, 18, 19, 21], "chronicles1": [1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 23, 24, 25, 26, 27], "ezra": [2, 8, 10], "nehemiah": [3, 7, 10, 11, 12]},GLOS={"燔祭": "把整隻祭牲完全燒在壇上獻給神，表示全然奉獻。", "平安祭": "獻祭後，一部分和家人一起吃，表示和神、和人有平安的關係。", "贖罪祭": "為犯罪的人獻上的祭，表示罪需要付代價才能得赦免。", "素祭": "用細麵、油、乳香獻的祭，不是動物，表示把勞動的成果獻給神。", "以弗得": "祭司穿在外面的背心式聖衣；後來也有人做成假的，拿來拜偶像。", "邱壇": "在高處設的祭壇，常用來拜偶像，就算拜耶和華也不是神指定的地方。", "亞舍拉": "迦南人拜的女神，常用木柱代表。", "巴力": "迦南人拜的雨神、豐收之神，是以色列最常跟著拜的假神。", "約櫃": "放兩塊法版的木櫃，外面包金，代表神與百姓同在、立約的記號。", "會幕": "曠野時期可以拆裝搬動的帳幕，是百姓聚集敬拜神的地方。", "帳幕": "神吩咐摩西造的聖所，可以搬動，代表神住在百姓中間。", "施恩座": "約櫃上面的金蓋子，大祭司每年在這裡灑血為百姓贖罪。", "利未人": "利未支派的人，專門負責會幕和聖殿的服事，不分地業。", "割禮": "割去男子包皮的記號，表示屬於和神立約的百姓。", "未受割禮": "不屬於神立約百姓的人；常用來指非利士人。", "拿細耳人": "特別分別出來歸給神的人：不喝酒、不剃頭、不碰死屍。", "士師": "神興起來拯救百姓、帶領百姓的領袖，不是法官的意思。", "先知": "替神傳話的人，常常要對王和百姓說他們不想聽的真話。", "受膏": "把油倒在頭上，表示被神揀選、分別出來作王、祭司或先知。", "受膏者": "被神膏立的人；希伯來文是「彌賽亞」，希臘文是「基督」。", "長子名分": "長子可以多得一份產業，也承接家族的領導和祝福。", "至聖所": "聖殿最裡面放約櫃的房間，只有大祭司一年進去一次。", "陰間": "舊約說人死後去的地方。", "麻衣": "粗糙的麻布衣服，穿上表示悲傷、悔改。", "撕裂衣服": "極度悲傷或震驚時的表現。", "逾越節": "記念神擊殺埃及長子時「越過」以色列家的節期。", "安息日": "每週第七天，停下工作來記念神、休息。", "什一": "收入的十分之一，獻給神。", "烏陵和土明": "大祭司胸牌裡用來求問神旨意的物件。", "基路伯": "聖經中守護神同在的天使，常刻在約櫃和聖殿上。", "大袞": "非利士人拜的神。", "摩洛": "亞捫人拜的神，要求把孩子經火獻祭，神極其厭惡。", "基抹": "摩押人拜的神。", "外邦人": "不是以色列人的各民族。", "肘": "長度單位，約 45 公分（手肘到中指尖）。", "舍客勒": "重量和錢的單位，約 11 公克的銀子。", "他連得": "很大的重量單位，約 34 公斤。", "伊法": "量糧食的單位，約 22 公升。", "贖價": "為了換回生命或自由而付出的代價。", "聖別": "分別出來，專屬於神。", "不潔淨": "照律法暫時不能進入敬拜的狀態，不一定是犯罪。", "立約": "雙方正式承諾、彼此有義務的關係；神主動和人立約。"};const GLRE=new RegExp("("+Object.keys(GLOS).sort((a,b)=>b.length-a.length).join("|")+")");
function isList(n){return (LISTCH[BOOK.id]||[]).includes(+n);}
let GLSEEN=new Set();
function glw(t){if(!t)return t;let used=false;return t.replace(new RegExp(GLRE.source,"g"),m=>{if(used||GLSEEN.has(m))return m;used=true;GLSEEN.add(m);return `<u class="gl" data-gl="${m}">${m}</u>`;});}
function skipChip(){return isList(R.n)?`<button class="skipst" data-skipst="1">名單較長，跳到這章的重點 ›</button>`:"";}
window.addEventListener("click",e=>{const g=e.target.closest&&e.target.closest("[data-gl]");if(g){e.stopPropagation();e.preventDefault();
  let b=document.getElementById("glpop");if(!b){b=document.createElement("div");b.id="glpop";document.body.appendChild(b);}
  b.innerHTML=`<b>${g.dataset.gl}</b>${GLOS[g.dataset.gl]}`;b.className="on";clearTimeout(b._t);b._t=setTimeout(()=>b.className="",4200);return;}
 const k=e.target.closest&&e.target.closest("[data-skipst]");if(k){e.stopPropagation();e.preventDefault();const i=R.pages.findIndex(p=>p.t==="end");if(i>=0){R.i=i;renderBook(true);}}},true);

const B2={"ehud": {"t": "以笏刺殺伊磯倫", "h": "以笏", "intro": "左手便利的以笏帶著一肘長的兩刃劍，去見肥胖的摩押王伊磯倫。（3:15–16）", "beats": ["「以笏說：我有神的旨意報告你。」（3:20）", "「以笏便伸左手，從右腿上拔出劍來。」（3:21）", "「以笏…吹角，以色列人從山地下來。」（3:27）"], "sp": "耶和華已將你們的仇敵交在你們手中！（3:28）", "win": "「這樣，摩押就被以色列人制伏了。國中太平八十年。」（3:30）<br>以笏不是最強的人。左手在當時常被看成缺陷，卻成了神藏好的那把劍。"}, "barak": {"t": "他泊山下迎戰鐵車", "h": "巴拉", "intro": "底波拉說：「起來！今日就是耶和華將西西拉交在你手的日子。」（4:14）", "beats": ["「巴拉就下了他泊山，跟隨他有一萬人。」（4:14）", "「星宿從天上爭戰，從其軌道攻擊西西拉。」（5:20）", "「基順古河把敵人沖沒。」（5:21）"], "sp": "耶和華豈不在你前頭行嗎？（4:14）", "win": "「西西拉下車，步行逃跑。」（4:15）<br>九百輛鐵車在大雨的泥濘裡成了負擔。榮耀不歸巴拉，也不歸鐵車，而是歸給在前頭行的神。"}, "gideon": {"t": "三百勇士夜襲米甸營", "h": "基甸", "intro": "三更之初，三百人分三隊，手拿角和空瓶，瓶裡藏著火把。（7:16）", "beats": ["第一隊：打破瓶子！（7:19）", "第二隊：舉起火把！（7:20）", "第三隊：吹角！（7:20）"], "sp": "耶和華和基甸的刀！（7:20）", "win": "「耶和華使全營的人用刀互相擊殺。」（7:22）<br>三百人沒有一個人拔刀上前，他們只是「各站各的地方」（7:21）。這場勝利唯一的武器，是讓人看見：是神打的仗。"}, "jephthah": {"t": "耶弗他戰亞捫", "h": "耶弗他", "intro": "被兄弟趕出家門的人，現在被請回來帶領基列人迎戰亞捫。（11:5–6）", "beats": ["「耶和華的靈降在耶弗他身上。」（11:29）", "「耶弗他往亞捫人那裡去，與他們爭戰。」（11:32）", "「從亞羅珥到米匿，直到亞備勒基拉明。」（11:33）"], "sp": "耶和華將他們交在他手中！（11:32）", "win": "攻取了二十座城（11:33）。<br>但勝利之前那個魯莽的許願（11:30–31），讓凱旋變成悲劇。神不需要被賄賂，祂早已把靈賜下了。"}, "samson1": {"t": "驢腮骨擊殺一千人", "h": "參孫", "intro": "新繩子綁著參孫被交給非利士人。（15:13）", "beats": ["「耶和華的靈大大感動參孫。」（15:14）", "「他臂上的繩就像火燒的麻一樣。」（15:14）", "「他見一塊未乾的驢腮骨，就伸手拾起。」（15:15）"], "sp": "我用驢腮骨殺了一千人！（15:16）", "win": "「神就使利希的窪處裂開，有水從其中湧出。參孫喝了，精神復原。」（15:19）<br>擊殺一千人的英雄，下一刻渴得快死。他的力量從來不是自己的。"}, "samson2": {"t": "推倒大袞廟", "h": "參孫", "intro": "眼睛被挖、被銅鍊鎖住的參孫，被帶到大袞廟裡戲耍。房頂上約有三千男女在看。（16:21、27）", "beats": ["「求你眷念我。」（16:28）", "「參孫就抱住托房的那兩根柱子。」（16:29）", "「參孫說：我情願與非利士人同死！」（16:30）"], "sp": "神啊，求你賜我這一次的力量！（16:28）", "win": "「他死時所殺的人，比活著所殺的還多。」（16:30）<br>參孫最強的一刻，是他什麼都看不見、只能求告的那一刻。這是士師記最後一位士師。"}};
function startB2(k){const C=B2[k];if(!C)return;const pi=R.i;let hit=0,run=true,t0=performance.now(),raf=0;
 let o=document.getElementById("b2");if(!o){o=document.createElement("div");o.id="b2";document.body.appendChild(o);}
 o.className="on";o.innerHTML=`<div class="b2bg" style="background-image:url(img/bt-${k}-1.webp)"></div><div class="b2top"><b>⚔ ${C.t}</b><button class="b2x" data-b2x="1" aria-label="離開">✕</button><div class="b2bar"><i style="width:100%"></i></div><small>敵軍士氣</small></div>
 <div class="b2mid"><p class="b2line">${C.intro}</p></div>
 <div class="b2pad" data-b2tap="1"><div class="b2ring"></div><div class="b2dot"></div><span class="b2tip">光圈縮到金框裡的時候，點一下！</span></div>`;
 const dot=o.querySelector(".b2dot"),line=o.querySelector(".b2line"),bar=o.querySelector(".b2bar i"),tip=o.querySelector(".b2tip");
 function loop(t){if(!run)return;const p=((t-t0)/1400)%1;const s=1.9-p*1.5;dot.style.transform=`translate(-50%,-50%) scale(${s})`;dot.dataset.s=s;raf=requestAnimationFrame(loop);}
 raf=requestAnimationFrame(loop);
 function tap(){if(!run)return;const s=+dot.dataset.s;
  if(s>.7&&s<1.3){hit++;sfx("ok");o.classList.remove("shake");void o.offsetWidth;o.classList.add("shake");bar.style.width=Math.max(0,100-hit*30)+"%";line.textContent=C.beats[hit-1];tip.textContent=hit<3?`擊中 ${hit} / 3`:"";
   if(hit>=3){run=false;cancelAnimationFrame(raf);o.querySelector(".b2pad").outerHTML=`<button class="b2sp" data-b2sp="1">${C.sp}</button>`;}}
  else{tip.textContent=s>=1.3?"再等一下…":"太晚了，再一次";}}
 function win(){bar.style.width="0%";const s=st(R.n);s.ch=1;save();solve(pi,true);sfx("ok");confetti();
  o.querySelector(".b2bg").style.backgroundImage=`url(img/bt-${k}-2.webp)`;
  o.querySelector(".b2mid").innerHTML=`<div class="b2win"><h2>${C.h}得勝了</h2><p>${C.win}</p><button class="b2back" data-b2x="1">回到讀經</button></div>`;
  const sp=o.querySelector(".b2sp");if(sp)sp.remove();}
 o.onclick=e=>{if(e.target.closest("[data-b2x]")){run=false;cancelAnimationFrame(raf);o.className="";o.innerHTML="";renderBook(true);return;}
  if(e.target.closest("[data-b2sp]")){win();return;}
  if(e.target.closest("[data-b2tap]"))tap();};
 new Image().src=`img/bt-${k}-2.webp`;}


const COARSE=!!(window.matchMedia&&matchMedia("(pointer:coarse)").matches);
const BORDER=[["genesis","創世記"],["exodus","出埃及記"],["leviticus","利未記"],["numbers","民數記"],["deuteronomy","申命記"],["joshua","約書亞記"],["judges","士師記"],["ruth","路得記"],["samuel1","撒母耳記上"],["samuel2","撒母耳記下"],["kings1","列王紀上"],["kings2","列王紀下"],["chronicles1","歷代志上"],["chronicles2","歷代志下"],["ezra","以斯拉記"],["nehemiah","尼希米記"],["esther","以斯帖記"],["daniel","但以理書"],["mark","馬可福音"]];
const BIX=BORDER.findIndex(x=>x[0]===window.BOOK.id),PREVB=BIX>0?BORDER[BIX-1]:null,NEXTB=BIX>=0&&BIX<BORDER.length-1?BORDER[BIX+1]:null;
const XI={};(window.BOOK.xi||[]).forEach(k=>{XI[k]=1;});
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
const gamesTotal=()=>Object.values(COMIC).reduce((a,l)=>a+l.filter(x=>!Array.isArray(x)&&!(x.g==="battle"&&window.NOBATTLE)).length,0);
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
 <div class="card"><h3>${NCH} 本漫畫</h3><p class="note" style="margin:0 0 10px">一章就是一本。${(BOOK.battle&&!window.NOBATTLE)?"⚔ 的章節可以親自上場打仗。":""}${BOOK.more||""}</p>
  <div class="shelf">${CH.map(c=>{const d=SAVE.ch[c.n]&&SAVE.ch[c.n].done;return `<button class="bk ${c.n===n&&!all?"cur":""}" data-open="${c.n}" aria-label="第 ${c.n} 章 ${c.title}"><img class="bkim" alt="" loading="lazy" decoding="async" src="../th/${BOOK.id}-${c.n}.webp" onerror="this.onerror=null;this.src=coverURL(${c.n})"><i>${c.n}${(c.battle&&!window.NOBATTLE)?" ⚔":""}</i>${d?`<span class="ok">✓</span>`:""}<b>${c.title}</b></button>`;}).join("")}</div></div>
 ${notesCard()}<div class="card"><h3>閱讀方式</h3><div class="seg"><button data-mode="flip" class="${R.mode==="flip"?"on":""}">📖 翻頁（左右滑）</button><button data-mode="scroll" class="${R.mode==="scroll"?"on":""}">📜 條漫（往下滑）</button></div><p class="note" style="margin:8px 0 0">左右滑翻頁，每一頁都剛好一個畫面；電腦用滾輪、觸控板或方向鍵也可以翻。iPad 橫放、Duo 打開橫拿、電腦會自動變成左右兩頁。</p></div>
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
 COMIC[n].forEach((x,k)=>{if(!Array.isArray(x)){if(x.g==="battle"&&window.NOBATTLE)return;P.push({t:"game",d:x,k:"g"+k});return;}
  const a=st[si],b=si===sc.length-1?N:Math.min(N,st[si+1]-1);si++;if(a>b)return;
  const ill=(window.NOILL||[]).includes(n+"-"+k)?"":`img/${n}-${k}.webp`;x.ill=ill;
  const chunks=[];{const L=v=>T[v-1].length;let tot=0;for(let v=a;v<=b;v++)tot+=L(v);
   if(tot<=170){const c=[];for(let v=a;v<=b;v++)c.push(v);chunks.push(c);}
   else{let v=a,cur=[],len=0;while(v<=b&&(!cur.length||len+L(v)<=130)){cur.push(v);len+=L(v);v++;}
    let rest=0;for(let u=v;u<=b;u++)rest+=L(u);while(rest<90&&cur.length>1){v--;cur.pop();rest+=L(v);}chunks.push(cur);const kk=Math.max(1,Math.ceil(rest/230)),tg=rest/kk;cur=[];len=0;
    for(;v<=b;v++){if(cur.length&&(len+L(v)>250||len+L(v)/2>tg)){chunks.push(cur);cur=[];len=0;}cur.push(v);len+=L(v);}
    if(cur.length)chunks.push(cur);}}
  chunks.forEach((vs,j)=>{const y=x.slice();y[5]=vs;y.part=j;if(ill)y.ill=ill;if(j&&XI[n+"-"+k+"p"+j]){y.ill="img/"+n+"-"+k+"p"+j+".webp";y.own=1;y.long=vs.reduce((s,v)=>s+T[v-1].length,0)>170;}
   const lab=/^【[^】]*】/.exec(x[3]||"");y[3]=!j&&lab?lab[0]:"";
   const here=cjk(vs.map(v=>T[v-1]).join(""));
   y[4]=(x[4]||[]).filter(s=>{const c=cjk(s[1]);return c.length>1&&here.indexOf(c)>=0;});
   const ex=Object.assign({},x[6]||{});if(j){ex.s=null;ex.fx=(ex.fx||"").replace("big","");}y[6]=ex;
   P.push({t:"scene",d:y});});});
 P.push({t:"end"},{t:"next"});return P;}
function verses(n,vs){const V=JDG[n-1];GLSEEN=new Set();const ref=vs.length>1&&vs[vs.length-1]-vs[0]===vs.length-1?`${vs[0]}–${vs[vs.length-1]}`:vs.join("、");
 return `<div class="vbox"><span class="vr">📖 ${BOOK.name} ${n}:${ref}</span>${vs.map(v=>V[v-1]?`<p class="v" data-n="${n}" data-v="${v}"><sup>${v}${V[v]===""?"–"+(v+1):""}</sup>${glw(V[v-1])}</p>`:"").join("")}</div>`;}
// 旁白如果幾乎就是下面那段經文，就不重複顯示，把空間留給放大的經文
function dupCap(cap,n,vs){if(!cap||cap.charAt(0)==="【")return false;const cl=s=>s.replace(/[^一-鿿]/g,"");const c=cl(cap),t=cl(vs.map(v=>JDG[n-1][v-1]||"").join(""));if(c.length<4)return false;let hit=0,tot=0;for(let i=0;i<c.length-1;i++){tot++;if(t.indexOf(c.substr(i,2))>=0)hit++;}return hit/tot>=.72;}
function sceneHTML(n,d,k){const [mood,gr,cast,cap,say,vs,ex={}]=d;const fx=(ex.fx||"").split(" ").filter(Boolean);
 if(d.part&&d.ill&&(!d.own||(d.long&&PW<380)||NOART[n+"|"+k+"|"+PW+"x"+PH]))return `<div class="tband"><i style="background-image:url(${d.ill})"></i><span>${BOOK.name}・第 ${n} 章</span></div>${verses(n,vs)}`;
 if(d.ill){let h=`<div class="panel ill ${d.own?"ownp":""} ${fx.includes("shake")?"fx-shake":""}"><i class="pbg" style="background-image:url(${d.ill})"></i><img class="illimg" alt="" src="${d.ill}" decoding="async" ${R.mode==="scroll"?'loading="lazy"':""} draggable="false">`;
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
 <div class="bot"><p>${c.line}</p><div class="chips"><span>${c.who}</span><span>${JDG[n-1].length} 節經文全收</span><span>${gm} 個小遊戲</span>${(c.battle&&!window.NOBATTLE)?`<span>⚔ 實戰</span>`:""}</div><div class="cvnav"><button class="cvb" data-home="1">⌂ 本卷目錄</button><a class="cvb" href="../">📚 書架選書</a><button class="cvb go" data-go="1">翻開下一頁 ›</button></div><div class="swipe">${COARSE?"手指往左滑也可以翻頁":"也可以按鍵盤 → 或滾滑鼠翻頁"}${n>1?"":PREVB?(COARSE?"；往右滑＝回上一卷《":"；按 ← ＝回上一卷《")+PREVB[1]+"》結尾":""}</div></div>`;}
function gameArt(n,k){if(XI[n+"-"+k])return "img/"+n+"-"+k+".webp";const i=R.pages.findIndex(p=>p.k===k);for(let j=i-1;j>0;j--){const P=R.pages[j];if(P&&P.t==="scene"&&P.d.ill)return P.d.ill;}return coverURL(n);}
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
 else if(g.g==="battle"){const won=!!s.ch;q=`換你上場：${BTITLE[g.k]}`;b+=`<button class="btcard" data-battle="${g.k}"><div class="art" style="background-image:url(${coverURL(BCOVER[g.k])})"></div><em>${won?"再打一次":"點我開打"}</em><span>⚔ ${BTITLE[g.k]}</span></button><p class="bhelp">看準時機點三下，再按金色按鈕。${won?"<br><b>✓ 已經打贏過了！</b>":""}</p>`;}
 return `<div class="gm g-${g.g}"><div class="ghead" style="background-image:url(${gameArt(n,k)})"><span class="tag">🎮 小遊戲${solved?"　✓ 過關":""}</span><h2>${q}</h2></div><div class="gbody"><div class="fitin">${b}</div></div></div>`;}
function endHTML(n){const c=CH[n-1],e=EASY[n],s=st(n),V=JDG[n-1];
 return `<div class="endp"><div class="ghead ehead" style="background-image:url(${coverURL(n)})"><span class="tag">📝 第 ${n} 章・靈修回應</span><h2>先停一下，別急著翻</h2></div><div class="ebody"><div class="fitin"><div class="keyv"><div class="rf">帶走一句經文・${BOOK.name} ${n}:${e.key}</div><div class="tx">${V[e.key-1]}</div><button class="btn ghost" data-copy="1" style="min-height:36px;font-size:14px">複製這節經文</button></div>
 <div class="step"><b>👣 走進去</b>${e.me||"如果你就站在這一章的現場，你會是裡面的哪一個人？你會怎麼反應？"}</div><div class="step"><b>🪞 照自己</b>${e.ask}</div>
 ${R.mode==="scroll"&&!s.done?`<button class="btn pri wide" data-finish="1">✓ 完成今天的讀經</button>`:(n<NCH?`<button class="btn pri wide nxgo" data-open="${n+1}"><small>✓ 第 ${n} 章讀完了・下一章</small><b>第 ${n+1} 章　${CH[n].title}　›</b></button><div class="swhint">往左滑還有一頁：回應神 ›</div>`:`<div class="donebox">✓ ${BOOK.endnote||"這卷書讀完了"}</div>`)}</div></div></div>`;}
function nextHTML(n){const s=st(n),e=EASY[n],last=n>=NCH,nx=last?null:CH[n];
 return `<div class="endp nextp"><div class="ghead ehead" style="background-image:url(${last?coverURL(n):coverURL(n+1)})"><span class="tag">${last?"✓ 全卷讀完":"再往左滑＝下一章 ›"}</span><h2>帶著這一章去生活</h2></div><div class="ebody"><div class="fitin">
 <div class="step pray"><b>🙏 回應神</b>${e.pray||"主啊，這一章祢要我改變的是什麼？求祢幫助我今天就去做，不要只是知道。"}</div>
 <textarea id="note" placeholder="寫下今天要做的一件小事，或一句禱告（可以不寫，只存在這台裝置）">${(s.note||"").replace(/</g,"&lt;")}</textarea>
 <button class="deepbtn" data-deep="1"><em>📚</em><span><b>深度解析</b>了解背景，是為了更明白神的心</span></button>
 ${last?`<button class="btn pri wide" data-home="1">回${BOOK.name}目錄</button>${NEXTB?`<a class="btn ghost wide nxbook" href="../${NEXTB[0]}/#first">接著讀下一卷：${NEXTB[1]} ›</a>`:""}`:`<button class="nxcard" data-open="${n+1}"><i style="background-image:url(${coverURL(n+1)})"></i><span><small>下一章</small><b>第 ${n+1} 章　${nx.title}</b><em>${nx.line||""}</em></span></button>`}<div class="navrow"><button class="btn ghost" data-home="1">本卷目錄</button><a class="btn ghost" href="../">📚 回書架選書</a></div></div></div></div>`;}
const GS={};const gs=(n,k)=>GS[n+k]||(GS[n+k]={});
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function pageEl(k,play){const P=R.pages[k];const d=document.createElement("div");d.className="pg";d.dataset.k=k;
 if(!P){d.style.background="#e8dcc0";return d;}
 if(P.t==="cover"){d.classList.add("cover");d.innerHTML=coverHTML(R.n);if(isList(R.n)){const t=d.querySelector(".chips");if(t)t.insertAdjacentHTML("afterend",`<p class="listnote">📋 這章有長名單，名字不用記，可以快速看過或直接跳到重點。${skipChip()}</p>`);}}
 else if(P.t==="scene"){d.innerHTML=sceneHTML(R.n,P.d,k)+`<span class="pno">${k}</span>`;if(isList(R.n)){const vb=d.querySelector(".vbox");if(vb)vb.insertAdjacentHTML("beforeend",skipChip());}}
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
function RIC(f,ms){return window.requestIdleCallback?requestIdleCallback(f,{timeout:ms||200}):setTimeout(f,ms||0);}
function warm(n,lim){try{if(!CH[n-1])return;const u=[...new Set(buildPages(n).filter(p=>p.t==="scene"&&p.d&&p.d.ill).map(p=>p.d.ill))].slice(0,lim||999);let i=0;const nx=()=>{if(i>=u.length)return;const im=img(u[i++]);if(im.complete)nx();else im.onload=im.onerror=()=>{RIC(nx,60);};};nx();}catch(e){}}

const BST_ON=/(^|\.)goodskang\.tw$/.test(location.hostname)&&!/Headless/.test(navigator.userAgent)&&!/[?&]nostat/.test(location.search);
let BSTQ=[],BSTT=0;
function bstRid(){try{let r=localStorage.getItem("bst_rid");if(!r){r=Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);localStorage.setItem("bst_rid",r);}return r;}catch(_){return "anon";}}
function bstDay(){const d=new Date(Date.now()+8*3600e3);return d.toISOString().slice(0,10);}
function bst(t,n,x,y){if(!BST_ON)return;try{
 if(t==="o"||t==="d"||t==="x"||t==="g"){const k="bst|"+t+"|"+BOOK.id+"|"+n+"|"+(x||"")+"|"+bstDay();if(localStorage.getItem(k))return;localStorage.setItem(k,1);}
 BSTQ.push([t,+n,x==null?"":String(x).slice(0,12),y==null?"":String(y).slice(0,40)]);
 clearTimeout(BSTT);BSTT=setTimeout(bstFlush,4000);}catch(_){}}
function bstFlush(){if(!BSTQ.length)return;const body=JSON.stringify({b:BOOK.id,r:bstRid(),e:BSTQ.splice(0,40)});
 try{if(navigator.sendBeacon&&navigator.sendBeacon("/api/bstat",new Blob([body],{type:"text/plain"})))return;}catch(_){}
 try{fetch("/api/bstat",{method:"POST",body,keepalive:true,headers:{"content-type":"text/plain"}});}catch(_){}}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")bstFlush();});
addEventListener("pagehide",bstFlush);
function openBook(n){n=+n;bst("o",n);setTimeout(()=>warm(n),900);if(TOUCH&&!STANDALONE&&!$("reader").classList.contains("on"))goFS(true);R.n=n;CUR=CH[n-1];R.pages=buildPages(n);const s=st(n);R.i=Math.min(s.page||0,R.pages.length-1);
 if(s.done)R.i=0;$("home").classList.remove("on");$("reader").classList.add("on");document.body.style.overflow="hidden";
 $("rtitle").textContent=`第 ${n} 章・${CUR.title}`;try{history.replaceState(null,"","#ch"+n);}catch(e){}
 renderBook(true);showUI(true);if(!SAVE.hinted){SAVE.hinted=1;save();const h=document.createElement("div");h.className="hint";h.textContent=R.mode==="flip"?"左右滑動翻頁・點中間叫出選單":"往下滑繼續看";$("stage").appendChild(h);}}
function closeBook(){$("reader").classList.remove("on");$("home").classList.add("on");document.body.style.overflow="";renderHome();try{history.replaceState(null,"","#");}catch(e){}window.scrollTo(0,0);}
function norm(i){if(R.spread)i=i-(i%2);return Math.max(0,Math.min(i,lastIdx()));}
function lastIdx(){const L=R.pages.length-1;return R.spread?L-(L%2):L;}
// 經文字級自動縮到剛好放得下（每種頁面尺寸只量一次）
const FIT={};
const NOART={};function fitScene(el,k,key){const vb=el.querySelector(".vbox"),pn=el.querySelector(".panel");if(!vb)return;
 const H=["","46%","40%","40%","36%","36%"];
 if(FIT[key]===undefined){const base=parseFloat(getComputedStyle(vb).fontSize);let fs=base,n=0,st=0;const over=()=>vb.scrollHeight>vb.clientHeight+1;const set=()=>{vb.style.fontSize=fs+"px";};
  if(!over()){const mx=base*(pn?1.3:1.45);while(!over()&&fs<mx&&n++<40){fs+=.5;set();}if(over()){fs-=.5;set();}}
  else if(!pn){while(over()&&fs>13&&n++<60){fs-=.5;set();}}
  else{const lim=[base,base,base,Math.max(16,base-2),Math.max(16,base-2),13];
   for(st=0;st<6;st++){if(H[st])pn.style.height=H[st];while(over()&&fs>lim[st]&&n++<90){fs-=.5;set();}if(!over())break;}
   if(st>5)st=5;}
  if(pn&&pn.classList.contains("ownp")&&fs<Math.max(16,base-1)&&!NOART[key]){NOART[key]=1;const P0=R.pages[k];el.innerHTML=sceneHTML(R.n,P0.d,k)+`<span class="pno">${k}</span>`;return fitScene(el,k,key);}
  FIT[key]=[fs,st];}
 const f=FIT[key];vb.style.fontSize=f[0]+"px";if(f[1]&&pn&&H[f[1]])pn.style.height=H[f[1]];}
// 小遊戲和結尾頁：內容超過一頁就整塊等比例縮小，永遠不用往下滑
function fitBody(el){if(R.mode==="scroll")return;el.querySelectorAll(".fitin").forEach(f=>{let k=1;const set=()=>{f.style.width=(100/k)+"%";f.style.height=(100/k)+"%";f.style.transform=k<1?`scale(${k})`:"";};set();
  let n=0;while(f.scrollHeight>f.clientHeight+1&&k>.5&&n++<16){k-=.04;set();}});}
function fitPage(el,k){const P=R.pages[k];if(!P||R.mode==="scroll")return;const m=$("meas");m.style.width=PW+"px";m.style.height=PH+"px";m.appendChild(el);
 if(P.t==="scene")fitScene(el,k,R.n+"|"+k+"|"+PW+"x"+PH);else if(P.t==="pre")growPre(el);else{fitBody(el);if(P.t==="end")growHead(el);}m.removeChild(el);}
function mkPage(k,play){{const r=takePage(k,play);if(r)return r;}const el=pageEl(k,play);if(k>=0&&k<R.pages.length)fitPage(el,k);return el;}
function preImg(x){return typeof x==="string"?`img/${x}.webp`:coverURL(x||1);}
function preHTML(d,k){const N=BOOK.pre.length,u=preImg(d.img);return `<div class="prep2${k%2?" flip":""}"><div class="primg"><i class="pbg" style="background-image:url(${u})"></i><img alt="" src="${u}" draggable="false">${k%2?"":`<span class="prtag">導讀 ${k+1} / ${N}</span>`}</div><div class="prbody">${k%2?`<span class="prtag">導讀 ${k+1} / ${N}</span>`:""}<div class="prnote">📖 ${BOOK.name}導讀・這幾頁是背景介紹，不是聖經經文</div><div class="fitin"><h2>${d.t}</h2>${d.p.map(x=>`<p>${x}</p>`).join("")}</div><div class="prnext">${k===N-1?(COARSE?"往左滑，翻開第 1 章 ›":"按 → 翻開第 1 章 ›"):(COARSE?"往左滑繼續 ›":"按 → 或滾滑鼠繼續 ›")}</div></div></div>`;}
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
 if(!s.done)bst("d",R.n);s.done=1;if(!SAVE.days.includes(today()))SAVE.days.push(today());save();sfx("win");confetti();toast(doneCount()===NCH?`${BOOK.name} ${NCH} 章全部讀完！`:`第 ${R.n} 章完成・連續 ${streak()} 天`);}
function hopCh(dir){if(R.mode==="scroll")return false;if(dir>0&&R.n<NCH){const n=R.n+1;st(n).page=0;openBook(n);R.i=0;renderBook(true);return true;}
 if(dir<0&&R.i===0&&R.n>1){openBook(R.n-1);R.i=norm(lastIdx());renderBook(true);return true;}if(dir<0&&R.i===0&&R.n===1){if(PREVB){location.href="../"+PREVB[0]+"/#last";}else closeBook();return true;}if(dir>0&&R.n>=NCH&&NEXTB){location.href="../"+NEXTB[0]+"/#first";return true;}return false;}
function renderBook(play){{const kp=KEEP;KEEP=0;if(kp)stash($("stage").querySelector(".book"));else PREC.clear();}layout();autoDone();preSeen();const S=$("stage");S.className=(R.mode==="scroll"?"scroll":"")+(BLEED?" bleed":"");S.innerHTML="";$("rmode").textContent=R.mode==="scroll"?"📖":"📜";
 if(R.mode==="scroll"){showUI(true,true);renderScroll();return;}
 R.i=norm(R.i);const book=document.createElement("div");book.className="book";book.style.width=(R.spread?PW*2:PW)+"px";book.style.height=PH+"px";book.style.perspective=Math.round(PW*4.2)+"px";
 if(R.spread){book.append(slot(0,R.i,play),slot(PW,R.i+1,play),spine());}else book.append(slot(0,R.i,play));
 S.appendChild(book);updBar();prefetch();warmFlip();}
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
function beginFlip(dir){if(FL||!canGo(dir))return null;const book=$("stage").querySelector(".book");if(!book)return null;const step=R.spread?2:1,i=R.i;stash(book);book.innerHTML="";
 let L,under=[],rev=false;
 if(!R.spread){if(dir>0){under.push(slot(0,i+1));L=BL(i,null,"R");}else{under.push(slot(0,i));L=BL(i-1,null,"R");rev=true;}L.leaf.style.left="0px";}
 else if(dir>0){under.push(slot(0,i),slot(PW,i+3));L=BL(i+1,i+2,"R");L.leaf.style.left=PW+"px";}
 else{under.push(slot(0,i-2),slot(PW,i+1));L=BL(i,i-1,"L");L.leaf.style.left="0px";}
 const cast=document.createElement("div");cast.className="cast";if(lite()){cast.classList.add("lite");cast.style.width=PW+"px";}
 book.append(...under,cast,L.leaf);if(R.spread)book.appendChild(spine());
 FL={dir,step,rev,under,cast,p:0,...L};if(L.lite)book.querySelectorAll(".pg").forEach(e=>e.classList.add("play"));setP(0);sfx("page");return FL;}
function setP(p){const f=FL;if(!f)return;if(f.lite)return setP2(p);f.p=p;const q=f.rev?1-p:p,LAG=.3,sg=f.side==="R"?-1:1;let prev=0,x=0,pF=0,pB=0;
 const col=v=>v>=0?`rgba(0,0,0,${v.toFixed(3)})`:`rgba(255,255,255,${(-v).toFixed(3)})`;
 for(let i=0;i<NS;i++){const u=(i+1)/NS,a=180*Math.max(0,Math.min(1,q*(1+LAG)-LAG*(1-u))),s=f.strips[i],rad=a*Math.PI/180,bend=(a-prev)/(180/NS*1.6);
  s.el.style.transform=`rotateY(${(sg*(a-prev)).toFixed(2)}deg)`;
  {const fv=a<90;s.shF.parentNode.style.visibility=fv?"visible":"hidden";s.shB.parentNode.style.visibility=fv?"hidden":"visible";}
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
function finishFlip(tap){const f=FL;if(!f)return;animP(1,()=>{R.i+=f.dir*f.step;FL=null;KEEP=1;renderBook(true);},tap);}
function cancelFlip(){const f=FL;if(!f)return;animP(0,()=>{FL=null;KEEP=1;renderBook(false);});}
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
function solve(k,quiet){const P=R.pages[k];if(!P||P.t!=="game")return;const s=st(R.n);if(!s.games[P.k]){s.games[P.k]=1;bst("g",R.n,P.k);save();if(!quiet){sfx("ok");confetti();}}}
let BTP=null;
function loadBattle(){if(BTP)return BTP;toast("戰鬥載入中…");const ld=src=>new Promise((ok,no)=>{const e=document.createElement("script");e.src=src;e.onload=ok;e.onerror=no;document.body.appendChild(e);});
 BTP=ld("assets.js").then(()=>{A=window.ASSET;return ld("battle.js");});BTP.catch(()=>{BTP=null;});return BTP;}
function openDeep(n){bst("x",n);const c=CH[n-1],D=window.DEEP[n],L=D.s.length;
 let h=`<button class="dx" data-deepx="1" aria-label="關閉深度解析">✕</button><div class="dwrap"><div class="dhead" style="background-image:url(${coverURL(n)})"><small>${BOOK.name} 第 ${n} 章・深度解析</small><h1>${c.title}</h1></div><div class="dbody"><div class="dlead">${D.lead}</div><div class="dheart">了解背景，是為了更明白神的心、回頭看自己，不是為了比別人懂得多，更不是拿來量別人。</div>`;
 D.s.forEach(([t,...ps],i)=>{h+=`<div class="dsec ${i===L-1?"last":""}"><h3><i>${i+1}</i>${t}</h3>${ps.map(p=>`<p>${p}</p>`).join("")}</div>`;});
 if(D.act)h+=`<div class="dact"><b>👣 這禮拜試試看</b><p>${D.act}</p><small>不是多一項功課。挑一件做得到的小事，讓今天讀的落到生活裡。</small></div>`;
 h+=`<div class="dmore">${c.tbl?`<h3>一張表看懂</h3><table><thead><tr>${c.tbl.h.map(x=>`<th>${x}</th>`).join("")}</tr></thead><tbody>${c.tbl.r.map(r=>`<tr>${r.map(x=>`<td>${x}</td>`).join("")}</tr>`).join("")}</tbody></table>`:""}
 ${c.d4&&c.d4.refs?`<h3>聖經其他地方怎麼說</h3>${c.d4.refs.map(([r,t])=>`<div class="rf"><b>${r}</b>${t}</div>`).join("")}`:""}</div>
 <button class="btn pri wide" data-deepx="1" style="margin-top:18px">看完了，回到漫畫</button></div></div>`;
 const el=$("deep");el.innerHTML=h;el.classList.add("on");el.scrollTop=0;}
function closeDeep(){$("deep").classList.remove("on");$("deep").innerHTML="";}
// ================= 點擊 =================
document.addEventListener("click",ev=>{const b=ev.target.closest("button");if(!b)return;au();const pg=b.closest(".pg"),k=pg?+pg.dataset.k:-1;
 if(b.dataset.open){if($("reader").classList.contains("on")){const n9=+b.dataset.open;st(n9).page=0;openBook(n9);R.i=0;renderBook(true);}else openBook(b.dataset.open);return;}
 if(b.dataset.deep){openDeep(R.n);return;}
 if(b.dataset.deepx){closeDeep();return;}
 if(b.dataset.home){closeBook();return;}if(b.dataset.go){go(1);return;}
 if(b.dataset.notip){SAVE.notip=1;save();renderHome();return;}
 if(b.dataset.mode){R.mode=b.dataset.mode;SAVE.mode=R.mode;save();renderHome();return;}
 const P=R.pages[k];
 if(b.dataset.gc!==undefined){const G=gs(R.n,b.dataset.gc);if(G.ans!==undefined)return;G.ans=+b.dataset.o;if(G.ans===0)solve(k);else sfx("bad");refresh(k);return;}
 if(b.dataset.greset!==undefined){const G=gs(R.n,b.dataset.greset);for(const x in G)delete G[x];refresh(k);return;}
 if(b.dataset.gp!==undefined){const G=gs(R.n,b.dataset.gp);if(G.chk)return;const i=+b.dataset.i;G.sel[i]=!G.sel[i];sfx("tick");refresh(k);return;}
 if(b.dataset.gpchk!==undefined){const G=gs(R.n,b.dataset.gpchk);G.chk=1;const good=P.d.items.every(([t,ok],i)=>!!ok===!!G.sel[i]);if(good)solve(k);else sfx("bad");refresh(k);return;}
 if(b.dataset.go2!==undefined){const G=gs(R.n,b.dataset.go2);const i=+b.dataset.i;if(i<G.got)return;if(i===G.got){G.got++;G.bad=-1;sfx("pop");if(G.got===P.d.items.length)solve(k);}else{G.bad=i;sfx("bad");}refresh(k);return;}
 if(b.dataset.gm!==undefined){const G=gs(R.n,b.dataset.gm);G.c=(G.c||0)+1;if(G.c>P.d.n)return;sfx(G.c===P.d.n?"crit":"hit");if(G.c===P.d.n){solve(k);refresh(k);return;}const m=pg.querySelector(".meter i");if(m)m.style.width=(G.c/P.d.n*100)+"%";b.classList.remove("hit");void b.offsetWidth;b.classList.add("hit");return;}
 if(b.dataset.battle){startB2(b.dataset.battle);return;}
 if(b.dataset.copy){const e=EASY[R.n],t=`「${JDG[R.n-1][e.key-1]}」（${BOOK.name} ${R.n}:${e.key}）`;try{navigator.clipboard.writeText(t).then(()=>toast("已複製"),()=>toast("無法複製，請長按經文"));}catch(_){toast("無法複製，請長按經文");}return;}
 if(b.dataset.finish){const s=st(R.n);const t=document.getElementById("note");if(t)s.note=t.value;if(!s.done)bst("d",R.n);s.done=1;s.page=0;if(!SAVE.days.includes(today()))SAVE.days.push(today());save();sfx("win");confetti();toast(doneCount()===NCH?`${BOOK.name}上架的 ${NCH} 章全部讀完！`:`第 ${R.n} 章完成・連續 ${streak()} 天`);refresh(k);if(R.mode==="flip")setTimeout(()=>{if(!FL&&$("reader").classList.contains("on"))go(1);},900);return;}
});
document.addEventListener("input",e=>{if(e.target.id==="note"&&R.n){st(R.n).note=e.target.value;save();}});

if("serviceWorker" in navigator){try{navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>{if(/\/bible\/[a-z]+\/$/.test(r.scope))r.unregister();}));navigator.serviceWorker.register("../sw.js",{scope:"../"});}catch(e){}}
renderHome();RIC(()=>warm(nextCh(),3),400);const m0=location.hash.match(/^#ch(\d+)$/);if(m0&&CH[+m0[1]-1])openBook(+m0[1]);if(location.hash==="#last"){openBook(NCH);R.i=norm(lastIdx());renderBook(false);}if(location.hash==="#first"){st(1).page=0;openBook(1);R.i=0;renderBook(false);}

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

(function(){const h=$("rhome"),s=$("rshelf");if(h)h.innerHTML="<span>⌂</span><small>目錄</small>";if(s)s.innerHTML="<span>📚</span><small>書架</small>";})();
{const _rb=renderBook;renderBook=function(p){_rb(p);try{$("reader").classList.toggle("roomy",R.mode!=="scroll"&&(innerWidth-(R.spread?PW*2:PW))/2>=112);}catch(e){}};}

if(document.fonts&&document.fonts.addEventListener){let FT;document.fonts.addEventListener("loadingdone",()=>{clearTimeout(FT);FT=setTimeout(()=>{try{if($("reader").classList.contains("on")&&!FL&&!$("bt").classList.contains("on"))renderBook(false);}catch(e){}},160);});}

// ===== 經文工具 =====
let VS=[],PD=null;
function VHL(){return SAVE.hl||(SAVE.hl={});}function VJ(){return SAVE.jn||(SAVE.jn=[]);}
function vesc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
function vrefOf(n,vs){vs=vs.slice().sort((a,b)=>a-b);const parts=[];let a=vs[0],b=a;for(let i=1;i<=vs.length;i++){if(vs[i]===b+1){b=vs[i];continue;}parts.push(a===b?a:a+"–"+b);a=b=vs[i];}return BOOK.name+" "+n+":"+parts.join("、");}
function vref(){return vrefOf(VS[0][0],VS.map(s=>s[1]));}
function vtextOf(n,vs){return vs.slice().sort((a,b)=>a-b).map(v=>JDG[n-1][v-1]||"").join("");}
function vtext(){return vtextOf(VS[0][0],VS.map(s=>s[1]));}
function vshare(){return "「"+vtext()+"」\n— "+vref()+"（和合本）\n"+location.origin+location.pathname+"#ch"+VS[0][0];}
function vnoteOf(n,vs){const k=vs.slice().sort((a,b)=>a-b).join(",");return VJ().find(j=>j.n===n&&j.vs.join(",")===k);}
function vdeco(){const J=VJ();document.querySelectorAll(".v[data-v]").forEach(p=>{const n=+p.dataset.n,v=+p.dataset.v;p.classList.toggle("hl",!!VHL()[n+":"+v]);p.classList.toggle("hasnote",J.some(j=>j.n===n&&j.vs.includes(v)));p.classList.toggle("sel",VS.some(s=>s[0]===n&&s[1]===v));});}
function vclear(){VS=[];vbar();vdeco();}
function vcopy(t,ok){const done=()=>toast(ok||"已複製");if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(done,()=>vcopy2(t,done));}else vcopy2(t,done);}
function vcopy2(t,done){const a=document.createElement("textarea");a.value=t;a.style.cssText="position:fixed;opacity:0;top:0";document.body.appendChild(a);a.select();try{document.execCommand("copy");done();}catch(e){toast("請長按自行複製");}a.remove();}
let VY=0;
function vbar(){let b=document.getElementById("vbar");if(!VS.length){if(b)b.remove();return;}
 if(!b){b=document.createElement("div");b.id="vbar";document.body.appendChild(b);}
 const allHl=VS.every(([n,v])=>VHL()[n+":"+v]),has=vnoteOf(VS[0][0],VS.map(s=>s[1]));
 b.innerHTML=`<div class="vb-top"><b>${vref()}</b><span>已選 ${VS.length} 節・再點別節可以加選</span><button data-va="x" aria-label="取消選取">✕</button></div><div class="vb-row"><button data-va="copy">📋<i>複製</i></button><button data-va="share">↗<i>分享</i></button><button data-va="hl">🖍<i>${allHl?"取消重點":"畫重點"}</i></button><button data-va="note">✏️<i>${has?"看筆記":"寫筆記"}</i></button><button data-va="pray">🙏<i>用它禱告</i></button></div>`;b.classList.toggle("top",VY>innerHeight*0.5);}
function vsheet(pray){const n=VS[0][0],vs=VS.map(s=>s[1]),o=vnoteOf(n,vs);const sh=document.createElement("div");sh.id="vsheet";
 const pre=o?o.note:(pray?"主啊，祢說：「"+vtext()+"」\n我的禱告：":"");
 sh.innerHTML=`<div class="vs-in" role="dialog" aria-label="經文筆記"><div class="vs-ref">📖 ${vref()}</div><div class="vs-txt">${vesc(vtext())}</div>
 <div class="vs-chips"><span>可以這樣寫：</span><button data-vc="我看見：">我看見…</button><button data-vc="神在提醒我：">神在提醒我…</button><button data-vc="今天我要：">今天我要…</button><button data-vc="我的禱告：主啊，">我的禱告…</button></div>
 <textarea id="vsta" rows="6" placeholder="寫下這段經文對你說的話，或你想對神說的話…">${vesc(pre)}</textarea>
 <div class="vs-row">${o?'<button data-vs="del" class="ghost">刪除</button>':""}<button data-vs="cancel" class="ghost">取消</button><button data-vs="save" class="pri">存起來</button></div><p class="vs-tip">筆記只存在這台裝置；回到這卷書的目錄頁，「我的畫線與筆記」可以再看到。</p></div>`;
 document.body.appendChild(sh);const ta=sh.querySelector("textarea");setTimeout(()=>{ta.focus();ta.setSelectionRange(ta.value.length,ta.value.length);},60);}
function vsave(){const ta=document.getElementById("vsta");const t=ta.value.trim();const n=VS[0][0],vs=VS.map(s=>s[1]).sort((a,b)=>a-b);const J=VJ(),o=vnoteOf(n,vs);
 if(!t){if(o)J.splice(J.indexOf(o),1);}else if(o){o.note=t;o.t=Date.now();}else J.push({n:n,vs:vs,note:t,t:Date.now()});save();}
document.addEventListener("pointerdown",e=>{PD=[e.clientX,e.clientY];},true);
document.addEventListener("click",e=>{
 const c=e.target.closest("[data-vc]");if(c){e.stopPropagation();const ta=document.getElementById("vsta");ta.value=(ta.value&&!/\n$/.test(ta.value)?ta.value+"\n":ta.value)+c.dataset.vc;ta.focus();return;}
 const s=e.target.closest("[data-vs]");if(s){e.stopPropagation();const a=s.dataset.vs;if(a==="save"){vsave();toast("筆記存好了");}if(a==="del"){document.getElementById("vsta").value="";vsave();toast("已刪除");}document.getElementById("vsheet").remove();vclear();return;}
 if(e.target.id==="vsheet"){e.target.remove();return;}
 const b=e.target.closest("[data-va]");if(b){e.stopPropagation();const a=b.dataset.va;if(a!=="x"&&VS.length)bst("v",VS[0][0],a,VS.map(s=>s[1]).join(","));
  if(a==="x")return vclear();
  if(a==="copy"){vcopy(vshare(),"已複製經文（含出處）");return vclear();}
  if(a==="share"){const t=vshare();if(navigator.share){navigator.share({text:t}).catch(()=>{});}else vcopy(t,"已複製，可以貼到 LINE 或訊息");return vclear();}
  if(a==="hl"){const all=VS.every(([n,v])=>VHL()[n+":"+v]);VS.forEach(([n,v])=>{if(all)delete VHL()[n+":"+v];else VHL()[n+":"+v]=Date.now();});save();toast(all?"已取消重點":"畫好重點了");return vclear();}
  if(a==="note"||a==="pray"){vsheet(a==="pray");return;}
  return;}
 const p=e.target.closest(".v[data-v]");if(!p||document.getElementById("vsheet"))return;
 if(PD&&Math.hypot(e.clientX-PD[0],e.clientY-PD[1])>10)return;
 const sel=window.getSelection&&String(window.getSelection());if(sel&&sel.length>1)return;
 e.stopPropagation();VY=e.clientY;const n=+p.dataset.n,v=+p.dataset.v;if(VS.length&&VS[0][0]!==n)VS=[];
 const i=VS.findIndex(s=>s[1]===v);if(i>=0)VS.splice(i,1);else VS.push([n,v]);VS.sort((a,b)=>a[1]-b[1]);vbar();vdeco();
},true);
let VRAF=0;new MutationObserver(()=>{if(VRAF)return;VRAF=requestAnimationFrame(()=>{VRAF=0;if(VS.length&&!$("reader").classList.contains("on")){VS=[];vbar();}if(VS.length||Object.keys(VHL()).length||VJ().length)vdeco();});}).observe(document.body,{childList:true,subtree:true});
function notesCard(){const J=VJ(),H=VHL();const hk=Object.keys(H).map(k=>k.split(":").map(Number)).filter(([n,v])=>CH[n-1]);
 if(!J.length&&!hk.length)return `<div class="card vcard"><h3>📝 我的畫線與筆記</h3><p class="note" style="margin:0">讀漫畫時，<b>點一下經文</b>（可以連點好幾節），就能複製、分享給朋友、畫重點、寫靈修筆記，或直接用這段經文禱告。</p></div>`;
 const items=[];J.forEach(j=>items.push({t:j.t,n:j.n,vs:j.vs,note:j.note}));
 const byCh={};hk.forEach(([n,v])=>{if(!J.some(j=>j.n===n&&j.vs.includes(v)))(byCh[n]=byCh[n]||[]).push(v);});
 Object.keys(byCh).forEach(n=>{const vs=byCh[n].sort((a,b)=>a-b);items.push({t:Math.max(...vs.map(v=>H[n+":"+v])),n:+n,vs:vs});});
 items.sort((a,b)=>b.t-a.t);
 return `<details class="card vcard" open><summary>📝 我的畫線與筆記（${items.length}）</summary>${items.slice(0,40).map(it=>`<div class="vitem"><button class="vgo" data-open="${it.n}">${vrefOf(it.n,it.vs)} ›</button><p class="vq">${vesc(vtextOf(it.n,it.vs).slice(0,90))}${vtextOf(it.n,it.vs).length>90?"…":""}</p>${it.note?`<p class="vn">${vesc(it.note)}</p>`:""}</div>`).join("")}</details>`;}
