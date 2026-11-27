/* Shared by gameplay, Map Lab and Node QA. Paths live only in this registry. */
(function(root){
 const asset=(source,width,height,extra={})=>({source,width,height,atlas:null,anchor:[.5,.5],scale:1,fallback:'runtime-vector',animation:null,...extra});
 const assets={
  backgrounds:{verdant:asset('assets/bg_ruins.webp',1672,941,{fallback:'linear-gradient(#192b28,#0b1118)',role:'existing environment fallback; requested source unavailable'}),gate:asset('assets/bg_gate.webp',1672,941)},
  parallax:{},icons:Object.fromEntries(['fight','elite','event','rest','shop','shrine','chest','boss'].map(t=>[t,asset(null,40,40)])),
  frames:Object.fromEntries(['locked','available','hovered','selected','completed'].map(t=>[t,asset(null,48,48)])),
  danger:asset(null,48,48),boss:asset(null,64,64),paths:{worn:asset(null,null,null),lit:asset(null,null,null)},
  effects:{mist:asset(null,null,null,{animation:{duration:18000,opacity:.08}}),motes:asset(null,null,null,{animation:{duration:12000,opacity:.2}})},
  hud:{header:asset(null,null,null),preview:asset(null,null,null),confirm:asset(null,null,null)},
  dependencies:['misty_sanctuary_among_ruins.png','dark_fantasy_encounter_icon_set.png','a_clean_graphic_design_sprite_sheet_on_a_transpare.png','a_high_resolution_png_style_spritesheet_asset_shee.png','a_clean_png_asset_sheet_on_a_transparent_checkerbo.png']
 };
 const regions={
  verdant:{id:'verdant',name:'Verdant Remnants',background:'verdant',palette:{gold:'#d6b875',jade:'#89b7a2',danger:'#da897c'},effects:['mist','motes'],music:null,transition:'journey',bossArt:'boss',enemyPools:{early:'EASY',late:'HARD',elite:'ELITE',boss:['king']},generation:{floors:13,minNodes:3,maxNodes:4,branching:.55,eliteMinFloor:4,weights:{fight:44,event:16,elite:13,rest:12,shop:15}}},
  twilight:{id:'twilight',name:'Twilight Study',background:'gate',palette:{gold:'#c4b9e1',jade:'#90bcbc',danger:'#da897c'},effects:['motes'],music:null,transition:'journey',bossArt:'boss',enemyPools:{early:'EASY',late:'HARD',elite:'ELITE',boss:['king']},generation:{floors:13,minNodes:2,maxNodes:4,branching:.35,eliteMinFloor:4,weights:{fight:50,event:20,elite:10,rest:10,shop:10}}}
 };
const NS='stroke="#efe4d2" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"';
const vectors={fight:`<path ${NS} d="M-6 6L7-7M3-7h4v4M-7 0l7 7"/>`,
elite:`<path d="M0-9C7-9 9-3 8 2L5 8H-5L-8 2C-9-3-7-9 0-9Z" fill="#efe4d2"/><circle cx="-3.2" cy="0" r="2.2" fill="#17100e"/><circle cx="3.2" cy="0" r="2.2" fill="#17100e"/>`,
rest:`<path d="M0-10C7-3 7 3 3 7C1 9-1 9-3 7C-7 3-7-3 0-10Z" fill="#ff5a36"/><path d="M0-2C3 1 3 4 1 6C0 7 0 7-1 6C-3 4-3 1 0-2Z" fill="#e8c86a"/>`,
shop:`<circle r="7.5" ${NS}/><path ${NS} d="M2.5-3.5H-1a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-3.5M0-6v1.5M0 5v1.5"/>`,
event:`<text y="6.5" text-anchor="middle" font-family="Cinzel,serif" font-weight="800" font-size="18" fill="#efe4d2">?</text>`,
chest:`<rect x="-8" y="-5" width="16" height="11" rx="2" ${NS}/><path ${NS} d="M-8 0h16M0-1v3"/>`,
boss:`<path d="M-10 6V-4L-5 1L0-8L5 1L10-4V6Z" fill="#e8c86a"/>`,
shrine:`<path d="M0-10L2.4-2.4L10 0L2.4 2.4L0 10L-2.4 2.4L-10 0L-2.4-2.4Z" fill="#e8c86a"/><circle r="2.6" fill="#17100e"/>`};

 const api={assets,regions,vectors};if(typeof module==='object')module.exports=api;else root.MapAssets=api;
})(globalThis);
