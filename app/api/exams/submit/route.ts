import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";
import { Question } from "@/models/Questions";

// ─── POST /api/exams/submit ────────────────────────────────────────────────────
// Submits exam answers and returns results
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { examSessionId, answers, userId } = body;

    if (!examSessionId || !answers || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: examSessionId, answers, userId" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(examSessionId) || !ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const examSessionsCol = db.collection("examSessions");
    const questionsCol = db.collection<Question>("questions");

    // Get exam session
    const examSession = await examSessionsCol.findOne({
      _id: new ObjectId(examSessionId),
      userId: new ObjectId(userId),
    });

    if (!examSession) {
      return NextResponse.json({ error: "Exam session not found" }, { status: 404 });
    }

    if (examSession.status === "completed") {
      return NextResponse.json({ error: "Exam already submitted" }, { status: 400 });
    }

    const wasFlagged = examSession.wasFlagged || false;
    const violations = examSession.violations || [];
    const violationCount = examSession.violationCount || 0;

    // Get all questions for this exam
    const questions = await questionsCol
      .find({
        _id: { $in: examSession.questionIds.map((id: any) => new ObjectId(id)) },
      })
      .toArray();

    // Grade the exam
    let correctCount = 0;
    const results = questions.map((question) => {
      const userAnswer = answers[question._id!.toString()];
      const isCorrect = userAnswer === question.correctAnswer;
      
      if (isCorrect) correctCount++;

      return {
        questionId: question._id,
        questionText: question.questionText,
        userAnswer: userAnswer || null,
        correctAnswer: question.correctAnswer,
        isCorrect,
        difficulty: question.difficulty,
        category: question.category,
        explanation: question.explanation,
        options: {
          A: question.optionA,
          B: question.optionB,
          C: question.optionC,
          D: question.optionD,
        },
      };
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const completedAt = new Date();

    // Update exam session
    await examSessionsCol.updateOne(
      { _id: new ObjectId(examSessionId) },
      {
        $set: {
          answers,
          completedAt,
          score,
          correctCount,
          totalQuestions: questions.length,
          status: wasFlagged ? "flagged" : "completed",
          updatedAt: completedAt,
        },
      }
    );

    // Save to exam results collection for history
    const examResultsCol = db.collection("examResults");
    await examResultsCol.insertOne({
      examSessionId: new ObjectId(examSessionId),
      userId: examSession.userId,
      userName: examSession.userName,
      course: examSession.course,
      area: examSession.area,
      subject: examSession.subject,
      score,
      correctCount,
      totalQuestions: questions.length,
      percentage: score,
      startedAt: examSession.startedAt,
      completedAt,
      timeTaken: Math.round((completedAt.getTime() - examSession.startedAt.getTime()) / 1000), // seconds
      results,
      violations,
      violationCount,
      wasFlagged,
      createdAt: completedAt,
    });

    return NextResponse.json({
      score,
      correctCount,
      totalQuestions: questions.length,
      percentage: score,
      results,
      completedAt,
      timeTaken: Math.round((completedAt.getTime() - examSession.startedAt.getTime()) / 60000), // minutes
      violations,
      violationCount,
      wasFlagged,
    });
  } catch (error) {
    console.error("POST /api/exams/submit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}