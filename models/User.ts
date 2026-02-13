import { ObjectId, Collection } from "mongodb";
import bcrypt from "bcrypt";
import clientPromise from "@/lib/mongodb";

export type UserRole = "admin" | "faculty" | "student";
export type CourseType = "BSGE" | "BSABE";
export type StudentStatus = "pending" | "approved" | "rejected";

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
  status: StudentStatus; // "pending" | "approved" | "rejected"
  courseIdsTeaching: ObjectId[];
  approvedBy?: ObjectId;
  approvedByName?: string;
  approvedAt?: Date;
  contributions?: number; // Track number of questions added
  lastActive?: Date;
  bio?: string; // Optional bio for faculty
}

export interface Admin extends BaseUser {
  role: "admin";
  bio?: string; // Optional bio for admin
}

export type User = Student | Faculty | Admin;

// Remove passwordHash when sending user to frontend
export function sanitizeUser(user: User) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

async function getCollection(): Promise<Collection<User>> {
  const client = await clientPromise;
  return client.db().collection<User>("users");
}