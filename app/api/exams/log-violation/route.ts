import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";

// ─── POST /api/exams/log-violation ────────────────────────────────────────────
// Logs a cheating violation during exam
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { examSessionId, userId, violationType, timestamp } = body;

    if (!examSessionId || !userId || !violationType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(examSessionId) || !ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const examSessionsCol = db.collection("examSessions");

    // Get exam session
    const examSession = await examSessionsCol.findOne({
      _id: new ObjectId(examSessionId),
      userId: new ObjectId(userId),
      status: "in-progress",
    });

    if (!examSession) {
      return NextResponse.json(
        { error: "Exam session not found or already completed" },
        { status: 404 }
      );
    }

    // Log the violation
    const violation = {
      type: violationType,
      timestamp: timestamp || new Date(),
    };

    const newViolationCount = (examSession.violationCount || 0) + 1;
    const shouldAutoSubmit = newViolationCount >= 3;

    // Update exam session with violation
    await examSessionsCol.updateOne(
      { _id: new ObjectId(examSessionId) },
      {
        $push: { violations: violation } as any,
        $set: {
          violationCount: newViolationCount,
          ...(shouldAutoSubmit && {
            status: "flagged",
            wasFlagged: true,
          }),
        },
      }
    );

    return NextResponse.json({
      success: true,
      violationCount: newViolationCount,
      shouldAutoSubmit,
      message: shouldAutoSubmit
        ? "Too many violations detected. Exam will be auto-submitted."
        : `Violation logged. Warning ${newViolationCount}/3`,
    });
  } catch (error) {
    console.error("POST /api/exams/log-violation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}