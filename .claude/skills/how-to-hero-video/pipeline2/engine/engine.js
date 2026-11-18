// Draw-on engine. A video is a list of beats; each beat has items that appear at `at` (seconds after the beat starts)
// and draw on over `d` seconds. The kit (styles/<slug>/kit.js) supplies the pen, the paper and the fonts.
// Scene data is normalised: x,y are 0..1 of the safe box, sizes are fractions of the unit F.u. prep() turns it into pixels.
import { clamp, ease, hash, resample, circlePts, ellPts, rectPts, arrowHead, iconPolys, noise1 } from './icons.js';
import { CUSTOM } from './custom.js';
import * as brand from './brand.js';
export * from './icons.js';

export const FORMATS = {
  short: { W: 1080, H: 1920, bx: 60, by: 200, bw: 880, bh: 1160, u: 880, capY: 1500, capSize: 56 },
  doc: { W: 1920, H: 1080, bx: 120, by: 70, bw: 1680, bh: 780, u: 780, capY: 962, capSize: 46 },
};
export const F = {}; // the current format, filled by loadVideo
export const cv = document.getElementById('c'), ctx = cv.getContext('2d');
export let K = null, V = null; // current kit, current video
let KP = null, KA = null; // primary and accent kit

export const X = x => F.bx + x * F.bw, Y = y => F.by + y * F.bh, U = s => s * F.u;
export const C = role => K.tokens[role || 'ink'] || role; // semantic role -> the kit's colour
// isometric grid point -> pixels (grid values are already in pixels after prep)
export const iso = (gx, gy, gz = 0) => [F.bx + F.bw / 2 + (gx - gy) * 0.866, F.by + F.bh * 0.38 + (gx + gy) * 0.5 - gz];

// ---------- drawing helpers for kits ----------
export function strokePoly(pts, lw, color, alpha = 1) {
  if (pts.length < 2) return; ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke(); ctx.globalAlpha = 1;
}
export function wobble(pts, amp, seed) {
  const r = resample(pts, 6);
  return r.map(([x, y], i) => {
    const a = r[Math.max(0, i - 1)], b = r[Math.min(r.length - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    const o = amp * (noise1(i / 18, seed) + 0.35 * noise1(i / 4, seed + 9));
    return [x + nx * o, y + ny * o];
  });
}
export function partial(pts, p) { if (p >= 1) return pts; return pts.slice(0, Math.max(2, Math.floor(pts.length * p))); }
// draws the first `frac` of a line of text; `extra` runs inside the clip before the fill (for outlines, shadows)
export function revealText(str, x, y, frac, css, fill, align, extra) {
  ctx.font = css; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(str).width, left = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
  ctx.save(); ctx.beginPath(); ctx.rect(left - 10, y - 200, w * frac + 10, 400); ctx.clip();
  if (extra) extra(str, x, y, w, left); ctx.fillStyle = fill; ctx.fillText(str, x, y); ctx.restore();
}
export function speckle(seed, n, color, alpha, size) { // a fixed texture canvas
  const c = document.createElement('canvas'); c.width = F.W; c.height = F.H; const g = c.getContext('2d'); g.fillStyle = color; g.globalAlpha = alpha;
  for (let i = 0; i < n; i++) { const r = size * (0.3 + hash(i * 1.3 + seed)); g.fillRect(hash(i * 3.1 + seed) * F.W, hash(i * 7.7 + seed) * F.H, r, r * (0.4 + hash(i))); }
  return c;
}
export function mix(hex, to, a) { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(hex), B = p(to); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * a)).join(',') + ')'; }

// ---------- text ----------
export function wrap(txt, css, maxW) {
  ctx.font = css; const lines = []; let cur = '';
  for (const w of txt.split(' ')) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}
export function fontOf(it) { // it.s is in pixels here
  const T = K.tokens, body = it.font === 'body';
  return `${it.wt || (body ? T.wBody || 400 : T.wHead || 700)} ${Math.round(it.s * (T.textScale || 1))}px ${body ? T.fontBody : T.fontHead}`;
}
// writes a text item (pixels) letter by letter; y is the centre of the first line
export function writeText(it, p) {
  let css = fontOf(it);
  if (!it.max) { // meant as one line: shrink it (to 60% at most) to stay inside `fit` or the box, so a wide kit font does not wrap or spill
    const al = it.align || 'center', room = al === 'left' ? F.bx + F.bw - it.x : al === 'right' ? it.x - F.bx : 2 * Math.min(it.x - F.bx, F.bx + F.bw - it.x);
    ctx.font = css; const w = ctx.measureText(it.txt).width, lim = Math.min(it.fit || Math.max(room, F.bw * 0.2), F.bw * 0.96);
    if (w > lim && w * 0.6 <= F.bw * 0.96) css = fontOf({ ...it, s: it.s * Math.max(0.6, lim / w) }); // longer than that: it wraps
  }
  const lines = wrap(it.txt, css, it.max || F.bw * 0.98), lh = parseInt(css.match(/(\d+)px/)[1]) * (it.lh || 1.15);
  const total = lines.reduce((a, l) => a + l.length, 0), o = { ...it, css };
  let shown = Math.floor(total * p + 0.0001), y = it.y;
  for (const l of lines) { const n = clamp(shown, 0, l.length); shown -= l.length; if (n > 0) K.text(l, it.x, y, n / l.length, o); y += lh; }
}

