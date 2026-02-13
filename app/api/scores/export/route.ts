import { NextRequest, NextResponse } from "next/server";
import clientPromise, { dbName } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const course = searchParams.get("course") || "BSABE";
    const status = searchParams.get("status");
    const searchQuery = searchParams.get("search") || "";

    const client = await clientPromise;
    const db = client.db(dbName);
    const responsesCol = db.collection("responses");

    // Build aggregation pipeline
    const pipeline: any[] = [
      { $match: { course } },
      {
        $group: {
          _id: "$studentId",
          totalQuestions: { $sum: 1 },
          correctAnswers: { $sum: { $cond: ["$isCorrect", 1, 0] } },
          wrongAnswers: { $sum: { $cond: ["$isCorrect", 0, 1] } },
          scores: { $push: { $cond: ["$isCorrect", 100, 0] } },
          lastExam: { $max: "$submittedAt" }
        }
      },
      {
        $addFields: {
          averageScore: {
            $multiply: [{ $divide: ["$correctAnswers", "$totalQuestions"] }, 100]
          },
          highestScore: { $max: "$scores" },
          lowestScore: { $min: "$scores" }
        }
      },
      {
        $addFields: {
          status: {
            $switch: {
              branches: [
                { case: { $gte: ["$averageScore", 90] }, then: "excellent" },
                { case: { $gte: ["$averageScore", 75] }, then: "good" },
              ],
              default: "needs-improvement"
            }
          },
          grade: {
            $switch: {
              branches: [
                { case: { $gte: ["$averageScore", 97] }, then: "A+" },
                { case: { $gte: ["$averageScore", 93] }, then: "A" },
                { case: { $gte: ["$averageScore", 90] }, then: "A-" },
                { case: { $gte: ["$averageScore", 87] }, then: "B+" },
                { case: { $gte: ["$averageScore", 83] }, then: "B" },
                { case: { $gte: ["$averageScore", 80] }, then: "B-" },
                { case: { $gte: ["$averageScore", 77] }, then: "C+" },
                { case: { $gte: ["$averageScore", 73] }, then: "C" },
                { case: { $gte: ["$averageScore", 70] }, then: "C-" },
              ],
              default: "F"
            }
          }
        }
      },
      ...(status ? [{ $match: { status } }] : []),
      {
        $lookup: {
          from: "users",
          let: { studentId: "$_id" },
          pipeline: [{ $match: { $expr: { $eq: ["$studentId", "$$studentId"] } } }],
          as: "userDetails"
        }
      },
      { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
      ...(searchQuery ? [
        {
          $match: {
            $or: [
              { "_id": { $regex: searchQuery, $options: "i" } },
              { "userDetails.name": { $regex: searchQuery, $options: "i" } }
            ]
          }
        }
      ] : []),
      {
        $project: {
          studentId: "$_id",
          name: { $ifNull: ["$userDetails.name", "Unknown"] },
          examsTaken: "$totalQuestions",
          averageScore: { $round: ["$averageScore", 1] },
          highestScore: 1,
          lowestScore: 1,
          grade: 1,
          status: 1,
          lastExam: 1
        }
      },
      { $sort: { averageScore: -1 } }
    ];

    const scores = await responsesCol.aggregate(pipeline).toArray();

    // Generate CSV
    const headers = [
      "Student ID",
      "Name",
      "Course",
      "Exams Taken",
      "Average Score (%)",
      "Highest Score (%)",
      "Lowest Score (%)",
      "Grade",
      "Status",
      "Last Exam"
    ];

    const csvRows = [
      headers.join(","),
      ...scores.map(s => [
        s.studentId,
        `"${s.name}"`,
        course,
        s.examsTaken,
        s.averageScore,
        s.highestScore,
        s.lowestScore,
        s.grade,
        s.status,
        new Date(s.lastExam).toLocaleDateString()
      ].join(","))
    ];

    const csv = csvRows.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="scores-${course}-${Date.now()}.csv"`
      }
    });
  } catch (error) {
    console.error("GET /api/scores/export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}