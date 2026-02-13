export type UserRole = "admin" | "faculty" | "student";

export interface BaseUser {
  _id?: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Student extends BaseUser {
  role: "student";
  studentId: string;
  enrolledCourseIds: string[];
}

export interface Faculty extends BaseUser {
  role: "faculty";
  facultyId: string;
  department: string;
  courseIdsTeaching: string[];
}

export interface Admin extends BaseUser {
  role: "admin";
}

export type User = Student | Faculty | Admin;
