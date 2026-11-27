import {createPlaytester} from './combat-playtester.mjs';

export function mountLab({heroes, gods, enemies, encounters, start, snapshot, mechanics, legacyEnemyIds = {}}) {
  const params = new URLSearchParams(location.search);
  const panel = document.createElement('details');
  panel.id = 'combat-lab';
  panel.innerHTML = `<summary>Combat Lab</summary>
    <form method="get">
      <input type="hidden" name="dev" value="combat">
      <label>Hero<select name="hero"></select></label>
      <label>Oath<select name="oath"></select></label>
      <label>Encounter<select name="encounter"></select></label>
      <label>Floor<input name="floor" type="number" min="1" max="13" required></label>
      <button type="submit">Launch fresh encounter</button>
    </form>
    <button type="button" id="lab-report">Download state report</button>
    <a href="?gallery=1" target="_blank" rel="noopener">Reference gallery</a>
    <a href="./tests/combat-interactions.html" target="_blank" rel="noopener">Run interaction tests</a>
    <a href="./index.html">Exit to game</a>`;
  const style = document.createElement('style');
  style.textContent = `
    #combat-lab{position:fixed;bottom:8px;left:8px;z-index:10000;background:#201d22;color:#f1e8db;
      border:1px solid #a48556;border-radius:6px;font:14px/1.4 system-ui;padding:8px 12px;max-height:85vh;overflow:auto}
    #combat-lab summary{cursor:pointer;font-weight:bold}
    #combat-lab form{display:grid;gap:8px;margin:12px 0}
    #combat-lab label{display:grid;grid-template-columns:6em 1fr;align-items:center}
    #combat-lab select,#combat-lab input,#combat-lab button{font:inherit;padding:4px;max-width:58vw}
    #combat-lab a{color:#f3c887;display:block;margin-top:8px}`;
  document.head.append(style);
  document.body.append(panel);
  panel.addEventListener('keydown', event => event.stopPropagation());
  const fields = panel.querySelector('form').elements;
  function populate(select, entries, fallback) {
    for (const [value, label] of entries) select.add(new Option(label, value));
    const requested = params.get(select.name);
    select.value = entries.some(([value]) => value === requested) ? requested : fallback;
  }
  populate(fields.hero, Object.entries(heroes).map(([id, hero]) => [id, hero.n]), 'oath');
  populate(fields.oath, [['', 'Unsworn'], ...Object.entries(gods).map(([id, god]) => [id, god.n])], '');
  const setups = encounters.map(encounter => [
    encounter.keys.join(','), encounter.keys.map(key => enemies[key].n).join(' + ')
  ]);
  populate(fields.encounter, setups, setups[0][0]);
  const floor = Number(params.get('floor'));
  fields.floor.value = Number.isInteger(floor) && floor >= 1 && floor <= 13 ? floor : 1;
  const syncHero = () => { fields.oath.disabled = fields.hero.value !== 'oath'; };
  fields.hero.addEventListener('change', syncHero);
  syncHero();
  // Older share links used short enemy keys; translate them to current IDs.
  const requested = (params.get('encounter') || '').split(',').map(key => legacyEnemyIds[key] || key).join(',');
  const encounter = encounters.find(item => item.keys.join(',') === requested);
  panel.open = !encounter;
  if (encounter) start(fields.hero.value, fields.oath.disabled ? '' : fields.oath.value, Number(fields.floor.value), encounter);
  const tester = createPlaytester(snapshot, mechanics);
  window.hollowLab = tester;
  panel.querySelector('#lab-report').onclick = () => {
    const report = new Blob([JSON.stringify({...snapshot(), actions:tester.history()}, null, 2)], {type:'application/json'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(report);
    link.download = 'hollow-ascent-combat-state.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };
}
