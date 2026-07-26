type ConnectionPageProps = {
  onConnected: () => void;
};

export default function ConnectionPage({
  onConnected,
}: ConnectionPageProps) {
  return (
    <main>
      <h1>接続画面</h1>

      <button type="button" onClick={onConnected}>
        両プレイヤー接続完了
      </button>
    </main>
  );
}