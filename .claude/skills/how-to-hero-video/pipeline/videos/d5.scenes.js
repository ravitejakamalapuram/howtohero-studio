      // ===== DOC d5: why Chernobyl actually exploded (reactor physics, no people shown) =====
      const bt = (i) => { const g = beat(i), B = BT[i]; return [g, B.a, B.b - B.a, B]; };
      const upd = (B, f) => U.push((t) => { if (!inR(t, B, 0.2)) return; f(t, clamp((t - B.a) / (B.b - B.a))); });
      const seg = (u, u0, u1) => ease(clamp((u - u0) / (u1 - u0)));
      const GR = "#4B5570", GRL = "#A9B2C6", WAT = "#2F6FD0", ABS = "#11152F";
      let _cid = 0;
      grad("coreGlow", "radialGradient", {}, [[0, C.yellow, 0.95], [0.6, "#FF8A3D", 0.6], [1, C.red, 0.15]]);
      grad("botGlow", "linearGradient", { x1: 0, y1: 0, x2: 0, y2: 1 }, [[0, C.yellow, 0], [0.6, "#FF8A3D", 0.7], [1, C.yellow, 0.95]]);
      const hms = (s) => { s = Math.max(0, Math.floor(s)); const h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60, x = s % 60; return [h, m, x].map((v) => String(v).padStart(2, "0")).join(":"); };
      const TS = (h, m, s = 0) => h * 3600 + m * 60 + s;
      const setA = (el, o) => { for (const k in o) el.setAttribute(k, o[k]); };
      const box = (g, x, y, w, h, o = {}) => E("rect", { x, y, width: w, height: h, rx: o.rx ?? 18, fill: o.fill || C.navyD, stroke: o.stroke || C.white, "stroke-width": o.sw ?? 6 }, g);

      // ---- chapter header: small yellow "CHAPTER n" over a big title, top of the box ----
      function chapter(g, a, n, title) { pop(T(g, "CHAPTER " + n, 840, 62, 46, C.yellow), a + 0.05); slam(T(g, title, 840, 160, 92, C.white), a + 0.15); }

      // ---- REUSABLE REACTOR CORE CROSS-SECTION ----
      // side view of an RBMK-style core: graphite stack, fuel channels (yellow fuel, blue water, white steam bubbles),
      // control-rod channels (dark boron absorber, grey graphite displacer "tip" below it with a 1.25 m water gap).
      // state: rods = travel in metres (0 = fully withdrawn, 7 = absorber at the bottom), or a function of the channel index;
      // steam 0..1, power 0..1 (glow), bottom 0..1 (glow at the bottom of the core), xenon 0..1, fixed 0..1 (extra absorbers), crack 0..1
      function core(g, x, y, w, h, o = {}) {
        const n = o.n || 9, k = E("g", {}, g), id = "cc" + _cid++, m = h / 7, tips = o.tips !== false;
        const cp = E("clipPath", { id }, defs); E("rect", { x, y, width: w, height: h }, cp);
        E("rect", { x: x - 16, y: y - 16, width: w + 32, height: h + 32, rx: 10, fill: GR, stroke: C.white, "stroke-width": 6 }, k);
        for (let r = 1; r < 7; r++) E("line", { x1: x - 10, y1: y + r * m, x2: x + w + 10, y2: y + r * m, stroke: "#39415A", "stroke-width": 3 }, k);
        const pitch = w / n, cw = Math.min(54, pitch * 0.52), rods = [], fuels = [], xe = [], fixed = [], cracks = [];
        const R = rng(31 + n);
        for (let q = 0; q < 46; q++) { const ci = Math.floor(R() * n), xx = x + pitch * (ci + 1) - (pitch - cw) / 2 * (0.3 + R() * 0.4) - 0 * cw; xe.push({ el: E("circle", { cx: Math.min(x + w - 8, Math.max(x + 8, xx)), cy: y + 12 + R() * (h - 24), r: 7, fill: C.red, stroke: C.ink, "stroke-width": 2, opacity: 0 }, k), r: R() }); }
        const glow = E("rect", { x, y, width: w, height: h, fill: "url(#coreGlow)", opacity: 0 }, k);
        const bglow = E("rect", { x, y: y + h * 0.55, width: w, height: h * 0.45, fill: "url(#botGlow)", opacity: 0 }, k);
        for (let i = 0; i < n; i++) {
          const cx = x + pitch * (i + 0.5), isRod = o.rodAt ? o.rodAt(i) : i % 2 === 1, cg = E("g", {}, k);
          E("rect", { x: cx - cw / 2, y, width: cw, height: h, fill: WAT }, cg);
          if (isRod) {
            const rg = E("g", { "clip-path": `url(#${id})` }, cg);
            const ab = E("rect", { x: cx - cw / 2 + 6, y: y - 7 * m, width: cw - 12, height: 7 * m, fill: ABS, stroke: C.white, "stroke-width": 3 }, rg);
            const dp = E("rect", { x: cx - cw / 2 + 6, y: y + 1.25 * m, width: cw - 12, height: 4.5 * m, rx: 5, fill: GRL, opacity: tips ? 1 : 0 }, rg);
            rods.push({ ab, dp, cx });
          } else {
            E("rect", { x: cx - 8, y: y + 6, width: 16, height: h - 12, rx: 8, fill: C.yellow }, cg);
            const fx = E("rect", { x: cx - cw / 2 + 5, y: y + 4, width: cw - 10, height: h - 8, rx: 6, fill: ABS, stroke: C.green, "stroke-width": 5, opacity: 0 }, cg);
            if (fuels.length % 2 === 1) fixed.push(fx);
            const bs = [], RB = rng(77 + i * 13);
            for (let b = 0; b < 16; b++) bs.push({ el: E("circle", { cx: cx + (RB() - 0.5) * (cw - 18), cy: y + h / 2, r: 5 + RB() * 6, fill: C.white, opacity: 0 }, cg), ph: RB(), sp: 0.25 + RB() * 0.2, rank: RB() });
            fuels.push({ bs, cx });
          }
          E("rect", { x: cx - cw / 2, y, width: cw, height: h, fill: "none", stroke: C.white, "stroke-width": 4 }, cg);
          const RC = rng(5 + i); let d = `M${cx - cw / 2 - 4},${y + h * (0.2 + RC() * 0.5)}`; for (let s = 1; s < 6; s++) d += ` L${cx + (s % 2 ? 1 : -1) * cw * 0.45},${y + h * (0.2 + RC() * 0.6)}`;
          cracks.push(E("path", { d, fill: "none", stroke: C.red, "stroke-width": 7, "stroke-linejoin": "round", opacity: 0 }, k));
        }
        const api = {
          g: k, m, x, y, w, h, rods, fuels,
          set(s, t) {
            if (s.rods != null) rods.forEach((r, i) => { const v = typeof s.rods === "function" ? s.rods(i) : s.rods, yb = y + v * m; r.ab.setAttribute("y", yb - 7 * m); r.dp.setAttribute("y", yb + 1.25 * m); });
            if (s.steam != null) fuels.forEach((f) => f.bs.forEach((b) => { const pf = ((b.ph + t * b.sp) % 1 + 1) % 1; b.el.setAttribute("cy", y + h - 10 - pf * (h - 20)); b.el.setAttribute("opacity", b.rank < s.steam * (0.25 + pf * 1.1) ? 0.9 : 0); }));
            if (s.power != null) glow.setAttribute("opacity", clamp(s.power) * 0.8);
            if (s.bottom != null) bglow.setAttribute("opacity", clamp(s.bottom));
            if (s.xenon != null) xe.forEach((q) => q.el.setAttribute("opacity", q.r < s.xenon ? 1 : 0));
            if (s.fixed != null) fixed.forEach((f) => f.setAttribute("opacity", clamp(s.fixed)));
            if (s.crack != null) cracks.forEach((c, i) => c.setAttribute("opacity", clamp(s.crack * 3 - i * 0.25)));
          },
        };
        api.set({ rods: o.rods ?? 0, steam: 0, power: 0, bottom: 0, xenon: 0 }, 0);
        return api;
      }
      // ---- power meter (vertical bar + number) ----
      function meter(g, x, y, w, h, max, o = {}) {
        const k = E("g", {}, g); E("rect", { x, y, width: w, height: h, rx: 14, fill: C.navyD, stroke: C.white, "stroke-width": 6 }, k);
        const bar = E("rect", { x: x + 9, y: y + h - 9, width: w - 18, height: 0, rx: 8, fill: C.yellow }, k);
        const tx = T(k, "", x + w / 2, y - 26, o.size || 56, C.white); T(k, o.label || "POWER", x + w / 2, y + h + 56, 42, C.mute);
        return { k, set(v) { const f = clamp(v / max); bar.setAttribute("height", (h - 18) * f); bar.setAttribute("y", y + h - 9 - (h - 18) * f); bar.setAttribute("fill", o.red != null && v > o.red ? C.red : C.yellow); tx.textContent = o.fmt ? o.fmt(v) : Math.round(v) + " MW"; } };
      }
      // ---- reactor power history chart, 25 April 00:00 = hour 0 (INSAG-7 Table I-I / NEA) ----
      const PD = [[0, 3200], [1.1, 3200], [3.78, 1600], [23.17, 1600], [24.08, 720], [24.46, 500], [24.48, 30], [24.75, 80], [25.0, 200], [25.39, 200]];
      function pchart(g, x, y, w, h, o = {}) {
        const k = E("g", {}, g), t0 = o.t0 ?? 0, t1 = o.t1 ?? 25.5, vmax = o.vmax ?? 3400;
        const X = (hh) => x + ((hh - t0) / (t1 - t0)) * w, Y = (v) => y + h - (v / vmax) * h;
        (o.grid || [3200, 1600]).forEach((v) => { E("line", { x1: x, y1: Y(v), x2: x + w, y2: Y(v), stroke: C.mute, "stroke-width": 3, "stroke-dasharray": "8 12", opacity: 0.6 }, k); T(k, String(v), x - 18, Y(v) + 15, 40, C.mute, { anchor: "end" }); });
        E("line", { x1: x, y1: y + h, x2: x + w, y2: y + h, stroke: C.white, "stroke-width": 6 }, k); E("line", { x1: x, y1: y - 10, x2: x, y2: y + h, stroke: C.white, "stroke-width": 6 }, k);
        T(k, "MW", x - 18, y - 6, 40, C.mute, { anchor: "end" });
        (o.ticks || [[0, "25 APR"], [12, "NOON"], [24, "26 APR"]]).forEach(([hh, s]) => { E("line", { x1: X(hh), y1: y + h, x2: X(hh), y2: y + h + 16, stroke: C.white, "stroke-width": 5 }, k); T(k, s, X(hh), y + h + 62, 40, C.white); });
        const p = E("path", { d: "", fill: "none", stroke: C.yellow, "stroke-width": 9, "stroke-linejoin": "round", "stroke-linecap": "round" }, k);
        const dot = E("circle", { r: 15, fill: C.white, stroke: C.ink, "stroke-width": 4 }, k);
        const val = (hh) => { for (let i = 1; i < PD.length; i++) if (hh <= PD[i][0]) { const [a0, v0] = PD[i - 1], [a1, v1] = PD[i]; return lerp(v0, v1, (hh - a0) / (a1 - a0)); } return PD[PD.length - 1][1]; };
        return { k, X, Y, val, set(T1) { const pts = PD.filter(([hh]) => hh > t0 && hh < T1).map(([hh, v]) => [hh, v]); pts.unshift([t0, val(t0)]); pts.push([T1, val(T1)]); p.setAttribute("d", pts.map(([hh, v], i) => (i ? "L" : "M") + X(hh).toFixed(1) + "," + Y(v).toFixed(1)).join(" ")); dot.setAttribute("cx", X(T1)); dot.setAttribute("cy", Y(val(T1))); } };
      }
      function marker(g, X, x0, y0, s, at, col = C.white, size = 42, dy = -30) { const k = E("g", {}, g); E("line", { x1: x0, y1: y0, x2: x0, y2: y0 + dy, stroke: col, "stroke-width": 4 }, k); E("circle", { cx: x0, cy: y0, r: 10, fill: col }, k); T(k, s, X, y0 + dy - 14, size, col); pop(k, at); return k; }
      // ---- atoms and neutrons ----
      function nucleus(g, x, y, r, seed = 1) { const k = E("g", { transform: `translate(${x},${y})` }, g), R = rng(seed), n = Math.round((r * r) / 85); for (let i = 0; i < n; i++) { const a = R() * TAU, d = Math.sqrt(R()) * (r - 13); E("circle", { cx: d * Math.cos(a), cy: d * Math.sin(a), r: 13, fill: R() < 0.45 ? C.red : C.white, stroke: C.ink, "stroke-width": 2.5 }, k); } return k; }
      const neut = (g, r = 13) => E("circle", { r, fill: C.sky, stroke: C.white, "stroke-width": 4, cx: -100, cy: -100 }, g);
      const mv = (el, x, y, op) => { el.setAttribute("cx", x); el.setAttribute("cy", y); if (op != null) el.setAttribute("opacity", op); };
      const mvg = (el, x, y, s = 1, op) => { el.setAttribute("transform", `translate(${x},${y}) scale(${s})`); if (op != null) el.setAttribute("opacity", op); };
      function burst(g, x, y, r, col = C.yellow) { const k = E("g", { transform: `translate(${x},${y})`, opacity: 0 }, g); let d = ""; for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU, rr = i % 2 ? r * 0.5 : r; d += (i ? "L" : "M") + (rr * Math.cos(a)).toFixed(1) + "," + (rr * Math.sin(a)).toFixed(1); } E("path", { d: d + "Z", fill: col, stroke: C.ink, "stroke-width": 4 }, k); return k; }
      // ---- machines ----
      function rotor(g, x, y, r, col = C.sky) { const k = E("g", {}, g); E("circle", { cx: x, cy: y, r: r + 12, fill: C.navyD, stroke: C.white, "stroke-width": 6 }, k); const rot = E("g", {}, k); for (let i = 0; i < 6; i++) E("ellipse", { cx: x, cy: y - r * 0.52, rx: r * 0.17, ry: r * 0.42, fill: col, transform: `rotate(${i * 60} ${x} ${y})` }, rot); E("circle", { cx: x, cy: y, r: r * 0.2, fill: C.yellow }, rot); return { k, set(ang) { rot.setAttribute("transform", `rotate(${ang} ${x} ${y})`); } }; }
      function dots(g, d, n, col = C.white, r = 10) { const p = E("path", { d, fill: "none", stroke: col === C.white ? C.mute : col, "stroke-width": 16, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: 0.35 }, g), L = p.getTotalLength(), ds = []; for (let i = 0; i < n; i++) ds.push(E("circle", { r, fill: col, stroke: C.ink, "stroke-width": 3 }, g)); return (phase) => ds.forEach((c, i) => { const q = L ? p.getPointAtLength(((((phase + i / n) % 1) + 1) % 1) * L) : { x: 0, y: 0 }; c.setAttribute("cx", q.x); c.setAttribute("cy", q.y); }); }
      function bolt(g, x, y, s = 1, col = C.yellow) { return E("polygon", { points: [[10, -60], [-26, 8], [0, 8], [-10, 60], [28, -10], [2, -10]].map(([a, b]) => `${x + a * s},${y + b * s}`).join(" "), fill: col, stroke: C.ink, "stroke-width": 4 }, g); }
      function bigButton(g, x, y, r, txt) { const k = E("g", {}, g); E("circle", { cx: x, cy: y + 18, r: r + 20, fill: "#5A6070", stroke: C.white, "stroke-width": 6 }, k); const cap = E("g", {}, k); E("circle", { cx: x, cy: y, r, fill: C.red, stroke: C.ink, "stroke-width": 6 }, cap); T(cap, txt, x, y + 22, Math.round(r * 0.5), C.white); return { k, cap, press(v) { cap.setAttribute("transform", `translate(0,${v * 16})`); } }; }
      function clockFace(g, x, y, r) { const k = E("g", {}, g); E("circle", { cx: x, cy: y, r, fill: C.navyD, stroke: C.white, "stroke-width": 7 }, k); for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; E("line", { x1: x + Math.cos(a) * r * 0.8, y1: y + Math.sin(a) * r * 0.8, x2: x + Math.cos(a) * r * 0.92, y2: y + Math.sin(a) * r * 0.92, stroke: C.white, "stroke-width": 5 }, k); } const hh = E("line", { x1: x, y1: y, x2: x, y2: y - r * 0.5, stroke: C.yellow, "stroke-width": 10, "stroke-linecap": "round" }, k), mh = E("line", { x1: x, y1: y, x2: x, y2: y - r * 0.78, stroke: C.white, "stroke-width": 7, "stroke-linecap": "round" }, k); return (sec) => { hh.setAttribute("transform", `rotate(${(sec / 43200) * 360} ${x} ${y})`); mh.setAttribute("transform", `rotate(${(sec / 3600) * 360} ${x} ${y})`); }; }
      // ---- a single control rod in its channel (big, for chapter five): returns setter of travel in metres ----
      function rodChannel(g, cx, y, m, w = 120, o = {}) {
        const k = E("g", {}, g), id = "rc" + _cid++, h = 7 * m;
        E("rect", { x: cx - w / 2, y, width: w, height: h }, E("clipPath", { id }, defs));
        E("rect", { x: cx - w / 2 - 70, y: y - 12, width: w + 140, height: h + 24, fill: GR, stroke: C.white, "stroke-width": 5, rx: 8 }, k);
        E("rect", { x: cx - w / 2, y, width: w, height: h, fill: WAT }, k);
        const rg = E("g", { "clip-path": `url(#${id})` }, k);
        const ab = E("rect", { x: cx - w / 2 + 10, y: 0, width: w - 20, height: 7 * m, fill: ABS, stroke: C.white, "stroke-width": 4 }, rg);
        const tel = E("rect", { x: cx - 6, y: 0, width: 12, height: 1.25 * m, fill: C.mute }, rg);
        const dp = E("rect", { x: cx - w / 2 + 10, y: 0, width: w - 20, height: (o.dpLen || 4.5) * m, rx: 8, fill: GRL }, rg);
        const bw = E("rect", { x: cx - w / 2 + 3, y: 0, width: w - 6, height: 0, fill: "none", stroke: C.yellow, "stroke-width": 7, "stroke-dasharray": "14 10", opacity: 0 }, k);
        E("rect", { x: cx - w / 2, y, width: w, height: h, fill: "none", stroke: C.white, "stroke-width": 5 }, k);
        return { k, bw, set(v, showGap) { const yb = y + v * m; ab.setAttribute("y", yb - 7 * m); tel.setAttribute("y", yb); dp.setAttribute("y", yb + 1.25 * m); const db = yb + (1.25 + (o.dpLen || 4.5)) * m; bw.setAttribute("y", Math.min(db, y + h)); bw.setAttribute("height", Math.max(0, y + h - db)); bw.setAttribute("opacity", showGap ? showGap : 0); } };
      }
      function scaleBeam(g, cx, cy, Lb, lt, rt) { const k = E("g", {}, g); E("polygon", { points: `${cx},${cy} ${cx - 70},${cy + 300} ${cx + 70},${cy + 300}`, fill: C.navyL, stroke: C.white, "stroke-width": 6 }, k); const bm = E("g", {}, k); E("rect", { x: cx - Lb, y: cy - 10, width: 2 * Lb, height: 20, rx: 8, fill: C.white }, bm); const pans = [[-1, lt], [1, rt]].map(([sg, s]) => { const p = E("g", {}, k); E("path", { d: `M${-170},0 L170,0 L120,70 L-120,70 Z`, fill: C.navyD, stroke: C.yellow, "stroke-width": 6 }, p); T(p, s, 0, 52, 44, C.white); return [sg, p]; }); E("circle", { cx, cy, r: 16, fill: C.yellow }, k);
        return (ang) => { bm.setAttribute("transform", `rotate(${ang} ${cx} ${cy})`); pans.forEach(([sg, p]) => { const a = (ang * Math.PI) / 180; p.setAttribute("transform", `translate(${cx + sg * Lb * Math.cos(a)},${cy + sg * Lb * Math.sin(a) + 30})`); }); }; }

      // ================= BEATS =================
      { bt(0); }
      // 1: the off switch made it worse?
      { const [g, a, d, B] = bt(1);
        const btn = bigButton(g, 420, 400, 150, "OFF"); pop(btn.k, a + 0.05 * d);
        pop(label(g, "SHUT DOWN BUTTON", 420, 690, 52, C.white), a + 0.15 * d);
        const ar = arrowLine(g, 640, 400, 960, 400, C.yellow, 12); fadeIn(ar, a + 0.3 * d);
        const mt = meter(g, 1120, 160, 150, 460, 1000, { red: 500, fmt: (v) => (v > 990 ? "!!!" : "") }); pop(mt.k, a + 0.25 * d);
        const q = label(g, "?", 1480, 470, 260, C.yellow); pop(q, a + 0.6 * d);
        upd(B, (t, u) => { btn.press(seg(u, 0.3, 0.36) - seg(u, 0.42, 0.5)); mt.set(lerp(80, 1000, seg(u, 0.38, 0.85))); });
      }
      // 2: where and when
      { const [g, a, d, B] = bt(2);
        slam(label(g, "26 APRIL 1986", 840, 100, 96, C.yellow), a + 0.05 * d);
        const rv = E("path", { d: "M330,180 C380,300 280,400 350,520 S420,680 380,760", fill: "none", stroke: C.sky, "stroke-width": 14, "stroke-linecap": "round" }, g); fadeIn(rv, a + 0.1 * d);
        label(g, "RIVER", 250, 300, 40, C.sky);
        const p1 = E("g", {}, g); E("circle", { cx: 470, cy: 300, r: 22, fill: C.yellow, stroke: C.ink, "stroke-width": 4 }, p1); T(p1, "CHERNOBYL", 470, 260, 50, C.white); pop(p1, a + 0.15 * d);
        const p2 = E("g", {}, g); E("circle", { cx: 520, cy: 640, r: 18, fill: C.white, stroke: C.ink, "stroke-width": 4 }, p2); T(p2, "KYIV", 610, 656, 46, C.white); pop(p2, a + 0.25 * d);
        label(g, "SOVIET UKRAINE", 470, 470, 44, C.mute);
        const units = [];
        for (let i = 0; i < 4; i++) { const k = E("g", {}, g); box(k, 820 + i * 205, 300, 180, 240, { fill: C.navyL, stroke: i === 3 ? C.yellow : C.white, sw: i === 3 ? 10 : 6 }); T(k, "UNIT " + (i + 1), 910 + i * 205, 600, 44, i === 3 ? C.yellow : C.white); E("rect", { x: 870 + i * 205, y: 220, width: 30, height: 80, fill: C.mute }, k); units.push(k); pop(k, a + (0.3 + i * 0.07) * d); }
        const ring = E("rect", { x: 1420, y: 280, width: 220, height: 350, rx: 20, fill: "none", stroke: C.yellow, "stroke-width": 6, opacity: 0 }, g);
        upd(B, (t, u) => ring.setAttribute("opacity", u > 0.6 ? 0.5 + 0.5 * Math.sin((t - a) * 6) : 0));
      }
      // 3: road map: physics first, then the last day
      { const [g, a, d, B] = bt(3);
        const c1 = E("g", {}, g); box(c1, 120, 170, 620, 470); nucleus(c1, 430, 360, 110, 3); T(c1, "HOW A REACTOR", 430, 545, 54, C.white); T(c1, "MAKES HEAT", 430, 605, 54, C.yellow); pop(c1, a + 0.05 * d);
        fadeIn(arrowLine(g, 770, 405, 910, 405, C.yellow, 12), a + 0.4 * d);
        const c2 = E("g", {}, g); box(c2, 940, 170, 620, 470); const ck = clockFace(c2, 1250, 350, 120); T(c2, "THE LAST DAY,", 1250, 545, 54, C.white); T(c2, "MINUTE BY MINUTE", 1250, 605, 54, C.yellow); pop(c2, a + 0.45 * d);
        upd(B, (t, u) => ck(TS(1, 6) + u * 24 * 3600));
      }
      // ===== CHAPTER 1 =====
      // 4: uranium-235
      { const [g, a, d, B] = bt(4);
        chapter(g, a, 1, "SPLITTING ATOMS");
        const nu = nucleus(g, 840, 450, 150, 7); pop(nu, a + 0.3 * d);
        pop(label(g, "URANIUM-235", 840, 690, 64, C.yellow), a + 0.45 * d);
        pop(label(g, "SPLITS EASILY", 1350, 470, 54, C.white), a + 0.65 * d); fadeIn(arrowLine(g, 1180, 450, 1020, 450, C.white, 8), a + 0.65 * d);
        upd(B, (t, u) => nu.setAttribute("transform", `translate(${840 + Math.sin(t * 9) * 3},450)`));
      }
      // 5: neutron hits, nucleus splits, heat
      { const [g, a, d, B] = bt(5);
        const glow = E("circle", { cx: 840, cy: 400, r: 330, fill: "url(#glowY)", opacity: 0 }, g);
        const nu = nucleus(g, 840, 400, 140, 7), f1 = nucleus(g, 840, 400, 95, 11), f2 = nucleus(g, 840, 400, 95, 12), n = neut(g, 18);
        const lN = label(g, "NEUTRON", 240, 330, 48, C.sky), lH = label(g, "HEAT", 840, 720, 80, C.yellow); pop(lH, a + 0.6 * d);
        pop(lN, a + 0.05 * d);
        upd(B, (t, u) => { const k = seg(u, 0.05, 0.35); mv(n, lerp(160, 760, k), 400, u < 0.36 ? 1 : 0); const s = seg(u, 0.36, 0.75);
          nu.setAttribute("opacity", u < 0.36 ? 1 : 0); mvg(f1, 840 - 420 * s, 400 - 150 * s, 1, u < 0.36 ? 0 : 1); mvg(f2, 840 + 420 * s, 400 + 120 * s, 1, u < 0.36 ? 0 : 1); glow.setAttribute("opacity", 0.9 * seg(u, 0.36, 0.6)); });
      }
      // 6: two or three neutrons, chain
      { const [g, a, d, B] = bt(6);
        pop(label(g, "2 OR 3 NEW NEUTRONS", 840, 80, 68, C.yellow), a + 0.05 * d);
        const n1 = nucleus(g, 380, 420, 110, 21), n2 = nucleus(g, 1300, 420, 110, 22), f = [nucleus(g, 0, 0, 70, 23), nucleus(g, 0, 0, 70, 24), nucleus(g, 0, 0, 70, 25), nucleus(g, 0, 0, 70, 26)];
        const ns = [neut(g), neut(g), neut(g)], dirs = [[1, -0.55], [1, 0], [1, 0.6]], fl = [burst(g, 380, 420, 120), burst(g, 1300, 420, 120)];
        const lC = label(g, "CHAIN REACTION", 840, 740, 72, C.white); pop(lC, a + 0.65 * d);
        upd(B, (t, u) => { const s1 = seg(u, 0.12, 0.3), s2 = seg(u, 0.6, 0.8);
          n1.setAttribute("opacity", u < 0.12 ? 1 : 0); n2.setAttribute("opacity", u < 0.6 ? 1 : 0);
          mvg(f[0], 380 - 160 * s1, 420 - 170 * s1, 1, u < 0.12 ? 0 : 1); mvg(f[1], 380 - 160 * s1, 420 + 170 * s1, 1, u < 0.12 ? 0 : 1);
          mvg(f[2], 1300 + 200 * s2, 420 - 190 * s2, 1, u < 0.6 ? 0 : 1); mvg(f[3], 1300 + 200 * s2, 420 + 190 * s2, 1, u < 0.6 ? 0 : 1);
          fl[0].setAttribute("opacity", clamp(1 - Math.abs(u - 0.14) * 12) * 0.9); fl[1].setAttribute("opacity", clamp(1 - Math.abs(u - 0.62) * 12) * 0.9);
          const k = seg(u, 0.14, 0.6); ns.forEach((c, i) => { const dd = dirs[i], L = i === 1 ? 800 : 640; mv(c, 380 + dd[0] * L * k, 420 + dd[1] * L * 0.55 * k, u < 0.14 || (i === 1 && u > 0.6) ? 0 : 1); }); });
      }
      // 7: keep it balanced: shrinking, steady, growing
      { const [g, a, d, B] = bt(7);
        const rows = [["DIES OUT", [3, 2, 1, 1, 0, 0], C.mute, 140], ["BALANCED", [2, 2, 2, 2, 2, 2], C.yellow, 400], ["RUNS AWAY", [1, 2, 4, 8, 12, 16], C.red, 660]];
        const all = [];
        rows.forEach(([nm, cnt, col, y], r) => { const lab = label(g, nm, 230, y + 18, 52, col); pop(lab, a + (0.05 + r * 0.08) * d);
          cnt.forEach((c, gi) => { for (let j = 0; j < c; j++) { const cols = Math.ceil(c / 4), cx = 520 + gi * 200 + (Math.floor(j / 4) - (cols - 1) / 2) * 34, cy = y + ((j % 4) - (Math.min(c, 4) - 1) / 2) * 38; all.push([E("circle", { cx, cy, r: 14, fill: col, stroke: C.ink, "stroke-width": 3, opacity: 0 }, g), gi]); } }); });
        const bx = E("rect", { x: 60, y: 300, width: 1580, height: 200, rx: 22, fill: "none", stroke: C.yellow, "stroke-width": 6, opacity: 0 }, g);
        upd(B, (t, u) => { all.forEach(([c, gi]) => c.setAttribute("opacity", u > 0.08 + gi * 0.11 ? 1 : 0)); bx.setAttribute("opacity", seg(u, 0.75, 0.85)); });
      }
      // 8: fast neutrons slip past, slow ones split
      { const [g, a, d, B] = bt(8);
        const nA = nucleus(g, 980, 220, 90, 31), nB = nucleus(g, 980, 560, 90, 32), fast = neut(g), slow = neut(g), fb = burst(g, 980, 560, 110);
        label(g, "FAST", 160, 236, 60, C.red); label(g, "SLOW", 160, 576, 60, C.green);
        const trail = E("line", { x1: 0, y1: 150, x2: 0, y2: 150, stroke: C.sky, "stroke-width": 8, "stroke-linecap": "round", opacity: 0.6 }, g);
        pop(label(g, "SLIPS PAST", 1420, 250, 54, C.red), a + 0.25 * d); pop(label(g, "SPLITS IT", 1420, 720, 54, C.green), a + 0.7 * d);
        upd(B, (t, u) => { const f = ((t - a) * 0.9) % 1, fx = lerp(260, 1660, f); mv(fast, fx, 140 + 0 * f); trail.setAttribute("x1", Math.max(260, fx - 260)); trail.setAttribute("x2", fx); trail.setAttribute("y1", 140); trail.setAttribute("y2", 140);
          const s = seg(u, 0.2, 0.62); mv(slow, lerp(280, 900, s), 560, u < 0.63 ? 1 : 0); nB.setAttribute("opacity", u < 0.63 ? 1 : 0); fb.setAttribute("opacity", u > 0.63 ? 0.9 * clamp(1 - (u - 0.63) * 3) : 0); });
      }
      // 9: moderator slows neutrons by bouncing off light atoms
      { const [g, a, d, B] = bt(9);
        pop(label(g, "MODERATOR: LIGHT ATOMS", 840, 80, 70, C.yellow), a + 0.05 * d);
        box(g, 200, 140, 1000, 560, { fill: "#2A3350" });
        const R = rng(9), pts = [[230, 420]];
        for (let i = 0; i < 40; i++) E("circle", { cx: 250 + R() * 900, cy: 180 + R() * 480, r: 18, fill: C.white, opacity: 0.85, stroke: C.ink, "stroke-width": 3 }, g);
        for (let i = 0; i < 9; i++) pts.push([300 + i * 100, 200 + (i % 2 ? 440 : 0) + R() * 40 - 20]);
        const tr = E("polyline", { points: "", fill: "none", stroke: C.sky, "stroke-width": 6, opacity: 0.7 }, g), n = neut(g, 18);
        const sp = meter(g, 1390, 210, 140, 400, 100, { label: "SPEED", fmt: () => "" });
        upd(B, (t, u) => { const s = 1 - (1 - clamp((u - 0.05) / 0.9)) ** 2, L = (pts.length - 1) * s, i = Math.min(pts.length - 2, Math.floor(L)), f = L - i;
          const p = [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]; mv(n, p[0], p[1]); tr.setAttribute("points", pts.slice(0, i + 1).concat([p]).map((q) => q.join(",")).join(" ")); sp.set(100 * (1 - s * 0.9)); });
      }
      // 10: boron control rods swallow neutrons
      { const [g, a, d, B] = bt(10);
        [380, 1300].forEach((x) => E("rect", { x: x - 22, y: 160, width: 44, height: 540, rx: 20, fill: C.yellow, stroke: C.ink, "stroke-width": 4 }, g));
        label(g, "FUEL", 380, 760, 46, C.yellow); label(g, "FUEL", 1300, 760, 46, C.yellow);
        const rod = E("rect", { x: 800, y: -600, width: 80, height: 600, rx: 10, fill: ABS, stroke: C.white, "stroke-width": 5 }, g);
        const rl = label(g, "BORON ROD", 1030, 120, 50, C.white); pop(rl, a + 0.1 * d);
        pop(label(g, "SWALLOWS NEUTRONS", 840, 770, 56, C.red), a + 0.55 * d);
        const lanes = [220, 300, 380, 460, 540, 620], ns = lanes.map(() => neut(g)), fl = lanes.map((y) => E("circle", { cx: 840, cy: y, r: 30, fill: "none", stroke: C.red, "stroke-width": 6, opacity: 0 }, g));
        upd(B, (t, u) => { const bot = lerp(0, 700, seg(u, 0.12, 0.45)); rod.setAttribute("y", bot - 600);
          ns.forEach((c, i) => { const f = (((t - a) * 0.55 + i * 0.37) % 1 + 1) % 1, x = lerp(420, 1260, f), blocked = lanes[i] < bot - 10 && x > 800; mv(c, Math.min(x, blocked ? 800 : x), lanes[i], blocked ? 0 : 1); fl[i].setAttribute("opacity", blocked ? 0.8 * clamp(1 - (x - 800) / 200) : 0); }); });
      }
      // 11: rods in = less power, rods out = more power
      { const [g, a, d, B] = bt(11);
        const c = core(g, 220, 130, 640, 560, { n: 7, tips: false, rods: 2 }), mt = meter(g, 1060, 170, 140, 470, 100, { fmt: (v) => Math.round(v) + "%" });
        const lin = label(g, "RODS IN", 1460, 360, 66, C.sky), lout = label(g, "RODS OUT", 1460, 360, 66, C.yellow), l2 = label(g, "LESS POWER", 1460, 450, 56, C.white), l3 = label(g, "MORE POWER", 1460, 450, 56, C.white);
        upd(B, (t, u) => { const dep = 2 + 4 * seg(u, 0.05, 0.35) - 5.5 * seg(u, 0.5, 0.8); c.set({ rods: dep, power: 1 - dep / 7, steam: 0.3 }, t); mt.set(100 * (1 - dep / 7.5));
          const inn = u < 0.45; [lin, l2].forEach((e) => e.setAttribute("opacity", inn ? 1 : 0)); [lout, l3].forEach((e) => e.setAttribute("opacity", inn ? 0 : 1)); });
      }
      // 12: coolant carries heat to a turbine
      { const [g, a, d, B] = bt(12);
        const c = core(g, 120, 220, 330, 420, { n: 5, tips: false, rods: 3 });
        const steam = dots(g, "M300,200 L300,120 L760,120 L760,250", 6, C.white), water = dots(g, "M760,560 L760,720 L300,720 L300,660", 6, C.sky);
        const tb = rotor(g, 760, 400, 120); label(g, "TURBINE", 760, 590, 44, C.white);
        E("rect", { x: 900, y: 380, width: 180, height: 40, fill: C.mute }, g);
        box(g, 1080, 300, 260, 200, { fill: C.navyL }); label(g, "GENERATOR", 1210, 545, 44, C.white);
        const bl = bolt(g, 1500, 400, 1.6); pop(bl, a + 0.55 * d);
        label(g, "STEAM", 530, 100, 46, C.white); label(g, "WATER BACK", 530, 772, 46, C.sky);
        pop(label(g, "ELECTRICITY", 1500, 560, 52, C.yellow), a + 0.6 * d);
        upd(B, (t, u) => { c.set({ steam: 0.7, power: 0.4 }, t); steam(t * 0.5); water((t * 0.5) % 1); tb.set((t - a) * 260); });
      }
      // 13: four ingredients
      { const [g, a, d, B] = bt(13);
        const items = [["FUEL", C.yellow], ["MODERATOR", GRL], ["CONTROL RODS", C.white], ["COOLANT", C.sky]];
        items.forEach(([s, col], i) => { const k = E("g", {}, g), x = 240 + i * 400; box(k, x - 150, 180, 300, 300, { fill: C.navyD });
          if (i === 0) for (let j = 0; j < 3; j++) E("rect", { x: x - 70 + j * 55, y: 220, width: 30, height: 220, rx: 15, fill: C.yellow }, k);
          if (i === 1) for (let j = 0; j < 9; j++) E("rect", { x: x - 105 + (j % 3) * 72, y: 220 + Math.floor(j / 3) * 72, width: 64, height: 64, fill: GR, stroke: GRL, "stroke-width": 4 }, k);
          if (i === 2) { E("rect", { x: x - 30, y: 210, width: 60, height: 160, fill: ABS, stroke: C.white, "stroke-width": 4 }, k); E("rect", { x: x - 30, y: 372, width: 60, height: 80, fill: "none", stroke: C.white, "stroke-width": 4, "stroke-dasharray": "8 8" }, k); }
          if (i === 3) E("path", { d: `M${x},215 C${x + 90},330 ${x + 90},440 ${x},440 C${x - 90},440 ${x - 90},330 ${x},215 Z`, fill: WAT, stroke: C.white, "stroke-width": 5 }, k);
          T(k, s, x, 545, 46, col); pop(k, a + (0.05 + i * 0.1) * d); });
        pop(label(g, "WORKING AGAINST EACH OTHER?", 840, 700, 76, C.red), a + 0.65 * d);
      }
      // ===== CHAPTER 2 =====
      // 14: the RBMK, 3200 MW of heat
      { const [g, a, d, B] = bt(14);
        chapter(g, a, 2, "THE RBMK");
        const c = core(g, 200, 260, 460, 440, { n: 7, tips: false });
        const num = label(g, "0", 1170, 470, 150, C.yellow), mw = label(g, "MEGAWATTS OF HEAT", 1170, 570, 56, C.white); pop(mw, a + 0.3 * d);
        upd(B, (t, u) => { c.set({ steam: 0.6, power: 0.55 }, t); num.textContent = String(Math.round(3200 * seg(u, 0.2, 0.7))); });
      }
      // 15: graphite stack, 7 m tall, nearly 12 m across
      { const [g, a, d, B] = bt(15);
        const c = core(g, 440, 80, 800, 520, { n: 11, tips: false });
        E("line", { x1: 360, y1: 64, x2: 360, y2: 616, stroke: C.yellow, "stroke-width": 6 }, g); label(g, "7 M", 270, 360, 66, C.yellow);
        E("line", { x1: 424, y1: 660, x2: 1256, y2: 660, stroke: C.yellow, "stroke-width": 6 }, g); pop(label(g, "NEARLY 12 M ACROSS", 840, 740, 60, C.yellow), a + 0.35 * d);
        pop(label(g, "GRAPHITE", 1440, 300, 60, GRL), a + 0.55 * d); pop(label(g, "= MODERATOR", 1440, 380, 52, C.white), a + 0.65 * d);
        upd(B, (t, u) => c.set({ steam: 0.4, power: 0.3 }, t));
      }
      // 16: pressure tubes, water boils on the way up
      { const [g, a, d, B] = bt(16);
        const c = core(g, 380, 140, 760, 500, { n: 9, tips: false });
        const up = dots(g, "M300,700 L300,90", 5, C.sky); label(g, "WATER IN", 300, 760, 46, C.sky);
        label(g, "WATER", 1600, 580, 46, C.sky); label(g, "+ STEAM", 1600, 120, 46, C.white);
        pop(label(g, "BOILS AS IT RISES", 1370, 360, 50, C.yellow), a + 0.5 * d); fadeIn(arrowLine(g, 1600, 530, 1600, 170, C.white, 8), a + 0.3 * d);
        upd(B, (t, u) => { c.set({ steam: 0.2 + 0.5 * seg(u, 0, 0.6), power: 0.3 }, t); up(t * 0.4); });
      }
      // 17: water does two jobs
      { const [g, a, d, B] = bt(17);
        E("rect", { x: 760, y: 80, width: 160, height: 620, fill: WAT, stroke: C.white, "stroke-width": 6 }, g); E("rect", { x: 822, y: 100, width: 36, height: 580, rx: 18, fill: C.yellow }, g);
        const l1 = E("g", {}, g); T(l1, "1. COOLS THE FUEL", 380, 300, 56, C.white); [240, 400, 560].forEach((y) => arrowLine(l1, 750, y, 600, y, "#FF8A3D", 9)); pop(l1, a + 0.15 * d);
        const l2 = E("g", {}, g); T(l2, "2. ABSORBS NEUTRONS", 1310, 300, 56, C.sky); pop(l2, a + 0.5 * d);
        const ns = [0, 1, 2, 3].map(() => neut(g)), fl = [0, 1, 2, 3].map(() => E("circle", { r: 26, fill: "none", stroke: C.red, "stroke-width": 6, opacity: 0 }, g));
        upd(B, (t, u) => ns.forEach((c, i) => { const f = (((t - a) * 0.5 + i * 0.25) % 1 + 1) % 1, y = 400 + i * 70, x = lerp(1620, 860, f); const on = u > 0.5; mv(c, x, y, on && f < 0.85 ? 1 : 0); mv(fl[i], 900, y, on && f > 0.85 ? 0.9 : 0); }));
      }
      // 18: water vs steam: steam lets more neutrons through
      { const [g, a, d, B] = bt(18);
        [[420, "WATER", WAT, 0.85], [1260, "STEAM", "#BFCBFF", 0.15]].forEach(([x, s, col, pa], k) => {
          E("rect", { x: x - 260, y: 160, width: 520, height: 340, rx: 20, fill: col, opacity: k ? 0.25 : 0.9 }, g); E("rect", { x: x - 260, y: 160, width: 520, height: 340, rx: 20, fill: "none", stroke: C.white, "stroke-width": 6 }, g);
          if (k) { const R = rng(4); for (let i = 0; i < 14; i++) E("circle", { cx: x - 220 + R() * 440, cy: 190 + R() * 280, r: 12 + R() * 16, fill: C.white, opacity: 0.6 }, g); }
          label(g, s, x, 120, 60, k ? C.white : C.sky);
          const ns = [0, 1, 2, 3, 4, 5].map(() => neut(g, 11));
          upd(BT[18], (t, u) => ns.forEach((c, i) => { const f = (((t - a) * 0.45 + i / 6) % 1 + 1) % 1, stop = i / 6 < pa ? 0.35 + (i % 3) * 0.1 : 2; mv(c, x - 250 + f * 500, 200 + i * 52, f > stop ? 0 : 1); }));
        });
        label(g, "MOST STOPPED", 420, 570, 48, C.red); label(g, "MOST GET THROUGH", 1260, 570, 48, C.green);
        pop(label(g, "LESS WATER = MORE NEUTRONS", 840, 720, 74, C.yellow), a + 0.55 * d);
      }
      // 19: more steam, more power
      { const [g, a, d, B] = bt(19);
        pop(label(g, "MORE STEAM = MORE POWER", 840, 84, 84, C.yellow), a + 0.5 * d);
        const c = core(g, 260, 170, 680, 520, { n: 9, tips: false }), mt = meter(g, 1220, 220, 150, 440, 100, { fmt: (v) => Math.round(v) + "%", red: 80 });
        upd(B, (t, u) => { const s = seg(u, 0.1, 0.9); c.set({ steam: 0.1 + 0.9 * s, power: 0.2 + 0.7 * s }, t); mt.set(40 + 55 * s); });
      }
      // 20: positive void coefficient
      { const [g, a, d, B] = bt(20);
        slam(label(g, "POSITIVE VOID COEFFICIENT", 840, 110, 92, C.white), a + 0.05 * d);
        const b1 = E("g", {}, g); box(b1, 160, 220, 620, 420); T(b1, "VOID = STEAM BUBBLE", 470, 600, 50, C.white); pop(b1, a + 0.3 * d);
        const bs = [0, 1, 2, 3, 4, 5].map((i) => E("circle", { r: 26 + (i % 3) * 10, fill: C.white, opacity: 0.85 }, b1));
        const b2 = E("g", {}, g); box(b2, 900, 220, 620, 420); T(b2, "POSITIVE = POWER UP", 1210, 600, 50, C.yellow); arrowLine(b2, 1210, 520, 1210, 270, C.yellow, 14); pop(b2, a + 0.6 * d);
        upd(B, (t, u) => bs.forEach((c, i) => { const f = (((t - a) * 0.35 + i / 6) % 1 + 1) % 1; mv(c, 300 + i * 70, 520 - f * 260, Math.sin(Math.PI * f)); }));
      }
      // 21: the loop that feeds itself
      { const [g, a, d, B] = bt(21);
        const cx = 840, cy = 420, r = 260, nodes = [["MORE POWER", -90], ["MORE BOILING", 30], ["MORE STEAM", 150]];
        E("circle", { cx, cy, r, fill: "none", stroke: C.mute, "stroke-width": 10, "stroke-dasharray": "20 18" }, g);
        const glows = nodes.map(([s, ang], i) => { const x = cx + r * Math.cos((ang * Math.PI) / 180), y = cy + r * Math.sin((ang * Math.PI) / 180), k = E("g", {}, g); const c = E("circle", { cx: x, cy: y, r: 70, fill: C.navyL, stroke: C.yellow, "stroke-width": 6 }, k); T(k, s, x + (i === 1 ? 140 : i === 2 ? -140 : 0), y + (i === 0 ? -90 : 110), 50, i === 0 ? C.yellow : C.white); pop(k, a + (0.05 + i * 0.12) * d); return c; });
        const dot = E("circle", { r: 26, fill: C.red, stroke: C.white, "stroke-width": 5 }, g);
        pop(label(g, "FEEDS ITSELF", cx, cy + 22, 64, C.red), a + 0.55 * d);
        upd(B, (t, u) => { const ph = 0.6 * (t - a) + 0.25 * (t - a) ** 2, ang = -Math.PI / 2 + ph * TAU / 3; mv(dot, cx + r * Math.cos(ang), cy + r * Math.sin(ang)); glows.forEach((c, i) => { const da = ((((ph / 3) * 3 - i) % 3) + 3) % 3; c.setAttribute("fill", da < 0.35 ? C.red : C.navyL); }); });
      }
      // 22: unstable below about 20% power
      { const [g, a, d, B] = bt(22);
        const x0 = 220, x1 = 1520, y0 = 160, y1 = 620, X = (p) => x0 + (p / 100) * (x1 - x0);
        E("rect", { x: x0, y: y0, width: X(20) - x0, height: y1 - y0, fill: C.red, opacity: 0.35 }, g);
        E("line", { x1: x0, y1, x2: x1, y2: y1, stroke: C.white, "stroke-width": 6 }, g);
        [0, 20, 50, 100].forEach((p) => { E("line", { x1: X(p), y1, x2: X(p), y2: y1 + 16, stroke: C.white, "stroke-width": 5 }, g); label(g, p + "%", X(p), y1 + 64, 44, p === 20 ? C.red : C.white); });
        label(g, "POWER, % OF FULL", 840, 760, 44, C.mute);
        pop(label(g, "UNSTABLE", X(10), 140, 52, C.red), a + 0.45 * d); pop(label(g, "STEAM EFFECT IN CHECK", 1050, 300, 52, C.green), a + 0.1 * d);
        const mk = E("circle", { r: 30, fill: C.green, stroke: C.white, "stroke-width": 6 }, g);
        upd(B, (t, u) => { const p = lerp(95, 10, seg(u, 0.25, 0.8)), un = p < 20; mv(mk, X(p), 480 + (un ? Math.sin((t - a) * 22) * 60 * clamp((20 - p) / 6) : 0)); mk.setAttribute("fill", un ? C.red : p < 35 ? C.yellow : C.green); });
      }
      // 23: one more flaw, in the rods
      { const [g, a, d, B] = bt(23);
        const c = core(g, 200, 120, 700, 600, { n: 9, rods: 0 });
        const hl = E("rect", { x: 0, y: 0, width: 0, height: 0, rx: 10, fill: "none", stroke: C.yellow, "stroke-width": 8, opacity: 0 }, g);
        const r = c.rods[1]; setA(hl, { x: r.cx - 40, y: 120 + 1.25 * c.m - 14, width: 80, height: 4.5 * c.m + 28 });
        pop(label(g, "THE CONTROL RODS", 1290, 330, 62, C.white), a + 0.1 * d); pop(label(g, "?", 1290, 560, 220, C.yellow), a + 0.45 * d);
        upd(B, (t, u) => { c.set({ steam: 0.3, power: 0.2 }, t); hl.setAttribute("opacity", u > 0.3 ? 0.55 + 0.45 * Math.sin((t - a) * 6) : 0); });
      }
      // ===== CHAPTER 3 =====
      // 24: maintenance shutdown plus a test
      { const [g, a, d, B] = bt(24);
        chapter(g, a, 3, "THE DELAYED TEST");
        const cal = E("g", {}, g); box(cal, 220, 260, 380, 400, { fill: C.white, stroke: C.white }); E("rect", { x: 220, y: 260, width: 380, height: 100, rx: 18, fill: C.red }, cal); T(cal, "APRIL", 410, 335, 56, C.white, { sw: 0 }); T(cal, "25", 410, 590, 200, C.navyD, { sw: 0 }); pop(cal, a + 0.25 * d);
        const l1 = E("g", {}, g); checkMark(l1, 840, 380, 40); T(l1, "SHUT DOWN FOR MAINTENANCE", 1240, 398, 50, C.white); pop(l1, a + 0.4 * d);
        const l2 = E("g", {}, g); E("circle", { cx: 840, cy: 560, r: 40, fill: C.yellow }, l2); T(l2, "?", 840, 580, 56, C.navyD, { sw: 0 }); T(l2, "BUT FIRST: A SAFETY TEST", 1220, 578, 50, C.yellow); pop(l2, a + 0.6 * d);
      }
      // 25: can the coasting turbine bridge the gap?
      { const [g, a, d, B] = bt(25);
        const tb = rotor(g, 450, 330, 130); label(g, "TURBINE, STILL SPINNING", 450, 560, 46, C.white);
        const pyl = E("g", {}, g); E("path", { d: "M150,60 L100,250 M150,60 L200,250 M118,180 L182,180 M132,120 L168,120 M120,60 L180,60", stroke: C.white, "stroke-width": 8, fill: "none", "stroke-linecap": "round" }, pyl); crossMark(pyl, 220, 70, 34); T(pyl, "OUTSIDE POWER", 150, 310, 40, C.white); pop(pyl, a + 0.1 * d);
        const w = dots(g, "M600,330 L800,330", 4, C.yellow, 12);
        const pumps = [0, 1].map((i) => rotor(g, 920 + i * 190, 330, 70, C.white)); label(g, "COOLING PUMPS", 1015, 490, 46, C.white);
        const dg = E("g", {}, g); box(dg, 1340, 220, 260, 220, { fill: C.navyL }); T(dg, "BACKUP", 1470, 310, 44, C.white); T(dg, "GENERATORS", 1470, 370, 40, C.white); pop(dg, a + 0.35 * d);
        const bar = E("rect", { x: 1340, y: 470, width: 0, height: 26, rx: 10, fill: C.yellow }, g); E("rect", { x: 1340, y: 470, width: 260, height: 26, rx: 10, fill: "none", stroke: C.white, "stroke-width": 4 }, g);
        pop(label(g, "CAN IT BRIDGE THE GAP?", 840, 700, 76, C.yellow), a + 0.6 * d);
        upd(B, (t, u) => { const sp = Math.max(0.2, 1 - (t - a) * 0.08); tb.set((t - a) * 300 * sp); pumps.forEach((p) => p.set((t - a) * 220 * sp)); w((t - a) * 0.6 * sp); bar.setAttribute("width", 260 * seg(u, 0.3, 1)); });
      }
      // 26: 01:06 power reduction starts; 03:47 half power, 1600 MW
      const PCH = [130, 90, 1420, 520];
      { const [g, a, d, B] = bt(26);
        const pc = pchart(g, ...PCH); marker(g, pc.X(1.1) + 120, pc.X(1.1), pc.Y(3200), "01:06 START", a + 0.2 * d, C.white, 44, -20);
        marker(g, pc.X(3.78) + 160, pc.X(3.78), pc.Y(1600), "03:47  1600 MW: HALF", a + 0.6 * d, C.yellow, 44, -70);
        upd(B, (t, u) => pc.set(lerp(0.01, 5, seg(u, 0.05, 0.75))));
      }
      // 27: 14:00 Kyiv grid controller asks them to wait
      { const [g, a, d, B] = bt(27);
        const pc = pchart(g, ...PCH); const m = marker(g, pc.X(14), pc.X(14), pc.Y(1600), "14:00 GRID: PLEASE WAIT", a + 0.45 * d, C.yellow, 48, -150);
        const pl = E("g", {}, g); E("path", { d: "M0,-90 L-50,90 M0,-90 L50,90 M-34,30 L34,30 M-20,-20 L20,-20", stroke: C.white, "stroke-width": 8, fill: "none", "stroke-linecap": "round" }, pl); pl.setAttribute("transform", `translate(${pc.X(14) + 380},380)`); pop(pl, a + 0.55 * d);
        upd(B, (t, u) => pc.set(lerp(5, 14.5, seg(u, 0.0, 0.5))));
      }
      // 28: hours at half power, emergency cooling switched off
      { const [g, a, d, B] = bt(28);
        const pc = pchart(g, ...PCH);
        const eb = E("g", {}, g); box(eb, 560, 150, 560, 150, { fill: C.navyD, stroke: C.red }); T(eb, "EMERGENCY COOLING", 800, 215, 44, C.white); T(eb, "SWITCHED OFF", 800, 275, 44, C.red); crossMark(eb, 1060, 225, 36); pop(eb, a + 0.25 * d);
        const hr = label(g, "", 840, 470, 66, C.yellow);
        upd(B, (t, u) => { const T1 = lerp(14.5, 23.1, seg(u, 0.05, 0.85)); pc.set(T1); hr.textContent = T1 < 14.3 ? "" : "COOLING OFF FOR " + Math.max(0, Math.round(T1 - 14)) + " HOURS"; });
      }
      // 29: 23:10 power reduction continues, test slips into the night
      { const [g, a, d, B] = bt(29);
        const pc = pchart(g, ...PCH); marker(g, pc.X(23.17) - 260, pc.X(23.17), pc.Y(1600), "23:10 GO AHEAD", a + 0.15 * d, C.yellow, 48, -110);
        const moon = E("g", {}, g); E("circle", { cx: 840, cy: 160, r: 60, fill: C.yellow }, moon); E("circle", { cx: 870, cy: 140, r: 54, fill: "#16205F" }, moon); pop(moon, a + 0.4 * d);
        pop(label(g, "FROM AFTERNOON TO THE MIDDLE OF THE NIGHT", 840, 330, 54, C.white), a + 0.5 * d);
        upd(B, (t, u) => pc.set(lerp(23.1, 24.05, seg(u, 0.1, 0.9))));
      }
      // 30: xenon builds up
      { const [g, a, d, B] = bt(30);
        const c = core(g, 380, 110, 760, 560, { n: 9, rods: 0.5 });
        pop(label(g, "XENON", 1430, 380, 90, C.red), a + 0.4 * d); pop(label(g, "INVISIBLE, BUILDING UP", 840, 760, 52, C.white), a + 0.55 * d);
        upd(B, (t, u) => c.set({ xenon: seg(u, 0.2, 0.95), steam: 0.25, power: 0.2 }, t));
      }
      // 31: xenon-135: from fission products, swallows neutrons
      { const [g, a, d, B] = bt(31);
        const b1 = E("g", {}, g); box(b1, 100, 250, 420, 220); T(b1, "FISSION", 310, 345, 52, C.white); T(b1, "PRODUCTS", 310, 410, 52, C.white); pop(b1, a + 0.05 * d);
        fadeIn(arrowLine(g, 540, 360, 760, 360, C.white, 10), a + 0.2 * d); label(g, "DECAY", 650, 320, 42, C.mute);
        const xe = E("g", {}, g); E("circle", { cx: 960, cy: 360, r: 130, fill: C.red, stroke: C.white, "stroke-width": 6 }, xe); T(xe, "XE-135", 960, 380, 58, C.white); pop(xe, a + 0.3 * d);
        const n = neut(g, 18), fl = burst(g, 1090, 360, 70, C.white);
        pop(label(g, "ONE OF THE STRONGEST NEUTRON ABSORBERS", 840, 700, 56, C.yellow), a + 0.55 * d);
        upd(B, (t, u) => { const f = (((t - a) * 0.5) % 1 + 1) % 1, on = u > 0.4; mv(n, lerp(1620, 1100, clamp(f / 0.7)), 360, on && f < 0.7 ? 1 : 0); fl.setAttribute("opacity", on && f >= 0.7 ? 0.8 * (1 - (f - 0.7) / 0.3) : 0); });
      }
      // 32: at full power it burns away, at low power it piles up
      { const [g, a, d, B] = bt(32);
        [[440, "FULL POWER", 0.15, C.green], [1240, "LOW POWER", 0.95, C.red]].forEach(([x, s, top, col]) => {
          label(g, s, x, 100, 64, C.white); E("rect", { x: x - 110, y: 160, width: 220, height: 460, rx: 16, fill: C.navyD, stroke: C.white, "stroke-width": 6 }, g);
          const bar = E("rect", { x: x - 98, y: 608, width: 196, height: 0, rx: 10, fill: C.red }, g); label(g, "XENON", x, 680, 46, C.red);
          upd(B, (t, u) => { const v = top * seg(u, 0.1, 0.8) + (top < 0.5 ? 0.04 * Math.sin((t - a) * 5) : 0), hh = Math.max(0, 436 * v); bar.setAttribute("height", hh); bar.setAttribute("y", 608 - hh); });
        });
        pop(label(g, "BURNED AWAY", 440, 760, 48, C.green), a + 0.35 * d); pop(label(g, "CHOKES THE REACTION", 1240, 760, 48, C.red), a + 0.65 * d);
      }
      // ===== CHAPTER 4 =====
      const ZCH = [200, 250, 1300, 420], ZO = { t0: 23.9, t1: 25.5, vmax: 1000, grid: [700, 200], ticks: [[24, "00:00"], [24.5, "00:30"], [25, "01:00"]] };
      // 33: 00:28, during a switch of control systems, power plunges
      { const [g, a, d, B] = bt(33);
        chapter(g, a, 4, "THE LAST MINUTES");
        const pc = pchart(g, ...ZCH, ZO); marker(g, pc.X(24.47) + 170, pc.X(24.47), pc.Y(30), "00:28 PLUNGE", a + 0.7 * d, C.red, 48, -70);
        upd(B, (t, u) => pc.set(lerp(23.95, 24.5, seg(u, 0.2, 0.8))));
      }
      // 34: about 30 MW, almost asleep, xenon growing
      { const [g, a, d, B] = bt(34);
        const c = core(g, 200, 110, 700, 560, { n: 9, rods: 0.6 }), mt = meter(g, 1150, 180, 150, 420, 3200, {});
        pop(label(g, "ALMOST ASLEEP", 1225, 740, 54, C.sky), a + 0.4 * d);
        upd(B, (t, u) => { c.set({ xenon: 0.6 + 0.35 * u, steam: 0.05, power: 0.03 }, t); mt.set(lerp(500, 30, seg(u, 0, 0.3))); });
      }
      // 35: operators pull out rod after rod
      { const [g, a, d, B] = bt(35);
        const c = core(g, 200, 130, 820, 560, { n: 11 });
        const tb = E("g", {}, g); box(tb, 1150, 160, 440, 200, { stroke: C.yellow }); T(tb, "TEST PLAN:", 1370, 240, 48, C.white); T(tb, "700-1000 MW", 1370, 315, 56, C.yellow); pop(tb, a + 0.05 * d);
        pop(label(g, "PULL RODS OUT", 1370, 520, 58, C.white), a + 0.3 * d); fadeIn(arrowLine(g, 1370, 640, 1370, 560, C.white, 10), a + 0.3 * d);
        upd(B, (t, u) => c.set({ rods: (i) => 4.5 * (1 - seg(u, 0.1 + i * 0.1, 0.25 + i * 0.1)), xenon: 0.9, steam: 0.15, power: 0.05 + 0.15 * u }, t));
      }
      // 36: 01:00, held at about 200 MW, deep in the unstable zone
      { const [g, a, d, B] = bt(36);
        const pc = pchart(g, ...ZCH, ZO);
        E("rect", { x: 200, y: pc.Y(640), width: 1300, height: pc.Y(0) - pc.Y(640), fill: C.red, opacity: 0.22 }, g);
        pop(label(g, "RED ZONE: BELOW ABOUT 20% POWER", 1240, 215, 46, C.red), a + 0.45 * d);
        marker(g, pc.X(25) + 40, pc.X(25), pc.Y(200), "01:00  ABOUT 200 MW", a + 0.7 * d, C.yellow, 48, -160);
        upd(B, (t, u) => pc.set(lerp(24.5, 25.1, seg(u, 0.05, 0.6))));
      }
      // 37: the reserve of rods: shut down at 15
      { const [g, a, d, B] = bt(37);
        pop(label(g, "RODS IN RESERVE", 840, 80, 70, C.white), a + 0.05 * d);
        const rs = []; for (let i = 0; i < 30; i++) rs.push(E("rect", { x: 140 + i * 47, y: 200, width: 34, height: 300, rx: 6, fill: ABS, stroke: C.white, "stroke-width": 4 }, g));
        const th = E("line", { x1: 140 + 15 * 47 - 7, y1: 170, x2: 140 + 15 * 47 - 7, y2: 540, stroke: C.red, "stroke-width": 8 }, g);
        label(g, "AT 15: SHUT DOWN", 140 + 15 * 47 - 7, 600, 52, C.red);
        const cnt = label(g, "", 840, 730, 64, C.yellow);
        upd(B, (t, u) => { const n = Math.round(lerp(30, 12, seg(u, 0.2, 0.9))); rs.forEach((r, i) => { r.setAttribute("y", i < n ? 200 : 130); r.setAttribute("opacity", i < n ? 1 : 0.2); }); cnt.textContent = "RESERVE: " + n + " RODS"; void th; });
      }
      // 38: computed after the accident: just eight
      { const [g, a, d, B] = bt(38);
        const ck = label(g, "01:22:30", 840, 110, 80, C.white); pop(ck, a + 0.02 * d);
        const n8 = label(g, "8", 520, 470, 280, C.red), n15 = label(g, "15", 1160, 470, 280, C.white); pop(n8, a + 0.15 * d); pop(n15, a + 0.25 * d);
        label(g, "ACTUAL RESERVE", 520, 560, 48, C.red); label(g, "SHUTDOWN LIMIT", 1160, 560, 48, C.white);
        pop(label(g, "THE OPERATOR PROBABLY DIDN'T KNOW", 840, 720, 62, C.yellow), a + 0.55 * d);
      }
      // 39: knife edge
      { const [g, a, d, B] = bt(39);
        E("polygon", { points: "840,520 760,720 920,720", fill: C.navyL, stroke: C.white, "stroke-width": 6 }, g);
        const bm = E("g", {}, g); E("rect", { x: 240, y: 500, width: 1200, height: 22, rx: 8, fill: C.white }, bm);
        const tags = [["LOW POWER", 340], ["FEW RODS", 640], ["XENON", 1040], ["STEAM EFFECT", 1330]];
        tags.forEach(([s, x], i) => { const k = E("g", {}, bm); box(k, x - 140, 380, 280, 110, { fill: C.navyD, stroke: i % 2 ? C.red : C.yellow }); T(k, s, x, 455, 44, C.white); pop(k, a + (0.1 + i * 0.1) * d); });
        pop(label(g, "ON A KNIFE EDGE", 840, 160, 84, C.red), a + 0.5 * d);
        upd(B, (t, u) => bm.setAttribute("transform", `rotate(${Math.sin((t - a) * 2.2) * 4 * (0.5 + u)} 840 520)`));
      }
      // 40: 01:23:04 test begins, turbine slows
      { const [g, a, d, B] = bt(40);
        const ck = label(g, "", 840, 120, 110, C.yellow); pop(label(g, "TEST BEGINS", 840, 200, 56, C.white), a + 0.1 * d);
        const vlv = E("g", {}, g); E("rect", { x: 200, y: 420, width: 400, height: 50, fill: C.mute }, vlv); E("polygon", { points: "380,390 440,445 380,500 500,390 440,445 500,500", fill: C.white, stroke: C.ink, "stroke-width": 4 }, vlv); crossMark(vlv, 440, 330, 38); T(vlv, "STEAM SHUT OFF", 400, 590, 48, C.white);
        pop(vlv, a + 0.25 * d);
        const tb = rotor(g, 1100, 445, 150); label(g, "TURBINE SLOWING", 1100, 700, 52, C.white);
        upd(B, (t, u) => { ck.textContent = hms(TS(1, 23, 4) + (t - a) * 0.4); const tt = t - a; tb.set(360 * (1.2 * tt - 0.05 * tt * tt)); });
      }
      // 41: pumps run on the slowing turbine, flow drops
      { const [g, a, d, B] = bt(41);
        const tb = rotor(g, 220, 380, 120); label(g, "TURBINE", 220, 580, 46, C.white);
        fadeIn(arrowLine(g, 370, 380, 520, 380, C.yellow, 10), a + 0.1 * d);
        const ps = [0, 1, 2, 3].map((i) => rotor(g, 640 + i * 190, 380, 70, C.white)); label(g, "4 MAIN COOLING PUMPS", 925, 540, 48, C.white);
        const fl = meter(g, 1480, 200, 130, 380, 100, { label: "WATER FLOW", fmt: () => "" });
        pop(label(g, "LESS WATER THROUGH THE CORE", 840, 720, 64, C.yellow), a + 0.5 * d);
        upd(B, (t, u) => { const tt = t - a, ang = 360 * (0.9 * tt - 0.06 * tt * tt); tb.set(ang); ps.forEach((p) => p.set(ang * 1.3)); fl.set(lerp(95, 55, seg(u, 0.2, 0.95))); });
      }
      // 42: less flow, more steam, more power; about half a minute looks normal
      { const [g, a, d, B] = bt(42);
        const c = core(g, 200, 140, 760, 560, { n: 9, rods: 0.3 }), mt = meter(g, 1180, 230, 150, 400, 600, {});
        const ck = label(g, "", 1255, 120, 72, C.white), ok = label(g, "LOOKS NORMAL", 1255, 760, 54, C.green);
        upd(B, (t, u) => { c.set({ steam: 0.3 + 0.35 * u, power: 0.12 + 0.12 * u, xenon: 0.8 }, t); mt.set(200 + 40 * u); ck.textContent = hms(TS(1, 23, 4) + 36 * u); ok.setAttribute("opacity", u > 0.55 ? 1 : 0); });
      }
      // 43: 01:23:40, AZ-5 pressed, rods start down
      { const [g, a, d, B] = bt(43);
        slam(label(g, "01:23:40", 420, 130, 110, C.red), a + 0.1 * d);
        const btn = bigButton(g, 420, 420, 150, "AZ-5"); pop(btn.k, a + 0.05 * d);
        label(g, "EMERGENCY SHUTDOWN", 420, 720, 52, C.white);
        const c = core(g, 860, 110, 700, 560, { n: 9, rods: 0 });
        pop(label(g, "RODS START DOWN", 1210, 760, 52, C.yellow), a + 0.65 * d);
        upd(B, (t, u) => { btn.press(seg(u, 0.4, 0.46)); c.set({ rods: 0.8 * seg(u, 0.5, 1), steam: 0.7, power: 0.25, xenon: 0.8 }, t); });
      }
      // ===== CHAPTER 5 =====
      // 44: one control rod
      { const [g, a, d, B] = bt(44);
        chapter(g, a, 5, "THE BUTTON THAT ADDED POWER");
        const rc = rodChannel(g, 840, 230, 74, 130); fadeIn(rc.k, a + 0.3 * d);
        upd(B, (t, u) => rc.set(0));
      }
      // 45: rod anatomy laid on its side
      { const [g, a, d, B] = bt(45);
        const y = 330, mpx = 140;
        const ab = E("g", {}, g); E("rect", { x: 40, y, width: 560, height: 110, fill: ABS, stroke: C.white, "stroke-width": 5 }, ab); T(ab, "BORON ABSORBER", 320, y - 30, 50, C.white); pop(ab, a + 0.05 * d);
        const tl1 = E("g", {}, g); E("rect", { x: 600, y: y + 45, width: 1.25 * mpx * 0.6, height: 20, fill: C.mute }, tl1); T(tl1, "WATER GAP", 652, y - 30, 40, C.sky); pop(tl1, a + 0.2 * d);
        const dx = 600 + 1.25 * mpx * 0.6, dp = E("g", {}, g); E("rect", { x: dx, y, width: 4.5 * mpx * 1.5, height: 110, rx: 14, fill: GRL, stroke: C.white, "stroke-width": 5 }, dp); T(dp, "GRAPHITE DISPLACER", dx + 4.5 * mpx * 0.75, y + 72, 50, C.navyD, { sw: 0 }); pop(dp, a + 0.3 * d);
        E("line", { x1: dx, y1: y + 160, x2: dx + 4.5 * mpx * 1.5, y2: y + 160, stroke: C.yellow, "stroke-width": 6 }, g); pop(label(g, "ABOUT 4.5 M", dx + 4.5 * mpx * 0.75, y + 230, 56, C.yellow), a + 0.45 * d);
        pop(label(g, "JOB: KEEP WATER OUT OF THE EMPTY CHANNEL", 840, 720, 54, C.white), a + 0.65 * d);
      }
      // 46: fully withdrawn: 1.25 m of water at the bottom of the core
      { const [g, a, d, B] = bt(46);
        const rc = rodChannel(g, 700, 100, 90, 130);
        label(g, "CORE TOP", 360, 120, 44, C.mute); label(g, "CORE BOTTOM", 360, 740, 44, C.mute);
        const k = E("g", {}, g); T(k, "1.25 M", 1080, 700, 66, C.yellow); T(k, "OF WATER", 1080, 760, 50, C.sky); arrowLine(k, 960, 690, 790, 690, C.yellow, 10); pop(k, a + 0.4 * d);
        label(g, "GRAPHITE", 1080, 420, 52, GRL); label(g, "BORON (ABOVE CORE)", 1180, 70, 44, C.white);
        upd(B, (t, u) => rc.set(0, u > 0.35 ? 0.6 + 0.4 * Math.sin((t - a) * 6) : 0));
      }
      // 47: the rod falls: graphite enters the bottom first
      { const [g, a, d, B] = bt(47);
        const rc = rodChannel(g, 700, 100, 90, 130);
        pop(label(g, "NOT BORON...", 1180, 300, 62, C.white), a + 0.2 * d); pop(label(g, "GRAPHITE FIRST", 1180, 400, 70, C.yellow), a + 0.45 * d);
        const wo = E("g", {}, g); arrowLine(wo, 790, 720, 940, 720, C.sky, 10); arrowLine(wo, 610, 720, 460, 720, C.sky, 10); T(wo, "WATER PUSHED OUT", 1180, 735, 50, C.sky);
        upd(B, (t, u) => { rc.set(1.25 * seg(u, 0.15, 0.8), 0.9); wo.setAttribute("opacity", u > 0.2 ? 1 : 0); });
      }
      // 48: all rods: power rises at the bottom
      { const [g, a, d, B] = bt(48);
        const c = core(g, 160, 110, 760, 580, { n: 9, rods: 0 });
        label(g, "TOP", 1200, 220, 52, C.white); label(g, "BOTTOM", 1200, 600, 52, C.white);
        const bt1 = E("rect", { x: 1330, y: 170, width: 0, height: 70, rx: 10, fill: C.sky }, g), bt2 = E("rect", { x: 1330, y: 550, width: 0, height: 70, rx: 10, fill: C.red }, g);
        label(g, "LOCAL POWER", 1460, 400, 46, C.mute);
        pop(label(g, "SHUTDOWN ADDS POWER", 840, 765, 58, C.red), a + 0.55 * d);
        upd(B, (t, u) => { const s = 1.25 * seg(u, 0.1, 0.85); c.set({ rods: s, bottom: s / 1.25, steam: 0.6, power: 0.2 + 0.2 * (s / 1.25), xenon: 0.7 }, t); bt1.setAttribute("width", 300 - 120 * s / 1.25); bt2.setAttribute("width", 120 + 200 * s / 1.25); });
      }
      // 49: the positive scram, seen at Ignalina in 1983
      { const [g, a, d, B] = bt(49);
        slam(label(g, "THE POSITIVE SCRAM", 840, 120, 100, C.red), a + 0.05 * d);
        E("line", { x1: 200, y1: 420, x2: 1480, y2: 420, stroke: C.white, "stroke-width": 8 }, g);
        const m1 = marker(g, 400, 400, 420, "1983", a + 0.3 * d, C.yellow, 70, -60); label(g, "SEEN AT IGNALINA", 400, 520, 50, C.white);
        const m2 = marker(g, 1280, 1280, 420, "1986", a + 0.55 * d, C.red, 70, -60); const l2 = label(g, "CHERNOBYL CREW: UNAWARE", 1200, 520, 50, C.white); pop(l2, a + 0.6 * d);
        void m1; void m2;
      }
      // 50: rods are slow: 18 seconds
      { const [g, a, d, B] = bt(50);
        const rc = rodChannel(g, 380, 90, 88, 110);
        const sec = label(g, "", 1120, 380, 200, C.yellow); label(g, "SECONDS TO FULLY INSERT", 1120, 470, 52, C.white);
        E("rect", { x: 720, y: 560, width: 800, height: 50, rx: 18, fill: "none", stroke: C.white, "stroke-width": 5 }, g); const pb = E("rect", { x: 726, y: 566, width: 0, height: 38, rx: 14, fill: C.yellow }, g);
        upd(B, (t, u) => { const s = 18 * seg(u, 0.05, 0.9); sec.textContent = String(Math.round(s)); pb.setAttribute("width", 788 * s / 18); rc.set(7 * s / 18); });
      }
      // 51: 01:23:43, above 530 MW and climbing
      { const [g, a, d, B] = bt(51);
        const ck = label(g, "01:23:43", 420, 120, 96, C.red); pop(ck, a + 0.05 * d);
        const mt = meter(g, 345, 220, 150, 420, 1200, { red: 520, fmt: () => "530+ MW" });
        const c = core(g, 820, 120, 700, 560, { n: 9 });
        pop(label(g, "MORE HEAT, MORE STEAM, MORE POWER", 840, 760, 52, C.yellow), a + 0.5 * d);
        upd(B, (t, u) => { const s = seg(u, 0.05, 0.95); mt.set(lerp(530, 1200, s)); c.set({ rods: 1.25 + 0.4 * s, steam: 0.7 + 0.3 * s, power: 0.4 + 0.6 * s, bottom: 0.9 }, t); });
      }
      // 52: channels rupture, rods stop short
      { const [g, a, d, B] = bt(52);
        const c = core(g, 200, 120, 760, 580, { n: 9 });
        const sg = E("polyline", { points: "", fill: "none", stroke: C.yellow, "stroke-width": 6 }, g); E("line", { x1: 1080, y1: 300, x2: 1600, y2: 300, stroke: C.mute, "stroke-width": 3 }, g);
        label(g, "SEVERE SHOCKS", 1340, 180, 56, C.yellow);
        pop(label(g, "CHANNELS RUPTURE", 1340, 500, 54, C.red), a + 0.3 * d); pop(label(g, "RODS STOP SHORT", 1340, 600, 54, C.white), a + 0.55 * d);
        upd(B, (t, u) => { c.set({ rods: 1.25 + 0.75 * seg(u, 0, 0.5), steam: 1, power: 1, bottom: 1, crack: seg(u, 0.2, 0.7) }, t); const sh = Math.sin((t - a) * 50) * 6 * u; c.g.setAttribute("transform", `translate(${sh},0)`);
          let p = ""; for (let i = 0; i <= 52; i++) { const x = 1080 + i * 10, amp = 10 + 110 * seg(u, 0.1, 0.6) * Math.abs(Math.sin(i * 1.7 + t * 9)); p += `${x},${300 + (i % 2 ? amp : -amp)} `; } sg.setAttribute("points", p); });
      }
      // 53: surge estimated ~100x full power, steam explosion
      { const [g, a, d, B] = bt(53);
        const one = E("g", {}, g); E("rect", { x: 260, y: 400, width: 40, height: 40, fill: C.yellow }, one); T(one, "NORMAL FULL POWER", 280, 520, 46, C.white); pop(one, a + 0.05 * d);
        const sq = []; for (let i = 0; i < 100; i++) sq.push(E("rect", { x: 700 + (i % 10) * 46, y: 190 + Math.floor(i / 10) * 46, width: 40, height: 40, fill: C.red, opacity: 0 }, g));
        label(g, "ABOUT 100 TIMES (ONE ESTIMATE)", 930, 720, 54, C.red);
        const bs = burst(g, 1460, 400, 200, C.yellow);
        const bl = label(g, "STEAM EXPLOSION", 1460, 680, 50, C.yellow);
        upd(B, (t, u) => { const n = Math.round(100 * seg(u, 0.1, 0.55)); sq.forEach((s, i) => s.setAttribute("opacity", i < n ? 1 : 0)); const e = seg(u, 0.65, 0.8); bs.setAttribute("opacity", e); bs.setAttribute("transform", `translate(1460,400) scale(${0.3 + 0.7 * e})`); bl.setAttribute("opacity", e); });
      }
      // 54: second explosion, the 1000-tonne plate thrown aside
      { const [g, a, d, B] = bt(54);
        const c = core(g, 520, 380, 640, 300, { n: 9 });
        const lid = E("g", {}, g); E("rect", { x: 480, y: 330, width: 720, height: 40, rx: 6, fill: C.mute, stroke: C.white, "stroke-width": 5 }, lid);
        const ll = label(g, "1000-TONNE PLATE", 1420, 470, 52, C.white);
        const b1 = burst(g, 840, 360, 160, C.yellow), b2 = burst(g, 840, 340, 230, "#FF8A3D");
        const n1 = label(g, "1", 640, 200, 80, C.yellow), n2 = label(g, "2", 1040, 200, 80, "#FF8A3D"); pop(label(g, "2-3 SECONDS APART", 840, 770, 50, C.white), a + 0.45 * d);
        pop(label(g, "OPEN TO THE SKY", 280, 600, 56, C.sky), a + 0.7 * d);
        upd(B, (t, u) => { const e1 = clamp(1 - Math.abs(u - 0.2) * 6), e2 = clamp(1 - Math.abs(u - 0.45) * 5); b1.setAttribute("opacity", e1); b2.setAttribute("opacity", e2); n1.setAttribute("opacity", u > 0.15 ? 1 : 0); n2.setAttribute("opacity", u > 0.4 ? 1 : 0);
          const l = seg(u, 0.42, 0.65); lid.setAttribute("transform", `translate(${260 * l},${-250 * l}) rotate(${35 * l} 840 350)`); c.set({ power: 0.9 * (1 - 0.5 * l), steam: 1, crack: 1, bottom: 0.6 }, t); ll.setAttribute("opacity", 1); });
      }
      // 55: graphite fire, about ten days
      { const [g, a, d, B] = bt(55);
        for (let i = 0; i < 18; i++) E("rect", { x: 300 + (i % 6) * 120, y: 520 + Math.floor(i / 6) * 70, width: 112, height: 62, fill: GR, stroke: GRL, "stroke-width": 4 }, g);
        const fl = [0, 1, 2, 3, 4, 5].map((i) => E("path", { d: "", fill: i % 2 ? C.red : "#FF8A3D", stroke: C.ink, "stroke-width": 4, opacity: 0.95 }, g));
        const pl = [0, 1, 2].map((i) => arrowLine(g, 500 + i * 160, 300, 540 + i * 160, 80, C.mute, 10));
        const day = label(g, "", 1350, 380, 120, C.yellow); label(g, "GRAPHITE FIRE", 1350, 500, 56, C.white);
        upd(B, (t, u) => { fl.forEach((p, i) => { const x = 330 + i * 120, h = 120 + 50 * Math.sin((t - a) * 7 + i * 1.3); p.setAttribute("d", `M${x},520 Q${x + 25},${520 - h * 0.6} ${x + 50},${520 - h} Q${x + 75},${520 - h * 0.5} ${x + 100},520 Z`); }); pl.forEach((p, i) => p.setAttribute("opacity", 0.4 + 0.4 * Math.sin((t - a) * 3 + i))); day.textContent = "DAY " + (1 + Math.floor(9.99 * seg(u, 0.1, 0.9))); });
      }
      // ===== CHAPTER 6 =====
      // 56: 1986: blame on the operators
      { const [g, a, d, B] = bt(56);
        chapter(g, a, 6, "WHAT REALLY CAUSED IT?");
        const sb = scaleBeam(g, 840, 360, 450, "OPERATORS", "DESIGN");
        pop(label(g, "1986 REPORT", 840, 300, 50, C.yellow), a + 0.3 * d);
        upd(B, (t, u) => sb(-14 * seg(u, 0.3, 0.7)));
      }
      // 57: 1992: INSAG-7
      { const [g, a, d, B] = bt(57);
        const doc = E("g", {}, g); E("path", { d: "M120,140 L420,140 L480,200 L480,560 L120,560 Z", fill: C.white, stroke: C.ink, "stroke-width": 5 }, doc); T(doc, "INSAG-7", 300, 260, 64, C.navyD, { sw: 0 }); T(doc, "1992", 300, 340, 56, C.red, { sw: 0 }); [400, 440, 480, 520].forEach((y) => E("line", { x1: 160, y1: y, x2: 440, y2: y, stroke: C.mute, "stroke-width": 8 }, doc)); pop(doc, a + 0.05 * d);
        label(g, "IAEA SAFETY ADVISORY GROUP", 300, 640, 44, C.white);
        const sb = scaleBeam(g, 1130, 300, 360, "OPERATORS", "DESIGN");
        upd(B, (t, u) => sb(lerp(-14, 6, seg(u, 0.3, 0.85))));
      }
      // 58: a combination of three
      { const [g, a, d, B] = bt(58);
        const cs = [[660, 330, "REACTOR", "PHYSICS", C.yellow], [1020, 330, "ROD", "DESIGN", C.red], [840, 560, "UNTESTED", "STATE", C.sky]];
        cs.forEach(([x, y, s1, s2, col], i) => { const k = E("g", {}, g); E("circle", { cx: x, cy: y, r: 230, fill: col, opacity: 0.22 }, k); E("circle", { cx: x, cy: y, r: 230, fill: "none", stroke: col, "stroke-width": 6 }, k);
          const ox = (x - 840) * 0.55, oy = (y - 410) * 0.75; T(k, s1, x + ox, y + oy - 10, 48, C.white); T(k, s2, x + ox, y + oy + 48, 48, col); pop(k, a + (0.08 + i * 0.15) * d); });
        pop(label(g, "ACCIDENT", 840, 430, 50, C.white), a + 0.65 * d);
      }
      // 59: the verdict
      { const [g, a, d, B] = bt(59);
        const q1 = E("g", {}, g); box(q1, 120, 110, 1440, 250, { stroke: C.yellow, sw: 8 }); T(q1, "MOST IMPORTANTLY: THE REACTOR'S PHYSICS", 840, 210, 56, C.white); T(q1, "MADE ITS UNSTABLE BEHAVIOUR POSSIBLE", 840, 290, 56, C.yellow); pop(q1, a + 0.05 * d);
        const q2 = E("g", {}, g); box(q2, 120, 430, 1440, 250, { stroke: C.white, sw: 6 }); T(q2, "BUT THE OPERATORS' CRITICAL ACTIONS:", 840, 530, 56, C.white); T(q2, "\"MOST ILL JUDGED\"", 840, 615, 64, C.red); pop(q2, a + 0.55 * d);
      }
      // 60: fixes: extra fixed absorbers, richer fuel
      { const [g, a, d, B] = bt(60);
        const c = core(g, 160, 120, 760, 580, { n: 9 });
        pop(label(g, "+80-90 FIXED ABSORBERS", 1290, 230, 52, C.green), a + 0.15 * d);
        pop(label(g, "FUEL: 2% TO 2.4% U-235", 1290, 360, 52, C.yellow), a + 0.4 * d);
        const vm = meter(g, 1215, 460, 150, 200, 100, { label: "STEAM EFFECT", fmt: () => "", red: 50, size: 40 });
        upd(B, (t, u) => { c.set({ fixed: seg(u, 0.15, 0.35), steam: 0.4, power: 0.3, rods: 2 }, t); vm.set(lerp(95, 30, seg(u, 0.45, 0.85))); });
      }
      // 61: bigger rod reserve, rods with no water column
      { const [g, a, d, B] = bt(61);
        label(g, "ROD RESERVE", 420, 90, 62, C.white);
        const b1 = E("rect", { x: 140, y: 170, width: 0, height: 80, rx: 12, fill: C.red }, g), b2 = E("rect", { x: 140, y: 320, width: 0, height: 80, rx: 12, fill: C.green }, g);
                const l1 = label(g, "8 (1986)", 760, 230, 50, C.red, { anchor: "start" }), l2 = label(g, "43-48 (NOW)", 760, 380, 50, C.green, { anchor: "start" }); pop(l1, a + 0.2 * d); pop(l2, a + 0.4 * d);
        const r1 = rodChannel(g, 1170, 130, 72, 100), r2 = rodChannel(g, 1500, 130, 72, 100, { dpLen: 5.75 });
        label(g, "OLD", 1170, 700, 46, C.white); label(g, "NEW", 1500, 700, 46, C.green);
        pop(label(g, "NO WATER COLUMN", 1335, 772, 50, C.yellow), a + 0.6 * d);
        upd(B, (t, u) => { b1.setAttribute("width", 600 * (8 / 48) * seg(u, 0.1, 0.3)); b2.setAttribute("width", 600 * seg(u, 0.3, 0.6)); r1.set(0, u > 0.6 ? 0.9 : 0); r2.set(0); });
      }
      // 62: faster: 18 s to 12 s; fast system 24 rods under 2.5 s
      { const [g, a, d, B] = bt(62);
        pop(label(g, "FULL INSERTION TIME", 840, 90, 64, C.white), a + 0.05 * d);
        const W = 1100 / 18, b1 = E("rect", { x: 380, y: 160, width: 0, height: 80, rx: 12, fill: C.red }, g), b2 = E("rect", { x: 380, y: 290, width: 0, height: 80, rx: 12, fill: C.yellow }, g), b3 = E("rect", { x: 380, y: 520, width: 0, height: 80, rx: 12, fill: C.green }, g);
        label(g, "BEFORE", 340, 220, 48, C.red, { anchor: "end" }); label(g, "AFTER", 340, 350, 48, C.yellow, { anchor: "end" }); label(g, "FAST SYSTEM", 340, 580, 46, C.green, { anchor: "end" });
        const t1 = label(g, "18 S", 0, 220, 50, C.white, { anchor: "start" }), t2 = label(g, "12 S", 0, 350, 50, C.white, { anchor: "start" }), t3 = label(g, "UNDER 2.5 S", 0, 580, 50, C.white, { anchor: "start" });
        pop(label(g, "+24 EXTRA RODS", 840, 720, 60, C.green), a + 0.7 * d);
        upd(B, (t, u) => { const w1 = W * 18 * seg(u, 0.1, 0.35), w2 = W * 12 * seg(u, 0.3, 0.5), w3 = W * 2.5 * seg(u, 0.55, 0.65); b1.setAttribute("width", w1); b2.setAttribute("width", w2); b3.setAttribute("width", w3);
          t1.setAttribute("x", 400 + w1); t2.setAttribute("x", 400 + w2); t3.setAttribute("x", 400 + w3); t1.setAttribute("opacity", u > 0.35 ? 1 : 0); t2.setAttribute("opacity", u > 0.5 ? 1 : 0); t3.setAttribute("opacity", u > 0.65 ? 1 : 0); });
      }
      // 63: a few modified RBMKs still run in Russia
      { const [g, a, d, B] = bt(63);
        pop(label(g, "MODIFIED RBMKS STILL RUNNING", 840, 100, 70, C.white), a + 0.05 * d);
        [["LENINGRAD", 400], ["SMOLENSK", 840], ["KURSK", 1280]].forEach(([s, x], i) => { const k = E("g", {}, g); const c = core(k, x - 150, 220, 300, 300, { n: 5, rods: 2 }); T(k, s, x, 640, 56, C.yellow); pop(k, a + (0.15 + i * 0.15) * d); upd(B, (t) => c.set({ steam: 0.4, power: 0.25 + 0.05 * Math.sin(t * 3 + i), fixed: 1, rods: 2 }, t)); });
        label(g, "RUSSIA", 840, 740, 48, C.mute);
      }
      // 64: wrap: a hidden flaw met a night of risky decisions
      { const [g, a, d, B] = bt(64);
        const k1 = E("g", {}, g); box(k1, 80, 150, 440, 200, { stroke: C.red }); T(k1, "HIDDEN DESIGN", 300, 235, 50, C.white); T(k1, "FLAW", 300, 305, 56, C.red); pop(k1, a + 0.05 * d);
        pop(label(g, "+", 600, 290, 110, C.white), a + 0.2 * d);
        const k2 = E("g", {}, g); box(k2, 680, 150, 440, 200, { stroke: C.yellow }); T(k2, "A NIGHT OF", 900, 235, 50, C.white); T(k2, "RISKY DECISIONS", 900, 305, 52, C.yellow); pop(k2, a + 0.25 * d);
        pop(label(g, "=", 1200, 290, 110, C.white), a + 0.4 * d);
        const btn = bigButton(g, 1440, 260, 110, "OFF"); pop(btn.k, a + 0.45 * d);
        pop(label(g, "THE OFF SWITCH BECAME THE TRIGGER", 840, 620, 74, C.yellow), a + 0.6 * d);
        upd(B, (t, u) => btn.press(seg(u, 0.55, 0.6)));
      }
