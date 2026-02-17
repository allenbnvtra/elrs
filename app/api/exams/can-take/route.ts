import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";

// ─── GET /api/exams/can-take ──────────────────────────────────────────────────
// Checks if student can take an exam (1 per subject/area per day)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const course = searchParams.get("course");
    const subject = searchParams.get("subject");
    const area = searchParams.get("area");

    if (!userId || !course || !subject) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const examSessionsCol = db.collection("examSessions");

    // Get start of today (midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build query
    const query: any = {
      userId: new ObjectId(userId),
      course,
      subject,
      startedAt: { $gte: today },
      status: { $in: ["in-progress", "completed"] }, // Count both ongoing and completed
    };

    // For BSABEN, also check area
    if (course === "BSABEN" && area) {
      query.area = area;
    }

    // Check if exam was taken today
    const existingExam = await examSessionsCol.findOne(query);

    if (existingExam) {
      return NextResponse.json({
        canTake: false,
        reason: "daily_limit",
        message: `You've already taken an exam for ${subject}${area ? ` (${area})` : ""} today. Please try again tomorrow.`,
        lastExamAt: existingExam.startedAt,
      });
    }

    return NextResponse.json({
      canTake: true,
      message: "You can take this exam.",
    });
  } catch (error) {
    console.error("GET /api/exams/can-take error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}