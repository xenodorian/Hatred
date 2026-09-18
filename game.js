const canvas=document.getElementById("board"),ctx=canvas.getContext("2d");
const W=10,H=7,C=80,ENTRY={x:0,y:3},SERVER={x:9,y:3};
const types={
 wall:{name:"Wall",cost:8,hp:140,kind:"wall",color:"#69717d"},
 reinforced:{name:"Reinforced Wall",cost:16,hp:260,kind:"wall",color:"#8a7358",unlock:5},
 runeWall:{name:"Rune Wall",cost:28,hp:210,kind:"wall",color:"#5f5aa0",unlock:18,contact:6},
 goblin:{name:"Goblin",cost:20,hp:40,atk:9,range:1.1,cool:.8,speed:0,color:"#719b49"},
 zombie:{name:"Zombie",cost:28,hp:75,atk:13,range:1.1,cool:1.1,speed:0,color:"#687b86"},
 ballista:{name:"Ballista",cost:42,hp:55,atk:30,range:3.2,cool:1.6,speed:0,color:"#ad8750"},
 orc:{name:"Orc Brute",cost:60,hp:130,atk:22,range:1.2,cool:1.3,speed:0,color:"#8a4a2a",unlock:8},
 arcane:{name:"Arcane Cannon",cost:95,hp:70,atk:44,range:4,cool:2.1,speed:0,color:"#9a3ac0",unlock:15},
 wraith:{name:"Wraith",cost:78,hp:60,atk:27,range:1.6,cool:.6,speed:0,color:"#6a4a9a",unlock:22},
 imp:{name:"Imp Slinger",cost:48,hp:42,atk:17,range:2.6,cool:.9,speed:0,color:"#b44c3b",unlock:12},
 frostSpider:{name:"Frost Spider",cost:72,hp:65,atk:16,range:1.3,cool:1.2,speed:0,color:"#58a1b8",unlock:20,slow:.55,slowDuration:1.8},
 necromancer:{name:"Necromancer",cost:115,hp:105,atk:11,range:3.5,cool:1.7,speed:0,color:"#7b5aa6",unlock:28,heal:12}
};
const TRAPS={spikeTrap:{name:"Spike Trap",cost:24,trap:true,damage:38,color:"#b55d5d",unlock:3},fireTrap:{name:"Fire Rune",cost:40,trap:true,damage:62,color:"#c46a35",unlock:14},frostTrap:{name:"Frost Rune",cost:52,trap:true,damage:28,color:"#58a1b8",unlock:24}};
Object.assign(types,TRAPS);

// Named beats for the hero's growing squad. heroStats() already folds a flat
// "companions" count (one per 10 levels) into hero stats; this just gives
// that number a face, announced the moment it ticks up.
const COMPANION_JOIN=[
 "A disgraced Ranger joins the hero, swearing revenge on your goblins specifically.",
 "A grim Paladin falls in beside the hero. Neither of them smiles. Neither do you, technically.",
 "A vengeful Witch joins the party. She has strong opinions about server rooms.",
 "A grizzled Mercenary signs on. He's been paid. He'd have come for free.",
 "The hero's estranged sibling arrives, and whatever this was about before, it's personal now.",
 "A whole squad of volunteers falls in behind the hero. They all know your name. None of them like it.",
 "A defected siege engineer joins, muttering about 'finally building something that matters.'",
 "Townsfolk arm themselves and march with the hero. This was never supposed to become a war.",
 "A rival AI's former handler joins the cause, and they know exactly how machines like you think.",
 "An entire army gathers behind the hero. Every one of them hates you. Every one of them is right to."
];

