import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";
import { Question, CourseType, DifficultyType, CorrectAnswer } from "@/models/Questions";
import { User } from "@/models/User";

// ─── GET /api/questions ────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const course = searchParams.get("course") as CourseType | null;
    const area = searchParams.get("area");
    const subject = searchParams.get("subject");
    const category = searchParams.get("category");
    const difficulty = searchParams.get("difficulty") as DifficultyType | null;
    const isActiveParam = searchParams.get("isActive");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10)));

    const client = await clientPromise;
    const db = client.db(dbName);
    const col = db.collection<Question>("questions");

    // Build filter
    const filter: Record<string, unknown> = {};
    if (course) filter.course = course;
    if (area) filter.area = area;
    if (subject) filter.subject = subject;
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    
    // NEW: Filter by active/inactive status
    if (isActiveParam !== null) {
      filter.isActive = isActiveParam === "true";
    }
    
    if (search) {
      filter.$or = [
        { questionText: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
      ];
    }

    const [questions, total] = await Promise.all([
      col
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      col.countDocuments(filter),
    ]);

    return NextResponse.json({
      questions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/questions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/questions ───────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      difficulty,
      category,
      course,
      area,
      subject,
      explanation,
      isActive = true, // NEW: Default to active
      userId,
    } = body;

    // Validation
    if (!questionText || !optionA || !optionB || !correctAnswer || !difficulty || !category || !course || !subject || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // BSABEN requires area
    if (course === "BSABEN" && !area) {
      return NextResponse.json({ error: "Area is required for BSABEN questions" }, { status: 400 });
    }

    // BSGE should not have area
    if (course === "BSGE" && area) {
      return NextResponse.json({ error: "BSGE questions should not have an area" }, { status: 400 });
    }

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    const validCourses: CourseType[] = ["BSABEN", "BSGE"];
    const validDifficulties: DifficultyType[] = ["Easy", "Medium", "Hard"];
    const validAnswers: CorrectAnswer[] = ["A", "B", "C", "D"];

    if (!validCourses.includes(course)) {
      return NextResponse.json({ error: "Invalid course. Must be BSABEN or BSGE." }, { status: 400 });
    }
    if (!validDifficulties.includes(difficulty)) {
      return NextResponse.json({ error: "Invalid difficulty." }, { status: 400 });
    }
    if (!validAnswers.includes(correctAnswer)) {
      return NextResponse.json({ error: "Invalid correct answer. Must be A, B, C, or D." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const questionsCol = db.collection<Question>("questions");
    const usersCol = db.collection<User>("users");

    const user = await usersCol.findOne({ _id: new ObjectId(userId) });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.role !== "admin" && user.role !== "faculty") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check for duplicate question text (case-insensitive) within same course
    const duplicateFilter: any = {
      course,
      questionText: { $regex: `^${questionText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    };
    
    // For BSABEN, also check area and subject to allow same question text in different areas/subjects
    if (course === "BSABEN") {
      duplicateFilter.area = area;
      duplicateFilter.subject = subject;
    } else {
      duplicateFilter.subject = subject;
    }

    const existing = await questionsCol.findOne(duplicateFilter);
    if (existing) {
      return NextResponse.json({ error: "A question with this text already exists in this area/subject." }, { status: 409 });
    }

    const now = new Date();
    const newQuestion: Omit<Question, "_id"> = {
      questionText,
      optionA,
      optionB,
      optionC: optionC || undefined,
      optionD: optionD || undefined,
      correctAnswer,
      difficulty,
      category,
      course,
      area: course === "BSABEN" ? area : undefined,
      subject,
      explanation: explanation || undefined,
      isActive: typeof isActive === 'boolean' ? isActive : true, // NEW: Handle isActive field
      createdBy: new ObjectId(userId),
      createdByName: user.name,
      createdAt: now,
      updatedAt: now,
    };

    const result = await questionsCol.insertOne(newQuestion as Question);
    const created = await questionsCol.findOne({ _id: result.insertedId });

    return NextResponse.json({ message: "Question created successfully", question: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/questions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}