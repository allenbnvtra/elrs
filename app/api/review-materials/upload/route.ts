import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";
import { ReviewMaterial, MaterialType, CourseType } from "@/models/ReviewMaterials";
import { User } from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const type = formData.get("type") as MaterialType;
    const course = formData.get("course") as CourseType;
    const area = formData.get("area") as string;
    const subject = formData.get("subject") as string;
    const videoUrl = formData.get("videoUrl") as string;
    const videoDuration = formData.get("videoDuration") as string;
    const userId = formData.get("userId") as string;
    const pdfFile = formData.get("file") as File | null;

    console.log("📝 Upload request received:", { title, type, course, area, subject });

    // Validation
    if (!title || !type || !course || !area || !subject || !userId) {
      return NextResponse.json(
        { error: "Missing required fields (title, type, course, area, subject, userId)" },
        { status: 400 }
      );
    }

    // Validate type
    if (type !== "document" && type !== "video") {
      return NextResponse.json(
        { error: "Invalid material type" },
        { status: 400 }
      );
    }

    // Validate course
    if (course !== "BSGE" && course !== "BSABEN") {
      return NextResponse.json(
        { error: "Invalid course" },
        { status: 400 }
      );
    }

    // Connect to database
    const client = await clientPromise;
    const db = client.db(dbName);
    const materialsCollection = db.collection<ReviewMaterial>("reviewMaterials");
    const usersCollection = db.collection<User>("users");

    // Get user info
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Permission check
    if (user.role === "faculty") {
      // Faculty can only upload to their assigned course
      if (user.course !== course) {
        return NextResponse.json(
          { error: `You can only upload materials for ${user.course}` },
          { status: 403 }
        );
      }
    } else if (user.role !== "admin") {
      // Only admin and faculty can upload
      return NextResponse.json(
        { error: "Unauthorized. Only admins and faculty can upload materials." },
        { status: 403 }
      );
    }

    const now = new Date();
    let newMaterial: Omit<ReviewMaterial, "_id">;

    if (type === "video") {
      // Video material - just a link
      if (!videoUrl) {
        return NextResponse.json(
          { error: "Video URL is required for video materials" },
          { status: 400 }
        );
      }

      // Validate video URL
      const urlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|drive\.google\.com)/i;
      if (!urlRegex.test(videoUrl)) {
        return NextResponse.json(
          { error: "Please provide a valid video URL (YouTube, Vimeo, Google Drive, etc.)" },
          { status: 400 }
        );
      }

      newMaterial = {
        title,
        description: description || undefined,
        type: "video",
        course,
        area,
        subject,
        videoUrl,
        videoDuration: videoDuration || "00:00",
        uploadedBy: new ObjectId(userId),
        uploadedByName: user.name,
        uploadedByRole: user.role,
        createdAt: now,
        updatedAt: now,
      };
    } else {
      // Document material - PDF file
      if (!pdfFile) {
        return NextResponse.json(
          { error: "PDF file is required for document materials" },
          { status: 400 }
        );
      }

      // Validate file type
      if (pdfFile.type !== "application/pdf") {
        return NextResponse.json(
          { error: "Only PDF files are allowed" },
          { status: 400 }
        );
      }

      // Validate file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (pdfFile.size > maxSize) {
        return NextResponse.json(
          { error: "File size exceeds 50MB limit" },
          { status: 400 }
        );
      }

      // Convert file to base64 for storage (in production, use cloud storage like AWS S3, Google Cloud Storage, etc.)
      const bytes = await pdfFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString("base64");
      const fileUrl = `data:application/pdf;base64,${base64}`;

      newMaterial = {
        title,
        description: description || undefined,
        type: "document",
        course,
        area,
        subject,
        fileUrl,
        fileName: pdfFile.name,
        fileSize: pdfFile.size,
        uploadedBy: new ObjectId(userId),
        uploadedByName: user.name,
        uploadedByRole: user.role,
        createdAt: now,
        updatedAt: now,
      };
    }

    // Insert material into database
    console.log("💾 Inserting material into database...");
    const result = await materialsCollection.insertOne(newMaterial as any);
    console.log("✅ Material inserted with ID:", result.insertedId);

    // Fetch the created material
    const createdMaterial = await materialsCollection.findOne({ _id: result.insertedId });

    return NextResponse.json(
      {
        message: "Material uploaded successfully",
        material: createdMaterial,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("❌ Upload error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" 
          ? error instanceof Error ? error.message : "Unknown error"
          : undefined
      },
      { status: 500 }
    );
  }
}