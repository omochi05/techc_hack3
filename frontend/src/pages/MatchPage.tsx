import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import heroImage from "../assets/hero.png";
import hero2Image from "../assets/hero2.png";
import refereeImage from "../assets/referee.png";

import {
  generateCommentary,
  type CommentaryRequest,
} from "../api/commentaryApi";
import {
  getLatestPunch,
  type PunchResponse,
} from "../api/matchApi";
import { useMatchStatus } from "../hooks/useMatchStatus";
import type {
  MatchEvent,
  MatchPlayer,
} from "../types/match";
import type {
  MatchResult,
  MatchWinner,
} from "../types/matchResult";
import {
  createComboEvent,
  createMatchEndEvent,
  createMatchStartEvent,
  createPunchEvent,
} from "../utils/matchEventHandler";
import RobotMotion, {
  type RobotMotionHandle,
} from "../components/RobotMotion";

type MatchPageProps = {
  onFinish: (result: MatchResult) => void;
};

type CommentaryBubble = {
  player: MatchPlayer | "center";
  text: string;
};

type PlayerPanelProps = {
  side: "one" | "two";
  name: string;
  image: string;
  /** 指定するとキャラ画像の代わりにこれを表示(RobotMotion用) */
  character?: ReactNode;
  hp: number;
  totalPunches: number;
  comboCount: number;
  commentary?: string;
  disabled?: boolean;
  onAttack: () => void;
  onCombo: () => void;
};

const COMMENTARY_DISPLAY_TIME = 3000;
const PUNCH_POLLING_INTERVAL = 1000;
const MAX_HP = 100;
const INITIAL_MATCH_TIME = 45;
const DAMAGE_DIVISOR = 10;
const COMBO_TEST_DAMAGE_PER_HIT = 6;

function clampHp(hp: number): number {
  return Math.min(MAX_HP, Math.max(0, hp));
}

function PlayerPanel({
  side,
  name,
  image,
  character,
  hp,
  totalPunches,
  comboCount,
  commentary,
  disabled = false,
  onAttack,
  onCombo,
}: PlayerPanelProps) {
  const safeHp = clampHp(hp);

  return (
    <article
      className={`match-page__player-card match-page__player-card--${side}`}
      aria-label={`${name}の試合情報`}
    >
      {commentary !== undefined && (
        <div
          className={`commentary-bubble commentary-bubble--${
            side === "one" ? "left" : "right"
          }`}
          role="status"
          aria-live="polite"
        >
          {commentary}
        </div>
      )}

      <p className="match-page__fighter-label">FIGHTER</p>
      <h2 className="match-page__player-name">{name}</h2>

      <div className="match-page__hp-section">
        <div className="match-page__hp-label">
          <span>HP</span>
          <span className="match-page__hp-value">{safeHp}</span>
        </div>

        <div
          className="match-page__hp-bar"
          role="progressbar"
          aria-label={`${name} HP`}
          aria-valuemin={0}
          aria-valuemax={MAX_HP}
          aria-valuenow={safeHp}
        >
          <div
            className="match-page__hp-fill"
            style={{ width: `${safeHp}%` }}
          />
        </div>
      </div>

      {character ?? (
        <img
          src={image}
          alt={`${name}のキャラクター`}
          className="match-page__character"
        />
      )}

      <dl className="match-page__stats">
        <div className="match-page__stat-box">
          <dt className="match-page__stat-label">パンチ数</dt>
          <dd className="match-page__stat-value">
            {totalPunches}
          </dd>
        </div>

        <div className="match-page__stat-box">
          <dt className="match-page__stat-label">コンボ数</dt>
          <dd className="match-page__stat-value">
            {comboCount}
          </dd>
        </div>
      </dl>

      <div className="match-page__controls">
        <button
          type="button"
          className="match-page__attack-button"
          onClick={onAttack}
          disabled={disabled}
        >
          攻撃テスト
        </button>

        <button
          type="button"
          className="match-page__attack-button"
          onClick={onCombo}
          disabled={disabled}
        >
          コンボテスト
        </button>
      </div>
    </article>
  );
}

