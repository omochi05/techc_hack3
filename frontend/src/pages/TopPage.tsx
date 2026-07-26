import refereeImage from "../assets/referee.png";

type TopPageProps = {
  onStart: () => void;
};

export default function TopPage({
  onStart,
}: TopPageProps) {
  return (
    <main className="top-page">
      <section className="top-page__container">
        <header className="top-page__header">
          <div className="top-page__brand">
            <div className="top-page__brand-icon">
              🥊
            </div>

            <div>
              <p className="top-page__brand-subtitle">
                BOXING MATCH MANAGEMENT SYSTEM
              </p>

              <h1 className="top-page__brand-title">
                ボクシング試合管理システム
              </h1>
            </div>
          </div>

          <div className="top-page__system-status">
            <span
              className="top-page__system-dot"
              aria-hidden="true"
            />

            SYSTEM READY
          </div>
        </header>

        <div className="top-page__main">
          <section className="top-page__introduction">
            <p className="top-page__eyebrow">
              IoT BOXING SYSTEM
            </p>

            <h2 className="top-page__headline">
              データで見える、
              <br />
              新しいボクシング体験
            </h2>

            <p className="top-page__description">
              IoTグローブから取得したパンチデータと
              心拍数をリアルタイムに分析します。
              試合結果だけでなく、選手の健康状態まで
              一つのシステムで確認できます。
            </p>

            <div className="top-page__features">
              <div className="top-page__feature">
                <span className="top-page__feature-icon">
                  🥊
                </span>

                <div>
                  <strong>パンチ分析</strong>
                  <span>
                    速度・威力・ヒット数を計測
                  </span>
                </div>
              </div>

              <div className="top-page__feature">
                <span className="top-page__feature-icon">
                  ❤️
                </span>

                <div>
                  <strong>健康状態</strong>
                  <span>
                    心拍数と運動強度を分析
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="top-page__start-button"
              onClick={onStart}
            >
              <span>試合を始める</span>
              <span aria-hidden="true">→</span>
            </button>

            <p className="top-page__guide">
              デバイス接続画面へ進みます
            </p>
          </section>

          <section
            className="top-page__visual"
            aria-label="システム案内"
          >
            <div className="top-page__visual-ring top-page__visual-ring--outer" />
            <div className="top-page__visual-ring top-page__visual-ring--inner" />

            <div className="top-page__character-glow" />

            <img
              src={refereeImage}
              alt="ボクシング試合管理システムの案内ロボット"
              className="top-page__character"
            />

            <div className="top-page__data-card top-page__data-card--punch">
              <span>MAX POWER</span>
              <strong>72.1</strong>
            </div>

            <div className="top-page__data-card top-page__data-card--heart">
              <span>HEART RATE</span>
              <strong>138 bpm</strong>
            </div>
          </section>
        </div>

        <footer className="top-page__footer">
          <span>IoT BOXING PROJECT</span>
          <span>COMMUTATOR ONLINE</span>
        </footer>
      </section>
    </main>
  );
}