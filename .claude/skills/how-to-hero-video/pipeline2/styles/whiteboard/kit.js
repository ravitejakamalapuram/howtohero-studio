// Whiteboard: dry-erase marker on a glossy white board. Ported from the prototype the owner approved.
// Added since the prototype: ink darkens where strokes cross, a pooled dot that stays inside the stroke start,
// faint leftovers of earlier drawings, thin gaps in the ink, and an eraser that leaves a faint trace.
import { ctx, F, C, strokePoly, wobble, partial, speckle, hash, circlePts, clamp, ease } from '../../engine/engine.js';

const HILITE = 'rgba(255,214,60,0.55)'; // the yellow highlighter behind captions (a prop of this kit, not a role)
const WIPED = '#f2f3ef';

export default {
  api: 1,
  slug: 'whiteboard',
  tokens: {
    ink: '#1d1f24', accent: '#1f5fbf', warn: '#d23a2a', good: '#23864a', muted: '#868c95', paper: '#f7f7f3',
    fontHead: 'Kalam', fontBody: 'Kalam', wHead: 700, wBody: 700, // one hand writes everything
    luma: 'light',
  },
  transOut: 0.45,

  init() {
    this.dry = speckle(5, 9000, C('paper'), 0.55, 3); // dry-marker gaps, drawn over the ink in post()
    // long thin streaks along the writing direction
    const d = this.dry.getContext('2d'); d.fillStyle = C('paper'); d.globalAlpha = 0.3;
    for (let i = 0; i < 1400; i++) d.fillRect(hash(i * 2.3) * F.W, hash(i * 5.9) * F.H, 14 + hash(i * 1.7) * 40, 1.5);
    // ghost marks: faint leftovers of earlier lessons (a few circles, strokes and underlines)
    const c = this.ghost = document.createElement('canvas'); c.width = F.W; c.height = F.H;
    const g = c.getContext('2d'); g.lineCap = 'round'; g.strokeStyle = '#7f8aa0';
    for (let i = 0; i < 12; i++) {
      const x = hash(i * 3.7 + 1) * F.W, y = hash(i * 9.1 + 2) * F.H, r = 40 + hash(i * 4.3) * 110, a = hash(i * 6.1) * 6.3;
      const pts = i % 3 ? [[x, y], [x + Math.cos(a) * r * 2.4, y + Math.sin(a) * r * 0.6]] : circlePts(x, y, r, a, a + 5.2);
      const w = wobble(pts, 4, i + 60);
      g.globalAlpha = 0.02 + hash(i * 8.3) * 0.03; g.lineWidth = 9 + hash(i) * 8;
      g.beginPath(); w.forEach((q, j) => j ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke();
    }
  },

  bg(t) {
    const g = ctx.createLinearGradient(0, 0, F.W, F.H); g.addColorStop(0, C('paper')); g.addColorStop(1, '#eceeea');
    ctx.fillStyle = g; ctx.fillRect(0, 0, F.W, F.H);
    ctx.drawImage(this.ghost, 0, 0);
    // window sheen drifting slowly across the glossy board
    const sx = (t * 18) % (F.W * 2) - F.W * 0.5, sh = ctx.createLinearGradient(sx, 0, sx + 500, 300);
    sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(0.5, 'rgba(255,255,255,0.35)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sh; ctx.fillRect(0, 0, F.W, F.H);
  },

  pen(pts, p, role, lw, seed) {
    const w = partial(wobble(pts, 2.2, seed), p), c = C(role), n = lw || 7;
    ctx.save();
    if (role !== 'paper') ctx.globalCompositeOperation = 'multiply'; // overlaps get darker
    strokePoly(w, n, c, 0.9);
    strokePoly(w, n * 0.45, c, 0.45); // wetter core
    ctx.globalAlpha = 0.5; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(w[0][0], w[0][1], n * 0.42, 0, 7); ctx.fill(); // a blob of ink at the stroke start
    ctx.restore();
  },

  // a marker swipe behind something that matters
  highlight(it, p) {
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.35; ctx.fillStyle = C(it.role || 'warn');
    ctx.fillRect(it.x, it.y, it.w * p, it.h); ctx.restore();
  },

  // captions: ink over a yellow highlighter bar per line
  caption(lines, dt, g) {
    ctx.save(); ctx.globalAlpha = g.a; ctx.font = g.css; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    lines.forEach((l, i) => {
      const w = ctx.measureText(l).width, h = g.size * 0.96;
      ctx.fillStyle = HILITE; ctx.fillRect(g.x - w / 2 - 14, g.ys[i] - h / 2, w + 28, h);
      ctx.fillStyle = C('ink'); ctx.fillText(l, g.x, g.ys[i]);
    });
    ctx.restore();
  },

  // the eraser sweeps the board clean before the next beat; a faint trace of the drawing stays
  endScene(beat, lt, out) {
    if (out <= 0) return;
    const x = F.bx + F.bw * out, ew = F.u * 0.085, eh = F.u * 0.18, y = F.by + F.bh * (0.42 + 0.3 * Math.sin(out * 7));
    ctx.save(); ctx.beginPath(); ctx.rect(F.bx - 8, F.by - 8, F.bw + 16, F.bh + 16); ctx.clip(); // wipe and eraser stay in the safe box
    ctx.globalAlpha = 0.94; ctx.fillStyle = WIPED; ctx.fillRect(0, 0, x, F.H);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x - ew / 2 + 8, y - eh / 2 + 12, ew, eh); // cast shadow
    ctx.fillStyle = '#2c2f36'; ctx.fillRect(x - ew / 2, y - eh / 2, ew, eh);
    ctx.fillStyle = '#c9ccd2'; ctx.fillRect(x - ew / 2, y + eh / 2 - eh * 0.13, ew, eh * 0.13); // felt
    ctx.restore();
  },

  intents: {
    // bar charts get a marker wash inside each bar; the engine then draws the outlines and labels
    bars(it, p) {
      const n = it.vals.length, max = Math.max(...it.vals), bw = it.w / n;
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.22; ctx.fillStyle = C(it.role || 'accent');
      it.vals.forEach((v, i) => { const h = it.h * v / max * ease(clamp(p * (n + 1) - i, 0, 1)); ctx.fillRect(it.x + bw * (i + 0.15), it.y + it.h - h, bw * 0.7, h); });
      ctx.restore(); return false;
    },
  },

  post() { ctx.globalAlpha = 0.5; ctx.drawImage(this.dry, 0, 0); ctx.globalAlpha = 1; },
};
