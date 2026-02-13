import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { Archive, ArchiveStats } from "@/models/Archive";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      title,
      description,
      course,
      originalId,
      originalCollection,
      archivedBy,
      archivedByName,
      archivedByRole,
      reason,
      originalData,
      itemCount,
      tags
    } = body;

    // Validation
    if (!type || !title || !originalId || !originalCollection || !archivedBy) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const archiveCollection = db.collection<Archive>("archives");
    const originalDbCollection = db.collection(originalCollection);

    // Check if item exists in original collection
    const originalItem = await originalDbCollection.findOne({
      _id: new ObjectId(originalId)
    });

    if (!originalItem) {
      return NextResponse.json(
        { error: "Original item not found" },
        { status: 404 }
      );
    }

    // Check if already archived
    const existingArchive = await archiveCollection.findOne({
      originalId: new ObjectId(originalId),
      originalCollection
    });

    if (existingArchive) {
      return NextResponse.json(
        { error: "Item is already archived" },
        { status: 409 }
      );
    }

    // Create archive entry
    const archiveEntry: Archive = {
      type,
      title,
      description,
      course,
      originalId: new ObjectId(originalId),
      originalCollection,
      archivedBy: new ObjectId(archivedBy),
      archivedByName,
      archivedByRole,
      archivedAt: new Date(),
      reason,
      originalData: originalData || originalItem,
      itemCount,
      tags,
      canRestore: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await archiveCollection.insertOne(archiveEntry);

    // Delete from original collection
    await originalDbCollection.deleteOne({ _id: new ObjectId(originalId) });

    return NextResponse.json({
      success: true,
      message: "Item archived successfully",
      archiveId: result.insertedId
    });

  } catch (error) {
    console.error("Error archiving item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const course = searchParams.get("course");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db();
    const archiveCollection = db.collection<Archive>("archives");

    // Build query
    const query: any = {};
    
    if (type && type !== "all") {
      query.type = type;
    }
    
    if (course && course !== "all") {
      query.course = course;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { reason: { $regex: search, $options: "i" } }
      ];
    }

    // Get total count
    const total = await archiveCollection.countDocuments(query);

    // Get archives
    const archives = await archiveCollection
      .find(query)
      .sort({ archivedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get statistics
    const stats = await getArchiveStats(archiveCollection);

    return NextResponse.json({
      success: true,
      archives,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      stats
    });

  } catch (error) {
    console.error("Error fetching archives:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function getArchiveStats(archiveCollection: any): Promise<ArchiveStats> {
  const allArchives = await archiveCollection.find({}).toArray();

  const stats: ArchiveStats = {
    totalArchived: allArchives.length,
    byType: {
      exam: allArchives.filter((a: Archive) => a.type === "exam").length,
      material: allArchives.filter((a: Archive) => a.type === "material").length,
      questions: allArchives.filter((a: Archive) => a.type === "questions").length,
      subject: allArchives.filter((a: Archive) => a.type === "subject").length,
      student: allArchives.filter((a: Archive) => a.type === "student").length,
      faculty: allArchives.filter((a: Archive) => a.type === "faculty").length
    },
    byCourse: {
      BSABEN: allArchives.filter((a: Archive) => a.course === "BSABEN").length,
      BSGE: allArchives.filter((a: Archive) => a.course === "BSGE").length
    },
    recentlyArchived: allArchives.filter((a: Archive) => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(a.archivedAt) >= thirtyDaysAgo;
    }).length
  };

  return stats;
}