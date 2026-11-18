# Isometric infographic

Blocks with three shades each, set on a raised board and seen from one fixed isometric angle. Good for systems you can lay out on a map: airports, networks, cities, supply chains.

- **Roles (lines and text):** ink is a dark plum, accent navy, warn red, good green, muted warm grey. Good and muted are darker than in the prototype so that words stay readable on the cream paper.
- **Roles (solids):** every role also has a softer fill colour in `FILL`: ink is off-white, accent navy, warn coral, good grass, muted grey, paper sand. A `box` with no role is off-white; a `slab` with no role is grass, and `"role": "paper"` gives bare sand.
- **Solids:** one base colour gives three faces: the top is lighter and warmer, the left is the base, the right is darker and cooler. A thin dark edge is kept from the prototype. Solids grow from the ground with a small overshoot; they never fade in.
- **Backdrop:** a warm gradient with a pale dotted iso grid and light paper grain, painted once in `init`.
- **Shadows:** the board's shadow is blurred, boxes on the ground cast a short flat shadow to the right, and a plane's shadow stays on the ground under it.
- **Line:** even, no wobble. Cables (`link`) are dashed, with yellow packets moving along them, or a red cross when `broken`.
- **Text:** Jost 600 capitals with a paper-coloured halo, so labels read over blocks. `label` fades in whole; `text` is written on.
- **Native kinds:** `box`, `tower`, `dishsite`, `slab`, `link`, `iplane`, `label`, `mk` (flat tint) and `bars` (a row of three-tone columns on a base).
- **Transition:** the scene scales up from 96 % as a beat starts and back in its last 0.35 s.
- **Captions, hook, end card:** left to the brand layer. The prototype's tower-and-plane end card is gone.

Order matters: items are painted in list order, so put the slab first, cables before the blocks that stand on them, and far blocks before near ones.
Porting the prototype colours: `white` is no role, `navy` accent, `red` warn, `grass` good, `grey` muted, `sand` paper. `yel`, `sky` and `purple` have no role; yellow stays for packets and the default highlight, sky for tower cabs.
New compared with the prototype: lattice and grain, the three shadows, darker text greens and greys, native `bars` and `mk`, and sizes that follow the format.

Golden scene: `golden.json` with `golden.scenes.json` (title, process, chart). Build with
`node build.mjs styles/iso-infographic/golden.json --estimate --out <dir>`, then `node render.cjs <dir>/page.json <prefix> --frames 0.5,4.6,9,13.2,18.5,21.5`.

Reference for the look (not copied): upstream `lemo-opuscar/styles/iso-infographic`. The code and this note are our own.
