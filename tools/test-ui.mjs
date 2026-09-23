// UI smoke test in jsdom with stubbed canvas/audio. Run: node tools/test-ui.mjs
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS' : 'FAIL') + ' ' + m); if (!c) fails++; };

// stub 2d context: every method no-op, every prop settable
function ctx2d() {
  return new Proxy({ canvas: null }, {
    get: (t, p) => {
      if (p in t) return t[p];
      if (p === 'measureText') return () => ({ width: 10 });
      if (p === 'getImageData') return () => ({ data: [] });
      return (...a) => {};
    },
    set: (t, p, v) => { t[p] = v; return true; },
  });
}

const html = readFileSync(join(root, 'game/index.html'), 'utf8');
const dom = new JSDOM(html, {
  url: 'http://localhost/game/index.html',
  runScripts: 'outside-only',
  pretendToBeVisual: true,
});
const { window } = dom;
window.HTMLCanvasElement.prototype.getContext = function () { return ctx2d(); };
window.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
window.HTMLMediaElement.prototype.pause = function () {};
let rafCb = null;
window.requestAnimationFrame = (cb) => { rafCb = cb; return 1; };
window.cancelAnimationFrame = () => { rafCb = null; };

// load game scripts in order
for (const f of ['balance.js', 'storage.js', 'audio.js', 'engine.js', 'render.js', 'ui.js']) {
  const code = readFileSync(join(root, 'game/js', f), 'utf8');
  try { window.eval(code); }
  catch (e) { ok(false, `eval ${f}: ${e.message}`); }
}
// fire DOMContentLoaded -> UI.init
window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
await new Promise(r => setTimeout(r, 100));

const UI = window.UI;
ok(!!UI && !!window.BAL && !!window.Game, 'UI/BAL/Game globals exist');
ok(!!window.document.getElementById('scr-menu'), 'menu screen exists');
ok(!window.document.getElementById('scr-menu').classList.contains('hidden'), 'menu visible');

// navigate: play -> maps
window.document.getElementById('btn-play').click();
ok(!window.document.getElementById('scr-maps').classList.contains('hidden'), 'maps screen opens');
ok(window.document.querySelectorAll('.map-card').length === 3, '3 map cards rendered');

// start game on first map
window.document.querySelector('.map-card').click();
ok(!!UI.game, 'game instance created');
ok(!window.document.getElementById('scr-game').classList.contains('hidden'), 'game screen opens');
ok(window.document.querySelectorAll('.build-btn').length === 18, '18 build buttons rendered');

// place towers via engine + run frames
const g = UI.game;
g.coins = 5000;
const spots = [];
for (let r = 0; r < 12 && spots.length < 6; r++) for (let c = 0; c < 20 && spots.length < 6; c++) if (g.tileFree(c, r)) spots.push([c, r]);
['basic', 'cannon', 'tesla', 'antiair', 'freezing', 'missile'].forEach((t, i) => g.placeTower(t, spots[i][0], spots[i][1]));
ok(g.towers.length === 6, '6 towers placed');
g.startNextWave();
let t = 1000;
try {
  for (let i = 0; i < 1200; i++) {
    t += 16;
    if (rafCb) { const cb = rafCb; rafCb = null; cb(t); }
    while (g.abilityQueue.length) g.chooseAbility(g.abilityQueue[0].tw, 0);
    if (!g.waveActive && g.wave >= 1) break;
  }
  ok(g.wave >= 1 && g.kills > 0, `wave simulated: wave=${g.wave} kills=${g.kills}`);
} catch (e) { ok(false, 'frame loop threw: ' + e.message + '\n' + e.stack.split('\n')[1]); }

// select tower + panel
UI.selectTower(g.towers[0]);
ok(!window.document.getElementById('tower-panel').classList.contains('hidden'), 'tower panel shows');
ok(window.document.getElementById('tp-stats').textContent.length > 5, 'tower stats filled');
// upgrade + sell via buttons
const coinsBefore = g.coins;
window.document.getElementById('tp-up').click();
ok(g.towers[0].level === 2, 'upgrade button works');
// ability modal path
const tw = g.towers[1];
g.setLevel(tw, 4);
ok(!window.document.getElementById('modal').classList.contains('hidden'), 'ability modal opens');
window.document.getElementById('ab0').click();
ok(tw.abilities.length === 1, 'ability chosen');
// pause / resume
UI.openPause();
ok(g.paused, 'paused');
window.document.getElementById('m-resume').click();
ok(!g.paused, 'resumed');
// strike button
g.strikeCd = 0;
window.document.getElementById('btn-strike').click();
ok(g.strikesUsed === 1, 'heli strike launches');
// game over victory path
g.endless = false; g.wave = 30; g.waveActive = false; g.enemies = []; g.spawnQueue = [];
g.waveBonus = 150; g.clearWave();
ok(g.over && g.won, 'victory triggers at wave 30');
ok(window.document.getElementById('m-retry') !== null, 'gameover modal buttons exist');
// continue endless
window.document.getElementById('m-endless').click();
ok(!g.over && g.endless, 'continue endless works');
// back to menu, profile/research/settings/help render
window.document.getElementById('m-menu') && window.document.getElementById('m-menu').click();
UI.renderProfile();
ok(window.document.getElementById('pf-stats').children.length === 9, 'profile stats rendered');
ok(window.document.getElementById('pf-ach').children.length === window.BAL.ACH.length, 'achievements rendered');
UI.renderResearch();
ok(window.document.querySelectorAll('.res-row').length === window.BAL.RESEARCH.length, 'research rows rendered');
UI.renderSettings();
UI.renderHelp();
ok(window.document.querySelectorAll('#help-towers .enc-row').length === 18, 'tower encyclopedia (18)');
ok(window.document.querySelectorAll('#help-enemies .enc-row').length === 12, 'enemy encyclopedia (12)');
// language switch
window.STORE.S.settings.lang = 'en'; UI.applyI18n();
ok(window.document.querySelector('[data-i18n="play"]').textContent === 'PLAY', 'EN translation applies');
window.STORE.S.settings.lang = 'uk'; UI.applyI18n();

// research purchase
window.STORE.S.research.points = 10;
UI.renderResearch();
const btn = window.document.querySelector('.res-row button');
btn.click();
ok((window.STORE.S.research.levels.dmg || 0) === 1, 'research purchase works');

console.log(fails ? `\n${fails} FAILURES` : '\nALL UI TESTS PASSED');
process.exit(fails ? 1 : 0);
