/* INFINITODE 5 — UI layer: screens, HUD, i18n, input, main loop */
(function () {
  'use strict';

  const STR = {
    uk: { play: 'ГРАТИ', research: 'Дослідження', profile: 'Профіль', achievements: 'Досягнення', settings: 'Налаштування', help: 'Допомога',
      best: 'Рекорд', wave: 'Хвиля', coins: 'Монети', lives: 'Життя', score: 'Рахунок', enemies: 'Вороги',
      startWave: 'СТАРТ ХВИЛІ', nextWave: 'Наступна хвиля', endless: 'Нескінченний режим', chooseMap: 'Обери мапу',
      back: '← Назад', resume: 'Продовжити', restart: 'Заново', toMenu: 'До меню', pause: 'Пауза',
      upgrade: 'Покращити', sell: 'Продати', damage: 'Шкода', rate: 'Темп', range: 'Радіус', level: 'Рівень', abilities: 'Здібності',
      chooseAbility: 'Обери здібність!', victory: 'ПЕРЕМОГА!', defeat: 'ПОРАЗКА', continueEndless: 'Продовжити (endless)',
      gameAgain: 'Ще раз', waveReached: 'Хвиля', kills: 'Убивства', earned: 'Зароблено', time: 'Час',
      xpGain: 'Досвід', rpGain: 'Наука', noCoins: 'Не вистачає монет!', bossWarn: '⚠ БОСС НАБЛИЖАЄТЬСЯ ⚠',
      strike: 'Удар з неба', strikeReady: 'Готовий!', music: 'Музика', sfx: 'Звуки', autowave: 'Авто-хвилі', shake: 'Тряска екрану',
      lang: 'Мова', wipe: 'Скинути прогрес', wipeConfirm: 'Точно стерти весь прогрес?', yes: 'Так', no: 'Ні',
      nickname: "Ім'я командира", avatar: 'Аватар', save: 'Зберегти', saved: 'Збережено!', rank: 'Звання',
      games: 'Ігор', wins: 'Перемог', bestWave: 'Найкраща хвиля', bosses: 'Босів', strikes: 'Ударів з неба', mapsWon: 'Мап пройдено',
      researchPts: 'Очки науки', buy: 'Купити', maxed: 'МАКС', locked: 'Закрито', unlocked: 'Відкрито',
      howto: 'Як грати', towers: 'Турелі', enemiesInfo: 'Вороги', musicTitle: 'Музика',
      musicText: 'Фонова музика: Kevin MacLeod (incompetech.com), ліцензія CC-BY 4.0. Треки: «Heroic Age» (меню), «Volatile Reaction» і «Interloper» (бій), «Unholy Knight» (бос). Звукові ефекти синтезовані в коді.',
      howtoText: 'Будуй турелі на вільних клітинках, щоб зупинити хвилі ворогів. Вороги йдуть від порталу до бази. Не дай їм прорватись! Турелі отримують досвід і нові здібності на 4, 7, 10, 14 і 18 рівнях (УЛЬТІМА на 20!). Літаючих б’ють не всі — будуй ППО, теслу, ракети, плазму або ангару. Кожні 10 хвиль — бос (усього 4 різних!). Виконуй 3 квести за гру, збирай зірки на 6 мапах, став майнерів на кристали 💎 і качай престиж 👑!',
      prio: 'Ціль', first: 'Перший', last: 'Останній', strong: 'Сильний', weak: 'Слабкий', fast: 'Швидкий', close: 'Близький',
      groundOnly: 'Тільки земля', airOnly: 'Тільки повітря', both: 'Земля + повітря',
      version: 'версія', offline: 'офлайн • без реклами', builderHint: 'Обери турель нижче і тапни по мапі',
      firstHint: 'Побудуй 2–3 турелі біля дороги і натисни СТАРТ!',
      achUnlocked: 'Досягнення!', strikeCd: 'перезарядка', autoWaveOn: 'Авто-старт хвиль увімкнено',
      airWarn: 'Увага: повітряні цілі!', sellConfirm: 'Продати вежу?', coinsShort: 'монет',
      quests: 'Квести', questDone: 'Квест виконано!', difficulty: 'Складність', crystals: 'Кристали',
      prestige: 'Престиж', prestigeBtn: 'Престиж • 25🔬', prestigeDone: 'Новий рівень престижу! 👑',
      prestigeFx: '+2% шкоди, +3% монет за рівень', stars: 'Зірки',
      upgrades: 'Прокачка', trophies: 'Кубки', bank: 'Банк', prime: 'ПРАЙМ',
      primeToast: '🏆 ПРАЙМ! Градієнтне імʼя розблоковано!',
      gradName: '✨ Градієнтне імʼя', gradLocked: '🔒 Збери 1000 🏆 для ПРАЙМу',
      income: 'Дохід', slowFx: 'Сповільнення', towerColor: 'Колір веж змінюється з кожним кубком!',
    },
    en: { play: 'PLAY', research: 'Research', profile: 'Profile', achievements: 'Achievements', settings: 'Settings', help: 'Help',
      best: 'Best', wave: 'Wave', coins: 'Coins', lives: 'Lives', score: 'Score', enemies: 'Enemies',
      startWave: 'START WAVE', nextWave: 'Next wave', endless: 'Endless mode', chooseMap: 'Choose a map',
      back: '← Back', resume: 'Resume', restart: 'Restart', toMenu: 'To menu', pause: 'Pause',
      upgrade: 'Upgrade', sell: 'Sell', damage: 'Damage', rate: 'Rate', range: 'Range', level: 'Level', abilities: 'Abilities',
      chooseAbility: 'Choose an ability!', victory: 'VICTORY!', defeat: 'DEFEAT', continueEndless: 'Continue (endless)',
      gameAgain: 'Play again', waveReached: 'Wave', kills: 'Kills', earned: 'Earned', time: 'Time',
      xpGain: 'XP', rpGain: 'Science', noCoins: 'Not enough coins!', bossWarn: '⚠ BOSS INCOMING ⚠',
      strike: 'Heli strike', strikeReady: 'Ready!', music: 'Music', sfx: 'Sounds', autowave: 'Auto-waves', shake: 'Screen shake',
      lang: 'Language', wipe: 'Reset progress', wipeConfirm: 'Really erase all progress?', yes: 'Yes', no: 'No',
      nickname: 'Commander name', avatar: 'Avatar', save: 'Save', saved: 'Saved!', rank: 'Rank',
      games: 'Games', wins: 'Wins', bestWave: 'Best wave', bosses: 'Bosses', strikes: 'Heli strikes', mapsWon: 'Maps beaten',
      researchPts: 'Science points', buy: 'Buy', maxed: 'MAX', locked: 'Locked', unlocked: 'Unlocked',
      howto: 'How to play', towers: 'Turrets', enemiesInfo: 'Enemies', musicTitle: 'Music',
      musicText: 'Background music by Kevin MacLeod (incompetech.com), CC-BY 4.0 license. Tracks: "Heroic Age" (menu), "Volatile Reaction" and "Interloper" (battle), "Unholy Knight" (boss). Sound effects are synthesized in code.',
      howtoText: 'Build turrets on free tiles to stop enemy waves. Enemies walk from the portal to your base. Do not let them through! Turrets gain XP and new abilities at levels 4, 7, 10, 14 and 18 (ULTIMA at 20!). Flying enemies can only be hit by some turrets — build Antiair, Tesla, Missiles, Plasma or a Heli Hangar. Boss every 10 waves (4 different ones!). Complete 3 quests per game, collect stars on 6 maps, put miners on crystals 💎 and level up prestige 👑!',
      prio: 'Target', first: 'First', last: 'Last', strong: 'Strong', weak: 'Weak', fast: 'Fast', close: 'Close',
      groundOnly: 'Ground only', airOnly: 'Air only', both: 'Ground + air',
      version: 'version', offline: 'offline • no ads', builderHint: 'Pick a turret below and tap the map',
      firstHint: 'Build 2–3 turrets near the road and press START!',
      achUnlocked: 'Achievement!', strikeCd: 'cooldown', autoWaveOn: 'Auto-start waves enabled',
      airWarn: 'Warning: air targets!', sellConfirm: 'Sell tower?', coinsShort: 'coins',
      quests: 'Quests', questDone: 'Quest complete!', difficulty: 'Difficulty', crystals: 'Crystals',
      prestige: 'Prestige', prestigeBtn: 'Prestige • 25🔬', prestigeDone: 'New prestige level! 👑',
      prestigeFx: '+2% damage, +3% coins per level', stars: 'Stars',
      upgrades: 'Upgrades', trophies: 'Trophies', bank: 'Bank', prime: 'PRIME',
      primeToast: '🏆 PRIME! Gradient name unlocked!',
      gradName: '✨ Gradient name', gradLocked: '🔒 Collect 1000 🏆 for PRIME',
      income: 'Income', slowFx: 'Slow', towerColor: 'Tower colors shift with every trophy!',
    },
  };
  const T = (k) => { const l = (globalThis.STORE.S.settings.lang === 'en') ? 'en' : 'uk'; return (STR[l] && STR[l][k]) || STR.uk[k] || k; };
  const TN = (o) => (globalThis.STORE.S.settings.lang === 'en' ? o.en : o.uk);
  const $ = (id) => document.getElementById(id);

  const UI = {
    game: null, renderer: null, endlessMode: false, mapId: 'valley', diffId: 'normal',
    raf: 0, lastT: 0, hudCache: {}, wavePreviewCache: -1,

    init() {
      this.applyI18n();
      this.bindMenu(); this.bindMaps(); this.bindGame(); this.bindProfile(); this.bindResearch(); this.bindUpg(); this.bindSettings(); this.bindHelp();
      this.renderMenuProfile();
      this.show('scr-menu');
      globalThis.AUDIO.playMusic('menu');
      this.lastT = performance.now();
      const loop = (t) => {
        const dt = Math.min(0.1, (t - this.lastT) / 1000);
        this.lastT = t;
        if (this.game && !$('scr-game').classList.contains('hidden')) {
          this.game.update(dt);
          this.renderer.render(dt);
          this.updateHUD();
        }
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    },

    show(id) {
      document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
      $(id).classList.remove('hidden');
      if (id === 'scr-game' && this.renderer) setTimeout(() => this.renderer.resize(), 50);
      window.scrollTo(0, 0);
    },
    applyI18n() {
      document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = T(el.dataset.i18n); });
    },
    toast(msg, ms) {
      const box = $('toasts');
      const d = document.createElement('div');
      d.className = 'toast'; d.textContent = msg;
      box.appendChild(d);
      setTimeout(() => d.classList.add('out'), ms || 2200);
      setTimeout(() => d.remove(), (ms || 2200) + 400);
    },
    achPopup(def) {
      const p = $('ach-pop');
      p.innerHTML = `<svg class="ic"><use href="#i-trophy"/></svg><div><b>${T('achUnlocked')}</b><span>${TN(def.name)} • +${def.xp} XP +${def.rp} 🔬</span></div>`;
      p.classList.remove('hidden'); p.classList.remove('show');
      void p.offsetWidth; p.classList.add('show');
      globalThis.AUDIO.SFX.ach();
      setTimeout(() => p.classList.add('hidden'), 3600);
    },

    // ---------- menu ----------
    bindMenu() {
      $('btn-play').onclick = () => { globalThis.AUDIO.SFX.click(); this.renderMaps(); this.show('scr-maps'); };
      $('btn-research').onclick = () => { globalThis.AUDIO.SFX.click(); this.renderResearch(); this.show('scr-research'); };
      $('btn-upg').onclick = () => { globalThis.AUDIO.SFX.click(); this.renderUpgrades(); this.show('scr-upg'); };
      $('btn-profile').onclick = () => { globalThis.AUDIO.SFX.click(); this.renderProfile(); this.show('scr-profile'); };
      $('btn-settings').onclick = () => { globalThis.AUDIO.SFX.click(); this.renderSettings(); this.show('scr-settings'); };
      $('btn-help').onclick = () => { globalThis.AUDIO.SFX.click(); this.renderHelp(); this.show('scr-help'); };
    },
    renderMenuProfile() {
      const S = globalThis.STORE, lv = S.level();
      $('menu-av').innerHTML = `<use href="#${S.S.profile.avatar}"/>`;
      $('menu-name').textContent = S.S.profile.name;
      $('menu-name').classList.toggle('grad-name', !!(S.S.stats.prime && S.S.profile.gradName));
      $('menu-lvl').textContent = `LV ${lv} • ${S.levelTitle(lv, S.S.settings.lang)}`;
      $('menu-best').textContent = `${T('best')}: ${S.S.stats.bestScore} • ${T('wave')} ${S.S.stats.bestWave} • 🏆 ${S.S.stats.trophies || 0}`;
    },

    // ---------- maps ----------
    bindMaps() {
      $('btn-maps-back').onclick = () => { globalThis.AUDIO.SFX.click(); this.renderMenuProfile(); this.show('scr-menu'); };
      $('chk-endless').onchange = (e) => { this.endlessMode = e.target.checked; };
    },
    renderMaps() {
      const list = $('maps-list');
      list.innerHTML = '';
      $('chk-endless').checked = this.endlessMode;
      const S = globalThis.STORE;
      for (const m of globalThis.BAL.MAPS) {
        const st = S.S.stats.stars[m.id] || 0;
        const card = document.createElement('button');
        card.className = 'map-card';
        card.style.setProperty('--accent', m.accent);
        card.innerHTML = `<img src="${m.bg}" alt=""/><div class="map-info"><b>${TN(m.name)}</b><span>${TN(m.desc)}</span><div class="mstars">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</div></div>`;
        card.onclick = () => { globalThis.AUDIO.SFX.build(); this.startGame(m.id); };
        list.appendChild(card);
      }
      const dr = $('diff-row');
      dr.innerHTML = '';
      for (const df of globalThis.BAL.MODIFIERS) {
        const b = document.createElement('button');
        b.className = 'diff-btn' + (this.diffId === df.id ? ' active' : '');
        b.innerHTML = `<b>${TN(df.name)}</b><span>${TN(df.desc)}</span>`;
        b.onclick = () => { globalThis.AUDIO.SFX.click(); this.diffId = df.id; this.renderMaps(); };
        dr.appendChild(b);
      }
    },

    // ---------- game ----------
    bindGame() {
      const cv = $('cv');
      cv.addEventListener('pointermove', (e) => this.onHover(e));
      cv.addEventListener('pointerdown', (e) => { e.preventDefault(); this.onTap(e); });
      cv.addEventListener('pointerleave', () => { if (this.renderer) this.renderer.hover = null; });
      cv.addEventListener('contextmenu', (e) => e.preventDefault());
      $('btn-wave').onclick = () => { globalThis.AUDIO.SFX.click(); if (this.game) this.game.startNextWave(); };
      $('btn-speed').onclick = () => {
        globalThis.AUDIO.SFX.click();
        if (!this.game) return;
        this.game.speed = this.game.speed >= 3 ? 1 : this.game.speed + 1;
        $('btn-speed').innerHTML = `<svg class="ic"><use href="#i-speed"/></svg><span>${this.game.speed}x</span>`;
      };
      $('btn-pause').onclick = () => { globalThis.AUDIO.SFX.click(); this.openPause(); };
      $('btn-gamemenu').onclick = () => { globalThis.AUDIO.SFX.click(); this.openPause(); };
      $('btn-quests').onclick = () => { globalThis.AUDIO.SFX.click(); $('quest-panel').classList.toggle('hidden'); };
      $('btn-strike').onclick = () => {
        if (!this.game) return;
        if (this.game.callStrike()) { globalThis.AUDIO.SFX.strike(); this.toast('🚁 ' + T('strike') + '!'); }
        else globalThis.AUDIO.SFX.error();
      };
      $('tp-close').onclick = () => { globalThis.AUDIO.SFX.click(); this.selectTower(null); };
      $('tp-up').onclick = () => { const tw = this.renderer.selected; if (tw && this.game.upgradeTower(tw)) globalThis.AUDIO.SFX.upgrade(); else globalThis.AUDIO.SFX.error(); this.refreshTowerPanel(); };
      $('tp-sell').onclick = () => { const tw = this.renderer.selected; if (tw) { globalThis.AUDIO.SFX.sell(); this.game.sellTower(tw); this.selectTower(null); } };
      $('tp-prio').onclick = () => {
        const tw = this.renderer.selected; if (!tw) return;
        globalThis.AUDIO.SFX.click();
        const P = globalThis.BAL.PRIORITIES;
        tw.prio = P[(P.indexOf(tw.prio) + 1) % P.length];
        this.refreshTowerPanel();
      };
      document.addEventListener('keydown', (e) => {
        if ($('scr-game').classList.contains('hidden') || !this.game) return;
        if (e.key === 'Escape') { this.cancelPlacing(); this.selectTower(null); }
        if (e.key === ' ') { e.preventDefault(); this.game.paused ? this.closeModal() || (this.game.paused = false) : this.openPause(); }
      });
    },
    startGame(mapId) {
      this.mapId = mapId;
      const SR = globalThis.STORE.S.research;
      const rfx = globalThis.BAL.researchFx(SR.levels, SR.prestige || 0);
      const upg = {};
      for (const [id, lv] of Object.entries(globalThis.STORE.S.upgrades || {})) upg[id] = 1 + (globalThis.BAL.UPG_PCT / 100) * lv;
      const diff = globalThis.BAL.MODIFIERS.find(x => x.id === this.diffId) || globalThis.BAL.MODIFIERS[0];
      this.game = new globalThis.Game(mapId, { rfx, diff, upg, endless: this.endlessMode, events: (t, d) => this.onEvent(t, d) });
      this.renderQuests();
      this.game.paused = true;
      this.renderer = new globalThis.Renderer($('cv'), this.game);
      this.hudCache = {};
      this.buildBar();
      this.selectTower(null);
      this.cancelPlacing();
      $('btn-speed').innerHTML = `<svg class="ic"><use href="#i-speed"/></svg><span>1x</span>`;
      this.closeModal();
      this.show('scr-game');
      globalThis.AUDIO.playMusic(this.endlessMode ? 'battle2' : 'battle1');
      if (globalThis.STORE.S.stats.games === 0) setTimeout(() => this.toast(T('firstHint'), 4000), 600);
      else setTimeout(() => this.toast(T('builderHint'), 2500), 400);
    },
    onEvent(type, d) {
      const A = globalThis.AUDIO.SFX;
      if (type === 'waveStart') {
        if (d.boss) { A.boss(); this.toast(T('bossWarn'), 3500); globalThis.AUDIO.playMusic('boss'); }
        else { A.wave(); globalThis.AUDIO.playMusic(this.game.wave % 2 ? 'battle1' : 'battle2'); }
        const w = globalThis.BAL.genWave(d.wave);
        if (w.groups.some(g => globalThis.BAL.ENEMIES[g.type].flying)) setTimeout(() => this.toast('✈ ' + T('airWarn'), 2500), 1200);
      } else if (type === 'waveClear') { A.clear(); }
      else if (type === 'leak') { A.leak(); }
      else if (type === 'toast') { this.toast(T(d.k)); A.error(); }
      else if (type === 'ach') {
        const def = globalThis.STORE.unlockAch(d.id);
        if (def && def.name) this.achPopup(def);
      }
      else if (type === 'rp') { globalThis.STORE.S.research.points += d.n; globalThis.STORE.save(); this.toast(`🔬 +${d.n} ${T('rpGain')}`); }
      else if (type === 'questDone') { A.ach(); this.toast(`📜 ${T('questDone')} ${TN(d.q.name)}`, 3000); this.refreshQuests(); }
      else if (type === 'abilityChoice') { A.ability(); this.openAbilityModal(); }
      else if (type === 'towersChanged') { this.refreshTowerPanel(); this.refreshBuildBar(); }
      else if (type === 'gameOver') { this.onGameOver(d); }
    },
    bankTrophies() {
      const S = globalThis.STORE, g = this.game;
      const n = g ? (g.trophies || 0) : 0;
      if (n > 0) {
        S.S.stats.trophies = (S.S.stats.trophies || 0) + n;
        S.S.stats.trophyBank = (S.S.stats.trophyBank || 0) + n;
        g.trophies = 0;
      }
      if (!S.S.stats.prime && (S.S.stats.trophies || 0) >= 1000) {
        S.S.stats.prime = true;
        S.save();
        const def = S.unlockAch('prime');
        if (def && def.name) this.achPopup(def);
        this.toast(T('primeToast'), 4000);
      }
    },
    onGameOver(d) {
      const S = globalThis.STORE;
      const sessTroph = this.game ? (this.game.trophies || 0) : 0;
      this.bankTrophies();
      const xp = Math.round(d.score / 25 + d.wave * 5 + (d.win ? 150 : 0));
      S.addXP(xp);
      S.S.research.points += d.rp;
      S.S.stats.games++;
      if (d.win) { S.S.stats.wins++; if (!S.S.stats.mapsWon.includes(this.mapId)) S.S.stats.mapsWon.push(this.mapId); }
      S.S.stats.bestWave = Math.max(S.S.stats.bestWave, d.wave);
      S.S.stats.bestScore = Math.max(S.S.stats.bestScore, d.score);
      S.S.stats.kills += d.kills; S.S.stats.earned += d.earned;
      S.S.stats.bosses += this.game.bosses; S.S.stats.strikes += this.game.strikesUsed;
      S.S.stats.timePlayed += Math.round(d.time);
      let stars = 0;
      if (d.win) {
        stars = this.game.lives >= this.game.maxLives ? 3 : this.game.lives > this.game.maxLives / 2 ? 2 : 1;
        const prev = S.S.stats.stars[this.mapId] || 0;
        if (stars > prev) S.S.stats.stars[this.mapId] = stars;
      }
      S.save();
      if (S.S.stats.mapsWon.length >= 6) { const def = S.unlockAch('win_all'); if (def && def.name) setTimeout(() => this.achPopup(def), 1500); }
      if (d.win && this.diffId === 'brutal') { const def = S.unlockAch('brutal'); if (def && def.name) setTimeout(() => this.achPopup(def), 2500); }
      if (Object.values(S.S.stats.stars).reduce((a, b) => a + b, 0) >= 18) { const def = S.unlockAch('stars18'); if (def && def.name) setTimeout(() => this.achPopup(def), 3500); }
      d.win ? globalThis.AUDIO.SFX.victory() : globalThis.AUDIO.SFX.defeat();
      globalThis.AUDIO.playMusic('menu');
      const mm = Math.floor(d.time / 60), ss = Math.floor(d.time % 60);
      const bstars = [0, 1, 2].map(i => `<span class="${i < stars ? 'on' : 'off'}" style="animation-delay:${0.3 + i * 0.35}s">★</span>`).join('');
      this.openModal(`
        <h2 class="${d.win ? 'win bounce' : 'lose'}">${d.win ? T('victory') : T('defeat')}</h2>
        ${d.win ? `<div class="bstars">${bstars}</div>` : ''}
        <div class="stats-grid">
          <div><span>${T('waveReached')}</span><b>${d.wave}</b></div>
          <div><span>${T('score')}</span><b>${d.score}</b></div>
          <div><span>${T('kills')}</span><b>${d.kills}</b></div>
          <div><span>${T('earned')}</span><b>${d.earned}</b></div>
          <div><span>${T('time')}</span><b>${mm}:${String(ss).padStart(2, '0')}</b></div>
          <div><span>${T('xpGain')}</span><b>+${xp} XP</b></div>
        </div>
        <div class="vrewards">+${xp} XP • +${sessTroph} 🏆${d.rp ? ` • +${d.rp} 🔬` : ''}</div>
        <div class="modal-btns">
          ${d.win && !this.game.endless ? `<button class="btn gold" id="m-endless">${T('continueEndless')}</button>` : ''}
          <button class="btn primary" id="m-retry">${T('gameAgain')}</button>
          <button class="btn ghost" id="m-menu">${T('toMenu')}</button>
          <button class="btn ghost" id="m-settings" title="${T('settings')}">⚙</button>
        </div>`);
      $('m-retry').onclick = () => { globalThis.AUDIO.SFX.click(); this.startGame(this.mapId); };
      $('m-menu').onclick = () => { globalThis.AUDIO.SFX.click(); this.closeModal(); this.renderMenuProfile(); this.show('scr-menu'); };
      $('m-settings').onclick = () => { globalThis.AUDIO.SFX.click(); this.closeModal(); this.renderSettings(); this.show('scr-settings'); };
      const me = $('m-endless');
      if (me) me.onclick = () => { globalThis.AUDIO.SFX.click(); this.closeModal(); this.game.endless = true; this.game.over = false; this.game.paused = false; };
    },

    // build bar
    buildBar() {
      const bar = $('build-bar');
      bar.innerHTML = '';
      const order = Object.values(globalThis.BAL.TOWERS).sort((a, b) => a.order - b.order);
      for (const def of order) {
        const key = Object.keys(globalThis.BAL.TOWERS).find(k => globalThis.BAL.TOWERS[k] === def);
        const b = document.createElement('button');
        b.className = 'build-btn';
        b.dataset.type = key;
        b.style.setProperty('--tc', def.color);
        b.innerHTML = `<svg class="ic big"><use href="#i-${key}"/></svg><span class="bc">${this.game.towerCost(key)}</span>`;
        b.title = `${TN(def.name)} — ${TN(def.desc)}`;
        b.onclick = () => {
          globalThis.AUDIO.SFX.click();
          this.selectTower(null);
          if (this.renderer.placing === key) this.cancelPlacing();
          else { this.renderer.placing = key; this.refreshBuildBar(); }
        };
        bar.appendChild(b);
      }
      this.refreshBuildBar();
    },
    towerColor(key) {
      const def = globalThis.BAL.TOWERS[key];
      const g = this.game;
      const tot = (globalThis.STORE.S.stats.trophies || 0) + ((g && g.trophies) || 0);
      return globalThis.BAL.shiftColor(def.color, (tot % 100) * 3.6);
    },
    refreshBuildBar() {
      if (!this.game) return;
      document.querySelectorAll('.build-btn').forEach(b => {
        const t = b.dataset.type;
        b.classList.toggle('active', this.renderer.placing === t);
        b.classList.toggle('poor', !this.game.canAfford(t));
        b.querySelector('.bc').textContent = this.game.towerCost(t);
        b.style.setProperty('--tc', this.towerColor(t));
      });
    },
    cancelPlacing() { if (this.renderer) { this.renderer.placing = null; this.refreshBuildBar(); } },

    onHover(e) {
      if (!this.renderer || !this.game || !this.renderer.placing) return;
      const p = this.renderer.screenToGame(e.clientX, e.clientY);
      const c = Math.floor(p.x / 64), r = Math.floor(p.y / 64);
      this.renderer.hover = (c >= 0 && c < 20 && r >= 0 && r < 12) ? { c, r } : null;
    },
    onTap(e) {
      if (!this.game || this.game.over) return;
      const p = this.renderer.screenToGame(e.clientX, e.clientY);
      const c = Math.floor(p.x / 64), r = Math.floor(p.y / 64);
      if (this.renderer.placing) {
        const tw = this.game.placeTower(this.renderer.placing, c, r);
        if (tw) {
          globalThis.AUDIO.SFX.build();
          if (!this.game.canAfford(this.renderer.placing)) this.cancelPlacing();
          else this.refreshBuildBar();
        } else globalThis.AUDIO.SFX.error();
        return;
      }
      const tw = this.game.towers.find(t => Math.hypot(t.x - p.x, t.y - p.y) < 34);
      this.selectTower(tw || null);
      if (tw) globalThis.AUDIO.SFX.click();
    },
    selectTower(tw) {
      if (this.renderer) this.renderer.selected = tw;
      this.refreshTowerPanel();
    },
    airLabel(def) { return def.air === 0 ? T('groundOnly') : def.air === 2 ? T('airOnly') : T('both'); },
    refreshTowerPanel() {
      const p = $('tower-panel');
      const tw = this.renderer && this.renderer.selected;
      if (!tw || !this.game.towers.includes(tw)) { p.classList.add('hidden'); return; }
      p.classList.remove('hidden');
      const g = this.game;
      $('tp-icon').innerHTML = `<use href="#i-${tw.type}"/>`;
      $('tp-icon').style.color = this.towerColor(tw.type);
      $('tp-name').textContent = TN(tw.def.name);
      $('tp-lvl').textContent = `LV ${tw.level}`;
      const dmg = tw.type === 'miner' ? `+${Math.round(tw.def.income * (1 + 0.25 * (tw.level - 1)) * (tw.m.incMul || 1) * (g.upg.miner || 1))}/5c` :
        tw.type === 'freezing' ? `-${Math.round(Math.min(0.9, (tw.def.slow + (tw.m.slowPlus || 0)) * (g.upg.freezing || 1)) * 100)}%` :
        tw.type === 'flame' ? `${Math.round(g.tDmg(tw))}/c` : String(Math.round(g.tDmg(tw)));
      $('tp-stats').innerHTML =
        `<span>⚔ ${dmg}</span><span>⏱ ${g.tRate(tw).toFixed(1)}/c</span><span>◎ ${(g.tRange(tw) / 64).toFixed(1)}</span><span>✈ ${this.airLabel(tw.def)}</span>`;
      const need = tw.level >= 20 ? 1 : globalThis.BAL.xpNeed(tw.level);
      $('tp-xp').style.width = `${tw.level >= 20 ? 100 : Math.min(100, (tw.xp / need) * 100)}%`;
      const ab = globalThis.BAL.ABILITIES[tw.type].concat(globalThis.BAL.GENERIC_AB, [globalThis.BAL.ULTIMA]);
      $('tp-abilities').innerHTML = tw.abilities.map(id => {
        const a = ab.find(x => x.id === id);
        return `<span class="ab-tag" title="${a ? TN(a.desc) : ''}">${a ? TN(a.name) : id}</span>`;
      }).join('') || `<span class="dim">—</span>`;
      if (tw.level >= 20) { $('tp-up').innerHTML = T('maxed'); $('tp-up').disabled = true; }
      else { $('tp-up').innerHTML = `${T('upgrade')} • ${g.upCost(tw)}`; $('tp-up').disabled = false; }
      $('tp-sell').innerHTML = `${T('sell')} +${g.sellValue(tw)}`;
      $('tp-prio').innerHTML = `🎯 ${T(tw.prio)}`;
    },

    // HUD
    fmt(n) { return n >= 10000 ? (n / 1000).toFixed(1) + 'k' : String(Math.floor(n)); },
    updateHUD() {
      const g = this.game, C = this.hudCache;
      const set = (id, v) => { if (C[id] !== v) { C[id] = v; $(id).textContent = v; } };
      set('hud-coins', this.fmt(g.coins));
      set('hud-lives', String(g.lives));
      set('hud-wave', g.waveActive ? `${g.wave} (${g.enemies.length + g.spawnQueue.length})` : `${g.wave} → ${g.wave + 1}`);
      set('hud-score', this.fmt(g.score + g.earned * 0.5));
      set('hud-trophies', this.fmt((globalThis.STORE.S.stats.trophies || 0) + (g.trophies || 0)));
      // wave button
      const bw = $('btn-wave');
      if (g.waveActive) { bw.classList.add('hidden'); }
      else { bw.classList.remove('hidden'); if (C.wbtn !== g.wave) { C.wbtn = g.wave; bw.innerHTML = `<svg class="ic"><use href="#i-play"/></svg> ${T('startWave')} ${g.wave + 1}`; } }
      // next wave preview
      if (C.pv !== g.wave || C.pvA !== g.waveActive) {
        C.pv = g.wave; C.pvA = g.waveActive;
        const w = globalThis.BAL.genWave(g.wave + 1);
        const icons = w.groups.slice(0, 6).map(gr => {
          const d = globalThis.BAL.ENEMIES[gr.type];
          return `<span class="pv" style="--ec:${d.color}" title="${TN(d.name)} x${gr.count}">${gr.count}</span>`;
        }).join('');
        $('wave-preview').innerHTML = `${w.boss ? '💀 ' : ''}${icons}<span class="pv-b">+${w.bonus}</span>`;
      }
      // strike
      const st = $('btn-strike');
      if (g.strikeCd > 0) {
        st.classList.add('cd');
        const t = Math.ceil(g.strikeCd);
        if (C.st !== t) { C.st = t; st.innerHTML = `<svg class="ic"><use href="#i-heli"/></svg><span>${t}c</span>`; }
      } else if (C.st !== 0) {
        C.st = 0; st.classList.remove('cd');
        st.innerHTML = `<svg class="ic"><use href="#i-heli"/></svg><span>${T('strikeReady')}</span>`;
      }
      this.refreshBuildBarThrottled();
      this.refreshQuests();
    },
    renderQuests() {
      const p = $('quest-panel');
      const g = this.game;
      if (!g || !g.quests) { p.classList.add('hidden'); return; }
      p.classList.remove('hidden');
      p.innerHTML = `<div class="q-title">📜 ${T('quests')}</div>` + g.quests.map((q, i) => {
        const r = q.def.reward || {};
        const rw = [r.coins ? `+${r.coins}🪙` : '', r.rp ? `+${r.rp}🔬` : '', r.cry ? `+${r.cry}💎` : ''].filter(Boolean).join(' ');
        return `<div class="quest-row${q.done ? ' done' : ''}"><span>${TN(q.def.name)}</span><b id="qp${i}">0/${q.def.need}</b><em>${rw}</em></div>`;
      }).join('');
    },
    refreshQuests() {
      const g = this.game;
      if (!g || !g.quests) return;
      g.quests.forEach((q, i) => {
        const el = $('qp' + i);
        if (!el) return;
        const txt = `${Math.min(q.prog, q.def.need)}/${q.def.need}`;
        if (el.textContent !== txt) el.textContent = txt;
        el.parentElement.classList.toggle('done', q.done);
      });
    },
    refreshBuildBarThrottled() {
      const now = performance.now();
      if (!this._bbT || now - this._bbT > 500) { this._bbT = now; this.refreshBuildBar(); }
    },

    // ---------- modals ----------
    openModal(html) {
      $('modal-card').innerHTML = html;
      $('modal').classList.remove('hidden');
    },
    closeModal() { $('modal').classList.add('hidden'); $('modal-card').innerHTML = ''; },
    openPause() {
      if (!this.game || this.game.over) return;
      this.game.paused = true;
      this.openModal(`
        <h2>${T('pause')}</h2>
        <div class="modal-btns col">
          <button class="btn primary" id="m-resume">${T('resume')}</button>
          <button class="btn ghost" id="m-restart">${T('restart')}</button>
          <button class="btn ghost" id="m-menu">${T('toMenu')}</button>
        </div>`);
      $('m-resume').onclick = () => { globalThis.AUDIO.SFX.click(); this.closeModal(); this.game.paused = false; };
      $('m-restart').onclick = () => { globalThis.AUDIO.SFX.click(); this.bankTrophies(); globalThis.STORE.save(); this.startGame(this.mapId); };
      $('m-menu').onclick = () => { globalThis.AUDIO.SFX.click(); this.bankTrophies(); globalThis.STORE.save(); this.closeModal(); globalThis.AUDIO.playMusic('menu'); this.renderMenuProfile(); this.show('scr-menu'); };
    },
    openAbilityModal() {
      const q = this.game.abilityQueue[0];
      if (!q) return;
      const wasPaused = this.game.paused;
      this.game.paused = true;
      const list = q.tier >= 2 ? globalThis.BAL.GENERIC_AB : globalThis.BAL.ABILITIES[q.tw.type];
      const [a, b] = q.tier >= 2 ? [list[0], list[1]] : [list[q.tier * 2], list[q.tier * 2 + 1]];
      this.openModal(`
        <h2>${T('chooseAbility')}</h2>
        <p class="dim">${TN(q.tw.def.name)} • LV ${q.tw.level}</p>
        <div class="ab-cards">
          <button class="ab-card" id="ab0"><b>${TN(a.name)}</b><span>${TN(a.desc)}</span></button>
          <button class="ab-card" id="ab1"><b>${TN(b.name)}</b><span>${TN(b.desc)}</span></button>
        </div>`);
      const pick = (i) => {
        globalThis.AUDIO.SFX.upgrade();
        this.game.chooseAbility(q.tw, i);
        this.refreshTowerPanel();
        if (this.game.abilityQueue.length) this.openAbilityModal();
        else { this.closeModal(); if (!wasPaused) this.game.paused = false; }
      };
      $('ab0').onclick = () => pick(0);
      $('ab1').onclick = () => pick(1);
    },

    // ---------- profile ----------
    bindProfile() {
      $('btn-pf-back').onclick = () => { globalThis.AUDIO.SFX.click(); this.renderMenuProfile(); this.show('scr-menu'); };
      $('btn-pf-save').onclick = () => {
        globalThis.AUDIO.SFX.click();
        const S = globalThis.STORE;
        S.S.profile.name = ($('pf-name').value || 'Commander').slice(0, 16);
        S.save(); this.toast(T('saved')); this.renderProfile();
      };
      $('tab-pf-profile').onclick = () => { globalThis.AUDIO.SFX.click(); $('pf-tab-profile').classList.remove('hidden'); $('pf-tab-ach').classList.add('hidden'); $('tab-pf-profile').classList.add('active'); $('tab-pf-ach').classList.remove('active'); };
      $('tab-pf-ach').onclick = () => { globalThis.AUDIO.SFX.click(); $('pf-tab-ach').classList.remove('hidden'); $('pf-tab-profile').classList.add('hidden'); $('tab-pf-ach').classList.add('active'); $('tab-pf-profile').classList.remove('active'); };
      $('pf-grad').onchange = (e) => {
        const S = globalThis.STORE;
        if (!S.S.stats.prime) { e.target.checked = false; globalThis.AUDIO.SFX.error(); this.toast(T('gradLocked'), 2600); return; }
        globalThis.AUDIO.SFX.click();
        S.S.profile.gradName = e.target.checked; S.save(); this.renderProfile();
      };
    },
    renderProfile() {
      const S = globalThis.STORE, lv = S.level();
      $('pf-av').innerHTML = `<use href="#${S.S.profile.avatar}"/>`;
      $('pf-name').value = S.S.profile.name;
      $('pf-name').classList.toggle('grad-name', !!(S.S.stats.prime && S.S.profile.gradName));
      $('pf-grad').checked = !!S.S.profile.gradName;
      $('pf-grad-hint').textContent = S.S.stats.prime ? `🏆 ${S.S.stats.trophies || 0} • ${T('prime')} 👑` : `${T('gradLocked')} (${S.S.stats.trophies || 0}/1000)`;
      $('pf-level').textContent = `LV ${lv}`;
      $('pf-rank').textContent = S.levelTitle(lv, S.S.settings.lang);
      const base = Math.pow(lv - 1, 2) * 100, next = Math.pow(lv, 2) * 100;
      $('pf-xpfill').style.width = `${Math.min(100, ((S.S.profile.xp - base) / (next - base)) * 100)}%`;
      $('pf-xptext').textContent = `${S.S.profile.xp} XP`;
      const st = S.S.stats;
      $('pf-stats').innerHTML = [
        [T('games'), st.games], [T('wins'), st.wins], [T('bestWave'), st.bestWave],
        [T('score'), st.bestScore], [T('kills'), st.kills], [T('bosses'), st.bosses],
        [T('earned'), st.earned], [T('strikes'), st.strikes], [T('mapsWon'), st.mapsWon.length + '/6'],
        [T('stars'), Object.values(st.stars || {}).reduce((a, b) => a + b, 0) + '/18'], [T('prestige'), S.S.research.prestige || 0],
        [T('trophies'), `🏆 ${st.trophies || 0}`],
      ].map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');
      const ag = $('av-grid');
      ag.innerHTML = '';
      for (const a of S.AVATARS) {
        const b = document.createElement('button');
        b.className = 'av-btn' + (S.S.profile.avatar === a ? ' active' : '');
        b.innerHTML = `<svg class="ic big"><use href="#${a}"/></svg>`;
        b.onclick = () => { globalThis.AUDIO.SFX.click(); S.S.profile.avatar = a; S.save(); this.renderProfile(); };
        ag.appendChild(b);
      }
      const al = $('pf-ach');
      al.innerHTML = '';
      for (const a of globalThis.BAL.ACH) {
        const un = !!S.S.ach[a.id];
        const d = document.createElement('div');
        d.className = 'ach-row' + (un ? '' : ' locked');
        d.innerHTML = `<svg class="ic"><use href="#${un ? 'i-trophy' : 'i-lock'}"/></svg><div><b>${TN(a.name)}</b><span>${TN(a.desc)}</span></div><em>+${a.xp} XP</em>`;
        al.appendChild(d);
      }
    },

    // ---------- research ----------
    bindResearch() {
      $('btn-res-back').onclick = () => { globalThis.AUDIO.SFX.click(); this.renderMenuProfile(); this.show('scr-menu'); };
    },
    renderResearch() {
      const S = globalThis.STORE, R = S.S.research;
      $('rp-points').textContent = `🔬 ${R.points} ${T('researchPts')}`;
      $('cry-points').textContent = `💎 ${R.crystals || 0} ${T('crystals')}`;
      const pr = $('prestige-row');
      pr.innerHTML = `<span>👑 ${T('prestige')}: <b>${R.prestige || 0}</b><br><span class="dim">${T('prestigeFx')}</span></span><button class="btn small gold" id="btn-prestige">${T('prestigeBtn')}</button>`;
      $('btn-prestige').onclick = () => {
        if (R.points >= 25) {
          R.points -= 25; R.prestige = (R.prestige || 0) + 1;
          S.save(); S.unlockAch('prestige1');
          globalThis.AUDIO.SFX.victory(); this.toast(T('prestigeDone')); this.renderResearch();
        } else { globalThis.AUDIO.SFX.error(); this.toast(T('noCoins')); }
      };
      const list = $('res-list');
      list.innerHTML = '';
      for (const r of globalThis.BAL.RESEARCH) {
        const lv = R.levels[r.id] || 0;
        const maxed = lv >= r.max;
        const cost = maxed ? 0 : r.costs[lv];
        const cur = r.cur === 'cry' ? 'cry' : 'rp';
        const have = cur === 'cry' ? (R.crystals || 0) : R.points;
        const can = !maxed && have >= cost;
        const d = document.createElement('div');
        d.className = 'res-row';
        d.innerHTML = `<svg class="ic big"><use href="#${r.icon}"/></svg>
          <div class="res-mid"><b>${TN(r.name)}</b><span>${TN(r.desc)}</span>
          <div class="pips">${Array.from({ length: r.max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div></div>
          <button class="btn small ${can ? 'primary' : 'ghost'}" ${can ? '' : 'disabled'}>${maxed ? T('maxed') : `${T('buy')} • ${cost}${cur === 'cry' ? '💎' : '🔬'}`}</button>`;
        if (can) d.querySelector('button').onclick = () => {
          globalThis.AUDIO.SFX.upgrade();
          if (cur === 'cry') R.crystals -= cost; else R.points -= cost;
          R.levels[r.id] = lv + 1;
          S.save(); this.renderResearch();
        };
        list.appendChild(d);
      }
    },

    // ---------- tower upgrades (trophies) ----------
    bindUpg() {
      $('btn-upg-back').onclick = () => { globalThis.AUDIO.SFX.click(); this.renderMenuProfile(); this.show('scr-menu'); };
    },
    upgEffect(key) {
      if (key === 'miner') return T('income');
      if (key === 'freezing') return T('slowFx');
      return T('damage');
    },
    renderUpgrades() {
      const S = globalThis.STORE, BAL = globalThis.BAL;
      const life = S.S.stats.trophies || 0, bankBal = S.S.stats.trophyBank || 0;
      const prime = !!S.S.stats.prime;
      $('upg-head').innerHTML =
        `<div>🏆 <b>${life}</b> ${T('trophies')} • ${T('bank')}: <b>${bankBal}</b> 🏆</div>` +
        (prime ? `<div>👑 <b>${T('prime')}</b> • ${T('towerColor')}</div>`
          : `<div class="dim">${T('prime')}: ${Math.min(1000, life)}/1000</div><div class="prime-bar"><i style="width:${Math.min(100, life / 10)}%"></i></div>`);
      const list = $('upg-list');
      list.innerHTML = '';
      const order = Object.values(BAL.TOWERS).sort((a, b) => a.order - b.order);
      for (const def of order) {
        const key = Object.keys(BAL.TOWERS).find(k => BAL.TOWERS[k] === def);
        const lv = (S.S.upgrades || {})[key] || 0;
        const maxed = lv >= BAL.UPG_MAX;
        const cost = maxed ? 0 : BAL.upgCost(lv);
        const can = !maxed && bankBal >= cost;
        const d = document.createElement('div');
        d.className = 'upg-row';
        d.innerHTML = `<svg class="ic big" style="color:${BAL.shiftColor(def.color, (life % 100) * 3.6)}"><use href="#i-${key}"/></svg>
          <div class="upg-mid"><b>${TN(def.name)}</b><span>${this.upgEffect(key)} +${lv * BAL.UPG_PCT}%</span>
          <div class="pips">${Array.from({ length: BAL.UPG_MAX }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div></div>
          <button class="btn small ${can ? 'primary' : 'ghost'}" ${can ? '' : 'disabled'}>${maxed ? T('maxed') : `${T('buy')} • ${cost}🏆`}</button>`;
        if (can) d.querySelector('button').onclick = () => {
          globalThis.AUDIO.SFX.upgrade();
          S.S.stats.trophyBank -= cost;
          S.S.upgrades = S.S.upgrades || {};
          S.S.upgrades[key] = lv + 1;
          S.save(); this.renderUpgrades();
        };
        list.appendChild(d);
      }
    },

    // ---------- settings ----------
    bindSettings() {
      $('btn-set-back').onclick = () => { globalThis.AUDIO.SFX.click(); this.renderMenuProfile(); this.applyI18n(); this.show('scr-menu'); };
      $('set-music').oninput = (e) => { globalThis.STORE.S.settings.music = +e.target.value; globalThis.STORE.save(); globalThis.AUDIO.applyVolumes(); };
      $('set-sfx').oninput = (e) => { globalThis.STORE.S.settings.sfx = +e.target.value; globalThis.STORE.save(); globalThis.AUDIO.applyVolumes(); globalThis.AUDIO.SFX.click(); };
      $('set-autowave').onchange = (e) => { globalThis.STORE.S.settings.autowave = e.target.checked; globalThis.STORE.save(); };
      $('set-shake').onchange = (e) => { globalThis.STORE.S.settings.shake = e.target.checked; globalThis.STORE.save(); };
      $('set-lang').onchange = (e) => { globalThis.STORE.S.settings.lang = e.target.value; globalThis.STORE.save(); this.applyI18n(); this.renderSettings(); this.renderMenuProfile(); };
      $('btn-wipe').onclick = () => {
        globalThis.AUDIO.SFX.click();
        this.openModal(`<h2>${T('wipeConfirm')}</h2><div class="modal-btns"><button class="btn danger" id="m-yes">${T('yes')}</button><button class="btn ghost" id="m-no">${T('no')}</button></div>`);
        $('modal').classList.remove('hidden');
        $('m-yes').onclick = () => { globalThis.STORE.reset(); location.reload(); };
        $('m-no').onclick = () => { this.closeModal(); };
      };
    },
    renderSettings() {
      const s = globalThis.STORE.S.settings;
      $('set-music').value = s.music;
      $('set-sfx').value = s.sfx;
      $('set-autowave').checked = s.autowave;
      $('set-shake').checked = s.shake;
      $('set-lang').value = s.lang;
    },

    // ---------- help ----------
    bindHelp() {
      $('btn-help-back').onclick = () => { globalThis.AUDIO.SFX.click(); this.renderMenuProfile(); this.show('scr-menu'); };
    },
    renderHelp() {
      $('help-text').textContent = STR[globalThis.STORE.S.settings.lang].howtoText;
      $('help-music').textContent = T('musicText');
      const tw = $('help-towers');
      tw.innerHTML = '';
      for (const [key, def] of Object.entries(globalThis.BAL.TOWERS).sort((a, b) => a[1].order - b[1].order)) {
        const d = document.createElement('div');
        d.className = 'enc-row';
        d.innerHTML = `<svg class="ic big" style="color:${def.color}"><use href="#i-${key}"/></svg>
          <div><b>${TN(def.name)} <em>• ${def.cost}</em></b><span>${TN(def.desc)}</span><span class="dim">${this.airLabel(def)}</span></div>`;
        tw.appendChild(d);
      }
      const en = $('help-enemies');
      en.innerHTML = '';
      for (const [key, def] of Object.entries(globalThis.BAL.ENEMIES)) {
        const d = document.createElement('div');
        d.className = 'enc-row';
        d.innerHTML = `<svg class="ic big" style="color:${def.color}"><use href="#i-en-${key}"/></svg>
          <div><b>${TN(def.name)}</b><span>HP ${def.hp} • ⚔${def.reward} • ${def.flying ? '✈' : '🚶'}</span></div>`;
        en.appendChild(d);
      }
    },
  };

  document.addEventListener('DOMContentLoaded', () => UI.init());
  globalThis.UI = UI;
})();
