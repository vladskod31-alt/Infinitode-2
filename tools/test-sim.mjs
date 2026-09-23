// Headless gameplay simulation test. Run: node tools/test-sim.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// ---- stubs ----
globalThis.STORE = {
  S: { settings: { autowave: false, lang: 'uk', shake: false }, stats: { games: 1 }, research: { points: 0, levels: {} }, profile: { name: 'Test', xp: 0 } },
  unlockAch: () => null, save: () => {}, level: () => 1,
};
globalThis.AUDIO = { SFX: new Proxy({}, { get: () => () => {} }) };

const BAL = require('../game/js/balance.js');
globalThis.BAL = BAL;
require('../game/js/engine.js');
const Game = globalThis.Game;

let fails = 0;
const ok = (cond, msg) => { console.log((cond ? 'PASS' : 'FAIL') + ' ' + msg); if (!cond) fails++; };

// ---- 1. data integrity ----
for (const m of BAL.MAPS) {
  const p = BAL.buildPath(m.wp);
  ok(p.total > 1000 && p.tiles.size > 20, `map ${m.id}: path len=${Math.round(p.total)} tiles=${p.tiles.size}`);
}
for (let w = 1; w <= 45; w++) {
  const g = BAL.genWave(w);
  const bad = g.groups.filter(gr => !BAL.ENEMIES[gr.type] || gr.count <= 0);
  if (bad.length) ok(false, `wave ${w} bad groups`);
}
ok(true, 'waves 1..45 reference valid enemies');
for (const [k, def] of Object.entries(BAL.TOWERS)) {
  ok(BAL.ABILITIES[k] && BAL.ABILITIES[k].length === 5, `tower ${k} has 5 abilities`);
  const tw = { m: {}, type: k };
  try { for (const a of BAL.ABILITIES[k]) a.apply(tw); }
  catch (e) { ok(false, `tower ${k} ability apply: ${e.message}`); }
}
ok(true, 'all abilities apply cleanly');
const fx = BAL.researchFx({ dmg: 5, rate: 3 });
ok(fx.dmgMul === 1.4 && fx.startCoins === 450, 'researchFx computes');

// ---- 2. gameplay sim ----
function freeTiles(g) {
  const out = [];
  for (let r = 0; r < 12; r++) for (let c = 0; c < 20; c++) if (g.tileFree(c, r)) out.push([c, r]);
  return out;
}
function simMap(mapId, maxWave) {
  const evts = [];
  const g = new Game(mapId, { rfx: BAL.researchFx({}), endless: maxWave > 30, events: (t, d) => evts.push(t) });
  g.coins = 8000;
  g.speed = 3;
  // build one of each tower + miners
  const free = freeTiles(g);
  const types = Object.keys(BAL.TOWERS);
  let fi = 0;
  for (const t of types) { const [c, r] = free[(fi * 7 + 3) % free.length]; fi++; g.placeTower(t, c, r); }
  ok(g.towers.length === types.length, `${mapId}: placed all ${types.length} towers`);
  // upgrade some + sell/rebuy one
  const b = g.towers.find(t => t.type === 'basic');
  g.upgradeTower(b); g.upgradeTower(b);
  ok(b.level === 3, `${mapId}: upgrade works (lvl ${b.level})`);
  const miner = g.towers.find(t => t.type === 'miner');
  const sv = g.sellValue(miner); g.sellTower(miner);
  ok(sv > 0 && !g.towers.includes(miner), `${mapId}: sell works (+${sv})`);
  g.callStrike();
  ok(g.strikes.length === 0, `${mapId}: strike blocked before start (ok)`);

  let steps = 0;
  for (let w = 1; w <= maxWave; w++) {
    g.startNextWave();
    if (w === 2) { g.callStrike(); }
    let n = 0;
    while (g.waveActive && n < 4000 && !g.over) {
      g.update(0.05);
      while (g.abilityQueue.length) g.chooseAbility(g.abilityQueue[0].tw, 0);
      n++; steps++;
    }
    if (g.over) break;
    if (g.waveActive) { ok(false, `${mapId}: wave ${w} did not clear in time`); break; }
    // upgrade random towers between waves
    for (const tw of g.towers.slice(0, 4)) if (g.coins > g.upCost(tw) * 2) g.upgradeTower(tw);
  }
  const lvls = g.towers.map(t => t.level);
  console.log(`  ${mapId}: waves=${g.wave} kills=${g.kills} lives=${g.lives} coins=${Math.round(g.coins)} score=${Math.round(g.score)} maxLvl=${Math.max(...lvls)} ults=${g.towers.filter(t => t.level >= 10).length} bosses=${g.bosses} evts=${evts.filter(e => e === 'waveClear').length}xClear/${evts.filter(e => e === 'ach').length}xAch`);
  ok(g.wave === maxWave || g.over, `${mapId}: reached wave ${maxWave} (got ${g.wave}, over=${g.over})`);
  return g;
}

const g1 = simMap('valley', 12);
simMap('desert', 10);
const g3 = simMap('arctic', 10);
ok(g1.kills > 200, `valley kills=${g1.kills} (>200)`);
ok(g1.earned > 500, `valley earned=${Math.round(g1.earned)} (>500)`);
ok(g3.enemies.length === 0, 'no stuck enemies after clear');

// ---- 3. defeat path ----
{
  const g = new Game('valley', { rfx: BAL.researchFx({}), events: () => {} });
  g.speed = 3;
  let n = 0;
  while (!g.over && n < 60000) { if (!g.waveActive) g.startNextWave(); g.update(0.05); n++; }
  ok(g.over && g.lives === 0, `defeat path works (wave ${g.wave}, lives ${g.lives})`);
}
// ---- 4. victory path (strong defense, 30 waves on valley) ----
{
  const g = new Game('valley', { rfx: BAL.researchFx({ dmg: 5, rate: 5, range: 5 }), endless: false, events: () => {} });
  g.coins = 60000;
  g.speed = 3;
  const free = freeTiles(g);
  const comp = ['tesla', 'tesla', 'missile', 'sniper', 'multishot', 'cannon', 'antiair', 'antiair', 'venom', 'blast', 'minigun', 'laser', 'gauss', 'crusher', 'heli', 'freezing', 'freezing', 'splash', 'basic', 'flame'];
  comp.forEach((t, i) => { const [c, r] = free[(i * 11 + 5) % free.length]; g.placeTower(t, c, r); });
  for (let w = 1; w <= 30; w++) {
    if (g.over) break;
    g.startNextWave();
    let n = 0;
    while (g.waveActive && n < 6000 && !g.over) {
      g.update(0.05);
      while (g.abilityQueue.length) g.chooseAbility(g.abilityQueue[0].tw, 0);
      n++;
    }
    for (const tw of g.towers) { if (tw.level < 10 && g.coins > 20000) g.upgradeTower(tw); }
  }
  console.log(`  victory-run: wave=${g.wave} won=${g.won} lives=${g.lives} kills=${g.kills}`);
  ok(g.won, `victory achievable (wave ${g.wave}, lives ${g.lives})`);
}

console.log(fails ? `\n${fails} FAILURES` : '\nALL TESTS PASSED');
process.exit(fails ? 1 : 0);