// ---------- items: defaults built from the kit pen and text ----------
const pen = (pts, p, it, j = 0) => K.pen(pts, p, it.role, it.lw, (it.seed || 1) + j * 7 + Math.round(pts[0][0] + pts[0][1]), it);
export function polys(list, p, it) { const n = list.length; list.forEach((pl, j) => { const q = clamp(p * n - j, 0, 1); if (q > 0) pen(pl, q, it, j); }); }
export function boxEdges(gx, gy, gz, w, d, h) { // visible edges of an isometric box
  const P = iso, t = gz + h;
  return [[P(gx, gy + d, gz), P(gx + w, gy + d, gz), P(gx + w, gy, gz)], [P(gx, gy + d, gz), P(gx, gy + d, t)], [P(gx + w, gy + d, gz), P(gx + w, gy + d, t)], [P(gx + w, gy, gz), P(gx + w, gy, t)],
    [P(gx, gy, t), P(gx + w, gy, t), P(gx + w, gy + d, t), P(gx, gy + d, t), P(gx, gy, t)]];
}
const DEF = {
  text: (it, p) => writeText(it, p),
  hl: (it, p) => K.highlight(it, p),
  num: (it, p) => writeText({ ...it, txt: (it.pre || '') + Math.round((it.from || 0) + (it.to - (it.from || 0)) * p).toLocaleString('en-US') + (it.suf || '') }, 1),
  line: (it, p) => polys([it.pts], p, it),
  arrow: (it, p) => polys([it.pts, arrowHead(resample(it.pts, 4), it.hs || U(0.027))], p, it),
  circle: (it, p) => polys([circlePts(it.x, it.y, it.r, it.a0, it.a1)], p, it),
  ell: (it, p) => polys([ellPts(it.x, it.y, it.rx, it.ry, it.rot || 0, it.a0 || 0, it.a1 || Math.PI * 2.05)], p, it),
  rect: (it, p) => polys([rectPts(it.x, it.y, it.w, it.h)], p, it),
  icon: (it, p) => polys(iconPolys(it.name, it.x, it.y, it.s, it.rot || 0), p, it),
  move(it, p) { // an icon travelling along a path over d seconds
    const path = resample(it.path, 4), i = Math.min(path.length - 1, Math.floor(p * (path.length - 1))), a = path[Math.max(0, i - 1)], b = path[i];
    iconPolys(it.icon, b[0], b[1], it.s, it.rot !== undefined ? it.rot : Math.atan2(b[1] - a[1], b[0] - a[0])).forEach((pl, j) => K.pen(pl, 1, it.role, it.lw, (it.seed || 3) + j, it));
  },
  dim(it, p) { // a measured line with end ticks and a label
    const { x1, y1, x2, y2 } = it, o = { ...it, role: it.role || 'accent' }, a = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2, k = U(0.012);
    const tick = (x, y) => [[x - k * Math.cos(a), y - k * Math.sin(a)], [x + k * Math.cos(a), y + k * Math.sin(a)]];
    polys([[[x1, y1], [x2, y2]], tick(x1, y1), tick(x2, y2)], p, o);
    if (p > 0.6) writeText({ txt: it.label, x: (x1 + x2) / 2, y: (y1 + y2) / 2 - U(0.03), s: it.s || U(0.034), role: o.role, font: 'body' }, (p - 0.6) / 0.4);
  },
  mk(it, p) { // marker fill of an ellipse (rx, ry) or a rect (w, h): hatched strokes
    const x0 = it.rx ? it.x - it.rx : it.x, y0 = it.rx ? it.y - it.ry : it.y, w = it.rx ? it.rx * 2 : it.w, h = it.rx ? it.ry * 2 : it.h, n = Math.ceil((w + h) / 26);
    ctx.save(); ctx.beginPath(); if (it.rx) ctx.ellipse(it.x, it.y, it.rx, it.ry, 0, 0, 7); else ctx.rect(x0, y0, w, h); ctx.clip();
    for (let i = 0; i < n * p; i++) K.pen([[x0 + i * 26 - h, y0 + h + 10], [x0 + i * 26 + 10, y0 - 10]], 1, it.role || 'accent', U(0.004), i, it);
    ctx.restore();
  },
  banner(it, p) { // a title ribbon centred on x,y
    const { x, y, w } = it, h = U(0.1);
    polys([[[x - w / 2, y - h / 2], [x + w / 2, y - h / 2], [x + w / 2 - 20, y], [x + w / 2, y + h / 2], [x - w / 2, y + h / 2], [x - w / 2 + 20, y], [x - w / 2, y - h / 2]]], p * 2, it);
    if (p > 0.5) writeText({ fit: w - 70, ...it, s: it.s || U(0.058) }, (p - 0.5) * 2);
  },
  label(it, p) { const [x, y] = it.gx !== undefined ? iso(it.gx, it.gy, it.gz) : [it.x, it.y]; writeText({ ...it, x, y, s: it.s || U(0.045) }, p); },
  bars(it, p) { // a small bar chart inside x,y,w,h
    const n = it.vals.length, max = Math.max(...it.vals), bw = it.w / n;
    polys([[[it.x, it.y + it.h], [it.x + it.w, it.y + it.h]]], p * 3, { ...it, role: 'ink' });
    it.vals.forEach((v, i) => {
      const q = clamp(p * (n + 1) - i, 0, 1), h = it.h * v / max * ease(q); if (q <= 0) return;
      pen(rectPts(it.x + bw * (i + 0.15), it.y + it.h - h, bw * 0.7, h), 1, { ...it, role: it.role || 'accent' }, i);
      if (it.labels) writeText({ txt: String(it.labels[i]), x: it.x + bw * (i + 0.5), y: it.y + it.h + U(0.04), s: U(0.034), role: 'ink', font: 'body', fit: bw * 0.96 }, q);
    });
  },
  box: (it, p) => polys(boxEdges(it.gx, it.gy, it.gz || 0, it.w, it.dp, it.h), p, it),
  tower(it, p) { const t = U(0.031); polys([...boxEdges(it.gx, it.gy, 0, t, t, it.h), ...boxEdges(it.gx - t * 0.4, it.gy - t * 0.4, it.h, t * 1.8, t * 1.8, t * 0.9)], p, it); },
  slab: (it, p) => polys([boxEdges(it.gx, it.gy, 0, it.w, it.dp, 0)[4]], p, { ...it, role: !it.role || it.role === 'paper' ? 'muted' : it.role }), // paper on paper would vanish
  dishsite(it, p) { const [x, y] = iso(it.gx, it.gy), s = U(0.12); polys(iconPolys('dish', x, y - s / 2, s), p, it); },
  link(it, p, lt) { // a line between two grid points; `broken` shows a cut, otherwise packets travel along it
    const a = iso(...it.a), b = iso(...it.b), role = it.broken ? 'warn' : it.role || 'accent', at = f => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    pen([a, b], p, { ...it, role });
    if (p < 1) return;
    if (it.broken) polys(iconPolys('cross', ...at(0.5), U(0.06)), 1, { ...it, role });
    else for (let k = 0; k < 3; k++) pen(circlePts(...at((lt * 0.6 + k / 3) % 1), U(0.008)), 1, { ...it, role }, k);
  },
  iplane(it, p, lt) { // a plane at grid point a, flying to b over `fly` seconds
    const q = it.fly ? ease(clamp((lt - (it.at || 0)) / it.fly, 0, 1)) : 1, a = iso(...it.a), b = iso(...(it.b || it.a));
    polys(iconPolys('plane', a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q, it.s, Math.atan2(b[1] - a[1], b[0] - a[0]) || 0), 1, it);
  },
  custom: (it, p, lt) => CUSTOM[it.fn](it, p, lt, { K, ctx, F, U, C, polys, writeText }),
};
export function drawItem(it, p, lt) {
  if (p <= 0) return;
  const native = K.intents && K.intents[it.k];
  if (native && native.call(K, it, p, lt) !== false) return;
  DEF[it.k](it, p, lt);
}
export function drawScene(i, lt) { for (const it of V.beats[i].items) drawItem(it, ease((lt - (it.at || 0)) / (it.d || 0.8)), lt); }

