import { NextResponse } from "next/server";
import clientPromise, { dbName } from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const responsesCol = db.collection("responses");

    // Overall stats
    const [overallStats] = await responsesCol
      .aggregate([
        {
          $group: {
            _id: null,
            totalQuestions: { $sum: 1 },
            correctAnswers: {
              $sum: { $cond: ["$isCorrect", 1, 0] }
            },
            wrongAnswers: {
              $sum: { $cond: ["$isCorrect", 0, 1] }
            },
            uniqueStudents: { $addToSet: "$studentId" }
          }
        },
        {
          $project: {
            _id: 0,
            totalQuestions: 1,
            correctAnswers: 1,
            wrongAnswers: 1,
            uniqueStudents: { $size: "$uniqueStudents" },
            overallScore: {
              $multiply: [
                { $divide: ["$correctAnswers", "$totalQuestions"] },
                100
              ]
            }
          }
        }
      ])
      .toArray();

    // BSABEN stats
    const [bsabenStats] = await responsesCol
      .aggregate([
        { $match: { course: "BSABEN" } },
        {
          $group: {
            _id: null,
            totalPool: { $sum: 1 },
            correct: {
              $sum: { $cond: ["$isCorrect", 1, 0] }
            },
            wrong: {
              $sum: { $cond: ["$isCorrect", 0, 1] }
            }
          }
        },
        {
          $project: {
            _id: 0,
            totalPool: 1,
            correct: 1,
            wrong: 1,
            successRate: {
              $multiply: [
                { $divide: ["$correct", "$totalPool"] },
                100
              ]
            }
          }
        }
      ])
      .toArray();

    // BSGE stats
    const [bsgeStats] = await responsesCol
      .aggregate([
        { $match: { course: "BSGE" } },
        {
          $group: {
            _id: null,
            totalPool: { $sum: 1 },
            correct: {
              $sum: { $cond: ["$isCorrect", 1, 0] }
            },
            wrong: {
              $sum: { $cond: ["$isCorrect", 0, 1] }
            }
          }
        },
        {
          $project: {
            _id: 0,
            totalPool: 1,
            correct: 1,
            wrong: 1,
            successRate: {
              $multiply: [
                { $divide: ["$correct", "$totalPool"] },
                100
              ]
            }
          }
        }
      ])
      .toArray();

    return NextResponse.json({
      overall: overallStats || {
        totalQuestions: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        uniqueStudents: 0,
        overallScore: 0
      },
      bsaben: bsabenStats || {
        totalPool: 0,
        correct: 0,
        wrong: 0,
        successRate: 0
      },
      bsge: bsgeStats || {
        totalPool: 0,
        correct: 0,
        wrong: 0,
        successRate: 0
      }
    });
  } catch (error) {
    console.error("GET /api/results/stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}