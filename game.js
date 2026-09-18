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
const TRAPS={spikeTrap:{name:"Spike Trap",cost:24,trap:true,hp:1,damage:38,color:"#b55d5d",unlock:3},fireTrap:{name:"Fire Rune",cost:40,trap:true,hp:1,damage:62,color:"#c46a35",unlock:14},frostTrap:{name:"Frost Rune",cost:52,trap:true,hp:1,damage:28,color:"#58a1b8",unlock:24,slow:.7,slowDuration:2}};
Object.assign(types,TRAPS);

// Named allies join at these exact levels (not a flat every-N-levels rate) so
// each arrival can be a real narrative beat instead of a background tick.
// heroStats() below counts how many of these thresholds have been crossed.
const ALLY_LEVELS=[20,40,60,80];
const ALLY_JOIN=[
 "A grim Paladin falls in beside the hero. Neither of them smiles. Neither do you, technically.",
 "A vengeful Witch joins the party. She has strong opinions about server rooms.",
 "The hero's estranged sibling arrives, and whatever this was about before, it's personal now.",
 "A whole squad of volunteers falls in behind the hero. They all know your name. None of them like it."
];

// Named weapon/armor tiers, purely presentational on top of the numeric
// `gear` stat multiplier heroStats() already computes — this just gives the
// player-facing number a name, announced whenever it changes.
const GEAR_TIERS=[
 {level:1,name:"Rusty Shortsword & Leather Rags"},
 {level:10,name:"Tempered Steel Blade & Studded Leather"},
 {level:25,name:"Enchanted Longsword & Chainmail"},
 {level:40,name:"Dragon-Forged Greatsword & Plate Armor"},
 {level:60,name:"Blessed Executioner's Edge & Sanctified Plate"},
 {level:80,name:"Reality-Cutting Blade & Voidforged Armor"},
 {level:100,name:"The Last Thing You'll Ever See"}
];
function gearTierName(l){let n=GEAR_TIERS[0].name;for(let t of GEAR_TIERS)if(l>=t.level)n=t.name;return n}

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
let state={level:1,attempts:0,gold:120,selected:"goblin",phase:"build",defenses:[],hero:null,upgrades:{damage:0,health:0,income:0,masonry:0,traps:0,arsenal:0},history:[],timer:null,projectiles:[],heroBonus:{hp:0,atk:0,armor:0}};
const $=id=>document.getElementById(id);
function log(s){let d=document.createElement("div");d.textContent=s;$("combatLog").prepend(d)}
function speech(s){$("aiSpeech").textContent=s}
function save(){localStorage.setItem("hatred-save",JSON.stringify({...state,timer:null,projectiles:[]}))}
function load(){try{let s=JSON.parse(localStorage.getItem("hatred-save"));if(s){state={...state,...s,upgrades:{damage:0,health:0,income:0,masonry:0,traps:0,arsenal:0,...(s.upgrades||{})},heroBonus:{hp:0,atk:0,armor:0,...(s.heroBonus||{})}};state.phase="build";state.timer=null;state.projectiles=[]}}catch{}}
function heroStats(){
 let l=state.level, companions=ALLY_LEVELS.filter(x=>l>=x).length;
 let gear=Math.floor(l/5), maxHp=110+l*17+companions*65+gear*20+state.heroBonus.hp;
 return {maxHp,hp:maxHp,atk:13+Math.floor(l*2)+companions*7+gear*2+state.heroBonus.atk,armor:1+Math.floor(l/7)+companions+Math.floor(gear/2)+state.heroBonus.armor,x:0,y:3,target:null,attackTimer:0,gear,companions,slow:0};
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
 state.heroBonus.hp+=power*2;state.heroBonus.atk+=power;state.heroBonus.armor+=Math.floor(power/6);state.hero=heroStats();
 state.history.unshift("Level "+l+": "+msg);
 speech(msg);
 log(msg);
}

