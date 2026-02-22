import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";
import { Archive } from "@/models/Archive";
import { User } from "@/models/User";

// ─── POST /api/archives/restore ────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { archiveId, userId } = await request.json();

    if (!archiveId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!ObjectId.isValid(archiveId) || !ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const client   = await clientPromise;
    const db       = client.db(dbName);
    const usersCol = db.collection<User>("users");

    const user = await usersCol.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.role !== "admin" && user.role !== "faculty") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const archiveCol = db.collection<Archive>("archives");
    const archive    = await archiveCol.findOne({ _id: new ObjectId(archiveId) });

    if (!archive) {
      return NextResponse.json({ error: "Archive entry not found" }, { status: 404 });
    }
    if (!archive.canRestore) {
      return NextResponse.json({ error: "This item cannot be restored" }, { status: 400 });
    }

    const originalCol = db.collection(archive.originalCollection);
    const existing    = await originalCol.findOne({ _id: archive.originalId });

    if (existing) {
      return NextResponse.json(
        { error: "An item with this ID already exists in the original collection" },
        { status: 409 }
      );
    }

    await originalCol.insertOne({
      ...archive.originalData as object,
      _id:       archive.originalId,
      updatedAt: new Date(),
    });

    await archiveCol.deleteOne({ _id: new ObjectId(archiveId) });

    return NextResponse.json({
      success:    true,
      message:    "Item restored successfully",
      restoredId: archive.originalId,
    });
  } catch (error) {
    console.error("POST /api/archives/restore error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}