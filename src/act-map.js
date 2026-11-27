// The graph is persisted in each run. The seed is only used for new maps.
const ActMap = (() => {
  const act = {
    title: 'Verdant Remnants', floors: 13, lanes: 4, branchChance: 0.55,
    restFloor: 12, treasureFloor: 7, oathShrineFloor: 3,
    art: {
      ...ACT01_ART,
      icons: {
        ...ACT01_ART.icons,
        combat: 'symbols/combat.svg',
        elite: 'symbols/elite.svg',
        boss: 'symbols/boss.svg',
        rest: 'symbols/rest.svg',
        merchant: 'symbols/merchant.svg',
        shrine: 'symbols/shrine.svg',
        treasure: 'symbols/treasure.svg',
        unknown: 'symbols/unknown.svg'
      }
    }, root: 'assets/maps/act01/',
    encounters: {
      fight: ['combat', 'Common enemy', 'Defeat a group of enemies to earn a reward.'],
      elite: ['elite', 'Elite', 'Face an elite enemy for a chance to claim a relic.'],
      rest: ['rest', 'Rest site', 'Recover health or upgrade a card.'],
      shop: ['merchant', 'Merchant', 'Spend gold on cards, a relic or card removal.'],
      event: ['unknown', 'Unknown', 'Discover what waits along this route.'],
      shrine: ['shrine', 'Divine shrine', 'Visit the altars and choose a rite.'],
      chest: ['treasure', 'Treasure', 'Open the treasure on this floor.'],
      boss: ['boss', 'Boss', 'Confront the Hollow King.']
    }
  };
  function seeded(seed) {
    let state = seed >>> 0;
    return () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }
  // Each consecutive room multiplies its base weight again. Combat is the backbone
  // of a run, so it tolerates repeats more readily than service rooms.
  const repeatFactor = {fight: .82, event: .52, elite: .48, rest: .076, shop: .45, shrine: .5};
  const spacedCampFactor = .215;
  const eliteCampFactor = 2;
  const early = {fight: 68, event: 20, shop: 12};
  const late = {fight: 44, event: 16, elite: 13, rest: 12, shop: 15};
  const swornPool = {...late, fight: 34, shrine: 10};
  function encounter(floor, hero, incoming, random) {
    if (floor === 1) return 'fight';
    if (floor === act.restFloor) return 'rest';
    if (floor === act.treasureFloor) return 'chest';
    if (hero === 'oath' && floor === act.oathShrineFloor) return 'shrine';
    const pool = floor < 5 ? early : hero === 'oath' ? swornPool : late;
    const choices = Object.entries(pool).map(([type, base]) => {
      const adjacentCamp = type === 'rest' && floor + 1 === act.restFloor ? 1 : 0;
      const streak = (incoming[type] || 0) + adjacentCamp;
      let weight = base * repeatFactor[type] ** streak;
      if (type === 'rest') {
        if (incoming.campAcrossRoom || floor + 2 === act.restFloor) weight *= spacedCampFactor;
        if (incoming.elite) weight *= eliteCampFactor;
      }
      if (type === 'elite' && (incoming.rest || floor + 1 === act.restFloor)) weight *= eliteCampFactor;
      return [type, weight];
    });
    let roll = random() * choices.reduce((sum, [,weight]) => sum + weight, 0);
    for (const [type, weight] of choices) {
      roll -= weight;
      if (roll < 0) return type;
    }
    return choices[choices.length - 1][0];
  }
  function generate(hero, seed) {
    const random = seeded(seed);
    const map = Array.from({length: act.floors - 1}, (_, f) =>
      Array.from({length: act.lanes}, () => ({
        next: [],
        jx: Math.floor(random() * 17) - 8, jy: Math.floor(random() * 13) - 6
      })));
    map.forEach((row, f) => row.forEach((node, lane) => {
      if (f === map.length - 1) { node.next = [0]; return; }
      node.next = [lane];
      if (random() >= act.branchChance) return;
      const other = lane + (random() < .5 ? -1 : 1);
      if (row[other] && !row[other].next.includes(lane)) node.next.push(other);
    }));
    let histories = map[0].map(() => ({}));
    map.forEach((row, f) => {
      const following = (map[f + 1] || []).map(() => ({}));
      row.forEach((node, lane) => {
        const incoming = histories[lane];
        node.t = encounter(f + 1, hero, incoming, random);
        const length = (incoming[node.t] || 0) + 1;
        // At a merge, protect even the route with the longest matching streak.
        if (following.length) for (const dest of node.next) {
          const history = following[dest];
          if (node.t !== 'rest' && incoming.rest) history.campAcrossRoom = true;
          history[node.t] = Math.max(history[node.t] || 0, length);
        }
      });
      histories = following;
    });
    map.push([{t: 'boss', next: [], jx: 0, jy: 0}]);
    return map;
  }
  function available(run) {
    if (!run.pos) return run.map[0].map((_, l) => [0,l]);
    const {f,l} = run.pos;
    return run.map[f][l].next.map(i => [f+1,i]);
  }
  const url = (group, key) => act.root + act.art[group][key];
  function image(group, key, x,y,w,h, cls='') {
    return `<image aria-hidden="true" class="${cls}" href="${url(group,key)}" x="${x}" y="${y}" width="${w}" height="${h}"/>`;
  }
  function render(run, selected) {
    const height = run.map.length * 64 + 28;
    const point = (f,l) => run.map[f].length === 1 ? [180,42] :
      [60+l*80+run.map[f][l].jx,height-40-f*64+run.map[f][l].jy];
    const options = new Set(available(run).map(p=>p.join()));
    if (!options.has(selected)) selected = null;
    const visited = new Set(run.path.map(p=>p.join()));
    const steps = new Set(run.path.slice(1).map((p,i)=>run.path[i].join()+'>'+p.join()));
    const nodes = [], paths = [];
    for (const [f,row] of run.map.entries()) for (const [l,node] of row.entries()) {
      const key = [f,l].join(), [x,y] = point(f,l);
      for (const dest of node.next) {
        const [xx,yy] = point(f+1,dest);
        const destination = [f+1,dest].join();
        let state = steps.has(key+'>'+destination) ? 'on' : '';
        if (run.pos?.f === f && run.pos.l === l) {
          state = destination === selected ? 'preview-path' : 'open';
        }
        paths.push(`<line class="${state}" x1="${x}" y1="${y}" x2="${xx}" y2="${yy}"/>`);
      }
      const can = options.has(key), danger = ['boss','elite'].includes(node.t);
      const state = selected===key ? 'selected' : visited.has(key) ? 'completed' : can ? 'available' : 'locked';
      const size = node.t==='boss' ? 62 : 46;
      const [icon,label] = act.encounters[node.t];
      const frame = (name,cls) => image('frames',name,-size/2,-size/2,size,size,cls);
      nodes.push(`<g class="node ${can?'can':''} ${state}" transform="translate(${x} ${y})"
        role="${can?'button':'img'}" aria-label="Floor ${f+1}, ${label}, ${state}"
        ${can?`tabindex="0" data-a="previewNode" data-v="${key}" aria-pressed="${selected===key}"`:''}>
        <title>Floor ${f+1} · ${label} · ${state}</title>
        ${can?image('vfx','node_aura',-30,-30,60,60,'aura'):''}
        <circle class="token" r="${size*.39}"/><text class="fallback" text-anchor="middle" y="4">${label.slice(0,2)}</text>
        ${image('icons',icon,-size*.31,-size*.31,size*.62,size*.62,'token-art')}
        ${danger?frame('dangerous','danger'):''}${frame(state,'ring')}${can?frame('hovered','hover-ring'):''}
        <circle class="hit" r="${size/2}"/></g>`);
    }
    const selection = selected ? selected.split(',').map(Number) : null;
    const marker = run.pos ? point(run.pos.f,run.pos.l) : [180,height-8];
    const target = selection ? point(...selection) : marker;
    if (selection && !run.pos) {
      paths.push(`<line class="preview-path" x1="${marker[0]}" y1="${marker[1]}" x2="${target[0]}" y2="${target[1]}"/>`);
    }
    const traveller = image('vfx','journey_base',-12,-10,24,20);
    const detail = selection && act.encounters[run.map[selection[0]][selection[1]].t];
    const legend = Object.values(act.encounters).filter(([icon])=>icon!=='shrine'||run.hero==='oath')
      .map(([icon,label])=>`<span><img src="${url('icons',icon)}" alt="">${label}</span>`).join('');
    return `<section class="mapv"><header class="maphead" style="background-image:url(${url('hud','title')})"><small>Act I</small><h2>${act.title}</h2></header>
      <details class="map-key"><summary>Encounter legend</summary><div class="legend">${legend}</div></details>
      <svg class="map" aria-label="Act I routes" viewBox="0 0 360 ${height}" style="background-image:linear-gradient(#10161266,#10161280),url(${url('backgrounds','verdant_remnants')})">
      ${image('vfx','mountain_mist',0,0,360,90,'mist')}${paths.join('')}${nodes.join('')}
      <g class="journey-marker" aria-hidden="true" transform="translate(${marker.join(' ')})">${traveller}
      <animateTransform attributeName="transform" type="translate" from="${marker.join(' ')}" to="${target.join(' ')}" begin="indefinite" dur=".32s" fill="freeze"/></g></svg>
      <aside class="route-preview" aria-live="polite">${detail?`<div><strong>Floor ${selection[0]+1} · ${detail[1]}</strong><p>${detail[2]}</p></div><button class="btn pri" data-a="travel" style="background-image:url(${url('hud','confirm')})">Enter room</button>`:
      (options.size?'<div><strong>Choose your path</strong><p>Select a gold-ringed room to preview it.</p></div>':'<div><strong>Act I route complete</strong></div>')}</aside></section>`;
  }
  return {act,generate,available,render};
})();
document.addEventListener('error', event => {
  if (event.target.classList?.contains('token-art')) event.target.parentNode.classList.add('art-missing');
}, true);