// ---------- normalised scene data -> pixels ----------
const GRID = new Set(['box', 'tower', 'slab', 'dishsite', 'link', 'iplane']);
function prep(it) {
  const o = { ...it }, g = GRID.has(it.k), has = k => o[k] !== undefined;
  if (it.box) [o.x, o.y, o.s] = it.box;
  for (const k of ['x', 'x1', 'x2']) if (has(k)) o[k] = X(o[k]);
  for (const k of ['y', 'y1', 'y2']) if (has(k)) o[k] = Y(o[k]);
  for (const k of ['pts', 'path']) if (has(k)) o[k] = o[k].map(([x, y]) => [X(x), Y(y)]);
  for (const k of ['s', 'r', 'r1', 'rx', 'ry', 'lw', 'hs', 'max', 'fit', 'gx', 'gy', 'gz', 'dp']) if (has(k)) o[k] *= F.u;
  for (const k of ['a', 'b']) if (g && has(k)) o[k] = o[k].map(v => v * F.u);
  if (has('w')) o.w *= g ? F.u : F.bw;
  if (has('h')) o.h *= g ? F.u : F.bh;
  return o;
}

// ---------- runtime ----------
const BASE = { // used when a kit leaves these out
  text(str, x, y, frac, it) { revealText(str, x, y, frac, it.css, C(it.role), it.align); },
  highlight(it, p) { ctx.globalAlpha = 0.3; ctx.fillStyle = C(it.role || 'accent'); ctx.fillRect(it.x, it.y, it.w * p, it.h); ctx.globalAlpha = 1; },
};
function useKit(k) {
  if (!k) return null;
  if (k.api !== 1 || !k.tokens || !k.pen || !k.bg) throw new Error(`kit ${k.slug}: needs api 1, tokens, bg and pen`);
  for (const m in BASE) if (!k[m]) k[m] = BASE[m];
  return k;
}
export function loadVideo(v, primary, accent) {
  V = v; Object.assign(F, FORMATS[v.format || 'short']); cv.width = F.W; cv.height = F.H;
  KP = useKit(primary); KA = useKit(accent);
  for (const k of [KA, KP]) if (k) { K = k; k.init && k.init(F); }
  for (const b of V.beats) { K = (b.accent && KA) || KP; b.items = (b.items || []).map(prep); b.caps = brand.captions(b); }
  K = KP;
}
// optional per-beat shot: framing sets the zoom, camera moves across the beat. Only the items move; hook, captions and bar stay put.
const ZOOM = { wide: 1, medium: 1.25, close: 1.6 };
function camera(sc, lt) {
  const sh = sc.shot; if (!sh || (!sh.camera && !sh.framing)) return;
  const q = ease(lt / Math.max(0.1, sc.b - sc.a)), c = sh.camera, d = 0.06 * (2 * q - 1), cx = F.bx + F.bw / 2, cy = F.by + F.bh / 2;
  const z = (ZOOM[sh.framing] || 1) * (c === 'push-in' ? 1 + 0.12 * q : c === 'pull-out' ? 1.12 - 0.12 * q : 1);
  let dx = (c === 'pan-left' ? d : c === 'pan-right' ? -d : 0) * F.bw, dy = (c === 'pan-up' ? d : c === 'pan-down' ? -d : 0) * F.bh;
  const m = c === 'follow' && sc.items.find(it => it.k === 'move'); // follow: lean a little toward the beat's moving icon
  if (m) { const path = resample(m.path, 4), [x, y] = path[Math.round(ease((lt - (m.at || 0)) / (m.d || 0.8)) * (path.length - 1))]; dx = (cx - x) * 0.1; dy = (cy - y) * 0.1; }
  ctx.translate(cx + dx, cy + dy); ctx.scale(z, z); ctx.translate(-cx, -cy);
}
export function seek(t) {
  let i = V.beats.length - 1; while (i > 0 && t < V.beats[i].a) i--;
  const sc = V.beats[i], end = t >= V.endAt;
  K = (!end && sc.accent && KA) || KP;
  K.bg(t);
  if (end) brand.endCard(t - V.endAt);
  else {
    const lt = t - sc.a, out = K.transOut ? clamp((t - (sc.b - K.transOut)) / K.transOut, 0, 1) : 0;
    K.beginScene && K.beginScene(sc, lt, out, i);
    ctx.save(); ctx.beginPath(); ctx.rect(F.bx - 8, F.by - 8, F.bw + 16, F.bh + 16); ctx.clip(); // items never leave the safe box
    camera(sc, lt); drawScene(i, lt); ctx.restore();
    if (i === 0) brand.hook(t); // inside the scene, so the kit's wipe or slide takes the hook with it
    K.endScene && K.endScene(sc, lt, out, i);
    brand.caption(sc, t);
  }
  K.post && K.post(t);
  brand.progress(t);
}
