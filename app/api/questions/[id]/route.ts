import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";
import { Question, CourseType, DifficultyType, CorrectAnswer } from "@/models/Questions";
import { Archive } from "@/models/Archive";
import { User } from "@/models/User";

type Params = { params: Promise<{ id: string }> };

// ─── PUT /api/questions/[id] ───────────────────────────────────────────────────
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid question ID" }, { status: 400 });
    }

    const body = await request.json();
    const { userId, _id, createdBy, createdByName, createdAt, ...updates } = body;

    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid userId — must be a valid MongoDB ObjectId." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const questionsCol = db.collection<Question>("questions");
    const usersCol = db.collection<User>("users");

    const user = await usersCol.findOne({ _id: new ObjectId(userId) });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.role !== "admin" && user.role !== "faculty") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const question = await questionsCol.findOne({ _id: new ObjectId(id) });
    if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });

    // Validate updated fields if provided
    const validCourses: CourseType[] = ["BSABEN", "BSGE"];
    const validDifficulties: DifficultyType[] = ["Easy", "Medium", "Hard"];
    const validAnswers: CorrectAnswer[] = ["A", "B", "C", "D"];

    if (updates.course && !validCourses.includes(updates.course)) {
      return NextResponse.json({ error: "Invalid course" }, { status: 400 });
    }
    if (updates.difficulty && !validDifficulties.includes(updates.difficulty)) {
      return NextResponse.json({ error: "Invalid difficulty" }, { status: 400 });
    }
    if (updates.correctAnswer && !validAnswers.includes(updates.correctAnswer)) {
      return NextResponse.json({ error: "Invalid correct answer" }, { status: 400 });
    }

    // Validate isActive if provided
    if (updates.isActive !== undefined && typeof updates.isActive !== 'boolean') {
      return NextResponse.json({ error: "isActive must be a boolean" }, { status: 400 });
    }

    // Duplicate check if questionText changed
    if (updates.questionText && updates.questionText !== question.questionText) {
      const duplicateFilter: any = {
        _id: { $ne: new ObjectId(id) },
        questionText: {
          $regex: `^${updates.questionText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          $options: "i",
        },
        course: updates.course || question.course,
      };

      // For BSABEN, check within same area and subject
      if ((updates.course || question.course) === "BSABEN") {
        duplicateFilter.area = updates.area || question.area;
        duplicateFilter.subject = updates.subject || question.subject;
      } else {
        duplicateFilter.subject = updates.subject || question.subject;
      }

      const duplicate = await questionsCol.findOne(duplicateFilter);
      if (duplicate) {
        return NextResponse.json({ error: "A question with this text already exists in this area/subject." }, { status: 409 });
      }
    }

    // Prepare update data - only include fields that should be updated
    const updateData: any = {
      updatedAt: new Date()
    };

    // Only update fields that are present in the updates object
    const allowedFields = [
      'questionText', 'optionA', 'optionB', 'optionC', 'optionD',
      'correctAnswer', 'difficulty', 'category', 'course', 'area',
      'subject', 'explanation', 'isActive'
    ];

    for (const field of allowedFields) {
      if (field in updates) {
        updateData[field] = updates[field];
      }
    }

    // Handle optional fields - convert empty strings to undefined
    if (updateData.optionC === "") updateData.optionC = undefined;
    if (updateData.optionD === "") updateData.optionD = undefined;
    if (updateData.explanation === "") updateData.explanation = undefined;

    const result = await questionsCol.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" }
    );

    return NextResponse.json({ message: "Question updated", question: result });
  } catch (error) {
    console.error("PUT /api/questions/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE /api/questions/[id] ───────────────────────────────────────────────
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid question ID" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid userId — must be a valid MongoDB ObjectId." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const questionsCol = db.collection<Question>("questions");
    const usersCol     = db.collection<User>("users");
    const archivesCol  = db.collection<Archive>("archives");

    const [user, question] = await Promise.all([
      usersCol.findOne({ _id: new ObjectId(userId) }),
      questionsCol.findOne({ _id: new ObjectId(id) }),
    ]);

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.role !== "admin" && user.role !== "faculty") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });

    // Archive before deleting
    const now = new Date();
    const archiveEntry: Archive = {
      type:               "questions",
      title:              question.questionText?.slice(0, 120) ?? "Untitled Question",
      course:             question.course,
      originalId:         new ObjectId(id),
      originalCollection: "questions",
      archivedBy:         new ObjectId(userId),
      archivedByName:     user.name,
      archivedByRole:     user.role,
      archivedAt:         now,
      reason:             "Deleted by user",
      originalData:       question,
      canRestore:         true,
      createdAt:          now,
      updatedAt:          now,
    };

    await archivesCol.insertOne(archiveEntry);
    await questionsCol.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ message: "Question archived and deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/questions/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}