export default function MatchPage({
  onFinish,
}: MatchPageProps) {
  const {
    matchStatus,
    isLoading: isMatchStatusLoading,
    error: matchStatusError,
  } = useMatchStatus();

  const [commentaryBubble, setCommentaryBubble] =
    useState<CommentaryBubble | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [displayTimeLeft, setDisplayTimeLeft] =
    useState(INITIAL_MATCH_TIME);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [localHp, setLocalHp] = useState({
    playerA: MAX_HP,
    playerB: MAX_HP,
  });
  const [localPunches, setLocalPunches] = useState({
    playerA: 0,
    playerB: 0,
  });
  const [consecutiveHits, setConsecutiveHits] = useState({
    playerA: 0,
    playerB: 0,
  });
  const [maxCombo, setMaxCombo] = useState({
    playerA: 0,
    playerB: 0,
  });

  const commentaryTimerRef = useRef<number | null>(null);
  const finishStartedRef = useRef(false);
  const lastProcessedPunchIdRef = useRef<number | null>(null);
  const isPollingRef = useRef(false);
  const hasInitializedStatusRef = useRef(false);

  // ── キャラモーション用 ──
  const robotARef = useRef<RobotMotionHandle>(null);
  const robotBRef = useRef<RobotMotionHandle>(null);

  // 攻撃側にパンチ、被弾側に被弾モーションを再生
  const playPunchMotion = useCallback(
    (attacker: MatchPlayer): void => {
      const atk = attacker === "playerA" ? robotARef : robotBRef;
      const def = attacker === "playerA" ? robotBRef : robotARef;
      atk.current?.play("punch");
      def.current?.play("hit");
    },
    [],
  );

  // 攻撃側に攻撃コンボ、被弾側に被弾モーションを再生
  const playComboMotion = useCallback(
    (attacker: MatchPlayer): void => {
      const atk = attacker === "playerA" ? robotARef : robotBRef;
      const def = attacker === "playerA" ? robotBRef : robotARef;
      atk.current?.play("atkCombo");
      def.current?.play("hit");
    },
    [],
  );

  const hideCommentaryBubble = useCallback((): void => {
    if (commentaryTimerRef.current !== null) {
      window.clearTimeout(commentaryTimerRef.current);
      commentaryTimerRef.current = null;
    }

    setCommentaryBubble(null);
  }, []);

  const showCommentaryBubble = useCallback(
    (
      player: CommentaryBubble["player"],
      text: string,
    ): void => {
      if (commentaryTimerRef.current !== null) {
        window.clearTimeout(commentaryTimerRef.current);
      }

      setCommentaryBubble({ player, text });

      commentaryTimerRef.current = window.setTimeout(() => {
        setCommentaryBubble(null);
        commentaryTimerRef.current = null;
      }, COMMENTARY_DISPLAY_TIME);
    },
    [],
  );

  const convertMatchEventToCommentaryRequest = useCallback(
    (event: MatchEvent): CommentaryRequest => ({
      event_type: event.type,
      player: event.player,
      power: event.power,
      combo_count: event.comboCount,
      player1_hp: event.player1Hp,
      player2_hp: event.player2Hp,
      winner: event.winner,
    }),
    [],
  );

  const handleMatchEvent = useCallback(
    async (event: MatchEvent): Promise<void> => {
      try {
        const response = await generateCommentary(
          convertMatchEventToCommentaryRequest(event),
        );

        showCommentaryBubble(
          event.player ?? "center",
          response.commentary,
        );
      } catch (error) {
        console.error(
          "試合イベントの処理に失敗しました",
          error,
        );
      }
    },
    [
      convertMatchEventToCommentaryRequest,
      showCommentaryBubble,
    ],
  );

  const calculateDamage = useCallback((power: number): number => {
    return Math.max(1, Math.round(power / DAMAGE_DIVISOR));
  }, []);

  const registerHit = useCallback(
    (player: MatchPlayer, power: number): void => {
      const opponent: MatchPlayer =
        player === "playerA" ? "playerB" : "playerA";
      const damage = calculateDamage(power);

      // モーション再生(攻撃側パンチ・被弾側被弾)
      playPunchMotion(player);

      setLocalPunches((current) => ({
        ...current,
        [player]: current[player] + 1,
      }));

      setLocalHp((current) => ({
        ...current,
        [opponent]: clampHp(current[opponent] - damage),
      }));

      setConsecutiveHits((current) => ({
        ...current,
        [player]: current[player] + 1,
        [opponent]: 0,
      }));
    },
    [calculateDamage, playPunchMotion],
  );

  const registerComboSequence = useCallback(
    (player: MatchPlayer, hitCount: number): void => {
      const opponent: MatchPlayer =
        player === "playerA" ? "playerB" : "playerA";
      const totalDamage =
        hitCount * COMBO_TEST_DAMAGE_PER_HIT;

      // モーション再生(攻撃側コンボ・被弾側被弾)
      playComboMotion(player);

      setLocalPunches((current) => ({
        ...current,
        [player]: current[player] + hitCount,
      }));

      setLocalHp((current) => ({
        ...current,
        [opponent]: clampHp(
          current[opponent] - totalDamage,
        ),
      }));

      setConsecutiveHits((current) => ({
        ...current,
        [player]: current[player] + hitCount,
        [opponent]: 0,
      }));
    },
    [playComboMotion],
  );

  const processReceivedPunch = useCallback(
    (punch: PunchResponse): void => {
      if (lastProcessedPunchIdRef.current === punch.id) {
        return;
      }

      lastProcessedPunchIdRef.current = punch.id;
      registerHit(punch.player, punch.power);

      void handleMatchEvent(
        createPunchEvent(punch.player, punch.power),
      );
    },
    [handleMatchEvent, registerHit],
  );

  const pollLatestPunch = useCallback(async (): Promise<void> => {
    if (isPollingRef.current || isFinishing) {
      return;
    }

    isPollingRef.current = true;

    try {
      const response = await getLatestPunch();

      if (response.punch !== null) {
        processReceivedPunch(response.punch);
      }
    } catch (error) {
      console.error(
        "最新パンチの取得に失敗しました",
        error,
      );
    } finally {
      isPollingRef.current = false;
    }
  }, [isFinishing, processReceivedPunch]);

  useEffect(() => {
    void handleMatchEvent(createMatchStartEvent());
  }, [handleMatchEvent]);

  useEffect(() => {
    void pollLatestPunch();

    const pollingTimer = window.setInterval(() => {
      void pollLatestPunch();
    }, PUNCH_POLLING_INTERVAL);

    return () => {
      window.clearInterval(pollingTimer);
    };
  }, [pollLatestPunch]);

  useEffect(() => {
    return () => {
      hideCommentaryBubble();

    };
  }, [hideCommentaryBubble]);

  useEffect(() => {
    if (matchStatus === null) {
      return;
    }

    if (!hasInitializedStatusRef.current) {
      setDisplayTimeLeft(matchStatus.time_left);
      hasInitializedStatusRef.current = true;
    }

    setLocalPunches((current) => ({
      playerA: Math.max(
        current.playerA,
        matchStatus.player1_total_punches,
      ),
      playerB: Math.max(
        current.playerB,
        matchStatus.player2_total_punches,
      ),
    }));

  }, [matchStatus]);

  useEffect(() => {
    setMaxCombo((current) => ({
      playerA: Math.max(
        current.playerA,
        Math.max(consecutiveHits.playerA - 1, 0),
      ),
      playerB: Math.max(
        current.playerB,
        Math.max(consecutiveHits.playerB - 1, 0),
      ),
    }));
  }, [consecutiveHits]);

  useEffect(() => {
    if (!isTimerRunning || isFinishing) {
      return;
    }

    const timer = window.setInterval(() => {
      setDisplayTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setIsTimerRunning(false);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isFinishing, isTimerRunning]);

  const handlePlayer1Attack = (): void => {
    if (!isFinishing) {
      registerHit("playerA", 87);
      void handleMatchEvent(
        createPunchEvent("playerA", 87),
      );
    }
  };

  const handlePlayer2Attack = (): void => {
    if (!isFinishing) {
      registerHit("playerB", 72);
      void handleMatchEvent(
        createPunchEvent("playerB", 72),
      );
    }
  };

  const handlePlayer1Combo = (): void => {
    if (!isFinishing) {
      registerComboSequence("playerA", 3);
      void handleMatchEvent(
        createComboEvent("playerA", 3),
      );
    }
  };

  const handlePlayer2Combo = (): void => {
    if (!isFinishing) {
      registerComboSequence("playerB", 4);
      void handleMatchEvent(
        createComboEvent("playerB", 4),
      );
    }
  };

  const handleFinish = useCallback((): void => {
    if (finishStartedRef.current) {
      return;
    }

    finishStartedRef.current = true;
    setIsFinishing(true);
    setIsTimerRunning(false);
    hideCommentaryBubble();

    const player1Hp = localHp.playerA;
    const player2Hp = localHp.playerB;

    const winner: MatchWinner =
      player1Hp === player2Hp
        ? "draw"
        : player1Hp > player2Hp
          ? "playerA"
          : "playerB";

    const finishType: MatchResult["finishType"] =
      player1Hp === 0 || player2Hp === 0
        ? "ko"
        : "decision";

    if (winner !== "draw") {
      void handleMatchEvent(createMatchEndEvent(winner));
    }

    const player1CurrentCombo = Math.max(
      consecutiveHits.playerA - 1,
      0,
    );
    const player2CurrentCombo = Math.max(
      consecutiveHits.playerB - 1,
      0,
    );

    const result: MatchResult = {
      winner,
      finishType,
      player1Hp,
      player2Hp,
      player1Punches: Math.max(
        localPunches.playerA,
        matchStatus?.player1_total_punches ?? 0,
      ),
      player2Punches: Math.max(
        localPunches.playerB,
        matchStatus?.player2_total_punches ?? 0,
      ),
      player1MaxCombo: Math.max(
        maxCombo.playerA,
        player1CurrentCombo,
      ),
      player2MaxCombo: Math.max(
        maxCombo.playerB,
        player2CurrentCombo,
      ),
      remainingTime: displayTimeLeft,
    };

    // 遅延させず、その場で結果をAppへ渡して画面遷移する。
    onFinish(result);
  }, [
    consecutiveHits.playerA,
    consecutiveHits.playerB,
    displayTimeLeft,
    handleMatchEvent,
    hideCommentaryBubble,
    localHp.playerA,
    localHp.playerB,
    localPunches.playerA,
    localPunches.playerB,
    matchStatus?.player1_total_punches,
    matchStatus?.player2_total_punches,
    maxCombo.playerA,
    maxCombo.playerB,
    onFinish,
  ]);

  useEffect(() => {
    const isKnockout =
      localHp.playerA === 0 ||
      localHp.playerB === 0;

    if (
      (displayTimeLeft === 0 || isKnockout) &&
      !isFinishing
    ) {
      handleFinish();
    }
  }, [
    displayTimeLeft,
    handleFinish,
    isFinishing,
    localHp.playerA,
    localHp.playerB,
  ]);

  const currentRound = matchStatus?.current_round ?? 1;
  const isActive = isTimerRunning && !isFinishing;
  const player1Punches = Math.max(
    localPunches.playerA,
    matchStatus?.player1_total_punches ?? 0,
  );
  const player2Punches = Math.max(
    localPunches.playerB,
    matchStatus?.player2_total_punches ?? 0,
  );
  const player1ComboCount = Math.max(
    consecutiveHits.playerA - 1,
    0,
  );
  const player2ComboCount = Math.max(
    consecutiveHits.playerB - 1,
    0,
  );

  return (
    <main className="match-page">
      <header className="match-page__header">
        <div className="match-page__brand">
          IoT BOXING ARENA
        </div>

        <div className="match-page__status-center">
          <p className="match-page__round">
            ROUND {currentRound}
          </p>

          <p className="match-page__timer">
            {displayTimeLeft}
            <span>SEC</span>
          </p>

          <p className="match-page__state">
            {isFinishing
              ? "試合終了処理中"
              : isActive
                ? "試合中"
                : "試合停止中"}
          </p>
        </div>

        <div className="match-page__header-actions">
          <button
            type="button"
            className="match-page__timer-button"
            onClick={() => {
              setIsTimerRunning((current) => !current);
            }}
            disabled={isFinishing}
          >
            {isTimerRunning ? "一時停止" : "再開"}
          </button>

          <button
            type="button"
            className="match-page__finish-button"
            onClick={handleFinish}
            disabled={isFinishing}
          >
            {isFinishing
              ? "終了処理中..."
              : "試合を終了する"}
          </button>
        </div>
      </header>

      {(isMatchStatusLoading || matchStatusError !== null) && (
        <aside
          className="match-page__notice"
          role="status"
          aria-live="polite"
        >
          {isMatchStatusLoading && (
            <p className="match-page__status-message">
              試合情報を読み込んでいます...
            </p>
          )}

          {matchStatusError !== null && (
            <p className="match-page__status-error">
              {matchStatusError}
            </p>
          )}
        </aside>
      )}

      {commentaryBubble?.player === "center" && (
        <div
          className="commentary-bubble commentary-bubble--center"
          role="status"
          aria-live="polite"
        >
          {commentaryBubble.text}
        </div>
      )}

      <section
        className="match-page__arena"
        aria-label="ボクシング試合エリア"
      >
        <PlayerPanel
          side="one"
          name="PLAYER 1"
          image={heroImage}
          character={
            <RobotMotion
              ref={robotARef}
              mode="relax"
              width={220}
            />
          }
          hp={localHp.playerA}
          totalPunches={player1Punches}
          comboCount={player1ComboCount}
          commentary={
            commentaryBubble?.player === "playerA"
              ? commentaryBubble.text
              : undefined
          }
          disabled={
            isFinishing ||
            !isTimerRunning ||
            localHp.playerA === 0 ||
            localHp.playerB === 0
          }
          onAttack={handlePlayer1Attack}
          onCombo={handlePlayer1Combo}
        />

        <section
          className="match-page__referee"
          aria-label="対戦中央エリア"
        >
          <div
            className="match-page__vs"
            aria-hidden="true"
          >
            VS
          </div>

          <img
            src={refereeImage}
            alt="レフェリー"
            className="match-page__referee-image"
          />

          <p className="match-page__battle-label">
            SENSOR BATTLE
          </p>
        </section>

        <PlayerPanel
          side="two"
          name="PLAYER 2"
          image={hero2Image}
          character={
            <RobotMotion
              ref={robotBRef}
              mode="relax"
              width={220}
            />
          }
          hp={localHp.playerB}
          totalPunches={player2Punches}
          comboCount={player2ComboCount}
          commentary={
            commentaryBubble?.player === "playerB"
              ? commentaryBubble.text
              : undefined
          }
          disabled={
            isFinishing ||
            !isTimerRunning ||
            localHp.playerA === 0 ||
            localHp.playerB === 0
          }
          onAttack={handlePlayer2Attack}
          onCombo={handlePlayer2Combo}
        />
      </section>

      <footer className="match-page__footer">
        <span className="match-page__commentary-area">
          ESP32 / FASTAPI / REACT
        </span>

        <span className="match-page__live-status">
          LIVE MATCH STATUS
        </span>
      </footer>
    </main>
  );
}