import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

// ──────────────────────────────────────────────
// RobotMotion: ボクシングロボの共通アニメーションコンポーネント
//
// 使い方:
//   <RobotMotion mode="relax" />                       // ループ状態を指定
//   <RobotMotion mode="healthy" />                     // 状態:良好
//   <RobotMotion mode="tired" />                       // 状態:要休憩
//   <RobotMotion mode="guard" />                       // ガード
//
//   アクション再生(ref経由):
//   const robot = useRef<RobotMotionHandle>(null);
//   <RobotMotion ref={robot} mode="relax" />
//   robot.current?.play("punch");   // punch | atkCombo | hit | victory | defeat
//
//   ※ mode="guard" 中に play("hit") するとガードリアクションになる
// ──────────────────────────────────────────────

export type Mode = "relax" | "healthy" | "tired" | "guard";
export type ActionName = "punch" | "atkCombo" | "hit" | "victory" | "defeat";
export interface RobotMotionHandle {
  play: (action: ActionName) => void;
}

type EyeType = "normal" | "happy" | "x" | "squint" | "tired" | "blink";
type ArmPose = { shoulder: number; elbow: number; reach: number };
type Pose = {
  rootX: number;
  rootY: number;
  bodyRot: number;
  bodyScaleX: number;
  bodyPulse: number;
  headRot: number;
  headYaw: number;
  headY: number;
  armR: ArmPose;
  armL: ArmPose;
  eyes: EyeType;
  coreGlow: number;
  vibrate: number;
};

// ---------- イージング ----------
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const easeOutQuart = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 4);
const easeInOut = (t: number) => {
  t = clamp(t, 0, 1);
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};
// 減衰振動(被弾の揺り戻し・バネ表現)
const damped = (t: number, amp: number, freq: number, decay: number) =>
  amp * Math.exp(-decay * t) * Math.cos(freq * t);

// ---------- 基本ポーズ ----------
const basePose = (): Pose => ({
  rootX: 0,
  rootY: 0,
  bodyRot: 0,
  bodyScaleX: 1,
  bodyPulse: 1,
  headRot: 0,
  headYaw: 0,
  headY: 0,
  armR: { shoulder: -55, elbow: -70, reach: 1 },
  armL: { shoulder: -55, elbow: -70, reach: 1 },
  eyes: "normal",
  coreGlow: 0.5,
  vibrate: 0,
});

// ---------- ループ状態 ----------

// リラックス待機(ConnectionPage 等)
type SubIdle = { type: "look" | "dip"; start: number } | null;
function poseRelax(t: number, p: Pose, sub: SubIdle): Pose {
  const bob = Math.sin((t * (Math.PI * 2)) / 1.4);
  p.rootY = bob * 5;
  p.bodyRot = bob * 2;
  p.bodyPulse = 1 + Math.sin((t * (Math.PI * 2)) / 3) * 0.015;
  p.coreGlow = 0.45 + Math.sin((t * (Math.PI * 2)) / 3) * 0.2;
  p.armR = { shoulder: 35 + Math.sin(t * 2) * 3, elbow: 15 + Math.sin(t * 2 + 1) * 2, reach: 1 };
  p.armL = { shoulder: 35 + Math.sin(t * 2 + 2.1) * 3, elbow: 15 + Math.sin(t * 2 + 3) * 2, reach: 1 };
  if (sub && sub.type === "look") {
    const st = clamp((t - sub.start) / 1.6, 0, 1);
    p.headYaw = Math.sin(st * Math.PI * 2) * 16;
  }
  if (sub && sub.type === "dip") {
    const st = clamp((t - sub.start) / 0.7, 0, 1);
    p.rootY += damped(st, 14, 9, 4);
  }
  return p;
}

// 健康状態:良好(HealthPage)
function poseHealthy(t: number, p: Pose): Pose {
  const bob = Math.sin((t * (Math.PI * 2)) / 0.9);
  p.rootY = bob * 7;
  p.rootX = Math.sin((t * (Math.PI * 2)) / 1.8) * 4;
  p.bodyRot = bob * 2.5;
  p.bodyPulse = 1 + Math.sin((t * (Math.PI * 2)) / 1.8) * 0.02;
  p.coreGlow = 0.75 + Math.sin((t * (Math.PI * 2)) / 1.2) * 0.25;
  p.armR = { shoulder: -60 + Math.sin(t * 7) * 6, elbow: -75, reach: 1 };
  p.armL = { shoulder: -55 - Math.sin(t * 7) * 6, elbow: -80, reach: 1 };
  const ph = t % 4;
  if (ph > 3.3) {
    const k = (ph - 3.3) / 0.7;
    p.rootY -= Math.abs(Math.sin(k * Math.PI * 2)) * 16;
    p.eyes = "happy";
  }
  return p;
}

