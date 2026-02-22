import { NextRequest, NextResponse } from "next/server";
import clientPromise, { dbName } from "@/lib/mongodb";

// ─── GET /api/results/export ───────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const course    = searchParams.get("course");
    const isCorrect = searchParams.get("isCorrect");
    const search    = searchParams.get("search") ?? "";

    const client = await clientPromise;
    const db     = client.db(dbName);

    // ── Parent-document match ──────────────────────────────────────────────────
    const parentMatch: any = {
      $or: [
        { status: { $in: ["completed", "flagged"] } },
        { status: { $exists: false } },
      ],
    };
    if (course && course !== "All") parentMatch.course = course;
    if (search) {
      parentMatch.$or = [
        ...(parentMatch.$or ?? []),
        { userName: { $regex: search, $options: "i" } },
      ];
    }

    // ── Post-unwind match ──────────────────────────────────────────────────────
    const rowMatch: any = {};
    if (isCorrect === "true")  rowMatch["results.isCorrect"] = true;
    if (isCorrect === "false") rowMatch["results.isCorrect"] = false;

    const pipeline: any[] = [
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
          r.studentId,
          r.studentName ?? "N/A",
          r.course,
          r.subject    ?? "N/A",
          r.category   ?? "N/A",
          (r.questionText ?? "").substring(0, 200),
          r.selectedAnswer ?? "",
          r.correctAnswer  ?? "",
          r.isCorrect ? "Correct" : "Wrong",
          r.difficulty ?? "",
          r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "",
        ]
          .map(escape)
          .join(",")
      ),
    ];

    return new NextResponse(csvLines.join("\n"), {
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