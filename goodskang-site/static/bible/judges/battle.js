"use strict";
// ================= 士師記 戰鬥引擎 =================
const BATTLES={
 ehud:{title:"以笏刺殺伊磯倫",hero:"hum_r",hname:"以笏",bg:"road",props:["rocks","bush","pillar"],
  intro:"左手便利的以笏帶著一肘長的兩刃劍見摩押王。先擊退摩押守衛，再面對伊磯倫王。",
  foes:[["m_orc","摩押兵"]],goal:12,boss:["m_boss","伊磯倫王",9],sp:"耶和華興起拯救者!!",spL:"神的<br>拯救",
  goalTxt:"擊退摩押守衛",win:"「這樣，摩押就被以色列人制伏了。國中太平八十年。」（3:30）<br>以笏不是最強的人，左手在當時常被看成缺陷，卻成了上帝藏好的那把劍。"},
 barak:{title:"他泊山下：迎戰九百鐵車",hero:"hum_w",hname:"巴拉",bg:"meadow",props:["oak","rocks","bush"],
  intro:"底波拉說：「起來！今日就是耶和華將西西拉交在你手的日子。」（4:14）衝下他泊山，雨會在戰鬥中降下。",
  foes:[["m_scout","迦南兵"],["m_troll","鐵車兵"]],goal:16,boss:["m_boss","西西拉",6,"flee"],rain:6,sp:"耶和華在你前頭行!!",spL:"神在<br>前頭",
  goalTxt:"擊退迦南軍",win:"西西拉下車步行逃走（4:15）。他沒有死在巴拉手裡，而是死在雅億的帳棚裡，正如底波拉所說：「榮耀不歸你，耶和華要將西西拉交在一個婦人手裡。」（4:9）<br>「基順古河把敵人沖沒」（5:21）：鐵車在泥濘裡成了負擔。"},
 gideon:{title:"三百勇士夜襲米甸營",hero:"hum_w",hname:"基甸",bg:"forest",props:["pine","oak","bush"],special:"gideon",
  intro:"三更之初，三百人分三隊，手拿角、空瓶，瓶裡藏著火把。先打破三個瓶子，再吹角。",
  foes:[["m_scout","米甸兵"],["m_orc","亞瑪力兵"]],goal:20,sp:"耶和華和基甸的刀!!",spL:"吹角<br>呼喊",
  goalTxt:"打破瓶子（0/3）",win:"「耶和華使全營的人用刀互相擊殺。」（7:22）<br>三百人沒有一個人拔刀上前，他們只是「各站各的地方」（7:21）。這場勝利唯一的武器，是讓人看見：是神打的仗。"},
 jephthah:{title:"耶弗他戰亞捫",hero:"hum_w",hname:"耶弗他",bg:"ash",props:["dead","rocks","pillar"],
  intro:"「耶和華的靈降在耶弗他身上。」（11:29）被兄弟趕出家門的人，現在帶領基列人迎戰亞捫。",
  foes:[["m_orc","亞捫兵"],["m_troll","亞捫重兵"]],goal:18,boss:["m_troll","亞捫統帥",10],sp:"耶和華的靈降在他身上!!",spL:"聖靈<br>降臨",
  goalTxt:"擊退亞捫軍",win:"「耶和華將他們交在他手中。」（11:32）攻取了二十座城。<br>但勝利之前那個魯莽的許願（11:30–31），讓凱旋變成悲劇。神不需要被賄賂，祂早已把靈賜下了。"},
 samson1:{title:"驢腮骨擊殺一千人",hero:"dw_w",hname:"參孫",bg:"meadow",props:["rocks","bush","dead"],special:"samson1",
  intro:"新繩子綁著參孫被交給非利士人。「耶和華的靈大大感動參孫，他臂上的繩就像火燒的麻一樣。」（15:14）他撿起一塊未乾的驢腮骨。",
  foes:[["m_scout","非利士兵"],["m_orc","非利士兵"]],goal:40,mult:25,sp:"耶和華的靈大大感動他!!",spL:"聖靈<br>感動",
  goalTxt:"擊殺 0 / 1000",win:"「神就使利希的窪處裂開，有水從其中湧出。參孫喝了，精神復原。」（15:19）<br>這泉名叫「隱哈歌利」，意思是「呼求者的泉」。擊殺一千人的英雄，下一刻渴得快死。他的力量從來不是自己的。"},
 samson2:{title:"推倒大袞廟",hero:"dw_w",hname:"參孫",bg:"ash",props:[],special:"samson2",
  intro:"眼睛被挖、被銅鍊鎖住的參孫，被帶到大袞廟裡戲耍。房頂上約有三千男女在看（16:27）。先禱告，再左右輪流推兩根柱子。",
  foes:[["m_scout","非利士首領"],["m_orc","大袞祭司"]],sp:"求你眷念我!!",spL:"求你<br>眷念我",
  goalTxt:"先按下「求你眷念我」",win:"「他死時所殺的人，比活著所殺的還多。」（16:30）<br>參孫最強的一刻，是他什麼都看不見、只能求告的那一刻。這是士師記最後一位士師，之後再也沒有士師了。"}};

