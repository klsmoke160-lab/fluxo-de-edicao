#!/usr/bin/env python3
"""Turno da Noite: vozes, tempos e áudio de um episódio.

  python3 montar.py ep01 vozes   -> gera as falas (Piper) e saida/ep01/timeline.json
  node render.cjs ep01 video     -> saida/ep01/video.mp4 (sem áudio)
  python3 montar.py ep01 audio   -> mixa vozes, efeitos e ambiente; grava em entregas/
"""
import hashlib, json, os, subprocess, sys

RAIZ = os.path.dirname(os.path.abspath(__file__))
FPS = 30
SR = 44100
VERSAO = "v03"

# Voz de cada personagem: modelo do Piper, ritmo (maior = mais devagar), tom (maior = mais agudo).
VOZES = {
    # Davi (19 anos): a voz mais expressiva das três e um pouco mais aguda
    "davi":  dict(modelo="pt_BR-cadu-medium",  ritmo=0.97, tom=1.10, telefone=False),
    # Seu Osmar (dono, mais velho, calmo): vai pelo telefone
    "osmar": dict(modelo="pt_BR-jeff-medium",  ritmo=1.08, tom=0.94, telefone=True),
    # Seu Jair (taxista, mais velho): mais grave
    "jair":  dict(modelo="pt_BR-faber-medium", ritmo=1.04, tom=0.88, telefone=False),
}
ALVO_VOZ_DB = -19.0  # volume médio de cada fala

# Emoção de cada fala: desloca o tom (semitons), amplia a entonação (1 = como veio), muda o ritmo
# (maior = mais devagar) e o volume (dB). Aplicado com o Praat, antes do filtro de personagem.
EMOCOES = {
    "normal":  dict(tom=0.0,  contorno=1.25, ritmo=1.00, db=0.0),
    "leve":    dict(tom=0.5,  contorno=1.40, ritmo=0.98, db=0.0),   # brincando, à vontade
    "cansado": dict(tom=-1.0, contorno=1.00, ritmo=1.08, db=-1.5),
    "intriga": dict(tom=1.0,  contorno=1.40, ritmo=1.00, db=0.0),   # estranhando
    "alegre":  dict(tom=1.5,  contorno=1.45, ritmo=0.96, db=0.5),   # simpatia forçada
    "tenso":   dict(tom=-1.0, contorno=1.10, ritmo=1.10, db=-1.5),  # baixo, devagar, contido
    "medo":    dict(tom=1.5,  contorno=1.30, ritmo=0.95, db=0.0),
    "susto":   dict(tom=2.5,  contorno=1.45, ritmo=0.90, db=2.0),
    "calmo":   dict(tom=0.0,  contorno=1.10, ritmo=1.04, db=-0.5),
}

# Efeitos sonoros sintetizados (expressões do aevalsrc do FFmpeg): nome -> (expressão, duração, filtro extra)
SFX = {
    "bip":      ("0.45*sin(2*PI*1318*t)*lt(t,0.1)", 0.14, None),
    "notif":    ("0.3*sin(2*PI*880*t)*lt(t,0.09)+0.3*sin(2*PI*1320*t)*gte(t,0.09)*exp(-12*(t-0.09))", 0.45, None),
    "sino":     ("0.4*sin(2*PI*1568*t)*exp(-4*t)+0.4*sin(2*PI*1245*max(t-0.28,0))*exp(-4*max(t-0.28,0))*gte(t,0.28)", 1.4, None),
    "ding":     ("0.5*sin(2*PI*2093*t)*exp(-3*t)+0.25*sin(2*PI*4186*t)*exp(-5*t)+0.12*sin(2*PI*6270*t)*exp(-8*t)", 2.4, None),
    "impacto":  ("0.5*sin(2*PI*(38+50*exp(-6*t))*t)*exp(-2.2*t)+0.2*(random(0)*2-1)*exp(-9*t)", 2.4, "lowpass=f=900"),
    "estatica": ("0.3*(random(0)*2-1)", 0.18, "highpass=f=1500"),
    "chiado":   ("0.2*(random(0)*2-1)*min(1,t/2.5)", 4.5, "highpass=f=900,lowpass=f=5000"),
    "passos":   ("0.42*sin(2*PI*85*mod(t,0.5))*exp(-38*mod(t,0.5))+0.1*(random(0)*2-1)*exp(-60*mod(t,0.5))", 3.0, "lowpass=f=1200"),
    "passos_rapidos": ("0.42*sin(2*PI*85*mod(t,0.3))*exp(-38*mod(t,0.3))+0.1*(random(0)*2-1)*exp(-60*mod(t,0.3))", 2.4, "lowpass=f=1200"),
    "pisca":    ("0.2*sin(2*PI*100*t)*sgn(sin(2*PI*50*t))*(lt(t,0.08)+between(t,0.22,0.4)+between(t,0.54,0.6)+gte(t,0.85))", 1.3, "lowpass=f=2500"),
    "impressora": ("0.28*(random(0)*2-1)*gt(sin(2*PI*14*t),0)*lt(t,1.6)", 1.7, "bandpass=f=2200:w=1800"),
    "desligado": ("0.25*sin(2*PI*425*t)*lt(mod(t,0.5),0.25)", 1.5, None),
    "apagao":   ("0.8*sin(2*PI*60*t)*exp(-7*t)", 0.9, None),
}


