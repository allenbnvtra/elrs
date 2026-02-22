import { NextRequest, NextResponse } from "next/server";
import clientPromise, { dbName } from "@/lib/mongodb";
import { hashPassword } from "@/lib/auth";
import { User } from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token and new password are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const client   = await clientPromise;
    const db       = client.db(dbName);
    const usersCol = db.collection<User>("users");

    const user = await usersCol.findOne({
      passwordResetToken:  token,
      passwordResetExpiry: { $gt: new Date() }, // not expired
    });

    if (!user) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired. Please request a new one." },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(password);

    await usersCol.updateOne(
      { _id: user._id },
      {
        $set:   { passwordHash: newHash, updatedAt: new Date() },
        $unset: { passwordResetToken: "", passwordResetExpiry: "" },
      }
    );

    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("POST /api/auth/reset-password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}