// Blueprint: pale drafting lines on a cyanotype sheet with a grid, a border and a title block. Notes in NOTES.md.
import { ctx, F, C, U, V, strokePoly, partial, speckle, revealText, resample, ease, clamp, hash } from '../../engine/engine.js';

const LINE = a => `rgba(234,242,255,${a})`; // the sheet's own white, for grid, border and title block
// a blurred copy of a texture canvas, so patches have no hard edges
function soft(src, px) { const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; const g = c.getContext('2d'); g.filter = `blur(${px}px)`; g.drawImage(src, 0, 0); return c; }

export default {
  api: 1,
  slug: 'blueprint',
  tokens: {
    ink: '#EAF2FF', accent: '#FFE28A', warn: '#FF9C8A', good: '#A9F0C4', muted: '#9FD8FF', paper: '#1d5596',
    fontHead: '"B612 Mono"', fontBody: '"B612 Mono"', wHead: 400, wBody: 400, textScale: 1.3, luma: 'dark',
  },
  capUpper: true,
  transOut: 0.45,

  // the sheet never changes, so it is painted once: blue wash, uneven exposure, grid, border, paper fibre
  init() {
    const { W, H } = F, c = this.sheet = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1d5596'); gr.addColorStop(1, '#16467f'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.drawImage(soft(speckle(5, 160, '#7fb2ee', 0.05, 130), 30), 0, 0); // lighter, under-exposed patches
    g.drawImage(soft(speckle(8, 160, '#0a2a55', 0.07, 130), 30), 0, 0); // darker pools
    const grid = (step, a) => { g.strokeStyle = LINE(a); g.lineWidth = 1; g.beginPath(); for (let x = 0; x <= W; x += step) { g.moveTo(x, 0); g.lineTo(x, H); } for (let y = 0; y <= H; y += step) { g.moveTo(0, y); g.lineTo(W, y); } g.stroke(); };
    grid(U(1 / 32), 0.07); grid(U(5 / 32), 0.16);
    const m = U(0.02); g.strokeStyle = LINE(0.6); g.lineWidth = 3; g.strokeRect(F.bx - m, F.by - m * 2, F.bw + m * 2, F.bh + m * 4); // sheet border round the drawing area
    g.drawImage(speckle(21, 7000, '#ffffff', 0.035, 2.5), 0, 0);
    const v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.5, W / 2, H / 2, Math.hypot(W, H) * 0.6); v.addColorStop(0, 'rgba(6,24,54,0)'); v.addColorStop(1, 'rgba(6,24,54,0.35)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
  },
  bg() { ctx.drawImage(this.sheet, 0, 0); },

  // a ruled line: a faint construction line shows the whole path first, then the ink follows it.
  // The ink bleeds a little into the paper and pools where the pen touches down and lifts off.
  pen(pts, p, role, lw, seed = 1) {
    const c = C(role), w = lw || U(0.0044), r = resample(pts, 6), q = partial(r, p), dot = ([x, y], k) => { ctx.globalAlpha = 0.55; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, w * (0.62 + 0.25 * hash(seed + k)), 0, 7); ctx.fill(); ctx.globalAlpha = 1; };
    if (p < 1) strokePoly(r, 1.5, c, 0.18);
    strokePoly(q, w * 2.4, c, 0.1);
    strokePoly(q, w, c, 0.95);
    dot(q[0], 1); if (p >= 1) dot(q[q.length - 1], 2);
  },
  text(str, x, y, frac, it) {
    const c = C(it.role);
    revealText(str, x, y, frac, it.css, c, it.align, (s, xx, yy) => { ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.globalAlpha = 0.12; ctx.strokeText(s, xx, yy); ctx.globalAlpha = 1; });
  },
  // a dashed call-out box instead of a filled block
  highlight(it, p) { ctx.strokeStyle = C(it.role || 'accent'); ctx.setLineDash([10, 8]); ctx.lineWidth = 2.5; ctx.strokeRect(it.x, it.y, it.w * p, it.h); ctx.setLineDash([]); },
  // the finished drawing slides off to the left like a sheet pulled from the table
  beginScene(beat, lt, out) { ctx.save(); ctx.beginPath(); ctx.rect(F.bx - 8, 0, F.bw + 16, F.H); ctx.clip(); /* the slide stays inside the sheet border */ ctx.translate(-F.W * ease(out) * 1.05, 0); },
  endScene() { ctx.restore(); },
  // captions sit on a darker plate with a ruled edge, so they read over any drawing
  caption(lines, dt, g) {
    const x = F.bx - 6, w = F.bw + 12, h = g.lh * 2 + g.size * 0.7;
    ctx.fillStyle = 'rgba(8,34,72,0.72)'; ctx.fillRect(x, g.y - h / 2, w, h);
    ctx.strokeStyle = LINE(0.35); ctx.lineWidth = 2; ctx.strokeRect(x, g.y - h / 2, w, h);
    ctx.globalAlpha = g.a; ctx.font = g.css; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = C('ink');
    lines.forEach((l, i) => ctx.fillText(l, g.x, g.ys[i]));
    ctx.globalAlpha = 1;
  },
  // title block, bottom right: topic, drawing number and the sheet (beat) we are on
  post(t) {
    const s = U(0.023), w = U(0.42), h = s * 5, x = F.bx + F.bw + U(0.02) - w, y = F.capY + U(0.2);
    if (y + h > F.H - 20) return; // no room under the captions in this format
    const n = V.beats.length + 1, i = V.beats.filter(b => t >= b.a).length + (t >= V.endAt ? 1 : 0) || 1; // the end card is the last sheet
    ctx.strokeStyle = LINE(0.6); ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
    ctx.beginPath(); ctx.moveTo(x, y + h / 3); ctx.lineTo(x + w, y + h / 3); ctx.moveTo(x, y + h * 2 / 3); ctx.lineTo(x + w, y + h * 2 / 3); ctx.lineWidth = 1; ctx.stroke();
    ctx.font = `400 ${Math.round(s)}px "B612 Mono"`; ctx.fillStyle = LINE(0.75); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    [V.topic || 'HOW TO HERO', 'DWG  ' + String(V.id || '').toUpperCase(), `SCALE  NTS   SHEET ${i}/${n}`].forEach((l, k) => ctx.fillText(l, x + s * 0.6, y + h * (k * 2 + 1) / 6, w - s * 1.2));
  },

  intents: {
    // a drafting dimension: thin line, slashed ticks, the label written along the line
    dim(it, p) {
      const { x1, y1, x2, y2 } = it, c = C(it.role || 'accent'), a = Math.atan2(y2 - y1, x2 - x1), xe = x1 + (x2 - x1) * p, ye = y1 + (y2 - y1) * p, k = U(0.0105);
      const tick = (x, y) => strokePoly([[x - k * Math.cos(a + 0.8), y - k * Math.sin(a + 0.8)], [x + k * Math.cos(a + 0.8), y + k * Math.sin(a + 0.8)]], 2, c);
      strokePoly([[x1, y1], [xe, ye]], 2, c); tick(x1, y1); if (p > 0.98) tick(x2, y2);
      if (p <= 0.6) return;
      ctx.save(); ctx.translate((x1 + x2) / 2, (y1 + y2) / 2); ctx.rotate(Math.abs(a) > 1.5 ? a + Math.PI : a);
      ctx.font = `400 ${Math.round(it.s || U(0.031))}px "B612 Mono"`; ctx.fillStyle = c; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.globalAlpha = clamp((p - 0.6) / 0.3, 0, 1); ctx.fillText(it.label, 0, -U(0.008)); ctx.restore(); ctx.globalAlpha = 1;
    },
    // section hatching: thin, evenly spaced 45 degree lines
    mk(it, p) {
      const x0 = it.rx ? it.x - it.rx : it.x, y0 = it.rx ? it.y - it.ry : it.y, w = it.rx ? it.rx * 2 : it.w, h = it.rx ? it.ry * 2 : it.h, g = U(0.017), n = Math.ceil((w + h) / g);
      ctx.save(); ctx.beginPath(); if (it.rx) ctx.ellipse(it.x, it.y, it.rx, it.ry, 0, 0, 7); else ctx.rect(x0, y0, w, h); ctx.clip();
      for (let i = 0; i < n * p; i++) strokePoly([[x0 + i * g - h, y0 + h], [x0 + i * g, y0]], 1.6, C(it.role || 'accent'), 0.7);
      ctx.restore();
    },
  },
};
