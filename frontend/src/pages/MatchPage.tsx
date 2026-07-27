import {
  useCallback,
  useEffect,
  useRef,
  useState,
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

import {
  useMatchStatus,
} from "../hooks/useMatchStatus";

import type {
  MatchEvent,
  MatchPlayer,
} from "../types/match";
import {
  createComboEvent,
  createMatchEndEvent,
  createMatchStartEvent,
  createPunchEvent,
} from "../utils/matchEventHandler";

type MatchPageProps = {
  onFinish: () => void;
};

type CommentaryBubble = {
  player: MatchPlayer | "center";
  text: string;
};

const COMMENTARY_DISPLAY_TIME = 3000;
const PUNCH_POLLING_INTERVAL = 1000;

export default function MatchPage({
  onFinish,
}: MatchPageProps) {
  const {
    matchStatus,
    isLoading: isMatchStatusLoading,
    error: matchStatusError,
  } = useMatchStatus();

  const [
    commentaryBubble,
    setCommentaryBubble,
  ] = useState<CommentaryBubble | null>(null);

  const commentaryTimerRef =
    useRef<number | null>(null);

  const lastProcessedPunchIdRef =
    useRef<number | null>(null);

  const hideCommentaryBubble =
    useCallback((): void => {
      if (commentaryTimerRef.current !== null) {
        window.clearTimeout(
          commentaryTimerRef.current,
        );

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
        window.clearTimeout(
          commentaryTimerRef.current,
        );
      }

      setCommentaryBubble({
        player,
        text,
      });

      commentaryTimerRef.current =
        window.setTimeout(() => {
          setCommentaryBubble(null);
          commentaryTimerRef.current = null;
        }, COMMENTARY_DISPLAY_TIME);
    },
    [],
  );

  const convertMatchEventToCommentaryRequest =
    useCallback(
      (
        event: MatchEvent,
      ): CommentaryRequest => {
        return {
          event_type: event.type,
          player: event.player,
          power: event.power,
          combo_count: event.comboCount,
          player1_hp: event.player1Hp,
          player2_hp: event.player2Hp,
          winner: event.winner,
        };
      },
      [],
    );

  const handleMatchEvent = useCallback(
    async (
      event: MatchEvent,
    ): Promise<void> => {
      try {
        const request =
          convertMatchEventToCommentaryRequest(event);

        const response =
          await generateCommentary(request);

        const bubblePosition:
          | MatchPlayer
          | "center" =
          event.player ?? "center";

        showCommentaryBubble(
          bubblePosition,
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

  const processReceivedPunch = useCallback(
    (
      punch: PunchResponse,
    ): void => {
      if (
        lastProcessedPunchIdRef.current ===
        punch.id
      ) {
        return;
      }

      lastProcessedPunchIdRef.current =
        punch.id;

      const event = createPunchEvent(
        punch.player,
        punch.power,
      );

      void handleMatchEvent(event);
    },
    [handleMatchEvent],
  );

  const pollLatestPunch =
    useCallback(async (): Promise<void> => {
      try {
        const response =
          await getLatestPunch();

        if (response.punch === null) {
          return;
        }

        processReceivedPunch(
          response.punch,
        );
      } catch (error) {
        console.error(
          "最新パンチの取得に失敗しました",
          error,
        );
      }
    }, [processReceivedPunch]);

  useEffect(() => {
    const event =
      createMatchStartEvent();

    void handleMatchEvent(event);
  }, [handleMatchEvent]);

  useEffect(() => {
    void pollLatestPunch();

    const pollingTimer =
      window.setInterval(() => {
        void pollLatestPunch();
      }, PUNCH_POLLING_INTERVAL);

    return () => {
      window.clearInterval(
        pollingTimer,
      );
    };
  }, [pollLatestPunch]);

  useEffect(() => {
    return () => {
      hideCommentaryBubble();
    };
  }, [hideCommentaryBubble]);

  const handlePlayer1Attack = (): void => {
    const event = createPunchEvent(
      "playerA",
      87,
    );

    void handleMatchEvent(event);
  };

  const handlePlayer2Attack = (): void => {
    const event = createPunchEvent(
      "playerB",
      72,
    );

    void handleMatchEvent(event);
  };

  const handlePlayer1Combo = (): void => {
    const event = createComboEvent(
      "playerA",
      3,
    );

    void handleMatchEvent(event);
  };

  const handlePlayer2Combo = (): void => {
    const event = createComboEvent(
      "playerB",
      4,
    );

    void handleMatchEvent(event);
  };

  const handleFinish = (): void => {
    hideCommentaryBubble();

    const event = createMatchEndEvent(
      "playerA",
    );

    void handleMatchEvent(event);

    window.setTimeout(() => {
      onFinish();
    }, 1000);
  };

  return (
    <main className="match-page">
      <section className="match-page__status">
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

        {matchStatus !== null && (
          <>
            <div className="match-page__round-info">
              <span>
                ROUND {matchStatus.current_round}
              </span>

              <span>
                残り {matchStatus.time_left} 秒
              </span>

              <span>
                {matchStatus.is_active
                  ? "試合中"
                  : "試合停止中"}
              </span>
            </div>

            <div className="match-page__player-statuses">
              <div className="match-page__player-status">
                <h2>PLAYER 1</h2>

                <p>
                  HP: {matchStatus.player1_hp}
                </p>

                <p>
                  パンチ数:{" "}
                  {
                    matchStatus
                      .player1_total_punches
                  }
                </p>

                <p>
                  強打数:{" "}
                  {
                    matchStatus
                      .player1_strong_hits
                  }
                </p>
              </div>

              <div className="match-page__player-status">
                <h2>PLAYER 2</h2>

                <p>
                  HP: {matchStatus.player2_hp}
                </p>

                <p>
                  パンチ数:{" "}
                  {
                    matchStatus
                      .player2_total_punches
                  }
                </p>

                <p>
                  強打数:{" "}
                  {
                    matchStatus
                      .player2_strong_hits
                  }
                </p>
              </div>
            </div>
          </>
        )}
      </section>

      {commentaryBubble?.player ===
        "center" && (
        <div className="commentary-bubble commentary-bubble--center">
          {commentaryBubble.text}
        </div>
      )}

      <section className="match-page__arena">
        <div className="match-page__player match-page__player--one">
          {commentaryBubble?.player ===
            "playerA" && (
            <div className="commentary-bubble commentary-bubble--left">
              {commentaryBubble.text}
            </div>
          )}

          <img
            src={heroImage}
            alt="プレイヤー1"
            className="match-page__character"
          />

          <button
            type="button"
            className="match-page__attack-button"
            onClick={handlePlayer1Attack}
          >
            PLAYER 1 攻撃テスト
          </button>

          <button
            type="button"
            className="match-page__attack-button"
            onClick={handlePlayer1Combo}
          >
            PLAYER 1 コンボテスト
          </button>
        </div>

        <div className="match-page__referee">
          <img
            src={refereeImage}
            alt="レフェリー"
            className="match-page__referee-image"
          />
        </div>

        <div className="match-page__player match-page__player--two">
          {commentaryBubble?.player ===
            "playerB" && (
            <div className="commentary-bubble commentary-bubble--right">
              {commentaryBubble.text}
            </div>
          )}

          <img
            src={hero2Image}
            alt="プレイヤー2"
            className="match-page__character"
          />

          <button
            type="button"
            className="match-page__attack-button"
            onClick={handlePlayer2Attack}
          >
            PLAYER 2 攻撃テスト
          </button>

          <button
            type="button"
            className="match-page__attack-button"
            onClick={handlePlayer2Combo}
          >
            PLAYER 2 コンボテスト
          </button>
        </div>
      </section>

      <button
        type="button"
        className="match-page__finish-button"
        onClick={handleFinish}
      >
        試合を終了する
      </button>
    </main>
  );
}