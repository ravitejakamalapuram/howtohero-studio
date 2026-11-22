import sys,time,json
from TTS.utils.synthesizer import Synthesizer
s=Synthesizer(tts_checkpoint='model/te/fastpitch/best_model.pth',tts_config_path='fp.json',tts_speakers_file='model/te/fastpitch/speakers.pth',vocoder_checkpoint='model/te/hifigan/best_model.pth',vocoder_config='model/te/hifigan/config.json',use_cuda=False)
t=time.time()
for l in json.load(open(sys.argv[1])):
    s.save_wav(s.tts(l['te'],speaker_name=sys.argv[3]),f"{sys.argv[2]}/{l['id']}.wav")
print('synth',time.time()-t)
