import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";
import { User, sanitizeUser } from "@/models/User";

// ─── GET /api/students ─────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const course = searchParams.get("course");
    const status = searchParams.get("status") || "approved";
    const search = searchParams.get("search");
    const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
    const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));

    if (!userId) return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    if (!ObjectId.isValid(userId)) return NextResponse.json({ error: "Invalid userId" }, { status: 400 });

    const client   = await clientPromise;
    const db       = client.db(dbName);
    const usersCol = db.collection<User>("users");

    const user = await usersCol.findOne({ _id: new ObjectId(userId) });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.role !== "admin" && user.role !== "faculty") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // ── Build filter ───────────────────────────────────────────────────────────
    const filter: any = { role: "student", status };

    if (user.role === "faculty") {
      filter.course = (user as any).course;
    } else if (course) {
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

    // ── Stats ──────────────────────────────────────────────────────────────────
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
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      stats: { totalStudents: bsabenCount + bsgeCount, bsabenCount, bsgeCount },
    });
  } catch (error) {
    console.error("GET /api/students error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PATCH /api/students ───────────────────────────────────────────────────────
// Body: { requesterId, studentId, action: "deactivate" | "activate" }
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { requesterId, studentId, action } = body as {
      requesterId: string;
      studentId:   string;
      action:      "deactivate" | "activate";
    };

    // ── Validate inputs ────────────────────────────────────────────────────────
    if (!requesterId || !studentId || !action) {
      return NextResponse.json({ error: "Missing required fields: requesterId, studentId, action" }, { status: 400 });
    }
    if (!ObjectId.isValid(requesterId) || !ObjectId.isValid(studentId)) {
      return NextResponse.json({ error: "Invalid id format" }, { status: 400 });
    }
    if (!["deactivate", "activate"].includes(action)) {
      return NextResponse.json({ error: "action must be 'deactivate' or 'activate'" }, { status: 400 });
    }

    const client   = await clientPromise;
    const db       = client.db(dbName);
    const usersCol = db.collection<User>("users");

    // ── Auth check ─────────────────────────────────────────────────────────────
    const requester = await usersCol.findOne({ _id: new ObjectId(requesterId) });
    if (!requester) return NextResponse.json({ error: "Requester not found" }, { status: 404 });
    if (requester.role !== "admin" && requester.role !== "faculty") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // ── Find target student ────────────────────────────────────────────────────
    const student = await usersCol.findOne({
      _id:  new ObjectId(studentId),
      role: "student",
    });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    // Faculty can only modify students in their own course
    if (requester.role === "faculty" && (student as any).course !== (requester as any).course) {
      return NextResponse.json({ error: "Unauthorized: student is not in your course" }, { status: 403 });
    }

    // ── Apply update ───────────────────────────────────────────────────────────
    const newStatus = action === "deactivate" ? "pending" : "approved";

    const result = await usersCol.findOneAndUpdate(
      { _id: new ObjectId(studentId) },
      {
        $set: {
          status:      newStatus,
          updatedAt:   new Date(),
          updatedBy:   new ObjectId(requesterId),
        },
      },
      { returnDocument: "after" },
    );

    if (!result) return NextResponse.json({ error: "Failed to update student" }, { status: 500 });

    return NextResponse.json({
      message: `Student ${action}d successfully`,
      student: sanitizeUser(result),
    });
  } catch (error) {
    console.error("PATCH /api/students error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}