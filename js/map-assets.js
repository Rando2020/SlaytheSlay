/* Shared by gameplay, Map Lab and Node QA. Paths live only in this registry. */
(function(root){
 const asset=(source,width,height,extra={})=>({source,width,height,atlas:null,anchor:[.5,.5],scale:1,fallback:'runtime-vector',animation:null,...extra});
 const assets={
  backgrounds:{verdant:asset('assets/bg_ruins.webp',null,null,{fallback:'linear-gradient(#192b28,#0b1118)',role:'existing environment fallback; requested source unavailable'}),gate:asset('assets/bg_gate.webp',null,null)},
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
 const api={assets,regions};if(typeof module==='object')module.exports=api;else root.MapAssets=api;
})(globalThis);
