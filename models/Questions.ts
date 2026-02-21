import { ObjectId, Collection } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";

export type DifficultyType = "Easy" | "Medium" | "Hard";
export type CourseType = "BSABEN" | "BSGE";
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
  
  // BSABE has area + subject, BSGE only has subject
  area?: string;  // Optional - only for BSABEN
  subject: string;
  
  explanation?: string;
  isActive: boolean;  // NEW: Active/Inactive status
  createdBy: ObjectId;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Area {
  _id?: ObjectId;
  name: string;
  description?: string;
  course: CourseType;  // Always BSABEN
  timer: number;  // Time in seconds for the timer
  createdBy: ObjectId;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subject {
  _id?: ObjectId;
  name: string;
  description?: string;
  course: CourseType;
  area?: string;  // Optional - only for BSABEN
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
  isActive: boolean;
  area?: string;  // Optional - only for BSABEN
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

async function getQuestionsCollection(): Promise<Collection<Question>> {
  const client = await clientPromise;
  return client.db(dbName).collection<Question>("questions");
}

async function getAreasCollection(): Promise<Collection<Area>> {
  const client = await clientPromise;
  return client.db(dbName).collection<Area>("areas");
}

async function getSubjectsCollection(): Promise<Collection<Subject>> {
  const client = await clientPromise;
  return client.db(dbName).collection<Subject>("subjects");
}

export { getQuestionsCollection, getAreasCollection, getSubjectsCollection };