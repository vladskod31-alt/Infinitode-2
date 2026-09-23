// Procedural chiptune/synth soundtrack -> WAV (16-bit mono 22050Hz). No deps.
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const SR = 22050;
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'game/assets/music');

const N = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
// note name -> midi
const NM = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const n = (name) => {
  const m = /^([A-G])(#|b)?(\d)$/.exec(name);
  let s = NM[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return (parseInt(m[3]) + 1) * 12 + s;
};

function makeBuf(seconds) { return new Float32Array(Math.ceil(seconds * SR)); }
function addTone(buf, freq, t0, dur, vol, type = 'square', slideTo = null) {
  const start = Math.floor(t0 * SR), len = Math.floor(dur * SR);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const idx = start + i;
    if (idx < 0 || idx >= buf.length) continue;
    const t = i / len;
    const f = slideTo ? freq + (slideTo - freq) * t : freq;
    phase += (2 * Math.PI * f) / SR;
    let v;
    if (type === 'square') v = Math.sign(Math.sin(phase)) * 0.7;
    else if (type === 'saw') v = ((phase / Math.PI) % 2) - 1;
    else if (type === 'tri') v = (2 / Math.PI) * Math.asin(Math.sin(phase));
    else v = Math.sin(phase);
    const env = Math.min(1, t * 12) * Math.pow(1 - t, 1.6);
    buf[idx] += v * vol * env;
  }
}
function addNoise(buf, t0, dur, vol, hp = 0.3) {
  const start = Math.floor(t0 * SR), len = Math.floor(dur * SR);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const idx = start + i;
    if (idx < 0 || idx >= buf.length) continue;
    const t = i / len;
    const w = Math.random() * 2 - 1;
    const v = w - last * (1 - hp); last = w;
    buf[idx] += v * vol * Math.pow(1 - t, 2);
  }
}
function addKick(buf, t0, vol = 0.9) { addTone(buf, 120, t0, 0.16, vol, 'sine', 38); }
function addSnare(buf, t0, vol = 0.5) { addTone(buf, 190, t0, 0.1, vol * 0.7, 'tri', 120); addNoise(buf, t0, 0.12, vol * 0.6, 0.5); }
function addHat(buf, t0, vol = 0.22, open = false) { addNoise(buf, t0, open ? 0.18 : 0.05, vol, 0.85); }

function render({ bpm, bars, prog, bassPat, arpPat, leadPat, drums, name }) {
  const beat = 60 / bpm, bar = beat * 4;
  const total = bars * bar + 0.3;
  const buf = makeBuf(total);
  for (let b = 0; b < bars; b++) {
    const chord = prog[b % prog.length];
    const t0 = b * bar;
    // pad
    for (const nn of chord) addTone(buf, N(nn), t0, bar * 0.98, 0.10, 'saw');
    // bass
    bassPat.forEach(([bt, deg], i) => {
      const midi = chord[0] - 24 + (deg || 0);
      addTone(buf, N(midi), t0 + bt * beat, beat * 0.9, 0.30, 'square');
    });
    // arp
    arpPat.forEach(([bt, deg]) => {
      const midi = chord[deg % chord.length] + 12;
      addTone(buf, N(midi), t0 + bt * beat, beat * 0.42, 0.13, 'tri');
    });
    // lead
    if (leadPat) leadPat[b % leadPat.length].forEach(([bt, off, ln]) => {
      addTone(buf, N(chord[0] + 24 + off), t0 + bt * beat, beat * ln, 0.15, 'square');
    });
    // drums
    if (drums) for (let q = 0; q < 4; q++) {
      const t = t0 + q * beat;
      if (drums.kick.includes(q)) addKick(buf, t, drums.kickVol || 0.85);
      if (drums.snare.includes(q)) addSnare(buf, t, 0.45);
      if (drums.hat) { addHat(buf, t, 0.20); addHat(buf, t + beat / 2, 0.13); }
    }
  }
  // soft clip + fades + normalize
  let peak = 0;
  for (let i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i]));
  const g = peak > 0 ? 0.92 / peak : 1;
  const fade = Math.floor(0.12 * SR);
  for (let i = 0; i < buf.length; i++) {
    let v = Math.tanh(buf[i] * g * 1.1);
    const fi = Math.min(i, buf.length - 1 - i, fade) / fade;
    buf[i] = v * fi;
  }
  return buf;
}

