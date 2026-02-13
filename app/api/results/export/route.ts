import { NextRequest, NextResponse } from "next/server";
import clientPromise, { dbName } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Filters
    const course = searchParams.get("course");
    const isCorrect = searchParams.get("isCorrect");
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

    // Fetch all results
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
        {
          $project: {
            studentId: 1,
            studentName: { $arrayElemAt: ["$studentDetails.name", 0] },
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

    // Generate CSV
    const headers = [
      "Student ID",
      "Student Name",
      "Course",
      "Subject",
      "Category",
      "Question",
      "Selected Answer",
      "Correct Answer",
      "Result",
      "Submitted At"
    ];

    const csvRows = [
      headers.join(","),
      ...results.map(r => [
        r.studentId,
        `"${r.studentName || 'N/A'}"`,
        r.course,
        `"${r.subject || 'N/A'}"`,
        `"${r.category || 'N/A'}"`,
        `"${(r.questionText || '').substring(0, 100).replace(/"/g, '""')}"`,
        r.selectedAnswer,
        r.correctAnswer,
        r.isCorrect ? "Correct" : "Wrong",
        new Date(r.submittedAt).toLocaleString()
      ].join(","))
    ];

    const csv = csvRows.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="results-export-${Date.now()}.csv"`
      }
    });
  } catch (error) {
    console.error("GET /api/results/export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}