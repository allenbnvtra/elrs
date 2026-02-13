import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";
import { User, Faculty, Admin, sanitizeUser } from "@/models/User";

// ─── POST /api/coordinators/approve ────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { coordinatorId, userId, action } = body;

    // Validation
    if (!coordinatorId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: coordinatorId and userId" },
        { status: 400 }
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(coordinatorId) || !ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: "Invalid ID format" },
        { status: 400 }
      );
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

    // Get the coordinator to approve
    const coordinator = await usersCol.findOne({
      _id: new ObjectId(coordinatorId),
      role: "faculty",
    }) as Faculty | null;

    if (!coordinator) {
      return NextResponse.json(
        { error: "Coordinator not found" },
        { status: 404 }
      );
    }

    // Check if coordinator is already approved/rejected
    if (coordinator.status === "approved") {
      return NextResponse.json(
        { error: "Coordinator is already approved" },
        { status: 400 }
      );
    }

    if (coordinator.status === "rejected") {
      return NextResponse.json(
        { error: "Coordinator is already rejected" },
        { status: 400 }
      );
    }

    // Update coordinator status
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

    const result = await usersCol.updateOne(
      { _id: new ObjectId(coordinatorId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update coordinator" },
        { status: 500 }
      );
    }

    // Get updated coordinator
    const updatedCoordinator = await usersCol.findOne({
      _id: new ObjectId(coordinatorId),
    }) as Faculty;

    return NextResponse.json({
      message: `Coordinator ${action === "approve" ? "approved" : "rejected"} successfully`,
      coordinator: sanitizeUser(updatedCoordinator),
    });
  } catch (error) {
    console.error("POST /api/coordinators/approve error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── GET /api/coordinators/approve ────────────────────────────────────────────
// Get pending coordinators (for approval page)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const course = searchParams.get("course");
    const status = searchParams.get("status") || "pending";

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

    // Check authorization - ONLY admins can view coordinators
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Only administrators can view coordinators." },
        { status: 403 }
      );
    }

    // Build filter
    const filter: any = {
      role: "faculty",
      status: status,
    };

    // Admin can filter by course
    if (course) {
      filter.course = course;
    }

    const coordinators = await usersCol
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      coordinators: coordinators.map(sanitizeUser),
      total: coordinators.length,
    });
  } catch (error) {
    console.error("GET /api/coordinators/approve error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}