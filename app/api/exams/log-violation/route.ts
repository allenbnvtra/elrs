import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";

// ─── POST /api/exams/log-violation ────────────────────────────────────────────
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
    const db     = client.db(dbName);
    const examSessionsCol = db.collection("examSessions");

    // Only allow logging on active sessions
    const examSession = await examSessionsCol.findOne({
      _id:    new ObjectId(examSessionId),
      userId: new ObjectId(userId),
      status: "in-progress",
    });

    if (!examSession) {
      return NextResponse.json(
        { error: "Exam session not found or already completed" },
        { status: 404 }
      );
    }

    const violation = {
      type:      violationType,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    };

    // Use the DB's stored violationCount as source of truth
    const newViolationCount = (examSession.violationCount ?? 0) + 1;
    const shouldAutoSubmit  = newViolationCount >= 3;

    await examSessionsCol.updateOne(
      { _id: new ObjectId(examSessionId) },
      {
        $push: { violations: violation } as any,
        $set: {
          violationCount: newViolationCount,
          updatedAt: new Date(),
          // Pre-flag the session so submit route picks it up correctly
          ...(shouldAutoSubmit && {
            wasFlagged: true,
            status:     "flagged",
          }),
        },
      }
    );

    return NextResponse.json({
      success:        true,
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