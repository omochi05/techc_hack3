import "./App.css";
import { useState } from "react";

import ConnectionPage from "./pages/ConnectionPage";
import HealthPage from "./pages/HealthPage";
import MatchPage from "./pages/MatchPage";
import ResultPage from "./pages/ResultPage";
import TopPage from "./pages/TopPage";
import type { MatchResult } from "./types/matchResult";

type Screen =
  | "top"
  | "connection"
  | "match"
  | "result"
  | "health";

export default function App() {
  const [screen, setScreen] = useState<Screen>("top");
  const [matchResult, setMatchResult] =
    useState<MatchResult | null>(null);

  const handleStart = (): void => {
    setMatchResult(null);
    setScreen("connection");
  };

  const handleMatchFinish = (result: MatchResult): void => {
    setMatchResult(result);
    setScreen("result");
  };

  switch (screen) {
    case "top":
      return <TopPage onStart={handleStart} />;

    case "connection":
      return (
        <ConnectionPage
          onConnected={() => setScreen("match")}
        />
      );

    case "match":
      return <MatchPage onFinish={handleMatchFinish} />;

    case "result":
      if (matchResult === null) {
        return <TopPage onStart={handleStart} />;
      }

      return (
        <ResultPage
          result={matchResult}
          onNext={() => setScreen("health")}
        />
      );

    case "health":
      return (
        <HealthPage
          onBackToTop={() => {
            setMatchResult(null);
            setScreen("top");
          }}
        />
      );

    default:
      return <TopPage onStart={handleStart} />;
  }
}