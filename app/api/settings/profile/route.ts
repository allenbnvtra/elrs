import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { User, YearLevel } from "@/models/User";

const VALID_YEAR_LEVELS: YearLevel[] = ["1", "2", "3", "4"];

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, email, bio, course, yearLevel, section } = body;

    // ── Validation ──────────────────────────────────────────────────────────
    if (!userId || !name || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (yearLevel && !VALID_YEAR_LEVELS.includes(yearLevel)) {
      return NextResponse.json(
        { error: "Invalid year level. Must be 1, 2, 3, or 4." },
        { status: 400 }
      );
    }

    if (course && !["BSGE", "BSABEN"].includes(course)) {
      return NextResponse.json(
        { error: "Invalid course. Must be BSGE or BSABEN." },
        { status: 400 }
      );
    }

    // ── DB ───────────────────────────────────────────────────────────────────
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection<User>("users");

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check email uniqueness
    const emailExists = await usersCollection.findOne({
      email,
      _id: { $ne: new ObjectId(userId) },
    });
    if (emailExists) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
      );
    }

    // ── Build update payload ─────────────────────────────────────────────────
    const updateData: Record<string, any> = {
      name,
      email,
      updatedAt: new Date(),
    };

    if (user.role === "admin" || user.role === "faculty") {
      updateData.bio = bio || "";
    }

    if (user.role === "student") {
      // course
      if (course) updateData.course = course;

      // yearLevel — store as string "1"–"4", or unset if empty
      if (yearLevel) {
        updateData.yearLevel = yearLevel as YearLevel;
      } else {
        updateData.yearLevel = null;
      }

      // section — trim whitespace, allow empty to clear
      updateData.section = section ? String(section).trim() : "";
    }

    // ── Persist ──────────────────────────────────────────────────────────────
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "No changes were made" },
        { status: 400 }
      );
    }

    const updatedUser = await usersCollection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { passwordHash: 0 } }
    );

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}