const B={on:false};
const AIMG={};
function aimg(k){if(!AIMG[k]&&A.strip[k]){AIMG[k]={run:img(A.strip[k].run),atk:img(A.strip[k].atk)};}return AIMG[k];}
const PIMG={};function pimg(k){return PIMG[k]||(PIMG[k]=img(A.props[k]||A.town[k]));}
const cv=$("cv"),cx=cv.getContext("2d");
let VW=0,VH=0,DPR=1;
function resize(){DPR=Math.min(2,window.devicePixelRatio||1);VW=window.innerWidth;VH=window.innerHeight;cv.width=VW*DPR;cv.height=VH*DPR;}
window.addEventListener("resize",()=>{if(B.on)resize();});
const rnd=(a,b)=>a+Math.random()*(b-a);
const TOP=()=>Math.max(110,VH*.2),BOT=()=>VH-40;

function drawAnim(k,x,y,face,H,state,t,seg,flash,alpha){const M=A.meta[k],I=aimg(k);if(!M||!I)return;
 let im,fi;if(state==="run"){im=I.run;fi=Math.floor(t*M.run.fps)%M.run.n;}
 else if(state==="atk"){im=I.atk;const L=Math.floor(M.atk.n/3);fi=seg*L+Math.min(L-1,Math.floor(t*L));}
 else{im=I.atk;fi=0;}
 if(!im.complete||!im.naturalWidth)return;
 const n=state==="run"?M.run.n:M.atk.n,fw=im.naturalWidth/n,fh=im.naturalHeight,s=H/M.h0;
 cx.save();if(alpha!==undefined)cx.globalAlpha=alpha;cx.translate(x,y);cx.scale(face,1);
 const dx=-M.cx*s,dy=-M.foot*s;cx.drawImage(im,fi*fw,0,fw,fh,dx,dy,fw*s,fh*s);
 if(flash>0){cx.globalCompositeOperation="lighter";cx.globalAlpha=Math.min(1,flash*5)*.6;cx.drawImage(im,fi*fw,0,fw,fh,dx,dy,fw*s,fh*s);}
 cx.restore();}

function startBattle(key){const C=BATTLES[key];if(!C)return;au();resize();
 const HH=Math.max(96,Math.min(150,VH*.19,VW*.3));
 B.sid=(B.sid||0)+1;for(const k of ["chaos","lift","glow","spring","bossE","pillars","jarPos","colT","lost"])delete B[k];
 Object.assign(B,{on:true,key,C,t:0,H:HH,kills:0,phase:"fight",spirit:0,shake:0,en:[],fx:[],nums:[],calls:[],deb:[],rainT:-1,dark:0,jars:0,push:0,lastP:"",bossOut:false,ended:false,spawnT:.5,prayed:false,
  hero:{x:VW*.35,y:(TOP()+BOT())/2,hp:1000,max:1000,face:1,st:"idle",t:0,seg:0,cd:0,tgt:null,mx:null,my:null,flash:0}});
 B.props=[];if(C.props.length){const slots=[[.08,.05],[.92,.12],[.1,.55],[.9,.62],[.5,.98]];slots.forEach((q,i)=>B.props.push({k:C.props[i%C.props.length],x:VW*q[0]+rnd(-10,10),y:TOP()+(BOT()-TOP())*q[1],s:rnd(.6,.8)}));}
 if(C.special==="gideon"){B.phase="jars";B.dark=.82;B.hero.x=VW*.18;B.jarPos=[0,1,2].map(i=>({x:VW*(.22+i*.28),y:BOT()-6,broken:false}));
  for(let i=0;i<C.goal;i++){const c=i%4,r=Math.floor(i/4);spawn(C.foes[i%2],{x:VW*(.42+c*.16)+rnd(-8,8),y:TOP()+(BOT()-TOP()-130)*(r/4)+rnd(-6,6),sleep:true,face:-1});}}
 if(C.special==="samson2"){B.phase="pray";B.hero.x=VW/2;B.hero.y=BOT()-110;B.pillars=[{x:VW*.2},{x:VW*.8}];
  for(let i=0;i<9;i++)spawn(C.foes[i%2],{x:VW*(.12+i*.095),y:TOP()+10,roof:true});}
 $("bname").textContent=C.hname;$("bsp").querySelector("span").innerHTML=C.spL;$("bover").classList.remove("on");
 setGoal();setAct();$("bt").classList.add("on");document.body.style.overflow="hidden";B.last=performance.now();requestAnimationFrame(loop);}
function endBattle(){B.on=false;$("bt").classList.remove("on");document.body.style.overflow="";renderChallenge();
 const sb=document.querySelector("#chap .topbar .stars");if(sb&&CUR)sb.outerHTML=starHTML(CUR.n);}
$("bexit").onclick=e=>{e.stopPropagation();endBattle();};
$("bovb").onclick=e=>{e.stopPropagation();if(B.lost){startBattle(B.key);return;}endBattle();};

