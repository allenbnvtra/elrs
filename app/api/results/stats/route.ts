import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";

// ─── GET /api/results/stats ────────────────────────────────────────────────────
// Returns overall + per-course (bsaben / bsge) answer stats
// Admin → full view; Faculty → only sees their own course populated
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const client = await clientPromise;
    const db     = client.db(dbName);

    // ── Auth / scope ──────────────────────────────────────────────────────────
    let facultyCourse: string | null = null;

    if (userId) {
      if (!ObjectId.isValid(userId)) {
        return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
      }
      const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      if (user.role !== "admin" && user.role !== "faculty") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      if (user.role === "faculty") {
        facultyCourse = (user as any).course ?? null;
      }
    }

    // ── Helper: aggregate stats for one course from examResults ──────────────
    async function courseStats(course: string) {
      // Scoped: faculty can only query their own course
      if (facultyCourse && facultyCourse !== course) {
        return { totalPool: 0, correct: 0, wrong: 0, successRate: 0 };
      }

      const [row] = await db.collection("examResults")
        .aggregate([
          {
          $match: {
            course,
            $or: [
              { status: { $in: ["completed", "flagged"] } },
              { status: { $exists: false } }, // legacy records without status field
            ],
          },
        },
          {
            $group: {
              _id:            null,
              totalPool:      { $sum: "$totalQuestions" },
              correct:        { $sum: "$correctCount" },
              uniqueStudents: { $addToSet: "$userId" },
            },
          },
          {
            $project: {
              _id:            0,
              totalPool:      1,
              correct:        1,
              wrong:          { $subtract: ["$totalPool", "$correct"] },
              uniqueStudents: { $size: "$uniqueStudents" },
              successRate: {
                $cond: [
                  { $eq: ["$totalPool", 0] },
                  0,
                  { $round: [{ $multiply: [{ $divide: ["$correct", "$totalPool"] }, 100] }, 1] },
                ],
              },
            },
          },
        ])
        .toArray();

      return row ?? { totalPool: 0, correct: 0, wrong: 0, successRate: 0, uniqueStudents: 0 };
    }

    // ── Question pool from questions collection (actual bank size) ────────────
    async function questionPool(course: string) {
      if (facultyCourse && facultyCourse !== course) return 0;
      return db.collection("questions").countDocuments({ course, isActive: true });
    }

    const [bsabenStats, bsgeStats, bsabenPool, bsgePool] = await Promise.all([
      courseStats("BSABEN"),
      courseStats("BSGE"),
      questionPool("BSABEN"),
      questionPool("BSGE"),
    ]);

    // ── Overall (all courses the requester can see) ───────────────────────────
    const visibleCourses = facultyCourse
      ? [facultyCourse === "BSABEN" ? bsabenStats : bsgeStats]
      : [bsabenStats, bsgeStats];

    const totalPool    = visibleCourses.reduce((s, c) => s + (c.totalPool    ?? 0), 0);
    const totalCorrect = visibleCourses.reduce((s, c) => s + (c.correct      ?? 0), 0);
    const totalWrong   = visibleCourses.reduce((s, c) => s + (c.wrong        ?? 0), 0);

    // Unique students across visible courses (re-query to deduplicate properly)
    const uniqueStudentsMatch: any = {
      $or: [
        { status: { $in: ["completed", "flagged"] } },
        { status: { $exists: false } },
      ],
    };
    if (facultyCourse) uniqueStudentsMatch.course = facultyCourse;

    const [uniqueRow] = await db.collection("examResults")
      .aggregate([
        { $match: uniqueStudentsMatch },
        { $group: { _id: null, uniqueStudents: { $addToSet: "$userId" } } },
        { $project: { _id: 0, uniqueStudents: { $size: "$uniqueStudents" } } },
      ])
      .toArray();

    return NextResponse.json({
      overall: {
        totalQuestions:  totalPool,
        correctAnswers:  totalCorrect,
        wrongAnswers:    totalWrong,
        uniqueStudents:  uniqueRow?.uniqueStudents ?? 0,
        overallScore:    totalPool > 0
          ? Math.round((totalCorrect / totalPool) * 1000) / 10
          : 0,
      },
      bsaben: { ...bsabenStats, totalPool: bsabenPool },
      bsge:   { ...bsgeStats,   totalPool: bsgePool   },
    });
  } catch (error) {
    console.error("GET /api/results/stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}