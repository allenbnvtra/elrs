export interface Subject {
  _id: string;
  name: string;
  description?: string;
  course: string;
  area?: string;
  timer?: number;
  questionCount: number;
  createdAt: string;
}

export interface Question {
  _id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC?: string;
  optionD?: string;
  correctAnswer: "A" | "B" | "C" | "D";
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  subject: string;
  explanation?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; reason: string; text: string }>;
  duplicatesInFile: Array<{ row: number; text: string }>;
  duplicatesInDb: Array<{ row: number; text: string }>;
}

export interface ParsedQuestion {
  questionNumber: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC?: string;
  optionD?: string;
  correctAnswer?: string;
  category?: string;
  difficulty?: string;
  subject?: string;
}

export type FormData = {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: "A" | "B" | "C" | "D";
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  subject: string;
  explanation: string;
  isActive: boolean;
};