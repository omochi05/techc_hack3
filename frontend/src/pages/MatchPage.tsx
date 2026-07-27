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
  type CommentaryPlayer,
  type CommentaryRequest,
} from "../api/commentaryApi";
type MatchPageProps = {
  onFinish: () => void;
};

type CommentaryBubble = {
  player: CommentaryPlayer | "center";
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

  const requestCommentary = useCallback(
    async (
      request: CommentaryRequest,
    ): Promise<void> => {
      try {
        const response =
          await generateCommentary(request);

        const bubblePosition:
          | CommentaryPlayer
          | "center" =
          request.player ?? "center";

        showCommentaryBubble(
          bubblePosition,
          response.commentary,
        );
      } catch (error) {
        console.error(
          "実況の取得に失敗しました",
          error,
        );
      }
    },
    [showCommentaryBubble],
  );

  useEffect(() => {
    void requestCommentary({
      event_type: "match_start",
    });
  }, [requestCommentary]);

  useEffect(() => {
    return () => {
      hideCommentaryBubble();
    };
  }, [hideCommentaryBubble]);

  const handlePlayer1Attack = (): void => {
    void requestCommentary({
      event_type: "strong_punch",
      player: "playerA",
      power: 87,
    });
  };

  const handlePlayer2Attack = (): void => {
    void requestCommentary({
      event_type: "combo",
      player: "playerB",
      combo_count: 3,
    });
  };

  const handleFinish = (): void => {
    hideCommentaryBubble();
    onFinish();
  };

  return (
    <main className="match-page">
      {commentaryBubble?.player === "center" && (
        <div className="commentary-bubble commentary-bubble--center">
          {commentaryBubble.text}
        </div>
      )}

      <section className="match-page__arena">
        <div className="match-page__player match-page__player--one">
          {commentaryBubble?.player === "playerA" && (
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
        </div>

        <div className="match-page__referee">
          <img
            src={refereeImage}
            alt="レフェリー"
            className="match-page__referee-image"
          />
        </div>

        <div className="match-page__player match-page__player--two">
          {commentaryBubble?.player === "playerB" && (
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