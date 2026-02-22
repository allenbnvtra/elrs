import { NextRequest, NextResponse } from "next/server";
import { ObjectId, Collection } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";
import { Archive, ArchiveStats } from "@/models/Archive";
import { User, Faculty } from "@/models/User";

// ─── POST /api/archives ────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const {
      type, title, description, course,
      originalId, originalCollection,
      archivedBy, archivedByName, archivedByRole,
      reason, originalData, itemCount, tags,
    } = await request.json();

    if (!type || !title || !originalId || !originalCollection || !archivedBy) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const client        = await clientPromise;
    const db            = client.db(dbName);
    const archiveCol    = db.collection<Archive>("archives");
    const originalCol   = db.collection(originalCollection);

    const originalItem = await originalCol.findOne({ _id: new ObjectId(originalId) });
    if (!originalItem) {
      return NextResponse.json({ error: "Original item not found" }, { status: 404 });
    }

    const existingArchive = await archiveCol.findOne({
      originalId: new ObjectId(originalId),
      originalCollection,
    });
    if (existingArchive) {
      return NextResponse.json({ error: "Item is already archived" }, { status: 409 });
    }

    const entry: Archive = {
      type, title, description, course,
      originalId:         new ObjectId(originalId),
      originalCollection,
      archivedBy:         new ObjectId(archivedBy),
      archivedByName,
      archivedByRole,
      archivedAt:         new Date(),
      reason,
      originalData:       originalData ?? originalItem,
      itemCount,
      tags,
      canRestore:         true,
      createdAt:          new Date(),
      updatedAt:          new Date(),
    };

    const result = await archiveCol.insertOne(entry);
    await originalCol.deleteOne({ _id: new ObjectId(originalId) });

    return NextResponse.json({
      success:   true,
      message:   "Item archived successfully",
      archiveId: result.insertedId,
    });
  } catch (error) {
    console.error("POST /api/archives error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── GET /api/archives ─────────────────────────────────────────────────────────
// Admin → full view; Faculty → scoped to their own course automatically
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId      = searchParams.get("userId");
    const type        = searchParams.get("type");
    const courseParam = searchParams.get("course");
    const search      = searchParams.get("search");
    const page        = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
    const limit       = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip        = (page - 1) * limit;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
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

    // Build query — faculty always scoped to their own course
    const query: Record<string, unknown> = {};
    if (type && type !== "all") query.type = type;

    if (user.role === "faculty") {
      query.course = (user as Faculty).course;
    } else if (courseParam && courseParam !== "all") {
      query.course = courseParam;
    }

    if (search) {
      query.$or = [
        { title:       { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { reason:      { $regex: search, $options: "i" } },
      ];
    }

    const archiveCol = db.collection<Archive>("archives");

    const [total, archives, stats] = await Promise.all([
      archiveCol.countDocuments(query),
      archiveCol.find(query).sort({ archivedAt: -1 }).skip(skip).limit(limit).toArray(),
      getArchiveStats(archiveCol),
    ]);

    return NextResponse.json({
      success: true,
      archives,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      stats,
    });
  } catch (error) {
    console.error("GET /api/archives error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── Stats via aggregation (avoids loading all docs into memory) ───────────────
async function getArchiveStats(archiveCol: Collection<Archive>): Promise<ArchiveStats> {
  const [row] = await archiveCol.aggregate([
    {
      $facet: {
        byType: [{ $group: { _id: "$type", count: { $sum: 1 } } }],
        byCourse: [{ $group: { _id: "$course", count: { $sum: 1 } } }],
        recent: [{
          $match: {
            archivedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        }, { $count: "count" }],
        total: [{ $count: "count" }],
      },
    },
  ]).toArray();

  const byType   = Object.fromEntries((row?.byType   ?? []).map((t: { _id: string; count: number }) => [t._id, t.count]));
  const byCourse = Object.fromEntries((row?.byCourse ?? []).map((c: { _id: string; count: number }) => [c._id, c.count]));

  return {
    totalArchived:    row?.total[0]?.count  ?? 0,
    recentlyArchived: row?.recent[0]?.count ?? 0,
    byType: {
      exam:      byType.exam      ?? 0,
      material:  byType.material  ?? 0,
      questions: byType.questions ?? 0,
      subject:   byType.subject   ?? 0,
      student:   byType.student   ?? 0,
      faculty:   byType.faculty   ?? 0,
    },
    byCourse: {
      BSABEN: byCourse.BSABEN ?? 0,
      BSGE:   byCourse.BSGE   ?? 0,
    },
  };
}