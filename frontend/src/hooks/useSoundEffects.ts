import { useCallback, useEffect, useRef } from "react";

import comboSoundUrl from "../assets/sounds/combo.wav";
import guardSoundUrl from "../assets/sounds/guard.wav";
import punchSoundUrl from "../assets/sounds/punch.wav";

/**
 * 効果音の種類。
 * 音そのものは scripts/generate_sound_effects.py で生成している。
 */
export type SoundEffect = "punch" | "combo" | "guard";

const SOUND_SOURCES: Record<SoundEffect, string> = {
  punch: punchSoundUrl,
  combo: comboSoundUrl,
  guard: guardSoundUrl,
};

const SOUND_VOLUMES: Record<SoundEffect, number> = {
  punch: 0.8,
  combo: 0.9,
  guard: 0.8,
};

type UseSoundEffectsResult = {
  playSound: (effect: SoundEffect) => void;
};

export function useSoundEffects(): UseSoundEffectsResult {
  const audioRef = useRef<Partial<Record<SoundEffect, HTMLAudioElement>>>(
    {},
  );

  // 最初の再生で遅れないよう、画面表示時に読み込んでおく
  useEffect(() => {
    const loaded: Partial<Record<SoundEffect, HTMLAudioElement>> = {};

    (Object.keys(SOUND_SOURCES) as SoundEffect[]).forEach((effect) => {
      const audio = new Audio(SOUND_SOURCES[effect]);
      audio.preload = "auto";
      audio.volume = SOUND_VOLUMES[effect];
      audio.load();
      loaded[effect] = audio;
    });

    audioRef.current = loaded;

    return () => {
      Object.values(loaded).forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
      audioRef.current = {};
    };
  }, []);

  const playSound = useCallback((effect: SoundEffect): void => {
    const base = audioRef.current[effect];

    if (base === undefined) {
      return;
    }

    // 連打でも音が途切れないよう、毎回コピーを作って重ねて鳴らす
    const audio = base.cloneNode(true) as HTMLAudioElement;
    audio.volume = base.volume;

    void audio.play().catch((error: unknown) => {
      // 自動再生制限などで鳴らせなくても試合は止めない
      console.warn(`効果音(${effect})を再生できませんでした`, error);
    });
  }, []);

  return { playSound };
}