function spawn(f,o={}){const big=o.boss?1.35:(f[0]==="m_troll"?1.1:1);const C=B.C;
 const side=Math.random()<.5?-1:1;
 const e=Object.assign({k:f[0],name:f[1],x:side<0?14:VW-14,y:rnd(TOP(),BOT()),hp:1000,max:1000,face:1,st:"run",t:Math.random(),seg:0,cd:rnd(.6,1.4),flash:0,H:B.H*.92*big,r:B.H*.22*big,spd:rnd(55,80),dead:0,boss:!!o.boss},o);
 if(o.boss){e.hp=e.max=1000*(o.mul||8);e.spd=45;}
 if(f[0]==="m_troll"&&!o.boss){e.hp=e.max=1800;e.spd=45;}
 B.en.push(e);return e;}
function setGoal(){const C=B.C;let s="";
 if(B.phase==="jars")s=`打破瓶子（${B.jars}/3）：點畫面上的瓶子`;
 else if(B.phase==="horn")s="點下方「吹角」";
 else if(B.phase==="pray")s="房頂上約有三千人在看（16:27）。先按下方「求你眷念我」";
 else if(B.phase==="collapse"||B.phase==="done")s="";
 else if(B.phase==="pillars")s=`左右輪流點兩根柱子（${B.push}/14）`;
 else if(B.phase==="thirst")s="參孫甚覺口渴……（15:18）";
 else if(B.phase==="boss")s=B.bossE?`${B.bossE.name}出現了！`:"";
 else if(C.special==="samson1")s=`擊殺 ${B.kills*C.mult} / 1000`;
 else if(C.special==="gideon")s=`米甸營潰亂中（${B.kills}/${C.goal}）`;
 else s=`${C.goalTxt}（${Math.min(B.kills,C.goal)}/${C.goal}）`;
 $("bgoal").textContent=s;$("bcnt").textContent=C.special==="samson1"?`${B.kills*C.mult}`:"";}
function setAct(){const b=$("bact");let t="";
 if(B.phase==="horn")t="吹角";else if(B.phase==="pray")t="求你眷念我";else if(B.phase==="thirst")t="求告耶和華";
 b.style.display=t?"inline-flex":"none";b.textContent=t;
 $("bsp").style.display=(B.phase==="fight"||B.phase==="boss")?"block":"none";}
$("bact").onclick=e=>{e.stopPropagation();au();
 if(B.phase==="horn"){sfx("horn");callout(B.C.sp);B.phase="fight";B.dark=.82;B.lift=true;for(const en of B.en)en.sleep=false;B.chaos=true;B.shake=6;}
 else if(B.phase==="pray"){sfx("spirit");callout("求你眷念我!!");B.phase="pillars";B.prayed=true;B.glow=1;}
 else if(B.phase==="thirst"){sfx("spirit");callout("隱哈歌利!!");B.spring={x:B.hero.x+80,y:B.hero.y-10,t:0};B.phase="done";later(win,1800);}
 setGoal();setAct();};
$("bsp").onclick=e=>{e.stopPropagation();if(B.spirit<100||!(B.phase==="fight"||B.phase==="boss"))return;au();B.spirit=0;sfx("spirit");callout(B.C.sp);
 const h=B.hero;B.fx.push({type:"circle",x:h.x,y:h.y,t:0,d:1.2,R:Math.min(VW,VH)*.42});B.shake=5;
 later(()=>{sfx("boom");for(const en of B.en){if(en.dead||en.roof)continue;const d=Math.hypot(en.x-h.x,en.y-h.y);if(d<Math.min(VW,VH)*.48){hurt(en,en.boss?en.max*.22:rnd(900,1400),true);}}},350);};

cv.addEventListener("pointerdown",e=>{if(!B.on)return;au();const x=e.clientX,y=e.clientY,h=B.hero;
 if(B.phase==="jars"){for(const j of B.jarPos)if(!j.broken&&Math.hypot(x-j.x,y-(j.y-20))<60){j.broken=true;B.jars++;sfx("smash");B.fx.push({type:"torch",x:j.x,y:j.y,t:0});for(let i=0;i<10;i++)B.deb.push({x:j.x,y:j.y-20,vx:rnd(-120,120),vy:rnd(-220,-60),t:0,c:"#a8743a"});if(B.jars>=3){B.phase="horn";}setGoal();setAct();return;}return;}
 if(B.phase==="pillars"){for(let i=0;i<2;i++){const p=B.pillars[i];if(Math.abs(x-p.x)<VW*.14){const side=i?"R":"L";if(side===B.lastP){B.fx.push({type:"txt",x:p.x,y:VH*.5,t:0,s:"換另一邊！"});sfx("bad");return;}B.lastP=side;B.push++;sfx("hit");B.shake=2+B.push*.25;p.wob=1;for(let k=0;k<4;k++)B.deb.push({x:p.x+rnd(-20,20),y:TOP()+rnd(0,40),vx:rnd(-40,40),vy:rnd(0,60),t:0,c:"#8a7a66"});
   if(B.push>=14)collapse();setGoal();return;}}return;}
 if(B.phase!=="fight"&&B.phase!=="boss")return;
 let best=null,bd=1e9;for(const en of B.en){if(en.dead||en.roof)continue;const d=Math.hypot(en.x-x,(en.y-en.H*.45)-y);if(d<Math.max(70,en.H*.6)&&d<bd){bd=d;best=en;}}
 if(best){h.tgt=best;h.mx=null;B.fx.push({type:"mark",x:best.x,y:best.y,t:0});}else{h.tgt=null;h.mx=x;h.my=Math.max(TOP(),Math.min(BOT(),y));B.fx.push({type:"ping",x,y:h.my,t:0});}});

