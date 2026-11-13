      // ===== How To Hero shared library =====
      // Safe zone (1080x1920 frame): x 60..940, y 420..1500. Every beat is drawn in a local 880x760 box at (60,440)
      // that is clipped to the safe zone, so nothing a diagram does can leave it.
      const NS = "http://www.w3.org/2000/svg", stage = document.getElementById("stage");
      const E = (tag, a, p, txt) => {
        const e = document.createElementNS(NS, tag);
        for (const k in a) e.setAttribute(k, a[k]);
        if (txt != null) e.textContent = txt;
        (p || stage).appendChild(e);
        return e;
      };
      const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), lerp = (a, b, u) => a + (b - a) * u, ease = (u) => u * u * (3 - 2 * u);
      const TAU = Math.PI * 2;
      const C = { navy: "#1F2A6B", navyD: "#0F1642", navyL: "#2E3C8F", yellow: "#FFC531", red: "#E5384F", white: "#FFFFFF", green: "#3DDC84", sky: "#9FB0FF", ink: "#080C2E", mute: "#8FA0E8" };
      // Frame geometry comes from build.mjs (CFG.fmt): vertical short 1080x1920, or 16:9 documentary 1920x1080 (box 1680x780 at 120,70).
      const F = CFG.fmt, FW = F.W, FH = F.H, DOC = !!F.doc;
      const SAFE = F.SAFE, BX = F.BX, BY = F.BY, BW = F.BW, BH = F.BH;
      const tw = (s, size, track = 0) => [...s].reduce((n, ch) => n + (WID[ch] ?? 50), 0) * size / 100 + track * s.length;
      function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }

      const defs = E("defs", {}, stage);
      function grad(id, type, attrs, stops) { const g = E(type, { id, ...attrs }, defs); stops.forEach(([o, c, op]) => E("stop", { offset: o, "stop-color": c, "stop-opacity": op ?? 1 }, g)); }
      grad("bgG", "linearGradient", { x1: 0, y1: 0, x2: 0, y2: 1 }, [[0, "#0B1138"], [0.55, "#16205F"], [1, C.navy]]);
      grad("glowY", "radialGradient", {}, [[0, C.yellow, 0.85], [1, C.yellow, 0]]);
      grad("glowW", "radialGradient", {}, [[0, "#BFCBFF", 0.5], [1, "#BFCBFF", 0]]);
      const pat = E("pattern", { id: "dots", width: 46, height: 46, patternUnits: "userSpaceOnUse" }, defs);
      E("circle", { cx: 23, cy: 23, r: 2.2, fill: "#fff", opacity: 0.07 }, pat);
      E("rect", { x: 0, y: 0, width: BW, height: BH }, E("clipPath", { id: "boxClip" }, defs));
      E("rect", { width: FW, height: FH, fill: "url(#bgG)" });
      E("ellipse", { cx: DOC ? 960 : 500, cy: DOC ? 480 : 900, rx: DOC ? 1100 : 700, ry: DOC ? 560 : 620, fill: "url(#glowW)", opacity: 0.22 });
      E("rect", { width: FW, height: FH, fill: "url(#dots)" });

      const tl = gsap.timeline({ paused: true });
      const U = [];
      const BT = CFG.beats, L = CFG.lines;
      const inR = (t, s, pad = 0) => t >= s.a - pad && t <= s.b + pad;
      const C0 = { transformOrigin: "50% 50%" };
      const T = (p, s, x, y, size, fill, o = {}) =>
        E("text", { x, y, "font-size": size, fill, "font-family": "Anton", "text-anchor": o.anchor || "middle", stroke: o.stroke || C.ink, "stroke-width": o.sw ?? size * 0.1,
          "paint-order": "stroke", "stroke-linejoin": "round", "letter-spacing": o.track || 0 }, p, s);
      const slam = (el, at, from = 1.9) => tl.fromTo(el, { scale: from, opacity: 0, ...C0 }, { scale: 1, opacity: 1, duration: 0.22, ease: "power3.in", ...C0 }, at);
      const pop = (el, at, dur = 0.3) => tl.fromTo(el, { scale: 0, opacity: 0, ...C0 }, { scale: 1, opacity: 1, duration: dur, ease: "back.out(2.2)", ...C0 }, at);
      const fadeIn = (el, at, dur = 0.35) => tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: dur }, at);
      const fadeTo = (el, at, to, dur = 0.35) => tl.fromTo(el, { opacity: 0 }, { opacity: to, duration: dur }, at);
      const fadeOut = (el, at, dur = 0.3) => tl.fromTo(el, { opacity: 1 }, { opacity: 0, duration: dur, immediateRender: false }, at);
      const ST = (o = {}) => ({ fill: o.fill || "none", stroke: o.stroke || C.white, "stroke-width": o.sw || 8, "stroke-linecap": "round", "stroke-linejoin": "round" });

      // a beat = one clipped, fading group in the local box
      function beat(i) {
        const g = E("g", { transform: `translate(${BX},${BY})`, "clip-path": "url(#boxClip)" });
        gsap.set(g, { visibility: "hidden" });
        const last = i === BT.length - 1, s0 = i ? BT[i].a - 0.12 : BT[i].a;
        tl.set(g, { visibility: "visible" }, s0); if (!last) tl.set(g, { visibility: "hidden" }, BT[i].b + 0.12);
        tl.fromTo(g, { opacity: 0 }, { opacity: 1, duration: i ? 0.22 : 0.25, ease: "none" }, s0);
        if (!last) tl.fromTo(g, { opacity: 1 }, { opacity: 0, duration: 0.22, ease: "none", immediateRender: false }, BT[i].b - 0.1);
        return g;
      }
      const label = (g, s, x, y, size = 46, fill = C.white, o = {}) => T(g, s, x, y, size, fill, o);

      // ===== shared diagram parts =====
      function phone(g, x, y, w, h, o = {}) {
        const r = E("g", {}, g);
        E("rect", { x, y, width: w, height: h, rx: Math.min(w, h) * 0.14, fill: o.fill || C.navyD, stroke: o.stroke || C.white, "stroke-width": o.sw || 7 }, r);
        if (o.notch !== false) E("rect", { x: x + w / 2 - w * 0.14, y: y + h * 0.03, width: w * 0.28, height: Math.max(6, h * 0.018), rx: 4, fill: o.stroke || C.white, opacity: 0.7 }, r);
        return r;
      }
      function checkMark(g, x, y, r, col = C.green) {
        const k = E("g", {}, g); E("circle", { cx: x, cy: y, r, fill: col }, k);
        E("polyline", { points: `${x - r * 0.45},${y} ${x - r * 0.1},${y + r * 0.38} ${x + r * 0.5},${y - r * 0.36}`, fill: "none", stroke: C.navyD, "stroke-width": r * 0.22, "stroke-linecap": "round", "stroke-linejoin": "round" }, k);
        return k;
      }
      function crossMark(g, x, y, r, col = C.red) {
        const k = E("g", {}, g); E("circle", { cx: x, cy: y, r, fill: col }, k);
        [[-1, -1, 1, 1], [1, -1, -1, 1]].forEach(([a, b, c, d]) => E("line", { x1: x + a * r * 0.42, y1: y + b * r * 0.42, x2: x + c * r * 0.42, y2: y + d * r * 0.42, stroke: C.white, "stroke-width": r * 0.22, "stroke-linecap": "round" }, k));
        return k;
      }
      function lockIcon(g, x, y, s = 1, col = C.yellow, open = 0) {
        const k = E("g", { transform: `translate(${x},${y}) scale(${s})` }, g);
        const sh = E("path", { d: "M-22,-6 V-24 A22,22 0 0 1 22,-24 V-6", fill: "none", stroke: col, "stroke-width": 9, "stroke-linecap": "round" }, k);
        E("rect", { x: -34, y: -8, width: 68, height: 54, rx: 12, fill: col }, k); E("circle", { cx: 0, cy: 16, r: 7, fill: C.navyD }, k); E("rect", { x: -3, y: 18, width: 6, height: 16, rx: 3, fill: C.navyD }, k);
        if (open) sh.setAttribute("transform", `translate(30,-12) rotate(30 22 -6)`);
        return { g: k, shackle: sh };
      }
      function arrowLine(g, x1, y1, x2, y2, col = C.white, w = 8) {
        const k = E("g", {}, g), a = Math.atan2(y2 - y1, x2 - x1), hx = x2 - Math.cos(a) * 4, hy = y2 - Math.sin(a) * 4, h = 22;
        E("line", { x1, y1, x2: x2 - Math.cos(a) * 12, y2: y2 - Math.sin(a) * 12, stroke: col, "stroke-width": w, "stroke-linecap": "round" }, k);
        E("polygon", { points: `${hx},${hy} ${hx - Math.cos(a - 0.5) * h},${hy - Math.sin(a - 0.5) * h} ${hx - Math.cos(a + 0.5) * h},${hy - Math.sin(a + 0.5) * h}`, fill: col }, k);
        return k;
      }
      const wavePath = (x0, x1, yc, amp, wl, ph, step = 5) => { let d = ""; for (let x = x0; x <= x1; x += step) d += (d ? " L" : "M") + x.toFixed(1) + "," + (yc + amp * Math.sin(((x - x0) / wl) * TAU - ph)).toFixed(1); return d; };
      function sat(g, x, y, s = 1, col = C.white) {
        const k = E("g", { transform: `translate(${x},${y}) scale(${s})` }, g), S = { stroke: C.ink, "stroke-width": 4, "stroke-linejoin": "round" };
        E("rect", { x: -62, y: -14, width: 40, height: 28, fill: C.sky, ...S }, k); E("rect", { x: 22, y: -14, width: 40, height: 28, fill: C.sky, ...S }, k);
        E("rect", { x: -22, y: -18, width: 44, height: 36, rx: 6, fill: col, ...S }, k); E("line", { x1: 0, y1: -18, x2: 0, y2: -34, stroke: col, "stroke-width": 5, "stroke-linecap": "round" }, k); E("circle", { cx: 0, cy: -38, r: 6, fill: C.yellow }, k);
        return k;
      }
      const arcP = (cx, cy, r, a0, a1) => { const p = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)]; const [x0, y0] = p(a0), [x1, y1] = p(a1); return `M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)}`; };
      const placeAt = (g, x, y, ang = 0, s = 1) => g.setAttribute("transform", `translate(${x},${y}) rotate(${ang}) scale(${s})`);

      // ===== the hero mascot: small white stick figure, red cape, smiling =====
      function mascot(g, x, y, s, t0) {
        const m = E("g", { transform: `translate(${x},${y}) scale(${s})` }, g), W = { stroke: C.white, "stroke-width": 13, "stroke-linecap": "round", "stroke-linejoin": "round", fill: "none" };
        const cape = E("g", {}, m);
        E("path", { d: "M-12,-214 L12,-214 C58,-200 104,-160 140,-92 Q120,-98 104,-78 Q90,-104 70,-88 Q52,-112 30,-98 Q10,-114 -4,-122 C-6,-160 -8,-190 -12,-214 Z", fill: C.red, stroke: C.ink, "stroke-width": 5, "stroke-linejoin": "round" }, cape);
        E("line", { x1: 0, y1: -110, x2: -34, y2: 0, ...W }, m); E("line", { x1: 0, y1: -110, x2: 34, y2: 0, ...W }, m);
        E("line", { x1: 0, y1: -222, x2: 0, y2: -108, ...W }, m);
        E("line", { x1: 0, y1: -204, x2: -64, y2: -138, ...W }, m);
        const arm = E("g", {}, m); E("line", { x1: 0, y1: -204, x2: 66, y2: -262, ...W }, arm);
        E("circle", { cx: 0, cy: -262, r: 38, fill: C.white, stroke: C.ink, "stroke-width": 4 }, m);
        E("circle", { cx: -13, cy: -272, r: 5.5, fill: C.navyD }, m); E("circle", { cx: 13, cy: -272, r: 5.5, fill: C.navyD }, m);
        E("path", { d: "M-16,-252 Q0,-236 16,-252", fill: "none", stroke: C.navyD, "stroke-width": 6, "stroke-linecap": "round" }, m);
        tl.fromTo(arm, { rotation: -14, svgOrigin: "0 -204" }, { rotation: 14, svgOrigin: "0 -204", duration: 0.45, yoyo: true, repeat: 14, ease: "sine.inOut" }, t0);
        tl.fromTo(cape, { skewX: -3, svgOrigin: "0 -214" }, { skewX: 3, svgOrigin: "0 -214", duration: 0.7, yoyo: true, repeat: 10, ease: "sine.inOut" }, t0);
        return m;
      }
