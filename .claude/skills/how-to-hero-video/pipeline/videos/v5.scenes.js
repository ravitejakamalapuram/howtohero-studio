      // ===== VIDEO 5: how noise-cancelling headphones work =====
      function earCup(g, o = {}) {
        const k = E("g", {}, g);
        E("rect", { x: 340, y: 190, width: 230, height: 400, rx: 60, fill: C.navyD, stroke: C.white, "stroke-width": 8 }, k);
        E("path", { d: "M500,320 C470,300 470,350 490,370 C510,390 480,420 460,410", fill: "none", stroke: C.sky, "stroke-width": 8, "stroke-linecap": "round" }, k); T(k, "EAR", 500, 470, 34, C.sky, { sw: 4 });
        return k;
      }
      // beat 1: headphones, a wave and its opposite
      {
        const g = beat(0), B = BT[0], a = B.a, d = B.b - B.a;
        const w1 = E("path", { fill: "none", stroke: C.white, "stroke-width": 9, "stroke-linecap": "round" }, g), w2 = E("path", { fill: "none", stroke: C.yellow, "stroke-width": 9, "stroke-linecap": "round" }, g);
        fadeIn(label(g, "NOISE", 70, 350, 36, C.white, { anchor: "start" }), a + 0.15 * d); fadeIn(label(g, "THE OPPOSITE", 70, 480, 36, C.yellow, { anchor: "start" }), a + 0.35 * d);
        const hp = E("g", {}, g); E("path", { d: "M250,720 C250,560 630,560 630,720", fill: "none", stroke: C.white, "stroke-width": 16, "stroke-linecap": "round" }, hp); E("rect", { x: 215, y: 660, width: 75, height: 90, rx: 24, fill: C.navyD, stroke: C.white, "stroke-width": 9 }, hp); E("rect", { x: 590, y: 660, width: 75, height: 90, rx: 24, fill: C.navyD, stroke: C.white, "stroke-width": 9 }, hp); pop(hp, a + 0.1 * d);
        U.push((t) => { if (!inR(t, B)) return; const ph = (t - a) * 5; w1.setAttribute("d", wavePath(70, 810, 400, 30, 120, ph, 5)); w2.setAttribute("d", wavePath(70, 810, 525, -30, 120, ph, 5)); w1.setAttribute("opacity", clamp((t - a) / 0.4)); w2.setAttribute("opacity", clamp((t - a - 0.3 * d) / 0.4)); });
      }
      // beat 2: a sound wave, peaks push and dips pull
      {
        const g = beat(1), B = BT[1], a = B.a, d = B.b - B.a, WL = 220, K = TAU / WL, YC = 400;
        const w = E("path", { fill: "none", stroke: C.white, "stroke-width": 9, "stroke-linecap": "round" }, g);
        const pk = [0, 1, 2, 3, 4].map(() => E("circle", { r: 15, fill: C.yellow, stroke: C.ink, "stroke-width": 4, opacity: 0 }, g)), dp = [0, 1, 2, 3, 4].map(() => E("circle", { r: 15, fill: C.sky, stroke: C.ink, "stroke-width": 4, opacity: 0 }, g));
        const ps = []; for (let i = 0; i < 38; i++) ps.push({ x0: 40 + i * 21, el: E("circle", { cy: 570, r: 7, fill: C.white }, g) });
        fadeIn(label(g, "AIR", 70, 620, 36, C.mute, { anchor: "start" }), a + 0.2 * d);
        pop(label(g, "PEAK = PUSH", 250, 720, 48, C.yellow), a + 0.35 * d); pop(label(g, "DIP = PULL", 650, 720, 48, C.sky), a + 0.5 * d);
        U.push((t) => { if (!inR(t, B)) return; const ph = (t - a) * 2.2, u = clamp((t - a) / 0.5);
          w.setAttribute("d", wavePath(20, 860, YC, -85, WL, ph, 5).replace(/M/, "M")); w.setAttribute("opacity", u);
          const base = ((Math.PI / 2 + ph) / K) % WL;
          pk.forEach((c, n) => { const x = 20 + base + n * WL; c.setAttribute("cx", x); c.setAttribute("cy", YC - 85); c.setAttribute("opacity", x <= 860 ? u : 0); });
          dp.forEach((c, n) => { const x = 20 + base + WL / 2 + n * WL; c.setAttribute("cx", x); c.setAttribute("cy", YC + 85); c.setAttribute("opacity", x <= 860 ? u : 0); });
          ps.forEach((p) => { const x = p.x0 + 12 * Math.cos(K * (p.x0 - 20) - ph + Math.PI / 2 * 0); p.el.setAttribute("cx", x); p.el.setAttribute("opacity", clamp((t - a - 0.15 * d) / 0.4)); }); });
      }
      // beat 2 (8-18): microphone on the outside of the ear cup listens to the noise
      {
        const g = beat(2), B = BT[2], a = B.a, d = B.b - B.a;
        earCup(g); const mic = E("g", {}, g); E("circle", { cx: 340, cy: 290, r: 24, fill: C.yellow, stroke: C.ink, "stroke-width": 5 }, mic); E("circle", { cx: 340, cy: 290, r: 9, fill: C.navyD }, mic); pop(mic, a + 0.12 * d);
        const ml = E("g", {}, g); T(ml, "MIC", 190, 160, 56, C.yellow, { sw: 6 }); E("line", { x1: 235, y1: 178, x2: 322, y2: 276, stroke: C.yellow, "stroke-width": 5, "stroke-dasharray": "4 8" }, ml); fadeIn(ml, a + 0.22 * d);
        fadeIn(label(g, "NOISE AROUND YOU", 190, 700, 44, C.white), a + 0.3 * d);
        const arcs = [0, 1, 2, 3, 4].map(() => E("path", { fill: "none", stroke: C.white, "stroke-width": 8, "stroke-linecap": "round" }, g));
        U.push((t) => { if (!inR(t, B)) return; arcs.forEach((r, i) => { const p = (((t - a) * 0.45 + i / 5) % 1), x = 20 + p * 300; r.setAttribute("d", `M${x},${200} Q${x + 36},290 ${x},380`); r.setAttribute("opacity", p < 0.85 ? clamp((t - a) / 0.3) * Math.min(1, p * 6) : (1 - p) * 6); }); });
      }
      // beat 3 (18-28): a chip flips the wave upside down
      {
        const g = beat(3), B = BT[3], a = B.a, d = B.b - B.a;
        const wi = E("path", { fill: "none", stroke: C.white, "stroke-width": 9, "stroke-linecap": "round" }, g), wo = E("path", { fill: "none", stroke: C.yellow, "stroke-width": 9, "stroke-linecap": "round" }, g);
        const chip = E("g", {}, g); for (let i = 0; i < 5; i++) { const o = 365 + i * 38; E("line", { x1: o, y1: 270, x2: o, y2: 290, stroke: C.white, "stroke-width": 7, "stroke-linecap": "round" }, chip); E("line", { x1: o, y1: 430, x2: o, y2: 450, stroke: C.white, "stroke-width": 7, "stroke-linecap": "round" }, chip); }
        E("rect", { x: 340, y: 290, width: 210, height: 140, rx: 22, fill: C.navyD, stroke: C.white, "stroke-width": 8 }, chip); T(chip, "CHIP", 445, 378, 56, C.white, { sw: 6 }); pop(chip, a + 0.06 * d);
        const mi = E("g", {}, g), mo = E("g", {}, g); E("circle", { r: 13, fill: C.white }, mi); E("circle", { r: 13, fill: C.yellow }, mo);
        const ti = label(g, "PEAK", 160, 215, 40, C.white), to = label(g, "DIP", 730, 565, 40, C.yellow); fadeIn(ti, a + 0.25 * d); fadeIn(to, a + 0.45 * d);
        pop(label(g, "PEAKS BECOME DIPS", 440, 700, 60, C.yellow), a + 0.55 * d);
        U.push((t) => { if (!inR(t, B)) return; const ph = (t - a) * 4, k = Math.cos(clamp((t - a - 0.3 * d) / 0.8) * Math.PI), yi = (x) => 360 + 70 * Math.sin(((x - 20) / 140) * TAU - ph), yo = (x) => 360 - k * 0 + 70 * k * Math.sin(((x - 580) / 140) * TAU - ph + 0 * Math.PI);
          wi.setAttribute("d", wavePath(20, 300, 360, 70, 140, ph, 5)); wo.setAttribute("d", (() => { let dd = ""; for (let x = 580; x <= 860; x += 5) dd += (dd ? " L" : "M") + x + "," + (360 + 70 * k * Math.sin(((x - 580) / 140) * TAU - ph)).toFixed(1); return dd; })());
          const xi = 160, xo = 730; mi.setAttribute("transform", `translate(${xi},${yi(xi)})`); mo.setAttribute("transform", `translate(${xo},${360 + 70 * k * Math.sin(((xo - 580) / 140) * TAU - ph)})`); void yo; });
      }
      // beat 4 (28-36): the speaker plays the flipped wave into the ear
      {
        const g = beat(4), B = BT[4], a = B.a, d = B.b - B.a;
        earCup(g); const sp = E("g", {}, g); E("circle", { cx: 400, cy: 390, r: 42, fill: C.navy, stroke: C.yellow, "stroke-width": 8 }, sp); E("circle", { cx: 400, cy: 390, r: 15, fill: C.yellow }, sp); pop(sp, a + 0.1 * d);
        fadeIn(label(g, "SPEAKER", 190, 160, 52, C.yellow), a + 0.2 * d); E("line", { x1: 295, y1: 178, x2: 372, y2: 358, stroke: C.yellow, "stroke-width": 5, "stroke-dasharray": "4 8" }, g);
        const arcs = [0, 1, 2].map(() => E("path", { fill: "none", stroke: C.yellow, "stroke-width": 9, "stroke-linecap": "round" }, g));
        fadeIn(label(g, "THE FLIPPED WAVE", 440, 700, 52, C.yellow), a + 0.4 * d);
        U.push((t) => { if (!inR(t, B)) return; arcs.forEach((r, i) => { const p = (((t - a) * 0.6 + i / 3) % 1), x = 450 + p * 120; r.setAttribute("d", `M${x},${330} Q${x + 28},390 ${x},450`); r.setAttribute("opacity", clamp((t - a - 0.15 * d) / 0.3) * (1 - p)); }); });
      fadeIn(label(g, "+ YOUR MUSIC", 720, 640, 40, C.white), a + 0.6 * d);
      }
      // beat 5 (36-45): noise + opposite = a flat line
      {
        const g = beat(5), B = BT[5], a = B.a, d = B.b - B.a;
        const pw = (col) => E("path", { fill: "none", stroke: col, "stroke-width": 9, "stroke-linecap": "round" }, g), n1 = pw(C.white), n2 = pw(C.yellow), n3 = pw(C.green);
        label(g, "NOISE", 40, 48, 36, C.white, { anchor: "start" }); label(g, "THE OPPOSITE", 40, 285, 36, C.yellow, { anchor: "start" }); label(g, "ADDED TOGETHER", 40, 520, 36, C.white, { anchor: "start" });
        const plus = E("g", {}, g); E("line", { x1: 410, y1: 225, x2: 470, y2: 225, stroke: C.white, "stroke-width": 9, "stroke-linecap": "round" }, plus); E("line", { x1: 440, y1: 195, x2: 440, y2: 255, stroke: C.white, "stroke-width": 9, "stroke-linecap": "round" }, plus);
        const eq = E("g", {}, g); E("line", { x1: 410, y1: 455, x2: 470, y2: 455, stroke: C.white, "stroke-width": 9, "stroke-linecap": "round" }, eq); E("line", { x1: 410, y1: 477, x2: 470, y2: 477, stroke: C.white, "stroke-width": 9, "stroke-linecap": "round" }, eq);
        fadeIn(plus, a + 0.1 * d); fadeIn(eq, a + 0.25 * d); pop(label(g, "QUIET", 440, 715, 84, C.green), a + 0.7 * d);
        U.push((t) => { if (!inR(t, B)) return; const ph = (t - a) * 5, dl = 1.3 * (1 - ease(clamp((t - a - 0.3 * d) / (0.35 * d))));
          let s1 = "", s2 = "", s3 = ""; for (let x = 40; x <= 840; x += 5) { const n = Math.sin(((x - 40) / 120) * TAU - ph), o = -Math.sin(((x - 40) / 120) * TAU - ph + dl); s1 += (s1 ? " L" : "M") + x + "," + (130 + 55 * n).toFixed(1); s2 += (s2 ? " L" : "M") + x + "," + (370 + 55 * o).toFixed(1); s3 += (s3 ? " L" : "M") + x + "," + (590 + 55 * (n + o)).toFixed(1); }
          n1.setAttribute("d", s1); n2.setAttribute("d", s2); n3.setAttribute("d", s3); n2.setAttribute("opacity", clamp((t - a - 0.1 * d) / 0.4)); n3.setAttribute("opacity", clamp((t - a - 0.2 * d) / 0.4)); });
      }
      // beat 7: a steady hum repeats, so it is easy to predict and cancel
      {
        const g = beat(6), B = BT[6], a = B.a, d = B.b - B.a;
        label(g, "STEADY ENGINE HUM", 40, 70, 40, C.white, { anchor: "start" }); label(g, "WHAT YOU HEAR", 40, 400, 40, C.green, { anchor: "start" });
        const S = (col, extra = {}) => E("path", { fill: "none", stroke: col, "stroke-width": 8, "stroke-linecap": "round", "stroke-linejoin": "round", ...extra }, g);
        const top = S(C.white), pred = S(C.yellow, { "stroke-dasharray": "2 14" }), bot = S(C.green), cur = E("line", { y1: 100, y2: 540, stroke: C.yellow, "stroke-width": 4, opacity: 0.9 }, g);
        pop(label(g, "IT REPEATS, SO IT'S EASY TO PREDICT", 440, 700, 40, C.yellow), a + 0.5 * d);
        U.push((t) => { if (!inR(t, B)) return; const xr = 40 + 800 * clamp((t - a - 0.08 * d) / (0.8 * d)), hum = (x) => 55 * Math.sin(((x - 40) / 110) * TAU);
          let s1 = "", s2 = "", s3 = ""; for (let x = 40; x <= 840; x += 4) { const y = (200 + hum(x)).toFixed(1); if (x <= xr) { s1 += (s1 ? " L" : "M") + x + "," + y; s3 += (s3 ? " L" : "M") + x + "," + (490 + 0.04 * hum(x)).toFixed(1); } else s2 += (s2 ? " L" : "M") + x + "," + y; }
          top.setAttribute("d", s1 || "M0,0"); pred.setAttribute("d", s2 || "M0,0"); bot.setAttribute("d", s3 || "M0,0"); cur.setAttribute("x1", xr); cur.setAttribute("x2", xr); });
      }
      // beat 8: a sudden voice changes too fast and sneaks through
      {
        const g = beat(7), B = BT[7], a = B.a, d = B.b - B.a;
        label(g, "HUM + A SUDDEN VOICE", 40, 70, 40, C.white, { anchor: "start" }); label(g, "WHAT YOU HEAR", 40, 400, 40, C.green, { anchor: "start" });
        const S = (col) => E("path", { fill: "none", stroke: col, "stroke-width": 8, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
        const top = S(C.white), bot = S(C.green), cur = E("line", { y1: 100, y2: 580, stroke: C.yellow, "stroke-width": 4, opacity: 0.9 }, g);
        pop(label(g, "SUDDEN SOUNDS SNEAK THROUGH", 440, 700, 44, C.yellow), a + 0.62 * d);
        U.push((t) => { if (!inR(t, B)) return; const xr = 40 + 800 * clamp((t - a - 0.08 * d) / (0.8 * d)), hum = (x) => 40 * Math.sin(((x - 40) / 110) * TAU),
            voice = (x) => (x > 520 && x < 720 ? 85 * Math.sin((Math.PI * (x - 520)) / 200) ** 2 * Math.sin(x / 7) : 0);
          let s1 = "", s3 = ""; for (let x = 40; x <= xr; x += 3) { s1 += (s1 ? " L" : "M") + x + "," + (200 + hum(x) + voice(x)).toFixed(1); s3 += (s3 ? " L" : "M") + x + "," + (495 + 0.04 * hum(x) + 0.9 * voice(x)).toFixed(1); }
          top.setAttribute("d", s1 || "M0,0"); bot.setAttribute("d", s3 || "M0,0"); cur.setAttribute("x1", xr); cur.setAttribute("x2", xr); });
      }
      // beat 9: on a plane the drone fades, your name does not
      {
        const g = beat(8), B = BT[8], a = B.a, d = B.b - B.a;
        const pl = E("g", {}, g); E("polygon", { points: "400,125 330,40 380,40 485,125", fill: C.mute }, pl); E("polygon", { points: "310,120 280,60 325,60 365,115", fill: C.mute }, pl);
        E("ellipse", { cx: 440, cy: 130, rx: 150, ry: 34, fill: C.white }, pl); for (let i = 0; i < 6; i++) E("circle", { cx: 380 + i * 24, cy: 124, r: 6, fill: C.navyD }, pl); pop(pl, a + 0.05 * d);
        label(g, "PLANE DRONE", 40, 290, 44, C.sky, { anchor: "start" }); label(g, "YOUR NAME", 40, 500, 44, C.yellow, { anchor: "start" });
        [305, 515].forEach((y) => E("rect", { x: 40, y, width: 800, height: 56, rx: 28, fill: C.navyD, stroke: C.white, "stroke-width": 5 }, g));
        const f1 = E("rect", { x: 40, y: 305, width: 800, height: 56, rx: 28, fill: C.sky }, g), f2 = E("rect", { x: 40, y: 515, width: 800, height: 56, rx: 28, fill: C.yellow }, g);
        pop(label(g, "YOUR NAME STILL GETS IN", 440, 690, 48, C.yellow), a + 0.72 * d);
        U.push((t) => { if (!inR(t, B)) return; const k = ease(clamp((t - a - 0.25 * d) / (0.4 * d))); f1.setAttribute("width", Math.max(56, 800 * (1 - 0.94 * k))); f2.setAttribute("width", 800 - 20 * Math.sin((t - a) * 3) ** 2); });
      }
