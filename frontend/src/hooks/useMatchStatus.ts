import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getMatchStatus,
} from "../api/matchStatusApi";

import type {
  MatchStatus,
} from "../types/matchStatus";

const MATCH_STATUS_POLLING_INTERVAL = 1000;

type UseMatchStatusResult = {
  matchStatus: MatchStatus | null;
  isLoading: boolean;
  error: string | null;
  refreshMatchStatus: () => Promise<void>;
};

export function useMatchStatus():
UseMatchStatusResult {
  const [
    matchStatus,
    setMatchStatus,
  ] = useState<MatchStatus | null>(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const refreshMatchStatus =
    useCallback(async (): Promise<void> => {
      try {
        const status =
          await getMatchStatus();

        setMatchStatus(status);
        setError(null);
      } catch (requestError) {
        console.error(
          "試合ステータスの取得に失敗しました",
          requestError,
        );

        setError(
          "試合ステータスを取得できませんでした",
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    void refreshMatchStatus();

    const pollingTimer =
      window.setInterval(() => {
        void refreshMatchStatus();
      }, MATCH_STATUS_POLLING_INTERVAL);

    return () => {
      window.clearInterval(
        pollingTimer,
      );
    };
  }, [refreshMatchStatus]);

  return {
    matchStatus,
    isLoading,
    error,
    refreshMatchStatus,
  };
}