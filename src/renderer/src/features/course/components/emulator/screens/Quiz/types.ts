export interface PronunciationDrillItem {
  id: string;
  text: string; // Word or phrase to pronounce
  ipa: string; // IPA phonetic transcription
  translate: string; // Vietnamese translation
  hiddenWord?: string; // For phrases: word to hide until success
}

export interface SentenceBuilderItem {
  id: string;
  words: string[]; // Shuffled word blocks
  correctOrder: number[]; // Correct indices order
  translate?: string; // Vietnamese translation hint
}

export interface SentenceTransformationItem {
  id: string;
  original: string; // Original sentence
  keyword: string; // Keyword that must be used
  answer: string | string[]; // Correct answer(s)
  explain?: string; // Explanation
}

export interface Quiz {
  id: string;
  title: string;
  type: string; // 'gap-fill' | 'multiple-choice' | 'pronunciation-drill' | 'sentence-builder' | 'sentence-transformation'
  question: string;
  audio?: string; // Path to audio file
  passage?: string; // Path to passage file
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
  chats?: ChatMessage[];
  drills?: PronunciationDrillItem[]; // For pronunciation drill quizzes
  sentences?: SentenceBuilderItem[]; // For sentence builder quizzes
  transformations?: SentenceTransformationItem[]; // For sentence transformation quizzes
}

export interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  content: string;
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
  options?: string[]; // For multiple choice (now just text values, no keys)
  answer?: string | string[]; // For gap-fill or multiple choice (text value)
  answers?: string[]; // For multiple-answer questions (text values)
  example?: string; // For speaking/writing sample answers
  topic?: string; // For speaking part 3
  exampleQuestion?: string[]; // For speaking part 3 (multiple questions per block)
  explain?: string; // For explanation of the answer
}
