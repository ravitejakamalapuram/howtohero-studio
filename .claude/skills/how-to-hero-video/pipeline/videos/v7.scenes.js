      // ===== VIDEO 7: how fingerprint sensors work =====
      // concentric, slightly broken ridges; returns the ring elements
      const fp = (g, cx, cy, s, o = {}) => {
        const R = rng(o.seed || 1), n = o.n || 9, rings = [];
        for (let i = 1; i <= n; i++) {
          const dash = o.solid ? {} : { "stroke-dasharray": `${70 + R() * 150} ${5 + R() * 9}` };
          rings.push(E("ellipse", { cx: cx + (o.dx || 0) * (n - i) * s, cy: cy + (o.dy || 0) * (n - i) * s, rx: (o.rx || 12) * i * s, ry: (o.ry || 15) * i * s, fill: "none", stroke: o.col || C.white, "stroke-width": (o.sw || 5) * s, "stroke-linecap": "round", opacity: o.op ?? 1, transform: `rotate(${o.rot || 0} ${cx} ${cy})`, ...dash }, g));
        }
        return rings;
      };
      const bits = (g, x, y, rows, size, seed) => { const R = rng(seed); for (let r = 0; r < rows; r++) { let s = ""; for (let k = 0; k < 8; k++) s += R() > 0.5 ? "1" : "0"; T(g, s, x, y + r * (size + 18), size, C.yellow, { sw: 4 }); } };
      const chipBox = (g, x, y, w, h) => E("rect", { x, y, width: w, height: h, rx: 22, fill: C.navyD, stroke: C.white, "stroke-width": 7 }, g);

      // beat 1: a fingertip, ridges draw in (sits under the headline: local y >= 330)
      {
        const g = beat(0), B = BT[0], a = B.a;
        E("ellipse", { cx: 440, cy: 505, rx: 176, ry: 186, fill: C.navyD, stroke: C.white, "stroke-width": 8 }, g);
        fp(g, 440, 510, 1.0, { rx: 14.5, ry: 17, n: 10, sw: 6, col: C.yellow, seed: 4, dy: -1 }).forEach((r, i) => fadeIn(r, a + 0.9 + i * 0.09, 0.3));
        fadeIn(label(g, "RIDGES AND VALLEYS", 440, 748, 52, C.white), a + 1.4);
      }
      // beat 2: every finger has its own pattern, even twins
      {
        const g = beat(1), B = BT[1], a = B.a, d = B.b - B.a;
        const specs = [{ x: 150, seed: 11, rot: 0, dx: 1.5 }, { x: 440, seed: 22, rot: 35, dx: -2, dy: 1 }, { x: 730, seed: 33, rot: -25, dx: 0.5, dy: -1.5 }];
        specs.forEach((s, k) => {
          E("ellipse", { cx: s.x, cy: 290, rx: 118, ry: 150, fill: C.navyD, stroke: C.mute, "stroke-width": 5 }, g);
          fp(g, s.x, 290, 0.95, { rx: 11, ry: 14, n: 9, sw: 5, seed: s.seed, rot: s.rot, dx: s.dx, dy: s.dy, col: k === 1 ? C.yellow : C.white }).forEach((r, i) => fadeIn(r, a + 0.1 * d + k * 0.12 * d + i * 0.03, 0.25));
        });
        pop(label(g, "NO TWO ALIKE", 440, 560, 66, C.yellow), a + 0.42 * d); pop(label(g, "EVEN IDENTICAL TWINS", 440, 650, 50, C.white), a + 0.62 * d);
      }
      // beat 3: a grid of tiny electrical pads under the glass
      {
        const g = beat(2), B = BT[2], a = B.a, d = B.b - B.a;
        E("rect", { x: 100, y: 170, width: 680, height: 290, rx: 26, fill: C.navyD, stroke: C.white, "stroke-width": 7 }, g);
        const pads = []; for (let r = 0; r < 5; r++) for (let c = 0; c < 12; c++) pads.push({ r, c, el: E("rect", { x: 133 + c * 52, y: 196 + r * 52, width: 40, height: 40, rx: 8, fill: C.sky, opacity: 0 }, g) });
        const glass = E("rect", { x: 100, y: 170, width: 680, height: 290, rx: 26, fill: C.white, opacity: 0 }, g); fadeTo(glass, a + 0.5 * d, 0.12);
        pop(label(g, "A GRID OF TINY PADS", 440, 560, 56, C.white), a + 0.3 * d); pop(label(g, "UNDER THE GLASS", 440, 640, 56, C.yellow), a + 0.55 * d);
        U.push((t) => { if (!inR(t, B)) return; pads.forEach((q) => q.el.setAttribute("opacity", clamp((t - a - 0.05 * d - (q.r * 12 + q.c) * 0.012 * d) / 0.15) * (0.65 + 0.35 * Math.sin(t * 3 + q.c * 0.6 + q.r)))); });
      }
      // beat 4: ridges sit close to pads (strong signal), valleys farther (weak)
      {
        const g = beat(3), B = BT[3], a = B.a, d = B.b - B.a;
        let dpath = "M60,120 L60,258"; for (let x = 60; x <= 820; x += 5) dpath += ` L${x},${258 + 42 * Math.sin(((x - 80) / 90) * TAU)}`; dpath += " L820,120 Z";
        const skin = E("path", { d: dpath, fill: "#F2C9A5", stroke: C.ink, "stroke-width": 4 }, g); fadeIn(skin, a + 0.04 * d);
        E("rect", { x: 40, y: 300, width: 800, height: 26, fill: C.white, opacity: 0.18 }, g);
        const bars = [];
        for (let k = 0; k < 16; k++) {
          const x = 102.5 + 45 * k, strong = k % 2 === 0;
          E("rect", { x: x - 16, y: 338, width: 32, height: 32, rx: 6, fill: C.sky }, g);
          bars.push({ strong, el: E("rect", { x: x - 12, y: 384, width: 24, height: 0, rx: 5, fill: strong ? C.yellow : C.mute }, g) });
        }
        pop(label(g, "CLOSE = STRONG SIGNAL", 440, 640, 52, C.yellow), a + 0.45 * d); pop(label(g, "FAR = WEAK SIGNAL", 440, 715, 52, C.white), a + 0.65 * d);
        U.push((t) => { if (!inR(t, B)) return; const p = ease(clamp((t - a - 0.2 * d) / (0.4 * d))); bars.forEach((q) => q.el.setAttribute("height", p * (q.strong ? 165 : 55))); });
      }
      // beat 5: all the readings together become a picture of the ridges
      {
        const g = beat(4), B = BT[4], a = B.a, d = B.b - B.a, cells = [];
        for (let r = 0; r < 12; r++) for (let c = 0; c < 14; c++) { const dd = Math.hypot(c - 6.5, (r - 5.5) * 1.15), ridge = Math.sin(dd * 1.9) > 0; cells.push({ r, el: E("rect", { x: 188 + c * 36, y: 110 + r * 36, width: 34, height: 34, rx: 4, fill: ridge ? C.yellow : C.navyL, opacity: 0 }, g) }); }
        const scan = E("rect", { x: 170, y: 110, width: 540, height: 6, rx: 3, fill: C.white, opacity: 0 }, g);
        pop(label(g, "A PICTURE OF YOUR RIDGES", 440, 650, 54, C.yellow), a + 0.6 * d); fadeIn(label(g, "BUILT FROM MANY PAD READINGS", 440, 725, 42, C.white), a + 0.75 * d);
        U.push((t) => { if (!inR(t, B)) return; const p = clamp((t - a - 0.08 * d) / (0.5 * d)); cells.forEach((q) => q.el.setAttribute("opacity", p * 12 > q.r ? 1 : 0)); scan.setAttribute("y", 110 + 432 * p); scan.setAttribute("opacity", p > 0 && p < 1 ? 0.9 : 0); });
      }
      // beat 6: key points become numbers in a secure area, not a picture
      {
        const g = beat(5), B = BT[5], a = B.a, d = B.b - B.a;
        fp(g, 200, 310, 1.2, { rx: 12, ry: 15, n: 8, sw: 5, seed: 7, dx: 1.2 }).forEach((r) => fadeIn(r, a + 0.02 * d, 0.2));
        [[282, 275, C.yellow], [140, 225, C.white], [255, 390, C.yellow], [105, 350, C.white], [215, 190, C.yellow]].forEach(([x, y, c], i) => { const m = E("circle", { cx: x, cy: y, r: 20, fill: "none", stroke: c, "stroke-width": 6 }, g); pop(m, a + (0.12 + i * 0.07) * d); });
        fadeIn(label(g, "KEY POINTS", 200, 520, 46, C.yellow), a + 0.3 * d);
        fadeIn(arrowLine(g, 345, 310, 470, 310, C.white, 9), a + 0.4 * d);
        const chip = E("g", {}, g); chipBox(chip, 495, 160, 310, 300); bits(chip, 650, 240, 4, 44, 5); pop(chip, a + 0.5 * d);
        fadeIn(label(g, "NUMBERS", 650, 520, 46, C.white), a + 0.6 * d); fadeIn(label(g, "IN A SECURE AREA", 650, 575, 40, C.white), a + 0.65 * d);
        pop(label(g, "NOT A PICTURE", 440, 695, 62, C.yellow), a + 0.75 * d);
      }
      // beat 7: fresh scan vs saved key points, close enough, unlock
      {
        const g = beat(6), B = BT[6], a = B.a, d = B.b - B.a;
        fp(g, 160, 290, 0.85, { rx: 12, ry: 15, n: 8, sw: 5, seed: 7, dx: 1.2 }).forEach((r) => fadeIn(r, a + 0.02 * d, 0.2));
        fadeIn(label(g, "NEW SCAN", 160, 140, 44, C.white), a + 0.05 * d);
        const chip = E("g", {}, g); chipBox(chip, 620, 190, 180, 160); bits(chip, 710, 245, 2, 38, 5); pop(chip, a + 0.12 * d); fadeIn(label(g, "SAVED", 710, 160, 44, C.yellow), a + 0.15 * d);
        fadeIn(arrowLine(g, 165, 410, 372, 520, C.white, 8), a + 0.25 * d); fadeIn(arrowLine(g, 710, 375, 508, 520, C.white, 8), a + 0.3 * d);
        const cmp = E("g", {}, g); E("circle", { cx: 440, cy: 580, r: 92, fill: C.navyD, stroke: C.yellow, "stroke-width": 8 }, cmp); pop(cmp, a + 0.35 * d);
        const q = label(g, "MATCH?", 440, 596, 48, C.white); fadeIn(q, a + 0.4 * d); fadeOut(q, a + 0.58 * d, 0.2);
        pop(checkMark(g, 440, 580, 56), a + 0.62 * d);
        const lk = lockIcon(g, 690, 580, 1.2, C.yellow, 1); pop(lk.g, a + 0.7 * d);
        pop(label(g, "CLOSE ENOUGH", 440, 727, 54, C.yellow), a + 0.5 * d);
      }
      // beat 8: no two touches are identical
      {
        const g = beat(7), B = BT[7], a = B.a, d = B.b - B.a;
        [{ x: 150, sw: 3, op: 0.55, col: C.sky, name: "LIGHT" }, { x: 440, sw: 6, op: 1, col: C.white, name: "NORMAL" }, { x: 730, sw: 11, op: 1, col: C.white, name: "FIRM" }].forEach((s, k) => {
          fp(g, s.x, 290, 1.05, { rx: 12, ry: 15, n: 7, sw: s.sw, op: s.op, col: s.col, seed: 7, dx: 1.2, solid: true }).forEach((r, i) => fadeTo(r, a + (0.06 + k * 0.1) * d + i * 0.03, s.op, 0.2));
          fadeIn(label(g, s.name, s.x, 500, 46, C.white), a + (0.12 + k * 0.1) * d);
        });
        pop(label(g, "NO TWO TOUCHES ALIKE", 440, 610, 52, C.white), a + 0.45 * d); pop(label(g, "CLOSE, NOT PERFECT", 440, 700, 60, C.yellow), a + 0.62 * d);
      }
      // beat 9: a wet finger blurs the reading
      {
        const g = beat(8), B = BT[8], a = B.a, d = B.b - B.a, R = rng(21);
        E("ellipse", { cx: 440, cy: 290, rx: 160, ry: 195, fill: C.navyD, stroke: C.white, "stroke-width": 7 }, g);
        fp(g, 440, 300, 1.4, { rx: 11, ry: 14, n: 9, sw: 5, seed: 12, dx: 1 }).forEach((r) => fadeIn(r, a + 0.02 * d, 0.2));
        for (let i = 0; i < 16; i++) { const dr = E("circle", { cx: 440 + (R() - 0.5) * 270, cy: 290 + (R() - 0.5) * 330, r: 12 + R() * 16, fill: C.sky, opacity: 0 }, g); fadeTo(dr, a + (0.1 + R() * 0.3) * d, 0.75, 0.2); }
        pop(crossMark(g, 700, 140, 52), a + 0.5 * d);
        pop(label(g, "WET FINGER = BLURRY", 440, 600, 54, C.white), a + 0.45 * d); pop(label(g, "WIPE IT, TRY AGAIN", 440, 685, 58, C.yellow), a + 0.65 * d);
      }
