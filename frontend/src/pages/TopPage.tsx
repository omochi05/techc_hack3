type TopPageProps = {
  onStart: () => void;
};

export default function TopPage({
  onStart,
}: TopPageProps) {
  return (
    <main>
      <h1>IoT Boxing</h1>

      <button type="button" onClick={onStart}>
        試合を始める
      </button>
    </main>
  );
}