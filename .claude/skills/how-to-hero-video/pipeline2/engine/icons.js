// Pure geometry + the shared icon set. No DOM here, so Node tools (schema.mjs) can import it.
// An icon is a list of polylines in a 100x100 box centred on 0,0.
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const ease = p => p <= 0 ? 0 : p >= 1 ? 1 : 1 - Math.pow(1 - p, 3);
export function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
export function noise1(x, seed) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return (hash(i + seed * 57) * (1 - u) + hash(i + 1 + seed * 57) * u) * 2 - 1; }
export function resample(pts, step) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(L / step));
    for (let k = 1; k <= n; k++) out.push([x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n]);
  }
  return out;
}
export const circlePts = (x, y, r, a0 = -Math.PI / 2, a1 = a0 + Math.PI * 2.08, n = 64) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [x + Math.cos(a) * r, y + Math.sin(a) * r]; });
export const ellPts = (x, y, rx, ry, rot = 0, a0 = 0, a1 = Math.PI * 2.05, n = 64) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n, ex = Math.cos(a) * rx, ey = Math.sin(a) * ry; return [x + ex * Math.cos(rot) - ey * Math.sin(rot), y + ex * Math.sin(rot) + ey * Math.cos(rot)]; });
export const rectPts = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y + 2]];
export function arrowHead(pts, s = 26) {
  const b = pts[pts.length - 1], a = pts[Math.max(0, pts.length - 4)], ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  return [[b[0] - s * Math.cos(ang - 0.45), b[1] - s * Math.sin(ang - 0.45)], b, [b[0] - s * Math.cos(ang + 0.45), b[1] - s * Math.sin(ang + 0.45)]];
}

export const ICON = {
  plane: () => [[[-45, 0], [40, -4], [50, 0], [40, 4], [-45, 0]], [[0, -2], [-14, -34], [-4, -34], [16, -2]], [[0, 2], [-14, 34], [-4, 34], [16, 2]], [[-38, -1], [-46, -16], [-40, -16], [-30, -1]]],
  tower: () => [[[-12, 50], [-8, -18], [8, -18], [12, 50]], [[-22, -18], [22, -18], [18, -40], [-18, -40], [-22, -18]], [[-14, -40], [0, -50], [14, -40]], [[-30, 50], [30, 50]]],
  server: () => [rectPts(-30, -45, 60, 28), rectPts(-30, -12, 60, 28), rectPts(-30, 21, 60, 28), [[-20, -31], [-10, -31]], [[-20, 2], [-10, 2]], [[-20, 35], [-10, 35]]],
  envelope: () => [rectPts(-45, -30, 90, 60), [[-45, -30], [0, 8], [45, -30]]],
  dish: () => [ellPts(0, -10, 34, 14, -0.5, 0, Math.PI * 2.02), [[0, -10], [-24, -40]], [[0, 4], [0, 50]], [[-20, 50], [20, 50]]],
  galaxy: () => { const a = [], b = []; for (let i = 0; i <= 60; i++) { const t = i / 60 * 4.2, r = 6 + t * 10; a.push([Math.cos(t) * r, Math.sin(t) * r * 0.55]); b.push([-Math.cos(t) * r, -Math.sin(t) * r * 0.55]); } return [a, b]; },
  earth: () => [circlePts(0, 0, 46), [[-30, -20], [-10, -28], [4, -12], [-12, 2], [-28, -6]], [[10, 10], [30, 4], [36, 20], [18, 30], [8, 22]]],
  hubble: () => [rectPts(-14, -40, 28, 80), [[-14, -30], [14, -30]], [[-14, 30], [-14, 44], [14, 44], [14, 30]], rectPts(-60, -14, 40, 28), rectPts(20, -14, 40, 28), [[-40, -14], [-40, 14]], [[40, -14], [40, 14]]],
  tree: () => {
    const c = []; for (let i = 0; i <= 80; i++) { const a = Math.PI + i / 80 * Math.PI * 2.02, r = 30 + 6 * Math.abs(Math.sin(a * 3.5)); c.push([Math.cos(a) * r * 1.45, -38 + Math.sin(a) * r * 0.85]); }
    return [c, [[-3, -12], [-4, 14]], [[3, -12], [4, 14]], [[-4, 4], [-20, 14], [-30, 34], [-34, 48]], [[-2, 10], [-12, 26], [-14, 48]], [[2, 10], [12, 26], [14, 48]], [[4, 4], [20, 14], [30, 34], [34, 48]], [[-48, 48], [48, 48]]];
  },
  clock: () => [circlePts(0, 0, 42), [[0, 0], [0, -26]], [[0, 0], [18, 8]]],
  cloud: () => [[[-40, 18], [-46, 4], [-34, -10], [-20, -10], [-12, -28], [10, -30], [22, -14], [38, -12], [46, 4], [40, 18], [-40, 18]]],
  person: () => [circlePts(0, -34, 12), [[0, -22], [0, 14]], [[0, 14], [-14, 46]], [[0, 14], [14, 46]], [[-22, -6], [0, -12], [22, -6]]],
  phone: () => [rectPts(-24, -44, 48, 88), [[-6, 34], [6, 34]]],
  sat: () => [rectPts(-12, -12, 24, 24), rectPts(-52, -8, 34, 16), rectPts(18, -8, 34, 16), [[0, 12], [0, 26]], ellPts(0, 30, 12, 5)],
  mag: () => [circlePts(-8, -8, 30), [[14, 14], [44, 44]]],
  check: () => [[[-30, 0], [-8, 24], [34, -26]]],
  cross: () => [[[-26, -26], [26, 26]], [[26, -26], [-26, 26]]],
  cable: () => [[[-50, 0], [-20, -14], [10, 12], [50, 0]], [[-6, -14], [6, 14]]],
  shuttle: () => [[[0, -50], [14, -20], [14, 30], [28, 44], [-28, 44], [-14, 30], [-14, -20], [0, -50]], [[-6, 44], [-10, 60]], [[6, 44], [10, 60]]],
  leaf: () => [[[-30, 30], [-20, -10], [10, -34], [36, -36], [30, -6], [6, 20], [-30, 30]], [[-30, 30], [20, -20]]],
  wave: () => [Array.from({ length: 41 }, (_, i) => [-50 + i * 2.5, Math.sin(i / 40 * Math.PI * 4) * 10])],
  // the mascot: a stick-figure hero, one arm up. The cape is drawn by brand.js (always red).
  hero: () => [circlePts(0, -32, 11), [[0, -21], [0, 12]], [[0, 12], [-12, 44]], [[0, 12], [12, 44]], [[0, -13], [20, -36]], [[0, -13], [-15, -2], [-5, 7]]],
};
export function iconPolys(name, x, y, s, rot = 0) {
  const c = Math.cos(rot), sn = Math.sin(rot);
  return ICON[name]().map(pl => pl.map(([a, b]) => [x + (a * c - b * sn) * s / 100, y + (a * sn + b * c) * s / 100]));
}
