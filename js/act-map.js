(function(root){
'use strict';
const registry=typeof module==='object'?require('./map-assets.js'):root.MapAssets;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TYPES={fight:['Fight','Face an enemy. Earn gold and a card choice.','⚔'],elite:['Elite','A dangerous battle with greater rewards.','♜'],event:['Unknown','An unknown encounter. Discover what awaits when you arrive.','?'],rest:['Rest site','Recover health or upgrade a card.','♨'],shop:['Merchant','Spend gold on cards, relics or removal.','⚖'],shrine:['Divine shrine','Consider an oath or strengthen divine cards.','◇'],chest:['Treasure','Open a reliquary.','▣'],boss:['Boss','Confront the Hollow King.','♛']};
function describe(t){const a=TYPES[t]||TYPES.event;return {name:a[0],detail:a[1],symbol:a[2]};}
function random(seed){let s=2166136261;for(const c of String(seed))s=Math.imul(s^c.charCodeAt(0),16777619);return()=>{s+=0x6D2B79F5;let t=Math.imul(s^s>>>15,1|s);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
function generate(hero,seed,options={}){
 const c={...registry.regions.verdant.generation,...options};
 if(!Number.isInteger(c.floors)||c.floors<8||c.floors>40||!Number.isInteger(c.minNodes)||!Number.isInteger(c.maxNodes)||c.minNodes<2||c.maxNodes>6||c.maxNodes<c.minNodes||!(c.branching>=0&&c.branching<=1))throw Error('Invalid map configuration');
 const weights=Object.entries(c.weights);if(!weights.length||weights.some(([t,w])=>!['fight','event','elite','rest','shop'].includes(t)||!Number.isFinite(w)||w<0)||!weights.some(([,w])=>w>0))throw Error('Invalid encounter distribution');
 const r=random(seed),m=[];
 for(let f=0;f<c.floors;f++){
  const count=f===c.floors-1?1:c.minNodes+Math.floor(r()*(c.maxNodes-c.minNodes+1));
  m.push(Array.from({length:count},(_,l)=>{
   let t='fight';
   if(f===c.floors-1)t='boss';else if(f===c.floors-2)t='rest';else if(f===(c.treasureFloor??6))t='chest';else if(hero==='oath'&&f===(c.shrineFloor??2))t='shrine';else if((c.merchantFloors||[]).includes(f))t='shop';else if((c.restFloors||[]).includes(f))t='rest';else if(f>0){
    const eligible=(f<4?Object.entries(c.earlyWeights||{fight:68,event:20,shop:12}):weights).filter(([k])=>k!=='elite'||f>=c.eliteMinFloor);const total=eligible.reduce((a,[,w])=>a+w,0);let n=r()*total;
    for(const [k,w] of eligible){n-=w;if(n<0){t=k;break;}}
   }
   return {t,next:[],jx:Math.floor(r()*9)-4,jy:Math.floor(r()*7)-3};
  }));
 }
 // Monotone edge cover: every source and destination participates, no crossings.
 for(let f=0;f<m.length-1;f++){
  const a=m[f],b=m[f+1];let i=0,j=0;a[0].next.push(0);
  while(i<a.length-1||j<b.length-1){
   if(i===a.length-1)j++;else if(j===b.length-1)i++;
   else if(r()<c.branching){if((i+1)/a.length<(j+1)/b.length)i++;else j++;}
   else {i++;j++;}
   a[i].next.push(j);
  }
  // Avoid consecutive elites or service repeats on any incoming route.
  for(let l=0;l<b.length;l++)if(f+1!==m.length-2){const parents=a.filter(n=>n.next.includes(l));if(['elite','shop','rest'].includes(b[l].t)&&parents.some(n=>n.t===b[l].t))b[l].t='fight';}
 }
 const errors=validate(m,hero,c);if(errors.length)throw Error(errors.join('; '));return m;
}
function validate(m,hero,options={}){
 const c={...registry.regions.verdant.generation,...options},errors=[];
 if(!Array.isArray(m)||m.length<2)return ['Missing graph'];
 let reach=new Set(m[0].map((_,l)=>l));
 m.forEach((row,f)=>{if(!row.length)errors.push('Empty floor '+f);const incoming=new Set();
  row.forEach((n,l)=>{if(!reach.has(l))errors.push('Unreachable '+f+','+l);if(!TYPES[n.t])errors.push('Unsupported encounter');if(n.t==='shrine'&&hero!=='oath')errors.push('Shrine prerequisite');if(n.t==='elite'&&f<c.eliteMinFloor)errors.push('Early elite');
   if(f===m.length-1){if(n.t!=='boss'||row.length!==1||n.next.length)errors.push('Invalid boss');return;}
   if(!n.next.length||new Set(n.next).size!==n.next.length)errors.push('Dead end or duplicate');
   n.next.forEach(k=>{if(!Number.isInteger(k)||!m[f+1]?.[k]){errors.push('Invalid edge');return;}incoming.add(k);if(['elite','shop','rest'].includes(n.t)&&m[f+1][k].t===n.t&&f+1!==m.length-2)errors.push('Repeated service or elite');});
   for(let p=l+1;p<row.length;p++)if(n.next.some(k=>row[p].next.some(q=>q<k)))errors.push('Crossed paths');
  });reach=incoming;
 });return [...new Set(errors)];
}
function available(g){if(!g.pos)return g.map[0].map((_,l)=>[0,l]);const {f,l}=g.pos;return (g.map[f]?.[l]?.next||[]).map(k=>[f+1,k]);}
function prepareTravel(g,f,l){if(g.travel||!available(g).some(p=>p[0]===f&&p[1]===l))return null;g.travel={id:(g.seed||'legacy')+':'+f+','+l,f,l,status:'pending'};return g.travel;}
function commitTravel(g){const t=g.travel;if(!t||t.status!=='pending')return false;if(!available(g).some(p=>p[0]===t.f&&p[1]===t.l))return false;g.pos={f:t.f,l:t.l};g.path.push([t.f,t.l]);g.floor=t.f+1;t.status='active';return true;}
function geometry(m){const width=420,height=(m.length-1)*106+140;return {width,height,xy:(f,l)=>[Math.round(width*(l+1)/(m[f].length+1))+(m[f][l].jx||0),height-65-f*106+(m[f][l].jy||0)]};}
function render(g,o={}){
 const region=registry.regions[o.region||g.region]||registry.regions.verdant,geo=geometry(g.map),av=new Set(available(g).map(p=>p.join(','))),visited=new Set((g.path||[]).map(p=>p.join(','))),selected=o.selected||'',icons=o.icons||registry.vectors;
 const traveled=new Set((g.path||[]).slice(1).map((p,i)=>g.path[i].join(',')+'>'+p.join(',')));let paths='',nodes='';
 g.map.forEach((row,f)=>row.forEach((n,l)=>{const k=f+','+l,[x,y]=geo.xy(f,l),d=describe(n.t),can=av.has(k)&&!g.travel,completed=visited.has(k),state=o.state&&o.state!=='auto'?o.state:completed?'completed':selected===k?'selected':can?'available':'locked';
  n.next.forEach(nl=>{const [xx,yy]=geo.xy(f+1,nl),on=traveled.has(k+'>'+(f+1)+','+nl),future=g.pos?.f===f&&g.pos?.l===l;
   paths+=`<path data-map-edge="${k+'>'+(f+1)+','+nl}" class="map-path ${on?'traveled':future?'reachable':'future'}" d="M ${x} ${y} L ${xx} ${yy}"/>`;});
  nodes+=`<button class="act-node ${state}${['elite','boss'].includes(n.t)?' dangerous':''}" style="left:${x/geo.width*100}%;top:${y}px" data-map-node="${k}" aria-disabled="${!can}" aria-pressed="${selected===k}" aria-label="Floor ${f+1}: ${esc(d.name)}, ${state}${['elite','boss'].includes(n.t)?', dangerous':''}" title="${esc(d.name)} · ${state}"><span class="node-frame"></span><svg class="encounter-icon" viewBox="-20 -20 40 40" aria-hidden="true">${icons[n.t]?`<g transform="scale(1.6)">${icons[n.t]}</g>`:`<text text-anchor="middle" y="7" fill="currentColor" font-size="24">${esc(d.symbol)}</text>`}</svg>${['elite','boss'].includes(n.t)?'<span class="danger-mark" aria-hidden="true">!</span>':''}${completed?'<span class="done-mark" aria-hidden="true">✓</span>':''}<span class="node-caption">${esc(({shrine:'Shrine',rest:'Rest',shop:'Shop'})[n.t]||d.name)}</span></button>`;
 }));
 let preview='Select a reachable encounter to inspect your route.',name='Choose your path';if(selected){const [f,l]=selected.split(',').map(Number),n=g.map[f]?.[l];if(n){const d=describe(n.t);name=d.name;preview=d.detail;}}
 const bg=registry.assets.backgrounds[region.background];const pos=g.pos?geo.xy(g.pos.f,g.pos.l):[geo.width/2,geo.height-14];
 return `<section class="act-map" style="--map-gold:${region.palette.gold};--map-jade:${region.palette.jade};--map-danger:${region.palette.danger}"><header class="act-header"><div><p class="act-kicker">Act I · ${g.floor||0} / ${g.map.length}</p><h1>${esc(region.name)}</h1><p>Trace a path through the remnants.</p></div><button class="btn sm" data-map-action="effects" aria-pressed="${o.effects!==false}">Atmosphere ${o.effects===false?'off':'on'}</button></header><div class="act-layout"><div class="map-scroll" tabindex="0" aria-label="Act route map. Scroll to explore; arrow keys navigate nodes."><div class="map-canvas" style="height:${geo.height}px;min-width:${Math.max(300,(Math.max(...g.map.map(r=>r.length))+1)*58)}px"><div class="map-environment" style="background-image:linear-gradient(#0a1518aa,#0b121ac4),url('${esc(bg.source)}')"></div><div class="map-parallax" aria-hidden="true"></div><svg class="map-connections" viewBox="0 0 ${geo.width} ${geo.height}" preserveAspectRatio="none" aria-hidden="true">${paths}</svg><div class="map-nodes">${nodes}</div><span class="journey-marker" aria-hidden="true" style="left:${pos[0]/geo.width*100}%;top:${pos[1]}px">◆</span>${o.effects!==false?`<div class="map-atmosphere ${region.effects.join(' ')}" aria-hidden="true"></div>`:''}</div></div><aside class="map-hud"><div class="encounter-preview" aria-live="polite"><p class="act-kicker">${g.travel?'Journey in progress':'Encounter preview'}</p><h2>${esc(name)}</h2><p>${esc(preview)}</p><button class="btn pri" data-map-action="travel" ${!av.has(selected)||g.travel?'disabled':''}>Confirm travel</button><p class="map-help">Select, then confirm. Arrow keys explore; Enter selects. Touch: drag to scroll.</p></div><details class="map-legend"><summary>Map legend</summary>${Object.entries(TYPES).filter(([t])=>t!=='shrine'||g.hero==='oath').map(([t,d])=>`<span>${esc(d[2])} ${d[0]}</span>`).join('')}<p>✓ Visited · ! Dangerous · dashed paths await discovery.</p></details></aside></div></section>`;
}
function bind(host,g,o={}){
 const sc=host.querySelector('.map-scroll');if(sc){if(o.scroll!=null)sc.scrollTop=o.scroll;else sc.scrollTop=sc.scrollHeight;}
 host.querySelectorAll('[data-map-node]').forEach(b=>{
  b.addEventListener('click',()=>{if(b.getAttribute('aria-disabled')!=='true')o.select?.(b.dataset.mapNode);});
  b.addEventListener('keydown',e=>{if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();let [f,l]=b.dataset.mapNode.split(',').map(Number);if(e.key==='ArrowUp')f++;if(e.key==='ArrowDown')f--;if(e.key==='ArrowRight')l++;if(e.key==='ArrowLeft')l--;f=Math.max(0,Math.min(g.map.length-1,f));l=Math.max(0,Math.min(g.map[f].length-1,l));host.querySelector(`[data-map-node="${f},${l}"]`)?.focus();});
 });
 host.querySelectorAll('[data-map-action]').forEach(b=>b.addEventListener('click',()=>o.action?.(b.dataset.mapAction)));
}
const api={generate,validate,available,prepareTravel,commitTravel,geometry,describe,render,bind,random,registry};if(typeof module==='object')module.exports=api;else root.ActMap=api;
})(globalThis);
