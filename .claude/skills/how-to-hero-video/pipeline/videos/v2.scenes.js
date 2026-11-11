      // ===== VIDEO 2: how UPI payments work =====
      const rupee = (g, x, y, s = 1, col = C.navyD) => E("path", { d: "M-24,-38 H26 M-24,-20 H26 M-24,-38 H-2 C26,-38 26,-4 -4,-4 H-24 L14,42", transform: `translate(${x},${y}) scale(${s})`, fill: "none", stroke: col, "stroke-width": 9, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
      function qr(g, x, y, s, seed) {
        const k = E("g", {}, g), n = 11, m = s / n, R = rng(seed);
        E("rect", { x: x - 10, y: y - 10, width: s + 20, height: s + 20, rx: 14, fill: C.white }, k);
        const fin = (cx, cy) => { E("rect", { x: x + cx * m, y: y + cy * m, width: 7 * m, height: 7 * m, fill: C.navyD }, k); E("rect", { x: x + (cx + 1) * m, y: y + (cy + 1) * m, width: 5 * m, height: 5 * m, fill: C.white }, k); E("rect", { x: x + (cx + 2) * m, y: y + (cy + 2) * m, width: 3 * m, height: 3 * m, fill: C.navyD }, k); };
        fin(0, 0); fin(n - 7, 0); fin(0, n - 7);
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { const inF = (r < 8 && c < 8) || (r < 8 && c > n - 9) || (r > n - 9 && c < 8); if (!inF && R() > 0.5) E("rect", { x: x + c * m, y: y + r * m, width: m, height: m, fill: C.navyD }, k); }
        return k;
      }
      function bank(g, x, y, s = 1, col = C.white) {
        const k = E("g", { transform: `translate(${x},${y}) scale(${s})` }, g), S = { stroke: col, "stroke-width": 7, "stroke-linejoin": "round", "stroke-linecap": "round", fill: C.navyD };
        E("path", { d: "M-80,-60 L0,-110 L80,-60 Z", ...S }, k); [-56, -19, 19, 56].forEach((cx) => E("rect", { x: cx - 10, y: -52, width: 20, height: 86, ...S }, k)); E("rect", { x: -92, y: 40, width: 184, height: 20, rx: 6, ...S }, k);
        return k;
      }
      // beat 1 (0-10): scan a QR code
      {
        const g = beat(0), B = BT[0], a = B.a, d = B.b - B.a;
        phone(g, 60, 350, 180, 380); E("circle", { cx: 150, cy: 385, r: 10, fill: C.yellow }, g);
        const beam = E("polygon", { points: "150,392 520,372 520,676", fill: C.yellow, opacity: 0.2 }, g); fadeTo(beam, a + 0.1 * d, 0.2);
        const q = qr(g, 560, 385, 250, 5); pop(q, a + 0.05 * d);
        const sc = E("rect", { x: 560, y: 385, width: 250, height: 6, rx: 3, fill: C.yellow }, g);
        const coin = E("g", {}, g); E("circle", { cx: 380, cy: 480, r: 56, fill: C.yellow, stroke: C.ink, "stroke-width": 5 }, coin); rupee(coin, 380, 482, 1.05); pop(coin, a + 0.4 * d);
        U.push((t) => { if (!inR(t, B)) return; sc.setAttribute("y", 385 + 244 * (0.5 + 0.5 * Math.sin((t - a) * 3.2))); });
      }
      // beat 2 (10-20): the QR is just a payment address; the app prepares a request
      {
        const g = beat(1), B = BT[1], a = B.a, d = B.b - B.a;
        pop(qr(g, 30, 130, 220, 5), a + 0.05 * d);
        fadeIn(arrowLine(g, 285, 240, 360, 240, C.white, 9), a + 0.18 * d);
        const addr = E("g", {}, g); E("rect", { x: 390, y: 170, width: 470, height: 140, rx: 70, fill: C.yellow }, addr); T(addr, "NAME@BANK", 625, 262, 76, C.navyD, { sw: 0 }); pop(addr, a + 0.28 * d);
        pop(label(g, "PAYMENT ADDRESS", 625, 360, 44, C.white), a + 0.34 * d);
        phone(g, 130, 440, 170, 290); const rq = E("g", {}, g); E("rect", { x: 340, y: 520, width: 330, height: 130, rx: 22, fill: C.navyL, stroke: C.white, "stroke-width": 6 }, rq); E("circle", { cx: 400, cy: 585, r: 34, fill: C.yellow }, rq); rupee(rq, 400, 587, 0.62); T(rq, "REQUEST", 570, 605, 52, C.white, { sw: 6 });
        fadeIn(arrowLine(g, 305, 585, 335, 585, C.white, 8), a + 0.6 * d); pop(rq, a + 0.66 * d);
      }
      // beat 3 (20-30): the request goes to a central hub (traffic controller)
      {
        const g = beat(2), B = BT[2], a = B.a, d = B.b - B.a;
        phone(g, 30, 270, 150, 260); const hub = E("g", {}, g); E("circle", { cx: 440, cy: 380, r: 128, fill: C.navyD, stroke: C.yellow, "stroke-width": 9 }, hub);
        E("rect", { x: 405, y: 318, width: 70, height: 126, rx: 16, fill: C.navy, stroke: C.white, "stroke-width": 5 }, hub); [[C.red, 345], [C.yellow, 381], [C.green, 417]].forEach(([c, y]) => E("circle", { cx: 440, cy: y, r: 13, fill: c }, hub));
        pop(hub, a + 0.12 * d); pop(label(g, "CENTRAL HUB", 440, 570, 60, C.yellow), a + 0.2 * d); fadeIn(label(g, "THE TRAFFIC CONTROLLER", 440, 640, 44, C.white), a + 0.62 * d);
        bank(g, 770, 370, 0.95, C.mute);
        fadeIn(arrowLine(g, 195, 380, 300, 380, C.white, 8), a + 0.1 * d);
        const pk = E("g", {}, g); E("rect", { x: -26, y: -18, width: 52, height: 36, rx: 8, fill: C.yellow }, pk); E("polyline", { points: "-20,-12 0,4 20,-12", fill: "none", stroke: C.navyD, "stroke-width": 4 }, pk);
        U.push((t) => { if (!inR(t, B)) return; const u = ((t - a - 0.1 * d) * 0.45) % 1, on = t > a + 0.1 * d ? 1 : 0; pk.setAttribute("transform", `translate(${195 + 105 * u},${380})`); pk.setAttribute("opacity", on * (u < 0.1 ? u * 10 : u > 0.9 ? (1 - u) * 10 : 1)); });
      }
      // beat 4: the hub asks your bank whether the payment should go through
      {
        const g = beat(3), B = BT[3], a = B.a, d = B.b - B.a;
        const hub = E("g", {}, g); E("circle", { cx: 170, cy: 330, r: 108, fill: C.navyD, stroke: C.yellow, "stroke-width": 8 }, hub); T(hub, "HUB", 170, 356, 74, C.yellow, { sw: 6 }); pop(hub, a + 0.05 * d);
        const bk = E("g", {}, g); E("rect", { x: 560, y: 190, width: 290, height: 320, rx: 26, fill: C.navyD, stroke: C.white, "stroke-width": 7 }, bk); T(bk, "YOUR BANK", 705, 262, 46, C.white, { sw: 5 }); bank(bk, 705, 400, 0.8, C.mute); pop(bk, a + 0.2 * d);
        fadeIn(arrowLine(g, 290, 330, 545, 330, C.white, 9), a + 0.35 * d);
        const q = label(g, "SHOULD THIS", 440, 600, 58, C.yellow), q2 = label(g, "GO THROUGH?", 440, 668, 58, C.yellow); fadeIn(q, a + 0.45 * d); fadeIn(q2, a + 0.5 * d);
        const pk = E("g", {}, g); E("circle", { r: 18, fill: C.yellow }, pk); T(pk, "?", 0, 11, 30, C.navyD, { sw: 0 });
        U.push((t) => { if (!inR(t, B)) return; const u = ((t - a - 0.35 * d) * 0.5) % 1, on = t > a + 0.35 * d ? 1 : 0; pk.setAttribute("transform", `translate(${300 + 235 * u},330)`); pk.setAttribute("opacity", on); });
      }
      // beat 4 (30-40): the hub asks your bank; the PIN goes to the bank, which checks PIN and balance
      {
        const g = beat(4), B = BT[4], a = B.a, d = B.b - B.a;
        phone(g, 40, 480, 130, 220); const hubc = E("g", {}, g); E("circle", { cx: 400, cy: 150, r: 84, fill: C.navyD, stroke: C.yellow, "stroke-width": 8 }, hubc); T(hubc, "HUB", 400, 176, 62, C.yellow, { sw: 5 });
        const bk = E("g", {}, g); E("rect", { x: 580, y: 330, width: 290, height: 360, rx: 26, fill: C.navyD, stroke: C.white, "stroke-width": 7 }, bk); T(bk, "YOUR BANK", 725, 392, 46, C.white, { sw: 5 });
        pop(bk, a + 0.06 * d);
        arrowLine(g, 480, 180, 640, 320, C.white, 8); const ask = label(g, "APPROVE?", 600, 220, 46, C.yellow); fadeIn(ask, a + 0.14 * d);
        const lk = lockIcon(g, 105, 440, 1.0, C.yellow); fadeIn(label(g, "PIN", 105, 575 - 20, 40, C.yellow), a + 0.3 * d);
        const l1 = E("polyline", { points: "170,590 400,236 580,520", fill: "none", stroke: C.mute, "stroke-width": 4, "stroke-dasharray": "4 12", opacity: 0.8 }, g);
        const row = (y, txt, t0) => { const r = E("g", {}, bk); T(r, txt, 690, y + 14, 44, C.white, { sw: 5 }); checkMark(r, 820, y, 22); pop(r, t0); };
        row(500, "PIN", a + 0.55 * d); row(580, "BALANCE", a + 0.7 * d);
        const pkt = E("g", {}, g); lockIcon(pkt, 0, 0, 0.5, C.yellow);
        U.push((t) => { if (!inR(t, B)) return; const u = clamp(((t - a - 0.25 * d) * 0.35)) % 1; const P = [[170, 590], [400, 236], [580, 520]], s1 = u < 0.5, k = s1 ? u * 2 : (u - 0.5) * 2, p0 = s1 ? P[0] : P[1], p1 = s1 ? P[1] : P[2]; pkt.setAttribute("transform", `translate(${lerp(p0[0], p1[0], k)},${lerp(p0[1], p1[1], k)})`); pkt.setAttribute("opacity", t > a + 0.25 * d && t < a + 0.62 * d ? 1 : 0); });
        void lk; void l1;
      }
      // beat 6: your bank says yes; the hub tells the shop's bank to expect the money
      {
        const g = beat(5), B = BT[5], a = B.a, d = B.b - B.a;
        const mini = (x, y, txt, col) => { const k = E("g", {}, g); E("rect", { x, y, width: 250, height: 230, rx: 24, fill: C.navyD, stroke: col, "stroke-width": 7 }, k); bank(k, x + 125, y + 150, 0.62, col); T(k, txt, x + 125, y + 44, 38, col, { sw: 4 }); return k; };
        pop(mini(20, 90, "YOUR BANK", C.white), a + 0.04 * d); pop(mini(610, 90, "SHOP'S BANK", C.white), a + 0.5 * d);
        const hub = E("g", {}, g); E("circle", { cx: 440, cy: 510, r: 100, fill: C.navyD, stroke: C.yellow, "stroke-width": 8 }, hub); T(hub, "HUB", 440, 536, 70, C.yellow, { sw: 6 }); pop(hub, a + 0.02 * d);
        const yes = E("g", {}, g); E("rect", { x: 90, y: 360, width: 110, height: 60, rx: 30, fill: C.green }, yes); T(yes, "YES", 145, 405, 44, C.navyD, { sw: 0 }); pop(yes, a + 0.18 * d);
        fadeIn(arrowLine(g, 145, 330, 370, 440, C.green, 8), a + 0.2 * d);
        fadeIn(arrowLine(g, 510, 440, 735, 330, C.white, 8), a + 0.5 * d);
        pop(label(g, "EXPECT MONEY", 725, 400, 38, C.yellow, { anchor: "middle" }), a + 0.62 * d);
        fadeIn(label(g, "APPROVED", 440, 700, 56, C.green), a + 0.3 * d);
      }
      // beat 5 (40-50): two bank records change, one down and one up
      {
        const g = beat(6), B = BT[6], a = B.a, d = B.b - B.a;
        const card = (x, title, up) => { const c = E("g", {}, g); E("rect", { x, y: 80, width: 390, height: 520, rx: 28, fill: C.navyD, stroke: C.white, "stroke-width": 7 }, c); T(c, title, x + 195, 150, 50, up ? C.green : C.red, { sw: 6 }); E("line", { x1: x + 40, y1: 520, x2: x + 350, y2: 520, stroke: C.mute, "stroke-width": 4 }, c); const bar = E("rect", { x: x + 135, y: 300, width: 120, height: 220, rx: 12, fill: up ? C.green : C.red }, c); pop(c, a + (up ? 0.2 : 0.08) * d); return bar; };
        const b1 = card(20, "YOUR BANK", false), b2 = card(470, "SHOP'S BANK", true);
        const ad = E("g", {}, g); E("polygon", { points: "215,640 245,640 245,690 275,690 230,740 185,690 215,690", fill: C.red }, ad); const au = E("g", {}, g); E("polygon", { points: "665,740 695,740 695,690 725,690 680,640 635,690 665,690", fill: C.green }, au);
        pop(ad, a + 0.4 * d); pop(au, a + 0.5 * d);
        U.push((t) => { if (!inR(t, B)) return; const u = ease(clamp((t - a - 0.3 * d) / (0.4 * d))); b1.setAttribute("y", 300 + 120 * u); b1.setAttribute("height", 220 - 120 * u); b2.setAttribute("y", 300 - 120 * u); b2.setAttribute("height", 220 + 120 * u); });
      }
      // beat 8: the banks settle between themselves later; no cash travels
      {
        const g = beat(7), B = BT[7], a = B.a, d = B.b - B.a;
        const mini = (x, txt) => { const k = E("g", {}, g); E("rect", { x, y: 130, width: 270, height: 250, rx: 24, fill: C.navyD, stroke: C.white, "stroke-width": 7 }, k); bank(k, x + 135, 275, 0.68, C.white); T(k, txt, x + 135, 180, 38, C.white, { sw: 4 }); return k; };
        pop(mini(20, "YOUR BANK"), a + 0.05 * d); pop(mini(590, "SHOP'S BANK"), a + 0.1 * d);
        const ar = E("g", {}, g); arrowLine(ar, 305, 230, 575, 230, C.yellow, 8); arrowLine(ar, 575, 290, 305, 290, C.yellow, 8); fadeIn(ar, a + 0.3 * d);
        const clk = E("g", {}, g); E("circle", { cx: 440, cy: 260, r: 0.1 }, clk); fadeIn(clk, a + 0.3 * d);
        pop(label(g, "SETTLE UP LATER", 440, 520, 62, C.yellow), a + 0.4 * d);
        const nc = E("g", {}, g); T(nc, "NO CASH TRAVELS", 440, 620, 52, C.white); E("line", { x1: 130, y1: 600, x2: 750, y2: 600, stroke: C.red, "stroke-width": 0 }, nc); fadeIn(nc, a + 0.6 * d);
      }
      // beat 6 (50-56): green ticks on both phones
      {
        const g = beat(8), B = BT[8], a = B.a, d = B.b - B.a;
        [[70, "YOURS"], [520, "THEIRS"]].forEach(([x, n], i) => { phone(g, x, 120, 280, 500); pop(checkMark(g, x + 140, 360, 90), a + 0.15 * d + i * 0.2 * d); fadeIn(label(g, n, x + 140, 700, 46, C.white), a + 0.3 * d + i * 0.2 * d); });
        fadeIn(label(g, "CONFIRMED", 440, 60, 52, C.green), a + 0.55 * d);
      }
