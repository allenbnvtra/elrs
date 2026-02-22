import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";

// ─── GET /api/scores/stats ─────────────────────────────────────────────────────
// Per-course student performance stats (totalStudents, averageScore, passRate, excellentCount)
// Used by the dashboard's fetchCourseStats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const course = searchParams.get("course");
    const userId = searchParams.get("userId");

    if (!course) {
      return NextResponse.json({ error: "Missing course parameter" }, { status: 400 });
    }

    // Faculty auth check — scope to their own course
    if (userId) {
      if (!ObjectId.isValid(userId)) {
        return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
      }
      const client = await clientPromise;
      const db     = client.db(dbName);
      const user   = await db.collection("users").findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      if (user.role === "faculty" && (user as any).course !== course) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    const client = await clientPromise;
    const db     = client.db(dbName);

    // Aggregate per-student average from examResults, then summarise
    const [stats] = await db.collection("examResults")
      .aggregate([
        // Only count finished exams for this course
        { $match: {
            course,
            $or: [
              { status: { $in: ["completed", "flagged"] } },
              { status: { $exists: false } }, // legacy records without status field
            ],
          },
        },
        // Per-student average percentage
        {
          $group: {
            _id:       "$userId",
            avgScore:  { $avg: "$percentage" },
          },
        },
        // Overall summary
        {
          $group: {
            _id:               null,
            totalStudents:     { $sum: 1 },
            overallAverage:    { $avg: "$avgScore" },
            passingStudents:   { $sum: { $cond: [{ $gte: ["$avgScore", 75] }, 1, 0] } },
            excellentStudents: { $sum: { $cond: [{ $gte: ["$avgScore", 90] }, 1, 0] } },
          },
        },
        {
          $project: {
            _id:           0,
            totalStudents: 1,
            averageScore:  { $round: ["$overallAverage", 1] },
            passRate: {
              $round: [
                { $multiply: [{ $divide: ["$passingStudents", "$totalStudents"] }, 100] },
                1,
              ],
            },
            excellentCount: "$excellentStudents",
          },
        },
      ])
      .toArray();

    return NextResponse.json(
      stats ?? { totalStudents: 0, averageScore: 0, passRate: 0, excellentCount: 0 }
    );
  } catch (error) {
    console.error("GET /api/scores/stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}