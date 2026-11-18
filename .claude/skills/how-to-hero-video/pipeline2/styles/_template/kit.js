// Template kit: copy this folder to styles/<slug>/, change the look, add an entry to styles/registry.json.
// A kit changes stroke, texture and font only. Wording and layout belong to engine/brand.js.
import { ctx, F, C, strokePoly, wobble, partial, speckle } from '../../engine/engine.js';

export default {
  api: 1,
  slug: '_template',
  // Colours are semantic roles. Scenes only ever say "ink", "accent", "warn", "good", "muted" (or "paper").
  tokens: {
    ink: '#22242a', accent: '#1f5fbf', warn: '#d23a2a', good: '#23864a', muted: '#7d838c', paper: '#f6f4ee',
    fontHead: 'Kalam', fontBody: '"Patrick Hand"', // CSS font families from fonts/fonts.css
    wHead: 700, wBody: 400, // optional font weights (defaults 700 / 400)
    luma: 'light', // "light" or "dark" paper; verify.py reads it from the registry
    // textScale: 1, // optional: multiply every text size (for fonts that look small or large)
  },
  // capUpper: true, // optional: captions in capitals
  // transOut: 0.45, // optional: seconds before a beat ends during which beginScene/endScene get out = 0..1

  init() { this.grain = speckle(7, 5000, '#8a7f6a', 0.05, 2); }, // build textures once
  bg(t) { ctx.fillStyle = C('paper'); ctx.fillRect(0, 0, F.W, F.H); ctx.drawImage(this.grain, 0, 0); },
  // draw the first p (0..1) of a polyline; role is a colour role, lw a line width in pixels (or undefined)
  pen(pts, p, role, lw, seed) { strokePoly(partial(wobble(pts, 1.5, seed), p), lw || 5, C(role), 0.95); },

  // Everything below is optional; the engine has a default for each.
  // text(str, x, y, frac, it) {},     // one line of text, first `frac` shown; it = { css, role, align }
  // highlight(it, p) {},              // it = { x, y, w, h, role } in pixels
  // caption(lines, dt, g) {},         // g = { x, ys[], size, lh, css, a }: paint only, never move or resize
  // beginScene(beat, lt, out, i) {}, endScene(beat, lt, out, i) {},  // wrap a beat (camera, wipe); save/restore ctx
  // post(t) {},                       // on top of everything (grain, title block)
  // intents: { dim(it, p, lt) {} },   // native versions of item kinds; return false to use the engine default
};
