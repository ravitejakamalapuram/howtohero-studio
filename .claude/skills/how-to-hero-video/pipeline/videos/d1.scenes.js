      // ===== DOC d1: Voyager 1, one light-day away =====
      // local box 1680 x 780. Helpers first, then one block per beat.
      const CX = BW / 2;
      let _uid = 0; const uid = (p) => p + "_" + (++_uid);
      const bt = (i) => { const g = beat(i), B = BT[i], a = B.a, d = B.b - B.a; return { g, B, a, d, at: (f) => a + f * d }; };
      function stars(g, n = 70, seed = 1) { const r = rng(seed); for (let i = 0; i < n; i++) E("circle", { cx: r() * BW, cy: r() * BH, r: 1 + r() * 2.4, fill: "#fff", opacity: 0.2 + r() * 0.5 }, g); }
      function sun(g, x, y, r) { const k = E("g", {}, g); E("circle", { cx: x, cy: y, r: r * 2.4, fill: "url(#glowY)", opacity: 0.6 }, k); E("circle", { cx: x, cy: y, r, fill: C.yellow, stroke: C.ink, "stroke-width": 4 }, k); return k; }
      function earth(g, x, y, r) {
        const k = E("g", {}, g), id = uid("ec"); E("circle", { cx: x, cy: y, r }, E("clipPath", { id }, defs));
        E("circle", { cx: x, cy: y, r, fill: "#3D7BFF", stroke: C.ink, "stroke-width": Math.max(2, r * 0.08) }, k);
        const c = E("g", { "clip-path": `url(#${id})` }, k);
        E("ellipse", { cx: x - r * 0.35, cy: y - r * 0.2, rx: r * 0.35, ry: r * 0.5, fill: C.green }, c); E("ellipse", { cx: x + r * 0.45, cy: y + r * 0.3, rx: r * 0.28, ry: r * 0.35, fill: C.green }, c);
        return k;
      }
      function planet(g, x, y, r, col, band, o = {}) {
        const k = E("g", {}, g), id = uid("pc"); E("circle", { cx: x, cy: y, r }, E("clipPath", { id }, defs));
        if (o.ring) E("ellipse", { cx: x, cy: y, rx: r * 2.1, ry: r * 0.5, fill: "none", stroke: "#E9D9A6", "stroke-width": r * 0.22, opacity: 0.9 }, k);
        E("circle", { cx: x, cy: y, r, fill: col, stroke: C.ink, "stroke-width": Math.max(3, r * 0.04) }, k);
        if (band) { const c = E("g", { "clip-path": `url(#${id})` }, k); [-0.55, -0.2, 0.15, 0.5].forEach((f, i) => E("rect", { x: x - r, y: y + f * r, width: 2 * r, height: r * (i % 2 ? 0.12 : 0.18), fill: band, opacity: 0.8 }, c)); }
        if (o.ring) E("path", { d: `M${x - r * 2.1},${y} A${r * 2.1},${r * 0.5} 0 0 0 ${x + r * 2.1},${y}`, fill: "none", stroke: "#E9D9A6", "stroke-width": r * 0.22, opacity: 0.95 }, k);
        return k;
      }
      // Voyager: big white dish, ten-sided bus, RTG boom (3 generators), long magnetometer boom
      function probe(g, x, y, s = 1, rot = 0) {
        const k = E("g", { transform: `translate(${x},${y}) rotate(${rot}) scale(${s})` }, g), S = { stroke: C.ink, "stroke-width": 4, "stroke-linejoin": "round" };
        E("line", { x1: -10, y1: 40, x2: -200, y2: 150, stroke: C.mute, "stroke-width": 5, "stroke-linecap": "round" }, k);
        E("line", { x1: 20, y1: 50, x2: 150, y2: 130, stroke: C.white, "stroke-width": 8, "stroke-linecap": "round" }, k);
        [0, 1, 2].forEach((j) => E("rect", { x: 72 + j * 28, y: 70 + j * 17, width: 26, height: 34, rx: 6, fill: C.red, ...S, transform: `rotate(-30 ${85 + j * 28} ${87 + j * 17})` }, k));
        let pts = ""; for (let i = 0; i < 10; i++) { const an = (i / 10) * TAU; pts += `${(46 * Math.cos(an)).toFixed(1)},${(42 + 30 * Math.sin(an)).toFixed(1)} `; }
        E("polygon", { points: pts, fill: C.navyL, ...S }, k); E("rect", { x: -46, y: 42, width: 92, height: 24, fill: C.navyL, ...S }, k);
        E("path", { d: "M-110,-6 Q0,62 110,-6 Q0,20 -110,-6 Z", fill: C.white, ...S }, k);
        E("ellipse", { cx: 0, cy: -6, rx: 110, ry: 20, fill: "#DDE3FF", ...S }, k);
        E("line", { x1: 0, y1: -6, x2: 0, y2: -58, stroke: C.white, "stroke-width": 5 }, k); E("circle", { cx: 0, cy: -62, r: 8, fill: C.yellow, ...S }, k);
        return k;
      }
      const draw = (el, at, dur = 0.8) => { const L0 = el.getTotalLength(); el.setAttribute("stroke-dasharray", L0 + " " + L0); tl.fromTo(el, { attr: { "stroke-dashoffset": L0 } }, { attr: { "stroke-dashoffset": 0 }, duration: dur, ease: "power1.inOut" }, at); return el; };
      const P = (g, d, col = C.white, w = 7, o = {}) => E("path", { d, fill: "none", stroke: col, "stroke-width": w, "stroke-linecap": "round", "stroke-linejoin": "round", ...o }, g);
      // big chapter label at the top of a beat
      function chapter(g, at, n, title) { slam(label(g, title, CX, 150, 120, C.white), at + 0.05); pop(label(g, "CHAPTER " + n, CX, 50, 44, C.yellow), at + 0.35); }
      // live counter text
      function counter(g, x, y, B, t0, t1, f, size = 90, col = C.yellow, o = {}) {
        const el = label(g, f(0), x, y, size, col, o);
        U.push((t) => { if (!inR(t, B)) return; el.textContent = f(ease(clamp((t - t0) / (t1 - t0)))); });
        return el;
      }
      const comma = (n) => Math.round(n).toLocaleString("en-US");
      // a dot that travels from (x1,y1) to (x2,y2) between t0 and t1
      function pulse(g, x1, y1, x2, y2, B, t0, t1, col = C.yellow, r = 16) {
        const halo = E("circle", { cx: x1, cy: y1, r: r * 2.2, fill: col, opacity: 0 }, g), c = E("circle", { cx: x1, cy: y1, r, fill: col, stroke: C.ink, "stroke-width": 3, opacity: 0 }, g);
        U.push((t) => { if (!inR(t, B)) return; const u = clamp((t - t0) / (t1 - t0)), on = t >= t0 ? 1 : 0, x = lerp(x1, x2, u), y = lerp(y1, y2, u);
          c.setAttribute("cx", x); c.setAttribute("cy", y); halo.setAttribute("cx", x); halo.setAttribute("cy", y); c.setAttribute("opacity", on); halo.setAttribute("opacity", on * (0.25 + 0.15 * Math.sin(t * 8))); });
        return c;
      }
      function bulb(g, x, y, s = 1, glow = true) {
        const k = E("g", { transform: `translate(${x},${y}) scale(${s})` }, g);
        if (glow) E("circle", { cx: 0, cy: -20, r: 110, fill: "url(#glowY)", opacity: 0.6 }, k);
        E("path", { d: "M-34,10 C-70,-20 -60,-90 0,-92 C60,-90 70,-20 34,10 Z", fill: C.yellow, stroke: C.ink, "stroke-width": 5 }, k);
        E("rect", { x: -30, y: 10, width: 60, height: 36, rx: 6, fill: C.mute, stroke: C.ink, "stroke-width": 5 }, k);
        P(k, "M-14,-6 L-8,-46 L0,-30 L8,-46 L14,-6", C.ink, 4);
        return k;
      }
      function chipIcon(g, x, y, w, h, col = C.navyL, txt) {
        const k = E("g", {}, g);
        for (let i = 0; i < 5; i++) { const xx = x + (i + 0.5) * w / 5; E("line", { x1: xx, y1: y - 14, x2: xx, y2: y + h + 14, stroke: C.mute, "stroke-width": 6 }, k); }
        E("rect", { x, y, width: w, height: h, rx: 8, fill: col, stroke: C.white, "stroke-width": 5 }, k);
        if (txt) label(k, txt, x + w / 2, y + h / 2 + 16, 44, C.white);
        return k;
      }
      function dish(g, x, y, s = 1) {
        const k = E("g", { transform: `translate(${x},${y}) scale(${s})` }, g), S = { stroke: C.ink, "stroke-width": 5, "stroke-linejoin": "round" };
        E("polygon", { points: "-60,140 60,140 30,40 -30,40", fill: C.mute, ...S }, k);
        E("path", { d: "M-150,-60 Q0,90 150,-60 Q0,10 -150,-60 Z", fill: C.white, ...S }, k);
        E("line", { x1: -120, y1: -50, x2: 0, y2: -150, stroke: C.white, "stroke-width": 5 }, k); E("line", { x1: 120, y1: -50, x2: 0, y2: -150, stroke: C.white, "stroke-width": 5 }, k);
        E("circle", { cx: 0, cy: -150, r: 12, fill: C.yellow, ...S }, k);
        return k;
      }
      function record(g, x, y, r) {
        const k = E("g", {}, g);
        E("circle", { cx: x, cy: y, r, fill: "#D9A531", stroke: C.ink, "stroke-width": 6 }, k);
        for (let i = 1; i < 7; i++) E("circle", { cx: x, cy: y, r: r * (0.32 + i * 0.1), fill: "none", stroke: "#F7D77A", "stroke-width": 2, opacity: 0.7 }, k);
        E("circle", { cx: x, cy: y, r: r * 0.3, fill: C.yellow, stroke: C.ink, "stroke-width": 4 }, k); E("circle", { cx: x, cy: y, r: 8, fill: C.ink }, k);
        E("path", { d: `M${x - r * 0.7},${y - r * 0.45} A${r * 0.85},${r * 0.85} 0 0 1 ${x - r * 0.1},${y - r * 0.84}`, fill: "none", stroke: "#fff", "stroke-width": 8, opacity: 0.5, "stroke-linecap": "round" }, k);
        return k;
      }
      function toggle(g, x, y, on0 = true) {
        const k = E("g", {}, g); E("rect", { x: x - 50, y: y - 24, width: 100, height: 48, rx: 24, fill: C.navyD, stroke: C.white, "stroke-width": 4 }, k);
        const kn = E("circle", { cx: on0 ? x + 26 : x - 26, cy: y, r: 18, fill: on0 ? C.green : C.mute }, k);
        return { k, set: (on) => { kn.setAttribute("cx", on ? x + 26 : x - 26); kn.setAttribute("fill", on ? C.green : C.red); } };
      }
      function rtg(g, x, y, s = 1) {
        const k = E("g", { transform: `translate(${x},${y}) scale(${s})` }, g);
        E("rect", { x: -60, y: -110, width: 120, height: 220, rx: 18, fill: C.navyD, stroke: C.white, "stroke-width": 6 }, k);
        for (let i = 0; i < 6; i++) E("rect", { x: -86, y: -95 + i * 36, width: 172, height: 12, rx: 6, fill: C.mute }, k);
        E("rect", { x: -60, y: -110, width: 120, height: 220, rx: 18, fill: C.navyD, stroke: C.white, "stroke-width": 6 }, k);
        const core = E("rect", { x: -30, y: -78, width: 60, height: 156, rx: 10, fill: C.red, stroke: C.yellow, "stroke-width": 4 }, k);
        return { k, core };
      }
      // y-bar
      function bar(g, x, y, w, h, col, at, dur = 0.7) { const r = E("rect", { x, y: y - h, width: w, height: h, fill: col, stroke: C.ink, "stroke-width": 4 }, g); tl.fromTo(r, { attr: { height: 0, y } }, { attr: { height: h, y: y - h }, duration: dur, ease: "power2.out" }, at); return r; }
      const glowPulse = (el, B, rate = 3, lo = 0.5, hi = 1) => U.push((t) => { if (!inR(t, B)) return; el.setAttribute("opacity", lo + (hi - lo) * (0.5 + 0.5 * Math.sin((t - B.a) * rate))); });
      const drift = (el, B, x0, y0, x1, y1, rot = 0, s = 1, t0, t1) => U.push((t) => { if (!inR(t, B)) return; const u = ease(clamp((t - (t0 ?? B.a)) / ((t1 ?? B.b) - (t0 ?? B.a)))); placeAt(el, lerp(x0, x1, u), lerp(y0, y1, u), rot, s); });
      const spin = (el, B, cx, cy, rate) => U.push((t) => { if (!inR(t, B)) return; el.setAttribute("transform", `rotate(${((t - B.a) * rate) % 360} ${cx} ${cy})`); });
      function lightLink(g, x1, x2, y, B, t0, t1, txt) {
        E("line", { x1, y1: y, x2, y2: y, stroke: C.mute, "stroke-width": 4, "stroke-dasharray": "4 14" }, g);
        pulse(g, x1, y, x2, y, B, t0, t1);
        if (txt) pop(label(g, txt, (x1 + x2) / 2, y - 40, 56, C.yellow), t0);
      }

      // ---------- beat 0: cold open (hook drawn by finish.js) ----------
      { const g = beat(0); }
      // 1: a radio message takes 24 hours
      { const { g, B, a, d, at } = bt(1); stars(g, 80, 1);
        earth(g, 170, 420, 110); label(g, "EARTH", 170, 600, 52);
        const p = probe(g, 1500, 420, 0.9, -12); drift(p, B, 1480, 420, 1500, 410, -12, 0.9);
        label(g, "VOYAGER 1", 1500, 600, 52, C.yellow);
        lightLink(g, 300, 1360, 420, B, at(0.1), at(0.9));
        counter(g, CX, 250, B, at(0.1), at(0.9), (u) => Math.round(u * 24) + " HOURS", 110, C.white);
        pop(label(g, "AT THE SPEED OF LIGHT", CX, 700, 54, C.sky), at(0.4)); }
      // 2: still alive: a heartbeat trace
      { const { g, B, a, d, at } = bt(2); stars(g, 60, 2);
        const p = probe(g, 330, 400, 1.3, -8); drift(p, B, 330, 420, 330, 390, -8, 1.3);
        let dd = "M600,400"; for (let i = 0; i < 4; i++) { const x = 600 + i * 260; dd += ` L${x + 90},400 L${x + 120},300 L${x + 150},500 L${x + 180},360 L${x + 200},400 L${x + 260},400`; }
        draw(P(g, dd, C.green, 9), at(0.05), d * 0.8);
        ["ALIVE", "LISTENING", "ANSWERING"].forEach((s, i) => pop(label(g, s, 780 + i * 330, 640, 66, i ? C.white : C.yellow), at(0.25 + i * 0.2))); }
      // 3: heat source, tiny computer, fridge-bulb radio
      { const { g, B, a, d, at } = bt(3);
        const xs = [300, 840, 1380];
        const r = rtg(g, xs[0], 330, 0.95); glowPulse(r.core, B, 4, 0.55, 1);
        chipIcon(g, xs[1] - 130, 230, 260, 200, C.navyL, "1970s");
        bulb(g, xs[2], 380, 1.4);
        [["NUCLEAR HEAT", C.red], ["TINY MEMORY", C.white], ["FRIDGE-BULB RADIO", C.yellow]].forEach(([s, c], i) => pop(label(g, s, xs[i], 620, 58, c), at(0.12 + i * 0.25))); }
      // 4: this is Voyager 1
      { const { g, B, a, d, at } = bt(4); stars(g, 90, 4);
        const p = probe(g, CX, 330, 1.6, 0); drift(p, B, CX - 40, 340, CX + 40, 320, -4, 1.6);
        slam(label(g, "VOYAGER 1", CX, 650, 130, C.white), at(0.05)); pop(label(g, "HOW IS IT STILL ALIVE?", CX, 750, 60, C.yellow), at(0.45)); }
      // 5: chapter 1, back to 1977
      { const { g, B, a, d, at } = bt(5); chapter(g, a, 1, "THE GRAND TOUR");
        E("line", { x1: 200, y1: 520, x2: 1480, y2: 520, stroke: C.mute, "stroke-width": 6 }, g);
        [1977, 1990, 2012, 2026].forEach((y, i) => { const x = 200 + i * 426; E("circle", { cx: x, cy: 520, r: 14, fill: C.white }, g); label(g, "" + y, x, 600, 50, C.white); });
        const mk = E("circle", { cx: 1480, cy: 520, r: 26, fill: C.yellow, stroke: C.ink, "stroke-width": 4 }, g);
        tl.fromTo(mk, { attr: { cx: 1480 } }, { attr: { cx: 200 }, duration: d * 0.6, ease: "power2.inOut" }, at(0.2));
        counter(g, CX, 420, B, at(0.2), at(0.2) + d * 0.6, (u) => "" + Math.round(lerp(2026, 1977, u)), 100, C.yellow); }
      // 6-7: the outer planets line up
      const orbitScene = (i, alignFrac, path) => {
        const { g, B, a, d, at } = bt(i); stars(g, 50, i);
        const sx = 160, sy = 420; sun(g, sx, sy, 50);
        const R = [250, 520, 820, 1060, 1300], col = ["#3D7BFF", "#D9A06B", "#E9D9A6", "#9FE3E8", "#5B7BFF"], rr = [14, 46, 38, 30, 30], names = ["EARTH", "JUPITER", "SATURN", "URANUS", "NEPTUNE"];
        R.forEach((r) => E("path", { d: `M${sx + r * Math.cos(-0.55)},${sy + r * Math.sin(-0.55)} A${r},${r} 0 0 1 ${sx + r * Math.cos(0.55)},${sy + r * Math.sin(0.55)}`, fill: "none", stroke: C.mute, "stroke-width": 3, opacity: 0.6 }, g));
        const pl = R.map((r, k) => { const e = E("g", {}, g); E("circle", { cx: 0, cy: 0, r: rr[k], fill: col[k], stroke: C.ink, "stroke-width": 4 }, e); return e; });
        const lbl = names.map((n, k) => label(g, n, sx + R[k], 720, 40, k ? C.white : C.sky));
        const ang0 = [-0.5, 0.45, -0.4, 0.5, -0.3];
        U.push((t) => { if (!inR(t, B)) return; const u = ease(clamp((t - a) / (alignFrac * d))); R.forEach((r, k) => { const an = lerp(ang0[k], -0.02 * k, u); pl[k].setAttribute("transform", `translate(${sx + r * Math.cos(an)},${sy + r * Math.sin(an)})`); }); });
        void lbl;
        return { g, B, a, d, at, sx, sy, R };
      };
      { const o = orbitScene(6, 0.7); pop(label(o.g, "THE PLANETS LINE UP", CX, 80, 66, C.yellow), o.at(0.5)); }
      { const o = orbitScene(7, 0.01); const { g, B, at, sx, sy, R } = o;
        const path = P(g, `M${sx + R[0]},${sy} C${sx + 380},${sy - 60} ${sx + 470},${sy - 40} ${sx + R[1]},${sy - 50} S${sx + 760},${sy + 30} ${sx + R[2]},${sy + 40} S${sx + 1000},${sy - 20} ${sx + R[3]},${sy - 30} S${sx + 1250},${sy + 10} ${sx + R[4]},${sy}`, C.yellow, 6, { "stroke-dasharray": "3 16" });
        draw(path, at(0.1), 2.5);
        pop(label(g, "ONCE EVERY ~175 YEARS", CX, 80, 66, C.yellow), at(0.05)); pop(label(g, "GRAVITY ASSISTS", CX, 160, 50, C.white), at(0.45)); }
      // 8: two launches, 16 days apart
      { const { g, B, a, d, at } = bt(8);
        const rocket = (x, col) => { const k = E("g", {}, g); E("rect", { x: -26, y: -150, width: 52, height: 200, rx: 10, fill: C.white, stroke: C.ink, "stroke-width": 4 }, k); E("path", { d: "M-26,-150 L0,-210 L26,-150 Z", fill: col, stroke: C.ink, "stroke-width": 4 }, k);
          E("path", { d: "M-26,30 L-50,60 L-26,50 Z M26,30 L50,60 L26,50 Z", fill: col, stroke: C.ink, "stroke-width": 4 }, k); const fl = E("path", { d: "M-18,52 Q0,130 18,52 Z", fill: C.yellow }, k); glowPulse(fl, B, 18, 0.6, 1); return k; };
        const r2 = rocket(0, C.sky), r1 = rocket(0, C.red);
        drift(r2, B, 420, 600, 420, 260, 0, 1, at(0.05), at(0.45)); drift(r1, B, 1260, 600, 1260, 260, 0, 1, at(0.45), at(0.85));
        pop(label(g, "VOYAGER 2: FIRST", 420, 720, 56, C.sky), at(0.1)); pop(label(g, "VOYAGER 1: SEPT 5, 1977", 1260, 720, 56, C.yellow), at(0.5));
        pop(label(g, "+16 DAYS", CX, 420, 80, C.white), at(0.4)); arrowLine(g, 640, 470, 1040, 470, C.white); }
      // 9: overtakes its twin
      { const { g, B, a, d, at } = bt(9); stars(g, 40, 9);
        P(g, "M120,500 C600,480 1100,420 1600,300", C.yellow, 4, { "stroke-dasharray": "4 14" }); P(g, "M120,560 C600,560 1100,560 1600,520", C.sky, 4, { "stroke-dasharray": "4 14" });
        const v1 = probe(g, 0, 0, 0.45), v2 = probe(g, 0, 0, 0.45);
        U.push((t) => { if (!inR(t, B)) return; const u = clamp((t - a) / d); placeAt(v2, lerp(400, 1000, u), 560 - 25 * u, 0, 0.45); placeAt(v1, lerp(200, 1450, ease(u)), lerp(500, 330, ease(u)), 0, 0.45); });
        pop(label(g, "FASTER PATH", 1200, 200, 60, C.yellow), at(0.4)); pop(label(g, "OVERTAKES ITS TWIN BY DECEMBER", CX, 720, 56, C.white), at(0.6)); }
      // 10: Jupiter flyby
      { const { g, B, a, d, at } = bt(10); stars(g, 50, 10);
        planet(g, 1180, 400, 300, "#D9A06B", "#A8653A");
        E("ellipse", { cx: 1080, cy: 500, rx: 50, ry: 28, fill: C.red, opacity: 0.85 }, g);
        P(g, "M60,120 Q700,300 760,780", C.yellow, 5, { "stroke-dasharray": "4 14" });
        const p = probe(g, 0, 0, 0.5); U.push((t) => { if (!inR(t, B)) return; const u = clamp((t - a) / d), q = 1 - u; placeAt(p, q * q * 60 + 2 * q * u * 700 + u * u * 760, q * q * 120 + 2 * q * u * 300 + u * u * 780, 20, 0.5); });
        pop(label(g, "JUPITER, MARCH 1979", 400, 80, 62, C.yellow), at(0.05));
        counter(g, 400, 640, B, at(0.3), at(0.8), (u) => "~" + comma(u * 280000) + " KM", 64, C.white); }
      // 11: ring and two moons
      { const { g, B, a, d, at } = bt(11); stars(g, 50, 11);
        const ringE = E("ellipse", { cx: CX, cy: 420, rx: 520, ry: 70, fill: "none", stroke: C.sky, "stroke-width": 5 }, g); fadeTo(ringE, at(0.1), 0.7, 0.6);
        planet(g, CX, 420, 250, "#D9A06B", "#A8653A");
        const fr = E("path", { d: `M${CX - 520},420 A520,70 0 0 0 ${CX + 520},420`, fill: "none", stroke: C.sky, "stroke-width": 5 }, g); fadeTo(fr, at(0.1), 0.7, 0.6);
        const m1 = E("circle", { cx: 300, cy: 300, r: 16, fill: C.white }, g), m2 = E("circle", { cx: 1380, cy: 540, r: 12, fill: C.white }, g);
        pop(m1, at(0.5)); pop(m2, at(0.6));
        pop(label(g, "A FAINT RING", CX, 90, 66, C.sky), at(0.15)); pop(label(g, "2 NEW MOONS", CX, 740, 66, C.yellow), at(0.5)); }
      // 12: slingshot
      { const { g, B, a, d, at } = bt(12); stars(g, 40, 12);
        planet(g, 700, 430, 170, "#D9A06B", "#A8653A");
        const path = P(g, "M80,200 C500,200 900,300 900,450 C900,600 1100,640 1600,620", C.yellow, 6, { "stroke-dasharray": "4 14" });
        const p = probe(g, 0, 0, 0.4), L0 = path.getTotalLength();
        U.push((t) => { if (!inR(t, B)) return; const u = clamp((t - a) / d), pt = path.getPointAtLength(ease(u) * L0); placeAt(p, pt.x, pt.y, 0, 0.4); });
        label(g, "SPEED", 1350, 130, 50, C.white);
        E("rect", { x: 1220, y: 160, width: 300, height: 50, rx: 10, fill: "none", stroke: C.white, "stroke-width": 4 }, g);
        const sb = E("rect", { x: 1226, y: 166, width: 60, height: 38, rx: 6, fill: C.green }, g);
        tl.fromTo(sb, { attr: { width: 60 } }, { attr: { width: 288 }, duration: d * 0.5, ease: "power2.in" }, at(0.35));
        pop(label(g, "GRAVITY SLINGSHOT", 700, 740, 64, C.yellow), at(0.3)); }
      // 13: Saturn, and a fork in the road
      { const { g, B, a, d, at } = bt(13); stars(g, 50, 13);
        planet(g, 1150, 400, 170, "#E9D9A6", "#C9B27A", { ring: true });
        const p = probe(g, 260, 420, 0.6); drift(p, B, 200, 440, 330, 420, 0, 0.6);
        pop(label(g, "SATURN, NOV 1980", 600, 90, 64, C.yellow), at(0.05));
        const up = arrowLine(g, 480, 400, 760, 220, C.yellow, 9), fw = arrowLine(g, 480, 440, 760, 560, C.sky, 9);
        pop(up, at(0.5)); pop(fw, at(0.55)); pop(label(g, "?", 820, 420, 160, C.white), at(0.65)); }
      // 14: Titan, the moon with air
      { const { g, B, a, d, at } = bt(14); stars(g, 50, 14);
        planet(g, 420, 420, 150, "#E9D9A6", "#C9B27A", { ring: true });
        const tg = E("circle", { cx: 1150, cy: 400, r: 230, fill: "url(#glowY)", opacity: 0 }, g); fadeTo(tg, at(0.2), 0.5);
        planet(g, 1150, 400, 170, "#E58A2E", "#C96A1E");
        const hz = E("circle", { cx: 1150, cy: 400, r: 186, fill: "none", stroke: "#F7B45A", "stroke-width": 16 }, g); fadeTo(hz, at(0.25), 0.55);
        pop(label(g, "TITAN", 1150, 110, 80, C.yellow), at(0.05)); pop(label(g, "THICK ATMOSPHERE", 1150, 700, 58, C.white), at(0.4));
        arrowLine(g, 640, 300, 940, 330, C.white); }
      // 15: the Titan pass: distance + nitrogen
      { const { g, B, a, d, at } = bt(15);
        planet(g, 380, 430, 260, "#E58A2E", "#C96A1E"); const hz = E("circle", { cx: 380, cy: 430, r: 284, fill: "none", stroke: "#F7B45A", "stroke-width": 22 }, g); fadeTo(hz, at(0.05), 0.5);
        P(g, "M760,40 Q820,430 760,780", C.yellow, 5, { "stroke-dasharray": "4 14" });
        counter(g, 1200, 200, B, at(0.05), at(0.45), (u) => "~" + comma(u * 6500) + " KM", 84, C.yellow);
        label(g, "FROM TITAN'S CENTER", 1200, 270, 44, C.white);
        E("rect", { x: 900, y: 420, width: 600, height: 70, rx: 10, fill: C.navyD, stroke: C.white, "stroke-width": 4 }, g);
        const nb = E("rect", { x: 906, y: 426, width: 0, height: 58, rx: 6, fill: C.sky }, g);
        tl.fromTo(nb, { attr: { width: 0 } }, { attr: { width: 530 }, duration: 0.9, ease: "power2.out" }, at(0.55));
        pop(label(g, "MOSTLY NITROGEN", 1200, 580, 60, C.sky), at(0.6)); }
      // 16: thrown out of the plane
      { const { g, B, a, d, at } = bt(16); stars(g, 40, 16);
        E("ellipse", { cx: 640, cy: 520, rx: 560, ry: 70, fill: C.navyL, opacity: 0.35, stroke: C.mute, "stroke-width": 3 }, g);
        sun(g, 640, 520, 34); planet(g, 1060, 520, 34, "#E9D9A6", null, { ring: true });
        label(g, "PLANE OF THE PLANETS", 640, 650, 50, C.mute);
        const path = draw(P(g, "M900,560 C1100,560 1150,470 1200,360 S1350,120 1500,60", C.yellow, 7), at(0.2), d * 0.6);
        const p = probe(g, 0, 0, 0.4), L0 = path.getTotalLength();
        U.push((t) => { if (!inR(t, B)) return; const u = clamp((t - at(0.2)) / (d * 0.6)), pt = path.getPointAtLength(ease(u) * L0); placeAt(p, pt.x, pt.y, -30, 0.4); });
        pop(label(g, "UP AND OUT", 1250, 300, 70, C.yellow, { anchor: "end" }), at(0.5)); }
      // 17: two paths: V2 tours on, V1 heads for the edge
      { const { g, B, a, d, at } = bt(17); stars(g, 50, 17);
        sun(g, 140, 560, 40);
        draw(P(g, "M180,560 C600,560 900,600 1550,640", C.sky, 7), at(0.2), 1.2);
        draw(P(g, "M180,560 C500,520 900,300 1550,90", C.yellow, 7), at(0.45), 1.2);
        [[700, 585, "URANUS"], [1150, 610, "NEPTUNE"]].forEach(([x, y, n], i) => { pop(E("circle", { cx: x, cy: y, r: 26, fill: i ? "#5B7BFF" : "#9FE3E8", stroke: C.ink, "stroke-width": 4 }, g), at(0.3 + i * 0.1)); label(g, n, x, y + 80, 42, C.white); });
        pop(label(g, "VOYAGER 2: GRAND TOUR", 1150, 740, 50, C.sky), at(0.3)); pop(label(g, "VOYAGER 1: THE EDGE", 1100, 120, 60, C.yellow), at(0.6)); }
      // 18: chapter 2, one last look
      { const { g, B, a, d, at } = bt(18); chapter(g, a, 2, "ONE LAST LOOK"); stars(g, 30, 18);
        const p = probe(g, CX, 500, 1.1, 0);
        U.push((t) => { if (!inR(t, B)) return; const u = ease(clamp((t - at(0.45)) / (d * 0.45))); placeAt(p, CX, 500, 180 * u, 1.1); });
        pop(label(g, "FEB 14, 1990", 300, 520, 66, C.yellow), at(0.3)); pop(label(g, "TURNS AROUND", 1380, 520, 60, C.white), at(0.5)); }
      // 19: family portrait mosaic
      { const { g, B, a, d, at } = bt(19); stars(g, 40, 19);
        const cols = 10, rows = 4, w = 120, h = 92, x0 = CX - (cols * w) / 2, y0 = 200;
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const k = r * cols + c, el = E("rect", { x: x0 + c * w + 4, y: y0 + r * h + 4, width: w - 8, height: h - 8, fill: C.navyD, stroke: C.sky, "stroke-width": 3 }, g); pop(el, at(0.08) + k * (d * 0.5 / 40), 0.2); }
        pop(label(g, "A FAMILY PORTRAIT", CX, 110, 70, C.yellow), at(0.05));
        counter(g, CX, 700, B, at(0.2), at(0.7), (u) => "~" + (u * 6).toFixed(1) + " BILLION KM AWAY", 66, C.white); }
      // 20: Earth, less than one pixel
      { const { g, B, a, d, at } = bt(20);
        E("rect", { x: 380, y: 40, width: 920, height: 640, fill: "#05081E", stroke: C.white, "stroke-width": 5 }, g);
        [[-80, "#C79A6A"], [0, "#E0B98A"], [80, "#B9895F"]].forEach(([dx, c]) => { const b = E("polygon", { points: `${700 + dx},40 ${790 + dx},40 ${870 + dx},680 ${780 + dx},680`, fill: c }, g); fadeTo(b, at(0.05), 0.28, 0.6); });
        const dot = E("circle", { cx: 850, cy: 420, r: 5, fill: "#9FD3FF" }, g); glowPulse(dot, B, 5, 0.5, 1);
        const ring = E("circle", { cx: 850, cy: 420, r: 40, fill: "none", stroke: C.yellow, "stroke-width": 5 }, g); pop(ring, at(0.35));
        pop(label(g, "EARTH", 980, 360, 52, C.yellow, { anchor: "start" }), at(0.4));
        pop(label(g, "SMALLER THAN ONE PIXEL", CX, 760, 60, C.white), at(0.55)); }
      // 21: pale blue dot
      { const { g, B, a, d, at } = bt(21); stars(g, 70, 21);
        const dot = E("circle", { cx: CX, cy: 360, r: 12, fill: "#9FD3FF" }, g); glowPulse(dot, B, 3, 0.6, 1);
        const rg = E("circle", { cx: CX, cy: 360, r: 30, fill: "none", stroke: C.sky, "stroke-width": 3 }, g);
        U.push((t) => { if (!inR(t, B)) return; const f = ((t - a) * 0.5) % 1; rg.setAttribute("r", 30 + f * 200); rg.setAttribute("opacity", 0.8 * (1 - f)); });
        slam(label(g, "A PALE BLUE DOT", CX, 150, 110, C.sky), at(0.1)); pop(label(g, "EVERYONE WHO HAS EVER LIVED", CX, 680, 64, C.white), at(0.5)); }
      // 22: cameras off
      { const { g, B, a, d, at } = bt(22);
        const cam = E("g", {}, g); E("rect", { x: 520, y: 220, width: 420, height: 280, rx: 30, fill: C.navyL, stroke: C.white, "stroke-width": 7 }, cam); E("circle", { cx: 730, cy: 360, r: 100, fill: C.navyD, stroke: C.white, "stroke-width": 7 }, cam);
        const lens = E("circle", { cx: 730, cy: 360, r: 50, fill: C.sky }, cam);
        tl.to(lens, { attr: { fill: "#0B1138" }, duration: 0.4 }, at(0.5));
        const sw = toggle(g, 1200, 360, true); U.push((t) => { if (inR(t, B)) sw.set(t < at(0.5)); });
        pop(label(g, "CAMERAS OFF FOR GOOD", CX, 670, 76, C.yellow), at(0.55)); label(g, "SAVE POWER", 1200, 260, 50, C.white); }
      // 23: chapter 3: the solar wind
      { const { g, B, a, d, at } = bt(23); chapter(g, a, 3, "INTO THE DARK");
        sun(g, CX, 500, 70); const R = rng(23), pts = [];
        for (let i = 0; i < 40; i++) pts.push({ an: R() * TAU, ph: R(), el: E("circle", { r: 6, fill: C.yellow, opacity: 0 }, g) });
        U.push((t) => { if (!inR(t, B)) return; pts.forEach((p) => { const f = (((t - a) * 0.35 + p.ph) % 1); p.el.setAttribute("cx", CX + Math.cos(p.an) * (80 + f * 700)); p.el.setAttribute("cy", 500 + Math.sin(p.an) * (80 + f * 260)); p.el.setAttribute("opacity", (1 - f) * clamp((t - a - 0.4) / 0.5)); }); });
        pop(label(g, "SOLAR WIND", CX + 420, 700, 60, C.yellow), at(0.4)); }
      // 24: the heliosphere bubble
      const helio = (g, at, hx = 700) => { const b = E("path", { d: `M${hx - 420},420 C${hx - 420},160 ${hx + 120},110 ${hx + 520},250 C${hx + 760},330 ${hx + 760},510 ${hx + 520},590 C${hx + 120},730 ${hx - 420},680 ${hx - 420},420 Z`, fill: C.navyL, "fill-opacity": 0.35, stroke: C.sky, "stroke-width": 6 }, g); sun(g, hx, 420, 30); return b; };
      { const { g, B, a, d, at } = bt(24); stars(g, 90, 24); helio(g, at);
        pop(label(g, "HELIOSPHERE", 700, 330, 70, C.sky), at(0.05)); pop(label(g, "INTERSTELLAR SPACE", 1470, 90, 56, C.yellow), at(0.45)); pop(label(g, "INTERSTELLAR SPACE", 260, 760, 50, C.yellow), at(0.55)); }
      // 25: crossing, Aug 25 2012
      { const { g, B, a, d, at } = bt(25); stars(g, 90, 25); helio(g, at, 520);
        const p = probe(g, 0, 0, 0.4); drift(p, B, 900, 300, 1450, 200, -20, 0.4);
        const fl = E("circle", { cx: 1255, cy: 250, r: 20, fill: "none", stroke: C.yellow, "stroke-width": 6 }, g);
        tl.fromTo(fl, { attr: { r: 20 }, opacity: 1 }, { attr: { r: 160 }, opacity: 0, duration: 0.9, immediateRender: false }, at(0.5));
        pop(label(g, "AUG 25, 2012", 1300, 480, 76, C.yellow), at(0.4)); pop(label(g, "FIRST EVER", 1300, 560, 56, C.white), at(0.6)); }
      // 26: the broken plasma sensor
      { const { g, B, a, d, at } = bt(26); stars(g, 40, 26);
        const sen = E("g", {}, g); E("rect", { x: 500, y: 220, width: 300, height: 260, rx: 20, fill: C.navyL, stroke: C.white, "stroke-width": 7 }, sen);
        [0, 1, 2].forEach((i) => E("rect", { x: 540 + i * 80, y: 260, width: 60, height: 180, rx: 8, fill: C.navyD, stroke: C.mute, "stroke-width": 4 }, sen));
        label(g, "PLASMA SENSOR", 650, 560, 56, C.white);
        pop(crossMark(g, 800, 220, 60), at(0.4));
        pop(label(g, "?", 1200, 420, 220, C.yellow), at(0.6)); pop(label(g, "ARE WE OUT?", 1200, 560, 56, C.yellow), at(0.6)); }
      // 27: the Sun rings the gas like a bell
      { const { g, B, a, d, at } = bt(27); stars(g, 40, 27);
        sun(g, 150, 400, 70); const p = probe(g, 1300, 400, 0.7);
        const front = E("path", { d: "M0,0", fill: "none", stroke: C.yellow, "stroke-width": 10, "stroke-linecap": "round" }, g);
        const rgs = [0, 1, 2].map(() => E("circle", { cx: 1300, cy: 400, r: 0, fill: "none", stroke: C.sky, "stroke-width": 6, opacity: 0 }, g));
        U.push((t) => { if (!inR(t, B)) return; const u = clamp((t - at(0.05)) / (d * 0.45)), x = 230 + u * 1050; front.setAttribute("d", `M${x - 80},120 Q${x + 60},400 ${x - 80},680`); front.setAttribute("opacity", u < 1 ? 1 : 0);
          rgs.forEach((c, k) => { const f = (((t - at(0.5)) * 0.7 + k / 3) % 1 + 1) % 1, on = t > at(0.5) ? 1 : 0; c.setAttribute("r", 60 + f * 300); c.setAttribute("opacity", on * 0.8 * (1 - f)); }); });
        pop(label(g, "2013: A SOLAR OUTBURST", 600, 90, 60, C.yellow), at(0.05)); pop(label(g, "THE GAS RINGS LIKE A BELL", 1100, 740, 56, C.sky), at(0.55)); void p; }
      // 28: 40 times denser
      { const { g, B, a, d, at } = bt(28);
        const wv = P(g, "", C.sky, 7);
        U.push((t) => { if (!inR(t, B)) return; wv.setAttribute("d", wavePath(100, 760, 300, 90, 70, (t - a) * 8)); });
        label(g, "THE TONE'S PITCH", 430, 470, 52, C.white);
        E("line", { x1: 950, y1: 650, x2: 1600, y2: 650, stroke: C.white, "stroke-width": 5 }, g);
        bar(g, 1030, 650, 160, 12, C.mute, at(0.3)); bar(g, 1330, 650, 160, 480, C.yellow, at(0.4), 1.2);
        label(g, "INSIDE", 1110, 720, 46, C.white); label(g, "OUTSIDE", 1410, 720, 46, C.yellow);
        pop(label(g, "~40x DENSER", 1410, 130, 66, C.yellow), at(0.55)); }
      // 29: working backward to Aug 2012
      { const { g, B, a, d, at } = bt(29);
        E("line", { x1: 160, y1: 420, x2: 1520, y2: 420, stroke: C.white, "stroke-width": 6 }, g);
        [[300, "AUG 2012"], [900, "LATE 2012"], [1400, "APR 2013"]].forEach(([x, s], i) => { E("circle", { cx: x, cy: 420, r: 16, fill: i ? C.sky : C.yellow }, g); label(g, s, x, 510, 50, i ? C.white : C.yellow); });
        const ar = arrowLine(g, 1380, 330, 330, 330, C.yellow, 10); pop(ar, at(0.3));
        pop(label(g, "WORKING BACKWARD", CX, 240, 62, C.white), at(0.2)); pop(label(g, "OUTSIDE THE SUN'S BUBBLE", CX, 680, 66, C.yellow), at(0.6)); }
      // 30: chapter 4: no solar power
      { const { g, B, a, d, at } = bt(30); chapter(g, a, 4, "RUNNING ON HEAT");
        sun(g, 260, 500, 18); label(g, "THE SUN, FROM HERE", 260, 620, 44, C.white);
        const panel = E("g", {}, g); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) E("rect", { x: 700 + i * 100, y: 390 + j * 100, width: 92, height: 92, fill: "#2D4BB3", stroke: C.white, "stroke-width": 4 }, panel);
        pop(crossMark(g, 850, 490, 80), at(0.45)); pop(label(g, "TOO DIM FOR SOLAR PANELS", 850, 720, 52, C.yellow), at(0.5));
        const r = rtg(g, 1370, 500, 0.8); glowPulse(r.core, B, 4, 0.5, 1); pop(r.k, at(0.7)); }
      // 31: three generators on a boom
      { const { g, B, a, d, at } = bt(31);
        const p = probe(g, 380, 400, 1.7, 0);
        const box = E("rect", { x: 480, y: 470, width: 230, height: 190, rx: 16, fill: "none", stroke: C.yellow, "stroke-width": 5, "stroke-dasharray": "10 10" }, g); pop(box, at(0.2));
        arrowLine(g, 730, 560, 930, 470, C.yellow);
        const r = rtg(g, 1250, 400, 1.3); glowPulse(r.core, B, 3, 0.45, 1);
        pop(label(g, "3 RADIOISOTOPE GENERATORS", 1150, 70, 56, C.yellow), at(0.1)); pop(label(g, "PLUTONIUM CORE: HOT", 1250, 720, 54, C.red), at(0.5)); void p; }
      // 32: heat to electricity
      { const { g, B, a, d, at } = bt(32);
        const r = rtg(g, 280, 400, 1.1); glowPulse(r.core, B, 4, 0.5, 1);
        const hp = P(g, "M380,400 L760,400", C.red, 10, { "stroke-dasharray": "20 20" }), ep = P(g, "M980,400 L1360,400", C.yellow, 10, { "stroke-dasharray": "20 20" });
        U.push((t) => { if (!inR(t, B)) return; hp.setAttribute("stroke-dashoffset", -(t - a) * 80); ep.setAttribute("stroke-dashoffset", -(t - a) * 120); });
        E("rect", { x: 770, y: 300, width: 200, height: 200, rx: 14, fill: C.navyL, stroke: C.white, "stroke-width": 6 }, g); P(g, "M800,330 L830,470 L860,330 L890,470 L920,330 L940,470", C.yellow, 5);
        bulb(g, 1480, 430, 1); label(g, "HEAT", 570, 360, 50, C.red); label(g, "THERMOCOUPLES", 870, 570, 46, C.white); label(g, "ELECTRICITY", 1170, 360, 50, C.yellow);
        pop(label(g, "NO MOVING PARTS", CX, 720, 66, C.yellow), at(0.5)); }
      // 33: about 470 watts at launch
      { const { g, B, a, d, at } = bt(33);
        [0, 1, 2].forEach((i) => { const r = rtg(g, 330 + i * 230, 400, 0.85); glowPulse(r.core, B, 3 + i, 0.5, 1); });
        label(g, "+", 445, 420, 80, C.white); label(g, "+", 675, 420, 80, C.white);
        counter(g, 1240, 450, B, at(0.1), at(0.6), (u) => "~" + Math.round(u * 470) + " W", 170, C.yellow);
        pop(label(g, "AT LAUNCH, 1977", 1240, 560, 56, C.white), at(0.4)); }
      // 34: losing about 4 watts a year
      { const { g, B, a, d, at } = bt(34);
        const x0 = 180, x1 = 1560, y0 = 660, y1 = 120;
        E("line", { x1: x0, y1: y0, x2: x1, y2: y0, stroke: C.white, "stroke-width": 5 }, g); E("line", { x1: x0, y1: y0, x2: x0, y2: y1 - 20, stroke: C.white, "stroke-width": 5 }, g);
        label(g, "1977", x0, 720, 46, C.white); label(g, "2026", x1, 720, 46, C.white); label(g, "POWER", x0 + 20, 100, 46, C.white, { anchor: "start" });
        const ln = draw(P(g, `M${x0},${y1 + 40} L${x1},${y1 + 300}`, C.yellow, 9), at(0.1), d * 0.6);
        pop(label(g, "ABOUT -4 WATTS EVERY YEAR", 1000, 260, 66, C.yellow), at(0.4)); pop(label(g, "DECAY + AGING", 1000, 560, 56, C.white), at(0.6)); void ln; }
      // 35 & 36: switches going off
      const panelOff = (i, names, offN, title) => {
        const { g, B, a, d, at } = bt(i); pop(label(g, title, CX, 80, 64, C.yellow), at(0.03));
        const sws = names.map((n, k) => { const col = k % 2, row = Math.floor(k / 2), x = 340 + col * 780, y = 200 + row * 110; label(g, n, x + 90, y + 18, 44, C.white, { anchor: "start" }); return toggle(g, x, y, true); });
        U.push((t) => { if (!inR(t, B)) return; sws.forEach((s, k) => s.set(!(k < offN && t > at(0.15 + 0.7 * k / Math.max(1, offN))))); });
        return { g, at };
      };
      panelOff(35, ["HEATER A", "HEATER B", "INSTRUMENT", "INSTRUMENT", "BACKUP", "SCIENCE", "TRANSMITTER", "COMPUTERS"], 3, "EVERY YEAR: WHAT GOES OFF NEXT?");
      { const { g } = panelOff(36, ["HEATERS", "CAMERAS", "SPECTROMETERS", "PLASMA", "RADIO ASTRONOMY", "PHOTOPOLARIMETER"], 6, "ONE BY ONE"); }
      // 37: 2025 and 2026 switch-offs
      { const { g, B, a, d, at } = bt(37);
        E("line", { x1: 200, y1: 420, x2: 1480, y2: 420, stroke: C.white, "stroke-width": 6 }, g);
        [[480, "FEB 2025", "COSMIC RAYS"], [1200, "APR 2026", "LOW-ENERGY PARTICLES"]].forEach(([x, dt, n], i) => {
          E("circle", { cx: x, cy: 420, r: 18, fill: C.red }, g); pop(label(g, dt, x, 330, 70, C.yellow), at(0.1 + i * 0.4));
          pop(label(g, n, x, 520, 54, C.white), at(0.15 + i * 0.4)); const t2 = toggle(g, x, 620, true); U.push((t) => { if (inR(t, B)) t2.set(t < at(0.25 + i * 0.4)); }); }); }
      // 38: two instruments left
      { const { g, B, a, d, at } = bt(38);
        const names = ["CAMERAS", "UV", "INFRARED", "RADIO", "PHOTOPOL.", "PLASMA", "COSMIC RAY", "LOW-ENERGY", "MAGNETOMETER", "PLASMA WAVE"];
        names.forEach((n, k) => { const col = k % 5, row = Math.floor(k / 5), x = 120 + col * 300, y = 180 + row * 300, on = k >= 8;
          const bx = E("rect", { x, y, width: 270, height: 200, rx: 18, fill: on ? C.navyL : C.navyD, stroke: on ? C.green : C.mute, "stroke-width": on ? 8 : 4 }, g);
          label(g, n, x + 135, y + 120, n.length > 10 ? 36 : 42, on ? C.white : C.mute); if (on) glowPulse(bx, B, 4, 0.6, 1); });
        pop(label(g, "2 STILL RUNNING", CX, 90, 70, C.green), at(0.3)); }
      // 39: 68 kilobytes
      { const { g, B, a, d, at } = bt(39);
        ["COMMAND", "FLIGHT DATA", "ATTITUDE"].forEach((n, k) => { chipIcon(g, 140 + k * 300, 260, 240, 160, C.navyL); label(g, n, 260 + k * 300, 500, 40, C.white); });
        counter(g, 1330, 380, B, at(0.15), at(0.6), (u) => "~" + Math.round(u * 68) + " KB", 150, C.yellow);
        pop(label(g, "ALL COMPUTERS COMBINED", 1330, 470, 46, C.white), at(0.4)); pop(label(g, "PURE 1970s", 560, 120, 70, C.yellow), at(0.05)); }
      // 40: 8000 instructions per second, 50 years
      { const { g, B, a, d, at } = bt(40);
        counter(g, 500, 340, B, at(0.05), at(0.4), (u) => comma(u * 8000), 150, C.yellow); label(g, "INSTRUCTIONS / SECOND", 500, 430, 50, C.white);
        const ring = E("circle", { cx: 1250, cy: 380, r: 190, fill: "none", stroke: C.navyL, "stroke-width": 26 }, g);
        const arc = E("circle", { cx: 1250, cy: 380, r: 190, fill: "none", stroke: C.green, "stroke-width": 26, transform: "rotate(-90 1250 380)", "stroke-dasharray": `0 ${TAU * 190}` }, g);
        tl.fromTo(arc, { attr: { "stroke-dasharray": `0 ${TAU * 190}` } }, { attr: { "stroke-dasharray": `${TAU * 190 * 0.98} ${TAU * 190}` }, duration: d * 0.5, ease: "power1.inOut" }, at(0.4));
        counter(g, 1250, 420, B, at(0.4), at(0.9), (u) => "" + Math.round(u * 49), 120, C.white); label(g, "YEARS FLYING", 1250, 650, 54, C.green); void ring; }
      // 41: chapter 5: nonsense
      { const { g, B, a, d, at } = bt(41); chapter(g, a, 5, "THE GIBBERISH");
        pop(label(g, "NOV 14, 2023", CX, 380, 90, C.yellow), at(0.25));
        const R = rng(41), bits = []; for (let i = 0; i < 24; i++) bits.push(label(g, "0", 160 + i * 57, 600, 52, C.red));
        U.push((t) => { if (!inR(t, B)) return; const k = Math.floor((t - a) * 8); bits.forEach((b, i) => { b.textContent = ((i * 7 + k * 3) % 5 < 2) ? "1" : "0"; }); }); void R; }
      // 42: a repeating, meaningless pattern
      { const { g, B, a, d, at } = bt(42); const p = probe(g, 240, 380, 1, 0); void p;
        pop(checkMark(g, 240, 640, 40), at(0.15)); label(g, "COMMANDS: OK", 240, 740, 44, C.green);
        const pat = "1010 0110 1010 0110 ".repeat(6), rows = [0, 1, 2, 3].map((r) => label(g, "", 1000, 260 + r * 110, 64, r % 2 ? C.white : C.sky));
        U.push((t) => { if (!inR(t, B)) return; const k = Math.floor((t - a) * 6) % 10; rows.forEach((el, r) => (el.textContent = pat.slice(k + r * 5, k + r * 5 + 26))); });
        pop(label(g, "MEANINGLESS", 1000, 720, 80, C.red), at(0.55)); }
      // 43: the flight data system
      { const { g, B, a, d, at } = bt(43);
        ["COMMAND", "FLIGHT DATA", "ATTITUDE"].forEach((n, k) => { const c = chipIcon(g, 180 + k * 480, 260, 360, 220, k === 1 ? C.red : C.navyL); label(g, n, 360 + k * 480, 560, 54, k === 1 ? C.yellow : C.white); if (k === 1) glowPulse(c, B, 6, 0.55, 1); });
        pop(label(g, "PACKAGES THE DATA FOR HOME", CX, 120, 62, C.yellow), at(0.3)); }
      // 44: 22.5 hours each way
      { const { g, B, a, d, at } = bt(44); stars(g, 60, 44);
        earth(g, 150, 420, 90); probe(g, 1520, 420, 0.7, 0);
        E("line", { x1: 260, y1: 380, x2: 1400, y2: 380, stroke: C.mute, "stroke-width": 4, "stroke-dasharray": "4 14" }, g); E("line", { x1: 260, y1: 460, x2: 1400, y2: 460, stroke: C.mute, "stroke-width": 4, "stroke-dasharray": "4 14" }, g);
        pulse(g, 260, 380, 1400, 380, B, at(0.05), at(0.45)); pulse(g, 1400, 460, 260, 460, B, at(0.5), at(0.9), C.sky);
        pop(label(g, "~22.5 HOURS THERE", 830, 320, 54, C.yellow), at(0.1)); pop(label(g, "~22.5 HOURS BACK", 830, 540, 54, C.sky), at(0.5));
        pop(label(g, "~24 BILLION KM", CX, 120, 70, C.white), at(0.02)); }
      // 45 & 46 & 48: memory grid
      const memGrid = (g, x0, y0, cols, rows, cw, ch) => { const cells = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push(E("rect", { x: x0 + c * cw, y: y0 + r * ch, width: cw - 6, height: ch - 6, rx: 4, fill: C.navyL, stroke: C.sky, "stroke-width": 2 }, g)); return cells; };
      { const { g, B, a, d, at } = bt(45);
        const cells = memGrid(g, 260, 180, 20, 8, 58, 58), R = rng(45), v = cells.map(() => R());
        U.push((t) => { if (!inR(t, B)) return; const k = (t - a) * 50; cells.forEach((c, i) => c.setAttribute("fill", i < k ? (v[i] > 0.5 ? C.sky : C.navyL) : C.navyD)); });
        pop(label(g, "A READOUT OF ITS OWN MEMORY", CX, 100, 66, C.yellow), at(0.05)); label(g, "MARCH 2024", CX, 720, 56, C.white); }
      { const { g, B, a, d, at } = bt(46);
        const cells = memGrid(g, 260, 180, 20, 8, 58, 58); const bad = [];
        for (let r = 2; r < 5; r++) for (let c = 11; c < 14; c++) bad.push(cells[r * 20 + c]);
        tl.to(bad, { attr: { fill: C.red, stroke: C.red }, duration: 0.3 }, at(0.3));
        const box = E("rect", { x: 260 + 11 * 58 - 12, y: 180 + 2 * 58 - 12, width: 3 * 58 + 18, height: 3 * 58 + 18, fill: "none", stroke: C.yellow, "stroke-width": 7 }, g); pop(box, at(0.35));
        pop(label(g, "ONE FAILED CHIP", CX, 100, 76, C.red), at(0.3)); pop(label(g, "A SLICE OF CODE: GONE", CX, 720, 60, C.white), at(0.55)); }
      // 47: can't swap a chip: move the code
      { const { g, B, a, d, at } = bt(47); stars(g, 40, 47);
        chipIcon(g, 200, 260, 280, 200, C.red, "CHIP"); pop(crossMark(g, 480, 260, 56), at(0.15)); label(g, "NO REPAIR", 340, 600, 56, C.red);
        const blk = E("g", {}, g); E("rect", { x: -120, y: -60, width: 240, height: 120, rx: 14, fill: C.yellow, stroke: C.ink, "stroke-width": 5 }, blk); label(blk, "CODE", 0, 20, 60, C.navyD, { sw: 0 });
        drift(blk, B, 700, 360, 1300, 360, 0, 1, at(0.4), at(0.8));
        pop(label(g, "MOVE THE CODE", 1100, 600, 80, C.yellow), at(0.5)); }
      // 48: cut into pieces, tucked into free spots
      { const { g, B, a, d, at } = bt(48);
        const cells = memGrid(g, 520, 160, 18, 8, 58, 58), R = rng(48); cells.forEach((c) => c.setAttribute("fill", R() > 0.3 ? C.navyL : C.navyD));
        const spots = [[2, 1], [9, 3], [15, 6], [5, 6]], pcs = spots.map(([c, r], k) => { const e = E("rect", { width: 52, height: 52, rx: 6, fill: C.yellow, stroke: C.ink, "stroke-width": 3 }, g); return { e, x1: 520 + c * 58, y1: 160 + r * 58, k }; });
        E("rect", { x: 100, y: 300, width: 260, height: 120, rx: 14, fill: "none", stroke: C.yellow, "stroke-width": 4, "stroke-dasharray": "8 8" }, g); label(g, "CODE", 230, 380, 54, C.yellow);
        U.push((t) => { if (!inR(t, B)) return; pcs.forEach((p) => { const u = ease(clamp((t - at(0.1 + p.k * 0.12)) / 0.8)); p.e.setAttribute("x", lerp(110 + p.k * 60, p.x1, u)); p.e.setAttribute("y", lerp(334, p.y1, u)); }); });
        const links = draw(P(g, spots.map(([c, r], k) => (k ? "L" : "M") + (546 + c * 58) + "," + (186 + r * 58)).join(" "), C.white, 4, { "stroke-dasharray": "6 8" }), at(0.7), 0.6);
        pop(label(g, "SPLIT, MOVED, RE-LINKED", 1040, 720, 62, C.yellow), at(0.65)); void links; }
      // 49: patch sent, wait
      { const { g, B, a, d, at } = bt(49); stars(g, 60, 49);
        dish(g, 220, 470, 0.9); probe(g, 1500, 400, 0.7);
        lightLink(g, 380, 1380, 330, B, at(0.1), at(0.8));
        pop(label(g, "APRIL 18, 2024: PATCH SENT", CX, 110, 64, C.yellow), at(0.05));
        counter(g, CX, 640, B, at(0.2), at(0.9), (u) => "WAITING " + Math.round(u * 45) + " H", 80, C.white); }
      // 50: answer came back
      { const { g, B, a, d, at } = bt(50); stars(g, 60, 50);
        dish(g, 220, 470, 0.9); probe(g, 1500, 400, 0.7);
        E("line", { x1: 380, y1: 330, x2: 1380, y2: 330, stroke: C.mute, "stroke-width": 4, "stroke-dasharray": "4 14" }, g); pulse(g, 1380, 330, 380, 330, B, at(0.05), at(0.4), C.green);
        pop(checkMark(g, CX, 470, 90), at(0.42));
        pop(label(g, "APRIL 20, 2024", CX, 110, 72, C.yellow), at(0.05)); pop(label(g, "READABLE DATA AGAIN", CX, 670, 68, C.green), at(0.5)); }
      // 51: science back
      { const { g, B, a, d, at } = bt(51);
        ["PLASMA WAVES", "MAGNETIC FIELD", "PARTICLES", "COSMIC RAYS"].forEach((n, k) => { const x = 240 + k * 400; E("rect", { x: x - 170, y: 220, width: 340, height: 220, rx: 18, fill: C.navyL, stroke: C.white, "stroke-width": 5 }, g); label(g, n, x, 520, 44, C.white); pop(checkMark(g, x, 330, 60), at(0.15 + 0.12 * k)); });
        pop(label(g, "BY JUNE: SCIENCE IS BACK", CX, 110, 70, C.yellow), at(0.05)); pop(label(g, "REWIRED BY REMOTE CONTROL", CX, 680, 64, C.green), at(0.7)); }
      // 52: chapter 6: a whisper
      { const { g, B, a, d, at } = bt(52); chapter(g, a, 6, "THE LISTENERS");
        const p = probe(g, 500, 470, 1, 0); void p; bulb(g, 1200, 520, 1.3);
        pop(label(g, "=", CX + 20, 520, 120, C.white), at(0.4)); pop(label(g, "TRANSMITTER", 500, 720, 54, C.white), at(0.35)); pop(label(g, "FRIDGE LIGHT BULB", 1200, 720, 54, C.yellow), at(0.5)); }
      // 53: the signal fades
      { const { g, B, a, d, at } = bt(53); stars(g, 40, 53);
        const wv = P(g, "", C.yellow, 8);
        U.push((t) => { if (!inR(t, B)) return; let dd = ""; for (let x = 120; x <= 1560; x += 6) { const amp = 150 * Math.exp(-(x - 120) / 260); dd += (dd ? " L" : "M") + x + "," + (380 + amp * Math.sin((x - 120) / 40 - (t - a) * 6)).toFixed(1); } wv.setAttribute("d", dd); });
        label(g, "VOYAGER", 160, 640, 50, C.white); label(g, "EARTH", 1520, 640, 50, C.sky);
        pop(label(g, "1/10 OF A BILLIONTH", CX, 90, 64, C.yellow), at(0.3)); pop(label(g, "OF A TRILLIONTH OF A WATT", CX, 170, 64, C.yellow), at(0.4)); }
      // 54: three sites round the globe
      { const { g, B, a, d, at } = bt(54);
        const gx = CX, gy = 420, r = 270; E("circle", { cx: gx, cy: gy, r, fill: "#2D4BB3", stroke: C.white, "stroke-width": 6 }, g);
        E("ellipse", { cx: gx, cy: gy, rx: r, ry: 60, fill: "none", stroke: C.sky, "stroke-width": 3, opacity: 0.6 }, g);
        const spin3 = E("g", {}, g); [0, 1, 2].forEach((k) => { const an = (k / 3) * TAU - Math.PI / 2; E("circle", { cx: gx + r * Math.cos(an), cy: gy + r * Math.sin(an), r: 22, fill: C.yellow, stroke: C.ink, "stroke-width": 4 }, spin3); E("line", { x1: gx + r * Math.cos(an), y1: gy + r * Math.sin(an), x2: gx + (r + 90) * Math.cos(an), y2: gy + (r + 90) * Math.sin(an), stroke: C.yellow, "stroke-width": 5, "stroke-dasharray": "6 8" }, spin3); });
        spin(spin3, B, gx, gy, 12);
        [["CALIFORNIA", 300, 250], ["SPAIN", 1380, 250], ["AUSTRALIA", 1380, 620]].forEach(([n, x, y], k) => pop(label(g, n, x, y, 60, C.yellow), at(0.25 + k * 0.15)));
        pop(label(g, "DEEP SPACE NETWORK", 300, 620, 54, C.white), at(0.05)); }
      // 55: 70 meter dish, cooled receiver
      { const { g, B, a, d, at } = bt(55);
        dish(g, 620, 430, 1.8);
        E("line", { x1: 350, y1: 230, x2: 890, y2: 230, stroke: C.yellow, "stroke-width": 5 }, g); label(g, "70 METERS", 620, 200, 70, C.yellow);
        const sn = E("g", {}, g); [0, 1, 2].forEach((k) => E("line", { x1: 1300 - 70 * Math.cos(k * Math.PI / 3), y1: 400 - 70 * Math.sin(k * Math.PI / 3), x2: 1300 + 70 * Math.cos(k * Math.PI / 3), y2: 400 + 70 * Math.sin(k * Math.PI / 3), stroke: C.sky, "stroke-width": 12, "stroke-linecap": "round" }, sn));
        pop(sn, at(0.45)); spin(sn, B, 1300, 400, 30);
        pop(label(g, "RECEIVERS COOLED", 1300, 560, 58, C.sky), at(0.5)); pop(label(g, "LESS NOISE", 1300, 640, 54, C.white), at(0.6)); }
      // 56: signal from noise
      { const { g, B, a, d, at } = bt(56);
        const nz = P(g, "", C.mute, 4), sg = P(g, "", C.yellow, 8), R = rng(56), nv = Array.from({ length: 300 }, () => R() - 0.5);
        U.push((t) => { if (!inR(t, B)) return; const u = clamp((t - at(0.2)) / (d * 0.6)), sh = Math.floor((t - a) * 30); let dn = "", ds = "";
          for (let i = 0; i < 240; i++) { const x = 120 + i * 6, n = nv[(i + sh) % 300]; dn += (i ? " L" : "M") + x + "," + (380 + n * 300 * (1 - 0.7 * u)).toFixed(1); ds += (i ? " L" : "M") + x + "," + (380 + 120 * Math.sin(i / 8 - (t - a) * 4)).toFixed(1); }
          nz.setAttribute("d", dn); sg.setAttribute("d", ds); sg.setAttribute("opacity", u); });
        pop(label(g, "VOYAGER'S VOICE", CX, 100, 70, C.yellow), at(0.5)); label(g, "THE HISS OF THE UNIVERSE", CX, 720, 56, C.mute); }
      // 57: chapter 7: the last signal, gauge falling
      { const { g, B, a, d, at } = bt(57); chapter(g, a, 7, "THE LAST SIGNAL");
        E("path", { d: arcP(CX, 640, 280, Math.PI, TAU), fill: "none", stroke: C.navyL, "stroke-width": 40 }, g);
        E("path", { d: arcP(CX, 640, 280, Math.PI, Math.PI * 1.2), fill: "none", stroke: C.red, "stroke-width": 40 }, g);
        const nd = E("line", { x1: CX, y1: 640, x2: CX, y2: 400, stroke: C.white, "stroke-width": 12, "stroke-linecap": "round" }, g); E("circle", { cx: CX, cy: 640, r: 24, fill: C.white }, g);
        U.push((t) => { if (!inR(t, B)) return; const u = ease(clamp((t - at(0.2)) / (d * 0.7))); nd.setAttribute("transform", `rotate(${lerp(30, -55, u)} ${CX} 640)`); });
        label(g, "POWER", CX + 420, 620, 54, C.white); }
      // 58: the Big Bang
      { const { g, B, a, d, at } = bt(58);
        const sws = []; for (let k = 0; k < 8; k++) sws.push(toggle(g, 260 + (k % 4) * 200, 300 + Math.floor(k / 4) * 140, true));
        U.push((t) => { if (!inR(t, B)) return; sws.forEach((s, k) => s.set(k % 2 ? t > at(0.4) : t < at(0.4))); });
        slam(label(g, "\"THE BIG BANG\"", 560, 120, 90, C.yellow), at(0.05)); pop(label(g, "ALL AT ONCE", 560, 640, 60, C.white), at(0.4));
        counter(g, 1310, 420, B, at(0.5), at(0.85), (u) => "+" + Math.round(u * 10) + " W", 150, C.green);
        pop(label(g, "VOYAGER 2, 2026", 1310, 520, 50, C.white), at(0.55)); pop(label(g, "VOYAGER 1 IS NEXT", 1310, 640, 56, C.yellow), at(0.75)); }
      // 59: until about 2036
      { const { g, B, a, d, at } = bt(59);
        E("line", { x1: 160, y1: 420, x2: 1520, y2: 420, stroke: C.white, "stroke-width": 6 }, g);
        [[160, "2026"], [840, "2030s"], [1360, "~2036"]].forEach(([x, s], k) => { E("circle", { cx: x, cy: 420, r: 16, fill: k === 2 ? C.red : C.white }, g); label(g, s, x, 510, 56, k === 2 ? C.yellow : C.white); });
        const mk = probe(g, 0, 0, 0.35); drift(mk, B, 160, 340, 1360, 340, 0, 0.35, at(0.1), at(0.8));
        pop(label(g, "WITHIN REACH UNTIL ABOUT 2036?", CX, 140, 64, C.yellow), at(0.2)); pop(label(g, "IF THE POWER HOLDS", CX, 680, 56, C.white), at(0.55)); }
      // 60: not enough power: silence
      { const { g, B, a, d, at } = bt(60); stars(g, 70, 60);
        const p = probe(g, 400, 420, 1.2, 0); void p;
        const rg = [0, 1, 2].map(() => E("circle", { cx: 400, cy: 360, r: 0, fill: "none", stroke: C.yellow, "stroke-width": 6, opacity: 0 }, g));
        U.push((t) => { if (!inR(t, B)) return; const live = clamp(1 - (t - at(0.3)) / (d * 0.3)); rg.forEach((c, k) => { const f = (((t - a) * 0.8 + k / 3) % 1); c.setAttribute("r", 150 + f * 350); c.setAttribute("opacity", live * 0.8 * (1 - f)); }); });
        pop(label(g, "THE LAST SIGNAL", 1180, 330, 80, C.yellow), at(0.2)); pop(label(g, "...THEN SILENCE", 1180, 470, 80, C.white), at(0.6)); }
      // 61: the golden record
      { const { g, B, a, d, at } = bt(61); stars(g, 60, 61);
        const rc = record(E("g", {}, g), 1100, 400, 280); spin(rc.parentNode, B, 1100, 400, 20);
        const p = probe(g, 340, 420, 1.1); drift(p, B, 300, 430, 380, 410, 0, 1.1);
        pop(label(g, "GOLD-PLATED COPPER RECORD", 900, 90, 60, C.yellow), at(0.3)); }
      // 62: what's on it
      { const { g, B, a, d, at } = bt(62);
        const rc = E("g", {}, g); record(rc, 360, 420, 260); spin(rc, B, 360, 420, 25);
        [["55", "LANGUAGES OF GREETING"], ["SOUNDS", "OF EARTH"], ["90 MIN", "OF MUSIC"]].forEach(([n, s], k) => { pop(label(g, n, 780, 230 + k * 210, 96, C.yellow, { anchor: "start" }), at(0.1 + k * 0.22)); pop(label(g, s, 1100 + (k ? 0 : 0), 230 + k * 210 + 66, 44, C.white, { anchor: "start" }), at(0.15 + k * 0.22)); }); }
      // 63: 40,000 years, 1.7 light-years from another star
      { const { g, B, a, d, at } = bt(63); stars(g, 120, 63);
        sun(g, 1450, 380, 40); const p = probe(g, 0, 0, 0.5); drift(p, B, 200, 600, 1150, 420, -15, 0.5);
        P(g, "M200,600 L1150,420", C.mute, 4, { "stroke-dasharray": "4 14" });
        counter(g, 560, 160, B, at(0.05), at(0.7), (u) => "~" + comma(u * 40000) + " YEARS", 84, C.yellow);
        pop(label(g, "~1.7 LIGHT-YEARS FROM A STAR", 1100, 680, 58, C.white), at(0.6)); }
      // 64: the milestone: one light-day
      { const { g, B, a, d, at } = bt(64); stars(g, 90, 64);
        earth(g, 140, 420, 80); probe(g, 1540, 420, 0.6);
        E("line", { x1: 230, y1: 420, x2: 1420, y2: 420, stroke: C.yellow, "stroke-width": 5 }, g);
        pulse(g, 230, 420, 1420, 420, B, at(0.1), at(0.9));
        slam(label(g, "ONE LIGHT-DAY", CX, 230, 130, C.yellow), at(0.05));
        counter(g, CX, 560, B, at(0.1), at(0.9), (u) => "TODAY + " + Math.round(u * 24) + " H", 80, C.white);
        pop(label(g, "~25.9 BILLION KM", CX, 690, 58, C.sky), at(0.4)); }
      // 65: 49 years vs one day
      { const { g, B, a, d, at } = bt(65);
        label(g, "VOYAGER", 240, 300, 60, C.white); label(g, "LIGHT", 240, 520, 60, C.yellow);
        const vb = E("rect", { x: 420, y: 240, width: 0, height: 90, rx: 10, fill: C.white }, g), lb = E("rect", { x: 420, y: 460, width: 0, height: 90, rx: 10, fill: C.yellow }, g);
        tl.fromTo(vb, { attr: { width: 0 } }, { attr: { width: 1100 }, duration: d * 0.6, ease: "none" }, at(0.05));
        tl.fromTo(lb, { attr: { width: 0 } }, { attr: { width: 1100 }, duration: 0.25, ease: "power2.in" }, at(0.05));
        pop(label(g, "~49 YEARS", 970, 200, 60, C.white), at(0.55)); pop(label(g, "1 DAY", 970, 640, 60, C.yellow), at(0.2));
        pop(label(g, "THAT IS HOW BIG THE DARK IS", CX, 740, 60, C.sky), at(0.7)); }
      // 66: still listening
      { const { g, B, a, d, at } = bt(66); stars(g, 160, 66);
        const p = probe(g, 0, 0, 0.6); drift(p, B, 700, 420, 1000, 380, -10, 0.6);
        const rg = E("circle", { cx: 0, cy: 0, r: 0, fill: "none", stroke: C.yellow, "stroke-width": 4 }, g);
        U.push((t) => { if (!inR(t, B)) return; const f = ((t - a) * 0.6) % 1, u = ease(clamp((t - a) / d)); rg.setAttribute("cx", lerp(700, 1000, u)); rg.setAttribute("cy", lerp(420, 380, u) - 30); rg.setAttribute("r", 60 + f * 200); rg.setAttribute("opacity", 0.8 * (1 - f)); });
        pop(label(g, "STILL LISTENING", CX, 150, 100, C.white), at(0.2)); pop(label(g, "ONE LIGHT-DAY FROM HOME", CX, 700, 64, C.yellow), at(0.55)); }