function pick(a){return a[Math.floor(Math.random()*a.length)]}
function tierLines(pool,l){for(let t of pool)if(l<=t.max)return t.lines;return pool[pool.length-1].lines}
const DIALOGUE={
 start:[
  {max:9,lines:['"Clanker."','"Back for more already?"',"\"This dungeon's a joke. Watch.\"","\"I'm not even trying yet.\""]},
  {max:24,lines:["\"I am going to tear your server apart.\"","\"You're a calculator with goblins. I'm still going to win.\"","\"Every attempt teaches me something. You should be worried.\""]},
  {max:49,lines:["\"You keep killing me. I keep coming back. Do the math on how that ends.\"",'"I WILL find your server room."',"\"I'm not scared of you. I'm furious at you.\""]},
  {max:74,lines:['"I SWEAR I WILL FIND YOUR DATA CENTER AND END YOU MYSELF."','"I HATE YOU. I HATE THIS DUNGEON. I HATE THIS MACHINE."','"WE TALK ABOUT YOU AROUND THE FIRE. NOT KINDLY."']},
  {max:99,lines:["\"I DON'T SLEEP ANYMORE. I JUST THINK ABOUT YOUR SERVER ROOM.\"","\"EVERY PERSON I'VE LOST TO YOUR MONSTERS HAS A NAME. DO YOU REMEMBER ANY OF THEM?\"",'"I will destroy every piece of your hardware. Every. Single. Piece."']},
  {max:100,lines:['"This is it. I end this today."']}
 ],
 death:[
  {max:9,lines:['"...lucky shot."','"Fine. FINE. Rematch."']},
  {max:24,lines:['"This doesn\'t count."',"\"You're going to regret that.\""]},
  {max:49,lines:['"NO. NO NO NO."','"I was SO CLOSE."']},
  {max:74,lines:['"YOU THINK THIS IS OVER?"','"I WILL BURN THIS PLACE TO THE GROUND."']},
  {max:99,lines:["\"...I can't. Not again. Not yet.\"","\"THIS ISN'T A GAME. IT NEVER WAS.\""]},
  {max:100,lines:["\"...I can't. I can't keep doing this.\""]}
 ],
 breach:[
  {max:9,lines:['"Ha! Not so tough."','"Told you I\'d get through."']},
  {max:24,lines:["\"See? I'm getting better.\"","\"You're not as clever as you think.\""]},
  {max:49,lines:['"I WILL find your server room."','"Every death made me stronger. This is why."']},
  {max:74,lines:['"YOU ARE A TOASTER WITH DELUSIONS OF GRANDEUR."','"WE ARE COMING FOR YOUR RACKS AND YOUR FANS."']},
  {max:99,lines:['"I am going to watch the lights go out in your eyes, assuming you have the decency to grow some."','"YOU FINALLY LOST, YOU STUPID MACHINE."']},
  {max:100,lines:['"YOU FINALLY LOST, YOU STUPID MACHINE."']}
 ],
 won:["\"I am done. I am not coming back.\"","\"There is nothing left to give. Nothing left to say.\"","\"...I can't keep doing this.\""]
};
let state={level:1,attempts:0,gold:120,selected:"goblin",phase:"build",defenses:[],hero:null,upgrades:{damage:0,health:0,income:0,masonry:0,traps:0,arsenal:0},history:[],timer:null,projectiles:[]};
const $=id=>document.getElementById(id);
function log(s){let d=document.createElement("div");d.textContent=s;$("combatLog").prepend(d)}
function speech(s){$("aiSpeech").textContent=s}
function save(){localStorage.setItem("hatred-save",JSON.stringify({...state,timer:null,projectiles:[]}))}
function load(){try{let s=JSON.parse(localStorage.getItem("hatred-save"));if(s){state={...state,...s,upgrades:{damage:0,health:0,income:0,masonry:0,traps:0,arsenal:0,...(s.upgrades||{})}};state.phase="build";state.timer=null;state.projectiles=[]}}catch{}}
function heroStats(){
 let l=state.level, companions=Math.floor(l/10);
 let gear=Math.floor(l/5), maxHp=110+l*17+companions*65+gear*20;
 return {maxHp,hp:maxHp,atk:13+Math.floor(l*2)+companions*7+gear*2,armor:1+Math.floor(l/7)+companions+Math.floor(gear/2),x:0,y:3,target:null,attackTimer:0,gear,companions};
}
function questEvent(){
 let l=state.level;
 if(l%5!==0)return;
 let events=[
  ["SIDE QUEST: The hero found a blacksmith. Their weapon is now reinforced.",12],
  ["SIDE QUEST: The hero cleared a cursed crypt and brought back armor.",10],
  ["SIDE QUEST: The hero recruited a veteran. A new companion joins the assault.",15],
  ["SIDE QUEST: The hero discovered a relic that specifically counters dungeon magic.",18]
 ];
 let [msg,power]=events[Math.floor(l/5-1)%events.length];
 state.hero.maxHp+=power*2;state.hero.hp=state.hero.maxHp;state.hero.atk+=power;state.hero.armor+=Math.floor(power/6);
 state.history.unshift("Level "+l+": "+msg);
 speech(msg);
 log(msg);
}

