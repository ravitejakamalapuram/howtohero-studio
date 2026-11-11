      // ===== VIDEO 3: how Wi-Fi works =====
      function router(g, x, y, s = 1, col = C.white) {
        const k = E("g", { transform: `translate(${x},${y}) scale(${s})` }, g), S = { stroke: col, "stroke-width": 8, "stroke-linecap": "round", "stroke-linejoin": "round" };
        E("line", { x1: -60, y1: 0, x2: -78, y2: -78, ...S }, k); E("line", { x1: 60, y1: 0, x2: 78, y2: -78, ...S }, k);
        E("rect", { x: -110, y: 0, width: 220, height: 64, rx: 18, fill: C.navyD, ...S }, k); E("circle", { cx: -64, cy: 32, r: 7, fill: C.yellow }, k); E("circle", { cx: -38, cy: 32, r: 7, fill: C.green }, k);
        return k;
      }
      function laptop(g, x, y, s = 1, col = C.white) {
        const k = E("g", { transform: `translate(${x},${y}) scale(${s})` }, g), S = { stroke: col, "stroke-width": 7, "stroke-linecap": "round", "stroke-linejoin": "round" };
        E("rect", { x: -70, y: -90, width: 140, height: 90, rx: 10, fill: C.navyD, ...S }, k); E("path", { d: "M-92,0 H92 L80,18 H-80 Z", fill: C.navyD, ...S }, k);
        return k;
      }
      const bars = (g, x, y, n, on, col = C.green) => { const b = []; for (let i = 0; i < n; i++) b.push(E("rect", { x: x + i * 26, y: y - 20 - i * 18, width: 16, height: 20 + i * 18, rx: 4, fill: col, opacity: 0.25 }, g)); return b; };
      // beat 1 (0-9): router with radio rings; devices listen
      {
        const g = beat(0), B = BT[0], a = B.a;
        router(g, 440, 640, 1.0); phone(g, 70, 600, 100, 150, { sw: 6 }); laptop(g, 740, 720, 0.85);
        const rings = [0, 1, 2, 3].map(() => E("path", { fill: "none", stroke: C.yellow, "stroke-width": 7, "stroke-linecap": "round" }, g));
        U.push((t) => { if (!inR(t, B)) return; rings.forEach((r, i) => { const p = (((t - a) * 0.4 + i / 4) % 1), rad = 60 + p * 180; r.setAttribute("d", arcP(440, 556, rad, -2.35, -0.79)); r.setAttribute("opacity", (1 - p) * 0.95 * clamp((t - a) / 0.4)); }); });
      }
      // beat 2 (9-20): data -> radio waves -> back into a web page
      {
        const g = beat(1), B = BT[1], a = B.a, d = B.b - B.a;
        router(g, 120, 420, 0.8); const pk = [0, 1, 2].map((i) => E("rect", { x: 0, y: 0, width: 26, height: 20, rx: 5, fill: C.white }, g));
        fadeIn(label(g, "DATA", 120, 330, 40, C.white), a + 0.1 * d);
        const wv = E("path", { fill: "none", stroke: C.yellow, "stroke-width": 8, "stroke-linecap": "round" }, g); fadeIn(label(g, "RADIO WAVES", 390, 290, 40, C.yellow), a + 0.25 * d);
        phone(g, 590, 160, 240, 450); E("line", { x1: 710, y1: 160, x2: 710, y2: 100, stroke: C.white, "stroke-width": 8, "stroke-linecap": "round" }, g); E("circle", { cx: 710, cy: 94, r: 9, fill: C.yellow }, g);
        const pg = E("g", {}, g); E("rect", { x: 612, y: 214, width: 196, height: 30, rx: 8, fill: C.navyL }, pg); [0, 1, 2].forEach((i) => E("circle", { cx: 628 + i * 18, cy: 229, r: 5, fill: C.sky }, pg)); E("rect", { x: 612, y: 262, width: 196, height: 110, rx: 10, fill: C.yellow, opacity: 0.85 }, pg); [0, 1, 2, 3].forEach((i) => E("rect", { x: 612, y: 392 + i * 36, width: i % 2 ? 130 : 196, height: 16, rx: 8, fill: C.white, opacity: 0.85 }, pg)); label(pg, "WEB PAGE", 710, 560, 38, C.white);
        fadeIn(pg, a + 0.62 * d, 0.6);
        U.push((t) => { if (!inR(t, B)) return; wv.setAttribute("d", wavePath(220, 580, 420, 46, 80, (t - a) * 9, 4)); wv.setAttribute("opacity", clamp((t - a - 0.2 * d) / 0.5));
          pk.forEach((r, i) => { const u = (((t - a) * 0.5 + i / 3) % 1); r.setAttribute("x", 120 - 13 + u * 90); r.setAttribute("y", 360 - u * 26 - 10); r.setAttribute("opacity", u < 0.8 ? clamp((t - a) / 0.3) : (1 - u) * 5); }); });
      }
      // beat 3 (20-31): one channel, devices take turns
      {
        const g = beat(2), B = BT[2], a = B.a, d = B.b - B.a;
        E("rect", { x: 40, y: 340, width: 800, height: 56, rx: 28, fill: C.navyD, stroke: C.mute, "stroke-width": 5 }, g); fadeIn(label(g, "ONE CHANNEL", 440, 450, 44, C.mute), a + 0.1 * d);
        phone(g, 50, 170, 100, 150, { sw: 6 }); laptop(g, 740, 300, 0.95);
        const pa = E("circle", { r: 20, fill: C.yellow }, g), pb = E("circle", { r: 20, fill: C.white }, g), ha = E("circle", { cx: 100, cy: 245, r: 80, fill: "url(#glowY)", opacity: 0 }, g), hb = E("circle", { cx: 740, cy: 245, r: 90, fill: "url(#glowY)", opacity: 0 }, g);
        pop(label(g, "ONE TALKS AT A TIME", 440, 640, 56, C.yellow), a + 0.4 * d);
        U.push((t) => { if (!inR(t, B)) return; const T0 = 2.4, p = (((t - a) % T0) / T0), first = p < 0.5, k = first ? p * 2 : (p - 0.5) * 2, on = clamp((t - a) / 0.3);
          pa.setAttribute("opacity", first ? on : 0); pb.setAttribute("opacity", first ? 0 : on); pa.setAttribute("cx", lerp(120, 760, k)); pa.setAttribute("cy", 368); pb.setAttribute("cx", lerp(760, 120, k)); pb.setAttribute("cy", 368); ha.setAttribute("opacity", first ? 0.9 * on : 0); hb.setAttribute("opacity", first ? 0 : 0.9 * on); });
      }
      // beat 4: tiny turns, one device per slice
      {
        const g = beat(3), B = BT[3], a = B.a, d = B.b - B.a, cols = [C.yellow, C.white, C.sky], seq = [0, 1, 0, 2, 1, 0, 2, 1, 0, 1, 2, 0];
        [160, 440, 720].forEach((x, i) => { phone(g, x - 45, 140, 90, 140, { sw: 6 }); E("circle", { cx: x, cy: 320, r: 14, fill: cols[i] }, g); });
        E("rect", { x: 30, y: 400, width: 820, height: 110, rx: 20, fill: C.navyD, stroke: C.mute, "stroke-width": 5 }, g);
        seq.forEach((k, i) => fadeIn(E("rect", { x: 44 + i * 67.5, y: 414, width: 60, height: 82, rx: 10, fill: cols[k], opacity: 0 }, g), a + 0.08 * d + i * 0.045 * d, 0.12));
        const ph = E("polygon", { points: "-18,-34 18,-34 0,0", fill: C.yellow }, g);
        pop(label(g, "TINY TURNS", 440, 640, 80, C.yellow), a + 0.5 * d); fadeIn(label(g, "TOO FAST TO NOTICE", 440, 715, 48, C.white), a + 0.65 * d);
        U.push((t) => { if (!inR(t, B)) return; const u = clamp((t - a - 0.08 * d) / (0.6 * d)); ph.setAttribute("transform", `translate(${44 + 30 + u * 11 * 67.5},392)`); ph.setAttribute("opacity", u > 0 && u < 1 ? 1 : 0); });
      }
      // beat 4 (31-40): many devices queue; speed drops
      {
        const g = beat(4), B = BT[4], a = B.a, d = B.b - B.a;
        router(g, 770, 330, 0.8); const q = []; for (let i = 0; i < 7; i++) { const x = 600 - i * 85, dv = E("g", {}, g); E("rect", { x, y: 340, width: 64, height: 104, rx: 14, fill: C.navyD, stroke: i === 0 ? C.yellow : C.white, "stroke-width": 6 }, dv); E("circle", { cx: x + 32, cy: 424, r: 5, fill: C.white }, dv); pop(dv, a + 0.1 * d + i * 0.09 * d); q.push(dv); }
        fadeIn(label(g, "WAITING IN LINE", 330, 280, 46, C.white), a + 0.3 * d);
        fadeIn(label(g, "SPEED", 90, 560, 40, C.white, { anchor: "start" }), a + 0.1 * d); E("rect", { x: 90, y: 580, width: 700, height: 44, rx: 22, fill: C.navyD, stroke: C.mute, "stroke-width": 5 }, g);
        const sp = E("rect", { x: 90, y: 580, width: 700, height: 44, rx: 22, fill: C.green }, g);
        pop(label(g, "MORE DEVICES, LONGER WAIT", 440, 710, 52, C.yellow), a + 0.5 * d);
        U.push((t) => { if (!inR(t, B)) return; const u = ease(clamp((t - a - 0.1 * d) / (0.6 * d))); sp.setAttribute("width", 700 - 520 * u); sp.setAttribute("fill", u > 0.6 ? C.red : u > 0.3 ? C.yellow : C.green); });
      }
      // beat 5 (40-50): 2.4 GHz vs 5 GHz through a wall
      {
        const g = beat(5), B = BT[5], a = B.a, d = B.b - B.a;
        router(g, 90, 340, 0.62); const wall = E("g", {}, g); E("rect", { x: 380, y: 120, width: 70, height: 520, rx: 8, fill: "#7B3B3F", stroke: C.white, "stroke-width": 6 }, wall); for (let r = 0; r < 8; r++) E("line", { x1: 380, y1: 120 + r * 65, x2: 450, y2: 120 + r * 65, stroke: C.white, "stroke-width": 3, opacity: 0.5 }, wall);
        pop(wall, a + 0.05 * d);
        const w1 = E("path", { fill: "none", stroke: C.yellow, "stroke-width": 8, "stroke-linecap": "round" }, g);
        fadeIn(label(g, "2.4 GHZ", 180, 170, 60, C.yellow), a + 0.15 * d); fadeIn(label(g, "BETTER THROUGH WALLS", 640, 215, 40, C.yellow), a + 0.3 * d);
        const seg = (x0, x1, yc, amp, wl, ph, fade) => { let dd = ""; for (let x = x0; x <= x1; x += 4) { const wallK = x > 450 ? 0.62 : 1, f = fade ? clamp(1 - (x - 450) / 260) : clamp(1 - (x - 450) / 700); const A = amp * (x > 380 ? wallK : 1) * (x > 450 ? Math.max(0.05, f) : 1); dd += (dd ? " L" : "M") + x + "," + (yc + A * Math.sin(((x - x0) / wl) * TAU - ph)).toFixed(1); } return dd; };
        U.push((t) => { if (!inR(t, B)) return; const ph = (t - a) * 8; w1.setAttribute("d", seg(150, 860, 330, 38, 110, ph, false)); w1.setAttribute("opacity", clamp((t - a - 0.1 * d) / 0.4)); });
      }
      // beat 5 (40-50): 2.4 GHz vs 5 GHz through a wall
      {
        const g = beat(6), B = BT[6], a = B.a, d = B.b - B.a;
        router(g, 90, 340, 0.62); const wall = E("g", {}, g); E("rect", { x: 380, y: 120, width: 70, height: 520, rx: 8, fill: "#7B3B3F", stroke: C.white, "stroke-width": 6 }, wall); for (let r = 0; r < 8; r++) E("line", { x1: 380, y1: 120 + r * 65, x2: 450, y2: 120 + r * 65, stroke: C.white, "stroke-width": 3, opacity: 0.5 }, wall);
        pop(wall, a + 0.05 * d);
        const w2 = E("path", { fill: "none", stroke: C.white, "stroke-width": 8, "stroke-linecap": "round" }, g);
        fadeIn(label(g, "5 GHZ", 180, 170, 60, C.white), a + 0.15 * d); fadeIn(label(g, "FASTER, BUT FADES", 640, 215, 40, C.white), a + 0.3 * d);
        const seg = (x0, x1, yc, amp, wl, ph, fade) => { let dd = ""; for (let x = x0; x <= x1; x += 4) { const wallK = x > 450 ? 0.62 : 1, f = fade ? clamp(1 - (x - 450) / 260) : clamp(1 - (x - 450) / 700); const A = amp * (x > 380 ? wallK : 1) * (x > 450 ? Math.max(0.05, f) : 1); dd += (dd ? " L" : "M") + x + "," + (yc + A * Math.sin(((x - x0) / wl) * TAU - ph)).toFixed(1); } return dd; };
        U.push((t) => { if (!inR(t, B)) return; const ph = (t - a) * 8; w2.setAttribute("d", seg(150, 860, 330, 38, 46, ph * 1.8, true)); w2.setAttribute("opacity", clamp((t - a - 0.1 * d) / 0.4)); });
      }
      // beat 6 (50-56): move the router closer; signal bars rise
      {
        const g = beat(7), B = BT[7], a = B.a, d = B.b - B.a;
        phone(g, 640, 200, 190, 340); const bs = bars(g, 690, 420, 4, 0, C.green);
        const rt = router(g, 110, 330, 0.7); const rg = [0, 1, 2].map(() => E("path", { fill: "none", stroke: C.yellow, "stroke-width": 6, "stroke-linecap": "round" }, g));
        pop(label(g, "GET CLOSER", 440, 650, 78, C.yellow), a + 0.25 * d); fadeIn(label(g, "OR SWITCH TO 5 GHZ", 440, 725, 50, C.white), a + 0.6 * d);
        U.push((t) => { if (!inR(t, B)) return; const u = ease(clamp((t - a - 0.15 * d) / (0.55 * d))), x = lerp(110, 400, u); rt.setAttribute("transform", `translate(${x},330) scale(0.7)`);
          bs.forEach((b, i) => b.setAttribute("opacity", u > i / 4 + 0.08 ? 1 : 0.22)); rg.forEach((r, i) => { const p = (((t - a) * 0.5 + i / 3) % 1); r.setAttribute("d", arcP(x + 6, 300, 50 + p * 170, -0.9, 0.9)); r.setAttribute("opacity", (1 - p) * 0.9); }); });
      }
      // beat 9: quiet house vs crowded house
      {
        const g = beat(8), B = BT[8], a = B.a, d = B.b - B.a;
        const panel = (x, name, n, col, w, t0) => {
          E("rect", { x, y: 150, width: 400, height: 420, rx: 24, fill: C.navyD, stroke: C.mute, "stroke-width": 5 }, g);
          label(g, name, x + 200, 235, 54, C.white);
          for (let i = 0; i < n; i++) { const cx = x + 70 + (i % 4) * 90, cy = 310 + Math.floor(i / 4) * 80; pop(E("rect", { x: cx - 22, y: cy - 30, width: 44, height: 62, rx: 9, fill: C.navyL, stroke: C.white, "stroke-width": 5 }, g), t0 + i * 0.03 * d); }
          E("rect", { x: x + 30, y: 500, width: 340, height: 34, rx: 17, fill: C.navy, stroke: C.mute, "stroke-width": 4 }, g);
          const bar = E("rect", { x: x + 30, y: 500, width: 0, height: 34, rx: 17, fill: col }, g);
          U.push((t) => { if (!inR(t, B)) return; bar.setAttribute("width", 340 * w * ease(clamp((t - t0 - 0.2 * d) / (0.3 * d)))); });
        };
        panel(20, "QUIET", 2, C.green, 1, a + 0.05 * d); panel(460, "CROWDED", 8, C.red, 0.22, a + 0.2 * d);
        pop(label(g, "FEWER DEVICES, FASTER", 440, 680, 54, C.yellow), a + 0.6 * d);
      }
