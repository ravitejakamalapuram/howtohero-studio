      // ===== hook headline, mascot card, captions, progress bar =====
      {
        const H = CFG.hook, N = BT.length, hs = H.size, hy = 585;
        const hg = E("g", {});
        H.lines.forEach((ln, i) => {
          const y = hy + i * Math.round(hs * 1.13), w = tw(ln, hs, H.track), el = E("text", { x: SAFE.cx, y, "font-size": hs, "font-family": "Anton", "text-anchor": "middle", stroke: C.ink, "stroke-width": hs * 0.09, "paint-order": "stroke", "stroke-linejoin": "round", "letter-spacing": H.track || 0, fill: C.white }, hg);
          const k = i === H.yellowLine ? ln.indexOf(H.yellow) : -1;
          if (k < 0) el.textContent = ln; else {
            E("tspan", {}, el, ln.slice(0, k)); E("tspan", { fill: C.yellow }, el, H.yellow); E("tspan", {}, el, ln.slice(k + H.yellow.length));
          }
          void w;
          // no entry animation: the headline is fully visible at t=0 (cover frame); a scale settle would push wide lines past x 60..940
        });
        // topic label above the hook: names the subject from frame 0 even when the hook is a teaser
        if (CFG.topic) { let ts = 56; while (ts > 40 && tw(CFG.topic, ts) > 868) ts -= 2; T(hg, CFG.topic, SAFE.cx, hy - Math.round(hs * 1.06), ts, C.yellow); }
        fadeOut(hg, BT[1].a - 0.35, 0.3);
        // mascot card
        const g = beat(N - 1), a = BT[N - 1].a;
        mascot(g, 440, 560, 1.35, a + 0.2);
        const cl = CFG.card.lines;
        cl.forEach((ln, i) => { const t = T(g, ln, 440, 650 + i * 84, CFG.card.size || 72, i === cl.length - 1 ? C.yellow : C.white); pop(t, a + 0.2 + i * 0.28); });
        // captions: at most 2 lines, 62px, centred on y 1250..1450
        const CS = 62, MAXW = 840, capG = E("g", {});
        function pages(text) {
          const words = text.toUpperCase().split(/\s+/).filter(Boolean), lines = []; let cur = "";
          for (const w of words) { const t = cur ? cur + " " + w : w; if (cur && tw(t, CS) > MAXW) { lines.push(cur); cur = w; } else cur = t; }
          if (cur) lines.push(cur);
          const out = []; for (let i = 0; i < lines.length; i += 2) out.push(lines.slice(i, i + 2));
          return out;
        }
        L.forEach((ln, li) => {
          if (li === L.length - 1) return;
          const pg = pages(ln.cap), wts = pg.map((p) => p.join(" ").length), tot = wts.reduce((a, b) => a + b, 0);
          let t = ln.start - 0.02; const span = ln.dur + 0.18;
          pg.forEach((p, pi) => {
            const t0 = t, t1 = t + (wts[pi] / tot) * span; t = t1;
            const gg = E("g", {}, capG);
            p.forEach((s, k) => T(gg, s, SAFE.cx, p.length === 1 ? 1357 : 1320 + k * 74, CS, C.white, { sw: 11 }));
            gsap.set(gg, { visibility: "hidden" });
            tl.set(gg, { visibility: "visible" }, t0); tl.set(gg, { visibility: "hidden" }, t1);
            tl.fromTo(gg, { opacity: 0 }, { opacity: 1, duration: 0.12 }, t0);
          });
        });
        // progress bar: very bottom edge
        E("rect", { x: 0, y: 1906, width: 1080, height: 10, fill: C.navyD, opacity: 0.7 });
        const bar = E("rect", { x: 0, y: 1906, width: 0, height: 10, fill: C.yellow });
        tl.fromTo(bar, { attr: { width: 0 } }, { attr: { width: 1080 }, duration: CFG.end, ease: "none" }, 0);
      }
      tl.to({ set t(v) { for (const f of U) f(v); }, get t() { return 0; } }, { t: CFG.end, duration: CFG.end, ease: "none" }, 0);
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = tl;
      tl.seek(0);