// 健康状態:要休憩(HealthPage)
function poseTired(t: number, p: Pose): Pose {
  const bob = Math.sin((t * (Math.PI * 2)) / 2.4);
  p.rootY = 14 + bob * 2;
  p.bodyRot = 6 + bob * 1;
  p.headY = 8;
  p.headRot = 10 + bob * 1.5;
  p.bodyPulse = 1 + Math.sin((t * (Math.PI * 2)) / 4) * 0.008;
  p.coreGlow = 0.18 + Math.max(0, Math.sin(t * 1.4)) * 0.1;
  if (Math.sin(t * 0.9 + 1) > 0.96) p.coreGlow = 0.05;
  p.armR = { shoulder: 60 + Math.sin(t * 1.2) * 2, elbow: 25, reach: 1 };
  p.armL = { shoulder: 62 + Math.sin(t * 1.2 + 1.5) * 2, elbow: 28, reach: 1 };
  p.eyes = "tired";
  const ph = t % 5;
  if (ph > 3.8 && ph < 4.6) {
    const k = easeInOut((ph - 3.8) / 0.8);
    p.rootY -= k * 8;
    p.headRot -= k * 6;
  } else if (ph >= 4.6) {
    p.rootY += damped(ph - 4.6, -8, 12, 6);
    p.headRot += damped(ph - 4.6, -6, 12, 6);
  }
  return p;
}

// ガード(MatchPage)
function poseGuard(t: number, p: Pose, guardHitT: number | null): Pose {
  p.rootY = Math.sin(t * 3) * 1;
  p.vibrate = 1;
  p.headY = 14;
  p.bodyRot = 4;
  p.armR = { shoulder: -78, elbow: -118, reach: 1 };
  p.armL = { shoulder: -70, elbow: -122, reach: 1 };
  p.eyes = "squint";
  p.coreGlow = 0.85;
  if (guardHitT !== null && guardHitT < 0.25) {
    const k = guardHitT < 0.07 ? guardHitT / 0.07 : 1 - easeOutCubic((guardHitT - 0.07) / 0.18);
    p.rootX += -9 * k;
    p.armR.elbow += 14 * k;
    p.armL.elbow += 14 * k;
  }
  return p;
}

// ---------- アクション ----------

// パンチ(0.5秒: 予備0.12 → 打撃0.08 → 戻り0.3)
function posePunch(t: number, p: Pose): Pose {
  if (t < 0.12) {
    const k = easeOutCubic(t / 0.12);
    p.rootX += lerp(0, -12, k);
    p.rootY += lerp(0, 6, k);
    p.bodyRot += lerp(0, -12, k);
    p.armR = { shoulder: lerp(-55, -20, k), elbow: lerp(-70, -120, k), reach: 1 };
  } else if (t < 0.2) {
    const k = easeOutQuart((t - 0.12) / 0.08);
    p.rootX += lerp(-12, 58, k); // 体ごと突っ込む
    p.rootY += lerp(6, -2, k);
    p.bodyRot += lerp(-12, 14, k);
    p.armR = { shoulder: lerp(-20, -2, k), elbow: lerp(-120, 0, k), reach: lerp(1, 1.35, k) };
  } else {
    const k = easeInOut((t - 0.2) / 0.3);
    p.rootX += lerp(58, 0, k);
    p.bodyRot += lerp(14, 0, k);
    p.armR = { shoulder: lerp(-2, -55, k), elbow: lerp(0, -70, k), reach: lerp(1.35, 1, k) };
  }
  return p;
}

