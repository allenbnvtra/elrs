import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";
import { User, CourseType } from "@/models/User";

// ─── POST /api/coordinators/approve-all ────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, course, action } = body;

    // Validation
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

    // Get the user performing the action
    const user = await usersCol.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check authorization - ONLY admins can approve coordinators
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Only administrators can approve coordinators." },
        { status: 403 }
      );
    }

    // Build filter for coordinators to approve
    const filter: any = {
      role: "faculty",
      status: "pending",
    };

    // Admin can specify a course or approve all
    let targetCourse: CourseType | null = null;
    if (course) {
      targetCourse = course as CourseType;
      filter.course = course;
    }

    // Count pending coordinators before approval
    const pendingCount = await usersCol.countDocuments(filter);

    if (pendingCount === 0) {
      return NextResponse.json(
        {
          message: "No pending coordinators to process",
          processed: 0,
          course: targetCourse,
        },
        { status: 200 }
      );
    }

    // Update all pending coordinators
    const now = new Date();
    const updateData: any = {
      status: action === "approve" ? "approved" : "rejected",
      updatedAt: now,
    };

    if (action === "approve") {
      updateData.approvedBy = new ObjectId(userId);
      updateData.approvedByName = user.name;
      updateData.approvedAt = now;
    }

    const result = await usersCol.updateMany(filter, {
      $set: updateData,
    });

    return NextResponse.json({
      message: `Successfully ${action === "approve" ? "approved" : "rejected"} ${result.modifiedCount} coordinator(s)`,
      processed: result.modifiedCount,
      course: targetCourse,
      action: action,
      processedBy: user.name,
    });
  } catch (error) {
    console.error("POST /api/coordinators/approve-all error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}