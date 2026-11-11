      // ===== VIDEO 10: how wireless charging works =====
      const spiral = (g, cx, cy, r0, r1, turns, col = C.yellow, w = 8) => {
        let d = ""; const n = turns * 40;
        for (let i = 0; i <= n; i++) { const th = (i / n) * turns * TAU, r = lerp(r0, r1, i / n); d += (i ? "L" : "M") + (cx + r * Math.cos(th)).toFixed(1) + "," + (cy + r * Math.sin(th)).toFixed(1); }
        return E("path", { d, fill: "none", stroke: col, "stroke-width": w, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
      };
      function flow(g, path, n, B, speed = 0.35, dir = 1, r = 9) {
        const len = path.getTotalLength(), dots = [];
        for (let k = 0; k < n; k++) dots.push(E("circle", { r, fill: C.white, stroke: C.ink, "stroke-width": 3, opacity: 0 }, g));
        U.push((t) => { if (!inR(t, B)) return; dots.forEach((c, k) => { const u = (((t - B.a) * speed * dir + k / n) % 1 + 1) % 1, p = path.getPointAtLength(u * len); c.setAttribute("cx", p.x); c.setAttribute("cy", p.y); c.setAttribute("opacity", clamp((t - B.a) / 0.4)); }); });
      }
      function rings(g, cx, cy, r0, r1, n, B, col = C.sky, speed = 55) {
        const rs = []; for (let k = 0; k < n; k++) rs.push(E("circle", { cx, cy, r: r0, fill: "none", stroke: col, "stroke-width": 6, opacity: 0 }, g));
        U.push((t) => { if (!inR(t, B)) return; rs.forEach((c, k) => { const f = ((((t - B.a) * speed) / (r1 - r0) + k / n) % 1 + 1) % 1; c.setAttribute("r", r0 + f * (r1 - r0)); c.setAttribute("opacity", 0.75 * (1 - f) * clamp((t - B.a) / 0.5)); }); });
      }
      // beat 1: a phone on a pad, no cable
      {
        const g = beat(0), B = BT[0], a = B.a, d = B.b - B.a;
        E("rect", { x: 110, y: 560, width: 660, height: 70, rx: 22, fill: C.navyD, stroke: C.white, "stroke-width": 7 }, g);
        const ph = E("g", {}, g); E("rect", { x: 190, y: 480, width: 500, height: 56, rx: 16, fill: C.navyD, stroke: C.yellow, "stroke-width": 7 }, ph);
        const bat = E("g", {}, g); E("rect", { x: 380, y: 497, width: 120, height: 22, rx: 6, fill: "none", stroke: C.white, "stroke-width": 4 }, bat); E("rect", { x: 384, y: 501, width: 60, height: 14, rx: 3, fill: C.green }, bat);
        const waves = [0, 1, 2].map((k) => E("path", { d: "M-70,0 Q-35,-22 0,0 T70,0", fill: "none", stroke: C.yellow, "stroke-width": 6, "stroke-linecap": "round", opacity: 0 }, g));
        const cab = E("g", {}, g); E("path", { d: "M770,590 C830,590 830,520 800,470", fill: "none", stroke: C.mute, "stroke-width": 9, "stroke-linecap": "round", "stroke-dasharray": "2 16" }, cab); crossMark(cab, 800, 440, 38);
        pop(cab, a + 0.18 * d); pop(label(g, "NO CABLE", 440, 400, 64, C.yellow), a + 0.12 * d);
        U.push((t) => { if (!inR(t, B)) return; waves.forEach((w, k) => { const f = ((((t - a) * 0.6) + k / 3) % 1 + 1) % 1; w.setAttribute("transform", `translate(440,${548 - f * 36})`); w.setAttribute("opacity", 0.9 * Math.sin(Math.PI * f) * clamp((t - a - 0.3 * d) / 0.4)); }); });
      }
      // beat 2: a coil in the pad makes a magnetic field
      {
        const g = beat(1), B = BT[1], a = B.a, d = B.b - B.a;
        rings(g, 440, 290, 175, 300, 3, B);
        const sp = spiral(g, 440, 290, 18, 150, 4); fadeIn(sp, a + 0.04 * d);
        flow(g, sp, 7, B, 0.22);
        pop(label(g, "COIL + CURRENT", 440, 650, 58, C.white), a + 0.3 * d); pop(label(g, "= MAGNETIC FIELD", 440, 718, 58, C.yellow), a + 0.55 * d);
      }
      // beat 3: alternating current flips, so the field flips
      {
        const g = beat(2), B = BT[2], a = B.a, d = B.b - B.a;
        pop(label(g, "ALTERNATING CURRENT", 440, 70, 50, C.white), a + 0.05 * d);
        E("line", { x1: 40, y1: 210, x2: 840, y2: 210, stroke: C.mute, "stroke-width": 3, "stroke-dasharray": "6 10" }, g);
        const wv = E("path", { d: "", fill: "none", stroke: C.yellow, "stroke-width": 9, "stroke-linecap": "round", "stroke-linejoin": "round" }, g), mk = E("circle", { cx: 440, cy: 210, r: 16, fill: C.white, stroke: C.ink, "stroke-width": 4 }, g);
        const up = arrowLine(g, 440, 520, 440, 350, C.sky, 14), dn = arrowLine(g, 440, 350, 440, 520, C.sky, 14);
        label(g, "FIELD", 640, 450, 48, C.sky);
        pop(label(g, "FIELD FLIPS TOO", 440, 650, 58, C.yellow), a + 0.5 * d);
        U.push((t) => { if (!inR(t, B)) return; const ph = (t - a) * 3.4; wv.setAttribute("d", wavePath(40, 840, 210, 90, 400, ph)); const s = Math.sin(-ph); mk.setAttribute("cy", 210 + 90 * s);
          up.setAttribute("opacity", clamp(0.5 - s * 1.6)); dn.setAttribute("opacity", clamp(0.5 + s * 1.6)); });
      }
      // beat 4: the second coil in the phone, field passes through glass and case
      {
        const g = beat(3), B = BT[3], a = B.a, d = B.b - B.a;
        const loops = (cy, col) => { for (let k = 0; k < 5; k++) E("ellipse", { cx: 290 + k * 75, cy, rx: 20, ry: 42, fill: "none", stroke: col, "stroke-width": 8 }, g); };
        E("rect", { x: 120, y: 120, width: 640, height: 150, rx: 26, fill: C.navyD, stroke: C.white, "stroke-width": 7 }, g); loops(195, C.white);
        E("rect", { x: 100, y: 500, width: 680, height: 90, rx: 22, fill: C.navyD, stroke: C.white, "stroke-width": 7 }, g); loops(545, C.yellow);
        const fl = ["M380,500 C170,420 170,300 380,270", "M500,500 C710,420 710,300 500,270", "M440,500 L440,270"].map((p) => E("path", { d: p, fill: "none", stroke: C.sky, "stroke-width": 7, "stroke-linecap": "round", "stroke-dasharray": "4 16", opacity: 0 }, g));
        fl.forEach((p, k) => fadeTo(p, a + (0.3 + 0.08 * k) * d, 0.9));
        pop(label(g, "PHONE COIL", 440, 80, 50, C.white), a + 0.12 * d); pop(label(g, "PAD COIL", 440, 665, 50, C.yellow), a + 0.2 * d);
        U.push((t) => { if (!inR(t, B)) return; fl.forEach((p) => p.setAttribute("stroke-dashoffset", -(t - a) * 40)); });
      }
      // beat 5: a changing field pushes electrons along the coil
      {
        const g = beat(4), B = BT[4], a = B.a, d = B.b - B.a;
        rings(g, 180, 290, 24, 140, 3, B);
        E("circle", { cx: 180, cy: 290, r: 16, fill: C.yellow }, g);
        fadeIn(arrowLine(g, 330, 290, 470, 290, C.white, 10), a + 0.2 * d);
        const sp = spiral(g, 650, 290, 18, 130, 3, C.white); flow(g, sp, 8, B, 0.28);
        sp.setAttribute("stroke", C.mute);
        pop(label(g, "CHANGING FIELD", 180, 500, 42, C.sky), a + 0.15 * d); pop(label(g, "CURRENT", 650, 500, 42, C.yellow), a + 0.4 * d);
        pop(label(g, "NO CONTACT NEEDED", 440, 650, 58, C.white), a + 0.6 * d);
      }
      // beat 6: coil -> chip -> battery fills
      {
        const g = beat(5), B = BT[5], a = B.a, d = B.b - B.a;
        spiral(g, 130, 260, 12, 66, 3);
        fadeIn(arrowLine(g, 215, 260, 305, 260, C.white, 9), a + 0.1 * d);
        const chip = E("g", {}, g); E("rect", { x: 330, y: 200, width: 150, height: 120, rx: 16, fill: C.navyD, stroke: C.white, "stroke-width": 7 }, chip);
        [225, 260, 295].forEach((y) => { E("line", { x1: 312, y1: y, x2: 330, y2: y, stroke: C.white, "stroke-width": 6 }, chip); E("line", { x1: 480, y1: y, x2: 498, y2: y, stroke: C.white, "stroke-width": 6 }, chip); });
        T(chip, "CHIP", 405, 275, 44, C.yellow); pop(chip, a + 0.15 * d);
        fadeIn(arrowLine(g, 520, 260, 600, 260, C.white, 9), a + 0.3 * d);
        E("rect", { x: 620, y: 205, width: 210, height: 110, rx: 16, fill: C.navyD, stroke: C.white, "stroke-width": 7 }, g); E("rect", { x: 830, y: 237, width: 16, height: 46, rx: 5, fill: C.white }, g);
        const fill = E("rect", { x: 632, y: 217, width: 0, height: 86, rx: 8, fill: C.green }, g);
        pop(label(g, "STEADY POWER", 440, 520, 62, C.yellow), a + 0.4 * d); pop(label(g, "FILLS THE BATTERY", 440, 600, 50, C.white), a + 0.6 * d);
        U.push((t) => { if (!inR(t, B)) return; fill.setAttribute("width", 186 * clamp((t - a - 0.3 * d) / (0.65 * d))); });
      }
      // beat 7: alignment matters
      {
        const g = beat(6), B = BT[6], a = B.a, d = B.b - B.a;
        const pg = E("g", { transform: "translate(440,260)" }, g); E("circle", { r: 140, fill: C.yellow, opacity: 0.12 }, pg); spiral(pg, 0, 0, 14, 124, 3, C.yellow);
        const cg = E("g", { transform: "translate(440,260)" }, g); E("circle", { r: 140, fill: C.white, opacity: 0.08 }, cg); spiral(cg, 0, 0, 14, 124, 3, C.white);
        E("rect", { x: 140, y: 470, width: 600, height: 44, rx: 22, fill: "none", stroke: C.white, "stroke-width": 6 }, g);
        const bar = E("rect", { x: 144, y: 474, width: 592, height: 36, rx: 18, fill: C.green }, g);
        fadeIn(label(g, "POWER", 440, 455, 38, C.white), a + 0.05 * d);
        pop(label(g, "OFF CENTRE = LESS POWER", 440, 650, 54, C.yellow), a + 0.45 * d);
        U.push((t) => { if (!inR(t, B)) return; const u = (t - a) / d, off = 220 * ease(clamp((u - 0.22) / 0.3)) - 220 * ease(clamp((u - 0.8) / 0.18)) * 0, ov = clamp(1 - off / 280);
          cg.setAttribute("transform", `translate(${440 + off},260)`); bar.setAttribute("width", Math.max(4, 592 * ov)); bar.setAttribute("fill", ov > 0.6 ? C.green : ov > 0.35 ? C.yellow : C.red); });
      }
      // beat 8: energy leaks as heat
      {
        const g = beat(7), B = BT[7], a = B.a, d = B.b - B.a;
        E("rect", { x: 140, y: 330, width: 600, height: 56, rx: 18, fill: C.navyD, stroke: C.white, "stroke-width": 7 }, g);
        E("rect", { x: 190, y: 262, width: 500, height: 52, rx: 16, fill: C.navyD, stroke: C.white, "stroke-width": 7 }, g);
        const sq = [250, 360, 440, 530, 630].map(() => E("path", { d: "", fill: "none", stroke: C.red, "stroke-width": 8, "stroke-linecap": "round" }, g));
        E("rect", { x: 100, y: 480, width: 680, height: 46, rx: 23, fill: C.red }, g); E("rect", { x: 100, y: 480, width: 510, height: 46, rx: 23, fill: C.green }, g); E("rect", { x: 560, y: 480, width: 50, height: 46, fill: C.green }, g);
        pop(label(g, "BATTERY", 355, 590, 40, C.green), a + 0.3 * d); pop(label(g, "HEAT", 690, 590, 40, C.red), a + 0.4 * d);
        pop(label(g, "A BIT LESS EFFICIENT", 440, 690, 54, C.yellow), a + 0.55 * d);
        U.push((t) => { if (!inR(t, B)) return; const on = clamp((t - a - 0.15 * d) / 0.5);
          sq.forEach((p, k) => { const x = [250, 360, 440, 530, 630][k]; let dd = ""; for (let y = 250; y >= 110; y -= 8) dd += (dd ? "L" : "M") + (x + 12 * Math.sin(y / 13 + (t - a) * 4 + k)).toFixed(1) + "," + y; p.setAttribute("d", dd); p.setAttribute("opacity", on * (0.55 + 0.4 * Math.sin((t - a) * 3 + k * 1.7))); }); });
      }
      // beat 9: the whole trick
      {
        const g = beat(8), B = BT[8], a = B.a, d = B.b - B.a;
        spiral(g, 130, 250, 12, 76, 3, C.yellow); spiral(g, 750, 250, 12, 76, 3, C.white);
        const arcs = [0, 1, 2].map((k) => E("path", { d: arcP(440, 250, 40 + k * 34, -1.2, 1.2), fill: "none", stroke: C.sky, "stroke-width": 7, "stroke-linecap": "round" }, g));
        arcs.forEach((p, k) => fadeIn(p, a + (0.2 + 0.08 * k) * d));
        fadeIn(arrowLine(g, 225, 250, 295, 250, C.white, 9), a + 0.1 * d); fadeIn(arrowLine(g, 585, 250, 655, 250, C.white, 9), a + 0.3 * d);
        pop(label(g, "COIL MAKES", 130, 420, 40, C.yellow), a + 0.15 * d); pop(label(g, "CHANGING FIELD", 440, 420, 40, C.sky), a + 0.3 * d); pop(label(g, "COIL CATCHES", 750, 420, 40, C.white), a + 0.45 * d);
        pop(label(g, "NO WIRE NEEDED", 440, 640, 62, C.yellow), a + 0.6 * d);
        U.push((t) => { if (!inR(t, B)) return; arcs.forEach((p, k) => p.setAttribute("stroke-opacity", 0.55 + 0.45 * Math.sin((t - a) * 4 - k * 0.9))); });
      }
