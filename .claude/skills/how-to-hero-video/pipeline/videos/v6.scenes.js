      // ===== VIDEO 6: how fiber internet works =====
      const tubeR = (g, x0, x1, y, h, col = C.sky) => E("rect", { x: x0, y: y - h / 2, width: x1 - x0, height: h, rx: Math.min(30, h / 2), fill: C.navyD, stroke: col, "stroke-width": 6 }, g);
      function stream(g, B, x0, x1, y, n, speed, seed, col = C.yellow, ampFn = null) {
        const R = rng(seed), els = [];
        for (let i = 0; i < n; i++) els.push({ w: 22 + R() * 44, ph: i / n + R() * 0.03, el: E("rect", { x: x0, y: y - 9, width: 0, height: 18, rx: 9, fill: col, opacity: 0 }, g) });
        U.push((t) => { if (!inR(t, B)) return; els.forEach((q) => { const u = (((t - B.a) * speed + q.ph) % 1 + 1) % 1, x = lerp(x0, x1, u), xs = Math.max(x0, x - q.w / 2), xe = Math.min(x1, x + q.w / 2);
          q.el.setAttribute("x", xs); q.el.setAttribute("width", Math.max(0, xe - xs)); q.el.setAttribute("opacity", ampFn ? ampFn(x) : 1); }); });
      }
      // beat 1: a stream of light flashes from a phone to the world (under the headline: local y >= 340)
      {
        const g = beat(0), B = BT[0], a = B.a;
        phone(g, 30, 410, 110, 190); pop(label(g, "LIGHT IN GLASS", 440, 700, 60, C.yellow), a + 1.4);
        E("rect", { x: 160, y: 497, width: 540, height: 36, rx: 18, fill: C.navyD, stroke: C.sky, "stroke-width": 6 }, g);
        stream(g, B, 170, 690, 515, 7, 0.28, 4);
        const gl = E("g", {}, g); E("circle", { cx: 780, cy: 515, r: 84, fill: C.navyD, stroke: C.white, "stroke-width": 7 }, gl);
        E("ellipse", { cx: 780, cy: 515, rx: 36, ry: 84, fill: "none", stroke: C.mute, "stroke-width": 4 }, gl); E("line", { x1: 696, y1: 515, x2: 864, y2: 515, stroke: C.mute, "stroke-width": 4 }, gl);
        E("path", { d: "M712,460 Q780,480 848,460 M712,570 Q780,550 848,570", fill: "none", stroke: C.mute, "stroke-width": 4 }, gl); pop(gl, a + 0.5);
      }
      // beat 2: cable cross-section, the glass core is as thin as a hair
      {
        const g = beat(1), B = BT[1], a = B.a, d = B.b - B.a, cx = 270, cy = 320;
        const o = E("g", {}, g); E("circle", { cx, cy, r: 200, fill: C.navyL, stroke: C.white, "stroke-width": 8 }, o); E("circle", { cx, cy, r: 130, fill: C.navyD, stroke: C.sky, "stroke-width": 6 }, o); pop(o, a + 0.05 * d);
        E("circle", { cx, cy, r: 60, fill: "url(#glowY)" }, g); const core = E("circle", { cx, cy, r: 24, fill: C.yellow, stroke: C.ink, "stroke-width": 4 }, g); pop(core, a + 0.25 * d);
        const l1 = E("g", {}, g); E("line", { x1: 400, y1: 190, x2: 500, y2: 190, stroke: C.mute, "stroke-width": 5, "stroke-linecap": "round" }, l1); T(l1, "TOUGH COATING", 515, 204, 44, C.white, { anchor: "start" }); fadeIn(l1, a + 0.4 * d);
        const l2 = E("g", {}, g); E("line", { x1: 300, y1: 320, x2: 500, y2: 320, stroke: C.yellow, "stroke-width": 5, "stroke-linecap": "round" }, l2); T(l2, "GLASS STRAND", 515, 334, 44, C.yellow, { anchor: "start" }); fadeIn(l2, a + 0.55 * d);
        pop(label(g, "THIN AS A HAIR", 440, 650, 72, C.white), a + 0.7 * d);
      }
      // beat 3: bits as light on / light off
      {
        const g = beat(2), B = BT[2], a = B.a, d = B.b - B.a, bits = [1, 0, 1, 1, 0, 1, 0, 0];
        bits.forEach((b, i) => {
          const x = 80 + i * 90, k = E("g", {}, g);
          E("rect", { x, y: 110, width: 80, height: 100, rx: 14, fill: C.navyD, stroke: C.white, "stroke-width": 5 }, k); T(k, String(b), x + 40, 188, 72, b ? C.yellow : C.mute, { sw: 5 });
          E("line", { x1: x + 40, y1: 222, x2: x + 40, y2: 262, stroke: C.mute, "stroke-width": 4, "stroke-dasharray": "2 9", "stroke-linecap": "round" }, k);
          if (b) E("circle", { cx: x + 40, cy: 320, r: 62, fill: "url(#glowY)" }, k);
          E("circle", { cx: x + 40, cy: 320, r: 32, fill: b ? C.yellow : C.navyD, stroke: b ? C.ink : C.mute, "stroke-width": 5 }, k);
          pop(k, a + 0.08 * d + i * 0.04 * d);
        });
        pop(label(g, "LIGHT ON = 1", 440, 520, 66, C.yellow), a + 0.5 * d); pop(label(g, "LIGHT OFF = 0", 440, 610, 66, C.white), a + 0.65 * d);
      }
      // beat 4: light bounces inside the glass
      {
        const g = beat(3), B = BT[3], a = B.a, d = B.b - B.a;
        tubeR(g, 30, 850, 330, 220); const P = []; for (let i = 0; i <= 8; i++) P.push([50 + i * 97, i % 2 ? 420 : 240]);
        const pl = E("polyline", { points: P.map((p) => p.join(",")).join(" "), fill: "none", stroke: C.yellow, "stroke-width": 7, "stroke-linejoin": "round" }, g); fadeTo(pl, a + 0.1 * d, 0.45);
        const gl = E("circle", { r: 34, fill: "url(#glowY)" }, g), dot = E("circle", { r: 15, fill: C.yellow, stroke: C.ink, "stroke-width": 3 }, g);
        U.push((t) => { if (!inR(t, B)) return; const u = (((t - a) * 0.17) % 1) * 8, i = Math.min(7, Math.floor(u)), k = u - i, x = lerp(P[i][0], P[i + 1][0], k), y = lerp(P[i][1], P[i + 1][1], k); [gl, dot].forEach((e) => { e.setAttribute("cx", x); e.setAttribute("cy", y); }); });
        pop(label(g, "LIGHT BOUNCES INSIDE", 440, 560, 62, C.white), a + 0.3 * d); pop(label(g, "IT STAYS IN THE GLASS", 440, 650, 62, C.yellow), a + 0.55 * d);
      }
      // beat 5: clear glass, light travels far
      {
        const g = beat(4), B = BT[4], a = B.a, d = B.b - B.a;
        pop(label(g, "VERY CLEAR GLASS", 440, 150, 70, C.white), a + 0.05 * d);
        [[30, 100, 120], [70, 120, 170], [114, 90, 100]].forEach(([x, w, h]) => E("rect", { x, y: 360 - h, width: w * 0.6, height: h, rx: 6, fill: C.navyD, stroke: C.white, "stroke-width": 5 }, g));
        [[780, 60, 110], [832, 55, 160]].forEach(([x, w, h]) => E("rect", { x, y: 360 - h, width: w, height: h, rx: 6, fill: C.navyD, stroke: C.white, "stroke-width": 5 }, g));
        tubeR(g, 190, 760, 320, 50); stream(g, B, 195, 755, 320, 6, 0.22, 8, C.yellow, (x) => 1 - 0.45 * (x - 195) / 560);
        const ar = E("g", {}, g); E("line", { x1: 200, y1: 460, x2: 750, y2: 460, stroke: C.sky, "stroke-width": 7, "stroke-linecap": "round" }, ar); [[200, 1], [750, -1]].forEach(([x, s]) => E("polyline", { points: `${x + 24 * s},440 ${x},460 ${x + 24 * s},480`, fill: "none", stroke: C.sky, "stroke-width": 7, "stroke-linecap": "round", "stroke-linejoin": "round" }, ar)); fadeIn(ar, a + 0.35 * d);
        pop(label(g, "LIGHT TRAVELS FAR", 440, 600, 66, C.yellow), a + 0.55 * d);
      }
      // beat 6: boosters along a very long route
      {
        const g = beat(5), B = BT[5], a = B.a, d = B.b - B.a, seg = [30, 300, 580, 850];
        tubeR(g, 30, 850, 300, 56);
        stream(g, B, 36, 844, 300, 9, 0.2, 12, C.yellow, (x) => { const s = x < seg[1] ? 0 : x < seg[2] ? 1 : 2; return 1 - 0.7 * (x - seg[s]) / (seg[s + 1] - seg[s]); });
        [300, 580].forEach((x, i) => { const k = E("g", {}, g); E("rect", { x: x - 48, y: 230, width: 96, height: 140, rx: 18, fill: C.yellow, stroke: C.ink, "stroke-width": 5 }, k);
          E("path", { d: `M${x - 20},300 H${x + 20} M${x},280 V${x + 0 - x + 320}`, fill: "none", stroke: C.navyD, "stroke-width": 10, "stroke-linecap": "round" }, k); pop(k, a + 0.12 * d + i * 0.12 * d); });
        pop(label(g, "BOOSTERS", 440, 480, 66, C.white), a + 0.5 * d); pop(label(g, "A FRESH PUSH", 440, 570, 66, C.yellow), a + 0.65 * d);
      }
      // beat 7: many colours share one strand
      {
        const g = beat(6), B = BT[6], a = B.a, d = B.b - B.a;
        tubeR(g, 30, 850, 290, 210); [[245, C.yellow, 0.26, 21], [290, C.sky, 0.2, 22], [335, C.red, 0.32, 23]].forEach(([y, c, sp, s]) => stream(g, B, 40, 840, y, 6, sp, s, c));
        pop(label(g, "MANY COLOURS", 440, 520, 70, C.white), a + 0.3 * d); pop(label(g, "ONE STRAND", 440, 615, 70, C.yellow), a + 0.5 * d);
      }
      // beat 8: nothing is faster than light
      {
        const g = beat(7), B = BT[7], a = B.a, d = B.b - B.a, ys = [150, 290, 430];
        ys.forEach((y, i) => { E("line", { x1: 170, y1: y, x2: 840, y2: y, stroke: C.mute, "stroke-width": 4, "stroke-dasharray": "3 14", "stroke-linecap": "round" }, g); T(g, ["CAR", "PLANE", "LIGHT"][i], 20, y + 15, 44, i === 2 ? C.yellow : C.white, { anchor: "start" }); });
        E("line", { x1: 840, y1: 110, x2: 840, y2: 470, stroke: C.white, "stroke-width": 6, "stroke-dasharray": "14 10" }, g);
        const car = E("rect", { width: 64, height: 34, rx: 10, fill: C.red, stroke: C.ink, "stroke-width": 4 }, g), pl = E("polygon", { points: "30,0 -22,-24 -10,0 -22,24", fill: C.white, stroke: C.ink, "stroke-width": 4, "stroke-linejoin": "round" }, g);
        const lg = E("circle", { r: 40, fill: "url(#glowY)" }, g), li = E("circle", { r: 17, fill: C.yellow, stroke: C.ink, "stroke-width": 4 }, g);
        U.push((t) => { if (!inR(t, B)) return; const x = (sp) => 190 + 640 * clamp((t - a - 0.3) * sp);
          car.setAttribute("x", x(0.06) - 32); car.setAttribute("y", ys[0] - 17); pl.setAttribute("transform", `translate(${x(0.2)},${ys[1]})`);
          [lg, li].forEach((e) => { e.setAttribute("cx", x(0.85)); e.setAttribute("cy", ys[2]); }); });
        pop(label(g, "NOTHING IS FASTER", 440, 600, 66, C.yellow), a + 0.4 * d); pop(label(g, "THAN LIGHT", 440, 680, 66, C.white), a + 0.5 * d);
      }
      // beat 9: the receiver turns flashes back into video
      {
        const g = beat(8), B = BT[8], a = B.a, d = B.b - B.a;
        tubeR(g, 20, 300, 330, 50); stream(g, B, 26, 294, 330, 4, 0.3, 31);
        const rx = E("g", {}, g); E("rect", { x: 300, y: 250, width: 240, height: 160, rx: 20, fill: C.navyD, stroke: C.white, "stroke-width": 7 }, rx); T(rx, "RECEIVER", 420, 345, 48, C.white); pop(rx, a + 0.12 * d);
        fadeIn(arrowLine(g, 560, 330, 640, 330, C.white, 8), a + 0.3 * d);
        const ph = phone(g, 670, 190, 170, 290); const pg = E("g", {}, g); E("polygon", { points: "725,300 725,370 790,335", fill: C.yellow, stroke: C.ink, "stroke-width": 4, "stroke-linejoin": "round" }, pg); pop(pg, a + 0.4 * d); void ph;
        pop(label(g, "BACK TO YOUR VIDEO", 440, 600, 66, C.yellow), a + 0.5 * d);
      }