function collapse(){B.phase="collapse";setAct();sfx("boom");B.shake=14;callout("推倒大袞廟!!");B.colT=0;
 for(let i=0;i<70;i++)B.deb.push({x:rnd(0,VW),y:rnd(-200,TOP()),vx:rnd(-30,30),vy:rnd(40,200),t:0,c:Math.random()<.5?"#8a7a66":"#5a4a3a",big:Math.random()<.3});
 for(const en of B.en)en.fall=rnd(0,.6);later(()=>{sfx("boom");B.shake=10;},500);later(win,2600);}
function later(f,ms){const sid=B.sid;setTimeout(()=>{if(B.on&&B.sid===sid)f();},ms);}
function callout(s){B.calls.push({s,t:0});}
function hurt(en,dmg,crit,quiet){if(en.dead)return;dmg=Math.round(dmg);en.hp-=dmg;en.flash=.18;
 en.x+=Math.sign(en.x-B.hero.x||1)*(crit?16:7);
 if(!quiet){B.nums.push({x:en.x+rnd(-14,14),y:en.y-en.H*.85,v:dmg,crit,t:0});sfx(crit?"crit":"hit");}if(crit)B.shake=Math.max(B.shake,3.5);else B.shake=Math.max(B.shake,1.2);
 for(let i=0;i<(crit?8:4);i++)B.fx.push({type:"spark",x:en.x,y:en.y-en.H*.5,vx:rnd(-260,260),vy:rnd(-260,120),t:0});
 if(en.hp<=0){
  if(en.flee){en.hp=1;return;}
  en.dead=.001;B.kills++;sfx("kill");if(!en.boss)B.spirit=Math.min(100,B.spirit+(B.C.special==="samson1"?14:9));setGoal();checkGoal(en);}}
function fmt(v){return v>=1000?(v/1000).toFixed(v>=10000?0:1)+"K":String(v);}
function checkGoal(en){const C=B.C;if(B.ended)return;
 if(en&&en.boss){win();return;}
 if(C.special==="gideon"){if(B.kills>=C.goal)win();return;}
 if(C.special==="samson1"){if(B.kills>=C.goal){B.phase="thirst";for(const e of B.en)if(!e.dead){e.dead=.001;}callout("一千人!!");setGoal();setAct();}return;}
 if(B.phase==="fight"&&B.kills>=C.goal){if(C.boss){B.phase="boss";const b=spawn([C.boss[0],C.boss[1]],{boss:true,mul:C.boss[2],x:VW+60,y:(TOP()+BOT())/2});if(C.boss[3]==="flee")b.flee=true;B.bossE=b;callout(C.boss[1]+"!!");setGoal();setAct();}else win();}}
function win(){if(B.ended||!B.on)return;B.ended=true;B.lost=false;sfx("win");const s=st(CUR.n);const first=!s.ch;s.ch=1;save();const sid=B.sid;
 setTimeout(()=>{if(B.sid!==sid||!B.on)return;$("bovt").textContent=(first?"★ 挑戰完成　":"挑戰完成　")+B.C.title;$("bovp").innerHTML=B.C.win;$("bovb").textContent="回到讀經";$("bover").classList.add("on");},700);}
function lose(){if(B.ended)return;B.ended=true;B.lost=true;$("bovt").textContent="倒下了";$("bovp").innerHTML="士師記裡的勝利從來不是靠自己的力氣。蓄滿下方的能力鈕再放出來，會輕鬆很多。";$("bovb").textContent="再試一次";$("bover").classList.add("on");}

