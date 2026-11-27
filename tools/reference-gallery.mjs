const labels = {
  dedicated:'Dedicated art', shared:'Shared type icon', text:'Text placeholder',
  none:'No artwork', missing:'Missing or unreadable file', checking:'Checking file'
};

function catalog(game) {
  const entries = [];
  const probe = document.createElement('div');
  function add(category, id, name, description, detail, markup) {
    probe.innerHTML = markup ?? '';
    const path = probe.querySelector('img')?.getAttribute('src') ?? '';
    const art = path ? 'checking' : probe.querySelector('svg') ? 'shared' : probe.textContent.trim() ? 'text' : 'none';
    entries.push({category, id, name, description, detail, markup, path, art});
  }
  function card(c, hero, id) {
    const k = game.definition(c);
    const god = c.g || k.g;
    const meta = [game.types[k.t], hero, god && game.gods[god].n, c.tier && 'Tier ' + c.tier];
    const energy = game.cost(c);
    meta.push(energy < 0 ? 'Unplayable' : energy + ' energy');
    let description = k.d(0,c);
    if (!c.tier && !k.m && k.r >= 0) {
      const up = {...c, up:1};
      const upgraded = k.d(1,up);
      if (upgraded !== description || game.cost(up) !== energy)
        description += '<br><strong>Upgraded</strong> · ' + game.cost(up) + ' energy · ' + upgraded;
    }
    add('Cards', id, k.n, description, meta.filter(Boolean).join(' · '),
      game.cardArt(c, hero === 'Oathbound' ? 'oath' : 'aether'));
  }
  for (const [id, k] of Object.entries(game.cards)) {
    const hero = k.h === 'oath' ? 'Oathbound' : ['status','curse'].includes(k.t) ? '' : 'Aetherwright';
    card({id,up:0}, hero, id);
    if (id === 'strike') card({id,up:0}, 'Oathbound', id + '/oath');
  }
  for (const [id, gods] of Object.entries(game.forms))
    for (const [g, forms] of Object.entries(gods))
      forms.forEach((_, i) => card({id,g,tier:i+1,up:0}, 'Oathbound', [id,g,i+1].join('/')));
  for (const [id,r] of Object.entries(game.relics))
    add('Relics', id, r.n, r.d, r.h === 'oath' ? 'Oathbound' : '', game.relicIcon(id));
  for (const [id,[name,,description]] of Object.entries(game.statuses))
    add('Statuses', id, name, description, '', game.statusArt[id] ? game.hudIcon('status-'+game.statusArt[id],48) : name);
  for (const [id,g] of Object.entries(game.gods)) {
    add('Oaths', id, g.oath, g.law + ' ' + g.price, g.full, game.hudIcon('oath-'+game.oathArt[id],48));
    add('Sanctums', id, g.sanc, 'Holds cards sanctified to ' + g.n + '.', g.full,
      '<img alt="" src="assets/ui/sanctums/'+id+'.png">');
  }
  return entries;
}

export async function mountGallery(root, game) {
  const entries = catalog(game);
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = './tools/reference-gallery.css';
  document.head.append(css);
  root.innerHTML = `<main id="gallery"><nav><a href="./index.html">← Title screen</a></nav>
    <h1>Reference gallery</h1><form role="search">
    <label>Search<input type="search" placeholder="Name, effect, god or ID"></label>
    <label>Collection<select name="collection"><option value="">All collections</option></select></label>
    <label>Artwork<select name="art"><option value="">All artwork</option><option value="needed">Needs dedicated art</option></select></label>
    </form><p class="count" role="status"></p><div class="entries"></div></main>`;
  const form = root.querySelector('form');
  form.onsubmit = event => event.preventDefault();
  for (const group of new Set(entries.map(e => e.category))) form.collection.add(new Option(group,group));
  for (const [key,label] of Object.entries(labels)) if (key !== 'checking') form.art.add(new Option(label,key));
  const query = form.querySelector('input');
  function draw() {
    const term = query.value.trim().toLowerCase();
    const visible = entries.filter(e => (!form.collection.value || e.category === form.collection.value)
      && (!form.art.value || (form.art.value === 'needed' ? !['checking','dedicated'].includes(e.art) : e.art === form.art.value))
      && [e.name,e.id,e.detail,e.description].some(value => value.toLowerCase().includes(term)));
    const tiles = visible.map(e => {
      const tile = document.createElement('article');
      tile.dataset.art = e.art;
      tile.dataset.id = e.id;
      tile.innerHTML = `<div class="artwell">${e.art === 'missing' ? 'Missing file' : e.markup || 'No artwork'}</div>
        <div class="meta">${e.category} · ${labels[e.art]}</div><h2>${e.name}</h2>
        <small>${e.detail}</small><p>${e.description}</p><code>${e.id}</code>`;
      if (e.path) {
        const file = document.createElement('small');
        file.className = 'path';
        file.textContent = e.path;
        tile.append(file);
      }
      return tile;
    });
    root.querySelector('.entries').replaceChildren(...tiles);
    const needs = entries.filter(e => !['checking','dedicated'].includes(e.art)).length;
    root.querySelector('.count').textContent = visible.length + ' of ' + entries.length + ' entries · ' + needs + ' need dedicated art';
  }
  form.addEventListener('input',draw);
  draw();
  const paths = [...new Set(entries.map(e => e.path).filter(Boolean))];
  const results = new Map(await Promise.all(paths.map(path => new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve([path,'dedicated']);
    img.onerror = () => resolve([path,'missing']);
    img.src = path;
  }))));
  for (const entry of entries) if (entry.path) entry.art = results.get(entry.path);
  draw();
  root.querySelector('#gallery').dataset.ready = 'true';
}