// 被弾(0.9秒: インパクト → 起き上がりこぼし式の揺り戻し)
function poseHit(t: number, p: Pose): Pose {
  if (t < 0.06) {
    const k = t / 0.06;
    p.rootX += lerp(0, -38, k);
    p.bodyRot += lerp(0, -24, k);
    p.headRot = lerp(0, -16, k);
  } else {
    const t2 = t - 0.06;
    p.rootX += lerp(-38, 0, easeOutCubic(t2 / 0.84));
    p.bodyRot += damped(t2, -24, 9, 3.2);
    p.headRot = damped(t2 + 0.05, -16, 9, 3.2);
  }
  p.eyes = t < 0.7 ? "x" : "normal";
  p.armR = { shoulder: -30, elbow: -40, reach: 1 };
  p.armL = { shoulder: -30, elbow: -40, reach: 1 };
  return p;
}

// 攻撃コンボ(1.3秒: 右ジャブ → 左オーバーハンド → スピンアッパー)
function poseAttackCombo(t: number, p: Pose): Pose {
  if (t < 0.2) {
    if (t < 0.05) {
      const k = easeOutCubic(t / 0.05);
      p.bodyRot += -6 * k;
      p.armR = { shoulder: lerp(-55, -18, k), elbow: lerp(-70, -110, k), reach: 1 };
    } else if (t < 0.1) {
      const k = easeOutQuart((t - 0.05) / 0.05);
      p.rootX += lerp(0, 24, k);
      p.bodyRot += lerp(-6, 8, k);
      p.armR = { shoulder: lerp(-18, -3, k), elbow: lerp(-110, 0, k), reach: lerp(1, 1.2, k) };
    } else {
      const k = easeInOut((t - 0.1) / 0.1); // 半端戻し=繋ぎ
      p.rootX += lerp(24, 10, k);
      p.armR = { shoulder: lerp(-3, -40, k), elbow: lerp(0, -70, k), reach: lerp(1.2, 1, k) };
    }
  } else if (t < 0.55) {
    const t2 = t - 0.2;
    p.rootX += 10;
    if (t2 < 0.08) {
      const k = easeOutCubic(t2 / 0.08);
      p.bodyRot += lerp(0, -10, k);
      p.rootY += lerp(0, -6, k);
      p.armL = { shoulder: lerp(-50, -110, k), elbow: lerp(-75, -30, k), reach: 1 };
      p.armR = { shoulder: -40, elbow: -70, reach: 1 };
    } else if (t2 < 0.17) {
      const k = easeOutQuart((t2 - 0.08) / 0.09);
      p.rootX += lerp(0, 30, k);
      p.rootY += lerp(-6, 8, k);
      p.bodyRot += lerp(-10, 12, k);
      p.armL = { shoulder: lerp(-110, -185, k), elbow: lerp(-30, -8, k), reach: lerp(1, 1.25, k) };
      p.armR = { shoulder: -40, elbow: -70, reach: 1 };
    } else {
      const k = easeInOut((t2 - 0.17) / 0.18);
      p.rootX += lerp(30, 4, k);
      p.rootY += lerp(8, 0, k);
      p.bodyRot += lerp(12, 0, k);
      p.armL = { shoulder: lerp(-185, -60, k), elbow: lerp(-8, -70, k), reach: lerp(1.25, 1, k) };
      p.armR = { shoulder: -40, elbow: -70, reach: 1 };
    }
  } else {
    const t3 = t - 0.55;
    if (t3 < 0.3) {
      const k = easeInOut(t3 / 0.3);
      p.bodyScaleX = Math.cos(k * Math.PI * 2);
      p.rootX += lerp(4, -14, k);
      p.rootY += Math.sin(k * Math.PI) * 4;
      p.armR = { shoulder: 35, elbow: -125, reach: 1 };
      p.armL = { shoulder: 35, elbow: -125, reach: 1 };
    } else if (t3 < 0.45) {
      const k = easeOutQuart((t3 - 0.3) / 0.15);
      p.rootX += lerp(-14, 45, k);
      p.rootY += lerp(0, -25, k);
      p.bodyRot += lerp(0, 18, k);
      p.armR = { shoulder: lerp(35, -75, k), elbow: lerp(-125, 0, k), reach: lerp(1, 1.35, k) };
      p.armL = { shoulder: 35, elbow: -110, reach: 1 };
    } else {
      const t4 = t3 - 0.45;
      const k = easeInOut(t4 / 0.3);
      p.rootX += lerp(45, 0, k);
      p.rootY += lerp(-25, 0, easeOutCubic(t4 / 0.2)) + damped(t4, 6, 14, 5);
      p.bodyRot += lerp(18, 0, k);
      p.armR = { shoulder: lerp(-75, -55, k), elbow: lerp(0, -70, k), reach: lerp(1.35, 1, k) };
      p.armL = { shoulder: lerp(35, -50, k), elbow: lerp(-110, -75, k), reach: 1 };
    }
  }
  return p;
}

