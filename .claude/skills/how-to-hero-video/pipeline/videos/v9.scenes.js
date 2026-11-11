      // ===== VIDEO 9: how QR codes work =====
      function qr(g, x, y, s, seed, n = 17) {
        const k = E("g", {}, g), m = s / n, R = rng(seed), mods = [];
        E("rect", { x: x - 12, y: y - 12, width: s + 24, height: s + 24, rx: 14, fill: C.white }, k);
        const fin = (cx, cy) => { E("rect", { x: x + cx * m, y: y + cy * m, width: 7 * m, height: 7 * m, fill: C.navyD }, k); E("rect", { x: x + (cx + 1) * m, y: y + (cy + 1) * m, width: 5 * m, height: 5 * m, fill: C.white }, k); E("rect", { x: x + (cx + 2) * m, y: y + (cy + 2) * m, width: 3 * m, height: 3 * m, fill: C.navyD }, k); };
        fin(0, 0); fin(n - 7, 0); fin(0, n - 7);
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
          const inF = (r < 8 && c < 8) || (r < 8 && c > n - 9) || (r > n - 9 && c < 8);
          if (!inF && R() > 0.5) mods.push(E("rect", { x: x + c * m, y: y + r * m, width: m + 0.5, height: m + 0.5, fill: C.navyD }, k));
        }
        return { g: k, m, mods };
      }
      const rr = (g, x, y, w, h, o = {}) => E("rect", { x, y, width: w, height: h, rx: o.rx ?? 14, fill: o.fill || "none", stroke: o.stroke || "none", "stroke-width": o.sw || 0 }, g);

      // beat 1: a QR code is made of tiny squares (below the headline)
      {
        const g = beat(0), B = BT[0], a = B.a, d = B.b - B.a;
        const q = qr(g, 290, 350, 300, 5); pop(q.g, a + 0.04 * d);
        pop(label(g, "TINY SQUARES", 440, 752, 58, C.yellow), a + 0.35 * d);
        const ring = rr(g, 262, 322, 356, 356, { stroke: C.yellow, sw: 6, rx: 22 }); fadeTo(ring, a + 0.55 * d, 0.9);
      }
      // beat 2: dark = 1, light = 0, eight squares spell a letter
      {
        const g = beat(1), B = BT[1], a = B.a, d = B.b - B.a, bits = [0, 1, 0, 0, 1, 0, 0, 0];
        pop(label(g, "DARK = 1", 250, 110, 62, C.white), a + 0.04 * d); pop(label(g, "LIGHT = 0", 650, 110, 62, C.yellow), a + 0.1 * d);
        bits.forEach((b, i) => {
          const x = 85 + i * 90, k = E("g", {}, g);
          rr(k, x, 190, 80, 80, { fill: b ? C.navyD : C.white, stroke: C.white, sw: 6, rx: 10 }); T(k, String(b), x + 40, 350, 60, b ? C.white : C.yellow, { sw: 6 });
          pop(k, a + (0.16 + i * 0.045) * d, 0.22);
        });
        fadeIn(arrowLine(g, 440, 385, 440, 470, C.white, 9), a + 0.6 * d);
        const H = E("g", {}, g); E("circle", { cx: 440, cy: 545, r: 82, fill: C.yellow, stroke: C.ink, "stroke-width": 6 }, H); T(H, "H", 440, 590, 120, C.navyD, { sw: 0 }); pop(H, a + 0.68 * d);
        pop(label(g, "ONE LETTER", 440, 700, 56, C.white), a + 0.76 * d);
      }
      // beat 3: three corner squares
      {
        const g = beat(2), B = BT[2], a = B.a, d = B.b - B.a, s = 400, x0 = 240, y0 = 150, n = 17, m = s / n;
        const q = qr(g, x0, y0, s, 5); pop(q.g, a + 0.04 * d);
        [[0, 0], [n - 7, 0], [0, n - 7]].forEach(([cx, cy], i) => { const r = rr(g, x0 + cx * m - 8, y0 + cy * m - 8, 7 * m + 16, 7 * m + 16, { stroke: C.yellow, sw: 9, rx: 12 }); pop(r, a + (0.25 + i * 0.12) * d, 0.3); });
        pop(label(g, "CORNER MARKERS", 440, 660, 62, C.yellow), a + 0.62 * d); fadeIn(label(g, "WHICH WAY IS UP", 440, 725, 48, C.white), a + 0.75 * d);
      }
      // beat 4: any angle
      {
        const g = beat(3), B = BT[3], a = B.a, d = B.b - B.a, s = 300, n = 17, m = s / n;
        const rot = E("g", {}, g); const q = qr(rot, -s / 2, -s / 2, s, 5);
        [[0, 0]].forEach(([cx, cy]) => rr(rot, -s / 2 + cx * m - 8, -s / 2 + cy * m - 8, 7 * m + 16, 7 * m + 16, { stroke: C.yellow, sw: 9, rx: 12 }));
        const ok = checkMark(g, 700, 140, 48); ok.setAttribute("opacity", 0);
        pop(label(g, "ANY ANGLE", 440, 660, 62, C.yellow), a + 0.12 * d); pop(label(g, "EVEN UPSIDE DOWN", 440, 725, 48, C.white), a + 0.3 * d);
        U.push((t) => { if (!inR(t, B)) return; const u = clamp((t - a) / (0.8 * d)), ang = ease(u) * 540 - 40; rot.setAttribute("transform", `translate(440,350) rotate(${ang}) scale(${0.85 + 0.15 * ease(u)})`); ok.setAttribute("opacity", t > a + 0.72 * d ? 1 : 0); });
      }
      // beat 5: straighten, read the grid square by square, into bits
      {
        const g = beat(4), B = BT[4], a = B.a, d = B.b - B.a, s = 340, x0 = 270, y0 = 90, n = 17, m = s / n;
        const q = qr(g, x0, y0, s, 5); pop(q.g, a + 0.03 * d);
        const bar = rr(g, x0 - 14, y0, s + 28, m, { fill: C.yellow, rx: 6 }); bar.setAttribute("opacity", 0.55);
        const bits = T(g, "", 440, 560, 54, C.yellow, { sw: 6, track: 4 }); const seq = "01101000 01110100 01110100 01110000";
        pop(label(g, "SQUARE BY SQUARE", 440, 660, 58, C.white), a + 0.18 * d); fadeIn(label(g, "ONES AND ZEROS", 440, 728, 52, C.yellow), a + 0.3 * d);
        U.push((t) => { if (!inR(t, B)) return; const u = clamp((t - a - 0.1 * d) / (0.8 * d)); bar.setAttribute("y", y0 + Math.min(n - 1, Math.floor(u * n)) * m); bar.setAttribute("opacity", u > 0 && u < 1 ? 0.55 : 0); bits.textContent = seq.slice(0, Math.floor(u * seq.length)); });
      }
      // beat 6: bits become a web address and the phone opens it
      {
        const g = beat(5), B = BT[5], a = B.a, d = B.b - B.a;
        fadeIn(label(g, "01100001 01100010", 440, 100, 54, C.yellow, { track: 4 }), a + 0.04 * d);
        fadeIn(arrowLine(g, 440, 130, 440, 200, C.white, 9), a + 0.18 * d);
        const pill = E("g", {}, g); rr(pill, 120, 215, 640, 110, { fill: C.white, rx: 55 }); T(pill, "WWW.EXAMPLE.COM", 440, 292, 62, C.navyD, { sw: 0 }); pop(pill, a + 0.3 * d);
        fadeIn(arrowLine(g, 440, 340, 440, 420, C.white, 9), a + 0.5 * d);
        const ph = E("g", {}, g); phone(ph, 330, 440, 220, 300); rr(ph, 350, 490, 180, 26, { fill: C.sky, rx: 13 }); [550, 590, 630].forEach((y, i) => rr(ph, 350, y, i == 2 ? 110 : 180, 20, { fill: C.mute, rx: 10 }));
        checkMark(ph, 505, 700, 26); pop(ph, a + 0.62 * d);
        pop(label(g, "LINK OPENS", 690, 600, 52, C.yellow), a + 0.78 * d);
      }
      // beat 7: scratched, dirty, still reads (backup data)
      {
        const g = beat(6), B = BT[6], a = B.a, d = B.b - B.a, s = 340, x0 = 270, y0 = 90;
        const q = qr(g, x0, y0, s, 5); pop(q.g, a + 0.03 * d);
        const dmg = E("g", {}, g);
        rr(dmg, 360, 160, 120, 90, { fill: "#6B4A2B", rx: 40 }); rr(dmg, 470, 330, 110, 70, { fill: "#6B4A2B", rx: 30 });
        [[300, 130, 560, 300], [330, 420, 600, 200], [520, 120, 420, 440]].forEach(([x1, y1, x2, y2]) => E("line", { x1, y1, x2, y2, stroke: C.red, "stroke-width": 8, "stroke-linecap": "round" }, dmg));
        fadeIn(dmg, a + 0.28 * d);
        checkMark(g, 760, 190, 56).setAttribute("opacity", 0);
        const ok = checkMark(g, 760, 190, 56); fadeIn(ok, a + 0.6 * d);
        pop(label(g, "EXTRA BACKUP DATA", 440, 610, 60, C.yellow), a + 0.4 * d); fadeIn(label(g, "STILL READS", 440, 690, 56, C.white), a + 0.62 * d);
      }
      // beat 8: too much covered fails; it is only a printed address
      {
        const g = beat(7), B = BT[7], a = B.a, d = B.b - B.a, s = 340, x0 = 270, y0 = 90;
        const q = qr(g, x0, y0, s, 5); pop(q.g, a + 0.03 * d);
        const cov = rr(g, x0 - 12, y0 - 12, s + 24, 190, { fill: "#6B4A2B", rx: 14 }); cov.setAttribute("opacity", 0); const cov2 = rr(g, x0 - 12, y0 + 150, 170, 214, { fill: "#6B4A2B", rx: 14 });
        fadeTo(cov, a + 0.12 * d, 1); fadeTo(cov2, a + 0.12 * d, 1);
        pop(crossMark(g, 760, 190, 56), a + 0.3 * d);
        pop(label(g, "TOO MUCH COVERED", 440, 600, 58, C.red), a + 0.28 * d); fadeIn(label(g, "SCAN FAILS", 440, 668, 52, C.white), a + 0.4 * d);
        pop(label(g, "ONLY A PRINTED ADDRESS", 440, 735, 52, C.yellow), a + 0.68 * d);
      }
