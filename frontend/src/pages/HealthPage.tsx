type HealthPageProps = {
  onBackToTop: () => void;
};

export default function HealthPage({
  onBackToTop,
}: HealthPageProps) {
  return (
    <main>
      <h1>健康状態画面</h1>

      <button type="button" onClick={onBackToTop}>
        トップへ戻る
      </button>
    </main>
  );
}