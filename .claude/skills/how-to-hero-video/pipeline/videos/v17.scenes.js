      // ===== VIDEO 17: Rajasaurus, India's horned predator =====
      // side view of a short-snouted, horned meat-eater; origin at the hip, facing right. Returns the jaw so it can open.
      function dino(p, x, y, s, o = {}) {
        const k = E("g", { transform: `translate(${x},${y}) scale(${s})` }, p), f = o.fill || C.white, st = { stroke: C.ink, "stroke-width": 5, "stroke-linejoin": "round" };
        E("path", { d: "M95,50 L100,110 L122,160 L158,165", fill: "none", stroke: C.mute, "stroke-width": 22, "stroke-linecap": "round", "stroke-linejoin": "round" }, k);
        E("path", { d: "M10,-28 Q-130,-30 -250,28 Q-120,36 10,62 Z", fill: f, ...st }, k);
        E("path", { d: "M105,-32 L188,-100 L228,-70 L150,25 Z", fill: f, ...st }, k);
        E("ellipse", { cx: 62, cy: 14, rx: 98, ry: 56, fill: f, ...st }, k);
        E("path", { d: "M60,50 L50,110 L76,160 L112,165", fill: "none", stroke: f, "stroke-width": 24, "stroke-linecap": "round", "stroke-linejoin": "round" }, k);
        E("path", { d: "M138,30 L154,56 L168,54", fill: "none", stroke: f, "stroke-width": 9, "stroke-linecap": "round", "stroke-linejoin": "round" }, k);
        const jaw = E("path", { d: "M198,-70 L284,-74 L278,-56 L204,-50 Z", fill: f, ...st }, k);
        E("path", { d: "M184,-112 L268,-108 Q292,-98 286,-78 L198,-70 Z", fill: f, ...st }, k);
        const horn = E("path", { d: "M224,-110 L240,-140 L254,-108 Z", fill: C.yellow, ...st }, k);
        E("circle", { cx: 242, cy: -94, r: 5.5, fill: C.ink }, k);
        return { g: k, jaw, horn };
      }
      const INDIA = "30,0 45,5 50,18 70,22 95,20 100,30 85,38 75,36 68,48 55,62 45,95 38,80 30,55 15,48 5,40 18,35 15,22 28,15";
      const india = (p, x, y, s, fill = C.navyL) => E("polygon", { points: INDIA, transform: `translate(${x},${y}) scale(${s})`, fill, stroke: C.white, "stroke-width": 6 / s, "stroke-linejoin": "round" }, p);
      const bone = (p, x, y, len, ang) => { const k = E("g", { transform: `translate(${x},${y}) rotate(${ang})` }, p); E("rect", { x: -len / 2, y: -7, width: len, height: 14, rx: 7, fill: C.white }, k); [[-len / 2, -8], [-len / 2, 8], [len / 2, -8], [len / 2, 8]].forEach(([a, b]) => E("circle", { cx: a, cy: b, r: 10, fill: C.white }, k)); return k; };

      // beat 1 (under the headline, drawn at frame 0): the animal itself, its horn flashing, its jaw snapping
      {
        const g = beat(0), B = BT[0], a = B.a, d = B.b - B.a;
        const D = dino(g, 400, 520, 1.25);
        const ring = E("circle", { cx: 400 + 240 * 1.25, cy: 520 - 122 * 1.25, r: 40, fill: "none", stroke: C.yellow, "stroke-width": 8 }, g);
        U.push((t) => { if (!inR(t, B)) return; const u = (t - a) % 0.9 / 0.9; ring.setAttribute("r", 34 + 46 * u); ring.setAttribute("opacity", 1 - u);
          D.jaw.setAttribute("transform", `rotate(${14 * Math.abs(Math.sin((t - a) * 4.2))} 200 -62)`); D.g.setAttribute("transform", `translate(${400 + 14 * Math.sin((t - a) * 2.1)},${520 + 5 * Math.sin((t - a) * 8.4)}) scale(1.25)`); });
      }
      // beat 2: the name, and where it lived
      {
        const g = beat(1), B = BT[1], a = B.a, d = B.b - B.a;
        slam(label(g, "RAJASAURUS", 440, 110, 104, C.yellow), a + 0.04 * d);
        pop(label(g, "= KING LIZARD", 440, 190, 58, C.white), a + 0.3 * d);
        const m = E("g", {}, g); india(m, 250, 250, 4.2); pop(m, a + 0.5 * d);
        const pin = E("g", {}, g); E("circle", { cx: 303, cy: 428, r: 22, fill: C.red, stroke: C.white, "stroke-width": 6 }, pin); T(pin, "GUJARAT", 150, 440, 50, C.yellow); pop(pin, a + 0.72 * d);
        const pulse = E("circle", { cx: 303, cy: 428, r: 22, fill: "none", stroke: C.red, "stroke-width": 6, opacity: 0 }, g);
        U.push((t) => { if (t < a + 0.75 * d || t > B.b) return; const u = (t - a) % 0.8 / 0.8; pulse.setAttribute("r", 22 + 50 * u); pulse.setAttribute("opacity", 1 - u); });
      }
      // beat 3: 67 million years ago India was an island drifting north
      {
        const g = beat(2), B = BT[2], a = B.a, d = B.b - B.a;
        pop(label(g, "67 MILLION YEARS AGO", 440, 80, 70, C.yellow), a + 0.04 * d);
        E("path", { d: "M0,150 Q220,120 440,160 T880,140 L880,250 Q660,290 440,250 T0,270 Z", fill: C.navyL, stroke: C.white, "stroke-width": 6 }, g); label(g, "ASIA", 440, 222, 54, C.white);
        const isl = E("g", {}, g); india(isl, -105, -100, 2.1, C.yellow); T(isl, "INDIA", 0, 150, 50, C.white);
        for (let i = 0; i < 3; i++) { const w = E("path", { d: `M${120 + i * 250},${640 + (i % 2) * 40} q30,-22 60,0 t60,0`, fill: "none", stroke: C.sky, "stroke-width": 7, "stroke-linecap": "round" }, g); fadeTo(w, a + 0.1 * d, 0.7); }
        pop(label(g, "AN ISLAND", 700, 520, 56, C.white), a + 0.55 * d);
        const ar = arrowLine(g, 250, 620, 250, 420, C.white, 9); fadeIn(ar, a + 0.6 * d);
        U.push((t) => { if (!inR(t, B, 0.2)) return; const u = ease(clamp((t - a) / d)); isl.setAttribute("transform", `translate(440,${lerp(560, 430, u)})`); });
      }
      // beat 4: early 1980s, a geologist digs the bones out of a hill near Rahioli
      {
        const g = beat(3), B = BT[3], a = B.a, d = B.b - B.a;
        pop(label(g, "1982 TO 1984", 440, 80, 78, C.yellow), a + 0.04 * d);
        E("path", { d: "M40,640 Q440,150 840,640 Z", fill: C.navyL, stroke: C.white, "stroke-width": 7 }, g);
        [[520, 0.2], [570, 0.5]].forEach(([y, k]) => E("path", { d: `M${130 + (640 - y) * 0.9},${y} Q440,${y - 40 * k - 20} ${750 - (640 - y) * 0.9},${y}`, fill: "none", stroke: C.mute, "stroke-width": 5, "stroke-dasharray": "14 12" }, g));
        const bs = [[330, 560, 110, -18], [470, 520, 130, 12], [560, 590, 90, -30], [400, 470, 80, 35]].map(([x, y, l, r]) => bone(g, x, y, l, r));
        bs.forEach((b, i) => pop(b, a + (0.3 + i * 0.12) * d, 0.3));
        const pick = E("g", {}, g); E("rect", { x: -7, y: -110, width: 14, height: 130, rx: 6, fill: C.yellow, stroke: C.ink, "stroke-width": 4 }, pick); E("path", { d: "M-60,-96 Q0,-136 60,-96 L52,-84 Q0,-112 -52,-84 Z", fill: C.white, stroke: C.ink, "stroke-width": 4 }, pick);
        U.push((t) => { if (!inR(t, B, 0.2)) return; pick.setAttribute("transform", `translate(660,400) rotate(${-35 + 40 * Math.abs(Math.sin((t - a) * 5))})`); });
        pop(label(g, "RAHIOLI, GUJARAT", 440, 720, 58, C.white), a + 0.7 * d);
      }
      // beat 5: the bones waited nearly twenty years
      {
        const g = beat(4), B = BT[4], a = B.a, d = B.b - B.a;
        E("rect", { x: 240, y: 300, width: 400, height: 260, rx: 16, fill: C.navyL, stroke: C.white, "stroke-width": 8 }, g);
        [340, 440, 540].forEach((x) => E("line", { x1: x, y1: 300, x2: x, y2: 560, stroke: C.mute, "stroke-width": 5 }, g));
        bone(g, 380, 280, 120, -12); bone(g, 510, 272, 100, 16);
        const yr = T(g, "1984", 440, 180, 130, C.yellow), nt = label(g, "IN STORAGE", 440, 660, 64, C.white); pop(nt, a + 0.25 * d);
        U.push((t) => { if (!inR(t, B, 0.2)) return; yr.textContent = String(Math.round(lerp(1984, 2001, ease(clamp((t - a - 0.1 * d) / (0.75 * d)))))); });
      }
      // beat 6: 2003, skull pieces come together; a new meat-eater 6 to 11 m long
      {
        const g = beat(5), B = BT[5], a = B.a, d = B.b - B.a;
        pop(label(g, "2003: A NEW SPECIES", 440, 80, 72, C.yellow), a + 0.04 * d);
        const P = [["M0,0 L170,8 L160,70 L20,80 Z", -260, -160], ["M170,8 Q260,30 250,80 L160,70 Z", 280, -120], ["M20,84 L250,84 L240,130 L40,126 Z", -40, 240], ["M70,2 L100,-52 L130,6 Z", 60, -260]];
        const parts = P.map(([dd, ox, oy], i) => ({ el: E("path", { d: dd, fill: i === 3 ? C.yellow : C.white, stroke: C.ink, "stroke-width": 5, "stroke-linejoin": "round" }, g), ox, oy }));
        const eye = E("circle", { cx: 440, cy: 330, r: 12, fill: C.ink, opacity: 0 }, g);
        U.push((t) => { if (!inR(t, B, 0.2)) return; const u = 1 - ease(clamp((t - a - 0.08 * d) / (0.4 * d))); parts.forEach((q, i) => q.el.setAttribute("transform", `translate(${310 + q.ox * u},${290 + q.oy * u}) rotate(${(i % 2 ? 40 : -40) * u} 120 60) scale(1.15)`)); eye.setAttribute("opacity", u < 0.02 ? 1 : 0); });
        const bar = E("g", {}, g); E("line", { x1: 120, y1: 600, x2: 760, y2: 600, stroke: C.white, "stroke-width": 8, "stroke-linecap": "round" }, bar); [120, 760].forEach((x) => E("line", { x1: x, y1: 575, x2: x, y2: 625, stroke: C.white, "stroke-width": 8, "stroke-linecap": "round" }, bar)); fadeIn(bar, a + 0.6 * d);
        pop(label(g, "6 TO 11 METRES LONG", 440, 700, 64, C.white), a + 0.68 * d);
      }
      // beat 7: the closest cousin lived on Madagascar; the two lands were once joined
      {
        const g = beat(6), B = BT[6], a = B.a, d = B.b - B.a;
        const I = E("g", {}, g); india(I, -150, -150, 3, C.navyL); dino(I, -30, 10, 0.42); T(I, "INDIA", 0, 215, 54, C.yellow);
        const M = E("g", {}, g); E("ellipse", { cx: 0, cy: 0, rx: 70, ry: 170, transform: "rotate(14)", fill: C.navyL, stroke: C.white, "stroke-width": 6 }, M); dino(M, -32, 10, 0.34); T(M, "MADAGASCAR", 0, 235, 46, C.yellow);
        const link = E("line", { x1: 330, y1: 330, x2: 560, y2: 330, stroke: C.white, "stroke-width": 7, "stroke-dasharray": "16 14", "stroke-linecap": "round" }, g);
        pop(label(g, "COUSINS", 440, 80, 84, C.white), a + 0.2 * d);
        const j = label(g, "ONCE JOINED", 440, 700, 70, C.yellow); pop(j, a + 0.7 * d);
        U.push((t) => { if (!inR(t, B, 0.2)) return; const u = ease(clamp((t - a - 0.55 * d) / (0.25 * d))); I.setAttribute("transform", `translate(${lerp(680, 545, u)},340)`); M.setAttribute("transform", `translate(${lerp(180, 325, u)},360)`); link.setAttribute("opacity", 1 - u); });
      }
      // beat 8: payoff, the king from the Narmada
      {
        const g = beat(7), B = BT[7], a = B.a, d = B.b - B.a;
        const D = dino(g, 380, 380, 1.3);
        const cr = E("path", { d: "M-46,0 L-46,-52 L-22,-24 L0,-64 L22,-24 L46,-52 L46,0 Z", fill: C.yellow, stroke: C.ink, "stroke-width": 5, "stroke-linejoin": "round" }, g);
        U.push((t) => { if (!inR(t, B, 0.2)) return; const u = ease(clamp((t - a - 0.25 * d) / (0.2 * d))), bx = 380 + 14 * Math.sin((t - a) * 2.1); D.g.setAttribute("transform", `translate(${bx},380) scale(1.3)`); D.jaw.setAttribute("transform", `rotate(${12 * Math.abs(Math.sin((t - a) * 3.6))} 200 -62)`); cr.setAttribute("transform", `translate(${bx + 300},${lerp(-80, 196, u)}) rotate(-8)`); });
        pop(label(g, "THE KING FROM", 440, 672, 60, C.white), a + 0.5 * d); pop(label(g, "THE NARMADA", 440, 750, 76, C.yellow), a + 0.62 * d);
      }
