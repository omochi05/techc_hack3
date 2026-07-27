import {
  useState,
  type FormEvent,
} from "react";

import {
  analyzeActivity,
  calculateStatus,
} from "../api/activityApi";

import type {
  ActivityFormData,
  ActivityPayload,
  AnalysisResult,
  CharacterStatus,
  MessageType,
  StatusCalculationResponse,
} from "../types/activity";

const initialCharacter: CharacterStatus = {
  name: "ゼティス",
  title: "始まりの冒険者",
  level: 12,

  hp: 820,
  maxHp: 1000,

  strength: 68,
  maxStrength: 100,

  intelligence: 54,
  maxIntelligence: 100,

  experience: 720,
  nextLevelExperience: 1000,

  condition: "良好",
};

const initialActivityForm: ActivityFormData = {
  steps: "",
  heartRate: "",
  studyMinutes: "",
  sleepHours: "",
  activityType: "",
  memo: "",
};

export function useActivity() {
  const [
    character,
    setCharacter,
  ] = useState<CharacterStatus>(
    initialCharacter,
  );

  const [
    activityForm,
    setActivityForm,
  ] = useState<ActivityFormData>(
    initialActivityForm,
  );

  const [
    calculationResult,
    setCalculationResult,
  ] =
    useState<StatusCalculationResponse | null>(
      null,
    );

  const [
    analysisResult,
    setAnalysisResult,
  ] = useState<AnalysisResult | null>(
    null,
  );

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    messageType,
    setMessageType,
  ] = useState<MessageType>("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    levelUpMessage,
    setLevelUpMessage,
  ] = useState("");

  const updateField = (
    field: keyof ActivityFormData,
    value: string,
  ): void => {
    setActivityForm(
      (previousForm) => ({
        ...previousForm,
        [field]: value,
      }),
    );

    setMessage("");
    setMessageType("");
  };

  const createPayload =
    (): ActivityPayload => {
      if (
        activityForm.activityType === ""
      ) {
        throw new Error(
          "活動内容を選択してください。",
        );
      }

      return {
        steps: Number(
          activityForm.steps,
        ),

        heart_rate:
          activityForm.heartRate === ""
            ? null
            : Number(
                activityForm.heartRate,
              ),

        study_minutes: Number(
          activityForm.studyMinutes,
        ),

        sleep_hours: Number(
          activityForm.sleepHours,
        ),

        activity_type:
          activityForm.activityType,

        memo:
          activityForm.memo.trim() === ""
            ? undefined
            : activityForm.memo.trim(),
      };
    };

  const applyStatusResult = (
    result: StatusCalculationResponse,
  ): void => {
    setCharacter(
      (previousCharacter) => {
        let nextLevel =
          previousCharacter.level;

        let nextExperience =
          previousCharacter.experience +
          result.experience_gain;

        let nextLevelExperience =
          previousCharacter
            .nextLevelExperience;

        let nextMaxHp =
          previousCharacter.maxHp;

        let nextMaxStrength =
          previousCharacter.maxStrength;

        let nextMaxIntelligence =
          previousCharacter.maxIntelligence;

        while (
          nextExperience >=
          nextLevelExperience
        ) {
          nextExperience -=
            nextLevelExperience;

          nextLevel += 1;

          nextLevelExperience += 200;
          nextMaxHp += 30;
          nextMaxStrength += 3;
          nextMaxIntelligence += 3;
        }

        if (
          nextLevel >
          previousCharacter.level
        ) {
          setLevelUpMessage(
            `🎉 LEVEL UP !! Lv.${nextLevel}`,
          );
        }

        return {
          ...previousCharacter,

          level: nextLevel,

          hp: Math.min(
            previousCharacter.hp +
              result.hp_gain,
            nextMaxHp,
          ),

          maxHp: nextMaxHp,

          strength: Math.min(
            previousCharacter.strength +
              result.strength_gain,
            nextMaxStrength,
          ),

          maxStrength:
            nextMaxStrength,

          intelligence: Math.min(
            previousCharacter.intelligence +
              result.intelligence_gain,
            nextMaxIntelligence,
          ),

          maxIntelligence:
            nextMaxIntelligence,

          experience: nextExperience,

          nextLevelExperience,

          condition:
            result.condition_label,
        };
      },
    );
  };

  const validateForm = (): boolean => {
    if (
      activityForm.steps === "" ||
      activityForm.studyMinutes === "" ||
      activityForm.sleepHours === "" ||
      activityForm.activityType === ""
    ) {
      setMessage(
        "必須項目を入力してください。",
      );

      setMessageType("error");

      return false;
    }

    const steps = Number(
      activityForm.steps,
    );

    const studyMinutes = Number(
      activityForm.studyMinutes,
    );

    const sleepHours = Number(
      activityForm.sleepHours,
    );

    const heartRate =
      activityForm.heartRate === ""
        ? null
        : Number(
            activityForm.heartRate,
          );

    if (
      Number.isNaN(steps) ||
      Number.isNaN(studyMinutes) ||
      Number.isNaN(sleepHours) ||
      (
        heartRate !== null &&
        Number.isNaN(heartRate)
      )
    ) {
      setMessage(
        "数値項目を正しく入力してください。",
      );

      setMessageType("error");

      return false;
    }

    if (
      steps < 0 ||
      studyMinutes < 0 ||
      sleepHours < 0 ||
      (
        heartRate !== null &&
        heartRate < 0
      )
    ) {
      setMessage(
        "0以上の数値を入力してください。",
      );

      setMessageType("error");

      return false;
    }

    return true;
  };

  const submitActivity = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setMessageType("");
    setLevelUpMessage("");
    setCalculationResult(null);
    setAnalysisResult(null);

    try {
      const payload =
        createPayload();

      const [
        statusResult,
        activityAnalysis,
      ] = await Promise.all([
        calculateStatus(payload),
        analyzeActivity(payload),
      ]);

      setCalculationResult(
        statusResult,
      );

      setAnalysisResult(
        activityAnalysis,
      );

      applyStatusResult(
        statusResult,
      );

      setMessage(
        "活動データを登録し、ステータスを更新しました。",
      );

      setMessageType("success");
    } catch (error) {
      console.error(
        "活動登録エラー:",
        error,
      );

      const errorMessage =
        error instanceof Error
          ? error.message
          : "APIとの通信に失敗しました。";

      setMessage(errorMessage);
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = (): void => {
    setActivityForm({
      ...initialActivityForm,
    });

    setCalculationResult(null);
    setAnalysisResult(null);
    setLevelUpMessage("");
    setMessage("");
    setMessageType("");
  };

  return {
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
  };
}