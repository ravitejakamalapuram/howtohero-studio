#!/usr/bin/env python3
"""Record an episode's Telugu lines with an expressive storyteller voice (Gemini speech).

Usage: voice_gemini.py EPISODE_DIR [MODEL] [VOICE]
Reads script.json ([{id, te, mood}]) and writes wav/<id>.wav. "mood" is a short acting note
for that line ("hushed, vast emptiness"). One request per line; a line that already has a
wav is skipped, so a run that stops at the daily limit can be continued later.
The free tier allows 10 requests a day for each model, so use ONE model for a whole
episode (the voice differs a little between models) and do not waste takes.
The key comes from GEMINI_API_KEY (the cloud session's proxy adds it by itself).
"""
import base64, json, os, subprocess, sys, time

API = 'https://generativelanguage.googleapis.com/v1beta/models/'
STYLE = ("Narrate this Telugu line like a warm, wise Indian storyteller telling an ancient epic: natural human "
         "delivery, a steady storytelling pace (not slow), real feeling, short natural pauses between sentences. "
         "Mood of this line: {mood}. Speak only the Telugu text, once.\n\n{text}")

def take(l, out, model, voice):
    body = {"contents": [{"parts": [{"text": STYLE.format(mood=l.get('mood', 'calm wonder'), text=l['te'])}]}],
            "generationConfig": {"responseModalities": ["AUDIO"],
                                 "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}}}
    open('/tmp/anaadi_req.json', 'w').write(json.dumps(body))
    d = json.loads(subprocess.run(['curl', '-sS', '-X', 'POST', f'{API}{model}:generateContent', '-H',
                   'x-goog-api-key: ' + os.environ.get('GEMINI_API_KEY', 'from-proxy'), '-H', 'Content-Type: application/json',
                   '-d', '@/tmp/anaadi_req.json'], capture_output=True, text=True).stdout)
    if 'error' in d: sys.exit(f"line {l['id']}: {model} refused ({d['error'].get('code')}): daily limit, continue after the reset or with another model")
    try: p = d['candidates'][0]['content']['parts'][0]['inlineData']
    except (KeyError, IndexError): return None
    open(out + '.bin', 'wb').write(base64.b64decode(p['data']))
    pre = [] if 'wav' in p.get('mimeType', '') else ['-f', 's16le', '-ar', '24000', '-ac', '1']
    subprocess.run(['ffmpeg', '-v', 'error', '-y'] + pre + ['-i', out + '.bin', '-af',
                    'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,loudnorm=I=-18:TP=-2',
                    '-ar', '48000', '-ac', '1', out], check=True)
    os.remove(out + '.bin')
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out],
                                capture_output=True, text=True).stdout)

def main(ep, model='gemini-3.8-flash-tts', voice='Charon'):
    os.makedirs(ep + '/wav', exist_ok=True)
    for l in json.load(open(ep + '/script.json')):
        out = f"{ep}/wav/{l['id']}.wav"
        if os.path.exists(out): print(l['id'], 'kept'); continue
        limit = 3 + len(l['te']) * 0.17
        for n in range(2):                       # one retake at most: takes are scarce
            d = take(l, out, model, voice); time.sleep(8)
            if d and d <= limit: break
            if os.path.exists(out): os.remove(out)
        else: sys.exit(f"line {l['id']}: two bad takes (too long or no audio)")
        print(l['id'], round(d, 2), 's')

if __name__ == '__main__':
    main(*sys.argv[1:4])
