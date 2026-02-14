import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import * as XLSX from "xlsx";
import clientPromise, { dbName } from "@/lib/mongodb";
import { Question, ImportRow, ImportResult, CourseType, DifficultyType, CorrectAnswer } from "@/models/Questions";
import { User } from "@/models/User";

const VALID_COURSES: CourseType[] = ["BSABEN", "BSGE"];
const VALID_DIFFICULTIES: DifficultyType[] = ["Easy", "Medium", "Hard"];
const VALID_ANSWERS: CorrectAnswer[] = ["A", "B", "C", "D"];
const MAX_ROWS = 500;

function normalizeText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

// Create a unique key for duplicate detection
// For BSABEN: course + area + subject + questionText
// For BSGE: course + subject + questionText
function createDuplicateKey(course: string, area: string | undefined, subject: string, questionText: string): string {
  if (course === "BSABEN") {
    return `${course.toUpperCase()}::${normalizeText(area || "")}::${normalizeText(subject)}::${normalizeText(questionText)}`;
  }
  return `${course.toUpperCase()}::${normalizeText(subject)}::${normalizeText(questionText)}`;
}

function validateRow(row: ImportRow, rowNum: number, course: CourseType): string | null {
  if (!row.question_text?.trim()) return `Row ${rowNum}: question_text is required`;
  if (!row.option_a?.trim()) return `Row ${rowNum}: option_a is required`;
  if (!row.option_b?.trim()) return `Row ${rowNum}: option_b is required`;

  const answer = String(row.correct_answer ?? "").trim().toUpperCase() as CorrectAnswer;
  if (!VALID_ANSWERS.includes(answer)) {
    return `Row ${rowNum}: correct_answer must be A, B, C, or D`;
  }

  const difficulty = row.difficulty?.trim() as DifficultyType;
  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    return `Row ${rowNum}: difficulty must be Easy, Medium, or Hard`;
  }

  if (!row.category?.trim()) return `Row ${rowNum}: category is required`;
  if (!row.subject?.trim()) return `Row ${rowNum}: subject is required`;

  // BSABEN requires area
  if (course === "BSABEN" && !row.area?.trim()) {
    return `Row ${rowNum}: area is required for BSABEN questions`;
  }

  // If answer is C or D, the corresponding option must exist
  if (answer === "C" && !row.option_c?.trim()) {
    return `Row ${rowNum}: option_c is required when correct_answer is C`;
  }
  if (answer === "D" && !row.option_d?.trim()) {
    return `Row ${rowNum}: option_d is required when correct_answer is D`;
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const userId = formData.get("userId") as string;
    const course = formData.get("course") as CourseType;

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
    if (!course) return NextResponse.json({ error: "course is required" }, { status: 400 });

    if (!VALID_COURSES.includes(course)) {
      return NextResponse.json({ error: "Invalid course. Must be BSABEN or BSGE." }, { status: 400 });
    }

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "xls") {
      return NextResponse.json({ error: "Only .xlsx or .xls files are accepted" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const questionsCol = db.collection<Question>("questions");
    const usersCol = db.collection<User>("users");

    // Auth check
    const user = await usersCol.findOne({ _id: new ObjectId(userId) });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.role !== "admin" && user.role !== "faculty") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Parse Excel
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
    const sheetName = workbook.SheetNames.find((n) => n.toLowerCase() !== "instructions");
    if (!sheetName) {
      return NextResponse.json({ error: "No valid sheet found in the workbook" }, { status: 400 });
    }

    const sheet = workbook.Sheets[sheetName];
    const rows: ImportRow[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (rows.length === 0) {
      return NextResponse.json({ error: "The file contains no data rows" }, { status: 400 });
    }
    if (rows.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `Too many rows. Maximum ${MAX_ROWS} questions per import.` },
        { status: 400 }
      );
    }

    const result: ImportResult = {
      imported: 0,
      skipped: 0,
      errors: [],
      duplicatesInFile: [],
      duplicatesInDb: [],
    };

    // Track seen questions in this file
    const seenInFile = new Map<string, number>();

    // Pre-load all existing questions from DB for this course
    const existingQuestions = await questionsCol
      .find({ course }, { projection: { course: 1, area: 1, subject: 1, questionText: 1 } })
      .toArray();

    // Build a Set of unique keys for fast duplicate lookup
    const existingKeys = new Set<string>(
      existingQuestions.map((q) =>
        createDuplicateKey(q.course, q.area, q.subject, q.questionText)
      )
    );

    const toInsert: Omit<Question, "_id">[] = [];
    const now = new Date();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel rows start at 2 (row 1 = headers)
      const rawText = String(row.question_text ?? "").trim();

      // Validation
      const validationError = validateRow(row, rowNum, course);
      if (validationError) {
        result.errors.push({ row: rowNum, reason: validationError, text: rawText });
        result.skipped++;
        continue;
      }

      const area = course === "BSABEN" ? String(row.area).trim() : undefined;
      const subject = String(row.subject).trim();
      const duplicateKey = createDuplicateKey(course, area, subject, rawText);

      // Duplicate within file
      if (seenInFile.has(duplicateKey)) {
        const displayText = course === "BSABEN" 
          ? `[${area}/${subject}] ${rawText.substring(0, 80)}`
          : `[${subject}] ${rawText.substring(0, 80)}`;
        result.duplicatesInFile.push({ row: rowNum, text: displayText });
        result.skipped++;
        continue;
      }

      // Duplicate in database
      if (existingKeys.has(duplicateKey)) {
        const displayText = course === "BSABEN" 
          ? `[${area}/${subject}] ${rawText.substring(0, 80)}`
          : `[${subject}] ${rawText.substring(0, 80)}`;
        result.duplicatesInDb.push({ row: rowNum, text: displayText });
        result.skipped++;
        continue;
      }

      seenInFile.set(duplicateKey, rowNum);
      existingKeys.add(duplicateKey);

      toInsert.push({
        questionText: rawText,
        optionA: String(row.option_a).trim(),
        optionB: String(row.option_b).trim(),
        optionC: row.option_c ? String(row.option_c).trim() : undefined,
        optionD: row.option_d ? String(row.option_d).trim() : undefined,
        correctAnswer: String(row.correct_answer).trim().toUpperCase() as CorrectAnswer,
        difficulty: row.difficulty.trim() as DifficultyType,
        category: String(row.category).trim(),
        course: course,
        area: area,  // NEW: Only set for BSABEN
        isActive: row.isActive,
        subject: subject,
        explanation: row.explanation ? String(row.explanation).trim() : undefined,
        createdBy: new ObjectId(userId),
        createdByName: user.name,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Bulk insert valid questions
    if (toInsert.length > 0) {
      await questionsCol.insertMany(toInsert as Question[]);
      result.imported = toInsert.length;
    }

    return NextResponse.json({
      message: `Import complete. ${result.imported} imported, ${result.skipped} skipped.`,
      result,
    });
  } catch (error) {
    console.error("POST /api/questions/import error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}