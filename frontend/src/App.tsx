import "./App.css";

import {
  ActivityForm,
} from "./components/activity/ActivityForm";

import {
  AnalysisCard,
} from "./components/activity/AnalysisCard";

import {
  CharacterCard,
} from "./components/character/CharacterCard";

import DeviceConnectButton from "./components/device/DeviceConnectButton";

import {
  useActivity,
} from "./hooks/useActivity";

function App() {
  const {
    character,
    activityForm,
    calculationResult,
    analysisResult,
    message,
    messageType,
    isSubmitting,
    levelUpMessage,
    updateField,
    submitActivity,
    resetForm,
  } = useActivity();

  return (
    <main className="app">
      <section className="status-screen">
        <header className="screen-header">
          <div>
            <p className="screen-eyebrow">
              CHARACTER PROFILE
            </p>

            <h1>
              キャラクターステータス
            </h1>
          </div>

          <div className="header-user-area">
            <div className="logged-in-user">
              <span>プレイヤー</span>

              <strong>
                ゲストユーザー
              </strong>
            </div>

            <span className="online-badge">
              <span
                className="online-dot"
                aria-hidden="true"
              />

              プレイ中
            </span>
          </div>
        </header>

        <CharacterCard
          character={character}
          calculationResult={
            calculationResult
          }
          levelUpMessage={
            levelUpMessage
          }
        />

        <section className="device-connect-preview">
          <h2>デバイス接続</h2>

          <div className="device-connect-preview__grid">
            <DeviceConnectButton
              deviceId="glove_1"
            />

            <DeviceConnectButton
              deviceId="glove_2"
            />
          </div>
        </section>

        <ActivityForm
          form={activityForm}
          message={message}
          messageType={
            messageType
          }
          isSubmitting={
            isSubmitting
          }
          onChange={
            updateField
          }
          onSubmit={
            submitActivity
          }
          onReset={
            resetForm
          }
        />

        {analysisResult !== null && (
          <AnalysisCard
            result={
              analysisResult
            }
          />
        )}
      </section>
    </main>
  );
}

export default App;