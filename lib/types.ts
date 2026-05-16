export type Score = 1 | 2 | 3 | 4 | 5;

export type DailyLog = {
  id: string;
  date: string;
  createdAt: string;
  face: {
    skin: Score;
    hair: Score;
    eyebrows: Score;
    fatigue: Score;
    puffiness: Score;
  };
  body: {
    trained: boolean;
    weight?: number;
    posture: Score;
  };
  food: {
    sweets: boolean;
    juice: boolean;
    lowCarb: boolean;
    vegetables: boolean;
    water?: number;
  };
  mind: {
    mental: Score;
    confidence: Score;
    stress: Score;
  };
  presence: {
    blackFit: Score;
    composedOutside: Score;
    ignoredGaze: Score;
    enteredStores: Score;
  };
  memo: {
    note: string;
    good: string;
    tomorrow: string;
  };
};

export type Quest = {
  id: string;
  title: string;
  stars: string;
  completed: boolean;
  completedAt?: string;
};

export type CategoryScores = {
  face: number;
  body: number;
  food: number;
  mind: number;
  presence: number;
  total: number;
};