// 勝利(3秒: 溜め → バク宙 → 着地 → ガッツポーズ×2 → 決めポーズ保持)
function poseVictory(t: number, p: Pose): Pose {
  p.eyes = "happy";
  p.bodyPulse = 1 + Math.sin(t * 12) * 0.015;
  p.coreGlow = 0.7 + Math.sin(t * 9) * 0.3;
  if (t < 0.35) {
    const k = easeInOut(t / 0.35);
    p.rootY = lerp(0, 12, k);
    p.armR = { shoulder: lerp(-55, 60, k), elbow: lerp(-70, -20, k), reach: 1 };
    p.armL = { shoulder: lerp(-55, 60, k), elbow: lerp(-70, -20, k), reach: 1 };
    p.headRot = lerp(0, 6, k);
  } else if (t < 1.05) {
    const k = (t - 0.35) / 0.7;
    p.rootY = 12 - Math.sin(k * Math.PI) * 90;
    p.bodyRot = -360 * easeInOut(k); // バク宙(HeadはBodyの子なので一緒に回る)
    p.armR = { shoulder: -30, elbow: -140, reach: 1 };
    p.armL = { shoulder: -30, elbow: -140, reach: 1 };
  } else if (t < 1.35) {
    const t2 = t - 1.05;
    p.rootY = damped(t2, 16, 13, 5.5);
    p.armR = { shoulder: -45, elbow: -80, reach: 1 };
    p.armL = { shoulder: -45, elbow: -80, reach: 1 };
  } else if (t < 2.1) {
    const t2 = t - 1.35;
    const hop = Math.abs(Math.sin((t2 / 0.375) * Math.PI));
    p.rootY = -hop * 20;
    const pump = -110 - hop * 40;
    p.armR = { shoulder: pump, elbow: -15, reach: 1 };
    p.armL = { shoulder: pump, elbow: -15, reach: 1 };
  } else {
    const k = easeOutCubic((t - 2.1) / 0.3);
    p.rootY = Math.sin(t * 3) * 3;
    p.bodyRot = lerp(0, 5, k);
    p.armR = { shoulder: lerp(-150, -158, k), elbow: lerp(-15, -8, k), reach: 1 };
    p.armL = { shoulder: lerp(-150, 55, k), elbow: lerp(-15, -60, k), reach: 1 };
  }
  return p;
}

// 敗北(2.4秒: ショック → 出力低下で2段階に沈む → がっくりうなだれ → 低空ホールド)
// 終了時の姿勢を poseTired とほぼ同じ数値にしてあるので、
// mode="tired" と組み合わせるとモーション終了後がシームレスに繋がる
function poseDefeat(t: number, p: Pose): Pose {
  p.armR = { shoulder: -30, elbow: -40, reach: 1 };
  p.armL = { shoulder: -30, elbow: -40, reach: 1 };
  if (t < 0.25) {
    // ショック:のけぞり
    const k = easeOutCubic(t / 0.25);
    p.rootX = -10 * k;
    p.bodyRot = -16 * k;
    p.headRot = -12 * k;
    p.eyes = "x";
    p.coreGlow = 0.6;
  } else if (t < 1.2) {
    const t2 = t - 0.25;
    const k = easeInOut(t2 / 0.95);
    p.rootX = lerp(-10, 0, k);
    p.bodyRot = lerp(-16, 4, k);
    p.headRot = lerp(-12, 0, k);
    // 出力低下:ガクッ、ガクッと2段階で沈む(各段を減衰振動で受ける)
    if (t2 < 0.5) {
      p.rootY = 22 + damped(t2, -22, 11, 6);
    } else {
      p.rootY = 32 + damped(t2 - 0.5, -10, 11, 6);
    }
    // 腕がだらんと垂れる
    p.armR = { shoulder: lerp(-30, 58, k), elbow: lerp(-40, 25, k), reach: 1 };
    p.armL = { shoulder: lerp(-30, 60, k), elbow: lerp(-40, 28, k), reach: 1 };
    // コア発光が指数減衰で消えかける
    p.coreGlow = 0.6 * Math.exp(-2 * t2) + 0.08;
    p.eyes = "x";
  } else if (t < 1.9) {
    const t3 = t - 1.2;
    // がっくりうなだれ + 低空で安定し始める
    p.rootY = lerp(32, 15, easeInOut(t3 / 0.7));
    p.bodyRot = lerp(4, 6, t3 / 0.7);
    p.headRot = 14 + damped(t3, -14, 8, 4); // 頭が落ちて14°で受ける
    p.headY = lerp(0, 8, easeOutCubic(t3 / 0.4));
    p.armR = { shoulder: 58, elbow: 25, reach: 1 };
    p.armL = { shoulder: 60, elbow: 28, reach: 1 };
    p.coreGlow = 0.1;
    p.eyes = t3 < 0.15 ? "x" : "tired";
  } else {
    // 低空ホールド(poseTired とほぼ同じ姿勢)
    p.rootY = 14 + Math.sin(t * 2.6) * 1.5;
    p.bodyRot = 6;
    p.headRot = 12;
    p.headY = 8;
    p.armR = { shoulder: 59, elbow: 25, reach: 1 };
    p.armL = { shoulder: 61, elbow: 28, reach: 1 };
    p.coreGlow = 0.1 + Math.max(0, Math.sin(t * 3)) * 0.06;
    p.eyes = "tired";
  }
  return p;
}

