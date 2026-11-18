"""One line of speech with a Microsoft Edge voice, as a 24 kHz mono wav. Free, needs the network.
usage: python3 tts_edge.py "<text>" <voice> <out.wav>     exit 1 on any failure (build.mjs then falls back to Kokoro)
Do not pass rate or pitch: with them the service returns no audio for some voices."""
import asyncio, os, ssl, subprocess, sys, tempfile
import edge_tts

CA = "/root/.ccr/ca-bundle.crt"  # the cloud proxy's certificates; elsewhere the default store is used
if os.path.exists(CA): edge_tts.communicate._SSL_CTX = ssl.create_default_context(cafile=CA)

def main(text, voice, out):
    with tempfile.TemporaryDirectory() as d:
        mp3 = os.path.join(d, "a.mp3")
        asyncio.run(edge_tts.Communicate(text, voice).save(mp3))
        if not os.path.exists(mp3) or os.path.getsize(mp3) < 1000: raise SystemExit("no audio came back")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", mp3, "-ar", "24000", "-ac", "1", out], check=True)

if __name__ == "__main__":
    if len(sys.argv) != 4: raise SystemExit(__doc__)
    main(*sys.argv[1:])
