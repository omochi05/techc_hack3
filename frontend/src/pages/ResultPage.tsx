type ResultPageProps = {
  onNext: () => void;
};

export default function ResultPage({
  onNext,
}: ResultPageProps) {
  return (
    <main>
      <h1>リザルト画面</h1>

      <button type="button" onClick={onNext}>
        健康状態を確認
      </button>
    </main>
  );
}