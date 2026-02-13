import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { Archive } from "@/models/Archive";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { archiveId, userId } = body;

    // Validation
    if (!archiveId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const archiveCollection = db.collection<Archive>("archives");

    // Get archive entry
    const archive = await archiveCollection.findOne({
      _id: new ObjectId(archiveId)
    });

    if (!archive) {
      return NextResponse.json(
        { error: "Archive entry not found" },
        { status: 404 }
      );
    }

    if (!archive.canRestore) {
      return NextResponse.json(
        { error: "This item cannot be restored" },
        { status: 400 }
      );
    }

    // Get original collection
    const originalCollection = db.collection(archive.originalCollection);

    // Check if item with same ID already exists (edge case)
    const existing = await originalCollection.findOne({
      _id: archive.originalId
    });

    if (existing) {
      return NextResponse.json(
        { error: "An item with this ID already exists in the original collection" },
        { status: 409 }
      );
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

    return NextResponse.json({
      success: true,
      message: "Item restored successfully",
      restoredId: archive.originalId
    });

  } catch (error) {
    console.error("Error restoring item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}