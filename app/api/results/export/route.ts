import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";
import { User, Faculty } from "@/models/User";

// ─── GET /api/results/export ───────────────────────────────────────────────────
// Admin → all courses; Faculty → scoped to their own course automatically
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId    = searchParams.get("userId");
    const course    = searchParams.get("course");
    const isCorrect = searchParams.get("isCorrect");
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
        { status: { $exists: false } },
      ],
    };

    // Faculty always scoped to their own course — ignore any course param from client
    if (user.role === "faculty") {
      parentMatch.course = (user as Faculty).course;
    } else if (course && course !== "All") {
      parentMatch.course = course;
    }

    if (search) {
      (parentMatch.$or as unknown[]) = [
        ...((parentMatch.$or as unknown[]) ?? []),
        { userName: { $regex: search, $options: "i" } },
      ];
    }

    // ── Post-unwind match ──────────────────────────────────────────────────────
    const rowMatch: Record<string, unknown> = {};
    if (isCorrect === "true")  rowMatch["results.isCorrect"] = true;
    if (isCorrect === "false") rowMatch["results.isCorrect"] = false;

    const pipeline: object[] = [
      { $match: parentMatch },
      { $unwind: { path: "$results", preserveNullAndEmptyArrays: false } },
      ...(Object.keys(rowMatch).length ? [{ $match: rowMatch }] : []),
      {
        $project: {
          _id:            0,
          studentId:      { $toString: "$userId" },
          studentName:    "$userName",
          course:         "$course",
          subject:        "$results.subject",
          category:       "$results.category",
          questionText:   "$results.questionText",
          selectedAnswer: "$results.userAnswer",
          correctAnswer:  "$results.correctAnswer",
          isCorrect:      "$results.isCorrect",
          difficulty:     "$results.difficulty",
          submittedAt:    "$completedAt",
        },
      },
      { $sort: { submittedAt: -1 } },
    ];

    const rows = await db.collection("examResults").aggregate(pipeline).toArray();

    // ── Build CSV ──────────────────────────────────────────────────────────────
    const headers = [
      "Student ID", "Student Name", "Course", "Subject", "Category",
      "Question", "Selected Answer", "Correct Answer", "Result",
      "Difficulty", "Submitted At",
    ];

    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.studentId,
          r.studentName       ?? "N/A",
          r.course,
          r.subject           ?? "N/A",
          r.category          ?? "N/A",
          (r.questionText     ?? "").substring(0, 200),
          r.selectedAnswer    ?? "",
          r.correctAnswer     ?? "",
          r.isCorrect ? "Correct" : "Wrong",
          r.difficulty        ?? "",
          r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "",
        ]
          .map(escape)
          .join(",")
      ),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type":        "text/csv",
        "Content-Disposition": `attachment; filename="results-export-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error("GET /api/results/export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}