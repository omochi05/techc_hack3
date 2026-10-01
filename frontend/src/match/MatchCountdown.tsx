import { useEffect, useRef, useState } from "react";

type MatchCountdownProps = {
  /** カウントの開始数値(デフォルト: 3) */
  from?: number;
  /** 「READY?」の上に出す小見出し(デフォルト: "ROUND 1") */
  roundLabel?: string;
  /** 効果音を鳴らすか(デフォルト: true) */
  sound?: boolean;
  /** 「FIGHT!」表示が終わったタイミングで呼ばれる */
  onComplete: () => void;
};

type CountdownStep =
  | { kind: "ready" }
  | { kind: "count"; value: number }
  | { kind: "fight" };

const READY_DURATION = 900;
const COUNT_DURATION = 1000;
const FIGHT_DURATION = 900;

function buildSteps(from: number): CountdownStep[] {
  const counts: CountdownStep[] = Array.from(
    { length: from },
    (_, index) => ({ kind: "count", value: from - index }),
  );

  return [{ kind: "ready" }, ...counts, { kind: "fight" }];
}

function stepDuration(step: CountdownStep): number {
  switch (step.kind) {
    case "ready":
      return READY_DURATION;
    case "count":
      return COUNT_DURATION;
    case "fight":
      return FIGHT_DURATION;
  }
}

/**
 * Web Audio API で短いビープ音を鳴らす。
 * 音声ファイル不要。ブラウザの自動再生制限で鳴らない場合は黙って無視する。
 */
function playBeep(
  audioContext: AudioContext | null,
  frequency: number,
  duration: number,
): void {
  if (audioContext === null) {
    return;
  }

  try {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;

    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(frequency, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  } catch {
    // 効果音は演出のみなので失敗しても試合進行には影響させない
  }
}

export default function MatchCountdown({
  from = 3,
  roundLabel = "ROUND 1",
  sound = true,
  onComplete,
}: MatchCountdownProps) {
  const [steps] = useState(() => buildSteps(from));
  const [stepIndex, setStepIndex] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // AudioContext の生成・破棄
  useEffect(() => {
    if (!sound || typeof window.AudioContext === "undefined") {
      return;
    }

    const context = new window.AudioContext();
    audioContextRef.current = context;

    return () => {
      audioContextRef.current = null;
      void context.close();
    };
  }, [sound]);

  const currentStep = steps[stepIndex];

  // ステップごとの効果音と次ステップへの遷移
  useEffect(() => {
    if (currentStep === undefined) {
      return;
    }

    if (currentStep.kind === "count") {
      playBeep(audioContextRef.current, 660, 0.18);
    } else if (currentStep.kind === "fight") {
      playBeep(audioContextRef.current, 1320, 0.6);
    }

    const timer = window.setTimeout(() => {
      if (stepIndex >= steps.length - 1) {
        onCompleteRef.current();
        return;
      }

      setStepIndex((current) => current + 1);
    }, stepDuration(currentStep));

    return () => {
      window.clearTimeout(timer);
    };
  }, [currentStep, stepIndex, steps.length]);

  if (currentStep === undefined) {
    return null;
  }

  const label =
    currentStep.kind === "ready"
      ? "READY?"
      : currentStep.kind === "fight"
        ? "FIGHT!"
        : String(currentStep.value);

  return (
    <div
      className={`match-countdown match-countdown--${currentStep.kind}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="match-countdown__flash" key={`flash-${stepIndex}`} />

      <div className="match-countdown__inner">
        {currentStep.kind === "ready" && (
          <p className="match-countdown__sub">{roundLabel}</p>
        )}

        {/* key を変えることで毎ステップ CSS アニメーションを再生し直す */}
        <p className="match-countdown__label" key={stepIndex}>
          {label}
        </p>

        {currentStep.kind === "count" && (
          <div
            className="match-countdown__ring"
            key={`ring-${stepIndex}`}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}