const ACTIONS: Record<ActionName, { dur: number; fn: (t: number, p: Pose) => Pose }> = {
  punch: { dur: 0.5, fn: posePunch },
  atkCombo: { dur: 1.3, fn: poseAttackCombo },
  hit: { dur: 0.9, fn: poseHit },
  victory: { dur: 3.0, fn: poseVictory },
  defeat: { dur: 2.4, fn: poseDefeat },
};

// ──────────────────────────────────────────────
// キャラクター描画(SVG・ボーン階層をそのままグループ階層に)
// ──────────────────────────────────────────────
function Robot({ p, horn }: { p: Pose; horn: number }) {
  const eye = p.eyes;
  return (
    <g transform={`translate(${p.rootX}, ${p.rootY + (p.vibrate ? Math.sin(Date.now() / 8) * 1 : 0)})`}>
      {/* 影(浮遊高さに追従) */}
      <ellipse cx="0" cy="152" rx={66 - p.rootY * 0.4} ry="10" fill="#000" opacity={0.35 - p.rootY * 0.002} />

      {/* ===== Body ボーン ===== */}
      <g transform={`translate(0,30) rotate(${p.bodyRot}) scale(${p.bodyScaleX * p.bodyPulse}, ${p.bodyPulse})`}>
        {/* ArmL(奥・画面左) */}
        <g transform={`translate(-58,-14) scale(-1,1) rotate(${p.armL.shoulder})`}>
          <Arm elbow={p.armL.elbow} reach={p.armL.reach} back />
        </g>

        {/* 胴シェル */}
        <circle r="62" fill="url(#shellGrad)" />
        <path d="M -46 42 A 62 62 0 0 0 46 42 Q 0 56 -46 42 Z" fill="#101116" opacity="0.9" />
        <path d="M -60 10 A 62 62 0 0 0 60 10" fill="none" stroke="#b9bdc9" strokeWidth="1" opacity="0.5" />
        <path d="M -34 -51 Q 0 -36 34 -51" fill="none" stroke="#b9bdc9" strokeWidth="1" opacity="0.4" />
        <ellipse cx="-22" cy="-26" rx="24" ry="13" fill="#ffffff" opacity="0.4" transform="rotate(-18 -22 -26)" />
        <ellipse cx="0" cy="-50" rx="34" ry="12" fill="none" stroke="url(#goldGrad)" strokeWidth="4" />

        {/* 腹部中央のスター(4方向スパークル) */}
        <g transform="translate(0,12)">
          <path
            d="M0,-19 C1.5,-6 6,-1.5 19,0 C6,1.5 1.5,6 0,19 C-1.5,6 -6,1.5 -19,0 C-6,-1.5 -1.5,-6 0,-19 Z"
            fill="url(#goldGrad)" stroke="#8a6d1f" strokeWidth="0.8" />
          <path d="M0,-19 C1,-7 3,-3 8,-1 L0,0 Z" fill="#fff3c4" opacity="0.7" />
        </g>
        {/* 動力炉リング(左胸=画面右上) */}
        <g transform="translate(30,-12)">
          <circle r="11" fill="#f6f7f9" stroke="#c9ccd4" strokeWidth="1" />
          <circle r="6.5" fill="none" stroke="#35c4ff" strokeWidth="3" opacity={p.coreGlow + 0.2} filter="url(#eyeGlow)" />
          <circle r="2.2" fill="#35c4ff" opacity={p.coreGlow + 0.2} />
        </g>

        {/* ===== Head ボーン ===== */}
        <g transform={`translate(${p.headYaw}, ${-92 + p.headY}) rotate(${p.headRot})`}>
          {/* 角(セカンダリ:遅れ揺れ) */}
          <g transform={`translate(-42,-50) rotate(${-30 + horn})`}>
            <path d="M-11,6 L0,-30 L11,6 Z" fill="url(#hornGrad)" stroke="#c9ccd4" strokeWidth="0.8" />
            <path d="M-4.5,-13 L0,-30 L4.5,-13 Z" fill="#5fd4ff" filter="url(#eyeGlow)" />
          </g>
          <g transform={`translate(42,-50) rotate(${30 - horn})`}>
            <path d="M-11,6 L0,-30 L11,6 Z" fill="url(#hornGrad)" stroke="#c9ccd4" strokeWidth="0.8" />
            <path d="M-4.5,-13 L0,-30 L4.5,-13 Z" fill="#5fd4ff" filter="url(#eyeGlow)" />
          </g>
          {/* イヤーディスク(左・ほぼ隠れる) */}
          <g transform="translate(-64,2)">
            <circle r="16" fill="url(#goldGrad)" />
            <circle r="10" fill="#0c0d11" />
          </g>
          {/* 左縁のゴールドクレセント */}
          <circle cx="-5" cy="0" r="70" fill="url(#goldGrad)" />
          {/* 頭部シェル */}
          <circle r="70" fill="url(#shellGrad)" />
          <ellipse cx="-26" cy="-46" rx="26" ry="13" fill="#ffffff" opacity="0.55" transform="rotate(-16 -26 -46)" />
          {/* イヤーディスク(右) */}
          <g transform="translate(64,2)">
            <circle r="19" fill="url(#goldGrad)" stroke="#8a6d1f" strokeWidth="0.8" />
            <circle r="13" fill="#0c0d11" />
            <circle r="8" fill="none" stroke="#35c4ff" strokeWidth="3.5" filter="url(#eyeGlow)" />
            <circle r="2.6" fill="#35c4ff" />
          </g>
          {/* バイザー(角丸スクエア) */}
          <rect x="-53" y="-36" width="106" height="82" rx="38" fill="url(#visorGrad)" stroke="#33363f" strokeWidth="1.5" />
          <path d="M -44 -24 Q -8 -40 42 -20 Q 8 -32 -32 -12 Z" fill="#ffffff" opacity="0.12" />
          <path transform="translate(-33,28) scale(0.55)"
            d="M0,-10 C0.8,-3 3,-0.8 10,0 C3,0.8 0.8,3 0,10 C-0.8,3 -3,0.8 -10,0 C-3,-0.8 -0.8,-3 0,-10 Z"
            fill="#dfe6ee" opacity="0.85" />
          <Eyes type={eye} />
        </g>

        {/* ===== ArmR(手前・画面右 / パンチする腕) ===== */}
        <g transform={`translate(58,-14) rotate(${p.armR.shoulder})`}>
          <Arm elbow={p.armR.elbow} reach={p.armR.reach} />
        </g>
      </g>
    </g>
  );
}

