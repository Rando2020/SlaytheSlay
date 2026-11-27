// Enforces docs/NAMING.md. Every failure message says how to fix it.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {loadGameData, root} = require('../tools/game-data.cjs');

const data = loadGameData();
const rel = (...p) => path.join(root, ...p);
const dirs = p => fs.existsSync(rel(p)) ? fs.readdirSync(rel(p), {withFileTypes: true}).filter(e => e.isDirectory()).map(e => e.name) : [];
const files = p => fs.existsSync(rel(p)) ? fs.readdirSync(rel(p), {withFileTypes: true}).filter(e => e.isFile()).map(e => e.name) : [];
const stem = f => f.replace(/\.[^.]+$/, '');
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const ID = /^[a-z][a-z0-9_]*$/;
const REBUILD = 'Run: node tools/build-asset-manifest.mjs && node tools/build-id-registry.mjs';

// When a file is named after a display name, point at the ID it should use.
function hint(name, table) {
  const match = Object.entries(table).find(([, v]) => slug(v.n || v[0] || '') === slug(name.replace(/^the-/, '')));
  return match ? ` It looks like "${match[1].n || match[1][0]}", whose ID is "${match[0]}": rename it to use the ID.` : '';
}

test('every game ID is lowercase letters, digits and underscores', () => {
  for (const table of ['HEROES', 'EN', 'RELICS', 'K', 'GODS', 'STN'])
    for (const id of Object.keys(data[table]))
      assert.match(id, ID, `${table} ID "${id}" breaks the ID rule in docs/NAMING.md (lowercase, digits, underscores).`);
});

test('asset files use lowercase names inside a known category folder', () => {
  const categories = ['backgrounds', 'enemies', 'fx', 'heroes', 'maps', 'props', 'rigs', 'scenes', 'ui'];
  for (const entry of fs.readdirSync(rel('assets'), {withFileTypes: true})) {
    if (entry.isDirectory()) assert.ok(categories.includes(entry.name),
      `assets/${entry.name}/ is not a known category. Use one of ${categories.join(', ')} or add it to docs/NAMING.md and this test.`);
    else assert.equal(entry.name, 'manifest.js', `assets/${entry.name} is loose in assets/. Move it into its category folder (docs/NAMING.md).`);
  }
  (function walk(dir) {
    for (const entry of fs.readdirSync(rel(dir), {withFileTypes: true})) {
      const p = dir + '/' + entry.name;
      if (entry.isDirectory()) { walk(p); continue; }
      if (entry.name === 'README.md') continue;
      assert.match(entry.name, /^[a-z0-9][a-z0-9_-]*\.(webp|png|js|json)$/,
        `${p}: file names are lowercase letters, digits, "-" and "_" with a lowercase extension.`);
    }
  })('assets');
});

test('each hero has assets/heroes/<id>/ with every pose, and nothing else lives there', () => {
  for (const id of Object.keys(data.HEROES))
    for (const pose of data.HERO_POSES)
      assert.ok(fs.existsSync(rel('assets/heroes', id, pose + '.webp')), `Hero "${id}" is missing assets/heroes/${id}/${pose}.webp.`);
  for (const dir of dirs('assets/heroes'))
    assert.ok(data.HEROES[dir], `assets/heroes/${dir}/ does not match a hero ID (${Object.keys(data.HEROES).join(', ')}).`);
});

test('each enemy ID matches its folder, rig and painted pose paths', () => {
  const rigs = fs.readFileSync(rel('assets/rigs/registry.js'), 'utf8');
  for (const [id, e] of Object.entries(data.EN)) {
    assert.ok(fs.existsSync(rel('assets/enemies', id)), `Enemy "${id}" (${e.n}) has no assets/enemies/${id}/ folder.`);
    if (e.rig) {
      assert.equal(e.rig, id, `EN.${id}.rig is "${e.rig}". A rig's registry key must equal the enemy ID.`);
      assert.ok(rigs.includes(`"${id}": {`), `EN.${id} uses a rig, but assets/rigs/registry.js has no "${id}" entry.`);
    }
    if (e.img) {
      assert.ok(e.img.startsWith(id + '/'), `EN.${id}.img is "${e.img}". Painted poses live in assets/enemies/${id}/.`);
      assert.ok(fs.existsSync(rel('assets/enemies', e.img + '.webp')), `EN.${id}.img points at missing assets/enemies/${e.img}.webp.`);
    }
    if (e.actionPoses) for (const pose of ['attack', 'hurt'])
      assert.ok(fs.existsSync(rel('assets/enemies', id, pose + '.webp')), `EN.${id} has actionPoses but no assets/enemies/${id}/${pose}.webp.`);
  }
  for (const dir of dirs('assets/enemies'))
    assert.ok(data.EN[dir], `assets/enemies/${dir}/ does not match an enemy ID.${data.LEGACY_ENEMY_IDS[dir] ? ` "${dir}" is a retired key: use "${data.LEGACY_ENEMY_IDS[dir]}".` : hint(dir, data.EN)}`);
  for (const key of Object.keys(data.LEGACY_ENEMY_IDS))
    assert.ok(!data.EN[key], `"${key}" is a retired enemy key. Use "${data.LEGACY_ENEMY_IDS[key]}".`);
});