function update(dt){const C=B.C,h=B.hero;B.t+=dt;B.shake=Math.max(0,B.shake-dt*18);h.flash=Math.max(0,h.flash-dt);
 if(B.lift)B.dark=Math.max(0,B.dark-dt*.25);
 if(C.rain&&B.rainT<0&&B.kills>=C.rain&&B.phase!=="jars"){B.rainT=0;callout("天降大雨！基順河氾濫");sfx("boom");}
 if(B.rainT>=0)B.rainT+=dt;
 // spawn
 if(B.phase==="fight"&&!C.special||(C.special==="samson1"&&B.phase==="fight")){B.spawnT-=dt;const alive=B.en.filter(e=>!e.dead).length,cap=C.special==="samson1"?9:6,left=C.goal-B.kills-alive;
  if(B.spawnT<=0&&alive<cap&&left>0){spawn(C.foes[Math.floor(Math.random()*C.foes.length)]);B.spawnT=C.special==="samson1"?.35:rnd(.6,1.2);}}
 // hero
 if(B.phase==="fight"||B.phase==="boss"){h.hp=Math.min(h.max,h.hp+dt*14);
  if(h.tgt&&h.tgt.dead)h.tgt=null;
  if(!h.tgt&&h.mx===null){let bd=1e9;for(const en of B.en){if(en.dead||en.roof||en.sleep||en.x<20||en.x>VW-20)continue;const d=Math.hypot(en.x-h.x,en.y-h.y);if(d<bd){bd=d;h.tgt=en;}}}
  h.cd-=dt;
  if(h.st==="atk"){h.t+=dt/.42;if(!h.hit&&h.t>.45){h.hit=true;const t=h.tgt;if(t&&!t.dead&&Math.hypot(t.x-h.x,t.y-h.y)<B.H*.5+t.r+18){const cr=Math.random()<.22;hurt(t,(cr?rnd(900,1300):rnd(330,470))*(C.special==="samson1"?1.6:1),cr);if(!t.boss||cr)B.spirit=Math.min(100,B.spirit+3);}sfx("swing");}
   if(h.t>=1){h.st="idle";h.t=0;}}
  else{let tx=null,ty=null,reach=0;if(h.tgt){tx=h.tgt.x;ty=h.tgt.y;reach=B.H*.42+h.tgt.r;}else if(h.mx!==null){tx=h.mx;ty=h.my;reach=4;}
   if(tx!==null){const dx=tx-h.x,dy=ty-h.y,d=Math.hypot(dx,dy);if(Math.abs(dx)>4)h.face=dx>0?1:-1;
    if(d>reach){const sp=(h.tgt?230:200)*dt;h.x+=dx/d*Math.min(sp,d-reach+1);h.y+=dy/d*Math.min(sp,d-reach+1);if(h.st!=="run"){h.st="run";h.t=0;}h.t+=dt;}
    else{if(h.mx!==null&&!h.tgt){h.mx=null;h.st="idle";}else if(h.cd<=0){h.st="atk";h.t=0;h.hit=false;h.seg=(h.seg+1)%3;h.cd=.48;}else h.st="idle";}}
   else h.st="idle";}
  h.x=Math.max(30,Math.min(VW-30,h.x));h.y=Math.max(TOP(),Math.min(BOT(),h.y));}
 // enemies
 const slow=B.rainT>=0?.45:1;
 for(const en of B.en){en.flash=Math.max(0,en.flash-dt);
  if(en.dead){en.dead+=dt;continue;}
  if(en.roof){en.t+=dt*.3;if(B.phase==="collapse"){en.fall-=dt;if(en.fall<0){en.y+=dt*260;en.alpha=Math.max(0,(en.alpha??1)-dt*.8);}}continue;}
  if(en.sleep){en.st="idle";continue;}
  let tgt=h,isFoe=false;
  if(B.chaos){let bd=1e9;for(const o of B.en){if(o===en||o.dead||o.sleep)continue;const d=Math.hypot(o.x-en.x,o.y-en.y);if(d<bd){bd=d;tgt=o;isFoe=true;}}if(!isFoe)tgt=h;}
  if(en.flee&&en.hp<en.max*.5){en.st="run";en.face=1;en.x+=160*dt;en.t+=dt;if(en.x>VW+80&&!B.ended){en.dead=.001;callout("西西拉下車逃跑了!!");later(win,900);}continue;}
  const dx=tgt.x-en.x,dy=tgt.y-en.y,d=Math.hypot(dx,dy),reach=(isFoe?tgt.r:B.H*.2)+en.r+8;
  if(Math.abs(dx)>4)en.face=dx>0?1:-1;
  if(en.st==="atk"){en.t+=dt/.6;if(!en.hit&&en.t>.5){en.hit=true;if(d<reach+24){if(isFoe){hurt(tgt,rnd(250,520),false,true);}else if(B.phase==="fight"||B.phase==="boss"){const dm=(en.boss?95:en.k==="m_troll"?60:38)*(B.C.special==="samson1"?.6:1);h.hp-=dm;h.flash=.15;sfx("hurt");B.shake=Math.max(B.shake,1.5);if(h.hp<=0)lose();}}}if(en.t>=1){en.st="idle";en.t=0;en.cd=rnd(.9,1.6);}}
  else if(d>reach){en.st="run";const sp=en.spd*slow*(B.chaos?1.4:1)*dt;en.x+=dx/d*sp;en.y+=dy/d*sp;en.t+=dt*slow;}
  else{en.cd-=dt;en.st="idle";if(en.cd<=0){en.st="atk";en.t=0;en.hit=false;en.seg=Math.floor(Math.random()*3);}}
  // separation
  for(const o of B.en){if(o===en||o.dead||o.roof)continue;const sx=en.x-o.x,sy=en.y-o.y,sd=Math.hypot(sx,sy)||1;if(sd<en.r*1.4){en.x+=sx/sd*(en.r*1.4-sd)*.3;en.y+=sy/sd*(en.r*1.4-sd)*.3;}}
  en.y=Math.max(TOP(),Math.min(BOT(),en.y));}
 if(B.chaos&&!B.ended){const al=B.en.filter(e=>!e.dead).length;if(al<=0)win();}
 B.en=B.en.filter(e=>!e.dead||e.dead<.9);
 for(const f of B.fx){f.t+=dt;if(f.type==="spark"){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=500*dt;}}
 B.fx=B.fx.filter(f=>f.type==="torch"||f.t<(f.type==="circle"?f.d:f.type==="txt"?1:.5));
 for(const n of B.nums)n.t+=dt;B.nums=B.nums.filter(n=>n.t<.9);
 for(const c of B.calls)c.t+=dt;B.calls=B.calls.filter(c=>c.t<1.6);
 for(const d of B.deb){d.t+=dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.vy+=420*dt;}B.deb=B.deb.filter(d=>d.t<2.5&&d.y<VH+40);
 if(B.spring)B.spring.t+=dt;if(B.glow)B.glow=Math.max(.35,B.glow-dt*.3);
 if(B.pillars)for(const p of B.pillars)p.wob=Math.max(0,(p.wob||0)-dt*4);
 // hud
 $("bhp").style.width=Math.max(0,h.hp/h.max*100)+"%";$("bspf").style.height=B.spirit+"%";$("bsp").classList.toggle("ready",B.spirit>=100);}

