      // ===== DOC d3: why the Titan sub imploded =====
      const CX = BW / 2;
      const D = (i) => { const B = BT[i]; return { g: beat(i), B, a: B.a, d: B.b - B.a }; };
      grad("seaG", "linearGradient", { x1: 0, y1: 0, x2: 0, y2: 1 }, [[0, "#2F63B8", 0.75], [0.5, "#132063", 0.85], [1, "#05081F", 0.95]]);
      const fmtN = (v) => Math.round(v).toLocaleString("en-US");
      function counter(g, x, y, size, col, v0, v1, t0, t1, B, fmt = fmtN, o) {
        const el = label(g, fmt(v0), x, y, size, col, o);
        U.push((t) => { if (!inR(t, B, 0.2)) return; el.textContent = fmt(lerp(v0, v1, ease(clamp((t - t0) / Math.max(0.01, t1 - t0))))); });
        return el;
      }
      function chapter(g, n, title, a, d, y = 110) {
        pop(label(g, "CHAPTER " + n, CX, y, 54, C.yellow), a + 0.02 * d);
        slam(label(g, title, CX, y + 112, 100, C.white), a + 0.07 * d);
        const ln = E("line", { x1: CX - 320, y1: y + 145, x2: CX + 320, y2: y + 145, stroke: C.yellow, "stroke-width": 8, "stroke-linecap": "round" }, g);
        tl.fromTo(ln, { attr: { x1: CX, x2: CX } }, { attr: { x1: CX - 320, x2: CX + 320 }, duration: 0.5, ease: "power2.out" }, a + 0.14 * d);
      }
      // side view of the Titan: carbon tube, two titanium domes, tail cone, skid
      function titan(g, x, y, s = 1) {
        const k = E("g", { transform: `translate(${x},${y}) scale(${s})` }, E("g", {}, g)), S = { stroke: C.white, "stroke-width": 6, "stroke-linejoin": "round" };
        E("polygon", { points: "-262,-48 -345,-26 -345,26 -262,48", fill: C.navyL, ...S }, k);
        E("rect", { x: -300, y: 72, width: 600, height: 14, rx: 7, fill: C.mute }, k);
        E("path", { d: "M-200,-65 A70,65 0 0 0 -200,65 Z", fill: C.sky, ...S }, k);
        E("path", { d: "M200,-65 A70,65 0 0 1 200,65 Z", fill: C.sky, ...S }, k);
        E("rect", { x: -200, y: -65, width: 400, height: 130, fill: "#2A2F4A", ...S }, k);
        for (let i = 1; i < 8; i++) E("line", { x1: -200 + i * 50 + 10, y1: -60, x2: -200 + i * 50 - 10, y2: 60, stroke: "#4E5578", "stroke-width": 4 }, k);
        E("circle", { cx: 238, cy: 0, r: 20, fill: C.navyD, stroke: C.yellow, "stroke-width": 5 }, k);
        return k.parentNode;
      }
      function sphere(g, cx, cy, r, col = C.sky, w = 22) {
        const k = E("g", {}, g);
        E("circle", { cx, cy, r, fill: C.navyD, stroke: col, "stroke-width": w }, k);
        E("path", { d: arcP(cx, cy, r - w * 1.4, Math.PI * 1.1, Math.PI * 1.45), fill: "none", stroke: C.white, "stroke-width": 6, "stroke-linecap": "round", opacity: 0.5 }, k);
        return k;
      }
      // inward pressure arrows around a circle, pulsing
      function squeeze(g, cx, cy, r, n, B, col = C.sky, len = 90, amp = 12, w = 9) {
        const arr = [];
        for (let k = 0; k < n; k++) { const th = (k / n) * TAU - Math.PI / 2, c = Math.cos(th), s = Math.sin(th), q = E("g", {}, g);
          arrowLine(q, cx + c * (r + len + 14), cy + s * (r + len + 14), cx + c * (r + 14), cy + s * (r + 14), col, w); arr.push([q, c, s]); }
        U.push((t) => { if (!inR(t, B, 0.2)) return; const f = (0.5 + 0.5 * Math.sin((t - B.a) * 4.2)) * amp; arr.forEach(([q, c, s]) => q.setAttribute("transform", `translate(${(-c * f).toFixed(1)},${(-s * f).toFixed(1)})`)); });
        return arr;
      }
      function seaBox(g, x, y, w, h) { return E("rect", { x, y, width: w, height: h, fill: "url(#seaG)", stroke: C.white, "stroke-width": 4, rx: 10 }, g); }
      function ship(g, x, y, s = 1, col = C.white) {
        const k = E("g", { transform: `translate(${x},${y}) scale(${s})` }, E("g", {}, g)), S = { stroke: C.ink, "stroke-width": 4, "stroke-linejoin": "round" };
        E("polygon", { points: "-110,-10 110,-10 85,28 -95,28", fill: col, ...S }, k);
        E("rect", { x: -60, y: -48, width: 70, height: 38, fill: C.sky, ...S }, k); E("rect", { x: 20, y: -36, width: 40, height: 26, fill: C.red, ...S }, k);
        return k.parentNode;
      }
      function seabed(g, y, x0 = 0, x1 = BW) {
        let d = `M${x0},${BH} L${x0},${y}`; for (let x = x0; x <= x1; x += 40) d += ` L${x},${(y + 10 * Math.sin(x / 70) + 6 * Math.sin(x / 23)).toFixed(1)}`;
        return E("path", { d: d + ` L${x1},${BH} Z`, fill: "#3A3550", stroke: C.mute, "stroke-width": 4 }, g);
      }
      function wreckBow(g, x, y, s = 1) {
        const k = E("g", { transform: `translate(${x},${y}) scale(${s})` }, E("g", {}, g));
        E("polygon", { points: "-170,0 150,0 200,-70 -150,-60", fill: "#5A4A44", stroke: C.mute, "stroke-width": 5, "stroke-linejoin": "round" }, k);
        E("rect", { x: -60, y: -110, width: 30, height: 50, fill: "#5A4A44", stroke: C.mute, "stroke-width": 4 }, k);
        return k.parentNode;
      }
      function warn(g, x, y, s = 1, col = C.yellow) {
        const k = E("g", { transform: `translate(${x},${y}) scale(${s})` }, E("g", {}, g));
        E("polygon", { points: "0,-58 54,40 -54,40", fill: col, stroke: C.ink, "stroke-width": 5, "stroke-linejoin": "round" }, k);
        T(k, "!", 0, 30, 64, C.navyD, { sw: 0 });
        return k.parentNode;
      }
      function docIcon(g, x, y, s = 1, title = "") {
        const k = E("g", { transform: `translate(${x},${y}) scale(${s})` }, E("g", {}, g));
        E("path", { d: "M-80,-105 L45,-105 L80,-70 L80,105 L-80,105 Z", fill: C.white, stroke: C.ink, "stroke-width": 5, "stroke-linejoin": "round" }, k);
        for (let i = 0; i < 6; i++) E("line", { x1: -55, y1: -40 + i * 26, x2: i % 3 === 2 ? 20 : 55, y2: -40 + i * 26, stroke: C.mute, "stroke-width": 7, "stroke-linecap": "round" }, k);
        if (title) T(k, title, 0, -60, 34, C.navy, { sw: 0 });
        return k.parentNode;
      }
      function bubble(g, x, y, txt, size = 44, col = C.white) {
        const k = E("g", {}, g), w = tw(txt, size) + 50;
        E("rect", { x: x - w / 2, y: y - size * 0.95, width: w, height: size * 1.35, rx: 18, fill: C.navyD, stroke: col, "stroke-width": 5 }, k);
        T(k, txt, x, y + size * 0.05, size, col, { sw: 0 });
        return k;
      }
      // layered carbon wall cross-section: n layers stacked vertically; returns layer groups
      function wall(g, x, y, w, h, n = 5) {
        const L = [], lh = h / n;
        for (let i = 0; i < n; i++) { const k = E("g", {}, g); E("rect", { x, y: y + i * lh, width: w, height: lh - 4, rx: 6, fill: i % 2 ? "#363C5E" : "#2A2F4A", stroke: C.white, "stroke-width": 4 }, k);
          for (let j = 0; j < w / 60; j++) E("line", { x1: x + 20 + j * 60, y1: y + i * lh + 8, x2: x + 50 + j * 60, y2: y + (i + 1) * lh - 12, stroke: "#5A6290", "stroke-width": 4 }, k); L.push(k); }
        return L;
      }
      function growBar(g, x, y, w, h, col, t0, dur = 0.8) {
        const r = E("rect", { x, y, width: w, height: h, rx: 10, fill: col }, g);
        tl.fromTo(r, { attr: { width: 0 } }, { attr: { width: w }, duration: dur, ease: "power2.out" }, t0);
        return r;
      }
      function growUp(g, x, yb, w, h, col, t0, dur = 0.8) {
        const r = E("rect", { x, y: yb - h, width: w, height: h, rx: 10, fill: col }, g);
        tl.fromTo(r, { attr: { y: yb, height: 0 } }, { attr: { y: yb - h, height: h }, duration: dur, ease: "power2.out" }, t0);
        return r;
      }
      function stick(g, x, y, s = 1, col = C.white) {
        const k = E("g", { transform: `translate(${x},${y}) scale(${s})` }, E("g", {}, g)), W = { stroke: col, "stroke-width": 10, "stroke-linecap": "round", fill: "none" };
        E("circle", { cx: 0, cy: -150, r: 28, fill: col }, k); E("line", { x1: 0, y1: -120, x2: 0, y2: -50, ...W }, k);
        E("line", { x1: 0, y1: -50, x2: -26, y2: 0, ...W }, k); E("line", { x1: 0, y1: -50, x2: 26, y2: 0, ...W }, k); E("line", { x1: 0, y1: -105, x2: -38, y2: -70, ...W }, k); E("line", { x1: 0, y1: -105, x2: 38, y2: -70, ...W }, k);
        return k;
      }
      function clockFace(g, x, y, r, B, speed = 1) {
        const k = E("g", {}, g); E("circle", { cx: x, cy: y, r, fill: C.navyD, stroke: C.white, "stroke-width": 8 }, k);
        for (let i = 0; i < 12; i++) { const th = (i / 12) * TAU; E("line", { x1: x + Math.cos(th) * r * 0.8, y1: y + Math.sin(th) * r * 0.8, x2: x + Math.cos(th) * r * 0.92, y2: y + Math.sin(th) * r * 0.92, stroke: C.white, "stroke-width": 5 }, k); }
        const hand = E("line", { x1: x, y1: y, x2: x, y2: y - r * 0.75, stroke: C.yellow, "stroke-width": 8, "stroke-linecap": "round" }, k);
        U.push((t) => { if (!inR(t, B, 0.2)) return; hand.setAttribute("transform", `rotate(${((t - B.a) * 60 * speed) % 360} ${x} ${y})`); });
        return k;
      }

      // 0: cold-open cover (hook drawn by finish.js)
      { const g = beat(0); }
      // 1: gone, collapsed inward in a fraction of a second
      {
        const { g, a, d } = D(1);
        const w = E("g", { transform: `translate(${CX},330)` }, g), inner = E("g", {}, w); titan(inner, 0, 0, 1.4);
        pop(w, a + 0.04 * d);
        tl.to(inner, { scaleY: 0.12, scaleX: 0.55, opacity: 0.35, svgOrigin: "0 0", duration: 0.18, ease: "power4.in" }, a + 0.62 * d);
        pop(label(g, "NOT FLOODED", 380, 590, 64, C.white), a + 0.2 * d); pop(label(g, "NOT STUCK", 1300, 590, 64, C.white), a + 0.33 * d);
        slam(label(g, "COLLAPSED INWARD", CX, 740, 84, C.yellow), a + 0.66 * d);
      }
      // 2: water in a glass vs water at depth
      {
        const { g, B, a, d } = D(2);
        const gl = E("g", {}, g);
        E("path", { d: "M180,250 L220,640 L420,640 L460,250", fill: "none", stroke: C.white, "stroke-width": 8, "stroke-linejoin": "round" }, gl);
        E("path", { d: "M195,380 L220,632 L420,632 L445,380 Z", fill: "#3D7BD9", opacity: 0.8 }, gl);
        pop(gl, a + 0.05 * d); pop(label(g, "IN YOUR GLASS", 320, 720, 52, C.white), a + 0.1 * d);
        const ar = arrowLine(g, 560, 450, 900, 450, C.yellow, 10); fadeIn(ar, a + 0.3 * d);
        const sp = E("g", {}, g); sphere(sp, 1260, 400, 150, C.sky, 20); squeeze(sp, 1260, 400, 150, 12, B, C.sky, 70);
        pop(sp, a + 0.35 * d); pop(label(g, "AT DEPTH: CRUSHING", 1260, 720, 52, C.yellow), a + 0.45 * d);
      }
      // 3: experts warned years earlier
      {
        const { g, a, d } = D(3);
        E("line", { x1: 140, y1: 430, x2: 1540, y2: 430, stroke: C.white, "stroke-width": 8, "stroke-linecap": "round" }, g);
        [[2018, 260], [2019, 500], [2020, 740], [2021, 980], [2022, 1220], [2023, 1460]].forEach(([yr, x], i) => {
          E("circle", { cx: x, cy: 430, r: 14, fill: C.white }, g); label(g, String(yr), x, 520, 50, i === 5 ? C.red : C.white); });
        [260, 1220].forEach((x, i) => pop(warn(g, x, 320, 1.1), a + (0.2 + 0.25 * i) * d));
        pop(label(g, "WARNINGS", 740, 250, 70, C.yellow), a + 0.5 * d);
        pop(label(g, "YEARS BEFORE", 740, 680, 60, C.white), a + 0.62 * d);
      }
      // 4: physics, engineering, warnings, told with care
      {
        const { g, a, d } = D(4);
        const cols = [["PHYSICS", 330], ["ENGINEERING", 840], ["WARNINGS", 1350]];
        const ic = [E("g", {}, g), E("g", {}, g), E("g", {}, g)];
        sphere(ic[0], 330, 230, 90, C.sky, 14); titan(ic[1], 840, 230, 0.6); warn(ic[2], 1350, 240, 1.4);
        cols.forEach(([s, x], i) => { pop(ic[i], a + (0.06 + 0.12 * i) * d); pop(label(g, s, x, 420, 64, C.white), a + (0.1 + 0.12 * i) * d); });
        const cand = E("g", {}, g); for (let i = 0; i < 5; i++) { const x = 640 + i * 100; E("circle", { cx: x, cy: 560, r: 16, fill: C.yellow }, cand); E("circle", { cx: x, cy: 560, r: 34, fill: "url(#glowY)" }, cand); }
        fadeIn(cand, a + 0.6 * d, 0.8); fadeIn(label(g, "FIVE LIVES LOST", CX, 700, 60, C.white), a + 0.65 * d, 0.8);
      }
      // 5: chapter 1, the weight of the air, one atmosphere
      {
        const { g, B, a, d } = D(5);
        chapter(g, "ONE", "THE WEIGHT OF THE OCEAN", a, d * 0.5);
        const p = stick(g, CX, 740, 1.4); fadeIn(p, a + 0.4 * d);
        const ar = []; for (let i = 0; i < 7; i++) { const x = CX - 300 + i * 100, q = E("g", { opacity: 0 }, g); arrowLine(q, x, 330, x, 440, C.sky, 9); ar.push(q); }
        U.push((t) => { if (!inR(t, B, 0.2)) return; ar.forEach((q, i) => { const f = (((t - a) * 0.8 + i * 0.13) % 1 + 1) % 1; q.setAttribute("transform", `translate(0,${(f * 50).toFixed(1)})`); q.setAttribute("opacity", (clamp((t - a - 0.45 * d) / 0.5) * Math.sin(Math.PI * f)).toFixed(2)); }); });
        pop(label(g, "AIR PRESSES DOWN", 330, 560, 54, C.white), a + 0.55 * d);
        pop(label(g, "= 1 ATMOSPHERE", 1350, 560, 62, C.yellow), a + 0.7 * d);
      }
      // 6: about 15 psi on every square inch, body pushes back
      {
        const { g, B, a, d } = D(6);
        const sq = E("rect", { x: CX - 130, y: 260, width: 260, height: 260, fill: "#F0B8A0", stroke: C.white, "stroke-width": 8, rx: 8 }, g); pop(sq, a + 0.05 * d);
        pop(label(g, "1 SQUARE INCH", CX + 420, 330, 48, C.white), a + 0.1 * d);
        const ins = [[CX, 90, CX, 245], [CX, 690, CX, 535], [CX - 420, 390, CX - 145, 390], [CX + 420, 390, CX + 145, 390]].map((p) => { const q = arrowLine(g, ...p, C.sky, 12); fadeIn(q, a + 0.25 * d); return q; });
        pop(label(g, "ABOUT 15 POUNDS", CX - 480, 290, 54, C.sky), a + 0.3 * d);
        const outs = [[CX + 60, 330, CX + 60, 380], [CX - 60, 450, CX - 60, 400]]; void outs;
        const back = E("g", {}, g); arrowLine(back, CX - 70, 390, CX - 10, 390, C.yellow, 10); arrowLine(back, CX + 70, 390, CX + 10, 390, C.yellow, 10); arrowLine(back, CX, 330, CX, 300, C.yellow, 10); arrowLine(back, CX, 450, CX, 480, C.yellow, 10);
        fadeIn(back, a + 0.55 * d); pop(label(g, "BODY PUSHES BACK", CX + 480, 520, 54, C.yellow), a + 0.6 * d);
        void ins; void B;
      }
      // 7: every 10 metres adds about one atmosphere
      {
        const { g, B, a, d } = D(7);
        seaBox(g, 120, 90, 900, 660);
        for (let i = 0; i <= 5; i++) { const y = 120 + i * 120; E("line", { x1: 120, y1: y, x2: 200, y2: y, stroke: C.white, "stroke-width": 5 }, g); label(g, i * 10 + " M", 260, y + 16, 42, C.white); }
        const sub = E("g", {}, g); titan(sub, 0, 0, 0.45);
        U.push((t) => { if (!inR(t, B, 0.2)) return; const u = ease(clamp((t - a - 0.1 * d) / (0.75 * d))); sub.setAttribute("transform", `translate(640,${(120 + u * 600).toFixed(1)})`); });
        counter(g, 1340, 360, 150, C.yellow, 1, 6, a + 0.1 * d, a + 0.85 * d, B, (v) => Math.round(v) + " ATM");
        pop(label(g, "+1 ATM EVERY 10 M", 1340, 520, 58, C.white), a + 0.2 * d); fadeIn(label(g, "SOURCE: NOAA", 1340, 600, 40, C.mute), a + 0.3 * d);
      }
      // 8: 100 m = 10 atmospheres
      {
        const { g, a, d } = D(8);
        E("line", { x1: 200, y1: 640, x2: 1500, y2: 640, stroke: C.white, "stroke-width": 6 }, g);
        growUp(g, 330, 640, 140, 42, C.sky, a + 0.1 * d); label(g, "SURFACE", 400, 710, 48, C.white); label(g, "1 ATM", 400, 570, 50, C.sky);
        for (let i = 0; i < 10; i++) { const r = growUp(g, 1000, 640 - i * 46, 300, 40, C.yellow, a + (0.25 + i * 0.045) * d, 0.25); r.setAttribute("rx", 6); }
        label(g, "100 METRES DOWN", 1150, 710, 48, C.white); pop(label(g, "10 ATM", 1150, 150, 80, C.yellow), a + 0.75 * d);
      }
      // 9: Titanic at 3,800 m, ~380-400 atm
      {
        const { g, B, a, d } = D(9);
        seaBox(g, 100, 40, 820, 700); seabed(g, 670, 104, 916); wreckBow(g, 600, 680, 0.9);
        const tick = [0, 1000, 2000, 3000, 3800];
        tick.forEach((v) => { const y = 60 + (v / 3800) * 570; E("line", { x1: 100, y1: y, x2: 160, y2: y, stroke: C.white, "stroke-width": 5 }, g); label(g, fmtN(v) + " M", 260, y + 16, 40, v === 3800 ? C.yellow : C.white); });
        const mk = E("circle", { cx: 470, cy: 60, r: 18, fill: C.yellow, stroke: C.ink, "stroke-width": 4 }, g);
        U.push((t) => { if (!inR(t, B, 0.2)) return; mk.setAttribute("cy", (60 + ease(clamp((t - a - 0.05 * d) / (0.6 * d))) * 570).toFixed(1)); });
        pop(label(g, "TITANIC", 600, 610, 46, C.white), a + 0.5 * d);
        counter(g, 1300, 360, 140, C.yellow, 1, 380, a + 0.05 * d, a + 0.65 * d, B, (v) => fmtN(v) + " ATM");
        pop(label(g, "ROUGHLY 380 TO 400", 1300, 500, 60, C.white), a + 0.7 * d);
      }
      // 10: more than two tonnes per square inch
      {
        const { g, B, a, d } = D(10);
        E("rect", { x: CX - 120, y: 560, width: 240, height: 120, fill: "#2A2F4A", stroke: C.white, "stroke-width": 7 }, g);
        label(g, "1 SQ INCH OF HULL", CX, 740, 48, C.white);
        const wgt = E("g", {}, g); E("path", { d: `M${CX - 200},400 L${CX + 200},400 L${CX + 160},250 L${CX - 160},250 Z`, fill: C.mute, stroke: C.ink, "stroke-width": 6 }, wgt);
        E("rect", { x: CX - 50, y: 200, width: 100, height: 60, rx: 20, fill: "none", stroke: C.mute, "stroke-width": 16 }, wgt); T(wgt, "2+ TONNES", CX, 360, 64, C.navyD, { sw: 0 });
        tl.fromTo(wgt, { y: -400 }, { y: 160, duration: 0.45, ease: "bounce.out" }, a + 0.15 * d);
        counter(g, 300, 420, 90, C.yellow, 0, 5600, a + 0.2 * d, a + 0.7 * d, B, (v) => "~" + fmtN(Math.round(v / 100) * 100)); label(g, "POUNDS PER", 300, 500, 46, C.white); label(g, "SQUARE INCH", 300, 552, 46, C.white);
        pop(label(g, "380 ATM AT 14.7 PSI", 1380, 450, 56, C.sky), a + 0.6 * d);
      }
      // 11: squeezes from every direction, searching for the weakest point
      {
        const { g, B, a, d } = D(11);
        const c = E("circle", { cx: CX, cy: 390, r: 200, fill: C.navyD, stroke: C.white, "stroke-width": 16 }, g); void c;
        squeeze(g, CX, 390, 200, 16, B, C.sky, 110, 16);
        const sp = E("circle", { cx: CX + 141, cy: 390 - 141, r: 22, fill: C.red }, g); const gl = E("circle", { cx: CX + 141, cy: 249, r: 60, fill: C.red, opacity: 0 }, g);
        pop(sp, a + 0.55 * d); U.push((t) => { if (!inR(t, B, 0.2)) return; gl.setAttribute("opacity", (clamp((t - a - 0.55 * d) / 0.3) * (0.25 + 0.2 * Math.sin((t - a) * 8))).toFixed(2)); });
        pop(label(g, "EVERY DIRECTION", 260, 400, 60, C.white), a + 0.15 * d);
        pop(label(g, "WEAKEST POINT?", 1400, 220, 60, C.red), a + 0.6 * d);
      }
      // 12: chapter 2, spheres
      {
        const { g, a, d } = D(12);
        chapter(g, "TWO", "WHY THE DEEP LOVES SPHERES", a, d);
        const s = sphere(g, CX, 560, 170, C.sky, 24); pop(s, a + 0.45 * d);
        pop(label(g, "ONE SHAPE", 1360, 580, 64, C.yellow), a + 0.6 * d);
      }
      // 13: load shared equally
      {
        const { g, B, a, d } = D(13);
        sphere(g, CX, 390, 200, C.green, 26); squeeze(g, CX, 390, 200, 12, B, C.sky, 110, 10);
        pop(label(g, "SAME PUSH", 270, 300, 60, C.sky), a + 0.2 * d); pop(label(g, "EVERYWHERE", 270, 370, 60, C.sky), a + 0.25 * d);
        pop(label(g, "LOAD SHARED", 1420, 340, 64, C.green), a + 0.5 * d); pop(label(g, "EQUALLY", 1420, 420, 64, C.green), a + 0.55 * d);
      }
      // 14: corners vs smooth compression
      {
        const { g, B, a, d } = D(14);
        E("rect", { x: 230, y: 200, width: 360, height: 300, fill: C.navyD, stroke: C.white, "stroke-width": 14 }, g);
        const hot = [[230, 200], [590, 200], [230, 500], [590, 500]].map(([x, y]) => E("circle", { cx: x, cy: y, r: 34, fill: C.red, opacity: 0 }, g));
        U.push((t) => { if (!inR(t, B, 0.2)) return; hot.forEach((h) => h.setAttribute("opacity", (clamp((t - a - 0.2 * d) / 0.4) * (0.6 + 0.35 * Math.sin((t - a) * 7))).toFixed(2))); });
        label(g, "CORNERS", 410, 600, 60, C.red); label(g, "STRESS PILES UP", 410, 670, 48, C.white);
        const s = E("g", {}, g); sphere(s, 1270, 350, 160, C.green, 22); squeeze(s, 1270, 350, 160, 10, B, C.sky, 70, 8, 7); pop(s, a + 0.45 * d);
        pop(label(g, "SPHERE", 1270, 600, 60, C.green), a + 0.5 * d); pop(label(g, "EVEN COMPRESSION", 1270, 670, 48, C.white), a + 0.55 * d);
      }
      // 15: Trieste 1960, steel sphere, deepest point
      {
        const { g, B, a, d } = D(15);
        seaBox(g, 100, 40, 820, 700); seabed(g, 690, 104, 916);
        const tr = E("g", {}, g);
        E("path", { d: "M-150,-40 Q-150,-90 -60,-90 L90,-90 Q160,-90 160,-40 Q160,0 90,0 L-60,0 Q-150,0 -150,-40 Z", fill: C.mute, stroke: C.white, "stroke-width": 5 }, tr);
        E("circle", { cx: 0, cy: 40, r: 38, fill: C.navyD, stroke: C.yellow, "stroke-width": 9 }, tr);
        U.push((t) => { if (!inR(t, B, 0.2)) return; const u = ease(clamp((t - a - 0.05 * d) / (0.7 * d))); tr.setAttribute("transform", `translate(510,${(150 + u * 440).toFixed(1)})`); });
        pop(label(g, "TRIESTE, 1960", 1300, 200, 80, C.white), a + 0.08 * d);
        counter(g, 1300, 380, 110, C.yellow, 0, 10916, a + 0.05 * d, a + 0.75 * d, B, (v) => fmtN(v) + " M");
        pop(label(g, "STEEL SPHERE", 1300, 520, 64, C.yellow), a + 0.45 * d); fadeIn(label(g, "CHALLENGER DEEP", 1300, 600, 48, C.white), a + 0.6 * d);
      }
      // 16: Alvin, titanium sphere, three people, ~3 inch walls
      {
        const { g, a, d } = D(16);
        const s = sphere(g, 620, 390, 240, C.sky, 30); pop(s, a + 0.05 * d);
        [[540, 450], [700, 450], [620, 330]].forEach(([x, y], i) => pop(E("circle", { cx: x, cy: y, r: 36, fill: C.yellow }, g), a + (0.25 + 0.08 * i) * d));
        pop(label(g, "3 PEOPLE", 620, 720, 58, C.yellow), a + 0.4 * d);
        const ar = arrowLine(g, 1080, 260, 870, 300, C.white, 8); fadeIn(ar, a + 0.55 * d);
        pop(label(g, "ALVIN", 1340, 200, 90, C.white), a + 0.1 * d);
        pop(label(g, "TITANIUM WALL", 1340, 300, 58, C.sky), a + 0.55 * d); pop(label(g, "NEARLY 3 INCHES", 1340, 370, 58, C.sky), a + 0.62 * d);
      }
      // 17: rated 6,500 m, tested to 8,000 m
      {
        const { g, a, d } = D(17);
        label(g, "RATED", 220, 320, 56, C.white); growBar(g, 380, 270, 6500 / 8000 * 1100, 80, C.sky, a + 0.1 * d); pop(label(g, "6,500 M", 380 + 6500 / 8000 * 550, 330, 56, C.navyD, { sw: 0 }), a + 0.4 * d);
        label(g, "TESTED", 220, 520, 56, C.white); growBar(g, 380, 470, 1100, 80, C.yellow, a + 0.5 * d); pop(label(g, "8,000 M", 930, 530, 56, C.navyD, { sw: 0 }), a + 0.75 * d);
        pop(label(g, "ALVIN'S SPHERE", CX, 150, 64, C.white), a + 0.05 * d);
      }
      // 18: margin, stronger than the ocean
      {
        const { g, a, d } = D(18);
        E("line", { x1: 300, y1: 680, x2: 1380, y2: 680, stroke: C.white, "stroke-width": 6 }, g);
        growUp(g, 450, 680, 260, 300, C.sky, a + 0.1 * d); label(g, "OCEAN LOAD", 580, 740, 50, C.white);
        growUp(g, 970, 680, 260, 520, C.green, a + 0.3 * d); label(g, "HULL STRENGTH", 1100, 740, 50, C.white);
        const m = E("g", {}, g); E("line", { x1: 760, y1: 380, x2: 1230, y2: 380, stroke: C.yellow, "stroke-width": 5, "stroke-dasharray": "14 10" }, m);
        arrowLine(m, 1300, 380, 1300, 168, C.yellow, 8); arrowLine(m, 1300, 168, 1300, 380, C.yellow, 8); T(m, "MARGIN", 1450, 295, 64, C.yellow);
        fadeIn(m, a + 0.55 * d); pop(checkMark(g, 1100, 100, 40), a + 0.7 * d);
      }
      // 19: classification engineer: no cylinder crew hull deeper than 1,000 m
      {
        const { g, B, a, d } = D(19);
        seaBox(g, 100, 40, 1480, 700);
        const y1k = 40 + 700 * 1000 / 4000; E("line", { x1: 100, y1: y1k, x2: 1580, y2: y1k, stroke: C.red, "stroke-width": 7, "stroke-dasharray": "20 12" }, g);
        label(g, "1,000 M", 230, y1k - 20, 48, C.red);
        const cyl = E("g", {}, g); titan(cyl, 0, 0, 0.5);
        U.push((t) => { if (!inR(t, B, 0.2)) return; const u = ease(clamp((t - a - 0.1 * d) / (0.4 * d))); cyl.setAttribute("transform", `translate(560,${(80 + u * (y1k - 130)).toFixed(1)})`); });
        const sp = E("g", {}, g); sphere(sp, 0, 0, 60, C.sky, 12);
        U.push((t) => { if (!inR(t, B, 0.2)) return; const u = ease(clamp((t - a - 0.1 * d) / (0.7 * d))); sp.setAttribute("transform", `translate(1180,${(110 + u * 520).toFixed(1)})`); });
        pop(label(g, "CYLINDERS: NOT SEEN BELOW", 620, 450, 54, C.white), a + 0.5 * d); pop(label(g, "SPHERES GO DEEPER", 1180, 450, 48, C.sky), a + 0.6 * d);
        fadeIn(label(g, "ABS ENGINEER, TO INVESTIGATORS", 620, 520, 40, C.mute), a + 0.55 * d);
      }
      // 20: Titan was a cylinder, almost 4x deeper
      {
        const { g, B, a, d } = D(20);
        const sub = titan(g, CX, 230, 1.1); pop(sub, a + 0.05 * d);
        E("line", { x1: 200, y1: 560, x2: 1480, y2: 560, stroke: C.white, "stroke-width": 6 }, g);
        growBar(g, 200, 600, 1280 * 1000 / 3800, 60, C.red, a + 0.3 * d); label(g, "1,000 M", 200 + 640 * 1000 / 3800, 720, 46, C.red);
        growBar(g, 200, 470, 1280, 60, C.yellow, a + 0.45 * d); pop(label(g, "3,800 M", 1380, 450, 50, C.yellow), a + 0.75 * d);
        pop(label(g, "ALMOST 4 TIMES DEEPER", 1000, 720, 64, C.yellow), a + 0.75 * d); void B;
      }
      // 21: chapter 3, room for five vs three
      {
        const { g, a, d } = D(21);
        chapter(g, "THREE", "A HULL MADE OF CARBON", a, d * 0.5);
        const s = E("g", {}, g); sphere(s, 400, 540, 150, C.sky, 18); [[340, 580], [460, 580], [400, 490]].forEach(([x, y]) => E("circle", { cx: x, cy: y, r: 30, fill: C.yellow }, s));
        pop(s, a + 0.35 * d); pop(label(g, "SPHERE: ABOUT 3", 400, 750, 54, C.white), a + 0.4 * d);
        const tb = E("g", {}, g); E("rect", { x: 900, y: 450, width: 640, height: 190, rx: 90, fill: C.navyD, stroke: C.white, "stroke-width": 14 }, tb);
        for (let i = 0; i < 5; i++) E("circle", { cx: 1000 + i * 110, cy: 545, r: 30, fill: C.yellow }, tb);
        pop(tb, a + 0.55 * d); pop(label(g, "TUBE: ROOM FOR 5", 1220, 750, 54, C.yellow), a + 0.6 * d);
      }
      // 22: the tube, about 8 ft, titanium domes bolted on
      {
        const { g, a, d } = D(22);
        const s = titan(g, CX, 380, 1.7); pop(s, a + 0.05 * d);
        const dm = E("g", {}, g); arrowLine(dm, 260, 170, 400, 300, C.sky, 8); arrowLine(dm, 1420, 170, 1290, 300, C.sky, 8); T(dm, "TITANIUM DOME", 250, 140, 52, C.sky); T(dm, "TITANIUM DOME", 1430, 140, 52, C.sky);
        fadeIn(dm, a + 0.4 * d);
        const ln = E("g", {}, g); arrowLine(ln, CX, 620, CX - 340, 620, C.yellow, 7); arrowLine(ln, CX, 620, CX + 340, 620, C.yellow, 7); T(ln, "ABOUT 8 FEET", CX, 700, 60, C.yellow);
        fadeIn(ln, a + 0.2 * d);
      }
      // 23: five layers, each about an inch, five inches total
      {
        const { g, a, d } = D(23);
        const L = wall(g, 300, 140, 760, 500, 5);
        L.forEach((k, i) => tl.fromTo(k, { x: -900, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: "power3.out" }, a + (0.08 + 0.1 * i) * d));
        for (let i = 0; i < 5; i++) fadeIn(label(g, "LAYER " + (i + 1), 1200, 205 + i * 100, 46, C.white), a + (0.12 + 0.1 * i) * d);
        const br = E("g", {}, g); E("path", { d: "M1360,145 Q1400,145 1400,190 L1400,345 Q1400,390 1430,390 Q1400,390 1400,435 L1400,590 Q1400,635 1360,635", fill: "none", stroke: C.yellow, "stroke-width": 7 }, br);
        T(br, "5 IN", 1530, 410, 72, C.yellow); fadeIn(br, a + 0.65 * d);
        pop(label(g, "CARBON FIBRE, GLUED", 680, 730, 56, C.yellow), a + 0.7 * d);
      }
      // 24: strong in tension
      {
        const { g, B, a, d } = D(24);
        const fib = E("g", {}, g); for (let i = 0; i < 6; i++) E("line", { x1: 450, y1: 300 + i * 22, x2: 1230, y2: 300 + i * 22, stroke: i % 2 ? C.white : "#C9D2FF", "stroke-width": 10, "stroke-linecap": "round" }, fib);
        const l = arrowLine(g, 430, 355, 200, 355, C.yellow, 14), r = arrowLine(g, 1250, 355, 1480, 355, C.yellow, 14);
        U.push((t) => { if (!inR(t, B, 0.2)) return; const f = 10 * Math.sin((t - a) * 4); l.setAttribute("transform", `translate(${-f},0)`); r.setAttribute("transform", `translate(${f},0)`); });
        pop(label(g, "PULL: VERY STRONG", CX, 560, 72, C.green), a + 0.3 * d); pop(checkMark(g, CX, 670, 48), a + 0.45 * d);
        fadeIn(label(g, "RACING CARS, AIRCRAFT", CX, 210, 52, C.white), a + 0.55 * d);
      }
      // 25: the deep crushes, layered material behaves differently
      {
        const { g, B, a, d } = D(25);
        const wg = E("g", {}, g); const L = wall(wg, 460, 300, 760, 240, 5); void L;
        tl.fromTo(wg, { scaleY: 1, svgOrigin: "840 420" }, { scaleY: 0.9, svgOrigin: "840 420", duration: 0.8, ease: "sine.inOut", yoyo: true, repeat: 3 }, a + 0.3 * d);
        for (let i = 0; i < 5; i++) { const x = 520 + i * 160; arrowLine(g, x, 150, x, 280, C.sky, 10); arrowLine(g, x, 690, x, 560, C.sky, 10); }
        pop(label(g, "CRUSH", 260, 440, 80, C.sky), a + 0.1 * d); pop(label(g, "?", 1420, 460, 140, C.yellow), a + 0.55 * d); void B;
      }
      // 26: delamination
      {
        const { g, B, a, d } = D(26);
        const L = wall(g, 360, 170, 960, 400, 5);
        U.push((t) => { if (!inR(t, B, 0.2)) return; const u = ease(clamp((t - a - 0.2 * d) / (0.4 * d))); L.forEach((k, i) => k.setAttribute("transform", `translate(0,${((i - 2) * 26 * u).toFixed(1)})`)); });
        for (let i = 0; i < 4; i++) fadeIn(E("line", { x1: 380, y1: 248 + i * 80, x2: 1300, y2: 248 + i * 80, stroke: C.red, "stroke-width": 8, "stroke-dasharray": "30 14" }, g), a + 0.45 * d);
        slam(label(g, "DELAMINATION", CX, 720, 96, C.red), a + 0.4 * d); pop(label(g, "LAYERS SEPARATE", CX, 100, 56, C.white), a + 0.1 * d);
      }
      // 27: damage hides inside
      {
        const { g, B, a, d } = D(27);
        const L = wall(g, 300, 200, 1080, 380, 5); void L;
        const gap = E("rect", { x: 520, y: 488, width: 520, height: 14, rx: 7, fill: C.red }, g);
        const sh = E("rect", { x: 300, y: 200, width: 1080, height: 380, fill: C.navy, opacity: 1 }, g);
        U.push((t) => { if (!inR(t, B, 0.2)) return; const u = clamp((t - a - 0.4 * d) / (0.35 * d)); sh.setAttribute("opacity", (1 - 0.9 * u).toFixed(2)); });
        E("rect", { x: 300, y: 200, width: 1080, height: 380, fill: "none", stroke: C.white, "stroke-width": 6 }, g);
        pop(label(g, "OUTSIDE: LOOKS FINE", CX, 130, 62, C.white), a + 0.05 * d);
        pop(label(g, "INSIDE: HIDDEN DAMAGE", CX, 690, 66, C.red), a + 0.6 * d); void gap;
      }
      // 28: fatigue, squeeze and release, flaws grow
      {
        const { g, B, a, d } = D(28);
        E("line", { x1: 160, y1: 420, x2: 1520, y2: 420, stroke: C.mute, "stroke-width": 4 }, g);
        const wv = E("path", { d: "", fill: "none", stroke: C.sky, "stroke-width": 9, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
        label(g, "SQUEEZE", 100, 300, 44, C.sky, { anchor: "start" }); label(g, "RELEASE", 100, 560, 44, C.sky, { anchor: "start" });
        const cr = E("path", { d: "", fill: "none", stroke: C.red, "stroke-width": 10, "stroke-linecap": "round" }, g);
        U.push((t) => { if (!inR(t, B, 0.2)) return; const u = clamp((t - a) / (0.85 * d)), x1 = 160 + 1360 * u;
          let p = ""; for (let x = 160; x <= x1; x += 8) p += (p ? " L" : "M") + x + "," + (420 - 110 * Math.sin(((x - 160) / 136) * TAU)).toFixed(1); wv.setAttribute("d", p);
          const n = Math.floor(u * 10), L2 = 20 + n * 30; cr.setAttribute("d", `M840,640 l${L2 * 0.4},${-L2 * 0.12} l${L2 * 0.3},${L2 * 0.1} l${L2 * 0.3},${-L2 * 0.08}`); });
        pop(label(g, "FLAWS CAN GROW", 600, 700, 56, C.red), a + 0.45 * d); slam(label(g, "FATIGUE", 1400, 180, 96, C.yellow), a + 0.7 * d);
      }
      // 29: no analysis of how many dives the hull could survive
      {
        const { g, a, d } = D(29);
        E("line", { x1: 300, y1: 640, x2: 1300, y2: 640, stroke: C.white, "stroke-width": 7 }, g); E("line", { x1: 300, y1: 640, x2: 300, y2: 140, stroke: C.white, "stroke-width": 7 }, g);
        label(g, "NUMBER OF DIVES", 800, 715, 50, C.white); label(g, "STRENGTH", 230, 400, 46, C.white, { anchor: "middle" }).setAttribute("transform", "rotate(-90 230 400)");
        const q = E("path", { d: "M300,190 C600,200 800,260 1000,420", fill: "none", stroke: C.sky, "stroke-width": 9, "stroke-dasharray": "18 14" }, g); fadeIn(q, a + 0.1 * d);
        pop(label(g, "?", 1080, 470, 160, C.yellow), a + 0.3 * d);
        pop(crossMark(g, 1430, 300, 60), a + 0.55 * d); pop(label(g, "NEVER", 1430, 430, 56, C.red), a + 0.6 * d); pop(label(g, "ANALYSED", 1430, 495, 56, C.red), a + 0.62 * d);
      }
      // 30: real-time monitoring, eight clusters of sensors
      {
        const { g, a, d } = D(30);
        E("circle", { cx: 600, cy: 390, r: 260, fill: C.navyD, stroke: "#4E5578", "stroke-width": 50 }, g);
        for (let i = 0; i < 8; i++) { const th = (i / 8) * TAU - Math.PI / 2, x = 600 + Math.cos(th) * 205, y = 390 + Math.sin(th) * 205;
          const k = E("g", {}, g); E("circle", { cx: x, cy: y, r: 22, fill: C.yellow, stroke: C.ink, "stroke-width": 4 }, k); pop(k, a + (0.15 + 0.05 * i) * d); }
        pop(label(g, "8", 600, 430, 120, C.yellow), a + 0.55 * d);
        pop(label(g, "ACOUSTIC SENSORS", 1260, 330, 60, C.white), a + 0.5 * d); pop(label(g, "+ STRAIN GAUGES", 1260, 410, 60, C.white), a + 0.58 * d);
        fadeIn(label(g, "REAL-TIME MONITORING", 1260, 520, 48, C.sky), a + 0.65 * d);
      }
      // 31: listen for cracking fibres, warn the crew
      {
        const { g, B, a, d } = D(31);
        const L = wall(g, 140, 250, 520, 300, 5); void L;
        E("path", { d: "M330,400 l40,-20 l30,25 l40,-18", fill: "none", stroke: C.red, "stroke-width": 9 }, g);
        const rs = [0, 1, 2].map(() => E("circle", { cx: 400, cy: 400, r: 10, fill: "none", stroke: C.yellow, "stroke-width": 6, opacity: 0 }, g));
        U.push((t) => { if (!inR(t, B, 0.2)) return; rs.forEach((c, k) => { const f = (((t - a) * 0.7 + k / 3) % 1 + 1) % 1; c.setAttribute("r", 20 + f * 360); c.setAttribute("opacity", (0.8 * (1 - f) * clamp((t - a - 0.1 * d) / 0.3)).toFixed(2)); }); });
        const scr = E("g", {}, g); E("rect", { x: 980, y: 180, width: 560, height: 340, rx: 20, fill: C.navyD, stroke: C.white, "stroke-width": 8 }, scr);
        const sp = E("path", { d: "", fill: "none", stroke: C.yellow, "stroke-width": 6 }, scr);
        U.push((t) => { if (!inR(t, B, 0.2)) return; let p = ""; for (let x = 1000; x <= 1520; x += 10) { const k = Math.abs(x - (1000 + ((t - a) * 160) % 520)) < 30 ? 120 : 14; p += (p ? " L" : "M") + x + "," + (350 - k * Math.abs(Math.sin(x * 0.7))).toFixed(1); } sp.setAttribute("d", p); });
        pop(scr, a + 0.2 * d); pop(bubble(g, 1260, 640, "TURN BACK", 60, C.yellow), a + 0.6 * d);
        pop(label(g, "LISTEN FOR CRACKS", 400, 680, 56, C.white), a + 0.1 * d);
      }
      // 32: a warning only helps if someone acts
      {
        const { g, B, a, d } = D(32);
        const scr = E("g", {}, g); E("rect", { x: 220, y: 160, width: 600, height: 380, rx: 22, fill: C.navyD, stroke: C.white, "stroke-width": 8 }, scr);
        const bl = warn(scr, 520, 360, 1.8, C.red);
        U.push((t) => { if (!inR(t, B, 0.2)) return; bl.setAttribute("opacity", (0.4 + 0.6 * (Math.sin((t - a) * 6) > 0 ? 1 : 0)).toFixed(2)); });
        pop(scr, a + 0.05 * d);
        const ar = arrowLine(g, 880, 350, 1120, 350, C.white, 10); fadeIn(ar, a + 0.35 * d);
        pop(label(g, "ACTION?", 1340, 380, 100, C.yellow), a + 0.45 * d);
        pop(label(g, "STUDY IT. ACT ON IT.", CX, 700, 64, C.white), a + 0.5 * d);
      }
      // 33: chapter 4, the warnings
      {
        const { g, a, d } = D(33);
        chapter(g, "FOUR", "THE WARNINGS", a, d);
        [470, 840, 1210].forEach((x, i) => pop(warn(g, x, 560, 1.5), a + (0.4 + 0.12 * i) * d));
      }
      // 34: 2018 internal safety report, fired days later
      {
        const { g, a, d } = D(34);
        const dc = docIcon(g, 520, 390, 1.9, "SAFETY"); pop(dc, a + 0.05 * d);
        pop(label(g, "JANUARY 2018", 520, 120, 66, C.yellow), a + 0.1 * d);
        pop(label(g, "INTERNAL REPORT", 1220, 300, 64, C.white), a + 0.25 * d); fadeIn(label(g, "DIRECTOR OF MARINE OPERATIONS", 1220, 370, 44, C.sky), a + 0.3 * d);
        slam(label(g, "FIRED DAYS LATER", 1220, 560, 76, C.red), a + 0.65 * d);
      }
      // 35: 20+ professionals signed a letter
      {
        const { g, B, a, d } = D(35);
        const dc = docIcon(g, 450, 400, 2, "LETTER"); pop(dc, a + 0.05 * d);
        const sig = []; for (let i = 0; i < 20; i++) { const x = 940 + (i % 5) * 140, y = 220 + Math.floor(i / 5) * 90; sig.push(E("path", { d: `M${x},${y} q20,-30 40,0 t40,0 t30,-10`, fill: "none", stroke: C.sky, "stroke-width": 6, "stroke-linecap": "round", opacity: 0 }, g)); }
        U.push((t) => { if (!inR(t, B, 0.2)) return; const n = clamp((t - a - 0.15 * d) / (0.45 * d)) * 20; sig.forEach((s, i) => s.setAttribute("opacity", i < n ? 1 : 0)); });
        counter(g, 1220, 640, 90, C.yellow, 0, 20, a + 0.15 * d, a + 0.6 * d, B, (v) => Math.round(v) + (v > 19.5 ? "+ EXPERTS" : ""));
        pop(label(g, "\"CATASTROPHIC\"", 450, 720, 60, C.red), a + 0.7 * d);
      }
      // 36: July 15, 2022, Dive 80
      {
        const { g, a, d } = D(36);
        pop(warn(g, 300, 380, 2.2, C.red), a + 0.05 * d);
        slam(label(g, "JULY 15, 2022", 1040, 330, 120, C.white), a + 0.3 * d);
        slam(label(g, "DIVE 80", 1040, 520, 140, C.yellow), a + 0.55 * d);
      }
      // 37: loud bang on the ascent
      {
        const { g, B, a, d } = D(37);
        seaBox(g, 100, 40, 1480, 700); E("line", { x1: 100, y1: 130, x2: 1580, y2: 130, stroke: C.white, "stroke-width": 5 }, g);
        const sub = E("g", {}, g); titan(sub, 0, 0, 0.6);
        U.push((t) => { if (!inR(t, B, 0.2)) return; const u = ease(clamp((t - a) / (0.5 * d))); sub.setAttribute("transform", `translate(700,${(660 - u * 380).toFixed(1)})`); });
        const bang = E("g", {}, g); const pts = []; for (let i = 0; i < 16; i++) { const th = (i / 16) * TAU, r = i % 2 ? 80 : 150; pts.push((700 + Math.cos(th) * r).toFixed(1) + "," + (280 + Math.sin(th) * r).toFixed(1)); }
        E("polygon", { points: pts.join(" "), fill: C.yellow, stroke: C.red, "stroke-width": 8, opacity: 0.85 }, bang);
        slam(bang, a + 0.5 * d); slam(label(g, "BANG", 700, 305, 90, C.red), a + 0.52 * d);
        pop(label(g, "\"AS LOUD AS", 1250, 420, 64, C.white), a + 0.65 * d); pop(label(g, "AN EXPLOSION\"", 1250, 500, 64, C.white), a + 0.68 * d);
      }
      // 38: acoustic spike, strain response changed
      {
        const { g, B, a, d } = D(38);
        const ax = (x0, y0, w, h, ttl) => { E("line", { x1: x0, y1: y0 + h, x2: x0 + w, y2: y0 + h, stroke: C.white, "stroke-width": 5 }, g); E("line", { x1: x0, y1: y0, x2: x0, y2: y0 + h, stroke: C.white, "stroke-width": 5 }, g); label(g, ttl, x0 + w / 2, y0 + h + 60, 48, C.white); };
        ax(140, 120, 640, 460, "ACOUSTIC SENSORS"); ax(920, 120, 640, 460, "STRAIN GAUGES");
        const ac = E("path", { d: "", fill: "none", stroke: C.yellow, "stroke-width": 6 }, g), R = rng(5), noise = []; for (let i = 0; i <= 64; i++) noise.push(R());
        U.push((t) => { if (!inR(t, B, 0.2)) return; const u = clamp((t - a) / (0.5 * d)); let p = ""; for (let i = 0; i <= 64 * u; i++) { const x = 140 + i * 10, spike = i === 48 ? 420 : i === 47 || i === 49 ? 180 : 10 + 30 * noise[i]; p += (p ? " L" : "M") + x + "," + (580 - spike).toFixed(1); } ac.setAttribute("d", p); });
        pop(label(g, "25,000+ MV", 620, 110, 50, C.red), a + 0.45 * d);
        const s1 = E("path", { d: "M920,580 L1240,340", fill: "none", stroke: C.sky, "stroke-width": 8 }, g); fadeIn(s1, a + 0.4 * d);
        const s2 = E("path", { d: "M1240,340 C1330,300 1380,170 1560,160", fill: "none", stroke: C.red, "stroke-width": 8 }, g); fadeIn(s2, a + 0.6 * d);
        pop(label(g, "BEFORE", 1080, 380, 44, C.sky), a + 0.45 * d); pop(label(g, "AFTER: CHANGED", 1380, 280, 44, C.red), a + 0.65 * d);
      }
      // 39: OceanGate said the hull shifted in its frame; inner layer never inspected
      {
        const { g, B, a, d } = D(39);
        const fr = E("g", {}, g); E("rect", { x: 220, y: 340, width: 880, height: 40, rx: 10, fill: C.mute }, fr); E("rect", { x: 260, y: 140, width: 26, height: 210, fill: C.mute }, fr); E("rect", { x: 1034, y: 140, width: 26, height: 210, fill: C.mute }, fr);
        const sub = E("g", {}, g); titan(sub, 0, 0, 1);
        U.push((t) => { if (!inR(t, B, 0.2)) return; const f = t - a > 0.2 * d && t - a < 0.4 * d ? 10 * Math.sin((t - a) * 40) : 0; sub.setAttribute("transform", `translate(${660 + f},250)`); });
        pop(bubble(g, 660, 110, "\"IT JUST SHIFTED\"", 54, C.white), a + 0.12 * d);
        pop(crossMark(g, 1350, 270, 60), a + 0.55 * d); pop(label(g, "INNER LAYER", 1380, 420, 60, C.red), a + 0.55 * d); pop(label(g, "NEVER INSPECTED", 1380, 490, 60, C.red), a + 0.6 * d);
        fadeIn(label(g, "OCEANGATE'S EXPLANATION", 660, 520, 46, C.mute), a + 0.2 * d);
      }
      // 40: Coast Guard: layers 1 and 2 most likely split
      {
        const { g, B, a, d } = D(40);
        const L = wall(g, 260, 160, 900, 450, 5);
        U.push((t) => { if (!inR(t, B, 0.2)) return; const u = ease(clamp((t - a - 0.3 * d) / (0.25 * d))); L[0].setAttribute("transform", `translate(0,${(-30 * u).toFixed(1)})`); });
        label(g, "LAYER 1 (INNER)", 1400, 215, 46, C.white); label(g, "LAYER 2", 1400, 305, 46, C.white);
        const sp = E("line", { x1: 280, y1: 248, x2: 1140, y2: 248, stroke: C.red, "stroke-width": 10, "stroke-dasharray": "40 16" }, g); fadeIn(sp, a + 0.4 * d);
        slam(label(g, "MOST LIKELY: LAYERS SPLIT", 710, 720, 72, C.red), a + 0.55 * d);
        fadeIn(label(g, "COAST GUARD FINDING", 1400, 450, 46, C.yellow), a + 0.1 * d);
      }
      // 41: seven months uncovered in a parking lot
      {
        const { g, B, a, d } = D(41);
        E("rect", { x: 100, y: 560, width: 1480, height: 190, fill: "#3B4060" }, g);
        for (let i = 0; i < 6; i++) E("rect", { x: 160 + i * 250, y: 640, width: 120, height: 14, fill: C.white, opacity: 0.6 }, g);
        titan(g, 700, 470, 1.1);
        const flakes = []; const R = rng(3); for (let i = 0; i < 40; i++) flakes.push([R() * 1480 + 100, R() * 700, E("circle", { r: 5 + R() * 4, fill: C.white, opacity: 0.8 }, g)]);
        U.push((t) => { if (!inR(t, B, 0.2)) return; flakes.forEach(([x, y, c], i) => { c.setAttribute("cx", x + 20 * Math.sin(t + i)); c.setAttribute("cy", ((y + (t - a) * 90) % 560) + 20); }); });
        pop(label(g, "ABOUT 7 MONTHS", 1340, 200, 80, C.yellow), a + 0.2 * d); pop(label(g, "UNCOVERED", 1340, 290, 70, C.white), a + 0.35 * d);
        fadeIn(label(g, "ST. JOHN'S, CANADA", 1340, 370, 46, C.sky), a + 0.45 * d);
      }
      // 42: temperatures from about 1 to 84 F
      {
        const { g, B, a, d } = D(42);
        const tx = 520; E("rect", { x: tx - 40, y: 100, width: 80, height: 520, rx: 40, fill: C.navyD, stroke: C.white, "stroke-width": 8 }, g); E("circle", { cx: tx, cy: 650, r: 75, fill: C.red, stroke: C.white, "stroke-width": 8 }, g);
        const merc = E("rect", { x: tx - 22, y: 400, width: 44, height: 240, rx: 22, fill: C.red }, g);
        const lv = (f) => 600 - (f / 90) * 470;
        [[84, C.red], [1, C.sky]].forEach(([f, col]) => { E("line", { x1: tx + 50, y1: lv(f), x2: tx + 130, y2: lv(f), stroke: col, "stroke-width": 6 }, g); label(g, f + " F", tx + 240, lv(f) + 20, 64, col); });
        U.push((t) => { if (!inR(t, B, 0.2)) return; const f = 42.5 + 41.5 * Math.sin((t - a) * 1.6), y = lv(f); merc.setAttribute("y", y.toFixed(1)); merc.setAttribute("height", (640 - y).toFixed(1)); });
        pop(label(g, "AIR TEMPERATURE", 1250, 330, 64, C.white), a + 0.15 * d); pop(label(g, "SWINGS", 1250, 420, 72, C.yellow), a + 0.4 * d);
        fadeIn(label(g, "FAHRENHEIT", 1250, 500, 48, C.mute), a + 0.45 * d);
      }
      // 43: back to the Titanic, summer 2023
      {
        const { g, B, a, d } = D(43);
        seaBox(g, 100, 300, 1480, 450);
        const sh = E("g", {}, g); ship(sh, 0, 0, 1.4);
        U.push((t) => { if (!inR(t, B, 0.2)) return; const u = ease(clamp((t - a) / (0.75 * d))); sh.setAttribute("transform", `translate(${(260 + u * 900).toFixed(1)},${(275 + 5 * Math.sin((t - a) * 3)).toFixed(1)})`); });
        const mk = E("g", {}, g); E("path", { d: "M1400,150 l40,60 l-80,0 z", fill: C.red }, mk); E("line", { x1: 1400, y1: 210, x2: 1400, y2: 300, stroke: C.red, "stroke-width": 8 }, mk); pop(mk, a + 0.1 * d);
        pop(label(g, "TITANIC SITE", 1400, 110, 54, C.white), a + 0.15 * d);
        pop(label(g, "SUMMER 2023", 500, 140, 90, C.yellow), a + 0.3 * d);
      }
      // 44: chapter 5, the final dive
      {
        const { g, a, d } = D(44);
        chapter(g, "FIVE", "THE FINAL DIVE", a, d * 0.5);
        pop(label(g, "SUNDAY, JUNE 18, 2023", CX, 510, 80, C.white), a + 0.35 * d);
        pop(label(g, "DIVE 88", CX, 650, 100, C.yellow), a + 0.6 * d);
      }
      // 45: names of the five aboard
      {
        const { g, a, d } = D(45);
        const names = ["STOCKTON RUSH (PILOT)", "PAUL-HENRI NARGEOLET", "HAMISH HARDING", "SHAHZADA DAWOOD", "SULEMAN DAWOOD"];
        label(g, "ON BOARD", CX, 90, 56, C.yellow);
        names.forEach((n, i) => { const y = 200 + i * 118; fadeIn(E("circle", { cx: 470, cy: y - 22, r: 14, fill: C.yellow }, g), a + (0.08 + 0.13 * i) * d, 0.6); fadeIn(label(g, n, 520, y, 66, C.white, { anchor: "start" }), a + (0.08 + 0.13 * i) * d, 0.6); });
      }
      // 46: descent at ~33 m/min, text messages to the Polar Prince
      {
        const { g, B, a, d } = D(46);
        seaBox(g, 100, 130, 1480, 620); ship(g, 400, 120, 1.1); label(g, "POLAR PRINCE", 400, 60, 46, C.white);
        const sub = E("g", {}, g); titan(sub, 0, 0, 0.5);
        U.push((t) => { if (!inR(t, B, 0.2)) return; const u = clamp((t - a) / d); sub.setAttribute("transform", `translate(1000,${(250 + u * 380).toFixed(1)})`); });
        const bs = [0, 1, 2].map((k) => { const q = E("g", { opacity: 0 }, g); bubble(q, 0, 0, "TEXT", 40, C.yellow); return q; });
        U.push((t) => { if (!inR(t, B, 0.2)) return; bs.forEach((q, k) => { const f = (((t - a) * 0.35 + k / 3) % 1 + 1) % 1; q.setAttribute("transform", `translate(${(1000 - f * 560).toFixed(1)},${(560 - f * 360).toFixed(1)})`); q.setAttribute("opacity", (Math.sin(Math.PI * f) * clamp((t - a - 0.2 * d) / 0.4)).toFixed(2)); }); });
        pop(label(g, "~33 M PER MINUTE", 1280, 70, 60, C.yellow), a + 0.15 * d);
      }
      // 47: no voice link, typed messages carried as sound
      {
        const { g, B, a, d } = D(47);
        const mic = E("g", {}, g); E("rect", { x: 230, y: 180, width: 120, height: 200, rx: 60, fill: "none", stroke: C.white, "stroke-width": 10 }, mic); E("path", { d: "M190,300 Q190,450 290,450 Q390,450 390,300", fill: "none", stroke: C.white, "stroke-width": 10 }, mic); E("line", { x1: 290, y1: 450, x2: 290, y2: 520, stroke: C.white, "stroke-width": 10 }, mic);
        pop(mic, a + 0.05 * d); pop(crossMark(g, 380, 200, 50), a + 0.15 * d); pop(label(g, "NO VOICE", 290, 640, 64, C.red), a + 0.15 * d);
        const wv = E("path", { d: "", fill: "none", stroke: C.sky, "stroke-width": 8, "stroke-linecap": "round" }, g);
        U.push((t) => { if (!inR(t, B, 0.2)) return; wv.setAttribute("d", wavePath(650, 1500, 420, 50, 120, (t - a) * 8)); });
        fadeIn(wv, a + 0.35 * d); pop(bubble(g, 1080, 260, "DROPPED TWO WTS", 52, C.yellow), a + 0.45 * d);
        pop(label(g, "TYPED TEXT, SENT AS SOUND", 1080, 620, 60, C.white), a + 0.6 * d);
      }
      // 48: 10:47:02, dropped two weights
      {
        const { g, B, a, d } = D(48);
        clockFace(g, 300, 330, 180, B, 2);
        pop(label(g, "10:47:02", 300, 640, 90, C.yellow), a + 0.05 * d);
        const sub = titan(g, 1100, 260, 0.9); void sub;
        [[1020, 330], [1180, 330]].forEach(([x, y]) => { const w = E("rect", { x: x - 30, y, width: 60, height: 50, rx: 8, fill: C.mute, stroke: C.ink, "stroke-width": 4 }, g);
          tl.fromTo(w, { attr: { y } }, { attr: { y: y + 200 }, duration: 1.4, ease: "power2.in" }, a + 0.35 * d); });
        pop(bubble(g, 1100, 120, "DROPPED TWO WTS", 52, C.white), a + 0.2 * d);
        pop(label(g, "NORMAL STEP: SLOW DOWN", 1100, 720, 56, C.green), a + 0.55 * d);
      }
      // 49: 3,341 m; six seconds later final position ping
      {
        const { g, B, a, d } = D(49);
        counter(g, 450, 330, 150, C.yellow, 3000, 3341, a + 0.02 * d, a + 0.35 * d, B, (v) => fmtN(v) + " M");
        label(g, "DEPTH", 450, 430, 56, C.white);
        const rs = [0, 1, 2].map(() => E("circle", { cx: 1200, cy: 380, r: 10, fill: "none", stroke: C.sky, "stroke-width": 7, opacity: 0 }, g));
        U.push((t) => { if (!inR(t, B, 0.2)) return; const on = clamp((t - a - 0.5 * d) / 0.3); rs.forEach((c, k) => { const f = (((t - a) * 0.6 + k / 3) % 1 + 1) % 1; c.setAttribute("r", 20 + f * 260); c.setAttribute("opacity", (on * 0.85 * (1 - f)).toFixed(2)); }); });
        pop(E("circle", { cx: 1200, cy: 380, r: 24, fill: C.sky }, g), a + 0.5 * d);
        pop(label(g, "10:47:08", 1200, 690, 80, C.white), a + 0.55 * d); pop(label(g, "FINAL POSITION", 1200, 120, 60, C.sky), a + 0.55 * d);
      }
      // 50: one second later, the hull lost structural integrity (timeline, no depiction)
      {
        const { g, a, d } = D(50);
        E("line", { x1: 200, y1: 380, x2: 1480, y2: 380, stroke: C.white, "stroke-width": 8, "stroke-linecap": "round" }, g);
        [["10:47:02", 300, C.white, "TWO WEIGHTS"], ["10:47:08", 1050, C.sky, "FINAL PING"], ["10:47:09", 1380, C.red, "HULL FAILS"]].forEach(([s, x, col, sub], i) => {
          const k = E("g", {}, g); E("circle", { cx: x, cy: 380, r: 22, fill: col }, k); T(k, s, x, 300, 60, col); T(k, sub, x, 480, 46, C.white); pop(k, a + (0.05 + 0.25 * i) * d); });
        fadeIn(label(g, "LOSS OF STRUCTURAL INTEGRITY", CX, 680, 72, C.yellow), a + 0.65 * d, 0.6);
      }
      // 51: when a hull fails, the ocean drives in from every side (engineering cross-section)
      {
        const { g, B, a, d } = D(51);
        const pts = 48, cx = CX, cy = 390, R0 = 220, ring = E("path", { d: "", fill: C.navyD, stroke: C.white, "stroke-width": 14, "stroke-linejoin": "round" }, g);
        squeeze(g, cx, cy, R0, 12, B, C.sky, 100, 10);
        U.push((t) => { if (!inR(t, B, 0.2)) return; const u = ease(clamp((t - a - 0.35 * d) / (0.45 * d))); let p = "";
          for (let i = 0; i <= pts; i++) { const th = (i / pts) * TAU, r = R0 - Math.exp(-((th - 5.5) ** 2) / 0.12) * 120 * u;
            p += (i ? " L" : "M") + (cx + Math.cos(th) * r).toFixed(1) + "," + (cy + Math.sin(th) * r).toFixed(1); }
          ring.setAttribute("d", p + " Z"); });
        pop(label(g, "ONE WEAK SPOT", 280, 140, 56, C.red), a + 0.4 * d);
        pop(label(g, "THEN EVERY SIDE", 1400, 640, 56, C.yellow), a + 0.65 * d);
        pop(label(g, "NO TRICKLE", 280, 640, 56, C.white), a + 0.15 * d);
      }
      // 52: milliseconds, under 20 ms
      {
        const { g, B, a, d } = D(52);
        E("line", { x1: 200, y1: 400, x2: 1480, y2: 400, stroke: C.white, "stroke-width": 8 }, g);
        for (let i = 0; i <= 20; i += 5) { const x = 200 + i * 64; E("line", { x1: x, y1: 380, x2: x, y2: 420, stroke: C.white, "stroke-width": 6 }, g); label(g, i + " MS", x, 480, 44, C.white); }
        const bar = E("rect", { x: 200, y: 330, width: 0, height: 40, rx: 8, fill: C.yellow }, g);
        U.push((t) => { if (!inR(t, B, 0.2)) return; bar.setAttribute("width", (ease(clamp((t - a - 0.1 * d) / (0.4 * d))) * 1280).toFixed(1)); });
        counter(g, CX, 220, 120, C.yellow, 0, 20, a + 0.1 * d, a + 0.5 * d, B, (v) => "< " + Math.round(v) + " MILLISECONDS");
        pop(label(g, "1 MILLISECOND = 1/1000 OF A SECOND", CX, 620, 54, C.white), a + 0.55 * d);
        fadeIn(label(g, "ESTIMATE: ERIC FUSIL, UNIVERSITY OF ADELAIDE", CX, 700, 40, C.mute), a + 0.6 * d);
      }
      // 53: faster than the brain can process
      {
        const { g, B, a, d } = D(53);
        const br = E("g", {}, g); E("path", { d: "M300,420 C220,420 200,300 280,270 C270,200 360,160 420,190 C470,140 570,150 590,210 C670,210 700,300 660,340 C700,410 630,460 580,440 C540,480 450,480 420,450 C380,470 320,460 300,420 Z", fill: "none", stroke: C.white, "stroke-width": 10 }, br);
        E("path", { d: "M420,190 C410,260 470,300 440,360 M520,170 C500,240 560,280 540,360", fill: "none", stroke: C.white, "stroke-width": 7 }, br); pop(br, a + 0.05 * d);
        const sig = E("circle", { cx: 1500, cy: 320, r: 18, fill: C.yellow }, g); const line = E("line", { x1: 1500, y1: 320, x2: 700, y2: 320, stroke: C.mute, "stroke-width": 5, "stroke-dasharray": "10 12" }, g); void line;
        U.push((t) => { if (!inR(t, B, 0.2)) return; const u = clamp((t - a - 0.15 * d) / (0.8 * d)); sig.setAttribute("cx", (1500 - u * 300).toFixed(1)); });
        pop(label(g, "FASTER THAN THE BRAIN", 1050, 560, 76, C.yellow), a + 0.35 * d); pop(label(g, "CAN PROCESS", 1050, 650, 76, C.yellow), a + 0.4 * d);
      }
      // 54: two seconds later, the support team heard a bang
      {
        const { g, B, a, d } = D(54);
        seaBox(g, 100, 300, 1480, 450); ship(g, 640, 290, 1.5);
        const rs = [0, 1, 2].map(() => E("path", { d: "", fill: "none", stroke: C.white, "stroke-width": 6, opacity: 0 }, g));
        U.push((t) => { if (!inR(t, B, 0.2)) return; rs.forEach((c, k) => { const f = (((t - a) * 0.5 + k / 3) % 1 + 1) % 1, r = 40 + f * 400; c.setAttribute("d", arcP(640, 760, r, Math.PI * 1.15, Math.PI * 1.85)); c.setAttribute("opacity", (0.7 * (1 - f) * clamp((t - a - 0.2 * d) / 0.4)).toFixed(2)); }); });
        pop(label(g, "+2 SECONDS", 1250, 130, 80, C.yellow), a + 0.1 * d); pop(bubble(g, 640, 120, "\"WHAT WAS THAT?\"", 50, C.white), a + 0.4 * d);
        fadeIn(label(g, "NOT YET UNDERSTOOD", 1250, 230, 48, C.white), a + 0.6 * d);
      }
      // 55: messages unanswered, the alarm is raised
      {
        const { g, B, a, d } = D(55);
        for (let i = 0; i < 4; i++) pop(bubble(g, 420, 170 + i * 130, "DO YOU READ?", 48, C.white), a + (0.05 + 0.1 * i) * d);
        const q = label(g, "NO REPLY", 420, 730, 56, C.red); pop(q, a + 0.45 * d);
        const al = E("g", {}, g); E("path", { d: "M1180,500 L1180,360 Q1180,260 1280,260 Q1380,260 1380,360 L1380,500 Z", fill: C.red, stroke: C.white, "stroke-width": 8 }, al); E("rect", { x: 1150, y: 500, width: 260, height: 40, rx: 10, fill: C.white }, al);
        const gl = E("circle", { cx: 1280, cy: 380, r: 200, fill: C.red, opacity: 0 }, g);
        U.push((t) => { if (!inR(t, B, 0.2)) return; gl.setAttribute("opacity", (clamp((t - a - 0.55 * d) / 0.3) * (0.15 + 0.15 * Math.sin((t - a) * 9))).toFixed(2)); });
        pop(al, a + 0.55 * d); pop(label(g, "SEARCH BEGINS", 1280, 650, 66, C.yellow), a + 0.65 * d);
      }
      // 56: 11 vessels, 4 aircraft, 12,000+ sq nmi
      {
        const { g, B, a, d } = D(56);
        E("rect", { x: 100, y: 40, width: 900, height: 700, rx: 12, fill: "url(#seaG)", stroke: C.white, "stroke-width": 4 }, g);
        for (let i = 1; i < 6; i++) { E("line", { x1: 100 + i * 150, y1: 40, x2: 100 + i * 150, y2: 740, stroke: C.white, "stroke-width": 2, opacity: 0.25 }, g); E("line", { x1: 100, y1: 40 + i * 117, x2: 1000, y2: 40 + i * 117, stroke: C.white, "stroke-width": 2, opacity: 0.25 }, g); }
        const R = rng(9);
        for (let i = 0; i < 11; i++) pop(ship(g, 180 + R() * 740, 120 + R() * 580, 0.3), a + (0.05 + 0.03 * i) * d);
        const pl = []; for (let i = 0; i < 4; i++) { const p = E("g", {}, g); E("path", { d: "M-30,0 L30,0 M0,-28 L0,28 M-12,22 L12,22", stroke: C.yellow, "stroke-width": 8, "stroke-linecap": "round" }, p); pl.push([p, R() * 6]); }
        U.push((t) => { if (!inR(t, B, 0.2)) return; pl.forEach(([p, ph], i) => { const th = (t - a) * 0.5 + ph; p.setAttribute("transform", `translate(${(550 + Math.cos(th) * (180 + i * 50)).toFixed(1)},${(390 + Math.sin(th) * (120 + i * 40)).toFixed(1)}) rotate(${((th * 180) / Math.PI + 180).toFixed(1)})`); }); });
        pop(label(g, "11 VESSELS", 1300, 200, 72, C.white), a + 0.2 * d); pop(label(g, "4 AIRCRAFT", 1300, 300, 72, C.yellow), a + 0.35 * d);
        counter(g, 1300, 470, 84, C.sky, 0, 12145, a + 0.45 * d, a + 0.8 * d, B); label(g, "SQ NAUTICAL MILES", 1300, 540, 48, C.white);
      }
      // 57: June 22, tail cone found ~1,600 ft from the bow
      {
        const { g, B, a, d } = D(57);
        E("rect", { x: 0, y: 0, width: BW, height: BH, fill: "#070B26" }, g); seabed(g, 560); wreckBow(g, 1350, 575, 1.2);
        const tc = E("polygon", { points: "300,575 380,555 380,600 300,585", fill: C.navyL, stroke: C.white, "stroke-width": 5 }, g); void tc;
        const rov = E("g", {}, g); E("rect", { x: -60, y: -40, width: 120, height: 80, rx: 12, fill: C.yellow, stroke: C.ink, "stroke-width": 5 }, rov); E("circle", { cx: 60, cy: 0, r: 12, fill: C.white }, rov);
        const beam = E("polygon", { points: "0,0 -260,260 120,260", fill: C.white, opacity: 0 }, g);
        U.push((t) => { if (!inR(t, B, 0.2)) return; const u = ease(clamp((t - a) / (0.4 * d))), x = 900 - u * 560, y = 160 + u * 140; rov.setAttribute("transform", `translate(${x.toFixed(1)},${y.toFixed(1)})`); beam.setAttribute("transform", `translate(${x.toFixed(1)},${(y + 40).toFixed(1)})`); beam.setAttribute("opacity", (0.12 * clamp((t - a - 0.3 * d) / 0.4)).toFixed(2)); });
        const dm = E("g", {}, g); arrowLine(dm, 830, 680, 400, 680, C.yellow, 7); arrowLine(dm, 830, 680, 1180, 680, C.yellow, 7); T(dm, "ABOUT 1,600 FEET", 800, 750, 52, C.yellow); fadeIn(dm, a + 0.55 * d);
        pop(label(g, "TAIL CONE", 340, 500, 48, C.white), a + 0.45 * d); pop(label(g, "TITANIC BOW", 1350, 410, 48, C.white), a + 0.5 * d);
        pop(label(g, "JUNE 22, 2023", 1300, 110, 66, C.white), a + 0.05 * d);
      }
      // 58: debris: titanium domes, carbon fragments
      {
        const { g, a, d } = D(58);
        E("rect", { x: 0, y: 0, width: BW, height: BH, fill: "#070B26" }, g); seabed(g, 520);
        const p1 = E("path", { d: "M300,530 A90,82 0 0 1 480,530 Z", fill: C.sky, stroke: C.white, "stroke-width": 6 }, g);
        const p2 = E("path", { d: "M1180,540 A90,82 0 0 1 1360,540 Z", fill: C.sky, stroke: C.white, "stroke-width": 6 }, g);
        const R = rng(21), fr = E("g", {}, g); for (let i = 0; i < 9; i++) { const x = 620 + R() * 420, y = 520 + R() * 50; E("polygon", { points: `${x},${y} ${x + 40 + R() * 30},${y - 10} ${x + 50},${y + 18} ${x + 8},${y + 22}`, fill: "#2A2F4A", stroke: C.white, "stroke-width": 4 }, fr); }
        pop(p1, a + 0.05 * d); pop(p2, a + 0.12 * d); fadeIn(fr, a + 0.25 * d);
        pop(label(g, "TITANIUM END DOMES", 840, 200, 64, C.sky), a + 0.15 * d); pop(label(g, "CARBON FIBRE FRAGMENTS", 840, 300, 56, C.white), a + 0.3 * d);
        fadeIn(label(g, "THE SEARCH WAS OVER", 840, 720, 60, C.yellow), a + 0.65 * d, 0.6);
      }
      // 59: chapter 6, the verdict, MBI report Aug 2025
      {
        const { g, a, d } = D(59);
        chapter(g, "SIX", "THE VERDICT", a, d * 0.5);
        pop(docIcon(g, 520, 560, 1.1, "REPORT"), a + 0.35 * d);
        pop(label(g, "U.S. COAST GUARD", 1150, 480, 60, C.white), a + 0.45 * d); pop(label(g, "MARINE BOARD OF INVESTIGATION", 1150, 550, 46, C.sky), a + 0.5 * d);
        pop(label(g, "AUGUST 2025", 1150, 650, 64, C.yellow), a + 0.6 * d);
      }
      // 60: preventable
      {
        const { g, a, d } = D(60);
        slam(label(g, "PREVENTABLE", CX, 420, 200, C.yellow), a + 0.35 * d);
        fadeIn(label(g, "\"THIS LOSS OF FIVE LIVES WAS PREVENTABLE\"", CX, 600, 52, C.white), a + 0.5 * d, 0.6);
        fadeIn(label(g, "MBI CHAIR, AUGUST 2025", CX, 680, 42, C.mute), a + 0.55 * d);
      }
      // 61: design, testing, construction flawed; voids between layers
      {
        const { g, a, d } = D(61);
        ["DESIGN", "TESTING", "CONSTRUCTION"].forEach((s, i) => { pop(crossMark(g, 200, 200 + i * 150, 44), a + (0.08 + 0.12 * i) * d); pop(label(g, s, 280, 222 + i * 150, 68, C.white, { anchor: "start" }), a + (0.08 + 0.12 * i) * d); });
        const L = wall(g, 900, 160, 640, 400, 5); void L;
        [[1000, 235, 220], [1200, 395, 260]].forEach(([x, y, w]) => fadeIn(E("ellipse", { cx: x + w / 2, cy: y, rx: w / 2, ry: 12, fill: C.red }, g), a + 0.55 * d));
        pop(label(g, "GAPS BUILT IN", 1220, 650, 64, C.red), a + 0.6 * d);
      }
      // 62: warnings not investigated, culture discouraged speaking up
      {
        const { g, a, d } = D(62);
        const k1 = E("g", {}, g); warn(k1, 360, 300, 1.6); T(k1, "DIVE 80 BANG", 360, 470, 60, C.white); T(k1, "NOT INVESTIGATED", 360, 540, 54, C.red);
        pop(k1, a + 0.1 * d);
        const k2 = E("g", {}, g); bubble(k2, 1250, 280, "SAFETY CONCERN", 56, C.white); E("line", { x1: 1000, y1: 380, x2: 1500, y2: 180, stroke: C.red, "stroke-width": 14, "stroke-linecap": "round" }, k2);
        T(k2, "SPEAKING UP", 1250, 470, 60, C.white); T(k2, "DISCOURAGED", 1250, 540, 54, C.red); pop(k2, a + 0.5 * d);
        fadeIn(label(g, "TOXIC WORKPLACE CULTURE", CX, 710, 56, C.yellow), a + 0.7 * d);
      }
      // 63: no clear framework; 17 recommendations
      {
        const { g, B, a, d } = D(63);
        const lft = E("rect", { x: 100, y: 330, width: 420, height: 90, rx: 12, fill: C.sky }, g), rgt = E("rect", { x: 1160, y: 330, width: 420, height: 90, rx: 12, fill: C.sky }, g); void lft;
        const gp = label(g, "NO CLEAR RULES", CX, 300, 56, C.red); fadeIn(gp, a + 0.1 * d);
        const fill = E("rect", { x: 520, y: 330, width: 0, height: 90, fill: C.yellow }, g);
        U.push((t) => { if (!inR(t, B, 0.2)) return; fill.setAttribute("width", (ease(clamp((t - a - 0.45 * d) / (0.35 * d))) * 640).toFixed(1)); });
        void rgt;
        counter(g, CX, 600, 130, C.yellow, 0, 17, a + 0.4 * d, a + 0.8 * d, B, (v) => String(Math.round(v)));
        pop(label(g, "RECOMMENDATIONS", CX, 690, 64, C.white), a + 0.45 * d);
      }
      // 64: what did deep-sea engineering learn
      {
        const { g, a, d } = D(64);
        const s = sphere(g, CX, 360, 170, C.sky, 24); pop(s, a + 0.05 * d);
        slam(label(g, "OLD LESSONS", CX, 640, 110, C.yellow), a + 0.35 * d);
        fadeIn(label(g, "RELEARNED", CX, 735, 60, C.white), a + 0.5 * d);
      }
      // 65: prove the hull, test beyond limits with margin
      {
        const { g, a, d } = D(65);
        pop(label(g, "1. PROVE THE HULL FIRST", CX, 110, 72, C.yellow), a + 0.05 * d);
        label(g, "OPERATING DEPTH", 260, 330, 46, C.white, { anchor: "start" }); growBar(g, 700, 280, 650, 70, C.sky, a + 0.2 * d);
        label(g, "TEST DEPTH", 260, 480, 46, C.white, { anchor: "start" }); growBar(g, 700, 430, 800, 70, C.green, a + 0.4 * d);
        pop(label(g, "+ MARGIN", 1420, 600, 64, C.green), a + 0.6 * d); pop(checkMark(g, 1520, 315, 40), a + 0.7 * d);
      }
      // 66: monitoring is a backup; a bang means out of service
      {
        const { g, a, d } = D(66);
        pop(label(g, "2. MONITORING IS A BACKUP", CX, 110, 72, C.yellow), a + 0.05 * d);
        const sc = E("g", {}, g); E("rect", { x: 200, y: 220, width: 420, height: 280, rx: 18, fill: C.navyD, stroke: C.white, "stroke-width": 7 }, sc); E("path", { d: wavePath(230, 590, 360, 40, 90, 0), fill: "none", stroke: C.yellow, "stroke-width": 6 }, sc);
        T(sc, "+ INSPECTION", 410, 580, 56, C.white); pop(sc, a + 0.15 * d);
        const tg = E("g", {}, g); E("rect", { x: 980, y: 260, width: 520, height: 200, rx: 20, fill: C.red, stroke: C.white, "stroke-width": 8 }, tg); T(tg, "OUT OF", 1240, 345, 64, C.white); T(tg, "SERVICE", 1240, 425, 64, C.white);
        slam(tg, a + 0.6 * d); pop(label(g, "AFTER A BANG:", 1240, 230, 52, C.white), a + 0.55 * d);
      }
      // 67: listen to people raising concerns; physics has the final word
      {
        const { g, a, d } = D(67);
        pop(label(g, "3. LISTEN", CX, 110, 72, C.yellow), a + 0.05 * d);
        [[420, 300], [840, 260], [1260, 300]].forEach(([x, y], i) => pop(bubble(g, x, y, "CONCERN", 48, C.white), a + (0.12 + 0.08 * i) * d));
        const s = sphere(g, CX, 520, 90, C.sky, 16); pop(s, a + 0.4 * d);
        slam(label(g, "PHYSICS HAS THE FINAL WORD", CX, 720, 84, C.yellow), a + 0.55 * d);
      }