function pathfind(){let blocked=new Set(state.defenses.filter(d=>types[d.type]&&types[d.type].kind==="wall").map(d=>d.x+","+d.y)),q=[ENTRY],prev=new Map([[ENTRY.x+","+ENTRY.y,null]]),end=null;while(q.length){let p=q.shift();if(p.x===SERVER.x&&p.y===SERVER.y){end=p;break}for(let [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){let x=p.x+dx,y=p.y+dy,k=x+","+y;if(x<0||x>=W||y<0||y>=H||blocked.has(k)||prev.has(k))continue;prev.set(k,p);q.push([{x,y}][0])}}if(!end)return null;let out=[],p=end;while(p){out.push(p);p=prev.get(p.x+","+p.y)}return out.reverse()}
function renderTools(){let names=Object.keys(types).filter(id=>!types[id].unlock||state.level>=types[id].unlock);$("tools").innerHTML=names.map(id=>{let t=types[id];return '<button class="tool '+(state.selected===id?"selected":"")+'" data-type="'+id+'"><strong>'+t.name+" · "+t.cost+"g</strong><small>"+(t.trap?"Triggers for "+t.damage+" damage":t.kind==="wall"?"Blocks hero path":"HP "+t.hp+" · ATK "+t.atk+" · Range "+t.range)+'</small></button>'}).join("");document.querySelectorAll(".tool").forEach(b=>b.onclick=()=>{state.selected=b.dataset.type;renderTools()});let t=types[state.selected];$("selection").innerHTML=t?"<b>"+t.name+"</b><br>"+(t.trap?"Trap: "+t.damage+" damage"+(t.slow?" + slow":""):t.kind==="wall"?"Structure: blocks the hero path"+(t.contact?"<br>Contact damage: "+t.contact:""):"HP "+t.hp+" · Attack "+t.atk+" · Range "+t.range+"<br>"+(t.heal?"Support: heals nearby defenders.":"")+(t.slow?"Control: slows the hero.":"")):"Select a defense to inspect it."}
function upgrade(id){let base={damage:80,health:80,income:100,masonry:90,traps:110,arsenal:140},max={damage:5,health:5,income:5,masonry:4,traps:4,arsenal:5},c=Math.floor(base[id]*Math.pow(1.45,state.upgrades[id]));if(state.upgrades[id]>=max[id])return log("That upgrade is already maxed.");if(state.gold<c)return log("Insufficient gold.");state.gold-=c;state.upgrades[id]++;log("Installed "+id+" upgrade.");render();save()}
function renderUpgrades(){let base={damage:80,health:80,income:100,masonry:90,traps:110,arsenal:140},max={damage:5,health:5,income:5,masonry:4,traps:4,arsenal:5};let u=[["damage","Hardened weapons","Defender damage +15%"],["health","Reinforced minions","Defender HP +20%"],["income","Extraction routines","Victory gold +25"],["masonry","Fortified masonry","Wall HP +25%"],["traps","Cruel engineering","Trap damage +30%; Lv 2+ traps re-arm"],["arsenal","Demonic logistics","Bonus +5g per completed level"]];$("upgrades").innerHTML=u.map(([id,n,d])=>{let maxed=state.upgrades[id]>=max[id],cost=Math.floor(base[id]*Math.pow(1.45,state.upgrades[id]));return '<div class="upgrade"><b>'+n+'</b><br>'+d+' · Lv '+state.upgrades[id]+'/'+max[id]+'<button data-u="'+id+'" '+(maxed?'disabled':'')+'>'+(maxed?'MAXED':'UPGRADE · '+cost+'g')+'</button></div>'}).join("");document.querySelectorAll("[data-u]").forEach(b=>b.onclick=()=>upgrade(b.dataset.u))}
function place(e){if(state.phase!=="build")return;let r=canvas.getBoundingClientRect(),x=Math.floor((e.clientX-r.left)*canvas.width/r.width/C),y=Math.floor((e.clientY-r.top)*canvas.height/r.height/C);if((x===0&&y===3)||(x===9&&y===3)||state.defenses.some(d=>d.x===x&&d.y===y))return;let t=types[state.selected];if(!t)return;if(state.gold<t.cost)return log("Not enough gold.");state.gold-=t.cost;let hp=t.trap?1:t.hp*(1+state.upgrades.health*.2+(t.kind==="wall"?state.upgrades.masonry*.25:0));state.defenses.push({type:state.selected,x,y,hp,maxHp:hp,cool:0,armed:true,trapCooldown:0});if(t.kind==="wall"&&!pathfind()){state.defenses.pop();state.gold+=t.cost;return log("That wall would seal the server completely.")}render();save()}
canvas.onclick=place;
function start(){if(state.phase!=="build")return;if(!pathfind())return log("No path from entry to server.");state.phase="combat";state.attempts++;state.hero=heroStats();speech(line("start"));log("INVASION "+state.attempts+" BEGINS.");clearInterval(state.timer);state.timer=setInterval(tick,100);render()}
function line(ev,l){l=l===undefined?state.level:l;if(ev==="won")return pick(DIALOGUE.won);return pick(tierLines(DIALOGUE[ev],l))}
function hasLineOfSight(a,b){let x0=Math.round(a.x),y0=Math.round(a.y),x1=b.x,y1=b.y,dx=x1-x0,dy=y1-y0,steps=Math.max(Math.abs(dx),Math.abs(dy))*10;for(let i=1;i<steps;i++){let x=Math.round(x0+dx*i/steps),y=Math.round(y0+dy*i/steps);if((x!==x0||y!==y0)&&(x!==Math.round(x1)||y!==Math.round(y1))&&state.defenses.some(d=>d.x===x&&d.y===y&&types[d.type]&&types[d.type].kind==="wall"))return false}return true}\nfunction routeIndexForHero(path,h){let best=0,dist=Infinity;path.forEach((p,i)=>{let d=Math.hypot(p.x-h.x,p.y-h.y);if(d<dist){dist=d;best=i}});return best}\nfunction nearestTarget(path){let h=state.hero,idx=routeIndexForHero(path,h),ds=state.defenses.filter(d=>d.hp>0&&types[d.type]&&!types[d.type].kind&&!types[d.type].trap).map(d=>({d,route:path.findIndex(p=>p.x===d.x&&p.y===d.y)})).filter(o=>o.route>=0&&Math.abs(o.route-idx)<=2&&Math.hypot(o.d.x-h.x,o.d.y-h.y)<=2.2);if(!ds.length)return null;return ds.sort((a,b)=>Math.abs(a.route-idx)-Math.abs(b.route-idx)||Math.hypot(a.d.x-h.x,a.d.y-h.y)-Math.hypot(b.d.x-h.x,b.d.y-h.y))[0].d}
function tick(){
 let h=state.hero;if(h.hp<=0)return victory();
 let path=pathfind();if(!path)return defeat();
 h.slow=Math.max(0,(h.slow||0)-.1);
 let idx=0,minDist=Infinity;
 for(let i=0;i<path.length;i++){let d=Math.hypot(path[i].x-h.x,path[i].y-h.y);if(d<minDist){minDist=d;idx=i}}
 let next=path[Math.min(idx+1,path.length-1)],target=nearestTarget();
 if(target&&Math.hypot(target.x-h.x,target.y-h.y)<=1.15){
  h.attackTimer-=.1;if(h.attackTimer<=0){target.hp=Math.max(0,target.hp-Math.max(1,h.atk-(target.armor||0)));h.attackTimer=.8;if(target.hp<=0)log("Hero destroyed "+types[target.type].name+".")}
 }else{
  let dx=next.x-h.x,dy=next.y-h.y,dist=Math.hypot(dx,dy),step=.035*(h.slow>0?.55:1);
  if(dist>.02){h.x+=dx/dist*step;h.y+=dy/dist*step}else{h.x=next.x;h.y=next.y}
 }
 for(let d of state.defenses){
  let t=types[d.type];if(!t||!t.trap)continue;
  if(d.trapCooldown>0){d.trapCooldown-=.1;if(d.trapCooldown<=0)d.armed=true}
  if(!d.armed)continue;
  if(Math.floor(h.x+.5)===d.x&&Math.floor(h.y+.5)===d.y){
   let dmg=t.damage*(1+state.upgrades.traps*.3);h.hp-=Math.max(1,dmg-h.armor);
   if(t.slow)h.slow=t.slowDuration;
   d.armed=false;if(state.upgrades.traps>=2)d.trapCooldown=1.8;
   log(t.name+" triggers for "+Math.round(Math.max(1,dmg-h.armor))+" damage.");
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
  if(dist<=t.range&&d.cool<=0&&hasLineOfSight(d,h)){
   let dmg=t.atk*(1+state.upgrades.damage*.15);h.hp-=Math.max(1,dmg-h.armor);d.cool=t.cool;
   if(t.slow){h.slow=t.slowDuration;log("Frost Spider slows the hero.")}
   state.projectiles.push({x:d.x,y:d.y,tx:h.x,ty:h.y,life:.5,t:0});
   log(t.name+" hits hero for "+Math.round(Math.max(1,dmg-h.armor)));
  }
 }
 state.projectiles=state.projectiles.filter(p=>(p.life-=.1)>0);state.projectiles.forEach(p=>p.t=Math.min(1,(p.t||0)+.2));
 if(h.x>=8.8&&Math.abs(h.y-3)<.55)return defeat();
 render()}
function victory(){
 clearInterval(state.timer);state.timer=null;state.phase="build";
 state.gold+=55+state.upgrades.income*25+state.upgrades.arsenal*5;
 state.history.unshift("Level "+state.level+": hero defeated.");
 speech(line("death"));
 log("HERO DEFEATED. Dungeon survives.");
 if(state.level>=100){state.phase="won";speech(line("won"));log("THE HERO GIVES UP. THE MACHINE WINS.");render();save();return}
 let prevLevel=state.level,prevCompanions=state.hero.companions,prevGear=gearTierName(prevLevel);
 state.level++;
 state.hero=heroStats();
 let newGear=gearTierName(state.level);
 if(newGear!==prevGear){
  let msg="The hero returns better equipped: "+newGear+".";
  state.history.unshift("Level "+state.level+": "+msg);
  log(msg);
 }
 if(state.hero.companions>prevCompanions&&ALLY_JOIN[state.hero.companions-1]){
  let msg=ALLY_JOIN[state.hero.companions-1];
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
function reset(){clearInterval(state.timer);localStorage.removeItem("hatred-save");state={level:1,attempts:0,gold:120,selected:"goblin",phase:"build",defenses:[],hero:null,upgrades:{damage:0,health:0,income:0,masonry:0,traps:0,arsenal:0},history:[],timer:null,projectiles:[],heroBonus:{hp:0,atk:0,armor:0}};speech('"System restored. Human threat detected."');log("New run initialized.");render()}
$("start").onclick=start;$("reset").onclick=reset;
function draw(){
 ctx.clearRect(0,0,800,560);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  let edge=x===0||y===0||x===W-1||y===H-1;
  ctx.fillStyle=edge?"#11151a":(x+y)%2?"#171b20":"#14181d";ctx.fillRect(x*C,y*C,C,C);
  ctx.strokeStyle="#252b32";ctx.strokeRect(x*C,y*C,C,C);
  if(!edge){ctx.fillStyle="#1d2228";ctx.fillRect(x*C+8,y*C+8,3,3);ctx.fillRect(x*C+66,y*C+54,2,2)}
 }
 let p=pathfind();
 if(p&&state.phase==="build"){ctx.strokeStyle="#38424d";ctx.lineWidth=8;ctx.lineCap="round";ctx.beginPath();p.forEach((q,i)=>i?ctx.lineTo(q.x*C+40,q.y*C+40):ctx.moveTo(q.x*C+40,q.y*C+40));ctx.stroke();ctx.lineWidth=1}
 function label(text,x,y){ctx.font="bold 11px monospace";ctx.textAlign="center";ctx.fillStyle="#cbd0d8";ctx.fillText(text,x,y)}
 label("ENTRY",40,17);
 ctx.fillStyle="#0b0e12";ctx.fillRect(720,0,80,560);ctx.fillStyle="#202832";ctx.fillRect(728,190,64,180);ctx.strokeStyle="#5c6875";ctx.strokeRect(728,190,64,180);
 ctx.fillStyle="#76a8d1";ctx.fillRect(738,205,44,28);ctx.fillStyle="#d9dce2";ctx.fillRect(744,245,32,10);ctx.fillRect(744,265,32,10);ctx.fillStyle="#76a8d1";ctx.fillRect(744,292,32,45);label("SERVER",760,355);
 for(let d of state.defenses){
  let t=types[d.type],cx=d.x*C+40,cy=d.y*C+40;
  ctx.save();ctx.translate(cx,cy);
  if(t.trap){
   ctx.strokeStyle=d.armed?t.color:"#3a3e45";ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,22,0,Math.PI*2);ctx.stroke();
   if(d.type==="spikeTrap"){ctx.fillStyle=d.armed?"#b55d5d":"#3b3e43";for(let i=0;i<8;i++){let q=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(q)*5,Math.sin(q)*5);ctx.lineTo(Math.cos(q)*19,Math.sin(q)*19);ctx.stroke()}}
   else {ctx.fillStyle=d.armed?t.color:"#30343a";ctx.beginPath();ctx.moveTo(0,-18);ctx.lineTo(17,10);ctx.lineTo(0,18);ctx.lineTo(-17,10);ctx.closePath();ctx.fill();ctx.fillStyle="#e8edf2";ctx.fillRect(-2,-5,4,10)}
  }else if(t.kind==="wall"){
   ctx.fillStyle=t.color;ctx.fillRect(-30,-30,60,60);ctx.strokeStyle="#d4d8de";ctx.lineWidth=2;ctx.strokeRect(-30,-30,60,60);
   if(d.type==="reinforced"){ctx.fillStyle="#5d4632";ctx.fillRect(-23,-23,46,8);ctx.fillRect(-23,-7,46,8);ctx.fillRect(-23,9,46,8)}
   if(d.type==="runeWall"){ctx.strokeStyle="#b8aaff";ctx.beginPath();ctx.moveTo(-18,0);ctx.lineTo(-8,-12);ctx.lineTo(8,12);ctx.lineTo(18,0);ctx.stroke()}
   else {ctx.strokeStyle="#8e98a5";ctx.beginPath();ctx.moveTo(-30,-10);ctx.lineTo(30,-10);ctx.moveTo(-30,10);ctx.lineTo(30,10);ctx.stroke()}
  }else{
   ctx.fillStyle=t.color;ctx.strokeStyle="#d8dce2";ctx.lineWidth=2;
   if(d.type==="goblin"||d.type==="imp"){ctx.beginPath();ctx.arc(0,2,21,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-17,-10);ctx.lineTo(-25,-28);ctx.lineTo(-5,-17);ctx.moveTo(17,-10);ctx.lineTo(25,-28);ctx.lineTo(5,-17);ctx.fill();ctx.stroke()}
   else if(d.type==="zombie"){ctx.fillRect(-18,-18,36,40);ctx.fillStyle="#b6c0a2";ctx.fillRect(-11,-9,6,6);ctx.fillRect(5,-9,6,6)}
   else if(d.type==="orc"){ctx.beginPath();ctx.moveTo(0,-25);ctx.lineTo(21,-10);ctx.lineTo(17,21);ctx.lineTo(-17,21);ctx.lineTo(-21,-10);ctx.closePath();ctx.fill();ctx.fillStyle="#e6d7bd";ctx.fillRect(-15,5,8,12);ctx.fillRect(7,5,8,12)}
   else if(d.type==="ballista"){ctx.fillRect(-25,-5,50,10);ctx.fillRect(-5,-20,10,40);ctx.strokeStyle="#e0b36c";ctx.beginPath();ctx.moveTo(-22,-15);ctx.lineTo(22,15);ctx.moveTo(-22,15);ctx.lineTo(22,-15);ctx.stroke()}
   else if(d.type==="arcane"){ctx.beginPath();ctx.arc(0,0,23,0,Math.PI*2);ctx.fill();ctx.fillStyle="#d8a6ff";ctx.beginPath();ctx.arc(0,0,9,0,Math.PI*2);ctx.fill();ctx.stroke()}
   else if(d.type==="wraith"){ctx.beginPath();ctx.moveTo(-22,20);ctx.quadraticCurveTo(-8,-28,0,-20);ctx.quadraticCurveTo(10,-28,22,20);ctx.lineTo(10,12);ctx.lineTo(0,22);ctx.lineTo(-10,12);ctx.closePath();ctx.fill();ctx.stroke()}
   else if(d.type==="frostSpider"){ctx.beginPath();ctx.arc(0,0,14,0,Math.PI*2);ctx.fill();for(let i=0;i<8;i++){let q=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(q)*8,Math.sin(q)*8);ctx.lineTo(Math.cos(q)*28,Math.sin(q)*28);ctx.stroke()}}
   else if(d.type==="necromancer"){ctx.fillRect(-16,-18,32,38);ctx.beginPath();ctx.arc(0,-20,16,Math.PI,0);ctx.fill();ctx.fillStyle="#f0d9ff";ctx.fillRect(-9,-5,5,5);ctx.fillRect(4,-5,5,5)}
   ctx.lineWidth=1;
   if(d.hp<d.maxHp){ctx.fillStyle="#080a0d";ctx.fillRect(-27,-34,54,6);ctx.fillStyle="#79b56a";ctx.fillRect(-27,-34,54*Math.max(0,d.hp/d.maxHp),6)}
  }ctx.restore();
 }
 for(let p of state.projectiles){let q=p.t||0,x=(p.x+(p.tx-p.x)*q)*C+40,y=(p.y+(p.ty-p.y)*q)*C+40;ctx.fillStyle="#e7eef5";ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill()}
 if(state.hero&&state.phase==="combat"){let h=state.hero,cx=h.x*C+40,cy=h.y*C+40;ctx.fillStyle="#c45b5b";ctx.strokeStyle="#f0b1b1";ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,21,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle="#f2d7b0";ctx.fillRect(cx-12,cy-15,24,12);ctx.fillStyle="#242932";ctx.fillRect(cx-16,cy-3,32,18);ctx.fillStyle="#111";ctx.fillRect(cx-32,cy-36,64,6);ctx.fillStyle="#79b56a";ctx.fillRect(cx-32,cy-36,64*Math.max(0,h.hp/h.maxHp),6);if(h.slow>0){ctx.strokeStyle="#7ec8e8";ctx.beginPath();ctx.arc(cx,cy,27,0,Math.PI*2);ctx.stroke();label("SLOWED",cx,cy+39)}}
}function render(){ $("level").textContent=state.level;$("attempts").textContent=state.attempts;$("gold").textContent=Math.floor(state.gold);$("defenseCount").textContent=state.defenses.filter(d=>d.hp>0).length;let h=state.hero||heroStats();$("heroHp").textContent=Math.round(h.maxHp);$("heroAtk").textContent=Math.round(h.atk);$("heroArmor").textContent=Math.round(h.armor);$("objective").textContent=(state.phase==="build"?"Build a route to the server, then start the invasion.":"Defend the server before the hero reaches it.")+" Hero is currently equipped with: "+gearTierName(state.level)+".";if(state.phase==="lost")$("objective").textContent="RUN LOST. Reset to begin again.";if(state.phase==="won")$("objective").textContent="THE HUMAN GAVE UP. ENDURANCE COMPLETE."; $("start").disabled=state.phase!=="build";$("history").innerHTML=state.history.map(x=>"<div>"+x+"</div>").join("")||"No completed invasions.";renderTools();renderUpgrades();draw()}
load();render();log("System online. Human threat detected.");speech('"Welcome to my dungeon."');