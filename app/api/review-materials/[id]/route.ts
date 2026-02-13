import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";
import { ReviewMaterial } from "@/models/ReviewMaterials";
import { User } from "@/models/User";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // ← await params here
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Connect to database
    const client = await clientPromise;
    const db = client.db(dbName);
    const materialsCollection = db.collection<ReviewMaterial>("reviewMaterials");
    const usersCollection = db.collection<User>("users");

    // Get user
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get material
    const material = await materialsCollection.findOne({ _id: new ObjectId(id) });
    if (!material) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }

    // Permission check
    if (user.role === "faculty") {
      // Faculty can only delete their own materials in their course
      if (material.uploadedBy.toString() !== userId || material.course !== user.course) {
        return NextResponse.json(
          { error: "You can only delete your own materials in your course" },
          { status: 403 }
        );
      }
    } else if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Delete material
    await materialsCollection.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      message: "Material deleted successfully",
    });

  } catch (error) {
    console.error("❌ Delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}