import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";
import { Area } from "@/models/Questions";
import { Archive } from "@/models/Archive";
import { User } from "@/models/User";

// ─── PUT /api/areas/[id] ────────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, timerHH, timerMM, timerSS, userId } = body;

    const timer =
      (parseInt(timerHH || "0") * 3600) +
      (parseInt(timerMM || "0") * 60) +
       parseInt(timerSS  || "0");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    if (!name?.trim()) {
      return NextResponse.json({ error: "Area name is required" }, { status: 400 });
    }
    if (!ObjectId.isValid(id) || !ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const areasCol = db.collection<Area>("areas");
    const usersCol = db.collection<User>("users");

    // Auth check
    const user = await usersCol.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.role !== "admin" && user.role !== "faculty") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Existence check
    const existing = await areasCol.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return NextResponse.json({ error: "Area not found" }, { status: 404 });
    }

    // Duplicate name check (excluding self)
    const duplicate = await areasCol.findOne({
      _id: { $ne: new ObjectId(id) },
      course: "BSABEN",
      name: {
        $regex: `^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "An area with this name already exists." },
        { status: 409 }
      );
    }

    await areasCol.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name: name.trim(),
          description: description?.trim() || undefined,
          timer: timer ?? existing.timer,
          updatedAt: new Date(),
        },
      }
    );

    const updated = await areasCol.findOne({ _id: new ObjectId(id) });

    return NextResponse.json({ message: "Area updated successfully", area: updated });
  } catch (error) {
    console.error("PUT /api/areas/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE /api/areas/[id] ─────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    if (!ObjectId.isValid(id) || !ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const areasCol  = db.collection<Area>("areas");
    const usersCol  = db.collection<User>("users");
    const archivesCol = db.collection<Archive>("archives");

    // Auth check
    const user = await usersCol.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.role !== "admin" && user.role !== "faculty") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Existence check
    const area = await areasCol.findOne({ _id: new ObjectId(id) });
    if (!area) {
      return NextResponse.json({ error: "Area not found" }, { status: 404 });
    }

    // Archive before deleting
    const now = new Date();
    const archiveEntry: Archive = {
      type:               "area",
      title:              area.name,
      course:             area.course,
      originalId:         new ObjectId(id),
      originalCollection: "areas",
      archivedBy:         new ObjectId(userId),
      archivedByName:     user.name,
      archivedByRole:     user.role,
      archivedAt:         now,
      reason:             "Deleted by user",
      originalData:       area,
      canRestore:         true,
      createdAt:          now,
      updatedAt:          now,
    };

    await archivesCol.insertOne(archiveEntry);
    await areasCol.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true, message: "Area archived and deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/areas/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}