let GPAT={};
function ground(){const k=B.C.bg;if(!GPAT[k]){const i=img(A.gtex[k]);if(i.complete&&i.naturalWidth)GPAT[k]=cx.createPattern(i,"repeat");}
 cx.fillStyle=GPAT[k]||"#2a2418";cx.fillRect(-20,-20,VW+40,VH+40);
 const g=cx.createLinearGradient(0,0,0,VH);g.addColorStop(0,"rgba(0,0,0,.65)");g.addColorStop(.3,"rgba(0,0,0,.3)");g.addColorStop(1,"rgba(0,0,0,.5)");cx.fillStyle=g;cx.fillRect(-20,-20,VW+40,VH+40);}
function shadow(x,y,r){cx.fillStyle="rgba(0,0,0,.35)";cx.beginPath();cx.ellipse(x,y,r,r*.32,0,0,7);cx.fill();}
function magic(x,y,R,a,rot){cx.save();cx.translate(x,y);cx.scale(1,.45);cx.globalAlpha=a;cx.strokeStyle="#ffd98a";cx.shadowColor="#ffcc55";cx.shadowBlur=18;
 cx.lineWidth=3;cx.beginPath();cx.arc(0,0,R,0,7);cx.stroke();cx.lineWidth=1.5;cx.beginPath();cx.arc(0,0,R*.82,0,7);cx.stroke();
 cx.rotate(rot);cx.beginPath();for(let i=0;i<6;i++){const a1=i*Math.PI/3,a2=a1+Math.PI*2/3;cx.moveTo(Math.cos(a1)*R*.82,Math.sin(a1)*R*.82);cx.lineTo(Math.cos(a2)*R*.82,Math.sin(a2)*R*.82);}cx.stroke();
 for(let i=0;i<12;i++){const an=i*Math.PI/6;cx.fillStyle="#ffe7b0";cx.fillRect(Math.cos(an)*R*.91-3,Math.sin(an)*R*.91-3,6,6);}cx.restore();}
