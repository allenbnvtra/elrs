import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId  = searchParams.get("userId");
    const course  = searchParams.get("course");
    const subject = searchParams.get("subject");
    const area    = searchParams.get("area");

    if (!userId || !course || (!subject && !area)) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db     = client.db(dbName);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const query: any = {
      userId:    new ObjectId(userId),
      course,
      startedAt: { $gte: today },
      status:    { $in: ["in-progress", "completed"] },
    };

    if (subject) query.subject = subject;
    if (area)    query.area    = area;

    const existingExam = await db.collection("examSessions").findOne(query);

    if (existingExam) {
      return NextResponse.json({
        canTake:    false,
        reason:     "daily_limit",
        message:    `You've already taken an exam for ${subject || area} today. Please try again tomorrow.`,
        lastExamAt: existingExam.startedAt,
      });
    }

    return NextResponse.json({ canTake: true, message: "You can take this exam." });
  } catch (error) {
    console.error("GET /api/exams/can-take error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}