function writeWav(path, buf) {
  const data = Buffer.alloc(buf.length * 2);
  for (let i = 0; i < buf.length; i++) {
    let v = Math.max(-1, Math.min(1, buf[i]));
    data.writeInt16LE(Math.round(v * 32767), i * 2);
  }
  const hdr = Buffer.alloc(44);
  hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + data.length, 4); hdr.write('WAVE', 8);
  hdr.write('fmt ', 12); hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20);
  hdr.writeUInt16LE(1, 22); hdr.writeUInt32LE(SR, 24); hdr.writeUInt32LE(SR * 2, 28);
  hdr.writeUInt16LE(2, 32); hdr.writeUInt16LE(16, 34); hdr.write('data', 36);
  hdr.writeUInt32LE(data.length, 40);
  writeFileSync(path, Buffer.concat([hdr, data]));
  console.log(`OK ${path.split('/').pop()} ${(data.length / 1024 / 1024).toFixed(2)} MB`);
}

const Am = [n('A2'), n('C3'), n('E3')], F = [n('F2'), n('A2'), n('C3')],
  C = [n('C3'), n('E3'), n('G3')], G = [n('G2'), n('B2'), n('D3')],
  Em = [n('E2'), n('G2'), n('B2')], D = [n('D3'), n('F#3'), n('A3')],
  Dm = [n('D3'), n('F3'), n('A3')], Bb = [n('Bb2'), n('D3'), n('F3')],
  E = [n('E2'), n('G#2'), n('B2')], Fp = [n('F2'), n('A2'), n('C3')];

const tracks = [
  { file: 'menu.wav', bpm: 92, bars: 12, prog: [Am, F, C, G],
    bassPat: [[0, 0], [2, 0]], arpPat: [[0, 0], [0.5, 1], [1, 2], [1.5, 1], [2, 0], [2.5, 2], [3, 1], [3.5, 2]],
    leadPat: [[[0, 0, 1.5], [2, 4, 1.5]], [[0, 7, 1], [1, 4, 1], [2, 0, 1.8]]],
    drums: { kick: [0, 2], snare: [], hat: true, kickVol: 0.5 } },
  { file: 'battle1.wav', bpm: 128, bars: 24, prog: [Em, C, G, D],
    bassPat: [[0, 0], [0.5, 0], [1, 0], [1.5, 0], [2, 0], [2.5, 0], [3, 7], [3.5, 5]],
    arpPat: [[0, 0], [0.25, 1], [0.5, 2], [0.75, 1]],
    leadPat: [[[0, 0, .4], [0.5, 3, .4], [1, 5, .4], [1.5, 7, .4], [2, 12, .8], [3, 7, .8]],
      [[0, 10, .4], [0.5, 7, .4], [1, 5, .4], [1.5, 3, .4], [2, 0, 1.6]]],
    drums: { kick: [0, 1, 2, 3], snare: [1, 3], hat: true } },
  { file: 'battle2.wav', bpm: 140, bars: 24, prog: [Dm, Bb, F, C],
    bassPat: [[0, 0], [0.75, 0], [1.5, 3], [2, 0], [2.75, -2], [3.25, 0]],
    arpPat: [[0, 2], [0.25, 1], [0.5, 0], [0.75, 1]],
    leadPat: [[[0, 12, .5], [0.75, 10, .5], [1.5, 7, .5], [2, 5, .5], [3, 3, .7]],
      [[0, 0, .4], [0.5, 5, .4], [1, 7, .4], [1.5, 12, .9], [2.5, 10, .4], [3, 7, .7]]],
    drums: { kick: [0, 1, 2, 3], snare: [1, 3], hat: true } },
  { file: 'boss.wav', bpm: 150, bars: 20, prog: [E, E, Fp, E],
    bassPat: [[0, 0], [0.5, 0], [1, 0], [1.5, 1], [2, 0], [2.5, 0], [3, 0], [3.5, -1]],
    arpPat: [[0, 0], [0.5, 0]],
    leadPat: [[[0, 0, .45], [0.5, 1, .45], [1, 0, .45], [1.5, 3, .45], [2, 0, .9], [3, -2, .8]],
      [[0, 5, .5], [1, 3, .5], [2, 1, .5], [3, 0, .8]]],
    drums: { kick: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5], snare: [1, 3], hat: true } },
];

for (const t of tracks) {
  console.log(`Rendering ${t.file} ...`);
  const buf = render(t);
  writeWav(join(outDir, t.file), buf);
}
console.log('Done.');
