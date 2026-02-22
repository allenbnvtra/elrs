
// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/auth/forgot-password/route.ts
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import clientPromise, { dbName } from "@/lib/mongodb";
import { User } from "@/models/User";
import { sendPasswordResetEmail } from "@/lib/email"; // see note below

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db     = client.db(dbName);
    const usersCol = db.collection<User>("users");

    const user = await usersCol.findOne({ email: email.toLowerCase() });

    // Always return 200 to avoid user enumeration
    if (!user) {
      return NextResponse.json({ message: "If that email exists, a reset link has been sent." });
    }

    // Generate a secure random token
    const resetToken  = crypto.randomBytes(32).toString("hex");
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await usersCol.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordResetToken:  resetToken,
          passwordResetExpiry: resetExpiry,
          updatedAt: new Date(),
        },
      }
    );

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });

    return NextResponse.json({ message: "If that email exists, a reset link has been sent." });
  } catch (error) {
    console.error("POST /api/auth/forgot-password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}