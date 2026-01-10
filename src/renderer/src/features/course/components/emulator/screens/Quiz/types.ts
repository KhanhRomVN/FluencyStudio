export interface PronunciationDrillItem {
  id: string;
  text: string; // Word or phrase to pronounce
  ipa: string; // IPA phonetic transcription
  translate: string; // Vietnamese translation
  hiddenWord?: string; // For phrases: word to hide until success
}

export interface BuilderItem {
  id: string;
  items?: string[]; // Shuffled word/phrase/sentence blocks
  correctOrder?: number[]; // Correct indices order
  question?: string; // HTML string with <gap> tags for speech builder
  answers?: { id: string; answer: string }[]; // Correct answers for gaps
  hint?: string; // text or HTML context
  explain?: string; // Explanation using HTML
}

export interface SentenceTransformationItem {
  id: string;
  original: string; // Original sentence
  keyword: string; // Keyword that must be used
  answer: string | string[]; // Correct answer(s)
  explain?: string; // Explanation
}

// For dictation quizzes
export interface DictationItem {
  id: string;
  audio?: string; // If present, use audio file. Requires transcript.
  transcript?: string; // The correct text to match against when using audio.
  text?: string; // If present (and no audio), use TTS. This is the correct text.
  translate?: string;
  speed?: number; // Only used for TTS (text mode). Ignored/Invalid for audio mode.
}

export interface ErrorCorrectionItem {
  id: string;
  sentence: string; // "I has a cat"
  error: string; // "has"
  correction: string; // "have"
  explain?: string;
}

export interface FlashcardItem {
  id: string;
  front: string; // Text or Question
  back: string; // Answer or Definition
  frontAudio?: string;
  backAudio?: string;
  image?: string;
}

export interface Quiz {
  id: string;
  title: string;
  type: string; // 'gap-fill' | 'multiple-choice' | 'pronunciation-drill' | 'sentence-builder' | 'sentence-transformation' | 'dictation' | 'error-correction' | 'flashcard'
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
  builders?: BuilderItem[]; // For builder quizzes (words, phrases, sentences)
  sentences?: BuilderItem[]; // Deprecated: For backward compatibility
  transformations?: SentenceTransformationItem[]; // For sentence transformation quizzes
  dictations?: DictationItem[]; // For dictation quizzes
  errorCorrections?: ErrorCorrectionItem[]; // For error correction quizzes
  flashcards?: FlashcardItem[]; // For flashcard quizzes
}

export interface ChatMessage {
  id: string;
  role: string; // Occupation/position: "Teacher", "Student", etc.
  name?: string | null; // Optional character name
  question: string; // All messages use question field (with translate attribute in <p> tags)
  time?: string; // Time of message
  isUser: boolean; // Identifies if this message belongs to the user
  explain?: string | null; // Optional explanation shown after completion
  ipa?: string | null; // Optional IPA pronunciation guide
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
  original?: string; // For sentence transformation
  require?: string; // For sentence transformation requirement
}
