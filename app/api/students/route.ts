import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";
import { User, Student, sanitizeUser } from "@/models/User";

// ─── GET /api/students ─────────────────────────────────────────────────────────
// Admin → all courses; Faculty → scoped to their own course automatically
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const course = searchParams.get("course");
    const status = searchParams.get("status") || "approved";
    const search = searchParams.get("search");
    const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
    const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db     = client.db(dbName);
    const usersCol = db.collection<User>("users");

    const user = await usersCol.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.role !== "admin" && user.role !== "faculty") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // ── Build filter ───────────────────────────────────────────────────────────
    const filter: any = { role: "student", status };

    if (user.role === "faculty") {
      // Faculty always scoped to their own course — ignore any course param from client
      filter.course = (user as any).course;
    } else if (course) {
      // Admin may optionally filter by course
      filter.course = course;
    }

    if (search) {
      filter.$or = [
        { name:          { $regex: search, $options: "i" } },
        { email:         { $regex: search, $options: "i" } },
        { studentNumber: { $regex: search, $options: "i" } },
      ];
    }

    // ── Query ──────────────────────────────────────────────────────────────────
    const [students, total] = await Promise.all([
      usersCol.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
      usersCol.countDocuments(filter),
    ]);

    // ── Stats (scoped to what the requester can see) ───────────────────────────
    const statsBase: any = { role: "student", status: "approved" };
    if (user.role === "faculty") statsBase.course = (user as any).course;

    const [bsabenCount, bsgeCount] = await Promise.all([
      user.role === "faculty" && (user as any).course !== "BSABEN"
        ? Promise.resolve(0)
        : usersCol.countDocuments({ ...statsBase, course: "BSABEN" }),
      user.role === "faculty" && (user as any).course !== "BSGE"
        ? Promise.resolve(0)
        : usersCol.countDocuments({ ...statsBase, course: "BSGE" }),
    ]);

    return NextResponse.json({
      students: students.map(sanitizeUser),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalStudents: bsabenCount + bsgeCount,
        bsabenCount,
        bsgeCount,
      },
    });
  } catch (error) {
    console.error("GET /api/students error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}