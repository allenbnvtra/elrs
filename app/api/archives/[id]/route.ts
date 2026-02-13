import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { Archive } from "@/models/Archive";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const archiveCollection = db.collection<Archive>("archives");

    // Check if archive exists
    const archive = await archiveCollection.findOne({
      _id: new ObjectId(id)
    });

    if (!archive) {
      return NextResponse.json(
        { error: "Archive entry not found" },
        { status: 404 }
      );
    }

    // Permanently delete from archives
    await archiveCollection.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      message: "Archive entry permanently deleted"
    });

  } catch (error) {
    console.error("Error deleting archive:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}