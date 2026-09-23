// INFINITODE 5 edge-case tests: boss rotation, prestige fx, crystal miners, new bosses, quests, ULTIMA.
// Run: node tools/test-edge5.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
globalThis.STORE = { S: { settings: { autowave: false, lang: 'uk', shake: false }, stats: { games: 1, stars: {} }, research: { points: 0, crystals: 0, prestige: 0, levels: {} }, profile: { name: 'T', xp: 0 } }, unlockAch: () => null, save: () => {}, level: () => 1 };
globalThis.AUDIO = { SFX: new Proxy({}, { get: () => () => {} }) };
const BAL = require(join(root, 'game5/js/balance.js'));
globalThis.BAL = BAL;
require(join(root, 'game5/js/engine.js'));
const Game = globalThis.Game;
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS' : 'FAIL') + ' ' + m); if (!c) fails++; };
const approx = (a, b) => Math.abs(a - b) < 1e-9;

// boss rotation (actual design: 10 boss, 20 broot, 30 constr, endless every 5: 35 metaphor, 40 boss, 45 broot...)
ok(BAL.bossFor(10) === 'boss' && BAL.bossFor(20) === 'broot' && BAL.bossFor(30) === 'constr', 'boss rotation 10/20/30');
ok(BAL.bossFor(35) === 'metaphor' && BAL.bossFor(40) === 'boss' && BAL.bossFor(45) === 'broot', 'endless rotation 35/40/45');
const w35 = BAL.genWave(35);
ok(w35.boss && w35.groups.some(gr => gr.type === 'metaphor'), 'genWave(35) has metaphor boss');
// prestige researchFx
const fx = BAL.researchFx({ nano: 5, greed: 5, crit: 5, miner: 5, bossdmg: 3 }, 10);
ok(approx(fx.dmgMul, 1.25 * 1.2) && approx(fx.coinMul, 1.4 * 1.3), `nano/greed/prestige fx dmg=${fx.dmgMul} coin=${fx.coinMul}`);
ok(approx(fx.critCh, 0.15) && fx.minerMul === 2 && approx(fx.bossDmgMul, 1.36), 'crit/miner/bossdmg fx');
// quests
const qs = BAL.pickQuests();
ok(qs.length === 3 && new Set(qs.map(q => q.def.id)).size === 3, 'pickQuests 3 unique');

// live combat: crystal miner + all new bosses + splitter
const evts = [];
const g = new Game('volcano', { rfx: BAL.researchFx({}), endless: true, events: (t, d) => evts.push(t) });
g.paused = false;
g.coins = 60000; g.speed = 3; g.lives = 1000;
const free = [];
for (let r = 0; r < 12; r++) for (let c = 0; c < 20; c++) if (g.tileFree(c, r)) free.push([c, r]);
['plasma', 'tesla', 'missile', 'sniper', 'multishot', 'cannon', 'tesla', 'plasma', 'laser', 'gauss'].forEach((t, i) => { const [c, r] = free[(i * 13 + 2) % free.length]; g.placeTower(t, c, r); });
const [cc, cr] = g.map.crystals[0];
const miner = g.placeTower('miner', cc, cr);
for (let i = 0; i < 400; i++) g.update(0.05);
ok(miner && g.minerEarned > 0, 'miner earns ' + Math.round(g.minerEarned));
ok(g.crystalsEarned >= 5, 'crystal miner yields crystals: ' + g.crystalsEarned);
ok(globalThis.STORE.S.research.crystals >= 5, 'crystals saved to store');
for (const tw of g.towers) { g.setLevel(tw, 5); while (g.abilityQueue.length) g.chooseAbility(g.abilityQueue[0].tw, 0); }
const baseKills = g.kills;
for (const bt of ['metaphor', 'constr', 'broot', 'splitter']) {
  const b = g.spawnEnemyAt(bt, 0);
  let n = 0;
  for (; n < 4000 && b.hp > 0 && !g.over; n++) {
    g.update(0.05);
    while (g.abilityQueue.length) g.chooseAbility(g.abilityQueue[0].tw, 0);
  }
  ok(b.hp <= 0, `${bt} killable (ticks=${n})`);
}
const splitKids = g.kills - baseKills;
ok(g.bossTypes.size === 3, 'bossTypes tracked: ' + [...g.bossTypes].join(','));
ok(splitKids > 6, `splitter/constr spawns fought (kills=${splitKids})`);
// quest mechanics deterministic
const g2 = new Game('valley', { rfx: BAL.researchFx({}), events: (t) => evts.push(t) });
g2.paused = false;
g2.quests = [{ def: BAL.QUESTS.find(q => q.id === 'q_kill250'), prog: 0, done: false }];
const coinsBefore = g2.coins;
g2.kills = 300; g2.questTick();
ok(g2.quests[0].done && g2.coins === coinsBefore + 150, 'quest completes + pays 150 coins');
ok(evts.includes('questDone'), 'questDone event emitted');
// plasma tiers
const pl = g.towers.find(t => t.type === 'plasma');
g.setLevel(pl, 14);
ok(g.abilityQueue.length > 0, 'tier2 ability queued at 14');
g.chooseAbility(pl, 0);
ok(pl.abilities.includes('gdmg'), 'generic ability applied');
g.setLevel(pl, 20);
ok(pl.abilities.includes('ultima') && pl.level === 20, 'ULTIMA at 20, capped');
// v1.1: permanent upgrades + trophies + color shift
ok(BAL.upgCost(0) === 10 && BAL.upgCost(9) === 100 && BAL.UPG_MAX === 10 && BAL.UPG_PCT === 4, 'upg costs/caps');
{
  const gu = new Game('valley', { rfx: BAL.researchFx({}), upg: { tesla: 1.2, miner: 1.5 }, events: () => {} });
  gu.paused = false;
  const tw = gu.placeTower('tesla', 1, 1);
  ok(approx(gu.tDmg(tw) / BAL.TOWERS.tesla.dmg, 1.2), 'upg multiplies tower damage');
  gu.placeTower('miner', 1, 0);
  for (let i = 0; i < 120; i++) gu.update(0.05);
  ok(gu.minerEarned === Math.round(BAL.TOWERS.miner.income * 1.5), `upg multiplies miner income (${gu.minerEarned})`);
  const k0 = gu.trophies;
  const foe = gu.spawnEnemyAt('regular', 0);
  gu.killEnemy(foe, null);
  ok(gu.trophies === k0 + 1, 'each kill gives 1 trophy');
}
ok(BAL.shiftColor('#ff0000', 0) === '#ff0000', 'shiftColor identity at 0');
ok(BAL.shiftColor('#ff0000', 120) === '#00ff00', 'shiftColor red+120=green');
ok(BAL.shiftColor('#ff0000', 360) === '#ff0000', 'shiftColor full cycle');
console.log(fails ? fails + ' FAILURES' : 'ALL V5 EDGE TESTS PASSED');
process.exit(fails ? 1 : 0);
