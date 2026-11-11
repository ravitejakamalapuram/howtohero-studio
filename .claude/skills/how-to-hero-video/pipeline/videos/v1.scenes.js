      // ===== VIDEO 1: how face unlock works =====
      const faceFeatures = (g, fx, fy, k = 1) => {
        E("circle", { cx: fx - 52 * k, cy: fy - 40 * k, r: 11 * k, fill: C.white }, g); E("circle", { cx: fx + 52 * k, cy: fy - 40 * k, r: 11 * k, fill: C.white }, g);
        E("path", { d: `M${fx},${fy - 16 * k} L${fx - 13 * k},${fy + 32 * k} L${fx + 7 * k},${fy + 34 * k}`, ...ST({ sw: 7 * k }) }, g);
        E("path", { d: `M${fx - 46 * k},${fy + 84 * k} Q${fx},${fy + 120 * k} ${fx + 46 * k},${fy + 84 * k}`, ...ST({ sw: 7 * k }) }, g);
      };
      const inFace = (x, y, fx, fy, rx, ry) => ((x - fx) / rx) ** 2 + ((y - fy) / ry) ** 2 < 1;

      // beat 1: a face, and the dots flash on (sits under the headline: local y >= 330)
      {
        const g = beat(0), B = BT[0], a = B.a, fx = 440, fy = 548, rx = 158, ry = 196, R = rng(3);
        E("ellipse", { cx: fx, cy: fy, rx, ry, fill: C.navyD, stroke: C.white, "stroke-width": 8 }, g); faceFeatures(g, fx, fy);
        const flash = E("ellipse", { cx: fx, cy: fy, rx, ry, fill: "none", stroke: C.yellow, "stroke-width": 6, opacity: 0 }, g);
        tl.fromTo(flash, { attr: { rx, ry }, opacity: 0.9 }, { attr: { rx: rx + 80, ry: ry + 80 }, opacity: 0, duration: 0.8, ease: "power2.out", immediateRender: false }, a + 0.9);
        const dots = [];
        for (let y = fy - ry + 16; y < fy + ry - 8; y += 24) for (let x = fx - rx + 16; x < fx + rx - 8; x += 24) if (inFace(x, y, fx, fy, rx - 8, ry - 8)) dots.push({ el: E("circle", { cx: x, cy: y, r: 4.6, fill: C.yellow, opacity: 0 }, g), t0: a + 0.95 + R() * 1.1, ph: R() * TAU });
        U.push((t) => { if (!inR(t, B)) return; dots.forEach((q) => q.el.setAttribute("opacity", clamp((t - q.t0) / 0.1) * (0.6 + 0.4 * Math.sin(t * 6 + q.ph)))); });
      }
      // beat 2: a tiny projector fires infrared dots; a special camera reads them
      {
        const g = beat(1), B = BT[1], a = B.a, d = B.b - B.a, px = 70, py = 250, pw = 220, ph = 400;
        phone(g, px, py, pw, ph);
        const pj = [px + pw - 22, py + 120], cm = [px + pw - 22, py + 205];
        E("circle", { cx: pj[0], cy: pj[1], r: 15, fill: C.yellow }, g); E("circle", { cx: cm[0], cy: cm[1], r: 17, fill: "none", stroke: C.white, "stroke-width": 6 }, g); E("circle", { cx: cm[0], cy: cm[1], r: 6, fill: C.white }, g);
        fadeIn(label(g, "PROJECTOR", pj[0] - 34, pj[1] + 12, 36, C.yellow, { anchor: "end" }), a + 0.2 * d); fadeIn(label(g, "IR CAMERA", cm[0] - 34, cm[1] + 12, 36, C.white, { anchor: "end" }), a + 0.5 * d);
        const fx = 690, fy = 400, rx = 112, ry = 158;
        E("ellipse", { cx: fx, cy: fy, rx, ry, fill: C.navyD, stroke: C.white, "stroke-width": 7 }, g); faceFeatures(g, fx, fy, 0.72);
        const pts = []; for (let y = fy - ry + 14; y < fy + ry - 8; y += 21) for (let x = fx - rx + 14; x < fx + rx - 8; x += 21) if (inFace(x, y, fx, fy, rx - 6, ry - 6)) pts.push([x, y]);
        const rays = [0, 1, 2, 3, 4, 5, 6].map((i) => E("line", { x1: pj[0], y1: pj[1], x2: fx - rx + 8, y2: fy - ry + 30 + i * (2 * ry - 60) / 6, stroke: C.yellow, "stroke-width": 5, "stroke-dasharray": "2 16", "stroke-linecap": "round", opacity: 0 }, g));
        const back = [0, 1, 2].map((i) => E("line", { x1: fx - rx + 6, y1: fy - 60 + i * 60, x2: cm[0], y2: cm[1] + 22, stroke: C.white, "stroke-width": 3, opacity: 0, "stroke-dasharray": "6 12" }, g));
        const dg = pts.map(([x, y]) => E("circle", { cx: x, cy: y, r: 3.8, fill: C.yellow, opacity: 0 }, g));
        fadeIn(label(g, "INVISIBLE INFRARED DOTS", 440, 150, 46, C.yellow), a + 0.1 * d);
        U.push((t) => {
          if (!inR(t, B)) return; const u = clamp((t - a - 0.2 * d) / 0.5);
          rays.forEach((r, i) => { r.setAttribute("opacity", u * 0.9); r.setAttribute("stroke-dashoffset", -((t - a) * 40 + i * 5)); });
          dg.forEach((c, i) => c.setAttribute("opacity", clamp((t - a - 0.3 * d - i * 0.004) / 0.2) * (0.6 + 0.4 * Math.sin(t * 5 + i))));
          back.forEach((r) => { r.setAttribute("opacity", clamp((t - a - 0.55 * d) / 0.4) * 0.85); r.setAttribute("stroke-dashoffset", ((t - a) * 30) % 18); });
        });
      }
      // beat 3: infrared works in total darkness
      {
        const g = beat(2), B = BT[2], a = B.a, d = B.b - B.a, R = rng(9);
        E("rect", { x: 20, y: 120, width: 840, height: 480, rx: 30, fill: "#050922", stroke: C.mute, "stroke-width": 4 }, g);
        const st = []; for (let i = 0; i < 34; i++) st.push({ ph: R() * TAU, el: E("circle", { cx: 50 + R() * 780, cy: 150 + R() * 140, r: 1.6 + R() * 2, fill: C.white }, g) });
        E("circle", { cx: 770, cy: 200, r: 44, fill: "#E9EEFF" }, g); E("circle", { cx: 790, cy: 188, r: 40, fill: "#050922" }, g);
        phone(g, 90, 330, 130, 230, { sw: 6 }); const pj = [205, 372];
        const fx = 600, fy = 430; E("ellipse", { cx: fx, cy: fy, rx: 92, ry: 128, fill: "#0A1040", stroke: C.mute, "stroke-width": 6 }, g); faceFeatures(g, fx, fy, 0.62);
        const rays = [0, 1, 2, 3, 4].map((i) => E("line", { x1: pj[0], y1: pj[1], x2: fx - 90, y2: fy - 100 + i * 50, stroke: C.yellow, "stroke-width": 4, "stroke-dasharray": "2 14", "stroke-linecap": "round", opacity: 0 }, g));
        const dots = []; for (let y = fy - 112; y < fy + 112; y += 20) for (let x = fx - 80; x < fx + 80; x += 20) if (inFace(x, y, fx, fy, 84, 118)) dots.push(E("circle", { cx: x, cy: y, r: 3.4, fill: C.yellow, opacity: 0 }, g));
        pop(label(g, "LIGHTS OFF", 440, 660, 56, C.white), a + 0.15 * d); pop(label(g, "STILL WORKS", 440, 725, 56, C.yellow), a + 0.4 * d);
        U.push((t) => { if (!inR(t, B)) return; st.forEach((q) => q.el.setAttribute("opacity", 0.45 + 0.5 * Math.sin(t * 2 + q.ph)));
          const u = clamp((t - a - 0.12 * d) / 0.5); rays.forEach((r, i) => { r.setAttribute("opacity", u * 0.9); r.setAttribute("stroke-dashoffset", -((t - a) * 40 + i * 5)); });
          dots.forEach((c, i) => c.setAttribute("opacity", clamp((t - a - 0.25 * d - i * 0.004) / 0.2) * (0.6 + 0.4 * Math.sin(t * 5 + i)))); });
      }
      // beat 4: the dot pattern bends over the nose and cheeks
      {
        const g = beat(3), B = BT[3], a = B.a, d = B.b - B.a, fx = 440, fy = 330, rx = 170, ry = 240, nx = fx, ny = 350;
        E("ellipse", { cx: fx, cy: fy, rx, ry, fill: C.navyD, stroke: C.white, "stroke-width": 8 }, g); faceFeatures(g, fx, fy - 30, 1.1);
        const pts = []; for (let y = fy - ry + 18; y < fy + ry - 10; y += 28) for (let x = fx - rx + 18; x < fx + rx - 10; x += 28) if (inFace(x, y, fx, fy, rx - 10, ry - 10)) pts.push({ x, y, el: E("circle", { cx: x, cy: y, r: 5, fill: C.yellow }, g) });
        const l1 = E("line", { x1: 170, y1: 190, x2: nx - 12, y2: ny - 10, stroke: C.yellow, "stroke-width": 4, "stroke-dasharray": "4 8" }, g), l2 = E("line", { x1: 700, y1: 430, x2: fx + 136, y2: fy + 120, stroke: C.white, "stroke-width": 4, "stroke-dasharray": "4 8" }, g);
        const t1 = label(g, "CLOSER", 130, 175, 50, C.yellow), t2 = label(g, "FARTHER", 770, 425, 50, C.white);
        [l1, t1].forEach((e) => fadeIn(e, a + 0.3 * d)); [l2, t2].forEach((e) => fadeIn(e, a + 0.45 * d));
        fadeIn(label(g, "EACH DOT SHIFTS WITH DEPTH", 440, 700, 46, C.white), a + 0.62 * d);
        U.push((t) => { if (!inR(t, B)) return; const p = ease(clamp((t - a - 0.1 * d) / (0.3 * d)));
          pts.forEach((q) => { const dx = q.x - nx, dy = q.y - ny, k = 0.5 * p * Math.exp(-((dx * dx + dy * dy) / (2 * 70 * 70))); q.el.setAttribute("cx", q.x - dx * k); q.el.setAttribute("cy", q.y - dy * k); }); });
      }
      // beat 4: thousands of shifts become a depth map, a 3D shape
      {
        const g = beat(4), B = BT[4], a = B.a, d = B.b - B.a, cx = 440, cy = 320, R = 168, RY = 232;
        const ml = []; for (let i = 0; i < 5; i++) ml.push(E("ellipse", { cx, cy, rx: R, ry: RY, fill: "none", stroke: C.yellow, "stroke-width": 4, opacity: 0.85 }, g));
        [-0.75, -0.4, 0, 0.4, 0.75].forEach((f) => E("ellipse", { cx, cy: cy + RY * f, rx: R * Math.sqrt(1 - f * f), ry: 16 + 12 * (1 - Math.abs(f)), fill: "none", stroke: C.yellow, "stroke-width": 4, opacity: 0.85 }, g));
        E("ellipse", { cx, cy, rx: R, ry: RY, fill: "none", stroke: C.white, "stroke-width": 8 }, g);
        const hg = E("g", { opacity: 0 }, g); E("circle", { cx, cy: cy + 20, r: 130, fill: "url(#glowY)" }, hg); fadeIn(hg, a + 0.35 * d, 0.6);
        pop(label(g, "DEPTH MAP", 440, 660, 62, C.yellow), a + 0.3 * d); fadeIn(label(g, "A 3D SHAPE, NOT A FLAT PICTURE", 440, 725, 42, C.white), a + 0.55 * d);
        U.push((t) => { if (!inR(t, B)) return; const th = (t - a) * 0.9; ml.forEach((e, i) => e.setAttribute("rx", Math.max(2, R * Math.abs(Math.cos(th + (i * Math.PI) / 5))))); });
      }
      // beat 5: the map becomes a pattern of numbers, stored in a secure chip. Not a photo.
      {
        const g = beat(5), B = BT[5], a = B.a, d = B.b - B.a, R = rng(7);
        const th = E("g", {}, g); E("rect", { x: 10, y: 130, width: 210, height: 210, rx: 20, fill: C.navyD, stroke: C.white, "stroke-width": 6 }, th);
        for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) { const dd = Math.hypot(c - 3, r - 3); E("circle", { cx: 38 + c * 27.5, cy: 158 + r * 27.5, r: 3 + 7 * Math.exp(-dd * dd / 5), fill: C.yellow, opacity: 0.45 + 0.5 * Math.exp(-dd * dd / 8) }, th); }
        pop(th, a + 0.05 * d); pop(label(g, "DEPTH MAP", 115, 395, 34, C.white), a + 0.08 * d);
        const a1 = arrowLine(g, 235, 235, 305, 235, C.white, 8); fadeIn(a1, a + 0.14 * d);
        const dg = E("g", {}, g), cells = []; for (let c = 0; c < 6; c++) for (let r = 0; r < 7; r++) cells.push(E("text", { x: 340 + c * 36, y: 160 + r * 32, "font-family": "Anton", "font-size": 30, fill: C.yellow, "text-anchor": "middle" }, dg, R() > 0.5 ? "1" : "0"));
        fadeIn(dg, a + 0.2 * d); fadeIn(label(g, "NUMBERS", 450, 395, 34, C.white), a + 0.22 * d);
        const a2 = arrowLine(g, 575, 235, 640, 235, C.white, 8); fadeIn(a2, a + 0.34 * d);
        const chip = E("g", {}, g); for (let i = 0; i < 6; i++) { const o = 665 + i * 28; E("line", { x1: o, y1: 150, x2: o, y2: 168, stroke: C.white, "stroke-width": 6, "stroke-linecap": "round" }, chip); E("line", { x1: o, y1: 322, x2: o, y2: 340, stroke: C.white, "stroke-width": 6, "stroke-linecap": "round" }, chip); }
        E("rect", { x: 650, y: 170, width: 200, height: 150, rx: 20, fill: C.navyD, stroke: C.white, "stroke-width": 7 }, chip); lockIcon(chip, 750, 215, 1.3);
        pop(chip, a + 0.4 * d); pop(label(g, "SECURE CHIP", 750, 395, 36, C.yellow), a + 0.45 * d);
        const ph = E("g", {}, g); E("rect", { x: 330, y: 470, width: 220, height: 150, rx: 16, fill: C.navyL, stroke: C.white, "stroke-width": 7 }, ph); E("circle", { cx: 440, cy: 530, r: 30, fill: C.white }, ph); E("path", { d: "M380,600 Q440,545 500,600 Z", fill: C.white }, ph);
        E("line", { x1: 320, y1: 460, x2: 560, y2: 630, stroke: C.red, "stroke-width": 12, "stroke-linecap": "round" }, ph); E("line", { x1: 560, y1: 460, x2: 320, y2: 630, stroke: C.red, "stroke-width": 12, "stroke-linecap": "round" }, ph);
        pop(ph, a + 0.7 * d); pop(label(g, "NOT A PHOTO", 440, 700, 58, C.white), a + 0.74 * d);
        U.push((t) => { if (!inR(t, B)) return; cells.forEach((c, i) => { if (((t * 5 + i * 0.37) % 7) < 0.1) c.textContent = R() > 0.5 ? "1" : "0"; }); });
      }
      // beat 6: it scans again, compares, and unlocks
      {
        const g = beat(6), B = BT[6], a = B.a, d = B.b - B.a, R = rng(11);
        const card = (x, title) => { const c = E("g", {}, g); E("rect", { x, y: 70, width: 340, height: 290, rx: 24, fill: C.navyD, stroke: C.white, "stroke-width": 6 }, c); label(c, title, x + 170, 118, 40, C.yellow); return c; };
        const cs = card(20, "STORED"), cn = card(520, "NEW SCAN"), seed = [];
        for (let r = 0; r < 4; r++) for (let c = 0; c < 7; c++) seed.push([R(), R(), R()]);
        [[cs, 20, 0], [cn, 520, 1]].forEach(([c, x, j]) => seed.forEach((s, i) => { const r = Math.floor(i / 7), cc = i % 7; E("circle", { cx: x + 48 + cc * 40 + (j ? (s[1] - 0.5) * 5 : 0), cy: 168 + r * 44 + (j ? (s[2] - 0.5) * 5 : 0), r: 4 + s[0] * 8, fill: C.yellow, opacity: 0.9 }, c); }));
        [cs, cn].forEach((c, i) => pop(c, a + 0.05 * d + i * 0.15 * d));
        const eq = E("g", {}, g); E("rect", { x: 392, y: 190, width: 96, height: 14, rx: 7, fill: C.yellow }, eq); E("rect", { x: 392, y: 226, width: 96, height: 14, rx: 7, fill: C.yellow }, eq); pop(eq, a + 0.3 * d);
        pop(label(g, "CLOSE ENOUGH", 440, 430, 54, C.yellow), a + 0.38 * d);
        phone(g, 350, 470, 180, 270); const lk = lockIcon(g, 440, 600, 1.5, C.white, 0);
        const ck = checkMark(g, 520, 480, 40); gsap.set(ck, { opacity: 0 });
        tl.fromTo(lk.shackle, { attr: { transform: "translate(0,0) rotate(0 22 -6)" } }, { attr: { transform: "translate(30,-12) rotate(30 22 -6)" }, duration: 0.4, ease: "back.out(2)", immediateRender: false }, a + 0.55 * d);
        pop(ck, a + 0.6 * d);
      }
      // beat 7: it adapts a little over time as your face changes
      {
        const g = beat(7), B = BT[7], a = B.a, d = B.b - B.a, R = rng(5), fx = 640, fy = 330;
        const cd = E("g", {}, g); E("rect", { x: 20, y: 150, width: 330, height: 250, rx: 24, fill: C.navyD, stroke: C.white, "stroke-width": 6 }, cd); label(cd, "STORED PATTERN", 185, 200, 36, C.yellow);
        const dots = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) dots.push({ r, c, s: R(), el: E("circle", { cx: 60 + c * 50, cy: 250 + r * 45, r: 6, fill: C.yellow }, cd) });
        pop(cd, a + 0.05 * d); fadeIn(arrowLine(g, 365, 275, 440, 275, C.white, 8), a + 0.2 * d);
        E("ellipse", { cx: fx, cy: fy, rx: 130, ry: 175, fill: C.navyD, stroke: C.white, "stroke-width": 7 }, g); faceFeatures(g, fx, fy, 0.8);
        const gl = E("g", { opacity: 0 }, g); [-1, 1].forEach((s) => E("circle", { cx: fx + s * 44, cy: fy - 32, r: 26, fill: "none", stroke: C.yellow, "stroke-width": 6 }, gl)); E("line", { x1: fx - 18, y1: fy - 32, x2: fx + 18, y2: fy - 32, stroke: C.yellow, "stroke-width": 6 }, gl); fadeIn(gl, a + 0.3 * d);
        const bd = E("g", { opacity: 0 }, g); for (let i = 0; i < 14; i++) E("circle", { cx: fx - 70 + i * 10.8, cy: fy + 96 + 18 * Math.sin((i / 13) * Math.PI), r: 3.2, fill: C.white, opacity: 0.8 }, bd); fadeIn(bd, a + 0.55 * d);
        pop(label(g, "UPDATES SLOWLY", 440, 640, 62, C.yellow), a + 0.4 * d); fadeIn(label(g, "AS YOU CHANGE", 440, 705, 44, C.white), a + 0.6 * d);
        U.push((t) => { if (!inR(t, B)) return; const k = clamp((t - a - 0.3 * d) / (0.5 * d)); dots.forEach((q) => { q.el.setAttribute("cx", 60 + q.c * 50 + (q.s - 0.5) * 8 * k * Math.sin((t - a) * 1.2 + q.r)); q.el.setAttribute("r", 6 + 2.5 * k * Math.sin((t - a) * 1.5 + q.c)); }); });
      }
      // beat 8: a flat photo has no depth, so it fails
      {
        const g = beat(8), B = BT[8], a = B.a, d = B.b - B.a;
        phone(g, 40, 200, 170, 330);
        E("circle", { cx: 100, cy: 245, r: 11, fill: C.yellow }, g);
        const beam = E("polygon", { points: "100,255 430,170 430,590", fill: C.yellow, opacity: 0 }, g); fadeTo(beam, a + 0.1 * d, 0.16);
        E("rect", { x: 430, y: 170, width: 330, height: 420, rx: 22, fill: C.navyL, stroke: C.white, "stroke-width": 7 }, g);
        E("circle", { cx: 595, cy: 320, r: 62, fill: C.white }, g); E("path", { d: "M480,540 Q595,400 710,540 Z", fill: C.white }, g);
        const fl = []; for (let y = 200; y < 560; y += 30) for (let x = 460; x < 740; x += 30) fl.push(E("circle", { cx: x, cy: y, r: 4.4, fill: C.yellow, opacity: 0 }, g));
        U.push((t) => { if (!inR(t, B)) return; fl.forEach((c, i) => c.setAttribute("opacity", clamp((t - a - 0.15 * d - i * 0.003) / 0.2) * 0.9)); });
        pop(label(g, "FLAT: NO DEPTH", 595, 660, 56, C.white), a + 0.3 * d);
        pop(crossMark(g, 595, 380, 78), a + 0.5 * d);
      }
