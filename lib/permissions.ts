import { UserRole } from "@/types/user";


export function isAdmin(role: UserRole) {
  return role === "admin";
}

export function isFaculty(role: UserRole) {
  return role === "faculty";
}

export function isStudent(role: UserRole) {
  return role === "student";
}
