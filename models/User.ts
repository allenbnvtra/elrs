import { ObjectId, Collection } from "mongodb";
import clientPromise from "@/lib/mongodb";

export type UserRole     = "admin" | "faculty" | "student";
export type CourseType   = "BSGE" | "BSABEN";
export type StudentStatus = "pending" | "approved" | "rejected";
export type YearLevel    = "1" | "2" | "3" | "4";

const SALT_ROUNDS = 12;

export interface BaseUser {
  _id?: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Student extends BaseUser {
  role: "student";
  studentNumber: string;
  course: CourseType;
  yearLevel?: YearLevel;   // "1" | "2" | "3" | "4"
  section?: string;        // e.g. "A", "B", "1A"
  status: StudentStatus;
  enrolledCourseIds: ObjectId[];
  approvedBy?: ObjectId;
  approvedByName?: string;
  approvedAt?: Date;
}

export interface Faculty extends BaseUser {
  role: "faculty";
  course: CourseType;
  department: string;
  status: StudentStatus;
  courseIdsTeaching: ObjectId[];
  approvedBy?: ObjectId;
  approvedByName?: string;
  approvedAt?: Date;
  contributions?: number;
  lastActive?: Date;
  bio?: string;
}

export interface Admin extends BaseUser {
  role: "admin";
  bio?: string;
}

export type User = Student | Faculty | Admin;

export function sanitizeUser(user: User) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

async function getCollection(): Promise<Collection<User>> {
  const client = await clientPromise;
  return client.db().collection<User>("users");
}