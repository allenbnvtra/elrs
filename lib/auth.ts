import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET     = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";
const SALT_ROUNDS    = 12;

export interface JWTPayload {
  userId: string;
  email:  string;
  role:   "admin" | "faculty" | "student";
  name:   string;
}

// Hash a plain-text password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Verify password against hash
export async function verifyPassword(
  password:       string,
  hashedPassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}

// Generate JWT token
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}