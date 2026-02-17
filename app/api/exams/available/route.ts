import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise, { dbName } from "@/lib/mongodb";
import { Question, CourseType } from "@/models/Questions";
import { User } from "@/models/User";

// ─── GET /api/exams/available ──────────────────────────────────────────────────
// Returns available exam topics (subjects for BSGE, areas for BSABEN)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const course = searchParams.get("course") as CourseType | null;
    const userId = searchParams.get("userId");

    if (!course) {
      return NextResponse.json({ error: "Course is required" }, { status: 400 });
    }

    if (!userId || !ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Valid userId is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const questionsCol = db.collection<Question>("questions");
    const usersCol = db.collection<User>("users");

    // Verify user exists
    const user = await usersCol.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify user's course matches (only for students and faculty)
    if (user.role === "student" || user.role === "faculty") {
      if ("course" in user && user.course !== course) {
        return NextResponse.json({ error: "Course does not match user's enrolled course" }, { status: 403 });
      }
    }

    if (course === "BSGE") {
      // For BSGE: Get all subjects with their question counts
      const subjects = await questionsCol.aggregate([
        {
          $match: {
            course: "BSGE",
            isActive: true, // Only active questions
          },
        },
        {
          $group: {
            _id: "$subject",
            totalQuestions: { $sum: 1 },
            easyCount: {
              $sum: { $cond: [{ $eq: ["$difficulty", "Easy"] }, 1, 0] },
            },
            mediumCount: {
              $sum: { $cond: [{ $eq: ["$difficulty", "Medium"] }, 1, 0] },
            },
            hardCount: {
              $sum: { $cond: [{ $eq: ["$difficulty", "Hard"] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            subject: "$_id",
            totalQuestions: 1,
            easyCount: 1,
            mediumCount: 1,
            hardCount: 1,
          },
        },
        {
          $sort: { subject: 1 },
        },
      ]).toArray();

      return NextResponse.json({
        course: "BSGE",
        type: "subjects",
        data: subjects,
      });
    } else {
      // For BSABEN: Get all areas with their subjects and question counts
      const areas = await questionsCol.aggregate([
        {
          $match: {
            course: "BSABEN",
            isActive: true, // Only active questions
          },
        },
        {
          $group: {
            _id: {
              area: "$area",
              subject: "$subject",
            },
            totalQuestions: { $sum: 1 },
            easyCount: {
              $sum: { $cond: [{ $eq: ["$difficulty", "Easy"] }, 1, 0] },
            },
            mediumCount: {
              $sum: { $cond: [{ $eq: ["$difficulty", "Medium"] }, 1, 0] },
            },
            hardCount: {
              $sum: { $cond: [{ $eq: ["$difficulty", "Hard"] }, 1, 0] },
            },
          },
        },
        {
          $group: {
            _id: "$_id.area",
            subjects: {
              $push: {
                subject: "$_id.subject",
                totalQuestions: "$totalQuestions",
                easyCount: "$easyCount",
                mediumCount: "$mediumCount",
                hardCount: "$hardCount",
              },
            },
            totalQuestions: { $sum: "$totalQuestions" },
          },
        },
        {
          $project: {
            _id: 0,
            area: "$_id",
            subjects: 1,
            totalQuestions: 1,
          },
        },
        {
          $sort: { area: 1 },
        },
      ]).toArray();

      return NextResponse.json({
        course: "BSABEN",
        type: "areas",
        data: areas,
      });
    }
  } catch (error) {
    console.error("GET /api/exams/available error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}