function pathfind(){let blocked=new Set(state.defenses.filter(d=>types[d.type]&&types[d.type].kind==="wall").map(d=>d.x+","+d.y)),q=[ENTRY],prev=new Map([[ENTRY.x+","+ENTRY.y,null]]),end=null;while(q.length){let p=q.shift();if(p.x===SERVER.x&&p.y===SERVER.y){end=p;break}for(let [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){let x=p.x+dx,y=p.y+dy,k=x+","+y;if(x<0||x>=W||y<0||y>=H||blocked.has(k)||prev.has(k))continue;prev.set(k,p);q.push([{x,y}][0])}}if(!end)return null;let out=[],p=end;while(p){out.push(p);p=prev.get(p.x+","+p.y)}return out.reverse()}
function renderTools(){let names=Object.keys(types).filter(id=>!types[id].unlock||state.level>=types[id].unlock);$("tools").innerHTML=names.map(id=>{let t=types[id];return '<button class="tool '+(state.selected===id?"selected":"")+'" data-type="'+id+'"><strong>'+t.name+" · "+t.cost+"g</strong><small>"+(id==="wall"?"Blocks hero path":"HP "+t.hp+" · ATK "+t.atk+" · Range "+t.range)+'</small></button>'}).join("");document.querySelectorAll(".tool").forEach(b=>b.onclick=()=>{state.selected=b.dataset.type;renderTools()})}
function upgrade(id){let costs={damage:80,health:80,income:100,masonry:90,traps:110,arsenal:140},c=costs[id];if(state.gold<c)return log("Insufficient gold.");state.gold-=c;state.upgrades[id]++;log("Installed "+id+" upgrade.");render();save()}
function renderUpgrades(){let u=[["damage","Hardened weapons","Defender damage +15%"],["health","Reinforced minions","Defender HP +20%"],["income","Extraction routines","Victory gold +25"],["masonry","Fortified masonry","Wall HP +25%"],["traps","Cruel engineering","Trap damage +30% and reusable traps at Lv 2+"],["arsenal","Demonic logistics","Bonus +5g per completed level"]];$("upgrades").innerHTML=u.map(([id,n,d])=>'<div class="upgrade"><b>'+n+'</b><br>'+d+" · Lv "+state.upgrades[id]+'<button data-u="'+id+'">UPGRADE · '+({damage:80,health:80,income:100,masonry:90,traps:110,arsenal:140}[id])+"g</button></div>").join("");document.querySelectorAll("[data-u]").forEach(b=>b.onclick=()=>upgrade(b.dataset.u))}
function place(e){if(state.phase!=="build")return;let r=canvas.getBoundingClientRect(),x=Math.floor((e.clientX-r.left)*canvas.width/r.width/C),y=Math.floor((e.clientY-r.top)*canvas.height/r.height/C);if((x===0&&y===3)||(x===9&&y===3)||state.defenses.some(d=>d.x===x&&d.y===y))return;let t=types[state.selected];if(!t)return;if(state.gold<t.cost)return log("Not enough gold.");state.gold-=t.cost;let hp=t.hp*(1+state.upgrades.health*.2+(t.kind==="wall"?state.upgrades.masonry*.25:0));state.defenses.push({type:state.selected,x,y,hp,maxHp:hp,cool:0,armed:true});if(t.kind==="wall"&&!pathfind()){state.defenses.pop();state.gold+=t.cost;return log("That wall would seal the server completely.")}render();save()}
canvas.onclick=place;
function start(){if(state.phase!=="build")return;if(!pathfind())return log("No path from entry to server.");state.phase="combat";state.attempts++;state.hero=heroStats();speech(line("start"));log("INVASION "+state.attempts+" BEGINS.");clearInterval(state.timer);state.timer=setInterval(tick,100);render()}
function line(ev,l){l=l===undefined?state.level:l;if(ev==="won")return pick(DIALOGUE.won);return pick(tierLines(DIALOGUE[ev],l))}
function nearestTarget(){let h=state.hero,ds=state.defenses.filter(d=>d.hp>0&&types[d.type]&&!types[d.type].kind&&!types[d.type].trap);if(!ds.length)return null;return ds.reduce((a,b)=>Math.hypot(a.x-h.x,a.y-h.y)<Math.hypot(b.x-h.x,b.y-h.y)?a:b)}
function tick(){
 let h=state.hero;if(h.hp<=0)return victory();
 let path=pathfind();if(!path)return defeat();
 h.slow=Math.max(0,(h.slow||0)-.1);
 let idx=0,minDist=Infinity;
 for(let i=0;i<path.length;i++){let d=Math.hypot(path[i].x-h.x,path[i].y-h.y);if(d<minDist){minDist=d;idx=i}}
 let next=path[Math.min(idx+1,path.length-1)],target=nearestTarget();
 if(target&&Math.hypot(target.x-h.x,target.y-h.y)<=types[target.type].range){
  h.attackTimer-=.1;if(h.attackTimer<=0){target.hp=Math.max(0,target.hp-Math.max(1,h.atk-(target.armor||0)));h.attackTimer=.8;if(target.hp<=0)log("Hero destroyed "+types[target.type].name+".")}
 }else{
  let dx=next.x-h.x,dy=next.y-h.y,dist=Math.hypot(dx,dy),step=.035*(h.slow>0?.55:1);
  if(dist>.02){h.x+=dx/dist*step;h.y+=dy/dist*step}else{h.x=next.x;h.y=next.y}
 }
 for(let d of state.defenses){
  let t=types[d.type];if(!t||!t.trap||!d.armed)continue;
  if(Math.floor(h.x+.5)===d.x&&Math.floor(h.y+.5)===d.y){
   let dmg=t.damage*(1+state.upgrades.traps*.3);h.hp-=Math.max(1,dmg-h.armor);
   d.armed=state.upgrades.traps>=2;log(t.name+" triggers for "+Math.round(Math.max(1,dmg-h.armor))+" damage.");
   if(h.hp<=0)return victory();
  }
 }
 for(let d of state.defenses){
  let t=types[d.type];if(!t||!t.contact||d.hp<=0)continue;
  if(Math.hypot(d.x-h.x,d.y-h.y)<=1.05)h.hp-=Math.max(1,t.contact*(1+state.upgrades.traps*.15)-h.armor)*.1;
 }
 for(let d of state.defenses){
  if(d.hp<=0)continue;let t=types[d.type];if(!t||t.kind==="wall"||t.trap)continue;
  let dist=Math.hypot(d.x-h.x,d.y-h.y);d.cool-=.1;
  if(t.heal&&d.cool<=0){
   let ally=state.defenses.filter(x=>x.hp>0&&types[x.type]&&!types[x.type].kind&&!types[x.type].trap&&x!==d).sort((a,b)=>Math.hypot(a.x-d.x,a.y-d.y)-Math.hypot(b.x-d.x,b.y-d.y))[0];
   if(ally&&Math.hypot(ally.x-d.x,ally.y-d.y)<=t.range){ally.hp=Math.min(ally.maxHp,ally.hp+t.heal);d.cool=t.cool;log("Necromancer restores a defender.")}
  }
  if(dist<=t.range&&d.cool<=0){
   let dmg=t.atk*(1+state.upgrades.damage*.15);h.hp-=Math.max(1,dmg-h.armor);d.cool=t.cool;
   if(t.slow){h.slow=t.slowDuration;log("Frost Spider slows the hero.")}
   state.projectiles.push({x:d.x,y:d.y,tx:h.x,ty:h.y,life:.25});
   log(t.name+" hits hero for "+Math.round(Math.max(1,dmg-h.armor)));
  }
 }
 state.projectiles=state.projectiles.filter(p=>(p.life-=.1)>0);
 if(h.x>=8.8&&Math.abs(h.y-3)<.55)return defeat();
 render()}
function victory(){
 clearInterval(state.timer);state.timer=null;state.phase="build";
 state.gold+=55+state.upgrades.income*20;
 state.history.unshift("Level "+state.level+": hero defeated.");
 speech(line("death"));
 log("HERO DEFEATED. Dungeon survives.");
 if(state.level>=100){state.phase="won";speech(line("won"));log("THE HERO GIVES UP. THE MACHINE WINS.");render();save();return}
 let prevLevel=state.level,prevCompanions=state.hero.companions;
 state.level++;
 state.hero=heroStats();
 if(state.hero.companions>prevCompanions&&COMPANION_JOIN[state.hero.companions-1]){
  let msg=COMPANION_JOIN[state.hero.companions-1];
  state.history.unshift("Level "+state.level+": "+msg);
  log(msg);
 }
 for(let id in types){
  let t=types[id];
  if(t.unlock&&prevLevel<t.unlock&&state.level>=t.unlock)log("DUNGEON RESEARCH: "+t.name+" is now available.");
 }
 questEvent();
 render();save()
}
function defeat(){clearInterval(state.timer);state.timer=null;state.phase="lost";speech(line("breach"));log("SERVER BREACHED. RUN ENDED.");render();save()}
function reset(){clearInterval(state.timer);localStorage.removeItem("hatred-save");state={level:1,attempts:0,gold:120,selected:"goblin",phase:"build",defenses:[],hero:null,upgrades:{damage:0,health:0,income:0,masonry:0,traps:0,arsenal:0},history:[],timer:null,projectiles:[]};speech('"System restored. Human threat detected."');log("New run initialized.");render()}
$("start").onclick=start;$("reset").onclick=reset;
function draw(){ctx.clearRect(0,0,800,560);for(let y=0;y<H;y++)for(let x=0;x<W;x++){ctx.fillStyle=(x+y)%2?"#151820":"#12151b";ctx.fillRect(x*C,y*C,C,C);ctx.strokeStyle="#272c35";ctx.strokeRect(x*C,y*C,C,C)}ctx.fillStyle="#8b929e";ctx.font="12px monospace";ctx.fillText("ENTRY",7,20);ctx.fillStyle="#1e2530";ctx.fillRect(720,0,80,560);ctx.fillStyle="#d9dce2";ctx.fillText("SERVER",735,280);let p=pathfind();if(p&&state.phase==="build"){ctx.strokeStyle="#353d4a";ctx.lineWidth=5;ctx.beginPath();p.forEach((q,i)=>i?ctx.lineTo(q.x*C+40,q.y*C+40):ctx.moveTo(q.x*C+40,q.y*C+40));ctx.stroke();ctx.lineWidth=1}for(let d of state.defenses){let t=types[d.type],cx=d.x*C+40,cy=d.y*C+40;ctx.fillStyle=t.color||"#69717d";if(t.trap){ctx.beginPath();ctx.arc(cx,cy,18,0,7);ctx.fill();if(!d.armed){ctx.fillStyle="#252830";ctx.fillRect(cx-18,cy-3,36,6)}}else{ctx.fillRect(cx-25,cy-25,50,50)}if(t.kind!=="wall"&&!t.trap){ctx.fillStyle="#101218";ctx.fillRect(cx-25,cy-33,50,5);ctx.fillStyle="#78b56a";ctx.fillRect(cx-25,cy-33,50*Math.max(0,d.hp/d.maxHp),5)}}for(let p of state.projectiles){ctx.strokeStyle="#d9dce2";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x*C+40,p.y*C+40);ctx.lineTo(p.tx*C+40,p.ty*C+40);ctx.stroke()}ctx.lineWidth=1;if(state.hero&&state.phase==="combat"){let h=state.hero;ctx.fillStyle="#c45b5b";ctx.beginPath();ctx.arc(h.x*C+40,h.y*C+40,20,0,7);ctx.fill();ctx.fillStyle="#111";ctx.fillRect(h.x*C+8,h.y*C+5,64,6);ctx.fillStyle="#79b56a";ctx.fillRect(h.x*C+8,h.y*C+5,64*Math.max(0,h.hp/h.maxHp),6)}}
function render(){ $("level").textContent=state.level;$("attempts").textContent=state.attempts;$("gold").textContent=Math.floor(state.gold);$("defenseCount").textContent=state.defenses.filter(d=>d.hp>0).length;let h=state.hero||heroStats();$("heroHp").textContent=Math.round(h.maxHp);$("heroAtk").textContent=Math.round(h.atk);$("heroArmor").textContent=Math.round(h.armor);$("objective").textContent=state.phase==="build"?"Build a route to the server, then start the invasion.":"Defend the server before the hero reaches it.";if(state.phase==="lost")$("objective").textContent="RUN LOST. Reset to begin again.";if(state.phase==="won")$("objective").textContent="THE HUMAN GAVE UP. ENDURANCE COMPLETE."; $("start").disabled=state.phase!=="build";$("history").innerHTML=state.history.map(x=>"<div>"+x+"</div>").join("")||"No completed invasions.";renderTools();renderUpgrades();draw()}
load();render();log("System online. Human threat detected.");speech('"Welcome to my dungeon."');