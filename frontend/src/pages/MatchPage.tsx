type MatchPageProps = {
  onFinish: () => void;
};

export default function MatchPage({
  onFinish,
}: MatchPageProps) {
  return (
    <main>
      <h1>試合画面</h1>

      <button type="button" onClick={onFinish}>
        試合終了
      </button>
    </main>
  );
}