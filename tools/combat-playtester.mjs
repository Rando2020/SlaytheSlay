/** Browser automation interface for opted-in Combat Lab sessions. */
export function createPlaytester(snapshot, mechanics) {
  let serial = 0;
  let previous = '';
  let pending = false;
  const trace = [];

  function inspect() {
    const {screen, run, combat} = snapshot();
    const dialog = document.querySelector('#modal [role=dialog]');
    const actions = [];
    const hand = combat?.hand.map(card => ({
      ...mechanics.cardInfo(card), tier:card.tier ?? 0, god:card.g ?? null
    })) ?? [];
    const enemies = combat?.foes.map(e => ({
      index:e.i, id:e.k, hp:e.hp, maxHp:e.max, block:e.block, intent:e.int, statuses:e.st
    })) ?? [];
    if (dialog || screen === 'reward') {
      const root = dialog ?? document.querySelector('#app');
      const allowed = dialog ? ['mpick','mask','mclose'] : ['rcard','rrelic','rasc','map'];
      for (const button of root.querySelectorAll('[data-a]:not(:disabled)')) {
        const {a, v} = button.dataset;
        if (allowed.includes(a)) actions.push({type:'choose', action:a, value:v ?? '', label:button.textContent.trim()});
      }
    } else if (screen === 'combat' && !combat.busy && !combat.lock) {
      for (const card of hand.filter(c => c.playable)) {
        const targets = card.targeted ? enemies.filter(e => e.hp > 0).map(e => e.index) : [null];
        for (const target of targets) actions.push({type:'play', uid:card.uid, target});
      }
      actions.push({type:'endTurn'}, {type:'choose', action:'deck', label:'Inspect deck'});
    }
    const state = structuredClone({
      screen, hero:run?.hero, oaths:run?.oaths, turn:combat?.turn ?? null, hp:run?.hp, block:combat?.p.block,
      energy:combat?.energy, statuses:combat?.p.st, hand, enemies, actions,
      dialog:dialog?.getAttribute('aria-label') ?? null,
      busy:Boolean(combat?.busy || combat?.lock), deck:run?.deck, relics:run?.relics,
      sanctums:combat?.sanc, discard:combat?.disc, exhausted:combat?.exh, drawCount:combat?.draw.length
    });
    const signature = JSON.stringify(state);
    if (signature !== previous) { serial++; previous = signature; }
    return {...state, revision:serial};
  }

  async function act(revision, index) {
    const before = inspect();
    if (pending) throw Error('Another action is resolving');
    if (revision !== before.revision) throw Error('State changed. Inspect again.');
    const action = before.actions[index];
    if (!Number.isInteger(index) || !action) throw Error('Choose an available action index');
    pending = true;
    try {
      let result;
      if (action.type === 'play') result = mechanics.playCard(action.uid, action.target);
      else if (action.type === 'endTurn') result = mechanics.endTurn();
      else result = mechanics.choose(action.action, action.value);
      // A card may wait on a choice. Yield at that decision so the caller can answer it.
      let failure;
      Promise.resolve(result).catch(error => { failure = error; });
      const deadline = performance.now() + 15000;
      let after;
      do {
        await new Promise(resolve => setTimeout(resolve, 20));
        if (failure) throw failure;
        after = inspect();
        if (after.dialog || !after.busy) break;
        if (performance.now() >= deadline) throw Error('Action timed out while resolving');
      } while (true);
      trace.push({action, screen:after.screen, turn:after.turn, hp:after.hp, energy:after.energy,
        block:after.block, enemyHp:after.enemies.map(e => e.hp)});
      if (trace.length > 200) trace.shift();
      return after;
    } finally { pending = false; }
  }
  return Object.freeze({inspect, act, history:() => structuredClone(trace)});
}
