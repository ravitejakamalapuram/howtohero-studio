// The fixed brand layer. Kits change stroke, texture and font; they never change the wording or where things sit.
// Rules here: the hook is fully on screen at frame 0; captions sit at one place, at most 2 lines, at a fixed size
// (56 px on a Short); the end card wording comes from the video's `card`; the mascot's cape is always red;
// a thin progress bar runs along the bottom edge.
import { F, K, V, ctx, C, U, Y, clamp, ease, wrap, fontOf, writeText, iconPolys } from './engine.js';

const CAPE = '#E5384F';
const capCss = () => `${K.tokens.wBody || 400} ${F.capSize}px ${K.tokens.fontBody}`;
// largest size (pixels) up to `s` at which every line fits the box width
function fit(lines, s, font, min = 30) {
  const w = l => { ctx.font = fontOf({ s, font }); return ctx.measureText(l).width; };
  while (s > min && lines.some(l => w(l) > F.bw * 0.96)) s -= 2; // writeText wraps at 0.98
  return s;
}

// split a beat's line into caption chunks of at most 2 lines; each chunk starts when its first word is spoken.
// The chunks are about the same length and end on a comma or full stop when one is near, so no word is left on its own.
export function captions(b) {
  if (!b.say) return [];
  const css = capCss(), maxW = F.bw - 20, W = (K.capUpper ? b.say.toUpperCase() : b.say).split(/\s+/), n = W.length;
  const txt = (i, j) => W.slice(i, j).join(' '), fits = (i, j) => wrap(txt(i, j), css, maxW).length <= 2, stop = i => /[.,:;!?]$/.test(W[i]);
  let N = 1; for (let i = 1, a = 0; i < n; i++) if (!fits(a, i + 1)) { a = i; N++; } // the fewest chunks that hold the line
  const goal = txt(0, n).length / N, cost = (i, j) => fits(i, j) ? (txt(i, j).length - goal) ** 2 - (j < n && stop(j - 1) ? 300 : 0) : Infinity;
  // best[j] = [cost, cuts] of the cheapest way to cut the first j words into k chunks
  let best = W.concat('').map((_, j) => [cost(0, j), [0]]);
  for (let k = 2; k <= N; k++) best = best.map((_, j) => { let m = [Infinity]; for (let i = k - 1; i < j; i++) { const c = best[i][0] + cost(i, j); if (c < m[0]) m = [c, [...best[i][1], i]]; } return m; });
  const cuts = best[n][1], w = s => { ctx.font = css; return ctx.measureText(s).width; };
  const lines = (i, j) => { // one line, or two lines of about the same width
    if (w(txt(i, j)) <= maxW) return [txt(i, j)];
    let m = null; for (let k = i + 1; k < j; k++) { const a = w(txt(i, k)), c = w(txt(k, j)), d = Math.abs(a - c); if (a <= maxW && c <= maxW && (!m || d < m[0])) m = [d, k]; }
    return [txt(i, m[1]), txt(m[1], j)];
  };
  return cuts.map((c, i) => ({ t: b.wt[c], lines: lines(c, cuts[i + 1] ?? n) }));
}
export function caption(sc, t) {
  let c = null; for (const k of sc.caps) if (t >= k.t) c = k;
  if (!c) return;
  const lh = F.capSize * 1.18, n = c.lines.length;
  const g = { x: F.W / 2, y: F.capY, ys: c.lines.map((_, i) => F.capY + (i - (n - 1) / 2) * lh), size: F.capSize, lh, css: capCss(), a: clamp((t - c.t) / 0.18, 0, 1) };
  if (K.caption) return K.caption(c.lines, t - c.t, g);
  ctx.globalAlpha = g.a; ctx.font = g.css; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = g.size * 0.25;
  c.lines.forEach((l, i) => { ctx.strokeStyle = C('paper'); ctx.strokeText(l, g.x, g.ys[i]); ctx.fillStyle = C('ink'); ctx.fillText(l, g.x, g.ys[i]); });
  ctx.globalAlpha = 1;
}

// hook: the topic label and up to 2 big lines at the top of the box, one word in the accent colour. Shown for all of beat 1.
export function hook(t) {
  const h = V.hook; if (!h) return;
  if (K.hook) return K.hook(t, h);
  const s = fit(h.lines, U(0.117)), css = fontOf({ s }), sz = parseInt(css.match(/(\d+)px/)[1]), acc = (h.accent || '').toLowerCase();
  let y = Y(0.02);
  if (V.topic) { K.text(V.topic, F.W / 2, y, 1, { css: fontOf({ s: U(0.036), font: 'body' }), role: 'muted', align: 'center' }); y += U(0.036); }
  y += sz * 0.6;
  for (const l of h.lines) {
    ctx.font = css; let x = F.W / 2 - ctx.measureText(l).width / 2;
    for (const w of l.split(' ')) {
      K.text(w, x, y, 1, { css, role: acc && w.toLowerCase().replace(/[^a-z0-9]/g, '') === acc ? 'accent' : 'ink', align: 'left' });
      ctx.font = css; x += ctx.measureText(w + ' ').width;
    }
    y += sz * 1.08;
  }
}

// the mascot: a stick-figure hero drawn with the kit pen, with a red cape
export function mascot(x, y, s, p) {
  if (p <= 0) return;
  const cape = [[-2, -20], [-34, 2], [-26, 34], [-8, 14], [0, -8]].map(([a, b]) => [x + a * s / 100, y + b * s / 100]);
  ctx.save(); ctx.globalAlpha = clamp(p * 2 - 0.4, 0, 1); ctx.fillStyle = CAPE; ctx.beginPath(); cape.forEach((q, i) => i ? ctx.lineTo(...q) : ctx.moveTo(...q)); ctx.closePath(); ctx.fill(); ctx.restore();
  iconPolys('hero', x, y, s).forEach((pl, j) => { const q = clamp(p * 6 - j, 0, 1); if (q > 0) K.pen(pl, q, 'ink', undefined, 40 + j); });
}
export function endCard(dt) {
  const lines = (V.card && V.card.lines) || ['FOLLOW FOR MORE', 'HOW TO HERO'], n = lines.length;
  if (K.endCard) return K.endCard(dt, { lines, mascot });
  // each line gets its own size: a short last line stays big, and a long line wraps rather than shrinking below 3/4
  let y = Y(0.26);
  lines.forEach((txt, i) => {
    const s = fit([txt], U(0.085), undefined, U(0.064)), css = fontOf({ s }), lh = parseInt(css.match(/(\d+)px/)[1]) * 1.15;
    let max = F.bw * 0.96; const rows = wrap(txt, css, max).length;
    if (rows > 1) { ctx.font = css; max = Math.min(max, ctx.measureText(txt).width / rows * 1.15); } // wrapped rows of about the same width
    writeText({ txt, x: F.W / 2, y, s, max, role: i === n - 1 ? 'accent' : 'ink' }, ease((dt - i * 0.5) / 0.8));
    y += wrap(txt, css, max).length * lh + lh * 0.2;
  });
  mascot(F.W / 2, Math.max(Y(0.72), y + U(0.3)), U(0.55), ease((dt - 0.5) / 1));
}
export function progress(t) {
  ctx.globalAlpha = 0.25; ctx.fillStyle = C('muted'); ctx.fillRect(0, F.H - 10, F.W, 10);
  ctx.globalAlpha = 1; ctx.fillStyle = C('accent'); ctx.fillRect(0, F.H - 10, F.W * clamp(t / V.dur, 0, 1), 10);
}
