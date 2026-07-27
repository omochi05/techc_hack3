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

import type {
  MatchEvent,
  MatchPlayer,
} from "../types/matchEvent";

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

export default function MatchPage({
  onFinish,
}: MatchPageProps) {
  const [
    commentaryBubble,
    setCommentaryBubble,
  ] = useState<CommentaryBubble | null>(null);

  const commentaryTimerRef =
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

  useEffect(() => {
    const event = createMatchStartEvent();

    void handleMatchEvent(event);
  }, [handleMatchEvent]);

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