def sh(args, **kw):
    return subprocess.run(args, check=True, capture_output=True, text=True, **kw)


def duracao(arq):
    return float(sh(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", arq]).stdout)


def volume_medio(arq):
    r = subprocess.run(["ffmpeg", "-i", arq, "-af", "volumedetect", "-f", "null", "-"], capture_output=True, text=True)
    for linha in r.stderr.splitlines():
        if "mean_volume" in linha:
            return float(linha.split("mean_volume:")[1].split("dB")[0])
    raise RuntimeError("sem volume: " + arq)


def aplicar_emocao(entrada, saida, emo):
    """Muda tom, entonação e ritmo da fala com o Praat (PSOLA), sem mexer no timbre."""
    import numpy as np, parselmouth
    from parselmouth.praat import call
    snd = parselmouth.Sound(entrada)
    manip = call(snd, "To Manipulation", 0.01, 70, 350)
    pt = call(manip, "Extract pitch tier")
    n = call(pt, "Get number of points")
    if n < 3:
        snd.save(saida, "WAV"); return
    tempos = np.array([call(pt, "Get time from index", i) for i in range(1, n + 1)])
    freqs = np.array([call(pt, "Get value at index", i) for i in range(1, n + 1)])
    med = float(np.median(freqs))
    novo = call("Create PitchTier", "novo", snd.xmin, snd.xmax)
    for t, f in zip(tempos, freqs):
        st = 12 * np.log2(f / med) * emo["contorno"] + emo["tom"]
        call(novo, "Add point", float(t), float(med * 2 ** (st / 12)))
    call([manip, novo], "Replace pitch tier")
    dur = call("Create DurationTier", "dur", snd.xmin, snd.xmax)
    call(dur, "Add point", snd.xmin, emo["ritmo"])
    call(dur, "Add point", snd.xmax, emo["ritmo"])
    call([manip, dur], "Replace duration tier")
    out = call(manip, "Get resynthesis (overlap-add)")
    out.scale_peak(0.95)
    out.save(saida, "WAV")


def gerar_fala(quem, texto, pasta, emo="normal"):
    v = VOZES[quem]
    e = EMOCOES[emo]
    chave = hashlib.sha1(json.dumps([quem, texto, v, emo, e, "p2"], sort_keys=True).encode()).hexdigest()[:12]
    final = os.path.join(pasta, f"{quem}_{chave}.wav")
    if os.path.exists(final):
        return final
    bruto, emocionado, tratado = final + ".bruto.wav", final + ".emo.wav", final + ".tratado.wav"
    modelo = os.path.join(RAIZ, "vozes-modelos", v["modelo"] + ".onnx")
    subprocess.run([sys.executable, "-m", "piper", "-m", modelo, "-f", bruto, "--length-scale", str(v["ritmo"]), "--sentence-silence", "0.28"],
                   input=texto, text=True, check=True, capture_output=True)
    aplicar_emocao(bruto, emocionado, e)
    filtros = [f"asetrate=22050*{v['tom']}", f"aresample={SR}", f"atempo={1 / v['tom']:.5f}"]
    if v["telefone"]:
        filtros += ["highpass=f=380", "lowpass=f=3000", "acompressor=threshold=-22dB:ratio=4"]
    else:
        # voz "no ar" da loja: calor nos graves, presença nas consoantes, compressão leve e uma sala bem curta
        filtros += ["highpass=f=70", "equalizer=f=220:t=q:w=1:g=1.5", "equalizer=f=3200:t=q:w=1:g=2.5",
                    "acompressor=threshold=-24dB:ratio=2.5:attack=8:release=120", "aecho=0.88:0.9:28|55:0.10|0.06"]
    sh(["ffmpeg", "-v", "error", "-y", "-i", emocionado, "-af", ",".join(filtros), "-ac", "1", tratado])
    ganho = ALVO_VOZ_DB + e["db"] - volume_medio(tratado)
    sh(["ffmpeg", "-v", "error", "-y", "-i", tratado, "-af", f"volume={ganho:.2f}dB,alimiter=limit=0.9", "-ac", "1", final])
    for f in (bruto, emocionado, tratado):
        os.remove(f)
    return final


def q(t):
    return round(t * FPS) / FPS


def cmd_vozes(ep):
    dados = json.load(open(os.path.join(RAIZ, "episodios", ep + ".json")))
    pasta = os.path.join(RAIZ, "saida", ep); falas = os.path.join(pasta, "falas")
    os.makedirs(falas, exist_ok=True)
    t, tomadas = 0.0, []
    for i, s in enumerate(dados["tomadas"]):
        voz = None
        dur = s.get("min", 2.5)
        if "fala" in s:
            arq = gerar_fala(s["fala"][0], s["fala"][1], falas, s.get("emo", "normal"))
            dv = duracao(arq)
            pre = s.get("pre", 0.35)
            dur = max(dur, pre + dv + s.get("pos", 0.55))
            voz = dict(ini=round(t + pre, 3), fim=round(t + pre + dv, 3), arq=os.path.relpath(arq, RAIZ), quem=s["fala"][0])
        dur = q(dur)
        tomadas.append(dict(i=i, tipo=s["tipo"], ini=round(t, 4), fim=round(t + dur, 4), voz=voz))
        t += dur
    json.dump(dict(ep=ep, fps=FPS, dur=round(t, 4), tomadas=tomadas), open(os.path.join(pasta, "timeline.json"), "w"), ensure_ascii=False, indent=1)
    print(f"{ep}: {len(tomadas)} tomadas, {t:.1f} s, {sum(1 for x in tomadas if x['voz'])} falas")
    for x in tomadas:
        print(f"  {x['i']:2d} {x['tipo']:13s} {x['ini']:6.2f} -> {x['fim']:6.2f}" + (f"   voz {x['voz']['quem']} {x['voz']['fim'] - x['voz']['ini']:.2f} s" if x["voz"] else ""))


def gerar_sfx(nome):
    pasta = os.path.join(RAIZ, "saida", "sfx"); os.makedirs(pasta, exist_ok=True)
    expr, d, filtro = SFX[nome]
    arq = os.path.join(pasta, nome + "_" + hashlib.sha1(repr(SFX[nome]).encode()).hexdigest()[:8] + ".wav")
    if not os.path.exists(arq):
        af = (filtro + "," if filtro else "") + f"afade=t=out:st={max(0, d - 0.04):.3f}:d=0.04"
        sh(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"aevalsrc='{expr}':d={d}:s={SR}", "-af", af, "-ac", "1", arq])
    return arq


def cmd_audio(ep):
    dados = json.load(open(os.path.join(RAIZ, "episodios", ep + ".json")))
    pasta = os.path.join(RAIZ, "saida", ep)
    tl = json.load(open(os.path.join(pasta, "timeline.json")))
    D = tl["dur"]
    video = os.path.join(pasta, "video.mp4")
    fim_amb = max(0.5, tl["tomadas"][-1]["ini"] - 0.3)  # o ambiente some antes do cartão final
    entradas = ["-i", video,
                # ambiente: ar da loja + zumbido das lâmpadas + um grave que cresce até o fim
                "-f", "lavfi", "-i", f"aevalsrc='0.05*(random(0)*2-1)':d={D}:s={SR}",
                "-f", "lavfi", "-i", f"aevalsrc='0.004*sin(2*PI*120*t)+0.002*sin(2*PI*240*t)+(0.008+0.02*t/{D})*(sin(2*PI*55*t)+sin(2*PI*58.2*t))*(0.75+0.25*sin(2*PI*0.13*t))':d={D}:s={SR}"]
    grafo = [f"[1:a]lowpass=f=420,volume=0.3[ar]", f"[ar][2:a]amix=inputs=2:normalize=0,afade=t=out:st={fim_amb:.2f}:d=1.0[amb]"]
    rotulos, n = ["[amb]"], 3
    for x, s in zip(tl["tomadas"], dados["tomadas"]):
        if x["voz"]:
            entradas += ["-i", os.path.join(RAIZ, x["voz"]["arq"])]
            grafo.append(f"[{n}:a]adelay={int(x['voz']['ini'] * 1000)}:all=1[a{n}]"); rotulos.append(f"[a{n}]"); n += 1
        for e in s.get("sfx", []):
            nome, u = e[0], e[1]
            ganho = e[2] if len(e) > 2 else 0
            quando = (x["fim"] + u) if u < 0 else (x["ini"] + u)
            entradas += ["-i", gerar_sfx(nome)]
            grafo.append(f"[{n}:a]volume={ganho}dB,adelay={int(max(0, quando) * 1000)}:all=1[a{n}]"); rotulos.append(f"[a{n}]"); n += 1
    grafo.append("".join(rotulos) + f"amix=inputs={len(rotulos)}:normalize=0:duration=longest,atrim=0:{D},alimiter=limit=0.9:level=disabled,loudnorm=I=-15:TP=-1.5:LRA=9,aresample={SR}[mix]")
    os.makedirs(os.path.join(RAIZ, "entregas"), exist_ok=True)
    saida = os.path.join(RAIZ, "entregas", f"turno-da-noite_{ep}_{VERSAO}.mp4")
    sh(["ffmpeg", "-v", "error", "-y", *entradas, "-filter_complex", ";".join(grafo), "-map", "0:v", "-map", "[mix]",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", str(D), "-movflags", "+faststart", saida])
    print(saida, f"{duracao(saida):.1f} s")


if __name__ == "__main__":
    ep, cmd = sys.argv[1], sys.argv[2]
    {"vozes": cmd_vozes, "audio": cmd_audio}[cmd](ep)
