import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Filters
    const course = searchParams.get("course") || "BSABEN";
    const status = searchParams.get("status"); // "excellent" | "good" | "needs-improvement" | null
    const searchQuery = searchParams.get("search") || "";

    const client = await clientPromise;
    const db = client.db(dbName);
    const responsesCol = db.collection("responses");
    const usersCol = db.collection("users");

    // Build aggregation pipeline to calculate student scores
    const pipeline: any[] = [
      // Filter by course
      { $match: { course } },
      
      // Group by student to calculate their stats
      {
        $group: {
          _id: "$studentId",
          totalQuestions: { $sum: 1 },
          correctAnswers: {
            $sum: { $cond: ["$isCorrect", 1, 0] }
          },
          wrongAnswers: {
            $sum: { $cond: ["$isCorrect", 0, 1] }
          },
          scores: {
            $push: {
              $cond: [
                "$isCorrect",
                100,
                0
              ]
            }
          },
          lastExam: { $max: "$submittedAt" }
        }
      },
      
      // Calculate average, highest, and lowest scores
      {
        $addFields: {
          averageScore: {
            $multiply: [
              { $divide: ["$correctAnswers", "$totalQuestions"] },
              100
            ]
          },
          highestScore: { $max: "$scores" },
          lowestScore: { $min: "$scores" }
        }
      },
      
      // Determine status based on average score
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
                { case: { $gte: ["$averageScore", 67] }, then: "D+" },
                { case: { $gte: ["$averageScore", 65] }, then: "D" },
              ],
              default: "F"
            }
          }
        }
      },
      
      // Filter by status if provided
      ...(status ? [{ $match: { status } }] : []),
      
      // Lookup user details
      {
        $lookup: {
          from: "users",
          let: { studentId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$studentId", "$$studentId"] }
              }
            }
          ],
          as: "userDetails"
        }
      },
      
      // Unwind user details
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      
      // Filter by search query
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
      
      // Project final shape
      {
        $project: {
          _id: 0,
          studentId: "$_id",
          name: { $ifNull: ["$userDetails.name", "Unknown Student"] },
          course: { $literal: course },
          examsTaken: "$totalQuestions",
          averageScore: { $round: ["$averageScore", 1] },
          highestScore: "$highestScore",
          lowestScore: "$lowestScore",
          status: 1,
          grade: 1,
          lastExam: "$lastExam"
        }
      },
      
      // Sort by average score descending
      { $sort: { averageScore: -1 } }
    ];

    // Get total count before pagination
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await responsesCol.aggregate(countPipeline).toArray();
    const total = countResult[0]?.total || 0;

    // Add pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Execute query
    const scores = await responsesCol.aggregate(pipeline).toArray();

    return NextResponse.json({
      scores,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("GET /api/scores error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}