from __future__ import annotations

import math
import random
import struct
import wave
from pathlib import Path

SAMPLE_RATE = 44100
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "src" / "assets" / "sounds"


random.seed(53)




def silence(seconds: float) -> list[float]:
    return [0.0] * int(SAMPLE_RATE * seconds)


def mix(base: list[float], layer: list[float], offset_seconds: float = 0.0, gain: float = 1.0) -> list[float]:
    start = int(SAMPLE_RATE * offset_seconds)
    end = start + len(layer)
    if end > len(base):
        base = base + [0.0] * (end - len(base))
    for i, value in enumerate(layer):
        base[start + i] += value * gain
    return base


def low_pass(samples: list[float], amount: float) -> list[float]:
    out: list[float] = []
    previous = 0.0
    for value in samples:
        previous += amount * (value - previous)
        out.append(previous)
    return out


def normalize(samples: list[float], peak: float = 0.9) -> list[float]:
    max_value = max(abs(v) for v in samples) or 1.0
    return [v / max_value * peak for v in samples]


def fade_out(samples: list[float], seconds: float = 0.01) -> list[float]:
    """末尾のプツッというノイズを防ぐための短いフェードアウト。"""
    length = min(len(samples), int(SAMPLE_RATE * seconds))
    for i in range(length):
        samples[len(samples) - length + i] *= 1 - i / length
    return samples


\


def thump(duration: float, start_freq: float, end_freq: float, decay: float) -> list[float]:
    samples: list[float] = []
    phase = 0.0
    total = int(SAMPLE_RATE * duration)
    for i in range(total):
        t = i / SAMPLE_RATE
        freq = end_freq + (start_freq - end_freq) * math.exp(-t * 35)
        phase += 2 * math.pi * freq / SAMPLE_RATE
        envelope = math.exp(-t * decay)
        # 少し歪ませて迫力を出す
        samples.append(math.tanh(math.sin(phase) * 2.2) * envelope)
    return samples


def noise_burst(duration: float, decay: float, brightness: float) -> list[float]:
    total = int(SAMPLE_RATE * duration)
    raw = [random.uniform(-1, 1) * math.exp(-(i / SAMPLE_RATE) * decay) for i in range(total)]
    return low_pass(raw, brightness)


def chime(duration: float, freqs: list[float], decay: float) -> list[float]:
    total = int(SAMPLE_RATE * duration)
    samples: list[float] = []
    for i in range(total):
        t = i / SAMPLE_RATE
        attack = min(1.0, t / 0.005)
        envelope = attack * math.exp(-t * decay)
        value = sum(math.sin(2 * math.pi * f * t) for f in freqs) / len(freqs)
        samples.append(value * envelope)
    return samples



def make_punch() -> list[float]:
    body = thump(0.30, start_freq=180, end_freq=55, decay=14)
    smack = noise_burst(0.08, decay=60, brightness=0.35)
    sound = mix(body, smack, gain=0.9)
    return fade_out(normalize(sound))


def make_combo() -> list[float]:
    sound = silence(0.9)
    hits = [(0.00, 0.55, 200), (0.09, 0.75, 220), (0.18, 1.00, 240)]
    for offset, gain, start_freq in hits:
        hit = mix(
            thump(0.22, start_freq=start_freq, end_freq=60, decay=18),
            noise_burst(0.06, decay=70, brightness=0.45),
            gain=0.9,
        )
        sound = mix(sound, hit, offset_seconds=offset, gain=gain)

    sparkle = chime(0.6, [659.3, 830.6, 987.8, 1318.5], decay=6)
    sound = mix(sound, sparkle, offset_seconds=0.27, gain=0.55)
    return fade_out(normalize(sound))


def make_guard() -> list[float]:
    impact = mix(
        thump(0.12, start_freq=140, end_freq=80, decay=40),
        noise_burst(0.03, decay=120, brightness=0.8),
        gain=0.8,
    )
    ring = chime(0.4, [920.0, 1430.0, 2210.0], decay=12)
    sound = mix(impact, ring, gain=0.6)
    return fade_out(normalize(sound, peak=0.8))



def write_wav(path: Path, samples: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    frames = b"".join(
        struct.pack("<h", int(max(-1.0, min(1.0, v)) * 32767)) for v in samples
    )
    with wave.open(str(path), "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(SAMPLE_RATE)
        wav_file.writeframes(frames)
    print(f"✅ {path.relative_to(OUTPUT_DIR.parent.parent.parent)} ({len(samples) / SAMPLE_RATE:.2f}秒)")


def main() -> None:
    write_wav(OUTPUT_DIR / "punch.wav", make_punch())
    write_wav(OUTPUT_DIR / "combo.wav", make_combo())
    write_wav(OUTPUT_DIR / "guard.wav", make_guard())


if __name__ == "__main__":
    main()
