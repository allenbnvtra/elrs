import { ObjectId } from "mongodb";

export interface Response {
  _id?: ObjectId;
  studentId: string;
  questionId: ObjectId;
  course: "BSABEN" | "BSGE";
  selectedAnswer: "A" | "B" | "C" | "D";
  isCorrect: boolean;
  submittedAt: Date;
}