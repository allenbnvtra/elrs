import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";
import { Archive } from "@/models/Archive";
import { User } from "@/models/User";

// ─── POST /api/archives/bulk ───────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { action, archiveIds, userId } = await request.json();

    if (!action || !Array.isArray(archiveIds) || archiveIds.length === 0 || !userId) {
      return NextResponse.json({ error: "Missing required fields or invalid data" }, { status: 400 });
    }
    if (!["restore", "delete", "export"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'restore', 'delete', or 'export'" },
        { status: 400 }
      );
    }
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
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
    const objectIds  = archiveIds.map((id: string) => new ObjectId(id));

    // ── Export ─────────────────────────────────────────────────────────────────
    if (action === "export") {
      const archives = await archiveCol.find({ _id: { $in: objectIds } }).toArray();
      return NextResponse.json({ success: true, data: archives, count: archives.length });
    }

    // ── Delete ─────────────────────────────────────────────────────────────────
    if (action === "delete") {
      const result = await archiveCol.deleteMany({ _id: { $in: objectIds } });
      return NextResponse.json({
        success:      true,
        message:      `${result.deletedCount} archive(s) permanently deleted`,
        deletedCount: result.deletedCount,
      });
    }

    // ── Restore ────────────────────────────────────────────────────────────────
    let successCount = 0;
    let failCount    = 0;
    const errors: string[] = [];

    for (const archiveId of archiveIds) {
      try {
        const archive = await archiveCol.findOne({ _id: new ObjectId(archiveId) });
        if (!archive)            { failCount++; errors.push(`Archive ${archiveId} not found`);               continue; }
        if (!archive.canRestore) { failCount++; errors.push(`Archive ${archiveId} cannot be restored`);     continue; }

        const originalCol = db.collection(archive.originalCollection);
        const existing    = await originalCol.findOne({ _id: archive.originalId });
        if (existing) { failCount++; errors.push(`Item ${archiveId} already exists in original collection`); continue; }

        await originalCol.insertOne({
          ...archive.originalData as object,
          _id:       archive.originalId,
          updatedAt: new Date(),
        });
        await archiveCol.deleteOne({ _id: new ObjectId(archiveId) });
        successCount++;
      } catch (err) {
        failCount++;
        errors.push(`Error restoring ${archiveId}: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    return NextResponse.json({
      success:      true,
      message:      `Bulk restore completed: ${successCount} restored, ${failCount} failed`,
      successCount,
      failCount,
      ...(errors.length > 0 && { errors }),
    });
  } catch (error) {
    console.error("POST /api/archives/bulk error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}