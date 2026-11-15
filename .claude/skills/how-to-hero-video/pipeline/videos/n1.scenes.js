      // ===== NEWS 1: why Hubble is falling =====
      function hubble(g, x, y, s = 1, ang = 0) {
        const k = E("g", { transform: `translate(${x},${y}) rotate(${ang}) scale(${s})` }, g), S = { stroke: C.ink, "stroke-width": 4, "stroke-linejoin": "round" };
        E("rect", { x: -150, y: -34, width: 70, height: 68, fill: C.sky, ...S }, k); E("rect", { x: 80, y: -34, width: 70, height: 68, fill: C.sky, ...S }, k);
        for (const sx of [-150, 80]) for (let i = 1; i < 3; i++) E("line", { x1: sx + i * 23, y1: -34, x2: sx + i * 23, y2: 34, stroke: C.navy, "stroke-width": 3 }, k);
        E("line", { x1: -80, y1: 0, x2: 80, y2: 0, stroke: C.white, "stroke-width": 6 }, k);
        E("rect", { x: -48, y: -46, width: 96, height: 120, rx: 10, fill: C.white, ...S }, k);
        E("rect", { x: -40, y: -96, width: 80, height: 52, rx: 6, fill: "#D9DEF5", ...S }, k);
        E("path", { d: "M-40,-96 L-30,-120 L40,-104 L40,-96 Z", fill: C.mute, ...S }, k);
        E("ellipse", { cx: 0, cy: -96, rx: 30, ry: 8, fill: C.ink }, k);
        return k;
      }
      const earth = (g, cy, r) => { E("circle", { cx: 440, cy, r, fill: "#2B6CC4", stroke: C.white, "stroke-width": 6 }, g); E("path", { d: `M${440 - r * 0.6},${cy - r * 0.8} q60,40 140,10 q50,-20 90,30`, fill: "none", stroke: C.green, "stroke-width": 26, "stroke-linecap": "round" }, g); };
      const airBand = (g, cy, r, w, op) => E("circle", { cx: 440, cy, r: r + w / 2, fill: "none", stroke: C.sky, "stroke-width": w, opacity: op }, g);
      // beat 0: Hubble since 1990, now falling
      {
        const g = beat(0), B = BT[0], a = B.a, d = B.b - B.a;
        const h = hubble(g, 400, 520, 1.2);
        const arr = arrowLine(g, 760, 400, 760, 640, C.red, 12); fadeIn(arr, a + 0.45 * d);
        pop(label(g, "SINCE 1990", 400, 720, 64, C.white), a + 0.05 * d);
        U.push((t) => { if (!inR(t, B)) return; const k = clamp((t - a - 0.4 * d) / (0.6 * d)); placeAt(h, 400, 520 + 30 * ease(k), 6 * Math.sin((t - a) * 1.4), 1.2); });
      }
      // beat 1: low orbit, thin air but not zero
      {
        const g = beat(1), B = BT[1], a = B.a, d = B.b - B.a, R = rng(3);
        earth(g, 1180, 760); airBand(g, 1180, 760, 150, 0.18);
        const mol = []; for (let i = 0; i < 26; i++) { const th = -Math.PI / 2 + (R() - 0.5) * 1.3, rr = 770 + R() * 200; mol.push(E("circle", { cx: 440 + rr * Math.cos(th), cy: 1180 + rr * Math.sin(th), r: 6, fill: C.white, opacity: 0 }, g)); }
        mol.forEach((m, i) => fadeTo(m, a + 0.25 * d + i * 0.03, 0.8));
        hubble(g, 440, 210, 0.7);
        pop(label(g, "THIN AIR", 440, 70, 66, C.yellow), a + 0.35 * d); fadeIn(label(g, "NOT ZERO", 440, 135, 46, C.white), a + 0.55 * d);
      }
      // beat 2: drag steals speed, it sinks
      {
        const g = beat(2), B = BT[2], a = B.a, d = B.b - B.a, R = rng(9);
        const h = hubble(g, 240, 330, 0.8);
        const mol = []; for (let i = 0; i < 18; i++) mol.push({ x: 380 + R() * 480, y: 230 + R() * 200, el: E("circle", { r: 7, fill: C.white, opacity: 0.85 }, g) });
        pop(label(g, "DRAG", 640, 120, 80, C.red), a + 0.15 * d);
        const sp = label(g, "SPEED", 240, 560, 52, C.white); fadeIn(sp, a + 0.3 * d);
        const bar = E("rect", { x: 120, y: 600, width: 240, height: 34, rx: 10, fill: C.green }, g);
        U.push((t) => { if (!inR(t, B)) return; const u = (t - a); mol.forEach((m) => { const x = ((m.x - u * 160 - 100) % 600 + 600) % 600 + 260; m.el.setAttribute("cx", x); m.el.setAttribute("cy", m.y); }); const k = clamp((t - a - 0.3 * d) / (0.6 * d)); bar.setAttribute("width", 240 - 110 * k); placeAt(h, 240, 330 + 60 * ease(k), 0, 0.8); });
      }
      // beat 3: thicker air lower down, fall speeds up
      {
        const g = beat(3), B = BT[3], a = B.a, d = B.b - B.a;
        [["THIN", 120, 0.12], ["THICKER", 330, 0.32], ["THICKEST", 540, 0.6]].forEach(([s, y, op], i) => { const r = E("rect", { x: 40, y: y - 90, width: 800, height: 180, rx: 20, fill: C.sky, opacity: 0 }, g); fadeTo(r, a + i * 0.12 * d, op); fadeIn(label(g, s, 720, y + 18, 44, C.white), a + i * 0.12 * d + 0.2); });
        const h = hubble(g, 280, 120, 0.55);
        pop(label(g, "FASTER FALL", 280, 720, 64, C.yellow), a + 0.55 * d);
        U.push((t) => { if (!inR(t, B)) return; const k = clamp((t - a - 0.2 * d) / (0.7 * d)); placeAt(h, 280, 120 + 440 * k * k, 0, 0.55); });
      }
      // beat 4: no engine; shuttle retired 2011
      {
        const g = beat(4), B = BT[4], a = B.a, d = B.b - B.a;
        hubble(g, 230, 260, 0.8);
        pop(label(g, "NO ENGINE", 230, 490, 60, C.white), a + 0.1 * d); pop(crossMark(g, 230, 580, 50), a + 0.2 * d);
        const sh = E("g", {}, g);
        E("path", { d: "M600,140 L640,200 L640,420 L560,420 L560,200 Z", fill: C.white, stroke: C.ink, "stroke-width": 4 }, sh);
        E("path", { d: "M560,330 L500,430 L560,420 Z M640,330 L700,430 L640,420 Z", fill: C.mute, stroke: C.ink, "stroke-width": 4 }, sh);
        pop(sh, a + 0.45 * d);
        pop(label(g, "SHUTTLE", 600, 500, 52, C.white), a + 0.5 * d); pop(label(g, "RETIRED 2011", 600, 570, 52, C.yellow), a + 0.62 * d);
      }
      // beat 5: re-entry around 2033 to 2034
      {
        const g = beat(5), B = BT[5], a = B.a, d = B.b - B.a;
        earth(g, 1100, 620); airBand(g, 1100, 620, 120, 0.25);
        const h = hubble(g, 440, 120, 0.55);
        const glow = E("circle", { cx: 440, cy: 400, r: 70, fill: C.red, opacity: 0 }, g);
        pop(label(g, "REENTRY", 440, 640, 64, C.white), a + 0.4 * d); pop(label(g, "2033-2034", 440, 720, 70, C.yellow), a + 0.5 * d);
        U.push((t) => { if (!inR(t, B)) return; const k = ease(clamp((t - a - 0.1 * d) / (0.6 * d))); placeAt(h, 440, 120 + 280 * k, 20 * k, 0.55); glow.setAttribute("opacity", 0.5 * clamp((k - 0.7) / 0.3)); });
      }
      // beat 6: option one, boost higher
      {
        const g = beat(6), B = BT[6], a = B.a, d = B.b - B.a;
        pop(label(g, "OPTION 1", 440, 80, 60, C.yellow), a + 0.3 * d); pop(label(g, "BOOST IT HIGHER", 440, 150, 60, C.white), a + 0.4 * d);
        const h = hubble(g, 360, 520, 0.6);
        const tug = E("g", {}, g); E("rect", { x: -40, y: -30, width: 80, height: 60, rx: 10, fill: C.yellow, stroke: C.ink, "stroke-width": 4 }, tug); E("polygon", { points: "-20,30 20,30 0,70", fill: C.red }, tug);
        U.push((t) => { if (!inR(t, B)) return; const k = ease(clamp((t - a - 0.35 * d) / (0.5 * d))); placeAt(h, 360, 520 - 220 * k, 0, 0.6); placeAt(tug, 480, 600 - 220 * k, 0, 1); tug.setAttribute("opacity", clamp((t - a - 0.2 * d) / 0.3)); });
      }
      // beat 7: option two service, option three safe re-entry
      {
        const g = beat(7), B = BT[7], a = B.a, d = B.b - B.a;
        const c1 = E("g", {}, g); E("rect", { x: 30, y: 60, width: 400, height: 560, rx: 26, fill: C.navyD, stroke: C.white, "stroke-width": 6 }, c1);
        label(c1, "OPTION 2", 230, 130, 52, C.yellow); hubble(c1, 230, 340, 0.75); label(c1, "UPGRADE", 230, 560, 56, C.white);
        const c2 = E("g", {}, g); E("rect", { x: 450, y: 60, width: 400, height: 560, rx: 26, fill: C.navyD, stroke: C.white, "stroke-width": 6 }, c2);
        label(c2, "OPTION 3", 650, 130, 52, C.yellow); arrowLine(c2, 650, 220, 650, 420, C.red, 12); label(c2, "SAFE", 650, 500, 56, C.white); label(c2, "RE-ENTRY", 650, 560, 56, C.white);
        pop(c1, a + 0.05 * d); pop(c2, a + 0.45 * d);
      }
      // beat 8: mission by 2032, replies due Nov 30
      {
        const g = beat(8), B = BT[8], a = B.a, d = B.b - B.a;
        const cal = E("g", {}, g); E("rect", { x: 250, y: 90, width: 380, height: 330, rx: 26, fill: C.white, stroke: C.ink, "stroke-width": 5 }, cal); E("rect", { x: 250, y: 90, width: 380, height: 90, rx: 26, fill: C.red }, cal); E("rect", { x: 250, y: 150, width: 380, height: 30, fill: C.red }, cal);
        label(cal, "MISSION BY", 440, 155, 46, C.white); label(cal, "2032", 440, 360, 150, C.navy);
        pop(cal, a + 0.05 * d);
        pop(label(g, "REPLIES DUE", 440, 560, 56, C.white), a + 0.5 * d); pop(label(g, "NOV 30", 440, 650, 80, C.yellow), a + 0.6 * d);
      }
