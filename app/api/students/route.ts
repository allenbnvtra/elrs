import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";
import { User, Student, sanitizeUser } from "@/models/User";

// ─── GET /api/students ──────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const course = searchParams.get("course");
    const status = searchParams.get("status") || "approved"; // Default to approved students
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const usersCol = db.collection<User>("users");

    // Get the user making the request
    const user = await usersCol.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check authorization - Admin and Faculty can view students
    if (user.role !== "admin" && user.role !== "faculty") {
      return NextResponse.json(
        { error: "Unauthorized. Only admins and faculty can view students." },
        { status: 403 }
      );
    }

    // Build filter
    const filter: any = {
      role: "student",
      status: status,
    };

    // Faculty can only see students from their course
    if (user.role === "faculty") {
      const faculty = user as any;
      filter.course = faculty.course;
    } else if (course) {
      // Admin can filter by course
      filter.course = course;
    }

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { studentNumber: { $regex: search, $options: "i" } },
      ];
    }

    const [students, total] = await Promise.all([
      usersCol
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      usersCol.countDocuments(filter),
    ]);

    // Calculate statistics
    const stats = {
      totalStudents: total,
      bsabeCount: await usersCol.countDocuments({ role: "student", course: "BSABE", status: "approved" }),
      bsgeCount: await usersCol.countDocuments({ role: "student", course: "BSGE", status: "approved" }),
    };

    return NextResponse.json({
      students: students.map(sanitizeUser),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error) {
    console.error("GET /api/students error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}