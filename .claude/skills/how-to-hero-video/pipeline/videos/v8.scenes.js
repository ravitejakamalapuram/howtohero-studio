      // ===== VIDEO 8: how jet engines work =====
      const pw = (P, x) => { if (x <= P[0][0]) return P[0][1]; for (let i = 1; i < P.length; i++) if (x <= P[i][0]) return lerp(P[i - 1][1], P[i][1], (x - P[i - 1][0]) / (P[i][0] - P[i - 1][0])); return P[P.length - 1][1]; };
      const JWp = [[200, 52], [240, 50], [400, 30], [410, 30], [440, 44], [520, 48], [540, 48], [620, 40], [650, 38], [790, 30]];
      const JOp = [[70, 92], [110, 118], [200, 124], [450, 112], [650, 100], [790, 80]];
      const JW = (x) => pw(JWp, x), JO = (x) => pw(JOp, x), JCY = 300;
      // a cut-away turbofan, nose to the left. o: s (scale), fx (engine x to centre), sx/sy (screen centre), dim per part, phase(t), heat(t), spin, fuel, streaks, shaft colour
      function jet(g, B, o = {}) {
        const s = o.s ?? 1, cy = JCY, dim = { fan: 1, comp: 1, burn: 1, turb: 1, noz: 1, ...(o.dim || {}) }, ph = o.phase || ((t) => t * 0.17), heat = o.heat || (() => 1), spin = o.spin ?? 1;
        const w = E("g", { transform: `translate(${(o.sx ?? 440) - s * (o.fx ?? 430)},${(o.sy ?? 300) - s * cy}) scale(${s})` }, g);
        const polyPts = (f, x0, x1, sg = 1) => { const a = []; for (let x = x0; x <= x1 + 0.01; x += 10) a.push(`${x},${cy + sg * f(x)}`); return a.join(" "); };
        const nac = E("g", { opacity: o.nac ?? 1 }, w);
        E("polygon", { points: polyPts(JO, 70, 790, -1) + " " + polyPts(JO, 70, 790, 1).split(" ").reverse().join(" "), fill: C.navyD }, nac);
        [-1, 1].forEach((sg) => E("polyline", { points: polyPts(JO, 70, 790, sg), fill: "none", stroke: C.white, "stroke-width": 8, "stroke-linejoin": "round", "stroke-linecap": "round" }, nac));
        const zones = [["comp", 200, 400, C.sky, 0.22], ["burn", 400, 540, "#FF6B3D", 0.5], ["turb", 540, 650, "#FF9A3D", 0.4], ["noz", 650, 790, C.red, 0.4]];
        const zg = {};
        zones.forEach(([k, x0, x1, col, op]) => {
          const gg = zg[k] = E("g", { opacity: dim[k] }, w);
          E("polygon", { points: polyPts(JW, x0, x1, -1) + " " + polyPts(JW, x0, x1, 1).split(" ").reverse().join(" "), fill: col, "fill-opacity": op }, gg);
          [-1, 1].forEach((sg) => E("polyline", { points: polyPts(JW, x0, x1, sg), fill: "none", stroke: C.white, "stroke-width": 6, "stroke-linejoin": "round" }, gg));
        });
        // shaft: turbine back to the fan
        const shaft = E("line", { x1: 150, y1: cy, x2: 625, y2: cy, stroke: o.shaftCol || C.mute, "stroke-width": o.shaftCol ? 12 : 9, "stroke-dasharray": o.shaftCol ? "22 14" : "none", opacity: 0.95 }, w);
        // blade rows
        const rows = [];
        const stage = (xs, col, key) => xs.forEach((x) => { const h = JW(x) - 4, gg = E("g", { opacity: dim[key] }, w); [[cy - h, cy - 10, 1], [cy + 10, cy + h, -1]].forEach(([y1, y2, d]) => rows.push({ d, x, el: E("line", { x1: x, y1, x2: x, y2, stroke: col, "stroke-width": 8, "stroke-dasharray": "16 9" }, gg) })); });
        stage([250, 290, 330, 370], C.white, "comp"); stage([565, 605], "#FFB36B", "turb");
        // flames + fuel
        const R = rng(o.seed || 7), fl = Array.from({ length: 7 }, (_, i) => ({ ph: R() * TAU, el: E("circle", { cx: 440 + i * 14, cy: cy + (R() * 2 - 1) * 24, r: 20, fill: "url(#glowY)", opacity: 0 }, w) }));
        const fuel = o.fuel ? Array.from({ length: 6 }, (_, i) => E("circle", { r: 4.5, fill: C.yellow, cx: 416 + (i % 3) * 8, cy: -50, opacity: 0 }, w)) : [];
        // fan
        E("circle", { cx: 150, cy, r: 16, fill: C.sky, stroke: C.ink, "stroke-width": 4 }, w);
        const fan = Array.from({ length: 7 }, () => E("rect", { x: 144, y: cy, width: 12, height: 38, rx: 5, fill: C.white, stroke: C.ink, "stroke-width": 3, opacity: 0 }, w));
        // particles
        const core = Array.from({ length: 44 }, (_, i) => ({ off: i / 44 + R() * 0.01, f: (R() * 2 - 1) * 0.78, el: E("circle", { r: 5.5, cx: -50, cy: -50, fill: C.sky, opacity: 0 }, w) }));
        const byp = Array.from({ length: 40 }, (_, i) => ({ off: (i + 0.5) / 40, g: R(), sg: i % 2 ? 1 : -1, el: E("circle", { r: 4.5, cx: -50, cy: -50, fill: "#BFD0FF", opacity: 0 }, w) }));
        const streaks = o.streaks ? Array.from({ length: 7 }, (_, k) => E("line", { stroke: k % 2 ? C.yellow : "#FF8A3D", "stroke-width": 7, "stroke-linecap": "round", opacity: 0, x1: 0, x2: 0, y1: 0, y2: 0 }, w)) : [];
        const mapX = (u) => 70 + 810 * (u < 0.62 ? (u / 0.62) * 0.5 : 0.5 + ((u - 0.62) / 0.38) * 0.5);
        const dimAt = (x) => (x < 200 ? dim.fan : x < 400 ? dim.comp : x < 540 ? dim.burn : x < 650 ? dim.turb : dim.noz);
        U.push((t) => {
          if (!inR(t, B, 0.3)) return;
          const p = ph(t), hv = heat(t);
          rows.forEach((r, i) => r.el.setAttribute("stroke-dashoffset", r.d * (t * 60 * spin + i * 5)));
          if (o.shaftCol) shaft.setAttribute("stroke-dashoffset", t * 70);
          fl.forEach((f) => { f.el.setAttribute("r", (18 + 9 * Math.sin(t * 9 + f.ph)) * (0.7 + 0.5 * hv)); f.el.setAttribute("opacity", Math.min(1, dim.burn * (0.55 + 0.4 * Math.sin(t * 8 + f.ph)) * Math.min(1, hv))); });
          fuel.forEach((d, i) => { const k = (t * 1.6 + i / 3) % 1, top = i < 3; d.setAttribute("cy", top ? cy - 29 + k * 24 : cy + 29 - k * 24); d.setAttribute("opacity", dim.burn); });
          fan.forEach((b, i) => { const th = t * 6 * spin + (i * TAU) / 7, c = Math.cos(th); b.setAttribute("y", cy + 100 * Math.sin(th) - 19); b.setAttribute("opacity", (0.3 + 0.7 * Math.max(0, c)) * dim.fan); });
          core.forEach((q) => { const u = (q.off + p) % 1, x = mapX(u), xe = clamp(x, 200, 790), sp = JW(xe) * (x > 790 ? 1 + ((x - 790) / 90) * 0.35 : 1);
            q.el.setAttribute("cx", x); q.el.setAttribute("cy", cy + q.f * sp); q.el.setAttribute("fill", x < 330 ? C.sky : x < 440 ? "#FFE39A" : x < 650 ? "#FF8A3D" : "#FFD27A"); q.el.setAttribute("opacity", Math.min(1, u / 0.04, (1 - u) / 0.04) * dimAt(x)); });
          byp.forEach((q) => { const u = (q.off + p * 1.15) % 1, x = 70 + 810 * u, xe = clamp(x, 200, 790); q.el.setAttribute("cx", x); q.el.setAttribute("cy", cy + q.sg * (JW(xe) + 12 + q.g * (JO(xe) - JW(xe) - 24))); q.el.setAttribute("opacity", Math.min(1, u / 0.04, (1 - u) / 0.04) * (o.byp ?? 1)); });
          streaks.forEach((l, k) => { const u = (t * 1.3 + k * 0.17) % 1, x0 = 790 + u * 200; l.setAttribute("x1", x0); l.setAttribute("x2", x0 + 70); l.setAttribute("y1", cy + (k - 3) * 11); l.setAttribute("y2", cy + (k - 3) * 11); l.setAttribute("opacity", Math.min(1, u / 0.08, (1 - u) / 0.2) * 0.9); });
        });
        return w;
      }
      const lead = (g, x1, y1, x2, y2, at) => fadeIn(E("line", { x1, y1, x2, y2, stroke: C.yellow, "stroke-width": 5, "stroke-dasharray": "2 10", "stroke-linecap": "round" }, g), at);

      // beat 1: a tube that swallows air and makes a huge push
      {
        const g = beat(0), B = BT[0], a = B.a, d = B.b - B.a; jet(g, B, { sy: 520 });
        fadeIn(label(g, "AIR IN", 190, 700, 60, C.white), a + 0.3 * d); pop(label(g, "HUGE PUSH", 690, 700, 60, C.yellow), a + 0.62 * d);
      }
      // beat 2: the fan sucks air in; some goes around, the rest inside
      {
        const g = beat(1), B = BT[1], a = B.a, d = B.b - B.a; jet(g, B, { s: 1.5, fx: 150, sx: 330, sy: 350, dim: { comp: 0.7, burn: 0.35, turb: 0.35, noz: 0.35 }, spin: 1.3 });
        pop(label(g, "FAN", 330, 625, 60, C.yellow), a + 0.12 * d); lead(g, 330, 540, 330, 585, a + 0.12 * d);
        fadeIn(label(g, "SOME AIR GOES AROUND", 500, 120, 46, C.white), a + 0.5 * d); fadeIn(label(g, "THE REST GOES INSIDE", 650, 700, 44, C.white), a + 0.72 * d);
      }
      // beat 3: blades squeeze the air
      {
        const g = beat(2), B = BT[2], a = B.a, d = B.b - B.a; jet(g, B, { s: 2, fx: 330, sx: 440, sy: 340, dim: { fan: 0.4, burn: 0.35, turb: 0.3, noz: 0.3 }, nac: 0.5, byp: 0.3, spin: 1.4 });
        fadeIn(arrowLine(g, 440, 150, 440, 212, C.yellow, 9), a + 0.3 * d); fadeIn(arrowLine(g, 440, 540, 440, 478, C.yellow, 9), a + 0.3 * d);
        pop(label(g, "SQUEEZED TIGHT", 440, 640, 66, C.yellow), a + 0.4 * d); fadeIn(label(g, "TIGHTER AND HOTTER", 440, 710, 46, C.white), a + 0.68 * d);
      }
      // beat 4: fuel is sprayed in and burns
      {
        const g = beat(3), B = BT[3], a = B.a, d = B.b - B.a; jet(g, B, { s: 2, fx: 470, sx: 440, sy: 330, dim: { fan: 0.3, comp: 0.45, turb: 0.55, noz: 0.45 }, nac: 0.45, byp: 0.25, fuel: true, heat: (t) => 0.9 + 0.5 * clamp((t - a) / (0.4 * d)) });
        pop(label(g, "FUEL", 324, 175, 60, C.yellow), a + 0.15 * d); lead(g, 324, 200, 324, 250, a + 0.15 * d);
        fadeIn(arrowLine(g, 380, 560, 620, 560, C.yellow, 11), a + 0.55 * d); pop(label(g, "HOT GAS EXPANDS", 440, 650, 58, C.white), a + 0.6 * d);
      }
      // beat 5: the gas spins a turbine, linked by a shaft to the fan and blades
      {
        const g = beat(4), B = BT[4], a = B.a, d = B.b - B.a; jet(g, B, { s: 1.6, fx: 400, sx: 440, sy: 300, dim: { fan: 0.75, comp: 0.8, burn: 0.8, noz: 0.6 }, nac: 0.6, byp: 0.3, shaftCol: C.yellow, spin: 1.5 });
        pop(label(g, "TURBINE", 728, 500, 56, C.yellow), a + 0.12 * d); lead(g, 728, 385, 728, 450, a + 0.12 * d);
        pop(label(g, "SHAFT", 300, 500, 56, C.white), a + 0.45 * d); lead(g, 300, 455, 300, 312, a + 0.45 * d);
        pop(label(g, "THE ENGINE POWERS ITSELF", 440, 680, 56, C.yellow), a + 0.72 * d);
      }
      // beat 6: the gas blasts out the back
      {
        const g = beat(5), B = BT[5], a = B.a, d = B.b - B.a; jet(g, B, { s: 1.3, fx: 700, sx: 440, sy: 300, dim: { fan: 0.3, comp: 0.35, burn: 0.45, turb: 0.5 }, nac: 0.5, byp: 0.25, streaks: true });
        pop(label(g, "HOT GAS BLASTS OUT", 440, 620, 58, C.white), a + 0.2 * d); fadeIn(label(g, "FASTER THAN IT CAME IN", 440, 695, 48, C.yellow), a + 0.55 * d);
      }
      // beat 7: Newton's third law
      {
        const g = beat(6), B = BT[6], a = B.a, d = B.b - B.a; jet(g, B, { s: 0.8, fx: 430, sx: 440, sy: 250, streaks: true });
        pop(label(g, "NEWTON'S THIRD LAW", 440, 90, 58, C.yellow), a + 0.04 * d);
        fadeIn(arrowLine(g, 240, 440, 640, 440, C.red, 14), a + 0.3 * d); fadeIn(label(g, "GAS PUSHED BACK", 440, 510, 52, C.white), a + 0.34 * d);
        fadeIn(arrowLine(g, 640, 585, 240, 585, C.yellow, 14), a + 0.62 * d); pop(label(g, "ENGINE PUSHED FORWARD", 440, 665, 52, C.yellow), a + 0.66 * d);
      }
      // beat 8: thrust moves the whole plane
      {
        const g = beat(7), B = BT[7], a = B.a, d = B.b - B.a, S = { stroke: C.ink, "stroke-width": 4, "stroke-linejoin": "round" };
        const lines = [100, 130, 470].map((y) => E("line", { x1: 20, y1: y, x2: 860, y2: y, stroke: C.mute, "stroke-width": 4, "stroke-dasharray": "60 120", "stroke-linecap": "round", opacity: 0.5 }, g));
        const pl = E("g", {}, g);
        E("polygon", { points: "640,240 700,150 735,150 705,262", fill: C.white, ...S }, pl); E("polygon", { points: "660,262 745,252 750,274 660,286", fill: C.sky, ...S }, pl);
        E("polygon", { points: "400,280 545,280 610,345 525,345", fill: C.sky, ...S }, pl);
        E("ellipse", { cx: 450, cy: 270, rx: 280, ry: 46, fill: C.white, ...S }, pl); E("ellipse", { cx: 262, cy: 258, rx: 30, ry: 14, fill: C.navyL }, pl);
        for (let x = 330; x <= 610; x += 40) E("circle", { cx: x, cy: 266, r: 7, fill: C.navyL }, pl);
        E("rect", { x: 485, y: 335, width: 28, height: 22, fill: C.mute, ...S }, pl);
        E("rect", { x: 430, y: 350, width: 150, height: 50, rx: 25, fill: C.navyL, stroke: C.white, "stroke-width": 6 }, pl); E("ellipse", { cx: 442, cy: 375, rx: 8, ry: 18, fill: C.ink }, pl);
        const fl = E("g", {}, pl); E("polygon", { points: "0,-14 62,0 0,14", fill: "#FF8A3D" }, fl); E("polygon", { points: "0,-8 36,0 0,8", fill: C.yellow }, fl);
        U.push((t) => { if (!inR(t, B)) return; pl.setAttribute("transform", `translate(0,${6 * Math.sin(t * 2)})`); fl.setAttribute("transform", `translate(584,375) scale(${1 + 0.25 * Math.sin(t * 14)},1)`); lines.forEach((l) => l.setAttribute("stroke-dashoffset", -t * 180)); });
        fadeIn(arrowLine(g, 610, 430, 290, 430, C.yellow, 14), a + 0.3 * d); pop(label(g, "THRUST", 440, 540, 76, C.yellow), a + 0.34 * d);
        fadeIn(label(g, "ENGINE PUSHES, PLANE MOVES", 440, 640, 48, C.white), a + 0.6 * d);
      }
      // beat 9: open the throttle, the push grows
      {
        const g = beat(8), B = BT[8], a = B.a, d = B.b - B.a, ramp = (t) => ease(clamp((t - a - 0.1 * d) / (0.7 * d)));
        jet(g, B, { s: 0.75, fx: 430, sx: 440, sy: 210, streaks: true, spin: 1.6, phase: (t) => { const tt = clamp(t - a, 0, d); return 0.15 * t + 0.25 * ((tt * tt) / (2 * d)); }, heat: (t) => 0.7 + 0.9 * ramp(t) });
        label(g, "THROTTLE", 440, 395, 52, C.white);
        E("rect", { x: 140, y: 440, width: 600, height: 20, rx: 10, fill: C.navyD, stroke: C.white, "stroke-width": 5 }, g);
        const hd = E("circle", { cx: 160, cy: 450, r: 28, fill: C.yellow, stroke: C.ink, "stroke-width": 5 }, g);
        label(g, "PUSH", 440, 585, 52, C.yellow);
        E("rect", { x: 140, y: 610, width: 600, height: 36, rx: 8, fill: C.navyD, stroke: C.mute, "stroke-width": 5 }, g);
        const bar = E("rect", { x: 144, y: 614, width: 0, height: 28, rx: 5, fill: C.yellow }, g);
        U.push((t) => { if (!inR(t, B)) return; const k = ramp(t); hd.setAttribute("cx", 160 + 560 * k); bar.setAttribute("width", 592 * k); });
      }
