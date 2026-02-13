import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    // Filters
    const course = searchParams.get("course"); // "BSABE" | "BSGE" | null
    const isCorrect = searchParams.get("isCorrect"); // "true" | "false" | null
    const searchQuery = searchParams.get("search") || "";

    const client = await clientPromise;
    const db = client.db(dbName);
    const responsesCol = db.collection("responses");

    // Build filter query
    const filter: any = {};
    
    if (course && course !== "All") {
      filter.course = course;
    }
    
    if (isCorrect === "true") {
      filter.isCorrect = true;
    } else if (isCorrect === "false") {
      filter.isCorrect = false;
    }
    
    if (searchQuery) {
      filter.studentId = { $regex: searchQuery, $options: "i" };
    }

    // Get total count
    const total = await responsesCol.countDocuments(filter);

    // Fetch paginated results with question details
    const results = await responsesCol
      .aggregate([
        { $match: filter },
        {
          $lookup: {
            from: "questions",
            localField: "questionId",
            foreignField: "_id",
            as: "questionDetails"
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "studentId",
            foreignField: "studentId",
            as: "studentDetails"
          }
        },
        { $sort: { submittedAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            studentId: 1,
            studentName: { $arrayElemAt: ["$studentDetails.name", 0] },
            questionId: 1,
            questionText: { $arrayElemAt: ["$questionDetails.questionText", 0] },
            subject: { $arrayElemAt: ["$questionDetails.subject", 0] },
            category: { $arrayElemAt: ["$questionDetails.category", 0] },
            course: 1,
            selectedAnswer: 1,
            correctAnswer: { $arrayElemAt: ["$questionDetails.correctAnswer", 0] },
            isCorrect: 1,
            submittedAt: 1
          }
        }
      ])
      .toArray();

    return NextResponse.json({
      results,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("GET /api/results error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}