# Sitaram 108 chant-along reel

Code-made 186 s vertical chant-along (own art, own sound; nothing copied from any other video).

1. `python3 audio.py kokoro-v1.0.onnx voices-v1.0.bin out/chant.wav` (pip: kokoro-onnx soundfile; writes `beats.json`)
2. `node render.cjs page.html beats.json out/video.mp4 out/chant.wav 30` (playwright + ffmpeg)

`page.html` draws the counter, a 108-bead mala that lights one bead per chant and a bell flash every 27. Fonts in `fonts/` (Mukta, Ramabhadra). Facebook needs a 90 s cut (27 chants), not made yet.
