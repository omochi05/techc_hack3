import heroImage from "../assets/hero.png";
import hero2Image from "../assets/hero2.png";
import refereeImage from "../assets/referee.png";

type MatchPageProps = {
  onFinish: () => void;
};

export default function MatchPage({
  onFinish,
}: MatchPageProps) {
  return (
    <main className="match-page">
      {/* ここに後輩が作った既存の試合画面をそのまま残す */}

      <button
        type="button"
        className="match-page__finish-button"
        onClick={onFinish}
      >
        試合を終了する
      </button>
    </main>
  );
}