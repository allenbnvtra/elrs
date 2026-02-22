import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";
import { User, Faculty } from "@/models/User";

// ─── POST /api/students/approve-all ────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { userId, action } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Missing required field: userId" },
        { status: 400 }
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const usersCol = db.collection<User>("users");

    const user = await usersCol.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "admin" && user.role !== "faculty") {
      return NextResponse.json(
        { error: "Unauthorized. Only admin and faculty can approve students." },
        { status: 403 }
      );
    }

    // Build filter — faculty is scoped to their course; admin sees all courses
    const filter: Record<string, unknown> = { role: "student", status: "pending" };

    if (user.role === "faculty") {
      filter.course = (user as Faculty).course;
    }
    // admin: no course filter → targets all pending students across all courses

    const pendingCount = await usersCol.countDocuments(filter);
    if (pendingCount === 0) {
      return NextResponse.json(
        { message: "No pending students to process", processed: 0 },
        { status: 200 }
      );
    }

    const now = new Date();
    const updateData: Record<string, unknown> = {
      status: action === "approve" ? "approved" : "rejected",
      updatedAt: now,
    };

    if (action === "approve") {
      updateData.approvedBy = new ObjectId(userId);
      updateData.approvedByName = user.name;
      updateData.approvedAt = now;
    }

    const result = await usersCol.updateMany(filter, { $set: updateData });

    return NextResponse.json({
      message: `Successfully ${action === "approve" ? "approved" : "rejected"} ${result.modifiedCount} student(s)`,
      processed: result.modifiedCount,
      action,
      processedBy: user.name,
    });
  } catch (error) {
    console.error("POST /api/students/approve-all error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}