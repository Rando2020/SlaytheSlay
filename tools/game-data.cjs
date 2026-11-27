'use strict';
// Reads the game's data tables (HEROES, EN, RELICS, K, ...) straight out of index.html.
// Used by tools/build-id-registry.mjs and tests/naming.test.cjs so IDs are never copied by hand.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

// Returns the source of `const NAME=<literal>` by walking brackets, skipping strings,
// template literals, comments and regex literals.
function literalSource(src, name) {
  const decl = src.indexOf(`const ${name}=`);
  if (decl < 0) throw new Error(`index.html has no "const ${name}=" table`);
  let i = decl + `const ${name}=`.length;
  const open = src[i];
  if (open !== '{' && open !== '[') throw new Error(`${name} is not an object or array literal`);
  const stack = [];
  let prev = '';
  for (; i < src.length; i++) {
    const ch = src[i];
    if (ch === '"' || ch === "'") { i = skipString(src, i, ch); prev = ch; continue; }
    if (ch === '`') { i = skipTemplate(src, i); prev = ch; continue; }
    if (ch === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i + 2) + 1; continue; }
    if (ch === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); continue; }
    if (ch === '/' && /[(,=:[!&|?{};]/.test(prev)) { i = skipRegex(src, i); prev = '/'; continue; }
    if ('{[('.includes(ch)) stack.push(ch);
    else if ('}])'.includes(ch)) { stack.pop(); if (!stack.length) return src.slice(decl, i + 1); }
    if (!/\s/.test(ch)) prev = ch;
  }
  throw new Error(`Could not find the end of ${name}`);
}
function skipString(s, i, q) { for (i++; i < s.length; i++) { if (s[i] === '\\') i++; else if (s[i] === q) return i; } return i; }
function skipRegex(s, i) { let cls = false; for (i++; i < s.length; i++) { if (s[i] === '\\') i++; else if (s[i] === '[') cls = true; else if (s[i] === ']') cls = false; else if (s[i] === '/' && !cls) return i; } return i; }
function skipTemplate(s, i) {
  for (i++; i < s.length; i++) {
    if (s[i] === '\\') { i++; continue; }
    if (s[i] === '`') return i;
    if (s[i] === '$' && s[i + 1] === '{') {
      let depth = 1;
      for (i += 2; i < s.length && depth; i++) {
        const c = s[i];
        if (c === '"' || c === "'") i = skipString(s, i, c);
        else if (c === '`') i = skipTemplate(s, i);
        else if (c === '{') depth++;
        else if (c === '}') depth--;
      }
      i--;
    }
  }
  return i;
}

function loadGameData(html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')) {
  const names = ['HEROES', 'EN', 'EASY', 'HARD', 'ELITE', 'RELICS', 'GODS', 'STN', 'K', 'COLORLESS', 'LEGACY_ENEMY_IDS', 'HERO_POSES'];
  const ctx = vm.createContext({});
  for (const name of names) vm.runInContext(literalSource(html, name).replace(/^const /, 'var '), ctx);
  const data = Object.fromEntries(names.map(n => [n, vm.runInContext(n, ctx)]));
  // index.html merges colorless cards into K at startup; mirror that here.
  for (const [id, card] of Object.entries(data.COLORLESS)) data.K[id] = {...card, colorless: 1};
  data.BOSSES = [...html.matchAll(/startCombat\(\['(\w+)'\],'boss'\)/g)].map(m => m[1]);
  return data;
}

module.exports = {loadGameData, literalSource, root};
