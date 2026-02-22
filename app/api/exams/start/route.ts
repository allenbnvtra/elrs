import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";
import { Question } from "@/models/Questions";
import { User } from "@/models/User";

// ─── POST /api/exams/start ─────────────────────────────────────────────────────
// Starts an exam and returns questions
// BSGE   → subject required, area optional
// BSABEN → area required, subject optional (all subjects in area are combined)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { course, area, subject, userId, questionCount = 50 } = body;

    // BSABEN needs area; BSGE needs subject; both need course + userId
    if (!userId || !course || (!subject && !area)) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db     = client.db(dbName);
    const questionsCol    = db.collection<Question>("questions");
    const usersCol        = db.collection<User>("users");
    const examSessionsCol = db.collection("examSessions");

    // ── Verify user ──────────────────────────────────────────────────────────
    const user = await usersCol.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role === "student" || user.role === "faculty") {
      if ("course" in user && user.course !== course) {
        return NextResponse.json(
          { error: "Course does not match user's enrolled course" },
          { status: 403 }
        );
      }
    }

    // ── Build question query ─────────────────────────────────────────────────
    const query: any = { course, isActive: true };
    if (subject) query.subject = subject;
    if (area)    query.area    = area;

    // ── Fetch + shuffle + limit ──────────────────────────────────────────────
    const allQuestions = await questionsCol.find(query).toArray();

    if (allQuestions.length === 0) {
      return NextResponse.json(
        { error: "No questions available for this exam" },
        { status: 404 }
      );
    }

    const shuffledQuestions = allQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(questionCount, allQuestions.length));

    // Strip correct answers before sending to client
    // Include subject field so the exam UI can badge each question (BSABEN)
    const questionsForClient = shuffledQuestions.map((q) => ({
      _id:          q._id,
      questionText: q.questionText,
      optionA:      q.optionA,
      optionB:      q.optionB,
      optionC:      q.optionC,
      optionD:      q.optionD,
      difficulty:   q.difficulty,
      category:     q.category,
      subject:      q.subject,   // shown as badge in BSABEN area exams
    }));

    // ── Fetch timer from examAreas (BSABEN) ──────────────────────────────────
    let timer = 0;
    if (area) {
      const areaConfig = await db.collection("examAreas").findOne({ area, course });
      if (areaConfig?.timer) timer = areaConfig.timer;
    }

    // ── Create exam session ──────────────────────────────────────────────────
    const examSession = {
      userId:         new ObjectId(userId),
      userName:       user.name,
      course,
      ...(area    && { area }),
      ...(subject && { subject }),
      questionIds:    shuffledQuestions.map((q) => q._id),
      answers:        {},
      startedAt:      new Date(),
      completedAt:    null,
      score:          null,
      totalQuestions: questionsForClient.length,
      timer,
      status:         "in-progress",
      violations:     [],
      violationCount: 0,
      wasFlagged:     false,
    };

    const result = await examSessionsCol.insertOne(examSession);

    return NextResponse.json({
      examSessionId:  result.insertedId.toString(),
      questions:      questionsForClient,
      totalQuestions: questionsForClient.length,
      course,
      ...(area    && { area }),
      ...(subject && { subject }),
      startedAt:      examSession.startedAt,
      timer,
    });
  } catch (error) {
    console.error("POST /api/exams/start error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}