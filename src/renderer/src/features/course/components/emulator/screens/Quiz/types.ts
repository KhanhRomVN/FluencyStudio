export interface Quiz {
  id: string;
  title: string;
  type: string; // 'gap-fill' | 'multiple-choice'
  question: string;
  audio?: string; // Path to audio file
  transcript?: string;
  instruction?: string; // Added to match Dart's usage in MultipleChoice
  answers?: QuizAnswer[]; // Changed to object array to match Dart
  options?: { key: string; text: string }[] | string[];
  questions?: QuizQuestion[]; // For nested questions in MC
  matchings?: MatchingItem[];
  quizNumber?: number;
  subtype?: 'single-answer' | 'multi-answer';
}

export interface MatchingItem {
  id: string;
  question: string;
  answer: string;
  explain: string;
}

export interface QuizAnswer {
  id: string;
  answer: string | string[];
  explain: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: { key: string; text: string }[];
  answer?: string;
  answers?: string[];
  explain: string;
}
