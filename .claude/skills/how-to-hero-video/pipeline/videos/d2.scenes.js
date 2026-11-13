      // ===== DOC d2: THE ANTIKYTHERA MECHANISM =====
      // ---- d2 helpers ----
      const W2 = 1680, H2 = 780, MX = 840;
      const BB = (i) => { const g = beat(i), B = BT[i]; return [g, B, B.a, B.b - B.a]; };
      const uOf = (B, t, u0 = 0, u1 = 1) => clamp(((t - B.a) / (B.b - B.a) - u0) / (u1 - u0));
      const live = (B, f) => U.push((t) => { if (!inR(t, B, 0.2)) return; f(t, t - B.a, clamp((t - B.a) / (B.b - B.a))); });
      const D2R = Math.PI / 180;
      // a real involute-looking spur gear; tooth 0 points along +x. Same module m => gears mesh at distance r1+r2.
      function gear(p, cx, cy, n, m, o = {}) {
        const r = (n * m) / 2, ra = r + m * 0.95, rd = r - 1.15 * m, st = TAU / n; let d = "";
        for (let i = 0; i < n; i++) {
          const a = i * st, pts = [[rd, a - st / 2], [rd, a - st * 0.27], [ra, a - st * 0.12], [ra, a + st * 0.12], [rd, a + st * 0.27]];
          pts.forEach(([rr, aa], k) => { d += (i || k ? "L" : "M") + (rr * Math.cos(aa)).toFixed(1) + "," + (rr * Math.sin(aa)).toFixed(1); });
        }
        d += "Z";
        const col = o.fill || C.yellow, hole = o.spokes && rd > 46, ri = rd - Math.max(9, r * 0.11);
        if (hole) d += ` M${ri.toFixed(1)},0 A${ri.toFixed(1)},${ri.toFixed(1)} 0 1 0 ${(-ri).toFixed(1)},0 A${ri.toFixed(1)},${ri.toFixed(1)} 0 1 0 ${ri.toFixed(1)},0 Z`;
        const G = E("g", { transform: `translate(${cx},${cy})` }, p), R = E("g", {}, G);
        E("path", { d, fill: col, "fill-rule": "evenodd", stroke: o.stroke || C.ink, "stroke-width": o.sw ?? 3, "stroke-linejoin": "round" }, R);
        if (hole) for (let k = 0; k < o.spokes; k++) { const a = (k * TAU) / o.spokes + TAU / o.spokes / 2; E("line", { x1: 0, y1: 0, x2: (ri + 3) * Math.cos(a), y2: (ri + 3) * Math.sin(a), stroke: col, "stroke-width": Math.max(10, r * 0.12), "stroke-linecap": "round" }, R); }
        else E("circle", { cx: r * 0.55, cy: 0, r: Math.max(4, r * 0.08), fill: C.navyD, opacity: 0.8 }, R);
        E("circle", { r: Math.max(7, r * 0.13), fill: o.hub || C.navyD, stroke: col, "stroke-width": 4 }, R);
        return { G, R, n, r, cx, cy, m, set(deg) { R.setAttribute("transform", `rotate(${deg.toFixed(2)})`); } };
      }
      // place a new gear meshing with A, in direction ang (degrees)
      function meshNew(A, n, ang, o) { const r = (n * A.m) / 2, a = ang * D2R; return gear(o?.p || A.G.parentNode, A.cx + (A.r + r) * Math.cos(a), A.cy + (A.r + r) * Math.sin(a), n, A.m, o); }
      // angle of driven gear B (teeth interleaved) given driver A at thA. Ratio = -nA/nB, exactly as real gears.
      function meshAng(A, B, thA) { const phi = Math.atan2(B.cy - A.cy, B.cx - A.cx) / D2R; return phi + 180 + 180 / B.n - (A.n / B.n) * (thA - phi); }
      // drive a train: list[0] = root gear; others [gear, parent, "m"|"c"] (mesh or coaxial)
      function drive(B, list, thFn) {
        live(B, (t, s, u) => { const ang = new Map(), th = thFn(t, s, u); ang.set(list[0], th); list[0].set(th);
          for (let k = 1; k < list.length; k++) { const [c, p, ty] = list[k]; const v = ty === "c" ? ang.get(p) : meshAng(p, c, ang.get(p)); ang.set(c, v); c.set(v); } });
      }
      const num = (g, x, y, size, col, B, fn, o) => { const e = label(g, "", x, y, size, col, o); live(B, (t, s, u) => { e.textContent = fn(u, s); }); return e; };
      // chapter title card for the first ~40% of a beat, then the body group fades in
      function chap(g, B, n, title) {
        const a = B.a, d = B.b - B.a, c = E("g", {}, g);
        const g1 = gear(c, 230, 400, 30, 12, { spokes: 5 }), g2 = meshNew(g1, 14, -35), g3 = gear(c, 1450, 400, 30, 12, { spokes: 5 }), g4 = meshNew(g3, 14, 215);
        drive(B, [g1, [g2, g1, "m"]], (t, s) => s * 40); drive(B, [g3, [g4, g3, "m"]], (t, s) => -s * 40);
        slam(label(c, "CHAPTER " + n, MX, 300, 70, C.yellow), a + 0.05);
        slam(label(c, title, MX, 470, title.length > 14 ? 120 : 150, C.white), a + 0.3);
        fadeOut(c, a + 0.4 * d, 0.35);
        const body = E("g", {}, g); fadeIn(body, a + 0.42 * d, 0.4); return body;
      }
      // timeline: years negative = BC
      function tline(g, y, x0, x1, y0, y1, ticks, o = {}) {
        const X = (yr) => x0 + ((yr - y0) / (y1 - y0)) * (x1 - x0);
        E("line", { x1: x0, y1: y, x2: x1, y2: y, stroke: C.white, "stroke-width": 7, "stroke-linecap": "round" }, g);
        (ticks || []).forEach((yr) => { E("line", { x1: X(yr), y1: y - 14, x2: X(yr), y2: y + 14, stroke: C.white, "stroke-width": 5 }, g); label(g, yr < 0 ? -yr + " BC" : yr === 0 ? "0" : (o.ad ? "AD " : "") + yr, X(yr), y + 62, 40, C.mute); });
        return X;
      }
      // corroded lump: rough blob with a hint of a gear
      function lump(p, x, y, s = 1, o = {}) {
        const k = E("g", { transform: `translate(${x},${y}) scale(${s})` }, p), R = rng(o.seed || 7); let d = "";
        for (let i = 0; i <= 26; i++) { const a = (i / 26) * TAU, rr = 150 + 30 * (R() - 0.5) + 18 * Math.sin(a * 3); d += (i ? "L" : "M") + (rr * 1.25 * Math.cos(a)).toFixed(1) + "," + (rr * 0.9 * Math.sin(a)).toFixed(1); }
        E("path", { d: d + "Z", fill: "#3F6B5C", stroke: C.ink, "stroke-width": 6, "stroke-linejoin": "round" }, k);
        for (let i = 0; i < 14; i++) E("circle", { cx: (R() - 0.5) * 300, cy: (R() - 0.5) * 210, r: 8 + R() * 20, fill: i % 2 ? "#2F5548" : "#5C8A6E", opacity: 0.8 }, k);
        if (o.gear) { const gg = gear(k, 30, 0, 40, 5, { spokes: 4, fill: "#B8923A" }); gg.G.setAttribute("opacity", 0.75); }
        return k;
      }
      // spiral dial (back of the mechanism): turns, cells
      function spiral(p, cx, cy, r0, r1, turns, cells, o = {}) {
        const k = E("g", {}, p), R = (th) => r0 + ((r1 - r0) * th) / (turns * TAU), A = (th) => th - Math.PI / 2; let d = "";
        for (let i = 0; i <= turns * 90; i++) { const th = (i / 90) * TAU; d += (i ? "L" : "M") + (cx + R(th) * Math.cos(A(th))).toFixed(1) + "," + (cy + R(th) * Math.sin(A(th))).toFixed(1); }
        const gw = ((r1 - r0) / turns) * 0.62;
        E("path", { d, fill: "none", stroke: o.col || C.yellow, "stroke-width": gw, "stroke-opacity": 0.28, "stroke-linecap": "round" }, k);
        E("path", { d, fill: "none", stroke: o.col || C.yellow, "stroke-width": 3 }, k);
        const per = cells / turns;
        for (let c = 0; c <= cells; c++) { const th = (c / per) * TAU, rr = R(th), a = A(th); E("line", { x1: cx + (rr - gw / 2) * Math.cos(a), y1: cy + (rr - gw / 2) * Math.sin(a), x2: cx + (rr + gw / 2) * Math.cos(a), y2: cy + (rr + gw / 2) * Math.sin(a), stroke: C.white, "stroke-width": 2, opacity: 0.7 }, k); }
        const ptr = E("line", { x1: cx, y1: cy, x2: cx, y2: cy - r1, stroke: C.red, "stroke-width": 8, "stroke-linecap": "round" }, k);
        const pin = E("circle", { cx, cy: cy - r0, r: gw * 0.45, fill: C.red, stroke: C.white, "stroke-width": 3 }, k);
        E("circle", { cx, cy, r: 12, fill: C.white }, k);
        const at = (month) => { const th = (month / per) * TAU, rr = R(th), a = A(th); return [cx + rr * Math.cos(a), cy + rr * Math.sin(a), a, rr]; };
        const setM = (month) => { const [x, y, a] = at(month); ptr.setAttribute("x2", cx + (r1 + 14) * Math.cos(a)); ptr.setAttribute("y2", cy + (r1 + 14) * Math.sin(a)); pin.setAttribute("cx", x); pin.setAttribute("cy", y); };
        setM(0.5);
        return { k, at, setM, gw };
      }
      // front dial: Egyptian calendar ring (365) + zodiac ring (360)
      function frontDial(p, cx, cy, R0, o = {}) {
        const k = E("g", {}, p);
        E("circle", { cx, cy, r: R0, fill: C.navyD, stroke: C.white, "stroke-width": 6 }, k);
        E("circle", { cx, cy, r: R0 * 0.8, fill: "none", stroke: C.white, "stroke-width": 4 }, k);
        E("circle", { cx, cy, r: R0 * 0.6, fill: "none", stroke: C.sky, "stroke-width": 4 }, k);
        for (let i = 0; i < 365; i += o.cal === false ? 400 : 1) { const a = (i / 365) * TAU - Math.PI / 2, big = i % 30 === 0 && i <= 360; E("line", { x1: cx + R0 * (big ? 0.8 : 0.93) * Math.cos(a), y1: cy + R0 * (big ? 0.8 : 0.93) * Math.sin(a), x2: cx + R0 * Math.cos(a), y2: cy + R0 * Math.sin(a), stroke: i >= 360 ? C.red : C.white, "stroke-width": big ? 4 : 1.5 }, k); }
        for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU - Math.PI / 2; E("line", { x1: cx + R0 * 0.6 * Math.cos(a), y1: cy + R0 * 0.6 * Math.sin(a), x2: cx + R0 * 0.8 * Math.cos(a), y2: cy + R0 * 0.8 * Math.sin(a), stroke: C.sky, "stroke-width": 3 }, k); }
        for (let i = 0; i < 360; i += 5) { const a = (i / 360) * TAU - Math.PI / 2; E("line", { x1: cx + R0 * 0.6 * Math.cos(a), y1: cy + R0 * 0.6 * Math.sin(a), x2: cx + R0 * 0.64 * Math.cos(a), y2: cy + R0 * 0.64 * Math.sin(a), stroke: C.sky, "stroke-width": 1.5 }, k); }
        const hand = (col, len, w, icon) => { const h = E("g", {}, k); E("line", { x1: 0, y1: 0, x2: 0, y2: -len, stroke: col, "stroke-width": w, "stroke-linecap": "round" }, h); if (icon === "sun") E("circle", { cx: 0, cy: -len * 0.82, r: 20, fill: C.yellow, stroke: C.ink, "stroke-width": 3 }, h); if (icon === "moon") E("circle", { cx: 0, cy: -len * 0.62, r: 17, fill: C.white, stroke: C.ink, "stroke-width": 3 }, h); return { h, set: (deg) => h.setAttribute("transform", `translate(${cx},${cy}) rotate(${deg.toFixed(2)})`) }; };
        E("circle", { cx, cy, r: 14, fill: C.white }, k);
        return { k, hand };
      }
      function ship(p, x, y, s = 1, col = C.white) {
        const k = E("g", { transform: `translate(${x},${y}) scale(${s})` }, p);
        E("path", { d: "M-120,0 L120,0 L90,46 L-95,46 Z", fill: C.navyD, stroke: col, "stroke-width": 7, "stroke-linejoin": "round" }, k);
        E("line", { x1: 0, y1: 0, x2: 0, y2: -150, stroke: col, "stroke-width": 7 }, k);
        E("path", { d: "M8,-140 L8,-20 L95,-20 Z", fill: col, opacity: 0.9 }, k);
        return k;
      }
      function amphora(p, x, y, s = 1, col = "#C9874A") {
        const k = E("g", { transform: `translate(${x},${y}) scale(${s})` }, p);
        E("path", { d: "M-10,-60 L10,-60 L12,-44 C40,-34 40,20 0,52 C-40,20 -40,-34 -12,-44 Z", fill: col, stroke: C.ink, "stroke-width": 4 }, k);
        E("path", { d: "M-12,-44 C-30,-50 -28,-30 -22,-24 M12,-44 C30,-50 28,-30 22,-24", fill: "none", stroke: col, "stroke-width": 5 }, k);
        return k;
      }
      function statue(p, x, y, s = 1, col = "#E8E4D8") {
        const k = E("g", { transform: `translate(${x},${y}) scale(${s})` }, p);
        E("rect", { x: -40, y: -10, width: 80, height: 30, fill: col, stroke: C.ink, "stroke-width": 4 }, k);
        E("path", { d: "M-22,-10 L-16,-110 L16,-110 L22,-10 Z", fill: col, stroke: C.ink, "stroke-width": 4 }, k);
        E("circle", { cx: 0, cy: -130, r: 20, fill: col, stroke: C.ink, "stroke-width": 4 }, k);
        return k;
      }
      function eclipse(p, x, y, r, B, u0, u1) {
        const k = E("g", {}, p); E("circle", { cx: x, cy: y, r: r * 1.5, fill: "url(#glowY)", opacity: 0.6 }, k); E("circle", { cx: x, cy: y, r, fill: C.yellow }, k);
        const m = E("circle", { cx: x - 2.4 * r, cy: y, r: r * 1.02, fill: C.ink, stroke: C.mute, "stroke-width": 3 }, k);
        live(B, (t, s, u) => m.setAttribute("cx", x + lerp(-2.4 * r, 0, ease(clamp((u - u0) / (u1 - u0))))));
        return k;
      }
      function moonPhase(p, cx, cy, r) {
        const k = E("g", {}, p); E("circle", { cx, cy, r, fill: "#1A1F3D", stroke: C.white, "stroke-width": 4 }, k);
        const lit = E("path", { d: "", fill: C.white }, k);
        const set = (ph) => { ph = ((ph % 1) + 1) % 1; const c = Math.cos(ph * TAU), rx = Math.abs(c * r).toFixed(1), right = ph < 0.5;
          lit.setAttribute("d", `M${cx},${cy - r} A${r},${r} 0 0 ${right ? 1 : 0} ${cx},${cy + r} A${rx},${r} 0 0 ${right ? (c > 0 ? 0 : 1) : (c > 0 ? 1 : 0)} ${cx},${cy - r} Z`); };
        set(0.25); return { k, set };
      }
      function bracket(g, x0, x1, y, col, txt, size = 44) { E("path", { d: `M${x0},${y + 18} L${x0},${y} L${x1},${y} L${x1},${y + 18}`, fill: "none", stroke: col, "stroke-width": 6 }, g); return label(g, txt, (x0 + x1) / 2, y - 18, size, col); }
      const tick = (g, x, y, r = 34) => checkMark(g, x, y, r);
      grad("d2trail", "linearGradient", { x1: 0, y1: 0, x2: 1, y2: 0 }, [[0, C.yellow], [0.55, C.yellow, 0.8], [1, C.yellow, 0]]);
      E("filter", { id: "blur6" }, defs).appendChild(document.createElementNS(NS, "feGaussianBlur")).setAttribute("stdDeviation", 6);

      // ===== beat 0: hook sits over it =====
      { const [g, B] = BB(0); const g1 = gear(g, 90, 690, 40, 9, { spokes: 4 }), g2 = meshNew(g1, 22, 5); const g3 = gear(g, 1590, 690, 40, 9, { spokes: 4 }), g4 = meshNew(g3, 22, 175);
        drive(B, [g1, [g2, g1, "m"]], (t, s) => s * 18); drive(B, [g3, [g4, g3, "m"]], (t, s) => -s * 18); }
      // 1: gears that predict eclipses
      { const [g, B, a, d] = BB(1);
        const b = gear(g, 470, 390, 64, 9, { spokes: 4 }), c = meshNew(b, 38, -25), e = meshNew(c, 24, 40);
        drive(B, [b, [c, b, "m"], [e, c, "m"]], (t, s) => s * 22);
        eclipse(g, 1320, 330, 110, B, 0.25, 0.75);
        pop(label(g, "A MACHINE OF GEARS", 470, 760, 56, C.white), a + 0.1 * d); pop(label(g, "PREDICTS ECLIPSES", 1320, 560, 60, C.yellow), a + 0.5 * d); }
      // 2: two thousand years old, a thousand-year gap
      { const [g, B, a, d] = BB(2);
        const X = tline(g, 450, 120, 1560, -300, 1500, [500, 1000, 1500], { ad: true });
        const m = gear(g, X(-100), 450, 16, 7); live(B, (t, s) => m.set(s * 60)); pop(m.G, a + 0.05 * d);
        pop(label(g, "ANTIKYTHERA", X(-100), 340, 52, C.yellow), a + 0.1 * d);
        const gap = E("rect", { x: X(-50), y: 425, width: 0, height: 50, rx: 12, fill: C.red, opacity: 0.85 }, g);
        live(B, (t, s, u) => gap.setAttribute("width", (X(1000) - X(-50)) * ease(clamp((u - 0.3) / 0.45))));
        pop(label(g, "NOTHING AS COMPLEX", X(470), 360, 56, C.white), a + 0.5 * d); pop(label(g, "FOR 1,000+ YEARS", X(470), 640, 64, C.red), a + 0.7 * d); }
      // 3: who and how
      { const [g, B, a, d] = BB(3);
        const l = lump(g, 840, 400, 1.3, { gear: true }); pop(l, a + 0.02 * d);
        pop(label(g, "WHO?", 290, 420, 150, C.yellow), a + 0.15 * d); pop(label(g, "HOW?", 1390, 420, 150, C.yellow), a + 0.55 * d); }
      // 4: title + gear train
      { const [g, B, a, d] = BB(4);
        slam(label(g, "THE ANTIKYTHERA", MX, 210, 110, C.white), a + 0.05 * d); slam(label(g, "MECHANISM", MX, 330, 110, C.yellow), a + 0.2 * d);
        const g1 = gear(g, 330, 560, 50, 6, { spokes: 4 }), g2 = meshNew(g1, 20, 0), g3 = meshNew(g2, 44, 0), g4 = meshNew(g3, 18, 0), g5 = meshNew(g4, 36, 0);
        drive(B, [g1, [g2, g1, "m"], [g3, g2, "m"], [g4, g3, "m"], [g5, g4, "m"]], (t, s) => s * 25);
        pop(label(g, "GEAR BY GEAR", MX, 760, 52, C.sky), a + 0.5 * d); }

      // ===== CHAPTER 1: THE WRECK =====
      { const [g, B, a, d] = BB(5); const body = chap(g, B, "ONE", "THE WRECK");
        const lon = (x) => 200 + (x - 21) * 190, lat = (y) => 60 + (38.5 - y) * 190;
        const poly = (pts, fill) => E("path", { d: "M" + pts.map(([x, y]) => lon(x).toFixed(0) + "," + lat(y).toFixed(0)).join(" L") + " Z", fill, stroke: C.white, "stroke-width": 4, "stroke-linejoin": "round" }, body);
        poly([[21.1, 38.3], [22.4, 38.2], [23.2, 37.9], [23.2, 37.6], [22.8, 37.3], [23.1, 36.45], [22.7, 36.8], [22.5, 36.4], [22.2, 36.9], [21.9, 36.75], [21.7, 37.0], [21.6, 37.5], [21.1, 37.8]], C.navyL);
        poly([[22.9, 38.5], [24.0, 38.4], [24.1, 37.7], [23.6, 37.95], [23.2, 38.1]], C.navyL);
        poly([[23.5, 35.55], [24.3, 35.6], [25.0, 35.45], [26.3, 35.3], [26.2, 35.05], [25.0, 35.0], [24.0, 35.2], [23.55, 35.25]], C.navyL);
        poly([[22.9, 36.35], [23.1, 36.3], [23.0, 36.15]], C.navyL);
        poly([[28.4, 37.6], [29.4, 37.6], [29.4, 36.6], [28.2, 36.7], [27.6, 36.95], [28.0, 37.1]], C.navyL);
        const AK = [lon(23.3), lat(35.87)], SY = [lon(27.84), lat(36.6)], ATH = [lon(23.73), lat(37.98)];
        E("circle", { cx: ATH[0], cy: ATH[1], r: 10, fill: C.white }, body); label(body, "ATHENS", ATH[0] + 120, ATH[1] + 14, 40, C.white);
        label(body, "CRETE", lon(24.9), lat(35.3) + 14, 40, C.mute);
        const path = E("path", { d: `M${SY[0]},${SY[1]} Q${(SY[0] + AK[0]) / 2},${AK[1] - 260} ${AK[0]},${AK[1]}`, fill: "none", stroke: C.yellow, "stroke-width": 6, "stroke-dasharray": "14 14" }, body);
        const sp = ship(body, SY[0], SY[1], 0.28, C.yellow); const L = path.getTotalLength();
        live(B, (t, s, u) => { const p = path.getPointAtLength(L * ease(clamp((u - 0.45) / 0.45))); sp.setAttribute("transform", `translate(${p.x},${p.y - 14}) scale(0.28)`); });
        E("circle", { cx: SY[0], cy: SY[1], r: 12, fill: C.white }, body); label(body, "SYMI", SY[0], SY[1] + 66, 48, C.white);
        const ak = E("circle", { cx: AK[0], cy: AK[1], r: 16, fill: C.red, stroke: C.white, "stroke-width": 4 }, body); label(body, "ANTIKYTHERA", AK[0] - 20, AK[1] + 70, 50, C.yellow);
        rings_(body, AK[0], AK[1], B); }
      function rings_(g, cx, cy, B) { const rs = [0, 1, 2].map(() => E("circle", { cx, cy, r: 20, fill: "none", stroke: C.red, "stroke-width": 5, opacity: 0 }, g));
        live(B, (t, s) => rs.forEach((c, k) => { const f = ((s * 0.6 + k / 3) % 1); c.setAttribute("r", 20 + f * 70); c.setAttribute("opacity", 0.8 * (1 - f)); })); }
      // 6: 45 m down, statues
      { const [g, B, a, d] = BB(6);
        E("rect", { x: 0, y: 120, width: W2, height: 660, fill: "#123A7A", opacity: 0.55 }, g);
        E("path", { d: wavePath(0, W2, 120, 8, 120, 0), fill: "none", stroke: C.sky, "stroke-width": 6 }, g);
        ship(g, 420, 72, 0.45);
        E("path", { d: "M0,700 Q300,660 600,690 T1200,680 T1680,690 L1680,780 L0,780 Z", fill: "#C9A36A", opacity: 0.9 }, g);
        statue(g, 900, 680, 1.0); amphora(g, 1080, 670, 1.0); amphora(g, 1160, 680, 0.9); statue(g, 1330, 690, 0.8, "#B8923A"); amphora(g, 760, 680, 0.8);
        const rope = E("line", { x1: 420, y1: 120, x2: 420, y2: 130, stroke: C.white, "stroke-width": 3, "stroke-dasharray": "8 6" }, g);
        const dv = E("g", {}, g); E("circle", { cx: 0, cy: 0, r: 26, fill: C.yellow, stroke: C.ink, "stroke-width": 4 }, dv); E("circle", { cx: 0, cy: 0, r: 12, fill: "#123A7A" }, dv);
        E("line", { x1: 0, y1: 26, x2: 0, y2: 90, stroke: C.white, "stroke-width": 12, "stroke-linecap": "round" }, dv);
        E("line", { x1: 0, y1: 90, x2: -20, y2: 140, stroke: C.white, "stroke-width": 10, "stroke-linecap": "round" }, dv); E("line", { x1: 0, y1: 90, x2: 20, y2: 140, stroke: C.white, "stroke-width": 10, "stroke-linecap": "round" }, dv);
        E("line", { x1: 0, y1: 45, x2: -30, y2: 80, stroke: C.white, "stroke-width": 9, "stroke-linecap": "round" }, dv); E("line", { x1: 0, y1: 45, x2: 30, y2: 80, stroke: C.white, "stroke-width": 9, "stroke-linecap": "round" }, dv);
        E("line", { x1: 140, y1: 140, x2: 140, y2: 680, stroke: C.white, "stroke-width": 5 }, g);
        const dep = num(g, 560, 420, 64, C.yellow, B, (u) => Math.round(45 * ease(clamp(u / 0.6))) + " M", { anchor: "start" });
        live(B, (t, s, u) => { const k = ease(clamp(u / 0.6)), y = 150 + 380 * k; dv.setAttribute("transform", `translate(${420 + 60 * Math.sin(s * 1.2)},${y})`); rope.setAttribute("y2", y); dep.setAttribute("y", y + 30); });
        pop(label(g, "BRONZE AND MARBLE STATUES", 1120, 330, 56, C.white), a + 0.55 * d); }
      // 7: Roman-era wreck, 70-60 BC
      { const [g, B, a, d] = BB(7);
        const X = tline(g, 640, 160, 1520, -200, 0, [-200, -150, -100, -50, 0]);
        E("rect", { x: X(-70), y: 620, width: X(-60) - X(-70), height: 40, fill: C.red }, g);
        pop(bracket(g, X(-70) - 30, X(-60) + 30, 560, C.red, "ABOUT 70-60 BC", 52), a + 0.5 * d);
        E("rect", { x: 300, y: 260, width: 1080, height: 4, fill: C.sky }, g);
        const sh = ship(g, 840, 250, 0.9); live(B, (t, s, u) => { const k = ease(clamp((u - 0.15) / 0.5)); sh.setAttribute("transform", `translate(840,${250 + 160 * k}) rotate(${-18 * k}) scale(0.9)`); sh.setAttribute("opacity", 1 - 0.6 * k); });
        pop(label(g, "A ROMAN-ERA SHIPWRECK", 840, 110, 64, C.yellow), a + 0.05 * d); }
      // 8: hauling it up, 1900-1901
      { const [g, B, a, d] = BB(8);
        E("rect", { x: 0, y: 330, width: W2, height: 450, fill: "#123A7A", opacity: 0.55 }, g); E("path", { d: wavePath(0, W2, 330, 8, 140, 0), fill: "none", stroke: C.sky, "stroke-width": 6 }, g);
        ship(g, 520, 282, 0.9); E("line", { x1: 580, y1: 160, x2: 760, y2: 120, stroke: C.white, "stroke-width": 9, "stroke-linecap": "round" }, g);
        const rope = E("line", { x1: 760, y1: 120, x2: 760, y2: 700, stroke: C.white, "stroke-width": 4 }, g);
        const cargo = E("g", {}, g); amphora(cargo, 0, 0, 1.0); statue(cargo, 70, 50, 0.6);
        live(B, (t, s, u) => { const y = lerp(700, 250, ease(clamp((u - 0.1) / 0.7))); cargo.setAttribute("transform", `translate(760,${y})`); rope.setAttribute("y2", y - 60); });
        pop(label(g, "1900-1901", 1270, 170, 110, C.yellow), a + 0.1 * d);
        pop(label(g, "ONE OF THE FIRST", 1270, 500, 56, C.white), a + 0.5 * d); pop(label(g, "UNDERWATER DIGS", 1270, 570, 56, C.white), a + 0.58 * d); }
      // 9: the lump
      { const [g, B, a, d] = BB(9);
        const l = lump(g, 560, 390, 1.35); pop(l, a + 0.1 * d);
        const bk = E("g", {}, g); E("rect", { x: 1060, y: 230, width: 300, height: 380, rx: 14, fill: "none", stroke: C.sky, "stroke-width": 6, "stroke-dasharray": "16 12" }, bk); E("line", { x1: 1090, y1: 230, x2: 1090, y2: 610, stroke: C.sky, "stroke-width": 5 }, bk);
        fadeIn(bk, a + 0.45 * d); pop(label(g, "LARGE DICTIONARY", 1210, 680, 48, C.sky), a + 0.55 * d);
        pop(label(g, "CORRODED BRONZE + WOOD", 560, 700, 56, C.yellow), a + 0.25 * d); pop(label(g, "IGNORED", 560, 110, 72, C.red), a + 0.15 * d); }
      // 10: museum in Athens
      { const [g, B, a, d] = BB(10);
        const mu = E("g", {}, g); E("path", { d: "M380,230 L840,90 L1300,230 Z", fill: C.navyL, stroke: C.white, "stroke-width": 6, "stroke-linejoin": "round" }, mu);
        for (let i = 0; i < 7; i++) E("rect", { x: 420 + i * 136, y: 250, width: 40, height: 330, fill: C.white, opacity: 0.85 }, mu);
        E("rect", { x: 360, y: 585, width: 960, height: 26, fill: C.white }, mu); fadeIn(mu, a);
        const spot = E("path", { d: "M640,250 L560,640 L760,640 Z", fill: C.yellow }, g); fadeTo(spot, a + 0.3 * d, 0.25);
        statue(g, 660, 600, 1.4); lump(g, 1100, 560, 0.35);
        pop(label(g, "ALL EYES ON THE STATUES", 660, 710, 48, C.yellow), a + 0.4 * d); pop(label(g, "THE LUMP WAITS", 1150, 710, 48, C.mute), a + 0.6 * d);
        label(g, "ATHENS", 840, 200, 52, C.white); }
      // 11: May 1902 - a gear
      { const [g, B, a, d] = BB(11);
        const L1 = E("g", {}, g), L2 = E("g", {}, g);
        const cp1 = E("clipPath", { id: "d2c1" }, defs); E("rect", { x: -400, y: -400, width: 400, height: 800 }, cp1);
        const cp2 = E("clipPath", { id: "d2c2" }, defs); E("rect", { x: 0, y: -400, width: 400, height: 800 }, cp2);
        const in1 = E("g", { "clip-path": "url(#d2c1)" }, L1); lump(in1, 0, 0, 1.3); const in2 = E("g", { "clip-path": "url(#d2c2)" }, L2); lump(in2, 0, 0, 1.3);
        const glow = E("circle", { cx: 840, cy: 400, r: 200, fill: "url(#glowY)" }, g); fadeTo(glow, a + 0.35 * d, 0.9, 0.5);
        const gg = gear(g, 840, 400, 40, 7, { spokes: 4, fill: "#D9A441" }); pop(gg.G, a + 0.35 * d, 0.5); live(B, (t, s) => gg.set(s * 8));
        g.appendChild(L1); g.appendChild(L2);
        live(B, (t, s, u) => { const k = ease(clamp((u - 0.2) / 0.3)) * 330; L1.setAttribute("transform", `translate(${840 - k},400) rotate(${-8 * k / 330})`); L2.setAttribute("transform", `translate(${840 + k},400) rotate(${8 * k / 330})`); });
        pop(label(g, "MAY 1902", 840, 110, 90, C.yellow), a + 0.05 * d); pop(label(g, "A GEAR WHEEL", 840, 720, 70, C.white), a + 0.55 * d);
        pop(label(g, "VALERIOS STAIS", 250, 400, 48, C.sky), a + 0.2 * d); }
      // 12: too complex to be ancient?
      { const [g, B, a, d] = BB(12);
        const X = tline(g, 560, 160, 1520, -500, 2000, [-500, 0, 500, 1000, 1500, 2000], { ad: true });
        const gg = gear(g, X(-100), 380, 26, 8, { spokes: 4 }); live(B, (t, s, u) => { const x = lerp(X(-100), X(1600), ease(clamp((u - 0.35) / 0.4))); gg.G.setAttribute("transform", `translate(${x},380)`); gg.set(s * 30); });
        pop(label(g, "TOO COMPLEX TO BE ANCIENT?", 840, 140, 72, C.red), a + 0.1 * d);
        pop(label(g, "SURELY IT IS LATER?", 1180, 700, 52, C.white), a + 0.55 * d); }
      // 13: fifty years in a museum
      { const [g, B, a, d] = BB(13);
        E("rect", { x: 540, y: 200, width: 600, height: 400, rx: 10, fill: "none", stroke: C.sky, "stroke-width": 6 }, g); lump(g, 840, 440, 0.8);
        E("rect", { x: 500, y: 600, width: 680, height: 50, fill: C.navyL, stroke: C.white, "stroke-width": 4 }, g);
        num(g, 840, 150, 110, C.yellow, B, (u) => String(Math.round(lerp(1902, 1951, ease(clamp((u - 0.1) / 0.75))))));
        const dust = []; const R = rng(5); for (let i = 0; i < 40; i++) dust.push(E("circle", { cx: 560 + R() * 560, cy: 220 + R() * 360, r: 2 + R() * 3, fill: C.white, opacity: 0 }, g));
        live(B, (t, s, u) => dust.forEach((c, k) => c.setAttribute("opacity", 0.5 * clamp(u * 1.6 - k / 40))));
        pop(label(g, "HALF A CENTURY", 840, 730, 60, C.white), a + 0.4 * d); }

      // ===== CHAPTER 2: THE OBSESSION =====
      { const [g, B, a, d] = BB(14); const body = chap(g, B, "TWO", "THE OBSESSION");
        lump(body, 620, 400, 1.2, { gear: true });
        const mg = E("g", {}, body); E("circle", { cx: 0, cy: 0, r: 120, fill: C.white, "fill-opacity": 0.12, stroke: C.yellow, "stroke-width": 14 }, mg); E("line", { x1: 85, y1: 85, x2: 190, y2: 190, stroke: C.yellow, "stroke-width": 26, "stroke-linecap": "round" }, mg);
        live(B, (t, s) => mg.setAttribute("transform", `translate(${620 + 120 * Math.cos(s * 0.9)},${380 + 60 * Math.sin(s * 1.3)})`));
        label(body, "DEREK DE SOLLA PRICE", 1240, 330, 60, C.yellow); label(body, "HISTORIAN OF SCIENCE", 1240, 410, 46, C.white); label(body, "1951", 1240, 540, 100, C.white); }
      // 15: 1959 an ancient Greek computer
      { const [g, B, a, d] = BB(15);
        const pg = E("g", {}, g); E("rect", { x: 520, y: 60, width: 640, height: 660, rx: 10, fill: "#EFE9DA", stroke: C.ink, "stroke-width": 6 }, pg);
        label(pg, "1959", 840, 150, 64, C.navy, { stroke: "none" });
        label(pg, "AN ANCIENT", 840, 280, 88, C.navyD, { stroke: "none" }); label(pg, "GREEK", 840, 380, 88, C.navyD, { stroke: "none" }); label(pg, "COMPUTER", 840, 480, 88, C.red, { stroke: "none" });
        for (let i = 0; i < 5; i++) E("rect", { x: 580, y: 530 + i * 32, width: i === 4 ? 300 : 520, height: 12, fill: C.mute, opacity: 0.6 }, pg);
        pop(pg, a + 0.05 * d, 0.45); const gg = gear(g, 1340, 400, 24, 9); live(B, (t, s) => gg.set(s * 30)); pop(gg.G, a + 0.4 * d); pop(label(g, "A MAGAZINE ARTICLE", 300, 400, 50, C.sky), a + 0.3 * d); }
      // 16: 1971 X-rays with Karakalos
      { const [g, B, a, d] = BB(16);
        E("rect", { x: 90, y: 300, width: 220, height: 180, rx: 16, fill: C.navyL, stroke: C.white, "stroke-width": 6 }, g); label(g, "X-RAY", 200, 410, 48, C.yellow);
        const beams = [-60, -30, 0, 30, 60].map((dy) => E("line", { x1: 310, y1: 390, x2: 1260, y2: 390 + dy * 3, stroke: C.yellow, "stroke-width": 5, "stroke-dasharray": "20 18", opacity: 0.7 }, g));
        live(B, (t, s) => beams.forEach((b) => b.setAttribute("stroke-dashoffset", -s * 120)));
        lump(g, 760, 390, 0.85);
        E("rect", { x: 1260, y: 160, width: 300, height: 460, fill: "#0A0F2A", stroke: C.white, "stroke-width": 6 }, g);
        const gh = gear(g, 1410, 390, 32, 7, { spokes: 4, fill: C.white }); gh.G.setAttribute("filter", "url(#blur6)"); fadeTo(gh.G, a + 0.35 * d, 0.8, 0.8);
        pop(label(g, "1971", 760, 110, 90, C.yellow), a + 0.05 * d); pop(label(g, "PRICE + KARAKALOS", 760, 700, 56, C.white), a + 0.4 * d); }
      // 17: counting teeth
      { const [g, B, a, d] = BB(17);
        const gg = gear(g, 620, 400, 38, 16, { spokes: 4 }); live(B, (t, s) => gg.set(-90));
        const hl = E("circle", { r: 18, fill: C.red, stroke: C.white, "stroke-width": 4 }, g);
        const cnt = num(g, 1260, 450, 200, C.yellow, B, (u) => String(Math.max(1, Math.ceil(38 * clamp((u - 0.05) / 0.8)))));
        live(B, (t, s, u) => { const k = Math.max(1, Math.ceil(38 * clamp((u - 0.05) / 0.8))) - 1, an = -90 * D2R + (k * TAU) / 38, rr = gg.r + 18; hl.setAttribute("cx", 620 + rr * Math.cos(an)); hl.setAttribute("cy", 400 + rr * Math.sin(an)); });
        label(g, "TEETH COUNTED", 1260, 560, 56, C.white); }
      // 18: Gears from the Greeks, main wheel once a year
      { const [g, B, a, d] = BB(18);
        const bk = E("g", {}, g); E("rect", { x: 100, y: 150, width: 420, height: 520, rx: 12, fill: C.navyL, stroke: C.white, "stroke-width": 6 }, bk);
        label(bk, "GEARS", 310, 330, 72, C.yellow); label(bk, "FROM THE", 310, 410, 56, C.white); label(bk, "GREEKS", 310, 490, 72, C.yellow); label(bk, "1974", 310, 610, 56, C.white); pop(bk, a + 0.05 * d);
        const w = gear(g, 1060, 390, 90, 6, { spokes: 4 }); live(B, (t, s, u) => w.set(360 * ease(clamp((u - 0.3) / 0.6))));
        const mo = num(g, 1060, 405, 64, C.white, B, (u) => "MONTH " + Math.max(1, Math.ceil(12 * ease(clamp((u - 0.3) / 0.6)))));
        pop(label(g, "1 TURN = 1 YEAR", 1060, 770, 60, C.yellow), a + 0.4 * d); }
      // 19: 38 and 127
      { const [g, B, a, d] = BB(19);
        const g38 = gear(g, 340, 360, 38, 9), g127 = gear(g, 1180, 360, 127, 4.4, { spokes: 4 });
        live(B, (t, s) => { g38.set(s * 40); g127.set(-s * 40 * 38 / 127); });
        const ar = arrowLine(g, 560, 360, 860, 360, C.white, 8); E("line", { x1: 560, y1: 360, x2: 840, y2: 360, stroke: C.navy, "stroke-width": 12, "stroke-dasharray": "2 22" }, ar); fadeIn(ar, a + 0.35 * d);
        label(g, "38 TEETH", 340, 640, 64, C.yellow); pop(label(g, "= 2 X 19", 340, 720, 56, C.white), a + 0.2 * d);
        pop(label(g, "127 TEETH", 1180, 690, 64, C.yellow), a + 0.45 * d); pop(label(g, "= HALF OF 254", 1180, 765, 56, C.white), a + 0.62 * d); }
      // 20: 254 laps in 19 years
      { const [g, B, a, d] = BB(20);
        E("circle", { cx: 520, cy: 390, r: 300, fill: "none", stroke: C.sky, "stroke-width": 3, "stroke-dasharray": "8 10" }, g);
        E("circle", { cx: 520, cy: 390, r: 70, fill: "#3B7BD9", stroke: C.white, "stroke-width": 5 }, g);
        const mn = E("circle", { r: 30, fill: C.white, stroke: C.ink, "stroke-width": 4 }, g);
        const span = (u) => ease(clamp((u - 0.1) / 0.8));
        live(B, (t, s, u) => { const laps = 254 * span(u), an = laps * TAU - Math.PI / 2; mn.setAttribute("cx", 520 + 300 * Math.cos(an)); mn.setAttribute("cy", 390 + 300 * Math.sin(an)); });
        num(g, 1240, 260, 120, C.yellow, B, (u) => String(Math.round(19 * span(u)))); label(g, "YEARS", 1240, 330, 52, C.white);
        num(g, 1240, 530, 120, C.white, B, (u) => String(Math.round(254 * span(u)))); label(g, "MOON LAPS", 1240, 600, 52, C.white);
        pop(label(g, "254 LAPS IN 19 YEARS", 1240, 740, 52, C.yellow), a + 0.75 * d); }
      // 21: blurry, 82 fragments
      { const [g, B, a, d] = BB(21);
        const R = rng(82), fr = [];
        for (let i = 0; i < 82; i++) { const s = i < 7 ? 26 + R() * 14 : 7 + R() * 10; let p = ""; for (let k = 0; k < 6; k++) { const an = (k / 6) * TAU + R() * 0.6, rr = s * (0.7 + R() * 0.5); p += (k ? "L" : "M") + (rr * Math.cos(an)).toFixed(1) + "," + (rr * Math.sin(an)).toFixed(1); }
          const e = E("path", { d: p + "Z", fill: i % 3 ? "#3F6B5C" : "#5C8A6E", stroke: C.ink, "stroke-width": 2 }, g); fr.push([e, (R() - 0.5) * 900, (R() - 0.5) * 560, R() * 360]); }
        live(B, (t, s, u) => { const k = ease(clamp((u - 0.1) / 0.5)); fr.forEach(([e, x, y, r]) => e.setAttribute("transform", `translate(${580 + x * k},${400 + y * k}) rotate(${r * k})`)); });
        num(g, 1350, 380, 160, C.yellow, B, (u) => String(Math.round(82 * clamp((u - 0.1) / 0.5)))); label(g, "FRAGMENTS", 1350, 470, 64, C.white);
        pop(label(g, "STILL A RIDDLE", 1350, 640, 60, C.red), a + 0.65 * d); }
      // 22: see through solid bronze
      { const [g, B, a, d] = BB(22);
        E("rect", { x: 540, y: 150, width: 600, height: 460, rx: 30, fill: "#7A5A2A", stroke: C.ink, "stroke-width": 6 }, g);
        const hid = gear(g, 840, 380, 30, 9, { spokes: 4 }); fadeTo(hid.G, a + 0.4 * d, 0.35, 0.8); live(B, (t, s) => hid.set(s * 15));
        const eye = E("g", {}, g); E("path", { d: "M-110,0 Q0,-80 110,0 Q0,80 -110,0 Z", fill: C.white, stroke: C.ink, "stroke-width": 5 }, eye); E("circle", { r: 34, fill: C.navy }, eye); E("circle", { r: 14, fill: C.ink }, eye);
        eye.setAttribute("transform", "translate(250,380)"); pop(eye, a + 0.1 * d);
        pop(label(g, "SEE THROUGH BRONZE?", 840, 720, 72, C.yellow), a + 0.3 * d); }

      // ===== CHAPTER 3: X-RAY VISION =====
      { const [g, B, a, d] = BB(23); const body = chap(g, B, "THREE", "X-RAY VISION");
        label(body, "2005", 840, 300, 160, C.yellow); label(body, "ANTIKYTHERA MECHANISM", 840, 460, 64, C.white); label(body, "RESEARCH PROJECT", 840, 540, 64, C.white);
        label(body, "NEW TOOLS COME TO ATHENS", 840, 700, 48, C.sky); }
      // 24: 3D X-ray CT
      { const [g, B, a, d] = BB(24);
        E("rect", { x: 80, y: 290, width: 240, height: 200, rx: 16, fill: C.navyL, stroke: C.white, "stroke-width": 6 }, g); label(g, "X-RAYS", 200, 410, 50, C.yellow);
        const cone = E("path", { d: "M320,390 L1260,170 L1260,610 Z", fill: C.yellow }, g); fadeTo(cone, a + 0.1 * d, 0.18);
        const tt = E("g", {}, g); lump(tt, 0, 0, 0.75, { seed: 11 });
        E("ellipse", { cx: 790, cy: 540, rx: 170, ry: 30, fill: C.navyL, stroke: C.white, "stroke-width": 5 }, g);
        live(B, (t, s) => tt.setAttribute("transform", `translate(790,390) scale(${Math.cos(s * 1.4).toFixed(3)},1)`));
        E("rect", { x: 1260, y: 150, width: 60, height: 480, fill: C.sky, stroke: C.white, "stroke-width": 5 }, g);
        const st = [0, 1, 2, 3, 4].map((k) => E("rect", { x: 1380 + k * 20, y: 230 - k * 20, width: 200, height: 260, fill: C.navyD, stroke: C.sky, "stroke-width": 4, opacity: 0 }, g));
        st.forEach((e, k) => fadeIn(e, a + (0.3 + 0.1 * k) * d));
        pop(label(g, "3D X-RAY SCANS", 840, 110, 80, C.yellow), a + 0.05 * d); pop(label(g, "A PROTOTYPE MACHINE", 840, 730, 52, C.white), a + 0.45 * d); }
      // 25: lighting reveals faint letters
      { const [g, B, a, d] = BB(25);
        E("rect", { x: 330, y: 250, width: 1020, height: 340, rx: 14, fill: "#4E7B66", stroke: C.ink, "stroke-width": 6 }, g);
        const words = ["KAI TO", "MHNA", "TH", "AXIS", "KATA", "MENH"], tx = [];
        words.forEach((w, i) => tx.push(label(g, w, 470 + (i % 3) * 370, 390 + Math.floor(i / 3) * 120, 72, "#4E7B66", { stroke: C.ink, sw: 4 })));
        const lamp = E("g", {}, g); E("circle", { r: 40, fill: C.yellow }, lamp); E("circle", { r: 80, fill: "url(#glowY)" }, lamp);
        live(B, (t, s, u) => { const an = s * 1.6, lx = 840 + 640 * Math.cos(an), ly = 140 + 30 * Math.sin(an); lamp.setAttribute("transform", `translate(${lx},${ly})`);
          tx.forEach((e) => { e.setAttribute("stroke-width", 2 + 6 * clamp((u - 0.15) / 0.4)); e.setAttribute("fill", u > 0.35 ? C.white : "#4E7B66"); e.setAttribute("stroke", C.ink); }); });
        pop(label(g, "FAINT LETTERS STAND OUT", 840, 720, 64, C.yellow), a + 0.45 * d); }
      // 26: slice by slice
      { const [g, B, a, d] = BB(26);
        const cp = E("clipPath", { id: "d2scan" }, defs), cr = E("rect", { x: 300, y: 120, width: 1080, height: 0 }, cp);
        E("rect", { x: 300, y: 120, width: 1080, height: 560, rx: 30, fill: "#3F6B5C", stroke: C.ink, "stroke-width": 6 }, g);
        const inn = E("g", { "clip-path": "url(#d2scan)" }, g); E("rect", { x: 300, y: 120, width: 1080, height: 560, rx: 30, fill: "#0A0F2A" }, inn);
        const ga = gear(inn, 640, 400, 54, 8, { spokes: 4 }), gb = meshNew(ga, 24, -10, { p: inn }), gc = meshNew(gb, 40, 30, { p: inn });
        drive(B, [ga, [gb, ga, "m"], [gc, gb, "m"]], (t, s) => s * 14);
        const ln = E("line", { x1: 280, y1: 120, x2: 1400, y2: 120, stroke: C.yellow, "stroke-width": 8 }, g);
        live(B, (t, s, u) => { const y = 120 + 560 * ease(clamp((u - 0.1) / 0.6)); cr.setAttribute("height", y - 120); ln.setAttribute("y1", y); ln.setAttribute("y2", y); });
        pop(label(g, "HIDDEN GEARS APPEAR", 840, 760, 64, C.yellow), a + 0.6 * d); }
      // 27: thousands of letters
      { const [g, B, a, d] = BB(27);
        const R = rng(27), al = "ABEHIKMNOPTXYZ", ch = [];
        for (let r = 0; r < 9; r++) for (let c = 0; c < 30; c++) { const e = label(g, al[Math.floor(R() * al.length)], 160 + c * 47, 120 + r * 58, 44, C.white, { sw: 3 }); ch.push(e); }
        ch.forEach((e, i) => { e.setAttribute("opacity", 0); });
        live(B, (t, s, u) => { const n = Math.floor(ch.length * ease(clamp((u - 0.05) / 0.6))); ch.forEach((e, i) => e.setAttribute("opacity", i < n ? 0.85 : 0)); });
        pop(label(g, "THOUSANDS OF HIDDEN LETTERS", 840, 700, 72, C.yellow), a + 0.5 * d); }
      // 28: Nature 2006, "spiral divided into 235 sections"
      { const [g, B, a, d] = BB(28);
        label(g, "NATURE, 2006", 420, 120, 72, C.yellow);
        const q = E("g", {}, g); E("rect", { x: 80, y: 220, width: 720, height: 380, rx: 18, fill: C.navyD, stroke: C.yellow, "stroke-width": 6 }, q);
        label(q, "“SPIRAL", 440, 340, 80, C.white); label(q, "DIVIDED INTO", 440, 440, 80, C.white); label(q, "235 SECTIONS”", 440, 540, 80, C.yellow); pop(q, a + 0.4 * d, 0.4);
        const sp = spiral(g, 1240, 400, 90, 330, 5, 235); live(B, (t, s, u) => sp.setM(235 * ease(clamp((u - 0.45) / 0.5)))); }
      // 29: 30 gears + eclipses
      { const [g, B, a, d] = BB(29); const gs = [];
        for (let i = 0; i < 30; i++) { const gg = gear(g, 130 + (i % 10) * 105, 180 + Math.floor(i / 10) * 125, 12 + (i * 7) % 14, 5.5); gs.push(gg); pop(gg.G, a + (0.05 + i * 0.015) * d, 0.25); }
        live(B, (t, s) => gs.forEach((gg, i) => gg.set((i % 2 ? -1 : 1) * s * 40)));
        num(g, 600, 650, 110, C.yellow, B, (u) => Math.min(30, Math.floor(clamp((u - 0.05) / 0.45) * 31)) + " GEARS");
        eclipse(g, 1420, 330, 110, B, 0.45, 0.85); pop(label(g, "SUN + MOON ECLIPSES", 1420, 560, 52, C.white), a + 0.55 * d); }
      // 30: lettering dates it
      { const [g, B, a, d] = BB(30);
        const X = tline(g, 520, 140, 1540, -250, 0, [-250, -200, -150, -100, -50, 0]);
        const bar = E("rect", { x: X(-150), y: 495, width: 0, height: 50, rx: 10, fill: C.yellow }, g);
        live(B, (t, s, u) => bar.setAttribute("width", (X(-100) - X(-150)) * ease(clamp((u - 0.2) / 0.3))));
        pop(label(g, "BUILT ABOUT 150-100 BC", X(-125), 420, 56, C.yellow), a + 0.45 * d);
        E("rect", { x: X(-70), y: 495, width: X(-60) - X(-70), height: 50, fill: C.red }, g); pop(label(g, "WRECK", X(-65), 680, 48, C.red), a + 0.6 * d);
        pop(label(g, "DATED BY THE LETTERING", 840, 140, 72, C.white), a + 0.05 * d); }
      // 31: open the box
      { const [g, B, a, d] = BB(31);
        const gi = gear(g, 720, 470, 40, 6, { spokes: 4 }), gj = meshNew(gi, 20, 10), gk = meshNew(gj, 30, -50);
        drive(B, [gi, [gj, gi, "m"], [gk, gj, "m"]], (t, s) => s * 30);
        E("rect", { x: 480, y: 300, width: 720, height: 360, fill: "none", stroke: "#B8814A", "stroke-width": 14 }, g);
        const lid = E("rect", { x: 480, y: 300, width: 720, height: 360, fill: "#8A5A2B", stroke: C.ink, "stroke-width": 6 }, g);
        live(B, (t, s, u) => { const k = ease(clamp((u - 0.3) / 0.35)); lid.setAttribute("transform", `translate(${-560 * k},${120 * k}) rotate(${-12 * k} 480 300)`); lid.setAttribute("opacity", 1 - 0.85 * k); });
        pop(label(g, "LET'S OPEN IT UP", 840, 140, 90, C.yellow), a + 0.55 * d); }

      // ===== CHAPTER 4: GEAR BY GEAR =====
      { const [g, B, a, d] = BB(32); const body = chap(g, B, "FOUR", "GEAR BY GEAR");
        E("rect", { x: 520, y: 180, width: 560, height: 440, rx: 16, fill: "#8A5A2B", stroke: C.ink, "stroke-width": 6 }, body);
        const fd = frontDial(body, 800, 400, 180, { cal: false });
        const cr = E("g", {}, body); E("line", { x1: 0, y1: 0, x2: 0, y2: -170, stroke: C.white, "stroke-width": 16, "stroke-linecap": "round", "stroke-dasharray": "14 10" }, cr); E("circle", { cx: 0, cy: -170, r: 20, fill: C.white, opacity: 0.6 }, cr);
        E("circle", { cx: 1080, cy: 400, r: 22, fill: C.red, stroke: C.white, "stroke-width": 5 }, body);
        live(B, (t, s) => cr.setAttribute("transform", `translate(1080,400) rotate(${s * 90})`));
        label(body, "HAND CRANK (LOST)", 1370, 330, 52, C.yellow); label(body, "SOCKET SURVIVES", 1370, 640, 48, C.red); }
      // 33: the big four-spoked wheel, once a year
      { const [g, B, a, d] = BB(33);
        const b1 = gear(g, 640, 400, 223, 2.9, { spokes: 4 }); live(B, (t, s, u) => b1.set(360 * u * 0.5));
        const ru = E("g", {}, g); E("line", { x1: 640 - b1.r, y1: 758, x2: 640 + b1.r, y2: 758, stroke: C.white, "stroke-width": 6 }, ru);
        [640 - b1.r, 640 + b1.r].forEach((x) => E("line", { x1: x, y1: 740, x2: x, y2: 776, stroke: C.white, "stroke-width": 6 }, ru)); fadeIn(ru, a + 0.3 * d);
        pop(label(g, "ABOUT 13 CM ACROSS", 1320, 640, 56, C.sky), a + 0.35 * d);
        pop(label(g, "4 SPOKES", 1320, 230, 64, C.white), a + 0.15 * d); pop(label(g, "ABOUT 223 TEETH", 1320, 340, 64, C.white), a + 0.3 * d); pop(label(g, "1 TURN = 1 YEAR", 1320, 500, 80, C.yellow), a + 0.5 * d); }
      // 34: one crank turn = about 78 days
      { const [g, B, a, d] = BB(34);
        const fd = frontDial(g, 1060, 400, 330); const dp = fd.hand(C.yellow, 300, 9, "sun");
        const cr = E("g", {}, g); E("circle", { r: 120, fill: "none", stroke: C.white, "stroke-width": 4, "stroke-dasharray": "6 10" }, cr); E("line", { x1: 0, y1: 0, x2: 0, y2: -120, stroke: C.white, "stroke-width": 16, "stroke-linecap": "round" }, cr); E("circle", { cx: 0, cy: -120, r: 24, fill: C.red, stroke: C.white, "stroke-width": 5 }, cr); E("circle", { r: 16, fill: C.white }, cr);
        const turns = (u) => 3 * ease(clamp((u - 0.1) / 0.75));
        live(B, (t, s, u) => { cr.setAttribute("transform", `translate(330,370) rotate(${turns(u) * 360})`); dp.set((turns(u) * 78 / 365) * 360); });
        num(g, 330, 610, 64, C.white, B, (u) => "TURNS: " + turns(u).toFixed(1));
        num(g, 330, 700, 64, C.yellow, B, (u) => "DAYS: " + Math.round(turns(u) * 78));
        pop(label(g, "1 TURN = ABOUT 78 DAYS", 330, 140, 56, C.yellow), a + 0.05 * d); }
      // 35: 365-day calendar
      { const [g, B, a, d] = BB(35);
        const fd = frontDial(g, 560, 400, 360); const dp = fd.hand(C.yellow, 340, 8, "sun");
        live(B, (t, s, u) => dp.set(360 * ease(clamp((u - 0.05) / 0.85))));
        num(g, 1300, 300, 120, C.yellow, B, (u) => "DAY " + Math.max(1, Math.round(365 * ease(clamp((u - 0.05) / 0.85)))));
        pop(label(g, "12 MONTHS X 30 DAYS", 1300, 450, 60, C.white), a + 0.3 * d); pop(label(g, "+ 5 EXTRA DAYS", 1300, 540, 60, C.red), a + 0.5 * d);
        pop(label(g, "= 365", 1300, 670, 90, C.yellow), a + 0.65 * d); }
      // 36: zodiac ring, 360 degrees
      { const [g, B, a, d] = BB(36);
        const fd = frontDial(g, 560, 400, 360); const band = E("circle", { cx: 560, cy: 400, r: 252, fill: "none", stroke: C.sky, "stroke-width": 72 }, g); fadeTo(band, a + 0.15 * d, 0.35, 0.5);
        const sh = fd.hand(C.yellow, 330, 7, "sun"), mh = fd.hand(C.white, 300, 5, "moon");
        live(B, (t, s) => { sh.set(s * 8); mh.set(40 + s * 8 * 13.37); });
        pop(label(g, "ZODIAC", 1300, 300, 110, C.sky), a + 0.2 * d); pop(label(g, "THE PATH OF SUN AND MOON", 1300, 420, 50, C.white), a + 0.4 * d); pop(label(g, "360 DEGREES", 1300, 560, 80, C.yellow), a + 0.6 * d); }
      // 37: Sun once a year, Moon 13+ laps
      { const [g, B, a, d] = BB(37);
        const fd = frontDial(g, 560, 400, 360); const sh = fd.hand(C.yellow, 330, 8, "sun"), mh = fd.hand(C.white, 300, 6, "moon");
        const yr = (u) => ease(clamp((u - 0.08) / 0.85));
        live(B, (t, s, u) => { sh.set(360 * yr(u)); mh.set(360 * yr(u) * 254 / 19); });
        num(g, 1300, 280, 80, C.yellow, B, (u) => "SUN: " + yr(u).toFixed(2) + " LAPS");
        num(g, 1300, 420, 80, C.white, B, (u) => "MOON: " + (yr(u) * 254 / 19).toFixed(1) + " LAPS");
        pop(label(g, "PER YEAR: 254 / 19 = 13.37", 1300, 600, 52, C.sky), a + 0.65 * d); }
      // 38: moon-phase ball
      { const [g, B, a, d] = BB(38);
        const mp = moonPhase(g, 520, 390, 230); live(B, (t, s, u) => mp.set(0.02 + 0.96 * ease(clamp((u - 0.05) / 0.85))));
        const sm = [0.0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875].map((ph, i) => { const m = moonPhase(g, 1000 + (i % 4) * 160, 300 + Math.floor(i / 4) * 170, 60); m.set(ph); pop(m.k, a + (0.2 + i * 0.06) * d); return m; });
        pop(label(g, "HALF WHITE, HALF BLACK", 1240, 640, 56, C.white), a + 0.25 * d); pop(label(g, "SHOWS THE MOON'S PHASE", 1240, 730, 56, C.yellow), a + 0.5 * d); }
      // 39: flip to the back: two spirals
      { const [g, B, a, d] = BB(39);
        const fr = E("g", {}, g); E("rect", { x: -300, y: -340, width: 600, height: 680, rx: 18, fill: "#8A5A2B", stroke: C.ink, "stroke-width": 6 }, fr); frontDial(fr, 0, 0, 230, { cal: false });
        const bk = E("g", {}, g); E("rect", { x: -300, y: -340, width: 600, height: 680, rx: 18, fill: "#8A5A2B", stroke: C.ink, "stroke-width": 6 }, bk);
        spiral(bk, 0, -165, 40, 150, 5, 235); spiral(bk, 0, 175, 40, 150, 4, 223, { col: C.sky });
        live(B, (t, s, u) => { const k = clamp((u - 0.15) / 0.35), sx = Math.cos(k * Math.PI); fr.setAttribute("transform", `translate(840,400) scale(${Math.max(0.001, sx).toFixed(3)},1)`); bk.setAttribute("transform", `translate(840,400) scale(${Math.max(0.001, -sx).toFixed(3)},1)`); });
        pop(label(g, "THE BACK", 300, 400, 90, C.yellow), a + 0.45 * d); pop(label(g, "TWO SPIRALS", 1380, 400, 80, C.white), a + 0.55 * d); }
      // 40: Metonic spiral
      { const [g, B, a, d] = BB(40);
        const sp = spiral(g, 500, 400, 70, 360, 5, 235); const mo = (u) => 235 * ease(clamp((u - 0.1) / 0.8)); live(B, (t, s, u) => sp.setM(mo(u)));
        num(g, 1260, 250, 110, C.yellow, B, (u) => "MONTH " + Math.max(1, Math.ceil(mo(u))));
        num(g, 1260, 380, 80, C.white, B, (u) => "TURN " + Math.min(5, Math.floor(mo(u) / 47) + 1) + " OF 5");
        pop(label(g, "METONIC CYCLE", 1260, 560, 72, C.sky), a + 0.4 * d); pop(label(g, "19 YEARS = 235 MONTHS", 1260, 650, 56, C.white), a + 0.55 * d); }
      // 41: the pin in the groove (zoom)
      { const [g, B, a, d] = BB(41);
        const sp = spiral(g, 840, 1100, 260, 1000, 5, 235); live(B, (t, s, u) => sp.setM(20 + 12 * ease(u)));
        const z = E("circle", { cx: 840, cy: 400, r: 0, fill: "none" }, g); void z;
        pop(label(g, "A PIN RIDES IN THE GROOVE", 840, 110, 72, C.yellow), a + 0.1 * d); pop(label(g, "LIKE A RECORD NEEDLE", 840, 200, 52, C.white), a + 0.4 * d); }
      // 42: Saros spiral
      { const [g, B, a, d] = BB(42);
        const sp = spiral(g, 500, 400, 80, 360, 4, 223, { col: C.sky }); const mo = (u) => 223 * ease(clamp((u - 0.1) / 0.8)); live(B, (t, s, u) => sp.setM(mo(u)));
        num(g, 1260, 250, 110, C.yellow, B, (u) => "MONTH " + Math.max(1, Math.ceil(mo(u))));
        num(g, 1260, 380, 80, C.white, B, (u) => "TURN " + Math.min(4, Math.floor(mo(u) / 55.75) + 1) + " OF 4");
        pop(label(g, "SAROS CYCLE", 1260, 560, 80, C.sky), a + 0.4 * d); pop(label(g, "ECLIPSE PREDICTOR", 1260, 650, 56, C.yellow), a + 0.55 * d); }
      // 43: an eclipse returns 223 months later
      { const [g, B, a, d] = BB(43);
        eclipse(g, 300, 330, 110, B, 0.0, 0.3); eclipse(g, 1380, 330, 110, B, 0.55, 0.85);
        const X = (u) => lerp(450, 1230, u); E("line", { x1: X(0), y1: 330, x2: X(1), y2: 330, stroke: C.white, "stroke-width": 4, "stroke-dasharray": "6 10" }, g);
        const dot = E("circle", { cx: X(0), cy: 330, r: 16, fill: C.yellow }, g); live(B, (t, s, u) => dot.setAttribute("cx", X(ease(clamp((u - 0.2) / 0.4)))));
        num(g, 840, 270, 80, C.yellow, B, (u) => Math.round(223 * ease(clamp((u - 0.2) / 0.4))) + " MONTHS");
        pop(label(g, "ABOUT 18 YEARS + 11 DAYS", 840, 620, 72, C.white), a + 0.6 * d); pop(label(g, "A VERY SIMILAR ECLIPSE", 840, 720, 52, C.sky), a + 0.7 * d); }
      // 44: 16 glyphs
      { const [g, B, a, d] = BB(44);
        const sp = spiral(g, 520, 400, 80, 360, 4, 223, { col: C.sky }); sp.setM(0.5);
        const R = rng(16), ms = []; for (let i = 0; i < 16; i++) ms.push(Math.floor(5 + i * 13.4 + R() * 6));
        ms.forEach((m, i) => { const [x, y] = sp.at(m + 0.5); const k = E("g", {}, g); E("rect", { x: x - 16, y: y - 16, width: 32, height: 32, rx: 6, fill: C.yellow, stroke: C.ink, "stroke-width": 3 }, k); E("circle", { cx: x, cy: y, r: 8, fill: C.ink }, k); pop(k, a + (0.15 + i * 0.035) * d, 0.25); });
        num(g, 1260, 330, 160, C.yellow, B, (u) => String(Math.min(16, Math.floor(clamp((u - 0.15) / 0.56) * 17))));
        label(g, "ECLIPSE GLYPHS", 1260, 430, 72, C.white); pop(label(g, "FOUND IN THE 2005 SCANS", 1260, 560, 48, C.sky), a + 0.6 * d); }
      // 45: Exeligmos: 3 Saros = 54 years
      { const [g, B, a, d] = BB(45);
        const cx = 560, cy = 400, R0 = 290;
        E("circle", { cx, cy, r: R0, fill: C.navyD, stroke: C.white, "stroke-width": 6 }, g);
        [0, 1, 2].forEach((k) => { const an = (k / 3) * TAU - Math.PI / 2; E("line", { x1: cx, y1: cy, x2: cx + R0 * Math.cos(an), y2: cy + R0 * Math.sin(an), stroke: C.white, "stroke-width": 5 }, g);
          const am = an + TAU / 6; label(g, ["0 H", "+8 H", "+16 H"][k], cx + R0 * 0.62 * Math.cos(am), cy + R0 * 0.62 * Math.sin(am) + 22, 64, C.yellow); });
        const p = E("line", { x1: cx, y1: cy, x2: cx, y2: cy - R0 + 10, stroke: C.red, "stroke-width": 12, "stroke-linecap": "round" }, g); E("circle", { cx, cy, r: 16, fill: C.white }, g);
        live(B, (t, s, u) => p.setAttribute("transform", `rotate(${(360 * ease(clamp((u - 0.1) / 0.8))).toFixed(2)} ${cx} ${cy})`));
        pop(label(g, "3 SAROS", 1280, 300, 100, C.sky), a + 0.15 * d); pop(label(g, "= ABOUT 54 YEARS", 1280, 410, 64, C.white), a + 0.3 * d); pop(label(g, "HOUR CORRECTION", 1280, 580, 64, C.yellow), a + 0.5 * d); }
      // 46: the Moon is not steady
      { const [g, B, a, d] = BB(46);
        E("circle", { cx: 840, cy: 420, r: 60, fill: "#3B7BD9", stroke: C.white, "stroke-width": 5 }, g);
        E("circle", { cx: 840, cy: 420, r: 280, fill: "none", stroke: C.sky, "stroke-width": 3, "stroke-dasharray": "8 10" }, g);
        const mn = E("circle", { r: 32, fill: C.white, stroke: C.ink, "stroke-width": 4 }, g);
        const sp = E("rect", { x: 1300, y: 600, width: 60, height: 0, fill: C.yellow }, g); E("rect", { x: 1300, y: 300, width: 60, height: 300, fill: "none", stroke: C.white, "stroke-width": 4 }, g);
        live(B, (t, s, u) => { const M = s * 1.4, an = M + 0.9 * Math.sin(M), v = 1 + 0.9 * Math.cos(M); mn.setAttribute("cx", 840 + 280 * Math.cos(an)); mn.setAttribute("cy", 420 + 280 * Math.sin(an)); sp.setAttribute("y", 600 - v * 150); sp.setAttribute("height", v * 150); sp.setAttribute("fill", v > 1 ? C.red : C.sky); });
        label(g, "SPEED", 1330, 270, 48, C.white);
        pop(label(g, "NOT A STEADY SPEED", 840, 90, 80, C.yellow), a + 0.15 * d); pop(label(g, "(EXAGGERATED)", 300, 740, 44, C.mute), a + 0.3 * d); }
      // 47: elliptical orbit, Hipparchus
      { const [g, B, a, d] = BB(47);
        const cx = 700, cy = 400, A = 440, ecc = 0.55, Bm = A * Math.sqrt(1 - ecc * ecc), fx = cx - A * ecc;
        E("ellipse", { cx, cy, rx: A, ry: Bm, fill: "none", stroke: C.sky, "stroke-width": 4, "stroke-dasharray": "10 10" }, g);
        E("circle", { cx: fx, cy, r: 50, fill: "#3B7BD9", stroke: C.white, "stroke-width": 5 }, g); label(g, "EARTH", fx, cy + 110, 44, C.white);
        const mn = E("circle", { r: 30, fill: C.white, stroke: C.ink, "stroke-width": 4 }, g);
        live(B, (t, s) => { const M = s * 1.1 + 2; let Ea = M; for (let k = 0; k < 6; k++) Ea = M + ecc * Math.sin(Ea); mn.setAttribute("cx", cx - A * Math.cos(Ea)); mn.setAttribute("cy", cy + Bm * Math.sin(Ea)); });
        pop(label(g, "FAST", fx - 160, cy - 30, 60, C.red), a + 0.2 * d); pop(label(g, "SLOW", cx + A + 30, cy - 100, 60, C.sky), a + 0.3 * d);
        pop(label(g, "HIPPARCHUS", 1420, 560, 72, C.yellow), a + 0.6 * d); pop(label(g, "HAD A THEORY", 1420, 650, 52, C.white), a + 0.7 * d); }
      // pin-and-slot pair (k1 drives k2 via a pin in a slot; centres offset)
      function pinSlot(p, cx, cy, R0, off, B, rate, o = {}) {
        const k = E("g", {}, p), k1 = gear(k, cx, cy, 50, (R0 * 2) / 50, { fill: C.yellow }), k2g = E("g", {}, k);
        k1.G.setAttribute("opacity", 0.55);
        const k2 = gear(k2g, cx + off, cy, 50, (R0 * 2) / 50, { fill: C.sky }); k2.G.setAttribute("opacity", 0.75);
        const slot = E("rect", { x: R0 * 0.25, y: -14, width: R0 * 0.62, height: 28, rx: 14, fill: C.navyD, stroke: C.white, "stroke-width": 4 }, k2.R);
        const pin = E("circle", { r: 13, fill: C.red, stroke: C.white, "stroke-width": 4 }, k);
        E("circle", { cx, cy, r: 9, fill: C.yellow, stroke: C.ink, "stroke-width": 3 }, k); E("circle", { cx: cx + off, cy, r: 9, fill: C.sky, stroke: C.ink, "stroke-width": 3 }, k);
        const rp = R0 * 0.55; let last = null;
        const state = (s) => { const th1 = s * rate, px = cx + rp * Math.cos(th1 * D2R), py = cy + rp * Math.sin(th1 * D2R), th2 = Math.atan2(py - cy, px - cx - off) / D2R; return { th1, th2, px, py }; };
        live(B, (t, s) => { const st = state(s); k1.set(st.th1); k2.set(st.th2); pin.setAttribute("cx", st.px); pin.setAttribute("cy", st.py); });
        return { k, state };
      }
      // 48: two gears face to face, different centres
      { const [g, B, a, d] = BB(48);
        const ps = pinSlot(g, 560, 400, 300, 60, B, 22);
        pop(label(g, "TWO GEARS, FACE TO FACE", 1310, 260, 56, C.yellow), a + 0.15 * d);
        pop(label(g, "CENTRES SLIGHTLY APART", 1310, 360, 52, C.white), a + 0.4 * d);
        pop(label(g, "(ABOUT 1.1 MM IN THE REAL ONE)", 1310, 440, 40, C.mute), a + 0.55 * d); }
      // 49: the pin slides in the slot
      { const [g, B, a, d] = BB(49);
        const ps = pinSlot(g, 620, 400, 330, 70, B, 30);
        pop(label(g, "PIN", 1260, 270, 80, C.red), a + 0.15 * d); pop(label(g, "SLIDES IN AND OUT", 1330, 380, 56, C.white), a + 0.3 * d); pop(label(g, "OF THE SLOT", 1330, 460, 56, C.white), a + 0.4 * d); }
      // 50: fast half, slow half - speed graph
      { const [g, B, a, d] = BB(50);
        const ps = pinSlot(g, 330, 400, 230, 55, B, 45);
        const gx = 720, gy = 420, gw = 880;
        E("line", { x1: gx, y1: gy, x2: gx + gw, y2: gy, stroke: C.white, "stroke-width": 3, "stroke-dasharray": "8 8" }, g); label(g, "AVERAGE", gx + gw - 90, gy - 16, 40, C.mute);
        const curve = E("path", { d: "", fill: "none", stroke: C.yellow, "stroke-width": 7, "stroke-linecap": "round" }, g);
        live(B, (t, s, u) => { const T0 = s; let dd = ""; const n = Math.max(2, Math.floor(160 * clamp(u / 0.85)));
          for (let i = 0; i <= n; i++) { const ss = (i / 160) * (B.b - B.a) * 0.85, s1 = ps.state(ss), s2 = ps.state(ss + 0.02); let dv = s2.th2 - s1.th2; if (dv < -180) dv += 360; const v = dv / 0.02 / 45; dd += (i ? "L" : "M") + (gx + (i / 160) * gw).toFixed(1) + "," + (gy - (v - 1) * 260).toFixed(1); }
          curve.setAttribute("d", dd); void T0; });
        pop(label(g, "FASTER", gx + 150, 150, 56, C.red), a + 0.3 * d); pop(label(g, "SLOWER", gx + 520, 720, 56, C.sky), a + 0.5 * d); }
      // 51: carried on e3, ~9-year turn
      { const [g, B, a, d] = BB(51);
        const e3 = gear(g, 620, 400, 223, 3.1, { spokes: 4, fill: "#B8923A" });
        const car = E("g", {}, g); const ps = pinSlot(car, 0, 0, 120, 25, B, 120);
        live(B, (t, s, u) => { const yrs = 9 * ease(clamp((u - 0.1) / 0.8)), an = (yrs / 9) * 360; e3.set(an); car.setAttribute("transform", `rotate(${an.toFixed(2)} 620 400) translate(${620 + 190},400)`); });
        num(g, 1340, 330, 110, C.yellow, B, (u) => (9 * ease(clamp((u - 0.1) / 0.8))).toFixed(1) + " YRS");
        pop(label(g, "1 TURN = ABOUT 9 YEARS", 1340, 460, 56, C.white), a + 0.3 * d); pop(label(g, "THE ORBIT SWINGS AROUND", 1340, 560, 48, C.sky), a + 0.5 * d); }
      // 52: theory into bronze
      { const [g, B, a, d] = BB(52);
        E("ellipse", { cx: 380, cy: 380, rx: 260, ry: 190, fill: "none", stroke: C.sky, "stroke-width": 5, "stroke-dasharray": "10 10" }, g); E("circle", { cx: 230, cy: 380, r: 36, fill: "#3B7BD9", stroke: C.white, "stroke-width": 4 }, g);
        label(g, "THEORY", 380, 680, 72, C.sky);
        fadeIn(arrowLine(g, 700, 380, 960, 380, C.yellow, 12), a + 0.3 * d);
        const ps = pinSlot(g, 1270, 380, 230, 45, B, 40); fadeIn(ps.k, a + 0.35 * d);
        pop(label(g, "BRONZE", 1270, 700, 72, C.yellow), a + 0.45 * d); pop(label(g, "2,000+ YEARS AGO", 840, 110, 72, C.white), a + 0.6 * d); }
      // 53: the planets - gone
      { const [g, B, a, d] = BB(53);
        const cx = 840, cy = 420; [90, 140, 190, 240, 290].forEach((r, i) => { const c = E("circle", { cx, cy, r, fill: "none", stroke: C.sky, "stroke-width": 4, "stroke-dasharray": "10 12" }, g); });
        const qs = [0, 1, 2, 3, 4].map((i) => label(g, "?", cx + (90 + i * 50) * Math.cos(i * 1.3), cy + 22 + (90 + i * 50) * Math.sin(i * 1.3), 64, C.yellow));
        qs.forEach((q, i) => pop(q, a + (0.3 + i * 0.07) * d));
        E("circle", { cx, cy, r: 30, fill: C.yellow }, g);
        pop(label(g, "THE PLANETS?", 280, 380, 80, C.yellow), a + 0.15 * d); pop(label(g, "GEARS: LOST", 1420, 380, 80, C.red), a + 0.55 * d); }

      // ===== CHAPTER 5: A MODEL OF THE COSMOS =====
      { const [g, B, a, d] = BB(54); const body = chap(g, B, "FIVE", "MODEL OF THE COSMOS");
        E("rect", { x: 380, y: 160, width: 520, height: 520, rx: 20, fill: "none", stroke: C.sky, "stroke-width": 6, "stroke-dasharray": "16 12" }, body);
        E("path", { d: "M380,180 Q380,160 400,160 L900,160 L900,330 Q700,380 560,330 Q450,300 380,360 Z", fill: "#3F6B5C", stroke: C.ink, "stroke-width": 5 }, body);
        label(body, "ABOUT 1/3", 1260, 360, 120, C.yellow); label(body, "SURVIVES", 1260, 460, 72, C.white); label(body, "PLANET GEARS: MOSTLY LOST", 1260, 600, 44, C.red); }
      // 55: UCL 2021
      { const [g, B, a, d] = BB(55);
        const X = tline(g, 470, 140, 1540, 1900, 2030, [1900, 1950, 2000]);
        [[1902, "GEAR SEEN"], [1974, "PRICE"], [2006, "NATURE"], [2021, "UCL MODEL"]].forEach(([y, s], i) => { const k = E("g", {}, g); E("circle", { cx: X(y), cy: 470, r: 20, fill: i === 3 ? C.yellow : C.white, stroke: C.ink, "stroke-width": 4 }, k); label(k, String(y), X(y), 400, 56, i === 3 ? C.yellow : C.white); label(k, s, X(y), i % 2 ? 600 : 330, 44, i === 3 ? C.yellow : C.sky); pop(k, a + (0.1 + i * 0.15) * d); });
        pop(label(g, "SCIENTIFIC REPORTS, 2021", 840, 690, 64, C.white), a + 0.65 * d); }
      // 56: the front cover inscription: 462 and 442
      { const [g, B, a, d] = BB(56);
        E("rect", { x: 120, y: 160, width: 720, height: 480, rx: 16, fill: "#4E7B66", stroke: C.ink, "stroke-width": 6 }, g);
        const R = rng(56); for (let r = 0; r < 7; r++) E("rect", { x: 170, y: 210 + r * 62, width: 300 + R() * 300, height: 16, rx: 8, fill: C.ink, opacity: 0.35 }, g);
        const n1 = label(g, "462", 330, 380, 120, C.yellow), n2 = label(g, "442", 630, 560, 120, C.yellow); pop(n1, a + 0.3 * d); pop(n2, a + 0.55 * d);
        const v = E("g", {}, g); E("circle", { cx: 1100, cy: 300, r: 60, fill: "#F2E3B0", stroke: C.ink, "stroke-width": 4 }, v); label(v, "VENUS: 462 YEARS", 1400, 320, 52, C.white); pop(v, a + 0.35 * d);
        const sa = E("g", {}, g); E("circle", { cx: 1100, cy: 520, r: 50, fill: "#E3C27A", stroke: C.ink, "stroke-width": 4 }, sa); E("ellipse", { cx: 1100, cy: 520, rx: 95, ry: 22, fill: "none", stroke: C.yellow, "stroke-width": 7 }, sa); label(sa, "SATURN: 442 YEARS", 1400, 540, 52, C.white); pop(sa, a + 0.6 * d);
        pop(label(g, "FRONT COVER INSCRIPTION", 480, 100, 52, C.sky), a + 0.05 * d); }
      // 57: cycles into gear teeth (Parmenides)
      { const [g, B, a, d] = BB(57);
        pop(label(g, "462 = 2 X 3 X 7 X 11", 440, 240, 72, C.yellow), a + 0.1 * d); pop(label(g, "442 = 2 X 13 X 17", 440, 380, 72, C.yellow), a + 0.3 * d);
        pop(label(g, "SMALL FACTORS = BUILDABLE GEARS", 440, 520, 44, C.white), a + 0.45 * d);
        const ga = gear(g, 1150, 330, 63, 6, { spokes: 4 }), gb = meshNew(ga, 21, 30); drive(B, [ga, [gb, ga, "m"]], (t, s) => s * 20);
        pop(label(g, "63 TEETH: A KEY VENUS GEAR", 1150, 690, 48, C.sky), a + 0.55 * d);
        pop(label(g, "METHOD OF PARMENIDES", 440, 690, 56, C.white), a + 0.65 * d); }
      // 58: rings and beads
      { const [g, B, a, d] = BB(58);
        const cx = 620, cy = 400, names = ["MOON", "MERCURY", "VENUS", "SUN", "MARS", "JUPITER", "SATURN"], cols = [C.white, C.mute, "#F2E3B0", C.yellow, C.red, "#E3A86B", "#E3C27A"], per = [27.3, 88, 225, 365, 687, 4333, 10759];
        const bs = names.map((nm, i) => { const r = 70 + i * 46; E("circle", { cx, cy, r, fill: "none", stroke: C.sky, "stroke-width": 14, "stroke-opacity": 0.3 }, g); E("circle", { cx, cy, r, fill: "none", stroke: C.white, "stroke-width": 2, opacity: 0.5 }, g);
          return E("circle", { r: i === 3 ? 20 : 14, fill: cols[i], stroke: C.ink, "stroke-width": 3 }, g); });
        E("circle", { cx, cy, r: 30, fill: "#3B7BD9", stroke: C.white, "stroke-width": 4 }, g);
        live(B, (t, s) => bs.forEach((b, i) => { const r = 70 + i * 46, an = -Math.PI / 2 + (s * 40 / per[i]) * TAU; b.setAttribute("cx", cx + r * Math.cos(an)); b.setAttribute("cy", cy + r * Math.sin(an)); }));
        pop(label(g, "SUN + MOON", 1330, 280, 72, C.yellow), a + 0.2 * d); pop(label(g, "+ 5 PLANETS", 1330, 380, 72, C.white), a + 0.35 * d); pop(label(g, "RINGS + MARKER BEADS", 1330, 540, 52, C.sky), a + 0.55 * d); }
      // 59: tight space
      { const [g, B, a, d] = BB(59);
        E("rect", { x: 200, y: 160, width: 70, height: 520, fill: "#8A5A2B", stroke: C.ink, "stroke-width": 5 }, g); label(g, "FRONT DIAL", 235, 130, 44, C.white);
        const layers = []; for (let i = 0; i < 9; i++) { const y = 240 + i * 0; const w = 600 - i * 50; layers.push(E("rect", { x: 300 + i * 34, y: 420 - w / 2, width: 16, height: w, rx: 4, fill: i % 2 ? C.yellow : C.sky, stroke: C.ink, "stroke-width": 3 }, g)); }
        layers.forEach((l, i) => pop(l, a + (0.1 + i * 0.06) * d, 0.25));
        const tubes = [0, 1, 2, 3].map((i) => E("rect", { x: 270, y: 420 - 8 - i * 12, width: 340 - i * 30, height: 16 + i * 24, fill: "none", stroke: C.white, "stroke-width": 3 }, g));
        E("path", { d: "M300,720 L620,720", stroke: C.red, "stroke-width": 6 }, g);
        pop(label(g, "A TIGHT SQUEEZE", 1160, 330, 90, C.yellow), a + 0.4 * d); pop(label(g, "GEAR LAYERS + NESTED TUBES", 1160, 450, 48, C.white), a + 0.55 * d); }
      // 60: fits all the evidence; next build it
      { const [g, B, a, d] = BB(60);
        ["GEARS", "INSCRIPTIONS", "SCANS"].forEach((s, i) => { const k = E("g", {}, g); tick(k, 220, 220 + i * 140, 40); label(k, s, 290, 240 + i * 140, 64, C.white, { anchor: "start" }); pop(k, a + (0.1 + i * 0.12) * d); });
        pop(label(g, "FITS ALL THE EVIDENCE", 450, 680, 60, C.yellow), a + 0.45 * d);
        const hm = E("g", {}, g); E("rect", { x: -16, y: -10, width: 32, height: 220, rx: 10, fill: "#B8814A", stroke: C.ink, "stroke-width": 4 }, hm); E("rect", { x: -80, y: -60, width: 160, height: 70, rx: 12, fill: C.mute, stroke: C.ink, "stroke-width": 4 }, hm);
        live(B, (t, s, u) => hm.setAttribute("transform", `translate(1280,300) rotate(${u > 0.5 ? -25 * Math.abs(Math.sin(s * 5)) : 0})`)); pop(hm, a + 0.55 * d);
        const gg = gear(g, 1180, 560, 24, 8); pop(gg.G, a + 0.6 * d);
        pop(label(g, "NEXT: BUILD IT", 1280, 120, 72, C.sky), a + 0.6 * d); pop(label(g, "WITH ANCIENT TECHNIQUES", 1280, 740, 48, C.white), a + 0.7 * d); }

      // ===== CHAPTER 6: THE LOST CENTURIES =====
      { const [g, B, a, d] = BB(61); const body = chap(g, B, "SIX", "THE LOST CENTURIES");
        const path = E("path", { d: "M120,520 C420,360 620,640 900,480 S1300,420 1560,500", fill: "none", stroke: C.yellow, "stroke-width": 10, "stroke-dasharray": "2 26", "stroke-linecap": "round" }, body);
        const gg = gear(body, 120, 520, 22, 8); live(B, (t, s) => gg.set(s * 30));
        path.setAttribute("stroke", "url(#d2trail)");
        label(body, "THE TRAIL GOES COLD", 840, 250, 80, C.white); }
      // 62: they knew all this, yet nothing survives
      { const [g, B, a, d] = BB(62);
        const g1 = gear(g, 240, 300, 30, 7), g2 = meshNew(g1, 16, 0); drive(B, [g1, [g2, g1, "m"]], (t, s) => s * 30); label(g, "GEAR TRAINS", 290, 520, 52, C.white);
        const sp = spiral(g, 840, 300, 20, 150, 3, 60); live(B, (t, s, u) => sp.setM(60 * u)); label(g, "CYCLES", 840, 520, 52, C.white);
        E("ellipse", { cx: 1420, cy: 300, rx: 170, ry: 110, fill: "none", stroke: C.sky, "stroke-width": 5, "stroke-dasharray": "8 8" }, g); E("circle", { cx: 1340, cy: 300, r: 28, fill: "#3B7BD9" }, g); label(g, "HIPPARCHUS", 1420, 520, 52, C.white);
        pop(label(g, "NOTHING ELSE LIKE IT SURVIVES", 840, 700, 72, C.yellow), a + 0.55 * d); }
      // 63: Byzantine geared sundial ~600
      { const [g, B, a, d] = BB(63);
        const X = tline(g, 600, 140, 1540, -200, 1500, [0, 500, 1000, 1500], { ad: true });
        E("circle", { cx: X(-100), cy: 600, r: 18, fill: C.yellow }, g);
        const k = E("g", {}, g); const s1 = gear(k, X(600) - 60, 330, 20, 8), s2 = meshNew(s1, 12, 0); drive(B, [s1, [s2, s1, "m"]], (t, s) => s * 30);
        E("path", { d: `M${X(600) - 200},460 A140,140 0 0 1 ${X(600) + 80},460 Z`, fill: "none", stroke: C.white, "stroke-width": 5 }, k); pop(k, a + 0.2 * d);
        E("line", { x1: X(600), y1: 480, x2: X(600), y2: 600, stroke: C.yellow, "stroke-width": 5 }, g);
        pop(label(g, "BYZANTINE GEARED SUNDIAL", 1180, 230, 52, C.yellow), a + 0.4 * d); pop(label(g, "AROUND AD 600 - FAR SIMPLER", 1180, 310, 44, C.white), a + 0.55 * d); }
      // 64: 14th-century astronomical clocks
      { const [g, B, a, d] = BB(64);
        const tw_ = E("g", {}, g); E("rect", { x: 1040, y: 160, width: 300, height: 560, fill: C.navyL, stroke: C.white, "stroke-width": 6 }, tw_); E("path", { d: "M1020,160 L1190,40 L1360,160 Z", fill: C.navyL, stroke: C.white, "stroke-width": 6 }, tw_);
        const fd = frontDial(tw_, 1190, 360, 120, { cal: false }); const h1 = fd.hand(C.yellow, 110, 6, "sun"); live(B, (t, s) => h1.set(s * 40));
        pop(tw_, a + 0.1 * d, 0.4);
        pop(label(g, "1300s", 480, 250, 140, C.yellow), a + 0.2 * d); pop(label(g, "ASTRONOMICAL CLOCKS", 480, 400, 64, C.white), a + 0.4 * d); pop(label(g, "OF MEDIEVAL EUROPE", 480, 480, 56, C.sky), a + 0.5 * d); }
      // 65: the gap
      { const [g, B, a, d] = BB(65);
        const X = tline(g, 450, 140, 1540, -300, 1500, [500, 1000, 1500], { ad: true });
        const m1 = gear(g, X(-100), 450, 16, 7); live(B, (t, s) => m1.set(s * 40)); const m2 = gear(g, X(1350), 450, 16, 7, { fill: C.sky }); live(B, (t, s) => m2.set(-s * 40));
        const gap = E("rect", { x: X(-60), y: 425, width: 0, height: 50, rx: 12, fill: C.red }, g); live(B, (t, s, u) => gap.setAttribute("width", (X(1310) - X(-60)) * ease(clamp((u - 0.1) / 0.5))));
        num(g, 840, 330, 110, C.yellow, B, (u) => { const v = ease(clamp((u - 0.1) / 0.5)); return v >= 1 ? "1,000+ YEARS" : Math.round(1000 * v) + " YEARS"; });
        pop(label(g, "THE KNOW-HOW VANISHED", 840, 660, 72, C.white), a + 0.6 * d); }
      // 66: lump -> computer of bronze gears
      { const [g, B, a, d] = BB(66);
        lump(g, 330, 400, 0.95, { gear: true }); fadeIn(arrowLine(g, 560, 400, 760, 400, C.yellow, 12), a + 0.2 * d);
        const fd = frontDial(g, 1060, 400, 250); const sh = fd.hand(C.yellow, 230, 7, "sun"), mh = fd.hand(C.white, 210, 5, "moon"); live(B, (t, s) => { sh.set(s * 20); mh.set(s * 20 * 254 / 19); });
        const gg = gear(g, 1460, 230, 30, 8, { spokes: 4 }), gh = meshNew(gg, 14, 100); drive(B, [gg, [gh, gg, "m"]], (t, s) => s * 30);
        pop(label(g, "A COMPUTER OF BRONZE GEARS", 840, 740, 72, C.yellow), a + 0.4 * d); }
