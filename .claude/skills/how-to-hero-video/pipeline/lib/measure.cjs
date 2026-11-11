// Measures Anton glyph widths (per 100px) in real Chromium so layout code can fit text exactly.
const { chromium } = require("playwright");
const fs = require("node:fs"), path = require("node:path");
(async () => {
  const dir = __dirname;
  const html = `<!doctype html><style>@font-face{font-family:Anton;src:url("file://${dir}/anton.woff2") format("woff2")}</style><body></body>`;
  const b = await chromium.launch(), p = await b.newPage();
  fs.writeFileSync(path.join(dir,"measure.html"),html); await p.goto("file://"+path.join(dir,"measure.html"));
  await p.evaluate(() => document.fonts.load("100px Anton"));
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,:;!?'\"-@+=/()%&";
  const w = await p.evaluate((chars) => { const c = document.createElement("canvas").getContext("2d"); c.font = "100px Anton"; const o = {}; for (const ch of chars) o[ch] = c.measureText(ch).width; o.__ok = document.fonts.check("100px Anton"); o["×"] = c.measureText("×").width; o["₹"] = c.measureText("₹").width; o["✓"] = c.measureText("✓").width; return o; }, chars);
  fs.writeFileSync(path.join(dir, "widths.json"), JSON.stringify(w));
  const tw = (s, size) => [...s].reduce((n, ch) => n + (w[ch] ?? 50), 0) * size / 100;
  console.log("font loaded:", w.__ok, "| times glyph:", w["×"].toFixed(1), "| rupee glyph:", w["₹"].toFixed(1), "| check glyph:", w["✓"].toFixed(1), "(a fallback width of ~50 means the glyph is missing)");
  for (const [s, size] of [["GPS NEVER SENDS ANYTHING.", 90], ["GPS NEVER SENDS", 100], ["ANYTHING. IT ONLY LISTENS.", 90], ["ANYTHING. IT ONLY LISTENS.", 100], ["30,000 INVISIBLE", 100], ["DOTS. ON YOUR FACE.", 100], ["A WALKIE-TALKIE.", 100], ["FOLLOW FOR HOW THINGS WORK,", 76], ["FOLLOW FOR HOW THINGS WORK,", 90]]) console.log(size + "px", Math.round(tw(s, size)) + "px", "(limit 880) |", s);
  await b.close();
})();
