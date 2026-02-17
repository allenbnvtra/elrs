import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";
import { Question, CourseType } from "@/models/Questions";
import { User } from "@/models/User";

// ─── POST /api/exams/start ─────────────────────────────────────────────────────
// Starts an exam and returns questions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { course, area, subject, userId, questionCount = 50 } = body;

    if (!course || !subject || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: course, subject, userId" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    // BSABEN requires area
    if (course === "BSABEN" && !area) {
      return NextResponse.json(
        { error: "Area is required for BSABEN exams" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const questionsCol = db.collection<Question>("questions");
    const usersCol = db.collection<User>("users");
    const examSessionsCol = db.collection("examSessions");

    // Verify user exists and course matches
    const user = await usersCol.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify user's course matches (only for students and faculty)
    if (user.role === "student" || user.role === "faculty") {
      if ("course" in user && user.course !== course) {
        return NextResponse.json(
          { error: "Course does not match user's enrolled course" },
          { status: 403 }
        );
      }
    }

    // Build query for questions
    const query: any = {
      course,
      subject,
      isActive: true, // Only fetch active questions
    };

    if (course === "BSABEN") {
      query.area = area;
    }

    // Fetch all matching questions
    const allQuestions = await questionsCol.find(query).toArray();

    if (allQuestions.length === 0) {
      return NextResponse.json(
        { error: "No questions available for this exam" },
        { status: 404 }
      );
    }

    // Shuffle and limit questions
    const shuffledQuestions = allQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(questionCount, allQuestions.length));

    // Remove correct answers from questions sent to client
    const questionsForClient = shuffledQuestions.map((q) => ({
      _id: q._id,
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      difficulty: q.difficulty,
      category: q.category,
    }));

    // Create exam session
    const examSession = {
      userId: new ObjectId(userId),
      userName: user.name,
      course,
      area: course === "BSABEN" ? area : undefined,
      subject,
      questionIds: shuffledQuestions.map((q) => q._id),
      answers: {}, // Will store user answers as they submit
      startedAt: new Date(),
      completedAt: null,
      score: null,
      totalQuestions: questionsForClient.length,
      status: "in-progress", // in-progress, completed, abandoned, flagged
      violations: [], // Track cheating violations
      violationCount: 0,
      wasFlagged: false, // If exam was auto-submitted due to violations
    };

    const result = await examSessionsCol.insertOne(examSession);

    return NextResponse.json({
      examSessionId: result.insertedId.toString(),
      questions: questionsForClient,
      totalQuestions: questionsForClient.length,
      course,
      area: course === "BSABEN" ? area : undefined,
      subject,
      startedAt: examSession.startedAt,
    });
  } catch (error) {
    console.error("POST /api/exams/start error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}