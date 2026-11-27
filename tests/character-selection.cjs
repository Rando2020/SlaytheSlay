const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const source=html.match(/function pickV\(\)\{[\s\S]*?(?=function titleV)/)[0];
const ctx={START_GOLD:99,HEROES:{oath:{n:'Oath',s:'Oath',hp:80,relic:'vow',b:'Swear or stay Unsworn.'},aether:{n:'Aether',s:'Aether',hp:70,relic:'heart',b:'Strength and poison.'}},RELICS:{vow:{n:'Vow',d:'Block'},heart:{n:'Heart',d:'Heal'}},GODS:{},PSET:{oath:{idle:'oath.webp'},aether:{idle:'aether.webp'}},selectedHero:'oath'};
vm.createContext(ctx);vm.runInContext(source,ctx);
const view=vm.runInContext('pickV()',ctx);
assert.match(view,/data-a="begin"/,'selection requires explicit confirmation');
assert.match(view,/data-a="startdeck"/,'starting deck is inspectable');
assert.match(view,/aria-pressed="true"/,'selected portrait is exposed accessibly');
assert.match(view,/bg_oath_select.webp/,'approved Oathbound scene is shown');
console.log('Selection rendering checks passed');

ctx.selectedHero='aether';
const aether=vm.runInContext('pickV()',ctx);
assert.match(aether,/70 starting HP/);
assert.match(aether,/aether.webp/);
assert.doesNotMatch(aether,/bg_oath_select.webp/);
assert.match(aether,/Duelist . unavailable/);
// A preview must isolate combat-dependent card descriptions and preserve card IDs,
// including when the inspector throws while rendering.
const run={hero:'oath'},combat={turn:5};
ctx.uid=42;ctx.G=run;ctx.C=combat;
ctx.HEROES.aether.deck=()=>{ctx.uid++;return [{id:'strike'}]};
ctx.$=()=>({focus(){}});ctx.document={activeElement:null};ctx.MD={};
ctx.openPick=(title,cards)=>{assert.equal(ctx.G.hero,'aether');assert.notEqual(ctx.G,run);assert.equal(ctx.C,null);assert.equal(cards[0].id,'strike');};
vm.runInContext('inspectStartingDeck()',ctx);
assert.equal(ctx.uid,42);assert.equal(ctx.G,run);assert.equal(ctx.C,combat);
ctx.openPick=()=>{throw Error('render failure')};
assert.throws(()=>vm.runInContext('inspectStartingDeck()',ctx),/render failure/);
assert.equal(ctx.uid,42);assert.equal(ctx.G,run);assert.equal(ctx.C,combat);
new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
console.log('Dynamic class data, preview state restoration, and full game syntax passed');

const app={inert:false},close={focus(){ctx.focused='close'}},trigger={focus(){ctx.focused='trigger'}};
ctx.$=q=>q==='#app'?app:close;ctx.document={activeElement:trigger};
ctx.openPick=()=>{ctx.MD={}};
vm.runInContext('inspectStartingDeck()',ctx);
assert.equal(app.inert,true,'starting deck dialog must disable underlying Begin Ascent');
assert.equal(ctx.focused,'close');ctx.MD.onClose();
assert.equal(app.inert,false);assert.equal(ctx.focused,'trigger');
