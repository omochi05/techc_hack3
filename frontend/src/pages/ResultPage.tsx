import heroImage from "../assets/hero.png";
import hero2Image from "../assets/hero2.png";
import type {
  MatchResult,
  MatchWinner,
} from "../types/matchResult";

type ResultPageProps = {
  result: MatchResult;
  onNext: () => void;
};

type PlayerResultCardProps = {
  player: "playerA" | "playerB";
  winner: MatchWinner;
  name: string;
  image: string;
  hp: number;
  punches: number;
  maxCombo: number;
};

function getPlayerStatus(
  player: "playerA" | "playerB",
  winner: MatchWinner,
): "WINNER" | "LOSE" | "DRAW" {
  if (winner === "draw") {
    return "DRAW";
  }

  return winner === player ? "WINNER" : "LOSE";
}

function PlayerResultCard({
  player,
  winner,
  name,
  image,
  hp,
  punches,
  maxCombo,
}: PlayerResultCardProps) {
  const status = getPlayerStatus(player, winner);
  const isWinner = status === "WINNER";

  return (
    <article
      className={`result-player${
        isWinner ? " result-player--winner" : ""
      }`}
    >
      <span className="result-player__status">
        {status}
      </span>

      <img
        src={image}
        alt={name}
        className="result-player__image"
      />

      <h2>{name}</h2>

      <dl className="result-player__stats">
        <div>
          <dt>残りHP</dt>
          <dd>{hp}</dd>
        </div>

        <div>
          <dt>パンチ数</dt>
          <dd>{punches}</dd>
        </div>

        <div>
          <dt>最大コンボ数</dt>
          <dd>{maxCombo}</dd>
        </div>
      </dl>
    </article>
  );
}

function getResultTitle(winner: MatchWinner): string {
  if (winner === "playerA") {
    return "PLAYER 1 WIN!";
  }

  if (winner === "playerB") {
    return "PLAYER 2 WIN!";
  }

  return "DRAW!";
}

function getFinishLabel(
  finishType: MatchResult["finishType"],
): string {
  return finishType === "ko" ? "KNOCK OUT" : "判定";
}

export default function ResultPage({
  result,
  onNext,
}: ResultPageProps) {
  const elapsedTime = 45 - result.remainingTime;

  return (
    <main className="result-page">
      <section className="result-page__header">
        <p className="result-page__label">MATCH RESULT</p>
        <h1>{getResultTitle(result.winner)}</h1>
        <p>
          {getFinishLabel(result.finishType)}
          {" / "}
          試合時間 {elapsedTime}秒
        </p>
      </section>

      <section className="result-page__players">
        <PlayerResultCard
          player="playerA"
          winner={result.winner}
          name="PLAYER 1"
          image={heroImage}
          hp={result.player1Hp}
          punches={result.player1Punches}
          maxCombo={result.player1MaxCombo}
        />

        <div className="result-page__versus">VS</div>

        <PlayerResultCard
          player="playerB"
          winner={result.winner}
          name="PLAYER 2"
          image={hero2Image}
          hp={result.player2Hp}
          punches={result.player2Punches}
          maxCombo={result.player2MaxCombo}
        />
      </section>

      <button
        type="button"
        className="result-page__next-button"
        onClick={onNext}
      >
        健康状態を確認
        <span aria-hidden="true">→</span>
      </button>
    </main>
  );
}