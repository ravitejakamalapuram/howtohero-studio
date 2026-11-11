      // ===== VIDEO 4: how GPS works =====
      function pin(g, x, y, s = 1, col = C.red) { const k = E("g", { transform: `translate(${x},${y}) scale(${s})` }, g); E("path", { d: "M0,0 C-44,-52 -44,-108 0,-108 C44,-108 44,-52 0,0 Z", fill: col, stroke: C.ink, "stroke-width": 5, "stroke-linejoin": "round" }, k); E("circle", { cx: 0, cy: -70, r: 16, fill: C.white }, k); return k; }
      // beat 1 (0-9): phone with ears, satellite beams arriving
      {
        const g = beat(0), B = BT[0], a = B.a, d = B.b - B.a;
        const sx = [180, 440, 700], sats = sx.map((x, i) => sat(g, x, 395 + (i === 1 ? -10 : 8), 0.65));
        sats.forEach((s, i) => pop(s, a + 0.05 * d + i * 0.06 * d));
        phone(g, 370, 540, 140, 210); const earP = (x, dir) => E("path", { d: `M${x},${600} C${x + dir * 46},${590} ${x + dir * 46},${680} ${x},${690}`, fill: "none", stroke: C.white, "stroke-width": 9, "stroke-linecap": "round" }, g); earP(370, -1); earP(510, 1);
        E("path", { d: "M352,632 C335,640 335,654 352,662", fill: "none", stroke: C.white, "stroke-width": 6, "stroke-linecap": "round" }, g);
        const lines = sx.map((x, i) => E("line", { x1: x, y1: 440, x2: 440, y2: 536, stroke: C.yellow, "stroke-width": 6, "stroke-dasharray": "4 14", "stroke-linecap": "round", opacity: 0 }, g));
        const up = E("g", {}, g); arrowLine(up, 700, 700, 700, 590, C.mute, 8); crossMark(up, 700, 640, 34); fadeIn(up, a + 0.45 * d); fadeIn(label(g, "NEVER SENDS", 700, 740, 38, C.red), a + 0.5 * d);
        U.push((t) => { if (!inR(t, B)) return; lines.forEach((l, i) => { l.setAttribute("opacity", clamp((t - a - 0.2 * d - i * 0.05 * d) / 0.3) * 0.95); l.setAttribute("stroke-dashoffset", -((t - a) * 50)); }); });
      }
      // beat 2 (9-20): about thirty satellites orbit about 20,000 km up, each broadcasting the time
      {
        const g = beat(1), B = BT[1], a = B.a, d = B.b - B.a;
        E("circle", { cx: 440, cy: 390, r: 112, fill: C.navyL, stroke: C.white, "stroke-width": 7 }, g); E("path", { d: "M380,330 Q420,300 470,330 Q500,360 460,390 Q420,370 380,380 Z", fill: C.green, opacity: 0.7 }, g); E("path", { d: "M430,430 Q470,420 490,450 Q470,480 440,470 Z", fill: C.green, opacity: 0.7 }, g);
        const orb = [], R = rng(5);
        for (let k = 0; k < 6; k++) { const ang = k * 30; E("ellipse", { cx: 440, cy: 390, rx: 330, ry: 150, fill: "none", stroke: C.mute, "stroke-width": 2.5, opacity: 0.55, transform: `rotate(${ang} 440 390)` }, g); for (let j = 0; j < 5; j++) orb.push({ ang, ph: j / 5 + R() * 0.05, el: E("circle", { r: k === 0 && j === 0 ? 11 : 7, fill: k === 0 && j === 0 ? C.yellow : C.white }, g) }); }
        const ring = E("circle", { r: 20, fill: "none", stroke: C.yellow, "stroke-width": 4 }, g);
        pop(label(g, "ABOUT 30 SATELLITES", 440, 70, 46, C.white), a + 0.12 * d); fadeIn(label(g, "ABOUT 20,000 KM UP", 440, 660, 46, C.yellow), a + 0.36 * d); fadeIn(label(g, "EACH BROADCASTS THE EXACT TIME", 440, 725, 38, C.white), a + 0.6 * d);
        U.push((t) => { if (!inR(t, B)) return; let hx = 0, hy = 0; orb.forEach((o, i) => { const th = (o.ph + (t - a) * 0.06) * TAU, x0 = 330 * Math.cos(th), y0 = 150 * Math.sin(th), r = (o.ang * Math.PI) / 180, x = 440 + x0 * Math.cos(r) - y0 * Math.sin(r), y = 390 + x0 * Math.sin(r) + y0 * Math.cos(r); o.el.setAttribute("cx", x); o.el.setAttribute("cy", y); o.el.setAttribute("opacity", clamp((t - a) / 0.3)); if (i === 0) { hx = x; hy = y; } });
          const p = ((t - a) * 0.9) % 1; ring.setAttribute("cx", hx); ring.setAttribute("cy", hy); ring.setAttribute("r", 14 + p * 60); ring.setAttribute("opacity", (1 - p) * 0.9); });
      }
      // beat 3: extremely precise clocks, every signal carries its send time
      {
        const g = beat(2), B = BT[2], a = B.a, d = B.b - B.a;
        sat(g, 200, 400, 1.5); const ck = E("g", {}, g); E("circle", { cx: 640, cy: 400, r: 110, fill: C.navyD, stroke: C.yellow, "stroke-width": 9 }, ck);
        for (let k = 0; k < 12; k++) { const an = k * Math.PI / 6; E("line", { x1: 640 + 88 * Math.sin(an), y1: 400 - 88 * Math.cos(an), x2: 640 + 100 * Math.sin(an), y2: 400 - 100 * Math.cos(an), stroke: C.white, "stroke-width": 5, "stroke-linecap": "round" }, ck); }
        const hand = E("line", { x1: 640, y1: 400, x2: 640, y2: 332, stroke: C.yellow, "stroke-width": 8, "stroke-linecap": "round" }, ck); E("circle", { cx: 640, cy: 400, r: 9, fill: C.yellow }, ck);
        pop(ck, a + 0.1 * d); fadeIn(label(g, "EXTREMELY PRECISE CLOCKS", 440, 600, 46, C.white), a + 0.3 * d);
        const msg = E("g", {}, g); E("rect", { x: 130, y: 640, width: 620, height: 80, rx: 40, fill: C.yellow }, msg); T(msg, "SENT AT THIS EXACT TIME", 440, 698, 46, C.navyD, { sw: 0 }); pop(msg, a + 0.55 * d);
        const wv = E("path", { d: "", fill: "none", stroke: C.yellow, "stroke-width": 6, "stroke-linecap": "round", opacity: 0 }, g);
        U.push((t) => { if (!inR(t, B)) return; hand.setAttribute("transform", `rotate(${(t - a) * 150} 640 400)`); const o = clamp((t - a - 0.2 * d) / 0.4); wv.setAttribute("d", wavePath(290, 520, 400, 22, 60, (t - a) * 7)); wv.setAttribute("opacity", o * 0.9); });
      }
      // beat 3 (20-31): signal delay measured; delay x speed of light = distance
      {
        const g = beat(3), B = BT[3], a = B.a, d = B.b - B.a;
        sat(g, 200, 130, 0.9); phone(g, 130, 480, 140, 220); E("line", { x1: 200, y1: 190, x2: 200, y2: 480, stroke: C.mute, "stroke-width": 3, "stroke-dasharray": "6 10", opacity: 0.7 }, g);
        const pulse = E("circle", { cx: 200, cy: 190, r: 20, fill: C.yellow }, g), sw = E("g", {}, g); E("circle", { cx: 360, cy: 590, r: 46, fill: C.navyD, stroke: C.white, "stroke-width": 7 }, sw); E("rect", { x: 352, y: 530, width: 16, height: 12, fill: C.white }, sw); const hand = E("line", { x1: 360, y1: 590, x2: 360, y2: 560, stroke: C.yellow, "stroke-width": 6, "stroke-linecap": "round" }, sw);
        fadeIn(label(g, "DELAY", 360, 665, 38, C.yellow), a + 0.15 * d);
        const rows = [["DELAY", C.yellow], ["x", null], ["SPEED OF LIGHT", C.white], ["=", null], ["DISTANCE", C.green]];
        let y = 150; rows.forEach(([txt, col], i) => { const t0 = a + 0.2 * d + i * 0.14 * d;
          if (col) { const c = E("g", {}, g); E("rect", { x: 470, y: y - 44, width: 380, height: 78, rx: 20, fill: C.navyD, stroke: col, "stroke-width": 6 }, c); T(c, txt, 660, y + 14, 48, col, { sw: 5 }); pop(c, t0); y += 112; }
          else { const o = E("g", {}, g); if (txt === "x") { E("line", { x1: 640, y1: y - 38, x2: 680, y2: y + 2, stroke: C.white, "stroke-width": 9, "stroke-linecap": "round" }, o); E("line", { x1: 680, y1: y - 38, x2: 640, y2: y + 2, stroke: C.white, "stroke-width": 9, "stroke-linecap": "round" }, o); } else { E("line", { x1: 635, y1: y - 26, x2: 685, y2: y - 26, stroke: C.white, "stroke-width": 9, "stroke-linecap": "round" }, o); E("line", { x1: 635, y1: y - 6, x2: 685, y2: y - 6, stroke: C.white, "stroke-width": 9, "stroke-linecap": "round" }, o); } pop(o, t0); y += 70; } });
        U.push((t) => { if (!inR(t, B)) return; const u = ((t - a - 0.1 * d) * 0.3) % 1, on = t > a + 0.1 * d ? 1 : 0; pulse.setAttribute("cy", 190 + 290 * u); pulse.setAttribute("opacity", on); hand.setAttribute("transform", `rotate(${u * 360} 360 590)`); });
      }
      // beat 5: one satellite = a huge sphere of possible places
      {
        const g = beat(4), B = BT[4], a = B.a, d = B.b - B.a, S = [150, 400], R1 = 340;
        sat(g, S[0], S[1], 0.8, C.yellow); const c = E("circle", { cx: S[0], cy: S[1], r: 0, fill: "none", stroke: C.yellow, "stroke-width": 8 }, g);
        const dot = E("circle", { r: 16, fill: C.white, stroke: C.ink, "stroke-width": 4, opacity: 0 }, g);
        const dots = [-1.2, -0.7, -0.25, 0.25, 0.7, 1.2].map((an) => E("circle", { cx: S[0] + R1 * Math.cos(an), cy: S[1] + R1 * Math.sin(an), r: 12, fill: C.mute, opacity: 0 }, g));
        pop(label(g, "ONE SATELLITE", 520, 120, 46, C.yellow), a + 0.08 * d); fadeIn(label(g, "YOU ARE SOMEWHERE ON THIS SPHERE", 440, 735, 40, C.white), a + 0.55 * d);
        U.push((t) => { if (!inR(t, B)) return; const k = ease(clamp((t - a - 0.12 * d) / (0.3 * d))); c.setAttribute("r", R1 * k);
          dots.forEach((q, i) => q.setAttribute("opacity", clamp((t - a - 0.45 * d - i * 0.04 * d) / 0.2) * 0.8));
          const an = -1.2 + 2.4 * (0.5 + 0.5 * Math.sin((t - a) * 1.6)); dot.setAttribute("cx", S[0] + R1 * Math.cos(an)); dot.setAttribute("cy", S[1] + R1 * Math.sin(an)); dot.setAttribute("opacity", clamp((t - a - 0.5 * d) / 0.3)); });
      }
      // beat 6: more spheres narrow it down to two points; one is out in space, the other near Earth is you
      {
        const g = beat(5), B = BT[5], a = B.a, d = B.b - B.a, P = [450, 600], S = [[100, 380, C.yellow], [780, 420, C.white], [440, 110, C.sky]];
        const [x1, y1] = S[0], [x2, y2] = S[1], ux = x2 - x1, uy = y2 - y1, ul = Math.hypot(ux, uy), nx = -uy / ul, ny = ux / ul, dd = (P[0] - x1) * nx + (P[1] - y1) * ny, Q = [P[0] - 2 * dd * nx, P[1] - 2 * dd * ny];
        E("path", { d: "M-40,740 Q440,590 920,740", fill: C.green, opacity: 0.55 }, g);
        const cs = S.map(([x, y, col]) => { sat(g, x, y, 0.5, col); return { c: E("circle", { cx: x, cy: y, r: 0, fill: "none", stroke: col, "stroke-width": 6 }, g), r: Math.hypot(P[0] - x, P[1] - y), x, y }; });
        const q = E("g", {}, g); E("circle", { cx: Q[0], cy: Q[1], r: 13, fill: C.mute }, q); T(q, "IN SPACE", Q[0], Q[1] - 26, 40, C.mute, { sw: 5 });
        const you = E("g", {}, g); E("circle", { cx: P[0], cy: P[1], r: 30, fill: "url(#glowY)" }, you); E("circle", { cx: P[0], cy: P[1], r: 12, fill: C.yellow }, you); T(you, "YOU", P[0] + 74, P[1] + 8, 54, C.yellow, { sw: 6 });
        const dd2 = [P, Q].map(([x, y]) => E("circle", { cx: x, cy: y, r: 10, fill: C.white, opacity: 0 }, g));
        fadeIn(label(g, "TWO POINTS LEFT. ONE IS IN SPACE.", 440, 735, 38, C.white), a + 0.4 * d); pop(q, a + 0.45 * d); pop(you, a + 0.7 * d);
        U.push((t) => { if (!inR(t, B)) return; cs.forEach((o, i) => o.c.setAttribute("r", o.r * ease(clamp((t - a - (0.05 + i * 0.22) * d) / (0.22 * d))))); dd2.forEach((e) => e.setAttribute("opacity", clamp((t - a - 0.38 * d) / 0.2) * (t < a + 0.65 * d ? 1 : 0))); });
      }
      // beat 5 (41-50): a fourth satellite fixes the clock
      {
        const g = beat(6), B = BT[6], a = B.a, d = B.b - B.a, P = [470, 390], S = [[110, 100, C.yellow], [770, 120, C.white], [120, 650, C.sky], [780, 640, C.green]];
        const cs = S.map(([x, y, col], i) => { sat(g, x, y, 0.55, col); const c = E("circle", { cx: x, cy: y, r: 0, fill: "none", stroke: col, "stroke-width": 6, opacity: 0.95 }, g); return { c, r: Math.hypot(P[0] - x, P[1] - y), x, y }; });
        const ck = E("g", {}, g); E("circle", { cx: P[0], cy: P[1], r: 34, fill: C.navyD, stroke: C.yellow, "stroke-width": 7 }, ck); const hd = E("line", { x1: P[0], y1: P[1], x2: P[0], y2: P[1] - 22, stroke: C.yellow, "stroke-width": 6, "stroke-linecap": "round" }, ck);
        const note = label(g, "CLOCK OFF: CIRCLES MISS", 440, 735, 42, C.red), fix = label(g, "FOURTH SATELLITE FIXES THE CLOCK", 440, 735, 40, C.green); gsap.set(fix, { opacity: 0 });
        fadeIn(note, a + 0.12 * d); tl.fromTo(note, { opacity: 1 }, { opacity: 0, duration: 0.25, immediateRender: false }, a + 0.5 * d); fadeIn(fix, a + 0.55 * d);
        U.push((t) => { if (!inR(t, B)) return; const e = 34 * (1 - ease(clamp((t - a - 0.5 * d) / (0.3 * d)))); cs.forEach((q, i) => { const on = i < 3 ? clamp((t - a) / 0.3) : clamp((t - a - 0.4 * d) / (0.15 * d)); q.c.setAttribute("r", Math.max(0, q.r + (i < 3 ? e : 0)) * on); q.c.setAttribute("opacity", on); }); hd.setAttribute("transform", `rotate(${(t - a) * 120} ${P[0]} ${P[1]})`); });
      }
      // beat 6 (50-56): maps also use Wi-Fi and phone towers
      {
        const g = beat(7), B = BT[7], a = B.a, d = B.b - B.a;
        const pn = pin(g, 440, 400, 1.4); pop(pn, a + 0.05 * d); const rg = E("circle", { cx: 440, cy: 400, r: 20, fill: "none", stroke: C.red, "stroke-width": 5 }, g);
        const wf = E("g", { transform: "translate(150,560)" }, g); [30, 58, 86].forEach((r) => E("path", { d: arcP(0, 0, r, -2.3, -0.84), fill: "none", stroke: C.white, "stroke-width": 9, "stroke-linecap": "round" }, wf)); E("circle", { cx: 0, cy: 0, r: 9, fill: C.white }, wf);
        const tw2 = E("g", { transform: "translate(730,500)" }, g); E("path", { d: "M-40,150 L0,0 L40,150 M-26,100 H26 M-14,50 H14", fill: "none", stroke: C.white, "stroke-width": 8, "stroke-linecap": "round", "stroke-linejoin": "round" }, tw2); E("circle", { cx: 0, cy: -14, r: 10, fill: C.yellow }, tw2); [26, 48].forEach((r) => { E("path", { d: arcP(0, -14, r, -2.4, -0.74), fill: "none", stroke: C.yellow, "stroke-width": 6, "stroke-linecap": "round" }, tw2); });
        pop(wf, a + 0.2 * d); pop(tw2, a + 0.3 * d);
        const l1 = E("line", { x1: 190, y1: 530, x2: 410, y2: 420, stroke: C.mute, "stroke-width": 5, "stroke-dasharray": "4 12", "stroke-linecap": "round", opacity: 0 }, g), l2 = E("line", { x1: 700, y1: 490, x2: 480, y2: 420, stroke: C.mute, "stroke-width": 5, "stroke-dasharray": "4 12", "stroke-linecap": "round", opacity: 0 }, g);
        fadeIn(label(g, "WI-FI", 150, 660, 44, C.white), a + 0.4 * d); fadeIn(label(g, "PHONE TOWERS", 730, 720, 44, C.white), a + 0.45 * d);
        U.push((t) => { if (!inR(t, B)) return; const o = clamp((t - a - 0.35 * d) / 0.4) * 0.9; [l1, l2].forEach((l) => { l.setAttribute("opacity", o); l.setAttribute("stroke-dashoffset", -((t - a) * 30)); }); const p = ((t - a) * 0.6) % 1; rg.setAttribute("r", 30 + p * 80); rg.setAttribute("opacity", (1 - p) * 0.8); });
      }
