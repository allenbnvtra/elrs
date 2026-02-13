import { NextRequest, NextResponse } from "next/server";
import clientPromise, { dbName } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const course = searchParams.get("course") || "BSABE";

    const client = await clientPromise;
    const db = client.db(dbName);
    const responsesCol = db.collection("responses");

    // Calculate comprehensive stats
    const [stats] = await responsesCol
      .aggregate([
        { $match: { course } },
        {
          $group: {
            _id: "$studentId",
            totalQuestions: { $sum: 1 },
            correctAnswers: {
              $sum: { $cond: ["$isCorrect", 1, 0] }
            }
          }
        },
        {
          $addFields: {
            averageScore: {
              $multiply: [
                { $divide: ["$correctAnswers", "$totalQuestions"] },
                100
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            totalStudents: { $sum: 1 },
            overallAverage: { $avg: "$averageScore" },
            passingStudents: {
              $sum: {
                $cond: [{ $gte: ["$averageScore", 75] }, 1, 0]
              }
            },
            excellentStudents: {
              $sum: {
                $cond: [{ $gte: ["$averageScore", 90] }, 1, 0]
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            totalStudents: 1,
            averageScore: { $round: ["$overallAverage", 1] },
            passRate: {
              $round: [
                {
                  $multiply: [
                    { $divide: ["$passingStudents", "$totalStudents"] },
                    100
                  ]
                },
                1
              ]
            },
            excellentCount: "$excellentStudents"
          }
        }
      ])
      .toArray();

    return NextResponse.json(
      stats || {
        totalStudents: 0,
        averageScore: 0,
        passRate: 0,
        excellentCount: 0
      }
    );
  } catch (error) {
    console.error("GET /api/scores/stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}