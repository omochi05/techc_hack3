import heroImage from "../assets/hero.png";
import hero2Image from "../assets/hero2.png";

type HealthPageProps = {
  onBackToTop: () => void;
};

export default function HealthPage({
  onBackToTop,
}: HealthPageProps) {
  return (
    <main className="health-page">
      <section className="health-page__header">
        <p className="health-page__label">
          HEALTH CHECK
        </p>

        <h1>試合後の健康状態</h1>

        <p>
          プレイヤーの心拍数と運動状態を確認します
        </p>
      </section>

      <section className="health-page__players">
        <article className="health-card">
          <div className="health-card__player">
            <img
              src={heroImage}
              alt="PLAYER 1"
              className="health-card__image"
            />

            <div>
              <p className="health-card__number">
                PLAYER 1
              </p>
              <h2>健康状態：良好</h2>
            </div>
          </div>

          <div className="health-card__status health-card__status--good">
            NORMAL
          </div>

          <dl className="health-card__details">
            <div>
              <dt>心拍数</dt>
              <dd>
                112
                <span>bpm</span>
              </dd>
            </div>

            <div>
              <dt>消費カロリー</dt>
              <dd>
                185
                <span>kcal</span>
              </dd>
            </div>

            <div>
              <dt>疲労度</dt>
              <dd>低</dd>
            </div>

            <div>
              <dt>判定</dt>
              <dd>休憩後に運動可能</dd>
            </div>
          </dl>
        </article>

        <article className="health-card">
          <div className="health-card__player">
            <img
              src={hero2Image}
              alt="PLAYER 2"
              className="health-card__image"
            />

            <div>
              <p className="health-card__number">
                PLAYER 2
              </p>
              <h2>健康状態：要休憩</h2>
            </div>
          </div>

          <div className="health-card__status health-card__status--warning">
            REST
          </div>

          <dl className="health-card__details">
            <div>
              <dt>心拍数</dt>
              <dd>
                148
                <span>bpm</span>
              </dd>
            </div>

            <div>
              <dt>消費カロリー</dt>
              <dd>
                210
                <span>kcal</span>
              </dd>
            </div>

            <div>
              <dt>疲労度</dt>
              <dd>中</dd>
            </div>

            <div>
              <dt>判定</dt>
              <dd>水分補給と休憩を推奨</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="health-page__notice">
        <h2>試合後の注意</h2>

        <p>
          十分な水分補給を行い、体調に異変を感じた場合は運動を中止してください。
        </p>
      </section>

      <button
        type="button"
        className="health-page__back-button"
        onClick={onBackToTop}
      >
        トップ画面へ戻る
        <span aria-hidden="true">→</span>
      </button>
    </main>
  );
}