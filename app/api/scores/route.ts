import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";

// ─── GET /api/scores ───────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
    const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip   = (page - 1) * limit;
    const status = searchParams.get("status");
    const search = searchParams.get("search") ?? "";
    const userId = searchParams.get("userId");

    const client = await clientPromise;
    const db     = client.db(dbName);

    // ── Auth / course scoping ──────────────────────────────────────────────────
    let allowedCourse: string | null = null;
    const courseParam = searchParams.get("course") ?? "BSABEN";

    if (userId) {
      if (!ObjectId.isValid(userId)) {
        return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
      }
      const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      if (user.role !== "admin" && user.role !== "faculty") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      if (user.role === "faculty") allowedCourse = (user as any).course;
    }

    const course = allowedCourse ?? courseParam;

    // ── Pipeline ───────────────────────────────────────────────────────────────
    const pipeline: any[] = [
      {
        $match: {
          course,
          $or: [
            { status: { $in: ["completed", "flagged"] } },
            { status: { $exists: false } },
          ],
        },
      },

      // Group per student
      {
        $group: {
          _id:            "$userId",
          userName:       { $first: "$userName" },
          examsTaken:     { $sum: 1 },
          totalCorrect:   { $sum: "$correctCount" },
          totalQuestions: { $sum: "$totalQuestions" },
          scores:         { $push: "$percentage" },
          lastExam:       { $max: "$completedAt" },
        },
      },

      // Join users to get studentNumber
      {
        $lookup: {
          from:         "users",
          localField:   "_id",          // userId (ObjectId) stored on examResults
          foreignField: "_id",          // _id on users collection
          as:           "userDoc",
        },
      },
      {
        $addFields: {
          studentNumber: {
            $ifNull: [
              { $arrayElemAt: ["$userDoc.studentNumber", 0] },
              "N/A",
            ],
          },
        },
      },

      // Derive scores
      {
        $addFields: {
          averageScore: {
            $cond: [
              { $eq: ["$totalQuestions", 0] },
              0,
              { $multiply: [{ $divide: ["$totalCorrect", "$totalQuestions"] }, 100] },
            ],
          },
          highestScore: { $max: "$scores" },
          lowestScore:  { $min: "$scores" },
        },
      },

      // Status + grade
      {
        $addFields: {
          status: {
            $switch: {
              branches: [
                { case: { $gte: ["$averageScore", 90] }, then: "excellent"        },
                { case: { $gte: ["$averageScore", 75] }, then: "good"             },
              ],
              default: "needs-improvement",
            },
          },
          grade: {
            $switch: {
              branches: [
                { case: { $gte: ["$averageScore", 97] }, then: "A+" },
                { case: { $gte: ["$averageScore", 93] }, then: "A"  },
                { case: { $gte: ["$averageScore", 90] }, then: "A-" },
                { case: { $gte: ["$averageScore", 87] }, then: "B+" },
                { case: { $gte: ["$averageScore", 83] }, then: "B"  },
                { case: { $gte: ["$averageScore", 80] }, then: "B-" },
                { case: { $gte: ["$averageScore", 77] }, then: "C+" },
                { case: { $gte: ["$averageScore", 73] }, then: "C"  },
                { case: { $gte: ["$averageScore", 70] }, then: "C-" },
                { case: { $gte: ["$averageScore", 67] }, then: "D+" },
                { case: { $gte: ["$averageScore", 65] }, then: "D"  },
              ],
              default: "F",
            },
          },
        },
      },

      ...(status ? [{ $match: { status } }] : []),

      // Search by name OR studentNumber
      ...(search ? [{
        $match: {
          $or: [
            { userName:      { $regex: search, $options: "i" } },
            { studentNumber: { $regex: search, $options: "i" } },
          ],
        },
      }] : []),

      {
        $project: {
          _id:           0,
          studentId:     { $toString: "$_id" },   // keep internal id for linking
          studentNumber: 1,
          name:          { $ifNull: ["$userName", "Unknown Student"] },
          course:        { $literal: course },
          examsTaken:    1,
          averageScore:  { $round: ["$averageScore", 1] },
          highestScore:  1,
          lowestScore:   1,
          status:        1,
          grade:         1,
          lastExam:      1,
        },
      },

      { $sort: { averageScore: -1 } },
    ];

    const [countResult, scores] = await Promise.all([
      db.collection("examResults").aggregate([...pipeline, { $count: "total" }]).toArray(),
      db.collection("examResults").aggregate([...pipeline, { $skip: skip }, { $limit: limit }]).toArray(),
    ]);

    return NextResponse.json({
      scores,
      pagination: {
        total:      countResult[0]?.total ?? 0,
        page,
        limit,
        totalPages: Math.ceil((countResult[0]?.total ?? 0) / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/scores error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}