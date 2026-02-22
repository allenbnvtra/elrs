import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";

// ─── GET /api/scores/export ────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status  = searchParams.get("status");
    const search  = searchParams.get("search") ?? "";
    const userId  = searchParams.get("userId");

    const client = await clientPromise;
    const db     = client.db(dbName);

    // ── Auth / course scoping ──────────────────────────────────────────────────
    let allowedCourse: string | null = null;
    const courseParam = searchParams.get("course") ?? "BSABEN";

    if (userId && ObjectId.isValid(userId)) {
      const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
      if (user?.role === "faculty") allowedCourse = (user as any).course;
    }

    const course = allowedCourse ?? courseParam;

    // ── Same pipeline as /api/scores (no skip/limit) ───────────────────────────
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
      {
        $lookup: {
          from: "users", localField: "_id", foreignField: "_id", as: "userDoc",
        },
      },
      {
        $addFields: {
          studentNumber: { $ifNull: [{ $arrayElemAt: ["$userDoc.studentNumber", 0] }, "N/A"] },
        },
      },
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
      {
        $addFields: {
          status: {
            $switch: {
              branches: [
                { case: { $gte: ["$averageScore", 90] }, then: "excellent" },
                { case: { $gte: ["$averageScore", 75] }, then: "good" },
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
      ...(search  ? [{ $match: { userName: { $regex: search, $options: "i" } } }] : []),
      {
        $project: {
          _id:           0,
          studentNumber: 1,
          name:          { $ifNull: ["$userName", "Unknown Student"] },
          course:       { $literal: course },
          examsTaken:   1,
          averageScore: { $round: ["$averageScore", 1] },
          highestScore: 1,
          lowestScore:  1,
          status:       1,
          grade:        1,
          lastExam:     1,
        },
      },
      { $sort: { averageScore: -1 } },
    ];

    const rows = await db.collection("examResults").aggregate(pipeline).toArray();

    const headers = [
      "Student Number", "Name", "Course", "Exams Taken",
      "Average Score", "Highest Score", "Lowest Score",
      "Grade", "Status", "Last Exam",
    ];

    const escape = (v: any) => {
      const s = v == null ? "" : String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const csvLines = [
      headers.join(","),
      ...rows.map(r =>
        [
          r.studentNumber,
          r.name,
          r.course,
          r.examsTaken,
          `${r.averageScore}%`,
          `${r.highestScore}%`,
          `${r.lowestScore}%`,
          r.grade,
          r.status,
          r.lastExam ? new Date(r.lastExam).toLocaleDateString() : "",
        ]
          .map(escape)
          .join(",")
      ),
    ];

    return new NextResponse(csvLines.join("\n"), {
      headers: {
        "Content-Type":        "text/csv",
        "Content-Disposition": `attachment; filename="scores-${course}-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error("GET /api/scores/export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}