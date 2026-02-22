import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";
import { Subject, CourseType } from "@/models/Questions";
import { User } from "@/models/User";

// ─── GET /api/subjects ──────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const course = searchParams.get("course") as CourseType | null;
    const area = searchParams.get("area"); // NEW: Filter by area for BSABEN
    const search = searchParams.get("search");

    const client = await clientPromise;
    const db = client.db(dbName);
    const subjectsCol = db.collection<Subject>("subjects");
    const questionsCol = db.collection("questions");

    // Build filter
    const filter: Record<string, unknown> = {};
    if (course) filter.course = course;
    if (area) filter.area = area; // NEW: Filter subjects by area (for BSABEN)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const subjects = await subjectsCol
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    // Get question counts for each subject
    const subjectsWithCounts = await Promise.all(
      subjects.map(async (subject) => {
        // Build question filter - CRITICAL FIX
        const questionFilter: any = {
          subject: subject.name,
          course: subject.course,
        };
        
        // For BSABEN subjects, also filter by area when counting questions
        if (subject.course === "BSABEN" && subject.area) {
          questionFilter.area = subject.area;
        }

        const questionCount = await questionsCol.countDocuments(questionFilter);
        return { ...subject, questionCount };
      })
    );

    return NextResponse.json({
      subjects: subjectsWithCounts,
      total: subjects.length,
    });
  } catch (error) {
    console.error("GET /api/subjects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/subjects ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, course, timerHH, timerMM, timerSS, area, userId } = body;

    const timer = (parseInt(timerHH || "0") * 3600) + (parseInt(timerMM || "0") * 60) + parseInt(timerSS || "0");

    // Validation
    if (!name || !course || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: name, course, userId" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: "Invalid userId" },
        { status: 400 }
      );
    }

    const validCourses: CourseType[] = ["BSABEN", "BSGE"];
    if (!validCourses.includes(course)) {
      return NextResponse.json(
        { error: "Invalid course. Must be BSABEN or BSGE." },
        { status: 400 }
      );
    }

    // BSABEN requires area
    if (course === "BSABEN" && !area) {
      return NextResponse.json(
        { error: "Area is required for BSABEN subjects" },
        { status: 400 }
      );
    }

    // BSGE should not have area
    if (course === "BSGE" && area) {
      return NextResponse.json(
        { error: "BSGE subjects should not have an area" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const subjectsCol = db.collection<Subject>("subjects");
    const usersCol = db.collection<User>("users");

    // Check user authorization
    const user = await usersCol.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "admin" && user.role !== "faculty") {
      return NextResponse.json(
        { error: "Unauthorized. Only admin and faculty can create subjects." },
        { status: 403 }
      );
    }

    // Check for duplicate subject name within the same course (and area for BSABEN)
    const duplicateFilter: any = {
      name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
      course: course,
    };

    // For BSABE, also check within the same area
    if (course === "BSABEN") {
      duplicateFilter.area = area;
    }

    const existing = await subjectsCol.findOne(duplicateFilter);

    if (existing) {
      const errorMsg = course === "BSABEN" 
        ? "A subject with this name already exists in this area."
        : "A subject with this name already exists for this course.";
      return NextResponse.json({ error: errorMsg }, { status: 409 });
    }

    const now = new Date();
    const newSubject: Omit<Subject, "_id"> = {
      name: name.trim(),
      description: description?.trim() || undefined,
      course,
      area: course === "BSABEN" ? area : undefined, 
      timer,
      createdBy: new ObjectId(userId),
      createdByName: user.name,
      createdAt: now,
      updatedAt: now,
    };

    const result = await subjectsCol.insertOne(newSubject as Subject);
    const created = await subjectsCol.findOne({ _id: result.insertedId });

    return NextResponse.json(
      {
        message: "Subject created successfully",
        subject: { ...created, questionCount: 0 },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/subjects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}