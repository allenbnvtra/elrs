import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";
import { Subject, CourseType } from "@/models/Questions";
import { User } from "@/models/User";

type Params = { params: Promise<{ id: string }> };

// ─── PUT /api/subjects/[id] ─────────────────────────────────────────────────
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid subject ID" }, { status: 400 });
    }

    const body = await request.json();
    const { userId, _id, createdBy, createdByName, createdAt, ...updates } = body;
    const { name, description, course, area } = updates;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const subjectsCol = db.collection<Subject>("subjects");
    const usersCol = db.collection<User>("users");

    // Check user authorization
    const user = await usersCol.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "admin" && user.role !== "faculty") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if subject exists
    const subject = await subjectsCol.findOne({ _id: new ObjectId(id) });
    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Validate course if provided
    if (course) {
      const validCourses: CourseType[] = ["BSABEN", "BSGE"];
      if (!validCourses.includes(course)) {
        return NextResponse.json({ error: "Invalid course" }, { status: 400 });
      }
    }

    const targetCourse = course || subject.course;

    // Validate area requirements
    if (targetCourse === "BSABEN" && area === undefined && !subject.area) {
      return NextResponse.json(
        { error: "Area is required for BSABEN subjects" },
        { status: 400 }
      );
    }

    if (targetCourse === "BSGE" && area) {
      return NextResponse.json(
        { error: "BSGE subjects should not have an area" },
        { status: 400 }
      );
    }

    // Check for duplicate name if name is being changed
    if (name && name !== subject.name) {
      const targetArea = area !== undefined ? area : subject.area;
      
      const duplicateFilter: any = {
        _id: { $ne: new ObjectId(id) },
        name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
        course: targetCourse,
      };

      // For BSABEN, check within the same area
      if (targetCourse === "BSABEN") {
        duplicateFilter.area = targetArea;
      }

      const duplicate = await subjectsCol.findOne(duplicateFilter);

      if (duplicate) {
        const errorMsg = targetCourse === "BSABEN"
          ? "A subject with this name already exists in this area."
          : "A subject with this name already exists for this course.";
        return NextResponse.json({ error: errorMsg }, { status: 409 });
      }
    }

    // Build update object - only include fields that should be updated
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || undefined;
    if (course !== undefined) updateData.course = course;
    
    // Handle area field
    if (targetCourse === "BSABEN") {
      if (area !== undefined) updateData.area = area;
    } else {
      // BSGE - remove area if it exists
      updateData.area = undefined;
    }

    const result = await subjectsCol.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" }
    );

    return NextResponse.json({
      message: "Subject updated successfully",
      subject: result,
    });
  } catch (error) {
    console.error("PUT /api/subjects/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE /api/subjects/[id] ──────────────────────────────────────────────
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid subject ID" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const subjectsCol = db.collection<Subject>("subjects");
    const questionsCol = db.collection("questions");
    const usersCol = db.collection<User>("users");

    // Check user authorization
    const user = await usersCol.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "admin" && user.role !== "faculty") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if subject exists
    const subject = await subjectsCol.findOne({ _id: new ObjectId(id) });
    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    // Check if there are questions associated with this subject
    // CRITICAL FIX: Filter by area for BSABEN subjects
    const questionFilter: any = {
      subject: subject.name,
      course: subject.course,
    };

    if (subject.course === "BSABEN" && subject.area) {
      questionFilter.area = subject.area;
    }

    const questionCount = await questionsCol.countDocuments(questionFilter);

    if (questionCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete subject. There are ${questionCount} question(s) associated with this subject. Please delete or reassign the questions first.`,
        },
        { status: 400 }
      );
    }

    const result = await subjectsCol.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Failed to delete subject" }, { status: 500 });
    }

    return NextResponse.json({
      message: "Subject deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/subjects/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}