// Sketchnote: a fineliner and a few fat markers on dot-grid notebook paper. Ported from the prototype the owner approved.
// The whole video is one tall page: each beat is drawn one box-height further down and the camera pans to it.
// Added since the prototype: dot grid that pans with the page, ink that pools at stroke ends, a faint second pen pass,
// uneven marker bands, a grey marker shadow under banners, and "accent" drawn as ink over yellow marker.
import { ctx, F, C, V, U, strokePoly, wobble, partial, speckle, revealText, writeText, drawScene, hash, ease, clamp } from '../../engine/engine.js';

// fat marker tints per role (translucent, multiplied onto the paper); a raw CSS colour passes through
const MARK = { accent: 'rgba(255,205,40,0.80)', good: 'rgba(80,170,90,0.55)', warn: 'rgba(225,80,60,0.50)', muted: 'rgba(80,80,92,0.28)', ink: 'rgba(80,80,92,0.28)' };
const tint = role => MARK[role] || C(role);
const px = css => parseInt(css.match(/(\d+)px/)[1]);

// one flat marker swipe from x to x + w, centred on y
function swipe(x, y, w, h, role, alpha) {
  if (w <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; strokePoly([[x, y], [x + w, y - 3]], h, tint(role), alpha); ctx.restore();
}

export default {
  api: 1,
  slug: 'sketchnote',
  tokens: {
    ink: '#1E1E22', accent: '#F2B705', warn: '#D8432F', good: '#2F8F4A', muted: '#5B5852', paper: '#FBFAF6',
    fontHead: 'Kalam', fontBody: '"Patrick Hand"', wHead: 700, wBody: 400,
    luma: 'light',
  },

  init() {
    this.grain = speckle(31, 5000, '#8a7f6a', 0.05, 2);
    // dot grid, one step taller than the frame so it can scroll with the page
    const st = this.step = Math.round(U(0.05)), c = this.dots = document.createElement('canvas'); c.width = F.W; c.height = F.H + st;
    const g = c.getContext('2d'); g.fillStyle = '#9d988a'; g.globalAlpha = 0.5;
    for (let y = st / 2; y < c.height; y += st) for (let x = st / 2; x < F.W; x += st) { g.beginPath(); g.arc(x, y, 2, 0, 7); g.fill(); }
  },

  bg(t) {
    // where the camera is on the page: beat i sits i box-heights down, and the pan takes 0.9 s
    const B = V.beats; let i = B.length - 1; while (i > 0 && t < B[i].a) i--;
    this.cy = i ? F.bh * (i - 1 + ease((t - B[i].a) / 0.9)) : 0;
    ctx.fillStyle = C('paper'); ctx.fillRect(0, 0, F.W, F.H);
    ctx.drawImage(this.dots, 0, -(this.cy % this.step)); ctx.drawImage(this.grain, 0, 0);
  },

  // fineliner. "accent" is the yellow thread: a fat marker stroke with the ink line on top (bars get a wash instead).
  pen(pts, p, role, lw, seed, it) {
    const w = partial(wobble(pts, 1.4, seed), p), n = lw || U(0.0047), mark = role === 'accent' && !(it && it.k === 'bars'), c = mark ? C('ink') : C(role);
    ctx.save();
    if (mark) { ctx.globalCompositeOperation = 'multiply'; strokePoly(w, n * 3.4, MARK.accent, 0.7); ctx.globalCompositeOperation = 'source-over'; }
    strokePoly(w, n, c, 0.95);
    strokePoly(partial(wobble(pts, 2.4, seed + 3), p), n * 0.45, c, 0.22); // a second, lighter pass, like a retraced line
    ctx.fillStyle = c; ctx.globalAlpha = 0.9; // a blob of ink at the stroke start, and at its end once the stroke is done
    for (const q of p >= 1 ? [w[0], w[w.length - 1]] : [w[0]]) { ctx.beginPath(); ctx.arc(q[0], q[1], Math.min(n, U(0.007)) * 0.68, 0, 7); ctx.fill(); }
    ctx.restore();
  },

  // accent words are ink on a yellow marker swipe, so they stay readable on pale paper
  text(str, x, y, frac, it) {
    const acc = it.role === 'accent';
    if (acc) {
      ctx.font = it.css; const s = px(it.css), w = ctx.measureText(str).width, l = it.align === 'left' ? x : it.align === 'right' ? x - w : x - w / 2;
      swipe(l + s * 0.2, y + s * 0.06, w * frac - s * 0.4, s * 0.78, 'accent', 0.7);
    }
    revealText(str, x, y, frac, it.css, C(acc ? 'ink' : it.role), it.align);
  },

  highlight(it, p) { swipe(it.x, it.y + it.h / 2, it.w * p, it.h, it.role || 'accent', 0.6); },

  // captions: ink on a strip of clean paper per line
  caption(lines, dt, g) {
    ctx.save(); ctx.globalAlpha = g.a; ctx.font = g.css; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    lines.forEach((l, i) => {
      const w = ctx.measureText(l).width, h = g.size * 1.1;
      ctx.fillStyle = 'rgba(251,250,246,0.94)'; ctx.fillRect(g.x - w / 2 - 16, g.ys[i] - h / 2, w + 32, h);
      ctx.fillStyle = C('ink'); ctx.fillText(l, g.x, g.ys[i]);
    });
    ctx.restore();
  },

  // persistent page: pan down to this beat; the beat before stays drawn above it
  beginScene(beat, lt, out, i) {
    ctx.save(); ctx.beginPath(); ctx.rect(0, F.by - 8, F.W, F.bh + 16); ctx.clip(); // the page shows through the safe box only, never over the captions
    ctx.translate(0, -this.cy);
    if (i) { ctx.save(); ctx.translate(0, (i - 1) * F.bh); drawScene(i - 1, 99); ctx.restore(); }
    ctx.translate(0, i * F.bh);
  },
  endScene() { ctx.restore(); },

  intents: {
    // marker fill of an ellipse or rect, laid in slanted bands that overlap unevenly
    mk(it, p) {
      const el = it.rx, x0 = el ? it.x - it.rx : it.x, y0 = el ? it.y - it.ry : it.y, w = el ? it.rx * 2 : it.w, h = el ? it.ry * 2 : it.h;
      const g = U(0.027), n = Math.ceil((w + h) / g);
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.beginPath();
      if (el) ctx.ellipse(it.x, it.y, it.rx, it.ry, 0, 0, 7); else ctx.rect(x0, y0, w, h);
      ctx.clip();
      for (let i = 0; i < n * p; i++) { const x = x0 + i * g + (hash(i * 5.3) - 0.5) * g * 0.35; strokePoly([[x - h, y0 + h + 10], [x + 10, y0 - 10]], g * 1.3, tint(it.role || 'accent'), 0.55); }
      ctx.restore();
    },
    // ribbon cut from clean paper, with a grey marker shadow below and to the right; a role tints the ribbon
    banner(it, p) {
      const { x, y, w } = it, h = U(0.1), k = U(0.021);
      swipe(x - w / 2 + k, y + h / 2 + k * 0.5, (w - k) * p, k, 'muted', 0.9);
      ctx.fillStyle = C('paper'); ctx.fillRect(x - w / 2, y - h / 2, w * p, h);
      if (it.role && it.role !== 'ink') this.intents.mk({ x: x - w / 2, y: y - h / 2, w: w * p, h, role: it.role }, 1);
      this.pen([[x - w / 2, y - h / 2], [x + w / 2, y - h / 2 + 4], [x + w / 2 - k, y], [x + w / 2, y + h / 2], [x - w / 2, y + h / 2 - 4], [x - w / 2 + k, y], [x - w / 2, y - h / 2]], p, 'ink', undefined, 7);
      if (p > 0.5) writeText({ ...it, y: y + 2, s: it.s || U(0.058), role: 'ink' }, (p - 0.5) * 2);
    },
    // bars: a marker wash inside each bar; the engine then draws outlines and labels
    bars(it, p) {
      const n = it.vals.length, max = Math.max(...it.vals), bw = it.w / n;
      it.vals.forEach((v, i) => {
        const q = clamp(p * (n + 1) - i, 0, 1), h = it.h * v / max * ease(q);
        if (q > 0) this.intents.mk({ x: it.x + bw * (i + 0.15), y: it.y + it.h - h, w: bw * 0.7, h, role: it.role }, 1);
      });
      return false;
    },
  },
};
