import { NextRequest, NextResponse } from "next/server";
import clientPromise, { dbName } from "@/lib/mongodb";
import { ReviewMaterial } from "@/models/ReviewMaterials";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const course = searchParams.get("course");
    const type = searchParams.get("type");
    const area = searchParams.get("area");
    const subject = searchParams.get("subject");

    // Connect to database
    const client = await clientPromise;
    const db = client.db(dbName);
    const materialsCollection = db.collection<ReviewMaterial>("reviewMaterials");

    // Build query
    const query: any = {};
    if (course) query.course = course;
    if (type && type !== "all") query.type = type;
    if (area && area !== "all") query.area = area;
    if (subject && subject !== "all") query.subject = subject;

    // Fetch materials
    const materials = await materialsCollection
      .find(query)
      .sort({ area: 1, subject: 1, createdAt: -1 })
      .toArray();

    return NextResponse.json({
      materials,
      count: materials.length,
    });

  } catch (error) {
    console.error("❌ Fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}