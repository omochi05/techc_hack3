import heroImage from "../assets/hero.png";
import hero2Image from "../assets/hero2.png";

type ResultPageProps = {
  onNext: () => void;
};

export default function ResultPage({ onNext }: ResultPageProps) {
  return (
    <main className="result-page">
      <section className="result-page__header">
        <p className="result-page__label">MATCH RESULT</p>
        <h1>PLAYER 1 WIN!</h1>
        <p>激しい試合、お疲れさまでした</p>
      </section>

      <section className="result-page__players">
        <article className="result-player result-player--winner">
          <span className="result-player__status">WINNER</span>

          <img
            src={heroImage}
            alt="PLAYER 1"
            className="result-player__image"
          />

          <h2>PLAYER 1</h2>

          <dl className="result-player__stats">
            <div>
              <dt>パンチ数</dt>
              <dd>128</dd>
            </div>

            <div>
              <dt>ヒット数</dt>
              <dd>84</dd>
            </div>

            <div>
              <dt>スコア</dt>
              <dd>9200</dd>
            </div>
          </dl>
        </article>

        <div className="result-page__versus">VS</div>

        <article className="result-player">
          <span className="result-player__status">LOSE</span>

          <img
            src={hero2Image}
            alt="PLAYER 2"
            className="result-player__image"
          />

          <h2>PLAYER 2</h2>

          <dl className="result-player__stats">
            <div>
              <dt>パンチ数</dt>
              <dd>116</dd>
            </div>

            <div>
              <dt>ヒット数</dt>
              <dd>72</dd>
            </div>

            <div>
              <dt>スコア</dt>
              <dd>8150</dd>
            </div>
          </dl>
        </article>
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