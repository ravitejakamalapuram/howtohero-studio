// Escape hatch: {"k":"custom","fn":"<name>"} items. Each function gets the item (already in pixels), its progress p (0..1),
// the beat time lt and the engine tools e = { K, ctx, F, U, C, polys, writeText }. Draw with e.polys so the kit pen is used.
// Keep this file free of DOM imports: schema.mjs reads the names.
import { circlePts, hash } from './icons.js';
export const CUSTOM = {
  // a spiral from radius r down to r1 around x,y: { turns, sq (vertical squash, default 1) }
  spiral(it, p, lt, e) {
    const n = 200, pts = Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2 * (it.turns || 3), r = it.r + ((it.r1 || 0) - it.r) * i / n; return [it.x + Math.cos(a) * r, it.y + Math.sin(a) * r * (it.sq || 1)]; });
    e.polys([pts], p, it);
  },
  // n small dots scattered inside x,y,w,h, appearing one by one: { n, r (dot radius) }
  scatter(it, p, lt, e) {
    const n = it.n || 12, r = it.r || e.U(0.004);
    for (let i = 0; i < n * p; i++) e.polys([circlePts(it.x + hash(i + (it.seed || 0)) * it.w, it.y + hash(i + 40 + (it.seed || 0)) * it.h, r)], 1, it);
  },
};