function burst(x,y,r,col){cx.beginPath();for(let i=0;i<20;i++){const a=i*Math.PI/10,rr=i%2?r*.55:r;cx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr*.75);}cx.closePath();cx.fillStyle=col;cx.fill();}
function render(){const C=B.C,h=B.hero;cx.setTransform(DPR,0,0,DPR,0,0);
 const sk=Math.min(6,B.shake);cx.translate(rnd(-sk,sk)*.5,rnd(-sk,sk)*.5);
 ground();
 // samson2 temple
 if(C.special==="samson2"){cx.fillStyle="rgba(40,30,22,.9)";cx.fillRect(0,0,VW,TOP()+20);cx.fillStyle="#6a5640";cx.fillRect(0,TOP()+8,VW,14);
  }
 // list for depth sort
 const L=[];for(const p of B.props)L.push({y:p.y,d:()=>{const i=pimg(p.k);if(i.complete&&i.naturalWidth){const H=B.H*1.2*p.s,w=i.naturalWidth/i.naturalHeight*H;cx.drawImage(i,p.x-w/2,p.y-H,w,H);}}});
 if(B.jarPos)for(const j of B.jarPos)L.push({y:j.y,d:()=>{if(!j.broken){cx.fillStyle="#9a6a3a";cx.strokeStyle="#ffd98a";cx.lineWidth=2;cx.beginPath();cx.ellipse(j.x,j.y-22,18,24,0,0,7);cx.fill();cx.stroke();cx.fillRect(j.x-8,j.y-52,16,10);
   const a=.5+.5*Math.sin(B.t*5);cx.strokeStyle=`rgba(255,220,140,${a})`;cx.beginPath();cx.arc(j.x,j.y-22,34,0,7);cx.stroke();}else{cx.fillStyle="#6a4a2a";cx.fillRect(j.x-18,j.y-6,10,6);cx.fillRect(j.x+6,j.y-5,12,5);}}});
 if(B.pillars)for(const p of B.pillars)L.push({y:BOT()+5,d:()=>{const w=Math.min(70,VW*.11),x=p.x+(p.wob?Math.sin(B.t*60)*p.wob*4:0),y0=TOP()+22,y1=BOT()+10;
   const g=cx.createLinearGradient(x-w/2,0,x+w/2,0);g.addColorStop(0,"#5a4a38");g.addColorStop(.5,"#b8a07c");g.addColorStop(1,"#4a3a2a");cx.fillStyle=g;cx.fillRect(x-w/2,y0,w,y1-y0);
   cx.fillStyle="#8a7458";cx.fillRect(x-w*.65,y0-4,w*1.3,14);cx.fillRect(x-w*.65,y1-12,w*1.3,14);
   if(B.phase==="pillars"){const a=.4+.4*Math.sin(B.t*6);cx.strokeStyle=`rgba(255,220,140,${a})`;cx.lineWidth=3;cx.strokeRect(x-w/2-6,y0-6,w+12,y1-y0+12);}
   if(B.push>4){cx.strokeStyle="rgba(20,10,5,.8)";cx.lineWidth=2;cx.beginPath();cx.moveTo(x-w*.3,y0+40);cx.lineTo(x+w*.1,y0+90);cx.lineTo(x-w*.2,y0+150);if(B.push>9){cx.moveTo(x+w*.3,y1-60);cx.lineTo(x-w*.05,y1-130);}cx.stroke();}}});
 for(const en of B.en){L.push({y:en.y,d:()=>{const a=en.dead?Math.max(0,1-en.dead/.9):(en.alpha??1);if(!en.roof)shadow(en.x,en.y,en.r);
   drawAnim(en.k,en.x,en.y,en.face,en.H*(en.roof?.7:1),en.st,en.t,en.seg,en.flash,a);
   if(!en.dead&&!en.roof&&!en.sleep&&(en.hp<en.max||en.boss)){const w=en.boss?B.H*1.1:B.H*.5;cx.fillStyle="rgba(0,0,0,.6)";cx.fillRect(en.x-w/2,en.y-en.H*1.02,w,en.boss?7:4);cx.fillStyle=en.boss?"#e8704a":"#c8452a";cx.fillRect(en.x-w/2,en.y-en.H*1.02,w*Math.max(0,en.hp/en.max),en.boss?7:4);
    if(en.boss){cx.font=`700 14px "Noto Serif TC"`;cx.textAlign="center";cx.fillStyle="#ffe0a0";cx.strokeStyle="#000";cx.lineWidth=3;cx.strokeText(en.name,en.x,en.y-en.H*1.06);cx.fillText(en.name,en.x,en.y-en.H*1.06);}}}});}
 L.push({y:h.y,d:()=>{shadow(h.x,h.y,B.H*.2);if(B.glow){const g=cx.createRadialGradient(h.x,h.y-B.H*.5,0,h.x,h.y-B.H*.5,B.H);g.addColorStop(0,`rgba(255,220,140,${B.glow*.5})`);g.addColorStop(1,"rgba(255,220,140,0)");cx.fillStyle=g;cx.fillRect(h.x-B.H,h.y-B.H*1.5,B.H*2,B.H*2);}
  drawAnim(C.hero,h.x,h.y,h.face,B.H,h.st==="idle"?"idle":h.st,h.t,h.seg,h.flash);}});
 // ground fx first
 for(const f of B.fx){if(f.type==="circle"){const p=f.t/f.d;magic(f.x,f.y,f.R*Math.min(1,p*3),p<.8?1:(1-p)*5,B.t*2);if(p>.3&&p<.7){cx.save();cx.globalAlpha=(.7-p)*2;cx.strokeStyle="#fff2c8";cx.lineWidth=10;cx.beginPath();cx.ellipse(f.x,f.y,f.R*(p-.25)*2.2,f.R*(p-.25),0,0,7);cx.stroke();cx.restore();}}
  if(f.type==="mark"){cx.strokeStyle=`rgba(255,210,120,${1-f.t*2})`;cx.lineWidth=3;cx.beginPath();cx.ellipse(f.x,f.y,30+f.t*30,10+f.t*10,0,0,7);cx.stroke();}
  if(f.type==="ping"){cx.strokeStyle=`rgba(255,255,255,${.8-f.t*1.6})`;cx.lineWidth=2;cx.beginPath();cx.ellipse(f.x,f.y,10+f.t*40,4+f.t*14,0,0,7);cx.stroke();}}
 if(B.spring){const s=B.spring,a=Math.min(1,s.t);cx.save();cx.globalAlpha=a;const g=cx.createRadialGradient(s.x,s.y,0,s.x,s.y,90);g.addColorStop(0,"rgba(140,210,255,.9)");g.addColorStop(1,"rgba(60,120,200,0)");cx.fillStyle=g;cx.beginPath();cx.ellipse(s.x,s.y,90*a,34*a,0,0,7);cx.fill();
  for(let i=0;i<14;i++){const ph=(B.t*1.4+i/14)%1;cx.fillStyle=`rgba(200,235,255,${1-ph})`;cx.beginPath();cx.arc(s.x+Math.sin(i*2.3)*20*ph,s.y-ph*90,3,0,7);cx.fill();}cx.restore();}
 L.sort((a,b)=>a.y-b.y);for(const o of L)o.d();
 for(const f of B.fx){if(f.type==="spark"){cx.fillStyle=`rgba(255,${200+Math.random()*55|0},120,${1-f.t*2})`;cx.fillRect(f.x-2,f.y-2,4,4);}
  if(f.type==="torch"){const fl=1+Math.sin(B.t*20+f.x)*.15;const g=cx.createRadialGradient(f.x,f.y-50,0,f.x,f.y-50,40*fl);g.addColorStop(0,"rgba(255,240,180,1)");g.addColorStop(.4,"rgba(255,150,40,.9)");g.addColorStop(1,"rgba(255,80,0,0)");cx.fillStyle=g;cx.fillRect(f.x-50,f.y-100,100,100);cx.fillStyle="#5a3a1a";cx.fillRect(f.x-3,f.y-40,6,40);}
  if(f.type==="txt"){cx.font=`700 18px "Noto Serif TC"`;cx.textAlign="center";cx.fillStyle=`rgba(255,200,160,${1-f.t})`;cx.fillText(f.s,f.x,f.y-f.t*30);}}
 for(const d of B.deb){cx.fillStyle=d.c;const s=d.big?14:5;cx.fillRect(d.x-s/2,d.y-s/2,s,s);}
 if(B.rainT>=0){cx.strokeStyle="rgba(170,200,230,.45)";cx.lineWidth=1.2;cx.beginPath();for(let i=0;i<90;i++){const x=(i*97+B.t*260)%(VW+60)-30,y=(i*53+B.t*900)%(VH+40)-20;cx.moveTo(x,y);cx.lineTo(x-6,y+18);}cx.stroke();cx.fillStyle=`rgba(40,60,90,${Math.min(.25,B.rainT*.1)})`;cx.fillRect(0,0,VW,VH);}
 // darkness (gideon) / blindness (samson2)
 if(B.dark>0){cx.save();const g=cx.createRadialGradient(h.x,h.y-40,30,h.x,h.y-40,Math.max(VW,VH)*.5);g.addColorStop(0,`rgba(5,5,15,${B.dark*.4})`);g.addColorStop(1,`rgba(5,5,15,${B.dark})`);cx.fillStyle=g;cx.fillRect(-20,-20,VW+40,VH+40);
  for(const f of B.fx)if(f.type==="torch"){cx.globalCompositeOperation="lighter";const gg=cx.createRadialGradient(f.x,f.y-50,0,f.x,f.y-50,160);gg.addColorStop(0,"rgba(255,160,60,.35)");gg.addColorStop(1,"rgba(255,120,30,0)");cx.fillStyle=gg;cx.fillRect(f.x-160,f.y-210,320,320);cx.globalCompositeOperation="source-over";}cx.restore();}
 if(C.special==="samson2"){const g=cx.createRadialGradient(VW/2,VH*.55,Math.min(VW,VH)*.2,VW/2,VH*.55,Math.max(VW,VH)*.75);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,"rgba(0,0,0,.85)");cx.fillStyle=g;cx.fillRect(0,0,VW,VH);}
 // numbers
 for(const n of B.nums){const p=n.t/.9,y=n.y-p*34,a=p<.7?1:1-(p-.7)/.3;cx.save();cx.globalAlpha=a;cx.textAlign="center";cx.textBaseline="middle";
  if(n.crit){const sc=p<.12?1.5-p*4:1;cx.translate(n.x,y);cx.scale(sc,sc);burst(0,0,26,"rgba(255,120,30,.85)");burst(0,0,17,"rgba(255,230,120,.95)");cx.font=`900 20px "Noto Sans TC"`;cx.lineWidth=4;cx.strokeStyle="#3a0a00";cx.strokeText(fmt(n.v),0,1);cx.fillStyle="#fff";cx.fillText(fmt(n.v),0,1);}
  else{cx.font=`800 15px "Noto Sans TC"`;cx.lineWidth=3;cx.strokeStyle="#000";cx.strokeText(fmt(n.v),n.x,y);cx.fillStyle="#ffe8b0";cx.fillText(fmt(n.v),n.x,y);}cx.restore();}
 // callouts
 for(const c of B.calls){const p=c.t/1.6,sc=p<.1?2-p*10:1,a=p<.8?1:(1-p)*5;cx.save();cx.globalAlpha=a;cx.translate(VW/2,VH*.36);cx.scale(sc,sc);const fs=Math.min(40,VW/(c.s.length*.95+1));
  cx.font=`900 ${fs}px "Noto Serif TC"`;cx.textAlign="center";cx.textBaseline="middle";cx.lineWidth=fs*.22;cx.strokeStyle="#2a0e00";cx.strokeText(c.s,0,0);
  const g=cx.createLinearGradient(0,-fs/2,0,fs/2);g.addColorStop(0,"#fff6d0");g.addColorStop(.5,"#ffd24a");g.addColorStop(1,"#e07a10");cx.fillStyle=g;cx.fillText(c.s,0,0);cx.restore();}
 cx.setTransform(1,0,0,1,0,0);}
function loop(now){if(!B.on)return;const dt=Math.min(.05,(now-B.last)/1000);B.last=now;update(dt);render();requestAnimationFrame(loop);}
