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
  min?: number;
  example?: string;
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
  options?: string[]; // For multiple choice
  answer?: string | string[] | { key: string; text: string }[]; // For gap-fill or multiple choice
  example?: string; // For speaking/writing sample answers
  topic?: string; // For speaking part 3
  exampleQuestion?: string[]; // For speaking part 3 (multiple questions per block)
}
