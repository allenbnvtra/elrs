import { ObjectId, Collection } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";

export type DifficultyType = "Easy" | "Medium" | "Hard";
export type CourseType = "BSABE" | "BSGE";
export type CorrectAnswer = "A" | "B" | "C" | "D";

export interface Question {
  _id?: ObjectId;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC?: string;
  optionD?: string;
  correctAnswer: CorrectAnswer;
  difficulty: DifficultyType;
  category: string;
  course: CourseType;
  subject: string;
  explanation?: string;
  createdBy: ObjectId;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImportRow {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c?: string;
  option_d?: string;
  correct_answer: string;
  difficulty: string;
  category: string;
  course: string;
  subject: string;
  explanation?: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; reason: string; text: string }>;
  duplicatesInFile: Array<{ row: number; text: string }>;
  duplicatesInDb: Array<{ row: number; text: string }>;
}

async function getCollection(): Promise<Collection<Question>> {
  const client = await clientPromise;
  return client.db(dbName).collection<Question>("questions");
}

export { getCollection };