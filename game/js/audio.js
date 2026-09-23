/* WebAudio SFX synth + music player (OGG tracks by Kevin MacLeod, CC-BY 4.0 — see assets/music/CREDITS.md) */
(function () {
  'use strict';
  let ctx = null, master = null, musicGain = null, sfxGain = null;
  let musicEl = null, curTrack = null;
  const lastPlay = {};

  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain(); master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.connect(master);
      sfxGain = ctx.createGain(); sfxGain.connect(master);
      applyVolumes();
      return true;
    } catch (e) { return false; }
  }
  function applyVolumes() {
    const s = (globalThis.STORE && globalThis.STORE.S.settings) || { music: 0.7, sfx: 0.8 };
    if (musicGain) musicGain.gain.value = s.music * 0.5;
    if (sfxGain) sfxGain.gain.value = s.sfx;
    if (musicEl) musicEl.volume = Math.max(0, Math.min(1, s.music * 0.6));
  }
  function throttle(key, ms) {
    const t = performance.now();
    if (lastPlay[key] && t - lastPlay[key] < ms) return false;
    lastPlay[key] = t; return true;
  }
  // args: freqStart, freqEnd, dur, type, vol, when
  function tone(f0, f1, dur, type, vol, delay) {
    if (!ensure()) return;
    const t = ctx.currentTime + (delay || 0);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(Math.max(20, f0), t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol || 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(sfxGain);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, hp, delay) {
    if (!ensure()) return;
    const t = ctx.currentTime + (delay || 0);
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; d[i] = (w - last * (1 - (hp || 0.4))); last = w; }
    const src = ctx.createBufferSource(); src.buffer = buf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol || 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(g); g.connect(sfxGain);
    src.start(t);
  }
  const SFX = {
    click() { tone(700, 900, 0.06, 'square', 0.12); },
    build() { tone(300, 600, 0.12, 'square', 0.18); tone(600, 900, 0.1, 'square', 0.12, 0.08); },
    sell() { tone(800, 400, 0.14, 'square', 0.14); tone(400, 700, 0.1, 'square', 0.1, 0.1); },
    upgrade() { tone(500, 1000, 0.12, 'triangle', 0.22); tone(750, 1500, 0.14, 'triangle', 0.18, 0.09); },
    error() { tone(220, 160, 0.18, 'sawtooth', 0.16); },
    coin() { if (!throttle('coin', 90)) return; tone(1200, 1800, 0.08, 'sine', 0.1); },
    shoot() { if (!throttle('shoot', 70)) return; tone(900 + Math.random() * 300, 300, 0.07, 'square', 0.06); },
    sniper() { tone(1400, 200, 0.2, 'sawtooth', 0.14); noise(0.1, 0.1, 0.6); },
    cannon() { if (!throttle('cannon', 120)) return; tone(150, 40, 0.25, 'sine', 0.3); noise(0.2, 0.18, 0.2); },
    boom() { if (!throttle('boom', 120)) return; tone(120, 30, 0.4, 'sine', 0.32); noise(0.35, 0.2, 0.15); },
    tesla() { if (!throttle('tesla', 130)) return; noise(0.12, 0.14, 0.7); tone(2000, 300, 0.1, 'sawtooth', 0.08); },
    laser() { tone(1800, 2400, 0.25, 'sawtooth', 0.1); tone(900, 1200, 0.25, 'square', 0.08); },
    gauss() { tone(100, 2000, 0.18, 'sawtooth', 0.16); noise(0.25, 0.2, 0.3); },
    freeze() { if (!throttle('freeze', 400)) return; tone(2400, 1200, 0.2, 'sine', 0.05); },
    flame() { if (!throttle('flame', 200)) return; noise(0.18, 0.08, 0.3); },
    missile() { if (!throttle('missile', 150)) return; noise(0.3, 0.1, 0.4); tone(400, 800, 0.25, 'sawtooth', 0.06); },
    venom() { if (!throttle('venom', 200)) return; tone(300, 150, 0.15, 'triangle', 0.08); },
    blast() { tone(200, 50, 0.3, 'sine', 0.25); noise(0.25, 0.16, 0.2); },
    crush() { if (!throttle('crush', 300)) return; noise(0.2, 0.12, 0.25); tone(120, 80, 0.2, 'square', 0.08); },
    hit() { if (!throttle('hit', 90)) return; tone(500, 250, 0.06, 'triangle', 0.07); },
    leak() { tone(400, 100, 0.4, 'sawtooth', 0.22); tone(300, 80, 0.4, 'square', 0.15, 0.1); },
    wave() { tone(440, 440, 0.12, 'square', 0.16); tone(660, 660, 0.12, 'square', 0.16, 0.14); tone(880, 880, 0.2, 'square', 0.18, 0.28); },
    clear() { tone(660, 660, 0.1, 'triangle', 0.16); tone(880, 880, 0.1, 'triangle', 0.16, 0.1); tone(1100, 1320, 0.18, 'triangle', 0.16, 0.2); },
    boss() { tone(110, 55, 0.7, 'sawtooth', 0.25); tone(220, 110, 0.7, 'square', 0.15, 0.05); noise(0.5, 0.1, 0.1); },
    ability() { tone(600, 1200, 0.15, 'triangle', 0.2); tone(900, 1800, 0.2, 'sine', 0.15, 0.1); },
    strike() { noise(0.8, 0.2, 0.2); tone(300, 90, 0.8, 'sawtooth', 0.15); },
    victory() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, f, 0.22, 'triangle', 0.2, i * 0.16)); },
    defeat() { [400, 350, 300, 200].forEach((f, i) => tone(f, f * 0.9, 0.3, 'sawtooth', 0.18, i * 0.22)); },
    ach() { tone(880, 1320, 0.12, 'sine', 0.18); tone(1320, 1760, 0.16, 'sine', 0.15, 0.1); },
  };

  function playMusic(track) {
    ensure();
    if (curTrack === track && musicEl && !musicEl.paused) return;
    curTrack = track;
    try {
      if (!musicEl) { musicEl = new Audio(); musicEl.loop = true; musicEl.preload = 'auto'; }
      musicEl.src = 'assets/music/' + track + '.ogg';
      applyVolumes();
      const p = musicEl.play();
      if (p && p.catch) p.catch(() => {});
    } catch (e) {}
  }
  function stopMusic() { try { if (musicEl) musicEl.pause(); } catch (e) {} curTrack = null; }
  function unlock() { ensure(); if (musicEl && musicEl.paused && curTrack) { const p = musicEl.play(); if (p && p.catch) p.catch(() => {}); } }

  document.addEventListener('pointerdown', unlock, { passive: true });
  document.addEventListener('keydown', unlock);

  globalThis.AUDIO = { SFX, playMusic, stopMusic, applyVolumes, unlock };
})();
