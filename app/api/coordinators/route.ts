import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";
import { User, Faculty, sanitizeUser } from "@/models/User";
import { Archive } from "@/models/Archive";

// ─── GET /api/coordinators ──────────────────────────────────────────────────
// Get list of coordinators (approved faculty members)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const course = searchParams.get("course");
    const status = searchParams.get("status") || "approved";
    const search = searchParams.get("search");

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
    const questionsCol = db.collection("questions");

    // Get the user making the request
    const user = await usersCol.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check authorization - Only admins can view coordinators
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

    if (course) filter.course = course;

    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const coordinators = await usersCol
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray() as Faculty[];

    // Enrich with contribution counts
    const enrichedCoordinators = await Promise.all(
      coordinators.map(async (coord) => {
        const contributions = await questionsCol.countDocuments({
          createdBy: coord._id,
        });
        return { ...sanitizeUser(coord), contributions };
      })
    );

    const totalContributions = enrichedCoordinators.reduce(
      (sum, coord) => sum + coord.contributions,
      0
    );

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeCount = coordinators.filter(
      (c) => c.lastActive && new Date(c.lastActive) > fiveMinutesAgo
    ).length;

    return NextResponse.json({
      coordinators: enrichedCoordinators,
      total: coordinators.length,
      stats: {
        totalCoordinators: coordinators.length,
        activeCoordinators: activeCount,
        totalContributions,
        syncFrequency: activeCount > coordinators.length / 2 ? "High" : "Normal",
      },
    });
  } catch (error) {
    console.error("GET /api/coordinators error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE /api/coordinators ───────────────────────────────────────────────
// Revoke coordinator access (soft delete - set status to rejected)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coordinatorId = searchParams.get("coordinatorId");
    const userId        = searchParams.get("userId");

    if (!coordinatorId || !userId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(coordinatorId) || !ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const usersCol    = db.collection<User>("users");
    const archivesCol = db.collection<Archive>("archives");

    // Auth check
    const user = await usersCol.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Only administrators can revoke coordinator access." },
        { status: 403 }
      );
    }

    // Existence check
    const coordinator = await usersCol.findOne({
      _id: new ObjectId(coordinatorId),
      role: "faculty",
    });
    if (!coordinator) {
      return NextResponse.json({ error: "Coordinator not found" }, { status: 404 });
    }

    // Archive before revoking
    const now = new Date();
    const archiveEntry: Archive = {
      type:               "coordinator",
      title:              coordinator.name,
      course:             (coordinator as Faculty).course,
      originalId:         new ObjectId(coordinatorId),
      originalCollection: "users",
      archivedBy:         new ObjectId(userId),
      archivedByName:     user.name,
      archivedByRole:     user.role,
      archivedAt:         now,
      reason:             "Coordinator access revoked by admin",
      originalData:       coordinator,
      canRestore:         true,
      createdAt:          now,
      updatedAt:          now,
    };

    await archivesCol.insertOne(archiveEntry);

    // Soft delete — set status to rejected
    const result = await usersCol.updateOne(
      { _id: new ObjectId(coordinatorId) },
      { $set: { status: "rejected", updatedAt: now } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Failed to revoke access" }, { status: 500 });
    }

    return NextResponse.json({
      message: "Coordinator access revoked and archived successfully",
      coordinatorId,
    });
  } catch (error) {
    console.error("DELETE /api/coordinators error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}