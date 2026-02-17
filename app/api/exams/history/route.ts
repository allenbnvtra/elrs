import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";

// ─── GET /api/exams/history ────────────────────────────────────────────────────
// Returns user's exam history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const course = searchParams.get("course");
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");

    if (!userId || !ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Valid userId is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const examResultsCol = db.collection("examResults");

    // Build query
    const query: any = { userId: new ObjectId(userId) };
    if (course) query.course = course;

    // Get total count
    const total = await examResultsCol.countDocuments(query);

    // Get paginated results
    const results = await examResultsCol
      .find(query)
      .sort({ completedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // Calculate statistics
    const stats = await examResultsCol
      .aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalExams: { $sum: 1 },
            averageScore: { $avg: "$score" },
            highestScore: { $max: "$score" },
            lowestScore: { $min: "$score" },
            totalQuestions: { $sum: "$totalQuestions" },
            totalCorrect: { $sum: "$correctCount" },
          },
        },
      ])
      .toArray();

    return NextResponse.json({
      results: results.map((r) => ({
        _id: r._id,
        examSessionId: r.examSessionId,
        course: r.course,
        area: r.area,
        subject: r.subject,
        score: r.score,
        percentage: r.percentage,
        correctCount: r.correctCount,
        totalQuestions: r.totalQuestions,
        startedAt: r.startedAt,
        completedAt: r.completedAt,
        timeTaken: r.timeTaken,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      statistics: stats[0] || {
        totalExams: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        totalQuestions: 0,
        totalCorrect: 0,
      },
    });
  } catch (error) {
    console.error("GET /api/exams/history error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}