function Arm({ elbow, reach, back }: { elbow: number; reach: number; back?: boolean }) {
  const shell = back ? "url(#shellShade)" : "url(#shellGrad)";
  return (
    <>
      <circle r="16" fill="none" stroke="url(#goldGrad)" strokeWidth="2.5" />
      <circle r="13" fill="url(#blackGloss)" />
      <ellipse cx="-4" cy="-5" rx="5" ry="3" fill="#ffffff" opacity="0.25" />
      <g transform={`rotate(${elbow}) scale(${reach},1)`}>
        <rect x="7" y="-12" width="46" height="24" rx="12" fill={shell} stroke="#b9bdc9" strokeWidth="1" />
        <line x1="30" y1="-11" x2="30" y2="11" stroke="#b9bdc9" strokeWidth="1" opacity="0.6" />
        <g transform="translate(64,0)">
          <path d="M10,-6 L34,0 L10,6 Z" fill="url(#hornGrad)" stroke="#c9ccd4" strokeWidth="0.8" />
          <circle r="18" fill="url(#blackGloss)" />
          <ellipse cx="-6" cy="-7" rx="7" ry="4" fill="#ffffff" opacity="0.3" />
        </g>
      </g>
    </>
  );
}

function Eyes({ type }: { type: EyeType }) {
  const glow = { filter: "url(#eyeGlow)" };
  if (type === "blink")
    return (
      <g fill="none" stroke="#35c4ff" strokeWidth="5" strokeLinecap="round" {...glow}>
        <line x1="-30" y1="-4" x2="-13" y2="-4" />
        <line x1="13" y1="-4" x2="30" y2="-4" />
      </g>
    );
  if (type === "happy")
    return (
      <g fill="none" stroke="#5fd4ff" strokeWidth="6" strokeLinecap="round" {...glow}>
        <path d="M -31 2 Q -22 -12 -13 2" />
        <path d="M 13 2 Q 22 -12 31 2" />
        <path d="M -10 24 Q 0 32 10 24" strokeWidth="4" />
      </g>
    );
  if (type === "x")
    return (
      <g fill="none" stroke="#ff9a4d" strokeWidth="5" strokeLinecap="round" {...glow}>
        <path d="M -29 -12 L -13 4 M -13 -12 L -29 4" />
        <path d="M 13 -12 L 29 4 M 29 -12 L 13 4" />
        <path d="M -7 25 Q 0 20 7 25" stroke="#35c4ff" strokeWidth="3.5" />
      </g>
    );
  if (type === "tired")
    return (
      <g fill="none" stroke="#2fa8d8" strokeWidth="5" strokeLinecap="round" opacity="0.85" {...glow}>
        <path d="M -30 0 Q -22 5 -14 0" />
        <path d="M 14 0 Q 22 5 30 0" />
        <line x1="-5" y1="22" x2="5" y2="22" strokeWidth="3.5" />
      </g>
    );
  if (type === "squint")
    return (
      <g fill="none" stroke="#35c4ff" strokeWidth="5" strokeLinecap="round" {...glow}>
        <path d="M -30 -12 L -14 -4 L -30 4" />
        <path d="M 30 -12 L 14 -4 L 30 4" />
        <line x1="-6" y1="20" x2="6" y2="20" />
      </g>
    );
  return (
    <g {...glow}>
      <rect x="-33" y="-22" width="22" height="34" rx="11" fill="#35c4ff" opacity="0.3" />
      <rect x="11" y="-22" width="22" height="34" rx="11" fill="#35c4ff" opacity="0.3" />
      <rect x="-31" y="-20" width="18" height="30" rx="9" fill="#4ecdff" />
      <rect x="13" y="-20" width="18" height="30" rx="9" fill="#4ecdff" />
      <path d="M -11 24 Q 0 33 11 24" fill="none" stroke="#4ecdff" strokeWidth="4" strokeLinecap="round" />
    </g>
  );
}

