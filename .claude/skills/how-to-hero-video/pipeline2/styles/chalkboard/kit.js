// Chalkboard: white and coloured chalk on a green slate in a wooden frame. Notes in NOTES.md.
import { ctx, F, C, U, strokePoly, wobble, partial, speckle, revealText, noise1, hash } from '../../engine/engine.js';

// a blurred copy of a texture canvas, so patches have no hard edges
function soft(src, px) { const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; const g = c.getContext('2d'); g.filter = `blur(${px}px)`; g.drawImage(src, 0, 0); return c; }

export default {
  api: 1,
  slug: 'chalkboard',
  tokens: {
    ink: '#F2F0E6', accent: '#F3D36B', warn: '#F2A2B8', good: '#A8DDA0', muted: '#8EC9F0', paper: '#22322a',
    fontHead: '"Cabin Sketch"', fontBody: '"Patrick Hand"', wHead: 700, wBody: 400, luma: 'dark',
  },
  transOut: 0.45,

  init() {
    this.dust = speckle(3, 22000, '#26372E', 0.55, 3.2);  // slate grain that shows through the chalk
    this.smear = soft(speckle(11, 220, '#e8efe8', 0.03, 90), 14); // cloudy patches left by old wipes
    this.fine = speckle(17, 4000, '#ffffff', 0.05, 2);    // chalk dust on the board
    // long faint eraser streaks, slightly tilted
    const c = this.streak = document.createElement('canvas'); c.width = F.W; c.height = F.H; const g = c.getContext('2d');
    g.strokeStyle = '#e8efe8'; g.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const x = hash(i * 2.3) * F.W, y = hash(i * 5.9) * F.H, l = F.W * (0.25 + hash(i * 9.1) * 0.5);
      g.globalAlpha = 0.012 + hash(i * 4.7) * 0.02; g.lineWidth = 40 + hash(i * 7.3) * 90;
      g.beginPath(); g.moveTo(x - l / 2, y); g.lineTo(x + l / 2, y - l * 0.06); g.stroke();
    }
  },
  bg() {
    const { W, H } = F, g = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.1, W / 2, H / 2, Math.hypot(W, H) * 0.65);
    g.addColorStop(0, '#2c4136'); g.addColorStop(1, '#1b2722'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(this.streak, 0, 0); ctx.drawImage(this.smear, 0, 0); ctx.drawImage(this.fine, 0, 0);
    const fr = U(0.027); ctx.fillStyle = '#6b4a2b'; ctx.fillRect(0, 0, W, fr); ctx.fillRect(0, H - fr, W, fr);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, fr, W, 4); // the frame's shadow on the slate
  },
  // three thin passes that do not quite overlap give the dry, broken edge of chalk
  pen(pts, p, role, lw, seed = 1) {
    const c = C(role), w = lw || U(0.00625), q = partial(wobble(pts, 1.6, seed), p), n = q.length;
    for (let k = 0; k < 3; k++) strokePoly(q.map(([x, y], i) => [x + noise1(i / 3, seed + k * 13) * 1.6, y + noise1(i / 3, seed + k * 29) * 1.6]), w * (1 - k * 0.2), c, 0.5);
    const e = Math.max(2, Math.min(6, n >> 2)); // chalk presses harder where a stroke starts and stops
    strokePoly(q.slice(0, e), w * 0.9, c, 0.3);
    if (p < 1) return;
    strokePoly(q.slice(n - e), w * 0.9, c, 0.3);
    ctx.fillStyle = c; ctx.globalAlpha = 0.6; // a couple of loose grains at the lift-off
    for (let k = 0; k < 2; k++) { const r = 1 + hash(seed + k * 3.7) * 1.6; ctx.fillRect(q[n - 1][0] + (hash(seed * 1.9 + k) - 0.5) * w * 4, q[n - 1][1] + (hash(seed * 2.3 + k) - 0.5) * w * 4, r, r); }
    ctx.globalAlpha = 1;
  },
  text(str, x, y, frac, it) {
    const c = C(it.role);
    revealText(str, x, y, frac, it.css, c, it.align, (s, xx, yy) => { ctx.fillStyle = c; ctx.globalAlpha = 0.25; ctx.fillText(s, xx + 1.5, yy + 1.2); ctx.globalAlpha = 1; });
  },
  highlight(it, p) { this.pen([[it.x, it.y + it.h], [it.x + it.w, it.y + it.h - 4]], p, it.role || 'accent', U(0.0052), 2); }, // a chalk underline
  // wipe the board: the old drawing fades into a haze
  endScene(beat, lt, out) {
    if (out <= 0) return;
    ctx.globalAlpha = 0.86 * out; ctx.fillStyle = C('paper'); ctx.fillRect(0, 0, F.W, F.H);
    ctx.globalAlpha = out; ctx.drawImage(this.smear, 0, 0); ctx.drawImage(this.streak, 0, 0); ctx.globalAlpha = 1;
  },
  post() { ctx.drawImage(this.dust, 0, 0); },

  intents: {
    mk(it, p) { // fills are shaded with the side of the chalk: wide faint strokes
      const x0 = it.rx ? it.x - it.rx : it.x, y0 = it.rx ? it.y - it.ry : it.y, w = it.rx ? it.rx * 2 : it.w, h = it.rx ? it.ry * 2 : it.h, n = Math.ceil((w + h) / 26);
      ctx.save(); ctx.beginPath(); if (it.rx) ctx.ellipse(it.x, it.y, it.rx, it.ry, 0, 0, 7); else ctx.rect(x0, y0, w, h); ctx.clip();
      for (let i = 0; i < n * p; i++) strokePoly(wobble([[x0 + i * 26 - h, y0 + h + 10], [x0 + i * 26 + 10, y0 - 10]], 3, i), U(0.036), C(it.role || 'accent'), 0.2);
      ctx.restore();
    },
  },
};
