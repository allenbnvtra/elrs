import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";
import { Archive } from "@/models/Archive";
import { User } from "@/models/User";

// ─── DELETE /api/archives/[id] ─────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id }   = await params;
    const { searchParams } = new URL(request.url);
    const userId   = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }
    if (!ObjectId.isValid(id) || !ObjectId.isValid(userId)) {
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
    const archive    = await archiveCol.findOne({ _id: new ObjectId(id) });

    if (!archive) {
      return NextResponse.json({ error: "Archive entry not found" }, { status: 404 });
    }

    await archiveCol.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true, message: "Archive entry permanently deleted" });
  } catch (error) {
    console.error("DELETE /api/archives/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}