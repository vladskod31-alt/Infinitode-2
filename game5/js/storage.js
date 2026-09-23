/* Profile, stats, research, settings — localStorage persistence */
(function () {
  'use strict';
  const KEY = 'infinitode5_v1';
  const AVATARS = ['i-av1', 'i-av2', 'i-av3', 'i-av4', 'i-av5', 'i-av6', 'i-av7', 'i-av8'];

  function defaults() {
    return {
      profile: { name: 'Commander', avatar: 'i-av1', xp: 0 },
      stats: { games: 0, wins: 0, bestWave: 0, bestScore: 0, kills: 0, bosses: 0, earned: 0, strikes: 0, mapsWon: [], stars: {}, timePlayed: 0 },
      research: { points: 0, crystals: 0, prestige: 0, levels: {} },
      ach: {},
      settings: { music: 0.7, sfx: 0.8, speed: 1, autowave: false, lang: 'uk', shake: true },
    };
  }
  let S = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      S = Object.assign(defaults(), p);
      S.profile = Object.assign(defaults().profile, p.profile);
      S.stats = Object.assign(defaults().stats, p.stats);
      S.research = Object.assign(defaults().research, p.research);
      S.settings = Object.assign(defaults().settings, p.settings);
    }
  } catch (e) { /* fresh start */ }

  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function level() { return Math.floor(Math.sqrt(S.profile.xp / 100)) + 1; }
  function levelTitle(lv, lang) {
    const UK = ['Рекрут', 'Боєць', 'Сержант', 'Лейтенант', 'Капітан', 'Майор', 'Полковник', 'Генерал', 'Маршал', 'Легенда'];
    const EN = ['Recruit', 'Fighter', 'Sergeant', 'Lieutenant', 'Captain', 'Major', 'Colonel', 'General', 'Marshal', 'Legend'];
    const a = lang === 'en' ? EN : UK;
    return a[Math.min(a.length - 1, Math.floor((lv - 1) / 2))];
  }
  function addXP(n) { S.profile.xp += n; save(); }
  function unlockAch(id) {
    if (S.ach[id]) return null;
    S.ach[id] = Date.now();
    const def = (globalThis.BAL.ACH || []).find(a => a.id === id);
    if (def) { addXP(def.xp); S.research.points += def.rp; }
    save();
    return def || { id };
  }

  globalThis.STORE = { S, AVATARS, save, level, levelTitle, addXP, unlockAch,
    reset: () => { S = defaults(); save(); } };
})();
