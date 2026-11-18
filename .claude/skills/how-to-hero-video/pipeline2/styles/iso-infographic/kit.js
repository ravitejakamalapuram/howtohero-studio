// Isometric infographic: solids with three shades each, set on a raised board, clean navy lines, Jost capitals. Notes in NOTES.md.
import { ctx, F, C, U, iso, strokePoly, partial, speckle, revealText, mix, writeText, resample, iconPolys, clamp, ease } from '../../engine/engine.js';

// Solids are filled, so each role also has a fill colour (softer than the line and text colour of the same role).
const FILL = { ink: '#F4F1EA', accent: '#3E5C9A', warn: '#E4675B', good: '#8CC98A', muted: '#B9B4AC', paper: '#E8CF9C' };
const SKY = '#7DB7E8', YEL = '#F2C14E', EDGE = 'rgba(35,26,44,0.55)', SHADE = 'rgba(35,26,44,0.13)';
const fill = (role, dflt) => FILL[role || dflt] || FILL.ink;
const pop = p => p < 1 ? p * (1 + Math.sin(p * Math.PI) * 0.12) : 1; // grow with a small overshoot

function poly(pts, colour, edge = EDGE, lw = 1.5) {
  ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath();
  ctx.fillStyle = colour; ctx.fill();
  if (edge) { ctx.strokeStyle = edge; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke(); }
}
// three faces from one base colour: top lighter and warmer, left as is, right darker and cooler
function faces(top, left, right, base) { poly(left, base); poly(right, mix(base, '#231A2C', 0.22)); poly(top, mix(base, '#FFF8EC', 0.2)); }
function box(gx, gy, gz, w, d, h, base, shadow) {
  const P = iso, t = gz + h;
  if (shadow && h > 2) { const s = Math.min(h * 0.35, U(0.08)); poly([P(gx + w, gy, gz), P(gx + w + s, gy, gz), P(gx + w + s, gy + d, gz), P(gx + w, gy + d, gz)], SHADE, null); }
  faces([P(gx, gy, t), P(gx + w, gy, t), P(gx + w, gy + d, t), P(gx, gy + d, t)],
    [P(gx, gy + d, gz), P(gx + w, gy + d, gz), P(gx + w, gy + d, t), P(gx, gy + d, t)],
    [P(gx + w, gy, gz), P(gx + w, gy + d, gz), P(gx + w, gy + d, t), P(gx + w, gy, t)], base);
}
const lerp = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];

