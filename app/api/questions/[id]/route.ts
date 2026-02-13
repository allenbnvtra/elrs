import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";
import { Question, CourseType, DifficultyType, CorrectAnswer } from "@/models/Questions";
import { User } from "@/models/User";

type Params = { params: Promise<{ id: string }> };

// ─── PUT /api/questions/[id] ───────────────────────────────────────────────────
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params; // ← await params here
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid question ID" }, { status: 400 });
    }

    const body = await request.json();
    const { userId, ...updates } = body;

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
    const validCourses: CourseType[] = ["BSABE", "BSGE"];
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

    // Duplicate check if questionText changed
    if (updates.questionText && updates.questionText !== question.questionText) {
      const duplicate = await questionsCol.findOne({
        _id: { $ne: new ObjectId(id) },
        questionText: {
          $regex: `^${updates.questionText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          $options: "i",
        },
      });
      if (duplicate) {
        return NextResponse.json({ error: "A question with this text already exists." }, { status: 409 });
      }
    }

    const result = await questionsCol.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } },
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
    const { id } = await params; // ← await params here
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
    const usersCol = db.collection<User>("users");

    const user = await usersCol.findOne({ _id: new ObjectId(userId) });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.role !== "admin" && user.role !== "faculty") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const result = await questionsCol.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/questions/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}