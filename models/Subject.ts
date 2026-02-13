import { ObjectId, Collection } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";

export type CourseType = "BSABE" | "BSGE";

export interface Subject {
  _id?: ObjectId;
  name: string;
  description?: string;
  course: CourseType;
  createdBy: ObjectId;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
  questionCount?: number; // Virtual field for count
}

async function getCollection(): Promise<Collection<Subject>> {
  const client = await clientPromise;
  return client.db(dbName).collection<Subject>("subjects");
}

export { getCollection };