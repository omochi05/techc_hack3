import { useState } from "react";

import ConnectionPage from "./pages/ConnectionPage";
import HealthPage from "./pages/HealthPage";
import MatchPage from "./pages/MatchPage";
import ResultPage from "./pages/ResultPage";
import TopPage from "./pages/TopPage";

type Screen =
  | "top"
  | "connection"
  | "match"
  | "result"
  | "health";

export default function App() {
  const [screen, setScreen] = useState<Screen>("top");

  switch (screen) {
    case "top":
      return (
        <TopPage
          onStart={() => setScreen("connection")}
        />
      );

    case "connection":
      return (
        <ConnectionPage
          onConnected={() => setScreen("match")}
        />
      );

    case "match":
      return (
        <MatchPage
          onFinish={() => setScreen("result")}
        />
      );

    case "result":
      return (
        <ResultPage
          onNext={() => setScreen("health")}
        />
      );

    case "health":
      return (
        <HealthPage
          onBackToTop={() => setScreen("top")}
        />
      );

    default:
      return (
        <TopPage
          onStart={() => setScreen("connection")}
        />
      );
  }
}