export default {
  api: 1,
  slug: 'iso-infographic',
  tokens: {
    ink: '#2B2433', accent: '#3E5C9A', warn: '#D9503F', good: '#3F8F52', muted: '#857D72', paper: '#F5EFE2',
    fontHead: 'Jost', fontBody: 'Jost', wHead: 600, wBody: 600, luma: 'light',
  },
  capUpper: true,
  transOut: 0.35,

  // the backdrop is painted once: warm gradient, a pale dotted iso grid and a little paper grain
  init() {
    const { W, H } = F, c = this.back = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#F5EFE2'); gr.addColorStop(1, '#EADFCB'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const s = U(0.062); g.fillStyle = 'rgba(35,26,44,0.085)';
    for (let r = 0, y = 0; y < H; r++, y += s / 2) for (let x = (r % 2) * s * 0.866; x < W; x += s * 1.732) g.fillRect(x - 1.5, y - 1.5, 3, 3);
    g.drawImage(speckle(31, 6000, '#8a7a5c', 0.05, 2.2), 0, 0);
  },
  bg() { ctx.drawImage(this.back, 0, 0); },

  // an even vector line with round ends: no wobble, no pressure
  pen(pts, p, role, lw) { strokePoly(partial(resample(pts, 5), p), lw || U(0.0042), C(role), 1); },
  // every word gets a paper-coloured halo so it reads over solids and lines
  text(str, x, y, frac, it) {
    const px = parseInt(it.css.match(/(\d+)px/)[1]);
    revealText(str, x, y, frac, it.css, C(it.role), it.align, (s, xx, yy) => { ctx.lineJoin = 'round'; ctx.lineWidth = clamp(px * 0.26, 8, 16); ctx.strokeStyle = C('paper'); ctx.strokeText(s, xx, yy); });
  },
  highlight(it, p) { ctx.globalAlpha = 0.5; ctx.fillStyle = it.role ? fill(it.role) : YEL; ctx.fillRect(it.x, it.y, it.w * p, it.h); ctx.globalAlpha = 1; },
  // the whole diorama settles in at the start of a beat and eases back at the end; no fades
  beginScene(beat, lt, out) { const s = 0.96 + 0.04 * clamp(lt / 0.35, 0, 1) * (1 - out), cx = F.W / 2, cy = F.by + F.bh * 0.52; ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy); },
  endScene() { ctx.restore(); },

  intents: {
    box(it, p) { box(it.gx, it.gy, it.gz || 0, it.w, it.dp, it.h * pop(p), fill(it.role), !it.gz); },
    tower(it, p) { // a pale shaft with a glass cab that lands on top
      const t = U(0.031), h = it.h * p; box(it.gx, it.gy, 0, t, t, h, FILL.ink, true);
      if (p > 0.8) box(it.gx - t * 0.4, it.gy - t * 0.4, h, t * 1.8, t * 1.8, t * 0.87, it.role ? fill(it.role) : SKY);
    },
    dishsite(it, p) { // a short mast with a dish
      const t = U(0.027), h = U(0.073) * p; box(it.gx, it.gy, 0, t, t, h, FILL.muted, true);
      if (p <= 0.7) return;
      const [x, y] = iso(it.gx + t / 2, it.gy + t / 2, h + U(0.031));
      ctx.fillStyle = FILL.ink; ctx.strokeStyle = C('ink'); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, U(0.042), U(0.023), -0.5, 0, 7); ctx.fill(); ctx.stroke();
    },
    slab(it, p) { // the board: a soft shadow, a soil edge that rises, then the ground colour on top
      const { gx, gy, w, dp } = it, k = U(0.025), P = iso;
      ctx.save(); ctx.shadowColor = 'rgba(35,26,44,0.28)'; ctx.shadowBlur = U(0.05); ctx.shadowOffsetY = U(0.03) * p;
      poly([P(gx, gy, -k), P(gx + w, gy, -k), P(gx + w, gy + dp, -k), P(gx, gy + dp, -k)], FILL.paper, null); ctx.restore();
      box(gx, gy, -k, w, dp, k * p, FILL.paper);
      poly([P(gx, gy, k * p - k), P(gx + w, gy, k * p - k), P(gx + w, gy + dp, k * p - k), P(gx, gy + dp, k * p - k)], mix(fill(it.role, 'good'), '#FFF8EC', 0.2));
    },
    link(it, p, lt) { // a dashed cable between two grid points; packets travel along it, or a cross marks the cut
      const a = iso(...it.a), b = iso(...it.b), c = C(it.broken ? 'warn' : it.role || 'accent'), k = U(0.023);
      ctx.setLineDash([U(0.0146), U(0.0104)]); strokePoly([a, lerp(a, b, p)], U(0.0042), c); ctx.setLineDash([]);
      if (p < 1) return;
      if (it.broken) { const m = lerp(a, b, 0.5); strokePoly([[m[0] - k, m[1] - k], [m[0] + k, m[1] + k]], U(0.0083), c); strokePoly([[m[0] + k, m[1] - k], [m[0] - k, m[1] + k]], U(0.0083), c); }
      else for (let i = 0; i < 3; i++) { const q = lerp(a, b, (lt * 0.6 + i / 3) % 1); ctx.fillStyle = YEL; ctx.beginPath(); ctx.arc(q[0], q[1], U(0.0094), 0, 7); ctx.fill(); }
    },
    iplane(it, p, lt) { // a filled plane that pops in at a and flies to b, with its shadow on the ground below
      const q = it.fly ? ease(clamp((lt - (it.at || 0)) / it.fly, 0, 1)) : 1, e = it.b || it.a, a = iso(...it.a), b = iso(...e), [x, y] = lerp(a, b, q);
      const g = lerp(iso(it.a[0], it.a[1], 0), iso(e[0], e[1], 0), q), s = it.s * pop(p);
      ctx.fillStyle = SHADE; ctx.beginPath(); ctx.ellipse(g[0], g[1], s * 0.34, s * 0.12, 0, 0, 7); ctx.fill();
      for (const pl of iconPolys('plane', x, y, s, Math.atan2(b[1] - a[1], b[0] - a[0]) || 0)) poly(pl, fill(it.role), C('ink'), Math.max(2, s * 0.035));
    },
    // labels fade in whole instead of being written letter by letter
    label(it, p) { const [x, y] = it.gx !== undefined ? iso(it.gx, it.gy, it.gz) : [it.x, it.y]; ctx.globalAlpha = p; writeText({ ...it, x, y, s: it.s || U(0.036) }, 1); ctx.globalAlpha = 1; },
    // a flat tint instead of marker hatching
    mk(it, p) { ctx.globalAlpha = 0.45 * p; ctx.fillStyle = fill(it.role, 'accent'); ctx.beginPath(); if (it.rx) ctx.ellipse(it.x, it.y, it.rx, it.ry, 0, 0, 7); else ctx.rect(it.x, it.y, it.w, it.h); ctx.fill(); ctx.globalAlpha = 1; },
    // bar chart as a row of three-tone columns standing on a thin base
    bars(it, p) {
      const n = it.vals.length, max = Math.max(...it.vals), bw = it.w / n, y0 = it.y + it.h, dx = bw * 0.17, dy = dx * 0.58, col = (x, y, w, h, base) => {
        faces([[x, y], [x + w, y], [x + w + dx, y - dy], [x + dx, y - dy]], [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], [[x + w, y], [x + w + dx, y - dy], [x + w + dx, y + h - dy], [x + w, y + h]], base); };
      col(it.x, y0, it.w * clamp(p * 3, 0, 1), U(0.012), FILL.paper);
      it.vals.forEach((v, i) => {
        const q = clamp(p * (n + 1) - i, 0, 1), h = it.h * v / max * pop(q); if (q <= 0) return;
        col(it.x + bw * (i + 0.15), y0 - h, bw * 0.55, h, fill(it.role, 'accent'));
        if (it.labels) writeText({ txt: String(it.labels[i]), x: it.x + bw * (i + 0.45), y: y0 + U(0.055), s: U(0.034), role: 'ink' }, q);
      });
    },
  },
};
