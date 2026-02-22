import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";
import { Question } from "@/models/Questions";

// ─── POST /api/exams/submit ────────────────────────────────────────────────────
// Submits exam answers and returns results
// Works for: manual submit, timer expiry, and violation auto-submit (answers may be partial/empty)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { examSessionId, answers, userId } = body;

    if (!examSessionId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: examSessionId, userId" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(examSessionId) || !ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const client = await clientPromise;
    const db     = client.db(dbName);
    const examSessionsCol = db.collection("examSessions");
    const questionsCol    = db.collection<Question>("questions");

    // ── Load session ─────────────────────────────────────────────────────────
    const examSession = await examSessionsCol.findOne({
      _id:    new ObjectId(examSessionId),
      userId: new ObjectId(userId),
    });

    if (!examSession) {
      return NextResponse.json({ error: "Exam session not found" }, { status: 404 });
    }

    // Guard against duplicate submissions (completed OR already flagged+submitted)
    if (examSession.status === "completed" || examSession.status === "flagged") {
      return NextResponse.json({ error: "Exam already submitted" }, { status: 400 });
    }

    const wasFlagged     = examSession.wasFlagged     ?? false;
    const violations     = examSession.violations     ?? [];
    const violationCount = examSession.violationCount ?? 0;

    // Answers may be partial (timer expiry) or empty (immediate auto-submit)
    const finalAnswers: Record<string, string> = answers ?? {};

    // ── Fetch questions ──────────────────────────────────────────────────────
    const questions = await questionsCol
      .find({ _id: { $in: examSession.questionIds.map((id: any) => new ObjectId(id)) } })
      .toArray();

    // ── Grade ────────────────────────────────────────────────────────────────
    let correctCount = 0;
    const results = questions.map((q) => {
      const userAnswer = finalAnswers[q._id!.toString()] ?? null;
      const isCorrect  = userAnswer === q.correctAnswer;
      if (isCorrect) correctCount++;
      return {
        questionId:    q._id,
        questionText:  q.questionText,
        userAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
        difficulty:    q.difficulty,
        category:      q.category,
        subject:       q.subject,   // included for BSABEN area exam breakdowns
        explanation:   q.explanation,
        options: {
          A: q.optionA,
          B: q.optionB,
          C: q.optionC,
          D: q.optionD,
        },
      };
    });

    const total       = questions.length;
    const score       = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const completedAt = new Date();
    const timeTakenSec = Math.round(
      (completedAt.getTime() - new Date(examSession.startedAt).getTime()) / 1000
    );

    // Final status: flagged if wasFlagged (violation auto-submit), else completed
    const finalStatus = wasFlagged ? "flagged" : "completed";

    // ── Update session ───────────────────────────────────────────────────────
    await examSessionsCol.updateOne(
      { _id: new ObjectId(examSessionId) },
      {
        $set: {
          answers:        finalAnswers,
          completedAt,
          score,
          correctCount,
          totalQuestions: total,
          status:         finalStatus,
          updatedAt:      completedAt,
        },
      }
    );

    // ── Persist to examResults ───────────────────────────────────────────────
    await db.collection("examResults").insertOne({
      examSessionId: new ObjectId(examSessionId),
      userId:        examSession.userId,
      userName:      examSession.userName,
      course:        examSession.course,
      ...(examSession.area    && { area:    examSession.area }),
      ...(examSession.subject && { subject: examSession.subject }),
      score,
      correctCount,
      totalQuestions: total,
      percentage:     score,
      startedAt:      examSession.startedAt,
      completedAt,
      timeTaken:      timeTakenSec,           // seconds
      results,
      violations,
      violationCount,
      wasFlagged,
      status:         finalStatus,
      createdAt:      completedAt,
    });

    return NextResponse.json({
      score,
      correctCount,
      totalQuestions:  total,
      percentage:      score,
      results,
      completedAt,
      timeTaken:       Math.round(timeTakenSec / 60), // minutes for client display
      violations,
      violationCount,
      wasFlagged,
    });
  } catch (error) {
    console.error("POST /api/exams/submit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}