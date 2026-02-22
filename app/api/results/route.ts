import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";
import { User, Faculty } from "@/models/User";

// ─── GET /api/results ──────────────────────────────────────────────────────────
// Admin → all courses; Faculty → scoped to their own course automatically
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId    = searchParams.get("userId");
    const page      = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
    const limit     = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10)));
    const skip      = (page - 1) * limit;
    const course    = searchParams.get("course");
    const isCorrect = searchParams.get("isCorrect"); // "true" | "false" | null
    const search    = searchParams.get("search") ?? "";

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

    // ── Parent-document match ──────────────────────────────────────────────────
    const parentMatch: Record<string, unknown> = {
      $or: [
        { status: { $in: ["completed", "flagged"] } },
        { status: { $exists: false } }, // legacy docs without status field
      ],
    };

    // Faculty always scoped to their own course — ignore any course param from client
    if (user.role === "faculty") {
      parentMatch.course = (user as Faculty).course;
    } else if (course && course !== "All") {
      // Admin may optionally filter by course
      parentMatch.course = course;
    }

    if (search) {
      (parentMatch.$or as unknown[]) = [
        ...((parentMatch.$or as unknown[]) ?? []),
        { userName: { $regex: search, $options: "i" } },
        { userId:   { $regex: search, $options: "i" } },
      ];
    }

    // ── Post-unwind match (per question row) ───────────────────────────────────
    const rowMatch: Record<string, unknown> = {};
    if (isCorrect === "true")  rowMatch["results.isCorrect"] = true;
    if (isCorrect === "false") rowMatch["results.isCorrect"] = false;

    const basePipeline: object[] = [
      { $match: parentMatch },
      {
        $unwind: {
          path: "$results",
          includeArrayIndex: "rowIndex",
          preserveNullAndEmptyArrays: false,
        },
      },
      ...(Object.keys(rowMatch).length ? [{ $match: rowMatch }] : []),
      {
        $project: {
          _id: {
            $concat: [{ $toString: "$_id" }, "-", { $toString: "$rowIndex" }],
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

    const [countResult, results] = await Promise.all([
      db.collection("examResults")
        .aggregate([...basePipeline, { $count: "total" }])
        .toArray(),
      db.collection("examResults")
        .aggregate([...basePipeline, { $skip: skip }, { $limit: limit }])
        .toArray(),
    ]);

    return NextResponse.json({
      results,
      pagination: {
        total:      countResult[0]?.total ?? 0,
        page,
        limit,
        totalPages: Math.ceil((countResult[0]?.total ?? 0) / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/results error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}