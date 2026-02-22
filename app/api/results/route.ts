import { NextRequest, NextResponse } from "next/server";
import clientPromise, { dbName } from "@/lib/mongodb";

// ─── GET /api/results ──────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page      = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
    const limit     = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10)));
    const skip      = (page - 1) * limit;
    const course    = searchParams.get("course");
    const isCorrect = searchParams.get("isCorrect");   // "true" | "false" | null
    const search    = searchParams.get("search") ?? "";

    const client = await clientPromise;
    const db     = client.db(dbName);

    // ── Parent-document match ──────────────────────────────────────────────────
    const parentMatch: any = {
      $or: [
        { status: { $in: ["completed", "flagged"] } },
        { status: { $exists: false } },   // legacy docs without status field
      ],
    };
    if (course && course !== "All") parentMatch.course = course;
    if (search) {
      parentMatch.$or = [
        ...(parentMatch.$or ?? []),
        { userName: { $regex: search, $options: "i" } },
        { userId:   { $regex: search, $options: "i" } },
      ];
    }

    // ── Post-unwind match (per question row) ───────────────────────────────────
    const rowMatch: any = {};
    if (isCorrect === "true")  rowMatch["results.isCorrect"] = true;
    if (isCorrect === "false") rowMatch["results.isCorrect"] = false;

    const basePipeline: any[] = [
      { $match: parentMatch },
      {
        $unwind: {
          path: "$results",
          includeArrayIndex: "rowIndex",   // gives each row a unique position
          preserveNullAndEmptyArrays: false,
        },
      },
      ...(Object.keys(rowMatch).length ? [{ $match: rowMatch }] : []),
      {
        $project: {
          // Composite: parentId + array index → guaranteed unique per row
          _id: {
            $concat: [
              { $toString: "$_id" },
              "-",
              { $toString: "$rowIndex" },
            ],
          },
          examResultId:   "$_id",
          studentId:      { $toString: "$userId" },
          studentName:    "$userName",
          questionId:     { $toString: "$results.questionId" },
          rowIndex:       1,
          questionText:   "$results.questionText",
          subject:        "$results.subject",
          category:       "$results.category",
          course:         "$course",
          selectedAnswer: "$results.userAnswer",
          correctAnswer:  "$results.correctAnswer",
          isCorrect:      "$results.isCorrect",
          difficulty:     "$results.difficulty",
          submittedAt:    "$completedAt",
        },
      },
      { $sort: { submittedAt: -1 } },
    ];

          // Remove rowIndex from client payload (internal use only)
      // Run count + paginated fetch in parallel
    const [countResult, results] = await Promise.all([
      db.collection("examResults")
        .aggregate([...basePipeline, { $count: "total" }])
        .toArray(),
      db.collection("examResults")
        .aggregate([...basePipeline, { $skip: skip }, { $limit: limit }])
        .toArray(),
    ]);

    const total = countResult[0]?.total ?? 0;

    return NextResponse.json({
      results,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/results error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}