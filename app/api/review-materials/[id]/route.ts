import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";
import { ReviewMaterial } from "@/models/ReviewMaterials";
import { Archive } from "@/models/Archive";
import { User, Faculty } from "@/models/User";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    if (!ObjectId.isValid(id) || !ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const client      = await clientPromise;
    const db          = client.db(dbName);
    const materialsCol = db.collection<ReviewMaterial>("reviewMaterials");
    const usersCol     = db.collection<User>("users");
    const archivesCol  = db.collection<Archive>("archives");

    const [user, material] = await Promise.all([
      usersCol.findOne({ _id: new ObjectId(userId) }),
      materialsCol.findOne({ _id: new ObjectId(id) }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    // Permission check
    if (user.role === "faculty") {
      const faculty = user as Faculty;
      if (material.uploadedBy.toString() !== userId || material.course !== faculty.course) {
        return NextResponse.json(
          { error: "You can only delete your own materials in your course" },
          { status: 403 }
        );
      }
    } else if (user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Archive before deleting
    const now = new Date();
    const archiveEntry: Archive = {
      type:               "material",
      title:              material.title ?? "Untitled Material",
      description:        material.description,
      course:             material.course,
      originalId:         new ObjectId(id),
      originalCollection: "reviewMaterials",
      archivedBy:         new ObjectId(userId),
      archivedByName:     user.name,
      archivedByRole:     user.role,
      archivedAt:         now,
      reason:             "Deleted by user",
      originalData:       material,
      canRestore:         true,
      createdAt:          now,
      updatedAt:          now,
    };

    await archivesCol.insertOne(archiveEntry);
    await materialsCol.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ message: "Material archived and deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/materials/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}