test('UI art is named after the ID it belongs to', () => {
  for (const f of files('assets/ui/relics'))
    assert.ok(data.RELICS[stem(f)], `assets/ui/relics/${f} does not match a relic ID.${hint(stem(f), data.RELICS)}`);
  for (const f of files('assets/ui/sanctums'))
    assert.ok(data.GODS[stem(f)], `assets/ui/sanctums/${f} does not match a god ID (${Object.keys(data.GODS).join(', ')}).`);
  for (const f of files('assets/ui/hud')) {
    const [, kind, id] = stem(f).match(/^(status|oath)-(.+)$/) || [];
    if (kind === 'status') assert.ok(data.STN[id], `assets/ui/hud/${f}: "${id}" is not a status ID.${hint(id, data.STN)}`);
    if (kind === 'oath') assert.ok(data.GODS[id], `assets/ui/hud/${f}: oath icons use the god ID (${Object.keys(data.GODS).join(', ')}).`);
  }
  for (const pool of dirs('assets/ui/cards/art')) {
    assert.ok(pool === 'shared' || data.HEROES[pool], `assets/ui/cards/art/${pool}/ must be a hero ID or "shared".`);
    for (const f of files('assets/ui/cards/art/' + pool))
      assert.ok(data.K[stem(f)], `assets/ui/cards/art/${pool}/${f} does not match a card ID.${hint(stem(f), data.K)}`);
  }
  for (const f of files('assets/ui/cards/backs'))
    assert.ok(stem(f) === 'universal' || data.HEROES[stem(f)], `assets/ui/cards/backs/${f} must be a hero ID or "universal".`);
});

test('enemy source art starts with the enemy ID', () => {
  const ids = Object.keys(data.EN).sort((a, b) => b.length - a.length);
  for (const f of files('art/source/enemies'))
    assert.ok(ids.some(id => f === id + '.png' || f.startsWith(id + '-')),
      `art/source/enemies/${f} should be named <enemyId>-<what>.png, e.g. ${ids[0]}-attack.png.`);
});

test('assets/manifest.js and docs/ID-REGISTRY.md are up to date', async () => {
  const {renderManifest} = await import('../tools/build-asset-manifest.mjs');
  const {renderRegistry} = await import('../tools/build-id-registry.mjs');
  assert.equal(fs.readFileSync(rel('assets/manifest.js'), 'utf8'), renderManifest(), `assets/manifest.js is stale. ${REBUILD}`);
  assert.equal(fs.readFileSync(rel('docs/ID-REGISTRY.md'), 'utf8'), renderRegistry(), `docs/ID-REGISTRY.md is stale. ${REBUILD}`);
});

test('every local script and stylesheet index.html loads exists and is served by the co-op server', () => {
  const html = fs.readFileSync(rel('index.html'), 'utf8');
  const server = fs.readFileSync(rel('tools/coop-server.cjs'), 'utf8');
  const loaded = [...html.matchAll(/<script src="([^"]+)"/g), ...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)]
    .map(m => m[1]).filter(src => !/^https?:/.test(src));
  for (const src of loaded) {
    assert.ok(fs.existsSync(rel(src)), `index.html loads ${src}, which does not exist.`);
    assert.ok(server.includes(`'${src}'`), `${src} is missing from the pages list in tools/coop-server.cjs, so online co-op cannot load it. Scripts and stylesheets belong in src/.`);
  }
});