// ──────────────────────────────────────────────
// メインコンポーネント
// ──────────────────────────────────────────────
type RobotMotionProps = {
  /** ループ状態: relax | healthy | tired | guard */
  mode?: Mode;
  /** 表示幅(px)。高さは自動 */
  width?: number;
  /** アクション再生完了時のコールバック */
  onActionEnd?: (action: ActionName) => void;
};

const RobotMotion = forwardRef<RobotMotionHandle, RobotMotionProps>(
  ({ mode = "relax", width = 320, onActionEnd }, ref) => {
    const [pose, setPose] = useState<Pose & { _horn?: number }>(basePose());

    const modeRef = useRef<Mode>(mode);
    const actionRef = useRef<{ name: ActionName; start: number } | null>(null);
    const guardHitRef = useRef<number | null>(null);
    const blinkRef = useRef({ until: 0, next: 2 });
    const subIdleRef = useRef<SubIdle>(null);
    const hornRef = useRef(0);
    const prevYRef = useRef(0);
    const lastT = useRef(0);
    const onEndRef = useRef(onActionEnd);
    onEndRef.current = onActionEnd;
    const reduceMotion = useRef(
      typeof window !== "undefined" &&
        !!window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );

    // mode プロップの変更を反映
    useEffect(() => {
      modeRef.current = mode;
    }, [mode]);

    useImperativeHandle(ref, () => ({
      play: (name: ActionName) => {
        if (modeRef.current === "guard" && name === "hit") {
          // ガード中の被弾はガードリアクションとして処理
          guardHitRef.current = lastT.current;
          return;
        }
        actionRef.current = { name, start: lastT.current };
      },
    }));

    useEffect(() => {
      let raf: number;
      const t0 = performance.now();
      const loop = (now: number) => {
        const t = (now - t0) / 1000;
        lastT.current = t;
        let p = basePose();
        const act = actionRef.current;

        if (act) {
          const at = t - act.start;
          const def = ACTIONS[act.name];
          if (at >= def.dur) {
            actionRef.current = null;
            onEndRef.current?.(act.name);
            p = renderMode(t, p);
          } else {
            p = def.fn(at, p);
          }
        } else {
          p = renderMode(t, p);
        }

        // まばたき(通常目のときのみ)
        if (!actionRef.current && p.eyes === "normal") {
          const b = blinkRef.current;
          if (t > b.next) {
            b.until = t + 0.12;
            b.next = t + 2 + Math.random() * 3;
          }
          if (t < b.until) p.eyes = "blink";
        }

        // 角のセカンダリ(Root速度に遅れて追従)
        const vy = p.rootY - prevYRef.current;
        prevYRef.current = p.rootY;
        const target = clamp(vy * 6, -14, 14);
        hornRef.current += (target - hornRef.current) * 0.12;

        if (reduceMotion.current && !actionRef.current) {
          const st = basePose();
          st.eyes = p.eyes;
          p = modeRef.current === "guard" ? poseGuard(0, basePose(), null) : st;
        }

        setPose({ ...p, _horn: hornRef.current });
        raf = requestAnimationFrame(loop);
      };

      const renderMode = (t: number, p: Pose): Pose => {
        switch (modeRef.current) {
          case "guard": {
            const ght = guardHitRef.current !== null ? t - guardHitRef.current : null;
            const out = poseGuard(t, p, ght);
            if (ght !== null && ght > 0.25) guardHitRef.current = null;
            return out;
          }
          case "healthy":
            return poseHealthy(t, p);
          case "tired":
            return poseTired(t, p);
          default: {
            if (!subIdleRef.current && Math.random() < 0.004) {
              subIdleRef.current = { type: Math.random() < 0.5 ? "look" : "dip", start: t };
            }
            if (subIdleRef.current && t - subIdleRef.current.start > 1.7) subIdleRef.current = null;
            return poseRelax(t, p, subIdleRef.current);
          }
        }
      };

      raf = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(raf);
    }, []);

    return (
      <svg
        viewBox="-210 -230 420 420"
        style={{ width, height: "auto", display: "block" }}
        role="img"
        aria-label="ロボットキャラクター"
      >
        <defs>
          <radialGradient id="shellGrad" cx="32%" cy="26%" r="85%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#f1f2f6" />
            <stop offset="85%" stopColor="#ccd0da" />
            <stop offset="100%" stopColor="#a9aebc" />
          </radialGradient>
          <radialGradient id="shellShade" cx="32%" cy="26%" r="85%">
            <stop offset="0%" stopColor="#e8eaef" />
            <stop offset="70%" stopColor="#d2d5dd" />
            <stop offset="100%" stopColor="#a2a7b4" />
          </radialGradient>
          <radialGradient id="blackGloss" cx="32%" cy="28%" r="80%">
            <stop offset="0%" stopColor="#3d4049" />
            <stop offset="55%" stopColor="#17181d" />
            <stop offset="100%" stopColor="#000000" />
          </radialGradient>
          <linearGradient id="visorGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16171d" />
            <stop offset="100%" stopColor="#05060a" />
          </linearGradient>
          <linearGradient id="hornGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#f7f8fa" />
            <stop offset="100%" stopColor="#d5d9e1" />
          </linearGradient>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffe08a" />
            <stop offset="55%" stopColor="#e0b64f" />
            <stop offset="100%" stopColor="#b8862a" />
          </linearGradient>
          <filter id="eyeGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <Robot p={pose} horn={pose._horn || 0} />
      </svg>
    );
  }
);

RobotMotion.displayName = "RobotMotion";
export default RobotMotion;
