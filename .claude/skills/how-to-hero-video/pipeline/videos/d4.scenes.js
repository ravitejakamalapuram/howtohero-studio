      // ===== d4: KESSLER SYNDROME — the space junk cascade =====
      // helpers -------------------------------------------------------------
      const X = (i) => { const g = beat(i), B = BT[i]; return [g, B, B.a, B.b - B.a]; };
      const AT = (B, f) => B.a + f * (B.b - B.a);
      // text that never overflows its width: shrink until it fits
      const fit = (g, s, x, y, size, col, maxW = 1600, o = {}) => { let z = size; while (z > 40 && tw(s, z) > maxW) z -= 2; return label(g, s, x, y, z, col, o); };
      const TX = (g, s, x, y, size, col, t, maxW, o) => { const e = fit(g, s, x, y, size, col, maxW, o); pop(e, t); return e; };
      const chap = (g, n, s, B) => { pop(label(g, "CHAPTER " + n, 840, 64, 46, C.yellow), B.a + 0.05); slam(fit(g, s, 840, 168, 108, C.white, 1500), B.a + 0.25); };
      const earthLand = [[-0.55, -0.35, 0.32, 0.22], [-0.1, 0.25, 0.28, 0.36], [0.4, -0.15, 0.3, 0.42], [0.2, -0.6, 0.18, 0.12]];
      // reusable Earth: ocean disc, soft halo, simple land blobs
      function earth(g, cx, cy, r) {
        const k = E("g", {}, g);
        E("circle", { cx, cy, r: r * 1.12, fill: C.sky, opacity: 0.13 }, k);
        E("circle", { cx, cy, r, fill: "#2459C2", stroke: C.sky, "stroke-width": Math.max(3, r * 0.03) }, k);
        const cp = "ec" + Math.round(cx) + "_" + Math.round(cy) + "_" + Math.round(r);
        E("circle", { cx, cy, r }, E("clipPath", { id: cp }, defs));
        const lg = E("g", { "clip-path": `url(#${cp})` }, k);
        earthLand.forEach(([dx, dy, rx, ry]) => E("ellipse", { cx: cx + dx * r, cy: cy + dy * r, rx: rx * r, ry: ry * r, fill: "#3FAE7A", opacity: 0.85 }, lg));
        E("path", { d: `M${cx - r},${cy} A${r},${r} 0 0 0 ${cx + r},${cy}`, fill: C.navyD, opacity: 0.18 }, lg);
        return k;
      }
      // reusable Earth-with-orbits: rings are tilted ellipses with moving dots.
      // ring: { r, k (squash), rot (deg), n, sp (rad/s), col, dr (dot radius), ph, alpha }
      function orbits(g, cx, cy, er, rings, B, o = {}) {
        const back = E("g", {}, g); earth(g, cx, cy, er); const front = E("g", {}, g);
        const pt = (ri, th, dr = 0) => { const R = rings[ri], rr = R.r + dr, x0 = rr * Math.cos(th), y0 = rr * (R.k ?? 0.35) * Math.sin(th), a = (R.rot || 0) * Math.PI / 180;
          return [cx + x0 * Math.cos(a) - y0 * Math.sin(a), cy + x0 * Math.sin(a) + y0 * Math.cos(a), Math.sin(th) < 0]; };
        const dots = [];
        rings.forEach((R, ri) => {
          if (R.line !== false) E("ellipse", { cx, cy, rx: R.r, ry: R.r * (R.k ?? 0.35), transform: `rotate(${R.rot || 0} ${cx} ${cy})`, fill: "none", stroke: R.lc || C.sky, "stroke-width": R.lw || 3, opacity: R.lo ?? 0.45 }, back);
          const rnd = rng(17 + ri * 7);
          for (let j = 0; j < (R.n || 0); j++) {
            const el = E("circle", { r: R.dr || 6, fill: R.col || C.white, opacity: 0 }, front);
            dots.push({ el, ri, th0: (R.ph || 0) + (j / R.n) * TAU + (R.jit ? (rnd() - 0.5) * R.jit : 0), sp: R.sp ?? 0.4, off: R.spread ? (rnd() - 0.5) * R.spread : 0, show: R.show ?? 0, ap: R.alpha ?? 1, idx: j, n: R.n });
          }
        });
        U.push((t) => {
          if (!inR(t, B)) return; const s = t - B.a;
          dots.forEach((q) => {
            const [x, y, beh] = pt(q.ri, q.th0 + q.sp * s, q.off);
            q.el.setAttribute("cx", x.toFixed(1)); q.el.setAttribute("cy", y.toFixed(1));
            const hid = beh && Math.hypot(x - cx, y - cy) < er; // behind the planet
            const vis = typeof q.show === "number" ? clamp((s - q.show * (B.b - B.a) - (q.idx / q.n) * (o.grow || 0)) / 0.3) : 1;
            q.el.setAttribute("opacity", (hid ? 0 : beh ? 0.55 : 1) * vis * q.ap);
          });
        });
        return { pt, back, front, dots };
      }
      // fragments released at angle th on ring ri at time t0; they spread along the orbit over time
      function cloud(g, sys, ri, th, n, B, t0, sp, o = {}) {
        const R = rng(o.seed || 5), fr = [];
        for (let j = 0; j < n; j++) fr.push({ el: E("circle", { r: o.r || 4.5, fill: o.col || C.red, opacity: 0 }, sys.front), dth: (R() - 0.5) * (o.spread || 1.2), dr: (R() - 0.5) * (o.drad || 50), kick: (R() - 0.5) * 2 });
        U.push((t) => {
          if (!inR(t, B)) return; const s = t - t0;
          fr.forEach((f) => {
            if (s < 0) { f.el.setAttribute("opacity", 0); return; }
            const u = 1 - Math.exp(-s * (o.rate || 0.5));
            const [x, y, beh] = sys.pt(ri, th + sp * s + f.dth * u + f.kick * 0.04 * Math.min(s, 1), f.dr * Math.min(1, s * 2));
            f.el.setAttribute("cx", x.toFixed(1)); f.el.setAttribute("cy", y.toFixed(1)); f.el.setAttribute("opacity", beh ? 0.5 : 1);
          });
        });
        return fr;
      }
      // a burst of shards flying out from a point (for collisions/explosions)
      function burst(g, x, y, n, B, t0, R0 = 160, col = C.red, seed = 3) {
        const R = rng(seed), sh = [];
        for (let j = 0; j < n; j++) { const a = R() * TAU, v = 0.35 + R() * 0.65, s = 3 + R() * 6; sh.push({ a, v, el: E("rect", { x: -s, y: -s / 2, width: s * 2, height: s, fill: j % 3 ? col : C.yellow, opacity: 0 }, g), rot: R() * 360 }); }
        const fl = E("circle", { cx: x, cy: y, r: 0, fill: C.yellow, opacity: 0 }, g);
        U.push((t) => {
          if (!inR(t, B)) return; const s = t - t0;
          fl.setAttribute("r", s > 0 ? 20 + s * 160 : 0); fl.setAttribute("opacity", s > 0 ? clamp(0.9 - s * 1.6) : 0);
          sh.forEach((q) => { if (s < 0) { q.el.setAttribute("opacity", 0); return; } const d = R0 * q.v * (1 - Math.exp(-s * 2.2));
            q.el.setAttribute("transform", `translate(${(x + Math.cos(q.a) * d).toFixed(1)},${(y + Math.sin(q.a) * d).toFixed(1)}) rotate(${q.rot + s * 200})`); q.el.setAttribute("opacity", 1); });
        });
        return sh;
      }
      // a counter label that ticks from 0 to `to`
      function counter(g, x, y, to, B, f0, f1, size, col, pre = "", suf = "", o = {}) {
        const fm = (v) => pre + Math.round(v).toLocaleString("en-US") + suf, e = label(g, fm(0), x, y, size, col, o);
        U.push((t) => { if (!inR(t, B)) return; e.textContent = fm(to * ease(clamp((t - AT(B, f0)) / ((f1 - f0) * (B.b - B.a))))); });
        return e;
      }
      // a horizontal bar that grows to width w
      function hbar(g, x, y, w, h, col, B, f0, f1) {
        E("rect", { x, y, width: w, height: h, rx: h / 4, fill: C.navyD, opacity: 0.6 }, g);
        const r = E("rect", { x, y, width: 0, height: h, rx: h / 4, fill: col }, g);
        U.push((t) => { if (!inR(t, B)) return; r.setAttribute("width", (w * ease(clamp((t - AT(B, f0)) / ((f1 - f0) * (B.b - B.a))))).toFixed(1)); });
        return r;
      }
      // a dead satellite (grey, tumbling)
      const deadSat = (g, x, y, s = 1) => sat(g, x, y, s, C.mute);
      // a missile (small rocket shape) pointing along +x
      function missile(g) { const k = E("g", {}, g); E("path", { d: "M-34,-8 L18,-8 L34,0 L18,8 L-34,8 Z", fill: C.white, stroke: C.ink, "stroke-width": 3 }, k); E("path", { d: "M-34,-8 L-46,-18 L-46,18 L-34,8 Z", fill: C.red }, k); E("path", { d: "M-46,-5 L-74,0 L-46,5 Z", fill: C.yellow }, k); return k; }
      // a rocket upper stage (cylinder + nozzle) pointing along +x
      function rStage(g, x, y, s = 1, col = C.mute) { const k = E("g", { transform: `translate(${x},${y}) scale(${s})` }, g); E("rect", { x: -90, y: -32, width: 160, height: 64, rx: 10, fill: col, stroke: C.ink, "stroke-width": 4 }, k); E("path", { d: "M-90,-20 L-128,-34 L-128,34 L-90,20 Z", fill: C.navyL, stroke: C.ink, "stroke-width": 4 }, k); [-40, 10].forEach((xx) => E("line", { x1: xx, y1: -32, x2: xx, y2: 32, stroke: C.ink, "stroke-width": 3, opacity: 0.5 }, k)); return k; }
      // move an element along a straight path over [f0,f1] of the beat
      function glide(el, B, f0, f1, x0, y0, x1, y1, ang = 0, s = 1) { U.push((t) => { if (!inR(t, B)) return; const u = ease(clamp((t - AT(B, f0)) / ((f1 - f0) * (B.b - B.a)))); placeAt(el, lerp(x0, x1, u), lerp(y0, y1, u), ang, s); }); placeAt(el, x0, y0, ang, s); }
      // simple line chart path that draws itself (pts in local box coords)
      function drawPath(g, d, col, w, B, f0, f1) { const p = E("path", { d, fill: "none", stroke: col, "stroke-width": w, "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-dasharray": "4000", "stroke-dashoffset": 4000 }, g);
        U.push((t) => { if (!inR(t, B)) return; p.setAttribute("stroke-dashoffset", (4000 * (1 - ease(clamp((t - AT(B, f0)) / ((f1 - f0) * (B.b - B.a)))))).toFixed(0)); }); return p; }
      function axes(g, x0, y0, x1, y1) { E("line", { x1: x0, y1: y0, x2: x0, y2: y1, stroke: C.white, "stroke-width": 5 }, g); E("line", { x1: x0, y1: y0, x2: x1, y2: y0, stroke: C.white, "stroke-width": 5 }, g); }
      const growCurve = (x0, y0, w, h, k = 4, n = 60) => { let d = ""; for (let i = 0; i <= n; i++) { const u = i / n, v = (Math.exp(k * u) - 1) / (Math.exp(k) - 1); d += (i ? "L" : "M") + (x0 + u * w).toFixed(1) + "," + (y0 - v * h).toFixed(1); } return d; };
      // ISS-like station: truss + panels + modules
      function station(g, x, y, s = 1) { const k = E("g", { transform: `translate(${x},${y}) scale(${s})` }, g), S = { stroke: C.ink, "stroke-width": 3 };
        E("rect", { x: -120, y: -5, width: 240, height: 10, fill: C.white, ...S }, k); [-110, -70, 70, 110].forEach((xx) => { E("rect", { x: xx - 16, y: -62, width: 32, height: 52, fill: C.sky, ...S }, k); E("rect", { x: xx - 16, y: 10, width: 32, height: 52, fill: C.sky, ...S }, k); });
        E("rect", { x: -40, y: -14, width: 80, height: 28, rx: 10, fill: C.white, ...S }, k); E("rect", { x: -12, y: 14, width: 24, height: 40, rx: 8, fill: C.white, ...S }, k); return k; }
      // a little rocket going up (points to -y)
      function rocket(g, x, y, s = 1) { const k = E("g", { transform: `translate(${x},${y}) scale(${s})` }, g); E("path", { d: "M0,-60 Q16,-40 16,-10 L16,30 L-16,30 L-16,-10 Q-16,-40 0,-60 Z", fill: C.white, stroke: C.ink, "stroke-width": 4 }, k);
        E("path", { d: "M-16,10 L-30,34 L-16,30 Z M16,10 L30,34 L16,30 Z", fill: C.red }, k); E("path", { d: "M-9,32 L0,62 L9,32 Z", fill: C.yellow }, k); return k; }
      // capsule (lifeboat) shape
      function capsule(g, x, y, s, name, col) { const k = E("g", { transform: `translate(${x},${y}) scale(${s})` }, g); E("path", { d: "M-70,60 L-40,-50 L40,-50 L70,60 Z", fill: C.navyD, stroke: col, "stroke-width": 8, "stroke-linejoin": "round" }, k); label(k, name, 0, 130, 48, col); return k; }

      // ===== COLD OPEN =====
      { const g = beat(0); }
      // 1: two objects collide and multiply
      { const [g, B, a, d] = X(1);
        const sys = orbits(g, 840, 400, 190, [{ r: 470, k: 0.33, rot: -12, n: 34, sp: 0.25, col: C.white, dr: 5, alpha: 0.8 }, { r: 400, k: 0.5, rot: 28, n: 26, sp: -0.3, col: C.sky, dr: 5, alpha: 0.8 }], B);
        const tc = AT(B, 0.5); const p = sys.pt(0, 0.35); burst(g, p[0], p[1], 40, B, tc, 200);
        TX(g, "SEVERAL KM EVERY SECOND", 840, 80, 62, C.yellow, a + 0.2, 1500);
        TX(g, "THEY DON'T BREAK. THEY MULTIPLY.", 840, 760, 58, C.white, tc + 0.4, 1500); }
      // 2: chain reaction tree
      { const [g, B, a, d] = X(2);
        const lv = [[840], [520, 1160], [300, 740, 940, 1380]], ys = [170, 380, 590];
        lv.forEach((row, li) => row.forEach((x) => { const t0 = AT(B, 0.12 + li * 0.25); burst(g, x, ys[li], 22, B, t0, 90, li ? C.red : C.yellow, 11 + x);
          if (li < 2) { const nx = lv[li + 1].filter((xx) => Math.abs(xx - x) < 450); nx.forEach((xx) => fadeIn(arrowLine(g, x, ys[li] + 50, xx, ys[li + 1] - 60, C.mute, 6), t0 + 0.4)); } }));
        TX(g, "A CHAIN REACTION", 840, 760, 70, C.yellow, AT(B, 0.6)); }
      // 3: Kessler syndrome + even with no launches the junk grows
      { const [g, B, a, d] = X(3);
        slam(label(g, "KESSLER SYNDROME", 840, 120, 110, C.yellow), a + 0.1);
        axes(g, 300, 690, 1400, 250); label(g, "TIME", 1350, 745, 44, C.mute); label(g, "DEBRIS", 250, 300, 44, C.mute, { anchor: "end" });
        E("line", { x1: 840, y1: 690, x2: 840, y2: 260, stroke: C.white, "stroke-width": 4, "stroke-dasharray": "12 12", opacity: 0.6 }, g);
        TX(g, "LAUNCHES STOP", 840, 240, 44, C.white, AT(B, 0.35));
        drawPath(g, growCurve(300, 650, 1080, 350, 2.4), C.red, 12, B, 0.15, 0.85);
        TX(g, "STILL GROWS", 1240, 330, 58, C.red, AT(B, 0.75)); }
      // 4: can we stop it?
      { const [g, B, a, d] = X(4);
        orbits(g, 840, 420, 200, [{ r: 330, k: 0.32, rot: -8, n: 60, sp: 0.35, col: C.red, dr: 4, jit: 0.2, spread: 40 }, { r: 430, k: 0.36, rot: 14, n: 40, sp: -0.25, col: C.white, dr: 4, jit: 0.3, spread: 30 }], B);
        TX(g, "CAN WE STOP THE CASCADE?", 840, 90, 76, C.yellow, a + 0.3); }

      // ===== CHAPTER 1: THE WARNING =====
      { const [g, B, a, d] = X(5); chap(g, 1, "THE WARNING", B);
        const doc = E("g", {}, g); E("rect", { x: 610, y: 270, width: 460, height: 470, rx: 14, fill: C.white }, doc);
        [330, 380, 430, 480, 530, 580, 630, 680].forEach((y, i) => E("rect", { x: 650, y, width: i % 3 === 2 ? 240 : 380, height: 16, rx: 6, fill: C.mute, opacity: 0.7 }, doc));
        pop(doc, a + 0.6); const st = E("g", {}, g); E("rect", { x: 940, y: 560, width: 220, height: 110, rx: 12, fill: "none", stroke: C.red, "stroke-width": 8 }, st); label(st, "1978", 1050, 645, 76, C.red, { stroke: "none" });
        slam(st, AT(B, 0.45)); TX(g, "DONALD KESSLER", 330, 460, 58, C.yellow, AT(B, 0.3)); TX(g, "BURTON COUR-PALAIS", 1370, 460, 50, C.sky, AT(B, 0.6)); }
      // 6: asteroid belt analogy — rocks collide and shatter
      { const [g, B, a, d] = X(6);
        E("circle", { cx: 840, cy: 420, r: 60, fill: C.yellow }, g); E("circle", { cx: 840, cy: 420, r: 100, fill: "url(#glowY)" }, g);
        const R = rng(42), rocks = []; for (let j = 0; j < 26; j++) { const k = E("g", {}, g); const s = 10 + R() * 14; let pd = ""; for (let m = 0; m < 7; m++) { const aa = m / 7 * TAU, rr = s * (0.7 + R() * 0.5); pd += (m ? "L" : "M") + (rr * Math.cos(aa)).toFixed(1) + "," + (rr * Math.sin(aa)).toFixed(1); } E("path", { d: pd + "Z", fill: "#B9A38A", stroke: C.ink, "stroke-width": 2 }, k); rocks.push({ k, th: j / 26 * TAU + R() * 0.2, r: 300 + R() * 90 }); }
        U.push((t) => { if (!inR(t, B)) return; rocks.forEach((q) => { const th = q.th + (t - a) * 0.12; placeAt(q.k, 840 + q.r * Math.cos(th), 420 + q.r * 0.42 * Math.sin(th)); }); });
        [[0.3, 520, 300], [0.55, 1170, 520], [0.75, 640, 560]].forEach(([f, x, y], i) => burst(g, x, y, 16, B, AT(B, f), 80, "#B9A38A", 50 + i));
        TX(g, "COLLIDE. SHATTER. REPEAT.", 840, 90, 70, C.yellow, a + 0.3); TX(g, "THE ASTEROID BELT", 840, 760, 54, C.white, AT(B, 0.15)); }
      // 7: enough satellites for the same thing to start?
      { const [g, B, a, d] = X(7);
        orbits(g, 840, 430, 190, [{ r: 320, k: 0.34, rot: -10, n: 30, sp: 0.4, col: C.yellow, dr: 6, show: 0.05 }, { r: 420, k: 0.42, rot: 20, n: 30, sp: -0.32, col: C.yellow, dr: 6, show: 0.25 }, { r: 520, k: 0.3, rot: 4, n: 30, sp: 0.26, col: C.yellow, dr: 6, show: 0.45 }], B, { grow: 2.5 });
        TX(g, "HOW MANY IS TOO MANY?", 840, 90, 76, C.yellow, a + 0.3); }
      // 8: feedback loop
      { const [g, B, a, d] = X(8);
        const cx = 840, cy = 420, r = 230, nodes = [["COLLISION", -Math.PI / 2, C.red], ["FRAGMENTS", Math.PI / 6, C.yellow], ["HIGHER ODDS", (5 * Math.PI) / 6, C.white]];
        E("ellipse", { cx, cy, rx: 1.9 * r, ry: r, fill: "none", stroke: C.mute, "stroke-width": 6, "stroke-dasharray": "18 18" }, g);
        nodes.forEach(([s, th, col], i) => { const x = cx + 1.9 * r * Math.cos(th), y = cy + r * Math.sin(th); const k = E("g", {}, g); E("rect", { x: x - 190, y: y - 50, width: 380, height: 100, rx: 50, fill: C.navyD, stroke: col, "stroke-width": 7 }, k); label(k, s, x, y + 22, 56, col); pop(k, AT(B, 0.1 + i * 0.2)); });
        const runner = E("circle", { r: 16, fill: C.yellow }, g);
        U.push((t) => { if (!inR(t, B)) return; const th = -Math.PI / 2 + (t - a) * 1.6; runner.setAttribute("cx", cx + 1.9 * r * Math.cos(th)); runner.setAttribute("cy", cy + r * Math.sin(th)); }); }
      // 9: a belt we made ourselves
      { const [g, B, a, d] = X(9);
        const ring = E("ellipse", { cx: 840, cy: 430, rx: 480, ry: 170, fill: "none", stroke: C.red, "stroke-width": 70 }, g); fadeTo(ring, AT(B, 0.15), 0.18, 1.2);
        orbits(g, 840, 430, 200, [{ r: 480, k: 0.354, n: 120, sp: 0.2, col: C.red, dr: 4, spread: 60, jit: 0.1, show: 0.05 }, { r: 480, k: 0.354, n: 60, sp: 0.22, col: C.white, dr: 3, spread: 70, show: 0.2 }], B, { grow: 3 });
        TX(g, "A DEBRIS BELT", 840, 90, 86, C.red, a + 0.3); TX(g, "MADE BY US", 840, 760, 66, C.yellow, AT(B, 0.6)); }
      // 10: timeline: this century / next century — ours
      { const [g, B, a, d] = X(10);
        const x0 = 160, x1 = 1520, yy = 430, X1 = (yr) => x0 + (yr - 1900) / 200 * (x1 - x0);
        E("line", { x1: x0, y1: yy, x2: x1, y2: yy, stroke: C.white, "stroke-width": 8 }, g);
        [1900, 2000, 2100].forEach((yr) => { E("line", { x1: X1(yr), y1: yy - 20, x2: X1(yr), y2: yy + 20, stroke: C.white, "stroke-width": 6 }, g); label(g, "" + yr, X1(yr), yy + 80, 46, C.mute); });
        const s1 = E("rect", { x: X1(1978), y: yy - 70, width: X1(2000) - X1(1978), height: 40, rx: 10, fill: C.sky }, g); fadeIn(s1, AT(B, 0.15));
        const s2 = E("rect", { x: X1(2000), y: yy - 70, width: X1(2100) - X1(2000), height: 40, rx: 10, fill: C.red }, g); fadeIn(s2, AT(B, 0.35));
        TX(g, "BEGINS FORMING", X1(1989), yy - 110, 44, C.sky, AT(B, 0.2)); TX(g, "SERIOUS PROBLEM", X1(2050), yy - 110, 52, C.red, AT(B, 0.4));
        const m = E("g", {}, g); E("polygon", { points: `${X1(2026)},${yy + 130} ${X1(2026) - 22},${yy + 170} ${X1(2026) + 22},${yy + 170}`, fill: C.yellow }, m); label(m, "WE ARE HERE: 2026", X1(2026), yy + 240, 60, C.yellow); pop(m, AT(B, 0.7));
        TX(g, "1978 PREDICTION", 840, 90, 70, C.white, a + 0.2); }

      // ===== CHAPTER 2: SPEED =====
      { const [g, B, a, d] = X(11); chap(g, 2, "SPEED", B);
        const cx = 840, cy = 650, r = 300; E("path", { d: arcP(cx, cy, r, Math.PI, TAU), fill: "none", stroke: C.navyL, "stroke-width": 40 }, g);
        const hot = E("path", { d: arcP(cx, cy, r, Math.PI * 1.7, TAU), fill: "none", stroke: C.red, "stroke-width": 40 }, g);
        const nd = E("line", { x1: cx, y1: cy, x2: cx - r + 40, y2: cy, stroke: C.yellow, "stroke-width": 12, "stroke-linecap": "round" }, g); E("circle", { cx, cy, r: 22, fill: C.yellow }, g);
        U.push((t) => { if (!inR(t, B)) return; const th = Math.PI + Math.PI * 0.9 * ease(clamp((t - AT(B, 0.3)) / (0.5 * d))) + 0.02 * Math.sin(t * 30); nd.setAttribute("x2", cx + (r - 40) * Math.cos(th)); nd.setAttribute("y2", cy + (r - 40) * Math.sin(th)); });
        TX(g, "7 TO 8", 840, 560, 90, C.yellow, AT(B, 0.6)); TX(g, "KM PER SECOND", 1340, 640, 50, C.white, AT(B, 0.5)); }
      // 12: fast enough = orbit, slower = falls
      { const [g, B, a, d] = X(12);
        earth(g, 840, 900, 520);
        const fall = drawPath(g, "M840,250 Q1050,260 1180,520", C.red, 8, B, 0.15, 0.5); fall.setAttribute("stroke-dasharray", "4000");
        const orb = E("path", { d: arcP(840, 900, 650, -Math.PI * 0.5, -Math.PI * 0.08), fill: "none", stroke: C.yellow, "stroke-width": 8, "stroke-dasharray": "20 16" }, g); fadeIn(orb, AT(B, 0.4));
        const s = sat(g, 840, 250, 0.9); glide(s, B, 0.45, 0.95, 840, 250, 840 + 650 * Math.cos(-Math.PI * 0.2), 900 + 650 * Math.sin(-Math.PI * 0.2), 30, 0.9);
        TX(g, "7 TO 8 KM/S = ORBIT", 440, 120, 66, C.yellow, AT(B, 0.4)); TX(g, "SLOWER = FALLS", 1440, 620, 56, C.red, AT(B, 0.7)); }
      // 13: station: five miles a second, 16 orbits a day
      { const [g, B, a, d] = X(13);
        const sys = orbits(g, 560, 430, 200, [{ r: 300, k: 0.4, rot: -15, n: 0 }], B);
        const st = station(g, 0, 0, 0.55);
        U.push((t) => { if (!inR(t, B)) return; const [x, y, beh] = sys.pt(0, (t - a) * 1.4); placeAt(st, x, y, 0, 0.55); st.setAttribute("opacity", beh ? 0.45 : 1); });
        counter(g, 1270, 420, 16, B, 0.1, 0.85, 200, C.yellow); TX(g, "ORBITS A DAY", 1270, 510, 54, C.white, AT(B, 0.2)); TX(g, "5 MILES EVERY SECOND", 1270, 680, 58, C.sky, AT(B, 0.35), 760); }
      // 14: crossing orbits meet at ~10 km/s
      { const [g, B, a, d] = X(14);
        const sys = orbits(g, 840, 430, 170, [{ r: 520, k: 0.3, rot: -10, n: 0, lc: C.yellow, lo: 0.8, lw: 5 }, { r: 470, k: 0.62, rot: 22, n: 0, lc: C.white, lo: 0.8, lw: 5 }], B);
        const A1 = sat(g, 0, 0, 0.7), A2 = deadSat(g, 0, 0, 0.7), tc = AT(B, 0.62);
        // find a crossing roughly in front-right
        const ta = 0.62, tb = 0.33;
        U.push((t) => { if (!inR(t, B)) return; const s = Math.min(t, tc) - tc; const p1 = sys.pt(0, ta + s * 0.5), p2 = sys.pt(1, tb + s * 0.5); placeAt(A1, p1[0], p1[1], 0, 0.7); placeAt(A2, p2[0], p2[1], 0, 0.7); const on = t < tc ? 1 : 0; A1.setAttribute("opacity", on); A2.setAttribute("opacity", on); });
        const pc = sys.pt(0, ta); burst(g, pc[0], pc[1], 30, B, tc, 160);
        TX(g, "AVERAGE IMPACT: 10 KM/S", 840, 90, 72, C.yellow, a + 0.3); }
      // 15: energy grows with the square of speed
      { const [g, B, a, d] = X(15);
        const sq = (x, y, n, col, t0) => { for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const r = E("rect", { x: x + i * 150, y: y + j * 150, width: 136, height: 136, rx: 12, fill: col }, g); pop(r, t0 + (i * n + j) * 0.12); } };
        label(g, "SPEED X1", 360, 170, 64, C.white); sq(290, 260, 1, C.sky, AT(B, 0.15)); label(g, "ENERGY X1", 360, 520, 54, C.sky);
        TX(g, "SPEED X2", 1150, 170, 64, C.white, AT(B, 0.35)); sq(1010, 240, 2, C.red, AT(B, 0.45)); TX(g, "ENERGY X4", 1150, 620, 70, C.red, AT(B, 0.7));
        TX(g, "ENERGY = SPEED SQUARED", 840, 750, 54, C.yellow, AT(B, 0.8)); }
      // 16: 1 cm at 10 km/s = hand grenade
      { const [g, B, a, d] = X(16);
        const ball = E("circle", { r: 18, fill: C.white }, g); const plate = E("rect", { x: 1220, y: 170, width: 70, height: 440, fill: C.mute, stroke: C.ink, "stroke-width": 4 }, g);
        const tc = AT(B, 0.45); U.push((t) => { if (!inR(t, B)) return; const u = clamp((t - AT(B, 0.1)) / (tc - AT(B, 0.1))); ball.setAttribute("cx", lerp(150, 1220, u)); ball.setAttribute("cy", 390); ball.setAttribute("opacity", t < tc ? 1 : 0); });
        const trail = E("line", { x1: 150, y1: 390, x2: 150, y2: 390, stroke: C.yellow, "stroke-width": 6, opacity: 0.6, "stroke-dasharray": "8 10" }, g);
        U.push((t) => { if (!inR(t, B)) return; const u = clamp((t - AT(B, 0.1)) / (tc - AT(B, 0.1))); trail.setAttribute("x2", lerp(150, 1220, u)); });
        burst(g, 1220, 390, 50, B, tc, 260, C.yellow, 77);
        TX(g, "1 CM", 150, 320, 60, C.white, a + 0.2); TX(g, "10 KM/S", 600, 320, 56, C.sky, AT(B, 0.2));
        TX(g, "= A HAND GRENADE", 840, 740, 84, C.red, AT(B, 0.6)); }
      // 17: Cupola window with a 7 mm chip
      { const [g, B, a, d] = X(17);
        const cx = 840, cy = 400, hex = (r) => [...Array(6)].map((_, i) => `${cx + r * Math.cos(i * TAU / 6 + Math.PI / 6)},${cy + r * Math.sin(i * TAU / 6 + Math.PI / 6)}`).join(" ");
        E("polygon", { points: hex(330), fill: C.navyL, stroke: C.white, "stroke-width": 10 }, g); E("polygon", { points: hex(290), fill: "#0B1640", stroke: C.mute, "stroke-width": 4 }, g);
        E("circle", { cx, cy: cy + 160, r: 120, fill: "#2459C2", opacity: 0.6 }, g);
        const chip = E("g", {}, g); for (let i = 0; i < 9; i++) { const aa = i / 9 * TAU; E("line", { x1: 960, y1: 300, x2: 960 + 40 * Math.cos(aa), y2: 300 + 40 * Math.sin(aa), stroke: C.white, "stroke-width": 3 }, chip); } E("circle", { cx: 960, cy: 300, r: 18, fill: C.white }, chip); slam(chip, AT(B, 0.45));
        const ring = E("circle", { cx: 960, cy: 300, r: 60, fill: "none", stroke: C.yellow, "stroke-width": 6 }, g); pop(ring, AT(B, 0.55));
        TX(g, "7 MM CHIP", 1330, 290, 72, C.yellow, AT(B, 0.6)); TX(g, "CUPOLA WINDOW, 2016", 840, 770, 54, C.white, a + 0.2); }
      // 18: a fleck of paint or a sliver of metal gouges a crater
      { const [g, B, a, d] = X(18);
        E("rect", { x: 1000, y: 120, width: 140, height: 560, fill: C.sky, opacity: 0.35 }, g); E("rect", { x: 1000, y: 120, width: 140, height: 560, fill: "none", stroke: C.white, "stroke-width": 5 }, g);
        const fl = E("rect", { x: -7, y: -4, width: 14, height: 8, fill: C.white }, g), tc = AT(B, 0.4);
        U.push((t) => { if (!inR(t, B)) return; const u = clamp((t - a) / (tc - a)); placeAt(fl, lerp(80, 1000, u), 400, (t - a) * 400); fl.setAttribute("opacity", t < tc ? 1 : 0); });
        const cr = E("path", { d: "M1000,370 Q1040,400 1000,430 Z", fill: C.navyD, stroke: C.white, "stroke-width": 3 }, g); slam(cr, tc);
        burst(g, 1000, 400, 24, B, tc, 120, C.white, 9);
        TX(g, "PAINT FLECK?", 400, 250, 64, C.yellow, AT(B, 0.15)); TX(g, "METAL SLIVER?", 400, 560, 64, C.sky, AT(B, 0.3)); TX(g, "CRATER IN GLASS", 1070, 760, 54, C.white, AT(B, 0.55)); }
      // 19: quadruple glazing; most shielded spacecraft
      { const [g, B, a, d] = X(19);
        [0, 1, 2, 3].forEach((i) => pop(E("rect", { x: 260 + i * 110, y: 180, width: 50, height: 460, rx: 8, fill: C.sky, opacity: 0.5, stroke: C.white, "stroke-width": 4 }, g), AT(B, 0.1 + i * 0.08)));
        const cr = E("path", { d: "M260,390 Q290,410 260,430 Z", fill: C.navyD, stroke: C.red, "stroke-width": 4 }, g); pop(cr, AT(B, 0.4));
        TX(g, "4 PANES", 515, 720, 64, C.yellow, AT(B, 0.3));
        const st = station(g, 1250, 360, 1.2); pop(st, AT(B, 0.55)); const sh = E("ellipse", { cx: 1250, cy: 360, rx: 230, ry: 160, fill: "none", stroke: C.yellow, "stroke-width": 8, "stroke-dasharray": "22 14" }, g); pop(sh, AT(B, 0.65));
        TX(g, "MOST SHIELDED EVER", 1250, 640, 60, C.yellow, AT(B, 0.7), 700); }
      // 20: most satellites have no armour — now imagine a whole satellite
      { const [g, B, a, d] = X(20);
        const s = sat(g, 1200, 400, 2.2); TX(g, "NO ARMOUR", 1200, 640, 64, C.red, AT(B, 0.15));
        const ds = deadSat(g, 0, 0, 1.8); glide(ds, B, 0.45, 1.0, 120, 400, 820, 400, 0, 1.8);
        U.push((t) => { if (!inR(t, B)) return; ds.setAttribute("transform", ds.getAttribute("transform") + ` rotate(${(t - a) * 60})`); });
        TX(g, "NOW: A WHOLE SATELLITE", 840, 100, 72, C.yellow, AT(B, 0.55)); }

      // ===== CHAPTER 3: THE BREAKS =====
      { const [g, B, a, d] = X(21); chap(g, 3, "THE BREAKS", B);
        earth(g, 840, 1180, 760);
        const ds = deadSat(g, 1200, 330, 1.1); pop(ds, AT(B, 0.3));
        const m = missile(g); U.push((t) => { if (!inR(t, B)) return; const u = clamp((t - AT(B, 0.5)) / (0.45 * d)); const x = lerp(420, 1170, u), y = 560 - 240 * Math.sin(u * Math.PI * 0.55); placeAt(m, x, y, -40 + 50 * u); m.setAttribute("opacity", u > 0 && u < 1 ? 1 : 0); });
        TX(g, "11 JANUARY 2007", 400, 330, 62, C.yellow, AT(B, 0.3)); TX(g, "FENGYUN-1C", 1200, 470, 52, C.white, AT(B, 0.4)); }
      // 22: intercept at ~860 km, satellite becomes a cloud
      { const [g, B, a, d] = X(22);
        const sys = orbits(g, 840, 440, 200, [{ r: 470, k: 0.36, rot: -6, n: 0, lc: C.white, lo: 0.6 }], B);
        const th = 0.5, tc = AT(B, 0.45); const ds = deadSat(g, 0, 0, 0.6);
        U.push((t) => { if (!inR(t, B)) return; const p = sys.pt(0, th + (t - tc) * 0.3); placeAt(ds, p[0], p[1], 0, 0.6); ds.setAttribute("opacity", t < tc ? 1 : 0); });
        const p = sys.pt(0, th); burst(g, p[0], p[1], 30, B, tc, 140); cloud(g, sys, 0, th, 90, B, tc, 0.3, { spread: 2.2, rate: 0.6 });
        TX(g, "ABOUT 860 KM UP", 840, 90, 76, C.yellow, a + 0.2); }
      // 23: catalogued fragments 1,200 in two months -> 3,000+
      { const [g, B, a, d] = X(23);
        counter(g, 480, 400, 1200, B, 0.05, 0.4, 150, C.white, "", "+"); TX(g, "IN TWO MONTHS", 480, 500, 54, C.mute, AT(B, 0.1));
        counter(g, 1200, 400, 3000, B, 0.5, 0.9, 170, C.red, "", "+"); TX(g, "EVENTUALLY", 1200, 500, 60, C.red, AT(B, 0.55));
        const R = rng(4); for (let i = 0; i < 160; i++) { const c = E("circle", { cx: 160 + R() * 1360, cy: 580 + R() * 180, r: 3 + R() * 3, fill: i < 64 ? C.white : C.red }, g); fadeIn(c, AT(B, i < 64 ? 0.05 + i * 0.004 : 0.5 + (i - 64) * 0.004)); }
        TX(g, "CATALOGUED PIECES", 840, 100, 66, C.yellow, a + 0.2); }
      // 24: largest event on record; stays for decades to centuries
      { const [g, B, a, d] = X(24);
        const sys = orbits(g, 600, 430, 180, [{ r: 400, k: 0.36, rot: -6, n: 0, lc: C.white, lo: 0.5 }], B);
        cloud(g, sys, 0, 0, 140, B, a - 6, 0.3, { spread: TAU, rate: 1, drad: 70 });
        TX(g, "LARGEST ON RECORD", 1300, 220, 64, C.red, AT(B, 0.1), 700);
        TX(g, "STAYS FOR", 1300, 420, 56, C.white, AT(B, 0.45)); TX(g, "DECADES TO", 1300, 520, 70, C.yellow, AT(B, 0.55)); TX(g, "CENTURIES", 1300, 620, 84, C.yellow, AT(B, 0.65)); }
      // 25: 2009 — nobody planned it
      { const [g, B, a, d] = X(25);
        slam(label(g, "2009", 840, 380, 220, C.yellow), a + 0.15);
        TX(g, "AN ACCIDENT", 840, 560, 80, C.white, AT(B, 0.4)); }
      // 26: Iridium 33 (working) meets Cosmos 2251 (dead)
      { const [g, B, a, d] = X(26);
        const s1 = sat(g, 0, 0, 1.3), s2 = deadSat(g, 0, 0, 1.3);
        glide(s1, B, 0.05, 0.9, 200, 220, 760, 400, 0, 1.3); glide(s2, B, 0.05, 0.9, 1480, 220, 920, 400, 0, 1.3);
        TX(g, "IRIDIUM 33", 300, 420, 58, C.yellow, AT(B, 0.15)); TX(g, "WORKING", 300, 490, 46, C.white, AT(B, 0.2));
        TX(g, "COSMOS 2251", 1380, 420, 58, C.mute, AT(B, 0.3)); TX(g, "DEAD", 1380, 490, 46, C.white, AT(B, 0.35));
        TX(g, "10 FEB 2009 · OVER SIBERIA", 840, 720, 56, C.sky, AT(B, 0.5)); }
      // 27: crossing at almost a right angle, 790 km, 11+ km/s
      { const [g, B, a, d] = X(27);
        E("line", { x1: 340, y1: 650, x2: 1340, y2: 150, stroke: C.yellow, "stroke-width": 6, "stroke-dasharray": "16 12" }, g);
        E("line", { x1: 340, y1: 150, x2: 1340, y2: 650, stroke: C.mute, "stroke-width": 6, "stroke-dasharray": "16 12" }, g);
        const s1 = sat(g, 0, 0, 0.8), s2 = deadSat(g, 0, 0, 0.8); glide(s1, B, 0.05, 0.75, 400, 620, 840, 400, 0, 0.8); glide(s2, B, 0.05, 0.75, 400, 180, 840, 400, 0, 0.8);
        const sqr = E("path", { d: "M840,360 L880,380 L860,420", fill: "none", stroke: C.white, "stroke-width": 4 }, g); fadeIn(sqr, AT(B, 0.4));
        TX(g, "790 KM UP", 1420, 400, 60, C.white, AT(B, 0.2), 450); TX(g, "ALMOST 90°", 260, 400, 60, C.sky, AT(B, 0.35), 450); TX(g, "11+ KM/S", 840, 760, 84, C.red, AT(B, 0.6)); }
      // 28: both destroyed — first accidental collision of whole satellites
      { const [g, B, a, d] = X(28);
        const s1 = sat(g, 0, 0, 1.1), s2 = deadSat(g, 0, 0, 1.1), tc = AT(B, 0.18);
        glide(s1, B, 0, 0.18, 560, 380, 800, 380, 0, 1.1); glide(s2, B, 0, 0.18, 1120, 380, 880, 380, 0, 1.1);
        U.push((t) => { if (!inR(t, B)) return; const o = t < tc ? 1 : 0; s1.setAttribute("opacity", o); s2.setAttribute("opacity", o); });
        burst(g, 840, 380, 70, B, tc, 340, C.red, 21); burst(g, 840, 380, 40, B, tc, 260, C.white, 22);
        TX(g, "FIRST ACCIDENTAL CRASH", 840, 100, 72, C.yellow, AT(B, 0.35)); TX(g, "OF TWO WHOLE SATELLITES", 840, 750, 58, C.white, AT(B, 0.5)); }
      // 29: fragment counts
      { const [g, B, a, d] = X(29);
        label(g, "COSMOS 2251", 420, 300, 54, C.mute, { anchor: "end" }); hbar(g, 460, 245, 1000, 70, C.mute, B, 0.05, 0.35); TX(g, "1,603", 470, 300, 50, C.white, AT(B, 0.3), 400, { anchor: "start" });
        label(g, "IRIDIUM 33", 420, 450, 54, C.yellow, { anchor: "end" }); hbar(g, 460, 395, 373, 70, C.yellow, B, 0.2, 0.4); TX(g, "598", 870, 450, 50, C.yellow, AT(B, 0.4), 300, { anchor: "start" });
        TX(g, "2,000+ FRAGMENTS", 840, 120, 86, C.red, AT(B, 0.5)); TX(g, "DEAD, UNSTEERABLE, HIT A LIVE ONE", 840, 650, 54, C.white, AT(B, 0.7)); }
      // 30: November 2021 — Russia hits Cosmos 1408
      { const [g, B, a, d] = X(30);
        earth(g, 840, 1180, 760);
        const ds = deadSat(g, 1200, 330, 1.1); pop(ds, AT(B, 0.2)); const tc = AT(B, 0.8);
        const m = missile(g); U.push((t) => { if (!inR(t, B)) return; const u = clamp((t - AT(B, 0.35)) / (tc - AT(B, 0.35))); placeAt(m, lerp(420, 1170, u), 560 - 240 * Math.sin(u * Math.PI * 0.55), -40 + 50 * u); m.setAttribute("opacity", u > 0 && u < 1 ? 1 : 0); ds.setAttribute("opacity", t < tc ? 1 : 0); });
        burst(g, 1200, 330, 50, B, tc, 200);
        TX(g, "NOVEMBER 2021", 400, 300, 64, C.yellow, a + 0.2); TX(g, "COSMOS 1408", 1200, 470, 54, C.white, AT(B, 0.25)); TX(g, "OLD SOVIET SPY SATELLITE", 840, 100, 56, C.mute, AT(B, 0.4)); }
      // 31: 1,500+ fragments cross the station's path
      { const [g, B, a, d] = X(31);
        const sys = orbits(g, 600, 430, 180, [{ r: 330, k: 0.4, rot: -18, n: 0, lc: C.yellow, lo: 0.7 }, { r: 360, k: 0.55, rot: 30, n: 0, lc: C.red, lo: 0.4 }], B);
        cloud(g, sys, 1, 0.2, 150, B, a - 2, 0.35, { spread: TAU * 0.8, rate: 0.4, drad: 60 });
        const st = station(g, 0, 0, 0.35); U.push((t) => { if (!inR(t, B)) return; const [x, y, beh] = sys.pt(0, 1 + (t - a) * 0.5); placeAt(st, x, y, 0, 0.35); st.setAttribute("opacity", beh ? 0.4 : 1); });
        counter(g, 1290, 360, 1500, B, 0.05, 0.6, 150, C.red, "", "+"); TX(g, "TRACKABLE FRAGMENTS", 1290, 450, 50, C.white, AT(B, 0.15), 700); TX(g, "ACROSS THE STATION'S PATH", 1290, 600, 46, C.yellow, AT(B, 0.6), 700); }
      // 32: seven crew shelter in Dragon and Soyuz for ~2 hours
      { const [g, B, a, d] = X(32);
        E("rect", { x: 200, y: 190, width: 1280, height: 150, rx: 70, fill: C.navyD, stroke: C.white, "stroke-width": 7 }, g); label(g, "STATION", 840, 160, 48, C.mute);
        const c1 = capsule(g, 520, 500, 1.1, "DRAGON", C.yellow), c2 = capsule(g, 1160, 500, 1.1, "SOYUZ", C.sky);
        const crew = [...Array(7)].map((_, i) => ({ el: E("circle", { r: 18, fill: C.white }, g), x0: 330 + i * 170, y0: 265, x1: i < 4 ? 470 + (i % 2) * 100 : 1110 + ((i - 4) % 2) * 100, y1: i < 4 ? 480 + Math.floor(i / 2) * 50 : 480 + Math.floor((i - 4) / 2) * 50 }));
        U.push((t) => { if (!inR(t, B)) return; crew.forEach((q, i) => { const u = ease(clamp((t - AT(B, 0.15 + i * 0.03)) / (0.3 * d))); q.el.setAttribute("cx", lerp(q.x0, q.x1, u)); q.el.setAttribute("cy", lerp(q.y0, q.y1, u)); }); });
        TX(g, "7 CREW", 120, 470, 64, C.white, AT(B, 0.1), 340, { anchor: "start" }); TX(g, "ABOUT 2 HOURS", 840, 760, 66, C.red, AT(B, 0.65)); }
      // 33: safe — but the sky gets busier
      { const [g, B, a, d] = X(33);
        orbits(g, 840, 430, 190, [{ r: 300, k: 0.34, rot: -10, n: 50, sp: 0.4, col: C.yellow, dr: 5, show: 0.1 }, { r: 380, k: 0.4, rot: 18, n: 50, sp: -0.32, col: C.yellow, dr: 5, show: 0.3 }, { r: 470, k: 0.3, rot: 4, n: 50, sp: 0.26, col: C.yellow, dr: 5, show: 0.5 }], B, { grow: 2 });
        TX(g, "MUCH BUSIER", 840, 100, 90, C.yellow, AT(B, 0.4)); }

      // ===== CHAPTER 4: CROWDED SKY =====
      { const [g, B, a, d] = X(34); chap(g, 4, "CROWDED SKY", B);
        counter(g, 480, 470, 300, B, 0.2, 0.6, 150, C.white, "", "+"); TX(g, "LAUNCHES IN 2025", 480, 560, 52, C.mute, AT(B, 0.25));
        counter(g, 1200, 470, 4000, B, 0.45, 0.85, 150, C.yellow, "", "+"); TX(g, "NEW SATELLITES", 1200, 560, 52, C.yellow, AT(B, 0.5));
        [...Array(12)].forEach((_, i) => { const r = rocket(g, 200 + i * 116, 760, 0.6); pop(r, AT(B, 0.3 + i * 0.03)); }); }
      // 35: ten a day
      { const [g, B, a, d] = X(35);
        const rk = [...Array(10)].map((_, i) => rocket(g, 0, 0, 0.9));
        U.push((t) => { if (!inR(t, B)) return; rk.forEach((r, i) => { const u = clamp((t - a - 0.15 * i * d / 2) / (0.35 * d)); placeAt(r, 210 + i * 140, lerp(700, 260, ease(u)), 0, 0.9); }); });
        TX(g, "10 NEW SATELLITES A DAY", 840, 100, 78, C.yellow, a + 0.2); }
      // 36: ~17,000 working satellites (Oct 2026)
      { const [g, B, a, d] = X(36);
        const R = rng(8), dots = []; for (let i = 0; i < 340; i++) dots.push(E("circle", { cx: 120 + (i % 34) * 42, cy: 380 + Math.floor(i / 34) * 40, r: 9, fill: C.yellow, opacity: 0 }, g));
        U.push((t) => { if (!inR(t, B)) return; const n = Math.floor(340 * clamp((t - AT(B, 0.1)) / (0.6 * d))); dots.forEach((c, i) => c.setAttribute("opacity", i < n ? 1 : 0)); });
        counter(g, 840, 250, 17000, B, 0.1, 0.7, 150, C.yellow, "~"); TX(g, "WORKING SATELLITES, OCT 2026", 840, 90, 58, C.white, a + 0.2); TX(g, "EACH DOT = 50", 1560, 350, 40, C.mute, AT(B, 0.3), 400, { anchor: "end" }); }
      // 37: one megaconstellation: 11,000+ of them
      { const [g, B, a, d] = X(37);
        hbar(g, 160, 230, 1360 * 11148 / 17099, 110, C.yellow, B, 0.1, 0.5); const r2 = E("rect", { x: 160 + 1360 * 11148 / 17099, y: 230, width: 1360 * (1 - 11148 / 17099), height: 110, rx: 20, fill: C.sky }, g); fadeIn(r2, AT(B, 0.5));
        TX(g, "STARLINK: 11,000+", 600, 430, 70, C.yellow, AT(B, 0.3)); TX(g, "EVERYONE ELSE", 1300, 430, 52, C.sky, AT(B, 0.55), 420);
        const shells = [520, 560, 600]; shells.forEach((r, i) => { const e = E("ellipse", { cx: 840, cy: 1000, rx: r * 1.4, ry: r * 0.55, fill: "none", stroke: C.yellow, "stroke-width": 10, "stroke-dasharray": "3 18", "stroke-linecap": "round" }, g); fadeIn(e, AT(B, 0.6 + i * 0.08)); });
        TX(g, "THIN, CROWDED SHELLS", 840, 110, 64, C.white, AT(B, 0.65)); }
      // 38: altitude shells — densest 400-600 km (schematic)
      { const [g, B, a, d] = X(38);
        const yA = (km) => 720 - (km - 200) * 0.55;
        E("rect", { x: 0, y: 720, width: 1680, height: 60, fill: "#2459C2" }, g); label(g, "EARTH", 840, 768, 44, C.white);
        const band = E("rect", { x: 220, y: yA(600), width: 1420, height: yA(400) - yA(600), fill: C.yellow, opacity: 0 }, g); fadeTo(band, AT(B, 0.3), 0.16, 0.6);
        [200, 400, 600, 800, 1000].forEach((km) => { E("line", { x1: 220, y1: yA(km), x2: 1640, y2: yA(km), stroke: C.mute, "stroke-width": 2, opacity: 0.5 }, g); label(g, km + " KM", 200, yA(km) + 15, 42, km === 400 || km === 600 ? C.yellow : C.mute, { anchor: "end" }); });
        const R = rng(5), ds = []; for (let i = 0; i < 170; i++) { const km = i < 130 ? 400 + R() * 200 : 200 + R() * 900; if (km > 1080) continue; ds.push({ el: E("circle", { r: i < 130 ? 6 : 5, fill: i < 130 ? C.yellow : C.sky, opacity: 0 }, g), x0: 240 + R() * 1380, y: yA(km), v: 30 + R() * 40, t0: AT(B, 0.05 + R() * 0.4) }); }
        U.push((t) => { if (!inR(t, B)) return; ds.forEach((q) => { q.el.setAttribute("cx", 240 + ((q.x0 - 240 + (t - a) * q.v) % 1380)); q.el.setAttribute("cy", q.y); q.el.setAttribute("opacity", clamp((t - q.t0) / 0.3)); }); });
        TX(g, "PACKED: 400 TO 600 KM", 840, 90, 74, C.yellow, AT(B, 0.5)); }
      // 39: ~45,000 catalogued objects: dead sats, stages, fragments
      { const [g, B, a, d] = X(39);
        counter(g, 840, 200, 45000, B, 0.05, 0.4, 150, C.white, "~"); TX(g, "CATALOGUED OBJECTS", 840, 290, 54, C.mute, AT(B, 0.1));
        const d1 = deadSat(g, 330, 520, 1.6); pop(d1, AT(B, 0.4)); TX(g, "DEAD SATELLITES", 330, 700, 52, C.mute, AT(B, 0.42));
        const s2 = rStage(g, 840, 520, 1); pop(s2, AT(B, 0.55)); TX(g, "ROCKET STAGES", 840, 700, 52, C.white, AT(B, 0.57));
        const fg = E("g", {}, g), R = rng(12); for (let i = 0; i < 40; i++) E("rect", { x: 1250 + R() * 200, y: 440 + R() * 160, width: 6 + R() * 12, height: 4 + R() * 8, fill: C.red, transform: `rotate(${R() * 180} 1350 520)` }, fg); pop(fg, AT(B, 0.7)); TX(g, "FRAGMENTS", 1350, 700, 52, C.red, AT(B, 0.72)); }
      // 40: iceberg — only what we can track; 54,000 > 10 cm
      { const [g, B, a, d] = X(40);
        E("rect", { x: 0, y: 330, width: 1680, height: 450, fill: "#0A1240", opacity: 0.8 }, g); E("line", { x1: 0, y1: 330, x2: 1680, y2: 330, stroke: C.sky, "stroke-width": 4 }, g);
        label(g, "TRACKED", 140, 300, 44, C.sky, { anchor: "start" }); label(g, "UNTRACKED", 140, 400, 44, C.mute, { anchor: "start" });
        const R = rng(31); for (let i = 0; i < 220; i++) { const above = i < 40, c = E("circle", { cx: 420 + R() * 1150, cy: above ? 140 + R() * 170 : 360 + R() * 400, r: above ? 7 : 2 + R() * 4, fill: above ? C.white : C.red }, g); fadeIn(c, AT(B, above ? 0.05 : 0.35 + R() * 0.4)); }
        TX(g, "54,000 BIGGER THAN 10 CM", 840, 80, 70, C.yellow, AT(B, 0.5)); }
      // 41: size classes — log bars
      { const [g, B, a, d] = X(41);
        const rows = [["10 CM +", "54,000", 0.58, C.white], ["1 TO 10 CM", "1.2 MILLION", 0.75, C.red], ["1 MM TO 1 CM", "130 MILLION", 1, C.sky]];
        rows.forEach(([s, n, w, col], i) => { const y = 170 + i * 200; label(g, s, 470, y + 62, 56, col, { anchor: "end" }); hbar(g, 510, y, 1080 * w, 90, col, B, 0.05 + i * 0.25, 0.3 + i * 0.25); TX(g, n, 530, y + 160, 50, col, AT(B, 0.25 + i * 0.25), 900, { anchor: "start" }); });
        TX(g, "ESA MODEL ESTIMATE (LOG SCALE)", 840, 60, 46, C.mute, a + 0.2); }
      // 42: the nightmare middle
      { const [g, B, a, d] = X(42);
        const box = E("rect", { x: 440, y: 160, width: 800, height: 300, rx: 30, fill: C.navyD, stroke: C.red, "stroke-width": 10 }, g); pop(box, a + 0.1);
        label(g, "1 TO 10 CM", 840, 340, 120, C.red);
        TX(g, "TOO SMALL TO TRACK", 440, 600, 60, C.white, AT(B, 0.35), 760); TX(g, "BIG ENOUGH TO WRECK", 1240, 600, 60, C.yellow, AT(B, 0.6), 760);
        crossMark(g, 440, 700, 40); checkMark(g, 1240, 700, 40, C.yellow); }
      // 43: station dodges, 40+ times since 1999
      { const [g, B, a, d] = X(43);
        const st = station(g, 0, 0, 0.9), ob = E("rect", { x: -16, y: -10, width: 32, height: 20, fill: C.red }, g);
        U.push((t) => { if (!inR(t, B)) return; const s = (t - a) / d; const dodge = 120 * ease(clamp((s - 0.25) / 0.2)); placeAt(st, 560, 430 - dodge, 0, 0.9); placeAt(ob, lerp(1500, 0, clamp((s - 0.15) / 0.6)), 430, s * 900); });
        counter(g, 1280, 230, 40, B, 0.3, 0.8, 140, C.yellow, "", "+"); TX(g, "DODGES SINCE 1999", 1280, 320, 52, C.white, AT(B, 0.35), 700); }
      // 44: when dodging isn't enough
      { const [g, B, a, d] = X(44);
        orbits(g, 840, 450, 190, [{ r: 360, k: 0.34, rot: -8, n: 120, sp: 0.5, col: C.red, dr: 4, spread: 70, jit: 0.2 }, { r: 360, k: 0.34, rot: -8, n: 14, sp: 0.5, col: C.yellow, dr: 8, spread: 30 }], B);
        TX(g, "WHEN DODGING ISN'T ENOUGH?", 840, 100, 74, C.yellow, a + 0.2); }

      // ===== CHAPTER 5: THE CASCADE =====
      { const [g, B, a, d] = X(45); chap(g, 5, "THE CASCADE", B);
        const sys = orbits(g, 840, 520, 140, [{ r: 400, k: 0.3, rot: -6, n: 18, sp: 0.35, col: C.yellow, dr: 7 }], B);
        const tc = AT(B, 0.6), p = sys.pt(0, 0.55 + 0.35 * (tc - a)); burst(g, p[0], p[1], 30, B, tc, 120);
        TX(g, "ONE COLLISION", 840, 760, 60, C.red, tc + 0.2, 800); }
      // 46: the cloud spreads around the planet
      { const [g, B, a, d] = X(46);
        const sys = orbits(g, 840, 440, 190, [{ r: 470, k: 0.34, rot: -6, n: 16, sp: 0.3, col: C.yellow, dr: 7 }], B);
        cloud(g, sys, 0, 0.6, 140, B, a + 0.2, 0.3, { spread: TAU, rate: 0.35, drad: 50 });
        TX(g, "THE CLOUD SPREADS AROUND THE ORBIT", 840, 90, 64, C.yellow, AT(B, 0.3)); }
      // 47: a fragment hits another satellite -> new cloud
      { const [g, B, a, d] = X(47);
        const s = sat(g, 1150, 400, 1.6), tc = AT(B, 0.45); const f = E("rect", { x: -10, y: -6, width: 20, height: 12, fill: C.red }, g);
        U.push((t) => { if (!inR(t, B)) return; const u = clamp((t - a) / (tc - a)); placeAt(f, lerp(100, 1150, u), 400, (t - a) * 500); f.setAttribute("opacity", t < tc ? 1 : 0); s.setAttribute("opacity", t < tc ? 1 : 0); });
        burst(g, 1150, 400, 60, B, tc, 300, C.red, 61);
        TX(g, "EACH FRAGMENT: A NEW BULLET", 840, 100, 70, C.yellow, a + 0.2); TX(g, "A NEW CLOUD", 1150, 740, 62, C.red, tc + 0.4); }
      // 48: 1 -> 2 -> 4 -> 8 clouds
      { const [g, B, a, d] = X(48);
        const cols = [[1, 240], [2, 620], [4, 1000], [8, 1380]];
        cols.forEach(([n, x], ci) => { const t0 = AT(B, 0.05 + ci * 0.2); for (let k = 0; k < n; k++) { const y = 400 + (k - (n - 1) / 2) * Math.min(150, 620 / n); burst(g, x, y, 10, B, t0 + k * 0.05, 50, C.red, ci * 10 + k); } label(g, "" + n, x, 760, 70, C.yellow).setAttribute("opacity", 1); });
        TX(g, "MORE DEBRIS = FASTER CRASHES", 840, 80, 66, C.white, AT(B, 0.6)); }
      // 49 & 50: natural cleanup time by altitude
      const decay = (g, B, rows) => {
        rows.forEach(([alt, w, s, col, f], i) => { const y = 170 + i * 200; label(g, alt, 340, y + 70, 64, C.white, { anchor: "end" }); hbar(g, 380, y + 10, w, 80, col, B, f, f + 0.25); TX(g, s, 400 + Math.max(w, 10) + 20, y + 72, 56, col, AT(B, f + 0.2), 1260 - w, { anchor: "start" }); });
      };
      { const [g, B, a, d] = X(49);
        TX(g, "THE ONLY CLEANER: THIN AIR", 840, 90, 70, C.yellow, a + 0.2);
        decay(g, B, [["600 KM", 140, "SEVERAL YEARS", C.green, 0.4]]);
        const ds = deadSat(g, 0, 0, 1); U.push((t) => { if (!inR(t, B)) return; const u = clamp((t - a) / d); placeAt(ds, 900 + 500 * u, 500 + 200 * u * u, u * 200, 1); }); }
      { const [g, B, a, d] = X(50);
        decay(g, B, [["600 KM", 140, "YEARS", C.green, 0], ["800 KM", 620, "CENTURIES", C.yellow, 0.1], ["1,000 KM+", 1000, "1,000+ YEARS", C.red, 0.45]]); }
      // 51: runaway effect
      { const [g, B, a, d] = X(51);
        axes(g, 260, 700, 1450, 160); label(g, "OBJECTS AND COLLISIONS", 300, 180, 46, C.mute, { anchor: "start" });
        drawPath(g, growCurve(260, 680, 1150, 520, 4.5), C.red, 14, B, 0.1, 0.8); TX(g, "RUNAWAY", 860, 330, 90, C.red, AT(B, 0.75), 600);
        TX(g, "ESA 2026 REPORT", 840, 770, 48, C.white, a + 0.2); }
      // 52: zero launches, still growing
      { const [g, B, a, d] = X(52);
        rocket(g, 300, 340, 1.6); crossMark(g, 420, 460, 60);
        TX(g, "ZERO LAUNCHES", 300, 620, 64, C.white, AT(B, 0.15));
        axes(g, 700, 650, 1550, 200); drawPath(g, growCurve(700, 620, 840, 380, 2), C.red, 14, B, 0.25, 0.85); TX(g, "DEBRIS STILL GROWS", 1120, 740, 60, C.red, AT(B, 0.6)); }
      // 53: weather satellites at ~820 km
      { const [g, B, a, d] = X(53);
        const sys = orbits(g, 560, 440, 200, [{ r: 360, k: 0.9, rot: 0, n: 0, lc: C.yellow, lo: 0.8, lw: 5 }], B);
        const s = sat(g, 0, 0, 0.8); U.push((t) => { if (!inR(t, B)) return; const [x, y, beh] = sys.pt(0, -1.2 + (t - a) * 0.45); placeAt(s, x, y, 0, 0.8); s.setAttribute("opacity", beh ? 0.45 : 1); });
        const cl = E("g", {}, g); [[1200, 330, 70], [1290, 300, 90], [1380, 340, 70]].forEach(([x, y, r]) => E("circle", { cx: x, cy: y, r, fill: C.white }, cl)); E("rect", { x: 1130, y: 330, width: 320, height: 80, rx: 40, fill: C.white }, cl); pop(cl, AT(B, 0.3));
        TX(g, "YOUR FORECAST", 1290, 510, 64, C.white, AT(B, 0.4)); TX(g, "ABOUT 820 KM UP", 1290, 620, 58, C.yellow, AT(B, 0.6), 640); }
      // 54: same band where Fengyun and Iridium broke apart
      { const [g, B, a, d] = X(54);
        const yA = (km) => 700 - (km - 760) * 4;
        E("rect", { x: 420, y: yA(870), width: 1100, height: yA(780) - yA(870), fill: C.red, opacity: 0.18 }, g);
        [[860, "FENGYUN-1C", C.red], [820, "WEATHER SATELLITES", C.yellow], [790, "IRIDIUM / COSMOS", C.red]].forEach(([km, s, col], i) => { const y = yA(km); const l = E("line", { x1: 420, y1: y, x2: 1520, y2: y, stroke: col, "stroke-width": 6, "stroke-dasharray": i === 1 ? "none" : "16 12" }, g); fadeIn(l, AT(B, 0.1 + i * 0.2)); TX(g, s, 1500, y - 14, 48, col, AT(B, 0.12 + i * 0.2), 700, { anchor: "end" }); label(g, km + " KM", 390, y + 16, 44, C.mute, { anchor: "end" }); });
        TX(g, "THE SAME BAND", 840, 90, 84, C.yellow, AT(B, 0.6)); }
      // 55: what lives in low orbit
      { const [g, B, a, d] = X(55);
        const items = [["INTERNET", C.yellow], ["EARTH IMAGING", C.sky], ["CLIMATE", C.green], ["HUMAN SPACEFLIGHT", C.white]];
        items.forEach(([s, col], i) => { const x = 240 + i * 400; const k = E("g", {}, g); E("circle", { cx: x, cy: 340, r: 130, fill: C.navyD, stroke: col, "stroke-width": 8 }, k);
          if (i === 0) [40, 75, 110].forEach((r) => E("path", { d: arcP(x, 400, r, -Math.PI * 0.8, -Math.PI * 0.2), fill: "none", stroke: col, "stroke-width": 12, "stroke-linecap": "round" }, k));
          if (i === 1) { E("rect", { x: x - 70, y: 290, width: 140, height: 90, rx: 14, fill: col }, k); E("circle", { cx: x, cy: 335, r: 30, fill: C.navyD }, k); }
          if (i === 2) { E("rect", { x: x - 14, y: 250, width: 28, height: 130, rx: 14, fill: "none", stroke: col, "stroke-width": 8 }, k); E("circle", { cx: x, cy: 400, r: 30, fill: col }, k); }
          if (i === 3) station(k, x, 340, 0.6);
          label(k, s, x, 540, 48, col); pop(k, AT(B, 0.1 + i * 0.15)); });
        TX(g, "ALL DEPEND ON LOW ORBIT", 840, 720, 70, C.yellow, AT(B, 0.7)); }
      // 56: GPS far above, but launched through the junk
      { const [g, B, a, d] = X(56);
        const sys = orbits(g, 840, 440, 120, [{ r: 220, k: 0.4, rot: -8, n: 100, sp: 0.45, col: C.red, dr: 4, spread: 50, jit: 0.3 }, { r: 600, k: 0.38, rot: 3, n: 6, sp: 0.1, col: C.yellow, dr: 12, lc: C.yellow }], B);
        const r = rocket(g, 0, 0, 0.6); U.push((t) => { if (!inR(t, B)) return; const u = clamp((t - AT(B, 0.3)) / (0.6 * d)); placeAt(r, lerp(840, 1300, u), lerp(330, -20, u), 50, 0.6); });
        TX(g, "GPS: 20,000 KM UP", 1380, 140, 54, C.yellow, AT(B, 0.15), 560); TX(g, "LAUNCHED THROUGH THE JUNK", 840, 770, 56, C.red, AT(B, 0.5)); }
      // 57: the trap — a minefield
      { const [g, B, a, d] = X(57);
        const R = rng(99); for (let i = 0; i < 140; i++) { const c = E("circle", { cx: 60 + R() * 1560, cy: 200 + R() * 320, r: 3 + R() * 5, fill: i % 5 ? C.red : C.white }, g); fadeIn(c, a + R() * 0.8); }
        E("rect", { x: 0, y: 640, width: 1680, height: 140, fill: "#2459C2" }, g); label(g, "EARTH", 840, 740, 56, C.white);
        const r = rocket(g, 0, 0, 0.9); U.push((t) => { if (!inR(t, B)) return; const u = clamp((t - AT(B, 0.2)) / (0.7 * d)); placeAt(r, 840 + 60 * Math.sin(u * 9), lerp(620, 60, u), 6 * Math.cos(u * 9), 0.9); });
        TX(g, "A MINEFIELD", 330, 120, 80, C.yellow, AT(B, 0.3)); TX(g, "EVERY TIME WE LEAVE", 1320, 120, 54, C.white, AT(B, 0.5), 680); }
      // 58: can we still stop it?
      { const [g, B, a, d] = X(58);
        orbits(g, 840, 450, 190, [{ r: 360, k: 0.34, rot: -8, n: 80, sp: 0.4, col: C.red, dr: 4, spread: 50 }], B);
        TX(g, "CAN WE STILL STOP IT?", 840, 110, 90, C.yellow, a + 0.2); }

      // ===== CHAPTER 6: THE CLEANUP =====
      { const [g, B, a, d] = X(59); chap(g, 6, "THE CLEANUP", B);
        label(g, "OLD RULE", 360, 410, 54, C.mute, { anchor: "end" }); hbar(g, 400, 360, 1100, 70, C.mute, B, 0.25, 0.45); TX(g, "25 YEARS", 1490, 410, 50, C.navyD, AT(B, 0.45), 400, { anchor: "end", stroke: "none" });
        label(g, "FCC 2022", 360, 560, 54, C.yellow, { anchor: "end" }); hbar(g, 400, 510, 220, 70, C.yellow, B, 0.55, 0.7); TX(g, "5 YEARS", 640, 562, 56, C.yellow, AT(B, 0.7), 500, { anchor: "start" });
        TX(g, "DOWN WITHIN 5 YEARS OF MISSION END", 840, 720, 54, C.white, AT(B, 0.8)); }
      // 60: Zero Debris 2030
      { const [g, B, a, d] = X(60);
        const x0 = 200, x1 = 1480, yy = 420, XX = (y) => x0 + (y - 2020) / 12 * (x1 - x0);
        E("line", { x1: x0, y1: yy, x2: x1, y2: yy, stroke: C.white, "stroke-width": 8 }, g);
        [2020, 2026, 2030].forEach((y) => { E("line", { x1: XX(y), y1: yy - 20, x2: XX(y), y2: yy + 20, stroke: C.white, "stroke-width": 6 }, g); label(g, "" + y, XX(y), yy + 80, 50, y === 2030 ? C.yellow : C.mute); });
        TX(g, "25 YRS → 5 YRS", XX(2022), yy - 60, 50, C.sky, AT(B, 0.15)); const fl = E("g", {}, g); E("line", { x1: XX(2030), y1: yy, x2: XX(2030), y2: yy - 230, stroke: C.yellow, "stroke-width": 6 }, fl); E("path", { d: `M${XX(2030)},${yy - 230} L${XX(2030) + 120},${yy - 200} L${XX(2030)},${yy - 170} Z`, fill: C.yellow }, fl); pop(fl, AT(B, 0.5));
        TX(g, "ZERO DEBRIS GOAL", XX(2030) - 40, yy - 260, 60, C.yellow, AT(B, 0.55), 700, { anchor: "end" });
        TX(g, "SHARPLY LIMIT NEW DEBRIS BY 2030", 840, 700, 56, C.white, AT(B, 0.7)); }
      // 61: drag sails unfold and pull the craft down faster
      { const [g, B, a, d] = X(61);
        earth(g, 840, 1500, 900);
        const k = E("g", {}, g); const sail = E("polygon", { points: "0,0 0,0 0,0 0,0", fill: C.yellow, opacity: 0.85, stroke: C.white, "stroke-width": 3 }, k); sat(k, 0, 0, 0.9);
        U.push((t) => { if (!inR(t, B)) return; const s = (t - a) / d, u = ease(clamp((s - 0.15) / 0.25)), S = 150 * u; sail.setAttribute("points", `${-S},${-S - 40} ${S},${-S - 40} ${S * 0.3},-40 ${-S * 0.3},-40`);
          const dn = ease(clamp((s - 0.45) / 0.55)); placeAt(k, lerp(500, 1200, dn), lerp(330, 560, dn * dn), 20 * dn); });
        TX(g, "DRAG SAIL", 330, 150, 70, C.yellow, AT(B, 0.2)); TX(g, "CATCHES THIN AIR", 1300, 150, 58, C.white, AT(B, 0.5), 650); }
      // 62: active debris removal required
      { const [g, B, a, d] = X(62);
        axes(g, 260, 680, 1450, 200);
        drawPath(g, growCurve(260, 660, 1150, 400, 2.6), C.red, 12, B, 0.05, 0.5);
        drawPath(g, "M835,574 C1000,540 1200,535 1410,535", C.green, 12, B, 0.45, 0.85);
        TX(g, "RULES ONLY", 1300, 220, 52, C.red, AT(B, 0.35)); TX(g, "+ ACTIVE REMOVAL", 1180, 620, 56, C.green, AT(B, 0.75), 600);
        TX(g, "REMOVAL IS NOW REQUIRED", 840, 90, 70, C.yellow, a + 0.2); }
      // 63: ADRAS-J closes to 15 m
      { const [g, B, a, d] = X(63);
        const st = rStage(g, 1250, 400, 1.6); const ch = sat(g, 0, 0, 1.1); glide(ch, B, 0.1, 0.8, 200, 400, 900, 400, 0, 1.1);
        const dl = counter(g, 600, 650, 15, B, 0.1, 0.8, 110, C.yellow, "", " M");
        U.push((t) => { if (!inR(t, B)) return; const u = ease(clamp((t - AT(B, 0.1)) / (0.7 * d))); dl.textContent = Math.round(lerp(500, 15, u)) + " M"; });
        TX(g, "ADRAS-J, 2024", 400, 140, 66, C.yellow, a + 0.2); TX(g, "ABANDONED ROCKET STAGE", 1250, 620, 50, C.mute, AT(B, 0.3), 700); }
      // 64: ClearSpace-1: four arms grab a dead satellite and burn it up (planned 2029)
      { const [g, B, a, d] = X(64);
        earth(g, 840, 1600, 1000);
        const tgt = deadSat(g, 0, 0, 0.9), chs = E("g", {}, g); E("rect", { x: -60, y: -45, width: 120, height: 90, rx: 12, fill: C.white, stroke: C.ink, "stroke-width": 4 }, chs);
        const arms = [-1, 1].flatMap((sy) => [-1, 1].map((sx) => E("line", { x1: 60, y1: sy * 30 + sx * 6, x2: 60, y2: sy * 30, stroke: C.yellow, "stroke-width": 10, "stroke-linecap": "round" }, chs)));
        const glow = E("ellipse", { cx: 0, cy: 0, rx: 0, ry: 0, fill: C.red, opacity: 0 }, g);
        U.push((t) => { if (!inR(t, B)) return; const s = (t - a) / d, ap = ease(clamp((s - 0.05) / 0.3)), grab = ease(clamp((s - 0.35) / 0.12)), dn = ease(clamp((s - 0.55) / 0.4));
          const tx = lerp(1100, 1000, dn) , ty = lerp(300, 640, dn * dn); placeAt(tgt, tx, ty, 10 + (1 - grab) * (t - a) * 40, 0.9); placeAt(chs, lerp(300, tx - 200, ap), lerp(300, ty, ap), 0);
          arms.forEach((ar, i) => { const sy = i < 2 ? -1 : 1; ar.setAttribute("x2", 60 + 90 * (0.4 + 0.6 * ap)); ar.setAttribute("y2", sy * (30 + 40 * (1 - grab))); });
          glow.setAttribute("cx", tx - 60); glow.setAttribute("cy", ty); glow.setAttribute("rx", 160 * dn); glow.setAttribute("ry", 70 * dn); glow.setAttribute("opacity", 0.55 * clamp((dn - 0.5) * 2)); });
        TX(g, "CLEARSPACE-1", 360, 120, 72, C.yellow, a + 0.2); TX(g, "4 ROBOTIC ARMS", 360, 210, 50, C.white, AT(B, 0.3)); TX(g, "PLANNED: 2029", 1300, 120, 62, C.sky, AT(B, 0.7), 600); }
      // 65: the warning, nearly 50 years ago — act early
      { const [g, B, a, d] = X(65);
        const x0 = 200, x1 = 1480, yy = 400, XX = (y) => x0 + (y - 1978) / 48 * (x1 - x0);
        E("line", { x1: x0, y1: yy, x2: x1, y2: yy, stroke: C.mute, "stroke-width": 8 }, g);
        const pr = E("line", { x1: x0, y1: yy, x2: x0, y2: yy, stroke: C.yellow, "stroke-width": 12, "stroke-linecap": "round" }, g);
        U.push((t) => { if (!inR(t, B)) return; pr.setAttribute("x2", lerp(x0, x1, ease(clamp((t - a) / (0.5 * d))))); });
        label(g, "1978", x0, yy + 80, 60, C.white); TX(g, "2026", x1, yy + 80, 60, C.yellow, AT(B, 0.45));
        TX(g, "48 YEARS", 840, yy - 50, 70, C.yellow, AT(B, 0.3)); TX(g, "ACT EARLY = DELAY THE BELT", 840, 660, 68, C.green, AT(B, 0.65)); }
      // 66: the clock is still ticking
      { const [g, B, a, d] = X(66);
        orbits(g, 520, 420, 170, [{ r: 300, k: 0.35, rot: -10, n: 40, sp: 0.4, col: C.red, dr: 4, spread: 30 }, { r: 300, k: 0.35, rot: -10, n: 10, sp: 0.4, col: C.yellow, dr: 7 }], B);
        const cx = 1240, cy = 400; E("circle", { cx, cy, r: 230, fill: C.navyD, stroke: C.white, "stroke-width": 10 }, g);
        for (let i = 0; i < 12; i++) { const aa = i / 12 * TAU; E("line", { x1: cx + 190 * Math.cos(aa), y1: cy + 190 * Math.sin(aa), x2: cx + 215 * Math.cos(aa), y2: cy + 215 * Math.sin(aa), stroke: C.white, "stroke-width": 8 }, g); }
        const hd = E("line", { x1: cx, y1: cy, x2: cx, y2: cy - 180, stroke: C.red, "stroke-width": 10, "stroke-linecap": "round" }, g); E("circle", { cx, cy, r: 16, fill: C.red }, g);
        U.push((t) => { if (!inR(t, B)) return; const aa = -Math.PI / 2 + Math.floor((t - a) * 2) * TAU / 60; hd.setAttribute("x2", cx + 180 * Math.cos(aa)); hd.setAttribute("y2", cy + 180 * Math.sin(aa)); });
        TX(g, "STILL TICKING", 1240, 740, 70, C.yellow, AT(B, 0.4)); TX(g, "NOT LOST YET", 520, 740, 64, C.green, AT(B, 0.15)); }
