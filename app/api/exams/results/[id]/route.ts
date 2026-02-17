import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";

// ─── GET /api/exams/results/[id] ──────────────────────────────────────────────
// Returns detailed results for a specific exam session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(id)
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId || !ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Valid userId is required" }, { status: 400 });
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid exam session ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const examResultsCol = db.collection("examResults");

    // Find the exam result
    const result = await examResultsCol.findOne({
      examSessionId: new ObjectId(id),
      userId: new ObjectId(userId),
    });

    if (!result) {
      return NextResponse.json({ error: "Exam result not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/exams/results/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}