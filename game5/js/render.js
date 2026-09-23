/* INFINITODE 5 — canvas vector renderer */
(function () {
  'use strict';
  const TILE = 64, W = 1280, H = 768;

  class Renderer {
    constructor(canvas, game) {
      this.cv = canvas;
      this.ctx = canvas.getContext('2d');
      this.game = game;
      this.bg = null;
      this.t = 0;
      this.hover = null;      // {c,r}
      this.placing = null;    // tower type
      this.selected = null;
      this.loadBg();
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }
    loadBg() {
      const img = new Image();
      img.src = this.game.map.bg;
      img.onload = () => { this.bg = img; };
    }
    resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = this.cv.getBoundingClientRect();
      this.cw = Math.max(320, rect.width); this.ch = Math.max(200, rect.height);
      this.cv.width = Math.round(this.cw * dpr); this.cv.height = Math.round(this.ch * dpr);
      this.dpr = dpr;
      this.scale = Math.min(this.cw / W, this.ch / H);
      this.ox = (this.cw - W * this.scale) / 2;
      this.oy = (this.ch - H * this.scale) / 2;
    }
    screenToGame(px, py) {
      const rect = this.cv.getBoundingClientRect();
      const x = (px - rect.left - this.ox) / this.scale;
      const y = (py - rect.top - this.oy) / this.scale;
      return { x, y };
    }

    render(dt) {
      this.t += dt;
      const c = this.ctx, g = this.game;
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      c.fillStyle = '#05070f';
      c.fillRect(0, 0, this.cw, this.ch);
      c.translate(this.ox, this.oy);
      c.scale(this.scale, this.scale);
      // shake
      const shakeOn = !(globalThis.STORE && globalThis.STORE.S.settings.shake === false);
      if (g.shake > 0 && shakeOn) c.translate((Math.random() - 0.5) * g.shake, (Math.random() - 0.5) * g.shake);
      c.save();
      c.beginPath(); c.rect(0, 0, W, H); c.clip();

      this.drawBg(c, g);
      this.drawPath(c, g);
      this.drawPortalBase(c, g);
      this.drawCrystals(c, g);
      if (this.placing || this.selected) this.drawGrid(c, g);
      for (const tw of g.towers) this.drawTower(c, g, tw);
      for (const e of g.enemies) this.drawEnemy(c, g, e);
      for (const p of g.projs) this.drawProj(c, p);
      for (const b of g.beams) this.drawBeam(c, b);
      for (const p of g.parts) {
        c.globalAlpha = Math.max(0, 1 - p.t / p.life);
        c.fillStyle = p.color;
        c.beginPath(); c.arc(p.x, p.y, p.r * (1 - p.t / p.life * 0.5), 0, 6.29); c.fill();
      }
      c.globalAlpha = 1;
      for (const s of g.strikes) this.drawStrike(c, s);
      for (const f of g.floaters) {
        c.globalAlpha = Math.max(0, 1 - f.t / f.life);
        c.font = `bold ${f.size}px Arial`;
        c.textAlign = 'center';
        c.lineWidth = 3; c.strokeStyle = '#000';
        c.strokeText(f.text, f.x, f.y);
        c.fillStyle = f.color; c.fillText(f.text, f.x, f.y);
      }
      c.globalAlpha = 1;
      if (this.selected && g.towers.includes(this.selected)) this.drawRange(c, g, this.selected);
      if (this.placing && this.hover) this.drawGhost(c, g);
      c.restore();
    }

    drawBg(c, g) {
      if (this.bg) c.drawImage(this.bg, 0, 0, W, H);
      else { c.fillStyle = '#0d1626'; c.fillRect(0, 0, W, H); }
    }
    drawCrystals(c, g) {
      if (!g.map.crystals) return;
      for (const [cc, rr] of g.map.crystals) {
        const x = cc * TILE + TILE / 2, y = rr * TILE + TILE / 2;
        c.save(); c.translate(x, y);
        c.globalAlpha = 0.3 + Math.sin(this.t * 3 + cc + rr) * 0.12;
        c.fillStyle = '#5ef2d8';
        c.beginPath(); c.moveTo(0, -15); c.lineTo(9, 0); c.lineTo(0, 15); c.lineTo(-9, 0); c.closePath(); c.fill();
        c.globalAlpha = 0.9;
        c.strokeStyle = '#e8fffa'; c.lineWidth = 2; c.stroke();
        c.restore();
      }
      c.globalAlpha = 1;
    }
    drawPath(c, g) {
      const pts = g.path.pts;
      c.lineJoin = 'round'; c.lineCap = 'round';
      c.beginPath();
      c.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y);
      c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 52; c.stroke();
      c.strokeStyle = '#2a3358'; c.lineWidth = 44; c.stroke();
      c.strokeStyle = g.map.accent; c.globalAlpha = 0.25; c.lineWidth = 44; c.stroke();
      c.globalAlpha = 1;
      c.beginPath();
      c.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y);
      c.strokeStyle = '#e8ecff'; c.globalAlpha = 0.5; c.lineWidth = 3;
      c.setLineDash([14, 26]);
      c.lineDashOffset = -this.t * 60;
      c.stroke();
      c.setLineDash([]);
      c.globalAlpha = 1;
    }
    drawPortalBase(c, g) {
      const p = g.path.portal, b = g.path.base;
      // portal
      const px = Math.max(26, Math.min(W - 26, p.x)), py = Math.max(26, Math.min(H - 26, p.y));
      c.save();
      c.translate(px, py);
      for (let i = 0; i < 3; i++) {
        c.rotate(this.t * (1.5 + i * 0.7));
        c.strokeStyle = ['#b06bff', '#2bb3ff', '#39f5c8'][i];
        c.globalAlpha = 0.8;
        c.lineWidth = 5;
        c.beginPath(); c.arc(0, 0, 30 - i * 8, 0, 4.2); c.stroke();
      }
      c.globalAlpha = 1;
      c.fillStyle = '#0b1026';
      c.beginPath(); c.arc(0, 0, 12, 0, 6.29); c.fill();
      c.fillStyle = '#e8ecff';
      c.beginPath(); c.arc(0, 0, 5 + Math.sin(this.t * 6) * 2, 0, 6.29); c.fill();
      c.restore();
      // base
      const bx = Math.max(34, Math.min(W - 34, b.x)), by = Math.max(34, Math.min(H - 34, b.y));
      c.save();
      c.translate(bx, by);
      c.fillStyle = 'rgba(0,0,0,.4)';
      c.beginPath(); c.arc(0, 6, 34, 0, 6.29); c.fill();
      c.fillStyle = '#232c4d';
      c.strokeStyle = '#9aa5d6'; c.lineWidth = 4;
      c.beginPath();
      for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 - 1.57; const x = Math.cos(a) * 32, y = Math.sin(a) * 32; i ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.closePath(); c.fill(); c.stroke();
      const frac = g.lives / g.maxLives;
      c.strokeStyle = frac > 0.5 ? '#39f5c8' : frac > 0.25 ? '#ffd968' : '#ff5d7e';
      c.lineWidth = 6;
      c.beginPath(); c.arc(0, 0, 24, -1.57, -1.57 + frac * 6.283); c.stroke();
      c.fillStyle = '#e8ecff';
      c.font = 'bold 20px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(String(g.lives), 0, 1);
      c.restore();
    }
    drawGrid(c, g) {
      c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = 1;
      c.beginPath();
      for (let i = 0; i <= 20; i++) { c.moveTo(i * TILE, 0); c.lineTo(i * TILE, H); }
      for (let j = 0; j <= 12; j++) { c.moveTo(0, j * TILE); c.lineTo(W, j * TILE); }
      c.stroke();
      if (this.hover && this.placing) {
        const ok = g.tileFree(this.hover.c, this.hover.r) && g.canAfford(this.placing);
        c.fillStyle = ok ? 'rgba(57,245,200,.25)' : 'rgba(255,93,126,.25)';
        c.fillRect(this.hover.c * TILE, this.hover.r * TILE, TILE, TILE);
      }
    }
    drawRange(c, g, tw) {
      if (tw.type === 'miner') return;
      c.fillStyle = 'rgba(255,255,255,.07)';
      c.strokeStyle = '#fff'; c.lineWidth = 2;
      c.beginPath(); c.arc(tw.x, tw.y, g.tRange(tw), 0, 6.29); c.fill(); c.stroke();
    }
    drawGhost(c, g) {
      const def = g.BAL.TOWERS[this.placing];
      const x = (this.hover.c + 0.5) * TILE, y = (this.hover.r + 0.5) * TILE;
      c.globalAlpha = 0.7;
      c.fillStyle = 'rgba(255,255,255,.06)';
      if (def.range) { c.beginPath(); c.arc(x, y, def.range * TILE * g.RFX.rangeMul, 0, 6.29); c.fill(); }
      c.fillStyle = def.color;
      c.globalAlpha = 0.85;
      c.beginPath(); c.arc(x, y, 20, 0, 6.29); c.fill();
      c.globalAlpha = 1;
    }

    // ---------- towers ----------
    drawTower(c, g, tw) {
      const d = tw.def;
      c.save();
      c.translate(tw.x, tw.y);
      // shadow + platform
      c.fillStyle = 'rgba(0,0,0,.4)';
      c.beginPath(); c.ellipse(0, 20, 26, 10, 0, 0, 6.29); c.fill();
      c.fillStyle = '#1c2440';
      c.strokeStyle = tw === this.selected ? '#fff' : '#4a5480';
      c.lineWidth = tw === this.selected ? 3 : 2;
      const s = 26;
      c.beginPath();
      if (c.roundRect) c.roundRect(-s, -s, s * 2, s * 2, 8); else c.rect(-s, -s, s * 2, s * 2);
      c.fill(); c.stroke();
      if (tw.chilled) { c.fillStyle = 'rgba(159,232,255,.25)'; c.fillRect(-s, -s, s * 2, s * 2); }

      c.rotate(0);
      this.drawHead(c, g, tw);

      // level pips
      c.fillStyle = tw.level >= 10 ? '#ffe27a' : d.color;
      for (let i = 0; i < Math.min(10, tw.level); i++) {
        const a = (i / 10) * 6.283 - 1.57;
        c.beginPath(); c.arc(Math.cos(a) * 30, Math.sin(a) * 30, tw.level >= 10 ? 3.4 : 2.4, 0, 6.29); c.fill();
      }
      if (tw.disabled) {
        c.fillStyle = 'rgba(255,93,126,.85)'; c.font = 'bold 22px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('\u2715', 0, -40);
      }
      if (tw.level >= 10) {
        c.strokeStyle = tw.level >= 20 ? '#ff7ad9' : '#ffe27a'; c.lineWidth = 2; c.globalAlpha = 0.6 + Math.sin(this.t * 4) * 0.3;
        c.beginPath(); c.arc(0, 0, 34, 0, 6.29); c.stroke();
        c.globalAlpha = 1;
      }
      c.restore();
      // sniper aim line
      if (tw.type === 'sniper' && tw.aimT > 0 && tw.aimUid) {
        const e = g.enemies.find(x => x.uid === tw.aimUid);
        if (e) {
          c.strokeStyle = 'rgba(125,180,255,.5)'; c.lineWidth = 1.5;
          c.setLineDash([6, 6]);
          c.beginPath(); c.moveTo(tw.x, tw.y); c.lineTo(e.x, e.y); c.stroke();
          c.setLineDash([]);
        }
      }
      // crusher claws
      if (tw.type === 'crusher') {
        for (const gr of tw.grabs) {
          c.strokeStyle = d.color; c.lineWidth = 4;
          c.beginPath(); c.moveTo(tw.x, tw.y); c.lineTo(gr.e.x, gr.e.y); c.stroke();
          c.fillStyle = '#ff5d7e';
          c.beginPath(); c.arc(gr.e.x, gr.e.y, 6, 0, 6.29); c.fill();
        }
      }
      // drones
      if (tw.type === 'heli') for (const dr of tw.drones) this.drawDrone(c, dr, d.color);
      // charging glow (laser/gauss)
      if (tw.type === 'laser' && tw.charge > 0) {
        const need = d.charge * (tw.m.chargeMul || 1);
        const f = Math.min(1, tw.charge / need);
        c.fillStyle = `rgba(255,77,109,${0.3 + f * 0.5})`;
        c.beginPath(); c.arc(tw.x + Math.cos(tw.angle) * 24, tw.y + Math.sin(tw.angle) * 24, 6 + f * 8, 0, 6.29); c.fill();
      }
    }

    drawHead(c, g, tw) {
      const d = tw.def;
      c.save();
      const rotKinds = ['basic', 'cannon', 'multishot', 'sniper', 'minigun', 'venom', 'missile', 'flame', 'laser', 'gauss', 'antiair', 'plasma'];
      if (rotKinds.includes(tw.type)) c.rotate(tw.angle);
      c.fillStyle = d.color; c.strokeStyle = '#0b1026'; c.lineWidth = 2;
      const barrel = (len, w, off) => { c.fillRect(off || 6, -w / 2, len, w); };
      switch (tw.type) {
        case 'basic':
          barrel(26, 10); c.beginPath(); c.arc(0, 0, 14, 0, 6.29); c.fill(); c.stroke();
          c.fillStyle = '#39f5c8'; c.beginPath(); c.arc(0, 0, 6, 0, 6.29); c.fill();
          break;
        case 'cannon':
          barrel(20, 18); c.fillStyle = '#3a2c1c'; c.fillRect(24, -11, 6, 22);
          c.beginPath(); c.arc(0, 0, 16, 0, 6.29); c.fillStyle = d.color; c.fill(); c.stroke();
          break;
        case 'multishot': {
          const n = d.count + (tw.m.countPlus || 0);
          for (let i = 0; i < n; i++) { c.save(); c.rotate((i - (n - 1) / 2) * 0.16); barrel(26, 7); c.restore(); }
          c.beginPath(); c.arc(0, 0, 13, 0, 6.29); c.fill(); c.stroke();
          break;
        }
        case 'sniper':
          c.fillRect(4, -3, 40, 6);
          c.fillStyle = '#0b1026'; c.fillRect(38, -5, 6, 10);
          c.beginPath(); c.arc(0, 0, 13, 0, 6.29); c.fillStyle = d.color; c.fill(); c.stroke();
          c.fillStyle = '#fff'; c.beginPath(); c.arc(-4, -4, 3, 0, 6.29); c.fill();
          break;
        case 'freezing':
          c.rotate(this.t * 1.2);
          c.fillStyle = d.color;
          c.beginPath(); c.moveTo(0, -18); c.lineTo(12, 0); c.lineTo(0, 18); c.lineTo(-12, 0); c.closePath(); c.fill(); c.stroke();
          c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, 4, 0, 6.29); c.fill();
          c.strokeStyle = 'rgba(159,232,255,.25)'; c.lineWidth = 2;
          c.beginPath(); c.arc(0, 0, 24 + Math.sin(this.t * 3) * 3, 0, 6.29); c.stroke();
          break;
        case 'antiair':
          for (const a of [-0.5, 0, 0.5]) { c.save(); c.rotate(a); c.fillRect(2, -3, 26, 6); c.restore(); }
          c.beginPath(); c.arc(0, 0, 13, 0, 6.29); c.fill(); c.stroke();
          c.strokeStyle = '#ff5d7e'; c.lineWidth = 2;
          c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(this.t * 5) * 20, Math.sin(this.t * 5) * 20); c.stroke();
          break;
        case 'splash':
          for (let i = 0; i < 8; i++) { c.save(); c.rotate(i / 8 * 6.283 + this.t * 0.6); c.fillRect(8, -3, 16, 6); c.restore(); }
          c.beginPath(); c.arc(0, 0, 12, 0, 6.29); c.fill(); c.stroke();
          c.fillStyle = '#7a4d1c'; c.beginPath(); c.arc(0, 0, 5, 0, 6.29); c.fill();
          break;
        case 'blast':
          c.fillStyle = d.color;
          c.beginPath(); c.arc(0, 0, 13 + Math.sin(this.t * 5) * 2, 0, 6.29); c.fill(); c.stroke();
          c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, 5, 0, 6.29); c.fill();
          break;
        case 'minigun': {
          c.save(); c.rotate(this.t * (2 + tw.spin * 20));
          for (let i = 0; i < 3; i++) { c.save(); c.rotate(i / 3 * 6.283); c.fillRect(6, -2.5, 24, 5); c.restore(); }
          c.restore();
          c.beginPath(); c.arc(0, 0, 12, 0, 6.29); c.fill(); c.stroke();
          if (tw.spin > 0.7) { c.fillStyle = '#ffb52e'; c.beginPath(); c.arc(0, 0, 5, 0, 6.29); c.fill(); }
          break;
        }
        case 'venom':
          c.fillStyle = '#1d3a1a'; c.beginPath(); c.arc(0, 0, 15, 0, 6.29); c.fill(); c.stroke();
          c.fillRect(4, -5, 22, 10);
          c.fillStyle = d.color; c.beginPath(); c.arc(0, 0, 8 + Math.sin(this.t * 4) * 1.5, 0, 6.29); c.fill();
          break;
        case 'tesla':
          c.fillStyle = '#3a4670'; c.fillRect(-5, -6, 10, 24);
          c.fillStyle = d.color; c.beginPath(); c.arc(0, -12, 9, 0, 6.29); c.fill(); c.stroke();
          c.strokeStyle = '#7df9ff'; c.lineWidth = 2;
          for (let i = 0; i < 2; i++) {
            c.beginPath(); c.moveTo(0, -12);
            c.lineTo((Math.random() - 0.5) * 30, -22 - Math.random() * 8);
            c.lineTo((Math.random() - 0.5) * 40, -14);
            c.stroke();
          }
          break;
        case 'missile':
          for (const o of [-8, 8]) { c.fillStyle = '#3a2c3a'; c.fillRect(-14, o - 5, 26, 10); c.fillStyle = d.color; c.fillRect(-14, o - 5, 26, 3); }
          c.beginPath(); c.arc(-12, 0, 9, 0, 6.29); c.fillStyle = d.color; c.fill(); c.stroke();
          break;
        case 'flame':
          c.fillRect(0, -7, 24, 14);
          c.beginPath(); c.arc(0, 0, 13, 0, 6.29); c.fillStyle = d.color; c.fill(); c.stroke();
          c.fillStyle = Math.random() < 0.5 ? '#ff6b4a' : '#ffe27a';
          c.beginPath(); c.moveTo(24, -5); c.lineTo(24 + 8 + Math.random() * 6, 0); c.lineTo(24, 5); c.closePath(); c.fill();
          break;
        case 'laser':
          c.fillRect(-6, -9, 26, 18);
          c.fillStyle = '#ff8fa3'; c.fillRect(18, -6, 6, 12);
          c.beginPath(); c.arc(-6, 0, 12, 0, 6.29); c.fillStyle = d.color; c.fill(); c.stroke();
          break;
        case 'gauss':
          c.fillStyle = '#2c2440'; c.fillRect(-6, -10, 34, 6); c.fillRect(-6, 4, 34, 6);
          c.fillStyle = d.color;
          for (const x of [0, 10, 20]) c.fillRect(x, -10, 4, 20);
          c.beginPath(); c.arc(-8, 0, 11, 0, 6.29); c.fill(); c.stroke();
          break;
        case 'plasma':
          c.fillStyle = '#2a1030';
          c.beginPath(); c.arc(0, 0, 18, 0, 6.29); c.fill(); c.stroke();
          for (let i = 0; i < 3; i++) {
            const a = this.t * (2 + i) + i * 2.1;
            c.fillStyle = ['#ff7ad9', '#b06bff', '#5ef2d8'][i];
            c.beginPath(); c.arc(Math.cos(a) * 10, Math.sin(a) * 10, 5, 0, 6.29); c.fill();
          }
          c.fillStyle = '#fff';
          c.beginPath(); c.arc(0, 0, 4 + Math.sin(this.t * 6) * 1.5, 0, 6.29); c.fill();
          break;
        case 'crusher':
          c.fillStyle = '#3a4266'; c.beginPath(); c.arc(0, 0, 16, 0, 6.29); c.fill(); c.stroke();
          c.save(); c.rotate(tw.angle);
          c.fillStyle = d.color;
          for (const a of [0, Math.PI]) { c.save(); c.rotate(a); c.fillRect(8, -5, 20, 10); c.beginPath(); c.arc(28, 0, 6, 0, 6.29); c.fill(); c.restore(); }
          c.restore();
          c.fillStyle = '#ff5d7e'; c.beginPath(); c.arc(0, 0, 6, 0, 6.29); c.fill();
          break;
        case 'heli':
          c.fillStyle = '#2c3448';
          c.beginPath(); c.arc(0, 0, 20, 0, 6.29); c.fill(); c.stroke();
          c.fillStyle = d.color; c.font = 'bold 22px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText('H', 0, 1);
          break;
        case 'miner':
          c.fillStyle = '#123322';
          c.beginPath(); c.moveTo(0, -16); c.lineTo(14, 8); c.lineTo(-14, 8); c.closePath(); c.fill(); c.stroke();
          c.save(); c.rotate(this.t * 3);
          c.fillStyle = d.color; c.fillRect(-3, -22, 6, 12);
          c.restore();
          c.fillStyle = '#ffe27a'; c.beginPath(); c.arc(0, 2, 5, 0, 6.29); c.fill();
          break;
      }
      c.restore();
    }

    drawDrone(c, dr, color) {
      c.save();
      c.translate(dr.x, dr.y);
      c.fillStyle = 'rgba(0,0,0,.3)';
      c.beginPath(); c.ellipse(6, 14, 14, 5, 0, 0, 6.29); c.fill();
      c.rotate(dr.angle * 0.15);
      c.fillStyle = color; c.strokeStyle = '#0b1026'; c.lineWidth = 2;
      c.beginPath(); c.ellipse(0, 0, 13, 8, 0, 0, 6.29); c.fill(); c.stroke();
      c.fillStyle = '#bfe9ff'; c.beginPath(); c.ellipse(5, -1, 5, 4, 0, 0, 6.29); c.fill();
      c.fillStyle = color; c.fillRect(-24, -3, 12, 5);
      c.strokeStyle = '#e8ecff'; c.lineWidth = 3;
      const w = Math.sin(dr.rotor) * 20;
      c.beginPath(); c.moveTo(-w, -10); c.lineTo(w, -10); c.stroke();
      c.strokeStyle = '#e8ecff'; c.globalAlpha = 0.4;
      c.beginPath(); c.moveTo(-20, -10); c.lineTo(20, -10); c.stroke();
      c.globalAlpha = 1;
      c.restore();
    }

    // ---------- enemies ----------
    drawEnemy(c, g, e) {
      const d = e.d;
      const fly = d.flying;
      const alt = fly ? 14 + Math.sin(e.bob) * 4 : 0;
      c.save();
      c.translate(e.x, e.y);
      // shadow
      c.fillStyle = 'rgba(0,0,0,.35)';
      c.beginPath(); c.ellipse(fly ? 8 : 0, (fly ? 18 : 10), d.r * 0.9, d.r * 0.35, 0, 0, 6.29); c.fill();
      c.translate(0, -alt);
      c.rotate(fly && (e.type === 'jet' || e.type === 'fighter') ? 0 : 0);
      const R = d.r;
      c.fillStyle = d.color; c.strokeStyle = '#0b1026'; c.lineWidth = 2.5;
      switch (e.type) {
        case 'regular':
          c.beginPath(); c.arc(0, 0, R, 0, 6.29); c.fill(); c.stroke();
          c.fillStyle = '#14532d'; c.beginPath(); c.arc(0, 0, R * 0.45, 0, 6.29); c.fill();
          break;
        case 'fast':
          c.rotate(e.ang);
          c.beginPath(); c.moveTo(R + 4, 0); c.lineTo(-R, -R * 0.8); c.lineTo(-R * 0.4, 0); c.lineTo(-R, R * 0.8); c.closePath(); c.fill(); c.stroke();
          break;
        case 'strong':
          c.beginPath(); c.rect(-R, -R, R * 2, R * 2); c.fill(); c.stroke();
          c.fillStyle = '#7c2d12';
          for (const [x, y] of [[-6, -6], [6, -6], [-6, 6], [6, 6]]) { c.beginPath(); c.arc(x, y, 3, 0, 6.29); c.fill(); }
          break;
        case 'armored':
          c.beginPath();
          for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; const x = Math.cos(a) * R, y = Math.sin(a) * R; i ? c.lineTo(x, y) : c.moveTo(x, y); }
          c.closePath(); c.fill(); c.stroke();
          c.strokeStyle = '#475569'; c.lineWidth = 3;
          c.beginPath(); c.moveTo(-R, 0); c.lineTo(R, 0); c.stroke();
          break;
        case 'healer':
          c.beginPath(); c.arc(0, 0, R, 0, 6.29); c.fill(); c.stroke();
          c.fillStyle = '#fff'; c.fillRect(-3, -8, 6, 16); c.fillRect(-8, -3, 16, 6);
          break;
        case 'toxic': {
          const w = Math.sin(this.t * 6 + e.bob) * 2;
          c.beginPath(); c.arc(0, 0, R + w, 0, 6.29); c.fill(); c.stroke();
          c.fillStyle = '#3f6212';
          c.beginPath(); c.arc(-4, -3, 3, 0, 6.29); c.arc(5, 4, 2.4, 0, 6.29); c.fill();
          break;
        }
        case 'icy':
          c.beginPath(); c.moveTo(0, -R - 2); c.lineTo(R * 0.75, 0); c.lineTo(0, R + 2); c.lineTo(-R * 0.75, 0); c.closePath(); c.fill(); c.stroke();
          c.strokeStyle = '#fff'; c.lineWidth = 2;
          c.beginPath(); c.moveTo(0, -R - 2); c.lineTo(0, R + 2); c.stroke();
          break;
        case 'fighter':
          c.rotate(e.ang);
          c.beginPath(); c.moveTo(R + 6, 0); c.lineTo(-R, -R * 0.7); c.lineTo(-R * 0.3, 0); c.lineTo(-R, R * 0.7); c.closePath(); c.fill(); c.stroke();
          c.fillStyle = '#fff'; c.fillRect(-2, -2, 8, 4);
          break;
        case 'light':
          c.shadowColor = d.color; c.shadowBlur = 14;
          c.beginPath(); c.arc(0, 0, R, 0, 6.29); c.fill(); c.stroke();
          c.shadowBlur = 0;
          c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, 3.5, 0, 6.29); c.fill();
          break;
        case 'heli':
          c.fillStyle = d.color;
          c.beginPath(); c.ellipse(0, 0, R, R * 0.55, 0, 0, 6.29); c.fill(); c.stroke();
          c.fillStyle = '#7c2d12'; c.fillRect(-R - 14, -3, 14, 6);
          c.fillStyle = '#bfe9ff'; c.beginPath(); c.ellipse(5, -2, 5, 4, 0, 0, 6.29); c.fill();
          c.strokeStyle = '#e8ecff'; c.lineWidth = 3;
          const wob = Math.sin(e.bob * 3) * R;
          c.beginPath(); c.moveTo(-wob, -R * 0.7); c.lineTo(wob, -R * 0.7); c.stroke();
          break;
        case 'jet':
          c.rotate(e.ang);
          c.fillStyle = d.color;
          c.beginPath(); c.moveTo(R + 8, 0); c.lineTo(-R, -R * 0.6); c.lineTo(-R * 0.5, 0); c.lineTo(-R, R * 0.6); c.closePath(); c.fill(); c.stroke();
          c.fillStyle = '#fff'; c.beginPath(); c.arc(2, 0, 3, 0, 6.29); c.fill();
          break;
        case 'splitter':
          c.beginPath(); c.arc(0, 0, R, 0, 6.29); c.fill(); c.stroke();
          c.strokeStyle = '#0b1026'; c.lineWidth = 2;
          c.beginPath(); c.moveTo(-R * 0.7, -R * 0.7); c.lineTo(R * 0.7, R * 0.7); c.stroke();
          c.fillStyle = '#fecaca';
          c.beginPath(); c.arc(-R * 0.35, R * 0.1, 4, 0, 6.29); c.arc(R * 0.35, -R * 0.1, 4, 0, 6.29); c.fill();
          break;
        case 'broot':
          c.fillStyle = '#2e1065';
          c.beginPath(); c.arc(0, 0, R + 5, 0, 6.29); c.fill(); c.stroke();
          c.strokeStyle = d.color; c.lineWidth = 4;
          for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + this.t; c.beginPath(); c.moveTo(Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5); c.lineTo(Math.cos(a) * (R + 5), Math.sin(a) * (R + 5)); c.stroke(); }
          c.fillStyle = d.color; c.beginPath(); c.arc(0, 0, R * 0.55, 0, 6.29); c.fill(); c.stroke();
          c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, 5 + Math.sin(this.t * 5) * 2, 0, 6.29); c.fill();
          break;
        case 'constr':
          c.fillStyle = '#431407';
          c.beginPath();
          for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 - this.t * 0.4; const x = Math.cos(a) * (R + 4), y = Math.sin(a) * (R + 4); i ? c.lineTo(x, y) : c.moveTo(x, y); }
          c.closePath(); c.fill(); c.stroke();
          c.fillStyle = d.color;
          for (const [x, y] of [[-R * 0.4, -R * 0.4], [R * 0.4, -R * 0.4], [-R * 0.4, R * 0.4], [R * 0.4, R * 0.4]]) c.fillRect(x - 6, y - 6, 12, 12);
          break;
        case 'metaphor':
          c.shadowColor = d.color; c.shadowBlur = 20;
          c.fillStyle = '#0b1026';
          c.beginPath(); c.arc(0, 0, R, 0, 6.29); c.fill(); c.stroke();
          c.shadowBlur = 0;
          c.strokeStyle = d.color; c.lineWidth = 3;
          c.save(); c.rotate(this.t * 1.5);
          c.strokeRect(-R * 0.55, -R * 0.55, R * 1.1, R * 1.1);
          c.rotate(0.8); c.strokeRect(-R * 0.55, -R * 0.55, R * 1.1, R * 1.1);
          c.restore();
          c.fillStyle = '#ff5d7e'; c.font = 'bold 20px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText('\u2715', 0, 1);
          break;
        case 'boss':
          c.fillStyle = '#7f1d1d';
          c.beginPath();
          for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + this.t * 0.5; const x = Math.cos(a) * (R + 6), y = Math.sin(a) * (R + 6); i ? c.lineTo(x, y) : c.moveTo(x, y); }
          c.closePath(); c.fill(); c.stroke();
          c.fillStyle = d.color;
          c.beginPath();
          for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; const x = Math.cos(a) * R, y = Math.sin(a) * R; i ? c.lineTo(x, y) : c.moveTo(x, y); }
          c.closePath(); c.fill(); c.stroke();
          c.fillStyle = '#fecaca';
          for (let i = 0; i < 3; i++) { const a = i / 3 * 6.283 - 1.57; c.beginPath(); c.arc(Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5, 6, 0, 6.29); c.fill(); }
          c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, 5 + Math.sin(this.t * 5) * 2, 0, 6.29); c.fill();
          break;
      }
      // status tints
      if (e.slowT > 0) { c.fillStyle = 'rgba(159,232,255,.35)'; c.beginPath(); c.arc(0, 0, R + 3, 0, 6.29); c.fill(); }
      if (e.poison.length) { c.fillStyle = '#7dff5e'; c.beginPath(); c.arc(-R * 0.6, -R - 6, 4, 0, 6.29); c.fill(); }
      if (e.burnT > 0) { c.fillStyle = '#ff9a3c'; c.beginPath(); c.arc(R * 0.6, -R - 6, 4 + Math.random() * 2, 0, 6.29); c.fill(); }
      if (e.stun > 0) {
        c.fillStyle = '#ffe27a'; c.font = 'bold 14px Arial'; c.textAlign = 'center';
        c.fillText('★', 0, -R - 8 + Math.sin(this.t * 10) * 2);
      }
      if (e.grab) { c.strokeStyle = '#c9d4ff'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, R + 6, 0, 6.29); c.stroke(); }
      if (e.d.disable) { c.strokeStyle = 'rgba(176,107,255,.55)'; c.lineWidth = 3; c.setLineDash([10, 8]); c.beginPath(); c.arc(0, 0, 96, 0, 6.29); c.stroke(); c.setLineDash([]); }
      c.restore();
      // hp bar
      if (e.hp < e.maxHp) {
        const w = e.d.boss ? 90 : 34, h = e.d.boss ? 8 : 5;
        const f = Math.max(0, e.hp / e.maxHp);
        c.fillStyle = 'rgba(0,0,0,.6)';
        c.fillRect(e.x - w / 2, e.y - e.d.r - alt - 16, w, h);
        c.fillStyle = f > 0.5 ? '#4ade80' : f > 0.25 ? '#ffd968' : '#ff5d7e';
        c.fillRect(e.x - w / 2, e.y - e.d.r - alt - 16, w * f, h);
      }
    }

    drawProj(c, p) {
      if (p.delay && p.delay > 0) return;
      c.save();
      c.translate(p.x, p.y);
      if (p.kind === 'shell' || p.kind === 'homing') {
        c.rotate(p.angle);
        c.fillStyle = p.color; c.strokeStyle = '#0b1026'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(9, 0); c.lineTo(-6, -5); c.lineTo(-6, 5); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#ffe27a'; c.beginPath(); c.arc(-8, 0, 3 + Math.random() * 2, 0, 6.29); c.fill();
      } else {
        c.fillStyle = p.color;
        c.shadowColor = p.color; c.shadowBlur = 8;
        c.beginPath(); c.arc(0, 0, p.r, 0, 6.29); c.fill();
        c.shadowBlur = 0;
        c.strokeStyle = p.color; c.globalAlpha = 0.5; c.lineWidth = 2;
        c.beginPath(); c.moveTo(0, 0); c.lineTo(-Math.cos(p.angle) * 14, -Math.sin(p.angle) * 14); c.stroke();
        c.globalAlpha = 1;
      }
      c.restore();
    }

    drawBeam(c, b) {
      const f = 1 - b.t / b.life;
      c.globalAlpha = Math.max(0, f);
      if (b.ring) {
        const r = b.r * (1 - f * 0.4);
        c.strokeStyle = b.color; c.lineWidth = b.w * f + 1;
        c.beginPath(); c.arc(b.x1, b.y1, r, 0, 6.29); c.stroke();
      } else if (b.poly) {
        c.strokeStyle = b.color; c.lineWidth = b.w; c.lineJoin = 'round';
        c.beginPath();
        c.moveTo(b.poly[0].x, b.poly[0].y);
        for (let i = 1; i < b.poly.length; i++) c.lineTo(b.poly[i].x, b.poly[i].y);
        c.stroke();
      } else {
        c.strokeStyle = b.color; c.lineWidth = b.w; c.lineCap = 'round';
        c.shadowColor = b.color; c.shadowBlur = 12;
        c.beginPath(); c.moveTo(b.x1, b.y1); c.lineTo(b.x2, b.y2); c.stroke();
        c.shadowBlur = 0;
      }
      c.globalAlpha = 1;
    }

    drawStrike(c, s) {
      c.save();
      c.translate(s.x, s.y);
      c.fillStyle = 'rgba(0,0,0,.3)';
      c.beginPath(); c.ellipse(10, 60, 26, 8, 0, 0, 6.29); c.fill();
      c.fillStyle = '#ffd968'; c.strokeStyle = '#0b1026'; c.lineWidth = 3;
      c.beginPath(); c.ellipse(0, 0, 26, 14, 0, 0, 6.29); c.fill(); c.stroke();
      c.fillStyle = '#7a3d05'; c.fillRect(-44, -4, 20, 8);
      c.fillStyle = '#bfe9ff'; c.beginPath(); c.ellipse(10, -2, 9, 7, 0, 0, 6.29); c.fill();
      c.strokeStyle = '#e8ecff'; c.lineWidth = 4;
      const w = Math.sin(this.t * 40) * 34;
      c.beginPath(); c.moveTo(-w, -18); c.lineTo(w, -18); c.stroke();
      c.globalAlpha = 0.35;
      c.beginPath(); c.moveTo(-34, -18); c.lineTo(34, -18); c.stroke();
      c.globalAlpha = 1;
      c.restore();
    }
  }

  globalThis.Renderer = Renderer;
})();
