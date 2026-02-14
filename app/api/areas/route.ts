import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";
import { Area, Subject, Question } from "@/models/Questions";
import { User } from "@/models/User";

// ─── GET /api/areas ────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const course = searchParams.get("course");
    const search = searchParams.get("search");

    if (course !== "BSABEN") {
      return NextResponse.json({ error: "Areas are only available for BSABEN" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const areasCol = db.collection<Area>("areas");
    const subjectsCol = db.collection<Subject>("subjects");
    const questionsCol = db.collection<Question>("questions");

    const filter: Record<string, unknown> = { course: "BSABEN" };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const areas = await areasCol.find(filter).sort({ createdAt: -1 }).toArray();

    // Get counts for each area
    const areasWithCounts = await Promise.all(
      areas.map(async (area) => {
        const subjectCount = await subjectsCol.countDocuments({ 
          course: "BSABEN", 
          area: area.name 
        });
        const questionCount = await questionsCol.countDocuments({ 
          course: "BSABEN", 
          area: area.name 
        });

        return {
          _id: area._id?.toString(),
          name: area.name,
          description: area.description,
          subjectCount,
          questionCount,
          createdAt: area.createdAt.toISOString(),
        };
      })
    );

    return NextResponse.json({ areas: areasWithCounts });
  } catch (error) {
    console.error("GET /api/areas error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/areas ───────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, userId } = body;

    if (!name || !userId) {
      return NextResponse.json({ error: "Name and userId are required" }, { status: 400 });
    }

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const areasCol = db.collection<Area>("areas");
    const usersCol = db.collection<User>("users");

    const user = await usersCol.findOne({ _id: new ObjectId(userId) });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.role !== "admin" && user.role !== "faculty") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check for duplicate area name (case-insensitive)
    const existing = await areasCol.findOne({
      course: "BSABEN",
      name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    });

    if (existing) {
      return NextResponse.json({ error: "An area with this name already exists" }, { status: 409 });
    }

    const now = new Date();
    const newArea: Omit<Area, "_id"> = {
      name: name.trim(),
      description: description?.trim(),
      course: "BSABEN",
      createdBy: new ObjectId(userId),
      createdByName: user.name,
      createdAt: now,
      updatedAt: now,
    };

    const result = await areasCol.insertOne(newArea as Area);
    const created = await areasCol.findOne({ _id: result.insertedId });

    return NextResponse.json({ message: "Area created successfully", area: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/areas error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}