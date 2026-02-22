import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";
import { User, Faculty } from "@/models/User";

// ─── GET /api/scores/stats ─────────────────────────────────────────────────────
// Admin → receives course param; Faculty → scoped to their own course automatically
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId      = searchParams.get("userId");
    const courseParam = searchParams.get("course");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    const client   = await clientPromise;
    const db       = client.db(dbName);
    const usersCol = db.collection<User>("users");

    const user = await usersCol.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.role !== "admin" && user.role !== "faculty") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Faculty always scoped to their own course — ignore any course param from client
    const course = user.role === "faculty"
      ? (user as Faculty).course
      : courseParam ?? "BSABEN";

    const [stats] = await db.collection("examResults")
      .aggregate([
        {
          $match: {
            course,
            $or: [
              { status: { $in: ["completed", "flagged"] } },
              { status: { $exists: false } }, // legacy records without status field
            ],
          },
        },
        // Per-student average
        {
          $group: {
            _id:      "$userId",
            avgScore: { $avg: "$percentage" },
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
            _id:            0,
            totalStudents:  1,
            averageScore:   { $round: ["$overallAverage", 1] },
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