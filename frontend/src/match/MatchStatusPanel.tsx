import type {
  MatchStatus,
} from "../types/match";

type MatchStatusPanelProps = {
  matchStatus: MatchStatus | null;
  isLoading: boolean;
  error: string | null;
};

export default function MatchStatusPanel({
  matchStatus,
  isLoading,
  error,
}: MatchStatusPanelProps) {
  return (
    <section className="match-page__status">
      {isLoading && (
        <p className="match-page__status-message">
          試合情報を読み込んでいます...
        </p>
      )}

      {error !== null && (
        <p className="match-page__status-error">
          {error}
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
              <p>HP: {matchStatus.player1_hp}</p>
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
              <p>HP: {matchStatus.player2_hp}</p>
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
  );
}