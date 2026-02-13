import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { Archive } from "@/models/Archive";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, archiveIds, userId } = body;

    // Validation
    if (!action || !archiveIds || !Array.isArray(archiveIds) || archiveIds.length === 0 || !userId) {
      return NextResponse.json(
        { error: "Missing required fields or invalid data" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const archiveCollection = db.collection<Archive>("archives");

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    if (action === "restore") {
      // Bulk restore
      for (const archiveId of archiveIds) {
        try {
          const archive = await archiveCollection.findOne({
            _id: new ObjectId(archiveId)
          });

          if (!archive) {
            failCount++;
            errors.push(`Archive ${archiveId} not found`);
            continue;
          }

          if (!archive.canRestore) {
            failCount++;
            errors.push(`Archive ${archiveId} cannot be restored`);
            continue;
          }

          // Get original collection
          const originalCollection = db.collection(archive.originalCollection);

          // Check if item already exists
          const existing = await originalCollection.findOne({
            _id: archive.originalId
          });

          if (existing) {
            failCount++;
            errors.push(`Item ${archiveId} already exists in original collection`);
            continue;
          }

          // Restore the original data
          const restoredData = {
            ...archive.originalData,
            _id: archive.originalId,
            updatedAt: new Date()
          };

          await originalCollection.insertOne(restoredData);

          // Delete from archives
          await archiveCollection.deleteOne({ _id: new ObjectId(archiveId) });

          successCount++;
        } catch (error) {
          failCount++;
          errors.push(`Error restoring ${archiveId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Bulk restore completed: ${successCount} restored, ${failCount} failed`,
        successCount,
        failCount,
        errors: errors.length > 0 ? errors : undefined
      });

    } else if (action === "delete") {
      // Bulk delete
      const objectIds = archiveIds.map(id => new ObjectId(id));
      
      const result = await archiveCollection.deleteMany({
        _id: { $in: objectIds }
      });

      return NextResponse.json({
        success: true,
        message: `${result.deletedCount} archives permanently deleted`,
        deletedCount: result.deletedCount
      });

    } else if (action === "export") {
      // Export archives data
      const objectIds = archiveIds.map(id => new ObjectId(id));
      
      const archives = await archiveCollection
        .find({ _id: { $in: objectIds } })
        .toArray();

      return NextResponse.json({
        success: true,
        data: archives,
        count: archives.length
      });

    } else {
      return NextResponse.json(
        { error: "Invalid action. Must be 'restore', 'delete', or 'export'" },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("Error in bulk operation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}