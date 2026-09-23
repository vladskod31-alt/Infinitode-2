/* INFINITODE 5 — game engine (logic + simulation). Depends on BAL, STORE, AUDIO. */
(function () {
  'use strict';
  const B = () => globalThis.BAL;
  const TILE = 64;

  let UID = 1;

  class Game {
    constructor(mapId, opts) {
      opts = opts || {};
      this.BAL = B();
      this.map = this.BAL.MAPS.find(m => m.id === mapId) || this.BAL.MAPS[0];
      this.path = this.BAL.buildPath(this.map.wp);
      this.RFX = opts.rfx || this.BAL.researchFx({});
      this.events = opts.events || (() => {});
      this.endless = !!opts.endless;
      this.diff = opts.diff || { id: 'normal', hp: 1, rw: 1, lives: 0 };
      this.coins = this.RFX.startCoins;
      this.lives = this.RFX.maxLives + this.diff.lives;
      this.maxLives = this.RFX.maxLives + this.diff.lives;
      this.wave = 0;
      this.score = 0;
      this.time = 0;
      this.speed = 1;
      this.paused = true;
      this.over = false;
      this.won = false;
      this.towers = [];
      this.enemies = [];
      this.projs = [];
      this.parts = [];
      this.beams = [];
      this.floaters = [];
      this.strikes = [];
      this.spawnQueue = [];
      this.waveActive = false;
      this.waveTime = 0;
      this.autoTimer = 0;
      this.strikeCd = 0;
      this.strikeMax = this.RFX.heliCd;
      this.abilityQueue = [];
      this.kills = 0; this.earned = 0; this.bosses = 0;
      this.builtTypes = new Set();
      this.upgrades = 0; this.strikesUsed = 0;
      this.noLeak = 0; this.maxNoLeak = 0;
      this.shake = 0;
      this.started = false;
      this.rpEarned = 0;
      this.upg = opts.upg || {};
      this.trophies = 0;
      this.quests = this.BAL.pickQuests();
      this.builtTotal = 0; this.towerKills = {}; this.minerEarned = 0;
      this.crystalsEarned = 0; this.questsDone = 0; this.bossTypes = new Set();
      this.crystalSet = new Set((this.map.crystals || []).map(([c, r]) => c + ',' + r));
    }

    emit(type, data) { try { this.events(type, data || {}); } catch (e) {} }

    // ---------- economy / build ----------
    towerCost(type) { return Math.max(1, Math.round(this.BAL.TOWERS[type].cost * this.RFX.discount)); }
    upCost(tw) { return Math.max(1, Math.round(this.BAL.upCost(tw.def, tw.level) * this.RFX.discount)); }
    sellValue(tw) { return Math.round(tw.invested * 0.7); }

    tileFree(c, r) {
      if (c < 0 || c >= 20 || r < 0 || r >= 12) return false;
      if (this.path.tiles.has(c + ',' + r)) return false;
      return !this.towers.some(t => t.gx === c && t.gy === r);
    }
    canAfford(type) { return this.coins >= this.towerCost(type); }

    placeTower(type, c, r) {
      const def = this.BAL.TOWERS[type];
      if (!def || !this.tileFree(c, r)) return null;
      const cost = this.towerCost(type);
      if (this.coins < cost) { this.emit('toast', { k: 'noCoins' }); return null; }
      this.coins -= cost;
      const tw = { uid: UID++, type, def, gx: c, gy: r, x: (c + 0.5) * TILE, y: (r + 0.5) * TILE,
        level: 1, xp: 0, angle: -Math.PI / 2, cd: 0, prio: 'first',
        m: { dmgMul: 1, rateMul: 1, rangeMul: 1, psMul: 1 },
        spin: 0, aimT: 0, aimUid: 0, charge: 0, fireT: 0, grabs: [], drones: [],
        tick: 0, invested: cost, kills: 0, chilled: false, abilities: [] };
      if (type === 'heli') for (let i = 0; i < this.droneCount(tw); i++) tw.drones.push(this.mkDrone(tw));
      this.towers.push(tw);
      this.builtTypes.add(type);
      this.builtTotal++;
      this.burst(tw.x, tw.y, def.color, 14, 160);
      this.questTick();
      this.floater(tw.x, tw.y - 30, '-' + cost, '#ffd968');
      this.checkBuilderAch();
      this.emit('towersChanged', {});
      return tw;
    }
    sellTower(tw) {
      const v = this.sellValue(tw);
      this.coins += v;
      this.floater(tw.x, tw.y - 30, '+' + v, '#5ef2b8');
      this.burst(tw.x, tw.y, '#ffffff', 10, 120);
      for (const g of tw.grabs) if (g.e.grab === g) g.e.grab = null;
      this.towers = this.towers.filter(t => t !== tw);
      this.emit('towersChanged', {});
    }
    upgradeTower(tw) {
      if (tw.level >= 20) return false;
      const c = this.upCost(tw);
      if (this.coins < c) { this.emit('toast', { k: 'noCoins' }); return false; }
      this.coins -= c; tw.invested += c;
      this.setLevel(tw, tw.level + 1);
      this.upgrades++;
      this.burst(tw.x, tw.y, '#ffe27a', 16, 180);
      this.questTick();
      this.emit('towersChanged', {});
      return true;
    }
    setLevel(tw, lv) {
      tw.level = lv;
      if (lv === 4 || lv === 7) {
        const tier = lv === 4 ? 0 : 1;
        this.abilityQueue.push({ tw, tier });
        this.emit('abilityChoice', { tw, tier });
      } else if (lv === 14 || lv === 18) {
        const tier = lv === 14 ? 2 : 3;
        this.abilityQueue.push({ tw, tier });
        this.emit('abilityChoice', { tw, tier });
      } else if (lv >= 20) {
        tw.level = 20;
        const u = this.BAL.ULTIMA;
        if (u && !tw.abilities.includes(u.id)) { u.apply(tw); tw.abilities.push(u.id); }
        this.floater(tw.x, tw.y - 44, 'ULTIMA!', '#ff7ad9', 24);
        this.burst(tw.x, tw.y, '#ff7ad9', 40, 300);
        this.emit('ach', { id: 'lvl20' });
        return;
      }
      if (lv === 10) {
        tw.level = 10;
        const ult = this.BAL.ABILITIES[tw.type][4];
        if (ult && !tw.abilities.includes(ult.id)) { ult.apply(tw); tw.abilities.push(ult.id); }
        this.floater(tw.x, tw.y - 44, 'ULTIMATE!', '#ffe27a', 22);
        this.burst(tw.x, tw.y, '#ffe27a', 30, 260);
        this.emit('ach', { id: 'maxlvl' });
      }
    }
    chooseAbility(tw, idx) {
      const q = this.abilityQueue.findIndex(q => q.tw === tw);
      if (q < 0) return;
      const tier = this.abilityQueue[q].tier;
      const ab = tier >= 2 ? this.BAL.GENERIC_AB[idx] : this.BAL.ABILITIES[tw.type][tier * 2 + idx];
      if (ab) { ab.apply(tw); tw.abilities.push(ab.id); }
      this.abilityQueue.splice(q, 1);
      this.emit('towersChanged', {});
    }
    addXp(tw, n) {
      if (tw.level >= 20) return;
      tw.xp += n * this.RFX.xpMul;
      while (tw.level < 20 && tw.xp >= this.BAL.xpNeed(tw.level)) {
        tw.xp -= this.BAL.xpNeed(tw.level);
        this.setLevel(tw, tw.level + 1);
      }
    }

    // ---------- effective stats ----------
    tDmg(tw) { return tw.def.dmg * (1 + 0.18 * (tw.level - 1)) * tw.m.dmgMul * this.RFX.dmgMul * (this.upg[tw.type] || 1); }
    tRate(tw) { let r = tw.def.rate * (1 + 0.04 * (tw.level - 1)) * tw.m.rateMul * this.RFX.rateMul; if (tw.chilled) r *= 0.7; return r; }
    tRange(tw) { return tw.def.range * TILE * tw.m.rangeMul * this.RFX.rangeMul; }
    tPs(tw) { return (tw.def.ps || 500) * tw.m.psMul; }
    droneCount(tw) { return tw.def.drones + (tw.m.dronesPlus || 0); }
    mkDrone(tw) { return { x: tw.x + (Math.random() - 0.5) * 40, y: tw.y + (Math.random() - 0.5) * 40, cd: Math.random(), angle: 0, rotor: Math.random() * 6 }; }

    // ---------- waves ----------
    startNextWave() {
      if (this.waveActive || this.over) return;
      this.wave++;
      const w = this.BAL.genWave(this.wave);
      this.spawnQueue = [];
      for (const g of w.groups) for (let i = 0; i < g.count; i++) this.spawnQueue.push({ t: g.delay + i * g.gap, type: g.type });
      this.spawnQueue.sort((a, b) => a.t - b.t);
      this.waveActive = true;
      this.waveTime = 0;
      this.started = true;
      this.paused = false;
      this.waveBonus = w.bonus;
      this.waveIsBoss = w.boss;
      this.emit('waveStart', { wave: this.wave, boss: w.boss });
    }
    spawnEnemy(type) {
      const d = this.BAL.ENEMIES[type];
      const hp = Math.round(d.hp * this.BAL.hpMul(this.wave) * this.diff.hp);
      const e = { uid: UID++, type, d, hp, maxHp: hp, dist: 0, x: this.path.pts[0].x, y: this.path.pts[0].y,
        ang: 0, slowT: 0, slowMul: 1, pSlow: 0, poison: [], burnT: 0, burnDps: 0, stun: 0,
        grab: null, bob: Math.random() * 6.28, healCd: 1 + Math.random(), brittle: 0, curSlow: 1 };
      this.enemies.push(e);
      return e;
    }
    spawnEnemyAt(type, dist) {
      const e = this.spawnEnemy(type);
      e.dist = Math.max(0, dist);
      const pos = this.BAL.posAt(this.path, e.dist);
      e.x = pos.x; e.y = pos.y;
      this.burst(e.x, e.y, e.d.color, 8, 120);
      return e;
    }

    callStrike() {
      if (this.strikeCd > 0 || this.over || !this.started) return false;
      this.strikeCd = this.strikeMax;
      this.strikes.push({ x: -80, y: 120 + Math.random() * 200, vx: 260, t: 0, cd: 0.5 });
      this.strikesUsed++;
      if (this.strikesUsed >= 5) this.emit('ach', { id: 'striker' });
      return true;
    }

    // ---------- targeting ----------
    canHit(tw, e) {
      const a = tw.def.air;
      if (a === 0 && e.d.flying) return false;
      if (a === 2 && !e.d.flying) return false;
      return true;
    }
    inRange(tw, e, range) {
      const dx = e.x - tw.x, dy = e.y - tw.y;
      return dx * dx + dy * dy <= range * range;
    }
    pickTarget(tw, list) {
      const range = this.tRange(tw);
      let c = list.filter(e => this.canHit(tw, e) && this.inRange(tw, e, range));
      if (!c.length) return null;
      if (tw.type === 'venom') { const unp = c.filter(e => !e.poison.length && !e.d.poisonImmune); if (unp.length) c = unp; }
      const p = tw.prio;
      c.sort((a, b) => {
        if (p === 'first') return b.dist - a.dist;
        if (p === 'last') return a.dist - b.dist;
        if (p === 'strong') return b.hp - a.hp;
        if (p === 'weak') return a.hp - b.hp;
        if (p === 'fast') return b.d.speed - a.d.speed;
        const da = (a.x - tw.x) ** 2 + (a.y - tw.y) ** 2, db = (b.x - tw.x) ** 2 + (b.y - tw.y) ** 2;
        return da - db;
      });
      return c[0];
    }

    metaphorPass() {
      const TILE = this.BAL.TILE;
      for (const e of this.enemies) {
        if (!e.d.disable || e.hp <= 0) continue;
        const R = 1.5 * TILE;
        for (const tw of this.towers) {
          if (tw.type === 'miner') continue;
          if ((tw.x - e.x) ** 2 + (tw.y - e.y) ** 2 < R * R) tw.disabled = true;
        }
        const lost = 1 - e.hp / e.maxHp;
        const stage = lost >= 0.75 ? 3 : lost >= 0.5 ? 2 : lost >= 0.25 ? 1 : 0;
        if (stage > 0) {
          const sorted = this.towers.filter(t => t.type !== 'miner').sort((a, b) => (b.level - a.level) || (b.invested - a.invested));
          for (let i = 0; i < Math.min(stage, sorted.length); i++) sorted[i].disabled = true;
        }
      }
    }

    // ---------- combat ----------
    damageEnemy(e, amount, tw, opts) {
      opts = opts || {};
      if (e.hp <= 0) return 0;
      let dmg = amount;
      let critCh = (this.RFX && this.RFX.critCh) || 0, critMul = 2;
      if (tw && tw.m.crit) { critCh = Math.max(critCh, tw.m.crit.ch); critMul = tw.m.crit.mul; }
      if (!opts.noCrit && critCh > 0 && Math.random() < critCh) { dmg *= critMul; this.floater(e.x, e.y - 20, 'CRIT!', '#ffe27a', 15); }
      if (e.d.boss) dmg *= (this.RFX && this.RFX.bossDmgMul) || 1;
      if (tw && tw.m.execute && e.hp >= e.maxHp * 0.999) dmg *= 1 + tw.m.execute;
      if (tw && tw.m.coldBonus && e.curSlow < 0.99) dmg *= 1 + tw.m.coldBonus;
      if (e.brittle > 0) dmg *= 1 + e.brittle;
      if (!opts.pure) dmg = Math.max(1, dmg - (e.d.armor || 0));
      dmg = Math.round(dmg);
      e.hp -= dmg;
      if (tw && !opts.noXp) this.addXp(tw, dmg * 0.02 + (e.hp <= 0 ? 8 : 0));
      if (e.hp <= 0) this.killEnemy(e, tw);
      return dmg;
    }
    killEnemy(e, tw) {
      e.hp = 0;
      this.kills++;
      this.trophies++;
      let rw = Math.round(e.d.reward * this.BAL.rewardMul(this.wave) * this.diff.rw * (this.RFX.coinMul || 1) * (tw && tw.m.bounty ? 1 + tw.m.bounty : 1));
      this.coins += rw; this.earned += rw;
      this.score += 10 + (e.d.boss ? 1000 : 0);
      if (tw) { tw.kills++; this.towerKills[tw.type] = (this.towerKills[tw.type] || 0) + 1; }
      if (e.d.split) for (let i = 0; i < (e.d.splitN || 2); i++) this.spawnEnemyAt(e.d.split, e.dist - i * 8);
      if (e.d.spawner && e.d.spawner.at.includes(0)) {
        for (let i = 0; i < e.d.spawner.n; i++) this.spawnEnemyAt(e.d.spawner.type, e.dist - 20 - i * 14);
      }
      if (e.d.boss) {
        this.bossTypes.add(e.type);
        if (this.bossTypes.size >= 4) this.emit('ach', { id: 'allboss' });
      }
      this.questTick();
      if (this.kills === 1) this.emit('ach', { id: 'first_blood' });
      if (this.kills === 500) this.emit('ach', { id: 'kills500' });
      if (this.kills === 2500) this.emit('ach', { id: 'kills2500' });
      if (this.earned >= 5000) this.emit('ach', { id: 'rich' });
      if (e.d.boss) {
        this.bosses++;
        this.rpEarned += 2;
        this.emit('rp', { n: 2 });
        if (this.bosses >= 5) this.emit('ach', { id: 'boss5' });
        this.burst(e.x, e.y, '#ff5d7e', 40, 320);
        this.shake = Math.min(14, this.shake + 10);
      } else {
        this.burst(e.x, e.y, e.d.color, 8, 140);
      }
      if (e.grab) { const g = e.grab; e.grab = null; if (g.tw) g.tw.grabs = g.tw.grabs.filter(x => x !== g); }
      this.enemies = this.enemies.filter(x => x !== e);
    }

    explode(x, y, radiusPx, dmg, tw, airCap, quiet) {
      if (!quiet) {
        this.burst(x, y, '#ffb52e', 18, 240);
        this.burst(x, y, '#ff6b4a', 10, 160);
        this.ring(x, y, radiusPx, '#ffd968');
        this.shake = Math.min(10, this.shake + 2);
      } else {
        this.burst(x, y, '#ff7ad9', 4, 90);
      }
      for (const e of [...this.enemies]) {
        if (airCap === 0 && e.d.flying) continue;
        if (airCap === 2 && !e.d.flying) continue;
        const dx = e.x - x, dy = e.y - y;
        if (dx * dx + dy * dy <= (radiusPx + e.d.r) * (radiusPx + e.d.r)) this.damageEnemy(e, dmg, tw);
      }
    }

    fireProj(o) { this.projs.push(Object.assign({ uid: UID++, kind: 'bolt', r: 5, pierce: 0, traveled: 0, maxDist: 600, color: '#fff', trail: 0 }, o)); }

    // ---------- per-kind fire ----------
    tryFire(tw, dt) {
      const def = tw.def;
      if (tw.disabled && tw.type !== 'miner') return;
      switch (tw.type) {
        case 'miner': {
          tw.tick += dt;
          const period = 5 * (tw.m.tickMul || 1);
          if (tw.tick >= period) {
            tw.tick -= period;
            const gain = Math.round(def.income * (1 + 0.25 * (tw.level - 1)) * (tw.m.incMul || 1) * (this.RFX.minerMul || 1) * (this.RFX.coinMul || 1) * (this.upg.miner || 1));
            this.coins += gain; this.earned += gain; this.minerEarned += gain;
            this.floater(tw.x, tw.y - 34, '+' + gain, '#5ef2b8');
            if (this.crystalSet.has(tw.gx + ',' + tw.gy)) {
              this.crystalsEarned++;
              try { globalThis.STORE.S.research.crystals++; globalThis.STORE.save(); } catch (e) {}
              this.floater(tw.x, tw.y - 52, '+1 \uD83D\uDC8E', '#5ef2d8');
            }
            this.questTick();
            this.addXp(tw, gain * 0.15);
            this.burst(tw.x, tw.y - 10, '#5ef2b8', 4, 80);
          }
          return;
        }
        case 'freezing': {
          const range = this.tRange(tw);
          const slow = Math.min(0.9, (def.slow + (tw.m.slowPlus || 0)) * (this.upg.freezing || 1));
          let n = 0;
          for (const e of this.enemies) {
            if (!this.inRange(tw, e, range)) continue;
            const res = 1 - (e.d.slowRes || 0);
            e.slowT = 0.2; e.slowMul = Math.min(e.slowMul === 1 ? 2 : e.slowMul, 1 - slow * res);
            if (tw.m.brittle) e.brittle = Math.max(e.brittle, tw.m.brittle);
            n++;
          }
          if (n) { this.addXp(tw, n * dt * 3); if (Math.random() < dt * 3) this.ring(tw.x, tw.y, range, '#9fe8ff', 0.5); }
          return;
        }
        case 'minigun': {
          const tgt = this.pickTarget(tw, this.enemies);
          if (tgt) { tw.spin = Math.min(1, tw.spin + dt * 0.9 * (tw.m.spinMul || 1)); }
          else { tw.spin = Math.max(0, tw.spin - dt * 1.2); tw.cd = 0; return; }
          const maxR = (def.maxRate + (tw.m.maxRatePlus || 0)) * (tw.m.maxRateMul || 1) * tw.m.rateMul * this.RFX.rateMul * (tw.chilled ? 0.7 : 1);
          const rate = def.rate * tw.m.rateMul + (maxR - def.rate * tw.m.rateMul) * tw.spin;
          tw.angle = Math.atan2(tgt.y - tw.y, tgt.x - tw.x);
          tw.cd -= dt;
          if (tw.cd <= 0) {
            tw.cd = 1 / Math.max(0.5, rate);
            const maxed = tw.spin > 0.95;
            this.fireProj({ x: tw.x, y: tw.y, angle: tw.angle, speed: this.tPs(tw), dmg: this.tDmg(tw), tw, air: 0, color: '#8affda', r: 4, ignite: tw.m.maxIgnite && maxed ? 0.3 : 0 });
          }
          return;
        }
        case 'sniper': {
          const tgt = this.pickTarget(tw, this.enemies);
          if (!tgt) { tw.aimT = 0; tw.aimUid = 0; return; }
          if (tgt.uid !== tw.aimUid) { tw.aimUid = tgt.uid; tw.aimT = 0; }
          tw.angle = Math.atan2(tgt.y - tw.y, tgt.x - tw.x);
          const aimNeed = def.aim * (tw.m.aimMul || 1);
          tw.aimT += dt;
          if (tw.aimT >= aimNeed) {
            tw.aimT = -(1 / this.tRate(tw)) + aimNeed; // reload after shot
            if (tw.aimT > aimNeed) tw.aimT = aimNeed;
            const from = { x: tw.x, y: tw.y };
            this.beam(from, tgt, '#7db4ff', 0.18, 3);
            this.damageEnemy(tgt, this.tDmg(tw), tw);
            const pc = tw.m.pierce || 0;
            if (pc > 0) {
              const others = this.enemies.filter(e => e !== tgt && !e.d.flying && Math.hypot(e.x - tgt.x, e.y - tgt.y) < TILE * (pc > 5 ? 8 : 1.2)).slice(0, pc);
              for (const o of others) { this.beam({ x: tgt.x, y: tgt.y }, o, '#7db4ff', 0.15, 2); this.damageEnemy(o, this.tDmg(tw) * 0.7, tw); }
            }
            this.burst(tgt.x, tgt.y, '#7db4ff', 6, 120);
            globalThis.AUDIO.SFX.sniper();
          }
          return;
        }
        case 'splash': {
          const range = this.tRange(tw);
          const any = this.enemies.some(e => !e.d.flying && this.inRange(tw, e, range));
          if (!any) { tw.cd = 0; return; }
          tw.cd -= dt;
          if (tw.cd <= 0) {
            tw.cd = 1 / this.tRate(tw);
            const n = def.radial + (tw.m.radialPlus || 0);
            const off = Math.random() * 6.28;
            for (let i = 0; i < n; i++) this.fireProj({ x: tw.x, y: tw.y, angle: off + (i / n) * 6.283, speed: this.tPs(tw), dmg: this.tDmg(tw), tw, air: 0, color: '#ffe27a', r: 5, maxDist: range * 1.05 });
            this.ring(tw.x, tw.y, 30, '#ffe27a', 0.4);
            globalThis.AUDIO.SFX.shoot();
          }
          return;
        }
        case 'blast': {
          const range = this.tRange(tw);
          const any = this.enemies.some(e => !e.d.flying && this.inRange(tw, e, range));
          if (!any) { tw.cd = 0; return; }
          tw.cd -= dt;
          if (tw.cd <= 0) {
            tw.cd = 1 / this.tRate(tw);
            const stun = def.stun + (tw.m.stunPlus || 0);
            const dmg = this.tDmg(tw);
            for (const e of [...this.enemies]) {
              if (e.d.flying || !this.inRange(tw, e, range)) continue;
              this.damageEnemy(e, dmg, tw);
              if (!e.d.stunImmune) e.stun = Math.max(e.stun, stun);
              if (tw.m.knock) e.dist = Math.max(0, e.dist - tw.m.knock);
            }
            this.ring(tw.x, tw.y, range, '#ff6b4a', 0.7);
            this.burst(tw.x, tw.y, '#ff6b4a', 20, 260);
            this.shake = Math.min(8, this.shake + 2);
            globalThis.AUDIO.SFX.blast();
          }
          return;
        }
        case 'tesla': {
          const tgt = this.pickTarget(tw, this.enemies);
          if (!tgt) { tw.cd = 0; return; }
          tw.cd -= dt;
          if (tw.cd <= 0) {
            tw.cd = 1 / this.tRate(tw);
            let jumps = def.jumps + (tw.m.jumpsPlus || 0) + (tgt.curSlow < 0.99 ? 2 : 0);
            const fall = tw.m.falloff || def.falloff;
            let dmg = this.tDmg(tw);
            let from = { x: tw.x, y: tw.y - 20 };
            let cur = tgt;
            const hitSet = new Set();
            for (let j = 0; j < jumps && cur; j++) {
              this.zap(from, cur);
              this.damageEnemy(cur, dmg, tw);
              if (tw.m.tStun && !cur.d.stunImmune) cur.stun = Math.max(cur.stun, tw.m.tStun);
              hitSet.add(cur.uid);
              from = { x: cur.x, y: cur.y };
              dmg *= fall;
              const jr = def.jumpR * TILE;
              let best = null, bd = jr * jr;
              for (const e of this.enemies) {
                if (hitSet.has(e.uid) || !this.canHit(tw, e)) continue;
                const dd = (e.x - from.x) ** 2 + (e.y - from.y) ** 2;
                if (dd < bd) { bd = dd; best = e; }
              }
              cur = best;
            }
            globalThis.AUDIO.SFX.tesla();
          }
          return;
        }
        case 'flame': {
          const tgt = this.pickTarget(tw, this.enemies);
          if (!tgt) return;
          const want = Math.atan2(tgt.y - tw.y, tgt.x - tw.x);
          tw.angle = this.turnTo(tw.angle, want, 3.2 * dt);
          const range = this.tRange(tw);
          const dps = this.tDmg(tw) * tw.m.dmgMul * 0 + this.tDmg(tw); // per-second
          for (const e of [...this.enemies]) {
            if (e.d.flying) continue;
            const dx = e.x - tw.x, dy = e.y - tw.y;
            const dd = Math.hypot(dx, dy);
            if (dd > range) continue;
            let da = Math.abs(this.angDiff(Math.atan2(dy, dx), tw.angle));
            if (da < 0.45) {
              this.damageEnemy(e, dps * dt, tw, { noXp: Math.random() > 0.1 });
              e.burnT = Math.max(e.burnT, def.bdur); e.burnDps = Math.max(e.burnDps, def.bdps * (tw.m.bMul || 1) * (1 + 0.18 * (tw.level - 1)));
              if (tw.m.coldFire) { e.slowT = 0.2; e.slowMul = Math.min(e.slowMul === 1 ? 2 : e.slowMul, 1 - tw.m.coldFire); }
            }
          }
          if (Math.random() < dt * 40) {
            const a = tw.angle + (Math.random() - 0.5) * 0.7;
            const d = range * (0.3 + Math.random() * 0.7);
            this.parts.push({ x: tw.x + Math.cos(a) * d * 0.5, y: tw.y + Math.sin(a) * d * 0.5, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60 - 30, t: 0, life: 0.35, r: 6 + Math.random() * 8, color: Math.random() < 0.5 ? '#ffb52e' : '#ff6b4a' });
          }
          globalThis.AUDIO.SFX.flame();
          return;
        }
        case 'laser': {
          if (tw.fireT > 0) {
            tw.fireT -= dt;
            if (tw.m.lRot) { const t = this.pickTarget(tw, this.enemies); if (t) tw.angle = this.turnTo(tw.angle, Math.atan2(t.y - tw.y, t.x - tw.x), 6 * dt); }
            return;
          }
          const tgt = this.pickTarget(tw, this.enemies);
          if (!tgt) { tw.charge = 0; return; }
          tw.angle = this.turnTo(tw.angle, Math.atan2(tgt.y - tw.y, tgt.x - tw.x), 2.2 * dt);
          const need = def.charge * (tw.m.chargeMul || 1) / (1 + 0.04 * (tw.level - 1));
          tw.charge += dt;
          if (Math.random() < dt * 12) this.burst(tw.x + Math.cos(tw.angle) * 24, tw.y + Math.sin(tw.angle) * 24, '#ff4d6d', 1, 40);
          if (tw.charge >= need) {
            tw.charge = 0; tw.fireT = 0.45;
            const range = this.tRange(tw);
            const ex = tw.x + Math.cos(tw.angle) * range, ey = tw.y + Math.sin(tw.angle) * range;
            // find enemies along the beam
            const hits = [];
            for (const e of this.enemies) {
              if (e.d.flying) continue;
              const d = this.distToSeg(e.x, e.y, tw.x, tw.y, ex, ey);
              if (d < e.d.r + 8) hits.push({ e, t: Math.hypot(e.x - tw.x, e.y - tw.y) });
            }
            hits.sort((a, b) => a.t - b.t);
            const pierce = tw.m.lPierce;
            const targets = pierce ? hits : hits.slice(0, 1);
            let dmg = this.tDmg(tw);
            let endX = ex, endY = ey;
            for (const h of targets) {
              this.damageEnemy(h.e, dmg, tw);
              if (tw.m.lIgnite) { h.e.burnT = 3; h.e.burnDps = Math.max(h.e.burnDps, 12); }
              dmg *= pierce || 1;
              endX = h.e.x; endY = h.e.y;
              if (!pierce) break;
            }
            this.beams.push({ x1: tw.x, y1: tw.y, x2: endX, y2: endY, t: 0, life: 0.4, color: '#ff4d6d', w: 7 });
            this.shake = Math.min(8, this.shake + 2);
            globalThis.AUDIO.SFX.laser();
          }
          return;
        }
        case 'gauss': {
          const tgt = this.pickTarget(tw, this.enemies);
          if (!tgt) { tw.cd = 0; return; }
          tw.angle = Math.atan2(tgt.y - tw.y, tgt.x - tw.x);
          tw.cd -= dt;
          if (tw.cd <= 0) {
            tw.cd = 1 / this.tRate(tw);
            const shots = tw.m.gDouble ? 2 : 1;
            for (let s = 0; s < shots; s++) {
              const range = this.tRange(tw);
              const a = tw.angle + (s === 1 ? 0.03 : 0);
              const ex = tw.x + Math.cos(a) * range, ey = tw.y + Math.sin(a) * range;
              for (const e of [...this.enemies]) {
                if (e.d.flying) continue;
                if (this.distToSeg(e.x, e.y, tw.x, tw.y, ex, ey) < e.d.r + 10) {
                  this.damageEnemy(e, this.tDmg(tw), tw);
                  if (tw.m.gStun && !e.d.stunImmune) e.stun = Math.max(e.stun, tw.m.gStun);
                }
              }
              this.beams.push({ x1: tw.x, y1: tw.y, x2: ex, y2: ey, t: 0, life: 0.35, color: '#b06bff', w: 9 });
              this.beams.push({ x1: tw.x, y1: tw.y, x2: ex, y2: ey, t: 0, life: 0.25, color: '#fff', w: 3 });
            }
            this.shake = Math.min(9, this.shake + 3);
            globalThis.AUDIO.SFX.gauss();
          }
          return;
        }
        case 'crusher': {
          const range = this.tRange(tw);
          const slots = def.arms + (tw.m.armsPlus || 0);
          // release expired
          for (const g of [...tw.grabs]) {
            g.t -= dt;
            this.damageEnemy(g.e, this.tDmg(tw) * dt, tw, { noXp: Math.random() > 0.15 });
            if (g.t <= 0 || g.e.hp <= 0) {
              if (g.e.hp > 0) { g.e.grab = null; if (!g.e.d.stunImmune) g.e.stun = Math.max(g.e.stun, 0.5); }
              tw.grabs = tw.grabs.filter(x => x !== g);
            }
          }
          // grab new
          if (tw.grabs.length < slots) {
            const hold = def.hold + (tw.m.holdPlus || 0);
            for (const e of this.enemies) {
              if (tw.grabs.length >= slots) break;
              if (e.d.flying || e.grab || e.d.boss) continue;
              if (!this.inRange(tw, e, range)) continue;
              const g = { tw, e, t: hold };
              e.grab = g; tw.grabs.push(g);
              globalThis.AUDIO.SFX.crush();
            }
          }
          // boss slow
          const bs = tw.m.bossSlow || 0.25;
          for (const e of this.enemies) {
            if (!e.d.boss || !this.inRange(tw, e, range)) continue;
            e.slowT = 0.2; e.slowMul = Math.min(e.slowMul === 1 ? 2 : e.slowMul, 1 - bs);
          }
          tw.angle += dt * (tw.grabs.length ? 2.4 : 0.5);
          return;
        }
        case 'heli': {
          const want = this.droneCount(tw);
          while (tw.drones.length < want) tw.drones.push(this.mkDrone(tw));
          const opR = this.tRange(tw);
          for (const dr of tw.drones) {
            dr.rotor += dt * 30;
            // find target
            let best = null, bd = opR * opR;
            for (const e of this.enemies) {
              if (!this.canHit(tw, e)) continue;
              const dd = (e.x - tw.x) ** 2 + (e.y - tw.y) ** 2;
              if (dd < bd) { bd = dd; best = e; }
            }
            const hx = best ? best.x + Math.cos(dr.rotor * 0.2 + dr.cd * 5) * 70 : tw.x;
            const hy = best ? best.y - 60 + Math.sin(dr.rotor * 0.2) * 20 : tw.y - 70;
            const dx = hx - dr.x, dy = hy - dr.y, dd = Math.hypot(dx, dy) || 1;
            const sp = Math.min(dd * 3, 260);
            dr.x += (dx / dd) * sp * dt; dr.y += (dy / dd) * sp * dt;
            if (best) {
              dr.angle = Math.atan2(best.y - dr.y, best.x - dr.x);
              dr.cd -= dt;
              const md = Math.hypot(best.x - dr.x, best.y - dr.y);
              if (dr.cd <= 0 && md < opR) {
                dr.cd = 1 / (this.tRate(tw));
                const dmg = this.tDmg(tw);
                if (tw.m.dSplash) {
                  this.explode(best.x, best.y, tw.m.dSplash * TILE, dmg * 0.7, tw, 1);
                  this.beam({ x: dr.x, y: dr.y }, best, '#ffd968', 0.12, 2);
                } else {
                  this.fireProj({ x: dr.x, y: dr.y, angle: dr.angle, speed: 640, dmg, tw, air: 1, color: '#ffd968', r: 4 });
                }
                globalThis.AUDIO.SFX.shoot();
              }
            }
          }
          return;
        }
        case 'plasma': {
          const tgt = this.pickTarget(tw, this.enemies);
          if (!tgt) { tw.cd = 0; return; }
          tw.angle = Math.atan2(tgt.y - tw.y, tgt.x - tw.x);
          tw.cd -= dt;
          if (tw.cd <= 0) {
            tw.cd = 1 / this.tRate(tw);
            const n = tw.m.pMulti || 1;
            for (let i = 0; i < n; i++) {
              this.fireProj({ kind: 'homing', x: tw.x, y: tw.y, angle: tw.angle + (Math.random() - 0.5) * 0.5, speed: this.tPs(tw), dmg: this.tDmg(tw), tw, air: 1, color: '#ff7ad9', r: 6, splash: (tw.m.pSplash || 0) * TILE, quiet: !tw.m.pSplash, target: i === 0 ? tgt : null, turn: 6 });
            }
            globalThis.AUDIO.SFX.shoot();
          }
          return;
        }
        case 'missile': {
          const tgt = this.pickTarget(tw, this.enemies);
          tw.cd -= dt;
          // LRM: global strike when idle
          tw.lrmT = (tw.lrmT || 0) - dt;
          if (!tgt) {
            if (tw.lrmT <= 0 && this.enemies.length) {
              tw.lrmT = def.lrm;
              const any = this.enemies[Math.floor(Math.random() * this.enemies.length)];
              this.fireProj({ kind: 'homing', x: tw.x, y: tw.y - 20, angle: -Math.PI / 2, speed: this.tPs(tw) * 1.4, dmg: this.tDmg(tw), tw, air: 1, color: '#ff8ad8', r: 6, splash: def.splash * TILE * (tw.m.splashMul || 1), target: any, turn: 4 });
              globalThis.AUDIO.SFX.missile();
            }
            return;
          }
          tw.angle = Math.atan2(tgt.y - tw.y, tgt.x - tw.x);
          if (tw.cd <= 0) {
            tw.cd = 1 / this.tRate(tw);
            const n = tw.m.barrage || 1;
            for (let i = 0; i < n; i++) {
              this.fireProj({ kind: 'homing', x: tw.x, y: tw.y - 10, angle: tw.angle + (Math.random() - 0.5) * 0.6 - 0.5, speed: this.tPs(tw), dmg: this.tDmg(tw), tw, air: 1, color: '#ff8ad8', r: 6, splash: def.splash * TILE * (tw.m.splashMul || 1), target: tgt, turn: 5, delay: i * 0.12 });
            }
            globalThis.AUDIO.SFX.missile();
          }
          return;
        }
        case 'venom': {
          const tgt = this.pickTarget(tw, this.enemies);
          if (!tgt) { tw.cd = 0; return; }
          tw.angle = Math.atan2(tgt.y - tw.y, tgt.x - tw.x);
          tw.cd -= dt;
          if (tw.cd <= 0) {
            tw.cd = 1 / this.tRate(tw);
            this.fireProj({ x: tw.x, y: tw.y, angle: tw.angle, speed: this.tPs(tw), dmg: this.tDmg(tw), tw, air: 0, color: '#7dff5e', r: 7,
              venom: { dps: def.pdps * (tw.m.pMul || 1) * (1 + 0.18 * (tw.level - 1)), dur: (def.pdur + (tw.m.pDur || 0)) * (tw.m.pDurMul || 1), max: 3 + (tw.m.pStacks || 0), slow: tw.m.pSlow || 0 } });
            globalThis.AUDIO.SFX.venom();
          }
          return;
        }
        case 'cannon': {
          const tgt = this.pickTarget(tw, this.enemies);
          if (!tgt) { tw.cd = 0; return; }
          // lead the target
          const tof = Math.hypot(tgt.x - tw.x, tgt.y - tw.y) / this.tPs(tw);
          const px = tgt.x + Math.cos(tgt.ang) * tgt.d.speed * TILE * tof * 0.8;
          const py = tgt.y + Math.sin(tgt.ang) * tgt.d.speed * TILE * tof * 0.8;
          tw.angle = Math.atan2(py - tw.y, px - tw.x);
          tw.cd -= dt;
          if (tw.cd <= 0) {
            tw.cd = 1 / this.tRate(tw);
            this.fireProj({ kind: 'shell', x: tw.x, y: tw.y, tx: px, ty: py, angle: tw.angle, speed: this.tPs(tw), dmg: this.tDmg(tw), tw, air: 0, color: '#ff9a3c', r: 7, splash: def.splash * TILE * (tw.m.splashMul || 1), shrapnel: tw.m.shrapnel || 0 });
            globalThis.AUDIO.SFX.cannon();
          }
          return;
        }
        case 'antiair': {
          const tgt = this.pickTarget(tw, this.enemies);
          if (!tgt) { tw.cd = 0; return; }
          tw.angle = Math.atan2(tgt.y - tw.y, tgt.x - tw.x);
          tw.cd -= dt;
          if (tw.cd <= 0) {
            tw.cd = 1 / this.tRate(tw);
            this.fireProj({ x: tw.x, y: tw.y, angle: tw.angle + (Math.random() - 0.5) * 0.08, speed: this.tPs(tw), dmg: this.tDmg(tw), tw, air: 2, color: '#ff5d7e', r: 4, ignite: tw.m.ignite || 0, flak: tw.m.flak || 0 });
            globalThis.AUDIO.SFX.shoot();
          }
          return;
        }
        case 'multishot': {
          const tgt = this.pickTarget(tw, this.enemies);
          if (!tgt) { tw.cd = 0; return; }
          tw.angle = Math.atan2(tgt.y - tw.y, tgt.x - tw.x);
          tw.cd -= dt;
          if (tw.cd <= 0) {
            tw.cd = 1 / this.tRate(tw);
            const n = def.count + (tw.m.countPlus || 0);
            for (let i = 0; i < n; i++) {
              const a = tw.angle + (i - (n - 1) / 2) * 0.16;
              this.fireProj({ x: tw.x, y: tw.y, angle: a, speed: this.tPs(tw), dmg: this.tDmg(tw), tw, air: 1, color: '#c792ff', r: 4, pierce: tw.m.pierce || 0 });
            }
            globalThis.AUDIO.SFX.shoot();
          }
          return;
        }
        default: { // basic
          const tgt = this.pickTarget(tw, this.enemies);
          if (!tgt) { tw.cd = 0; return; }
          tw.angle = Math.atan2(tgt.y - tw.y, tgt.x - tw.x);
          tw.cd -= dt;
          if (tw.cd <= 0) {
            tw.cd = 1 / this.tRate(tw);
            this.fireProj({ x: tw.x, y: tw.y, angle: tw.angle, speed: this.tPs(tw), dmg: this.tDmg(tw), tw, air: 0, color: '#e8ecff', r: 5, ricochet: tw.m.ricochet || 0 });
            globalThis.AUDIO.SFX.shoot();
          }
        }
      }
    }

    // ---------- projectiles ----------
    updateProjs(dt) {
      for (const p of [...this.projs]) {
        if (p.delay && p.delay > 0) { p.delay -= dt; continue; }
        if (p.kind === 'shell') {
          const dx = p.tx - p.x, dy = p.ty - p.y, dd = Math.hypot(dx, dy);
          const step = p.speed * dt;
          if (dd <= step + 4) {
            this.explode(p.tx, p.ty, p.splash, p.dmg, p.tw, p.air);
            if (p.shrapnel) for (let i = 0; i < p.shrapnel; i++) {
              const a = Math.random() * 6.28;
              this.fireProj({ x: p.tx, y: p.ty, angle: a, speed: 420, dmg: p.dmg * 0.35, tw: p.tw, air: 0, color: '#ff9a3c', r: 4, maxDist: 130 });
            }
            globalThis.AUDIO.SFX.boom();
            this.projs = this.projs.filter(x => x !== p);
          } else { p.x += (dx / dd) * step; p.y += (dy / dd) * step; p.angle = Math.atan2(dy, dx); }
          continue;
        }
        if (p.kind === 'homing') {
          if (!p.target || p.target.hp <= 0) {
            let best = null, bd = 1e12;
            for (const e of this.enemies) { const dd = (e.x - p.x) ** 2 + (e.y - p.y) ** 2; if (dd < bd) { bd = dd; best = e; } }
            p.target = best;
          }
          if (p.target) {
            const want = Math.atan2(p.target.y - p.y, p.target.x - p.x);
            p.angle = this.turnTo(p.angle, want, (p.turn || 5) * dt);
            const dd = Math.hypot(p.target.x - p.x, p.target.y - p.y);
            if (dd < p.target.d.r + 10) {
              this.explode(p.target.x, p.target.y, p.splash, p.dmg, p.tw, p.air, p.quiet);
              globalThis.AUDIO.SFX.boom();
              this.projs = this.projs.filter(x => x !== p);
              continue;
            }
          }
          p.x += Math.cos(p.angle) * p.speed * dt;
          p.y += Math.sin(p.angle) * p.speed * dt;
          p.traveled += p.speed * dt;
          if (Math.random() < dt * 30) this.parts.push({ x: p.x, y: p.y, vx: 0, vy: -20, t: 0, life: 0.3, r: 4, color: '#ffb52e' });
          if (p.traveled > 2400 || p.x < -100 || p.x > 1380 || p.y < -100 || p.y > 868) this.projs = this.projs.filter(x => x !== p);
          continue;
        }
        // straight bolt
        p.x += Math.cos(p.angle) * p.speed * dt;
        p.y += Math.sin(p.angle) * p.speed * dt;
        p.traveled += p.speed * dt;
        let dead = p.traveled > (p.maxDist || 700) || p.x < -60 || p.x > 1340 || p.y < -60 || p.y > 828;
        if (!dead) {
          for (const e of [...this.enemies]) {
            if (p.air === 0 && e.d.flying) continue;
            if (p.air === 2 && !e.d.flying) continue;
            if (p.hitSet && p.hitSet.has(e.uid)) continue;
            if (Math.hypot(e.x - p.x, e.y - p.y) < e.d.r + p.r) {
              if (e.d.dodge && Math.random() < e.d.dodge && !p.nododge) { this.floater(e.x, e.y - 22, 'MISS', '#9aa5d6', 12); continue; }
              if (p.flak) { this.explode(e.x, e.y, p.flak * TILE, p.dmg * 0.8, p.tw, 2); }
              else this.damageEnemy(e, p.dmg, p.tw);
              if (p.venom && !e.d.poisonImmune && e.hp > 0) {
                e.poison.push({ dps: p.venom.dps, t: p.venom.dur, slow: p.venom.slow });
                while (e.poison.length > p.venom.max) e.poison.shift();
              }
              if (p.ignite && Math.random() < p.ignite && e.hp > 0) { e.burnT = Math.max(e.burnT, 3); e.burnDps = Math.max(e.burnDps, p.dmg * 0.5); }
              if (p.ricochet && Math.random() < p.ricochet) {
                let best = null, bd = (1.5 * TILE) ** 2;
                for (const o of this.enemies) { if (o === e || o.d.flying) continue; const dd = (o.x - e.x) ** 2 + (o.y - e.y) ** 2; if (dd < bd) { bd = dd; best = o; } }
                if (best) { this.beam({ x: e.x, y: e.y }, best, '#39f5c8', 0.12, 2); this.damageEnemy(best, p.dmg * 0.7, p.tw); }
              }
              globalThis.AUDIO.SFX.hit();
              if (p.pierce > 0) { p.pierce--; (p.hitSet = p.hitSet || new Set()).add(e.uid); }
              else { dead = true; break; }
            }
          }
        }
        if (dead) this.projs = this.projs.filter(x => x !== p);
      }
    }

    // ---------- enemies ----------
    updateEnemies(dt) {
      const spdM = this.BAL.spdMul(this.wave);
      for (const e of [...this.enemies]) {
        if (e.hp <= 0) continue;
        // timers
        if (e.stun > 0) e.stun -= dt;
        if (e.slowT > 0) { e.slowT -= dt; if (e.slowT <= 0) e.slowMul = 1; }
        else e.slowMul = 1;
        // poison dots
        let pSlow = 0;
        for (const dot of [...e.poison]) {
          dot.t -= dt;
          let dps = dot.dps * (e.curSlow < 0.99 ? 1.5 : 1); // frost synergy
          if (e.d.flying && false) dps = 0;
          this.damageEnemy(e, dps * dt, null, { pure: true, noXp: true, noCrit: true });
          if (dot.slow) pSlow = Math.max(pSlow, dot.slow);
          if (e.type === 'fast') pSlow = Math.max(pSlow, 0.07 * e.poison.length);
          if (dot.t <= 0) e.poison = e.poison.filter(x => x !== dot);
          if (e.hp <= 0) break;
        }
        if (e.hp <= 0) continue;
        // burn
        if (e.burnT > 0) {
          e.burnT -= dt;
          this.damageEnemy(e, e.burnDps * dt, null, { pure: true, noXp: true, noCrit: true });
          if (Math.random() < dt * 10) this.parts.push({ x: e.x + (Math.random() - 0.5) * 16, y: e.y - 8, vx: 0, vy: -40, t: 0, life: 0.3, r: 4, color: '#ff9a3c' });
          if (e.hp <= 0) continue;
        }
        // boss spawner thresholds
        if (e.d.spawner && e.hp > 0) {
          e.spawned = e.spawned || {};
          const frac = e.hp / e.maxHp;
          e.d.spawner.at.forEach((t, i) => {
            if (t > 0 && !e.spawned[i] && frac <= t) {
              e.spawned[i] = true;
              for (let k = 0; k < e.d.spawner.n; k++) this.spawnEnemyAt(e.d.spawner.type, e.dist - 30 - k * 16);
              this.floater(e.x, e.y - 40, '!', '#ffa53c', 22);
            }
          });
        }
        // slow calc
        let slow = e.slowMul;
        if (pSlow > 0) { const res = 1 - (e.d.slowRes || 0); slow = Math.min(slow, 1 - pSlow * res); }
        e.curSlow = slow;
        e.brittle = 0; // refreshed by freezing auras each tick (before? after?) — set in tower phase; keep decay:
        // healer aura
        if (e.d.heal) {
          e.healCd -= dt;
          if (e.healCd <= 0) {
            e.healCd = 1;
            for (const o of this.enemies) {
              if (o === e || o.hp >= o.maxHp || o.d.healerImmune) continue;
              if (Math.hypot(o.x - e.x, o.y - e.y) < 2 * TILE) {
                o.hp = Math.min(o.maxHp, o.hp + e.d.heal + this.wave * 1.5);
                if (Math.random() < 0.4) this.parts.push({ x: o.x, y: o.y - 10, vx: 0, vy: -30, t: 0, life: 0.5, r: 4, color: '#7dff5e' });
              }
            }
          }
        }
        // move
        const grabbed = !!e.grab;
        if (e.stun <= 0 && !grabbed) {
          e.dist += e.d.speed * TILE * spdM * slow * dt;
        }
        const pos = this.BAL.posAt(this.path, e.dist);
        e.x = pos.x; e.y = pos.y; e.ang = pos.ang;
        e.bob += dt * 6;
        // leak
        if (e.dist >= this.path.total - 1) {
          this.enemies = this.enemies.filter(x => x !== e);
          this.lives -= e.d.dmg;
          this.noLeak = 0;
          this.burst(this.path.base.x, this.path.base.y, '#ff5d7e', 16, 220);
          this.emit('leak', { lives: this.lives });
          if (this.lives <= 0) { this.lives = 0; this.gameOver(false); return; }
        }
      }
      // icy chill towers
      for (const tw of this.towers) {
        tw.chilled = false;
        for (const e of this.enemies) {
          if (e.type !== 'icy') continue;
          if (Math.hypot(e.x - tw.x, e.y - tw.y) < 2.5 * TILE) { tw.chilled = true; break; }
        }
      }
    }

    // ---------- strikes ----------
    updateStrikes(dt) {
      for (const s of [...this.strikes]) {
        s.t += dt; s.x += s.vx * dt;
        s.cd -= dt;
        if (s.cd <= 0 && this.enemies.length) {
          s.cd = 0.35;
          const tgt = [...this.enemies].sort((a, b) => b.hp - a.hp)[0];
          this.explode(tgt.x, tgt.y, 1.1 * TILE, 130, null, 1);
          this.beam({ x: s.x, y: s.y + 10 }, tgt, '#ffd968', 0.15, 3);
          globalThis.AUDIO.SFX.boom();
        }
        if (s.x > 1400 || s.t > 9) this.strikes = this.strikes.filter(x => x !== s);
      }
      if (this.strikeCd > 0) this.strikeCd -= dt;
    }

    // ---------- fx ----------
    burst(x, y, color, n, spd) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 6.28, s = spd * (0.3 + Math.random() * 0.7);
        this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, life: 0.4 + Math.random() * 0.4, r: 2 + Math.random() * 4, color });
      }
      if (this.parts.length > 900) this.parts.splice(0, this.parts.length - 900);
    }
    ring(x, y, r, color, life) { this.beams.push({ ring: true, x1: x, y1: y, r, t: 0, life: life || 0.4, color, w: 4 }); }
    beam(a, b, color, life, w) { this.beams.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, t: 0, life: life || 0.2, color, w: w || 2 }); }
    zap(a, b) {
      const pts = [{ x: a.x, y: a.y }];
      const n = 5;
      for (let i = 1; i < n; i++) {
        const t = i / n;
        pts.push({ x: a.x + (b.x - a.x) * t + (Math.random() - 0.5) * 26, y: a.y + (b.y - a.y) * t + (Math.random() - 0.5) * 26 });
      }
      pts.push({ x: b.x, y: b.y });
      this.beams.push({ poly: pts, t: 0, life: 0.18, color: '#7df9ff', w: 3 });
      this.beams.push({ poly: pts, t: 0, life: 0.12, color: '#fff', w: 1 });
    }
    floater(x, y, text, color, size) {
      this.floaters.push({ x, y, text, color: color || '#fff', t: 0, life: 1.1, size: size || 14 });
      if (this.floaters.length > 60) this.floaters.shift();
    }

    // ---------- main update ----------
    update(dtReal) {
      if (this.paused || this.over) return;
      const dt = Math.min(0.05, dtReal) * this.speed;
      this.time += dt;
      // spawner
      if (this.waveActive) {
        this.waveTime += dt;
        while (this.spawnQueue.length && this.spawnQueue[0].t <= this.waveTime) {
          const s = this.spawnQueue.shift();
          this.spawnEnemy(s.type);
        }
        if (!this.spawnQueue.length && !this.enemies.length) this.clearWave();
      } else if (this.started && !this.over) {
        const auto = (globalThis.STORE && globalThis.STORE.S.settings.autowave);
        if (auto) {
          this.autoTimer += dt;
          if (this.autoTimer > 3) { this.autoTimer = 0; this.startNextWave(); }
        }
      }
      // towers
      for (const tw of this.towers) tw.disabled = false;
      this.metaphorPass();
      for (const tw of this.towers) this.tryFire(tw, dt);
      this.updateProjs(dt);
      this.updateEnemies(dt);
      this.updateStrikes(dt);
      // fx timers
      for (const p of [...this.parts]) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.98; p.vy *= 0.98; if (p.t > p.life) this.parts.splice(this.parts.indexOf(p), 1); }
      for (const b of [...this.beams]) { b.t += dt; if (b.t > b.life) this.beams.splice(this.beams.indexOf(b), 1); }
      for (const f of [...this.floaters]) { f.t += dt; f.y -= 34 * dt; if (f.t > f.life) this.floaters.splice(this.floaters.indexOf(f), 1); }
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 26);
      // miner tycoon check
      const miners = this.towers.filter(t => t.type === 'miner').length;
      if (miners >= 5) this.emit('ach', { id: 'tycoon' });
    }

    clearWave() {
      this.waveActive = false;
      const bonus = Math.round((this.waveBonus || 0) * (this.RFX.coinMul || 1) * this.diff.rw);
      this.coins += bonus; this.earned += bonus;
      this.score += 150;
      this.noLeak++;
      this.maxNoLeak = Math.max(this.maxNoLeak, this.noLeak);
      if (this.maxNoLeak >= 10) this.emit('ach', { id: 'flawless' });
      if (this.wave % 5 === 0) { this.rpEarned += 1; this.emit('rp', { n: 1 }); }
      if (this.wave === 5) this.emit('ach', { id: 'wave5' });
      if (this.wave === 10) this.emit('ach', { id: 'wave10' });
      if (this.wave === 20) this.emit('ach', { id: 'wave20' });
      if (this.wave === 30) this.emit('ach', { id: 'wave30' });
      if (this.wave === 35) this.emit('ach', { id: 'endless35' });
      this.emit('waveClear', { wave: this.wave, bonus });
      this.questTick();
      if (this.wave >= 30 && !this.endless && !this.won) { this.won = true; this.gameOver(true); }
    }

    checkBuilderAch() {
      const classic = ['basic', 'sniper', 'cannon', 'freezing', 'antiair', 'splash', 'blast', 'multishot', 'minigun', 'venom', 'tesla', 'missile', 'flame', 'laser', 'gauss', 'crusher'];
      if (classic.every(t => this.builtTypes.has(t))) this.emit('ach', { id: 'builder16' });
    }
    questTick() {
      if (!this.quests) return;
      for (const q of this.quests) {
        if (q.done) continue;
        const d = q.def;
        let v = 0;
        switch (d.ev) {
          case 'kill': v = this.kills; break;
          case 'build': v = this.builtTotal; break;
          case 'types': v = this.builtTypes.size; break;
          case 'wave': v = this.wave; break;
          case 'boss': v = this.bosses; break;
          case 'earn': v = this.earned; break;
          case 'upgrade': v = this.upgrades; break;
          case 'towerKill': v = this.towerKills[d.with] || 0; break;
          case 'mine': v = this.minerEarned; break;
          case 'flawless': v = this.maxNoLeak; break;
          case 'cry': v = this.crystalsEarned; break;
        }
        q.prog = Math.min(d.need, Math.floor(v));
        if (v >= d.need) {
          q.done = true;
          this.questsDone++;
          const r = d.reward || {};
          if (r.coins) { this.coins += r.coins; this.earned += r.coins; }
          if (r.rp) { this.rpEarned += r.rp; this.emit('rp', { n: r.rp }); }
          if (r.cry) { try { globalThis.STORE.S.research.crystals += r.cry; globalThis.STORE.save(); } catch (e) {} }
          this.emit('questDone', { q: d });
          if (this.questsDone >= 3) this.emit('ach', { id: 'quest3' });
        }
      }
    }

    gameOver(win) {
      this.over = true;
      this.paused = true;
      this.emit('gameOver', { win, wave: this.wave, score: Math.round(this.score + this.earned * 0.5), kills: this.kills, earned: this.earned, rp: this.rpEarned, time: this.time });
    }

    // ---------- helpers ----------
    turnTo(a, want, maxStep) {
      let d = want - a;
      while (d > Math.PI) d -= 6.2832;
      while (d < -Math.PI) d += 6.2832;
      return a + Math.max(-maxStep, Math.min(maxStep, d));
    }
    angDiff(a, b) { let d = a - b; while (d > Math.PI) d -= 6.2832; while (d < -Math.PI) d += 6.2832; return d; }
    distToSeg(px, py, x1, y1, x2, y2) {
      const dx = x2 - x1, dy = y2 - y1;
      const L2 = dx * dx + dy * dy || 1;
      let t = ((px - x1) * dx + (py - y1) * dy) / L2;
      t = Math.max(0, Math.min(1, t));
      return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
    }
  }

  globalThis.Game = Game;
})();
